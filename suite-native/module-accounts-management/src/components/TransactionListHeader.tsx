import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    AccountsRootState,
    selectIsTestnetAccount,
    selectHasAccountTransactions,
    selectAccountByKey,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import {
    AppTabsParamList,
    RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { FeatureFlag, FeatureFlagsRootState, useFeatureFlag } from '@suite-native/feature-flags';

import { AccountDetailGraph } from './AccountDetailGraph';
import { AccountDetailCryptoValue } from './AccountDetailCryptoValue';
import { CoinPriceCard } from './CoinPriceCard';
import { selectIsNetworkSendFlowEnabled } from '../selectors';

type TransactionListHeaderProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type TransactionListHeaderContentProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

type AccountsNavigationProps = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    RootStackRoutes.ReceiveModal,
    RootStackParamList
>;

const TransactionListHeaderContent = ({
    accountKey,
    tokenContract,
}: TransactionListHeaderContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const accountHasTransactions = useSelector((state: AccountsRootState) =>
        selectHasAccountTransactions(state, accountKey),
    );
    const isTestnetAccount = useSelector((state: AccountsRootState) =>
        selectIsTestnetAccount(state, accountKey),
    );

    if (!account) return null;

    const isTokenAccount = !!tokenContract;

    // Graph is temporarily hidden also for ERC20 tokens.
    // Will be solved in issue: https://github.com/trezor/trezor-suite/issues/7839
    const isGraphDisplayed = accountHasTransactions && !isTestnetAccount && !isTokenAccount;

    if (isGraphDisplayed) {
        return <AccountDetailGraph accountKey={accountKey} />;
    }
    if (isTokenAccount) {
        return <AccountDetailGraph accountKey={accountKey} tokenContract={tokenContract} />;
    }

    if (isTestnetAccount) {
        return (
            <AccountDetailCryptoValue value={account.formattedBalance} symbol={account.symbol} />
        );
    }

    return null;
};

export const TransactionListHeader = memo(
    ({ accountKey, tokenContract }: TransactionListHeaderProps) => {
        const navigation = useNavigation<AccountsNavigationProps>();
        const isDeviceConnectEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

        const account = useSelector((state: AccountsRootState) =>
            selectAccountByKey(state, accountKey),
        );

        const accountHasTransactions = useSelector((state: AccountsRootState) =>
            selectHasAccountTransactions(state, accountKey),
        );
        const isTestnetAccount = useSelector((state: AccountsRootState) =>
            selectIsTestnetAccount(state, accountKey),
        );
        const isNetworkSendFlowEnabled = useSelector((state: FeatureFlagsRootState) =>
            selectIsNetworkSendFlowEnabled(state, account?.symbol),
        );
        const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

        if (!account) return null;

        const handleReceive = () => {
            navigation.navigate(RootStackRoutes.ReceiveModal, {
                accountKey,
                tokenContract,
                closeActionType: 'back',
            });
        };

        const handleSend = () => {
            navigation.navigate(RootStackRoutes.SendStack, {
                screen: SendStackRoutes.SendOutputs,
                params: {
                    accountKey,
                    tokenContract,
                },
            });
        };

        const isTokenDetail = !!tokenContract;
        const isPriceCardDisplayed = !isTestnetAccount && !isTokenDetail;

        const isSendButtonDisplayed =
            isDeviceConnectEnabled && isNetworkSendFlowEnabled && !isPortfolioTrackerDevice;

        return (
            <>
                <VStack spacing="sp24">
                    <TransactionListHeaderContent
                        accountKey={accountKey}
                        tokenContract={tokenContract}
                    />
                    {accountHasTransactions && (
                        <HStack paddingTop="sp8" paddingHorizontal="sp16" flex={1} spacing="sp12">
                            <Box flex={1}>
                                <Button
                                    viewLeft="arrowLineDown"
                                    onPress={handleReceive}
                                    testID="@account-detail/receive-button"
                                >
                                    <Translation id="transactions.receive" />
                                </Button>
                            </Box>
                            {isSendButtonDisplayed && (
                                <Box flex={1}>
                                    <Button
                                        viewLeft="arrowLineUp"
                                        onPress={handleSend}
                                        testID="@account-detail/send-button"
                                    >
                                        <Translation id="transactions.send" />
                                    </Button>
                                </Box>
                            )}
                        </HStack>
                    )}
                    {isPriceCardDisplayed && <CoinPriceCard accountKey={accountKey} />}
                </VStack>
                {accountHasTransactions && (
                    <Box marginTop="sp52" marginHorizontal="sp32">
                        <Text variant="titleSmall">
                            <Translation id="transactions.title" />
                        </Text>
                    </Box>
                )}
            </>
        );
    },
);
