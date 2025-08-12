# EWA Website

The official website for the Eastlake Wolfpack Association (EWA), managing booster clubs, officers, volunteers, 1099 forms, and user administration.

## Features

- **Booster Club Management**: Manage club information, officers, and descriptions
- **Volunteer Coordination**: Handle volunteer signups and assignments
- **1099 Form Processing**: Secure handling of tax documents
- **News & Announcements**: Publish and manage news articles
- **Links & Resources**: Manage external links and resources
- **Insurance Forms**: Submit and manage event insurance requests
- **User Authentication**: Secure login with password reset functionality
- **Backup Management**: Automated database backups and restoration
- **Content Management**: Update booster club descriptions and website links

## Password Reset Functionality

The system includes a secure password reset feature using secret questions:

### For Users
1. **Secret Question Setup**: Each user has a secret question and answer (e.g., "Favorite Food" → "Pizza")
2. **Password Reset Process**:
   - Request your secret question via API
   - Provide your secret answer and new password
   - System validates and updates your password

### API Endpoints
- `GET /api/users/:username/secret-question` - Retrieve user's secret question
- `POST /api/users/forgot-password` - Reset password using secret answer

### Example Usage
```bash
# Get secret question
curl https://eastlakewolfpack.org/api/users/orchestra_booster/secret-question

# Reset password
curl -X POST https://eastlakewolfpack.org/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"username":"orchestra_booster","secretAnswer":"Pizza","newPassword":"newpassword123"}'
```

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL (Neon serverless)
- **Deployment**: Vercel serverless functions
- **File Storage**: Vercel Blob
- **Frontend**: Vanilla JavaScript, HTML, CSS

## Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` file with required environment variables
4. Run locally: `node server.js`

## API Documentation

### Authentication
- `POST /api/login` - User login
- `GET /api/session` - Validate session
- `GET /api/users/:username/secret-question` - Get secret question
- `POST /api/users/forgot-password` - Reset password

### Booster Clubs
- `GET /api/booster-clubs` - List all clubs
- `GET /api/booster-clubs/:name` - Get specific club
- `PUT /api/booster-clubs/:name/description` - Update description
- `PUT /api/booster-clubs/:name/website` - Update website URL

### Volunteers
- `GET /api/volunteers` - List volunteers
- `POST /api/volunteers` - Add volunteer
- `PUT /api/volunteers/:id` - Update volunteer status

### Insurance Forms
- `GET /api/insurance` - List insurance forms
- `POST /api/insurance` - Submit insurance form
- `PUT /api/insurance/:id` - Update insurance status
- `DELETE /api/insurance/:id` - Delete insurance submission

### News
- `GET /api/news` - List all news
- `GET /api/news/published` - List published news
- `POST /api/news` - Add news article
- `PUT /api/news/:id` - Update news
- `POST /api/news/:id/publish` - Publish news
- `DELETE /api/news/:id` - Delete news

### Links
- `GET /api/links` - List visible links
- `GET /api/links/all` - List all links
- `POST /api/links` - Add link
- `PUT /api/links/:id` - Update link
- `DELETE /api/links/:id` - Delete link

## Security Features

- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries using Neon
- **Session Management**: Secure session handling
- **Password Reset**: Secure password reset via secret questions
- **File Upload Security**: Validated file types and sizes
- **Role-Based Access**: Different access levels for admin and booster club users

## Development

### Testing
- Unit tests: `npm test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`

### Database Migrations
- Schema updates: `node database/migrate.js`
- Data migration: `node database/migrate-data.js`

### Backup Management
- Automated nightly backups
- Manual backup creation and restoration
- Database size monitoring

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch. The production database uses Neon PostgreSQL for serverless compatibility.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly (locally and in production)
4. Submit a pull request

## License

This project is proprietary to the Eastlake Wolfpack Association. 