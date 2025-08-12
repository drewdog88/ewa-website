const request = require('supertest');
// const express = require('express'); // Unused - can be removed in future cleanup
// const path = require('path'); // Unused - can be removed in future cleanup

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/testdb';
process.env.BLOB_READ_WRITE_TOKEN = 'test_token';

// Import the server app
const app = require('../server');

describe('EWA API Endpoints', () => {
  let server;

  beforeAll(async () => {
    // Create a server instance for supertest
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        console.log(`✅ Test server started on port ${server.address().port}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      return new Promise((resolve) => {
        server.close(() => {
          console.log('✅ Test server closed');
          resolve();
        });
      });
    }
  });

  describe('Health Check', () => {
    test('GET /api/health should return 200', async () => {
      const response = await request(server).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Authentication', () => {
    test('POST /api/login should validate credentials', async () => {
      const response = await request(server)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'ewa2025'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('POST /api/login should reject invalid credentials', async () => {
      const response = await request(server)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Officers API', () => {
    test('GET /api/officers should return officers list', async () => {
      const response = await request(server).get('/api/officers');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/officers should validate required fields', async () => {
      const response = await request(server)
        .post('/api/officers')
        .send({
          name: '',
          position: 'Test Position',
          club: 'test-club'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Volunteers API', () => {
    test('GET /api/volunteers should return volunteers list', async () => {
      const response = await request(server).get('/api/volunteers');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/volunteers should validate email format', async () => {
      const response = await request(server)
        .post('/api/volunteers')
        .send({
          name: 'Test Volunteer',
          email: 'invalid-email',
          club: 'test-club'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('1099 Forms API', () => {
    test('GET /api/1099 should return 1099 forms list', async () => {
      const response = await request(server).get('/api/1099');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('POST /api/1099 should validate required fields', async () => {
      const response = await request(server)
        .post('/api/1099')
        .send({
          recipient_name: '',
          amount: 100,
          tax_year: 2024
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(server).get('/api/health');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Input Validation', () => {
    test('Should sanitize SQL injection attempts', async () => {
      const response = await request(server)
        .post('/api/officers')
        .send({
          name: '\'; DROP TABLE officers; --',
          position: 'Test',
          club: 'test-club'
        });
      
      // Should not crash and should handle gracefully
      expect(response.status).toBe(400);
    });

    test('Should validate XSS attempts', async () => {
      const response = await request(server)
        .post('/api/volunteers')
        .send({
          name: '<script>alert("xss")</script>',
          email: 'test@test.com',
          club: 'test-club'
        });
      
      // Should sanitize or reject
      expect(response.status).toBe(400);
    });
  });
});
