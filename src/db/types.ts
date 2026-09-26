import type { SupportedCurrency } from '@/constants/currencies';

export type TransactionType = 'expense' | 'income';

export type TransactionRow = {
  id: string;
  type: TransactionType;
  amount_minor: number;
  currency: SupportedCurrency;
  home_minor: number;
  home_currency: SupportedCurrency;
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
  display_currency: SupportedCurrency;
  home_currency: SupportedCurrency;
  monthly_budget_minor: number;
  month_start_day: number; // 1-28
  region_code: string | null;
  last_rate: number | null;
  last_rate_at: string | null;
};

// The generic settings patch excludes both currency columns. Currencies can
// only change through updateCurrencyPair, so code that updates just
// display_currency (leaving last_rate pointing at the old pair) cannot be
// written. last_rate stays patchable: refreshing the rate for the current
// pair cannot break the "rate belongs to the current pair" invariant.
export type SettingsPatch = Partial<Omit<SettingsRow, 'id' | 'display_currency' | 'home_currency'>>;
