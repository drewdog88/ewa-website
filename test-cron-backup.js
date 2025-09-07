#!/usr/bin/env node

/**
 * Test Script for Vercel Cron Backup Job
 * 
 * This script tests the cron backup functionality locally and provides
 * guidance for production deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Vercel Cron Backup Configuration\n');

// Test 1: Check if cron-backup.js exists and has correct structure
console.log('1️⃣ Checking cron-backup.js file structure...');
try {
  const cronFile = fs.readFileSync(path.join(__dirname, 'api', 'cron-backup.js'), 'utf8');
  
  // Check for required elements
  const checks = [
    { name: 'Export default function', pattern: /export default async function handler/, found: false },
    { name: 'CRON_SECRET validation', pattern: /CRON_SECRET/, found: false },
    { name: 'User agent validation', pattern: /vercel-cron/, found: false },
    { name: 'Environment validation', pattern: /validateEnvironment/, found: false },
    { name: 'Database backup logic', pattern: /createBackup/, found: false },
    { name: 'Blob cleanup logic', pattern: /cleanupOldBackups/, found: false }
  ];
  
  checks.forEach(check => {
    check.found = check.pattern.test(cronFile);
    console.log(`   ${check.found ? '✅' : '❌'} ${check.name}`);
  });
  
  const allPassed = checks.every(check => check.found);
  console.log(`   ${allPassed ? '✅' : '❌'} File structure validation: ${allPassed ? 'PASSED' : 'FAILED'}\n`);
  
} catch (error) {
  console.log(`   ❌ Error reading cron-backup.js: ${error.message}\n`);
}

// Test 2: Check vercel.json configuration
console.log('2️⃣ Checking vercel.json configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
  
  // Check for cron configuration
  if (vercelConfig.crons && vercelConfig.crons.length > 0) {
    const cronJob = vercelConfig.crons[0];
    console.log(`   ✅ Cron jobs configured: ${vercelConfig.crons.length}`);
    console.log(`   📍 Path: ${cronJob.path}`);
    console.log(`   ⏰ Schedule: ${cronJob.schedule}`);
    
    // Validate cron expression (basic check)
    const cronParts = cronJob.schedule.split(' ');
    if (cronParts.length === 5) {
      console.log(`   ✅ Cron expression format: VALID`);
    } else {
      console.log(`   ❌ Cron expression format: INVALID (expected 5 parts)`);
    }
  } else {
    console.log(`   ❌ No cron jobs configured in vercel.json`);
  }
  
  // Check for routing configuration
  const hasCronRoute = vercelConfig.routes && vercelConfig.routes.some(route => 
    route.src === '/api/cron-backup' && route.dest === '/api/cron-backup.js'
  );
  console.log(`   ${hasCronRoute ? '✅' : '❌'} Cron route configured: ${hasCronRoute ? 'YES' : 'NO'}\n`);
  
} catch (error) {
  console.log(`   ❌ Error reading vercel.json: ${error.message}\n`);
}

// Test 3: Environment variables check
console.log('3️⃣ Checking environment variables...');
const requiredEnvVars = [
  'DATABASE_URL',
  'BLOB_READ_WRITE_TOKEN'
];

const optionalEnvVars = [
  'CRON_SECRET',
  'NODE_ENV'
];

requiredEnvVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  console.log(`   ${exists ? '✅' : '❌'} ${envVar}: ${exists ? 'SET' : 'MISSING'}`);
});

optionalEnvVars.forEach(envVar => {
  const exists = !!process.env[envVar];
  console.log(`   ${exists ? '✅' : '⚠️'} ${envVar}: ${exists ? 'SET' : 'NOT SET (optional)'}`);
});

console.log('');

// Test 4: Dependencies check
console.log('4️⃣ Checking required dependencies...');
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const requiredDeps = ['pg', '@vercel/blob', 'archiver'];

requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies && packageJson.dependencies[dep];
  console.log(`   ${exists ? '✅' : '❌'} ${dep}: ${exists ? 'INSTALLED' : 'MISSING'}`);
});

console.log('');

// Test 5: Generate CRON_SECRET if not set
console.log('5️⃣ CRON_SECRET Security Setup...');
if (!process.env.CRON_SECRET) {
  console.log('   ⚠️  CRON_SECRET not set - generating recommendation...');
  const crypto = require('crypto');
  const generatedSecret = crypto.randomBytes(32).toString('hex');
  console.log(`   🔐 Generated CRON_SECRET: ${generatedSecret}`);
  console.log(`   📝 Add this to your Vercel environment variables:`);
  console.log(`      CRON_SECRET=${generatedSecret}`);
  console.log('');
} else {
  console.log('   ✅ CRON_SECRET is configured');
  console.log('');
}

// Test 6: Production deployment checklist
console.log('6️⃣ Production Deployment Checklist...');
console.log('   📋 Before deploying to production:');
console.log('   1. ✅ Set CRON_SECRET in Vercel project settings');
console.log('   2. ✅ Verify DATABASE_URL is set in Vercel');
console.log('   3. ✅ Verify BLOB_READ_WRITE_TOKEN is set in Vercel');
console.log('   4. ✅ Deploy to production: git push origin main');
console.log('   5. ✅ Check Vercel dashboard for cron job status');
console.log('   6. ✅ Monitor function logs for execution');
console.log('');

// Test 7: Manual testing instructions
console.log('7️⃣ Manual Testing Instructions...');
console.log('   🧪 To test the cron job manually:');
console.log('   1. Deploy to production first');
console.log('   2. Get your CRON_SECRET from Vercel environment variables');
console.log('   3. Test with curl:');
console.log('      curl -H "Authorization: Bearer YOUR_CRON_SECRET" \\');
console.log('           -H "User-Agent: vercel-cron/1.0" \\');
console.log('           https://your-domain.vercel.app/api/cron-backup');
console.log('   4. Check Vercel function logs for execution details');
console.log('');

// Test 8: Monitoring and troubleshooting
console.log('8️⃣ Monitoring & Troubleshooting...');
console.log('   📊 How to monitor cron job execution:');
console.log('   1. Vercel Dashboard → Your Project → Functions → cron-backup');
console.log('   2. Check "Logs" tab for execution details');
console.log('   3. Look for "🚀 Vercel Cron Job triggered" messages');
console.log('   4. Verify backup files appear in Vercel Blob storage');
console.log('');
console.log('   🔍 Common issues and solutions:');
console.log('   • Cron job not running: Check Vercel dashboard cron job status');
console.log('   • 401 Unauthorized: Verify CRON_SECRET is set correctly');
console.log('   • 403 Forbidden: Check user agent is "vercel-cron/1.0"');
console.log('   • 500 Internal Error: Check environment variables and logs');
console.log('   • Backup fails: Verify DATABASE_URL and BLOB_READ_WRITE_TOKEN');
console.log('');

console.log('🎯 Test Summary Complete!');
console.log('📝 Review the results above and address any ❌ items before deploying.');
console.log('🚀 Once all checks pass, deploy to production and monitor the cron job execution.');
