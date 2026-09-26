export const SCHEMA_VERSION = 2;

export const CREATE_TRANSACTIONS_TABLE = `
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  home_minor INTEGER NOT NULL,
  home_currency TEXT NOT NULL,
  rate_used REAL NOT NULL,
  category_id TEXT NOT NULL,
  merchant TEXT,
  note TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  receipt_uri TEXT
);
`;

export const CREATE_TRANSACTIONS_OCCURRED_AT_INDEX = `
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions (occurred_at);
`;

export const CREATE_TRANSACTIONS_CATEGORY_INDEX = `
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id);
`;

export const CREATE_TRANSACTIONS_MERCHANT_INDEX = `
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions (merchant);
`;

export const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  budget_minor INTEGER,
  sort_order INTEGER NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0
);
`;

// Single-row table: the CHECK constraint makes a second row impossible.
export const CREATE_SETTINGS_TABLE = `
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_currency TEXT NOT NULL,
  home_currency TEXT NOT NULL,
  monthly_budget_minor INTEGER NOT NULL,
  month_start_day INTEGER NOT NULL,
  region_code TEXT,
  last_rate REAL,
  last_rate_at TEXT
);
`;
