const request = require('supertest');
const { _createTestData, _mockUtils } = require('../helpers/test-setup');

// Mock external dependencies
jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  get: jest.fn(),
  del: jest.fn()
}));

jest.mock('../../utils/security-scanner', () => {
  return jest.fn().mockImplementation(() => ({
    runFullScan: jest.fn(),
    generateReport: jest.fn(),
    getSecurityScore: jest.fn(),
    runTestCoverage: jest.fn()
  }));
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Import the security dashboard app
const securityApp = require('../../api/security-dashboard');

describe('Security Dashboard API Unit Tests', () => {
  const { put, get } = require('@vercel/blob');
  const SecurityScanner = require('../../utils/security-scanner');
  const fs = require('fs');
  const { execSync } = require('child_process');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/security/dashboard', () => {
    test('should return 200 with security dashboard data from Blob', async () => {
      const mockReportData = {
        summary: {
          timestamp: '2024-01-01T00:00:00Z',
          totalIssues: 5
        },
        details: {
          dependencies: {
            severityCounts: { critical: 1, high: 2, moderate: 1, low: 1 }
          },
          recommendations: ['Update dependencies', 'Fix security headers']
        }
      };

      get.mockResolvedValue({ url: 'https://blob.url/security-report.json' });
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockReportData)
      });

      const response = await request(securityApp)
        .get('/api/security/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('lastScan', '2024-01-01T00:00:00Z');
      expect(response.body.data).toHaveProperty('vulnerabilities');
      expect(response.body.data).toHaveProperty('codeIssues', 5);
      expect(response.body.data).toHaveProperty('securityScore');
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should return 200 with security dashboard data from local fallback', async () => {
      const mockReportData = {
        summary: {
          timestamp: '2024-01-01T00:00:00Z',
          totalIssues: 3
        },
        details: {
          dependencies: {
            severityCounts: { critical: 0, high: 1, moderate: 1, low: 1 }
          },
          recommendations: ['Update dependencies']
        }
      };

      get.mockRejectedValue(new Error('Blob not found'));
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockReportData));

      const response = await request(securityApp)
        .get('/api/security/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('lastScan', '2024-01-01T00:00:00Z');
      expect(response.body.data).toHaveProperty('codeIssues', 3);
    });

    test('should return 200 with default data when no reports available', async () => {
      get.mockRejectedValue(new Error('Blob not found'));
      fs.existsSync.mockReturnValue(false);

      const response = await request(securityApp)
        .get('/api/security/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('lastScan', null);
      expect(response.body.data).toHaveProperty('vulnerabilities');
      expect(response.body.data).toHaveProperty('codeIssues', 0);
      expect(response.body.data).toHaveProperty('securityScore', 100);
      expect(response.body.data).toHaveProperty('recommendations');
    });

    test('should handle errors gracefully', async () => {
      get.mockRejectedValue(new Error('Blob error'));
      fs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const response = await request(securityApp)
        .get('/api/security/dashboard');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Failed to load security dashboard');
    });
  });

  describe('POST /api/security/scan', () => {
    test('should return 200 with scan results', async () => {
      const mockScanner = {
        runFullScan: jest.fn().mockResolvedValue({ success: true }),
        generateReport: jest.fn().mockResolvedValue({
          summary: { timestamp: '2024-01-01T00:00:00Z', totalIssues: 2 },
          details: { dependencies: { severityCounts: { critical: 0, high: 1, moderate: 0, low: 1 } } }
        }),
        getSecurityScore: jest.fn().mockReturnValue(85)
      };

      SecurityScanner.mockImplementation(() => mockScanner);
      put.mockResolvedValue({ url: 'https://blob.url/security-report.json' });

      const response = await request(securityApp)
        .post('/api/security/scan');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Security scan completed');
      expect(response.body.data).toHaveProperty('securityScore', 85);
      expect(response.body.data).toHaveProperty('summary');
    });

    test('should handle scanner errors gracefully', async () => {
      const mockScanner = {
        runFullScan: jest.fn().mockRejectedValue(new Error('Scan failed'))
      };

      SecurityScanner.mockImplementation(() => mockScanner);

      const response = await request(securityApp)
        .post('/api/security/scan');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Security scan failed');
    });

    test('should handle blob storage errors gracefully', async () => {
      const mockScanner = {
        runFullScan: jest.fn().mockResolvedValue({ success: true }),
        generateReport: jest.fn().mockResolvedValue({ summary: {}, details: {} }),
        getSecurityScore: jest.fn().mockReturnValue(90)
      };

      SecurityScanner.mockImplementation(() => mockScanner);
      put.mockRejectedValue(new Error('Blob storage failed'));

      const response = await request(securityApp)
        .post('/api/security/scan');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      // Should still succeed even if blob storage fails
    });
  });

  describe('POST /api/security/test-coverage', () => {
    test('should return 200 with test coverage results', async () => {
      const _mockCoverageData = {
        coverage: 85.5,
        timestamp: '2024-01-01T00:00:00Z',
        testsPassed: true
      };

      execSync.mockReturnValue(Buffer.from('Test output'));
      put.mockResolvedValue({ url: 'https://blob.url/coverage-data.json' });

      const response = await request(securityApp)
        .post('/api/security/test-coverage');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Test coverage completed (fallback)');
      expect(response.body.data).toHaveProperty('coverage');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('testsPassed');
    });

    test('should handle test execution errors gracefully', async () => {
      execSync.mockImplementation(() => {
        throw new Error('Test execution failed');
      });

      const response = await request(securityApp)
        .post('/api/security/test-coverage');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('Test coverage completed (fallback)');
    });

    test('should handle blob storage errors gracefully', async () => {
      execSync.mockReturnValue(Buffer.from('Test output'));
      put.mockRejectedValue(new Error('Blob storage failed'));

      const response = await request(securityApp)
        .post('/api/security/test-coverage');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      // Should still succeed even if blob storage fails
    });
  });

  describe('GET /api/security/coverage', () => {
    test('should return 200 with coverage data from Blob', async () => {
      const mockCoverageData = {
        coverage: 87.2,
        timestamp: '2024-01-01T00:00:00Z',
        testsPassed: true
      };

      get.mockResolvedValue({ url: 'https://blob.url/coverage-data.json' });
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockCoverageData)
      });

      const response = await request(securityApp)
        .get('/api/security/coverage');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Coverage data from Vercel Blob');
      expect(response.body.data).toHaveProperty('overallCoverage', 87.2);
      expect(response.body.data).toHaveProperty('timestamp', '2024-01-01T00:00:00Z');
      expect(response.body.data).toHaveProperty('testsPassed', true);
    });

    test('should return 200 with coverage data from local fallback', async () => {
      const mockCoverageData = {
        coverage: 82.1,
        timestamp: '2024-01-01T00:00:00Z',
        testsPassed: true
      };

      get.mockRejectedValue(new Error('Blob not found'));
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockCoverageData));

      const response = await request(securityApp)
        .get('/api/security/coverage');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Coverage data from local file');
      expect(response.body.data).toHaveProperty('overallCoverage', 82.1);
    });

    test('should return 404 when no coverage data available', async () => {
      get.mockRejectedValue(new Error('Blob not found'));
      fs.existsSync.mockReturnValue(false);

      const response = await request(securityApp)
        .get('/api/security/coverage');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('No coverage report found. Run tests with coverage first.');
    });
  });

  describe('GET /api/security/report', () => {
    test('should return 200 with full security report', async () => {
      const mockReportData = {
        summary: { timestamp: '2024-01-01T00:00:00Z', totalIssues: 3 },
        details: { dependencies: {}, recommendations: [] }
      };

      get.mockResolvedValue({ url: 'https://blob.url/security-report.json' });
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(mockReportData)
      });

      const response = await request(securityApp)
        .get('/api/security/report');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toEqual(mockReportData);
    });

    test('should return 404 when no report available', async () => {
      get.mockRejectedValue(new Error('Blob not found'));
      fs.existsSync.mockReturnValue(false);

      const response = await request(securityApp)
        .get('/api/security/report');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('No security report found. Run a scan first.');
    });
  });
});
