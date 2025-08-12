const { neon } = require('@neondatabase/serverless');

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
    
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ 
        error: 'Missing id parameter',
        usage: '/api/booster-clubs?id=<club_id>'
      });
    }
    
    // Get the specific club data
    const sql = getSql();
    const club = await sql`
      SELECT 
        id, 
        name, 
        description,
        website_url,
        donation_url,
        is_active,
        is_payment_enabled,
        zelle_url,
        stripe_urls,
        payment_instructions,
        qr_code_settings,
        created_at,
        updated_at
      FROM booster_clubs 
      WHERE id = ${id} 
      AND is_active = true
    `;
    
    if (club.length === 0) {
      return res.status(404).json({ 
        error: 'Club not found or inactive',
        clubId: id
      });
    }
    
    const clubData = club[0];
    
    // Return the club data
    res.status(200).json(clubData);
    
  } catch (error) {
    console.error('Booster club API error:', error);
    
    // Don't expose internal errors to client
    res.status(500).json({ 
      error: 'Failed to load club data',
      message: 'Please try again later or contact support.'
    });
  }
};

