// Burn stablecoin and redeem collateral
// Config: set JWT or EMAIL to auto-login, plus stablecoinId and amount
// Usage: STABLECOIN_ID=<uuid> AMOUNT_BRL=5000 node scripts/burn.js

const axios = require('axios');

const API_URL = '';
const JWT = '';
const EMAIL = '';

const STABLECOIN_ID = '';
const CURRENCY_CODE = '';
const AMOUNT_BRL = '';
const RETURN_ASSET = '';
const WEBHOOK_URL = '';

async function getJwt() {
  if (JWT) return JWT;
  const { data } = await axios.post(`${API_URL}/api/v1/auth`, { email: EMAIL });
  return data.jwt;
}

async function main() {
  try {
    if (!STABLECOIN_ID) throw new Error('Provide STABLECOIN_ID');
    const token = await getJwt();
    const headers = { Authorization: `Bearer ${token}` };
    const body = {
      stablecoinId: STABLECOIN_ID,
      currencyCode: CURRENCY_CODE,
      amountBrl: AMOUNT_BRL,
      returnAsset: RETURN_ASSET,
      webhookUrl: WEBHOOK_URL,
    };

    const { data } = await axios.post(`${API_URL}/api/v1/stablecoin/burn`, body, { headers });
    console.log('Burn result:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Burn failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

main();