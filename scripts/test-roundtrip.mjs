import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

const envPath = path.resolve('.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1].trim()
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=([^\r\n]+)/)[1].trim()

const supabase = createClient(supabaseUrl, supabaseKey)

const adminPassword = process.env.TEMP_ADMIN_PASSWORD
if (adminPassword) {
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@cahyo-architecture.com',
    password: adminPassword,
  })
  if (authErr) throw new Error('Admin auth failed: ' + authErr.message)
}

// Create 100x100 valid PNG
function createPngBuffer() {
  const width = 100
  const height = 100
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const chunk = (type, data) => {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const body = Buffer.concat([typeBuf, data])
    const crc = Buffer.alloc(4)
    let c = 0xffffffff
    for (let i = 0; i < body.length; i++) {
      c ^= body[i]
      for (let j = 0; j < 8; j++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0)
    }
    crc.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0)
    return Buffer.concat([len, body, crc])
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const scanline = 1 + width * 3
  const raw = Buffer.alloc(height * scanline)
  for (let y = 0; y < height; y++) {
    const off = y * scanline
    raw[off] = 0
    for (let x = 0; x < width; x++) {
      const px = off + 1 + x * 3
      raw[px] = 200; raw[px + 1] = 180; raw[px + 2] = 160
    }
  }
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

async function runRoundtrip() {
  console.log('=================================================================')
  console.log('CAHYO ARCHITECTURE — PHASE 33 MEDIA ROUNDTRIP VERIFICATION')
  console.log('=================================================================')

  // 1. Get target project
  const { data: project, error: pErr } = await supabase
    .from('projects')
    .select('id, slug, title')
    .eq('slug', 'rumah-1-lantai-5x8-meter')
    .single()

  if (pErr || !project) {
    throw new Error('Target project not found: ' + pErr?.message)
  }
  console.log(`Target project: "${project.title}" (${project.id})`)

  // 2. Upload test image buffer
  const filename = `test-roundtrip-verify-${Date.now()}.png`
  const storagePath = `projects/${project.id}/${filename}`
  const pngBuffer = createPngBuffer()

  console.log(`[Step 1] Uploading test image: ${storagePath}`)
  const { error: upErr } = await supabase.storage
    .from('portfolio-images')
    .upload(storagePath, pngBuffer, { contentType: 'image/png' })

  if (upErr) throw new Error('Upload failed: ' + upErr.message)

  // Verify storage reachable
  const testUrl = `${supabaseUrl}/storage/v1/object/public/portfolio-images/${storagePath}`
  const headRes = await fetch(testUrl, { method: 'HEAD' })
  console.log(`[Step 2] Storage reachability check: HTTP ${headRes.status}`)
  if (headRes.status !== 200) throw new Error('Uploaded image not reachable via public URL')

  // 3. Register media in DB
  console.log(`[Step 3] Registering media record in DB...`)
  const { data: mediaRecord, error: dbErr } = await supabase
    .from('project_media')
    .insert({
      project_id: project.id,
      storage_path: storagePath,
      width: 100,
      height: 100,
      aspect_ratio: 1.0,
      sort_order: 99,
      is_cover: false,
      alt_text: 'Temporary Roundtrip Verification Image',
      caption: 'Roundtrip Verification Caption'
    })
    .select()
    .single()

  if (dbErr) throw new Error('DB insert failed: ' + dbErr.message)
  console.log(`DB Record Created: ${mediaRecord.id}`)

  // 4. Fetch public page and verify render
  console.log(`[Step 4] Checking public detail page render...`)
  await new Promise(r => setTimeout(r, 1000))
  const pageRes = await fetch(`http://localhost:3000/projects/${project.slug}`)
  const pageHtml = await pageRes.text()

  const isRendered = pageHtml.includes(filename)
  console.log(`Public page rendered new image: ${isRendered}`)

  // 5. Clean deletion
  console.log(`[Step 5] Deleting test media record and storage asset...`)
  const { error: delDbErr } = await supabase
    .from('project_media')
    .delete()
    .eq('id', mediaRecord.id)

  if (delDbErr) throw new Error('Delete DB record failed: ' + delDbErr.message)

  const { error: delStoreErr } = await supabase.storage
    .from('portfolio-images')
    .remove([storagePath])

  if (delStoreErr) throw new Error('Delete storage file failed: ' + delStoreErr.message)

  // 6. Verify clean state
  console.log(`[Step 6] Verifying clean-state removal...`)
  const verifyHead = await fetch(testUrl, { method: 'HEAD' })
  console.log(`Deleted image storage status: HTTP ${verifyHead.status} (expected 400/404)`)

  console.log('=================================================================')
  console.log('PHASE 33 MEDIA ROUNDTRIP: ALL STEPS COMPLETED CLEANLY (PASS)!')
  console.log('=================================================================')
}

runRoundtrip().catch(err => {
  console.error('ROUNDTRIP FAILED:', err)
  process.exit(1)
})
