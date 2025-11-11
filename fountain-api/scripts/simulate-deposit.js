// Simula depósito enviando XRP nativo para a carteira temporária
// Requisitos:
// - Carteira de origem ativa (≥1 XRP)
// - Destino é a carteira temporária criada pela API
// Configuração: defina SOURCE_SEED e STABLECOIN_ID (ou DESTINATION_ADDRESS)
// Uso:
//   SOURCE_SEED=<seed> OPERATION_ID=<uuid> AMOUNT_XRP=10 NETWORK_URL=wss://s.altnet.rippletest.net:51233 node scripts/simulate-deposit.js
//   ou forneça DESTINATION_ADDRESS diretamente

const axios = require('axios');
const xrpl = require('xrpl');

const NETWORK_URL = 'wss://s.altnet.rippletest.net:51233';
const API_URL = 'http://localhost:3000';
const EMAIL = process.env.EMAIL || 'admin@sonica.com';
const JWT = null;

const DESTINATION_ADDRESS = process.env.DESTINATION_ADDRESS || '';
const SOURCE_SECRET = process.env.SOURCE_SEED || '';
const AMOUNT_XRP = process.env.AMOUNT_XRP || '10';
const STABLECOIN_ID = process.env.STABLECOIN_ID || '';

async function getJwt() {
  if (JWT) return JWT;
  const { data } = await axios.post(`${API_URL}/api/v1/auth`, { email: EMAIL });
  return data.jwt;
}

async function resolveTempWallet() {
  if (DESTINATION_ADDRESS) return DESTINATION_ADDRESS;
  if (!STABLECOIN_ID) throw new Error('Forneça STABLECOIN_ID ou DESTINATION_ADDRESS');
  const token = await getJwt();
  const headers = { Authorization: `Bearer ${token}` };
  const { data } = await axios.get(`${API_URL}/api/v1/stablecoin/${STABLECOIN_ID}`, { headers });
  const meta = data?.metadata || data?.metadata_json || {}; // dependendo da serialização
  const addr = meta.tempWalletAddress;
  if (!addr) throw new Error('tempWalletAddress não encontrada no metadata do stablecoin');
  return addr;
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