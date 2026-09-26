import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import type { ReceiptNotice } from '@/domain/receipt-prefill';
import { formatMinor } from '@/domain/money';

function noticeText(notice: ReceiptNotice, displayCurrency: string): string {
  switch (notice.kind) {
    case 'amount_missing':
      return 'No total was found. Enter the amount.';
    case 'date_missing':
      return 'No date was found, so today is used.';
    case 'category_missing':
      return 'Pick a category.';
    case 'currency_assumed':
      return `No currency was shown, so ${notice.currency} is assumed.`;
    case 'currency_converted':
      return `The receipt is in ${notice.from} (${formatMinor(notice.originalAmountMinor, notice.from)}). It was converted at 1 ${displayCurrency} = ${notice.rate} ${notice.from}.`;
    case 'currency_not_converted':
      return `The receipt is in ${notice.from} (${formatMinor(notice.originalAmountMinor, notice.from)}) and no exchange rate is set. Enter the ${displayCurrency} amount.`;
  }
}

// Shown above a form prefilled from an image: nothing is saved until the
// user presses Save (CLAUDE.md: AI results are always confirmed first).
export function ReceiptReviewBanner({ notices, displayCurrency }: { notices: ReceiptNotice[]; displayCurrency: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.banner}>
      <ThemedText type="smallBold">Filled from image — check each field, then save.</ThemedText>
      {notices.map((notice) => (
        <ThemedText key={notice.kind} type="small" themeColor="allowanceWarning">
          • {noticeText(notice, displayCurrency)}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
