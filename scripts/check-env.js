#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Current Environment...');

try {
    if (!fs.existsSync('.env.local')) {
        console.log('❌ No .env.local file found');
        process.exit(1);
    }

    const envContent = fs.readFileSync('.env.local', 'utf8');
    
    // Check for database indicators
    if (envContent.includes('ep-jolly-silence-afmn89zf')) {
        console.log('🚨 PRODUCTION ENVIRONMENT DETECTED');
        console.log('📊 Database: ep-jolly-silence-afmn89zf (Production)');
        console.log('🔒 Environment: Production');
        console.log('⚠️  WARNING: You are connected to PRODUCTION database');
        console.log('⚠️  Be extremely careful with any database operations');
    } else if (envContent.includes('ep-floral-meadow-ad5lu8xi')) {
        console.log('✅ DEVELOPMENT ENVIRONMENT DETECTED');
        console.log('📊 Database: ep-floral-meadow-ad5lu8xi (Development)');
        console.log('🔒 Environment: Development');
        console.log('✅ Safe for database operations and testing');
    } else {
        console.log('❓ UNKNOWN ENVIRONMENT');
        console.log('📊 Database URL not recognized');
        console.log('⚠️  Please verify your environment configuration');
    }

    // Check for other environment variables
    if (envContent.includes('NODE_ENV=development')) {
        console.log('✅ NODE_ENV set to development');
    } else if (envContent.includes('NODE_ENV=production')) {
        console.log('⚠️  NODE_ENV set to production');
    }

    // Check for blob storage
    if (envContent.includes('BLOB_READ_WRITE_TOKEN')) {
        console.log('✅ Blob storage configured');
    } else {
        console.log('❌ Blob storage not configured');
    }

} catch (error) {
    console.error('❌ Error checking environment:', error.message);
    process.exit(1);
}
