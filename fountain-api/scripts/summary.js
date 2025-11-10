// Fetch company financial summary
// Config: set JWT or EMAIL to auto-login
// Usage: node scripts/summary.js [fromISO] [toISO]

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT = process.env.JWT || null;
const EMAIL = process.env.EMAIL || 'admin@sonica.com';

async function getJwt() {
  if (JWT) return JWT;
  const { data } = await axios.post(`${API_URL}/api/v1/auth`, { email: EMAIL });
  return data.jwt;
}

async function main() {
  try {
    const token = await getJwt();
    const headers = { Authorization: `Bearer ${token}` };
    const from = process.argv[2] || null;
    const to = process.argv[3] || null;

    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    const { data } = await axios.get(`${API_URL}/api/v1/companies/${encodeURIComponent(EMAIL)}/summary`, {
      headers,
      params,
    });
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Summary failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

main();