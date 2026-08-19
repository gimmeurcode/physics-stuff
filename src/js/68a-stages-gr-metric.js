/* ============================================================================
   4f · THE RELATIVITY WING — CURVED SPACETIME
   Special relativity says the laws are the same in every inertial frame.
   General relativity notices that in a gravitational field there are no global
   inertial frames at all, only local ones — a falling lift, for a little while
   — and rebuilds physics around that. Gravity stops being a force and becomes
   the shape of the arena; free fall stops being accelerated motion and becomes
   the straightest available line.

   Everything here is computed in SI from real constants, because the reason
   anyone believed any of it was a set of specific numbers: 43″ per century,
   1.75″ at the solar limb, 38 μs per day, 10⁻²¹ of strain.
   ============================================================================ */

/* the bodies the metric stages let you stand near */
const GR_BODIES = {
  earth:  { nm:'the Earth',            GM: GM_EARTH,             R: R_EARTH,  unit:'km', u:1e3 },
  sun:    { nm:'the Sun',              GM: GM_SUN,               R: R_SUN,    unit:'km', u:1e3 },
  dwarf:  { nm:'a white dwarf',        GM: GM_SUN * 1.018,       R: 5.80e6,   unit:'km', u:1e3 },
  neutron:{ nm:'a neutron star',       GM: GM_SUN * 1.4,         R: 1.2e4,    unit:'km', u:1e3 },
  hole:   { nm:'a 10 M☉ black hole',   GM: GM_SUN * 10,          R: 0,        unit:'km', u:1e3 },
  sgra:   { nm:'Sgr A*',               GM: GM_SUN * 4.297e6,     R: 0,        unit:'Gm', u:1e9 }
};

/* A 1–2–5 step covering a span in five or so intervals. The metric stages'
   r axis is set by whichever metric is loaded — 24 units for Schwarzschild and
   120 when there is a cosmological horizon to fit in — so a fixed tick list is
   either crowded or empty, and a step chosen by dividing the span gives ticks
   like 4.7333. The step is also what fmtTick needs to know how many decimals to
   print, which is the rule auditticks enforces. */
function rlTickStep(span, want){
  const raw = Math.abs(span) / Math.max(1, want || 5);
  if(!(raw > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/* ---- 16 · the metric, and what can be located in one ------------------------
   Schwarzschild's line of algebra, found in a trench on the Russian front
   within weeks of Einstein publishing the field equations, and containing every
   classical test plus the black hole nobody wanted.

   Programme A item 1. Until 2026-08-18 this stage knew in advance that it was
   looking at Schwarzschild and wrote down what followed: the horizon at 2GM/c²,
   the photon sphere at 1.5 rs, the ISCO at 3 rs, the caption "the two factors —
   and they are reciprocals". Those are the four things the presets were allowed
   to assume, so by §2.9 they are the four the reader's own metric has to test.
   Every one of them is now located from whatever A and B are in the boxes, and
   the geodesic is integrated from the Christoffel symbols of those boxes with
   E and L never imposed — so their drift is a measurement of the integration
   rather than a restatement of the conservation law. */
STAGES.rlMetric = {
  title: 'The metric',
  dockLegend: true,

  /* the accessor: a typed metric is shaped exactly like an RL_METRICS row, so
     everything downstream reads cur(st) and never asks which it has */
  curOf(st){
    if(st.key === 'custom')
      return { nm:'your own metric', sub:'two functions of r',
        A:st.srcA, B:st.srcB, exA:pkPretty(st.srcA), exB:pkPretty(st.srcB),
        rh:null, ph:null, isco:null, vac:null, rMax:120, rPlot:24, own:true,
        note:'Your own metric. Nothing about it is assumed: the horizons are the sign changes of A, the photon sphere is where A′r = 2A, the ISCO is the innermost minimum of the circular-orbit L², and the orbit below is integrated from the Christoffel symbols these two functions give.' };
    return RL_METRICS[st.key] || RL_METRICS.schwarzschild;
  },

  enter(st, o){
    st.key  = o.key || 'schwarzschild';
    st.srcA = o.srcA || '1 - 2/r + 0.3/r^2';
    st.srcB = o.srcB || '1/(1 - 2/r + 0.3/r^2)';
    st.body = o.body || 'sun';
    st.rr   = o.rr === undefined ? 6 : o.rr;     // probe radius, in GM/c²
    st.p1   = o.p1 === undefined ? 20 : o.p1;    // pericentre of the test orbit
    st.p2   = o.p2 === undefined ? 40 : o.p2;    // apocentre
    st.err  = '';
    this.recompute(st);
  },

  /* Everything expensive happens here and is cached against every input that
     can change it. A bad formula returns WITHOUT touching st.M, so the picture
     that was on the screen stays there and the panel says what went wrong. */
  recompute(st){
    const E = this.curOf(st);
    const key = [st.key, E.A, E.B, st.p1, st.p2].join('|');
    /* clearing the message on the way out matters: a reader who breaks a
       formula and then types it back gets the SAME key, so this early return
       is the path taken — and leaving st.err set left "the g_tt box is not a
       formula" standing over a panel that was working again. */
    if(st.cacheKey === key && st.M){ st.err = ''; return; }
    const A = rlFnR(E.A), B = rlFnR(E.B);
    if(!A || !B){
      st.err = (!A ? 'The g<sub>tt</sub> box' : 'The g<sub>rr</sub> box') +
               ' is not a formula in r that evaluates to a number — the previous metric is still shown.';
      return;
    }
    st.err = ''; st.cacheKey = key;
    const rMax = E.rMax || 60;
    /* the band a static observer can stand in. NOT "outside the outermost
       horizon" — for a metric with a cosmological horizon that is the one place
       nobody can stand, and every quantity below would come back NaN. */
    const band = rlStaticBand(A, 0.05, rMax);
    const H = band.horizons;
    const lo = Number.isFinite(band.lo) ? band.lo : 0.05;
    const hi = Number.isFinite(band.hi) ? band.hi : rMax;
    const inLo = lo * 1.02, inHi = Math.min(rMax, hi * 0.98);
    const M = { A, B, H, band, lo, hi, rMax,
                ph: rlPhotonR(A, 0.05, rMax).outer,
                isco: rlIscoR(A, inLo, inHi),
                ab: rlABGap(A, B, inLo, inHi) };
    /* the funnel. It starts at the horizon where there is one, because that is
       where the shape is, and the substitution inside rlEmbedZ is what makes
       starting exactly there possible at all. */
    /* The funnel's own radial extent, which is NOT the coefficient plot's. A
       metric with a cosmological horizon wants 120 units on the plot to show
       both horizons, and drawing the funnel that wide shrinks the throat — the
       only part of it with any shape — to two per cent of the picture. It
       reaches far enough to hold the orbit and no further. */
    M.rDisc = Math.min(Math.max(26, Math.max(st.p1, st.p2) * 1.1), hi * 0.995, rMax);
    M.emb = rlEmbedZ(B, Number.isFinite(band.lo) ? band.lo : Math.max(0.05, lo), M.rDisc, 240);
    M.zMax = M.emb.z[M.emb.z.length - 1] || 1;

    /* THE ORBIT. Its apsides come from the two sliders; E and L come from the
       potential; the track comes from the geodesic equation, which is told
       neither. */
    const p1 = Math.min(st.p1, st.p2), p2 = Math.max(st.p1, st.p2);
    const el = rlApsidesEL(A, p1, p2, 1);
    M.el = el; M.p1 = p1; M.p2 = p2;
    if(Number.isFinite(el.E) && Number.isFinite(el.L)){
      /* ten orbits, at about 1200 steps each — through rlOrbitPlan, which is
         the shared step rule and NOT the Newtonian radial period this stage
         used to compute here. The period alone is right for a wide orbit and
         wrong for a tight one: a relativistic orbit spends most of its angle
         whirling at pericentre, and sizing h by the radial period sampled that
         whirl a handful of times. rlOrbit found it (2026-08-18) when four
         presets' tracks dropped through a horizon while the quadrature
         reported a perfectly good precession — the same rule was here, so the
         same defect was here, whether or not a screenshot had shown it yet. */
      const plan = rlOrbitPlan(p1, p2, el.L, 10, 1200);
      M.geo = rlGeoRun(A, B, rlGeoInit(A, B, p2, el.E, el.L, 1, -1), plan.h, plan.steps,
                       { rStop: Number.isFinite(band.lo) ? band.lo * 1.001 : 0.02, rEsc: Math.min(rMax, p2 * 4) });
      M.per = rlPeriShift(M.geo);
      /* ROUTE B on the same orbit: the turning points read off the potential,
         with no integration anywhere in them */
      M.turns = rlTurnPoints(A, el.E, el.L, 1, inLo, Math.min(rMax, p2 * 2.5));
      /* WHICH pair of roots is the orbit's? Taking the outermost two is wrong,
         and auditsides caught it: Schwarzschild has exactly three roots (the
         plunge branch, then the two apsides) so the last two are right by
         accident, while Schwarzschild–de Sitter has FOUR — beyond the outer
         apsis the potential falls back under E² again and the region past the
         barrier is allowed, which is how a particle escapes to the
         cosmological horizon. The last two there are the apocentre and the
         escape point, and the panel reported a pericentre 4 units out.

         The orbit was launched from p2, which is an INPUT rather than anything
         route A computed, so identifying the root nearest it and taking the
         band immediately inside costs the check none of its independence: the
         pericentre below is still route B's own answer, reached from E and L
         through the potential with no integration in it. */
      let j = -1, best = Infinity;
      for(let i = 0; i < M.turns.length; i++){
        const d = Math.abs(M.turns[i] - p2);
        if(d < best){ best = d; j = i; }
      }
      M.outer = j >= 0 ? M.turns[j] : NaN;
      M.inner = j >= 1 ? M.turns[j - 1] : NaN;
      M.bands = M.turns.length;
    } else {
      M.geo = null; M.per = null; M.turns = [];
      /* WHY there is no orbit, which is a different sentence in each case and
         is the whole value of the flat and de Sitter presets. Saying only "no
         bound orbit" would leave the reader unable to tell a control that is
         behaving correctly from one that has broken. */
      const a1 = A(p1), a2 = A(p2);
      M.why = !(a1 > 0) || !(a2 > 0)
        ? 'one of those radii is inside a horizon, where nothing can be in a bound orbit because nothing can be at rest.'
        : Math.abs(a2 - a1) < 1e-14
        ? 'A(r) has the same value at both radii, so the angular momentum that would hold an orbit between them is zero — which describes a particle sitting still, not an orbit. Flat spacetime does this everywhere.'
        : el.why === 'barrier'
        ? 'those two radii bracket a <b>barrier</b> rather than a well. There is an energy for which both are turning points, but the effective potential rises above it in between, so the region between them is forbidden and a particle released at either one moves away from the other.'
        : a2 < a1
        ? 'A(r) DECREASES outward between those two radii, so there is no orbit with turning points at both. This metric has a maximum of A at finite r, and an orbit cannot straddle it: outside that radius the pull is outward, not inward.'
        : 'the two apsides do not admit a real angular momentum in this metric.';
    }
    st.M = M;
  },

  /* ------------------------------------------------------------- derive --- */
  derive(st){
    const E = this.curOf(st), M = st.M;
    const hz = M && M.H.count ? fmtNum(M.H.outer, 6) : 'none in range';
    return {
      title:'Gravity as the shape of spacetime, and what a shape can be asked',
      steps:[
        drvSay('what a metric is for',
          'A metric is a rule for measuring intervals between nearby events. Flat spacetime has the Minkowski one. Curved spacetime has a different rule at each point, and general relativity says gravity <i>is</i> that difference — there is no force anywhere in the theory.'),
        drvStep('the static, spherically symmetric form',
          `d${dv('s')}² ${dop('=')} ${dop('−')}${dv('A')}(${dv('r')})${dv('c')}²d${dv('t')}² ${dop('+')} ${dv('B')}(${dv('r')})d${dv('r')}² ${dop('+')} ${dv('r')}²dΩ²`,
          `the two boxes are those coefficients; ${E.nm} supplies ${E.exA} and ${E.exB}`),
        drvSay('and the horizon is not put in by hand',
          'It is wherever the first coefficient changes sign. Above it a clock can be held still; below it the labels t and r have swapped roles and nothing can. So the panel scans for sign changes rather than quoting a radius — which is why it finds two for a charged hole, two of quite different kinds when there is a cosmological constant, and none at all inside a star.'),
        drvStep('so a clock at rest ticks at',
          `${dfrac('dτ', 'd' + dv('t'))} ${dop('=')} √${dv('A')}(${dv('r')})`,
          `at the probe the panel prints the ratio; the located horizon is at r = ${hz}`),
        drvStep('and a radial ruler is stretched by',
          `${dfrac('d' + dv('ℓ'), 'd' + dv('r'))} ${dop('=')} √${dv('B')}(${dv('r')})`,
          'so measured distance between two shells exceeds the difference of their r values'),
        drvSay('which is why r is not the distance to the centre',
          'It is defined so that a ring has circumference 2πr. In a curved space that is not what a ruler laid along the radius would report, and the second number is larger. Misreading the label this way is the commonest error in the subject.'),
        drvStep('free fall takes the straightest available line',
          `${dfrac('d²' + dv('x') + '^μ', 'dτ²')} ${dop('+')} Γ^μ_αβ${dfrac('d' + dv('x') + '^α', 'dτ')}${dfrac('d' + dv('x') + '^β', 'dτ')} ${dop('=')} 0`,
          'no force term anywhere in it — the connection is built from A and B alone'),
        drvSay('and two quantities along that line are constants of the motion',
          'Because nothing in the coefficients depends on t or on the angle, the combinations A·dt/dτ and r²·dφ/dτ cannot change. The integrator below is never told this. It marches the second-order equation and the panel reads those two off the state afterwards, so how far they wander is a measurement of the arithmetic rather than a repetition of the theorem.'),
        drvSay('and the reciprocal caption is a claim, not a fact',
          'This stage used to print that the coefficients are reciprocals of one another. They are, for every vacuum solution and for a charged one — but the moment you invent a metric, or stand inside a star, the product stops being one. It is measured now, and what it measures is whether the radial pressure equals minus the energy density.'),
        drvSay('and the Newtonian limit is recoverable, as it must be',
          'Expand the time coefficient for a weak field and the geodesic equation collapses to an inverse-square law with potential −GM/r. Einstein contains Newton as a leading term, which is why centuries of successful prediction were not overturned by it.')
      ],
      note:'Every number in the panel is located from the two coefficients rather than read off a formula: the horizons are sign changes, the photon sphere is a root of A′r = 2A, the ISCO is the innermost minimum of the circular-orbit L², and the orbit is integrated from the Christoffel symbols. The one deliberate exception is the funnel, which is a quadrature of √(B−1) and can be checked against Flamm\'s closed form when B is Schwarzschild\'s.'
    };
  },

  /* ----------------------------------------------------------- controls --- */
  controls(){
    const st = ST, E = STAGES.rlMetric.curOf(st);
    const opts = Object.keys(RL_METRICS).map(k => [k, RL_METRICS[k].nm]).concat([['custom', 'type your own']]);
    return rlSeg('rlMeM', st.key, opts) +
      (st.key === 'custom'
        ? fnHtml('rlMeFA', '−g<sub>tt</sub>/c² = A(r) =', st.srcA, 'r') +
          fnHtml('rlMeFB', 'g<sub>rr</sub> = B(r) =', st.srcB, 'r')
        : `<p class="help" style="margin:6px 0 2px">${supify(E.note)}</p>`) +
      (st.err ? `<p class="help" style="color:var(--c-warn)">${st.err}</p>` : '') +
      rlSeg('rlMeB', st.body, Object.keys(GR_BODIES).map(k => [k, GR_BODIES[k].nm])) +
      ctlRow('probe r', ctlSlider('rlMeR', 0.5, 120, 0.001, st.rr)) +
      ctlRow('orbit pericentre', ctlSlider('rlMeP1', 4, 90, 0.1, st.p1)) +
      ctlRow('orbit apocentre', ctlSlider('rlMeP2', 5, 110, 0.1, st.p2)) +
      `<p class="help">Lengths are in units of <b>GM/c²</b>, so Schwarzschild reads <b>A = 1 − 2/r</b> and
      its horizon sits at <b>r = 2</b> — that is <b>rs = 2GM/c²</b>, and the body picker only sets what
      one unit is worth in kilometres. The funnel on the left is the equatorial plane <i>embedded</i>,
      so distances measured across the drawn surface are the real ones; it is the honest version of the
      rubber sheet, and note what it does not contain: any time. Almost all of everyday gravity is the
      time coefficient, which is why the sheet on its own explains nothing. The orbit drawn on it is a
      geodesic of <b>spacetime</b> projected into the plane, not a geodesic of that surface.</p>`;
  },
  wire(){
    const S = STAGES.rlMetric;
    rlWireSeg('rlMeM', v => { ST.key = v; S.recompute(ST); buildStagePanel(); });
    rlWireSeg('rlMeB', v => { ST.body = v; });
    fnWire('rlMeFA', (made, src) => { ST.srcA = src; ST.cacheKey = ''; S.recompute(ST); buildStagePanel(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    fnWire('rlMeFB', (made, src) => { ST.srcB = src; ST.cacheKey = ''; S.recompute(ST); buildStagePanel(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    wireSlider('rlMeR', () => ST.rr, v => { ST.rr = v; }, v => fmtNum(+v, 4) + ' GM/c²');
    wireSlider('rlMeP1', () => ST.p1, v => { ST.p1 = v; S.recompute(ST); }, v => fmtNum(+v, 4) + ' GM/c²');
    wireSlider('rlMeP2', () => ST.p2, v => { ST.p2 = v; S.recompute(ST); }, v => fmtNum(+v, 4) + ' GM/c²');
  },

  /* -------------------------------------------------------------- frame --- */
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const M = st.M;
    if(!M){ rlText(ctx, W / 2, H / 2, 'no metric to draw yet', rgbCss(TH.faint), '13px ' + FONT_UI, 'center'); return; }
    const E = this.curOf(st);

    /* ================= left: the embedded equatorial plane ================= */
    const cx = W * 0.245, cy = H * 0.47;
    const sc = Math.min(W * 0.20, H * 0.30) / M.rDisc;
    const zs = Math.min(W * 0.20, H * 0.30) / Math.max(1e-9, M.zMax) * 0.55;
    /* z(r) by interpolation into the quadrature, so the drawn height is the
       integral of √(B−1) and not a formula for somebody else's metric */
    const zAt = r => {
      const R = M.emb.r, Z = M.emb.z;
      if(r <= R[0]) return 0;
      if(r >= R[R.length - 1]) return Z[Z.length - 1];
      let a = 0, b = R.length - 1;
      while(b - a > 1) { const m = (a + b) >> 1; if(R[m] <= r) a = m; else b = m; }
      const f = (r - R[a]) / Math.max(1e-30, R[b] - R[a]);
      return Z[a] + f * (Z[b] - Z[a]);
    };
    /* z is a HEIGHT and the screen's y grows downward, so it is subtracted.
       Adding it — which is what this stage did until 2026-08-18 — puts the rim
       below the throat and draws the rubber sheet as a dome, which is the one
       shape it must never be. */
    const proj = (r, th) => ({ x: cx + r * Math.cos(th) * sc,
                               y: cy - r * Math.sin(th) * sc * 0.42 - zAt(r) * zs });
    const ring = (r, col, w, dash) => {
      ctx.strokeStyle = col; ctx.lineWidth = w || 1.2;
      if(dash) ctx.setLineDash(dash);
      ctx.beginPath();
      for(let k = 0; k <= 90; k++){ const p = proj(r, k / 90 * 2 * Math.PI); k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.closePath(); ctx.stroke();
      if(dash) ctx.setLineDash([]);
    };
    ctx.font = '600 11.5px ' + FONT_UI;
    const ttl = M.emb.imag > 0 ? 'the equatorial plane — partly not embeddable'
                               : 'the equatorial plane, embedded';
    rlText(ctx, ctTitleClearChip(ctx, cx, 32, ttl), 32, ttl, rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    const r0 = M.emb.r[0];
    for(let i = 1; i <= 13; i++){
      const r = r0 + (M.rDisc - r0) * Math.pow(i / 13, 1.6);
      ring(r, rgbCss(TH.curl, 0.18 + 0.36 * (1 - i / 13)));
    }
    for(let k = 0; k < 16; k++){
      const th = k / 16 * 2 * Math.PI;
      ctx.strokeStyle = rgbCss(TH.curl, 0.16); ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i = 0; i <= 60; i++){
        const r = r0 + (M.rDisc - r0) * Math.pow(i / 60, 1.6);
        const p = proj(r, th); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
    }
    /* every horizon, not "the" horizon */
    const shown = M.H.roots.filter(h => h <= M.rDisc);
    for(const h of shown) ring(h, rgbCss(TH.warn), 2.2);
    /* label the outermost horizon THAT IS DRAWN. Labelling M.H.outer put the
       caption for a cosmological horizon at r = 99 on top of a funnel that
       stops at 26, which is to say on top of the throat. */
    if(shown.length) rlText(ctx, cx, proj(shown[shown.length - 1], Math.PI / 2).y - 9,
        M.H.count > 1 ? shown.length + ' of ' + M.H.count + ' horizons' : 'horizon',
        rgbCss(TH.warn), '10px ' + FONT_MONO, 'center');
    if(Number.isFinite(M.ph) && M.ph <= M.rDisc) ring(M.ph, rgbCss(TH.neg, 0.75), 1.3);
    if(Number.isFinite(M.isco.r) && M.isco.r <= M.rDisc) ring(M.isco.r, rgbCss(TH.accent, 0.7), 1.3);
    if(st.rr <= M.rDisc) ring(st.rr, rgbCss(TH.pos), 2, [5, 4]);

    /* the orbit, projected into the plane and laid on the surface */
    if(M.geo && M.geo.n > 2){
      ctx.strokeStyle = rgbCss(TH.grad, 0.92); ctx.lineWidth = 1.6;
      ctx.beginPath();
      let on = false;
      for(let i = 0; i <= M.geo.n; i += 2){
        const r = M.geo.r[i];
        if(r > M.rDisc){ on = false; continue; }
        const p = proj(r, M.geo.ph[i]);
        on ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        on = true;
      }
      ctx.stroke();
      if(M.geo.rMax > M.rDisc)
        rlText(ctx, cx, cy + Math.min(W * 0.20, H * 0.30) * 0.42 + 26,
               'the orbit runs outside this disc', rgbCss(TH.grad), '9.5px ' + FONT_MONO, 'center');
    }

    /* ================= right top: the two coefficients ===================== */
    const px = W * 0.53, pw = W * 0.41, ph = (H - 150) / 2;
    const rP = Math.min(M.rMax, E.rPlot || 24);
    const xLo = Math.max(0.05, (M.H.count ? M.H.roots[0] : 1) * 0.55);
    const P = mkPlot(px, 48, pw, ph, xLo, rP, 0, 2.6);
    plotFrame(ctx, P, 'r  (GM/c²)', '', 'The two coefficients — reciprocals only when it is a vacuum');
    const tk = rlTickStep(rP - xLo), ticks = [];
    for(let v = Math.ceil(xLo / tk) * tk; v <= rP + 1e-9; v += tk) ticks.push(v);
    plotTicksX(ctx, P, ticks, v => fmtTick(v, tk));
    rlYTicks(ctx, P, [0, 0.5, 1, 1.5, 2, 2.5]);
    const N = 300, xs = new Float64Array(N), ya = new Float64Array(N), yb = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const r = xLo + (rP - xLo) * (i + 0.5) / N;
      const a = M.A(r), b = M.B(r);
      xs[i] = r;
      ya[i] = a > 0 ? Math.sqrt(a) : NaN;
      yb[i] = b > 0 ? Math.sqrt(b) : NaN;
    }
    rlLine(ctx, P, xs, ya, rgbCss(TH.neg), 2.4);
    rlLine(ctx, P, xs, yb, rgbCss(TH.curl), 2.4);
    rlSegment(ctx, P.px, P.Y(1), P.px + P.pw, P.Y(1), rgbCss(TH.faint, 0.5), 1, [4, 4]);
    rlText(ctx, P.px + P.pw - 6, P.Y(1) - 9, 'flat', rgbCss(TH.faint), '10px ' + FONT_UI, 'right');
    for(const h of M.H.roots) if(h > xLo && h < rP)
      rlSegment(ctx, P.X(h), P.py, P.X(h), P.py + P.ph, rgbCss(TH.warn, 0.55), 1.4);
    if(Number.isFinite(M.ph) && M.ph > xLo && M.ph < rP)
      rlSegment(ctx, P.X(M.ph), P.py, P.X(M.ph), P.py + P.ph, rgbCss(TH.neg, 0.30), 1);
    if(Number.isFinite(M.isco.r) && M.isco.r > xLo && M.isco.r < rP)
      rlSegment(ctx, P.X(M.isco.r), P.py, P.X(M.isco.r), P.py + P.ph, rgbCss(TH.accent, 0.35), 1);
    if(st.rr > xLo && st.rr < rP){
      rlSegment(ctx, P.X(st.rr), P.py, P.X(st.rr), P.py + P.ph, rgbCss(TH.pos, 0.7), 1.3, [4, 4]);
      const a = M.A(st.rr);
      if(a > 0) rlDot(ctx, P.X(st.rr), P.Y(Math.sqrt(a)), 5, rgbCss(TH.pos));
    }

    /* ================= right bottom: the orbit, and its constants ========== */
    const Q = mkPlot(px, 48 + ph + 54, pw, ph - 6, -1, 1, -1, 1);
    plotFrame(ctx, Q, '', '', 'The geodesic — E and L are read off it, never imposed');
    const qx = Q.px + Q.pw / 2, qy = Q.py + Q.ph / 2;
    if(M.geo && M.geo.n > 2){
      /* the window is set by the ORBIT. Fitting it over the horizons too made a
         cosmological horizon at r = 99 set the scale for an orbit at r = 10, so
         the track collapsed to a dot inside one enormous translucent disc —
         §4.3a's rule about fitting a window over the same list you draw from,
         and the same defect odSpring had. Landmarks outside the window are
         simply not drawn; the readout has their radii. */
      const span = M.geo.rMax * 1.12;
      const s = Math.min(Q.pw, Q.ph) / 2 / span;
      for(const h of M.H.roots){
        if(h > span) continue;
        ctx.fillStyle = rgbCss(TH.warn, 0.20);
        ctx.beginPath(); ctx.arc(qx, qy, h * s, 0, 6.2832); ctx.fill();
      }
      for(const [rv, col] of [[M.ph, TH.neg], [M.isco.r, TH.accent]]){
        if(!Number.isFinite(rv) || rv > span) continue;
        ctx.strokeStyle = rgbCss(col, 0.45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(qx, qy, rv * s, 0, 6.2832); ctx.stroke();
      }
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 1.5;
      ctx.beginPath();
      for(let i = 0; i <= M.geo.n; i++){
        const x = qx + M.geo.r[i] * Math.cos(M.geo.ph[i]) * s;
        const y = qy - M.geo.r[i] * Math.sin(M.geo.ph[i]) * s;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      rlDot(ctx, qx, qy, 3, rgbCss(TH.warn));
      const dr = M.per && Number.isFinite(M.per.precession)
        ? (Math.abs(M.per.precession) < 1e-9 ? 'the orbit closes'
           : 'each orbit advances by ' + fmtSig(M.per.precession, 3) + ' rad')
        : 'no second perihelion in range';
      rlText(ctx, qx, Q.py + Q.ph - 12, dr, rgbCss(TH.grad), '10px ' + FONT_MONO, 'center');
    } else {
      rlText(ctx, qx, qy, 'no bound orbit exists in this metric', rgbCss(TH.faint), '11.5px ' + FONT_UI, 'center');
      rlText(ctx, qx, qy + 18, 'between those two radii', rgbCss(TH.faint), '11.5px ' + FONT_UI, 'center');
    }
    stageNote(ctx, 'ds² = −A(r)c²dt² + B(r)dr² + r²dΩ²   ·   A = ' + E.exA + '   ·   B = ' + E.exB, W, H);
  },

  /* ------------------------------------------------------------ readout --- */
  readout(st){
    this.recompute(st);
    const E = this.curOf(st), M = st.M;
    if(!M) return `<div class="card tight"><div class="ttl">No metric yet</div>
      <p class="help">${st.err || 'Type two functions of r.'}</p></div>`;
    const Bd = GR_BODIES[st.body], mg = Bd.GM / C2;      // one length unit, in metres
    const len = r => r * mg > 1e6 ? fmtNum(r * mg / 1e3, 5) + ' km' : fmtNum(r * mg, 5) + ' m';
    /* the scale a residual in A is read against: how big A gets in the band the
       reader can actually stand in. |A(rh)| = 3e-17 means nothing until it is
       set beside the ~1 that A reaches out there. */
    let scaleA = 1e-12;
    for(let i = 0; i <= 8; i++){
      const v = Math.abs(M.A(M.lo + (Math.min(M.hi, M.rMax) - M.lo) * i / 8));
      if(Number.isFinite(v)) scaleA = Math.max(scaleA, v);
    }

    /* --- 1 · what was typed, and the one property the caption assumed --- */
    let out = `<div class="card tight"><div class="ttl">${E.nm}${E.sub ? ' — ' + E.sub : ''}</div>
      ${kv('A(r) = −g<sub>tt</sub>/c²', supify(E.exA))}
      ${kv('B(r) = g<sub>rr</sub>', supify(E.exB))}
      ${kv('worst A·B against 1', fmtAgree(M.ab.prod, 1))}
      ${kv('at r', Number.isFinite(M.ab.r) ? fmtNum(M.ab.r, 5) : '—')}
      <p class="help">A·B = 1 holds for every vacuum solution and for a charged one — it is the same
      statement as radial pressure equalling minus the energy density. It is <b>${M.ab.gap < 1e-9
        ? 'holding here' : 'broken here'}</b>, which is a fact about the metric and not about the arithmetic.
      ${st.err ? '<b style="color:var(--c-warn)">' + st.err + '</b>' : ''}</p>
    </div>`;

    /* --- 2 · the three radii, located --- */
    const rows = [];
    if(M.H.count === 0) rows.push(kv('horizons', M.H.touch.length && M.H.touch[0].val < 1e-9
      ? 'one degenerate horizon at r = ' + fmtNum(M.H.touch[0].r, 6) + ' — a double root, so A never changes sign'
      : 'none — A(r) never changes sign in range'));
    M.H.roots.forEach((h, i) => {
      rows.push(kv('horizon ' + (M.H.count > 1 ? (i + 1) : '') + ' — A(r) = 0',
        fmtNum(h, 9) + ' GM/c² &nbsp;=&nbsp; ' + len(h)));
      rows.push(kv('and A there is', fmtGap(Math.abs(M.A(h)), scaleA)));
    });
    if(st.key === 'schwarzschild' || st.key === 'newton')
      rows.push(kv('against the closed form 2GM/c²', fmtAgree(M.H.outer, 2)));
    rows.push(kv('photon sphere — A′r = 2A', Number.isFinite(M.ph)
      ? fmtNum(M.ph, 8) + ' GM/c²' : 'none — no circular null orbit'));
    rows.push(kv('ISCO — the innermost minimum of L²', Number.isFinite(M.isco.r)
      ? fmtNum(M.isco.r, 8) + ' GM/c²' : 'none — no stable circular orbit'));
    if(Number.isFinite(M.isco.rOut))
      rows.push(kv('and an OUTERMOST stable orbit at', fmtNum(M.isco.rOut, 8) + ' GM/c²'));
    if(E.ph !== null && E.ph !== undefined && Number.isFinite(M.ph))
      rows.push(kv('photon sphere against the table', fmtAgree(M.ph, E.ph)));
    out += `<div class="card tight"><div class="ttl">Located, not quoted</div>${rows.join('')}
      <p class="help">Nothing here is read off a formula for Schwarzschild. The horizons are the sign
      changes of A, found by bisection to the last bit; the photon sphere is a root of A′r = 2A; the
      ISCO is where the circular-orbit L² turns round. ${Number.isFinite(M.isco.rOut)
        ? 'This metric has an <b>outer</b> stability edge as well — far enough out the cosmological term wins and orbits stop being stable again.'
        : ''}</p></div>`;

    /* --- 3 · the geodesic, and the constants nobody imposed --- */
    if(M.geo){
      const g = M.geo, aE = g.driftE * Math.abs(g.E0), aL = g.driftL * Math.abs(g.L0);
      out += `<div class="card tight"><div class="ttl">The geodesic, integrated</div>
        ${kv('apsides asked for', fmtNum(M.p1, 5) + ' … ' + fmtNum(M.p2, 5) + ' GM/c²')}
        ${kv('E = A·dt/dτ, from the potential', fmtNum(g.E0, 9))}
        ${kv('L = r²·dφ/dτ', fmtNum(g.L0, 9))}
        ${kv('radial periods completed', M.per ? String(M.per.orbits) : '0')}
        ${kv('E drift over them', fmtGap(aE, Math.abs(g.E0)))}
        ${kv('L drift', fmtGap(aL, Math.abs(g.L0)))}
        ${kv('and the norm, also never imposed', fmtGap(g.driftNorm * Math.abs(g.norm0), Math.abs(g.norm0)))}
        ${Number.isFinite(M.inner) ? kv('pericentre the potential predicts', fmtAgree(M.inner, M.p1)) : ''}
        ${Number.isFinite(M.outer) ? kv('apocentre the potential predicts', fmtAgree(M.outer, M.p2)) : ''}
        ${kv('and the track itself turned at', fmtNum(g.rMin, 7) + ' … ' + fmtNum(g.rMax, 7))}
        ${M.per && Number.isFinite(M.per.precession)
          ? kv('perihelion advance per orbit', fmtSig(M.per.precession, 6) + ' rad') : ''}
        ${g.stop ? kv('the run stopped early', g.stop) : ''}
        <p class="help">The integrator marches the second-order geodesic equation and is told nothing
        about E, L or the normalisation. Those three are read off the state afterwards, so the drift is
        an error measurement. It is <b>truncation</b>, not round-off: halve the step and it falls
        sixteen-fold, which is RK4's order. The last two rows are the same orbit by a route with no
        integration in it — the turning points are roots of A(r)(1 + L²/r²) = E².</p></div>`;
    } else {
      out += `<div class="card tight"><div class="ttl">The geodesic — there is not one</div>
        ${kv('apsides asked for', fmtNum(M.p1, 5) + ' … ' + fmtNum(M.p2, 5) + ' GM/c²')}
        ${kv('A there', fmtNum(M.A(M.p1), 8) + ' … ' + fmtNum(M.A(M.p2), 8))}
        <p class="help">No bound orbit exists between those two radii, and that is a result rather than
        a failure: ${M.why} Move the apsides and the panel will find one wherever there is one.</p></div>`;
    }

    /* --- 4 · at the probe, in real units --- */
    const a = M.A(st.rr), b = M.B(st.rr);
    const inside = !(a > 0);
    out += `<div class="card tight"><div class="ttl">At your probe, r = ${fmtNum(st.rr, 4)} GM/c²</div>
      ${kv('one length unit GM/c² is', len(1) + ' for ' + Bd.nm)}
      ${kv('r', len(st.rr))}
      ${kv('dτ/dt = √A', inside ? 'not defined there — no static observer exists inside a horizon' : fmtNum(Math.sqrt(a), 10))}
      ${inside ? '' : kv('a clock here loses, per day', fmtNum((1 - Math.sqrt(a)) * 86400, 5) + ' s')}
      ${inside ? '' : kv('redshift z climbing to infinity', fmtNum(1 / Math.max(1e-12, Math.sqrt(a)) - 1, 6))}
      ${kv('radial stretch √B', b > 0 ? fmtNum(Math.sqrt(b), 8) : 'not defined there')}
      ${kv('proper depth from the disc edge down to here', Number.isFinite(zAtDepth(M, st.rr)) ? len(zAtDepth(M, st.rr)) : '—')}
    </div>`;

    /* --- 5 · GPS, which only means anything for the real thing --- */
    if(st.key === 'schwarzschild'){
      const gps = grGPSRates();
      out += `<div class="card tight"><div class="ttl">And it is not academic — GPS</div>
        ${kv('orbit radius', fmtNum(gps.r / 1000, 6) + ' km')}
        ${kv('gravity runs the satellite clock fast by', '+' + fmtNum(gps.gravUsPerDay, 4) + ' μs/day')}
        ${kv('motion runs it slow by', fmtNum(gps.kinUsPerDay, 4) + ' μs/day')}
        ${kv('net', '+' + fmtNum(gps.netUsPerDay, 4) + ' μs/day')}
        ${kv('as a positioning error', fmtNum(gps.metresPerDay / 1000, 4) + ' km/day')}
        <p class="help">Two effects of opposite sign that do not cancel, computed from this metric and
        the orbit rather than looked up. Left uncorrected the system is useless within an hour. The
        satellites' oscillators are offset before launch to 10.22999999543 MHz so that they tick at
        10.23 MHz once up there.</p></div>`;
    }
    return out;
  },

  chip(st){
    this.recompute(st);
    const E = this.curOf(st), M = st.M;
    if(!M) return `<div class="k">no metric</div>`;
    const a = M.A(st.rr);
    return `<div class="k">${E.nm}</div>
      <div style="color:var(--c-warn)">${M.H.count
        ? (M.H.count > 1 ? M.H.count + ' horizons, outer ' : 'horizon ') + fmtNum(M.H.outer, 5)
        : 'no horizon'}</div>
      <div style="color:var(--c-neg)">dτ/dt = ${a > 0 ? fmtNum(Math.sqrt(a), 7) : '—'}</div>
      ${M.geo ? `<div style="color:var(--c-grad)">E, L drift ${fmtSig(Math.max(M.geo.driftE, M.geo.driftL), 2)}</div>` : ''}`;
  },

  legend(st){
    const M = st && st.M;
    return [['var(--c-curl)', 'the embedded plane, and the radial stretch √B'],
            ['var(--c-neg)', 'the clock rate √A, and the photon sphere'],
            ['var(--c-warn)', M && M.H.count > 1 ? 'the horizons, where A changes sign' : 'the horizon, where A changes sign'],
            ['var(--accent)', 'the ISCO — the innermost stable circular orbit'],
            ['var(--c-grad)', 'the integrated geodesic'],
            ['var(--c-pos)', 'your probe radius']];
  }
};
/* proper radial depth from the outer edge of the drawn disc down to r, by the
   same quadrature the funnel is drawn from — ∫√B dr, which is what a ruler
   measures and what r is not. Returns NaN where the metric squeezes. */
function zAtDepth(M, r){
  const lo = Math.max(M.emb.r[0], Math.min(r, M.rDisc)), hi = M.rDisc;
  if(!(hi > lo)) return 0;
  const n = 200, h = (hi - lo) / n;
  let s = 0;
  for(let i = 0; i < n; i++){
    const g = x => { const b = M.B(x); return b > 0 ? Math.sqrt(b) : NaN; };
    const x0 = lo + i * h;
    const v = g(x0) + 4 * g(x0 + h / 2) + g(x0 + h);
    if(!Number.isFinite(v)) return NaN;
    s += h / 6 * v;
  }
  return s;
}
