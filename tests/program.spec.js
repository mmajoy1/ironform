const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
test.beforeEach(async({page})=>{await page.addInitScript(()=>{if(!localStorage.getItem('ironform:v5:start'))localStorage.setItem('ironform:v5:start','2026-11-03')});});
test('six weeks, effort targets, reduced sets, valid calendar over DST',async({page})=>{
 await page.goto('/refresh.html');
 const data=await page.evaluate(()=>({days:IRONFORM_DATA,leap:IRONFORM_V5.build('2028-02-28'),bad:IRONFORM_V5.valid('2026-02-30')}));
 expect(data.days).toHaveLength(42);expect(data.days[41].date).toBe('2026-12-14');expect(data.leap[1].date).toBe('2028-02-29');expect(data.bad).toBe(false);
 for(let w=0;w<6;w++){expect(data.days.slice(w*7,w*7+7).filter(d=>d.lift)).toHaveLength(4);}
 expect(data.days[21].ex[0][2]).toBe('2 × 5–8');expect(data.days[21].ex[0][1]).toContain('RIR 4');
 expect(data.days[17].ex[0][1]).toContain('1-sec pause');expect(data.days[31].ex[4][0]).toBe('Fat Bell hammer curl');
});
test('mobile navigation, notes persistence, previous week, date settings and keyboard',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/refresh.html#2026-11-03');
 await expect(page.getByRole('heading',{name:'Upper · Strength'})).toBeVisible();
 await expect(page.locator('#prevBtn')).toBeDisabled();
 await page.locator('#sessionNotes').fill('Bench 135 × 8, 8, 7 · RIR 3 <keep>');await page.reload();
 await expect(page.locator('#sessionNotes')).toHaveValue('Bench 135 × 8, 8, 7 · RIR 3 <keep>');
 await page.getByRole('button',{name:'W2',exact:true}).click();await expect(page.locator('#previousNotes')).toContainText('<keep>');
 await page.locator('#nextBtn').click();await expect(page.getByRole('heading',{name:'Lower · Strength'})).toBeVisible();
 await page.locator('#picker').selectOption('2');await expect(page.getByRole('heading',{name:'Recover · Walk + Mobility'})).toBeVisible();
 await page.getByRole('button',{name:'SCRIPTURE',exact:true}).click();await expect(page.locator('#apiKey')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#overlay')).not.toBeVisible();await expect(page.locator('#scriptureBtn')).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.locator('#overlay')).toBeVisible();await page.locator('#syncBtn').focus();await page.keyboard.press('Tab');await expect(page.locator('#closeBtn')).toBeFocused();await page.keyboard.press('Escape');
 await page.locator('.program summary').focus();await page.keyboard.press('Space');await expect(page.locator('#startDate')).toBeVisible();
 await page.locator('#startDate').fill('2027-01-04');await page.locator('#startProgram').click();await expect(page.locator('#cycleNotice')).toContainText('not started');
 await page.locator('.program summary').click();await page.locator('#startDate').fill('2026-11-03');await page.locator('#startProgram').click();await page.locator('#picker').selectOption('0');await expect(page.locator('#sessionNotes')).toHaveValue('Bench 135 × 8, 8, 7 · RIR 3 <keep>');
 await page.locator('#picker').selectOption('41');await expect(page.locator('#nextBtn')).toBeDisabled();
 for(const width of [320,390,1280,390]){await page.setViewportSize({width,height:844});await page.getByRole('button',{name:'W1',exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 expect(errors).toEqual([]);
});
test('visual captures and hit targets',async({page})=>{
 fs.mkdirSync('evidence',{recursive:true});
 await page.goto('/refresh.html#2026-11-03');
 await page.screenshot({path:'evidence/mobile.png',fullPage:true});
 expect(await page.locator('[data-week="4"]').evaluate(el=>{const r=el.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===el})).toBe(true);
 await page.getByRole('button',{name:'W4',exact:true}).click();await page.screenshot({path:'evidence/reload.png',fullPage:true});
 await page.setViewportSize({width:320,height:800});await page.screenshot({path:'evidence/narrow.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});await page.getByRole('button',{name:'W1',exact:true}).click();await page.screenshot({path:'evidence/desktop.png',fullPage:true});
});
test('default app, offline archive separation, and existing Scripture cache',async({page,context})=>{
 await page.addInitScript(()=>localStorage.setItem('ironform:nkjvCache',JSON.stringify({'Proverbs 16:3':{text:'Cached Scripture test fixture',at:Date.now()}})));
 await page.goto('/#2026-11-03');await expect(page.locator('#verseText')).toHaveText('Cached Scripture test fixture');
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.reload();
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await page.locator('.history-link').click();await expect(page.locator('.brand strong')).toContainText('IV');
 await page.locator('#closeBtn').click();await page.screenshot({path:'evidence/previous-mobile.png',fullPage:true});
 await context.setOffline(true);
 await page.goto('/index.html#2026-11-03');await expect(page.locator('h1')).toHaveText('Upper · Strength');
 await page.goto('/archive.html');await expect(page.locator('.brand strong')).toContainText('IV');
 await context.setOffline(false);
});
test('first visit start persists across calendar days and Today resolves locally',async({browser})=>{
 const context=await browser.newContext({timezoneId:'America/New_York'}),page=await context.newPage();
 await page.clock.install({time:new Date('2026-11-03T12:00:00-05:00')});
 await page.goto('http://127.0.0.1:8767/');
 expect(await page.evaluate(()=>localStorage.getItem('ironform:v5:start'))).toBe('2026-11-03');
 await page.clock.setSystemTime(new Date('2026-11-04T12:00:00-05:00'));await page.reload();
 await page.locator('#todayBtn').click();await expect(page.locator('h1')).toHaveText('Lower · Strength');
 expect(await page.locator('#startDate').inputValue()).toBe('2026-11-03');
 await page.clock.setSystemTime(new Date('2027-01-01T12:00:00-05:00'));await page.locator('#todayBtn').click();await expect(page.locator('#cycleNotice')).toContainText('block is complete');
 await context.close();
});
