import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const browser = await chromium.launch({ channel: 'chromium' })
const results = []
try {
  for (const [width, height] of [[320,568],[360,640],[375,667],[390,844],[393,852],[430,932],[667,375]]) {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true })
    await page.goto(process.env.E2E_BASE_URL || 'http://localhost:3100')
    await page.locator('.masonry-item').first().click()
    await page.locator('.drawer-content').waitFor()
    await page.waitForTimeout(600)
    const cdp = await page.context().newCDPSession(page)
    const handle = await page.locator('.drawer-handle').boundingBox()
    const x = handle.x + handle.width / 2, y = handle.y + handle.height / 2
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let i=1;i<=15;i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y-(y-35)*i/15 }] })
      await page.waitForTimeout(30)
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(600)
    results.push({width,height, nodes: await page.locator('.drawer-viewport,.drawer-popup,.drawer-handle,.drawer-content,.drawer-content > div').evaluateAll(nodes=>nodes.map(n=>({class:n.className, height:n.getBoundingClientRect().height,top:n.getBoundingClientRect().top,clientHeight:n.clientHeight,scrollHeight:n.scrollHeight,overflow:getComputedStyle(n).overflowY}))), scroll:await page.locator('.drawer-content').evaluate(n=>{n.scrollTop=n.scrollHeight;return n.scrollTop})})
    await page.close()
  }
  await mkdir('test-results',{recursive:true})
  await writeFile('test-results/drawer-baseline.json',JSON.stringify(results,null,2))
  console.log(JSON.stringify(results,null,2))
} finally { await browser.close() }
