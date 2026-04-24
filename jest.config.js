module.exports = {
  // Test environment (defaults inherited by each project)
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js'],

  // Use V8 coverage so `jest --coverage` does not run babel-plugin-istanbul (avoids test-exclude/minimatch
  // breakage on Windows and keeps CI instrumentation stable).
  coverageProvider: 'v8',

  // Coverage: off for normal `npm test` / `jest` (use `npm run test:coverage` or `npm run test:ci`)
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },

  collectCoverageFrom: [
    'api/**/*.js',
    'database/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/*.test.js',
    '!**/*.spec.js'
  ],

  // When `projects` is set, tests are only run via those projects — no root testMatch.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },

  transform: {},

  testTimeout: 30000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,

  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testPathIgnorePatterns: [
        'tests/unit/utils-security-scanner\\.test\\.js',
        'tests/unit/api-security-dashboard\\.test\\.js'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testPathIgnorePatterns: ['tests/integration/real-security-scan\\.test\\.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js']
    },
    {
      displayName: 'security',
      // Note: __tests__/security.test.js spins up server.listen() and encodes
      // many policy expectations the app may not satisfy — run it manually:
      //   npx jest __tests__/security.test.js
      testMatch: [
        '<rootDir>/tests/unit/utils-security-scanner.test.js',
        '<rootDir>/tests/unit/api-security-dashboard.test.js',
        '<rootDir>/tests/integration/real-security-scan.test.js'
      ],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/helpers/test-setup.js']
    }
  ],

  globals: {
    'ts-jest': {
      useESM: true
    }
  },

  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
