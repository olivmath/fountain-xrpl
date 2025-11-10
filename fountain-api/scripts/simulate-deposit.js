// Simulate a deposit by sending RLUSD (Issued Currency) to the temporary wallet
// Requirements:
// - Source wallet must be active (≥1 XRP) and have a trustline to RLUSD issuer
// - Destination is the temp wallet created by the API for the operation
// Config: set SOURCE_SEED and STABLECOIN_ID (or DESTINATION_ADDRESS directly)
// Usage:
//   SOURCE_SEED=<seed> STABLECOIN_ID=<uuid> AMOUNT_RLUSD=10 node scripts/simulate-deposit.js
//   or provide DESTINATION_ADDRESS directly

const axios = require('axios');
const xrpl = require('xrpl');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const JWT = process.env.JWT || null;
const EMAIL = process.env.EMAIL || 'admin@fountain.com';

const SOURCE_SECRET = process.env.SOURCE_SEED || process.env.SOURCE_SECRET || '';
const STABLECOIN_ID = process.env.STABLECOIN_ID || '';
const DESTINATION_ADDRESS = process.env.DESTINATION_ADDRESS || '';
const AMOUNT_RLUSD = process.env.AMOUNT_RLUSD || '10';
const NETWORK_URL = process.env.NETWORK_URL || 'wss://s.altnet.rippletest.net:51233';
const RLUSD_ISSUER = process.env.RLUSD_ISSUER || 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV';

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

async function ensureTrustline(client, wallet) {
  const lines = await client.request({ command: 'account_lines', account: wallet.address });
  const hasLine = (lines.result.lines || []).some(
    (l) => l.currency === 'RLUSD' && l.issuer === RLUSD_ISSUER,
  );
  if (not(hasLine)) {
    console.error('Missing trustline to RLUSD issuer:', RLUSD_ISSUER);
    console.error('Run trustline script first:');
    console.error('  SOURCE_SEED=<seed> LIMIT_RLUSD=10000 node scripts/trustline.js');
    throw new Error('Trustline to RLUSD issuer not found');
  }
}

function not(v) { return !v; }

async function sendRlusd(destination) {
  if (!SOURCE_SECRET) throw new Error('Missing SOURCE_SEED');
  const client = new xrpl.Client(NETWORK_URL);
  await client.connect();
  const wallet = xrpl.Wallet.fromSeed(SOURCE_SECRET);

  await ensureTrustline(client, wallet);

  const issuedAmount = {
    currency: 'RLUSD',
    issuer: RLUSD_ISSUER,
    value: AMOUNT_RLUSD,
  };

  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: destination,
    Amount: issuedAmount,
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
    await sendRlusd(destination);
  } catch (e) {
    console.error('Simulate deposit failed:', e.response?.data || e.message);
    process.exit(1);
  }
}

main();