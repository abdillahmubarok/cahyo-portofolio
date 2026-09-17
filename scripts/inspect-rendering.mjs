import { chromium } from '@playwright/test'
const browser=await chromium.launch()
try {
  const page=await browser.newPage({javaScriptEnabled:false})
  await page.goto(process.env.E2E_BASE_URL || 'http://localhost:3102')
  console.log(await page.locator('.masonry-item').first().evaluate(n=>{
    const nodes=[]
    for(let e=n;e;e=e.parentElement) nodes.push({tag:e.tagName,id:e.id,hidden:e.hidden,style:e.getAttribute('style'),display:getComputedStyle(e).display,visibility:getComputedStyle(e).visibility,rect:e.getBoundingClientRect().toJSON()})
    return nodes
  }))
}finally{await browser.close()}
