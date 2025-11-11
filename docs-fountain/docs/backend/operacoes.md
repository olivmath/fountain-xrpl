---
title: Operações
sidebar_position: 4
---

Detalha o módulo `OperationsModule`, responsável por expor histórico das emissões/queimas e acompanhar carteiras temporárias que aguardam depósitos RLUSD. As informações são consolidadas a partir das tabelas `operations` e `stablecoins` do Supabase e enriquecidas com dados on-chain via `XrplService`.

## Visão Geral do Módulo

- **Arquivos principais:** `src/operations/operations.controller.ts`, `operations.service.ts`
- **Rotas base:** `/api/v1/operations`
- **Dependências:** `SupabaseService`, `XrplService`, `CustomLogger`
- **Autorização:** JWT obrigatório; empresas acessam apenas seus registros. Admin visualiza tudo.

## Endpoints

| Método | Rota                                   | Descrição                                                            |
| ------ | -------------------------------------- | -------------------------------------------------------------------- |
| `GET`  | `/api/v1/operations`                   | Lista operações da empresa autenticada                               |
| `GET`  | `/api/v1/operations/:operationId`      | Detalhes completos de uma operação                                   |
| `GET`  | `/api/v1/operations/:operationId/temp-wallet` | Status ao vivo de carteira temporária, incluindo saldo e progresso |

## Modelo de Dados (Supabase)

- `operations`
  - `id` – UUID (operationId)
  - `stablecoin_id` – FK para `stablecoins`
  - `type` – `'MINT'` ou `'BURN'`
  - `status` – conforme `OperationStatus`
  - `amount_rlusd`, `amount_brl`, `amount_deposited`, `deposit_history`
  - `deposit_wallet_address`, `temp_wallet_activation_tx_hash`, etc.
- `stablecoins`
  - mantém metadados (`metadata.companyId`) usados para checagem de escopo.

## `GET /api/v1/operations`

Retorna lista paginada (sem filtros no MVP) das operações da empresa do token. Exemplo:

```json
[
  {
    "id": "8c430b52-5f6f-4ea5-9cd2-6a28adf0b3d5",
    "stablecoin_id": "e25d9f4a-7b7f-4f9b-ab06-70d4220eaec1",
    "type": "MINT",
    "status": "completed",
    "amount_rlusd": 2476.19,
    "deposit_wallet_address": "rfN9Lus1QxGgJBTQNzxLh4nPfmi5Jj7s6c",
    "amount_deposited": 2476.19,
    "created_at": "2024-11-11T12:30:12.123Z"
  }
]
```

## `GET /api/v1/operations/:operationId`

Retorna a linha completa da operação. O serviço executa:

1. `SupabaseService.getOperation(operationId)`
2. Se não for admin, verifica se `stablecoin.metadata.companyId === req.user.companyId`
3. Caso contrário, lança `ForbiddenException`

## `GET /api/v1/operations/:operationId/temp-wallet`

Fornece visão detalhada da carteira temporária e progresso do depósito. Fluxo interno:

1. `SupabaseService.getOperation(operationId)`
2. Verifica autorização (mesma regra anterior)
3. Se `deposit_wallet_address` inexistente → responde com mensagem informativa
4. `XrplService.getBalance(address)` retorna saldo em XRP (drops convertidos para XRP)
5. Calcula progresso: `(amount_deposited / rlusd_required) * 100`
6. Retorna histórico e metadados

### Resposta (exemplo)

```json
{
  "operationId": "8c430b52-5f6f-4ea5-9cd2-6a28adf0b3d5",
  "temp_wallet_address": "rfN9Lus1QxGgJBTQNzxLh4nPfmi5Jj7s6c",
  "current_balance_xrp": "1.500000",
  "deposit_progress_percent": "100.00",
  "amount_required_rlusd": 2476.19,
  "amount_deposited_rlusd": 2476.19,
  "deposit_count": 2,
  "deposit_history": [
    { "amount": 1238.095238, "txHash": "C16F2C1A...", "timestamp": "..." },
    { "amount": 1238.095238, "txHash": "F342A9EE...", "timestamp": "..." }
  ],
  "status": "deposit_confirmed",
  "temp_wallet_activated_at": "2024-11-11T12:32:00.000Z",
  "temp_wallet_creation_ledger": 10897642,
  "temp_wallet_deleted_at": null
}
```

### Tratamento de Erros

- `404 Not Found` – operação inexistente.
- `403 Forbidden` – token sem permissão para a operação solicitada.
- `current_balance_xrp: "N/A (fetch failed)"` – fallback se o node XRPL retorna erro.

## Logs Emitidos (`CustomLogger`)

- `logStep(1, 'Fetching operation: ...')`
- `logValidation('temp_wallet_status', false, ...)` em caso de falha ao calcular saldo.

## Dicas de Uso

- Utilize este endpoint em dashboards internos da tokenizadora para mostrar progresso em tempo real.
- Combine com webhooks para mover status no front-end (ex.: `mint.stablecoin.completed`).
- Para auditoria (admin), preferir os endpoints de **Administração** que já agregam múltiplas operações.

## Próximos Passos

- Leia **Stablecoins** para entender como cada estado é gerado.
- Em ambientes multi-tenant, agregue `operationId` ao fluxo de suporte para facilitar rastreio.

