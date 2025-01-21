import { spacings } from '@trezor/theme';
import { Column } from '@trezor/components';
import { Context } from '@suite-common/message-system';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';

import { Account } from 'src/types/wallet';
import { useSelector } from 'src/hooks/suite';

import { AuthConfirmFailed } from './AuthConfirmFailed';
import { BackendDisconnected } from './BackendDisconnected';
import { DeviceUnavailable } from './DeviceUnavailable';
import { XRPReserve } from './XRPReserve';
import { StellarReserveBanner } from './StellarReserveBanner';
import { AccountImported } from './AccountImported';
import { AccountOutOfSync } from './AccountOutOfSync';
import { TorDisconnected } from './TorDisconnected';
import { ContextMessage } from './ContextMessage';
import { StakeEthBanner } from './StakeEthBanner';
import { EvmExplanationBanner } from './EvmExplanationBanner';
import { TaprootBanner } from './TaprootBanner';

type AccountBannersProps = {
    account?: Account;
};

export const AccountBanners = ({ account }: AccountBannersProps) => {
    const { route } = useSelector(state => state.router);

    return (
        <Column gap={spacings.xl}>
            {account?.accountType === 'coinjoin' && <ContextMessage context={Context.coinjoin} />}
            {account?.symbol &&
                isSupportedEthStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && <ContextMessage context={Context.ethStaking} />}
            <AuthConfirmFailed />
            <BackendDisconnected />
            <DeviceUnavailable />
            <TorDisconnected />
            <XRPReserve account={account} />
            <StellarReserveBanner account={account} />
            <AccountImported account={account} />
            <AccountOutOfSync account={account} />
            <EvmExplanationBanner account={account} />
            <TaprootBanner account={account} />
            {account?.symbol && <StakeEthBanner account={account} />}
        </Column>
    );
};
