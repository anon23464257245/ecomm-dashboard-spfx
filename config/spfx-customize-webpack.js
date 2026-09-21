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
  // If present, apply dev-server header modifications to assist local debugging
  // (adds CORS and Private Network Access headers). This is safe for local dev only.
  if (typeof module.exports.addDevServerHeaders === 'function') {
    try {
      module.exports.addDevServerHeaders(webpackConfig);
    } catch (e) {
      // swallow errors so customizing webpack doesn't break the build if headers fail
      // eslint-disable-next-line no-console
      console.warn('addDevServerHeaders failed:', e && e.message ? e.message : e);
    }
  }
};

// When running the dev server locally and loading debug manifests from SharePoint Online,
// browsers enforcing the Private Network Access (PNA) / CORS policies may block requests
// from the SharePoint origin to localhost. To help during local debugging, if a
// `devServer` config object exists we add permissive response headers so the browser
// accepts the cross-origin request from SharePoint to the localhost dev server.
// Note: This is only for local development and should NOT be used in production.
module.exports.addDevServerHeaders = function addDevServerHeaders(webpackConfig) {
  webpackConfig.devServer = webpackConfig.devServer || {};

  // Ensure the dev server binds to IPv4 loopback explicitly so requests to
  // `https://localhost:4321` and `https://127.0.0.1:4321` succeed. Some
  // environments prefer IPv6 `::1` and can cause connection issues for
  // other tools; setting host to '127.0.0.1' stabilizes behavior on Windows.
  webpackConfig.devServer.host = webpackConfig.devServer.host || '127.0.0.1';
  webpackConfig.devServer.port = webpackConfig.devServer.port || 4321;
  webpackConfig.devServer.allowedHosts = webpackConfig.devServer.allowedHosts || ['localhost', '127.0.0.1'];

  const headers = webpackConfig.devServer.headers || {};
  webpackConfig.devServer.headers = Object.assign({}, headers, {
    // Allow cross-origin requests from the tenant workbench
    'Access-Control-Allow-Origin': '*',
    // Allow required request headers
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    // Expose CORS headers to the browser
    'Access-Control-Expose-Headers': 'Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy',
    // Allow the browser to access the local network (PNA / Private Network Access)
    // This header is currently checked by Chromium-based browsers when requesting
    // a local (loopback) address from a public origin.
    'Access-Control-Allow-Private-Network': 'true'
  });

  // Also set allowed methods for preflight
  webpackConfig.devServer.allowedHosts = webpackConfig.devServer.allowedHosts || 'all';
  webpackConfig.devServer.client = webpackConfig.devServer.client || {};
  webpackConfig.devServer.client.webSocketURL = webpackConfig.devServer.client.webSocketURL || undefined;
  // Add middleware to ensure preflight (OPTIONS) requests receive the
  // `Access-Control-Allow-Private-Network` header and are handled before
  // the browser enforces Private Network Access restrictions.
  const existingSetup = webpackConfig.devServer.setupMiddlewares;
  webpackConfig.devServer.setupMiddlewares = function (middlewares, devServer) {
    if (devServer && devServer.app) {
      devServer.app.use((req, res, next) => {
        res.set({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Expose-Headers': 'Cross-Origin-Opener-Policy, Cross-Origin-Embedder-Policy',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Private-Network': 'true'
        });
        if (req.method === 'OPTIONS') {
          res.status(204).end();
          return;
        }
        next();
      });
    }
    if (typeof existingSetup === 'function') {
      return existingSetup(middlewares, devServer) || middlewares;
    }
    return middlewares;
  };
};
