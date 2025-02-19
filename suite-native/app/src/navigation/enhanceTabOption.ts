import { IconName } from '@suite-native/icons';
import { AppTabsParamList } from '@suite-native/navigation';

type TabOption<ParamList extends AppTabsParamList, RouteName extends keyof ParamList> = {
    routeName: RouteName;
    iconName: IconName;
    focusedIconName: IconName;
    label: string;
    params?: ParamList[RouteName];
};

export const enhanceTabOption = <
    ParamList extends AppTabsParamList,
    RouteName extends keyof ParamList,
>({
    routeName,
    iconName,
    focusedIconName,
    label,
    params,
}: TabOption<ParamList, RouteName>) => ({
    [routeName]: {
        routeName,
        iconName,
        focusedIconName,
        label,
        params,
    },
});
