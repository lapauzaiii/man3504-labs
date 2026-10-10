(() => {
  'use strict';
  const slug = document.body.dataset.case;
  const lesson = window.CLASSROOM_CASES[slug];
  const root = document.getElementById('workspace');
  if (!lesson || !root) return;
  const key = 'man3504-classroom-v1-' + slug;
  let storageAvailable = true;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch { storageAvailable = false; }
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = {
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    print:'<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
    reset:'<path d="M3 12a9 9 0 1 0 3-7M3 3v6h6"/>'
  };
  const button = (id,label,icon) => `<button class="tool" id="${id}" type="button" title="${label}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[icon]}</svg>${label}</button>`;
  const fields = lesson.sections.flatMap(s => s.fields);
  document.title = `Week ${lesson.week}: ${lesson.title} | MAN3504`;
  document.getElementById('title').textContent = `Week ${lesson.week}: ${lesson.title}`;
  document.getElementById('subtitle').textContent = `${lesson.company} | Classroom Lab | Fall 2026`;
  const field = ([id,label,type,options]) => {
    const start = `<div class="field ${type === 'textarea' ? 'wide' : ''}"><label for="${id}">${esc(label)}</label>`;
    if (type === 'textarea') return start + `<textarea id="${id}" name="${id}" maxlength="10000"></textarea></div>`;
    if (type === 'select') return start + `<select id="${id}" name="${id}"><option value="">Select a decision</option>${options.map(o=>`<option>${esc(o)}</option>`).join('')}</select></div>`;
    return start + `<input id="${id}" name="${id}" type="${type}" ${type === 'number' ? 'step="any"' : 'maxlength="1000"'}></div>`;
  };
  root.innerHTML = `<p class="notice">Ungraded classroom practice. The independent Canvas application uses a separate case.</p><p>${esc(lesson.intro)}</p>
    <div class="toolbar" aria-label="Work record tools">${button('data','Case data','download')}${button('export','Export work','download')}${button('import','Import work','upload')}${button('print','Print','print')}${button('reset','Reset','reset')}<span class="status" id="status" role="status"></span><input type="file" id="import-file" accept="application/json,.json" hidden></div>
    <section aria-labelledby="case-data"><h2 id="case-data">Case Data</h2>${lesson.tables.map(t=>`<div class="table-wrap"><table><caption>${esc(t.title)}</caption><thead><tr>${t.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${esc(v)}</th>`:`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}${lesson.plot?`<figure><figcaption>${esc(lesson.plot.title)}</figcaption><canvas class="plot" id="plot" role="img" aria-label="${esc(lesson.plot.title)}; exact observations are in the data table above."></canvas></figure>`:''}</section>
    <form id="responses">${lesson.sections.map((s,i)=>`<section aria-labelledby="section-${i}"><h2 id="section-${i}">${i+1}. ${esc(s.title)}</h2>${s.text?`<p>${esc(s.text)}</p>`:''}<div class="fields">${s.fields.map(field).join('')}</div></section>`).join('')}</form>
    <section><h2>Independent Application</h2><p>${esc(lesson.transfer)}</p></section><footer class="footer">MAN3504 | UNF Operations Management | Cowford Holdings | Fall 2026</footer>`;
  const form = document.getElementById('responses');
  function restore(values) { fields.forEach(([id,,type,options]) => {const val=values[id];document.getElementById(id).value= typeof val === 'string' && (type!=='select'||options.includes(val)) ? val : '';}); }
  function collect() { return Object.fromEntries(fields.map(([id]) => [id,document.getElementById(id).value])); }
  function status(message) {
    const completed = Object.values(collect()).filter(v => v.trim() !== '').length;
    document.getElementById('status').textContent = message || `${completed}/${fields.length} responses • ${storageAvailable ? 'Saved on this browser' : 'Browser saving unavailable; export your work'}`;
  }
  function save() { try { localStorage.setItem(key,JSON.stringify(collect())); } catch { storageAvailable=false; } status(); drawWork(); }
  restore(saved && typeof saved === 'object' ? saved : {}); status();
  form.addEventListener('input',save); form.addEventListener('change',save);
  form.addEventListener('submit',event=>event.preventDefault());
  function download(name,type,content) {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  document.getElementById('data').onclick = () => {
    const csvCell = v => '"' + String(v).replace(/"/g,'""') + '"';
    const csv=lesson.tables.map(t=>[[t.title],t.headers,...t.rows].map(row=>row.map(csvCell).join(',')).join('\r\n')).join('\r\n\r\n');
    download(slug+'-data.csv','text/csv;charset=utf-8',csv);
  };
  document.getElementById('export').onclick = () => download(slug+'-work.json','application/json',JSON.stringify({version:1,case:slug,responses:collect()},null,2));
  const picker=document.getElementById('import-file');
  document.getElementById('import').onclick=()=>picker.click();
  picker.onchange=async()=>{
    const file=picker.files[0];if(!file)return;
    try {
      if(file.size>500000)throw new Error('File is too large.');
      const data=JSON.parse(await file.text());
      if(data.version!==1||data.case!==slug||!data.responses||typeof data.responses!=='object'||Array.isArray(data.responses)||Object.values(data.responses).some(v=>typeof v!=='string'||v.length>10000))throw new Error('Choose an exported work file for this lab.');
      if(Object.values(collect()).some(v=>v.trim())&&!confirm('Replace the current responses with the imported work?'))return;
      restore(data.responses);save();status('Imported work restored.');
    } catch(error){status(error.message || 'Could not import work.');}finally{picker.value='';}
  };
  document.getElementById('reset').onclick=()=>{if(confirm('Clear all responses for this lab on this browser?')){restore({});save();}};
  document.getElementById('print').onclick=()=>window.print();
  window.addEventListener('beforeprint',()=>fields.forEach(([id])=>{
    const control=document.getElementById(id),parent=control.parentElement;
    let answer=parent.querySelector('.print-answer');
    if(!answer){answer=document.createElement('div');answer.className='print-answer';parent.append(answer);}
    answer.textContent=control.value || '(No response recorded)';
  }));
  function drawWork() {
    const sets={
      'w9-inventory':[['Baseline ROP','rop'],['Disruption ROP','shock-rop']],
      'w10-lean':[['Baseline PCE','pce'],['Trial PCE','new-pce']],
      'w11-quality':[['Prevention','prevention'],['Appraisal','appraisal'],['Internal failure','internal'],['External failure','external']],
      'w13-sourcing':[['Supplier A','a-tco'],['Supplier B','b-tco']]
    };
    const set=sets[slug];
    if(!set)return;
    let view=document.getElementById('work-comparison');
    if(!view){view=document.createElement('section');view.id='work-comparison';view.innerHTML='<h2>Your Comparison</h2><div class="comparison"></div>';form.after(view);}
    const values=set.map(([label,id])=>({label,value:document.getElementById(id).value}));
    const scale=Math.max(1,...values.map(v=>Number(v.value)||0));
    view.querySelector('.comparison').innerHTML=values.map(v=>`<div class="comparison-row"><span>${esc(v.label)}</span><div class="comparison-track"><div style="width:${v.value!==''?Math.max(0,Number(v.value))/scale*100:0}%"></div></div><strong>${v.value!==''?esc(v.value):'—'}</strong></div>`).join('');
  }
  function draw() {
    if(!lesson.plot)return;
    const canvas=document.getElementById('plot'),box=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;
    canvas.width=Math.round(box.width*ratio);canvas.height=Math.round(box.height*ratio);
    const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
    const w=box.width,h=box.height,values=lesson.plot.values,min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*0.2,1),low=min-pad,high=max+pad;
    const dark=getComputedStyle(document.body).color;ctx.fillStyle=dark;ctx.font='12px system-ui';
    const x=i=>48+i*(w-66)/Math.max(values.length-1,1),y=v=>h-32-(v-low)/(high-low)*(h-60);
    ctx.strokeStyle='#89939c';ctx.beginPath();ctx.moveTo(48,18);ctx.lineTo(48,h-32);ctx.lineTo(w-18,h-32);ctx.stroke();
    for(let i=0;i<4;i++){const value=low+i*(high-low)/3;ctx.fillText(value.toFixed(1),3,y(value)+4);}
    ctx.strokeStyle='#067c86';ctx.lineWidth=2;ctx.beginPath();values.forEach((v,i)=>i?ctx.lineTo(x(i),y(v)):ctx.moveTo(x(i),y(v)));ctx.stroke();
    values.forEach((v,i)=>{ctx.fillStyle='#067c86';ctx.beginPath();ctx.arc(x(i),y(v),3,0,Math.PI*2);ctx.fill();ctx.fillStyle=dark; if(values.length<=8||i%4===0)ctx.fillText(String(i+1),x(i)-3,h-12);});
  }
  draw();drawWork();window.addEventListener('resize',draw);window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',draw);
})();
