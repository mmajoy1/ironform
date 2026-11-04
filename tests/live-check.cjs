const {chromium} = require('@playwright/test');
const assert = require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch();
  try {
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
    const page=await context.newPage(),errors=[],failed=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});
    const url=process.argv[2]||'https://mmajoy1.github.io/ironform/';
    await page.goto(url,{waitUntil:'networkidle'});
    await page.locator('.hero').waitFor();
    assert.equal(await page.locator('.preview-tag').textContent(),'FORGE');
    assert.equal(await page.locator('.app-shell').count(),1);
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await page.screenshot({path:'evidence/forge-live-mobile.png',fullPage:true,animations:'disabled'});
    await page.locator('[data-action="start"]').click();
    await page.locator('#weightInput').fill('235');
    await page.locator('#repsInput').fill('6');
    await page.getByRole('button',{name:'Log working set'}).click();
    await page.locator('.timer').waitFor();
    await page.reload({waitUntil:'networkidle'});
    assert.match(await page.locator('.log').textContent(),/235 lb/);
    assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await page.locator('.timer').waitFor();
    assert.match(await page.locator('.log').textContent(),/235 lb/);
    await page.locator('[data-view="progress"]').click();
    assert.match(await page.locator('.history-list').textContent(),/235 lb/);
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    console.log(JSON.stringify({url,viewport:'390x844 DPR 1',shell:'Forge',logging:'passed',reload:'passed',offline:'passed',progress:'passed',errors,failed}));
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
