/**
 * XRP Deposit Flow - Complete Mint Operation
 *
 * This script demonstrates the complete flow for minting stablecoins using XRP deposit:
 *
 * Flow:
 * 1. Login to Fountain API
 * 2. Create trustline from client wallet to Fountain issuer
 * 3. Create stablecoin (mint operation) with depositType='XRP'
 * 4. Receive temp wallet address from API
 * 5. Send XRP to temp wallet
 * 6. Wait for webhook notifications:
 *    - DEPOSIT_PENDING: Temp wallet created
 *    - DEPOSIT_CONFIRMED: Deposit detected
 *    - MINTED_TOKENS: Tokens minted and transferred
 *
 * Prerequisites:
 * - Webhook server running (webhook-server.js)
 * - Client wallet with XRP balance
 * - ngrok or public URL for webhooks (or use localhost for local testing)
 *
 * Usage:
 *   CLIENT_SEED=sXXX... AMOUNT_BRL=1000 CURRENCY_CODE=MYBRL node deposit.js
 *
 * Environment Variables:
 *   CLIENT_SEED       - Client wallet seed (required)
 *   AMOUNT_BRL        - Amount in BRL to mint (required)
 *   CURRENCY_CODE     - Stablecoin currency code (required)
 *   EMAIL             - Company email for login (default: 'company-1')
 *   API_URL           - Fountain API URL (default: http://localhost:3000)
 *   WEBHOOK_URL       - Webhook URL (default: http://localhost:4000/webhook)
 *   NETWORK_URL       - XRPL network (default: wss://s.altnet.rippletest.net:51233)
 *   CLIENT_NAME       - Client identifier (default: 'Test Client')
 *   CLIENT_ID         - Client ID (default: random)
 */

const { FountainSDK } = require('../../../sdks/typescript/dist/fountain-sdk');
const xrpl = require('xrpl');

// Configuration
const CONFIG = {
  clientSeed: process.env.CLIENT_SEED || '',
  amountBrl: parseFloat(process.env.AMOUNT_BRL || '1000'),
  currencyCode: process.env.CURRENCY_CODE || 'TESTBRL',
  email: process.env.EMAIL || 'company-1',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:4000/webhook',
  networkUrl: process.env.NETWORK_URL || 'wss://s.altnet.rippletest.net:51233',
  clientName: process.env.CLIENT_NAME || 'Test Client',
  clientId: process.env.CLIENT_ID || `client-${Date.now()}`,
};

// Validation
if (!CONFIG.clientSeed) {
  console.error('❌ Missing CLIENT_SEED environment variable');
  console.error('Usage: CLIENT_SEED=sXXX... AMOUNT_BRL=1000 CURRENCY_CODE=MYBRL node deposit.js');
  process.exit(1);
}

/**
 * Get wallet from seed
 */
function getWallet(seed) {
  return xrpl.Wallet.fromSeed(seed);
}

/**
 * Send XRP to temp wallet
 */
async function sendXRP(fromSeed, toAddress, amountXrp, networkUrl) {
  const client = new xrpl.Client(networkUrl);

  try {
    await client.connect();
    const wallet = xrpl.Wallet.fromSeed(fromSeed);

    console.log(`📤 Sending ${amountXrp} XRP to temp wallet...`);
    console.log(`   From: ${wallet.address}`);
    console.log(`   To: ${toAddress}`);

    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: toAddress,
      Amount: xrpl.xrpToDrops(amountXrp),
    };

    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result?.meta?.TransactionResult || result.result?.engine_result;
    const txHash = result.result?.hash;

    if (txResult === 'tesSUCCESS') {
      console.log(`✅ Payment successful!`);
      console.log(`   Tx Hash: ${txHash}`);
      return { success: true, txHash };
    } else {
      throw new Error(`Payment failed: ${txResult}`);
    }
  } catch (error) {
    console.error(`❌ Send XRP failed: ${error.message}`);
    throw error;
  } finally {
    await client.disconnect();
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Starting XRP Deposit Flow');
  console.log('━'.repeat(60));

  try {
    // Step 1: Initialize SDK and login
    console.log('\n[1/6] 🔐 Logging in to Fountain API...');
    const fountain = new FountainSDK(CONFIG.apiUrl);
    const loginResponse = await fountain.login(CONFIG.email);

    console.log(`✅ Login successful`);
    console.log(`   Company: ${loginResponse.companyName}`);
    console.log(`   Company ID: ${loginResponse.companyId}`);

    // Get client wallet
    const clientWallet = getWallet(CONFIG.clientSeed);
    console.log(`   Client Wallet: ${clientWallet.address}`);

    // Step 2: Get issuer address (we'll get this from the API response)
    console.log('\n[2/6] 🤝 Creating trustline...');
    console.log('   Note: Trustline will be created after we get issuer address from API');

    // Step 3: Create stablecoin (mint operation)
    console.log('\n[3/6] 🪙 Creating stablecoin mint operation...');
    const createResponse = await fountain.createStablecoin({
      companyId: loginResponse.companyId,
      clientId: CONFIG.clientId,
      companyWallet: clientWallet.address,
      clientName: CONFIG.clientName,
      currencyCode: CONFIG.currencyCode,
      amount: CONFIG.amountBrl,
      depositType: 'XRP',
      webhookUrl: CONFIG.webhookUrl,
    });

    console.log(`✅ Mint operation created`);
    console.log(`   Operation ID: ${createResponse.operationId}`);
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Temp Wallet: ${createResponse.wallet}`);
    console.log(`   Amount XRP Required: ${createResponse.amountRLUSD || 'calculating...'}`);

    // Check if we got issuer address
    const issuerAddress = createResponse.issuerAddress;
    if (issuerAddress) {
      console.log(`   Issuer Address: ${issuerAddress}`);

      // Now create trustline
      console.log('\n[4/6] 🤝 Creating trustline to issuer...');
      const trustlineResult = await fountain.createTrustline({
        clientSeed: CONFIG.clientSeed,
        currencyCode: CONFIG.currencyCode,
        issuerAddress: issuerAddress,
        networkUrl: CONFIG.networkUrl,
      });

      console.log(`✅ Trustline created`);
      console.log(`   Tx Hash: ${trustlineResult.txHash}`);
      console.log(`   Result: ${trustlineResult.result}`);
    } else {
      console.log('⚠️  Issuer address not in response, trustline creation skipped');
      console.log('   You may need to create it manually later');
    }

    // Step 5: Send XRP to temp wallet
    if (createResponse.wallet) {
      const amountXrp = createResponse.amountRLUSD || 10; // Default to 10 XRP if not specified

      console.log('\n[5/6] 💸 Sending XRP to temp wallet...');
      await sendXRP(
        CONFIG.clientSeed,
        createResponse.wallet,
        amountXrp,
        CONFIG.networkUrl
      );
    } else {
      console.error('❌ No temp wallet address in response');
      process.exit(1);
    }

    // Step 6: Wait for webhooks
    console.log('\n[6/6] ⏳ Waiting for webhooks...');
    console.log('━'.repeat(60));
    console.log('Expected webhook sequence:');
    console.log('  1️⃣  DEPOSIT_PENDING   - Temp wallet created');
    console.log('  2️⃣  DEPOSIT_CONFIRMED - Deposit detected');
    console.log('  3️⃣  MINTED_TOKENS     - Tokens minted and transferred');
    console.log('━'.repeat(60));
    console.log('\n💡 Check your webhook server for notifications');
    console.log(`   Webhook URL: ${CONFIG.webhookUrl}`);
    console.log(`   Operation ID: ${createResponse.operationId}`);
    console.log('\n✨ Flow initiated successfully!');
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run
main();
