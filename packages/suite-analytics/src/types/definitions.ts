import { AppUpdateEventStatus } from '../constants';

export type OnboardingAnalytics = {
    startTime: number;
    firmware: 'install' | 'update' | 'skip' | 'up-to-date';
    seed: 'create' | 'recovery' | 'recovery-in-progress';
    seedType: 'shamir-single' | 'shamir-advanced' | '12-words' | '24-words';
    wasSelectTypeOpened: boolean;
    recoveryType: 'standard' | 'advanced';
    backup: 'create' | 'skip';
    pin: 'create' | 'skip';
};

export type AppUpdateEvent = {
    fromVersion?: string;
    toVersion?: string;
    status: AppUpdateEventStatus;
    earlyAccessProgram: boolean;
    isPrerelease?: boolean;
    isAutoUpdated?: boolean;
};
