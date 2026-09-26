import { TODAY_SPEND_WARNING_RATIO } from '@/constants/alert-thresholds';

export type AllowanceBand = 'good' | 'warning' | 'over';

// The monthly budget shrinks by expenses and grows by income recorded in the
// same budget period (scholarship, part-time pay, ...). Every budget-based
// figure — today's allowance, remaining-per-day, pace projection — starts
// from this amount instead of the raw monthly budget.
export function computeAvailableBudgetMinor(params: {
  monthlyBudgetMinor: number;
  monthIncomeSoFarMinor: number;
}): number {
  return params.monthlyBudgetMinor + params.monthIncomeSoFarMinor;
}

// What is left of the period's budget: budget - expense + income.
export function computeRemainingBudgetMinor(params: {
  monthlyBudgetMinor: number;
  monthSpendSoFarMinor: number;
  monthIncomeSoFarMinor: number;
}): number {
  return computeAvailableBudgetMinor(params) - params.monthSpendSoFarMinor;
}

// SPEC.md 3.2: today_allowance = (monthly_budget - month_spend_so_far) / (days_remaining_in_month + 1)
// Callers pass computeAvailableBudgetMinor(...) as `monthlyBudgetMinor` so
// income recorded this period is included.
// `daysRemainingExcludingToday` must come from getDaysRemainingExcludingToday
// in month-period.ts; this function adds the "+1" itself.
export function computeTodayAllowanceMinor(params: {
  monthlyBudgetMinor: number;
  monthSpendSoFarMinor: number;
  daysRemainingExcludingToday: number;
}): number {
  const { monthlyBudgetMinor, monthSpendSoFarMinor, daysRemainingExcludingToday } = params;
  const divisor = daysRemainingExcludingToday + 1;
  return Math.round((monthlyBudgetMinor - monthSpendSoFarMinor) / divisor);
}

export function computeAllowanceBand(todaySpendMinor: number, todayAllowanceMinor: number): AllowanceBand {
  if (todayAllowanceMinor <= 0) {
    return 'over';
  }
  const ratio = todaySpendMinor / todayAllowanceMinor;
  if (ratio > 1) {
    return 'over';
  }
  if (ratio >= TODAY_SPEND_WARNING_RATIO) {
    return 'warning';
  }
  return 'good';
}
