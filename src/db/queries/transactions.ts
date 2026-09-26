import type { SQLiteDatabase } from 'expo-sqlite';

import { suggestCategoryForMerchant, type PastTransactionForSuggestion } from '@/domain/merchant-suggestion';
import type { TransactionRow } from '../types';

// NOTE: aggregation below sums `amount_minor` directly, which assumes every
// transaction was recorded in the currency that is currently
// settings.display_currency. Phase 1 has no UI to change display currency
// after transactions exist, so this holds; revisit if that changes.

export async function insertTransaction(db: SQLiteDatabase, row: TransactionRow): Promise<void> {
  await db.runAsync(
    `INSERT INTO transactions
      (id, type, amount_minor, currency, home_minor, home_currency, rate_used, category_id, merchant, note, occurred_at, created_at, receipt_uri)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.id,
      row.type,
      row.amount_minor,
      row.currency,
      row.home_minor,
      row.home_currency,
      row.rate_used,
      row.category_id,
      row.merchant,
      row.note,
      row.occurred_at,
      row.created_at,
      row.receipt_uri,
    ]
  );
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<Omit<TransactionRow, 'id'>>
): Promise<void> {
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (fields.length === 0) {
    return;
  }
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => patch[field] as string | number | null);
  await db.runAsync(`UPDATE transactions SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function deleteTransaction(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function getTransactionById(db: SQLiteDatabase, id: string): Promise<TransactionRow | null> {
  return db.getFirstAsync<TransactionRow>('SELECT * FROM transactions WHERE id = ?', [id]);
}

// `startDate`/`endDateInclusive` are ISO8601 date strings ("YYYY-MM-DD").
export async function listTransactionsByRange(
  db: SQLiteDatabase,
  startDate: string,
  endDateInclusive: string
): Promise<TransactionRow[]> {
  return db.getAllAsync<TransactionRow>(
    'SELECT * FROM transactions WHERE occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at DESC, created_at DESC',
    [startDate, endDateInclusive]
  );
}

export async function sumExpenseMinorInRange(
  db: SQLiteDatabase,
  startDate: string,
  endDateInclusive: string
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount_minor) as total FROM transactions WHERE type = 'expense' AND occurred_at >= ? AND occurred_at <= ?",
    [startDate, endDateInclusive]
  );
  return row?.total ?? 0;
}

export async function sumIncomeMinorInRange(
  db: SQLiteDatabase,
  startDate: string,
  endDateInclusive: string
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount_minor) as total FROM transactions WHERE type = 'income' AND occurred_at >= ? AND occurred_at <= ?",
    [startDate, endDateInclusive]
  );
  return row?.total ?? 0;
}

export async function sumExpenseMinorByCategoryInRange(
  db: SQLiteDatabase,
  categoryId: string,
  startDate: string,
  endDateInclusive: string
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>(
    "SELECT SUM(amount_minor) as total FROM transactions WHERE type = 'expense' AND category_id = ? AND occurred_at >= ? AND occurred_at <= ?",
    [categoryId, startDate, endDateInclusive]
  );
  return row?.total ?? 0;
}

export async function getMostFrequentCategoryForMerchant(
  db: SQLiteDatabase,
  merchantName: string
): Promise<string | null> {
  const normalized = merchantName.trim();
  if (!normalized) {
    return null;
  }
  const rows = await db.getAllAsync<PastTransactionForSuggestion>(
    'SELECT merchant, category_id, occurred_at FROM transactions WHERE merchant IS NOT NULL AND lower(trim(merchant)) = lower(trim(?))',
    [normalized]
  );
  return suggestCategoryForMerchant(rows, normalized);
}

export async function categoryHasTransactions(db: SQLiteDatabase, categoryId: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM transactions WHERE category_id = ? LIMIT 1', [
    categoryId,
  ]);
  return row !== null;
}

export async function searchTransactions(
  db: SQLiteDatabase,
  filters: { query?: string; categoryId?: string | null } = {}
): Promise<TransactionRow[]> {
  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.categoryId) {
    conditions.push('category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters.query && filters.query.trim()) {
    conditions.push('(lower(merchant) LIKE ? OR lower(note) LIKE ?)');
    const like = `%${filters.query.trim().toLowerCase()}%`;
    params.push(like, like);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<TransactionRow>(
    `SELECT * FROM transactions ${whereClause} ORDER BY occurred_at DESC, created_at DESC`,
    params
  );
}

// Category ids ordered by most recent use, for the entry screen's
// most-recently-used-first category ordering (SPEC.md 5, entry screen requirements).
export async function getRecentlyUsedCategoryIds(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ category_id: string }>(
    'SELECT category_id, MAX(occurred_at) as last_used FROM transactions GROUP BY category_id ORDER BY last_used DESC'
  );
  return rows.map((row) => row.category_id);
}
