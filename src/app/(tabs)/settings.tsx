import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import benchmarksData from '@/assets/benchmarks.json';
import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { CURRENCY_EXPONENTS } from '@/constants/currencies';
import { useSettings } from '@/context/settings-context';
import type { BenchmarksData } from '@/domain/benchmarks';
import { toMajorUnits, toMinorUnits } from '@/domain/money';
import { fetchLatestRate } from '@/lib/fx';

const CURRENCY_CODES = Object.keys(CURRENCY_EXPONENTS);
const MONTH_START_DAY_MIN = 1;
const MONTH_START_DAY_MAX = 28;
const benchmarks = benchmarksData as BenchmarksData;

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { settings, updateSettings } = useSettings();
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [manualRateText, setManualRateText] = useState('');
  const [budgetText, setBudgetText] = useState('');

  if (!settings) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </ThemedView>
    );
  }

  const budgetPlaceholder = String(toMajorUnits(settings.monthly_budget_minor, settings.display_currency));

  async function handleSaveBudget() {
    const parsed = parseFloat(budgetText);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return;
    }
    await updateSettings({ monthly_budget_minor: toMinorUnits(parsed, settings!.display_currency) });
    setBudgetText('');
  }

  async function handleFetchRate() {
    setIsFetchingRate(true);
    try {
      const result = await fetchLatestRate(settings!.display_currency, settings!.home_currency, {
        lastRate: settings!.last_rate,
        lastRateAt: settings!.last_rate_at,
      });
      await updateSettings({ last_rate: result.rate, last_rate_at: result.asOf });
      if (result.source === 'cached') {
        Alert.alert('Using last known rate', 'Could not reach frankfurter.app, so the previously fetched rate was kept.');
      }
    } catch (error) {
      Alert.alert('Could not fetch rate', error instanceof Error ? error.message : 'Unknown error.');
    } finally {
      setIsFetchingRate(false);
    }
  }

  async function handleSaveManualRate() {
    const parsed = parseFloat(manualRateText);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }
    await updateSettings({ last_rate: parsed, last_rate_at: new Date().toISOString() });
    setManualRateText('');
  }

  function adjustMonthStartDay(delta: number) {
    const next = Math.min(MONTH_START_DAY_MAX, Math.max(MONTH_START_DAY_MIN, settings!.month_start_day + delta));
    updateSettings({ month_start_day: next });
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: safeAreaInsets.top + Spacing.four, paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four },
      ]}>
      <ThemedText type="subtitle">Settings</ThemedText>

      <Section title="Display currency (local)">
        <View style={styles.chipRow}>
          {CURRENCY_CODES.map((code) => (
            <Chip
              key={code}
              label={code}
              selected={settings.display_currency === code}
              onPress={() => updateSettings({ display_currency: code })}
            />
          ))}
        </View>
      </Section>

      <Section title="Home currency">
        <View style={styles.chipRow}>
          {CURRENCY_CODES.map((code) => (
            <Chip
              key={code}
              label={code}
              selected={settings.home_currency === code}
              onPress={() => updateSettings({ home_currency: code })}
            />
          ))}
        </View>
      </Section>

      <Section title="Exchange rate">
        <ThemedText type="small" themeColor="textSecondary">
          1 {settings.display_currency} ={' '}
          {settings.last_rate !== null ? `${settings.last_rate} ${settings.home_currency}` : 'not set'}
          {settings.last_rate_at ? ` · updated ${new Date(settings.last_rate_at).toLocaleDateString()}` : ''}
        </ThemedText>
        <Pressable onPress={handleFetchRate} disabled={isFetchingRate}>
          <ThemedView type="backgroundSelected" style={styles.button}>
            <ThemedText type="smallBold">{isFetchingRate ? 'Fetching…' : 'Fetch latest rate'}</ThemedText>
          </ThemedView>
        </Pressable>
        <View style={styles.inlineRow}>
          <TextInput
            style={styles.inlineInput}
            keyboardType="decimal-pad"
            placeholder="Enter rate manually"
            value={manualRateText}
            onChangeText={setManualRateText}
          />
          <Pressable onPress={handleSaveManualRate}>
            <ThemedText type="smallBold">Set</ThemedText>
          </Pressable>
        </View>
      </Section>

      <Section title="Monthly budget">
        <View style={styles.inlineRow}>
          <TextInput
            style={styles.inlineInput}
            keyboardType="decimal-pad"
            placeholder={budgetPlaceholder}
            value={budgetText}
            onChangeText={setBudgetText}
          />
          <Pressable onPress={handleSaveBudget}>
            <ThemedText type="smallBold">Save</ThemedText>
          </Pressable>
        </View>
      </Section>

      <Section title="Month starts on day">
        <View style={styles.inlineRow}>
          <Pressable onPress={() => adjustMonthStartDay(-1)} hitSlop={8}>
            <ThemedText type="title" style={styles.stepper}>
              –
            </ThemedText>
          </Pressable>
          <ThemedText type="default" style={styles.stepperValue}>
            {settings.month_start_day}
          </ThemedText>
          <Pressable onPress={() => adjustMonthStartDay(1)} hitSlop={8}>
            <ThemedText type="title" style={styles.stepper}>
              +
            </ThemedText>
          </Pressable>
        </View>
      </Section>

      <Section title="Region (for benchmark comparison)">
        {benchmarks.regions.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No benchmark data is available yet.
          </ThemedText>
        ) : (
          <View style={styles.chipRow}>
            <Chip label="None" selected={!settings.region_code} onPress={() => updateSettings({ region_code: null })} />
            {benchmarks.regions.map((region) => (
              <Chip
                key={region.code}
                label={region.label}
                selected={settings.region_code === region.code}
                onPress={() => updateSettings({ region_code: region.code })}
              />
            ))}
          </View>
        )}
      </Section>

      <Pressable onPress={() => router.push('/category/index')}>
        <ThemedView type="backgroundElement" style={styles.button}>
          <ThemedText type="smallBold">Manage categories</ThemedText>
        </ThemedView>
      </Pressable>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
    maxWidth: MaxContentWidth,
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
    width: '100%',
  },
  section: {
    gap: Spacing.two,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  inlineInput: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
    fontSize: 16,
  },
  stepper: {
    fontSize: 28,
    lineHeight: 32,
    paddingHorizontal: Spacing.three,
  },
  stepperValue: {
    minWidth: 32,
    textAlign: 'center',
  },
});
