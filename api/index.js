// Vercel serverless function for EWA API
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import Neon database functions
const {
    getOfficers,
    getUsers,
    updateUser,
    getVolunteers,
    addVolunteer,
    getInsurance,
    addInsurance,
    getForm1099,
    addForm1099,
    getDocuments,
    addDocument,
    deleteDocument
} = require('../database/neon-functions');

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

// Function to load initial data from JSON files (fallback)
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

// Function to initialize database connection
async function initializeDatabase() {
    try {
        console.log('Initializing Neon database connection...');
        
        // Test the connection by getting officers
        const officers = await getOfficers();
        console.log(`Database connected successfully with ${officers.length} officers`);
        
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        console.log('Falling back to in-memory storage');
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



// Initialize database on first request
let dbInitialized = false;
async function ensureDatabaseInitialized() {
    if (!dbInitialized) {
        await initializeDatabase();
        dbInitialized = true;
    }
}

// API Routes

// Get all officers
app.get('/officers', async (req, res) => {
    try {
        await ensureDatabaseInitialized();
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
        await ensureDatabaseInitialized();
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
        databaseAvailable: !!process.env.DATABASE_URL,
        blobAvailable: !!blob,
        storage: 'Neon PostgreSQL'
    });
});

// User authentication
app.post('/login', async (req, res) => {
    try {
        await ensureDatabaseInitialized();
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

// 1099 Form Management

// Submit 1099 information
app.post('/1099', async (req, res) => {
    try {
        await ensureDatabaseInitialized();
        const { 
            recipientName, 
            recipientTin, 
            amount, 
            description, 
            submittedBy, 
            taxYear,
            w9Filename,
            w9BlobUrl,
            w9FileSize,
            w9MimeType
        } = req.body;
        
        if (!recipientName || !recipientTin || !amount || !submittedBy || !taxYear) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: recipientName, recipientTin, amount, submittedBy, taxYear' 
            });
        }

        // Validate W9 file is provided
        if (!w9Filename || !w9BlobUrl) {
            return res.status(400).json({ 
                success: false, 
                message: 'W9 form is required for 1099 submissions' 
            });
        }

        const form1099Data = {
            recipientName,
            recipientTin,
            amount: parseFloat(amount),
            description: description || '',
            submittedBy,
            taxYear: parseInt(taxYear),
            status: 'pending',
            w9Filename,
            w9BlobUrl,
            w9FileSize: w9FileSize ? parseInt(w9FileSize) : null,
            w9MimeType
        };

        const result = await addForm1099(form1099Data);
        if (result) {
            res.json({ 
                success: true, 
                message: '1099 information submitted successfully',
                submission: result
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save 1099 data' 
            });
        }
    } catch (error) {
        console.error('Error submitting 1099 form:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get all 1099 submissions (admin only)
app.get('/1099', async (req, res) => {
    try {
        await ensureDatabaseInitialized();
        const form1099Submissions = await getForm1099();
        res.json({ success: true, submissions: form1099Submissions });
    } catch (error) {
        console.error('Error getting all 1099 submissions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get 1099 submissions for a club
app.get('/1099/:club', async (req, res) => {
    try {
        await ensureDatabaseInitialized();
        const { club } = req.params;
        const form1099Submissions = await getForm1099();
        const clubSubmissions = form1099Submissions.filter(sub => sub.club === club);
        res.json({ success: true, submissions: clubSubmissions });
    } catch (error) {
        console.error('Error getting 1099 submissions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Upload W9 form for 1099 submission
app.post('/1099/upload-w9', async (req, res) => {
    try {
        // Check if blob storage is available
        if (!blob) {
            return res.status(500).json({
                success: false,
                message: 'File storage not available'
            });
        }

        // Handle file upload using multer or similar
        // For now, we'll expect the file data in the request body
        const { file, filename, mimeType } = req.body;
        
        if (!file || !filename) {
            return res.status(400).json({
                success: false,
                message: 'File data is required'
            });
        }

        // Validate file type (PDF, image, etc.)
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(mimeType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Only PDF and image files are allowed.'
            });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFilename = `w9-${timestamp}-${filename}`;

        // Upload to Vercel Blob
        const { url } = await blob.put(uniqueFilename, Buffer.from(file, 'base64'), {
            access: 'public',
            addRandomSuffix: false
        });

        res.json({
            success: true,
            message: 'W9 file uploaded successfully',
            filename: uniqueFilename,
            blobUrl: url,
            fileSize: Buffer.from(file, 'base64').length,
            mimeType
        });

    } catch (error) {
        console.error('Error uploading W9 file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload W9 file'
        });
    }
});

// Export for Vercel
module.exports = app; 