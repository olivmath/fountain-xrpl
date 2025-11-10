/**
 * Fountain SDK - JavaScript Example
 * Works in both Node.js and browser environments
 */

const axios = require('axios');

class FountainSDK {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.jwtToken = null;
  }

  async login(companyId) {
    const response = await axios.post(`${this.baseURL}/api/v1/auth`, {
      companyId,
    });
    this.jwtToken = response.data.jwt;
    return response.data;
  }

  async createStablecoin(request) {
    const response = await axios.post(
      `${this.baseURL}/api/v1/stablecoin`,
      request,
      {
        headers: { Authorization: `Bearer ${this.jwtToken}` },
      },
    );
    return response.data;
  }

  async mintMore(request) {
    const response = await axios.post(
      `${this.baseURL}/api/v1/stablecoin/mint`,
      request,
      {
        headers: { Authorization: `Bearer ${this.jwtToken}` },
      },
    );
    return response.data;
  }

  async burnStablecoin(request) {
    const response = await axios.post(
      `${this.baseURL}/api/v1/stablecoin/burn`,
      request,
      {
        headers: { Authorization: `Bearer ${this.jwtToken}` },
      },
    );
    return response.data;
  }

  async getStablecoin(stablecoinId) {
    const response = await axios.get(
      `${this.baseURL}/api/v1/stablecoin/${stablecoinId}`,
      {
        headers: { Authorization: `Bearer ${this.jwtToken}` },
      },
    );
    return response.data;
  }

  setToken(token) {
    this.jwtToken = token;
  }

  getToken() {
    return this.jwtToken;
  }

  logout() {
    this.jwtToken = null;
  }

  isAuthenticated() {
    return this.jwtToken !== null;
  }
}

// Usage Example
async function main() {
  const fountain = new FountainSDK('http://localhost:3000');

  try {
    // Step 1: Login
    console.log('📝 Logging in...');
    const loginResponse = await fountain.login('company-1');
    console.log('✅ Login successful:', loginResponse.company.name);

    // Step 2: Create stablecoin
    console.log('\n🪙 Creating stablecoin...');
    const stablecoin = await fountain.createStablecoin({
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
    console.log('   Operation ID:', stablecoin.operationId);
    console.log('   Status:', stablecoin.status);
    console.log('   Amount RLUSD:', stablecoin.amountRLUSD);
    console.log('   Deposit wallet:', stablecoin.wallet);

    // Step 3: Get stablecoin details
    console.log('\n📊 Fetching stablecoin details...');
    const details = await fountain.getStablecoin(stablecoin.operationId);
    console.log('✅ Stablecoin details:');
    console.log('   Currency:', details.currencyCode);
    console.log('   Amount BRL:', details.amount);
    console.log('   Status:', details.status);

    // Step 4: Burn stablecoin
    console.log('\n🔥 Burning stablecoin...');
    const burn = await fountain.burnStablecoin({
      stablecoinId: stablecoin.operationId,
      currencyCode: 'PABRL',
      amountBrl: 5000,
      returnAsset: 'RLUSD',
      webhookUrl: 'http://your-domain.com/webhook',
    });

    console.log('✅ Burn operation completed');
    console.log('   Operation ID:', burn.operationId);
    console.log('   Amount burned (BRL):', burn.amountBrlBurned);
    console.log('   Amount returned (RLUSD):', burn.amountRlusdReturned);

    console.log('\n✨ All operations completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FountainSDK };
}

// Run if executed directly
if (require.main === module) {
  main();
}
