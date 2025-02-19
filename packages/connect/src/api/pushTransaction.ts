// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/PushTransaction.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfo } from '../data/coinInfo';
import { ERRORS } from '../constants';
import { isBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { CoinInfo } from '../types';
import { PushTransaction as PushTransactionSchema } from '../types/api/pushTransaction';

type Params = {
    tx: string;
    coinInfo: CoinInfo;
    identity?: string;
};

export default class PushTransaction extends AbstractMethod<'pushTransaction', Params> {
    init() {
        this.requiredPermissions = ['push_tx'];
        this.useUi = false;
        this.useDevice = false;

        const { payload } = this;

        // validate incoming parameters
        Assert(PushTransactionSchema, payload);

        const coinInfo = getCoinInfo(payload.coin);
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        // validate backend
        isBackendSupported(coinInfo);

        if (coinInfo.type === 'bitcoin' && !/^[0-9A-Fa-f]*$/.test(payload.tx)) {
            throw ERRORS.TypedError('Method_InvalidParameter', 'Transaction must be hexadecimal');
        }

        this.params = {
            tx: payload.tx,
            coinInfo,
            identity: payload.identity,
        };
    }

    async run() {
        const backend = await initBlockchain(
            this.params.coinInfo,
            this.postMessage,
            this.params.identity,
        );
        const txid = await backend.pushTransaction(this.params.tx);

        return {
            txid,
        };
    }
}
