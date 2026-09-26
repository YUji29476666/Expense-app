import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import type { TransactionRow as TransactionRowData } from '@/db/types';
import { formatMinor } from '@/domain/money';

export function TransactionRow({
  transaction,
  categoryName,
  categoryIcon,
}: {
  transaction: TransactionRowData;
  categoryName: string;
  categoryIcon: string;
}) {
  const sign = transaction.type === 'expense' ? '-' : '+';
  const subtitle = transaction.note ? `${categoryName} · ${transaction.note}` : categoryName;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: transaction.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <ThemedText style={styles.icon}>{categoryIcon}</ThemedText>
      <View style={styles.middle}>
        <ThemedText type="default" numberOfLines={1}>
          {transaction.merchant || categoryName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" themeColor={transaction.type === 'income' ? 'allowanceGood' : 'text'}>
        {sign}
        {formatMinor(transaction.amount_minor, transaction.currency)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 22,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
});
