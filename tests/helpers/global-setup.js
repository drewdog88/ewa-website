const { chromium } = require('@playwright/test');
const { TEST_CONFIG, dbUtils } = require('./test-setup');

async function globalSetup(_config) {
  console.log('Setting up global test environment...');
  
  // Start browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Setup test database
    await dbUtils.resetDatabase();
    await dbUtils.seedTestData();
    
    // Verify application is running
    await page.goto(TEST_CONFIG.BASE_URL);
    await page.waitForLoadState('networkidle');
    
    console.log('Global setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;
