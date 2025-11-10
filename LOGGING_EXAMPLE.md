# 📊 Logging Examples - Fountain Backend

Este arquivo mostra exemplos de como os logs aparecem quando você chama as rotas da API.

---

## 🔐 Exemplo 1: User Authentication

### Requisição:

```bash
curl -X POST http://localhost:3000/api/v1/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
  }'
```

### Logs Gerados:

```
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING LOGIN OPERATION
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: {"email":"newuser@example.com"}

⚙️ [1] Looking up user by email
   └─ {"email":"newuser@example.com"}

✅ User found: PASSED
   └─ {"companyId": "550e8400-e29b-41d4-a716-446655440000", "status":"Active"}

⚙️ [2] Generating JWT token
ℹ️ JWT token generated successfully
   └─ {"expiresIn":"7d"}

╔════════════════════════════════════════════════════════════════╗
║ ✅ LOGIN OPERATION SUCCESS
╚════════════════════════════════════════════════════════════════╝

📊 Result: {
   "jwt": "eyJhbGc...",
   "expires": "7d"
}
```

---

## 🪙 Exemplo 2A: Create new Stablecoin (Depósito On-Chain RLUSD → Create Token: CUSTOM_BRL)

### Requisição:

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "clientId": "88995721-e29b-41d4-a716-446655440001",
      "companyWallet": "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
      "webhookUrl": "https://webhook.parkamerica.com/client123",
      "clientName": "Park America Building",
      "depositType": "RLUSD",
      "stableCode": "PABRL",
      "amount": 13000,
   }'
```

### Logs Esperados:

```
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING MINT OPERATION
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: {
   "companyId": "550e8400-e29b-41d4-a716-446655440000",
   "companyWallet": "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
   "clientId": "88995721-e29b-41d4-a716-446655440001",
   "webhookUrl": "https://webhook.acme.com/fountain",
   "clientName": "Park America Building",
   "depositType": "RLUSD",
   "stableCode": "PABRL",
   "amount": 13000,
}

⚙️ [1] Generating temporary deposit wallet (on-chain)
   └─ {
      "companyId":"550e8400-e29b-41d4-a716-446655440000",
      "walletType":"temporary",
      "address":"rcLASSiCq8LWcymCHaCgK19QMEvUspuRM",
      "seed":"***masked***"
   }

⚙️ [2] Calculating on-chain require amount
   ├─ Fetch Dolar price: { "rate": 5.25 }
   └─ Calc: 13000 / 5.25 == 2476.190476

⚙️ [3] Creating operation record
✨ OPERATION CREATED - ID: 660e8400-e29b-41d4-a716-446655440001
   └─ Data: {
     "stablecoinId":"660e8400-e29b-41d4-a716-446655440001",
     "status":"REQUIRE_DEPOSIT",
     "currencyCode":"PABRL",
     "amountRLUSD": 2476.190476,
     "amountDeposited": 0,
     "amountRLBRL":13000,
     "paymentMethod":"RLUSD"
   }

⚙️ [4] Starting subscribe for this operation
   LISTEN DEPOSIT ON rcLASSiCq8LWcymCHaCgK19QMEvUspuRM

╔════════════════════════════════════════════════════════════════╗
║ ✅ OPERATION CREATED
╚════════════════════════════════════════════════════════════════╝
📊 Result: {
   "operationId":"660e8400-e29b-41d4-a716-446655440001",
   "status":"REQUIRE_DEPOSIT",
   "amountRLUSD": 2476.190476,
   "wallet": "rcLASSiCq8LWcymCHaCgK19QMEvUspuRM",
}
```

### Listener ouve o pagamento do cliente 

```bash
⚙️ [1] Catch new deposit on rcLASSiCq8LWcymCHaCgK19QMEvUspuRM
   ├─ Expected: 2476.190476
   └─ Deposited: 2476.190476

⚙️ [2] Deposit operation record
✨ OPERATION UPDATE - ID: 660e8400-e29b-41d4-a716-446655440001
   └─ Data: {
     "stablecoinId": "660e8400-e29b-41d4-a716-446655440001",
     "status": "DEPOSIT_CONFIRMED",
     "amountRLUSD": 2476.190476,
     "amountDeposited": 2476.190476,
     "txhash": "0x123AECF..."
   }

⚙️ [3] Mint APBRL on-chain
⛓️ BLOCKCHAIN TRANSACTION
   ├─ TxHash: 0x0ABC123123...
   └─ Data: {
      "type": "issued_currency_payment",
      "currency": "APBRL",
      "amount": 13000,
   }

⚙️ [4] Deposit APBRL to company wallet
   ├─ TxHash: 0x4458f8c9a...
   └─ Data: { to: "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr" }

⚙️ [5] Sending webhook notification
🔔 WEBHOOK DELIVERY - DELIVERED
   ├─ URL: https://webhook.parkamerica.com/client123
   └─ Event: mint.stablecoin.completed
```

---





## 🪙 Exemplo 2B: Mint more Stablecoin (Depósito On-Chain RLUSD → Mint +CUSTOM_BRL)

### Requisição:

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin/mint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
      "stablecoinId": "660e8400-e29b-41d4-a716-446655440001",
      "companyWallet": "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
      "webhookUrl": "https://webhook.parkamerica.com/client123",
      "depositType": "RLUSD",
      "amount": 5000,
   }'\
```

### Logs Esperados:

```
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING MINT OPERATION
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: {
   "stablecoinId": "660e8400-e29b-41d4-a716-446655440001",
   "companyWallet": "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
   "depositType": "RLUSD",
   "amount": 5000,
}

⚙️ [1] Validating stablecoin exists
✅ Stablecoin found: PASSED
   └─ {
      "stablecoinId":"660e8400-e29b-41d4-a716-446655440001",
      "currencyCode":"PABRL",
      "issuer":"rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
      "status":"ACTIVE"
   }

⚙️ [2] Calculating on-chain require amount
   ├─ Fetch Dolar price: { "rate": 5.25 }
   └─ Calc: 5000 / 5.25 == 952.380952

⚙️ [3] Starting subscribe for deposit confirmation
   LISTEN DEPOSIT ON rcLASSiCq8LWcymCHaCgK19QMEvUspuRM

╔════════════════════════════════════════════════════════════════╗
║ ✅ OPERATION CREATED - AWAITING DEPOSIT
╚════════════════════════════════════════════════════════════════╝
📊 Result: {
   "operationId":"770e8400-e29b-41d4-a716-446655440002",
   "status":"REQUIRE_DEPOSIT",
   "amountRLUSD": 952.380952,
   "amountBRL": 5000,
}
```

### Listener ouve o pagamento do cliente

```bash
⚙️ [1] Catch new deposit on rcLASSiCq8LWcymCHaCgK19QMEvUspuRM
   ├─ Expected: 952.380952
   └─ Deposited: 952.380952

⚙️ [2] Deposit operation record
✨ OPERATION UPDATE - ID: 770e8400-e29b-41d4-a716-446655440002
   └─ Data: {
     "stablecoinId": "660e8400-e29b-41d4-a716-446655440001",
     "status": "DEPOSIT_CONFIRMED",
     "amountRLUSD": 952.380952,
     "amountDeposited": 952.380952,
     "txhash": "0x456AECF...",
     "amountBRL": 5000
   }

⚙️ [3] Mint PABRL on-chain
⛓️ BLOCKCHAIN TRANSACTION
   ├─ TxHash: 0x5678DEF456...\
   └─ Data: {
      "type": "issued_currency_payment",
      "currency": "PABRL",
      "amount": 5000,
   }

⚙️ [4] Deposit PABRL to company wallet
   ├─ TxHash: 0x7890ABC123...\
   └─ Data: { to: "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr" }

⚙️ [5] Sending webhook notification
🔔 WEBHOOK DELIVERY - DELIVERED
   ├─ URL: https://webhook.parkamerica.com/client123
   └─ Event: mint.stablecoin.completed
```

---

## 🔥 Exemplo 2C: Withdraw Stablecoin (Depósito On-Chain CUSTOM_BRL → Burn CUSTOM_BRL → Depósito On-Chain RLUSD to company)

### Requisição:

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin/burn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
      "stablecoinId": "550e8400-e29b-41d4-a716-446655440000",
      "currencyCode": "APBRL",
      "amountBrl": 500.00,
      "returnAsset": "RLUSD", 
      "clientWallet": "rClientOnChainWallet...",
      "webhookUrl": "https://webhook.acme.com/fountain"
   }'
```

### Logs Esperados:

```
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING BURN OPERATION (RLUSD)
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: {"stablecoinId":"550e8400-e29b-41d4-a716-446655440000","amountBrl":500.00,"returnAsset":"RLUSD"}

⚙️  [1] Validating stablecoin exists
✅ Stablecoin found: PASSED

⚙️  [2] Validating sufficient BRL balance
✅ Balance sufficient: PASSED
   └─ {"available":1000.50,"requested":500.00}

⚙️  [3] Fetching exchange rate
ℹ️  Exchange rate retrieved
   └─ {"source":"BACEN","rateUsdBrl":5.25}

⚙️  [4] Calculating on-chain return amount (RLUSD/XRP)
🧮 Return Calculation
   ├─ Inputs: {"amountBrl":500.00,"rateUsdBrl":5.25,"returnAsset":"RLUSD"}
   └─ Output: {"rlusdToReturn":95.238095,"notes":"uses USD/BRL oracle; XRP path skipped"}

⚙️  [5] Executing clawback (partial) on XRPL
⛓️  BLOCKCHAIN TRANSACTION
   ├─ TxHash: 0xCLAWABC123...
   └─ Data: {"action":"clawback","currency":"APBRL","tokenAmount":500.00}

⚙️  [6] Preparing on-chain transfer
✅ Transfer prepared
   └─ {"asset":"RLUSD","destination":"rClientOnChainWallet..."}

⚙️  [7] Sending on-chain transfer
⛓️  BLOCKCHAIN TRANSACTION
   ├─ TxHash: 0xSENDRLUSD456...
   └─ Data: {"asset":"RLUSD","amount":95.238095,"destination":"rClientOnChainWallet..."}

⚙️  [8] Updating issuer collateral
🔄 COLLATERAL STATE UPDATED - ISSUER
   ├─ Old: {"totalXrp":1190.57,"totalBrl":151000.50}
   └─ New: {"totalXrp":1095.33,"totalBrl":150500.50}

⚙️  [9] Sending completion webhook
🔔 WEBHOOK DELIVERY - DELIVERED
   ├─ URL: https://client-webhook.example.com/events
   └─ Event: operation.completed

╔════════════════════════════════════════════════════════════════╗
║ ✅ BURN OPERATION SUCCESS (RLUSD)
╚════════════════════════════════════════════════════════════════╝
📊 Result: {"operationId":"770e8400-e29b-41d4-a716-446655440002","status":"completed","amountBrlBurned":500.00,"amountRlusdReturned":95.238095}
```

---

## 🪙 Exemplo 3A: Create new Stablecoin (Depósito Off-Chain PIX → Create Token: CUSTOM_BRL)

### Requisição:

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
      "companyId": "550e8400-e29b-41d4-a716-446655440000",
      "clientId": "99885544-e29b-41d4-a716-446655440003",
      "companyWallet": "rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr",
      "webhookUrl": "https://webhook.parkamerica.com/client456",
      "clientName": "Tech Startup Inc",
      "depositType": "PIX",
      "stableCode": "TSIBRL",
      "amount": 20000,
   }'\
```

### Logs Esperados:

```
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING STABLECOIN CREATION (PIX MODE)
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: {
   "companyId": "550e8400-e29b-41d4-a716-446655440000",
   "clientId": "99885544-e29b-41d4-a716-446655440003",
   "clientName": "Tech Startup Inc",
   "depositType": "PIX",
   "stableCode": "TSIBRL",
   "amount": 20000,
}

⚙️ [1] Generating XRPL wallet for issuer
   └─ {
      "address": "rTechStartupXRPLWallet1234567890",
      "walletCreatedAt": "2024-11-10T12:30:00.000Z"
   }

⚙️ [2] Setting up PIX payment via Asas
🔗 ASAS INTEGRATION
   ├─ Merchant Name: Tech Startup Inc
   ├─ Merchant ID: tech-startup-99885544
   └─ Status: MERCHANT_REGISTERED

⚙️ [3] Generating PIX payment QR Code
📱 PIX QR CODE GENERATED
   ├─ Type: Dynamic PIX
   ├─ Expiration: 24 hours
   └─ Value: BRL 20.000,00

⚙️ [4] Creating stablecoin record
✨ STABLECOIN CREATED - ID: 880e8400-e29b-41d4-a716-446655440004
   └─ Data: {
     "stablecoinId": "880e8400-e29b-41d4-a716-446655440004",
     "currencyCode": "TSIBRL",
     "issuer": "rTechStartupXRPLWallet1234567890",
     "depositMode": "PIX",
     "status": "WAITING_PAYMENT",
     "amountBrl": 20000,
     "amountDeposited": 0
   }

⚙️ [5] Starting subscribe for PIX payment
   LISTEN PIX PAYMENT - Asas Webhook for merchant tech-startup-99885544

╔════════════════════════════════════════════════════════════════╗
║ ✅ STABLECOIN SETUP COMPLETE - AWAITING PIX PAYMENT
╚════════════════════════════════════════════════════════════════╝
📊 Result: {
   "stablecoinId": "880e8400-e29b-41d4-a716-446655440004",
   "status": "WAITING_PAYMENT",
   "currencyCode": "TSIBRL",
   "qrCode": "00020126580014br.gov.bcb.pix...",
   "pixExpiration": "2024-11-11T12:30:00.000Z",
   "amountBrl": 20000,
}
```

---

## 🪙 Exemplo 3B: Mint more Stablecoin (Depósito Off-Chain PIX → Mint +CUSTOM_BRL)

### Requisição:

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin/mint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
      "stablecoinId": "880e8400-e29b-41d4-a716-446655440004",
      "companyWallet": "rTechStartupXRPLWallet1234567890",
      "webhookUrl": "https://webhook.parkamerica.com/client456",
      "depositType": "PIX",
      "amount": 8000,
   }'\
```

### Listener recebe notificação PIX via Asas

```bash
⚙️ [1] Asas webhook received - PIX payment confirmed
   ├─ Merchant: tech-startup-99885544
   ├─ Amount: BRL 8.000,00
   ├─ Payer CPF: 123.456.789-00 (KYC verified)
   └─ TxID: pix-2024-11-10-001

⚙️ [2] Fetching current exchange rate
ℹ️  Exchange rate retrieved
   └─ {"source":"BACEN","rateUsdBrl":5.25,"rateBrlXrp":0.035}

⚙️ [3] Converting BRL to XRP via Binance
🔄 CURRENCY CONVERSION
   ├─ Amount BRL: 8000
   ├─ Rate BRL/XRP: 0.035
   └─ Calc: 8000 * 0.035 == 280 XRP

⚙️ [4] Purchasing XRP and depositing to issuer wallet
⛓️ BLOCKCHAIN TRANSACTION
   ├─ TxHash: 0x9876BIN234...
   └─ Data: {
      "action": "deposit",
      "asset": "XRP",
      "amount": 280,
      "destination": "rTechStartupXRPLWallet1234567890"
   }

⚙️ [5] Operation record update
✨ OPERATION UPDATE - ID: 990e8400-e29b-41d4-a716-446655440005
   └─ Data: {
     "stablecoinId": "880e8400-e29b-41d4-a716-446655440004",
     "status": "DEPOSIT_CONFIRMED",
     "amountBrl": 8000,
     "amountXrpDeposited": 280,
     "pixTxId": "pix-2024-11-10-001"
   }

⚙️ [6] Mint TSIBRL on-chain
⛓️ BLOCKCHAIN TRANSACTION
   ├─ TxHash: 0x3456MNT789...
   └─ Data: {
      "type": "issued_currency_payment",
      "currency": "TSIBRL",
      "amount": 8000,
   }

⚙️ [7] Deposit TSIBRL to company wallet
   ├─ TxHash: 0xABCD5678EF...
   └─ Data: { to: "rTechStartupXRPLWallet1234567890" }

⚙️ [8] Sending webhook notification
🔔 WEBHOOK DELIVERY - DELIVERED
   ├─ URL: https://webhook.parkamerica.com/client456
   └─ Event: mint.stablecoin.completed
```

---

## 🔥 Exemplo 3C: Withdraw Stablecoin (Depósito On-Chain CUSTOM_BRL → Burn CUSTOM_BRL → Depósito Off-Chain PIX to company)

### Requisição:

```bash
curl -X POST http://localhost:3000/api/v1/stablecoin/burn \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{
      "stablecoinId": "880e8400-e29b-41d4-a716-446655440004",
      "currencyCode": "TSIBRL",
      "amountBrl": 3000.00,
      "returnAsset": "PIX",
      "clientCpf": "123.456.789-00",
      "webhookUrl": "https://webhook.parkamerica.com/client456"
   }'\
```

### Logs Esperados:

```
╔════════════════════════════════════════════════════════════════╗
║ ▶️  STARTING BURN OPERATION (PIX)
╚════════════════════════════════════════════════════════════════╝
📋 Input Data: {"stablecoinId":"880e8400-e29b-41d4-a716-446655440004","amountBrl":3000.00,"returnAsset":"PIX","clientCpf":"123.456.789-00"}

⚙️  [1] Validating stablecoin exists
✅ Stablecoin found: PASSED
   └─ {"stablecoinId":"880e8400-e29b-41d4-a716-446655440004","currencyCode":"TSIBRL","issuer":"rTechStartupXRPLWallet1234567890"}

⚙️  [2] Validating sufficient BRL balance
✅ Balance sufficient: PASSED
   └─ {"available":8000.00,"requested":3000.00}

⚙️  [3] Fetching exchange rate
ℹ️  Exchange rate retrieved
   └─ {"source":"BACEN","rateUsdBrl":5.25,"rateBrlXrp":0.035}

⚙️  [4] Calculating on-chain return amount (TSIBRL → XRP)
🧮 Return Calculation
   ├─ Inputs: {"amountBrl":3000.00,"rateBrlXrp":0.035}
   └─ Output: {"xrpToReturn":105.00,"notes":"uses BRL/XRP conversion"}

⚙️  [5] Executing clawback (partial) on XRPL
⛓️  BLOCKCHAIN TRANSACTION
   ├─ TxHash: 0xCLAW1111...
   └─ Data: {"action":"clawback","currency":"TSIBRL","tokenAmount":3000.00}

⚙️  [6] Converting XRP to BRL via Binance
🔄 CURRENCY CONVERSION
   ├─ Amount XRP: 105
   ├─ Rate XRP/BRL: 28.57
   └─ Calc: 105 * 28.57 == 3000.00 BRL

⚙️  [7] Sending PIX refund to client
🔗 ASAS PIX TRANSFER
   ├─ Destination CPF: 123.456.789-00
   ├─ Amount: BRL 3.000,00
   ├─ Status: PROCESSING
   └─ TxID: pix-refund-2024-11-10-001

⚙️  [8] Waiting for PIX delivery confirmation
⏳ PIX STATUS
   ├─ Initial Status: PROCESSING
   └─ Updated Status: COMPLETED (within 30 seconds)

⚙️  [9] Updating issuer collateral
🔄 COLLATERAL STATE UPDATED - ISSUER
   ├─ Old: {"totalXrp":380.00,"totalBrl":8000.00}
   └─ New: {"totalXrp":275.00,"totalBrl":5000.00}

⚙️  [10] Sending completion webhook
🔔 WEBHOOK DELIVERY - DELIVERED
   ├─ URL: https://webhook.parkamerica.com/client456
   └─ Event: burn.stablecoin.completed

╔════════════════════════════════════════════════════════════════╗
║ ✅ BURN OPERATION SUCCESS (PIX)
╚════════════════════════════════════════════════════════════════╝
📊 Result: {"operationId":"AA0e8400-e29b-41d4-a716-446655440006","status":"completed","amountBrlBurned":3000.00,"amountXrpUsed":105.00,"pixRefundTxId":"pix-refund-2024-11-10-001"}
```

---

## 🎯 Como Usar

### Development (Verbose Logging):

```bash
npm start:dev
# Ver todos os logs incluindo DEBUG
```

### Production (Summary Only):

```bash
NODE_ENV=production npm start:prod
# Ver apenas INFO, WARN, ERROR
```

### Filtrar Logs por Tipo:

```bash
# Apenas operações bem-sucedidas
npm start:dev | grep "✅\|SUCCESS"

# Apenas erros
npm start:dev | grep "❌\|ERROR"

# Apenas operações específicas
npm start:dev | grep "MINT\|BURN"
```

---

## 📚 Métodos Disponíveis no CustomLogger

```typescript
// Iniciar/finalizar operações
logger.logOperationStart(operationType: string, data: any)
logger.logOperationSuccess(operationType: string, result: any)
logger.logOperationError(operationType: string, error: any)

// Passos da operação
logger.logStep(stepNumber: number, stepName: string, details?: any)

// Validações
logger.logValidation(validationName: string, result: boolean, details?: any)

// Criação/Atualização de dados
logger.logDataCreated(entityType: string, id: string, data: any)
logger.logStateUpdate(entity: string, id: string, oldState: any, newState: any)

// Cálculos e transações
logger.logCalculation(calculationName: string, inputs: any, output: any)
logger.logBlockchainTransaction(txHash: string, data: any)
logger.logWebhookDelivery(webhookUrl: string, eventType: string, success: boolean, attempt: number)

// Gerais
logger.logInfo(message: string, data?: any)
logger.logWarning(message: string, data?: any)
logger.logError(message: string, error?: any)
logger.logDatabaseQuery(query: string, parameters?: any)
```

---
