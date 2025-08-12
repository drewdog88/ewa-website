const { neon } = require('@neondatabase/serverless');

// Mock the neon module
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn()
}));

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

// Import the actual functions (they will use the mocked neon)
const {
  getInsurance,
  addInsurance,
  updateInsuranceStatus,
  deleteInsuranceSubmission
} = require('../../database/neon-functions');

// Mock SQL instance
const mockSql = jest.fn();

describe('Insurance Database Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    neon.mockReturnValue(mockSql);
  });

  describe('getInsurance', () => {
    test('should return insurance forms with booster club names', async () => {
      const mockData = [
        {
          id: 1,
          event_name: 'Band Concert',
          event_date: '2024-12-15',
          event_description: 'Annual winter concert',
          participant_count: 50,
          submitted_by: 'admin',
          status: 'pending',
          club_id: '123e4567-e89b-12d3-a456-426614174000',
          booster_club_name: 'Band',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockSql.mockResolvedValueOnce(mockData);

      const result = await getInsurance();

      expect(mockSql).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    test('should handle database errors gracefully', async () => {
      const error = new Error('Database connection failed');
      mockSql.mockRejectedValueOnce(error);

      const result = await getInsurance();
      expect(result).toEqual([]);
    });

    test('should return empty array when no data exists', async () => {
      mockSql.mockResolvedValueOnce([]);

      const result = await getInsurance();

      expect(result).toEqual([]);
    });
  });

  describe('addInsurance', () => {
    test('should insert new insurance form successfully', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        submittedBy: 'admin',
        status: 'pending',
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const insertedData = {
        id: 1,
        event_name: 'Test Event',
        event_date: '2024-12-25',
        event_description: 'Test description',
        participant_count: 25,
        submitted_by: 'admin',
        status: 'pending',
        club_id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSql.mockResolvedValueOnce([insertedData]);

      const result = await addInsurance(formData);

      expect(mockSql).toHaveBeenCalled();
      expect(result).toEqual(insertedData);
    });

    test('should handle null clubId', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        submittedBy: 'admin',
        status: 'pending',
        clubId: null
      };

      const insertedData = {
        id: 1,
        event_name: 'Test Event',
        event_date: '2024-12-25',
        event_description: 'Test description',
        participant_count: 25,
        submitted_by: 'admin',
        status: 'pending',
        club_id: null,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSql.mockResolvedValueOnce([insertedData]);

      const result = await addInsurance(formData);

      expect(mockSql).toHaveBeenCalled();
      expect(result).toEqual(insertedData);
    });

    test('should handle database errors during insertion', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        submittedBy: 'admin',
        status: 'pending',
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const error = new Error('Foreign key constraint violation');
      mockSql.mockRejectedValueOnce(error);

      await expect(addInsurance(formData)).rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('updateInsuranceStatus', () => {
    test('should update insurance status successfully', async () => {
      const id = '1';
      const status = 'approved';

      const updatedData = {
        id: 1,
        event_name: 'Test Event',
        event_date: '2024-12-25',
        event_description: 'Test description',
        participant_count: 25,
        submitted_by: 'admin',
        status: 'approved',
        club_id: '123e4567-e89b-12d3-a456-426614174000',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      };

      mockSql.mockResolvedValueOnce([updatedData]);

      const result = await updateInsuranceStatus(id, status);

      expect(mockSql).toHaveBeenCalled();
      expect(result).toEqual(updatedData);
    });

    test('should return null when submission not found', async () => {
      const id = '999';
      const status = 'approved';

      mockSql.mockResolvedValueOnce([]);

      const result = await updateInsuranceStatus(id, status);

      expect(result).toBeUndefined();
    });

    test('should handle database errors during update', async () => {
      const id = '1';
      const status = 'approved';

      const error = new Error('Database error');
      mockSql.mockRejectedValueOnce(error);

      await expect(updateInsuranceStatus(id, status)).rejects.toThrow('Database error');
    });
  });

  describe('deleteInsuranceSubmission', () => {
    test('should delete insurance submission successfully', async () => {
      const id = '1';

      const deletedData = {
        id: 1,
        event_name: 'Test Event',
        event_date: '2024-12-25',
        event_description: 'Test description',
        participant_count: 25,
        submitted_by: 'admin',
        status: 'pending',
        club_id: '123e4567-e89b-12d3-a456-426614174000'
      };

      mockSql.mockResolvedValueOnce([deletedData]);

      const result = await deleteInsuranceSubmission(id);

      expect(mockSql).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false when submission not found', async () => {
      const id = '999';

      mockSql.mockResolvedValueOnce([]);

      const result = await deleteInsuranceSubmission(id);

      expect(result).toBe(false);
    });

    test('should handle database errors during deletion', async () => {
      const id = '1';

      const error = new Error('Database error');
      mockSql.mockRejectedValueOnce(error);

      await expect(deleteInsuranceSubmission(id)).rejects.toThrow('Database error');
    });
  });

  describe('SQL Query Validation', () => {
    test('getInsurance should call database function', async () => {
      mockSql.mockResolvedValueOnce([]);

      await getInsurance();

      expect(mockSql).toHaveBeenCalled();
    });

    test('addInsurance should call database function', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        submittedBy: 'admin',
        status: 'pending',
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      mockSql.mockResolvedValueOnce([{}]);

      await addInsurance(formData);

      expect(mockSql).toHaveBeenCalled();
    });

    test('updateInsuranceStatus should call database function', async () => {
      mockSql.mockResolvedValueOnce([{}]);

      await updateInsuranceStatus('1', 'approved');

      expect(mockSql).toHaveBeenCalled();
    });

    test('deleteInsuranceSubmission should call database function', async () => {
      mockSql.mockResolvedValueOnce([{}]);

      await deleteInsuranceSubmission('1');

      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle connection failures gracefully', async () => {
      neon.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await getInsurance();
      expect(result).toBeUndefined();
    });

    test('should handle SQL syntax errors', async () => {
      const error = new Error('syntax error at or near "INVALID"');
      mockSql.mockRejectedValueOnce(error);

      const result = await getInsurance();
      expect(result).toEqual([]);
    });

    test('should handle foreign key constraint violations', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        submittedBy: 'admin',
        status: 'pending',
        clubId: 'invalid-uuid'
      };

      const error = new Error('insert or update on table "insurance_forms" violates foreign key constraint');
      mockSql.mockRejectedValueOnce(error);

      await expect(addInsurance(formData)).rejects.toThrow('foreign key constraint');
    });
  });

  describe('Data Type Handling', () => {
    test('should handle numeric participant count', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 0,
        submittedBy: 'admin',
        status: 'pending',
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      mockSql.mockResolvedValueOnce([{}]);

      await addInsurance(formData);

      expect(mockSql).toHaveBeenCalled();
    });

    test('should handle string participant count', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: '25',
        submittedBy: 'admin',
        status: 'pending',
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      mockSql.mockResolvedValueOnce([{}]);

      await addInsurance(formData);

      expect(mockSql).toHaveBeenCalled();
    });

    test('should handle UUID format for club_id', async () => {
      const formData = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        submittedBy: 'admin',
        status: 'pending',
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      mockSql.mockResolvedValueOnce([{}]);

      await addInsurance(formData);

      expect(mockSql).toHaveBeenCalled();
    });
  });
});
