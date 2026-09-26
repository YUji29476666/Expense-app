import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { SupportedCurrency } from '@/constants/currencies';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { sumExpenseMinorInRange } from '@/db/queries/transactions';
import { computeRemainingBand, computeRemainingBudgetMinor, type AllowanceBand } from '@/domain/allowance';
import { formatISODate, formatPeriodLabel, getBudgetPeriod } from '@/domain/month-period';

export type TodaySummary = {
  isLoading: boolean;
  periodLabel: string;
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
    monthSpendSoFarMinor: number;
    remainingBudgetMinor: number;
    band: AllowanceBand;
  } | null>(null);

  const load = useCallback(async () => {
    if (!settings) {
      return;
    }
    const now = new Date();
    const period = getBudgetPeriod(now, settings.month_start_day);
    const periodStartStr = formatISODate(period.start);
    const todayStr = formatISODate(now);

    const monthSpendSoFarMinor = await sumExpenseMinorInRange(db, periodStartStr, todayStr);
    const remainingBudgetMinor = computeRemainingBudgetMinor({
      monthlyBudgetMinor: settings.monthly_budget_minor,
      monthSpendSoFarMinor,
    });

    setState({
      periodLabel: formatPeriodLabel(period),
      monthSpendSoFarMinor,
      remainingBudgetMinor,
      band: computeRemainingBand(remainingBudgetMinor, settings.monthly_budget_minor),
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
    monthSpendSoFarMinor: state?.monthSpendSoFarMinor ?? 0,
    remainingBudgetMinor: state?.remainingBudgetMinor ?? 0,
    band: state?.band ?? 'good',
    displayCurrency: settings?.display_currency ?? 'USD',
    refresh: load,
  };
}
