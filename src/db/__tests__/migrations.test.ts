import { DEFAULT_CATEGORIES, INCOME_CATEGORIES } from '@/constants/categories';

import { migrateDbIfNeeded, type MigratableDatabase } from '../migrations';
import { SCHEMA_VERSION } from '../schema';
import { createTestDatabase } from './node-sqlite-adapter';

type TestDb = ReturnType<typeof createTestDatabase>['db'];

const ALL_SEEDED_CATEGORY_COUNT = DEFAULT_CATEGORIES.length + INCOME_CATEGORIES.length;

function countCategories(db: TestDb): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  return row.count;
}

function getUserVersion(db: TestDb): number {
  const row = db.prepare('PRAGMA user_version').get() as { user_version: number };
  return row.user_version;
}

function tableExists(db: TestDb, name: string): boolean {
  const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);
  return row !== undefined;
}

describe('migrateDbIfNeeded', () => {
  it('seeds default categories, a settings row, and bumps user_version on a fresh database', async () => {
    const { db, adapter } = createTestDatabase();

    await migrateDbIfNeeded(adapter);

    expect(countCategories(db)).toBe(ALL_SEEDED_CATEGORY_COUNT);
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION);
    expect(db.prepare('SELECT * FROM settings WHERE id = 1').get()).toBeDefined();
  });

  it('is idempotent: calling it twice in a row does not throw or duplicate categories', async () => {
    const { db, adapter } = createTestDatabase();

    await migrateDbIfNeeded(adapter);
    await expect(migrateDbIfNeeded(adapter)).resolves.not.toThrow();

    expect(countCategories(db)).toBe(ALL_SEEDED_CATEGORY_COUNT);
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION);
  });

  it('rolls back the entire migration if interrupted right before the user_version commit, and a retry then succeeds', async () => {
    const { db, adapter } = createTestDatabase();

    // Simulate the process dying between the seed INSERTs committing and the
    // PRAGMA user_version write landing — the exact window that used to
    // brick the app (see migrations.ts comment). Only the transaction's
    // internal PRAGMA statement should throw; the outer `PRAGMA user_version`
    // read migrateDbIfNeeded does up front must still work normally.
    let hasThrown = false;
    let insideTransaction = false;
    const crashingAdapter: MigratableDatabase = {
      ...adapter,
      withTransactionAsync: async (task) => {
        insideTransaction = true;
        try {
          return await adapter.withTransactionAsync(task);
        } finally {
          insideTransaction = false;
        }
      },
      execAsync: async (source: string) => {
        if (!hasThrown && insideTransaction && source.trim().toUpperCase().startsWith('PRAGMA USER_VERSION =')) {
          hasThrown = true;
          throw new Error('simulated crash right before the version bump commits');
        }
        return adapter.execAsync(source);
      },
    };

    await expect(migrateDbIfNeeded(crashingAdapter)).rejects.toThrow('simulated crash');

    // The whole transaction — including the CREATE TABLE statements — must
    // have rolled back together, not just the seed rows.
    expect(getUserVersion(db)).toBe(0);
    expect(tableExists(db, 'categories')).toBe(false);
    expect(tableExists(db, 'settings')).toBe(false);
    expect(tableExists(db, 'transactions')).toBe(false);

    // Retrying, exactly as the app does on next launch, must succeed
    // without a UNIQUE constraint violation from re-inserting into an
    // already-seeded table.
    await expect(migrateDbIfNeeded(adapter)).resolves.not.toThrow();
    expect(countCategories(db)).toBe(ALL_SEEDED_CATEGORY_COUNT);
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION);
  });

  it('upgrades a v1 database by adding only the income categories, keeping existing data', async () => {
    const { db, adapter } = createTestDatabase();
    await migrateDbIfNeeded(adapter);
    // Reproduce a v1 install: no income categories, a default category the
    // user deleted, and an existing transaction.
    db.exec("DELETE FROM categories WHERE id IN ('scholarship', 'part_time_job', 'internship', 'clothing')");
    db.exec(
      `INSERT INTO transactions (id, type, amount_minor, currency, home_minor, home_currency, rate_used, category_id, merchant, note, occurred_at, created_at, receipt_uri)
       VALUES ('t1', 'expense', 1240, 'USD', 1860, 'JPY', 150, 'rent', NULL, NULL, '2026-09-01', '2026-09-01T00:00:00Z', NULL)`
    );
    db.exec('PRAGMA user_version = 1');

    await migrateDbIfNeeded(adapter);

    expect(getUserVersion(db)).toBe(SCHEMA_VERSION);
    for (const category of INCOME_CATEGORIES) {
      expect(db.prepare('SELECT id FROM categories WHERE id = ?').get(category.id)).toBeDefined();
    }
    // The v1 seed must not re-run and resurrect the deleted category.
    expect(db.prepare("SELECT id FROM categories WHERE id = 'clothing'").get()).toBeUndefined();
    expect(countCategories(db)).toBe(ALL_SEEDED_CATEGORY_COUNT - 1);
    expect(db.prepare("SELECT id FROM transactions WHERE id = 't1'").get()).toBeDefined();
  });
});
