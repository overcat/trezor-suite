import { useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';

import * as Sentry from '@sentry/react-native';
import { captureConsoleIntegration } from '@sentry/core';

import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { getEnv, isDebugEnv, isDevelopEnv } from '@suite-native/config';
import { selectIsOnboardingFinished } from '@suite-native/settings';

const initSentry = () => {
    Sentry.init({
        dsn: 'https://d473f56df60c4974ae3f3ce00547c2a9@o117836.ingest.sentry.io/4504214699245568',
        // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
        // We recommend adjusting this value in production.
        tracesSampleRate: 0.5,
        environment: getEnv(),
        integrations: [
            captureConsoleIntegration({
                levels: ['error'],
            }),
        ],
        // You can put EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED=true to `.env.development.local` to debug Sentry locally.
        enabled:
            !isDebugEnv() || process.env.EXPO_PUBLIC_IS_SENTRY_ON_DEBUG_BUILD_ENABLED === 'true',
    });
};

initSentry();

export const SentryProvider = ({ children }: { children: ReactNode }) => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);

    useEffect(() => {
        // Enforce sentry to be enabled in dev environment because we want to catch all errors
        if (!isDevelopEnv() && isOnboardingFinished) {
            if (!isAnalyticsEnabled) {
                Sentry.close();
            } else {
                initSentry();
            }
        }
    }, [isOnboardingFinished, isAnalyticsEnabled]);

    return <>{children}</>;
};
