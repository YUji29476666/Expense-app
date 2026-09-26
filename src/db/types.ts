export type TransactionType = 'expense' | 'income';

export type TransactionRow = {
  id: string;
  type: TransactionType;
  amount_minor: number;
  currency: string;
  home_minor: number;
  home_currency: string;
  rate_used: number;
  category_id: string;
  merchant: string | null;
  note: string | null;
  occurred_at: string; // ISO8601 date, e.g. "2026-09-17"
  created_at: string; // ISO8601 datetime
  receipt_uri: string | null; // Phase 2 only; always null in Phase 1
};

export type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget_minor: number | null;
  sort_order: number;
  is_archived: number; // SQLite has no boolean type: 0 | 1
};

export type SettingsRow = {
  id: 1;
  display_currency: string;
  home_currency: string;
  monthly_budget_minor: number;
  month_start_day: number; // 1-28
  region_code: string | null;
  last_rate: number | null;
  last_rate_at: string | null;
};
