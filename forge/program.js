export const VERSION=2;
export const weeks=[
 {name:'Start',line:'Use the listed starting weights. Complete the exact sets and reps with clean technique.'},
 {name:'Build',line:'If you completed every prescribed set and rep last time, add a small amount of weight. Otherwise repeat the load.'},
 {name:'Push',line:'Keep the same exercises and exact reps. Progress load only when the previous session was complete and clean.'},
 {name:'Deload',line:'Use fewer working sets and lighter starting weights. Finish fresh.'},
 {name:'Rebuild',line:'Return to normal sets and resume from your last successful working weights.'},
 {name:'Finish',line:'Keep the same simple rule: complete the work, then earn the next small load increase.'}
];
const ex=(id,name,sets,reps,rest,options={})=>({id,name,sets,reps,min:reps,max:reps,rest,unit:'reps',side:false,kind:'barbell',load:null,lower:false,cue:'Use a comfortable range and controlled reps.',...options});
const bench=ex('bench-strength','Barbell bench press',3,6,180,{load:205,cue:'Start at 205 lb. Use safeties or a spotter. If all 3 sets of 6 are clean, add 5 lb next time.'});
const row=(volume=false)=>ex(volume?'row-volume':'row-strength','Supported Fat Bell row',3,volume?12:10,90,{kind:'bell',load:62,side:true,cue:'Use the 62 lb Fat Bell. Log reps per side and the weight of one bell.'});
const pullover=()=>ex('pullover','Fat Bell / kettlebell pullover',2,12,90,{kind:'bell',load:40,cue:'Start with the 40 lb kettlebell. Keep the shoulder range comfortable.'});
const curl=(volume=false)=>ex(volume?'curl-volume':'curl-strength','Barbell curl',volume?2:3,volume?12:10,75,{load:volume?60:70,cue:'Keep your torso still. Add 5 lb only after all prescribed reps are clean.'});
const calf=()=>ex('calf-raise','Supported calf raise',2,15,60,{kind:'bodyweight',load:0,lower:true,cue:'Use support for balance. Bodyweight is the starting load.'});
export const schedule=[
 {title:'Chest',subtitle:'+ triceps',focus:'Upper body · Strength',verse:'Proverbs 16:3',exercises:[
  bench,
  ex('incline-accessory','Barbell incline press',2,10,120,{load:145,cue:'Start at 145 lb. Keep every rep controlled.'}),
  ex('close-pushup','Close-grip push-up',2,12,90,{kind:'bodyweight',load:0,cue:'Bodyweight. Elevate your hands on a stable surface if needed.'})
 ]},
 {title:'Back',subtitle:'+ biceps',focus:'Upper body · Supported pulling',verse:'Isaiah 41:10',exercises:[row(),pullover(),curl()]},
 {title:'Lower',subtitle:'+ control',focus:'Lower body · Squat pattern',verse:'Psalm 46:10',lower:true,exercises:[
  ex('goblet-squat','Goblet squat',2,12,90,{kind:'bell',load:62,lower:true,cue:'Start with the 62 lb Fat Bell and use a comfortable depth.'}),
  ex('split-squat','Supported split squat',2,8,90,{kind:'bell',load:35,side:true,lower:true,cue:'Start with the 35 lb Fat Bell in the free hand. Log reps per leg.'}),
  calf(),
  ex('dead-bug','Dead bug',2,8,45,{kind:'bodyweight',load:0,side:true,lower:true,cue:'Bodyweight. Move slowly and log reps per side.'})
 ]},
 {title:'Shoulders',subtitle:'+ chest',focus:'Upper body · Press + volume',verse:'Colossians 3:23',exercises:[
  ex('ohp-strength','Barbell overhead press',3,6,180,{load:115,cue:'Start at 115 lb. Keep the bar path clean and avoid leaning back.'}),
  ex('incline-volume','Barbell incline press',3,10,120,{load:135,cue:'Start at 135 lb.'}),
  ex('rear-delt','Supported rear-delt plate raise',2,15,75,{kind:'plate',load:10,cue:'Start with 10 lb plates and keep the movement controlled.'})
 ]},
 {title:'Back',subtitle:'+ arms',focus:'Upper body · Volume',verse:'Galatians 6:9',exercises:[
  row(true),pullover(),curl(true),
  ex('close-bench','Close-grip bench press',2,10,120,{load:145,cue:'Start at 145 lb with a comfortable grip and safeties.'})
 ]},
 {title:'Lower',subtitle:'+ balance',focus:'Lower body · Hinge pattern',verse:'Matthew 11:28',lower:true,exercises:[
  ex('light-rdl','Romanian deadlift',2,12,90,{load:175,lower:true,swap:'bridge',cue:'Start at 175 lb and use a comfortable range. Choose the bridge if hinging bothers your back.'}),
  ex('reverse-lunge','Supported reverse lunge',2,8,90,{kind:'bell',load:35,side:true,lower:true,cue:'Start with the 35 lb Fat Bell in the free hand. Log reps per leg.'}),
  calf()
 ]},
 {title:'Technique',subtitle:'+ reset',focus:'Easy practice · Recovery first',verse:'Psalm 118:24',easy:true,exercises:[
  ex('easy-row','Easy supported row',1,12,60,{kind:'bell',load:35,side:true,cue:'One easy set per side with the 35 lb Fat Bell.'}),
  ex('easy-curl','Easy curl',1,12,60,{load:45,cue:'One easy set at 45 lb.'})
 ]}
];
export const bridge=ex('bridge','Glute bridge',2,12,75,{kind:'bodyweight',load:0,lower:true,swap:'light-rdl',cue:'Bodyweight. Move through a comfortable range.'});
export function iso(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(new Date(s+'T12:00:00'))&&iso(new Date(s+'T12:00:00'))===s;}
export function dateAt(start,index){const d=new Date(start+'T12:00:00');d.setDate(d.getDate()+index);return iso(d);}
export function todayIndex(start,today=iso()){const days=(Date.parse(today+'T12:00:00Z')-Date.parse(start+'T12:00:00Z'))/86400000;return Math.max(0,Math.min(41,days));}
function deloadLoad(e){
 if(e.load===null||e.load===undefined)return e.load;
 if(e.kind==='bodyweight')return 0;
 if(e.kind==='bell'){if(e.load>=62)return 53;if(e.load>=40)return 35;if(e.load>=35)return 26;return e.load;}
 if(e.kind==='plate')return Math.max(5,Math.round(e.load*.7/5)*5);
 return Math.max(0,Math.round(e.load*.8/5)*5);
}
export function getDay(start,index,swaps={}){
 const week=Math.floor(index/7),weekday=index%7,base=schedule[weekday];
 const exercises=base.exercises.map(original=>{
  let e={...original};
  if(e.id==='light-rdl'&&swaps['light-rdl']==='bridge')e={...bridge};
  if(week===3)e={...e,sets:Math.max(1,Math.ceil(e.sets/2)),load:deloadLoad(e)};
  return e;
 });
 return {...base,index,week,weekday,date:dateAt(start,index),phase:weeks[week],exercises};
}
export function setCount(day){return day.exercises.reduce((n,e)=>n+e.sets,0);}
export function prescription(e){return `${e.sets} × ${e.reps}${e.side?' / side':''}`;}
export function restLabel(s){return s>=120?`${s/60} min`:`${s} sec`;}
