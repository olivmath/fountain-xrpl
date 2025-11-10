-- Migration: Create stablecoins table
-- Description: Tracks stablecoins created by companies (e.g., APBRL for America Park)
-- Date: 2025-11-10

CREATE TABLE IF NOT EXISTS public.stablecoins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  client_wallet TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  deposit_mode TEXT NOT NULL,
  webhook_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending_setup',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Constraints
  CONSTRAINT stablecoins_unique_currency_code UNIQUE (currency_code)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_stablecoins_client_id
  ON public.stablecoins(client_id);

CREATE INDEX IF NOT EXISTS idx_stablecoins_currency_code
  ON public.stablecoins(currency_code);

CREATE INDEX IF NOT EXISTS idx_stablecoins_status
  ON public.stablecoins(status);

-- Create index on metadata for filtering by company_id
CREATE INDEX IF NOT EXISTS idx_stablecoins_metadata_company
  ON public.stablecoins USING GIN (metadata);

-- Enable Row Level Security
ALTER TABLE public.stablecoins ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage stablecoins"
  ON public.stablecoins
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role for stablecoins"
  ON public.stablecoins
  AS PERMISSIVE
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE public.stablecoins IS 'Stablecoins issued by companies. Each stablecoin is backed 1:1 by collateral (XRP/RLUSD/BRL).';
COMMENT ON COLUMN public.stablecoins.client_id IS 'Identifier for the client/company that requested this stablecoin.';
COMMENT ON COLUMN public.stablecoins.currency_code IS 'Unique currency code for the stablecoin (e.g., APBRL for America Park BRL).';
COMMENT ON COLUMN public.stablecoins.deposit_mode IS 'Deposit method: RLUSD, XRP, or PIX.';
COMMENT ON COLUMN public.stablecoins.metadata IS 'JSONB field for flexible data storage: {companyId, tempWalletAddress, rlusdRequired}.';
COMMENT ON COLUMN public.stablecoins.status IS 'Current status: pending_setup, active, paused, or closed.';
