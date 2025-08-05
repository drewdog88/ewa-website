// Vercel serverless function for officers API
const fs = require('fs');
const path = require('path');

// Import Redis for production
let redis;
if (process.env.NODE_ENV === 'production') {
    try {
        if (process.env.REDIS_URL) {
            const { createClient } = require('redis');
            redis = createClient({ url: process.env.REDIS_URL });
            redis.connect().then(() => {
                console.log('Redis initialized successfully');
            }).catch((error) => {
                console.log('Redis connection failed:', error.message);
            });
        } else {
            console.log('REDIS_URL not found, using in-memory storage');
        }
    } catch (error) {
        console.log('Redis not available, using in-memory storage:', error.message);
    }
}

// Function to load initial data from JSON files
function loadInitialData() {
    try {
        const officersPath = path.join(__dirname, '..', 'data', 'officers.json');
        if (fs.existsSync(officersPath)) {
            const officersData = fs.readFileSync(officersPath, 'utf8');
            const officers = JSON.parse(officersData);
            console.log(`Loaded ${officers.length} officers from data file`);
            return { officers };
        }
    } catch (error) {
        console.error('Error loading initial data:', error);
    }
    return { officers: [] };
}

// Function to initialize Redis store with data from JSON files
async function initializeRedisStore() {
    if (!redis) {
        console.log('Redis not available, skipping initialization');
        return;
    }
    
    try {
        console.log('Initializing Redis store with data from JSON files...');
        
        // Check if officers data exists in Redis
        const existingOfficers = await redis.get('officers');
        if (!existingOfficers) {
            // Load officers from JSON file and store in Redis
            const officersPath = path.join(__dirname, '..', 'data', 'officers.json');
            if (fs.existsSync(officersPath)) {
                const officersData = fs.readFileSync(officersPath, 'utf8');
                const officers = JSON.parse(officersData);
                await redis.set('officers', JSON.stringify(officers));
                console.log(`Initialized Redis store with ${officers.length} officers`);
            }
        } else {
            const officers = JSON.parse(existingOfficers);
            console.log(`Redis store already contains ${officers.length} officers`);
        }
    } catch (error) {
        console.error('Error initializing Redis store:', error);
    }
}

// In-memory storage for development fallback
const initialData = loadInitialData();
const memoryStorage = {
    officers: initialData.officers
};

// Helper function to get officers
async function getOfficers() {
    if (redis) {
        try {
            const data = await redis.get('officers');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting officers from Redis:', error);
            return memoryStorage.officers;
        }
    }
    return memoryStorage.officers;
}

// Initialize Redis store on first request
let redisInitialized = false;
async function ensureRedisInitialized() {
    if (!redisInitialized && redis) {
        await initializeRedisStore();
        redisInitialized = true;
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
        await ensureRedisInitialized();
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