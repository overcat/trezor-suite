import { combineReducers } from '@reduxjs/toolkit';

import { deviceAuthorizationReducer } from '@suite-native/device-authorization';
import {
    feesReducer,
    prepareAccountsReducer,
    prepareBlockchainReducer,
    prepareDeviceReducer,
    prepareDiscoveryReducer,
    prepareFiatRatesReducer,
    prepareStakeReducer,
    prepareTransactionsReducer,
} from '@suite-common/wallet-core';
import { prepareFirmwareReducer } from '@suite-common/firmware';
import { appSettingsReducer, appSettingsPersistWhitelist } from '@suite-native/settings';
import { sendFormSlice } from '@suite-native/module-send';
import { logsSlice } from '@suite-common/logger';
import {
    migrateAccountLabel,
    deriveAccountTypeFromPaymentType,
    preparePersistReducer,
    walletPersistTransform,
    devicePersistTransform,
    walletStopPersistTransform,
    migrateDeviceState,
    migrateEnabledDiscoveryNetworkSymbols,
    migrateAccountBnbToBsc,
    migrateTransactionsBnbToBsc,
} from '@suite-native/storage';
import { prepareAnalyticsReducer } from '@suite-common/analytics';
import {
    messageSystemPersistedWhitelist,
    prepareMessageSystemReducer,
} from '@suite-common/message-system';
import { notificationsReducer } from '@suite-common/toast-notifications';
import { graphReducer, graphPersistTransform } from '@suite-native/graph';
import {
    discoveryConfigPersistWhitelist,
    discoveryConfigReducer,
    DiscoveryConfigState,
} from '@suite-native/discovery';
import { featureFlagsPersistedKeys, featureFlagsReducer } from '@suite-native/feature-flags';
import { prepareTokenDefinitionsReducer } from '@suite-common/token-definitions';
import { nativeFirmwareReducer } from '@suite-native/firmware';

import { extraDependencies } from './extraDependencies';
import { appReducer } from './appSlice';

const transactionsReducer = prepareTransactionsReducer(extraDependencies);
const accountsReducer = prepareAccountsReducer(extraDependencies);
const fiatRatesReducer = prepareFiatRatesReducer(extraDependencies);
const blockchainReducer = prepareBlockchainReducer(extraDependencies);
const analyticsReducer = prepareAnalyticsReducer(extraDependencies);
const messageSystemReducer = prepareMessageSystemReducer(extraDependencies);
const deviceReducer = prepareDeviceReducer(extraDependencies);
const discoveryReducer = prepareDiscoveryReducer(extraDependencies);
const tokenDefinitionsReducer = prepareTokenDefinitionsReducer(extraDependencies);
const sendFormReducer = sendFormSlice.prepareReducer(extraDependencies);
const stakeReducer = prepareStakeReducer(extraDependencies);
const firmwareReducer = prepareFirmwareReducer(extraDependencies);

export const prepareRootReducers = async () => {
    const appSettingsPersistedReducer = await preparePersistReducer({
        reducer: appSettingsReducer,
        persistedKeys: appSettingsPersistWhitelist,
        key: 'appSettings',
        version: 2,
        migrations: {
            2: (oldState: any) => ({ ...oldState, fiatCurrencyCode: oldState.fiatCurrency.label }),
        },
    });

    const walletReducers = combineReducers({
        accounts: accountsReducer,
        blockchain: blockchainReducer,
        fiat: fiatRatesReducer,
        transactions: transactionsReducer,
        discovery: discoveryReducer,
        send: sendFormReducer,
        fees: feesReducer,
        stake: stakeReducer,
    });

    const walletPersistedReducer = await preparePersistReducer({
        reducer: walletReducers,
        persistedKeys: ['accounts', 'transactions'],
        key: 'wallet',
        version: 3,
        migrations: {
            2: (oldState: any) => {
                if (!oldState.accounts) return oldState;

                const oldAccountsState: { accounts: any } = { accounts: oldState.accounts };
                const migratedAccounts = migrateAccountLabel(oldAccountsState.accounts);
                const migratedState = { ...oldState, accounts: migratedAccounts };

                return migratedState;
            },
            3: oldState => {
                if (!oldState.accounts) return oldState;

                const oldAccountsState: { accounts: any } = { accounts: oldState.accounts };
                const migratedAccounts = deriveAccountTypeFromPaymentType(
                    oldAccountsState.accounts,
                );
                const migratedState = { ...oldState, accounts: migratedAccounts };

                return migratedState;
            },
        },
        transforms: [walletStopPersistTransform],
        // This remains for backward compatibility. If any data was persisted under the 'wallet' key,
        // it is retrieved from storage and migrated. Subsequently, the 'wallet' key is cleared because
        // the data is now stored under the 'root' key.
    });

    const analyticsPersistedReducer = await preparePersistReducer({
        reducer: analyticsReducer,
        persistedKeys: ['instanceId', 'enabled', 'confirmed'],
        key: 'analytics',
        version: 1,
    });

    const devicePersistedReducer = await preparePersistReducer({
        reducer: deviceReducer,
        persistedKeys: ['devices'],
        key: 'devices',
        version: 2,
        transforms: [devicePersistTransform],
        migrations: {
            2: oldState => {
                if (!oldState.devices) return oldState;

                const oldDevicesState: { devices: any } = { devices: oldState.devices };
                const migratedDevices = migrateDeviceState(oldDevicesState.devices);
                const migratedState = { ...oldState, devices: migratedDevices };

                return migratedState;
            },
        },
    });

    const discoveryConfigPersistedReducer = await preparePersistReducer({
        reducer: discoveryConfigReducer,
        persistedKeys: discoveryConfigPersistWhitelist,
        key: 'discoveryConfig',
        version: 2,
        migrations: {
            2: (oldState: DiscoveryConfigState) => {
                if (!oldState.enabledDiscoveryNetworkSymbols) return oldState;

                const { enabledDiscoveryNetworkSymbols } = oldState;
                const migrateNetworkSymbols = migrateEnabledDiscoveryNetworkSymbols(
                    enabledDiscoveryNetworkSymbols,
                );
                const migratedState = {
                    ...oldState,
                    enabledDiscoveryNetworkSymbols: migrateNetworkSymbols,
                };

                return migratedState;
            },
        },
    });

    const featureFlagsPersistedReducer = await preparePersistReducer({
        reducer: featureFlagsReducer,
        persistedKeys: featureFlagsPersistedKeys,
        key: 'featureFlags',
        version: 1,
    });

    const messageSystemPersistedReducer = await preparePersistReducer({
        reducer: messageSystemReducer,
        persistedKeys: messageSystemPersistedWhitelist,
        key: 'messageSystem',
        version: 1,
    });

    const rootReducer = await preparePersistReducer({
        reducer: combineReducers({
            app: appReducer,
            analytics: analyticsPersistedReducer,
            appSettings: appSettingsPersistedReducer,
            wallet: walletPersistedReducer,
            featureFlags: featureFlagsPersistedReducer,
            graph: graphReducer,
            device: devicePersistedReducer,
            deviceAuthorization: deviceAuthorizationReducer,
            firmware: firmwareReducer,
            nativeFirmware: nativeFirmwareReducer,
            logs: logsSlice.reducer,
            notifications: notificationsReducer,
            discoveryConfig: discoveryConfigPersistedReducer,
            messageSystem: messageSystemPersistedReducer,
            tokenDefinitions: tokenDefinitionsReducer,
        }),
        // 'wallet' and 'graph' need to be persisted at the top level to ensure device state
        // is accessible for transformation.
        persistedKeys: ['wallet', 'graph'],
        transforms: [walletPersistTransform, graphPersistTransform],
        mergeLevel: 2,
        key: 'root',
        version: 2,
        migrations: {
            2: (oldState: { wallet: { accounts: any; transactions: { transactions: any } } }) => {
                const oldStateWallet = oldState.wallet;
                const migratedAccounts = migrateAccountBnbToBsc(oldStateWallet.accounts);

                const migratedTransactions = migrateTransactionsBnbToBsc(
                    oldStateWallet.transactions?.transactions,
                );
                const migratedState = {
                    ...oldState,
                    wallet: {
                        ...oldStateWallet,
                        accounts: migratedAccounts,
                        transactions: { transactions: migratedTransactions },
                    },
                };

                return migratedState;
            },
        },
    });

    return rootReducer;
};
