/* ============================================================================
   4f' · THE RELATIVITY WING — ORBITS IN A CURVED SPACETIME
   Split out of 68a on 2026-08-18 when the metric stage became a scenario editor
   and the two together went past the size this repo keeps its files to.
   GR_BODIES lives in 68a, which loads first.
   ============================================================================ */

/* ---- 17 · orbits and the perihelion of Mercury -----------------------------
   Newton's orbits close. Einstein's do not, because the effective potential
   gains one extra term — and that term, evaluated for Mercury, is the 43
   arcseconds per century that had been sitting unexplained since 1859.

   Programme A item 2, rebuilt 2026-08-18. Until then this stage knew it was
   looking at Schwarzschild and integrated the Schwarzschild u-equation, whose
   relativistic term is WRITTEN INTO IT as 3GMu²/c². Everything the panel said
   about precession was therefore a property of that one line of code. §2.9's
   rule is that what a preset may assume is exactly what the reader's own
   scenario has to test, so the orbit is now a geodesic of whatever A and B are
   in the boxes, and the precession is measured from it by two routes that share
   nothing:

     ROUTE A  rlGeoRun marches the second-order geodesic equation with the
              Christoffel symbols of those two functions, and rlPeriShift finds
              successive pericentres in the track it produces.
     ROUTE B  rlApsidalQuad integrates dφ/dr = (L/r²)√(AB/(E²−V²)) between the
              apsides. No geodesic equation, no time, no Christoffel symbols —
              and its endpoint singularities are removed by a substitution
              rather than stepped over.

   They agree to between 4×10⁻¹¹ and 3×10⁻⁹ relative across every preset. The
   first-order formula 6πGM/c²a(1−e²) is then a THIRD number and deliberately
   not a check: it is an expansion in GM/c²r, right to 0.67% at the widest orbit
   the sliders reach and wrong by 21% at r₁ = 20, and the panel says which
   regime it is in rather than reporting the gap as a failure.

   And the control that keeps all of it honest is rlKeplerApsidal, which runs
   the identical quadrature on the Newtonian orbit — whose apsidal angle is
   exactly π — and returns π to 3×10⁻¹². A machine that manufactures a
   precession would fail there first. */
STAGES.rlOrbit = {
  title: 'Precessing orbits',
  dockLegend: true,

  /* the accessor, the same shape rlMetric uses: a typed metric is shaped like
     an RL_METRICS row so nothing downstream asks which it has */
  curOf(st){
    if(st.key === 'custom')
      return { nm:'your own metric', sub:'two functions of r',
        A:st.srcA, B:st.srcB, exA:pkPretty(st.srcA), exB:pkPretty(st.srcB),
        rh:null, ph:null, isco:null, vac:null, rMax:120, rPlot:24, orb:[20, 0.35], own:true,
        note:'Your own metric. The orbit below is a geodesic of these two functions, and the angle between successive pericentres is measured from it — nothing about the precession is written down in advance.' };
    return RL_METRICS[st.key] || RL_METRICS.schwarzschild;
  },

  enter(st, o){
    st.key  = o.key || 'schwarzschild';
    st.srcA = o.srcA || '1 - 2/r + 0.3/r^2';
    st.srcB = o.srcB || '1/(1 - 2/r + 0.3/r^2)';
    /* pericentre and eccentricity rather than the two apsides, because that is
       how an orbit is described everywhere else in the subject — and because
       the semi-latus rectum the first-order formula wants is then just
       r₁(1+e), with no chance of the two boxes being handed over in the wrong
       order. */
    st.rp   = o.rp === undefined ? 20 : o.rp;
    st.ecc  = o.ecc === undefined ? 0.35 : o.ecc;
    st.orbits = o.orbits === undefined ? 5 : o.orbits;
    st.err  = '';
    this.recompute(st);
  },

  /* the apsides implied by the two sliders. p = a(1−e²) = r₁(1+e) identically,
     which is the one line that makes the weak-field formula comparable. */
  apsides(st){
    const r1 = st.rp, r2 = st.rp * (1 + st.ecc) / Math.max(1e-9, 1 - st.ecc);
    return { r1, r2, p: st.rp * (1 + st.ecc) };
  },

  /* Everything expensive happens here, cached against every input that can
     change it. A bad formula returns WITHOUT touching st.O, so the picture that
     was on the screen stays there and the panel says what went wrong. */
  recompute(st){
    const E = this.curOf(st);
    const key = [st.key, E.A, E.B, st.rp, st.ecc, st.orbits].join('|');
    if(st.cacheKey === key && st.O){ st.err = ''; return; }
    const A = rlFnR(E.A), B = rlFnR(E.B);
    if(!A || !B){
      st.err = (!A ? 'The g<sub>tt</sub> box' : 'The g<sub>rr</sub> box') +
               ' is not a formula in r that evaluates to a number — the previous metric is still shown.';
      return;
    }
    st.err = ''; st.cacheKey = key;
    const { r1, r2, p } = this.apsides(st);
    /* the static band must reach past the APOCENTRE, not merely to the metric's
       own plotting range: at r₁ = 600 and e = 0.7 the orbit runs out to 3400
       and Schwarzschild's rMax of 60 would have declared the whole thing
       outside the chart. Same defect as fitting a window to some of the curves
       you draw (§4.3a). */
    const rMax = Math.max(E.rMax || 60, r2 * 1.35);
    const band = rlStaticBand(A, 0.05, rMax);
    const rStop = Number.isFinite(band.lo) ? band.lo * 1.001 : 0.02;
    const O = { A, B, band, rStop, r1, r2, p, rMax,
                weak: rlPrecessWeak(r1, r2),
                kepler: rlKeplerApsidal(r1, r2) };

    /* E and L from the potential — and the verdict on whether these apsides
       describe an orbit at all, which is four different sentences */
    const el = rlApsidesEL(A, r1, r2, 1);
    O.el = el;
    if(Number.isFinite(el.E) && Number.isFinite(el.L)){
      /* ROUTE B first, because it is cheap and it is what the picture's window
         is fitted to */
      O.quadHalf = rlApsidalQuad(A, B, r1, r2, el.E, el.L, 1, 64);
      O.apsidalB = 2 * O.quadHalf;
      O.precB    = O.apsidalB - 2 * Math.PI;
      /* ROUTE A: the geodesic equation, told E and L only as an initial
         condition and never as a conservation law */
      O.plan = rlOrbitPlan(r1, r2, el.L, st.orbits, 1400);
      O.geo  = rlGeoRun(A, B, rlGeoInit(A, B, r2, el.E, el.L, 1, -1),
                        O.plan.h, O.plan.steps, { rStop, rEsc: r2 * 1.25 });
      O.per  = rlPeriShift(O.geo);
      O.apsidalA = O.per.apsidal;
      O.precA    = O.per.precession;
      /* the potential's own turning points, from E and L, with no integration
         in them — a third opinion on where the apsides are */
      O.turns = rlTurnPoints(A, el.E, el.L, 1, rStop, Math.min(rMax, r2 * 1.6));
    } else {
      O.geo = null; O.per = null; O.precA = NaN; O.precB = NaN; O.turns = [];
      const a1 = A(r1), a2 = A(r2);
      O.why = !(a1 > 0) || !(a2 > 0)
        ? 'one of those radii is inside a horizon, where nothing can be in a bound orbit because nothing can be at rest.'
        : el.why === 'escape'
        ? 'the effective potential does not rise again outside the apocentre — that radius is the <b>top of the outer barrier</b>, not a turning point. A particle placed there takes infinite proper time to arrive and the least nudge carries it over and away. Bring the apocentre in.'
        : el.why === 'plunge'
        ? 'the effective potential falls away <b>inside</b> the pericentre, so there is no centrifugal wall to turn the orbit and it plunges. The pericentre is inside the unstable circular orbit for this angular momentum — which is the physics that gives the ISCO its name. Move the pericentre out, or raise the eccentricity.'
        : el.why === 'barrier'
        ? 'those two radii bracket a <b>barrier</b> rather than a well: there is an energy for which both are turning points, but the potential rises above it in between, so the region between them is forbidden.'
        : Math.abs(a2 - a1) < 1e-14
        ? 'A(r) has the same value at both radii, so the angular momentum that would hold an orbit between them is zero — which describes a particle sitting still, not an orbit. Flat spacetime does this everywhere, which is why Minkowski has no orbits to precess.'
        : a2 < a1
        ? 'A(r) <b>decreases</b> outward between those two radii, so no orbit can straddle them: this metric has a maximum of A at finite r and outside it the pull is outward. Schwarzschild–de Sitter turns over near r = 21.5, so its orbits all live inside that.'
        : 'those two apsides do not admit a real angular momentum in this metric.';
    }

    /* Mercury, by the Schwarzschild u-equation in SI — and it is a separate
       calculation on purpose. Mercury's semi-latus rectum is 3.8×10⁷ GM/c²,
       and at that radius E² − V² is a difference of order 10⁻⁹ between two
       numbers of order 1: the general machinery above would be asking float64
       for figures it does not have, and rlDeriv's own noise floor on A′ would
       swamp a precession of 5×10⁻⁷ radians. The u-equation has the
       relativistic term as an ADDITION rather than a cancellation, so it can
       reach the weak field the general route cannot. Saying that plainly is
       better than quietly printing a number that means nothing. */
    const mA = 5.790905e10, mE = 0.205630, mP = 87.9691;
    const mL = grLFromTurning(GM_SUN, mA * (1 - mE), mA * (1 + mE));
    const mRes = grOrbitIntegrate(GM_SUN, mL, 1 / (mA * (1 + mE)), 0, 2 * Math.PI / 4000, 9000, true);
    O.merc = { a:mA, e:mE, P:mP, L:mL,
               measured: grPeriapsisAngle(mRes) - 2 * Math.PI,
               formula: grPrecessionPerOrbit(GM_SUN, mA, mE),
               pGeo: mA * (1 - mE * mE) / (GM_SUN / C2) };
    st.O = O;
  },

  /* ------------------------------------------------------------- derive --- */
  derive(st){
    const O = st.O, E = this.curOf(st);
    const meas = O && Number.isFinite(O.precA) ? fmtSig(O.precA, 6) : 'no closed orbit here';
    return {
      title:'The 43 arcseconds that confirmed the theory',
      steps:[
        drvSay('the anomaly that was waiting',
          'Mercury\'s perihelion advances by about 574 arcseconds per century. Newtonian perturbations from the other planets account for 531 of them. The remaining 43 resisted every explanation for sixty years, including a hypothetical planet Vulcan that was searched for and never found.'),
        drvStep('the Newtonian effective potential',
          `${dv('V')} ${dop('=')} ${dop('−')}${dfrac(dv('GM'), dv('r'))} ${dop('+')} ${dfrac(dv('L') + '²', '2' + dv('r') + '²')}`,
          'gravity plus the centrifugal barrier — this gives a closed ellipse exactly'),
        drvSay('closure is a peculiarity of the inverse square, not a general rule',
          'Only the inverse-square and harmonic force laws produce orbits that close after one revolution. Any other power gives a rosette. So the closure of Newtonian orbits is a delicate coincidence, and the smallest correction destroys it. The panel checks that it has not invented the effect by running its own quadrature on the Newtonian problem, where the answer must be exactly π.'),
        drvStep('in a general metric there is no extra term to add',
          `${dv('V')}²(${dv('r')}) ${dop('=')} ${dv('A')}(${dv('r')})(1 ${dop('+')} ${dv('L')}²/${dv('r')}²)`,
          `the whole potential comes from the boxes; ${E.nm} supplies A = ${E.exA}`),
        drvStep('and the angle between pericentres is an integral',
          `Δφ ${dop('=')} 2∫${dfrac(dv('L') + '/' + dv('r') + '²', '√((' + dv('E') + '² ' + dop('−') + ' ' + dv('V') + '²)/' + dv('AB') + ')')}d${dv('r')} ${dop('−')} 2π`,
          `measured here as ${meas} radians per orbit, and again by integrating the geodesic itself`),
        drvStep('the weak field collapses it to one line',
          `Δφ ${dop('≈')} ${dfrac('6π' + dv('GM'), dv('c') + '²' + dv('a') + '(1 − ' + dv('e') + '²)')}`,
          `for Mercury that is 43 arcseconds per century — the panel computes it from the constants`),
        drvSay('and it was a genuine prediction of an already-known number',
          'Einstein did not fit anything. The 43 arcseconds fell out of a theory built for entirely different reasons, and he later wrote that the discovery gave him palpitations. It is one of the cleanest confirmations in the history of physics.'),
        drvSay('delete the space curvature and you lose exactly a third',
          'The second preset keeps the time coefficient and leaves space flat — the metric Newton would have written. Its orbits still precess, but by two-thirds of the real amount, and the panel measures that ratio rather than asserting it. It is the same missing half that makes this metric bend light by half the observed angle: whatever the reader has heard about gravity being curved time, the curvature of space is doing a measurable share of the work.'),
        drvSay('and the same effect is now seen in far stronger fields',
          'The star S2 orbiting the Milky Way\'s central black hole precesses by about 12 arcminutes per orbit — measured in 2020 and matching general relativity. Binary pulsars show it thousands of times larger still. Bring the pericentre in here and the rosette stops being a correction and becomes the shape of the orbit.')
      ],
      note:'The precession is measured twice from the reader\'s own metric — once by locating pericentres along an integrated geodesic, once by a quadrature that never integrates one — and the first-order formula is shown beside them as a third number rather than as a check. Mercury itself is computed separately, by the Schwarzschild u-equation, because its semi-latus rectum of 4×10⁷ GM/c² is past the point where the general route has the precision to say anything.'
    };
  },

  /* ----------------------------------------------------------- controls --- */
  controls(){
    const st = ST, E = STAGES.rlOrbit.curOf(st);
    const opts = Object.keys(RL_METRICS).map(k => [k, RL_METRICS[k].nm]).concat([['custom', 'type your own']]);
    return rlSeg('rlObM', st.key, opts) +
      (st.key === 'custom'
        ? fnHtml('rlObFA', '−g<sub>tt</sub>/c² = A(r) =', st.srcA, 'r') +
          fnHtml('rlObFB', 'g<sub>rr</sub> = B(r) =', st.srcB, 'r')
        : `<p class="help" style="margin:6px 0 2px">${supify(E.note)}</p>`) +
      (st.err ? `<p class="help" style="color:var(--c-warn)">${st.err}</p>` : '') +
      ctlRow('pericentre r₁', ctlSlider('rlObP', 3, 600, 0.1, st.rp)) +
      ctlRow('eccentricity e', ctlSlider('rlObE', 0, 0.8, 0.005, st.ecc)) +
      ctlRow('orbits drawn', ctlSlider('rlObN', 1, 8, 1, st.orbits)) +
      `<p class="help">Lengths are in units of <b>GM/c²</b>, so Schwarzschild reads <b>A = 1 − 2/r</b> with
      its horizon at <b>r = 2</b>. The apocentre is <b>r₁(1+e)/(1−e)</b> and the semi-latus rectum the
      textbook formula wants is just <b>r₁(1+e)</b>. Push the pericentre out past about 400 and the
      measured precession comes within a per cent of <b>6πGM/c²a(1−e²)</b>; bring it in to 8 and the
      formula is wrong by 60%, because it is the first term of an expansion in <b>GM/c²r</b> and nothing
      more. Not every pair of numbers is an orbit — the panel says which of the four ways it failed.</p>`;
  },
  wire(){
    const S = STAGES.rlOrbit;
    rlWireSeg('rlObM', v => {
      ST.key = v;
      /* open each metric on an orbit it actually HAS. Schwarzschild–de Sitter's
         A(r) turns over near 21.5 and no orbit may straddle that, so carrying
         r₁ = 20 across from Schwarzschild lands every reader in the "no orbit"
         message on arrival. The claim that the orbit exists is checked by
         ./auditclaims.ps1 rather than trusted. */
      const o = (RL_METRICS[v] || {}).orb;
      if(o){ ST.rp = o[0]; ST.ecc = o[1]; }
      S.recompute(ST); buildStagePanel();
    });
    fnWire('rlObFA', (made, src) => { ST.srcA = src; ST.cacheKey = ''; S.recompute(ST); buildStagePanel(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    fnWire('rlObFB', (made, src) => { ST.srcB = src; ST.cacheKey = ''; S.recompute(ST); buildStagePanel(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    wireSlider('rlObP', () => ST.rp, v => { ST.rp = v; S.recompute(ST); }, v => fmtNum(+v, 4) + ' GM/c²');
    wireSlider('rlObE', () => ST.ecc, v => { ST.ecc = v; S.recompute(ST); }, v => fmtNum(+v, 3));
    wireSlider('rlObN', () => ST.orbits, v => { ST.orbits = Math.round(v); S.recompute(ST); },
               v => Math.round(v) + (Math.round(v) === 1 ? ' orbit' : ' orbits'));
  },

  /* -------------------------------------------------------------- frame --- */
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const O = st.O, E = this.curOf(st);
    if(!O){ rlText(ctx, W / 2, H / 2, 'no metric to draw yet', rgbCss(TH.faint), '13px ' + FONT_UI, 'center'); return; }

    /* ================= left: the rosette ================================== */
    const cx = W * 0.25, cy = H * 0.47;
    if(O.geo && O.geo.n > 2){
      const span = Math.max(O.geo.rMax, O.r2) * 1.10;
      const s = Math.min(W * 0.21, H * 0.36) / span;
      /* the horizon, and the landmarks that fall inside the picture */
      for(const h of (O.band.horizons ? O.band.horizons.roots || [] : [])){
        if(!(h > 0) || h > span) continue;
        ctx.fillStyle = rgbCss(TH.warn, 0.22);
        ctx.beginPath(); ctx.arc(cx, cy, h * s, 0, 6.2832); ctx.fill();
      }
      if(Number.isFinite(O.band.lo) && O.band.lo <= span){
        ctx.fillStyle = rgbCss(TH.warn, 0.30);
        ctx.beginPath(); ctx.arc(cx, cy, O.band.lo * s, 0, 6.2832); ctx.fill();
      } else rlDot(ctx, cx, cy, 4, rgbCss(TH.warn));
      /* the two apsidal circles the potential predicts */
      for(const [rv, col] of [[O.r1, TH.pos], [O.r2, TH.pos]]){
        if(rv > span) continue;
        ctx.strokeStyle = rgbCss(col, 0.30); ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.arc(cx, cy, rv * s, 0, 6.2832); ctx.stroke();
        ctx.setLineDash([]);
      }
      /* the track, in one batched path — but STRIDED to a bounded number of
         points. The integrator's step is set by the accuracy the precession
         needs, not by the picture: a wide orbit runs to 137 000 samples, and
         issuing that many lineTo calls every frame is five times the heaviest
         path in the site for a curve that is 500 px across. 4 000 points over
         the whole track is about 800 per orbit, which is finer than the
         rendering, and the stride is never allowed below 1. */
      const stride = Math.max(1, Math.ceil(O.geo.n / 4000));
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 1.6;
      ctx.beginPath();
      for(let i = 0; i <= O.geo.n; i += stride){
        const x = cx + O.geo.r[i] * Math.cos(O.geo.ph[i]) * s;
        const y = cy - O.geo.r[i] * Math.sin(O.geo.ph[i]) * s;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      /* Every pericentre direction rlPeriShift found — the apsidal line, and it
         is drawn ACROSS THE ORBIT rather than out to r₁. At the weak-field
         preset the pericentre is 400 and the apocentre 2267, so a segment of
         length r₁ is a stub near the middle of the picture and the one thing
         the panel is about — the apsidal line turning — is invisible. The
         rosette itself cannot show it there either: five ellipses advancing by
         1° each overlap into a band, which is honest and uninformative. */
      if(O.per) for(const ph of O.per.at)
        rlSegment(ctx, cx - O.r2 * s * Math.cos(ph) * 0.42, cy + O.r2 * s * Math.sin(ph) * 0.42,
                  cx + O.r2 * s * Math.cos(ph), cy - O.r2 * s * Math.sin(ph),
                  rgbCss(TH.pos, 0.75), 1.3);
      /* the orbiting body */
      const idx = Math.min(O.geo.n, Math.floor((st.t * 0.12 % 1) * O.geo.n));
      rlDot(ctx, cx + O.geo.r[idx] * Math.cos(O.geo.ph[idx]) * s,
                 cy - O.geo.r[idx] * Math.sin(O.geo.ph[idx]) * s, 5, rgbCss(TH.curl));
      rlText(ctx, cx, H - 74, Number.isFinite(O.precA)
        ? 'each orbit advances by ' + fmtSig(O.precA, 4) + ' rad = ' + fmtSig(O.precA * 180 / Math.PI, 4) + '°'
        : 'no second pericentre in the integrated track', rgbCss(TH.grad), '10.5px ' + FONT_MONO, 'center');
    } else {
      /* Canvas text is drawn literally, so O.why — which carries <b> tags for
         the readout — must never reach it. These are the same four verdicts in
         plain Unicode, short enough for one line. */
      const short = { escape:'the apocentre is the top of the outer barrier — it escapes',
                      plunge:'nothing holds up the pericentre — it plunges in',
                      barrier:'those radii bracket a barrier, not a well' };
      rlText(ctx, cx, cy - 10, 'no bound orbit with these apsides', rgbCss(TH.warn),
             '600 12.5px ' + FONT_UI, 'center');
      rlText(ctx, cx, cy + 14,
             (O.el && short[O.el.why]) || 'no angular momentum makes both radii turning points',
             rgbCss(TH.dim), '11px ' + FONT_UI, 'center');
    }

    /* ================= right top: the effective potential ================== */
    const px = W * 0.53, pw = W * 0.41, ph = (H - 150) / 2;
    const rLo = Math.max(O.rStop, O.r1 * 0.55), rHi = O.r2 * 1.45;
    const NV = 320, rv = new Float64Array(NV), vv = new Float64Array(NV);
    const Lp = O.el && Number.isFinite(O.el.L) ? O.el.L
             : Math.sqrt(Math.max(1e-9, rlSemiLatus(O.r1, O.r2)));
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i < NV; i++){
      const r = rLo + (rHi - rLo) * (i + 0.5) / NV;
      const v = rlVsq(O.A, r, Lp, 1);
      rv[i] = r; vv[i] = Number.isFinite(v) ? v : NaN;
      if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    if(!Number.isFinite(lo)){ lo = 0; hi = 1; }
    /* E² only exists when the apsides do. Drawing the midpoint of the window
       and labelling it E² invents a number and puts the panel's own name on
       it — the Minkowski preset showed a dashed "E²" across a potential that
       admits no orbit at all. */
    const Esq = O.el && Number.isFinite(O.el.Esq) ? O.el.Esq : NaN;
    if(Number.isFinite(Esq)){ lo = Math.min(lo, Esq); hi = Math.max(hi, Esq); }
    const pad = Math.max(1e-9, (hi - lo) * 0.20);
    const P = mkPlot(px, 48, pw, ph, rLo, rHi, lo - pad, hi + pad);
    plotFrame(ctx, P, 'r  (GM/c²)', 'V²(r) = A(r)(1 + L²/r²)',
      'The potential the metric gives — the apsides are where E² meets it');
    const tk = rlTickStep(rHi - rLo), tx = [];
    for(let v = Math.ceil(rLo / tk) * tk; v <= rHi + 1e-9; v += tk) tx.push(v);
    plotTicksX(ctx, P, tx, v => fmtTick(v, tk));
    /* fmtTick, not fmtSig — a tick's precision comes from the step. But fmtTick
       derives its decimals from the step it is HANDED, so it must be handed a
       ROUNDED one: passing the raw (hi−lo)/2, which on a weak-field orbit is
       0.001487…, made it print `1.004508956691` and three of those overflowed
       the axis. Round the step first, the way both axis owners already do, and
       place the ticks on multiples of it. */
    const vk = rlTickStep(hi - lo, 3), vt = [];
    for(let v = Math.ceil((lo - pad) / vk) * vk; v <= hi + pad + 1e-15; v += vk) vt.push(v);
    rlYTicks(ctx, P, vt, v => fmtTick(v, vk));
    rlLine(ctx, P, rv, vv, rgbCss(TH.grad), 2.4);
    if(Number.isFinite(Esq)){
      rlSegment(ctx, P.px, P.Y(Esq), P.px + P.pw, P.Y(Esq), rgbCss(TH.pos, 0.85), 1.5, [5, 4]);
      rlText(ctx, P.px + 6, P.Y(Esq) - 9, 'E²', rgbCss(TH.pos), '10px ' + FONT_MONO);
    } else {
      rlText(ctx, P.px + P.pw / 2, P.py + P.ph - 14,
             'no energy makes both radii turning points — nothing to draw',
             rgbCss(TH.dim), '10.5px ' + FONT_UI, 'center');
    }
    /* where the potential says it turns — route B's own answer, drawn on top */
    for(const t of (O.turns || [])) if(t >= rLo && t <= rHi)
      rlSegment(ctx, P.X(t), P.py, P.X(t), P.py + P.ph, rgbCss(TH.accent, 0.45), 1.2, [3, 3]);

    /* ================= right bottom: the advance, orbit by orbit =========== */
    const nOrb = Math.max(2, O.per && O.per.orbits ? O.per.orbits : 2);
    /* FIT THE WINDOW OVER THE SAME LIST THIS PANEL DRAWS FROM, and make it
       literally the same list. Fitting it to precB alone put the first-order
       line — which is 1.49× precB on the "only time curved" preset, because
       that metric precesses by two-thirds of Schwarzschild — clean out of the
       top of the frame, taking the whole point of the comparison with it. Same
       defect as odSpring fitting a resonance window to one of three curves;
       found by looking at the picture, because auditframe reads the plot
       helpers and these two lines are raw lineTo. */
    const ends = [0];
    if(Number.isFinite(O.precB)) ends.push(O.precB * nOrb);
    if(Number.isFinite(O.weak))  ends.push(O.weak * nOrb);
    if(O.per) for(let i = 1; i < O.per.at.length; i++)
      ends.push(O.per.at[i] - O.per.at[0] - 2 * Math.PI * i);
    let yLo = Math.min.apply(null, ends), yTop = Math.max.apply(null, ends);
    if(!(yTop - yLo > 0)){ yLo = 0; yTop = 1e-9; }
    const yPad = (yTop - yLo) * 0.12;
    yTop += yPad; yLo = Math.min(0, yLo - yPad);
    const Q = mkPlot(px, 48 + ph + 54, pw, ph - 6, 0, nOrb, yLo, yTop);
    plotFrame(ctx, Q, 'orbit number', 'accumulated advance  (rad)',
      'Measured off the track, and again by quadrature');
    plotTicksX(ctx, Q, [0, nOrb / 2, nOrb], v => fmtTick(v, nOrb / 2));
    const qk = rlTickStep(yTop - yLo, 3), qt = [];
    for(let v = Math.ceil(yLo / qk) * qk; v <= yTop + 1e-15; v += qk) qt.push(v);
    rlYTicks(ctx, Q, qt, v => fmtTick(v, qk));
    /* route B as a straight line — a constant advance per orbit is its claim */
    if(Number.isFinite(O.precB)){
      ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(Q.X(0), Q.Y(0));
      ctx.lineTo(Q.X(nOrb), Q.Y(O.precB * nOrb)); ctx.stroke();
    }
    /* the first-order formula, dashed — a different line whenever the field is
       not weak, which is the point of drawing it rather than quoting it */
    if(Number.isFinite(O.weak)){
      ctx.strokeStyle = rgbCss(TH.faint, 0.95); ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(Q.X(0), Q.Y(0));
      ctx.lineTo(Q.X(nOrb), Q.Y(O.weak * nOrb)); ctx.stroke();
      ctx.setLineDash([]);
    }
    /* route A as the pericentres it actually found */
    if(O.per) for(let i = 1; i < O.per.at.length; i++)
      rlDot(ctx, Q.X(i), Q.Y(O.per.at[i] - O.per.at[0] - 2 * Math.PI * i), 4, rgbCss(TH.pos));
    if(!Number.isFinite(O.precB))
      rlText(ctx, Q.px + Q.pw / 2, Q.py + Q.ph / 2, 'no orbit, so no advance to accumulate',
             rgbCss(TH.dim), '11px ' + FONT_UI, 'center');

    stageNote(ctx, 'A = ' + E.exA + '   ·   B = ' + E.exB +
      '   ·   pericentre ' + fmtSig(O.r1, 4) + '   apocentre ' + fmtSig(O.r2, 4) +
      '   ·   p = ' + fmtSig(O.p, 4), W, H);
  },

  /* ------------------------------------------------------------ readout --- */
  readout(st){
    this.recompute(st);
    const O = st.O, E = this.curOf(st);
    if(!O) return `<div class="card tight"><div class="ttl">No metric</div>
      <p class="help">${st.err || 'Type a formula in r into both boxes.'}</p></div>`;
    const M = O.merc;
    const ok = O.geo && Number.isFinite(O.precA) && Number.isFinite(O.precB);

    /* the two-route row. fmtAgreeGross, not fmtAgree: the precession is a
       difference from 2π and CAN legitimately vanish — a metric whose orbits
       close would make max(|a|,|b|) the round-off itself and print a perfect
       result as 100% disagreement. 2π is what the zero cancelled. */
    const twoRoute = ok
      ? fmtAgreeGross(O.precA, O.precB, 2 * Math.PI, 'rad/orbit')
      : 'not computable — one route returned no number';

    return `<div class="card tight"><div class="ttl">${E.nm}</div>
      ${kv('A(r) = −g<sub>tt</sub>/c²', E.exA)}
      ${kv('B(r) = g<sub>rr</sub>', E.exB)}
      ${kv('pericentre r₁', fmtSig(O.r1, 6) + ' GM/c²')}
      ${kv('apocentre r₂ = r₁(1+e)/(1−e)', fmtSig(O.r2, 6) + ' GM/c²')}
      ${kv('semi-latus rectum p = r₁(1+e)', fmtSig(O.p, 6) + ' GM/c²')}
      ${kv('GM/(c²·r₁) — how strong the field is', fmtSig(1 / O.r1, 4))}
      ${kv('specific energy E', O.el && Number.isFinite(O.el.E) ? fmtSig(O.el.E, 8) : 'none exists')}
      ${kv('angular momentum L', O.el && Number.isFinite(O.el.L) ? fmtSig(O.el.L, 8) + ' GM/c' : 'none exists')}
    </div>
    <div class="card tight"><div class="ttl">How much it turns</div>
      ${kv('route A — pericentres of the integrated geodesic', ok
        ? fmtSig(O.precA, 8) + ' rad/orbit' : 'no second pericentre in the track')}
      ${kv('route B — the apsidal integral, no geodesic in it', Number.isFinite(O.precB)
        ? fmtSig(O.precB, 8) + ' rad/orbit' : 'not defined for these apsides')}
      ${kv('difference between the two routes', twoRoute)}
      ${ok ? kv('in degrees per orbit', fmtSig(O.precA * 180 / Math.PI, 5) + '°') : ''}
      ${ok ? kv('pericentres located', O.per.orbits + 1) : ''}
      ${ok ? kv('spread over those gaps', fmtGap(O.per.spread, O.per.apsidal, 'rad')) : ''}
      ${ok ? kv('drift of E along the track', fmtSig(O.geo.driftE, 3) + ' relative') : ''}
      ${ok ? kv('drift of L along the track', fmtSig(O.geo.driftL, 3) + ' relative') : ''}
      ${ok ? '' : `<p class="help" style="color:var(--c-warn)">There is no bound orbit here: ${O.why}</p>`}
    </div>
    <div class="card tight"><div class="ttl">Against the textbook formula</div>
      ${kv('6πGM/c²a(1−e²) = 6π/p', fmtSig(O.weak, 8) + ' rad/orbit')}
      ${kv('measured ÷ formula', ok ? fmtSig(O.precB / O.weak, 6) : '—')}
      ${kv(ok && Math.abs(O.precB / O.weak - 1) < 0.03
            ? 'difference — the formula is in range here'
            : 'difference — beyond first order, and this is the demonstration',
           ok ? fmtAgree(O.precB, O.weak, 'rad/orbit') : '—')}
      <p class="help">${ok
        ? (Math.abs(O.precB / O.weak - 1) < 0.03
          ? `The first-order formula and the measured precession agree to ${fmtSig(Math.abs(O.precB / O.weak - 1) * 100, 2)}%, which is what should happen: the formula is the leading term of an expansion in <b>GM/c²r</b>, and at this pericentre that ratio is ${fmtSig(1 / O.r1, 3)}. Bring the pericentre in and watch the agreement fail in a predictable direction — the true precession is always the larger.`
          : `The formula is out by ${fmtSig(Math.abs(O.precB / O.weak - 1) * 100, 3)}%, and that is not an error in either. It is the first term of an expansion in <b>GM/c²r</b>, which here is ${fmtSig(1 / O.r1, 3)} — nowhere near small. Push the pericentre past about 400 and the two come within a per cent. This is the only honest way to see what "first order" costs: not by being told, but by leaving the regime where it holds.`)
        : 'With no bound orbit there is nothing to compare the formula against.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The control — does the machine invent precession?</div>
      ${kv('the same quadrature on the Newtonian orbit', fmtSig(O.kepler, 12) + ' rad')}
      ${kv('what a closed ellipse must give', 'π = ' + fmtSig(Math.PI, 12) + ' rad')}
      ${kv('difference', fmtGap(Math.abs(O.kepler - Math.PI), Math.PI, 'rad'))}
      <p class="help">The inverse-square law is one of only two central forces whose bound orbits close,
      so the Newtonian apsidal angle is <b>exactly π</b> at every pair of apsides. Running the identical
      integral on that problem is the check that the precession above is a property of the metric and not
      an artefact of the quadrature: a routine that manufactured an advance would fail here first. What is
      left is round-off in <b>E² − V²</b> at the endpoints — it does not improve with more panels, which
      is how you know it is round-off and not truncation.</p>
    </div>
    <div class="card tight"><div class="ttl">Mercury, computed a third way</div>
      ${kv('semi-major axis a', fmtSig(M.a, 7) + ' m')}
      ${kv('eccentricity e', fmtSig(M.e, 6))}
      ${kv('semi-latus rectum, in GM/c²', fmtSig(M.pGeo, 5))}
      ${kv('measured from the u-equation', fmtSig(M.measured * ARCSEC, 6) + '″ per orbit')}
      ${kv('6πGM/c²a(1−e²)', fmtSig(M.formula * ARCSEC, 6) + '″ per orbit')}
      ${kv('difference', fmtAgree(M.measured, M.formula, 'rad/orbit'))}
      ${kv('arcseconds per century', fmtSig(M.measured * ARCSEC * 36525 / M.P, 5) + '″')}
      ${kv('what Le Verrier could not explain', '43″ per century')}
      <p class="help">This card does <b>not</b> use the machinery above, and the reason is worth stating.
      Mercury's semi-latus rectum is ${fmtSig(M.pGeo, 4)} in units of GM/c², and at that radius
      <b>E² − V²</b> is a difference of order 10⁻⁹ between two numbers of order 1 — the general route
      would be asking double precision for figures it does not have, and would report noise. The
      Schwarzschild u-equation adds its relativistic term instead of cancelling it, so it reaches the weak
      field the general route cannot. Le Verrier found the 43″ discrepancy in 1859 and proposed a planet,
      Vulcan, to account for it; people reported seeing it. Einstein computed this number in November 1915
      and wrote that it gave him palpitations. It is the only classical test that was a <i>retrodiction</i>
      — the measurement was already on the table, with no free parameters left to adjust.</p>
    </div>`;
  },

  chip(st){
    const O = st.O;
    if(!O || !Number.isFinite(O.precA))
      return `<div class="k">Precession</div><div style="color:var(--c-warn)">no bound orbit</div>`;
    return `<div class="k">Advance per orbit</div>
      <div style="color:var(--c-grad)">${fmtSig(O.precA, 5)} rad</div>
      <div style="color:var(--c-curl)">${fmtSig(O.precA * 180 / Math.PI, 4)}° · ${fmtSig(O.precB / O.weak, 4)}× the formula</div>`;
  },

  legend(){ return [['var(--c-grad)', 'the geodesic of the metric in the boxes'],
                    ['var(--c-pos)', 'each pericentre direction, and the apsidal radii'],
                    ['var(--c-curl)', 'the orbiting body, and route B\'s advance'],
                    ['var(--faint)', 'the first-order formula 6π/p'],
                    ['var(--accent)', 'turning points read off the potential'],
                    ['var(--c-warn)', 'the horizon']]; }
};
