import { ReactNode } from 'react';

import { useNavigation } from '@react-navigation/native';

import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    LegacyOnboardingStackParamList as OnboardingStackParamList,
    LegacyOnboardingStackRoutes as OnboardingStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { TxKeyPath, Translation } from '@suite-native/intl';

import { OnboardingFooter } from '../components/OnboardingFooter';
import { OnboardingScreen } from '../components/OnboardingScreen';
import { CoinsSvg } from '../components/CoinsSvg';
import { OnboardingScreenHeader } from '../components/OnboardingScreenHeader';

type NavigationProps = StackNavigationProps<
    OnboardingStackParamList,
    OnboardingStackRoutes.AboutReceiveCoinsFeature
>;

type ScreenContent = {
    title: TxKeyPath;
    subtitle: TxKeyPath;
    redirectTarget: OnboardingStackRoutes;
};
const receiveScreenContentMap = {
    device: {
        title: 'moduleOnboarding.featureReceiveScreen.device.title',
        subtitle: 'moduleOnboarding.featureReceiveScreen.device.subtitle',
        redirectTarget: OnboardingStackRoutes.TrackBalances,
    },
    portfolioTracker: {
        title: 'moduleOnboarding.featureReceiveScreen.portfolioTracker.title',
        subtitle: 'moduleOnboarding.featureReceiveScreen.portfolioTracker.subtitle',
        redirectTarget: OnboardingStackRoutes.AnalyticsConsent,
    },
} as const satisfies Record<'device' | 'portfolioTracker', ScreenContent>;

const IconWrapper = ({ children }: { children: ReactNode }) => {
    const isUsbDeviceConnectFeatureEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    if (!isUsbDeviceConnectFeatureEnabled) return <>{children}</>;

    return (
        <Box alignItems="center" flex={1} justifyContent="center">
            {children}
        </Box>
    );
};

export const FeatureReceiveScreen = () => {
    const navigation = useNavigation<NavigationProps>();
    const isUsbDeviceConnectFeatureEnabled = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const content =
        receiveScreenContentMap[isUsbDeviceConnectFeatureEnabled ? 'device' : 'portfolioTracker'];

    return (
        <OnboardingScreen
            header={
                <OnboardingScreenHeader
                    title={<Translation id={content.title} />}
                    subtitle={<Translation id={content.subtitle} />}
                    activeStep={2}
                />
            }
            footer={
                <OnboardingFooter
                    redirectTarget={() => navigation.navigate(content.redirectTarget)}
                    onBack={navigation.goBack}
                    backButtonTitle={<Translation id="generic.buttons.back" />}
                    nextButtonTitle={<Translation id="generic.buttons.continue" />}
                />
            }
        >
            <IconWrapper>
                <CoinsSvg />
            </IconWrapper>
        </OnboardingScreen>
    );
};
