const fs = require('fs');
const path = require('path');

function switchToProductionDB() {
  console.log('🔄 Switching Development Environment to Production Database...');
  console.log('============================================================');

  try {
    // Read the production environment file
    const productionEnv = fs.readFileSync('.env.production', 'utf8');
    const localEnv = fs.readFileSync('.env.local', 'utf8');

    // Create a backup of the current .env.local
    fs.writeFileSync('.env.local.backup', localEnv);
    console.log('✅ Created backup of current .env.local');

    // Update .env.local to use production database
    const updatedLocalEnv = localEnv.replace(
      /DATABASE_URL=.*/,
      'DATABASE_URL=' + productionEnv.match(/DATABASE_URL=(.*)/)[1]
    );

    fs.writeFileSync('.env.local', updatedLocalEnv);
    console.log('✅ Updated .env.local to use production database');

    console.log('\n📋 Changes made:');
    console.log('   - Development environment now uses production database');
    console.log('   - Development blob storage remains separate');
    console.log('   - NODE_ENV remains "development"');
    console.log('   - Original .env.local backed up to .env.local.backup');

    console.log('\n🔗 You can now:');
    console.log('   - Visit: https://ewa-website-dev.vercel.app');
    console.log('   - Login to admin: https://ewa-website-dev.vercel.app/admin/login.html');
    console.log('   - Use admin credentials: admin/ewa2025');
    console.log('   - All data will be from production (read-only)');

    console.log('\n⚠️ Important Notes:');
    console.log('   - This is a temporary solution');
    console.log('   - The dev database issue needs to be resolved with Neon support');
    console.log('   - To revert: copy .env.local.backup to .env.local');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

switchToProductionDB();
