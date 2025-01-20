import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { analytics, EventType } from '@trezor/suite-analytics';
import { isUrl } from '@trezor/utils';
import { blockchainActions } from '@suite-common/wallet-core';
import { isElectrumUrl } from '@suite-common/wallet-utils';
import { NetworkSymbol, BackendType } from '@suite-common/wallet-config';
import { BackendSettings } from '@suite-common/wallet-types';

import { isOnionUrl } from 'src/utils/suite/tor';
import { useDispatch, useSelector, useTranslation } from 'src/hooks/suite';

export type BackendOption = BackendType | 'default';

type BackendsFormData = {
    type: BackendOption;
    urls: string[];
};

const validateUrl = (type: BackendOption, value: string) => {
    switch (type) {
        case 'blockbook':
            return isUrl(value);
        case 'blockfrost':
            return isUrl(value);
        case 'electrum':
            return isElectrumUrl(value);
        case 'solana':
            return isUrl(value);
        case 'ripple':
            return isUrl(value);
        case 'stellar':
            return isUrl(value);
        default:
            return false;
    }
};

const getUrlPlaceholder = (symbol: NetworkSymbol, type: BackendOption) => {
    switch (type) {
        case 'blockbook':
            return `https://${symbol}1.trezor.io/`;
        case 'blockfrost':
            return `wss://blockfrost.io`;
        case 'electrum':
            return `electrum.example.com:50001:t`;
        case 'solana':
            return 'https://';
        default:
            return '';
    }
};

const useBackendUrlInput = (symbol: NetworkSymbol, type: BackendOption, currentUrls: string[]) => {
    const {
        register,
        watch,
        setValue,
        formState: { errors },
    } = useForm<{ url: string }>({
        mode: 'onChange',
    });
    const { translationString } = useTranslation();

    const name = 'url' as const;
    const validate = (value: string) => {
        // Check if URL is valid
        if (!validateUrl(type, value)) {
            return translationString('TR_CUSTOM_BACKEND_INVALID_URL');
        }

        // Check if already exists
        if (currentUrls.find(url => url === value)) {
            return translationString('TR_CUSTOM_BACKEND_BACKEND_ALREADY_ADDED');
        }
    };

    const placeholder = translationString('SETTINGS_ADV_COIN_URL_INPUT_PLACEHOLDER', {
        url: getUrlPlaceholder(symbol, type),
    });

    return {
        name,
        placeholder,
        register,
        validate,
        error: errors[name],
        value: watch(name) || '',
        reset: () => setValue(name, ''),
    };
};

const getStoredState = (
    symbol: NetworkSymbol,
    type?: BackendOption,
    urls?: BackendSettings['urls'],
): BackendsFormData => ({
    type: type ?? (symbol === 'regtest' ? 'blockbook' : 'default'),
    urls: (type && type !== 'default' && urls?.[type]) || [],
});

export const useBackendsForm = (symbol: NetworkSymbol) => {
    const backends = useSelector(state => state.wallet.blockchain[symbol].backends);
    const dispatch = useDispatch();
    const initial = getStoredState(symbol, backends.selected, backends.urls);
    const [currentValues, setCurrentValues] = useState(initial);

    const changeType = (type: BackendOption) => {
        setCurrentValues(getStoredState(symbol, type, backends.urls));
    };

    const addUrl = (url: string) => {
        setCurrentValues(({ type, urls }) => ({
            type,
            urls: [...urls, url],
        }));
    };

    const removeUrl = (url: string) => {
        setCurrentValues(({ type, urls }) => ({
            type,
            urls: urls.filter(u => u !== url),
        }));
    };

    const input = useBackendUrlInput(symbol, currentValues.type, currentValues.urls);

    const getUrls = () => {
        const lastUrl = input.value && !input.error ? [input.value] : [];

        return currentValues.urls.concat(lastUrl);
    };

    const hasOnlyOnions = () => {
        const urls = getUrls();

        return !!urls.length && urls.every(isOnionUrl);
    };

    const save = () => {
        const { type } = currentValues;
        const urls = type === 'default' ? [] : getUrls();
        dispatch(blockchainActions.setBackend({ symbol, type, urls }));
        const totalOnion = urls.filter(isOnionUrl).length;

        analytics.report({
            type: EventType.SettingsCoinsBackend,
            payload: {
                symbol,
                type,
                totalRegular: urls.length - totalOnion,
                totalOnion,
            },
        });
    };

    return {
        type: currentValues.type,
        urls: currentValues.urls,
        input,
        hasOnlyOnions,
        addUrl,
        removeUrl,
        changeType,
        save,
    };
};
