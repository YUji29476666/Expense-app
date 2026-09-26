import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { useSettings } from '@/context/settings-context';
import type { SupportedCurrency } from '@/constants/currencies';
import { Spacing } from '@/constants/theme';
import type { AllowanceBand } from '@/domain/allowance';
import { convertMinor, formatDualCurrency, formatMinor } from '@/domain/money';

const BAND_COLOR_KEY = {
  good: 'allowanceGood',
  warning: 'allowanceWarning',
  over: 'allowanceOver',
} as const;

export function AllowanceCard({
  todayAllowanceMinor,
  remainingBudgetMinor,
  band,
  periodLabel,
  displayCurrency,
}: {
  todayAllowanceMinor: number;
  remainingBudgetMinor: number;
  band: AllowanceBand;
  periodLabel: string;
  displayCurrency: SupportedCurrency;
}) {
  const { settings } = useSettings();

  function formatAmount(amountMinor: number): string {
    if (settings?.last_rate) {
      const homeMinor = convertMinor(amountMinor, displayCurrency, settings.home_currency, settings.last_rate);
      return formatDualCurrency(amountMinor, displayCurrency, homeMinor, settings.home_currency);
    }
    return formatMinor(amountMinor, displayCurrency);
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        Today you can spend
      </ThemedText>
      <ThemedText type="title" themeColor={BAND_COLOR_KEY[band]} style={styles.amount}>
        {formatAmount(todayAllowanceMinor)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Budget left this period: {formatAmount(remainingBudgetMinor)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {periodLabel}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.one,
  },
  amount: {
    fontSize: 36,
    lineHeight: 42,
    textAlign: 'center',
  },
});
