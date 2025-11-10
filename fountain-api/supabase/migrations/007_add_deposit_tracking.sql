-- Migration: Add deposit tracking for partial deposits
-- Description: Adds columns to track accumulated deposits and deposit history
-- Date: 2025-11-10

ALTER TABLE public.operations
ADD COLUMN IF NOT EXISTS amount_deposited NUMERIC(20, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_history JSONB DEFAULT '[]'::jsonb;

-- Create index for quick lookup of pending deposits
CREATE INDEX IF NOT EXISTS idx_operations_partial_deposits
  ON public.operations(status, amount_deposited)
  WHERE status IN ('pending', 'partial_deposit_received');

-- Create index on deposit_history for analysis
CREATE INDEX IF NOT EXISTS idx_operations_deposit_history
  ON public.operations USING GIN (deposit_history);

-- Add helpful comments
COMMENT ON COLUMN public.operations.amount_deposited IS 'Total amount accumulated from all deposits (XRP or RLUSD). Used to track partial deposits.';
COMMENT ON COLUMN public.operations.deposit_count IS 'Number of separate deposit transactions received for this operation.';
COMMENT ON COLUMN public.operations.deposit_history IS 'JSON array of deposit objects: [{amount, txHash, timestamp}, ...]. Tracks full history of all deposits.';
