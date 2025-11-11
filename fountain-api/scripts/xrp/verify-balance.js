/**
 * Verify Balances - Check wallet balances on XRPL
 *
 * This script helps verify:
 * - XRP balance in wallet
 * - Stablecoin token balances (trustlines)
 * - Temp wallet status and deposit progress
 * - Operation status via Fountain API
 *
 * Usage:
 *   # Check wallet balance
 *   WALLET_ADDRESS=rXXX... node verify-balance.js
 *
 *   # Check operation and temp wallet status
 *   OPERATION_ID=xxx EMAIL=company-1 node verify-balance.js
 *
 *   # Check wallet balance with currency filter
 *   WALLET_ADDRESS=rXXX... CURRENCY_CODE=TESTBRL node verify-balance.js
 *
 * Environment Variables:
 *   WALLET_ADDRESS    - XRPL wallet address to check
 *   OPERATION_ID      - Fountain operation ID to check
 *   EMAIL             - Company email for API access (required for OPERATION_ID)
 *   CURRENCY_CODE     - Filter trustlines by currency code
 *   NETWORK_URL       - XRPL network URL
 *   API_URL           - Fountain API URL
 */

const { FountainSDK } = require('../../../sdks/typescript/dist/fountain-sdk');
const xrpl = require('xrpl');

// Configuration
const CONFIG = {
  walletAddress: process.env.WALLET_ADDRESS || '',
  operationId: process.env.OPERATION_ID || '',
  email: process.env.EMAIL || '',
  currencyCode: process.env.CURRENCY_CODE || '',
  networkUrl: process.env.NETWORK_URL || 'wss://s.altnet.rippletest.net:51233',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
};

/**
 * Get account info from XRPL
 */
async function getAccountInfo(address, networkUrl) {
  const client = new xrpl.Client(networkUrl);

  try {
    await client.connect();

    const accountInfo = await client.request({
      command: 'account_info',
      account: address,
      ledger_index: 'validated',
    });

    return accountInfo.result.account_data;
  } catch (error) {
    if (error.data?.error === 'actNotFound') {
      return null;
    }
    throw error;
  } finally {
    await client.disconnect();
  }
}

/**
 * Get account lines (trustlines)
 */
async function getAccountLines(address, networkUrl) {
  const client = new xrpl.Client(networkUrl);

  try {
    await client.connect();

    const lines = await client.request({
      command: 'account_lines',
      account: address,
      ledger_index: 'validated',
    });

    return lines.result.lines || [];
  } catch (error) {
    if (error.data?.error === 'actNotFound') {
      return [];
    }
    throw error;
  } finally {
    await client.disconnect();
  }
}

/**
 * Display wallet info
 */
async function displayWalletInfo(address, networkUrl, currencyFilter) {
  console.log('\n💼 Wallet Information');
  console.log('━'.repeat(60));
  console.log(`Address: ${address}`);

  const accountData = await getAccountInfo(address, networkUrl);

  if (!accountData) {
    console.log('❌ Account not found (not activated or invalid address)');
    return;
  }

  // XRP Balance
  const xrpBalance = parseFloat(xrpl.dropsToXrp(accountData.Balance));
  console.log(`\n💰 XRP Balance: ${xrpBalance} XRP`);
  console.log(`   Reserve: ${accountData.OwnerCount * 2 + 10} XRP (${accountData.OwnerCount} objects)`);

  // Trustlines
  const lines = await getAccountLines(address, networkUrl);

  if (lines.length > 0) {
    console.log(`\n🤝 Trustlines (${lines.length}):`);

    const filteredLines = currencyFilter
      ? lines.filter(line => line.currency === currencyFilter)
      : lines;

    if (filteredLines.length === 0 && currencyFilter) {
      console.log(`   ⚠️  No trustlines found for currency: ${currencyFilter}`);
    }

    filteredLines.forEach((line, index) => {
      console.log(`\n   [${index + 1}] Currency: ${line.currency}`);
      console.log(`       Balance: ${line.balance}`);
      console.log(`       Limit: ${line.limit}`);
      console.log(`       Issuer: ${line.account}`);
    });
  } else {
    console.log('\n🤝 Trustlines: None');
  }

  console.log('━'.repeat(60));
}

/**
 * Display operation info
 */
async function displayOperationInfo(operationId, fountain) {
  console.log('\n📊 Operation Information');
  console.log('━'.repeat(60));

  try {
    const operation = await fountain.getOperation(operationId);

    console.log(`Operation ID: ${operation.id}`);
    console.log(`Type: ${operation.type}`);
    console.log(`Status: ${operation.status}`);
    console.log(`Created: ${operation.createdAt}`);

    if (operation.tempWalletAddress) {
      console.log(`\n💼 Temp Wallet: ${operation.tempWalletAddress}`);

      if (operation.amountDeposited !== undefined) {
        const required = operation.amountRlusd || 0;
        const deposited = operation.amountDeposited || 0;
        const progress = required > 0 ? ((deposited / required) * 100).toFixed(2) : 0;

        console.log(`   Required: ${required} XRP`);
        console.log(`   Deposited: ${deposited} XRP`);
        console.log(`   Progress: ${progress}%`);
        console.log(`   Deposit Count: ${operation.depositCount || 0}`);
      }

      // Get temp wallet status
      try {
        const tempWalletStatus = await fountain.getTempWalletStatus(operationId);
        console.log(`\n📈 Real-time Status:`);
        console.log(`   Current Balance: ${tempWalletStatus.currentBalanceXrp} XRP`);
        console.log(`   Progress: ${tempWalletStatus.depositProgressPercent}%`);

        if (tempWalletStatus.depositHistory?.length > 0) {
          console.log(`\n📜 Deposit History (${tempWalletStatus.depositHistory.length}):`);
          tempWalletStatus.depositHistory.forEach((deposit, i) => {
            console.log(`   [${i + 1}] ${deposit.amount} XRP - ${deposit.timestamp}`);
            console.log(`       Tx: ${deposit.txHash}`);
          });
        }
      } catch (error) {
        console.log(`   ⚠️  Could not fetch temp wallet status: ${error.message}`);
      }
    }

    console.log('━'.repeat(60));
  } catch (error) {
    console.error(`❌ Failed to fetch operation: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🔍 Balance Verification Tool');
  console.log('━'.repeat(60));

  try {
    // Check wallet balance
    if (CONFIG.walletAddress) {
      await displayWalletInfo(
        CONFIG.walletAddress,
        CONFIG.networkUrl,
        CONFIG.currencyCode
      );
    }

    // Check operation status
    if (CONFIG.operationId) {
      if (!CONFIG.email) {
        console.error('\n❌ EMAIL required for operation lookup');
        console.error('Usage: OPERATION_ID=xxx EMAIL=company-1 node verify-balance.js');
        process.exit(1);
      }

      const fountain = new FountainSDK(CONFIG.apiUrl);
      await fountain.login(CONFIG.email);

      await displayOperationInfo(CONFIG.operationId, fountain);
    }

    // Help message if no inputs
    if (!CONFIG.walletAddress && !CONFIG.operationId) {
      console.log('\n💡 Usage Examples:');
      console.log('━'.repeat(60));
      console.log('# Check wallet balance:');
      console.log('  WALLET_ADDRESS=rXXX... node verify-balance.js');
      console.log('\n# Check operation status:');
      console.log('  OPERATION_ID=xxx EMAIL=company-1 node verify-balance.js');
      console.log('\n# Check wallet with currency filter:');
      console.log('  WALLET_ADDRESS=rXXX... CURRENCY_CODE=TESTBRL node verify-balance.js');
      console.log('\n# Check both:');
      console.log('  WALLET_ADDRESS=rXXX... OPERATION_ID=xxx EMAIL=company-1 node verify-balance.js');
      console.log('━'.repeat(60));
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }

  console.log('');
}

// Run
main();
