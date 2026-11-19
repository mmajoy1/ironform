import {iso,validDate,mondayOf,dateAt,schedule,getDay} from './program.js';

export const WEEKLY_KEY='ironform:forge:weekly:v1';
export const LEGACY_KEY='ironform:forge:v1';
export const weightedExercises=()=>[...new Map(schedule.filter(d=>!d.easy).flatMap(d=>d.exercises).filter(e=>e.load>0).map(e=>[e.id,e])).values()];
export const defaults=()=>({version:1,start:mondayOf(iso()),lastOpenedDate:iso(),minutes:40,weights:Object.fromEntries(weightedExercises().map(e=>[e.id,e.load])),checkins:{}});
const finiteWeight=n=>Number.isFinite(n)&&n>=0&&n<=1500;
export function validWeekly(d){
  const ids=weightedExercises().map(e=>e.id);
  const weights=w=>w&&typeof w==='object'&&!Array.isArray(w)&&Object.entries(w).every(([id,n])=>ids.includes(id)&&finiteWeight(n));
  return !!(d&&d.version===1&&validDate(d.start)&&mondayOf(d.start)===d.start&&[20,25,30,35,40,45,50,60].includes(d.minutes)&&weights(d.weights)&&d.checkins&&typeof d.checkins==='object'&&!Array.isArray(d.checkins)&&Object.keys(d.checkins).length<=1000&&Object.entries(d.checkins).every(([key,c])=>validDate(key)&&mondayOf(key)===key&&c&&typeof c.notes==='string'&&c.notes.length<=3000&&['comfortable','worse','unreviewed'].includes(c.back)&&['fits','tight','unreviewed'].includes(c.time)&&Number.isInteger(c.sessions)&&c.sessions>=0&&c.sessions<=7&&weights(c.nextWeights)&&c.results&&typeof c.results==='object'&&!Array.isArray(c.results)&&Object.entries(c.results).every(([id,r])=>ids.includes(id)&&r&&finiteWeight(r.weight)&&['complete','missed','repeat','skipped','unreviewed'].includes(r.result))&&typeof c.savedAt==='string'&&!isNaN(Date.parse(c.savedAt))));
}
export function readWeekly(){
  const fresh=defaults();
  try {
    const raw=localStorage.getItem(WEEKLY_KEY);
    if(raw){const data=JSON.parse(raw);if(!validWeekly(data))throw Error('invalid');return {data};}
    // Read only the old start date. Historical sets remain untouched under their old key.
    try {const old=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');if(validDate(old?.start))fresh.start=mondayOf(old.start);}catch{}
    return {data:fresh,fresh:true};
  } catch{return {data:fresh,blocked:true,warning:'Saved weekly settings could not be read. They have been left untouched. Export a backup before replacing them.'};}
}
export function baselineFor(data,monday){
  const weights={...defaults().weights,...data.weights};
  for(const [date,review] of Object.entries(data.checkins).sort(([a],[b])=>a.localeCompare(b)))if(dateAt(date,7)<=monday)Object.assign(weights,review.nextWeights);
  return weights;
}
export function workoutFor(data,index){const monday=dateAt(data.start,Math.floor(index/7)*7);return getDay(data.start,index,{},baselineFor(data,monday));}
export function reviewExercises(data,week){
  const found=new Map();for(let i=0;i<6;i++)for(const e of workoutFor(data,week*7+i).exercises)if(e.load>0)found.set(e.id,e);
  return [...found.values()];
}
export function nextWeights(data,week,results,back){
  const monday=dateAt(data.start,week*7),weights=baselineFor(data,monday);
  const deload=week%6===3;
  if(deload&&back==='worse')for(const e of reviewExercises(data,week))weights[e.id]=Math.min(weights[e.id],e.load);
  for(const e of weightedExercises()){
    const r=results[e.id];if(!r||r.result==='unreviewed'||r.result==='skipped')continue;
    // A lighter recovery-week load never replaces the normal working baseline.
    if(deload){if(back==='worse')weights[e.id]=Math.min(weights[e.id],r.weight);continue;}
    weights[e.id]=r.weight;
    if(r.result==='complete'&&back==='comfortable'&&e.kind==='barbell'&&!e.lower)weights[e.id]=r.weight+5;
  }
  return weights;
}
