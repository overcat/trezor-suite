import { Fragment } from 'react';

import { Divider, Card } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';
import { CoinmarketVerify } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketVerify/CoinmarketVerify';
import { CoinmarketOfferExchangeProps } from 'src/types/coinmarket/coinmarketForm';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import useCoinmarketVerifyAccount from 'src/hooks/wallet/coinmarket/form/useCoinmarketVerifyAccount';
import {
    CoinmarketSelectedOfferStepper,
    CoinmarketSelectedOfferStepperItemProps,
} from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferStepper';
import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOfferExchangeSend } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferExchange/CoinmarketOfferExchangeSend';
import { CoinmarketOfferExchangeSendSwap } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferExchange/CoinmarketOfferExchangeSendSwap';
import { CoinmarketOfferExchangeSendApproval } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketOfferExchange/CoinmarketOfferExchangeSendApproval';

export const CoinmarketOfferExchange = ({
    account,
    selectedQuote,
    providers,
    type,
    quoteAmounts,
}: CoinmarketOfferExchangeProps) => {
    const { exchangeStep } = useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    const cryptoId = selectedQuote?.receive;
    const coinmarketVerifyAccount = useCoinmarketVerifyAccount({ cryptoId });

    const steps: CoinmarketSelectedOfferStepperItemProps[] = [
        {
            step: 'RECEIVING_ADDRESS',
            translationId: 'TR_EXCHANGE_VERIFY_ADDRESS_STEP',
            isActive: exchangeStep === 'RECEIVING_ADDRESS',
            component: cryptoId ? (
                <CoinmarketVerify
                    coinmarketVerifyAccount={coinmarketVerifyAccount}
                    cryptoId={cryptoId}
                />
            ) : null,
        },
        ...((selectedQuote.isDex
            ? [
                  {
                      step: 'SEND_APPROVAL_TRANSACTION',
                      translationId: 'TR_EXCHANGE_CREATE_APPROVAL_STEP',
                      isActive: exchangeStep === 'SEND_APPROVAL_TRANSACTION',
                      component: <CoinmarketOfferExchangeSendApproval />,
                  },
              ]
            : []) as CoinmarketSelectedOfferStepperItemProps[]),
        {
            step: 'SEND_TRANSACTION',
            translationId: 'TR_EXCHANGE_CONFIRM_SEND_STEP',
            isActive: exchangeStep === 'SEND_TRANSACTION',
            component: !selectedQuote.isDex ? (
                <CoinmarketOfferExchangeSend />
            ) : (
                <CoinmarketOfferExchangeSendSwap />
            ),
        },
    ];

    return (
        <>
            <Card>
                <CoinmarketSelectedOfferStepper steps={steps} />
                <Divider margin={{ top: spacings.lg, bottom: spacings.xl }} />
                {steps.map((step, index) => (
                    <Fragment key={index}>{step.isActive && step.component}</Fragment>
                ))}
            </Card>
            <Card>
                <CoinmarketSelectedOfferInfo
                    account={account}
                    selectedAccount={coinmarketVerifyAccount.selectedAccountOption?.account}
                    selectedQuote={selectedQuote}
                    providers={providers}
                    type={type}
                    quoteAmounts={quoteAmounts}
                />
            </Card>
        </>
    );
};
