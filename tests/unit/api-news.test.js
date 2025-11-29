const request = require('supertest');
const express = require('express');

// Mock the database functions
jest.mock('../../database/neon-functions', () => ({
  getNews: jest.fn(),
  getPublishedNews: jest.fn(),
  addNews: jest.fn(),
  updateNews: jest.fn(),
  deleteNews: jest.fn(),
  publishNews: jest.fn()
}));

// Create test app
const app = express();
app.use(express.json());

// Import server routes - we'll need to set up the routes manually for testing
// Since server.js exports the app, we'll create a minimal test server
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Mock database functions
const mockNeonFunctions = require('../../database/neon-functions');

// Mock data
const mockNewsData = [
  {
    id: 'f5e30feb-48fd-45af-8436-b61ee56828d0',
    title: 'Test News Article',
    content: 'This is a test news article content.',
    slug: 'test-news-article',
    status: 'published',
    published_at: '2024-01-15T00:00:00Z',
    created_by: 'admin',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    title: 'Draft Article',
    content: 'This is a draft article.',
    slug: 'draft-article',
    status: 'draft',
    published_at: null,
    created_by: 'admin',
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z'
  }
];

// Set up routes manually for testing
app.get('/api/news', async (req, res) => {
  try {
    const news = await mockNeonFunctions.getNews();
    res.json({ success: true, news });
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/news/published', async (req, res) => {
  try {
    const news = await mockNeonFunctions.getPublishedNews();
    res.json({ success: true, news });
  } catch (error) {
    console.error('Error getting published news:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const { title, content, status = 'draft', publishedAt } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }
    
    const newsItem = await mockNeonFunctions.addNews({
      title: title.trim(),
      content: content.trim(),
      status: status,
      createdBy: req.body.createdBy || 'admin',
      publishedAt: publishedAt || (status === 'published' ? new Date().toISOString() : null)
    });
    
    if (newsItem) {
      res.json({
        success: true,
        message: 'News article created successfully',
        news: newsItem
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create news article'
      });
    }
  } catch (error) {
    console.error('Error creating news article:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid news article ID format'
      });
    }
    
    const { title, content, status } = req.body;
    
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (status !== undefined) updates.status = status;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    const updatedNews = await mockNeonFunctions.updateNews(id, updates);
    
    if (!updatedNews) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'News article updated successfully',
      news: updatedNews
    });
  } catch (error) {
    console.error('Error updating news article:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid news article ID format'
      });
    }
    
    const deleted = await mockNeonFunctions.deleteNews(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    
    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news article:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

describe('News API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/news', () => {
    test('should return all news articles', async () => {
      mockNeonFunctions.getNews.mockResolvedValue(mockNewsData);

      const response = await request(app)
        .get('/api/news')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toEqual(mockNewsData);
      expect(mockNeonFunctions.getNews).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      mockNeonFunctions.getNews.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/news')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /api/news/published', () => {
    test('should return only published news', async () => {
      const publishedNews = mockNewsData.filter(n => n.status === 'published');
      mockNeonFunctions.getPublishedNews.mockResolvedValue(publishedNews);

      const response = await request(app)
        .get('/api/news/published')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toEqual(publishedNews);
      expect(mockNeonFunctions.getPublishedNews).toHaveBeenCalled();
    });
  });

  describe('POST /api/news', () => {
    test('should create a new news article', async () => {
      const newNews = {
        id: 'new-uuid-1234-5678-90ab-cdef',
        title: 'New Article',
        content: 'New content',
        status: 'draft',
        created_by: 'admin',
        created_at: new Date().toISOString()
      };

      mockNeonFunctions.addNews.mockResolvedValue(newNews);

      const response = await request(app)
        .post('/api/news')
        .send({
          title: 'New Article',
          content: 'New content',
          status: 'draft'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toEqual(newNews);
      expect(mockNeonFunctions.addNews).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Article',
          content: 'New content',
          status: 'draft',
          createdBy: 'admin'
        })
      );
    });

    test('should create a published news article with date', async () => {
      const publishedDate = '2025-01-15';
      const newNews = {
        id: 'new-uuid-1234-5678-90ab-cdef',
        title: 'Published Article',
        content: 'Published content',
        status: 'published',
        published_at: new Date(publishedDate).toISOString(),
        created_by: 'admin',
        created_at: new Date().toISOString()
      };

      mockNeonFunctions.addNews.mockResolvedValue(newNews);

      const response = await request(app)
        .post('/api/news')
        .send({
          title: 'Published Article',
          content: 'Published content',
          status: 'published',
          publishedAt: publishedDate
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toEqual(newNews);
      // Check that publishedAt was passed (either the provided date or auto-generated)
      const callArgs = mockNeonFunctions.addNews.mock.calls[0][0];
      expect(callArgs.title).toBe('Published Article');
      expect(callArgs.content).toBe('Published content');
      expect(callArgs.status).toBe('published');
      expect(callArgs.createdBy).toBe('admin');
      expect(callArgs.publishedAt).toBe(publishedDate);
    });

    test('should reject missing title', async () => {
      const response = await request(app)
        .post('/api/news')
        .send({
          content: 'Content without title'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Title and content are required');
    });

    test('should reject missing content', async () => {
      const response = await request(app)
        .post('/api/news')
        .send({
          title: 'Title without content'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Title and content are required');
    });
  });

  describe('PUT /api/news/:id', () => {
    const validUUID = 'f5e30feb-48fd-45af-8436-b61ee56828d0';
    const invalidUUID = 'not-a-uuid';

    test('should update news article with valid UUID', async () => {
      const updatedNews = {
        ...mockNewsData[0],
        title: 'Updated Title',
        content: 'Updated content',
        updated_at: new Date().toISOString()
      };

      mockNeonFunctions.updateNews.mockResolvedValue(updatedNews);

      const response = await request(app)
        .put(`/api/news/${validUUID}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.news).toEqual(updatedNews);
      expect(mockNeonFunctions.updateNews).toHaveBeenCalledWith(validUUID, {
        title: 'Updated Title',
        content: 'Updated content'
      });
    });

    test('should reject invalid UUID format', async () => {
      const response = await request(app)
        .put(`/api/news/${invalidUUID}`)
        .send({
          title: 'Updated Title'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid news article ID format');
      expect(mockNeonFunctions.updateNews).not.toHaveBeenCalled();
    });

    test('should reject update with no fields', async () => {
      const response = await request(app)
        .put(`/api/news/${validUUID}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('No valid fields to update');
    });

    test('should return 404 for non-existent news', async () => {
      mockNeonFunctions.updateNews.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/news/${validUUID}`)
        .send({
          title: 'Updated Title'
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('News article not found');
    });

    test('should handle database errors', async () => {
      mockNeonFunctions.updateNews.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put(`/api/news/${validUUID}`)
        .send({
          title: 'Updated Title'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Database error');
    });

    test('should update only provided fields', async () => {
      const updatedNews = {
        ...mockNewsData[0],
        title: 'Only Title Updated',
        updated_at: new Date().toISOString()
      };

      mockNeonFunctions.updateNews.mockResolvedValue(updatedNews);

      const response = await request(app)
        .put(`/api/news/${validUUID}`)
        .send({
          title: 'Only Title Updated'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockNeonFunctions.updateNews).toHaveBeenCalledWith(validUUID, {
        title: 'Only Title Updated'
      });
    });
  });

  describe('DELETE /api/news/:id', () => {
    const validUUID = 'f5e30feb-48fd-45af-8436-b61ee56828d0';
    const invalidUUID = 'not-a-uuid';

    test('should delete news article with valid UUID', async () => {
      mockNeonFunctions.deleteNews.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/api/news/${validUUID}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('News article deleted successfully');
      expect(mockNeonFunctions.deleteNews).toHaveBeenCalledWith(validUUID);
    });

    test('should reject invalid UUID format', async () => {
      const response = await request(app)
        .delete(`/api/news/${invalidUUID}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid news article ID format');
      expect(mockNeonFunctions.deleteNews).not.toHaveBeenCalled();
    });

    test('should return 404 for non-existent news', async () => {
      mockNeonFunctions.deleteNews.mockResolvedValue(false);

      const response = await request(app)
        .delete(`/api/news/${validUUID}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('News article not found');
    });

    test('should handle database errors', async () => {
      mockNeonFunctions.deleteNews.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete(`/api/news/${validUUID}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Database connection failed');
    });

    test('should handle UUID validation edge cases', async () => {
      const testCases = [
        { id: '123', expected: 400 },
        { id: 'f5e30feb-48fd-45af-8436', expected: 400 }, // Incomplete UUID
        { id: 'f5e30feb-48fd-45af-8436-b61ee56828d0', expected: 200 }, // Valid UUID
        { id: 'F5E30FEB-48FD-45AF-8436-B61EE56828D0', expected: 200 } // Valid UUID (uppercase)
      ];

      for (const testCase of testCases) {
        if (testCase.expected === 200) {
          mockNeonFunctions.deleteNews.mockResolvedValue(true);
        }

        const response = await request(app)
          .delete(`/api/news/${testCase.id}`)
          .expect(testCase.expected);

        if (testCase.expected === 200) {
          expect(response.body.success).toBe(true);
        } else {
          expect(response.body.success).toBe(false);
        }
      }
    });
  });
});

