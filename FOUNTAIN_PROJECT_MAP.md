# 🗺️ Fountain Project Map

Complete overview of the Fountain API hackathon project.

## 📁 Directory Structure

```
/Users/olivmath/dev/xrpl/
├── v2/                                    ← Parent directory
│   ├── FOUNTAIN_PROJECT_MAP.md             ← This file
│   ├── IMPLEMENTATION_SUMMARY.md           ← What was built
│   ├── LOGGING_EXAMPLE.md                  ← Expected log format
│   ├── NEW_VERSION.md                      ← Technical specification
│   ├── CLAUDE.md                           ← For Claude Code
│   │
│   └── fountain-api/                       ← Main API project
│       ├── GETTING_STARTED.md              ← Quick start guide
│       ├── README.md                       ← Full documentation
│       ├── SDK_QUICKSTART.md               ← SDK setup guide
│       ├── COMPANIES.md                    ← Test credentials
│       │
│       ├── src/
│       │   ├── main.ts                     ← Entry point + Swagger
│       │   ├── app.module.ts               ← App configuration
│       │   │
│       │   ├── auth/
│       │   │   ├── auth.controller.ts      ← Login endpoint
│       │   │   ├── auth.service.ts         ← JWT logic
│       │   │   └── auth.module.ts
│       │   │
│       │   ├── stablecoin/
│       │   │   ├── stablecoin.controller.ts ← Mint/Burn endpoints
│       │   │   ├── stablecoin.service.ts    ← Mint/Burn logic
│       │   │   └── stablecoin.module.ts
│       │   │
│       │   ├── xrpl/
│       │   │   └── xrpl.service.ts         ← XRPL integration
│       │   │
│       │   ├── binance/
│       │   │   └── binance.service.ts      ← Exchange rates
│       │   │
│       │   └── common/
│       │       └── logger.service.ts       ← Structured logging
│       │
│       ├── dist/                           ← Compiled output
│       ├── node_modules/                   ← Dependencies
│       │
│       ├── sdk-manual/                     ← SDKs for integrations
│       │   ├── fountain-sdk.ts             ← TypeScript SDK ⭐
│       │   ├── example.ts                  ← TypeScript example
│       │   ├── example-javascript.js       ← JavaScript example
│       │   ├── example-browser.html        ← Browser demo ⭐
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   └── README.md                   ← SDK documentation
│       │
│       ├── .env                            ← Configuration
│       ├── .gitignore
│       ├── package.json
│       ├── tsconfig.json
│       ├── test-api.sh                     ← Test script
│       ├── generate-sdk.sh                 ← Auto-generate SDKs
│       ├── openapi-generator-config.json
│       └── openapi.json                    ← Generated (after running)
```

---

## 🎯 Quick Navigation

### 🚀 **Getting Started**
1. Read: [`fountain-api/GETTING_STARTED.md`](fountain-api/GETTING_STARTED.md)
2. Start API: `npm run start:dev`
3. Open Swagger: http://localhost:3000/api/docs

### 📖 **Documentation**
| File | Purpose |
|------|---------|
| [`FOUNTAIN_PROJECT_MAP.md`](FOUNTAIN_PROJECT_MAP.md) | This file - project overview |
| [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md) | What was built + checklist |
| [`fountain-api/GETTING_STARTED.md`](fountain-api/GETTING_STARTED.md) | 2-minute quick start |
| [`fountain-api/README.md`](fountain-api/README.md) | Complete API documentation |
| [`fountain-api/SDK_QUICKSTART.md`](fountain-api/SDK_QUICKSTART.md) | 5-minute SDK setup |
| [`fountain-api/sdk-manual/README.md`](fountain-api/sdk-manual/README.md) | Complete SDK reference |
| [`fountain-api/COMPANIES.md`](fountain-api/COMPANIES.md) | Test company credentials |
| [`LOGGING_EXAMPLE.md`](LOGGING_EXAMPLE.md) | Expected log format |
| [`NEW_VERSION.md`](NEW_VERSION.md) | Technical specification |
| [`CLAUDE.md`](CLAUDE.md) | For Claude Code instances |

### 💻 **Code Files**

**Core API:**
- [`fountain-api/src/main.ts`](fountain-api/src/main.ts) - Entry point
- [`fountain-api/src/auth/`](fountain-api/src/auth/) - Authentication
- [`fountain-api/src/stablecoin/`](fountain-api/src/stablecoin/) - Mint/Burn
- [`fountain-api/src/xrpl/`](fountain-api/src/xrpl/) - XRPL integration
- [`fountain-api/src/binance/`](fountain-api/src/binance/) - Exchange rates
- [`fountain-api/src/common/logger.service.ts`](fountain-api/src/common/logger.service.ts) - Logger

**SDKs:**
- [`fountain-api/sdk-manual/fountain-sdk.ts`](fountain-api/sdk-manual/fountain-sdk.ts) ⭐ TypeScript SDK
- [`fountain-api/sdk-manual/example-javascript.js`](fountain-api/sdk-manual/example-javascript.js) - JavaScript SDK
- [`fountain-api/sdk-manual/example-browser.html`](fountain-api/sdk-manual/example-browser.html) ⭐ Browser demo

### 🧪 **Testing & Configuration**
- [`fountain-api/test-api.sh`](fountain-api/test-api.sh) - API test script
- [`fountain-api/generate-sdk.sh`](fountain-api/generate-sdk.sh) - SDK auto-generator
- [`fountain-api/.env`](fountain-api/.env) - Configuration

---

## 🎮 How to Use

### 1. Start the API
```bash
cd fountain-api
npm install
npm run start:dev
```

### 2. Try Swagger UI
Open: http://localhost:3000/api/docs
- See all endpoints
- Try requests live
- View schemas

### 3. Try Browser Demo
Open: `fountain-api/sdk-manual/example-browser.html`
- Visual interface
- No coding needed
- Real-time interaction

### 4. Use the SDK
```typescript
import { FountainSDK } from './fountain-api/sdk-manual/fountain-sdk';

const fountain = new FountainSDK('http://localhost:3000');
await fountain.login('company-1');
// ... use SDK methods
```

### 5. Run Tests
```bash
./fountain-api/test-api.sh
```

---

## ✨ Key Features

| Feature | Location |
|---------|----------|
| **REST API** | `fountain-api/src/` |
| **Authentication** | `fountain-api/src/auth/` |
| **Mint Operation** | `fountain-api/src/stablecoin/` |
| **Burn Operation** | `fountain-api/src/stablecoin/` |
| **XRPL Integration** | `fountain-api/src/xrpl/` |
| **Exchange Rates** | `fountain-api/src/binance/` |
| **Swagger Docs** | http://localhost:3000/api/docs |
| **TypeScript SDK** | `fountain-api/sdk-manual/fountain-sdk.ts` |
| **JavaScript SDK** | `fountain-api/sdk-manual/example-javascript.js` |
| **Browser Demo** | `fountain-api/sdk-manual/example-browser.html` |
| **Logging** | `fountain-api/src/common/logger.service.ts` |

---

## 📊 Architecture

```
┌──────────────────────────────────────────────┐
│  Client Applications (Your Code)             │
│  - Uses Fountain SDK                         │
│  - Or calls REST API directly                │
└────────────┬─────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────┐
│  Fountain API (NestJS)                       │
│  ┌──────────────────────────────────────┐   │
│  │ Endpoints:                           │   │
│  │ • POST /api/v1/auth                  │   │
│  │ • POST /api/v1/stablecoin            │   │
│  │ • POST /api/v1/stablecoin/burn       │   │
│  │ • GET /api/v1/stablecoin/:id         │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ Services:                            │   │
│  │ • AuthService                        │   │
│  │ • StablecoinService                  │   │
│  │ • XrplService                        │   │
│  │ • BinanceService                     │   │
│  │ • CustomLogger                       │   │
│  └──────────────────────────────────────┘   │
└────────┬─────────────────────────┬───────────┘
         │                         │
         ↓                         ↓
    ┌─────────┐            ┌─────────────┐
    │  XRPL   │            │  Binance    │
    │ Testnet │            │  API        │
    │ (Mint)  │            │ (Rates)     │
    └─────────┘            └─────────────┘
```

---

## 🔄 API Flow Example

```
Client Request:
┌─────────────────────────────────────┐
│ POST /api/v1/stablecoin             │
│ Authorization: Bearer JWT_TOKEN     │
│ Body: { currencyCode, amount, ...}  │
└────────────────┬────────────────────┘
                 ↓
     ┌───────────────────────┐
     │ Validate JWT Token    │
     └───────────┬───────────┘
                 ↓
     ┌───────────────────────┐
     │ Create Stablecoin DB  │
     └───────────┬───────────┘
                 ↓
     ┌───────────────────────┐
     │ Generate Temp Wallet  │
     │ (XRPL)                │
     └───────────┬───────────┘
                 ↓
     ┌───────────────────────┐
     │ Calculate RLUSD Rate  │
     │ (Binance)             │
     └───────────┬───────────┘
                 ↓
     ┌───────────────────────┐
     │ Log with Structured   │
     │ Logger                │
     └───────────┬───────────┘
                 ↓
Server Response:
┌─────────────────────────────────────┐
│ {                                   │
│   operationId: "uuid",              │
│   status: "REQUIRE_DEPOSIT",        │
│   amountRLUSD: 2476.19,             │
│   wallet: "rXXXXXXXXXXXXXXXXXXX"    │
│ }                                   │
└─────────────────────────────────────┘
```

---

## 📚 SDKs Available

### TypeScript SDK ⭐ **Recommended**
```typescript
import { FountainSDK } from './sdk-manual/fountain-sdk';
const fountain = new FountainSDK();
```
**File:** `fountain-api/sdk-manual/fountain-sdk.ts`

### JavaScript SDK
```javascript
const fountain = new FountainSDK('http://localhost:3000');
```
**File:** `fountain-api/sdk-manual/example-javascript.js`

### Browser Interactive Demo
Open: `fountain-api/sdk-manual/example-browser.html`
- No coding required
- Visual interface
- Real-time testing

### Auto-Generated SDKs
```bash
./fountain-api/generate-sdk.sh
```
Generates:
- TypeScript/Node.js
- JavaScript/Browser
- Python

---

## 🎓 Examples

### Example 1: Login
```bash
curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"companyId":"company-1"}'
```

### Example 2: Create Stablecoin
```bash
curl -X POST http://localhost:3000/api/v1/stablecoin \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Example 3: Using SDK
```typescript
const fountain = new FountainSDK();
await fountain.login('company-1');
await fountain.createStablecoin({...});
```

See `fountain-api/SDK_QUICKSTART.md` for more examples.

---

## 🚦 Project Status

| Component | Status | Location |
|-----------|--------|----------|
| API Backend | ✅ Complete | `fountain-api/src/` |
| Swagger UI | ✅ Complete | http://localhost:3000/api/docs |
| TypeScript SDK | ✅ Complete | `fountain-api/sdk-manual/fountain-sdk.ts` |
| JavaScript SDK | ✅ Complete | `fountain-api/sdk-manual/example-javascript.js` |
| Browser Demo | ✅ Complete | `fountain-api/sdk-manual/example-browser.html` |
| Documentation | ✅ Complete | Multiple .md files |
| Auto SDK Gen | ✅ Complete | `fountain-api/generate-sdk.sh` |
| Tests | ✅ Complete | `fountain-api/test-api.sh` |

---

## 🎉 Ready to Go!

Everything is set up for the hackathon:

1. ✅ Run `npm run start:dev` to start API
2. ✅ Open http://localhost:3000/api/docs for Swagger
3. ✅ Use SDK to integrate with your app
4. ✅ All documentation is complete
5. ✅ Test scripts are ready

**Good luck with your hackathon!** 🚀

---

**Last Updated:** November 10, 2024  
**Project:** Fountain - XRPL Stablecoin API  
**Status:** ✅ Production-Ready MVP
