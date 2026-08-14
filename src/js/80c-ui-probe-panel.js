function buildProbePanel(){
  $('probeBody').innerHTML = `
    <div class="row"><label class="lb" style="width:12px">x</label><input type="range" id="pbx"><input class="num" id="pbxn"></div>
    <div class="row"><label class="lb" style="width:12px">y</label><input type="range" id="pby"><input class="num" id="pbyn"></div>
    <div class="row" id="pbzRow"><label class="lb" style="width:12px">z</label><input type="range" id="pbz"><input class="num" id="pbzn"></div>
    <p class="help">Click anywhere on the canvas to move the probe within the plane you are looking at.</p>
    <div id="probeReadout"></div>
    <div class="card tight">
      <div class="ttl">Jacobian ∂Fᵢ/∂xⱼ</div>
      <div id="jacTable"></div>
      <p class="help" style="margin-top:2px">Its trace is the divergence. Splitting it into symmetric and antisymmetric halves separates pure stretching from pure rotation.</p>
      <div class="ttl" style="margin-top:4px">Symmetric half — strain</div>
      <div id="symTable"></div>
      <div class="ttl" style="margin-top:4px">Antisymmetric half — rotation</div>
      <div id="skewTable"></div>
    </div>`;
  const bind = (sl, nu, key) => {
    const s=$(sl), n=$(nu);
    s.min=-S.extent; s.max=S.extent; s.step=0.02;
    /* fmtEdit, not fmtNear: this box is typed into, and fmtNear goes through
       fmtNum, so a negative coordinate opened as −0.9 with a U+2212 that
       parseFloat below reads as NaN. Editing round it then did nothing at all —
       the guard swallowed it — and the probe stayed where it was. */
    s.value=S.probe[key]; n.value=fmtEdit(S.probe[key], 6);
    /* one formatter for both paths: the box used to be filled by .toFixed(2)
       when the slider moved and by the formatter above when the panel rebuilt,
       so the same probe position read as -0.90 or -0.9 depending on how it got
       there — two strings for one number, and a permalink carries whichever
       happened to be showing */
    s.addEventListener('input', ()=>{ S.probe[key]=+s.value; n.value=fmtEdit(+s.value, 6); onProbeMoved(); });
    n.addEventListener('change', ()=>{ const v=ctlParse(n.value); if(Number.isFinite(v)){ S.probe[key]=v; s.value=v; onProbeMoved(); } });
  };
  bind('pbx','pbxn','x'); bind('pby','pbyn','y'); bind('pbz','pbzn','z');
}

/* --------------------------------------------- panel: directional derivative ---- */
function buildDirPanel(){
  $('dirBody').innerHTML = `
    <label class="chk"><input type="checkbox" id="ddOn"><span>Show the directional-derivative diagram</span></label>
    <p class="help" id="ddIntro"></p>
    <div class="row"><label class="lb" style="width:38px">û</label>
      <input class="num" id="du"><input class="num" id="dv"><input class="num" id="dw"></div>
    <div class="row"><label class="lb" style="width:38px">Angle</label><input type="range" id="ddAng" min="0" max="360" step="1"><span class="val" id="ddAngv"></span></div>
    <p class="help">The slider swings û around the plane the diagram is drawn in, so you can watch the value trace out the cosine.</p>
    <div class="row wrap">
      <button class="btn sm" data-u="x">x̂</button><button class="btn sm" data-u="y">ŷ</button>
      <button class="btn sm" data-u="z">ẑ</button>
      <button class="btn sm pri" data-u="max">steepest</button>
      <button class="btn sm" data-u="zero">level</button>
    </div>
    <div id="ddReadout"></div>
    <div id="ddSweep"></div>`;
  $('ddOn').checked = S.show.dirderiv;
  $('ddOn').addEventListener('change', e=>{ S.show.dirderiv=e.target.checked; updateLegend(); });
  /* ctlParse, not parseFloat: these boxes are typed into, and every other
     numeric box in the laboratory accepts 1/sqrt(2) and π/4. parseFloat also
     could not read the box's OWN previous contents once they were negative —
     see fmtEdit in 10-math.js for what that cost. */
  for(const id of ['du','dv','dw']) $(id).addEventListener('change', ()=>{
    const num = i => { const v = ctlParse($(i).value); return Number.isFinite(v) ? v : 0; };
    const u=v3(num('du'), num('dv'), num('dw'));
    S.dirU = vlen(u)>1e-9 ? vnorm(u) : v3(1,0,0);
    refreshDirPanel();
  });
  $('ddAng').addEventListener('input', ()=>{
    const t=(+$('ddAng').value)*Math.PI/180;
    /* rotate within the current plane, keeping the plane itself fixed */
    S.dirU = vnorm(vadd(vmul(ddPlane.a, Math.cos(t)), vmul(ddPlane.b, Math.sin(t))));
    refreshDirPanel(true);
  });
  for(const b of $('dirBody').querySelectorAll('button[data-u]')) b.addEventListener('click', ()=>{
    const k=b.dataset.u, d=dirData();
    if(k==='max')       S.dirU = vlen(d.ref)>1e-9 ? vnorm(d.ref) : v3(1,0,0);
    else if(k==='zero'){ const pl=rosePlane(d); S.dirU = vlen(d.ref)>1e-9 ? vnorm(vcross(vnorm(vcross(pl.a,pl.b)), d.ref)) : v3(0,1,0); }
    else S.dirU = v3(k==='x'?1:0, k==='y'?1:0, k==='z'?1:0);
    refreshDirPanel();
  });
}
/* the plane the angle slider sweeps in; frozen while dragging so it stays stable */
let ddPlane = {a:v3(1,0,0), b:v3(0,1,0)};
function refreshDirPanel(keepPlane){
  const F=S.field; if(!F || !$('du')) return;
  const d=dirData();
  if(!keepPlane){ ddPlane = rosePlane(d); $('ddAng').value = 0; $('ddAngv').textContent='0°'; }
  else $('ddAngv').textContent = $('ddAng').value+'°';

  /* fmtEdit, not fmtNum: these are editable boxes and must hold something their
     own change handler can read back. Never over the top of whoever is typing —
     the same rule wireSlider's typed box follows.

     Eight figures rather than the four these used to show, because the box is
     now also what a permalink carries: û rounded to four figures reproduced a
     directional derivative that differed in the fourth figure it is PRINTED to,
     so a shared link showed a slightly different number from the one its author
     was looking at. Eight leaves four orders of margin under the printed
     precision and is still short enough to read. */
  for(const [id, v] of [['du', d.u.x], ['dv', d.u.y], ['dw', d.u.z]])
    if($(id) !== document.activeElement) $(id).value = fmtEdit(v, 8);
  $('ddIntro').innerHTML = F.f
    ? 'How fast <b>f</b> changes as you step along û. It equals ∇f·û, so the picture is exactly the projection of ∇f onto û — the thick bar is the value.'
    : 'How fast <b>F</b> changes along û. The vector (û·∇)F = J û is the full rate of change; the thick bar is its component along û — the stretching rate in that direction.';

  const cosang = d.max>1e-12 ? d.value/d.max : 0;
  const cu = F.curlAt(S.probe.x,S.probe.y,S.probe.z);
  $('ddReadout').innerHTML = `<div class="card tight">
    ${kv(d.valName, '<b>'+fmtNear(d.value)+'</b>')}
    ${kv('largest possible ( û ∥ '+d.refName+' )', fmtNear(d.max))}
    ${kv('smallest possible', fmtNear(-d.max))}
    ${kv('cos of the angle between them', fmtNum(cosang,3))}
    ${F.f ? kv('|∇f|', fmtNear(d.max)) : vecRow('(û·∇)F = J û', d.Ju)}
    ${kv('(∇×'+fieldLabel(F)+') · û', fmtNear(vdot(cu,d.u)))}
    <div class="row" style="margin-top:2px"><span class="k" style="font-size:11.5px;color:var(--faint)">rate</span>
      <div class="bar grow"><i style="background:${d.value>=0?'var(--c-pos)':'var(--c-neg)'};left:${(50+Math.min(0,cosang)*50).toFixed(1)}%;width:${(Math.abs(cosang)*50).toFixed(1)}%"></i></div>
      <span class="val">${fmtNum(cosang,3)}</span></div>
    <p class="help">${Math.abs(cosang)>0.99 ? ('û is aligned with '+d.refName+' — this is the '+(d.value>=0?'largest':'smallest')+' rate available at this point.') : Math.abs(cosang)<0.02 ? 'û lies along a level set: stepping this way changes nothing, to first order.' : ('Rotate û toward '+d.refName+' and the value grows as the cosine of the angle.')}</p>
  </div>`;

  const dirs=[['x̂',v3(1,0,0)],['ŷ',v3(0,1,0)],['ẑ',v3(0,0,1)],
              [d.refName+' direction', vlen(d.ref)>1e-9?vnorm(d.ref):v3(1,0,0)],
              ['opposite', vlen(d.ref)>1e-9?vmul(vnorm(d.ref),-1):v3(-1,0,0)]];
  $('ddSweep').innerHTML = `<div class="card tight"><div class="ttl">The rate in several directions</div>
    <div class="mat-wrap"><table class="mat"><tr><td class="hd">û</td><td class="hd">${d.valName.replace(/<[^>]*>/g,'')}</td><td class="hd">cos θ</td></tr>
    ${dirs.map(([nm,w])=>{const val=dirValueAlong(vnorm(w));return `<tr><td class="hd" style="text-align:left">${nm}</td><td>${fmtNear(val)}</td><td>${fmtNum(d.max>1e-12?val/d.max:0,3)}</td></tr>`;}).join('')}
    </table></div></div>`;

  /* This function is what runs whenever û moves — the angle slider, the three
     boxes and the five snap buttons all end here — and it used to leave the two
     places the same number is ALSO printed untouched. Both were refreshed only
     by refreshProbe(), so swinging û redrew the arrow on the canvas while the
     chip and the panel's own tag kept a Dû belonging to a direction no longer
     on screen. For a static field nothing ever corrected them: frame() calls
     updateChip() only for an animated one.

     Found by ./auditlink.ps1 — a permalink restored û exactly, refreshed the
     chip on the way in, and so disagreed with the stale chip it was compared
     against. The link was right and the laboratory was wrong. */
  $('tagDir').textContent = fmtNear(d.value);
  updateChip();
}
function syncProbeInputs(){
  for(const [s,n,k] of [['pbx','pbxn','x'],['pby','pbyn','y'],['pbz','pbzn','z']]){
    $(s).min=-S.extent; $(s).max=S.extent; $(s).value=S.probe[k]; $(n).value=S.probe[k].toFixed(2);
  }
  $('pbzRow').style.display = S.dim===2 ? 'none' : '';
}

function refreshProbe(){
  const F=S.field; if(!F) return;
  const p=S.probe, x=p.x, y=p.y, z=p.z;
  const Fv=F.at(x,y,z), cu=F.curlAt(x,y,z), dv=F.divAt(x,y,z);
  const lbl=fieldLabel(F);

  const flat = planar();
  const dv2 = F.div2.ev(x,y,0), cu2 = F.curl2.ev(x,y,0);
  const dShow = flat ? dv2 : dv;
  /* honesty badge: this quantity fell back to finite differences */
  const numTag = e => e && e.numeric ? ' <span class="tag" style="font-weight:400">≈ numeric</span>' : '';
  const divTag  = numTag(flat ? F.div2 : F.div);
  const curlTag = (flat ? F.curl2.numeric : F.curl.some(c=>c.numeric)) ? numTag({numeric:true}) : '';

  let html = '';
  if(F.f) html += `<div class="card tight"><div class="ttl">Scalar field</div>${kv('f (x, y'+(flat?'':', z')+')', fmtNear(F.f.ev(x,y,z)))}</div>`;
  html += `<div class="card tight stripe ${S.mode==='scalar'?'grad':''}">
      <div class="ttl"><span class="dot" style="background:var(--${S.mode==='scalar'?'c-grad':'accent'})"></span>${S.mode==='scalar'?'Gradient ∇f':'Field F'}</div>
      ${flat ? `<div class="kv"><span class="k">${lbl}</span><span class="v">(${fmtNear(Fv.x)}, ${fmtNear(Fv.y)})</span></div>` : vecRow(lbl, Fv)}
      ${kv('magnitude', fmtNear(flat ? Math.hypot(Fv.x,Fv.y) : vlen(Fv)))}
      ${S.mode==='scalar' ? '<p class="help">Points in the direction of steepest increase; its length is that maximal rate of change.'+(isSurf()?' On the terrain it is the compass bearing straight uphill.':flat?' On a contour map it always crosses the contours at a right angle.':'')+'</p>' : ''}
    </div>
    <div class="card tight stripe div">
      <div class="ttl"><span class="dot" style="background:var(--c-pos)"></span>Divergence ∇·${lbl}${S.mode==='scalar'?' = ∇²f':''}${divTag}</div>
      ${kv(flat ? '2D: ∂P/∂x + ∂Q/∂y' : 'value', `<span style="color:${dShow>1e-9?'var(--c-pos)':dShow<-1e-9?'var(--c-neg)':'inherit'}">${fmtNear(dShow)}</span>`)}
      ${flat ? kv('3D value (adds ∂R/∂z)', fmtNear(dv)) : ''}
      ${S.mode==='scalar' && F.f ? kv('∇²f ⁄ f  (eigenvalue meter)',
          Math.abs(F.f.ev(x,y,z)) > 1e-6
            ? '<b>'+fmtNear((flat?dv2:dv)/F.f.ev(x,y,z))+'</b>'
            : '— (f ≈ 0 here)') : ''}
      ${kv('reading', dShow>1e-9?'net source here':dShow<-1e-9?'net sink here':'locally incompressible')}
      ${flat ? '<p class="help">In the plane, flux is measured across a closed <b>curve</b> per unit <b>area</b>, so the surface integral becomes a line integral.</p>' : ''}
    </div>
    <div class="card tight stripe curl">
      <div class="ttl"><span class="dot" style="background:var(--c-curl)"></span>Curl ∇×${lbl}${curlTag}</div>
      ${flat
        ? kv('2D curl: ∂Q/∂x − ∂P/∂y', `<span style="color:var(--c-curl)">${fmtNear(cu2)}</span>`) +
          kv('sense', cu2>1e-9?'counter-clockwise':cu2<-1e-9?'clockwise':'no local rotation') +
          kv('angular rate ω = ½ curl', fmtNear(cu2/2)+' rad/s') +
          '<p class="help">In the plane the curl has only a ẑ-component, so it collapses to a single <b>number</b> — a signed turning rate rather than an axis.</p>'
        : vecRow('∇×'+lbl, cu) + kv('magnitude', fmtNear(vlen(cu))) +
          kv('spin axis ω = ½∇×F', `(${fmtNear(cu.x/2)}, ${fmtNear(cu.y/2)}, ${fmtNear(cu.z/2)})`)}
    </div>`;
  $('probeReadout').innerHTML = html;

  const M = jacobianAt(F,x,y,z);
  const rl = S.mode==='scalar' ? ['∂/∂x','∂/∂y','∂/∂z'] : ['P','Q','R'];
  $('jacTable').innerHTML  = matTable(M, rl, ['∂x','∂y','∂z']);
  $('symTable').innerHTML  = matTable(symPart(M), rl, ['∂x','∂y','∂z']);
  $('skewTable').innerHTML = matTable(skewPart(M), rl, ['∂x','∂y','∂z']);
  $('tagProbe').textContent = `(${fmtNear(x)}, ${fmtNear(y)}, ${fmtNear(z)})`;

  updateChip();
  refreshFluxPanel();
  refreshCircPanel();
  refreshDirPanel();
  $('tagDir').textContent = fmtNear(dirData().value);
}

/* ------------------------------------------------------- panel: derivation ---- */
