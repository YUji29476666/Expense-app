import type { SQLiteDatabase } from 'expo-sqlite';

import type { CategoryRow } from '../types';

export async function listCategories(
  db: SQLiteDatabase,
  options: { includeArchived?: boolean } = {}
): Promise<CategoryRow[]> {
  if (options.includeArchived) {
    return db.getAllAsync<CategoryRow>('SELECT * FROM categories ORDER BY sort_order ASC');
  }
  return db.getAllAsync<CategoryRow>('SELECT * FROM categories WHERE is_archived = 0 ORDER BY sort_order ASC');
}

export async function getCategoryById(db: SQLiteDatabase, id: string): Promise<CategoryRow | null> {
  return db.getFirstAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
}

export async function insertCategory(db: SQLiteDatabase, category: CategoryRow): Promise<void> {
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, budget_minor, sort_order, is_archived) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [category.id, category.name, category.icon, category.color, category.budget_minor, category.sort_order, category.is_archived]
  );
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  patch: Partial<Omit<CategoryRow, 'id'>>
): Promise<void> {
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (fields.length === 0) {
    return;
  }
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => patch[field] as string | number | null);
  await db.runAsync(`UPDATE categories SET ${setClause} WHERE id = ?`, [...values, id]);
}

export async function archiveCategory(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE categories SET is_archived = 1 WHERE id = ?', [id]);
}

export async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}

export async function getMaxSortOrder(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ max_sort_order: number | null }>(
    'SELECT MAX(sort_order) as max_sort_order FROM categories'
  );
  return row?.max_sort_order ?? -1;
}
