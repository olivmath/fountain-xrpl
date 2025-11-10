# Diagramas de Sequência - Fountain API

## Diagrama 1: Depósito XRP → Mint Stablecoin

```mermaid
sequenceDiagram
    actor Cliente as Cliente (Tokenizador)
    participant Carteira as Carteira XRPL Cliente
    participant API as Fountain API
    participant DB as Database
    participant Issuer as Issuer Wallet
    participant TempW as Temp Wallet
    participant XRPL as XRPL Blockchain
    participant Binance as Binance API

    Note over Cliente,XRPL: FASE 1: SETUP (Cliente prepara trustline)

    Cliente->>Carteira: 1. Criar TrustSet transaction
    Note right of Carteira: TrustSet para BRL<br/>Issuer: Fountain<br/>Limit: 10.000.000
    Carteira->>XRPL: Submeter TrustSet
    XRPL-->>Carteira: ✅ Trustline criada

    Cliente->>API: 2. POST /api/v1/stablecoin
    Note right of Cliente: depositType: "XRP"<br/>amount: 10.000 BRL<br/>companyWallet: rCompany...

    Note over API,Binance: FASE 2: BACKEND PROCESSA

    API->>API: 3. Gerar temp wallet
    API->>DB: Salvar temp wallet (seed criptografado)

    API->>Binance: 4. GET XRP/USDT price
    Binance-->>API: XRP/USDT = 0.54
    API->>API: Calcular XRP/BRL<br/>0.54 × 5.25 = 2.835 BRL/XRP
    API->>API: XRP necessário<br/>10.000 / 2.835 = 3.527 XRP

    API->>Issuer: 5. Ativar temp wallet
    Issuer->>XRPL: Payment 1.3 XRP → TempW
    XRPL-->>Issuer: ✅ Ativada
    API->>DB: Salvar activation_tx_hash

    API->>XRPL: 6. Subscribe to TempW
    Note right of API: WebSocket listener<br/>Monitora Payment transactions

    API-->>Cliente: Resposta com temp wallet
    Note left of API: wallet: rTempW...<br/>amountXRP: 3.527<br/>status: require_deposit

    Note over Cliente,XRPL: FASE 3: CLIENTE DEPOSITA

    Cliente->>Carteira: 7. Enviar XRP para temp wallet
    Note right of Cliente: Pode fazer depósitos parciais:<br/>1.000 + 1.000 + 1.527 XRP
    Carteira->>XRPL: Payment 3.527 XRP → TempW

    XRPL->>API: 🔔 WebSocket event: transaction
    API->>API: 8. Detectar depósito
    Note right of API: Extrair Amount (drops)<br/>Converter para XRP<br/>Verificar duplicata
    API->>DB: Acumular depósito
    Note right of DB: amount_deposited += 3.527<br/>deposit_count++<br/>deposit_history.push()

    Note over API,XRPL: FASE 4: BACKEND MINTA

    API->>API: 9. Validar total >= required
    Note right of API: 3.527 >= 3.527 ✅

    API->>XRPL: Query account_lines (rCompany...)
    XRPL-->>API: Trustline BRL existe ✅

    API->>Issuer: 10. Executar MINT
    Issuer->>XRPL: Payment Issued Currency
    Note right of Issuer: Amount: {<br/>  currency: "BRL"<br/>  issuer: rIssuer...<br/>  value: "10000"<br/>}<br/>Destination: rCompany...
    XRPL-->>Issuer: ✅ Mint completo
    XRPL->>Carteira: 💰 10.000 BRL tokens recebidos

    API->>DB: Atualizar status = completed

    API->>Cliente: 11. Webhook notification
    Note left of API: POST webhook_url<br/>event: mint.completed<br/>amountBRL: 10.000

    Note over API,XRPL: FASE 5: CLEANUP (após 16 ledgers)

    XRPL->>API: 🔔 Ledger close event
    API->>API: Verificar idade wallet<br/>(current - creation) >= 16
    API->>TempW: 12. AccountDelete
    TempW->>XRPL: AccountDelete → Issuer
    Note right of TempW: Fee: 0.2 XRP<br/>Saldo restante → Issuer
    XRPL-->>API: ✅ Wallet deletada
```

---

## Diagrama 2: Depósito RLUSD → Mint Stablecoin

```mermaid
sequenceDiagram
    actor Cliente as Cliente (Tokenizador)
    participant Carteira as Carteira XRPL Cliente
    participant API as Fountain API
    participant DB as Database
    participant Issuer as Issuer Wallet
    participant TempW as Temp Wallet
    participant XRPL as XRPL Blockchain

    Note over Cliente,XRPL: FASE 1: SETUP (2 Trustlines necessárias!)

    Cliente->>Carteira: 1A. Criar TrustSet para RLUSD
    Note right of Carteira: TrustSet<br/>Currency: RLUSD<br/>Issuer: rRLUSDIssuer...<br/>Limit: 10.000.000
    Carteira->>XRPL: Submeter TrustSet RLUSD
    XRPL-->>Carteira: ✅ Trustline RLUSD criada

    Cliente->>Carteira: 1B. Criar TrustSet para BRL stablecoin
    Note right of Carteira: TrustSet<br/>Currency: BRL<br/>Issuer: Fountain rIssuer...<br/>Limit: 10.000.000
    Carteira->>XRPL: Submeter TrustSet BRL
    XRPL-->>Carteira: ✅ Trustline BRL criada

    Cliente->>API: 2. POST /api/v1/stablecoin
    Note right of Cliente: depositType: "RLUSD"<br/>amount: 10.000 BRL

    Note over API,DB: FASE 2: BACKEND PROCESSA

    API->>API: 3-5. Setup temp wallet
    Note right of API: Igual XRP:<br/>- Gerar wallet<br/>- Calcular (USD/BRL)<br/>- Ativar com 1.3 XRP
    API->>DB: Salvar operação
    Note right of DB: RLUSD_required:<br/>10.000 / 5.25 = 1.904,76

    API->>XRPL: 6. Subscribe to TempW
    API-->>Cliente: wallet: rTempW...<br/>amountRLUSD: 1.904,76

    Note over Cliente,XRPL: FASE 3: CLIENTE DEPOSITA RLUSD

    Cliente->>Carteira: 7. Enviar RLUSD para temp wallet
    Note right of Cliente: ⚠️ Issued Currency Payment!
    Carteira->>XRPL: Payment Issued Currency
    Note right of Carteira: Amount: {<br/>  currency: "RLUSD"<br/>  issuer: rRLUSDIssuer...<br/>  value: "1904.76"<br/>}<br/>Destination: rTempW...

    XRPL->>API: 🔔 WebSocket: transaction
    API->>API: 8. Detectar depósito RLUSD
    Note right of API: Amount é OBJETO<br/>Validar currency === "RLUSD"<br/>Validar issuer correto
    API->>DB: Acumular depósito

    Note over API,XRPL: FASE 4: BACKEND MINTA (igual XRP)

    API->>API: 9-10. Validar e mintar
    API->>Issuer: Executar MINT
    Issuer->>XRPL: Payment BRL stablecoin → Cliente
    XRPL-->>Carteira: 💰 10.000 BRL tokens

    API->>Cliente: 11. Webhook
    API->>TempW: 12. Cleanup após 16 ledgers
```

---

## Diagrama 3: Cliente Transfere para End-Users

```mermaid
sequenceDiagram
    actor Cliente as Cliente (Tokenizador)
    actor EndUser as End-User (Investidor)
    participant CWallet as Carteira Cliente
    participant EWallet as Carteira End-User
    participant XRPL as XRPL Blockchain

    Note over Cliente,XRPL: PREREQUISITO: Cliente já tem tokens BRL

    EndUser->>EWallet: 1. Criar TrustSet
    Note right of EndUser: Investidor precisa confiar<br/>no issuer (Fountain)
    EWallet->>XRPL: TrustSet transaction
    Note right of EWallet: Currency: BRL<br/>Issuer: rIssuer (Fountain)<br/>Limit: 1.000.000
    XRPL-->>EWallet: ✅ Trustline criada

    Cliente->>CWallet: 2. Transferir tokens
    Note right of Cliente: Enviar 1.000 BRL<br/>para investidor

    CWallet->>XRPL: Payment Issued Currency
    Note right of CWallet: Account: rCompany...<br/>Destination: rEndUser...<br/>Amount: {<br/>  currency: "BRL"<br/>  issuer: rIssuer...<br/>  value: "1000"<br/>}

    XRPL->>XRPL: Validar trustline existe
    XRPL->>XRPL: Atualizar balances
    Note right of XRPL: Cliente: -1.000<br/>End-User: +1.000

    XRPL-->>EWallet: 💰 1.000 BRL tokens recebidos

    EndUser->>EWallet: 3. Verificar saldo
    EWallet->>XRPL: Query account_lines
    XRPL-->>EWallet: Balance: 1.000 BRL

    Note over EndUser,XRPL: End-User pode transferir para outros

    EndUser->>EWallet: 4. Transferir para outro investidor
    Note right of EndUser: Outro investidor também<br/>precisa ter trustline!
    EWallet->>XRPL: Payment 500 BRL → OutroInvestidor
    XRPL-->>EWallet: ✅ Transferido
```

---

## Diagrama 4: Burn (Resgate) - Cliente → Backend

```mermaid
sequenceDiagram
    actor Cliente as Cliente (Tokenizador)
    participant Carteira as Carteira XRPL Cliente
    participant API as Fountain API
    participant DB as Database
    participant Issuer as Issuer Wallet
    participant XRPL as XRPL Blockchain
    participant Binance as Binance API

    Note over Cliente,XRPL: Cliente quer resgatar tokens BRL por XRP

    Cliente->>API: 1. POST /api/v1/stablecoin/burn
    Note right of Cliente: amountBrl: 5.000<br/>returnAsset: "XRP"<br/>currencyCode: "BRL"

    API->>DB: Criar operação burn

    Note over API,Binance: FASE 1: CALCULAR RESGATE

    API->>Binance: 2. GET XRP/USDT price
    Binance-->>API: Taxa XRP/BRL = 2.835
    API->>API: Calcular XRP a devolver
    Note right of API: XRP = 5.000 / 2.835<br/>XRP = 1.763,67

    Note over API,XRPL: FASE 2: EXECUTAR CLAWBACK

    API->>Issuer: 3. Executar Clawback
    Issuer->>XRPL: Clawback transaction
    Note right of Issuer: Account: rIssuer...<br/>Amount: {<br/>  currency: "BRL"<br/>  issuer: rCompany... ⬅️<br/>  value: "5000"<br/>}

    XRPL->>XRPL: Remover tokens do cliente
    Note right of XRPL: Cliente: -5.000 BRL<br/>Supply total: -5.000

    XRPL-->>Issuer: ✅ Clawback completo
    XRPL->>Carteira: 💸 5.000 BRL tokens removidos

    API->>DB: Salvar clawback_tx_hash

    Note over API,XRPL: FASE 3: DEVOLVER XRP

    API->>Issuer: 4. Enviar XRP para cliente
    Issuer->>XRPL: Payment XRP
    Note right of Issuer: Account: rIssuer...<br/>Destination: rCompany...<br/>Amount: "1763670000" drops

    XRPL-->>Carteira: 💰 1.763,67 XRP recebidos

    API->>DB: 5. Atualizar status = completed
    API->>Cliente: 6. Webhook notification
    Note left of API: event: burn.completed<br/>amountXrpReturned: 1.763,67
```

---

## Diagrama 5: Fluxo Completo End-to-End (Simplificado)

```mermaid
graph TB
    subgraph "FASE 1: SETUP"
        A[Cliente cria trustline BRL] --> B[Cliente chama API]
    end

    subgraph "FASE 2: BACKEND"
        B --> C[Backend cria temp wallet]
        C --> D[Backend ativa com 1.3 XRP]
        D --> E[Backend monitora depósitos]
    end

    subgraph "FASE 3: DEPÓSITO"
        E --> F[Cliente deposita XRP/RLUSD]
        F --> G{Total >= Required?}
        G -->|Não| H[Aguarda mais depósitos]
        H --> F
        G -->|Sim| I[Backend valida trustline]
    end

    subgraph "FASE 4: MINT"
        I --> J{Trustline existe?}
        J -->|Não| K[ERRO: Criar trustline!]
        J -->|Sim| L[Backend executa MINT]
        L --> M[Cliente recebe tokens BRL]
    end

    subgraph "FASE 5: TRANSFERÊNCIA"
        M --> N[End-User cria trustline]
        N --> O[Cliente transfere tokens]
        O --> P[End-User recebe tokens]
    end

    subgraph "FASE 6: RESGATE"
        P --> Q[Cliente solicita burn]
        Q --> R[Backend executa clawback]
        R --> S[Backend devolve XRP/RLUSD]
    end

    subgraph "CLEANUP"
        L --> T[Backend aguarda 16 ledgers]
        T --> U[Backend deleta temp wallet]
    end

    style A fill:#e1f5fe
    style L fill:#c8e6c9
    style O fill:#fff9c4
    style R fill:#ffccbc
    style K fill:#ffcdd2
```

---

## Legenda dos Diagramas

### Símbolos e Cores

- **🔔** WebSocket event / notificação
- **✅** Sucesso / confirmação
- **💰** Tokens recebidos
- **💸** Tokens removidos (burn)
- **⚠️** Atenção / ponto crítico
- **→** Fluxo de dados
- **⬅️** Nota importante

### Participantes

- **Cliente**: Empresa tokenizadora (Sonica, etc)
- **End-User**: Investidor final que compra tokens
- **API**: Fountain Backend
- **Issuer Wallet**: Carteira do Fountain que emite tokens
- **Temp Wallet**: Carteira temporária para depósitos
- **XRPL**: XRP Ledger blockchain
- **Binance API**: API para cotações

### Tipos de Transação XRPL

1. **TrustSet**: Estabelece confiança em issuer
2. **Payment (XRP)**: Transferência de XRP nativo
3. **Payment (Issued Currency)**: Transferência de token/stablecoin
4. **Clawback**: Recuperação de tokens (burn)
5. **AccountDelete**: Deletar conta e merge saldo

---

## Pontos Críticos de Cada Fluxo

### XRP Deposit
- ✅ Simples: 1 trustline apenas (stablecoin)
- ✅ Amount como string (drops)
- ⚠️ Taxa volátil (XRP/BRL)

### RLUSD Deposit
- ⚠️ Complexo: 2 trustlines (RLUSD + stablecoin)
- ⚠️ Amount como objeto {currency, issuer, value}
- ✅ Taxa estável (RLUSD ≈ 1 USD)

### Cliente → End-User
- ⚠️ End-User PRECISA trustline antes
- ✅ Transferência instantânea
- ✅ Sem custos além da fee XRPL (0.000012 XRP)

### Burn/Resgate
- ✅ Clawback recupera tokens
- ⚠️ Taxa de conversão no momento do burn
- ✅ Webhook notifica conclusão
