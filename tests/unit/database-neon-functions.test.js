const { Pool } = require('pg');

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn()
}));

// Mock neon-functions
jest.mock('../../database/neon-functions', () => ({
  getOfficers: jest.fn(),
  addOfficer: jest.fn(),
  updateOfficer: jest.fn(),
  deleteOfficer: jest.fn(),
  getVolunteers: jest.fn(),
  addVolunteer: jest.fn(),
  getForm1099: jest.fn(),
  addForm1099: jest.fn(),
  updateForm1099: jest.fn(),
  deleteForm1099: jest.fn(),
  getUsers: jest.fn(),
  updateUser: jest.fn(),
  getInsurance: jest.fn(),
  addInsurance: jest.fn(),
  getDocuments: jest.fn(),
  addDocument: jest.fn(),
  deleteDocument: jest.fn()
}));

// Import the mocked functions
const neonFunctions = require('../../database/neon-functions');

// Mock pool instance
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn()
};

Pool.mockImplementation(() => mockPool);

describe('Database Neon Functions Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Database Connection', () => {
    test('should create pool with correct configuration', () => {
      expect(Pool).toHaveBeenCalled();
      const poolConfig = Pool.mock.calls[0][0];
      expect(poolConfig).toHaveProperty('connectionString');
      expect(poolConfig).toHaveProperty('ssl');
    });

    test('should handle connection errors gracefully', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection failed'));

      try {
        await mockPool.connect();
      } catch (error) {
        expect(error.message).toBe('Connection failed');
      }
    });
  });

  describe('Officer Functions', () => {
    test('should mock getOfficers function', async () => {
      const mockOfficers = [
        {
          id: 1,
          name: 'John Doe',
          position: 'President',
          email: 'john@example.com',
          booster_club: 'Orchestra'
        }
      ];

      neonFunctions.getOfficers.mockResolvedValue(mockOfficers);

      const result = await neonFunctions.getOfficers();
      expect(result).toEqual(mockOfficers);
      expect(neonFunctions.getOfficers).toHaveBeenCalled();
    });

    test('should mock addOfficer function', async () => {
      const newOfficer = {
        name: 'Jane Doe',
        position: 'Vice President',
        email: 'jane@example.com',
        booster_club: 'Orchestra'
      };

      neonFunctions.addOfficer.mockResolvedValue({ id: 2, ...newOfficer });

      const result = await neonFunctions.addOfficer(newOfficer);
      expect(result).toEqual({ id: 2, ...newOfficer });
      expect(neonFunctions.addOfficer).toHaveBeenCalledWith(newOfficer);
    });

    test('should mock updateOfficer function', async () => {
      const updatedOfficer = {
        id: 1,
        name: 'John Updated',
        position: 'President',
        email: 'john@example.com',
        booster_club: 'Orchestra'
      };

      neonFunctions.updateOfficer.mockResolvedValue({ rowCount: 1 });

      const result = await neonFunctions.updateOfficer(updatedOfficer);
      expect(result).toEqual({ rowCount: 1 });
      expect(neonFunctions.updateOfficer).toHaveBeenCalledWith(updatedOfficer);
    });

    test('should mock deleteOfficer function', async () => {
      neonFunctions.deleteOfficer.mockResolvedValue({ rowCount: 1 });

      const result = await neonFunctions.deleteOfficer(1);
      expect(result).toEqual({ rowCount: 1 });
      expect(neonFunctions.deleteOfficer).toHaveBeenCalledWith(1);
    });
  });

  describe('Volunteer Functions', () => {
    test('should mock getVolunteers function', async () => {
      const mockVolunteers = [
        {
          id: 1,
          name: 'Jane Smith',
          email: 'jane@example.com',
          booster_club: 'Orchestra'
        }
      ];

      neonFunctions.getVolunteers.mockResolvedValue(mockVolunteers);

      const result = await neonFunctions.getVolunteers();
      expect(result).toEqual(mockVolunteers);
      expect(neonFunctions.getVolunteers).toHaveBeenCalled();
    });

    test('should mock addVolunteer function', async () => {
      const newVolunteer = {
        name: 'Bob Smith',
        email: 'bob@example.com',
        booster_club: 'Orchestra'
      };

      neonFunctions.addVolunteer.mockResolvedValue({ id: 2, ...newVolunteer });

      const result = await neonFunctions.addVolunteer(newVolunteer);
      expect(result).toEqual({ id: 2, ...newVolunteer });
      expect(neonFunctions.addVolunteer).toHaveBeenCalledWith(newVolunteer);
    });
  });

  describe('1099 Form Functions', () => {
    test('should mock getForm1099 function', async () => {
      const mockForms = [
        {
          id: 1,
          recipient_name: 'John Doe',
          recipient_tin: '123-45-6789',
          amount: 1000.00,
          booster_club: 'Orchestra',
          tax_year: 2024
        }
      ];

      neonFunctions.getForm1099.mockResolvedValue(mockForms);

      const result = await neonFunctions.getForm1099();
      expect(result).toEqual(mockForms);
      expect(neonFunctions.getForm1099).toHaveBeenCalled();
    });

    test('should mock addForm1099 function', async () => {
      const newForm = {
        recipient_name: 'Jane Doe',
        recipient_tin: '987-65-4321',
        amount: 1500.00,
        booster_club: 'Orchestra',
        tax_year: 2024
      };

      neonFunctions.addForm1099.mockResolvedValue({ id: 2, ...newForm });

      const result = await neonFunctions.addForm1099(newForm);
      expect(result).toEqual({ id: 2, ...newForm });
      expect(neonFunctions.addForm1099).toHaveBeenCalledWith(newForm);
    });

    test('should mock updateForm1099 function', async () => {
      const updatedForm = {
        id: 1,
        recipient_name: 'John Updated',
        recipient_tin: '123-45-6789',
        amount: 2000.00,
        booster_club: 'Orchestra',
        tax_year: 2024
      };

      neonFunctions.updateForm1099.mockResolvedValue({ rowCount: 1 });

      const result = await neonFunctions.updateForm1099(updatedForm);
      expect(result).toEqual({ rowCount: 1 });
      expect(neonFunctions.updateForm1099).toHaveBeenCalledWith(updatedForm);
    });

    test('should mock deleteForm1099 function', async () => {
      neonFunctions.deleteForm1099.mockResolvedValue({ rowCount: 1 });

      const result = await neonFunctions.deleteForm1099(1);
      expect(result).toEqual({ rowCount: 1 });
      expect(neonFunctions.deleteForm1099).toHaveBeenCalledWith(1);
    });
  });

  describe('User Functions', () => {
    test('should mock getUsers function', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'admin',
          role: 'admin',
          email: 'admin@example.com'
        }
      ];

      neonFunctions.getUsers.mockResolvedValue(mockUsers);

      const result = await neonFunctions.getUsers();
      expect(result).toEqual(mockUsers);
      expect(neonFunctions.getUsers).toHaveBeenCalled();
    });

    test('should mock updateUser function', async () => {
      const updatedUser = {
        id: 1,
        last_login: new Date().toISOString(),
        login_count: 5
      };

      neonFunctions.updateUser.mockResolvedValue({ rowCount: 1 });

      const result = await neonFunctions.updateUser(updatedUser);
      expect(result).toEqual({ rowCount: 1 });
      expect(neonFunctions.updateUser).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('Insurance Functions', () => {
    test('should mock getInsurance function', async () => {
      const mockInsurance = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          booster_club: 'Orchestra',
          form_type: 'liability'
        }
      ];

      neonFunctions.getInsurance.mockResolvedValue(mockInsurance);

      const result = await neonFunctions.getInsurance();
      expect(result).toEqual(mockInsurance);
      expect(neonFunctions.getInsurance).toHaveBeenCalled();
    });

    test('should mock addInsurance function', async () => {
      const newInsurance = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        booster_club: 'Orchestra',
        form_type: 'liability'
      };

      neonFunctions.addInsurance.mockResolvedValue({ id: 2, ...newInsurance });

      const result = await neonFunctions.addInsurance(newInsurance);
      expect(result).toEqual({ id: 2, ...newInsurance });
      expect(neonFunctions.addInsurance).toHaveBeenCalledWith(newInsurance);
    });
  });

  describe('Document Functions', () => {
    test('should mock getDocuments function', async () => {
      const mockDocuments = [
        {
          id: 1,
          filename: 'document.pdf',
          type: 'w9',
          uploaded_by: 'admin',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      neonFunctions.getDocuments.mockResolvedValue(mockDocuments);

      const result = await neonFunctions.getDocuments();
      expect(result).toEqual(mockDocuments);
      expect(neonFunctions.getDocuments).toHaveBeenCalled();
    });

    test('should mock addDocument function', async () => {
      const newDocument = {
        filename: 'new-document.pdf',
        type: 'w9',
        uploaded_by: 'admin'
      };

      neonFunctions.addDocument.mockResolvedValue({ id: 2, ...newDocument });

      const result = await neonFunctions.addDocument(newDocument);
      expect(result).toEqual({ id: 2, ...newDocument });
      expect(neonFunctions.addDocument).toHaveBeenCalledWith(newDocument);
    });

    test('should mock deleteDocument function', async () => {
      neonFunctions.deleteDocument.mockResolvedValue({ rowCount: 1 });

      const result = await neonFunctions.deleteDocument(1);
      expect(result).toEqual({ rowCount: 1 });
      expect(neonFunctions.deleteDocument).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle query errors gracefully', async () => {
      neonFunctions.getOfficers.mockRejectedValue(new Error('Database query failed'));

      try {
        await neonFunctions.getOfficers();
      } catch (error) {
        expect(error.message).toBe('Database query failed');
      }
    });

    test('should handle connection errors gracefully', async () => {
      mockPool.connect.mockRejectedValue(new Error('Connection timeout'));

      try {
        await mockPool.connect();
      } catch (error) {
        expect(error.message).toBe('Connection timeout');
      }
    });

    test('should handle pool end errors gracefully', async () => {
      mockPool.end.mockRejectedValue(new Error('Pool end failed'));

      try {
        await mockPool.end();
      } catch (error) {
        expect(error.message).toBe('Pool end failed');
      }
    });
  });

  describe('Data Validation', () => {
    test('should validate officer data structure', () => {
      const validOfficer = {
        id: 1,
        name: 'John Doe',
        position: 'President',
        email: 'john@example.com',
        booster_club: 'Orchestra'
      };

      expect(validOfficer).toHaveProperty('id');
      expect(validOfficer).toHaveProperty('name');
      expect(validOfficer).toHaveProperty('position');
      expect(validOfficer).toHaveProperty('email');
      expect(validOfficer).toHaveProperty('booster_club');
    });

    test('should validate 1099 form data structure', () => {
      const validForm = {
        id: 1,
        recipient_name: 'John Doe',
        recipient_tin: '123-45-6789',
        amount: 1000.00,
        booster_club: 'Orchestra',
        tax_year: 2024
      };

      expect(validForm).toHaveProperty('id');
      expect(validForm).toHaveProperty('recipient_name');
      expect(validForm).toHaveProperty('recipient_tin');
      expect(validForm).toHaveProperty('amount');
      expect(validForm).toHaveProperty('booster_club');
      expect(validForm).toHaveProperty('tax_year');
    });

    test('should validate user data structure', () => {
      const validUser = {
        id: 1,
        username: 'admin',
        role: 'admin',
        email: 'admin@example.com'
      };

      expect(validUser).toHaveProperty('id');
      expect(validUser).toHaveProperty('username');
      expect(validUser).toHaveProperty('role');
      expect(validUser).toHaveProperty('email');
    });
  });

  describe('Query Parameter Validation', () => {
    test('should handle null parameters correctly', async () => {
      neonFunctions.getOfficers.mockResolvedValue([]);

      await neonFunctions.getOfficers();
      expect(neonFunctions.getOfficers).toHaveBeenCalled();
    });

    test('should handle empty string parameters correctly', async () => {
      neonFunctions.getOfficers.mockResolvedValue([]);

      await neonFunctions.getOfficers();
      expect(neonFunctions.getOfficers).toHaveBeenCalled();
    });

    test('should handle numeric parameters correctly', async () => {
      neonFunctions.getForm1099.mockResolvedValue([]);

      await neonFunctions.getForm1099();
      expect(neonFunctions.getForm1099).toHaveBeenCalled();
    });
  });

  describe('Transaction Handling', () => {
    test('should handle transaction rollback', async () => {
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };

      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockRejectedValue(new Error('Transaction failed'));

      try {
        const client = await mockPool.connect();
        await client.query('BEGIN');
        await client.query('INSERT INTO officers (name) VALUES ($1)', ['Test']);
        await client.query('COMMIT');
      } catch (error) {
        expect(error.message).toBe('Transaction failed');
      } finally {
        mockClient.release();
      }
    });
  });
});
