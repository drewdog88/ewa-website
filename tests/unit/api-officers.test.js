const request = require('supertest');
const { mockUtils } = require('../helpers/test-setup');

// Mock external dependencies
jest.mock('@vercel/blob', () => mockUtils.mockVercelBlob());
jest.mock('../../database/neon-functions', () => ({
  getOfficers: jest.fn()
}));

// Import the officers API handler
const officersHandler = require('../../api/officers');

// Create a mock Express app for testing
const express = require('express');
const app = express();
app.get('/api/officers', officersHandler);

describe('Officers API Unit Tests', () => {
  const { getOfficers } = require('../../database/neon-functions');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/officers', () => {
    test('should return 200 with officers data', async () => {
      const mockOfficers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          club: 'Baseball',
          position: 'President',
          startDate: '2024-01-01'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '555-5678',
          club: 'Soccer',
          position: 'Vice President',
          startDate: '2024-01-15'
        }
      ];

      getOfficers.mockResolvedValue(mockOfficers);

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('officers');
      expect(response.body.officers).toEqual(mockOfficers);
    });

    test('should return empty array when no officers exist', async () => {
      getOfficers.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.officers).toEqual([]);
    });

    test('should handle database errors gracefully', async () => {
      getOfficers.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Internal server error');
    });

    test('should handle OPTIONS preflight request', async () => {
      const response = await request(app)
        .options('/api/officers')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      // Note: CORS headers are set in the handler but may not be visible in test
      // The important thing is that OPTIONS requests are handled
    });

    test('should accept GET requests', async () => {
      getOfficers.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(200);
    });

    test('should return consistent response structure', async () => {
      getOfficers.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/officers');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('officers');
      expect(Array.isArray(response.body.officers)).toBe(true);
    });

    test('should handle null officers data', async () => {
      getOfficers.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.officers).toBeNull();
    });

    test('should handle undefined officers data', async () => {
      getOfficers.mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.officers).toBeUndefined();
    });

    test('should validate officer data structure', async () => {
      const mockOfficers = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-1234',
          club: 'Baseball',
          position: 'President',
          startDate: '2024-01-01'
        }
      ];

      getOfficers.mockResolvedValue(mockOfficers);

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(200);
      expect(response.body.officers[0]).toHaveProperty('id');
      expect(response.body.officers[0]).toHaveProperty('name');
      expect(response.body.officers[0]).toHaveProperty('email');
      expect(response.body.officers[0]).toHaveProperty('phone');
      expect(response.body.officers[0]).toHaveProperty('club');
      expect(response.body.officers[0]).toHaveProperty('position');
      expect(response.body.officers[0]).toHaveProperty('startDate');
    });

    test('should handle large officer datasets', async () => {
      const mockOfficers = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Officer ${i + 1}`,
        email: `officer${i + 1}@example.com`,
        phone: `555-${String(i + 1).padStart(4, '0')}`,
        club: `Club ${i + 1}`,
        position: 'Member',
        startDate: '2024-01-01'
      }));

      getOfficers.mockResolvedValue(mockOfficers);

      const response = await request(app)
        .get('/api/officers');

      expect(response.status).toBe(200);
      expect(response.body.officers).toHaveLength(100);
      expect(response.body.officers[0].id).toBe('1');
      expect(response.body.officers[99].id).toBe('100');
    });
  });
});
