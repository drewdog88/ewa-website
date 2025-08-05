// Simple Vercel serverless function for 1099 API
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle GET requests
  if (req.method === 'GET') {
    res.status(200).json({
      success: true,
      message: '1099 API is working!',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.url,
      submissions: [
        { id: 1, name: 'Steven Smith', amount: 1000, status: 'pending' },
        { id: 2, name: 'Test User', amount: 500, status: 'pending' }
      ]
    });
    return;
  }

  // Handle other methods
  res.status(405).json({ 
    success: false, 
    message: 'Method not allowed' 
  });
} 