import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import regional from '@trezor/suite/src/constants/wallet/coinmarket/regional';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';

const getCountryLabel = (country: string) => {
    const labelWithFlag = regional.countriesMap.get(country);
    if (!labelWithFlag) {
        throw new Error(`Country ${country} not found in the countries map`);
    }

    return labelWithFlag.substring(labelWithFlag.indexOf(' ') + 1);
};

type paymentMethods =
    | 'googlePay'
    | 'applePay'
    | 'creditCard'
    | 'paypal'
    | 'bankTransfer'
    | 'revolutPay';

export class MarketActions {
    readonly offerSpinner: Locator;
    readonly section: Locator;
    readonly form: Locator;
    readonly bestOfferProvider: Locator;
    readonly bestOfferSection: Locator;
    readonly bestOfferAmount: Locator;
    readonly buyBestOfferButton: Locator;
    readonly youPayInput: Locator;
    readonly youPayCurrencyDropdown: Locator;
    readonly youPayCurrencyOption = (currency: FiatCurrencyCode) =>
        this.page.getByTestId(`@coinmarket/form/fiat-currency-select/option/${currency}`);
    readonly youPayFiatCryptoSwitchButton: Locator;
    readonly youPayFractionButton = (amount: '10%' | '25%' | '50%' | 'Max') =>
        this.page.getByRole('button', { name: amount });
    readonly feeButton = (fee: 'economy' | 'normal' | 'high' | 'custom') =>
        this.page.getByTestId(`select-bar/${fee}`);
    readonly customFeeInput: Locator;
    readonly countryOfResidenceDropdown: Locator;
    readonly countryOfResidenceOption = (countryCode: string) =>
        this.page.getByTestId(`@coinmarket/form/country-select/option/${countryCode}`);
    readonly accountDropdown: Locator;
    readonly accountSearchInput: Locator;
    readonly accountTabFilter = (tab: 'all-networks' | 'eth' | 'pol' | 'bsc' | 'sol') =>
        this.page.getByTestId(`@coinmarket/form/select-crypto/network-tab/${tab}`);
    readonly accountOption = (cryptoName: string, symbol: NetworkSymbol) =>
        this.page.getByTestId(`@coinmarket/form/select-crypto/option/${cryptoName}-${symbol}`);
    readonly paymentMethodDropdown: Locator;
    readonly paymentMethodOption = (method: paymentMethods) =>
        this.page.getByTestId(`@coinmarket/form/payment-method-select/option/${method}`);
    readonly buyOffersPage: Locator;
    readonly compareButton: Locator;
    readonly quotes: Locator;
    readonly quoteOfProvider = (provider: string) =>
        this.page.getByTestId(`@coinmarket/offers/quote-${provider}`);
    readonly quoteProvider: Locator;
    readonly quoteAmount: Locator;
    readonly refreshTime: Locator;
    readonly selectThisQuoteButton: Locator;
    readonly modal: Locator;
    readonly buyTermsConfirmButton: Locator;
    readonly confirmOnTrezorButton: Locator;
    readonly confirmOnDevicePrompt: Locator;
    readonly tradeConfirmation: Locator;
    readonly tradeConfirmationCryptoAmount: Locator;
    readonly tradeConfirmationProvider: Locator;
    readonly tradeConfirmationContinueButton: Locator;
    readonly exchangeFeeDetails: Locator;
    readonly broadcastButton: Locator;
    readonly sendAddressInput: Locator;
    readonly sendAmountInput: Locator;
    readonly sendButton: Locator;

    constructor(private page: Page) {
        this.offerSpinner = this.page.getByTestId('@coinmarket/offers/loading-spinner');
        this.section = this.page.getByTestId('@coinmarket');
        this.form = this.page.getByTestId('@coinmarket/form');
        this.bestOfferProvider = this.page.getByTestId('@coinmarket/offers/quote/provider');
        this.bestOfferSection = this.page.getByTestId('@coinmarket/best-offer');
        this.bestOfferAmount = this.page.getByTestId('@coinmarket/best-offer/amount');
        this.buyBestOfferButton = this.page.getByTestId('@coinmarket/form/buy-button');
        this.youPayInput = this.page.getByTestId('@coinmarket/form/fiat-input');
        this.youPayCurrencyDropdown = this.page.getByTestId(
            '@coinmarket/form/fiat-currency-select/input',
        );
        this.youPayFiatCryptoSwitchButton = this.page.getByTestId(
            '@coinmarket/form/switch-crypto-fiat',
        );
        this.customFeeInput = this.page.getByTestId('feePerUnit');
        this.countryOfResidenceDropdown = this.page.getByTestId(
            '@coinmarket/form/country-select/input',
        );
        this.accountDropdown = this.page.getByTestId('@coinmarket/form/select-crypto/input');
        this.accountSearchInput = this.page.getByTestId(
            '@coinmarket/form/select-crypto/search-input',
        );
        this.paymentMethodDropdown = this.page.getByTestId(
            '@coinmarket/form/payment-method-select/input',
        );
        this.buyOffersPage = this.page.getByTestId('@coinmarket/buy-offers');
        this.compareButton = this.page.getByTestId('@coinmarket/form/compare-button');
        this.quotes = this.page.getByTestId('@coinmarket/offers/quote');
        this.quoteProvider = this.page.getByTestId('@coinmarket/offers/quote/provider');
        this.quoteAmount = this.page.getByTestId('@coinmarket/offers/quote/crypto-amount');
        this.refreshTime = this.page.getByTestId('@coinmarket/refresh-time');
        this.selectThisQuoteButton = this.page.getByTestId(
            '@coinmarket/offers/get-this-deal-button',
        );
        this.modal = this.page.getByTestId('@modal');
        this.buyTermsConfirmButton = this.page.getByTestId(
            '@coinmarket/buy/offers/buy-terms-confirm-button',
        );
        this.confirmOnTrezorButton = this.page.getByTestId(
            '@coinmarket/offer/confirm-on-trezor-button',
        );
        this.confirmOnDevicePrompt = this.page.getByTestId('@prompts/confirm-on-device');
        this.tradeConfirmation = this.page.getByTestId('@coinmarket/selected-offer');
        this.tradeConfirmationCryptoAmount = this.page.getByTestId(
            '@coinmarket/form/info/crypto-amount',
        );
        this.tradeConfirmationProvider = this.page.getByTestId('@coinmarket/form/info/provider');
        this.tradeConfirmationContinueButton = this.page.getByTestId(
            '@coinmarket/offer/continue-transaction-button',
        );
        this.exchangeFeeDetails = this.page.getByTestId('@wallet/fee-details');
        this.broadcastButton = this.page.getByTestId('broadcast-button');
        this.sendAddressInput = this.page.getByTestId('outputs.0.address');
        this.sendAmountInput = this.page.getByTestId('outputs.0.amount');
        this.sendButton = this.page.getByTestId('@send/review-button');
    }

    @step()
    async waitForOffersSyncToFinish() {
        await expect(this.offerSpinner).toBeHidden({ timeout: 30000 });
        //Even though the offer sync is finished, the best offer might not be displayed correctly yet and show 0 BTC
        await expect(this.bestOfferAmount).not.toHaveText('0 BTC');
        await expect(this.buyBestOfferButton).toBeEnabled();
    }

    @step()
    async selectCountryOfResidence(countryCode: string) {
        const countryLabel = getCountryLabel(countryCode);
        const currentCountry = await this.countryOfResidenceDropdown.textContent();
        if (currentCountry === countryLabel) {
            return;
        }
        await this.countryOfResidenceDropdown.click();
        await this.countryOfResidenceDropdown.getByRole('combobox').fill(countryLabel);
        await this.countryOfResidenceOption(countryCode).click();
    }

    @step()
    async selectFiatCurrency(currencyCode: FiatCurrencyCode) {
        const currentCurrency = await this.youPayCurrencyDropdown.textContent();
        if (currentCurrency === currencyCode.toUpperCase()) {
            return;
        }
        await this.youPayCurrencyDropdown.click();
        await this.youPayCurrencyOption(currencyCode).click();
    }

    @step()
    async selectAccount(cryptoName: string, symbol: NetworkSymbol) {
        await this.accountDropdown.click();
        await this.accountSearchInput.fill(cryptoName);
        await this.accountOption(cryptoName, symbol).click();
    }

    @step()
    async selectPaymentMethod(method: paymentMethods) {
        await this.paymentMethodDropdown.click();
        await this.paymentMethodOption(method).click();
    }

    @step()
    async setYouPayAmount(
        amount: string,
        currency: FiatCurrencyCode = 'czk',
        country: string = 'CZ',
    ) {
        // Warning: the field is initialized empty and gets default value after the first offer sync
        await expect(this.youPayInput).not.toHaveValue('');
        await this.selectCountryOfResidence(country);
        await this.selectFiatCurrency(currency);
        await this.youPayInput.fill(amount);
        // Warning: Bug #16054, as a workaround we wait for offer sync after setting the amount
        await this.waitForOffersSyncToFinish();
    }

    @step()
    async confirmTrade() {
        await expect(this.modal).toBeVisible();
        await this.buyTermsConfirmButton.click();
        await this.confirmOnTrezorButton.click();
        await expect(this.confirmOnDevicePrompt).toBeVisible();
        await TrezorUserEnvLink.pressYes();
        await expect(this.confirmOnDevicePrompt).not.toBeVisible();
    }

    @step()
    async readBestOfferValues() {
        await expect(this.bestOfferAmount).not.toHaveText('0 BTC');
        const amount = await this.bestOfferAmount.textContent();
        const provider = await this.bestOfferProvider.textContent();
        if (!amount || !provider) {
            throw new Error(
                `Test was not able to extract amount or provider from the page. Amount: ${amount}, Provider: ${provider}`,
            );
        }

        return { amount, provider };
    }
}
