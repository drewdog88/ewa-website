const { dbUtils } = require('./test-setup');

async function globalTeardown(_config) {
  console.log('Cleaning up global test environment...');
  
  try {
    // Cleanup test data
    await dbUtils.cleanupTestData();
    
    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error('Global teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

module.exports = globalTeardown;
