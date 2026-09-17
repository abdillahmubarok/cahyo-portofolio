import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

// Isolated PostgreSQL engine. Minimal auth/storage scaffolding substitutes for
// Supabase services; the repository's actual migrations execute unchanged.
const db = new PGlite()
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.role', true) $$;
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    CREATE TABLE storage.objects (id uuid DEFAULT gen_random_uuid(), bucket_id text, name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated;`)
  for (const file of ['20260917100000_initial_architect_portfolio.sql','20260917120000_data_integrity_and_security.sql','20260918100000_media_transactions_and_storage.sql']) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url),'utf8'))
  }
  await db.exec(`GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    INSERT INTO auth.users VALUES ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
    INSERT INTO public.admin_profiles(user_id) VALUES ('00000000-0000-0000-0000-000000000001');
    INSERT INTO public.projects(id,title,slug,published) VALUES ('00000000-0000-0000-0000-000000000010','Test','test',true);
    INSERT INTO public.project_media(id,project_id,storage_path,is_cover,sort_order) VALUES
    ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000010','projects/test/a.png',true,0),
    ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000010','projects/test/b.png',false,1);
    SET ROLE authenticated; SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001'; SET request.jwt.claim.role = 'authenticated';`)
  await db.exec(`SELECT public.set_project_cover('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000012')`)
  const covers = async () => (await db.query('SELECT id FROM project_media WHERE is_cover')).rows.map(r=>r.id)
  assert.deepEqual(await covers(),['00000000-0000-0000-0000-000000000012'])
  await assert.rejects(db.exec(`SELECT public.set_project_cover('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000099')`))
  assert.deepEqual(await covers(),['00000000-0000-0000-0000-000000000012'])
  // Fail AFTER the old cover was cleared: the entire function must roll back.
  await db.exec(`RESET ROLE; CREATE FUNCTION public.fail_cover() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.is_cover THEN RAISE EXCEPTION 'Injected cover failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER fail_cover BEFORE UPDATE ON public.project_media FOR EACH ROW EXECUTE FUNCTION public.fail_cover(); SET ROLE authenticated;`)
  await assert.rejects(db.exec(`SELECT public.set_project_cover('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000011')`))
  assert.deepEqual(await covers(),['00000000-0000-0000-0000-000000000012'])
  await db.exec(`RESET ROLE; DROP TRIGGER fail_cover ON public.project_media; SET ROLE authenticated;
    SELECT public.reorder_project_media('00000000-0000-0000-0000-000000000010',ARRAY['00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000011']::uuid[]);`)
  const order = async () => (await db.query('SELECT id FROM project_media ORDER BY sort_order')).rows.map(r=>r.id)
  assert.deepEqual(await order(),['00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000011'])
  await assert.rejects(db.exec(`SELECT public.reorder_project_media('00000000-0000-0000-0000-000000000010',ARRAY['00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000011']::uuid[])`))
  assert.deepEqual(await covers(),['00000000-0000-0000-0000-000000000012'])
  await db.exec(`INSERT INTO storage.objects(bucket_id,name) VALUES('portfolio-images','projects/test/a.png');
    UPDATE storage.objects SET name='projects/test/b.png'; DELETE FROM storage.objects;`)
  // Simulate an accidentally broad existing write policy. Restrictive guards
  // must still deny anonymous/non-admin writes to portfolio-images.
  await db.exec(`RESET ROLE; CREATE POLICY broad_existing_policy ON storage.objects FOR ALL TO anon,authenticated USING(true) WITH CHECK(true);
    INSERT INTO storage.objects(bucket_id,name) VALUES('portfolio-images','projects/test/keep.png');
    SET ROLE authenticated; SET request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';`)
  await assert.rejects(db.exec(`SELECT public.set_project_cover('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000011')`))
  await assert.rejects(db.exec(`INSERT INTO storage.objects(bucket_id,name) VALUES('portfolio-images','projects/test/denied.png')`))
  await db.exec(`DELETE FROM storage.objects WHERE bucket_id='portfolio-images'`)
  assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length,1)
  await db.exec(`RESET ROLE; SET ROLE anon; SET request.jwt.claim.sub=''; SET request.jwt.claim.role='anon';`)
  await assert.rejects(db.exec(`INSERT INTO storage.objects(bucket_id,name) VALUES('portfolio-images','projects/test/denied.png')`))
  assert.equal((await db.query('SELECT * FROM storage.objects')).rows.length,1)
  await db.exec(`RESET ROLE`)
  const bucket=(await db.query('SELECT * FROM storage.buckets')).rows[0]
  assert.equal(bucket.public,true)
  assert.equal(Number(bucket.file_size_limit),20971520)
  assert.deepEqual(bucket.allowed_mime_types,['image/jpeg','image/png','image/webp','image/avif'])
  console.log('PASS: all migrations replay; cover success/rollback/ownership; reorder validation; independent cover; admin Storage writes; non-admin/anon denial; bucket config. Local PostgreSQL only, not live Supabase.')
} finally { await db.close() }
