const request = require('supertest');
const { mockUtils } = require('../helpers/test-setup');

// Mock external dependencies
jest.mock('@vercel/blob', () => mockUtils.mockVercelBlob());
jest.mock('../../database/neon-functions', () => ({
  getUsers: jest.fn(),
  updateUser: jest.fn()
}));

// Import the login API handler
const loginHandler = require('../../api/login');

// Create a mock Express app for testing
const express = require('express');
const app = express();
app.use(express.json());
app.post('/api/login', loginHandler);
app.get('/api/login', loginHandler); // Add GET route to test method rejection

describe('Login API Unit Tests', () => {
  const { getUsers, updateUser } = require('../../database/neon-functions');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/login', () => {
    test('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Username and password required');
    });

    test('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'admin' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Username and password required');
    });

    test('should return 400 for empty request body', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Username and password required');
    });

    test('should return 401 for invalid credentials', async () => {
      const mockUsers = {
        admin: {
          username: 'admin',
          password: 'correctpassword',
          role: 'admin',
          club: 'ewa',
          clubName: 'EWA',
          isLocked: false
        }
      };

      getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Invalid username or password');
    });

    test('should return 401 for non-existent user', async () => {
      const mockUsers = {};

      getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Invalid username or password');
    });

    test('should return 403 for locked account', async () => {
      const mockUsers = {
        admin: {
          username: 'admin',
          password: 'password123',
          role: 'admin',
          club: 'ewa',
          clubName: 'EWA',
          isLocked: true
        }
      };

      getUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Account is locked. Please contact administrator.');
    });

    test('should return 200 for valid credentials', async () => {
      const mockUsers = {
        admin: {
          username: 'admin',
          password: 'password123',
          role: 'admin',
          club: 'ewa',
          clubName: 'EWA',
          isLocked: false,
          isFirstLogin: false
        }
      };

      getUsers.mockResolvedValue(mockUsers);
      updateUser.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toEqual({
        username: 'admin',
        role: 'admin',
        club: 'ewa',
        clubName: 'EWA',
        isFirstLogin: false
      });

      // Verify updateUser was called
      expect(updateUser).toHaveBeenCalledWith('admin', expect.objectContaining({
        lastLogin: expect.any(String)
      }));
    });

    test('should handle first login flag', async () => {
      const mockUsers = {
        admin: {
          username: 'admin',
          password: 'password123',
          role: 'admin',
          club: 'ewa',
          clubName: 'EWA',
          isLocked: false,
          isFirstLogin: true
        }
      };

      getUsers.mockResolvedValue(mockUsers);
      updateUser.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.isFirstLogin).toBe(true);
    });

    test('should handle database errors gracefully', async () => {
      getUsers.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Internal server error');
    });

    test('should handle updateUser errors gracefully', async () => {
      const mockUsers = {
        admin: {
          username: 'admin',
          password: 'password123',
          role: 'admin',
          club: 'ewa',
          clubName: 'EWA',
          isLocked: false
        }
      };

      getUsers.mockResolvedValue(mockUsers);
      updateUser.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'admin',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Internal server error');
    });

    test('should validate input sanitization', async () => {
      const sqlInjectionAttempt = {
        username: 'admin\'; DROP TABLE users; --',
        password: 'password'
      };

      const response = await request(app)
        .post('/api/login')
        .send(sqlInjectionAttempt);

      // Should not crash and should return a proper error response
      expect(response.status).toBe(401); // Will be 401 because user doesn't exist
      expect(response.body).toHaveProperty('success', false);
    });

    test('should handle OPTIONS preflight request', async () => {
      const response = await request(app)
        .options('/api/login')
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      // Note: CORS headers are set in the handler but may not be visible in test
      // The important thing is that OPTIONS requests are handled
    });

    test('should reject non-POST methods', async () => {
      const response = await request(app)
        .get('/api/login');

      expect(response.status).toBe(405);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Method not allowed');
    });
  });
});
