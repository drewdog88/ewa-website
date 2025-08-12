# EWA Test Specification & Coverage Plan

## Overview
This document defines the comprehensive testing strategy for the Eastlake Wolfpack Association (EWA) website, covering unit, integration, end-to-end, and security testing with specific test cases and coverage requirements.

## Test Architecture

### 1. Unit/API Tests (Jest + Supertest)
**Coverage Target: ≥80% lines/branches**
**Priority: Critical**

#### Authentication & Authorization (Task 3)
- **Login Flow**
  - ✅ Valid admin credentials → successful login with session
  - ✅ Invalid credentials → 401 with proper error message
  - ✅ Missing credentials → 400 validation error
  - ✅ Rate limiting → 429 after multiple failed attempts
  - ✅ Session management → proper session creation/destruction

- **Role-Based Access Control**
  - ✅ Admin routes → accessible only to admin users
  - ✅ Booster routes → accessible to admin and booster users
  - ✅ Public routes → accessible to all authenticated users
  - ✅ Unauthorized access → 403 with proper error message
  - ✅ Session expiration → 401 after session timeout

#### API Endpoints (Tasks 4, 5, 6, 7)
- **Officers Management**
  - ✅ GET /api/officers → returns officers list with proper filtering
  - ✅ POST /api/officers → creates officer with validation
  - ✅ PUT /api/officers/:id → updates officer with validation
  - ✅ DELETE /api/officers/:id → deletes officer with cascade
  - ✅ CSV Import → handles valid/invalid CSV files
  - ✅ Duplicate detection → prevents duplicate officers

- **Volunteers Management**
  - ✅ GET /api/volunteers → returns volunteers list
  - ✅ POST /api/volunteers → creates volunteer with email validation
  - ✅ PUT /api/volunteers/:id → updates volunteer
  - ✅ DELETE /api/volunteers/:id → deletes volunteer

- **1099 Forms Management**
  - ✅ GET /api/1099 → returns 1099 forms list
  - ✅ POST /api/1099 → creates 1099 form with validation
  - ✅ PUT /api/1099/:id → updates 1099 form
  - ✅ DELETE /api/1099/:id → deletes 1099 form
  - ✅ W-9 Upload → validates file type/size
  - ✅ CSV Export → generates proper CSV format
  - ✅ SSN Masking → masks SSN in responses

- **Health & System**
  - ✅ GET /api/health → returns system status
  - ✅ Error handling → standardized error responses
  - ✅ Input validation → sanitizes all inputs

#### Security Middleware (Task 13)
- **Input Validation**
  - ✅ SQL injection attempts → blocked
  - ✅ XSS attempts → sanitized
  - ✅ Path traversal → blocked
  - ✅ File upload validation → type/size limits

- **Security Headers**
  - ✅ CORS → properly configured
  - ✅ CSP → content security policy
  - ✅ HSTS → strict transport security

### 2. Integration Tests (Jest + Testcontainers)
**Coverage Target: ≥80% lines/branches**
**Priority: High**

#### Database Operations (Task 2)
- **Schema & Migrations**
  - ✅ Migrations apply cleanly
  - ✅ Foreign key constraints enforced
  - ✅ Triggers work correctly
  - ✅ Indexes improve performance

- **CRUD Operations**
  - ✅ Create operations → data persisted correctly
  - ✅ Read operations → data retrieved correctly
  - ✅ Update operations → data updated correctly
  - ✅ Delete operations → data deleted with cascade
  - ✅ Concurrency → parallel operations don't conflict
  - ✅ Transactions → rollback on failure

- **Data Integrity**
  - ✅ Referential integrity → foreign keys enforced
  - ✅ Unique constraints → prevents duplicates
  - ✅ Check constraints → validates data ranges
  - ✅ PII protection → sensitive data masked

#### File Operations (Task 7)
- **Vercel Blob Integration**
  - ✅ File upload → stores in blob storage
  - ✅ File retrieval → retrieves from blob storage
  - ✅ File deletion → removes from blob storage
  - ✅ Access control → proper permissions

### 3. End-to-End Tests (Playwright)
**Coverage Target: Key user journeys**
**Priority: High**

#### Authentication Flows
- **Login/Logout**
  - ✅ Admin login → successful dashboard access
  - ✅ Booster login → appropriate access levels
  - ✅ Invalid login → proper error messages
  - ✅ Logout → session cleared

- **Role-Based Navigation**
  - ✅ Admin dashboard → full access to all features
  - ✅ Booster dashboard → limited access
  - ✅ Unauthorized access → redirected to login

#### User Journeys
- **Volunteer Signup**
  - ✅ Form validation → proper error messages
  - ✅ Successful signup → confirmation message
  - ✅ Duplicate email → error handling

- **1099 Workflow**
  - ✅ Form creation → data saved correctly
  - ✅ W-9 upload → file validation and storage
  - ✅ Admin review → status updates
  - ✅ CSV export → proper file download

- **Admin Dashboard**
  - ✅ Data loading → all sections populate
  - ✅ CRUD operations → create/edit/delete work
  - ✅ Security dashboard → scan results display
  - ✅ File management → upload/download work

#### Accessibility (Task 8)
- **WCAG Compliance**
  - ✅ Keyboard navigation → all features accessible
  - ✅ Screen reader → proper ARIA labels
  - ✅ Color contrast → meets standards
  - ✅ Form validation → clear error messages

### 4. Security Tests
**Coverage Target: All security controls**
**Priority: Critical**

#### Automated Security Scanning
- **Dependency Scanning**
  - ✅ npm audit → no high/critical vulnerabilities
  - ✅ Snyk integration → security policy enforcement

- **Static Analysis**
  - ✅ ESLint security plugins → code quality
  - ✅ Semgrep → security rule violations

- **Dynamic Analysis**
  - ✅ OWASP ZAP → baseline security scan
  - ✅ Authentication bypass attempts → blocked
  - ✅ Authorization bypass attempts → blocked

#### Security Controls
- **Input Validation**
  - ✅ SQL injection → blocked
  - ✅ XSS → sanitized
  - ✅ CSRF → protected
  - ✅ File upload → validated

- **Session Management**
  - ✅ Session fixation → prevented
  - ✅ Session hijacking → protected
  - ✅ Session timeout → enforced

## Test Data Strategy

### Factories & Fixtures
```javascript
// Test data factories for consistent test data
const createAdminUser = () => ({ /* admin user data */ });
const createBoosterUser = () => ({ /* booster user data */ });
const createVolunteer = () => ({ /* volunteer data */ });
const create1099Form = () => ({ /* 1099 form data */ });
```

### Database Isolation
- **Per-test isolation** → each test gets clean database
- **Schema suffixing** → parallel test execution
- **Transaction rollback** → tests don't affect each other

### File Fixtures
- **Valid files** → PDF, JPG, PNG for upload tests
- **Invalid files** → EXE, oversized files for validation tests
- **Malicious files** → test files for security validation

## CI/CD Pipeline

### Pipeline Stages
1. **Setup** → Node install, cache dependencies
2. **Lint/Typecheck** → Code quality gates
3. **Unit Tests** → API tests with coverage
4. **Integration Tests** → Database tests with coverage
5. **Build** → Application build
6. **E2E Tests** → Playwright tests on preview
7. **Security Scans** → Automated security testing
8. **Coverage Report** → Aggregate and enforce thresholds
9. **Deploy** → Staging deployment with approval gates

### Quality Gates
- **Coverage thresholds** → ≥80% unit/integration coverage
- **Security gates** → No high/critical vulnerabilities
- **Test stability** → <2% flaky test rate
- **Performance** → E2E tests complete in <10 minutes

## Test Environment

### Local Development
```bash
# Run all test suites locally
npm run test:unit      # Unit/API tests
npm run test:integration # Database integration tests
npm run test:e2e       # End-to-end tests
npm run test:security  # Security scans
npm run test:all       # All tests with coverage
```

### CI Environment
- **Parallel execution** → Tests run in parallel
- **Artifact collection** → Videos, screenshots, traces
- **Coverage reporting** → JUnit XML, HTML reports
- **Security reporting** → SARIF, ZAP reports

## Success Criteria

### Coverage Metrics
- **Unit tests** → ≥80% line/branch coverage
- **Integration tests** → ≥80% line/branch coverage
- **E2E tests** → All critical user journeys covered
- **Security tests** → All security controls validated

### Performance Metrics
- **Test execution time** → <10 minutes for E2E suite
- **Flaky test rate** → <2% over 10 runs
- **CI pipeline time** → <15 minutes total

### Quality Metrics
- **Zero high/critical vulnerabilities** → Security gates pass
- **Zero accessibility violations** → WCAG compliance
- **Zero PII exposure** → Data protection verified

## Maintenance

### Regular Activities
- **Weekly test reviews** → Identify and fix flaky tests
- **Monthly coverage reviews** → Ensure coverage targets met
- **Quarterly security reviews** → Update security test rules
- **Continuous improvement** → Refactor tests for maintainability

### Documentation
- **Test runbooks** → How to run and debug tests
- **Failure analysis** → Common issues and solutions
- **Adding new tests** → Guidelines for test development
- **CI/CD troubleshooting** → Pipeline issues and fixes
