// SPEC.md 3.3: rates come from frankfurter (no API key needed).
// api.frankfurter.app now only 302-redirects to api.frankfurter.dev/v1, and
// browsers block a fetch that hits that cross-origin redirect, so call the
// new host directly. The response format is the same.
const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1';

// On failure, fall back to the last-fetched rate and let the caller show its "last
// updated" date rather than fabricating a live one.
export type FetchRateResult = {
  rate: number;
  source: 'fetched' | 'cached';
  asOf: string | null;
};

export async function fetchLatestRate(
  base: string,
  target: string,
  fallback: { lastRate: number | null; lastRateAt: string | null }
): Promise<FetchRateResult> {
  try {
    const response = await fetch(
      `${FRANKFURTER_BASE_URL}/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
    );
    if (!response.ok) {
      throw new Error(`frankfurter.app returned ${response.status}`);
    }
    const data = (await response.json()) as { rates?: Record<string, number> };
    const rate = data.rates?.[target];
    if (typeof rate !== 'number') {
      throw new Error('rate missing from frankfurter.app response');
    }
    return { rate, source: 'fetched', asOf: new Date().toISOString() };
  } catch {
    if (fallback.lastRate !== null) {
      return { rate: fallback.lastRate, source: 'cached', asOf: fallback.lastRateAt };
    }
    throw new Error('No exchange rate available. Check your connection and try again.');
  }
}

// The reference rate for a past date (SPEC.md 3.3: a transaction entered
// later must use the rate of the day it happened, not today's). frankfurter
// returns the last published rate on or before `isoDate` (weekends and
// holidays fall back to the previous business day) and reports that day as
// `date`, which is returned as `rateDate`.
export type RateOnDate = { rate: number; rateDate: string };

// Published rates for past days never change, so they are cached for the
// app session. Keyed by base/target/requested date.
const rateOnDateCache = new Map<string, RateOnDate>();

export async function fetchRateOnDate(base: string, target: string, isoDate: string): Promise<RateOnDate> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`invalid date ${isoDate}`);
  }
  const key = `${base}/${target}/${isoDate}`;
  const cached = rateOnDateCache.get(key);
  if (cached) {
    return cached;
  }
  const response = await fetch(
    `${FRANKFURTER_BASE_URL}/${isoDate}?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
  );
  if (!response.ok) {
    throw new Error(`frankfurter.app returned ${response.status}`);
  }
  const data = (await response.json()) as { date?: unknown; rates?: Record<string, unknown> };
  const rate = data.rates?.[target];
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
    throw new Error('rate missing from frankfurter.app response');
  }
  const result: RateOnDate = { rate, rateDate: typeof data.date === 'string' ? data.date : isoDate };
  rateOnDateCache.set(key, result);
  return result;
}

// Test hook: the cache is module state.
export function clearRateOnDateCache(): void {
  rateOnDateCache.clear();
}
