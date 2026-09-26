import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import type { CategoryRow } from '@/db/types';

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelect,
}: {
  categories: CategoryRow[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => {
        const selected = category.id === selectedCategoryId;
        return (
          <Pressable key={category.id} onPress={() => onSelect(category.id)}>
            <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
              <ThemedText style={styles.icon}>{category.icon}</ThemedText>
              <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                {category.name}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  icon: {
    fontSize: 16,
  },
});
