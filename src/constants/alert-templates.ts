import type { SupportedCurrency } from '@/constants/currencies';
import { formatMinor } from '@/domain/money';
import type { CategoryBudgetWarning, PeriodComparison } from '@/domain/alerts';

// Copy for the rule-based alerts (SPEC.md 3.4). Each returns null when
// the alert shouldn't be shown, so callers can just filter(Boolean) a list.

export function categoryBudgetWarningMessage(
  categoryName: string,
  warning: CategoryBudgetWarning | null
): string | null {
  if (!warning || !warning.isOverThreshold) {
    return null;
  }
  const percent = Math.round(warning.ratio * 100);
  return `${categoryName} has reached ${percent}% of its budget.`;
}

export function vsLastPeriodMessage(comparison: PeriodComparison, currency: SupportedCurrency): string | null {
  if (comparison.diffMinor === 0) {
    return null;
  }
  const amount = formatMinor(Math.abs(comparison.diffMinor), currency);
  return comparison.diffMinor > 0
    ? `You've spent ${amount} more than at this point last month.`
    : `You've spent ${amount} less than at this point last month.`;
}
