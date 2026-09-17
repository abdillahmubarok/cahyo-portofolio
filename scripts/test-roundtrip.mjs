import { chromium, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { adminClient, requireMutationTarget, check, baseURL, supabaseUrl } from './lib/environment.mjs'

// Creates only a uniquely named temporary project. Never edits owner content.
requireMutationTarget()
const admin = await adminClient()
const id = randomUUID()
const slug = `roundtrip-${id}`
const paths = [0,1,2].map(index => `projects/${id}/roundtrip-${index}.png`)
let projectCreated = false
let browser
let page
// Valid 1x1 PNG; image decode is asserted in the real drawer.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=', 'base64')
async function openFreshDrawer() {
  // Direct DB mutations bypass Server Action invalidation. Poll across the
  // documented 60s ISR period, never mistake serialized/stale HTML for rendering.
  await expect(async () => {
    await page.goto(`${baseURL}/?project=${slug}#projects`)
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 3000 })
  }).toPass({ timeout: 150000, intervals: [1500,5000,15000] })
}
try {
  check(await admin.from('projects').insert({id, slug, title:'Temporary media roundtrip', published:true, sort_order:999999}), 'Create temporary project')
  projectCreated = true
  const mediaIds = []
  for (const [index, path] of paths.entries()) {
    check(await admin.storage.from('portfolio-images').upload(path,png,{contentType:'image/png', cacheControl:'0'}), 'Upload temporary image')
    const row = check(await admin.from('project_media').insert({ project_id:id, storage_path:path, width:1, height:1, aspect_ratio:1, sort_order:index, is_cover:index===0, alt_text:`Roundtrip image ${index}` }).select().single(), 'Register temporary media')
    mediaIds.push(row.id)
    if (!(await fetch(`${supabaseUrl}/storage/v1/object/public/portfolio-images/${path}`,{method:'HEAD'})).ok) throw new Error('Storage image unreachable')
  }
  expect(check(await admin.from('project_media').select('id').eq('project_id',id),'Query registered media')).toHaveLength(3)
  browser = await chromium.launch()
  page = await browser.newPage()
  await openFreshDrawer()
  for(const mediaId of mediaIds) {
    const image = page.getByRole('dialog').locator(`[data-media-id="${mediaId}"] img`)
    await image.scrollIntoViewIfNeeded()
    await expect(image).toBeInViewport()
    await expect.poll(()=>image.evaluate(n=>n.naturalWidth)).toBeGreaterThan(0)
  }
  check(await admin.rpc('set_project_cover',{p_project_id:id,p_media_id:mediaIds[0]}),'Atomic cover')
  check(await admin.rpc('reorder_project_media',{p_project_id:id,p_media_ids:[mediaIds[0],mediaIds[2],mediaIds[1]]}),'Reorder gallery')
  await expect(async()=>{
    await page.reload()
    await expect(page.getByRole('dialog')).toBeVisible()
    expect(await page.getByRole('dialog').locator('figure[data-media-id]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-media-id')))).toEqual([mediaIds[2],mediaIds[1]])
  }).toPass({timeout:150000,intervals:[2000,10000,20000]})
  console.log('PASS: uploaded, queried, decoded visible drawer images, transactional cover and visible reordered gallery')
} finally {
  // DB before Storage; only delete assets after confirmed removal of references.
  try {
    if (projectCreated) {
      check(await admin.from('projects').delete().eq('id',id),'Cleanup temporary project')
      expect(check(await admin.from('project_media').select('id').eq('project_id',id),'Verify rows removed')).toHaveLength(0)
    }
    check(await admin.storage.from('portfolio-images').remove(paths),'Cleanup temporary Storage objects')
    const remaining = check(await admin.storage.from('portfolio-images').list(`projects/${id}`),'Verify Storage removed')
    expect(remaining).toHaveLength(0)
    if (page) await expect(async()=>{
      await page.goto(`${baseURL}/?project=${slug}#projects`)
      await expect(page.locator('[data-media-id]')).toHaveCount(0)
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }).toPass({timeout:150000,intervals:[2000,10000,20000]})
    console.log('PASS: cleanup verified in database, Storage and public drawer')
  } catch(error) {
    console.error(`CLEANUP FAILED; retry only temporary project ${id} and paths ${paths.join(', ')}`)
    throw error
  } finally {
    await browser?.close()
    await admin.auth.signOut()
  }
}
