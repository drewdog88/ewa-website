const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SecurityScanner {
  constructor() {
    this.scanResults = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      dependencies: [],
      codeIssues: [],
      recommendations: []
    };
  }

  async runFullScan() {
    console.log('🔍 Starting comprehensive security scan...');
    
    try {
      await this.scanDependencies();
      await this.scanCodeIssues();
      await this.generateRecommendations();
      
      return this.scanResults;
    } catch (error) {
      console.error('Security scan failed:', error);
      throw error;
    }
  }

  async scanDependencies() {
    console.log('📦 Scanning dependencies for vulnerabilities...');
    
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditResult);
      
      this.scanResults.dependencies = {
        vulnerabilities: auditData.vulnerabilities || {},
        metadata: auditData.metadata || {},
        advisories: auditData.advisories || {}
      };

      // Count vulnerabilities by severity
      const severityCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };

      Object.values(auditData.vulnerabilities || {}).forEach(vuln => {
        if (severityCounts.hasOwnProperty(vuln.severity)) {
          severityCounts[vuln.severity]++;
        }
      });

      this.scanResults.dependencies.severityCounts = severityCounts;
      
    } catch (error) {
      console.warn('npm audit failed:', error.message);
      this.scanResults.dependencies = {
        error: error.message,
        vulnerabilities: {},
        severityCounts: { critical: 0, high: 0, moderate: 0, low: 0 }
      };
    }
  }

  async scanCodeIssues() {
    console.log('🔍 Scanning code for security issues...');
    
    try {
      // Run ESLint with security rules
      const eslintResult = execSync('npx eslint . --format json', { encoding: 'utf8' });
      const eslintData = JSON.parse(eslintResult);
      
      this.scanResults.codeIssues = {
        totalIssues: eslintData.length,
        issues: eslintData,
        securityIssues: eslintData.filter(issue => 
          issue.ruleId && issue.ruleId.includes('security')
        )
      };
      
    } catch (error) {
      console.warn('ESLint scan failed:', error.message);
      this.scanResults.codeIssues = {
        error: error.message,
        totalIssues: 0,
        issues: [],
        securityIssues: []
      };
    }
  }

  async generateRecommendations() {
    console.log('💡 Generating security recommendations...');
    
    const recommendations = [];

    // Dependency recommendations
    const deps = this.scanResults.dependencies;
    if (deps.severityCounts) {
      if (deps.severityCounts.critical > 0) {
        recommendations.push({
          priority: 'critical',
          category: 'dependencies',
          message: `Found ${deps.severityCounts.critical} critical vulnerabilities in dependencies`,
          action: 'Run npm audit fix immediately'
        });
      }
      
      if (deps.severityCounts.high > 0) {
        recommendations.push({
          priority: 'high',
          category: 'dependencies',
          message: `Found ${deps.severityCounts.high} high severity vulnerabilities in dependencies`,
          action: 'Review and update vulnerable packages'
        });
      }
    }

    // Code quality recommendations
    const codeIssues = this.scanResults.codeIssues;
    if (codeIssues.totalIssues > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'code',
        message: `Found ${codeIssues.totalIssues} code quality issues`,
        action: 'Review and fix ESLint warnings'
      });
    }

    // General security recommendations
    recommendations.push({
      priority: 'medium',
      category: 'general',
      message: 'Enable Content Security Policy headers',
      action: 'Add CSP headers to prevent XSS attacks'
    });

    recommendations.push({
      priority: 'medium',
      category: 'general',
      message: 'Implement rate limiting',
      action: 'Add rate limiting to prevent brute force attacks'
    });

    recommendations.push({
      priority: 'high',
      category: 'general',
      message: 'Enable HTTPS only',
      action: 'Configure HSTS headers and redirect HTTP to HTTPS'
    });

    this.scanResults.recommendations = recommendations;
  }

  async generateReport() {
    const report = {
      summary: {
        timestamp: this.scanResults.timestamp,
        totalVulnerabilities: this.getTotalVulnerabilities(),
        totalIssues: this.scanResults.codeIssues.totalIssues || 0,
        recommendations: this.scanResults.recommendations.length
      },
      details: this.scanResults
    };

    // Save report to file
    const reportPath = path.join(__dirname, '..', 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Security report saved to: ${reportPath}`);
    return report;
  }

  getTotalVulnerabilities() {
    const counts = this.scanResults.dependencies.severityCounts || {};
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  }

  getSecurityScore() {
    const totalVulns = this.getTotalVulnerabilities();
    const codeIssues = this.scanResults.codeIssues.totalIssues || 0;
    
    // Calculate score (100 = perfect, 0 = critical issues)
    let score = 100;
    
    // Deduct points for vulnerabilities
    score -= (totalVulns * 10);
    
    // Deduct points for code issues
    score -= (codeIssues * 2);
    
    // Ensure score doesn't go below 0
    return Math.max(0, score);
  }
}

module.exports = SecurityScanner;
