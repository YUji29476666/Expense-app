import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ReceiptReviewBanner } from '@/components/receipt-review-banner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionForm, type TransactionFormValues } from '@/components/transaction-form';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import { insertTransaction } from '@/db/queries/transactions';
import { formatISODate } from '@/domain/month-period';
import { convertMinor, toMinorUnits } from '@/domain/money';
import { buildReceiptPrefill, type ReceiptNotice } from '@/domain/receipt-prefill';
import { useCategories } from '@/hooks/use-categories';
import { useReceiptScan, type ReceiptSource } from '@/hooks/use-receipt-scan';
import { fetchRateOnDate } from '@/lib/fx';
import { chooseRateForSave } from '@/lib/rate-prompt';
import { describeReceiptApiError } from '@/lib/receipt-api';

function emptyValues(): TransactionFormValues {
  return {
    type: 'expense',
    amountMajorText: '',
    categoryId: null,
    merchant: '',
    note: '',
    occurredAt: new Date(),
  };
}

export default function NewTransactionScreen() {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const { categories } = useCategories();
  const { scan, isScanning } = useReceiptScan(categories);
  // TransactionForm reads initialValues only on mount, so a scan swaps in
  // new values and bumps the key to remount it prefilled.
  const [formValues, setFormValues] = useState<TransactionFormValues>(emptyValues);
  const [formKey, setFormKey] = useState(0);
  const [receiptNotices, setReceiptNotices] = useState<ReceiptNotice[] | null>(null);

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
      const { error, status, detail } = outcome.result;
      // The code line makes a failure report actionable.
      Alert.alert(
        'Could not read the image',
        `${describeReceiptApiError(error)}\n\n(code: ${error}${status ? `, HTTP ${status}` : ''}${detail ? `, ${detail}` : ''})`
      );
      return;
    }
    if (!settings) {
      return;
    }
    const receipt = outcome.result.receipt;
    // A home-currency receipt is converted for the form at its own date's rate
    // when that date is in the past; the current rate otherwise or offline.
    let conversionRate = settings.last_rate;
    const todayIso = formatISODate(new Date());
    if (receipt.currency === settings.home_currency && receipt.date && receipt.date < todayIso) {
      try {
        conversionRate = (await fetchRateOnDate(settings.display_currency, settings.home_currency, receipt.date)).rate;
      } catch {
        // Keep the current rate; the banner shows which rate was applied.
      }
    }
    // Prefill only: the user reviews every field and saves via handleSubmit,
    // exactly like a manual entry. Nothing is saved automatically.
    const { prefill, notices } = buildReceiptPrefill(receipt, {
      displayCurrency: settings.display_currency,
      homeCurrency: settings.home_currency,
      rate: conversionRate,
      availableCategoryIds: new Set(categories.map((category) => category.id)),
      today: new Date(),
    });
    setFormValues({ ...prefill, note: '' });
    setReceiptNotices(notices);
    setFormKey((key) => key + 1);
  }

  async function handleSubmit(values: TransactionFormValues) {
    if (!settings || !values.categoryId) {
      return;
    }
    // rate_used is frozen and never recalculated (SPEC.md 3.3), so it must be
    // the rate of the transaction's own date: today's rate for today, the
    // published rate of that day for a back-dated entry. Never a placeholder.
    const occurredAtIso = formatISODate(values.occurredAt);
    const rate = await chooseRateForSave({
      occurredAtIso,
      todayIso: formatISODate(new Date()),
      displayCurrency: settings.display_currency,
      homeCurrency: settings.home_currency,
      currentRate: settings.last_rate,
    });
    if (rate === null) {
      return;
    }
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
      occurred_at: occurredAtIso,
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
      {receiptNotices && settings && (
        <ReceiptReviewBanner notices={receiptNotices} displayCurrency={settings.display_currency} />
      )}
      <TransactionForm key={formKey} initialValues={formValues} submitLabel="Save" onSubmit={handleSubmit} />
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
