import { buildReceiptPrefill } from '../receipt-prefill';

const TODAY = new Date(2026, 8, 26);
const CONTEXT = {
  displayCurrency: 'USD' as const,
  homeCurrency: 'JPY' as const,
  rate: 150,
  availableCategoryIds: new Set(['food_groceries', 'other', 'part_time_job']),
  today: TODAY,
};
const RECEIPT = {
  type: 'expense' as const,
  amount: 12.4,
  currency: 'USD' as const,
  merchant: "Trader Joe's",
  date: '2026-09-25',
  categoryId: 'food_groceries',
};

describe('buildReceiptPrefill', () => {
  it('fills every field from a clean USD receipt with no notices', () => {
    const { prefill, notices } = buildReceiptPrefill(RECEIPT, CONTEXT);
    expect(prefill).toEqual({
      type: 'expense',
      amountMajorText: '12.40',
      categoryId: 'food_groceries',
      merchant: "Trader Joe's",
      occurredAt: new Date(2026, 8, 25),
    });
    expect(notices).toEqual([]);
  });

  it('keeps cents exact instead of float noise', () => {
    const { prefill } = buildReceiptPrefill({ ...RECEIPT, amount: 0.1 + 0.2 }, CONTEXT);
    expect(prefill.amountMajorText).toBe('0.30');
  });

  it('converts a JPY receipt to USD at the current rate and flags it', () => {
    // ¥1,860 at 1 USD = 150 JPY -> $12.40.
    const { prefill, notices } = buildReceiptPrefill({ ...RECEIPT, amount: 1860, currency: 'JPY' }, CONTEXT);
    expect(prefill.amountMajorText).toBe('12.40');
    expect(notices).toEqual([{ kind: 'currency_converted', from: 'JPY', originalAmountMinor: 1860, rate: 150 }]);
  });

  it('leaves a JPY amount blank when no rate is set', () => {
    const { prefill, notices } = buildReceiptPrefill(
      { ...RECEIPT, amount: 1860, currency: 'JPY' },
      { ...CONTEXT, rate: null }
    );
    expect(prefill.amountMajorText).toBe('');
    expect(notices).toEqual([{ kind: 'currency_not_converted', from: 'JPY', originalAmountMinor: 1860 }]);
  });

  it('assumes the display currency when the image shows none', () => {
    const { prefill, notices } = buildReceiptPrefill({ ...RECEIPT, currency: null }, CONTEXT);
    expect(prefill.amountMajorText).toBe('12.40');
    expect(notices).toEqual([{ kind: 'currency_assumed', currency: 'USD' }]);
  });

  it('reports a missing amount and leaves the field empty', () => {
    const { prefill, notices } = buildReceiptPrefill({ ...RECEIPT, amount: null }, CONTEXT);
    expect(prefill.amountMajorText).toBe('');
    expect(notices).toContainEqual({ kind: 'amount_missing' });
  });

  it('falls back to today for a missing or impossible date', () => {
    for (const date of [null, '2026-02-30']) {
      const { prefill, notices } = buildReceiptPrefill({ ...RECEIPT, date }, CONTEXT);
      expect(prefill.occurredAt).toEqual(TODAY);
      expect(notices).toContainEqual({ kind: 'date_missing' });
    }
  });

  it('drops a category that no longer exists or does not match the type', () => {
    const archived = buildReceiptPrefill({ ...RECEIPT, categoryId: 'rent' }, CONTEXT);
    expect(archived.prefill.categoryId).toBeNull();
    expect(archived.notices).toContainEqual({ kind: 'category_missing' });

    const wrongType = buildReceiptPrefill({ ...RECEIPT, categoryId: 'part_time_job' }, CONTEXT);
    expect(wrongType.prefill.categoryId).toBeNull();
  });

  it('prefills income with an income category', () => {
    const { prefill, notices } = buildReceiptPrefill(
      { ...RECEIPT, type: 'income', merchant: 'Campus Cafe', categoryId: 'part_time_job' },
      CONTEXT
    );
    expect(prefill).toMatchObject({ type: 'income', categoryId: 'part_time_job', merchant: 'Campus Cafe' });
    expect(notices).toEqual([]);
  });

  it('uses an empty merchant when none was read', () => {
    expect(buildReceiptPrefill({ ...RECEIPT, merchant: null }, CONTEXT).prefill.merchant).toBe('');
  });
});
