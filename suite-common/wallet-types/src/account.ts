import { AccountType, BackendType, Bip43Path, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountEntityKeys } from '@suite-common/metadata-types';
import { AccountInfo, PROTO, StaticSessionId, TokenInfo } from '@trezor/connect';
import {
    AddressAlias,
    ContractInfo,
    StakingPool,
} from '@trezor/blockchain-link-types/src/blockbook-api';
import { SolanaStakingAccount } from '@trezor/blockchain-link-types/src/solana';

export type MetadataItem = string;
export type XpubAddress = string;

export type TokenSymbol = string & { __type: 'TokenSymbol' };
export type TokenAddress = string & { __type: 'TokenAddress' };

export type AddressType = 'contract' | 'fingerprint' | 'policyId';

export type TokenInfoBranded = TokenInfo & {
    symbol: TokenSymbol;
    contract: TokenAddress;
};

type AccountNetworkSpecific =
    | {
          networkType: 'bitcoin';
          misc: undefined;
          marker: undefined;
          page: AccountInfo['page'];
      }
    | {
          networkType: 'ripple';
          misc: { sequence: number; reserve: string };
          marker: AccountInfo['marker'];
          page: undefined;
      }
    | {
          networkType: 'cardano';
          marker: undefined;
          misc: {
              staking: {
                  address: string;
                  isActive: boolean;
                  rewards: string;
                  poolId: string | null;
                  drep: {
                      drep_id: string;
                      hex: string;
                      amount: string;
                      active: boolean;
                      active_epoch: number | null;
                      has_script: boolean;
                  } | null;
              };
          };
          page: AccountInfo['page'];
      }
    | {
          networkType: 'ethereum';
          misc: {
              nonce: string;
              contractInfo?: ContractInfo;
              stakingPools?: StakingPool[];
              addressAliases?: { [key: string]: AddressAlias };
          };
          marker: undefined;
          page: AccountInfo['page'];
      }
    | {
          networkType: 'solana';
          misc: {
              rent?: number;
              solStakingAccounts?: SolanaStakingAccount[];
              solEpoch?: number;
          };
          marker: undefined;
          page: AccountInfo['page'];
      };

// decides if account is using TrezorConnect/blockchain-link or other non-standard api
export type AccountBackendSpecific =
    | {
          backendType?: Exclude<BackendType, 'coinjoin'>;
      }
    | {
          backendType: Extract<BackendType, 'coinjoin'>;
          status: 'initial' | 'ready' | 'error' | 'out-of-sync';
          syncing?: boolean;
      };

export type AccountKey = string;

export type Account = {
    deviceState: StaticSessionId;
    key: AccountKey;
    index: number;
    path: Bip43Path;
    unlockPath?: PROTO.UnlockPath; // parameter used to unlock SLIP-25/coinjoin keychain
    descriptor: string;
    descriptorChecksum?: string;
    accountType: AccountType;
    symbol: NetworkSymbol;
    empty: boolean;
    visible: boolean;
    imported?: boolean;
    failed?: boolean;
    balance: string;
    availableBalance: string;
    formattedBalance: string;
    tokens: AccountInfo['tokens'];
    addresses?: AccountInfo['addresses'];
    utxo: AccountInfo['utxo'];
    history: AccountInfo['history'];
    metadata: AccountEntityKeys;
    /**
     * accountLabel was introduced by mobile app. In early stage of development, it was not possible to connect device and work with
     * metadata/labeling feature which requires device for encryption. local accountLabel field was introduced.
     */
    accountLabel?: string;
    ts: number;
} & AccountBackendSpecific &
    AccountNetworkSpecific;

export type UppercaseAccountType = Uppercase<AccountType>;

export type WalletParams =
    | NonNullable<{
          symbol: NetworkSymbol;
          accountIndex: number;
          accountType: AccountType | 'normal';
          contractAddress?: string;
      }>
    | undefined;

export interface ReceiveInfo {
    path: string;
    address: string;
    isVerified: boolean;
}

export interface StakingPoolExtended extends StakingPool {
    totalPendingStakeBalance: string;
    canClaim: boolean;
}
