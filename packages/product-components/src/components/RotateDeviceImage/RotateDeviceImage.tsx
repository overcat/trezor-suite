import React from 'react';

import styled from 'styled-components';

import { DeviceAnimation, Image } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

export type RotateDeviceImageProps = {
    deviceModel?: DeviceModelInternal;
    deviceColor?: number;
    className?: string;
    animationHeight?: string;
    animationWidth?: string;
};

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledImage = styled(Image)`
    /* do not apply the darkening filter in dark mode on device images */
    filter: none;
`;

export const RotateDeviceImage = ({
    deviceModel,
    deviceColor,
    className,
    animationHeight,
    animationWidth,
}: RotateDeviceImageProps) => {
    if (!deviceModel) {
        return null;
    }

    const isDeviceImageRotating =
        deviceModel &&
        [DeviceModelInternal.T2B1, DeviceModelInternal.T3B1, DeviceModelInternal.T3T1].includes(
            deviceModel,
        );

    return (
        <>
            {isDeviceImageRotating ? (
                <DeviceAnimation
                    className={className}
                    type="ROTATE"
                    deviceModelInternal={deviceModel}
                    deviceUnitColor={deviceColor}
                    height={animationHeight}
                    width={animationWidth}
                />
            ) : (
                <StyledImage
                    width={animationWidth}
                    height={animationHeight}
                    alt="Trezor"
                    image={`TREZOR_${deviceModel}`}
                    className={className}
                />
            )}
        </>
    );
};
