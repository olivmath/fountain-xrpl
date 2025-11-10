# Fountain API SDK

Easy-to-use TypeScript SDK for integrating with Fountain stablecoin API.

## Installation

### Option 1: NPM (Once published)

```bash
npm install fountain-api-sdk
```

### Option 2: From source

```bash
git clone https://github.com/your-org/fountain-api-sdk.git
cd fountain-api-sdk
npm install
npm run build
npm link
```

Then in your project:

```bash
npm link fountain-api-sdk
```

## Quick Start

```typescript
import { FountainSDK } from 'fountain-api-sdk';

// Initialize SDK
const fountain = new FountainSDK('http://localhost:3000');

// Login
const loginResponse = await fountain.login('company-1');
console.log('JWT Token:', loginResponse.jwt);

// Create stablecoin (Mint)
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

console.log('Stablecoin created:', stablecoin.operationId);
console.log('Deposit wallet:', stablecoin.wallet);

// Burn stablecoin
const burn = await fountain.burnStablecoin({
  stablecoinId: stablecoin.operationId,
  currencyCode: 'PABRL',
  amountBrl: 5000,
  returnAsset: 'RLUSD',
  webhookUrl: 'http://your-domain.com/webhook',
});

console.log('Stablecoin burned:', burn.amountBrlBurned, 'BRL');
```

## API Methods

### `login(companyId: string): Promise<LoginResponse>`

Authenticate with the API using company ID.

**Parameters:**
- `companyId` (string): Your company ID (e.g., 'company-1')

**Returns:** JWT token valid for 7 days

```typescript
const { jwt, company } = await fountain.login('company-1');
```

---

### `createStablecoin(request: CreateStablecoinRequest): Promise<CreateStablecoinResponse>`

Create a new stablecoin backed by RLUSD or Pix deposit.

**Parameters:**
```typescript
{
  companyId: string;        // Your company ID
  clientId: string;         // Client identifier
  companyWallet: string;    // XRPL wallet address (starts with 'r')
  clientName: string;       // Display name for the stablecoin
  currencyCode: string;     // Currency code (e.g., 'PABRL')
  amount: number;           // Amount in BRL
  depositType: 'RLUSD' | 'PIX';  // Deposit method
  webhookUrl: string;       // Webhook URL for notifications
}
```

**Returns:**
```typescript
{
  operationId: string;      // Operation ID (UUID)
  status: string;           // 'REQUIRE_DEPOSIT'
  amountRLUSD: number;      // Amount needed in RLUSD
  wallet: string;           // Temporary wallet for deposits
}
```

---

### `mintMore(request: MintMoreRequest): Promise<CreateStablecoinResponse>`

Mint additional tokens for existing stablecoin.

**Parameters:**
```typescript
{
  stablecoinId: string;
  companyWallet: string;
  amount: number;
  depositType: 'RLUSD' | 'PIX';
  webhookUrl: string;
}
```

---

### `burnStablecoin(request: BurnStablecoinRequest): Promise<BurnStablecoinResponse>`

Burn stablecoin tokens and redeem collateral.

**Parameters:**
```typescript
{
  stablecoinId: string;
  currencyCode: string;
  amountBrl: number;
  returnAsset: 'RLUSD' | 'PIX';
  webhookUrl: string;
}
```

**Returns:**
```typescript
{
  operationId: string;
  status: string;           // 'completed'
  amountBrlBurned: number;
  amountRlusdReturned: number;
}
```

---

### `getStablecoin(stablecoinId: string): Promise<StablecoinDetails>`

Get stablecoin details.

**Parameters:**
- `stablecoinId` (string): Stablecoin ID (UUID)

**Returns:**
```typescript
{
  stablecoinId: string;
  operationId: string;
  companyId: string;
  currencyCode: string;
  amount: number;
  status: string;
  createdAt: string;
}
```

---

### `setToken(token: string): void`

Set JWT token manually.

```typescript
fountain.setToken('your-jwt-token');
```

---

### `getToken(): string | null`

Get current JWT token.

```typescript
const token = fountain.getToken();
```

---

### `logout(): void`

Clear JWT token.

```typescript
fountain.logout();
```

---

### `isAuthenticated(): boolean`

Check if SDK is authenticated.

```typescript
if (fountain.isAuthenticated()) {
  // User is logged in
}
```

---

## Error Handling

All methods throw errors if the request fails. Handle them with try-catch:

```typescript
try {
  await fountain.createStablecoin({...});
} catch (error) {
  console.error('Error:', error.message);
}
```

---

## Examples

### Example 1: Complete Mint and Burn Flow

```typescript
import { FountainSDK } from 'fountain-api-sdk';

const fountain = new FountainSDK('http://localhost:3000');

// Login
await fountain.login('company-1');

// Create stablecoin
const stablecoin = await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'My Client',
  currencyCode: 'MYTOKEN',
  amount: 10000,
  depositType: 'RLUSD',
  webhookUrl: 'http://my-domain.com/webhook',
});

console.log(`Send ${stablecoin.amountRLUSD} RLUSD to ${stablecoin.wallet}`);

// Later... after deposit confirmed

// Burn
const burn = await fountain.burnStablecoin({
  stablecoinId: stablecoin.operationId,
  currencyCode: 'MYTOKEN',
  amountBrl: 5000,
  returnAsset: 'RLUSD',
  webhookUrl: 'http://my-domain.com/webhook',
});

console.log(`Redeemed ${burn.amountRlusdReturned} RLUSD`);
```

---

### Example 2: Manual Token Management

```typescript
// Set token from previous session
fountain.setToken('eyJhbGc...');

// Check if authenticated
if (fountain.isAuthenticated()) {
  const stablecoin = await fountain.getStablecoin('stablecoin-id');
  console.log(stablecoin);
}

// Logout
fountain.logout();
```

---

## TypeScript Types

All types are exported from the SDK for full type safety:

```typescript
import {
  FountainSDK,
  LoginResponse,
  CreateStablecoinRequest,
  CreateStablecoinResponse,
  BurnStablecoinRequest,
  BurnStablecoinResponse,
  StablecoinDetails,
} from 'fountain-api-sdk';
```

---

## Configuration

### Change API URL

```typescript
const fountain = new FountainSDK('https://api.fountain.example.com');
```

### Custom Axios Config

Create a custom instance:

```typescript
import axios from 'axios';
import { FountainSDK } from 'fountain-api-sdk';

const customClient = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Custom-Header': 'value',
  },
});

// Use custom client (modify SDK if needed)
```

---

## Support

- 📚 **API Documentation:** http://localhost:3000/api/docs
- 🐛 **Bug Reports:** https://github.com/your-org/fountain-api-sdk/issues
- 💬 **Questions:** Create a GitHub discussion

---

## License

MIT - See LICENSE file for details
