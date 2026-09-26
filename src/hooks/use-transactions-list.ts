import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useSQLiteContext } from '@/db/client';
import { searchTransactions } from '@/db/queries/transactions';
import type { TransactionRow } from '@/db/types';

export function useTransactionsList(filters: { query: string; categoryId: string | null }) {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const { query, categoryId } = filters;

  const load = useCallback(async () => {
    const rows = await searchTransactions(db, { query, categoryId });
    setTransactions(rows);
  }, [db, query, categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { transactions, refresh: load };
}
