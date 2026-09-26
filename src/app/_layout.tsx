import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DatabaseProvider } from '@/db/client';
import { SettingsProvider } from '@/context/settings-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <DatabaseProvider>
        <SettingsProvider>
          <AnimatedSplashOverlay />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="transaction/new" options={{ presentation: 'modal', title: 'Add Transaction' }} />
            <Stack.Screen name="transaction/[id]" options={{ presentation: 'modal', title: 'Edit Transaction' }} />
          </Stack>
        </SettingsProvider>
      </DatabaseProvider>
    </ThemeProvider>
  );
}
