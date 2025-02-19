import { useCallback } from 'react';

import { CoinInfo, CryptoId } from 'invity-api';

import {
    getDisplaySymbol,
    getNetwork,
    getNetworkByCoingeckoNativeId,
    NetworkSymbolExtended,
} from '@suite-common/wallet-config';
import addressValidator from '@trezor/address-validator';

import { useSelector } from 'src/hooks/suite/useSelector';
import {
    CoinmarketCryptoSelectItemProps,
    CoinmarketCryptoSelectOptionProps,
    CoinmarketInfoProps,
} from 'src/types/coinmarket/coinmarket';
import {
    cryptoIdToNetwork,
    parseCryptoId,
    testnetToProdCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';

const supportedAddressValidatorSymbols = new Set(
    addressValidator.getCurrencies().map(c => c.symbol),
);

const toCryptoOption = (
    cryptoId: CryptoId,
    coinInfo: CoinInfo,
): CoinmarketCryptoSelectItemProps => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const coinInfoSymbol = coinInfo.symbol.toLowerCase();
    const displaySymbol = getDisplaySymbol(coinInfoSymbol, contractAddress);

    return {
        type: 'currency',
        value: cryptoId,
        label: displaySymbol,
        cryptoName: coinInfo.name,
        coingeckoId: networkId,
        contractAddress: contractAddress || null,
        symbol: coinInfo.symbol,
    };
};

const sortPopularCurrencies = (
    a: CoinmarketCryptoSelectItemProps,
    b: CoinmarketCryptoSelectItemProps,
) => {
    if (a.coingeckoId && b.coingeckoId) {
        const order = ['bitcoin', 'ethereum', 'litecoin', 'cardano', 'solana'];

        const indexA = order.indexOf(a.coingeckoId);
        const indexB = order.indexOf(b.coingeckoId);

        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
    }

    return 0;
};

export const useCoinmarketInfo = (): CoinmarketInfoProps => {
    const { platforms = {}, coins = {} } = useSelector(state => state.wallet.coinmarket.info);

    const cryptoIdToPlatformName = useCallback(
        (cryptoId: CryptoId) => platforms[cryptoId]?.name,
        [platforms],
    );

    const cryptoIdToCoinName = useCallback((cryptoId: CryptoId) => coins[cryptoId]?.name, [coins]);

    const cryptoIdToNativeCoinSymbol = useCallback(
        (cryptoId: CryptoId) => {
            const { networkId } = parseCryptoId(cryptoId);

            return platforms[networkId]?.nativeCoinSymbol ?? coins[networkId]?.symbol;
        },
        [platforms, coins],
    );

    const cryptoIdToCoinSymbol = useCallback(
        (cryptoId: CryptoId) => coins[cryptoId]?.symbol?.toUpperCase(),
        [coins],
    );

    const cryptoIdToSymbolAndContractAddress = useCallback(
        (cryptoId: CryptoId | undefined) => ({
            coinSymbol: cryptoId && (coins[cryptoId]?.symbol as NetworkSymbolExtended | undefined),
            contractAddress: cryptoId && parseCryptoId(cryptoId).contractAddress,
        }),
        [coins],
    );

    const buildCryptoOptions = useCallback(
        (
            cryptoIds: Set<CryptoId>,
            excludedCryptoIds?: Set<CryptoId>,
        ): CoinmarketCryptoSelectOptionProps[] => {
            const popularCurrencies: CoinmarketCryptoSelectItemProps[] = [];
            const otherCurrencies: CoinmarketCryptoSelectItemProps[] = [];
            const tokenGroups: CoinmarketCryptoSelectOptionProps[][] = [];

            cryptoIds.forEach(cryptoId => {
                const coinInfo = coins[cryptoId];
                if (!coinInfo) {
                    return;
                }

                if (excludedCryptoIds?.has(cryptoId)) {
                    return;
                }

                const nativeCoinSymbol =
                    cryptoIdToNetwork(testnetToProdCryptoId(cryptoId))?.symbol ??
                    cryptoIdToNativeCoinSymbol(testnetToProdCryptoId(cryptoId));
                if (!nativeCoinSymbol || !supportedAddressValidatorSymbols.has(nativeCoinSymbol)) {
                    return;
                }

                const { networkId, contractAddress } = parseCryptoId(cryptoId);
                const option = toCryptoOption(cryptoId, coinInfo);

                if (getNetworkByCoingeckoNativeId(cryptoId)) {
                    popularCurrencies.push(option);
                } else if (!contractAddress) {
                    otherCurrencies.push(option);
                } else {
                    const networkName = cryptoIdToPlatformName(networkId) || networkId;
                    const tokenGroup = tokenGroups.find(group =>
                        group.find(item => item.networkName === networkName),
                    );
                    const optionWithNetwork = {
                        ...option,
                        networkName,
                        coingeckoId: networkId,
                        contractAddress,
                    };

                    if (!tokenGroup) {
                        tokenGroups.push([
                            {
                                type: 'group',
                                label: 'TR_COINMARKET_NETWORK_TOKENS',
                                coingeckoId: networkId,
                                networkName,
                            },
                            {
                                ...optionWithNetwork,
                            },
                        ]);
                    } else {
                        tokenGroup.push(optionWithNetwork);
                    }
                }
            });

            popularCurrencies.sort(sortPopularCurrencies);

            return [
                { type: 'group', label: 'TR_COINMARKET_POPULAR_CURRENCIES' },
                ...popularCurrencies,
                { type: 'group', label: 'TR_COINMARKET_OTHER_CURRENCIES' },
                ...otherCurrencies,

                ...tokenGroups.flat(),
            ];
        },
        [coins, cryptoIdToPlatformName, cryptoIdToNativeCoinSymbol],
    );

    const buildDefaultCryptoOption = useCallback(
        (cryptoId: CryptoId | undefined) => {
            const coinInfo = cryptoId && coins[cryptoId];
            if (coinInfo) {
                return toCryptoOption(cryptoId, coinInfo);
            }

            const { coingeckoId, name, symbol } = getNetwork('btc');
            const item: CoinmarketCryptoSelectItemProps = {
                type: 'currency',
                value: coingeckoId as CryptoId,
                label: symbol.toUpperCase(),
                symbol,
                cryptoName: name,
                coingeckoId,
                contractAddress: null,
            };

            return item;
        },
        [coins],
    );

    return {
        cryptoIdToPlatformName,
        cryptoIdToCoinName,
        cryptoIdToCoinSymbol,
        cryptoIdToNativeCoinSymbol,
        cryptoIdToSymbolAndContractAddress,
        buildCryptoOptions,
        buildDefaultCryptoOption,
    };
};
