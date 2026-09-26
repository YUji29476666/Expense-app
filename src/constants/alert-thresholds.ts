// Central place for every tunable alert threshold (SPEC.md 3.4: "閾値は定数として1ファイルにまとめる").

// A category alert fires once spend reaches this fraction of its budget.
export const CATEGORY_BUDGET_WARNING_RATIO = 0.8;

// Today's allowance card turns from green to yellow once today's spend
// reaches this fraction of today's allowance, and red once it's exceeded.
export const TODAY_SPEND_WARNING_RATIO = 0.8;
