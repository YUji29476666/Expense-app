import { TODAY_SPEND_WARNING_RATIO } from '@/constants/alert-thresholds';

export type AllowanceBand = 'good' | 'warning' | 'over';

// SPEC.md 3.2: today_allowance = (monthly_budget - month_spend_so_far) / (days_remaining_in_month + 1)
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
