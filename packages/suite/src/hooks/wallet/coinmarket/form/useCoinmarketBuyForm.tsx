import { useCallback, useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import useDebounce from 'react-use/lib/useDebounce';
import type { BuyTrade, BuyTradeQuoteRequest, CryptoId } from 'invity-api';

import { isChanged } from '@suite-common/suite-utils';
import { formatAmount } from '@suite-common/wallet-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { isDesktop } from '@trezor/env-utils';
import { networks } from '@suite-common/wallet-config';
import { analytics, EventType } from '@trezor/suite-analytics';

import { useDispatch, useSelector } from 'src/hooks/suite';
import invityAPI from 'src/services/suite/invityAPI';
import {
    createQuoteLink,
    createTxLink,
    getAmountLimits,
} from 'src/utils/wallet/coinmarket/buyUtils';
import { useFormDraft } from 'src/hooks/wallet/useFormDraft';
import { CoinmarketTradeBuyType, UseCoinmarketFormProps } from 'src/types/coinmarket/coinmarket';
import {
    addIdsToQuotes,
    coinmarketGetSuccessQuotes,
    cryptoIdToNetwork,
    filterQuotesAccordingTags,
    getCoinmarketNetworkDecimals,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import {
    CoinmarketBuyFormContextProps,
    CoinmarketBuyFormProps,
} from 'src/types/coinmarket/coinmarketForm';
import * as coinmarketInfoActions from 'src/actions/wallet/coinmarketInfoActions';
import * as coinmarketCommonActions from 'src/actions/wallet/coinmarket/coinmarketCommonActions';
import * as coinmarketBuyActions from 'src/actions/wallet/coinmarketBuyActions';
import * as routerActions from 'src/actions/suite/routerActions';
import useCoinmarketPaymentMethod from 'src/hooks/wallet/coinmarket/form/useCoinmarketPaymentMethod';
import { useBitcoinAmountUnit } from 'src/hooks/wallet/useBitcoinAmountUnit';
import { useCoinmarketNavigation } from 'src/hooks/wallet/useCoinmarketNavigation';
import {
    FORM_CRYPTO_INPUT,
    FORM_DEFAULT_CRYPTO_CURRENCY,
    FORM_FIAT_INPUT,
    FORM_PAYMENT_METHOD_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import { useCoinmarketLoadData } from 'src/hooks/wallet/coinmarket/useCoinmarketLoadData';
import { useCoinmarketCurrencySwitcher } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketCurrencySwitcher';
import { useCoinmarketModalCrypto } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketModalCrypto';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { useCoinmarketBuyFormDefaultValues } from 'src/hooks/wallet/coinmarket/form/useCoinmarketBuyFormDefaultValues';
import type { AmountLimitProps } from 'src/utils/suite/validation';

import { useCoinmarketInitializer } from './common/useCoinmarketInitializer';

export const useCoinmarketBuyForm = ({
    selectedAccount,
    pageType = 'form',
}: UseCoinmarketFormProps): CoinmarketBuyFormContextProps => {
    const type = 'buy';
    const isNotFormPage = pageType !== 'form';
    const dispatch = useDispatch();
    const { addressVerified, buyInfo, isFromRedirect, quotes, quotesRequest, selectedQuote } =
        useSelector(state => state.wallet.coinmarket.buy);
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const { callInProgress, account, timer, device, setCallInProgress, checkQuotesTimer } =
        useCoinmarketInitializer({ selectedAccount, type });
    const { paymentMethods, getPaymentMethods, getQuotesByPaymentMethod } =
        useCoinmarketPaymentMethod<CoinmarketTradeBuyType>();
    const { navigateToBuyForm, navigateToBuyOffers, navigateToBuyConfirm } =
        useCoinmarketNavigation(account);

    // states
    const [amountLimits, setAmountLimits] = useState<AmountLimitProps | undefined>(undefined);
    const [innerQuotes, setInnerQuotes] = useState<BuyTrade[] | undefined>(
        isNotFormPage ? quotes : undefined,
    );
    const [isSubmittingHelper, setIsSubmittingHelper] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { shouldSendInSats } = useBitcoinAmountUnit(account.symbol);

    const {
        defaultValues,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        suggestedFiatCurrency,
    } = useCoinmarketBuyFormDefaultValues(account.symbol, buyInfo);
    const buyDraftKey = account.key;
    const { saveDraft, getDraft, removeDraft } =
        useFormDraft<CoinmarketBuyFormProps>('coinmarket-buy');
    const draft = getDraft(buyDraftKey);
    const draftUpdated: CoinmarketBuyFormProps | null = draft
        ? {
              ...draft,
              fiatInput:
                  draft.fiatInput && draft.fiatInput !== ''
                      ? draft.fiatInput
                      : buyInfo?.buyInfo?.defaultAmountsOfFiatCurrencies.get(suggestedFiatCurrency),
              // remember only for offers page
              cryptoSelect: pageType === 'form' ? defaultValues.cryptoSelect : draft.cryptoSelect,
          }
        : null;

    const isDraft = !!draftUpdated || !!isNotFormPage;
    const methods = useForm<CoinmarketBuyFormProps>({
        mode: 'onChange',
        defaultValues: isDraft && draftUpdated ? draftUpdated : defaultValues,
    });
    const { register, control, formState, reset, setValue, handleSubmit } = methods;
    const values = useWatch<CoinmarketBuyFormProps>({ control });
    const previousValues = useRef<typeof values | null>(isNotFormPage ? draftUpdated : null);

    const isInitialDataLoading = !buyInfo || !buyInfo?.buyInfo;
    const noProviders = !isInitialDataLoading && buyInfo?.buyInfo?.providers.length === 0;
    const formIsValid = Object.keys(formState.errors).length === 0;
    const hasValues = (values.fiatInput || values.cryptoInput) && !!values.currencySelect?.value;
    const isFirstRequest = innerQuotes === undefined;
    const isFormLoading =
        isInitialDataLoading || formState.isSubmitting || isSubmittingHelper || isFirstRequest;
    const isFormInvalid = !(formIsValid && hasValues);
    const isLoadingOrInvalid = noProviders || isFormLoading || isFormInvalid;

    const quotesByPaymentMethod = getQuotesByPaymentMethod(
        innerQuotes,
        values?.paymentMethod?.value ?? '',
    );
    // based on selected cryptoSymbol, because of using for validation cryptoInput
    const network =
        cryptoIdToNetwork(
            (values.cryptoSelect?.value as CryptoId) ?? FORM_DEFAULT_CRYPTO_CURRENCY,
        ) ?? networks.btc;

    const { toggleAmountInCrypto } = useCoinmarketCurrencySwitcher({
        account,
        methods,
        quoteCryptoAmount: quotesByPaymentMethod?.[0]?.receiveStringAmount,
        quoteFiatAmount: quotesByPaymentMethod?.[0]?.fiatStringAmount,
        network,
        inputNames: {
            cryptoInput: FORM_CRYPTO_INPUT,
            fiatInput: FORM_FIAT_INPUT,
        },
    });

    const getQuotesRequest = useCallback(
        async (request: BuyTradeQuoteRequest, offLoading?: boolean) => {
            setIsSubmittingHelper(!offLoading);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // no need to fetch quotes if amount is not set
            if (
                (!request.fiatStringAmount && !request.cryptoStringAmount) ||
                !request.receiveCurrency
            ) {
                timer.stop();
                setIsSubmittingHelper(false);

                return;
            }

            abortControllerRef.current = new AbortController();

            const allQuotes = await invityAPI.getBuyQuotes(
                request,
                abortControllerRef.current.signal,
            );

            return allQuotes;
        },
        [timer],
    );

    const getQuoteRequestData = useCallback((): BuyTradeQuoteRequest => {
        const {
            fiatInput,
            cryptoInput,
            currencySelect,
            cryptoSelect,
            countrySelect,
            amountInCrypto,
        } = methods.getValues();
        const decimals = getCoinmarketNetworkDecimals({ network });
        const cryptoStringAmount =
            cryptoInput && shouldSendInSats ? formatAmount(cryptoInput, decimals) : cryptoInput;

        const request = {
            wantCrypto: amountInCrypto,
            fiatCurrency: currencySelect
                ? currencySelect?.value.toUpperCase()
                : quotesRequest?.fiatCurrency ?? '',
            receiveCurrency: cryptoSelect?.value ?? quotesRequest?.receiveCurrency,
            country: countrySelect?.value ?? quotesRequest?.country,
            fiatStringAmount: fiatInput ?? quotesRequest?.fiatStringAmount,
            cryptoStringAmount: cryptoStringAmount ?? quotesRequest?.cryptoStringAmount,
        };

        return request;
    }, [methods, network, shouldSendInSats, quotesRequest]);

    const handleChange = useCallback(
        async (offLoading?: boolean) => {
            timer.loading();

            const quoteRequest = getQuoteRequestData();
            const allQuotes = await getQuotesRequest(quoteRequest, offLoading);

            if (!Array.isArray(allQuotes) || allQuotes.length === 0) {
                timer.stop();
                setInnerQuotes([]);
                setIsSubmittingHelper(false);

                return;
            }

            // processed quotes and without alternative quotes
            const quotesDefault = filterQuotesAccordingTags<CoinmarketTradeBuyType>(
                addIdsToQuotes<CoinmarketTradeBuyType>(allQuotes, 'buy'),
            );
            // without errors
            const quotesSuccess =
                coinmarketGetSuccessQuotes<CoinmarketTradeBuyType>(quotesDefault) ?? [];

            const bestQuote = quotesSuccess?.[0];
            const bestQuotePaymentMethod = bestQuote?.paymentMethod;
            const bestQuotePaymentMethodName =
                bestQuote?.paymentMethodName ?? bestQuotePaymentMethod;
            const paymentMethodSelected = values.paymentMethod?.value;
            const paymentMethodsFromQuotes = getPaymentMethods(quotesSuccess);
            const isSelectedPaymentMethodAvailable =
                paymentMethodsFromQuotes.find(item => item.value === paymentMethodSelected) !==
                undefined;
            const symbol =
                cryptoIdToCoinSymbol(quoteRequest.receiveCurrency) ?? quoteRequest.receiveCurrency;
            const limits = getAmountLimits({
                request: quoteRequest,
                quotes: quotesDefault,
                currency: symbol,
            }); // from all quotes except alternative

            setInnerQuotes(quotesSuccess);
            dispatch(coinmarketBuyActions.saveQuotes(quotesSuccess));
            dispatch(coinmarketBuyActions.saveQuoteRequest(quoteRequest));
            dispatch(coinmarketInfoActions.savePaymentMethods(paymentMethodsFromQuotes));
            setAmountLimits(limits);

            if (!paymentMethodSelected || !isSelectedPaymentMethodAvailable) {
                setValue(FORM_PAYMENT_METHOD_SELECT, {
                    value: bestQuotePaymentMethod ?? '',
                    label: bestQuotePaymentMethodName ?? '',
                });
            }

            setIsSubmittingHelper(false);
            timer.reset();
        },
        [
            timer,
            values.paymentMethod?.value,
            cryptoIdToCoinSymbol,
            getQuoteRequestData,
            getQuotesRequest,
            getPaymentMethods,
            dispatch,
            setValue,
        ],
    );

    const goToOffers = async () => {
        await handleChange();

        dispatch(
            coinmarketBuyActions.saveCachedAccountInfo(
                account.symbol,
                account.index,
                account.accountType,
            ),
        );
        navigateToBuyOffers();
    };

    const selectQuote = async (quote: BuyTrade) => {
        const provider = buyInfo && quote.exchange ? buyInfo.providerInfos[quote.exchange] : null;
        if (quotesRequest) {
            const result = await dispatch(
                coinmarketBuyActions.openCoinmarketBuyConfirmModal(
                    provider?.companyName,
                    cryptoIdToCoinSymbol(quote.receiveCurrency!),
                ),
            );

            if (result) {
                // empty quoteId means the partner requests login first, requestTrade to get login screen
                if (!quote.quoteId) {
                    const returnUrl = await createQuoteLink(quotesRequest, account);
                    const response = await invityAPI.doBuyTrade({ trade: quote, returnUrl });
                    if (response) {
                        if (response.trade.status === 'LOGIN_REQUEST' && response.tradeForm) {
                            dispatch(
                                coinmarketCommonActions.submitRequestForm(response.tradeForm.form),
                            );
                        } else {
                            const errorMessage = `[doBuyTrade] ${response.trade.status} ${response.trade.error}`;
                            console.log(errorMessage);
                        }
                    } else {
                        const errorMessage = 'No response from the server';
                        console.log(`[doBuyTrade] ${errorMessage}`);
                        dispatch(
                            notificationsActions.addToast({
                                type: 'error',
                                error: errorMessage,
                            }),
                        );
                    }
                } else {
                    dispatch(coinmarketBuyActions.saveSelectedQuote(quote));

                    timer.stop();

                    navigateToBuyConfirm();
                }
            }
        }
    };

    const confirmTrade = async (address: string) => {
        setCallInProgress(true);
        if (!selectedQuote) return;

        analytics.report({
            type: EventType.CoinmarketConfirmTrade,
            payload: {
                type,
            },
        });

        const returnUrl = await createTxLink(selectedQuote, account);
        const quote = { ...selectedQuote, receiveAddress: address };
        const response = await invityAPI.doBuyTrade({
            trade: quote,
            returnUrl,
        });

        if (!response || !response.trade || !response.trade.paymentId) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'No response from the server',
                }),
            );
        } else if (response.trade.error) {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: response.trade.error,
                }),
            );
        } else {
            dispatch(
                coinmarketBuyActions.saveTrade(response.trade, account, new Date().toISOString()),
            );
            if (response.tradeForm) {
                dispatch(coinmarketCommonActions.submitRequestForm(response.tradeForm.form));
            }
            if (isDesktop()) {
                dispatch(coinmarketBuyActions.saveTransactionDetailId(response.trade.paymentId));
                dispatch(
                    routerActions.goto('wallet-coinmarket-buy-detail', {
                        params: selectedAccount.params,
                    }),
                );
            }
        }
        setCallInProgress(false);
    };

    useCoinmarketLoadData();
    useCoinmarketModalCrypto({
        receiveCurrency: values.cryptoSelect?.value as CryptoId | undefined,
    });

    // call change handler on every change of text inputs with debounce
    useDebounce(
        () => {
            if (
                isChanged(previousValues.current?.fiatInput, values.fiatInput) ||
                isChanged(previousValues.current?.cryptoInput, values.cryptoInput)
            ) {
                handleSubmit(() => {
                    handleChange();
                })();

                previousValues.current = values;
            }
        },
        500,
        [previousValues, values.fiatInput, values.cryptoInput, handleChange, handleSubmit],
    );

    // call change handler on every change of select inputs
    useEffect(() => {
        if (
            isChanged(previousValues.current?.countrySelect, values.countrySelect) ||
            isChanged(previousValues.current?.currencySelect, values.currencySelect) ||
            isChanged(previousValues.current?.cryptoSelect, values.cryptoSelect)
        ) {
            handleSubmit(() => {
                handleChange();
            })();

            previousValues.current = values;
        }
    }, [previousValues, values, handleChange, handleSubmit, isNotFormPage]);

    useEffect(() => {
        // when draft doesn't exist, we need to bind actual default values - that happens when we've got buyInfo from Invity API server
        if (!isDraft && buyInfo) {
            reset(defaultValues);
        }
    }, [reset, buyInfo, defaultValues, isDraft]);

    useEffect(() => {
        if (!isChanged(defaultValues, values)) {
            removeDraft(buyDraftKey);

            return;
        }

        if (values.cryptoSelect && !values.cryptoSelect?.value) {
            removeDraft(buyDraftKey);
        }
    }, [defaultValues, values, removeDraft, buyDraftKey]);

    useEffect(() => {
        if (!quotesRequest && isNotFormPage) {
            navigateToBuyForm();

            return;
        }

        if (isFromRedirect && quotesRequest) {
            dispatch(coinmarketBuyActions.setIsFromRedirect(false));
        }

        checkQuotesTimer(handleChange);
    });

    useDebounce(
        () => {
            // saving draft after validation & buyInfo is available
            if (!formState.isValidating && Object.keys(formState.errors).length === 0 && buyInfo) {
                saveDraft(buyDraftKey, {
                    ...values,
                    fiatInput:
                        values.fiatInput !== ''
                            ? values.fiatInput
                            : buyInfo?.buyInfo.defaultAmountsOfFiatCurrencies.get(
                                  suggestedFiatCurrency,
                              ),
                } as CoinmarketBuyFormProps);
            }
        },
        200,
        [
            formState.errors,
            formState.isValidating,
            saveDraft,
            buyDraftKey,
            values,
            shouldSendInSats,
            buyInfo,
        ],
    );

    // eslint-disable-next-line arrow-body-style
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        type,
        form: {
            state: {
                isFormLoading,
                isFormInvalid,
                isLoadingOrInvalid,

                toggleAmountInCrypto,
            },
        },
        ...methods,
        register,
        account,
        defaultCountry,
        defaultCurrency,
        defaultPaymentMethod,
        paymentMethods,
        buyInfo,
        amountLimits,
        network,
        cryptoInputValue: values.cryptoInput,
        formState,
        device,
        callInProgress,
        addressVerified,
        timer,
        quotes: quotesByPaymentMethod,
        quotesRequest,
        selectedQuote,
        selectQuote,
        confirmTrade,
        goToOffers,
        verifyAddress: coinmarketBuyActions.verifyAddress,
        removeDraft,
        setAmountLimits,
    };
};
