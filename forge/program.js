export const VERSION=1;
export const weeks=[
 {name:'Calibrate',line:'Find loads you can repeat with clean reps. Leave 2 reps in reserve on upper lifts and 4 on lower work.'},
 {name:'Build reps',line:'Add clean reps within the range. Increase upper-body load only after every prescribed set earns it.'},
 {name:'Control',line:'Pause the marked accessories for 1 second. Reduce their load as needed; main lifts stay consistent.'},
 {name:'Reload',line:'About half the working sets, lighter loads, and at least 4 reps left. Finish feeling fresh.'},
 {name:'Rebuild',line:'Return to normal sets. Re-establish your loads and try the marked accessory variations.'},
 {name:'Compare',line:'Compare clean reps with Week 5 at the same load and effort. Keep 2 reps in reserve; no max testing.'}
];
const ex=(id,name,sets,min,max,rest,options={})=>({id,name,sets,min,max,rest,unit:'reps',side:false,kind:'barbell',load:null,lower:false,cue:'Use a comfortable range and controlled reps.',...options});
const bench=ex('bench-strength','Barbell bench press',3,6,8,180,{load:245,cue:'245 lb is a trial, not a requirement. Use 235 lb or less if 6 reps do not leave 2 clean reps. Use safeties or a spotter.'});
const row=(volume=false)=>ex(volume?'row-volume':'row-strength','Supported Fat Bell row',3,volume?12:10,volume?20:15,90,{kind:'bell',load:62,side:true,cue:'Support your free hand on a stable bench. Keep your torso steady. Log reps per side and the weight of one bell.'});
const pullover=()=>ex('pullover','Fat Bell / kettlebell pullover',2,10,15,90,{kind:'bell',cue:'Choose a manageable bell and a comfortable shoulder range. Do not force the stretch.'});
const curl=(volume=false)=>ex(volume?'curl-volume':'curl-strength','Barbell curl',volume?2:3,volume?10:8,volume?15:12,75,{cue:'Keep your torso still. Choose the load that leaves 2 clean reps.'});
const calf=()=>ex('calf-raise','Supported calf raise',2,12,20,60,{kind:'bodyweight',load:0,lower:true,cue:'Use support for balance. Bodyweight is a valid starting load.'});
export const schedule=[
 {title:'Chest',subtitle:'+ triceps',focus:'Upper body · Strength',verse:'Proverbs 16:3',exercises:[bench,ex('incline-accessory','Barbell incline press',2,8,12,120),ex('close-pushup','Close-grip push-up',2,10,15,90,{kind:'bodyweight',load:0,cue:'Keep a comfortable hand position. Elevate your hands on a stable surface if needed.'})]},
 {title:'Back',subtitle:'+ biceps',focus:'Upper body · Supported pulling',verse:'Isaiah 41:10',exercises:[row(),pullover(),curl()]},
 {title:'Lower',subtitle:'+ control',focus:'Light lower body · Squat pattern',verse:'Psalm 46:10',lower:true,exercises:[ex('goblet-squat','Goblet squat',2,10,15,90,{kind:'bell',lower:true,cue:'Start with a light bell. Leave about 4 reps in reserve and use a comfortable depth.'}),ex('split-squat','Supported split squat',2,8,10,90,{kind:'bodyweight',load:0,side:true,lower:true,cue:'Start with bodyweight and use stable hand support. Log reps per leg.'}),calf(),ex('dead-bug','Dead bug',2,6,8,45,{kind:'bodyweight',load:0,side:true,lower:true,cue:'Move slowly through a comfortable range. Log reps per side.'})]},
 {title:'Shoulders',subtitle:'+ chest',focus:'Upper body · Press + volume',verse:'Colossians 3:23',exercises:[ex('ohp-strength','Barbell overhead press',3,6,8,180,{load:135,cue:'Start around 135 lb if it leaves 2 clean reps. Progress toward 145 lb as earned. Avoid leaning back; change the movement if your back worsens.'}),ex('incline-volume','Barbell incline press',3,8,12,120),ex('rear-delt','Supported rear-delt raise',2,12,20,75,{kind:'plate',cue:'Support your chest on the bench if comfortable. Use very light plates or no load; this is controlled shoulder work.'})]},
 {title:'Back',subtitle:'+ arms',focus:'Upper body · Volume',verse:'Galatians 6:9',exercises:[row(true),pullover(),curl(true),ex('close-bench','Close-grip bench press',2,8,12,120,{cue:'Use a comfortable grip, safeties or a spotter, and a load that leaves 2 clean reps.'})]},
 {title:'Lower',subtitle:'+ balance',focus:'Light lower body · Hinge pattern',verse:'Matthew 11:28',lower:true,exercises:[ex('light-rdl','Light Romanian deadlift',2,10,15,90,{lower:true,swap:'bridge',cue:'Keep this light, with about 4 clean reps left. Use a comfortable range. Choose the bridge instead if hinging worsens your back.'}),ex('reverse-lunge','Supported reverse lunge',2,8,10,90,{kind:'bodyweight',load:0,side:true,lower:true,cue:'Start with bodyweight, stable hand support, and a comfortable step. Log reps per leg.'}),calf()]},
 {title:'Technique',subtitle:'+ reset',focus:'Easy practice · Recovery first',verse:'Psalm 118:24',easy:true,exercises:[ex('easy-row','Easy supported row',1,12,12,60,{kind:'bell',side:true,cue:'One genuinely easy set per side with at least 4 clean reps left. No progression target today.'}),ex('easy-curl','Easy curl',1,12,12,60,{cue:'One easy set with at least 4 reps left. Follow with comfortable mobility.'})]}
];
export const bridge=ex('bridge','Glute bridge',2,10,15,75,{kind:'bodyweight',load:0,lower:true,swap:'light-rdl',cue:'Use bodyweight first. Move through a comfortable range without forcing your lower back into an arch.'});
export function iso(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(new Date(s+'T12:00:00'))&&iso(new Date(s+'T12:00:00'))===s;}
export function dateAt(start,index){const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+index);return iso(d);}
export function todayIndex(start,today=iso()){const days=(Date.parse(today+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000;return Math.max(0,Math.min(41,days));}
export function getDay(start,index,swaps={}){
 const week=Math.floor(index/7),weekday=index%7,base=schedule[weekday];
 const exercises=base.exercises.map(original=>{
  let e={...original};
  if(e.id==='light-rdl'&&swaps['light-rdl']==='bridge')e={...bridge};
  if(week>=4&&e.id==='curl-volume')e={...e,id:'plate-hammer-curl',name:'Plate hammer curl',kind:'plate',load:null,cue:'Use a manageable plate and a secure grip. Keep elbows still and leave 2 clean reps.'};
  if(week>=4&&e.id==='close-pushup')e={...e,id:'incline-close-pushup',name:'Elevated close-grip push-up',cue:'Use a stable hand support and a comfortable close grip. Keep 2 clean reps in reserve.'};
  if(week===2&&['goblet-squat','incline-volume'].includes(e.id))e={...e,id:e.id+'-pause',name:e.name+' · paused',load:null,cue:'Pause for 1 second at the bottom. Reduce load and use a comfortable range. '+e.cue};
  return {...e,sets:week===3?Math.ceil(e.sets/2):e.sets,rir:week===3||e.lower||base.easy?4:2,load:week===3?null:e.load};
 });
 return {...base,index,week,weekday,date:dateAt(start,index),phase:weeks[week],exercises};
}
export function setCount(day){return day.exercises.reduce((n,e)=>n+e.sets,0);}
export function prescription(e){return `${e.sets} × ${e.min===e.max?e.min:e.min+'–'+e.max}${e.side?' / side':''}`;}
export function restLabel(s){return s>=120?`${s/60} min`:`${s} sec`;}
