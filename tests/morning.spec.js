import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {mondayOf,dateAt,todayIndex,getDay,estimatedMinutes} from '../forge/program.js';
import {defaults,validWeekly,nextWeights,workoutFor,readWeekly,WEEKLY_KEY} from '../forge/weekly.js';
import {dailyChapter} from '../forge/readings.js';
const seed=()=>({...defaults(),start:'2026-11-02',lastOpenedDate:'2026-11-22'});
test.beforeEach(async({page})=>{await page.clock.setFixedTime(new Date('2026-11-22T12:00:00'));});
async function start(page,hash='today/0'){
 await page.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(value));},{key:WEEKLY_KEY,value:seed()});
 await page.goto('/forge/#'+hash);
}
test('Monday calendar, fixed prescriptions, confirmed lower loads, and full-Bible rotation',()=>{
 expect(mondayOf('2026-11-19')).toBe('2026-11-16');expect(mondayOf('2026-11-22')).toBe('2026-11-16');
 expect(mondayOf('2026-11-23')).toBe('2026-11-23');expect(dateAt('2026-11-16',6)).toBe('2026-11-22');
 expect(dateAt('2028-02-28',1)).toBe('2028-02-29');expect(todayIndex('2026-11-02','2027-01-04')).toBe(63);
 for(let i=0;i<84;i++) {const day=getDay('2026-11-02',i);expect(new Date(day.date+'T12:00:00').getDay()).toBe((i+1)%7);for(const e of day.exercises){expect(e.load).not.toBeNull();expect(e.reps).toBeGreaterThan(0);expect(e).not.toHaveProperty('rir');}expect(estimatedMinutes(day)).toBeLessThanOrEqual(40);}
 expect(getDay('2026-11-02',2).exercises[0].load).toBe(62);expect(getDay('2026-11-02',5).exercises[0].load).toBe(175);
 const readings=Array.from({length:1189},(_,i)=>dailyChapter(dateAt('2026-11-02',i)));
 expect(new Set(readings.map(r=>r.book+' '+r.ch)).size).toBe(1189);expect(new Set(readings.map(r=>r.book)).size).toBe(66);
 expect(new Set(readings.slice(0,7).map(r=>r.book)).size).toBeGreaterThan(4);
});
test('weekly progression never compounds, never automatically increases lower work, and preserves deload baseline',()=>{
 const data=seed();expect(validWeekly(data)).toBe(true);
 const results={'bench-strength':{weight:205,result:'complete'},'light-rdl':{weight:175,result:'complete'},'curl-strength':{weight:70,result:'missed'}};
 const weights=nextWeights(data,0,results,'comfortable');expect(weights['bench-strength']).toBe(210);expect(weights['light-rdl']).toBe(175);expect(weights['curl-strength']).toBe(70);
 expect(nextWeights(data,0,results,'worse')['bench-strength']).toBe(205);
 data.checkins['2026-11-02']={sessions:7,back:'comfortable',time:'fits',notes:'Notebook review',results,nextWeights:weights,savedAt:'2026-11-08T12:00:00Z'};
 expect(validWeekly(data)).toBe(true);expect(nextWeights(data,0,results,'comfortable')['bench-strength']).toBe(210);
 expect(workoutFor(data,7).exercises[0].load).toBe(210);expect(workoutFor(data,0).exercises[0].load).toBe(205);
 const lighter=nextWeights(data,3,{'bench-strength':{weight:165,result:'complete'}},'comfortable');expect(lighter['bench-strength']).toBe(210);
 expect(nextWeights(data,3,{'bench-strength':{weight:165,result:'complete'}},'worse')['bench-strength']).toBe(165);
 data.checkins['2026-11-23']={...data.checkins['2026-11-02'],nextWeights:lighter};expect(workoutFor(data,28).exercises[0].load).toBe(210);
});
test('old start date aligns to Monday while previous set records and Scripture credentials stay untouched',async({page})=>{
 const old=JSON.stringify({version:1,start:'2026-11-03',sessions:{keep:'untouched'},timer:null,increment:5});
 await page.addInitScript(old=>{localStorage.setItem('ironform:forge:v1',old);localStorage.setItem('ironform:bibleKey','fixture-only');},old);
 await page.route('https://rest.api.bible/**',route=>route.fulfill({status:503,json:{}}));
 await page.goto('/forge/#today/0');await expect(page.locator('.days button').first()).toContainText('Mo');await expect(page.locator('.hero .kicker')).toContainText('Sunday');
 expect(await page.evaluate(()=>localStorage.getItem('ironform:forge:v1'))).toBe(old);
 expect(await page.evaluate(()=>localStorage.getItem('ironform:bibleKey'))).toBe('fixture-only');
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).start,WEEKLY_KEY)).toBe('2026-11-02');
 await expect(page.locator('#setForm')).toHaveCount(0);await expect(page.locator('.effort')).toHaveCount(0);
 await expect(page.locator('#screen')).not.toContainText('reps in reserve');await expect(page.locator('#screen')).not.toContainText('logged');
});
test('Sunday notebook check-in updates Monday once, remains editable, and earlier days are gated',async({page})=>{
 await start(page,'checkin/20');await page.locator('#backReview').selectOption('comfortable');await page.locator('#timeReview').selectOption('fits');
 await page.locator('[data-result="bench-strength"]').selectOption('complete');await expect(page.locator('[data-next="bench-strength"]')).toHaveText('170 lb'); // upcoming deload
 await page.locator('#reviewNotes').fill('Good week. Keep <notes> literal.');
 await page.getByRole('button',{name:'Save next week’s weights'}).click();await expect(page.locator('#reviewStatus')).toContainText('Saved.');
 await page.reload();await expect(page.locator('#reviewNotes')).toHaveValue('Good week. Keep <notes> literal.');
 await page.getByRole('button',{name:'Update next week’s weights'}).click();
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).checkins['2026-11-16'].nextWeights['bench-strength'],WEEKLY_KEY)).toBe(210);
 await page.locator('[data-action="nextWeek"]').click();await expect(page.locator('#checkinForm')).toHaveCount(0);await expect(page.locator('.review-locked')).toContainText('See you Sunday');
 await page.locator('[data-day="21"]').click();await expect(page.locator('.workout-card').first()).toContainText('170');
});
test('workout, week, check-in, settings and mobile layout work without daily data entry',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await start(page);
 fs.mkdirSync('evidence',{recursive:true});await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:'evidence/morning-workout.png',fullPage:true,animations:'disabled'});
 await expect(page.locator('.workout-card').first()).toContainText('205');
 await page.locator('.exercise-detail summary').first().click();await expect(page.locator('.exercise-detail details').first()).toHaveAttribute('open','');
 await page.locator('#settingsButton').focus();await page.keyboard.press('Enter');await expect(page.locator('#settingsDialog')).toBeVisible();
 await page.locator('#startInput').fill('2026-11-03');await page.getByRole('button',{name:'Save settings'}).click();await expect(page.locator('#settingsStatus')).toContainText('Choose a Monday');
 await page.locator('#startInput').fill('2026-11-02');await page.locator('#minutesInput').selectOption('30');await page.getByRole('button',{name:'Save settings'}).click();
 await page.locator('.tabs [data-view="week"]').click();await expect(page.locator('.week-item')).toHaveCount(7);await page.screenshot({path:'evidence/morning-week.png',fullPage:true,animations:'disabled'});
  await page.locator('.days [data-day="20"]').click();await expect(page.locator('.sunday-card')).toBeVisible();await page.locator('.sunday-card button').click();await expect(page.locator('#checkinForm')).toBeVisible();await page.screenshot({path:'evidence/morning-checkin.png',fullPage:true,animations:'disabled'});
 for(const width of [320,390,768,1280,390]){await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('[data-day="19"]').click();await page.locator('.exercise-detail summary').first().click();await page.getByRole('button',{name:'Use bodyweight bridge instead'}).click();await expect(page.locator('.workout-card').first()).toContainText('Glute bridge');
 await page.locator('#settingsButton').click();await page.keyboard.press('Escape');await expect(page.locator('#settingsButton')).toBeFocused();
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('#screen').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');expect(errors).toEqual([]);
});
test('Scripture uses different valid API chapters, caches the selected date, and survives offline',async({page,context})=>{
 const requested=[];
 await page.route('https://rest.api.bible/v1/**',route=>{
  const url=route.request().url();requested.push(url);
  if(url.includes('/chapters/')){const id=url.match(/chapters\/([^/]+)\/verses/)[1];return route.fulfill({json:{data:[{id:id+'.1',reference:id+':1'},{id:id+'.2',reference:id+':2'}]}});}
  if(url.includes('/verses/'))return route.fulfill({json:{data:{reference:decodeURIComponent(url.match(/verses\/([^?]+)/)[1]),content:'Test reading — '+url.match(/verses\/([^?]+)/)[1]}}});
  return route.fulfill({json:{data:[{id:'test-nkjv',name:'New King James Version',abbreviation:'NKJV'}]}});
 });
 await start(page);await page.getByRole('button',{name:'Connect Scripture',exact:false}).click();await page.locator('#bibleKey').fill('test-only');await page.locator('#scriptureForm button').click();await expect(page.locator('#scriptureStatus')).toContainText('Connected');await page.keyboard.press('Escape');
 await expect(page.locator('#verseText')).toContainText('Test reading');const first=await page.locator('#verseRef').textContent();
 await page.locator('[data-day="1"]').click();await expect(page.locator('#verseText')).toContainText('Test reading');expect(await page.locator('#verseRef').textContent()).not.toBe(first);
 const count=requested.length;await page.locator('[data-day="0"]').click();await expect(page.locator('#verseRef')).toHaveText(first);expect(requested.length).toBe(count);
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();await expect(page.locator('#verseText')).toContainText('Test reading');await expect(page.locator('.workout-card')).toHaveCount(3);await context.setOffline(false);
});
test('weekly backup excludes credentials and corrupted data is preserved',async({page})=>{
 await start(page);await page.evaluate(()=>localStorage.setItem('ironform:bibleKey','DO-NOT-EXPORT'));
 await page.locator('#settingsButton').click();await page.getByText('Backup & previous records',{exact:true}).click();
 const downloaded=page.waitForEvent('download');await page.locator('#exportButton').click();const file=await (await downloaded).path();const text=fs.readFileSync(file,'utf8');expect(text).not.toContain('DO-NOT-EXPORT');expect(validWeekly(JSON.parse(text))).toBe(true);
 await page.locator('#importInput').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect(page.locator('#backupStatus')).toContainText('imported');
 await page.locator('#importInput').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});await expect(page.locator('#backupStatus')).toContainText('not a valid');
 await page.keyboard.press('Escape');await page.evaluate(key=>localStorage.setItem(key,'broken'),WEEKLY_KEY);await page.reload();await expect(page.locator('#storageWarning')).toContainText('left untouched');expect(await page.evaluate(key=>localStorage.getItem(key),WEEKLY_KEY)).toBe('broken');
});

test('failed saves keep a Sunday check-in exportable and do not overwrite saved data',async({page})=>{
 await start(page,'checkin/6');const before=await page.evaluate(key=>localStorage.getItem(key),WEEKLY_KEY);
 await page.evaluate(key=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Quota','QuotaExceededError');return original.call(this,k,v);};},WEEKLY_KEY);
 await page.locator('#backReview').selectOption('comfortable');await page.locator('#timeReview').selectOption('fits');await page.locator('[data-result="bench-strength"]').selectOption('complete');
 await page.getByRole('button',{name:'Save next week’s weights'}).click();await expect(page.locator('#storageWarning')).toContainText('could not save');
 expect(await page.evaluate(key=>localStorage.getItem(key),WEEKLY_KEY)).toBe(before);
 await page.locator('#settingsButton').click();await page.getByText('Backup & previous records',{exact:true}).click();const event=page.waitForEvent('download');await page.locator('#exportButton').click();const json=JSON.parse(fs.readFileSync(await(await event).path(),'utf8'));expect(json.checkins['2026-11-02'].nextWeights['bench-strength']).toBe(210);
});

test('reopening yesterday’s workout advances the date and Sunday summaries can be copied',async({page,context})=>{
 await start(page,'today/20');await expect(page.locator('.hero .kicker')).toContainText('Sunday');
 await page.clock.setFixedTime(new Date('2026-11-23T12:00:00'));await page.reload();await expect(page.locator('.hero .kicker')).toContainText('Monday, November 23');
 await page.locator('.tabs [data-view="checkin"]').click();await page.locator('[data-action="previousWeek"]').click();await expect(page.locator('#checkinForm')).toBeVisible();
 await page.locator('#reviewNotes').fill('Assess next week from my notebook.');await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.getByRole('button',{name:'Copy check-in for our review'}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('Assess next week from my notebook.');
});
