import fs from 'fs/promises';
import path from 'path';
import stringify from 'json-stable-stringify';

import {
    HttpServer,
    allowOrigins,
    parseBodyJSON,
    parseBodyText,
    RequestHandler,
    ParamsValidatorHandler,
    RequestWithParams,
    Response,
} from '@trezor/node-utils';
import { Descriptor, PathPublic, Session } from '@trezor/transport/src/types';
import { validateProtocolMessage } from '@trezor/transport/src/utils/bridgeProtocolMessage';
import { Log, arrayPartition, Throttler } from '@trezor/utils';
import { AbstractApi } from '@trezor/transport/src/api/abstract';
import { UNEXPECTED_ERROR } from '@trezor/transport/src/errors';

import { createCore } from './core';

const defaults = {
    port: 21325,
};

const str = (value: Record<string, any> | string) =>
    typeof value === 'string' ? value : JSON.stringify(value);

const validateDescriptorsJSON: RequestHandler<JSON, Descriptor[]> = (request, response, next) => {
    if (Array.isArray(request.body)) {
        next({ ...request, body: request.body }, response);
    } else {
        response.statusCode = 400;
        response.end(str({ error: 'Invalid body' }));
    }
};

const validateAcquireParams: ParamsValidatorHandler<{
    path: PathPublic;
    previous: Session | 'null';
}> = (request, response, next) => {
    if (
        typeof request.params.path === 'string' &&
        /^[1-9][0-9]*$/.test(request.params.path) &&
        typeof request.params.previous === 'string' &&
        /^\d+$|^null$/.test(request.params.previous)
    ) {
        next(request as Parameters<typeof next>[0], response);
    } else {
        response.statusCode = 400;
        response.end(str({ error: 'Invalid params' }));
    }
};

const validateSessionParams: ParamsValidatorHandler<{
    session: Session;
}> = (request, response, next) => {
    if (typeof request.params.session === 'string' && /^\d+$/.test(request.params.session)) {
        next(request as Parameters<typeof next>[0], response);
    } else {
        response.statusCode = 400;
        response.end(str({ error: 'Invalid params' }));
    }
};

const validateProtocolMessageBody =
    (
        withData: boolean,
        protocolMessages: boolean,
    ): RequestHandler<string, ReturnType<typeof validateProtocolMessage>> =>
    (request, response, next) => {
        try {
            const body = validateProtocolMessage(request.body, withData);
            if (!protocolMessages && body.protocol) {
                throw new Error('BridgeProtocolMessage support is disabled');
            }

            return next({ ...request, body }, response);
        } catch (error) {
            response.statusCode = 400;
            response.end(str({ error: UNEXPECTED_ERROR, message: error.message }));
        }
    };

export class TrezordNode {
    /** versioning, baked in by webpack */
    version = '3.0.0';
    serviceName = 'trezord-node';
    /** last known descriptors state */
    descriptors: Descriptor[];
    /** pending /listen subscriptions that are supposed to be resolved whenever descriptors change is detected */
    listenSubscriptions: {
        descriptors: Descriptor[];
        req: Parameters<RequestHandler<unknown, unknown>>[0];
        res: Response;
    }[];
    port: number;
    server?: HttpServer<never>;
    core: ReturnType<typeof createCore>;
    logger: Log;
    assetPrefix: string;
    protocolMessages: boolean;
    throttler = new Throttler(500);

    constructor({
        port,
        api,
        assetPrefix = '',
        logger,
        protocolMessages,
        bundledVersion,
    }: {
        port: number;
        api: 'usb' | 'udp' | AbstractApi;
        assetPrefix?: string;
        logger: Log;
        protocolMessages?: boolean;
        bundledVersion?: string;
    }) {
        this.port = port || defaults.port;
        this.logger = logger;
        this.descriptors = [];
        if (bundledVersion) {
            this.version = `${this.version}-bundled.${bundledVersion}`;
        }

        this.listenSubscriptions = [];

        this.core = createCore(api, this.logger);

        this.assetPrefix = assetPrefix;
        this.protocolMessages = protocolMessages ?? true;
    }

    private checkAffectedSubscriptions() {
        const [aborted, notAborted] = arrayPartition(
            this.listenSubscriptions,
            subscription => subscription.res.destroyed,
        );

        if (aborted.length) {
            this.logger?.debug(
                `http: resolving listen subscriptions. n of aborted subscriptions: ${aborted.length}`,
            );
        }

        const [affected, unaffected] = arrayPartition(
            notAborted,
            subscription => stringify(subscription.descriptors) !== stringify(this.descriptors),
        );

        this.logger?.debug(
            `http: affected subscriptions ${affected.length}. unaffected subscriptions ${unaffected.length}`,
        );

        affected.forEach(subscription => {
            subscription.res.end(str(this.descriptors));
        });
        this.listenSubscriptions = unaffected;
    }

    private resolveListenSubscriptions(nextDescriptors: Descriptor[]) {
        this.descriptors = nextDescriptors;

        if (!this.listenSubscriptions.length) {
            return;
        }

        this.checkAffectedSubscriptions();
    }

    private createAbortSignal(res: Response) {
        const abortController = new AbortController();
        const listener = () => {
            abortController.abort();
            res.removeListener('close', listener);
        };
        res.addListener('close', listener);

        return abortController.signal;
    }

    private handleInfo(_req: RequestWithParams, res: Response) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(
            str({
                version: this.version,
                protocolMessages: this.protocolMessages,
            }),
        );
    }

    public start() {
        // whenever sessions module reports changes to descriptors (including sessions), resolve affected /listen subscriptions
        this.core.sessionsClient.on('descriptors', descriptors => {
            this.logger?.debug(
                `http: sessionsClient reported descriptors: ${JSON.stringify(descriptors)}`,
            );
            this.throttler.throttle('resolve-listen-subscriptions', () =>
                this.resolveListenSubscriptions(descriptors),
            );
        });

        return new Promise<void>((resolve, reject) => {
            this.logger.info('Starting Trezor Bridge HTTP server');
            const app = new HttpServer({
                port: this.port,
                logger: this.logger,
            });

            app.use([
                (req, res, next, context) => {
                    // directly navigating to status page of bridge in browser. when request is not issued by js, there is no origin header
                    if (
                        !req.headers.origin &&
                        req.headers.host &&
                        [`127.0.0.1:${this.port}`, `localhost:${this.port}`].includes(
                            req.headers.host,
                        )
                    ) {
                        next(req, res);
                    } else {
                        allowOrigins([
                            'https://sldev.cz',
                            'https://trezor.io',
                            'http://localhost',
                            // When using Tor it will send string "null" as default, and it will not allow calling to localhost.
                            // To allow it to be sent, you can go to about:config and set the attributes below:
                            // "network.http.referer.hideOnionSource - false"
                            // "network.proxy.allow_hijacking_localhost - false"
                            'http://suite.trezoriovpjcahpzkrewelclulmszwbqpzmzgub37gbcjlvluxtruqad.onion',
                        ])(req, res, next, context);
                    }
                },
            ]);

            // origin was checked in previous app.use. if it didn't not satisfy the check, it did not move on to this handler
            app.use([
                (req, res, next) => {
                    if (req.headers.origin) {
                        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                    }
                    next(req, res);
                },
            ]);

            app.post('/enumerate', [
                (_req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    const signal = this.createAbortSignal(res);
                    this.core.enumerate({ signal }).then(result => {
                        if (!result.success) {
                            res.statusCode = 400;

                            return res.end(str({ error: result.error, message: result.message }));
                        }
                        res.end(str(result.payload.descriptors));
                    });
                },
            ]);

            app.post('/listen', [
                parseBodyJSON,
                validateDescriptorsJSON,
                (req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    this.listenSubscriptions.push({
                        descriptors: req.body,
                        req,
                        res,
                    });
                    this.checkAffectedSubscriptions();
                },
            ]);

            app.post('/acquire/:path/:previous', [
                parseBodyJSON,
                validateAcquireParams,
                (req, res) => {
                    res.setHeader('Content-Type', 'text/plain');
                    const signal = this.createAbortSignal(res);
                    this.core
                        .acquire({
                            path: req.params.path,
                            previous: req.params.previous,
                            // @ts-expect-error
                            sessionOwner: req?.body?.sessionOwner,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.end(str({ session: result.payload.session }));
                        });
                },
            ]);

            app.post('/release/:session', [
                validateSessionParams,
                parseBodyText,
                (req, res) => {
                    this.core
                        .release({
                            session: req.params.session,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.end(str({ session: req.params.session }));
                        });
                },
            ]);

            app.post('/call/:session', [
                validateSessionParams,
                parseBodyText,
                validateProtocolMessageBody(true, this.protocolMessages),
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.core
                        .call({
                            ...req.body,
                            session: req.params.session,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.end(str(result.payload));
                        });
                },
            ]);

            app.post('/read/:session', [
                validateSessionParams,
                parseBodyText,
                validateProtocolMessageBody(false, this.protocolMessages),
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.core
                        .receive({
                            ...req.body,
                            session: req.params.session,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.end(str(result.payload));
                        });
                },
            ]);

            app.post('/post/:session', [
                validateSessionParams,
                parseBodyText,
                validateProtocolMessageBody(true, this.protocolMessages),
                (req, res) => {
                    const signal = this.createAbortSignal(res);
                    this.core
                        .send({
                            ...req.body,
                            session: req.params.session,
                            signal,
                        })
                        .then(result => {
                            if (!result.success) {
                                res.statusCode = 400;

                                return res.end(
                                    str({ error: result.error, message: result.message }),
                                );
                            }
                            res.end(str(result.payload));
                        });
                },
            ]);

            app.get('/', [
                (_req, res) => {
                    res.writeHead(301, {
                        Location: `http://127.0.0.1:${this.port}/status`,
                    });
                    res.end();
                },
            ]);

            app.get('/status', [
                async (_req, res) => {
                    try {
                        const ui = await fs.readFile(
                            path.join(__dirname, this.assetPrefix, 'ui/index.html'),
                            'utf-8',
                        );

                        res.writeHead(200, { 'Content-Type': 'text/html' });

                        res.end(ui);
                    } catch (error) {
                        this.logger.error('Failed to fetch status page', error);
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        // you need to run yarn workspace @trezor/transport-bridge build:ui to make it available (or build:lib will do)
                        res.end('Failed to fetch status page');
                    }
                },
            ]);

            app.get('/status-data', [
                async (_req, res) => {
                    const signal = this.createAbortSignal(res);
                    await this.core.enumerate({ signal });
                    const props = {
                        intro: `To download full logs go to http://127.0.0.1:${this.port}/logs`,
                        version: this.version,
                        devices: this.descriptors,
                        logs: this.logger.getLog(),
                    };

                    res.end(str(props));
                },
            ]);

            app.get('/ui', [
                (req, res) => {
                    const parsedUrl = new URL(req.url, `http://${req.headers.host}/`);

                    const pathname = path.join(__dirname, this.assetPrefix, parsedUrl.pathname);

                    const map: Record<string, string> = {
                        '.ico': 'image/x-icon',
                        '.html': 'text/html',
                        '.js': 'text/javascript',
                        '.json': 'application/json',
                        '.css': 'text/css',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.svg': 'image/svg+xml',
                    };

                    const { ext } = path.parse(pathname);
                    fs.stat(pathname)
                        .then(() => fs.readFile(pathname))
                        .then(data => {
                            res.setHeader('Content-type', map[ext] || 'text/plain');
                            res.end(data);
                        })
                        .catch(err => {
                            this.logger.error('Failed to fetch UI', err);
                            res.statusCode = 404;
                            res.end(`File ${pathname} not found!`);
                        });
                },
            ]);

            app.get('/logs', [
                (_req, res) => {
                    res.writeHead(200, {
                        'Content-Type': 'text/plain',
                        'Content-Disposition': 'attachment; filename=trezor-bridge.txt',
                    });
                    res.end(
                        app.logger
                            .getLog()
                            .map(l => l.message.join('. '))
                            .join('.\n'),
                    );
                },
            ]);

            app.post('/', [this.handleInfo.bind(this)]);

            app.post('/configure', [this.handleInfo.bind(this)]);

            app.start()
                .then(() => {
                    this.server = app;
                    resolve();
                })
                .catch(reject);
        });
    }

    public stop() {
        // send empty descriptors (imitate that all devices have disconnected)
        this.resolveListenSubscriptions([]);
        this.throttler.dispose();
        this.core.dispose();

        return this.server?.stop();
    }

    public async status() {
        const running = await fetch(`http://127.0.0.1:${this.port}/`)
            .then(resp => resp.ok)
            .catch(() => false);

        return {
            service: running,
            process: running,
        };
    }

    // compatibility with "BridgeProcess" type
    public startDev() {
        return this.start();
    }

    // compatibility with "BridgeProcess" type
    public startTest() {
        return this.start();
    }
}
