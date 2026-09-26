import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { TransactionForm, type TransactionFormValues } from '@/components/transaction-form';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { insertTransaction } from '@/db/queries/transactions';
import { formatISODate } from '@/domain/month-period';
import { convertMinor, toMinorUnits } from '@/domain/money';

const INITIAL_VALUES: TransactionFormValues = {
  type: 'expense',
  amountMajorText: '',
  categoryId: null,
  merchant: '',
  note: '',
  occurredAt: new Date(),
};

export default function NewTransactionScreen() {
  const db = useSQLiteContext();
  const { settings } = useSettings();

  async function handleSubmit(values: TransactionFormValues) {
    if (!settings || !values.categoryId) {
      return;
    }
    // rate_used is a snapshot frozen at entry time and never recalculated
    // (SPEC.md 3.3), so a wrong rate saved here can never be repaired.
    // Never substitute a placeholder like 1 — block the save instead.
    if (settings.last_rate === null) {
      Alert.alert(
        'Exchange rate not set',
        'Fetch the latest exchange rate in Settings first. Each transaction stores the rate used at entry time and never recalculates it, so a placeholder rate cannot be corrected later.'
      );
      return;
    }
    const rate = settings.last_rate;
    const amountMinor = toMinorUnits(parseFloat(values.amountMajorText), settings.display_currency);
    const homeMinor = convertMinor(amountMinor, settings.display_currency, settings.home_currency, rate);

    await insertTransaction(db, {
      id: Crypto.randomUUID(),
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
      created_at: new Date().toISOString(),
      receipt_uri: null,
    });

    router.back();
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <TransactionForm initialValues={INITIAL_VALUES} submitLabel="Save" onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
  },
});
