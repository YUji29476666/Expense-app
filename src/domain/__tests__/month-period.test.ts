import {
  formatISODate,
  formatPeriodLabel,
  formatPeriodShortLabel,
  getBudgetPeriod,
  getDaysElapsedIncludingToday,
  getDaysRemainingExcludingToday,
  getPreviousBudgetPeriod,
  getTotalDaysInPeriod,
} from '../month-period';

describe('getBudgetPeriod', () => {
  it('starts the period on month_start_day when today is on/after it', () => {
    const period = getBudgetPeriod(new Date(2026, 8, 10), 25); // Sep 10, monthStartDay=25
    expect(period.start).toEqual(new Date(2026, 7, 25)); // Aug 25
    expect(period.end).toEqual(new Date(2026, 8, 24)); // Sep 24
  });

  it('rolls back into the previous month when today is before month_start_day', () => {
    const period = getBudgetPeriod(new Date(2026, 8, 24), 25); // Sep 24
    expect(period.start).toEqual(new Date(2026, 7, 25));
    expect(period.end).toEqual(new Date(2026, 8, 24));
  });

  it('handles month_start_day=1 as an ordinary calendar month', () => {
    const period = getBudgetPeriod(new Date(2026, 1, 15), 1); // Feb 15, non-leap year
    expect(period.start).toEqual(new Date(2026, 1, 1));
    expect(period.end).toEqual(new Date(2026, 1, 28));
  });

  it('never needs clamping since month_start_day <= 28 exists in every month', () => {
    const period = getBudgetPeriod(new Date(2026, 1, 27), 28); // Feb 27, still one day before month_start_day
    expect(period.start).toEqual(new Date(2026, 0, 28)); // period started Jan 28
    expect(period.end).toEqual(new Date(2026, 1, 27)); // ends today, Feb 27

    const nextDayPeriod = getBudgetPeriod(new Date(2026, 1, 28), 28); // Feb 28, the rollover day
    expect(nextDayPeriod.start).toEqual(new Date(2026, 1, 28));
    expect(nextDayPeriod.end).toEqual(new Date(2026, 2, 27));
  });
});

describe('getPreviousBudgetPeriod', () => {
  it('returns the immediately preceding period', () => {
    const current = getBudgetPeriod(new Date(2026, 8, 10), 25);
    const previous = getPreviousBudgetPeriod(current, 25);
    expect(previous.start).toEqual(new Date(2026, 6, 25)); // Jul 25
    expect(previous.end).toEqual(new Date(2026, 7, 24)); // Aug 24
  });
});

describe('day counting', () => {
  const period = getBudgetPeriod(new Date(2026, 8, 10), 25); // Aug 25 - Sep 24

  it('counts total days in the period', () => {
    expect(getTotalDaysInPeriod(period)).toBe(31);
  });

  it('counts the first day of the period as day 1 elapsed', () => {
    expect(getDaysElapsedIncludingToday(period, period.start)).toBe(1);
  });

  it('counts the last day of the period as fully elapsed', () => {
    expect(getDaysElapsedIncludingToday(period, period.end)).toBe(31);
  });

  it('has zero days remaining (excluding today) on the last day', () => {
    expect(getDaysRemainingExcludingToday(period, period.end)).toBe(0);
  });

  it('has (totalDays - 1) days remaining (excluding today) on the first day', () => {
    expect(getDaysRemainingExcludingToday(period, period.start)).toBe(30);
  });
});

describe('labels', () => {
  const period = getBudgetPeriod(new Date(2026, 8, 10), 25);

  it('formats the full period as a date range', () => {
    expect(formatPeriodLabel(period)).toBe('Aug 25 – Sep 24');
  });

  it('formats the short label as just the start date', () => {
    expect(formatPeriodShortLabel(period)).toBe('Aug 25');
  });
});

describe('formatISODate', () => {
  it('formats as YYYY-MM-DD', () => {
    expect(formatISODate(new Date(2026, 8, 5))).toBe('2026-09-05');
  });
});
