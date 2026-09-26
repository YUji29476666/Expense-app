import { getCurrencyExponent, getCurrencySymbol } from '@/constants/currencies';

// All amounts in this app are integers in minor currency units (SPEC.md 4.2).
// Never introduce a float amount anywhere outside this module's conversions.

export function toMinorUnits(amountMajor: number, currency: string): number {
  const exponent = getCurrencyExponent(currency);
  return Math.round(amountMajor * 10 ** exponent);
}

export function toMajorUnits(amountMinor: number, currency: string): number {
  const exponent = getCurrencyExponent(currency);
  return amountMinor / 10 ** exponent;
}

export function formatMinor(amountMinor: number, currency: string): string {
  const exponent = getCurrencyExponent(currency);
  const major = toMajorUnits(amountMinor, currency);
  const numeric = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: exponent,
    maximumFractionDigits: exponent,
  }).format(major);
  return `${getCurrencySymbol(currency)}${numeric}`;
}

export function formatDualCurrency(
  displayMinor: number,
  displayCurrency: string,
  homeMinor: number,
  homeCurrency: string
): string {
  return `${formatMinor(displayMinor, displayCurrency)} (${formatMinor(homeMinor, homeCurrency)})`;
}

// `rate` is a major-unit exchange rate: 1 major unit of `fromCurrency` equals
// `rate` major units of `toCurrency` (e.g. USD -> JPY rate of 150).
export function convertMinor(amountMinor: number, fromCurrency: string, toCurrency: string, rate: number): number {
  const fromMajor = toMajorUnits(amountMinor, fromCurrency);
  const toMajor = fromMajor * rate;
  return toMinorUnits(toMajor, toCurrency);
}
