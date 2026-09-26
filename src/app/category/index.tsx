import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CategoryEditor, type CategoryEditorValues } from '@/components/category-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { useSQLiteContext } from '@/db/client';
import {
  archiveCategory,
  deleteCategory,
  getMaxSortOrder,
  insertCategory,
  updateCategory,
} from '@/db/queries/categories';
import { categoryHasTransactions } from '@/db/queries/transactions';
import type { CategoryRow } from '@/db/types';
import { formatMinor, toMajorUnits, toMinorUnits } from '@/domain/money';
import { useCategories } from '@/hooks/use-categories';

export default function CategoryManagementScreen() {
  const db = useSQLiteContext();
  const { settings } = useSettings();
  const { categories, refresh } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const displayCurrency = settings?.display_currency ?? 'USD';

  async function handleAdd(values: CategoryEditorValues) {
    const maxSortOrder = await getMaxSortOrder(db);
    const budgetMinor = values.budgetMajorText.trim()
      ? toMinorUnits(parseFloat(values.budgetMajorText), displayCurrency)
      : null;
    await insertCategory(db, {
      id: Crypto.randomUUID(),
      name: values.name,
      icon: values.icon,
      color: '#9AA5B1',
      budget_minor: budgetMinor,
      sort_order: maxSortOrder + 1,
      is_archived: 0,
    });
    setIsAdding(false);
    await refresh();
  }

  async function handleEdit(category: CategoryRow, values: CategoryEditorValues) {
    const budgetMinor = values.budgetMajorText.trim()
      ? toMinorUnits(parseFloat(values.budgetMajorText), displayCurrency)
      : null;
    await updateCategory(db, category.id, {
      name: values.name,
      icon: values.icon,
      budget_minor: budgetMinor,
    });
    setEditingId(null);
    await refresh();
  }

  async function handleDelete(category: CategoryRow) {
    const hasTransactions = await categoryHasTransactions(db, category.id);
    if (hasTransactions) {
      Alert.alert(
        'Category in use',
        `"${category.name}" has existing transactions, so it can't be deleted. Archive it instead to hide it from new entries?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Archive',
            onPress: async () => {
              await archiveCategory(db, category.id);
              await refresh();
            },
          },
        ]
      );
      return;
    }
    Alert.alert('Delete category?', `"${category.name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCategory(db, category.id);
          await refresh();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ThemedText type="subtitle">Categories</ThemedText>

      {categories.map((category) =>
        editingId === category.id ? (
          <CategoryEditor
            key={category.id}
            initialValues={{
              name: category.name,
              icon: category.icon,
              budgetMajorText:
                category.budget_minor !== null ? String(toMajorUnits(category.budget_minor, displayCurrency)) : '',
            }}
            submitLabel="Save"
            onSubmit={(values) => handleEdit(category, values)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <Pressable key={category.id} onPress={() => setEditingId(category.id)}>
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText style={styles.icon}>{category.icon}</ThemedText>
              <View style={styles.middle}>
                <ThemedText type="default">{category.name}</ThemedText>
                {category.budget_minor !== null && (
                  <ThemedText type="small" themeColor="textSecondary">
                    Budget: {formatMinor(category.budget_minor, displayCurrency)}/mo
                  </ThemedText>
                )}
              </View>
              <Pressable onPress={() => handleDelete(category)} hitSlop={8}>
                <ThemedText type="small" themeColor="allowanceOver">
                  Delete
                </ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        )
      )}

      {isAdding ? (
        <CategoryEditor
          initialValues={{ name: '', icon: '🔖', budgetMajorText: '' }}
          submitLabel="Add"
          onSubmit={handleAdd}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <Pressable onPress={() => setIsAdding(true)}>
          <ThemedView type="backgroundSelected" style={styles.addButton}>
            <ThemedText type="smallBold">+ Add category</ThemedText>
          </ThemedView>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  icon: {
    fontSize: 22,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  addButton: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
