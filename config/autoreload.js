module.exports.autoreload = {
  active: false,
  usePolling: false,
  dirs: [
    'api/hooks',
    'config/locales',
    'config/routes',
    'config/routes.js',
    'config/policies',
    'config/policies.js',
    'api/controllers',
    'api/services',
  ],
  ignored: [
    // Ignore all files with .ts extension
    '**.ts',
  ],
};