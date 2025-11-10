import { FountainSDK } from './fountain-sdk';

/**
 * Example usage of Fountain SDK
 */

async function main() {
  // Initialize SDK
  const fountain = new FountainSDK('http://localhost:3000');

  try {
    // Step 1: Login
    console.log('📝 Logging in...');
    const loginResponse = await fountain.login('company-1');
    console.log('✅ Login successful:', loginResponse.company.name);
    console.log('🔐 JWT Token:', loginResponse.jwt.substring(0, 20) + '...');

    // Step 2: Create stablecoin (Mint)
    console.log('\n🪙 Creating stablecoin...');
    const createResponse = await fountain.createStablecoin({
      companyId: 'company-1',
      clientId: 'client-123',
      companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
      clientName: 'Park America Building',
      currencyCode: 'PABRL',
      amount: 13000,
      depositType: 'RLUSD',
      webhookUrl: 'http://your-domain.com/webhook',
    });

    console.log('✅ Stablecoin created');
    console.log('   Operation ID:', createResponse.operationId);
    console.log('   Status:', createResponse.status);
    console.log('   Amount RLUSD:', createResponse.amountRLUSD);
    console.log('   Deposit wallet:', createResponse.wallet);

    const stablecoinId = createResponse.operationId; // Mock for example

    // Step 3: Get stablecoin details
    console.log('\n📊 Fetching stablecoin details...');
    const details = await fountain.getStablecoin(stablecoinId);
    console.log('✅ Stablecoin details:');
    console.log('   Currency:', details.currencyCode);
    console.log('   Amount BRL:', details.amount);
    console.log('   Status:', details.status);

    // Step 4: Burn stablecoin
    console.log('\n🔥 Burning stablecoin...');
    const burnResponse = await fountain.burnStablecoin({
      stablecoinId,
      currencyCode: 'PABRL',
      amountBrl: 5000,
      returnAsset: 'RLUSD',
      webhookUrl: 'http://your-domain.com/webhook',
    });

    console.log('✅ Burn operation completed');
    console.log('   Operation ID:', burnResponse.operationId);
    console.log('   Amount burned (BRL):', burnResponse.amountBrlBurned);
    console.log('   Amount returned (RLUSD):', burnResponse.amountRlusdReturned);

    console.log('\n✨ All operations completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// Run example
main();
