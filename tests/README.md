# EWA Website Test Suite

This directory contains organized test scripts for the EWA website, converted from the original `check-*.js` diagnostic scripts.

## 📁 Directory Structure

```
tests/
├── database/           # Database connection and schema tests
│   └── connection.test.js
├── features/           # Feature-specific tests
│   └── payment.test.js
├── integration/        # Integration and end-to-end tests
├── utils/             # Test utilities and helpers
├── run-tests.js       # Test runner script
└── README.md          # This file
```

## 🚀 Running Tests

### Using npm scripts:
```bash
npm run test:database    # Run database tests only
npm run test:features    # Run feature tests only
npm run test:check       # Run all organized tests
```

### Using the test runner directly:
```bash
node tests/run-tests.js database    # Database tests
node tests/run-tests.js features    # Feature tests
node tests/run-tests.js all         # All tests
node tests/run-tests.js help        # Show help
```

## 📊 Test Categories

### Database Tests (`tests/database/`)
- **connection.test.js** - Tests database connectivity, permissions, and basic operations
  - Database connection validation
  - Permission testing (CREATE, INSERT, SELECT, DROP, ALTER)
  - Table existence verification
  - Schema validation

### Feature Tests (`tests/features/`)
- **payment.test.js** - Tests payment system functionality
  - Active booster clubs validation
  - Zelle URL configuration testing
  - Payment-enabled clubs verification
  - Club ID format validation

### Integration Tests (`tests/integration/`)
- End-to-end functionality tests
- API integration tests
- Cross-system validation

### Utils (`tests/utils/`)
- Test helper functions
- Database connection utilities
- Common test data

## 🔄 Migration from check- Scripts

The original `check-*.js` scripts were diagnostic tools created during development. This new structure:

1. **Organizes by purpose** - Database, features, integration
2. **Uses proper test framework** - Jest-style structure with assertions
3. **Provides clear results** - Pass/fail with specific error messages
4. **Enables automation** - Can be run in CI/CD pipelines
5. **Documents functionality** - Clear test descriptions and purposes

## 🛡️ Safety

These tests are **completely safe** to run:
- ✅ No production code changes
- ✅ No database schema modifications
- ✅ No API endpoint changes
- ✅ Read-only operations (with temporary test tables)
- ✅ All changes tracked in Git

## 📝 Adding New Tests

1. **Choose the right category:**
   - `database/` - For database connection, schema, or data validation
   - `features/` - For specific feature testing (payment, admin, clubs)
   - `integration/` - For end-to-end or cross-system tests

2. **Follow the naming convention:**
   - Use `.test.js` suffix
   - Descriptive names (e.g., `admin-users.test.js`)

3. **Use the test structure:**
   ```javascript
   describe('Feature Name Tests', () => {
     let sql;
     
     beforeAll(async () => {
       sql = neon(process.env.DATABASE_URL);
     });
     
     test('should do something specific', async () => {
       // Test implementation
       expect(result).toBe(expected);
     });
   });
   ```

## 🎯 Benefits

- **Better organization** - Easy to find and maintain tests
- **Clear results** - Know exactly what passed/failed
- **Automation ready** - Can be integrated into CI/CD
- **Documentation** - Tests serve as living documentation
- **Maintainability** - Easier to update and extend

## 🔧 Original check- Scripts

The original `check-*.js` scripts are still available in the root directory for reference, but the organized test suite in this directory provides a better, more maintainable approach to system validation.
