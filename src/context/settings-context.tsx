import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import type { CurrencyPair } from '@/constants/currencies';
import { useSQLiteContext } from '@/db/client';
import {
  getSettings,
  updateCurrencyPair,
  updateSettings as updateSettingsQuery,
  type CurrencyPairChangeResult,
} from '@/db/queries/settings';
import type { SettingsPatch, SettingsRow } from '@/db/types';
import { fetchLatestRate } from '@/lib/fx';

type SettingsContextValue = {
  settings: SettingsRow | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (patch: SettingsPatch) => Promise<void>;
  changeCurrencyPair: (pair: CurrencyPair) => Promise<CurrencyPairChangeResult>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [settings, setSettings] = useState<SettingsRow | null>(null);

  const refreshSettings = useCallback(async () => {
    const row = await getSettings(db);
    setSettings(row);
  }, [db]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = useCallback(
    async (patch: SettingsPatch) => {
      await updateSettingsQuery(db, patch);
      await refreshSettings();
    },
    [db, refreshSettings]
  );

  const changeCurrencyPair = useCallback(
    async (pair: CurrencyPair): Promise<CurrencyPairChangeResult> => {
      // Fetch the rate for the new pair. The fallback is deliberately null:
      // on failure the old pair's rate must not be reused, so the rate is
      // left unset and saving transactions stays blocked until one is set.
      let rate: number | null = null;
      let rateAt: string | null = null;
      try {
        const fetched = await fetchLatestRate(pair.display, pair.home, { lastRate: null, lastRateAt: null });
        rate = fetched.rate;
        rateAt = fetched.asOf;
      } catch {
        // Leave the rate unset; Settings shows "not set".
      }

      const result = await updateCurrencyPair(db, {
        displayCurrency: pair.display,
        homeCurrency: pair.home,
        rate,
        rateAt,
      });
      await refreshSettings();
      return result;
    },
    [db, refreshSettings]
  );

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings, changeCurrencyPair }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
