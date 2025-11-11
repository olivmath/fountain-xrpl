---
sidebar_position: 8
---

# Migrações do Banco de Dados

Guia completo sobre as migrações SQL do Supabase para o Fountain API.

## Visão geral do schema

O banco de dados consiste em múltiplas tabelas que evoluíram através de 8 migrações:

### Principais tabelas

#### 1. `companies`
Empresas tokenizadoras que usam a API.

**Colunas principais:**
- `id` (UUID) - Primary key
- `name` (TEXT) - Nome da empresa
- `email` (TEXT UNIQUE) - Email para login
- `is_admin` (BOOLEAN) - Flag de admin
- `xrpl_wallet_address` (TEXT) - Carteira XRPL opcional
- `created_at`, `updated_at` (TIMESTAMP)

#### 2. `allowed_emails`
Lista de emails autorizados para autenticação.

**Colunas:**
- `id` (UUID) - Primary key
- `email` (TEXT UNIQUE) - Email autorizado
- `company_id` (UUID) - FK para companies
- `is_admin` (BOOLEAN) - Flag de admin
- `created_at` (TIMESTAMP)

#### 3. `stablecoins`
Stablecoins criadas pelas empresas.

**Colunas principais:**
- `id` (UUID) - Primary key
- `company_id` (UUID) - FK para companies
- `client_id` (TEXT) - Identificador do cliente
- `client_name` (TEXT) - Nome do cliente
- `company_wallet` (TEXT) - Carteira XRPL da empresa
- `currency_code` (TEXT UNIQUE) - Código da moeda (ex: APBRL)
- `deposit_mode` (TEXT) - RLUSD, XRP, ou PIX
- `webhook_url` (TEXT) - URL para notificações
- `status` (TEXT) - pending_setup, active, paused, closed
- `metadata` (JSONB) - Dados flexíveis
- `created_at`, `updated_at` (TIMESTAMP)

**Índices:**
- `idx_stablecoins_company_id` - Por empresa
- `idx_stablecoins_currency_code` - Por código (UNIQUE)
- `idx_stablecoins_status` - Por status
- `idx_stablecoins_metadata_company` - GIN index no JSONB

#### 4. `operations`
Operações de MINT e BURN.

**Colunas principais:**
- `id` (UUID) - Primary key
- `stablecoin_id` (UUID) - FK para stablecoins
- `company_id` (UUID) - FK para companies
- `type` (TEXT) - MINT ou BURN
- `status` (TEXT) - pending, require_deposit, deposit_confirmed, completed, failed, etc
- `amount_rlusd` (NUMERIC) - Quantidade em RLUSD
- `amount_brl` (NUMERIC) - Quantidade em BRL
- `payment_method` (TEXT) - RLUSD, XRP, ou PIX
- `blockchain_tx_hash` (TEXT) - Hash da transação XRPL
- `temp_wallet_address` (TEXT) - Endereço da carteira temporária
- `temp_wallet_encrypted_seed` (TEXT) - Seed criptografada (AES-256-GCM)
- `amount_deposited` (NUMERIC) - Total depositado
- `deposit_count` (INTEGER) - Número de depósitos
- `deposit_history` (JSONB) - Histórico completo de depósitos
- `created_at`, `updated_at` (TIMESTAMP)

**Índices:**
- `idx_operations_stablecoin_id` - Por stablecoin
- `idx_operations_company_id` - Por empresa
- `idx_operations_type` - Por tipo
- `idx_operations_status` - Por status
- `idx_operations_blockchain_tx_hash` - Por hash
- `idx_operations_temp_wallet` - Por carteira temporária

#### 5. `auth_tokens`
Tokens JWT emitidos.

**Colunas:**
- `id` (UUID) - Primary key
- `company_id` (UUID) - FK para companies
- `token` (TEXT) - Token JWT
- `expires_at` (TIMESTAMP) - Expiração
- `created_at` (TIMESTAMP)

**Índices:**
- `idx_auth_tokens_company_expires` - Por empresa e expiração
- `idx_auth_tokens_expires_at` - Para limpeza

## Como aplicar migrações

### Opção 1: Supabase Dashboard (Mais fácil)

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie e execute cada migração em ordem

:::warning Ordem importante
Execute as migrações na ordem numérica (001, 002, ..., 008). Algumas têm dependências de foreign keys.
:::

### Opção 2: Supabase CLI

```bash
# Link ao projeto
supabase link --project-ref seu-projeto-id

# Push das migrações
supabase db push
```

### Opção 3: psql (Conexão direta)

```bash
# Usando credenciais do .env
psql -h db.seu-projeto.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f supabase/migrations/001_create_auth_tokens.sql

# Repita para cada migração
```

## Histórico de migrações

### 001_create_auth_tokens.sql
Cria tabela de tokens JWT.

### 002_create_stablecoins.sql
Cria tabela de stablecoins.

### 003_create_operations.sql
Cria tabela de operações (MINT/BURN).

### 004_add_company_mapping.sql
Adiciona mapeamento de companies.

### 005_create_companies.sql
Cria sistema completo de companies com allowed_emails.

### 006_add_temp_wallet_cleanup.sql
Adiciona:
- `temp_wallet_encrypted_seed` - Seed criptografada com AES-256-GCM
- `temp_wallet_creation_ledger` - Ledger de criação
- `temp_wallet_activated_at` - Timestamp de ativação
- `temp_wallet_deleted_at` - Timestamp de deleção
- `temp_wallet_deletion_tx_hash` - Hash da transação AccountDelete

### 007_add_deposit_tracking.sql
Adiciona rastreamento completo de depósitos:
- `amount_deposited` - Total acumulado
- `deposit_count` - Número de depósitos
- `deposit_history` - Array JSONB com histórico completo
- Índice GIN para queries no histórico

### 008_add_admin_role.sql
Adiciona flag `is_admin` em:
- Tabela `companies`
- Tabela `allowed_emails`
- Índices para queries de admin

## Verificação

Após aplicar as migrações, verifique:

```sql
-- Listar tabelas
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Ver estrutura de uma tabela
\d operations

-- Verificar índices
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public';

-- Testar query
SELECT COUNT(*) FROM operations;
```

## Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas que permitem:

- **Service role** (`authenticated`) - Acesso completo
- **Anonymous role** (`anon`) - Acesso completo (se usar anon key)

:::tip Produção
Em produção, considere políticas mais restritivas baseadas em company_id e is_admin.
:::

## Seed Data

Após as migrações, você pode adicionar dados iniciais:

```sql
-- Inserir company de teste
INSERT INTO companies (id, name, email, is_admin)
VALUES (
  gen_random_uuid(),
  'Sonica Tokenization',
  'admin@sonica.com',
  true
);

-- Adicionar email autorizado
INSERT INTO allowed_emails (id, email, company_id, is_admin)
SELECT
  gen_random_uuid(),
  'admin@sonica.com',
  c.id,
  true
FROM companies c
WHERE c.email = 'admin@sonica.com';
```

## Backup e Restore

### Backup

```bash
# Backup completo
pg_dump -h db.seu-projeto.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f fountain_backup.dump

# Backup só do schema
pg_dump -h db.seu-projeto.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  -f fountain_schema.sql
```

### Restore

```bash
# Restore completo
pg_restore -h db.seu-projeto.supabase.co \
  -U postgres \
  -d postgres \
  -c \
  fountain_backup.dump
```

## Troubleshooting

### "Could not find column" error

Migração não foi aplicada. Verifique:
1. Todas as 8 migrações executadas?
2. Projeto correto no `.env`?
3. Credenciais corretas?

### Foreign Key Constraint Error

Execute as migrações em ordem. Exemplo:
- `005_create_companies.sql` ANTES de outras que referenciam `companies`

### RLS Permission Denied

Verifique:
1. Role correta (service role vs anon key)
2. Políticas configuradas corretamente
3. Use service role key para operações administrativas

### Duplicate Key Error

Se tentar reexecutar migração que já criou dados:
```sql
-- Limpar dados antes de reexecutar
TRUNCATE TABLE operations CASCADE;
TRUNCATE TABLE stablecoins CASCADE;
TRUNCATE TABLE companies CASCADE;
```

## Próximos passos

1. **Restart API**: `npm run start:dev`
2. **Test login**:
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@sonica.com"}'
   ```
3. **Verificar logs**: Mensagens de erro devem mudar de "Column not found" para operações bem-sucedidas

## Referências

- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)
