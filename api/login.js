require('dotenv').config();

// Import Neon database functions
const { getUsers, updateUser } = require('../database/neon-functions');

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
    
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }
    
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }

        // Get users from database
        const users = await getUsers();
        const user = users[username];

        if (!user || user.password !== password) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }

        // Check if account is locked
        if (user.isLocked) {
            return res.status(403).json({ 
                success: false, 
                message: 'Account is locked. Please contact administrator.' 
            });
        }

        // Update last login time
        await updateUser(username, { lastLogin: new Date().toISOString() });

        res.json({ 
            success: true, 
            message: 'Login successful',
            user: {
                username: user.username,
                role: user.role,
                club: user.club,
                clubName: user.clubName,
                isFirstLogin: user.isFirstLogin || false
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}; 