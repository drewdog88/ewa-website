// Test script to verify Redis connection
require('dotenv').config({ path: '.env.local' });

console.log('Testing Redis connection...');
console.log('REDIS_URL:', process.env.REDIS_URL ? '✅ Found' : '❌ Not found');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');

if (process.env.REDIS_URL) {
    const { createClient } = require('redis');
    const redis = createClient({ url: process.env.REDIS_URL });
    
    redis.connect()
        .then(() => {
            console.log('✅ Redis connected successfully!');
            
            // Test setting and getting a value
            return redis.set('test', 'hello from EWA website');
        })
        .then(() => {
            return redis.get('test');
        })
        .then((value) => {
            console.log('✅ Redis test value retrieved:', value);
            return redis.del('test');
        })
        .then(() => {
            console.log('✅ Redis test cleanup completed');
            return redis.quit();
        })
        .catch((error) => {
            console.error('❌ Redis test failed:', error.message);
        });
} else {
    console.log('❌ Redis URL is missing');
} 