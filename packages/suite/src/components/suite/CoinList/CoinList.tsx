import styled from 'styled-components';

import { getCoinUnavailabilityMessage } from '@suite-common/suite-utils';
import { Tooltip } from '@trezor/components';
import { getFirmwareVersion, isDeviceInBootloaderMode } from '@trezor/device-utils';
import { versionUtils } from '@trezor/utils';
import { Network, NetworkSymbol } from '@suite-common/wallet-config';

import { Translation } from 'src/components/suite';
import { useDevice, useDiscovery, useSelector } from 'src/hooks/suite';
import { getCoinLabel } from 'src/utils/suite/getCoinLabel';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

import { Coin } from './Coin';

const Wrapper = styled.div`
    width: 100%;
    display: flex;
    flex-flow: wrap;
    gap: 16px 12px;
`;

export type CoinListProps = {
    networks: Network[];
    enabledNetworks?: NetworkSymbol[];
    settingsMode?: boolean;
    onSettings?: (symbol: NetworkSymbol) => void;
    onToggle: (symbol: NetworkSymbol, toggled: boolean) => void;
};

export const CoinList = ({
    networks,
    enabledNetworks,
    settingsMode = false,
    onSettings,
    onToggle,
}: CoinListProps) => {
    const { device, isLocked } = useDevice();
    const isDebug = useSelector(selectIsDebugModeActive);

    const blockchain = useSelector(state => state.wallet.blockchain);
    const isDeviceLocked = !!device && isLocked();
    const { isDiscoveryRunning } = useDiscovery();
    const lockedTooltip = isDeviceLocked ? 'TR_DISABLED_SWITCH_TOOLTIP' : null;
    const discoveryTooltip = isDiscoveryRunning ? 'TR_LOADING_ACCOUNTS' : null;

    const deviceModelInternal = device?.features?.internal_model;
    const isBootloaderMode = isDeviceInBootloaderMode(device);
    const firmwareVersion = getFirmwareVersion(device);

    const deviceDisplayName = device?.name;

    return (
        <Wrapper>
            {networks.map(network => {
                const {
                    symbol,
                    name,
                    support,
                    features,
                    testnet: isTestnet,
                    networkType,
                } = network;
                const hasCustomBackend = !!blockchain[symbol].backends.selected;

                const firmwareSupportRestriction =
                    deviceModelInternal && support?.[deviceModelInternal];
                const isSupportedByApp =
                    !firmwareVersion ||
                    !firmwareSupportRestriction ||
                    versionUtils.isNewerOrEqual(firmwareVersion, firmwareSupportRestriction);

                const unavailableReason = isSupportedByApp
                    ? device?.unavailableCapabilities?.[symbol]
                    : 'update-required';

                const isEnabled = !!enabledNetworks?.includes(symbol);

                const disabled =
                    (!settingsMode && !!unavailableReason && !isBootloaderMode) ||
                    isDeviceLocked ||
                    !isSupportedByApp;
                const unavailabilityTooltip =
                    !!unavailableReason &&
                    !isBootloaderMode &&
                    getCoinUnavailabilityMessage(unavailableReason);
                const tooltipString = discoveryTooltip || lockedTooltip || unavailabilityTooltip;

                const label = getCoinLabel(
                    features,
                    isTestnet,
                    hasCustomBackend,
                    networkType,
                    isDebug,
                );

                return (
                    <Tooltip
                        key={symbol}
                        placement="top"
                        content={
                            tooltipString && (
                                <Translation
                                    id={tooltipString}
                                    values={{
                                        deviceDisplayName,
                                    }}
                                />
                            )
                        }
                    >
                        <Coin
                            symbol={symbol}
                            name={name}
                            label={label}
                            toggled={isEnabled}
                            disabled={disabled || (settingsMode && !isEnabled)}
                            forceHover={settingsMode}
                            onToggle={disabled ? undefined : () => onToggle(symbol, !isEnabled)}
                            onSettings={
                                disabled || !onSettings ? undefined : () => onSettings(symbol)
                            }
                        />
                    </Tooltip>
                );
            })}
        </Wrapper>
    );
};
