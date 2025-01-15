import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import {
    ScreenHeader,
    SendStackParamList,
    SendStackRoutes,
    StackProps,
} from '@suite-native/navigation';
import { Box, VStack, Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';

import {
    selectIsReceiveAddressOutputConfirmed,
    selectIsTransactionReviewInProgress,
} from '../selectors';
import { AddressReviewStepList } from '../components/AddressReviewStepList';
import { SendScreen } from '../components/SendScreen';
import { SendConfirmOnDeviceImage } from '../components/SendConfirmOnDeviceImage';

export const SendAddressReviewScreen = ({
    route,
    navigation,
}: StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>) => {
    const { accountKey, tokenContract } = route.params;
    const { translate } = useTranslate();

    const isAddressConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsReceiveAddressOutputConfirmed(state, accountKey, tokenContract),
    );

    const isTransactionReviewInProgress = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsTransactionReviewInProgress(state, accountKey, tokenContract),
    );

    useEffect(() => {
        if (isAddressConfirmed) {
            navigation.navigate(SendStackRoutes.SendOutputsReview, { accountKey, tokenContract });
        }
    }, [isAddressConfirmed, accountKey, navigation, tokenContract]);

    return (
        <SendScreen
            screenHeader={
                <ScreenHeader
                    content={translate('moduleSend.review.outputs.title')}
                    closeActionType={isTransactionReviewInProgress ? 'close' : 'back'}
                />
            }
            // TODO: improve the illustration: https://github.com/trezor/trezor-suite/issues/13965
            footer={isTransactionReviewInProgress && <SendConfirmOnDeviceImage />}
        >
            <Box flex={1} justifyContent="space-between" marginTop="sp16">
                <VStack justifyContent="center" alignItems="center" spacing="sp24">
                    <Text variant="titleSmall">
                        <Translation id="moduleSend.review.address.title" />
                    </Text>
                    <AddressReviewStepList />
                </VStack>
            </Box>
        </SendScreen>
    );
};
