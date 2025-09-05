#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 EWA Website Test Suite Runner\n');
console.log('=' .repeat(60));

const testCategories = {
  'database': 'Database connection and schema tests',
  'features': 'Feature-specific tests (payment, admin, clubs)',
  'integration': 'Integration and end-to-end tests',
  'all': 'Run all tests'
};

function runTests(category = 'all') {
  const testDir = path.join(__dirname);
  
  try {
    if (category === 'all') {
      console.log('🚀 Running all tests...\n');
      
      // Run database tests
      console.log('📊 Database Tests:');
      console.log('-'.repeat(40));
      runTestCategory('database');
      
      console.log('\n🎯 Feature Tests:');
      console.log('-'.repeat(40));
      runTestCategory('features');
      
      console.log('\n🔗 Integration Tests:');
      console.log('-'.repeat(40));
      runTestCategory('integration');
      
    } else {
      console.log(`🚀 Running ${category} tests...\n`);
      runTestCategory(category);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

function runTestCategory(category) {
  const categoryDir = path.join(__dirname, category);
  
  try {
    // Check if directory exists and has test files
    const fs = require('fs');
    if (!fs.existsSync(categoryDir)) {
      console.log(`⚠️  No ${category} tests found`);
      return;
    }
    
    const testFiles = fs.readdirSync(categoryDir)
      .filter(file => file.endsWith('.test.js'))
      .map(file => path.join(categoryDir, file));
    
    if (testFiles.length === 0) {
      console.log(`⚠️  No test files found in ${category}/`);
      return;
    }
    
    // Run each test file
    testFiles.forEach(testFile => {
      console.log(`\n📄 Running ${path.basename(testFile)}...`);
      try {
        const output = execSync(`node ${testFile}`, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        console.log('✅ Passed');
      } catch (error) {
        console.log('❌ Failed');
        console.log(error.stdout || error.message);
      }
    });
    
  } catch (error) {
    console.error(`❌ Error running ${category} tests:`, error.message);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const category = args[0] || 'all';

if (category === 'help' || category === '--help' || category === '-h') {
  console.log('Usage: node run-tests.js [category]\n');
  console.log('Categories:');
  Object.entries(testCategories).forEach(([key, desc]) => {
    console.log(`  ${key.padEnd(12)} - ${desc}`);
  });
  console.log('\nExamples:');
  console.log('  node run-tests.js database    # Run only database tests');
  console.log('  node run-tests.js features    # Run only feature tests');
  console.log('  node run-tests.js all         # Run all tests (default)');
  process.exit(0);
}

if (!testCategories[category]) {
  console.error(`❌ Unknown test category: ${category}`);
  console.log('Run "node run-tests.js help" for available categories');
  process.exit(1);
}

runTests(category);
