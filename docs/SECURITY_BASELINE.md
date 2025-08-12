# EWA Payment System Security Baseline
## Link Redirection Service (No Direct Payment Processing)

### Overview
This document outlines the security baseline for the EWA Payment System. **IMPORTANT: This system does NOT process payments directly. It only redirects users to external payment providers (Zelle, Stripe). No credit card data or payment information is handled by this application.**

### Security Scope
- **Link Management**: Secure storage and management of payment links
- **QR Code Storage**: Secure storage of Zelle QR code images
- **Admin Access**: Secure admin interface for managing payment links
- **Basic Web Security**: Standard web application security practices
- **NO PCI Compliance Required**: No payment data processed or stored

### Node.js/Express Security

#### Version Requirements
- Node.js: >= 20.16.0 (LTS)
- Express: >= 4.21.1
- All dependencies: Latest stable versions with security patches

#### Security Headers (Helmet)
```javascript
// Basic security headers - no special payment processing requirements
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.stripe.com"],
    frameSrc: ["https://js.stripe.com", "https://checkout.stripe.com"]
  }
}
```

### File Upload Security (QR Codes Only)

#### QR Code Restrictions
- **File Types**: Only image files (JPEG, PNG)
- **File Size**: Maximum 1MB per QR code
- **Processing**: Resize and optimize using Sharp.js
- **Storage**: Vercel Blob with public read access
- **Validation**: MIME type and file extension validation

#### Image Processing
```javascript
// Basic image processing for QR codes
const sharp = require('sharp');
const processedImage = await sharp(inputBuffer)
  .resize(640, 640, { fit: 'inside' })
  .png({ quality: 90 })
  .toBuffer();
```

### Input Validation & Sanitization

#### Link Validation
- **Stripe URLs**: Validate against allowed Stripe domains
- **Zelle QR Codes**: Validate image files only
- **Payment Instructions**: Basic text sanitization (max 1000 chars)

#### Validation Rules
```javascript
// Simple URL validation for Stripe links
const STRIPE_ALLOWED_DOMAINS = [
  'buy.stripe.com',
  'donate.stripe.com',
  'checkout.stripe.com'
];

const validateStripeUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return STRIPE_ALLOWED_DOMAINS.includes(urlObj.hostname);
  } catch {
    return false;
  }
};
```

### Rate Limiting
- **General API**: 100 requests per minute
- **Admin Endpoints**: 30 requests per minute
- **File Uploads**: 10 uploads per hour
- **Payment Links**: 50 requests per minute

### Authentication & Authorization

#### Session Security
- Secure session cookies with HttpOnly flag
- Session expiration after 24 hours
- CSRF protection for admin forms
- Role-based access control (Admin only for payment management)

#### Admin Access
- Admin authentication required for payment link management
- No special payment processing permissions needed
- Standard admin role permissions apply

### Logging & Audit Trail

#### Structured Logging
- Use Pino for structured logging
- Log admin actions for payment link changes
- No sensitive payment data to log
- Basic request/response logging

#### Audit Trail
```javascript
// Simple audit logging for link changes
const auditLog = {
  clubId: 'uuid',
  action: 'update_payment_links',
  changedBy: 'admin_username',
  timestamp: new Date(),
  changes: {
    oldLinks: { /* previous links */ },
    newLinks: { /* new links */ }
  }
};
```

### Database Security

#### SQL Injection Prevention
- Use parameterized queries (already implemented with Neon)
- No direct SQL construction
- Input validation before database operations

#### Data Protection
- **No sensitive payment data stored**
- Basic encryption for admin credentials
- Regular database backups
- Access logging for admin operations

### CORS Configuration
```javascript
const corsOptions = {
  origin: [
    'https://ewa-website.com',
    'https://www.ewa-website.com',
    'http://localhost:3000' // Development only
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};
```

### Environment Security
- Environment variables for configuration
- No payment processing secrets required
- Basic API keys for external services
- Secure deployment on Vercel

### Security Testing

#### Automated Testing
- Unit tests for input validation
- Integration tests for admin workflows
- Basic security header validation
- Rate limiting tests

#### Manual Testing
- Admin authentication flows
- File upload security
- Link validation
- Basic penetration testing (optional)

### Incident Response
- Monitor for broken payment links
- Admin notification for link failures
- Basic error tracking and alerting
- No payment data breach scenarios

### Compliance Checklist

#### Basic Security (Required)
- [ ] Input validation and sanitization
- [ ] Secure file uploads (QR codes only)
- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] Security headers
- [ ] Structured logging
- [ ] Database security
- [ ] CORS configuration

#### Link Management (Required)
- [ ] Stripe URL validation
- [ ] QR code file validation
- [ ] Admin access controls
- [ ] Audit logging for changes
- [ ] Link availability monitoring

#### NOT Required (Payment Processing)
- [ ] PCI DSS compliance
- [ ] Payment data encryption
- [ ] Payment processing security
- [ ] Financial transaction logging
- [ ] Payment gateway integration security

### Success Metrics
- All payment links redirect successfully
- Admin can manage links securely
- No broken payment flows
- Basic security audit passes
- No payment data exposure risks

### Risk Assessment
- **Low Risk**: Link redirection service
- **Medium Risk**: Admin access to link management
- **Low Risk**: QR code file uploads
- **No Risk**: Payment data processing (not applicable)

This security baseline is appropriate for a link redirection service that does not process payments directly.
