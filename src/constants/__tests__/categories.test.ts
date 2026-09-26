import { isCategoryForType } from '../categories';

describe('isCategoryForType', () => {
  it('shows student income sources only for income', () => {
    for (const id of ['scholarship', 'part_time_job', 'internship']) {
      expect(isCategoryForType(id, 'income')).toBe(true);
      expect(isCategoryForType(id, 'expense')).toBe(false);
    }
  });

  it('shows spending categories only for expenses', () => {
    expect(isCategoryForType('rent', 'expense')).toBe(true);
    expect(isCategoryForType('rent', 'income')).toBe(false);
  });

  it('shows Other for both types', () => {
    expect(isCategoryForType('other', 'expense')).toBe(true);
    expect(isCategoryForType('other', 'income')).toBe(true);
  });
});
