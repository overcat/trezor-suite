import { Button, Tooltip } from '@trezor/components';

import { ButtonVariant } from '../../buttons/buttonStyleUtils';

const DEFAULT_VARIANT = 'tertiary';

export type FractionButtonProps = {
    id: string;
    children: React.ReactNode;
    tooltip?: React.ReactNode;
    isDisabled?: boolean;
    isSubtle?: boolean;
    variant?: ButtonVariant;
    onClick: () => void;
};

export const FractionButton = ({
    id,
    children,
    tooltip,
    isDisabled,
    isSubtle,
    variant,
    onClick,
}: FractionButtonProps) => (
    <Tooltip key={id} content={tooltip} cursor="pointer">
        <Button
            variant={variant ?? DEFAULT_VARIANT}
            type="button"
            size="tiny"
            isDisabled={isDisabled}
            isSubtle={isSubtle}
            onClick={onClick}
        >
            {children}
        </Button>
    </Tooltip>
);
