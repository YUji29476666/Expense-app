// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // Phase 1 has no data-fetching library (React state/Context only per
    // CLAUDE.md), so SQLite-backed hooks fetch via the pattern React
    // Navigation's own docs recommend for useFocusEffect: an effect that
    // calls a load() function which setStates the result. This rule flags
    // that pattern everywhere, including in the untouched Expo template's
    // own use-color-scheme.web.ts, so it's relaxed to a warning project-wide
    // rather than fought hook-by-hook.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
