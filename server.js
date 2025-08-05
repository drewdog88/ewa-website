const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Data file paths
const VOLUNTEERS_FILE = 'data/volunteers.json';
const USERS_FILE = 'data/users.json';
const OFFICERS_FILE = 'data/officers.json';

// Ensure data directory exists
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// Initialize JSON files if they don't exist
if (!fs.existsSync(VOLUNTEERS_FILE)) {
    fs.writeFileSync(VOLUNTEERS_FILE, JSON.stringify([], null, 2));
}

// Initialize insurance data file
const INSURANCE_FILE = 'data/insurance.json';
if (!fs.existsSync(INSURANCE_FILE)) {
    fs.writeFileSync(INSURANCE_FILE, JSON.stringify([], null, 2));
}

// Initialize 1099 data file
const FORM1099_FILE = 'data/1099.json';
if (!fs.existsSync(FORM1099_FILE)) {
    fs.writeFileSync(FORM1099_FILE, JSON.stringify([], null, 2));
}

// Initialize officers data file
if (!fs.existsSync(OFFICERS_FILE)) {
    fs.writeFileSync(OFFICERS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(USERS_FILE)) {
    // Create initial users data with Orchestra Booster account and admin
    const initialUsers = {
        "admin": {
            "username": "admin",
            "password": "ewa2025",
            "role": "admin",
            "club": "",
            "clubName": "",
            "createdAt": new Date().toISOString()
        },
        "orchestra_booster": {
            "username": "orchestra_booster",
            "password": "ewa_orchestra_2025",
            "role": "booster_admin",
            "club": "orchestra",
            "clubName": "EHS Orchestra Boosters Club",
            "createdAt": new Date().toISOString()
        }
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
}

// Helper function to read JSON file
function readJsonFile(filePath) {
    try {
        console.log(`Reading file: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.log(`File does not exist: ${filePath}`);
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        console.log(`Successfully read file: ${filePath}, data type: ${typeof parsed}`);
        return parsed;
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        console.error(`Error details: ${error.message}`);
        return [];
    }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
    try {
        console.log(`Writing file: ${filePath}`);
        console.log(`Data to write:`, data);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`Successfully wrote file: ${filePath}`);
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        console.error(`Error details: ${error.message}`);
        return false;
    }
}

// API Routes

// Submit volunteer interest
app.post('/api/volunteers', (req, res) => {
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

        console.log('Reading volunteers file...');
        const volunteers = readJsonFile(VOLUNTEERS_FILE);
        console.log('Current volunteers count:', volunteers.length);
        
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
        volunteers.push(newVolunteer);
        
        console.log('Writing volunteers file...');
        if (writeJsonFile(VOLUNTEERS_FILE, volunteers)) {
            console.log('Volunteer saved successfully');
            res.json({ 
                success: true, 
                message: 'Volunteer interest submitted successfully',
                volunteer: newVolunteer
            });
        } else {
            console.error('Failed to write volunteer data to file');
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save volunteer data - file write error' 
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
app.get('/api/volunteers', (req, res) => {
    try {
        const volunteers = readJsonFile(VOLUNTEERS_FILE);
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
app.get('/api/volunteers/:club', (req, res) => {
    try {
        const { club } = req.params;
        const volunteers = readJsonFile(VOLUNTEERS_FILE);
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
app.put('/api/volunteers/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        
        if (!status) {
            return res.status(400).json({ 
                success: false, 
                message: 'Status is required' 
            });
        }

        const volunteers = readJsonFile(VOLUNTEERS_FILE);
        const volunteerIndex = volunteers.findIndex(v => v.id === id);
        
        if (volunteerIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Volunteer not found' 
            });
        }

        // Update the volunteer status
        volunteers[volunteerIndex].status = status;
        if (notes) {
            volunteers[volunteerIndex].notes = notes;
        }
        volunteers[volunteerIndex].updatedAt = new Date().toISOString();

        if (writeJsonFile(VOLUNTEERS_FILE, volunteers)) {
            res.json({ 
                success: true, 
                message: 'Volunteer status updated successfully',
                volunteer: volunteers[volunteerIndex]
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to update volunteer status' 
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
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password required' 
            });
        }

        const users = readJsonFile(USERS_FILE);
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
        user.lastLogin = new Date().toISOString();
        writeJsonFile(USERS_FILE, users);

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
app.get('/api/users', (req, res) => {
    try {
        const users = readJsonFile(USERS_FILE);
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
app.post('/api/users', (req, res) => {
    try {
        const { username, password, role, club, clubName } = req.body;
        
        if (!username || !password || !role || !club || !clubName) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, password, role, club, clubName' 
            });
        }

        const users = readJsonFile(USERS_FILE);
        
        if (users[username]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        users[username] = {
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

        if (writeJsonFile(USERS_FILE, users)) {
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
app.post('/api/insurance', (req, res) => {
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

        // Store in insurance.json file
        const INSURANCE_FILE = 'data/insurance.json';
        const insuranceSubmissions = readJsonFile(INSURANCE_FILE);
        insuranceSubmissions.push(insuranceData);
        
        if (writeJsonFile(INSURANCE_FILE, insuranceSubmissions)) {
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
app.get('/api/insurance/:club', (req, res) => {
    try {
        const { club } = req.params;
        const INSURANCE_FILE = 'data/insurance.json';
        const insuranceSubmissions = readJsonFile(INSURANCE_FILE);
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
app.post('/api/1099', (req, res) => {
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

        // Store in 1099.json file
        const FORM1099_FILE = 'data/1099.json';
        const form1099Submissions = readJsonFile(FORM1099_FILE);
        form1099Submissions.push(form1099Data);
        
        if (writeJsonFile(FORM1099_FILE, form1099Submissions)) {
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
app.get('/api/1099/:club', (req, res) => {
    try {
        const { club } = req.params;
        const FORM1099_FILE = 'data/1099.json';
        const form1099Submissions = readJsonFile(FORM1099_FILE);
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
app.put('/api/users/:username', (req, res) => {
    try {
        const { username } = req.params;
        const { newUsername, password, role, club, clubName, isLocked } = req.body;
        
        const users = readJsonFile(USERS_FILE);
        
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
            users[newUsername] = { ...users[username], username: newUsername };
            delete users[username];
        } else {
            if (password) users[username].password = password;
            if (role) users[username].role = role;
            if (club !== undefined) users[username].club = club;
            if (clubName !== undefined) users[username].clubName = clubName;
            if (isLocked !== undefined) users[username].isLocked = isLocked;
        }

        if (writeJsonFile(USERS_FILE, users)) {
            res.json({ 
                success: true, 
                message: 'User updated successfully',
                user: users[newUsername || username]
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save user data' 
            });
        }
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Delete user (admin only)
app.delete('/api/users/:username', (req, res) => {
    try {
        const { username } = req.params;
        
        const users = readJsonFile(USERS_FILE);
        
        if (!users[username]) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        delete users[username];

        if (writeJsonFile(USERS_FILE, users)) {
            res.json({ 
                success: true, 
                message: 'User deleted successfully'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save user data' 
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
app.post('/api/users/change-password', (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        
        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, currentPassword, newPassword' 
            });
        }

        const users = readJsonFile(USERS_FILE);
        
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

        users[username].password = newPassword;

        if (writeJsonFile(USERS_FILE, users)) {
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
app.post('/api/users/setup-profile', (req, res) => {
    try {
        const { username, secretQuestion, secretAnswer } = req.body;
        
        if (!username || !secretQuestion || !secretAnswer) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, secretQuestion, secretAnswer' 
            });
        }

        const users = readJsonFile(USERS_FILE);
        
        if (!users[username]) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        users[username].secretQuestion = secretQuestion;
        users[username].secretAnswer = secretAnswer;
        users[username].isFirstLogin = false;

        if (writeJsonFile(USERS_FILE, users)) {
            res.json({ 
                success: true, 
                message: 'Profile setup completed successfully'
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save user data' 
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
app.post('/api/users/forgot-password', (req, res) => {
    try {
        const { username, secretAnswer, newPassword } = req.body;
        
        if (!username || !secretAnswer || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields required: username, secretAnswer, newPassword' 
            });
        }

        const users = readJsonFile(USERS_FILE);
        
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

        users[username].password = newPassword;

        if (writeJsonFile(USERS_FILE, users)) {
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
app.get('/api/users/:username/secret-question', (req, res) => {
    try {
        const { username } = req.params;
        
        const users = readJsonFile(USERS_FILE);
        
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
app.get('/api/officers', (req, res) => {
    try {
        const officers = readJsonFile(OFFICERS_FILE);
        res.json({ success: true, officers });
    } catch (error) {
        console.error('Error getting officers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Get officers by club
app.get('/api/officers/:club', (req, res) => {
    try {
        const { club } = req.params;
        const officers = readJsonFile(OFFICERS_FILE);
        const clubOfficers = officers.filter(officer => officer.club === club);
        res.json({ success: true, officers: clubOfficers });
    } catch (error) {
        console.error('Error getting club officers:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add new officer
app.post('/api/officers', (req, res) => {
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

        const officers = readJsonFile(OFFICERS_FILE);
        
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

        officers.push(newOfficer);

        if (writeJsonFile(OFFICERS_FILE, officers)) {
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
app.put('/api/officers/:id', (req, res) => {
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

        const officers = readJsonFile(OFFICERS_FILE);
        const officerIndex = officers.findIndex(officer => officer.id === id);
        
        if (officerIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Officer not found' 
            });
        }

        officers[officerIndex] = {
            ...officers[officerIndex],
            name,
            position,
            email,
            phone,
            club,
            clubName: booster_club,
            updatedAt: new Date().toISOString()
        };

        if (writeJsonFile(OFFICERS_FILE, officers)) {
            res.json({ 
                success: true, 
                message: 'Officer updated successfully',
                officer: officers[officerIndex]
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save officer data' 
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
app.delete('/api/officers/:id', (req, res) => {
    try {
        const { id } = req.params;
        
        const officers = readJsonFile(OFFICERS_FILE);
        const officerIndex = officers.findIndex(officer => officer.id === id);
        
        if (officerIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'Officer not found' 
            });
        }

        const deletedOfficer = officers.splice(officerIndex, 1)[0];

        if (writeJsonFile(OFFICERS_FILE, officers)) {
            res.json({ 
                success: true, 
                message: 'Officer deleted successfully',
                officer: deletedOfficer
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save officer data' 
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

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`EWA Website server running on http://localhost:${PORT}`);
    console.log(`Volunteer data will be stored in: ${VOLUNTEERS_FILE}`);
    console.log(`User data will be stored in: ${USERS_FILE}`);
    console.log(`Orchestra Booster login: orchestra_booster / ewa_orchestra_2025`);
}); 