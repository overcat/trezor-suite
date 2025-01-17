import { Box, Card, CheckBox, Text, VStack } from '@suite-native/atoms';
import {
    FeatureFlag as FeatureFlagEnum,
    useFeatureFlag,
    useToggleFeatureFlag,
} from '@suite-native/feature-flags';

const featureFlagsTitleMap = {
    [FeatureFlagEnum.IsDeviceConnectEnabled]: 'Connect device',
    [FeatureFlagEnum.IsCardanoSendEnabled]: 'Cardano send',
    [FeatureFlagEnum.IsRegtestEnabled]: 'Regtest',
    [FeatureFlagEnum.IsConnectPopupEnabled]: 'Connect Popup',
    [FeatureFlagEnum.AreEthL2sEnabled]: 'Eth L2s',
} as const satisfies Record<FeatureFlagEnum, string>;

const FeatureFlag = ({ featureFlag }: { featureFlag: FeatureFlagEnum }) => {
    const value = useFeatureFlag(featureFlag);
    const toggleFeatureFlag = useToggleFeatureFlag(featureFlag);

    return (
        <Box flexDirection="row" justifyContent="space-between">
            <Text>{featureFlagsTitleMap[featureFlag]}</Text>
            <CheckBox isChecked={value} onChange={toggleFeatureFlag} />
        </Box>
    );
};

export const FeatureFlags = () => (
    <Card>
        <VStack spacing="sp8">
            <Text variant="titleSmall">Feature Flags</Text>
            <VStack>
                {Object.values(FeatureFlagEnum).map(featureFlag => (
                    <FeatureFlag key={featureFlag} featureFlag={featureFlag} />
                ))}
            </VStack>
        </VStack>
    </Card>
);
