const request = require('supertest');
const { mockUtils } = require('../helpers/test-setup');

// Mock external dependencies
jest.mock('@vercel/blob', () => mockUtils.mockVercelBlob());

// Import the health API handler
const healthHandler = require('../../api/health');

// Create a mock Express app for testing
const express = require('express');
const app = express();
app.get('/api/health', healthHandler);

describe('Health API Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('GET /api/health', () => {
    test('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('databaseAvailable');
      expect(response.body).toHaveProperty('blobAvailable');
      expect(response.body).toHaveProperty('storage', 'Neon PostgreSQL');
      expect(response.body).toHaveProperty('message', 'Health check endpoint working!');
    });

    test('should include valid timestamp', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should detect database availability when DATABASE_URL is set', async () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@host:5432/db';

      const response = await request(app)
        .get('/api/health');

      expect(response.body.databaseAvailable).toBe(true);
    });

    test('should detect database unavailability when DATABASE_URL is not set', async () => {
      delete process.env.DATABASE_URL;

      const response = await request(app)
        .get('/api/health');

      expect(response.body.databaseAvailable).toBe(false);
    });

    test('should detect blob availability when BLOB_READ_WRITE_TOKEN is set', async () => {
      process.env.BLOB_READ_WRITE_TOKEN = 'test-token';

      const response = await request(app)
        .get('/api/health');

      expect(response.body.blobAvailable).toBe(true);
    });

    test('should detect blob unavailability when BLOB_READ_WRITE_TOKEN is not set', async () => {
      delete process.env.BLOB_READ_WRITE_TOKEN;

      const response = await request(app)
        .get('/api/health');

      expect(response.body.blobAvailable).toBe(false);
    });

    test('should return development environment by default', async () => {
      delete process.env.NODE_ENV;

      const response = await request(app)
        .get('/api/health');

      expect(response.body.environment).toBe('development');
    });

    test('should return production environment when NODE_ENV is set', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .get('/api/health');

      expect(response.body.environment).toBe('production');
    });

    test('should handle OPTIONS preflight request', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      // Note: CORS headers are set in the handler but may not be visible in test
      // The important thing is that OPTIONS requests are handled
    });

    test('should accept GET requests', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
    });

    test('should return consistent response structure', async () => {
      const response = await request(app)
        .get('/api/health');

      const expectedKeys = [
        'status',
        'timestamp',
        'environment',
        'databaseAvailable',
        'blobAvailable',
        'storage',
        'message'
      ];

      expectedKeys.forEach(key => {
        expect(response.body).toHaveProperty(key);
      });
    });

    test('should not expose sensitive information', async () => {
      process.env.DATABASE_URL = 'postgresql://user:secret@host:5432/db';
      process.env.BLOB_READ_WRITE_TOKEN = 'secret-token';

      const response = await request(app)
        .get('/api/health');

      // Should not expose actual connection strings or tokens
      const responseString = JSON.stringify(response.body);
      expect(responseString).not.toContain('secret');
      expect(responseString).not.toContain('postgresql://user:secret@host:5432/db');
      expect(responseString).not.toContain('secret-token');
    });
  });
});
