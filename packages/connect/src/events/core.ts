import type { BlockchainEventMessage } from './blockchain';
import type { IFrameCallMessage, MethodResponseMessage } from './call';
import type { DeviceEventMessage } from './device';
import type { IFrameEventMessage, IFrameInit, IFrameLogRequest } from './iframe';
import type { PopupAnalyticsResponse, PopupClosedMessage, PopupEventMessage } from './popup';
import type {
    TransportEventMessage,
    TransportDisableWebUSB,
    TransportRequestWebUSBDevice,
    TransportSetTransports,
    TransportGetInfo,
} from './transport';
import type { UiEventMessage } from './ui-request';
import type { UiResponseEvent } from './ui-response';
import type { Unsuccessful } from '../types/params';
import { ErrorCode, TrezorError } from '../constants/errors';

export const CORE_EVENT = 'CORE_EVENT';

export type CoreRequestMessage =
    | PopupClosedMessage
    | PopupAnalyticsResponse
    | TransportDisableWebUSB
    | TransportSetTransports
    | TransportRequestWebUSBDevice
    | TransportGetInfo
    | UiResponseEvent
    | IFrameInit
    | IFrameCallMessage
    | IFrameLogRequest;

export type CoreEventMessage = {
    success?: boolean; // response status in ResponseMessage
    channel?: { here: string; peer: string }; // channel name
} & (
    | BlockchainEventMessage
    | DeviceEventMessage
    | TransportEventMessage
    | UiEventMessage
    | MethodResponseMessage
    | IFrameEventMessage
    | PopupEventMessage
);

// parse MessageEvent .data into CoreMessage
export const parseMessage = <T extends CoreRequestMessage | CoreEventMessage = never>(
    messageData: any,
): T => {
    const message = {
        event: messageData.event,
        type: messageData.type,
        payload: messageData.payload,
        device: messageData.device,
    };

    if (typeof messageData.id === 'number') {
        (message as any).id = messageData.id;
    }

    if (typeof messageData.success === 'boolean') {
        (message as any).success = messageData.success;
    }

    return message as T;
};

// common response used straight from npm index (not from Core)
export const createErrorMessage = (
    error: (Error & { code?: ErrorCode }) | TrezorError,
): Unsuccessful => ({
    success: false,
    payload: {
        error: error.message,
        code: error.code,
    },
});
