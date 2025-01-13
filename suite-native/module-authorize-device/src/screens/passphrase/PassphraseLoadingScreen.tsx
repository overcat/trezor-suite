import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { VStack, Text, Spinner, SpinnerLoadingState } from '@suite-native/atoms';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { selectIsDeviceNotEmpty } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import { finishPassphraseFlow } from '@suite-native/device-authorization';
import { EventType, analytics } from '@suite-native/analytics';

import { PassphraseScreenHeader } from '../../components/passphrase/PassphraseScreenHeader';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList
>;

export const PassphraseLoadingScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const dispatch = useDispatch();

    const isDeviceNotEmpty = useSelector(selectIsDeviceNotEmpty);

    const [loadingResult, setLoadingResult] = useState<SpinnerLoadingState>('idle');

    useEffect(() => {
        if (isDeviceNotEmpty !== null) {
            setLoadingResult('success');
        }
    }, [isDeviceNotEmpty]);

    const handleSuccess = () => {
        if (isDeviceNotEmpty) {
            analytics.report({
                type: EventType.PassphraseFlowFinished,
                payload: { isEmptyWallet: false },
            });
            dispatch(finishPassphraseFlow());
        } else {
            navigation.navigate(RootStackRoutes.AuthorizeDeviceStack, {
                screen: AuthorizeDeviceStackRoutes.PassphraseEmptyWallet,
            });
        }
    };

    return (
        <Screen header={<PassphraseScreenHeader />}>
            <VStack flex={1} justifyContent="center" alignItems="center" spacing="sp32">
                <Spinner loadingState={loadingResult} onComplete={handleSuccess} />
                <VStack spacing="sp4">
                    <Text variant="titleSmall" textAlign="center">
                        <Translation id="modulePassphrase.loading.title" />
                    </Text>
                    <Text variant="body" textAlign="center" color="textSubdued">
                        <Translation id="modulePassphrase.loading.subtitle" />
                    </Text>
                </VStack>
            </VStack>
        </Screen>
    );
};
