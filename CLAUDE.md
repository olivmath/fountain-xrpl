# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fountain Backend** - A B2B stablecoin issuance and management service for real asset tokenizers on the XRP Ledger (XRPL).

The service enables tokenization companies to create and manage custom stablecoins (e.g., APBRL for "America Park BRL") backed 1:1 by collateral. It abstracts regulatory complexity (KYC/AML), operates exclusively B2B (no direct end-user interaction), and supports two deposit modes:
- **On-Chain**: Direct XRP/RLUSD deposits with instant blockchain confirmation
- **Off-Chain (Pix)**: Brazilian real deposits via Pix/Asas integration with XRP conversion

The system uses XRPL Issued Currencies with clawback enabled for flexible token management and audit trails.

## Core Architecture

### High-Level Flow

1. **Authentication**: Tokenizers authenticate via JWT (issued manually post-contract)
2. **Stablecoin Creation (Mint)**:
   - Tokenizer submits mint request via `/api/v1/stablecoin` with deposit mode, amount, webhook URL, and company wallet
   - Backend creates temporary wallet or Pix QR code depending on mode
   - Customer deposits via blockchain or Pix
   - Backend triggers mint on XRPL (Issued Currency with clawback)
   - Token transferred to tokenizer's wallet, webhook notification sent
3. **Stablecoin Redemption (Burn)**:
   - Tokenizer submits burn request via `/api/v1/stablecoin/burn` with currency code, amount, and return asset type
   - Backend executes clawback on XRPL to recover tokens
   - Converts collateral back to requested asset (Pix or on-chain XRP/RLUSD)
   - Webhook notifies completion

### Key Components

- **XRPL Integration**: Uses xrpl.js for wallet management, Issued Currency minting, clawback execution, and WebSocket subscribers for deposit monitoring
- **Deposit Methods**:
  - **On-Chain**: Real-time XRPL WebSocket monitoring with fallback to polling
  - **Pix**: Asas API integration for payment generation, webhook listeners for confirmation
- **Currency Conversion**: Binance API for XRP/BRL conversions and rates
- **Exchange Rates**: BACEN (Brazilian Central Bank) for USD/BRL rates
- **Logging**: Custom logger with operation tracking, step-by-step output, validation logging, and webhook monitoring (see LOGGING_EXAMPLE.md for format examples)

### Data Model Considerations

- **Stablecoins**: Identified by unique `currency code` (e.g., APBRL); each backed by colateral in issuer wallet
- **Operations**: Track mint/burn sequences with status (REQUIRE_DEPOSIT, DEPOSIT_CONFIRMED, COMPLETED)
- **Trust Lines**: XRPL native; establish holder-issuer relationships and track balances per currency code
- **Wallet Management**: Issuer wallet holds collateral; temporary wallets created per on-chain deposit; company wallets specified by tokenizer
- **Collateral**: 1:1 reserve maintained off-chain (Binance/Asas); on-chain supply auditable via XRPL queries

## Important Technical Patterns

### Webhook & Event Management

- All operations (mint, burn) trigger async webhooks to tokenizer-provided URLs
- Implement HMAC authentication and idempotency keys for webhook security
- Retry logic with exponential backoff for failed deliveries
- Timeout handling: 10-minute windows for deposits; pending operations cleaned via cron jobs

### XRPL Specifics

- **Issued Currencies**: No smart contracts; native ledger objects handle trust lines and supplies
- **Clawback Feature**: Enabled for partial token recovery without reissuance; critical for redemption flows
- **Authorized Trust Lines**: Can restrict holders to KYC-approved accounts (for compliance)
- **Polling Fallback**: WebSocket subscribers may timeout; implement polling for missed events

### Operational Patterns

- **KYC/AML Abstraction**: Backend handles compliance; tokenizers pass data at creation time
- **Operation Idempotency**: Use operation IDs to prevent duplicate mints/burns
- **Currency Code Isolation**: Each tokenizer gets unique currency codes; no cross-contamination
- **Real-time Logging**: Structured logs with emojis (see LOGGING_EXAMPLE.md) for operation visibility

## Common Development Tasks

### Running the Service

```bash
npm start:dev      # Development with verbose logging (DEBUG level)
npm start:prod     # Production with summary-only logging (INFO+ levels)
npm test           # Run test suite
npm run lint       # Lint code
npm run build      # Build/compile
```

### Debugging Operations

The `LOGGING_EXAMPLE.md` file contains detailed output examples for all flows (mint via Pix, mint via on-chain, burn to Pix, burn to on-chain). Trace logs match operation steps (e.g., [1] Generating wallet, [2] Fetching rates, etc.).

Key log methods:
- `logger.logOperationStart(type, data)` / `logOperationSuccess(type, result)` / `logOperationError(type, error)`
- `logger.logStep(stepNum, stepName, details?)`
- `logger.logValidation(validationName, result, details?)`
- `logger.logBlockchainTransaction(txHash, data)`
- `logger.logWebhookDelivery(url, eventType, success, attempt)`

Filter logs:
```bash
npm start:dev | grep "MINT\|BURN"     # Operation type
npm start:dev | grep "✅\|SUCCESS"    # Successes only
npm start:dev | grep "❌\|ERROR"      # Errors only
```

### Testing Flows

Use the LOGGING_EXAMPLE.md requests to test locally:
- **Pix Mint**: Create stablecoin with `depositType: "PIX"`, retrieve QR code, simulate payment via Asas webhook
- **On-Chain Mint**: Create stablecoin with `depositType: "RLUSD"` or `"XRP"`, send deposit to temp wallet, listen for confirmation
- **Burn Operations**: Burn with `returnAsset: "RLUSD"` (on-chain) or `"PIX"` (off-chain)

## Key Files & Patterns

- **LOGGING_EXAMPLE.md**: Output examples for all flows; use as reference for debugging
- **NEW_VERSION.md**: Technical specification and monetization strategies
- **.claude/settings.local.json**: Claude Code local permissions (allows find:*)

## Security & Operational Concerns

### High Priority

1. **Private Key Management**: XRPL wallet seeds must use HSM or secure vaults; never log or expose
2. **Webhook Security**: Use HMAC signatures and validate Origin headers; implement rate limiting
3. **Idempotency**: Maintain operation deduplication to prevent double-minting or double-burns
4. **Timeout Handling**: Pending operations must auto-cancel after deadlines; cron jobs for cleanup

### Medium Priority

1. **Third-Party Failures**: Asas/Binance downtime can block flows; implement fallbacks and retries
2. **Rate Volatility**: XRP price fluctuations during Pix conversions; use oracles or buffer taxes
3. **Network Validation**: XRPL WebSocket subscriber failures; fallback to polling
4. **Manual Intervention**: User deposit errors (wrong amount) require manual reimbursement tracking

### Compliance

- KYC/AML data must be encrypted and compliant with Brazilian regulations
- Clawback should never be used arbitrarily; document for audit trails
- All operations must generate immutable audit logs (especially blockchain transactions)

## External Integrations

- **Asas API**: Pix payment generation and webhook listeners for confirmation
- **Binance API**: Real-time XRP/BRL rates and actual currency conversion
- **BACEN**: Exchange rate feeds for USD/BRL and rate calculations
- **XRPL**: WebSocket (xrpl.js) for subscribers and REST API for queries
