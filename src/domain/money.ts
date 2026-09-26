import { getCurrencyExponent, getCurrencySymbol, type SupportedCurrency } from '@/constants/currencies';

// All amounts in this app are integers in minor currency units (SPEC.md 4.2).
// Never introduce a float amount anywhere outside this module's conversions.

export function toMinorUnits(amountMajor: number, currency: SupportedCurrency): number {
  const exponent = getCurrencyExponent(currency);
  return Math.round(amountMajor * 10 ** exponent);
}

export function toMajorUnits(amountMinor: number, currency: SupportedCurrency): number {
  const exponent = getCurrencyExponent(currency);
  return amountMinor / 10 ** exponent;
}

export function formatMinor(amountMinor: number, currency: SupportedCurrency): string {
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
  displayCurrency: SupportedCurrency,
  homeMinor: number,
  homeCurrency: SupportedCurrency
): string {
  return `${formatMinor(displayMinor, displayCurrency)} (${formatMinor(homeMinor, homeCurrency)})`;
}

// `rate` is a major-unit exchange rate: 1 major unit of `fromCurrency` equals
// `rate` major units of `toCurrency` (e.g. USD -> JPY rate of 150).
export function convertMinor(amountMinor: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency, rate: number): number {
  const fromMajor = toMajorUnits(amountMinor, fromCurrency);
  const toMajor = fromMajor * rate;
  return toMinorUnits(toMajor, toCurrency);
}

// The effective major-unit rate behind a set of transactions: total home
// amount / total display amount (e.g. 1 USD = 149.8 JPY). Null when there is
// nothing to average.
export function computeAverageRate(
  amountMinor: number,
  fromCurrency: SupportedCurrency,
  homeMinor: number,
  toCurrency: SupportedCurrency
): number | null {
  if (amountMinor === 0) {
    return null;
  }
  return toMajorUnits(homeMinor, toCurrency) / toMajorUnits(amountMinor, fromCurrency);
}
