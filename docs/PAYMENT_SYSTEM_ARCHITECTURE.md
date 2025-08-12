# Payment System Enhancement Architecture
## Eastlake Wolfpack Association Website

### Overview
This document outlines the technical architecture for enhancing the EWA website's payment system to support Zelle QR codes and Stripe payment links for all booster clubs, with comprehensive admin management capabilities.

### Current System Analysis

#### Existing Infrastructure
- **Frontend**: Vanilla HTML/CSS/JS served by Express.js
- **Backend**: Node.js/Express with Neon PostgreSQL database
- **Deployment**: Vercel serverless functions
- **Storage**: Vercel Blob for file uploads
- **Security**: Session-based authentication with admin roles
- **Testing**: Jest (unit/integration), Playwright (E2E), security scanning

#### Current Payment System Limitations
- Only supports Robotics club with hardcoded Zelle QR and Stripe links
- No dynamic loading based on booster club selection
- Check payment section exists but unused
- No admin interface for payment management
- Zelle QR codes exist but not integrated

### Target Architecture

#### 1. Database Schema Enhancements

**Booster Clubs Table Extension**
```sql
-- Add payment-related columns to booster_clubs table
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS zelle_qr_code_path VARCHAR(500);
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS stripe_donation_link VARCHAR(500);
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS stripe_membership_link VARCHAR(500);
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS stripe_fees_link VARCHAR(500);
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS payment_instructions TEXT;
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS is_payment_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS last_payment_update_by VARCHAR(100);
ALTER TABLE booster_clubs ADD COLUMN IF NOT EXISTS last_payment_update_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_booster_clubs_payment_enabled ON booster_clubs(is_payment_enabled) WHERE is_payment_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_booster_clubs_active_payment ON booster_clubs(is_active, is_payment_enabled) WHERE is_active = TRUE AND is_payment_enabled = TRUE;
```

**Payment Audit Table**
```sql
-- Create audit trail for payment changes
CREATE TABLE IF NOT EXISTS payment_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES booster_clubs(id),
    action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(100) REFERENCES users(username),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_club_id ON payment_audit_log(club_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_changed_at ON payment_audit_log(changed_at);
```

#### 2. API Architecture

**Public Payment API**
```
GET /api/booster-clubs/:id/payment-options
- Returns payment options for a specific booster club
- Public endpoint, no authentication required
- Cached at edge with ETag support
- Returns only safe, public fields
```

**Admin Payment Management API**
```
GET    /api/admin/booster-clubs/:id/payment-links
PUT    /api/admin/booster-clubs/:id/payment-links
POST   /api/admin/booster-clubs/:id/qr-code
DELETE /api/admin/booster-clubs/:id/qr-code
POST   /api/admin/booster-clubs/bulk-import
GET    /api/admin/booster-clubs/bulk-export
```

**Response Format**
```json
{
  "success": true,
  "data": {
    "club_id": "uuid",
    "club_name": "EHS Band Boosters",
    "is_payment_enabled": true,
    "zelle_qr_code": {
      "path": "/zelle-standardized/band.jpg",
      "alt_text": "Zelle QR code for EHS Band Boosters"
    },
    "stripe_links": {
      "donation": "https://buy.stripe.com/...",
      "membership": "https://buy.stripe.com/...",
      "fees": "https://buy.stripe.com/..."
    },
    "payment_instructions": "Please include student name and purpose..."
  }
}
```

#### 3. Frontend Architecture

**Payment Page Enhancements**
- Dynamic loading of payment options based on club selection
- Progressive enhancement with fallback for JavaScript disabled
- Responsive design with mobile-first approach
- Accessibility compliance (WCAG 2.1 AA)
- Security measures to prevent AI training

**Component Structure**
```
payment.html
├── Club Selection (URL parameter based)
├── Zelle QR Code Display
│   ├── QR Code Image (responsive)
│   ├── "No QR Code Available" message
│   └── Instructions
├── Stripe Payment Buttons
│   ├── Donation Button
│   ├── Membership Button
│   └── Fees Button
└── Payment Instructions
```

**Admin Dashboard Enhancements**
```
admin/dashboard.html
├── Payment Management Section
│   ├── Club Selection
│   ├── Payment Settings Form
│   │   ├── Enable/Disable Payments
│   │   ├── Stripe Links Management
│   │   ├── Payment Instructions
│   │   └── QR Code Upload
│   ├── Bulk Import/Export
│   └── Audit Trail View
```

#### 4. Storage Architecture

**File Storage Strategy**
- **Zelle QR Codes**: Stored in `/public/zelle-standardized/` directory
- **Naming Convention**: `{club-slug}.jpg` (e.g., `ehs-band-boosters.jpg`)
- **Image Processing**: Sharp.js for optimization and standardization
- **Responsive Images**: Generate 320px, 480px, 640px variants
- **CDN**: Vercel's edge network for global distribution

**Backup Strategy**
- **Database**: Neon's Point-in-Time Recovery (PITR)
- **Files**: Vercel Blob with automatic replication
- **Audit Trail**: Immutable logs for compliance

#### 5. Security Architecture

**Input Validation**
- **Zod Schemas**: Type-safe validation for all inputs
- **URL Validation**: Whitelist for Stripe domains only
- **File Upload**: Content-type and size validation
- **XSS Prevention**: Output encoding and sanitization

**Authentication & Authorization**
- **Session-based**: Existing admin authentication
- **RBAC**: Admin role required for payment management
- **Rate Limiting**: Per-IP and per-user limits
- **CSRF Protection**: Token-based protection

**Data Protection**
- **PCI Compliance**: No card data stored (Stripe-hosted links only)
- **PII Protection**: Redact sensitive data in logs
- **Encryption**: TLS 1.3 for all communications
- **Audit Logging**: Complete trail of payment changes

#### 6. Performance Architecture

**Caching Strategy**
- **API Responses**: ETag-based caching with 5-minute TTL
- **Static Assets**: Immutable cache for QR code images
- **Database**: Query optimization with proper indexes
- **CDN**: Vercel edge caching for global performance

**Optimization Techniques**
- **Image Optimization**: WebP format with fallbacks
- **Lazy Loading**: QR codes loaded on demand
- **Code Splitting**: Minimal JavaScript payload
- **Compression**: Gzip/Brotli compression

#### 7. Monitoring & Observability

**Logging Strategy**
- **Structured Logging**: Pino for consistent log format
- **Request Correlation**: Unique IDs for request tracing
- **Error Tracking**: Comprehensive error logging
- **Audit Trail**: Payment changes logged with context

**Metrics & Alerts**
- **Performance**: Response time and throughput
- **Errors**: Error rates and types
- **Security**: Failed authentication attempts
- **Business**: Payment option usage statistics

#### 8. Deployment Architecture

**Environment Strategy**
- **Development**: Local environment with mock data
- **Staging**: Production-like environment for testing
- **Production**: Vercel deployment with Neon database

**CI/CD Pipeline**
- **Code Quality**: ESLint, security scanning
- **Testing**: Unit, integration, E2E tests
- **Deployment**: Automated deployment on main branch
- **Rollback**: Quick rollback capability

**Environment Variables**
```env
# Database
DATABASE_URL=postgresql://...

# Security
SESSION_SECRET=...
STRIPE_ALLOWED_DOMAINS=buy.stripe.com,donate.stripe.com

# Storage
BLOB_READ_WRITE_TOKEN=...

# Monitoring
LOG_LEVEL=info
NODE_ENV=production
```

### Data Flow Diagrams

#### Payment Page Load Flow
```
1. User visits payment.html?club=EHS%20Band%20Boosters
2. Frontend extracts club parameter
3. Frontend calls GET /api/booster-clubs/:id/payment-options
4. API queries database for club payment data
5. API returns payment options (cached at edge)
6. Frontend renders payment options dynamically
7. User can scan QR code or click Stripe buttons
```

#### Admin Payment Management Flow
```
1. Admin logs into dashboard
2. Admin selects club for payment management
3. Admin calls GET /api/admin/booster-clubs/:id/payment-links
4. API validates admin permissions
5. API returns current payment configuration
6. Admin updates payment settings
7. Admin calls PUT /api/admin/booster-clubs/:id/payment-links
8. API validates input and updates database
9. API creates audit log entry
10. API invalidates public cache
```

### Security Considerations

#### PCI Compliance
- **No Card Data**: Only Stripe-hosted payment links
- **Tokenization**: Stripe handles all payment processing
- **Scope Minimization**: Minimal PCI scope through hosted solutions

#### Data Protection
- **PII Handling**: Secure handling of user information
- **Audit Trail**: Complete logging of payment changes
- **Access Control**: Role-based access to payment management

#### Threat Mitigation
- **XSS Prevention**: Input validation and output encoding
- **CSRF Protection**: Token-based request validation
- **SSRF Prevention**: URL validation and whitelisting
- **Rate Limiting**: Protection against abuse

### Testing Strategy

#### Unit Tests
- API endpoint validation and error handling
- Database functions and queries
- Utility functions and helpers

#### Integration Tests
- End-to-end API workflows
- Database integration and migrations
- File upload and processing

#### E2E Tests
- Payment page functionality
- Admin dashboard workflows
- Cross-browser compatibility

#### Security Tests
- Authentication and authorization
- Input validation and sanitization
- XSS and CSRF protection

### Success Metrics

#### Performance Metrics
- Page load time < 3 seconds
- API response time < 500ms
- 99.9% uptime

#### Security Metrics
- Zero security vulnerabilities
- Complete audit trail
- PCI compliance maintained

#### User Experience Metrics
- Mobile responsiveness score > 90
- Accessibility compliance (WCAG 2.1 AA)
- Cross-browser compatibility

### Risk Mitigation

#### Technical Risks
- **QR Code Quality**: Comprehensive testing across devices
- **Stripe Integration**: Validation and error handling
- **Performance**: Monitoring and optimization

#### Security Risks
- **Data Breach**: Encryption and access controls
- **Payment Fraud**: Stripe's fraud detection
- **System Abuse**: Rate limiting and monitoring

#### Operational Risks
- **Deployment Issues**: Automated testing and rollback
- **Data Loss**: Backup and recovery procedures
- **User Adoption**: Training and documentation

### Future Enhancements

#### Phase 2 Features
- Payment analytics and reporting
- Automated receipt generation
- Integration with accounting systems
- Multi-language support

#### Scalability Considerations
- Microservices architecture
- Database sharding
- Global CDN deployment
- Advanced caching strategies

### Conclusion

This architecture provides a robust, secure, and scalable foundation for the payment system enhancement. It builds upon the existing infrastructure while adding comprehensive payment management capabilities. The design prioritizes security, performance, and user experience while maintaining compliance with relevant regulations.

The implementation will be phased to ensure smooth deployment and minimal disruption to existing services. Each phase will include comprehensive testing and validation before proceeding to the next stage.

