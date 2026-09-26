import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { useSettings } from '@/context/settings-context';
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
  band,
  periodLabel,
  displayCurrency,
}: {
  todayAllowanceMinor: number;
  band: AllowanceBand;
  periodLabel: string;
  displayCurrency: string;
}) {
  const { settings } = useSettings();

  const amountText = (() => {
    if (settings?.last_rate) {
      const homeMinor = convertMinor(todayAllowanceMinor, displayCurrency, settings.home_currency, settings.last_rate);
      return formatDualCurrency(todayAllowanceMinor, displayCurrency, homeMinor, settings.home_currency);
    }
    return formatMinor(todayAllowanceMinor, displayCurrency);
  })();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="small" themeColor="textSecondary">
        Today you can spend
      </ThemedText>
      <ThemedText type="title" themeColor={BAND_COLOR_KEY[band]} style={styles.amount}>
        {amountText}
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
