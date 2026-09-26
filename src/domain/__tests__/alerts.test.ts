import { compareToSamePointLastPeriod, computeCategoryBudgetWarning } from '../alerts';

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

describe('compareToSamePointLastPeriod', () => {
  it('reports a positive diff when spending more than last period', () => {
    expect(compareToSamePointLastPeriod(40000, 30000)).toEqual({ diffMinor: 10000 });
  });

  it('reports a negative diff when spending less than last period', () => {
    expect(compareToSamePointLastPeriod(20000, 30000)).toEqual({ diffMinor: -10000 });
  });
});
