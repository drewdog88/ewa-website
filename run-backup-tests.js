#!/usr/bin/env node

/**
 * Backup System Test Runner
 * 
 * This script provides options to run different levels of backup system testing:
 * - Quick: Fast health check (recommended for daily use)
 * - Comprehensive: Full FIT test with all functionality
 * - Both: Run quick first, then comprehensive if quick passes
 * 
 * Usage:
 *   node run-backup-tests.js quick
 *   node run-backup-tests.js comprehensive
 *   node run-backup-tests.js both
 *   node run-backup-tests.js (defaults to both)
 */

const QuickBackupTester = require('./test-backup-quick');
const BackupSystemTester = require('./test-backup-system-comprehensive');

class BackupTestRunner {
  constructor() {
    this.testType = process.argv[2] || 'both';
  }

  async run() {
    console.log('🧪 Backup System Test Runner');
    console.log('=' .repeat(50));
    console.log(`Test Type: ${this.testType}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('=' .repeat(50));

    try {
      switch (this.testType.toLowerCase()) {
        case 'quick':
          await this.runQuickTest();
          break;
        case 'comprehensive':
          await this.runComprehensiveTest();
          break;
        case 'both':
          await this.runBothTests();
          break;
        default:
          console.log('❌ Invalid test type. Use: quick, comprehensive, or both');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    }
  }

  async runQuickTest() {
    console.log('\n⚡ Running Quick Backup System Test...');
    const tester = new QuickBackupTester();
    await tester.runQuickTest();
  }

  async runComprehensiveTest() {
    console.log('\n🧪 Running Comprehensive Backup System Test...');
    const tester = new BackupSystemTester();
    await tester.runAllTests();
  }

  async runBothTests() {
    console.log('\n⚡ Running Quick Test First...');
    const quickTester = new QuickBackupTester();
    await quickTester.runQuickTest();
    
    const quickFailed = quickTester.results.failed > 0;
    
    if (quickFailed) {
      console.log('\n⚠️  Quick test failed. Skipping comprehensive test.');
      console.log('💡 Fix the issues above before running comprehensive test.');
      process.exit(1);
    } else {
      console.log('\n✅ Quick test passed. Running comprehensive test...');
      await this.runComprehensiveTest();
    }
  }
}

// Run the test runner if this file is executed directly
if (require.main === module) {
  const runner = new BackupTestRunner();
  runner.run().catch(console.error);
}

module.exports = BackupTestRunner;
