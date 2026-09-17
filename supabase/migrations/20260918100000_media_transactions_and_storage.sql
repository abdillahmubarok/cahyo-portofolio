-- Additive: does not delete or rewrite existing projects/media.
-- All RPCs retain RLS and explicitly require an authenticated admin.
CREATE OR REPLACE FUNCTION public.set_project_cover(p_project_id uuid, p_media_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE = '42501'; END IF;
  PERFORM id FROM public.projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
  PERFORM id FROM public.project_media WHERE id = p_media_id AND project_id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Media does not belong to project'; END IF;
  UPDATE public.project_media SET is_cover = false WHERE project_id = p_project_id AND is_cover;
  UPDATE public.project_media SET is_cover = true WHERE id = p_media_id AND project_id = p_project_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reorder_project_media(p_project_id uuid, p_media_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin required' USING ERRCODE = '42501'; END IF;
  PERFORM id FROM public.projects WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Project not found'; END IF;
  PERFORM id FROM public.project_media WHERE project_id = p_project_id FOR UPDATE;
  IF p_media_ids IS NULL
     OR cardinality(p_media_ids) <> (SELECT count(*) FROM public.project_media WHERE project_id = p_project_id)
     OR cardinality(p_media_ids) <> (SELECT count(DISTINCT id) FROM unnest(p_media_ids) AS ids(id))
     OR EXISTS (SELECT 1 FROM unnest(p_media_ids) AS ids(id) WHERE NOT EXISTS (
       SELECT 1 FROM public.project_media m WHERE m.id = ids.id AND m.project_id = p_project_id
     )) THEN
    RAISE EXCEPTION 'Media list changed; reload before saving order';
  END IF;
  UPDATE public.project_media m SET sort_order = ordered.position - 1
    FROM unnest(p_media_ids) WITH ORDINALITY AS ordered(id, position)
    WHERE m.id = ordered.id AND m.project_id = p_project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_project_cover(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reorder_project_media(uuid, uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_project_cover(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reorder_project_media(uuid, uuid[]) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio-images', 'portfolio-images', true, 20971520,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Portfolio assets readable" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'portfolio-images');
CREATE POLICY "Portfolio admin insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portfolio-images' AND (SELECT public.is_admin()) AND name LIKE 'projects/%');
CREATE POLICY "Portfolio admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio-images' AND (SELECT public.is_admin()))
  WITH CHECK (bucket_id = 'portfolio-images' AND (SELECT public.is_admin()) AND name LIKE 'projects/%');
CREATE POLICY "Portfolio admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'portfolio-images' AND (SELECT public.is_admin()));

-- Restrictive guards prevent any pre-existing broad permissive policy on this
-- bucket from granting write access to non-admins; other buckets are unaffected.
CREATE POLICY "Portfolio insert admin guard" ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id <> 'portfolio-images' OR CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.is_admin()) ELSE false END);
CREATE POLICY "Portfolio update admin guard" ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id <> 'portfolio-images' OR CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.is_admin()) ELSE false END)
  WITH CHECK (bucket_id <> 'portfolio-images' OR CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.is_admin()) ELSE false END);
CREATE POLICY "Portfolio delete admin guard" ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (bucket_id <> 'portfolio-images' OR CASE WHEN (SELECT auth.role()) = 'authenticated' THEN (SELECT public.is_admin()) ELSE false END);
