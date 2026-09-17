import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)

async function projects() {
  const { data, error } = await supabase.from('projects').select('*, project_media(*)').eq('published', true).order('sort_order').order('created_at', { ascending: false })
  if (error) throw error
  expect(data.length, 'Live QA requires published projects').toBeGreaterThan(1)
  return data
}

async function swipe(page: Page, x: number, start: number, end: number) {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] })
  for (let step = 1; step <= 12; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * step / 12 }] })
    await page.waitForTimeout(22)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await cdp.detach()
  await page.waitForTimeout(450)
}

const sizes = [[320,568],[360,640],[375,667],[390,844],[393,852],[430,932],[667,375],[1024,768],[1280,800],[1440,900],[1920,1080]]
for (const [width, height] of sizes) {
  test.describe(`${width}x${height}`, () => {
    test.use({ viewport: { width, height }, hasTouch: width < 768, isMobile: width < 768 })
    test('drawer scroll, snaps, gallery, focus and history', async ({ page, browserName }) => {
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('response', response => { if (response.request().resourceType() === 'image' && response.status() >= 400) errors.push(`image HTTP ${response.status()}`) })
      const data = await projects()
      const longest = [...data].sort((a,b) => b.project_media.length - a.project_media.length)[0]
      await page.goto('/')
      await page.evaluate(() => history.replaceState({ ...history.state, unrelated: 'preserve' }, '', location.href))
      const trigger = page.locator(`[id="project-trigger-${longest.slug}"]`)
      await trigger.scrollIntoViewIfNeeded()
      await trigger.focus()
      await page.keyboard.press('Enter')
      const popup = page.getByRole('dialog')
      await expect(popup).toBeVisible()
      await expect(popup.getByRole('heading', { name: longest.title, exact: true }).last()).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`project=${longest.slug}`))
      const scroll = page.locator('.drawer-content')
      if (width < 768) {
        await expect.poll(async () => (await popup.boundingBox())!.y / height).toBeCloseTo(0.52, 1)
        if (browserName === 'chromium') {
          const handle = (await page.locator('.drawer-handle').boundingBox())!
          await swipe(page, width * 0.25, handle.y + 20, 10)
        } else await page.getByRole('button', { name: 'Perluas panel proyek' }).click()
        await expect.poll(async () => (await popup.boundingBox())!.y / height).toBeCloseTo(0.06, 1)
      }
      await expect.poll(() => scroll.evaluate(n => n.scrollHeight > n.clientHeight)).toBe(true)
      const pageY = await page.evaluate(() => scrollY)
      if (width < 768 && browserName === 'chromium') {
        const bounds = (await scroll.boundingBox())!
        await swipe(page, width / 2, Math.min(height-30, bounds.y+bounds.height-30), bounds.y+25)
        await expect.poll(() => scroll.evaluate(n => n.scrollTop)).toBeGreaterThan(0)
        // Real continuous touch scrolling through the full gallery.
        for (let i=0;i<45;i++) {
          if (await scroll.evaluate(n => n.scrollTop+n.clientHeight >= n.scrollHeight-3)) break
          await swipe(page,width/2,height-25,bounds.y+25)
        }
      } else if (width < 768 && browserName === 'webkit') {
        // Playwright WebKit cannot dispatch native touch drags or mobile wheel.
        // Verify the same real scroll owner through keyboard scrolling.
        await scroll.focus()
        await page.keyboard.press('Control+End')
        await page.keyboard.press('End')
      } else {
        await scroll.hover()
        for (let i=0;i<35;i++) {
          await page.mouse.wheel(0,650)
          await page.waitForTimeout(60)
          if (await scroll.evaluate(n => n.scrollTop+n.clientHeight >= n.scrollHeight-3)) break
        }
      }
      await expect.poll(() => scroll.evaluate(n => Math.abs(n.scrollHeight-n.clientHeight-n.scrollTop))).toBeLessThan(4)
      await expect(page.getByTestId('adjacent-projects')).toBeInViewport()
      expect(await page.evaluate(() => scrollY)).toBe(pageY)
      if (width < 768 && browserName === 'chromium') {
        const bounds = (await scroll.boundingBox())!
        for (let i=0;i<45;i++) {
          if (await scroll.evaluate(n=>n.scrollTop<=1)) break
          await swipe(page,width/2,bounds.y+25,height-25)
        }
      } else {
        await scroll.focus()
        await page.keyboard.press('Control+Home')
        await page.keyboard.press('Home')
      }
      await expect.poll(()=>scroll.evaluate(n=>n.scrollTop)).toBeLessThan(2)
      await expect(popup.locator('[data-media-id]')).toHaveCount(longest.project_media.length)
      for (const image of await popup.locator('img').all()) {
        await image.scrollIntoViewIfNeeded()
        await expect.poll(() => image.evaluate(n => (n as HTMLImageElement).naturalWidth)).toBeGreaterThan(0)
      }
      for (const field of ['category','size_text','style_text','duration_text','location','client_name','summary','description','problem','solution']) {
        if (longest[field]) await expect(scroll).toContainText(longest[field])
      }
      // Reach and click actual adjacent navigation; snap must remain expanded.
      await page.getByTestId('adjacent-projects').getByRole('button').first().click()
      if (width < 768) await expect.poll(async () => (await popup.boundingBox())!.y / height).toBeCloseTo(0.06, 1)
      await expect.poll(() => scroll.evaluate(n => n.scrollTop)).toBe(0)
      await page.goBack()
      await expect(popup).toBeHidden()
      await expect(trigger).toBeFocused()
      await page.goForward()
      await expect(popup).toBeVisible()
      if (width < 768) {
        await expect(page.getByRole('button',{name:'Perluas panel proyek'})).toBeVisible()
        await page.getByRole('button',{name:'Perluas panel proyek'}).click()
        await page.getByRole('button',{name:'Perkecil panel proyek'}).click()
        await page.getByRole('button',{name:'Perluas panel proyek'}).click()
      }
      await page.getByRole('button', {name:'Tutup proyek'}).click()
      await expect(popup).toBeHidden()
      await expect(trigger).toBeFocused()
      await trigger.click()
      await expect(popup).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(popup).toBeHidden()
      await expect(trigger).toBeFocused()
      await trigger.click()
      await expect(popup).toBeVisible()
      await page.waitForTimeout(450)
      await page.mouse.click(5,5)
      await expect(popup).toBeHidden()
      if (width < 768 && browserName === 'chromium') {
        await trigger.click()
        await expect(popup).toBeVisible()
        await page.waitForTimeout(450)
        const handle = (await page.locator('.drawer-handle').boundingBox())!
        await swipe(page,width*0.25,handle.y+20,height-2)
        await expect(popup).toBeHidden()
      }
      expect(await page.evaluate(() => history.state.unrelated)).toBe('preserve')
      await page.goto(`/?project=${longest.slug}#projects`)
      await expect(popup).toBeVisible()
      // Adjacent navigation from a direct link must not turn close into history.back().
      await page.getByTestId('adjacent-projects').getByRole('button').first().click()
      await page.getByRole('button',{name:'Tutup proyek'}).click()
      await expect(popup).toBeHidden()
      await expect(page).toHaveURL(/\/#projects$/)
      expect(errors).toEqual([])
    })
  })
}

test('server HTML, keyboard trap, filters, footer and reduced motion', async ({ page, browser }) => {
  const context = await browser.newContext()
  // React's inline streaming script places server HTML in the page. Block the
  // external application bundles to assert visibility before React hydration.
  await context.route('**/_next/**/*.js', route => route.abort())
  const htmlPage = await context.newPage()
  await htmlPage.goto(process.env.E2E_BASE_URL || 'http://localhost:3100')
  await expect(htmlPage.locator('.masonry-item').first()).toBeVisible()
  await expect(htmlPage.getByRole('heading',{level:1})).toBeVisible()
  await context.close()
  await page.emulateMedia({ reducedMotion:'reduce' })
  await page.goto('/')
  await expect(page.locator('.custom-cursor')).toHaveCount(0)
  await page.locator('.masonry-item').first().click()
  const popup = page.getByRole('dialog')
  for(let i=0;i<12;i++) {
    await page.keyboard.press('Tab')
    expect(await popup.evaluate(n=>n.contains(document.activeElement))).toBe(true)
  }
  await page.keyboard.press('Escape')
  const navigation = page.getByRole('navigation',{name:'Footer navigation'})
  for(const label of ['Proyek','Tentang','Layanan','Kontak']) {
    await navigation.getByRole('link',{name:label,exact:true}).click()
    await expect(page).toHaveURL(/\/#(projects|about|services|contact)$/)
  }
  const canonical = new URL((await page.locator('link[rel="canonical"]').getAttribute('href'))!)
  expect(canonical.pathname).toBe('/')
  expect(canonical.search).toBe('')
  const category = page.locator('#projects button[aria-pressed]').nth(1)
  await category.click()
  await expect(category).toHaveAttribute('aria-pressed','true')
  await page.getByRole('button',{name:'Semua',exact:true}).click()
})
