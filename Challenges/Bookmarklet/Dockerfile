# Use lightweight official Python image
FROM python:3.11-slim

# Create a non-root user (security best practice)
RUN adduser --disabled-password --gecos "" ctfuser

# Set working directory inside the container
WORKDIR /app

# Copy dependencies first for Docker caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all remaining app files
COPY . .

# Change ownership of files
RUN chown -R ctfuser:ctfuser /app

# Switch to the non-root user
USER ctfuser

# Expose Flask port
EXPOSE 5000

# Command to run the app
CMD ["python", "app.py"]
