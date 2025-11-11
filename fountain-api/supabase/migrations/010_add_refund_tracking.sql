-- Migration 010: Add refund tracking for excess deposits
-- This migration adds fields to track excess refunds when deposits exceed required amount

-- Add refund tracking columns to operations table
ALTER TABLE operations
ADD COLUMN IF NOT EXISTS excess_refunded DECIMAL(20, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_history JSONB DEFAULT '[]'::jsonb;

-- Add index for refund queries
CREATE INDEX IF NOT EXISTS idx_operations_excess_refunded ON operations(excess_refunded) WHERE excess_refunded > 0;

-- Add comment explaining the refund_history structure
COMMENT ON COLUMN operations.refund_history IS 'Array of refund objects: [{address: string, amount: number, txHash: string}]';
COMMENT ON COLUMN operations.excess_refunded IS 'Total amount refunded to depositors when deposits exceeded required amount';
