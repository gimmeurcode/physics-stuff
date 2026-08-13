function buildDescPanel(){
  $('descBody').innerHTML = `
    <label class="chk"><input type="checkbox" id="gdOn"><span>Show the descent walker</span></label>
    <p class="help" id="gdIntro"></p>
    <div class="row"><label class="lb" style="width:70px">Step size η</label><input type="range" id="gdEta" min="0.02" max="1.2" step="0.01"><span class="val" id="gdEtaV"></span></div>
    <div class="row" id="gdModeRow"><label class="lb" style="width:70px">Seek</label>
      <div class="seg" id="gdMode"><button data-m="min" aria-pressed="true">minimum −∇f</button><button data-m="max" aria-pressed="false">maximum +∇f</button></div></div>
    <div class="row wrap">
      <button class="btn pri" id="gdRun">Run</button>
      <button class="btn" id="gdStep">Step once</button>
      <button class="btn" id="gdRestart">Restart at the probe</button>
    </div>
    <label class="chk" id="gdRaceRow"><input type="checkbox" id="gdRace"><span>Race: add a momentum walker from the same start</span></label>
    <div class="row" id="gdBetaRow"><label class="lb" style="width:70px">Memory β</label><input type="range" id="gdBeta" min="0" max="0.98" step="0.01"><span class="val" id="gdBetaV"></span></div>
    <div id="descReadout"></div>

    <div class="card tight" id="gdConCard">
      <div class="ttl">Constrained: minimize on a circle</div>
      <label class="chk"><input type="checkbox" id="gdConOn"><span>Walk the constraint g = x² + y² = R²</span></label>
      <div class="row"><label class="lb" style="width:70px">Radius R</label><input type="range" id="gdConR" min="0.5" max="2.8" step="0.05"><span class="val" id="gdConRv"></span></div>
      <div class="row wrap">
        <button class="btn sm pri" id="gdConRun">Run</button>
        <button class="btn sm" id="gdConReset">Restart near the probe</button>
      </div>
      <div id="gdConReadout"></div>
    </div>

    <div class="card tight" id="gdBasCard">
      <div class="ttl">Basins of attraction</div>
      <p class="help">Colour every starting point by which minimum descent reaches from there. 2D map, scalar fields.</p>
      <div class="row wrap">
        <button class="btn sm pri" id="gdBasGo">Paint the basins</button>
        <button class="btn sm" id="gdBasClear">Clear</button>
      </div>
      <div id="gdBasReadout"></div>
    </div>`;

  $('gdOn').checked=S.show.descent;
  $('gdOn').addEventListener('change', e=>{ S.show.descent=e.target.checked; if(e.target.checked && !S.desc.walkers.length) descReset(); updateLegend(); });
  $('gdEta').value=S.desc.eta; $('gdEtaV').textContent=S.desc.eta.toFixed(2);
  $('gdEta').addEventListener('input', ()=>{ S.desc.eta=+$('gdEta').value; $('gdEtaV').textContent=S.desc.eta.toFixed(2); refreshDescPanel(); });
  for(const b of $('gdMode').children) b.addEventListener('click', ()=>{
    S.desc.mode=b.dataset.m;
    for(const c of $('gdMode').children) c.setAttribute('aria-pressed', String(c===b));
    refreshDescPanel();
  });
  $('gdRun').addEventListener('click', ()=>{
    S.desc.running=!S.desc.running;
    if(S.desc.running){ S.show.descent=true; $('gdOn').checked=true; if(!S.desc.walkers.length) descReset(); }
    refreshDescPanel();
  });
  $('gdStep').addEventListener('click', ()=>{ S.show.descent=true; $('gdOn').checked=true; descStep(); refreshDescPanel(); });
  $('gdRestart').addEventListener('click', ()=>{ descReset(); refreshDescPanel(); });
  $('gdRace').checked=S.desc.race;
  $('gdRace').addEventListener('change', e=>{ S.desc.race=e.target.checked; descReset(); updateLegend(); refreshDescPanel(); });
  $('gdBeta').value=S.desc.beta; $('gdBetaV').textContent=S.desc.beta.toFixed(2);
  $('gdBeta').addEventListener('input', ()=>{ S.desc.beta=+$('gdBeta').value; $('gdBetaV').textContent=S.desc.beta.toFixed(2); });
  $('gdModeRow').style.display = S.mode==='scalar' ? '' : 'none';
  $('gdBetaRow').style.display = S.desc.race ? '' : 'none';

  /* constrained walk — scalar fields on the 2D map */
  const conOK = S.mode==='scalar' && planar();
  $('gdConCard').style.display = conOK ? '' : 'none';
  $('gdConOn').checked=S.con.on;
  $('gdConOn').addEventListener('change', e=>{ S.con.on=e.target.checked; if(e.target.checked && !S.con.pos) conReset(); updateLegend(); });
  $('gdConR').value=S.con.R; $('gdConRv').textContent=S.con.R.toFixed(2);
  $('gdConR').addEventListener('input', ()=>{ S.con.R=+$('gdConR').value; $('gdConRv').textContent=S.con.R.toFixed(2); conReset(); refreshConPanel(); });
  $('gdConRun').addEventListener('click', ()=>{ S.con.on=true; $('gdConOn').checked=true; S.con.running=!S.con.running; refreshConPanel(); });
  $('gdConReset').addEventListener('click', ()=>{ conReset(); refreshConPanel(); });

  /* basins — scalar fields on the 2D map */
  const basOK = S.mode==='scalar' && is2D() && !(S.field && S.field.animated);
  $('gdBasCard').style.display = basOK ? '' : 'none';
  $('gdBasGo').addEventListener('click', ()=>{ basinsStart(); refreshBasinsPanel(); });
  $('gdBasClear').addEventListener('click', ()=>{ S.show.basins=false; S.basins.img=null; S.basins.minima=[]; S.basins.job=null; refreshBasinsPanel(); });

  refreshDescPanel(); refreshConPanel(); refreshBasinsPanel();
}
function refreshDescPanel(){
  const F=S.field; if(!F || !$('gdRun')) return;
  $('gdRun').textContent = S.desc.running ? 'Pause' : 'Run';
  $('gdIntro').innerHTML = S.mode==='scalar'
    ? 'Repeated steps <b>x ← x − η∇f</b>: each move goes straight down the local slope, scaled by the step size. This is the algorithm that trains neural networks.'
    : 'In vector mode the walker follows <b>F</b> itself. That is genuine descent only when F is a gradient — which requires ∇×F = 0. With curl present, the walker orbits.';
  const w0=S.desc.walkers[0];
  if(!w0){ $('descReadout').innerHTML=''; return; }
  const rows=[];
  for(const w of S.desc.walkers){
    const p=w.path[w.path.length-1];
    const g=descDir(p), m=vlen(g);
    const nm = w.method==='momentum' ? 'momentum' : 'plain GD';
    const status = !w.alive ? 'stopped'
      : !Number.isFinite(m) ? 'undefined here'
      : m*S.desc.eta < 1e-4 ? 'converged (∇f ≈ 0)'
      : S.desc.running ? 'walking…' : 'paused';
    rows.push(kv(nm+' · steps', String(w.path.length-1)));
    rows.push(kv(nm+' · position', `(${fmtNear(p.x)}, ${fmtNear(p.y)}${planar()?'':', '+fmtNear(p.z)})`));
    if(F.f) rows.push(kv(nm+' · f here', fmtNear(F.f.ev(p.x,p.y,p.z))));
    rows.push(kv(nm+' · status', status));
  }
  $('descReadout').innerHTML = `<div class="card tight">${rows.join('')}</div>`;
}
function refreshConPanel(){
  if(!$('gdConReadout')) return;
  if(!S.con.on || !S.con.pos){ $('gdConReadout').innerHTML=''; return; }
  const al=conAlignment();
  if(!al){ $('gdConReadout').innerHTML=''; return; }
  const p=S.con.pos;
  $('gdConReadout').innerHTML = `
    ${kv('position on the circle', `(${fmtNear(p.x)}, ${fmtNear(p.y)})`)}
    ${kv('f here', fmtNear(S.field.f ? S.field.f.ev(p.x,p.y,0) : NaN))}
    ${kv('|sin θ| between ∇f and ∇g', fmtNum(al.sin,4))}
    ${kv('λ  (from ∇f = λ∇g)', fmtNear(al.lambda))}
    <p class="help">${al.sin<0.01
      ? 'The gradients are parallel: no tangential descent remains. This is the constrained optimum, and λ is its Lagrange multiplier.'
      : 'While the gradients are not parallel, a component of −∇f still lies along the circle, and the walker slides that way.'}</p>`;
}
function refreshBasinsPanel(){
  if(!$('gdBasReadout')) return;
  if(S.basins.job){
    const j=S.basins.job;
    $('gdBasReadout').innerHTML = `<p class="help">painting… ${Math.round(100*j.i/(j.G*j.G))}%</p>`;
    return;
  }
  if(!S.basins.minima || !S.basins.minima.length){ $('gdBasReadout').innerHTML=''; return; }
  const total=S.basins.minima.reduce((a,m)=>a+m.n,0)||1;
  $('gdBasReadout').innerHTML = '<div class="card tight"><div class="ttl">Minima found</div>' +
    S.basins.minima.map(m=>
      `<div class="kv"><span class="k"><span class="sw" style="display:inline-block;background:${rgbCss(m.col)};margin-right:6px"></span>(${fmtNear(m.x)}, ${fmtNear(m.y)})</span>
       <span class="v">f = ${fmtNear(m.f)} · ${Math.round(100*m.n/total)}%</span></div>`).join('') +
    '<p class="help">The share is the basin’s size — how much of the plane drains to that minimum. The deepest minimum is not necessarily the biggest basin.</p></div>';
}

/* --------------------------------------------------------- panel: display ---- */
