import { CryptoId } from 'invity-api';

import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';

interface CoinmarketCryptoAmountProps {
    amount: string | number;
    cryptoId: CryptoId;
}

export const CoinmarketFormOfferCryptoAmount = ({
    amount,
    cryptoId,
}: CoinmarketCryptoAmountProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useCoinmarketInfo();
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoId);

    if (!coinSymbol) {
        return;
    }

    return (
        <Row gap={spacings.sm}>
            <CoinmarketCoinLogo cryptoId={cryptoId} />
            <Text
                data-testid="@coinmarket/best-offer/amount"
                typographyStyle="titleMedium"
                ellipsisLineCount={2}
            >
                <FormattedCryptoAmount
                    value={amount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                    isRawString
                    isBalance={false}
                />
            </Text>
        </Row>
    );
};
