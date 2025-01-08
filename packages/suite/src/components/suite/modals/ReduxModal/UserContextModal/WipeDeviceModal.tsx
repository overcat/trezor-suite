import { useState } from 'react';

import { NewModal, Card, Column, H3, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { isDeviceInBootloaderMode } from '@trezor/device-utils';

import { Translation, CheckItem } from 'src/components/suite';
import { wipeDevice } from 'src/actions/settings/deviceSettingsActions';
import { useDevice, useDispatch } from 'src/hooks/suite';

type WipeDeviceModalProps = {
    onCancel: () => void;
};

export const WipeDeviceModal = ({ onCancel }: WipeDeviceModalProps) => {
    const [checkbox1, setCheckbox1] = useState(false);
    const [checkbox2, setCheckbox2] = useState(false);

    const { device, isLocked } = useDevice();
    const dispatch = useDispatch();

    const isBootloaderMode = isDeviceInBootloaderMode(device);

    const handleWipeDevice = () => dispatch(wipeDevice());

    const headingTranslation = isBootloaderMode
        ? 'TR_DEVICE_SETTINGS_FACTORY_RESET'
        : 'TR_DEVICE_SETTINGS_WIPE_DEVICE';

    return (
        <NewModal
            onCancel={onCancel}
            variant="destructive"
            iconName="shieldWarning"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button
                        variant="destructive"
                        onClick={handleWipeDevice}
                        isDisabled={isLocked() || !checkbox1 || !checkbox2}
                        data-testid="@wipe/wipe-button"
                    >
                        <Translation id={headingTranslation} />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <H3>
                <Translation id={headingTranslation} />
            </H3>
            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation
                    id={
                        isBootloaderMode
                            ? 'TR_FACTORY_RESET_MODAL_DESCRIPTION'
                            : 'TR_WIPE_DEVICE_MODAL_DESCRIPTION'
                    }
                />
            </Paragraph>
            <Card margin={{ top: spacings.lg }}>
                <Column gap={spacings.md} alignItems="center">
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_1_DESCRIPTION" />}
                        isChecked={checkbox1}
                        onClick={() => setCheckbox1(!checkbox1)}
                        data-testid="@wipe/checkbox-1"
                    />
                    <CheckItem
                        title={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_TITLE" />}
                        description={<Translation id="TR_WIPE_DEVICE_CHECKBOX_2_DESCRIPTION" />}
                        isChecked={checkbox2}
                        onClick={() => setCheckbox2(!checkbox2)}
                        data-testid="@wipe/checkbox-2"
                    />
                </Column>
            </Card>
        </NewModal>
    );
};
