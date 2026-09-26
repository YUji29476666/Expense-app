import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useSQLiteContext } from '@/db/client';
import { listCategories } from '@/db/queries/categories';
import type { CategoryRow } from '@/db/types';

export function useCategories(options: { includeArchived?: boolean } = {}) {
  const db = useSQLiteContext();
  const { includeArchived } = options;
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const load = useCallback(async () => {
    const rows = await listCategories(db, { includeArchived });
    setCategories(rows);
  }, [db, includeArchived]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { categories, refresh: load };
}
