import type { Transport } from '@trezor/transport';
import { TRANSPORT } from '@trezor/transport/src/constants';

import { serializeError } from '../constants/errors';
import type { MessageFactoryFn } from '../types/utils';
import { ConnectSettings } from '../exports';

export { TRANSPORT } from '@trezor/transport/src/constants';

export const TRANSPORT_EVENT = 'TRANSPORT_EVENT';
export interface BridgeInfo {
    version: number[];
    directory: string;
    packages: {
        name: string;
        platform: string[];
        url: string;
        signature?: string;
        preferred?: boolean;
    }[];
    changelog: string;
}

export interface UdevInfo {
    directory: string;
    packages: {
        name: string;
        platform: string[];
        url: string;
        signature?: string;
        preferred?: boolean;
    }[];
}

export interface TransportInfo {
    apiType: Transport['apiType'];
    type: Transport['name'];
    version: string;
    outdated: boolean;
}

export interface TransportError {
    apiType?: Transport['apiType'];
    error: string;
    code?: string;
}

export interface InstallerInfo {
    bridge?: BridgeInfo;
    udev?: UdevInfo;
}

export type TransportEvent =
    | { type: typeof TRANSPORT.START; payload: TransportInfo & InstallerInfo }
    | { type: typeof TRANSPORT.ERROR; payload: TransportError & InstallerInfo };

export interface TransportSetTransports {
    type: typeof TRANSPORT.SET_TRANSPORTS;
    payload: Pick<ConnectSettings, 'transports'>;
}

export interface TransportDisableWebUSB {
    type: typeof TRANSPORT.DISABLE_WEBUSB;
    payload?: undefined;
}

export interface TransportRequestWebUSBDevice {
    type: typeof TRANSPORT.REQUEST_DEVICE;
    payload?: undefined;
}

export interface TransportGetInfo {
    id: number;
    type: typeof TRANSPORT.GET_INFO;
    payload?: undefined;
}

export type TransportEventMessage = TransportEvent & { event: typeof TRANSPORT_EVENT };

export type TransportEventListenerFn = (
    type: typeof TRANSPORT_EVENT,
    cb: (event: TransportEventMessage) => void,
) => void;

export const createTransportMessage: MessageFactoryFn<typeof TRANSPORT_EVENT, TransportEvent> = (
    type,
    payload,
) =>
    ({
        event: TRANSPORT_EVENT,
        type,
        payload: 'error' in payload ? serializeError(payload) : payload,
    }) as any;
