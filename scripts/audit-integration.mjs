import { client, adminClient, check, allRows, listStorage, supabaseUrl, projectRef } from './lib/environment.mjs'

// Strictly read-only: even a denied INSERT is not an audit read.
const anon = client()
let failures = 0
function verify(condition, label) {
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${label}`)
  if (!condition) failures++
}
try {
  console.log(`Read-only Supabase audit: ${projectRef}`)
  const published = await allRows(anon, 'projects', '*, project_media(*)')
  verify(published.every(p => p.published), 'Anonymous project results contain only published projects')
  for (const table of ['admin_profiles', 'contact_messages']) {
    // Empty results establish observed visibility only, not a complete proof of RLS.
    const { data, error } = await anon.from(table).select('*').limit(1)
    verify(!error && data.length === 0, `No ${table} rows visible anonymously (observational, not a write-policy test)`)
  }
  for (const table of ['site_settings','services']) check(await anon.from(table).select('*'), `Read ${table}`)
  for (const project of published) {
    verify(project.project_media.filter(media => media.is_cover).length <= 1, `${project.slug}: maximum one cover`)
    verify(!!project.title && !!project.slug, `${project.slug}: required metadata`)
  }
  const adminAvailable = !!process.env.TEMP_ADMIN_EMAIL && !!process.env.TEMP_ADMIN_PASSWORD
  const reader = adminAvailable ? await adminClient() : anon
  const media = await allRows(reader, 'project_media', 'id, project_id, storage_path')
  const objects = await listStorage(reader)
  const dbPaths = new Set(media.map(m => m.storage_path))
  const storagePaths = new Set(objects)
  const orphanDb = media.filter(m => !storagePaths.has(m.storage_path))
  const orphanStorage = objects.filter(path => !dbPaths.has(path))
  console.log(JSON.stringify({ scope: adminAvailable ? 'all admin-visible rows' : 'published rows only', dbMediaCount: media.length, storageObjectCount: objects.length, orphanDbRows: orphanDb.map(m=>m.storage_path), orphanStorageObjects: adminAvailable ? orphanStorage : 'UNKNOWN without admin access to draft rows', unmatchedPublicPaths: adminAvailable ? undefined : orphanStorage }, null, 2))
  verify(orphanDb.length === 0, 'Every visible DB media row has a Storage object')
  if (adminAvailable) verify(orphanStorage.length === 0, 'Every Storage object has a DB media row')
  for (const mediaItem of media) {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/portfolio-images/${mediaItem.storage_path}`, { method:'HEAD', signal:AbortSignal.timeout(15000) })
    verify(response.ok, `Storage reachable: ${mediaItem.storage_path}`)
  }
  console.log('Drawer rendering is tested only by npm run test:e2e; no HTML string checks.')
  if (!adminAvailable) console.log('INCOMPLETE: full orphan and draft-visibility audit requires TEMP_ADMIN_EMAIL + TEMP_ADMIN_PASSWORD. No write policies were exercised.')
  if (adminAvailable) {
    const allProjects = await allRows(reader,'projects','id, published')
    const publicIds = new Set(published.map(p=>p.id))
    verify(allProjects.filter(p=>!p.published).every(p=>!publicIds.has(p.id)), 'Draft project IDs absent from public results')
    await reader.auth.signOut()
  }
  process.exitCode = failures ? 1 : adminAvailable || process.argv.includes('--public-only') ? 0 : 2
} catch (error) {
  console.error('AUDIT FAILED:', error.message)
  process.exitCode = 1
}
