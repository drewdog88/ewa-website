const { chromium } = require('playwright');

async function debugAdminPage() {
  console.log('🔍 Debugging Admin Page...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to admin dashboard
    console.log('📍 Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin/dashboard.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    // Check if there are any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });
    
    // Wait a bit more for JavaScript to execute
    await page.waitForTimeout(5000);
    
    // Check title again
    const titleAfter = await page.title();
    console.log(`📄 Page title after wait: "${titleAfter}"`);
    
    // Check for navigation links
    const navLinks = await page.locator('.nav-link').count();
    console.log(`🔗 Navigation links found: ${navLinks}`);
    
    // Check for any content
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 Body text length: ${bodyText ? bodyText.length : 0}`);
    
    if (bodyText && bodyText.length > 0) {
      console.log(`📝 First 200 chars: ${bodyText.substring(0, 200)}`);
    }
    
    // Check for specific elements
    const dashboardSection = await page.locator('#dashboard').count();
    console.log(`📊 Dashboard section exists: ${dashboardSection > 0}`);
    
    const paymentSection = await page.locator('#payment-management').count();
    console.log(`💳 Payment section exists: ${paymentSection > 0}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-admin-page.png' });
    console.log('📸 Screenshot saved as debug-admin-page.png');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    // Keep browser open for 10 seconds
    console.log('⏳ Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

debugAdminPage();
