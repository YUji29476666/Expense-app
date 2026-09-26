export type DefaultCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
};

// Initial category set from SPEC.md 3.1. Remittance/Fees is required for
// study-abroad living costs (wire/FX fees) and must not be removed here,
// though the user can delete it later via category management.
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 'rent', name: 'Rent', icon: '🏠', color: '#5B8DEF', sortOrder: 0 },
  { id: 'food_groceries', name: 'Food (Groceries)', icon: '🛒', color: '#4CAF93', sortOrder: 1 },
  { id: 'food_eating_out', name: 'Food (Eating out)', icon: '🍽️', color: '#F2A65A', sortOrder: 2 },
  { id: 'transportation', name: 'Transportation', icon: '🚌', color: '#7E7BEF', sortOrder: 3 },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#F2C14E', sortOrder: 4 },
  { id: 'phone_internet', name: 'Phone/Internet', icon: '📶', color: '#4FB0C6', sortOrder: 5 },
  { id: 'education', name: 'Education', icon: '📚', color: '#8E6C88', sortOrder: 6 },
  { id: 'health', name: 'Health', icon: '⚕️', color: '#E4626F', sortOrder: 7 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#C77DFF', sortOrder: 8 },
  { id: 'clothing', name: 'Clothing', icon: '👕', color: '#E08DAC', sortOrder: 9 },
  { id: 'remittance_fees', name: 'Remittance/Fees', icon: '💸', color: '#EF6461', sortOrder: 10 },
  { id: 'other', name: 'Other', icon: '🔖', color: '#9AA5B1', sortOrder: 11 },
];

// Income sources for students, added in schema v2. The entry form shows
// these (plus Other) only when "Income" is selected, and hides them for
// expenses.
export const INCOME_CATEGORIES: DefaultCategory[] = [
  { id: 'scholarship', name: 'Scholarship', icon: '🎓', color: '#3DA35D', sortOrder: 12 },
  { id: 'part_time_job', name: 'Part-time job', icon: '💼', color: '#2E86AB', sortOrder: 13 },
  { id: 'internship', name: 'Internship', icon: '🧑‍💻', color: '#A06CD5', sortOrder: 14 },
];

export const INCOME_CATEGORY_IDS: ReadonlySet<string> = new Set(INCOME_CATEGORIES.map((category) => category.id));

// Shown for both types, so an income that fits no source can still be filed.
export const SHARED_CATEGORY_ID = 'other';

export function isCategoryForType(categoryId: string, type: 'expense' | 'income'): boolean {
  if (categoryId === SHARED_CATEGORY_ID) {
    return true;
  }
  return type === 'income' ? INCOME_CATEGORY_IDS.has(categoryId) : !INCOME_CATEGORY_IDS.has(categoryId);
}
