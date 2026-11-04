import {test,expect} from '@playwright/test';
import {loadAdvice} from '../forge/store.js';
import {getDay} from '../forge/program.js';
const key='ironform:forge:v1';
test('lower-body history with worse symptoms never prefills the previous load',()=>{
 const day=getDay('2026-11-03',9),e=day.exercises[0];
 const record={sets:[{weight:40,reps:15,rir:4,symptom:false,at:'2026-11-05T18:00:00Z'}]};
 const data={start:'2026-11-03',increment:5,sessions:{'2026-11-03:2':{cycle:'2026-11-03',index:2,date:'2026-11-05',back:'worse',records:{[e.id]:record}}}};
 expect(loadAdvice(data,day,e).load).toBe(null);data.sessions['2026-11-03:2'].back='same';expect(loadAdvice(data,day,e).load).toBe(40);
});
test('quota failures keep changes exportable and corrupted storage stays untouched',async({page})=>{
 await page.goto('/forge/#train/0/0');const before=await page.evaluate(k=>localStorage.getItem(k),key);
 await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='ironform:forge:v1')throw new DOMException('Quota','QuotaExceededError');return original.call(this,k,v);};});
 await page.locator('#repsInput').fill('6');await page.getByRole('button',{name:'Log working set'}).click();await expect(page.locator('#storageWarning')).toContainText('could not save');await expect(page.locator('.log')).toContainText('245 lb');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe(before);
 await page.reload();await page.evaluate(k=>localStorage.setItem(k,'{broken'),key);await page.reload();await expect(page.locator('#storageWarning')).toContainText('left untouched');expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{broken');
});
test('populated progress chart reflows at phone widths and renders logged values only',async({page})=>{
 await page.goto('/forge/');await page.evaluate(k=>{
 const d={version:1,start:'2026-11-03',increment:5,timer:null,sessions:{}};
 for(let i=0;i<6;i++){const date=new Date('2026-11-03T12:00:00');date.setDate(date.getDate()+i*7);const iso=date.toISOString().slice(0,10);d.sessions['2026-11-03:'+i*7]={cycle:d.start,index:i*7,date:iso,notes:'',back:'same',swaps:{},completedAt:null,recoveryOnly:false,records:{'bench-strength':{name:'Barbell bench press',targetSets:3,min:6,max:8,sets:[{weight:235+i*5,reps:6,rir:2,symptom:false,at:date.toISOString()}]}}};}localStorage.setItem(k,JSON.stringify(d));
 },key);await page.goto('/forge/#progress/0/0');await page.reload();await expect(page.locator('.chart')).toBeVisible();
 for(const width of [320,390,768]){await page.setViewportSize({width,height:844});await expect(page.locator('.chart')).toContainText('260');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await page.locator('.chart svg .axis').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(11);}
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'evidence/forge-progress.png',fullPage:true,animations:'disabled'});
});
