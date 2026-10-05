import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import benchmarksData from '@/assets/benchmarks.json';
import { BenchmarkComparison } from '@/components/benchmark-comparison';
import { CategoryBreakdownChart } from '@/components/category-breakdown-chart';
import { PeriodHistoryList } from '@/components/period-history-list';
import { PeriodNavigator } from '@/components/period-navigator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendChart } from '@/components/trend-chart';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { findBenchmarkRegion, type BenchmarksData } from '@/domain/benchmarks';
import { computeAverageRate, formatMinor } from '@/domain/money';
import { HISTORY_PERIODS, useAnalytics } from '@/hooks/use-analytics';
import { useCategories } from '@/hooks/use-categories';

const benchmarks = benchmarksData as BenchmarksData;
// How far back the ‹ button goes (the list shows the latest HISTORY_PERIODS).
const MAX_PERIOD_OFFSET = 36;

export default function AnalyticsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { settings } = useSettings();
  const { categories } = useCategories({ includeArchived: true });
  // 0 = current budget period; every card below follows this selection.
  const [periodOffset, setPeriodOffset] = useState(0);
  const analytics = useAnalytics(periodOffset);

  if (!settings || analytics.isLoading) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </ThemedView>
    );
  }

  const region = settings.region_code ? findBenchmarkRegion(benchmarks, settings.region_code) : null;
  const netMinor = analytics.incomeMinor - analytics.expenseMinor;
  const netHomeMinor = analytics.incomeHomeMinor - analytics.expenseHomeMinor;
  const averageRate = computeAverageRate(
    analytics.totals.amountMinor,
    settings.display_currency,
    analytics.totals.homeMinor,
    settings.home_currency
  );
  const averageRateText =
    averageRate !== null ? formatRate(averageRate, settings.display_currency, settings.home_currency) : '—';
  const currentRateText =
    settings.last_rate !== null
      ? formatRate(settings.last_rate, settings.display_currency, settings.home_currency)
      : 'not set';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: safeAreaInsets.top + Spacing.four,
          paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
        },
      ]}>
      <ThemedText type="subtitle">Analytics</ThemedText>
      <PeriodNavigator
        period={analytics.selectedPeriod}
        offset={periodOffset}
        maxOffset={MAX_PERIOD_OFFSET}
        onChange={setPeriodOffset}
      />

      <ThemedView type="backgroundElement" style={styles.netCard}>
        <ThemedText type="small" themeColor="textSecondary">
          Income vs. expense
        </ThemedText>
        <ThemedText type="title" themeColor={netMinor >= 0 ? 'allowanceGood' : 'allowanceOver'} style={styles.netAmount}>
          {netMinor >= 0 ? '+' : ''}
          {formatMinor(netMinor, settings.display_currency)}
        </ThemedText>
        <View style={styles.netBreakdown}>
          <ThemedText type="small" themeColor="textSecondary">
            Income {formatMinor(analytics.incomeMinor, settings.display_currency)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Expense {formatMinor(analytics.expenseMinor, settings.display_currency)}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.netCard}>
        <ThemedText type="small" themeColor="textSecondary">
          In {settings.home_currency}
        </ThemedText>
        <ThemedText
          type="title"
          themeColor={netHomeMinor >= 0 ? 'allowanceGood' : 'allowanceOver'}
          style={styles.netAmount}>
          {netHomeMinor >= 0 ? '+' : ''}
          {formatMinor(netHomeMinor, settings.home_currency)}
        </ThemedText>
        <View style={styles.netBreakdown}>
          <ThemedText type="small" themeColor="textSecondary">
            Income {formatMinor(analytics.incomeHomeMinor, settings.home_currency)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Expense {formatMinor(analytics.expenseHomeMinor, settings.home_currency)}
          </ThemedText>
        </View>
        <View style={styles.rateLines}>
          <ThemedText type="small" themeColor="textSecondary">
            Avg. rate used: {averageRateText}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Current rate: {currentRateText}
            {settings.last_rate_at ? ` · updated ${new Date(settings.last_rate_at).toLocaleDateString()}` : ''}
          </ThemedText>
        </View>
      </ThemedView>

      <View style={styles.section}>
        <ThemedText type="smallBold">Breakdown by category</ThemedText>
        <CategoryBreakdownChart
          breakdown={analytics.breakdown}
          categories={categories}
          currency={settings.display_currency}
          onSelectCategory={(categoryId) => router.push({ pathname: '/(tabs)/transactions', params: { categoryId } })}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Expense trend (6 periods up to the selected one)</ThemedText>
        <TrendChart trend={analytics.trend} currency={settings.display_currency} />
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">Past periods (last {HISTORY_PERIODS})</ThemedText>
        <PeriodHistoryList
          history={analytics.history}
          selectedOffset={periodOffset}
          currency={settings.display_currency}
          onSelect={setPeriodOffset}
        />
      </View>

      <BenchmarkComparison
        region={region}
        breakdown={analytics.breakdown}
        categories={categories}
        displayCurrency={settings.display_currency}
      />
    </ScrollView>
  );
}

// Each transaction's home amount uses the rate it was recorded at, so the
// average rate is shown next to the current one to explain the totals.
function formatRate(rate: number, from: string, to: string): string {
  return `1 ${from} = ${rate.toFixed(2)} ${to}`;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
    width: '100%',
  },
  netCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  netAmount: {
    fontSize: 32,
    lineHeight: 38,
  },
  netBreakdown: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  rateLines: {
    marginTop: Spacing.two,
    gap: Spacing.half,
  },
});
