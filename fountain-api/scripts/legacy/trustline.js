// Establish a trustline from holder wallet to RLUSD issuer on XRPL Testnet
// Usage:
//   SOURCE_SEED=<seed> LIMIT_RLUSD=10000 node scripts/trustline.js
// Optional:
//   NETWORK_URL=wss://s.altnet.rippletest.net:51233 RLUSD_ISSUER=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV

const xrpl = require('xrpl');

async function main() {
  const SOURCE_SEED = '';
  const LIMIT_RLUSD = '';
  const NETWORK_URL = '';
  const RLUSD_ISSUER = '';

  if (!SOURCE_SEED) {
    console.error('Missing SOURCE_SEED');
    process.exit(1);
  }

  const client = new xrpl.Client(NETWORK_URL);
  await client.connect();
  const wallet = xrpl.Wallet.fromSecrete(SOURCE_SEED);

  const trustSet = {
    TransactionType: 'TrustSet',
    Account: wallet.address,
    LimitAmount: {
      currency: 'RLUSD',
      issuer: RLUSD_ISSUER,
      value: LIMIT_RLUSD,
    },
  };

  const prepared = await client.autofill(trustSet);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log('TrustSet result:', result.result?.meta?.TransactionResult || result.result?.engine_result);
  console.log('Tx hash:', result.result?.hash);

  await client.disconnect();
}

main().catch((e) => {
  console.error('Trustline setup failed:', e?.message || e);
  process.exit(1);
});