// Create a new stablecoin mint operation
// Config: set JWT or EMAIL to auto-login, plus body params
// Usage: node scripts/create-stablecoin.js

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT = process.env.JWT || null;
const EMAIL = process.env.EMAIL || 'admin@fountain.com';

// Payload config
const CLIENT_ID = process.env.CLIENT_ID || 'client-123';
const COMPANY_WALLET = process.env.COMPANY_WALLET || 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr';
const CLIENT_NAME = process.env.CLIENT_NAME || 'Test Client';
const CURRENCY_CODE = process.env.CURRENCY_CODE || 'PABRL';
const AMOUNT_BRL = parseFloat(process.env.AMOUNT_BRL || '13000');
const DEPOSIT_TYPE = process.env.DEPOSIT_TYPE || 'RLUSD'; // 'RLUSD' or 'PIX'
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/mock-webhook';

async function getJwt() {
  if (JWT) return JWT;
  const { data } = await axios.post(`${API_URL}/api/v1/auth`, { email: EMAIL });
  return data.jwt;
}

async function main() {
  try {
    const token = await getJwt();
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      clientId: CLIENT_ID,
      companyWallet: COMPANY_WALLET,
      clientName: CLIENT_NAME,
      currencyCode: CURRENCY_CODE,
      amount: AMOUNT_BRL,
      depositType: DEPOSIT_TYPE,
      webhookUrl: WEBHOOK_URL,
    };

    const { data } = await axios.post(`${API_URL}/api/v1/stablecoin`, body, { headers });
    console.log('Stablecoin created:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Create stablecoin failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

main();