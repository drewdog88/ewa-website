# EWA Website

Eastlake Wolfpack Association (EWA) website with dual version support - original replica and enhanced new version with comprehensive features.

## Overview

This project contains two versions of the EWA website:
- **Original Version** (`original/`): 1:1 replica of the original website at https://ewa-site.pages.dev/
- **New Version** (`new/`): Enhanced version with modern features, SEO optimization, and comprehensive admin system

## Features

### Original Version
- Exact replica of the original EWA website
- Booster club listings with donation popups and website links
- EWA Team page with member information
- Preserved for reference and comparison

### New Version - Enhanced Features

#### 🎨 **User Interface & Design**
- **Modern Design**: Clean, professional interface with consistent branding
- **Responsive Layout**: Mobile-first design that works on all devices
- **Wolf Logo Integration**: Consistent branding across all pages
- **Enhanced Navigation**: Intuitive navigation with clear page structure

#### 🔐 **Security & Privacy**
- **Contact Protection**: Email and phone obfuscation to prevent scraping
- **Anti-Scraping Measures**: Right-click protection and copy prevention
- **Secure Admin Panel**: Role-based access control
- **Input Validation**: Server-side validation and sanitization
- **Rate Limiting**: Protection against abuse

#### 🚀 **Performance & SEO**
- **SEO Optimized**: Comprehensive meta tags, Open Graph, Twitter Cards
- **Structured Data**: JSON-LD markup for better search engine understanding
- **Performance Optimized**: GPU acceleration, compression, caching
- **Accessibility**: WCAG compliant with skip links, ARIA attributes, keyboard navigation
- **Preload Resources**: Critical resources loaded with high priority

#### 👥 **User Management System**
- **Role-Based Access**: 
  - **Admin**: Full access to all features
  - **Booster Club Officers**: Limited access to their club's data only
- **User Self-Service**: Password changes, forgot password with secret Q/A
- **Account Management**: Lock/unlock users, password resets
- **Profile Setup**: First-time login setup with security questions

#### 📊 **Admin Dashboard**
- **Volunteer Management**: View, filter, update status, export to CSV
- **Officer Management**: Add, edit, delete, import from CSV
- **Insurance Forms**: Submit and manage insurance information
- **1099 Information**: Tax document management
- **Website Links**: Manage booster club website links
- **User Administration**: Complete user management system

#### 📝 **Content Management**
- **News System**: Structured news articles with dates and categories
- **Photo Gallery**: Interactive gallery with keyboard navigation
- **Resource Links**: Filterable links organized by category
- **Volunteer Signup**: Comprehensive volunteer interest form

#### 💳 **Payment System**
- **Dedicated Payment Pages**: Individual pages for each booster club
- **Payment Information**: Secure display of payment details
- **Club-Specific Content**: Tailored information for each booster club

## Project Structure

```
ewa-website/
├── index.html                    # Version selector page
├── original/                     # Original website replica
│   ├── index.html
│   ├── team.html
│   └── payment.html
├── new/                         # Enhanced website version
│   ├── index.html              # Homepage with SEO optimization
│   ├── team.html               # Team page with contact protection
│   ├── news.html               # News and announcements
│   ├── gallery.html            # Interactive photo gallery
│   ├── links.html              # Filterable resource links
│   ├── volunteers.html         # Volunteer signup form
│   ├── payment.html            # Payment information pages
│   ├── security.js             # Client-side security features
│   └── admin/
│       ├── login.html          # Admin login
│       ├── dashboard.html      # Admin dashboard
│       └── dashboard.css       # Admin styles
├── assets/                     # Shared assets
│   └── ewa-wolf.jpg           # Wolf logo
├── data/                       # JSON data files
│   ├── volunteers.json        # Volunteer submissions
│   ├── users.json             # User accounts
│   ├── officers.json          # Officer information
│   ├── insurance.json         # Insurance forms
│   ├── 1099.json              # Tax information
│   └── officer_import_template.csv
├── server.js                   # Node.js backend server
├── package.json                # Node.js dependencies
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/drewdog88/ewa-website.git
cd ewa-website
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### Version Selection
- Visit the root page to choose between "Original" and "New" versions
- Use the toggle buttons in the header/footer to switch between versions

### Admin Access
- Navigate to `/new/admin/login.html`
- Default admin credentials:
  - Username: `admin`
  - Password: `ewa2025`

### Booster Club Officer Access
- Orchestra Booster credentials:
  - Username: `orchestra_booster`
  - Password: `ewa_orchestra_2025`

### Volunteer Signup
- Visit `/new/volunteers.html`
- Fill out the form to express interest in volunteering
- Data is stored in `data/volunteers.json`

## API Endpoints

### Volunteer Management
- `POST /api/volunteers` - Submit new volunteer interest
- `GET /api/volunteers` - Get all volunteer submissions (admin only)
- `PUT /api/volunteers/:id` - Update volunteer status

### User Authentication & Management
- `POST /api/login` - User login
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:username` - Update user (admin only)
- `DELETE /api/users/:username` - Delete user (admin only)
- `POST /api/users/change-password` - Change password (self-service)
- `POST /api/users/setup-profile` - Setup profile (first login)
- `POST /api/users/forgot-password` - Forgot password recovery

### Officer Management
- `GET /api/officers` - Get all officers
- `GET /api/officers/:club` - Get officers for specific club
- `POST /api/officers` - Add new officer
- `PUT /api/officers/:id` - Update officer
- `DELETE /api/officers/:id` - Delete officer
- `GET /api/officers/template` - Download CSV template

### Insurance & Tax Forms
- `POST /api/insurance` - Submit insurance form
- `GET /api/insurance/:club` - Get insurance data for club
- `POST /api/1099` - Submit 1099 information
- `GET /api/1099/:club` - Get 1099 data for club

## Data Storage

The application uses JSON files for data persistence:
- `data/volunteers.json` - Volunteer submissions with status tracking
- `data/users.json` - User accounts with role-based access
- `data/officers.json` - Officer information for each club
- `data/insurance.json` - Insurance form submissions
- `data/1099.json` - Tax information submissions

## Development

### Adding New Features
1. Work in the `new/` directory for enhancements
2. Keep the `original/` directory unchanged for reference
3. Update this README when adding new features
4. Follow accessibility guidelines (WCAG 2.1)

### Backend Development
- The server runs on port 3000 by default
- API endpoints are RESTful
- Data is stored in JSON files for simplicity
- Security headers and rate limiting are implemented

### Frontend Development
- Semantic HTML5 structure
- CSS with accessibility considerations
- JavaScript with error handling
- Mobile-first responsive design

## Deployment

### Vercel Deployment (Recommended)

1. **Prepare for Vercel**:
   - Ensure all files are committed to Git
   - Vercel will automatically detect Node.js project

2. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

3. **Environment Variables** (if needed):
   - Set `NODE_ENV=production` for production optimizations
   - Configure any API keys or secrets

4. **Vercel Configuration**:
   - Vercel will automatically build and deploy
   - Serverless functions will handle API endpoints
   - Static files will be served with CDN

### Other Deployment Options

#### Static Hosting (Limited Functionality)
For static hosting (GitHub Pages, Netlify, etc.):
- Deploy only the HTML/CSS/JS files
- Remove `server.js` and `package.json`
- Note: Admin features will not work without the backend

#### Full Stack Deployment
For full functionality:
- Deploy to a Node.js hosting service (Heroku, Railway, etc.)
- Ensure `data/` directory is writable
- Set up environment variables if needed

## Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Protection against abuse and DDoS
- **Security Headers**: XSS protection, content type options, frame options
- **Contact Protection**: Email and phone obfuscation
- **Role-Based Access**: Proper authorization for all features

## Performance Features

- **Compression**: Gzip compression for faster loading
- **Caching**: Static file caching with etag and lastModified
- **GPU Acceleration**: Hardware acceleration for animations
- **Resource Optimization**: Preloading and DNS prefetch
- **Image Optimization**: Proper image sizing and formats

## Accessibility Features

- **WCAG 2.1 Compliance**: Full accessibility support
- **Keyboard Navigation**: Complete keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences
- **Skip Links**: Quick navigation for keyboard users

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (including accessibility)
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, contact the EWA team.

---

**Note**: This is a development version. The original website remains at https://ewa-site.pages.dev/

## Recent Updates

### Version 2.0 (Latest)
- ✅ Comprehensive SEO optimization
- ✅ Performance improvements with compression and caching
- ✅ Full accessibility compliance (WCAG 2.1)
- ✅ Enhanced security features
- ✅ Complete user management system
- ✅ Officer management with CSV import/export
- ✅ Volunteer management with status tracking
- ✅ Insurance and 1099 form management
- ✅ Payment system with dedicated pages
- ✅ Modern responsive design
- ✅ Contact protection and anti-scraping measures 