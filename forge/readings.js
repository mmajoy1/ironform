import {chapterCounts,verseCodes} from './scripture.js';
export const BKEY='ironform:bibleKey',BIBLE='ironform:bible',DAILY_CACHE='ironform:nkjvDaily:v3';
const chapters=chapterCounts.flatMap(([book,count])=>Array.from({length:count},(_,i)=>({book,ch:i+1})));
const mod=(n,d)=>(n%d+d)%d;
export function dailyChapter(date){
 const n=Math.floor(Date.parse(date+'T12:00:00Z')/86400000);
 // 173 and 1,189 are coprime: visit every chapter before repeating a chapter.
 return {...chapters[mod(n*173,chapters.length)],seed:n};
}
export function bibleKey(){try{return localStorage.getItem(BKEY)||'';}catch{return '';}}
export function dailyCache(){try{const c=JSON.parse(localStorage.getItem(DAILY_CACHE)||'{}');return c&&typeof c==='object'&&!Array.isArray(c)?c:{};}catch{return {};}}
async function request(path,key){const response=await fetch('https://rest.api.bible/v1'+path,{headers:{'api-key':key}});if(!response.ok)throw Error(`Scripture could not load (${response.status}). Check your connection and NKJV access.`);return response.json();}
export async function findBible(key){
 let cached;try{cached=JSON.parse(localStorage.getItem(BIBLE)||'null');}catch{}
 if(cached?.id)return cached;
 const response=await request('/bibles?language=eng&include-full-details=true',key);
 const bible=(response.data||[]).find(b=>(b.name||'').toLowerCase().includes('new king james')||((b.abbreviation||'')+' '+(b.abbreviationLocal||'')).toLowerCase().includes('nkjv'));
 if(!bible)throw Error('NKJV is not enabled for this API.Bible key.');
 const saved={id:bible.id,name:bible.name};localStorage.setItem(BIBLE,JSON.stringify(saved));return saved;
}
const pending=new Map();
export async function getDailyVerse(date,force=false){
 const old=dailyCache()[date];if(!force&&old?.text)return old;
 const key=bibleKey();if(!key)return old||null;
 if(pending.has(date)&&!force)return pending.get(date);
 const work=(async()=>{
   const bible=await findBible(key),chapter=dailyChapter(date),id=`${verseCodes[chapter.book]}.${chapter.ch}`;
   const list=await request(`/bibles/${encodeURIComponent(bible.id)}/chapters/${id}/verses`,key);
   const verses=(list.data||[]).filter(v=>v.id&&v.id.startsWith(id+'.'));
   if(!verses.length)throw Error('No verses were returned for this reading.');
   const chosen=verses[mod(chapter.seed*37+17,verses.length)];
   const response=await request(`/bibles/${encodeURIComponent(bible.id)}/verses/${encodeURIComponent(chosen.id)}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`,key);
   const text=String(response.data?.content||'').trim();if(!text)throw Error('No verse text was returned.');
   const item={ref:response.data?.reference||chosen.reference||chosen.id,text,at:Date.now()};
   const cache={...dailyCache(),[date]:item},dates=Object.keys(cache).sort().slice(-90);
   // A quota failure should not hide a successfully fetched verse.
   try{localStorage.setItem(DAILY_CACHE,JSON.stringify(Object.fromEntries(dates.map(d=>[d,cache[d]]))));}catch{}
   return item;
 })();pending.set(date,work);
 try{return await work;}finally{pending.delete(date);}
}
