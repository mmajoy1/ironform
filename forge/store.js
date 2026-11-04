import {iso,validDate} from './program.js';
export const STORE_KEY='ironform:forge:v1';
const empty=()=>({version:1,start:iso(),sessions:{},timer:null,increment:5});
export function readStore(){
 try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return {data:empty(),warning:''};const data=JSON.parse(raw);if(!validStore(data))throw Error('invalid');return {data,warning:''};}
 catch{return {data:empty(),warning:'Saved training data could not be read. Existing data has been left untouched. Export or recover it before replacing it.',blocked:true};}
}
export function validStore(d){
 if(!d||d.version!==1||!validDate(d.start)||typeof d.sessions!=='object'||!d.sessions||Array.isArray(d.sessions)||!Number.isFinite(d.increment)||d.increment<=0||d.increment>20)return false;
 const sessions=Object.entries(d.sessions);if(sessions.length>10000)return false;
 if(d.timer!==null&&d.timer!==undefined){const t=d.timer;if(!t||!validDate(t.cycle)||!Number.isInteger(t.index)||t.index<0||t.index>41||typeof t.exercise!=='string'||typeof t.name!=='string'||!Number.isFinite(t.deadline)||!Number.isFinite(t.duration)||t.duration<=0||t.duration>86400||!Number.isFinite(t.remaining)||t.remaining<0||typeof t.paused!=='boolean')return false;}
 return sessions.every(([key,s])=>s&&validDate(s.cycle)&&validDate(s.date)&&Number.isInteger(s.index)&&s.index>=0&&s.index<42&&key===sessionKey(s.cycle,s.index)&&typeof s.notes==='string'&&s.notes.length<=5000&&['unreviewed','same','better','worse'].includes(s.back)&&typeof s.recoveryOnly==='boolean'&&typeof s.swaps==='object'&&s.swaps&&!Array.isArray(s.swaps)&&Object.keys(s.swaps).every(k=>k==='light-rdl'&&['light-rdl','bridge'].includes(s.swaps[k]))&&typeof s.records==='object'&&s.records&&!Array.isArray(s.records)&&Object.entries(s.records).every(([id,r])=>/^[a-z0-9-]+$/.test(id)&&r&&typeof r.name==='string'&&r.name.length<150&&Number.isInteger(r.targetSets)&&r.targetSets>0&&r.targetSets<=10&&Number.isInteger(r.min)&&Number.isInteger(r.max)&&r.min>0&&r.max>=r.min&&Array.isArray(r.sets)&&r.sets.length<=20&&r.sets.every(x=>x&&Number.isFinite(x.weight)&&x.weight>=0&&x.weight<=1500&&Number.isInteger(x.reps)&&x.reps>0&&x.reps<=100&&Number.isInteger(x.rir)&&x.rir>=0&&x.rir<=10&&typeof x.symptom==='boolean'&&typeof x.at==='string'&&!isNaN(Date.parse(x.at)))));
}
export function sessionKey(cycle,index){return `${cycle}:${index}`;}
export function sessionFor(data,day,create=false){
 const key=sessionKey(data.start,day.index);
 if(!data.sessions[key]&&create)data.sessions[key]={cycle:data.start,index:day.index,date:day.date,records:{},swaps:{},back:'unreviewed',notes:'',completedAt:null,recoveryOnly:false};
 return data.sessions[key]||null;
}
export function historyFor(data,exerciseId,excludeKey=''){
 return Object.entries(data.sessions).filter(([key,s])=>key!==excludeKey&&s.records[exerciseId]?.sets?.length).map(([key,s])=>({key,session:s,record:s.records[exerciseId]})).sort((a,b)=>new Date(b.record.sets.at(-1).at)-new Date(a.record.sets.at(-1).at));
}
export function loadAdvice(data,day,e){
 const history=historyFor(data,e.id,sessionKey(data.start,day.index));
 if(day.week===3)return {load:null,title:'Use a lighter load',text:'Recovery week: select a load that leaves at least 4 clean reps.'};
 if(day.easy)return {load:null,title:'Keep this easy',text:'At least 4 reps left. No load progression target on the reset day.'};
 const previous=history[0];
 if(previous){
  const r=previous.record,sets=r.sets,last=sets.at(-1),symptoms=sets.some(s=>s.symptom)||previous.session.back==='worse';
  if(e.lower)return {load:symptoms?null:last.weight,title:'Lower-body load stays your choice',text:symptoms?'Your last entry noted worse symptoms. Reduce, change, or skip the movement; do not progress it.':'Repeat only if comfortable during and afterward. Add clean reps first; there is no automatic lower-body load increase.'};
  const comparable=previous.session.index>=0&&Math.floor(previous.session.index/7)!==3&&r.targetSets===e.sets&&r.min===e.min&&r.max===e.max;
  const sameWeight=sets.every(s=>s.weight===sets[0].weight);
  const earned=comparable&&sets.length===e.sets&&sameWeight&&sets.every(s=>s.reps>=e.max&&s.rir>=e.rir&&!s.symptom)&&!symptoms;
  if(earned&&e.kind==='barbell')return {load:sets[0].weight+data.increment,title:'Increase earned',text:`Every prescribed set reached ${e.max} reps with at least ${e.rir} left. Try +${data.increment} lb only if today’s warm-ups feel right.`};
  if(earned)return {load:last.weight,title:'Top of range reached',text:e.kind==='bell'?'Keep the same bell, or choose the next available size only if manageable. Your heaviest Fat Bell is 62 lb; kettlebell is 40 lb.':'Repeat clean reps or choose a small manageable progression. No automatic load jump.'};
  return {load:symptoms?null:last.weight,title:symptoms?'Review symptoms before loading':'Build clean reps',text:symptoms?'Your previous entry noted worse symptoms. Change, reduce, or skip the movement.':'Repeat a manageable load. Earn the top of the rep range on every set before adding weight.'};
 }
 return {load:e.load,title:e.load!==null&&e.load>0?'First-session trial':'Choose by effort',text:e.id==='bench-strength'?'Try 245 lb only if 6 reps leave 2 clean reps. Use 235 lb or less if needed.':e.id==='ohp-strength'?'Trial 135 lb with 2 clean reps left; progress toward 145 lb as earned.':e.lower?'Choose a light load and leave about 4 clean reps. Keep your back’s response in view.':e.kind==='bodyweight'?'Enter 0 lb for bodyweight. Adjust the variation to the required effort.':`Choose a manageable load that leaves ${e.rir} clean reps. Warm-ups do not count as work sets.`};
}
