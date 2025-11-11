---
title: Administração
sidebar_position: 6
---

A seção de administração oferece visão global de todas as empresas, stablecoins e operações. Apenas usuários com `isAdmin=true` (por padrão `admin@fountain.com`) podem acessar essas rotas.

## Visão Geral do Módulo

- **Arquivos principais:** `src/admin/admin.controller.ts`, `admin.service.ts`
- **Rotas base:** `/api/v1/admin`
- **Autorização:** `Authorization: Bearer <JWT>` + `AdminMiddleware`
- **Dados:** Lê agregados nas tabelas `companies`, `stablecoins`, `operations`
- **Features:** Estatísticas globais, listagem por empresa, monitoramento de carteiras temporárias

## Endpoints

| Método | Rota                                   | Descrição                                                             |
| ------ | -------------------------------------- | --------------------------------------------------------------------- |
| `GET`  | `/api/v1/admin/statistics`             | Contadores globais (empresas, operações, concluídas, etc.)            |
| `GET`  | `/api/v1/admin/companies`              | Lista todas as empresas cadastradas                                   |
| `GET`  | `/api/v1/admin/stablecoins`            | Lista todas as stablecoins                                            |
| `GET`  | `/api/v1/admin/stablecoins/:code`      | Detalhes de uma stablecoin via `currency_code`                        |
| `GET`  | `/api/v1/admin/temp-wallets`           | Carteiras temporárias ativas (+ filtro por status)                    |
| `GET`  | `/api/v1/admin/operations`             | Todas as operações com filtros (status, type, paginação)              |
| `GET`  | `/api/v1/admin/companies/:id/stablecoins` | Stablecoins de uma empresa específica                             |
| `GET`  | `/api/v1/admin/companies/:id/operations` | Operações de uma empresa específica                                |

## Middleware de Proteção

- `AdminMiddleware` exige header `Authorization` com JWT válido.
- Verifica `claims.isAdmin`. Se `false`, lança `ForbiddenException('Admin access required')`.
- Injeta `req.user` com os claims.

## `GET /statistics`

Retorna contadores agregados:

```json
{
  "totalCompanies": 4,
  "totalStablecoins": 6,
  "totalOperations": 18,
  "completedOperations": 12,
  "pendingOperations": 6
}
```

Obtido a partir de `SupabaseService.getGlobalStatistics()`, que executa queries `count` (`head: true`) nas tabelas.

## `GET /temp-wallets`

- Sem filtros retorna todas as operações com `temp_wallet_address` preenchido.
- Query `status` opcional (ex.: `?status=require_deposit`).
- Para cada carteira:
  - Chama `XrplService.getBalance()` para obter saldo atual.
  - Calcula progresso: `(amount_deposited / rlusd_required) * 100`.
  - Em caso de erro de saldo, preenche `current_balance_xrp: "N/A"` e loga via `CustomLogger.logValidation`.

### Exemplo

```json
[
  {
    "id": "8c430b52-5f6f-4ea5-9cd2-6a28adf0b3d5",
    "stablecoin_id": "e25d9f4a-7b7f-4f9b-ab06-70d4220eaec1",
    "status": "require_deposit",
    "deposit_wallet_address": "rfN9Lus1QxGgJBTQNzxLh4nPfmi5Jj7s6c",
    "amount_rlusd": 2476.19,
    "current_balance_xrp": "1.300000",
    "deposit_progress_percent": "52.00"
  }
]
```

## `GET /operations`

### Query Parameters

| Chave    | Tipo    | Descrição                                      |
| -------- | ------- | ---------------------------------------------- |
| `status` | string  | Filtra por status (`pending`, `completed`, etc.) |
| `type`   | string  | `MINT` ou `BURN` (case insensitive)             |
| `limit`  | number  | Limite de registros (default 10)                |
| `offset` | number  | Offset para paginação                           |

### Pipeline

1. `SupabaseService.getAllOperations(filters)`
2. Ordena por `created_at DESC`
3. Retorna array com todos os campos da tabela

## `GET /stablecoins/:code`

- Busca por `currency_code`.
- Enriquecido com estatísticas de operações (`completed`, `total_minted_rlusd`).

```json
{
  "id": "e25d9f4a-7b7f-4f9b-ab06-70d4220eaec1",
  "currency_code": "PABRL",
  "status": "active",
  "operation_count": 3,
  "completed_operations": 2,
  "total_minted_rlusd": 4952.38
}
```

## Logs e Observabilidade

- Cada rota inicia com `logStep(1, ...)`.
- Falhas em consultas Supabase geram warnings com contexto.
- Carteiras com erro de saldo registram `logValidation('temp_wallet_balance', false, {...})`.

## Casos de Uso

- **Auditoria:** Exportar lista de operações concluídas para reconciliação financeira.
- **Suporte:** Localizar rapidamente stablecoin ou operação de uma empresa específica.
- **Monitoramento:** Verificar carteiras temporárias presas (ex.: depósitos parciais).

## Boas Práticas

- Limite o uso dessas rotas a ambientes internos e seguros.
- Combine com alertas (ex.: `pendingOperations` elevado) para acionar times de operação.
- Ao integrar com BI, implemente caching para evitar sobrecarga no Supabase.

## Próximos Passos

- Consulte **Infraestrutura** para entender como XRPL, Supabase e Binance alimentam estes dados.
- Utilize **Stablecoins** e **Operações** para obter detalhes específicos das entidades listadas aqui.

