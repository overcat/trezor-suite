import { useRouteMatch } from 'react-router-dom';

import styled from 'styled-components';

import { CoinLogo } from '@trezor/product-components';
import { capitalizeFirstLetter } from '@trezor/utils';
import { getNetworkSymbolForProtocol } from '@suite-common/suite-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { fillSendForm, resetProtocol } from 'src/actions/suite/protocolActions';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import type { NotificationRendererProps } from 'src/components/suite';

import { ConditionalActionRenderer } from './ConditionalActionRenderer';

const Row = styled.span`
    display: flex;
`;

const getIcon = (symbol?: NetworkSymbol) => symbol && <CoinLogo symbol={symbol} size={24} />;

const useActionAllowed = (path: string, symbol?: NetworkSymbol) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const pathMatch = useRouteMatch(`${process.env.ASSET_PREFIX || ''}${path}`);

    return !!pathMatch && selectedAccount?.network?.symbol === symbol;
};

export const CoinProtocolRenderer = ({
    render,
    notification,
}: NotificationRendererProps<'coin-scheme-protocol'>) => {
    const dispatch = useDispatch();
    const allowed = useActionAllowed(
        '/accounts/send',
        getNetworkSymbolForProtocol(notification.scheme),
    );

    const onAction = () => dispatch(fillSendForm(true));
    const onCancel = () => dispatch(resetProtocol);

    return (
        <ConditionalActionRenderer
            render={render}
            notification={notification}
            header={<Translation id="TOAST_COIN_SCHEME_PROTOCOL_HEADER" />}
            body={
                <>
                    <Row>
                        {notification.amount && `${notification.amount} `}
                        {capitalizeFirstLetter(notification.scheme)}
                    </Row>
                    <Row>{notification.address}</Row>
                </>
            }
            actionLabel="TOAST_COIN_SCHEME_PROTOCOL_ACTION"
            actionAllowed={allowed}
            onAction={onAction}
            onCancel={onCancel}
            icon={getIcon(getNetworkSymbolForProtocol(notification.scheme))}
        />
    );
};
