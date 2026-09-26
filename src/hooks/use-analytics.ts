import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { getCategoryBreakdownForRange } from '@/db/queries/analytics';
import { sumExpenseMinorInRange, sumIncomeMinorInRange } from '@/db/queries/transactions';
import {
  formatISODate,
  formatPeriodShortLabel,
  getBudgetPeriod,
  getPreviousBudgetPeriod,
  type BudgetPeriod,
} from '@/domain/month-period';

export type MonthlyTotal = {
  period: BudgetPeriod;
  label: string;
  totalMinor: number;
};

export type CategoryBreakdownEntry = {
  categoryId: string;
  totalMinor: number;
};

export type AnalyticsData = {
  isLoading: boolean;
  currentPeriod: BudgetPeriod;
  breakdown: CategoryBreakdownEntry[];
  trend: MonthlyTotal[];
  incomeMinor: number;
  expenseMinor: number;
};

const TREND_PERIODS = 6;

export function useAnalytics(): AnalyticsData {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [data, setData] = useState<Omit<AnalyticsData, 'isLoading'> | null>(null);

  const load = useCallback(async () => {
    if (!settings) {
      return;
    }
    const now = new Date();
    const currentPeriod = getBudgetPeriod(now, settings.month_start_day);

    const periods: BudgetPeriod[] = [currentPeriod];
    for (let i = 1; i < TREND_PERIODS; i++) {
      periods.unshift(getPreviousBudgetPeriod(periods[0], settings.month_start_day));
    }

    const [breakdownRows, incomeMinor, expenseMinor, trendTotals] = await Promise.all([
      getCategoryBreakdownForRange(db, formatISODate(currentPeriod.start), formatISODate(currentPeriod.end)),
      sumIncomeMinorInRange(db, formatISODate(currentPeriod.start), formatISODate(currentPeriod.end)),
      sumExpenseMinorInRange(db, formatISODate(currentPeriod.start), formatISODate(currentPeriod.end)),
      Promise.all(
        periods.map((period) => sumExpenseMinorInRange(db, formatISODate(period.start), formatISODate(period.end)))
      ),
    ]);

    setData({
      currentPeriod,
      breakdown: breakdownRows.map((row) => ({ categoryId: row.category_id, totalMinor: row.total_minor })),
      trend: periods.map((period, index) => ({
        period,
        label: formatPeriodShortLabel(period),
        totalMinor: trendTotals[index],
      })),
      incomeMinor,
      expenseMinor,
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
    isLoading: data === null,
    currentPeriod: data?.currentPeriod ?? getBudgetPeriod(new Date(), settings?.month_start_day ?? 1),
    breakdown: data?.breakdown ?? [],
    trend: data?.trend ?? [],
    incomeMinor: data?.incomeMinor ?? 0,
    expenseMinor: data?.expenseMinor ?? 0,
  };
}
