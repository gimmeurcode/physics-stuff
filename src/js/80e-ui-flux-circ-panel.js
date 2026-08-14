function buildFluxPanel(){
  $('fluxBody').innerHTML = `
    <label class="chk"><input type="checkbox" id="fxOn"><span>Show the flux region</span></label>
    <p class="help">Divergence is <b>defined</b> as the flux out of a closed surface per unit volume, in the limit as the region shrinks to the point. This measures that flux numerically and compares it with the symbolic derivative.</p>
    <div class="row" id="fxShapeRow"><label class="lb" style="width:52px">Shape</label>
      <div class="seg" id="fxShape"><button data-s="box" aria-pressed="true">Cube</button><button data-s="sphere" aria-pressed="false">Sphere</button></div></div>
    <div class="row"><label class="lb" style="width:52px">Size</label><input type="range" id="fxH" min="0.05" max="1.6" step="0.01"><span class="val" id="fxHv"></span></div>
    <div class="row"><label class="lb" style="width:52px">Samples</label><input type="range" id="fxM" min="3" max="20" step="1"><span class="val" id="fxMv"></span></div>
    <div id="fluxReadout"></div>
    <button class="btn wide" id="fxShrink">Shrink the region and watch it converge</button>
    <div id="fxConv"></div>`;
  $('fxOn').checked = S.show.flux;
  $('fxOn').addEventListener('change', e=>{ S.show.flux=e.target.checked; });
  for(const b of $('fxShape').children) b.addEventListener('click', ()=>{
    S.flux.shape=b.dataset.s;
    for(const c of $('fxShape').children) c.setAttribute('aria-pressed', String(c===b));
    inst.flux=null; refreshFluxPanel();
  });
  $('fxH').value=S.flux.h; $('fxM').value=S.flux.m;
  $('fxH').addEventListener('input', e=>{ S.flux.h=+e.target.value; inst.flux=null; refreshFluxPanel(); });
  $('fxM').addEventListener('input', e=>{ S.flux.m=+e.target.value; inst.flux=null; refreshFluxPanel(); });
  $('fxShrink').addEventListener('click', runShrink);
}
function refreshFluxPanel(){
  const F=S.field; if(!F || !$('fxH')) return;
  $('fxHv').textContent = S.flux.h.toFixed(2);
  const shRow=$('fxShapeRow'); if(shRow) shRow.style.display = planar() ? 'none' : '';
  $('fxMv').textContent = planar() ? (S.flux.m*2)+'/edge' : S.flux.m + (S.flux.shape==='box'?'²/face':'×2');
  recomputeInstruments();
  const p=S.probe, res=inst.flux, flat=planar();
  const exact = flat ? F.div2.ev(p.x,p.y,0) : F.divAt(p.x,p.y,p.z);
  const ratio = res.total/res.volume;
  const err = Math.abs(ratio-exact), rel = err/Math.max(1e-12, Math.abs(exact));
  $('fluxReadout').innerHTML = `<div class="card tight">
    ${kv(flat ? 'flux Φ = ∮ F·n̂ ds' : 'flux Φ = ∯ F·n̂ dS', fmtNear(res.total))}
    ${kv(flat ? 'enclosed area A' : 'volume V', fmtNear(res.volume))}
    ${kv(flat ? 'Φ / A  (measured)' : 'Φ / V  (measured)', '<b>'+fmtNear(ratio)+'</b>')}
    ${kv((flat?'2D ':'')+'∇·F at the centre (exact)', '<b>'+fmtNear(exact)+'</b>')}
    ${kv('difference', fmtNear(err) + (Math.abs(exact)>1e-9 ? '  ('+fmtNum(rel*100,3)+'%)' : ''))}
    <p class="help">${res.total>1e-9?'More flows out than in — a net <b>source</b> inside.':res.total<-1e-9?'More flows in than out — a net <b>sink</b> inside.':'In and out balance exactly.'} ${flat?'The closed surface is a closed <b>curve</b> here, so this is a line integral over the four edges — and Φ/A → ∂P/∂x + ∂Q/∂y.':'Shrink the region and Φ/V closes on the exact value.'}</p>
  </div>`;
}
function runShrink(){
  const F=S.field, p=S.probe, flat=planar();
  const exact = flat ? F.div2.ev(p.x,p.y,0) : F.divAt(p.x,p.y,p.z);
  const rows=[];
  for(const h of [1.2,0.8,0.5,0.3,0.18,0.1,0.05,0.02]){
    const r = flat ? fluxRect(F,p,h,24)
                   : (S.flux.shape==='box' ? fluxBox(F,p,h,12) : fluxSphere(F,p,h,16));
    const ratio=r.total/r.volume;
    rows.push(`<tr><td>${h.toFixed(2)}</td><td>${fmtNear(r.total)}</td><td>${fmtNear(ratio)}</td><td>${fmtNum(Math.abs(ratio-exact),3)}</td></tr>`);
  }
  $('fxConv').innerHTML = `<div class="card tight"><div class="ttl">Φ / V as the region shrinks</div>
    <div class="mat-wrap"><table class="mat">
    <tr><td class="hd">size</td><td class="hd">Φ</td><td class="hd">Φ/V</td><td class="hd">error</td></tr>
    ${rows.join('')}</table></div>
    <p class="help">Converging on ∇·F = <b>${fmtNear(exact)}</b>. That limit is the definition; the coordinate formula is the theorem.</p></div>`;
}

/* ------------------------------------------------------ panel: circulation ---- */
function buildCircPanel(){
  $('circBody').innerHTML = `
    <label class="chk"><input type="checkbox" id="ciOn"><span>Show the circulation loop</span></label>
    <p class="help">Curl is <b>defined</b> one direction at a time: (∇×F)·n̂ is the circulation around a small loop with normal n̂, per unit area, as the loop shrinks.</p>
    <div class="row"><label class="lb" style="width:52px">Radius</label><input type="range" id="ciR" min="0.05" max="1.6" step="0.01"><span class="val" id="ciRv"></span></div>
    <div class="row" id="ciNormalRow"><label class="lb" style="width:52px">Normal n̂</label>
      <input class="num" id="cnx"><input class="num" id="cny"><input class="num" id="cnz"></div>
    <div class="row wrap" id="ciSnapRow">
      <button class="btn sm" data-n="x">x̂</button><button class="btn sm" data-n="y">ŷ</button>
      <button class="btn sm" data-n="z">ẑ</button><button class="btn sm pri" data-n="curl">align with ∇×F</button>
    </div>
    <label class="chk"><input type="checkbox" id="ciPaddle"><span>Spin the paddle wheel</span></label>
    <div id="circReadout"></div>
    <div id="ciSweep"></div>
    <button class="btn wide" id="ciSweepBtn">Sweep n̂ through every direction</button>`;
  $('ciOn').checked=S.show.circ;
  $('ciOn').addEventListener('change', e=>{ S.show.circ=e.target.checked; });
  $('ciPaddle').checked=S.circ.paddle;
  $('ciPaddle').addEventListener('change', e=>{ S.circ.paddle=e.target.checked; });
  $('ciR').value=S.circ.r;
  $('ciR').addEventListener('input', e=>{ S.circ.r=+e.target.value; inst.circ=null; refreshCircPanel(); });
  /* ctlParse rather than parseFloat, and for the same two reasons as û in
     80c-ui-probe-panel.js: a reader may type 1/sqrt(2), and parseFloat could
     not read back the U+2212 the box itself had been filled with. */
  for(const id of ['cnx','cny','cnz']) $(id).addEventListener('change', ()=>{
    const num = i => { const v = ctlParse($(i).value); return Number.isFinite(v) ? v : 0; };
    S.circ.n = v3(num('cnx'), num('cny'), num('cnz'));
    if(vlen(S.circ.n)<1e-9) S.circ.n=v3(0,0,1);
    inst.circ=null; refreshCircPanel();
  });
  for(const b of $('circBody').querySelectorAll('button[data-n]')) b.addEventListener('click', ()=>{
    const k=b.dataset.n;
    if(k==='curl'){
      const c=S.field.curlAt(S.probe.x,S.probe.y,S.probe.z);
      S.circ.n = vlen(c)>1e-9 ? vnorm(c) : v3(0,0,1);
    } else S.circ.n = v3(k==='x'?1:0, k==='y'?1:0, k==='z'?1:0);
    inst.circ=null; refreshCircPanel();
  });
  $('ciSweepBtn').addEventListener('click', runSweep);
}
function refreshCircPanel(){
  const F=S.field; if(!F || !$('ciR')) return;
  $('ciRv').textContent = S.circ.r.toFixed(2);
  const flat=planar();
  const n = flat ? v3(0,0,1) : vnorm(S.circ.n);
  const nRow = $('ciNormalRow'); if(nRow) nRow.style.display = flat ? 'none' : '';
  const nBtns = $('ciSnapRow');  if(nBtns) nBtns.style.display = flat ? 'none' : '';
  const swBtn = $('ciSweepBtn'); if(swBtn) swBtn.style.display = flat ? 'none' : '';
  if(flat){
    recomputeInstruments();
    const p=S.probe, res=inst.circ, exact=F.curl2.ev(p.x,p.y,0);
    const ratio=res.total/res.area;
    $('circReadout').innerHTML = `<div class="card tight">
      ${kv('circulation Γ = ∮ F·dr', fmtNear(res.total))}
      ${kv('area A', fmtNear(res.area))}
      ${kv('Γ / A  (measured)', '<b>'+fmtNear(ratio)+'</b>')}
      ${kv('2D curl ∂Q/∂x − ∂P/∂y (exact)', '<b>'+fmtNear(exact)+'</b>')}
      ${kv('difference', fmtNear(Math.abs(ratio-exact)))}
      ${kv('paddle wheel rate', fmtNear(exact/2)+' rad/s')}
      <p class="help">In the plane there is only one orientation available, so the curl needs no normal vector — it is the single number <b>Γ/A</b>. Together with the flux version this is <b>Green's theorem</b>.</p>
    </div>`;
    $('ciSweep').innerHTML='';
    return;
  }
  /* editable boxes hold ASCII their own handler can parse — see fmtEdit. Eight
     figures for the same reason as û in 80c: this box is what a permalink
     carries, and four figures moved the circulation printed beside it. */
  for(const [id, v] of [['cnx', n.x], ['cny', n.y], ['cnz', n.z]])
    if($(id) !== document.activeElement) $(id).value = fmtEdit(v, 8);
  recomputeInstruments();
  const p=S.probe, res=inst.circ;
  const cu=F.curlAt(p.x,p.y,p.z), exact=vdot(cu,n);
  const ratio=res.total/res.area, err=Math.abs(ratio-exact);
  const align = vlen(cu)>1e-9 ? vdot(vnorm(cu), n) : 0;
  $('circReadout').innerHTML = `<div class="card tight">
    ${kv('circulation Γ = ∮ F·dr', fmtNear(res.total))}
    ${kv('area A', fmtNear(res.area))}
    ${kv('Γ / A  (measured)', '<b>'+fmtNear(ratio)+'</b>')}
    ${kv('(∇×F)·n̂  (exact)', '<b>'+fmtNear(exact)+'</b>')}
    ${kv('difference', fmtNear(err))}
    ${kv('paddle wheel rate', fmtNear(exact/2)+' rad/s')}
    <div class="row" style="margin-top:2px"><span class="k" style="font-size:11.5px;color:var(--faint)">n̂ vs ∇×F</span>
      <div class="bar grow"><i style="background:var(--c-curl);left:${(50-Math.abs(Math.min(0,align))*50).toFixed(1)}%;width:${(Math.abs(align)*50).toFixed(1)}%"></i></div>
      <span class="val">${fmtNum(align,3)}</span></div>
    <p class="help">${Math.abs(align)>0.98?'n̂ is aligned with the curl — this is the orientation of <b>maximum</b> spin.':Math.abs(align)<0.03?'n̂ is perpendicular to the curl — the loop feels <b>no</b> net circulation.':'Tilt n̂ toward ∇×F and the circulation grows as the cosine of the angle between them.'}</p>
  </div>`;
}
function runSweep(){
  const F=S.field, p=S.probe, cu=F.curlAt(p.x,p.y,p.z);
  const dirs=[['x̂',v3(1,0,0)],['ŷ',v3(0,1,0)],['ẑ',v3(0,0,1)],['∇×F',vlen(cu)>1e-9?vnorm(cu):v3(0,0,1)],['⊥ ∇×F',vlen(cu)>1e-9?vperp(vnorm(cu)):v3(1,0,0)]];
  const rows=dirs.map(([nm,n])=>{
    const r=circulation(F,p,S.circ.r,n,128);
    return `<tr><td class="hd" style="text-align:left">${nm}</td><td>${fmtNear(r.total)}</td><td>${fmtNear(r.total/r.area)}</td><td>${fmtNear(vdot(cu,n))}</td></tr>`;
  }).join('');
  $('ciSweep').innerHTML=`<div class="card tight"><div class="ttl">Circulation for different loop orientations</div>
    <div class="mat-wrap"><table class="mat"><tr><td class="hd">n̂</td><td class="hd">Γ</td><td class="hd">Γ/A</td><td class="hd">(∇×F)·n̂</td></tr>${rows}</table></div>
    <p class="help">Largest when n̂ ∥ ∇×F, exactly zero when n̂ ⊥ ∇×F. That is what makes the curl a <b>vector</b>: one number per orientation, all of them read off a single arrow.</p></div>`;
}

/* ------------------------------------------------------- panel: test particle ---- */
