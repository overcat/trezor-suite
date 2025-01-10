import { A, D, O } from '@mobily/ts-belt';

import { DeviceRootState } from '@suite-common/wallet-core';

/**
 * Beware, if you want to persist some part of state outside device reducer,
 * redux-persist will not automatically check for changes of device.remember property!
 */
export const selectDeviceStatesNotRemembered = (state: DeviceRootState) =>
    A.filterMap(state.device.devices, device =>
        device.remember || !device.state || !device.state.staticSessionId
            ? O.None
            : O.Some(
                  typeof device.state === 'string'
                      ? (device as any).state
                      : device.state.staticSessionId,
              ),
    );

export const filterKeysByPartialMatch = <O extends Record<string, unknown>>(
    obj: O,
    filterKeys: readonly string[],
): O =>
    D.filterWithKey(
        obj,
        (key, _) => !filterKeys.some(filterKey => key.toString().includes(filterKey)),
    ) as O;
