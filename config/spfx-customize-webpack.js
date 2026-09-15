const path = require('path');

/**
 * Resolve Vite-style `@/*` imports to compiled `lib/app/*`.
 * TypeScript keeps `@/...` paths in emit; webpack must resolve them from `lib/`.
 * @param {import('webpack').Configuration} webpackConfig
 */
module.exports = function customizeWebpack(webpackConfig) {
  webpackConfig.resolve = webpackConfig.resolve || {};
  webpackConfig.resolve.alias = {
    ...(webpackConfig.resolve.alias || {}),
    '@': path.resolve(__dirname, '../lib/app')
  };

  webpackConfig.resolve.extensions = Array.from(
    new Set([...(webpackConfig.resolve.extensions || []), '.js', '.json'])
  );
};
