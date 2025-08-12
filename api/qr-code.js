const { neon } = require('@neondatabase/serverless');
const QRCode = require('qrcode');

// Database connection
let sql = null;

function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not configured');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { clubId } = req.query;
    
    if (!clubId) {
      return res.status(400).json({ 
        error: 'Missing clubId parameter',
        usage: '/api/qr-code?clubId=<club_id>'
      });
    }
    
    // Get the club's Zelle URL and QR code settings
    const sql = getSql();
    const club = await sql`
      SELECT 
        id, 
        name, 
        zelle_url, 
        qr_code_settings,
        is_payment_enabled
      FROM booster_clubs 
      WHERE id = ${clubId} 
      AND is_active = true
    `;
    
    if (club.length === 0) {
      return res.status(404).json({ 
        error: 'Club not found or inactive',
        clubId: clubId
      });
    }
    
    const clubData = club[0];
    
    // Check if payment is enabled for this club
    if (!clubData.is_payment_enabled) {
      return res.status(400).json({ 
        error: 'Payment is not enabled for this club',
        clubName: clubData.name
      });
    }
    
    // Check if Zelle URL exists
    if (!clubData.zelle_url) {
      return res.status(404).json({ 
        error: 'No Zelle URL configured for this club',
        clubName: clubData.name,
        message: 'Please contact your booster club board to set up Zelle payments.'
      });
    }
    
    // Get QR code settings (with defaults)
    const qrSettings = clubData.qr_code_settings || {
      width: 640,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    };
    
    // Generate QR code
    const qrCodeBuffer = await QRCode.toBuffer(clubData.zelle_url, {
      type: 'image/png',
      width: qrSettings.width || 640,
      margin: qrSettings.margin || 2,
      color: qrSettings.color || {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: qrSettings.errorCorrectionLevel || 'M'
    });
    
    // Set response headers - no caching to ensure fresh QR codes
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Length', qrCodeBuffer.length);
    
    // Send the QR code image
    res.status(200).send(qrCodeBuffer);
    
  } catch (error) {
    console.error('QR Code generation error:', error);
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'Failed to generate QR code',
      message: 'Please try again later or contact support.'
    });
  }
};
