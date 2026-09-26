import {
  buildPrompt,
  MAX_IMAGE_BASE64_LENGTH,
  parseModelOutput,
  validateRequest,
  type CategoryOption,
} from '../receipt';

const CATEGORIES: CategoryOption[] = [
  { id: 'food_groceries', name: 'Food (Groceries)', type: 'expense' },
  { id: 'other', name: 'Other', type: 'expense' },
  { id: 'part_time_job', name: 'Part-time job', type: 'income' },
];

const VALID_BODY = {
  imageBase64: 'iVBORw0KGgo=',
  mimeType: 'image/png',
  today: '2026-09-26',
  categories: CATEGORIES,
};

describe('validateRequest', () => {
  it('accepts a well-formed request', () => {
    expect(validateRequest(VALID_BODY)).toEqual({ ok: true, value: VALID_BODY });
  });

  it.each([
    ['a non-object body', 'nope'],
    ['a missing image', { ...VALID_BODY, imageBase64: '' }],
    ['non-base64 image data', { ...VALID_BODY, imageBase64: 'not base64!' }],
    ['an unsupported mime type', { ...VALID_BODY, mimeType: 'application/pdf' }],
    ['an impossible date', { ...VALID_BODY, today: '2026-02-30' }],
    ['no categories', { ...VALID_BODY, categories: [] }],
    ['a malformed category', { ...VALID_BODY, categories: [{ id: 'x', name: 'X', type: 'gift' }] }],
  ])('rejects %s', (_label, body) => {
    expect(validateRequest(body).ok).toBe(false);
  });

  it('rejects an image over the size cap', () => {
    const result = validateRequest({ ...VALID_BODY, imageBase64: 'A'.repeat(MAX_IMAGE_BASE64_LENGTH + 4) });
    expect(result).toEqual({ ok: false, error: 'image is too large' });
  });
});

describe('buildPrompt', () => {
  it('includes today and every category id with its type', () => {
    const prompt = buildPrompt(VALID_BODY);
    expect(prompt).toContain('Today is 2026-09-26');
    expect(prompt).toContain('- food_groceries (expense): Food (Groceries)');
    expect(prompt).toContain('- part_time_job (income): Part-time job');
  });
});

describe('parseModelOutput', () => {
  const model = (fields: Record<string, unknown>) =>
    JSON.stringify({
      is_transaction: true,
      type: 'expense',
      amount: 12.4,
      currency: 'USD',
      merchant: "Trader Joe's",
      date: '2026-09-25',
      category_id: 'food_groceries',
      ...fields,
    });

  it('passes through a clean receipt', () => {
    expect(parseModelOutput(model({}), CATEGORIES)).toEqual({
      ok: true,
      value: {
        type: 'expense',
        amount: 12.4,
        currency: 'USD',
        merchant: "Trader Joe's",
        date: '2026-09-25',
        categoryId: 'food_groceries',
      },
    });
  });

  it('reports images that are not transactions', () => {
    expect(parseModelOutput(model({ is_transaction: false }), CATEGORIES)).toEqual({
      ok: false,
      error: 'not_a_transaction',
    });
  });

  it('rejects output that is not JSON', () => {
    expect(parseModelOutput('Sure! The total is $12.40', CATEGORIES).ok).toBe(false);
  });

  it.each([
    ['zero', 0],
    ['negative', -5],
    ['a string', '12.40'],
  ])('nulls an amount that is %s', (_label, amount) => {
    const result = parseModelOutput(model({ amount }), CATEGORIES);
    expect(result.ok && result.value.amount).toBeNull();
  });

  it('nulls an unsupported currency and an invalid date', () => {
    const result = parseModelOutput(model({ currency: 'EUR', date: '09/25/2026' }), CATEGORIES);
    expect(result.ok && result.value.currency).toBeNull();
    expect(result.ok && result.value.date).toBeNull();
  });

  it('drops a category id that is unknown or belongs to the other type', () => {
    const unknown = parseModelOutput(model({ category_id: 'made_up' }), CATEGORIES);
    expect(unknown.ok && unknown.value.categoryId).toBeNull();
    const wrongType = parseModelOutput(model({ category_id: 'part_time_job' }), CATEGORIES);
    expect(wrongType.ok && wrongType.value.categoryId).toBeNull();
  });

  it('keeps an income category for income', () => {
    const result = parseModelOutput(model({ type: 'income', category_id: 'part_time_job' }), CATEGORIES);
    expect(result.ok && result.value).toMatchObject({ type: 'income', categoryId: 'part_time_job' });
  });

  it('trims the merchant and treats blank as null', () => {
    const blank = parseModelOutput(model({ merchant: '   ' }), CATEGORIES);
    expect(blank.ok && blank.value.merchant).toBeNull();
    const padded = parseModelOutput(model({ merchant: '  Costco  ' }), CATEGORIES);
    expect(padded.ok && padded.value.merchant).toBe('Costco');
  });
});
