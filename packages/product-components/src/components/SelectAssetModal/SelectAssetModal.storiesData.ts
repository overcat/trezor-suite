import { NetworkFilterCategory } from './NetworkTabs';
import { AssetOptionBaseProps } from './SelectAssetModal';

interface SelectAssetOptionCurrencyProps extends AssetOptionBaseProps {
    type: 'currency';
    label?: string;
    balance?: string;
    networkName?: string;
    value: string;
}

interface SelectAssetOptionGroupProps {
    type: 'group';
    label: string;
    networkName?: string;
    coingeckoId?: string;
}

export const selectAssetModalOptions: (
    | SelectAssetOptionCurrencyProps
    | SelectAssetOptionGroupProps
)[] = [
    {
        type: 'group',
        label: 'TR_COINMARKET_POPULAR_CURRENCIES',
    },
    {
        type: 'currency',
        value: 'bitcoin',
        label: 'BTC',
        cryptoName: 'Bitcoin',
        coingeckoId: 'bitcoin',
        contractAddress: null,
        ticker: 'BTC',
        symbol: 'btc',
    },
    {
        type: 'currency',
        value: 'litecoin',
        label: 'LTC',
        cryptoName: 'Litecoin',
        coingeckoId: 'litecoin',
        contractAddress: null,
        ticker: 'LTC',
        symbol: 'ltc',
    },
    {
        type: 'currency',
        value: 'cardano',
        label: 'ADA',
        cryptoName: 'Cardano',
        coingeckoId: 'cardano',
        contractAddress: null,
        ticker: 'ADA',
        symbol: 'ada',
    },
    {
        type: 'currency',
        value: 'solana',
        label: 'SOL',
        cryptoName: 'Solana',
        coingeckoId: 'solana',
        contractAddress: null,
        ticker: 'SOL',
        symbol: 'sol',
    },
    {
        type: 'currency',
        value: 'bitcoin-gold',
        label: 'BTG',
        cryptoName: 'Bitcoin Gold',
        coingeckoId: 'bitcoin-gold',
        contractAddress: null,
        ticker: 'BTG',
        symbol: 'btg',
    },
    {
        type: 'currency',
        value: 'zcash',
        label: 'ZEC',
        cryptoName: 'Zcash',
        coingeckoId: 'zcash',
        contractAddress: null,
        ticker: 'ZEC',
        symbol: 'zec',
    },
    {
        type: 'currency',
        value: 'ethereum-classic',
        label: 'ETC',
        cryptoName: 'Ethereum Classic',
        coingeckoId: 'ethereum-classic',
        contractAddress: null,
        ticker: 'ETC',
        symbol: 'etc',
    },
    {
        type: 'currency',
        value: 'bitcoin-cash',
        label: 'BCH',
        cryptoName: 'Bitcoin Cash',
        coingeckoId: 'bitcoin-cash',
        contractAddress: null,
        ticker: 'BCH',
        symbol: 'bch',
    },
    {
        type: 'currency',
        value: 'dash',
        label: 'DASH',
        cryptoName: 'Dash',
        coingeckoId: 'dash',
        contractAddress: null,
        ticker: 'DASH',
        symbol: 'dash',
    },
    {
        type: 'currency',
        value: 'ripple',
        label: 'XRP',
        cryptoName: 'XRP',
        coingeckoId: 'ripple',
        contractAddress: null,
        ticker: 'XRP',
        symbol: 'xrp',
    },
    {
        type: 'currency',
        value: 'digibyte',
        label: 'DGB',
        cryptoName: 'DigiByte',
        coingeckoId: 'digibyte',
        contractAddress: null,
        ticker: 'DGB',
        symbol: 'dgb',
    },
    {
        type: 'currency',
        value: 'dogecoin',
        label: 'DOGE',
        cryptoName: 'Dogecoin',
        coingeckoId: 'dogecoin',
        contractAddress: null,
        ticker: 'DOGE',
        symbol: 'doge',
    },
    {
        type: 'currency',
        value: 'polygon-ecosystem-token',
        label: 'POL',
        cryptoName: 'POL (ex-MATIC)',
        coingeckoId: 'polygon-ecosystem-token',
        contractAddress: null,
        ticker: 'POL',
        symbol: 'pol',
    },
    {
        type: 'currency',
        value: 'binancecoin',
        label: 'BNB',
        cryptoName: 'BNB',
        coingeckoId: 'binancecoin',
        contractAddress: null,
        ticker: 'BNB',
        symbol: 'bnb',
    },
    {
        type: 'group',
        label: 'TR_COINMARKET_OTHER_CURRENCIES',
    },
    {
        type: 'currency',
        value: 'monero',
        label: 'XMR',
        cryptoName: 'Monero',
        coingeckoId: 'monero',
        contractAddress: null,
        ticker: 'XMR',
        symbol: 'monero',
    },
    {
        type: 'currency',
        value: 'verge',
        label: 'XVG',
        cryptoName: 'Verge',
        coingeckoId: 'verge',
        contractAddress: null,
        ticker: 'XVG',
        symbol: 'verge',
    },
    {
        type: 'currency',
        value: 'qtum',
        label: 'QTUM',
        cryptoName: 'Qtum',
        coingeckoId: 'qtum',
        contractAddress: null,
        ticker: 'QTUM',
        symbol: 'qtum',
    },
    {
        type: 'currency',
        value: 'stellar',
        label: 'XLM',
        cryptoName: 'Stellar',
        coingeckoId: 'stellar',
        contractAddress: null,
        ticker: 'XLM',
        symbol: 'xlm',
    },
    {
        type: 'currency',
        value: 'nem',
        label: 'XEM',
        cryptoName: 'NEM',
        coingeckoId: 'nem',
        contractAddress: null,
        ticker: 'XEM',
        symbol: 'nem',
    },
    {
        type: 'group',
        label: 'TR_COINMARKET_NETWORK_TOKENS',
        coingeckoId: 'ethereum',
        networkName: 'Ethereum',
    },
    {
        type: 'currency',
        value: 'ethereum--0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
        label: 'OMG',
        cryptoName: 'OMG Network',
        coingeckoId: 'ethereum',
        contractAddress: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
        networkName: 'Ethereum',
        ticker: 'OMG',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0x595832f8fc6bf59c85c527fec3740a1b7a361269',
        label: 'POWR',
        cryptoName: 'Powerledger',
        coingeckoId: 'ethereum',
        contractAddress: '0x595832f8fc6bf59c85c527fec3740a1b7a361269',
        networkName: 'Ethereum',
        ticker: 'POWR',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0x41e5560054824ea6b0732e656e3ad64e20e94e45',
        label: 'CVC',
        cryptoName: 'Civic',
        coingeckoId: 'ethereum',
        contractAddress: '0x41e5560054824ea6b0732e656e3ad64e20e94e45',
        networkName: 'Ethereum',
        ticker: 'CVC',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac',
        label: 'STORJ',
        cryptoName: 'Storj',
        coingeckoId: 'ethereum',
        contractAddress: '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac',
        networkName: 'Ethereum',
        ticker: 'STORJ',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0x744d70fdbe2ba4cf95131626614a1763df805b9e',
        label: 'SNT',
        cryptoName: 'Status',
        coingeckoId: 'ethereum',
        contractAddress: '0x744d70fdbe2ba4cf95131626614a1763df805b9e',
        networkName: 'Ethereum',
        ticker: 'SNT',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0xe41d2489571d322189246dafa5ebde1f4699f498',
        label: 'ZRX',
        cryptoName: '0x Protocol',
        coingeckoId: 'ethereum',
        contractAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
        networkName: 'Ethereum',
        ticker: 'ZRX',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
        label: 'LRC',
        cryptoName: 'Loopring',
        coingeckoId: 'ethereum',
        contractAddress: '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
        networkName: 'Ethereum',
        ticker: 'LRC',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0xade00c28244d5ce17d72e40330b1c318cd12b7c3',
        label: 'ADX',
        cryptoName: 'AdEx',
        coingeckoId: 'ethereum',
        contractAddress: '0xade00c28244d5ce17d72e40330b1c318cd12b7c3',
        networkName: 'Ethereum',
        ticker: 'ADX',
        symbol: 'eth',
    },
    {
        type: 'currency',
        value: 'ethereum--0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
        label: 'BNT',
        cryptoName: 'Bancor Network',
        coingeckoId: 'ethereum',
        contractAddress: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
        networkName: 'Ethereum',
        ticker: 'BNT',
        symbol: 'eth',
    },
    {
        type: 'group',
        label: 'TR_COINMARKET_NETWORK_TOKENS',
        coingeckoId: 'solana',
        networkName: 'Solana',
    },
    {
        type: 'currency',
        value: 'solana--Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        label: 'USDT',
        cryptoName: 'Tether',
        coingeckoId: 'solana',
        contractAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        networkName: 'Solana',
        ticker: 'USDT',
        symbol: 'sol',
    },
    {
        type: 'currency',
        value: 'solana--EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        label: 'USDC',
        cryptoName: 'USDC',
        coingeckoId: 'solana',
        contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        networkName: 'Solana',
        ticker: 'USDC',
        symbol: 'sol',
    },
    {
        type: 'currency',
        value: 'solana--4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        label: 'RAY',
        cryptoName: 'Raydium',
        coingeckoId: 'solana',
        contractAddress: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        networkName: 'Solana',
        ticker: 'RAY',
        symbol: 'sol',
    },
    {
        type: 'currency',
        value: 'solana--7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx',
        label: 'GMT',
        cryptoName: 'GMT',
        coingeckoId: 'solana',
        contractAddress: '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx',
        networkName: 'Solana',
        ticker: 'GMT',
        symbol: 'sol',
    },
    {
        type: 'group',
        label: 'TR_COINMARKET_NETWORK_TOKENS',
        coingeckoId: 'binance-smart-chain',
        networkName: 'BNB Smart Chain',
    },
    {
        type: 'currency',
        value: 'binance-smart-chain--0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        label: 'CAKE',
        cryptoName: 'PancakeSwap',
        coingeckoId: 'binance-smart-chain',
        contractAddress: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        networkName: 'BNB Smart Chain',
        ticker: 'CAKE',
        symbol: 'binance-smart-chain',
    },
    {
        type: 'currency',
        value: 'binance-smart-chain--0xe02df9e3e622debdd69fb838bb799e3f168902c5',
        label: 'BAKE',
        cryptoName: 'BakerySwap',
        coingeckoId: 'binance-smart-chain',
        contractAddress: '0xe02df9e3e622debdd69fb838bb799e3f168902c5',
        networkName: 'BNB Smart Chain',
        ticker: 'BAKE',
        symbol: 'binance-smart-chain',
    },
    {
        type: 'currency',
        value: 'binance-smart-chain--0xfd7b3a77848f1c2d67e05e54d78d174a0c850335',
        label: 'ONT',
        cryptoName: 'Binance-Peg Ontology',
        coingeckoId: 'binance-smart-chain',
        contractAddress: '0xfd7b3a77848f1c2d67e05e54d78d174a0c850335',
        networkName: 'BNB Smart Chain',
        ticker: 'ONT',
        symbol: 'binance-smart-chain',
    },
    {
        type: 'currency',
        value: 'binance-smart-chain--0xe9e7cea3dedca5984780bafc599bd69add087d56',
        label: 'BUSD',
        cryptoName: 'Binance-Peg BUSD',
        coingeckoId: 'binance-smart-chain',
        contractAddress: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
        networkName: 'BNB Smart Chain',
        ticker: 'BUSD',
        symbol: 'binance-smart-chain',
    },
    {
        type: 'group',
        label: 'TR_COINMARKET_NETWORK_TOKENS',
        coingeckoId: 'base',
        networkName: 'Base',
    },
    {
        type: 'currency',
        value: 'base--0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        label: 'USDC',
        cryptoName: 'USDC',
        coingeckoId: 'base',
        contractAddress: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        networkName: 'Base',
        ticker: 'USDC',
        symbol: 'base',
    },
    {
        type: 'currency',
        value: 'base--0x532f27101965dd16442e59d40670faf5ebb142e4',
        label: 'BRETT',
        cryptoName: 'Brett',
        coingeckoId: 'base',
        contractAddress: '0x532f27101965dd16442e59d40670faf5ebb142e4',
        networkName: 'Base',
        ticker: 'BRETT',
        symbol: 'base',
    },
];

export const selectAssetModalNetworks: NetworkFilterCategory[] = [
    {
        name: 'Ethereum',
        symbol: 'eth',
        coingeckoId: 'ethereum',
        coingeckoNativeId: 'ethereum',
    },
    {
        name: 'Polygon PoS',
        symbol: 'pol',
        coingeckoId: 'polygon-pos',
        coingeckoNativeId: 'polygon-ecosystem-token',
    },
    {
        name: 'Solana',
        symbol: 'sol',
        coingeckoId: 'solana',
        coingeckoNativeId: 'solana',
    },
    {
        name: 'BNB Smart Chain',
        symbol: 'bnb',
        coingeckoId: 'binance-smart-chain',
        coingeckoNativeId: 'binancecoin',
    },
];
