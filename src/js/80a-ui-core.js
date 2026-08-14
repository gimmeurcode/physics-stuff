
const $ = id => document.getElementById(id);

/* Write HTML into an element only when it is not already what is there.

   The readout, the chip and the whole derivation ladder are regenerated every
   0.4 seconds for as long as a stage is open. For a static stage nothing has
   changed and the entire cost is waste; for an animated one a few numbers have
   moved and the rest is still waste. auditperf measured a mean of 6 313 bytes
   of HTML per stage per refresh — 2.8 MB of parsing, DOM teardown and rebuild
   per second across the laboratory.

   Assigning innerHTML destroys and rebuilds every child node, so skipping an
   identical write is not merely cheaper, it is what stops a reader's text
   selection inside the ladder being thrown away four times a second.

   The last string written is kept on the element itself.

   **EVERY write to #stageReadout, #deriveBody and #chip must come through here,
   and `smoke.ps1` enforces it.** The marker records what this function last
   wrote, so a direct `el.innerHTML = …` anywhere else leaves the marker
   describing a DOM that no longer exists — and the next identical refresh is
   then skipped as a no-op, leaving the stale content on screen. That is not
   theoretical: it shipped for a few minutes in two places, and both produced a
   panel that stayed wrong until the reader changed a control.

   - `stageExit()` cleared the readout with `innerHTML = ''`, so reopening the
     same stage in the same state produced the identical string, matched the
     marker, was skipped, and left the readout **blank**.
   - `updateChip()` (the field pipeline, which owns the chip when no stage is
     active) wrote the chip directly, so returning to a stage in the same state
     was skipped and left the **field's** chip over the stage's picture. */
function uiSetHtml(el, html){
  if(!el) return false;
  if(el.__uiHtml === html) return false;
  el.__uiHtml = html;
  el.innerHTML = html;
  return true;
}

/* Every wing reads as a progression, so its groups are numbered — but at render
   time rather than in the source. Several wings splice two group arrays together
   (the vector wing takes the stage groups then the field-engine ones), and
   numbering them in the source would restart the count halfway through. */
function buildDemoList(){
  $('demoList').innerHTML = DEMOS.map((grp,gi)=>
    `<details class="dgrp" data-g="${gi}"${gi===0?' open':''}><summary><span class="gnum">${gi+1}</span>${grp.g}<span class="cnt">${grp.items.length}</span></summary>` +
    grp.items.map((it,ii)=>
      /* `n` and `ex` are authored DISPLAY strings, exactly like `out` and `note`
         two functions below, so they get the same treatment: typeset, not
         escaped. esc() here meant the sixteen formulas written with a caret
         showed it raw in the rail — (1 + x)^(1/x) — and the seven written with
         <sub> showed the tags themselves. A bare "<" used as less-than is safe
         either way: HTML only opens a tag when a letter follows it, which is
         why "E < V₀" and "|x| < 1" already render correctly through `out`. */
      `<button class="demo-b" data-d="${gi}.${ii}" aria-pressed="false">${supify(it.n)}<span class="ex">${supify(it.ex)}</span></button>`
    ).join('') + '</details>'
  ).join('');
  for(const b of $('demoList').querySelectorAll('button[data-d]'))
    b.addEventListener('click', ()=>applyDemo(b.dataset.d));
}

function applyDemo(key){
  const [gi,ii]=key.split('.').map(Number);
  const d=DEMOS[gi].items[ii];

  /* stage experiments bypass the field pipeline entirely */
  if(d.stage){ applyStageDemo(key, d); plAfterDemo(key); return; }
  stageExit();

  S.phys.applied=false;
  S.desc.race = !!(d.desc && d.desc.race);
  S.con.on=false; S.con.running=false;
  S.show.basins=false; S.basins.job=null;
  S.fit.active = !!d.fit;
  if(d.con){ S.con.on=true; S.con.R=d.con.R||2; S.con.running=!!d.con.run; }
  if(d.sliceAxis!==undefined) S.sliceAxis=d.sliceAxis;
  S.part.bodies=[];
  if(d.phys){
    S.phys.objects = d.phys.map(o=>JSON.parse(JSON.stringify(o)));
    const built = physBuild(S.phys.objects);
    S.mode = built.mode;
    if(built.mode==='scalar') S.src.f = built.src.f;
    else { S.src.P=built.src.P; S.src.Q=built.src.Q; S.src.R=built.src.R; }
    S.phys.applied = true;
    refreshPhysPanel();
  } else {
    S.mode = d.mode;
    if(d.mode==='scalar') S.src.f = d.f;
    else { S.src.P=d.P; S.src.Q=d.Q; S.src.R=d.R; }
  }
  S.view = d.view || '3d';
  R.mode2d = is2D();
  for(const b of $('viewSeg').children) b.setAttribute('aria-pressed', String(b.dataset.v===S.view));

  S.extent  = d.extent || 3;
  S.density = d.dens || 5;
  S.probe   = v3(...d.probe);
  S.show    = {...S.show, ...d.show};
  S.sliceOf = d.sliceOf || 'auto';
  if(d.dirU)  S.dirU = vnorm(v3(...d.dirU));
  if(d.circN) S.circ.n = vnorm(v3(...d.circN));
  if(d.circR) S.circ.r = d.circR;
  if(d.fluxH) S.flux.h = d.fluxH;
  if(d.desc){
    S.desc.eta = d.desc.eta !== undefined ? d.desc.eta : S.desc.eta;
    S.desc.beta = d.desc.beta !== undefined ? d.desc.beta : S.desc.beta;
    S.desc.mode = d.desc.mode || 'min';
    S.desc.running = !!d.desc.run;
  } else S.desc.running = false;
  descReset();
  if(S.con.on) conReset();
  S.presetNote = '';
  R.extent = S.extent;

  /* when a demo is really about an instrument, move in close enough to read it */
  const closeUp = (d.show.flux || d.show.circ || d.show.dirderiv) && !isSurf();
  R.cam.az = closeUp ? 0.78 : 0.72;
  R.cam.el = isSurf() ? 0.52 : (closeUp ? 0.34 : 0.42);
  R.cam.tx = closeUp ? S.probe.x*0.6 : 0;
  R.cam.ty = closeUp ? S.probe.y*0.6 : 0;
  R.cam.tz = closeUp ? S.probe.z*0.6 : 0;
  R.cam.dist = Math.max(1.2, Math.min(40, fitDistance() * (closeUp ? 0.44 : 0.92)));

  for(const b of $('demoList').querySelectorAll('button[data-d]')){
    const active = b.dataset.d===key;
    b.setAttribute('aria-pressed', String(active));
    if(active){ const grp=b.closest('details'); if(grp) grp.open=true; }
  }
  /* same supify as the stage path in 82-ui-wings.js: caret exponents in the
     commentary must typeset, not print as e^(-r^2) */
  $('demoNote').innerHTML = `<div class="callout">` +
    (d.out ? `<div class="hd">The outcome</div><div style="margin-bottom:8px;color:var(--text)">${supify(d.out)}</div>` : '') +
    `<div class="hd">What to look for</div>${supify(d.note)}</div>`;

  syncFieldInputs();
  buildDisplayPanel();
  buildFluxPanel();
  buildCircPanel();
  buildDirPanel();
  buildDescPanel();
  applyField();
  syncProbeInputs();
  if(d.basins) basinsStart();
  if(d.part){
    S.part.interp = d.part.interp || 'force';
    S.part.m = d.part.m !== undefined ? d.part.m : 1;
    S.part.q = d.part.q !== undefined ? d.part.q : 1;
    S.part.E = d.part.E ? {x:d.part.E[0], y:d.part.E[1], z:d.part.E[2]} : {x:0,y:0,z:0};
    S.part.v = {x:d.part.v[0], y:d.part.v[1], z:d.part.v[2]||0};
    S.part.simSpeed = d.part.speed || 1;
    partLaunch();
    S.part.run = d.part.run !== false;
    buildPartPanel();
  } else buildPartPanel();
  applyWingSections();
  /* the permalink's diff baseline is taken here, with the panels built and
     wired — see 82a-permalink.js */
  plAfterDemo(key);
}

/* ------------------------------------------------------------ panel: field ---- */
function syncFieldInputs(){
  $('inF').value = S.src.f;
  $('inP').value = S.src.P;
  $('inQ').value = S.src.Q;
  $('inR').value = S.src.R;
  $('scalarInputs').style.display = S.mode==='scalar' ? 'flex' : 'none';
  $('vectorInputs').style.display = S.mode==='vector' ? 'flex' : 'none';
  for(const b of $('modeSeg').children) b.setAttribute('aria-pressed', String(b.dataset.mode===S.mode));
  $('btnPromoteGrad').style.display = S.mode==='scalar' ? '' : 'none';
  $('btnPromoteCurl').style.display = S.mode==='vector' ? '' : 'none';
  $('presetNote').textContent = S.presetNote;
}
function buildPresetSelect(){
  const sel=$('presetSel');
  sel.innerHTML = '<option value="">Load a prepared field…</option>' + PRESETS.map((grp,gi)=>
    '<option disabled>── '+esc(grp.g)+' ──</option>' +
    grp.items.map((it,ii)=>`<option value="${gi}.${ii}">${esc(it.n)}</option>`).join('')
  ).join('');
}

/* rebuild the field from the text inputs; keep the last good one on a parse error */
function applyField(){
  try{
    const F = buildField(S.mode, S.src);
    S.field = F; S.err = '';
  }catch(e){
    S.err = e.message || String(e);
  }
  $('errMsg').textContent = S.err;
  const bad = !!S.err;
  for(const id of ['inF','inP','inQ','inR']) $(id).parentElement.classList.toggle('bad', bad);
  $('tagField').textContent = S.err ? 'error' : (S.mode==='scalar' ? 'scalar' : 'vector');
  if(!S.err){
    invalidate(); inst.flux=inst.circ=null; _fluxScaleCache={key:'',v:1};
    resetStream();
    buildDisplayPanel();          // animation/planar-dependent controls
    buildDescPanel();
    refreshAll();
  }
}

/* --------------------------------------------------------- readout helpers ---- */
function kv(k, v, cls){ return `<div class="kv ${cls||''}"><span class="k">${k}</span><span class="v">${v}</span></div>`; }
function vecRow(label, vec, col){
  return `<div class="kv"><span class="k">${label}</span><span class="v" style="color:${col||'inherit'}">(${fmtNear(vec.x)}, ${fmtNear(vec.y)}, ${fmtNear(vec.z)})</span></div>`;
}
function matTable(M, rowLbl, colLbl){
  let h='<div class="mat-wrap"><table class="mat"><tr><td class="hd"></td>'+colLbl.map(c=>`<td class="hd">${c}</td>`).join('')+'</tr>';
  for(let i=0;i<3;i++){
    h+=`<tr><td class="hd">${rowLbl[i]}</td>`;
    for(let j=0;j<3;j++) h+=`<td>${fmtNear(M[i][j])}</td>`;
    h+='</tr>';
  }
  return h+'</table></div>';
}

/* --------------------------------------------------- panel: physics builder ---- */
