import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import {
    messageSystemActions,
    categorizeMessages,
    getValidMessages,
    selectMessageSystemConfig,
    getValidExperimentIds,
} from '@suite-common/message-system';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';
import {
    selectDeviceEnabledDiscoveryNetworkSymbols,
    toggleEnabledDiscoveryNetworkSymbol,
} from '@suite-native/discovery';

const isAnyOfMessageSystemAffectingActions = isAnyOf(
    messageSystemActions.fetchSuccessUpdate,
    deviceActions.selectDevice,
    deviceActions.connectDevice,
    toggleEnabledDiscoveryNetworkSymbol,
);

export const messageSystemMiddleware = createMiddleware((action, { next, dispatch, getState }) => {
    // The action has to be handled by the reducer first to apply its
    // changes first, because this middleware expects already updated state.
    next(action);

    if (isAnyOfMessageSystemAffectingActions(action)) {
        const config = selectMessageSystemConfig(getState());
        const device = selectSelectedDevice(getState());
        const enabledNetworks = selectDeviceEnabledDiscoveryNetworkSymbols(getState());

        const validationParams = {
            device,
            settings: {
                tor: false, // not supported in suite-native
                enabledNetworks,
            },
        };

        const validMessages = getValidMessages(config, validationParams);
        const categorizedValidMessages = categorizeMessages(validMessages);

        const validExperimentIds = getValidExperimentIds(config, validationParams);

        dispatch(messageSystemActions.updateValidMessages(categorizedValidMessages));
        dispatch(messageSystemActions.updateValidExperiments(validExperimentIds));
    }

    return action;
});
