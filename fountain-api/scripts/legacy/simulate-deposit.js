// Simula depósito enviando XRP nativo para a carteira temporária
// Requisitos:
// - Carteira de origem ativa (≥1 XRP)
// - Destino é a carteira temporária criada pela API
// Configuração: defina SOURCE_SEED
// Uso:
//   SOURCE_SEED=<seed> AMOUNT_XRP=10 NETWORK_URL=wss://s.altnet.rippletest.net:51233 node scripts/simulate-deposit.js
//   ou forneça TEMP_WALLET_DEPOSIT diretamente

const axios = require('axios');
const xrpl = require('xrpl');

const NETWORK_URL = 'wss://s.altnet.rippletest.net:51233';
const API_URL = 'http://localhost:3000';
const EMAIL = 'admin@sonica.com';
const JWT = null;

const TEMP_WALLET_DEPOSIT = 'rLtmJKKpxdHZRatZUoV5PcyXu6vHbmj4rj';
const SOURCE_SECRET = 'sEdVGUQRj69pCpU1yScvu8UDJvWPrrY';
const AMOUNT_XRP = '7';

async function getJwt() {
  if (JWT) return JWT;
  const { data } = await axios.post(`${API_URL}/api/v1/auth`, { email: EMAIL });
  return data.jwt;
}

async function resolveTempWallet() {
  if (TEMP_WALLET_DEPOSIT) return TEMP_WALLET_DEPOSIT;
  throw new Error('Forneça TEMP_WALLET_DEPOSIT');
}

// Não é necessário trustline para XRP nativo

async function sendXrp(destination) {
  if (!SOURCE_SECRET) throw new Error('Faltando SOURCE_SEED');
  const client = new xrpl.Client(NETWORK_URL);
  await client.connect();
  const wallet = xrpl.Wallet.fromSecret(SOURCE_SECRET);
  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: destination,
    Amount: xrpl.xrpToDrops(AMOUNT_XRP),
  };

  const prepared = await client.autofill(payment);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log('Payment result:', result.result?.meta?.TransactionResult || result.result?.engine_result);
  console.log('Tx hash:', result.result?.hash);
  await client.disconnect();
}

async function main() {
  try {
    const destination = await resolveTempWallet();
    console.log('Destino (carteira temporária):', destination);
    await sendXrp(destination);
  } catch (e) {
    console.error('Falha ao simular depósito:', e.response?.data || e.message);
    process.exit(1);
  }
}

main();