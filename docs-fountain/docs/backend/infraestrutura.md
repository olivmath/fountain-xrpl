---
title: Infraestrutura
sidebar_position: 7
---

Explica serviços de suporte responsáveis por integrações externas, persistência e utilitários compartilhados no backend Fountain: XRPL, Supabase, Binance, Config, Logger e Criptografia.

## XRPL Service (`src/xrpl/xrpl.service.ts`)

### Responsabilidades

- Conectar ao node XRPL (Testnet por padrão).
- Gerar carteiras temporárias.
- Financiar carteiras (`activateTempWallet`) e executar `AccountDelete`.
- Emitir (`mint`) e resgatar (`clawback`) stablecoins (Issued Currency).
- Assinar transações usando `XRPL_ISSUER_SEED`.
- Gerenciar subscription WebSocket a carteiras para detectar depósitos.
- Acompanhar `ledgerClosed` para disparar limpeza de carteiras após 16 ledgers.

### Configurações

| Variável                | Descrição                                      |
| ----------------------- | ---------------------------------------------- |
| `XRPL_NETWORK`          | `testnet` (default) ou `mainnet`               |
| `XRPL_ISSUER_ADDRESS`   | Endereço do emissor                            |
| `XRPL_ISSUER_SEED`      | Seed do emissor                                |
| `ENABLE_XRPL_SUBSCRIBER`| `"true"` (default) habilita subscriptions reais |

### Métodos Principais

- `connect()` / `disconnect()`
- `generateWallet()`
- `getIssuerWallet()`, `getIssuerAddress()`
- `mint(issuerWallet, companyWallet, currencyCode, amount)`
- `clawback(issuerWallet, holderAddress, currencyCode, amount)`
- `activateTempWallet(address)`
- `deleteTempWalletAndMerge(tempWalletAddress, tempSeed, destination)`
- `subscribeToWallet(address, callback)` – usa `xrpl.Client` + eventos `transaction`
- `unsubscribeFromWallet(address)`
- `getBalance(address)` (drops → XRP)
- `getAccountLines(address)` – usado para validar trustlines

> **Importante:** `mint` lança erro se não existir trustline (`operation.companyWallet` precisa aceitá-la antes da emissão).

## Supabase Service (`src/supabase/supabase.service.ts`)

### Objetivos

- Persistir e consultar stablecoins, operações, tokens, empresas.
- Encapsular toda interação com Supabase usando `createClient`.
- Disponibilizar helpers específicos para dashboards e admin.

### Tabelas Suportadas

- `allowed_emails` – controle de acesso.
- `companies` – cadastro de tokenizadoras + flag admin.
- `stablecoins` – registro master das emissões.
- `operations` – histórico de mint/burn (inclui `deposit_history`).
- `auth_tokens` – tokens ativos reutilizáveis.

### Destaques

- `createStablecoin(operation)` – converte camelCase → snake_case, injeta metadados (companyId, wallet temporária).
- `createOperation(op)` – armazena status inicial, método de pagamento, wallet temporária.
- `updateOperation()` e `accumulateDeposit()` – fazem merge incremental de depósitos.
- `getPendingTempWalletCleanups()` – identifica operações prontas para limpeza.
- Métodos para dashboards e admin (`getCompanyStablecoins`, `getAllOperations`, etc.).

### Uso Offline

- Se `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` não forem definidos, o serviço loga `Supabase not configured` e algumas rotas retornam `null`/`[]`. Ideal para desenvolvimento local, mas operações core exigem persistência real.

## Binance Service (`src/binance/binance.service.ts`)

- Obtém cotações de `https://api.binance.com/api/v3/ticker/price`.
- Métodos:
  - `getXrpUsdRate()`
  - `getXrpBrlRate()` (usa USD/BRL local)
  - `getUsdBrlRate()` (retorna `USD_BRL_RATE`)
  - `calculateRlusdForBrl(brlAmount)` e conversões auxiliares.
- Em caso de falha (rate limit, offline), retorna valores mock (`0.5`, `28.5`, etc.) e loga warning.

## Config Service (`src/config/config.service.ts`)

Abstrai acesso a variáveis de ambiente usando `@nestjs/config`. Principais getters:

- `nodeEnv`, `port`, `isDevelopment`, `isProduction`
- `usdBrlRate`
- `supabaseUrl`, `supabaseKey`
- `jwtSecret`, `jwtExpiration`
- `xrplNetwork`, `xrplIssuerAddress`, `xrplIssuerSeed`
- `enableXrplSubscriber`

> Campos ausentes lançam erro imediatamente (`getOrThrow`), evitando iniciar servidor mal configurado.

## Encryption Service (`src/common/encryption.service.ts`)

- Fornece `encrypt()` e `decrypt()` usando AES-256-GCM.
- Exige `WALLET_ENCRYPTION_KEY` (base64) com 32 bytes. Se não existir ou tiver tamanho errado, lança erro na inicialização.
- Atualmente usado para armazenar `tempWalletSeedEncrypted` na tabela `operations`.

### Formato

- Armazena como `iv:ciphertext:authTag` (hexadecimal).
- IV de 16 bytes aleatório por operação.

## Logger Service (`src/common/logger.service.ts`)

- Utilizado em todos os módulos para padronizar logs coloridos no terminal (ASCII).
- Principais métodos:
  - `logOperationStart(type, data)` / `logOperationSuccess` / `logOperationError`
  - `logStep(step, description, details?)`
  - `logValidation(name, result, details?)`
  - `logBlockchainTransaction(txHash, data)`
  - `logWebhookDelivery(url, eventType, success, attempt?)`
  - `logWarning`, `logError`, `logInfo`
- Ajuda durante hackathons e demonstrações, exibindo fluxos detalhados (com emojis).

## Scripts Auxiliares

- `scripts/trustline.js` – cria trustline RLUSD para carteiras holder (requer seed).
- `scripts/simulate-deposit.js` – simula depósito RLUSD na carteira temporária associada a uma operação.
- `scripts` diversos suportam MVP. Consulte `SDK_DEPLOYMENT.md`, `SDK_QUICKSTART.md` e `GETTING_STARTED.md`.

## Monitoramento & Limpeza

- O listener de ledger usa `stablecoinService.supabaseService.getPendingTempWalletCleanups()` (acesso direto ao serviço – veja `XrplService.checkAndCleanupPendingWallets`).
- Carteiras com mais de 16 ledgers desde `temp_wallet_creation_ledger` são limpas automaticamente.

## Boas Práticas Operacionais

- Mantenha o nó XRPL responsivo; fallback de polling roda a cada 5s.
- Aumente `USD_BRL_RATE` dinamicamente utilizando uma API real (parâmetro futuro).
- Garanta rotação segura de `WALLET_ENCRYPTION_KEY` (todas seeds precisam ser recriptografadas).
- Logs podem ser integrados a uma ferramenta de observabilidade (Stackdriver, Datadog) substituindo `console.log`.

## Próximos Passos

- Configure as variáveis listadas em **Visão Geral → Configuração Mínima**.
- Leia **Stablecoins** e **Operações** para entender como estes serviços são consumidos.
- Ajuste `ENABLE_XRPL_SUBSCRIBER` conforme infra disponível (WebSocket público vs. simulação).

