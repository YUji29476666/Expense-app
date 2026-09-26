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
import { chooseRateForSave } from '@/lib/rate-prompt';

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
    if (!values.categoryId || !transaction || !settings) {
      return;
    }
    // Editing keeps the transaction's original currency. rate_used belongs to
    // the transaction's date (SPEC.md 3.3): it is kept as is unless the date
    // changes, in which case the rate for the new date replaces it.
    const occurredAtIso = formatISODate(values.occurredAt);
    let rate = transaction.rate_used;
    if (occurredAtIso !== transaction.occurred_at) {
      const newRate = await chooseRateForSave({
        occurredAtIso,
        todayIso: formatISODate(new Date()),
        displayCurrency: transaction.currency,
        homeCurrency: transaction.home_currency,
        currentRate: settings.last_rate,
      });
      if (newRate === null) {
        return;
      }
      rate = newRate;
    }
    const amountMinor = toMinorUnits(parseFloat(values.amountMajorText), transaction.currency);
    const homeMinor = convertMinor(amountMinor, transaction.currency, transaction.home_currency, rate);

    await updateTransaction(db, id, {
      type: values.type,
      amount_minor: amountMinor,
      home_minor: homeMinor,
      rate_used: rate,
      category_id: values.categoryId,
      merchant: values.merchant.trim() || null,
      note: values.note.trim() || null,
      occurred_at: occurredAtIso,
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
