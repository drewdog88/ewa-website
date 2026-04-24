# Eastlake Wolfpack Association Website

The official website for the Eastlake Wolfpack Association, managing booster clubs, payments, officers, and administration.

## 🚀 **Current Features**

### **Public Website**
- **Booster Club Directory**: Dynamic listing of all Eastlake booster clubs
- **Payment System**: Zelle® QR codes and Stripe payment links for each club
- **Team Page**: Officer information and contact details
- **News & Updates**: Latest announcements and events
- **Photo Gallery**: Event photos and memories
- **Resources & Links**: Important documents and external resources

### **Admin Dashboard**
- **Payment Management**: Configure Zelle and Stripe payment links for all clubs
- **Officer Management**: Add, edit, and manage club officers
- **Insurance Forms**: Process event insurance requests
- **Content Management**: Update club descriptions and website content
- **Security Dashboard**: Monitor system security and performance
- **Backup Management**: Automated database backups and restoration

### **Payment System**
- **Dynamic QR Codes**: Generate Zelle® QR codes for each booster club
- **Stripe Integration**: Credit card payment processing
- **Admin Controls**: Enable/disable payments per club
- **Real-time Updates**: Payment links update immediately

## 🛠️ **Technology Stack**

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (Neon serverless)
- **Deployment**: Vercel serverless functions
- **File Storage**: Vercel Blob
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Payment Processing**: Zelle® QR codes, Stripe
- **Security**: CSP headers, input validation, role-based access

## 🔧 **Quick Start**

1. **Clone & Install**
   ```bash
   git clone <repository>
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your DATABASE_URL and other required variables
   ```

3. **Run Locally**
   ```bash
   node server.js
   # Visit http://localhost:3000
   ```

## 📊 **Key API Endpoints**

### **Public APIs**
- `GET /api/booster-clubs` - List all clubs
- `GET /api/qr-code?clubId=<id>` - Generate Zelle QR code
- `GET /api/officers` - Get officer information

### **Admin APIs**
- `GET /api/admin/payment-status` - Payment statistics
- `PUT /api/admin/payment-settings/club/<id>` - Update payment settings
- `POST /api/insurance` - Submit insurance forms
- `GET /api/admin/security-dashboard` - Security monitoring

## 🔐 **Security Features**

- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries
- **Session Management**: Secure authentication
- **Password Reset**: Secret question-based recovery
- **File Upload Security**: Type and size validation
- **Role-Based Access**: Admin and user permissions

## 🧪 **Testing**

```bash
npm test                 # All Jest projects (unit, integration, e2e, security)
npm run test:ci          # CI gate: unit + integration + security
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:security    # Security scanner tests
npm run test:e2e         # Playwright E2E
```

## 🚀 **Deployment**

- **Automatic**: Deploys from main branch to Vercel
- **Database**: Neon PostgreSQL (serverless)
- **Monitoring**: Vercel Analytics and Speed Insights
- **Backups**: Automated nightly database backups

## 📝 **Recent Updates**

- ✅ **Payment System**: Dynamic QR codes and Stripe integration
- ✅ **Admin Dashboard**: Comprehensive payment and content management
- ✅ **Club Names**: Updated to "Eastlake" branding
- ✅ **Security**: Enhanced CSP headers and input validation
- ✅ **Mobile**: Improved responsive design
- ✅ **Performance**: Optimized database queries and caching

## 📞 **Support**

For technical support or questions, contact the EWA admin team.

---

**© 2025 Eastlake Wolfpack Association. All rights reserved.** 