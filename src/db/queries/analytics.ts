import type { SQLiteDatabase } from 'expo-sqlite';

export type CategoryBreakdownRow = {
  category_id: string;
  total_minor: number;
};

export async function getCategoryBreakdownForRange(
  db: SQLiteDatabase,
  startDate: string,
  endDateInclusive: string
): Promise<CategoryBreakdownRow[]> {
  return db.getAllAsync<CategoryBreakdownRow>(
    `SELECT category_id, SUM(amount_minor) as total_minor
     FROM transactions
     WHERE type = 'expense' AND occurred_at >= ? AND occurred_at <= ?
     GROUP BY category_id
     ORDER BY total_minor DESC`,
    [startDate, endDateInclusive]
  );
}
