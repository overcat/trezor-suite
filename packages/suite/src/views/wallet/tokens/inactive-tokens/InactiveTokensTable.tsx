import { useState, useEffect } from 'react';

import { SelectedAccountLoaded } from '@suite-common/wallet-types';
import {
    Card,
    Table,
    Row,
    Column,
    Text,
    Button,
    AssetLogo,
    Paragraph
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { getInactiveStellarTokens } from 'src/utils/wallet/stellarTokenUtils';

type InactiveToken = {
    contract: string;
    symbol: string;
    name: string;
    issuer?: string;
    decimals: number;
};

interface InactiveTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

const NoInactiveTokens = () => (
    <Paragraph margin={{ top: spacings.xxl, bottom: spacings.xxl }} align="center">
        <Translation id="TR_NO_INACTIVE_TOKENS_FOUND" />
    </Paragraph>
);

export const InactiveTokensTable = ({ selectedAccount, searchQuery }: InactiveTokensTableProps) => {
    const dispatch = useDispatch();
    const { account } = selectedAccount;
    const [allInactiveTokens, setAllInactiveTokens] = useState<InactiveToken[]>([]);
    const [filteredTokens, setFilteredTokens] = useState<InactiveToken[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 获取未激活的 tokens
    useEffect(() => {
        if (account.symbol === 'xlm') {
            setIsLoading(true);
            getInactiveStellarTokens(account)
                .then(tokens => {
                    setAllInactiveTokens(tokens);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error('Failed to load inactive tokens:', error);
                    setAllInactiveTokens([]);
                    setIsLoading(false);
                });
        } else {
            setAllInactiveTokens([]);
            setIsLoading(false);
        }
    }, [account]);

    // 根据搜索查询过滤 tokens
    useEffect(() => {
        if (searchQuery) {
            setFilteredTokens(
                allInactiveTokens.filter(
                    token =>
                        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredTokens(allInactiveTokens);
        }
    }, [searchQuery, allInactiveTokens]);

    const handleActivateToken = (token: InactiveToken) => {
        dispatch(
            openModal({
                type: 'activate-token',
                symbol: account.symbol,
                contractAddress: token.contract,
                tokenSymbol: token.symbol,
            })
        );
    };

    // Only show for Stellar network
    if (account.symbol !== 'xlm') {
        return (
            <Card paddingType="none" overflow="hidden">
                <NoInactiveTokens />
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card paddingType="none" overflow="hidden">
                <Paragraph margin={{ top: spacings.xxl, bottom: spacings.xxl }} align="center">
                    <Translation id="TR_LOADING" />
                </Paragraph>
            </Card>
        );
    }

    return (
        <Card paddingType="none" overflow="hidden">
            {filteredTokens.length === 0 && searchQuery ? (
                <Paragraph margin={{ top: spacings.xxl, bottom: spacings.xxl }} align="center">
                    <Translation id="TR_NO_SEARCH_RESULTS" />
                </Paragraph>
            ) : filteredTokens.length === 0 ? (
                <NoInactiveTokens />
            ) : (
                <Table
                    margin={{ top: spacings.xs }}
                    colWidths={[
                        { minWidth: '200px', maxWidth: '250px' },
                        { minWidth: '140px', maxWidth: '250px' },
                        { minWidth: '120px', maxWidth: '150px' },
                        { minWidth: '100px', maxWidth: '120px' },
                    ]}
                    isRowHighlightedOnHover
                >
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Translation id="TR_TOKEN" />
                            </Table.Cell>
                            <Table.Cell>
                                Issuer
                            </Table.Cell>
                            <Table.Cell>
                                <Translation id="TR_CONTRACT_ADDRESS" />
                            </Table.Cell>
                            <Table.Cell align="end">
                                Action
                            </Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {filteredTokens.map(token => (
                            <Table.Row key={token.contract}>
                                <Table.Cell>
                                    <Row gap={spacings.xs}>
                                        <AssetLogo
                                            coingeckoId=""
                                            placeholder={token.name || token.symbol}
                                            contractAddress={token.contract}
                                            size={24}
                                            shouldTryToFetch={false}
                                        />
                                        <Column alignItems="flex-start">
                                            <Text typographyStyle="body">{token.name}</Text>
                                            <Text variant="tertiary" typographyStyle="hint">
                                                {token.symbol}
                                            </Text>
                                        </Column>
                                    </Row>
                                </Table.Cell>
                                <Table.Cell>
                                    <Text variant="tertiary" typographyStyle="hint">
                                        {token.issuer || '—'}
                                    </Text>
                                </Table.Cell>
                                <Table.Cell>
                                    <Row gap={spacings.xs}>
                                        <Text
                                            typographyStyle="hint"
                                            variant="tertiary"
                                            as="div"
                                            isMonospaced
                                        >
                                            <div style={{
                                                maxWidth: '120px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}>
                                                {token.contract}
                                            </div>
                                        </Text>
                                    </Row>
                                </Table.Cell>
                                <Table.Cell align="end">
                                    <Button
                                        size="small"
                                        onClick={() => handleActivateToken(token)}
                                        data-testid={`@token/activate-${token.symbol}`}
                                    >
                                        <Translation id="TR_ACTIVATE" />
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            )}
        </Card>
    );
};