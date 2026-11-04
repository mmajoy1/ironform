import {test, expect} from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root = path.resolve('.');
const oldWorker = execFileSync('git', ['show','5a27103:sw.js']);
const oldIndex = execFileSync('git', ['show','5a27103:index.html']);
let server, origin, legacy = false;
test.beforeAll(async()=>{
  server = http.createServer((req,res)=>{
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/ironform/')) {res.writeHead(404).end();return;}
    const relative = url.pathname.slice('/ironform/'.length) || 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
    const ext = path.extname(file);
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.ttf':'font/ttf','.jpg':'image/jpeg'})[ext]||'application/octet-stream');
    const fixture = legacy && (relative==='sw.js'?oldWorker:relative==='index.html'?oldIndex:null);
    if (fixture) {res.end(fixture);return;}
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve));});

test('existing installed app upgrades its old worker without losing data or unrelated caches',async({page,context})=>{
  legacy = true;
  await page.goto(origin+'/ironform/?v=20261001b');
  await page.evaluate(async()=>{
    await navigator.serviceWorker.register('./sw.js?v=20261001b',{updateViaCache:'none'});
    await navigator.serviceWorker.ready;
  });
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await page.evaluate(async()=>{
    localStorage.setItem('ironform:bibleKey','migration-test-key');
    localStorage.setItem('legacy-user-record','preserved');
    localStorage.setItem('ironform:forge:v1',JSON.stringify({version:1,start:'2026-11-03',sessions:{},timer:null,increment:5}));
    await (await caches.open('unrelated-site-cache')).put('/other-site/test',new Response('keep'));
    await (await caches.open('ironform-forge-preview-v1')).put('/ironform/forge/test',new Response('keep'));
  });
  legacy = false;
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
  await expect.poll(()=>page.evaluate(()=>caches.keys())).toContain('ironform-forge-live:/ironform/:20261103-1');
  await expect.poll(()=>page.evaluate(()=>caches.keys())).not.toContain('ironform-v5');
  await page.goto(origin+'/ironform/?v=20261001b#train/0/0');
  // A hash-only navigation does not reload an already open legacy document.
  await page.reload();
  await expect(page).toHaveTitle('IRONFORM · Chest + triceps');
  await expect(page.locator('#weightInput')).toHaveValue('245');
  expect(await page.evaluate(()=>localStorage.getItem('ironform:bibleKey'))).toBe('migration-test-key');
  expect(await page.evaluate(()=>localStorage.getItem('legacy-user-record'))).toBe('preserved');
  expect(await page.evaluate(()=>caches.keys())).toEqual(expect.arrayContaining(['unrelated-site-cache','ironform-forge-preview-v1']));
  await page.locator('#repsInput').fill('6');
  await page.getByRole('button',{name:'Log working set'}).click();
  await expect(page.locator('.log')).toContainText('245 lb');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.log')).toContainText('245 lb');
  await expect(page.locator('.timer')).toBeVisible();
  await context.setOffline(false);
});

test('production subpath loads assets, navigation and offline shell at mobile size',async({page,context})=>{
  legacy = false;
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const failures=[];page.on('response',response=>{if(response.status()>=400)failures.push(response.url());});
  await page.goto(origin+'/ironform/');
  await expect(page.locator('.preview-tag')).toHaveText('FORGE');
  await expect(page.locator('.hero')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await page.screenshot({path:'evidence/forge-release-mobile.png',fullPage:true,animations:'disabled'});
  await page.locator('[data-view="train"]').click();
  await expect(page.locator('#setForm')).toBeVisible();
  await page.locator('[data-view="progress"]').click();
  await expect(page.locator('.empty')).toBeVisible();
  const manifest=await (await page.request.get(origin+'/ironform/manifest.webmanifest')).json();
  expect(manifest.id).toBe('./?v=20261001b');
  expect(manifest.start_url).toBe('./?v=20261001b');
  await context.setOffline(true);await page.reload();
  await expect(page.locator('.empty')).toBeVisible();
  await page.locator('[data-view="today"]').click();await expect(page.locator('.hero')).toBeVisible();
  await context.setOffline(false);
  expect(errors).toEqual([]);expect(failures).toEqual([]);
});
