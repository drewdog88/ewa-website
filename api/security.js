const express = require('express');
const SecurityScanner = require('../utils/security-scanner');
const fs = require('fs');
const path = require('path');
const { get } = require('@vercel/blob');

const router = express.Router();

// Middleware to check if user is admin (temporarily disabled for dashboard compatibility)
const requireAdmin = async (req, res, next) => {
  // Temporarily bypass authentication for dashboard compatibility
  // TODO: Implement proper session-based authentication
  next();
};

// Get security dashboard data
router.get('/dashboard', requireAdmin, async (req, res) => {
  try {
    const reportPath = path.join(__dirname, '..', 'security-report.json');
    let securityData = {
      lastScan: null,
      vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0 },
      codeIssues: 0,
      securityScore: 100,
      recommendations: []
    };

    // Load existing report if available
    if (fs.existsSync(reportPath)) {
      const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      securityData = {
        lastScan: reportData.summary.timestamp,
        vulnerabilities: reportData.details.dependencies.severityCounts || { critical: 0, high: 0, moderate: 0, low: 0 },
        codeIssues: reportData.summary.totalIssues,
        securityScore: calculateSecurityScore(reportData),
        recommendations: reportData.details.recommendations || []
      };
    }

    res.json({
      success: true,
      data: securityData
    });
  } catch (error) {
    console.error('Error getting security dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load security dashboard'
    });
  }
});

// Run security scan
router.post('/scan', requireAdmin, async (req, res) => {
  try {
    console.log('Starting security scan...');
    
    const scanner = new SecurityScanner();
    const results = await scanner.runFullScan();
    const report = await scanner.generateReport();
    
    const securityScore = scanner.getSecurityScore();
    
    res.json({
      success: true,
      message: 'Security scan completed',
      data: {
        summary: report.summary,
        securityScore,
        recommendations: results.recommendations
      }
    });
  } catch (error) {
    console.error('Security scan failed:', error);
    res.status(500).json({
      success: false,
      message: 'Security scan failed',
      error: error.message
    });
  }
});

// Get detailed security report
router.get('/report', requireAdmin, async (req, res) => {
  try {
    const reportPath = path.join(__dirname, '..', 'security-report.json');
    
    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({
        success: false,
        message: 'No security report found. Run a scan first.'
      });
    }
    
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Error getting security report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load security report'
    });
  }
});

// Get code coverage report
router.get('/coverage', requireAdmin, async (req, res) => {
  try {
    // Try to get coverage data from Vercel Blob
    try {
      const blob = await get('coverage-data.json');
      if (blob) {
        const response = await fetch(blob.url);
        const coverageData = await response.json();
        
        res.json({
          success: true,
          data: {
            overallCoverage: coverageData.coverage,
            timestamp: coverageData.timestamp,
            testsPassed: coverageData.testsPassed,
            message: 'Coverage data from Vercel Blob'
          }
        });
        return;
      }
    } catch (blobError) {
      console.log('No coverage data found in Vercel Blob:', blobError.message);
    }
    
    // No coverage data available
    res.status(404).json({
      success: false,
      message: 'Test coverage data not available. Run tests with coverage first to generate data.',
      data: {
        overallCoverage: null,
        timestamp: null,
        testsPassed: null,
        message: 'No coverage data found'
      }
    });
  } catch (error) {
    console.error('Error getting coverage report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load coverage report',
      error: error.message
    });
  }
});

// Run tests and generate coverage
router.post('/test-coverage', requireAdmin, async (req, res) => {
  try {
    console.log('Running tests with coverage...');
    
    const { spawn } = require('child_process');
    
    // Define test files and their categories
    const testFiles = [
      { file: 'tests/unit/api-index-router.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/database-neon-functions-comprehensive.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/api-insurance.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/integration/insurance-integration.test.js', category: 'Integration Tests', status: 'pending' },
      { file: 'tests/e2e/insurance-e2e.test.js', category: 'E2E Tests', status: 'pending' },
      { file: 'tests/unit/database-neon-functions.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/api-security-dashboard.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/utils-logger.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/api-security.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/integration/api-behavior.test.js', category: 'Integration Tests', status: 'pending' },
      { file: 'tests/unit/utils-security-scanner.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/database-insurance-functions.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/integration/real-security-scan.test.js', category: 'Integration Tests', status: 'pending' },
      { file: 'tests/integration/code-quality.test.js', category: 'Integration Tests', status: 'pending' },
      { file: 'tests/integration/database-connection.test.js', category: 'Integration Tests', status: 'pending' },
      { file: 'tests/unit/api-index.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/api-login.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/api-1099-simple.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/integration/real-database.test.js', category: 'Integration Tests', status: 'pending' },
      { file: 'tests/unit/api-officers.test.js', category: 'Unit Tests', status: 'pending' },
      { file: 'tests/unit/api-health.test.js', category: 'Unit Tests', status: 'pending' }
    ];
    
    let completedTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    // Run tests with coverage using spawn for better control
    const testProcess = spawn('npm', ['test', '--', '--coverage', '--verbose', '--detectOpenHandles', '--forceExit'], {
      cwd: path.join(__dirname, '..'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Add timeout to prevent hanging
    const testTimeout = setTimeout(() => {
      console.log('Test process timeout - killing process');
      testProcess.kill('SIGTERM');
    }, 10 * 60 * 1000); // 10 minute timeout
    
    let testOutput = '';
    let currentTestFile = '';
    
    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      testOutput += output;
      
      // Parse test output to track progress
      const lines = output.split('\n');
      lines.forEach(line => {
        // Look for test file execution patterns
        if (line.includes('PASS') || line.includes('FAIL')) {
          completedTests++;
          
          // Update test file status
          const testFile = testFiles.find(tf => 
            line.includes(tf.file) || line.includes(tf.file.split('/').pop())
          );
          if (testFile) {
            testFile.status = line.includes('PASS') ? 'passed' : 'failed';
            currentTestFile = testFile.file;
          }
          
          if (line.includes('PASS')) {
            passedTests++;
          } else if (line.includes('FAIL')) {
            failedTests++;
          }
        }
      });
      
      console.log(`Test Progress: ${completedTests}/${testFiles.length} completed (${passedTests} passed, ${failedTests} failed)`);
    });
    
    testProcess.stderr.on('data', (data) => {
      console.error('Test stderr:', data.toString());
    });
    
    // Wait for test completion
    await new Promise((resolve, reject) => {
      testProcess.on('close', (code) => {
        clearTimeout(testTimeout);
        console.log(`Tests completed with code: ${code}`);
        resolve();
      });
      
      testProcess.on('error', (error) => {
        clearTimeout(testTimeout);
        console.error('Test process error:', error);
        reject(error);
      });
    });
    
    // Read the generated lcov.info file
    const lcovPath = path.join(__dirname, '..', 'coverage', 'lcov.info');
    if (fs.existsSync(lcovPath)) {
      const lcovData = fs.readFileSync(lcovPath, 'utf8');
      const coverage = calculateCoverageFromLcov(lcovData);
      
      // Store coverage data in Vercel Blob
      const coverageData = {
        coverage: coverage,
        timestamp: new Date().toISOString(),
        testsPassed: passedTests,
        testsFailed: failedTests,
        totalTests: testFiles.length,
        testResults: testFiles.map(tf => ({
          file: tf.file,
          category: tf.category,
          status: tf.status
        }))
      };
      
      const { put } = require('@vercel/blob');
      const blob = await put('coverage-data.json', JSON.stringify(coverageData, null, 2), {
        access: 'public',
        addRandomSuffix: false
      });
      
      console.log('Coverage data stored in Blob:', blob.url);
      
      res.json({
        success: true,
        message: 'Test coverage completed',
        data: {
          coverage: coverage,
          testsPassed: passedTests,
          testsFailed: failedTests,
          totalTests: testFiles.length,
          blobUrl: blob.url,
          testResults: testFiles.map(tf => ({
            file: tf.file,
            category: tf.category,
            status: tf.status
          }))
        }
      });
    } else {
      throw new Error('Coverage file not generated');
    }
  } catch (error) {
    console.error('Test coverage failed:', error);
    
    // Store fallback coverage data in Blob
    const fallbackData = {
      coverage: 0,
      timestamp: new Date().toISOString(),
      testsPassed: 0,
      testsFailed: 0,
      totalTests: 0,
      error: error.message
    };
    
    try {
      const { put } = require('@vercel/blob');
      const blob = await put('coverage-data.json', JSON.stringify(fallbackData, null, 2), {
        access: 'public',
        addRandomSuffix: false
      });
      
      console.log('Fallback coverage data stored in Blob:', blob.url);
    } catch (blobError) {
      console.error('Failed to store coverage data in Blob:', blobError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Test coverage failed',
      error: error.message,
      data: fallbackData
    });
  }
});

// Helper function to calculate security score
function calculateSecurityScore(reportData) {
  const totalVulns = reportData.summary.totalVulnerabilities;
  const codeIssues = reportData.summary.totalIssues;
  
  let score = 100;
  score -= (totalVulns * 10);
  score -= (codeIssues * 2);
  
  return Math.max(0, score);
}

// Helper function to calculate coverage from lcov.info
function calculateCoverageFromLcov(lcovData) {
  const lines = lcovData.split('\n');
  let totalLines = 0;
  let coveredLines = 0;
  
  lines.forEach(line => {
    if (line.startsWith('DA:')) {
      const parts = line.split(',');
      if (parts.length === 2) {
        const count = parseInt(parts[1]);
        totalLines++;
        if (count > 0) {
          coveredLines++;
        }
      }
    }
  });
  
  if (totalLines === 0) return 0;
  return Math.round((coveredLines / totalLines) * 100);
}

// Helper function to calculate overall coverage (legacy)
function calculateOverallCoverage(coverageData) {
  const files = Object.values(coverageData);
  if (files.length === 0) return 0;
  
  const totalCoverage = files.reduce((sum, file) => {
    return sum + (file.lines.pct || 0);
  }, 0);
  
  return Math.round(totalCoverage / files.length);
}

module.exports = router;
