import { convertMinor, formatDualCurrency, formatMinor, toMajorUnits, toMinorUnits } from '../money';

describe('toMinorUnits / toMajorUnits', () => {
  it('converts USD major to minor (2 decimal exponent)', () => {
    expect(toMinorUnits(12.4, 'USD')).toBe(1240);
    expect(toMajorUnits(1240, 'USD')).toBe(12.4);
  });

  it('handles JPY with zero exponent (no fractional minor unit)', () => {
    expect(toMinorUnits(1860, 'JPY')).toBe(1860);
    expect(toMajorUnits(1860, 'JPY')).toBe(1860);
  });

  it('rounds fractional minor units instead of truncating', () => {
    // 0.1 + 0.2 in floating point is 0.30000000000000004; must still land on 30.
    expect(toMinorUnits(0.1 + 0.2, 'USD')).toBe(30);
  });
});

describe('formatMinor', () => {
  it('formats USD with symbol and thousands separator', () => {
    expect(formatMinor(123456, 'USD')).toBe('$1,234.56');
  });

  it('formats JPY with no decimal places', () => {
    expect(formatMinor(1860, 'JPY')).toBe('¥1,860');
  });
});

describe('formatDualCurrency', () => {
  it('matches the SPEC.md example format', () => {
    expect(formatDualCurrency(1240, 'USD', 186000, 'JPY')).toBe('$12.40 (¥186,000)');
  });
});

describe('convertMinor', () => {
  it('converts using a major-unit exchange rate', () => {
    // $12.40 at a rate of 150 JPY per USD -> 1860 JPY.
    expect(convertMinor(1240, 'USD', 'JPY', 150)).toBe(1860);
  });

  it('round-trips through minor units without drifting by a cent', () => {
    expect(convertMinor(100, 'USD', 'USD', 1)).toBe(100);
  });
});

// Phase 1 supports exactly one exponent-2 currency (USD) and one exponent-0
// currency (JPY). Exercise both directions so code that mishandles the
// exponent change cannot hide behind a same-exponent pair.
describe('convertMinor across differing exponents', () => {
  it('USD -> JPY drops from exponent 2 to 0 (1240 cents -> 1860 yen, not 186000)', () => {
    expect(convertMinor(1240, 'USD', 'JPY', 150)).toBe(1860);
  });

  it('JPY -> USD rises from exponent 0 to 2', () => {
    expect(convertMinor(1860, 'JPY', 'USD', 1 / 150)).toBe(1240);
  });
});
