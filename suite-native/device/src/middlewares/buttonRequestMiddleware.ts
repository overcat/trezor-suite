import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { UI } from '@trezor/connect';
import { deviceActions, selectSelectedDevice } from '@suite-common/wallet-core';

export const prepareButtonRequestMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, getState, next }) => {
        next(action);

        if (action.type === UI.REQUEST_PIN) {
            dispatch(
                deviceActions.addButtonRequest({
                    device: selectSelectedDevice(getState()),
                    buttonRequest: {
                        code: action.payload.type,
                    },
                }),
            );
        }

        if (action.type === UI.REQUEST_BUTTON) {
            const { device: _, ...request } = action.payload;

            dispatch(
                deviceActions.addButtonRequest({
                    device: selectSelectedDevice(getState()),
                    buttonRequest: request,
                }),
            );
        }

        return action;
    },
);
