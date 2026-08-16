/* ============================================================================
   
2ma - MAXWELL: THE DISPLACEMENT CURRENT AND THE WAVE
   Split out of 
60i-stages-em-maxwell.js
 to keep each file under the ~600-line guidance
   in src/js/CLAUDE.md. Load order is unchanged: this file sorts immediately
   after its parent, and everything shares one script scope.
   ============================================================================ */


/* ---- 20 · Ampère–Maxwell: the displacement current ---------------------------- */
STAGES.emAmpere = {
  title: 'Ampère–Maxwell',
  derive(st){
    if(st.mode === 'own') return STAGES.emAmpere.deriveOwn(st);
    return {
      title:'The term Maxwell added, and why it was forced on him',
      steps:[
        drvStep('Ampère\'s original law',
          `∮ ${dv('B')} ${dop('·')} d${dv('r')} ${dop('=')} μ₀${dv('I')}_enc`,
          st.mode === 'wire' ? `current ${fmtNum(st.I, 3)} A — the panel integrates B round the loop` : ''),
        drvSay('now consider a charging capacitor, which breaks it',
          'Take a loop round the wire feeding a capacitor. Stokes says the circulation equals the current through *any* surface bounded by that loop. Choose a flat disc and the wire pierces it: the answer is μ₀I. Bulge the surface out between the capacitor plates and no current crosses it at all: the answer is zero.'),
        drvStep('so the law contradicts itself',
          `μ₀${dv('I')} ${dop('≠')} 0`,
          'the same loop, two surfaces, two different answers — the law cannot be right as stated'),
        drvSay('Maxwell\'s fix, and its logic',
          'Something must cross the bulging surface. Between the plates there is no current but there is a growing electric field. If a changing E counts as a current for this purpose, the two surfaces agree again — and the amount needed is fixed exactly by requiring that agreement.'),
        drvStep('the displacement current',
          `${dv('I')}_d ${dop('=')} ε₀${dfrac('dΦ_E', 'd' + dv('t'))}`,
          st.mode !== 'wire' ? 'the panel computes it between the plates and matches it to the wire current' : 'switch to the capacitor to see the two agree'),
        drvStep('and the corrected law',
          `∮ ${dv('B')} ${dop('·')} d${dv('r')} ${dop('=')} μ₀(${dv('I')} ${dop('+')} ε₀${dfrac('dΦ_E', 'd' + dv('t'))})`,
          'the panel shows both surfaces giving the same total'),
        drvSay('this was theory correcting experiment, which is rare',
          'No measurement demanded the extra term. Maxwell added it in 1861 because the equations were inconsistent without it, and the effect it describes is far too weak to have been noticed. It is one of the clearest cases of mathematical consistency predicting new physics.'),
        drvStep('and with it, the equations support waves',
          `∇${dop('×')}${dv('B')} ${dop('=')} μ₀ε₀${dfrac('∂' + dv('E'), '∂' + dv('t'))}`,
          'a changing E makes B, and Faraday says a changing B makes E — each sustains the other'),
        drvSay('so the term Maxwell added is the reason light exists',
          'Without it the equations describe fields tied to their sources and nothing more. With it they permit a self-sustaining disturbance travelling at 1/√(μ₀ε₀), which came out equal to the measured speed of light. The next stage does that calculation.')
      ],
      note:'The panel computes the circulation for both a flat and a bulging surface on the same loop. Without the displacement term they disagree; with it they match to integration accuracy — the inconsistency and its repair, both measured.'
    };
  },
  drag: true,
  enter(st, o){
    st.mode = o.mode || 'wire';
    st.I = 2; st.R = 1.1; st.tt = 0; st.dragging = false;
    STAGES.emAmpere.enterOwn(st, o);
    if(st.mode !== 'own') st.R = 1.1;         // the loop slider means two different things
  },
  controls(){
    const seg = ctlRow('setup', ctSeg('eaMode', ST.mode,
      [['wire', 'straight wire'], ['capacitor', 'charging capacitor'],
       ['own', 'write your own current density']]));
    if(ST.mode === 'own') return seg + STAGES.emAmpere.controlsOwn();
    return seg +
      ctlRow('current I', ctlSlider('eaI', -3, 3, 0.1, ST.I)) +
      ctlRow('loop radius', ctlSlider('eaR', 0.4, 2.4, 0.05, ST.R)) +
      `<p class="help">Ampère's original law says ∮B·dl = I through <i>any</i> surface bounded by the loop. The capacitor breaks it: stretch the surface into the gap between the plates and <b>no current crosses it at all</b>, yet the magnetic field is plainly still there. Maxwell's added ∂E/∂t term supplies exactly the missing amount, because the E field between the plates is growing. That repair was not cosmetic — it is what makes light possible.</p>`;
  },
  wire(){
    ctWireSeg('eaMode', v => {
      ST.mode = v;
      if(v === 'own'){
        const P = EM_J_PRESETS.find(p => p.k === ST.jkey) || EM_J_PRESETS[0];
        ST.R = P.R || 0.8;
      } else ST.R = 1.1;
    });
    if(ST.mode === 'own') return STAGES.emAmpere.wireOwn();
    wireSlider('eaI', () => ST.I, v => { ST.I = v; }, v => (+v).toFixed(1));
    wireSlider('eaR', () => ST.R, v => { ST.R = v; }, v => (+v).toFixed(2));
  },
  pick(st, sx, sy, phase){
    if(st.mode !== 'own' || !st.emS) return;
    if(phase === 'up'){ st.dragging = false; return; }
    if(phase === 'down' || phase === 'click') st.dragging = true;
    if(st.dragging) st.lc = { x:(sx - st.emCx) / st.emS, y:(st.emCy - sy) / st.emS };
  },
  capValues(st){
    const A = Math.PI * 1.4 * 1.4;
    return { A, dEdt: st.I / A, Idisp: st.I };
  },
  frame(st, dt, ctx, W, H){
    st.tt += dt;
    if(st.mode === 'own') return STAGES.emAmpere.frameOwn(st, dt, ctx, W, H);
    if(st.mode === 'wire'){
      const V = emView(st, W, H, 3.6);
      const objs = [{ kind:'wire', I: st.I, p:{x:0,y:0,z:0} }];
      st.objs = objs;
      const lines = emFieldLines(objs, 'B', V.ext);
      ctx.strokeStyle = rgbCss(TH.neg, 0.6); ctx.lineWidth = 1.3;
      for(const ln of lines){
        if(ln.pts.length < 3) continue;
        ctx.beginPath();
        ln.pts.forEach((p, i) => { const [x, y] = V.toS(p.x, p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
      }
      emDrawObject(ctx, objs[0], V, false);
      const [cx, cy] = V.toS(0, 0), rr = st.R * V.sc;
      ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2.4; ctx.setLineDash([7, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      const K = 24;
      for(let i = 0; i < K; i++){
        const a = (i + 0.5) / K * 2 * Math.PI;
        const p = v3(st.R * Math.cos(a), st.R * Math.sin(a), 0);
        const T = v3(-Math.sin(a), Math.cos(a), 0);
        const d = vdot(emField(objs, p, 0).B, T);
        const [sx, sy] = V.toS(p.x, p.y);
        const L = Math.max(-1, Math.min(1, d / 0.4)) * 22;
        emDrawArrow(ctx, sx, sy, sx + T.x * L, sy - T.y * L, d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 1.6, 7);
      }
      ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 12px ' + FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('∮B·dl around the loop = the current threading it — whatever the radius', W / 2, 12);
      stageNote(ctx, 'B falls as 1/s while the path grows as s, so the product is fixed: the circulation counts current, nothing else', W, H);
      return;
    }
    /* charging capacitor, side view */
    const cx = W / 2, cy = H / 2 - 6, sc = Math.min((W - 220) / 7, (H - 190) / 5);
    const gap = 1.15 * sc, ph = 1.45 * sc;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(cx - gap / 2, cy - ph); ctx.lineTo(cx - gap / 2, cy + ph); ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.neg);
    ctx.beginPath(); ctx.moveTo(cx + gap / 2, cy - ph); ctx.lineTo(cx + gap / 2, cy + ph); ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - gap / 2 - 190, cy); ctx.lineTo(cx - gap / 2, cy);
    ctx.moveTo(cx + gap / 2, cy); ctx.lineTo(cx + gap / 2 + 190, cy); ctx.stroke();
    const flow = (st.tt * st.I * 55) % 36;
    ctx.fillStyle = rgbCss(TH.warn);
    for(let k = -6; k < 7; k++){
      const x1 = cx - gap / 2 - 190 + (((flow + k * 36) % 190) + 190) % 190;
      ctx.beginPath(); ctx.arc(x1, cy, 3, 0, 6.2832); ctx.fill();
      const x2 = cx + gap / 2 + (((flow + k * 36) % 190) + 190) % 190;
      ctx.beginPath(); ctx.arc(x2, cy, 3, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = rgbCss(TH.warn); ctx.font = '600 11px ' + FONT_MONO;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('I = ' + fmtNum(st.I, 2), cx - gap / 2 - 95, cy - 10);
    const nE = 7;
    for(let i = 0; i < nE; i++){
      const y = cy - ph + (i + 0.5) * 2 * ph / nE;
      emDrawArrow(ctx, cx - gap / 2 + 8, y, cx + gap / 2 - 8, y, rgbCss(TH.warn, 0.85), 2, 9);
    }
    ctx.fillStyle = rgbCss(TH.warn); ctx.font = '600 11px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('E growing between the plates  →  dΦ_E/dt = ' + fmtNum(st.I, 2), cx, cy + ph + 12);
    const lx = cx - gap / 2 - 95;
    ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2.4; ctx.setLineDash([7, 4]);
    ctx.beginPath(); ctx.ellipse(lx, cy, 15, ph * 0.85, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = rgbCss(TH.curl); ctx.font = '600 11px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('one loop, two surfaces…', lx, cy - ph * 0.85 - 10);
    ctx.setLineDash([4, 3]); ctx.lineWidth = 2;
    ctx.strokeStyle = rgbCss(TH.grad, 0.95);
    ctx.beginPath(); ctx.moveTo(lx, cy - ph * 0.85); ctx.lineTo(lx, cy + ph * 0.85); ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.accent, 0.95);
    ctx.beginPath();
    ctx.moveTo(lx, cy - ph * 0.85);
    ctx.bezierCurveTo(cx - 20, cy - ph * 1.3, cx + 4, cy - ph * 0.4, cx, cy);
    ctx.bezierCurveTo(cx + 4, cy + ph * 0.4, cx - 20, cy + ph * 1.3, lx, cy + ph * 0.85);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '600 11px ' + FONT_UI; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = rgbCss(TH.grad);
    ctx.fillText('flat surface — cuts the wire:  I = ' + fmtNum(st.I, 2) + ',  dΦ_E/dt = 0', 24, cy + ph * 1.24);
    ctx.fillStyle = rgbCss(TH.accent);
    ctx.fillText('bulged surface — cuts only the gap:  I = 0,  dΦ_E/dt = ' + fmtNum(st.I, 2), 24, cy + ph * 1.5);
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 12.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('two surfaces, one boundary — only I + dΦ_E/dt gives them the same answer', W / 2, 14);
    stageNote(ctx, 'Maxwell added ∂E/∂t to make the law surface-independent; the by-product was waves travelling at 1/√(μ₀ε₀)', W, H);
  },
  readout(st){
    if(st.mode === 'own') return STAGES.emAmpere.readoutOwn(st);
    if(st.mode === 'wire'){
      const objs = st.objs || [{ kind:'wire', I: st.I, p:{x:0,y:0,z:0} }];
      const circ = emCircB(objs, v3(0,0,0), st.R, v3(0,0,1), 0, 300);
      const Ienc = emEnclosedCurrent(objs, v3(0,0,0), st.R, v3(0,0,1), 0);
      return `<div class="card tight"><div class="ttl">Amperian loop, R = ${fmtNum(st.R, 2)}</div>
        ${kv('∮B·dl (measured)', '<b>' + fmtNum(circ, 5) + '</b>')}
        ${kv('I enclosed', fmtNum(Ienc, 4))}
        ${kv('dΦ_E/dt (nothing changing)', '0')}
        ${kv('∮B·dl = I + dΦ_E/dt', Math.abs(circ - Ienc) < 2e-3 ? '✓ holds' : fmtNum(circ - Ienc, 5))}
        ${kv('|B| on the loop', fmtNum(Math.abs(st.I) / (2 * Math.PI * st.R), 5) + ' = I/2πs')}
        <p class="help">Change the radius: |B| falls as 1/s, the path length grows as 2πs, and the product never moves. The circulation of B is a pure current counter — the magnetic analogue of Gauss's law counting charge.</p>
      </div>`;
    }
    const cv = this.capValues(st);
    return `<div class="card tight"><div class="ttl">Charging capacitor</div>
      ${kv('conduction current I', fmtNum(st.I, 4))}
      ${kv('plate area A', fmtNum(cv.A, 4))}
      ${kv('E in the gap grows at', fmtNum(cv.dEdt, 4) + ' per unit time')}
      ${kv('displacement current ε₀dΦ_E/dt', '<b>' + fmtNum(cv.Idisp, 4) + '</b>')}
      ${kv('through the flat surface', fmtNum(st.I, 3) + ' + 0')}
      ${kv('through the bulged surface', '0 + ' + fmtNum(cv.Idisp, 3))}
      ${kv('same total either way?', '✓ ' + fmtNum(st.I, 3))}
    </div>
    <div class="card tight"><div class="ttl">Why this term made light</div>
      <p class="help">With ∂E/∂t in place the equations become symmetric: a changing B makes E (Faraday), and a changing E makes B (Maxwell). Take the curl of one, substitute the other, and you get <b>∇²E = μ₀ε₀ ∂²E/∂t²</b> — a wave equation whose speed is 1/√(μ₀ε₀). Maxwell computed that number in 1862 from two bench measurements of electricity and magnetism, got 3.1×10⁸ m/s, and concluded light "is an electromagnetic disturbance." No optics experiment was involved.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'own') return STAGES.emAmpere.chipOwn(st);
    if(st.mode === 'wire'){
      const objs = [{ kind:'wire', I: st.I, p:{x:0,y:0,z:0} }];
      return `<div class="k">Ampère · wire</div><div style="color:var(--c-curl)">∮B·dl = ${fmtNum(emCircB(objs, v3(0,0,0), st.R, v3(0,0,1), 0, 160), 4)}</div><div>I = ${fmtNum(st.I, 3)}</div>`;
    }
    return `<div class="k">Ampère–Maxwell · capacitor</div><div>I = ${fmtNum(st.I, 3)}</div><div style="color:var(--accent)">I_disp = ${fmtNum(st.I, 3)}</div>`;
  },
  legend(st){
    const m = (st && st.mode) || (ST && ST.mode);
    if(m === 'own') return STAGES.emAmpere.legendOwn();
    return m === 'wire'
      ? [['var(--c-neg)','B lines circling the wire'],['var(--c-curl)','the Amperian loop'],['var(--c-pos)','B·T̂ along the path']]
      : [['var(--c-warn)','current, and E growing in the gap'],['var(--c-grad)','flat surface (cuts the wire)'],['var(--accent)','bulged surface (cuts the gap)']];
  }
};

/* ---- 21 · the wave that falls out of the four equations ---------------------- */
STAGES.emWave = {
  title: 'The electromagnetic wave',
  derive(st){
    const mu0 = 4e-7 * Math.PI, eps0 = 8.8541878188e-12;
    const c = 1 / Math.sqrt(mu0 * eps0);
    return {
      title:'Deriving the speed of light from two laboratory constants',
      steps:[
        drvSay('the setup: two laws that feed each other',
          'Faraday says a changing B creates a circulating E. Ampère–Maxwell says a changing E creates a circulating B. Each sustains the other, so a disturbance could in principle keep itself going with no charges present at all. The question is whether the equations really permit it.'),
        drvStep('take the curl of Faraday\'s law',
          `∇${dop('×')}(∇${dop('×')}${dv('E')}) ${dop('=')} ${dop('−')}${dfrac('∂', '∂' + dv('t'))}(∇${dop('×')}${dv('B')})`,
          'curl both sides, and swap the order of the space and time derivatives'),
        drvStep('substitute Ampère–Maxwell on the right',
          `${dop('=')} ${dop('−')}μ₀ε₀${dfrac('∂²' + dv('E'), '∂' + dv('t') + '²')}`,
          'in empty space there is no current, so only the displacement term survives'),
        drvStep('and use the identity for a double curl',
          `∇${dop('×')}(∇${dop('×')}${dv('E')}) ${dop('=')} ∇(∇${dop('·')}${dv('E')}) ${dop('−')} ∇²${dv('E')}`,
          'the first term vanishes because there is no charge, so ∇·E = 0'),
        drvStep('what is left is the wave equation',
          `∇²${dv('E')} ${dop('=')} μ₀ε₀${dfrac('∂²' + dv('E'), '∂' + dv('t') + '²')}`,
          'the same equation as a vibrating string, in three dimensions'),
        drvSay('and comparing it with the string tells you the speed',
          'The wave equation always reads ∇²y = (1/v²)∂²y/∂t². So here 1/v² = μ₀ε₀, and the speed is fixed entirely by two constants measured with capacitors and coils on a bench.'),
        drvStep('put the numbers in',
          `${dv('c')} ${dop('=')} ${dfrac('1', '√(μ₀ε₀)')}`,
          `= ${fmtNum(c, 9)} m/s — and the measured speed of light is 299 792 458 m/s exactly`),
        drvSay('this is one of the great moments in physics',
          'Two constants from electrostatics and magnetostatics, neither having anything to do with light, combine to give the speed of light. Maxwell wrote that the agreement made it "scarcely avoidable" to conclude that light is an electromagnetic wave. It was, and it is.'),
        drvStep('the fields are perpendicular to each other and to the motion',
          `${dv('E')} ${dop('⊥')} ${dv('B')} ${dop('⊥')} ${dv('k')}, &nbsp; |${dv('E')}| ${dop('=')} ${dv('c')}|${dv('B')}|`,
          'the panel draws all three and the probe reads their instantaneous values'),
        drvSay('and the constancy of c is what forced relativity',
          'This derivation contains no reference frame. It gives the same c to every observer, which is flatly incompatible with Galilean velocity addition. Einstein took the equations at their word rather than patching them, and special relativity is the consequence.'),
        drvStep('then measure it, from a current you invent',
          `${dv('c')}_meas ${dop('=')} ${dfrac('Δ' + dv('x'), 'Δ' + dv('t'))}`,
          'the "type your own source" scene marches the two curl equations — whose update contains μ₀ and ε₀ separately and never c — and times the front of your wave between two probes 10 m apart'),
        drvSay('because the update rule has never heard of light',
          'Each step advances E from the neighbouring H using 1/ε₀, and H from the neighbouring E using 1/μ₀. Nothing in the loop knows the product μ₀ε₀ matters. That the front still crosses 10 m in 33.36 ns — for a Gaussian, a square pulse, or anything else you type — is the wave equation asserting itself, and the panel prints the measured speed beside 1/√(μ₀ε₀) with the difference. The impedance E/H = √(μ₀/ε₀) and the retarded waveform are checked the same way.')
      ],
      note:'The value printed is computed from the CODATA values of μ₀ and ε₀ at run time, not quoted. Since the 2019 SI redefinition c is exact by definition and ε₀ is measured, so the tiny residual is in the constants rather than in the derivation.'
    };
  },
  /* the wave scene is 3D; the typed-source scene is a flat pair of plots, and
     the core clears the canvas for it (mode may be a function of the state).
     The typed scene fills the canvas with plots, so the key sits in the dock. */
  mode: st => (st && st.scene === 'own') ? '2d' : '3d',
  dockLegend: true,
  enter(st, o){
    st.scene = o.scene || 'wave';
    st.k = 1.6; st.probe = 0;
    st.src = 'exp(-((t-10)/3)^2)';
    st.ownR = null; st.ownErr = '';
    if(st.scene === 'own') this.ownCompute(st);
    R.cam.az = 0.62; R.cam.el = 0.30; R.cam.dist = 11; R.cam.tx = R.cam.ty = R.cam.tz = 0;
  },
  /* The typed source is K(t) with t in NANOSECONDS — the one variable allowed.
     The parser's slots are x, y, z, so t is rewritten onto x; a stray x, y or
     z in the source is rejected with its own message rather than silently
     read as something. */
  kBuild(s){
    if(/(?<![A-Za-z])[xyz](?![A-Za-z])/.test(String(s)))
      throw new Error('the sheet current depends on time alone — write K(t), with t in ns');
    const g = compile(parse(String(s).replace(/(?<![A-Za-z])t(?![A-Za-z])/g, 'x')));
    return { f: tns => g(tns, 0, 0) };
  },
  /* One marcher run per typed source — cached against the text, never re-run
     inside frame(). ~30 ms: 2400 cells × 2960 steps. */
  ownCompute(st){
    if(st.ownR && st.ownR.src === st.src) return st.ownR;
    const made = this.kBuild(st.src);
    const KSI = s => { const v = made.f(s * 1e9); return Number.isFinite(v) ? v : 0; };
    const r = emFDTD1D(KSI, { snapEvery: 8 });
    r.src = st.src; r.kf = made.f;
    let pk = 1e-12;
    for(let i = 0; i < r.steps; i++) pk = Math.max(pk, Math.abs(r.Eb[i]), Math.abs(r.Ea[i]));
    r.pk = Math.max(pk, r.shapePeak);
    st.ownR = r;
    return r;
  },
  controls(){
    const st = ST;
    return ctSeg('ewSc', st.scene, [['wave', 'the plane wave'], ['own', 'type your own source current']]) +
      (st.scene === 'own'
        ? fnHtml('ewSrc', 'K(t) =', st.src, 'the sheet current in A/m, t in nanoseconds') +
          `<p class="help">Your K(t) drives a current sheet, and the two curl equations are marched
          forward on a grid — an update rule that contains <b>μ₀ and ε₀ separately and never c</b>.
          Whatever you type travels at one speed: the panel times the front between two probes 10 m
          apart and only then compares the result with 1/√(μ₀ε₀). It also checks the wave impedance
          E/H against √(μ₀/ε₀) = 376.73 Ω, and the whole waveform against the retarded closed form
          −(μ₀c/2)·K(t − x/c). Make the pulse sharper and watch the grid's own resolution show up in
          the comparison — the mismatch is the quadrature's, never Maxwell's.</p>`
        : ctlRow('wavenumber k', ctlSlider('ewK', 0.6, 3.2, 0.05, ST.k)) +
          ctlRow('probe x', ctlSlider('ewX', -4, 4, 0.05, ST.probe)) +
          `<p class="help">Nothing here is drawn by hand: this is the solution of Maxwell's equations in empty space. <b>E ⊥ B ⊥ direction of travel</b>, in phase, equal in size (in these units), moving at c = 1/√(μ₀ε₀). Each field sustains the other — Faraday turns the changing B into E, Maxwell's new term turns the changing E back into B — so the pair propagates forever with no charges anywhere. Drag to orbit and check the perpendicularity from any angle.</p>`);
  },
  wire(){
    ctWireSeg('ewSc', v => { ST.scene = v; if(v === 'own') STAGES.emWave.ownCompute(ST); buildStagePanel(); });
    fnWire('ewSrc', (made, src) => { ST.src = src; ST.ownR = null; STAGES.emWave.ownCompute(ST); },
           s => this.kBuild(s));
    wireSlider('ewK', () => ST.k, v => { ST.k = v; }, v => (+v).toFixed(2));
    wireSlider('ewX', () => ST.probe, v => { ST.probe = v; }, v => (+v).toFixed(2));
  },
  frameOwn(st, ctx, W, H){
    const r = st.ownR || this.ownCompute(st);
    const Tns = r.t[r.steps - 1] * 1e9;
    const loop = (st.t * 8) % Tns;                       // 8 ns of wave time per second
    /* top: the snapshot E(x) at the loop time, with source and probes marked */
    const si = Math.min(r.snaps.length - 1, Math.floor(loop / Tns * r.snaps.length));
    const snap = r.snaps[si];
    const topH = Math.max(120, H * 0.38);
    const pk = r.pk * 1.15;
    const pl = st.pl = mkPlot(60, 42, W - 104, topH, 0, r.L, -pk, pk);
    plotFrame(ctx, pl, 'x (m)', 'E (V/m)', 'the sheet at x = 4 m radiating your K(t) — snapshot');
    pvClip(ctx, pl, () => {
      ctx.strokeStyle = rgbCss(TH.faint, 0.8); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
      for(const xv of [r.xs, r.xa, r.xb]){
        ctx.beginPath(); ctx.moveTo(pl.X(xv), pl.Y(-pk)); ctx.lineTo(pl.X(xv), pl.Y(pk)); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctText(ctx, pl.X(r.xs) + 4, pl.Y(pk * 0.9), 'source', rgbCss(TH.dim), '10px ' + FONT_UI);
      ctText(ctx, pl.X(r.xa) + 4, pl.Y(pk * 0.9), 'probe A', rgbCss(TH.dim), '10px ' + FONT_UI);
      ctText(ctx, pl.X(r.xb) + 4, pl.Y(pk * 0.9), 'probe B', rgbCss(TH.dim), '10px ' + FONT_UI);
    });
    const sampX = x => {
      const u = Math.max(0, Math.min(1, x / r.L)) * (snap.E.length - 1);
      const k = Math.min(snap.E.length - 2, Math.floor(u));
      return snap.E[k] + (snap.E[k + 1] - snap.E[k]) * (u - k);
    };
    plotCurve(ctx, pl, sampX, 480, rgbCss(TH.warn), 2.2);
    ctText(ctx, pl.px + pl.pw - 8, pl.py + 14, 't = ' + fmtNum(snap.t * 1e9, 3) + ' ns',
           rgbCss(TH.dim), '600 11px ' + FONT_MONO, 'right');
    /* bottom: what the probes recorded, with the closed form over probe B —
       the closed form is sampled fresh from the reader's K, so the dashed
       curve shares nothing with the march it rides on */
    const y1 = 42 + topH + 46;
    const pl2 = st.pl2 = mkPlot(60, y1, W - 104, Math.max(80, H - y1 - 52), 0, Tns, -pk, pk);
    plotFrame(ctx, pl2, 't (ns)', 'E (V/m)', 'the two probes — and the retarded closed form riding on B');
    const sampT = arr => tns => {
      const u = tns * 1e-9 / r.dt - 1;
      if(u < 0 || u > r.steps - 1) return 0;
      const k = Math.min(r.steps - 2, Math.max(0, Math.floor(u)));
      return arr[k] + (arr[k + 1] - arr[k]) * (u - k);
    };
    plotCurve(ctx, pl2, sampT(r.Ea), 480, rgbCss(TH.neg, 0.75), 1.6);
    plotCurve(ctx, pl2, sampT(r.Eb), 480, rgbCss(TH.warn), 2.2);
    ctx.setLineDash([6, 4]);
    plotCurve(ctx, pl2, tns => {
      const v = -(EM_MU0 * r.c0 / 2) * r.kf(tns - (r.xb - r.xs) / r.c0 * 1e9);
      return Number.isFinite(v) ? v : 0;
    }, 480, rgbCss(TH.grad), 1.6);
    ctx.setLineDash([]);
    pvClip(ctx, pl2, () => {
      for(const [tv, lab] of [[r.ta, 'front at A'], [r.tb, 'front at B']]){
        if(!Number.isFinite(tv)) continue;
        ctx.strokeStyle = rgbCss(TH.grad, 0.6); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.moveTo(pl2.X(tv * 1e9), pl2.Y(-pk));
        ctx.lineTo(pl2.X(tv * 1e9), pl2.Y(pk * 0.72)); ctx.stroke(); ctx.setLineDash([]);
        ctText(ctx, pl2.X(tv * 1e9) + 3, pl2.Y(pk * 0.72) + 8, lab, rgbCss(TH.dim), '10px ' + FONT_UI);
      }
    });
    stageNote(ctx, 'the update rule holds μ₀ and ε₀ and has never heard of c — the speed is measured off this picture', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.scene === 'own'){ this.frameOwn(st, ctx, W, H); return; }
    R.mode2d = false; R.extent = 4;
    R.begin();
    const L = 4.4, N = 78;
    R.arrow(v3(-L, 0, 0), v3(2 * L + 1, 0, 0), rgbCss(TH.faint), 1.4, 0.9);
    R.label(v3(L + 1.4, 0, 0), 'travel  →  c', rgbCss(TH.dim), 0, -12, '600 11px ' + FONT_UI);
    const ptsE = [], ptsB = [];
    for(let i = 0; i <= N; i++){
      const x = -L + 2 * L * i / N;
      const w = emPlaneWave(x, st.t, st.k, 1.6);
      ptsE.push(v3(x, w.E.y, 0));
      ptsB.push(v3(x, 0, w.B.z));
      if(i % 5 === 0){
        if(Math.abs(w.E.y) > 0.02) R.line(v3(x, 0, 0), v3(x, w.E.y, 0), rgbCss(TH.warn, 0.5), 1.1, 0.7);
        if(Math.abs(w.B.z) > 0.02) R.line(v3(x, 0, 0), v3(x, 0, w.B.z), rgbCss(TH.neg, 0.5), 1.1, 0.7);
      }
    }
    R.path(ptsE, rgbCss(TH.warn), 2.6, 1);
    R.path(ptsB, rgbCss(TH.neg), 2.6, 1);
    R.label(v3(-L, 2.2, 0), 'E', rgbCss(TH.warn), 0, 0, '700 15px ' + FONT_UI);
    R.label(v3(-L, 0, 2.2), 'B', rgbCss(TH.neg), 0, 0, '700 15px ' + FONT_UI);
    const w = emPlaneWave(st.probe, st.t, st.k, 1.6);
    const S = vcross(w.E, w.B);
    R.line(v3(st.probe, -2.5, 0), v3(st.probe, 2.5, 0), rgbCss(TH.line2), 1, 0.45);
    R.arrow(v3(st.probe, 0, 0), v3(0, w.E.y, 0), rgbCss(TH.warn), 3.2);
    R.arrow(v3(st.probe, 0, 0), v3(0, 0, w.B.z), rgbCss(TH.neg), 3.2);
    if(Math.abs(S.x) > 1e-3) R.arrow(v3(st.probe, 0, 0), v3(Math.min(2.4, S.x), 0, 0), rgbCss(TH.grad), 3.2);
    R.dot(v3(st.probe, 0, 0), 4, rgbCss(TH.text), rgbCss(TH.bg));
    R.label(v3(st.probe, 0, -2.7), 'S = E×B always points along the travel direction', rgbCss(TH.grad), 0, 0, '600 11px ' + FONT_UI);
    R.flush();
  },
  readoutOwn(st){
    const r = st.ownR || this.ownCompute(st);
    return `<div class="card tight"><div class="ttl">The speed, measured — then compared</div>
      ${kv('K(t)', pkPretty(st.src) + ' A/m')}
      ${kv('front reaches probe A', fmtNum(r.ta * 1e9, 5) + ' ns')}
      ${kv('front reaches probe B', fmtNum(r.tb * 1e9, 5) + ' ns')}
      ${kv('c, measured over the 10 m', '<b>' + fmtSig(r.c, 9) + ' m/s</b>')}
      ${kv('1/√(μ₀ε₀), from the constants', fmtSig(r.c0, 9) + ' m/s')}
      ${kv('difference', fmtAgree(r.c, r.c0, 'm/s'))}
      <p class="help">The march updates E from the neighbouring H with 1/ε₀ and H from the
      neighbouring E with 1/μ₀ — <b>two separate constants, never their product</b>. That whatever
      you type crosses the 10 m between the probes in the same 33.356 ns is a property the
      equations produce, not one they were told. Maxwell did this algebraically in 1862 and
      concluded light "is an electromagnetic disturbance"; here it happens numerically, on a
      current no one prepared.</p>
    </div>
    <div class="card tight"><div class="ttl">Two more things the wave must get right</div>
      ${kv('E/H recorded at probe B', fmtNum(r.z, 6) + ' Ω')}
      ${kv('√(μ₀/ε₀), the impedance of free space', fmtNum(r.z0, 6) + ' Ω')}
      ${kv('difference', fmtAgree(r.z, r.z0, 'Ω'))}
      ${kv('waveform vs −(μ₀c/2)·K(t − x/c)', fmtGap(r.shapeRms, r.shapePeak, 'V/m'))}
      <p class="help">The dashed curve is the retarded closed form for a current sheet, sampled
      straight from your K — it shares no grid, step or sample with the march. The residual that
      remains is the grid's second-order dispersion: <b>halve the cell and it falls fourfold</b>,
      which the unit suite asserts by doing exactly that. A sharper pulse raises it — that is the
      grid running out of resolution, not Maxwell failing.</p>
    </div>`;
  },
  readout(st){
    if(st.scene === 'own') return this.readoutOwn(st);
    const w = emPlaneWave(st.probe, st.t, st.k, 1.6);
    const S = vcross(w.E, w.B);
    const u = 0.5 * (vdot(w.E, w.E) + vdot(w.B, w.B));
    return `<div class="card tight"><div class="ttl">At x = ${fmtNum(st.probe, 2)}, t = ${st.t.toFixed(2)}</div>
      ${kv('E (ŷ)', fmtNum(w.E.y, 4))}
      ${kv('B (ẑ)', fmtNum(w.B.z, 4))}
      ${kv('|E| / |B|', Math.abs(w.B.z) > 1e-6 ? fmtNum(Math.abs(w.E.y / w.B.z), 4) + ' = c' : '—')}
      ${kv('E · B  (must be 0)', fmtNum(vdot(w.E, w.B), 6))}
      ${kv('S = E×B', '(' + fmtNum(S.x, 4) + ', 0, 0) — along +x̂')}
      ${kv('energy density u', fmtNum(u, 4))}
    </div>
    <div class="card tight"><div class="ttl">Where the wave comes from</div>
      ${kv('wavelength λ = 2π/k', fmtNum(2 * Math.PI / st.k, 4))}
      ${kv('angular frequency ω = ck', fmtNum(st.k, 4))}
      ${kv('speed ω/k', '1 = c exactly')}
      <p class="help">Take the curl of Faraday's law, substitute Ampère–Maxwell with no current, and use ∇·E = 0: out drops ∇²E = μ₀ε₀ ∂²E/∂t². That is a wave equation, and its speed 1/√(μ₀ε₀) is fixed by two constants measured with capacitors and coils. Radio, microwaves, infrared, light, X-rays and gamma rays are all this one solution at different k — the visible band is a single octave of an infinite spectrum. And because the speed falls out of the field equations rather than a medium, it is the same for every observer: special relativity is what you get by taking that seriously.</p>
    </div>`;
  },
  chip(st){
    if(st.scene === 'own'){
      const r = st.ownR || this.ownCompute(st);
      return `<div class="k">your source, timed</div>
        <div style="color:var(--c-warn)">c = ${fmtSig(r.c, 7)} m/s</div>
        <div>${fmtAgreeTight(r.c, r.c0)} vs 1/√(μ₀ε₀)</div>`;
    }
    const w = emPlaneWave(st.probe, st.t, st.k, 1.6);
    return `<div class="k">EM wave · λ = ${fmtNum(2 * Math.PI / st.k, 3)}</div>
      <div style="color:var(--c-warn)">E = ${fmtNum(w.E.y, 3)}</div>
      <div style="color:var(--c-neg)">B = ${fmtNum(w.B.z, 3)}</div><div>E·B = 0 · speed = c</div>`;
  },
  legend(st){
    return (st && st.scene === 'own')
      ? [['var(--c-warn)','E from the march — snapshot, and probe B'],['var(--c-neg)','probe A (10 m nearer the sheet)'],
         ['var(--c-grad)','retarded closed form −(μ₀c/2)·K(t−x/c), and the front times'],['var(--faint)','the source sheet and the two probes']]
      : [['var(--c-warn)','E field — transverse'],['var(--c-neg)','B field — perpendicular to E'],['var(--c-grad)','S = E×B — energy flow at c']];
  }
};

