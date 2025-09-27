import { useState } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Button, Column, Modal, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

type ActivateTokenModalProps = {
    symbol: NetworkSymbol;
    contractAddress: string;
    tokenSymbol: string;
    onCancel: () => void;
};

export const ActivateTokenModal = ({
    symbol,
    contractAddress,
    tokenSymbol,
    onCancel,
}: ActivateTokenModalProps) => {
    const [isActivating, setIsActivating] = useState(false);

    const account = useSelector(selectSelectedAccount);

    const handleActivate = async () => {
        if (!account) return;

        setIsActivating(true);
        try {
            // Here you would implement the actual token activation logic
            // This would involve creating a transaction to activate the token on Stellar
            console.log('Activating token:', { symbol, contractAddress, tokenSymbol });

            // For now, just simulate the activation
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Close modal after successful activation
            onCancel();
        } catch (error) {
            console.error('Failed to activate token:', error);
        } finally {
            setIsActivating(false);
        }
    };

    return (
        <Modal
            onCancel={onCancel}
            heading={<Translation id="TR_ACTIVATE_TOKEN" values={{ token: tokenSymbol }} />}
            bottomContent={
                <Row gap={spacings.xs}>
                    <Button variant="tertiary" onClick={onCancel} isDisabled={isActivating}>
                        <Translation id="TR_CANCEL" />
                    </Button>
                    <Button
                        onClick={handleActivate}
                        isLoading={isActivating}
                        isDisabled={!account}
                    >
                        <Translation id="TR_CONTINUE" />
                    </Button>
                </Row>
            }
        >
            <Column gap={spacings.lg}>
                <Text typographyStyle="body">
                    <Translation
                        id="TR_TOKEN_ACTIVATION_DESCRIPTION"
                        values={{
                            token: tokenSymbol,
                            network: symbol.toUpperCase(),
                            reserve: '0.5 XLM'
                        }}
                    />
                </Text>

                <Column gap={spacings.sm}>
                    <Text typographyStyle="hint" variant="tertiary">
                        <Translation id="TR_TOKEN_ACTIVATION_WARNING" />
                    </Text>
                </Column>
            </Column>
        </Modal>
    );
};
