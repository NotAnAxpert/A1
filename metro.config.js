const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  assetExts: [...(config.resolver.assetExts || []), 'wasm'],
};

config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Required for expo-sqlite on web (SharedArrayBuffer / OPFS)
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      middleware(req, res, next);
    };
  },
};

module.exports = config;
