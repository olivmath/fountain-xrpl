---
id: fluxos-principais
title: Fluxos Principais
sidebar_position: 3
---

# Fluxos Principais

## Fluxo de Emissão (Mint)

O fluxo de emissão de stablecoins é iniciado por uma tokenizadora e envolve a criação de uma carteira temporária para depósito de colateral.

```mermaid
sequenceDiagram
    actor T as Tokenizadora
    participant API as Fountain API
    participant XR as XRPL Blockchain

    T->>API: 1. POST /stablecoin (BRL 10.000)
    API->>T: Wallet temporária + valores necessários
    T->>XR: 2. Deposita XRP/RLUSD
    XR->>API: 🔔 Notificação de depósito
    API->>XR: 3. Mint stablecoin BRL
    XR->>T: 💰 10.000 tokens BRL
    API->>T: 🔔 Webhook: mint.completed
```

1.  **Requisição:** A tokenizadora envia uma requisição para a Fountain API para emitir um valor em BRL.
2.  **Depósito:** A API retorna uma carteira temporária para a tokenizadora depositar o colateral (XRP ou RLUSD).
3.  **Confirmação:** A API monitora a carteira e, ao confirmar o depósito, emite os tokens na XRPL.
4.  **Notificação:** A tokenizadora recebe os tokens e uma notificação via webhook.

## Fluxo de Resgate (Burn)

O fluxo de resgate permite que a tokenizadora queime stablecoins e receba o colateral de volta.

```mermaid
sequenceDiagram
    actor T as Tokenizadora
    participant API as Fountain API
    participant XR as XRPL Blockchain

    T->>API: 1. POST /stablecoin/burn (5.000 BRL → XRP)
    API->>XR: Executa clawback
    XR->>T: 💸 5.000 tokens removidos
    API->>T: XRP equivalente devolvido
    API->>T: 🔔 Webhook: burn.completed
```

1.  **Requisição:** A tokenizadora solicita o resgate de uma quantidade de stablecoins.
2.  **Clawback:** A API executa um `clawback` na XRPL para remover os tokens da carteira da tokenizadora.
3.  **Devolução:** O colateral equivalente é devolvido para a tokenizadora.
4.  **Notificação:** A tokenizadora recebe uma notificação de conclusão via webhook.
