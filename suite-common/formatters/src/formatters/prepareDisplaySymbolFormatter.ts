import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { getNetwork, getNetworkDisplaySymbol, NetworkSymbol } from '@suite-common/wallet-config';

import { FormatterConfig } from '../types';
import { makeFormatter } from '../makeFormatter';

export type DisplaySymbolFormatterDataContext = { areAmountUnitsEnabled?: boolean };

export const prepareDisplaySymbolFormatter = (config: FormatterConfig) =>
    makeFormatter<NetworkSymbol, string, DisplaySymbolFormatterDataContext>(
        (symbol, dataContext) => {
            const { bitcoinAmountUnit } = config;
            const { areAmountUnitsEnabled = true } = dataContext;

            const { features: networkFeatures, testnet: isTestnet } = getNetwork(symbol);
            const areAmountUnitsSupported = !!networkFeatures?.includes('amount-unit');
            let formattedSymbol = getNetworkDisplaySymbol(symbol);

            // convert to different units if needed
            if (areAmountUnitsEnabled && areAmountUnitsSupported) {
                const unitAbbreviation = UNIT_ABBREVIATIONS[bitcoinAmountUnit];
                formattedSymbol = isTestnet
                    ? `${unitAbbreviation} ${formattedSymbol}`
                    : unitAbbreviation;
            }

            return formattedSymbol;
        },
        'DisplaySymbolFormatter',
    );
