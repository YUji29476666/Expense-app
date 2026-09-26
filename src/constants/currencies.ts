// Phase 1 handles USD / JPY only (SPEC.md 3.3). Keeping both exponent 2 and
// exponent 0 is deliberate: currencies with and without a fractional minor
// unit both stay on the exercised code path.
export const SUPPORTED_CURRENCIES = ['USD', 'JPY'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Minor-unit exponent per ISO 4217 (e.g. USD -> 2 means $12.40 is stored as 1240).
export const CURRENCY_EXPONENTS: Record<SupportedCurrency, number> = {
  USD: 2,
  JPY: 0,
};

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: '$',
  JPY: '¥',
};

// Currencies are always chosen as a pair. Not letting display and home be
// picked independently makes "only one side was updated" unrepresentable
// at the UI level.
export type CurrencyPair = {
  display: SupportedCurrency;
  home: SupportedCurrency;
  label: string;
};

// Only USD -> JPY is offered: spending happens in USD and is viewed in JPY.
// JPY is still a SupportedCurrency (it is the home currency).
export const CURRENCY_PAIRS: readonly CurrencyPair[] = [{ display: 'USD', home: 'JPY', label: 'USD → JPY' }];

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

// The Records cover every key, so the old `?? DEFAULT_CURRENCY_EXPONENT`
// fallback is gone: an unknown currency code is now a compile error instead
// of silently being treated as exponent 2.
export function getCurrencyExponent(currency: SupportedCurrency): number {
  return CURRENCY_EXPONENTS[currency];
}

export function getCurrencySymbol(currency: SupportedCurrency): string {
  return CURRENCY_SYMBOLS[currency];
}
