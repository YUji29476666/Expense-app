import { computeAllowanceBand, computeTodayAllowanceMinor } from '../allowance';

describe('computeTodayAllowanceMinor', () => {
  it('splits the remaining budget evenly across remaining days including today', () => {
    // $900 budget, $0 spent, 29 days left after today (30-day period, day 1).
    expect(
      computeTodayAllowanceMinor({
        monthlyBudgetMinor: 90000,
        monthSpendSoFarMinor: 0,
        daysRemainingExcludingToday: 29,
      })
    ).toBe(3000); // $30/day over 30 days
  });

  it('divides by 1 on the last day of the period', () => {
    expect(
      computeTodayAllowanceMinor({
        monthlyBudgetMinor: 90000,
        monthSpendSoFarMinor: 87000,
        daysRemainingExcludingToday: 0,
      })
    ).toBe(3000);
  });

  it('goes negative once the month is over budget', () => {
    expect(
      computeTodayAllowanceMinor({
        monthlyBudgetMinor: 90000,
        monthSpendSoFarMinor: 95000,
        daysRemainingExcludingToday: 9,
      })
    ).toBe(-500);
  });

  it('rolls over unspent allowance naturally via the formula', () => {
    // Under-spending one day raises every subsequent day's allowance.
    const day1 = computeTodayAllowanceMinor({ monthlyBudgetMinor: 3000, monthSpendSoFarMinor: 0, daysRemainingExcludingToday: 2 });
    expect(day1).toBe(1000);
    const day2 = computeTodayAllowanceMinor({ monthlyBudgetMinor: 3000, monthSpendSoFarMinor: 0, daysRemainingExcludingToday: 1 });
    expect(day2).toBe(1500);
  });
});

describe('computeAllowanceBand', () => {
  it('is good when spend is comfortably under the allowance', () => {
    expect(computeAllowanceBand(1000, 3000)).toBe('good');
  });

  it('is warning at/above 80% of the allowance', () => {
    expect(computeAllowanceBand(2400, 3000)).toBe('warning');
  });

  it('is over once spend exceeds the allowance', () => {
    expect(computeAllowanceBand(3100, 3000)).toBe('over');
  });

  it('is over when there is no allowance left at all', () => {
    expect(computeAllowanceBand(0, 0)).toBe('over');
    expect(computeAllowanceBand(0, -500)).toBe('over');
  });
});
