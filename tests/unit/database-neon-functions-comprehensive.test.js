const { neon } = require('@neondatabase/serverless');

// Mock the neon module
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn()
}));

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
  getVolunteers,
  addVolunteer,
  getInsurance,
  addInsurance,
  getForm1099,
  addForm1099,
  updateForm1099Status,
  updateForm1099,
  deleteForm1099,
  getDocuments,
  addDocument,
  deleteDocument,
  initializeDatabase,
  migrateDataFromJson
} = require('../../database/neon-functions');

describe('Database Neon Functions - Comprehensive Tests', () => {
  let mockSql;
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Store original environment
    originalEnv = { ...process.env };
    
    // Create mock SQL instance
    mockSql = jest.fn();
    neon.mockReturnValue(mockSql);
    
    // Set up DATABASE_URL
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
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

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT o.id, o.name, o.position'));
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

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM booster_clubs'));
      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO officers'));
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

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO officers'));
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

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users'));
      expect(result).toEqual({
        admin: mockUsers[0],
        user1: mockUsers[1]
      });
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

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'));
      expect(result).toEqual(mockUser);
    });

    test('updateUser should handle null values', async () => {
      const mockUser = { username: 'admin', last_login: null };
      mockSql.mockResolvedValue([mockUser]);

      const updates = {};

      const result = await updateUser('admin', updates);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'));
      expect(result).toEqual(mockUser);
    });
  });

  describe('Volunteers Functions', () => {
    test('getVolunteers should return volunteers', async () => {
      const mockVolunteers = [
        { id: 1, name: 'Volunteer 1', email: 'vol1@example.com' },
        { id: 2, name: 'Volunteer 2', email: 'vol2@example.com' }
      ];
      mockSql.mockResolvedValue(mockVolunteers);

      const result = await getVolunteers();

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM volunteers'));
      expect(result).toEqual(mockVolunteers);
    });

    test('addVolunteer should add new volunteer', async () => {
      const mockVolunteer = { id: 1, name: 'New Volunteer', email: 'new@example.com' };
      mockSql.mockResolvedValue([mockVolunteer]);

      const volunteerData = {
        name: 'New Volunteer',
        email: 'new@example.com',
        phone: '555-1234'
      };

      const result = await addVolunteer(volunteerData);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO volunteers'));
      expect(result).toEqual(mockVolunteer);
    });
  });

  describe('Insurance Functions', () => {
    test('getInsurance should return insurance forms', async () => {
      const mockInsurance = [
        { id: 1, recipient_name: 'Recipient 1', amount: '1000.00' },
        { id: 2, recipient_name: 'Recipient 2', amount: '2000.00' }
      ];
      mockSql.mockResolvedValue(mockInsurance);

      const result = await getInsurance();

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM insurance_forms'));
      expect(result).toEqual(mockInsurance);
    });

    test('addInsurance should add new insurance form', async () => {
      const mockInsurance = { id: 1, recipient_name: 'New Recipient', amount: '1500.00' };
      mockSql.mockResolvedValue([mockInsurance]);

      const insuranceData = {
        recipient_name: 'New Recipient',
        recipient_tin: '123-45-6789',
        amount: '1500.00',
        tax_year: 2024
      };

      const result = await addInsurance(insuranceData);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO insurance_forms'));
      expect(result).toEqual(mockInsurance);
    });
  });

  describe('1099 Forms Functions', () => {
    test('getForm1099 should return 1099 forms with club information', async () => {
      const mockForms = [
        { id: 1, recipient_name: 'Recipient 1', booster_club: 'Orchestra', amount: '1000.00' },
        { id: 2, recipient_name: 'Recipient 2', booster_club: 'Band', amount: '2000.00' }
      ];
      mockSql.mockResolvedValue(mockForms);

      const result = await getForm1099();

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT f.*, bc.name as booster_club'));
      expect(result).toEqual(mockForms);
    });

    test('addForm1099 should add new 1099 form', async () => {
      const mockForm = { id: 1, recipient_name: 'New Recipient', amount: '1500.00' };
      mockSql.mockResolvedValue([mockForm]);

      const formData = {
        recipient_name: 'New Recipient',
        recipient_tin: '123-45-6789',
        amount: '1500.00',
        tax_year: 2024,
        booster_club: 'Orchestra'
      };

      const result = await addForm1099(formData);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO form_1099'));
      expect(result).toEqual(mockForm);
    });

    test('updateForm1099Status should update form status', async () => {
      const mockForm = { id: 1, status: 'completed' };
      mockSql.mockResolvedValue([mockForm]);

      const result = await updateForm1099Status(1, 'completed');

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('UPDATE form_1099'));
      expect(result).toEqual(mockForm);
    });

    test('updateForm1099 should update form with provided fields', async () => {
      const mockForm = { id: 1, recipient_name: 'Updated Name', amount: '2000.00' };
      mockSql.mockResolvedValue([mockForm]);

      const updates = {
        recipient_name: 'Updated Name',
        amount: '2000.00'
      };

      const result = await updateForm1099(1, updates);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('UPDATE form_1099'));
      expect(result).toEqual(mockForm);
    });

    test('deleteForm1099 should delete form', async () => {
      mockSql.mockResolvedValue([]);

      const result = await deleteForm1099(1);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM form_1099'));
      expect(result).toEqual([]);
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

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM documents'));
      expect(result).toEqual(mockDocuments);
    });

    test('getDocuments should return all documents when no club specified', async () => {
      const mockDocuments = [
        { id: 1, filename: 'doc1.pdf', booster_club: 'Orchestra' },
        { id: 2, filename: 'doc2.pdf', booster_club: 'Band' }
      ];
      mockSql.mockResolvedValue(mockDocuments);

      const result = await getDocuments();

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM documents'));
      expect(result).toEqual(mockDocuments);
    });

    test('addDocument should add new document', async () => {
      const mockDocument = { id: 1, filename: 'new-doc.pdf', booster_club: 'Orchestra' };
      mockSql.mockResolvedValue([mockDocument]);

      const documentData = {
        filename: 'new-doc.pdf',
        original_name: 'New Document.pdf',
        booster_club: 'Orchestra',
        file_size: 1024,
        mime_type: 'application/pdf'
      };

      const result = await addDocument(documentData);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO documents'));
      expect(result).toEqual(mockDocument);
    });

    test('deleteDocument should delete document', async () => {
      mockSql.mockResolvedValue([]);

      const result = await deleteDocument(1);

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM documents'));
      expect(result).toEqual([]);
    });
  });

  describe('Database Initialization', () => {
    test('initializeDatabase should create tables', async () => {
      mockSql.mockResolvedValue([]);

      await initializeDatabase();

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS'));
    });

    test('migrateDataFromJson should migrate data from JSON file', async () => {
      const mockOfficers = [
        { name: 'John Doe', position: 'President', email: 'john@example.com' }
      ];
      mockSql.mockResolvedValue([{ id: 1 }]);

      // Mock fs.readFileSync to return JSON data
      const fs = require('fs');
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockOfficers));

      await migrateDataFromJson();

      expect(mockSql).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO officers'));
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

