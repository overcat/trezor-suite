import { RoundedIcon, RoundedIconProps } from '@suite-native/atoms';

export const StakingBadge = (props: Partial<RoundedIconProps>) => (
    <RoundedIcon
        name="piggyBank"
        color="textSubdued"
        iconSize="small"
        containerSize={22}
        {...props}
    />
);
