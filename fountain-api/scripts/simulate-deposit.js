// Simulate a deposit by sending XRP to the temporary wallet
// Config: set SOURCE_SECRET and STABLECOIN_ID (or DESTINATION_ADDRESS directly)
// Usage:
//   SOURCE_SEED=<seed> STABLECOIN_ID=<uuid> AMOUNT_XRP=10 node scripts/simulate-deposit.js
//   or provide DESTINATION_ADDRESS directly

const axios = require('axios');
const xrpl = require('xrpl');

const API_URL = 'http://localhost:3000';
const JWT = null;
const EMAIL = 'admin@sonica.com';

const SOURCE_SECRET = ""
const STABLECOIN_ID = ""
const DESTINATION_ADDRESS = ""
const AMOUNT_XRP = ""
const NETWORK_URL = 'wss://s.altnet.rippletest.net/';

async function getJwt() {
  if (JWT) return JWT;
  const { data } = await axios.post(`${API_URL}/api/v1/auth`, { email: EMAIL });
  return data.jwt;
}

async function resolveTempWallet() {
  if (DESTINATION_ADDRESS) return DESTINATION_ADDRESS;
  if (!STABLECOIN_ID) throw new Error('Provide STABLECOIN_ID or DESTINATION_ADDRESS');
  const token = await getJwt();
  const headers = { Authorization: `Bearer ${token}` };
  const { data } = await axios.get(`${API_URL}/api/v1/stablecoin/${STABLECOIN_ID}`, { headers });
  const meta = data?.metadata || data?.metadata_json || {}; // depending on serialization
  const addr = meta.tempWalletAddress;
  if (!addr) throw new Error('tempWalletAddress not found in stablecoin metadata');
  return addr;
}

async function sendXrp(destination) {
  if (!SOURCE_SECRET) throw new Error('Missing SOURCE_SECRET');
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
    console.log('Destination (temp wallet):', destination);
    await sendXrp(destination);
  } catch (e) {
    console.error('Simulate deposit failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

main();