// Vercel serverless function for EWA API
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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

// Import Vercel Blob for file storage
let blob;
if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
        blob = require('@vercel/blob');
        console.log('Vercel Blob initialized successfully');
    } catch (error) {
        console.log('Vercel Blob not available:', error.message);
    }
} else {
    console.log('BLOB_READ_WRITE_TOKEN not found, blob storage disabled');
}

const app = express();

// Function to load initial data from JSON files
function loadInitialData() {
    try {
        // Load officers data
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
        
        // Initialize other data types if needed
        const existingVolunteers = await redis.get('volunteers');
        if (!existingVolunteers) {
            await redis.set('volunteers', JSON.stringify([]));
            console.log('Initialized Redis store with empty volunteers array');
        }
        
        const existingInsurance = await redis.get('insurance');
        if (!existingInsurance) {
            await redis.set('insurance', JSON.stringify([]));
            console.log('Initialized Redis store with empty insurance array');
        }
        
        const existingForm1099 = await redis.get('form1099');
        if (!existingForm1099) {
            await redis.set('form1099', JSON.stringify([]));
            console.log('Initialized Redis store with empty form1099 array');
        }
        
        console.log('Redis store initialization completed');
    } catch (error) {
        console.error('Error initializing Redis store:', error);
    }
}

// In-memory storage for development fallback
const initialData = loadInitialData();
const memoryStorage = {
    volunteers: [],
    users: {
        "admin": {
            "username": "admin",
            "password": "ewa2025",
            "role": "admin",
            "club": "",
            "clubName": "",
            "createdAt": new Date().toISOString(),
            "isLocked": false,
            "isFirstLogin": false,
            "secretQuestion": "",
            "secretAnswer": "",
            "lastLogin": null
        },
        "orchestra_booster": {
            "username": "orchestra_booster",
            "password": "ewa_orchestra_2025",
            "role": "booster_admin",
            "club": "orchestra",
            "clubName": "EHS Orchestra Boosters Club",
            "createdAt": new Date().toISOString(),
            "isLocked": false,
            "isFirstLogin": false,
            "secretQuestion": "",
            "secretAnswer": "",
            "lastLogin": null
        }
    },
    officers: initialData.officers,
    insurance: [],
    form1099: []
};

// Security middleware
app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'");
    
    // Prevent caching of sensitive pages
    if (req.path.includes('/admin/')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    
    next();
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? true : true,
    credentials: true
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Helper functions for Redis storage with fallback to in-memory
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

async function getUsers() {
    if (redis) {
        try {
            const data = await redis.get('users');
            return data ? JSON.parse(data) : memoryStorage.users;
        } catch (error) {
            console.error('Error getting users from Redis:', error);
            return memoryStorage.users;
        }
    }
    return memoryStorage.users;
}

async function updateUser(username, updates) {
    if (redis) {
        try {
            const users = await getUsers();
            users[username] = { ...users[username], ...updates };
            await redis.set('users', JSON.stringify(users));
            return true;
        } catch (error) {
            console.error('Error updating user in Redis:', error);
            return false;
        }
    } else {
        memoryStorage.users[username] = { ...memoryStorage.users[username], ...updates };
        return true;
    }
}

// Initialize Redis store on first request
let redisInitialized = false;
async function ensureRedisInitialized() {
    if (!redisInitialized && redis) {
        await initializeRedisStore();
        redisInitialized = true;
    }
}

// API Routes

// Get all officers
app.get('/officers', async (req, res) => {
    try {
        await ensureRedisInitialized();
        const officers = await getOfficers();
        res.json({ success: true, officers });
    } catch (error) {
        console.error('Error getting officers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get officers by club
app.get('/officers/:club', async (req, res) => {
    try {
        await ensureRedisInitialized();
        const { club } = req.params;
        const officers = await getOfficers();
        const clubOfficers = officers.filter(officer => officer.club === club);
        res.json({ success: true, officers: clubOfficers });
    } catch (error) {
        console.error('Error getting club officers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        redisAvailable: !!redis,
        blobAvailable: !!blob,
        storage: redis ? 'Redis' : 'In-memory'
    });
});

// User authentication
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }

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
});

// Export for Vercel
module.exports = app; 