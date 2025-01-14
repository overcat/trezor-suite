import { MouseEventHandler, ReactNode } from 'react';

import styled, { css, useTheme } from 'styled-components';

import { formatNetworkAmount, isSameUtxo } from '@suite-common/wallet-utils';
import { Checkbox, Row, Spinner, TextButton, Tooltip } from '@trezor/components';
import { AccountUtxo } from '@trezor/connect';
import { borders, spacings, spacingsPx, typography } from '@trezor/theme';
import { CheckContainer } from '@trezor/components/src/components/form/Checkbox/Checkbox';

import { openModal } from 'src/actions/suite/modalActions';
import {
    FiatValue,
    FormattedCryptoAmount,
    MetadataLabeling,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { TransactionTimestamp, UtxoAnonymity } from 'src/components/wallet';
import { useSendFormContext } from 'src/hooks/wallet';
import { useCoinjoinUnavailableUtxos } from 'src/hooks/wallet/form/useCoinjoinUnavailableUtxos';
import { WalletAccountTransaction } from 'src/types/wallet';
import {
    selectIsLabelingInitPossible,
    selectLabelingDataForSelectedAccount,
} from 'src/reducers/suite/metadataReducer';

import { UtxoTag } from './UtxoTag';

const transitionSpeed = '0.16s';

const ROW_GAP = spacings.xxs;

const LabelPart = styled.div`
    display: flex;
    align-items: center;
    gap: ${ROW_GAP};
    color: ${({ theme }) => theme.textSubdued};
    overflow: hidden;
`;

const DetailPartVisibleOnHover = styled.div<{ $alwaysVisible?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${ROW_GAP};
    color: ${({ theme }) => theme.textSubdued};

    ${({ $alwaysVisible }) =>
        !$alwaysVisible &&
        css`
            opacity: 0;
            transition: opacity ${transitionSpeed};
        `};
`;

const Wrapper = styled.div<{ $isChecked: boolean; $isDisabled: boolean }>`
    align-items: flex-start;
    border-radius: ${borders.radii.xs};
    display: flex;
    margin: 1px -${spacingsPx.sm};
    padding: ${spacingsPx.sm} ${spacingsPx.sm} ${spacingsPx.xs};
    transition: background ${transitionSpeed};
    cursor: pointer;

    ${({ $isDisabled }) =>
        $isDisabled &&
        css`
            color: ${({ theme }) => theme.textSubdued};
            cursor: default;
        `};

    &:hover,
    &:focus-within {
        background: ${({ $isDisabled, theme }) =>
            !$isDisabled && theme.backgroundSurfaceElevation2};

        ${({ $isChecked, $isDisabled }) =>
            !$isChecked &&
            !$isDisabled &&
            css`
                ${CheckContainer} {
                    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
                    border-color: ${({ theme }) => theme.borderFocus};
                }
            `};

        ${DetailPartVisibleOnHover} {
            opacity: 1;
        }
    }
`;

const Body = styled.div`
    flex-grow: 1;

    /* prevent overflow if contents (e.g. label) are too long */
    min-width: 0;
`;

const Address = styled.div`
    overflow: hidden;
    font-variant-numeric: tabular-nums slashed-zero;
    text-overflow: ellipsis;
`;

const StyledCryptoAmount = styled(FormattedCryptoAmount)`
    margin-left: auto;
    padding-left: ${spacingsPx.xxs};
    white-space: nowrap;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const TransactionDetailButton = styled(TextButton)`
    color: ${({ theme }) => theme.textSubdued};

    &:hover,
    &:focus {
        color: ${({ theme }) => theme.textOnTertiary};
    }
`;

const StyledFiatValue = styled(FiatValue)`
    margin-left: auto;
    padding-left: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

type ResolveUtxoSpendableProps = {
    utxo: AccountUtxo;
    coinjoinRegisteredUtxos: AccountUtxo[];
};

// Same as MINIMAL_COINBASE_CONFIRMATIONS in '@trezor/utxo-lib'; It is redeclared here to avoid
// some magic import/export errors. This is very niche stuff and probably never changes.
// Also, this most probably bothers only developers on Regtest.
const MINIMAL_COINBASE_CONFIRMATIONS = 100;

const resolveUtxoSpendable = ({
    utxo,
    coinjoinRegisteredUtxos,
}: ResolveUtxoSpendableProps): ReactNode | null => {
    if (utxo.coinbase === true && utxo.confirmations < MINIMAL_COINBASE_CONFIRMATIONS) {
        return (
            <Translation
                id="TR_UTXO_NOT_MATURED_COINBASE"
                values={{ confirmations: MINIMAL_COINBASE_CONFIRMATIONS }}
            />
        );
    }

    if (coinjoinRegisteredUtxos.includes(utxo)) {
        return <Translation id="TR_UTXO_REGISTERED_IN_COINJOIN" />;
    }

    return null;
};

type UtxoSelectionProps = {
    transaction?: WalletAccountTransaction;
    utxo: AccountUtxo;
};

export const UtxoSelection = ({ transaction, utxo }: UtxoSelectionProps) => {
    const {
        account,
        network,
        utxoSelection: {
            selectedUtxos,
            coinjoinRegisteredUtxos,
            composedInputs,
            toggleUtxoSelection,
            isCoinControlEnabled,
        },
    } = useSendFormContext();
    // selecting metadata from store rather than send form context which does not update on metadata change
    const { outputLabels } = useSelector(selectLabelingDataForSelectedAccount);

    const dispatch = useDispatch();

    const theme = useTheme();

    const coinjoinUnavailableMessage = useCoinjoinUnavailableUtxos({ account, utxo });
    const isPendingTransaction = utxo.confirmations === 0;
    const isChangeAddress = utxo.path.split('/').at(-2) === '1'; // change address always has a 1 on the penultimate level of the derivation path
    const outputLabel = outputLabels?.[utxo.txid]?.[utxo.vout];

    const isLabelingPossible = useSelector(selectIsLabelingInitPossible);
    const anonymity = account.addresses?.anonymitySet?.[utxo.address];

    const isChecked = isCoinControlEnabled
        ? selectedUtxos.some(selected => isSameUtxo(selected, utxo))
        : composedInputs.some(u => u.prev_hash === utxo.txid && u.prev_index === utxo.vout);

    const unspendableTooltip = resolveUtxoSpendable({ utxo, coinjoinRegisteredUtxos });
    const isDisabled = unspendableTooltip !== null;

    const utxoTagIconColor = isDisabled
        ? theme.legacy.TYPE_LIGHT_GREY
        : theme.legacy.TYPE_DARK_GREY;

    const handleCheckbox = () => toggleUtxoSelection(utxo);
    const showTransactionDetail: MouseEventHandler = e => {
        e.stopPropagation(); // do not trigger the checkbox
        if (transaction) {
            dispatch(openModal({ type: 'transaction-detail', tx: transaction }));
        }
    };

    return (
        <Wrapper
            $isChecked={isChecked}
            $isDisabled={isDisabled}
            onClick={isDisabled ? undefined : handleCheckbox}
        >
            <Tooltip content={unspendableTooltip}>
                <Checkbox
                    isChecked={isChecked}
                    isDisabled={isDisabled}
                    onClick={handleCheckbox}
                    margin={{ top: spacings.xxxs, right: spacings.xs }}
                />
            </Tooltip>

            <Body>
                <Row gap={ROW_GAP}>
                    {isPendingTransaction && (
                        <UtxoTag
                            tooltipMessage={<Translation id="TR_IN_PENDING_TRANSACTION" />}
                            icon="clock"
                            iconColor={utxoTagIconColor}
                        />
                    )}

                    {coinjoinUnavailableMessage && (
                        <UtxoTag
                            tooltipMessage={coinjoinUnavailableMessage}
                            icon="blocked"
                            iconColor={utxoTagIconColor}
                        />
                    )}

                    {isChangeAddress && (
                        <UtxoTag
                            tooltipMessage={<Translation id="TR_CHANGE_ADDRESS_TOOLTIP" />}
                            icon="change"
                            iconColor={utxoTagIconColor}
                        />
                    )}

                    <Address>{utxo.address}</Address>

                    <StyledCryptoAmount
                        value={formatNetworkAmount(utxo.amount, account.symbol)}
                        symbol={account.symbol}
                    />
                </Row>

                <Row margin={{ top: spacings.xxs }} minHeight={spacings.xl} gap={ROW_GAP}>
                    {transaction ? (
                        <TransactionTimestamp showDate transaction={transaction} />
                    ) : (
                        <Tooltip
                            cursor="pointer"
                            content={<Translation id="TR_LOADING_TRANSACTION_DETAILS" />}
                        >
                            <Spinner size={14} margin={{ right: spacings.xs }} />
                        </Tooltip>
                    )}

                    {anonymity && (
                        <>
                            <span>•</span>
                            <UtxoAnonymity anonymity={anonymity} />
                        </>
                    )}

                    {isLabelingPossible && (
                        <LabelPart>
                            <span>•</span>
                            <MetadataLabeling
                                visible
                                payload={{
                                    type: 'outputLabel',
                                    entityKey: account.key,
                                    txid: utxo.txid,
                                    outputIndex: utxo.vout,
                                    defaultValue: `${utxo.txid}-${utxo.vout}`,
                                    value: outputLabel,
                                }}
                            />
                        </LabelPart>
                    )}

                    {transaction && (
                        <DetailPartVisibleOnHover>
                            <span>•</span>
                            <TransactionDetailButton size="small" onClick={showTransactionDetail}>
                                <Translation id="TR_DETAIL" />
                            </TransactionDetailButton>
                        </DetailPartVisibleOnHover>
                    )}

                    <StyledFiatValue
                        amount={formatNetworkAmount(utxo.amount, account.symbol, false)}
                        symbol={network.symbol}
                    />
                </Row>
            </Body>
        </Wrapper>
    );
};
