/* Phase V: deliberate variation with repeatable lifts and effort-based loads. */
(() => {
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const valid = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(new Date(s+'T12:00:00')) && iso(new Date(s+'T12:00:00')) === s;
  let start = iso(new Date());
  let storageAvailable=true;
  try { const saved = localStorage.getItem('ironform:v5:start'); if(valid(saved)) start = saved; else localStorage.setItem('ironform:v5:start',start); } catch { storageAvailable=false; }
  const weeks = [
    {name:'Recalibrate', rir:'3', cue:'Find honest starting loads. Finish every set with about 3 good reps left. Your old calendar targets are not starting weights.'},
    {name:'Build', rir:'2', cue:'Keep the same lifts. Add a rep where you can while keeping 2 good reps in reserve. Add weight only after earning the top of the range.'},
    {name:'Control', rir:'2', cue:'On the two volume days, pause the marked exercise for 1 second. Lower its weight as needed. Keep the main strength lifts unchanged.'},
    {name:'Reload', rir:'4', cue:'Recovery week: about half the working sets. Use lighter loads that leave at least 4 good reps. No extra finishers or make-up sessions.'},
    {name:'Rebuild', rir:'2', cue:'Return to normal sets. Repeat Week 2 loads only if they still fit the effort target. Volume-day accessory variations provide a fresh stimulus.'},
    {name:'Rep best', rir:'1–2', cue:'Try to beat Week 5 by one clean rep at the same load. Stop with 1–2 reps left. No max attempts or forced reps. Review your log before the next block.'}
  ];
  // name, sets, reps, rest seconds, cue, optional pause emphasis
  const upperStrength = [
    ['Barbell bench press',3,'5–8',180,'Use rack safeties or a spotter.'],
    ['Barbell bent-over row',3,'6–8',150,'Brace; keep your torso steady.'],
    ['Barbell overhead press',2,'6–10',150,'No leg drive; use a comfortable range.'],
    ['Supported one-arm Fat Bell row',2,'10–15 / side',90,'Support your free hand on a stable bench.'],
    ['Barbell curl',2,'8–12',75,'Keep elbows still.'],
    ['Close-grip push-up',2,'8–15',75,'Hands slightly inside shoulder width; elevate hands if needed.']
  ];
  const lowerStrength = [
    ['Barbell back squat',3,'5–8',180,'Use rack safeties; controlled depth.'],
    ['Romanian deadlift',3,'6–10',150,'Hips back; stop before your back rounds.'],
    ['Supported split squat',2,'8–12 / leg',90,'Start with bodyweight; add a manageable bell.'],
    ['Standing calf raise',3,'12–20',60,'Use support for balance.'],
    ['Dead bug',2,'8–12 / side',45,'Slow exhale; keep your lower back steady.']
  ];
  const upperVolume = later => [
    ['Barbell incline press',3,'8–12',120,'Low incline; controlled lowering.',true],
    ['Supported one-arm Fat Bell row',3,'10–15 / side',90,'Keep shoulders level.'],
    [later?'Close-grip push-up':'Push-up',2,'10–20',90,'Adjust hand elevation to hit the range without failure.'],
    ['Fat Bell pullover',2,'10–15',90,'Choose a light bell; only a comfortable shoulder range.'],
    [later?'Fat Bell hammer curl':'Barbell curl',2,'10–15',75,'Use a comfortable grip and load.'],
    ['Close-grip bench press',2,'10–12',120,'Use safeties or a spotter; keep wrists stacked.']
  ];
  const lowerVolume = later => [
    ['Fat Bell goblet squat',3,'10–15',120,'Stay braced; use a manageable bell.',true],
    ['Romanian deadlift',3,'10–12',120,'Lighter than the strength session; controlled lowering.'],
    [later?'Supported reverse lunge':'Supported split squat',2,'10–12 / leg',90,'Bodyweight is fine; keep balance and range comfortable.'],
    ['Glute bridge',2,'12–20',75,'Pause at the top; avoid arching your back.'],
    ['Standing calf raise',3,'12–20',60,'Full comfortable range; hold support.'],
    ['Side plank',2,'20–30 sec / side',60,'Stop before your position breaks down.']
  ];
  const verses = ['Proverbs 16:3','Isaiah 41:10','Psalm 46:10','Colossians 3:23','Galatians 6:9','Matthew 11:28','Psalm 118:24'];
  function build(date) {
    if(!valid(date)) throw new Error('Choose a valid start date.');
    return Array.from({length:42},(_,i)=>{
      const w=Math.floor(i/7), d=i%7, phase=weeks[w], deload=w===3, later=w>=4;
      const day=new Date(date+'T12:00:00'); day.setDate(day.getDate()+i);
      const plans=[upperStrength,lowerStrength,null,upperVolume(later),lowerVolume(later),null,null];
      const names=['Upper · Strength','Lower · Strength','Recover · Walk + Mobility','Upper · Volume','Lower · Volume','Recover · Easy Movement','Rest · Reset'];
      const exercises=plans[d];
      return {i,date:iso(day),w:w+1,d:d+1,title:names[d],status:exercises?(deload?'RECOVERY WEEK':'PHASE V · '+phase.name.toUpperCase()):'RECOVERY DAY',
        dateLine:day.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}),verse:verses[(i+w)%7],walk:'5–10 min easy',phase:phase.name,cue:phase.cue,lift:!!exercises,
        ex:exercises?exercises.map(([name,sets,reps,rest,cue,pause])=>[name,`RIR ${phase.rir} · Rest ${rest>=120?rest/60+' min':rest+' sec'} · ${w===2&&pause?'1-sec pause at the bottom; reduce load. ':''}${cue}`,`${deload?Math.ceil(sets/2):sets} × ${reps}`,'Choose by RIR']):[
          [d===6?'Rest or easy walk':'Easy walk','Conversational pace; no vest required.',d===6?'Optional':'15–25 min','Easy'],
          ['Comfortable mobility','Gentle movement only; no loaded finishers.','5–10 min','Optional']
        ],
        note:exercises?'Warm up with 5–10 minutes easy movement, then 2–4 gradually heavier practice sets for the first lift. Warm-ups do not count as work sets. Sharp pain or returning weakness = stop that movement.':'Keep recovery easy. If you miss a lift, continue A → B → C → D at your next session; do not stack missed workouts. Keep at least one rest day between repeated upper or lower sessions.'};
    });
  }
  window.IRONFORM_V5={start,weeks,build,valid,storageAvailable};
  window.IRONFORM_DATA=build(start);
})();
