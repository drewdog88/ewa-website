const { chromium } = require('playwright');

async function testAdminPaymentUI() {
  console.log('🧪 Testing Admin Payment UI - Edit Table Object Functionality...');
  
  const browser = await chromium.launch({ 
    headless: false, 
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to admin dashboard
    console.log('📱 Navigating to admin dashboard...');
    await page.goto('http://localhost:3000/admin/dashboard.html');
    await page.waitForTimeout(2000);
    
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check if we need to login
    if (pageTitle.includes('Admin Login')) {
      console.log('🔐 Logging in...');
      await page.fill('#username', 'admin');
      await page.fill('#password', 'ewa2025');
      await page.locator('#password').press('Enter');
      await page.waitForTimeout(3000);
      
      // If still on login page, try direct navigation
      const newTitle = await page.title();
      if (newTitle.includes('Admin Login')) {
        console.log('🔄 Direct navigation to dashboard...');
        await page.goto('http://localhost:3000/admin/dashboard.html');
        await page.waitForTimeout(2000);
      }
    }
    
    const finalTitle = await page.title();
    console.log('📄 Final page title:', finalTitle);
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Navigate to payment management section
    console.log('🔧 Navigating to Payment Management section...');
    const paymentNavLink = await page.locator('a[href="#payment-management"]');
    if (await paymentNavLink.isVisible()) {
      await paymentNavLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked payment management navigation link');
    } else {
      console.log('❌ Payment management navigation link not found');
    }
    
    // Check if payment management section is visible
    console.log('🔍 Looking for payment management section...');
    const paymentSection = await page.locator('#payment-management');
    if (await paymentSection.isVisible()) {
      console.log('✅ Payment management section found');
    } else {
      console.log('❌ Payment management section not found');
    }
    
    // Test loading payment links table
    console.log('📊 Testing payment links table loading...');
    await page.waitForTimeout(2000);
    
    // Check if table has data
    const tableBody = await page.locator('#paymentLinksTableBody');
    const rows = await tableBody.locator('tr').count();
    console.log(`📋 Found ${rows} rows in payment links table`);
    
    if (rows > 0) {
      // Try to click on the first "Edit" button in the table
      console.log('✏️ Testing edit functionality...');
      const editButtons = await page.locator('#payment-management button:has-text("Edit")').count();
      console.log(`🔘 Found ${editButtons} edit buttons in payment management section`);
      
      if (editButtons > 0) {
        // Click the first edit button in payment management section
        await page.locator('#payment-management button:has-text("Edit")').first().click();
        await page.waitForTimeout(2000);
        
        // Check if the form was populated
        const zelleInput = await page.locator('#zelleUrl');
        const stripeInput = await page.locator('#stripeUrl');
        
        const zelleValue = await zelleInput.inputValue();
        const stripeValue = await stripeInput.inputValue();
        
        console.log(`💳 Zelle URL in form: ${zelleValue}`);
        console.log(`💳 Stripe URL in form: ${stripeValue}`);
        
        if (zelleValue || stripeValue) {
          console.log('✅ Edit functionality working - form populated successfully');
        } else {
          console.log('❌ Edit functionality failed - form not populated');
        }
      } else {
        console.log('⚠️ No edit buttons found in payment management section');
      }
    } else {
      console.log('⚠️ No data in payment links table');
    }
    
    // Test the specific "Load Stripe Settings" functionality
    console.log('🔄 Testing Load Stripe Settings...');
    
    // Select a club from the dropdown
    const clubSelect = await page.locator('#stripeClubSelect');
    if (await clubSelect.isVisible()) {
      console.log('✅ Stripe club select found');
      
      // Get available options
      const options = await clubSelect.locator('option').count();
      console.log(`📋 Found ${options} club options`);
      
      if (options > 1) { // More than just the default "Select a club"
        // Select the first actual club
        await clubSelect.selectOption({ index: 1 });
        await page.waitForTimeout(1000);
        
        // Check if the form was populated
        const stripeUrlInput = await page.locator('#stripeUrl');
        const stripeValue = await stripeUrlInput.inputValue();
        console.log(`💳 Stripe URL loaded: ${stripeValue}`);
        
        if (stripeValue) {
          console.log('✅ Load Stripe Settings working');
        } else {
          console.log('❌ Load Stripe Settings failed - no URL loaded');
        }
      } else {
        console.log('⚠️ No clubs available in dropdown');
      }
    } else {
      console.log('❌ Stripe club select not found');
    }
    
    console.log('✅ Admin Payment UI test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAdminPaymentUI();
