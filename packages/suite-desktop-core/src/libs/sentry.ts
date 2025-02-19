import { init, ElectronMainOptions, IPCMode } from '@sentry/electron/main';
import { session } from 'electron';

import { TorStatus } from '@trezor/suite-desktop-api';
import { SENTRY_CONFIG } from '@suite-common/sentry';

import type { Store } from './store';
import type { MainThreadEmitter } from '../modules';

interface InitSentryParams {
    mainThreadEmitter: MainThreadEmitter;
    store: Store;
}

export const initSentry = ({ mainThreadEmitter, store }: InitSentryParams) => {
    let torStatus = TorStatus.Enabling;

    mainThreadEmitter.on('module/tor-status-update', (newStatus: TorStatus) => {
        torStatus = newStatus;
    });

    const transportOptions = {
        // If Tor is enabled but not running, don't send the event but put it in a queue.
        // Queue can be inspected in @trezor/suite-desktop/sentry/queue folder.
        shouldSend: () => !(store.getTorSettings().running && torStatus !== TorStatus.Enabled),
    };

    const sentryConfig: ElectronMainOptions = {
        ...SENTRY_CONFIG,
        ipcMode: IPCMode.Classic,
        getSessions: () => [session.defaultSession],
        transportOptions,
    };

    // Sentry ignore userPath change by environment so even in local build it uses @trezor/suite-desktop/sentry folder.
    init(sentryConfig);
};
