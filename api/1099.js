require('dotenv').config();

// Import Neon database functions
const { 
  getForm1099, 
  addForm1099, 
  updateForm1099Status, 
  deleteForm1099 
} = require('../database/neon-functions');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, url } = req;
    const urlParts = url.split('/').filter(part => part);
        
    // Handle different endpoints
    if (method === 'GET') {
      await handleGetRequest(req, res, urlParts);
    } else if (method === 'POST') {
      await handlePostRequest(req, res, urlParts);
    } else if (method === 'PUT') {
      await handlePutRequest(req, res, urlParts);
    } else if (method === 'DELETE') {
      await handleDeleteRequest(req, res, urlParts);
    } else {
      res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('1099 API Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Handle GET requests
async function handleGetRequest(req, res, urlParts) {
  try {
    let submissions = await getForm1099();
        
    // Filter by club if specified
    if (urlParts.length > 1) {
      const club = decodeURIComponent(urlParts[1]);
      submissions = submissions.filter(sub => sub.booster_club === club);
    }
        
    // Transform database format to match expected frontend format
    const transformedSubmissions = submissions.map(sub => ({
      id: sub.id,
      recipient_name: sub.recipient_name,
      recipient_tin: sub.recipient_tin,
      amount: sub.amount,
      description: sub.description,
      booster_club: sub.booster_club || '',
      tax_year: sub.tax_year,
      w9_filename: sub.w9_filename,
      status: sub.status,
      submitted_by: sub.submitted_by,
      created_at: sub.created_at
    }));
        
    res.json({ success: true, submissions: transformedSubmissions });
  } catch (error) {
    console.error('Error getting 1099 data:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
}

// Handle POST requests
async function handlePostRequest(req, res, urlParts) {
  if (urlParts.length > 1 && urlParts[1] === 'export') {
    await handleExportRequest(req, res);
    return;
  }
    
  if (urlParts.length > 1 && urlParts[1] === 'download-w9') {
    await handleDownloadW9Request(req, res);
    return;
  }
    
  // Handle new 1099 submission
  const body = req.body;
    
  // Validate required fields
  if (!body.recipientName || !body.recipientTin || !body.amount || !body.boosterClub || !body.taxYear) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
    
  try {
    // Create new submission object for database
    const newSubmission = {
      recipient_name: body.recipientName,
      recipient_tin: body.recipientTin,
      amount: parseFloat(body.amount),
      description: body.description || '',
      booster_club: body.boosterClub,
      tax_year: parseInt(body.taxYear),
      status: 'pending',
      w9_filename: body.w9Filename || null,
      submitted_by: body.submittedBy || 'admin'
    };
        
    // Add to database
    const result = await addForm1099(newSubmission);
        
    if (result) {
      res.json({ success: true, message: '1099 form submitted successfully', submission: result });
    } else {
      res.status(500).json({ success: false, message: 'Failed to save 1099 form' });
    }
  } catch (error) {
    console.error('Error adding 1099 form:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
}

// Handle PUT requests (update status)
async function handlePutRequest(req, res, urlParts) {
  if (urlParts.length < 3 || urlParts[2] !== 'status') {
    return res.status(400).json({ success: false, message: 'Invalid endpoint' });
  }
    
  const submissionId = urlParts[1];
  const { status } = req.body;
    
  if (!status) {
    return res.status(400).json({ success: false, message: 'Status is required' });
  }
    
  try {
    const result = await updateForm1099Status(submissionId, status);
        
    if (result) {
      res.json({ success: true, message: 'Status updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Submission not found' });
    }
  } catch (error) {
    console.error('Error updating 1099 status:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
}

// Handle DELETE requests
async function handleDeleteRequest(req, res, urlParts) {
  const submissionId = urlParts[1];
    
  if (!submissionId) {
    return res.status(400).json({ success: false, message: 'Submission ID is required' });
  }
    
  try {
    const result = await deleteForm1099(submissionId);
        
    if (result) {
      res.json({ success: true, message: 'Submission deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Submission not found' });
    }
  } catch (error) {
    console.error('Error deleting 1099 form:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
}

// Handle export request
async function handleExportRequest(req, res) {
  const { submissionIds, format = 'csv' } = req.body;
    
  if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Submission IDs are required' });
  }
    
  try {
    const allSubmissions = await getForm1099();
        
    // Filter submissions by IDs
    const selectedSubmissions = allSubmissions.filter(sub => submissionIds.includes(sub.id));
        
    if (format === 'csv') {
      const csvContent = generateCSV(selectedSubmissions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="1099-submissions-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.json({ success: true, submissions: selectedSubmissions });
    }
  } catch (error) {
    console.error('Error exporting 1099 data:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
}

// Handle W9 download request
async function handleDownloadW9Request(req, res) {
  const { submissionIds } = req.body;
    
  if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Submission IDs are required' });
  }
    
  try {
    const allSubmissions = await getForm1099();
        
    // Filter submissions by IDs
    const selectedSubmissions = allSubmissions.filter(sub => submissionIds.includes(sub.id));
        
    // For now, return the W9 file information
    // In a full implementation, this would create a zip file with all W9 files
    const files = selectedSubmissions
      .filter(sub => sub.w9_filename)
      .map(sub => ({
        id: sub.id,
        w9Filename: sub.w9_filename,
        w9BlobUrl: sub.w9_blob_url
      }));
        
    res.json({ success: true, files });
  } catch (error) {
    console.error('Error downloading W9 files:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
}

// Generate CSV content
function generateCSV(submissions) {
  const headers = [
    'ID',
    'Recipient Name',
    'Tax ID',
    'Amount',
    'Description',
    'Booster Club',
    'Tax Year',
    'Status',
    'Created At',
    'Updated At'
  ];
    
  const rows = submissions.map(sub => [
    sub.id,
    sub.recipient_name,
    sub.recipient_tin,
    sub.amount,
    sub.description,
    sub.booster_club,
    sub.tax_year,
    sub.status,
    sub.created_at,
    sub.updated_at
  ]);
    
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
} 