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

// Login with email
const loginResponse = await fountain.login('admin@sonica.com');
console.log('JWT Token:', loginResponse.jwt);
console.log('Is Admin:', loginResponse.isAdmin);

// Get your operations
const operations = await fountain.getOperations();
console.log('Total operations:', operations.length);

// Check temporary wallet status for an operation
const walletStatus = await fountain.getTempWalletStatus(operations[0].id);
console.log('Wallet balance:', walletStatus.currentBalanceXrp, 'XRP');
console.log('Deposit progress:', walletStatus.depositProgressPercent, '%');

// Admin: View global statistics
if (loginResponse.isAdmin) {
  const stats = await fountain.getAdminStatistics();
  console.log('Total companies:', stats.totalCompanies);
  console.log('Total stablecoins:', stats.totalStablecoins);

  // Monitor all temporary wallets
  const tempWallets = await fountain.getAdminTempWallets('pending_deposit');
  console.log('Pending deposits:', tempWallets.length);
}
```

## API Methods

### `login(email: string): Promise<LoginResponse>`

Authenticate with the API using your email address.

**Parameters:**
- `email` (string): Your registered email address (e.g., 'admin@sonica.com')

**Returns:** JWT token valid for 7 days, company info, and admin status

```typescript
const { jwt, companyId, companyName, isAdmin } = await fountain.login('admin@sonica.com');
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

## Client-Facing Operations Methods

### `getOperations(): Promise<OperationDetails[]>`

Get all operations for your company.

```typescript
const operations = await fountain.getOperations();
operations.forEach(op => {
  console.log(`Operation: ${op.id}, Status: ${op.status}`);
});
```

---

### `getOperation(operationId: string): Promise<OperationDetails>`

Get details for a specific operation.

```typescript
const operation = await fountain.getOperation('operation-uuid');
console.log('Operation status:', operation.status);
console.log('Deposit history:', operation.depositHistory);
```

---

### `getTempWalletStatus(operationId: string): Promise<TempWalletStatus>`

Get real-time temporary wallet status including balance and deposit progress.

```typescript
const walletStatus = await fountain.getTempWalletStatus('operation-uuid');
console.log('Current balance:', walletStatus.currentBalanceXrp, 'XRP');
console.log('Progress:', walletStatus.depositProgressPercent, '%');
console.log('Deposits received:', walletStatus.depositCount);
```

---

## Admin Methods

### `getAdminStatistics(): Promise<AdminStatistics>`

Get global system statistics (admin only).

```typescript
if (loginResponse.isAdmin) {
  const stats = await fountain.getAdminStatistics();
  console.log('Total companies:', stats.totalCompanies);
  console.log('Pending operations:', stats.pendingOperations);
}
```

---

### `getAdminCompanies(): Promise<any[]>`

Get list of all companies (admin only).

```typescript
const companies = await fountain.getAdminCompanies();
```

---

### `getAdminStablecoins(): Promise<any[]>`

Get all stablecoins across all companies (admin only).

```typescript
const stablecoins = await fountain.getAdminStablecoins();
```

---

### `getAdminStablecoinByCode(currencyCode: string): Promise<any>`

Get stablecoin details by currency code with operation stats (admin only).

```typescript
const stablecoin = await fountain.getAdminStablecoinByCode('PABRL');
console.log('Total operations:', stablecoin.operation_count);
console.log('Total minted:', stablecoin.total_minted_rlusd);
```

---

### `getAdminTempWallets(status?: string): Promise<any[]>`

Monitor temporary wallets with real-time balance and progress (admin only).

```typescript
const pendingWallets = await fountain.getAdminTempWallets('pending_deposit');
pendingWallets.forEach(wallet => {
  console.log(`Wallet ${wallet.temp_wallet_address}: ${wallet.current_balance_xrp} XRP`);
});
```

---

### `getAdminOperations(filters?: { status?, type?, limit?, offset? }): Promise<OperationDetails[]>`

Get all operations with optional filters (admin only).

```typescript
const completedMints = await fountain.getAdminOperations({
  status: 'completed',
  type: 'MINT',
  limit: 10,
  offset: 0,
});
```

---

### `getAdminCompanyStablecoins(companyId: string): Promise<any[]>`

Get stablecoins for a specific company (admin only).

```typescript
const companyStablecoins = await fountain.getAdminCompanyStablecoins('sonica-main');
```

---

### `getAdminCompanyOperations(companyId: string): Promise<OperationDetails[]>`

Get operations for a specific company (admin only).

```typescript
const companyOps = await fountain.getAdminCompanyOperations('sonica-main');
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

// Login with email
const login = await fountain.login('operator@sonica.com');
console.log('Logged in as:', login.companyName);

// Create stablecoin
const stablecoin = await fountain.createStablecoin({
  companyId: login.companyId,
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'My Client',
  currencyCode: 'MYTOKEN',
  amount: 10000,
  depositType: 'RLUSD',
  webhookUrl: 'http://my-domain.com/webhook',
});

console.log(`Send ${stablecoin.amountRLUSD} RLUSD to ${stablecoin.wallet}`);

// Monitor deposit progress
const operation = await fountain.getOperation(stablecoin.operationId);
console.log(`Deposit status: ${operation.status}`);

// Check temporary wallet status
const walletStatus = await fountain.getTempWalletStatus(stablecoin.operationId);
console.log(`Progress: ${walletStatus.depositProgressPercent}%`);

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

### Example 2: Admin Dashboard Monitoring

```typescript
import { FountainSDK } from 'fountain-api-sdk';

const fountain = new FountainSDK('http://localhost:3000');

// Login as admin
const login = await fountain.login('admin@sonica.com');

if (login.isAdmin) {
  // Get global statistics
  const stats = await fountain.getAdminStatistics();
  console.log('System Overview:');
  console.log(`- Companies: ${stats.totalCompanies}`);
  console.log(`- Stablecoins: ${stats.totalStablecoins}`);
  console.log(`- Operations: ${stats.totalOperations}`);
  console.log(`- Completed: ${stats.completedOperations}`);
  console.log(`- Pending: ${stats.pendingOperations}`);

  // Monitor pending deposits
  const tempWallets = await fountain.getAdminTempWallets('pending_deposit');
  console.log(`\nWallets waiting for deposits: ${tempWallets.length}`);
  tempWallets.forEach(wallet => {
    console.log(`- ${wallet.temp_wallet_address}: ${wallet.deposit_progress_percent}% progress`);
  });

  // Get completed operations
  const completed = await fountain.getAdminOperations({
    status: 'completed',
    limit: 5,
  });
  console.log(`\nRecent completed operations: ${completed.length}`);
}
```

---

### Example 3: Manual Token Management

```typescript
// Set token from previous session
fountain.setToken('eyJhbGc...');

// Check if authenticated
if (fountain.isAuthenticated()) {
  const operations = await fountain.getOperations();
  console.log(`Total operations: ${operations.length}`);
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
  OperationDetails,
  TempWalletStatus,
  AdminStatistics,
} from 'fountain-api-sdk';
```

### Type Definitions

- **LoginResponse**: Email, companyId, companyName, isAdmin flag, JWT token, expiration
- **OperationDetails**: Operation ID, type (MINT/BURN), status, amounts, deposit history
- **TempWalletStatus**: Wallet address, real-time XRP balance, deposit progress %, full deposit history
- **AdminStatistics**: Total counts for companies, stablecoins, operations, completed/pending stats

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
