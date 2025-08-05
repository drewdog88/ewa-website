// Test script to verify blob token loading
require('dotenv').config({ path: '.env.local' });

console.log('Testing environment variables...');
console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '✅ Found' : '❌ Not found');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (process.env.BLOB_READ_WRITE_TOKEN) {
    console.log('✅ Blob token is loaded correctly!');
} else {
    console.log('❌ Blob token is missing');
} 