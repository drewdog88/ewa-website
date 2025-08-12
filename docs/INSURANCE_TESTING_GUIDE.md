# Insurance Testing Guide

This document provides comprehensive guidance for testing the insurance form functionality in the EWA website.

## Overview

The insurance testing framework includes:
- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing the interaction between API endpoints and database functions
- **End-to-End Tests**: Testing complete user workflows through the browser interface
- **Coverage Reports**: Comprehensive test coverage analysis and recommendations

## Test Structure

```
tests/
├── unit/
│   ├── api-insurance.test.js          # API endpoint unit tests
│   └── database-insurance-functions.test.js  # Database function unit tests
├── integration/
│   └── insurance-integration.test.js  # Full-stack integration tests
└── e2e/
    └── insurance-e2e.test.js          # Browser-based end-to-end tests
```

## Running Tests

### Quick Start

```bash
# Run all insurance tests
npm run test:insurance

# Run specific test types
npm run test:insurance:unit
npm run test:insurance:integration
npm run test:insurance:e2e

# Generate comprehensive coverage report
npm run test:insurance:coverage
```

### Prerequisites

1. **Local Server**: Start the development server
   ```bash
   npm start
   ```

2. **Database**: Ensure the database is accessible and contains test data

3. **Dependencies**: Install all required packages
   ```bash
   npm install
   ```

## Unit Tests

### API Tests (`tests/unit/api-insurance.test.js`)

Tests the insurance API endpoints in isolation:

- **GET /api/insurance**: Retrieving insurance submissions
- **POST /api/insurance**: Creating new insurance submissions
- **PUT /api/insurance/:id**: Updating submission status
- **DELETE /api/insurance/:id**: Deleting submissions

**Key Test Cases:**
- Successful operations
- Input validation
- Error handling
- Database error scenarios
- Status validation

### Database Tests (`tests/unit/database-insurance-functions.test.js`)

Tests the database functions directly:

- **getInsurance()**: Retrieving insurance data with joins
- **addInsurance()**: Inserting new insurance records
- **updateInsuranceStatus()**: Updating submission status
- **deleteInsuranceSubmission()**: Removing submissions

**Key Test Cases:**
- SQL query validation
- Data type handling
- Foreign key constraints
- Error scenarios
- Connection failures

## Integration Tests

### Full Stack Tests (`tests/integration/insurance-integration.test.js`)

Tests the complete flow from API to database:

- **CRUD Operations**: Complete create, read, update, delete workflow
- **Data Consistency**: Ensuring data integrity across operations
- **Concurrent Operations**: Handling multiple simultaneous requests
- **Security**: Input sanitization and validation
- **Performance**: Response time and efficiency

## End-to-End Tests

### Browser Tests (`tests/e2e/insurance-e2e.test.js`)

Tests the complete user experience:

- **Form Submission**: Complete form filling and submission
- **Validation**: Client-side and server-side validation
- **Status Updates**: Changing submission status via UI
- **Deletion**: Removing submissions through the interface
- **CSV Download**: Exporting data functionality
- **Accessibility**: Keyboard navigation and screen reader support
- **Error Handling**: Network and server error scenarios
- **Performance**: Page load times and responsiveness

## Test Coverage

### Coverage Report

The coverage report includes:

- **Statement Coverage**: Percentage of code statements executed
- **Branch Coverage**: Percentage of conditional branches tested
- **Function Coverage**: Percentage of functions called
- **Line Coverage**: Percentage of code lines executed

### Coverage Thresholds

- **Minimum**: 80% coverage across all metrics
- **Target**: 90% coverage for critical functions
- **Exclusions**: Third-party libraries and generated code

### Generating Reports

```bash
# Generate comprehensive coverage report
npm run test:insurance:coverage

# View coverage in browser
npm run test:insurance:unit -- --coverage --watchAll=false
```

## Test Data Management

### Test Data Setup

```javascript
// Example test data structure
const testInsuranceData = [
  {
    id: 1,
    event_name: 'Band Concert',
    event_date: '2024-12-15',
    event_description: 'Annual winter concert',
    participant_count: 50,
    submitted_by: 'admin',
    status: 'pending',
    club_id: '123e4567-e89b-12d3-a456-426614174000',
    booster_club_name: 'Band',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];
```

### Database Cleanup

Tests automatically clean up after themselves, but manual cleanup may be needed:

```bash
# Clear test data
node clear-insurance-test-data.js
```

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies appropriately
5. **Edge Cases**: Test boundary conditions and error scenarios

### Example Test Structure

```javascript
describe('Insurance API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/insurance', () => {
    test('should create new insurance submission successfully', async () => {
      // Arrange
      const newSubmission = { /* test data */ };
      mockNeonFunctions.addInsurance.mockResolvedValueOnce(createdSubmission);

      // Act
      const result = await handleInsuranceRequest(req, res);

      // Assert
      expect(result).toEqual(expectedResult);
    });
  });
});
```

### Error Handling

1. **Database Errors**: Test connection failures and constraint violations
2. **Validation Errors**: Test invalid input scenarios
3. **Network Errors**: Test API timeout and connection issues
4. **Security Errors**: Test unauthorized access and injection attempts

## Continuous Integration

### CI/CD Pipeline

Tests are automatically run in the CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Insurance Tests
  run: |
    npm run test:insurance:unit
    npm run test:insurance:integration
    npm run test:insurance:coverage
```

### Quality Gates

- All tests must pass
- Coverage must meet minimum thresholds
- No security vulnerabilities
- Performance benchmarks met

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure DATABASE_URL is set correctly
2. **Server Not Running**: Start local server before running E2E tests
3. **Timeout Issues**: Increase timeout values for slow operations
4. **Mock Failures**: Check mock setup and cleanup

### Debug Mode

```bash
# Run tests in debug mode
npm run test:insurance:unit -- --verbose
npm run test:insurance:e2e -- --debug
```

### Logs and Output

- **Console Output**: Detailed test execution logs
- **Coverage Reports**: HTML and JSON coverage files
- **Error Logs**: Detailed error information for debugging

## Performance Testing

### Load Testing

```bash
# Run performance tests
npm run test:insurance:performance
```

### Benchmarks

- **Response Time**: API endpoints should respond within 500ms
- **Throughput**: Handle 100+ concurrent requests
- **Memory Usage**: Stay within reasonable memory limits

## Security Testing

### Security Scenarios

1. **SQL Injection**: Test with malicious input
2. **XSS Prevention**: Test script injection attempts
3. **Input Validation**: Test boundary conditions
4. **Authentication**: Test unauthorized access

### Security Tools

- **ESLint Security**: Static code analysis
- **npm audit**: Dependency vulnerability scanning
- **OWASP ZAP**: Dynamic security testing

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep testing libraries current
2. **Review Coverage**: Ensure adequate test coverage
3. **Refactor Tests**: Improve test quality and maintainability
4. **Update Documentation**: Keep this guide current

### Test Maintenance

```bash
# Update test dependencies
npm update

# Regenerate coverage reports
npm run test:insurance:coverage

# Clean up old reports
rm -rf coverage/
```

## Support

### Getting Help

1. **Documentation**: Check this guide and inline comments
2. **Logs**: Review test output and error messages
3. **Community**: Check project issues and discussions
4. **Team**: Contact the development team for assistance

### Contributing

When adding new insurance features:

1. **Write Tests First**: Follow TDD principles
2. **Update Documentation**: Keep this guide current
3. **Maintain Coverage**: Ensure adequate test coverage
4. **Review and Refactor**: Continuously improve test quality

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Maintainer**: EWA Development Team
