import type { SQLiteDatabase } from 'expo-sqlite';

import type { SettingsRow } from '../types';

export async function getSettings(db: SQLiteDatabase): Promise<SettingsRow> {
  const row = await db.getFirstAsync<SettingsRow>('SELECT * FROM settings WHERE id = 1');
  if (!row) {
    throw new Error('settings row missing — migration did not seed it');
  }
  return row;
}

export async function updateSettings(db: SQLiteDatabase, patch: Partial<Omit<SettingsRow, 'id'>>): Promise<void> {
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (fields.length === 0) {
    return;
  }
  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => patch[field] as string | number | null);
  await db.runAsync(`UPDATE settings SET ${setClause} WHERE id = 1`, values);
}
