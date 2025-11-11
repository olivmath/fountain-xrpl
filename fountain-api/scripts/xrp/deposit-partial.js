/**
 * XRP Partial Deposit Flow
 *
 * This script demonstrates partial deposit handling:
 * - Create mint operation requiring X XRP
 * - Make multiple partial deposits that sum to >= X
 * - System accumulates deposits and auto-mints when threshold reached
 *
 * Flow:
 * 1. Login to Fountain API
 * 2. Create trustline (if needed)
 * 3. Create mint operation requiring e.g., 100 XRP
 * 4. Make partial deposit #1 (e.g., 30 XRP)
 * 5. Make partial deposit #2 (e.g., 40 XRP)
 * 6. Make partial deposit #3 (e.g., 30 XRP) - triggers mint
 * 7. Webhook notifications track progress
 *
 * Prerequisites:
 * - Webhook server running
 * - Client wallet with sufficient XRP
 *
 * Usage:
 *   CLIENT_SEED=sXXX... TOTAL_AMOUNT=100 node deposit-partial.js
 *
 * Environment Variables:
 *   CLIENT_SEED       - Client wallet seed (required)
 *   TOTAL_AMOUNT      - Total XRP amount required (default: 100)
 *   CURRENCY_CODE     - Currency code (default: TESTBRL)
 *   EMAIL             - Company email (default: 'company-1')
 *   API_URL           - API URL (default: http://localhost:3000)
 *   WEBHOOK_URL       - Webhook URL (default: http://localhost:4000/webhook)
 *   NETWORK_URL       - XRPL network URL
 *   PARTIAL_DEPOSITS  - Comma-separated partial amounts (default: auto-split)
 */

const { FountainSDK } = require('../../../sdks/typescript/dist/fountain-sdk');
const xrpl = require('xrpl');

// Configuration
const CONFIG = {
  clientSeed: process.env.CLIENT_SEED || '',
  totalAmount: parseFloat(process.env.TOTAL_AMOUNT || '100'),
  currencyCode: process.env.CURRENCY_CODE || 'TESTBRL',
  email: process.env.EMAIL || 'company-1',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  webhookUrl: process.env.WEBHOOK_URL || 'http://localhost:4000/webhook',
  networkUrl: process.env.NETWORK_URL || 'wss://s.altnet.rippletest.net:51233',
  clientName: process.env.CLIENT_NAME || 'Partial Deposit Test',
  clientId: process.env.CLIENT_ID || `partial-${Date.now()}`,
  // Parse partial deposits from env or auto-split into 3 parts
  partialDeposits: process.env.PARTIAL_DEPOSITS
    ? process.env.PARTIAL_DEPOSITS.split(',').map(parseFloat)
    : null,
};

// Validation
if (!CONFIG.clientSeed) {
  console.error('❌ Missing CLIENT_SEED environment variable');
  console.error('Usage: CLIENT_SEED=sXXX... TOTAL_AMOUNT=100 node deposit-partial.js');
  process.exit(1);
}

/**
 * Auto-split total amount into partial deposits
 */
function generatePartialDeposits(total) {
  if (CONFIG.partialDeposits) {
    return CONFIG.partialDeposits;
  }

  // Split into 3 unequal parts to simulate real-world scenario
  const part1 = Math.floor(total * 0.3 * 100) / 100;
  const part2 = Math.floor(total * 0.4 * 100) / 100;
  const part3 = total - part1 - part2;

  return [part1, part2, part3];
}

/**
 * Send XRP payment
 */
async function sendXRP(fromSeed, toAddress, amount, networkUrl) {
  const client = new xrpl.Client(networkUrl);

  try {
    await client.connect();
    const wallet = xrpl.Wallet.fromSeed(fromSeed);

    console.log(`   📤 Sending ${amount} XRP...`);
    console.log(`      From: ${wallet.address}`);
    console.log(`      To: ${toAddress}`);

    const payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: toAddress,
      Amount: xrpl.xrpToDrops(amount),
    };

    const prepared = await client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const txResult = result.result?.meta?.TransactionResult || result.result?.engine_result;
    const txHash = result.result?.hash;

    if (txResult === 'tesSUCCESS') {
      console.log(`   ✅ Payment successful! Tx: ${txHash}`);
      return { success: true, txHash };
    } else {
      throw new Error(`Payment failed: ${txResult}`);
    }
  } finally {
    await client.disconnect();
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
  console.log('\n🚀 Starting Partial Deposit Flow');
  console.log('━'.repeat(60));

  try {
    // Step 1: Login
    console.log('\n[1/5] 🔐 Logging in...');
    const fountain = new FountainSDK(CONFIG.apiUrl);
    const loginResponse = await fountain.login(CONFIG.email);

    const clientWallet = xrpl.Wallet.fromSeed(CONFIG.clientSeed);
    console.log(`✅ Logged in as ${loginResponse.companyName}`);
    console.log(`   Client Wallet: ${clientWallet.address}`);

    // Step 2: Create mint operation
    console.log('\n[2/5] 🪙 Creating mint operation...');
    const createResponse = await fountain.createStablecoin({
      companyId: loginResponse.companyId,
      clientId: CONFIG.clientId,
      companyWallet: clientWallet.address,
      clientName: CONFIG.clientName,
      currencyCode: CONFIG.currencyCode,
      amount: CONFIG.totalAmount,
      depositType: 'XRP',
      webhookUrl: CONFIG.webhookUrl,
    });

    console.log(`✅ Mint operation created`);
    console.log(`   Operation ID: ${createResponse.operationId}`);
    console.log(`   Temp Wallet: ${createResponse.wallet}`);
    console.log(`   Total Required: ${createResponse.amountRLUSD || CONFIG.totalAmount} XRP`);

    const tempWallet = createResponse.wallet;
    const requiredAmount = createResponse.amountRLUSD || CONFIG.totalAmount;

    // Step 3: Create trustline
    if (createResponse.issuerAddress) {
      console.log('\n[3/5] 🤝 Creating trustline...');
      const trustlineResult = await fountain.createTrustline({
        clientSeed: CONFIG.clientSeed,
        currencyCode: CONFIG.currencyCode,
        issuerAddress: createResponse.issuerAddress,
        networkUrl: CONFIG.networkUrl,
      });
      console.log(`✅ Trustline created: ${trustlineResult.txHash}`);
    }

    // Step 4: Make partial deposits
    const partialAmounts = generatePartialDeposits(requiredAmount);

    console.log('\n[4/5] 💸 Making partial deposits...');
    console.log(`   Total Required: ${requiredAmount} XRP`);
    console.log(`   Partial Deposits: ${partialAmounts.join(' + ')} = ${partialAmounts.reduce((a, b) => a + b, 0)} XRP`);
    console.log('━'.repeat(60));

    let totalDeposited = 0;

    for (let i = 0; i < partialAmounts.length; i++) {
      const amount = partialAmounts[i];
      console.log(`\n💰 Partial Deposit #${i + 1}/${partialAmounts.length}`);
      console.log(`   Amount: ${amount} XRP`);

      await sendXRP(CONFIG.clientSeed, tempWallet, amount, CONFIG.networkUrl);

      totalDeposited += amount;
      const progress = ((totalDeposited / requiredAmount) * 100).toFixed(2);

      console.log(`   📊 Progress: ${totalDeposited}/${requiredAmount} XRP (${progress}%)`);

      // Wait between deposits to allow backend processing
      if (i < partialAmounts.length - 1) {
        console.log(`   ⏳ Waiting 5 seconds before next deposit...`);
        await sleep(5000);
      }
    }

    // Step 5: Summary
    console.log('\n[5/5] ✅ Partial deposits completed!');
    console.log('━'.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total Required: ${requiredAmount} XRP`);
    console.log(`   Total Deposited: ${totalDeposited} XRP`);
    console.log(`   Number of Deposits: ${partialAmounts.length}`);
    console.log(`   Deposits: ${partialAmounts.join(', ')} XRP`);
    console.log('━'.repeat(60));
    console.log('\n💡 Check webhook server for notifications:');
    console.log('   - DEPOSIT_CONFIRMED for each partial deposit');
    console.log('   - MINTED_TOKENS when threshold reached');
    console.log(`   Operation ID: ${createResponse.operationId}`);
    console.log('\n✨ Partial deposit flow completed!');

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
