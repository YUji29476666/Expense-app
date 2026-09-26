// Minimal ambient typing for the subset of Node's built-in `node:sqlite`
// module used by db tests. Deliberately not pulled in via `@types/node`
// (and "node" is not added to tsconfig's `types`) to avoid Node's global
// types (Buffer, process, timers, ...) shadowing React Native's in the rest
// of the app — this declaration is scoped to exactly what the tests use.
declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(location: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: (string | number | null)[]): unknown;
      get(...params: (string | number | null)[]): Record<string, unknown> | undefined;
      all(...params: (string | number | null)[]): Record<string, unknown>[];
    };
    close(): void;
  }
}
