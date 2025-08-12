const _request = require('supertest');
const express = require('express');

// Mock the database functions
jest.mock('../../database/neon-functions', () => ({
  getInsurance: jest.fn(),
  addInsurance: jest.fn(),
  updateInsuranceStatus: jest.fn(),
  deleteInsuranceSubmission: jest.fn(),
  getBoosterClubs: jest.fn()
}));

// Create test app
const app = express();
app.use(express.json());

// Import the insurance API handler
const handleInsuranceRequest = require('../../api/insurance');

// Mock database functions
const mockNeonFunctions = require('../../database/neon-functions');

// Mock data
const mockInsuranceData = [
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
  },
  {
    id: 2,
    event_name: 'Orchestra Performance',
    event_date: '2024-12-20',
    event_description: 'Holiday performance',
    participant_count: 30,
    submitted_by: 'orchestra_booster',
    status: 'approved',
    club_id: '123e4567-e89b-12d3-a456-426614174001',
    booster_club_name: 'Orchestra',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

const mockBoosterClubs = [
  {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Band'
  },
  {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Orchestra'
  }
];

describe('Insurance API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/insurance', () => {
    test('should return 200 with insurance forms data', async () => {
      mockNeonFunctions.getInsurance.mockResolvedValueOnce(mockInsuranceData);

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

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        submissions: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            event_name: 'Band Concert',
            booster_club_name: 'Band'
          })
        ])
      });
    });

    test('should handle database errors gracefully', async () => {
      mockNeonFunctions.getInsurance.mockRejectedValueOnce(new Error('Database error'));

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

    test('should return empty array when no submissions exist', async () => {
      mockNeonFunctions.getInsurance.mockResolvedValueOnce([]);

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

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        submissions: []
      });
    });
  });

  describe('POST /api/insurance', () => {
    test('should create new insurance submission successfully', async () => {
      const newSubmission = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const createdSubmission = {
        id: 3,
        ...newSubmission,
        submitted_by: 'admin',
        status: 'pending',
        created_at: '2024-01-03T00:00:00Z'
      };

      mockNeonFunctions.addInsurance.mockResolvedValueOnce(createdSubmission);

      const req = {
        method: 'POST',
        url: '/api/insurance',
        body: newSubmission
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      expect(mockNeonFunctions.addInsurance).toHaveBeenCalledWith({
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000',
        submittedBy: 'admin',
        status: 'pending'
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission created successfully',
        submission: createdSubmission
      });
    });

    test('should validate required fields', async () => {
      const invalidSubmission = {
        eventName: 'Test Event',
        // Missing eventDate, eventDescription, clubId
        participantCount: 25
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
        message: 'Missing required fields: eventDate, eventDescription, clubId'
      });
    });

    test('should handle database errors during creation', async () => {
      const newSubmission = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
      };

      mockNeonFunctions.addInsurance.mockRejectedValueOnce(new Error('Database error'));

      const req = {
        method: 'POST',
        url: '/api/insurance',
        body: newSubmission
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
  });

  describe('PUT /api/insurance/:id', () => {
    test('should update insurance submission status successfully', async () => {
      const updatedSubmission = {
        ...mockInsuranceData[0],
        status: 'approved',
        updated_at: '2024-01-03T00:00:00Z'
      };

      mockNeonFunctions.updateInsuranceStatus.mockResolvedValueOnce(updatedSubmission);

      const req = {
        method: 'PUT',
        url: '/api/insurance/1',
        params: { id: '1' },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      expect(mockNeonFunctions.updateInsuranceStatus).toHaveBeenCalledWith('1', 'approved');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission status updated successfully',
        submission: updatedSubmission
      });
    });

    test('should validate status field is required', async () => {
      const req = {
        method: 'PUT',
        url: '/api/insurance/1',
        params: { id: '1' },
        body: {}
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
        message: 'Status is required'
      });
    });

    test('should handle submission not found', async () => {
      mockNeonFunctions.updateInsuranceStatus.mockResolvedValueOnce(null);

      const req = {
        method: 'PUT',
        url: '/api/insurance/999',
        params: { id: '999' },
        body: { status: 'approved' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insurance submission not found'
      });
    });

    test('should handle database errors during update', async () => {
      mockNeonFunctions.updateInsuranceStatus.mockRejectedValueOnce(new Error('Database error'));

      const req = {
        method: 'PUT',
        url: '/api/insurance/1',
        params: { id: '1' },
        body: { status: 'approved' }
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
  });

  describe('DELETE /api/insurance/:id', () => {
    test('should delete insurance submission successfully', async () => {
      mockNeonFunctions.deleteInsuranceSubmission.mockResolvedValueOnce(true);

      const req = {
        method: 'DELETE',
        url: '/api/insurance/1',
        params: { id: '1' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      expect(mockNeonFunctions.deleteInsuranceSubmission).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Insurance submission deleted successfully'
      });
    });

    test('should handle submission not found for deletion', async () => {
      mockNeonFunctions.deleteInsuranceSubmission.mockResolvedValueOnce(false);

      const req = {
        method: 'DELETE',
        url: '/api/insurance/999',
        params: { id: '999' }
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn()
      };

      await handleInsuranceRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Insurance submission not found'
      });
    });

    test('should handle database errors during deletion', async () => {
      mockNeonFunctions.deleteInsuranceSubmission.mockRejectedValueOnce(new Error('Database error'));

      const req = {
        method: 'DELETE',
        url: '/api/insurance/1',
        params: { id: '1' }
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
  });

  describe('Input Validation', () => {
    test('should validate event name is not empty', async () => {
      const invalidSubmission = {
        eventName: '',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
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
        message: 'Missing required fields: eventName'
      });
    });

    test('should validate event date format', async () => {
      const invalidSubmission = {
        eventName: 'Test Event',
        eventDate: 'invalid-date',
        eventDescription: 'Test description',
        participantCount: 25,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
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
        message: 'Invalid event date format. Use YYYY-MM-DD'
      });
    });

    test('should validate participant count is positive', async () => {
      const invalidSubmission = {
        eventName: 'Test Event',
        eventDate: '2024-12-25',
        eventDescription: 'Test description',
        participantCount: -5,
        clubId: '123e4567-e89b-12d3-a456-426614174000'
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
        message: 'Participant count must be a positive number'
      });
    });
  });

  describe('Status Validation', () => {
    test('should validate status values', async () => {
      const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
      
      for (const status of validStatuses) {
        mockNeonFunctions.updateInsuranceStatus.mockResolvedValueOnce(mockInsuranceData[0]);

        const req = {
          method: 'PUT',
          url: '/api/insurance/1',
          params: { id: '1' },
          body: { status }
        };
        const res = {
          json: jest.fn(),
          status: jest.fn().mockReturnThis(),
          setHeader: jest.fn()
        };

        await handleInsuranceRequest(req, res);

        expect(mockNeonFunctions.updateInsuranceStatus).toHaveBeenCalledWith('1', status);
      }
    });

    test('should reject invalid status values', async () => {
      const req = {
        method: 'PUT',
        url: '/api/insurance/1',
        params: { id: '1' },
        body: { status: 'invalid_status' }
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
        message: 'Invalid status. Must be one of: pending, approved, rejected, completed'
      });
    });
  });
});
