-- Migration: Create auth_tokens table
-- Description: Stores JWT tokens issued to companies for API authentication
-- Date: 2025-11-10

CREATE TABLE IF NOT EXISTS public.auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- Indexes for common queries
  CONSTRAINT auth_tokens_unique_company_token UNIQUE (company_id, token)
);

-- Create index for retrieving active tokens by company
CREATE INDEX IF NOT EXISTS idx_auth_tokens_company_expires
  ON public.auth_tokens(company_id, expires_at DESC);

-- Create index for cleanup queries (finding expired tokens)
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at
  ON public.auth_tokens(expires_at);

-- Enable Row Level Security
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Allow service role to manage tokens
CREATE POLICY "Service role can manage auth tokens"
  ON public.auth_tokens
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create RLS policy for anonymous role (if using anon key)
CREATE POLICY "Allow service role for auth tokens"
  ON public.auth_tokens
  AS PERMISSIVE
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE public.auth_tokens IS 'JWT tokens issued to companies for API authentication. Expires after JWT_EXPIRATION period (default 7 days).';
COMMENT ON COLUMN public.auth_tokens.company_id IS 'Unique identifier for the company. Used to retrieve active tokens.';
COMMENT ON COLUMN public.auth_tokens.token IS 'The JWT token string issued to the company.';
COMMENT ON COLUMN public.auth_tokens.expires_at IS 'Timestamp when the token expires. Used for query filtering.';
