import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 1. Read .env.local without external dotenv dependency
const envPath = path.resolve('.env.local')
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.local file not found.')
  process.exit(1)
}

const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const isE2E = process.argv.includes('--e2e')

console.log('='.repeat(65))
console.log('CAHYO ARCHITECTURE — DATA INTEGRITY & AUDIT SUITE')
console.log('='.repeat(65))
console.log(`Supabase URL: ${supabaseUrl}`)
console.log(`Publishable Key: ${supabaseAnonKey.slice(0, 16)}... (masked)`)
console.log(`Mode: ${isE2E ? 'Full Audit + E2E Mutation Cycle' : 'Read-Only Audit'}`)
console.log('-'.repeat(65))

const anonClient = createClient(supabaseUrl, supabaseAnonKey)

async function runAudit() {
  let hasFailures = false

  // TEST 1: Connectivity & Public Reads
  console.log('\n[1] Testing Public Reads via Anon Client...')
  const { data: publishedProjects, error: pubProjErr } = await anonClient
    .from('projects')
    .select('*, project_media(*)')
    .eq('published', true)

  if (pubProjErr) {
    console.error(' FAIL: Anon cannot read published projects:', pubProjErr.message)
    hasFailures = true
  } else {
    console.log(` PASS: Anon read published projects (count: ${publishedProjects.length})`)
  }

  const { data: siteSettings, error: settErr } = await anonClient
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()

  if (settErr) {
    console.error(' FAIL: Anon cannot read site_settings:', settErr.message)
    hasFailures = true
  } else {
    console.log(` PASS: Anon read site_settings (Studio: "${siteSettings?.studio_name || 'N/A'}")`)
  }

  const { data: services, error: srvErr } = await anonClient
    .from('services')
    .select('*')

  if (srvErr) {
    console.error(' FAIL: Anon cannot read services:', srvErr.message)
    hasFailures = true
  } else {
    console.log(` PASS: Anon read services (count: ${services?.length || 0})`)
  }

  // TEST 2: RLS Security Boundary (Anon must NOT read sensitive tables or write)
  console.log('\n[2] Testing RLS Security Boundaries...')

  // 2a. Anon cannot read contact_messages
  const { data: msgData, error: msgErr } = await anonClient
    .from('contact_messages')
    .select('*')

  if (!msgErr && msgData && msgData.length > 0) {
    console.error(' CRITICAL FAIL: Anonymous user was able to read contact_messages!')
    hasFailures = true
  } else {
    console.log(' PASS: Anonymous cannot SELECT contact_messages (RLS protected)')
  }

  // 2b. Anon cannot read admin_profiles
  const { data: admData, error: admErr } = await anonClient
    .from('admin_profiles')
    .select('*')

  if (!admErr && admData && admData.length > 0) {
    console.error(' CRITICAL FAIL: Anonymous user was able to read admin_profiles!')
    hasFailures = true
  } else {
    console.log(' PASS: Anonymous cannot SELECT admin_profiles (RLS protected)')
  }

  // 2c. Anon cannot mutate projects
  const { error: insertErr } = await anonClient
    .from('projects')
    .insert({ title: '__ANON_HACK__', slug: '__anon_hack__' })

  if (!insertErr) {
    console.error(' CRITICAL FAIL: Anonymous user was able to INSERT into projects!')
    hasFailures = true
  } else {
    console.log(' PASS: Anonymous cannot INSERT projects (RLS enforced)')
  }

  // TEST 3: Database Consistency & Integrity
  console.log('\n[3] Checking Database Records & Consistency...')
  const { data: allProjects } = await anonClient
    .from('projects')
    .select('id, title, slug, published, status, size_text, sort_order')

  console.log(`Total projects visible in DB: ${allProjects?.length ?? 0}`)
  for (const p of allProjects || []) {
    console.log(`  - [${p.published ? 'PUBLISHED' : 'DRAFT'}] "${p.title}" (slug: ${p.slug}, status: ${p.status})`)
  }

  // TEST 3B: Project Detail Page Audit for Every Published Project
  console.log('\n[3B] PROJECT DETAIL AUDIT FOR PUBLISHED PROJECTS...')
  const { data: detailedProjects, error: detailErr } = await anonClient
    .from('projects')
    .select('*, project_media(*)')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  if (detailErr) {
    console.error(' FAIL: Cannot query published projects for detail audit:', detailErr.message)
    hasFailures = true
  } else {
    for (const project of detailedProjects || []) {
      console.log(`\n  PROJECT: ${project.slug} ("${project.title}")`)
      const url = `http://localhost:3000/projects/${project.slug}`
      let res, html
      try {
        res = await fetch(url)
        html = await res.text()
      } catch (err) {
        console.error(`    FAIL: Could not fetch ${url}: ${err.message}`)
        hasFailures = true
        continue
      }

      if (res.status !== 200) {
        console.error(`    FAIL: Expected HTTP 200, got ${res.status}`)
        hasFailures = true
        continue
      }

      const articleMatch = html.match(/<article[\s\S]*?<\/article>/)
      const articleHtml = articleMatch ? articleMatch[0] : html

      // Field verification list
      const fieldMap = [
        { name: 'title', val: project.title },
        { name: 'category', val: project.category },
        { name: 'summary', val: project.summary },
        { name: 'description', val: project.description },
        { name: 'problem', val: project.problem },
        { name: 'solution', val: project.solution },
        { name: 'duration_text', val: project.duration_text },
        { name: 'size_text', val: project.size_text },
        { name: 'style_text', val: project.style_text },
        { name: 'location', val: project.location },
        { name: 'year', val: project.year ? String(project.year) : null },
        { name: 'client_name', val: project.client_name },
      ]

      let dbFieldsPopulated = 0
      let fieldsRendered = 0

      for (const f of fieldMap) {
        if (f.val && String(f.val).trim() !== '') {
          dbFieldsPopulated++
          if (articleHtml.includes(String(f.val))) {
            fieldsRendered++
          } else {
            console.error(`    MISSING RENDER: Field "${f.name}" with value "${f.val}" not found in <article>`)
          }
        }
      }

      // Check media
      const mediaList = project.project_media || []
      const dbMediaCount = mediaList.length
      const cover = mediaList.find(m => m.is_cover) ?? mediaList[0] ?? null
      const heroRendered = cover && articleHtml.includes(cover.storage_path) ? 1 : 0
      const galleryMedia = cover ? mediaList.filter(m => m.id !== cover.id) : mediaList
      let galleryRendered = 0
      let brokenUrls = 0

      for (const m of galleryMedia) {
        if (articleHtml.includes(m.storage_path)) {
          galleryRendered++
        }
      }

      // Check if all media URLs are reachable if media exist
      for (const m of mediaList) {
        const imgUrl = `${supabaseUrl}/storage/v1/object/public/portfolio-images/${m.storage_path}`
        try {
          const imgRes = await fetch(imgUrl, { method: 'HEAD' })
          if (imgRes.status >= 400) {
            console.warn(`    WARNING: Image storage URL returned ${imgRes.status}: ${imgUrl}`)
            brokenUrls++
          }
        } catch {
          brokenUrls++
        }
      }

      const passFields = dbFieldsPopulated === fieldsRendered
      const passMedia = (heroRendered + galleryRendered) === dbMediaCount

      console.log(`    DB metadata fields: ${dbFieldsPopulated}`)
      console.log(`    Rendered fields:    ${fieldsRendered}`)
      console.log(`    DB media count:     ${dbMediaCount}`)
      console.log(`    Hero rendered:      ${heroRendered}`)
      console.log(`    Gallery rendered:   ${galleryRendered}`)
      console.log(`    Broken URLs:        ${brokenUrls}`)

      if (passFields && passMedia && brokenUrls === 0) {
        console.log(`    STATUS: PASS`)
      } else {
        console.error(`    STATUS: FAIL (fields: ${passFields}, media: ${passMedia}, broken: ${brokenUrls})`)
        hasFailures = true
      }
    }
  }

  // TEST 4: E2E Mutation Cycle (if --e2e requested)
  if (isE2E) {
    console.log('\n[4] Running E2E Project Lifecycle (requires admin auth)...')
    const adminPassword = process.env.TEMP_ADMIN_PASSWORD
    if (!adminPassword) {
      console.log(' SKIP: TEMP_ADMIN_PASSWORD env var not provided for E2E mutation tests.')
    } else {
      const adminClient = createClient(supabaseUrl, supabaseAnonKey)
      const { error: loginErr } = await adminClient.auth.signInWithPassword({
        email: 'admin@cahyo-architecture.com',
        password: adminPassword,
      })

      if (loginErr) {
        console.error(' FAIL: Admin sign in failed:', loginErr.message)
        hasFailures = true
      } else {
        console.log(' PASS: Admin authenticated successfully')

        const testSlug = `e2e-test-${Date.now()}`
        const updatedSlug = `e2e-test-renamed-${Date.now()}`

        // Step 1: Create Draft
        const { data: newProj, error: createErr } = await adminClient
          .from('projects')
          .insert({
            title: '__E2E TEST PROJECT__',
            slug: testSlug,
            summary: 'Test summary',
            description: 'Test description',
            problem: 'Test problem',
            solution: 'Test solution',
            published: false,
            featured: false,
            sort_order: 999,
          })
          .select()
          .single()

        if (createErr || !newProj) {
          console.error(' FAIL: Could not create test project:', createErr?.message)
          hasFailures = true
        } else {
          console.log(` PASS: Created draft test project (ID: ${newProj.id})`)

          // Step 2: Verify draft is NOT visible publicly
          const { data: publicCheck } = await anonClient
            .from('projects')
            .select('id')
            .eq('id', newProj.id)
            .maybeSingle()

          if (publicCheck) {
            console.error(' FAIL: Draft project is visible anonymously!')
            hasFailures = true
          } else {
            console.log(' PASS: Draft project is hidden from anonymous visitors')
          }

          // Step 3: Publish project
          await adminClient.from('projects').update({ published: true }).eq('id', newProj.id)
          const { data: publishedCheck } = await anonClient
            .from('projects')
            .select('id, title, status')
            .eq('id', newProj.id)
            .maybeSingle()

          if (!publishedCheck) {
            console.error(' FAIL: Published project did not appear in anon query!')
            hasFailures = true
          } else {
            console.log(` PASS: Published project is now visible anonymously (status: ${publishedCheck.status})`)
          }

          // Step 4: Slug update
          await adminClient.from('projects').update({ slug: updatedSlug }).eq('id', newProj.id)
          const { data: oldSlugCheck } = await anonClient
            .from('projects')
            .select('id')
            .eq('slug', testSlug)
            .maybeSingle()
          const { data: newSlugCheck } = await anonClient
            .from('projects')
            .select('id')
            .eq('slug', updatedSlug)
            .maybeSingle()

          if (oldSlugCheck || !newSlugCheck) {
            console.error(' FAIL: Slug rename verification failed!')
            hasFailures = true
          } else {
            console.log(' PASS: Old slug unreachable, new slug resolves')
          }

          // Step 5: Clean up (Delete)
          await adminClient.from('projects').delete().eq('id', newProj.id)
          const { data: deletedCheck } = await adminClient
            .from('projects')
            .select('id')
            .eq('id', newProj.id)
            .maybeSingle()

          if (deletedCheck) {
            console.error(' FAIL: Project deletion failed!')
            hasFailures = true
          } else {
            console.log(' PASS: Test project completely deleted and cleaned up')
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(65))
  if (hasFailures) {
    console.error('AUDIT RESULT: FAIL — Issues detected.')
    process.exit(1)
  } else {
    console.log('AUDIT RESULT: ALL AUDIT CHECKS PASSED SUCCESSFULLY!')
    console.log('='.repeat(65))
  }
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err)
  process.exit(1)
})
