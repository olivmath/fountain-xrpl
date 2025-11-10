# Fountain API - Fluxos Completos de Depósito e Transferência

## Atores do Sistema

- **Backend (Fountain API)**: Sistema que gerencia stablecoins
- **Issuer Wallet**: Carteira do Fountain que emite tokens (controlada pelo backend)
- **Cliente (Tokenizador)**: Empresa que cria stablecoins (ex: Sonica)
- **Company Wallet**: Carteira XRPL do Cliente onde tokens são recebidos
- **End-User**: Cliente final do Cliente (ex: investidor que compra tokens)
- **Temp Wallet**: Carteira temporária criada pelo backend para receber depósitos

---

## Fluxo 1: Depósito XRP → Mint Stablecoin

### Passo a Passo Detalhado

#### **Fase 1: Setup (Cliente → Backend)**

**1. Cliente cria trustline para o stablecoin** (ANTES de chamar API)
```
QUEM: Cliente (manualmente na carteira XRPL)
O QUE: TrustSet transaction
PARA: Estabelecer confiança no issuer do Fountain

Transação XRPL:
{
  TransactionType: "TrustSet",
  Account: "rCompanyWallet123...",        // Carteira do cliente
  LimitAmount: {
    currency: "BRL",                      // Código do stablecoin
    issuer: "rIssuerWallet456...",        // Carteira do Fountain (issuer)
    value: "10000000"                     // Limite máximo que aceita receber
  },
  Fee: "12"                               // Taxa em drops
}

⚠️ CRÍTICO: Cliente PRECISA fazer isso ANTES de chamar a API!
Sem trustline = mint vai falhar
```

**2. Cliente chama API para criar stablecoin**
```
QUEM: Cliente
O QUE: POST /api/v1/stablecoin
PAYLOAD:
{
  "companyId": "sonica-main",
  "clientId": "cliente-123",
  "companyWallet": "rCompanyWallet123...",  // Sua carteira XRPL
  "clientName": "Apartamento 501",
  "currencyCode": "BRL",
  "amount": 10000,                          // BRL que quer tokenizar
  "depositType": "XRP",
  "webhookUrl": "https://sonica.com/webhook"
}

RESPOSTA:
{
  "operationId": "uuid-operation-123",
  "status": "require_deposit",
  "amountXRP": 350.877,                     // XRP necessário para depositar
  "wallet": "rTempWallet789...",            // Carteira temporária para depósito
  "rateXrpBrl": 28.5                        // Taxa de conversão usada
}
```

#### **Fase 2: Processamento Backend (Automático)**

**3. Backend cria temp wallet**
```
QUEM: Backend (Fountain API)
O QUE:
- Gera nova carteira XRPL (address + seed)
- Criptografa seed com AES-256-GCM
- Armazena no banco de dados

RESULTADO:
- Temp Wallet Address: rTempWallet789...
- Encrypted Seed: iv:encrypted:authTag (guardado no DB)
```

**4. Backend calcula XRP necessário**
```
QUEM: Backend
O QUE:
1. Busca taxa XRP/BRL da Binance
   GET https://api.binance.com/api/v3/ticker/price?symbol=XRPUSDT

2. Converte USDT para BRL usando USD_BRL_RATE
   XRP/BRL = XRP/USDT × USD/BRL

3. Calcula XRP necessário
   XRP_needed = amount_BRL / rate_XRP_BRL

EXEMPLO:
- Cliente quer: 10.000 BRL
- Taxa XRP/USDT: 0.54
- Taxa USD/BRL: 5.25
- Taxa XRP/BRL: 0.54 × 5.25 = 2.835 BRL/XRP
- XRP necessário: 10.000 / 2.835 = 3.527,34 XRP

ARMAZENA NO DB:
- operation.rlusd_required = 3527.34 (usando mesmo campo)
- operation.rate_xrp_brl = 2.835
```

**5. Backend ativa temp wallet**
```
QUEM: Backend
O QUE: Envia 1.3 XRP do Issuer Wallet para Temp Wallet

Transação XRPL:
{
  TransactionType: "Payment",
  Account: "rIssuerWallet456...",
  Destination: "rTempWallet789...",
  Amount: "1300000",                    // 1.3 XRP em drops
  Fee: "12"
}

POR QUÊ:
- XRPL exige reserve mínimo (10 XRP base + 2 XRP por objeto)
- 1.3 XRP é suficiente para ativar conta

ARMAZENA NO DB:
- temp_wallet_activated_at = NOW()
- temp_wallet_activation_tx_hash = "ABC123..."
- temp_wallet_creation_ledger = 12345678
```

**6. Backend subscreve para monitorar depósitos**
```
QUEM: Backend
O QUE: WebSocket subscription no Temp Wallet

Comando XRPL WebSocket:
{
  "command": "subscribe",
  "accounts": ["rTempWallet789..."]
}

Listener ativo:
- Monitora transações tipo "Payment"
- Destination = rTempWallet789...
- Extrai Amount (em drops para XRP)

FALLBACK: Polling a cada 5 segundos se WebSocket falhar
```

#### **Fase 3: Cliente Deposita (Cliente → Temp Wallet)**

**7. Cliente envia XRP para temp wallet**
```
QUEM: Cliente (ou quem vai fazer o depósito)
O QUE: Payment transaction da sua carteira para Temp Wallet

Transação XRPL:
{
  TransactionType: "Payment",
  Account: "rClientSourceWallet...",      // Carteira de onde vem XRP
  Destination: "rTempWallet789...",       // Temp wallet do backend
  Amount: "3527340000",                   // 3.527,34 XRP em drops
  Fee: "12"
}

⚠️ PODE FAZER DEPÓSITOS PARCIAIS:
- Depósito 1: 1.000 XRP
- Depósito 2: 1.000 XRP
- Depósito 3: 1.527,34 XRP
- TOTAL: 3.527,34 XRP ✅

BACKEND DETECTA:
- WebSocket recebe evento "transaction"
- Extrai tx.transaction.Amount (string em drops)
- Converte: drops / 1.000.000 = XRP
- tx.transaction.hash para detectar duplicatas
```

#### **Fase 4: Backend Confirma e Minta (Automático)**

**8. Backend acumula depósitos**
```
QUEM: Backend
O QUE: Atualiza database com deposit tracking

POR CADA DEPÓSITO DETECTADO:
1. Verifica duplicata (txHash já existe?)
2. Se novo, adiciona ao histórico:
   {
     amount: 1000,
     txHash: "DEF456...",
     timestamp: "2025-01-10T10:30:00Z"
   }
3. Soma total depositado
4. Calcula progresso: (total / required) × 100

ARMAZENA NO DB:
- amount_deposited += novo_deposito
- deposit_count += 1
- deposit_history.push({amount, txHash, timestamp})
- status = "partial_deposit" (se ainda falta)
```

**9. Backend valida total e executa mint**
```
QUEM: Backend
O QUE: Quando total >= required, executa mint

VALIDAÇÕES:
1. Total depositado >= XRP necessário? ✅
2. Company wallet tem trustline? (query account_lines) ✅
3. Trustline tem limite suficiente? ✅

SE TUDO OK:

Transação XRPL (MINT):
{
  TransactionType: "Payment",
  Account: "rIssuerWallet456...",         // Issuer (Fountain)
  Destination: "rCompanyWallet123...",    // Cliente
  Amount: {
    currency: "BRL",                      // Stablecoin code
    issuer: "rIssuerWallet456...",        // Issuer address
    value: "10000"                        // Quantidade em BRL
  },
  Fee: "12"
}

RESULTADO:
- Cliente recebe 10.000 BRL tokens
- Tokens aparecem na carteira XRPL do cliente
- Status = "completed"
```

**10. Backend limpa temp wallet**
```
QUEM: Backend (após 16 ledgers)
O QUE: AccountDelete transaction

ESPERA:
- Ledger listener conta blocos
- Quando (current_ledger - creation_ledger) >= 16

Transação XRPL:
{
  TransactionType: "AccountDelete",
  Account: "rTempWallet789...",           // Temp wallet
  Destination: "rIssuerWallet456...",     // Issuer (recebe saldo)
  Fee: "200000"                           // 0.2 XRP (fee de delete)
}

RESULTADO:
- Temp wallet deletada
- Saldo restante (depósito - 0.2 XRP) volta pro issuer
- Libera reserve de 10 XRP
```

**11. Backend notifica cliente via webhook**
```
QUEM: Backend
O QUE: POST para webhookUrl fornecido

PAYLOAD:
{
  "event": "mint.completed",
  "operationId": "uuid-operation-123",
  "status": "completed",
  "amountBRL": 10000,
  "amountXRPDeposited": 3527.34,
  "txHash": "MINT_TX_HASH_123...",
  "companyWallet": "rCompanyWallet123...",
  "timestamp": "2025-01-10T11:00:00Z"
}
```

---

## Fluxo 2: Depósito RLUSD → Mint Stablecoin

### Diferenças em relação ao XRP

#### **Fase 1: Setup (Cliente → Backend)**

**1A. Cliente cria DUAS trustlines** (ANTES de chamar API)
```
QUEM: Cliente
O QUE: 2 TrustSet transactions

TRUSTLINE 1: Para RLUSD (receber RLUSD antes de depositar)
{
  TransactionType: "TrustSet",
  Account: "rCompanyWallet123...",
  LimitAmount: {
    currency: "RLUSD",                    // ⬅️ RLUSD issued currency
    issuer: "rRLUSDIssuer...",           // ⬅️ Issuer oficial do RLUSD
    value: "10000000"
  }
}

TRUSTLINE 2: Para stablecoin BRL (receber tokens do Fountain)
{
  TransactionType: "TrustSet",
  Account: "rCompanyWallet123...",
  LimitAmount: {
    currency: "BRL",
    issuer: "rIssuerWallet456...",       // ⬅️ Issuer do Fountain
    value: "10000000"
  }
}

⚠️ CRÍTICO:
- RLUSD é issued currency, não é nativo
- Precisa trustline para RECEBER RLUSD
- Precisa trustline para RECEBER stablecoin
```

**2. Cliente chama API** (igual XRP, mas depositType="RLUSD")

#### **Fase 2: Processamento Backend**

**3-6. Igual ao XRP** (temp wallet, cálculo, ativação, subscription)

**Diferença no cálculo:**
```
RLUSD_needed = amount_BRL / USD_BRL_RATE

EXEMPLO:
- Cliente quer: 10.000 BRL
- Taxa USD/BRL: 5.25
- RLUSD necessário: 10.000 / 5.25 = 1.904,76 RLUSD
```

#### **Fase 3: Cliente Deposita RLUSD**

**7. Cliente envia RLUSD para temp wallet**
```
QUEM: Cliente
O QUE: Payment transaction com issued currency

Transação XRPL:
{
  TransactionType: "Payment",
  Account: "rClientSourceWallet...",
  Destination: "rTempWallet789...",
  Amount: {
    currency: "RLUSD",                    // ⬅️ Issued currency
    issuer: "rRLUSDIssuer...",           // ⬅️ Issuer do RLUSD
    value: "1904.76"                      // ⬅️ Valor em RLUSD
  },
  Fee: "12"
}

BACKEND DETECTA:
- tx.transaction.Amount é OBJETO (não string)
- Extrai Amount.value (já em decimal)
- Valida Amount.currency === "RLUSD"
- Valida Amount.issuer === RLUSD_ISSUER_ADDRESS
```

#### **Fase 4: Mint e Cleanup**

**8-11. Igual ao XRP** (acumulação, validação, mint, cleanup, webhook)

---

## Fluxo 3: Cliente Transfere Tokens para End-Users

### Passo a Passo

**1. End-User cria trustline**
```
QUEM: End-User (investidor final)
O QUE: TrustSet transaction

Transação XRPL:
{
  TransactionType: "TrustSet",
  Account: "rEndUserWallet...",           // Carteira do investidor
  LimitAmount: {
    currency: "BRL",                      // Stablecoin
    issuer: "rIssuerWallet456...",        // Issuer do Fountain
    value: "1000000"                      // Limite que aceita
  },
  Fee: "12"
}

⚠️ End-User PRECISA fazer isso antes de receber tokens
```

**2. Cliente transfere tokens para End-User**
```
QUEM: Cliente (Tokenizador)
O QUE: Payment transaction

Transação XRPL:
{
  TransactionType: "Payment",
  Account: "rCompanyWallet123...",        // Carteira do cliente
  Destination: "rEndUserWallet...",       // Carteira do end-user
  Amount: {
    currency: "BRL",
    issuer: "rIssuerWallet456...",
    value: "1000"                         // 1.000 BRL tokens
  },
  Fee: "12"
}

RESULTADO:
- End-User recebe 1.000 BRL tokens
- Saldo do cliente diminui 1.000
- Transferência instantânea na blockchain
```

**3. End-User verifica saldo**
```
QUEM: End-User
O QUE: Query XRPL account_lines

Comando:
{
  "command": "account_lines",
  "account": "rEndUserWallet..."
}

RESPOSTA:
{
  "lines": [
    {
      "account": "rIssuerWallet456...",
      "balance": "1000",                  // Saldo em BRL tokens
      "currency": "BRL",
      "limit": "1000000",
      "limit_peer": "0"
    }
  ]
}
```

---

## Fluxo 4: Burn (Resgate) - Cliente → Backend

### Passo a Passo

**1. Cliente chama API de burn**
```
QUEM: Cliente
O QUE: POST /api/v1/stablecoin/burn

PAYLOAD:
{
  "stablecoinId": "uuid-stablecoin-123",
  "currencyCode": "BRL",
  "amountBrl": 5000,                      // Quantidade a resgatar
  "returnAsset": "XRP",                   // Quer receber em XRP
  "webhookUrl": "https://sonica.com/webhook"
}

RESPOSTA:
{
  "operationId": "uuid-burn-456",
  "status": "processing",
  "amountBrlBurned": 5000,
  "amountXrpReturned": 1763.67            // XRP que vai receber
}
```

**2. Backend executa clawback**
```
QUEM: Backend
O QUE: Clawback transaction (recupera tokens)

Transação XRPL:
{
  TransactionType: "Clawback",
  Account: "rIssuerWallet456...",         // Issuer
  Amount: {
    currency: "BRL",
    issuer: "rCompanyWallet123...",       // ⬅️ HOLDER (não issuer!)
    value: "5000"
  },
  Fee: "12"
}

⚠️ DIFERENÇA:
- No Clawback, "issuer" no Amount = HOLDER (quem tem os tokens)
- Account = issuer real (quem recupera)

RESULTADO:
- 5.000 BRL tokens removidos da carteira do cliente
- Tokens "queimados" (supply diminui)
```

**3. Backend converte e envia XRP**
```
QUEM: Backend
O QUE: Payment de XRP para cliente

1. Calcula XRP a devolver:
   XRP = amountBRL / rate_XRP_BRL
   XRP = 5000 / 2.835 = 1.763,67 XRP

2. Transação XRPL:
{
  TransactionType: "Payment",
  Account: "rIssuerWallet456...",
  Destination: "rCompanyWallet123...",
  Amount: "1763670000",                   // 1.763,67 XRP em drops
  Fee: "12"
}

RESULTADO:
- Cliente recebe XRP de volta
- Status = "completed"
```

**4. Backend notifica via webhook**
```
PAYLOAD:
{
  "event": "burn.completed",
  "operationId": "uuid-burn-456",
  "status": "completed",
  "amountBrlBurned": 5000,
  "amountXrpReturned": 1763.67,
  "txHashClawback": "CLAWBACK_TX...",
  "txHashReturn": "PAYMENT_TX...",
  "timestamp": "2025-01-10T15:00:00Z"
}
```

---

## Comparação: XRP vs RLUSD

| Aspecto | XRP | RLUSD |
|---------|-----|-------|
| **Trustlines Necessárias** | 1 (stablecoin BRL) | 2 (RLUSD + stablecoin BRL) |
| **Tipo de Asset** | Native (XRP) | Issued Currency |
| **Detection Amount** | String (drops) | Object {currency, issuer, value} |
| **Conversão** | XRP/BRL direto | USD/BRL intermediário |
| **Complexidade Cliente** | Baixa | Alta |
| **Taxa de Conversão** | Volátil (Binance) | Estável (RLUSD ≈ 1 USD) |
| **Issuer Extra** | Não | Sim (RLUSD issuer) |

---

## Erros Comuns e Soluções

### Erro 1: "Trust line missing"
```
CAUSA: Cliente não criou trustline antes do mint
SOLUÇÃO: Cliente precisa enviar TrustSet transaction ANTES
```

### Erro 2: "Insufficient trust line limit"
```
CAUSA: LimitAmount no TrustSet < valor a receber
SOLUÇÃO: Aumentar LimitAmount no TrustSet
```

### Erro 3: "Account not found"
```
CAUSA: Tentou enviar para carteira não ativada
SOLUÇÃO: Ativar carteira com pagamento >= 10 XRP
```

### Erro 4: "Insufficient XRP balance"
```
CAUSA: Temp wallet sem XRP suficiente
SOLUÇÃO: Backend ativa com 1.3 XRP automaticamente
```

### Erro 5: "Duplicate deposit detected"
```
CAUSA: Mesmo txHash já processado
SOLUÇÃO: Sistema ignora automático (proteção)
```

---

## Resumo de Responsabilidades

### Backend (Fountain API)
- ✅ Criar temp wallets
- ✅ Ativar temp wallets com XRP
- ✅ Monitorar depósitos via WebSocket
- ✅ Acumular depósitos parciais
- ✅ Validar trustlines
- ✅ Executar mint (Payment issued currency)
- ✅ Limpar temp wallets (AccountDelete)
- ✅ Executar clawback (burn)
- ✅ Enviar webhooks

### Cliente (Tokenizador)
- ✅ Criar trustline para stablecoin ANTES de mint
- ✅ Criar trustline para RLUSD (se usar RLUSD)
- ✅ Depositar XRP ou RLUSD na temp wallet
- ✅ Receber stablecoins na company wallet
- ✅ Transferir stablecoins para end-users
- ✅ Solicitar burn quando quiser resgatar

### End-User (Investidor)
- ✅ Criar trustline para stablecoin ANTES de receber
- ✅ Receber tokens do cliente via Payment
- ✅ Verificar saldo via account_lines
- ✅ Transferir tokens para outros (opcional)
