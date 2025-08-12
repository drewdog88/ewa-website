const mammoth = require('mammoth');
const fs = require('fs');

async function checkDocxForBand() {
  try {
    const result = await mammoth.extractRawText({path: 'QRCODES4BOOSTERS.docx'});
    const text = result.value;
    const lines = text.split('\n');
    
    console.log('Looking for Band Boosters URLs in DOCX:');
    console.log('=' .repeat(50));
    
    lines.forEach((line, index) => {
      if (line.includes('band') || line.includes('Band') || line.includes('BAND')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
      }
    });
    
    // Also look for Zelle URLs
    console.log('\nLooking for Zelle URLs:');
    console.log('=' .repeat(30));
    
    const zelleUrls = lines.filter(line => line.includes('enroll.zellepay.com'));
    zelleUrls.forEach((url, index) => {
      console.log(`URL ${index + 1}: ${url.trim()}`);
    });
    
  } catch (error) {
    console.error('Error reading DOCX:', error);
  }
}

checkDocxForBand();

