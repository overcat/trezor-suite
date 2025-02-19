import { useTheme } from 'styled-components';

import { Button, Text, IconButton, Row, Banner, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Account } from '@suite-common/wallet-types';
import { selectPoolStatsApyData } from '@suite-common/wallet-core';
import { MIN_ETH_AMOUNT_FOR_STAKING } from '@suite-common/wallet-constants';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { setFlag } from 'src/actions/suite/suiteActions';

import { selectSuiteFlags } from '../../../../reducers/suite/suiteReducer';

interface StakeEthBannerProps {
    account: Account;
}

export const StakeEthBanner = ({ account }: StakeEthBannerProps) => {
    const dispatch = useDispatch();
    const { stakeEthBannerClosed } = useSelector(selectSuiteFlags);
    const { route } = useSelector(state => state.router);
    const apy = useSelector(state => selectPoolStatsApyData(state, account.symbol));
    const theme = useTheme();

    const closeBanner = () => {
        dispatch(setFlag('stakeEthBannerClosed', true));
    };

    const goToEthStakingTab = () => {
        dispatch(goto('wallet-staking', { preserveParams: true }));
    };

    if (
        route?.name !== 'wallet-index' ||
        stakeEthBannerClosed ||
        !account ||
        !isSupportedEthStakingNetworkSymbol(account.symbol)
    ) {
        return null;
    }

    return (
        <Banner
            variant="tertiary"
            icon="piggyBankFilled"
            rightContent={
                <Row gap={8}>
                    <Button size="small" onClick={goToEthStakingTab} textWrap={false}>
                        <Translation id="TR_STAKE_LEARN_MORE" />
                    </Button>
                    <IconButton size="small" variant="tertiary" icon="x" onClick={closeBanner} />
                </Row>
            }
        >
            <Column gap={4} alignItems="flex-start" flex="1" margin={{ left: spacings.xs }}>
                <Text color={theme.textSubdued} typographyStyle="callout">
                    <Translation id="TR_STAKE_ETH_EARN_REPEAT" />
                </Text>

                <Text typographyStyle="body" textWrap="balance">
                    <Translation
                        id="TR_STAKE_ANY_AMOUNT_ETH"
                        values={{
                            apyPercent: apy,
                            networkDisplaySymbol: getNetworkDisplaySymbol(account.symbol),
                            amount: MIN_ETH_AMOUNT_FOR_STAKING.toString(),
                        }}
                    />
                </Text>
            </Column>
        </Banner>
    );
};
