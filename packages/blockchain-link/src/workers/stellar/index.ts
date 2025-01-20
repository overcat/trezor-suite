import { Horizon, Transaction as StellarTransaction, Networks } from '@stellar/stellar-sdk';

import * as utils from '@trezor/blockchain-link-utils/src/stellar';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { CustomError } from '@trezor/blockchain-link-types/src/constants/errors';
import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types/src/constants';
import type { Response, AccountInfo, SubscriptionAccountInfo } from '@trezor/blockchain-link-types';
import type * as MessageTypes from '@trezor/blockchain-link-types/src/messages';
import { getSuiteVersion } from '@trezor/env-utils';

import { BaseWorker, CONTEXT, ContextType } from '../baseWorker';

type Context = ContextType<Horizon.Server>;
type Request<T> = T & Context;

const getInfo = async (request: Request<MessageTypes.GetInfo>, isTestnet: boolean) => {
    const api = await request.connect();
    const horizonServerInfo = await api.root();
    const latestLedgerInfo = await api.ledgers().order('desc').limit(1).call();

    if (latestLedgerInfo.records.length === 0) {
        throw new CustomError('worker_invalid_horizon_response');
    }

    const serverInfo = {
        url: api.serverURL.toString(),
        name: 'Stellar',
        shortcut: 'xlm',
        testnet: isTestnet,
        version: horizonServerInfo.horizon_version,
        decimals: 7,
        blockHeight: latestLedgerInfo.records[0].sequence,
        blockHash: latestLedgerInfo.records[0].hash,
    };

    return {
        type: RESPONSES.GET_INFO,
        payload: { ...serverInfo },
    } as const;
};

const getAccountInfo = async (request: Request<MessageTypes.GetAccountInfo>) => {
    const { payload } = request;

    // initial state (basic)
    const account: AccountInfo = {
        descriptor: payload.descriptor,
        balance: '0', // default balance
        availableBalance: '0', // default balance
        empty: true,
        // tokens: [], // Let's consider implementing it later; for now, we only need to support the native token (XLM).
        history: {
            // default history
            total: -1,
            unconfirmed: 0,
            transactions: undefined,
        },
        misc: {
            // default misc
            stellarSequence: '0',
            reserve: utils.MINIMUM_RESERVE.toString(),
        },
    };

    const api = await request.connect();
    let info;
    try {
        info = await api.accounts().accountId(payload.descriptor).call();
    } catch {
        // TODO(stellar): handle errors, if not 404, raise an exception?
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    // Account is not empty, we can fill the account object with the data
    const reserve = utils.calculateReserve(info.subentry_count);
    account.misc = {
        stellarSequence: info.sequence,
        reserve: reserve.toString(),
    };
    const native_token_balance = info.balances.find(balance => balance.asset_type === 'native');
    if (!native_token_balance) {
        // This should never happen, but just in case
        throw new CustomError('stellar_missing_native_balance');
    }
    const selling_liabilities = utils.toStroops(native_token_balance.selling_liabilities);
    account.balance = utils.toStroops(native_token_balance.balance);
    account.availableBalance = new BigNumber(account.balance)
        .minus(reserve)
        .minus(selling_liabilities)
        .toString();
    account.empty = false;

    if (payload.details !== 'txs') {
        return {
            type: RESPONSES.GET_ACCOUNT_INFO,
            payload: account,
        } as const;
    }

    // Fetch payment history
    const requestBuiler = await api
        .payments()
        .forAccount(payload.descriptor)
        .limit(payload.pageSize || 20)
        .order('desc')
        .join('transactions');
    if (payload.page != 1 && payload.stellarCursor) {
        requestBuiler.cursor(payload.stellarCursor);
    }
    const payments = await requestBuiler.call();

    const cursor = payments.records[payments.records.length - 1]?.paging_token;
    account.history.transactions = await Promise.all(
        payments.records.map(record => utils.transformTransaction(record, payload.descriptor)),
    );

    return {
        type: RESPONSES.GET_ACCOUNT_INFO,
        payload: {
            ...account,
            stellarCursor: cursor,
        },
    } as const;
};

const estimateFee = async (request: Request<MessageTypes.EstimateFee>) => {
    const api = await request.connect();
    const feeStats = await api.feeStats();

    // We are using p70 as a fee estimation
    // https://developers.stellar.org/docs/data/horizon/api-reference/aggregations/fee-stats/object
    const stroops = feeStats.fee_charged.p70;

    const payload =
        request.payload && Array.isArray(request.payload.blocks)
            ? request.payload.blocks.map(() => ({ feePerUnit: stroops }))
            : [{ feePerUnit: stroops }];

    return {
        type: RESPONSES.ESTIMATE_FEE,
        payload,
    } as const;
};

const subscribeBlock = async ({ state, connect, post }: Context) => {
    if (state.getSubscription('block')) return { subscribed: true };

    const api = await connect();

    const es = api
        .ledgers()
        .cursor('now')
        .stream({
            onmessage: (ledger: Horizon.ServerApi.LedgerRecord) => {
                post({
                    id: -1,
                    type: RESPONSES.NOTIFICATION,
                    payload: {
                        type: 'block',
                        payload: {
                            blockHeight: Number(ledger.sequence),
                            blockHash: ledger.hash,
                        },
                    },
                });
            },
        });

    state.addSubscription('block', es);

    return { subscribed: true };
};

const unsubscribeBlock = ({ state }: Context) => {
    if (!state.getSubscription('block')) return;
    const es = state.getSubscription('block') as () => void; // To stop listening for new events call the function returned by this method.
    es();
    state.removeSubscription('block');
};

const addPaymentListener = async (context: Context, address: string): Promise<() => void> => {
    const { connect } = context;
    const api = await connect();

    const es = api
        .payments()
        .forAccount(address)
        .cursor('now')
        .stream({
            onmessage: async (record: utils.PaymentOperationRecord) => {
                context.post({
                    id: -1,
                    type: RESPONSES.NOTIFICATION,
                    payload: {
                        type: 'notification',
                        payload: {
                            descriptor: address,
                            tx: await utils.transformTransaction(record),
                        },
                    },
                });
            },
        });

    return es;
};

const subscribeAccounts = async (context: Context, accounts: SubscriptionAccountInfo[]) => {
    const { state } = context;
    const subscribedAccounts = state.getAccounts();
    const newAccounts = accounts.filter(
        acc => !subscribedAccounts.find(a => a.descriptor === acc.descriptor),
    );

    for (const account of newAccounts) {
        const es = await addPaymentListener(context, account.descriptor);
        state.addSubscription(`account:${account.descriptor}`, es);
        state.addAccounts([account]);
    }

    return { subscribed: newAccounts.length > 0 };
};

const unsubscribeAccounts = ({ state }: Context, accounts?: SubscriptionAccountInfo[]) => {
    if (!accounts) {
        // remove all accounts
        accounts = state.getAccounts();
    }
    for (const account of accounts) {
        const es = state.getSubscription(`account:${account.descriptor}`) as () => void;
        if (es) {
            es();
            state.removeSubscription(`account:${account.descriptor}`);
        }
        state.removeAccounts([account]);
    }
};

const subscribeAddresses = async (context: Context, addresses: string[]) => {
    const { state } = context;
    const subscribedAddresses = state.getAddresses();
    const newAddresses = addresses.filter(addr => !subscribedAddresses.includes(addr));
    for (const address of newAddresses) {
        const es = await addPaymentListener(context, address);
        state.addSubscription(`address:${address}`, es);
        state.addAddresses([address]);
    }

    return { subscribed: newAddresses.length > 0 };
};

const unsubscribeAddresses = ({ state }: Context, addresses?: string[]) => {
    if (!addresses) {
        // remove all addresses
        addresses = state.getAddresses();
    }

    for (const address of addresses) {
        const es = state.getSubscription(`address:${address}`) as () => void;
        if (es) {
            es();
            state.removeSubscription(`address:${address}`);
        }
        state.removeAddresses([address]);
    }
};

const subscribe = async (request: Request<MessageTypes.Subscribe>) => {
    let response: { subscribed: boolean };
    switch (request.payload.type) {
        case 'block':
            response = await subscribeBlock(request);
            break;
        case 'accounts':
            response = await subscribeAccounts(request, request.payload.accounts);
            break;
        case 'addresses':
            response = await subscribeAddresses(request, request.payload.addresses);
            break;
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }

    return {
        type: RESPONSES.SUBSCRIBE,
        payload: response,
    } as const;
};

const unsubscribe = (request: Request<MessageTypes.Unsubscribe>) => {
    switch (request.payload.type) {
        case 'block':
            unsubscribeBlock(request);
            break;
        case 'accounts':
            unsubscribeAccounts(request, request.payload.accounts);
            break;
        case 'addresses':
            unsubscribeAddresses(request, request.payload.addresses);
            break;
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }

    return {
        type: RESPONSES.UNSUBSCRIBE,
        payload: { subscribed: request.state.getAccounts().length > 0 },
    } as const;
};

const pushTransaction = async ({ connect, payload }: Request<MessageTypes.PushTransaction>) => {
    const api = await connect();
    const base64EncodedTx = Buffer.from(payload, 'hex').toString('base64');
    const parsedTx = new StellarTransaction(base64EncodedTx, Networks.PUBLIC);
    try {
        // TODO(stellar): send the transaction asynchronously?
        const resp = await api.submitTransaction(parsedTx);

        return {
            type: RESPONSES.PUSH_TRANSACTION,
            payload: resp.hash,
        } as const;
    } catch (error) {
        console.error(error);
        throw new Error("Transaction wasn't successful");
    }
};

const onRequest = (request: Request<MessageTypes.Message>, isTestnet: boolean) => {
    switch (request.type) {
        case MESSAGES.GET_INFO:
            return getInfo(request, isTestnet);
        case MESSAGES.GET_ACCOUNT_INFO:
            return getAccountInfo(request);
        case MESSAGES.ESTIMATE_FEE:
            return estimateFee(request);
        case MESSAGES.PUSH_TRANSACTION:
            return pushTransaction(request);
        case MESSAGES.SUBSCRIBE:
            return subscribe(request);
        case MESSAGES.UNSUBSCRIBE:
            return unsubscribe(request);
        default:
            throw new CustomError('worker_unknown_request', `+${request.type}`);
    }
};

class StellarWorker extends BaseWorker<Horizon.Server> {
    private isTestnet = false;

    protected isConnected(api: Horizon.Server | undefined): api is Horizon.Server {
        return !!api;
    }

    async tryConnect(url: string): Promise<Horizon.Server> {
        const api = new Horizon.Server(url, {
            appName: 'trezor-suite',
            appVersion: getSuiteVersion(),
        });

        if ((await api.root()).network_passphrase == Networks.TESTNET) {
            this.isTestnet = true;
        }

        return api;
    }

    disconnect() {
        if (!this.api) {
            return;
        }

        // unsubscribe from all subscriptions
        unsubscribeAccounts(this, undefined);
        unsubscribeAddresses(this, undefined);
        unsubscribeBlock(this);

        this.api = undefined;
    }

    async messageHandler(event: { data: MessageTypes.Message }) {
        try {
            // skip processed messages
            if (await super.messageHandler(event)) return true;

            const request: Request<MessageTypes.Message> = {
                ...event.data,
                connect: () => this.connect(),
                post: (data: Response) => this.post(data),
                state: this.state,
            };

            const response = await onRequest(request, this.isTestnet);
            this.post({ id: event.data.id, ...response });
        } catch (error) {
            this.errorResponse(event.data.id, error);
        }
    }
}

// export worker factory used in src/index
export default function Stellar() {
    return new StellarWorker();
}

if (CONTEXT === 'worker') {
    // Initialize module if script is running in worker context
    const module = new StellarWorker();
    onmessage = module.messageHandler.bind(module);
}
