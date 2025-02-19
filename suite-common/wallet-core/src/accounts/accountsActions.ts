import { createAction } from '@reduxjs/toolkit';

import { AccountInfo, StaticSessionId } from '@trezor/connect';
import { Account, SelectedAccountStatus, DiscoveryItem } from '@suite-common/wallet-types';
import {
    enhanceAddresses,
    enhanceTokens,
    enhanceUtxo,
    formatNetworkAmount,
    getAccountKey,
    getAccountSpecific,
} from '@suite-common/wallet-utils';
import { getNetwork } from '@suite-common/wallet-config';

import { ACCOUNTS_MODULE_PREFIX } from './accountsConstants';

const disposeAccount = createAction(`${ACCOUNTS_MODULE_PREFIX}/disposeAccount`);

const updateSelectedAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/updateSelectedAccount`,
    (payload: SelectedAccountStatus): { payload: SelectedAccountStatus } => ({
        payload,
    }),
);

const removeAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/removeAccount`,
    (payload: Account[]): { payload: Account[] } => ({
        payload,
    }),
);

type CreateAccountActionProps = {
    deviceState: StaticSessionId;
    discoveryItem: DiscoveryItem;
    accountInfo: AccountInfo;
    imported?: boolean;
    accountLabel?: string;
    visible: boolean;
};

type CreateIndexLabeledAccountActionProps = Omit<
    CreateAccountActionProps,
    'imported' | 'accountLabel'
>;

const composeCreateAccountActionPayload = ({
    deviceState,
    discoveryItem,
    accountInfo,
    imported,
    accountLabel,
    visible,
}: CreateAccountActionProps): Account => {
    const { chainId } = getNetwork(discoveryItem.coin);
    const isNonEthEvm = discoveryItem.networkType === 'ethereum' && discoveryItem.coin !== 'eth';

    const metadataKey = isNonEthEvm
        ? `${accountInfo.descriptor}-${chainId}`
        : accountInfo.legacyXpub || accountInfo.descriptor;

    return {
        deviceState,
        accountLabel,
        imported,
        index: discoveryItem.index,
        path: discoveryItem.path,
        unlockPath: discoveryItem.unlockPath,
        descriptor: accountInfo.descriptor,
        descriptorChecksum: accountInfo.descriptorChecksum,
        key: getAccountKey(accountInfo.descriptor, discoveryItem.coin, deviceState),
        accountType: discoveryItem.accountType,
        symbol: discoveryItem.coin,
        empty: accountInfo.empty,
        ...(discoveryItem.backendType === 'coinjoin'
            ? {
                  backendType: 'coinjoin',
                  status: discoveryItem.status,
              }
            : {
                  backendType: discoveryItem.backendType,
              }),
        visible,
        balance: accountInfo.balance,
        availableBalance: accountInfo.availableBalance,
        formattedBalance: formatNetworkAmount(
            // xrp `availableBalance` is reduced by reserve, use regular balance
            discoveryItem.networkType === 'ripple'
                ? accountInfo.balance
                : accountInfo.availableBalance,
            discoveryItem.coin,
        ),
        tokens: enhanceTokens(accountInfo.tokens),
        addresses: enhanceAddresses(accountInfo, discoveryItem),
        utxo: enhanceUtxo(accountInfo.utxo, discoveryItem.networkType, discoveryItem.index),
        history: accountInfo.history,
        metadata: {
            key: metadataKey,
        },
        ts: Date.now(),
        ...getAccountSpecific(accountInfo, discoveryItem.networkType),
    };
};

const createIndexLabeledAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/createIndexLabeledAccount`,
    ({
        deviceState,
        discoveryItem,
        accountInfo,
        visible,
    }: CreateIndexLabeledAccountActionProps): { payload: Account } => ({
        payload: composeCreateAccountActionPayload({
            deviceState,
            discoveryItem,
            accountInfo,
            visible,
        }),
    }),
);

const createAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/createAccount`,
    ({
        deviceState,
        discoveryItem,
        accountInfo,
        imported,
        accountLabel,
        visible,
    }: CreateAccountActionProps): { payload: Account } => ({
        payload: composeCreateAccountActionPayload({
            deviceState,
            discoveryItem,
            accountInfo,
            imported,
            accountLabel,
            visible,
        }),
    }),
);

const updateAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/updateAccount`,
    (account: Account, accountInfo: AccountInfo | null = null): { payload: Account } => {
        if (accountInfo) {
            return {
                payload: {
                    ...account,
                    ...accountInfo,
                    path: account.path,
                    empty: accountInfo.empty,
                    visible: account.visible || !accountInfo.empty,
                    formattedBalance: formatNetworkAmount(
                        // xrp `availableBalance` is reduced by reserve, use regular balance
                        account.networkType === 'ripple'
                            ? accountInfo.balance
                            : accountInfo.availableBalance,
                        account.symbol,
                    ),
                    utxo: enhanceUtxo(accountInfo.utxo, account.networkType, account.index),
                    addresses: enhanceAddresses(accountInfo, account),
                    tokens: enhanceTokens(accountInfo.tokens),
                    ts: Date.now(),
                    ...getAccountSpecific(accountInfo, account.networkType),
                },
            };
        }

        return {
            payload: { ...account, ts: Date.now() },
        };
    },
);

const updateAccountRefreshTimestamp = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/updateAccountRefreshTimestamp`,
    (account: Account): { payload: Account } => ({
        payload: { ...account, ts: Date.now() },
    }),
);

const renameAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/renameAccount`,
    (accountKey: string, accountLabel: string) => ({
        payload: {
            accountKey,
            accountLabel,
        },
    }),
);

const startCoinjoinAccountSync = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/startCoinjoinAccountSync`,
    (account: Extract<Account, { backendType: 'coinjoin' }>) => ({
        payload: {
            accountKey: account.key,
        },
    }),
);

const endCoinjoinAccountSync = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/endCoinjoinAccountSync`,
    (
        account: Extract<Account, { backendType: 'coinjoin' }>,
        status: Extract<Account, { backendType: 'coinjoin' }>['status'],
    ) => ({
        payload: {
            accountKey: account.key,
            status,
        },
    }),
);

const changeAccountVisibility = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/changeAccountVisibility`,
    (account: Account, visible = true): { payload: Account } => ({
        payload: {
            ...account,
            visible,
        },
    }),
);

export const accountsActions = {
    disposeAccount,
    removeAccount,
    createAccount,
    createIndexLabeledAccount,
    updateAccount,
    updateAccountRefreshTimestamp,
    renameAccount,
    updateSelectedAccount,
    changeAccountVisibility,
    startCoinjoinAccountSync,
    endCoinjoinAccountSync,
} as const;
