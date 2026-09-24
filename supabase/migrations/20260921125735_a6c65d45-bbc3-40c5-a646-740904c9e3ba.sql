CREATE TABLE IF NOT EXISTS public.workshops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  description text NOT NULL,
  day text NOT NULL,
  time text NOT NULL,
  duration text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  host text NOT NULL,
  image_key text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.workshops TO anon;
GRANT SELECT ON public.workshops TO authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view workshops" ON public.workshops FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.workshop_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id uuid NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.workshop_bookings TO anon;
GRANT INSERT ON public.workshop_bookings TO authenticated;
GRANT ALL ON public.workshop_bookings TO service_role;
ALTER TABLE public.workshop_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a booking" ON public.workshop_bookings FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.workshops (slug, category, title, excerpt, description, day, time, duration, capacity, host, image_key, sort_order) VALUES
('coffee-basics','فنّ القهوة','فنّ القهوة','رحلة في تحميص القهوة وتحضيرها على الطريقة العربية.','ورشة عملية نتعرّف فيها على أنواع البنّ ودرجات التحميص، ونتدرّب على تحضير القهوة العربية والإسبريسو، ونختم بجلسة تذوّق جماعية.','السبت','5:00 مساءً','ساعتان',12,'مجتمع البيدر','coffee',1),
('kufic-calligraphy','الخط العربي','الخط الكوفي','أساسيات الخط الكوفي بالقلم والحبر.','نبدأ من القياسات الهندسية للحرف الكوفي، ثم نتدرّب على تركيب الكلمات والتشكيلات، وينتهي اللقاء بلوحة صغيرة يأخذها كل مشارك معه.','الأربعاء','6:00 مساءً','ساعتان ونصف',10,'مجتمع البيدر','calligraphy',2),
('decisive-moment','التصوير','اللحظة الحاسمة','التصوير الفوتوغرافي في الأزقة والأسواق.','لقاء ميداني نتعلّم فيه قراءة الضوء والتكوين، ثم نخرج في جولة تصوير قصيرة، ونعود لمراجعة الصور ومناقشتها معاً.','الجمعة','4:00 عصراً','ثلاث ساعات',8,'مجتمع البيدر','photography',3)
ON CONFLICT (slug) DO NOTHING;