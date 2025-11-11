// Cria uma nova operação de mint de stablecoin
// Observação: para depósito on-chain usando apenas XRP, use depositType = 'RLUSD'
// Configuração: defina JWT ou EMAIL para auto-login, mais os parâmetros do corpo
// Uso: node scripts/create-stablecoin.js

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT = '';
const EMAIL = '';

// Payload config
const CLIENT_ID = '';
const COMPANY_WALLET = '';
const CLIENT_NAME = '';
const CURRENCY_CODE = '';
const AMOUNT_BRL = '';
// Para fluxo on-chain com XRP nativo, mantenha 'RLUSD'. PIX é off-chain.
const DEPOSIT_TYPE = process.env.DEPOSIT_TYPE || 'RLUSD';
const WEBHOOK_URL = '';

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