import { REMAINING_BUDGET_WARNING_RATIO } from '@/constants/alert-thresholds';

export type AllowanceBand = 'good' | 'warning' | 'over';

// SPEC.md 3.2: "This month you can spend" = monthly budget - expense so far.
// Income does not top up the budget.
export function computeRemainingBudgetMinor(params: { monthlyBudgetMinor: number; monthSpendSoFarMinor: number }): number {
  return params.monthlyBudgetMinor - params.monthSpendSoFarMinor;
}

// Card color: red once the period is over budget, yellow once what is left
// drops below REMAINING_BUDGET_WARNING_RATIO of the monthly budget.
export function computeRemainingBand(remainingMinor: number, monthlyBudgetMinor: number): AllowanceBand {
  if (remainingMinor < 0 || monthlyBudgetMinor <= 0) {
    return 'over';
  }
  if (remainingMinor < monthlyBudgetMinor * REMAINING_BUDGET_WARNING_RATIO) {
    return 'warning';
  }
  return 'good';
}
