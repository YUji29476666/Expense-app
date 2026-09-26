import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { useSQLiteContext } from '@/db/client';
import { getSettings, updateSettings as updateSettingsQuery } from '@/db/queries/settings';
import type { SettingsRow } from '@/db/types';

type SettingsContextValue = {
  settings: SettingsRow | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (patch: Partial<Omit<SettingsRow, 'id'>>) => Promise<void>;
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
    async (patch: Partial<Omit<SettingsRow, 'id'>>) => {
      await updateSettingsQuery(db, patch);
      await refreshSettings();
    },
    [db, refreshSettings]
  );

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
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
