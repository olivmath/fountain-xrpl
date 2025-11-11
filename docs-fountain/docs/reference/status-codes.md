---
id: status-codes
title: Códigos de Status
sidebar_position: 2
---

# Códigos de Status

A plataforma Fountain usa um conjunto de status para rastrear o ciclo de vida das operações e stablecoins.

## Status de Operação (`OperationStatus`)

| Status | Descrição |
|---|---|
| `pending` | A operação foi criada, mas ainda não foi processada. |
| `require_deposit` | Uma carteira temporária foi criada e está aguardando o depósito do colateral. |
| `partial_deposit` | Um depósito parcial foi recebido, mas ainda não atingiu o valor total necessário. |
| `deposit_confirmed` | O depósito do colateral foi confirmado. |
| `completed` | A operação (mint ou burn) foi concluída com sucesso. |
| `failed` | A operação falhou. Verifique os logs para mais detalhes. |
| `cancelled` | A operação foi cancelada. |

## Status de Stablecoin (`StablecoinStatus`)

| Status | Descrição |
|---|---|
| `pending_setup` | A stablecoin foi criada, mas a configuração inicial ainda não foi concluída. |
| `require_deposit` | A stablecoin está aguardando o depósito inicial de colateral. |
| `waiting_payment` | Para depósitos via PIX, a stablecoin está aguardando a confirmação do pagamento. |
| `active` | A stablecoin está ativa e pode ser transacionada. |
| `inactive` | A stablecoin foi desativada. |
