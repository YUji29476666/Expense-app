import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useCategories } from './use-categories';

import { useSQLiteContext } from '@/db/client';
import { getRecentlyUsedCategoryIds } from '@/db/queries/transactions';
import type { CategoryRow } from '@/db/types';

// SPEC.md 5 entry-screen requirement: "カテゴリは最近使った順に上に並べる".
// Recently-used categories come first (most recent first), then any
// remaining categories in their configured sort order.
export function useMruCategories(): CategoryRow[] {
  const db = useSQLiteContext();
  const { categories } = useCategories();
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    const ids = await getRecentlyUsedCategoryIds(db);
    setRecentIds(ids);
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const ordered: CategoryRow[] = [];
  const seen = new Set<string>();
  for (const id of recentIds) {
    const category = categories.find((c) => c.id === id);
    if (category) {
      ordered.push(category);
      seen.add(id);
    }
  }
  for (const category of categories) {
    if (!seen.has(category.id)) {
      ordered.push(category);
    }
  }

  return ordered;
}
