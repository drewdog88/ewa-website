require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Import Neon database functions
const { getUsers } = require('../database/neon-functions');

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
    const dataPath = path.join(__dirname, '../data/1099.json');
    
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        let submissions = JSON.parse(data);
        
        // Filter by club if specified
        if (urlParts.length > 1) {
            const club = decodeURIComponent(urlParts[1]);
            submissions = submissions.filter(sub => sub.booster_club === club);
        }
        
        res.json({ success: true, submissions });
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, return empty array
            res.json({ success: true, submissions: [] });
        } else {
            throw error;
        }
    }
}

// Handle POST requests
async function handlePostRequest(req, res, urlParts) {
    const dataPath = path.join(__dirname, '../data/1099.json');
    
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
        const data = await fs.readFile(dataPath, 'utf8');
        let submissions = JSON.parse(data);
        
        // Create new submission
        const newSubmission = {
            id: Date.now().toString(),
            recipient_name: body.recipientName,
            recipient_tin: body.recipientTin,
            amount: parseFloat(body.amount),
            description: body.description || '',
            booster_club: body.boosterClub,
            tax_year: parseInt(body.taxYear),
            status: 'pending',
            w9_filename: body.w9Filename || '',
            w9_blob_url: body.w9BlobUrl || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        submissions.push(newSubmission);
        
        // Save to file
        await fs.writeFile(dataPath, JSON.stringify(submissions, null, 2));
        
        res.json({ success: true, message: '1099 submission created successfully', submission: newSubmission });
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File doesn't exist, create it
            const newSubmission = {
                id: Date.now().toString(),
                recipient_name: body.recipientName,
                recipient_tin: body.recipientTin,
                amount: parseFloat(body.amount),
                description: body.description || '',
                booster_club: body.boosterClub,
                tax_year: parseInt(body.taxYear),
                status: 'pending',
                w9_filename: body.w9Filename || '',
                w9_blob_url: body.w9BlobUrl || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            await fs.writeFile(dataPath, JSON.stringify([newSubmission], null, 2));
            res.json({ success: true, message: '1099 submission created successfully', submission: newSubmission });
        } else {
            throw error;
        }
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
    
    const dataPath = path.join(__dirname, '../data/1099.json');
    
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        let submissions = JSON.parse(data);
        
        const submissionIndex = submissions.findIndex(sub => sub.id === submissionId);
        if (submissionIndex === -1) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        
        submissions[submissionIndex].status = status;
        submissions[submissionIndex].updated_at = new Date().toISOString();
        
        await fs.writeFile(dataPath, JSON.stringify(submissions, null, 2));
        
        res.json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        throw error;
    }
}

// Handle DELETE requests
async function handleDeleteRequest(req, res, urlParts) {
    const submissionId = urlParts[1];
    
    if (!submissionId) {
        return res.status(400).json({ success: false, message: 'Submission ID is required' });
    }
    
    const dataPath = path.join(__dirname, '../data/1099.json');
    
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        let submissions = JSON.parse(data);
        
        const submissionIndex = submissions.findIndex(sub => sub.id === submissionId);
        if (submissionIndex === -1) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }
        
        submissions.splice(submissionIndex, 1);
        
        await fs.writeFile(dataPath, JSON.stringify(submissions, null, 2));
        
        res.json({ success: true, message: 'Submission deleted successfully' });
    } catch (error) {
        throw error;
    }
}

// Handle export request
async function handleExportRequest(req, res) {
    const { submissionIds, format = 'csv' } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Submission IDs are required' });
    }
    
    const dataPath = path.join(__dirname, '../data/1099.json');
    
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        const allSubmissions = JSON.parse(data);
        
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
        throw error;
    }
}

// Handle W9 download request
async function handleDownloadW9Request(req, res) {
    const { submissionIds } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
        return res.status(400).json({ success: false, message: 'Submission IDs are required' });
    }
    
    const dataPath = path.join(__dirname, '../data/1099.json');
    
    try {
        const data = await fs.readFile(dataPath, 'utf8');
        const allSubmissions = JSON.parse(data);
        
        // Filter submissions by IDs
        const selectedSubmissions = allSubmissions.filter(sub => submissionIds.includes(sub.id));
        
        // For now, return the W9 file information
        // In a full implementation, this would create a zip file with all W9 files
        const files = selectedSubmissions
            .filter(sub => sub.w9_blob_url)
            .map(sub => ({
                id: sub.id,
                w9Filename: sub.w9_filename,
                w9BlobUrl: sub.w9_blob_url
            }));
        
        res.json({ success: true, files });
    } catch (error) {
        throw error;
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