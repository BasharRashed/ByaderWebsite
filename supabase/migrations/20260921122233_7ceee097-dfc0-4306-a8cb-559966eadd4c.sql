create table public.workshops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  title text not null,
  excerpt text not null,
  description text not null,
  day text not null,
  time text not null,
  duration text not null,
  capacity text not null,
  host text not null,
  image_key text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

GRANT SELECT ON public.workshops TO anon, authenticated;
GRANT ALL ON public.workshops TO service_role;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view workshops"
  ON public.workshops FOR SELECT
  TO anon, authenticated
  USING (true);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  created_at timestamptz not null default now()
);

GRANT INSERT ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a booking"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

insert into public.workshops
  (slug, category, title, excerpt, description, day, time, duration, capacity, host, image_key, sort_order)
values
  ('coffee-basics', 'فنّ القهوة', 'أساسيات التحضير',
   'تعلّم فنّ الاستخلاص وتجهيز القهوة المختصة خطوة بخطوة.',
   'جلسة عملية تبدأ من اختيار الحبوب وتنتهي بفنجان متوازن. ستتعلّم ضبط درجات الاستخلاص، قياس الجرعات، وقراءة نكهة كل قهوة مع المدرّبة سارة.',
   'السبت، ٢٦ أيلول', '٤:٠٠ مساءً', '٣ ساعات', '١٢ مقعداً', 'سارة الخطيب', 'coffee', 0),
  ('kufic-calligraphy', 'الخط العربي', 'مدخل إلى الخط الكوفي',
   'بداية هادئة مع القلم والورق نحو جمال الحرف العربي.',
   'نتعرّف إلى ميزان الحرف الكوفي وأدواته، ثم نرسم تكويناً بسيطاً خاصاً بنا. الورشة مناسبة للمبتدئين وجميع المواد مشمولة.',
   'الأحد، ٢٧ أيلول', '٦:٠٠ مساءً', 'ساعتان ونصف', '١٠ مقاعد', 'يوسف منصور', 'calligraphy', 1),
  ('decisive-moment', 'التصوير', 'اللقطة الحاسمة',
   'قراءة الضوء واللون والتكوين لإنتاج صور تروي قصصاً.',
   'جولة تصويرية حيّة تبدأ من البيدر وتمتد إلى الشارع. نتمرّن على ملاحظة الضوء وانتظار اللحظة، ثم نراجع الصور معاً في نهاية اللقاء.',
   'الخميس، ١ تشرين الأول', '٥:٠٠ مساءً', '٣ ساعات', '١٤ مقعداً', 'ليان شقير', 'photography', 2);