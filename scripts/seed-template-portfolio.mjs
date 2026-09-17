import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import zlib from 'zlib'

// 1. Read environment variables
const envPath = path.resolve('.env.local')
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env.local not found')
  process.exit(1)
}

const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const adminPassword = process.env.TEMP_ADMIN_PASSWORD

if (!adminPassword) {
  console.error('ERROR: TEMP_ADMIN_PASSWORD environment variable is required to seed template media.')
  process.exit(1)
}

const client = createClient(supabaseUrl, supabaseAnonKey)

// 2. Authenticate Admin
console.log('='.repeat(65))
console.log('CAHYO ARCHITECTURE — SAFE TEMPLATE PORTFOLIO SEEDER')
console.log('='.repeat(65))
console.log('Authenticating admin session...')

const { data: authData, error: authErr } = await client.auth.signInWithPassword({
  email: 'admin@cahyo-architecture.com',
  password: adminPassword,
})

if (authErr || !authData.session) {
  console.error('FAIL: Admin login failed:', authErr?.message)
  process.exit(1)
}
console.log('Admin authenticated successfully.')

// 3. Helper: Generate valid architectural raster PNG buffer
function createArchitecturalPng(width, height, baseColor) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[n] = c
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type)
    const body = Buffer.concat([typeBuf, data])
    const crc = Buffer.alloc(4)
    let c = 0 ^ -1
    for (let i = 0; i < body.length; i++) {
      c = (c >>> 8) ^ table[(c ^ body[i]) & 0xff]
    }
    crc.writeInt32BE(c ^ -1, 0)
    return Buffer.concat([len, body, crc])
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2 // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const scanlineLength = 1 + width * 3
  const rawData = Buffer.alloc(scanlineLength * height)

  const [r, g, b] = baseColor

  for (let y = 0; y < height; y++) {
    const offset = y * scanlineLength
    rawData[offset] = 0
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3
      // Subtle architectural texture gradient
      const factor = 0.90 + 0.10 * Math.sin((x / width) * Math.PI) * Math.cos((y / height) * Math.PI)
      rawData[px] = Math.min(255, Math.floor(r * factor))
      rawData[px + 1] = Math.min(255, Math.floor(g * factor))
      rawData[px + 2] = Math.min(255, Math.floor(b * factor))
    }
  }

  const idatData = zlib.deflateSync(rawData)
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// 4. Template Projects Specification
const templateProjects = [
  {
    slug: 'rumah-1-lantai-5x8-meter',
    title: 'Rumah 1 Lantai 5×8 Meter',
    category: 'Residensial',
    size_text: '5 × 8 m (Luas Tanah ±40 m²)',
    style_text: 'Modern Minimalis',
    duration_text: '3 Bulan',
    location: 'Indonesia',
    client_name: 'Private Client',
    year: 2024,
    published: true,
    featured: true,
    sort_order: 1,
    summary: 'Eksplorasi efisiensi ruang compact living pada tapak terbatas dengan orientasi bukaan vertikal untuk pencahayaan alami.',
    description: 'Proyek ini mengeksplorasi penyusunan kebutuhan ruang dasar sebuah rumah tinggal pada tapak berukuran 5 × 8 meter. Organisasi ruang diarahkan agar sirkulasi tetap ringkas, area utama memperoleh pencahayaan alami yang melimpah, dan ventilasi silang dapat bekerja optimal sepanjang hari tanpa memerlukan pendingin buatan berlebih.',
    problem: 'Keterbatasan luas lahan sebesar 40 meter persegi menuntut penataan ruang yang sangat presisi tanpa mengorbankan privasi penghuni, area servis, serta kenyamanan sirkulasi harian keluarga.',
    solution: 'Pendekatan open-plan terpadu antara ruang duduk dan dapur bersih, dipadukan dengan skylight terarah serta inner courtyard mikro di bagian belakang untuk memastikan aliran udara segar dan cahaya alami merata.',
    targetMediaCount: 5,
    baseColor: [220, 215, 205], // Warm sand/concrete
    mediaSpecs: [
      { name: 'tampak-depan', caption: 'Tampak Depan — Komposisi Fasad Sederhana', alt: 'Rumah 1 Lantai 5x8 tampak depan', width: 1600, height: 900, ratio: 1.78 },
      { name: 'area-utama', caption: 'Area Utama — Ruang Duduk dan Ruang Makan Terpadu', alt: 'Area utama rumah compact living', width: 1200, height: 900, ratio: 1.33 },
      { name: 'inner-courtyard', caption: 'Inner Courtyard Mikro — Pencahayaan Alami', alt: 'Inner courtyard ventilasi alami', width: 900, height: 1200, ratio: 0.75 },
      { name: 'dapur-bersih', caption: 'Dapur Bersih — Efisiensi Ruang Masak', alt: 'Dapur bersih minimalis', width: 1200, height: 900, ratio: 1.33 },
      { name: 'detail-material', caption: 'Detail Tekstur Material dan Bukaan Cahaya', alt: 'Detail arsitektural material', width: 1600, height: 900, ratio: 1.78 },
    ],
  },
  {
    slug: 'rumah-tinggal-minimalis',
    title: 'Rumah Tinggal Minimalis',
    category: 'Residensial',
    size_text: '120 m²',
    style_text: 'Minimalis Tropis',
    duration_text: '5 Bulan',
    location: 'Indonesia',
    client_name: 'Private Client',
    year: 2024,
    published: true,
    featured: true,
    sort_order: 2,
    summary: 'Hunian keluarga satu lantai dengan konsep tropis teduh, mengedepankan pembagian zonasi privat dan semi-publik yang seimbang.',
    description: 'Konsep hunian tropis yang merespons iklim setempat melalui teritisan atap lebar, kisi-kisi kayu pelindung radiasi matahari barat, dan keterbukaan visual ke taman samping. Ruang komunal dirancang menyatu dengan teras belakang untuk memperluas ruang hidup keluarga.',
    problem: 'Kebutuhan ruang keluarga yang fleksibel pada iklim tropis lembap dengan orientasi tapak menghadap langsung ke arah lintasan matahari.',
    solution: 'Penggunaan secondary skin berupa kisi kayu alami dan teras berkanopi dalam untuk memfilter panas sembari mempertahankan hembusan angin alami ke seluruh sudut ruang.',
    targetMediaCount: 5,
    baseColor: [210, 210, 205], // Slate concrete
    mediaSpecs: [
      { name: 'fasad-tropis', caption: 'Perspektif Fasad Depan dengan Kisi Kayu', alt: 'Rumah tinggal minimalis tropis', width: 1600, height: 900, ratio: 1.78 },
      { name: 'teras-samping', caption: 'Koneksi Ruang Duduk dengan Teras Samping', alt: 'Teras samping terbuka', width: 1200, height: 900, ratio: 1.33 },
    ],
  },
  {
    slug: 'bangunan-2-lantai',
    title: 'Bangunan 2 Lantai',
    category: 'Komersial / Mixed Use',
    size_text: '240 m²',
    style_text: 'Modern Kontemporer',
    duration_text: '6 Bulan',
    location: 'Indonesia',
    client_name: 'Private Client',
    year: 2025,
    published: true,
    featured: true,
    sort_order: 3,
    summary: 'Gedung multifungsi dua lantai dengan ekspresi struktur baja tegas dan fleksibilitas lantai atas untuk ruang komunal.',
    description: 'Perancangan gedung mixed-use yang mengakomodasi fungsi usaha komersial di lantai dasar dan ruang serbaguna semi-terbuka di lantai atas. Fasad dirancang menonjol di koridor jalan lingkungan dengan permainan material ekspos dan kaca transparan luas.',
    problem: 'Integrasi akses sirkulasi terpisah antara pelanggan area komersial lantai 1 dan pengguna ruang serbaguna lantai 2.',
    solution: 'Penyediaan foyer sirkulasi terpisah di sisi samping bangunan dengan tangga arsitektural yang menjadi elemen aksen visual tampak bangunan.',
    targetMediaCount: 5,
    baseColor: [195, 200, 205], // Cool architectural grey
    mediaSpecs: [
      { name: 'perspektif-jalan', caption: 'Perspektif Sudut dari Arah Jalan', alt: 'Bangunan 2 lantai tampak sudut', width: 1600, height: 900, ratio: 1.78 },
      { name: 'lantai-dasar', caption: 'Ruang Komersial Lantai Dasar Berkonsep Terbuka', alt: 'Lantai dasar komersial', width: 1200, height: 900, ratio: 1.33 },
      { name: 'tangga-arsitektural', caption: 'Tangga Akses Samping dan Struktur Baja Ekspos', alt: 'Detail tangga arsitektural', width: 900, height: 1200, ratio: 0.75 },
      { name: 'ruang-serbaguna', caption: 'Ruang Serbaguna Lantai Atas dengan Ventilasi Lebar', alt: 'Ruang serbaguna lantai atas', width: 1200, height: 900, ratio: 1.33 },
      { name: 'detail-fasad', caption: 'Detail Fasad dan Shading Matahari', alt: 'Detail elemen fasad', width: 1600, height: 900, ratio: 1.78 },
    ],
  },
  {
    slug: 'markaz-al-quran',
    title: 'Markaz Al-Qur\'an',
    category: 'Institusional / Pendidikan',
    size_text: '480 m²',
    style_text: 'Contemporary Islamic Interior',
    duration_text: '8 Bulan',
    location: 'Indonesia',
    client_name: 'Yayasan Pendidikan',
    year: 2024,
    published: true,
    featured: true,
    sort_order: 4,
    summary: 'Pusat pembelajaran dan studi Al-Qur\'an dengan atmosfer ruang khusyuk, koridor beraksen lengkung, dan material akustik alami.',
    description: 'Desain fasilitas edukasi keislaman yang menyeimbangkan kebutuhan ruang belajar intensif, aula serbaguna, dan perpustakaan literatur. Bahasa desain menerapkan geometri kontemporer terinspirasi arsitektur Islam klasik dengan perlakuan pencahayaan teduh dan ventilasi silang tenang.',
    problem: 'Menciptakan ruang belajar yang hening dan khusyuk di tengah lingkungan yang padat, dengan tetap memenuhi standar kenyamanan termal dan akustik alami.',
    solution: 'Zonasi koridor penyangga sebagai peredam kebisingan luar, pemilihan material kayu berongga untuk akustik, serta tata bukaan kisi vertikal penyaring cahaya matahari langsung.',
    targetMediaCount: 8,
    baseColor: [225, 220, 210], // Warm ivory marble
    mediaSpecs: [
      { name: 'ruang-utama', caption: 'Aula Utama Pembelajaran dengan Pencahayaan Tidak Langsung', alt: 'Aula utama Markaz Al-Quran', width: 1600, height: 900, ratio: 1.78 },
      { name: 'koridor-aksen', caption: 'Koridor Sirkulasi dengan Aksen Lengkung Geometris', alt: 'Koridor arsitektur Islam kontemporer', width: 900, height: 1200, ratio: 0.75 },
      { name: 'ruang-halaqah-1', caption: 'Ruang Kelas Halaqah dengan Meja Rendah Ergonomis', alt: 'Ruang halaqah pembelajaran', width: 1200, height: 900, ratio: 1.33 },
      { name: 'ruang-halaqah-2', caption: 'Perspektif Sisi Ruang Belajar Kelompok Kecil', alt: 'Ruang kelas kecil', width: 1200, height: 900, ratio: 1.33 },
      { name: 'area-wudhu', caption: 'Area Wudhu dengan Material Batu Alam Tahan Air', alt: 'Area wudhu minimalis bersih', width: 900, height: 1200, ratio: 0.75 },
      { name: 'perpustakaan', caption: 'Sudut Baca Literatur dan Rak Kayu Terintegrasi', alt: 'Perpustakaan literatur Al-Quran', width: 1200, height: 900, ratio: 1.33 },
      { name: 'detail-mihrab', caption: 'Detail Dinding Mihrab dengan Kaligrafi Terukur', alt: 'Detail mihrab kontemporer', width: 1000, height: 1000, ratio: 1.0 },
      { name: 'tampak-luar', caption: 'Perspektif Fasad Bangunan dari Halaman Depan', alt: 'Fasad Markaz Al-Quran', width: 1600, height: 900, ratio: 1.78 },
    ],
  },
  {
    slug: 'chuk-commercial-concept',
    title: 'CHUK Commercial Concept',
    category: 'Komersial',
    size_text: '180 m²',
    style_text: 'Contemporary Tropical Commercial',
    duration_text: '4 Bulan',
    location: 'Indonesia',
    client_name: 'Concept Development',
    year: 2025,
    published: true,
    featured: false,
    sort_order: 5,
    summary: 'Konsep desain ritel komersial berkarakter tropis modern dengan transparansi visual maksimal ke area display produk.',
    description: 'Eksplorasi konsep ruang niaga kontemporer yang memaksimalkan interaksi pengunjung melalui etalase transparan dan material alami. Rancangan menonjolkan fleksibilitas display dan alur sirkulasi belanja yang ramah pengunjung.',
    problem: 'Tuntutan visibilitas display yang tinggi dari arah pejalan kaki sembari menjaga kesejukan ruang interior tanpa beban AC yang boros energi.',
    solution: 'Fasad double-glazing berpadu kanopi peneduh kantilever baja dan lubang ventilasi atas untuk pembuangan akumulasi udara panas.',
    targetMediaCount: 4,
    baseColor: [215, 205, 195], // Terracotta stone
    mediaSpecs: [
      { name: 'fasad-toko', caption: 'Perspektif Fasad Ritel Komersial dari Trotoar', alt: 'Fasad ritel CHUK Commercial Concept', width: 1600, height: 900, ratio: 1.78 },
      { name: 'interior-display', caption: 'Area Display Produk Utama dengan Rak Modular', alt: 'Area display interior ritel', width: 1200, height: 900, ratio: 1.33 },
      { name: 'meja-kasir', caption: 'Counter Kasir dan Detail Pencahayaan Aksen', alt: 'Meja kasir minimalis', width: 1200, height: 900, ratio: 1.33 },
      { name: 'detail-branding', caption: 'Integrasi Signage dan Shading Kayu Vertikal', alt: 'Detail fasad ritel dan signage', width: 1600, height: 900, ratio: 1.78 },
    ],
  },
  {
    slug: 'kitchen-interior',
    title: 'Kitchen Interior',
    category: 'Interior',
    size_text: '24 m²',
    style_text: 'Modern Warm Minimalist',
    duration_text: '1.5 Bulan',
    location: 'Indonesia',
    client_name: 'Residential Client',
    year: 2025,
    published: true,
    featured: false,
    sort_order: 6,
    summary: 'Penataan interior dapur bersih dengan integrasi kabinet kayu tersembunyi, top table kuarsa terang, dan pencahayaan fungsional.',
    description: 'Renovasi dapur bersih hunian yang memprioritaskan alur kerja kitchen working triangle (penyimpanan, pencucian, dan persiapan). Desain menghadirkan nuansa hangat melalui pemilihan veneer kayu oak berpadu marmer kuarsa putih bertekstur lembut.',
    problem: 'Area dapur yang memanjang dengan lebar terbatas dan kebutuhan penyimpanan peralatan masak yang cukup masif.',
    solution: 'Kabinet vertikal penuh hingga plafon dengan pegangan tersembunyi (handleless) untuk memaksimalkan kapasitas simpan tanpa kesan visual sempit.',
    targetMediaCount: 6,
    baseColor: [230, 220, 205], // Warm oak wood tone
    mediaSpecs: [
      { name: 'kitchen-island', caption: 'Perspektif Utama Kitchen Island dan Breakfast Counter', alt: 'Kitchen interior island counter', width: 1600, height: 900, ratio: 1.78 },
      { name: 'kabinet-dinding', caption: 'Jajaran Kabinet Vertikal Handleless Kayu Oak', alt: 'Kabinet dapur bersih kayu oak', width: 1200, height: 900, ratio: 1.33 },
      { name: 'area-kompor', caption: 'Area Persiapan Masak dan Backsplash Kuarsa Putih', alt: 'Detail backsplash dan kompor tanam', width: 900, height: 1200, ratio: 0.75 },
      { name: 'sudut-penyimpanan', caption: 'Penyimpanan Sudut Tarik (Pull-out Corner Organizer)', alt: 'Detail sistem penyimpanan dapur', width: 1200, height: 900, ratio: 1.33 },
      { name: 'detail-hardware', caption: 'Detail Sambungan Kayu dan Lampu Strip LED Bawah Kabinet', alt: 'Detail pencahayaan dapur bersih', width: 1000, height: 1000, ratio: 1.0 },
      { name: 'perspektif-keseluruhan', caption: 'Sudut Pandang Menyeluruh dari Ruang Makan', alt: 'Perspektif dapur dan ruang makan', width: 1600, height: 900, ratio: 1.78 },
    ],
  },
]

// 5. Execute Seeding Function
async function seedPortfolio() {
  console.log('\n[1] Synchronizing 6 Template Projects in Database...')

  for (const p of templateProjects) {
    // Check if project exists by slug
    const { data: existing } = await client
      .from('projects')
      .select('id, slug, title')
      .eq('slug', p.slug)
      .maybeSingle()

    let projectId = existing?.id

    const projectPayload = {
      title: p.title,
      slug: p.slug,
      category: p.category,
      size_text: p.size_text,
      style_text: p.style_text,
      duration_text: p.duration_text,
      location: p.location,
      client_name: p.client_name,
      year: p.year,
      summary: p.summary,
      description: p.description,
      problem: p.problem,
      solution: p.solution,
      published: p.published,
      featured: p.featured,
      sort_order: p.sort_order,
    }

    if (existing) {
      const { error: upErr } = await client
        .from('projects')
        .update(projectPayload)
        .eq('id', existing.id)

      if (upErr) {
        console.error(`  FAIL updating project ${p.slug}:`, upErr.message)
        continue
      }
      console.log(`  UPDATED project: "${p.title}" (ID: ${existing.id})`)
    } else {
      const { data: inserted, error: inErr } = await client
        .from('projects')
        .insert(projectPayload)
        .select('id')
        .single()

      if (inErr || !inserted) {
        console.error(`  FAIL inserting project ${p.slug}:`, inErr?.message)
        continue
      }
      projectId = inserted.id
      console.log(`  CREATED project: "${p.title}" (ID: ${projectId})`)
    }

    // Check existing media for this project
    const { data: existingMedia } = await client
      .from('project_media')
      .select('id, storage_path, is_cover')
      .eq('project_id', projectId)

    const existingCount = existingMedia?.length ?? 0
    const hasCover = existingMedia?.some(m => m.is_cover) ?? false

    console.log(`  Project media: ${existingCount} existing items (Cover defined: ${hasCover})`)

    // Only upload supplemental media if existing media count is less than target
    if (p.mediaSpecs && p.mediaSpecs.length > 0) {
      let currentOrder = Math.max(0, ...((existingMedia || []).map((_, i) => i + 1)))

      for (let i = 0; i < p.mediaSpecs.length; i++) {
        // If we already have enough media, skip additional generation
        if (existingCount + i >= p.targetMediaCount && hasCover) {
          break
        }

        const spec = p.mediaSpecs[i]
        const filename = `${Date.now()}_${spec.name}.png`
        const storagePath = `projects/${projectId}/${filename}`

        // Generate raster PNG buffer
        const pngBuffer = createArchitecturalPng(spec.width, spec.height, p.baseColor)

        // Upload to Supabase Storage
        const { error: upErr } = await client.storage
          .from('portfolio-images')
          .upload(storagePath, pngBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false,
          })

        if (upErr) {
          console.error(`    FAIL uploading image ${storagePath}:`, upErr.message)
          continue
        }

        // Verify Storage URL returns HTTP 200
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/portfolio-images/${storagePath}`
        const verifyRes = await fetch(publicUrl, { method: 'HEAD' })
        if (verifyRes.status !== 200) {
          console.error(`    FAIL URL verification returned ${verifyRes.status} for: ${publicUrl}`)
          // Clean up failed upload
          await client.storage.from('portfolio-images').remove([storagePath])
          continue
        }

        // Determine cover: first item is cover if no cover exists yet
        const isCover = !hasCover && i === 0

        // Insert project_media record
        currentOrder++
        const { error: dbMediaErr } = await client.from('project_media').insert({
          project_id: projectId,
          storage_path: storagePath,
          alt_text: spec.alt,
          caption: spec.caption,
          width: spec.width,
          height: spec.height,
          aspect_ratio: spec.ratio,
          sort_order: currentOrder,
          is_cover: isCover,
        })

        if (dbMediaErr) {
          console.error(`    FAIL inserting project_media for ${storagePath}:`, dbMediaErr.message)
          // Clean up orphan file from storage
          await client.storage.from('portfolio-images').remove([storagePath])
        } else {
          console.log(`    UPLOADED & LINKED [${isCover ? 'COVER' : 'GALLERY'}]: ${spec.name} (${spec.width}x${spec.height})`)
        }
      }
    }
  }

  console.log('\n' + '='.repeat(65))
  console.log('TEMPLATE SEEDING COMPLETED SUCCESSFULLY')
  console.log('='.repeat(65))
}

seedPortfolio().catch(err => {
  console.error('Fatal seed error:', err)
  process.exit(1)
})
