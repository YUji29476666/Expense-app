// SPEC.md 3.3: fetch from frankfurter.app (no API key needed). On failure,
// fall back to the last-fetched rate and let the caller show its "last
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
      `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(target)}`
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
