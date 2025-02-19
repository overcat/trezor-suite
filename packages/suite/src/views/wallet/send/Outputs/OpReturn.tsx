import styled from 'styled-components';

import { Textarea, IconButton, Row, Tooltip, variables } from '@trezor/components';
import { getInputState, isHexValid } from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { spacingsPx } from '@trezor/theme';

import { useSendFormContext } from 'src/hooks/wallet';
import { Translation } from 'src/components/suite';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { useTranslation } from 'src/hooks/suite';

const Inputs = styled.div`
    display: flex;
    place-items: center space-between;
    align-items: end;
    margin-top: ${spacingsPx.md};

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        flex-direction: column;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledTextarea = styled(Textarea)`
    > :nth-child(1) {
        border-color: ${({ theme }) => theme.borderElevation2};
    }
`;

const Space = styled.div`
    display: flex;
    justify-content: center;
    min-width: 65px;
    align-self: center;
    padding-bottom: ${spacingsPx.lg};
`;

export const OpReturn = ({ outputId }: { outputId: number }) => {
    const {
        register,
        outputs,
        getDefaultValue,
        setValue,
        formState: { errors },
        composeTransaction,
        removeOpReturn,
    } = useSendFormContext();

    const { translationString } = useTranslation();

    const inputAsciiName = `outputs.${outputId}.dataAscii` as const;
    const inputHexName = `outputs.${outputId}.dataHex` as const;

    const asciiValue = getDefaultValue(inputAsciiName, outputs[outputId].dataAscii || '');
    const hexValue = getDefaultValue(inputHexName, outputs[outputId].dataHex || '');

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const asciiError = outputError ? outputError.dataAscii : undefined;
    const hexError = outputError ? outputError.dataHex : undefined;

    const { ref: asciiRef, ...asciiField } = register(inputAsciiName, {
        onChange: event => {
            setValue(inputHexName, Buffer.from(event.target.value, 'ascii').toString('hex'), {
                shouldValidate: true,
            });
            composeTransaction(inputAsciiName);
        },
        required: translationString('DATA_NOT_SET'),
    });
    const { ref: hexRef, ...hexField } = register(inputHexName, {
        onChange: event => {
            setValue(
                inputAsciiName,
                !hexError ? Buffer.from(event.target.value, 'hex').toString('ascii') : '',
            );
            composeTransaction(inputHexName);
        },
        required: translationString('DATA_NOT_SET'),
        validate: (value = '') => {
            if (!isHexValid(value)) return translationString('DATA_NOT_VALID_HEX');
            if (value.length > 80 * 2) return translationString('DATA_HEX_TOO_BIG');
        },
    });

    return (
        <div>
            <Row justifyContent="space-between">
                <Tooltip
                    addon={
                        <OpenGuideFromTooltip id="/3_send-and-receive/transactions-in-depth/op_return.md" />
                    }
                    content={<Translation id="OP_RETURN_TOOLTIP" />}
                    hasIcon
                >
                    <Translation id="OP_RETURN_ADD" />
                </Tooltip>

                <IconButton
                    variant="tertiary"
                    icon="x"
                    onClick={() => removeOpReturn(outputId)}
                    size="small"
                />
            </Row>

            <Inputs>
                <StyledTextarea
                    inputState={getInputState(asciiError)}
                    data-testid={inputAsciiName}
                    defaultValue={asciiValue}
                    maxLength={formInputsMaxLength.opReturn}
                    bottomText={asciiError?.message || null}
                    label={<Translation id="OP_RETURN" />}
                    innerRef={asciiRef}
                    {...asciiField}
                />
                <Space> = </Space>
                <StyledTextarea
                    inputState={getInputState(hexError)}
                    data-testid={inputHexName}
                    defaultValue={hexValue}
                    maxLength={formInputsMaxLength.opReturn}
                    bottomText={hexError?.message || null}
                    innerRef={hexRef}
                    {...hexField}
                />
            </Inputs>
        </div>
    );
};
