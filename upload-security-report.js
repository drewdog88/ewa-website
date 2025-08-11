const fs = require('fs');
const path = require('path');
const { put } = require('@vercel/blob');

async function main() {
  const reportPath = path.join(__dirname, 'security-report.json');

  if (fs.existsSync(reportPath)) {
    const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    
    console.log('Found security report, uploading to Vercel Blob...');
    
    // Upload to Vercel Blob if BLOB_READ_WRITE_TOKEN is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put('security-report.json', JSON.stringify(reportData, null, 2), {
          access: 'public',
          addRandomSuffix: false
        });
        console.log(`Security report uploaded to Vercel Blob: ${blob.url}`);
      } catch (blobError) {
        console.error('Failed to upload to Vercel Blob:', blobError.message);
      }
    } else {
      console.log('BLOB_READ_WRITE_TOKEN not found, skipping Vercel Blob upload');
    }
  } else {
    console.log('No security-report.json found');
  }
}

main().catch(console.error);
