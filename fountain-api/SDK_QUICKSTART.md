# SDK Quick Start Guide

Get up and running with Fountain API in 5 minutes! 🚀

## Installation

### For TypeScript/Node.js Projects

```bash
# Copy the SDK file to your project
cp sdk-manual/fountain-sdk.ts your-project/src/

# Or use npm link for development
cd sdk-manual
npm install
npm run build
npm link

# Then in your project
npm link fountain-api-sdk
```

### For Browser Projects

```html
<!-- Add axios -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<!-- Add Fountain SDK (copy example-javascript.js and adapt) -->
<script src="fountain-sdk.js"></script>
```

## 5-Minute Setup

### 1. Initialize SDK

```typescript
import { FountainSDK } from './fountain-sdk';

const fountain = new FountainSDK('http://localhost:3000');
```

### 2. Login

```typescript
const auth = await fountain.login('company-1');
console.log('Logged in as:', auth.company.name);
console.log('Token:', auth.jwt);
```

**Test companies:**
- `company-1` - Park America
- `company-2` - Tech Startup Inc

### 3. Create Stablecoin

```typescript
const stablecoin = await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-' + Date.now(),
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'My Client Name',
  currencyCode: 'MYTOKEN',
  amount: 10000,
  depositType: 'RLUSD',
  webhookUrl: 'https://your-domain.com/webhook',
});

console.log('Deposit', stablecoin.amountRLUSD, 'RLUSD to:', stablecoin.wallet);
```

### 4. Burn Stablecoin

```typescript
const burn = await fountain.burnStablecoin({
  stablecoinId: stablecoin.operationId,
  currencyCode: 'MYTOKEN',
  amountBrl: 5000,
  returnAsset: 'RLUSD',
  webhookUrl: 'https://your-domain.com/webhook',
});

console.log('Redeemed:', burn.amountRlusdReturned, 'RLUSD');
```

---

## Common Patterns

### Pattern 1: Login Once, Reuse Token

```typescript
// Login and save token
const auth = await fountain.login('company-1');
localStorage.setItem('fountain_token', auth.jwt);

// Later, create new SDK instance and set token
const fountain2 = new FountainSDK('http://localhost:3000');
fountain2.setToken(localStorage.getItem('fountain_token'));

// Now you can use it
const stablecoin = await fountain2.createStablecoin({...});
```

### Pattern 2: Error Handling

```typescript
try {
  await fountain.createStablecoin({...});
} catch (error) {
  console.error('API Error:', error.message);

  if (error.response?.status === 401) {
    console.log('Token expired, please login again');
    await fountain.login('company-1');
  }
}
```

### Pattern 3: Check Authentication

```typescript
if (fountain.isAuthenticated()) {
  const stablecoin = await fountain.getStablecoin(id);
} else {
  await fountain.login('company-1');
}
```

---

## Real-World Example

```typescript
import { FountainSDK } from './fountain-sdk';

class TokenizationManager {
  private fountain: FountainSDK;
  private companyId: string;

  constructor(companyId: string, apiUrl: string) {
    this.companyId = companyId;
    this.fountain = new FountainSDK(apiUrl);
  }

  async initialize() {
    await this.fountain.login(this.companyId);
    console.log('✅ Connected to Fountain API');
  }

  async createAssetToken(
    clientName: string,
    currencyCode: string,
    amount: number,
  ) {
    console.log(`Creating token ${currencyCode} backed by R$${amount}`);

    const response = await this.fountain.createStablecoin({
      companyId: this.companyId,
      clientId: `client-${Date.now()}`,
      companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
      clientName,
      currencyCode,
      amount,
      depositType: 'RLUSD',
      webhookUrl: 'https://your-domain.com/webhook',
    });

    console.log(`✅ Token created. Send ${response.amountRLUSD} RLUSD to:`);
    console.log(`   ${response.wallet}`);

    return response;
  }

  async redeemToken(stablecoinId: string, amount: number) {
    console.log(`Redeeming R$${amount}...`);

    const response = await this.fountain.burnStablecoin({
      stablecoinId,
      currencyCode: 'MYTOKEN',
      amountBrl: amount,
      returnAsset: 'RLUSD',
      webhookUrl: 'https://your-domain.com/webhook',
    });

    console.log(`✅ Redeemed ${response.amountRlusdReturned} RLUSD`);
    return response;
  }
}

// Usage
async function main() {
  const manager = new TokenizationManager(
    'company-1',
    'http://localhost:3000',
  );

  await manager.initialize();

  const token = await manager.createAssetToken(
    'Park America Building',
    'PABRL',
    100000,
  );

  // ... later after deposit confirmed ...

  await manager.redeemToken(token.operationId, 50000);
}

main();
```

---

## API URLs

### Development

- **API Base:** `http://localhost:3000`
- **Swagger Docs:** `http://localhost:3000/api/docs`
- **OpenAPI Spec:** `http://localhost:3000/api-json`

### Production (Adjust as needed)

```typescript
const fountain = new FountainSDK('https://api.fountain.production.com');
```

---

## Troubleshooting

### "Cannot find module"

Make sure you're importing the SDK correctly:

```typescript
// ✅ Correct
import { FountainSDK } from './fountain-sdk';

// ❌ Wrong
import FountainSDK from './fountain-sdk';
```

### "401 Unauthorized"

Token expired. Log in again:

```typescript
await fountain.login('company-1');
```

### "Network error"

Check if API is running:

```bash
npm run start:dev
```

### "CORS errors" (Browser)

The API must allow CORS. For development, add:

```typescript
// In API code
app.enableCors();
```

---

## Next Steps

1. **Read Full SDK Docs:** See `sdk-manual/README.md`
2. **Try Interactive Demo:** Open `sdk-manual/example-browser.html` in browser
3. **Check Examples:** See `sdk-manual/example.ts` and `example-javascript.js`
4. **Explore Swagger UI:** Visit `http://localhost:3000/api/docs`

---

## Support

- 📚 **SDK Docs:** `sdk-manual/README.md`
- 🔍 **API Docs:** http://localhost:3000/api/docs
- 💡 **Examples:** `sdk-manual/example*.ts` and `example*.js`
- 🐛 **Issues:** Check API logs with `npm run start:dev`

---

## Company Test Credentials

```
company-1:
  ID: company-1
  Name: Park America
  Email: park@example.com

company-2:
  ID: company-2
  Name: Tech Startup Inc
  Email: tech@example.com
```

---

Happy tokenizing! 🎉
