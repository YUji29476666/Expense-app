import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionForm, type TransactionFormValues } from '@/components/transaction-form';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { insertTransaction } from '@/db/queries/transactions';
import { formatISODate } from '@/domain/month-period';
import { convertMinor, toMinorUnits } from '@/domain/money';
import { useCategories } from '@/hooks/use-categories';
import { useReceiptScan, type ReceiptSource } from '@/hooks/use-receipt-scan';
import { describeReceiptApiError } from '@/lib/receipt-api';

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
  const { categories } = useCategories();
  const { scan, isScanning } = useReceiptScan(categories);

  async function handleScan(source: ReceiptSource) {
    const outcome = await scan(source);
    if (outcome.status === 'canceled') {
      return;
    }
    if (outcome.status === 'permission_denied') {
      Alert.alert('Camera access needed', 'Allow camera access in system settings, or pick a photo instead.');
      return;
    }
    if (!outcome.result.ok) {
      Alert.alert('Could not read the image', describeReceiptApiError(outcome.result.error));
      return;
    }
    // Step 5 check only: the confirmation screen (Step 7) will prefill the
    // form with this instead of showing it.
    const receipt = outcome.result.receipt;
    Alert.alert(
      'Read from image',
      [
        `Type: ${receipt.type}`,
        `Amount: ${receipt.amount ?? '—'} ${receipt.currency ?? ''}`,
        `Merchant: ${receipt.merchant ?? '—'}`,
        `Date: ${receipt.date ?? '—'}`,
        `Category: ${receipt.categoryId ?? '—'}`,
      ].join('\n')
    );
  }

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
      <View style={styles.scanRow}>
        <ScanButton label="📷 Scan photo" disabled={isScanning} onPress={() => handleScan('camera')} />
        <ScanButton label="🖼️ From library" disabled={isScanning} onPress={() => handleScan('library')} />
      </View>
      {isScanning && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.scanning}>
          Reading image…
        </ThemedText>
      )}
      <TransactionForm initialValues={INITIAL_VALUES} submitLabel="Save" onSubmit={handleSubmit} />
    </ScrollView>
  );
}

function ScanButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.scanButtonWrapper} onPress={onPress} disabled={disabled}>
      <ThemedView type="backgroundElement" style={[styles.scanButton, disabled && styles.disabled]}>
        <ThemedText type="smallBold">{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  scanRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  scanButtonWrapper: {
    flex: 1,
  },
  scanButton: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  scanning: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
