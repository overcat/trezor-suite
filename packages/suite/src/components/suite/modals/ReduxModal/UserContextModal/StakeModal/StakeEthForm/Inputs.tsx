import { Banner, Column, Text } from '@trezor/components';
import { getInputState, getStakingLimitsByNetwork } from '@suite-common/wallet-utils';
import { useFormatters } from '@suite-common/formatters';
import { formInputsMaxLength } from '@suite-common/validators';
import { spacings } from '@trezor/theme';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { BigNumber } from '@trezor/utils';
import { InputWithOptions } from '@trezor/product-components';
import { StakeFormState } from '@suite-common/wallet-types';

import { FiatValue, Translation } from 'src/components/suite';
import { useSelector, useTranslation } from 'src/hooks/suite';
import { useStakeEthFormContext } from 'src/hooks/wallet/useStakeEthForm';
import {
    validateDecimals,
    validateCryptoLimits,
    validateMin,
    validateReserveOrBalance,
} from 'src/utils/suite/validation';
import { FIAT_INPUT, CRYPTO_INPUT } from 'src/types/wallet/stakeForms';
import { validateStakingMax } from 'src/utils/suite/staking';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';

export const Inputs = () => {
    const { translationString } = useTranslation();
    const { CryptoAmountFormatter } = useFormatters();
    const locale = useSelector(selectLanguage);

    const {
        control,
        account,
        network,
        formState: { errors },
        amountLimits,
        getValues,
        onCryptoAmountChange,
        onFiatAmountChange,
        localCurrency,
        isAmountForWithdrawalWarningShown,
        isLessAmountForWithdrawalWarningShown,
        isAdviceForWithdrawalWarningShown,
        currentRate,
        setRatioAmount,
        setMax,
    } = useStakeEthFormContext();

    const { MIN_FOR_WITHDRAWALS, MAX_AMOUNT_FOR_STAKING, MIN_AMOUNT_FOR_STAKING } =
        getStakingLimitsByNetwork(account);

    const cryptoError = errors.cryptoInput;
    const fiatError = errors.fiatInput;

    const { outputs } = getValues();
    const amount = outputs?.[0]?.amount;

    const fiatInputRules = {
        validate: {
            min: validateMin(translationString),
            decimals: validateDecimals(translationString, { decimals: 2 }),
        },
    };

    const cryptoInputRules = {
        required: translationString('AMOUNT_IS_NOT_SET'),
        validate: {
            min: validateMin(translationString),
            max: validateStakingMax(translationString, { maxAmount: MAX_AMOUNT_FOR_STAKING }),
            decimals: validateDecimals(translationString, { decimals: network.decimals }),
            reserveOrBalance: validateReserveOrBalance(translationString, {
                account,
            }),
            limits: validateCryptoLimits(translationString, {
                amountLimits,
                formatter: CryptoAmountFormatter,
            }),
        },
    };

    const shouldShowAmountForWithdrawalWarning =
        isLessAmountForWithdrawalWarningShown || isAmountForWithdrawalWarningShown;

    const networkDisplaySymbol = getNetworkDisplaySymbol(account.symbol);

    const isFractionButtonDisabled = (divisor: number) => {
        if (!account.formattedBalance || !network.decimals) return false;

        return new BigNumber(account.formattedBalance)
            .dividedBy(divisor)
            .decimalPlaces(network.decimals)
            .lte(MIN_AMOUNT_FOR_STAKING);
    };

    const tooltip = (
        <Translation
            id="TR_STAKE_MIN_AMOUNT_TOOLTIP"
            values={{
                amount: MIN_AMOUNT_FOR_STAKING.toString(),
                networkDisplaySymbol,
            }}
        />
    );

    const isBalanceBelowMinStake = new BigNumber(account.formattedBalance || '0').lt(
        MIN_AMOUNT_FOR_STAKING,
    );

    return (
        <Column gap={spacings.sm} alignItems="center">
            <InputWithOptions<StakeFormState>
                cryptoInputProps={{
                    name: CRYPTO_INPUT,
                    locale,
                    labelLeft: <Translation id="AMOUNT" />,
                    control,
                    rules: cryptoInputRules,
                    maxLength: formInputsMaxLength.amount,
                    innerAddon: <Text variant="tertiary">{networkDisplaySymbol}</Text>,
                    bottomText: errors[CRYPTO_INPUT]?.message ?? null,
                    inputState: getInputState(cryptoError || fiatError),
                    onChange: onCryptoAmountChange,
                }}
                fiatInputProps={
                    currentRate?.rate
                        ? {
                              name: FIAT_INPUT,
                              locale,
                              labelLeft: <Translation id="AMOUNT" />,
                              control,
                              rules: fiatInputRules,
                              maxLength: formInputsMaxLength.fiat,
                              innerAddon: (
                                  <Text variant="tertiary">{localCurrency.toUpperCase()}</Text>
                              ),
                              bottomText: errors[FIAT_INPUT]?.message ?? null,
                              inputState: getInputState(fiatError || cryptoError),
                              onChange: onFiatAmountChange,
                          }
                        : undefined
                }
                switchTranslation={{
                    fiat: (
                        <Translation
                            id="TR_COINMARKET_ENTER_AMOUNT_IN"
                            values={{ currency: localCurrency.toUpperCase() }}
                        />
                    ),
                    crypto: (
                        <Translation
                            id="TR_COINMARKET_ENTER_AMOUNT_IN"
                            values={{ currency: networkDisplaySymbol }}
                        />
                    ),
                }}
                fiatValue={
                    <FiatValue amount={amount} symbol={account.symbol} showApproximationIndicator>
                        {({ value }) =>
                            value ? (
                                <Text typographyStyle="label" variant="tertiary">
                                    {value}
                                </Text>
                            ) : null
                        }
                    </FiatValue>
                }
                options={[
                    {
                        id: 'TR_FRACTION_BUTTONS_10_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_10_PERCENT" />,
                        tooltip: isFractionButtonDisabled(10) && tooltip,
                        isDisabled: isFractionButtonDisabled(10),
                        onClick: () => setRatioAmount(10),
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_25_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_25_PERCENT" />,
                        tooltip: isFractionButtonDisabled(4) && tooltip,
                        isDisabled: isFractionButtonDisabled(4),
                        onClick: () => setRatioAmount(4),
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_50_PERCENT',
                        children: <Translation id="TR_FRACTION_BUTTONS_50_PERCENT" />,
                        tooltip: isFractionButtonDisabled(2) && tooltip,
                        isDisabled: isFractionButtonDisabled(2),
                        onClick: () => setRatioAmount(2),
                    },
                    {
                        id: 'TR_FRACTION_BUTTONS_MAX',
                        children: <Translation id="TR_FRACTION_BUTTONS_MAX" />,
                        tooltip: isBalanceBelowMinStake && tooltip,
                        isDisabled: isBalanceBelowMinStake,
                        onClick: () => setMax(),
                    },
                ]}
            />
            {shouldShowAmountForWithdrawalWarning && (
                <Banner variant="info">
                    <Translation
                        id={
                            isLessAmountForWithdrawalWarningShown
                                ? 'TR_STAKE_LEFT_SMALL_AMOUNT_FOR_WITHDRAWAL'
                                : 'TR_STAKE_LEFT_AMOUNT_FOR_WITHDRAWAL'
                        }
                        values={{
                            amount: MIN_FOR_WITHDRAWALS.toString(),
                            networkDisplaySymbol,
                        }}
                    />
                </Banner>
            )}
            {isAdviceForWithdrawalWarningShown && (
                <Banner variant="info">
                    <Translation
                        id="TR_STAKE_RECOMMENDED_AMOUNT_FOR_WITHDRAWALS"
                        values={{
                            amount: MIN_FOR_WITHDRAWALS.toString(),
                            networkDisplaySymbol,
                        }}
                    />
                </Banner>
            )}
        </Column>
    );
};
