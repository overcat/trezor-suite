import { BigNumber } from '@trezor/utils/src/bigNumber';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { STELLAR_RESERVE_INFO_URL } from '@trezor/urls';
import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';
import type { Account } from 'src/types/wallet/index';

interface StellarReserveBannerProps {
    account: Account | undefined;
}

export const StellarReserveBanner = ({ account }: StellarReserveBannerProps) => {
    if (account?.networkType !== 'stellar') return null;
    const bigBalance = new BigNumber(account.balance);
    const bigReserve = new BigNumber(account.misc.reserve);

    return bigBalance.isLessThan(bigReserve) ? (
        <Banner
            variant="warning"
            rightContent={
                <Banner.Button href={STELLAR_RESERVE_INFO_URL}>
                    <Translation id="TR_LEARN_MORE" />
                </Banner.Button>
            }
        >
            <Translation
                id="TR_STELLAR_RESERVE_INFO"
                values={{
                    minBalance: formatNetworkAmount(account.misc.reserve, 'xlm'),
                }}
            />
        </Banner>
    ) : null;
};
