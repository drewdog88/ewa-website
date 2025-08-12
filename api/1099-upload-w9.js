require('dotenv').config();
// const { put } = require('@vercel/blob'); // Unused - can be removed in future cleanup

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // For now, we'll simulate a successful upload
    // In a real implementation, you would handle the actual file upload
    const { filename } = req.body;
        
    if (!filename) {
      return res.status(400).json({ 
        success: false, 
        message: 'Filename is required' 
      });
    }

    // Generate a mock blob URL (in production, this would be a real Vercel Blob URL)
    const mockBlobUrl = `https://vercel-blob-store.com/w9-files/${Date.now()}-${filename}`;
        
    res.json({ 
      success: true, 
      message: 'W9 file uploaded successfully',
      w9Filename: filename,
      w9BlobUrl: mockBlobUrl
    });
  } catch (error) {
    console.error('W9 Upload Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}; 