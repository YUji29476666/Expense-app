import { Alert } from 'react-native';

import type { SupportedCurrency } from '@/constants/currencies';
import { resolveRateForDate } from './rate-for-date';

function confirmAsync(title: string, message: string, confirmLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

// The rate to freeze into rate_used for a transaction on `occurredAtIso`, or
// null if the save should stop. rate_used can never be corrected later
// (SPEC.md 3.3), so a past date never silently falls back to today's rate:
// the user must agree to it explicitly.
export async function chooseRateForSave(params: {
  occurredAtIso: string;
  todayIso: string;
  displayCurrency: SupportedCurrency;
  homeCurrency: SupportedCurrency;
  currentRate: number | null;
}): Promise<number | null> {
  const resolved = await resolveRateForDate(params);
  if (resolved.ok) {
    return resolved.rate;
  }

  if (resolved.reason === 'no_current_rate' || resolved.currentRate === null) {
    Alert.alert(
      'Exchange rate not available',
      resolved.reason === 'no_current_rate'
        ? 'Fetch the latest exchange rate in Settings first. Each transaction stores the rate used and never recalculates it, so a placeholder rate cannot be corrected later.'
        : `Could not get the exchange rate for ${params.occurredAtIso}, and no current rate is set. Check your connection and try again.`
    );
    return null;
  }

  const useCurrent = await confirmAsync(
    'Rate for this date unavailable',
    `Could not get the exchange rate for ${params.occurredAtIso} (offline?). Save with the current rate, 1 ${params.displayCurrency} = ${resolved.currentRate} ${params.homeCurrency}? The rate cannot be changed after saving.`,
    'Use current rate'
  );
  return useCurrent ? resolved.currentRate : null;
}
