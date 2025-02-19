import { useEffect, ReactNode } from 'react';

import { notificationsActions } from '@suite-common/toast-notifications';
import {
    Tooltip,
    NewModal,
    Banner,
    NewModalProps,
    Paragraph,
    Row,
    Column,
    Card,
} from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { selectSelectedDevice, selectSelectedDeviceLabelOrName } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { palette, spacings } from '@trezor/theme';
import { ConfirmOnDevice } from '@trezor/product-components';

import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { QrCode } from 'src/components/suite/QrCode';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Translation } from 'src/components/suite';
import { MODAL } from 'src/actions/suite/constants';
import { DisplayMode, ThunkAction } from 'src/types/suite';

import { TransactionReviewStepIndicator } from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewStepIndicator';
import { TransactionReviewOutputElement } from '../TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputElement';

export interface ConfirmValueModalProps
    extends Pick<NewModalProps, 'onCancel' | 'heading' | 'description'> {
    account: Account;
    copyButtonText: ReactNode;
    stepLabel: ReactNode;
    confirmStepLabel: ReactNode;
    'data-testid'?: string;
    isConfirmed?: boolean;
    validateOnDevice: () => ThunkAction;
    value: string;
    displayMode: DisplayMode;
}

export const ConfirmValueModal = ({
    account,
    copyButtonText,
    'data-testid': copyButtonDataTest,
    stepLabel,
    confirmStepLabel,
    heading,
    description,
    isConfirmed,
    onCancel,
    validateOnDevice,
    value,
    displayMode,
}: ConfirmValueModalProps) => {
    const device = useSelector(selectSelectedDevice);
    const modalContext = useSelector(state => state.modal.context);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const deviceLabel = useSelector(selectSelectedDeviceLabelOrName);
    const dispatch = useDispatch();

    const canConfirmOnDevice = !!(device?.connected && device?.available);
    const addressConfirmed = isConfirmed || !canConfirmOnDevice;
    const isCancelable = isActionAbortable || addressConfirmed;
    const state = addressConfirmed ? 'success' : 'active';
    const outputLines = [
        {
            id: 'address',
            label: stepLabel,
            value,
            plainValue: true,
            confirmLabel: confirmStepLabel,
        },
    ];

    const copy = () => {
        const result = copyToClipboard(value);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    };

    const buttonTooltipContent = () => {
        if (!addressConfirmed) {
            return <Translation id="TR_CONFIRM_BEFORE_COPY" />;
        }

        return null;
    };

    // Device connected while the modal is open -> validate on device.
    useEffect(() => {
        if (canConfirmOnDevice && modalContext === MODAL.CONTEXT_USER && !isConfirmed) {
            dispatch(validateOnDevice());
        }
    }, [canConfirmOnDevice, dispatch, isConfirmed, modalContext, validateOnDevice]);

    // QR code needs constant colors, not light/dark theme colors
    const qrCodeFgColor = addressConfirmed ? palette.lightGray1000 : palette.lightGray700;

    return (
        <NewModal.Backdrop onClick={isCancelable ? onCancel : undefined}>
            {canConfirmOnDevice && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={device.features?.internal_model}
                    deviceUnitColor={device?.features?.unit_color}
                    isConfirmed={isConfirmed}
                />
            )}
            <NewModal.ModalBase
                heading={heading}
                description={description}
                onCancel={isCancelable ? onCancel : undefined}
            >
                <Column gap={spacings.xl}>
                    {!device?.connected && (
                        <Banner icon="warningTriangle" variant="warning">
                            <Paragraph typographyStyle="hint">
                                <Translation
                                    id="TR_DEVICE_LABEL_IS_NOT_CONNECTED"
                                    values={{ deviceLabel }}
                                />
                            </Paragraph>
                            <Paragraph typographyStyle="label">
                                <Translation id="TR_PLEASE_CONNECT_YOUR_DEVICE" />
                            </Paragraph>
                        </Banner>
                    )}
                    <Row gap={spacings.xl} alignItems="stretch">
                        <Column flex="1 1 50%" alignItems="center">
                            <Card>
                                <QrCode
                                    value={value}
                                    bgColor="transparent"
                                    fgColor={qrCodeFgColor}
                                    showMessage={!addressConfirmed}
                                />
                            </Card>
                        </Column>
                        <Column flex="1 1 50%" justifyContent="space-between" gap={spacings.lg}>
                            <TransactionReviewOutputElement
                                indicator={
                                    <TransactionReviewStepIndicator state={state} size={16} />
                                }
                                lines={outputLines}
                                state={state}
                                account={account}
                                displayMode={displayMode}
                            />
                            <Tooltip content={buttonTooltipContent()}>
                                <NewModal.Button
                                    isDisabled={!addressConfirmed}
                                    onClick={copy}
                                    data-testid={copyButtonDataTest}
                                    isFullWidth
                                >
                                    {copyButtonText}
                                </NewModal.Button>
                            </Tooltip>
                        </Column>
                    </Row>
                </Column>
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
