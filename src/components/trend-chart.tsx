import { BarChart } from 'react-native-gifted-charts';
import { StyleSheet, View } from 'react-native';

import type { SupportedCurrency } from '@/constants/currencies';
import { Spacing } from '@/constants/theme';
import { toMajorUnits } from '@/domain/money';
import { useTheme } from '@/hooks/use-theme';
import type { MonthlyTotal } from '@/hooks/use-analytics';

export function TrendChart({ trend, currency }: { trend: MonthlyTotal[]; currency: SupportedCurrency }) {
  const theme = useTheme();

  const data = trend.map((entry) => ({
    value: toMajorUnits(entry.totalMinor, currency),
    label: entry.label,
    frontColor: theme.allowanceGood,
  }));

  return (
    <View style={styles.container}>
      <BarChart
        data={data}
        barWidth={20}
        spacing={20}
        noOfSections={4}
        height={160}
        yAxisThickness={0}
        xAxisThickness={StyleSheet.hairlineWidth}
        xAxisColor={theme.textSecondary}
        yAxisTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.two,
  },
});
