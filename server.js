// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import logger
const logger = require('./utils/logger');

// Error handling utilities
const ErrorHandler = {
  // Log error with context
  logError: (operation, error, req = null) => {
    const requestInfo = req ? {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    } : {};
        
    logger.error(`${operation} failed`, {
      error: error.message,
      stack: error.stack,
      request: requestInfo,
      operation
    });
  },

  // Get user-friendly error message
  getUserMessage: (operation, error) => {
    const errorMessages = {
      'database_connection': 'Database connection failed. Please try again later.',
      'database_query': 'Unable to retrieve data. Please try again.',
      'database_save': 'Unable to save data. Please try again.',
      'authentication': 'Authentication failed. Please check your credentials.',
      'authorization': 'You do not have permission to perform this action.',
      'validation': 'Invalid data provided. Please check your input.',
      'file_upload': 'File upload failed. Please try again.',
      'file_not_found': 'The requested file was not found.',
      'rate_limit': 'Too many requests. Please wait before trying again.',
      'blob_storage': 'File storage is currently unavailable. Please try again later.',
      'unknown': 'An unexpected error occurred. Please try again later.'
    };

    // Determine error type
    let errorType = 'unknown';
    if (error.message.includes('connection') || error.message.includes('DATABASE_URL')) {
      errorType = 'database_connection';
    } else if (error.message.includes('query') || error.message.includes('relation')) {
      errorType = 'database_query';
    } else if (error.message.includes('insert') || error.message.includes('update')) {
      errorType = 'database_save';
    } else if (error.message.includes('password') || error.message.includes('username')) {
      errorType = 'authentication';
    } else if (error.message.includes('permission') || error.message.includes('role')) {
      errorType = 'authorization';
    } else if (error.message.includes('validation') || error.message.includes('required')) {
      errorType = 'validation';
    } else if (error.message.includes('blob') || error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      errorType = 'blob_storage';
    }

    return errorMessages[errorType];
  },

  // Send error response
  sendError: (res, operation, error, statusCode = 500, req = null) => {
    this.logError(operation, error, req);
    const userMessage = this.getUserMessage(operation, error);
        
    res.status(statusCode).json({
      success: false,
      message: userMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Import Neon database functions
const {
  getOfficers,
  addOfficer,
  getUsers,
  updateUser,
  getVolunteers,
  addVolunteer,
  getInsurance,
  addInsurance,
  updateInsuranceStatus,
  deleteInsuranceSubmission,
  getForm1099,
  addForm1099,
  updateForm1099Status, updateForm1099, deleteForm1099,
  getDocuments,
  addDocument,
  deleteDocument,
  getNews,
  getPublishedNews,
  addNews,
  updateNews,
  publishNews,
  deleteNews,
  getLinks,
  getAllLinks,
  addLink,
  updateLink,
  deleteLink,
  incrementLinkClicks,
  getBoosterClubs,
  getBoosterClubByName,
  updateBoosterClubDescription,
  updateBoosterClubWebsite
} = require('./database/neon-functions');

// Import Vercel Blob for file storage

// Initialize backup system
let backupManager;
let backupManagerError = null;
try {
  // Use serverless backup manager for production, file-based for local development
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    const ServerlessBackupManager = require('./backup/backup-manager-serverless');
    backupManager = new ServerlessBackupManager();
    console.log('💾 Serverless backup system initialized');
  } else {
    const BackupManager = require('./backup/backup-manager');
    backupManager = new BackupManager();
    console.log('💾 Local backup system initialized');
  }
} catch (error) {
  backupManagerError = error;
  console.error('⚠️ Backup system initialization failed:', error.message);
  console.error('⚠️ Backup API endpoints will return error responses');
}
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
const PORT = process.env.PORT || 3000;

// Function to load initial data from JSON files (fallback)
function loadInitialData() {
  try {
    // Load officers data
    const officersPath = path.join(__dirname, 'data', 'officers.json');
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

// Function to generate CSV from 1099 submissions
function generateCSV(submissions) {
  const headers = [
    'Date Submitted',
    'Recipient Name',
    'Tax ID',
    'Amount',
    'Description',
    'Calendar Year',
    'Booster Club',
    'W9 Status',
    'Status',
    'Submitted By'
  ];
    
  const rows = submissions.map(sub => [
    new Date(sub.created_at).toLocaleDateString(),
    sub.recipient_name,
    sub.recipient_tin,
    sub.amount,
    sub.description || '',
    sub.tax_year,
    sub.booster_club || '',
    sub.w9_filename ? 'W9 Received' : 'W9 Not Received',
    sub.status || 'pending',
    sub.submitted_by
  ]);
    
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
}

// Function to initialize database connection
async function initializeDatabase() {
  try {
    console.log('Initializing Neon database connection...');
        
    // Test the connection by getting officers
    const officers = await getOfficers();
    console.log(`Database connected successfully with ${officers.length} officers`);
        
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('⚠️ Falling back to in-memory storage');
    console.log('💡 Check your DATABASE_URL environment variable');
  }
}
        


// In-memory storage for development fallback
const initialData = loadInitialData();
const memoryStorage = {
  volunteers: [],
  users: {
    'admin': {
      'username': 'admin',
      'password': 'ewa2025',
      'role': 'admin',
      'club': '',
      'clubName': '',
      'createdAt': new Date().toISOString(),
      'isLocked': false,
      'isFirstLogin': false,
      'secretQuestion': '',
      'secretAnswer': '',
      'lastLogin': null
    },
    'orchestra_booster': {
      'username': 'orchestra_booster',
      'password': 'ewa_orchestra_2025',
      'role': 'booster_admin',
      'club': 'orchestra',
      'clubName': 'EHS Orchestra Boosters Club',
      'createdAt': new Date().toISOString(),
      'isLocked': false,
      'isFirstLogin': false,
      'secretQuestion': '',
      'secretAnswer': '',
      'lastLogin': null
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
  res.setHeader('Content-Security-Policy', 'default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://js.stripe.com; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\'');
    
  // Prevent caching of sensitive pages
  if (req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
    
  next();
});

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 1000; // 1000 requests per window (temporarily increased for testing)

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

// Import security configuration
const { helmetConfig, corsOptions } = require('./utils/security-config');

// Middleware
app.use(cors(corsOptions));
app.use(require('helmet')(helmetConfig));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

// Input validation middleware
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
};

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

// Helper functions for volunteer management
async function updateVolunteer(id, updates) {
  // This function is used by the API but not directly available in neon-functions
  // We'll implement it using the database connection
  try {
    const sql = require('./database/neon-functions').getSql();
    if (!sql) return false;
    
    console.log('🔍 updateVolunteer called with:', { id, updates });
    
    // Use proper template literal syntax
    console.log('🔍 SQL Query: UPDATE volunteers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    console.log('🔍 Parameters:', [updates.status, id]);
    
    const result = await sql`
            UPDATE volunteers 
            SET status = ${updates.status},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;
    console.log('🔍 Query result:', result);
    
    return result.length > 0;
  } catch (error) {
    console.error('Error updating volunteer:', error);
    return false;
  }
}

// Additional helper functions for user management
async function addUser(username, userData) {
  try {
    const sql = require('./database/neon-functions').getSql();
    if (!sql) return false;
        
    const result = await sql`
            INSERT INTO users (username, password, role, club, club_name, is_locked, is_first_login, created_at)
            VALUES (${username}, ${userData.password}, ${userData.role}, ${userData.club || ''}, ${userData.clubName || ''}, ${userData.isLocked || false}, ${userData.isFirstLogin || true}, CURRENT_TIMESTAMP)
            ON CONFLICT (username) DO UPDATE SET
                password = EXCLUDED.password,
                role = EXCLUDED.role,
                club = EXCLUDED.club,
                club_name = EXCLUDED.club_name,
                is_locked = EXCLUDED.is_locked,
                is_first_login = EXCLUDED.is_first_login,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
    return result.length > 0;
  } catch (error) {
    console.error('Error adding user:', error);
    return false;
  }
}

async function deleteUser(username) {
  try {
    const sql = require('./database/neon-functions').getSql();
    if (!sql) return false;
        
    const result = await sql`DELETE FROM users WHERE username = ${username} RETURNING *`;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// Additional helper functions for officer management
async function updateOfficer(id, updates) {
  try {
    const sql = require('./database/neon-functions').getSql();
    if (!sql) return false;
        
    const result = await sql`
            UPDATE officers 
            SET name = ${updates.name || null},
                position = ${updates.position || null},
                email = ${updates.email || null},
                phone = ${updates.phone || null},
                club_id = ${updates.club_id || null},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING *
        `;
    return result.length > 0;
  } catch (error) {
    console.error('Error updating officer:', error);
    return false;
  }
}

async function deleteOfficer(id) {
  try {
    const sql = require('./database/neon-functions').getSql();
    if (!sql) return false;
        
    const result = await sql`DELETE FROM officers WHERE id = ${id} RETURNING *`;
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting officer:', error);
    return false;
  }
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
        
    const result = await addVolunteer(newVolunteer);
    if (result) {
      console.log('Volunteer saved successfully');
      res.json({ 
        success: true, 
        message: 'Volunteer interest submitted successfully',
        volunteer: newVolunteer
      });
    } else {
      console.error('Failed to save volunteer data - database not available');
      res.status(503).json({ 
        success: false, 
        message: 'Volunteer system temporarily unavailable. Please try again later or contact support.' 
      });
    }
  } catch (error) {
    ErrorHandler.sendError(res, 'submit_volunteer', error, 500, req);
  }
});

// Get all volunteers (for admin)
app.get('/api/volunteers', async (req, res) => {
  try {
    const volunteers = await getVolunteers();
    res.json({ success: true, volunteers });
  } catch (error) {
    ErrorHandler.sendError(res, 'get_volunteers', error, 500, req);
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
    ErrorHandler.sendError(res, 'user_login', error, 500, req);
  }
});

// Check user session
app.get('/api/session', async (req, res) => {
  try {
    // Get the session token from the request headers or query params
    const sessionToken = req.headers['x-session-token'] || req.query.token;
        
    if (!sessionToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'No session token provided',
        isLoggedIn: false
      });
    }

    // For now, we'll use a simple approach where the token is the username
    // In a production system, you'd want proper JWT tokens or session management
    const users = await getUsers();
    const user = users[sessionToken];

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid session token',
        isLoggedIn: false
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is locked',
        isLoggedIn: false
      });
    }

    res.json({ 
      success: true, 
      isLoggedIn: true,
      user: {
        username: user.username,
        role: user.role,
        club: user.club,
        clubName: user.clubName,
        isFirstLogin: user.isFirstLogin || false,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    ErrorHandler.sendError(res, 'check_session', error, 500, req);
  }
});

// User logout
app.post('/api/logout', async (req, res) => {
  try {
    // For a simple implementation, we just return success
    // In a production system, you'd want to invalidate JWT tokens or clear server-side sessions
        
    res.json({ 
      success: true, 
      message: 'Logout successful'
    });
  } catch (error) {
    ErrorHandler.sendError(res, 'user_logout', error, 500, req);
  }
});

// Get users (for admin)
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json({ success: true, users });
  } catch (error) {
    ErrorHandler.sendError(res, 'get_users', error, 500, req);
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
      secretQuestion: '',
      secretAnswer: '',
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
    ErrorHandler.sendError(res, 'create_user', error, 500, req);
  }
});

// Booster Admin API Routes

// Submit insurance form
app.post('/api/insurance', async (req, res) => {
  try {
    const { eventName, eventDate, eventDescription, participantCount, submittedBy } = req.body;
        
    if (!eventName || !eventDate || !eventDescription) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: eventName, eventDate, eventDescription' 
      });
    }

                    const insuranceData = {
                  eventName,
                  eventDate,
                  eventDescription,
                  participantCount: participantCount || 0,
                  submittedBy: submittedBy || 'admin',
                  status: 'pending',
                  clubId: req.body.clubId || null
                };

    const result = await addInsurance(insuranceData);
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Insurance form submitted successfully',
        submission: result
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

// Get all insurance submissions (admin only)
app.get('/api/insurance', async (req, res) => {
  try {
    const insuranceSubmissions = await getInsurance();
    res.json({ success: true, submissions: insuranceSubmissions });
  } catch (error) {
    console.error('Error getting all insurance submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update insurance submission status
app.put('/api/insurance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const result = await updateInsuranceStatus(id, status);
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Insurance submission status updated successfully',
        submission: result
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Insurance submission not found' 
      });
    }
  } catch (error) {
    console.error('Error updating insurance submission status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete insurance submission
app.delete('/api/insurance/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await deleteInsuranceSubmission(id);
    
    if (result) {
      res.json({ 
        success: true, 
        message: 'Insurance submission deleted successfully'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Insurance submission not found' 
      });
    }
  } catch (error) {
    console.error('Error deleting insurance submission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Submit 1099 information
app.post('/api/1099', async (req, res) => {
  try {
    const { 
      recipientName, 
      recipientTin, 
      amount, 
      description, 
      submittedBy, 
      taxYear,
      boosterClub,
      w9Filename,
      w9BlobUrl,
      w9FileSize,
      w9MimeType
    } = req.body;
        
    if (!recipientName || !recipientTin || !amount || !submittedBy || !taxYear || !boosterClub) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: recipientName, recipientTin, amount, submittedBy, taxYear, boosterClub' 
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
      boosterClub,
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

// Get 1099 submissions for a club
app.get('/api/1099/:club', async (req, res) => {
  try {
    const { club } = req.params;
    const form1099Submissions = await getForm1099();
    const clubSubmissions = form1099Submissions.filter(sub => sub.booster_club === club);
    res.json({ success: true, submissions: clubSubmissions });
  } catch (error) {
    console.error('Error getting 1099 submissions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get all 1099 submissions (admin only)
app.get('/api/1099', async (req, res) => {
  try {
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

// Upload W9 form for 1099 submission
app.post('/api/1099/upload-w9', async (req, res) => {
  try {
    // Check if blob storage is available
    if (!blob) {
      console.error('❌ Blob storage not available - BLOB_READ_WRITE_TOKEN not configured');
      return res.status(503).json({
        success: false,
        message: 'File storage is currently unavailable. Please check your configuration.'
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

// Update 1099 form status
app.put('/api/1099/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
        
    if (!status || !['pending', 'acknowledged', 'submitted_to_irs'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be one of: pending, acknowledged, submitted_to_irs' 
      });
    }

    const result = await updateForm1099Status(id, status);
    if (result) {
      res.json({ 
        success: true, 
        message: 'Status updated successfully',
        submission: result
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: '1099 form not found' 
      });
    }
  } catch (error) {
    console.error('Error updating 1099 form status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Export 1099 data as CSV
app.post('/api/1099/export', async (req, res) => {
  try {
    const { submissionIds, format = 'csv' } = req.body;
        
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select at least one submission to export' 
      });
    }

    const allSubmissions = await getForm1099();
    const selectedSubmissions = allSubmissions.filter(sub => submissionIds.includes(sub.id));
        
    if (format === 'csv') {
      const csvData = generateCSV(selectedSubmissions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="1099-submissions-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Unsupported format. Use "csv"' 
      });
    }
  } catch (error) {
    console.error('Error exporting 1099 data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Download W9 files as zip
app.post('/api/1099/download-w9', async (req, res) => {
  try {
    const { submissionIds } = req.body;
        
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select at least one submission to download W9 files' 
      });
    }

    const allSubmissions = await getForm1099();
    const selectedSubmissions = allSubmissions.filter(sub => 
      submissionIds.includes(sub.id) && sub.w9_filename && sub.w9_blob_url
    );
        
    if (selectedSubmissions.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No W9 files found for selected submissions' 
      });
    }

    // For now, return the list of files to download
    // In a full implementation, you would create a zip file here
    const downloadInfo = selectedSubmissions.map(sub => ({
      id: sub.id,
      recipientName: sub.recipient_name,
      w9Filename: sub.w9_filename,
      w9BlobUrl: sub.w9_blob_url,
      w9FileSize: sub.w9_file_size
    }));

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '-');
    const zipFilename = `w9-files-${dateStr}.zip`;

    res.json({ 
      success: true, 
      message: 'W9 files ready for download',
      zipFilename,
      files: downloadInfo
    });
  } catch (error) {
    console.error('Error preparing W9 download:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update 1099 form data
app.put('/api/1099/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      recipientName, recipientTin, amount, description, 
      taxYear, boosterClub 
    } = req.body;
        
    if (!recipientName || !recipientTin || !amount || !taxYear) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: recipientName, recipientTin, amount, taxYear' 
      });
    }

    const updates = {
      recipientName,
      recipientTin,
      amount: parseFloat(amount),
      description: description || '',
      taxYear: parseInt(taxYear),
      boosterClub: boosterClub || null
    };

    const result = await updateForm1099(id, updates);
    if (result) {
      res.json({ 
        success: true, 
        message: '1099 form updated successfully',
        submission: result
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: '1099 form not found' 
      });
    }
  } catch (error) {
    console.error('Error updating 1099 form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Delete 1099 form
app.delete('/api/1099/:id', async (req, res) => {
  try {
    const { id } = req.params;
        
    const success = await deleteForm1099(id);
    if (success) {
      res.json({ 
        success: true, 
        message: '1099 form deleted successfully'
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: '1099 form not found' 
      });
    }
  } catch (error) {
    console.error('Error deleting 1099 form:', error);
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

    console.log('🔍 Forgot password - Getting users...');
    const users = await getUsers();
    console.log('🔍 Users returned:', Object.keys(users));
    console.log('🔍 User exists:', !!users[username]);
        
    if (!users[username]) {
      console.log('❌ User not found:', username);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('🔍 User data:', {
      username: users[username].username,
      secretQuestion: users[username].secretQuestion,
      secretAnswer: users[username].secretAnswer,
      hasSecretAnswer: !!users[username].secretAnswer
    });

    if (users[username].secretAnswer !== secretAnswer) {
      console.log('❌ Secret answer mismatch:', {
        expected: secretAnswer,
        actual: users[username].secretAnswer
      });
      return res.status(400).json({ 
        success: false, 
        message: 'Secret answer is incorrect' 
      });
    }

    console.log('✅ Secret answer correct, updating password...');
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
        
    if (!name || !position || !email || !booster_club) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields missing: name, position, email, booster_club' 
      });
    }
        
    // Format blank phone as "000-000-0000"
    if (!phone) {
      const phone = '000-000-0000';
    }

    const newOfficer = {
      name,
      position,
      email,
      phone,
      booster_club,
      createdAt: new Date().toISOString()
    };

    const result = await addOfficer(newOfficer);
    if (result) {
      res.json({ 
        success: true, 
        message: 'Officer added successfully',
        officer: result
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
        
    if (!name || !position || !email || !booster_club) {
      return res.status(400).json({ 
        success: false, 
        message: 'Required fields missing: name, position, email, booster_club' 
      });
    }
        
    // Format blank phone as "000-000-0000"
    if (!phone) {
      const phone = '000-000-0000';
    }

    // Get the club_id for the selected booster club
    const sql = require('./database/neon-functions').getSql();
    if (!sql) {
      return res.status(500).json({ 
        success: false, 
        message: 'Database connection not available' 
      });
    }

    const clubResult = await sql`SELECT id FROM booster_clubs WHERE name = ${booster_club}`;
    if (clubResult.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid booster club name. Please select a valid club from the dropdown.' 
      });
    }

    const club_id = clubResult[0].id;

    const updates = {
      name,
      position,
      email,
      phone,
      club_id,
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

// Analytics API Routes

// Get analytics overview
app.get('/api/analytics/overview', async (req, res) => {
  try {
    // For now, return mock data
    // In a real application, you would query your analytics database
    const analyticsData = {
      pageViews: Math.floor(Math.random() * 10000) + 1000,
      uniqueVisitors: Math.floor(Math.random() * 3000) + 500,
      popularPage: 'Home',
      topLink: 'LWSD Athletics'
    };
        
    res.json({ success: true, ...analyticsData });
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get analytics usage data
app.get('/api/analytics/usage', async (req, res) => {
  try {
    // Return usage analytics data
    const usageData = {
      totalPageViews: Math.floor(Math.random() * 50000) + 10000,
      totalUniqueVisitors: Math.floor(Math.random() * 15000) + 3000,
      averageSessionDuration: Math.floor(Math.random() * 300) + 120,
      bounceRate: Math.floor(Math.random() * 40) + 20,
      topPages: [
        { page: 'Home', views: Math.floor(Math.random() * 5000) + 1000 },
        { page: 'Team', views: Math.floor(Math.random() * 3000) + 800 },
        { page: 'News', views: Math.floor(Math.random() * 2000) + 500 },
        { page: 'Volunteers', views: Math.floor(Math.random() * 1500) + 300 }
      ]
    };
        
    res.json({ success: true, ...usageData });
  } catch (error) {
    console.error('Error getting analytics usage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Generate analytics report
app.post('/api/analytics/report', async (req, res) => {
  try {
    const { type, dateRange } = req.body;
        
    if (!type || !dateRange) {
      return res.status(400).json({ 
        success: false, 
        message: 'Report type and date range are required' 
      });
    }
        
    let reportData = [];
        
    switch (type) {
    case 'usage':
      reportData = await generateUsageReport(dateRange);
      break;
    case 'links':
      reportData = await generateLinksReport(dateRange);
      break;
    case 'officers':
      reportData = await generateOfficersReport(dateRange);
      break;
    case 'documents':
      reportData = await generateDocumentsReport(dateRange);
      break;
    default:
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid report type' 
      });
    }
        
    res.json({ success: true, report: reportData });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Helper functions for report generation
async function generateUsageReport(dateRange) {
  // Mock data - in a real app, you'd query your analytics database
  const days = Math.min(dateRange, 30); // Cap at 30 days for demo
  const report = [];
    
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
        
    report.push({
      date: date.toISOString().split('T')[0],
      pageViews: Math.floor(Math.random() * 500) + 100,
      uniqueVisitors: Math.floor(Math.random() * 200) + 50,
      popularPage: ['Home', 'Team', 'News', 'Volunteers'][Math.floor(Math.random() * 4)]
    });
  }
    
  return report;
}

async function generateLinksReport(dateRange) {
  // Get clubs from database
  let clubs = [];
  try {
    const clubsData = await getBoosterClubs();
    clubs = clubsData.map(club => club.name);
  } catch (error) {
    console.error('Error getting clubs for links report:', error);
    // Fallback to empty array if database query fails
    clubs = [];
  }
    
  const report = clubs.map(club => ({
    url: `https://${club.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.org`,
    club: club,
    clicks: Math.floor(Math.random() * 100) + 1,
    lastClicked: new Date(Date.now() - Math.random() * dateRange * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
    
  return report;
}

async function generateOfficersReport(dateRange) {
  try {
    const officers = await getOfficers();
    const report = officers.map(officer => ({
      name: officer.name,
      position: officer.position,
      email: officer.email,
      club: officer.booster_club,
      status: 'Active' // You could add a status field to officers if needed
    }));
        
    return report;
  } catch (error) {
    console.error('Error generating officers report:', error);
    return [];
  }
}

async function generateDocumentsReport(dateRange) {
  try {
    const insuranceSubmissions = await getInsurance();
    const form1099Submissions = await getForm1099();
        
    const report = [];
        
    // Add insurance submissions
    insuranceSubmissions.forEach(submission => {
      report.push({
        type: 'Insurance Form',
        club: submission.boosterClub,
        submittedDate: new Date(submission.submittedAt).toISOString().split('T')[0],
        status: submission.status
      });
    });
        
    // Add 1099 submissions
    form1099Submissions.forEach(submission => {
      report.push({
        type: '1099 Form',
        club: submission.boosterClub,
        submittedDate: new Date(submission.submittedAt).toISOString().split('T')[0],
        status: submission.status
      });
    });
        
    return report;
  } catch (error) {
    console.error('Error generating documents report:', error);
    return [];
  }
}

// Vercel Blob Storage API Routes

// Upload file to Vercel Blob
app.post('/api/upload', async (req, res) => {
  try {
    if (!blob) {
      return res.status(503).json({ 
        success: false, 
        message: 'Blob storage not available' 
      });
    }

    const { filename, content, contentType = 'text/plain' } = req.body;
        
    if (!filename || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Filename and content are required' 
      });
    }

    // Upload to Vercel Blob
    const { url } = await blob.put(filename, content, { 
      access: 'public',
      contentType: contentType
    });

    res.json({ 
      success: true, 
      url: url,
      filename: filename,
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading file' 
    });
  }
});

// Upload document (for insurance forms, 1099 forms, etc.)
app.post('/api/upload-document', async (req, res) => {
  try {
    if (!blob) {
      return res.status(503).json({ 
        success: false, 
        message: 'Blob storage not available' 
      });
    }

    const { filename, content, contentType, boosterClub, documentType } = req.body;
        
    if (!filename || !content || !boosterClub || !documentType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Filename, content, booster club, and document type are required' 
      });
    }

    // Create a structured filename with metadata
    const timestamp = new Date().toISOString().split('T')[0];
    const structuredFilename = `documents/${boosterClub}/${documentType}/${timestamp}_${filename}`;

    // Upload to Vercel Blob
    const { url } = await blob.put(structuredFilename, content, { 
      access: 'public',
      contentType: contentType || 'application/octet-stream'
    });

    // Store document metadata in our data storage
    const documentRecord = {
      id: Date.now().toString(),
      filename: filename,
      blobUrl: url,
      boosterClub: boosterClub,
      documentType: documentType,
      contentType: contentType,
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.body.uploadedBy || 'unknown'
    };

    // Add to database
    try {
      await addDocument(documentRecord);
    } catch (error) {
      console.error('Error saving document to database:', error);
      // Fallback to in-memory storage
      if (!memoryStorage.documents) {
        memoryStorage.documents = [];
      }
      memoryStorage.documents.push(documentRecord);
    }

    res.json({ 
      success: true, 
      url: url,
      documentId: documentRecord.id,
      message: 'Document uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading document' 
    });
  }
});

// Get documents for a booster club
app.get('/api/documents/:boosterClub', async (req, res) => {
  try {
    const { boosterClub } = req.params;
        
    let documents = [];
        
    try {
      const allDocuments = await getDocuments();
      documents = allDocuments.filter(doc => doc.boosterClub === boosterClub);
    } catch (error) {
      console.error('Error getting documents from database:', error);
      // Fallback to in-memory storage
      documents = (memoryStorage.documents || [])
        .filter(doc => doc.boosterClub === boosterClub);
    }

    res.json({ 
      success: true, 
      documents: documents 
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving documents' 
    });
  }
});

// Get all documents (admin only)
app.get('/api/documents', async (req, res) => {
  try {
    let documents = [];
        
    try {
      documents = await getDocuments();
    } catch (error) {
      console.error('Error getting documents from database:', error);
      // Fallback to in-memory storage
      documents = memoryStorage.documents || [];
    }

    res.json({ 
      success: true, 
      documents: documents 
    });
  } catch (error) {
    console.error('Error getting all documents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving documents' 
    });
  }
});

// Delete document
app.delete('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
        
    let document = null;
        
    try {
      // Delete from database
      await deleteDocument(documentId);
      // Get the document details before deletion for blob cleanup
      const allDocuments = await getDocuments();
      document = allDocuments.find(doc => doc.id === documentId);
    } catch (error) {
      console.error('Error deleting document from database:', error);
      // Fallback to in-memory storage
      const docIndex = (memoryStorage.documents || []).findIndex(doc => doc.id === documentId);
      if (docIndex !== -1) {
        document = memoryStorage.documents[docIndex];
        memoryStorage.documents.splice(docIndex, 1);
      }
    }

    if (!document) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }

    // Note: Vercel Blob doesn't have a direct delete method in the current API
    // The file will remain in blob storage but the reference is removed from our database

    res.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting document' 
    });
  }
});

// Backup Management API Routes
// Get backup status
app.get('/api/backup/status', async (req, res) => {
  try {
    if (!backupManager) {
      return res.status(503).json({
        success: false,
        message: 'Backup system is not available',
        error: backupManagerError ? backupManagerError.message : 'Backup manager not initialized'
      });
    }
        
    const status = await backupManager.getBackupStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup status',
      error: error.message
    });
  }
});

// Perform manual backup
app.post('/api/backup/perform', async (req, res) => {
  try {
    if (!backupManager) {
      return res.status(503).json({
        success: false,
        message: 'Backup system is not available',
        error: backupManagerError ? backupManagerError.message : 'Backup manager not initialized'
      });
    }

    console.log('🔄 Manual backup requested');
    const result = await backupManager.performFullBackup();
    res.json({
      success: true,
      message: 'Backup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error performing backup:', error);
    res.status(500).json({
      success: false,
      message: 'Backup failed: ' + error.message
    });
  }
});

// Cleanup old backups
app.post('/api/backup/cleanup', async (req, res) => {
  try {
    if (!backupManager) {
      return res.status(503).json({
        success: false,
        message: 'Backup system is not available',
        error: backupManagerError ? backupManagerError.message : 'Backup manager not initialized'
      });
    }

    console.log('🧹 Manual cleanup requested');
    const result = await backupManager.cleanupOldBackups();
    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    res.status(500).json({
      success: false,
      message: 'Cleanup failed: ' + error.message
    });
  }
});

// Restore from backup
app.post('/api/backup/restore', async (req, res) => {
  try {
    if (!backupManager) {
      return res.status(503).json({
        success: false,
        message: 'Backup system is not available',
        error: backupManagerError ? backupManagerError.message : 'Backup manager not initialized'
      });
    }

    const { backupTimestamp } = req.body;
        
    if (!backupTimestamp) {
      return res.status(400).json({
        success: false,
        message: 'Backup timestamp is required'
      });
    }

    console.log(`🔄 Manual restore requested for: ${backupTimestamp}`);
    const result = await backupManager.restoreFromBackup(backupTimestamp);
    res.json({
      success: true,
      message: 'Restore completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error restoring from backup:', error);
    res.status(500).json({
      success: false,
      message: 'Restore failed: ' + error.message
    });
  }
});

// List available backups
app.get('/api/backup/list', async (req, res) => {
  try {
    if (!backupManager) {
      return res.status(503).json({
        success: false,
        message: 'Backup system is not available',
        error: backupManagerError ? backupManagerError.message : 'Backup manager not initialized'
      });
    }

    const status = await backupManager.getBackupStatus();
    res.json({
      success: true,
      data: status.backups
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups'
    });
  }
});

// Download backup file
app.get('/api/backup/download/:filename', async (req, res) => {
  try {
    if (!backupManager) {
      return res.status(503).json({
        success: false,
        message: 'Backup system is not available',
        error: backupManagerError ? backupManagerError.message : 'Backup manager not initialized'
      });
    }

    const { filename } = req.params;
        
    // For serverless backup manager, we need to look up the backup in the database
    if (backupManager.constructor.name === 'ServerlessBackupManager') {
      try {
        // Extract timestamp from filename (backup-YYYY-MM-DDTHH-MM-SS-sssZ.json)
        const timestampMatch = filename.match(/backup-(.+)\.json/);
        if (!timestampMatch) {
          return res.status(400).json({
            success: false,
            message: 'Invalid backup filename format'
          });
        }
                
        // Convert filename format back to ISO timestamp
        // backup-2025-08-13T06-49-25-918Z.json -> 2025-08-13T06:49:25.918Z
        let timestamp = timestampMatch[1];
        // Replace the last two hyphens with colon and period for time format
        const parts = timestamp.split('T');
        if (parts.length === 2) {
          const datePart = parts[0];
          const timePart = parts[1];
          // Convert 06-49-25-918Z to 06:49:25.918Z
          const timeParts = timePart.split('-');
          if (timeParts.length >= 4) {
            const hours = timeParts[0];
            const minutes = timeParts[1];
            const seconds = timeParts[2];
            const milliseconds = timeParts[3];
            timestamp = `${datePart}T${hours}:${minutes}:${seconds}.${milliseconds}`;
          }
        }
                
        // Look up the backup in the database
        const backupResult = await backupManager.dbPool.query(`
                    SELECT file_url FROM backup_metadata 
                    WHERE timestamp = $1 AND status = 'success'
                `, [timestamp]);
                
        if (backupResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Backup not found'
          });
        }
                
        const backup = backupResult.rows[0];
                
        if (!backup.file_url) {
          return res.status(404).json({
            success: false,
            message: 'Backup file URL not found'
          });
        }
                
        // Redirect to the blob URL for direct download
        res.redirect(backup.file_url);
        return;
                
      } catch (error) {
        console.error('Error looking up backup:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to locate backup file'
        });
      }
    } else {
      // For local backup manager, use file system
      const filePath = path.join(backupManager.backupDir, filename);
            
      // Check if file exists
      try {
        await fs.promises.access(filePath);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }

      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
            
      // Stream the file
      const fileStream = require('fs').createReadStream(filePath);
      fileStream.pipe(res);
    }
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download backup'
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    let databaseStatus = 'unknown';
    let databaseDetails = {};
        
    if (process.env.DATABASE_URL) {
      try {
        const officers = await getOfficers();
        databaseStatus = 'connected';
        databaseDetails = {
          officersCount: officers.length,
          connectionType: 'Neon PostgreSQL'
        };
      } catch (error) {
        databaseStatus = 'error';
        databaseDetails = {
          error: error.message,
          connectionType: 'Neon PostgreSQL'
        };
      }
    } else {
      databaseStatus = 'not_configured';
    }

    // Test blob storage
    let blobStatus = 'unknown';
    if (blob) {
      blobStatus = 'available';
    } else if (process.env.BLOB_READ_WRITE_TOKEN) {
      blobStatus = 'token_configured_but_not_initialized';
    } else {
      blobStatus = 'not_configured';
    }

    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: databaseStatus,
          ...databaseDetails
        },
        blob: {
          status: blobStatus,
          configured: !!process.env.BLOB_READ_WRITE_TOKEN
        }
      },
      version: '1.0.0',
      uptime: process.uptime()
    });
  } catch (error) {
    ErrorHandler.sendError(res, 'health_check', error, 500, req);
  }
});

// Handle Vercel-specific scripts in development (these are served by Vercel CDN in production)
app.get('/_vercel/insights/script.js', (req, res) => {
  res.status(404).send('Vercel Insights script not available in development');
});

app.get('/_vercel/speed-insights/script.js', (req, res) => {
  res.status(404).send('Vercel Speed Insights script not available in development');
});

// Serve static files from the root directory with enhanced caching
app.use(express.static('.', {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true,
  lastModified: true,
  immutable: process.env.NODE_ENV === 'production'
}));

// Security API routes
const securityRoutes = require('./api/security');
app.use('/api/security', securityRoutes);

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('📊 Getting dashboard statistics...');
        
    // Get real counts from database
    const officers = await getOfficers();
    const volunteers = await getVolunteers();
    const form1099 = await getForm1099();
    const insurance = await getInsurance();
        
    // Filter pending 1099 forms
    const pending1099 = form1099.filter(form => form.status === 'pending');
        
    // Calculate statistics
    const stats = {
      totalOfficers: officers.length,
      totalVolunteers: volunteers.length,
      pendingDocuments: pending1099.length,
      total1099Forms: form1099.length,
      totalInsuranceForms: insurance.length,
      // Note: Site visitors would need analytics integration
      siteVisitors: 'N/A'
    };
        
    console.log('📊 Dashboard stats:', stats);
    res.json({ success: true, stats });
        
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get dashboard statistics',
      error: error.message 
    });
  }
});

// News Management API Endpoints

// Get all news (for admin)
app.get('/api/news', async (req, res) => {
  try {
    const news = await getNews();
    res.json({ success: true, news });
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get published news (for public website)
app.get('/api/news/published', async (req, res) => {
  try {
    const news = await getPublishedNews();
    res.json({ success: true, news });
  } catch (error) {
    console.error('Error getting published news:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add news article
app.post('/api/news', async (req, res) => {
  try {
    const { title, content, status = 'draft' } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    // Add news article
    const newsItem = await addNews({
      title: title.trim(),
      content: content.trim(),
      status: status,
      createdBy: req.body.createdBy || 'admin'
    });
    
    if (newsItem) {
      res.json({
        success: true,
        message: 'News article created successfully',
        news: newsItem
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create news article'
      });
    }
  } catch (error) {
    console.error('Error creating news article:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update news article
app.put('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (status !== undefined) updates.status = status;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const updatedNews = await updateNews(id, updates);
    
    if (!updatedNews) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'News article updated successfully',
      news: updatedNews
    });
  } catch (error) {
    console.error('Error updating news article:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Publish news article
app.post('/api/news/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    
    const publishedNews = await publishNews(id);
    
    if (!publishedNews) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'News article published successfully',
      news: publishedNews
    });
  } catch (error) {
    console.error('Error publishing news article:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete news article
app.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await deleteNews(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news article:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Links Management API Endpoints

// Get all links (for admin)
app.get('/api/links', async (req, res) => {
  try {
    const links = await getAllLinks();
    res.json({ success: true, links });
  } catch (error) {
    console.error('Error getting links:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get visible links (for public website)
app.get('/api/links/visible', async (req, res) => {
  try {
    const links = await getLinks();
    res.json({ success: true, links });
  } catch (error) {
    console.error('Error getting visible links:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add new link
app.post('/api/links', async (req, res) => {
  try {
    const { title, url, category, orderIndex, isVisible, createdBy } = req.body;
    
    // Validate required fields
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Title and URL are required'
      });
    }
    
    // Add link
    const link = await addLink({
      title: title.trim(),
      url: url.trim(),
      category: category || 'general',
      orderIndex: orderIndex || 0,
      isVisible: isVisible !== false,
      createdBy: createdBy || 'admin'
    });
    
    if (link) {
      res.json({
        success: true,
        message: 'Link created successfully',
        link
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create link'
      });
    }
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update link
app.put('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, category, orderIndex, isVisible } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (url !== undefined) updates.url = url.trim();
    if (category !== undefined) updates.category = category;
    if (orderIndex !== undefined) updates.orderIndex = orderIndex;
    if (isVisible !== undefined) updates.isVisible = isVisible;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const updatedLink = await updateLink(id, updates);
    
    if (!updatedLink) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Link updated successfully',
      link: updatedLink
    });
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete link
app.delete('/api/links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await deleteLink(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Increment link clicks
app.post('/api/links/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await incrementLinkClicks(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Link click recorded'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }
  } catch (error) {
    console.error('Error recording link click:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Booster Club API endpoints
// Get all booster clubs
app.get('/api/booster-clubs', async (req, res) => {
  try {
    const clubs = await getBoosterClubs();
    
    res.json({
      success: true,
      data: clubs
    });
  } catch (error) {
    console.error('Error getting booster clubs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booster clubs'
    });
  }
});

// Get booster club by name
app.get('/api/booster-clubs/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const club = await getBoosterClubByName(name);
    
    if (!club) {
      return res.status(404).json({
        success: false,
        message: 'Booster club not found'
      });
    }
    
    res.json({
      success: true,
      data: club
    });
  } catch (error) {
    console.error('Error getting booster club:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booster club'
    });
  }
});

// Update booster club description
app.put('/api/booster-clubs/:name/description', async (req, res) => {
  try {
    const { name } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required'
      });
    }

    const updatedClub = await updateBoosterClubDescription(name, description);

    res.json({
      success: true,
      message: 'Booster club description updated successfully',
      data: updatedClub
    });
  } catch (error) {
    console.error('Error updating booster club description:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update booster club description'
    });
  }
});

// Update booster club website URL
app.put('/api/booster-clubs/:name/website', async (req, res) => {
  try {
    const { name } = req.params;
    const { websiteUrl } = req.body;

    if (!websiteUrl) {
      return res.status(400).json({
        success: false,
        message: 'Website URL is required'
      });
    }

    const updatedClub = await updateBoosterClubWebsite(name, websiteUrl);

    res.json({
      success: true,
      message: 'Booster club website URL updated successfully',
      data: updatedClub
    });
  } catch (error) {
    console.error('Error updating booster club website URL:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update booster club website URL'
    });
  }
});

// Payment System API endpoints
// Get individual booster club data by ID
app.get('/api/club/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Import the booster-clubs API handler
    const boosterClubsHandler = require('./api/booster-clubs');
    
    // Create a mock request object with query parameters
    const mockReq = {
      query: { id },
      method: 'GET',
      headers: req.headers
    };
    
    // Call the handler
    await boosterClubsHandler(mockReq, res);
    
  } catch (error) {
    console.error('Error in booster club API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booster club data'
    });
  }
});

// Generate QR code for a booster club
app.get('/api/qr-code', async (req, res) => {
  try {
    // Import the QR code API handler
    const qrCodeHandler = require('./api/qr-code');
    
    // Call the handler
    await qrCodeHandler(req, res);
    
  } catch (error) {
    console.error('Error in QR code API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code'
    });
  }
});

// Admin Payment Management API endpoints
// Get payment status overview
app.get('/api/admin/payment-status', async (req, res) => {
  try {
    // Import the payment status API handler
    const paymentStatusHandler = require('./api/admin/payment-status');
    
    // Call the handler
    await paymentStatusHandler(req, res);
    
  } catch (error) {
    console.error('Error in payment status API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

// Get payment settings for a club
app.get('/api/admin/payment-settings/club/:clubId', async (req, res) => {
  try {
    // Import the payment settings API handler
    const paymentSettingsHandler = require('./api/admin/payment-settings');
    
    // Call the handler
    await paymentSettingsHandler(req, res);
    
  } catch (error) {
    console.error('Error in payment settings GET API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment settings'
    });
  }
});

// Update payment settings for a club
app.put('/api/admin/payment-settings/club/:clubId', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { 
      is_payment_enabled, 
      zelle_url, 
      stripe_url, 
      payment_instructions 
    } = req.body;
    
    if (!clubId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing clubId parameter' 
      });
    }
    
    // Validate input
    if (typeof is_payment_enabled !== 'boolean') {
      return res.status(400).json({ 
        success: false,
        error: 'is_payment_enabled must be a boolean' 
      });
    }
    
    if (zelle_url && typeof zelle_url !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'zelle_url must be a string' 
      });
    }
    
    if (stripe_url && typeof stripe_url !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'stripe_url must be a string' 
      });
    }
    
    if (payment_instructions && typeof payment_instructions !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'payment_instructions must be a string' 
      });
    }
    
    const sql = require('./database/neon-functions').getSql();
    
    // Update the club's payment settings
    const result = await sql`
      UPDATE booster_clubs 
      SET 
        is_payment_enabled = ${is_payment_enabled},
        zelle_url = ${zelle_url || null},
        stripe_url = ${stripe_url || null},
        payment_instructions = ${payment_instructions || null},
        last_payment_update_by = 'admin',
        last_payment_update_at = NOW()
      WHERE id = ${clubId}
      RETURNING 
        id, 
        name, 
        zelle_url, 
        stripe_url,
        payment_instructions,
        is_payment_enabled
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Club not found or inactive' 
      });
    }
    
    const updatedClub = result[0];
    
    res.status(200).json({
      success: true,
      data: {
        id: updatedClub.id,
        name: updatedClub.name,
        zelle_url: updatedClub.zelle_url,
        stripe_url: updatedClub.stripe_url || null,
        payment_instructions: updatedClub.payment_instructions,
        is_payment_enabled: updatedClub.is_payment_enabled
      }
    });
    
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment settings',
      message: 'Please try again later or contact support.'
    });
  }
});

// Upload QR code for a club
app.post('/api/admin/payment-settings/club/:clubId/qr-code', async (req, res) => {
  try {
    // Import the payment settings API handler
    const paymentSettingsHandler = require('./api/admin/payment-settings');
    
    // Call the handler
    await paymentSettingsHandler(req, res);
    
  } catch (error) {
    console.error('Error in QR code upload API:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload QR code'
    });
  }
});

// Get all payment settings for admin dashboard
app.get('/api/admin/payment-settings', async (req, res) => {
  try {
    const sql = require('./database/neon-functions').getSql();
    
    // Get all active booster clubs with their payment settings
    const clubs = await sql`
      SELECT 
        id, 
        name, 
        zelle_url, 
        stripe_url,
        payment_instructions,
        is_payment_enabled,
        last_payment_update_at
      FROM booster_clubs 
      WHERE is_active = true
      ORDER BY name
    `;
    
    res.status(200).json({
      success: true,
      data: clubs.map(club => ({
        id: club.id,
        name: club.name,
        zelle_url: club.zelle_url,
        stripe_url: club.stripe_url || null,
        payment_instructions: club.payment_instructions,
        is_payment_enabled: club.is_payment_enabled,
        last_payment_update_at: club.last_payment_update_at
      }))
    });
    
  } catch (error) {
    console.error('Error getting all payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment settings'
    });
  }
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

// Start scheduled backups
if (backupManager) {
  backupManager.startScheduledBackups();
  console.log('💾 Scheduled backups enabled');
}

// Only start server if this is the main module (not imported for testing)
if (require.main === module) {
  // Start server
  app.listen(PORT, async () => {
    console.log('🚀 EWA Website server started successfully!');
    console.log(`📍 Server running on http://localhost:${PORT}`);
    console.log('💾 Storage: Neon PostgreSQL (production)');
    console.log('🔐 Orchestra Booster login: orchestra_booster / ewa_orchestra_2025');
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        
    // Initialize database connection
    await initializeDatabase();
  });
}

// Export the app for testing
module.exports = app; 