# Use Node.js 18 LTS Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && \
    npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S reactjs && \
    adduser -S cytutor -u 1001

# Change ownership
RUN chown -R cytutor:reactjs /app

# Switch to non-root user
USER cytutor

# Expose port
EXPOSE 3000

# Start the development server
CMD ["npm", "start"]