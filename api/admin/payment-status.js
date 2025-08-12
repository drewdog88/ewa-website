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
    
    // Get payment status statistics
    const sql = getSql();
    
    // Get total clubs
    const totalClubs = await sql`
      SELECT COUNT(*) as count
      FROM booster_clubs 
      WHERE is_active = true
    `;
    
    // Get clubs with Zelle URLs
    const clubsWithZelle = await sql`
      SELECT COUNT(*) as count
      FROM booster_clubs 
      WHERE is_active = true 
      AND zelle_url IS NOT NULL 
      AND zelle_url != ''
    `;
    
    // Get clubs with Stripe URLs
    const clubsWithStripe = await sql`
      SELECT COUNT(*) as count
      FROM booster_clubs 
      WHERE is_active = true 
      AND stripe_urls IS NOT NULL 
      AND stripe_urls != '{}'
    `;
    
    // Get clubs with payment enabled
    const paymentEnabled = await sql`
      SELECT COUNT(*) as count
      FROM booster_clubs 
      WHERE is_active = true 
      AND is_payment_enabled = true
    `;
    
    const stats = {
      totalClubs: totalClubs[0]?.count || 0,
      clubsWithZelle: clubsWithZelle[0]?.count || 0,
      clubsWithStripe: clubsWithStripe[0]?.count || 0,
      paymentEnabled: paymentEnabled[0]?.count || 0
    };
    
    res.status(200).json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Payment status error:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to load payment status',
      message: 'Please try again later or contact support.'
    });
  }
};

