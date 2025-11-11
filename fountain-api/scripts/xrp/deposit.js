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
} = require('./constants');

// setup wallet
const wallet = xrpl.Wallet.fromSecrete(CLIENT_SECRET);

// sdk login
const fountain = new FountainSDK(FOUNTAIN_URL, EMAIL);
console.log(fountain.getToken());

// create Trustline
const tx = fountain.prepareStablecoin({
  stablecoinCode: STABLECOIN_CODE,
  amountBRL: AMOUNT_BRL,
});
const txSigned = wallet.sign(tx);
const result = await fountain.submitAndWait(txSigned.tx_blob);

// create stablecoin
const response = await fountain.createStablecoin({
  amountBRL: AMOUNT_BRL,
  clientId: CLIENT_ID,
  clientName: CLIENT_NAME,
  stablecoinCode: STABLECOIN_CODE,
  depositType: 'XRP',
  webhookUrl: WEBHOOK_URL,
});
console.log(reponse);

// deposit in temp wallet
deposit(wallet, reponse.wallet, response.amountXRP);

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
