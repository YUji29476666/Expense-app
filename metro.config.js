// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite on web runs SQLite as WebAssembly (wa-sqlite).
config.resolver.assetExts.push('wasm');

// expo-sqlite on web needs SharedArrayBuffer, which browsers only enable on
// cross-origin isolated pages. Send the same headers in `expo start --web`
// that the production host sends (see vercel.json / public/_headers).
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
