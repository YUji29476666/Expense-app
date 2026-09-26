import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CategoryPicker } from './category-picker';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { isCategoryForType } from '@/constants/categories';
import { Spacing } from '@/constants/theme';
import { useSQLiteContext } from '@/db/client';
import { getMostFrequentCategoryForMerchant } from '@/db/queries/transactions';
import type { TransactionType } from '@/db/types';
import { useMruCategories } from '@/hooks/use-mru-categories';

export type TransactionFormValues = {
  type: TransactionType;
  amountMajorText: string;
  categoryId: string | null;
  merchant: string;
  note: string;
  occurredAt: Date;
};

export function TransactionForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  initialValues: TransactionFormValues;
  submitLabel: string;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onDelete?: () => void;
}) {
  const db = useSQLiteContext();
  const mruCategories = useMruCategories();
  const amountInputRef = useRef<TextInput>(null);

  const [type, setType] = useState<TransactionType>(initialValues.type);
  const [amountMajorText, setAmountMajorText] = useState(initialValues.amountMajorText);
  const [categoryId, setCategoryId] = useState<string | null>(initialValues.categoryId);
  const [merchant, setMerchant] = useState(initialValues.merchant);
  const [note, setNote] = useState(initialValues.note);
  const [occurredAt, setOccurredAt] = useState(initialValues.occurredAt);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categoryManuallySet, setCategoryManuallySet] = useState(initialValues.categoryId !== null);
  const [isSaving, setIsSaving] = useState(false);

  // Income shows Scholarship / Part-time job / Internship (+ Other);
  // expenses hide those income sources.
  const categories = mruCategories.filter((category) => isCategoryForType(category.id, type));

  function handleSelectType(nextType: TransactionType) {
    setType(nextType);
    if (categoryId !== null && !isCategoryForType(categoryId, nextType)) {
      setCategoryId(null);
      setCategoryManuallySet(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => amountInputRef.current?.focus(), 50);
    return () => clearTimeout(timeout);
  }, []);

  async function handleMerchantBlur() {
    if (categoryManuallySet || !merchant.trim()) {
      return;
    }
    const suggestion = await getMostFrequentCategoryForMerchant(db, merchant);
    if (suggestion && isCategoryForType(suggestion, type)) {
      setCategoryId(suggestion);
    }
  }

  function handleSelectCategory(id: string) {
    setCategoryId(id);
    setCategoryManuallySet(true);
  }

  const parsedAmount = parseFloat(amountMajorText);
  const canSave = categoryId !== null && Number.isFinite(parsedAmount) && parsedAmount > 0 && !isSaving;

  async function handleSave() {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({ type, amountMajorText, categoryId, merchant, note, occurredAt });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.typeToggle}>
        <Pressable style={styles.typeButtonWrapper} onPress={() => handleSelectType('expense')}>
          <ThemedView type={type === 'expense' ? 'backgroundSelected' : 'backgroundElement'} style={styles.typeButton}>
            <ThemedText type="smallBold">Expense</ThemedText>
          </ThemedView>
        </Pressable>
        <Pressable style={styles.typeButtonWrapper} onPress={() => handleSelectType('income')}>
          <ThemedView type={type === 'income' ? 'backgroundSelected' : 'backgroundElement'} style={styles.typeButton}>
            <ThemedText type="smallBold">Income</ThemedText>
          </ThemedView>
        </Pressable>
      </View>

      <TextInput
        ref={amountInputRef}
        style={styles.amountInput}
        keyboardType="decimal-pad"
        placeholder="0.00"
        autoFocus
        value={amountMajorText}
        onChangeText={setAmountMajorText}
      />

      <View style={styles.field}>
        <ThemedText type="smallBold">Category</ThemedText>
        <CategoryPicker categories={categories} selectedCategoryId={categoryId} onSelect={handleSelectCategory} />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Merchant</ThemedText>
        <TextInput
          style={styles.textInput}
          value={merchant}
          onChangeText={setMerchant}
          onBlur={handleMerchantBlur}
          placeholder="e.g. Trader Joe's"
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Note</ThemedText>
        <TextInput style={styles.textInput} value={note} onChangeText={setNote} placeholder="Optional" />
      </View>

      <View style={styles.field}>
        <ThemedText type="smallBold">Date</ThemedText>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <ThemedView type="backgroundElement" style={styles.dateButton}>
            <ThemedText>{format(occurredAt, 'MMM d, yyyy')}</ThemedText>
          </ThemedView>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={occurredAt}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onValueChange={(_event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              setOccurredAt(date);
            }}
          />
        )}
      </View>

      <Pressable onPress={handleSave} disabled={!canSave}>
        <ThemedView type="backgroundSelected" style={[styles.saveButton, !canSave && styles.disabled]}>
          <ThemedText type="smallBold">{submitLabel}</ThemedText>
        </ThemedView>
      </Pressable>

      {onDelete && (
        <Pressable onPress={onDelete}>
          <ThemedText type="small" themeColor="allowanceOver" style={styles.deleteText}>
            Delete transaction
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  typeButtonWrapper: {
    flex: 1,
  },
  typeButton: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  textInput: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  dateButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignSelf: 'flex-start',
  },
  saveButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  deleteText: {
    textAlign: 'center',
  },
});
