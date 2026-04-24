const { neon } = require('@neondatabase/serverless');

// Mock the neon module
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn()
}));

/** sql`...` is invoked as a tag: (strings, ...values). Assert via serialized calls. */
function expectMockSqlToContain(mockFn, substring) {
  expect(JSON.stringify(mockFn.mock.calls)).toContain(substring);
}

// Mock console methods to avoid noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Import the functions after mocking
const {
  getOfficers,
  addOfficer,
  getUsers,
  updateUser,
  getInsurance,
  addInsurance,
  getDocuments,
  addDocument,
  deleteDocument,
  initializeDatabase,
  migrateDataFromJson,
  __resetSqlForTests
} = require('../../database/neon-functions');

describe('Database Neon Functions - Comprehensive Tests', () => {
  let mockSql;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Store original environment
    originalEnv = { ...process.env };
    
    mockSql = jest.fn();
    mockSql.unsafe = jest.fn().mockResolvedValue([]);
    neon.mockReturnValue(mockSql);
    
    // Set up DATABASE_URL
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });

  afterEach(() => {
    process.env = originalEnv;
    __resetSqlForTests();
  });

  describe('Database Connection', () => {
    test('should initialize connection when DATABASE_URL is available', () => {
      const sql = require('../../database/neon-functions').getSql();
      expect(neon).toHaveBeenCalledWith('postgresql://test:test@localhost:5432/test');
      expect(sql).toBe(mockSql);
    });

    test('should return null when DATABASE_URL is not available', () => {
      delete process.env.DATABASE_URL;
      const sql = require('../../database/neon-functions').getSql();
      expect(sql).toBeNull();
    });

    test('should reuse existing connection', () => {
      const sql1 = require('../../database/neon-functions').getSql();
      const sql2 = require('../../database/neon-functions').getSql();
      expect(neon).toHaveBeenCalledTimes(1);
      expect(sql1).toBe(sql2);
    });
  });

  describe('Officers Functions', () => {
    test('getOfficers should return officers with club information', async () => {
      const mockOfficers = [
        { id: 1, name: 'John Doe', position: 'President', club_id: 1, boosterclubname: 'Orchestra' },
        { id: 2, name: 'Jane Smith', position: 'Vice President', club_id: 2, boosterclubname: 'Band' }
      ];
      mockSql.mockResolvedValue(mockOfficers);

      const result = await getOfficers();

      expectMockSqlToContain(mockSql, 'SELECT o.id, o.name, o.position');
      expect(result).toEqual(mockOfficers);
    });

    test('getOfficers should return empty array on database error', async () => {
      mockSql.mockRejectedValue(new Error('Database connection failed'));

      const result = await getOfficers();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('❌ Database error getting officers:', expect.any(Object));
    });

    test('getOfficers should return empty array when no database connection', async () => {
      delete process.env.DATABASE_URL;
      
      const result = await getOfficers();

      expect(result).toEqual([]);
    });

    test('addOfficer should add officer with club_id lookup', async () => {
      const mockClub = [{ id: 1 }];
      const mockOfficer = { id: 1, name: 'John Doe', position: 'President', club_id: 1 };
      
      mockSql
        .mockResolvedValueOnce(mockClub) // Club lookup
        .mockResolvedValueOnce([mockOfficer]); // Officer insert

      const officerData = {
        name: 'John Doe',
        position: 'President',
        email: 'john@example.com',
        phone: '555-1234',
        booster_club: 'Orchestra'
      };

      const result = await addOfficer(officerData);

      expectMockSqlToContain(mockSql, 'booster_clubs');
      expectMockSqlToContain(mockSql, 'INSERT INTO officers');
      expect(result).toEqual(mockOfficer);
    });

    test('addOfficer should handle missing booster club gracefully', async () => {
      const mockOfficer = { id: 1, name: 'John Doe', position: 'President', club_id: null };
      mockSql.mockResolvedValueOnce([mockOfficer]);

      const officerData = {
        name: 'John Doe',
        position: 'President',
        email: 'john@example.com',
        phone: '555-1234'
        // No booster_club
      };

      const result = await addOfficer(officerData);

      expectMockSqlToContain(mockSql, 'INSERT INTO officers');
      expect(result).toEqual(mockOfficer);
    });

    test('addOfficer should throw error on database failure', async () => {
      mockSql.mockRejectedValue(new Error('Insert failed'));

      const officerData = {
        name: 'John Doe',
        position: 'President',
        email: 'john@example.com',
        phone: '555-1234'
      };

      await expect(addOfficer(officerData)).rejects.toThrow('Insert failed');
      expect(console.error).toHaveBeenCalledWith('❌ Database error adding officer:', expect.any(Object));
    });
  });

  describe('Users Functions', () => {
    test('getUsers should return users as a map', async () => {
      const mockUsers = [
        { username: 'admin', role: 'admin', created_at: '2024-01-01' },
        { username: 'user1', role: 'user', created_at: '2024-01-02' }
      ];
      mockSql.mockResolvedValue(mockUsers);

      const result = await getUsers();

      expectMockSqlToContain(mockSql, 'SELECT * FROM users');
      expect(result.admin).toMatchObject(mockUsers[0]);
      expect(result.user1).toMatchObject(mockUsers[1]);
    });

    test('getUsers should return empty object on error', async () => {
      mockSql.mockRejectedValue(new Error('Database error'));

      const result = await getUsers();

      expect(result).toEqual({});
      expect(console.error).toHaveBeenCalledWith('Error getting users:', expect.any(Error));
    });

    test('updateUser should update user with provided fields', async () => {
      const mockUser = { username: 'admin', last_login: '2024-01-01T12:00:00Z' };
      mockSql.mockResolvedValue([mockUser]);

      const updates = {
        lastLogin: '2024-01-01T12:00:00Z',
        failedAttempts: 0,
        locked: false
      };

      const result = await updateUser('admin', updates);

      expectMockSqlToContain(mockSql, 'UPDATE users');
      expect(result).toEqual(mockUser);
    });

    test('updateUser should handle null values', async () => {
      const mockUser = { username: 'admin', last_login: null };
      mockSql.mockResolvedValue([mockUser]);

      const updates = {};

      const result = await updateUser('admin', updates);

      expectMockSqlToContain(mockSql, 'UPDATE users');
      expect(result).toEqual(mockUser);
    });
  });

  describe('Insurance Functions', () => {
    test('getInsurance should return insurance forms', async () => {
      const mockInsurance = [
        { id: 1, event_name: 'Event 1', event_date: '2024-01-01' },
        { id: 2, event_name: 'Event 2', event_date: '2024-02-01' }
      ];
      mockSql.mockResolvedValue(mockInsurance);

      const result = await getInsurance();

      expectMockSqlToContain(mockSql, 'insurance_forms');
      expect(result).toEqual(mockInsurance);
    });

    test('addInsurance should add new insurance form', async () => {
      const mockInsurance = { id: 1, event_name: 'Spring Concert', event_date: '2024-06-01' };
      mockSql.mockResolvedValue([mockInsurance]);

      const insuranceData = {
        eventName: 'Spring Concert',
        eventDate: '2024-06-01',
        eventDescription: 'Evening performance',
        participantCount: 50,
        submittedBy: 'admin',
        status: 'pending',
        clubId: null
      };

      const result = await addInsurance(insuranceData);

      expectMockSqlToContain(mockSql, 'INSERT INTO insurance_forms');
      expect(result).toEqual(mockInsurance);
    });
  });

  describe('Documents Functions', () => {
    test('getDocuments should return documents for specific club', async () => {
      const mockDocuments = [
        { id: 1, filename: 'doc1.pdf', booster_club: 'Orchestra' },
        { id: 2, filename: 'doc2.pdf', booster_club: 'Orchestra' }
      ];
      mockSql.mockResolvedValue(mockDocuments);

      const result = await getDocuments('Orchestra');

      expectMockSqlToContain(mockSql, 'SELECT * FROM documents');
      expect(result).toEqual(mockDocuments);
    });

    test('getDocuments should return all documents when no club specified', async () => {
      const mockDocuments = [
        { id: 1, filename: 'doc1.pdf', booster_club: 'Orchestra' },
        { id: 2, filename: 'doc2.pdf', booster_club: 'Band' }
      ];
      mockSql.mockResolvedValue(mockDocuments);

      const result = await getDocuments();

      expectMockSqlToContain(mockSql, 'SELECT * FROM documents');
      expect(result).toEqual(mockDocuments);
    });

    test('addDocument should add new document', async () => {
      const mockDocument = { id: 1, filename: 'new-doc.pdf', booster_club: 'Orchestra' };
      mockSql.mockResolvedValue([mockDocument]);

      const documentData = {
        filename: 'new-doc.pdf',
        originalName: 'New Document.pdf',
        blobUrl: 'https://blob.example/new-doc.pdf',
        boosterClub: 'Orchestra',
        fileSize: 1024,
        mimeType: 'application/pdf',
        uploadedBy: 'admin'
      };

      const result = await addDocument(documentData);

      expectMockSqlToContain(mockSql, 'INSERT INTO documents');
      expect(result).toEqual(mockDocument);
    });

    test('deleteDocument should delete document', async () => {
      mockSql.mockResolvedValue([{ id: 1 }]);

      const result = await deleteDocument(1);

      expectMockSqlToContain(mockSql, 'DELETE FROM documents');
      expect(result).toBe(true);
    });
  });

  describe('Database Initialization', () => {
    test('initializeDatabase should create tables', async () => {
      await initializeDatabase();

      expect(mockSql.unsafe).toHaveBeenCalled();
      expect(mockSql.unsafe.mock.calls.some(c => String(c[0]).includes('CREATE'))).toBe(true);
    });

    test('migrateDataFromJson should migrate data from JSON file', async () => {
      const mockOfficers = [
        { name: 'John Doe', position: 'President', email: 'john@example.com' }
      ];
      mockSql.mockResolvedValueOnce([]); // getOfficers — empty
      mockSql.mockResolvedValueOnce([{ id: 1 }]); // addOfficer insert

      const fs = require('fs');
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockOfficers));

      await migrateDataFromJson();

      expectMockSqlToContain(mockSql, 'INSERT INTO officers');
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      delete process.env.DATABASE_URL;
      
      const result = await getOfficers();
      expect(result).toEqual([]);
    });

    test('should handle SQL query errors', async () => {
      mockSql.mockRejectedValue(new Error('SQL syntax error'));

      const result = await getOfficers();
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle missing environment variables', async () => {
      delete process.env.DATABASE_URL;
      
      const result = await getUsers();
      expect(result).toEqual({});
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty result sets', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getOfficers();
      expect(result).toEqual([]);
    });

    test('should handle null values in data', async () => {
      const mockOfficers = [
        { id: 1, name: 'John Doe', position: null, club_id: null }
      ];
      mockSql.mockResolvedValue(mockOfficers);

      const result = await getOfficers();
      expect(result).toEqual(mockOfficers);
    });

    test('should handle special characters in data', async () => {
      const mockOfficers = [
        { id: 1, name: "O'Connor", position: "Vice-President", email: "test@example.com" }
      ];
      mockSql.mockResolvedValue(mockOfficers);

      const result = await getOfficers();
      expect(result).toEqual(mockOfficers);
    });
  });
});

