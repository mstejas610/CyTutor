# CyTutor Authentication - Quick Start Guide

## For Kali Linux Setup

### 1. Run the Setup Script

```bash
chmod +x setup_postgres.sh
./setup_postgres.sh
```

This will:
- Install PostgreSQL and Node.js (if needed)
- Create database and user with secure passwords
- Set up the users table
- Install npm dependencies
- Generate secure JWT secret
- Create `.env` file

### 2. Configure Email

Edit `backend/.env` and update email settings:

```bash
nano backend/.env
```

For Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an "App Password" for "Mail"
4. Update these lines in `.env`:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password
   ```

### 3. Start the Backend

```bash
cd backend
npm start
```

Backend will run on `http://localhost:5000`

### 4. Start the Frontend

Open a new terminal:

```bash
cd UI
python3 -m http.server 8080
```

Or use Node.js:
```bash
npx http-server -p 8080
```

Frontend will be available at `http://localhost:8080`

### 5. Test the Authentication

1. Open browser: `http://localhost:8080/signup.html`
2. Register with your email
3. Check your email for 6-digit OTP
4. Enter OTP on verification page
5. Login with your credentials

## Project Structure

```
CyTutor/
├── backend/              # Node.js backend
│   ├── config/          # Database & email config
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes
│   ├── .env             # Environment variables
│   ├── package.json     # Dependencies
│   └── server.js        # Main server file
├── UI/                  # Frontend
│   ├── js/
│   │   └── auth.js      # Auth API functions
│   ├── Login.html       # Login page
│   ├── signup.html      # Registration page
│   └── verify-otp.html  # OTP verification
└── setup_postgres.sh    # Database setup script
```

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)

## Troubleshooting

### PostgreSQL Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Port Already in Use
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### Email Not Sending
- Verify Gmail App Password is correct
- Check if 2FA is enabled on Google account
- Check backend logs for errors
- Try using a different email provider (update EMAIL_HOST and EMAIL_PORT)

### Database Connection Error
```bash
# Check database exists
sudo -u postgres psql -l

# Connect to database
sudo -u postgres psql -d cytutor_db

# Check users table
\dt
```

## Security Notes

- Never commit `.env` file to git
- Use strong passwords (min 8 characters)
- OTP expires in 10 minutes
- JWT tokens expire in 24 hours
- Rate limiting: 100 requests per 15 minutes
- Passwords hashed with bcrypt (12 rounds)

## Development

For auto-reload during development:

```bash
cd backend
npm run dev
```

This uses nodemon to restart the server on file changes.
