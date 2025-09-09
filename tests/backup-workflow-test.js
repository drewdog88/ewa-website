#!/usr/bin/env node

/**
 * Backup Workflow Test Suite
 * 
 * This script tests the new GitHub Actions backup workflows to ensure they work correctly
 * before removing the old Vercel cron system.
 * 
 * Tests:
 * 1. Environment validation
 * 2. PostgreSQL client installation simulation
 * 3. pg_dump functionality
 * 4. Vercel CLI blob upload
 * 5. Workflow file validation
 * 6. Integration testing
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class BackupWorkflowTester {
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

  async testEnvironmentVariables() {
    await this.log('🧪 Testing environment variables...');
    
    const requiredVars = ['DATABASE_URL', 'BLOB_READ_WRITE_TOKEN'];
    
    for (const varName of requiredVars) {
      const exists = !!process.env[varName];
      await this.addTestResult(
        `Environment: ${varName}`,
        exists,
        exists ? 'Environment variable is set' : 'Environment variable is missing',
        exists ? `Length: ${process.env[varName].length} characters` : 'Required for backup workflows'
      );
    }

    // Test DATABASE_URL format
    if (process.env.DATABASE_URL) {
      const isValidFormat = process.env.DATABASE_URL.startsWith('postgresql://');
      await this.addTestResult(
        'Environment: DATABASE_URL format',
        isValidFormat,
        isValidFormat ? 'Valid PostgreSQL connection string format' : 'Invalid connection string format',
        isValidFormat ? 'Starts with postgresql://' : 'Should start with postgresql://'
      );
    }

    // Test BLOB_READ_WRITE_TOKEN format
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const isValidFormat = process.env.BLOB_READ_WRITE_TOKEN.startsWith('vercel_blob_rw_');
      await this.addTestResult(
        'Environment: BLOB_READ_WRITE_TOKEN format',
        isValidFormat,
        isValidFormat ? 'Valid Vercel blob token format' : 'Invalid blob token format',
        isValidFormat ? 'Starts with vercel_blob_rw_' : 'Should start with vercel_blob_rw_'
      );
    }
  }

  async testWorkflowFiles() {
    await this.log('🧪 Testing workflow files...');
    
    const workflowFiles = [
      '.github/workflows/simple-daily-backup.yml',
      '.github/workflows/simple-weekly-backup.yml'
    ];

    for (const workflowFile of workflowFiles) {
      try {
        const content = await fs.readFile(workflowFile, 'utf8');
        const exists = true;
        
        await this.addTestResult(
          `Workflow: ${workflowFile} exists`,
          exists,
          'Workflow file found',
          `Size: ${content.length} characters`
        );

        // Test YAML syntax (basic check)
        const hasValidYAML = content.includes('name:') && content.includes('on:') && content.includes('jobs:');
        await this.addTestResult(
          `Workflow: ${workflowFile} YAML structure`,
          hasValidYAML,
          hasValidYAML ? 'Valid YAML structure' : 'Invalid YAML structure',
          hasValidYAML ? 'Contains required sections' : 'Missing required sections (name, on, jobs)'
        );

        // Test for required secrets
        const hasSecrets = content.includes('${{ secrets.DATABASE_URL }}') && content.includes('${{ secrets.BLOB_READ_WRITE_TOKEN }}');
        await this.addTestResult(
          `Workflow: ${workflowFile} secrets configuration`,
          hasSecrets,
          hasSecrets ? 'Required secrets configured' : 'Missing required secrets',
          hasSecrets ? 'DATABASE_URL and BLOB_READ_WRITE_TOKEN found' : 'Need both DATABASE_URL and BLOB_READ_WRITE_TOKEN'
        );

        // Test for pg_dump usage
        const hasPgDump = content.includes('pg_dump');
        await this.addTestResult(
          `Workflow: ${workflowFile} pg_dump usage`,
          hasPgDump,
          hasPgDump ? 'Uses pg_dump for backup' : 'Missing pg_dump usage',
          hasPgDump ? 'pg_dump command found' : 'Should use pg_dump for database backup'
        );

        // Test for Vercel CLI usage
        const hasVercelCLI = content.includes('vercel blob put');
        await this.addTestResult(
          `Workflow: ${workflowFile} Vercel CLI usage`,
          hasVercelCLI,
          hasVercelCLI ? 'Uses Vercel CLI for blob upload' : 'Missing Vercel CLI usage',
          hasVercelCLI ? 'vercel blob put command found' : 'Should use Vercel CLI for blob upload'
        );

      } catch (error) {
        await this.addTestResult(
          `Workflow: ${workflowFile} exists`,
          false,
          'Workflow file not found',
          error.message
        );
      }
    }
  }

  async testPostgreSQLClient() {
    await this.log('🧪 Testing PostgreSQL client availability...');
    
    try {
      // Check if pg_dump is available
      const { stdout, stderr } = await execAsync('which pg_dump');
      const pgDumpAvailable = !stderr && stdout.trim();
      
      await this.addTestResult(
        'PostgreSQL: pg_dump availability',
        !!pgDumpAvailable,
        pgDumpAvailable ? 'pg_dump is available' : 'pg_dump not found',
        pgDumpAvailable ? `Path: ${stdout.trim()}` : 'Need to install PostgreSQL client'
      );

      if (pgDumpAvailable) {
        // Test pg_dump version
        try {
          const { stdout: versionOutput } = await execAsync('pg_dump --version');
          await this.addTestResult(
            'PostgreSQL: pg_dump version',
            true,
            'pg_dump version check successful',
            versionOutput.trim()
          );
        } catch (error) {
          await this.addTestResult(
            'PostgreSQL: pg_dump version',
            false,
            'Failed to get pg_dump version',
            error.message
          );
        }
      }

    } catch (error) {
      await this.addTestResult(
        'PostgreSQL: pg_dump availability',
        false,
        'pg_dump not available',
        error.message
      );
    }
  }

  async testVercelCLI() {
    await this.log('🧪 Testing Vercel CLI availability...');
    
    try {
      // Check if vercel CLI is available
      const { stdout, stderr } = await execAsync('which vercel');
      const vercelAvailable = !stderr && stdout.trim();
      
      await this.addTestResult(
        'Vercel CLI: availability',
        !!vercelAvailable,
        vercelAvailable ? 'Vercel CLI is available' : 'Vercel CLI not found',
        vercelAvailable ? `Path: ${stdout.trim()}` : 'Need to install Vercel CLI'
      );

      if (vercelAvailable) {
        // Test vercel CLI version
        try {
          const { stdout: versionOutput } = await execAsync('vercel --version');
          await this.addTestResult(
            'Vercel CLI: version',
            true,
            'Vercel CLI version check successful',
            versionOutput.trim()
          );
        } catch (error) {
          await this.addTestResult(
            'Vercel CLI: version',
            false,
            'Failed to get Vercel CLI version',
            error.message
          );
        }

        // Test vercel blob command availability
        try {
          const { stdout: helpOutput } = await execAsync('vercel blob --help');
          const hasBlobCommand = helpOutput.includes('blob');
          await this.addTestResult(
            'Vercel CLI: blob command',
            hasBlobCommand,
            hasBlobCommand ? 'Blob command available' : 'Blob command not available',
            hasBlobCommand ? 'vercel blob command found' : 'Need Vercel CLI with blob support'
          );
        } catch (error) {
          await this.addTestResult(
            'Vercel CLI: blob command',
            false,
            'Failed to test blob command',
            error.message
          );
        }
      }

    } catch (error) {
      await this.addTestResult(
        'Vercel CLI: availability',
        false,
        'Vercel CLI not available',
        error.message
      );
    }
  }

  async testDatabaseConnection() {
    await this.log('🧪 Testing database connection...');
    
    if (!process.env.DATABASE_URL) {
      await this.addTestResult(
        'Database: connection test',
        false,
        'Cannot test - DATABASE_URL not set',
        'Need DATABASE_URL environment variable'
      );
      return;
    }

    try {
      // Test basic connection with psql
      const { stdout, stderr } = await execAsync(`psql "${process.env.DATABASE_URL}" -c "SELECT 1;"`);
      const connectionWorks = !stderr || stderr.includes('SELECT 1');
      
      await this.addTestResult(
        'Database: connection test',
        connectionWorks,
        connectionWorks ? 'Database connection successful' : 'Database connection failed',
        connectionWorks ? 'Successfully connected to database' : stderr || 'Connection failed'
      );

      if (connectionWorks) {
        // Test if we can list tables
        try {
          const { stdout: tablesOutput } = await execAsync(`psql "${process.env.DATABASE_URL}" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"`);
          const hasTables = tablesOutput.includes('table_name') && tablesOutput.split('\n').length > 3;
          
          await this.addTestResult(
            'Database: table listing',
            hasTables,
            hasTables ? 'Can list database tables' : 'Cannot list database tables',
            hasTables ? 'Tables found in public schema' : 'No tables found or permission issue'
          );
        } catch (error) {
          await this.addTestResult(
            'Database: table listing',
            false,
            'Failed to list tables',
            error.message
          );
        }
      }

    } catch (error) {
      await this.addTestResult(
        'Database: connection test',
        false,
        'Database connection failed',
        error.message
      );
    }
  }

  async testBackupSimulation() {
    await this.log('🧪 Testing backup simulation...');
    
    if (!process.env.DATABASE_URL) {
      await this.addTestResult(
        'Backup: simulation test',
        false,
        'Cannot test - DATABASE_URL not set',
        'Need DATABASE_URL environment variable'
      );
      return;
    }

    try {
      // Create a test backup file
      const testBackupFile = path.join(__dirname, '..', 'test-backup.sql');
      
      // Run pg_dump to create a test backup
      const { stdout, stderr } = await execAsync(`pg_dump "${process.env.DATABASE_URL}" > "${testBackupFile}"`);
      
      // Check if backup file was created and has content
      const backupExists = await fs.access(testBackupFile).then(() => true).catch(() => false);
      
      if (backupExists) {
        const stats = await fs.stat(testBackupFile);
        const hasContent = stats.size > 0;
        
        await this.addTestResult(
          'Backup: pg_dump simulation',
          hasContent,
          hasContent ? 'pg_dump backup successful' : 'pg_dump backup failed',
          hasContent ? `Backup size: ${(stats.size / 1024).toFixed(2)} KB` : 'Backup file is empty'
        );

        // Clean up test file
        await fs.unlink(testBackupFile);
      } else {
        await this.addTestResult(
          'Backup: pg_dump simulation',
          false,
          'pg_dump backup failed',
          'Backup file was not created'
        );
      }

    } catch (error) {
      await this.addTestResult(
        'Backup: pg_dump simulation',
        false,
        'pg_dump backup failed',
        error.message
      );
    }
  }

  async testBlobToken() {
    await this.log('🧪 Testing blob token...');
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      await this.addTestResult(
        'Blob: token test',
        false,
        'Cannot test - BLOB_READ_WRITE_TOKEN not set',
        'Need BLOB_READ_WRITE_TOKEN environment variable'
      );
      return;
    }

    // Test if we can use the blob token with Vercel CLI
    try {
      const { stdout, stderr } = await execAsync(`vercel blob list --token="${process.env.BLOB_READ_WRITE_TOKEN}"`);
      const tokenWorks = !stderr || stderr.includes('No blobs found');
      
      await this.addTestResult(
        'Blob: token validation',
        tokenWorks,
        tokenWorks ? 'Blob token is valid' : 'Blob token is invalid',
        tokenWorks ? 'Successfully authenticated with Vercel Blob' : stderr || 'Authentication failed'
      );

    } catch (error) {
      await this.addTestResult(
        'Blob: token validation',
        false,
        'Blob token test failed',
        error.message
      );
    }
  }

  async runAllTests() {
    await this.log('🚀 Starting Backup Workflow Test Suite');
    await this.log(`📅 Date: ${new Date().toISOString()}`);
    await this.log(`🏃 Runner: Local Test Environment`);
    
    try {
      await this.testEnvironmentVariables();
      await this.testWorkflowFiles();
      await this.testPostgreSQLClient();
      await this.testVercelCLI();
      await this.testDatabaseConnection();
      await this.testBackupSimulation();
      await this.testBlobToken();
      
      // Generate test report
      await this.generateTestReport();
      
    } catch (error) {
      await this.log(`❌ Test suite failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async generateTestReport() {
    const duration = Date.now() - this.startTime;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const totalTests = this.testResults.length;
    const successRate = (passedTests / totalTests * 100).toFixed(1);

    await this.log('\n🎯 Test Results Summary:');
    await this.log('============================================================');
    await this.log(`Total Tests: ${totalTests}`);
    await this.log(`Passed: ${passedTests} ✅`);
    await this.log(`Failed: ${totalTests - passedTests} ❌`);
    await this.log(`Success Rate: ${successRate}%`);
    await this.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
    await this.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

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
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        databaseUrlConfigured: !!process.env.DATABASE_URL,
        blobTokenConfigured: !!process.env.BLOB_READ_WRITE_TOKEN
      },
      tests: this.testResults
    };

    try {
      const reportFile = path.join(__dirname, '..', 'backup-workflow-test-report.json');
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      await this.log(`📄 Detailed report saved: ${reportFile}`);
    } catch (error) {
      await this.log(`❌ Failed to save test report: ${error.message}`, 'ERROR');
    }

    if (successRate >= 80) {
      await this.log('\n🎉 Backup workflow tests passed! Ready for deployment.');
    } else {
      await this.log('\n⚠️ Some tests failed. Please address issues before deployment.');
    }

    return report;
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new BackupWorkflowTester();
  tester.runAllTests()
    .then((report) => {
      const successRate = report.summary.successRate;
      if (successRate >= 80) {
        console.log('🎉 Backup workflow tests completed successfully!');
        process.exit(0);
      } else {
        console.log('💥 Backup workflow tests failed. Please fix issues before deployment.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = BackupWorkflowTester;
