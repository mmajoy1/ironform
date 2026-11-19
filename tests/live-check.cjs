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
    assert.equal(await page.locator('#setForm').count(),0);
    assert.ok(await page.locator('.workout-card').count()>0);
    assert.match(await page.locator('.days button').first().textContent(),/Mo/);
    assert.match(await page.locator('.days button').last().textContent(),/Su/);
    await page.locator('.tabs [data-view="week"]').click();
    assert.equal(await page.locator('.week-item').count(),7);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('.week-item').count(),7);
    assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.reload();
    await page.locator('.week-item').first().waitFor();
    await page.locator('.tabs [data-view="today"]').click();
    assert.ok(await page.locator('.workout-card').count()>0);
    await page.locator('.tabs [data-view="checkin"]').click();
    assert.ok(await page.locator('.review-locked,#checkinForm').count()===1);
    assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    console.log(JSON.stringify({url,viewport:'390x844 DPR 1',shell:'Forge mornings',fixedPrescriptions:'passed',mondaySunday:'passed',reload:'passed',offline:'passed',checkin:'passed',errors,failed}));
    await context.close();
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
