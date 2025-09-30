import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectSelectedDevice, selectRawNetworkFeeInfo } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo, isTestnet } from '@suite-common/wallet-utils';
import { buildAddTrustlineTransaction } from '@trezor/blockchain-link-utils/src/stellar';
import TrezorConnect, { StellarAssetType } from '@trezor/connect';

export interface ActivateTokenThunkPayload {
    account: Account;
    contractAddress: string;
    tokenSymbol: string;
    selectedFee: string;
}

export interface ActivateTokenResult {
    success: boolean;
    serializedTx?: string;
    error?: string;
}

const MODULE_PREFIX = '@wallet-actions/token';

export const activateTokenThunk = createThunk<
    ActivateTokenResult,
    ActivateTokenThunkPayload,
    { rejectValue: { error: string; message: string } }
>(
    `${MODULE_PREFIX}/activateTokenThunk`,
    async ({ account, contractAddress, tokenSymbol, selectedFee }, { getState, rejectWithValue }) => {
        const device = selectSelectedDevice(getState());
        const rawFeeInfo = selectRawNetworkFeeInfo(getState(), account.symbol);

        if (!device) {
            return rejectWithValue({
                error: 'device-not-found',
                message: 'No device found for signing transaction.',
            });
        }

        if (!rawFeeInfo) {
            return rejectWithValue({
                error: 'fee-info-not-found',
                message: 'Fee information not available.',
            });
        }

        const feeInfo = getConvertedOrDefaultFeeInfo({
            networkType: account.networkType,
            feeInfo: rawFeeInfo,
        });

        const feeLevel = feeInfo.levels.find(level => level.label === selectedFee);
        if (!feeLevel) {
            return rejectWithValue({
                error: 'invalid-fee-level',
                message: 'Selected fee level is invalid.',
            });
        }

        try {
            // Parse asset info from contract address
            const [code, issuer] = contractAddress.split('-');
            const asset = {
                type: code.length <= 4 ? StellarAssetType.ALPHANUM4 : StellarAssetType.ALPHANUM12,
                code,
                issuer,
            };

            // Build the trustline transaction
            const transaction = buildAddTrustlineTransaction(
                account.descriptor,
                account.misc.stellarSequence,
                feeLevel.feePerUnit,
                asset,
                isTestnet(account.symbol),
            );

            // Sign the transaction using TrezorConnect
            const response = await TrezorConnect.stellarSignTransaction({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                },
                useEmptyPassphrase: device.useEmptyPassphrase,
                path: account.path,
                networkPassphrase: transaction.networkPassphrase,
                transaction: {
                    source: transaction.source,
                    fee: Number.parseInt(transaction.fee, 10),
                    sequence: transaction.sequence,
                    memo: { type: 0 },
                    timebounds: {
                        minTime: 0,
                        maxTime: 0,
                    },
                    operations: [{
                        type: 'changeTrust',
                        asset,
                    }],
                },
            });

            if (response.success) {
                const signature = Buffer.from(response.payload.signature, 'hex').toString('base64');
                transaction.addSignature(account.descriptor, signature);
                const serializedTx = transaction.toEnvelope().toXDR('hex');

                // TODO: Submit transaction to the network
                // This would typically involve calling blockchain-link or another service

                return {
                    success: true,
                    serializedTx,
                };
            } else {
                return rejectWithValue({
                    error: 'sign-transaction-failed',
                    message: response.payload.error,
                });
            }
        } catch (error) {
            return rejectWithValue({
                error: 'activate-token-failed',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        }
    },
);