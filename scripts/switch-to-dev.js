#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to Development Environment...');

// Development environment configuration
const devEnvContent = `# Development Environment - EWA Website
# DATABASE_URL for development database (neon-ewadev)
DATABASE_URL=postgres://neondb_owner:npg_hpHzsiYWD4Z3@ep-floral-meadow-ad5lu8xi-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Development Blob Storage (separate from production)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_D3cmXYAFiy0Jv5Ch_Nfez7DLKTwQPUzZbMiPvu3j5zAQlLa

# Environment indicator
NODE_ENV=development
`;

try {
    // Backup current .env.local if it exists
    if (fs.existsSync('.env.local')) {
        fs.copyFileSync('.env.local', '.env.local.backup');
        console.log('✅ Backed up current .env.local to .env.local.backup');
    }

    // Write development environment
    fs.writeFileSync('.env.local', devEnvContent);
    console.log('✅ Switched to development environment');
    console.log('📊 Database: ep-floral-meadow-ad5lu8xi (Development)');
    console.log('🔒 Environment: Development');
    
    // Verify the switch
    const envContent = fs.readFileSync('.env.local', 'utf8');
    if (envContent.includes('ep-floral-meadow-ad5lu8xi')) {
        console.log('✅ Verification: Successfully connected to development database');
    } else {
        console.log('❌ Verification failed: Not connected to development database');
        process.exit(1);
    }

} catch (error) {
    console.error('❌ Error switching to development environment:', error.message);
    process.exit(1);
}
