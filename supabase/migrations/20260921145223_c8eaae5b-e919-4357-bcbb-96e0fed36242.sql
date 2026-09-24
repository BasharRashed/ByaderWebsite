CREATE OR REPLACE FUNCTION public.get_workshop_availability(_slug text DEFAULT NULL)
RETURNS TABLE (
  workshop_id uuid,
  slug text,
  capacity integer,
  reserved integer,
  remaining integer,
  is_full boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.id AS workshop_id,
    w.slug,
    w.capacity,
    count(b.id) FILTER (WHERE b.status <> 'cancelled')::integer AS reserved,
    greatest(w.capacity - count(b.id) FILTER (WHERE b.status <> 'cancelled')::integer, 0) AS remaining,
    count(b.id) FILTER (WHERE b.status <> 'cancelled') >= w.capacity AS is_full
  FROM public.workshops w
  LEFT JOIN public.workshop_bookings b ON b.workshop_id = w.id
  WHERE _slug IS NULL OR w.slug = _slug
  GROUP BY w.id, w.slug, w.capacity;
$$;

REVOKE ALL ON FUNCTION public.get_workshop_availability(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_workshop_availability(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_workshop_capacity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  workshop_capacity integer;
  active_reservations integer;
BEGIN
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  SELECT capacity INTO workshop_capacity
  FROM public.workshops
  WHERE id = NEW.workshop_id
  FOR UPDATE;

  IF workshop_capacity IS NULL THEN
    RAISE EXCEPTION 'Workshop not found';
  END IF;

  SELECT count(*)::integer INTO active_reservations
  FROM public.workshop_bookings
  WHERE workshop_id = NEW.workshop_id
    AND status <> 'cancelled'
    AND (TG_OP = 'INSERT' OR id <> NEW.id);

  IF active_reservations >= workshop_capacity THEN
    RAISE EXCEPTION 'Workshop is fully booked';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_workshop_capacity_on_booking ON public.workshop_bookings;
CREATE TRIGGER enforce_workshop_capacity_on_booking
BEFORE INSERT OR UPDATE OF status, workshop_id ON public.workshop_bookings
FOR EACH ROW
EXECUTE FUNCTION public.enforce_workshop_capacity();