# CyTutor Authentication Backend

Minimal and secure authentication backend with email OTP verification.

## Features

- User registration with email verification
- OTP-based email verification using nodemailer
- Secure password hashing with bcrypt
- JWT-based authentication
- Rate limiting and security headers
- Input validation
- PostgreSQL database

## Setup

### Prerequisites
- Kali Linux (or any Debian-based system)
- PostgreSQL
- Node.js 18+

### Installation

1. Run the setup script from the project root:
```bash
chmod +x setup_postgres.sh
./setup_postgres.sh
```

2. Configure email in `backend/.env`:
   - For Gmail: Enable 2FA and create an App Password
   - Update `EMAIL_USER` and `EMAIL_PASSWORD`

3. Start the server:
```bash
cd backend
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### POST /api/auth/register
Register a new user and send OTP to email.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

### POST /api/auth/verify-otp
Verify email with OTP code.

**Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### POST /api/auth/resend-otp
Resend OTP to email.

**Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/login
Login with verified email.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### GET /api/auth/me
Get current user info (requires JWT token).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

## Security Features

- Bcrypt password hashing (12 rounds)
- JWT token authentication
- Rate limiting (100 requests per 15 minutes)
- Helmet.js security headers
- Input validation and sanitization
- OTP expiration (10 minutes)
- CORS protection

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

**users table:**
- id (SERIAL PRIMARY KEY)
- email (VARCHAR UNIQUE)
- password (VARCHAR - hashed)
- name (VARCHAR)
- otp (VARCHAR)
- otp_expiry (TIMESTAMP)
- verified (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
