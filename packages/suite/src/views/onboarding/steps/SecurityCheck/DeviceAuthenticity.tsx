import { useState } from 'react';

import styled from 'styled-components';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { selectSelectedDevice, selectSelectedDeviceAuthenticity } from '@suite-common/wallet-core';
import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL } from '@trezor/urls';

import { OnboardingButtonCta, OnboardingStepBox } from 'src/components/onboarding';
import { CollapsibleOnboardingCard } from 'src/components/onboarding/CollapsibleOnboardingCard';
import { DeviceAuthenticationExplainer, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { SecurityCheckFail } from 'src/components/suite/SecurityCheck/SecurityCheckFail';

const StyledCard = styled(CollapsibleOnboardingCard)`
    padding: ${spacingsPx.md};
`;

const StyledExplainer = styled(DeviceAuthenticationExplainer)`
    @media only screen and (min-width: ${variables.SCREEN_SIZE.SM}) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

type DeviceAuthenticityProps = {
    goToNext: () => void;
};

export const DeviceAuthenticity = ({ goToNext }: DeviceAuthenticityProps) => {
    const device = useSelector(selectSelectedDevice);
    const selectedDeviceAuthenticity = useSelector(selectSelectedDeviceAuthenticity);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!device) return null;

    const isWaitingForConfirmation = device.buttonRequests.some(
        request =>
            request.code === 'ButtonRequest_Other' || // Device Authenticity prompt
            request.code === 'ButtonRequest_PinEntry', // Device can be locked, and we can get Pin Request first
    );
    const isCheckFailed = isSubmitted && selectedDeviceAuthenticity?.valid === false;
    const isCheckSuccessful = isSubmitted && selectedDeviceAuthenticity?.valid;

    const getHeadingText = () => {
        if (isCheckSuccessful) {
            return 'TR_CONGRATS';
        }

        return isWaitingForConfirmation ? 'TR_CHECKING_YOUR_DEVICE' : 'TR_LETS_CHECK_YOUR_DEVICE';
    };
    const getDescription = () => {
        if (isCheckSuccessful) {
            return (
                <Translation
                    id="TR_DEVICE_AUTHENTICITY_SUCCESS_DESCRIPTION"
                    values={{ deviceName: device.name, br: <br /> }}
                />
            );
        }
        if (!isWaitingForConfirmation) {
            return <Translation id="TR_AUTHENTICATE_DEVICE_DESCRIPTION" />;
        }
    };
    const getInnerActions = () => {
        if (isWaitingForConfirmation) {
            return;
        }

        const authenticateDevice = async () => {
            setIsLoading(true);
            await dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: isDebugModeActive,
                    skipSuccessToast: true,
                }),
            );
            setIsLoading(false);
            setIsSubmitted(true);
        };

        const handleClick = () => {
            if (isCheckSuccessful) {
                goToNext();
            } else {
                authenticateDevice();
            }
        };

        const buttonText = isCheckSuccessful ? 'TR_CONTINUE' : 'TR_START_CHECK';

        return (
            <OnboardingButtonCta
                onClick={handleClick}
                isDisabled={isLoading}
                isLoading={isLoading}
                data-testid={
                    isCheckSuccessful
                        ? '@authenticity-check/continue-button'
                        : `@authenticity-check/start-button`
                }
            >
                <Translation id={buttonText} />
            </OnboardingButtonCta>
        );
    };

    if (isCheckFailed) {
        return (
            <StyledCard>
                <SecurityCheckFail supportUrl={TREZOR_SUPPORT_DEVICE_AUTHENTICATION_FAILED_URL} />
            </StyledCard>
        );
    }

    return (
        <OnboardingStepBox
            image="CHECK_SHIELD"
            heading={<Translation id={getHeadingText()} />}
            description={getDescription()}
            innerActions={getInnerActions()}
            device={device}
            disableConfirmWrapper={!isWaitingForConfirmation}
            isActionAbortable
        >
            {!isCheckSuccessful && <StyledExplainer horizontal />}
        </OnboardingStepBox>
    );
};
