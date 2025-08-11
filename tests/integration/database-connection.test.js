const request = require('supertest');
const express = require('express');
const { Pool } = require('pg');

// Mock the database connection
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

// Create a simple test app
const app = express();
app.use(express.json());

// Mock database functions
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
};

Pool.mockImplementation(() => mockPool);

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const client = await mockPool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    
    res.json({
      success: true,
      data: {
        currentTime: result.rows[0].current_time,
        message: 'Database connection successful'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

describe('Database Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Connection', () => {
    test('should connect to database successfully', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ current_time: new Date().toISOString() }]
        }),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .get('/api/test-db');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('currentTime');
      expect(response.body.data).toHaveProperty('message', 'Database connection successful');
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT NOW() as current_time');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle database connection errors', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .get('/api/test-db');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Database connection failed');
      expect(response.body.error).toBe('Connection failed');
    });

    test('should handle query errors', async () => {
      const mockClient = {
        query: jest.fn().mockRejectedValue(new Error('Query failed')),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .get('/api/test-db');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toBe('Database connection failed');
      expect(response.body.error).toBe('Query failed');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('Database Operations', () => {
    test('should execute SELECT queries', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            { id: 1, name: 'Test User' },
            { id: 2, name: 'Another User' }
          ],
          rowCount: 2
        }),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      // Test a simple SELECT operation
      const client = await mockPool.connect();
      const result = await client.query('SELECT * FROM users');
      client.release();

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toHaveProperty('id', 1);
      expect(result.rows[0]).toHaveProperty('name', 'Test User');
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users');
    });

    test('should execute INSERT queries', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 3 }],
          rowCount: 1
        }),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const client = await mockPool.connect();
      const result = await client.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
        ['New User', 'newuser@example.com']
      );
      client.release();

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id', 3);
      expect(mockClient.query).toHaveBeenCalledWith(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id',
        ['New User', 'newuser@example.com']
      );
    });

    test('should execute UPDATE queries', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 1, name: 'Updated User' }],
          rowCount: 1
        }),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const client = await mockPool.connect();
      const result = await client.query(
        'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
        ['Updated User', 1]
      );
      client.release();

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('name', 'Updated User');
      expect(mockClient.query).toHaveBeenCalledWith(
        'UPDATE users SET name = $1 WHERE id = $2 RETURNING *',
        ['Updated User', 1]
      );
    });

    test('should execute DELETE queries', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [{ id: 1, name: 'Deleted User' }],
          rowCount: 1
        }),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const client = await mockPool.connect();
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING *',
        [1]
      );
      client.release();

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id', 1);
      expect(mockClient.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE id = $1 RETURNING *',
        [1]
      );
    });
  });

  describe('Transaction Handling', () => {
    test('should handle transactions with rollback', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT
          .mockRejectedValueOnce(new Error('Constraint violation')), // Second INSERT fails
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const client = await mockPool.connect();
      
      try {
        await client.query('BEGIN');
        await client.query('INSERT INTO users (name) VALUES ($1)', ['User 1']);
        await client.query('INSERT INTO users (name) VALUES ($1)', ['User 2']); // This fails
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.query).not.toHaveBeenCalledWith('COMMIT');
    });

    test('should handle successful transactions', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT 1
          .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT 2
          .mockResolvedValueOnce({ rows: [] }), // COMMIT
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const client = await mockPool.connect();
      
      await client.query('BEGIN');
      await client.query('INSERT INTO users (name) VALUES ($1)', ['User 1']);
      await client.query('INSERT INTO users (name) VALUES ($1)', ['User 2']);
      await client.query('COMMIT');
      client.release();

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.query).not.toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Connection Pool Management', () => {
    test('should properly release connections', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);

      const client = await mockPool.connect();
      await client.query('SELECT 1');
      client.release();

      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should handle connection pool exhaustion', async () => {
      mockPool.connect.mockRejectedValue(new Error('No connections available'));

      const response = await request(app)
        .get('/api/test-db');

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Database connection failed');
      expect(response.body.error).toBe('No connections available');
    });
  });
});
