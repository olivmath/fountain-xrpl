---
id: quickstart
title: Quickstart
sidebar_position: 1
---

# Quickstart

This guide will get you up and running with the Fountain API and SDKs in 5 minutes.

## 1. Prerequisites

- Node.js 18+
- npm

## 2. Start the API

First, start the Fountain API locally.

```bash
cd fountain-api
npm install
npm run start:dev
```

The API will be running at `http://localhost:3000`.

## 3. Use the SDK

The easiest way to interact with the API is through the TypeScript SDK.

### Installation

For this quickstart, you can use the SDK directly from the `sdks/typescript` directory. For production use, you would typically install it from NPM.

### Example

Here's a complete example of how to log in, create a stablecoin, and burn it.

```typescript
import { FountainSDK } from '../../sdks/typescript/fountain-sdk';

async function main() {
  // 1. Initialize SDK
  const fountain = new FountainSDK('http://localhost:3000');

  // 2. Login
  const auth = await fountain.login('admin@sonica.com');
  console.log('Logged in as:', auth.companyName);

  // 3. Create a Stablecoin
  const stablecoin = await fountain.createStablecoin({
    companyId: auth.companyId,
    clientId: 'client-' + Date.now(),
    companyWallet: 'rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr',
    clientName: 'My Test Client',
    currencyCode: 'TEST',
    amount: 1000,
    depositType: 'RLUSD',
    webhookUrl: 'https://example.com/webhook',
  });

  console.log('Stablecoin created:', stablecoin);
  console.log(`Please deposit ${stablecoin.amountRLUSD} RLUSD to ${stablecoin.wallet}`);

  // In a real scenario, you would wait for the deposit to be confirmed.
  // For this example, we'll proceed to burn.

  // 4. Burn the Stablecoin
  const burn = await fountain.burnStablecoin({
    stablecoinId: stablecoin.operationId,
    currencyCode: 'TEST',
    amountBrl: 500,
    returnAsset: 'RLUSD',
    webhookUrl: 'https://example.com/webhook',
  });

  console.log('Stablecoin burned:', burn);
}

main().catch(console.error);
```

## 4. Explore the API

While the API is running, you can explore all the endpoints and schemas using the interactive Swagger UI.

**Swagger UI:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

This is a great way to understand the full capabilities of the API.
