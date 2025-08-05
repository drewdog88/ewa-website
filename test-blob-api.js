// Test script to verify Vercel Blob functionality
require('dotenv').config({ path: '.env.local' });

console.log('Testing Vercel Blob connection...');
console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? '✅ Found' : '❌ Not found');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
        const { put } = require('@vercel/blob');
        
        console.log('✅ Vercel Blob module loaded successfully');
        
        // Test uploading a simple text file
        const testData = 'Hello from EWA website blob test!';
        const testFileName = `test-${Date.now()}.txt`;
        
        console.log('Attempting to upload test file...');
        
        put(testFileName, testData, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN
        }).then((blob) => {
            console.log('✅ Blob upload successful!');
            console.log('URL:', blob.url);
            console.log('Size:', blob.size);
            console.log('Uploaded at:', blob.uploadedAt);
            
            // Clean up - delete the test file
            return fetch(blob.url, { method: 'DELETE' });
        }).then(() => {
            console.log('✅ Test file cleaned up successfully');
        }).catch((error) => {
            console.error('❌ Blob test failed:', error.message);
            console.error('Error details:', error);
        });
        
    } catch (error) {
        console.error('❌ Error loading Vercel Blob module:', error.message);
    }
} else {
    console.log('❌ BLOB_READ_WRITE_TOKEN is missing');
} 