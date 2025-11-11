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

// sdk login
const fountain = new FountainSDK(FOUNTAIN_URL, EMAIL);
console.log(await fountain.getToken());

// create Trustline
const tx = await fountain.prepareStablecoin({
  stablecoinCode: STABLECOIN_CODE,
  amountBRL: AMOUNT_BRL,
  issuerAddress: FOUNTAIN_ADDRESS,
});
const txSigned = wallet.sign(tx);
const trustlineResult = await fountain.submitAndWait(txSigned.tx_blob);
console.log(trustlineResult);

// create stablecoin
const response = await fountain.createStablecoin({
  amountBRL: AMOUNT_BRL,
  clientId: CLIENT_ID,
  clientName: CLIENT_NAME,
  stablecoinCode: STABLECOIN_CODE,
  depositType: 'XRP',
  webhookUrl: WEBHOOK_URL,
});
console.log(response);

// deposit in temp wallet
await partialDeposit(wallet, response.wallet, response.amountXRP);

async function partialDeposit(wallet, destination, amount) {
  const client = new xrpl.Client(NETWORK_URL);
  await client.connect();

  const total = Number(amount);
  for (const amt of [total / 2, total / 2]) {
    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: destination,
      Amount: xrpl.xrpToDrops(amt),
    };
    
    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    
    console.log('Tx hash:', result.result?.hash);
    console.log('Payment result:',
      result.result?.meta?.TransactionResult || result.result?.engine_result,
    );
  }
  await client.disconnect();
}
