class DeviceSettingsActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/DeviceSettings')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async tapEnablePinProtectionButton() {
        const enablePinProtectionButton = element(by.id('@device-pin-protection/enable-button'));

        await waitFor(enablePinProtectionButton).toBeVisible().withTimeout(10000);
        await enablePinProtectionButton.tap();
    }

    async tapChangePinProtectionButton() {
        const changePinProtectionButton = element(by.id('@device-pin-protection/change-button'));

        await waitFor(changePinProtectionButton).toBeVisible().withTimeout(10000);
        await changePinProtectionButton.tap();
    }

    async tapDisablePinProtectionButton() {
        const disablePinProtectionButton = element(by.id('@device-pin-protection/disable-button'));

        await waitFor(disablePinProtectionButton).toBeVisible().withTimeout(10000);
        await disablePinProtectionButton.tap();
    }
}

export const onDeviceSettings = new DeviceSettingsActions();
