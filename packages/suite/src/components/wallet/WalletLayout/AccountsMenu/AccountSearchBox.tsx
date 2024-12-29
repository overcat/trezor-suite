import styled, { useTheme } from 'styled-components';

import { Icon, Input } from '@trezor/components';
import { borders } from '@trezor/theme';

import { useAccountSearch, useTranslation } from 'src/hooks/suite';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledInput = styled(Input)`
    input {
        /* to line up with the coin filter  */
        padding-left: 46px;
        min-height: 38px;
        background-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
        border-radius: ${borders.radii.full};
        border-color: ${({ theme }) => theme.backgroundSurfaceElevationNegative};
    }
`;

export const AccountSearchBox = () => {
    const theme = useTheme();
    const { translationString } = useTranslation();
    const { setCoinFilter, searchString, setSearchString } = useAccountSearch();

    const onClear = () => {
        setSearchString(undefined);
        setCoinFilter(undefined);
    };

    return (
        <StyledInput
            value={searchString ?? ''}
            onChange={e => {
                setSearchString(e.target.value);
            }}
            innerAddon={<Icon name="search" size={16} color={theme.iconDefault} />}
            innerAddonAlign="left"
            size="small"
            placeholder={translationString('TR_SEARCH')}
            showClearButton="always"
            onClear={onClear}
            data-testid="@account-menu/search-input"
        />
    );
};
