-- Migration: Create companies table
-- Description: Maps companies to their contact emails for JWT authentication
-- Date: 2025-11-10

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Ensure email is valid
  CONSTRAINT valid_email CHECK (contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_company_id
  ON public.companies(company_id);

CREATE INDEX IF NOT EXISTS idx_companies_contact_email
  ON public.companies(contact_email);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage companies"
  ON public.companies
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role for companies"
  ON public.companies
  AS PERMISSIVE
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Seed initial companies (based on allowed_emails)
INSERT INTO public.companies (company_id, company_name, contact_email)
VALUES
  (gen_random_uuid()::text, 'Tokenizadora Sonica', 'admin@sonica.com'),
  (gen_random_uuid()::text, 'Tokenizadora Liqi', 'admin@liqi.com'),
  (gen_random_uuid()::text, 'AB Crypto', 'admin@abcrypto.com')
ON CONFLICT (contact_email) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE public.companies IS 'Maps companies to their contact emails for JWT authentication and stablecoin operations.';
COMMENT ON COLUMN public.companies.company_id IS 'Unique identifier for the company, included in JWT payload.';
COMMENT ON COLUMN public.companies.company_name IS 'Human-readable company name.';
COMMENT ON COLUMN public.companies.contact_email IS 'Email used for authentication. Must match allowed_emails.';
