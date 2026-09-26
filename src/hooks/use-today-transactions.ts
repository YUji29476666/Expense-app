import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { useSQLiteContext } from '@/db/client';
import { listTransactionsByRange } from '@/db/queries/transactions';
import { formatISODate } from '@/domain/month-period';
import type { TransactionRow } from '@/db/types';

export function useTodayTransactions() {
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  const load = useCallback(async () => {
    const todayStr = formatISODate(new Date());
    const rows = await listTransactionsByRange(db, todayStr, todayStr);
    setTransactions(rows);
  }, [db]);

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
