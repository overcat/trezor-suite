import { Horizon } from '@stellar/stellar-sdk';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import type { Transaction, Target, TransactionDetail } from '@trezor/blockchain-link-types';

const BASE_REVERSE = new BigNumber('5000000'); // 0.5 XLM, https://developers.stellar.org/docs/learn/fundamentals/lumens#base-reserves
const ONE = new BigNumber('10000000');
export const MINIMUM_RESERVE = ONE;

export const toStroops = (value: string) => {
    const amount = new BigNumber(value).times(ONE);

    return amount.toString();
};

export const calculateReserve = (subentryCount: number): BigNumber => {
    const subentryReverse = BASE_REVERSE.times(subentryCount);

    return MINIMUM_RESERVE.plus(subentryReverse);
};

const isoToTimestamp = (isoDate: string): number => {
    const timestamp = Date.parse(isoDate);

    if (isNaN(timestamp)) {
        throw new Error('Invalid ISO date string');
    }

    return Math.floor(timestamp / 1000);
};

export type PaymentOperationRecord =
    | Horizon.ServerApi.PaymentOperationRecord
    | Horizon.ServerApi.CreateAccountOperationRecord
    | Horizon.ServerApi.AccountMergeOperationRecord
    | Horizon.ServerApi.PathPaymentOperationRecord
    | Horizon.ServerApi.PathPaymentStrictSendOperationRecord
    | Horizon.ServerApi.InvokeHostFunctionOperationRecord;

export const transformTransaction = async (
    rawOp: PaymentOperationRecord,
    descriptor?: string,
): Promise<Transaction> => {
    // Currently, we only support Create Account and Payment operations,
    // and only support Native Asset (which is XLM). Other types of operations and assets will be displayed as unknown.
    let type: 'unknown' | 'sent' | 'recv' | 'self' | 'joint' | 'contract' | 'failed' = 'unknown';
    let amount = '0';
    let targets: Target[] = [];
    let details: TransactionDetail = {
        vin: [],
        vout: [],
        size: 0,
        totalInput: '0',
        totalOutput: '0',
    };

    const rawTx = await rawOp.transaction();
    const blockTime = isoToTimestamp(rawTx.created_at);
    const fee = rawTx.fee_charged.toString();

    switch (rawOp.type) {
        case 'create_account':
            type = rawOp.funder === descriptor ? 'sent' : 'recv';
            amount = toStroops(rawOp.starting_balance);
            targets = [
                {
                    n: 0,
                    addresses: [rawOp.account],
                    isAddress: true,
                    amount,
                },
            ];
            details = {
                vin: [
                    {
                        n: 0,
                        addresses: [rawOp.funder],
                        isAddress: true,
                        value: amount,
                    },
                ],
                vout: [
                    {
                        n: 0,
                        addresses: [rawOp.account],
                        isAddress: true,
                        value: amount,
                    },
                ],
                size: 0,
                totalInput: amount,
                totalOutput: amount,
            };
            break;
        case 'payment':
            if (rawOp.asset_type === 'native') {
                // If it is not a native asset, we will display it as unknown tx.
                type = rawOp.from === descriptor ? 'sent' : 'recv';
                amount = toStroops(rawOp.amount);
                targets = [
                    {
                        n: 0,
                        addresses: [rawOp.to],
                        isAddress: true,
                        amount,
                    },
                ];
                details = {
                    vin: [
                        {
                            n: 0,
                            addresses: [rawOp.from],
                            isAddress: true,
                            value: amount,
                        },
                    ],
                    vout: [
                        {
                            n: 0,
                            addresses: [rawOp.to],
                            isAddress: true,
                            value: amount,
                        },
                    ],
                    size: 0,
                    totalInput: amount,
                    totalOutput: amount,
                };
            }
            break;
    }

    return {
        type,
        txid: `${rawOp.transaction_hash}#${rawOp.id}`, // A little bit of hack to make txid unique.
        amount,
        fee,
        blockTime,
        blockHeight: rawTx.ledger_attr,
        targets,
        tokens: [],
        internalTransfers: [],
        feeRate: undefined,
        details,
        stellarSpecific: {
            operationId: rawOp.id,
        },
    };
};
