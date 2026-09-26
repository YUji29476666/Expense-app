import { DatabaseSync } from 'node:sqlite';

import type { MigratableDatabase } from '../migrations';

// Wraps Node's built-in `node:sqlite` (a real SQLite engine) behind the
// exact MigratableDatabase surface migrateDbIfNeeded uses, so migration
// tests exercise real DDL/transaction/PRAGMA behavior instead of a mock
// that could hide the atomicity bug this file's tests guard against.
export function createTestDatabase(): { db: DatabaseSync; adapter: MigratableDatabase } {
  const db = new DatabaseSync(':memory:');

  const adapter: MigratableDatabase = {
    async getFirstAsync<T>(source: string): Promise<T | null> {
      const row = db.prepare(source).get();
      return (row as T | undefined) ?? null;
    },
    async execAsync(source: string): Promise<unknown> {
      db.exec(source);
      return undefined;
    },
    async runAsync(source: string, params: (string | number | null)[]): Promise<unknown> {
      return db.prepare(source).run(...params);
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<unknown> {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
      return undefined;
    },
  };

  return { db, adapter };
}
