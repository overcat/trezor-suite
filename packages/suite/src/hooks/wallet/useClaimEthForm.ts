import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { getFeeInfo } from '@suite-common/wallet-utils';
import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { CRYPTO_INPUT, OUTPUT_AMOUNT, UseStakeFormsProps } from 'src/types/wallet/stakeForms';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { signTransaction } from 'src/actions/wallet/stakeActions';
import {
    getEthNetworkAddresses,
    getStakeFormsDefaultValues,
} from 'src/utils/suite/ethereumStaking';
import { ClaimContextValues, ClaimFormState } from 'src/types/wallet/claimForm';

import { useFees } from './form/useFees';
import { useStakeCompose } from './form/useStakeCompose';

export const ClaimEthFormContext = createContext<ClaimContextValues | null>(null);
ClaimEthFormContext.displayName = 'ClaimEthFormContext';

export const useClaimEthForm = ({ selectedAccount }: UseStakeFormsProps): ClaimContextValues => {
    const dispatch = useDispatch();

    const localCurrency = useSelector(selectLocalCurrency);

    const { account, network } = selectedAccount;
    const symbolFees = useSelector(state => state.wallet.fees[account.symbol]);

    const defaultValues = useMemo(() => {
        const { addressContractAccounting } = getEthNetworkAddresses(account.symbol);

        return {
            ...getStakeFormsDefaultValues({
                address: addressContractAccounting,
                stakeType: 'claim',
            }),
        } as ClaimFormState;
    }, [account.symbol]);

    const state = useMemo(() => {
        const feeInfo = getFeeInfo({
            networkType: account.networkType,
            feeInfo: symbolFees,
        });

        return {
            account,
            network,
            feeInfo,
            formValues: defaultValues,
        };
    }, [account, defaultValues, symbolFees, network]);

    const methods = useForm<ClaimFormState>({
        mode: 'onChange',
        defaultValues,
    });

    const { register, formState, setValue, reset, getValues, clearErrors } = methods;

    // react-hook-form auto register custom form fields (without HTMLElement)
    useEffect(() => {
        register('outputs');
        register(CRYPTO_INPUT);
    }, [register]);

    const {
        isLoading: isComposing,
        composeRequest,
        composedLevels,
        onFeeLevelChange,
    } = useStakeCompose({
        ...methods,
        state,
    });

    const onCryptoAmountChange = useCallback(
        async (amount: string) => {
            setValue(OUTPUT_AMOUNT, amount || '', { shouldDirty: true });
            await composeRequest(CRYPTO_INPUT);
        },
        [composeRequest, setValue],
    );

    const onClaimChange = useCallback(
        async (amount: string) => {
            clearErrors([CRYPTO_INPUT]);
            setValue(CRYPTO_INPUT, amount, {
                shouldDirty: true,
                shouldValidate: true,
            });
            await onCryptoAmountChange(amount);
        },
        [clearErrors, onCryptoAmountChange, setValue],
    );

    const clearForm = useCallback(async () => {
        reset(defaultValues);
        await composeRequest(CRYPTO_INPUT);
    }, [composeRequest, defaultValues, reset]);

    // sub-hook, FeeLevels handler
    const fees = useSelector(state => state.wallet.fees);
    const feeInfo = getFeeInfo({
        networkType: account.networkType,
        feeInfo: fees[account.symbol],
    });
    const { changeFeeLevel, selectedFee: _selectedFee } = useFees({
        defaultValue: 'normal',
        feeInfo,
        onChange: onFeeLevelChange,
        composeRequest,
        ...methods,
    });
    const selectedFee = _selectedFee ?? 'normal';

    // get response from TransactionReviewModal
    const signTx = useCallback(async () => {
        const values = getValues();
        const composedTx = composedLevels ? composedLevels[selectedFee] : undefined;
        if (composedTx && composedTx.type === 'final') {
            const result = await dispatch(
                signTransaction(values, composedTx as PrecomposedTransactionFinal),
            );

            if (result?.success) {
                clearForm();
            }
        }
    }, [getValues, composedLevels, dispatch, clearForm, selectedFee]);

    return {
        ...methods,
        account,
        network,
        formState,
        register,
        localCurrency,
        composedLevels,
        isComposing,
        selectedFee,
        clearForm,
        signTx,
        clearErrors,
        onClaimChange,
        feeInfo,
        changeFeeLevel,
    };
};

export const useClaimEthFormContext = () => {
    const ctx = useContext(ClaimEthFormContext);
    if (ctx === null) throw Error('useClaimEthFormContext used without Context');

    return ctx;
};
