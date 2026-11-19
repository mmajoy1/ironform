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
 if(day.week===3)return {load:e.load,title:'Deload weight',text:'Use the listed lighter weight and reduced sets this week.'};
 const previous=history[0];
 if(previous){
  const r=previous.record,sets=r.sets,last=sets.at(-1),symptoms=sets.some(s=>s.symptom)||previous.session.back==='worse';
  if(symptoms)return {load:last?.weight??e.load,title:'Review the load',text:'Your last entry noted worse symptoms. Reduce, change, or skip the movement if needed.'};
  const complete=sets.length>=e.sets&&sets.slice(0,e.sets).every(s=>s.reps>=e.reps&&!s.symptom);
  if(!complete)return {load:last?.weight??e.load,title:'Repeat the weight',text:'Finish every prescribed set and rep before adding weight.'};
  if(e.kind==='barbell'){
   const jump=e.lower?10:data.increment;
   return {load:(last?.weight??e.load??0)+jump,title:`Add ${jump} lb`,text:`Last time you completed every prescribed set and rep. Try ${jump} lb more today.`};
  }
  if(e.kind==='plate')return {load:(last?.weight??e.load??0)+5,title:'Small increase',text:'All prescribed work was completed. Add 5 lb only if the next plate setup is practical.'};
  return {load:last?.weight??e.load,title:'Repeat the weight',text:'Keep the same implement and beat the prescription cleanly again.'};
 }
 return {load:e.load,title:'Starting weight',text:e.kind==='bodyweight'?'Start with bodyweight.':`Start at ${e.load??0} lb and complete the listed sets and reps.`};
}
