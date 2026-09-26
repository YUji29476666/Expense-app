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
