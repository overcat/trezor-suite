import { useCoinmarketDeviceDisconnected } from 'src/hooks/wallet/coinmarket/form/common/useCoinmarketDeviceDisconnected';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { isCoinmarketExchangeContext } from 'src/utils/wallet/coinmarket/coinmarketTypingUtils';
import { getBestRatedQuote } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketHeader } from 'src/views/wallet/coinmarket/common/CoinmarketHeader/CoinmarketHeader';
import { CoinmarketOffersEmpty } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffersEmpty';
import { CoinmarketOffersExchange } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffersExchange';
import { CoinmarketOffersItem } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffersItem';
import { ConnectDeviceGenericPromo } from 'src/views/wallet/receive/components/ConnectDevicePromo';

export const CoinmarketOffers = () => {
    const context = useCoinmarketFormContext();
    const { type, quotes } = context;
    const hasLoadingFailed = !quotes;
    const noOffers = hasLoadingFailed || quotes.length === 0;
    const bestRatedQuote = getBestRatedQuote(quotes, type);

    const { coinmarketDeviceDisconnected } = useCoinmarketDeviceDisconnected();

    const offers = isCoinmarketExchangeContext(context) ? (
        <CoinmarketOffersExchange />
    ) : (
        quotes?.map(quote => (
            <CoinmarketOffersItem
                key={quote?.orderId}
                quote={quote}
                isBestRate={bestRatedQuote?.orderId === quote?.orderId}
            />
        ))
    );

    return (
        <>
            {coinmarketDeviceDisconnected && <ConnectDeviceGenericPromo />}

            <CoinmarketHeader
                title="TR_COINMARKET_SHOW_OFFERS"
                titleTimer="TR_COINMARKET_OFFERS_REFRESH"
            />

            {noOffers ? <CoinmarketOffersEmpty /> : offers}
        </>
    );
};
