(() => {
  const program=window.IRONFORM_V5, start=document.getElementById('startDate'), status=document.getElementById('programStatus');
  start.value=program.start;
  if(!program.storageAvailable)status.textContent='Storage is unavailable. The start date and notes cannot persist on this device.';
  document.getElementById('startProgram').onclick=()=>{
    if(!program.valid(start.value)){status.textContent='Choose a valid start date.';return;}
    try{localStorage.setItem('ironform:v5:start',start.value);location.hash='';location.reload();}
    catch{status.textContent='Your browser could not save the date. Allow local storage and try again.';}
  };
  const app=document.getElementById('app');
  app.addEventListener('input',e=>{
    if(e.target.id!=='sessionNotes')return;
    const feedback=document.getElementById('noteStatus');
    try{localStorage.setItem(e.target.dataset.key,e.target.value);feedback.textContent='Saved on this device.';}
    catch{feedback.textContent='Could not save. Copy your notes before leaving this page.';}
  });
  window.renderPhaseNotes=d=>{
    const field=document.getElementById('sessionNotes');
    const key=`ironform:v5:notes:${program.start}:${d.i}`;
    field.dataset.key=key;
    try{field.value=localStorage.getItem(key)||'';}catch{document.getElementById('noteStatus').textContent='Storage unavailable; notes will not be saved.';}
    const previous=document.getElementById('previousNotes');
    if(d.i>=7){try{const old=localStorage.getItem(`ironform:v5:notes:${program.start}:${d.i-7}`);if(old){previous.hidden=false;previous.textContent='Last week: '+old;}}catch{}}
    document.querySelectorAll('[data-week]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.week)===d.w)));
  };
})();
