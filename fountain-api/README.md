# Fountain API - Hackathon MVP

A NestJS backend API for stablecoin issuance and management on the XRP Ledger (XRPL).

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Configuration

Edit `.env` with your settings:

```
XRPL_NETWORK=testnet
XRPL_ISSUER_SEED=your-seed
XRPL_ISSUER_ADDRESS=your-address
JWT_SECRET=your-secret
USD_BRL_RATE=5.25
PORT=3000
```

### Run the API

```bash
# Development
npm run start:dev

# Production
npm run start:prod
```

The API will be available at `http://localhost:3000`

**Swagger UI:** http://localhost:3000/api/docs

## API Documentation (Swagger UI)

The API includes interactive Swagger/OpenAPI documentation available at `/api/docs`. You can:
- View all endpoints with detailed schemas
- Try requests directly from the browser
- See request/response examples
- View error responses

### Quick Links

After running the API:
- **Swagger UI:** http://localhost:3000/api/docs
- **OpenAPI JSON:** http://localhost:3000/api-json
- **API Base URL:** http://localhost:3000/api/v1

## SDK Usage

### Option 1: TypeScript SDK (Recommended)

```typescript
import { FountainSDK } from './sdk-manual/fountain-sdk';

const fountain = new FountainSDK('http://localhost:3000');
await fountain.login('company-1');

const stablecoin = await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'Park America',
  currencyCode: 'PABRL',
  amount: 13000,
  depositType: 'RLUSD',
  webhookUrl: 'http://your-domain.com/webhook',
});
```

### Option 2: JavaScript (Browser/Node.js)

See `sdk-manual/example-javascript.js` and `sdk-manual/example-browser.html`

### Option 3: Auto-Generated SDKs

Generate SDKs in multiple languages:

```bash
./generate-sdk.sh
```

Outputs:
- `sdk/typescript/` - TypeScript SDK
- `sdk/javascript/` - JavaScript SDK
- `sdk/python/` - Python SDK

**See `sdk-manual/README.md` for complete documentation.**

## API Endpoints

### 1. Authentication

**POST** `/api/v1/auth`

Login and get JWT token.

```bash
curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "company-1"
  }'
```

**Response:**
```json
{
  "jwt": "eyJhbGc...",
  "expires": "7d",
  "company": {
    "id": "company-1",
    "name": "Park America",
    "email": "park@example.com"
  }
}
```

### 2. Create Stablecoin (Mint)

**POST** `/api/v1/stablecoin`

Create a new stablecoin with RLUSD or PIX deposit.

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "companyId": "company-1",
    "clientId": "client-123",
    "companyWallet": "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
    "clientName": "Park America Building",
    "currencyCode": "PABRL",
    "amount": 13000,
    "depositType": "RLUSD",
    "webhookUrl": "http://your-domain.com/webhook"
  }'
```

**Response:**
```json
{
  "operationId": "uuid",
  "status": "REQUIRE_DEPOSIT",
  "amountRLUSD": 2476.19,
  "wallet": "rcLASSiCq8LWcymCHaCgK19QMEvUspuRM"
}
```

### 3. Burn Stablecoin (Redeem)

**POST** `/api/v1/stablecoin/burn`

Burn stablecoin and redeem collateral (RLUSD or PIX).

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin/burn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "stablecoinId": "uuid",
    "currencyCode": "PABRL",
    "amountBrl": 5000,
    "returnAsset": "RLUSD",
    "webhookUrl": "http://your-domain.com/webhook"
  }'
```

**Response:**
```json
{
  "operationId": "uuid",
  "status": "completed",
  "amountBrlBurned": 5000,
  "amountRlusdReturned": 952.38
}
```

### 4. Get Stablecoin Details

**GET** `/api/v1/stablecoin/:stablecoinId`

Retrieve stablecoin information.

```bash
curl -X GET http://localhost:3000/api/v1/stablecoin/uuid
```

## Testing

Run the included test script:

```bash
./test-api.sh
```

This will:
1. Login and get JWT token
2. Create a stablecoin with RLUSD deposit
3. Burn stablecoin and redeem RLUSD

## Architecture

### Services

- **AuthService**: JWT authentication (mock companies for hackathon)
- **StablecoinService**: Mint/burn operations, webhook notifications
- **XrplService**: XRPL wallet management, transactions, subscribers
- **BinanceService**: Exchange rate calculations (XRP/BRL, USD/BRL)
- **CustomLogger**: Structured logging with emojis (see LOGGING_EXAMPLE.md)

### Data Flow

1. Client authenticates → JWT token
2. Client creates stablecoin → Temporary wallet generated
3. Customer deposits RLUSD to temp wallet → Backend detects deposit
4. Backend mints stablecoin on XRPL → Tokens transferred to company wallet
5. Webhook notification sent to client
6. Client can burn stablecoin → Backend executes clawback on XRPL
7. Collateral converted and returned

## Logging Output

Logs follow the format in LOGGING_EXAMPLE.md with:
- Operation start/success/error headers
- Step-by-step progress indicators
- Blockchain transaction details
- Webhook delivery status
- Calculation details

Example:
```
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING MINT OPERATION
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: {...}

⚙️ [1] Validating stablecoin parameters
   └─ {"currencyCode":"PABRL","amount":13000}

✅ Stablecoin found: PASSED
   └─ {...}
```

## RLUSD Token Details (XRPL Testnet)

- Network: XRPL Testnet
- Token: `RLUSD`
- Issuer Account Address: `rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV`
- Testnet Servers:
  - WebSocket: `wss://s.altnet.rippletest.net:51233`
  - JSON-RPC: `https://s.altnet.rippletest.net:51234/`

Note: You must have an active XRPL account (≥1 XRP) and enable a trustline to the RLUSD issuer to receive RLUSD. The holder sets a TrustSet with `LimitAmount` for currency `RLUSD` and the issuer above.

### Environment

```
XRPL_NETWORK=testnet
XRPL_ISSUER_ADDRESS=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV
XRPL_ISSUER_SEED=your-issuer-seed
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-or-service-role-key
JWT_SECRET=your-secret-key
PORT=3000
```

### Trustline Setup (Helper Script)

Use the provided script to establish a trustline from your holder wallet to the RLUSD issuer on XRPL Testnet:

```bash
# Set trustline (holder signs)
SOURCE_SEED=snYourHolderSeed LIMIT_RLUSD=10000 \
  NETWORK_URL=wss://s.altnet.rippletest.net:51233 \
  RLUSD_ISSUER=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV \
  node scripts/trustline.js
```

### Simulate RLUSD Deposit

After creating a stablecoin operation, deposit RLUSD to the temporary wallet:

```bash
SOURCE_SEED=snYourHolderSeed STABLECOIN_ID=<uuid> AMOUNT_RLUSD=10 \
  NETWORK_URL=wss://s.altnet.rippletest.net:51233 \
  RLUSD_ISSUER=rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV \
  node scripts/simulate-deposit.js
```

The script checks for the trustline before sending an Issued Currency `Payment`.

## Hackathon Simplifications

- JWT hardcoded companies (no real signup)
- In-memory database (no Supabase persistence)
- XRPL Testnet with mock wallet operations
- Binance rates mocked (configurable via ENV)
- Webhook retries simplified (1 attempt)
- No HSM integration (use with care!)

## Next Steps for Production

- [ ] Add Supabase database integration
- [ ] Implement proper XRPL subscriber with polling fallback
- [ ] Add HSM/vault for seed storage
- [ ] Implement webhook retry with exponential backoff
- [ ] Add rate limiting and request validation
- [ ] Implement comprehensive error handling
- [ ] Add request/response logging and monitoring
- [ ] Add unit and integration tests
- [ ] Deploy to production infrastructure

## Environment Variables

```
XRPL_NETWORK=testnet|mainnet
XRPL_ISSUER_SEED=your-wallet-seed
XRPL_ISSUER_ADDRESS=your-wallet-address
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
BINANCE_API_KEY=optional-for-real-rates
BINANCE_API_SECRET=optional-for-real-rates
JWT_SECRET=your-secret-key
USD_BRL_RATE=5.25
PORT=3000
```

## SDK Integration

### TypeScript/JavaScript SDK

The easiest way to integrate with Fountain API. Located in `sdk-manual/`.

#### Quick Setup

```bash
# Using the manual SDK
import { FountainSDK } from './sdk-manual/fountain-sdk';

const fountain = new FountainSDK('http://localhost:3000');

// Login
await fountain.login('company-1');

// Create stablecoin
const stablecoin = await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'Park America',
  currencyCode: 'PABRL',
  amount: 13000,
  depositType: 'RLUSD',
  webhookUrl: 'http://your-domain.com/webhook',
});
```

**See `sdk-manual/README.md` for complete SDK documentation.**

### Auto-Generated SDKs

Generate SDKs in multiple languages (TypeScript, JavaScript, Python):

```bash
./generate-sdk.sh
```

This will generate:
- `sdk/typescript` - TypeScript/Node.js SDK
- `sdk/javascript` - Browser JavaScript SDK
- `sdk/python` - Python SDK

### OpenAPI Specification

Get the OpenAPI/Swagger spec for your own integrations:

```bash
# Visit Swagger UI
http://localhost:3000/api/docs

# Download raw OpenAPI spec
curl http://localhost:3000/api-json > openapi.json
```

## Support

For issues or questions, refer to:
- **SDK Documentation:** `sdk-manual/README.md`
- **LOGGING_EXAMPLE.md** - Expected log output examples
- **NEW_VERSION.md** - Technical specification
- **COMPANIES.md** - Available test companies
- **XRPL Docs** - https://xrpl.org/docs
- **NestJS Docs** - https://docs.nestjs.com
