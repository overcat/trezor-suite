import { Dimensions, GestureResponderEvent, Modal, Pressable, StatusBar } from 'react-native';
import { ReactNode } from 'react';
import { useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { ScreenHeaderWrapper, Box, HStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { selectDeviceState } from '@suite-common/wallet-core';
import { nativeBorders } from '@trezor/theme';

import { useDeviceManager } from '../hooks/useDeviceManager';
import { DeviceItemContent } from './DeviceItem/DeviceItemContent';

type DeviceManagerModalProps = {
    children: ReactNode;
    customSwitchRightView?: ReactNode;
    onClose?: () => void;
};

export const MANAGER_MODAL_BOTTOM_RADIUS = nativeBorders.radii.r12;

const SCREEN_SIZE = Dimensions.get('screen');

const modalBackgroundOverlayStyle = prepareNativeStyle(utils => ({
    flex: 1,
    backgroundColor: utils.transparentize(0.3, utils.colors.backgroundNeutralBold),
    // this need to be here so the background does not stretch out when appearing
    // new RN architecture might fix this, so evaluate later
    width: SCREEN_SIZE.width,
    height: SCREEN_SIZE.height,
}));

const deviceManagerModalWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
    maxHeight: '80%', // based on the design
}));

const deviceSwitchWrapperStyle = prepareNativeStyle<{ insets: EdgeInsets }>(
    (utils, { insets }) => ({
        paddingTop: insets.top + (StatusBar.currentHeight ?? 0),
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        borderBottomLeftRadius: MANAGER_MODAL_BOTTOM_RADIUS,
        borderBottomRightRadius: MANAGER_MODAL_BOTTOM_RADIUS,
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors.borderElevation0,
        zIndex: 20,
        ...utils.boxShadows.small,
    }),
);

export const DeviceManagerModal = ({
    children,
    customSwitchRightView,
    onClose,
}: DeviceManagerModalProps) => {
    const { applyStyle } = useNativeStyles();
    const deviceState = useSelector(selectDeviceState);

    const insets = useSafeAreaInsets();

    const { setIsDeviceManagerVisible, isDeviceManagerVisible } = useDeviceManager();

    const handleClose = () => {
        onClose?.();
        setIsDeviceManagerVisible(false);
    };

    const handlePressOutside = (event: GestureResponderEvent) => {
        if (event.target === event.currentTarget) handleClose();
    };

    return (
        <Modal
            transparent
            onRequestClose={handleClose}
            visible={isDeviceManagerVisible}
            presentationStyle="overFullScreen"
            animationType="fade"
            statusBarTranslucent={true}
        >
            <Pressable style={applyStyle(modalBackgroundOverlayStyle)} onPress={handlePressOutside}>
                <Animated.View
                    entering={SlideInUp.damping(30)}
                    style={applyStyle(deviceManagerModalWrapperStyle, { insets })}
                >
                    <Box style={applyStyle(deviceSwitchWrapperStyle, { insets })}>
                        <Pressable onPress={handleClose}>
                            <ScreenHeaderWrapper>
                                <HStack
                                    justifyContent="space-between"
                                    alignItems="center"
                                    spacing="sp16"
                                    flex={1}
                                >
                                    {deviceState && (
                                        <Box flexShrink={1}>
                                            <DeviceItemContent
                                                deviceState={deviceState}
                                                headerTextVariant="titleSmall"
                                                isCompact={false}
                                            />
                                        </Box>
                                    )}

                                    {customSwitchRightView}
                                </HStack>
                            </ScreenHeaderWrapper>
                        </Pressable>
                    </Box>

                    <Animated.View entering={FadeIn}>{children}</Animated.View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
};
