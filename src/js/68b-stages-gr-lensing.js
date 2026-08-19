/* ---- 18 · bending light, through a metric or a mass profile the reader types
   Programme A item 4, rebuilt 2026-08-18. Until then this stage knew it was
   looking at Schwarzschild: the deflection came from grDeflection = 4GM/c²b,
   the Newtonian half from a second closed form beside it, the capture radius
   from 3√3 GM/c², the photon sphere from 1.5 rs. All four are properties of ONE
   metric, and §2.9's rule is that what a preset may assume is what the reader's
   own scenario has to test. So every one of them is now located from the two
   boxes, the deflection is a quadrature (46c), and the closed forms have moved
   to the unit suite where they belong — as the check, not the answer.

   What that rebuild bought, beyond the typed metric:

   · THE FACTOR OF TWO IS MEASURED. The wing has claimed in three places that
     the 'only time curved' metric bends light by exactly half. Nothing computed
     it. It is now the same quadrature run twice over the same A with B as given
     and with B = 1 — the turning point depends on A alone, so the two runs
     share the same r₀ and differ in one function — and the ratio is the PPN γ
     of the reader's own metric, which is 1 for Schwarzschild, 0 for flat space
     and whatever their boxes say otherwise.
   · THE WINDING HAS A RATE, and the rate is local. A ray near b_c circles
     without limit, and a divergence cannot be checked by evaluating it, so what
     is checked is the radians bought per decade of approach — measured by
     quadrature, predicted from A, B and W″ at the photon sphere with no
     integral in it. That prediction is the Lyapunov exponent λ, and e^(−2πλ) is
     why a black hole image has photon rings.
   · A MASS PROFILE IS A METRIC. Type M(r) and the panel takes A = 1 − 2M/r,
     B = 1/A — the class with A·B = 1, named in the panel because it is a model.
     A uniform sphere then bends exactly like a point mass outside itself
     (Birkhoff, measured), and a halo with M ∝ r bends every ray by the SAME
     angle whatever its impact parameter, which is the observational signature
     that separates an extended halo from a concentrated one.
*/
STAGES.rlLens = {
  title: 'Bending light',
  dockLegend: true,

  /* the accessor — the same shape rlMetric, rlOrbit and rlHole use, so a typed
     metric, a typed mass profile and a preset are indistinguishable downstream */
  curOf(st){
    if(st.key === 'mass')
      return { nm:'your own mass profile', sub:'M(r), read as A = 1 − 2M/r and B = 1/A',
        A:null, B:null, mass:true, exA:'1 − 2M(r)/r', exB:'1/A(r)',
        rMax:400, rPlot:40, own:true,
        note:'A mass profile is not quite a metric until you say what holds it up. This panel reads M(r) as the A·B = 1 family — radial pressure equal to minus the density — which is exact in vacuum, exact for a charged hole, and false inside an ordinary star. Within it, M = 1 is Schwarzschild, M = 1 − Q²/2r is Reissner–Nordström and M = 1 + Λr³/6 is the cosmological one, so the presets above are three profiles rather than three spacetimes.' };
    if(st.key === 'custom')
      return { nm:'your own metric', sub:'two functions of r',
        A:st.srcA, B:st.srcB, exA:pkPretty(st.srcA), exB:pkPretty(st.srcB),
        rh:null, ph:null, isco:null, vac:null, rMax:200, rPlot:30, own:true,
        note:'Your own metric. Where light turns, whether it comes back at all, how far it is bent, how much of the bend is the space part and how fast a near-critical ray winds are all located from these two functions.' };
    return RL_METRICS[st.key] || RL_METRICS.schwarzschild;
  },

  enter(st, o){
    st.key  = o.key || 'schwarzschild';
    st.srcA = o.srcA || '1 - 2/r + 0.3/r^2';
    st.srcB = o.srcB || '1/(1 - 2/r + 0.3/r^2)';
    /* the halo, because it is the profile whose answer nothing else in the wing
       can produce: a deflection that does not depend on b at all */
    st.srcM = o.srcM || 'r/12';
    st.body = o.body || 'sun';
    st.b    = o.b === undefined ? 12 : o.b;
    st.err  = '';
    this.recompute(st);
  },

  /* -------------------------------------------------------- the compute --- */
  /* TWO caches, not one, and the split is what keeps the b slider usable. The
     metric-level work — the static band, the photon sphere, the sweep over
     sixty impact parameters twice over, the winding measurement, eleven traced
     rays — is keyed on the metric alone and costs about half a million
     evaluations. Only the chosen ray is keyed on b. Dragging the slider with
     one cache redid all of it on every input event. */
  recompute(st){
    const E = this.curOf(st);
    const mkey = [st.key, E.A, E.B, st.srcM].join('|');
    if(st.mKey !== mkey || !st.F){ if(!this.recompMetric(st, E, mkey)) return; }
    const bkey = mkey + '|' + st.b;
    if(st.bKey !== bkey){ this.recompRay(st); st.bKey = bkey; }
  },

  recompMetric(st, E, mkey){
    let A, B, M = null;
    if(E.mass){
      const P = rlMassAB(st.srcM);
      if(!P){ st.err = 'The M(r) box is not a formula in r that evaluates to a number — the previous profile is still shown.'; return false; }
      A = P.A; B = P.B; M = P.M;
    } else {
      A = rlFnR(E.A); B = rlFnR(E.B);
      if(!A || !B){
        st.err = (!A ? 'The g<sub>tt</sub> box' : 'The g<sub>rr</sub> box') +
                 ' is not a formula in r that evaluates to a number — the previous metric is still shown.';
        return false;
      }
    }
    st.err = ''; st.mKey = mkey; st.bKey = '';
    const rMax = E.rMax || 200;
    const F = { A, B, M, ONE: () => 1, rMax };
    /* the band a static observer can occupy. Its LOWER edge is where rays stop
       coming back, and its UPPER edge is where there stops being an observer to
       measure a deflection against — a metric with a cosmological horizon has
       no asymptotic region, and this is the fact that decides it. */
    const band = rlStaticBand(A, 0.02, rMax);
    F.band = band; F.H = band.horizons;
    F.rIn = Number.isFinite(band.lo) ? band.lo : 0.02;
    /* `open` is true when the outward scan found no horizon to stop at, which
       is the only case in which "the deflection at infinity" names anything.
       Otherwise the bend is quoted between two observers inside the band and
       the panel says which. */
    F.far = !!band.open && Number.isFinite(band.hi);
    F.rObs = F.far ? Infinity : (Number.isFinite(band.hi) ? band.hi * 0.94 : rMax);
    F.rEdge = Number.isFinite(band.hi) ? band.hi : rMax;
    /* the outermost photon sphere, its critical impact parameter and its
       Lyapunov exponent — all located, none written down */
    F.crit = rlCritB(A, B, Math.max(0.02, F.rIn * 1.0001), Math.min(rMax, F.rEdge * 0.999), 3000);
    F.ab = rlABGap(A, B, Math.max(0.05, F.rIn * 1.05), Math.min(rMax, F.rEdge * 0.95), 400);
    /* the largest b that still turns inside the observer, so nothing is swept
       past the point where there is a ray to speak of */
    /* the largest b whose ray still turns comfortably inside the observer. At
       0.97 of the observer radius a de Sitter ray turned within three units of
       it and rlTurnR's own bracket ran out; 0.85 keeps every swept ray inside
       the region both routes are valid in. */
    const bMax = rlPhotonB(A, Number.isFinite(F.rObs) ? F.rObs * 0.85 : rMax * 4);
    /* bLo is PHYSICS — below the critical impact parameter nothing comes back —
       and where there is no photon sphere there is no such limit, so the panel
       must not invent one. Tying the sweep's width to bLo did exactly that: for
       Minkowski, bLo is the inner edge of the scan (0.02), so `bLo × 60` capped
       the sweep at b = 3 while the slider sat at 12 and the plot drew an empty
       window. The width belongs to the METRIC's own scale, not to a threshold
       that may not exist. */
    F.bLo = F.crit.has ? F.crit.b : Math.max(0.05, F.rIn * 1.2);
    F.bHi = Math.min(Number.isFinite(bMax) ? bMax : rMax, rMax);
    F.bSweepLo = Math.max(F.bLo * 1.0015, F.bHi / 120);
    F.bSlideLo = Math.max(0.2, F.crit.has ? F.crit.b * 0.6 : F.bHi / 200);
    F.bSlideHi = Math.max(F.bSlideLo + 1, F.bHi);
    const opt = { rIn: F.crit.has ? F.crit.rph : Math.max(0.02, F.rIn * 1.0001),
                  rOut: Number.isFinite(F.rObs) ? F.rObs : rMax * 200,
                  rObs: F.rObs, panels: 64 };
    F.opt = opt;
    /* THE SWEEP, twice over the same A: once with the reader's B and once with
       B = 1. The turning point depends on A alone, so both runs turn at the
       same radius and the ratio is a statement about g_rr and nothing else. */
    const bs = [];
    const lo = Math.log(F.bSweepLo), hi = Math.log(Math.max(F.bSweepLo * 1.02, F.bHi));
    for(let i = 0; i < 70; i++) bs.push(Math.exp(lo + (hi - lo) * i / 69));
    F.sw = rlDeflSweep(A, B, bs, opt);
    F.swT = rlDeflSweep(A, F.ONE, bs, opt);
    /* the log–log slope of the far half of the sweep: −1 for anything that
       looks like a point mass far away, 0 for a conical halo. Measured over the
       widest pair of usable b so that a local wiggle cannot set it. */
    F.slope = NaN;
    {
      let i0 = -1, i1 = -1;
      for(let i = 0; i < bs.length; i++){
        const d = F.sw.defl[i];
        if(Number.isFinite(d) && d > 0){ if(i0 < 0) i0 = i; i1 = i; }
      }
      if(i0 >= 0 && i1 > i0 + 4){
        const j0 = Math.round(i0 + (i1 - i0) * 0.45);
        F.slope = (Math.log(F.sw.defl[i1]) - Math.log(F.sw.defl[j0])) /
                  (Math.log(bs[i1]) - Math.log(bs[j0]));
      }
    }
    /* the winding, and the rate it winds at */
    F.wind = F.crit.has ? rlWindRate(A, B, F.crit, 6, opt) : null;
    /* γ IN THE LIMIT IT IS DEFINED IN. The ratio at the reader's b carries the
       strong-field correction — 0.960 rather than 1 at b = 12 on Schwarzschild
       — and printing that as "the PPN parameter" would be reporting a 4%
       violation of general relativity. It is measured out where the field is
       weak, and only where there is an asymptotic region to measure it in:
       Schwarzschild–de Sitter has none, and its ratio to a finite observer is
       4.31, which is a perfectly good number and is not γ. */
    F.gamFar = NaN; F.slopeFar = NaN;
    if(F.far){
      const bF = Math.max(1e5, F.bHi * 100);
      const o2 = { rIn: opt.rIn, rOut: bF * 1e4, rObs: Infinity, panels: 64 };
      const d1 = rlBend(A, B, bF, o2).defl, d0 = rlBend(A, F.ONE, bF, o2).defl;
      if(Number.isFinite(d1) && Number.isFinite(d0) && Math.abs(d0) > 1e-9 * Math.PI)
        F.gamFar = d1 / d0 - 1;
      F.bGam = bF;
      /* THE SLOPE THE CAPTION CLAIMS, measured where the claim is true. Over the
         drawn window the slope is −1.13 on Schwarzschild, because b = 25 is not
         far away and the 15π/16b term is still 12% of the answer; a legend
         reading "slope −1 is the 1/b of a point mass" beside a measured −1.13
         invites the reader to conclude the panel is out by 13%. Both are
         reported: the local one belongs to the curve that is drawn, and this
         one is the power law, measured over a doubling out where it holds. */
      const d2 = rlBend(A, B, bF * 2, { rIn: opt.rIn, rOut: bF * 2e4, rObs: Infinity, panels: 64 }).defl;
      if(Number.isFinite(d1) && Number.isFinite(d2) && d1 !== 0 && d2 !== 0 && d1 * d2 > 0)
        F.slopeFar = Math.log(d2 / d1) / Math.LN2;
    }
    /* the drawn fan: eleven rays spanning captured to barely bent, each an
       INTEGRATED null geodesic rather than a drawn arc, and coarse because a
       picture does not need ten figures */
    F.fan = [];
    {
      const rD = Math.min(Number.isFinite(F.rObs) ? F.rObs * 0.9 : 34, E.rPlot || 34);
      const bTop = rlPhotonB(A, rD * 0.9);
      const b1 = Number.isFinite(bTop) ? bTop : F.bHi;
      /* the fan starts inside b_c so that the shadow has rays falling INTO it;
         with no photon sphere nothing is captured and the fan simply spans a
         decade, rather than starting at the inner edge of the scan */
      const b0 = F.crit.has ? F.crit.b * 0.55 : b1 / 12;
      for(let k = 0; k < 11; k++){
        const bb = b0 + (b1 - b0) * k / 10;
        const R = rlBendRay(A, B, bb, rD, rD / 320, 3000, { rStop: F.rIn * 1.0005 });
        /* phIn travels with the track, because the drawing rotates by it — the
           first version rebuilt this row without it and every ray was drawn
           from φ = 0 again, which is the point-source picture the rotation
           exists to remove. An engine that takes caller-supplied objects must
           carry their tags through its return, and so must a caller repacking
           one (src/js/CLAUDE.md). */
        F.fan.push({ b: bb, track: R.track, phIn: R.phIn, captured: !!R.captured, defl: R.defl });
      }
      F.rDraw = rD;
    }
    st.F = F;
    return true;
  },

  /* the reader's own ray, both routes */
  recompRay(st){
    const F = st.F;
    F.b = st.b;
    F.B2 = rlBend(F.A, F.B, st.b, F.opt);                 // route B, the quadrature
    F.T2 = rlBend(F.A, F.ONE, st.b, F.opt);               // the same A with flat space
    /* WHAT THE ZERO CANCELLED. A deflection is the swept angle minus a straight
       line's, so it is a small difference of two quantities of size π — and in
       flat space BOTH routes return it as zero, one exactly and the other as
       2×10⁻¹² of accumulated step error. fmtAgree derives its scale as
       max(|a|,|b|), which is then the round-off itself, and a perfect answer
       reads as a 100% disagreement in the affirmative colour. π is the gross,
       and fmtAgreeGross is the form (§1.4). */
    F.gross = Math.PI;
    /* A metric whose A is constant — which is exactly what a halo M = kr gives
       — bends light entirely with g_rr, so the time-only route is not small,
       it is ZERO, and the ratio is a division by round-off. It printed
       −9.6×10¹² before this guard. "The time part contributes nothing here" is
       a fact about conical spacetimes and the right thing to say. */
    F.timeless = Number.isFinite(F.T2.defl) && !(Math.abs(F.T2.defl) > 1e-9 * F.gross);
    /* and "the time part bends nothing" is only interesting when SOMETHING
       does. In Minkowski both routes are zero and the honest caption is that
       nothing bends at all, not that space is doing all the work. */
    F.nobend = F.timeless && Number.isFinite(F.B2.defl) && !(Math.abs(F.B2.defl) > 1e-9 * F.gross);
    F.gam = (Number.isFinite(F.B2.defl) && Number.isFinite(F.T2.defl) && !F.timeless)
      ? F.B2.defl / F.T2.defl - 1 : NaN;
    /* ROUTE A. A fixed-step march cannot start at infinity, so rlRayPlan picks
       an observer scaled to this ray and a step that bounds the ANGULAR motion
       at closest approach as well as the radial journey — and the quadrature is
       then asked for that SAME radius, so the two are comparing one quantity
       rather than two that happen to be close. A fixed 200 GM/c² and a fixed
       step gave route A a 6.6×10⁻⁵ deflection in flat space at b = 0.2, which
       `runstagetests` found by driving the slider to its own lower end. */
    F.A2 = { defl: NaN, why: 'no turning point inside the observer' };
    F.rA = NaN; F.Bat = NaN;
    if(Number.isFinite(F.B2.r0)){
      const plan = rlRayPlan(st.b, F.B2.r0,
        Number.isFinite(F.rObs) ? F.rObs * 0.98 : F.B2.r0 * 20);
      F.rA = plan.rObs;
      F.A2 = rlBendRay(F.A, F.B, st.b, plan.rObs, plan.h, plan.steps, { rStop: F.rIn * 1.0005 });
      F.Bat = rlDeflect(F.A, F.B, F.B2.r0, plan.rObs, 64);
    }
    /* and the same ray again at the DRAWN radius, coarsely, purely for the
       picture — the precision run's observer is far outside the frame */
    F.myRay = rlBendRay(F.A, F.B, st.b, F.rDraw, F.rDraw / 320, 3000, { rStop: F.rIn * 1.0005 });
  },

  /* ---------------------------------------------------------- SI units ---- */
  si(st){
    const b = GR_BODIES[st.body] || GR_BODIES.sun;
    const Mg = b.GM / C2;
    return { GM: b.GM, Mg, nm: b.nm, R: b.R, sec: Mg / C_SI };
  },

  /* ------------------------------------------------------------- derive --- */
  derive(st){
    const F = st.F, C = F && F.crit;
    return {
      title:'The factor of two that made Einstein famous',
      steps:[
        drvSay('Newton had already predicted a deflection',
          'Treat light as a stream of corpuscles falling in a gravitational field and you get a bend. Soldner computed it in 1801. So the existence of light bending was not the news — its size was.'),
        drvStep('light has no rest mass, so κ = 0 and one number is left',
          `${dfrac('d' + dv('r'), 'dφ')}² ${dop('=')} ${dv('r')}⁴ ${dfrac('1', dv('A') + dv('B'))}(${dfrac('1', dv('b') + '²')} ${dop('−')} ${dfrac(dv('A'), dv('r') + '²')})`,
          `the whole of light's behaviour is the null potential W = A/r², and b = L/E is all that distinguishes one ray from another`),
        drvStep('so the turning point is where W = 1/b², and its maximum is a sphere of orbiting light',
          `${dv('b')}_c ${dop('=')} ${dv('r')}_ph ⁄ √${dv('A')}(${dv('r')}_ph)`,
          C && C.has ? `located here at r = ${fmtSig(C.rph, 7)}, giving b_c = ${fmtSig(C.b, 8)} — Schwarzschild's is 3√3`
                     : 'this metric has no photon sphere, so no ray is captured and none winds'),
        drvStep('the bend is the swept angle minus a straight line — and π goes UNDER the integral',
          `Δφ ${dop('=')} 2∫₀^{π/2} (${dfrac('√' + dv('B'), '√' + dv('g'))} ${dop('−')} 1) dθ`,
          'at b = 10⁷ the deflection is 4×10⁻⁷ against a sweep of π, so subtracting afterwards asks float64 for thirteen figures it has not got; substituting u = u₀ sin θ in both integrals makes one small integrand and the cancellation disappears'),
        drvStep('the weak field gives twice the Newtonian answer',
          `Δφ ${dop('→')} ${dfrac('4' + dv('GM'), dv('c') + '²' + dv('b'))}`,
          '= 1.75 arcseconds at the solar limb, and the panel measures the residual rather than asserting the limit — it falls like 1/b, which is the second-order term'),
        drvSay('and the extra factor comes from space, not time',
          'The Newtonian calculation accounts only for the warping of time — the potential slowing clocks. General relativity warps space as well, and for light the two contribute equally. The panel runs the same quadrature over the same A with B = 1 and prints the ratio: it is the PPN parameter γ, it is 1 for Schwarzschild and 0 for flat space, and Cassini has it to 2×10⁻⁵.'),
        drvSay('Eddington\'s 1919 eclipse settled it',
          'Two expeditions photographed stars near the eclipsed Sun and compared their positions with the night sky. The measurements favoured 1.75 over 0.87. The result was announced in November 1919 and made Einstein internationally famous within a week.'),
        drvStep('close in the expansion fails, and the failure has a rate',
          `Δφ ${dop('≈')} ${dop('−')}${dfrac('1', 'λ')} ln(${dv('b')}/${dv('b')}_c ${dop('−')} 1)`,
          C && Number.isFinite(C.lam)
            ? `λ = ${fmtSig(C.lam, 7)} here, from A, B and W″ at the photon sphere with no integral in it — so every decade closer buys another ${fmtSig(Math.LN10 / C.lam, 6)} radians, for ever`
            : 'with no photon sphere there is nothing to wind around'),
        drvSay('which is what a photon ring is',
          'Each extra turn round the hole costs a factor e^(−2πλ) in brightness, so a black hole image carries a nested series of ever-fainter rings inside the main one. The Event Horizon Telescope resolved the first; the second is a factor of about five hundred fainter.'),
        drvSay('and it is how invisible mass gets weighed',
          'The deflection depends on the mass, not on whether it emits light. Type a mass profile instead of a metric and the point becomes sharp: a point mass bends as 1/b, and a halo whose mass grows in proportion to r bends every ray by the SAME angle. Cluster arcs do not fall off the way a concentrated lens demands, which is one of the arguments that made dark matter extended.')
      ],
      note:'The rays are integrated from the geodesic equation of the two functions in the boxes, and the deflection is measured twice — once by that integration and once by a quadrature with no geodesic in it. Nothing here is a first-order formula, and the first-order formula is drawn beside the answer as the thing being tested.'
    };
  },

  /* ----------------------------------------------------------- controls --- */
  controls(){
    const st = ST, E = STAGES.rlLens.curOf(st), F = st.F;
    const opts = Object.keys(RL_METRICS).map(k => [k, RL_METRICS[k].nm])
      .concat([['custom', 'type your own A and B'], ['mass', 'type a mass profile M(r)']]);
    const bLo = F ? F.bSlideLo : 1;
    const bHi = F ? F.bSlideHi : 60;
    return rlSeg('rlLeM', st.key, opts) +
      (st.key === 'mass'
        ? fnHtml('rlLeFM', 'M(r) =', st.srcM, 'r') +
          `<p class="help" style="margin:6px 0 2px">${supify(E.note)}</p>`
        : st.key === 'custom'
        ? fnHtml('rlLeFA', '−g<sub>tt</sub>/c² = A(r) =', st.srcA, 'r') +
          fnHtml('rlLeFB', 'g<sub>rr</sub> = B(r) =', st.srcB, 'r')
        : `<p class="help" style="margin:6px 0 2px">${supify(E.note)}</p>`) +
      (st.err ? `<p class="help" style="color:var(--c-warn)">${st.err}</p>` : '') +
      rlSeg('rlLeB', st.body, Object.keys(GR_BODIES).map(k => [k, GR_BODIES[k].nm])) +
      ctlRow('impact parameter b', ctlSlider('rlLeR', bLo, bHi, (bHi - bLo) / 600, st.b)) +
      `<p class="help">Every ray is <b>integrated</b> from the null geodesic equation of whatever is in
      the boxes — there is no Newtonian term, because light has no rest mass to feel one, and yet it
      bends. Lengths are in units of <b>GM/c²</b>, so Schwarzschild reads <b>A = 1 − 2/r</b> and its
      critical impact parameter comes out at <b>3√3 = 5.196</b>; the body picker only sets what one unit
      is worth in kilometres. Bring b down towards that value and the ray winds — the lower-right panel
      measures how many radians each decade of approach buys, against a prediction made from A and B at
      the photon sphere alone. Then switch to <b>only time curved</b>, which keeps A and flattens B: the
      photon sphere, the capture radius and every circular orbit stay exactly where they were, and the
      deflection halves. Or type a <b>mass profile</b>: <b>1</b> is a point mass, <b>min(1, (r/8)^3)</b>
      is a uniform sphere of radius 8 — identical outside itself, which is Birkhoff's theorem — and
      <b>r/12</b> is a halo that bends every ray by the same angle whatever its impact parameter.</p>`;
  },
  wire(){
    const S = STAGES.rlLens;
    const reset = () => { ST.mKey = ''; ST.bKey = ''; S.recompute(ST); buildStagePanel(); };
    rlWireSeg('rlLeM', v => { ST.key = v; reset(); });
    rlWireSeg('rlLeB', v => { ST.body = v; });
    fnWire('rlLeFA', (made, src) => { ST.srcA = src; reset(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    fnWire('rlLeFB', (made, src) => { ST.srcB = src; reset(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    fnWire('rlLeFM', (made, src) => { ST.srcM = src; reset(); },
           s => { if(!rlMassAB(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    wireSlider('rlLeR', () => ST.b, v => { ST.b = v; S.recompute(ST); },
               v => fmtNum(+v, 4) + ' GM/c²');
  },

  /* -------------------------------------------------------------- frame --- */
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const F = st.F;
    if(!F){ rlText(ctx, W / 2, H / 2, 'no metric to bend light in yet', rgbCss(TH.faint), '13px ' + FONT_UI, 'center'); return; }
    const E = this.curOf(st);
    const ph = (H - 150) / 2;

    /* ============ left: the rays, integrated, and the shadow they leave ==== */
    {
      /* THE PICTURE IS SIZED FROM ITS OWN BAND, not from a half-height. The
         first version centred it at 52 + 0.55·ph with a radius of 0.92·ph, so
         the widest ray reached y = 3 — above its own title at y = 32, which the
         rays then drew straight through. Take the band between the title and
         the caption line and fit inside it. */
      const yTop = 48, yBot = H - 74;
      const cx = W * 0.23, cy = 0.5 * (yTop + yBot);
      const view = F.rDraw * 1.02;
      const sc = Math.min(W * 0.19, 0.5 * (yBot - yTop)) / view;
      const ttl = 'Rays through the metric — integrated, not drawn';
      rlText(ctx, ctTitleClearChip(ctx, cx, 32, ttl), 32, ttl, rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
      /* the horizon, where there is one; otherwise the inner edge of the band.
         Filled with the PAGE colour and ringed, not filled white: a white disc
         where the picture's subject is a shadow reads as a star. */
      if(F.H.count && Number.isFinite(F.band.lo)){
        const rh = Math.max(1.5, F.band.lo * sc);
        ctx.fillStyle = rgbCss(TH.bg);
        ctx.beginPath(); ctx.arc(cx, cy, rh, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = rgbCss(TH.text, 0.85); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(cx, cy, rh, 0, 6.2832); ctx.stroke();
      }
      /* the photon sphere and the capture circle, both located */
      if(F.crit.has){
        ctx.strokeStyle = rgbCss(TH.neg, 0.6); ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(cx, cy, F.crit.rph * sc, 0, 6.2832); ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = rgbCss(TH.warn, 0.75); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, F.crit.b * sc, 0, 6.2832); ctx.stroke();
        rlText(ctx, cx, cy - F.crit.b * sc - 9, 'b_c = ' + fmtSig(F.crit.b, 5),
               rgbCss(TH.warn), '9.5px ' + FONT_MONO, 'center');
      }
      /* EVERY TRACK IS ROTATED BY ITS OWN phIn, and the first screenshot is why.
         rlGeoRun starts every ray at φ = 0, so drawn as they come they all leave
         the SAME POINT on the canvas and the fan reads as a point source — a
         picture of a lamp, when the thing being drawn is starlight, which
         arrives parallel. Rotated by the angle its own velocity makes with the
         −x direction, each ray comes in horizontally at height exactly b, which
         is what makes the dashed undeflected line below line up with it.

         AND A TRACK IS DECIMATED BEFORE IT IS DRAWN. rlRayPlan sizes route A's
         step by the angular rate at closest approach, so a near-critical ray
         comes back with 22 000 samples; stroking eleven of those, mirrored, is
         tens of thousands of segments per frame. `auditperf` counts PAINT CALLS,
         and that is twenty-three of them — a single stroke() over a 22 000-point
         path is one paint call and a real cost, which is the blind spot in
         reading that gate. 240 points is more than a 300-pixel picture resolves. */
      const trace = (R, s, w, col) => {
        const track = R && R.track;
        if(!track || track.n < 3) return;
        const rot = Number.isFinite(R.phIn) ? R.phIn : 0;
        const step = Math.max(1, Math.ceil(track.n / 240));
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.beginPath();
        let on = false;
        for(let i = 0; i <= track.n; i += step){
          const rr = track.r[i], pp = track.ph[i] + rot;
          if(!(rr > 0) || rr > view * 1.4){ on = false; continue; }
          const X = cx + rr * Math.cos(pp) * sc, Y = cy - s * rr * Math.sin(pp) * sc;
          on ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), on = true);
        }
        ctx.stroke();
      };
      /* the fan. Each track is drawn and MIRRORED through the axis, so the pair
         of images a lens makes is visible without integrating twice. */
      for(const R of F.fan){
        const col = rgbCss(R.captured ? TH.pos : TH.grad, R.captured ? 0.85 : 0.6);
        trace(R, 1, 1.3, col);
        trace(R, -1, 1.3, col);
      }
      /* The reader's ray, traced AT THE SCALE OF THE PICTURE. F.A2 is the
         precision run, whose observer sits at twenty times the closest
         approach — four times outside this frame at the default — so drawing it
         here showed one clipped arc across the top and nothing recognisable.
         This is the same integrator over the same metric at the drawn radius. */
      if(F.myRay){
        trace(F.myRay, 1, 2.4, rgbCss(TH.curl));
        if(!F.myRay.captured)
          rlSegment(ctx, cx + view * sc, cy - st.b * sc, cx - view * sc, cy - st.b * sc,
                    rgbCss(TH.faint, 0.6), 1.2, [4, 4]);
      }
      const cap = F.crit.has
        ? 'inside b_c nothing comes back — that circle is the shadow'
        : 'no photon sphere here, so nothing is captured';
      rlText(ctx, cx, H - 56, cap,
             rgbCss(TH.faint), '9.5px ' + FONT_MONO, 'center');
    }

    /* ============ right top: the deflection against b, log–log ============= */
    const px = W * 0.52, pw = W * 0.42;
    {
      const xs = [], ys = [], yt = [];
      let yLo = Infinity, yHi = -Infinity, xLo = Infinity, xHi = -Infinity;
      for(let i = 0; i < F.sw.b.length; i++){
        const d = F.sw.defl[i], t = F.swT.defl[i], x = Math.log10(F.sw.b[i]);
        xs.push(x);
        ys.push(d > 0 ? Math.log10(d) : NaN);
        yt.push(t > 0 ? Math.log10(t) : NaN);
        if(d > 0){ yLo = Math.min(yLo, Math.log10(d)); yHi = Math.max(yHi, Math.log10(d)); xLo = Math.min(xLo, x); xHi = Math.max(xHi, x); }
      }
      /* THE WINDOW IS FITTED OVER THE CURVE THE PANEL IS ABOUT, and the B = 1
         comparison only where it has something to say. On a conical halo A is
         constant, so the time-only deflection is round-off — 10⁻¹² — and
         letting it into the fit stretched the axis over twelve decades with the
         real curve pinned flat against the top. This is auditframe's rule read
         the other way: fit over the same list you draw from, unless a member of
         that list is a zero, in which case say so instead of scaling to it. */
      for(let i = 0; i < F.swT.defl.length; i++){
        const t = F.swT.defl[i];
        if(t > 0 && Math.log10(t) > yLo - 2.5) yLo = Math.min(yLo, Math.log10(t));
      }
      /* NOTHING BENDS AT ALL is a result, not an empty window. Minkowski's
         deflection is exactly zero at every b, log₁₀ 0 is −∞, and fitting a
         window to a list with no finite member drew an axis with no curve in
         it and a legend claiming a slope. Say what happened instead. */
      const none = !Number.isFinite(yLo);
      const yPad = none ? 0 : Math.max(0.15, (yHi - yLo) * 0.1);
      const P = mkPlot(px, 48, pw, ph, none ? 0 : xLo, none ? 1 : Math.max(xHi, xLo + 0.3),
                       none ? 0 : yLo - yPad, none ? 1 : yHi + yPad);
      plotFrame(ctx, P, none ? '' : 'log₁₀ b   (GM/c²)', none ? '' : 'log₁₀ Δφ   (radians)',
        'How the bend falls off — the slope is the physics');
      if(none){
        rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 - 8, 'no bending at any impact parameter',
               rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
        rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 14,
               'a geodesic here is a straight line — this is the control',
               rgbCss(TH.faint), '10.5px ' + FONT_UI, 'center');
      } else {
        const xk = rlTickStep(P.x1 - P.x0, 4), xt = [];
        for(let v = Math.ceil(P.x0 / xk) * xk; v <= P.x1 + 1e-9; v += xk) xt.push(v);
        plotTicksX(ctx, P, xt, v => fmtTick(v, xk));
        const yk = rlTickStep(P.y1 - P.y0, 4), ytk = [];
        for(let v = Math.ceil(P.y0 / yk) * yk; v <= P.y1 + 1e-9; v += yk) ytk.push(v);
        rlYTicks(ctx, P, ytk, v => fmtTick(v, yk));
        rlLine(ctx, P, xs, yt, rgbCss(TH.faint), 1.8, [5, 4]);
        rlLine(ctx, P, xs, ys, rgbCss(TH.grad), 2.4);
        if(Number.isFinite(F.B2.defl) && F.B2.defl > 0)
          rlDot(ctx, P.X(Math.log10(st.b)), P.Y(Math.min(P.y1, Math.max(P.y0, Math.log10(F.B2.defl)))),
                4.5, rgbCss(TH.curl), rgbCss(TH.bg));
        rlText(ctx, P.px + P.pw - 6, P.py + 15, Number.isFinite(F.slope)
          ? 'measured slope ' + fmtSig(F.slope, 4) : 'your metric',
          rgbCss(TH.grad), '10px ' + FONT_MONO, 'right');
        rlText(ctx, P.px + P.pw - 6, P.py + 30, 'the same A with B = 1',
          rgbCss(TH.faint), '10px ' + FONT_MONO, 'right');
        rlText(ctx, P.px + 8, P.py + P.ph - 10,
          !Number.isFinite(F.slopeFar) ? 'no asymptotic slope to quote here'
            : Math.abs(F.slopeFar) < 0.05 ? 'flat — every ray bent the same, whatever b'
            : Math.abs(F.slopeFar + 1) < 0.05 ? 'far out the slope is −1 — the 1/b of a point mass'
            : 'far out the slope is ' + fmtSig(F.slopeFar, 4),
          rgbCss(TH.dim), '9.5px ' + FONT_MONO);
      }
    }

    /* ============ right bottom: the winding, and its measured rate ========= */
    {
      const P0y = 48 + ph + 54;
      if(F.wind && Number.isFinite(F.wind.pred)){
        const xs = [], ys = [];
        let yLo = Infinity, yHi = -Infinity;
        for(let i = 0; i < F.wind.eps.length; i++){
          const d = F.wind.defl[i];
          xs.push(-Math.log10(F.wind.eps[i]));
          ys.push(d);
          if(Number.isFinite(d)){ yLo = Math.min(yLo, d); yHi = Math.max(yHi, d); }
        }
        if(!Number.isFinite(yLo)){ yLo = 0; yHi = 1; }
        const P = mkPlot(px, P0y, pw, ph - 6, 0.5, F.wind.eps.length + 0.5,
                         Math.max(0, yLo - 0.6), yHi + 0.9);
        plotFrame(ctx, P, 'decades closer to b_c', 'Δφ   (radians)',
          'A divergence, checked by its rate');
        const dx = [];
        for(let v = 1; v <= F.wind.eps.length; v++) dx.push(v);
        plotTicksX(ctx, P, dx, v => fmtTick(v, 1));
        const yk = rlTickStep(P.y1 - P.y0, 4), ytk = [];
        for(let v = Math.ceil(P.y0 / yk) * yk; v <= P.y1 + 1e-9; v += yk) ytk.push(v);
        rlYTicks(ctx, P, ytk, v => fmtTick(v, yk));
        /* the local prediction, drawn as a line of slope ln10/λ pinned to the
           first measured point — so the picture shows a prediction over a
           measurement rather than a fit */
        if(Number.isFinite(F.wind.defl[0])){
          const lx = [], ly = [];
          for(let i = 0; i < F.wind.eps.length; i++){ lx.push(i + 1); ly.push(F.wind.defl[0] + i * F.wind.pred); }
          rlLine(ctx, P, lx, ly, rgbCss(TH.faint), 1.8, [5, 4]);
        }
        rlLine(ctx, P, xs, ys, rgbCss(TH.grad), 2.2);
        for(let i = 0; i < xs.length; i++)
          if(Number.isFinite(ys[i])) rlDot(ctx, P.X(xs[i]), P.Y(Math.min(P.y1, ys[i])), 3.2, rgbCss(TH.grad));
        /* every full turn is 2π: draw them, because "winds twice" is the claim */
        for(let k = 1; k * 2 * Math.PI < P.y1; k++){
          const y = k * 2 * Math.PI;
          if(y < P.y0) continue;
          rlSegment(ctx, P.px, P.Y(y), P.px + P.pw, P.Y(y), rgbCss(TH.neg, 0.35), 1, [3, 4]);
          rlText(ctx, P.px + 6, P.Y(y) - 7, k + (k === 1 ? ' full turn' : ' full turns'),
                 rgbCss(TH.neg, 0.9), '9px ' + FONT_MONO);
        }
        rlText(ctx, P.px + P.pw - 6, P.py + 15,
          'predicted ln10/λ = ' + fmtSig(F.wind.pred, 6) + ' per decade',
          rgbCss(TH.faint), '9.5px ' + FONT_MONO, 'right');
        rlText(ctx, P.px + P.pw - 6, P.py + 30, Number.isFinite(F.wind.last)
          ? 'measured ' + fmtSig(F.wind.last, 6) : 'measured —',
          rgbCss(TH.grad), '9.5px ' + FONT_MONO, 'right');
      } else {
        const P = mkPlot(px, P0y, pw, ph - 6, 0, 1, 0, 1);
        plotFrame(ctx, P, '', '', 'A divergence, checked by its rate');
        rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 - 8,
          'no photon sphere in this metric', rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
        rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 14,
          'so no ray winds, and none is captured', rgbCss(TH.faint), '10.5px ' + FONT_UI, 'center');
      }
    }
    stageNote(ctx, 'Δφ → 4GM/c²b far away — and the factor of 2 over Newton is the curvature of space itself', W, H);
  },

  /* ------------------------------------------------------------ readout --- */
  readout(st){
    const F = st.F;
    if(!F) return `<div class="card tight"><div class="ttl">No metric yet</div></div>`;
    const E = this.curOf(st), U = this.si(st), C = F.crit;
    const arc = v => Number.isFinite(v)
      ? (Math.abs(v) * ARCSEC > 3600 ? fmtSig(v * 180 / Math.PI, 5) + '°' : fmtSig(v * ARCSEC, 5) + '″')
      : '—';
    /* The 1919 number, the engine's own weak-field calibration and the Einstein
       ring, all computed from the same quadrature and none of them quoted —
       and all memoised in rlLensFacts, because a readout runs on every panel
       refresh and the ring costs sixty full deflections to bisect. Inline, that
       was not a slow frame but a hang: the headless screenshot pass never
       returned. None of the three depends on anything the reader can change. */
    const K = rlLensFacts();
    const shap = grShapiroRoundTrip(GM_SUN, AU_M, 1.082e11, R_SUN);

    return `<div class="card tight"><div class="ttl">${E.nm}</div>
      ${E.mass ? kv('M(r) — the mass inside r', pkPretty(st.srcM)) : ''}
      ${kv('A(r) = −g<sub>tt</sub>/c²', E.exA)}
      ${kv('B(r) = g<sub>rr</sub>', E.exB)}
      ${kv('horizons, as sign changes of A', F.H.count
        ? F.H.roots.map(v => fmtSig(v, 7)).join(',  ') + '  GM/c²' : 'none in range')}
      ${kv('photon sphere, as a root of A′r = 2A', C.has ? fmtSig(C.rph, 8) + ' GM/c²' : 'none — no ray orbits here')}
      ${C.has ? kv('critical impact parameter r/√A there', fmtSig(C.b, 9) + ' GM/c²') : ''}
      ${C.has && st.key === 'schwarzschild' ? kv('  against 3√3, which is what it should be',
        fmtAgree(C.b, 3 * Math.sqrt(3), '')) : ''}
      ${kv('worst |A·B − 1| over the band', fmtAgree(F.ab.prod, 1, ''))}
      ${kv('the observer the bend is measured against', F.far
        ? 'infinity — this metric is asymptotically flat'
        : 'r = ' + fmtSig(F.rObs, 6) + ' GM/c², inside the static band')}
      ${F.far ? '' : `<p class="help" style="color:var(--c-warn)">This metric has an outer horizon at
        <b>r = ${fmtSig(F.rEdge, 6)}</b>, so there is no asymptotic region and no "deflection at
        infinity" to quote. The bend below is the angle accumulated between that observer and the
        closest approach and back out again, measured against the straight line with the same closest
        approach. That is a different quantity from the textbook one, and it is the only one this
        spacetime has.</p>`}
      <p class="help">${supify(E.note)}</p>
    </div>
    <div class="card tight"><div class="ttl">The ray at b = ${fmtSig(st.b, 6)} GM/c²</div>
      ${Number.isFinite(F.B2.r0)
        ? kv('closest approach, located from W = 1/b²', fmtSig(F.B2.r0, 8) + ' GM/c²')
        : kv('closest approach', F.B2.captured ? 'none — this ray is captured' : F.B2.why)}
      ${Number.isFinite(F.B2.defl) ? kv('deflection, by quadrature' + (F.far ? ' — the whole bend' : ''),
        fmtSig(F.B2.defl, 9) + ' rad  =  ' + arc(F.B2.defl)) : ''}
      ${F.far && Number.isFinite(F.Bat) ? kv('the same quadrature stopped at r = ' + fmtSig(F.rA, 5),
        fmtSig(F.Bat, 9) + ' rad') : ''}
      ${Number.isFinite(F.A2.defl)
        ? kv('route A — RK4 on the geodesic equation, to r = ' + fmtSig(F.rA, 5), fmtSig(F.A2.defl, 9) + ' rad')
        : kv('route A — RK4 on the geodesic equation', F.A2.why || '—')}
      ${Number.isFinite(F.A2.defl) && Number.isFinite(F.Bat)
        ? kv('difference between the two routes', fmtAgreeGross(F.Bat, F.A2.defl, F.gross, 'rad')) : ''}
      ${Number.isFinite(F.A2.driftE) ? kv('drift of E along route A, imposed nowhere', fmtSig(F.A2.driftE, 3) + ' relative') : ''}
      ${Number.isFinite(F.A2.driftL) ? kv('drift of L', fmtSig(F.A2.driftL, 3) + ' relative') : ''}
      ${kv('as ' + U.nm + ', one GM/c² is', fmtSig(U.Mg / 1000, 5) + ' km')}
      ${Number.isFinite(F.B2.defl) ? kv('so this ray passes at', fmtSig(st.b * U.Mg / 1000, 5) + ' km') : ''}
      <p class="help">${F.B2.captured
        ? 'Below the critical impact parameter there is no turning point at all: the ray spirals in and does not come back. That is what the dark circle in the picture is — the shadow, and the thing the Event Horizon Telescope photographed. Note that it is <b>b_c</b> and not the horizon: the shadow is larger than the hole.'
        : 'One route locates the turning point by bisection on the null potential and integrates a closed form in which no geodesic appears; the other marches the second-order geodesic equation through the Christoffel symbols of the same two functions and is never told that E and L are conserved, so the drift rows measure the arithmetic rather than restate the theorem.'}</p>
    </div>
    <div class="card tight"><div class="ttl">How much of the bend is space?</div>
      ${Number.isFinite(F.B2.defl) ? kv('with your B(r)', fmtSig(F.B2.defl, 8) + ' rad') : ''}
      ${Number.isFinite(F.T2.defl) ? kv('the same A(r) with B = 1 — time only',
        F.nobend ? '0 — and neither does the full metric: nothing bends here'
          : F.timeless ? '0 — the time part bends nothing here' : fmtSig(F.T2.defl, 8) + ' rad') : ''}
      ${Number.isFinite(F.gam) ? kv('ratio at your b', fmtSig(F.gam + 1, 8)) : ''}
      ${F.far
        ? kv('γ in the weak field, at b = ' + fmtSig(F.bGam, 3),
             Number.isFinite(F.gamFar) ? fmtSig(F.gamFar, 8)
               : (F.timeless ? 'not defined — the time part contributes nothing at all'
                             : 'not computable out there'))
        : kv('γ, the PPN space-curvature parameter',
             'not defined — γ is a property of an asymptotically flat metric, and this one has an outer horizon')}
      ${Number.isFinite(F.slope) ? kv('log–log slope of Δφ against b, over the drawn window', fmtSig(F.slope, 5)) : ''}
      ${Number.isFinite(F.slopeFar) ? kv('  and far away, over a doubling at b = ' + fmtSig(F.bGam, 3),
        fmtSig(F.slopeFar, 6) + (Math.abs(F.slopeFar + 1) < 1e-3 ? ' — so Δφ ∝ 1/b, a point mass'
              : Math.abs(F.slopeFar) < 1e-3 ? ' — so Δφ does not depend on b at all' : '')) : ''}
      ${kv('grazing the Sun, b = R☉c²/GM☉ = ' + fmtSig(K.bLimb, 6), arc(K.limb))}
      ${kv('  the first-order 4GM/c²b there', arc(K.limbWeak))}
      ${kv('  difference', fmtAgree(K.limb, K.limbWeak, ''))}
      ${kv('and out at b = 3×10⁶, where the next term has gone', fmtAgree(K.cal, K.calWeak, 'rad'))}
      <p class="help">The turning point depends on <b>A alone</b>, so the first two rows are the same
      quadrature over the same path and differ in exactly one function. The ratio is therefore a clean
      statement about g<sub>rr</sub>, and in the weak field it is the parametrised-post-Newtonian
      <b>γ</b>: 1 for general relativity, 0 for a theory that curves only time. Cassini's radio tracking
      has it at γ − 1 = (2.1 ± 2.3)×10⁻⁵. <b>At your b it is not γ yet</b> — the ratio carries the
      strong-field correction, which is why the two rows are separate and the second says which b it was
      measured at. The last three rows are the same test done twice over: at the solar limb the
      second-order term is a few parts in 10⁶ and visible; out at b = 3×10⁶ it has fallen below 10⁻⁶ and
      <b>Δφ = 4GM/c²b</b> is exact to everything the arithmetic has left. Those two use Schwarzschild
      whatever is in the boxes — they are the engine calibrating itself, in the open.</p>
    </div>
    ${F.wind ? `<div class="card tight"><div class="ttl">The winding, and why photon rings exist</div>
      ${kv('Lyapunov exponent λ at the photon sphere', fmtSig(C.lam, 8))}
      ${kv('predicted radians per decade, ln10/λ', fmtSig(F.wind.pred, 8))}
      ${kv('measured over the last decade', Number.isFinite(F.wind.last) ? fmtSig(F.wind.last, 8) : '—')}
      ${kv('difference — prediction against measurement', Number.isFinite(F.wind.last)
        ? fmtAgree(F.wind.last, F.wind.pred, 'rad') : 'not computable')}
      ${Number.isFinite(F.wind.best) ? kv('best agreement, at decade ' + F.wind.bestAt,
        fmtSig(F.wind.best, 3) + ' relative') : ''}
      ${kv('turns made by the closest ray measured', Number.isFinite(F.wind.defl[F.wind.defl.length - 1])
        ? fmtSig(F.wind.defl[F.wind.defl.length - 1] / (2 * Math.PI), 5) : '—')}
      ${kv('brightness of each extra turn, e^(−2πλ)', fmtSig(F.wind.dim, 4) + '  —  1 part in ' + fmtSig(1 / F.wind.dim, 4))}
      <p class="help">A divergent quantity cannot be checked by evaluating it, so what is checked is the
      <b>rate</b>. The prediction is local — A, B and W″ at the photon sphere, with no integral anywhere
      in it — and the measurement is a quadrature of the extra angle each decade of approach buys. They
      agree, the increments never shrink, and the deflection therefore has no limit. The same λ sets how
      much fainter each successive winding is, which is why a black hole image carries a nested series
      of photon rings and why only the first has been resolved. Flatten B to 1 and λ becomes √3 instead
      of 1: the same rays, wound a third less far, because the winding rate carries the curvature of
      space as well as of time.</p>
    </div>` : ''}
    <div class="card tight"><div class="ttl">The other two things bending implies</div>
      ${kv('Einstein ring for a 10¹² M☉ lens, solved from Δφ', Number.isFinite(K.ring) ? fmtSig(K.ring * ARCSEC, 6) + '″' : K.ringWhy)}
      ${kv('  the weak-field √(4GM D_LS/c²D_L D_S)', fmtSig(K.ringWeak * ARCSEC, 6) + '″')}
      ${kv('  difference', Number.isFinite(K.ring) ? fmtAgree(K.ring, K.ringWeak, '') : '—')}
      ${kv('  (lens at 1 Gpc, source at 2 Gpc)', '')}
      ${kv('Shapiro round-trip delay past the Sun', fmtSig(shap * 1e6, 5) + ' μs')}
      ${kv('  as an extra path length', fmtSig(shap * C_SI / 1000, 5) + ' km')}
      <p class="help">A lens directly in line with a source produces a <b>ring</b>, not a spot, and its
      radius is the angle at which the bend exactly closes the gap — so it is found here by solving
      <b>β = θ − (D<sub>LS</sub>/D<sub>S</sub>)Δφ(D<sub>L</sub>θ)</b> with the deflection this stage
      computes, and checked against the closed form rather than replaced by it. The <b>Shapiro
      delay</b> is the same geometry read as a clock: a radar pulse bounced off Venus at superior
      conjunction comes back a few hundred microseconds late. Nothing travelled slower than c; the path
      through the deeper part of the metric is simply longer than it looks. It is now the tightest of
      the classical tests, verified by Cassini to about one part in 10⁵.</p>
    </div>`;
  },

  chip(st){
    const F = st.F;
    if(!F) return `<div class="k">Light bending</div><div>no metric</div>`;
    const d = F.B2 && F.B2.defl;
    return `<div class="k">Light bending</div>
      <div style="color:var(--c-grad)">${Number.isFinite(d)
        ? (Math.abs(d) * ARCSEC > 3600 ? fmtSig(d * 180 / Math.PI, 4) + '°' : fmtSig(d * ARCSEC, 4) + '″')
        : (F.B2 && F.B2.captured ? 'captured' : '—')}</div>
      <div style="color:var(--faint)">${Number.isFinite(F.gamFar) ? 'γ = ' + fmtSig(F.gamFar, 4)
        : F.nobend ? 'nothing bends' : (Number.isFinite(F.gam) ? 'ratio ' + fmtSig(F.gam + 1, 4) : 'space alone')}</div>
      <div style="color:var(--c-warn)">b_c = ${F.crit.has ? fmtSig(F.crit.b, 5) : 'none'}</div>`;
  },
  legend(st){
    const F = st && st.F;
    return [['var(--c-grad)', 'rays that escape, and the deflection they measure'],
            ['var(--c-pos)', 'rays that are captured'],
            ['var(--c-curl)', 'your ray, and the straight line it would have taken'],
            ['var(--c-warn)', 'the critical impact parameter, located'],
            ['var(--c-neg)', 'the photon sphere, and each full turn'],
            ['var(--faint)', 'the same A with B = 1 — time curved, space flat']]
      .concat(F && F.wind ? [] : []);
  }
};

/* ---- 19 · falling in, and the two clocks that disagree ----------------------
   Programme A item 3, rebuilt 2026-08-18. Until then this stage knew it was
   looking at Schwarzschild and said what followed: rs = 2GM/c², the photon
   sphere at 1.5 rs, the ISCO at 3 rs, the proper time from the cycloid, the
   coordinate time from MTW's closed form, the tide as 2GM L/r³. Every one of
   those is a property of ONE metric, and §2.9's rule is that what a preset may
   assume is exactly what the reader's own scenario has to test. So the fall is
   now a quadrature over whatever A and B are in the boxes, and the closed forms
   have moved to the unit suite where they belong — as the check, not the
   answer.

     ROUTE A  rlInfallRun integrates dτ/dr = √(A·B/(E²−A)) and dt/dr = (E/A)·
              that, separately, in a variable chosen to remove each end's
              singularity. No geodesic equation anywhere in it.
     ROUTE B  rlGeoRun marches the second-order geodesic equation with L = 0
              through the Christoffel symbols of the same two functions, and is
              told neither E nor the first integral.

   And the divergence of the coordinate clock is measured rather than drawn as
   an arrow: a divergent integral cannot be checked by evaluating it, so what is
   checked is the RATE — predicted locally as ln2·√(A·B)/A′ at the horizon, with
   no integral in it, and measured globally as the coordinate time added by each
   successive halving of the remaining gap. Equal increments ARE a logarithm.

   The 'only time curved' preset is here for the same reason it is in the
   deflection stage and the precession stage, and it pays off a third time:
   B = 1 makes A·B vanish at the horizon, the pole in t softens from 1/(r−r_h)
   to an integrable 1/√(r−r_h), and the coordinate time to the horizon is
   FINITE. The frozen star is the curvature of space. */
STAGES.rlHole = {
  title: 'Falling in',
  dockLegend: true,

  /* the accessor — the same shape rlMetric and rlOrbit use, so a typed metric
     and a preset are indistinguishable downstream */
  curOf(st){
    if(st.key === 'custom')
      return { nm:'your own metric', sub:'two functions of r',
        A:st.srcA, B:st.srcB, exA:pkPretty(st.srcA), exB:pkPretty(st.srcB),
        rh:null, ph:null, isco:null, vac:null, rMax:120, rPlot:24, own:true,
        note:'Your own metric. Where the horizon is, whether the proper time to it is finite, whether the coordinate time diverges and how fast, and how hard the tide pulls there are all located from these two functions.' };
    return RL_METRICS[st.key] || RL_METRICS.schwarzschild;
  },

  enter(st, o){
    st.key   = o.key || 'schwarzschild';
    st.srcA  = o.srcA || '1 - 2/r + 0.3/r^2';
    st.srcB  = o.srcB || '1/(1 - 2/r + 0.3/r^2)';
    st.body  = o.body || 'hole';
    st.r0    = o.r0 === undefined ? 20 : o.r0;    // release radius, in GM/c²
    /* the probe is held as DECADES above the horizon rather than as a radius,
       because the horizon moves when the metric changes and "how close am I"
       is the question this stage is about. It also makes the divergence
       legible: one more decade is a fixed number of seconds, every time. */
    st.dec   = o.dec === undefined ? 2 : o.dec;
    st.err   = '';
    st.t     = 0;
    this.recompute(st);
  },

  /* Everything expensive is cached against every input that can change it. A
     bad formula returns WITHOUT touching st.F, so the picture that was on the
     screen stays and the panel says what went wrong. */
  recompute(st){
    const E = this.curOf(st);
    const key = [st.key, E.A, E.B, st.r0, st.dec].join('|');
    if(st.cacheKey === key && st.F){ st.err = ''; return; }
    const A = rlFnR(E.A), B = rlFnR(E.B);
    if(!A || !B){
      st.err = (!A ? 'The g<sub>tt</sub> box' : 'The g<sub>rr</sub> box') +
               ' is not a formula in r that evaluates to a number — the previous metric is still shown.';
      return;
    }
    st.err = ''; st.cacheKey = key;
    /* THE SCAN MUST REACH PAST THE READER'S RELEASE RADIUS. E.rMax is a table
       field sized for each metric's own structure, not a law: with it alone,
       releasing from r₀ = 150 in Schwarzschild silently became r₀ = 58.2,
       because the static band stopped where the scan did and the clamp below
       took the scan's edge for the edge of the spacetime. Two release radii
       200 apart then produced the identical proper time, which is what gave it
       away. Schwarzschild has no upper limit on where you may hover; de Sitter
       does, and that one is real. */
    const rMax = Math.max(E.rMax || 60, st.r0 * 1.25);
    /* the band a static observer can occupy, and its LOWER edge is the horizon
       a faller crosses. Not "the outermost horizon" — for a metric with a
       cosmological horizon that is the one you are carried out through, not the
       one you fall into. */
    const band = rlStaticBand(A, 0.05, rMax);
    const F = { A, B, band, H: band.horizons, rMax };
    F.rh = Number.isFinite(band.lo) && band.horizons.count ? band.lo : NaN;
    F.hasH = Number.isFinite(F.rh);
    /* the release radius is clamped into the static band, because there is no
       rest to fall from outside it. That clamp is PHYSICS — beyond a
       cosmological horizon nothing can be held still — so when it moves the
       reader's number it has to say so (§1.5), and `clamped` is what the panel
       prints. With the scan now reaching past r₀ it fires only where it should:
       de Sitter, whose static band ends at r ≈ 99. */
    F.r0 = Math.min(st.r0, Number.isFinite(band.hi) && band.horizons.count > 1
                           ? band.hi * 0.97 : st.r0);
    F.clamped = F.r0 < st.r0 - 1e-9 ? band.hi : NaN;
    F.E = rlInfallE(A, F.r0);
    F.ph = rlPhotonR(A, 0.05, rMax).outer;
    F.isco = rlIscoR(A, F.hasH ? F.rh * 1.02 : 0.05, Math.min(rMax, (band.hi || rMax) * 0.98)).r;

    /* WHERE THE FALL ENDS. With a horizon, at it; without one, at the bottom of
       the scan — a metric with no horizon has no crossing to time. */
    F.rEnd = F.hasH ? F.rh : Math.max(0.05, band.lo);
    /* ROUTE A, proper time all the way to the horizon: the 'bot' substitution,
       no log segment, because dτ/dr is finite there and t is the only thing
       that diverges. */
    const toH = rlInfallRun(A, B, F.r0, F.rEnd, 900, {});
    F.tauH = toH.tauEnd; F.stop = toH.stop; F.falls = !toH.stop && toH.n > 2;

    /* the probe: a fixed number of decades above the horizon */
    F.gap = F.hasH ? Math.max(1e-13, Math.pow(10, -st.dec)) * F.rh : 0;
    F.rProbe = F.hasH ? F.rh + F.gap : F.rEnd + (F.r0 - F.rEnd) * 0.05;
    /* the profile the two clock curves are drawn from, and the numbers at the
       probe: one run, so what is printed is what is plotted */
    F.prof = rlInfallRun(A, B, F.r0, F.rProbe, 900, F.hasH ? { rh: F.rh } : {});
    F.tauP = F.prof.tauEnd; F.tP = F.prof.tEnd;

    /* ROUTE B — the same fall by RK4 on the geodesic equation, told neither E
       nor the first integral. The step is sized by the proper time route A has
       just measured, so a long slow fall gets the same resolution as a short
       one instead of a step chosen for Schwarzschild and applied to everything.

       THE COMPARISON IS NOT MADE AT THE PROBE, and that is a measurement rather
       than a preference. Route B marches the state [t, r, φ, ṫ, ṙ, φ̇] in proper
       time, and ṫ = E/A runs away at the horizon: measured on 2026-08-18, its
       relative drift in E goes 2×10⁻¹² with the target at r_h + r_h, 3×10⁻⁷ at
       r_h(1 + 10⁻²), and 3×10⁸ once the target is within 10⁻⁴ — by which point
       the integrator has stopped describing anything. The proper time it
       reports stays good long after the coordinate time has gone, which is the
       phenomenon and not a defect in it; but it makes the probe the wrong place
       to ask whether two routes agree. The question is asked a third of the way
       down instead, where both are sound, and the panel names that radius.

       AND rStop SITS BELOW rCmp ON PURPOSE. rlGeoRun does not record the step
       that trips its stop, so a run halted AT the comparison radius leaves every
       recorded sample above it and the interpolation below has nothing to
       bracket — which is exactly what happened first time round, and route B
       returned NaN on all five presets while the panel printed the NaN without
       complaint. */
    F.rCmp = F.rEnd + (F.r0 - F.rEnd) * 0.35;
    F.geo = null; F.tauB = NaN; F.tB = NaN; F.tauA = NaN; F.tA = NaN;
    if(F.falls && Number.isFinite(F.E) && Number.isFinite(F.tauH)){
      const aRun = rlInfallRun(A, B, F.r0, F.rCmp, 900, F.hasH ? { rh: F.rh } : {});
      F.tauA = aRun.tauEnd; F.tA = aRun.tEnd;
      const h = Math.max(1e-6, F.tauH / 24000);
      const g = rlGeoRun(A, B, rlGeoInit(A, B, F.r0, F.E, 0, 1, -1), h, 60000,
                         { rStop: F.rEnd + (F.r0 - F.rEnd) * 0.20, rEsc: F.r0 * 4 });
      F.geo = g;
      /* four-point Lagrange in r through the crossing, so the interpolation is
         fourth order like the integrator and does not become the thing being
         measured */
      if(g.n > 4 && g.r[g.n] < F.rCmp){
        let i = 1; while(i < g.n && g.r[i] > F.rCmp) i++;
        const j = Math.max(1, Math.min(g.n - 2, i - 1));
        const lag = (ys) => {
          let s = 0;
          for(let a = j - 1; a <= j + 2; a++){
            let w = 1;
            for(let b = j - 1; b <= j + 2; b++) if(b !== a) w *= (F.rCmp - g.r[b]) / (g.r[a] - g.r[b]);
            s += w * ys[a];
          }
          return s;
        };
        F.tauB = lag(g.tau); F.tB = lag(g.t);
      }
    }

    /* THE DIVERGENCE. The local prediction, and the measurement it is checked
       against — 20 halvings, which on a horizon near r = 2 reaches a gap of
       10⁻⁸ before round-off in r_h + d starts to matter. */
    F.rate = F.hasH ? rlInfallLogRate(A, B, F.rh) : null;
    F.halv = (F.hasH && F.falls && Number.isFinite(F.E))
      ? rlInfallHalvings(A, B, F.E, F.rh, 0.01 * F.rh, 20, 160) : null;
    /* the best agreement reached, and WHERE — the sequence converges linearly
       in the remaining gap and then turns back up as round-off in r_h + d takes
       over, so quoting the last one alone would understate it and quoting the
       best without saying which would be picking a winner. Both are reported. */
    F.best = NaN; F.bestAt = NaN;
    if(F.halv && F.rate && Number.isFinite(F.rate.perHalving) && F.rate.simple){
      for(let i = 0; i < F.halv.dt.length; i++){
        const e = Math.abs(F.halv.dt[i] - F.rate.perHalving) / Math.abs(F.rate.perHalving);
        if(!(e >= F.best)){ F.best = e; F.bestAt = F.halv.d[i]; }
      }
    }

    /* the tide, and the redshift, both at three radii the panel names */
    F.tideH  = F.hasH ? rlTidalRadial(A, B, F.rh) : NaN;
    F.tideP  = rlTidalRadial(A, B, F.rProbe);
    F.tide0  = rlTidalRadial(A, B, F.r0);
    F.zProbe = rlInfallRedshift(A, F.rProbe, F.E);
    st.F = F;
  },

  /* ---------------------------------------------------------- SI units ---- */
  /* One unit of length is GM/c² metres and one unit of time is GM/c³ seconds,
     so the body picker sets nothing but the exchange rate. The tide is a
     curvature, 1/length², and converts as c²/(GM/c²)². */
  si(st){
    const b = GR_BODIES[st.body] || GR_BODIES.hole;
    const Mg = b.GM / C2;
    return { GM: b.GM, Mg, sec: Mg / C_SI, nm: b.nm,
             kg: b.GM / G_SI, tide: C2 / (Mg * Mg) };
  },

  /* ------------------------------------------------------------- derive --- */
  derive(st){
    const E = this.curOf(st), F = st.F;
    const rh = F && F.hasH ? fmtSig(F.rh, 8) : 'none in range';
    const rate = F && F.rate && F.rate.simple ? fmtSig(F.rate.perHalving, 6) : null;
    return {
      title:'What a horizon is, and which clock finds out',
      steps:[
        drvSay('a horizon is not put in by hand',
          'It is wherever the time coefficient changes sign. Above it a clock can be held still; below it the labels t and r have swapped roles and nothing can. The panel scans for that sign change instead of quoting a radius, which is why it finds two for a charged hole and none at all for flat space.'),
        drvStep('so drop something from rest, and read off its energy',
          `${dv('E')} ${dop('=')} ${dv('A')}${dfrac('d' + dv('t'), 'dτ')} ${dop('=')} √${dv('A')}(${dv('r')}₀)`,
          `at rest dτ = √A dt, so the constant is fixed by the release radius alone — here r₀ = ${F ? fmtSig(F.r0, 6) : '—'}, and the located horizon is at r = ${rh}`),
        drvStep('the first integral gives the two clocks separately',
          `${dfrac('dτ', 'd' + dv('r'))} ${dop('=')} √${dfrac(dv('A') + dv('B'), dv('E') + '² ' + dop('−') + ' ' + dv('A'))}` +
          `      ${dfrac('d' + dv('t'), 'd' + dv('r'))} ${dop('=')} ${dfrac(dv('E'), dv('A'))}${dfrac('dτ', 'd' + dv('r'))}`,
          'two different integrands over the same path — and the panel integrates both, rather than scaling one into the other'),
        drvSay('and at the horizon they part company completely',
          'The product A·B stays finite there, so the proper-time integrand does too and the faller crosses in a finite and rather short time with nothing local to mark it. The coordinate-time integrand carries an extra 1/A, which is a simple pole: the integral diverges, and that is the freezing distant observers describe.'),
        drvStep('the divergence has a rate, and the rate is local',
          `${dv('t')} ${dop('≈')} ${dop('−')}${dfrac('√(' + dv('AB') + ')', dv('A') + '′(' + dv('r') + '_h)')}·ln(${dv('r')} ${dop('−')} ${dv('r')}_h)`,
          rate ? `so every halving of the remaining gap costs the same ${rate} of coordinate time, for ever — and the panel measures that increment as well as predicting it`
               : 'the panel predicts the increment from A′ at the horizon and measures it by quadrature, and compares'),
        drvSay('which is why the freezing belongs to g_rr, not to g_tt',
          'The rate carries √(A·B). For every vacuum metric that product is 1 and the pole is simple. Flatten the space part to B = 1 and A·B vanishes at the horizon: the pole softens to an integrable inverse square root and the coordinate time to the horizon becomes <i>finite</i>. Nothing about the time coefficient has changed, so no argument about time dilation can account for it. Try the second preset.'),
        drvSay('and the divergence is a failure of the labels, not of the place',
          'Schwarzschild t is the reading of a clock at infinity, and it stops being a useful label near the horizon. Change to infalling coordinates and nothing singular happens there at all. The horizon is a boundary of what can be seen, not a wall.'),
        drvStep('what does break is the curvature, and it is what kills you',
          `${dv('R')}_t̂r̂t̂r̂ ${dop('=')} ${dfrac(dv('A') + '″ ' + dop('−') + ' ' + dv('A') + '′' + dv('Q') + '′/2' + dv('Q'), '2' + dv('Q'))}` +
          `,   ${dv('Q')} ${dop('=')} ${dv('A')}${dv('B')}`,
          'the relative acceleration per unit separation along a radial line — computed from the reader\'s own A and B, and equal to 2GM/c²r³ when they are Schwarzschild\'s'),
        drvSay('and for a big enough hole the crossing is gentle',
          'That tide at the horizon falls as 1/M², so a supermassive hole is crossed in perfectly good health while a stellar-mass one tears you apart thousands of kilometres out. Size decides which fate arrives first — and the horizon itself is a property of the causal structure, not of any local field strength, which is exactly why the equivalence principle survives it.')
      ],
      note:'Both clocks are quadratures of the two boxes, in variables chosen to remove the singularity at each end — a square root at the release point, where the particle is at rest, and a logarithm at the horizon, where the coordinate clock has its pole. The proper time is checked against a Runge–Kutta march of the geodesic equation that is told neither E nor the first integral.'
    };
  },

  /* ----------------------------------------------------------- controls --- */
  controls(){
    const st = ST, E = STAGES.rlHole.curOf(st), F = st.F;
    const opts = Object.keys(RL_METRICS).map(k => [k, RL_METRICS[k].nm]).concat([['custom', 'type your own']]);
    return rlSeg('rlHoM', st.key, opts) +
      (st.key === 'custom'
        ? fnHtml('rlHoFA', '−g<sub>tt</sub>/c² = A(r) =', st.srcA, 'r') +
          fnHtml('rlHoFB', 'g<sub>rr</sub> = B(r) =', st.srcB, 'r')
        : `<p class="help" style="margin:6px 0 2px">${supify(E.note)}</p>`) +
      (st.err ? `<p class="help" style="color:var(--c-warn)">${st.err}</p>` : '') +
      rlSeg('rlHoB', st.body, Object.keys(GR_BODIES).map(k => [k, GR_BODIES[k].nm])) +
      ctlRow('release from r₀', ctlSlider('rlHoS', 2.2, 200, 0.1, st.r0)) +
      ctlRow('probe, decades above r_h', ctlSlider('rlHoD', 0, 12, 1, st.dec)) +
      rlClockCtl() +
      `<p class="help">Drop from rest at <b>r₀</b> and let go. Lengths are in units of <b>GM/c²</b>, so
      Schwarzschild reads <b>A = 1 − 2/r</b> with its horizon at <b>r = 2</b>, and the body picker only
      sets what one unit is worth in kilometres and seconds. The faller's own clock (orange) reaches the
      horizon in a finite and rather short time and nothing local marks the crossing. The
      <b>coordinate</b> clock (teal) runs off the top of the frame — and the panel on the lower right is
      the honest version of that: it measures the coordinate time added by each successive halving of the
      remaining gap. Equal bars <i>are</i> a logarithm. Now switch to <b>only time curved</b>, which
      keeps A and flattens B, and watch the bars collapse instead: the freezing is the curvature of
      space, and deleting it deletes the frozen star while leaving every clock rate untouched.</p>`;
  },
  wire(){
    const S = STAGES.rlHole;
    rlWireSeg('rlHoM', v => { ST.key = v; S.recompute(ST); ST.t = 0; buildStagePanel(); });
    rlWireSeg('rlHoB', v => { ST.body = v; });
    fnWire('rlHoFA', (made, src) => { ST.srcA = src; ST.cacheKey = ''; S.recompute(ST); ST.t = 0; buildStagePanel(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    fnWire('rlHoFB', (made, src) => { ST.srcB = src; ST.cacheKey = ''; S.recompute(ST); ST.t = 0; buildStagePanel(); },
           s => { if(!rlFnR(s)) throw new Error('that is not a formula in r that returns a number'); return rlFnR(s); });
    wireSlider('rlHoS', () => ST.r0, v => { ST.r0 = v; S.recompute(ST); ST.t = 0; },
               v => fmtNum(+v, 4) + ' GM/c²');
    wireSlider('rlHoD', () => ST.dec, v => { ST.dec = v; S.recompute(ST); },
               v => 'r_h × (1 + 10' + supDigits(-(+v)) + ')');
    rlWireClock(st => { st.t = 0; });
  },

  /* -------------------------------------------------------------- frame --- */
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const F = st.F;
    if(!F){ rlText(ctx, W / 2, H / 2, 'no metric to fall in yet', rgbCss(TH.faint), '13px ' + FONT_UI, 'center'); return; }
    const E = this.curOf(st), U = this.si(st);
    const ph = (H - 150) / 2;

    /* ================= left top: the hole, and the faller ================== */
    const cx = W * 0.24, cy = 52 + ph * 0.52;
    const Rmax = Math.min(W * 0.16, ph * 0.42);
    /* the radial axis is compressed so that the horizon, the photon sphere and
       the release radius are all legible at once; at r₀ = 20 a linear map puts
       the first two within a few pixels of each other */
    const rBase = F.hasH ? F.rh : Math.max(0.05, F.rEnd);
    const RS = r => Rmax * Math.pow(Math.max(r, rBase) / rBase, 0.45) / Math.pow(F.r0 / rBase, 0.45);
    const ttl = F.hasH ? 'the horizon, located — and the fall through it'
                       : 'no horizon in this metric';
    rlText(ctx, ctTitleClearChip(ctx, cx, 32, ttl), 32, ttl, rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    if(F.hasH){
      ctx.fillStyle = rgbCss(TH.text, 0.92);
      ctx.beginPath(); ctx.arc(cx, cy, RS(F.rh), 0, 6.2832); ctx.fill();
      ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, RS(F.rh), 0, 6.2832); ctx.stroke();
      rlText(ctx, cx, cy, 'horizon', rgbCss(TH.bg), '600 10px ' + FONT_MONO, 'center');
    }
    /* the located landmarks, each drawn only where it exists */
    /* The two landmarks are labelled on OPPOSITE sides of the disc. The radial
       compression is what makes that necessary: (r/r_h)^0.45 puts the photon
       sphere and the ISCO within eight pixels of each other on Schwarzschild,
       so two labels above the circles overlap into one unreadable smear, which
       is what the first screenshot showed. */
    const marks = [[F.ph, TH.neg, 'photon sphere'], [F.isco, TH.accent, 'ISCO']];
    for(let m = 0; m < marks.length; m++){
      const [rr, col, nm] = marks[m];
      if(!Number.isFinite(rr) || rr <= rBase || rr > F.r0) continue;
      ctx.strokeStyle = rgbCss(col, 0.7); ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, RS(rr), 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
      rlText(ctx, cx, cy + (m ? RS(rr) + 13 : -RS(rr) - 7), nm + ' ' + fmtSig(rr, 4),
             rgbCss(col), '9.5px ' + FONT_MONO, 'center');
    }
    /* the faller, parameterised by their OWN proper time, so the motion on the
       screen is the quantity the stage is about. r(τ) comes from inverting the
       computed profile rather than from any formula. */
    let rNow = F.r0;
    if(F.falls && Number.isFinite(F.tauH) && F.tauH > 0){
      const frac = (st.t * 0.18) % 1.18;
      const want = Math.min(F.tauH, frac * F.tauH);
      const T = F.prof.tau, R = F.prof.r;
      if(T.length > 1 && want <= T[T.length - 1]){
        let a = 0, b = T.length - 1;
        while(b - a > 1){ const m = (a + b) >> 1; (T[m] <= want) ? (a = m) : (b = m); }
        const f = (want - T[a]) / Math.max(1e-30, T[b] - T[a]);
        rNow = R[a] + f * (R[b] - R[a]);
      } else rNow = F.rProbe;
    }
    rlSegment(ctx, cx + RS(rBase), cy, cx + RS(F.r0), cy, rgbCss(TH.pos, 0.25), 1.4);
    rlDot(ctx, cx + RS(F.r0), cy, 3.5, rgbCss(TH.faint));
    rlDot(ctx, cx + RS(rNow), cy, 5.5, rgbCss(TH.pos), rgbCss(TH.bg));
    rlDot(ctx, cx + RS(F.rProbe), cy - 13, 4, rgbCss(TH.curl));
    rlText(ctx, cx, cy + Rmax + 26, 'radius drawn as (r/r_h)^0.45',
           rgbCss(TH.faint), '9.5px ' + FONT_MONO, 'center');
    rlText(ctx, cx, cy + Rmax + 42, F.falls
      ? 'the faller is at r = ' + fmtSig(rNow, 5)
      : 'nothing falls from r₀ here', rgbCss(TH.dim), '10.5px ' + FONT_MONO, 'center');

    /* ================= left bottom: the signal, fading ===================== */
    {
      const px = W * 0.07, pw = W * 0.34;
      /* AT LEAST SIX DECADES, whatever the probe is doing. Keying this window to
         the probe alone made it two decades wide at the default and there was
         nothing in the picture to see; the probe is a MARKER on this plot, not
         its extent. */
      const dPr = F.hasH ? Math.log10(Math.max(1e-13, F.gap / F.rh)) : -6;
      const dLo = Math.min(-6, dPr);
      /* and the vertical window is fitted over the SAME samples the curve is
         drawn from, rather than to a fixed −12: the fade depends on the metric
         and on r₀, and a window that assumed one of them left the curve in a
         tenth of the frame (auditframe's rule, applied before it complains) */
      const xs = [], ys = [];
      if(F.hasH && F.falls) for(let i = 0; i <= 160; i++){
        const u = dLo + (0 - dLo) * i / 160;
        const z = rlInfallRedshift(F.A, F.rh * (1 + Math.pow(10, u)), F.E);
        xs.push(u); ys.push(z > 0 ? Math.log10(z) : NaN);
      }
      let yLo = Infinity, yHi = -Infinity;
      for(const v of ys) if(Number.isFinite(v)){ yLo = Math.min(yLo, v); yHi = Math.max(yHi, v); }
      if(!Number.isFinite(yLo)){ yLo = -6; yHi = 0; }
      const yPad = Math.max(0.2, (yHi - yLo) * 0.12);
      const Q = mkPlot(px, 52 + ph + 54, pw, ph - 6, dLo, 0, yLo - yPad, yHi + yPad);
      plotFrame(ctx, Q, 'log₁₀ (r − r_h)/r_h', 'log₁₀ (received / sent)',
        'The image dims to nothing — it does not stop');
      const dk = rlTickStep(-dLo, 4), dx = [];
      for(let v = Math.ceil(dLo / dk) * dk; v <= 1e-9; v += dk) dx.push(v);
      plotTicksX(ctx, Q, dx, v => fmtTick(v, dk));
      const zk = rlTickStep(yHi - yLo + 2 * yPad, 4), zt = [];
      for(let v = Math.ceil((yLo - yPad) / zk) * zk; v <= yHi + yPad + 1e-12; v += zk) zt.push(v);
      rlYTicks(ctx, Q, zt, v => fmtTick(v, zk));
      if(xs.length){
        rlLine(ctx, Q, xs, ys, rgbCss(TH.neg), 2.4);
        if(dPr >= dLo){
          rlSegment(ctx, Q.X(dPr), Q.py, Q.X(dPr), Q.py + Q.ph, rgbCss(TH.curl, 0.6), 1.2, [4, 4]);
          rlText(ctx, Q.X(dPr), Q.py + Q.ph - 8, 'probe', rgbCss(TH.curl), '9.5px ' + FONT_MONO, 'center');
        }
        rlText(ctx, Q.px + Q.pw - 6, Q.py + 15, 'slope 1 — ten times fainter per decade',
               rgbCss(TH.neg), '9.5px ' + FONT_MONO, 'right');
      } else {
        rlText(ctx, Q.px + Q.pw / 2, Q.py + Q.ph / 2, 'no horizon, so nothing reddens without limit',
               rgbCss(TH.dim), '11px ' + FONT_UI, 'center');
      }
    }

    /* ================= right top: the two clocks ========================== */
    const px = W * 0.53, pw = W * 0.41;
    {
      const tauMax = Number.isFinite(F.tauH) && F.tauH > 0 ? F.tauH : 1;
      /* the vertical range is set by the PROPER time, so the coordinate curve
         runs off the top of the frame — which is the honest picture of a
         divergence, and auditframe is told about it by the stage's entry in the
         allowed list rather than by fitting the window to a number that has no
         top. The window is fitted over both curves' shared quantity, τ. */
      const P = mkPlot(px, 48, pw, ph, F.rEnd, F.r0, 0, tauMax * 2.3);
      plotFrame(ctx, P, 'r  (GM/c²)', 'elapsed  (GM/c³)',
        'Two clocks on one fall: one finishes, one does not');
      const tk = rlTickStep(F.r0 - F.rEnd), tx = [];
      for(let v = Math.ceil(F.rEnd / tk) * tk; v <= F.r0 + 1e-9; v += tk) tx.push(v);
      plotTicksX(ctx, P, tx, v => fmtTick(v, tk));
      const yk = rlTickStep(tauMax * 2.3, 4), yt = [];
      for(let v = 0; v <= tauMax * 2.3 + 1e-12; v += yk) yt.push(v);
      rlYTicks(ctx, P, yt, v => fmtTick(v, yk));
      if(F.falls){
        rlLine(ctx, P, F.prof.r, F.prof.t, rgbCss(TH.grad), 2.4);
        rlLine(ctx, P, F.prof.r, F.prof.tau, rgbCss(TH.pos), 2.4);
        /* route B, drawn as dots on the same axes — a different integrator,
           visibly on top of route A rather than merely reported as agreeing */
        if(F.geo) for(let i = 0; i <= F.geo.n; i += Math.max(1, Math.round(F.geo.n / 26)))
          rlDot(ctx, P.X(F.geo.r[i]), P.Y(Math.min(P.y1, F.geo.tau[i])), 2.6, rgbCss(TH.text, 0.55));
        if(F.hasH){
          rlSegment(ctx, P.X(F.rh), P.py, P.X(F.rh), P.py + P.ph, rgbCss(TH.warn, 0.7), 1.6);
          rlText(ctx, P.X(F.rh) + 6, P.py + P.ph - 10, 'horizon', rgbCss(TH.warn), '10px ' + FONT_MONO);
        }
        /* NO "off the top, for ever" ARROW HERE, and the first screenshot is why.
           A logarithm is slow: on Schwarzschild each further decade of approach
           costs 2·ln10 ≈ 4.6, so driving the probe from r_h + 10⁻² all the way
           to r_h + 10⁻¹² moves this curve up by 46 in a frame 225 tall. It never
           visibly runs away, and an arrow claiming it does would be a picture
           that looks the same whether the mathematics is right or not. What
           diverges is measured in the panel below instead, and this caption says
           so rather than gesturing at it. */
        rlText(ctx, P.px + P.pw - 6, P.py + 16,
               'coordinate time — ' + fmtSig(F.tP, 5) + ' at the probe' +
               (F.rate && F.rate.simple ? ', unbounded at the horizon' : ', and converging'),
               rgbCss(TH.grad), '10.5px ' + FONT_MONO, 'right');
        rlText(ctx, P.px + P.pw - 6, P.py + 32,
               'proper time — ' + fmtSig(F.tauH, 5) + ' and done',
               rgbCss(TH.pos), '10.5px ' + FONT_MONO, 'right');
        if(F.rate && F.rate.simple)
          rlText(ctx, P.px + P.pw - 6, P.py + 48,
                 'the climb is logarithmic — no linear axis shows that. The panel below measures it',
                 rgbCss(TH.faint), '9.5px ' + FONT_MONO, 'right');
      } else {
        rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2,
               'nothing falls from r₀ in this metric — see the panel',
               rgbCss(TH.dim), '11px ' + FONT_UI, 'center');
      }
    }

    /* ============ right bottom: the divergence, one halving at a time ====== */
    {
      const Hv = F.halv, R = F.rate;
      const n = Hv ? Hv.dt.length : 0;
      let top = 1;
      if(n){ for(const v of Hv.dt) top = Math.max(top, v); }
      if(R && Number.isFinite(R.perHalving)) top = Math.max(top, R.perHalving);
      const Q = mkPlot(px, 48 + ph + 54, pw, ph - 6, 0, Math.max(2, n), 0, top * 1.25);
      plotFrame(ctx, Q, 'halvings of the gap to the horizon', 'coordinate time added',
        'Equal bars are a logarithm — and this is measured');
      plotTicksX(ctx, Q, [0, Math.max(2, n) / 2, Math.max(2, n)], v => fmtTick(v, Math.max(2, n) / 2));
      const bk = rlTickStep(top * 1.25, 4), bt = [];
      for(let v = 0; v <= top * 1.25 + 1e-12; v += bk) bt.push(v);
      rlYTicks(ctx, Q, bt, v => fmtTick(v, bk));
      if(n){
        const bw = Math.max(2, Q.pw / n * 0.68);
        ctx.fillStyle = rgbCss(TH.grad, 0.8);
        for(let i = 0; i < n; i++){
          const y = Q.Y(Hv.dt[i]);
          ctx.fillRect(Q.X(i + 0.5) - bw / 2, y, bw, Q.py + Q.ph - y);
        }
        /* the LOCAL prediction, drawn across them: no integral in it at all */
        if(R && Number.isFinite(R.perHalving) && R.simple){
          rlSegment(ctx, Q.px, Q.Y(R.perHalving), Q.px + Q.pw, Q.Y(R.perHalving),
                    rgbCss(TH.pos), 2, [6, 4]);
          rlText(ctx, Q.px + 6, Q.Y(R.perHalving) - 8,
                 'ln2·√(AB)/A′ = ' + fmtSig(R.perHalving, 6), rgbCss(TH.pos), '10px ' + FONT_MONO);
        } else {
          rlText(ctx, Q.px + Q.pw - 6, Q.py + 16, 'no simple pole — the bars collapse and the sum converges',
                 rgbCss(TH.neg), '10px ' + FONT_MONO, 'right');
        }
      } else {
        rlText(ctx, Q.px + Q.pw / 2, Q.py + Q.ph / 2,
               F.hasH ? 'no fall to time here' : 'no horizon, so no divergence to measure',
               rgbCss(TH.dim), '11px ' + FONT_UI, 'center');
      }
    }

    stageNote(ctx, 'A = ' + E.exA + '   ·   B = ' + E.exB +
      (F.hasH ? '   ·   horizon at r = ' + fmtSig(F.rh, 6) : '   ·   no horizon') +
      '   ·   released at ' + fmtSig(F.r0, 5), W, H);
  },

  /* ------------------------------------------------------------ readout --- */
  readout(st){
    this.recompute(st);
    const F = st.F, E = this.curOf(st), U = this.si(st);
    if(!F) return `<div class="card tight"><div class="ttl">No metric</div>
      <p class="help">${st.err || 'Type a formula in r into both boxes.'}</p></div>`;
    const km = v => v > 1e8 ? fmtSig(v / 1e9, 5) + ' Gm' : fmtSig(v / 1000, 5) + ' km';
    const secs = v => fmtSig(v * U.sec, 5) + ' s';
    /* the tide as an acceleration across a 2 m body, in g — the form the number
       is worth anything in */
    const gAcross = k => Math.abs(k) * U.tide * 2 / 9.80665;

    const twoRoute = (F.falls && Number.isFinite(F.tauB) && Number.isFinite(F.tauA))
      ? fmtAgree(F.tauA, F.tauB, 'GM/c³') : 'the integrator did not reach that radius';
    const twoRouteT = (F.falls && Number.isFinite(F.tB) && Number.isFinite(F.tA))
      ? fmtAgree(F.tA, F.tB, 'GM/c³') : '—';
    const rateRow = F.rate && F.rate.simple && F.halv && F.halv.steps > 1
      ? fmtAgree(F.halv.dt[F.halv.dt.length - 1], F.rate.perHalving, 'GM/c³')
      : '—';

    return `<div class="card tight"><div class="ttl">${E.nm}</div>
      ${kv('A(r) = −g<sub>tt</sub>/c²', E.exA)}
      ${kv('B(r) = g<sub>rr</sub>', E.exB)}
      ${kv('horizon radii located, as sign changes of A', F.H.count
        ? F.H.roots.map(v => fmtSig(v, 7)).join(',  ') + '  GM/c²'
        : 'none — nothing here has one')}
      ${F.hasH && F.H.count > 1 ? kv('the one a faller crosses', fmtSig(F.rh, 8) + ' GM/c²') : ''}
      ${Number.isFinite(F.ph) ? kv('photon sphere', fmtSig(F.ph, 6) + ' GM/c²') : ''}
      ${Number.isFinite(F.isco) ? kv('ISCO', fmtSig(F.isco, 6) + ' GM/c²') : ''}
      ${kv('as ' + U.nm + ', one GM/c² is', km(U.Mg))}
      ${F.hasH ? kv('so the horizon is', km(F.rh * U.Mg)) : ''}
      ${F.hasH ? kv('mean density inside it', fmtSig(U.kg / (4 / 3 * Math.PI * Math.pow(F.rh * U.Mg, 3)), 4) + ' kg/m³') : ''}
      <p class="help">That density row falls as <b>1/M²</b>. A hole of a few billion solar masses has a
      horizon less dense than water, and one the mass of the observable universe would be thinner than
      air. Nothing about a horizon requires crushing density — only enough mass inside a given radius.</p>
    </div>
    <div class="card tight"><div class="ttl">The fall from r₀ = ${fmtSig(F.r0, 6)}</div>
      ${Number.isFinite(F.clamped) ? kv('released from', fmtSig(F.r0, 6) +
        ' — moved in from ' + fmtSig(st.r0, 6)) : ''}
      ${F.falls ? kv('proper time to the horizon', fmtSig(F.tauH, 8) + ' GM/c³') : ''}
      ${F.falls ? kv('  in seconds, as ' + U.nm, secs(F.tauH)) : ''}
      ${F.falls ? kv('probe at r_h × (1 + 10' + supDigits(-st.dec) + ') = ' + fmtSig(F.rProbe, 8),
                     'proper time ' + fmtSig(F.tauP, 8) + ' GM/c³') : ''}
      ${F.falls ? kv('coordinate time to the probe', Number.isFinite(F.tP)
        ? fmtSig(F.tP, 8) + ' GM/c³  =  ' + secs(F.tP) : 'already divergent') : ''}
      ${F.falls ? kv('coordinate time to the horizon itself', F.rate && F.rate.simple
        ? 'the integral diverges — see below' : (Number.isFinite(F.tP) ? 'finite — see below' : 'not computable')) : ''}
      ${F.falls ? '' : `<p class="help" style="color:var(--c-warn)">${F.stop || 'no fall from there'}.</p>`}
      ${Number.isFinite(F.clamped) ? `<p class="help" style="color:var(--c-warn)">Your release radius
        was moved inward. This metric's static band ends at <b>r = ${fmtSig(F.clamped, 6)}</b> — a
        cosmological horizon — and beyond it nothing can be held at rest, so there is no release from
        there to compute. That limit is physics, not the slider.</p>` : ''}
      <p class="help">${F.falls
        ? 'Both clocks here are quadratures over the two boxes, in variables chosen to remove the singularity at each end: a square root at the release point, where the particle is at rest and dτ/dr has an inverse-square-root pole, and a logarithm at the horizon, where the coordinate clock has a simple one.'
        : 'A particle released at rest only falls inward where A increases outward. Where it does not, releasing it at rest does nothing at all — Minkowski everywhere, and Schwarzschild–de Sitter beyond the maximum of A at about r = 21.5, where the cosmological term has taken over and carries things out instead.'}</p>
    </div>
    ${F.falls ? `<div class="card tight"><div class="ttl">The same fall, by a route that shares no arithmetic</div>
      ${kv('compared at r = ' + fmtSig(F.rCmp, 7), 'a third of the way down')}
      ${kv('route A — the quadrature, proper time', Number.isFinite(F.tauA) ? fmtSig(F.tauA, 9) + ' GM/c³' : '—')}
      ${kv('route B — RK4 on the geodesic equation, told no E', Number.isFinite(F.tauB)
        ? fmtSig(F.tauB, 9) + ' GM/c³' : 'did not reach that radius')}
      ${kv('difference between the two routes', twoRoute)}
      ${kv('and on the coordinate clock', twoRouteT)}
      ${F.geo ? kv('drift of E along route B, imposed nowhere', fmtSig(F.geo.driftE, 3) + ' relative') : ''}
      ${F.geo ? kv('drift of the norm', fmtSig(F.geo.driftNorm, 3) + ' relative') : ''}
      <p class="help">One route integrates <b>dτ/dr</b> and <b>dt/dr</b> from the first integral, in r.
      The other marches the second-order geodesic equation in proper time through the Christoffel
      symbols of the same two functions, and is never told that E is conserved — so the drift row is a
      measurement of the arithmetic rather than a restatement of the theorem.
      <b>The comparison is made a third of the way down rather than at the probe</b>, and that is
      deliberate: route B carries <b>dt/dτ = E/A</b> in its state vector, which runs away at the
      horizon. With the target at r_h(1 + 10⁻²) its drift in E is about 3×10⁻⁷; at r_h(1 + 10⁻⁴) it is
      3×10⁸ and the integrator has stopped describing anything. Its <i>proper</i> time stays good long
      after its coordinate time has gone — which is the phenomenon this stage is about, seen from
      inside the numerical method.</p>
    </div>` : ''}
    <div class="card tight"><div class="ttl">The divergence, measured</div>
      ${F.rate ? kv('lim A·B at the horizon', fmtSig(F.rate.P, 6)) : ''}
      ${F.rate ? kv('  the same product a decade further out ÷ it', fmtSig(F.rate.pRatio, 6) +
         (F.rate.simple ? ' — a genuine limit, so the pole is simple' : ' — so A·B is vanishing there')) : ''}
      ${F.rate ? kv("A′ at the horizon", fmtSig(F.rate.ap, 6)) : ''}
      ${F.rate && F.rate.simple ? kv('surface gravity κ = A′/2√(A·B)', fmtSig(F.rate.kappa, 6) + ' c³/GM') : ''}
      ${F.rate && F.rate.simple ? kv('predicted per halving, ln2·√(A·B)/A′', fmtSig(F.rate.perHalving, 8) + ' GM/c³') : ''}
      ${F.halv && F.halv.steps ? kv('measured over the last of ' + F.halv.steps + ' halvings',
         fmtSig(F.halv.dt[F.halv.dt.length - 1], 8) + ' GM/c³') : ''}
      ${F.rate && F.rate.simple ? kv('difference — prediction against measurement', rateRow) : ''}
      ${Number.isFinite(F.best) ? kv('best agreement reached, at a gap of ' + fmtSig(F.bestAt, 3),
         fmtSig(F.best, 3) + ' relative') : ''}
      ${F.halv && F.halv.steps > 1 ? kv('ratio of successive increments', fmtSig(F.halv.settled, 8) +
         (F.rate && F.rate.simple ? ' — 1, so they never shrink' : ' — 1/√2, so the sum converges')) : ''}
      <p class="help">${!F.rate ? 'With no horizon there is no divergence to measure.'
        : F.rate.simple
        ? `A divergent integral cannot be checked by evaluating it, so what is checked is the <b>rate</b>. The prediction is local — A′ and A·B at the horizon, with no integral anywhere in it — and the measurement is a quadrature of the coordinate time added by each successive halving of the remaining gap. They agree, the increments never shrink, and the sum therefore has no limit. Note that E has cancelled out of the rate: <i>every</i> infaller freezes at the same exponential rate whatever height they were dropped from, because the rate belongs to the horizon and not to them. It is 1/2κ, and that κ is the same surface gravity that sets a black hole's temperature. The agreement improves linearly as the gap closes and then turns back up once r_h + d loses figures to round-off, which is why the best one is reported with the gap it happened at.`
        : `This metric has <b>no simple pole</b> at the horizon: A·B vanishes there rather than tending to a constant, so the integrand softens from 1/(r − r_h) to an integrable 1/√(r − r_h) and the increments fall by 1/√2 each halving instead of staying level. The coordinate time to the horizon is <b>finite</b>. Nothing about A has changed — every clock rate, the horizon itself, the photon sphere and every circular orbit are exactly where Schwarzschild puts them — so no argument about gravitational time dilation can account for the difference. The frozen star is <b>g<sub>rr</sub></b>.`}</p>
    </div>
    <div class="card tight"><div class="ttl">What actually kills you</div>
      ${F.hasH ? kv('tidal stretch at the horizon, across 2 m', Number.isFinite(F.tideH)
        ? fmtSig(gAcross(F.tideH), 4) + ' g' : 'unbounded — the curvature diverges there') : ''}
      ${kv('at the probe, r = ' + fmtSig(F.rProbe, 6), Number.isFinite(F.tideP)
        ? fmtSig(gAcross(F.tideP), 4) + ' g' : 'unbounded')}
      ${kv('at the release radius', Number.isFinite(F.tide0) ? fmtSig(gAcross(F.tide0), 4) + ' g' : '—')}
      ${F.hasH && Number.isFinite(F.tideH)
        ? kv('verdict at the horizon', gAcross(F.tideH) > 20
            ? 'fatal — pulled apart well before arrival' : 'survivable — you would cross without noticing')
        : ''}
      ${kv('signal redshift from the probe', Number.isFinite(F.zProbe) ? '×' + fmtSig(F.zProbe, 6) : '—')}
      <p class="help">${F.hasH && !Number.isFinite(F.tideH)
        ? 'The tide is <b>unbounded</b> at this metric\'s horizon, which means it is not a horizon at all in the usual sense — it is a genuine curvature singularity, naked and reachable. That is what flattening B costs: A·B goes to zero there, and the curvature that Schwarzschild keeps finite runs away as 1/(r − r_h)². A metric can agree with Schwarzschild about every clock rate and still be a completely different object.'
        : 'Tidal force at a horizon goes as <b>c⁶/G²M²</b>: it gets <i>gentler</i> for bigger holes, which is the opposite of most people\'s intuition. At 10 M☉ you are torn apart thousands of kilometres out; at Sgr A* you would cross in perfectly good health with about a minute of proper time left and no way to report any of it. Change the body picker without touching anything else and watch the verdict flip — the geometry in units of GM/c² is identical, and only the exchange rate into metres has moved.'}</p>
    </div>`;
  },

  chip(st){
    const F = st.F;
    if(!F) return `<div class="k">Falling in</div><div>no metric</div>`;
    const U = this.si(st);
    /* both rows name the radius they are AT: the chip once read "t = divergent"
       beside a plot caption saying the coordinate time was finite, and the two
       were talking about the horizon and the probe respectively */
    return `<div class="k">Falling in</div>
      <div style="color:var(--c-pos)">τ to r_h = ${F.falls ? fmtSig(F.tauH * U.sec, 4) + ' s' : '—'}</div>
      <div style="color:var(--c-grad)">t to r_h = ${F.rate && F.rate.simple ? 'no limit'
        : (Number.isFinite(F.tP) ? fmtSig(F.tP * U.sec, 4) + ' s' : '—')}</div>
      <div style="color:var(--c-neg)">tide at r_h ${Number.isFinite(F.tideH)
        ? fmtSig(Math.abs(F.tideH) * U.tide * 2 / 9.80665, 3) + ' g' : 'unbounded'}</div>`;
  },
  legend(st){
    const F = st && st.F;
    return [['var(--c-pos)', "the faller's proper time — finite"],
            ['var(--c-grad)', 'the coordinate clock, and the time each halving adds'],
            ['var(--c-warn)', 'the located horizon'],
            ['var(--c-neg)', 'the redshift of the signals they send'],
            ['var(--accent)', 'the ISCO'],
            ['var(--c-curl)', 'your probe radius']]
      .concat(F && F.geo ? [['var(--text)', 'route B — the same fall by RK4, told no constants']] : []);
  }
};

/* ---- 20 · gravitational waves ----------------------------------------------
   Spacetime itself, oscillating. Einstein derived them in 1916, doubted them in
   1936, and they were detected on 14 September 2015 by two instruments that had
   to measure a length change of one part in 10²¹. */
