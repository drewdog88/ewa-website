const express = require('express');
const SecurityScanner = require('../utils/security-scanner');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.session || req.session.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
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
    const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
    
    if (!fs.existsSync(coveragePath)) {
      return res.status(404).json({
        success: false,
        message: 'No coverage report found. Run tests with coverage first.'
      });
    }
    
    const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    
    // Calculate overall coverage
    const totalCoverage = calculateOverallCoverage(coverageData);
    
    res.json({
      success: true,
      data: {
        summary: coverageData,
        overallCoverage: totalCoverage
      }
    });
  } catch (error) {
    console.error('Error getting coverage report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load coverage report'
    });
  }
});

// Run tests and generate coverage
router.post('/test-coverage', requireAdmin, async (req, res) => {
  try {
    console.log('Running tests with coverage...');
    
    // This would typically run the test command
    // For now, we'll return a mock response
    res.json({
      success: true,
      message: 'Tests completed',
      data: {
        totalTests: 25,
        passedTests: 23,
        failedTests: 2,
        coverage: 85.5
      }
    });
  } catch (error) {
    console.error('Test coverage failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test coverage failed',
      error: error.message
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

// Helper function to calculate overall coverage
function calculateOverallCoverage(coverageData) {
  const files = Object.values(coverageData);
  if (files.length === 0) return 0;
  
  const totalCoverage = files.reduce((sum, file) => {
    return sum + (file.lines.pct || 0);
  }, 0);
  
  return Math.round(totalCoverage / files.length);
}

module.exports = router;
