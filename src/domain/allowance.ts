import { REMAINING_BUDGET_WARNING_RATIO } from '@/constants/alert-thresholds';

export type AllowanceBand = 'good' | 'warning' | 'over';

// The monthly budget shrinks by expenses and grows by income recorded in the
// same budget period (scholarship, part-time pay, ...).
export function computeAvailableBudgetMinor(params: {
  monthlyBudgetMinor: number;
  monthIncomeSoFarMinor: number;
}): number {
  return params.monthlyBudgetMinor + params.monthIncomeSoFarMinor;
}

// SPEC.md 3.2: "This month you can spend" = budget - expense + income.
export function computeRemainingBudgetMinor(params: {
  monthlyBudgetMinor: number;
  monthSpendSoFarMinor: number;
  monthIncomeSoFarMinor: number;
}): number {
  return computeAvailableBudgetMinor(params) - params.monthSpendSoFarMinor;
}

// Card color: red once the period is over budget, yellow once what is left
// drops below REMAINING_BUDGET_WARNING_RATIO of the available budget.
export function computeRemainingBand(remainingMinor: number, availableBudgetMinor: number): AllowanceBand {
  if (remainingMinor < 0 || availableBudgetMinor <= 0) {
    return 'over';
  }
  if (remainingMinor < availableBudgetMinor * REMAINING_BUDGET_WARNING_RATIO) {
    return 'warning';
  }
  return 'good';
}
