import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {getDay,dateAt,validDate,todayIndex} from '../forge/program.js';
import {loadAdvice,validStore} from '../forge/store.js';
const seed={version:1,start:'2026-11-03',sessions:{},timer:null,increment:5};
test.beforeEach(async({page})=>{await page.addInitScript(value=>{if(!localStorage.getItem('ironform:forge:v1'))localStorage.setItem('ironform:forge:v1',JSON.stringify(value));},seed);});
test('approved programming, variations, calendar and progression safeguards',()=>{
 expect(dateAt('2026-11-03',41)).toBe('2026-12-14');expect(dateAt('2028-02-28',1)).toBe('2028-02-29');expect(validDate('2026-02-30')).toBe(false);expect(todayIndex('2026-11-03','2027-01-01')).toBe(41);
 expect(getDay(seed.start,0).exercises[0].load).toBe(245);expect(getDay(seed.start,3).exercises[0].load).toBe(135);
 expect(getDay(seed.start,21).exercises[0]).toMatchObject({sets:2,load:null,rir:4});
 expect(getDay(seed.start,16).exercises[0].id).toBe('goblet-squat-pause');expect(getDay(seed.start,32).exercises[2].id).toBe('plate-hammer-curl');
 expect(getDay(seed.start,5,{'light-rdl':'bridge'}).exercises[0].id).toBe('bridge');
 const data=structuredClone(seed),day=getDay(seed.start,7),e=day.exercises[0];
 const record={name:e.name,targetSets:3,min:6,max:8,sets:Array.from({length:3},()=>({weight:245,reps:8,rir:2,symptom:false,at:'2026-11-03T18:00:00Z'}))};
 data.sessions['2026-11-03:0']={cycle:seed.start,index:0,date:seed.start,records:{'bench-strength':record},swaps:{},notes:'',back:'same',completedAt:null,recoveryOnly:false};
 expect(validStore(data)).toBe(true);expect(loadAdvice(data,day,e).load).toBe(250);
 record.sets.pop();expect(loadAdvice(data,day,e).title).toBe('Build clean reps');record.sets.push({weight:245,reps:8,rir:2,symptom:true,at:'2026-11-03T18:00:00Z'});expect(loadAdvice(data,day,e).load).toBe(null);
 record.sets[2].symptom=false;record.sets[2].rir=0;expect(loadAdvice(data,day,e).title).toBe('Build clean reps');
 record.sets[2].rir=2;record.sets[2].weight=240;expect(loadAdvice(data,day,e).title).toBe('Build clean reps');
 record.sets[2].weight=245;data.sessions['2026-11-03:0'].index=21;expect(loadAdvice(data,day,e).title).toBe('Build clean reps');
});
async function logSet(page,weight='245',reps='8'){
 await page.locator('#weightInput').fill(weight);await page.locator('#repsInput').fill(reps);await page.getByRole('button',{name:'Log working set'}).click();
}
test('real sets persist, timer survives reload, complete only after all work, and earned increase',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto('/forge/#train/0/0');
 await expect(page.locator('#weightInput')).toHaveValue('245');await logSet(page);
 await expect(page.locator('.timer')).toHaveText('3:00');await page.reload();await expect(page.locator('.timer')).toBeVisible();
 await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await page.locator('.timer').textContent();await page.clock.fastForward(10000);await expect(page.locator('.timer')).toHaveText(paused);
 await page.getByRole('button',{name:'+30 sec'}).click();await expect(page.locator('.timer')).toHaveText('3:30');await page.getByRole('button',{name:'Resume',exact:true}).click();await page.clock.fastForward(3500);await expect(page.locator('.timer')).not.toHaveText('3:30');
 await page.getByRole('button',{name:'Skip rest'}).click();await logSet(page);await page.getByRole('button',{name:'Skip rest'}).click();await logSet(page);
 await expect(page.getByRole('button',{name:'Finish session',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Next exercise',exact:true}).click();await logSet(page,'165','12');await page.getByRole('button',{name:'Skip rest'}).click();await logSet(page,'165','12');await page.getByRole('button',{name:'Next exercise',exact:true}).click();
 await logSet(page,'0','15');await page.getByRole('button',{name:'Skip rest'}).click();await logSet(page,'0','15');await page.getByRole('button',{name:'Finish session',exact:true}).click();await expect(page.locator('.badge')).toHaveText('Session completed');
 await page.locator('#backReview').selectOption('same');await page.locator('#sessionNotes').fill('Clean session <keep literal>.');
 await page.locator('#weekSelect').selectOption('1');await page.locator('[data-exercise="0"]').click();await expect(page.locator('.advice')).toContainText('Increase earned');await expect(page.locator('#weightInput')).toHaveValue('250');
 await page.locator('[data-view="progress"]').click();await expect(page.locator('.history-list')).toContainText('245 lb × 8');await expect(page.locator('.history-list')).toContainText('<keep literal>');expect(errors).toEqual([]);
});
test('lower swap, symptom hold, recovery day and no invented history',async({page})=>{
 await page.goto('/forge/#progress/0/0');await expect(page.locator('.empty')).toContainText('Your first entry');
 await page.goto('/forge/#train/5/0');await expect(page.locator('#weightInput')).toHaveValue('');await page.locator('#symptomInput').check();await logSet(page,'45','10');await expect(page.locator('#setForm')).toHaveCount(0);
 await page.getByRole('button',{name:'Use glute bridge instead'}).click();await expect(page.locator('h1')).toHaveText('Glute bridge');await expect(page.locator('.advice')).toContainText('Hold progression');await expect(page.locator('#weightInput')).toHaveValue('0');
 await page.reload();await expect(page.locator('h1')).toHaveText('Glute bridge');
 await page.goto('/forge/#today/6/0');await page.locator('#recoveryToggle').check();await page.getByRole('button',{name:'Record recovery day'}).click();await expect(page.locator('.badge')).toHaveText('Session completed');
 await page.locator('[data-view="progress"]').click();await page.locator('#historySelect').selectOption('light-rdl');await expect(page.locator('.history-list')).toContainText('Worse symptoms recorded');
});
test('settings, date cycle isolation, backup export and import exclude Scripture credentials',async({page})=>{
 await page.goto('/forge/#train/0/0');await logSet(page);
 await page.evaluate(()=>localStorage.setItem('ironform:bibleKey','TEST-KEY-DO-NOT-EXPORT'));
 await page.locator('#settingsButton').click();await page.locator('#startInput').fill('2027-01-04');await page.getByRole('button',{name:'Save program settings'}).click();await expect(page.locator('.notice')).toContainText('starts');
 await page.locator('#settingsButton').click();const downloadEvent=page.waitForEvent('download');await page.locator('#exportButton').click();const download=await downloadEvent;const file=await download.path(),text=fs.readFileSync(file,'utf8'),json=JSON.parse(text);expect(text).not.toContain('TEST-KEY');expect(Object.keys(json.sessions)).toHaveLength(1);
 await page.locator('#importInput').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(text)});await expect(page.locator('#settingsStatus')).toContainText('Backup imported');
 await page.locator('#importInput').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"version":1}')});await expect(page.locator('#settingsStatus')).toContainText('not a valid');
 await page.locator('#startInput').fill('2026-11-03');await page.getByRole('button',{name:'Save program settings'}).click();await page.goto('/forge/#train/0/0');await expect(page.locator('.log')).toContainText('245 lb');
});
test('Scripture connects through mocked API, preserves cache, and clears only its own data',async({page})=>{
 await page.route('https://rest.api.bible/v1/**',route=>route.fulfill({json:route.request().url().includes('/verses/')?{data:{content:'Scripture test fixture.'}}:{data:[{id:'test-nkjv',name:'New King James Version',abbreviation:'NKJV'}]}}));
 await page.goto('/forge/#today/0/0');await page.locator('#devotion summary').click();await page.locator('[data-action="scripture"]').click();await page.locator('#bibleKey').fill('test-key');await page.locator('#scriptureDialog button[type="submit"]').click();await expect(page.locator('#scriptureStatus')).toContainText('Connected');await page.keyboard.press('Escape');
 await page.locator('#devotion summary').click();await expect(page.locator('#verseText')).toHaveText('Scripture test fixture.');
 await page.locator('#settingsButton').click();await page.locator('#scriptureSettings').click();await page.locator('#clearScripture').click();expect(await page.evaluate(()=>localStorage.getItem('ironform:forge:v1'))).not.toBe(null);expect(await page.evaluate(()=>localStorage.getItem('ironform:bibleKey'))).toBe(null);
});
test('offline app, local fonts and logs survive refresh',async({page,context})=>{
 await page.goto('/forge/#train/0/0');await logSet(page);await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.locator('h1')).toHaveText('Barbell bench press');await expect(page.locator('.log')).toContainText('245 lb');await page.locator('[data-view="today"]').click();await expect(page.locator('.hero')).toBeVisible();expect(await page.evaluate(()=>document.fonts.check('700 20px "Barlow Condensed"'))).toBe(true);
 await context.setOffline(false);
});
test('responsive visual and keyboard acceptance',async({page})=>{
 fs.mkdirSync('evidence',{recursive:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/forge/#today/0/0');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'evidence/forge-today.png',fullPage:true,animations:'disabled'});
 await page.locator('#settingsButton').focus();await page.keyboard.press('Enter');await expect(page.locator('#settingsDialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('#settingsButton')).toBeFocused();
 for(const width of [320,390,768,1280,390]){
  await page.setViewportSize({width,height:844});await page.locator('[data-day="0"]').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('[data-action="start"]').evaluate(el=>{const r=el.getBoundingClientRect();el.scrollIntoView({block:'center'});const a=el.getBoundingClientRect();return el.contains(document.elementFromPoint(a.x+a.width/2,a.y+a.height/2));})).toBe(true);
  if(width===320)await page.screenshot({path:'evidence/forge-narrow.png',fullPage:true,animations:'disabled'});
  if(width===1280)await page.screenshot({path:'evidence/forge-desktop.png',fullPage:true,animations:'disabled'});
 }
 await page.getByRole('button',{name:'Start session'}).click();await page.screenshot({path:'evidence/forge-train.png',fullPage:true,animations:'disabled'});
 await page.locator('[data-rir="3"]').focus();await page.keyboard.press('Space');await expect(page.locator('[data-rir="3"]')).toHaveAttribute('aria-pressed','true');await logSet(page);await page.screenshot({path:'evidence/forge-rest.png',fullPage:true,animations:'disabled'});
 await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('#screen').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');expect(errors).toEqual([]);
});
