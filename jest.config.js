module.exports = {
  preset: 'jest-expo',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.ts',
    // Pure logic of the Supabase Edge Functions (no Deno APIs in those files).
    '<rootDir>/supabase/functions/**/__tests__/**/*.test.ts',
  ],
};
