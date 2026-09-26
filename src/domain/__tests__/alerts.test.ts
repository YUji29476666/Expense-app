import {
  compareToSamePointLastPeriod,
  computeCategoryBudgetWarning,
  computePaceProjection,
  computeRemainingPerDay,
} from '../alerts';

describe('computePaceProjection', () => {
  it('projects overage when spending faster than budget allows', () => {
    // $500 spent in 10 days of a 30-day period, $1200 budget -> projects $1500, $300 over.
    const result = computePaceProjection({
      monthSpendSoFarMinor: 50000,
      daysElapsedIncludingToday: 10,
      totalDaysInPeriod: 30,
      monthlyBudgetMinor: 120000,
    });
    expect(result.projectedTotalMinor).toBe(150000);
    expect(result.overageMinor).toBe(30000);
  });

  it('projects a negative overage (under budget) when pace is comfortable', () => {
    const result = computePaceProjection({
      monthSpendSoFarMinor: 10000,
      daysElapsedIncludingToday: 10,
      totalDaysInPeriod: 30,
      monthlyBudgetMinor: 120000,
    });
    expect(result.projectedTotalMinor).toBe(30000);
    expect(result.overageMinor).toBe(-90000);
  });
});

describe('computeCategoryBudgetWarning', () => {
  it('returns null when the category has no budget set', () => {
    expect(computeCategoryBudgetWarning({ categorySpendMinor: 1000, categoryBudgetMinor: null })).toBeNull();
  });

  it('flags once spend reaches 80% of the category budget', () => {
    const result = computeCategoryBudgetWarning({ categorySpendMinor: 8000, categoryBudgetMinor: 10000 });
    expect(result).toEqual({ ratio: 0.8, isOverThreshold: true });
  });

  it('does not flag below the threshold', () => {
    const result = computeCategoryBudgetWarning({ categorySpendMinor: 7000, categoryBudgetMinor: 10000 });
    expect(result).toEqual({ ratio: 0.7, isOverThreshold: false });
  });
});

describe('computeRemainingPerDay', () => {
  it('matches the today-allowance math restated as remaining/day', () => {
    const result = computeRemainingPerDay({
      monthlyBudgetMinor: 90000,
      monthSpendSoFarMinor: 30000,
      daysRemainingExcludingToday: 19,
    });
    expect(result).toEqual({ remainingMinor: 60000, days: 20, perDayMinor: 3000 });
  });
});

describe('compareToSamePointLastPeriod', () => {
  it('reports a positive diff when spending more than last period', () => {
    expect(compareToSamePointLastPeriod(40000, 30000)).toEqual({ diffMinor: 10000 });
  });

  it('reports a negative diff when spending less than last period', () => {
    expect(compareToSamePointLastPeriod(20000, 30000)).toEqual({ diffMinor: -10000 });
  });
});
