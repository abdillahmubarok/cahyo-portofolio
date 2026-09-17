-- ============================================================
-- Migration: Data Integrity, Constraints, and Security Hardening
-- ============================================================

-- 1. Hardening function search paths
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Sync project status with published flag
CREATE OR REPLACE FUNCTION public.sync_project_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.published = true THEN
    NEW.status := 'published';
  ELSE
    NEW.status := 'draft';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_project_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_sync_project_status ON public.projects;
CREATE TRIGGER tr_sync_project_status
  BEFORE INSERT OR UPDATE OF published ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_project_status();

-- Sync existing records
UPDATE public.projects
SET status = CASE WHEN published = true THEN 'published' ELSE 'draft' END;

-- 3. Cover Image Integrity: Partial Unique Index
-- Ensure a project can have at most one is_cover = true
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_media_unique_cover
  ON public.project_media (project_id)
  WHERE (is_cover = true);

-- 4. Secure is_admin function
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 5. Optimize RLS Policies with explicit TO roles and initplan subqueries

-- Projects
DROP POLICY IF EXISTS "Public can read published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins have full access to projects" ON public.projects;

CREATE POLICY "Public can read published projects"
  ON public.projects
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

CREATE POLICY "Admins have full access to projects"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Project Media
DROP POLICY IF EXISTS "Public can read media of published projects" ON public.project_media;
DROP POLICY IF EXISTS "Admins have full access to project_media" ON public.project_media;

CREATE POLICY "Public can read media of published projects"
  ON public.project_media
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_media.project_id
        AND projects.published = true
    )
  );

CREATE POLICY "Admins have full access to project_media"
  ON public.project_media
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Site Settings
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admin Profiles
DROP POLICY IF EXISTS "Admins can read own profile" ON public.admin_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.admin_profiles;

CREATE POLICY "Admins can read own profile"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (((SELECT auth.uid()) = user_id));

CREATE POLICY "Admins can manage profiles"
  ON public.admin_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Contact Messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can insert contact messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Services
DROP POLICY IF EXISTS "Public can read services" ON public.services;
DROP POLICY IF EXISTS "Admins have full access to services" ON public.services;

CREATE POLICY "Public can read services"
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins have full access to services"
  ON public.services
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
