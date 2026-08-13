$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(e.message + ' @' + e.lineno); });
</script></head><body>
'@

$tail = @'
<script>
setTimeout(function(){
  var log = [], n = 0;
  // force every layer to build and draw, whatever the demo switched on
  function paint(where){
    try {
      if (stageActive()) {                    // custom stage: run its own frames + probe
        for (var sf = 0; sf < 6; sf++) stageFrame(0.05);
        stagePick(R.W * 0.6, R.H * 0.5);
        refreshStageReadout(); updateStageChip(); updateStageLegend();
        var ro = document.getElementById('stageReadout').textContent;
        if (!ro || ro.length < 20) log.push(where + ' :: stage readout empty');
        // EM stages must survive in three dimensions too: flip the view, paint,
        // exercise the pointer, and flip back.
        var dimSeg = document.getElementById('emDim');
        if (dimSeg) {
          try {
            dimSeg.querySelector('[data-d="3d"]').click();
            for (var s3 = 0; s3 < 4; s3++) stageFrame(0.05);
            stagePick(R.W * 0.55, R.H * 0.5, 'click');
            refreshStageReadout(); updateStageChip(); updateStageLegend();
            var ro3 = document.getElementById('stageReadout').textContent;
            if (!ro3 || ro3.length < 20) log.push(where + ' :: 3D stage readout empty');
            document.getElementById('emDim').querySelector('[data-d="2d"]').click();
            for (var s4 = 0; s4 < 2; s4++) stageFrame(0.05);
          } catch (e3) { log.push(where + ' :: 3D view :: ' + (e3 && e3.stack ? e3.stack.split('\n')[0] : e3)); }
        }
        return;
      }
      R.begin();
      if (isSurf()) drawSurface();
      drawBasins(); drawAxes(); drawSlice(); drawLevels(); drawFieldLines(); drawArrows(); drawCurlArrows();
      stepStream(0.016); drawStream();
      drawFlux(); drawCirc(); drawDirDeriv(); drawDescent(); drawConstraint(); drawPhysGlyphs();
      if (S.part.bodies.length) partAdvance(0.016);
      drawParticles(); drawProbe();
      R.flush();
      drawFitInset();
      refreshAll(); refreshFluxPanel(); refreshCircPanel(); refreshDirPanel();
      runShrink(); if (!planar()) runSweep();
    } catch (e) { log.push(where + ' :: ' + (e && e.stack ? e.stack.split('\n')[0] : e)); }
  }
  ['algebra','functions','trig','limits','deriv','series','prob','numer','linsys','vecspace','eigen','laplace','systems','phase','complex','forms','potential','vectors','curves','partial','integral','vector','ode','mechanics','rotation','rotenergy','waves','fluids','thermo','optics','em','relativity','circuit','fourier','quantum','atom','nuclear','solid','statmech','string'].forEach(function(wing){
    try { setWing(wing, true); } catch (e) { log.push('setWing ' + wing + ' :: ' + e); return; }
    for (var g = 0; g < DEMOS.length; g++) {
      for (var i = 0; i < DEMOS[g].items.length; i++) {
        var key = g + '.' + i, name = DEMOS[g].items[i].n, isStage = !!DEMOS[g].items[i].stage;
        try { applyDemo(key); } catch (e) { log.push('applyDemo ' + wing + ' ' + key + ' :: ' + e); continue; }
        n++;
        paint('demo ' + wing + ' ' + key + ' "' + name + '"');
        // every circuit demo must actually solve: a wire one grid unit out would
        // short a component silently, so assert the netlist is well posed
        if (wing === 'circuit' && ST && ST.sim) {
          if (!ST.sim.ok) log.push('circuit ' + key + ' "' + name + '" DOES NOT SOLVE :: ' + (ST.err || ST.sim.err));
          else {
            for (var s5 = 0; s5 < 6; s5++) stageFrame(0.02);
            if (!ST.sim.ok) log.push('circuit ' + key + ' "' + name + '" failed while running :: ' + ST.err);
            var mm = ST.meas;
            if (!mm) log.push('circuit ' + key + ' "' + name + '" produced no measurement');
            else {
              // a relative measure is meaningless when every current in the
              // circuit is a picoamp (a rectifier on its blocked half cycle),
              // so accept either a negligible absolute or relative residual
              if (mm.kclRel > 1e-4 && mm.kclMax > 1e-9)
                log.push('circuit ' + key + ' "' + name + '" violates KCL :: rel=' + mm.kclRel + ' abs=' + mm.kclMax);
              for (var s6 = 0; s6 < mm.states.length; s6++)
                if (!Number.isFinite(mm.states[s6].v) || !Number.isFinite(mm.states[s6].i))
                  log.push('circuit ' + key + ' "' + name + '" :: ' + mm.states[s6].name + ' is not finite');
              // a demo whose every node sits at exactly 0 V is almost certainly miswired
              var live = false;
              for (var s7 = 1; s7 < mm.nodeV.length; s7++) if (Math.abs(mm.nodeV[s7]) > 1e-9) live = true;
              if (!live && ST.sch.comps.length > 2)
                log.push('circuit ' + key + ' "' + name + '" is dead — every node reads 0 V');
            }
          }
        }
        if (isStage) continue;                       // stages have no field views
        ['3d','surf','2d'].forEach(function(v){
          try { setView(v); } catch (e) { log.push('setView ' + v + ' after ' + key + ' :: ' + e); return; }
          paint('demo ' + wing + ' ' + key + ' view ' + v);
        });
      }
    }
  });
  setWing('vector', true);
  // every preset too, in every view
  var np = 0;
  for (var g2 = 0; g2 < PRESETS.length; g2++) {
    for (var j = 0; j < PRESETS[g2].items.length; j++) {
      try { loadPreset(g2 + '.' + j); } catch (e) { log.push('preset ' + g2 + '.' + j + ' :: ' + e); continue; }
      np++;
      ['3d','surf','2d'].forEach(function(v){
        try { setView(v); paint('preset ' + g2 + '.' + j + ' view ' + v); }
        catch (e) { log.push('preset view :: ' + e); }
      });
    }
  }
  // deliberately broken input must not kill the app
  try {
    S.mode = 'vector';
    S.src.P = 'x +'; applyField();
    if (!S.err) log.push('vector: a malformed expression was accepted');
    S.src.P = 'q'; applyField();
    if (!S.err) log.push('vector: an unknown symbol was accepted');
    S.src.P = 'sin(x'; applyField();
    if (!S.err) log.push('vector: an unbalanced paren was accepted');
    S.src.P = '-y'; applyField();
    if (S.err) log.push('recovery from a bad expression failed: ' + S.err);
    paint('after vector error recovery');

    S.mode = 'scalar';
    S.src.f = 'x*'; applyField();
    if (!S.err) log.push('scalar: a malformed expression was accepted');
    S.src.f = 'x^2 + y^2'; applyField();
    if (S.err) log.push('scalar recovery failed: ' + S.err);
    paint('after scalar error recovery');
  } catch (e) { log.push('error handling :: ' + e); }

  // the HUD and panels must show the values AT THE PROBE, not anywhere else
  try {
    setWing('vector', true);
    applyDemo('4.3');                                  // div = 3r², position-dependent
    S.probe = v3(1.2, 1.0, 0.8); onProbeMoved();
    var wantDiv = fmtNear(S.field.divAt(1.2, 1.0, 0.8));   // 9.24 — distinctive digits
    if (document.getElementById('chip').textContent.indexOf(wantDiv) < 0)
      log.push('chip does not show div at the probe (wanted ' + wantDiv + ')');
    if (document.getElementById('probeReadout').textContent.indexOf(wantDiv) < 0)
      log.push('probe panel does not show div at the probe (wanted ' + wantDiv + ')');

    applyDemo('5.3');                                  // 2D map, curl2 = −2y
    S.probe = v3(0.5, -1.23, 0); onProbeMoved();
    var wantCurl = fmtNear(S.field.curl2.ev(0.5, -1.23, 0));  // 2.46
    if (document.getElementById('chip').textContent.indexOf(wantCurl) < 0)
      log.push('chip does not show 2D curl at the probe (wanted ' + wantCurl + ')');

    // the Gaussian-source demo: value must follow the probe, changing sign at r = 1
    applyDemo('3.2');
    S.probe = v3(0.2, 0.1, 0); onProbeMoved();
    if (!(S.field.div2.ev(0.2, 0.1, 0) > 1.5)) log.push('gaussian core is not a strong source');
    S.probe = v3(1.4, 0.2, 0); onProbeMoved();
    if (!(S.field.div2.ev(1.4, 0.2, 0) < 0)) log.push('gaussian ring is not a sink');
  } catch (e) { log.push('probe display check :: ' + e); }

  // the descent walker: reaches the bowl minimum; orbits (never collapses) on the curl game
  try {
    setWing('partial', true);
    applyDemo('5.0'); S.desc.running = false; descReset();
    for (var s2 = 0; s2 < 80; s2++) descStep();
    var wp = S.desc.walkers[0].path;
    var wl = wp[wp.length - 1];
    if (Math.hypot(wl.x, wl.y) > 0.05) log.push('descent did not reach the bowl minimum: r=' + Math.hypot(wl.x, wl.y));

    applyDemo('5.4'); S.desc.running = false; descReset();
    for (var s3 = 0; s3 < 150; s3++) descStep();
    var gp = S.desc.walkers[0].path;
    var wg = gp[gp.length - 1];
    var rg = Math.hypot(wg.x, wg.y), r0 = Math.hypot(1, 0.4);
    if (rg < r0 * 0.8) log.push('curl-game walker collapsed inward (should orbit): r=' + rg);
    if (gp.length < 100) log.push('curl-game walker stopped early: ' + gp.length);
  } catch (e) { log.push('descent check :: ' + e); }

  // the race: momentum must reach a lower loss than plain GD from the same start
  try {
    applyDemo('5.5'); S.desc.running = false; descReset();
    for (var s4 = 0; s4 < 60; s4++) descStep();
    var pa = S.desc.walkers[0].path, pb = S.desc.walkers[1].path;
    var la = pa[pa.length-1], lb = pb[pb.length-1];
    var fA2 = S.field.f.ev(la.x, la.y, 0), fB2 = S.field.f.ev(lb.x, lb.y, 0);
    if (!(fB2 < fA2)) log.push('momentum did not beat plain GD: ' + fA2 + ' vs ' + fB2);
  } catch (e) { log.push('race check :: ' + e); }

  // basins: the job completes and finds several minima with a painted bitmap
  try {
    applyDemo('5.6');
    var guard = 0;
    while (S.basins.job && guard++ < 4000) basinsWork();
    if (!S.basins.img) log.push('basins bitmap was not produced');
    if (!S.basins.minima || S.basins.minima.length < 3) log.push('basins found too few minima: ' + (S.basins.minima||[]).length);
  } catch (e) { log.push('basins check :: ' + e); }

  // Lagrange: the constrained walk halts where ∇f ∥ ∇g, at −R(2,3)/√13
  try {
    applyDemo('5.7');
    S.con.running = false; conReset();
    for (var s5 = 0; s5 < 500; s5++) conStepOnce();
    var cp = S.con.pos, s13 = Math.sqrt(13);
    if (Math.hypot(cp.x + 2*2/s13, cp.y + 2*3/s13) > 0.01)
      log.push('constrained walk missed the optimum: (' + cp.x + ',' + cp.y + ')');
    var al2 = conAlignment();
    if (al2.sin > 0.01) log.push('gradients not parallel at the constrained stop: sin=' + al2.sin);
  } catch (e) { log.push('lagrange check :: ' + e); }

  // fit: the walker lands on the normal-equation solution (0.7786, 0.2818)
  try {
    applyDemo('5.8'); S.desc.running = false; descReset();
    for (var s6 = 0; s6 < 250; s6++) descStep();
    var fp = S.desc.walkers[0].path, fl = fp[fp.length-1];
    if (Math.hypot(fl.x - 0.77864, fl.y - 0.28177) > 0.02)
      log.push('fit walker missed the least-squares solution: (' + fl.x + ',' + fl.y + ')');
  } catch (e) { log.push('fit check :: ' + e); }

  // mechanics: the Kepler demo conserves L_z and E through a full orbit
  try {
    setWing('vector', true);
    applyDemo('7.2');
    var kb = S.part.bodies[0];
    var L0 = kb.x.x*kb.v.y - kb.x.y*kb.v.x;
    var E0 = 0.5*(kb.v.x*kb.v.x + kb.v.y*kb.v.y) - 1/Math.hypot(kb.x.x, kb.x.y);
    for (var s7 = 0; s7 < 320; s7++) partAdvance(0.016);
    if (!kb.alive) log.push('Kepler orbit left the domain');
    var L1 = kb.x.x*kb.v.y - kb.x.y*kb.v.x;
    var E1 = 0.5*(kb.v.x*kb.v.x + kb.v.y*kb.v.y) - 1/Math.hypot(kb.x.x, kb.x.y);
    if (Math.abs(L1 - L0) > 1e-6) log.push('Kepler L_z drifted: ' + (L1 - L0));
    if (Math.abs(E1 - E0) > 1e-6) log.push('Kepler E drifted: ' + (E1 - E0));

    // cyclotron: constant speed, radius 1 about the guiding centre (0, −2)
    applyDemo('8.0');
    var cb = S.part.bodies[0];
    var rrMin = 1e9, rrMax = 0, spMin = 1e9, spMax = 0;
    for (var s8 = 0; s8 < 240; s8++) {
      partAdvance(0.016);
      var rr = Math.hypot(cb.x.x, cb.x.y + 2), sp = Math.hypot(cb.v.x, cb.v.y);
      if (rr < rrMin) rrMin = rr; if (rr > rrMax) rrMax = rr;
      if (sp < spMin) spMin = sp; if (sp > spMax) spMax = sp;
    }
    if (Math.abs(rrMin - 1) > 1e-3 || Math.abs(rrMax - 1) > 1e-3) log.push('cyclotron radius wrong: ' + rrMin + '..' + rrMax);
    if (spMax - spMin > 1e-8) log.push('magnetic force did work: ' + (spMax - spMin));

    // velocity selector: the balanced particle stays on the axis
    applyDemo('8.2');
    var vb = S.part.bodies[0];
    for (var s9 = 0; s9 < 200; s9++) partAdvance(0.016);
    if (Math.abs(vb.x.y) > 1e-6) log.push('velocity selector deflected the balanced particle: y=' + vb.x.y);
  } catch (e) { log.push('mechanics check :: ' + e); }

  // every physics-builder preset must produce a valid field in its own view
  try {
    for (var pi = 0; pi < PHYS_PRESETS.length; pi++) {
      physLoadPreset(pi);
      if (S.err) { log.push('physics preset ' + pi + ' failed to parse: ' + S.err); continue; }
      paint('physics preset ' + pi + ' "' + PHYS_PRESETS[pi].n + '"');
    }
    S.phys.objects = []; S.phys.applied = false;
  } catch (e) { log.push('physics preset check :: ' + e); }

  // field lines: cache built, enough lines, and exact tangency at a midpoint
  try {
    applyDemo('6.7');
    cache.fieldLines = null; drawFieldLines();
    if (!cache.fieldLines || cache.fieldLines.lines.length < 8)
      log.push('field lines missing: ' + (cache.fieldLines ? cache.fieldLines.lines.length : 'none'));
    else {
      var tangOK = 0, tangN = 0;
      for (var li = 0; li < Math.min(6, cache.fieldLines.lines.length); li++) {
        var ln = cache.fieldLines.lines[li];
        var i0 = Math.floor(ln.pts.length/2);
        var a0 = ln.pts[i0-1], b0 = ln.pts[i0];
        if (!a0 || !b0) continue;
        var seg = vnorm(vsub(b0, a0));
        var Fd = S.field.at((a0.x+b0.x)/2, (a0.y+b0.y)/2, 0);
        var Fn = vnorm(v3(Fd.x, Fd.y, 0));
        var ct = Math.abs(seg.x*Fn.x + seg.y*Fn.y + seg.z*Fn.z);
        tangN++; if (ct > 0.98) tangOK++;
      }
      if (tangOK < tangN) log.push('field lines not tangent: ' + tangOK + '/' + tangN);
    }
  } catch (e) { log.push('field line check :: ' + e); }

  // the eigenvalue meter shows the LIVE ratio at the probe, matching the engine
  try {
    setWing('quantum', true);
    applyDemo('3.0');
    S.probe = v3(1.3, -1.1, 0); onProbeMoved();
    var want9 = fmtNear(S.field.div2.ev(1.3,-1.1,0)/S.field.f.ev(1.3,-1.1,0));
    if (document.getElementById('probeReadout').textContent.indexOf(want9) < 0)
      log.push('eigenvalue meter missing or wrong (wanted ' + want9 + ')');
  } catch (e) { log.push('eigen meter check :: ' + e); }

  // ---- individual controls audit: toggle/drag/cycle EVERY panel control ----
  try {
    setWing('vector', true);
    var audited = 0;
    // every control panel now lives in the dock beneath the canvas; the rail
    // keeps only the guided-experiment list, which is exercised separately
    var rail = document.getElementById('dock');
    if (!rail) { log.push('the controls dock is missing'); rail = document.querySelector('.rail'); }
    function auditPass(tag){
      rail.querySelectorAll('input[type=checkbox]').forEach(function(c){
        var before = c.checked;
        c.click(); paint(tag+' chk '+(c.id||c.dataset.l)+' A');
        c.click(); paint(tag+' chk '+(c.id||c.dataset.l)+' B');
        if (c.checked !== before) log.push('checkbox did not restore: '+(c.id||c.dataset.l));
        audited++;
      });
      rail.querySelectorAll('input[type=range]').forEach(function(r){
        var before = r.value;
        r.value = r.min; r.dispatchEvent(new Event('input'));
        r.value = r.max; r.dispatchEvent(new Event('input'));
        r.value = before; r.dispatchEvent(new Event('input'));
        paint(tag+' range '+r.id);
        audited++;
      });
      rail.querySelectorAll('select').forEach(function(s){
        if (s.id === 'presetSel' || s.id === 'physPreset') return;
        var before = s.value;
        for (var oi = 0; oi < s.options.length; oi++){
          if (s.options[oi].disabled || !s.options[oi].value) continue;
          s.value = s.options[oi].value; s.dispatchEvent(new Event('change'));
          paint(tag+' select '+s.id+'='+s.value);
        }
        s.value = before; s.dispatchEvent(new Event('change'));
        audited++;
      });
      rail.querySelectorAll('.seg button').forEach(function(b){
        b.click(); paint(tag+' seg '+(b.dataset.m||b.dataset.i||b.dataset.s||b.dataset.a||b.dataset.mode||b.textContent.slice(0,10)));
        audited++;
      });
    }
    applyDemo('3.0'); auditPass('vector surf');   // planar option set
    setView('3d'); auditPass('vector 3d');        // 3D option set
    // the gradient, directional-derivative and optimization panels moved to the
    // partial-derivatives wing, so they have to be swept there
    setWing('partial', true);
    applyDemo('3.0'); auditPass('partial surf');
    setView('3d'); auditPass('partial 3d');
    setWing('vector', true);

    // ---- the circuit wing owns most of its controls inside the stage panel,
    //      so audit it on its own terms: every instrument, every tool, and the
    //      editor paths (place / wire / rotate / delete) that nothing else hits
    try {
      setWing('circuit', true);
      applyDemo('0.0');
      for (var cf = 0; cf < 4; cf++) stageFrame(0.02);
      ['scope','bode','sweep','spectrum','power','phasor','none'].forEach(function(p){
        try {
          document.querySelector('#ckPane button[data-ckp="'+p+'"]').click();
          for (var k = 0; k < 3; k++) stageFrame(0.02);
          paint('circuit pane '+p);
          var ro = document.getElementById('stageReadout').textContent;
          if (!ro || ro.length < 40) log.push('circuit pane '+p+' :: readout empty');
          audited++;
        } catch (e) { log.push('circuit pane '+p+' :: '+e); }
      });
      document.querySelector('#ckPane button[data-ckp="scope"]').click();
      auditPass('circuit');
      // every placement tool: select it, drop one on the board, check it landed
      var kinds = ['R','C','L','V','I','D','SW','SWV','OPAMP','XFMR','XFMRI','M',
                   'VCVS','VCCS','CCVS','CCCS','GND'];
      kinds.forEach(function(kind, ki){
        try {
          var b = document.querySelector('button[data-ckt="'+kind+'"]');
          if (!b) { log.push('circuit: no tool button for '+kind); return; }
          b.click();
          var before = ST.sch.comps.length;
          stagePick(R.W * 0.30 + (ki % 6) * 9, R.H * 0.16 + Math.floor(ki / 6) * 11, 'click');
          if (ST.sch.comps.length !== before + 1) log.push('circuit: placing '+kind+' added nothing');
          for (var k2 = 0; k2 < 2; k2++) stageFrame(0.02);
          paint('circuit place '+kind);
          // the editor panel for the part just placed must build and wire up
          if (document.getElementById('ckSelBody').innerHTML.length < 30)
            log.push('circuit: no editor panel for '+kind);
          audited++;
        } catch (e) { log.push('circuit place '+kind+' :: '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
      });
      auditPass('circuit parts');   // the value editors of everything just placed
      // rotate and delete the selection
      try {
        var rotBefore = ST.sch.comps[ST.sel] ? (ST.sch.comps[ST.sel].rot || 0) : null;
        document.getElementById('ckRot').click();
        if (rotBefore !== null && ((rotBefore + 90) % 360) !== (ST.sch.comps[ST.sel].rot || 0))
          log.push('circuit: rotate did not turn the part');
        var nBefore = ST.sch.comps.length;
        document.getElementById('ckDel').click();
        if (ST.sch.comps.length !== nBefore - 1) log.push('circuit: delete removed nothing');
        paint('circuit rotate+delete');
      } catch (e) { log.push('circuit rotate/delete :: '+e); }
      // the wire tool: two clicks must lay one segment
      try {
        document.querySelector('button[data-ckt="wire"]').click();
        var wBefore = ST.sch.wires.length;
        stagePick(R.W * 0.62, R.H * 0.30, 'click');
        stagePick(R.W * 0.72, R.H * 0.30, 'click');
        if (ST.sch.wires.length !== wBefore + 1) log.push('circuit: wire tool laid no segment');
        paint('circuit wire');
      } catch (e) { log.push('circuit wire :: '+e); }
      // drag a part with the probe tool
      try {
        document.querySelector('button[data-ckt="probe"]').click();
        applyDemo('0.1');
        for (var k3 = 0; k3 < 3; k3++) stageFrame(0.02);
        var c0 = ST.sch.comps[0], x0 = c0.x;
        var V0 = ckView(ST, R.W, R.H), p0 = V0.toS(c0.x, c0.y);
        stagePick(p0[0], p0[1], 'down');
        stagePick(p0[0] + V0.sc * 2, p0[1], 'move');
        stagePick(p0[0] + V0.sc * 2, p0[1], 'up');
        if (ST.sch.comps[0].x === x0) log.push('circuit: dragging a part did not move it');
        paint('circuit drag');
      } catch (e) { log.push('circuit drag :: '+e); }
      // run / step / restart
      ['ckRun','ckStep1','ckReset','ckRun'].forEach(function(id){
        try { document.getElementById(id).click(); for (var k4=0;k4<2;k4++) stageFrame(0.02); paint('circuit '+id); audited++; }
        catch (e) { log.push('circuit button '+id+' :: '+e); }
      });
      // clear all must leave a solvable-but-empty state rather than throwing
      try {
        document.getElementById('ckClear').click();
        for (var k5 = 0; k5 < 3; k5++) stageFrame(0.02);
        paint('circuit cleared');
        refreshStageReadout(); updateStageChip();
      } catch (e) { log.push('circuit clear :: '+e); }
      // the field overlay, on a real circuit, in every combination. Find the
      // demo by what it switches on rather than by index, so inserting groups
      // cannot silently stop this from being tested.
      try {
        var fieldKey = null;
        for (var fg = 0; fg < DEMOS.length && !fieldKey; fg++)
          for (var fi = 0; fi < DEMOS[fg].items.length; fi++) {
            var fo = DEMOS[fg].items[fi].opts;
            if (fo && fo.show && fo.show.efield) { fieldKey = fg + '.' + fi; break; }
          }
        if (!fieldKey) { log.push('circuit: no demo turns the field overlay on'); throw new Error('skip'); }
        applyDemo(fieldKey);
        for (var k6 = 0; k6 < 4; k6++) stageFrame(0.02);
        paint('circuit field overlay');
        if (!ST.field) log.push('circuit: the field demo did not build a Laplace grid');
        else {
          var q = ckFieldAt(ST.field, ST.probeP.x, ST.probeP.y);
          if (!Number.isFinite(q.V) || !Number.isFinite(q.Ex))
            log.push('circuit: the field probe returned a non-finite value');
        }
      } catch (e) { log.push('circuit field :: '+e); }
      setWing('vector', true);
    } catch (e) { log.push('circuit wing audit :: '+(e && e.stack ? e.stack.split('\n')[0] : e)); }

    // ---- the relativity wing keeps every control inside its stage panel too,
    //      so sweep each demo's own controls and assert the readouts stay finite.
    //      A NaN here would mean a boost, a geodesic or a metric factor blew up.
    try {
      setWing('relativity', true);
      var relBad = 0;
      for (var rg = 0; rg < DEMOS.length; rg++) {
        for (var ri = 0; ri < DEMOS[rg].items.length; ri++) {
          var rkey = rg + '.' + ri, rname = DEMOS[rg].items[ri].n;
          applyDemo(rkey);
          for (var rf = 0; rf < 4; rf++) stageFrame(0.05);
          var panel = document.getElementById('secStage');
          // every slider to both ends and back, repainting and re-reading each time
          panel.querySelectorAll('input[type=range]').forEach(function(r){
            [r.min, r.max, r.value].forEach(function(val){
              r.value = val; r.dispatchEvent(new Event('input'));
              for (var q2 = 0; q2 < 2; q2++) stageFrame(0.05);
              refreshStageReadout(); updateStageChip(); updateStageLegend();
              audited++;
            });
          });
          panel.querySelectorAll('input[type=checkbox]').forEach(function(c){
            c.click(); stageFrame(0.05); c.click(); stageFrame(0.05); audited++;
          });
          // segmented controls rebuild the panel, so re-query after each click
          var segIds = [];
          panel.querySelectorAll('.seg').forEach(function(s){ if (s.id) segIds.push(s.id); });
          segIds.forEach(function(sid){
            var s = document.getElementById(sid);
            if (!s) return;
            var n = s.children.length;
            for (var bi = 0; bi < n; bi++) {
              var sNow = document.getElementById(sid);
              if (!sNow || !sNow.children[bi]) continue;
              sNow.children[bi].click();
              for (var q3 = 0; q3 < 3; q3++) stageFrame(0.05);
              refreshStageReadout(); updateStageChip();
              audited++;
            }
          });
          // the draggable stages must survive a full pointer gesture
          if (STAGES[S.stage] && STAGES[S.stage].drag) {
            ['down','move','up'].forEach(function(ph){ stagePick(R.W * 0.35, R.H * 0.45, ph); });
            stagePick(R.W * 0.6, R.H * 0.3, 'click');
            for (var q4 = 0; q4 < 2; q4++) stageFrame(0.05);
          }
          refreshStageReadout(); updateStageChip(); updateStageLegend();
          var rtxt = document.getElementById('stageReadout').textContent;
          var ctxt = document.getElementById('chip').textContent;
          if (!rtxt || rtxt.length < 40) log.push('relativity ' + rkey + ' "' + rname + '" :: readout empty');
          if (/NaN|undefined|Infinity/.test(rtxt + ' ' + ctxt)) {
            relBad++;
            log.push('relativity ' + rkey + ' "' + rname + '" :: non-finite in readout — ' +
                     (rtxt + ' ' + ctxt).match(/.{0,40}(NaN|undefined|Infinity).{0,20}/)[0]);
          }
          paint('relativity ' + rkey + ' "' + rname + '"');
        }
      }
      // the engine's headline numbers, read back through the running app
      var mercury = grPrecessionPerCentury(GM_SUN, 5.7909050e10, 0.20563, 87.9691);
      if (Math.abs(mercury - 43.0) > 0.3) log.push('Mercury precession drifted: ' + mercury);
      var bend = grDeflection(GM_SUN, R_SUN) * ARCSEC;
      if (Math.abs(bend - 1.751) > 0.005) log.push('solar limb deflection drifted: ' + bend);
      if (Math.abs(grGPSRates().netUsPerDay - 38.5) > 0.3) log.push('GPS drift changed: ' + grGPSRates().netUsPerDay);
      // and the identity the whole E&M group rests on
      var wf = relWireFrames(1e-6, 1e-4, 2e5, 0.02, 1.6e-19);
      if (Math.abs(wf.Fprime - wf.gammaV * wf.Flab) > Math.abs(wf.Flab) * 1e-12)
        log.push('wire frames disagree: ' + wf.Fprime + ' vs ' + wf.gammaV * wf.Flab);
      window.__relBad = relBad;
      setWing('vector', true);
    } catch (e) { log.push('relativity wing audit :: '+(e && e.stack ? e.stack.split('\n')[0] : e)); }
    // ---- the six calculus wings keep every control inside their stage panels,
    //      exactly as relativity and circuits do, so they need the same explicit
    //      pass: drive every slider to both ends, click every checkbox and every
    //      segment, exercise the draggable ones, and assert no readout has gone
    //      non-finite. A NaN here would mean a quadrature, a Hessian or a Frenet
    //      frame has blown up on some setting the guided demos never visit.
    try {
      var calcBad = 0;
      ['algebra','functions','trig','limits','deriv','series','prob','numer','linsys','vecspace','eigen','laplace','systems','phase','complex','forms','potential','vectors','curves','partial','integral','vector','ode','mechanics','rotation','rotenergy','waves','fluids','thermo','optics','nuclear','solid','statmech','string'].forEach(function(wing){
        setWing(wing, true);
        for (var cg = 0; cg < DEMOS.length; cg++) {
          for (var ci = 0; ci < DEMOS[cg].items.length; ci++) {
            if (!DEMOS[cg].items[ci].stage) continue;      // field demos are swept elsewhere
            var ckey = cg + '.' + ci, cname = DEMOS[cg].items[ci].n;
            try { applyDemo(ckey); } catch (e0) { log.push('calc applyDemo ' + wing + ' ' + ckey + ' :: ' + e0); continue; }
            for (var cf2 = 0; cf2 < 4; cf2++) stageFrame(0.05);
            var cpanel = document.getElementById('secStage');
            cpanel.querySelectorAll('input[type=range]').forEach(function(r){
              [r.min, r.max, r.value].forEach(function(val){
                r.value = val; r.dispatchEvent(new Event('input'));
                for (var q5 = 0; q5 < 2; q5++) stageFrame(0.05);
                refreshStageReadout(); updateStageChip(); updateStageLegend();
                audited++;
              });
            });
            cpanel.querySelectorAll('input[type=checkbox]').forEach(function(c){
              c.click(); stageFrame(0.05); c.click(); stageFrame(0.05); audited++;
            });
            var cSegIds = [];
            cpanel.querySelectorAll('.seg').forEach(function(sg){ if (sg.id) cSegIds.push(sg.id); });
            cSegIds.forEach(function(sid){
              var sNow0 = document.getElementById(sid);
              if (!sNow0) return;
              var nb = sNow0.children.length;
              for (var bi2 = 0; bi2 < nb; bi2++) {
                var sNow = document.getElementById(sid);
                if (!sNow || !sNow.children[bi2]) continue;
                sNow.children[bi2].click();
                for (var q6 = 0; q6 < 3; q6++) stageFrame(0.05);
                refreshStageReadout(); updateStageChip();
                audited++;
              }
            });
            if (STAGES[S.stage] && STAGES[S.stage].drag) {
              ['down','move','up'].forEach(function(ph){ stagePick(R.W * 0.4, R.H * 0.45, ph); });
              stagePick(R.W * 0.55, R.H * 0.35, 'click');
              for (var q7 = 0; q7 < 2; q7++) stageFrame(0.05);
            }
            refreshStageReadout(); updateStageChip(); updateStageLegend();
            var ctxt2 = document.getElementById('stageReadout').textContent;
            var chp2 = document.getElementById('chip').textContent;
            if (!ctxt2 || ctxt2.length < 40) log.push('calc ' + wing + ' ' + ckey + ' "' + cname + '" :: readout empty');
            if (/NaN|undefined|Infinity/.test(ctxt2 + ' ' + chp2)) {
              calcBad++;
              log.push('calc ' + wing + ' ' + ckey + ' "' + cname + '" :: non-finite — ' +
                       (ctxt2 + ' ' + chp2).match(/.{0,40}(NaN|undefined|Infinity).{0,20}/)[0]);
            }
            paint('calc ' + wing + ' ' + ckey + ' "' + cname + '"');
          }
        }
      });
      window.__calcBad = calcBad;

      // the engine identities the calculus wings rest on, read back through the
      // running app rather than from the unit suite
      var gA = vcGreenCheck('-y', 'x', VC_PATHS.circle, 1.4);
      if (gA.gap > 1e-6) log.push("Green's theorem drifted: " + gA.gap);
      var sA = vcStokesCheck(vcField3('-y','x','0'), VC_SURFACES.hemisphere,
        { t0:0, t1:2*Math.PI, f:function(t){ return v3(Math.cos(t), Math.sin(t), 0); },
          d:function(t){ return v3(-Math.sin(t), Math.cos(t), 0); } }, 1);
      if (sA.gap > 1e-6) log.push("Stokes' theorem drifted: " + sA.gap);
      var dF = vcField3('x','y','z');
      var dSph = { u0:0, u1:Math.PI, v0:0, v1:2*Math.PI,
        r:function(u,v){ return v3(Math.sin(u)*Math.cos(v), Math.sin(u)*Math.sin(v), Math.cos(u)); } };
      if (Math.abs(vcSurfFlux(dSph, dF.F, 1) - vcBallDivIntegral(dF, 1)) > 1e-6)
        log.push('divergence theorem drifted');
      if (Math.abs(igRegionIntegral(IG_REGIONS.disc, function(){ return 1; }, 'polar') - Math.PI) > 1e-8)
        log.push('the quarter disc no longer has area pi');
      if (Math.abs(nqTripleSph(function(){ return 1; }, 0, 2*Math.PI, function(){ return 0; },
            function(){ return Math.PI; }, function(){ return 0; }, function(){ return 2; }, 5, 8)
            - 32*Math.PI/3) > 1e-8)
        log.push('the ball volume drifted');
      var hFrame = pcFrame(PC_SPACE.helix, 1.3, 1.6, 0.45);
      if (Math.abs(hFrame.kappa - 1.6/(1.6*1.6+0.45*0.45)) > 1e-9)
        log.push('helix curvature drifted: ' + hFrame.kappa);
      var oS = odHomog(1, 0, 4, 1, 0);
      if (Math.abs(oS.y(0.7) - Math.cos(1.4)) > 1e-12) log.push('the undamped solution drifted');
      setWing('vector', true);
    } catch (e) { log.push('calculus wing audit :: '+(e && e.stack ? e.stack.split('\n')[0] : e)); }

    // action buttons, explicitly
    ['fxShrink','ciSweepBtn','gdRun','gdStep','gdRestart','gdConRun','gdConReset',
     'gdBasClear','ptLaunch','ptRun','ptClear','physClear','dsPlay'].forEach(function(id){
      var b = document.getElementById(id);
      if (b && b.offsetParent !== null || b) { try { b.click(); paint('btn '+id); audited++; } catch(e){ log.push('button '+id+' :: '+e); } }
    });
    // state bindings, spot-checked
    setWing('partial', true);
    applyDemo('3.0');
    var el = document.getElementById('dsN'); el.value = 7; el.dispatchEvent(new Event('input'));
    if (S.density !== 7) log.push('dsN → S.density binding broken');
    applyDemo('5.0');
    el = document.getElementById('gdEta'); el.value = 0.5; el.dispatchEvent(new Event('input'));
    if (Math.abs(S.desc.eta - 0.5) > 1e-9) log.push('gdEta → S.desc.eta binding broken');
    setWing('vector', true);
    applyDemo('3.0');
    el = document.getElementById('fxH'); el.value = 1.0; el.dispatchEvent(new Event('input'));
    if (Math.abs(S.flux.h - 1.0) > 1e-9) log.push('fxH → S.flux.h binding broken');
    el = document.getElementById('ciR'); el.value = 1.2; el.dispatchEvent(new Event('input'));
    if (Math.abs(S.circ.r - 1.2) > 1e-9) log.push('ciR → S.circ.r binding broken');
    setView('2d'); if (S.view !== '2d') log.push('setView binding broken');
    // promote buttons prove the identities end-to-end through the UI
    setWing('partial', true);
    applyDemo('3.4');
    document.getElementById('btnPromoteGrad').click();
    if (S.mode !== 'vector') log.push('Send ∇f to F did not switch modes');
    else if (vlen(S.field.curlAt(0.5,0.4,0.3)) > 1e-10) log.push('curl(grad f) not zero after promote');
    setWing('vector', true);
    applyDemo('5.0');
    document.getElementById('btnPromoteCurl').click();
    if (Math.abs(S.field.divAt(0.5,0.4,0.3)) > 1e-10) log.push('div(curl F) not zero after promote');
    window.__audited = audited;
  } catch (e) { log.push('controls audit :: ' + e); }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = 'demos=' + n + ' presets=' + np + ' controls=' + (window.__audited||0) +
    ' jsErrors=' + window.__errs.length +
    (window.__errs.length ? ' [' + window.__errs.slice(0,4).join(' ;; ') + ']' : '') +
    ' calcNaN=' + (window.__calcBad||0) + ' caught=' + log.length + (log.length ? ' [' + log.slice(0, 6).join(' ;; ') + ']' : ' OK');
  document.body.appendChild(t);
}, 1500);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-all.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$prof = Join-Path $dir 'cprof'
$url = 'file:///' + ($out -replace '\\','/')
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=120000 `
          --user-data-dir="$prof" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-all.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'dom-all.txt') -Raw -Encoding UTF8
$m = 'id="REPORT">'
$a = $dom.IndexOf($m)
if ($a -lt 0) { Write-Output 'NO REPORT'; Write-Output $dom.Substring(0,[Math]::Min(1500,$dom.Length)) }
else { $a += $m.Length; Write-Output $dom.Substring($a, $dom.IndexOf('</div>', $a) - $a) }
