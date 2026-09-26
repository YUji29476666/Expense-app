import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { SupportedCurrency } from '@/constants/currencies';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { sumExpenseMinorInRange } from '@/db/queries/transactions';
import { computeAllowanceBand, computeTodayAllowanceMinor, type AllowanceBand } from '@/domain/allowance';
import { formatISODate, formatPeriodLabel, getBudgetPeriod, getDaysRemainingExcludingToday } from '@/domain/month-period';

export type TodaySummary = {
  isLoading: boolean;
  periodLabel: string;
  todayAllowanceMinor: number;
  todaySpendMinor: number;
  monthSpendSoFarMinor: number;
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
  } | null>(null);

  const load = useCallback(async () => {
    if (!settings) {
      return;
    }
    const now = new Date();
    const period = getBudgetPeriod(now, settings.month_start_day);
    const todayStr = formatISODate(now);

    const [monthSpendSoFarMinor, todaySpendMinor] = await Promise.all([
      sumExpenseMinorInRange(db, formatISODate(period.start), todayStr),
      sumExpenseMinorInRange(db, todayStr, todayStr),
    ]);

    const daysRemainingExcludingToday = getDaysRemainingExcludingToday(period, now);
    const todayAllowanceMinor = computeTodayAllowanceMinor({
      monthlyBudgetMinor: settings.monthly_budget_minor,
      monthSpendSoFarMinor,
      daysRemainingExcludingToday,
    });

    setState({
      periodLabel: formatPeriodLabel(period),
      todayAllowanceMinor,
      todaySpendMinor,
      monthSpendSoFarMinor,
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
    band: state ? computeAllowanceBand(state.todaySpendMinor, state.todayAllowanceMinor) : 'good',
    displayCurrency: settings?.display_currency ?? 'USD',
    refresh: load,
  };
}
