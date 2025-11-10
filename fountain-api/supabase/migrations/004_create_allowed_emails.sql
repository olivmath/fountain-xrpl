-- Migration: Create allowed_emails table and seed permitted emails
-- Description: Holds the list of emails allowed to authenticate and receive JWT
-- Date: 2025-11-10

CREATE TABLE IF NOT EXISTS public.allowed_emails (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed initial allowed emails
INSERT INTO public.allowed_emails (email)
VALUES
  ('sonica@tokenizadora.com'),
  ('liqi@tokenizadora.com'),
  ('abcrypto@tokenizadora.com')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

-- Policies for service roles
CREATE POLICY "Service role can read allowed emails"
  ON public.allowed_emails
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon read allowed emails"
  ON public.allowed_emails
  AS PERMISSIVE
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON TABLE public.allowed_emails IS 'Emails allowed to authenticate and receive JWT.';