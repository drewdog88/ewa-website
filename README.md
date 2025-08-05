# Eastlake Wolfpack Association Website

A modern, responsive website for the Eastlake Wolfpack Association, supporting Eastlake High School booster clubs and activities.

## 🚀 Features

### **UI/Design**
- ✅ **Modern, responsive design** with mobile-first approach
- ✅ **Consistent branding** with EWA wolf logo across all pages
- ✅ **Professional styling** with improved typography and spacing
- ✅ **Accessibility features** including skip links and ARIA attributes
- ✅ **Interactive elements** with smooth animations and transitions

### **Security**
- ✅ **Contact information protection** with obfuscation and anti-scraping measures
- ✅ **Security headers** (XSS protection, content type options, frame options)
- ✅ **Rate limiting** to prevent abuse
- ✅ **Input validation and sanitization** for all user inputs
- ✅ **Role-based access control** for admin functions

### **Performance/SEO**
- ✅ **Optimized loading** with compression and caching
- ✅ **SEO meta tags** including Open Graph and Twitter Cards
- ✅ **Structured data** for better search engine understanding
- ✅ **Performance monitoring** with Vercel Analytics and Speed Insights
- ✅ **Accessibility compliance** with WCAG guidelines

### **User Management**
- ✅ **Multi-role system** (Admin, Booster Club Admin)
- ✅ **User authentication** with secure login/logout
- ✅ **Self-service features** (password change, forgot password)
- ✅ **Account management** (locking, unlocking, profile setup)
- ✅ **Secret question/answer** for password recovery

### **Admin Dashboard**
- ✅ **Comprehensive user management** (create, edit, delete, lock/unlock)
- ✅ **Officer management** with CSV import/export functionality
- ✅ **Volunteer management** with status tracking and filtering
- ✅ **Insurance form submissions** for booster clubs
- ✅ **1099 information management** for tax reporting
- ✅ **Website link management** for external resources

### **Content Management**
- ✅ **Dynamic content loading** with real-time updates
- ✅ **CSV import/export** for bulk data management
- ✅ **File upload/download** for templates and documents
- ✅ **Status tracking** for submissions and approvals
- ✅ **Filtering and search** capabilities

### **Payment System**
- ✅ **Dedicated payment pages** for each booster club
- ✅ **Secure payment information** display
- ✅ **Club-specific donation links** and instructions
- ✅ **Professional payment presentation**

## 📁 Project Structure

```
ewa_website/
├── assets/                 # Static assets (images, logos)
│   └── ewa-wolf.jpg       # EWA logo
├── data/                  # Data files (JSON, CSV)
│   ├── users.json         # User authentication data
│   ├── volunteers.json    # Volunteer submissions
│   ├── officers.json      # Officer information
│   └── officer_import_template.csv  # CSV template
├── new/                   # Main website files
│   ├── admin/            # Admin interface
│   │   ├── dashboard.html # Main admin dashboard
│   │   ├── dashboard.css  # Admin styles
│   │   └── login.html    # Admin login
│   ├── index.html        # Main homepage
│   ├── team.html         # Team/officers page
│   ├── volunteers.html   # Volunteer form
│   ├── news.html         # News and updates
│   ├── gallery.html      # Photo gallery
│   ├── links.html        # Resources and links
│   ├── payment.html      # Payment information
│   └── security.js       # Security features
├── index.html            # Main entry point (redirects to new/)
├── server.js             # Node.js backend server
├── package.json          # Dependencies and scripts
├── vercel.json           # Vercel deployment config
└── README.md             # Project documentation
```

## 🛠️ API Endpoints

### **Authentication**
- `POST /api/login` - User authentication
- `POST /api/users/change-password` - Self-service password change
- `POST /api/users/setup-profile` - First-time profile setup
- `POST /api/users/forgot-password` - Password recovery

### **User Management**
- `GET /api/users` - Get all users (admin)
- `POST /api/users` - Create new user (admin)
- `PUT /api/users/:username` - Update user (admin)
- `DELETE /api/users/:username` - Delete user (admin)
- `GET /api/users/:username/secret-question` - Get secret question

### **Volunteer Management**
- `POST /api/volunteers` - Submit volunteer interest
- `GET /api/volunteers` - Get all volunteers (admin)
- `GET /api/volunteers/:club` - Get club volunteers (booster admin)
- `PUT /api/volunteers/:id` - Update volunteer status

### **Officer Management**
- `GET /api/officers` - Get all officers
- `GET /api/officers/:club` - Get club officers
- `POST /api/officers` - Add new officer
- `PUT /api/officers/:id` - Update officer
- `DELETE /api/officers/:id` - Delete officer
- `GET /api/officers/template` - Download CSV template

### **Booster Club Features**
- `POST /api/insurance` - Submit insurance form
- `GET /api/insurance/:club` - Get club insurance submissions
- `POST /api/1099` - Submit 1099 information
- `GET /api/1099/:club` - Get club 1099 submissions

### **System**
- `GET /api/health` - Health check endpoint

## 💾 Data Storage

### **Development**
- **In-memory storage** for local development
- **JSON files** for persistent data
- **File-based templates** for CSV downloads

### **Production (Vercel)**
- **Vercel KV** for persistent data storage
- **Automatic fallback** to in-memory if KV unavailable
- **Environment-based** storage selection

## 🚀 Frontend Development

### **HTML Structure**
- **Semantic HTML5** elements for accessibility
- **Responsive design** with mobile-first approach
- **SEO optimization** with proper meta tags
- **Security features** with obfuscated contact information

### **CSS Styling**
- **Modern CSS** with flexbox and grid layouts
- **Consistent theming** across all pages
- **Accessibility styles** for high contrast and reduced motion
- **Performance optimization** with external stylesheets

### **JavaScript Functionality**
- **Vanilla JavaScript** for maximum compatibility
- **Fetch API** for asynchronous data loading
- **Session management** with localStorage
- **Role-based UI** with dynamic content loading
- **Security features** with anti-scraping measures

## 🔧 Backend Development

### **Node.js Server**
- **Express.js** framework for API endpoints
- **Middleware** for security, compression, and validation
- **Error handling** with proper HTTP status codes
- **Logging** for debugging and monitoring

### **Security Features**
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse
- **Security headers** for protection
- **CORS configuration** for cross-origin requests

### **Performance Optimization**
- **Gzip compression** for faster loading
- **Static file caching** with appropriate headers
- **Efficient routing** with proper fallbacks
- **Memory management** for optimal performance

## 🚀 Deployment

### **Vercel Deployment**
1. **Connect repository** to Vercel
2. **Set environment variables** for KV storage
3. **Deploy from `vercel-kv-deployment` branch**
4. **Configure custom domain** (optional)

### **Environment Variables**
```bash
NODE_ENV=production
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-url
KV_REST_API_TOKEN=your-kv-token
```

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm start

# Server runs on http://localhost:3000
```

## 🔐 Security Features

### **Client-Side Security**
- **Email/phone obfuscation** to prevent scraping
- **Anti-scraping measures** (disabled right-click, copy/paste)
- **Interactive reveal** for contact information
- **Session-based access control**

### **Server-Side Security**
- **Input validation** and sanitization
- **Rate limiting** to prevent abuse
- **Security headers** (XSS, CSRF protection)
- **Role-based access control**

## ⚡ Performance Features

### **Optimization**
- **Gzip compression** for all responses
- **Static file caching** with appropriate headers
- **Image optimization** and lazy loading
- **Minified CSS/JS** for faster loading

### **Monitoring**
- **Vercel Analytics** for user behavior tracking
- **Speed Insights** for performance monitoring
- **Error logging** for debugging
- **Health check endpoints** for uptime monitoring

## ♿ Accessibility Features

### **WCAG Compliance**
- **Skip links** for keyboard navigation
- **ARIA attributes** for screen readers
- **High contrast** mode support
- **Reduced motion** preferences
- **Keyboard navigation** support

### **User Experience**
- **Responsive design** for all devices
- **Clear navigation** with consistent structure
- **Error handling** with helpful messages
- **Loading states** for better feedback

## 📈 Recent Updates

### **Latest Features**
- ✅ **Simplified structure** - Removed original version, streamlined codebase
- ✅ **Vercel deployment** - Production-ready with KV storage
- ✅ **Analytics integration** - Vercel Analytics and Speed Insights
- ✅ **Security enhancements** - Anti-scraping and contact protection
- ✅ **Performance optimization** - Compression, caching, and monitoring
- ✅ **Accessibility improvements** - WCAG compliance and user experience

### **Future Recommendations**
1. **Database migration** - Consider PostgreSQL for complex queries
2. **Email notifications** - Automated alerts for submissions
3. **File uploads** - Support for document attachments
4. **Advanced reporting** - Analytics dashboard for admins
5. **Mobile app** - Native app for mobile users
6. **API documentation** - Swagger/OpenAPI specification

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support or questions, please contact the EWA team or create an issue in the repository.

---

**Eastlake Wolfpack Association** - Supporting Eastlake High School booster clubs and activities since 2025. 