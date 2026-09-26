import { clearRateOnDateCache, fetchRateOnDate } from '../fx';
import { resolveRateForDate } from '../rate-for-date';

const TODAY = '2026-09-26';
const BASE = { todayIso: TODAY, displayCurrency: 'USD' as const, homeCurrency: 'JPY' as const, currentRate: 150 };

const fetchMock = jest.fn();

function mockFetchOnce(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body });
}

beforeEach(() => {
  clearRateOnDateCache();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('resolveRateForDate', () => {
  it('uses the current Settings rate for today without fetching', async () => {
    await expect(resolveRateForDate({ ...BASE, occurredAtIso: TODAY })).resolves.toEqual({
      ok: true,
      rate: 150,
      source: 'current',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('treats a future date like today', async () => {
    const result = await resolveRateForDate({ ...BASE, occurredAtIso: '2026-10-01' });
    expect(result).toEqual({ ok: true, rate: 150, source: 'current' });
  });

  it('reports a missing current rate for today', async () => {
    const result = await resolveRateForDate({ ...BASE, currentRate: null, occurredAtIso: TODAY });
    expect(result).toEqual({ ok: false, reason: 'no_current_rate' });
  });

  it('fetches the published rate for a past date', async () => {
    mockFetchOnce(200, { amount: 1, base: 'USD', date: '2026-09-18', rates: { JPY: 147.2 } });
    const result = await resolveRateForDate({ ...BASE, occurredAtIso: '2026-09-20' });
    // A Sunday resolves to the previous business day's rate.
    expect(result).toEqual({ ok: true, rate: 147.2, source: 'historical', rateDate: '2026-09-18' });
    expect(fetchMock).toHaveBeenCalledWith('https://api.frankfurter.app/2026-09-20?from=USD&to=JPY');
  });

  it('does not need a current rate for a past date', async () => {
    mockFetchOnce(200, { date: '2026-09-18', rates: { JPY: 147.2 } });
    const result = await resolveRateForDate({ ...BASE, currentRate: null, occurredAtIso: '2026-09-18' });
    expect(result).toMatchObject({ ok: true, rate: 147.2 });
  });

  it('reports a failed historical fetch with the current rate as a possible fallback', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const result = await resolveRateForDate({ ...BASE, occurredAtIso: '2026-09-18' });
    expect(result).toEqual({ ok: false, reason: 'historical_unavailable', currentRate: 150 });
  });

  it('treats an HTTP error or a malformed body as unavailable', async () => {
    mockFetchOnce(404, { message: 'not found' });
    expect(await resolveRateForDate({ ...BASE, occurredAtIso: '1990-01-01' })).toMatchObject({
      ok: false,
      reason: 'historical_unavailable',
    });
    mockFetchOnce(200, { date: '2026-09-18', rates: {} });
    expect(await resolveRateForDate({ ...BASE, occurredAtIso: '2026-09-18' })).toMatchObject({ ok: false });
  });
});

describe('fetchRateOnDate', () => {
  it('caches a fetched rate for the session', async () => {
    mockFetchOnce(200, { date: '2026-09-18', rates: { JPY: 147.2 } });
    await fetchRateOnDate('USD', 'JPY', '2026-09-18');
    await expect(fetchRateOnDate('USD', 'JPY', '2026-09-18')).resolves.toEqual({ rate: 147.2, rateDate: '2026-09-18' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed date without calling the API', async () => {
    await expect(fetchRateOnDate('USD', 'JPY', '09/18/2026')).rejects.toThrow('invalid date');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
