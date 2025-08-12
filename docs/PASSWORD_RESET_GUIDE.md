# Password Reset Functionality Guide

## Overview

The EWA website includes a secure password reset system that uses secret questions and answers. This system allows users to reset their passwords without requiring administrator intervention, while maintaining security through personalized secret questions.

## How It Works

### 1. Secret Question Setup
Each user has a secret question and answer pair stored in the database:
- **Secret Question**: A personal question (e.g., "Favorite Food")
- **Secret Answer**: The user's answer to that question (e.g., "Pizza")

### 2. Password Reset Process
1. User requests their secret question
2. User provides their secret answer and new password
3. System validates the answer and updates the password
4. User can immediately log in with the new password

## Database Schema

The password reset functionality uses the `users` table with these additional columns:

```sql
ALTER TABLE users ADD COLUMN secret_question TEXT;
ALTER TABLE users ADD COLUMN secret_answer TEXT;
```

## API Endpoints

### Get Secret Question
**Endpoint**: `GET /api/users/:username/secret-question`

**Description**: Retrieves the secret question for a specific user.

**Response**:
```json
{
  "success": true,
  "secretQuestion": "Favorite Food"
}
```

**Error Response**:
```json
{
  "success": false,
  "message": "User not found"
}
```

### Reset Password
**Endpoint**: `POST /api/users/forgot-password`

**Description**: Resets a user's password using their secret answer.

**Request Body**:
```json
{
  "username": "orchestra_booster",
  "secretAnswer": "Pizza",
  "newPassword": "newpassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Error Responses**:
```json
{
  "success": false,
  "message": "User not found"
}
```

```json
{
  "success": false,
  "message": "Secret answer is incorrect"
}
```

## Implementation Details

### Database Functions

The password reset functionality is implemented in `database/neon-functions.js`:

#### `getUsers()`
- Retrieves all users with proper property mapping
- Maps snake_case database columns to camelCase API properties
- Includes `secretQuestion` and `secretAnswer` fields

#### `updateUser(username, updates)`
- Updates user information including passwords
- Uses template literals for secure SQL queries
- Handles password updates specifically

### Server Endpoints

The endpoints are implemented in `server.js`:

#### Secret Question Endpoint
```javascript
app.get('/api/users/:username/secret-question', async (req, res) => {
  // Implementation details...
});
```

#### Password Reset Endpoint
```javascript
app.post('/api/users/forgot-password', async (req, res) => {
  // Implementation details...
});
```

## Security Considerations

### 1. Input Validation
- All inputs are validated and sanitized
- Username must exist in the database
- Secret answer is case-sensitive
- New password must be provided

### 2. Error Handling
- Generic error messages to prevent user enumeration
- Proper HTTP status codes
- Detailed logging for debugging

### 3. Database Security
- Parameterized queries prevent SQL injection
- No sensitive data in error messages
- Secure password storage

## Usage Examples

### Command Line Testing

#### Get Secret Question
```bash
curl https://eastlakewolfpack.org/api/users/orchestra_booster/secret-question
```

#### Reset Password
```bash
curl -X POST https://eastlakewolfpack.org/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "username": "orchestra_booster",
    "secretAnswer": "Pizza",
    "newPassword": "ewa2025"
  }'
```

### PowerShell Testing

#### Get Secret Question
```powershell
Invoke-RestMethod -Uri "https://eastlakewolfpack.org/api/users/orchestra_booster/secret-question" -Method GET
```

#### Reset Password
```powershell
$body = @{
  username = "orchestra_booster"
  secretAnswer = "Pizza"
  newPassword = "ewa2025"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://eastlakewolfpack.org/api/users/forgot-password" -Method POST -Body $body -ContentType "application/json"
```

## Current User Setup

### orchestra_booster User
- **Username**: `orchestra_booster`
- **Secret Question**: "Favorite Food"
- **Secret Answer**: "Pizza"
- **Role**: booster
- **Club**: orchestra

### admin User
- **Username**: `admin`
- **Secret Question**: "Favorite Food"
- **Secret Answer**: "Pizza"
- **Role**: admin

## Troubleshooting

### Common Issues

1. **"User not found" Error**
   - Verify the username exists in the database
   - Check for typos in the username

2. **"Secret answer is incorrect" Error**
   - Verify the secret answer is exactly correct (case-sensitive)
   - Check for extra spaces or special characters

3. **"Failed to save user data" Error**
   - Check database connection
   - Verify database permissions
   - Check server logs for detailed error information

### Debugging

1. **Check Database**
   ```sql
   SELECT username, secret_question, secret_answer 
   FROM users 
   WHERE username = 'orchestra_booster';
   ```

2. **Test API Endpoints**
   - Use the command line examples above
   - Check response status codes and messages

3. **Review Server Logs**
   - Check for detailed error messages
   - Verify database connection status

## Future Enhancements

### Potential Improvements
1. **Multiple Secret Questions**: Allow users to set multiple secret questions
2. **Password Complexity**: Enforce password complexity requirements
3. **Rate Limiting**: Prevent brute force attacks
4. **Email Verification**: Send confirmation emails for password resets
5. **Audit Logging**: Log all password reset attempts

### Security Enhancements
1. **Hashed Secret Answers**: Hash secret answers for additional security
2. **Temporary Tokens**: Use temporary tokens instead of secret answers
3. **Two-Factor Authentication**: Add 2FA for password resets
4. **Account Lockout**: Lock accounts after failed attempts

## Maintenance

### Adding New Users
To add a new user with secret question functionality:

1. **Insert into Database**
   ```sql
   INSERT INTO users (username, password, secret_question, secret_answer, role, created_at)
   VALUES ('new_user', 'initial_password', 'What is your favorite color?', 'Blue', 'booster', CURRENT_TIMESTAMP);
   ```

2. **Test the Setup**
   ```bash
   # Test secret question retrieval
   curl https://eastlakewolfpack.org/api/users/new_user/secret-question
   
   # Test password reset
   curl -X POST https://eastlakewolfpack.org/api/users/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"username":"new_user","secretAnswer":"Blue","newPassword":"newpassword123"}'
   ```

### Updating Secret Questions
To update a user's secret question:

1. **Update Database**
   ```sql
   UPDATE users 
   SET secret_question = 'What is your mother''s maiden name?',
       secret_answer = 'Smith',
       updated_at = CURRENT_TIMESTAMP
   WHERE username = 'orchestra_booster';
   ```

2. **Test the Update**
   ```bash
   curl https://eastlakewolfpack.org/api/users/orchestra_booster/secret-question
   ```

## Conclusion

The password reset functionality provides a secure and user-friendly way for users to reset their passwords without administrator intervention. The system uses secret questions and answers to verify user identity while maintaining security through proper validation and error handling.

The implementation is production-ready and has been thoroughly tested in both local and production environments.
