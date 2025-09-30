import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { Button, Column, Modal, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { activateTokenThunk } from 'src/actions/wallet/token';
import { Translation } from 'src/components/suite';
import { ConfirmActionModal } from 'src/components/suite/modals/ReduxModal/DeviceContextModal/ConfirmActionModal';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

type ActivateTokenModalProps = {
    symbol: NetworkSymbol;
    contractAddress: string;
    tokenSymbol: string;
    onCancel: () => void;
};

export const ActivateTokenModal = ({
    symbol,
    contractAddress,
    tokenSymbol,
    onCancel,
}: ActivateTokenModalProps) => {
    const [isActivating, setIsActivating] = useState(false);
    const [showDeviceConfirmation, setShowDeviceConfirmation] = useState(false);

    const dispatch = useDispatch();
    const account = useSelector(selectSelectedAccount);
    const { device } = useDevice();
    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, symbol));

    const feeInfo = getConvertedOrDefaultFeeInfo({
        networkType: account?.networkType || 'stellar',
        feeInfo: rawFeeInfo,
    });

    const form = useForm<FormState>({
        mode: 'onChange',
        defaultValues: {
            selectedFee: 'normal',
        },
    });

    const {
        register,
        control,
        getValues,
        setValue,
        formState: { errors, isDirty },
        trigger,
    } = form;

    const changeFeeLevel = (level: FormState['selectedFee']) => {
        setValue('selectedFee', level);
    };

    const handleActivate = async () => {
        if (!account) return;

        setIsActivating(true);
        setShowDeviceConfirmation(true);

        try {
            const selectedFee = getValues('selectedFee');

            const result = await dispatch(activateTokenThunk({
                account,
                contractAddress,
                tokenSymbol,
                selectedFee,
            }));

            if (activateTokenThunk.fulfilled.match(result)) {
                console.log('Token activated successfully:', result.payload.serializedTx);
                onCancel(); // Close modal after successful activation
            } else {
                const error = result.payload?.error || 'Unknown error';
                console.error('Failed to activate token:', error);
            }
        } catch (error) {
            console.error('Failed to activate token:', error);
        } finally {
            setIsActivating(false);
            setShowDeviceConfirmation(false);
        }
    };

    const handleDeviceCancel = () => {
        setShowDeviceConfirmation(false);
        setIsActivating(false);
    };

    // Show device confirmation modal if in confirmation state
    if (showDeviceConfirmation && device) {
        return (
            <ConfirmActionModal
                device={device}
                title="TR_CONFIRM_ACTION_ON_YOUR"
                onCancel={handleDeviceCancel}
            />
        );
    }

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_ACTIVATE_TOKEN" values={{ token: tokenSymbol }} />}
            bottomContent={
                <Row gap={spacings.xs}>
                    <Button variant="tertiary" onClick={onCancel} isDisabled={isActivating}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                    <Button
                        onClick={handleActivate}
                        isLoading={isActivating}
                        isDisabled={!account || !device}
                    >
                        <Translation id="TR_CONTINUE" />
                    </Button>
                </Row>
            }
        >
            <Column gap={spacings.lg}>
                <Text typographyStyle="body">
                    <Translation
                        id="TR_TOKEN_ACTIVATION_DESCRIPTION"
                        values={{
                            token: tokenSymbol,
                            network: symbol.toUpperCase(),
                            reserve: '0.5 XLM'
                        }}
                    />
                </Text>

                {account && feeInfo && (
                    <Fees
                        account={account}
                        feeInfo={feeInfo}
                        register={register}
                        control={control}
                        setValue={setValue}
                        getValues={getValues}
                        errors={errors}
                        isDirty={isDirty}
                        trigger={trigger}
                        changeFeeLevel={changeFeeLevel}
                    />
                )}
            </Column>
        </Modal>
    );
};
