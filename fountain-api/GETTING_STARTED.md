# Getting Started with Fountain API 🚀

Welcome! Here's how to get everything running in 2 minutes.

## Prerequisites

- Node.js 18+
- npm

## Step 1: Start the API (Terminal 1)

```bash
cd fountain-api
npm install
npm run start:dev
```

You should see:
```
🚀 API running on http://localhost:3000
📚 Swagger docs available at http://localhost:3000/api/docs
```

## Step 2: Open Browser Demos

### Interactive Swagger UI
Open: **http://localhost:3000/api/docs**

Features:
- See all endpoints
- Try requests live
- View response schemas
- Test with real data

### Interactive Browser Demo
Open: **sdk-manual/example-browser.html** in your browser

Features:
- Visual form-based testing
- Real-time API interaction
- Output logging
- No coding required!

## Step 3: Use the SDK

### TypeScript

```typescript
import { FountainSDK } from './sdk-manual/fountain-sdk';

const fountain = new FountainSDK('http://localhost:3000');
const auth = await fountain.login('company-1');
console.log('Welcome:', auth.company.name);
```

### JavaScript

```javascript
// Use axios
const response = await axios.post('http://localhost:3000/api/v1/auth', {
  companyId: 'company-1'
});

const jwt = response.data.jwt;
console.log('JWT:', jwt);
```

### Browser JavaScript

See `sdk-manual/example-browser.html` for a complete working example!

## Step 4: Run Tests

```bash
./test-api.sh
```

This will:
1. Login to the API
2. Create a stablecoin
3. Burn the stablecoin
4. Show all logs

## Available Test Companies

```
1. company-1 → Park America
2. company-2 → Tech Startup Inc
```

## What's Included?

- ✅ **NestJS API** - Production-ready backend
- ✅ **Swagger UI** - Interactive API docs
- ✅ **TypeScript SDK** - Type-safe integration
- ✅ **JavaScript SDK** - For browser/Node.js
- ✅ **Browser Demo** - No coding needed
- ✅ **Auto SDK Generator** - Generate for any language

## Documentation Files

| File | What |
|------|------|
| `README.md` | Full API documentation |
| `SDK_QUICKSTART.md` | 5-minute SDK setup |
| `sdk-manual/README.md` | Complete SDK reference |
| `COMPANIES.md` | Test credentials |
| `../LOGGING_EXAMPLE.md` | Expected log format |

## Quick Commands

```bash
# Start API
npm run start:dev

# Build for production
npm run build

# Run in production
npm run start:prod

# Test API
./test-api.sh

# Generate SDKs (TypeScript, JavaScript, Python)
./generate-sdk.sh
```

## Troubleshooting

### Port already in use?
```bash
# Use different port
PORT=3001 npm run start:dev
```

### CORS errors?
They shouldn't happen in dev mode. If they do, check that API is running on the right port.

### Import errors?
Make sure you're in the `fountain-api` directory:
```bash
cd fountain-api
npm run start:dev
```

## Next Steps

1. **Try Swagger UI** - http://localhost:3000/api/docs
2. **Try Browser Demo** - Open `sdk-manual/example-browser.html`
3. **Use the SDK** - See `sdk-manual/README.md`
4. **Read Full Docs** - See `README.md`

## Architecture

```
┌─────────────────┐
│   Your App      │
│  (uses SDK)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Fountain API   │
│    NestJS       │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
 XRPL      Binance
 (Mint)     (Rates)
```

## Common Tasks

### Create a stablecoin

```typescript
const result = await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-123',
  companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
  clientName: 'My Client',
  currencyCode: 'MYTOKEN',
  amount: 10000,
  depositType: 'RLUSD',
  webhookUrl: 'http://your-domain.com/webhook',
});
```

### Burn a stablecoin

```typescript
const result = await fountain.burnStablecoin({
  stablecoinId: result.operationId,
  currencyCode: 'MYTOKEN',
  amountBrl: 5000,
  returnAsset: 'RLUSD',
  webhookUrl: 'http://your-domain.com/webhook',
});
```

### Get stablecoin details

```typescript
const details = await fountain.getStablecoin('stablecoin-id');
console.log(details);
```

## Support

- 🔗 API Docs: http://localhost:3000/api/docs
- 📚 README: `fountain-api/README.md`
- 🎓 SDK Guide: `sdk-manual/README.md`
- ⚡ Quick Start: `SDK_QUICKSTART.md`

---

**Ready to go!** Start with the Swagger UI: http://localhost:3000/api/docs 🎉
