import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import { VStack, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-native/icons';
import {
    applyDiscoveryChangesThunk,
    selectDiscoverySupportedNetworks,
    selectDeviceEnabledDiscoveryNetworkSymbols,
} from '@suite-native/discovery';

import { NetworkSymbolSwitchItem } from './NetworkSymbolSwitchItem';

type DiscoveryCoinsFilterProps = {
    allowDeselectLastCoin?: boolean; // If true, the last coin can be deselected
    allowChangeAnalytics?: boolean; // If true, analytics will be sent
};

export const DiscoveryCoinsFilter = ({
    allowDeselectLastCoin = false,
    allowChangeAnalytics = true,
}: DiscoveryCoinsFilterProps) => {
    const dispatch = useDispatch();
    const enabledNetworkSymbols = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);
    const availableNetworks = useSelector(selectDiscoverySupportedNetworks);

    useFocusEffect(
        useCallback(
            () =>
                // run on leaving the screen
                () =>
                    dispatch(applyDiscoveryChangesThunk()),
            [dispatch],
        ),
    );

    const uniqueNetworkSymbols = [...new Set(availableNetworks.map(n => n.symbol))];

    return (
        <VStack spacing="sp12">
            {uniqueNetworkSymbols.map(symbol => (
                <NetworkSymbolSwitchItem
                    key={symbol}
                    symbol={symbol}
                    isEnabled={enabledNetworkSymbols.includes(symbol)}
                    allowDeselectLastCoin={allowDeselectLastCoin}
                    allowChangeAnalytics={allowChangeAnalytics}
                />
            ))}
            <VStack paddingVertical="sp8" alignItems="center">
                <Icon name="question" color="textSubdued" size="large" />
                <Text color="textSubdued" textAlign="center">
                    <Translation id="moduleSettings.coinEnabling.bottomNote" />
                </Text>
            </VStack>
        </VStack>
    );
};
