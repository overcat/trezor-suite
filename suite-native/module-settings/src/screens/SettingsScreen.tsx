import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { VStack } from '@suite-native/atoms';
import { Screen } from '@suite-native/navigation';

import { FeaturesSettings } from '../components/FeaturesSettings';
import { PreferencesSettings } from '../components/PreferencesSettings';
import { SupportSettings } from '../components/SupportSettings';

export const SettingsScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <VStack marginTop="sp16" spacing="sp32">
            <PreferencesSettings />
            <FeaturesSettings />
            <SupportSettings />
        </VStack>
    </Screen>
);
