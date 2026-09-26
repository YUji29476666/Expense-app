import { addMonths, differenceInCalendarDays, format, subDays } from 'date-fns';

// The app never uses calendar months. Every "month" is a budget period that
// starts on `month_start_day` (1-28, so every calendar month is guaranteed to
// contain that day and no clamping is ever needed).
export type BudgetPeriod = {
  start: Date;
  end: Date; // inclusive
};

export function getBudgetPeriod(referenceDate: Date, monthStartDay: number): BudgetPeriod {
  const day = referenceDate.getDate();
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const start = day >= monthStartDay
    ? new Date(year, month, monthStartDay)
    : new Date(year, month - 1, monthStartDay);

  const end = subDays(addMonths(start, 1), 1);

  return { start, end };
}

export function getPreviousBudgetPeriod(period: BudgetPeriod, monthStartDay: number): BudgetPeriod {
  return getBudgetPeriod(subDays(period.start, 1), monthStartDay);
}

export function getTotalDaysInPeriod(period: BudgetPeriod): number {
  return differenceInCalendarDays(period.end, period.start) + 1;
}

// Number of days from the start of the period through `referenceDate`, inclusive.
export function getDaysElapsedIncludingToday(period: BudgetPeriod, referenceDate: Date): number {
  return differenceInCalendarDays(referenceDate, period.start) + 1;
}

// Number of days strictly after `referenceDate` through the end of the period
// (i.e. NOT counting today). Combined with the daily-allowance formula's "+1"
// this yields the number of days from today through the period end, inclusive.
export function getDaysRemainingExcludingToday(period: BudgetPeriod, referenceDate: Date): number {
  return differenceInCalendarDays(period.end, referenceDate);
}

// Full period label, e.g. "Aug 25 – Sep 24". Used anywhere space allows.
export function formatPeriodLabel(period: BudgetPeriod): string {
  return `${format(period.start, 'MMM d')} – ${format(period.end, 'MMM d')}`;
}

// Compact label for space-constrained spots like chart axis ticks: just the
// start date. Pair with formatPeriodLabel (e.g. in a tooltip) for the full range.
export function formatPeriodShortLabel(period: BudgetPeriod): string {
  return format(period.start, 'MMM d');
}

// `transactions.occurred_at` is stored as an ISO8601 date (SPEC.md 4.3).
export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
