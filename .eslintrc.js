module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
    browser: true // Add browser environment for frontend files
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    indent: ['error', 2],
    'linebreak-style': 'off', // Disabled to avoid Windows/Linux conflicts
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': 'off', // Allow console.log for debugging
    'prefer-const': 'error',
    'no-var': 'error',
    'no-prototype-builtins': 'warn', // Changed from 'error' to 'warn' to be less strict
    'no-undef': 'warn', // Changed from 'error' to 'warn' for browser globals
    'no-useless-escape': 'warn' // Changed from 'error' to 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    '*.min.js',
    'dist/',
    'build/'
  ]
};
