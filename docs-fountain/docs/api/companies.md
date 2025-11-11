---
title: Empresas
sidebar_position: 5
---

Documenta o módulo `CompaniesModule`, usado pelas tokenizadoras para acessar dashboards agregados e relatórios financeiros. As rotas são protegidas por JWT e exigem que o email no token coincida com o parâmetro requisitado.

## Visão Geral do Módulo

- **Arquivos principais:** `src/companies/companies.controller.ts`, `companies.service.ts`, DTOs em `companies/dto`
- **Rotas base:** `/api/v1/companies`
- **Dependências:** `SupabaseService`
- **Autorização:** JWT obrigatório; validação extra garante que `req.claims.email === :email`.
- **Objetivo:** Fornecer visão consolidada por empresa de todas as stablecoins e operações.

## Endpoints

| Método | Rota                                   | Descrição                                                  |
| ------ | -------------------------------------- | ---------------------------------------------------------- |
| `GET`  | `/api/v1/companies/:email/dashboard`   | KPIs e lista consolidada de operações com filtros          |
| `GET`  | `/api/v1/companies/:email/summary`     | Resumo financeiro (volumes por período, contagens)         |

Os parâmetros `:email` devem estar em minúsculas e corresponder ao email do JWT.

## Validação de Escopo

```typescript
const claimsEmail = req?.claims?.email;
if (!claimsEmail || claimsEmail.toLowerCase() !== String(email).toLowerCase()) {
  throw new UnauthorizedException('Token does not match the requested email');
}
```

- Evita que uma empresa enxergue o dashboard de outra.
- Admin também precisa fornecer o próprio email (admin@fountain.com) – rotas específicas de admin estão em **Administração**.

## `GET /:email/dashboard`

### Query Parameters (DTO `DashboardQueryDto`)

| Chave    | Tipo     | Descrição                                           |
| -------- | -------- | --------------------------------------------------- |
| `status` | string?  | Filtra operações por status (`completed`, etc.)     |
| `from`   | ISO date | Início do intervalo de datas                         |
| `to`     | ISO date | Fim do intervalo                                    |
| `limit`  | number   | Limite de resultados (padrão 10)                    |
| `offset` | number   | Paginação                                           |

### Pipelines Internos

1. Resolve `email` → `companyId` com `SupabaseService.getCompanyByEmail`.
2. Busca stablecoins (`getStablecoinsByCompany`).
3. Extrai `stablecoinIds` e carrega operações com filtros (`getOperationsByStablecoinIdsWithFilters`).
4. Agrega contagens e somatórios conforme filtros.

### Exemplo de Resposta (simplificada)

```json
{
  "company": {
    "email": "admin@sonica.com",
    "companyId": "company-1",
    "name": "Sonica Tokenizadora"
  },
  "stablecoins": [
    {
      "id": "e25d9f4a-7b7f-4f9b-ab06-70d4220eaec1",
      "currency_code": "PABRL",
      "status": "active",
      "created_at": "2024-11-11T12:30:12.123Z"
    }
  ],
  "operations": [
    {
      "id": "8c430b52-5f6f-4ea5-9cd2-6a28adf0b3d5",
      "type": "MINT",
      "status": "completed",
      "amount_rlusd": 2476.19,
      "created_at": "2024-11-11T12:35:00.000Z"
    }
  ],
  "aggregates": {
    "totalOperations": 2,
    "completedOperations": 1,
    "pendingOperations": 1,
    "currentAumBrl": 13000
  }
}
```

> **Nota:** A estrutura exata dos agregados depende da implementação corrente em `companies.service.ts`. Ajuste os exemplos conforme atualizações.

## `GET /:email/summary`

### Query Parameters (DTO `SummaryQueryDto`)

| Chave  | Tipo     | Descrição                                    |
| ------ | -------- | -------------------------------------------- |
| `from` | ISO date | Data inicial para agregações                 |
| `to`   | ISO date | Data final para agregações                   |

### Resposta (exemplo)

```json
{
  "period": {
    "from": "2024-11-01T00:00:00.000Z",
    "to": "2024-11-11T23:59:59.000Z"
  },
  "totals": {
    "mintedBrl": 13000,
    "burnedBrl": 5000,
    "netFlowBrl": 8000,
    "mintCount": 1,
    "burnCount": 1
  },
  "byDay": [
    { "date": "2024-11-05", "mintedBrl": 5000, "burnedBrl": 0 },
    { "date": "2024-11-06", "mintedBrl": 8000, "burnedBrl": 5000 }
  ]
}
```

> Internamente, a função usa `SupabaseService.getOperationsByStablecoinIdsWithFilters` para recuperar operações em lote e agrega em memória.

## Considerações Operacionais

- Emails são case-insensitive. Normalize sempre para minúsculas ao consumir a API.
- Para dashboards externos (cliente final), preferir construir APIs intermediárias que consumam estes endpoints com caching.
- Em ambientes sem Supabase, os retornos podem ser vazios; configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

## Próximos Passos

- Confira **Operações** para obter detalhes de cada `operationId`.
- Utilize **Administração** se precisar de visão cross-company (necessita credenciais admin).

