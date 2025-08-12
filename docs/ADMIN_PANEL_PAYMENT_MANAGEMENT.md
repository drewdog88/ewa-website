# Admin Panel Payment Management
## EWA Payment System Enhancement

### Overview
This document details the admin panel implementation for managing payment links, QR codes, and payment instructions for all booster clubs in the EWA system.

### Admin Panel Structure

#### 1. Payment Management Dashboard
**Location**: `/admin/payment-management.html`

**Features**:
- Overview table of all booster clubs with payment status
- Quick status indicators (QR Code ✓/✗, Stripe Links ✓/✗, Instructions ✓/✗)
- Payment configuration completeness percentage
- Quick access buttons to manage each club's payment settings
- Bulk operations panel for mass updates

**Dashboard Components**:
```html
<!-- Payment Status Overview -->
<div class="payment-overview">
  <div class="status-card">
    <h3>Payment Configuration Status</h3>
    <div class="status-grid">
      <div class="status-item">
        <span class="status-icon">✓</span>
        <span>Fully Configured: 8 clubs</span>
      </div>
      <div class="status-item">
        <span class="status-icon">⚠</span>
        <span>Partially Configured: 3 clubs</span>
      </div>
      <div class="status-item">
        <span class="status-icon">✗</span>
        <span>Not Configured: 2 clubs</span>
      </div>
    </div>
  </div>
</div>

<!-- Booster Clubs Payment Table -->
<table class="payment-clubs-table">
  <thead>
    <tr>
      <th>Club Name</th>
      <th>QR Code</th>
      <th>Stripe Links</th>
      <th>Instructions</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="paymentClubsTableBody">
    <!-- Dynamically populated -->
  </tbody>
</table>
```

#### 2. Combined Payment Management Page

**Location**: `/admin/payment-settings.html`

**Features**:
- Single page for managing both Zelle QR codes and Stripe payment links
- Club selection dropdown to manage payment settings per club
- Real-time validation and testing of payment links
- Preview functionality for QR codes and payment instructions

**Initial QR Code Seeding Process**:
1. **Document Processing**: Extract Zelle URLs from QRCODES4BOOSTERS.docx (one-time)
2. **QR Generation**: Generate QR codes from extracted URLs
3. **Database Population**: Store QR code paths in database for each club
4. **Ongoing Management**: Admin panel for future updates and management

**Implementation Details**:
```javascript
// Initial QR Code Seeding (one-time process)
const seedQRCodesFromDocument = async (filePath) => {
  // 1. Extract URLs from DOCX
  const urls = await extractZelleUrlsFromDocx(filePath);
  
  // 2. Generate QR codes for each URL
  const qrCodes = await Promise.all(
    urls.map(url => generateQRCode(url))
  );
  
  // 3. Store QR codes and populate database
  const storedCodes = await Promise.all(
    qrCodes.map((qrCode, index) => 
      storeQRCodeAndUpdateDatabase(qrCode, urls[index], `club-${index + 1}`)
    )
  );
  
  return storedCodes;
};

// URL Extraction from DOCX (one-time)
const extractZelleUrlsFromDocx = async (filePath) => {
  // Use mammoth.js or similar to extract text
  const text = await extractTextFromDocx(filePath);
  
  // Find Zelle URLs using regex
  const zelleUrlPattern = /https:\/\/en\.zellepay\.com\/[a-zA-Z0-9_-]+/g;
  const urls = text.match(zelleUrlPattern) || [];
  
  return urls;
};

// QR Code Generation
const generateQRCode = async (url) => {
  const QRCode = require('qrcode');
  
  const qrCodeBuffer = await QRCode.toBuffer(url, {
    type: 'image/png',
    width: 640,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrCodeBuffer;
};
```

**Admin Interface Components**:
```html
<!-- Combined Payment Management Page -->
<div class="payment-settings-page">
  <h2>Payment Settings Management</h2>
  
  <!-- Club Selection -->
  <div class="club-selection">
    <label for="clubSelector">Select Club:</label>
    <select id="clubSelector">
      <option value="">Choose a club...</option>
      <!-- Dynamically populated -->
    </select>
  </div>
  
  <!-- Payment Settings Form -->
  <form id="paymentSettingsForm" style="display:none;">
    <div class="settings-section">
      <h3>Zelle QR Code</h3>
      <div class="qr-code-management">
        <div class="current-qr">
          <label>Current QR Code:</label>
          <img id="currentQRCode" src="" alt="Current QR Code" style="max-width: 200px;">
        </div>
        <div class="upload-new-qr">
          <label>Upload New QR Code:</label>
          <input type="file" 
                 id="newQRCode" 
                 accept="image/*">
          <button type="button" id="uploadQRCode">Upload QR Code</button>
        </div>
        <div class="qr-testing">
          <button type="button" id="testQRCode">Test QR Code</button>
          <span id="qrTestResult"></span>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>Stripe Payment Links</h3>
      <div class="stripe-links-management">
        <div class="link-group">
          <label>Donation Link:</label>
          <input type="url" 
                 id="stripeDonationLink" 
                 placeholder="https://donate.stripe.com/...">
          <button type="button" class="test-link">Test Link</button>
        </div>
        
        <div class="link-group">
          <label>Membership Link:</label>
          <input type="url" 
                 id="stripeMembershipLink" 
                 placeholder="https://buy.stripe.com/...">
          <button type="button" class="test-link">Test Link</button>
        </div>
        
        <div class="link-group">
          <label>Fees Link:</label>
          <input type="url" 
                 id="stripeFeesLink" 
                 placeholder="https://buy.stripe.com/...">
          <button type="button" class="test-link">Test Link</button>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>Payment Instructions</h3>
      <div class="payment-instructions">
        <textarea id="paymentInstructions" 
                  rows="6" 
                  placeholder="Enter payment instructions for this club..."></textarea>
        <div class="preview-section">
          <h4>Preview:</h4>
          <div id="instructionsPreview"></div>
        </div>
      </div>
    </div>
    
    <div class="settings-section">
      <h3>Payment Status</h3>
      <div class="payment-status">
        <label>
          <input type="checkbox" id="isPaymentEnabled">
          Enable payment options for this club
        </label>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="submit">Save Payment Settings</button>
      <button type="button" id="resetForm">Reset</button>
    </div>
  </form>
</div>
```

### API Endpoints for Admin Panel

#### Payment Settings Management APIs
```javascript
// Get payment settings for a club
GET /api/admin/payment-settings/club/:clubId

// Update payment settings for a club
PUT /api/admin/payment-settings/club/:clubId
Body: {
  zelle_qr_code_path: "path/to/qr-code.png",
  stripe_donation_link: "https://donate.stripe.com/...",
  stripe_membership_link: "https://buy.stripe.com/...",
  stripe_fees_link: "https://buy.stripe.com/...",
  payment_instructions: "Payment instructions text",
  is_payment_enabled: true
}

// Upload new QR code for a club
POST /api/admin/payment-settings/club/:clubId/qr-code
Content-Type: multipart/form-data
Body: { file: qr-code-image.png }

// Test QR code for a club
POST /api/admin/payment-settings/club/:clubId/test-qr-code
Body: { qr_code_path: "path/to/qr-code.png" }

// Validate Stripe link
POST /api/admin/payment-settings/validate-stripe-link
Body: { url: "https://donate.stripe.com/..." }

// Test Stripe link
POST /api/admin/payment-settings/test-stripe-link
Body: { url: "https://donate.stripe.com/..." }

// Get all clubs with payment status
GET /api/admin/payment-settings/clubs
Response: Array of clubs with payment configuration status

// Bulk update payment settings
POST /api/admin/payment-settings/bulk-update
Body: {
  clubIds: ["uuid1", "uuid2"],
  updates: {
    is_payment_enabled: true
  }
}
```

#### Initial QR Code Seeding API (One-time use)
```javascript
// Seed QR codes from document (one-time process)
POST /api/admin/qr-codes/seed-from-document
Content-Type: multipart/form-data
Body: { file: QRCODES4BOOSTERS.docx }

// Get seeding progress
GET /api/admin/qr-codes/seeding-status

// Get seeded QR codes summary
GET /api/admin/qr-codes/seeded-summary
Response: {
  totalUrls: 15,
  totalQRCodes: 15,
  clubsUpdated: 13,
  errors: []
}
```

### Database Schema for Admin Management

#### Payment Configuration Table
```sql
-- Extended booster_clubs table with payment fields
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS (
  zelle_qr_code_path VARCHAR(500),
  stripe_donation_link VARCHAR(500),
  stripe_membership_link VARCHAR(500),
  stripe_fees_link VARCHAR(500),
  payment_instructions TEXT,
  is_payment_enabled BOOLEAN DEFAULT FALSE,
  last_payment_update_by VARCHAR(100),
  last_payment_update_at TIMESTAMP WITH TIME ZONE
);
```

#### Payment Audit Log Table
```sql
-- Track changes to payment configurations
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES booster_clubs(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(100) REFERENCES users(username),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT
);
```

### Security Considerations

#### Admin Authentication
- All payment management endpoints require admin authentication
- Session-based authentication with secure cookies
- CSRF protection for all form submissions
- Rate limiting on admin endpoints

#### Input Validation
- File upload validation for QR document (DOCX only)
- URL validation for Stripe links
- HTML sanitization for payment instructions
- File size limits for QR code uploads

#### Audit Logging
- Log all payment configuration changes
- Track who made changes and when
- Store IP address and user agent for security
- Maintain change history for rollback capability

### Testing Strategy

#### Admin Panel Testing
- Unit tests for QR code generation
- Integration tests for document processing
- E2E tests for admin workflows
- Security tests for admin authentication
- UI tests for admin interface functionality

#### QR Code Testing
- Test QR code generation from various URLs
- Validate QR codes scan correctly
- Test QR code storage and retrieval
- Verify QR code assignment to clubs

#### Stripe Link Testing
- Test link validation against Stripe domains
- Verify link testing functionality
- Test bulk import/export operations
- Validate link assignment to clubs

### Success Metrics
- Admin can successfully upload and process QR document
- QR codes generate correctly and scan properly
- Stripe links validate and work correctly
- Payment instructions save and display properly
- All admin operations complete without errors
- Audit trail captures all changes accurately
- Admin interface is intuitive and responsive
