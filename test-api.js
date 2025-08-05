// Test script for EWA API
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
    try {
        console.log('Testing EWA API...');
        
        // Test the officers endpoint
        const response = await fetch('http://localhost:3000/api/officers');
        const data = await response.json();
        
        console.log('API Response:', JSON.stringify(data, null, 2));
        
        if (data.success && data.officers && data.officers.length > 0) {
            console.log(`✅ Success! Found ${data.officers.length} officers`);
            data.officers.forEach(officer => {
                console.log(`  - ${officer.name} (${officer.position}) - ${officer.clubName}`);
            });
        } else {
            console.log('❌ No officers found or API error');
        }
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
    }
}

testAPI(); 