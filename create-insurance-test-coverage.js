#!/usr/bin/env node

/**
 * Insurance Test Coverage Report Generator
 * 
 * This script runs all insurance-related tests and generates comprehensive coverage reports
 * including unit tests, integration tests, and end-to-end tests.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${message}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSection(message) {
  log('\n' + '-'.repeat(40), 'yellow');
  log(`  ${message}`, 'yellow');
  log('-'.repeat(40), 'yellow');
}

function runCommand(command, description) {
  try {
    log(`Running: ${description}`, 'blue');
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 300000 // 5 minutes timeout
    });
    log(`✅ ${description} completed successfully`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.stdout) log(`Output: ${error.stdout}`, 'red');
    if (error.stderr) log(`Error Output: ${error.stderr}`, 'red');
    return { success: false, error: error.message, output: error.stdout, stderr: error.stderr };
  }
}

function generateCoverageReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      coverage: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0
      }
    },
    tests: {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 }
    },
    files: {
      'api/insurance.js': { covered: false, coverage: 0 },
      'database/neon-functions.js': { covered: false, coverage: 0 },
      'admin/dashboard.html': { covered: false, coverage: 0 }
    },
    recommendations: []
  };

  return report;
}

function updateCoverageReport(report, testType, result) {
  if (result.success) {
    report.tests[testType].passed++;
    report.tests[testType].total++;
    report.summary.passedTests++;
  } else {
    report.tests[testType].failed++;
    report.tests[testType].total++;
    report.summary.failedTests++;
  }
  report.summary.totalTests++;
}

function analyzeCoverageOutput(output) {
  const coverage = {
    statements: 0,
    branches: 0,
    functions: 0,
    lines: 0
  };

  // Parse Jest coverage output
  const coverageMatch = output.match(/All files\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)\s+\|\s+(\d+(?:\.\d+)?)/);
  if (coverageMatch) {
    coverage.statements = parseFloat(coverageMatch[1]);
    coverage.branches = parseFloat(coverageMatch[2]);
    coverage.functions = parseFloat(coverageMatch[3]);
    coverage.lines = parseFloat(coverageMatch[4]);
  }

  return coverage;
}

function generateRecommendations(report) {
  const recommendations = [];

  // Coverage recommendations
  if (report.summary.coverage.statements < 80) {
    recommendations.push('Increase statement coverage to at least 80%');
  }
  if (report.summary.coverage.branches < 80) {
    recommendations.push('Increase branch coverage to at least 80%');
  }
  if (report.summary.coverage.functions < 80) {
    recommendations.push('Increase function coverage to at least 80%');
  }
  if (report.summary.coverage.lines < 80) {
    recommendations.push('Increase line coverage to at least 80%');
  }

  // Test recommendations
  if (report.tests.unit.failed > 0) {
    recommendations.push('Fix failing unit tests');
  }
  if (report.tests.integration.failed > 0) {
    recommendations.push('Fix failing integration tests');
  }
  if (report.tests.e2e.failed > 0) {
    recommendations.push('Fix failing end-to-end tests');
  }

  // File coverage recommendations
  Object.entries(report.files).forEach(([file, data]) => {
    if (!data.covered) {
      recommendations.push(`Add tests for ${file}`);
    } else if (data.coverage < 80) {
      recommendations.push(`Increase test coverage for ${file} (currently ${data.coverage}%)`);
    }
  });

  return recommendations;
}

function saveReport(report) {
  const reportDir = path.join(__dirname, 'coverage');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportFile = path.join(reportDir, `insurance-test-coverage-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log(`📊 Coverage report saved to: ${reportFile}`, 'green');
  return reportFile;
}

function displayReport(report) {
  logHeader('INSURANCE TEST COVERAGE REPORT');
  
  logSection('SUMMARY');
  log(`Total Tests: ${report.summary.totalTests}`, 'bright');
  log(`Passed: ${report.summary.passedTests}`, 'green');
  log(`Failed: ${report.summary.failedTests}`, 'red');
  
  logSection('COVERAGE');
  log(`Statements: ${report.summary.coverage.statements}%`, report.summary.coverage.statements >= 80 ? 'green' : 'yellow');
  log(`Branches: ${report.summary.coverage.branches}%`, report.summary.coverage.branches >= 80 ? 'green' : 'yellow');
  log(`Functions: ${report.summary.coverage.functions}%`, report.summary.coverage.functions >= 80 ? 'green' : 'yellow');
  log(`Lines: ${report.summary.coverage.lines}%`, report.summary.coverage.lines >= 80 ? 'green' : 'yellow');
  
  logSection('TEST BREAKDOWN');
  log(`Unit Tests: ${report.tests.unit.passed}/${report.tests.unit.total} passed`, report.tests.unit.failed === 0 ? 'green' : 'red');
  log(`Integration Tests: ${report.tests.integration.passed}/${report.tests.integration.total} passed`, report.tests.integration.failed === 0 ? 'green' : 'red');
  log(`E2E Tests: ${report.tests.e2e.passed}/${report.tests.e2e.total} passed`, report.tests.e2e.failed === 0 ? 'green' : 'red');
  
  if (report.recommendations.length > 0) {
    logSection('RECOMMENDATIONS');
    report.recommendations.forEach((rec, index) => {
      log(`${index + 1}. ${rec}`, 'yellow');
    });
  }
  
  logSection('FILES COVERED');
  Object.entries(report.files).forEach(([file, data]) => {
    const status = data.covered ? '✅' : '❌';
    const coverage = data.covered ? `${data.coverage}%` : 'Not covered';
    log(`${status} ${file}: ${coverage}`, data.covered ? 'green' : 'red');
  });
}

async function main() {
  logHeader('INSURANCE TEST COVERAGE GENERATOR');
  
  const report = generateCoverageReport();
  
  // Check if server is running
  logSection('PREREQUISITES');
  try {
    execSync('curl -s http://localhost:3000/health > /dev/null', { stdio: 'pipe' });
    log('✅ Local server is running', 'green');
  } catch (error) {
    log('❌ Local server is not running. Please start the server with: npm start', 'red');
    log('Continuing with unit and integration tests only...', 'yellow');
  }
  
  // Run unit tests
  logSection('UNIT TESTS');
  const unitResult = runCommand('npm run test:insurance:unit -- --coverage', 'Unit Tests');
  updateCoverageReport(report, 'unit', unitResult);
  
  if (unitResult.success) {
    const unitCoverage = analyzeCoverageOutput(unitResult.output);
    Object.assign(report.summary.coverage, unitCoverage);
  }
  
  // Run integration tests
  logSection('INTEGRATION TESTS');
  const integrationResult = runCommand('npm run test:insurance:integration -- --coverage', 'Integration Tests');
  updateCoverageReport(report, 'integration', integrationResult);
  
  // Run E2E tests (only if server is running)
  logSection('END-TO-END TESTS');
  try {
    execSync('curl -s http://localhost:3000/health > /dev/null', { stdio: 'pipe' });
    const e2eResult = runCommand('npm run test:insurance:e2e', 'E2E Tests');
    updateCoverageReport(report, 'e2e', e2eResult);
  } catch (error) {
    log('⚠️  Skipping E2E tests - server not running', 'yellow');
    report.tests.e2e.total = 0;
  }
  
  // Generate recommendations
  report.recommendations = generateRecommendations(report);
  
  // Display and save report
  displayReport(report);
  
  const reportFile = saveReport(report);
  
  logSection('NEXT STEPS');
  if (report.summary.failedTests > 0) {
    log('🔧 Fix failing tests before proceeding', 'red');
  }
  if (report.recommendations.length > 0) {
    log('📋 Review and implement recommendations', 'yellow');
  }
  log('📊 View detailed coverage report:', 'blue');
  log(`   ${reportFile}`, 'cyan');
  
  logHeader('COVERAGE GENERATION COMPLETE');
  
  // Exit with appropriate code
  process.exit(report.summary.failedTests > 0 ? 1 : 0);
}

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the main function
main().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
