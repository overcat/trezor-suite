import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';

import { A } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';
import { selectViewOnlyDevicesAccountsNetworkSymbols } from '@suite-native/device';
import { selectShouldShowCoinEnablingInitFlow } from '@suite-native/coin-enabling';
import {
    applyDiscoveryChangesThunk,
    setEnabledDiscoveryNetworkSymbols,
    setIsCoinEnablingInitFinished,
} from '@suite-native/discovery';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectIsOnboardingFinished } from '@suite-native/settings';
import { TimerId } from '@trezor/type-utils';

export const useCoinEnablingInitialCheck = () => {
    const dispatch = useDispatch();

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.CoinEnablingInit>>();

    const hasBitcoinOnlyFirmware = useSelector(selectHasBitcoinOnlyFirmware);
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const shouldShowCoinEnablingInitFlow = useSelector(selectShouldShowCoinEnablingInitFlow);
    const viewOnlyDevicesAccountsNetworkSymbols = useSelector(
        selectViewOnlyDevicesAccountsNetworkSymbols,
    );

    const wasInitScreenShown = useRef(false);

    const canShowCoinEnablingInitFlow = isOnboardingFinished && !wasInitScreenShown.current;

    useEffect(() => {
        if (shouldShowCoinEnablingInitFlow && canShowCoinEnablingInitFlow) {
            let timeoutId: TimerId;
            //if btc only device, just run discovery for btc and do not show the UI
            if (hasBitcoinOnlyFirmware) {
                // discoveryMiddleware ensures that BTC is enabled for devices with BTC-only firmware
                dispatch(setIsCoinEnablingInitFinished(true));
                dispatch(applyDiscoveryChangesThunk());
            } else {
                // if there are remembered accounts, enable its networks before showing UI
                if (A.isNotEmpty(viewOnlyDevicesAccountsNetworkSymbols)) {
                    dispatch(
                        setEnabledDiscoveryNetworkSymbols(viewOnlyDevicesAccountsNetworkSymbols),
                    );
                }
                timeoutId = setTimeout(() => {
                    wasInitScreenShown.current = true;
                    navigation.navigate(RootStackRoutes.CoinEnablingInit);
                }, 2000);
            }

            return () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
        }
    }, [
        dispatch,
        hasBitcoinOnlyFirmware,
        navigation,
        viewOnlyDevicesAccountsNetworkSymbols,
        shouldShowCoinEnablingInitFlow,
        canShowCoinEnablingInitFlow,
    ]);
};
