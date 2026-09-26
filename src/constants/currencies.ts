// Minor-unit exponent per ISO 4217 (e.g. USD -> 2 means $12.40 is stored as 1240).
export const CURRENCY_EXPONENTS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  JPY: 0,
  CAD: 2,
  AUD: 2,
  CHF: 2,
  CNY: 2,
  KRW: 0,
  INR: 2,
  SGD: 2,
  HKD: 2,
  NZD: 2,
  MXN: 2,
  THB: 2,
  VND: 0,
  PHP: 2,
  IDR: 2,
  MYR: 2,
  TWD: 2,
  ZAR: 2,
  TRY: 2,
  AED: 2,
  SEK: 2,
  NOK: 2,
  DKK: 2,
  PLN: 2,
  BRL: 2,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: '$',
  AUD: '$',
  CHF: 'CHF ',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  SGD: '$',
  HKD: '$',
  NZD: '$',
  MXN: '$',
  THB: '฿',
  VND: '₫',
  PHP: '₱',
  IDR: 'Rp',
  MYR: 'RM',
  TWD: 'NT$',
  ZAR: 'R',
  TRY: '₺',
  AED: 'AED ',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  BRL: 'R$',
};

export const DEFAULT_CURRENCY_EXPONENT = 2;

export function getCurrencyExponent(currency: string): number {
  return CURRENCY_EXPONENTS[currency] ?? DEFAULT_CURRENCY_EXPONENT;
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}
