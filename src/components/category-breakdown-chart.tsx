import { PieChart } from 'react-native-gifted-charts';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import type { CategoryBreakdownEntry } from '@/hooks/use-analytics';
import type { CategoryRow } from '@/db/types';
import { formatMinor, toMajorUnits } from '@/domain/money';

export function CategoryBreakdownChart({
  breakdown,
  categories,
  currency,
  onSelectCategory,
}: {
  breakdown: CategoryBreakdownEntry[];
  categories: CategoryRow[];
  currency: string;
  onSelectCategory: (categoryId: string) => void;
}) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  if (breakdown.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No expenses recorded this period yet.
      </ThemedText>
    );
  }

  const data = breakdown.map((entry) => {
    const category = categoryById.get(entry.categoryId);
    return {
      value: toMajorUnits(entry.totalMinor, currency),
      color: category?.color ?? '#9AA5B1',
      text: category?.name ?? 'Unknown',
    };
  });

  return (
    <View style={styles.container}>
      <PieChart data={data} donut radius={90} innerRadius={55} focusOnPress />
      <View style={styles.legend}>
        {breakdown.map((entry) => {
          const category = categoryById.get(entry.categoryId);
          return (
            <Pressable
              key={entry.categoryId}
              onPress={() => onSelectCategory(entry.categoryId)}
              style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: category?.color ?? '#9AA5B1' }]} />
              <ThemedText type="small" style={styles.legendLabel}>
                {category?.icon ?? '🔖'} {category?.name ?? 'Unknown'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatMinor(entry.totalMinor, currency)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.four,
  },
  legend: {
    width: '100%',
    gap: Spacing.two,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
  },
});
