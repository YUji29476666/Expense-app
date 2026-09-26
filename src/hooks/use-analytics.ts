import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { getCategoryBreakdownForRange } from '@/db/queries/analytics';
import { sumByTypeInRange, sumExpenseMinorInRange, type TypeTotals } from '@/db/queries/transactions';
import {
  formatISODate,
  formatPeriodShortLabel,
  getBudgetPeriodByOffset,
  getPreviousBudgetPeriod,
  getRecentBudgetPeriods,
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

// One row of the "Past periods" list, in the display currency.
export type PeriodSummary = {
  offset: number; // 0 = current period
  period: BudgetPeriod;
  incomeMinor: number;
  expenseMinor: number;
};

export type AnalyticsData = {
  isLoading: boolean;
  // The period every card below describes, chosen by `periodOffset`.
  selectedPeriod: BudgetPeriod;
  breakdown: CategoryBreakdownEntry[];
  // TREND_PERIODS periods ending at the selected one.
  trend: MonthlyTotal[];
  incomeMinor: number;
  expenseMinor: number;
  // Same period in the home currency, at each transaction's rate_used.
  incomeHomeMinor: number;
  expenseHomeMinor: number;
  // Display-currency totals across both types, for the average rate.
  totals: TypeTotals;
  // HISTORY_PERIODS most recent periods, newest first.
  history: PeriodSummary[];
};

const TREND_PERIODS = 6;
export const HISTORY_PERIODS = 12;

// `periodOffset`: 0 = current budget period, 1 = previous, ...
export function useAnalytics(periodOffset: number): AnalyticsData {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [data, setData] = useState<Omit<AnalyticsData, 'isLoading'> | null>(null);

  const load = useCallback(async () => {
    if (!settings) {
      return;
    }
    const now = new Date();
    const monthStartDay = settings.month_start_day;
    const selectedPeriod = getBudgetPeriodByOffset(now, monthStartDay, periodOffset);
    const start = formatISODate(selectedPeriod.start);
    const end = formatISODate(selectedPeriod.end);

    const trendPeriods: BudgetPeriod[] = [selectedPeriod];
    for (let i = 1; i < TREND_PERIODS; i++) {
      trendPeriods.unshift(getPreviousBudgetPeriod(trendPeriods[0], monthStartDay));
    }
    const historyPeriods = getRecentBudgetPeriods(now, monthStartDay, HISTORY_PERIODS);

    const [breakdownRows, byType, trendTotals, historyTotals] = await Promise.all([
      getCategoryBreakdownForRange(db, start, end),
      sumByTypeInRange(db, start, end),
      Promise.all(
        trendPeriods.map((period) => sumExpenseMinorInRange(db, formatISODate(period.start), formatISODate(period.end)))
      ),
      Promise.all(
        historyPeriods.map((period) => sumByTypeInRange(db, formatISODate(period.start), formatISODate(period.end)))
      ),
    ]);

    setData({
      selectedPeriod,
      breakdown: breakdownRows.map((row) => ({ categoryId: row.category_id, totalMinor: row.total_minor })),
      trend: trendPeriods.map((period, index) => ({
        period,
        label: formatPeriodShortLabel(period),
        totalMinor: trendTotals[index],
      })),
      incomeMinor: byType.income.amountMinor,
      expenseMinor: byType.expense.amountMinor,
      incomeHomeMinor: byType.income.homeMinor,
      expenseHomeMinor: byType.expense.homeMinor,
      totals: {
        amountMinor: byType.income.amountMinor + byType.expense.amountMinor,
        homeMinor: byType.income.homeMinor + byType.expense.homeMinor,
      },
      history: historyPeriods.map((period, offset) => ({
        offset,
        period,
        incomeMinor: historyTotals[offset].income.amountMinor,
        expenseMinor: historyTotals[offset].expense.amountMinor,
      })),
    });
  }, [db, settings, periodOffset]);

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
    selectedPeriod: data?.selectedPeriod ?? getBudgetPeriodByOffset(new Date(), settings?.month_start_day ?? 1, periodOffset),
    breakdown: data?.breakdown ?? [],
    trend: data?.trend ?? [],
    incomeMinor: data?.incomeMinor ?? 0,
    expenseMinor: data?.expenseMinor ?? 0,
    incomeHomeMinor: data?.incomeHomeMinor ?? 0,
    expenseHomeMinor: data?.expenseHomeMinor ?? 0,
    totals: data?.totals ?? { amountMinor: 0, homeMinor: 0 },
    history: data?.history ?? [],
  };
}
