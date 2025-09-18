# CyTutor Authentication System

## 🎯 Overview

This branch (`auth`) implements a complete authentication system for CyTutor with:

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Tailwind CSS
- **Authentication**: JWT-based with secure session management
- **Security**: bcrypt password hashing, rate limiting, input validation
- **Database**: PostgreSQL with optimized schema
- **Deployment**: Docker Compose for full-stack development

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Express Backend│    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Port 5432)   │
│                 │    │                 │    │                 │
│ • Authentication│    │ • JWT Auth      │    │ • User Data     │
│ • Protected Routes│   │ • API Endpoints │    │ • Challenge Data│
│ • Modern UI     │    │ • Rate Limiting │    │ • Progress Track│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **PostgreSQL 14+**
- **Docker & Docker Compose** (recommended)
- **Git**

### Option 1: Docker Compose (Recommended)

1. **Clone the repository and switch to auth branch:**
   ```bash
   git clone https://github.com/mstejas610/CyTutor.git
   cd CyTutor
   git checkout auth
   ```

2. **Set up environment variables:**
   ```bash
   # Copy example environment file
   cp backend/.env.example backend/.env
   
   # Edit the .env file with your settings
   nano backend/.env
   ```

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Option 2: Manual Setup

#### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up PostgreSQL database
psql -U postgres
CREATE DATABASE cytutor;
CREATE USER cytutor_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cytutor TO cytutor_user;
\q

# Start the server
npm run dev
```

#### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## 🔐 Authentication Features

### User Registration
- ✅ Secure password validation (8+ chars, uppercase, lowercase, number, special)
- ✅ Email format validation
- ✅ Username uniqueness check
- ✅ Real-time password strength indicator
- ✅ Form validation with error handling

### User Login
- ✅ JWT token-based authentication
- ✅ HTTP-only secure cookies
- ✅ Rate limiting (5 attempts per 15 minutes)
- ✅ "Remember me" functionality
- ✅ Auto-logout on token expiration

### Security Features
- ✅ bcrypt password hashing (12 rounds)
- ✅ JWT token validation
- ✅ Protected routes middleware
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Input sanitization and validation
- ✅ SQL injection prevention

### User Experience
- ✅ Modern dark theme UI
- ✅ Responsive design (mobile-friendly)
- ✅ Loading states and error handling
- ✅ Toast notifications
- ✅ Protected route redirects
- ✅ Auto-authentication on page refresh

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'student',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Challenges Table
```sql
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    description TEXT,
    flag VARCHAR(255) NOT NULL,
    points INTEGER DEFAULT 100,
    docker_image VARCHAR(200),
    port INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Progress Table
```sql
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE,
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 1,
    hints_used INTEGER DEFAULT 0,
    UNIQUE(user_id, challenge_id)
);
```

## 🛡️ API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/profile` | Get user profile | Yes |
| GET | `/api/auth/verify` | Verify JWT token | Yes |

### Challenge Routes (Protected)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/challenges` | Get all challenges | Yes |
| GET | `/api/challenges/:id` | Get specific challenge | Yes |
| POST | `/api/challenges/:id/submit` | Submit flag | Yes |
| GET | `/api/challenges/user/progress` | Get user progress | Yes |
| POST | `/api/challenges` | Create challenge (admin) | Yes (Admin) |
| PUT | `/api/challenges/:id` | Update challenge (admin) | Yes (Admin) |

## 🎨 Frontend Components

### Layout Components
- `Navbar` - Navigation with auth states
- `Footer` - Footer with team information

### UI Components
- `LoadingSpinner` - Loading indicators
- `LoadingOverlay` - Full-page loading

### Pages
- `HomePage` - Landing page (public)
- `LoginPage` - User authentication
- `RegisterPage` - User registration
- `DashboardPage` - User dashboard (protected)
- `ChallengesPage` - Challenge listing (protected)
- `ChallengePage` - Individual challenge (protected)
- `ProfilePage` - User profile (protected)

### Context
- `AuthContext` - Global authentication state management

## 🧪 Testing the System

### 1. Registration Flow
```bash
# Test registration endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login Flow
```bash
# Test login endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

### 3. Protected Route Access
```bash
# Test protected endpoint (replace TOKEN with actual JWT)
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Development

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Run without hot reload
npm start
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Database Management
```bash
# Connect to database
psql -h localhost -U cytutor_user -d cytutor

# View all tables
\dt

# View users
SELECT * FROM users;

# Reset database (careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **JWT Token Issues**
   - Check JWT_SECRET in `.env`
   - Verify token expiration settings
   - Clear browser cookies

3. **CORS Errors**
   - Check FRONTEND_URL in backend `.env`
   - Verify axios baseURL in frontend

4. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   
   # Kill process on port 5000
   lsof -ti:5000 | xargs kill -9
   ```

### Logs and Debugging

```bash
# View Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Check database status
docker-compose exec database pg_isready -U cytutor_user

# Access database shell
docker-compose exec database psql -U cytutor_user -d cytutor
```

## 🔄 Next Steps

1. **Merge to Main Branch**
   ```bash
   git checkout main
   git merge auth
   git push origin main
   ```

2. **Add Challenge Management**
   - Challenge CRUD operations
   - Docker integration for challenges
   - Progress tracking

3. **Enhanced Features**
   - Password reset functionality
   - Email verification
   - Two-factor authentication
   - Admin dashboard
   - User roles and permissions

4. **Production Deployment**
   - Environment-specific configurations
   - SSL/TLS setup
   - Database optimization
   - Monitoring and logging

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## 👥 Team Information

**Team #06 - CyTutor**
- [Sai Tejas M](https://github.com/mstejas610) - Team Lead
- [Asrita NL](https://github.com/luckyasrita-16)
- [Chinni Nagasree Hansica](https://github.com/HansicaChinni) 
- [Tangella Sree Chandan](https://github.com/sreechandan5956)

**Institution**: TIFAC-CORE in Cyber Security, Amrita School of Computing  
**Mentor**: Sitaram Chamarty, Professor of Practice  
**Project**: B.Tech Computer Science and Engineering (Cyber Security)

---

⚡ **Ready to secure the digital world, one challenge at a time!** ⚡