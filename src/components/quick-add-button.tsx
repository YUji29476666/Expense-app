import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export function QuickAddButton() {
  return (
    <Pressable onPress={() => router.push('/transaction/new')} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundSelected" style={styles.button}>
        <ThemedText type="smallBold">+ Add transaction</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
