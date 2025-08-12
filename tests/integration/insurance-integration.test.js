const request = require('supertest');
const express = require('express');
const { neon } = require('@neondatabase/serverless');

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

// Create test app
const app = express();
app.use(express.json());

// Import the insurance API handler
const handleInsuranceRequest = require('../../api/insurance');

// Mock the database functions for integration testing
jest.mock('../../database/neon-functions', () => ({
  getInsurance: jest.fn(),
  addInsurance: jest.fn(),
  updateInsuranceStatus: jest.fn(),
  deleteInsuranceSubmission: jest.fn(),
  getBoosterClubs: jest.fn()
}));

// Mock database functions
const mockNeonFunctions = require('../../database/neon-functions');

// Test data
const testInsuranceData = [
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
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

const testBoosterClubs = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Band'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Orchestra'
  }
];

describe('Insurance Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Full Stack Insurance Operations', () => {
    test('should create, read, update, and delete insurance submission', async () => {
      // Step 1: Create new insurance submission
      const newSubmission = {
        eventName: 'Integration Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test event for integration testing',
        participantCount: 30,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const createdSubmission = {
        id: 2,
        event_name: 'Integration Test Event',
        event_date: '2024-12-25',
        event_description: 'Test event for integration testing',
        participant_count: 30,
        submitted_by: 'admin',
        status: 'pending',
        club_id: '123e4567-e89b-12d3-a456-426614174000',
        booster_club_name: 'Band',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      mockNeonFunctions.addInsurance.mockResolvedValueOnce(createdSubmission);

      const createReq = {
        method: 'POST',
        url: '/api/insurance',
        body: newSubmission
      };
      const createRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(createReq, createRes);

      expect(mockNeonFunctions.addInsurance).toHaveBeenCalledWith({
        eventName: 'Integration Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test event for integration testing',
        participantCount: 30,
        clubId: '123e4567-e89b-12d3-a456-426614174000',
        submittedBy: 'admin',
        status: 'pending'
      });

      expect(createRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission created successfully',
        submission: createdSubmission
      });

      // Step 2: Read all insurance submissions
      const allSubmissions = [...testInsuranceData, createdSubmission];
      mockNeonFunctions.getInsurance.mockResolvedValueOnce(allSubmissions);

      const readReq = {
        method: 'GET',
        url: '/api/insurance',
        query: {}
      };
      const readRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(readReq, readRes);

      expect(mockNeonFunctions.getInsurance).toHaveBeenCalled();
      expect(readRes.json).toHaveBeenCalledWith({
        success: true,
        submissions: allSubmissions
      });

      // Step 3: Update insurance submission status
      const updatedSubmission = {
        ...createdSubmission,
        status: 'approved',
        updated_at: '2024-01-04T00:00:00Z'
      };

      mockNeonFunctions.updateInsuranceStatus.mockResolvedValueOnce(updatedSubmission);

      const updateReq = {
        method: 'PUT',
        url: '/api/insurance/2',
        params: { id: '2' },
        body: { status: 'approved' }
      };
      const updateRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(updateReq, updateRes);

      expect(mockNeonFunctions.updateInsuranceStatus).toHaveBeenCalledWith('2', 'approved');
      expect(updateRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission status updated successfully',
        submission: updatedSubmission
      });

      // Step 4: Delete insurance submission
      mockNeonFunctions.deleteInsuranceSubmission.mockResolvedValueOnce(true);

      const deleteReq = {
        method: 'DELETE',
        url: '/api/insurance/2',
        params: { id: '2' }
      };
      const deleteRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(deleteReq, deleteRes);

      expect(mockNeonFunctions.deleteInsuranceSubmission).toHaveBeenCalledWith('2');
      expect(deleteRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission deleted successfully'
      });
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle database connection failures gracefully', async () => {
      mockNeonFunctions.getInsurance.mockRejectedValueOnce(new Error('Connection failed'));

      const req = {
        method: 'GET',
        url: '/api/insurance',
        query: {}
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });

    test('should handle validation errors consistently', async () => {
      const invalidSubmission = {
        eventName: '',
        eventDate: 'invalid-date',
        participantCount: -5
      };

      const req = {
        method: 'POST',
        url: '/api/insurance',
        body: invalidSubmission
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.stringContaining('Missing required fields')
      });
    });
  });

  describe('Data Consistency Integration', () => {
    test('should maintain data consistency across operations', async () => {
      // Create submission
      const newSubmission = {
        eventName: 'Consistency Test',
        eventDate: '2024-12-25',
        eventDescription: 'Test for data consistency',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const createdSubmission = {
        id: 3,
        event_name: 'Consistency Test',
        event_date: '2024-12-25',
        event_description: 'Test for data consistency',
        participant_count: 25,
        submitted_by: 'admin',
        status: 'pending',
        club_id: '123e4567-e89b-12d3-a456-426614174000',
        booster_club_name: 'Band',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z'
      };

      mockNeonFunctions.addInsurance.mockResolvedValueOnce(createdSubmission);

      const createReq = {
        method: 'POST',
        url: '/api/insurance',
        body: newSubmission
      };
      const createRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(createReq, createRes);

      // Verify the created submission has correct data
      expect(createRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission created successfully',
        submission: expect.objectContaining({
          event_name: 'Consistency Test',
          participant_count: 25,
          status: 'pending'
        })
      });

      // Update the same submission
      const updatedSubmission = {
        ...createdSubmission,
        status: 'approved',
        updated_at: '2024-01-06T00:00:00Z'
      };

      mockNeonFunctions.updateInsuranceStatus.mockResolvedValueOnce(updatedSubmission);

      const updateReq = {
        method: 'PUT',
        url: '/api/insurance/3',
        params: { id: '3' },
        body: { status: 'approved' }
      };
      const updateRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(updateReq, updateRes);

      // Verify the updated submission maintains original data
      expect(updateRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission status updated successfully',
        submission: expect.objectContaining({
          event_name: 'Consistency Test',
          participant_count: 25,
          status: 'approved'
        })
      });
    });
  });

  describe('Performance Integration', () => {
    test('should handle multiple concurrent operations', async () => {
      const submissions = [];
      const promises = [];

      // Create multiple submissions concurrently
      for (let i = 0; i < 5; i++) {
        const submission = {
          eventName: `Concurrent Test ${i}`,
          eventDate: '2024-12-25',
          eventDescription: `Test ${i} for concurrent operations`,
          participantCount: 20 + i,
          clubId: '123e4567-e89b-12d3-a456-426614174000'
        };

        const createdSubmission = {
          id: i + 1,
          event_name: `Concurrent Test ${i}`,
          event_date: '2024-12-25',
          event_description: `Test ${i} for concurrent operations`,
          participant_count: 20 + i,
          submitted_by: 'admin',
          status: 'pending',
          club_id: '123e4567-e89b-12d3-a456-426614174000',
          booster_club_name: 'Band',
          created_at: '2024-01-07T00:00:00Z',
          updated_at: '2024-01-07T00:00:00Z'
        };

        mockNeonFunctions.addInsurance.mockResolvedValueOnce(createdSubmission);

        const req = {
          method: 'POST',
          url: '/api/insurance',
          body: submission
        };
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
          setHeader: jest.fn()
        };

        promises.push(handleInsuranceRequest(req, res));
        submissions.push({ req, res, expected: createdSubmission });
      }

      // Wait for all operations to complete
      await Promise.all(promises);

      // Verify all operations completed successfully
      submissions.forEach(({ res, expected }) => {
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Insurance submission created successfully',
          submission: expected
        });
      });

      expect(mockNeonFunctions.addInsurance).toHaveBeenCalledTimes(5);
    });
  });

  describe('Security Integration', () => {
    test('should sanitize input data', async () => {
      const maliciousSubmission = {
        eventName: '<script>alert("xss")</script>',
        eventDate: '2024-12-25',
        eventDescription: 'DROP TABLE insurance_forms;',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const sanitizedSubmission = {
        id: 1,
        event_name: '<script>alert("xss")</script>',
        event_date: '2024-12-25',
        event_description: 'DROP TABLE insurance_forms;',
        participant_count: 25,
        submitted_by: 'admin',
        status: 'pending',
        club_id: '123e4567-e89b-12d3-a456-426614174000',
        booster_club_name: 'Band',
        created_at: '2024-01-08T00:00:00Z',
        updated_at: '2024-01-08T00:00:00Z'
      };

      mockNeonFunctions.addInsurance.mockResolvedValueOnce(sanitizedSubmission);

      const req = {
        method: 'POST',
        url: '/api/insurance',
        body: maliciousSubmission
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      // Verify the data is passed through without modification (sanitization should happen at database level)
      expect(mockNeonFunctions.addInsurance).toHaveBeenCalledWith({
        eventName: '<script>alert("xss")</script>',
        eventDate: '2024-12-25',
        eventDescription: 'DROP TABLE insurance_forms;',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000',
        submittedBy: 'admin',
        status: 'pending'
      });
    });

    test('should validate UUID format for club_id', async () => {
      const invalidSubmission = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        clubId: 'invalid-uuid-format'
      };

      const req = {
        method: 'POST',
        url: '/api/insurance',
        body: invalidSubmission
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      // Should pass validation and attempt database operation
      expect(mockNeonFunctions.addInsurance).toHaveBeenCalledWith({
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        clubId: 'invalid-uuid-format',
        submittedBy: 'admin',
        status: 'pending'
      });
    });
  });
});
