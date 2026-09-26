import { computeAvailableBudgetMinor, computeRemainingBand, computeRemainingBudgetMinor } from '../allowance';

describe('computeAvailableBudgetMinor / computeRemainingBudgetMinor', () => {
  it('adds income recorded this period to the monthly budget', () => {
    // $900 budget + $300 part-time pay -> $1,200 available.
    expect(computeAvailableBudgetMinor({ monthlyBudgetMinor: 90000, monthIncomeSoFarMinor: 30000 })).toBe(120000);
  });

  it('remaining = budget - expense + income', () => {
    expect(
      computeRemainingBudgetMinor({ monthlyBudgetMinor: 90000, monthSpendSoFarMinor: 50000, monthIncomeSoFarMinor: 30000 })
    ).toBe(70000);
  });

  it('with no income the remaining budget is budget - expense', () => {
    expect(
      computeRemainingBudgetMinor({ monthlyBudgetMinor: 90000, monthSpendSoFarMinor: 95000, monthIncomeSoFarMinor: 0 })
    ).toBe(-5000);
  });
});

describe('computeRemainingBand', () => {
  it('is good while at least 20% of the available budget is left', () => {
    expect(computeRemainingBand(20000, 100000)).toBe('good');
  });

  it('is warning once less than 20% is left', () => {
    expect(computeRemainingBand(19999, 100000)).toBe('warning');
    expect(computeRemainingBand(0, 100000)).toBe('warning');
  });

  it('is over once the period is over budget', () => {
    expect(computeRemainingBand(-1, 100000)).toBe('over');
  });

  it('is over when no budget is set', () => {
    expect(computeRemainingBand(0, 0)).toBe('over');
  });
});
