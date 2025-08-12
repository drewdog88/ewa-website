const { getInsurance, addInsurance, updateInsuranceStatus, deleteInsuranceSubmission } = require('../database/neon-functions');

// Validation helper functions
function validateInsuranceSubmission(data) {
  const requiredFields = ['eventName', 'eventDate', 'eventDescription', 'clubId'];
  const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '');
  
  if (missingFields.length > 0) {
    return {
      isValid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate event date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.eventDate)) {
    return {
      isValid: false,
      message: 'Invalid event date format. Use YYYY-MM-DD'
    };
  }

  // Validate participant count
  if (data.participantCount && (isNaN(data.participantCount) || data.participantCount < 0)) {
    return {
      isValid: false,
      message: 'Participant count must be a positive number'
    };
  }

  return { isValid: true };
}

function validateStatus(status) {
  const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
  if (!validStatuses.includes(status)) {
    return {
      isValid: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    };
  }
  return { isValid: true };
}

// Main request handler
async function handleInsuranceRequest(req, res) {
  try {
    const { method, url, params, body } = req;

    // GET /api/insurance - Get all insurance submissions
    if (method === 'GET' && url === '/api/insurance') {
      const submissions = await getInsurance();
      res.json({
        success: true,
        submissions
      });
      return;
    }

    // POST /api/insurance - Create new insurance submission
    if (method === 'POST' && url === '/api/insurance') {
      const validation = validateInsuranceSubmission(body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: validation.message
        });
        return;
      }

      const insuranceData = {
        eventName: body.eventName,
        eventDate: body.eventDate,
        eventDescription: body.eventDescription,
        participantCount: body.participantCount || 0,
        submittedBy: body.submittedBy || 'admin',
        status: 'pending',
        clubId: body.clubId
      };

      const result = await addInsurance(insuranceData);
      res.json({
        success: true,
        message: 'Insurance submission created successfully',
        submission: result
      });
      return;
    }

    // PUT /api/insurance/:id - Update insurance submission status
    if (method === 'PUT' && url.startsWith('/api/insurance/')) {
      const id = params.id;
      const { status } = body;

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required'
        });
        return;
      }

      const statusValidation = validateStatus(status);
      if (!statusValidation.isValid) {
        res.status(400).json({
          success: false,
          message: statusValidation.message
        });
        return;
      }

      const result = await updateInsuranceStatus(id, status);
      if (result) {
        res.json({
          success: true,
          message: 'Insurance submission status updated successfully',
          submission: result
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Insurance submission not found'
        });
      }
      return;
    }

    // DELETE /api/insurance/:id - Delete insurance submission
    if (method === 'DELETE' && url.startsWith('/api/insurance/')) {
      const id = params.id;
      const result = await deleteInsuranceSubmission(id);
      
      if (result) {
        res.json({
          success: true,
          message: 'Insurance submission deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Insurance submission not found'
        });
      }
      return;
    }

    // Handle unsupported methods
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Error in insurance API:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

module.exports = handleInsuranceRequest;
