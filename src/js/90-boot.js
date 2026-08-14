/* ============================================================================
   8 · BOOT + MAIN LOOP
   ============================================================================ */

function preferredAxis(){
  if(S.dim===2) return 2;
  const f=R.fwd, m=[Math.abs(f.x),Math.abs(f.y),Math.abs(f.z)];
  return m.indexOf(Math.max(...m));
}

function setView(v){
  S.view = v;
  R.mode2d = is2D();
  for(const b of $('viewSeg').children) b.setAttribute('aria-pressed', String(b.dataset.v===v));
  if(planar()){ S.probe.z=0; S.circ.n=v3(0,0,1); if(Math.abs(S.dirU.z)>0.99) S.dirU=v3(1,0,0); S.dirU.z=0; S.dirU=vnorm(S.dirU); }
  /* sensible defaults per view: the map wants contours, the terrain wants terrain */
  if(v==='2d'   && S.mode==='scalar'){ S.show.level=true; S.show.slice=true; }
  if(v==='surf'){ S.show.level=true; }
  if(v==='3d'   && S.show.slice && S.mode==='scalar') S.show.slice=false;
  invalidate(); inst.flux=inst.circ=null; resetStream();
  if(!is2D()){ R.cam.az=0.72; R.cam.el= v==='surf' ? 0.55 : 0.42; }
  fitView();
  buildDisplayPanel(); buildFluxPanel(); buildCircPanel(); buildDescPanel(); buildPartPanel();
  syncProbeInputs(); refreshAll();
}
/* legacy name kept so the demo harness and any old callers still work */
const setDim = d => setView(d===2 ? '2d' : '3d');

/* distance at which the far corner of the domain box still clears the frame */
function fitDistance(){
  return S.extent * Math.sqrt(3) / Math.tan(R.cam.fov/2) * 1.22;
}
function fitView(){
  R.cam.dist = Math.max(1.2, Math.min(40, fitDistance()));
  R.cam.tx=R.cam.ty=R.cam.tz=0;
}
function resetView(){
  R.cam.az=0.62; R.cam.el=0.42;
  fitView();
}

function clearDemoSelection(){
  for(const b of $('demoList').querySelectorAll('button[data-d]')) b.setAttribute('aria-pressed','false');
  $('demoNote').innerHTML='';
}
function loadPreset(key){
  clearDemoSelection();
  S.phys.applied=false;
  const [gi,ii]=key.split('.').map(Number);
  const it=PRESETS[gi].items[ii];
  S.mode=it.mode;
  if(it.mode==='scalar') S.src.f=it.f;
  else { S.src.P=it.P; S.src.Q=it.Q; S.src.R=it.R; }
  S.presetNote=it.note;
  syncFieldInputs();
  buildDisplayPanel();
  applyField();
}

function promote(which){
  const F=S.field; if(!F) return;
  const parts = which==='grad' ? F.grad : F.curl;
  if(!parts || parts.some(p=>!p.ast)){ S.err='That field was differentiated numerically, so it cannot be written back as an expression.'; $('errMsg').textContent=S.err; return; }
  S.src.P=astToSource(parts[0].ast);
  S.src.Q=astToSource(parts[1].ast);
  S.src.R=astToSource(parts[2].ast);
  S.mode='vector';
  S.presetNote = which==='grad'
    ? 'This is ∇f of the field you had. Its curl must now be identically zero — check the curl readout and the derivation panel.'
    : 'This is ∇×F of the field you had. Its divergence must now be identically zero.';
  syncFieldInputs();
  buildDisplayPanel();
  applyField();
}

/* ---- main loop ----
   Every layer draws inside its own guard: a pathological expression may spoil
   one layer for one frame, but it can never take down the animation loop. */
let lastT=0, fpsAcc=0, fpsN=0, lastPerf=0, frameNo=0;
const layerErrors = new Map();
function safeLayer(name, fn){
  try { fn(); }
  catch(err){ layerErrors.set(name, String(err && err.message || err)); }
}
/* ---- the loop stops when nobody is looking ----
   Nothing paused when the tab was hidden, so the whole laboratory went on
   drawing sixty times a second behind another window — a Monte Carlo lattice
   still sweeping, an orbit still integrating, for a canvas the compositor
   never showed anyone. Browsers throttle rAF in a background tab but do not
   stop it, and on the artifact target the page shares its main thread with the
   host application, so the work is taken out of something the reader IS
   looking at.

   The flag is what makes the restart safe: visibilitychange fires on the way
   back too, and without it every hide/show cycle would start a second loop
   running beside the first. */
let loopRunning = false;
function startLoop(){
  if(loopRunning) return;
  loopRunning = true;
  lastT = 0;                       /* the first step after a resume is nominal,
                                      not the length of the pause */
  requestAnimationFrame(frame);
}
function frame(ts){
  if(document.hidden){ loopRunning = false; return; }
  const dt = lastT ? (Math.min(0.05, (ts-lastT)/1000) || 0.016) : 0.016;
  lastT = ts;
  frameNo++;

  if(stageActive()){
    safeLayer('stage', ()=>stageFrame(dt));
  } else if(S.field){
    R.mode2d = is2D();
    R.extent = S.extent;

    /* time-dependent fields: advance the clock, refresh caches on a budget */
    if(S.field.animated && !S.time.paused){
      CLOCK.t += dt * S.time.speed;
      cache.arrows = null; cache.curlArrows = null;
      if(frameNo % 2 === 0){ cache.slice = null; cache.surf = null; }
      if(frameNo % 4 === 0){ cache.levels = null; }
      if(frameNo % 20 === 0) updateChip();
    }

    R.begin();

    if(S.show.level && cache.levels && cache.levels.axis!==undefined && cache.levels.axis!==preferredAxis())
      cache.levels=null;

    if(isSurf())          safeLayer('surface', drawSurface);
    if(S.show.basins)     safeLayer('basins', drawBasins);
    if(S.show.axes)       safeLayer('axes', drawAxes);
    if(S.show.slice)      safeLayer('slice', drawSlice);
    if(S.show.level)      safeLayer('levels', drawLevels);
    if(S.show.fieldlines) safeLayer('field lines', drawFieldLines);
    if(S.show.arrows)     safeLayer('arrows', drawArrows);
    if(S.show.curlarrows) safeLayer('curl arrows', drawCurlArrows);
    if(S.show.stream)     safeLayer('flow', ()=>{ stepStream(dt*2.4); drawStream(); });
    if(S.show.flux)       safeLayer('flux box', drawFlux);
    if(S.show.circ)       safeLayer('circulation', drawCirc);
    if(S.show.dirderiv)   safeLayer('directional', drawDirDeriv);
    safeLayer('physics glyphs', drawPhysGlyphs);
    safeLayer('constraint', drawConstraint);
    safeLayer('particles', ()=>{
      if(S.part.run && S.part.bodies.length){
        partAdvance(dt);
        if(frameNo % 8 === 0) refreshPartPanel();
      }
      drawParticles();
    });
    if(S.show.descent)    safeLayer('descent', ()=>{
      if(S.desc.running){
        S.desc.acc += dt*S.desc.stepsPerSec;
        let guard=0;
        while(S.desc.acc>=1 && guard<8){ descStep(); S.desc.acc-=1; guard++; }
        refreshDescPanel();
      }
      drawDescent();
    });
    if(S.show.probe)      safeLayer('probe', drawProbe);
    R.flush();
    safeLayer('fit inset', drawFitInset);
    safeLayer('basins job', basinsWork);

    if(S.show.circ && S.circ.paddle){
      const w = planar()
        ? 0.5*S.field.curl2.ev(S.probe.x, S.probe.y, 0)
        : 0.5*vdot(S.field.curlAt(S.probe.x,S.probe.y,S.probe.z), vnorm(S.circ.n));
      if(Number.isFinite(w)) S.circ.spin += Math.max(-8, Math.min(8, w))*dt;
    }
  }

  fpsAcc += dt; fpsN++;
  if(ts-lastPerf > 500){
    let txt = Math.round(fpsN/fpsAcc) + ' fps · ' + R.items.length + ' primitives';
    if(S.field && S.field.animated) txt += ' · t = ' + CLOCK.t.toFixed(1);
    if(layerErrors.size){
      txt += ' · layer errors: ' + [...layerErrors.keys()].join(', ');
      layerErrors.clear();
    }
    $('perf').textContent = txt;
    fpsAcc=0; fpsN=0; lastPerf=ts;
  }
  requestAnimationFrame(frame);
}

/* ---- wiring ---- */
function boot(){
  readTheme();
  R.attach($('cv'));
  R.extent = S.extent;

  buildPresetSelect();
  buildDemoList();
  buildPhysPanel();
  buildProbePanel();
  buildDirPanel();
  buildPartPanel();
  buildDescPanel();
  buildFluxPanel();
  buildCircPanel();
  buildDisplayPanel();
  syncFieldInputs();
  syncProbeInputs();
  fitView();
  buildDemoList();
  applyDemo('0.0');            // open on a guided example, callout and all
  applyWingSections();
  markWingNav('home');
  $('home').classList.add('open');   // land on the overview

  /* wings, home cards, theme */
  /* the nav holds the four menu triggers as well, so select only wing buttons */
  for(const b of $('wingNav').querySelectorAll('button[data-w]')) b.addEventListener('click', ()=> setWing(b.dataset.w));
  for(const b of document.querySelectorAll('.home-card')) b.addEventListener('click', ()=> setWing(b.dataset.w));
  $('btnTheme').addEventListener('click', toggleTheme);
  wireSplitters();
  wireWingMenus();
  wirePalette();
  wirePanes();
  wireNavEscape();

  /* expression inputs */
  let deb=0;
  const onEdit = (id, key) => {
    const e=$(id);
    const commit = ()=>{ S.src[key]=e.value; S.presetNote=''; $('presetNote').textContent=''; clearDemoSelection(); S.phys.applied=false; applyField(); };
    e.addEventListener('input', ()=>{ clearTimeout(deb); deb=setTimeout(commit, 260); });
    e.addEventListener('change', ()=>{ clearTimeout(deb); commit(); });
  };
  onEdit('inF','f'); onEdit('inP','P'); onEdit('inQ','Q'); onEdit('inR','R');

  for(const b of $('modeSeg').children) b.addEventListener('click', ()=>{
    S.mode=b.dataset.mode; S.presetNote='';
    syncFieldInputs(); buildDisplayPanel(); buildDescPanel(); buildPartPanel(); applyField();
  });
  for(const b of $('viewSeg').children) b.addEventListener('click', ()=> setView(b.dataset.v));
  $('presetSel').addEventListener('change', e=>{ if(e.target.value) loadPreset(e.target.value); });
  $('btnPromoteGrad').addEventListener('click', ()=>promote('grad'));
  $('btnPromoteCurl').addEventListener('click', ()=>promote('curl'));
  $('btnReset').addEventListener('click', resetView);
  $('btnTheory').addEventListener('click', openTheory);
  $('btnCloseSheet').addEventListener('click', ()=> $('sheet').classList.remove('open'));
  $('sheet').addEventListener('click', e=>{ if(e.target===$('sheet')) $('sheet').classList.remove('open'); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') $('sheet').classList.remove('open'); });

  installControls($('cv'), ()=>{}, pickAt, ()=>{
    if(stageActive()){
      const d = STAGES[S.stage].drag;
      return (typeof d === 'function' ? d(ST) : d) ? 'drag' : null;
    }
    const a = probeAnchor();
    return R.project(a.x, a.y, a.z);
  });

  /* keep the canvas honest about its size and the theme */
  new ResizeObserver(()=>R.resize()).observe($('cv'));
  const onTheme = ()=>{ readTheme(); invalidate(); updateLegend(); };
  if(window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);
  new MutationObserver(onTheme).observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});

  document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) startLoop(); });

  /* Last, because it may navigate: a link in the address bar names a wing, a
     demo and the controls the author had set, and following it must happen
     after every panel builder above exists to be driven. */
  plInit();

  startLoop();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

