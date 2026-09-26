import { CATEGORY_BUDGET_WARNING_RATIO } from '@/constants/alert-thresholds';

// Every function here is pure arithmetic (SPEC.md 3.4: "以下は全て単純な計算で
// 実装する。API呼び出しは行わない"). They return typed results, not copy —
// wording lives in src/constants/alert-templates.ts.

export type CategoryBudgetWarning = {
  ratio: number; // spend / budget, e.g. 0.85
  isOverThreshold: boolean;
};

// "Food がカテゴリ予算の80%に達しました". Returns null when the category has no budget set.
export function computeCategoryBudgetWarning(params: {
  categorySpendMinor: number;
  categoryBudgetMinor: number | null;
}): CategoryBudgetWarning | null {
  const { categorySpendMinor, categoryBudgetMinor } = params;
  if (categoryBudgetMinor === null || categoryBudgetMinor <= 0) {
    return null;
  }
  const ratio = categorySpendMinor / categoryBudgetMinor;
  return { ratio, isOverThreshold: ratio >= CATEGORY_BUDGET_WARNING_RATIO };
}

export type PeriodComparison = {
  diffMinor: number; // positive means spending more than the same point last period
};

// "先月の同時点より $X 多く使っています" — caller supplies both sums, each
// computed over the same number of elapsed days into their respective period.
export function compareToSamePointLastPeriod(
  thisPeriodSpendSoFarMinor: number,
  lastPeriodSpendAtSamePointMinor: number
): PeriodComparison {
  return { diffMinor: thisPeriodSpendSoFarMinor - lastPeriodSpendAtSamePointMinor };
}
