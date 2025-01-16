import { Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import {
    Timestamp,
    TokenAddress,
    FiatRatesResult,
    CurrencyOption,
    Output,
} from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils/src/bigNumber';
import { Select } from '@trezor/components';
import {
    getInputState,
    findToken,
    isLowAnonymityWarning,
    formatAmount,
    buildCurrencyOptions,
} from '@suite-common/wallet-utils';
import { formInputsMaxLength } from '@suite-common/validators';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { updateFiatRatesThunk } from '@suite-common/wallet-core';
import { NumberInput } from '@trezor/product-components';

import { useSendFormContext } from 'src/hooks/wallet';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useTranslation } from 'src/hooks/suite';
import { validateDecimals } from 'src/utils/suite/validation';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

type FiatInputProps = {
    output: Partial<Output>;
    outputId: number;
    labelLeft?: React.ReactNode;
    labelHoverRight?: React.ReactNode;
    labelRight?: React.ReactNode;
};

export const FiatInput = ({
    output,
    outputId,
    labelLeft,
    labelHoverRight,
    labelRight,
}: FiatInputProps) => {
    const {
        account,
        network,
        formState: { errors },
        getDefaultValue,
        handleFiatChange,
        control,
        setValue,
        composeTransaction,
        watch,
    } = useSendFormContext();

    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const locale = useSelector(selectLanguage);
    const { translationString } = useTranslation();
    const dispatch = useDispatch();

    const fiatInputName = `outputs.${outputId}.fiat` as const;
    const currencyInputName = `outputs.${outputId}.currency` as const;
    const amountInputName = `outputs.${outputId}.amount` as const;
    const tokenInputName = `outputs.${outputId}.token` as const;

    const outputError = errors.outputs ? errors.outputs[outputId] : undefined;
    const error = outputError ? outputError.fiat : undefined;
    const fiatValue = getDefaultValue(fiatInputName, output.fiat || '');
    const tokenContractAddress = getDefaultValue(tokenInputName, output.token);

    const amountValue = getDefaultValue(amountInputName, '');
    const token = findToken(account.tokens, tokenContractAddress);

    const currencyValue = watch(currencyInputName);

    const recalculateFiat = (rate: number) => {
        const formattedAmount = new BigNumber(
            shouldSendInSats ? formatAmount(amountValue, network.decimals) : amountValue,
        );

        if (
            rate &&
            formattedAmount &&
            !formattedAmount.isNaN() &&
            formattedAmount.gt(0) // formatAmount() returns '-1' on error
        ) {
            const fiatValueBigNumber = formattedAmount.multipliedBy(rate);

            setValue(fiatInputName, fiatValueBigNumber.toFixed(2), {
                shouldValidate: true,
            });
            // call compose to store draft, precomposedTx should be the same
            composeTransaction(amountInputName);
        }
    };

    // relation case:
    // Amount input has an error and Fiat has not (but it should)
    // usually this happens after Fiat > Amount recalculation (from here, onChange event)
    // or as a result on composeTransaction process
    const amountError = outputError ? outputError.amount : undefined;
    const errorToDisplay = !error && fiatValue && amountError ? amountError : error;

    const isLowAnonymity = isLowAnonymityWarning(outputError);
    const inputState = isLowAnonymity ? 'warning' : getInputState(errorToDisplay);
    const bottomText = isLowAnonymity ? null : errorToDisplay?.message;

    const handleChange = (value: string) => handleFiatChange({ outputId, token, value });

    const rules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            decimals: validateDecimals(translationString, { decimals: 2 }),
        },
    };

    interface CallbackParams {
        field: {
            onChange: (...event: any[]) => void;
            value: any;
        };
    }

    const renderCurrencySelect = ({
        field: { onChange, value: selectedOption },
    }: CallbackParams) => (
        <Select
            options={buildCurrencyOptions(selectedOption)}
            value={{
                label: selectedOption.label.toUpperCase(),
                value: selectedOption.value,
            }}
            isClearable={false}
            isSearchable
            minValueWidth="58px"
            isClean
            data-testid={currencyInputName}
            onChange={async (selected: CurrencyOption) => {
                // propagate changes to FormState
                onChange(selected);

                // Get (fresh) fiat rates for newly selected currency
                const updateFiatRatesResult = await dispatch(
                    updateFiatRatesThunk({
                        tickers: [
                            {
                                symbol: account.symbol,
                                tokenAddress: token?.contract as TokenAddress,
                            },
                        ],
                        localCurrency: selected.value as FiatCurrencyCode,
                        rateType: 'current',
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                );

                if (updateFiatRatesResult.meta.requestStatus === 'fulfilled') {
                    const fiatRate = updateFiatRatesResult.payload as FiatRatesResult;

                    if (fiatRate?.rate) {
                        recalculateFiat(fiatRate.rate);
                    }
                }
            }}
        />
    );

    return (
        <NumberInput
            labelHoverRight={labelHoverRight}
            labelRight={labelRight}
            labelLeft={labelLeft}
            locale={locale}
            control={control}
            inputState={inputState}
            onChange={handleChange}
            name={fiatInputName}
            data-testid={fiatInputName}
            defaultValue={fiatValue}
            maxLength={formInputsMaxLength.fiat}
            rules={rules}
            bottomText={bottomText || null}
            innerAddon={
                <Controller
                    control={control}
                    name={currencyInputName}
                    defaultValue={currencyValue}
                    render={renderCurrencySelect}
                />
            }
        />
    );
};
