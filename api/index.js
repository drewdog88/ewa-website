// Vercel serverless function for EWA API
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Import Neon database functions
const {
  getOfficers,
  addOfficer,
  updateOfficer,
  deleteOfficer,
  getUsers,
  updateUser,
  getVolunteers,
  addVolunteer,
  updateVolunteer,
  getInsurance,
  addInsurance,
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
  incrementLinkClicks
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

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

const sanitizeInput = (input) => {
  if (!input) return '';
  return input.toString().trim().replace(/[<>]/g, '');
};

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
  res.setHeader('Content-Security-Policy', 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; connect-src \'self\'');
    
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

// Add new officer
app.post('/officers', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.put('/officers/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
    const { getSql } = require('../database/neon-functions');
    const sql = getSql();
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
app.delete('/officers/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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

// Test endpoint to verify API is working
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    routes: ['/health', '/test', '/1099', '/officers', '/login']
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
      taxYear: parseInt(taxYear),
      boosterClub,
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

// Update 1099 form status
app.put('/1099/:id/status', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.post('/1099/export', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.post('/1099/download-w9', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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

// Update 1099 form data
app.put('/1099/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.delete('/1099/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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

// Volunteer Management

// Submit volunteer interest
app.post('/volunteers', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    console.log('Received volunteer submission request:', req.body);
        
    const { boosterClub, volunteerName, childName, email, phone, message } = req.body;
        
    // Sanitize inputs
    const sanitizedBoosterClub = sanitizeInput(boosterClub);
    const sanitizedVolunteerName = sanitizeInput(volunteerName);
    const sanitizedChildName = sanitizeInput(childName);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedMessage = sanitizeInput(message);
        
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

    const volunteerData = {
      name: sanitizedVolunteerName,
      email: sanitizedEmail,
      phone: sanitizedPhone || '',
      club: sanitizedBoosterClub,
      clubName: getBoosterClubDisplayName(sanitizedBoosterClub),
      interests: sanitizedMessage || '',
      availability: sanitizedChildName ? `Child: ${sanitizedChildName}` : ''
    };

    console.log('Adding new volunteer:', volunteerData);
        
    const result = await addVolunteer(volunteerData);
    if (result) {
      console.log('Volunteer saved successfully');
      res.json({ 
        success: true, 
        message: 'Volunteer interest submitted successfully',
        volunteer: result
      });
    } else {
      console.error('Failed to save volunteer data');
      res.status(500).json({ 
        success: false, 
        message: 'Failed to save volunteer data' 
      });
    }
  } catch (error) {
    console.error('Error submitting volunteer form:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Get all volunteers (for admin)
app.get('/volunteers', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.get('/volunteers/:club', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const { club } = req.params;
    const volunteers = await getVolunteers();
    const clubVolunteers = volunteers.filter(v => v.club === club);
    res.json({ success: true, volunteers: clubVolunteers });
  } catch (error) {
    console.error('Error getting club volunteers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Update volunteer status (for admin)
app.put('/volunteers/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'contacted', 'confirmed', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, contacted, confirmed, declined'
      });
    }
    
    // Update volunteer status
    const updatedVolunteer = await updateVolunteer(id, { status });
    
    if (!updatedVolunteer) {
      return res.status(404).json({
        success: false,
        message: 'Volunteer not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Volunteer status updated successfully',
      volunteer: updatedVolunteer
    });
  } catch (error) {
    console.error('Error updating volunteer status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// News Management API Endpoints

// Get all news (for admin)
app.get('/news', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.get('/news/published', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.post('/news', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
      title: sanitizeInput(title),
      content: sanitizeInput(content),
      status: sanitizeInput(status),
      createdBy: req.body.createdBy || 'admin' // TODO: Get from session
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
app.put('/news/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const { id } = req.params;
    const { title, content, status } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = sanitizeInput(title);
    if (content !== undefined) updates.content = sanitizeInput(content);
    if (status !== undefined) updates.status = sanitizeInput(status);
    
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
app.post('/news/:id/publish', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.delete('/news/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.get('/links', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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
app.get('/links/visible', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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

// Add link
app.post('/links', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const { title, url, category, orderIndex, isVisible } = req.body;
    
    // Validate required fields
    if (!title || !url) {
      return res.status(400).json({
        success: false,
        message: 'Title and URL are required'
      });
    }
    
    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format'
      });
    }
    
    // Add link
    const link = await addLink({
      title: sanitizeInput(title),
      url: sanitizeInput(url),
      category: sanitizeInput(category || 'other'),
      orderIndex: parseInt(orderIndex) || 0,
      isVisible: isVisible !== false,
      createdBy: req.body.createdBy || 'admin' // TODO: Get from session
    });
    
    if (link) {
      res.json({
        success: true,
        message: 'Link added successfully',
        link
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to add link'
      });
    }
  } catch (error) {
    console.error('Error adding link:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update link
app.put('/links/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const { id } = req.params;
    const { title, url, category, orderIndex, isVisible } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = sanitizeInput(title);
    if (url !== undefined) {
      // Validate URL format
      try {
        new URL(url);
        updates.url = sanitizeInput(url);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format'
        });
      }
    }
    if (category !== undefined) updates.category = sanitizeInput(category);
    if (orderIndex !== undefined) updates.order_index = parseInt(orderIndex);
    if (isVisible !== undefined) updates.is_visible = isVisible;
    
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
app.delete('/links/:id', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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

// Track link click
app.post('/links/:id/click', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
    const { id } = req.params;
    
    await incrementLinkClicks(id);
    
    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking link click:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Insurance Management API Endpoints

// Submit insurance form
app.post('/insurance', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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

// Get all insurance submissions (admin only)
app.get('/insurance', async (req, res) => {
  try {
    await ensureDatabaseInitialized();
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

// Helper function to get booster club display name
function getBoosterClubDisplayName(boosterClub) {
  const clubNames = {
    'band': 'EHS Band Boosters',
    'football': 'EHS Football Boosters',
    'basketball': 'EHS Basketball Boosters',
    'soccer': 'EHS Soccer Boosters',
    'baseball': 'EHS Baseball Boosters',
    'softball': 'EHS Softball Boosters',
    'volleyball': 'EHS Volleyball Boosters',
    'swimming': 'EHS Swimming Boosters',
    'track': 'EHS Track & Field Boosters',
    'tennis': 'EHS Tennis Boosters',
    'golf': 'EHS Golf Boosters',
    'wrestling': 'EHS Wrestling Boosters',
    'cheer': 'EHS Cheer Boosters',
    'dance': 'EHS Dance Boosters',
    'orchestra': 'EHS Orchestra Boosters',
    'choir': 'EHS Choir Boosters',
    'drama': 'EHS Drama Boosters',
    'debate': 'EHS Debate Boosters',
    'robotics': 'EHS Robotics Boosters',
    'other': 'Other'
  };
  return clubNames[boosterClub] || boosterClub;
}

// Export for Vercel
module.exports = app; 