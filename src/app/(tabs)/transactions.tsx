import { useLocalSearchParams } from 'expo-router';
import { isToday, isYesterday } from 'date-fns';
import { useMemo, useState } from 'react';
import { Platform, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TransactionRow } from '@/components/transaction-row';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import type { TransactionRow as TransactionRowData } from '@/db/types';
import { formatPeriodShortLabel } from '@/domain/month-period';
import { useCategories } from '@/hooks/use-categories';
import { useTheme } from '@/hooks/use-theme';
import { useTransactionsList } from '@/hooks/use-transactions-list';

type Section = { title: string; data: TransactionRowData[] };

function sectionTitleForDate(occurredAt: string): string {
  const date = new Date(`${occurredAt}T00:00:00`);
  if (isToday(date)) {
    return 'Today';
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return formatPeriodShortLabel({ start: date, end: date });
}

function groupByDate(transactions: TransactionRowData[]): Section[] {
  const sections: Section[] = [];
  for (const transaction of transactions) {
    const title = sectionTitleForDate(transaction.occurred_at);
    const lastSection = sections[sections.length - 1];
    if (lastSection && lastSection.title === title) {
      lastSection.data.push(transaction);
    } else {
      sections.push({ title, data: [transaction] });
    }
  }
  return sections;
}

export default function HistoryScreen() {
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const { categories } = useCategories();

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(params.categoryId ?? null);

  const { transactions } = useTransactionsList({ query, categoryId });
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const sections = useMemo(() => groupByDate(transactions), [transactions]);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: safeAreaInsets.top + Spacing.three }]}>
        <ThemedText type="subtitle">History</ThemedText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search merchant or note"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />

        <View style={styles.filterRow}>
          <Chip label="All" selected={categoryId === null} onPress={() => setCategoryId(null)} />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon} ${category.name}`}
              selected={categoryId === category.id}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four },
        ]}
        renderSectionHeader={({ section }) => (
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {section.title}
            </ThemedText>
          </ThemedView>
        )}
        renderItem={({ item }) => {
          const category = categoryById.get(item.category_id);
          return (
            <TransactionRow
              transaction={item}
              categoryName={category?.name ?? 'Unknown'}
              categoryIcon={category?.icon ?? '🔖'}
            />
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <ThemedText type="small" themeColor="textSecondary">
              No transactions found.
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
    width: '100%',
  },
  searchInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
    width: '100%',
  },
  sectionHeader: {
    paddingVertical: Spacing.two,
  },
  empty: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
});
