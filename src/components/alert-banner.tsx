import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function AlertBanner({ messages }: { messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {messages.map((message) => (
        <ThemedView key={message} type="backgroundElement" style={styles.card}>
          <ThemedText type="small">{message}</ThemedText>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
});
