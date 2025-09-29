import { useEffect, useState } from 'react';

import { getCoingeckoId } from '@suite-common/wallet-config';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import {
    AssetLogo,
    Button,
    Row,
    Table,
    Text,
    Tooltip
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getTokenMetadata } from '@trezor/blockchain-link-utils/src/stellar';

import { openModal } from 'src/actions/suite/modalActions';
import { Loading, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

import { NoTokens } from '../common/NoTokens';
import { NoSearchResultsWrapped } from '../common/TokensTable/TokensTable';

type InactiveToken = {
    contract: string;
    symbol: string;
    name: string;
    issuer?: string;
    decimals: number;
};


/**
 * 获取用户账户中未激活的 Stellar tokens 列表
 */
const getInactiveStellarTokens = async (account: Account): Promise<InactiveToken[]> => {
    if (account.symbol !== 'xlm') return [];

    try {
        const allTokens = await getTokenMetadata();

        // 获取用户当前已激活的 token contract addresses
        const activeTokenContracts = new Set(
            account.tokens?.map(token => token.contract) || []
        );

        // 返回用户还没有激活的 tokens
        const inactiveTokens = Object.entries(allTokens)
            .filter(([contractAddress]) => !activeTokenContracts.has(contractAddress))
            .map(([contractAddress, tokenData]) => ({
                contract: contractAddress,
                symbol: tokenData.symbol || '',
                name: tokenData.name || '',
                issuer: (tokenData as any).issuer || '',
                decimals: (tokenData as any).decimals || 7,
            }));

        return inactiveTokens;
    } catch (error) {
        console.error('Error getting inactive tokens:', error);

        return [];
    }
};

interface InactiveTokensTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}


export const InactiveTokensTable = ({ selectedAccount, searchQuery }: InactiveTokensTableProps) => {
    const dispatch = useDispatch();
    const { account } = selectedAccount;
    const coingeckoId = getCoingeckoId(account.symbol);
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
        return <NoTokens title={<Translation id="TR_INACTIVE_TOKENS_EMPTY" />} />;
    }

    if (isLoading) {
        return <Loading />;
    }

    if (filteredTokens.length === 0 && searchQuery) {
        return <NoSearchResultsWrapped />;
    }

    if (filteredTokens.length === 0) {
        return <NoTokens title={<Translation id="TR_INACTIVE_TOKENS_EMPTY" />} />;
    }

    return (
        <Table
            margin={{ top: spacings.xs }}
            colWidths={[
                { minWidth: '200px' },
                { minWidth: '200px' },
                { minWidth: '120px', maxWidth: '150px' },
            ]}
            isRowHighlightedOnHover
        >
            <Table.Header>
                <Table.Row>
                    <Table.Cell>
                        <Translation id="TR_TOKEN" />
                    </Table.Cell>
                    <Table.Cell>
                        <Translation id="TR_ISSUER" />
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
                                    coingeckoId={coingeckoId || ''}
                                    placeholder={token.name || token.symbol || 'token'}
                                    contractAddress={getContractAddressForNetworkSymbol(account.symbol, token.contract)}
                                    size={24}
                                    shouldTryToFetch={true}
                                />
                                <Row gap={spacings.xs}>
                                    <Text typographyStyle="body">{token.name}</Text>
                                    <Text typographyStyle="body" variant="tertiary">{token.symbol}</Text>
                                </Row>
                            </Row>
                        </Table.Cell>
                        <Table.Cell>
                            <Tooltip content={token.issuer || 'Unknown issuer'}>
                                <Text
                                    variant="tertiary"
                                    typographyStyle="hint"
                                >
                                    example.com
                                </Text>
                            </Tooltip>
                        </Table.Cell>
                        <Table.Cell align="end">
                            <Button
                                size="small"
                                variant="tertiary"
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
    );
};
