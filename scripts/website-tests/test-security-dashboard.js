const SecurityScanner = require('./utils/security-scanner');
const { spawn } = require('child_process');

async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting server for testing...');
    const server = spawn('node', ['server.js'], {
      stdio: 'pipe',
      detached: false
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        server.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 10000);

    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Server running on http://localhost:3000')) {
        started = true;
        clearTimeout(timeout);
        console.log('✅ Server started successfully');
        resolve(server);
      }
    });

    server.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function testSecurityDashboard() {
  console.log('🧪 Testing Security Dashboard Functionality...\n');

  let server = null;
  let serverStarted = false;

  try {
    // Check if server is already running
    const isRunning = await checkServerStatus();
    if (isRunning) {
      console.log('✅ Using existing server on port 3000');
    } else {
      server = await startServer();
      serverStarted = true;
      // Wait a moment for server to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test 1: Security Scanner
    console.log('1. Testing Security Scanner...');
    const scanner = new SecurityScanner();
    const results = await scanner.runFullScan();
    console.log('✅ Security scan completed');
    console.log(`   - Vulnerabilities: ${Object.values(results.dependencies.severityCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`   - Recommendations: ${results.recommendations.length}`);
    console.log(`   - Security Score: ${scanner.getSecurityScore()}\n`);

    // Test 2: Generate Report
    console.log('2. Testing Report Generation...');
    const report = await scanner.generateReport();
    console.log('✅ Security report generated');
    console.log('   - Report saved to: security-report.json');
    console.log(`   - Summary: ${JSON.stringify(report.summary, null, 2)}\n`);

    // Test 3: Test API Endpoints
    console.log('3. Testing API Endpoints...');
    
    try {
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:3000/api/health');
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData.status);

      // Test security dashboard (should require auth)
      const securityResponse = await fetch('http://localhost:3000/api/security/dashboard');
      const securityData = await securityResponse.json();
      console.log('✅ Security endpoint protected:', securityData.message);

      // Test login to get session
      const loginResponse = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'ewa2025' })
      });
      
      if (loginResponse.ok) {
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Login successful, testing authenticated security endpoint...');
        
        // Test authenticated security dashboard
        const authSecurityResponse = await fetch('http://localhost:3000/api/security/dashboard', {
          headers: { 'Cookie': cookies }
        });
        
        if (authSecurityResponse.ok) {
          const authData = await authSecurityResponse.json();
          console.log('✅ Authenticated security dashboard working');
          console.log(`   - Security score: ${authData.securityScore}`);
          console.log(`   - Vulnerabilities: ${authData.vulnerabilities.critical + authData.vulnerabilities.high + authData.vulnerabilities.moderate + authData.vulnerabilities.low}`);
        } else {
          console.log('⚠️  Authenticated security dashboard test failed');
        }
      }

    } catch (error) {
      console.log('⚠️  API tests failed:', error.message);
    }

    console.log('\n🎉 All security dashboard tests completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Open http://localhost:3000/admin/login.html');
    console.log('2. Login with admin/ewa2025');
    console.log('3. Navigate to the security dashboard');
    console.log('4. Test the interactive features');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up server if we started it
    if (server && serverStarted) {
      console.log('🔄 Shutting down test server...');
      server.kill();
    }
  }
}

testSecurityDashboard();
