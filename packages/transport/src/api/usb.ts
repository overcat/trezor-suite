import { createDeferred, createTimeoutPromise, getSynchronize } from '@trezor/utils';

import { AbstractApi, AbstractApiConstructorParams, DEVICE_TYPE } from './abstract';
import { DescriptorApiLevel, PathInternal } from '../types';
import {
    CONFIGURATION_ID,
    ENDPOINT_ID,
    INTERFACE_ID,
    DEBUGLINK_ENDPOINT_ID,
    DEBUGLINK_INTERFACE_ID,
    T1_HID_VENDOR,
    TREZOR_USB_DESCRIPTORS,
    WEBUSB_BOOTLOADER_PRODUCT,
    T1_HID_PRODUCT,
} from '../constants';
import * as ERRORS from '../errors';

interface ConstructorParams extends AbstractApiConstructorParams {
    usbInterface: USB;
    forceReadSerialOnConnect?: boolean;
    debugLink?: boolean;
}

interface TransportInterfaceDevice {
    session?: null | string;
    path: string;
    device: USBDevice;
}

export class UsbApi extends AbstractApi {
    chunkSize = 64;

    protected devices: TransportInterfaceDevice[] = [];
    protected usbInterface: ConstructorParams['usbInterface'];
    private forceReadSerialOnConnect?: boolean;
    private abortController = new AbortController();
    private debugLink?: boolean;
    private synchronizeCreateDevices = getSynchronize();

    constructor({ usbInterface, logger, forceReadSerialOnConnect, debugLink }: ConstructorParams) {
        super({ logger });

        this.usbInterface = usbInterface;
        this.forceReadSerialOnConnect = forceReadSerialOnConnect;
        this.debugLink = debugLink;
    }

    public listen() {
        this.usbInterface.onconnect = event => {
            this.logger?.debug(`usb: onconnect: ${this.formatDeviceForLog(event.device)}`);

            return this.createDevices([event.device], this.abortController.signal)
                .then(newDevices => {
                    this.devices = [...this.devices, ...newDevices];
                    this.emit('transport-interface-change', this.devicesToDescriptors());
                })
                .catch(err => {
                    // empty
                    this.logger?.error(`usb: createDevices error: ${err.message}`);
                });
        };

        this.usbInterface.ondisconnect = event => {
            const { device } = event;
            if (!device.serialNumber) {
                this.logger?.debug(
                    `usb: ondisconnect: device without serial number:, ${device.productName}, ${device.manufacturerName}`,
                );

                // trezor devices have serial number 468E58AE386B5D2EA8C572A2 or 000000000000000000000000 (for bootloader devices)
                return;
            }

            const index = this.devices.findIndex(d => d.path === device.serialNumber);
            if (index > -1) {
                this.devices.splice(index, 1);
                this.emit('transport-interface-change', this.devicesToDescriptors());
            } else {
                // todo: this doesn't make sense. this error is fired for disconnected dongles, keyboards etc. we are not consuming transport-interface-error anywhere so it doesn't matter, it is just useless
                this.emit('transport-interface-error', ERRORS.DEVICE_NOT_FOUND);
                this.logger?.error('usb: device that should be removed does not exist in state');
            }
        };
    }

    private formatDeviceForLog(device: USBDevice) {
        return JSON.stringify({
            productName: device.productName,
            manufacturerName: device.manufacturerName,
            serialNumber: device.serialNumber,
            vendorId: device.vendorId,
            productId: device.productId,
            deviceVersionMajor: device.deviceVersionMajor,
            deviceVersionMinor: device.deviceVersionMinor,
            opened: device.opened,
        });
    }

    private matchDeviceType(device: USBDevice) {
        const isBootloader = device.productId === WEBUSB_BOOTLOADER_PRODUCT;
        if (device.deviceVersionMajor === 2) {
            if (isBootloader) {
                return DEVICE_TYPE.TypeT2Boot;
            } else {
                return DEVICE_TYPE.TypeT2;
            }
        } else {
            if (isBootloader) {
                return DEVICE_TYPE.TypeT1WebusbBoot;
            } else if (device.vendorId === T1_HID_VENDOR && device.productId === T1_HID_PRODUCT) {
                return DEVICE_TYPE.TypeT1Hid;
            } else {
                return DEVICE_TYPE.TypeT1Webusb;
            }
        }
    }

    private devicesToDescriptors(): DescriptorApiLevel[] {
        return this.devices.map(d => ({
            path: PathInternal(d.path),
            type: this.matchDeviceType(d.device),
            product: d.device.productId,
            vendor: d.device.vendorId,
        }));
    }

    private abortableMethod<R>(
        method: () => Promise<R>,
        { signal, onAbort }: { signal?: AbortSignal; onAbort?: () => Promise<void> | void },
    ) {
        if (!signal) {
            return method();
        }
        if (signal.aborted) {
            return Promise.reject(new Error(ERRORS.ABORTED_BY_SIGNAL));
        }

        const dfd = createDeferred<R>();
        const abortListener = async () => {
            this.logger?.debug('usb: abortableMethod onAbort start');
            try {
                await onAbort?.();
            } catch {
                /* empty */
            }
            this.logger?.debug('usb: abortableMethod onAbort done');
            dfd.reject(new Error(ERRORS.ABORTED_BY_SIGNAL));
        };
        signal?.addEventListener('abort', abortListener);

        const methodPromise = method().catch(error => {
            // NOTE: race condition
            // method() rejects error triggered by signal (device.reset) before dfd.promise (before onAbort finish)
            this.logger?.debug(`usb: abortableMethod method() aborted: ${signal.aborted} ${error}`);
            if (signal.aborted) {
                return dfd.promise;
            }
            dfd.reject(error);
            throw error;
        });

        return Promise.race([methodPromise, dfd.promise])
            .then(r => {
                dfd.resolve(r);

                return r;
            })
            .finally(() => {
                signal?.removeEventListener('abort', abortListener);
            });
    }

    public async enumerate(signal?: AbortSignal) {
        try {
            this.logger?.debug('usb: enumerate');
            const devices = await this.abortableMethod(() => this.usbInterface.getDevices(), {
                signal,
            });

            this.devices = await this.createDevices(devices, signal);

            return this.success(this.devicesToDescriptors());
        } catch (err) {
            // this shouldn't throw
            return this.unknownError(err);
        }
    }

    public async read(path: string, signal?: AbortSignal) {
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            this.logger?.debug('usb: device.transferIn');
            const res = await this.abortableMethod(
                () =>
                    device.transferIn(
                        this.debugLink ? DEBUGLINK_ENDPOINT_ID : ENDPOINT_ID,
                        this.chunkSize,
                    ),
                { signal, onAbort: () => device?.reset() },
            );
            this.logger?.debug(
                `usb: device.transferIn done. status: ${res.status}, byteLength: ${res.data?.byteLength}.`,
            );

            if (!res.data?.byteLength) {
                return this.error({ error: ERRORS.INTERFACE_DATA_TRANSFER });
            }

            return this.success(Buffer.from(res.data.buffer));
        } catch (err) {
            this.logger?.error(`usb: device.transferIn error ${err}`);

            return this.handleReadWriteError(err);
        }
    }

    public async write(path: string, buffer: Buffer, signal?: AbortSignal) {
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }
        const newArray = new Uint8Array(this.chunkSize);
        newArray.set(new Uint8Array(buffer));

        try {
            // https://wicg.github.io/webusb/#ref-for-dom-usbdevice-transferout
            this.logger?.debug('usb: device.transferOut');
            const result = await this.abortableMethod(
                () =>
                    device.transferOut(
                        this.debugLink ? DEBUGLINK_ENDPOINT_ID : ENDPOINT_ID,
                        newArray,
                    ),
                { signal, onAbort: () => device?.reset() },
            );
            this.logger?.debug(`usb: device.transferOut done.`);
            if (result.status !== 'ok') {
                this.logger?.error(`usb: device.transferOut status not ok: ${result.status}`);
                throw new Error('transfer out status not ok');
            }

            return this.success(undefined);
        } catch (err) {
            return this.handleReadWriteError(err);
        }
    }

    public async openDevice(path: string, first: boolean, signal?: AbortSignal) {
        // note: multiple retries to open device. reason:  when another window acquires device, changed session
        // is broadcasted to other clients. they are responsible for releasing interface, which takes some time.
        // if there is only one client working with device, this will succeed using only one attempt.

        // note: why for instead of scheduleAction from @trezor/utils with attempts param. this.openInternal does not throw
        // I would need to throw artificially which is not nice.
        for (let i = 0; i < 5; i++) {
            this.logger?.debug(`usb: openDevice attempt ${i}`);
            const res = await this.openInternal(path, first, signal);
            if (res.success || signal?.aborted) {
                return res;
            }

            await createTimeoutPromise(100 * i);
        }

        return this.openInternal(path, first, signal);
    }

    private async openInternal(path: string, first: boolean, signal?: AbortSignal) {
        const device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        try {
            this.logger?.debug(`usb: device.open`);
            await this.abortableMethod(() => device.open(), { signal });
            this.logger?.debug(`usb: device.open done. device: ${this.formatDeviceForLog(device)}`);
        } catch (err) {
            this.logger?.error(`usb: device.open error ${err}`);
            if (err.message.includes('LIBUSB_ERROR_ACCESS')) {
                return this.error({ error: ERRORS.LIBUSB_ERROR_ACCESS });
            }

            return this.error({
                error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                message: err.message,
            });
        }

        if (first) {
            try {
                this.logger?.debug(`usb: device.selectConfiguration ${CONFIGURATION_ID}`);
                await this.abortableMethod(() => device.selectConfiguration(CONFIGURATION_ID), {
                    signal,
                });
                this.logger?.debug(`usb: device.selectConfiguration done: ${CONFIGURATION_ID}.`);
            } catch (err) {
                this.logger?.error(
                    `usb: device.selectConfiguration error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );
            }
            try {
                // reset fails on ChromeOS and windows
                this.logger?.debug('usb: device.reset');
                await this.abortableMethod(() => device?.reset(), { signal });
                this.logger?.debug(`usb: device.reset done.`);
            } catch (err) {
                this.logger?.error(
                    `usb: device.reset error ${err}. device: ${this.formatDeviceForLog(device)}`,
                );
                // empty
            }
        }
        try {
            const interfaceId = this.debugLink ? DEBUGLINK_INTERFACE_ID : INTERFACE_ID;
            this.logger?.debug(`usb: device.claimInterface: ${interfaceId}`);
            // claim device for exclusive access by this app
            await this.abortableMethod(() => device.claimInterface(interfaceId), { signal });
            this.logger?.debug(`usb: device.claimInterface done: ${interfaceId}.`);
        } catch (err) {
            this.logger?.error(`usb: device.claimInterface error ${err}.`);

            return this.error({
                error: ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                message: err.message,
            });
        }

        return this.success(undefined);
    }

    public async closeDevice(path: string) {
        let device = this.findDevice(path);
        if (!device) {
            return this.error({ error: ERRORS.DEVICE_NOT_FOUND });
        }

        this.logger?.debug(`usb: closeDevice. device.opened: ${device.opened}`);

        if (device.opened) {
            if (!this.debugLink) {
                try {
                    // NOTE: `device.reset()` interrupts transfers for all interfaces (debugLink and normal)
                    await device.reset();
                } catch (err) {
                    this.logger?.error(
                        `usb: device.reset error ${err}. device: ${this.formatDeviceForLog(device)}`,
                    );
                }
            }
        }

        device = this.findDevice(path);
        if (device?.opened) {
            try {
                const interfaceId = this.debugLink ? DEBUGLINK_INTERFACE_ID : INTERFACE_ID;
                this.logger?.debug(`usb: device.releaseInterface: ${interfaceId}`);

                await device.releaseInterface(interfaceId);
                this.logger?.debug(`usb: device.releaseInterface done: ${interfaceId}.`);
            } catch (err) {
                this.logger?.error(`usb: releaseInterface error ${err}.`);
                // ignore
            }
        }
        device = this.findDevice(path);
        if (device?.opened) {
            try {
                this.logger?.debug(`usb: device.close`);
                await device.close();
                this.logger?.debug(`usb: device.close done.`);
            } catch (err) {
                this.logger?.debug(`usb: device.close error ${err}.`);

                return this.error({
                    error: ERRORS.INTERFACE_UNABLE_TO_CLOSE_DEVICE,
                    message: err.message,
                });
            }
        }

        return this.success(undefined);
    }

    private findDevice(path: string) {
        const device = this.devices.find(d => d.path === path);
        if (!device) {
            return;
        }

        return device.device;
    }

    private createDevices(devices: USBDevice[], signal?: AbortSignal) {
        return this.synchronizeCreateDevices(async () => {
            let bootloaderId = 0;

            const getPathFromUsbDevice = (device: USBDevice) => {
                // path is just serial number
                // more bootloaders => number them, hope for the best
                const { serialNumber } = device;
                let path =
                    serialNumber == null || serialNumber === '' ? 'bootloader' : serialNumber;
                if (path === 'bootloader') {
                    this.logger?.debug('usb: device without serial number!');
                    bootloaderId++;
                    path += bootloaderId;
                }

                return path;
            };

            const [hidDevices, nonHidDevices] = this.filterDevices(devices);

            const loadedDevices = await Promise.all(
                nonHidDevices.map(async device => {
                    this.logger?.debug(`usb: creating device ${this.formatDeviceForLog(device)}`);

                    if (
                        this.forceReadSerialOnConnect &&
                        // device already has serialNumber or it is open - both cases mean that we already seen it before and don't need to bother
                        !device.opened &&
                        !device.serialNumber
                    ) {
                        // try to load serialNumber. if this doesn't succeed, we can still continue normally. the only problem is that multiple devices
                        // connected at the same time will not be properly distinguished.
                        await this.loadSerialNumber(device, signal);
                    }
                    const path = getPathFromUsbDevice(device);

                    return { path, device };
                }),
            );

            return [
                ...loadedDevices,
                ...hidDevices.map(d => ({
                    path: getPathFromUsbDevice(d),
                    device: d,
                })),
            ];
        });
    }

    /*
     * depending on OS (and specific usb drivers), it might be required to open device in order to read serial number.
     * https://github.com/node-usb/node-usb/issues/546
     */
    private async loadSerialNumber(device: USBDevice, signal?: AbortSignal) {
        try {
            this.logger?.debug(`usb: loadSerialNumber`);

            await this.abortableMethod(() => device.open(), { signal });
            // load serial number.
            await this.abortableMethod(
                () =>
                    device
                        // @ts-expect-error: this is not part of common types between webusb and usb.
                        .getStringDescriptor(device.device.deviceDescriptor.iSerialNumber),
                { signal },
            );
            this.logger?.debug(`usb: loadSerialNumber done, serialNumber: ${device.serialNumber}`);
            await this.abortableMethod(() => device.close(), { signal });
        } catch (err) {
            this.logger?.error(`usb: loadSerialNumber error: ${err.message}`);
            throw err;
        }
    }

    private deviceIsHid(device: USBDevice) {
        return device.vendorId === T1_HID_VENDOR;
    }

    private filterDevices(devices: USBDevice[]) {
        const trezorDevices = devices.filter(dev => {
            const isTrezor = TREZOR_USB_DESCRIPTORS.some(
                desc => dev.vendorId === desc.vendorId && dev.productId === desc.productId,
            );

            return isTrezor;
        });
        const hidDevices = trezorDevices.filter(dev => this.deviceIsHid(dev));
        const nonHidDevices = trezorDevices.filter(dev => !this.deviceIsHid(dev));

        return [hidDevices, nonHidDevices];
    }

    // https://github.com/trezor/trezord-go/blob/db03d99230f5b609a354e3586f1dfc0ad6da16f7/usb/libusb.go#L545
    private handleReadWriteError(err: Error) {
        if (
            [
                // node usb
                'LIBUSB_TRANSFER_ERROR',
                'LIBUSB_ERROR_PIPE',
                'LIBUSB_ERROR_IO',
                'LIBUSB_ERROR_NO_DEVICE',
                'LIBUSB_ERROR_OTHER',
                // web usb
                ERRORS.INTERFACE_DATA_TRANSFER,
                'The device was disconnected.',
            ].some(disconnectedErr => err.message.includes(disconnectedErr))
        ) {
            return this.error({ error: ERRORS.DEVICE_DISCONNECTED_DURING_ACTION });
        }

        return this.unknownError(err);
    }

    public dispose() {
        if (this.usbInterface) {
            this.usbInterface.onconnect = null;
            this.usbInterface.ondisconnect = null;
        }
        this.abortController.abort();
    }
}
