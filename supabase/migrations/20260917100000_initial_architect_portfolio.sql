-- ============================================================
-- Architect Portfolio — Initial Migration
-- ============================================================

-- ========================
-- 1. Helper: is_admin()
-- ========================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = auth.uid()
  );
END;
$$;

-- ========================
-- 2. updated_at trigger function
-- ========================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ========================
-- 3. Tables
-- ========================

-- projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  summary text,
  description text,
  problem text,
  solution text,
  duration_text text,
  size_text text,
  style_text text,
  category text,
  location text,
  client_name text,
  year integer,
  status text DEFAULT 'draft',
  featured boolean DEFAULT false,
  published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- project_media
CREATE TABLE IF NOT EXISTS public.project_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  alt_text text,
  caption text,
  width integer,
  height integer,
  aspect_ratio numeric,
  sort_order integer DEFAULT 0,
  is_cover boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- site_settings (singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  architect_name text,
  studio_name text,
  hero_title text,
  hero_subtitle text,
  about_short text,
  about_long text,
  email text,
  phone text,
  whatsapp text,
  address text,
  instagram_url text,
  linkedin_url text,
  behance_url text,
  footer_text text,
  updated_at timestamptz DEFAULT now()
);

-- admin_profiles
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- contact_messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon_name text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ========================
-- 4. Indexes
-- ========================
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_published ON public.projects(published);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON public.projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON public.projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_project_media_project_id ON public.project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_project_media_sort_order ON public.project_media(project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_contact_messages_read ON public.contact_messages(read);

-- ========================
-- 5. Triggers
-- ========================
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ========================
-- 6. Row Level Security
-- ========================

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- PROJECTS policies
CREATE POLICY "Public can read published projects"
  ON public.projects FOR SELECT
  USING (published = true);

CREATE POLICY "Admins have full access to projects"
  ON public.projects FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PROJECT_MEDIA policies
CREATE POLICY "Public can read media of published projects"
  ON public.project_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_media.project_id
        AND projects.published = true
    )
  );

CREATE POLICY "Admins have full access to project_media"
  ON public.project_media FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SITE_SETTINGS policies
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings FOR INSERT
  WITH CHECK (public.is_admin());

-- ADMIN_PROFILES policies
CREATE POLICY "Admins can read own profile"
  ON public.admin_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage profiles"
  ON public.admin_profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- CONTACT_MESSAGES policies
CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- SERVICES policies
CREATE POLICY "Public can read services"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to services"
  ON public.services FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ========================
-- 7. Seed site_settings
-- ========================
INSERT INTO public.site_settings (id, architect_name, studio_name, hero_title, hero_subtitle, about_short, footer_text)
VALUES (
  1,
  'Cahyo',
  'Cahyo Architecture',
  'Ruang yang dirancang untuk manusia, tempat, dan tujuan.',
  'Arsitektur · Interior · Visualisasi',
  'Studio arsitektur yang berfokus pada desain hunian dan komersial yang fungsional, estetis, dan berkelanjutan.',
  '© 2026 Cahyo Architecture. All rights reserved.'
)
ON CONFLICT (id) DO NOTHING;

-- ========================
-- 8. Seed default services
-- ========================
INSERT INTO public.services (title, description, icon_name, sort_order) VALUES
  ('Arsitektur', 'Desain bangunan dari konsep hingga dokumen konstruksi.', 'building', 1),
  ('Desain Interior', 'Penataan ruang interior yang fungsional dan estetis.', 'palette', 2),
  ('Residensial', 'Desain rumah tinggal yang nyaman dan personal.', 'home', 3),
  ('Komersial', 'Ruang komersial yang mendukung produktivitas dan branding.', 'store', 4),
  ('Renovasi', 'Transformasi bangunan existing menjadi lebih baik.', 'hammer', 5),
  ('Visualisasi 3D', 'Render dan presentasi visual berkualitas tinggi.', 'eye', 6)
ON CONFLICT DO NOTHING;
