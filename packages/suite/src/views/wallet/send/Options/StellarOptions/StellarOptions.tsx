import styled from 'styled-components';

import { Button, Tooltip } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';
import { Translation } from 'src/components/suite';

import { StellarMemo } from './StellarMemo';
import { OnOffSwitcher } from '../OnOffSwitcher';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    margin-right: 8px;

    & > div {
        display: inline-flex;
    }
`;

export const StellarOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction, resetDefaultValue } =
        useSendFormContext();

    const options = getDefaultValue('options', []);
    const memoEnabled = options.includes('stellarMemo');
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Wrapper>
            <Left>
                {!memoEnabled && (
                    <Tooltip
                        content={<Translation id="MEMO_TOOLTIP" />}
                        cursor="pointer"
                    >
                        <StyledButton
                            variant="tertiary"
                            size="small"
                            icon="database"
                            onClick={() => {
                                // open additional form
                                toggleOption('stellarMemo');
                                composeTransaction();
                            }}
                        >
                            <Translation id="MEMO" />
                        </StyledButton>
                    </Tooltip>
                )}

                <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                    <StyledButton
                        variant="tertiary"
                        size="small"
                        icon="broadcast"
                        onClick={() => {
                            toggleOption('broadcast');
                            composeTransaction();
                        }}
                    >
                        <Translation id="BROADCAST" />
                        <OnOffSwitcher isOn={broadcastEnabled} />
                    </StyledButton>
                </Tooltip>
            </Left>

            {memoEnabled && (
                <StellarMemo
                    close={() => {
                        resetDefaultValue('stellarMemo');
                        // close additional form
                        toggleOption('stellarMemo');
                        composeTransaction();
                    }}
                />
            )}
        </Wrapper>
    );
};
