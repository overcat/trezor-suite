import { Account } from '@suite-common/wallet-types';
import type { TokenDetailByMint } from '@trezor/blockchain-link-types';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';

let stellarTokensCache: TokenDetailByMint | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * 获取 Stellar 网络所有可用的 tokens，带缓存
 */
export const getStellarTokens = async (): Promise<TokenDetailByMint> => {
    const now = Date.now();

    // 如果缓存存在且未过期，返回缓存数据
    if (stellarTokensCache && (now - cacheTimestamp) < CACHE_DURATION) {
        return stellarTokensCache;
    }

    try {
        stellarTokensCache = await getTokenMetadata();
        cacheTimestamp = now;

        return stellarTokensCache;
    } catch (error) {
        console.error('Failed to fetch Stellar tokens:', error);
        // 如果有缓存数据，即使过期也返回
        if (stellarTokensCache) {
            return stellarTokensCache;
        }

        // 否则返回空对象
        return {};
    }
};

/**
 * 计算用户账户中未激活的 Stellar tokens 数量
 */
export const getInactiveStellarTokensCount = async (account: Account): Promise<number> => {
    if (account.symbol !== 'xlm') return 0;

    try {
        const allTokens = await getStellarTokens();

        // 获取用户当前已激活的 token contract addresses
        const activeTokenContracts = new Set(
            account.tokens?.map(token => token.contract) || []
        );

        // 计算有多少个可用 tokens 用户还没有激活
        const inactiveCount = Object.keys(allTokens).filter(
            contractAddress => !activeTokenContracts.has(contractAddress)
        ).length;

        return inactiveCount;
    } catch (error) {
        console.error('Error calculating inactive tokens count:', error);

        return 0;
    }
};

/**
 * 获取用户账户中未激活的 Stellar tokens 列表
 */
export const getInactiveStellarTokens = async (account: Account) => {
    if (account.symbol !== 'xlm') return [];

    try {
        const allTokens = await getStellarTokens();

        // 获取用户当前已激活的 token contract addresses
        const activeTokenContracts = new Set(
            account.tokens?.map(token => token.contract) || []
        );

        // 返回用户还没有激活的 tokens
        const inactiveTokens = Object.entries(allTokens)
            .filter(([contractAddress]) => !activeTokenContracts.has(contractAddress))
            .map(([contractAddress, tokenData]) => ({
                contract: contractAddress,
                symbol: tokenData.symbol || '',
                name: tokenData.name || '',
                issuer: (tokenData as any).issuer || '',
                decimals: (tokenData as any).decimals || 7,
            }));

        return inactiveTokens;
    } catch (error) {
        console.error('Error getting inactive tokens:', error);

        return [];
    }
};
