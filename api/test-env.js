const express = require('express');

module.exports = async (req, res) => {
  try {
    // Get environment info
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.substring(0, 50) + '...' : 
        'NOT SET',
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 
        process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20) + '...' : 
        'NOT SET',
      timestamp: new Date().toISOString()
    };

    res.json({
      message: 'Environment Test',
      environment: envInfo,
      note: 'Check if DATABASE_URL contains "floral-meadow" (dev) or "jolly-silence" (prod)'
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      environment: process.env.NODE_ENV
    });
  }
};
