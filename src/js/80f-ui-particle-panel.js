function buildPartPanel(){
  $('partBody').innerHTML = `
    <p class="help" id="ptIntro"></p>
    <div class="row" id="ptInterpRow"><label class="lb" style="width:70px">Field is</label>
      <div class="seg" id="ptInterp">
        <button data-i="force" aria-pressed="true">a force F</button>
        <button data-i="lorentz" aria-pressed="false">magnetic B (q v×B)</button>
      </div></div>
    <div class="row" id="ptERow"><label class="lb" style="width:70px">Uniform E</label>
      <input class="num" id="ptEx"><input class="num" id="ptEy"><input class="num" id="ptEz"></div>
    <div class="row"><label class="lb" style="width:70px">m, q</label>
      <input class="num" id="ptM" title="mass"><input class="num" id="ptQ" title="charge"></div>
    <div class="row"><label class="lb" style="width:70px">Launch v</label>
      <input class="num" id="ptVx"><input class="num" id="ptVy"><input class="num" id="ptVz"></div>
    <div class="row"><label class="lb" style="width:70px">Sim speed</label><input type="range" id="ptSpeed" min="0.2" max="5" step="0.1"><span class="val" id="ptSpeedV"></span></div>
    <div class="row wrap">
      <button class="btn pri" id="ptLaunch">Launch from the probe</button>
      <button class="btn" id="ptRun">Pause</button>
      <button class="btn" id="ptClear">Clear</button>
    </div>
    <div id="ptReadout"></div>`;
  for(const b of $('ptInterp').children) b.addEventListener('click', ()=>{
    S.part.interp=b.dataset.i;
    for(const c of $('ptInterp').children) c.setAttribute('aria-pressed', String(c===b));
    buildPartPanel();
  });
  const num=(id,get,set)=>{ const e=$(id); e.value=num2s(get());
    e.addEventListener('change', ()=>{ const v=parseFloat(e.value); if(Number.isFinite(v)) set(v); }); };
  num('ptEx', ()=>S.part.E.x, v=>S.part.E.x=v);
  num('ptEy', ()=>S.part.E.y, v=>S.part.E.y=v);
  num('ptEz', ()=>S.part.E.z, v=>S.part.E.z=v);
  num('ptM', ()=>S.part.m, v=>{ if(v>0) S.part.m=v; });
  num('ptQ', ()=>S.part.q, v=>S.part.q=v);
  num('ptVx', ()=>S.part.v.x, v=>S.part.v.x=v);
  num('ptVy', ()=>S.part.v.y, v=>S.part.v.y=v);
  num('ptVz', ()=>S.part.v.z, v=>S.part.v.z=v);
  $('ptSpeed').value=S.part.simSpeed; $('ptSpeedV').textContent=S.part.simSpeed.toFixed(1)+'×';
  $('ptSpeed').addEventListener('input', ()=>{ S.part.simSpeed=+$('ptSpeed').value; $('ptSpeedV').textContent=S.part.simSpeed.toFixed(1)+'×'; });
  $('ptLaunch').addEventListener('click', ()=>{ partLaunch(); refreshPartPanel(); updateLegend(); });
  $('ptRun').addEventListener('click', ()=>{ S.part.run=!S.part.run; $('ptRun').textContent=S.part.run?'Pause':'Run'; });
  $('ptClear').addEventListener('click', ()=>{ S.part.bodies=[]; refreshPartPanel(); updateLegend(); });
  $('ptInterpRow').style.display = S.mode==='vector' ? '' : 'none';
  $('ptERow').style.display = (S.mode==='vector' && S.part.interp==='lorentz') ? '' : 'none';
  refreshPartPanel();
}
function refreshPartPanel(){
  if(!$('ptReadout')) return;
  $('ptIntro').innerHTML = S.mode==='scalar'
    ? 'The scalar field is read as <b>potential energy</b>: the particle feels F = −∇f, so it accelerates downhill. Watch E = ½m|v|² + f stay frozen while KE and U trade — conservation of energy, live.'
    : S.part.interp==='lorentz'
      ? 'The field is read as <b>B</b> and the particle feels the Lorentz force q(E + v×B). In the 2D map only B<sub>z</sub> (the R component) acts. Magnetic force is ⊥ v, so it steers without doing work — speed stays constant.'
      : 'The field is read as a <b>force</b>: a = F/m at every instant, integrated by RK4. The trail is x(t) — kinematics drawn by Newton’s 2nd law.';
  $('tagPart').textContent = S.part.bodies.length ? String(S.part.bodies.length) : '';
  const b=S.part.bodies[S.part.bodies.length-1];
  if(!b){ $('ptReadout').innerHTML=''; return; }
  const en=partEnergy(b), Lz=partLz(b);
  const drift = (b.E0!==null && Number.isFinite(b.E0) && Math.abs(b.E0)>1e-9 && en.U!==null)
    ? Math.abs((en.E-b.E0)/b.E0) : null;
  $('ptReadout').innerHTML = `<div class="card tight">
    ${kv('position', `(${fmtNear(b.x.x)}, ${fmtNear(b.x.y)}${planar()?'':', '+fmtNear(b.x.z)})`)}
    ${kv('speed |v|', fmtNear(vlen(b.v)))}
    ${kv('kinetic ½m|v|²', fmtNear(en.KE))}
    ${en.U!==null ? kv('potential f', fmtNear(en.U)) : ''}
    ${en.U!==null ? kv('total E (should be constant)', '<b>'+fmtNear(en.E)+'</b>') : ''}
    ${drift!==null ? kv('energy drift', fmtNum(drift*100,2)+'%') : ''}
    ${kv('angular momentum L<sub>z</sub>', fmtNear(Lz))}
    ${kv('status', b.alive ? (S.part.run?'moving':'paused') : 'left the domain / undefined')}
  </div>
  <p class="help">${S.mode==='scalar'
    ? 'L<sub>z</sub> is conserved only when the force is central (F ∥ r): compare a round bowl with a lopsided one.'
    : S.part.interp==='lorentz' ? 'Radius check: r = m·v⊥ / (q·B). Double the speed, double the circle.'
    : 'Impulse in action: v changes exactly as fast as F/m dictates.'}</p>`;
}

/* ---------------------------------------------------- panel: optimization lab ---- */
