import { AccountType, getNetwork, NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { StaticSessionId } from '@trezor/connect';

export const isDebugOnlyAccountType = (
    accountType: AccountType,
    symbol?: NetworkSymbol,
): boolean => {
    if (!symbol) return false;

    const network = getNetwork(symbol);

    const accountTypeInfo = network.accountTypes[accountType];

    return !!accountTypeInfo?.isDebugOnlyAccountType;
};

type FilterReceiveAccountsProps = {
    accounts: Account[];
    deviceState?: StaticSessionId;
    symbol?: NetworkSymbol;
    isDebug: boolean;
};

export const filterReceiveAccounts = ({
    accounts,
    deviceState,
    symbol,
    isDebug,
}: FilterReceiveAccountsProps): Account[] => {
    const isSameDevice = (account: Account) => account.deviceState === deviceState;
    const isSameNetwork = (account: Account) => account.symbol === symbol;
    const shouldDisplayDebugOnly = (account: Account) =>
        isDebug || !isDebugOnlyAccountType(account.accountType, account.symbol);
    const isNotEmptyAccount = (account: Account) => !account.empty;
    const isVisibleAccount = (account: Account) => account.visible;
    const isFirstNormalAccount = (account: Account) =>
        account.accountType === 'normal' && account.index === 0;
    const isCoinjoinAccount = (account: Account) => account.accountType === 'coinjoin';

    return accounts.filter(
        account =>
            isSameDevice(account) &&
            isSameNetwork(account) &&
            !isCoinjoinAccount(account) &&
            shouldDisplayDebugOnly(account) &&
            (isNotEmptyAccount(account) ||
                isVisibleAccount(account) ||
                isFirstNormalAccount(account)),
    );
};
