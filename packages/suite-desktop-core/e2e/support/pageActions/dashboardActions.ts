import { Locator, Page, expect } from '@playwright/test';

import { step } from '../common';

export class DashboardActions {
    readonly dashboardMenuButton: Locator;
    readonly discoveryHeader: Locator;
    readonly discoveryBar: Locator;
    readonly graph: Locator;
    readonly deviceSwitchingOpenButton: Locator;
    readonly modal: Locator;
    //TODO: Refactor to wallet page object
    readonly walletAtIndex = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}`);
    readonly walletAtIndexEjectButton = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}/eject-button`);
    readonly walletAtIndexFiatAmount = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}/fiat-amount`);
    readonly confirmDeviceEjectButton: Locator;
    readonly addStandardWalletButton: Locator;
    readonly hideBalanceButton: Locator;
    readonly portfolioFiatAmount: Locator;

    constructor(private readonly page: Page) {
        this.dashboardMenuButton = this.page.getByTestId('@suite/menu/suite-index');
        this.discoveryHeader = this.page.getByRole('heading', { name: 'Dashboard' });
        this.discoveryBar = this.page.getByTestId('@wallet/discovery-progress-bar');
        this.graph = this.page.getByTestId('@dashboard/graph');
        this.deviceSwitchingOpenButton = this.page.getByTestId('@menu/switch-device');
        this.modal = this.page.getByTestId('@modal');
        this.confirmDeviceEjectButton = this.page.getByTestId('@switch-device/eject');
        this.addStandardWalletButton = this.page.getByTestId('@switch-device/add-wallet-button');
        this.hideBalanceButton = this.page.getByTestId('@quickActions/hideBalances');
        this.portfolioFiatAmount = this.page.getByTestId('@dashboard/portfolio/fiat-amount');
    }

    @step()
    async navigateTo() {
        await this.dashboardMenuButton.click();
        await expect(this.discoveryHeader).toBeVisible();
    }

    @step()
    async discoveryShouldFinish() {
        await expect(this.discoveryBar, 'discovery bar should be visible').toBeVisible({
            timeout: 10_000,
        });
        await this.discoveryBar.waitFor({ state: 'detached', timeout: 120_000 });
    }

    @step()
    async openDeviceSwitcher() {
        await this.deviceSwitchingOpenButton.click();
        await expect(this.modal).toBeVisible();
    }

    @step()
    async ejectWallet(walletIndex: number = 0) {
        await this.walletAtIndexEjectButton(walletIndex).click();
        await this.confirmDeviceEjectButton.click();
        await this.walletAtIndex(walletIndex).waitFor({ state: 'detached' });
    }

    @step()
    async addStandardWallet() {
        await this.addStandardWalletButton.click();
        await this.modal.waitFor({ state: 'detached' });
        await this.discoveryShouldFinish();
    }
}
