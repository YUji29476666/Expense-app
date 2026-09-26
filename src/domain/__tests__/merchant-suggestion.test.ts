import { suggestCategoryForMerchant } from '../merchant-suggestion';

describe('suggestCategoryForMerchant', () => {
  it('returns null when there is no merchant history', () => {
    expect(suggestCategoryForMerchant([], 'Trader Joes')).toBeNull();
  });

  it('returns null for a blank merchant name', () => {
    expect(suggestCategoryForMerchant([{ merchant: 'X', category_id: 'a', occurred_at: '2026-01-01' }], '   ')).toBeNull();
  });

  it('matches merchant names case-insensitively and trims whitespace', () => {
    const result = suggestCategoryForMerchant(
      [{ merchant: '  Trader Joes  ', category_id: 'food_groceries', occurred_at: '2026-01-01' }],
      'trader joes'
    );
    expect(result).toBe('food_groceries');
  });

  it('picks the most frequent category for that merchant', () => {
    const result = suggestCategoryForMerchant(
      [
        { merchant: 'Shell', category_id: 'transportation', occurred_at: '2026-01-01' },
        { merchant: 'Shell', category_id: 'transportation', occurred_at: '2026-01-08' },
        { merchant: 'Shell', category_id: 'other', occurred_at: '2026-01-15' },
      ],
      'Shell'
    );
    expect(result).toBe('transportation');
  });

  it('breaks frequency ties using the most recent occurrence', () => {
    const result = suggestCategoryForMerchant(
      [
        { merchant: 'Amazon', category_id: 'clothing', occurred_at: '2026-01-01' },
        { merchant: 'Amazon', category_id: 'entertainment', occurred_at: '2026-02-01' },
      ],
      'Amazon'
    );
    expect(result).toBe('entertainment');
  });

  it('ignores transactions from other merchants', () => {
    const result = suggestCategoryForMerchant(
      [{ merchant: 'Costco', category_id: 'food_groceries', occurred_at: '2026-01-01' }],
      'Target'
    );
    expect(result).toBeNull();
  });
});
