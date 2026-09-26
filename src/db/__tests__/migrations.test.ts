import { DEFAULT_CATEGORIES } from '@/constants/categories';

import { migrateDbIfNeeded, type MigratableDatabase } from '../migrations';
import { SCHEMA_VERSION } from '../schema';
import { createTestDatabase } from './node-sqlite-adapter';

type TestDb = ReturnType<typeof createTestDatabase>['db'];

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

    expect(countCategories(db)).toBe(DEFAULT_CATEGORIES.length);
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION);
    expect(db.prepare('SELECT * FROM settings WHERE id = 1').get()).toBeDefined();
  });

  it('is idempotent: calling it twice in a row does not throw or duplicate categories', async () => {
    const { db, adapter } = createTestDatabase();

    await migrateDbIfNeeded(adapter);
    await expect(migrateDbIfNeeded(adapter)).resolves.not.toThrow();

    expect(countCategories(db)).toBe(DEFAULT_CATEGORIES.length);
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
    expect(countCategories(db)).toBe(DEFAULT_CATEGORIES.length);
    expect(getUserVersion(db)).toBe(SCHEMA_VERSION);
  });
});
