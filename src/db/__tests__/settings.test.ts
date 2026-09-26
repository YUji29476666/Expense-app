import { migrateDbIfNeeded } from '../migrations';
import { updateCurrencyPair, updateSettings } from '../queries/settings';
import type { SettingsRow } from '../types';
import { createTestDatabase } from './node-sqlite-adapter';

type TestDb = ReturnType<typeof createTestDatabase>['db'];

async function setUp() {
  const test = createTestDatabase();
  await migrateDbIfNeeded(test.adapter);
  return test;
}

function readSettings(db: TestDb): SettingsRow {
  return db.prepare('SELECT * FROM settings WHERE id = 1').get() as SettingsRow;
}

function insertTransaction(db: TestDb): void {
  db.prepare(
    `INSERT INTO transactions
      (id, type, amount_minor, currency, home_minor, home_currency, rate_used, category_id, merchant, note, occurred_at, created_at, receipt_uri)
     VALUES ('t1', 'expense', 1240, 'USD', 1860, 'JPY', 150, 'food', NULL, NULL, '2026-09-01', '2026-09-01T00:00:00Z', NULL)`
  ).run();
}

const JPY_TO_USD = { displayCurrency: 'JPY', homeCurrency: 'USD', rate: 0.0067, rateAt: '2026-09-26T00:00:00Z' } as const;

describe('updateCurrencyPair', () => {
  it('changes both currencies and the rate together when no transactions exist', async () => {
    const { db, adapter } = await setUp();

    const result = await updateCurrencyPair(adapter, JPY_TO_USD);

    expect(result).toEqual({ ok: true });
    const settings = readSettings(db);
    expect(settings.display_currency).toBe('JPY');
    expect(settings.home_currency).toBe('USD');
    expect(settings.last_rate).toBe(0.0067);
    expect(settings.last_rate_at).toBe('2026-09-26T00:00:00Z');
  });

  it('resets monthly_budget_minor to 0 because its unit changes with the pair', async () => {
    const { db, adapter } = await setUp();
    await updateSettings(adapter, { monthly_budget_minor: 100000 });

    await updateCurrencyPair(adapter, JPY_TO_USD);

    expect(readSettings(db).monthly_budget_minor).toBe(0);
  });

  it('stores a null rate rather than keeping the old pair’s rate', async () => {
    const { db, adapter } = await setUp();
    await updateSettings(adapter, { last_rate: 150, last_rate_at: '2026-09-01T00:00:00Z' });

    await updateCurrencyPair(adapter, { ...JPY_TO_USD, rate: null, rateAt: null });

    expect(readSettings(db).last_rate).toBeNull();
    expect(readSettings(db).last_rate_at).toBeNull();
  });

  it('refuses once any transaction exists and leaves settings completely unchanged', async () => {
    const { db, adapter } = await setUp();
    await updateSettings(adapter, { monthly_budget_minor: 100000, last_rate: 150 });
    insertTransaction(db);
    const before = readSettings(db);

    const result = await updateCurrencyPair(adapter, JPY_TO_USD);

    expect(result).toEqual({ ok: false, reason: 'has_transactions' });
    expect(readSettings(db)).toEqual(before);
  });

  it('rejects currency fields in the generic patch at compile time', async () => {
    const { adapter } = await setUp();
    // If SettingsPatch ever allows currencies again, this line stops being
    // an error and tsc fails on the unused directive.
    // @ts-expect-error display_currency is excluded from SettingsPatch
    await updateSettings(adapter, { display_currency: 'JPY' });
  });
});
