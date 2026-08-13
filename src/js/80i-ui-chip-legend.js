function updateChip(){
  if(stageActive()) return;                 // the stage owns the chip
  const F=S.field; if(!F) return;
  const p=S.probe, lbl=fieldLabel(F), flat=planar();
  const dv = flat ? F.div2.ev(p.x,p.y,0) : F.divAt(p.x,p.y,p.z);
  const cu = F.curlAt(p.x,p.y,p.z);
  const VIEW = {'3d':'3D field','surf':'height map','2d':'2D map'}[S.view];
  /* through uiSetHtml, like every other write to #chip: the field pipeline and
     the stages share this element, and writing it directly here left the cache
     marker describing the stage's chip, so returning to that stage in the same
     state skipped the identical write and left the FIELD's chip on screen */
  uiSetHtml($('chip'),
    `<div class="k">${VIEW} · probe (${fmtNear(p.x)}, ${fmtNear(p.y)}${flat?'':', '+fmtNear(p.z)})</div>` +
    (F.f ? `<div>f = ${fmtNear(F.f.ev(p.x,p.y,p.z))}</div>` : '') +
    `<div style="color:var(--c-pos)">∇·${lbl} = ${fmtNear(dv)}</div>` +
    (flat ? `<div style="color:var(--c-curl)">∇×${lbl} = ${fmtNear(F.curl2.ev(p.x,p.y,0))}</div>`
          : `<div style="color:var(--c-curl)">|∇×${lbl}| = ${fmtNear(vlen(cu))}</div>`) +
    `<div style="color:var(--text)">D<sub>û</sub> = ${fmtNear(dirData().value)}</div>`);
}
function updateLegend(){
  if(stageActive()){ updateStageLegend(); return; }
  const rows=[];
  const sw=(c,t)=>`<div class="lg-row"><span class="sw" style="background:${c}"></span>${t}</div>`;
  if(S.show.arrows||S.show.stream){
    const mm = cache.arrows ? cache.arrows.mmax : null;
    rows.push(`<div class="lg-row"><span class="sw" style="background:linear-gradient(90deg,${rgbCss(TH.seq[0])},${rgbCss(TH.seq[2])},${rgbCss(TH.seq[5])})"></span>arrows: ${fieldLabel(S.field)} — |${fieldLabel(S.field)}| 0 → ${mm?fmtNum(mm,3):'max'}</div>`);
  }
  if(S.show.curlarrows && S.mode==='vector' && !planar())
    rows.push(sw('var(--c-curl)','arrows: the curl field ∇×F'));
  if(S.show.fieldlines)
    rows.push(sw('var(--accent)','field lines — tangent to '+fieldLabel(S.field)+' everywhere'));
  if(S.show.slice){
    const l = cache.slice ? cache.slice.label : '';
    rows.push(`<div class="lg-row"><span class="sw" style="background:linear-gradient(90deg,var(--c-neg),var(--mid),var(--c-pos))"></span>${esc(l)} − / + </div>`);
  }
  if(S.show.level) rows.push(`<div class="lg-row"><span class="sw" style="background:var(--text)"></span>contours of ${esc(cache.levels?cache.levels.label:'f')}</div>`);
  if(isSurf()) rows.push(`<div class="lg-row"><span class="sw" style="background:linear-gradient(90deg,var(--c-neg),var(--mid),var(--c-pos))"></span>terrain height = ${esc(cache.surf?cache.surf.label:'f')}</div>`);
  if(S.show.probe){
    rows.push(sw(S.mode==='scalar'?'var(--c-grad)':'var(--accent)', S.mode==='scalar'?'∇f at the probe':'F at the probe'));
    rows.push(sw('var(--c-curl)', planar() ? 'curl — a signed turning rate' : '∇×F at the probe'));
  }
  if(S.show.flux){ rows.push(sw('var(--c-pos)','flux outward')); rows.push(sw('var(--c-neg)','flux inward')); }
  if(S.show.circ) rows.push(sw('var(--c-curl)','circulation loop'));
  if(S.show.dirderiv){
    rows.push(sw('var(--text)','û — the chosen direction'));
    rows.push(sw('var(--c-pos)','rate along û (+ / −)'));
  }
  if(S.show.descent){
    rows.push(sw('var(--c-grad)', S.mode==='scalar'
      ? (S.desc.mode==='max' ? 'ascent path: steps of +η∇f' : 'descent path: steps of −η∇f')
      : 'walker following F'));
    if(S.desc.race) rows.push(sw('var(--accent)','momentum walker (β·memory)'));
  }
  if(S.con.on && S.mode==='scalar' && planar())
    rows.push(sw('var(--c-warn)','constrained walker on g = R²'));
  if(S.part.bodies.length)
    rows.push(sw('var(--c-warn)', S.mode==='scalar' ? 'test particle: F = −∇f'
      : S.part.interp==='lorentz' ? 'test particle: q(E + v×B)' : 'test particle: a = F/m'));
  if(S.show.basins && S.basins.minima && S.basins.minima.length)
    rows.push(sw('var(--accent)','basin colours: which minimum wins'));
  $('legend').innerHTML = rows.join('') || '<div class="lg-row">nothing displayed</div>';
  $('legend').style.display = rows.length ? '' : 'none';
}

function refreshAll(){
  if(!S.field) return;
  refreshProbe();
  refreshDerivation();
  updateLegend();
}

/* --------------------------------------------------------------- picking ---- */
function onProbeMoved(){
  S.probe.x=Math.max(-S.extent,Math.min(S.extent,S.probe.x));
  S.probe.y=Math.max(-S.extent,Math.min(S.extent,S.probe.y));
  S.probe.z=S.dim===2?0:Math.max(-S.extent,Math.min(S.extent,S.probe.z));
  inst.flux=inst.circ=null;
  syncProbeInputs();
  refreshProbe();
  refreshDerivation();
}
function pickAt(ev, phase){
  const rect=R.cv.getBoundingClientRect();
  const sx=ev.clientX-rect.left, sy=ev.clientY-rect.top;
  if(stageActive()){ stagePick(sx, sy, phase); return; }
  if(is2D()){
    S.probe.x=(sx-R.W/2)/R.scale2d + R.cam.tx;
    S.probe.y=-(sy-R.H/2)/R.scale2d + R.cam.ty;
    S.probe.z=0;
  } else {
    const ax=(sx-R.W/2)/R.focal, ay=-(sy-R.H/2)/R.focal;
    const dir=vadd(R.fwd, vadd(vmul(R.right,ax), vmul(R.up,ay)));
    if(planar()){
      /* the domain is the z = 0 plane, so drop the ray onto it */
      if(Math.abs(dir.z) > 1e-4){
        const t = -R.eye.z/dir.z;
        if(t > 0.05){ const q=vadd(R.eye, vmul(dir,t)); S.probe=v3(q.x, q.y, 0); onProbeMoved(); return; }
      }
      const d0=vdot(vsub(S.probe,R.eye), R.fwd);
      const q=vadd(R.eye, vmul(dir,d0)); S.probe=v3(q.x,q.y,0);
    } else {
      const d=vdot(vsub(S.probe,R.eye), R.fwd);
      S.probe=vadd(R.eye, vmul(dir, d));
    }
  }
  onProbeMoved();
}
