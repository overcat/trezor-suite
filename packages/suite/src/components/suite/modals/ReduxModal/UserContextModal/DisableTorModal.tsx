import { useState } from 'react';

import styled from 'styled-components';

import { Button, H3, Paragraph, variables } from '@trezor/components';
import { UserContextPayload } from '@suite-common/suite-types';
import { blockchainActions } from '@suite-common/wallet-core';
import { getNetwork, type NetworkSymbol } from '@suite-common/wallet-config';
import { CoinLogo } from '@trezor/product-components';

import { Modal, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { isOnionUrl } from 'src/utils/suite/tor';
import { useCustomBackends } from 'src/hooks/settings/backends';
import { AdvancedCoinSettingsModal } from 'src/components/suite/modals';

const BackendRowWrapper = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    padding: 12px 0;

    & + & {
        border-top: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    }
`;

const CoinDescription = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: start;
    margin: 0 16px;
    overflow: hidden;
`;

const CoinTitle = styled.span`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const CoinUrls = styled.span`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    white-space: nowrap;
    overflow: hidden;
    width: 100%;
    text-overflow: ellipsis;
    text-align: start;
`;

interface BackendRowProps {
    symbol: NetworkSymbol;
    urls: string[];
    onSettings: () => void;
}

const BackendRow = ({ symbol, urls, onSettings }: BackendRowProps) => (
    <BackendRowWrapper>
        <CoinLogo symbol={symbol} />
        <CoinDescription>
            <CoinTitle>{getNetwork(symbol).name}</CoinTitle>
            <CoinUrls>{urls.join(', ')}</CoinUrls>
        </CoinDescription>
        <Button variant="tertiary" onClick={onSettings} icon="settings">
            <Translation id="TR_GO_TO_SETTINGS" />
        </Button>
    </BackendRowWrapper>
);

// eslint-disable-next-line local-rules/no-override-ds-component
const Title = styled(H3)`
    text-align: left;
    margin-bottom: 12px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Description = styled(Paragraph)`
    text-align: left;
    margin-bottom: 16px;
`;

type DisableTorModalProps = Omit<Extract<UserContextPayload, { type: 'disable-tor' }>, 'type'> & {
    onCancel: () => void;
};

export const DisableTorModal = ({ onCancel, decision }: DisableTorModalProps) => {
    const dispatch = useDispatch();
    const [symbol, setSymbol] = useState<NetworkSymbol>();
    const onionBackends = useCustomBackends().filter(({ urls }) => urls.every(isOnionUrl));

    const onDisableTor = () => {
        onionBackends.forEach(({ symbol, type, urls }) =>
            dispatch(
                blockchainActions.setBackend({
                    symbol,
                    type,
                    urls: urls.filter(url => !isOnionUrl(url)),
                }),
            ),
        );
        decision.resolve(true);
        onCancel();
    };

    return (
        <>
            <Modal
                isCancelable
                onCancel={onCancel}
                heading={
                    onionBackends.length ? (
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY" />
                    ) : (
                        <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_RESOLVED" />
                    )
                }
                bottomBarComponents={
                    <Button
                        variant={onionBackends.length ? 'tertiary' : 'primary'}
                        onClick={onDisableTor}
                    >
                        <Translation
                            id={
                                onionBackends.length
                                    ? 'TR_TOR_REMOVE_ONION_AND_DISABLE'
                                    : 'TR_TOR_DISABLE'
                            }
                        />
                    </Button>
                }
            >
                {onionBackends.length ? (
                    <>
                        <Title>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_TITLE" />
                        </Title>
                        <Description>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_DESCRIPTION" />
                        </Description>
                        {onionBackends.map(({ symbol, urls }) => (
                            <BackendRow
                                key={symbol}
                                symbol={symbol}
                                urls={urls}
                                onSettings={() => setSymbol(symbol)}
                            />
                        ))}
                    </>
                ) : (
                    <>
                        <Title>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_TITLE" />
                        </Title>
                        <Description>
                            <Translation id="TR_TOR_DISABLE_ONIONS_ONLY_NO_MORE_DESCRIPTION" />
                        </Description>
                    </>
                )}
            </Modal>
            {symbol && (
                <AdvancedCoinSettingsModal symbol={symbol} onCancel={() => setSymbol(undefined)} />
            )}
        </>
    );
};
