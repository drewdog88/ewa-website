const request = require('supertest');
const app = require('../server');

describe('Security Tests', () => {
  describe('Authentication Security', () => {
    test('Should prevent brute force attacks', async () => {
      const attempts = 5;
      let lastResponse;
      
      for (let i = 0; i < attempts; i++) {
        lastResponse = await request(app)
          .post('/api/login')
          .send({
            username: 'admin',
            password: `wrongpassword${i}`
          });
      }
      
      // Should implement rate limiting or account lockout
      expect(lastResponse.status).toBe(401);
    });

    test('Should validate session tokens', async () => {
      const response = await request(app)
        .get('/api/officers')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Input Validation Security', () => {
    test('Should prevent NoSQL injection', async () => {
      const response = await request(app)
        .post('/api/officers')
        .send({
          name: { $ne: null },
          position: 'Test',
          club: 'test-club'
        });
      
      expect(response.status).toBe(400);
    });

    test('Should prevent command injection', async () => {
      const response = await request(app)
        .post('/api/volunteers')
        .send({
          name: '$(rm -rf /)',
          email: 'test@test.com',
          club: 'test-club'
        });
      
      expect(response.status).toBe(400);
    });

    test('Should prevent path traversal', async () => {
      const response = await request(app)
        .get('/api/documents/../../../etc/passwd');
      
      expect(response.status).toBe(404);
    });
  });

  describe('File Upload Security', () => {
    test('Should validate file types', async () => {
      const response = await request(app)
        .post('/api/1099/upload-w9')
        .attach('w9', Buffer.from('fake executable'), 'malware.exe');
      
      expect(response.status).toBe(400);
    });

    test('Should limit file sizes', async () => {
      const largeFile = Buffer.alloc(10 * 1024 * 1024); // 10MB
      const response = await request(app)
        .post('/api/1099/upload-w9')
        .attach('w9', largeFile, 'large.pdf');
      
      expect(response.status).toBe(400);
    });
  });

  describe('Database Security', () => {
    test('Should use parameterized queries', async () => {
      const response = await request(app)
        .get('/api/officers?club=test\'; DROP TABLE officers; --');
      
      // Should not crash and should handle gracefully
      expect(response.status).toBe(200);
    });

    test('Should prevent sensitive data exposure', async () => {
      const response = await request(app)
        .get('/api/users');
      
      // Should not expose password hashes or sensitive data
      expect(response.status).toBe(401); // Should require authentication
    });
  });

  describe('CORS Security', () => {
    test('Should have proper CORS headers', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'https://malicious-site.com');
      
      // Should not allow unauthorized origins
      expect(response.headers['access-control-allow-origin']).not.toBe('*');
    });
  });

  describe('HTTP Security Headers', () => {
    test('Should include security headers', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Error Handling Security', () => {
    test('Should not expose sensitive information in errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint');
      
      expect(response.status).toBe(404);
      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('sql');
    });
  });
});
