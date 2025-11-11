# XRP Scripts - Fountain API Testing

Scripts para testar o fluxo completo de mint de stablecoins usando XRP como depósito.

## Estrutura

```
xrp/
├── webhook-server.js     # Servidor para receber webhooks
├── deposit.js            # Fluxo completo de depósito
├── deposit-partial.js    # Fluxo com depósitos parciais
├── verify-balance.js     # Verificar saldos e status
└── README.md            # Este arquivo
```

## Pré-requisitos

1. **Fountain API rodando**:
   ```bash
   cd fountain-api
   npm run start:dev
   ```

2. **Wallet XRPL com saldo**:
   - Testnet: https://xrpl.org/xrp-testnet-faucet.html
   - Guarde o seed (começa com `s...`)

3. **Dependências**:
   ```bash
   # SDK já compilado
   cd sdks/typescript
   npm run build
   ```

## Fluxo Completo (Recomendado)

### 1. Inicie o Webhook Server

Em um terminal separado:

```bash
node fountain-api/scripts/xrp/webhook-server.js
```

Isso inicia um servidor em `http://localhost:4000/webhook` para receber notificações.

**Para testes externos** (com API remota), use ngrok:
```bash
ngrok http 4000
# Use a URL https://xxx.ngrok.io/webhook como WEBHOOK_URL
```

### 2. Execute o Depósito Completo

```bash
CLIENT_SEED=sXXX... \
AMOUNT_BRL=1000 \
CURRENCY_CODE=MYBRL \
EMAIL=company-1 \
node fountain-api/scripts/xrp/deposit.js
```

**O que acontece:**

1. ✅ Login na API Fountain
2. ✅ Criação da operação de mint
3. ✅ Criação da trustline (cliente ↔ Fountain)
4. ✅ Depósito de XRP na temp wallet
5. 🔔 Webhooks:
   - `DEPOSIT_PENDING`: Wallet criada
   - `DEPOSIT_CONFIRMED`: Depósito detectado
   - `MINTED_TOKENS`: Tokens mintados e transferidos

### 3. Verifique o Saldo

```bash
# Verificar wallet do cliente
WALLET_ADDRESS=rXXX... \
CURRENCY_CODE=MYBRL \
node fountain-api/scripts/xrp/verify-balance.js

# Verificar operação
OPERATION_ID=xxx \
EMAIL=company-1 \
node fountain-api/scripts/xrp/verify-balance.js
```

## Teste de Depósitos Parciais

Simula múltiplos depósitos que somam o valor total:

```bash
CLIENT_SEED=sXXX... \
TOTAL_AMOUNT=100 \
CURRENCY_CODE=TESTBRL \
node fountain-api/scripts/xrp/deposit-partial.js
```

**Comportamento:**
- Cria operação requerendo 100 XRP
- Faz 3 depósitos parciais: 30 + 40 + 30 XRP
- Sistema acumula depósitos
- Auto-mint quando total >= requerido

**Customizar parciais:**
```bash
PARTIAL_DEPOSITS=25,25,50 node fountain-api/scripts/xrp/deposit-partial.js
```

## Variáveis de Ambiente

### Comuns

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `CLIENT_SEED` | Seed da wallet cliente (obrigatório) | - |
| `EMAIL` | Email da empresa para login | `company-1` |
| `API_URL` | URL da API Fountain | `http://localhost:3000` |
| `WEBHOOK_URL` | URL para webhooks | `http://localhost:4000/webhook` |
| `NETWORK_URL` | Rede XRPL | `wss://s.altnet.rippletest.net:51233` |

### deposit.js

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `AMOUNT_BRL` | Quantidade em BRL para mintar | `1000` |
| `CURRENCY_CODE` | Código da stablecoin | `TESTBRL` |
| `CLIENT_NAME` | Nome do cliente | `Test Client` |
| `CLIENT_ID` | ID único do cliente | `client-{timestamp}` |

### deposit-partial.js

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `TOTAL_AMOUNT` | Total XRP requerido | `100` |
| `PARTIAL_DEPOSITS` | Depósitos parciais (CSV) | Auto-split em 3 |

### verify-balance.js

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `WALLET_ADDRESS` | Endereço para verificar | - |
| `OPERATION_ID` | ID da operação | - |
| `CURRENCY_CODE` | Filtrar por moeda | - |

## Webhook Server

### Endpoints

- **POST /webhook**: Recebe webhooks da API
- **GET /health**: Health check
- **GET /events**: Lista todos eventos recebidos
- **DELETE /events**: Limpa histórico de eventos

### Eventos Recebidos

#### DEPOSIT_PENDING
```json
{
  "eventType": "DEPOSIT_PENDING",
  "operationId": "xxx",
  "status": "pending_deposit",
  "tempWalletAddress": "rXXX...",
  "amountRequired": 100
}
```

#### DEPOSIT_CONFIRMED
```json
{
  "eventType": "DEPOSIT_CONFIRMED",
  "operationId": "xxx",
  "status": "deposit_confirmed",
  "amountDeposited": 100,
  "depositCount": 1
}
```

#### MINTED_TOKENS
```json
{
  "eventType": "MINTED_TOKENS",
  "operationId": "xxx",
  "status": "completed",
  "currencyCode": "MYBRL",
  "amountMinted": 1000,
  "issuerAddress": "rISSUER..."
}
```

## Troubleshooting

### Erro: "Create trustline failed"

**Causa**: Wallet não tem XRP suficiente para reserva.

**Solução**:
```bash
# Use o faucet da testnet
# https://xrpl.org/xrp-testnet-faucet.html
```

### Erro: "Send XRP failed"

**Causa**: Saldo insuficiente ou temp wallet inválida.

**Solução**:
```bash
# Verifique saldo
WALLET_ADDRESS=rXXX... node verify-balance.js
```

### Webhooks não recebidos

**Causa**: URL do webhook inacessível pela API.

**Solução**:
- Para testes locais, API e webhook devem estar na mesma rede
- Para API remota, use ngrok ou URL pública
- Verifique logs do webhook server

### Depósito não detectado

**Causa**: WebSocket listener pode ter falhado.

**Solução**:
- Aguarde até 2 minutos (polling de fallback)
- Verifique logs da API Fountain
- Use verify-balance.js para verificar status

## Exemplos Completos

### Teste Local Completo

```bash
# Terminal 1: API
cd fountain-api
npm run start:dev

# Terminal 2: Webhook server
node fountain-api/scripts/xrp/webhook-server.js

# Terminal 3: Teste deposit
CLIENT_SEED=sXXXXXXXXXXXXXXXXXXXXXXXXXXX \
AMOUNT_BRL=5000 \
CURRENCY_CODE=APBRL \
EMAIL=sonica@example.com \
node fountain-api/scripts/xrp/deposit.js

# Terminal 4: Verificar resultado
WALLET_ADDRESS=rN7n7otQDd6FczFgLdcqpHnZc5LiMvMPAr \
CURRENCY_CODE=APBRL \
node fountain-api/scripts/xrp/verify-balance.js
```

### Teste Parcial com 4 Depósitos

```bash
CLIENT_SEED=sXXX... \
TOTAL_AMOUNT=200 \
PARTIAL_DEPOSITS=50,50,50,50 \
CURRENCY_CODE=TESTBRL \
node fountain-api/scripts/xrp/deposit-partial.js
```

## SDK Usage

Os scripts usam o Fountain SDK que abstrai:

```javascript
const { FountainSDK } = require('../../../sdks/typescript/dist/fountain-sdk');

// 1. Login
const fountain = new FountainSDK('http://localhost:3000');
await fountain.login('company-1');

// 2. Criar trustline
await fountain.createTrustline({
  clientSeed: 'sXXX...',
  currencyCode: 'MYBRL',
  issuerAddress: 'rISSUER...',
});

// 3. Criar mint operation
const response = await fountain.createStablecoin({
  companyId: 'company-1',
  clientId: 'client-123',
  companyWallet: 'rCLIENT...',
  clientName: 'Test',
  currencyCode: 'MYBRL',
  amount: 1000,
  depositType: 'XRP',
  webhookUrl: 'http://localhost:4000/webhook',
});

// 4. Verificar status
const operation = await fountain.getOperation(operationId);
const tempWallet = await fountain.getTempWalletStatus(operationId);
```

## Próximos Passos

Após sucesso nos testes:

1. **Integração Real**: Use seeds de produção e mainnet
2. **Webhook Seguro**: Implemente HMAC validation
3. **Monitoramento**: Use endpoints de admin para monitorar operações
4. **Automação**: Integre scripts no seu pipeline CI/CD

## Links Úteis

- [XRPL Testnet Faucet](https://xrpl.org/xrp-testnet-faucet.html)
- [XRPL Explorer](https://testnet.xrpl.org/)
- [Fountain API Docs](../../docs-fountain/)
- [SDK Documentation](../../../sdks/typescript/)
