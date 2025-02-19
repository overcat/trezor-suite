import { A, D, pipe } from '@mobily/ts-belt';
import { differenceInMinutes, eachMinuteOfInterval, fromUnixTime, getUnixTime } from 'date-fns';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import {
    AccountHistoryBalancePoint,
    AccountWithBalanceHistory,
    FiatGraphPoint,
    FiatGraphPointWithCryptoBalance,
} from './types';

export const getDataStepInMinutes = ({
    startOfTimeFrameDate,
    endOfTimeFrameDate,
    numberOfPoints,
}: {
    startOfTimeFrameDate: Date;
    endOfTimeFrameDate: Date;
    numberOfPoints: number;
}): number => {
    const differenceMinutes = differenceInMinutes(endOfTimeFrameDate, startOfTimeFrameDate);

    return Math.ceil(differenceMinutes / numberOfPoints);
};

export const getTimestampsInTimeFrame = (
    startOfTimeFrameDate: Date,
    endOfTimeFrameDate: Date,
    numberOfPoints: number,
) => {
    const stepInMinutes = getDataStepInMinutes({
        startOfTimeFrameDate,
        endOfTimeFrameDate,
        numberOfPoints,
    });

    const intervalEndDate = fromUnixTime(getUnixTime(endOfTimeFrameDate));

    const datesInRange = eachMinuteOfInterval(
        {
            start: startOfTimeFrameDate,
            end: intervalEndDate,
        },
        {
            step: stepInMinutes,
        },
    );
    const datesInRangeUnixTime = A.map(datesInRange, date => getUnixTime(date));

    return datesInRangeUnixTime as number[];
};

export const mapCryptoBalanceMovementToFixedTimeFrame = ({
    balanceHistory,
    fiatRates,
    fiatCurrency,
}: {
    balanceHistory: AccountHistoryBalancePoint[];
    fiatRates: Array<{
        time: number;
        rates: {
            [key: string]: number | undefined;
        };
    }>;
    fiatCurrency: FiatCurrencyCode;
}): readonly FiatGraphPointWithCryptoBalance[] =>
    pipe(
        fiatRates,
        A.map(fiatRatePoint => {
            let fiatRate = fiatRatePoint.rates[fiatCurrency] ?? 0;
            // for some tokens we could get fiat rate -1, which is not valid
            fiatRate = fiatRate < 0 ? 0 : fiatRate;
            const rateDate = fromUnixTime(fiatRatePoint.time);

            if (fiatRate === 0) {
                // return early if the fiat rate is 0 to save resources on further calculations (find and BigNumber are slow)
                return {
                    date: rateDate,
                    cryptoBalance: '0',
                    value: 0,
                };
            }

            // Find the latest account balance before or at the fiatRatePoint time
            const accountBalancePoint = balanceHistory.find(
                point => point.time >= fiatRatePoint.time,
            );

            const cryptoBalance = accountBalancePoint
                ? new BigNumber(accountBalancePoint.cryptoBalance)
                : new BigNumber('0');

            return {
                date: rateDate,
                cryptoBalance: cryptoBalance.toFixed(),
                // We display only two decimal places in the graph. So if there is any value lower than that, we want to round it.
                value: Number(cryptoBalance.multipliedBy(fiatRate).toFixed(2)),
            };
        }),
    );

export const mergeMultipleFiatBalanceHistories = (
    fiatBalancesHistories: readonly (readonly FiatGraphPointWithCryptoBalance[])[],
): readonly FiatGraphPoint[] =>
    pipe(
        fiatBalancesHistories,
        A.flat,
        A.groupBy(fiatBalancePoint => getUnixTime(fiatBalancePoint.date)),
        D.mapWithKey((timestamp, fiatBalancePoints) => {
            const fiatBalance = fiatBalancePoints
                ? A.reduce(
                      fiatBalancePoints,
                      0,
                      (acc, fiatBalancePoint) => acc + fiatBalancePoint.value,
                  )
                : 0;

            return {
                date: fromUnixTime(timestamp),
                value: fiatBalance,
            };
        }),
        D.values,
    );

export const findOldestBalanceMovementTimestamp = (
    accountsWithBalanceHistory: AccountWithBalanceHistory[],
): number => {
    const allOldestTimestamps: number[] = [];

    accountsWithBalanceHistory.forEach(account => {
        const oldestTimestamp = account.balanceHistory[0]?.time;
        if (oldestTimestamp) {
            allOldestTimestamps.push(oldestTimestamp);
        }
    });

    return Math.min(...allOldestTimestamps);
};
