import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import type { SupportedCurrency } from '@/constants/currencies';
import { Spacing } from '@/constants/theme';
import { formatPeriodLabel } from '@/domain/month-period';
import { formatMinor } from '@/domain/money';
import type { PeriodSummary } from '@/hooks/use-analytics';

// Income / expense / net for recent budget periods. Tapping a row selects
// that period for the rest of the Analytics screen.
export function PeriodHistoryList({
  history,
  selectedOffset,
  currency,
  onSelect,
}: {
  history: PeriodSummary[];
  selectedOffset: number;
  currency: SupportedCurrency;
  onSelect: (offset: number) => void;
}) {
  // Periods before the first record are all zero; keep the list to periods
  // with activity, plus the current and selected ones.
  const rows = history.filter(
    (row) => row.incomeMinor !== 0 || row.expenseMinor !== 0 || row.offset === 0 || row.offset === selectedOffset
  );

  return (
    <View style={styles.list}>
      {rows.map((row) => {
        const netMinor = row.incomeMinor - row.expenseMinor;
        const selected = row.offset === selectedOffset;
        return (
          <Pressable key={row.offset} onPress={() => onSelect(row.offset)}>
            <ThemedView type={selected ? 'backgroundSelected' : 'backgroundElement'} style={styles.row}>
              <View style={styles.header}>
                <ThemedText type="smallBold">{formatPeriodLabel(row.period)}</ThemedText>
                <ThemedText type="smallBold" themeColor={netMinor >= 0 ? 'allowanceGood' : 'allowanceOver'}>
                  {netMinor >= 0 ? '+' : ''}
                  {formatMinor(netMinor, currency)}
                </ThemedText>
              </View>
              <View style={styles.header}>
                <ThemedText type="small" themeColor="textSecondary">
                  Income {formatMinor(row.incomeMinor, currency)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Expense {formatMinor(row.expenseMinor, currency)}
                </ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
