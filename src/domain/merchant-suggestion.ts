export type PastTransactionForSuggestion = {
  merchant: string | null;
  category_id: string;
  occurred_at: string; // ISO8601, used only to break frequency ties by recency
};

// SPEC.md 3.1: "同じ店名を入力したとき、前回のカテゴリを候補として提示する
// （学習は単純な頻度カウントでよい。AI不要）". Matches merchant names
// case-insensitively and ignoring surrounding whitespace.
export function suggestCategoryForMerchant(
  pastTransactions: PastTransactionForSuggestion[],
  merchantName: string
): string | null {
  const normalized = merchantName.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const counts = new Map<string, { count: number; mostRecentOccurredAt: string }>();
  for (const transaction of pastTransactions) {
    if (!transaction.merchant || transaction.merchant.trim().toLowerCase() !== normalized) {
      continue;
    }
    const existing = counts.get(transaction.category_id);
    if (existing) {
      existing.count += 1;
      if (transaction.occurred_at > existing.mostRecentOccurredAt) {
        existing.mostRecentOccurredAt = transaction.occurred_at;
      }
    } else {
      counts.set(transaction.category_id, { count: 1, mostRecentOccurredAt: transaction.occurred_at });
    }
  }

  let bestCategoryId: string | null = null;
  let best: { count: number; mostRecentOccurredAt: string } | null = null;
  for (const [categoryId, stats] of counts) {
    if (
      !best ||
      stats.count > best.count ||
      (stats.count === best.count && stats.mostRecentOccurredAt > best.mostRecentOccurredAt)
    ) {
      best = stats;
      bestCategoryId = categoryId;
    }
  }

  return bestCategoryId;
}
