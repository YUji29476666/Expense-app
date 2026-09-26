import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TransactionForm, type TransactionFormValues } from '@/components/transaction-form';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { deleteTransaction, getTransactionById, updateTransaction } from '@/db/queries/transactions';
import type { TransactionRow } from '@/db/types';
import { formatISODate } from '@/domain/month-period';
import { convertMinor, toMajorUnits, toMinorUnits } from '@/domain/money';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const [transaction, setTransaction] = useState<TransactionRow | null>(null);

  useEffect(() => {
    getTransactionById(db, id).then(setTransaction);
  }, [db, id]);

  if (!transaction || !settings) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </ScrollView>
    );
  }

  const initialValues: TransactionFormValues = {
    type: transaction.type,
    amountMajorText: String(toMajorUnits(transaction.amount_minor, transaction.currency)),
    categoryId: transaction.category_id,
    merchant: transaction.merchant ?? '',
    note: transaction.note ?? '',
    occurredAt: new Date(`${transaction.occurred_at}T00:00:00`),
  };

  async function handleSubmit(values: TransactionFormValues) {
    if (!values.categoryId || !settings) {
      return;
    }
    const amountMinor = toMinorUnits(parseFloat(values.amountMajorText), settings.display_currency);
    const rate = settings.last_rate ?? 1;
    const homeMinor = convertMinor(amountMinor, settings.display_currency, settings.home_currency, rate);

    await updateTransaction(db, id, {
      type: values.type,
      amount_minor: amountMinor,
      currency: settings.display_currency,
      home_minor: homeMinor,
      home_currency: settings.home_currency,
      rate_used: rate,
      category_id: values.categoryId,
      merchant: values.merchant.trim() || null,
      note: values.note.trim() || null,
      occurred_at: formatISODate(values.occurredAt),
    });

    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(db, id);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TransactionForm
        initialValues={initialValues}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
  },
});
