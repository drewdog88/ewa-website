const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock file system operations
jest.mock('fs');
jest.mock('path');
jest.mock('child_process');

// Import the SecurityScanner class
const SecurityScanner = require('../../utils/security-scanner');

describe('SecurityScanner Unit Tests', () => {
  let scanner;

  beforeEach(() => {
    jest.clearAllMocks();
    scanner = new SecurityScanner();
  });

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      expect(scanner.scanResults).toHaveProperty('timestamp');
      expect(scanner.scanResults).toHaveProperty('vulnerabilities');
      expect(scanner.scanResults).toHaveProperty('dependencies');
      expect(scanner.scanResults).toHaveProperty('codeIssues');
      expect(scanner.scanResults).toHaveProperty('recommendations');
    });

    test('should set timestamp to current time', () => {
      const now = new Date();
      const timestamp = scanner.scanResults.timestamp;
      const scanTime = new Date(timestamp);
      
      // Should be within 1 second of current time
      expect(Math.abs(scanTime.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('runFullScan', () => {
    test('should run complete security scan successfully', async () => {
      // Mock successful npm audit
      execSync.mockReturnValueOnce(JSON.stringify({
        vulnerabilities: {},
        metadata: {},
        advisories: {}
      }));

      // Mock successful ESLint scan
      execSync.mockReturnValueOnce(JSON.stringify([]));

      const results = await scanner.runFullScan();

      expect(results).toHaveProperty('timestamp');
      expect(results).toHaveProperty('dependencies');
      expect(results).toHaveProperty('codeIssues');
      expect(results).toHaveProperty('recommendations');
    });

    test('should handle npm audit failures gracefully', async () => {
      // Mock npm audit failure
      execSync.mockImplementationOnce(() => {
        throw new Error('npm audit failed');
      });

      // Mock successful ESLint scan
      execSync.mockReturnValueOnce(JSON.stringify([]));

      const results = await scanner.runFullScan();

      expect(results.dependencies).toHaveProperty('error');
      expect(results.dependencies.error).toBe('npm audit failed');
    });

    test('should handle ESLint failures gracefully', async () => {
      // Mock successful npm audit
      execSync.mockReturnValueOnce(JSON.stringify({
        vulnerabilities: {},
        metadata: {},
        advisories: {}
      }));

      // Mock ESLint failure
      execSync.mockImplementationOnce(() => {
        throw new Error('ESLint failed');
      });

      const results = await scanner.runFullScan();

      expect(results.codeIssues).toHaveProperty('error');
      expect(results.codeIssues.error).toBe('ESLint failed');
    });
  });

  describe('scanDependencies', () => {
    test('should parse npm audit results correctly', async () => {
      const mockAuditData = {
        vulnerabilities: {
          'package1': { severity: 'high' },
          'package2': { severity: 'critical' }
        },
        metadata: { auditVersion: '1.0.0' },
        advisories: { '1': { title: 'Test advisory' } }
      };

      execSync.mockReturnValueOnce(JSON.stringify(mockAuditData));

      await scanner.scanDependencies();

      expect(scanner.scanResults.dependencies.vulnerabilities).toEqual(mockAuditData.vulnerabilities);
      expect(scanner.scanResults.dependencies.metadata).toEqual(mockAuditData.metadata);
      expect(scanner.scanResults.dependencies.advisories).toEqual(mockAuditData.advisories);
    });

    test('should calculate severity counts correctly', async () => {
      const mockAuditData = {
        vulnerabilities: {
          'package1': { severity: 'high' },
          'package2': { severity: 'critical' },
          'package3': { severity: 'moderate' },
          'package4': { severity: 'low' }
        }
      };

      execSync.mockReturnValueOnce(JSON.stringify(mockAuditData));

      await scanner.scanDependencies();

      expect(scanner.scanResults.dependencies.severityCounts).toEqual({
        critical: 1,
        high: 1,
        moderate: 1,
        low: 1
      });
    });
  });

  describe('scanCodeIssues', () => {
    test('should parse ESLint results correctly', async () => {
      const mockEslintData = [
        { ruleId: 'security/no-eval', message: 'eval is dangerous' },
        { ruleId: 'no-console', message: 'console.log found' }
      ];

      execSync.mockReturnValueOnce(JSON.stringify(mockEslintData));

      await scanner.scanCodeIssues();

      expect(scanner.scanResults.codeIssues.totalIssues).toBe(2);
      expect(scanner.scanResults.codeIssues.issues).toEqual(mockEslintData);
      expect(scanner.scanResults.codeIssues.securityIssues).toHaveLength(1);
    });

    test('should filter security issues correctly', async () => {
      const mockEslintData = [
        { ruleId: 'security/no-eval', message: 'eval is dangerous' },
        { ruleId: 'no-console', message: 'console.log found' },
        { ruleId: 'security/no-innerhtml', message: 'innerHTML is dangerous' }
      ];

      execSync.mockReturnValueOnce(JSON.stringify(mockEslintData));

      await scanner.scanCodeIssues();

      expect(scanner.scanResults.codeIssues.securityIssues).toHaveLength(2);
      expect(scanner.scanResults.codeIssues.securityIssues[0].ruleId).toBe('security/no-eval');
      expect(scanner.scanResults.codeIssues.securityIssues[1].ruleId).toBe('security/no-innerhtml');
    });
  });

  describe('generateRecommendations', () => {
    test('should generate recommendations for critical vulnerabilities', async () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 2,
        high: 1,
        moderate: 0,
        low: 0
      };

      scanner.scanResults.codeIssues.totalIssues = 5;

      await scanner.generateRecommendations();

      const recommendations = scanner.scanResults.recommendations;
      expect(recommendations).toHaveLength(4); // 2 critical + 1 high + 1 code + 1 general

      const criticalRec = recommendations.find(r => r.priority === 'critical');
      expect(criticalRec).toBeDefined();
      expect(criticalRec.message).toContain('2 critical vulnerabilities');
    });

    test('should generate recommendations for code issues', async () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };

      scanner.scanResults.codeIssues.totalIssues = 10;

      await scanner.generateRecommendations();

      const recommendations = scanner.scanResults.recommendations;
      const codeRec = recommendations.find(r => r.category === 'code');
      expect(codeRec).toBeDefined();
      expect(codeRec.message).toContain('10 code quality issues');
    });

    test('should always include general security recommendations', async () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };

      scanner.scanResults.codeIssues.totalIssues = 0;

      await scanner.generateRecommendations();

      const recommendations = scanner.scanResults.recommendations;
      expect(recommendations.length).toBeGreaterThan(0);

      const generalRecs = recommendations.filter(r => r.category === 'general');
      expect(generalRecs.length).toBeGreaterThan(0);
    });
  });

  describe('generateReport', () => {
    test('should generate comprehensive report', async () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 1,
        high: 2,
        moderate: 3,
        low: 4
      };

      scanner.scanResults.codeIssues.totalIssues = 5;
      scanner.scanResults.recommendations = [
        { priority: 'critical', message: 'Fix critical issue' }
      ];

      const report = await scanner.generateReport();

      expect(report.summary.totalVulnerabilities).toBe(10);
      expect(report.summary.totalIssues).toBe(5);
      expect(report.summary.recommendations).toBe(1);
      expect(report.details).toEqual(scanner.scanResults);
    });

    test('should save report to file', async () => {
      const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync');
      const mockJoin = jest.spyOn(path, 'join').mockReturnValue('/mock/path/security-report.json');

      await scanner.generateReport();

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/mock/path/security-report.json',
        expect.any(String)
      );

      mockWriteFileSync.mockRestore();
      mockJoin.mockRestore();
    });
  });

  describe('getTotalVulnerabilities', () => {
    test('should return correct total vulnerability count', () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 1,
        high: 2,
        moderate: 3,
        low: 4
      };

      const total = scanner.getTotalVulnerabilities();
      expect(total).toBe(10);
    });

    test('should return 0 when no vulnerabilities', () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };

      const total = scanner.getTotalVulnerabilities();
      expect(total).toBe(0);
    });

    test('should handle missing severity counts', () => {
      scanner.scanResults.dependencies = {};

      const total = scanner.getTotalVulnerabilities();
      expect(total).toBe(0);
    });
  });

  describe('getSecurityScore', () => {
    test('should calculate perfect score for clean codebase', () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };

      scanner.scanResults.codeIssues.totalIssues = 0;

      const score = scanner.getSecurityScore();
      expect(score).toBe(100);
    });

    test('should deduct points for vulnerabilities', () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 1,
        high: 2,
        moderate: 0,
        low: 0
      };

      scanner.scanResults.codeIssues.totalIssues = 0;

      const score = scanner.getSecurityScore();
      expect(score).toBe(70); // 100 - (3 * 10)
    });

    test('should deduct points for code issues', () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };

      scanner.scanResults.codeIssues.totalIssues = 5;

      const score = scanner.getSecurityScore();
      expect(score).toBe(90); // 100 - (5 * 2)
    });

    test('should not return negative score', () => {
      scanner.scanResults.dependencies.severityCounts = {
        critical: 20,
        high: 0,
        moderate: 0,
        low: 0
      };

      scanner.scanResults.codeIssues.totalIssues = 0;

      const score = scanner.getSecurityScore();
      expect(score).toBe(0); // Should not go below 0
    });
  });
});
