const PHYS_PRESETS = [
  {n:'Single charge +q', view:'3d', objects:[{type:'charge', q:1, pos:{x:0,y:0,z:0}}]},
  {n:'Dipole: +q and −q', view:'3d', objects:[
    {type:'charge', q:1, pos:{x:0.8,y:0,z:0}}, {type:'charge', q:-1, pos:{x:-0.8,y:0,z:0}}]},
  {n:'Two like charges', view:'2d', objects:[
    {type:'charge', q:1, pos:{x:1,y:0,z:0}}, {type:'charge', q:1, pos:{x:-1,y:0,z:0}}]},
  {n:'Charge in a uniform field', view:'2d', objects:[
    {type:'charge', q:1, pos:{x:0,y:0,z:0}}, {type:'uniform', v:{x:-0.35,y:0,z:0}, pos:{x:0,y:0,z:0}}]},
  {n:'Line of current', view:'3d', objects:[{type:'wire', I:1, axis:'z', pos:{x:0,y:0,z:0}}]},
  {n:'Two wires, parallel currents', view:'2d', objects:[
    {type:'wire', I:1, axis:'z', pos:{x:1,y:0,z:0}}, {type:'wire', I:1, axis:'z', pos:{x:-1,y:0,z:0}}]},
  {n:'Two wires, antiparallel', view:'2d', objects:[
    {type:'wire', I:1, axis:'z', pos:{x:1,y:0,z:0}}, {type:'wire', I:-1, axis:'z', pos:{x:-1,y:0,z:0}}]},
  {n:'Bar magnet (ideal dipole)', view:'3d', objects:[{type:'dipole', m:1, axis:'z', pos:{x:0,y:0,z:0}}]},
  {n:'Point mass — a gravity field', view:'3d', objects:[{type:'mass', M:1, pos:{x:0,y:0,z:0}}]},
  {n:'Binary system: two masses', view:'2d', objects:[
    {type:'mass', M:1, pos:{x:1,y:0,z:0}}, {type:'mass', M:0.4, pos:{x:-1.2,y:0,z:0}}]},
  {n:'One antenna, radiating', view:'2d', objects:[{type:'antenna', A:1, k:4, phi:0, pos:{x:0,y:0}}]},
  {n:'Two antennas: interference', view:'2d', objects:[
    {type:'antenna', A:1, k:4, phi:0, pos:{x:0,y:0.8}}, {type:'antenna', A:1, k:4, phi:0, pos:{x:0,y:-0.8}}]},
  {n:'Phased array, broadside (Δφ = 0)', view:'2d', objects:[{type:'array', N:5, d:0.8, axis:'y', k:4, dphi:0, pos:{x:0,y:0}}]},
  {n:'Phased array, steered (Δφ = 1.9)', view:'2d', objects:[{type:'array', N:5, d:0.8, axis:'y', k:4, dphi:1.9, pos:{x:0,y:0}}]}
];

function physApply(){
  if(!S.phys.objects.length){ S.phys.applied=false; refreshPhysPanel(); return; }
  const built = physBuild(S.phys.objects);
  if(built.mixed){
    $('tagPhys').textContent='cannot mix';
    return;
  }
  S.mode = built.mode;
  if(built.mode==='scalar') S.src.f = built.src.f;
  else { S.src.P=built.src.P; S.src.Q=built.src.Q; S.src.R=built.src.R; }
  S.phys.applied = true;
  S.presetNote='';
  clearDemoSelection();
  syncFieldInputs();
  applyField();
  refreshPhysPanel();
}
function physRows(){
  return S.phys.objects.map((o,i)=>{
    const del = `<button class="btn sm" data-del="${i}" title="remove">×</button>`;
    const posIn = (ax)=>`<input class="num" data-oi="${i}" data-k="pos.${ax}" value="${num2s(o.pos[ax]||0)}" style="width:46px">`;
    if(o.type==='charge') return `<div class="row wrap"><span class="lb" style="width:52px">charge</span>
      <input class="num" data-oi="${i}" data-k="q" value="${num2s(o.q)}" style="width:46px" title="q">
      ${posIn('x')}${posIn('y')}${posIn('z')} ${del}</div>`;
    if(o.type==='mass') return `<div class="row wrap"><span class="lb" style="width:52px">mass</span>
      <input class="num" data-oi="${i}" data-k="M" value="${num2s(o.M)}" style="width:46px" title="GM">
      ${posIn('x')}${posIn('y')}${posIn('z')} ${del}</div>`;
    if(o.type==='wire') return `<div class="row wrap"><span class="lb" style="width:52px">wire ∥${o.axis}</span>
      <input class="num" data-oi="${i}" data-k="I" value="${num2s(o.I)}" style="width:46px" title="I">
      ${posIn('x')}${posIn('y')}${posIn('z')} ${del}</div>`;
    if(o.type==='dipole') return `<div class="row wrap"><span class="lb" style="width:52px">dipole ∥${o.axis}</span>
      <input class="num" data-oi="${i}" data-k="m" value="${num2s(o.m)}" style="width:46px" title="m">
      ${posIn('x')}${posIn('y')}${posIn('z')} ${del}</div>`;
    if(o.type==='uniform') return `<div class="row wrap"><span class="lb" style="width:52px">uniform</span>
      <input class="num" data-oi="${i}" data-k="v.x" value="${num2s(o.v.x)}" style="width:46px">
      <input class="num" data-oi="${i}" data-k="v.y" value="${num2s(o.v.y)}" style="width:46px">
      <input class="num" data-oi="${i}" data-k="v.z" value="${num2s(o.v.z)}" style="width:46px"> ${del}</div>`;
    if(o.type==='antenna') return `<div class="row wrap"><span class="lb" style="width:52px">antenna</span>
      <input class="num" data-oi="${i}" data-k="k" value="${num2s(o.k)}" style="width:42px" title="k (wavenumber)">
      <input class="num" data-oi="${i}" data-k="phi" value="${num2s(o.phi||0)}" style="width:42px" title="phase φ">
      ${posIn('x')}${posIn('y')} ${del}</div>`;
    if(o.type==='array') return `<div class="row wrap"><span class="lb" style="width:52px">array</span>
      <input class="num" data-oi="${i}" data-k="N" value="${o.N}" style="width:36px" title="N elements">
      <input class="num" data-oi="${i}" data-k="d" value="${num2s(o.d)}" style="width:42px" title="spacing d">
      <input class="num" data-oi="${i}" data-k="dphi" value="${num2s(o.dphi||0)}" style="width:42px" title="phase step Δφ">
      <input class="num" data-oi="${i}" data-k="k" value="${num2s(o.k)}" style="width:36px" title="wavenumber k"> ${del}</div>`;
    return '';
  }).join('');
}
function buildPhysPanel(){
  $('physBody').innerHTML = `
    <p class="help">Place real sources and the field is <b>generated</b> from them: each object contributes its exact formula, superposition is literal addition, and the result is written into the field inputs above — derivations, flux box and circulation loop all keep working on it.</p>
    <select class="sel" id="physPreset">
      <option value="">Load a configuration…</option>
      ${PHYS_PRESETS.map((p,i)=>`<option value="${i}">${esc(p.n)}</option>`).join('')}
    </select>
    <div class="row wrap">
      <button class="btn sm" data-add="charge">+ charge</button>
      <button class="btn sm" data-add="mass">+ mass</button>
      <button class="btn sm" data-add="wire">+ wire</button>
      <button class="btn sm" data-add="dipole">+ dipole</button>
      <button class="btn sm" data-add="uniform">+ uniform</button>
      <button class="btn sm" data-add="antenna">+ antenna</button>
      <button class="btn sm" data-add="array">+ array</button>
    </div>
    <div id="physList"></div>
    <div class="row wrap">
      <button class="btn sm" id="physAtProbe">Move last to the probe</button>
      <button class="btn sm" id="physClear">Clear all</button>
    </div>
    <p class="help" id="physNote"></p>`;
  $('physPreset').addEventListener('change', e=>{
    const i=+e.target.value;
    if(Number.isFinite(i) && PHYS_PRESETS[i]) physLoadPreset(i);
    e.target.value='';
  });
  for(const b of $('physBody').querySelectorAll('button[data-add]')) b.addEventListener('click', ()=>{
    if(S.phys.objects.length>=8) return;
    const t=b.dataset.add, p={x:S.probe.x, y:S.probe.y, z:planar()?0:S.probe.z};
    const defs={
      charge:{type:'charge', q:1, pos:p}, mass:{type:'mass', M:1, pos:p},
      wire:{type:'wire', I:1, axis:'z', pos:{...p, z:0}},
      dipole:{type:'dipole', m:1, axis:'z', pos:p}, uniform:{type:'uniform', v:{x:0.3,y:0,z:0}, pos:{x:0,y:0,z:0}},
      antenna:{type:'antenna', A:1, k:4, phi:0, pos:{x:p.x,y:p.y}}, array:{type:'array', N:4, d:0.8, axis:'y', k:4, dphi:0, pos:{x:0,y:0}}
    };
    S.phys.objects.push(defs[t]);
    physApply();
  });
  $('physAtProbe').addEventListener('click', ()=>{
    const o=S.phys.objects[S.phys.objects.length-1];
    if(!o) return;
    o.pos={x:S.probe.x, y:S.probe.y, z:planar()?0:S.probe.z};
    physApply();
  });
  $('physClear').addEventListener('click', ()=>{
    S.phys.objects=[]; S.phys.applied=false; refreshPhysPanel(); $('tagPhys').textContent='';
  });
  refreshPhysPanel();
}
function refreshPhysPanel(){
  if(!$('physList')) return;
  $('physList').innerHTML = physRows();
  $('tagPhys').textContent = S.phys.objects.length ? (S.phys.objects.length+' object'+(S.phys.objects.length>1?'s':'')) : '';
  const wave = S.phys.objects.some(o=>o.type==='antenna'||o.type==='array');
  $('physNote').innerHTML = !S.phys.objects.length
    ? 'Add an object or load a configuration. Up to 8 objects; the formulas stay readable.'
    : wave
      ? 'Wave sources build a <b>scalar</b> field E<sub>z</sub>(x, y, t) — watch it in the 2D map with the colour layer on, and use the <b>Time</b> control in Display. Phase steps steer the beam.'
      : 'Static sources build a <b>vector</b> field by superposition. Try the flux box around a charge (Gauss) or the loop around a wire (Ampère).';
  for(const inp of $('physList').querySelectorAll('input[data-oi]')) inp.addEventListener('change', ()=>{
    const o=S.phys.objects[+inp.dataset.oi];
    const v=parseFloat(inp.value);
    if(!o || !Number.isFinite(v)) return;
    const k=inp.dataset.k;
    if(k.includes('.')){ const [a,b]=k.split('.'); o[a][b]=v; }
    else o[k] = (k==='N') ? Math.max(2, Math.min(8, Math.round(v))) : v;
    physApply();
  });
  for(const b of $('physList').querySelectorAll('button[data-del]')) b.addEventListener('click', ()=>{
    S.phys.objects.splice(+b.dataset.del,1);
    if(S.phys.objects.length) physApply();
    else { S.phys.applied=false; refreshPhysPanel(); $('tagPhys').textContent=''; }
  });
}
function physLoadPreset(i){
  const p=PHYS_PRESETS[i];
  S.phys.objects = p.objects.map(o=>JSON.parse(JSON.stringify(o)));
  if(p.view && p.view!==S.view){ S.view=p.view; R.mode2d=is2D();
    for(const b of $('viewSeg').children) b.setAttribute('aria-pressed', String(b.dataset.v===S.view));
    if(!is2D()){ R.cam.az=0.72; R.cam.el = S.view==='surf'?0.55:0.42; }
    fitView();
  }
  /* wave presets want the map coloured by the field itself; static ones get
     the textbook field-line picture on top of thinned arrows */
  const wave = S.phys.objects.some(o=>o.type==='antenna'||o.type==='array');
  if(wave){ S.show.slice=true; S.show.level=false; S.show.arrows=false; S.show.stream=false; S.show.fieldlines=false; S.sliceOf='auto'; }
  else { S.show.fieldlines=true; S.show.stream=false; S.density=Math.min(S.density,5); }
  physApply();
}

/* ------------------------------------------------------------ panel: probe ---- */
