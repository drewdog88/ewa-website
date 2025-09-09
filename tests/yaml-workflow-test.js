#!/usr/bin/env node

/**
 * YAML Workflow Test Suite
 * 
 * This script validates the GitHub Actions workflow YAML files
 * to ensure they have proper syntax and configuration.
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class YAMLWorkflowTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
  }

  async addTestResult(name, passed, message, details = null) {
    const result = {
      name,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    this.testResults.push(result);
    
    const icon = passed ? '✅' : '❌';
    await this.log(`${icon} ${name}: ${message}`);
    
    if (details) {
      await this.log(`   Details: ${details}`);
    }
  }

  async testYAMLSyntax(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const parsed = yaml.load(content);
      
      await this.addTestResult(
        `YAML Syntax: ${filePath}`,
        true,
        'Valid YAML syntax',
        `Parsed successfully, ${Object.keys(parsed).length} top-level keys`
      );
      
      return parsed;
    } catch (error) {
      await this.addTestResult(
        `YAML Syntax: ${filePath}`,
        false,
        'Invalid YAML syntax',
        error.message
      );
      return null;
    }
  }

  async testWorkflowStructure(workflow, filePath) {
    if (!workflow) return;

    // Test required top-level keys
    const requiredKeys = ['name', 'on', 'jobs'];
    for (const key of requiredKeys) {
      const hasKey = workflow.hasOwnProperty(key);
      await this.addTestResult(
        `Structure: ${filePath} - ${key}`,
        hasKey,
        hasKey ? `Has ${key} property` : `Missing ${key} property`,
        hasKey ? `${key}: ${workflow[key]}` : 'Required for GitHub Actions'
      );
    }

    // Test 'on' section
    if (workflow.on) {
      const hasSchedule = workflow.on.schedule || workflow.on.schedule;
      const hasWorkflowDispatch = workflow.on.workflow_dispatch;
      
      await this.addTestResult(
        `Trigger: ${filePath} - schedule`,
        !!hasSchedule,
        hasSchedule ? 'Has schedule trigger' : 'Missing schedule trigger',
        hasSchedule ? 'Automated execution configured' : 'Need schedule for automated backups'
      );

      await this.addTestResult(
        `Trigger: ${filePath} - workflow_dispatch`,
        !!hasWorkflowDispatch,
        hasWorkflowDispatch ? 'Has manual trigger' : 'Missing manual trigger',
        hasWorkflowDispatch ? 'Can be triggered manually' : 'Should allow manual execution'
      );
    }

    // Test jobs section
    if (workflow.jobs) {
      const jobNames = Object.keys(workflow.jobs);
      await this.addTestResult(
        `Jobs: ${filePath} - count`,
        jobNames.length > 0,
        jobNames.length > 0 ? `Has ${jobNames.length} job(s)` : 'No jobs defined',
        jobNames.length > 0 ? `Jobs: ${jobNames.join(', ')}` : 'Need at least one job'
      );

      // Test each job
      for (const jobName of jobNames) {
        const job = workflow.jobs[jobName];
        
        // Test runs-on
        const hasRunsOn = job.runs_on || job['runs-on'];
        await this.addTestResult(
          `Job: ${filePath} - ${jobName} runs-on`,
          !!hasRunsOn,
          hasRunsOn ? `Uses ${hasRunsOn}` : 'Missing runs-on',
          hasRunsOn ? `Runner: ${hasRunsOn}` : 'Need to specify runner'
        );

        // Test steps
        if (job.steps && Array.isArray(job.steps)) {
          await this.addTestResult(
            `Job: ${filePath} - ${jobName} steps`,
            job.steps.length > 0,
            job.steps.length > 0 ? `Has ${job.steps.length} step(s)` : 'No steps defined',
            job.steps.length > 0 ? 'Steps configured' : 'Need at least one step'
          );

          // Test for required steps
          const stepNames = job.steps.map(step => step.name || step.uses || 'unnamed').join(', ');
          const hasCheckout = job.steps.some(step => 
            step.uses && step.uses.includes('actions/checkout')
          );
          const hasPostgresInstall = job.steps.some(step => 
            step.name && step.name.toLowerCase().includes('postgresql')
          );
          const hasVercelCLI = job.steps.some(step => 
            step.name && step.name.toLowerCase().includes('vercel')
          );
          const hasPgDump = job.steps.some(step => 
            step.run && step.run.includes('pg_dump')
          );
          const hasBlobUpload = job.steps.some(step => 
            step.run && step.run.includes('vercel blob put')
          );

          await this.addTestResult(
            `Steps: ${filePath} - ${jobName} checkout`,
            hasCheckout,
            hasCheckout ? 'Has checkout step' : 'Missing checkout step',
            hasCheckout ? 'Code checkout configured' : 'Need actions/checkout@v4'
          );

          await this.addTestResult(
            `Steps: ${filePath} - ${jobName} postgresql`,
            hasPostgresInstall,
            hasPostgresInstall ? 'Has PostgreSQL installation' : 'Missing PostgreSQL installation',
            hasPostgresInstall ? 'PostgreSQL client will be installed' : 'Need PostgreSQL client for pg_dump'
          );

          await this.addTestResult(
            `Steps: ${filePath} - ${jobName} vercel-cli`,
            hasVercelCLI,
            hasVercelCLI ? 'Has Vercel CLI installation' : 'Missing Vercel CLI installation',
            hasVercelCLI ? 'Vercel CLI will be installed' : 'Need Vercel CLI for blob upload'
          );

          await this.addTestResult(
            `Steps: ${filePath} - ${jobName} pg_dump`,
            hasPgDump,
            hasPgDump ? 'Has pg_dump execution' : 'Missing pg_dump execution',
            hasPgDump ? 'Database backup configured' : 'Need pg_dump for database backup'
          );

          await this.addTestResult(
            `Steps: ${filePath} - ${jobName} blob-upload`,
            hasBlobUpload,
            hasBlobUpload ? 'Has blob upload' : 'Missing blob upload',
            hasBlobUpload ? 'Vercel Blob upload configured' : 'Need vercel blob put for upload'
          );
        }
      }
    }
  }

  async testEnvironmentVariables(workflow, filePath) {
    if (!workflow) return;

    // Look for environment variables in the workflow
    const envVars = [];
    
    // Check env section
    if (workflow.env) {
      Object.keys(workflow.env).forEach(key => {
        envVars.push({ name: key, source: 'workflow.env' });
      });
    }

    // Check job-level env
    if (workflow.jobs) {
      Object.values(workflow.jobs).forEach(job => {
        if (job.env) {
          Object.keys(job.env).forEach(key => {
            envVars.push({ name: key, source: 'job.env' });
          });
        }
      });
    }

    // Check step-level env
    if (workflow.jobs) {
      Object.values(workflow.jobs).forEach(job => {
        if (job.steps) {
          job.steps.forEach(step => {
            if (step.env) {
              Object.keys(step.env).forEach(key => {
                envVars.push({ name: key, source: 'step.env' });
              });
            }
          });
        }
      });
    }

    // Test for required environment variables
    const requiredVars = ['DATABASE_URL', 'BLOB_READ_WRITE_TOKEN'];
    const foundVars = envVars.map(v => v.name);
    
    for (const requiredVar of requiredVars) {
      const hasVar = foundVars.includes(requiredVar);
      await this.addTestResult(
        `Environment: ${filePath} - ${requiredVar}`,
        hasVar,
        hasVar ? `${requiredVar} is configured` : `${requiredVar} is missing`,
        hasVar ? `Found in workflow configuration` : 'Required for backup functionality'
      );
    }

    // Test for secrets usage
    const hasSecrets = envVars.some(v => 
      v.name.includes('secrets.') || 
      (workflow.env && workflow.env[v.name] && workflow.env[v.name].includes('secrets.'))
    ) || (workflow.env && Object.values(workflow.env).some(value => 
      typeof value === 'string' && value.includes('secrets.')
    ));
    
    await this.addTestResult(
      `Secrets: ${filePath} - usage`,
      hasSecrets,
      hasSecrets ? 'Uses GitHub secrets' : 'No secrets configured',
      hasSecrets ? 'Secrets properly referenced' : 'Need to use ${{ secrets.* }} for sensitive data'
    );
  }

  async testWorkflowFile(filePath) {
    await this.log(`🧪 Testing workflow file: ${filePath}`);
    
    const workflow = await this.testYAMLSyntax(filePath);
    await this.testWorkflowStructure(workflow, filePath);
    await this.testEnvironmentVariables(workflow, filePath);
  }

  async runAllTests() {
    await this.log('🚀 Starting YAML Workflow Test Suite');
    await this.log(`📅 Date: ${new Date().toISOString()}`);
    
    const workflowFiles = [
      '.github/workflows/simple-daily-backup.yml',
      '.github/workflows/simple-weekly-backup.yml',
      '.github/workflows/comprehensive-weekly-backup.yml'
    ];

    for (const workflowFile of workflowFiles) {
      try {
        await this.testWorkflowFile(workflowFile);
      } catch (error) {
        await this.addTestResult(
          `File: ${workflowFile}`,
          false,
          'Failed to test workflow file',
          error.message
        );
      }
    }

    // Generate test report
    await this.generateTestReport();
  }

  async generateTestReport() {
    const duration = Date.now() - this.startTime;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);

    await this.log('\n🎯 YAML Workflow Test Results Summary:');
    await this.log('============================================================');
    await this.log(`Total Tests: ${totalTests}`);
    await this.log(`Passed: ${passedTests} ✅`);
    await this.log(`Failed: ${totalTests - passedTests} ❌`);
    await this.log(`Success Rate: ${successRate}%`);
    await this.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      duration: duration,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate: parseFloat(successRate)
      },
      tests: this.testResults
    };

    try {
      const reportFile = path.join(__dirname, '..', 'yaml-workflow-test-report.json');
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      await this.log(`📄 Detailed report saved: ${reportFile}`);
    } catch (error) {
      await this.log(`❌ Failed to save test report: ${error.message}`, 'ERROR');
    }

    if (successRate >= 80) {
      await this.log('\n🎉 YAML workflow tests passed! Workflows are ready for GitHub Actions.');
    } else {
      await this.log('\n⚠️ Some YAML tests failed. Please address issues before deployment.');
    }

    return report;
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new YAMLWorkflowTester();
  tester.runAllTests()
    .then((report) => {
      const successRate = report.summary.successRate;
      if (successRate >= 80) {
        console.log('🎉 YAML workflow tests completed successfully!');
        process.exit(0);
      } else {
        console.log('💥 YAML workflow tests failed. Please fix issues before deployment.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 YAML test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = YAMLWorkflowTester;
