import type { SupportedCurrency } from '@/constants/currencies';
import { isCategoryForType } from '@/constants/categories';
import type { ParsedReceipt } from '../../supabase/functions/parse-receipt/receipt';
import { convertMinor, toMajorUnits, toMinorUnits } from './money';

// Turns what parse-receipt read from an image into starting values for the
// Add transaction form (SPEC.md 8). Nothing here saves anything: the user
// reviews and edits every field, then saves through the normal path, which
// applies the current rate_used like any manual entry.

export type ReceiptPrefill = {
  type: 'expense' | 'income';
  amountMajorText: string;
  categoryId: string | null;
  merchant: string;
  occurredAt: Date;
};

// Things the user must look at before saving. Copy lives in the UI.
export type ReceiptNotice =
  | { kind: 'amount_missing' }
  | { kind: 'date_missing' }
  | { kind: 'category_missing' }
  | { kind: 'currency_assumed'; currency: SupportedCurrency }
  | {
      kind: 'currency_converted';
      from: SupportedCurrency;
      originalAmountMinor: number;
      rate: number; // 1 display unit = `rate` home units
    }
  | { kind: 'currency_not_converted'; from: SupportedCurrency; originalAmountMinor: number };

export type ReceiptPrefillResult = { prefill: ReceiptPrefill; notices: ReceiptNotice[] };

// Formats a major-unit amount the way the form's amount field expects,
// with exactly the currency's minor digits ("12.40", "1860").
function toAmountText(amountMinor: number, currency: SupportedCurrency): string {
  const decimals = Math.round(Math.log10(toMinorUnits(1, currency)));
  return toMajorUnits(amountMinor, currency).toFixed(decimals);
}

// "YYYY-MM-DD" -> local midnight, matching how the form and
// formatISODate treat dates. Invalid input returns null.
function parseLocalDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function buildReceiptPrefill(
  receipt: ParsedReceipt,
  context: {
    displayCurrency: SupportedCurrency;
    homeCurrency: SupportedCurrency;
    // settings.last_rate: 1 display unit = rate home units, or null if unset.
    rate: number | null;
    // Category ids that currently exist (unarchived).
    availableCategoryIds: ReadonlySet<string>;
    today: Date;
  }
): ReceiptPrefillResult {
  const { displayCurrency, homeCurrency, rate, availableCategoryIds, today } = context;
  const notices: ReceiptNotice[] = [];

  let amountMajorText = '';
  if (receipt.amount === null) {
    notices.push({ kind: 'amount_missing' });
  } else {
    const currency = receipt.currency ?? displayCurrency;
    if (receipt.currency === null) {
      notices.push({ kind: 'currency_assumed', currency: displayCurrency });
    }
    const amountMinor = toMinorUnits(receipt.amount, currency);
    if (currency === displayCurrency) {
      amountMajorText = toAmountText(amountMinor, displayCurrency);
    } else if (currency === homeCurrency && rate !== null && rate > 0) {
      // Transactions are recorded in the display currency, so a home-currency
      // receipt is converted at the current rate and flagged for review.
      const displayMinor = convertMinor(amountMinor, homeCurrency, displayCurrency, 1 / rate);
      amountMajorText = toAmountText(displayMinor, displayCurrency);
      notices.push({ kind: 'currency_converted', from: currency, originalAmountMinor: amountMinor, rate });
    } else {
      // No rate to convert with: leave the amount for the user rather than guess.
      notices.push({ kind: 'currency_not_converted', from: currency, originalAmountMinor: amountMinor });
    }
  }

  let occurredAt = today;
  const parsedDate = receipt.date ? parseLocalDate(receipt.date) : null;
  if (parsedDate) {
    occurredAt = parsedDate;
  } else {
    notices.push({ kind: 'date_missing' });
  }

  const categoryId =
    receipt.categoryId !== null &&
    availableCategoryIds.has(receipt.categoryId) &&
    isCategoryForType(receipt.categoryId, receipt.type)
      ? receipt.categoryId
      : null;
  if (categoryId === null) {
    notices.push({ kind: 'category_missing' });
  }

  return {
    prefill: {
      type: receipt.type,
      amountMajorText,
      categoryId,
      merchant: receipt.merchant ?? '',
      occurredAt,
    },
    notices,
  };
}
