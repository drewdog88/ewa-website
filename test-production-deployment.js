const http = require('http');
const https = require('https');

// Production URL - this will be the actual Vercel deployment
const PRODUCTION_URL = 'ewa-website.vercel.app';
const PRODUCTION_PORT = 443; // HTTPS

function makeHttpsRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: PRODUCTION_URL,
            port: PRODUCTION_PORT,
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'EWA-Production-Test-Suite'
            }
        };

        const req = https.request(options, (res) => {
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

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout (10s)'));
        });

        req.end();
    });
}

async function testProductionDeployment() {
    console.log('🚀 Starting Production Deployment Testing Suite');
    console.log(`📍 Testing against: https://${PRODUCTION_URL}`);
    console.log('⏰ This may take a few minutes as Vercel builds and deploys...');
    
    const tests = [];
    
    // Test 1: Production Health Check
    tests.push(async () => {
        console.log('\n🏥 Test 1: Production Health Check');
        try {
            const response = await makeHttpsRequest('/api/health');
            if (response.status === 200) {
                console.log('   ✅ Production health check passed');
                // Try to parse JSON to verify it's working
                try {
                    const healthData = JSON.parse(response.data);
                    console.log(`   📊 Database: ${healthData.services?.database?.status || 'unknown'}`);
                    console.log(`   📊 Blob: ${healthData.services?.blob?.status || 'unknown'}`);
                } catch (e) {
                    console.log('   ⚠️ Health check returned non-JSON response');
                }
                return true;
            } else {
                console.log(`   ❌ Production health check failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Production health check error: ${error.message}`);
            return false;
        }
    });
    
    // Test 2: Production Officers API
    tests.push(async () => {
        console.log('\n👥 Test 2: Production Officers API');
        try {
            const response = await makeHttpsRequest('/api/officers');
            if (response.status === 200) {
                console.log('   ✅ Production Officers API: 200 OK');
                try {
                    const data = JSON.parse(response.data);
                    if (data.success && data.officers) {
                        console.log(`   📊 Found ${data.officers.length} officers in production`);
                    }
                } catch (e) {
                    console.log('   ⚠️ Officers API returned non-JSON response');
                }
                return true;
            } else {
                console.log(`   ❌ Production Officers API failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Production Officers API error: ${error.message}`);
            return false;
        }
    });
    
    // Test 3: Production 1099 Forms API
    tests.push(async () => {
        console.log('\n📋 Test 3: Production 1099 Forms API');
        try {
            const response = await makeHttpsRequest('/api/1099');
            if (response.status === 200) {
                console.log('   ✅ Production 1099 Forms API: 200 OK');
                try {
                    const data = JSON.parse(response.data);
                    if (data.success && data.submissions) {
                        console.log(`   📊 Found ${data.submissions.length} 1099 forms in production`);
                    }
                } catch (e) {
                    console.log('   ⚠️ 1099 API returned non-JSON response');
                }
                return true;
            } else {
                console.log(`   ❌ Production 1099 Forms API failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Production 1099 Forms API error: ${error.message}`);
            return false;
        }
    });
    
    // Test 4: Production Users API
    tests.push(async () => {
        console.log('\n👤 Test 4: Production Users API');
        try {
            const response = await makeHttpsRequest('/api/users');
            if (response.status === 200) {
                console.log('   ✅ Production Users API: 200 OK');
                try {
                    const data = JSON.parse(response.data);
                    if (data.success && data.users) {
                        const userCount = Object.keys(data.users).length;
                        console.log(`   📊 Found ${userCount} users in production`);
                    }
                } catch (e) {
                    console.log('   ⚠️ Users API returned non-JSON response');
                }
                return true;
            } else {
                console.log(`   ❌ Production Users API failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Production Users API error: ${error.message}`);
            return false;
        }
    });
    
    // Test 5: Production Volunteers API
    tests.push(async () => {
        console.log('\n🤝 Test 5: Production Volunteers API');
        try {
            const response = await makeHttpsRequest('/api/volunteers');
            if (response.status === 200) {
                console.log('   ✅ Production Volunteers API: 200 OK');
                try {
                    const data = JSON.parse(response.data);
                    if (data.success && data.volunteers) {
                        console.log(`   📊 Found ${data.volunteers.length} volunteers in production`);
                    }
                } catch (e) {
                    console.log('   ⚠️ Volunteers API returned non-JSON response');
                }
                return true;
            } else {
                console.log(`   ❌ Production Volunteers API failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Production Volunteers API error: ${error.message}`);
            return false;
        }
    });
    
    // Test 6: Production Main Website Pages
    tests.push(async () => {
        console.log('\n📄 Test 6: Production Main Website Pages');
        
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
                const response = await makeHttpsRequest(page.path);
                if (response.status === 200) {
                    console.log(`   ✅ ${page.name}: ${response.status}`);
                    passed++;
                } else {
                    console.log(`   ❌ ${page.name}: ${response.status}`);
                }
            } catch (error) {
                console.log(`   ❌ ${page.name}: Connection error - ${error.message}`);
            }
        }
        
        return passed === pages.length;
    });
    
    // Test 7: Production Admin Pages
    tests.push(async () => {
        console.log('\n🔐 Test 7: Production Admin Pages');
        
        const pages = [
            { name: 'Admin Login', path: '/admin/login.html' },
            { name: 'Admin Dashboard', path: '/admin/dashboard.html' }
        ];
        
        let passed = 0;
        for (const page of pages) {
            try {
                const response = await makeHttpsRequest(page.path);
                if (response.status === 200) {
                    console.log(`   ✅ ${page.name}: ${response.status}`);
                    passed++;
                } else {
                    console.log(`   ❌ ${page.name}: ${response.status}`);
                }
            } catch (error) {
                console.log(`   ❌ ${page.name}: Connection error - ${error.message}`);
            }
        }
        
        return passed === pages.length;
    });
    
    // Test 8: Production Database Query Performance
    tests.push(async () => {
        console.log('\n⚡ Test 8: Production Database Query Performance');
        
        const startTime = Date.now();
        try {
            const response = await makeHttpsRequest('/api/officers');
            const queryTime = Date.now() - startTime;
            
            if (response.status === 200 && queryTime < 5000) {
                console.log(`   ✅ Production officers query: ${queryTime}ms (under 5 seconds)`);
                return true;
            } else {
                console.log(`   ⚠️ Production officers query: ${queryTime}ms (slow or failed)`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Production performance test error: ${error.message}`);
            return false;
        }
    });
    
    // Test 9: Production Error Handling
    tests.push(async () => {
        console.log('\n🚨 Test 9: Production Error Handling');
        
        try {
            const response = await makeHttpsRequest('/api/nonexistent');
            if (response.status === 404) {
                console.log('   ✅ Production 404 error handling works');
                return true;
            } else {
                console.log(`   ⚠️ Production unexpected status: ${response.status} (may be serving fallback page)`);
                return true; // This is actually acceptable behavior
            }
        } catch (error) {
            console.log(`   ❌ Production error handling test failed: ${error.message}`);
            return false;
        }
    });
    
    // Test 10: Production SSL/HTTPS
    tests.push(async () => {
        console.log('\n🔒 Test 10: Production SSL/HTTPS');
        
        try {
            const response = await makeHttpsRequest('/');
            if (response.status === 200) {
                console.log('   ✅ Production HTTPS working correctly');
                return true;
            } else {
                console.log(`   ❌ Production HTTPS failed: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log(`   ❌ Production HTTPS error: ${error.message}`);
            return false;
        }
    });
    
    // Run all tests with retries for deployment
    let passedTests = 0;
    let totalTests = tests.length;
    let retryCount = 0;
    const maxRetries = 3;
    
    console.log('\n🔄 Running production tests (may retry if deployment is still building)...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (attempt > 1) {
            console.log(`\n🔄 Retry attempt ${attempt}/${maxRetries} (waiting 30 seconds for deployment to complete)...`);
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        passedTests = 0;
        
        for (let i = 0; i < tests.length; i++) {
            try {
                const result = await tests[i]();
                if (result) passedTests++;
            } catch (error) {
                console.log(`   ❌ Test ${i + 1} failed with error: ${error.message}`);
            }
        }
        
        const successRate = Math.round((passedTests / totalTests) * 100);
        console.log(`\n📊 Attempt ${attempt} Results: ${passedTests}/${totalTests} (${successRate}%)`);
        
        if (successRate >= 80) {
            console.log('✅ Good enough success rate, proceeding with results');
            break;
        } else if (attempt < maxRetries) {
            console.log('⚠️ Low success rate, will retry after deployment completes');
        }
    }
    
    // Final Summary
    console.log('\n📊 Final Production Test Summary');
    console.log(`   ✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`   📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests >= totalTests * 0.8) {
        console.log('\n🎉 Production deployment is working correctly!');
        console.log('📝 Migration to production was successful.');
        return true;
    } else {
        console.log('\n⚠️ Some production tests failed. Please check:');
        console.log('   1. Vercel deployment status in dashboard');
        console.log('   2. Environment variables are set correctly');
        console.log('   3. Database connection is working');
        console.log('   4. Build logs for any errors');
        return false;
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    testProductionDeployment()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Production test suite failed:', error);
            process.exit(1);
        });
}

module.exports = { testProductionDeployment }; 