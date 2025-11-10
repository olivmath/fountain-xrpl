-- Migration: Add admin role to companies
-- Description: Enables role-based access control for admin features
-- Date: 2025-11-10

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Seed admin company
UPDATE public.companies
SET is_admin = true
WHERE company_id = 'sonica-admin';

-- Add index for quick admin lookup
CREATE INDEX IF NOT EXISTS idx_companies_is_admin
  ON public.companies(is_admin)
  WHERE is_admin = true;

-- Add helpful comment
COMMENT ON COLUMN public.companies.is_admin IS 'If true, this company has access to admin endpoints and can view system-wide statistics.';
