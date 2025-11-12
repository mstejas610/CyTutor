// API Configuration
// Change this to your production API URL when deploying
const CONFIG = {
  API_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/auth'
    : 'https://your-production-api.com/api/auth'
};
