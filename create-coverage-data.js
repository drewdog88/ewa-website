require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

function calculateCoverageFromLcov(lcovData) {
  const lines = lcovData.split('\n');
  let totalLines = 0;
  let coveredLines = 0;

  lines.forEach(line => {
    if (line.startsWith('DA:')) {
      const parts = line.split(',');
      if (parts.length === 2) {
        const count = parseInt(parts[1]);
        totalLines++;
        if (count > 0) {
          coveredLines++;
        }
      }
    }
  });

  if (totalLines === 0) return 0;
  return Math.round((coveredLines / totalLines) * 100);
}

async function main() {
  // Read lcov.info and calculate coverage
  const lcovPath = path.join(__dirname, 'coverage', 'lcov.info');
  const coverageDataPath = path.join(__dirname, 'coverage-data.json');

  if (fs.existsSync(lcovPath)) {
    const lcovData = fs.readFileSync(lcovPath, 'utf8');
    const coverage = calculateCoverageFromLcov(lcovData);
    
    // Create coverage data
    const coverageData = {
      coverage: coverage,
      timestamp: new Date().toISOString(),
      testsPassed: true
    };
    
    // Save locally
    fs.writeFileSync(coverageDataPath, JSON.stringify(coverageData, null, 2));
    console.log(`Coverage calculated: ${coverage}%`);
    console.log(`Coverage data saved locally to: ${coverageDataPath}`);
    
    // Also save to Vercel Blob if BLOB_READ_WRITE_TOKEN is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put('coverage-data.json', JSON.stringify(coverageData, null, 2), {
          access: 'public',
          addRandomSuffix: false
        });
        console.log(`Coverage data also saved to Vercel Blob: ${blob.url}`);
      } catch (blobError) {
        console.error('Failed to save to Vercel Blob:', blobError.message);
      }
    } else {
      console.log('BLOB_READ_WRITE_TOKEN not found, skipping Vercel Blob upload');
    }
  } else {
    console.error('lcov.info file not found');
    process.exit(1);
  }
}

main().catch(console.error);
