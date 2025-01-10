import { useSelector } from 'react-redux';

import { Box, Text, Card, RoundedIcon, Badge, BoxSkeleton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { FiatAmountFormatter } from '@suite-native/formatters';
import { AccountKey } from '@suite-common/wallet-types';
import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';

import { useDayCoinPriceChange } from '../hooks/useDayCoinPriceChange';

type CoinPriceCardProps = {
    accountKey: AccountKey;
};

type PriceChangeIndicatorProps = {
    valuePercentageChange: number | null;
};

const cardStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',
    marginHorizontal: utils.spacings.sp16,
    padding: utils.spacings.sp16,
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
}));

const cardContentStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
}));

const indicatorContainer = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: utils.spacings.sp2,
}));

const PriceChangeIndicator = ({ valuePercentageChange }: PriceChangeIndicatorProps) => {
    const { applyStyle } = useNativeStyles();

    const percentageChange = valuePercentageChange ?? 0;
    const priceHasIncreased = percentageChange >= 0;

    const icon = priceHasIncreased ? 'arrowUp' : 'arrowDown';
    const badgeVariant = priceHasIncreased ? 'greenSubtle' : 'red';
    const formattedPercentage = `${percentageChange.toPrecision(3)} %`;

    return (
        <Box style={applyStyle(indicatorContainer)}>
            <Text variant="label" color="textSubdued">
                24h change
            </Text>
            <Box justifyContent="center" alignItems="center" flexDirection="row">
                {valuePercentageChange ? (
                    <Badge
                        icon={icon}
                        iconSize="extraSmall"
                        size="medium"
                        variant={badgeVariant}
                        label={formattedPercentage}
                    />
                ) : (
                    <BoxSkeleton width={70} height={24} borderRadius={12} />
                )}
            </Box>
        </Box>
    );
};

export const CoinPriceCard = ({ accountKey }: CoinPriceCardProps) => {
    const { applyStyle } = useNativeStyles();

    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );
    const { currentValue, valuePercentageChange } = useDayCoinPriceChange(symbol);

    if (!symbol) return null;

    const coinName = getNetworkDisplaySymbolName(symbol);

    return (
        <Card style={applyStyle(cardStyle)}>
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="sp16">
                    <RoundedIcon symbol={symbol} />
                </Box>
                <Box style={applyStyle(cardContentStyle)}>
                    <Text variant="label" color="textSubdued">
                        {coinName} price
                    </Text>
                    {currentValue && (
                        <FiatAmountFormatter
                            symbol={symbol}
                            value={`${currentValue}`}
                            variant="titleSmall"
                            isDiscreetText={false}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        />
                    )}
                </Box>
            </Box>

            <PriceChangeIndicator valuePercentageChange={valuePercentageChange} />
        </Card>
    );
};
