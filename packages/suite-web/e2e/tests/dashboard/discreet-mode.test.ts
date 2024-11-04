// @group_suite
// @retry=2

import { EventType } from '@trezor/suite-analytics';
import { ExtractByEventType, Requests } from '../../support/types';

let requests: Requests;

describe('Dashboard', () => {
    beforeEach(() => {
        cy.task('startEmu', { wipe: true });
        cy.task('setupEmu');
        cy.task('startBridge');

        cy.viewport('macbook-13').resetDb();
        cy.prefixedVisit('/');
        cy.passThroughInitialRun();

        requests = [];
        cy.interceptDataTrezorIo(requests);
    });

    /*
     * 1. navigate to 'Dashboard' page
     * 2. Enable discreet mode
     * 3. check that status of Discreet mode
     */
    it('Discreet mode checkbox', () => {
        const discreetPartialClass = 'HiddenPlaceholder';

        cy.discoveryShouldFinish();
        cy.getTestElement('@quickActions/hideBalances').click();
        cy.getTestElement('@wallet/coin-balance/value-btc')
            .parent()
            .parent()
            .invoke('attr', 'class')
            .then(className => {
                console.log('className', className);
                expect(className).to.contain(discreetPartialClass);
            });

        // could be that request was not yet intercepted.
        // wait is not very nice, cy.findAnalyticsEventByType should implement some retry-ability mechanism internally
        cy.wait(100);

        cy.findAnalyticsEventByType<ExtractByEventType<EventType.MenuToggleDiscreet>>(
            requests,
            EventType.MenuToggleDiscreet,
        ).then(menuToggleDiscreetEvent => {
            expect(menuToggleDiscreetEvent.value).to.equal('true');
        });
    });
});

export {};
