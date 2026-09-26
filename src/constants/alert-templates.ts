import { formatMinor } from '@/domain/money';
import type { CategoryBudgetWarning, PaceProjection, PeriodComparison, RemainingPerDay } from '@/domain/alerts';

// Copy for the four rule-based alerts (SPEC.md 3.4). Each returns null when
// the alert shouldn't be shown, so callers can just filter(Boolean) a list.

export function paceProjectionMessage(projection: PaceProjection, currency: string): string | null {
  if (projection.overageMinor <= 0) {
    return null;
  }
  return `At this pace, you'll go ${formatMinor(projection.overageMinor, currency)} over budget by month end.`;
}

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

export function remainingPerDayMessage(remaining: RemainingPerDay, currency: string): string {
  return `${formatMinor(remaining.remainingMinor, currency)} left over ${remaining.days} day${remaining.days === 1 ? '' : 's'} — that's ${formatMinor(remaining.perDayMinor, currency)} a day.`;
}

export function vsLastPeriodMessage(comparison: PeriodComparison, currency: string): string | null {
  if (comparison.diffMinor === 0) {
    return null;
  }
  const amount = formatMinor(Math.abs(comparison.diffMinor), currency);
  return comparison.diffMinor > 0
    ? `You've spent ${amount} more than at this point last month.`
    : `You've spent ${amount} less than at this point last month.`;
}
