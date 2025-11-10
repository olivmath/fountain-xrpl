-- Migration: Create operations table
-- Description: Tracks mint and burn operations on stablecoins
-- Date: 2025-11-10

CREATE TABLE IF NOT EXISTS public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stablecoin_id UUID NOT NULL REFERENCES public.stablecoins(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('MINT', 'BURN')),
  status TEXT NOT NULL DEFAULT 'pending',
  amount_rlusd NUMERIC(20, 8),
  amount_brl NUMERIC(20, 8),
  payment_method TEXT,
  blockchain_tx_hash TEXT UNIQUE,
  deposit_wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_operations_stablecoin_id
  ON public.operations(stablecoin_id);

CREATE INDEX IF NOT EXISTS idx_operations_type
  ON public.operations(type);

CREATE INDEX IF NOT EXISTS idx_operations_status
  ON public.operations(status);

-- Index for finding operations by blockchain transaction
CREATE INDEX IF NOT EXISTS idx_operations_blockchain_tx_hash
  ON public.operations(blockchain_tx_hash);

-- Index for finding pending operations
CREATE INDEX IF NOT EXISTS idx_operations_stablecoin_status
  ON public.operations(stablecoin_id, status);

-- Index for time-based queries (cleanup pending operations)
CREATE INDEX IF NOT EXISTS idx_operations_created_at
  ON public.operations(created_at);

-- Enable Row Level Security
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage operations"
  ON public.operations
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role for operations"
  ON public.operations
  AS PERMISSIVE
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON TABLE public.operations IS 'Tracks all MINT and BURN operations on stablecoins. Links to stablecoins table via stablecoin_id.';
COMMENT ON COLUMN public.operations.type IS 'Operation type: MINT (issuance) or BURN (redemption).';
COMMENT ON COLUMN public.operations.status IS 'Current status: pending, deposit_confirmed, completed, or failed.';
COMMENT ON COLUMN public.operations.amount_rlusd IS 'Amount in RLUSD for XRPL operations.';
COMMENT ON COLUMN public.operations.amount_brl IS 'Amount in BRL for PIX operations.';
COMMENT ON COLUMN public.operations.payment_method IS 'Payment method used: RLUSD, XRP, or PIX.';
COMMENT ON COLUMN public.operations.blockchain_tx_hash IS 'XRPL transaction hash for blockchain confirmation.';
COMMENT ON COLUMN public.operations.deposit_wallet_address IS 'Temporary wallet address for on-chain deposits.';
