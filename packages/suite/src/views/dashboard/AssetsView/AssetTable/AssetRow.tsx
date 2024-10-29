import { memo } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Network } from '@suite-common/wallet-config';
import { Icon, Table, Row, IconButton, Column, Text } from '@trezor/components';
import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    FiatValue,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { getAccountTotalStakingBalance, isTestnet } from '@suite-common/wallet-utils';
import { goto } from 'src/actions/suite/routerActions';
import { useAccountSearch, useDispatch, useSelector } from 'src/hooks/suite';
import { spacings, borders } from '@trezor/theme';
import { AssetCoinLogo } from '../AssetCoinLogo';
import { AssetCoinName } from '../AssetCoinName';
import { CoinmarketBuyButton } from '../CoinmarketBuyButton';
import { BigNumber } from '@trezor/utils';
import { TokenInfo } from '@trezor/blockchain-link-types';
import { AssetTokenRow } from './AssetTokenRow';
import { selectCoinDefinitions } from '@suite-common/token-definitions';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';
import { selectAssetAccountsThatStaked } from '@suite-common/wallet-core';
import { Account, RatesByKey } from '@suite-common/wallet-types';
import { AssetStakingRow } from './AssetStakingRow';
import { AssetFiatBalance } from '@suite-common/assets';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export interface AssetTableRowProps {
    network: Network;
    failed: boolean;
    assetNativeCryptoBalance: string;
    stakingAccounts: Account[];
    assetTokens: TokenInfo[];
    isStakeNetwork?: boolean;
    assetsFiatBalances: AssetFiatBalance[];
}

const Section = styled.div<{ $renderTokenOrStakingRow: boolean }>`
    ${({ $renderTokenOrStakingRow }) =>
        $renderTokenOrStakingRow &&
        css`
            &::before {
                content: '';
                position: absolute;
                top: 50%;
                bottom: 0;
                left: 50%;
                transform: translateX(-50%);
                border-left: ${borders.widths.large} dotted ${({ theme }) => theme.borderDashed};
            }
        `}
`;

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
    }: AssetTableRowProps & {
        localCurrency: FiatCurrencyCode;
        currentFiatRates?: RatesByKey;
    }) => {
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
        const accountsThatStaked = useSelector(state =>
            selectAssetAccountsThatStaked(state, stakingAccountsForAsset),
        );
        const assetStakingBalance = accountsThatStaked.reduce((total, account) => {
            return total.plus(getAccountTotalStakingBalance(account));
        }, new BigNumber(0));
        const tokens = getTokens(assetTokens ?? [], network.symbol, coinDefinitions);
        const tokensWithRates = enhanceTokensWithRates(
            tokens.shownWithBalance ?? [],
            localCurrency,
            network.symbol,
            currentFiatRates,
        );
        const sortedTokens = tokensWithRates.sort(sortTokensWithRates);
        const tokensFiatBalance = sortedTokens.reduce((total, token) => {
            return total.plus(token?.fiatValue ?? 0);
        }, new BigNumber(0));
        const shouldRenderStakingRow = accountsThatStaked.length > 0 && assetStakingBalance.gt(0);
        const shouldRenderTokenRow = tokens.shownWithBalance?.length > 0 && tokensFiatBalance.gt(0);

        return (
            <>
                <Table.Row onClick={handleRowClick}>
                    <Table.Cell align="center">
                        <Section
                            $renderTokenOrStakingRow={
                                shouldRenderTokenRow || shouldRenderStakingRow
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
                                data-testid={`@asset-card/${symbol}/balance`}
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
                    <Table.Cell align="right">
                        {!isTestnet(symbol) && <PriceTicker symbol={symbol} />}
                    </Table.Cell>

                    <Table.Cell>{!isTestnet(symbol) && <TrendTicker symbol={symbol} />}</Table.Cell>
                    <Table.Cell align="right" colSpan={2}>
                        <Row gap={spacings.md}>
                            {!isTestnet(symbol) && (
                                <CoinmarketBuyButton
                                    symbol={symbol}
                                    data-testid={`@dashboard/assets/table/${symbol}/buy-button`}
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
                        renderBothRows={shouldRenderTokenRow && shouldRenderStakingRow}
                    />
                )}
                {shouldRenderTokenRow && (
                    <AssetTokenRow
                        assetTokensShownWithBalance={sortedTokens ?? []}
                        network={network}
                        tokensDisplayFiatBalance={tokensFiatBalance.toFixed()}
                    />
                )}
            </>
        );
    },
);
