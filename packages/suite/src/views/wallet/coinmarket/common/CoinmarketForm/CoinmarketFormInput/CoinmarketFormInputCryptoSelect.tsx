import { Controller } from 'react-hook-form';
import { useMemo, useState } from 'react';

import { Badge, Row, Select, Text } from '@trezor/components';
import {
    SearchAsset,
    SelectAssetModal,
    NetworkFilterCategory,
    NetworkTabs,
    SelectAssetSearchCategory,
    AssetProps,
    ITEM_HEIGHT,
    AssetOptionBaseProps,
} from '@trezor/product-components';
import {
    type NetworkSymbol,
    getNetworkByCoingeckoNativeId,
    getNetworkByCoingeckoId,
    getNetwork,
    networkSymbolCollection,
} from '@suite-common/wallet-config';
import { spacings } from '@trezor/theme';

import {
    CoinmarketAccountOptionsGroupOptionProps,
    CoinmarketCryptoSelectItemProps,
    CoinmarketTradeBuyExchangeType,
    SelectAssetOptionProps,
} from 'src/types/coinmarket/coinmarket';
import { Translation } from 'src/components/suite';
import {
    CoinmarketBuyFormProps,
    CoinmarketExchangeFormProps,
    CoinmarketFormInputCryptoSelectProps,
} from 'src/types/coinmarket/coinmarketForm';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import {
    cryptoPlatformSeparator,
    parseCryptoId,
} from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import {
    FORM_CRYPTO_CURRENCY_SELECT,
    FORM_RECEIVE_CRYPTO_CURRENCY_SELECT,
} from 'src/constants/wallet/coinmarket/form';
import { isCoinmarketExchangeContext } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { useTranslation } from 'src/hooks/suite';

import { CoinmarketCoinLogo } from '../../CoinmarketCoinLogo';

const getNetworkCount = (options: SelectAssetOptionProps[]) => {
    const networkNetworkGroups = options
        .filter(item => item.type === 'group' && item.networkName)
        .map(networkGroup => ({
            ...networkGroup,
            coingeckoNativeId: networkGroup.coingeckoId
                ? getNetworkByCoingeckoId(networkGroup.coingeckoId)?.coingeckoNativeId
                : undefined,
        }));

    const networkCurrencies = options.filter(
        item =>
            item.type === 'currency' &&
            !item.contractAddress &&
            !networkNetworkGroups.find(
                group =>
                    group.coingeckoId === item.coingeckoId ||
                    group.coingeckoNativeId === item.coingeckoId,
            ),
    );

    return networkNetworkGroups.length + networkCurrencies.length;
};

const getData = (options: SelectAssetOptionProps[]): AssetProps[] =>
    options
        .filter(item => item.type === 'currency')
        .map(item => ({
            ticker: item.label ?? item.ticker,
            symbol: item.symbol,
            cryptoName: item.cryptoName ?? item.ticker,
            badge: item.badge ?? item.networkName,
            coingeckoId: item.coingeckoId,
            contractAddress: item.contractAddress,
            height: ITEM_HEIGHT,
        }));

export const CoinmarketFormInputCryptoSelect = <
    TFieldValues extends CoinmarketBuyFormProps | CoinmarketExchangeFormProps,
>({
    label,
    cryptoSelectName,
    supportedCryptoCurrencies,
    methods,
    isDisabled,
}: CoinmarketFormInputCryptoSelectProps<TFieldValues>) => {
    const context = useCoinmarketFormContext<CoinmarketTradeBuyExchangeType>();
    const { buildCryptoOptions, cryptoIdToPlatformName } = useCoinmarketInfo();
    const { control } = methods;
    const [isModalActive, setIsModalActive] = useState(false);
    const [activeTab, setActiveTab] = useState<SelectAssetSearchCategory>(null); // coingeckoNativeId as fallback for ex. polygon
    const [search, setSearch] = useState('');
    const { translationString } = useTranslation();

    const sendCryptoSelectValue = isCoinmarketExchangeContext(context)
        ? context.getValues()?.sendCryptoSelect?.value
        : null;

    const formOptions = useMemo(
        () =>
            buildCryptoOptions(
                supportedCryptoCurrencies ?? new Set(),
                sendCryptoSelectValue ? new Set([sendCryptoSelectValue]) : new Set(),
            ),
        [buildCryptoOptions, sendCryptoSelectValue, supportedCryptoCurrencies],
    );

    const modalOptions: SelectAssetOptionProps[] = useMemo(
        () =>
            formOptions.map(
                (option): SelectAssetOptionProps =>
                    option.type === 'currency'
                        ? {
                              ...option,
                              ticker: option.ticker || option.label,
                              symbol:
                                  getNetworkByCoingeckoNativeId(
                                      parseCryptoId(option.value).networkId,
                                  )?.symbol || parseCryptoId(option.value).networkId,
                              contractAddress: option.contractAddress ?? null,
                          }
                        : option,
            ),
        [formOptions],
    );

    const handleSelectChange = (selectedAsset: AssetOptionBaseProps) => {
        const findOption = formOptions.find(option => {
            const cryptoId = selectedAsset.contractAddress
                ? `${selectedAsset.coingeckoId}${cryptoPlatformSeparator}${selectedAsset.contractAddress}`
                : selectedAsset.coingeckoId;

            return option.type === 'currency' && option.value === cryptoId;
        }) as CoinmarketCryptoSelectItemProps | undefined;

        if (!findOption) return;

        if (isCoinmarketExchangeContext(context)) {
            context.setValue(FORM_RECEIVE_CRYPTO_CURRENCY_SELECT, findOption);
        } else {
            context.setValue(FORM_CRYPTO_CURRENCY_SELECT, findOption);
        }

        setIsModalActive(false);
    };

    const getNetworks = () => {
        const networksToSelect: NetworkSymbol[] = ['eth', 'sol', 'pol', 'bsc'];
        const networkKeys = networkSymbolCollection.filter(item => networksToSelect.includes(item));
        const networksSelected: NetworkFilterCategory[] = networkKeys.map(networkKey => {
            const network = getNetwork(networkKey);

            return {
                name: network.name,
                symbol: network.symbol,
                coingeckoId: network.coingeckoId,
                coingeckoNativeId: network.coingeckoNativeId,
            };
        });

        return networksSelected;
    };

    const data = useMemo(() => getData(modalOptions), [modalOptions]);

    const filteredData = data.filter(item => {
        if (
            activeTab &&
            item.coingeckoId !== activeTab.coingeckoId &&
            item.coingeckoId !== activeTab.coingeckoNativeId
        ) {
            return false;
        }

        const contractAddress = item.contractAddress || undefined;
        const searchFor = (property?: string) =>
            property?.toLocaleLowerCase().includes(search.toLocaleLowerCase());

        return (
            searchFor(item.cryptoName) ||
            (typeof item.badge === 'string' && searchFor(item.badge)) ||
            searchFor(item.ticker) ||
            searchFor(contractAddress) ||
            searchFor(item.symbol)
        );
    });

    const tabs = getNetworks();

    return (
        <>
            {isModalActive && (
                <SelectAssetModal
                    data-testid="@coinmarket/form/select-crypto"
                    options={filteredData}
                    onSelectAsset={handleSelectChange}
                    onClose={() => setIsModalActive(false)}
                    searchInput={
                        <SearchAsset
                            data-testid="@coinmarket/form/select-crypto/search-input"
                            searchPlaceholder={translationString('TR_SELECT_NAME_OR_ADDRESS')}
                            search={search}
                            setSearch={setSearch}
                        />
                    }
                    noItemsAvailablePlaceholder={{
                        heading: (
                            <Translation
                                id="TR_TOKEN_NOT_FOUND_ON_NETWORK"
                                values={{
                                    networkName: tabs.find(
                                        (category: NetworkFilterCategory) =>
                                            category.coingeckoId === activeTab?.coingeckoId,
                                    )?.name,
                                }}
                            />
                        ),
                        body: <Translation id="TR_TOKEN_TRY_DIFFERENT_SEARCH_OR_SWITCH" />,
                    }}
                    filterTabs={
                        <NetworkTabs
                            data-testid="@coinmarket/form/select-crypto/network-tab"
                            tabs={tabs}
                            networkCount={getNetworkCount(modalOptions)}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    }
                />
            )}
            {/* TODO: Select not needed  */}
            <Controller
                name={cryptoSelectName}
                control={control}
                render={({ field: { value } }) => (
                    <Select
                        value={value}
                        options={formOptions}
                        labelLeft={label && <Translation id={label} />}
                        onMenuOpen={() => setIsModalActive(true)}
                        formatOptionLabel={(option: CoinmarketAccountOptionsGroupOptionProps) => {
                            const { networkId, contractAddress } = parseCryptoId(option.value);
                            const platform = cryptoIdToPlatformName(networkId);

                            return (
                                <Row gap={spacings.sm}>
                                    <CoinmarketCoinLogo cryptoId={option.value} size={20} />
                                    <Text>{option.label}</Text>
                                    <Text variant="tertiary" typographyStyle="label">
                                        {option.cryptoName}
                                    </Text>
                                    {contractAddress && <Badge size="small">{platform}</Badge>}
                                </Row>
                            );
                        }}
                        data-testid="@coinmarket/form/select-crypto"
                        isClearable={false}
                        isMenuOpen={false}
                        isDisabled={isDisabled}
                    />
                )}
            />
        </>
    );
};
