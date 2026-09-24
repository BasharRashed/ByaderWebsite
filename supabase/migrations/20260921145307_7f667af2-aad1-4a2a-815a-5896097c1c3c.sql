DROP FUNCTION IF EXISTS public.get_workshop_availability(text);
REVOKE ALL ON FUNCTION public.enforce_workshop_capacity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_workshop_capacity() TO service_role;