// Simple 1099 API endpoint for testing
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

// Test endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: '1099 API is working!',
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path
    });
});

// Get all 1099 submissions
app.get('/all', (req, res) => {
    res.json({ 
        success: true, 
        message: '1099 all endpoint working',
        submissions: [
            { id: 1, name: 'Steven Smith', amount: 1000, status: 'pending' },
            { id: 2, name: 'Test User', amount: 500, status: 'pending' }
        ]
    });
});

// Export for Vercel
module.exports = app; 