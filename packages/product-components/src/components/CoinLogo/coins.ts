import { NetworkSymbol } from '@suite-common/wallet-config';

// These coins are not supported in Suite, but exist in Trezor Connect
export type LegacyNetworkSymbol = 'eos' | 'nem' | 'xlm' | 'xtz';

export const COINS: Record<NetworkSymbol | LegacyNetworkSymbol, string> = {
    ada: require('../../images/coins/ada.svg'),
    arb: require('../../images/coins/arb.svg'),
    base: require('../../images/coins/base.svg'),
    bch: require('../../images/coins/bch.svg'),
    bsc: require('../../images/coins/bsc.svg'),
    btc: require('../../images/coins/btc.svg'),
    btg: require('../../images/coins/btg.svg'),
    dash: require('../../images/coins/dash.svg'),
    dgb: require('../../images/coins/dgb.svg'),
    doge: require('../../images/coins/doge.svg'),
    dsol: require('../../images/coins/dsol.svg'),
    eos: require('../../images/coins/eos.svg'),
    etc: require('../../images/coins/etc.svg'),
    eth: require('../../images/coins/eth.svg'),
    ltc: require('../../images/coins/ltc.svg'),
    op: require('../../images/coins/op.svg'),
    pol: require('../../images/coins/pol.svg'),
    nem: require('../../images/coins/nem.svg'),
    nmc: require('../../images/coins/nmc.svg'),
    regtest: require('../../images/coins/btc_test.svg'),
    sol: require('../../images/coins/sol.svg'),
    tada: require('../../images/coins/tada.svg'),
    test: require('../../images/coins/btc_test.svg'),
    thol: require('../../images/coins/thol.svg'),
    tsep: require('../../images/coins/tsep.svg'),
    txrp: require('../../images/coins/txrp.svg'),
    vtc: require('../../images/coins/vtc.svg'),
    xlm: require('../../images/coins/xlm.svg'),
    xrp: require('../../images/coins/xrp.svg'),
    xtz: require('../../images/coins/xtz.svg'),
    zec: require('../../images/coins/zec.svg'),
};

export const isCoinSymbol = (
    coinSymbol: string,
): coinSymbol is NetworkSymbol | LegacyNetworkSymbol =>
    Object.prototype.hasOwnProperty.call(COINS, coinSymbol);
