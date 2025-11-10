// Simple helper to send XRP on XRPL Testnet for deposit simulation
// Usage:
//   SOURCE_SEED=<seed> DESTINATION_ADDRESS=<rAddress> AMOUNT_XRP=<xrp>
//   NETWORK_URL=wss://s.altnet.rippletest.net:51233 node scripts/send-xrp.js

const xrpl = require('xrpl');

async function main() {
  const SOURCE_SEED = process.env.SOURCE_SEED;
  const DESTINATION_ADDRESS = process.env.DESTINATION_ADDRESS;
  const AMOUNT_XRP = process.env.AMOUNT_XRP || '10';
  const NETWORK_URL = process.env.NETWORK_URL || 'wss://s.altnet.rippletest.net:51233';

  if (!SOURCE_SEED || !DESTINATION_ADDRESS) {
    console.error('Missing SOURCE_SEED or DESTINATION_ADDRESS');
    process.exit(1);
  }

  const client = new xrpl.Client(NETWORK_URL);
  await client.connect();

  const wallet = xrpl.Wallet.fromSeed(SOURCE_SEED);

  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: DESTINATION_ADDRESS,
    Amount: xrpl.xrpToDrops(AMOUNT_XRP),
  };

  const prepared = await client.autofill(payment);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log('Payment result:', result.result?.meta?.TransactionResult || result.result?.engine_result);
  console.log('Tx hash:', result.result?.hash);

  await client.disconnect();
}

main().catch((e) => {
  console.error('Error sending XRP:', e?.message || e);
  process.exit(1);
});