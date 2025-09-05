# Backup System Testing Suite

This comprehensive testing suite verifies all backup system functionality to ensure reliable operation without manual testing.

## 🧪 Test Types

### 1. Quick Test (`test-backup-quick.js`)
**Purpose**: Fast health check for daily verification
**Duration**: ~30 seconds
**What it tests**:
- Environment variables (DATABASE_URL, BLOB_READ_WRITE_TOKEN)
- Database connection
- Blob storage authentication
- Backup manager instantiation
- Local assets scanning

### 2. Comprehensive Test (`test-backup-system-comprehensive.js`)
**Purpose**: Full FIT test with all functionality
**Duration**: ~5-10 minutes
**What it tests**:
- All quick test functionality
- Database backup creation and validation
- Blob backup with infinite loop prevention
- Full backup with local assets inclusion
- Error handling and timeout protection
- Authentication and token validation
- Infinite loop prevention
- Timeout protection

### 3. Test Runner (`run-backup-tests.js`)
**Purpose**: Orchestrates test execution
**Options**:
- `quick`: Run only quick test
- `comprehensive`: Run only comprehensive test
- `both`: Run quick first, then comprehensive if quick passes

## 🚀 Usage

### Command Line
```bash
# Quick health check (recommended for daily use)
node test-backup-quick.js

# Comprehensive FIT test
node test-backup-system-comprehensive.js

# Run both tests (quick first, then comprehensive)
node run-backup-tests.js both

# Run specific test type
node run-backup-tests.js quick
node run-backup-tests.js comprehensive
```

### NPM Scripts
```bash
# Quick backup test
npm run test:backup:quick

# Comprehensive backup test
npm run test:backup:comprehensive

# Run both tests (default)
npm run test:backup

# Run both tests with full path
npm run test:backup:both
```

## 📊 Test Results

### Quick Test Output
```
⚡ Quick Backup System Health Check
========================================
✅ Environment: DATABASE_URL: Database connection string configured
✅ Environment: BLOB_READ_WRITE_TOKEN: Blob storage token configured
✅ Database: Connection: Connected successfully
✅ Database: Backup Metadata Table: Backup metadata table exists
✅ Blob Storage: Authentication: Blob storage accessible (14 files found)
✅ Blob Storage: Infinite Loop Prevention: Filtering works (14 total, 12 after filtering)
✅ Backup Manager: Instantiation: Backup manager created successfully
✅ Backup Manager: Local Assets Scan: Local assets scan completed (25 files found)

📊 Quick Test Results:
========================================
Total Tests: 8
Passed: 8 ✅
Failed: 0 ❌
Success Rate: 100.0%

🎉 All quick tests passed! Backup system is healthy.
```

### Comprehensive Test Output
```
🧪 Starting Comprehensive Backup System FIT Test
============================================================
✅ Environment: DATABASE_URL exists: Environment variable is properly configured
✅ Environment: BLOB_READ_WRITE_TOKEN exists: Environment variable is properly configured
✅ Environment: BLOB_READ_WRITE_TOKEN is valid format: Environment variable is properly configured
✅ Database Backup: Content Creation: Database backup content created (15432 bytes, 8 tables)
✅ Database Backup: File Creation: Database backup file created (15432 bytes)
✅ Database Backup: File Accessibility: Backup file is accessible
✅ Database Backup: Content Validation: Backup contains table schemas and data
✅ Blob Backup: Token Authentication: Blob listing successful with token (14 blobs found)
✅ Blob Backup: Content Creation: Blob backup content created (12 blobs, 42379546 bytes)
✅ Blob Backup: Infinite Loop Prevention: Backup files properly filtered out
✅ Full Backup: Creation: Full backup created in 45231ms (10832191 bytes)
✅ Full Backup: File Accessibility: Full backup file is accessible
✅ Full Backup: Manifest Creation: Backup manifest created
✅ Full Backup: Manifest Content: Manifest includes local assets (25 files, 1024000 bytes)
✅ Error Handling: Invalid Token: Invalid token handled gracefully (no blobs returned)
✅ Error Handling: Invalid Database: Invalid database URL handled gracefully
✅ Local Assets: Backup Creation: Local assets backup created (25 files)
✅ Local Assets: Assets Directory Scan: Assets directory files included
✅ Local Assets: Root Directory Scan: Root directory files included
✅ Local Assets: Development Directory Exclusion: Development directories properly excluded
✅ Infinite Loop Prevention: Backup File Filtering: Backup files properly filtered out
✅ Infinite Loop Prevention: Duplicate Prevention: No duplicate files found (12 total, 12 unique)
✅ Timeout Protection: Full Backup Completion: Full backup completed in 45231ms (within 10 minute limit)

🎯 Test Results Summary:
============================================================
Total Tests: 22
Passed: 22 ✅
Failed: 0 ❌
Success Rate: 100.0%
Duration: 45.23 seconds
Environment: development

🎉 All tests passed! Backup system is working correctly.
```

## 📄 Test Reports

### Quick Test
- **No file output** - Results displayed in console only
- **Fast execution** - Suitable for CI/CD pipelines

### Comprehensive Test
- **JSON Report**: `backup-system-test-report.json`
- **Detailed Results**: Includes all test details, timestamps, and metrics
- **Summary Statistics**: Success rate, duration, environment info

## 🔧 Test Configuration

### Environment Requirements
- `DATABASE_URL`: PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN`: Vercel blob storage token
- `NODE_ENV`: Environment (development/production)

### Test Data
- **Database**: Uses existing production/development database
- **Blob Storage**: Uses existing blob storage
- **Local Files**: Scans actual project files
- **Cleanup**: Automatically cleans up test files

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   ```
   ❌ Environment: DATABASE_URL: DATABASE_URL is missing
   ```
   **Fix**: Ensure `.env.local` file exists with required variables

2. **Database Connection Failed**
   ```
   ❌ Database: Connection: Database connection failed: connection refused
   ```
   **Fix**: Check DATABASE_URL and database availability

3. **Blob Storage Authentication Failed**
   ```
   ❌ Blob Storage: Authentication: Blob storage failed: Access denied
   ```
   **Fix**: Verify BLOB_READ_WRITE_TOKEN is valid and has proper permissions

4. **Backup Manager Instantiation Failed**
   ```
   ❌ Backup Manager: Overall: Backup manager test failed: Cannot find module
   ```
   **Fix**: Ensure all dependencies are installed (`npm install`)

### Test Failures

If tests fail:
1. **Run quick test first** to identify basic issues
2. **Check environment variables** in `.env.local`
3. **Verify database and blob storage** are accessible
4. **Review error messages** for specific failure reasons
5. **Run comprehensive test** only after quick test passes

## 📈 Integration

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
- name: Test Backup System
  run: npm run test:backup:quick
```

### Daily Monitoring
```bash
# Add to cron job for daily health checks
0 9 * * * cd /path/to/ewa-website && npm run test:backup:quick
```

### Pre-deployment
```bash
# Run before deploying backup system changes
npm run test:backup:comprehensive
```

## 🎯 Test Coverage

The test suite covers:
- ✅ Environment configuration
- ✅ Database connectivity and backup creation
- ✅ Blob storage authentication and listing
- ✅ Full backup creation with local assets
- ✅ Infinite loop prevention
- ✅ Error handling and graceful failures
- ✅ Timeout protection
- ✅ File accessibility and validation
- ✅ Manifest creation and content validation

## 🔄 Maintenance

### Adding New Tests
1. Add test method to `BackupSystemTester` class
2. Call method in `runAllTests()` function
3. Update this README with new test description

### Updating Test Logic
1. Modify test methods in respective test files
2. Update expected results and validation logic
3. Test changes with both quick and comprehensive tests

### Test Data Management
- Tests use existing project data (no test data creation)
- Automatic cleanup of test files
- No impact on production data

---

**Note**: These tests verify the backup system functionality without requiring manual testing. Run the quick test daily and the comprehensive test before any backup system changes.
