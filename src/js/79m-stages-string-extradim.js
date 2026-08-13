/* ============================================================================
   4s · THE STRING WING — III · WHERE THE EXTRA DIMENSIONS COULD BE HIDING
   The critical-dimension stage produced twenty-two dimensions too many. Three
   answers have been taken seriously, and two of them are testable. Every size
   in this file is placed against the actual 2020s laboratory and collider
   limits, because "extra dimensions are too small to see" is a claim with a
   number attached and the number is now quite tight.
   ============================================================================ */

/* ============================================================================
   7 · LARGE EXTRA DIMENSIONS — the version that could have been found
   ============================================================================ */
STAGES.wsADD = {
  title: 'Large extra dimensions, against the measurements',
  dockLegend: true,
  derive(st){
    const R = wsADDRadius(st.n, st.Mstar);
    const need = wsADDMstar(st.n, WS_XD_LIMITS.eotwash.lam);
    return {
      title:'Turning "why is gravity so weak" into "how big is the extra dimension"',
      steps:[
        drvSay('the hierarchy problem, stated as a ratio',
          'Gravity between two protons is weaker than their electric repulsion by about 10³⁶. Nothing in the Standard Model explains that number; it is put in by hand as the smallness of G. ADD\'s 1998 proposal was that G is not small at all — it only looks small from four dimensions.'),
        drvStep('flux spreads into every dimension it has',
          `${dv('F')} ${dop('∝')} ${dfrac('1', dv('r') + '^(2{+}' + dv('n') + ')')}`,
          `for r below the compactification radius, gravity falls off faster than an inverse square — n = ${st.n} extra dimension${st.n === 1 ? '' : 's'} here`),
        drvStep('above that radius the extra directions are used up',
          `${dv('F')} ${dop('∝')} ${dfrac('1', dv('R') + '^' + dv('n') + dv('r') + '²')}`,
          'and the inverse-square law returns, with an apparently tiny coupling that is really the volume of the hidden space'),
        drvStep('so the two Planck scales are related by that volume',
          `${dv('M')}_Pl² ${dop('=')} ${dv('M')}<sub>∗</sub>^(2{+}${dv('n')}) ${dv('R')}^${dv('n')}`,
          `M_Pl = ${fmtNum(WS_MPL_GEV, 5)} GeV; taking M<sub>∗</sub> = ${fmtNum(st.Mstar / 1000, 4)} TeV gives R = ${fmtNum(R, 4)} m`),
        drvSay('and gravity is weak because it is diluted, not because it is feeble',
          'Only gravity is allowed into the extra dimensions in this picture — the Standard Model fields are stuck to a three-dimensional surface, which is what a D-brane naturally provides. That asymmetry is the whole mechanism, and it is why the proposal was taken seriously rather than dismissed as numerology.'),
        drvStep('the size this demands',
          `${dv('R')} ${dop('=')} (${dv('M')}_Pl²/${dv('M')}<sub>∗</sub>^(2{+}${dv('n')}))^(1/${dv('n')})`,
          st.n === 1 ? fmtNum(R, 4) + ' m — larger than the solar system, and excluded by planetary orbits alone'
                     : fmtNum(R * 1e6, 4) + ' μm'),
        drvStep('and here is what has actually been measured',
          `${dv('R')} ${dop('≲')} ${dnum(WS_XD_LIMITS.eotwash.lam * 1e6)} μm`,
          'the Eöt-Wash torsion balance (Lee et al., 2020) and the HUST pendulum agree: the inverse-square law holds to about 50 μm'),
        drvSay('so the proposal is now largely closed off',
          `n = 1 was dead on arrival. n = 2 at a TeV predicts a millimetre-scale deviation, and the laboratory bound already forces M<sub>∗</sub> above ${fmtNum(need / 1000, 4)} TeV; the LHC's monojet searches push it further, past 10 TeV. Higher n gives radii below a nanometre, where gravity experiments cannot reach and only colliders can look.`),
        drvSay('and that is what a healthy speculative idea looks like',
          'ADD was a sharp proposal that made a numerical prediction reachable by two completely different experiments. Both looked. Neither found anything. The parameter space is not fully closed — large n remains — but the version that would have solved the hierarchy problem at a TeV is gone, and it was removed by measurement rather than by argument.')
      ],
      note:'Laboratory limits are 95% CL Yukawa exclusions for a coupling strength |α| = 1; collider limits are lower bounds on the fundamental scale from monojet searches at 13 TeV. Different conventions for M<sub>∗</sub> differ by factors of order 2π, so the collider numbers here are indicative rather than exact.'
    };
  },
  enter(st, o){
    st.n = o.n === undefined ? 2 : o.n;
    st.Mstar = o.Mstar === undefined ? 1000 : o.Mstar;   // GeV
    st.rProbe = o.rProbe === undefined ? 1e-5 : o.rProbe;
  },
  controls(){
    const st = ST;
    return ctlRow('extra dims n', ctlSlider('wsAdN', 1, 7, 1, st.n)) +
      ctlRow('scale M<sub>&#8727;</sub>', ctlSlider('wsAdM', 2.7, 5, 0.02, Math.log10(st.Mstar))) +
      ctlRow('probe distance', ctlSlider('wsAdR', -9, -2, 0.02, Math.log10(st.rProbe))) +
      `<p class="help">The one free choice is how many dimensions gravity leaks into, and at what energy the
      leaking starts. Everything else follows. Watch the required radius collapse as n rises — and watch
      where it crosses the shaded band, which is the region two torsion-balance experiments have already
      ruled out. This is a speculative idea being confronted with data, not being described.</p>`;
  },
  wire(){
    wireSlider('wsAdN', () => ST.n, v => { ST.n = Math.round(v); }, v => Math.round(v) + ' extra');
    wireSlider('wsAdM', () => Math.log10(ST.Mstar), v => { ST.Mstar = Math.pow(10, v); },
               v => fmtNum(Math.pow(10, +v) / 1000, 4) + ' TeV');
    wireSlider('wsAdR', () => Math.log10(ST.rProbe), v => { ST.rProbe = Math.pow(10, v); },
               v => fmtNum(Math.pow(10, +v), 3) + ' m');
  },
  frame(st, dt, ctx, W, H){
    /* left: the required radius against n, with the exclusion band */
    const P = mkPlot(W * 0.08, 52, W * 0.42, H - 132, 0.5, 7.5, -22, 16);
    plotFrame(ctx, P, 'number of extra dimensions n', 'log₁₀ R   (metres)',
      'the size ADD needs — and what has been excluded');
    plotTicksX(ctx, P, [1, 2, 3, 4, 5, 6, 7], v => String(v));
    rlYTicks(ctx, P, [-20, -15, -10, -5, 0, 5, 10, 15]);
    /* the excluded region: anything above the laboratory reach */
    const labLog = Math.log10(WS_XD_LIMITS.eotwash.lam);
    ctx.fillStyle = rgbCss(TH.neg, 0.13);
    ctx.fillRect(P.px, P.py, P.pw, P.Y(labLog) - P.py);
    rlSegment(ctx, P.px, P.Y(labLog), P.px + P.pw, P.Y(labLog), rgbCss(TH.neg), 1.8, [5, 4]);
    rlText(ctx, P.px + P.pw - 8, P.Y(labLog) - 10,
      'excluded — the inverse-square law holds here',
      rgbCss(TH.neg), '10.5px ' + FONT_UI, 'right');
    /* one curve per choice of M*, with the reader's highlighted */
    for(const [Ms, col, w] of [[1000, TH.faint, 1.4], [10000, TH.faint, 1.4], [st.Mstar, TH.curl, 2.6]]){
      const xs = [], ys = [];
      for(let n = 1; n <= 7; n++){ xs.push(n); ys.push(Math.log10(wsADDRadius(n, Ms))); }
      rlLine(ctx, P, xs, ys, rgbCss(col), w);
      for(let i = 0; i < xs.length; i++) rlDot(ctx, P.X(xs[i]), P.Y(ys[i]), col === TH.curl ? 4 : 2.5, rgbCss(col));
    }
    rlText(ctx, P.X(4.4), P.Y(Math.log10(wsADDRadius(4, 1000))) + 16, 'M∗ = 1 TeV',
           rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');
    rlText(ctx, P.X(4.4), P.Y(Math.log10(wsADDRadius(4, 10000))) - 12, 'M∗ = 10 TeV',
           rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');
    const yR = Math.log10(wsADDRadius(st.n, st.Mstar));
    rlDot(ctx, P.X(st.n), P.Y(yR), 6, rgbCss(TH.pos), rgbCss(TH.bg));
    /* the earth's radius and a proton, as anchors a reader can feel */
    for(const [v, lab] of [[Math.log10(6.371e6), 'the Earth'], [0, 'one metre'],
                           [-3, 'a millimetre'], [-15, 'a proton']]){
      rlSegment(ctx, P.px, P.Y(v), P.px + P.pw, P.Y(v), rgbCss(TH.line, 0.8), 0.8);
      rlText(ctx, P.px + 6, P.Y(v) - 7, lab, rgbCss(TH.faint), '9.5px ' + FONT_UI);
    }

    /* right: the force law itself, and where it would break */
    const R = wsADDRadius(st.n, st.Mstar);
    const Q = mkPlot(W * 0.55, 52, W * 0.40, H - 132, -9, -2, -2, 12);
    plotFrame(ctx, Q, 'separation r   (metres)', 'log₁₀ (force ÷ Newton\'s force)',
      'how much stronger gravity would be at short range');
    plotTicksX(ctx, Q, [-9, -7, -5, -3, -2], v => fmtNum(Math.pow(10, v), 3) + ' m');
    rlYTicks(ctx, Q, [0, 3, 6, 9, 12]);
    rlSegment(ctx, Q.px, Q.Y(0), Q.px + Q.pw, Q.Y(0), rgbCss(TH.line2), 1.2);
    plotCurve(ctx, Q, L => {
      const r = Math.pow(10, L);
      return r >= R ? 0 : st.n * Math.log10(R / r);
    }, 260, rgbCss(TH.curl), 2.4);
    if(Math.log10(R) > -9 && Math.log10(R) < -2){
      rlSegment(ctx, Q.X(Math.log10(R)), Q.py, Q.X(Math.log10(R)), Q.py + Q.ph,
                rgbCss(TH.accent), 1.8, [5, 4]);
      rlText(ctx, Q.X(Math.log10(R)), Q.py + 16, 'R = ' + fmtNum(R * 1e6, 3) + ' μm',
             rgbCss(TH.accent), '600 10.5px ' + FONT_MONO, 'center');
    }
    /* the region the torsion balances have actually swept */
    ctx.fillStyle = rgbCss(TH.pos, 0.10);
    const xa = Q.X(Math.log10(5e-5)), xb = Q.X(-2);
    ctx.fillRect(xa, Q.py, xb - xa, Q.ph);
    rlText(ctx, (xa + xb) / 2, Q.py + Q.ph - 26, 'swept by torsion balances',
           rgbCss(TH.pos), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, (xa + xb) / 2, Q.py + Q.ph - 12, 'nothing found',
           rgbCss(TH.pos), '10.5px ' + FONT_UI, 'center');
    const Lp = Math.log10(st.rProbe);
    rlDot(ctx, Q.X(Lp), Q.Y(st.rProbe >= R ? 0 : st.n * Math.log10(R / st.rProbe)), 5, rgbCss(TH.pos));
    stageNote(ctx, 'the Standard Model is stuck to a brane; only gravity is allowed off it — that asymmetry is the whole proposal', W, H);
  },
  readout(st){
    const R = wsADDRadius(st.n, st.Mstar);
    const need = wsADDMstar(st.n, WS_XD_LIMITS.eotwash.lam);
    const coll = WS_ADD_COLLIDER.find(c => c.n === st.n);
    const boost = st.rProbe >= R ? 1 : Math.pow(R / st.rProbe, st.n);
    return `<div class="card tight"><div class="ttl">What ${st.n} extra dimension${st.n === 1 ? '' : 's'} would require</div>
      ${kv('fundamental scale M<sub>&#8727;</sub>', fmtNum(st.Mstar / 1000, 5) + ' TeV')}
      ${kv('four-dimensional M_Pl', fmtNum(WS_MPL_GEV, 6) + ' GeV')}
      ${kv('compactification radius R', fmtNum(R, 5) + ' m')}
      ${kv('  in micrometres', fmtNum(R * 1e6, 5))}
      ${kv('  compared with a proton (0.84 fm)', fmtNum(R / 0.8409e-15, 4) + '×')}
      ${kv('verdict', R > WS_XD_LIMITS.eotwash.lam
            ? 'EXCLUDED — larger than the range gravity has been tested to'
            : 'not excluded by short-range gravity, though colliders may still reach it')}
      <p class="help">Compare that radius with the length scales you know. n = 1 needs something the size of
      a planetary orbit, and planetary orbits obey Newton's law to exquisite precision, so that case died
      immediately. n = 2 at a TeV needs a millimetre — which is precisely why two groups built torsion
      balances to look at exactly that scale.</p>
    </div>
    <div class="card tight"><div class="ttl">What experiment says</div>
      ${kv('inverse-square law verified down to', fmtNum(WS_XD_LIMITS.newton.r * 1e6, 3) + ' μm')}
      ${kv('Eöt-Wash Yukawa range limit', fmtNum(WS_XD_LIMITS.eotwash.lam * 1e6, 3) + ' μm')}
      ${kv('HUST, independent apparatus', fmtNum(WS_XD_LIMITS.hust.lam * 1e6, 3) + ' μm')}
      ${kv('so M<sub>&#8727;</sub> must exceed (from gravity alone)', fmtNum(need / 1000, 4) + ' TeV')}
      ${kv('LHC monojet limit on M_D at this n', coll ? fmtNum(coll.MD, 4) + ' TeV' : 'not quoted for n = 1')}
      ${kv('microscopic black holes at the LHC', 'searched for, none seen')}
      ${kv('Kaluza–Klein graviton resonances', 'searched for, none seen')}
      <p class="help">Two independent kinds of experiment — a tabletop pendulum measuring millinewtons and a
      27-kilometre collider measuring missing energy — constrain the same parameter, and they now agree that
      the TeV-scale version of this idea is gone. That is exactly how a speculative proposal is supposed to
      end, and it is worth noticing that string theory as a whole survives it: ADD was one way of hiding the
      extra dimensions, not the only one.</p>
    </div>
    <div class="card tight"><div class="ttl">At your probe distance</div>
      ${kv('r', fmtNum(st.rProbe, 5) + ' m')}
      ${kv('is r inside R', st.rProbe < R ? 'yes — gravity would be in its higher-dimensional regime here'
                                          : 'no — ordinary four-dimensional gravity applies')}
      ${kv('force compared with Newton', boost > 1 ? fmtNum(boost, 5) + '× stronger' : 'the same, to the accuracy of the model')}
      ${kv('effective power law', st.rProbe < R ? 'F ∝ 1/r^' + (2 + st.n) : 'F ∝ 1/r²')}
      <p class="help">The transition is sharp in this simple treatment and smooth in reality — a proper
      calculation sums over the Kaluza–Klein tower and gives a Yukawa-type correction, which is the form the
      experimental groups publish their limits in. The qualitative content is unchanged: below R the flux
      has more room to spread into, so the force is stronger than Newton predicts.</p>
    </div>`;
  },
  chip(st){
    const R = wsADDRadius(st.n, st.Mstar);
    return `<div class="k">Large extra dimensions</div>
      <div style="color:var(--c-curl)">R = ${fmtNum(R, 4)} m</div>
      <div style="color:${R > WS_XD_LIMITS.eotwash.lam ? 'var(--c-neg)' : 'var(--c-pos)'}">n = ${st.n}, M<sub>&#8727;</sub> = ${fmtNum(st.Mstar / 1000, 3)} TeV</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the radius the model needs, and the force enhancement'],
                    ['var(--c-neg)',  'the region excluded by short-range gravity'],
                    ['var(--c-pos)',  'your choice, and the range experiments have swept'],
                    ['var(--accent)', 'the compactification radius itself'],
                    ['var(--faint)',  'reference curves at 1 and 10 TeV']]; }
};

/* ============================================================================
   8 · RANDALL–SUNDRUM — geometry instead of volume
   ============================================================================ */
STAGES.wsRS = {
  title: 'Randall–Sundrum — a warped fifth dimension',
  dockLegend: true,
  derive(st){
    const warp = wsRSHierarchy(st.krc);
    const eff  = WS_MPL_GEV * warp;
    return {
      title:'Making a huge number out of a modest one, by exponentiating it',
      steps:[
        drvSay('a different response to the same problem',
          'ADD makes gravity weak by giving it a large volume to spread into. Randall and Sundrum instead keep the extra dimension small and CURVE it, so that the same physical scale looks different depending on where you stand. Only one modest number is needed, because it sits in an exponent.'),
        drvStep('the metric is warped along the extra direction',
          `${dv('ds')}² ${dop('=')} ${dop('e')}^(−2${dv('k')}|${dv('y')}|) η_μν ${dv('dx')}^μ ${dv('dx')}^ν ${dop('+')} ${dv('dy')}²`,
          'the four-dimensional part is multiplied by a factor that shrinks exponentially as you move along y'),
        drvSay('so lengths and energies are rescaled by where you are',
          'A metre stick on the far brane is physically shorter than a metre stick on the near one, by e^(−k y). Equivalently, a mass of order the Planck scale in the underlying theory appears as e^(−k y) times that to an observer on the far brane. Nothing is small; something is warped.'),
        drvStep('put the Standard Model on the far brane',
          `${dv('M')}_eff ${dop('=')} ${dv('M')}_Pl ${dop('e')}^(−π${dv('k')}${dv('r')}_c)`,
          `kr_c = ${fmtNum(st.krc, 5)} gives a warp factor of ${fmtNum(warp, 4)}, so M_eff = ${fmtNum(eff, 5)} GeV`),
        drvStep('and the required kr_c is startlingly small',
          `${dv('k')}${dv('r')}_c ${dop('=')} ${dfrac('ln(' + dv('M') + '_Pl/' + dv('M') + '_TeV)', 'π')}`,
          `to reach a TeV you need only kr_c ≈ ${fmtNum(wsRSkrc(WS_MPL_GEV, 1000), 5)} — sixteen orders of magnitude from a number near twelve`),
        drvSay('which is the appeal, and also the catch',
          'An exponential turns a small input into a huge output, so the sixteen-order hierarchy stops being mysterious. But nothing in the setup explains why kr_c takes that value rather than another — the radius must be stabilised, which is a separate mechanism (Goldberger and Wise supplied one). The problem has been reshaped rather than dissolved.'),
        drvStep('the model predicts graviton resonances at the TeV scale',
          `${dv('m')}_n ${dop('=')} ${dv('x')}_n ${dv('k')} ${dop('e')}^(−π${dv('k')}${dv('r')}_c)`,
          `x_n are the zeros of J₁: ${WS_J1_ZEROS.slice(0, 3).map(v => fmtNum(v, 5)).join(', ')} — so the spacing is fixed, not adjustable`),
        drvSay('and that is what makes it testable',
          'A tower of massive spin-2 resonances decaying to lepton and photon pairs is a spectacular signature, and both ATLAS and CMS have looked hard for it. Nothing has been seen: for the benchmark coupling k/M̄_Pl = 0.1, gravitons below roughly 4–5 TeV are excluded. The lightest predicted resonance has been pushed above the mass the model was invented to explain, which is uncomfortable for it.'),
        drvSay('but the geometry outlived the phenomenology',
          'The warped metric is a slice of anti-de Sitter space, and the exponential is the same warping that makes AdS/CFT work — the fifth coordinate is an energy scale. The holography stage in this wing uses that identification directly. RS may or may not describe our universe; it taught everyone how to read a warped dimension as a renormalisation-group flow, and that has been enormously productive.')
      ],
      note:'The graviton masses follow from Bessel zeros because the linearised graviton equation in the warped background is a Bessel equation — the spacing is a prediction of the geometry, with no freedom in it beyond the overall scale k.'
    };
  },
  enter(st, o){
    st.krc = o.krc === undefined ? 11.79 : o.krc;
    st.k   = o.k === undefined ? 1e18 : o.k;      // GeV, the curvature scale
    st.y   = o.y === undefined ? 0.5 : o.y;       // fraction of the way along
  },
  controls(){
    const st = ST;
    return ctlRow('k·r_c', ctlSlider('wsRsK', 4, 16, 0.01, st.krc)) +
      ctlRow('curvature k', ctlSlider('wsRsC', 16, 19, 0.02, Math.log10(st.k))) +
      ctlRow('position along y', ctlSlider('wsRsY', 0, 1, 0.005, st.y)) +
      `<p class="help">Slide k·r_c and watch sixteen orders of magnitude appear out of a number near twelve.
      That is the whole trick, and it is a good one — but the same geometry predicts a tower of spin-2
      resonances whose lightest member the LHC has already pushed above the scale the model was built to
      explain. Both facts are shown together below.</p>`;
  },
  wire(){
    wireSlider('wsRsK', () => ST.krc, v => { ST.krc = v; },
               v => 'k·r_c = ' + fmtNum(+v, 4) + '   ·   warp = ' + fmtNum(wsRSHierarchy(+v), 3));
    wireSlider('wsRsC', () => Math.log10(ST.k), v => { ST.k = Math.pow(10, v); },
               v => 'k = ' + fmtNum(Math.pow(10, +v), 4) + ' GeV');
    wireSlider('wsRsY', () => ST.y, v => { ST.y = v; }, v => fmtNum(+v, 3) + ' of the way across');
  },
  frame(st, dt, ctx, W, H){
    /* left: the warped slab, with the two branes and the shrinking metre stick */
    const x0 = W * 0.08, x1 = W * 0.40, yTop = 80, yBot = H - 90;
    wsTitle(ctx, (x0 + x1) / 2, 54, 'the same metre stick, drawn where it sits', TH.grad);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(x0, yTop, x1 - x0, yBot - yTop);
    /* the warp factor as a filled envelope */
    ctx.fillStyle = rgbCss(TH.grad, 0.14);
    ctx.beginPath();
    ctx.moveTo(x0, (yTop + yBot) / 2);
    for(let i = 0; i <= 120; i++){
      const u = i / 120;
      const w = Math.exp(-st.krc * Math.PI * u);
      ctx.lineTo(x0 + (x1 - x0) * u, (yTop + yBot) / 2 - (yBot - yTop) * 0.42 * Math.pow(w, 0.06));
    }
    for(let i = 120; i >= 0; i--){
      const u = i / 120;
      const w = Math.exp(-st.krc * Math.PI * u);
      ctx.lineTo(x0 + (x1 - x0) * u, (yTop + yBot) / 2 + (yBot - yTop) * 0.42 * Math.pow(w, 0.06));
    }
    ctx.closePath(); ctx.fill();
    rlSegment(ctx, x0, yTop, x0, yBot, rgbCss(TH.accent), 3.5);
    rlSegment(ctx, x1, yTop, x1, yBot, rgbCss(TH.curl), 3.5);
    rlText(ctx, x0 + 6, yTop - 12, 'the Planck brane', rgbCss(TH.accent), '10.5px ' + FONT_UI);
    rlText(ctx, x1 - 6, yTop - 12, 'the TeV brane — we live here', rgbCss(TH.curl), '10.5px ' + FONT_UI, 'right');
    /* the reader's slice */
    const xs = x0 + (x1 - x0) * st.y;
    const wHere = Math.exp(-st.krc * Math.PI * st.y);
    rlSegment(ctx, xs, yTop, xs, yBot, rgbCss(TH.pos, 0.8), 1.6, [4, 4]);
    const stick = Math.max(3, 90 * Math.pow(wHere, 0.06));
    rlSegment(ctx, xs - stick / 2, (yTop + yBot) / 2, xs + stick / 2, (yTop + yBot) / 2, rgbCss(TH.pos), 3);
    rlText(ctx, xs, (yTop + yBot) / 2 - 14,
      'e^(−k y) = ' + fmtNum(wHere, 3), rgbCss(TH.pos), '10px ' + FONT_MONO, 'center');
    wsSub(ctx, (x0 + x1) / 2, yBot + 20, 'a Planck-scale mass on the left looks like a TeV on the right');
    wsSub(ctx, (x0 + x1) / 2, yBot + 36, 'the drawing compresses the warp — it is a factor of 10⁻¹⁶, not 10⁻¹');

    /* right: the hierarchy, and the graviton tower against the LHC bound */
    const P = mkPlot(W * 0.48, 56, W * 0.46, (H - 140) * 0.52, 4, 16, -19, 1);
    plotFrame(ctx, P, 'k·rc   (the warp exponent)', 'log₁₀ (warp factor)',
      'sixteen orders of magnitude, from a number near twelve');
    plotTicksX(ctx, P, [4, 8, 12, 16], v => String(v));
    rlYTicks(ctx, P, [-18, -12, -6, 0]);
    plotCurve(ctx, P, x => Math.log10(wsRSHierarchy(x)), 200, rgbCss(TH.curl), 2.4);
    const need = wsRSkrc(WS_MPL_GEV, 1000);
    rlSegment(ctx, P.X(need), P.py, P.X(need), P.py + P.ph, rgbCss(TH.accent), 1.6, [5, 4]);
    rlText(ctx, P.X(need) + 6, P.py + 15, 'a TeV needs ' + fmtNum(need, 4),
           rgbCss(TH.accent), '10px ' + FONT_MONO);
    rlDot(ctx, P.X(st.krc), P.Y(Math.log10(wsRSHierarchy(st.krc))), 5, rgbCss(TH.pos));

    const warp = wsRSHierarchy(st.krc);
    const Q = mkPlot(W * 0.48, 56 + (H - 140) * 0.52 + 60, W * 0.46, (H - 140) * 0.48 - 24,
                     0, 6, 0, 14);
    plotFrame(ctx, Q, '', 'graviton mass   (TeV)',
      'the predicted resonances, against what the LHC has excluded');
    rlYTicks(ctx, Q, [0, 4, 8, 12]);
    ctx.fillStyle = rgbCss(TH.neg, 0.13);
    ctx.fillRect(Q.px, Q.Y(WS_RS_LHC_TEV), Q.pw, Q.py + Q.ph - Q.Y(WS_RS_LHC_TEV));
    rlSegment(ctx, Q.px, Q.Y(WS_RS_LHC_TEV), Q.px + Q.pw, Q.Y(WS_RS_LHC_TEV), rgbCss(TH.neg), 1.8, [5, 4]);
    rlText(ctx, Q.px + 8, Q.Y(WS_RS_LHC_TEV) + 13,
      'excluded by ATLAS/CMS  (k/M̄_Pl = 0.1)', rgbCss(TH.neg), '10.5px ' + FONT_UI);
    for(let i = 0; i < WS_J1_ZEROS.length; i++){
      const m = wsRSGraviton(i, st.k, warp) / 1000;      // TeV
      if(m > 14) continue;
      const xx = Q.px + Q.pw * (i + 0.7) / 5.6;
      rlSegment(ctx, xx, Q.Y(0), xx, Q.Y(m), rgbCss(m < WS_RS_LHC_TEV ? TH.neg : TH.curl), 3);
      rlDot(ctx, xx, Q.Y(m), 4.5, rgbCss(m < WS_RS_LHC_TEV ? TH.neg : TH.curl));
      rlText(ctx, xx, Q.Y(m) - 11, fmtNum(m, 3), rgbCss(TH.dim), '9.5px ' + FONT_MONO, 'center');
      rlText(ctx, xx, Q.Y(0) + 13, 'n=' + (i + 1), rgbCss(TH.faint), '9.5px ' + FONT_MONO, 'center');
    }
    stageNote(ctx, 'the spacing of the resonances comes from Bessel zeros — the geometry fixes it, and there is no dial', W, H);
  },
  readout(st){
    const warp = wsRSHierarchy(st.krc);
    const eff = WS_MPL_GEV * warp;
    const m1 = wsRSGraviton(0, st.k, warp) / 1000;
    return `<div class="card tight"><div class="ttl">The warp</div>
      ${kv('k·r_c', fmtNum(st.krc, 6))}
      ${kv('warp factor e^(−πkr_c)', fmtNum(warp, 5))}
      ${kv('effective scale on the far brane', fmtNum(eff, 5) + ' GeV')}
      ${kv('  in TeV', fmtNum(eff / 1000, 5))}
      ${kv('k·r_c needed for exactly 1 TeV', fmtNum(wsRSkrc(WS_MPL_GEV, 1000), 6))}
      ${kv('at your slice y', fmtNum(Math.exp(-st.krc * Math.PI * st.y), 5))}
      <p class="help">The hierarchy problem asks why 10¹⁹ GeV and 10³ GeV are so far apart. Here they are
      the same scale seen from two places in a curved fifth dimension, and the ratio between them is set by
      a number of order ten. That is a genuine improvement in how the question feels — but it does not
      explain why <i>that</i> number, and stabilising it needs its own field and its own potential.</p>
    </div>
    <div class="card tight"><div class="ttl">The resonances it predicts</div>
      ${WS_J1_ZEROS.map((z, i) => kv('graviton ' + (i + 1) + '  (J₁ zero ' + fmtNum(z, 5) + ')',
        fmtNum(wsRSGraviton(i, st.k, warp) / 1000, 5) + ' TeV')).join('')}
      ${kv('mass ratio m₂/m₁', fmtNum(WS_J1_ZEROS[1] / WS_J1_ZEROS[0], 6))}
      ${kv('LHC exclusion', 'below about ' + fmtNum(WS_RS_LHC_TEV, 3) + ' TeV, for k/M̄_Pl = 0.1')}
      ${kv('status of the lightest resonance', m1 < WS_RS_LHC_TEV
            ? 'this parameter point is EXCLUDED — that graviton would already have been seen'
            : 'above the current reach, so still allowed')}
      <p class="help">The ratio 1.834 between the first two masses is not a fitted parameter. It is the ratio
      of two Bessel zeros, and it is what a search would confirm if a resonance ever appeared: one bump could
      be anything, two bumps in that ratio would be this model. So far there are no bumps.</p>
    </div>
    <div class="card tight"><div class="ttl">What survived</div>
      ${kv('the metric', 'a slice of anti-de Sitter space')}
      ${kv('the fifth coordinate', 'an energy scale — position is renormalisation-group time')}
      ${kv('the near brane', 'the ultraviolet; the far brane, the infrared')}
      ${kv('the modern use', 'a calculational tool for strongly coupled four-dimensional physics')}
      <p class="help">Whatever happens to Randall–Sundrum as a model of our universe, the identification it
      made popular — moving along a warped dimension is running a coupling — is now standard. The
      holography stage in this wing takes that identification and checks it quantitatively, by computing one
      quantity in a curved five-dimensional geometry and the same quantity in a four-dimensional field
      theory, and comparing the two numbers.</p>
    </div>`;
  },
  chip(st){
    const warp = wsRSHierarchy(st.krc);
    return `<div class="k">Randall–Sundrum</div>
      <div style="color:var(--c-curl)">warp = ${fmtNum(warp, 4)}</div>
      <div style="color:var(--c-pos)">k·r_c = ${fmtNum(st.krc, 4)}</div>`;
  },
  legend(){ return [['var(--accent)', 'the Planck brane, and the value that gives a TeV'],
                    ['var(--c-curl)', 'the TeV brane, the warp factor, and allowed resonances'],
                    ['var(--c-grad)', 'the warped bulk'],
                    ['var(--c-pos)',  'your slice through it'],
                    ['var(--c-neg)',  'resonance masses the LHC has already excluded']]; }
};

/* ============================================================================
   9 · THE TORUS, MODULAR INVARIANCE, AND WHY THERE IS NO ULTRAVIOLET
   ============================================================================ */
STAGES.wsTorus = {
  title: 'One loop — and where the ultraviolet went',
  drag: true,
  dockLegend: true,
  derive(st){
    const red = wsSL2Reduce(st.t1, st.t2);
    const chk = wsEtaModularCheck(st.t1, st.t2);
    return {
      title:'The reason string loop diagrams do not diverge',
      steps:[
        drvSay('where field-theory infinities come from',
          'A loop integral in quantum field theory runs over arbitrarily short distances, and that is where the divergences live. Renormalisation absorbs them into redefined couplings, which works beautifully — except for gravity, where the number of counterterms needed grows without limit and the procedure breaks down.'),
        drvStep('a string one-loop diagram is a torus',
          `${dv('Z')} ${dop('=')} ∫ ${dfrac(dv('d')+'²τ', 'τ₂²')} ${dv('Z')}(τ)`,
          'there is only ONE one-loop diagram, and its shape is described by a single complex number τ'),
        drvStep('but different τ can describe the same torus',
          `τ ${dop('→')} ${dfrac(dv('a')+'τ {+} '+dv('b'), dv('c')+'τ {+} '+dv('d'))}, ${dv('ad')} ${dop('−')} ${dv('bc')} ${dop('=')} 1`,
          'the modular group SL(2,ℤ), generated by τ → τ + 1 and τ → −1/τ'),
        drvSay('so integrating over all τ would count every torus infinitely often',
          'The integral must run over the QUOTIENT — one representative per torus. That region is the fundamental domain, and the whole argument turns on what it contains.'),
        drvStep('the fundamental domain excludes small τ₂',
          `|τ| ${dop('≥')} 1, |Re τ| ${dop('≤')} ${dfrac('1','2')}`,
          `your τ = ${fmtNum(st.t1, 4)} + ${fmtNum(st.t2, 4)}i reduces to ${fmtNum(red.t1, 4)} + ${fmtNum(red.t2, 4)}i using ${red.moves.length ? red.moves.join(' ') : 'no moves — it is already there'}`),
        drvSay('and small τ₂ is exactly the ultraviolet',
          'τ₂ is the modular parameter that plays the role of Schwinger proper time. In a field theory the corresponding integral runs down to zero, and that lower end is the short-distance region where the divergence sits. Here the region is not regulated, cut off, or subtracted — it is simply not part of the integration domain. There is no ultraviolet to renormalise.'),
        drvStep('the symmetry, checked rather than asserted',
          `η(${dop('−')}1/τ) ${dop('=')} √(${dop('−')}${dop('i')}τ) η(τ)`,
          `computed on both sides at your τ: they differ by ${fmtNum(chk.gap, 3)}`),
        drvSay('and the same modularity gives the Hagedorn density',
          'The transformation of η that removes the ultraviolet here is the one that converts the level-counting product into an exponential in the spectrum stage. The finiteness of the loop and the explosion of the state count are two readings of a single identity, which is a good sign that the structure is not accidental.'),
        drvSay('what this does and does not settle',
          'Finiteness order by order in perturbation theory is established for the superstring; that is genuinely a solved problem and it is what made the subject explode in 1984. It is not the same as knowing the theory exists non-perturbatively, and the perturbation series itself is expected to diverge — asymptotically, as such series usually do. The claim is precise, and it is smaller than the popular version of it.')
      ],
      note:'Drag anywhere on the upper half plane to move τ. The path of reduction is drawn as you go, so the two generators can be watched doing their work; the shaded region is the fundamental domain, and every torus in the universe is described by exactly one point in it.'
    };
  },
  enter(st, o){
    st.t1 = o.t1 === undefined ? 0.31 : o.t1;
    st.t2 = o.t2 === undefined ? 0.42 : o.t2;
    st.showEta = o.showEta !== false;
  },
  controls(){
    const st = ST;
    return ctlRow('Re τ', ctlSlider('wsToR', -3, 3, 0.005, st.t1)) +
      ctlRow('Im τ', ctlSlider('wsToI', 0.06, 3, 0.005, st.t2)) +
      ctChk('wsToE', 'check the modular identity for η at this τ', st.showEta) +
      `<p class="help">Drag on the plot, or use the sliders. A torus is a parallelogram with opposite edges
      glued, and τ says which parallelogram — but τ, τ+1 and −1/τ all give the <b>same</b> torus. So the loop
      integral runs over the shaded region only, and that region has a floor: Im τ can never get below √3/2.
      Small Im τ is the short-distance regime, and it is not in the domain at all.</p>`;
  },
  wire(){
    wireSlider('wsToR', () => ST.t1, v => { ST.t1 = v; }, v => 'Re τ = ' + fmtNum(+v, 4));
    wireSlider('wsToI', () => ST.t2, v => { ST.t2 = v; }, v => 'Im τ = ' + fmtNum(+v, 4));
    ctWireChk('wsToE', v => { ST.showEta = v; });
  },
  pick(st, sx, sy){
    const P = st._P;
    if(!P || !P.inside(sx, sy)) return;
    st.t1 = Math.max(-3, Math.min(3, P.invX(sx)));
    st.t2 = Math.max(0.06, Math.min(3, P.invY(sy)));
    buildStagePanel();
  },
  frame(st, dt, ctx, W, H){
    const P = mkPlot(W * 0.07, 52, W * 0.52, H - 128, -2.6, 2.6, 0, 2.9);
    st._P = P;
    plotFrame(ctx, P, 'Re τ', 'Im τ', 'the upper half plane, and the region that is actually integrated');
    plotTicksX(ctx, P, [-2, -1, -0.5, 0, 0.5, 1, 2], v => fmtNum(v, 3));
    rlYTicks(ctx, P, [0, 0.5, 1, 1.5, 2, 2.5]);
    /* the fundamental domain */
    ctx.save();
    ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
    ctx.fillStyle = rgbCss(TH.curl, 0.16);
    ctx.beginPath();
    ctx.moveTo(P.X(-0.5), P.Y(2.9));
    ctx.lineTo(P.X(-0.5), P.Y(Math.sqrt(1 - 0.25)));
    /* the floor of the domain is the arc of the unit circle from 120° to 60° */
    for(let i = 0; i <= 80; i++){
      const th = (2 * Math.PI / 3) - (Math.PI / 3) * i / 80;
      ctx.lineTo(P.X(Math.cos(th)), P.Y(Math.sin(th)));
    }
    ctx.lineTo(P.X(0.5), P.Y(2.9));
    ctx.closePath(); ctx.fill();
    ctx.restore();
    /* the unit circle and the two vertical walls */
    ctx.strokeStyle = rgbCss(TH.curl, 0.9); ctx.lineWidth = 1.6;
    ctx.beginPath();
    for(let i = 0; i <= 200; i++){
      const th = Math.PI * i / 200;
      const x = P.X(Math.cos(th)), y = P.Y(Math.sin(th));
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    rlSegment(ctx, P.X(-0.5), P.py, P.X(-0.5), P.Y(Math.sqrt(0.75)), rgbCss(TH.curl, 0.9), 1.6);
    rlSegment(ctx, P.X(0.5), P.py, P.X(0.5), P.Y(Math.sqrt(0.75)), rgbCss(TH.curl, 0.9), 1.6);
    rlText(ctx, P.X(0), P.Y(2.2), 'the fundamental domain', rgbCss(TH.curl), '600 11px ' + FONT_UI, 'center');
    rlText(ctx, P.X(0), P.Y(1.95), 'one point per torus, and no more', rgbCss(TH.curl), '10px ' + FONT_UI, 'center');
    /* the excluded strip near the real axis, which is the ultraviolet */
    ctx.fillStyle = rgbCss(TH.neg, 0.11);
    ctx.fillRect(P.px, P.Y(Math.sqrt(0.75)), P.pw, P.py + P.ph - P.Y(Math.sqrt(0.75)));
    rlText(ctx, P.X(-1.7), P.Y(0.30),
      'Im τ → 0 is the ultraviolet', rgbCss(TH.neg), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, P.X(-1.7), P.Y(0.16),
      'and no torus needs it', rgbCss(TH.neg), '10.5px ' + FONT_UI, 'center');
    rlSegment(ctx, P.px, P.Y(Math.sqrt(0.75)), P.px + P.pw, P.Y(Math.sqrt(0.75)),
              rgbCss(TH.accent, 0.8), 1.4, [4, 4]);
    rlText(ctx, P.px + P.pw - 8, P.Y(Math.sqrt(0.75)) - 9,
      'the floor: Im τ ≥ √3/2 = ' + fmtNum(Math.sqrt(0.75), 5),
      rgbCss(TH.accent), '10px ' + FONT_MONO, 'right');
    /* the reduction path */
    const red = wsSL2Reduce(st.t1, st.t2);
    let a = st.t1, b = st.t2;
    ctx.strokeStyle = rgbCss(TH.pos, 0.8); ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(P.X(a), P.Y(b));
    for(let it = 0; it < 40; it++){
      const sh = Math.round(a);
      if(sh !== 0){ a -= sh; ctx.lineTo(P.X(a), P.Y(b)); }
      const n2 = a * a + b * b;
      if(n2 < 1 - 1e-13){ a = -a / n2; b = b / n2; ctx.lineTo(P.X(a), P.Y(b)); }
      else break;
    }
    ctx.stroke(); ctx.setLineDash([]);
    rlDot(ctx, P.X(st.t1), P.Y(st.t2), 5.5, rgbCss(TH.pos), rgbCss(TH.bg));
    rlDot(ctx, P.X(red.t1), P.Y(red.t2), 5.5, rgbCss(TH.accent), rgbCss(TH.bg));
    rlText(ctx, P.X(red.t1), P.Y(red.t2) - 14,
      red.moves.length ? red.moves.join(' ') : 'already in the domain',
      rgbCss(TH.accent), '10.5px ' + FONT_MONO, 'center');

    /* right: the torus this τ describes, drawn as the parallelogram it is */
    const cx = W * 0.79, cy = H * 0.36, u = Math.min(W * 0.07, 70);
    wsTitle(ctx, cx, cy - 100, 'the torus τ describes', TH.grad);
    const oX = cx - u * (1 + red.t1) / 2, oY = cy + u * red.t2 / 2;
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(oX, oY);
    ctx.lineTo(oX + u, oY);
    ctx.lineTo(oX + u + u * red.t1, oY - u * red.t2);
    ctx.lineTo(oX + u * red.t1, oY - u * red.t2);
    ctx.closePath(); ctx.stroke();
    rlArrow(ctx, oX, oY, oX + u, oY, rgbCss(TH.curl), 2, 8);
    rlArrow(ctx, oX, oY, oX + u * red.t1, oY - u * red.t2, rgbCss(TH.accent), 2, 8);
    rlText(ctx, oX + u / 2, oY + 15, '1', rgbCss(TH.curl), '11px ' + FONT_MONO, 'center');
    rlText(ctx, oX + u * red.t1 / 2 - 12, oY - u * red.t2 / 2, 'τ', rgbCss(TH.accent), '11px ' + FONT_MONO, 'center');
    wsSub(ctx, cx, cy + 62, 'glue the opposite edges and this is the worldsheet');
    wsSub(ctx, cx, cy + 78, 'of a string going round a loop');

    if(st.showEta){
      const chk = wsEtaModularCheck(st.t1, st.t2);
      const bx = W * 0.66, by = H * 0.62;
      rlText(ctx, bx, by, 'the modular identity, both sides computed',
             rgbCss(TH.dim), '600 11px ' + FONT_UI);
      wsNum(ctx, bx, by + 20, 'η(−1/τ)', fmtNum(wsCabs(chk.lhs), 8), TH.curl);
      wsNum(ctx, bx, by + 38, '√(−iτ) η(τ)', fmtNum(wsCabs(chk.rhs), 8), TH.grad);
      wsNum(ctx, bx, by + 56, 'difference', fmtNum(chk.gap, 3), TH.accent);
      rlText(ctx, bx, by + 80, 'the identity that removes the ultraviolet',
             rgbCss(TH.faint), '10.5px ' + FONT_UI);
      rlText(ctx, bx, by + 95, 'is the identity that produces the Hagedorn density',
             rgbCss(TH.faint), '10.5px ' + FONT_UI);
    }
    stageNote(ctx, 'the short-distance region is not regulated or subtracted — it is not part of the integral', W, H);
  },
  readout(st){
    const red = wsSL2Reduce(st.t1, st.t2);
    const chk = wsEtaModularCheck(st.t1, st.t2);
    const eta = wsEta(red.t1, red.t2);
    return `<div class="card tight"><div class="ttl">Your τ, reduced</div>
      ${kv('τ', fmtNum(st.t1, 5) + ' + ' + fmtNum(st.t2, 5) + 'i')}
      ${kv('in the fundamental domain', fmtNum(red.t1, 6) + ' + ' + fmtNum(red.t2, 6) + 'i')}
      ${kv('moves used', red.moves.length ? red.moves.join('  ·  ') : 'none — it was already there')}
      ${kv('is it in the domain now', red.inDomain ? 'yes' : 'no — the reduction did not terminate')}
      ${kv('|τ| after reduction', fmtNum(Math.hypot(red.t1, red.t2), 6))}
      ${kv('lowest Im τ any torus needs', fmtNum(Math.sqrt(0.75), 6))}
      <p class="help">Two generators do all the work: T shifts τ by one, S inverts it. Every element of
      SL(2,ℤ) is a word in those two, and the algorithm above simply alternates them until the point is
      inside. That the process always terminates is the statement that the shaded region really is a
      fundamental domain.</p>
    </div>
    <div class="card tight"><div class="ttl">The identity, both sides</div>
      ${kv('|η(−1/τ)|', fmtNum(wsCabs(chk.lhs), 12))}
      ${kv('|√(−iτ)·η(τ)|', fmtNum(wsCabs(chk.rhs), 12))}
      ${kv('difference', fmtNum(chk.gap, 3))}
      ${kv('|η| at the reduced τ', fmtNum(wsCabs(eta), 10))}
      <p class="help">Both sides are evaluated from the infinite product, independently, at your τ. Nothing
      is copied from one to the other. This is the transformation law that makes the one-loop measure
      invariant, and it is also — read in the other direction — the identity that turns the level-counting
      product into an exponential density of states, which is where the Hagedorn temperature comes from.</p>
    </div>
    <div class="card tight"><div class="ttl">What is actually established</div>
      ${kv('one-loop finiteness', 'yes, and this is the mechanism')}
      ${kv('finite order by order (superstring)', 'yes — the result that set off the 1984 revolution')}
      ${kv('does the perturbation series converge', 'no — it is expected to be asymptotic, as such series usually are')}
      ${kv('does the theory exist non-perturbatively', 'not known in general')}
      <p class="help">This is the strongest technical claim string theory makes, and it is worth stating at
      its actual size. Order-by-order finiteness is established and is a genuine achievement — gravity has
      no other perturbative quantum treatment that behaves this way. It is not a proof that the theory
      exists, and the two claims are regularly conflated in popular accounts. Where a non-perturbative
      definition <i>is</i> available it comes from holography, which is the last group of this wing.</p>
    </div>`;
  },
  chip(st){
    const red = wsSL2Reduce(st.t1, st.t2);
    return `<div class="k">Modular τ</div>
      <div style="color:var(--c-pos)">${fmtNum(st.t1, 3)} + ${fmtNum(st.t2, 3)}i</div>
      <div style="color:var(--accent)">→ ${fmtNum(red.t1, 3)} + ${fmtNum(red.t2, 3)}i</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the fundamental domain — one point per torus'],
                    ['var(--c-neg)',  'the short-distance region that no torus needs'],
                    ['var(--c-pos)',  'your τ, and the path that reduces it'],
                    ['var(--accent)', 'where it lands, and the floor at Im τ = √3/2'],
                    ['var(--c-grad)', 'the parallelogram τ describes']]; }
};
