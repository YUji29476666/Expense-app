import { useFocusEffect } from 'expo-router';
import { addDays, min as minDate } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import {
  categoryBudgetWarningMessage,
  paceProjectionMessage,
  remainingPerDayMessage,
  vsLastPeriodMessage,
} from '@/constants/alert-templates';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { listCategories } from '@/db/queries/categories';
import { sumExpenseMinorByCategoryInRange, sumExpenseMinorInRange } from '@/db/queries/transactions';
import {
  compareToSamePointLastPeriod,
  computeCategoryBudgetWarning,
  computePaceProjection,
  computeRemainingPerDay,
} from '@/domain/alerts';
import {
  formatISODate,
  getBudgetPeriod,
  getDaysElapsedIncludingToday,
  getDaysRemainingExcludingToday,
  getPreviousBudgetPeriod,
  getTotalDaysInPeriod,
} from '@/domain/month-period';

export function useBudgetAlerts(): string[] {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [alerts, setAlerts] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!settings) {
      return;
    }
    const now = new Date();
    const period = getBudgetPeriod(now, settings.month_start_day);
    const todayStr = formatISODate(now);
    const periodStartStr = formatISODate(period.start);

    const daysElapsedIncludingToday = getDaysElapsedIncludingToday(period, now);
    const daysRemainingExcludingToday = getDaysRemainingExcludingToday(period, now);
    const totalDaysInPeriod = getTotalDaysInPeriod(period);

    const lastPeriod = getPreviousBudgetPeriod(period, settings.month_start_day);
    const lastPeriodSamePointEnd = minDate([addDays(lastPeriod.start, daysElapsedIncludingToday - 1), lastPeriod.end]);

    const [monthSpendSoFarMinor, lastPeriodSpendMinor, categories] = await Promise.all([
      sumExpenseMinorInRange(db, periodStartStr, todayStr),
      sumExpenseMinorInRange(db, formatISODate(lastPeriod.start), formatISODate(lastPeriodSamePointEnd)),
      listCategories(db),
    ]);

    const messages: string[] = [];

    const pace = computePaceProjection({
      monthSpendSoFarMinor,
      daysElapsedIncludingToday,
      totalDaysInPeriod,
      monthlyBudgetMinor: settings.monthly_budget_minor,
    });
    const paceMessage = paceProjectionMessage(pace, settings.display_currency);
    if (paceMessage) {
      messages.push(paceMessage);
    }

    for (const category of categories) {
      if (category.budget_minor === null) {
        continue;
      }
      const categorySpendMinor = await sumExpenseMinorByCategoryInRange(db, category.id, periodStartStr, todayStr);
      const warning = computeCategoryBudgetWarning({ categorySpendMinor, categoryBudgetMinor: category.budget_minor });
      const message = categoryBudgetWarningMessage(category.name, warning);
      if (message) {
        messages.push(message);
      }
    }

    const remaining = computeRemainingPerDay({
      monthlyBudgetMinor: settings.monthly_budget_minor,
      monthSpendSoFarMinor,
      daysRemainingExcludingToday,
    });
    messages.push(remainingPerDayMessage(remaining, settings.display_currency));

    const comparison = compareToSamePointLastPeriod(monthSpendSoFarMinor, lastPeriodSpendMinor);
    const comparisonMessage = vsLastPeriodMessage(comparison, settings.display_currency);
    if (comparisonMessage) {
      messages.push(comparisonMessage);
    }

    setAlerts(messages);
  }, [db, settings]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return alerts;
}
