-- Migration: Add temporary wallet cleanup tracking
-- Description: Adds columns to track temp wallet lifecycle and encrypted seed for deletion
-- Date: 2025-11-10

ALTER TABLE public.operations
ADD COLUMN IF NOT EXISTS temp_wallet_seed_encrypted TEXT,
ADD COLUMN IF NOT EXISTS temp_wallet_activation_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS temp_wallet_activated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS temp_wallet_creation_ledger INTEGER,
ADD COLUMN IF NOT EXISTS temp_wallet_deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS temp_wallet_delete_tx_hash TEXT;

-- Create index for finding pending temp wallet cleanups
CREATE INDEX IF NOT EXISTS idx_operations_pending_cleanup
  ON public.operations(status, temp_wallet_creation_ledger)
  WHERE status = 'deposit_confirmed'
    AND temp_wallet_creation_ledger IS NOT NULL
    AND temp_wallet_deleted_at IS NULL;

-- Add helpful comments
COMMENT ON COLUMN public.operations.temp_wallet_seed_encrypted IS 'AES-256 encrypted seed for temporary wallet. Used to sign AccountDelete transaction.';
COMMENT ON COLUMN public.operations.temp_wallet_activation_tx_hash IS 'Transaction hash from initial funding of temp wallet (1.3 XRP).';
COMMENT ON COLUMN public.operations.temp_wallet_activated_at IS 'Timestamp when temp wallet was funded and activated.';
COMMENT ON COLUMN public.operations.temp_wallet_creation_ledger IS 'Ledger index when temp wallet was created. Used to track 16-ledger minimum age.';
COMMENT ON COLUMN public.operations.temp_wallet_deleted_at IS 'Timestamp when temp wallet was deleted via AccountDelete transaction.';
COMMENT ON COLUMN public.operations.temp_wallet_delete_tx_hash IS 'Transaction hash of AccountDelete operation that deleted and merged temp wallet.';
