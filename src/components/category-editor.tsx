import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

export type CategoryEditorValues = {
  name: string;
  icon: string;
  budgetMajorText: string; // empty string means "no category budget"
};

export function CategoryEditor({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues: CategoryEditorValues;
  submitLabel: string;
  onSubmit: (values: CategoryEditorValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialValues.name);
  const [icon, setIcon] = useState(initialValues.icon);
  const [budgetMajorText, setBudgetMajorText] = useState(initialValues.budgetMajorText);
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0 && icon.trim().length > 0 && !isSaving;

  async function handleSave() {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit({ name: name.trim(), icon: icon.trim(), budgetMajorText });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.row}>
        <TextInput style={styles.iconInput} value={icon} onChangeText={setIcon} maxLength={4} />
        <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder="Category name" />
      </View>
      <View style={styles.row}>
        <ThemedText type="small" themeColor="textSecondary">
          Monthly budget (optional)
        </ThemedText>
        <TextInput
          style={styles.budgetInput}
          value={budgetMajorText}
          onChangeText={setBudgetMajorText}
          keyboardType="decimal-pad"
          placeholder="No limit"
        />
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onCancel}>
          <ThemedText type="small" themeColor="textSecondary">
            Cancel
          </ThemedText>
        </Pressable>
        <Pressable onPress={handleSave} disabled={!canSave}>
          <ThemedText type="smallBold" style={!canSave && styles.disabled}>
            {submitLabel}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconInput: {
    fontSize: 20,
    width: 44,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
    fontSize: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.four,
  },
  disabled: {
    opacity: 0.4,
  },
});
