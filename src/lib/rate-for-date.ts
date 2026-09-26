import type { SupportedCurrency } from '@/constants/currencies';
import { fetchRateOnDate } from './fx';

// Which exchange rate a transaction dated `occurredAtIso` should freeze into
// rate_used (SPEC.md 3.3):
// - today or later: the current rate from Settings (settings.last_rate);
// - a past day: that day's published rate, so entering or back-dating a
//   transaction later does not apply today's rate to an old purchase.
export type ResolvedRate =
  | { ok: true; rate: number; source: 'current' }
  | { ok: true; rate: number; source: 'historical'; rateDate: string }
  | { ok: false; reason: 'no_current_rate' }
  // The historical fetch failed (offline, API down). The caller decides
  // whether to fall back to `currentRate`, which may be null.
  | { ok: false; reason: 'historical_unavailable'; currentRate: number | null };

export async function resolveRateForDate(params: {
  occurredAtIso: string;
  todayIso: string;
  displayCurrency: SupportedCurrency;
  homeCurrency: SupportedCurrency;
  currentRate: number | null;
}): Promise<ResolvedRate> {
  const { occurredAtIso, todayIso, displayCurrency, homeCurrency, currentRate } = params;

  // ISO dates compare correctly as strings.
  if (occurredAtIso >= todayIso) {
    return currentRate !== null && currentRate > 0
      ? { ok: true, rate: currentRate, source: 'current' }
      : { ok: false, reason: 'no_current_rate' };
  }

  try {
    const { rate, rateDate } = await fetchRateOnDate(displayCurrency, homeCurrency, occurredAtIso);
    return { ok: true, rate, source: 'historical', rateDate };
  } catch {
    return { ok: false, reason: 'historical_unavailable', currentRate };
  }
}
