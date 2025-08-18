const { Pool } = require('pg');

module.exports = async (req, res) => {
  try {
    console.log('🔍 Testing database connection...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Test the connection and get database info
    const dbInfo = await pool.query('SELECT current_database(), current_user, version()');
    
    // Get booster clubs count
    const clubsResult = await pool.query('SELECT COUNT(*) as club_count FROM booster_clubs');
    
    // Get a few sample clubs
    const sampleClubs = await pool.query('SELECT name, status FROM booster_clubs LIMIT 5');
    
    // Get users count
    const usersResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
    
    await pool.end();

    const result = {
      message: 'Database Connection Test',
      database: {
        name: dbInfo.rows[0].current_database,
        user: dbInfo.rows[0].current_user,
        version: dbInfo.rows[0].version.split(' ')[0] + ' ' + dbInfo.rows[0].version.split(' ')[1],
        connectionString: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.substring(0, 30) + '...' : 
          'NOT SET'
      },
      data: {
        boosterClubs: clubsResult.rows[0].club_count,
        users: usersResult.rows[0].user_count,
        sampleClubs: sampleClubs.rows
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    };

    res.json(result);

  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      error: error.message,
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
    });
  }
};
