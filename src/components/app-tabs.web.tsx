import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet, useWindowDimensions } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs style={styles.root}>
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/index" asChild>
            <TabButton>Today</TabButton>
          </TabTrigger>
          <TabTrigger name="transactions" href="/transactions" asChild>
            <TabButton>History</TabButton>
          </TabTrigger>
          <TabTrigger name="analytics" href="/analytics" asChild>
            <TabButton>Analytics</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
      <TabSlot style={styles.slot} />
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

// Below this width the brand label is dropped so the four tabs fit on a phone.
const SHOW_BRAND_MIN_WIDTH = 520;

export function CustomTabList(props: TabListProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < SHOW_BRAND_MIN_WIDTH;

  return (
    <View {...props} style={[styles.tabListContainer, isNarrow && styles.tabListContainerNarrow]}>
      <ThemedView type="backgroundElement" style={[styles.innerContainer, isNarrow && styles.innerContainerNarrow]}>
        {!isNarrow && (
          <ThemedText type="smallBold" style={styles.brandText}>
            myapp
          </ThemedText>
        )}

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  // The tab bar sits above the screen in normal flow (not overlaid), so
  // screen titles are never hidden underneath it.
  root: {
    flex: 1,
    height: '100%',
  },
  slot: {
    flex: 1,
  },
  tabListContainer: {
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  tabListContainerNarrow: {
    padding: Spacing.two,
  },
  innerContainerNarrow: {
    paddingHorizontal: Spacing.two,
    justifyContent: 'space-between',
    gap: 0,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
