import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { TransactionRow } from './transaction-row';

import { Spacing } from '@/constants/theme';
import { useCategories } from '@/hooks/use-categories';
import { useTodayTransactions } from '@/hooks/use-today-transactions';

export function TodayEntryList() {
  const { transactions } = useTodayTransactions();
  const { categories } = useCategories({ includeArchived: true });
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  if (transactions.length === 0) {
    return (
      <View style={styles.empty}>
        <ThemedText type="small" themeColor="textSecondary">
          No transactions yet today.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {transactions.map((transaction) => {
        const category = categoryById.get(transaction.category_id);
        return (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            categoryName={category?.name ?? 'Unknown'}
            categoryIcon={category?.icon ?? '🔖'}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.one,
  },
  empty: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
});
