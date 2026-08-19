/* ============================================================================
   6c · WING NAVIGATION + STAGE PANELS
   ============================================================================ */

const RAIL_SECTIONS = ['secDisplay','secField','secPhys','secProbe','secDir','secDeriv','secFlux','secCirc','secPart','secDesc'];
const WING_SECTIONS = {
  /* the vector wing keeps the flux box and the circulation loop, because those
     two instruments are the numerical definitions the integral theorems rest on */
  vector:  ['secDisplay','secField','secPhys','secProbe','secDeriv','secFlux','secCirc','secPart'],
  /* the gradient, directional-derivative and optimization demos moved here, so
     this wing inherits their panels */
  partial: ['secDisplay','secField','secProbe','secDir','secDeriv','secDesc'],
  /* every other calculus and AP wing is entirely stage-driven */
  vectors:  [], curves:   [], integral: [], ode:      [], coords:   [],
  limits:   [], deriv:    [], series:   [],
  /* every proof-wing demo is a stage, so no field-engine panel applies */
  proof:    [],
  algebra:  [], functions:[], trig:     [], cnum:     [],
  /* every discrete-maths demo is a stage, so no field-engine panel applies */
  discrete: [],
  prob:     [], numer:    [],
  nuclear:  [], solid:    [], statmech: [], string:   [],
  linsys:   [], vecspace: [], eigen:    [],
  laplace:  [], systems:  [], phase:    [], complex: [],
  forms:    [], potential:[], thermo:   [], rotenergy:[],
  /* every units demo is a stage, so no field-engine panel applies */
  units:    [],
  mechanics:[], rotation: [], waves:    [], fluids:   [], optics:   [],
  em:      ['secDisplay','secField','secPhys','secProbe','secDeriv','secFlux','secCirc','secPart'],
  /* every relativity demo is a stage, so the field-engine panels never apply */
  relativity: [],
  circuit: ['secDisplay','secProbe'],
  fourier: ['secDisplay'],
  /* every signal-processing demo is a stage, so no field-engine panel applies */
  signal:  [],
  quantum: ['secDisplay','secField','secPhys','secProbe','secDir','secDeriv','secFlux','secCirc'],
  atom:    ['secDisplay','secField','secPhys','secProbe','secDeriv','secFlux']
};

function applyWingSections(){
  const stage = stageActive();
  $('secStage').style.display = stage ? '' : 'none';
  /* the derivation ladder belongs to a stage; refreshDerive() decides whether
     this particular stage has one, but with no stage at all it must go */
  const sd = $('secDerive2');
  if(sd && !stage) sd.style.display = 'none';
  $('viewSeg').style.display = stage ? 'none' : '';
  $('hint').style.display = stage ? 'none' : '';
  const allowed = WING_SECTIONS[WING] || RAIL_SECTIONS;
  let anyVisible = stage;
  for(const id of RAIL_SECTIONS){
    const el = $(id);
    if(!el) continue;
    const show = !stage && allowed.includes(id);
    el.style.display = show ? '' : 'none';
    if(show) anyVisible = true;
  }
  /* the dock holds every control panel; when a wing has none it gives its
     height back to the visualization */
  const dock = $('dock');
  if(dock && dock.hidden === anyVisible){
    dock.hidden = !anyVisible;
    $('app').classList.toggle('nodock', !anyVisible);
    if(R && R.resize) requestAnimationFrame(() => R.resize());
  }
  const w = WINGS[WING];
  if(w) $('demoIntro').innerHTML = w.demoIntro;
}

function markWingNav(w){
  /* the nav also holds the four menu triggers, which carry no data-w */
  for(const b of $('wingNav').querySelectorAll('button[data-w]'))
    b.setAttribute('aria-pressed', String(b.dataset.w === w));
  markNavGroup(w);
}

function setWing(w, force){
  if(w === 'home'){
    $('home').classList.add('open');
    markWingNav('home');
    plSave();
    return;
  }
  $('home').classList.remove('open');
  if(WING !== w || force){
    WING = w;
    DEMOS = WINGS[w].groups;
    $('brandGlyph').textContent = WINGS[w].glyph;
    $('brandTitle').textContent = WINGS[w].title;
    $('brandSub').textContent = WINGS[w].sub;
    buildDemoList();
    applyDemo('0.0');
  }
  markWingNav(w);
  /* leaving the home overview for a wing already loaded changes the address
     without going through applyDemo, so the URL is written here too */
  plSave();
}

/* ---- stage demo application (the stage analogue of applyDemo) ---- */
function applyStageDemo(key, d){
  /* silence every field-side animation so nothing fights the stage */
  S.desc.running = false; S.con.on = false; S.con.running = false;
  S.part.bodies = []; S.fit.active = false;
  S.show.basins = false; S.basins.job = null;
  S.phys.applied = false;

  stageEnter(d.stage, d.opts || {});

  for(const b of $('demoList').querySelectorAll('button[data-d]')){
    const active = b.dataset.d === key;
    b.setAttribute('aria-pressed', String(active));
    if(active){ const grp = b.closest('details'); if(grp) grp.open = true; }
  }
  /* supify: the commentary is written with caret exponents so the same strings
     stay readable in source, but it must typeset as e⁻ˣ² on screen */
  $('demoNote').innerHTML = `<div class="callout">` +
    (d.out ? `<div class="hd">The outcome</div><div style="margin-bottom:8px;color:var(--text)">${supify(d.out)}</div>` : '') +
    `<div class="hd">What to look for</div>${supify(d.note)}</div>`;
}

/* ---- stage panels ---- */
function buildStagePanel(){
  const st = STAGES[S.stage];
  if(!st) return;
  $('tagStage').textContent = st.title;
  /* one shared status line per panel, where ctlWhy() explains any value a
     control refused — a clamp that moves a number silently teaches nothing */
  /* The View panel is appended to every stage rather than opted into, because
     the ability to look closer at a picture is not a property of the picture —
     a reader who wants to check where a curve actually crosses zero wants it
     everywhere. Stages that draw no mkPlot boxes get a panel whose range boxes
     stay disabled; pvSyncBoxes() decides that from the registry after the first
     frame, since nothing knows what a stage draws until it has drawn it. */
  $('stageBody').innerHTML = (st.controls ? supify(st.controls()) : '') +
    '<p class="err ctlwhy" id="ctlWhy" role="status" aria-live="polite"></p>' +
    pvPanelHtml();
  if(st.wire) st.wire();
  pvWirePanel();
  refreshStageReadout();
  refreshDerive();
}
function refreshStageReadout(){
  const st = S.stage && STAGES[S.stage];
  if(!st || !ST) return;
  uiSetHtml($('stageReadout'), st.readout ? supify(st.readout(ST)) : '');
  /* the ladder carries live numbers, so it follows every control change */
  refreshDerive();
}
function updateStageChip(){
  const st = S.stage && STAGES[S.stage];
  if(!st || !ST) return;
  /* `.readout-chip` is a flex column, so **every element child becomes its own
     row**. A chip that returns bare text with a `<br>` in it therefore tears
     apart the moment supify() introduces a <sub> or <sup>: `v_rms = 517 m/s`
     rendered as three stacked lines reading "v", "rms", "= 517 m/s". Eleven
     chips across the Modern wings had exactly that shape.

     They are fixed at source, but the guard belongs here as well, because the
     next chip somebody writes will not know. If what comes back has no block
     wrapper of its own, one is put round each <br>-separated line. */
  let h = st.chip ? supify(st.chip(ST)) : `<div class="k">${st.title}</div>`;
  if(!/<div/i.test(h))
    h = h.split(/<br\s*\/?>/i).map((line, i) =>
      `<div${i === 0 ? ' class="k"' : ''}>${line}</div>`).join('');
  /* J8: the return feeds stageFrame's adaptive cadence — true means the chip
     is animating and must track the frame, false lets it drop back to the
     0.4 s timer, so a heavy-but-static chip is never rebuilt per frame */
  return uiSetHtml($('chip'), h);
}
function updateStageLegend(){
  const st = S.stage && STAGES[S.stage];
  if(!st || !ST) return;
  /* `ST` is passed so a stage whose scenes draw different things can key its
     legend on the one that is showing. Every existing legend() ignores the
     argument, so this is backward compatible — and without it a scene-aware
     legend silently falls through to its default, which is a key describing a
     picture the reader is not looking at. */
  const rows = (st.legend ? st.legend(ST) : []).map(([c, t]) =>
    `<div class="lg-row"><span class="sw" style="background:${c}"></span>${supify(t)}</div>`);
  /* A stage that fills its canvas with plots has nowhere for a floating key to
     sit without covering data, so it can ask for the key in the dock instead. */
  const inDock = !!st.dockLegend;
  const dl = $('stageLegend');
  if(dl){
    dl.innerHTML = inDock ? rows.join('') : '';
    dl.hidden = !(inDock && rows.length);
  }
  $('legend').innerHTML = inDock ? '' : rows.join('');
  $('legend').style.display = (!inDock && rows.length) ? '' : 'none';
}

/* ---- theory sheet, per wing ---- */
/* One long-form essay per wing. The table is a plain lookup so adding a wing is
   one line rather than another arm of a conditional chain. */
const THEORY_BY_WING = {
  proof:    () => [THEORY_PROOF,    'Proof, logic & sets — the mathematics, in full'],
  algebra:  () => [THEORY_ALGEBRA,  'Algebra — the mathematics, in full'],
  functions:() => [THEORY_FUNCTIONS,'Functions — the mathematics, in full'],
  trig:     () => [THEORY_TRIG,     'Trigonometry — the mathematics, in full'],
  coords:   () => [THEORY_COORDS,   'Coordinate systems & Jacobians — the mathematics, in full'],
  cnum:     () => [THEORY_CNUM,     'Complex numbers — the mathematics, in full'],
  discrete: () => [THEORY_DISCRETE, 'Discrete mathematics & combinatorics — the mathematics, in full'],
  prob:     () => [THEORY_PROB,    'Probability & statistics — the mathematics, in full'],
  numer:    () => [THEORY_NUMER,   'Numerical methods — the mathematics, in full'],
  nuclear:  () => [THEORY_NUCLEAR, 'Nuclear physics — the mathematics, in full'],
  solid:    () => [THEORY_SOLID,   'Condensed matter & semiconductors — the mathematics, in full'],
  statmech: () => [THEORY_STATMECH,'Statistical mechanics — the mathematics, in full'],
  string:   () => [THEORY_STRING,  'String theory — the mathematics, in full'],
  linsys:   () => [THEORY_LINALG,   'Systems, matrices & determinants — the mathematics, in full'],
  vecspace: () => [THEORY_VECSPACE, 'Vector spaces & orthogonality — the mathematics, in full'],
  eigen:    () => [THEORY_EIGEN,    'Eigenvalues, diagonalisation & the SVD — the mathematics, in full'],
  laplace:  () => [THEORY_LAPLACE,  'Laplace transforms, delta functions & convolution — the mathematics, in full'],
  systems:  () => [THEORY_SYSTEMS,  'Linear systems of differential equations — the mathematics, in full'],
  phase:    () => [THEORY_PHASE,    'Nonlinear dynamics & the phase plane — the mathematics, in full'],
  complex:  () => [THEORY_COMPLEX,  'Complex functions & contour integrals — the mathematics, in full'],
  forms:    () => [THEORY_FORMS,    'Differential forms — the mathematics, in full'],
  potential:() => [THEORY_POTENTIAL,'Potential theory — the mathematics, in full'],
  thermo:   () => [THEORY_FLUIDS,   'Thermal physics — the physics, in full'],
  rotenergy:() => [THEORY_ROT,      'Energy & momentum of rotating systems — the physics, in full'],
  limits:   () => [THEORY_LIMITS,   'Limits & continuity — the mathematics, in full'],
  deriv:    () => [THEORY_DERIV,    'Derivatives & their applications — the mathematics, in full'],
  series:   () => [THEORY_SERIES,   'Sequences & series — the mathematics, in full'],
  units:    () => [THEORY_UNITS,    'Units, dimensions & uncertainty — the mathematics, in full'],
  mechanics:() => [THEORY_MECH,     'Mechanics — the physics, in full'],
  rotation: () => [THEORY_ROT,      'Rotation — the physics, in full'],
  waves:    () => [THEORY_WAVES,    'Oscillations & waves — the physics, in full'],
  fluids:   () => [THEORY_FLUIDS,   'Fluids & thermal physics — the physics, in full'],
  optics:   () => [THEORY_OPTICS,   'Optics — the physics, in full'],
  vectors:  () => [THEORY_VECTORS,  'Vectors & the geometry of space — the mathematics, in full'],
  curves:   () => [THEORY_CURVES,   'Curves & motion — the mathematics, in full'],
  partial:  () => [THEORY_PARTIAL,  'Partial derivatives — the mathematics, in full'],
  integral: () => [THEORY_INTEGRAL, 'Integration — the mathematics, in full'],
  ode:      () => [THEORY_ODE,      'Differential equations — the mathematics, in full'],
  quantum:  () => [THEORY_QM,       'Quantum mechanics — the mathematics, in full'],
  atom:     () => [THEORY_ATOM,     'The atom & the four forces — the physics, in full'],
  em:       () => [THEORY_EM,       "Maxwell's equations — the mathematics, in full"],
  circuit:  () => [THEORY_CIRCUIT,  'Circuit analysis — the mathematics, in full'],
  fourier:  () => [THEORY_FOURIER,  'Fourier analysis — the mathematics, in full'],
  signal:   () => [THEORY_SIGNAL,   'Signal processing — the mathematics, in full'],
  relativity:() => [THEORY_REL,     'Relativity — the mathematics, in full']
};
function openTheory(){
  const entry = THEORY_BY_WING[WING];
  const [prose, title] = entry ? entry() : [THEORY, 'Vector calculus — the mathematics, in full'];
  $('sheetTitle').textContent = title;
  $('theoryProse').innerHTML = supify(prose);
  /* statements are numbered here rather than in the source: several essays are
     assembled from more than one constant, so a hand-written number restarts
     the count halfway through — the same reason demo groups are numbered at
     render time in 80a-ui-core.js */
  stNumber($('theoryProse'));
  stWireSee($('theoryProse'));
  $('sheet').classList.add('open');
  $('sheet').querySelector('.sheet-body').scrollTop = 0;
}

/* ============================================================================
   RESIZABLE PANELS
   Both panels are sized by a CSS custom property that a splitter drags. The
   canvas is not laid out by CSS alone — the renderer keeps its own pixel
   buffer — so every change has to tell it to re-measure.
   ============================================================================ */
function wireSplitters(){
  const root = document.documentElement;
  const drag = (el, opts) => {
    if(!el) return;
    const apply = px => {
      const v = Math.max(opts.min, Math.min(opts.max(), px));
      root.style.setProperty(opts.varName, v + 'px');
      if(R && R.resize) R.resize();
    };
    el.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      el.setPointerCapture(ev.pointerId);
      el.classList.add('drag');
      const move = e => apply(opts.measure(e));
      const up = e => {
        el.classList.remove('drag');
        try { el.releasePointerCapture(e.pointerId); } catch(_){}
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
    /* keyboard: the splitter is a real separator control, so arrows must work */
    el.addEventListener('keydown', ev => {
      const cur = parseFloat(getComputedStyle(root).getPropertyValue(opts.varName)) || opts.min;
      const step = ev.shiftKey ? 48 : 12;
      if(ev.key === opts.less){ apply(cur + step); ev.preventDefault(); }
      else if(ev.key === opts.more){ apply(cur - step); ev.preventDefault(); }
      else if(ev.key === 'Home'){ apply(opts.def); ev.preventDefault(); }
    });
    el.addEventListener('dblclick', () => apply(opts.def));
  };
  drag($('splitRail'), {
    varName:'--rail', min:240, def:388,
    max: () => Math.max(260, window.innerWidth - 420),
    measure: e => window.innerWidth - e.clientX - 3,
    less:'ArrowLeft', more:'ArrowRight'
  });
  drag($('splitDock'), {
    varName:'--dockh', min:90, def:330,
    max: () => Math.max(110, window.innerHeight - 260),
    measure: e => window.innerHeight - e.clientY - 3,
    less:'ArrowUp', more:'ArrowDown'
  });
}

/* ---- theme toggle (data-theme wins over the OS preference) ---- */
function toggleTheme(){
  const root = document.documentElement;
  const cur = root.dataset.theme ||
    (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.dataset.theme = cur === 'dark' ? 'light' : 'dark';
}
