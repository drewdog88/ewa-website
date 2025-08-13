const { chromium } = require('playwright');

async function testTableDisplay() {
    console.log('🧪 Testing Admin Dashboard Table Display...');
    
    const browser = await chromium.launch({ 
        headless: false, 
        slowMo: 1000 
    });
    
    try {
        const page = await browser.newPage();
        
        // Navigate to admin dashboard
        console.log('📍 Navigating to admin dashboard...');
        await page.goto('http://localhost:3000/admin/dashboard.html');
        
        // Wait for page to load
        await page.waitForTimeout(2000);
        
        // Check if we need to login
        const pageTitle = await page.title();
        console.log('📄 Page title:', pageTitle);
        
        if (pageTitle.includes('Admin Login')) {
            console.log('🔐 Admin login required - proceeding with login...');
            
            // Fill login credentials
            await page.fill('#username', 'admin');
            await page.fill('#password', 'ewa2025');
            console.log('✅ Filled login credentials');
            
            // Submit login form
            await page.locator('#password').press('Enter');
            console.log('✅ Submitted login form');
            
            // Wait for login to complete
            await page.waitForTimeout(3000);
            
            // Check if still on login page
            const newTitle = await page.title();
            if (newTitle.includes('Admin Login')) {
                console.log('⚠️ Still on login page, trying manual navigation...');
                await page.goto('http://localhost:3000/admin/dashboard.html');
                await page.waitForTimeout(2000);
            }
            
            console.log('✅ Login completed');
        }
        
        const finalTitle = await page.title();
        console.log('📄 Final page title:', finalTitle);
        
        // Navigate to Payment Management section
        console.log('🔧 Navigating to Payment Management section...');
        const paymentLink = page.locator('a[href="#payment-management"]');
        await paymentLink.click();
        await page.waitForTimeout(2000);
        
        // Wait for payment table to load
        console.log('⏳ Waiting for payment data to load...');
        await page.waitForTimeout(3000);
        
        // Check if payment table has data
        const tableBody = page.locator('#paymentLinksTableBody');
        const hasData = await tableBody.locator('tr').count() > 0;
        console.log('📊 Payment table has data:', hasData);
        
        if (hasData) {
            // Look for the Band Boosters row
            const bandRow = page.locator('#paymentLinksTableBody tr').filter({ hasText: 'EHS Band Boosters' });
            const bandRowExists = await bandRow.count() > 0;
            console.log('🔍 Band Boosters row exists:', bandRowExists);
            
            if (bandRowExists) {
                // Get the Stripe URL from the table
                const stripeCell = bandRow.locator('td').nth(2); // Third column (index 2) is Stripe URL
                const stripeUrlText = await stripeCell.textContent();
                console.log('💳 Stripe URL in table:', stripeUrlText);
                
                // Check if it shows the correct URL or "Not configured"
                const expectedUrl = 'https://buy.stripe.com/bJe7sKdJu3dM6UZ0Dy1sQ00';
                if (stripeUrlText === expectedUrl) {
                    console.log('✅ SUCCESS: Stripe URL correctly displayed in table!');
                } else if (stripeUrlText === 'Not configured') {
                    console.log('❌ FAILURE: Stripe URL still shows "Not configured" in table');
                } else {
                    console.log('⚠️ UNEXPECTED: Stripe URL shows:', stripeUrlText);
                }
                
                // Also check Zelle URL
                const zelleCell = bandRow.locator('td').nth(1); // Second column (index 1) is Zelle URL
                const zelleUrlText = await zelleCell.textContent();
                console.log('💳 Zelle URL in table:', zelleUrlText);
            } else {
                console.log('❌ Band Boosters row not found in table');
            }
        } else {
            console.log('❌ Payment table has no data');
        }
        
        console.log('\n🎯 Table display test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        console.log('⏳ Keeping browser open for 10 seconds to see results...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await browser.close();
    }
}

testTableDisplay();
