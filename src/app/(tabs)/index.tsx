import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlertBanner } from '@/components/alert-banner';
import { AllowanceCard } from '@/components/allowance-card';
import { QuickAddButton } from '@/components/quick-add-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TodayEntryList } from '@/components/today-entry-list';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useBudgetAlerts } from '@/hooks/use-budget-alerts';
import { useTheme } from '@/hooks/use-theme';
import { useTodaySummary } from '@/hooks/use-today-summary';

export default function TodayScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const summary = useTodaySummary();
  const alerts = useBudgetAlerts();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        {summary.isLoading ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.loading}>
            Loading…
          </ThemedText>
        ) : (
          <>
            <AllowanceCard
              todayAllowanceMinor={summary.todayAllowanceMinor}
              band={summary.band}
              periodLabel={summary.periodLabel}
              displayCurrency={summary.displayCurrency}
            />
            <QuickAddButton />
            <AlertBanner messages={alerts} />
            <ThemedText type="smallBold">Today</ThemedText>
            <TodayEntryList />
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  loading: {
    paddingTop: Spacing.six,
    textAlign: 'center',
  },
});
