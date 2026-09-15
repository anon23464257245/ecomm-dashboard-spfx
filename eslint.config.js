const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

module.exports = [
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  },
  {
    // Imported Vite/React app — keep host lint strict, don't rewrite the app for SPFx rules.
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@rushstack/no-new-null': 'off',
      'eqeqeq': 'off',
      'react/no-unescaped-entities': 'off',
      'react/self-closing-comp': 'off'
    }
  }
];
