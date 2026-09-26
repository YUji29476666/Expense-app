// Central place for every tunable alert threshold (SPEC.md 3.4: "閾値は定数として1ファイルにまとめる").

// A category alert fires once spend reaches this fraction of its budget.
export const CATEGORY_BUDGET_WARNING_RATIO = 0.8;

// The "This month you can spend" card turns yellow once less than this
// fraction of the monthly budget is left, and red once it goes negative.
export const REMAINING_BUDGET_WARNING_RATIO = 0.2;
