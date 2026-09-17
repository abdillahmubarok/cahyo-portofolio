import { test, expect } from '@playwright/test'

test('mouse capability, cached bounds, dynamic reduced motion and hybrid input', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'CDP metrics and touch dispatch require Chromium')
  await page.goto('/')
  const card=page.locator('.masonry-item').first()
  await card.scrollIntoViewIfNeeded()
  await expect(page.locator('.custom-cursor')).toHaveCount(1)
  await expect(card.locator('[data-parallax="full"]')).toHaveCount(1)
  const rect=(await card.boundingBox())!
  await page.evaluate(()=>{
    const original=Element.prototype.getBoundingClientRect
    Object.assign(window,{parallaxReads:0})
    Element.prototype.getBoundingClientRect=function(){
      if(this.matches('[data-parallax="full"]')) Reflect.set(window,'parallaxReads',Reflect.get(window,'parallaxReads')+1)
      return original.call(this)
    }
  })
  const cdp=await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')
  const before=await cdp.send('Performance.getMetrics')
  await page.mouse.move(rect.x+30,rect.y+30)
  for(let i=0;i<120;i++) await page.mouse.move(rect.x+30+i%(Math.floor(rect.width)-60),rect.y+40+i%80)
  const reads=await page.evaluate(()=>Reflect.get(window,'parallaxReads'))
  expect(reads).toBeLessThanOrEqual(2)
  const after=await cdp.send('Performance.getMetrics')
  await testInfo.attach('pointer-performance.json',{body:JSON.stringify({reads, before:before.metrics,after:after.metrics},null,2),contentType:'application/json'})
  await page.screenshot({path:testInfo.outputPath('cursor-normal.png')})
  await page.locator('.custom-cursor').evaluate(n=>(n as HTMLElement).style.mixBlendMode='difference')
  await page.screenshot({path:testInfo.outputPath('cursor-difference-comparison.png')})
  await page.locator('.custom-cursor').evaluate(n=>(n as HTMLElement).style.mixBlendMode='normal')
  await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+25,y:rect.y+25}]})
  await expect(page.locator('.custom-cursor')).toHaveCSS('opacity','0')
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
  await page.emulateMedia({reducedMotion:'reduce'})
  await expect(page.locator('.custom-cursor')).toHaveCount(0)
  await expect(page.locator('[data-parallax="full"]')).toHaveCount(0)
  await page.evaluate(()=>{
    const original=Element.prototype.scrollIntoView
    Object.assign(window,{scrollBehaviors:[]})
    Element.prototype.scrollIntoView=function(options){
      Reflect.get(window,'scrollBehaviors').push(typeof options==='object'?options.behavior:options)
      original.call(this,options)
    }
  })
  await page.getByRole('navigation',{name:'Navigasi utama',exact:true}).getByRole('link',{name:'Tentang'}).click()
  expect(await page.evaluate(()=>Reflect.get(window,'scrollBehaviors'))).not.toContain('smooth')
})

test('slow 4G with high latency retains server content and usable gallery', async ({ page,browserName })=>{
  test.skip(browserName!=='chromium','CDP network throttling requires Chromium')
  const cdp=await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:400,downloadThroughput:200000,uploadThroughput:75000})
  const errors:string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  page.on('response',response=>{if(response.request().resourceType()==='image'&&response.status()>=400)errors.push(`image ${response.status()}`)})
  await page.goto('/',{waitUntil:'domcontentloaded'})
  await expect(page.getByRole('heading',{level:1})).toBeVisible()
  await page.locator('.masonry-item').first().click()
  const dialog=page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  for(const image of await dialog.locator('img').all()) {
    await image.scrollIntoViewIfNeeded()
    await expect.poll(()=>image.evaluate(n=>(n as HTMLImageElement).naturalWidth),{timeout:45000}).toBeGreaterThan(0)
  }
  expect(errors).toEqual([])
})

test.describe('touch viewport resize',()=>{
  test.use({viewport:{width:390,height:844},hasTouch:true,isMobile:true})
  test('expanded frame adapts to changing viewport height',async({page})=>{
    await page.goto('/')
    await page.locator('.masonry-item').first().click()
    await page.getByRole('button',{name:'Perluas panel proyek'}).click()
    for(const height of [650,844]) {
      await page.setViewportSize({width:390,height})
      await expect.poll(async()=>(await page.getByRole('dialog').boundingBox())!.y/height).toBeCloseTo(0.06,1)
      await page.locator('.drawer-content').focus()
      await page.keyboard.press('Control+End')
      await page.keyboard.press('End')
      await expect(page.getByTestId('adjacent-projects')).toBeInViewport()
    }
    await expect(page.locator('.custom-cursor')).toHaveCount(0)
    await expect(page.locator('[data-parallax="full"]')).toHaveCount(0)
  })
})
