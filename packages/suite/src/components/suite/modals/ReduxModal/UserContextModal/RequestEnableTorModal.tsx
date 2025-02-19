import { useEffect } from 'react';

import styled from 'styled-components';

import { Button, Paragraph } from '@trezor/components';
import { UserContextPayload } from '@suite-common/suite-types';
import { RequestEnableTorResponse } from '@suite-common/suite-config';

import { Modal, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectTorState } from 'src/reducers/suite/suiteReducer';

const SmallModal = styled(Modal)`
    width: 560px;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const Description = styled(Paragraph)`
    text-align: left;
    margin-bottom: 16px;
`;

const ItalicDescription = styled(Description)`
    font-style: italic;
`;

type RequestEnableTorModalProps = {
    decision: Extract<UserContextPayload, { type: 'request-enable-tor' }>['decision'];
    onCancel: () => void;
};

export const RequestEnableTorModal = ({ onCancel, decision }: RequestEnableTorModalProps) => {
    const { isTorLoading, isTorEnabled } = useSelector(selectTorState);

    useEffect(() => {
        if (isTorEnabled) {
            decision.resolve(RequestEnableTorResponse.Skip);
            onCancel();
        }
    }, [isTorEnabled, decision, onCancel]);

    const onEnableTor = () => {
        decision.resolve(RequestEnableTorResponse.Continue);
        onCancel();
    };

    const onBackClick = () => {
        decision.resolve(RequestEnableTorResponse.Back);
        onCancel();
    };

    return (
        <SmallModal
            isCancelable
            onCancel={onCancel}
            onBackClick={onBackClick}
            isHeadingCentered
            heading={<Translation id="TR_TOR_ENABLE" />}
            bottomBarComponents={
                <>
                    <Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_LEAVE" />
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onEnableTor}
                        isLoading={isTorLoading}
                        isDisabled={isTorLoading}
                    >
                        {isTorLoading ? (
                            <Translation id="TR_ENABLING_TOR" />
                        ) : (
                            <Translation id="TR_TOR_ENABLE" />
                        )}
                    </Button>
                </>
            }
        >
            <>
                <Description>
                    <Translation
                        id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_TITLE"
                        values={{
                            b: chunks => <b>{chunks}</b>,
                        }}
                    />
                </Description>
                <ItalicDescription>
                    <Translation id="TR_TOR_REQUEST_ENABLE_FOR_COIN_JOIN_SUBTITLE" />
                </ItalicDescription>
            </>
        </SmallModal>
    );
};
