// @group_device-management
// @retry=2

describe('Onboarding - transport webusb/bridge', () => {
    beforeEach(() => {
        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
    });

    it('Offer webusb as primary choice on web', () => {
        cy.getTestElement('@analytics/continue-button').click();
        cy.getTestElement('@webusb-button');
        cy.getTestElement('@connect-device-prompt/no-device-detected').click();
    });
});
