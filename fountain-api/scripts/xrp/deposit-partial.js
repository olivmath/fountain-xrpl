//import SDK
const {
  FountainSDK,
  xrpl,
} = require('../../../sdks/typescript/dist/fountain-sdk');

// setup constants (imported)
const {
  NETWORK_URL,
  CLIENT_SECRET,
  FOUNTAIN_URL,
  EMAIL,
  CLIENT_NAME,
  CLIENT_ID,
  STABLECOIN_CODE,
  AMOUNT_BRL,
  WEBHOOK_URL,
  WEBHOOK_TYPE,
  FOUNTAIN_ADDRESS,
} = require('./constants');

// setup wallet
const wallet = xrpl.Wallet.fromSecret(CLIENT_SECRET);

// helper to convert 4+ char currency codes to XRPL 160-bit hex
function toCurrencyHex(code) {
  if (!code || code.length <= 3) return code;
  const bytes = Buffer.from(code, 'ascii');
  const padded = Buffer.concat([bytes, Buffer.alloc(20 - bytes.length, 0)]);
  return padded.toString('hex').toUpperCase();
}

// run main flow without top-level await
(async () => {
  // sdk login
  const fountain = new FountainSDK(FOUNTAIN_URL, EMAIL);
  console.log(await fountain.getToken());

  // create Trustline
  const currencyHex = toCurrencyHex(STABLECOIN_CODE);
  const tx = await fountain.prepareStablecoin({
    clientAddress: wallet.address,
    stablecoinCode: currencyHex,
    issuerAddress: FOUNTAIN_ADDRESS,
  });
  const txSigned = wallet.sign(tx);
  // use a local XRPL client to submit and disconnect properly
  const trustClient = new xrpl.Client(NETWORK_URL);
  await trustClient.connect();
  const trustlineResult = await trustClient.submitAndWait(txSigned.tx_blob);
  await trustClient.disconnect();
  console.log(trustlineResult);

  // create stablecoin
  const response = await fountain.createStablecoin({
    amountBrl: AMOUNT_BRL,
    clientId: CLIENT_ID,
    clientName: CLIENT_NAME,
    stablecoinCode: STABLECOIN_CODE,
    companyWallet: wallet.address,
    depositType: 'XRP',
    webhookUrl: WEBHOOK_URL,
    webhookType: WEBHOOK_TYPE,
  });
  console.log(response);

  // deposit in temp wallet (partial: 50% + 50%)
  await partialDeposit(wallet, response.wallet, response.amountXRP);
  // ensure process exits after all async operations
  process.exit(0);
})().catch((err) => {
  console.error('Partial deposit script failed:', err);
  process.exit(1);
});

async function partialDeposit(wallet, destination, amount) {
  const client = new xrpl.Client(NETWORK_URL);
  await client.connect();
  const total = Number(amount);
  const first = Math.floor((total / 2) * 1e6) / 1e6;
  const second = Number((total - first).toFixed(6));
  for (const amt of [first, second]) {
    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: destination,
      Amount: xrpl.xrpToDrops(amt.toFixed(6)),
    };

    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    console.log('Tx hash:', result.result?.hash);
    console.log(
      'Payment result:',
      result.result?.meta?.TransactionResult || result.result?.engine_result,
    );
  }
  await client.disconnect();
}
