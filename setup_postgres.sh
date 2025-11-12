#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== CyTutor PostgreSQL Setup ===${NC}\n"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL not found. Installing...${NC}"
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Start PostgreSQL service
echo -e "${GREEN}Starting PostgreSQL service...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database configuration
DB_NAME="cytutor_db"
DB_USER="cytutor_user"
DB_PASSWORD=$(openssl rand -base64 32)

echo -e "${GREEN}Creating database and user...${NC}"

# Create database and user
sudo -u postgres psql <<EOF
-- Create user
CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';

-- Create database
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};

\c ${DB_NAME}

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    otp VARCHAR(6),
    otp_expiry TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant table privileges
GRANT ALL PRIVILEGES ON TABLE users TO ${DB_USER};
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO ${DB_USER};

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

\q
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database setup completed successfully!${NC}\n"
else
    echo -e "${RED}Database setup failed!${NC}"
    exit 1
fi

# Navigate to backend directory
cd backend

# Install Node.js dependencies
echo -e "${GREEN}Installing Node.js dependencies...${NC}"
npm install

# Create .env file
echo -e "${GREEN}Creating .env file...${NC}"

JWT_SECRET=$(openssl rand -base64 32)

cat > .env <<EOF
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=24h

# Email (Configure with your email provider)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here

# OTP
OTP_EXPIRE_MINUTES=10
EOF

echo -e "${GREEN}=== Setup Complete ===${NC}\n"
echo -e "${YELLOW}IMPORTANT: Save these credentials securely!${NC}\n"
echo -e "Database Name: ${GREEN}${DB_NAME}${NC}"
echo -e "Database User: ${GREEN}${DB_USER}${NC}"
echo -e "Database Password: ${GREEN}${DB_PASSWORD}${NC}"
echo -e "JWT Secret: ${GREEN}${JWT_SECRET}${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Edit ${GREEN}backend/.env${NC} and configure your email settings"
echo -e "   - For Gmail: Enable 2FA and create an App Password"
echo -e "   - Use the App Password in EMAIL_PASSWORD field"
echo -e "2. Run: ${GREEN}cd backend && npm start${NC}"
echo -e "3. API will be available at: ${GREEN}http://localhost:5000${NC}\n"

echo -e "${YELLOW}API Endpoints:${NC}"
echo -e "POST /api/auth/register - Register new user"
echo -e "POST /api/auth/verify-otp - Verify email with OTP"
echo -e "POST /api/auth/resend-otp - Resend OTP"
echo -e "POST /api/auth/login - Login user"
echo -e "GET  /api/auth/me - Get current user (requires token)\n"
