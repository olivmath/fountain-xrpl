# Supabase Database Migrations

This directory contains SQL migration files to set up the Fountain API database schema in Supabase.

## Schema Overview

The schema consists of 3 main tables:

### 1. `auth_tokens`
Stores JWT tokens issued to companies for API authentication.

**Columns:**
- `id` (UUID) - Primary key
- `company_id` (TEXT) - Company identifier
- `token` (TEXT) - JWT token string
- `expires_at` (TIMESTAMP) - Token expiration time
- `created_at` (TIMESTAMP) - Creation timestamp

**Indexes:**
- `idx_auth_tokens_company_expires` - For retrieving active tokens by company
- `idx_auth_tokens_expires_at` - For cleanup queries

### 2. `stablecoins`
Tracks stablecoins created by companies (e.g., APBRL for America Park BRL).

**Columns:**
- `id` (UUID) - Primary key
- `client_id` (TEXT) - Client/company identifier
- `name` (TEXT) - Stablecoin name
- `client_wallet` (TEXT) - Company's wallet address
- `currency_code` (TEXT) - Unique currency code (e.g., APBRL)
- `deposit_mode` (TEXT) - Deposit method: RLUSD, XRP, or PIX
- `webhook_url` (TEXT) - Webhook URL for notifications
- `status` (TEXT) - Status: pending_setup, active, paused, closed
- `metadata` (JSONB) - Flexible data storage (companyId, tempWalletAddress, rlusdRequired)
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_stablecoins_client_id` - By client ID
- `idx_stablecoins_currency_code` - By currency code (UNIQUE)
- `idx_stablecoins_status` - By status
- `idx_stablecoins_metadata_company` - GIN index on metadata JSONB

### 3. `operations`
Tracks MINT and BURN operations on stablecoins.

**Columns:**
- `id` (UUID) - Primary key
- `stablecoin_id` (UUID) - Foreign key to stablecoins table
- `type` (TEXT) - MINT or BURN
- `status` (TEXT) - pending, deposit_confirmed, completed, failed
- `amount_rlusd` (NUMERIC) - Amount in RLUSD
- `amount_brl` (NUMERIC) - Amount in BRL
- `payment_method` (TEXT) - RLUSD, XRP, or PIX
- `blockchain_tx_hash` (TEXT) - XRPL transaction hash
- `deposit_wallet_address` (TEXT) - Temporary wallet address
- `created_at`, `updated_at` (TIMESTAMP)

**Indexes:**
- `idx_operations_stablecoin_id` - By stablecoin
- `idx_operations_type` - By operation type
- `idx_operations_status` - By status
- `idx_operations_blockchain_tx_hash` - By transaction hash
- `idx_operations_stablecoin_status` - For status queries per stablecoin
- `idx_operations_created_at` - For cleanup queries

## How to Apply Migrations

### Option 1: Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `pggwkqshqyxjhjlsdzww`
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the contents of each migration file (001, 002, 003 in order)
6. Paste and execute each query

**Order matters:** Execute in this order:
1. `001_create_auth_tokens.sql`
2. `002_create_stablecoins.sql`
3. `003_create_operations.sql` (this has a foreign key dependency on stablecoins)

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref pggwkqshqyxjhjlsdzww

# Push migrations to remote
supabase db push
```

### Option 3: psql (Direct Database Connection)

If you have `psql` installed and want to connect directly:

```bash
# Using credentials from .env
psql -h db.pggwkqshqyxjhjlsdzww.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f migrations/001_create_auth_tokens.sql

# Repeat for other migration files
```

## Verification

After applying migrations, verify the schema:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query to check tables:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Expected output:
```
auth_tokens
stablecoins
operations
```

3. Verify columns with:
```sql
-- Check auth_tokens
\d auth_tokens

-- Check stablecoins
\d stablecoins

-- Check operations
\d operations
```

### Deposit Tracking (Migration 007)

To enable partial deposit tracking used by the XRP/RLUSD on-chain flow, apply `007_add_deposit_tracking.sql`.

This migration adds the following columns to `operations`:
- `amount_deposited NUMERIC(20,8) DEFAULT 0`
- `deposit_count INTEGER DEFAULT 0`
- `deposit_history JSONB DEFAULT '[]'`

You can apply it via Dashboard → SQL Editor by pasting the file contents, or via CLI using `supabase db push` (recommended, it applies any pending migrations).

Verification query:
```sql
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'operations'
  AND column_name IN ('amount_deposited','deposit_count','deposit_history');
```

If the migration was applied, you should see all three columns listed.

Note: The API has a temporary fallback to proceed without these columns, but deposit history and accumulation will not be persisted. Applying migration 007 is recommended for production.

## Row Level Security (RLS)

All tables have RLS enabled with policies that allow:
- Service role (`authenticated`) - Full access
- Anonymous role (`anon`) - Full access (if using anon key)

For production, you may want to tighten these policies to be more restrictive.

## Next Steps

After migrations are applied:

1. Restart the API server:
```bash
npm start:dev
```

2. Test login endpoint:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"companyId":"company-1"}'
```

The error messages should change from "Could not find column" to successful database operations.

## Troubleshooting

### "Could not find the 'column_name' column" error

This means the migration wasn't applied. Check that:
1. You executed all 3 migrations in the correct order
2. You're using the correct Supabase project (check the URL in `.env`)
3. The API is using the right credentials

### Foreign Key Constraint Error

Make sure you applied migration 002 (stablecoins) before migration 003 (operations).

### RLS Permission Denied

If you get "permission denied" errors, the RLS policies might need adjustment. Check:
1. The role you're using (service role vs anon key)
2. The policy configuration in the migration file

---

**Created:** 2025-11-10
**Status:** Ready for deployment
