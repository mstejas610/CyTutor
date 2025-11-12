# CyTutor Frontend

Frontend UI for CyTutor with integrated authentication.

## Setup

1. Make sure the backend is running on `http://localhost:5000`
2. Open `index.html` or any page in a browser
3. For development, you can use a simple HTTP server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

Then visit `http://localhost:8080`

## Authentication Flow

1. **Sign Up** (`signup.html`)
   - User enters name, email, and password
   - Backend sends OTP to email
   - Redirects to OTP verification

2. **Verify OTP** (`verify-otp.html`)
   - User enters 6-digit OTP from email
   - On success, receives JWT token
   - Redirects to dashboard

3. **Login** (`Login.html`)
   - User enters email and password
   - Receives JWT token on success
   - Redirects to dashboard

4. **Protected Pages**
   - Token stored in localStorage
   - Sent with API requests via Authorization header

## Files

- `js/auth.js` - Authentication API functions
- `js/config.js` - API configuration
- `Login.html` - Login page
- `signup.html` - Registration page
- `verify-otp.html` - OTP verification page
- `dashboard.html` - Protected dashboard (requires auth)

## API Integration

The frontend connects to the backend at `http://localhost:5000/api/auth`

To change the API URL, edit `js/auth.js` and update the `API_URL` constant.

## Notes

- JWT token is stored in localStorage
- Token is automatically included in API requests
- Use `isAuthenticated()` to check if user is logged in
- Use `logout()` to clear session and redirect to login
