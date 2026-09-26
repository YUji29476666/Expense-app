import type { SQLiteDatabase } from 'expo-sqlite';

import type { SupportedCurrency } from '@/constants/currencies';
import type { MigratableDatabase } from '../migrations';
import type { SettingsPatch, SettingsRow } from '../types';

// Narrow surface (like MigratableDatabase) so the currency-pair guard can be
// tested against a real SQLite engine in Node.
type SettingsDatabase = Pick<MigratableDatabase, 'getFirstAsync' | 'runAsync' | 'withTransactionAsync'>;

export async function getSettings(db: SQLiteDatabase): Promise<SettingsRow> {
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  if (!row) {
    throw new Error('settings row missing — migration did not seed it');
  }
  return row;
}

// SettingsPatch excludes display_currency / home_currency, so passing a
// currency here is a type error. Use updateCurrencyPair instead.
export async function updateSettings(db: SettingsDatabase, patch: SettingsPatch): Promise<void> {
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (fields.length === 0) {
    return;
  }
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => patch[field] as string | number | null);
  await db.runAsync(`UPDATE settings SET ${setClause} WHERE id = 1`, values);
}

export type CurrencyPairChangeResult = { ok: true } | { ok: false; reason: 'has_transactions' };

// The only way to change the currency pair.
//
// 1. Refuses if any transaction exists: past amount_minor values would be in
//    a different currency/exponent and SUM(amount_minor) would lose meaning.
//    Enforced here rather than only in the UI so every caller is covered.
// 2. Writes both currencies and the rate in a single UPDATE, so a state
//    where only one side changed cannot exist.
// 3. monthly_budget_minor is stored in display_currency minor units, so its
//    meaning changes with the pair (100000 is $1,000 or ¥100,000). There is
//    no trustworthy conversion, so it is reset to 0 for the user to re-enter.
// 4. The check and the UPDATE share one transaction to close the
//    check-then-act window.
// A refusal is an expected outcome, not an error, so it is returned rather
// than thrown; callers must inspect `ok` before continuing.
export async function updateCurrencyPair(
  db: SettingsDatabase,
  next: {
    displayCurrency: SupportedCurrency;
    homeCurrency: SupportedCurrency;
    rate: number | null;
    rateAt: string | null;
  }
): Promise<CurrencyPairChangeResult> {
  let result: CurrencyPairChangeResult = { ok: true };

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM transactions LIMIT 1');
    if (existing !== null) {
      result = { ok: false, reason: 'has_transactions' };
      return;
    }

    await db.runAsync(
      `UPDATE settings
          SET display_currency = ?,
              home_currency = ?,
              last_rate = ?,
              last_rate_at = ?,
              monthly_budget_minor = 0
        WHERE id = 1`,
      [next.displayCurrency, next.homeCurrency, next.rate, next.rateAt]
    );
  });

  return result;
}
