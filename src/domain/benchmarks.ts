// Schema for assets/benchmarks.json (SPEC.md 3.5). This is the one JSON file
// in the repo a human must hand-populate from a real, citable source — never
// generate its numbers. Shape, confirmed up front so data can be appended
// later without touching code:
//
// {
//   "regions": [
//     {
//       "code": "us-northeast-college-town",
//       "label": "US Northeast (college town)",
//       "source": "Example University Cost of Attendance Estimate",
//       "surveyYear": 2025,
//       "currency": "USD",
//       // category name (must match a DEFAULT_CATEGORIES/categories.name) ->
//       // typical monthly amount, in minor units of `currency`.
//       "categories": { "Rent": 90000, "Food (Groceries)": 30000 }
//     }
//   ]
// }
//
// Phase 1 ships with `regions: []`. Until a region is added, every lookup
// below returns null and the comparison UI must stay hidden — never guess.

export type BenchmarkRegion = {
  code: string;
  label: string;
  source: string;
  surveyYear: number;
  currency: string;
  categories: Record<string, number>;
};

export type BenchmarksData = {
  regions: BenchmarkRegion[];
};

export function findBenchmarkRegion(data: BenchmarksData, regionCode: string): BenchmarkRegion | null {
  return data.regions.find((region) => region.code === regionCode) ?? null;
}

export function getBenchmarkAmountMinor(region: BenchmarkRegion | null, categoryName: string): number | null {
  if (!region) {
    return null;
  }
  const amount = region.categories[categoryName];
  return typeof amount === 'number' ? amount : null;
}

export type BenchmarkComparison = {
  direction: 'above' | 'below' | 'equal';
  percentDiff: number; // always >= 0; combine with `direction` for wording
};

// Never returns a comparison when there's no benchmark data — the caller
// should render nothing rather than fabricate a "no data" placeholder.
export function compareSpendToBenchmark(userSpendMinor: number, benchmarkMinor: number | null): BenchmarkComparison | null {
  if (benchmarkMinor === null || benchmarkMinor <= 0) {
    return null;
  }
  const diff = userSpendMinor - benchmarkMinor;
  const percentDiff = Math.round((Math.abs(diff) / benchmarkMinor) * 100);
  const direction = diff > 0 ? 'above' : diff < 0 ? 'below' : 'equal';
  return { direction, percentDiff };
}
