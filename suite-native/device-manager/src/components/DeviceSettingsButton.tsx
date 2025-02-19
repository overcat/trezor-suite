import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { analytics, EventType } from '@suite-native/analytics';
import { HStack, Text } from '@suite-native/atoms';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';
import {
    DeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceAction } from './DeviceAction';

type NavigationProp = StackToStackCompositeNavigationProps<
    RootStackParamList,
    RootStackRoutes.AppTabs,
    RootStackParamList
>;

type DeviceInfoButtonProps = {
    showAsFullWidth: boolean;
};

const contentStyle = prepareNativeStyle<{ showAsFullWidth: boolean }>(
    (utils, { showAsFullWidth }) => ({
        marginRight: utils.spacings.sp4,
        extend: {
            condition: showAsFullWidth,
            style: {
                flex: 1,
                justifyContent: 'center',
            },
        },
    }),
);

export const DeviceSettingsButton = ({ showAsFullWidth }: DeviceInfoButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();
    const { setIsDeviceManagerVisible } = useDeviceManager();
    const selectedDevice = useSelector(selectSelectedDevice);

    const handleDeviceRedirect = () => {
        setIsDeviceManagerVisible(false);
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceStackRoutes.DeviceSettings,
        });
        analytics.report({
            type: EventType.DeviceManagerClick,
            payload: { action: 'deviceSettings' },
        });
    };

    if (!selectedDevice) return null;

    return (
        <DeviceAction
            testID="@device-manager/device-settings-button"
            onPress={handleDeviceRedirect}
            showAsFullWidth={showAsFullWidth}
        >
            <HStack spacing="sp8" style={applyStyle(contentStyle, { showAsFullWidth })}>
                <Icon name="gear" size="mediumLarge" />
                <Text variant="hint">
                    <Translation id="deviceManager.deviceButtons.deviceSettings" />
                </Text>
            </HStack>
        </DeviceAction>
    );
};
