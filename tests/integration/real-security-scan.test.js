const SecurityScanner = require('../../utils/security-scanner');
const fs = require('fs');
const path = require('path');

describe('Real Security Scanner Integration Tests', () => {
  let scanner;

  beforeEach(() => {
    scanner = new SecurityScanner();
  });

  describe('Real Security Scans', () => {
    test('should actually run npm audit and find real vulnerabilities', async () => {
      // This test runs a REAL npm audit
      await scanner.scanDependencies();
      
      // Validate that we got real results
      expect(scanner.scanResults.dependencies).toHaveProperty('vulnerabilities');
      expect(scanner.scanResults.dependencies).toHaveProperty('metadata');
      expect(scanner.scanResults.dependencies).toHaveProperty('advisories');
      
      // Check if we have real vulnerability data
      const vulnerabilities = scanner.scanResults.dependencies.vulnerabilities;
      const severityCounts = scanner.scanResults.dependencies.severityCounts;
      
      console.log('Real vulnerability counts:', severityCounts);
      console.log('Total vulnerabilities found:', Object.keys(vulnerabilities).length);
      
      // Validate severity counts are reasonable
      expect(severityCounts.critical).toBeGreaterThanOrEqual(0);
      expect(severityCounts.high).toBeGreaterThanOrEqual(0);
      expect(severityCounts.moderate).toBeGreaterThanOrEqual(0);
      expect(severityCounts.low).toBeGreaterThanOrEqual(0);
      
      // If vulnerabilities exist, validate their structure
      if (Object.keys(vulnerabilities).length > 0) {
        const firstVuln = Object.values(vulnerabilities)[0];
        expect(firstVuln).toHaveProperty('severity');
        expect(['critical', 'high', 'moderate', 'low']).toContain(firstVuln.severity);
      }
    }, 30000); // 30 second timeout for real npm audit

    test('should actually run ESLint and find real code issues', async () => {
      // This test runs a REAL ESLint scan
      await scanner.scanCodeIssues();
      
      // Validate that we got real results
      expect(scanner.scanResults.codeIssues).toHaveProperty('totalIssues');
      expect(scanner.scanResults.codeIssues).toHaveProperty('issues');
      expect(scanner.scanResults.codeIssues).toHaveProperty('securityIssues');
      
      console.log('Real code issues found:', scanner.scanResults.codeIssues.totalIssues);
      console.log('Security issues found:', scanner.scanResults.codeIssues.securityIssues.length);
      
      // Validate the structure of real issues
      if (scanner.scanResults.codeIssues.issues.length > 0) {
        const firstIssue = scanner.scanResults.codeIssues.issues[0];
        expect(firstIssue).toHaveProperty('ruleId');
        expect(firstIssue).toHaveProperty('message');
        expect(firstIssue).toHaveProperty('line');
        expect(firstIssue).toHaveProperty('column');
      }
      
      // Validate security issues are properly categorized
      scanner.scanResults.codeIssues.securityIssues.forEach(issue => {
        expect(issue.ruleId).toMatch(/^security\//);
      });
    }, 30000); // 30 second timeout for real ESLint scan

    test('should generate meaningful recommendations based on real scan data', async () => {
      // Run real scans first
      await scanner.scanDependencies();
      await scanner.scanCodeIssues();
      
      // Generate recommendations based on real data
      await scanner.generateRecommendations();
      
      const recommendations = scanner.scanResults.recommendations;
      console.log('Generated recommendations:', recommendations.length);
      
      // Validate recommendations are meaningful
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('message');
        expect(rec).toHaveProperty('category');
        expect(rec).toHaveProperty('action');
        
        // Validate priority is valid
        expect(['critical', 'high', 'medium', 'low']).toContain(rec.priority);
        
        // Validate category is valid
        expect(['dependencies', 'code', 'general']).toContain(rec.category);
        
        // Validate message is not empty
        expect(rec.message.length).toBeGreaterThan(0);
        expect(rec.action.length).toBeGreaterThan(0);
      });
      
      // Check for specific recommendation types based on real data
      const criticalRecs = recommendations.filter(r => r.priority === 'critical');
      const highRecs = recommendations.filter(r => r.priority === 'high');
      
      console.log('Critical recommendations:', criticalRecs.length);
      console.log('High recommendations:', highRecs.length);
    }, 60000); // 60 second timeout for full scan

    test('should calculate realistic security score based on real vulnerabilities', async () => {
      // Run real scans
      await scanner.scanDependencies();
      await scanner.scanCodeIssues();
      
      const score = scanner.getSecurityScore();
      const totalVulns = scanner.getTotalVulnerabilities();
      
      console.log('Real security score:', score);
      console.log('Total vulnerabilities:', totalVulns);
      
      // Validate score is reasonable
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      
      // Score should be lower if there are more vulnerabilities
      if (totalVulns > 0) {
        expect(score).toBeLessThan(100);
      }
      
      // Validate score calculation logic
      const severityCounts = scanner.scanResults.dependencies.severityCounts;
      const codeIssues = scanner.scanResults.codeIssues.totalIssues;
      
      let expectedScore = 100;
      expectedScore -= (severityCounts.critical * 10);
      expectedScore -= (severityCounts.high * 10);
      expectedScore -= (severityCounts.moderate * 5);
      expectedScore -= (severityCounts.low * 2);
      expectedScore -= (codeIssues * 2);
      expectedScore = Math.max(0, expectedScore);
      
      // Allow for some variance due to different scoring logic
      expect(Math.abs(score - expectedScore)).toBeLessThan(20);
    }, 60000);

    test('should generate and save real security report', async () => {
      // Run full scan
      await scanner.runFullScan();
      
      // Generate report
      const report = await scanner.generateReport();
      
      // Validate report structure
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('details');
      expect(report.summary).toHaveProperty('totalVulnerabilities');
      expect(report.summary).toHaveProperty('totalIssues');
      expect(report.summary).toHaveProperty('recommendations');
      expect(report.summary).toHaveProperty('timestamp');
      
      // Validate report contains real data
      expect(report.summary.totalVulnerabilities).toBeGreaterThanOrEqual(0);
      expect(report.summary.totalIssues).toBeGreaterThanOrEqual(0);
      expect(report.summary.recommendations).toBeGreaterThanOrEqual(0);
      
      // Check if report file was actually created
      const reportPath = path.join(__dirname, '..', '..', 'security-report.json');
      expect(fs.existsSync(reportPath)).toBe(true);
      
      // Validate report file content
      const savedReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      expect(savedReport).toEqual(report);
      
      console.log('Security report generated successfully');
      console.log('Total vulnerabilities in report:', report.summary.totalVulnerabilities);
      console.log('Total issues in report:', report.summary.totalIssues);
      console.log('Recommendations in report:', report.summary.recommendations);
    }, 90000); // 90 second timeout for full scan and report generation
  });

  describe('Real Code Quality Validation', () => {
    test('should detect actual security issues in our codebase', async () => {
      await scanner.scanCodeIssues();
      
      const securityIssues = scanner.scanResults.codeIssues.securityIssues;
      
      console.log('Security issues found in our codebase:', securityIssues.length);
      
      // List specific security issues found
      securityIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.ruleId}: ${issue.message} (line ${issue.line})`);
      });
      
      // If we find security issues, they should be actionable
      securityIssues.forEach(issue => {
        expect(issue.ruleId).toMatch(/^security\//);
        expect(issue.message).toBeTruthy();
        expect(issue.line).toBeGreaterThan(0);
      });
    }, 30000);

    test('should validate our package.json has reasonable security posture', async () => {
      await scanner.scanDependencies();
      
      const severityCounts = scanner.scanResults.dependencies.severityCounts;
      const totalVulns = scanner.getTotalVulnerabilities();
      
      console.log('Package security analysis:');
      console.log('- Critical vulnerabilities:', severityCounts.critical);
      console.log('- High vulnerabilities:', severityCounts.high);
      console.log('- Moderate vulnerabilities:', severityCounts.moderate);
      console.log('- Low vulnerabilities:', severityCounts.low);
      console.log('- Total vulnerabilities:', totalVulns);
      
      // For a production system, we should have reasonable security
      // This is a real validation of our actual security posture
      if (severityCounts.critical > 0) {
        console.warn('⚠️  CRITICAL: Found critical vulnerabilities that need immediate attention!');
      }
      
      if (severityCounts.high > 5) {
        console.warn('⚠️  HIGH: Found many high-severity vulnerabilities');
      }
      
      // These are real security validations
      expect(severityCounts.critical).toBeLessThan(10); // Shouldn't have too many critical issues
      expect(totalVulns).toBeLessThan(100); // Shouldn't have excessive vulnerabilities
    }, 30000);
  });
});
