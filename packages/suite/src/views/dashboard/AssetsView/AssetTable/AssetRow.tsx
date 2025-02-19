import { memo } from 'react';

import { useTheme } from 'styled-components';

import { Network } from '@suite-common/wallet-config';
import { Icon, Table, Row, IconButton, Column, Text } from '@trezor/components';
import { isTestnet } from '@suite-common/wallet-utils';
import { spacings } from '@trezor/theme';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import { selectDebugFilteredAssetAccountsThatStaked } from '@suite-common/wallet-core';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { AssetFiatBalance } from '@suite-common/assets';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    FiatValue,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useAccountSearch, useDispatch, useSelector } from 'src/hooks/suite';
import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

import { AssetCoinLogo } from '../AssetCoinLogo';
import { AssetCoinName } from '../AssetCoinName';
import { CoinmarketBuyButton } from '../CoinmarketBuyButton';
import { AssetTokenRow } from './AssetTokenRow';
import { AssetStakingRow } from './AssetStakingRow';
import { AssetTableExtraRowsSection as Section } from './AssetTableExtraRowsSection';
import { handleTokensAndStakingData } from '../assetsViewUtils';

export interface AssetTableRowProps {
    network: Network;
    failed: boolean;
    assetNativeCryptoBalance: string;
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    isStakeNetwork?: boolean;
    assetsFiatBalances: AssetFiatBalance[];
    accounts: Account[];
    localCurrency: FiatCurrencyCode;
    currentFiatRates?: RatesByKey;
}

export const AssetRow = memo(
    ({
        network,
        failed,
        assetNativeCryptoBalance,
        assetTokens,
        stakingAccounts,
        assetsFiatBalances,
        localCurrency,
        currentFiatRates,
        accounts,
    }: AssetTableRowProps) => {
        const { symbol } = network;
        const dispatch = useDispatch();
        const theme = useTheme();
        const { setCoinFilter, setSearchString } = useAccountSearch();

        const handleRowClick = () => {
            dispatch(
                goto('wallet-index', {
                    params: {
                        symbol,
                        accountIndex: 0,
                        accountType: 'normal',
                    },
                }),
            );
            // activate coin filter and reset account search string
            setCoinFilter(symbol);
            setSearchString(undefined);
        };
        const coinDefinitions = useSelector(state => selectCoinDefinitions(state, network.symbol));
        const stakingAccountsForAsset = stakingAccounts.filter(
            account => account.symbol === network.symbol,
        );

        // TODO: remove this logic when Solana staking is available
        const isDebugModeActive = useSelector(selectIsDebugModeActive);
        const debugFilteredStakedAccounts = useSelector(state =>
            selectDebugFilteredAssetAccountsThatStaked(
                state,
                stakingAccountsForAsset,
                isDebugModeActive,
            ),
        );

        const {
            tokensFiatBalance,
            assetStakingBalance,
            shouldRenderStakingRow,
            shouldRenderTokenRow,
        } = handleTokensAndStakingData(
            assetTokens,
            debugFilteredStakedAccounts,
            symbol,
            localCurrency,
            coinDefinitions,
            currentFiatRates,
        );

        return (
            <>
                <Table.Row onClick={handleRowClick} data-testid={`@dashboard/asset-row/${symbol}`}>
                    <Table.Cell align="center">
                        <Section
                            $dashedLinePosition={
                                shouldRenderStakingRow || shouldRenderTokenRow
                                    ? 'middleToBottom'
                                    : undefined
                            }
                        >
                            <AssetCoinLogo
                                symbol={symbol}
                                assetsFiatBalances={assetsFiatBalances}
                            />
                        </Section>
                    </Table.Cell>
                    <Table.Cell padding={{ left: spacings.zero }}>
                        <AssetCoinName network={network} />
                    </Table.Cell>
                    <Table.Cell>
                        {!failed ? (
                            <Column
                                alignItems="flex-start"
                                justifyContent="center"
                                gap={spacings.xxxs}
                                data-testid={`@dashboard/asset/${symbol}/fiat-amount`}
                            >
                                <FiatValue amount={assetNativeCryptoBalance} symbol={symbol} />

                                <Text typographyStyle="hint" color={theme.textSubdued}>
                                    <AmountUnitSwitchWrapper symbol={symbol}>
                                        <CoinBalance
                                            value={assetNativeCryptoBalance}
                                            symbol={symbol}
                                        />
                                    </AmountUnitSwitchWrapper>
                                </Text>
                            </Column>
                        ) : (
                            <Text variant="destructive" typographyStyle="hint" textWrap="nowrap">
                                <Row gap={spacings.xxs}>
                                    <Icon
                                        name="warningTriangle"
                                        color={theme.legacy.TYPE_RED}
                                        size={14}
                                    />
                                    <Translation id="TR_DASHBOARD_ASSET_FAILED" />
                                </Row>
                            </Text>
                        )}
                    </Table.Cell>
                    <Table.Cell align="right" data-testid="@dashboard/asset/exchange-rate">
                        {!isTestnet(symbol) && <PriceTicker symbol={symbol} />}
                    </Table.Cell>

                    <Table.Cell data-testid="@dashboard/asset/week-change">
                        {!isTestnet(symbol) && <TrendTicker symbol={symbol} />}
                    </Table.Cell>
                    <Table.Cell align="right" colSpan={2}>
                        <Row gap={spacings.md}>
                            {!isTestnet(symbol) && (
                                <CoinmarketBuyButton
                                    symbol={symbol}
                                    data-testid={`@dashboard/asset/${symbol}/buy-button`}
                                />
                            )}
                            <IconButton icon="arrowRight" size="small" variant="tertiary" />
                        </Row>
                    </Table.Cell>
                </Table.Row>
                {shouldRenderStakingRow && (
                    <AssetStakingRow
                        stakingTotalBalance={assetStakingBalance.toFixed()}
                        symbol={symbol}
                        shouldRenderTokenRow={shouldRenderTokenRow}
                    />
                )}
                {shouldRenderTokenRow && (
                    <AssetTokenRow
                        tokenIconSetWrapper={
                            <TokenIconSetWrapper accounts={accounts} symbol={network.symbol} />
                        }
                        network={network}
                        tokensDisplayFiatBalance={tokensFiatBalance.toFixed()}
                    />
                )}
            </>
        );
    },
);
