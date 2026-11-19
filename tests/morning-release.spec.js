import {test, expect} from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root = path.resolve('.');
const oldWorker = execFileSync('git', ['show','132eb9a:sw.js']);
const oldIndex = execFileSync('git', ['show','132eb9a:index.html']);
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
    if (fixture) {res.end(fixture);return;} if(legacy){try{res.end(execFileSync('git',['show','132eb9a:'+relative]));return;}catch{res.writeHead(404).end();return;}}
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve));});

test('live November build upgrades to notebook workflow and preserves storage and installed identity',async({page,context})=>{
 legacy=true;await page.goto(origin+'/ironform/?v=20261001b');
 await page.evaluate(()=>navigator.serviceWorker.ready);await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 const original=await page.evaluate(()=>{
  const value=localStorage.getItem('ironform:forge:v1');localStorage.setItem('ironform:bibleKey','migration-fixture');return value;
 });
 await page.evaluate(async()=>{await(await caches.open('other-site-cache')).put('/other-site/test',new Response('keep'));});
 legacy=false;await page.route('https://rest.api.bible/**',r=>r.fulfill({status:503,json:{}}));
 await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update();});
 await expect.poll(()=>page.evaluate(()=>caches.keys())).toContain('ironform-forge-live:/ironform/:20261119-morning-1');
 await expect.poll(()=>page.evaluate(()=>caches.keys())).not.toContain('ironform-forge-live:/ironform/:20261119-2');
 await page.reload();await expect(page.locator('.tabs [data-view="checkin"]')).toBeVisible();await expect(page.locator('.workout-card').first()).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('ironform:forge:v1'))).toBe(original);
 expect(await page.evaluate(()=>localStorage.getItem('ironform:bibleKey'))).toBe('migration-fixture');
 expect(await page.evaluate(()=>caches.keys())).toContain('other-site-cache');
 const manifest=await(await page.request.get(origin+'/ironform/manifest.webmanifest')).json();expect(manifest.id).toBe('./?v=20261001b');
 await page.evaluate(()=>navigator.serviceWorker.ready);await context.setOffline(true);await page.reload();await expect(page.locator('.workout-card').first()).toBeVisible();await context.setOffline(false);
});

test('production root loads all new assets and changes view offline without errors',async({page,context})=>{
 legacy=false;const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
 await page.goto(origin+'/ironform/');await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>navigator.serviceWorker.ready);
 await expect(page.locator('.days button').first()).toContainText('Mo');await expect(page.locator('.days button').last()).toContainText('Su');
 await page.screenshot({path:'evidence/morning-release-mobile.png',fullPage:true,animations:'disabled'});
 await page.locator('.tabs [data-view="week"]').click();await expect(page.locator('.week-item')).toHaveCount(7);
 await page.reload();await context.setOffline(true);await page.reload();await expect(page.locator('.week-item')).toHaveCount(7);
 await page.locator('.tabs [data-view="today"]').click();await expect(page.locator('.workout-card').first()).toBeVisible();await context.setOffline(false);
 expect(errors).toEqual([]);expect(failed).toEqual([]);
});
