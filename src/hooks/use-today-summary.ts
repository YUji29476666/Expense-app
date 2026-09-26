import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { SupportedCurrency } from '@/constants/currencies';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { sumExpenseMinorInRange, sumIncomeMinorInRange } from '@/db/queries/transactions';
import {
  computeAllowanceBand,
  computeAvailableBudgetMinor,
  computeRemainingBudgetMinor,
  computeTodayAllowanceMinor,
  type AllowanceBand,
} from '@/domain/allowance';
import { formatISODate, formatPeriodLabel, getBudgetPeriod, getDaysRemainingExcludingToday } from '@/domain/month-period';

export type TodaySummary = {
  isLoading: boolean;
  periodLabel: string;
  todayAllowanceMinor: number;
  todaySpendMinor: number;
  monthSpendSoFarMinor: number;
  remainingBudgetMinor: number;
  band: AllowanceBand;
  displayCurrency: SupportedCurrency;
  refresh: () => Promise<void>;
};

export function useTodaySummary(): TodaySummary {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [state, setState] = useState<{
    periodLabel: string;
    todayAllowanceMinor: number;
    todaySpendMinor: number;
    monthSpendSoFarMinor: number;
    remainingBudgetMinor: number;
  } | null>(null);

  const load = useCallback(async () => {
    if (!settings) {
      return;
    }
    const now = new Date();
    const period = getBudgetPeriod(now, settings.month_start_day);
    const todayStr = formatISODate(now);

    const periodStartStr = formatISODate(period.start);
    const [monthSpendSoFarMinor, monthIncomeSoFarMinor, todaySpendMinor] = await Promise.all([
      sumExpenseMinorInRange(db, periodStartStr, todayStr),
      sumIncomeMinorInRange(db, periodStartStr, todayStr),
      sumExpenseMinorInRange(db, todayStr, todayStr),
    ]);

    const daysRemainingExcludingToday = getDaysRemainingExcludingToday(period, now);
    const todayAllowanceMinor = computeTodayAllowanceMinor({
      monthlyBudgetMinor: computeAvailableBudgetMinor({
        monthlyBudgetMinor: settings.monthly_budget_minor,
        monthIncomeSoFarMinor,
      }),
      monthSpendSoFarMinor,
      daysRemainingExcludingToday,
    });
    const remainingBudgetMinor = computeRemainingBudgetMinor({
      monthlyBudgetMinor: settings.monthly_budget_minor,
      monthSpendSoFarMinor,
      monthIncomeSoFarMinor,
    });

    setState({
      periodLabel: formatPeriodLabel(period),
      todayAllowanceMinor,
      todaySpendMinor,
      monthSpendSoFarMinor,
      remainingBudgetMinor,
    });
  }, [db, settings]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return {
    isLoading: state === null || settings === null,
    periodLabel: state?.periodLabel ?? '',
    todayAllowanceMinor: state?.todayAllowanceMinor ?? 0,
    todaySpendMinor: state?.todaySpendMinor ?? 0,
    monthSpendSoFarMinor: state?.monthSpendSoFarMinor ?? 0,
    remainingBudgetMinor: state?.remainingBudgetMinor ?? 0,
    band: state ? computeAllowanceBand(state.todaySpendMinor, state.todayAllowanceMinor) : 'good',
    displayCurrency: settings?.display_currency ?? 'USD',
    refresh: load,
  };
}
