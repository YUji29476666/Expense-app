import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import type { SupportedCurrency } from '@/constants/currencies';
import { Spacing } from '@/constants/theme';
import type { CategoryRow } from '@/db/types';
import { compareSpendToBenchmark, getBenchmarkAmountMinor, type BenchmarkRegion } from '@/domain/benchmarks';
import type { CategoryBreakdownEntry } from '@/hooks/use-analytics';

type ComparisonRow = {
  category: CategoryRow;
  direction: 'above' | 'below' | 'equal';
  percentDiff: number;
};

export function BenchmarkComparison({
  region,
  breakdown,
  categories,
  displayCurrency,
}: {
  region: BenchmarkRegion | null;
  breakdown: CategoryBreakdownEntry[];
  categories: CategoryRow[];
  displayCurrency: SupportedCurrency;
}) {
  // The benchmark's currency must match what the user is spending in — we
  // never convert here, since that would introduce a rate not covered by
  // the spec (SPEC.md 3.5: never show a guessed comparison).
  if (!region || region.currency !== displayCurrency) {
    return null;
  }

  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const rows: ComparisonRow[] = [];
  for (const entry of breakdown) {
    const category = categoryById.get(entry.categoryId);
    if (!category) {
      continue;
    }
    const benchmarkMinor = getBenchmarkAmountMinor(region, category.name);
    const comparison = compareSpendToBenchmark(entry.totalMinor, benchmarkMinor);
    if (comparison) {
      rows.push({ category, direction: comparison.direction, percentDiff: comparison.percentDiff });
    }
  }

  if (rows.length === 0) {
    return null;
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <ThemedText type="smallBold">Compared to {region.label}</ThemedText>
      {rows.map((row) => (
        <ThemedText key={row.category.id} type="small" themeColor="textSecondary">
          {row.category.name}:{' '}
          {row.direction === 'equal'
            ? "about the same as this survey's average"
            : `${row.percentDiff}% ${row.direction === 'above' ? 'higher than' : 'lower than'} this survey's average`}
        </ThemedText>
      ))}
      <ThemedText type="small" themeColor="textSecondary" style={styles.source}>
        Source: {region.source}, {region.surveyYear}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  source: {
    marginTop: Spacing.two,
    fontStyle: 'italic',
  },
});
