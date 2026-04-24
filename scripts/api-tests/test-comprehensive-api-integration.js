require('dotenv').config({ path: '.env.local' });

/**
 * Comprehensive API Integration Test
 * Tests the complete data flow: Database → API → Frontend Response Structure
 * This test would have caught the officers API response structure issue
 */

async function testComprehensiveAPI() {
    console.log('🧪 Comprehensive API Integration Test');
    console.log('=====================================\n');
    
    const baseUrl = 'http://localhost:3000/api';
    let allTestsPassed = true;
    
    // Test 1: Officers API Response Structure
    console.log('1️⃣ Testing Officers API Response Structure...');
    try {
        const response = await fetch(`${baseUrl}/officers`);
        const result = await response.json();
        
        // Check response structure
        if (!result.success) {
            console.log('❌ Officers API success field is false');
            allTestsPassed = false;
        }
        
        if (!result.data) {
            console.log('❌ Officers API missing "data" field - has:', Object.keys(result));
            allTestsPassed = false;
        }
        
        if (!Array.isArray(result.data)) {
            console.log('❌ Officers API "data" field is not an array');
            allTestsPassed = false;
        }
        
        if (result.data.length === 0) {
            console.log('⚠️  Officers API returned 0 officers (might be expected)');
        } else {
            console.log(`✅ Officers API returned ${result.data.length} officers`);
            console.log(`   First officer: ${result.data[0].name}`);
        }
        
    } catch (error) {
        console.log('❌ Officers API test failed:', error.message);
        allTestsPassed = false;
    }
    
    // Test 2: Documents API Response Structure
    console.log('\n2️⃣ Testing Documents API Response Structure...');
    try {
        const response = await fetch(`${baseUrl}/documents`);
        const result = await response.json();
        
        if (!result.success) {
            console.log('❌ Documents API success field is false');
            allTestsPassed = false;
        }
        
        if (!result.documents) {
            console.log('❌ Documents API missing "documents" field - has:', Object.keys(result));
            allTestsPassed = false;
        }
        
        if (!Array.isArray(result.documents)) {
            console.log('❌ Documents API "documents" field is not an array');
            allTestsPassed = false;
        }
        
        console.log(`✅ Documents API returned ${result.documents.length} documents`);
        
    } catch (error) {
        console.log('❌ Documents API test failed:', error.message);
        allTestsPassed = false;
    }
    
    // Test 3: Analytics API Response Structure
    console.log('\n3️⃣ Testing Analytics API Response Structure...');
    try {
        const response = await fetch(`${baseUrl}/analytics/overview`);
        const result = await response.json();
        
        if (!result.success) {
            console.log('❌ Analytics API success field is false');
            allTestsPassed = false;
        }
        
        if (!result.data) {
            console.log('❌ Analytics API missing "data" field - has:', Object.keys(result));
            allTestsPassed = false;
        }
        
        const requiredFields = ['totalClubs', 'visitorsThisMonth', 'topLinks'];
        for (const field of requiredFields) {
            if (!(field in result.data)) {
                console.log(`❌ Analytics API missing "${field}" field`);
                allTestsPassed = false;
            }
        }
        
        console.log(`✅ Analytics API returned data with ${Object.keys(result.data).length} fields`);
        console.log(`   Total clubs: ${result.data.totalClubs}`);
        console.log(`   Visitors this month: ${result.data.visitorsThisMonth}`);
        
    } catch (error) {
        console.log('❌ Analytics API test failed:', error.message);
        allTestsPassed = false;
    }
    
    // Test 4: Booster Clubs API Response Structure
    console.log('\n4️⃣ Testing Booster Clubs API Response Structure...');
    try {
        const response = await fetch(`${baseUrl}/booster-clubs`);
        const result = await response.json();
        
        if (!result.success) {
            console.log('❌ Booster Clubs API success field is false');
            allTestsPassed = false;
        }
        
        if (!result.data) {
            console.log('❌ Booster Clubs API missing "data" field - has:', Object.keys(result));
            allTestsPassed = false;
        }
        
        if (!Array.isArray(result.data)) {
            console.log('❌ Booster Clubs API "data" field is not an array');
            allTestsPassed = false;
        }
        
        console.log(`✅ Booster Clubs API returned ${result.data.length} clubs`);
        
    } catch (error) {
        console.log('❌ Booster Clubs API test failed:', error.message);
        allTestsPassed = false;
    }
    
    // Test 5: Frontend Dashboard Data Loading Simulation
    console.log('\n5️⃣ Testing Frontend Dashboard Data Loading...');
    try {
        // Simulate what the dashboard JavaScript does
        const officersResponse = await fetch(`${baseUrl}/officers`);
        const officersResult = await officersResponse.json();
        
        const analyticsResponse = await fetch(`${baseUrl}/analytics/overview`);
        const analyticsResult = await analyticsResponse.json();
        
        // Test that frontend can extract the data it needs
        const totalOfficers = officersResult.data ? officersResult.data.length : 0;
        const siteVisitors = analyticsResult.data ? analyticsResult.data.visitorsThisMonth : 0;
        const topLinks = analyticsResult.data && analyticsResult.data.topLinks ? 
            analyticsResult.data.topLinks.slice(0, 5) : [];
        
        console.log(`✅ Dashboard data extraction successful:`);
        console.log(`   Total Officers: ${totalOfficers}`);
        console.log(`   Site Visitors: ${siteVisitors}`);
        console.log(`   Top 5 Links: ${topLinks.length} links available`);
        
        if (topLinks.length > 0) {
            console.log(`   Top link: "${topLinks[0].link_text}" (${topLinks[0].click_count} clicks)`);
        }
        
    } catch (error) {
        console.log('❌ Frontend dashboard data loading test failed:', error.message);
        allTestsPassed = false;
    }
    
    // Summary
    console.log('\n📊 Test Summary');
    console.log('================');
    if (allTestsPassed) {
        console.log('✅ ALL TESTS PASSED - API integration is working correctly');
    } else {
        console.log('❌ SOME TESTS FAILED - API integration has issues');
        console.log('   This test would have caught the officers API response structure issue');
    }
    
    return allTestsPassed;
}

// Run the test
testComprehensiveAPI().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
