import styled from 'styled-components';

import { typography } from '@trezor/theme';

import { Translation } from '../Translation';

const SEPARATOR_LINE_HEIGHT = 32;

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    height: ${SEPARATOR_LINE_HEIGHT}px;
`;

const Line = styled.div`
    width: 100%;
    height: 1px;
    margin: ${SEPARATOR_LINE_HEIGHT / 2 - 1}px 0 0 0;
    background: #2b2b2b;
`;

const Label = styled.span`
    display: flex;
    align-items: center;
    color: #808080;

    ${typography.label}

    text-transform: uppercase;
    background: #000;
    padding: 0 10px;
    text-align: center;
    white-space: nowrap;
    height: ${SEPARATOR_LINE_HEIGHT}px;
`;

export const DisplayPageSeparator = () => (
    <Wrapper>
        <Line />
        <Label data-testid="@device-display/paginated-text/separator">
            <Translation id="NEXT_PAGE" />
        </Label>
        <Line />
    </Wrapper>
);
