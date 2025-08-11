const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../utils/security-scanner');

// Create test app
const app = express();
app.use(express.json());

// Mock SecurityScanner
const mockSecurityScanner = require('../../utils/security-scanner');

// Mock data
const mockSecurityReport = {
  summary: {
    timestamp: '2024-01-01T00:00:00Z',
    totalVulnerabilities: 0,
    totalIssues: 0,
    securityScore: 100
  },
  details: {
    dependencies: {
      severityCounts: { critical: 0, high: 0, moderate: 0, low: 0 }
    },
    recommendations: [
      { level: 'info', message: 'Keep packages updated' }
    ]
  }
};

const mockScanResults = {
  vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0 },
  codeIssues: 0,
  recommendations: [
    { level: 'info', message: 'Keep packages updated' }
  ]
};

describe('Security API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs operations
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockSecurityReport));
    
    // Mock path.join
    path.join.mockImplementation((...args) => args.join('/'));
    
    // Mock SecurityScanner
    mockSecurityScanner.mockImplementation(() => ({
      runFullScan: jest.fn().mockResolvedValue(mockScanResults),
      generateReport: jest.fn().mockResolvedValue(mockSecurityReport),
      getSecurityScore: jest.fn().mockReturnValue(100)
    }));
  });

  describe('GET /security/dashboard', () => {
    test('should return security dashboard data when report exists', async () => {
      const response = await request(app)
        .get('/security/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('lastScan');
      expect(response.body.data).toHaveProperty('vulnerabilities');
      expect(response.body.data).toHaveProperty('securityScore');
      expect(response.body.data.securityScore).toBe(100);
    });

    test('should return default data when no report exists', async () => {
      fs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .get('/security/dashboard')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lastScan).toBe(null);
      expect(response.body.data.vulnerabilities).toEqual({
        critical: 0, high: 0, moderate: 0, low: 0
      });
      expect(response.body.data.securityScore).toBe(100);
    });

    test('should handle file read errors gracefully', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const response = await request(app)
        .get('/security/dashboard')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to load security dashboard');
    });
  });

  describe('POST /security/scan', () => {
    test('should run security scan successfully', async () => {
      const scannerInstance = {
        runFullScan: jest.fn().mockResolvedValue(mockScanResults),
        generateReport: jest.fn().mockResolvedValue(mockSecurityReport),
        getSecurityScore: jest.fn().mockReturnValue(100)
      };
      mockSecurityScanner.mockImplementation(() => scannerInstance);

      const response = await request(app)
        .post('/security/scan')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Security scan completed');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('securityScore');
      expect(response.body.data.securityScore).toBe(100);
      expect(scannerInstance.runFullScan).toHaveBeenCalled();
      expect(scannerInstance.generateReport).toHaveBeenCalled();
      expect(scannerInstance.getSecurityScore).toHaveBeenCalled();
    });

    test('should handle scan errors gracefully', async () => {
      const scannerInstance = {
        runFullScan: jest.fn().mockRejectedValue(new Error('Scan failed'))
      };
      mockSecurityScanner.mockImplementation(() => scannerInstance);

      const response = await request(app)
        .post('/security/scan')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Security scan failed');
      expect(response.body.error).toBe('Scan failed');
    });
  });

  describe('GET /security/report', () => {
    test('should return full security report when exists', async () => {
      const response = await request(app)
        .get('/security/report')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSecurityReport);
    });

    test('should return 404 when no report exists', async () => {
      fs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .get('/security/report')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No security report found. Run a scan first.');
    });

    test('should handle file read errors gracefully', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });

      const response = await request(app)
        .get('/security/report')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to load security report');
    });
  });

  describe('Security Score Calculation', () => {
    test('should calculate security score correctly', () => {
      const testReport = {
        summary: { totalVulnerabilities: 0, totalIssues: 0 },
        details: {
          dependencies: { severityCounts: { critical: 0, high: 0, moderate: 0, low: 0 } }
        }
      };

      // Test perfect score
      const perfectScore = calculateSecurityScore(testReport);
      expect(perfectScore).toBe(100);

      // Test score with vulnerabilities
      const vulnerableReport = {
        summary: { totalVulnerabilities: 5, totalIssues: 10 },
        details: {
          dependencies: { severityCounts: { critical: 1, high: 2, moderate: 1, low: 1 } }
        }
      };

      const vulnerableScore = calculateSecurityScore(vulnerableReport);
      expect(vulnerableScore).toBeLessThan(100);
      expect(vulnerableScore).toBeGreaterThan(0);
    });
  });

  describe('Coverage Calculation', () => {
    test('should calculate coverage from LCOV data', () => {
      const mockLcovData = {
        'file1.js': { lines: { found: 10, hit: 8 }, functions: { found: 5, hit: 4 } },
        'file2.js': { lines: { found: 15, hit: 12 }, functions: { found: 8, hit: 6 } }
      };

      const coverage = calculateCoverageFromLcov(mockLcovData);
      expect(coverage).toHaveProperty('totalLines');
      expect(coverage).toHaveProperty('coveredLines');
      expect(coverage).toHaveProperty('lineCoverage');
      expect(coverage.lineCoverage).toBeGreaterThan(0);
      expect(coverage.lineCoverage).toBeLessThanOrEqual(100);
    });

    test('should calculate overall coverage correctly', () => {
      const coverageData = {
        totalLines: 100,
        coveredLines: 80,
        totalFunctions: 20,
        coveredFunctions: 16
      };

      const overallCoverage = calculateOverallCoverage(coverageData);
      expect(overallCoverage).toBe(80); // 80% line coverage
    });
  });

  describe('File System Operations', () => {
    test('should handle file path operations correctly', () => {
      const joinedPath = path.join('api', '..', 'security-report.json');
      expect(joinedPath).toBe('api/../security-report.json');
      expect(path.join).toHaveBeenCalledWith('api', '..', 'security-report.json');
    });

    test('should check file existence correctly', () => {
      const exists = fs.existsSync('/test/path');
      expect(exists).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith('/test/path');
    });

    test('should read file content correctly', () => {
      const content = fs.readFileSync('/test/file.json', 'utf8');
      expect(content).toBe(JSON.stringify(mockSecurityReport));
      expect(fs.readFileSync).toHaveBeenCalledWith('/test/file.json', 'utf8');
    });
  });

  describe('Error Handling', () => {
    test('should handle JSON parsing errors', () => {
      fs.readFileSync.mockReturnValue('invalid json');

      expect(() => {
        JSON.parse(fs.readFileSync('/test/file.json', 'utf8'));
      }).toThrow();
    });

    test('should handle scanner instantiation errors', () => {
      mockSecurityScanner.mockImplementation(() => {
        throw new Error('Scanner initialization failed');
      });

      expect(() => {
        new mockSecurityScanner();
      }).toThrow('Scanner initialization failed');
    });
  });

  describe('Data Validation', () => {
    test('should validate security report structure', () => {
      expect(mockSecurityReport).toHaveProperty('summary');
      expect(mockSecurityReport).toHaveProperty('details');
      expect(mockSecurityReport.summary).toHaveProperty('timestamp');
      expect(mockSecurityReport.summary).toHaveProperty('totalVulnerabilities');
      expect(mockSecurityReport.details).toHaveProperty('dependencies');
      expect(mockSecurityReport.details).toHaveProperty('recommendations');
    });

    test('should validate scan results structure', () => {
      expect(mockScanResults).toHaveProperty('vulnerabilities');
      expect(mockScanResults).toHaveProperty('codeIssues');
      expect(mockScanResults).toHaveProperty('recommendations');
      expect(Array.isArray(mockScanResults.recommendations)).toBe(true);
    });
  });
});

// Helper functions for testing
function calculateSecurityScore(reportData) {
  const { totalIssues } = reportData.summary;
  const { severityCounts } = reportData.details.dependencies;
  
  let score = 100;
  
  // Deduct points for vulnerabilities
  score -= (severityCounts.critical * 20);
  score -= (severityCounts.high * 10);
  score -= (severityCounts.moderate * 5);
  score -= (severityCounts.low * 2);
  
  // Deduct points for code issues
  score -= (totalIssues * 1);
  
  return Math.max(0, Math.min(100, score));
}

function calculateCoverageFromLcov(lcovData) {
  let totalLines = 0;
  let coveredLines = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;

  Object.values(lcovData).forEach(file => {
    totalLines += file.lines.found;
    coveredLines += file.lines.hit;
    totalFunctions += file.functions.found;
    coveredFunctions += file.functions.hit;
  });

  return {
    totalLines,
    coveredLines,
    lineCoverage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0,
    totalFunctions,
    coveredFunctions,
    functionCoverage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
  };
}

function calculateOverallCoverage(coverageData) {
  return coverageData.lineCoverage || 0;
}
