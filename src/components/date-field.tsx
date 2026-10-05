import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

// Native date field. The web build uses date-field.web.tsx, because
// @react-native-community/datetimepicker has no web implementation.
export function DateField({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <Pressable onPress={() => setShowPicker(true)}>
        <ThemedView type="backgroundElement" style={styles.dateButton}>
          <ThemedText>{format(value, 'MMM d, yyyy')}</ThemedText>
        </ThemedView>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={(_event, date) => {
            setShowPicker(Platform.OS === 'ios');
            onChange(date);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignSelf: 'flex-start',
  },
});
