import styled from 'styled-components';

import { typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { CoinmarketOffersItemProps } from 'src/views/wallet/coinmarket/common/CoinmarketOffers/CoinmarketOffersItem';

const TooltipRow = styled.div`
    display: flex;
    justify-content: space-between;
    min-width: 129px;
`;

const TooltipProperty = styled.div`
    ${typography.hint};
    width: 70%;
`;

const TooltipValue = styled.div`
    ${typography.hint};
    text-align: right;
`;

// IN TESTING MODE
export const CoinmarketUtilsTooltipFee = (_props: Pick<CoinmarketOffersItemProps, 'quote'>) => (
    <>
        <TooltipRow>
            <TooltipProperty>
                <Translation id="TR_COINMARKET_NETWORK_FEE" />:
            </TooltipProperty>
            <TooltipValue>$2.0</TooltipValue>
        </TooltipRow>
        <TooltipRow>
            <TooltipProperty>
                <Translation id="TR_COINMARKET_TRADE_FEE" />:
            </TooltipProperty>
            <TooltipValue>$1.5</TooltipValue>
        </TooltipRow>
    </>
);
