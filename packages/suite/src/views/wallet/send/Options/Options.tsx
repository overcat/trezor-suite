import { useSendFormContext } from 'src/hooks/wallet';

import { BitcoinOptions } from './BitcoinOptions/BitcoinOptions';
import { CardanoOptions } from './CardanoOptions';
import { EthereumOptions } from './EthereumOptions/EthereumOptions';
import { RippleStellarOptions } from './RippleStellarOptions/RippleStellarOptions';

export const Options = () => {
    const {
        account: { networkType },
    } = useSendFormContext();

    return (
        <>
            {networkType === 'bitcoin' && <BitcoinOptions />}
            {networkType === 'ethereum' && <EthereumOptions />}
            {(networkType === 'ripple' || networkType === 'stellar') && <RippleStellarOptions />}
            {networkType === 'cardano' && <CardanoOptions />}
        </>
    );
};
