module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        databaseAvailable: !!process.env.DATABASE_URL,
        blobAvailable: !!process.env.BLOB_READ_WRITE_TOKEN,
        storage: 'Neon PostgreSQL',
        message: 'Health check endpoint working!'
    });
}; 