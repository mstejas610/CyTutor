# CyTutor Setup Documentation

## 🎯 Project Overview

CyTutor is a hands-on cybersecurity learning platform designed to provide interactive challenges and educational content similar to HackTheBox, TryHackMe, and PortSwigger Labs. This B.Tech Computer Science and Engineering (Cyber Security) project is developed by Team #06 at TIFAC-CORE in Cyber Security, Amrita School of Computing.

## 📋 Prerequisites

Before setting up CyTutor, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **Docker** (v20.10 or higher)
- **Docker Compose** (v1.29 or higher)
- **PostgreSQL** (v12 or higher)
- **Git**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

## 🏗️ Project Structure

```
CyTutor/
├── UI/                          # Frontend interface files
│   ├── index.html              # Landing page
│   ├── login.html              # User login page
│   ├── signup.html             # User registration page
│   ├── dashboard.html          # User dashboard
│   ├── challenges.html         # Challenge listing page
│   ├── domains.html            # Domain categorization
│   └── cytutor_redesign.html   # Redesigned interface
├── Challenges/                  # Security challenges directory
│   ├── WEB/                    # Web security challenges
│   │   └── secret/             # Example web challenge
│   ├── DOS/                    # Denial of Service challenges
│   └── Privilage_Escalation/   # Privilege escalation challenges
├── README.md                   # Project documentation
└── SETUP.md                    # This setup guide
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/mstejas610/CyTutor.git
cd CyTutor
```

### 2. Set Up Local Development Server

For basic frontend development:

```bash
# Navigate to UI directory
cd UI

# Start a simple HTTP server (Python 3)
python -m http.server 8000

# OR using Node.js (if you have http-server installed)
npx http-server -p 8000

# OR using PHP
php -S localhost:8000
```

Access the application at `http://localhost:8000`

### 3. Database Setup (PostgreSQL)

```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE cytutor;
CREATE USER cytutor_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cytutor TO cytutor_user;
\q
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cytutor
DB_USER=cytutor_user
DB_PASSWORD=your_secure_password

# Application Configuration
APP_PORT=3000
APP_ENV=development
SESSION_SECRET=your_session_secret_key

# Challenge Configuration
CHALLENGE_BASE_PORT=4000
```

## 🐳 Docker Setup

### Building and Running Individual Challenges

Each challenge in the `Challenges/` directory can be run independently using Docker.

#### Example: Web Secret Challenge

```bash
# Navigate to the challenge directory
cd Challenges/WEB/secret

# Build the Docker image
docker build -t cytutor-web-secret .

# Run the challenge container
docker run -d -p 4001:3000 --name web-secret cytutor-web-secret

# Access the challenge at http://localhost:4001
```

#### Challenge Management Commands

```bash
# List running challenge containers
docker ps --filter "name=cytutor-*"

# Stop a specific challenge
docker stop web-secret

# Remove a challenge container
docker rm web-secret

# View challenge logs
docker logs web-secret
```

### Docker Compose for Full Platform (Future Implementation)

Create a `docker-compose.yml` file for the complete platform:

```yaml
version: '3.8'

services:
  database:
    image: postgres:13
    environment:
      POSTGRES_DB: cytutor
      POSTGRES_USER: cytutor_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  web:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - database
    environment:
      - DB_HOST=database
      - DB_NAME=cytutor
      - DB_USER=cytutor_user
      - DB_PASSWORD=${DB_PASSWORD}
    volumes:
      - ./UI:/app/public

volumes:
  postgres_data:
```

## 🔧 Development Workflow

### 1. Frontend Development

```bash
# Navigate to UI directory
cd UI

# Make changes to HTML/CSS/JS files
# Test changes in browser at http://localhost:8000

# For CSS changes, modify the embedded styles in HTML files
# For JavaScript changes, modify the embedded scripts
```

### 2. Challenge Development

```bash
# Create a new challenge directory
mkdir -p Challenges/CATEGORY/challenge-name

# Required files for each challenge:
# - Description.md (challenge description and setup)
# - dockerfile (container configuration)
# - server.js or main application file
# - writeup.md (solution documentation)
# - public/ (static assets if needed)
```

### 3. Testing Challenges

```bash
# Build and test challenge locally
cd Challenges/CATEGORY/challenge-name
docker build -t test-challenge .
docker run -p 4000:3000 test-challenge

# Test the challenge functionality
# Document the solution in writeup.md
```

## 📊 Database Schema (Planned)

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Progress Table
```sql
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    challenge_id INTEGER REFERENCES challenges(id),
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, challenge_id)
);
```

## 🔐 Security Considerations

### Password Security
- Use bcrypt or Argon2 for password hashing
- Implement password strength requirements
- Add rate limiting for login attempts

### Session Management
- Use secure session cookies
- Implement session timeout
- Secure session storage

### Challenge Isolation
- Each challenge runs in its own Docker container
- Network isolation between challenges
- Resource limits for containers

## 🚀 Deployment

### Development Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy with production configuration
docker-compose -f docker-compose.prod.yml up -d

# Set up reverse proxy (nginx) for HTTPS
# Configure domain and SSL certificates
```

## 📝 Current Issues & Roadmap

### Active Issues (as of Sept 2025)
1. **UI Consistency** - Standardize design language across all pages
2. **User Authentication** - Implement PostgreSQL-based authentication
3. **Privilege Escalation Challenge** - Deploy containerized challenge
4. **Challenge Library Expansion** - Add 3-5 new challenges
5. **Header Consistency** - Standardize header CSS

### Future Enhancements
- [ ] Real-time challenge monitoring
- [ ] User progress tracking
- [ ] Leaderboard system
- [ ] Challenge hints system
- [ ] Discussion forums
- [ ] Mobile responsive design
- [ ] API endpoints for external integrations

## 🤝 Contributing

### Development Guidelines
1. Follow consistent code formatting
2. Test all changes locally before committing
3. Write clear commit messages
4. Update documentation for new features
5. Ensure challenges are properly containerized

### Submitting Changes
```bash
# Create a feature branch
git checkout -b feature/new-challenge

# Make your changes
git add .
git commit -m "feat: add new web security challenge"

# Push changes
git push origin feature/new-challenge

# Create a pull request on GitHub
```

## 📞 Support & Contact

- **Team Lead**: [Sai Tejas M](https://github.com/mstejas610)
- **Team Members**: 
  - [Asrita NL](https://github.com/luckyasrita-16)
  - [Chinni Nagasree Hansica](https://github.com/HansicaChinni)
  - [Tangella Sree Chandan](https://github.com/sreechandan5956)
- **Institution**: TIFAC-CORE in Cyber Security, Amrita School of Computing
- **Mentor**: Sitaram Chamarty, Professor of Practice

## 📄 License

This project is part of academic coursework for B.Tech Computer Science and Engineering (Cyber Security) at Amrita Vishwa Vidyapeetham.

---

**Note**: This is an active development project. Some features mentioned in this documentation may not be fully implemented yet. Please refer to the current issues and roadmap for the latest development status.