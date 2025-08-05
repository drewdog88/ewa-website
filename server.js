const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import Vercel KV for production
let kv;
if (process.env.NODE_ENV === 'production') {
    try {
        // Only try to import KV if we have the environment variables
        if (process.env.KV_URL || process.env.KV_REST_API_URL) {
            kv = require('@vercel/kv');
            console.log('Vercel KV initialized successfully');
        } else {
            console.log('Vercel KV environment variables not found, using in-memory storage');
        }
    } catch (error) {
        console.log('Vercel KV not available, using in-memory storage:', error.message);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for development fallback
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
    officers: [],
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

// Rate limiting (simple in-memory store - consider Redis for production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

app.use((req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(clientIP)) {
        rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else {
        const clientData = rateLimitStore.get(clientIP);
        if (now > clientData.resetTime) {
            clientData.count = 1;
            clientData.resetTime = now + RATE_LIMIT_WINDOW;
        } else {
            clientData.count++;
        }
        
        if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
            return res.status(429).json({ 
                success: false, 
                message: 'Too many requests. Please try again later.' 
            });
        }
    }
    
    next();
});

// Clean up rate limit store periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of rateLimitStore.entries()) {
        if (now > data.resetTime) {
            rateLimitStore.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW);

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? true : true,
    credentials: true
}));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Input validation middleware
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '').trim();
};

// Serve static files from the root directory with enhanced caching
app.use(express.static('.', {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    etag: true,
    lastModified: true,
    immutable: process.env.NODE_ENV === 'production'
}));

// Compression middleware for better performance
const compression = require('compression');
app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Helper functions for KV storage with fallback to in-memory
async function getVolunteers() {
    if (kv) {
        try {
            const data = await kv.get('volunteers');
            return data || [];
        } catch (error) {
            console.error('Error getting volunteers from KV:', error);
            return memoryStorage.volunteers;
        }
    }
    return memoryStorage.volunteers;
}

async function addVolunteer(volunteer) {
    if (kv) {
        try {
            const volunteers = await getVolunteers();
            volunteers.push(volunteer);
            await kv.set('volunteers', volunteers);
            return true;
        } catch (error) {
            console.error('Error adding volunteer to KV:', error);
            memoryStorage.volunteers.push(volunteer);
            return true;
        }
    }
    memoryStorage.volunteers.push(volunteer);
    return true;
}

async function updateVolunteer(id, updates) {
    if (kv) {
        try {
            const volunteers = await getVolunteers();
            const index = volunteers.findIndex(v => v.id === id);
            if (index !== -1) {
                volunteers[index] = { ...volunteers[index], ...updates };
                await kv.set('volunteers', volunteers);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating volunteer in KV:', error);
            const index = memoryStorage.volunteers.findIndex(v => v.id === id);
            if (index !== -1) {
                memoryStorage.volunteers[index] = { ...memoryStorage.volunteers[index], ...updates };
                return true;
            }
            return false;
        }
    }
    const index = memoryStorage.volunteers.findIndex(v => v.id === id);
    if (index !== -1) {
        memoryStorage.volunteers[index] = { ...memoryStorage.volunteers[index], ...updates };
        return true;
    }
    return false;
}

async function getUsers() {
    if (kv) {
        try {
            const data = await kv.get('users');
            return data || memoryStorage.users;
        } catch (error) {
            console.error('Error getting users from KV:', error);
            return memoryStorage.users;
        }
    }
    return memoryStorage.users;
}

async function updateUser(username, updates) {
    if (kv) {
        try {
            const users = await getUsers();
            if (users[username]) {
                users[username] = { ...users[username], ...updates };
                await kv.set('users', users);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating user in KV:', error);
            if (memoryStorage.users[username]) {
                memoryStorage.users[username] = { ...memoryStorage.users[username], ...updates };
                return true;
            }
            return false;
        }
    }
    if (memoryStorage.users[username]) {
        memoryStorage.users[username] = { ...memoryStorage.users[username], ...updates };
        return true;
    }
    return false;
}

async function addUser(username, userData) {
    if (kv) {
        try {
            const users = await getUsers();
            users[username] = userData;
            await kv.set('users', users);
            return true;
        } catch (error) {
            console.error('Error adding user to KV:', error);
            memoryStorage.users[username] = userData;
            return true;
        }
    }
    memoryStorage.users[username] = userData;
    return true;
}

async function deleteUser(username) {
    if (kv) {
        try {
            const users = await getUsers();
            if (users[username]) {
                delete users[username];
                await kv.set('users', users);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting user from KV:', error);
            if (memoryStorage.users[username]) {
                delete memoryStorage.users[username];
                return true;
            }
            return false;
        }
    }
    if (memoryStorage.users[username]) {
        delete memoryStorage.users[username];
        return true;
    }
    return false;
}

async function getOfficers() {
    if (kv) {
        try {
            const data = await kv.get('officers');
            return data || [];
        } catch (error) {
            console.error('Error getting officers from KV:', error);
            return memoryStorage.officers;
        }
    }
    return memoryStorage.officers;
}

async function addOfficer(officer) {
    if (kv) {
        try {
            const officers = await getOfficers();
            officers.push(officer);
            await kv.set('officers', officers);
            return true;
        } catch (error) {
            console.error('Error adding officer to KV:', error);
            memoryStorage.officers.push(officer);
            return true;
        }
    }
    memoryStorage.officers.push(officer);
    return true;
}

async function updateOfficer(id, updates) {
    if (kv) {
        try {
            const officers = await getOfficers();
            const index = officers.findIndex(o => o.id === id);
            if (index !== -1) {
                officers[index] = { ...officers[index], ...updates };
                await kv.set('officers', officers);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating officer in KV:', error);
            const index = memoryStorage.officers.findIndex(o => o.id === id);
            if (index !== -1) {
                memoryStorage.officers[index] = { ...memoryStorage.officers[index], ...updates };
                return true;
            }
            return false;
        }
    }
    const index = memoryStorage.officers.findIndex(o => o.id === id);
    if (index !== -1) {
        memoryStorage.officers[index] = { ...memoryStorage.officers[index], ...updates };
        return true;
    }
    return false;
}

async function deleteOfficer(id) {
    if (kv) {
        try {
            const officers = await getOfficers();
            const index = officers.findIndex(o => o.id === id);
            if (index !== -1) {
                officers.splice(index, 1);
                await kv.set('officers', officers);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting officer from KV:', error);
            const index = memoryStorage.officers.findIndex(o => o.id === id);
            if (index !== -1) {
                memoryStorage.officers.splice(index, 1);
                return true;
            }
            return false;
        }
    }
    const index = memoryStorage.officers.findIndex(o => o.id === id);
    if (index !== -1) {
        memoryStorage.officers.splice(index, 1);
        return true;
    }
    return false;
}

async function getInsurance() {
    if (kv) {
        try {
            const data = await kv.get('insurance');
            return data || [];
        } catch (error) {
            console.error('Error getting insurance from KV:', error);
            return memoryStorage.insurance;
        }
    }
    return memoryStorage.insurance;
}

async function addInsurance(insuranceData) {
    if (kv) {
        try {
            const insurance = await getInsurance();
            insurance.push(insuranceData);
            await kv.set('insurance', insurance);
            return true;
        } catch (error) {
            console.error('Error adding insurance to KV:', error);
            memoryStorage.insurance.push(insuranceData);
            return true;
        }
    }
    memoryStorage.insurance.push(insuranceData);
    return true;
}

async function getForm1099() {
    if (kv) {
        try {
            const data = await kv.get('form1099');
            return data || [];
        } catch (error) {
            console.error('Error getting form1099 from KV:', error);
            return memoryStorage.form1099;
        }
    }
    return memoryStorage.form1099;
}

async function addForm1099(formData) {
    if (kv) {
        try {
            const form1099 = await getForm1099();
            form1099.push(formData);
            await kv.set('form1099', form1099);
            return true;
        } catch (error) {
            console.error('Error adding form1099 to KV:', error);
            memoryStorage.form1099.push(formData);
            return true;
        }
    }
    memoryStorage.form1099.push(formData);
    return true;
}

// API Routes

// Submit volunteer interest
app.post('/api/volunteers', async (req, res) => {
    try {
        console.log('Received volunteer submission request:', req.body);
        
        const { boosterClub, volunteerName, childName, email, phone } = req.body;
        
        // Sanitize inputs
        const sanitizedBoosterClub = sanitizeInput(boosterClub);
        const sanitizedVolunteerName = sanitizeInput(volunteerName);
        const sanitizedChildName = sanitizeInput(childName);
        const sanitizedEmail = sanitizeInput(email);
        const sanitizedPhone = sanitizeInput(phone);
        
        // Validate required fields
        if (!sanitizedBoosterClub || !sanitizedVolunteerName || !sanitizedEmail) {
            const missingFields = [];
            if (!sanitizedBoosterClub) missingFields.push('boosterClub');
            if (!sanitizedVolunteerName) missingFields.push('volunteerName');
            if (!sanitizedEmail) missingFields.push('email');
            
            return res.status(400).json({ 
                success: false, 
                message: `Missing required fields: ${missingFields.join(', ')}` 
            });
        }
        
        // Validate email format
        if (!validateEmail(sanitizedEmail)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Validate phone format if provided
        if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        const newVolunteer = {
            id: Date.now().toString(),
            boosterClub: sanitizedBoosterClub,
            volunteerName: sanitizedVolunteerName,
            childName: sanitizedChildName || '',
            email: sanitizedEmail,
            phone: sanitizedPhone || '',
            status: 'pending',
            submittedAt: new Date().toISOString()
        };

        console.log('Adding new volunteer:', newVolunteer);
        
        if (await addVolunteer(newVolunteer)) {
            console.log('Volunteer saved successfully');
            res.json({ 
                success: true, 
                message: 'Volunteer interest submitted successfully',
                volunteer: newVolunteer
            });
        } else {
            console.error('Failed to save volunteer data');
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save volunteer data' 
            });
        }
    } catch (error) {
        console.error('Error submitting volunteer:', error);
        res.status(500).json({ 
            success: false, 
            message: `Internal server error: ${error.message}` 
        });
    }
});

// Get all volunteers (for admin)
app.get('/api/volunteers', async (req, res) => {
    try {
        const volunteers = await getVolunteers();
        res.json({ success: true, volunteers });
    } catch (error) {
        console.error('Error getting volunteers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get volunteers by club (for booster club officers)
app.get('/api/volunteers/:club', async (req, res) => {
    try {
        const { club } = req.params;
        const volunteers = await getVolunteers();
        const clubVolunteers = volunteers.filter(v => v.boosterClub === club);
        res.json({ success: true, volunteers: clubVolunteers });
    } catch (error) {
        console.error('Error getting club volunteers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update volunteer status
app.put('/api/volunteers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Status is required' 
            });
        }

        const updates = { status, updatedAt: new Date().toISOString() };
        if (notes) {
            updates.notes = notes;
        }

        if (await updateVolunteer(id, updates)) {
            const volunteers = await getVolunteers();
            const volunteer = volunteers.find(v => v.id === id);
            res.json({ 
                success: true, 
                message: 'Volunteer status updated successfully',
                volunteer
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Volunteer not found' 
            });
        }
    } catch (error) {
        console.error('Error updating volunteer status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// User authentication
app.post('/api/login', async (req, res) => {
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

// Get users (for admin)
app.get('/api/users', async (req, res) => {
    try {
        const users = await getUsers();
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Create new user (for admin)
app.post('/api/users', async (req, res) => {
    try {
        const { username, password, role, club, clubName } = req.body;
        
        if (!username || !password || !role || !club || !clubName) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, password, role, club, clubName' 
            });
        }

        const users = await getUsers();
        
        if (users[username]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        const newUser = {
            username,
            password,
            role,
            club,
            clubName,
            createdAt: new Date().toISOString(),
            isLocked: false,
            isFirstLogin: true,
            secretQuestion: "",
            secretAnswer: "",
            lastLogin: null
        };

        if (await addUser(username, newUser)) {
            res.json({ 
                success: true, 
                message: 'User created successfully',
                user: {
                    username,
                    role,
                    club,
                    clubName
                }
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save user data' 
            });
        }
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Booster Admin API Routes

// Submit insurance form
app.post('/api/insurance', async (req, res) => {
    try {
        const { club, eventName, eventDate, eventDescription, participantCount } = req.body;
        
        if (!club || !eventName || !eventDate || !eventDescription) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: club, eventName, eventDate, eventDescription' 
            });
        }

        const insuranceData = {
            id: Date.now().toString(),
            club,
            eventName,
            eventDate,
            eventDescription,
            participantCount: participantCount || 0,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };

        if (await addInsurance(insuranceData)) {
            res.json({ 
                success: true, 
                message: 'Insurance form submitted successfully',
                submission: insuranceData
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save insurance data' 
            });
        }
    } catch (error) {
        console.error('Error submitting insurance form:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get insurance submissions for a club
app.get('/api/insurance/:club', async (req, res) => {
    try {
        const { club } = req.params;
        const insuranceSubmissions = await getInsurance();
        const clubSubmissions = insuranceSubmissions.filter(sub => sub.club === club);
        res.json({ success: true, submissions: clubSubmissions });
    } catch (error) {
        console.error('Error getting insurance submissions:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Submit 1099 information
app.post('/api/1099', async (req, res) => {
    try {
        const { club, vendorName, vendorTaxId, paymentAmount, vendorAddress, vendorCity, vendorState, vendorZip } = req.body;
        
        if (!club || !vendorName || !vendorTaxId || !paymentAmount) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: club, vendorName, vendorTaxId, paymentAmount' 
            });
        }

        const form1099Data = {
            id: Date.now().toString(),
            club,
            vendorName,
            vendorTaxId,
            paymentAmount: parseFloat(paymentAmount),
            vendorAddress: vendorAddress || '',
            vendorCity: vendorCity || '',
            vendorState: vendorState || '',
            vendorZip: vendorZip || '',
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };

        if (await addForm1099(form1099Data)) {
            res.json({ 
                success: true, 
                message: '1099 information submitted successfully',
                submission: form1099Data
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

// Get 1099 submissions for a club
app.get('/api/1099/:club', async (req, res) => {
    try {
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

// User Management API Routes

// Update user (admin only)
app.put('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { newUsername, password, role, club, clubName, isLocked } = req.body;
        
        const users = await getUsers();
        
        if (!users[username]) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Update user data
        if (newUsername && newUsername !== username) {
            if (users[newUsername]) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'New username already exists' 
                });
            }
            const userData = { ...users[username], username: newUsername };
            await addUser(newUsername, userData);
            await deleteUser(username);
        } else {
            const updates = {};
            if (password) updates.password = password;
            if (role) updates.role = role;
            if (club !== undefined) updates.club = club;
            if (clubName !== undefined) updates.clubName = clubName;
            if (isLocked !== undefined) updates.isLocked = isLocked;
            await updateUser(username, updates);
        }

        res.json({ 
            success: true, 
            message: 'User updated successfully',
            user: users[newUsername || username]
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Delete user (admin only)
app.delete('/api/users/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        if (await deleteUser(username)) {
            res.json({ 
                success: true, 
                message: 'User deleted successfully'
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Change password (self-service)
app.post('/api/users/change-password', async (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        
        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, currentPassword, newPassword' 
            });
        }

        const users = await getUsers();
        
        if (!users[username]) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (users[username].password !== currentPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        if (await updateUser(username, { password: newPassword })) {
            res.json({ 
                success: true, 
                message: 'Password changed successfully'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save user data' 
            });
        }
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Setup secret question/answer (first login)
app.post('/api/users/setup-profile', async (req, res) => {
    try {
        const { username, secretQuestion, secretAnswer } = req.body;
        
        if (!username || !secretQuestion || !secretAnswer) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, secretQuestion, secretAnswer' 
            });
        }

        const updates = {
            secretQuestion,
            secretAnswer,
            isFirstLogin: false
        };

        if (await updateUser(username, updates)) {
            res.json({ 
                success: true, 
                message: 'Profile setup completed successfully'
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }
    } catch (error) {
        console.error('Error setting up profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Forgot password (using secret question/answer)
app.post('/api/users/forgot-password', async (req, res) => {
    try {
        const { username, secretAnswer, newPassword } = req.body;
        
        if (!username || !secretAnswer || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, secretAnswer, newPassword' 
            });
        }

        const users = await getUsers();
        
        if (!users[username]) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (users[username].secretAnswer !== secretAnswer) {
            return res.status(400).json({ 
                success: false, 
                message: 'Secret answer is incorrect' 
            });
        }

        if (await updateUser(username, { password: newPassword })) {
            res.json({ 
                success: true, 
                message: 'Password reset successfully'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save user data' 
            });
        }
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Get secret question for forgot password
app.get('/api/users/:username/secret-question', async (req, res) => {
    try {
        const { username } = req.params;
        
        const users = await getUsers();
        
        if (!users[username]) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (!users[username].secretQuestion) {
            return res.status(400).json({ 
                success: false, 
                message: 'Secret question not set up for this user' 
            });
        }

        res.json({ 
            success: true, 
            secretQuestion: users[username].secretQuestion
        });
    } catch (error) {
        console.error('Error getting secret question:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Officer Management API Endpoints

// Get all officers
app.get('/api/officers', async (req, res) => {
    try {
        const officers = await getOfficers();
        res.json({ success: true, officers });
    } catch (error) {
        console.error('Error getting officers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get officers by club
app.get('/api/officers/:club', async (req, res) => {
    try {
        const { club } = req.params;
        const officers = await getOfficers();
        const clubOfficers = officers.filter(officer => officer.club === club);
        res.json({ success: true, officers: clubOfficers });
    } catch (error) {
        console.error('Error getting club officers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add new officer
app.post('/api/officers', async (req, res) => {
    try {
        const { name, position, email, phone, booster_club } = req.body;
        
        if (!name || !position || !email || !phone || !booster_club) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: name, position, email, phone, booster_club' 
            });
        }

        // Map booster club names to short identifiers
        const clubMapping = {
            'EHS Band Boosters': 'band',
            'EHS Orchestra Boosters Club': 'orchestra',
            'EHS Choir Boosters': 'choir',
            'EHS Drama Boosters': 'drama',
            'EHS Art Boosters': 'art',
            'EHS Debate Boosters': 'debate',
            'EHS Robotics Boosters': 'robotics',
            'EHS Soccer Boosters': 'soccer',
            'EHS Basketball Boosters': 'basketball',
            'EHS Volleyball Boosters': 'volleyball',
            'EHS Track Boosters': 'track',
            'EHS Swimming Boosters': 'swimming',
            'EHS Tennis Boosters': 'tennis',
            'EHS Golf Boosters': 'golf',
            'EHS Baseball Boosters': 'baseball',
            'EHS Softball Boosters': 'softball',
            'EHS Football Boosters': 'football',
            'EHS Wrestling Boosters': 'wrestling',
            'EHS Cheerleading Boosters': 'cheerleading',
            'EHS Dance Boosters': 'dance',
            'EHS Yearbook Boosters': 'yearbook',
            'EHS Newspaper Boosters': 'newspaper',
            'EHS Photography Boosters': 'photography',
            'EHS Video Boosters': 'video'
        };

        const club = clubMapping[booster_club];
        if (!club) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid booster club name. Please use one of the standard club names.' 
            });
        }

        const newOfficer = {
            id: Date.now().toString(),
            name,
            position,
            email,
            phone,
            club,
            clubName: booster_club,
            createdAt: new Date().toISOString()
        };

        if (await addOfficer(newOfficer)) {
            res.json({ 
                success: true, 
                message: 'Officer added successfully',
                officer: newOfficer
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save officer data' 
            });
        }
    } catch (error) {
        console.error('Error adding officer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Update officer
app.put('/api/officers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, position, email, phone, booster_club } = req.body;
        
        if (!name || !position || !email || !phone || !booster_club) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: name, position, email, phone, booster_club' 
            });
        }

        // Map booster club names to short identifiers
        const clubMapping = {
            'EHS Band Boosters': 'band',
            'EHS Orchestra Boosters Club': 'orchestra',
            'EHS Choir Boosters': 'choir',
            'EHS Drama Boosters': 'drama',
            'EHS Art Boosters': 'art',
            'EHS Debate Boosters': 'debate',
            'EHS Robotics Boosters': 'robotics',
            'EHS Soccer Boosters': 'soccer',
            'EHS Basketball Boosters': 'basketball',
            'EHS Volleyball Boosters': 'volleyball',
            'EHS Track Boosters': 'track',
            'EHS Swimming Boosters': 'swimming',
            'EHS Tennis Boosters': 'tennis',
            'EHS Golf Boosters': 'golf',
            'EHS Baseball Boosters': 'baseball',
            'EHS Softball Boosters': 'softball',
            'EHS Football Boosters': 'football',
            'EHS Wrestling Boosters': 'wrestling',
            'EHS Cheerleading Boosters': 'cheerleading',
            'EHS Dance Boosters': 'dance',
            'EHS Yearbook Boosters': 'yearbook',
            'EHS Newspaper Boosters': 'newspaper',
            'EHS Photography Boosters': 'photography',
            'EHS Video Boosters': 'video'
        };

        const club = clubMapping[booster_club];
        if (!club) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid booster club name. Please use one of the standard club names.' 
            });
        }

        const updates = {
            name,
            position,
            email,
            phone,
            club,
            clubName: booster_club,
            updatedAt: new Date().toISOString()
        };

        if (await updateOfficer(id, updates)) {
            const officers = await getOfficers();
            const officer = officers.find(o => o.id === id);
            res.json({ 
                success: true, 
                message: 'Officer updated successfully',
                officer
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Officer not found' 
            });
        }
    } catch (error) {
        console.error('Error updating officer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Delete officer
app.delete('/api/officers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (await deleteOfficer(id)) {
            res.json({ 
                success: true, 
                message: 'Officer deleted successfully'
            });
        } else {
            res.status(404).json({ 
                success: false, 
                message: 'Officer not found' 
            });
        }
    } catch (error) {
        console.error('Error deleting officer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Download officer import template
app.get('/api/officers/template', (req, res) => {
    try {
        const templatePath = path.join(__dirname, 'data', 'officer_import_template.csv');
        
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Template file not found' 
            });
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="officer_import_template.csv"');
        
        const fileStream = fs.createReadStream(templatePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading template:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        kvAvailable: !!kv,
        storage: kv ? 'Vercel KV' : 'In-memory'
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all route for SPA
app.get('*', (req, res) => {
    // Try to serve static files first
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.sendFile(filePath);
    } else {
        // Fallback to main page for SPA routing
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`EWA Website server running on http://localhost:${PORT}`);
    console.log(`Storage: ${kv ? 'Vercel KV (production)' : 'In-memory (development)'}`);
    console.log(`Orchestra Booster login: orchestra_booster / ewa_orchestra_2025`);
}); 