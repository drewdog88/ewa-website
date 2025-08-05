// Vercel serverless function for officers API
const { getOfficers } = require('../database/neon-functions');

// Initialize database on first request
let dbInitialized = false;
async function ensureDatabaseInitialized() {
    if (!dbInitialized) {
        try {
            console.log('Initializing Neon database connection...');
            const officers = await getOfficers();
            console.log(`Database connected successfully with ${officers.length} officers`);
            dbInitialized = true;
        } catch (error) {
            console.error('Database initialization failed:', error.message);
        }
    }
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        await ensureDatabaseInitialized();
        const officers = await getOfficers();
        
        res.status(200).json({ 
            success: true, 
            officers: officers 
        });
    } catch (error) {
        console.error('Error getting officers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}; 