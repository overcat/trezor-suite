import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    Screen,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    deviceActions,
    selectSelectedDevice,
    selectIsDeviceConnectedAndAuthorized,
    selectHasDeviceDiscovery,
} from '@suite-common/wallet-core';
import { useHandlePassphraseMismatch } from '@suite-native/device-authorization';

import { ConfirmOnTrezorAnimation } from '../../components/passphrase/ConfirmOnTrezorAnimation';
import { PassphraseScreenHeader } from '../../components/passphrase/PassphraseScreenHeader';
import { useRedirectOnPassphraseCompletion } from '../../useRedirectOnPassphraseCompletion';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PassphraseConfirmOnTrezor,
    RootStackParamList
>;

export const PassphraseConfirmOnTrezorScreen = () => {
    const dispatch = useDispatch();

    const navigation = useNavigation<NavigationProp>();

    const isDeviceConnectedAndAuthorized = useSelector(selectIsDeviceConnectedAndAuthorized);
    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const device = useSelector(selectSelectedDevice);

    // If this screen was present during authorizing device with passphrase for some feature,
    // on success, this hook will close the stack and go back
    useRedirectOnPassphraseCompletion();

    useHandlePassphraseMismatch();

    useEffect(() => {
        if (isDeviceConnectedAndAuthorized && hasDiscovery) {
            navigation.navigate(AuthorizeDeviceStackRoutes.PassphraseLoading);
            dispatch(
                deviceActions.removeButtonRequests({
                    device,
                    buttonRequestCode: 'ButtonRequest_Other',
                }),
            );
        }
    }, [device, dispatch, isDeviceConnectedAndAuthorized, hasDiscovery, navigation]);

    return (
        <Screen header={<PassphraseScreenHeader />}>
            <VStack
                spacing="sp24"
                alignItems="center"
                justifyContent="center"
                flex={1}
                padding="sp8"
            >
                <ConfirmOnTrezorAnimation />
                <CenteredTitleHeader
                    title={<Translation id="modulePassphrase.confirmOnDevice.title" />}
                    subtitle={<Translation id="modulePassphrase.confirmOnDevice.description" />}
                />
            </VStack>
        </Screen>
    );
};
