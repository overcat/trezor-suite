import { useCallback, useEffect, useRef, useState } from 'react';

import { checkAddressCheckSum, toChecksumAddress } from 'web3-utils';
import styled from 'styled-components';

import { Input, Button, IconButton, Icon, Link, Row } from '@trezor/components';
import { capitalizeFirstLetter } from '@trezor/utils';
import * as URLS from '@trezor/urls';
import { notificationsActions } from '@suite-common/toast-notifications';
import { formInputsMaxLength } from '@suite-common/validators';
import type { Output } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';
import {
    isAddressValid,
    isAddressDeprecated,
    isTaprootAddress,
    isBech32AddressUppercase,
    getInputState,
    checkIsAddressNotUsedNotChecksummed,
} from '@suite-common/wallet-utils';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { spacings } from '@trezor/theme';
import { CoinLogo } from '@trezor/product-components';
import {
    HELP_CENTER_EVM_ADDRESS_CHECKSUM,
    HELP_CENTER_EVM_SEND_TO_CONTRACT_URL,
} from '@trezor/urls';

import { scanOrRequestSendFormThunk } from 'src/actions/wallet/send/sendFormThunks';
import { useSendFormContext } from 'src/hooks/wallet';
import { getProtocolInfo } from 'src/utils/suite/protocol';
import { InputError } from 'src/components/wallet';
import { InputErrorProps } from 'src/components/wallet/InputError';
import { AddressLabeling, MetadataLabeling } from 'src/components/suite';
import { useSelector, useDevice, useDispatch, useTranslation } from 'src/hooks/suite';
import { captureSentryMessage } from 'src/utils/suite/sentry';

import { Translation } from '../../../../components/suite/Translation';

const Container = styled.div`
    position: relative;
`;

const Text = styled.span`
    display: flex;
    align-items: center;

    > div {
        margin-left: 4px;
    }
`;

const MetadataLabelingWrapper = styled.div`
    max-width: 200px;
`;
interface AddressProps {
    outputId: number;
    outputsCount: number;
    output: Partial<Output>;
}

export const Address = ({ output, outputId, outputsCount }: AddressProps) => {
    const [addressDeprecatedUrl, setAddressDeprecatedUrl] =
        useState<ReturnType<typeof isAddressDeprecated>>(undefined);
    const [hasAddressChecksummed, setHasAddressChecksummed] = useState<boolean | undefined>();
    const contractAddressWarningDismissed = useRef(false);
    const dispatch = useDispatch();
    const { device } = useDevice();
    const {
        account,
        removeOutput,
        composeTransaction,
        register,
        getDefaultValue,
        formState: { errors },
        setValue,
        metadataEnabled,
        watch,
        setDraftSaveRequest,
        trigger,
    } = useSendFormContext();
    const { translationString } = useTranslation();
    const { descriptor, networkType, symbol } = account;
    const inputName = `outputs.${outputId}.address` as const;
    // NOTE: compose errors are always associated with the amount.
    // If address is not valid then compose process will never be triggered,
    // however if address is changed compose process may return `AMOUNT_IS_NOT_ENOUGH` which should appear under the amount filed.
    const amountInputName = `outputs.${outputId}.amount` as const;
    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const addressError = outputError ? outputError.address : undefined;
    const addressValue = getDefaultValue(inputName, output.address || '');
    const recipientId = outputId + 1;
    const label = watch(`outputs.${outputId}.label`, '');
    const address = watch(inputName);
    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');
    const isOnline = useSelector(state => state.suite.online);

    const isContractAddressWarningEnabled = ['eth', 'tsep', 'thol'].includes(symbol);

    useEffect(() => {
        contractAddressWarningDismissed.current = false;
    }, [address]);

    const getInputErrorState = () => {
        if (hasAddressChecksummed && !addressError) {
            return 'default';
        }
        if (addressError) {
            return getInputState(addressError);
        }

        return undefined;
    };

    const handleQrClick = useCallback(async () => {
        const uri = await dispatch(scanOrRequestSendFormThunk()).unwrap();

        if (typeof uri !== 'string') {
            return;
        }

        const protocol = getProtocolInfo(uri);

        if (protocol && 'error' in protocol) {
            dispatch(
                notificationsActions.addToast({
                    type: 'qr-unknown-scheme-protocol',
                    scheme: protocol.scheme,
                    error: protocol.error,
                }),
            );

            captureSentryMessage(`QR code with unknown scheme: ${protocol.scheme}`);

            return;
        }

        if (protocol && 'scheme' in protocol) {
            const isSymbolValidProtocol = getNetworkSymbolForProtocol(protocol.scheme) === symbol; //is protocol valid for this account network
            if (!isSymbolValidProtocol) {
                dispatch(
                    notificationsActions.addToast({
                        type: 'qr-incorrect-coin-scheme-protocol',
                        coin: capitalizeFirstLetter(protocol.scheme),
                    }),
                );

                return;
            }

            setValue(inputName, protocol.address, { shouldValidate: true });

            if (protocol.amount) {
                setValue(amountInputName, String(protocol.amount), {
                    shouldValidate: true,
                });
            }

            composeTransaction(amountInputName);

            return;
        }

        if (isAddressValid(uri, symbol)) {
            setValue(inputName, uri, { shouldValidate: true });

            composeTransaction(inputName);
        } else {
            dispatch(notificationsActions.addToast({ type: 'qr-incorrect-address' }));
        }
    }, [amountInputName, composeTransaction, dispatch, inputName, setValue, symbol]);

    const getInputErrorProps = (): {
        learnMoreUrl?: InputErrorProps['learnMoreUrl'];
        buttonProps?: InputErrorProps['buttonProps'];
    } => {
        switch (addressError?.type) {
            case 'deprecated':
                return {
                    learnMoreUrl: addressDeprecatedUrl ? URLS[addressDeprecatedUrl] : undefined,
                };
            case 'evmchecks':
                if (!checkAddressCheckSum(address)) {
                    return {
                        buttonProps: {
                            onClick: () => {
                                setValue(inputName, toChecksumAddress(address), {
                                    shouldValidate: true,
                                });

                                setHasAddressChecksummed(true);
                            },
                            text: translationString('TR_CONVERT_TO_CHECKSUM_ADDRESS'),
                        },
                    };
                }
                if (!contractAddressWarningDismissed.current) {
                    return {
                        buttonProps: {
                            onClick: () => {
                                contractAddressWarningDismissed.current = true;
                                trigger(inputName);
                            },
                            text: translationString('TR_I_UNDERSTAND_THE_RISK'),
                        },
                        learnMoreUrl: HELP_CENTER_EVM_SEND_TO_CONTRACT_URL,
                    };
                }

                return {};
            case 'uppercase':
                return {
                    buttonProps: {
                        onClick: () =>
                            setValue(inputName, address.toLowerCase(), {
                                shouldValidate: true,
                            }),
                        text: translationString('TR_CONVERT_TO_LOWERCASE'),
                    },
                };
            default:
                return {};
        }
    };

    const { ref: inputRef, ...inputField } = register(inputName, {
        onChange: () => {
            composeTransaction(amountInputName);
            setHasAddressChecksummed(false);
        },
        required: translationString('RECIPIENT_IS_NOT_SET'),
        validate: {
            deprecated: (value: string) => {
                const url = isAddressDeprecated(value, symbol);
                if (url) {
                    setAddressDeprecatedUrl(url);

                    return translationString('TR_UNSUPPORTED_ADDRESS_FORMAT');
                }
            },
            valid: (value: string) => {
                if (!isAddressValid(value, symbol)) {
                    return translationString('RECIPIENT_IS_NOT_VALID');
                }
            },
            // bech32m/Taproot addresses are valid but may not be supported by older FW
            firmware: (value: string) => {
                if (
                    networkType === 'bitcoin' &&
                    isTaprootAddress(value, symbol) &&
                    device?.unavailableCapabilities?.taproot
                ) {
                    return translationString('RECIPIENT_REQUIRES_UPDATE');
                }
            },
            // bech32 addresses are valid as uppercase but are not accepted by Trezor
            uppercase: (value: string) => {
                if (networkType === 'bitcoin' && isBech32AddressUppercase(value)) {
                    return translationString('RECIPIENT_IS_NOT_VALID');
                }
            },
            evmchecks: async (address: string) => {
                if (networkType === 'ethereum') {
                    if (!isOnline) {
                        return translationString('TR_ETH_ADDRESS_CANT_VERIFY_HISTORY');
                    }
                    const params = {
                        descriptor: address,
                        coin: symbol,
                    };
                    const result = await TrezorConnect.getAccountInfo(params);

                    if (!result.success) {
                        return translationString('TR_ETH_ADDRESS_CANT_VERIFY_HISTORY');
                    }

                    const { payload } = result;

                    // 1. Validate address checksum.
                    // Eth addresses are valid without checksum but Trezor displays them as checksummed.
                    if (!checkAddressCheckSum(address)) {
                        const checksumAndUsageValidationResult =
                            checkIsAddressNotUsedNotChecksummed(
                                address,
                                payload.history,
                                inputName,
                                setValue,
                                setHasAddressChecksummed,
                            );
                        if (checksumAndUsageValidationResult) {
                            return translationString('TR_ETH_ADDRESS_NOT_USED_NOT_CHECKSUMMED');
                        }
                    }

                    // 2. Check if address is a contract address (right now only for Eth, Holesky and Sepolia)
                    if (
                        !contractAddressWarningDismissed.current &&
                        isContractAddressWarningEnabled
                    ) {
                        const isContract = payload.misc?.contractInfo;
                        if (isContract) {
                            return translationString('TR_EVM_ADDRESS_IS_CONTRACT');
                        }
                    }
                }
            },
            rippleToSelf: (value: string) => {
                if (networkType === 'ripple' && value === descriptor) {
                    return translationString('RECIPIENT_CANNOT_SEND_TO_MYSELF');
                }
            },
        },
    });

    // Required for the correct functionality of bottom text in the input.
    const addressLabelComponent = (
        <AddressLabeling address={addressValue} knownOnly symbol={symbol} />
    );
    const isAddressWithLabel = !!addressLabelComponent.type({
        symbol,
        address: addressValue,
        knownOnly: true,
    });
    const addressBottomText = isAddressWithLabel ? addressLabelComponent : null;

    const getBottomText = () => {
        if (hasAddressChecksummed && !addressError) {
            return (
                <Row width="100%" justifyContent="flex-start" gap={spacings.xs}>
                    <Translation
                        id="TR_CHECKSUM_CONVERSION_INFO"
                        values={{
                            a: chunks => (
                                <Link
                                    href={HELP_CENTER_EVM_ADDRESS_CHECKSUM}
                                    variant="nostyle"
                                    icon="arrowUpRight"
                                    typographyStyle="label"
                                >
                                    {chunks}
                                </Link>
                            ),
                        }}
                    />
                </Row>
            );
        }
        if (addressError) {
            return <InputError message={addressError.message} {...getInputErrorProps()} />;
        }

        return addressBottomText;
    };

    const getBottomTextIconComponent = () => {
        if (hasAddressChecksummed && !addressError) {
            return <Icon name="check" size="medium" variant="disabled" />;
        }

        if (isAddressWithLabel) {
            return <CoinLogo symbol={symbol} size={16} />;
        }

        if (addressError) {
            return <Icon name="warningCircle" size="medium" variant="destructive" />;
        }

        return undefined;
    };

    return (
        <Container>
            <Input
                inputState={getInputErrorState()}
                innerAddon={
                    metadataEnabled && broadcastEnabled ? (
                        <MetadataLabelingWrapper>
                            <MetadataLabeling
                                defaultVisibleValue=""
                                payload={{
                                    type: 'outputLabel',
                                    entityKey: account.key,
                                    // txid is not known at this moment. metadata is only saved
                                    // along with other sendForm data and processed in sendFormActions.
                                    txid: 'will-be-replaced',
                                    outputIndex: outputId,
                                    defaultValue: `${outputId}`,
                                    value: label,
                                }}
                                onSubmit={(value: string | undefined) => {
                                    setValue(`outputs.${outputId}.label`, value || '');
                                    setDraftSaveRequest(true);
                                }}
                                visible
                            />
                        </MetadataLabelingWrapper>
                    ) : undefined
                }
                label={
                    <Text>
                        <Translation id="RECIPIENT_ADDRESS" />
                    </Text>
                }
                labelHoverRight={
                    <Button variant="tertiary" size="tiny" icon="qrCode" onClick={handleQrClick}>
                        <Translation id="RECIPIENT_SCAN" />
                    </Button>
                }
                labelLeft={
                    <p>
                        <Translation
                            id={
                                outputsCount > 1
                                    ? 'TR_SEND_RECIPIENT_ADDRESS'
                                    : 'TR_SEND_ADDRESS_SECTION'
                            }
                            values={{ index: recipientId }}
                        />
                    </p>
                }
                labelRight={
                    outputsCount > 1 ? (
                        <IconButton
                            icon="x"
                            size="tiny"
                            variant="tertiary"
                            data-testid={`outputs.${outputId}.remove`}
                            onClick={() => {
                                removeOutput(outputId);
                                // compose by first Output
                                composeTransaction();
                            }}
                        />
                    ) : undefined
                }
                bottomText={getBottomText()}
                bottomTextIconComponent={getBottomTextIconComponent()}
                data-testid={inputName}
                defaultValue={addressValue}
                maxLength={formInputsMaxLength.address}
                innerRef={inputRef}
                {...inputField}
            />
        </Container>
    );
};
