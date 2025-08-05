# EWA Website

Eastlake Wolfpack Association (EWA) website with dual version support - original replica and enhanced new version.

## Overview

This project contains two versions of the EWA website:
- **Original Version** (`original/`): 1:1 replica of the original website at https://ewa-site.pages.dev/
- **New Version** (`new/`): Enhanced version with additional features and improvements

## Features

### Original Version
- Exact replica of the original EWA website
- Booster club listings with donation popups and website links
- EWA Team page with member information
- Preserved for reference and comparison

### New Version
- **Enhanced Navigation**: Additional pages for News, Gallery, Links, and Volunteer Signup
- **Admin System**: Secure login-protected administrative interface
- **Volunteer Management**: Form for volunteer signup with club-specific filtering
- **User Roles**: 
  - Admin: Full access to all features
  - Booster Club Officers: Limited access to their club's data only
- **JSON Backend**: Simple file-based data storage
- **SEO Optimized**: Meta tags and search engine optimization
- **AI Training Prevention**: Measures to prevent AI training on content

## Project Structure

```
ewa-website/
├── index.html              # Version selector page
├── original/               # Original website replica
│   ├── index.html
│   └── team.html
├── new/                    # Enhanced website version
│   ├── index.html
│   ├── team.html
│   ├── news.html
│   ├── gallery.html
│   ├── links.html
│   ├── volunteers.html
│   └── admin/
│       ├── login.html
│       └── dashboard.html
├── assets/                 # Shared assets
│   └── ewa-wolf.jpg
├── data/                   # JSON data files
│   ├── volunteers.json
│   └── users.json
├── server.js              # Node.js backend server
├── package.json           # Node.js dependencies
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
- `GET /api/volunteers/:club` - Get volunteer submissions for specific club

### User Authentication
- `POST /api/login` - User login
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create new user (admin only)

## Data Storage

The application uses JSON files for data persistence:
- `data/volunteers.json` - Volunteer submissions
- `data/users.json` - User accounts and authentication

## Development

### Adding New Features
1. Work in the `new/` directory for enhancements
2. Keep the `original/` directory unchanged for reference
3. Update this README when adding new features

### Backend Development
- The server runs on port 3000 by default
- API endpoints are RESTful
- Data is stored in JSON files for simplicity

## Deployment

### Static Hosting
For static hosting (GitHub Pages, Netlify, etc.):
- Deploy only the HTML/CSS/JS files
- Remove `server.js` and `package.json`
- Note: Admin features will not work without the backend

### Full Stack Deployment
For full functionality:
- Deploy to a Node.js hosting service (Heroku, Vercel, etc.)
- Ensure `data/` directory is writable
- Set up environment variables if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

For questions or support, contact the EWA team.

---

**Note**: This is a development version. The original website remains at https://ewa-site.pages.dev/ 