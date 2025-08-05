const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the root directory
app.use(express.static('.'));

// Data file paths
const VOLUNTEERS_FILE = 'data/volunteers.json';
const USERS_FILE = 'data/users.json';

// Ensure data directory exists
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// Initialize JSON files if they don't exist
if (!fs.existsSync(VOLUNTEERS_FILE)) {
    fs.writeFileSync(VOLUNTEERS_FILE, JSON.stringify([], null, 2));
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
            "role": "booster_officer",
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
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return [];
    }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// API Routes

// Submit volunteer interest
app.post('/api/volunteers', (req, res) => {
    try {
        const { boosterClub, volunteerName, childName, email, phone } = req.body;
        
        // Validate required fields
        if (!boosterClub || !volunteerName || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: boosterClub, volunteerName, email' 
            });
        }

        const volunteers = readJsonFile(VOLUNTEERS_FILE);
        
        const newVolunteer = {
            id: Date.now().toString(),
            boosterClub,
            volunteerName,
            childName: childName || '',
            email,
            phone: phone || '',
            status: 'pending',
            submittedAt: new Date().toISOString()
        };

        volunteers.push(newVolunteer);
        
        if (writeJsonFile(VOLUNTEERS_FILE, volunteers)) {
            res.json({ 
                success: true, 
                message: 'Volunteer interest submitted successfully',
                volunteer: newVolunteer
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Failed to save volunteer data' 
            });
        }
    } catch (error) {
        console.error('Error submitting volunteer:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
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

        if (user && user.password === password) {
            res.json({ 
                success: true, 
                message: 'Login successful',
                user: {
                    username: user.username,
                    role: user.role,
                    club: user.club,
                    clubName: user.clubName
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid username or password' 
            });
        }
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
            createdAt: new Date().toISOString()
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