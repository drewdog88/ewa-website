#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to Production Environment...');

// Production environment configuration
const prodEnvContent = `# Production Environment - EWA Website
# DATABASE_URL for production database
DATABASE_URL=postgres://neondb_owner:npg_Lj2UaqCig6HI@ep-jolly-silence-afmn89zf-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require

# Production Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_kRe9XoIvjggJ03oF_JLbmM2kbj59CKUV5yrdsU1aa7lDTKt

# Environment indicator
NODE_ENV=production
`;

try {
    // Check if we have a production backup
    if (!fs.existsSync('.env.production')) {
        console.log('❌ Production environment backup not found');
        console.log('💡 Please ensure .env.production exists before switching');
        process.exit(1);
    }

    // Backup current .env.local if it exists
    if (fs.existsSync('.env.local')) {
        fs.copyFileSync('.env.local', '.env.local.backup');
        console.log('✅ Backed up current .env.local to .env.local.backup');
    }

    // Restore production environment
    fs.copyFileSync('.env.production', '.env.local');
    console.log('✅ Switched to production environment');
    console.log('📊 Database: ep-jolly-silence-afmn89zf (Production)');
    console.log('🔒 Environment: Production');
    
    // Verify the switch
    const envContent = fs.readFileSync('.env.local', 'utf8');
    if (envContent.includes('ep-jolly-silence-afmn89zf')) {
        console.log('✅ Verification: Successfully connected to production database');
        console.log('⚠️  WARNING: You are now connected to PRODUCTION database');
        console.log('⚠️  Be extremely careful with any database operations');
    } else {
        console.log('❌ Verification failed: Not connected to production database');
        process.exit(1);
    }

} catch (error) {
    console.error('❌ Error switching to production environment:', error.message);
    process.exit(1);
}
