import { DEFAULT_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';
import {
  CREATE_CATEGORIES_TABLE,
  CREATE_SETTINGS_TABLE,
  CREATE_TRANSACTIONS_CATEGORY_INDEX,
  CREATE_TRANSACTIONS_MERCHANT_INDEX,
  CREATE_TRANSACTIONS_OCCURRED_AT_INDEX,
  CREATE_TRANSACTIONS_TABLE,
  SCHEMA_VERSION,
} from './schema';

// The minimal surface migrateDbIfNeeded actually needs. Keeping this narrow
// (instead of depending on the full expo-sqlite `SQLiteDatabase` type) is
// what lets tests run the real migration logic against a plain SQLite
// engine (e.g. Node's built-in `node:sqlite`) instead of a native module
// that only exists on-device.
export interface MigratableDatabase {
  getFirstAsync<T>(source: string): Promise<T | null>;
  execAsync(source: string): Promise<unknown>;
  runAsync(source: string, params: (string | number | null)[]): Promise<unknown>;
  withTransactionAsync(task: () => Promise<void>): Promise<unknown>;
}

// No personal budget/currency can be guessed on the user's behalf, so first
// launch ships with a neutral placeholder the Settings screen (M5) must
// prompt the user to replace.
const DEFAULT_SETTINGS = {
  display_currency: 'USD',
  home_currency: 'JPY',
  monthly_budget_minor: 0,
  month_start_day: 1,
};

// Everything below — DDL, seed data, and the PRAGMA user_version bump —
// runs inside a single withTransactionAsync. SQLite allows DDL inside a
// transaction (unlike most other databases), and PRAGMA user_version has no
// restriction against running inside one either, so this is safe. The
// point is atomicity: if the app is killed partway through, SQLite rolls
// the whole transaction back, so `user_version` and the seeded rows can
// never disagree. Before this, seeding ran in its own transaction ahead of
// a separate PRAGMA write — a crash between the two left `user_version` at
// 0 with categories already inserted, so the next launch re-ran the seed
// INSERTs into an already-populated table and hit a UNIQUE constraint
// violation, bricking the app on every subsequent start.
export async function migrateDbIfNeeded(db: MigratableDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  await db.withTransactionAsync(async () => {
    // v1: initial schema and seed data.
    if (currentVersion < 1) {
      await db.execAsync(CREATE_TRANSACTIONS_TABLE);
      await db.execAsync(CREATE_TRANSACTIONS_OCCURRED_AT_INDEX);
      await db.execAsync(CREATE_TRANSACTIONS_CATEGORY_INDEX);
      await db.execAsync(CREATE_TRANSACTIONS_MERCHANT_INDEX);
      await db.execAsync(CREATE_CATEGORIES_TABLE);
      await db.execAsync(CREATE_SETTINGS_TABLE);

      // OR IGNORE is defense in depth on top of the transaction fix above:
      // it also makes a bare re-run (e.g. a future bug, or someone calling
      // this twice by hand) a no-op instead of a crash.
      for (const category of DEFAULT_CATEGORIES) {
        await db.runAsync(
          'INSERT OR IGNORE INTO categories (id, name, icon, color, budget_minor, sort_order, is_archived) VALUES (?, ?, ?, ?, ?, ?, 0)',
          [category.id, category.name, category.icon, category.color, null, category.sortOrder]
        );
      }

      await db.runAsync(
        `INSERT OR IGNORE INTO settings (id, display_currency, home_currency, monthly_budget_minor, month_start_day, region_code, last_rate, last_rate_at)
         VALUES (1, ?, ?, ?, ?, NULL, NULL, NULL)`,
        [
          DEFAULT_SETTINGS.display_currency,
          DEFAULT_SETTINGS.home_currency,
          DEFAULT_SETTINGS.monthly_budget_minor,
          DEFAULT_SETTINGS.month_start_day,
        ]
      );
    }

    // v2: student income categories. Only these rows are inserted, so a
    // default category the user deleted under v1 is not brought back.
    if (currentVersion < 2) {
      for (const category of INCOME_CATEGORIES) {
        await db.runAsync(
          'INSERT OR IGNORE INTO categories (id, name, icon, color, budget_minor, sort_order, is_archived) VALUES (?, ?, ?, ?, ?, ?, 0)',
          [category.id, category.name, category.icon, category.color, null, category.sortOrder]
        );
      }
    }

    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
