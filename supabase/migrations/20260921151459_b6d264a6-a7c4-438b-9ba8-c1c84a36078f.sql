CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_users TO service_role;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_users (username, password_hash)
VALUES ('admin', extensions.crypt('community2026', extensions.gen_salt('bf', 10)))
ON CONFLICT (username) DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_admin_credentials(_username text, _password text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE username = _username
      AND password_hash = extensions.crypt(_password, password_hash)
  );
$$;

REVOKE ALL ON FUNCTION public.verify_admin_credentials(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_credentials(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.set_admin_password(_username text, _password text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  INSERT INTO public.admin_users (username, password_hash)
  VALUES (_username, extensions.crypt(_password, extensions.gen_salt('bf', 10)))
  ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
$$;

REVOKE ALL ON FUNCTION public.set_admin_password(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_admin_password(text, text) TO service_role;