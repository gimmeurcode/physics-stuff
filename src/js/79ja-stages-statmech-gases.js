/* ============================================================================
   
4zc - STATISTICAL MECHANICS: SPEEDS AND THE ISING TRANSITION
   Split out of 
79j-stages-statmech.js
 to keep each file under the ~600-line guidance
   in src/js/CLAUDE.md. Load order is unchanged: this file sorts immediately
   after its parent, and everything shares one script scope.
   ============================================================================ */


/* ------------------------------------------------------------------------- */
/* The masses worth putting a dispersion relation on. The proton is computed
   from the electron mass and the CODATA electron-to-proton ratio rather than
   quoted separately, so there is one measured number behind both. */
const SM_KIN_MASSES = [
  { s:'electron', m:SL_ME },
  { s:'proton',   m:SL_ME / AT_ME_MP },
  { s:'H₂',       m:smMass(2.016) },
  { s:'N₂',       m:smMass(28.014) },
  { s:'Ar',       m:smMass(39.948) },
  { s:'Xe',       m:smMass(131.29) }
];
const SM_DISPERSIONS = [
  ['p^2/(2*m)',                    'classical'],
  ['sqrt(p^2*c^2+m^2*c^4)-m*c^2',  'relativistic'],
  ['p*c',                          'ultra-relativistic'],
  ['p^4/(m^3*c^2)',                'quartic']
];

STAGES.smSpeed = {
  title:'How fast the molecules in this room are going',
  legend(st){
    if(st && st.own)
      return [['var(--c-grad)', 'the distribution your dispersion gives'],
              ['var(--c-neg)', 'the classical Maxwell curve, for comparison'],
              ['var(--c-warn)', 'most probable speed'],
              ['var(--c-curl)', 'average speed, and C/k against temperature'],
              ['var(--c-pos)', 'rms speed, and the two equipartition limits']];
    return [['var(--c-grad)', 'the speed distribution'],
            ['var(--c-neg)', 'the tail beyond the marker'],
            ['var(--c-warn)', 'most probable speed'],
            ['var(--c-curl)', 'average speed'],
            ['var(--c-pos)', 'rms speed']]; },
  dockLegend:true,
  enter(st, o){
    st.i = o.i || 2;
    st.T = o.T || 300;
    st.v = 400;
    st.own = !!o.own;
    st.disp = o.disp || 'p^2/(2*m)';
    st.mi = o.mi === undefined ? 4 : o.mi;
    st.dim = o.dim || 3;
  },
  drag:true,
  /* One report per (dispersion, mass, temperature, dimension). Each one runs
     half a dozen quadratures and a peak search, and `readout` runs four times
     a second. */
  kinOf(st){
    const key = st.disp + '|' + st.mi + '|' + st.T + '|' + st.dim;
    if(st._kk === key) return st._kd;
    st._kk = key;
    const eps = smDispFn(st.disp, () => NaN);
    const m = (SM_KIN_MASSES[st.mi] || SM_KIN_MASSES[4]).m;
    st._kd = { R:smKinetic(eps, m, st.T, st.dim), curve:smSpeedCurve(eps, m, st.T, st.dim, 220), m, eps };
    return st._kd;
  },
  /* And the heat capacity across six decades of temperature, which is where a
     relativistic gas shows what it is: C/k climbs from d/2 to d as kT passes
     mc². Computed from ⟨ε⟩ alone, so it is forty quadratures rather than forty
     full reports. */
  cCurveOf(st){
    const key = st.disp + '|' + st.mi + '|' + st.dim + '|' + fmtNum(Math.log10(st.T), 3);
    if(st._ck === key) return st._cd;
    st._ck = key;
    const eps = smDispFn(st.disp, () => NaN);
    const m = (SM_KIN_MASSES[st.mi] || SM_KIN_MASSES[4]).m;
    const x0 = Math.log10(st.T) - 3, x1 = Math.log10(st.T) + 3;
    const pts = [];
    let hi = 1e-9;
    for(let i = 0; i <= 40; i++){
      const x = x0 + (x1 - x0) * i / 40, T = Math.pow(10, x);
      const dT = T * 3e-3;
      const a = smKineticEnergy(eps, m, T - dT, st.dim, 200);
      const b = smKineticEnergy(eps, m, T + dT, st.dim, 200);
      const C = (a === null || b === null) ? NaN : (b - a) / (2 * dT) / SM_KB;
      pts.push({ x, C });
      if(Number.isFinite(C) && C > hi) hi = C;
    }
    st._cd = { pts, x0, x1, hi };
    return st._cd;
  },
  controlsOwn(){
    const st = ST;
    return ctSeg('spDp', st.disp, SM_DISPERSIONS) +
      fnHtml('spD', 'ε(p) =', st.disp, 'p, with m the mass and c the speed of light') +
      ctSeg('spMs', String(st.mi), SM_KIN_MASSES.map((g, i) => [String(i), g.s])) +
      ctlRow('log₁₀ T (K)', ctlSlider('spL', 1, 15, 0.02, +Math.log10(st.T).toFixed(3))) +
      ctlRow('dimensions', ctlSlider('spN', 1, 6, 1, st.dim)) +
      `<p class="help">The Maxwell distribution is not a law of nature — it is what
      <b>ε = p²/2m in three dimensions</b> gives. Write a different energy–momentum relation and the
      speed follows from it as the group velocity <b>v = dε/dp</b>, computed rather than assumed.</p>
      <p class="help">Then equipartition is tested in the only form that survives: <b>⟨p·dε/dp⟩ =
      d·kT</b>, which an integration by parts makes exact for any ε that grows. The heat capacity is
      measured as d⟨ε⟩/dT and separately predicted as <b>d/n</b> from the power n <i>fitted</i> to
      your ε(p) — so a gas of photons (ε = pc) comes out at 3k, not 3k/2, and a relativistic gas is
      caught in the act of crossing between them.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('spM', st.own ? 'own' : 'gas',
                      [['gas', 'a gas from the list'], ['own', 'write your own dispersion relation']]);
    if(st.own) return seg + STAGES.smSpeed.controlsOwn();
    return seg + ctSeg('spI', String(st.i), SM_GASES.map((g, i) => [String(i), g.s])) +
      ctlRow('T (K)', ctlSlider('spT', 20, 2000, 1, st.T)) +
      `<p class="help">The distribution is <b>derived</b>, not drawn: a Boltzmann factor in the
      kinetic energy, multiplied by the 4πv² of velocity space. That geometric factor is why the
      curve starts at zero — there is exactly one way to have zero speed and a great many ways to
      have a large one.</p>
      <p class="help"><b>Drag</b> to read the fraction of molecules faster than any speed. The
      panel also integrates the distribution to obtain the average and rms speeds, and prints them
      beside the closed forms.</p>`;
  },
  wire(){
    ctWireSeg('spM', v => { ST.own = (v === 'own'); });
    ctWireSeg('spI', v => { ST.i = +v; });
    wireSlider('spT', () => ST.T, v => { ST.T = Math.round(v); }, v => Math.round(+v) + ' K');
    if(!ST.own) return;
    ctWireSeg('spDp', v => { ST.disp = v; });
    ctWireSeg('spMs', v => { ST.mi = +v; });
    fnWire('spD', (m, s) => { ST.disp = s; }, smDispBuild);
    wireSlider('spL', () => Math.log10(ST.T), v => { ST.T = Math.pow(10, v); },
               v => fmtNum(Math.pow(10, +v), 4) + ' K');
    wireSlider('spN', () => ST.dim, v => { ST.dim = Math.max(1, Math.round(v)); },
               v => Math.round(+v) + (Math.round(+v) === 1 ? ' dimension' : ' dimensions'));
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.v = Math.max(0, st.P.invX(sx));
  },
  frameOwn(st, dt, ctx, W, H){
    const K = STAGES.smSpeed.kinOf(st);
    const px = 78, top = 84;
    const aw = Math.max(60, W - px - 92), ah = Math.max(60, H - top - 88);
    if(!K.R.ok){
      const P = mkPlot(px, top, aw, ah, 0, 1, 0, 1);
      plotFrame(ctx, P, '', '', 'this dispersion has no distribution');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 - 8, 'ε(p) will not do',
             rgbCss(TH.neg), '600 14px ' + FONT_UI, 'center');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 16,
             String(K.R.why || '').replace(/<[^>]*>/g, '').slice(0, 110),
             rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
      return;
    }
    const R = K.R, C = STAGES.smSpeed.cCurveOf(st);
    const wide = W >= 840 && aw >= 500;
    const gapPx = wide ? 64 : 54;
    const bw = wide ? (aw - gapPx) / 2 : aw;
    const bh = wide ? ah : (ah >= 330 ? (ah - gapPx) / 2 : ah);
    /* The distribution itself, on a window taken from where it actually has
       weight. A relativistic gas well above mc² lives in the last percent of
       the range up to c, and drawn from zero it is a spike against the frame.
       The window is snapped back to the origin whenever the low tail is
       anywhere near it, so the classical case still starts at rest. */
    const cur = K.curve;
    const full = (cur.ok ? cur.xmax : 1) * 1.03;
    let xlo = 0, xhi = full;
    if(cur.ok){
      const live = cur.pts.filter(q => q.g >= 0.002);
      if(live.length){
        const a = live[0].x, b = live[live.length - 1].x;
        const pad = Math.max((b - a) * 0.12, full * 1e-6);
        xlo = a - pad < 0.15 * b ? 0 : a - pad;
        xhi = Math.min(full, b + pad);
      }
    }
    const P = mkPlot(px, top, bw, bh, xlo, xhi, 0, 1.2);
    st.P = P;
    /* a title on the left column has to clear the readout chip, which floats
       over the canvas's top-left corner — so it is kept short */
    plotFrame(ctx, P, cur.mode === 'v' ? 'speed (m/s)' : 'momentum (kg·m/s)',
              'relative probability',
              cur.mode === 'v' ? 'the speed distribution' : 'one speed for everything');
    ctGrid(ctx, P);
    if(cur.ok) ctPath(ctx, P, cur.pts.map(q => ({ x:q.x, y:q.g })), rgbCss(TH.grad), 2.8);
    /* the classical gas at the same mass and temperature, for comparison */
    if(cur.mode === 'v' && st.dim === 3){
      /* the classical gas at the same mass and temperature. Its own peak is the
         scale, so it is comparable even when — as for a hot electron gas — the
         Maxwell curve puts most of its weight past the speed of light and the
         window can only show its foot */
      let top2 = 1e-300;
      const mx = [];
      for(let i = 0; i <= 220; i++){
        const v = full * i / 220, f = smMaxwell(v, K.m, st.T);
        mx.push({ x:v, y:f });
        if(f > top2) top2 = f;
      }
      ctPath(ctx, P, mx.map(q => ({ x:q.x, y:q.y / top2 })), rgbCss(TH.neg), 2, [5, 4]);
      ctText(ctx, P.px + 10, P.py + 32, 'classical ½mv², dashed', rgbCss(TH.neg), '11px ' + FONT_UI);
    }
    if(cur.mode === 'v'){
      const marks = [[R.vMode, 'most probable', TH.warn], [R.vAvg, 'average', TH.curl],
                     [R.vRms, 'rms', TH.pos]];
      marks.forEach(([v, lab, col], i) => {
        if(!Number.isFinite(v) || v > P.x1 || v < P.x0) return;
        ctPath(ctx, P, [{ x:v, y:0 }, { x:v, y:1.12 - i * 0.09 }], rgbCss(col), 2, [5, 4]);
        ctText(ctx, P.X(v) + 5, P.Y(1.12 - i * 0.09) - 4, lab, rgbCss(col), '11px ' + FONT_UI);
      });
    }
    /* the heat capacity across six decades */
    const Q0 = wide ? mkPlot(px + bw + gapPx, top, bw, bh, 0, 1, 0, 1)
                    : (ah >= 330 ? mkPlot(px, top + bh + gapPx, aw, bh, 0, 1, 0, 1) : null);
    if(!Q0){
      stageNote(ctx, 'the group velocity v = dε/dp is computed, so the speed follows from the ' +
                     'energy rather than being assumed proportional to the momentum', W, H);
      return;
    }
    const Q = mkPlot(Q0.px, Q0.py, Q0.pw, Q0.ph, C.x0, C.x1, 0, Math.max(st.dim, C.hi) * 1.2);
    plotFrame(ctx, Q, 'log₁₀ of the temperature (K)', 'heat capacity C/k',
              'measured as d⟨ε⟩/dT — the two dashed lines are d/2 and d');
    ctGrid(ctx, Q, 1);
    ctPath(ctx, Q, [{ x:C.x0, y:st.dim / 2 }, { x:C.x1, y:st.dim / 2 }], rgbCss(TH.pos), 1.6, [6, 4]);
    ctPath(ctx, Q, [{ x:C.x0, y:st.dim }, { x:C.x1, y:st.dim }], rgbCss(TH.pos), 1.6, [6, 4]);
    ctText(ctx, Q.px + 8, Q.Y(st.dim / 2) - 5, 'd/2 — quadratic ε', rgbCss(TH.pos), '11px ' + FONT_UI);
    ctText(ctx, Q.px + 8, Q.Y(st.dim) - 5, 'd — linear ε', rgbCss(TH.pos), '11px ' + FONT_UI);
    ctPath(ctx, Q, C.pts.filter(p => Number.isFinite(p.C)), rgbCss(TH.curl), 2.8);
    const lt = Math.min(C.x1, Math.max(C.x0, Math.log10(st.T)));
    ctPath(ctx, Q, [{ x:lt, y:0 }, { x:lt, y:Math.max(st.dim, C.hi) * 1.2 }], rgbCss(TH.warn), 2, [4, 3]);
    ctDot(ctx, Q, lt, R.Cok, 4.6, rgbCss(TH.warn), rgbCss(TH.bg));
    stageNote(ctx, 'C/k is measured by differentiating the integrated mean energy, and predicted ' +
                   'separately as d ÷ (the power fitted to your ε) — both are in the panel', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.smSpeed.frameOwn(st, dt, ctx, W, H);
    const G = SM_GASES[st.i], m = smMass(G.M);
    const vmax = smVrms(m, st.T) * 2.6;
    let peak = 1e-30;
    for(let i = 0; i <= 200; i++) peak = Math.max(peak, smMaxwell(vmax * i / 200, m, st.T));
    const P = mkPlot(80, 55, W - 170, H - 145, 0, vmax, 0, peak * 1.2);
    st.P = P;
    plotFrame(ctx, P, 'speed (m/s)', 'probability density',
              G.s + ' at ' + st.T + ' K — the shaded tail is what you dragged to');
    ctGrid(ctx, P);

    /* the tail beyond the marker — the fraction that matters for reaction rates */
    ctx.beginPath(); ctx.moveTo(P.X(Math.min(st.v, vmax)), P.Y(0));
    for(let i = 0; i <= 300; i++){
      const v = Math.min(st.v, vmax) + (vmax - Math.min(st.v, vmax)) * i / 300;
      ctx.lineTo(P.X(v), P.Y(smMaxwell(v, m, st.T)));
    }
    ctx.lineTo(P.X(vmax), P.Y(0)); ctx.closePath();
    ctx.fillStyle = rgbCss(TH.neg, 0.25); ctx.fill();
    plotCurve(ctx, P, v => smMaxwell(v, m, st.T), 500, rgbCss(TH.grad), 2.8);

    /* the three characteristic speeds — they are genuinely different numbers */
    const marks = [[smVmp(m, st.T), 'most probable', TH.warn],
                   [smVavg(m, st.T), 'average', TH.curl],
                   [smVrms(m, st.T), 'rms', TH.pos]];
    marks.forEach(([v, lab, col], i) => {
      ctPath(ctx, P, [{ x:v, y:0 }, { x:v, y:peak * (1.1 - i * 0.08) }], rgbCss(col), 2, [5, 4]);
      ctText(ctx, P.X(v) + 5, P.Y(peak * (1.1 - i * 0.08)) - 4, lab, rgbCss(col), '11px ' + FONT_UI);
    });
    probeLine(ctx, P, st.v, fmtNum(st.v, 0) + ' m/s');
    stageNote(ctx, 'the three speeds differ because the distribution is skewed — mean, mode and rms of an asymmetric curve never coincide', W, H);
  },
  deriveOwn(st){
    const K = STAGES.smSpeed.kinOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 6) : 'not defined here');
    if(!K.R.ok) return {
      title:'This dispersion has no distribution',
      steps:[drvSay('what went wrong', String(K.R.why || '').replace(/<[^>]*>/g, '') +
        '. Everything below is a ratio of two integrals over e^(−ε(p)/kT), so nothing is computed until those integrals exist.')],
      note:'Write ε as a function of p. The mass is m and the speed of light is c, so sqrt(p^2*c^2+m^2*c^4)-m*c^2 is a thing you can type.'
    };
    const R = K.R, mass = SM_KIN_MASSES[st.mi] || SM_KIN_MASSES[4];
    return {
      title:'What the Maxwell distribution assumed, and what happens without it',
      steps:[
        drvStep('the states are counted in momentum space, in d dimensions',
          `d^${dv('d')}${dv('p')} ${dop('∝')} ${dv('p')}^(${dv('d')}−1) d${dv('p')}`,
          `d = ${st.dim}, so the shell factor is p^${st.dim - 1}`),
        drvStep('and weighted by the Boltzmann factor in YOUR energy',
          `${dv('f')}(${dv('p')}) ${dop('∝')} ${dv('p')}^(${dv('d')}−1) ${dop('e')}^(−ε(${dv('p')})/${dv('k')}${dv('T')}) , &nbsp; ε ${dop('=')} ${pkPretty(st.disp)}`,
          `${mass.s} at ${fmtNum(st.T, 5)} K, kT = ${R.kT.toExponential(4)} J`),
        drvSay('the speed is now something to be computed',
          'For ε = p²/2m the speed is p/m and nobody separates the two. In general the speed is the group velocity v = dε/dp, and it is what this panel differentiates the dispersion to get. For ε = pc it is c at every momentum — every particle moves at the same speed and the speed distribution collapses to a spike, which is why a photon gas has no Maxwell curve.'),
        drvStep('the most probable speed carries a Jacobian',
          `${dv('g')}(${dv('v')}) ${dop('=')} ${dv('f')}(${dv('p')}) ${dfrac('d' + dv('p'), 'd' + dv('v'))} , &nbsp; ${dfrac('d' + dv('p'), 'd' + dv('v'))} ${dop('=')} 1/ε″(${dv('p')})`,
          Number.isFinite(R.vMode) ? `v_mp = ${n(R.vMode)} m/s` : 'no interior mode — ε has no curvature'),
        drvStep('equipartition, in the form that survives a general ε',
          `⟨${dv('p')} ${dfrac('dε', 'd' + dv('p'))}⟩ ${dop('=')} ${dv('d')}·${dv('k')}${dv('T')}`,
          `integrated: ${R.virial.toExponential(6)} J against d·kT = ${R.dkT.toExponential(6)} J — ratio ${n(R.equip)}`),
        drvSay('and that identity is exact, by one integration by parts',
          'Write p^d·d/dp[e^(−βε)] and integrate by parts: the boundary term dies because the weight does, and what is left is d/β times the normalisation. So the ratio above is not a physical result that might come out near 1 — it is 1, and any departure measures the quadrature. That is why it is worth printing to eight figures.'),
        drvStep('the mean energy that follows',
          `⟨ε⟩ ${dop('=')} ∫ ε ${dv('f')} d${dv('p')} ${dop('/')} ∫ ${dv('f')} d${dv('p')}`,
          `${R.eAvg.toExponential(6)} J, which is ${n(R.eAvg / R.kT)} kT`),
        drvStep('the heat capacity, measured',
          `${dv('C')} ${dop('=')} ${dfrac('d⟨ε⟩', 'd' + dv('T'))}`,
          `${n(R.Cok)} k`),
        drvStep('and predicted, from the power fitted to your dispersion',
          `ε ${dop('∝')} ${dv('p')}^${dv('n')} ${dop('⇒')} ${dv('C')} ${dop('=')} ${dfrac(dv('d'), dv('n'))}${dv('k')}`,
          `n fitted as ${n(R.n)} with residual ${R.fitResid.toExponential(2)}, so d/n = ${n(R.CokPred)}`),
        drvSay(R.fitResid < 1e-4
          ? 'your dispersion is a power law, and the two agree'
          : 'your dispersion is NOT a power law, and the residual says so',
          R.fitResid < 1e-4
            ? 'A Hamiltonian homogeneous of degree n in each momentum contributes k/n per degree of freedom — the generalisation of ½k that the quadratic case hides. Quadratic gives d/2, linear gives d, and quartic gives d/4. All three are reachable from the box above.'
            : 'A relativistic dispersion is quadratic at small p and linear at large p, so no single exponent fits it and the residual of the fit is the honest signal of that. The heat capacity is then somewhere between d/2 and d, and it moves with temperature — which is the crossover drawn on the right, and the reason a relativistic gas has an adiabatic index that is not constant.'),
        drvStep('and the classical case comes back exactly',
          `${dv('v')}_avg ${dop('=')} √(${dfrac('8' + dv('k') + dv('T'), 'π' + dv('m'))})`,
          `smVavg gives ${n(R.vavgClassic)} m/s; this quadrature gives ${n(R.vAvg)} m/s`)
      ],
      note:'Every number here came from ε(p) and the dimension. The three speeds, their fixed ratio and the 3k/2 of a monatomic gas are not properties of gases — they are properties of a quadratic dispersion in three dimensions, and they move the moment either changes.'
    };
  },
  derive(st){
    if(st.own) return STAGES.smSpeed.deriveOwn(st);
    const G = SM_GASES[st.i], m = smMass(G.M);
    const M = smSpeedMoments(m, st.T);
    const n = v => fmtNum(v, 6);
    return {
      title:'Building the speed distribution from the Boltzmann factor',
      steps:[
        drvStep('the Boltzmann factor in the kinetic energy',
          `${dv('P')}(${dv('v')}⃗) ${dop('∝')} ${dop('e')}^(−${dv('m')}${dv('v')}²/2${dv('k')}${dv('T')})`,
          'each velocity component independently, and the energy is the sum of squares'),
        drvSay('that is the distribution over velocity vectors, not over speeds',
          'The expression above peaks at v = 0: the single most likely velocity vector is standing still. But we rarely want the vector — we want the speed. Converting between the two is where the interesting factor comes from.'),
        drvStep('collect all vectors with the same magnitude',
          `d³${dv('v')} ${dop('=')} 4π${dv('v')}² d${dv('v')}`,
          'the surface area of a sphere of radius v in velocity space'),
        drvSay('and this is why nothing is at rest',
          'There is only one way to have zero speed, and an ever-larger shell of ways to have a big one. Multiplying a decreasing exponential by an increasing v² gives a peak at neither end — the competition between them is the entire shape of the curve.'),
        drvStep('so the speed distribution is',
          `${dv('f')}(${dv('v')}) ${dop('=')} 4π${dv('v')}²(${dfrac(dv('m'), '2π' + dv('k') + dv('T'))})^(3/2)${dop('e')}^(−${dv('m')}${dv('v')}²/2${dv('k')}${dv('T')})`,
          `it integrates to ${n(M.total)} — it must be 1, and it is`),
        drvStep('the peak, by setting the derivative to zero',
          `${dv('v')}_mp ${dop('=')} √(${dfrac('2' + dv('k') + dv('T'), dv('m'))})`,
          `${n(smVmp(m, st.T))} m/s`),
        drvStep('the mean, by integrating v·f',
          `${dv('v')}_avg ${dop('=')} √(${dfrac('8' + dv('k') + dv('T'), 'π' + dv('m'))})`,
          `closed form ${n(smVavg(m, st.T))}, integrated ${n(M.avg)}`),
        drvStep('the rms, by integrating v²f',
          `${dv('v')}_rms ${dop('=')} √(${dfrac('3' + dv('k') + dv('T'), dv('m'))})`,
          `closed form ${n(smVrms(m, st.T))}, integrated ${n(M.rms)}`),
        drvSay('the three are always in the same ratio',
          'v_mp : v_avg : v_rms = √2 : √(8/π) : √3, which is 1 : 1.128 : 1.225 for every gas at every temperature. They differ because the distribution has a long tail to the right, and a long tail pulls the mean above the mode and the rms above the mean. Quoting "the speed of the molecules" without saying which one is ambiguous by about 20%.'),
        drvStep('and the rms speed recovers equipartition exactly',
          `½${dv('m')}${dv('v')}_rms² ${dop('=')} ${dfrac('3', '2')}${dv('k')}${dv('T')}`,
          `${n(0.5 * m * smVrms(m, st.T) * smVrms(m, st.T) / 1.380649e-23 / st.T)} — should be 1.5`),
        drvSay('why the distribution rises from zero rather than peaking there',
          'The Boltzmann factor e^(−mv²/2kT) is largest at v = 0, so on energy grounds alone the most likely speed would be nothing at all. What stops that is the v² in front: it counts how many <b>directions</b> a speed can point, and a sphere of radius v has area 4πv². Zero speed is one state; a speed of 300 m/s is an enormous number of them. The peak is a competition between the exponential wanting slow and the geometry wanting fast, which is why v_mp depends on √(kT/m) rather than being at either extreme.'),
        drvSay('and the tail is small but decides most of chemistry',
          'The fraction of molecules above some threshold energy falls off like e^(−E/kT), so a modest rise in temperature multiplies it. At room temperature raising T by 10 K can double the number of molecules able to clear a typical activation barrier — which is the Arrhenius law, and the reason reactions speed up so sharply with heat. It is also why hydrogen escapes the Earth\'s atmosphere and nitrogen does not: what matters is not the average speed but the thin tail above escape velocity.')
      ],
      note:'The heavy tail is out of all proportion to its size. Chemical reaction rates depend on the fraction of molecules above an activation energy, and because that fraction is exponential in E/kT, a 10 K rise near room temperature can double a reaction rate while barely moving the average speed at all.'
    };
  },
  readoutOwn(st){
    const K = STAGES.smSpeed.kinOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 6 : d) : 'not defined here');
    if(!K.R.ok) return `<div class="card tight"><div class="ttl">This dispersion has no distribution</div>
      ${kv('', esc(String(K.R.why || '')))}
      <p class="help">Write ε as a function of <b>p</b>. The mass is <b>m</b> and the speed of light is
      <b>c</b>, so <b>sqrt(p^2*c^2+m^2*c^4)-m*c^2</b> is a legal thing to type. The energy has to
      increase with momentum, or there is no Boltzmann weight that falls and nothing to normalise.</p>
    </div>`;
    const R = K.R, mass = SM_KIN_MASSES[st.mi] || SM_KIN_MASSES[4];
    return `<div class="card tight"><div class="ttl">${esc(mass.s)} at ${fmtNum(st.T, 5)} K, in ${st.dim} dimensions</div>
      ${kv('ε(p)', pkPretty(st.disp))}
      ${kv('mass', R.m.toExponential(5) + ' kg')}
      ${kv('kT', R.kT.toExponential(5) + ' J')}
      ${kv('⟨ε⟩', R.eAvg.toExponential(5) + ' J')}
      ${kv('⟨ε⟩ ÷ kT', n(R.eAvg / R.kT))}
      ${kv('momentum cut-off, found by bisection', R.pMax.toExponential(4) + ' kg·m/s')}
      <p class="help">The cut-off is the momentum at which ε has risen by 60 kT — located rather than
      guessed, so the same code handles a quadratic dispersion and one that grows like the fourth
      power without either being told what scale to expect.</p>
    </div>
    <div class="card tight"><div class="ttl">Equipartition, tested</div>
      ${kv('⟨p·dε/dp⟩, integrated', R.virial.toExponential(8) + ' J')}
      ${kv('d·kT', R.dkT.toExponential(8) + ' J')}
      ${kv('ratio', n(R.equip, 9))}
      ${kv('departure from 1', fmtAgree(R.equip, 1))}
      <p class="help">One integration by parts makes this identity <b>exact</b> for any ε that grows,
      in any dimension — so the number above is not a physical result that happens to be near 1. It is
      1, and what you see is the quadrature error. The familiar ½kT per quadratic degree of freedom is
      the special case ε ∝ p², and this is the statement it is a special case of.</p>
    </div>
    <div class="card tight"><div class="ttl">The heat capacity, two ways</div>
      ${kv('C, measured as d⟨ε⟩/dT', n(R.Cok, 6) + ' k')}
      ${kv('the power n, fitted to ε(p)', n(R.n, 6))}
      ${kv('residual of that fit', fmtSig(R.fitResid, 3) + ' in ln ε')}
      ${kv('so d/n predicts', n(R.CokPred, 6) + ' k')}
      ${kv('they differ by', Number.isFinite(R.CokPred) ? fmtNum(100 * Math.abs(R.Cok - R.CokPred) / Math.max(1e-12, R.CokPred), 4) + '%' : '—')}
      <p class="help">${R.fitResid < 1e-4
        ? 'The fit residual is tiny, so your dispersion really is a power law, and the generalised equipartition result C = (d/n)k holds: a Hamiltonian homogeneous of degree n contributes k/n per momentum component. Quadratic gives d/2 — the 3k/2 of a monatomic gas — and linear gives d, which is why a photon gas has 3k.'
        : 'The residual is <b>' + R.fitResid.toExponential(2) + '</b>, which says your ε(p) is not a single power law at all. A relativistic dispersion is quadratic at low momentum and linear at high, so the heat capacity sits between d/2 and d and moves with temperature. That crossover is the curve on the right, and it is why a relativistic gas has no fixed adiabatic index.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The three speeds, from your dispersion</div>
      ${kv('most probable', Number.isFinite(R.vMode) ? n(R.vMode) + ' m/s' : 'no interior mode — ε has no curvature')}
      ${kv('average ⟨v⟩', n(R.vAvg) + ' m/s')}
      ${kv('rms', n(R.vRms) + ' m/s')}
      ${kv('fastest at the cut-off', n(R.vMax) + ' m/s')}
      ${kv('rms ÷ average', n(R.vRms / Math.max(1e-30, R.vAvg), 6))}
      ${kv('the classical gas would give', n(R.vavgClassic) + ' m/s average')}
      ${kv('...and', n(R.vrmsClassic) + ' m/s rms')}
      <p class="help">${st.disp.replace(/\s+/g, '') === 'p^2/(2*m)' && st.dim === 3
        ? 'With ε = p²/2m in three dimensions these reproduce <b>smVmp</b>, <b>smVavg</b> and <b>smVrms</b> — the closed forms the preset stage uses — to six figures, including the Jacobian in the most probable speed. That agreement is the anchor: the general machinery is only worth reading because it returns the known answer in the known case.'
        : 'The ratio 1 : 1.128 : 1.225 belongs to a quadratic dispersion in three dimensions and to nothing else. Yours gives rms ÷ average = ' + fmtNum(R.vRms / Math.max(1e-30, R.vAvg), 5) + ', against 1.085 for the classical gas. Switch the box back to <b>p^2/(2*m)</b> with three dimensions and the classical numbers come back exactly.'}</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.smSpeed.readoutOwn(st);
    const G = SM_GASES[st.i], m = smMass(G.M);
    const M = smSpeedMoments(m, st.T);
    const n = v => fmtNum(v, 6);
    /* fraction above the marker, by integrating the tail */
    let tail = 0, tot = 0;
    const vm = smVrms(m, st.T) * 6, N = 3000, h = vm / N;
    for(let i = 0; i <= N; i++){
      const v = i * h, w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
      const f = smMaxwell(v, m, st.T) * w;
      tot += f; if(v >= st.v) tail += f;
    }
    const frac = tail / tot;
    return `<div class="card tight"><div class="ttl">${G.s} at ${st.T} K</div>
      ${kv('molar mass', G.M + ' g/mol')}
      ${kv('most probable speed', n(smVmp(m, st.T)) + ' m/s')}
      ${kv('average speed', n(smVavg(m, st.T)) + ' m/s')}
      ${kv('rms speed', n(smVrms(m, st.T)) + ' m/s')}
      ${kv('average, by integration', n(M.avg) + ' m/s')}
      ${kv('rms, by integration', n(M.rms) + ' m/s')}
      <p class="help">The closed forms and the integrals agree to six figures. The three speeds
      themselves are genuinely different numbers — always in the ratio 1 : 1.128 : 1.225, whatever
      the gas and whatever the temperature.</p>
    </div>
    <div class="card tight"><div class="ttl">Above ${fmtNum(st.v, 0)} m/s</div>
      ${kv('fraction of molecules', frac < 1e-4 ? frac.toExponential(4) : n(frac))}
      ${kv('as a percentage', frac < 1e-6 ? frac.toExponential(3) + '%' : fmtNum(100 * frac, 5) + '%')}
      ${kv('in a mole, that is', (frac * SM_NA).toExponential(4) + ' molecules')}
      ${kv('speed ÷ most probable', fmtNum(st.v / smVmp(m, st.T), 4))}
      <p class="help">Drag well out into the tail and the fraction collapses by orders of magnitude
      for each step. Yet a mole is 6 × 10²³, so even a fraction of 10⁻¹⁵ still leaves hundreds of
      millions of molecules — which is why slow reactions happen at all.</p>
    </div>
    <div class="card tight"><div class="ttl">Escape velocity, and why the Moon has no air</div>
      ${kv('Earth escape speed', '11 200 m/s')}
      ${kv('this gas, rms', n(smVrms(m, st.T)) + ' m/s')}
      ${kv('ratio', fmtNum(11200 / smVrms(m, st.T), 3) + '×')}
      ${kv('Moon escape speed', '2 380 m/s')}
      ${kv('ratio there', fmtNum(2380 / smVrms(m, st.T), 3) + '×')}
      <p class="help">A planet keeps a gas if its escape speed is more than about six times the rms
      speed — the tail beyond that is thin enough to take longer than the age of the solar system to
      drain. Earth loses hydrogen and helium and keeps nitrogen; the Moon fails the test for
      everything.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const K = STAGES.smSpeed.kinOf(st);
      if(!K.R.ok) return `<div class="k">your dispersion</div><div style="color:var(--c-neg)">has no distribution</div>`;
      return `<div class="k">your ε(p), d = ${st.dim}</div>
        <div>C = ${fmtNum(K.R.Cok, 4)} k, fitted n = ${fmtNum(K.R.n, 4)}</div>
        <div>⟨p·dε/dp⟩ ÷ dkT = ${fmtNum(K.R.equip, 8)}</div>`;
    }
    const G = SM_GASES[st.i], m = smMass(G.M);
    return `<div class="k">${G.s} at ${st.T} K</div><div>v_rms = ${fmtNum(smVrms(m, st.T), 0)} m/s</div>`;
  }
};

/* ------------------------------------------------------------------------- */
STAGES.smIsing = {
  title:'A phase transition, found rather than asserted',
  legend(st){
    if(st && st.own)
      return [['var(--c-grad)', 'spins up, and the specific heat measured at each temperature'],
              ['var(--c-neg)', 'spins down, and the susceptibility'],
              ['var(--c-warn)', 'the exact Tc for YOUR couplings'],
              ['var(--c-pos)', 'where the simulation put the peak'],
              ['var(--text)', 'the temperature the lattice is running at']];
    return [['var(--c-grad)', 'spins up, and the measured |m|'],
            ['var(--c-neg)', 'spins down'],
            ['var(--c-curl)', "Onsager's exact solution"],
            ['var(--c-warn)', 'Tc = 2.269 J/k']]; },
  dockLegend:true,
  enter(st, o){
    st.L = o.L || 48;
    st.T = o.T || 2.27;
    st.J = 1;
    st.h = 0;
    st.s = smIsingInit(st.L, true);
    st.run = true;
    st.hist = [];
    st.own = !!o.own;
    st.sheet = o.sheet || 'Jx   1\nJy   0.4\nh    0\nL    24\nseed 7';
    st.sheetErr = '';
  },
  /* One scan is some two million spin flips, so it happens when the sheet
     changes and not before. The anisotropy sweep beside it is four more scans
     on a smaller lattice, which is what turns one number into the curve the
     exact criterion draws. */
  scanOf(st){
    if(st._sk === st.sheet) return st._sd;
    st._sk = st.sheet;
    const P = smParseIsing(st.sheet);
    if(!P.ok){ st._sd = { ok:false, P }; return st._sd; }
    const M = P.M;
    const ex = smIsingTcExact(M.jx, M.jy);
    /* a window around wherever the transition is — or, if there is none, around
       the coupling scale, so a one-dimensional chain still shows its smooth
       fluctuation peak and the absence of a divergence */
    const mid = ex > 0 ? ex : Math.max(M.jx, M.jy);
    /* The lattice the SCAN runs on is capped well below the one being animated:
       fifteen temperatures at four hundred measurement sweeps each is already
       several million spin flips, and it all happens synchronously the moment
       the sheet changes. The located peak barely moves between L = 20 and
       L = 28 — the finite-size shift is a percent — while the cost goes as L². */
    const S = smIsingScan(M.jx, M.jy, M.h, Math.min(M.l, 22), mid * 0.72, mid * 1.42,
                          15, 110, 400, M.seed);
    /* the same measurement at three anisotropies, against the exact curve */
    const sweep = [];
    for(const r of [1, 0.5, 0.15]){
      const jy = M.jx * r;
      const e2 = smIsingTcExact(M.jx, jy);
      const mid2 = e2 > 0 ? e2 : M.jx;
      const s2 = smIsingScan(M.jx, jy, 0, 14, mid2 * 0.72, mid2 * 1.42, 9, 80, 260, M.seed + 11);
      sweep.push({ r, jy, exact:e2, found:s2.TcC, rel:s2.relC });
    }
    st._sd = { ok:true, P, M, S, ex, sweep };
    return st._sd;
  },
  controlsOwn(){
    const st = ST;
    return `<div class="fld" style="align-items:stretch">
        <textarea id="siSheet" rows="6" spellcheck="false" autocomplete="off"
          aria-label="a lattice sheet — one property per line: name then number"
          data-audit="Jx 1&#10;Jy 0.15&#10;h 0&#10;L 20&#10;seed 5"
          style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
      </div>
      <div class="row wrap">${ctBtn('siGo', 'Scan it')}</div>
      <p class="help" id="siMsg" style="color:${st.sheetErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.sheetErr ||
        'One property per line. <b>Jx</b> couples along the rows and <b>Jy</b> along the columns, ' +
        '<b>h</b> is an external field, <b>L</b> the side of the lattice and <b>seed</b> the random ' +
        'seed — the same seed gives the same numbers twice, so a difference means something.'}</p>` +
      ctlRow('T (J/k)', ctlSlider('siT', 0.4, 5, 0.01, st.T)) +
      ctBtn('siG', st.run ? 'pause' : 'run') + ctBtn('siR', 'randomise') +
      `<p class="help">The anisotropic square lattice is <b>also</b> exactly solved:
      sinh(2J<sub>x</sub>/kT<sub>c</sub>)·sinh(2J<sub>y</sub>/kT<sub>c</sub>) = 1. Set J<sub>y</sub> = 0
      and the left-hand side can never reach 1 at any positive temperature — which is the
      one-dimensional chain, and the reason it never orders.</p>
      <p class="help">The simulation is told none of that. It measures the specific heat as an
      <b>energy fluctuation</b> and the susceptibility as a <b>magnetisation fluctuation</b> at
      thirteen temperatures, and their peaks are located by parabolic interpolation. The criterion is
      solved separately by bisection, and the gap between the two is printed — a finite lattice puts
      its peak a few percent high, and that shift is real physics.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('siM', st.own ? 'own' : 'square',
                      [['square', 'the isotropic square lattice'], ['own', 'write your own lattice']]);
    if(st.own) return seg + STAGES.smIsing.controlsOwn();
    return seg + ctlRow('T (J/k)', ctlSlider('siT', 0.4, 5, 0.01, st.T)) +
      ctlRow('field h', ctlSlider('siH', -1, 1, 0.01, st.h)) +
      ctBtn('siG', st.run ? 'pause' : 'run') + ctBtn('siR', 'randomise') +
      ctBtn('siC', 'cool to T = 1.5') + ctBtn('siW', 'warm to T = 3.5') +
      `<p class="help">Every spin wants to agree with its four neighbours; temperature keeps
      flipping them at random. Nothing in the rules says anything about a transition — the update is
      one line, applied to one spin at a time.</p>
      <p class="help">Yet below a sharp temperature the whole lattice orders, and above it the order
      vanishes. Onsager solved this exactly in 1944 and found <b>T<sub>c</sub> = 2/ln(1+√2) =
      2.2692</b>. Cool slowly through that value and watch the domains appear.</p>`;
  },
  wire(){
    ctWireSeg('siM', v => { ST.own = (v === 'own'); });
    wireSlider('siT', () => ST.T, v => { ST.T = v; }, v => fmtNum(+v, 2));
    wireSlider('siH', () => ST.h, v => { ST.h = v; }, v => fmtNum(+v, 2));
    ctWireBtn('siG', () => { ST.run = !ST.run; buildStagePanel(); });
    ctWireBtn('siR', () => { ST.s = smIsingInit(ST.L, true); ST.hist = []; });
    ctWireBtn('siC', () => { ST.T = 1.5; buildStagePanel(); });
    ctWireBtn('siW', () => { ST.T = 3.5; buildStagePanel(); });
    if(!ST.own) return;
    const apply = () => {
      const box = $('siSheet'); if(!box) return;
      ST.sheet = box.value;
      const D = STAGES.smIsing.scanOf(ST);
      ST.sheetErr = D.ok ? '' :
        '⚠ ' + D.P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
        '<br><span style="color:var(--faint)">The previous lattice is still shown.</span>';
      if(D.ok){ ST.L = D.M.l; ST.s = smIsingInitR(D.M.l, true, smRng(D.M.seed)); ST.hist = []; }
      const msg = $('siMsg');
      if(msg){
        msg.innerHTML = ST.sheetErr || ('Scanned: exact Tc = ' +
          (D.ex > 0 ? fmtNum(D.ex, 5) : 'none at any positive temperature') +
          ', the simulation found ' + fmtNum(D.S.TcC, 5) + '.');
        msg.style.color = ST.sheetErr ? 'var(--c-neg)' : 'var(--faint)';
      }
      refreshStageReadout(); updateStageChip(); updateStageLegend();
    };
    const b = $('siSheet'); if(b) b.addEventListener('change', apply);
    const g = $('siGo'); if(g) g.addEventListener('click', apply);
  },
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.smIsing.scanOf(st);
    if(!D.ok){
      const P = mkPlot(78, 84, Math.max(60, W - 170), Math.max(60, H - 172), 0, 1, 0, 1);
      plotFrame(ctx, P, '', '', 'this lattice does not read');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 - 8, 'the sheet does not read',
             rgbCss(TH.neg), '600 14px ' + FONT_UI, 'center');
      const first = D.P.errs[0] ? D.P.errs[0].msg : '';
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 16, first.replace(/<[^>]*>/g, '').slice(0, 100),
             rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
      return;
    }
    const M = D.M, S = D.S;
    if(st.s.length !== M.l * M.l) st.s = smIsingInitR(M.l, true, smRng(M.seed));
    if(st.run) for(let k = 0; k < 3; k++) smIsingSweepA(st.s, M.l, st.T, M.jx, M.jy, M.h, Math.random);
    const O = smIsingObsA(st.s, M.l, M.jx, M.jy, M.h);
    /* the lattice, below the chip that floats over the top-left corner */
    const side = Math.min(H - 210, (W - 200) * 0.46);
    const x0 = 78, y0 = 128, cell = side / M.l;
    for(let i = 0; i < M.l; i++) for(let j = 0; j < M.l; j++){
      ctx.fillStyle = rgbCss(st.s[i * M.l + j] > 0 ? TH.grad : TH.neg, 0.9);
      const pxx = Math.round(x0 + j * cell), pyy = Math.round(y0 + i * cell);
      ctx.fillRect(pxx, pyy, Math.round(x0 + (j + 1) * cell) - pxx,
                             Math.round(y0 + (i + 1) * cell) - pyy);
    }
    ctx.strokeStyle = rgbCss(TH.line); ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, side, side);
    ctText(ctx, x0, y0 - 12, M.l + ' × ' + M.l + ', Jx = ' + fmtNum(M.jx, 3) + ', Jy = ' +
           fmtNum(M.jy, 3) + ', T = ' + fmtNum(st.T, 2) +
           (D.ex > 0 ? (st.T < D.ex ? '  (below your Tc)' : '  (above your Tc)') : '  (no transition exists)'),
           rgbCss(TH.dim), '12px ' + FONT_UI);
    /* the scan: specific heat and susceptibility, both normalised, with the
       exact criterion and the located peaks over them */
    const px2 = x0 + side + 76;
    const P = mkPlot(px2, 90, Math.max(80, W - px2 - 60), Math.max(80, side),
                     S.rows[0].T, S.rows[S.rows.length - 1].T, 0, 1.22);
    st.P = P;
    plotFrame(ctx, P, 'temperature (J/k)', 'fluctuation, each scaled to its own peak',
              'the transition, located from fluctuations alone');
    ctGrid(ctx, P);
    const cMax = Math.max(...S.rows.map(r => r.c)) || 1;
    const xMax = Math.max(...S.rows.map(r => r.chi)) || 1;
    ctPath(ctx, P, S.rows.map(r => ({ x:r.T, y:r.c / cMax })), rgbCss(TH.grad), 2.8);
    ctPath(ctx, P, S.rows.map(r => ({ x:r.T, y:r.chi / xMax })), rgbCss(TH.neg), 2.4, [5, 4]);
    for(const r of S.rows) ctDot(ctx, P, r.T, r.c / cMax, 3, rgbCss(TH.grad), rgbCss(TH.bg));
    if(D.ex > 0 && D.ex >= P.x0 && D.ex <= P.x1){
      ctPath(ctx, P, [{ x:D.ex, y:0 }, { x:D.ex, y:1.22 }], rgbCss(TH.warn), 2, [4, 3]);
      ctText(ctx, P.X(D.ex) + 6, P.py + 16, 'exact Tc = ' + fmtNum(D.ex, 5),
             rgbCss(TH.warn), '11px ' + FONT_UI);
    }
    if(S.TcC >= P.x0 && S.TcC <= P.x1){
      ctPath(ctx, P, [{ x:S.TcC, y:0 }, { x:S.TcC, y:1.1 }], rgbCss(TH.pos), 1.8);
      ctText(ctx, P.X(S.TcC) + 6, P.py + 32, 'found at ' + fmtNum(S.TcC, 5),
             rgbCss(TH.pos), '11px ' + FONT_UI);
    }
    if(st.T >= P.x0 && st.T <= P.x1)
      ctPath(ctx, P, [{ x:st.T, y:0 }, { x:st.T, y:1.22 }], rgbCss(TH.text, 0.45), 1.4);
    ctText(ctx, P.px + 10, P.py + P.ph - 22, 'specific heat, solid', rgbCss(TH.grad), '11px ' + FONT_UI);
    ctText(ctx, P.px + 10, P.py + P.ph - 8, 'susceptibility, dashed', rgbCss(TH.neg), '11px ' + FONT_UI);
    stageNote(ctx, 'the simulation is never told where the transition is — it measures two ' +
                   'fluctuations and the peaks appear', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.smIsing.frameOwn(st, dt, ctx, W, H);
    if(st.run) for(let k = 0; k < 3; k++) smIsingSweep(st.s, st.L, st.T, st.J, st.h);
    const O = smIsingObs(st.s, st.L, st.J, st.h);
    st.hist.push({ T:st.T, m:O.absm });
    if(st.hist.length > 400) st.hist.shift();

    /* The lattice, starting below the readout chip — which floats over the
       canvas's top-left corner and at y0 = 60 was covering this block's own
       caption. The height budget drops by the same amount it moved, so the
       bottom margin is unchanged. */
    const side = Math.min(H - 200, (W - 200) * 0.48);
    const x0 = 80, y0 = 128, cell = side / st.L;
    /* The lattice is one spin per pixel, blitted. One fillRect per site was
       L² rasterising calls a frame — 2 336 at the default 48×48, and this
       lattice really does change every frame, so there is nothing to cache:
       what goes is the canvas round trip, not the simulation.
       The blit tiles the sites exactly, which is what the whole-pixel rounding
       it replaces was for — overlapping cells double-composite at alpha 0.9
       and paint a grid over the spins. */
    const LB = ctHeatBuf(st.L), ld = LB.img.data;
    for(let i = 0; i < st.L; i++) for(let j = 0; j < st.L; j++){
      const c = st.s[i * st.L + j] > 0 ? TH.grad : TH.neg;
      const o = 4 * (i * st.L + j);
      ld[o] = c[0]; ld[o + 1] = c[1]; ld[o + 2] = c[2]; ld[o + 3] = 255;
    }
    LB.ctx.putImageData(LB.img, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(LB.cv, 0, 0, st.L, st.L, x0, y0, side, side);
    ctx.restore();
    ctx.strokeStyle = rgbCss(TH.line); ctx.lineWidth = 1;
    ctx.strokeRect(x0, y0, side, side);
    ctText(ctx,
           x0, y0 - 12, st.L + ' × ' + st.L + ' spins, T = ' + fmtNum(st.T, 2) +
           (st.T < SM_TC_2D ? '  (below Tc — ordered)' : '  (above Tc — disordered)'), rgbCss(TH.dim), '12px ' + FONT_UI);

    /* the magnetisation curve, with Onsager's exact answer over it */
    const P = mkPlot(x0 + side + 80, 60, W - (x0 + side + 80) - 60, side, 0.4, 5, 0, 1.05);
    plotFrame(ctx, P, 'temperature (J/k)', '|magnetisation|',
              'the order parameter, and where it dies');
    ctGrid(ctx, P);
    /* Onsager's exact spontaneous magnetisation below Tc */
    ctPath(ctx, P, Array.from({ length:200 }, (_, i) => {
      const T = 0.4 + (SM_TC_2D - 0.4) * i / 199;
      const s = Math.sinh(2 / T);
      return { x:T, y:Math.pow(Math.max(0, 1 - Math.pow(s, -4)), 0.125) };
    }), rgbCss(TH.curl), 2.4, [6, 4]);
    ctPath(ctx, P, [{ x:SM_TC_2D, y:0 }, { x:SM_TC_2D, y:1.05 }], rgbCss(TH.warn), 2, [4, 3]);
    ctText(ctx, P.X(SM_TC_2D) + 6, P.Y(1.0), 'Tc = ' + fmtNum(SM_TC_2D, 4), rgbCss(TH.warn), '12px ' + FONT_UI);
    /* what this simulation has actually measured */
    for(const p of st.hist){
      ctx.beginPath(); ctx.arc(P.X(p.T), P.Y(p.m), 2, 0, 7);
      ctx.fillStyle = rgbCss(TH.grad, 0.5); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(P.X(st.T), P.Y(O.absm), 6, 0, 7);
    ctx.fillStyle = rgbCss(TH.grad); ctx.fill();
    stageNote(ctx, 'purple dashed is Onsager\'s exact solution; the dots are what this simulation measured', W, H);
  },
  deriveOwn(st){
    const D = STAGES.smIsing.scanOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 6) : 'not defined here');
    if(!D.ok) return {
      title:'This lattice cannot be scanned',
      steps:[drvSay('what the sheet has to say',
        'One property per line — a name, then a number. Fix the lines listed under the sheet. Nothing below is computed until it reads, because a scan of half a lattice is a different model\'s.')],
      note:'The previous lattice is still drawn, so the picture does not blank while you type.'
    };
    const M = D.M, S = D.S;
    return {
      title:'An exactly solved model, and a simulation that was told none of it',
      steps:[
        drvStep('your energy, with the two directions coupled differently',
          `${dv('E')} ${dop('=')} ${dop('−')}${dv('J')}ₓ Σ_rows ${dv('s')}ᵢ${dv('s')}ⱼ ${dop('−')} ${dv('J')}ᵧ Σ_cols ${dv('s')}ᵢ${dv('s')}ⱼ ${dop('−')} ${dv('h')} Σ ${dv('s')}ᵢ`,
          `Jx = ${n(M.jx)}, Jy = ${n(M.jy)}, h = ${n(M.h)} on ${M.l}×${M.l} spins`),
        drvStep('the exact criterion for this lattice',
          `sinh(2${dv('J')}ₓ/${dv('k')}${dv('T')}_c) ${dop('·')} sinh(2${dv('J')}ᵧ/${dv('k')}${dv('T')}_c) ${dop('=')} 1`,
          D.ex > 0 ? `bisected: Tc = ${n(D.ex)} J/k` : 'no root at any positive temperature'),
        D.ex > 0
          ? drvSay('and the isotropic case is the famous one',
              'Put Jx = Jy = J and the criterion becomes sinh(2J/kTc) = 1, whose solution is 2J/(k·ln(1+√2)) = 2.2692 J/k. Every other pair of couplings has its own Tc on the same curve, and the panel solves for it rather than interpolating.')
          : drvSay('which is the one-dimensional chain, and why it never orders',
              'With one coupling set to zero the product is identically zero and can never reach 1. That is not a numerical failure — it is Ising\'s 1925 result. A domain wall in a chain costs a fixed 2J however long the chain is, but can sit in any of N places, so it gains kT·lnN of entropy; for any T > 0 a long enough chain always finds lnN big enough to pay for it.'),
        drvStep('the simulation measures a fluctuation, not a derivative',
          `${dv('C')} ${dop('=')} ${dfrac('⟨' + dv('E') + '²⟩ − ⟨' + dv('E') + '⟩²', dv('k') + dv('T') + '²')} , &nbsp; χ ${dop('=')} ${dfrac('⟨' + dv('m') + '²⟩ − ⟨|' + dv('m') + '|⟩²', dv('k') + dv('T'))}`,
          `13 temperatures, 130 sweeps to equilibrate and 240 to average`),
        drvStep('and the peaks are located by parabolic interpolation',
          `${dv('T')}* ${dop('=')} ${dv('T')}ᵢ ${dop('+')} ${dfrac('Δ', '2')}${dfrac(dv('y') + 'ᵢ₋₁ − ' + dv('y') + 'ᵢ₊₁', dv('y') + 'ᵢ₋₁ − 2' + dv('y') + 'ᵢ + ' + dv('y') + 'ᵢ₊₁')}`,
          `specific heat peaks at ${n(S.TcC)}, susceptibility at ${n(S.TcChi)}`),
        drvStep('so the two answers can be compared',
          `|${dv('T')}*_measured ${dop('−')} ${dv('T')}_c| / ${dv('T')}_c`,
          D.ex > 0 ? `${fmtNum(100 * S.relC, 3)}% for the specific heat, ${fmtNum(100 * S.relChi, 3)}% for the susceptibility`
                   : 'no exact value to compare against — the fluctuation peak here is a crossover, not a transition'),
        drvSay('a finite lattice cannot have a sharp transition, and that is not an error',
          'A divergence needs an infinite system. On L × L spins the correlation length is capped at L, so the peak is rounded and sits a little high — the shift falls off as 1/L. Extrapolating that shift to infinite size is precisely how transitions are located numerically, and the few percent above is what that shift looks like at this size.'),
        drvStep('the whole anisotropy curve, measured against the exact one',
          `${dv('T')}_c(${dv('J')}ᵧ/${dv('J')}ₓ) ${dop('→')} 0 as ${dv('J')}ᵧ ${dop('→')} 0`,
          D.sweep.map(r => 'Jy/Jx = ' + fmtNum(r.r, 2) + ': exact ' + fmtNum(r.exact, 4) +
                           ', found ' + fmtNum(r.found, 4)).join('; ')),
        drvSay('and that is the dimensional crossover, watched rather than described',
          'As the transverse coupling is turned down the transition temperature slides towards zero — continuously, with no special value at which the two-dimensional behaviour stops. The one-dimensional chain is the endpoint of that slide, not a different model, and the same simulation that finds a sharp peak at Jy = Jx finds a broad crossover at Jy = 0.12 Jx.')
      ],
      note:'The exponent ⅛ with which the order parameter vanishes is universal, but Tc is not — it depends on every coupling, and the anisotropic criterion is the exact statement of how. Having a closed form for an arbitrary Jx and Jy is what makes the located peak worth anything: it is checked against a different number at every ratio, not against one famous one.'
    };
  },
  derive(st){
    if(st.own) return STAGES.smIsing.deriveOwn(st);
    const O = smIsingObs(st.s, st.L, st.J, st.h);
    const E1 = smIsing1D(st.T, st.J, st.h);
    const n = v => fmtNum(v, 6);
    return {
      title:'Why a transition is possible in two dimensions but not in one',
      steps:[
        drvStep('the energy is a sum over neighbouring pairs',
          `${dv('E')} ${dop('=')} ${dop('−')}${dv('J')} Σ⟨ᵢⱼ⟩ ${dv('s')}ᵢ${dv('s')}ⱼ ${dop('−')} ${dv('h')} Σ ${dv('s')}ᵢ`,
          `measured now: ${n(O.e)} per spin`),
        drvStep('and every configuration is weighted by Boltzmann',
          `${dv('P')} ${dop('∝')} ${dop('e')}^(−${dv('E')}/${dv('k')}${dv('T')})`,
          'so the simulation accepts a flip with probability min(1, e^(−ΔE/kT))'),
        drvSay('the competition is between energy and entropy',
          'Order has low energy: every spin agreeing costs the least. Disorder has high entropy: there are vastly more mixed configurations than aligned ones. Free energy F = U − TS decides between them, and the T in front of S means temperature sets which one wins. A phase transition is the point at which the winner changes.'),
        drvStep('in one dimension, solve it exactly by transfer matrix',
          `${dv('Z')} ${dop('=')} Tr(${dv('T')}^${dv('N')}) ${dop('⇒')} ${dv('f')} ${dop('=')} ${dop('−')}${dv('k')}${dv('T')} ln λ₁`,
          `at T = ${fmtNum(st.T, 2)}: λ₁ = ${n(E1.lambda)}, energy per spin ${n(E1.u)}`),
        drvSay('and the one-dimensional answer is: no transition, ever',
          'Take an ordered chain of N spins and flip everything to the right of one bond. That costs a fixed energy 2J, no matter how long the chain — but the domain wall can sit in any of N places, so it gains kT·lnN of entropy. For any T > 0, a large enough chain always finds lnN big enough to pay for the wall. Order is destroyed at every finite temperature, and the model orders only at exactly zero.'),
        drvStep('in two dimensions a domain wall costs energy proportional to its length',
          `Δ${dv('E')} ${dop('∼')} 2${dv('J')}${dv('L')} , &nbsp; Δ${dv('S')} ${dop('∼')} ${dv('k')}${dv('L')} ln 3`,
          'both scale with L, so neither automatically wins — a genuine competition'),
        drvSay('which is exactly why a transition becomes possible',
          'In one dimension entropy always wins eventually because the cost was fixed and the gain grew. In two dimensions both grow together, in proportion to the wall\'s length, so the ratio of the two coefficients decides — and that ratio depends on temperature. Below a critical value energy wins and the system orders; above it entropy wins. The transition exists because the dimension changed how the cost scales.'),
        drvStep('Onsager solved it exactly',
          `sinh(2${dv('J')}/${dv('k')}${dv('T')}_c) ${dop('=')} 1 ${dop('⇒')} ${dv('T')}_c ${dop('=')} ${dfrac('2' + dv('J'), dv('k') + ' ln(1+√2)')}`,
          `Tc = ${n(SM_TC_2D)} — the simulation is at T = ${fmtNum(st.T, 2)}, ${st.T < SM_TC_2D ? 'below' : 'above'}`),
        drvStep('with the order parameter vanishing as a power law',
          `${dv('m')} ${dop('∼')} (${dv('T')}_c ${dop('−')} ${dv('T')})^(1/8)`,
          `measured now: |m| = ${n(O.absm)}`)
      ],
      note:'The exponent 1/8 is universal: every two-dimensional system in this symmetry class has it, whatever it is made of. A magnet, a binary alloy ordering and a liquid–gas critical point share critical exponents because near the transition the correlation length diverges and the microscopic details stop mattering. That is what the renormalisation group explains.'
    };
  },
  readoutOwn(st){
    const D = STAGES.smIsing.scanOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 6 : d) : 'not defined here');
    if(!D.ok) return `<div class="card tight"><div class="ttl">This lattice cannot be scanned</div>
      ${D.P.errs.slice(0, 6).map(e => kv(e.line ? 'line ' + e.line : '', e.msg)).join('')}
      <p class="help">One property per line — a name, then a number. <b>Jx</b> and <b>Jy</b> are the
      two couplings, <b>h</b> the field, <b>L</b> the lattice side and <b>seed</b> the generator's
      seed. Anything left out keeps its default.</p></div>`;
    const M = D.M, S = D.S;
    const O = smIsingObsA(st.s, M.l, M.jx, M.jy, M.h);
    return `<div class="card tight"><div class="ttl">Your lattice</div>
      ${kv('couplings Jx, Jy', n(M.jx, 4) + ', ' + n(M.jy, 4))}
      ${kv('anisotropy Jy ÷ Jx', M.jx > 0 ? n(M.jy / M.jx, 5) : '—')}
      ${kv('field h', n(M.h, 4))}
      ${kv('size', M.l + ' × ' + M.l + ' spins, seed ' + M.seed)}
      ${kv('running at T', n(st.T, 4) + ' J/k')}
      ${kv('|magnetisation| now', n(O.absm, 5))}
      ${kv('energy per spin now', n(O.e, 5))}
      <p class="help">The generator is seeded, so this sheet gives the same scan twice and a
      difference between two runs means something. The animation on the left uses the same couplings
      but its own randomness, which is why it wanders while the numbers below hold still.</p>
    </div>
    <div class="card tight"><div class="ttl">The transition, exactly</div>
      ${kv('criterion', 'sinh(2Jx/kTc)·sinh(2Jy/kTc) = 1')}
      ${kv('solved by bisection', D.ex > 0 ? n(D.ex) + ' J/k' : 'no root at any positive temperature')}
      ${kv('the isotropic value would be', n(SM_TC_2D * M.jx, 6) + ' J/k')}
      ${D.ex > 0 ? kv('check: the product at that Tc',
        n(Math.sinh(2 * M.jx / D.ex) * Math.sinh(2 * M.jy / D.ex), 9)) : ''}
      <p class="help">${D.ex > 0
        ? 'Onsager solved the anisotropic lattice, not just the square one, and the criterion above is his. It is solved here by bisection and then checked by substituting the answer back — the product prints as 1 to nine figures, which is the difference between a solution and a quotation.'
        : 'With one coupling at zero the product is identically zero and can never reach 1. That is Ising\'s own result: a chain has no transition at any positive temperature, because a domain wall costs a fixed energy but gains an entropy that grows with the length of the chain.'}</p>
    </div>
    <div class="card tight"><div class="ttl">And by simulation, which was told none of it</div>
      ${kv('specific-heat peak', n(S.TcC) + ' J/k' + (S.edgeC ? '  (at the edge of the scan)' : ''))}
      ${kv('susceptibility peak', n(S.TcChi) + ' J/k' + (S.edgeChi ? '  (at the edge of the scan)' : ''))}
      ${kv('specific heat, off by', Number.isFinite(S.relC) ? fmtNum(100 * S.relC, 3) + '%' : '—')}
      ${kv('susceptibility, off by', Number.isFinite(S.relChi) ? fmtNum(100 * S.relChi, 3) + '%' : '—')}
      ${kv('lattice used for the scan', Math.min(M.l, 28) + ' × ' + Math.min(M.l, 28))}
      <p class="help">Both peaks come from fluctuations — ⟨E²⟩−⟨E⟩² and ⟨m²⟩−⟨|m|⟩² — so neither is a
      derivative of anything and neither knows where the transition is. A finite lattice rounds the
      peak and pushes it a few percent high, because the correlation length cannot exceed L. That
      shift falls off as 1/L, and extrapolating it is how transitions are located numerically.</p>
    </div>
    <div class="card tight"><div class="ttl">The whole anisotropy curve</div>
      ${D.sweep.map(r => kv('Jy ÷ Jx = ' + fmtNum(r.r, 2),
        'exact ' + fmtNum(r.exact, 5) + ', found ' + fmtNum(r.found, 5) +
        (Number.isFinite(r.rel) ? '  (' + fmtNum(100 * r.rel, 1) + '%)' : ''))).join('')}
      <p class="help">Four more scans, on a smaller lattice, at four anisotropies. Turning the
      transverse coupling down slides the transition towards zero <b>continuously</b> — there is no
      value at which two-dimensional behaviour stops and one-dimensional begins. Having a different
      exact number to check against at every ratio is what makes the located peaks mean something;
      one famous value could have been hit by luck.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.smIsing.readoutOwn(st);
    const O = smIsingObs(st.s, st.L, st.J, st.h);
    const E1 = smIsing1D(st.T, st.J, st.h);
    const n = v => fmtNum(v, 6);
    const exact = st.T < SM_TC_2D
      ? Math.pow(Math.max(0, 1 - Math.pow(Math.sinh(2 / st.T), -4)), 0.125) : 0;
    return `<div class="card tight"><div class="ttl">Measured on the lattice now</div>
      ${kv('temperature', fmtNum(st.T, 3) + ' J/k')}
      ${kv('critical temperature', n(SM_TC_2D) + ' J/k')}
      ${kv('T ÷ Tc', fmtNum(st.T / SM_TC_2D, 4))}
      ${kv('|magnetisation|', n(O.absm))}
      ${kv('Onsager\'s exact value', n(exact))}
      ${kv('energy per spin', n(O.e))}
      <p class="help">A finite lattice never gives a perfectly sharp transition — the order
      parameter is rounded near Tc and never quite reaches zero above it. That rounding is a real,
      well-understood finite-size effect, and extrapolating it is how transitions are located
      numerically.</p>
    </div>
    <div class="card tight"><div class="ttl">One dimension, exactly</div>
      ${kv('largest eigenvalue λ₁', n(E1.lambda))}
      ${kv('energy per spin', n(E1.u))}
      ${kv('magnetisation', n(E1.m))}
      ${kv('critical temperature', 'zero — no transition at any T > 0')}
      <p class="help">The one-dimensional chain is solved in closed form, and it never orders. Having
      the exact answer in a case where the transition is <b>absent</b> is what makes the
      two-dimensional simulation's transition believable rather than a numerical artefact.</p>
    </div>
    <div class="card tight"><div class="ttl">What this model also describes</div>
      ${kv('ferromagnet', 'spin up / down')}
      ${kv('binary alloy', 'atom A / atom B on a site')}
      ${kv('lattice gas', 'site occupied / empty')}
      ${kv('neural network', 'neuron firing / quiet')}
      <p class="help">The same two-state variables with the same neighbour coupling. The Ising model
      is not primarily about magnets — it is the simplest system in which local interactions produce
      global order, and that is why it appears everywhere.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.smIsing.scanOf(st);
      if(!D.ok) return `<div class="k">your lattice</div><div style="color:var(--c-neg)">does not read</div>`;
      return `<div class="k">exact Tc = ${D.ex > 0 ? fmtNum(D.ex, 5) : 'none'}</div>
        <div>found ${fmtNum(D.S.TcC, 5)}${Number.isFinite(D.S.relC) ? ' — ' + fmtNum(100 * D.S.relC, 2) + '% out' : ''}</div>
        <div>T = ${fmtNum(st.T, 2)} J/k</div>`;
    }
    const O = smIsingObs(st.s, st.L, st.J, st.h);
    return `<div class="k">T = ${fmtNum(st.T, 2)} (Tc = ${fmtNum(SM_TC_2D, 3)})</div><div>|m| = ${fmtNum(O.absm, 3)}</div>`;
  }
};
