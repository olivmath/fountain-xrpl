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
  FOUNTAIN_ADDRESS,
} = require('./constants');

// setup wallet
const wallet = xrpl.Wallet.fromSecret(CLIENT_SECRET);

// sdk login & main flow (wrap awaits)
const fountain = new FountainSDK(FOUNTAIN_URL, EMAIL);

(async () => {
  try {
    // create Trustline
    const tx = await fountain.prepareStablecoin({
      clientAddress: wallet.address,
      stablecoinCode: toCurrencyHex(STABLECOIN_CODE),
      issuerAddress: FOUNTAIN_ADDRESS,
    });
    const txSigned = wallet.sign(tx);
    const result = await fountain.submitAndWait(txSigned.tx_blob);
    console.log(result);

    // create stablecoin
    const response = await fountain.createStablecoin({
      clientId: CLIENT_ID,
      companyWallet: wallet.address,
      clientName: CLIENT_NAME,
      stablecoinCode: STABLECOIN_CODE,
      amount: AMOUNT_BRL,
      depositType: 'XRP',
      webhookUrl: WEBHOOK_URL,
    });
    console.log(response);

    // deposit in temp wallet
    await deposit(wallet, response.wallet, response.amountXRP);
  } catch (err) {
    console.error('Deposit script error:', err);
    process.exit(1);
  }
})();

async function deposit(wallet, destination, amount) {
  const client = new xrpl.Client(NETWORK_URL);
  await client.connect();
  const payment = {
    TransactionType: 'Payment',
    Account: wallet.address,
    Destination: destination,
    Amount: xrpl.xrpToDrops(amount),
  };

  const prepared = await client.autofill(payment);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  console.log('Tx hash:', result.result?.hash);
  console.log(
    'Payment result:',
    result.result?.meta?.TransactionResult || result.result?.engine_result,
  );
  await client.disconnect();
}

function toCurrencyHex(code) {
  if (typeof code !== 'string') return code;
  if (code.length === 3) return code;
  const hex = Buffer.from(code, 'ascii').toString('hex').toUpperCase();
  const padded = (hex + '0'.repeat(40 - hex.length)).slice(0, 40);
  return padded;
}
