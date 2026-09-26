import { compareSpendToBenchmark, findBenchmarkRegion, getBenchmarkAmountMinor, type BenchmarksData } from '../benchmarks';

const sampleData: BenchmarksData = {
  regions: [
    {
      code: 'us-northeast-college-town',
      label: 'US Northeast (college town)',
      source: 'Example University Cost of Attendance Estimate',
      surveyYear: 2025,
      currency: 'USD',
      categories: { Rent: 90000, 'Food (Groceries)': 30000 },
    },
  ],
};

const emptyData: BenchmarksData = { regions: [] };

describe('findBenchmarkRegion', () => {
  it('finds a region by code', () => {
    expect(findBenchmarkRegion(sampleData, 'us-northeast-college-town')?.label).toBe('US Northeast (college town)');
  });

  it('returns null for an unknown region', () => {
    expect(findBenchmarkRegion(sampleData, 'nowhere')).toBeNull();
  });

  it('returns null against the empty Phase 1 seed data', () => {
    expect(findBenchmarkRegion(emptyData, 'us-northeast-college-town')).toBeNull();
  });
});

describe('getBenchmarkAmountMinor', () => {
  it('returns the amount for a known region/category pair', () => {
    const region = findBenchmarkRegion(sampleData, 'us-northeast-college-town');
    expect(getBenchmarkAmountMinor(region, 'Rent')).toBe(90000);
  });

  it('returns null when the region has no data for that category', () => {
    const region = findBenchmarkRegion(sampleData, 'us-northeast-college-town');
    expect(getBenchmarkAmountMinor(region, 'Entertainment')).toBeNull();
  });

  it('returns null when the region itself is null', () => {
    expect(getBenchmarkAmountMinor(null, 'Rent')).toBeNull();
  });
});

describe('compareSpendToBenchmark', () => {
  it('reports spend above the benchmark', () => {
    expect(compareSpendToBenchmark(103500, 90000)).toEqual({ direction: 'above', percentDiff: 15 });
  });

  it('reports spend below the benchmark', () => {
    expect(compareSpendToBenchmark(76500, 90000)).toEqual({ direction: 'below', percentDiff: 15 });
  });

  it('reports equal spend', () => {
    expect(compareSpendToBenchmark(90000, 90000)).toEqual({ direction: 'equal', percentDiff: 0 });
  });

  it('hides the comparison (returns null) when there is no benchmark amount', () => {
    expect(compareSpendToBenchmark(50000, null)).toBeNull();
  });

  it('hides the comparison end-to-end when the region list is empty (Phase 1 default state)', () => {
    const region = findBenchmarkRegion(emptyData, 'any-region');
    const benchmark = getBenchmarkAmountMinor(region, 'Rent');
    expect(compareSpendToBenchmark(50000, benchmark)).toBeNull();
  });
});
