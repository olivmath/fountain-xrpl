-- Migration: Fix admin user and ensure correct company setup
-- Description: Add admin@fountain.com as proper admin user with correct is_admin flags
-- Date: 2025-11-10

-- First, ensure admin@fountain.com is in allowed_emails
INSERT INTO public.allowed_emails (email)
VALUES ('admin@fountain.com')
ON CONFLICT DO NOTHING;

-- Add Fountain Admin company for admin@fountain.com
INSERT INTO public.companies (company_id, company_name, contact_email, is_admin)
VALUES (
  'fountain-admin',
  'Fountain Admin',
  'admin@fountain.com',
  true
)
ON CONFLICT (contact_email) DO NOTHING;

-- Ensure all other companies have is_admin = false
UPDATE public.companies
SET is_admin = false
WHERE contact_email IN ('admin@sonica.com', 'admin@liqi.com', 'admin@abcrypto.com');

-- Remove any invalid admin flag from migration 008 (where company_id = 'sonica-admin')
UPDATE public.companies
SET is_admin = false
WHERE company_id = 'sonica-admin' OR (is_admin = true AND contact_email NOT IN ('admin@fountain.com'));
