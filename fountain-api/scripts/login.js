// Simple login script to get JWT for a company email
// Config: set EMAIL and API_URL
// Usage: node scripts/login.js

const axios = require('axios');

const EMAIL = process.env.EMAIL || 'admin@sonica.com';
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function main() {
  try {
    const { data } = await axios.post(`${API_URL}/api/v1/auth`, { email: EMAIL });
    console.log('JWT:', data.jwt);
    console.log('Expires:', data.expires);
  } catch (e) {
    console.error('Login failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

main();