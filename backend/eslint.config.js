// ESLint v9+ config for backend (migrated from .eslintrc.json)
import eslintPluginImport from 'eslint-plugin-import';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: { require: 'readonly', module: 'readonly', __dirname: 'readonly', process: 'readonly' }
    },
    plugins: {
      import: eslintPluginImport
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'error',
      'no-undef': 'error',
      'no-implicit-globals': 'error',
      'consistent-return': 'error',
      'import/order': ['error', { 'alphabetize': { order: 'asc' }, 'groups': [['builtin', 'external', 'internal']] }],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'arrow-body-style': ['error', 'as-needed'],
      'object-curly-spacing': ['error', 'always'],
      'import/no-unresolved': 'error',
      'import/extensions': 'error',
      'no-warning-comments': ['error', { 'terms': ['todo', 'fixme', 'any'], 'location': 'anywhere' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'strict': ['error', 'global']
    }
  }
];
