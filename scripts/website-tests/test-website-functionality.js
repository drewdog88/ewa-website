const BASE_URL = 'http://localhost:3000';

async function testWebsiteFunctionality() {
  console.log('🌐 Starting Website Functionality Testing Suite');
  console.log(`📍 Testing against: ${BASE_URL}`);
    
  const tests = [];
    
  // Test 1: Health Check
  tests.push(async () => {
    console.log('\n🏥 Test 1: Health Check');
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
        
    if (response.ok && data.status === 'ok') {
      console.log('   ✅ Health check passed');
      console.log(`   📊 Database: ${data.services.database.status}`);
      console.log(`   📊 Blob: ${data.services.blob.status}`);
      return true;
    } else {
      console.log('   ❌ Health check failed');
      return false;
    }
  });
    
  // Test 2: Officers API
  tests.push(async () => {
    console.log('\n👥 Test 2: Officers API');
    const response = await fetch(`${BASE_URL}/api/officers`);
    const data = await response.json();
        
    if (response.ok && data.success) {
      console.log(`   ✅ Officers API: ${data.officers.length} officers found`);
      return true;
    } else {
      console.log('   ❌ Officers API failed');
      return false;
    }
  });
    
  // Test 3: Users API
  tests.push(async () => {
    console.log('\n👤 Test 3: Users API');
    const response = await fetch(`${BASE_URL}/api/users`);
    const data = await response.json();
        
    if (response.ok && data.success) {
      const userCount = Object.keys(data.users).length;
      console.log(`   ✅ Users API: ${userCount} users found`);
      return true;
    } else {
      console.log('   ❌ Users API failed');
      return false;
    }
  });
    
  // Test 4: Documents API
  tests.push(async () => {
    console.log('\n📋 Test 4: Documents API');
    const response = await fetch(`${BASE_URL}/api/documents`);
    const data = await response.json();
        
    if (response.ok && data.success && Array.isArray(data.documents)) {
      console.log(`   ✅ Documents API: ${data.documents.length} documents found`);
      return true;
    } else {
      console.log('   ❌ Documents API failed');
      return false;
    }
  });
    
  // Test 5: Booster clubs API
  tests.push(async () => {
    console.log('\n🏫 Test 5: Booster Clubs API');
    const response = await fetch(`${BASE_URL}/api/booster-clubs`);
    const data = await response.json();
        
    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log(`   ✅ Booster Clubs API: ${data.data.length} clubs found`);
      return true;
    } else {
      console.log('   ❌ Booster Clubs API failed');
      return false;
    }
  });
    
  // Test 6: Main Website Pages
  tests.push(async () => {
    console.log('\n📄 Test 6: Main Website Pages');
        
    const pages = [
      { name: 'Home Page', path: '/' },
      { name: 'Team Page', path: '/team.html' },
      { name: 'Payment Page', path: '/payment.html' },
      { name: 'News Page', path: '/news.html' },
      { name: 'Gallery Page', path: '/gallery.html' },
      { name: 'Links Page', path: '/links.html' }
    ];
        
    let passed = 0;
    for (const page of pages) {
      try {
        const response = await fetch(`${BASE_URL}${page.path}`);
        if (response.ok) {
          console.log(`   ✅ ${page.name}: ${response.status}`);
          passed++;
        } else {
          console.log(`   ❌ ${page.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${page.name}: Connection error`);
      }
    }
        
    return passed === pages.length;
  });
    
  // Test 7: Admin Pages
  tests.push(async () => {
    console.log('\n🔐 Test 7: Admin Pages');
        
    const pages = [
      { name: 'Admin Login', path: '/admin/login.html' },
      { name: 'Admin Dashboard', path: '/admin/dashboard.html' }
    ];
        
    let passed = 0;
    for (const page of pages) {
      try {
        const response = await fetch(`${BASE_URL}${page.path}`);
        if (response.ok) {
          console.log(`   ✅ ${page.name}: ${response.status}`);
          passed++;
        } else {
          console.log(`   ❌ ${page.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${page.name}: Connection error`);
      }
    }
        
    return passed === pages.length;
  });
    
  // Test 8: Database Query Performance
  tests.push(async () => {
    console.log('\n⚡ Test 8: Database Query Performance');
        
    const startTime = Date.now();
    const response = await fetch(`${BASE_URL}/api/officers`);
    const queryTime = Date.now() - startTime;
        
    if (response.ok && queryTime < 1000) {
      console.log(`   ✅ Officers query: ${queryTime}ms (under 1 second)`);
      return true;
    } else {
      console.log(`   ⚠️ Officers query: ${queryTime}ms (slow)`);
      return false;
    }
  });
    
  // Test 9: Error Handling
  tests.push(async () => {
    console.log('\n🚨 Test 9: Error Handling');
        
    // Test non-existent endpoint
    const response = await fetch(`${BASE_URL}/api/nonexistent`);
        
    if (response.status === 404) {
      console.log('   ✅ 404 error handling works');
      return true;
    } else {
      console.log(`   ❌ Unexpected status: ${response.status}`);
      return false;
    }
  });
    
  // Run all tests
  let passedTests = 0;
  const totalTests = tests.length;
    
  for (let i = 0; i < tests.length; i++) {
    try {
      const result = await tests[i]();
      if (result) passedTests++;
    } catch (error) {
      console.log(`   ❌ Test ${i + 1} failed with error: ${error.message}`);
    }
  }
    
  // Summary
  console.log('\n📊 Test Summary');
  console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`   📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Website functionality is working correctly.');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above.');
    return false;
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testWebsiteFunctionality()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testWebsiteFunctionality }; 