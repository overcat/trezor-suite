import { useSendFormContext } from 'src/hooks/wallet';

import { BitcoinOptions } from './BitcoinOptions/BitcoinOptions';
import { EthereumOptions } from './EthereumOptions/EthereumOptions';
import { RippleOptions } from './RippleOptions/RippleOptions';
import { CardanoOptions } from './CardanoOptions';
import { StellarOptions } from './StellarOptions/StellarOptions';

export const Options = () => {
    const {
        account: { networkType },
    } = useSendFormContext();

    return (
        <>
            {networkType === 'bitcoin' && <BitcoinOptions />}
            {networkType === 'ethereum' && <EthereumOptions />}
            {networkType === 'ripple' && <RippleOptions />}
            {networkType === 'stellar' && <StellarOptions />}
            {networkType === 'cardano' && <CardanoOptions />}
        </>
    );
};
