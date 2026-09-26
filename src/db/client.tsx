import { SQLiteProvider } from 'expo-sqlite';
import type { PropsWithChildren } from 'react';

import { migrateDbIfNeeded } from './migrations';

export { useSQLiteContext } from 'expo-sqlite';

const DATABASE_NAME = 'myapp.db';

export function DatabaseProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      {children}
    </SQLiteProvider>
  );
}
