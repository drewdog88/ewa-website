require('dotenv').config();

// Import Neon database functions
const { getOfficers } = require('../database/neon-functions');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        const officers = await getOfficers();
        res.json({ success: true, officers });
    } catch (error) {
        console.error('Error getting officers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}; 