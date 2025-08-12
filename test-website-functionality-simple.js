const http = require('http');

const BASE_URL = 'localhost';
const PORT = 3000;

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'EWA-Test-Suite'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testWebsiteFunctionality() {
  console.log('🌐 Starting Website Functionality Testing Suite');
  console.log(`📍 Testing against: ${BASE_URL}:${PORT}`);
    
  const tests = [];
    
  // Test 1: Health Check
  tests.push(async () => {
    console.log('\n🏥 Test 1: Health Check');
    try {
      const response = await makeRequest('/api/health');
      if (response.status === 200) {
        console.log('   ✅ Health check passed');
        return true;
      } else {
        console.log(`   ❌ Health check failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Health check error: ${error.message}`);
      return false;
    }
  });
    
  // Test 2: Officers API
  tests.push(async () => {
    console.log('\n👥 Test 2: Officers API');
    try {
      const response = await makeRequest('/api/officers');
      if (response.status === 200) {
        console.log('   ✅ Officers API: 200 OK');
        return true;
      } else {
        console.log(`   ❌ Officers API failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Officers API error: ${error.message}`);
      return false;
    }
  });
    
  // Test 3: Users API
  tests.push(async () => {
    console.log('\n👤 Test 3: Users API');
    try {
      const response = await makeRequest('/api/users');
      if (response.status === 200) {
        console.log('   ✅ Users API: 200 OK');
        return true;
      } else {
        console.log(`   ❌ Users API failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Users API error: ${error.message}`);
      return false;
    }
  });
    
  // Test 4: 1099 Forms API
  tests.push(async () => {
    console.log('\n📋 Test 4: 1099 Forms API');
    try {
      const response = await makeRequest('/api/1099');
      if (response.status === 200) {
        console.log('   ✅ 1099 Forms API: 200 OK');
        return true;
      } else {
        console.log(`   ❌ 1099 Forms API failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ 1099 Forms API error: ${error.message}`);
      return false;
    }
  });
    
  // Test 5: Volunteers API
  tests.push(async () => {
    console.log('\n🤝 Test 5: Volunteers API');
    try {
      const response = await makeRequest('/api/volunteers');
      if (response.status === 200) {
        console.log('   ✅ Volunteers API: 200 OK');
        return true;
      } else {
        console.log(`   ❌ Volunteers API failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Volunteers API error: ${error.message}`);
      return false;
    }
  });
    
  // Test 6: Main Website Pages
  tests.push(async () => {
    console.log('\n📄 Test 6: Main Website Pages');
        
    const pages = [
      { name: 'Home Page', path: '/' },
      { name: 'Team Page', path: '/team.html' },
      { name: 'Volunteers Page', path: '/volunteers.html' },
      { name: 'Payment Page', path: '/payment.html' },
      { name: 'News Page', path: '/news.html' },
      { name: 'Gallery Page', path: '/gallery.html' },
      { name: 'Links Page', path: '/links.html' }
    ];
        
    let passed = 0;
    for (const page of pages) {
      try {
        const response = await makeRequest(page.path);
        if (response.status === 200) {
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
        const response = await makeRequest(page.path);
        if (response.status === 200) {
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
    try {
      const response = await makeRequest('/api/officers');
      const queryTime = Date.now() - startTime;
            
      if (response.status === 200 && queryTime < 1000) {
        console.log(`   ✅ Officers query: ${queryTime}ms (under 1 second)`);
        return true;
      } else {
        console.log(`   ⚠️ Officers query: ${queryTime}ms (slow or failed)`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Performance test error: ${error.message}`);
      return false;
    }
  });
    
  // Test 9: Error Handling
  tests.push(async () => {
    console.log('\n🚨 Test 9: Error Handling');
        
    try {
      const response = await makeRequest('/api/nonexistent');
      if (response.status === 404) {
        console.log('   ✅ 404 error handling works');
        return true;
      } else {
        console.log(`   ❌ Unexpected status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Error handling test failed: ${error.message}`);
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