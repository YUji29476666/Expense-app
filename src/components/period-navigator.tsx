import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { formatPeriodLabel, type BudgetPeriod } from '@/domain/month-period';

function relativeLabel(offset: number): string {
  if (offset === 0) {
    return 'This period';
  }
  return offset === 1 ? 'Last period' : `${offset} periods ago`;
}

// ‹ Aug 25 – Sep 24 › — steps through budget periods (never calendar months).
export function PeriodNavigator({
  period,
  offset,
  maxOffset,
  onChange,
}: {
  period: BudgetPeriod;
  offset: number;
  maxOffset: number;
  onChange: (offset: number) => void;
}) {
  const canGoBack = offset < maxOffset;
  const canGoForward = offset > 0;
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(offset + 1)}
        disabled={!canGoBack}
        hitSlop={12}
        accessibilityLabel="Previous period">
        <ThemedText type="subtitle" style={!canGoBack && styles.disabled}>
          ‹
        </ThemedText>
      </Pressable>
      <Pressable style={styles.center} onPress={() => onChange(0)} disabled={offset === 0}>
        <ThemedText type="smallBold">{formatPeriodLabel(period)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {offset === 0 ? relativeLabel(0) : `${relativeLabel(offset)} · tap for this period`}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => onChange(offset - 1)}
        disabled={!canGoForward}
        hitSlop={12}
        accessibilityLabel="Next period">
        <ThemedText type="subtitle" style={!canGoForward && styles.disabled}>
          ›
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.25,
  },
});
