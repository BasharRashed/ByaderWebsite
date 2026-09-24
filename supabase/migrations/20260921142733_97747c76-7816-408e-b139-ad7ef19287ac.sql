ALTER TABLE public.workshop_bookings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress';

ALTER TABLE public.workshop_bookings DROP CONSTRAINT IF EXISTS workshop_bookings_status_check;
ALTER TABLE public.workshop_bookings ADD CONSTRAINT workshop_bookings_status_check CHECK (status IN ('coming','in_progress','cancelled'));