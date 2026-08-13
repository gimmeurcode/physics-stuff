STAGES.wvSHM = {
  title:'Simple harmonic motion',
  derive(st){
    const n = v => fmtNum(v, 6);
    if(st.kind === 'well'){
      const R = STAGES.wvSHM.well(st).R;
      if(!R.ok) return { title:'Nothing oscillates here yet',
        steps:[drvSay('the force law has no bound motion', R.why + '. An oscillation needs a stable equilibrium and an amplitude the force can still pull back from.')],
        note:'The ladder follows the well your force digs, so it needs a well.' };
      return {
        title:'What the word “simple” is doing in “simple harmonic motion”',
        steps:[
          drvSay('the adjective is not decoration',
            'Every stable system oscillates. Almost none of them oscillate *simply*. The word means one specific thing — that the period does not depend on the amplitude — and it is a property of the force law rather than of oscillating, which is why it stays invisible until you type a force that fails it.'),
          drvStep('any force with a stable equilibrium gives bounded motion',
            `${dv('m')}${dv('x')}″ ${dop('=')} ${dv('F')}(${dv('x')})`,
            `your F has its stable zero at x = ${n(R.eq)}, found by locating every root and keeping the one where F′ < 0`),
          drvStep('and its potential is the integral of minus that force',
            `${dv('U')}(${dv('x')}) ${dop('=')} ${dop('−')}∫ ${dv('F')} ${dv('dx')}`,
            `released from rest at ${n(R.xp)} m, the energy is E = U there, and the mass turns round again at ${n(R.xm)} m`),
          drvSay('which already fixes the period, without solving anything',
            'Energy conservation gives the speed at every point, ½mv² = E − U, so the time to cross each slice of the well is dx/v and the period is their sum. No differential equation needs to be solved for this — only an integral evaluated.'),
          drvStep('so the period follows from the potential alone',
            `${dv('T')} ${dop('=')} 2∫ ${dfrac(dv('dx'), '√(2(' + dv('E') + '−' + dv('U') + ')/' + dv('m') + ')')}`,
            `= ${n(R.Tenergy)} s, with the turning-point singularity removed by x = c + R sin θ`),
          drvSay('and it is checked against the motion itself, which knows nothing of energy',
            R.motionOK
              ? 'Integrating x″ = F(x)/m by Runge–Kutta and timing the returns of v to zero gives ' + n(R.Tmotion) + ' s. The two differ by ' + fmtNum(R.gap, 3) + ' s and share no line of code, so their agreement is the claim about energy being tested rather than assumed.'
              : 'The integrated motion did not come back, which means this energy is above the rim of the well.'),
          drvStep('now compare the number the approximation offers',
            `${dv('T')}_harm ${dop('=')} 2π√(${dv('m')}/${dv('k')}), &nbsp; ${dv('k')} ${dop('=')} ${dop('−')}${dv('F')}′(${dv('x')}₀)`,
            `= ${n(R.Tharm)} s, which is out by ${fmtNum(100 * R.harmRel, 4)}% at this amplitude`),
          drvSay('the approximation is a Taylor series truncated at the second term',
            'Expand U about its minimum: the constant is irrelevant, the linear term vanishes because it is a minimum, and the first surviving term is ½kx². Keep only that and you have a parabola, whose period is the same at every amplitude. That is drawn dashed beside your well so you can see exactly where they part company.'),
          drvSay('and the amplitude sweep is the whole demonstration',
            R.isoSpread < 1e-6
              ? 'The period is computed at each of ' + R.sweep.length + ' amplitudes and comes out constant to ' + fmtNum(100 * R.isoSpread, 3) + '%. That flat line is isochrony, and it happens because your F is proportional to x — nothing else can produce it.'
              : 'The period is computed at each of ' + R.sweep.length + ' amplitudes and moves by ' + fmtNum(100 * R.isoSpread, 4) + '% across them. Shrink the amplitude and the curve settles onto the amber line, because every smooth well is a parabola close enough to the bottom. That limit is the whole of the harmonic approximation, and this curve is what it costs.')
        ],
        note:'The period is computed twice by routes with nothing in common — an energy integral with no clock in it, and a Runge–Kutta integration with no energy in it — and then compared against 2π√(m/k), which is a prediction rather than a measurement. Sweeping the amplitude turns "the period is independent of amplitude" from an assertion into a curve.'
      };
    }
    const w = Math.sqrt(st.k / st.m);
    return {
      title:'Why so many different systems oscillate at all, and identically',
      steps:[
        drvSay('the reason SHM is everywhere',
          'Near any stable equilibrium, expand the potential energy in a Taylor series. The constant does not matter, the linear term vanishes because it is an equilibrium, and the first surviving term is quadratic. A quadratic potential means a linear restoring force — so every stable system, whatever it is made of, oscillates harmonically for small enough displacements.'),
        drvStep('the restoring force is proportional to displacement',
          `${dv('F')} ${dop('=')} ${dop('−')}${dv('k')}${dv('x')}`,
          `k = ${n(st.k)} N/m, m = ${n(st.m)} kg`),
        drvStep('so the second law gives a differential equation',
          `${dv('m')}${dv('x')}″ ${dop('+')} ${dv('k')}${dv('x')} ${dop('=')} 0`,
          'the equation the ODE wing solves by the exponential guess'),
        drvStep('whose solution oscillates',
          `${dv('x')} ${dop('=')} ${dv('A')} cos(ω${dv('t')} ${dop('+')} φ), &nbsp; ω ${dop('=')} √(${dv('k')}/${dv('m')})`,
          `ω = ${n(w)} rad/s, period ${n(2 * Math.PI / w)} s`),
        drvSay('and the amplitude is absent from the frequency',
          'A pendulum swinging widely takes the same time as one barely moving. That isochrony is why pendulum clocks work, and it is a direct consequence of the force being exactly proportional to displacement — nothing else in the equation can introduce an amplitude.'),
        drvStep('the pendulum is the same equation, after an approximation',
          `θ″ ${dop('+')} ${dfrac(dv('g'), dv('L'))} sin θ ${dop('=')} 0 ${dop('→')} θ″ ${dop('+')} ${dfrac(dv('g'), dv('L'))}θ ${dop('=')} 0`,
          `L = ${n(st.L)} m gives ω = ${n(Math.sqrt(9.80665 / st.L))} rad/s for small swings`),
        drvSay('and the approximation is where isochrony comes from',
          'sin θ ≈ θ is what makes the pendulum harmonic. The exact equation is not, and its period does depend on amplitude — by about 0.2% at 10° and 18% at 90°. The panel computes the exact period by an elliptic integral so the error in the approximation is a number rather than a caveat.'),
        drvStep('energy sloshes between two forms',
          `${dfrac('1', '2')}${dv('k')}${dv('x')}² ${dop('+')} ${dfrac('1', '2')}${dv('m')}${dv('v')}² ${dop('=')} ${dfrac('1', '2')}${dv('k')}${dv('A')}²`,
          'the panel plots both and their sum, which stays flat'),
        drvSay('and this is why the same mathematics keeps reappearing',
          'A mass on a spring, a pendulum, an LC circuit, a vibrating molecule and a photon mode in a cavity all obey this equation. Solving it once solves all of them, which is why the harmonic oscillator is the most reused model in physics.')
      ],
      note:'The exact pendulum period is computed by the arithmetic–geometric mean rather than quoted, so the departure from the small-angle result can be read at any amplitude. That departure is what the approximation costs.'
    };
  },
  enter(st, o){
    st.kind = o.kind || 'spring';
    st.k = 20; st.m = 0.5; st.A = 0.25; st.L = 1; st.th0 = 0.3;
    st.t = 0; st.run = o.run !== false;
    st.fsrc = o.fsrc || '-20*x - 800*x^3';
  },
  /* the reader's force law, and both routes to the period it produces */
  well(st){
    const key = st.fsrc + '|' + st.m + '|' + st.A;
    if(st._wk === key) return st._wd;
    st._wk = key;
    const g = pkCompile(st.fsrc);
    const F = x => { const v = g(x, 0, 0); return Number.isFinite(v) ? v : 0; };
    st._wd = { F, R:wvOwnWell(F, Math.max(0.01, st.m), Math.max(1e-3, st.A)) };
    return st._wd;
  },
  controls(){
    const st = ST;
    return ctSeg('wvSK', st.kind, [['spring', 'a mass on a spring'], ['pend', 'a pendulum'],
                                   ['well', 'a force law of your own']]) +
      (st.kind === 'pend'
        ? ctlRow('length L', ctlSlider('wvSL', 0.2, 3, 0.02, st.L)) + ctlRow('amplitude θ₀', ctlSlider('wvSth', 0.05, 2.9, 0.01, st.th0))
        : st.kind === 'well'
        ? fnHtml('wvSf', 'force F(x) in N =', st.fsrc, 'x — the displacement in metres') +
          ctlRow('mass m', ctlSlider('wvSm', 0.1, 3, 0.02, st.m)) +
          ctlRow('amplitude A', ctlSlider('wvSA', 0.01, 0.5, 0.005, st.A))
        : ctlRow('stiffness k', ctlSlider('wvSk', 2, 80, 0.5, st.k)) + ctlRow('mass m', ctlSlider('wvSm', 0.1, 3, 0.02, st.m)) +
          ctlRow('amplitude A', ctlSlider('wvSA', 0.05, 0.5, 0.005, st.A))) +
      ctChk('wvSrun', 'run it', st.run) +
      (st.kind === 'well'
        ? `<p class="help">Simple harmonic motion is called <b>simple</b> because its period does not
          depend on its amplitude. That is not a property of oscillating — it is a property of the force
          being <i>exactly</i> proportional to displacement, and it stays invisible until you type a force
          for which it fails. The panel sweeps the amplitude and plots the period against it: a flat line
          is isochrony, and anything else is not.</p>
          <p class="help">The period is obtained <b>twice, by routes with nothing in common</b>. One
          integrates x″ = F(x)/m by Runge–Kutta and reads the period off the times at which v returns to
          zero — no energy anywhere in it. The other builds U by integrating −F, locates the turning
          points by root-finding, and evaluates <b>T = 2∫dx/√(2(E−U)/m)</b> — no clock anywhere in it.
          Their difference is printed.</p>
          <p class="help">Beside them sits a third number that is a <i>prediction</i> rather than a
          measurement: <b>2π√(m/k)</b> with k = −F′ at the equilibrium, which is what the harmonic
          approximation claims. For a linear force it is right at every amplitude. For the default
          stiffening spring it is right only as A → 0, and the panel says by how much it is wrong at the
          amplitude you chose.</p>
          <p class="help">Try <b>−20*x</b> (flat: isochronous), <b>−x^3</b> (period falls as 1/A),
          <b>−9.81*sin(x)</b> (a pendulum in disguise — compare it with the pendulum tab), or
          <b>−20*x + 6</b> (an offset, whose equilibrium is not at the origin and which the panel finds
          for itself).</p>`
        : `<p class="help">Simple harmonic motion is what a restoring force proportional to displacement
      produces: <b>F = −kx</b> gives <b>x″ = −(k/m)x</b>, whose solution is a sinusoid of angular frequency
      <b>ω = √(k/m)</b>. The period does <i>not</i> depend on the amplitude — that is the property that
      made pendulum clocks possible, and it is special to the linear force law.</p>
      <p class="help">${st.kind === 'pend'
        ? 'A pendulum is only <i>approximately</i> harmonic: the restoring torque goes as sin θ, not θ. Push the amplitude past a radian and the exact period — computed here from the elliptic integral — runs measurably slow. At 90° it is 18% longer than the small-angle formula claims.'
        : 'The energy sloshes between kinetic and potential at twice the frequency of the motion, and their sum is flat. Velocity leads displacement by a quarter cycle and acceleration is exactly antiphase with it, which the three curves show at a glance.'}</p>`);
  },
  wire(){
    ctWireSeg('wvSK', v => { ST.kind = v; });
    if(ST.kind === 'well') fnWire('wvSf', (m, s) => { ST.fsrc = s; ST.t = 0; });
    wireSlider('wvSk', () => ST.k, v => { ST.k = v; }, v => fmtNum(+v, 3) + ' N/m');
    wireSlider('wvSm', () => ST.m, v => { ST.m = v; }, v => fmtNum(+v, 3) + ' kg');
    wireSlider('wvSA', () => ST.A, v => { ST.A = v; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('wvSL', () => ST.L, v => { ST.L = v; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('wvSth', () => ST.th0, v => { ST.th0 = v; }, v => ctDeg(+v));
    ctWireChk('wvSrun', v => { ST.run = v; });
  },
  /* the reader's well, its motion, and the period as a function of amplitude */
  frameWell(st, dt, ctx, W, H){
    const D = STAGES.wvSHM.well(st), R = D.R;
    if(!R.ok){
      ctText(ctx, W / 2, H / 2 - 10, 'this force law does not oscillate', rgbCss(TH.neg), '600 15px ' + FONT_UI, 'center');
      ctText(ctx, W / 2, H / 2 + 14, R.why, rgbCss(TH.faint), '13px ' + FONT_UI, 'center');
      return;
    }
    if(st.run) st.t += dt;
    /* left: the potential well, the energy level and the two turning points */
    const pad = 0.32 * (R.xp - R.xm);
    const lo = R.xm - pad, hi = R.xp + pad;
    let umax = R.E;
    for(let i = 0; i <= 120; i++) umax = Math.max(umax, R.U(lo + (hi - lo) * i / 120));
    const half = Math.min(W * 0.5, 620);
    const P = mkPlot(80, 50, half - 124, H - 142, lo, hi, -0.14 * umax, umax * 1.2);
    plotFrame(ctx, P, 'displacement  (m)', 'energy  (J)', 'the well your force digs');
    plotTicksX(ctx, P, [lo, R.eq, hi], v => fmtNum(v, 3));
    /* the harmonic parabola the approximation would have used */
    ctPath(ctx, P, ctSample(x => ({ x, y:0.5 * R.k * (x - R.eq) * (x - R.eq) }), lo, hi, 160),
           rgbCss(TH.warn), 1.8, [6, 4]);
    ctPath(ctx, P, ctSample(x => ({ x, y:R.U(x) }), lo, hi, 220), rgbCss(TH.grad), 3);
    ctPath(ctx, P, [{ x:lo, y:R.E }, { x:hi, y:R.E }], rgbCss(TH.curl), 1.8);
    ctText(ctx, P.X(hi) - 6, P.Y(R.E) - 6, 'E', rgbCss(TH.curl), '600 11px ' + FONT_UI, 'right');
    for(const x of [R.xm, R.xp]) ctDot(ctx, P, x, R.E, 5.5, rgbCss(TH.neg), rgbCss(TH.bg));
    /* the mass itself, riding the well at the energy it was given */
    const ph = 2 * Math.PI * st.t / Math.max(1e-9, R.Tenergy);
    const xNow = (R.xp + R.xm) / 2 + (R.xp - R.xm) / 2 * Math.cos(ph);
    ctDot(ctx, P, xNow, R.U(xNow), 8, rgbCss(TH.pos), rgbCss(TH.bg));
    ctText(ctx, P.px + P.pw / 2, P.py + P.ph - 10,
           'dashed amber is the parabola the harmonic approximation would use instead',
           rgbCss(TH.faint), '11px ' + FONT_UI, 'center');
    /* right: THE POINT — the period against the amplitude */
    const Q = mkPlot(half + 68, 50, Math.max(190, W - half - 132), H - 142, 0,
                     R.sweep.length ? R.sweep[R.sweep.length - 1].A : R.A,
                     0, Math.max(R.Tharm, R.sweep.length ? Math.max.apply(null, R.sweep.map(s => s.T)) : R.Tharm) * 1.2);
    plotFrame(ctx, Q, 'amplitude  (m)', 'period  (s)', 'does the period depend on the amplitude?');
    ctGrid(ctx, Q, null, false);
    plotTicksX(ctx, Q, [0, Q.x1 / 2, Q.x1], v => fmtNum(v, 3));
    ctPath(ctx, Q, [{ x:0, y:R.Tharm }, { x:Q.x1, y:R.Tharm }], rgbCss(TH.warn), 2, [6, 4]);
    ctText(ctx, Q.px + 8, Q.Y(R.Tharm) - 7, '2π√(m/k) — what the harmonic approximation predicts',
           rgbCss(TH.warn), '11px ' + FONT_UI);
    ctPath(ctx, Q, R.sweep.map(s => ({ x:s.A, y:s.T })), rgbCss(TH.grad), 3);
    ctDot(ctx, Q, R.A, R.Tenergy, 6, rgbCss(TH.pos), rgbCss(TH.bg));
    ctText(ctx, Q.px + Q.pw / 2, Q.py + Q.ph - 10,
           R.isoSpread < 1e-6 ? 'flat — this force is isochronous, and that is what makes it simple'
                              : 'not flat: the period moves by ' + fmtNum(100 * R.isoSpread, 4) + '% over this range',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    stageNote(ctx, 'the green curve is the period measured from the energy integral at each amplitude — the amber line is the single number the harmonic approximation offers instead', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.kind === 'well') return STAGES.wvSHM.frameWell(st, dt, ctx, W, H);
    if(st.run) st.t += dt;
    const w = st.kind === 'pend' ? wvOmegaPendulum(st.L) : wvOmegaSpring(st.k, st.m);
    const A = st.kind === 'pend' ? st.th0 : st.A;
    const S = wvSHM(A, w, 0);
    const T = 2 * Math.PI / w;
    /* left: the physical picture */
    const hw = W * 0.34;
    const P = ctBox(hw, H, 0, 0, 1.4, { r:12 });
    ctFrame(ctx, P, st.kind === 'pend' ? 'the pendulum' : 'the oscillator');
    if(st.kind === 'pend'){
      const th = S.x(st.t);
      const bx = st.L * Math.sin(th) / 1.2, by = 0.9 - st.L * Math.cos(th) / 1.2;
      ctPath(ctx, P, [{ x:-0.7, y:0.9 }, { x:0.7, y:0.9 }], rgbCss(TH.line2), 3);
      ctPath(ctx, P, [{ x:0, y:0.9 }, { x:bx, y:by }], rgbCss(TH.faint), 2.4);
      ctParam(ctx, P, u => ({ x:st.L * Math.sin(u) / 1.2, y:0.9 - st.L * Math.cos(u) / 1.2 }),
              -A, A, 60, rgbCss(TH.faint, 0.4), 1.4, [3, 3]);
      ctDot(ctx, P, bx, by, 11, rgbCss(TH.grad), rgbCss(TH.bg));
      ctArrow(ctx, P, bx, by, bx, by - 0.34, rgbCss(TH.neg), 2.2, 'mg');
      ctArrow(ctx, P, bx, by, bx - Math.cos(th) * 0.34 * Math.sin(th), by - Math.sin(th) * 0.34 * Math.sin(th),
              rgbCss(TH.warn), 2.2, null);
    } else {
      const x = S.x(st.t) / Math.max(0.01, A) * 0.55;
      ctPath(ctx, P, [{ x:-0.95, y:-0.5 }, { x:-0.95, y:0.5 }], rgbCss(TH.line2), 3);
      ctx.strokeStyle = rgbCss(TH.faint); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(P.X(-0.95), P.Y(0));
      for(let i = 0; i <= 30; i++){
        const u = i / 30;
        ctx.lineTo(P.X(-0.95 + (x - 0.2 + 0.95) * u), P.Y((i % 2 ? 0.09 : -0.09) * (i > 0 && i < 30 ? 1 : 0)));
      }
      ctx.lineTo(P.X(x - 0.2), P.Y(0)); ctx.stroke();
      ctFill(ctx, P, [{ x:x - 0.2, y:-0.2 }, { x:x + 0.2, y:-0.2 }, { x:x + 0.2, y:0.2 }, { x:x - 0.2, y:0.2 }],
             rgbCss(TH.grad, 0.8));
      ctPath(ctx, P, [{ x:0, y:-0.55 }, { x:0, y:0.55 }], rgbCss(TH.faint, 0.6), 1.4, [4, 4]);
      ctArrow(ctx, P, x, 0.36, x - S.x(st.t) / Math.max(0.01, A) * 0.4, 0.36, rgbCss(TH.neg), 2.2, 'F = −kx');
    }
    /* right: x, v, a and the energy split */
    const x0 = W * 0.36;
    const hp = (H - 168) / 2;
    const Q = mkPlot(x0 + 54, 46, W - x0 - 94, hp, 0, 3 * T, -S.amax * 1.15, S.amax * 1.15);
    plotFrame(ctx, Q, 't  (s)', '', 'x, v and a — each a quarter cycle ahead of the last');
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [0, T, 2 * T, 3 * T], v => fmtNum(v, 3));
    const sc = S.amax / Math.max(1e-9, A);
    plotCurve(ctx, Q, t => S.x(t) * sc, 600, rgbCss(TH.grad), 2.4);
    plotCurve(ctx, Q, t => S.v(t) * S.amax / Math.max(1e-9, S.vmax), 600, rgbCss(TH.curl), 2);
    plotCurve(ctx, Q, t => S.a(t), 600, rgbCss(TH.warn), 2);
    probeLine(ctx, Q, st.t % (3 * T), 't');
    const R = mkPlot(x0 + 54, 46 + hp + 56, W - x0 - 94, hp, 0, 3 * T, 0, 1.15);
    plotFrame(ctx, R, 't  (s)', 'energy fraction', 'kinetic and potential, trading at twice the frequency');
    plotTicksX(ctx, R, [0, T, 2 * T, 3 * T], v => fmtNum(v, 3));
    plotCurve(ctx, R, t => Math.pow(Math.cos(w * t), 2), 600, rgbCss(TH.pos), 2.2);
    plotCurve(ctx, R, t => Math.pow(Math.sin(w * t), 2), 600, rgbCss(TH.curl), 2.2);
    plotCurve(ctx, R, () => 1, 2, rgbCss(TH.warn), 2);
    probeLine(ctx, R, st.t % (3 * T), null);
    stageNote(ctx, 'green: potential · purple: kinetic · orange: their total, which never moves', W, H);
  },
  readout(st){
    if(st.kind === 'well'){
      const R = STAGES.wvSHM.well(st).R;
      if(!R.ok) return `<div class="card tight"><div class="ttl">This force law does not oscillate</div>
        ${kv('F(x)', pkPretty(st.fsrc))}
        ${kv('what went wrong', R.why)}
        <p class="help">An oscillation needs a stable equilibrium — a point where F = 0 and F′ &lt; 0 —
        and an amplitude small enough that the force still pulls back there. Try <b>−20*x − 800*x^3</b>,
        <b>−x^3</b>, or <b>−9.81*sin(x)</b>, or reduce the amplitude.</p></div>`;
      const nm = v => fmtNum(v, 7);
      return `<div class="card tight"><div class="ttl">Your force law</div>
        ${kv('F(x)', pkPretty(st.fsrc))}
        ${kv('equilibrium found at', nm(R.eq) + ' m')}
        ${kv('stiffness there, k = −F′', nm(R.k) + ' N/m')}
        ${kv('mass', fmtNum(R.m, 4) + ' kg')}
        ${kv('released from rest at', nm(R.xp) + ' m')}
        ${kv('turns round again at', nm(R.xm) + ' m')}
        ${kv('asymmetry of the two swings', fmtNum(R.asym, 3) + ' m')}
        <p class="help">The equilibrium was <i>found</i> — every zero of F in the window was located and
        the stable one nearest the origin taken — not assumed to be at x = 0.
        ${R.asym > 1e-6 ? 'The two turning points are not mirror images, so this well is asymmetric and the mass spends longer on one side than the other.' : 'The two turning points are mirror images, so this well is symmetric about its equilibrium.'}</p>
      </div>
      <div class="card tight"><div class="ttl">The period, two ways</div>
        ${kv('from the energy integral', nm(R.Tenergy) + ' s')}
        ${kv('from integrating the motion', R.motionOK ? nm(R.Tmotion) + ' s'
              : (R.escaped ? 'the mass never came back' : 'no second turning point was reached'))}
        ${R.motionOK ? kv('difference', fmtNum(R.gap, 3) + ' s') : ''}
        ${R.motionOK ? kv('verdict', R.gap < 1e-5 * R.Tenergy
            ? '✓ they agree — energy conservation really does fix the period'
            : 'the two disagree; the step is too coarse for a well this sharp') : ''}
        <p class="help">One route builds U by integrating −F, finds the turning points by root-finding
        and evaluates <b>T = 2∫dx/√(2(E−U)/m)</b>; there is no clock in it. The other integrates
        <b>x″ = F(x)/m</b> by Runge–Kutta and reads the period off the times v returns to zero; there is
        no energy in it. Nothing in the code links them, so the row above is the claim that a
        conservative force's period is decided by its potential alone, tested on a force nobody chose.</p>
      </div>
      <div class="card tight"><div class="ttl">${R.harmRel < 1e-6 ? 'The harmonic prediction is exact here' : 'What the harmonic approximation gets wrong'}</div>
        ${kv('2π√(m/k), with k = −F′ at equilibrium', nm(R.Tharm) + ' s')}
        ${kv('the period actually measured', nm(R.Tenergy) + ' s')}
        ${kv('the approximation is out by', fmtNum(100 * R.harmRel, 4) + '%')}
        ${kv('period spread over the swept amplitudes', fmtNum(100 * R.isoSpread, 4) + '%')}
        ${kv('is it isochronous?', R.isoSpread < 1e-6 ? 'yes — the period does not move with amplitude'
              : 'no — the period changes with amplitude, so this is not simple harmonic motion')}
        <p class="help">${R.isoSpread < 1e-6
          ? 'A period independent of amplitude is what <b>simple</b> means, and it happens exactly when the force is exactly proportional to displacement. The curve on the right is flat, and it is flat because F is linear — no other reason is available.'
          : 'The word <b>simple</b> in "simple harmonic motion" is doing real work: it means the period does not depend on the amplitude. Your force is not proportional to displacement, so it does — by ' + fmtNum(100 * R.isoSpread, 4) + '% across the amplitudes swept on the right. Shrink the amplitude and the curve flattens onto the amber line, because every smooth well is a parabola close enough to the bottom; that limit is what the harmonic approximation is, and it is why it is an approximation.'}</p>
      </div>`;
    }
    const w = st.kind === 'pend' ? wvOmegaPendulum(st.L) : wvOmegaSpring(st.k, st.m);
    const A = st.kind === 'pend' ? st.th0 : st.A;
    const S = wvSHM(A, w, 0);
    const x = S.x(st.t);
    const E = st.kind === 'pend' ? null : wvEnergy(st.k, st.A, x);
    const ex = st.kind === 'pend' ? wvPendulumExact(st.L, st.th0) : null;
    return `<div class="card tight"><div class="ttl">The oscillator</div>
      ${st.kind === 'pend' ? kv('length', fmtNum(st.L, 4) + ' m') : kv('k, m', `${fmtNum(st.k, 4)} N/m, ${fmtNum(st.m, 4)} kg`)}
      ${kv('ω', fmtNum(w, 6) + ' rad/s')}
      ${kv('period T = 2π/ω', fmtNum(S.T, 6) + ' s')}
      ${kv('frequency', fmtNum(S.f, 6) + ' Hz')}
      ${kv('amplitude', fmtNum(A, 5) + (st.kind === 'pend' ? ' rad' : ' m'))}
      ${kv('does T depend on amplitude?', st.kind === 'pend' ? 'only through the approximation — see below' : 'no, not at all')}
    </div>
    <div class="card tight"><div class="ttl">At t = ${fmtNum(st.t % S.T, 4)} s</div>
      ${kv('x', fmtNum(x, 6))}
      ${kv('v', fmtNum(S.v(st.t), 6))}
      ${kv('a', fmtNum(S.a(st.t), 6))}
      ${kv('a / x', Math.abs(x) > 1e-6 ? fmtNum(S.a(st.t) / x, 6) : '—')}
      ${kv('−ω²', fmtNum(-w * w, 6))}
      ${kv('v<sub>max</sub> = Aω', fmtNum(S.vmax, 6))}
      ${kv('a<sub>max</sub> = Aω²', fmtNum(S.amax, 6))}
      <p class="help">The ratio a/x is exactly −ω² at every instant — that <i>is</i> simple harmonic
      motion, stated as a differential equation rather than as a shape. Velocity peaks where displacement
      is zero, and acceleration is largest where the object is momentarily at rest.</p>
    </div>
    ${E ? `<div class="card tight"><div class="ttl">Energy</div>
      ${kv('total ½kA²', fmtNum(E.E, 6) + ' J')}
      ${kv('potential ½kx²', fmtNum(E.U, 6) + ' J')}
      ${kv('kinetic', fmtNum(E.K, 6) + ' J')}
      ${kv('fraction potential', fmtNum(E.frac, 5))}
      ${kv('at half amplitude it would be', '0.25')}
      <p class="help">Because U goes as x², the energy is only a quarter potential at half the amplitude —
      the mass spends most of its time near the ends and most of its energy near the middle. Both K and U
      oscillate at <b>2ω</b>, twice the frequency of the motion itself.</p>
    </div>` : ''}
    ${ex ? `<div class="card tight"><div class="ttl">How good is the small-angle approximation?</div>
      ${kv('T₀ = 2π√(L/g)', fmtNum(ex.T0, 7) + ' s')}
      ${kv('the exact period', fmtNum(ex.T, 7) + ' s')}
      ${kv('error', fmtNum(100 * ex.err, 4) + '%')}
      ${kv('the first correction  T₀(1 + θ₀²/16)', fmtNum(ex.series, 7) + ' s')}
      ${kv('amplitude', ctDeg(st.th0))}
      <p class="help">The exact period comes from a complete elliptic integral, evaluated here by adaptive
      quadrature. At 3° the approximation is good to one part in 10⁴; at 90° it is 18% wrong. Huygens knew
      this in 1673 and cut cycloidal cheeks into his clocks to fix it — a genuinely isochronous pendulum
      swings on a cycloid, not a circle.</p>
    </div>` : ''}`;
  },
  chip(st){
    if(st.kind === 'well'){
      const R = STAGES.wvSHM.well(st).R;
      if(!R.ok) return `<div class="k">your force law</div><div>it does not oscillate</div>`;
      return `<div class="k">${R.isoSpread < 1e-6 ? 'isochronous' : 'not isochronous'}</div>
        <div style="color:var(--c-grad)">T = ${fmtNum(R.Tenergy, 6)} s</div>
        <div style="color:var(--c-warn)">2π√(m/k) says ${fmtNum(R.Tharm, 6)} s</div>`;
    }
    const w = st.kind === 'pend' ? wvOmegaPendulum(st.L) : wvOmegaSpring(st.k, st.m);
    return `<div class="k">period</div><div style="color:var(--c-grad)">${fmtNum(2 * Math.PI / w, 6)} s</div>
      <div>ω = ${fmtNum(w, 5)} rad/s</div>`;
  },
  legend(st){
    if(st && st.kind === 'well')
      return [['var(--c-grad)', 'your potential well, and the measured period'],
              ['var(--c-warn)', 'the harmonic parabola, and the period it predicts'],
              ['var(--c-curl)', 'the energy the mass was given'],
              ['var(--c-neg)', 'the turning points'], ['var(--c-pos)', 'the mass, and the amplitude you chose']];
    return [['var(--c-grad)', 'displacement'], ['var(--c-curl)', 'velocity, and kinetic energy'],
            ['var(--c-warn)', 'acceleration, and the total energy'], ['var(--c-pos)', 'potential energy'],
            ['var(--c-neg)', 'the restoring force']]; },
  dockLegend:true
};

/* ---- 5 · waves, standing waves and sound --------------------------------- */
STAGES.wvWave = {
  title:'Waves, standing waves & sound',
  derive(st){
    const n = v => fmtNum(v, 6);
    if(st.mode === 'own'){
      const R = STAGES.wvWave.string(st).R;
      return {
        title:'Two ways to answer “what happens next”, and why they are the same',
        steps:[
          drvSay('a preset mode is a mode because somebody wrote it down as one',
            'Start the string in sin(3πx/L) and of course it stays in sin(3πx/L). Nothing has been demonstrated. Pluck it into a shape that is not a mode and the question becomes real: which modes does it contain, and how do you find out?'),
          drvStep('the modes are orthogonal, which is the whole trick',
            `∫₀ᴸ sin${dfrac(dv('m') + 'π' + dv('x'), dv('L'))} sin${dfrac(dv('n') + 'π' + dv('x'), dv('L'))} ${dv('dx')} ${dop('=')} 0 for ${dv('m')} ${dop('≠')} ${dv('n')}`,
            'so multiplying the shape by one mode and integrating picks out that mode alone'),
          drvStep('which turns the coefficients into integrals',
            `${dv('b')}_n ${dop('=')} ${dfrac('2', dv('L'))}∫₀ᴸ ${dv('y')}(${dv('x')}, 0) sin${dfrac(dv('n') + 'π' + dv('x'), dv('L'))} ${dv('dx')}`,
            `evaluated by quadrature on your shape: b₁ = ${n(R.b[1])}, and the ${R.strongest}th is the largest`),
          drvStep('and every mode then evolves independently',
            `${dv('y')} ${dop('=')} Σ ${dv('b')}_n sin${dfrac(dv('n') + 'π' + dv('x'), dv('L'))} cos${dfrac(dv('n') + 'π' + dv('v') + dv('t'), dv('L'))}`,
            `${R.N} of them are being summed, at frequencies n × ${n(R.f1)} Hz`),
          drvSay('that independence is what a normal mode IS',
            'The wave equation couples every point of the string to its neighbours, which is why the shape changes. In the mode basis it does not couple anything to anything: each coefficient just oscillates. Finding the basis in which a problem falls apart is most of what applied mathematics does, and this is the first place anyone meets it.'),
          drvStep('now solve the same problem without any of that',
            `${dv('y')} ${dop('=')} ${dfrac('1', '2')}[${dv('F')}(${dv('x')} ${dop('−')} ${dv('v')}${dv('t')}) ${dop('+')} ${dv('F')}(${dv('x')} ${dop('+')} ${dv('v')}${dv('t')})]`,
            'with F the odd 2L-periodic extension of the shape — no series, no coefficients, no frequencies'),
          drvSay('the extension is what a fixed end means, translated into arithmetic',
            'A pulse reaching a clamped end comes back inverted. Repeat that at both ends and the shape you have to imagine is odd about each of them, hence odd and 2L-periodic. Then the general solution of the wave equation — any shape going left plus any shape going right — solves the boundary conditions automatically.'),
          drvStep('and the two answers must agree everywhere, at every time',
            `|Σ modes ${dop('−')} d’Alembert| ${dop('=')} ${n(R.gap)} m`,
            `${fmtNum(100 * R.rel, 4)}% of the displacement, with ${R.N} modes kept`),
          drvSay('which is Fourier’s theorem, tested rather than quoted',
            'Nothing in the code links the two routes: one is a sum of ' + R.N + ' sinusoids, the other is a reflected copy of a formula. Their agreement is the claim that the sinusoids are complete — that any shape a string can hold is a sum of its modes. Drop the mode count and watch it fail by a measurable amount.'),
          drvSay('and two convergence rates live here, which is the usual confusion',
            'The energy converges fast — ' + R.n99 + ' mode' + (R.n99 === 1 ? '' : 's') + ' carr' + (R.n99 === 1 ? 'ies' : 'y') + ' 99% of it, because a corner\'s coefficients fall as 1/n² and their squares as 1/n⁴. The shape converges slowly, and the residue sits entirely at the kink, because a corner is exactly what a finite sum of smooth curves cannot make. Getting the sound roughly right is cheap; getting the corner right is not, and that is why a plucked string is bright.'),
          drvSay('and Parseval says the same thing about energy',
            '(L/2)Σbₙ² comes to ' + n(R.parseval) + ' against ∫y² dx = ' + n(R.energy) + '. The shortfall is what the modes you kept have not accounted for, and it can only ever be a shortfall — a truncated series has too little, never too much.'),
          drvSay('one last thing that only a real shape can show',
            'The string returns exactly to its starting form after 2L/v, because every ωₙ is a whole multiple of ω₁ and they all come back into step together. That is why a string sounds like a note. A drum\'s modes go as the zeros of a Bessel function, which stand in no such ratio, so a drum never repeats and sounds like a thud.')
        ],
        note:'The motion is computed twice by routes that share nothing — a sum over modes, which needs every coefficient, and d\'Alembert\'s reflected travelling shapes, which need none. Their largest disagreement is printed, together with the Parseval shortfall, and both shrink as modes are added.'
      };
    }
    return {
      title:'From a travelling disturbance to the notes an instrument can play',
      steps:[
        drvStep('a wave is a shape that moves without changing',
          `${dv('y')}(${dv('x')}, ${dv('t')}) ${dop('=')} ${dv('f')}(${dv('x')} ${dop('−')} ${dv('v')}${dv('t')})`,
          'any function of that combination travels right at speed v, unchanged'),
        drvSay('and that already fixes the wave equation',
          'Differentiate twice in x and twice in t: both give f″, differing by a factor v². So any travelling shape satisfies ∂²y/∂t² = v²∂²y/∂x². The equation is not imposed on waves — it is the condition for a shape to travel.'),
        drvStep('for a sinusoid the parameters are related',
          `${dv('v')} ${dop('=')} ${dv('f')}λ`,
          `λ = ${n(st.lam)} m, f = ${n(st.f)} Hz`),
        drvStep('two waves meeting simply add',
          `${dv('y')} ${dop('=')} ${dv('y')}₁ ${dop('+')} ${dv('y')}₂`,
          'superposition, which holds because the wave equation is linear'),
        drvSay('linearity is why waves pass through each other',
          'Two pulses cross, overlap, and emerge unchanged. Particles could not do that. It works because the equation is linear, and it stops working for waves large enough to make the medium respond nonlinearly — which is why a shock wave is a different phenomenon from a sound wave.'),
        drvStep('a wave meeting its own reflection makes a standing pattern',
          `sin(${dv('k')}${dv('x')} ${dop('−')} ω${dv('t')}) ${dop('+')} sin(${dv('k')}${dv('x')} ${dop('+')} ω${dv('t')}) ${dop('=')} 2 sin ${dv('k')}${dv('x')} cos ω${dv('t')}`,
          'a product of a fixed shape in x and an oscillation in t — nothing travels'),
        drvSay('the trigonometric identity is doing all the work',
          'Sum-to-product turns two travelling waves into one standing pattern. The x-dependence and the t-dependence have separated, so the nodes stay where they are forever. That separation is why the pattern looks stationary despite being made of two things moving in opposite directions.'),
        drvStep('the boundary conditions then select which wavelengths survive',
          `${dv('L')} ${dop('=')} ${dv('n')}${dfrac('λ', '2')}`,
          `L = ${n(st.L)} m, so the ${st.n}th harmonic has λ = ${n(2 * st.L / st.n)} m`),
        drvSay('and that is why instruments have discrete notes',
          'A string fixed at both ends can only hold whole numbers of half-wavelengths. Everything else destroys itself by interference. The quantisation of pitch is a boundary-value problem — and the same argument, applied to a wavefunction in a box, is where quantised energy levels come from.'),
        drvStep('beats are the same superposition at two close frequencies',
          `${dv('f')}_beat ${dop('=')} |${dv('f')}₁ ${dop('−')} ${dv('f')}₂|`,
          `${n(st.f1)} and ${n(st.f2)} Hz give ${n(Math.abs(st.f1 - st.f2))} beats per second — which is how an instrument is tuned by ear`),
        drvStep('and the Doppler shift is a change of what arrives, not of what is emitted',
          `${dv('f')}′ ${dop('=')} ${dv('f')}${dfrac(dv('v'), dv('v') + ' ∓ ' + dv('v') + 'ₛ')}`,
          'the source outruns its own crests, compressing them ahead and stretching them behind')
      ],
      note:'The standing pattern here is built by adding two counter-propagating travelling waves numerically, not by plotting the product formula. That the nodes stay fixed is therefore a result of the superposition rather than an assumption.'
    };
  },
  enter(st, o){
    st.mode = o.mode || 'travel';
    st.lam = 0.5; st.f = 2; st.A = 0.3;
    st.pipe = 'string'; st.n = 3; st.L = 1;
    st.f1 = 440; st.f2 = 444;
    st.vs = 30; st.f0 = 500;
    st.t = 0;
    /* a plucked string: a corner, which is the expensive shape and the point */
    st.ysrc = o.ysrc || '0.06*min(x/0.3, (1-x)/0.7)';
    st.v = o.v || 2; st.N = o.N || 12;
  },
  /* the reader's pluck: its modes, and both routes to what happens next */
  string(st){
    const key = st.ysrc + '|' + st.L + '|' + st.v + '|' + st.N;
    if(st._sk === key) return st._sd;
    st._sk = key;
    const g = pkCompile(st.ysrc);
    const L = Math.max(0.05, st.L);
    /* the shape is scaled to the string's length, so changing L moves the kink
       with it rather than running the formula off the end */
    const y0 = x => { const v = g(x / L, 0, 0); return Number.isFinite(v) ? v : 0; };
    st._sd = { y0, L, R:wvStringRun(y0, L, Math.max(0.05, st.v), Math.max(1, Math.round(st.N)), { nx:200, nt:5 }) };
    return st._sd;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('wvWM', st.mode, [['travel', 'travelling & superposition'], ['stand', 'standing waves'],
                                         ['own', 'pluck it into a shape of your own'],
                                         ['beat', 'beats'], ['dopp', 'Doppler']]);
    let s = '';
    if(st.mode === 'own') s = fnHtml('wvWy', 'initial shape y(x) =', st.ysrc,
        'x — the fraction of the way along the string, 0 at one fixed end and 1 at the other') +
      ctlRow('length L', ctlSlider('wvWL', 0.3, 2, 0.02, st.L)) +
      ctlRow('wave speed v', ctlSlider('wvWv', 0.4, 6, 0.1, st.v)) +
      ctlRow('modes kept N', ctlSlider('wvWN', 1, 64, 1, st.N));
    else if(st.mode === 'travel') s = ctlRow('λ', ctlSlider('wvWl', 0.15, 1.4, 0.01, st.lam)) +
      ctlRow('f', ctlSlider('wvWf', 0.3, 5, 0.05, st.f));
    else if(st.mode === 'stand') s = ctSeg('wvWp', st.pipe, [['string', 'string'], ['openPipe', 'open pipe'], ['closedPipe', 'closed pipe']]) +
      ctlRow('harmonic n', ctlSlider('wvWn', 1, 7, 1, st.n)) + ctlRow('length', ctlSlider('wvWL', 0.3, 2, 0.02, st.L));
    else if(st.mode === 'beat') s = ctlRow('f₁', ctlSlider('wvWf1', 420, 460, 0.5, st.f1)) +
      ctlRow('f₂', ctlSlider('wvWf2', 420, 460, 0.5, st.f2));
    else s = ctlRow('source speed', ctlSlider('wvWvs', -400, 400, 1, st.vs)) +
      ctlRow('emitted f₀', ctlSlider('wvWf0', 100, 1200, 5, st.f0));
    const help = {
      travel:'A travelling wave <b>y = A sin(kx − ωt)</b> carries energy without carrying matter: each piece of the medium moves up and down while the pattern moves sideways at <b>v = fλ</b>. Two waves in the same place simply <b>add</b> — superposition — and every interference effect in physics is that one sentence applied carefully.',
      stand:'Two identical waves travelling opposite ways make a pattern whose <b>nodes never move</b>. Boundaries force the pattern to fit, and that is what quantises the modes: a string fixed at both ends admits only whole numbers of half-wavelengths. A pipe closed at one end fits an <i>odd</i> number of quarter-wavelengths, so it has only odd harmonics and sounds an octave lower than an open pipe of the same length — a clarinet against a flute.',
      beat:'Two nearby frequencies added together give a fast oscillation inside a slow envelope. The envelope repeats at the <b>difference</b> frequency, and since the ear hears loudness rather than sign it perceives <b>|f₁ − f₂|</b> beats per second. Tune the two together and the beats slow to nothing — which is exactly how a piano is tuned.',
      dopp:'A moving source runs into its own wavefronts ahead and stretches them behind, so the pitch rises approaching and falls receding. Source motion and observer motion are <b>not</b> symmetric, because the medium picks out a frame — unlike relativistic Doppler, where no such frame exists. Push the source past the speed of sound and the wavefronts pile into a cone: the shock wave, with half-angle arcsin(1/M).',
      own:'A preset mode is a mode because somebody wrote it down as one. Pluck the string into an <b>arbitrary</b> shape and the question becomes which modes it contains — which is Fourier\'s theorem doing work rather than being quoted: <b>bₙ = (2/L)∫y(x,0) sin(nπx/L) dx</b>, evaluated by quadrature.'
    }[st.mode];
    return seg + s + `<p class="help">${help}</p>` + (st.mode !== 'own' ? '' :
      `<p class="help">The motion that follows is then computed <b>twice, by routes that share nothing</b>.
      The <b>modal</b> route adds up ${'​'}bₙ sin(nπx/L) cos(nπvt/L) — every mode standing still and
      breathing at its own frequency, which needs all the coefficients. <b>D'Alembert's</b> route writes
      <b>y = ½[F(x−vt) + F(x+vt)]</b> where F is the odd 2L-periodic extension of the shape you drew: two
      copies of it running in opposite directions, reflecting off the ends. That route has no series in it,
      no coefficients and no frequencies at all. The panel prints how far apart they are.</p>
      <p class="help">Drop the mode count and watch the gap open. A <b>kink</b> is the expensive case —
      the default plucked shape is a corner, and a corner needs every harmonic there is, which is why a
      plucked guitar string is bright and a struck tuning fork is dull. Parseval says the energy in the
      modes must equal the energy in the shape; the shortfall is precisely how much of your pluck the
      first N modes have failed to account for.</p>
      <p class="help">Try <b>0.05*sin(3*pi*x)</b> and exactly one coefficient survives. Try
      <b>0.05*sin(pi*x)*sin(pi*x)</b>, or <b>0.1*x*(1-x)</b>, or move the kink by editing the two
      fractions in the default.</p>`);
  },
  wire(){
    ctWireSeg('wvWM', v => { ST.mode = v; });
    ctWireSeg('wvWp', v => { ST.pipe = v; });
    if(ST.mode === 'own'){
      fnWire('wvWy', (m, s) => { ST.ysrc = s; ST.t = 0; });
      wireSlider('wvWv', () => ST.v, v => { ST.v = v; }, v => fmtNum(+v, 3) + ' m/s');
      wireSlider('wvWN', () => ST.N, v => { ST.N = Math.max(1, Math.round(v)); }, v => Math.round(v) + ' modes');
    }
    wireSlider('wvWl', () => ST.lam, v => { ST.lam = v; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('wvWf', () => ST.f, v => { ST.f = v; }, v => fmtNum(+v, 3) + ' Hz');
    wireSlider('wvWn', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
    wireSlider('wvWL', () => ST.L, v => { ST.L = v; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('wvWf1', () => ST.f1, v => { ST.f1 = v; }, v => fmtNum(+v, 4) + ' Hz');
    wireSlider('wvWf2', () => ST.f2, v => { ST.f2 = v; }, v => fmtNum(+v, 4) + ' Hz');
    wireSlider('wvWvs', () => ST.vs, v => { ST.vs = v; }, v => fmtNum(+v, 4) + ' m/s');
    wireSlider('wvWf0', () => ST.f0, v => { ST.f0 = v; }, v => fmtNum(+v, 4) + ' Hz');
  },
  /* the pluck, both routes to its motion, and the modes it turned out to hold */
  frameOwn(st, ctx, W, H){
    const D = STAGES.wvWave.string(st), R = D.R, L = D.L;
    let ymax = 1e-6;
    for(let i = 0; i <= 200; i++) ymax = Math.max(ymax, Math.abs(D.y0(L * i / 200)));
    const t = st.t % R.period;
    const half = Math.min(W * 0.56, 760);
    const P = mkPlot(84, 50, half - 128, H - 142, 0, L, -ymax * 1.45, ymax * 1.45);
    plotFrame(ctx, P, 'position along the string  (m)', 'displacement  (m)',
              'your pluck, moving');
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [0, L / 2, L], v => fmtNum(v, 3));
    /* the shape it started as, faint, for reference */
    ctPath(ctx, P, ctSample(x => ({ x, y:D.y0(x) }), 0, L, 240), rgbCss(TH.faint, 0.5), 1.4, [5, 4]);
    /* the two routes, drawn on top of each other — the thick one is d'Alembert
       so the thin modal curve shows through wherever the series falls short */
    ctPath(ctx, P, ctSample(x => ({ x, y:R.dal(x, t) }), 0, L, 400), rgbCss(TH.grad), 4);
    ctPath(ctx, P, ctSample(x => ({ x, y:R.modal(x, t) }), 0, L, 400), rgbCss(TH.warn), 1.8);
    for(const x of [0, L]) ctDot(ctx, P, x, 0, 5, rgbCss(TH.neg));
    ctText(ctx, P.px + P.pw / 2, P.py + P.ph - 10,
           'thick green is d’Alembert · thin amber is the sum of ' + R.N + ' modes',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    /* the spectrum: which modes your shape actually contains */
    const Q = mkPlot(half + 66, 50, Math.max(190, W - half - 130), H - 142,
                     0.4, R.N + 0.6, 0, Math.max.apply(null, Array.from(R.b).map(Math.abs)) * 1.2 + 1e-9);
    plotFrame(ctx, Q, 'harmonic n', 'coefficient |b_n|  (m)', 'the modes your shape contains');
    plotTicksX(ctx, Q, R.N <= 12 ? Array.from({ length:R.N }, (_, i) => i + 1) : [1, Math.round(R.N / 2), R.N],
               v => String(v));
    for(let n = 1; n <= R.N; n++){
      const h = Math.abs(R.b[n]);
      ctx.fillStyle = rgbCss(n === R.strongest ? TH.pos : TH.curl, 0.85);
      const x0 = Q.X(n - 0.34), x1 = Q.X(n + 0.34);
      ctx.fillRect(x0, Q.Y(h), Math.max(1, x1 - x0), Q.Y(0) - Q.Y(h));
    }
    /* above the bars, not across them: this panel's marks reach the axis, so a
       caption at the foot of the frame lands on top of the data */
    ctText(ctx, Q.px + Q.pw / 2, Q.py + 16,
           R.n99 + ' of them carry 99% of the energy — the shape needs many more',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    stageNote(ctx, 'drop the mode count and the amber curve peels away from the green one — a corner needs every harmonic there is', W, H);
  },
  frame(st, dt, ctx, W, H){
    st.t += dt;
    if(st.mode === 'own') return STAGES.wvWave.frameOwn(st, ctx, W, H);
    if(st.mode === 'dopp') return this.frameDopp(st, ctx, W, H);
    if(st.mode === 'beat'){
      const B = wvBeats(st.f1, st.f2, 1);
      const T = 4 / Math.max(0.5, B.fBeat);
      const P = mkPlot(84, 48, W - 132, H - 138, 0, T, -2.3, 2.3);
      plotFrame(ctx, P, 't  (s)', 'pressure', `${fmtNum(st.f1, 4)} Hz + ${fmtNum(st.f2, 4)} Hz  —  ${fmtNum(B.fBeat, 4)} beats per second`);
      plotZeroY(ctx, P);
      plotTicksX(ctx, P, [0, T / 2, T], v => fmtNum(v, 4));
      plotCurve(ctx, P, t => B.env(t), 900, rgbCss(TH.warn, 0.9), 1.8);
      plotCurve(ctx, P, t => -B.env(t), 900, rgbCss(TH.warn, 0.9), 1.8);
      plotCurve(ctx, P, t => B.y(t), 3000, rgbCss(TH.grad), 1.5);
      stageNote(ctx, 'the orange envelope repeats at the difference frequency — that is what the ear hears as a beat', W, H);
      return;
    }
    if(st.mode === 'stand'){
      const v = 340;
      const M = wvMode(st.pipe, st.L, st.n, v);
      const S = wvStanding(0.35, M.lam, 1.2);
      const P = ctBox(W, H, st.L / 2, 0, st.L * 0.72);
      ctFrame(ctx, P, `${WV_MODES[st.pipe].name}  —  harmonic ${M.harmonic},  λ = ${fmtNum(M.lam, 4)} m,  f = ${fmtNum(M.f, 5)} Hz`);
      ctPath(ctx, P, [{ x:0, y:0 }, { x:st.L, y:0 }], rgbCss(TH.line2), 1.6);
      /* the ends */
      const closed = st.pipe === 'closedPipe';
      for(const [x, hard] of [[0, true], [st.L, !closed ? (st.pipe === 'string') : false]]){
        ctPath(ctx, P, [{ x, y:-0.55 }, { x, y:0.55 }], rgbCss(hard ? TH.neg : TH.pos), 3.4);
      }
      /* the envelope and the instantaneous shape */
      const shape = ph => x => (st.pipe === 'closedPipe'
        ? 2 * 0.35 * Math.sin(2 * Math.PI * x / M.lam) * Math.cos(ph)
        : st.pipe === 'openPipe'
        ? 2 * 0.35 * Math.cos(2 * Math.PI * x / M.lam) * Math.cos(ph)
        : 2 * 0.35 * Math.sin(2 * Math.PI * x / M.lam) * Math.cos(ph));
      ctParam(ctx, P, x => ({ x, y:shape(0)(x) }), 0, st.L, 400, rgbCss(TH.faint, 0.5), 1.4);
      ctParam(ctx, P, x => ({ x, y:-shape(0)(x) }), 0, st.L, 400, rgbCss(TH.faint, 0.5), 1.4);
      for(let k = 0; k < 5; k++)
        ctParam(ctx, P, x => ({ x, y:shape(k * 0.6)(x) }), 0, st.L, 400, rgbCss(TH.faint, 0.25), 1);
      ctParam(ctx, P, x => ({ x, y:shape(st.t * 6)(x) }), 0, st.L, 500, rgbCss(TH.grad), 3);
      /* nodes */
      for(let m = 0; m * M.lam / 2 <= st.L + 1e-9; m++){
        const xn = st.pipe === 'openPipe' ? (2 * m + 1) * M.lam / 4 : m * M.lam / 2;
        if(xn > st.L + 1e-9) break;
        ctDot(ctx, P, xn, 0, 5, rgbCss(TH.warn), rgbCss(TH.bg));
      }
      stageNote(ctx, 'orange dots are nodes — they never move, whatever the wave does between them', W, H);
      return;
    }
    /* travelling waves and superposition */
    const w1 = wvTravel(st.A, st.lam, st.f, 1);
    const w2 = wvTravel(st.A, st.lam, st.f, -1);
    const hp = (H - 170) / 3;
    const mk = i => mkPlot(84, 48 + i * (hp + 22), W - 132, hp, 0, 3, -0.75, 0.75);
    const titles = ['one wave travelling right', 'one travelling left', 'their sum — a standing wave'];
    const fns = [x => w1.y(x, st.t), x => w2.y(x, st.t), x => w1.y(x, st.t) + w2.y(x, st.t)];
    const cols = [TH.grad, TH.curl, TH.warn];
    for(let i = 0; i < 3; i++){
      const P = mk(i);
      plotFrame(ctx, P, i === 2 ? 'x  (m)' : '', 'y', titles[i]);
      plotZeroY(ctx, P);
      plotTicksX(ctx, P, [0, 1, 2, 3], v => String(v));
      if(i === 2){
        plotCurve(ctx, P, x => 2 * st.A * Math.sin(w1.k * x), 400, rgbCss(TH.faint, 0.6), 1.4);
        plotCurve(ctx, P, x => -2 * st.A * Math.sin(w1.k * x), 400, rgbCss(TH.faint, 0.6), 1.4);
      }
      plotCurve(ctx, P, fns[i], 900, rgbCss(cols[i]), 2.4);
      /* a marker riding the medium, to show it only moves vertically */
      ctx.fillStyle = rgbCss(TH.neg);
      ctx.beginPath(); ctx.arc(P.X(1.5), P.Y(fns[i](1.5)), 4, 0, 6.2832); ctx.fill();
    }
    stageNote(ctx, 'the red dot never moves sideways — the pattern travels, the medium does not', W, H);
  },
  frameDopp(st, ctx, W, H){
    const v = 343;
    const P = ctBox(W, H, 0, 0, 900);
    ctGrid(ctx, P, undefined, false);
    const D = wvDoppler(st.f0, st.vs, 0, v, true);
    ctFrame(ctx, P, D.sonic ? `Mach ${fmtNum(D.mach, 4)} — a shock cone` : 'wavefronts from a moving source');
    /* wavefronts emitted at earlier times, each centred where the source then was */
    const dtE = 1 / Math.max(1, st.f0) * 40;
    for(let k = 1; k <= 14; k++){
      const tAgo = k * dtE;
      const cx = -st.vs * tAgo;
      const r = v * tAgo;
      if(r > 1400) continue;
      ctx.strokeStyle = rgbCss(TH.grad, 0.55); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(P.X(cx), P.Y(0), r * P.u, 0, 6.2832); ctx.stroke();
    }
    ctDot(ctx, P, 0, 0, 8, rgbCss(TH.warn), rgbCss(TH.bg));
    if(Math.abs(st.vs) > 1) ctArrow(ctx, P, 0, 0, Math.sign(st.vs) * 260, 0, rgbCss(TH.warn), 2.6, 'v_s');
    ctDot(ctx, P, 700, 0, 7, rgbCss(TH.curl), rgbCss(TH.bg));
    ctText(ctx, P.X(700), P.Y(0) - 16, 'observer', rgbCss(TH.curl), '600 11px ' + FONT_UI, 'center');
    if(D.sonic && Number.isFinite(D.coneAngle)){
      for(const s of [1, -1]){
        const L2 = 1500;
        ctPath(ctx, P, [{ x:0, y:0 },
          { x:-Math.sign(st.vs) * L2 * Math.cos(D.coneAngle), y:s * L2 * Math.sin(D.coneAngle) }],
          rgbCss(TH.neg), 2.4);
      }
    }
    stageNote(ctx, 'each circle was emitted one period earlier from where the source then was', W, H);
  },
  readout(st){
    if(st.mode === 'dopp'){
      const v = 343;
      const A = wvDoppler(st.f0, st.vs, 0, v, true);
      const R = wvDoppler(st.f0, st.vs, 0, v, false);
      const obsA = wvDoppler(st.f0, 0, Math.abs(st.vs), v, true);
      return `<div class="card tight"><div class="ttl">A moving source</div>
        ${kv('emitted f₀', fmtNum(st.f0, 5) + ' Hz')}
        ${kv('source speed', fmtNum(st.vs, 4) + ' m/s')}
        ${kv('sound speed', fmtNum(v, 4) + ' m/s')}
        ${kv('approaching  f₀v/(v−v_s)', fmtNum(A.f, 6) + ' Hz')}
        ${kv('receding  f₀v/(v+v_s)', fmtNum(R.f, 6) + ' Hz')}
        ${kv('the drop as it passes', fmtNum(A.f - R.f, 5) + ' Hz')}
        ${kv('Mach number', fmtNum(A.mach, 5))}
        ${kv('shock cone?', A.sonic ? 'yes, half-angle ' + ctDeg(A.coneAngle) : 'no')}
      </div>
      <div class="card tight"><div class="ttl">Source motion is not the same as observer motion</div>
        ${kv('source approaching at ' + fmtNum(Math.abs(st.vs), 4), fmtNum(A.f, 6) + ' Hz')}
        ${kv('observer approaching at the same speed', fmtNum(obsA.f, 6) + ' Hz')}
        ${kv('difference', fmtNum(Math.abs(A.f - obsA.f), 5) + ' Hz')}
        <p class="help">The two are <i>not</i> equal, and that asymmetry is a fingerprint of the medium: a
        moving source compresses the wavelength, a moving observer meets the wavefronts more often. Only
        one of those is a property of the wave itself.</p>
        <p class="help">Light has no medium, and its Doppler shift depends only on the <b>relative</b>
        velocity — the relativity wing computes it from the invariant interval instead, and there is no
        analogue of the sonic cone because nothing overtakes light.</p>
      </div>`;
    }
    if(st.mode === 'own'){
      const D = STAGES.wvWave.string(st), R = D.R;
      const nm = v => fmtNum(v, 6);
      return `<div class="card tight"><div class="ttl">Your pluck</div>
        ${kv('y(x) at t = 0', pkPretty(st.ysrc))}
        ${kv('string length', nm(R.L) + ' m')}
        ${kv('wave speed', nm(R.v) + ' m/s')}
        ${kv('fundamental f₁ = v/2L', nm(R.f1) + ' Hz')}
        ${kv('it repeats itself every 2L/v', nm(R.period) + ' s')}
        <p class="help">The string returns <i>exactly</i> to its starting shape after 2L/v, and that is
        not a coincidence of this shape: every mode frequency is a whole multiple of the first, so they all
        come back into step together. That is what makes a string sound like a note. A drum's modes go as
        the zeros of a Bessel function, which are in no such ratio, and a drum sounds like a thud.</p>
      </div>
      <div class="card tight"><div class="ttl">The modes it turned out to contain</div>
        ${Array.from({ length:Math.min(8, R.N) }, (_, i) =>
          kv('b<sub>' + (i + 1) + '</sub>', nm(R.b[i + 1]) + ' m')).join('')}
        ${R.N > 8 ? kv('…and ' + (R.N - 8) + ' more', 'the spectrum on the right shows them all') : ''}
        ${kv('strongest', 'the ' + R.strongest + (R.strongest === 1 ? 'st' : R.strongest === 2 ? 'nd' : R.strongest === 3 ? 'rd' : 'th') + ' harmonic')}
        ${kv('modes carrying 99% of the energy', String(R.n99))}
        <p class="help">Nobody chose these. Each is <b>(2/L)∫y(x,0) sin(nπx/L) dx</b>, evaluated by
        quadrature on the shape you typed.</p>
        <p class="help">Two rates of convergence live here and they are not the same, which is worth
        pinning down because it is the usual confusion. The <b>energy</b> converges fast: only
        ${R.n99} mode${R.n99 === 1 ? '' : 's'} ${R.n99 === 1 ? 'is' : 'are'} needed for 99% of it,
        because a plucked corner's coefficients fall as 1/n² and so their squares fall as 1/n⁴. The
        <b>shape</b> converges slowly: the gap to d'Alembert below is still
        ${fmtNum(100 * R.rel, 3)}% with ${R.N} modes, and it is all concentrated at the kink, because a
        corner is precisely what a finite sum of smooth curves cannot make. Getting the sound roughly
        right is cheap; getting the corner right is not.</p>
      </div>
      <div class="card tight"><div class="ttl">Fourier against d’Alembert</div>
        ${kv('largest gap between the two routes', fmtNum(R.gap, 3) + ' m')}
        ${kv('as a fraction of the displacement', fmtNum(R.rel, 3))}
        ${kv('modes kept', String(R.N))}
        ${kv('verdict', R.rel < 0.01 ? '✓ the series has caught the shape'
              : 'the series is still short of it — add modes and watch this fall')}
        <p class="help">The green curve is <b>½[F(x−vt) + F(x+vt)]</b> with F the odd 2L-periodic
        extension of your shape: two copies of the pluck running in opposite directions and reflecting off
        the ends. It contains no series, no coefficients and no frequencies. The amber curve is the sum of
        the ${R.N} modes above. They are the same function, and nothing in the code arranges that — so the
        gap is Fourier's theorem being <i>tested on a shape nobody chose</i>.</p>
      </div>
      <div class="card tight"><div class="ttl">Parseval — is any energy missing?</div>
        ${kv('∫y² dx over the shape', nm(R.energy))}
        ${kv('(L/2)Σb<sub>n</sub>² over the modes', nm(R.parseval))}
        ${kv('shortfall', fmtNum(R.parsevalGap, 3))}
        ${kv('as a fraction', fmtNum(R.parsevalRel, 3))}
        <p class="help">Energy cannot hide. Whatever the first ${R.N} modes fail to account for shows up
        here as a shortfall, and it is always a shortfall — a truncated series can only ever have too
        little. Raise the mode count and both this and the gap above shrink together, because they are two
        measurements of the same thing.</p>
      </div>`;
    }
    if(st.mode === 'beat'){
      const B = wvBeats(st.f1, st.f2, 1);
      return `<div class="card tight"><div class="ttl">Two tones together</div>
        ${kv('f₁', fmtNum(st.f1, 5) + ' Hz')}${kv('f₂', fmtNum(st.f2, 5) + ' Hz')}
        ${kv('carrier (f₁+f₂)/2', fmtNum(B.fCarrier, 6) + ' Hz')}
        ${kv('envelope frequency |f₁−f₂|/2', fmtNum(B.fBeat / 2, 6) + ' Hz')}
        ${kv('beats heard per second', fmtNum(B.fBeat, 6))}
        ${kv('time between beats', fmtNum(1 / Math.max(1e-9, B.fBeat), 6) + ' s')}
        <p class="help">The identity is <b>sin A + sin B = 2 sin((A+B)/2) cos((A−B)/2)</b>: a fast tone at
        the mean frequency, multiplied by a slow cosine. The cosine passes through zero twice per cycle and
        the ear does not hear sign, so the <i>audible</i> beat rate is |f₁ − f₂| and not half of it.</p>
      </div>
      <div class="card tight"><div class="ttl">Tuning by ear</div>
        ${kv('mistuning', fmtNum(Math.abs(st.f1 - st.f2), 5) + ' Hz')}
        ${kv('in cents', fmtNum(1200 * Math.log2(Math.max(st.f1, st.f2) / Math.min(st.f1, st.f2)), 4))}
        <p class="help">A trained ear resolves a beat rate of about 0.2 Hz, which at 440 Hz is under one
        cent — far finer than anyone can judge a pitch in isolation. That is why every piano tuner works
        with beats rather than with absolute pitch, and why the method survives electronic tuners.</p>
      </div>`;
    }
    if(st.mode === 'stand'){
      const v = 340;
      const M = wvMode(st.pipe, st.L, st.n, v);
      const rows = [];
      for(let n = 1; n <= 5; n++){
        const m = wvMode(st.pipe, st.L, n, v);
        rows.push(kv('mode ' + n, `harmonic ${m.harmonic},  λ = ${fmtNum(m.lam, 4)} m,  f = ${fmtNum(m.f, 5)} Hz`));
      }
      return `<div class="card tight"><div class="ttl">${WV_MODES[st.pipe].name}</div>
        ${kv('length', fmtNum(st.L, 4) + ' m')}
        ${kv('wave speed', fmtNum(v, 4) + ' m/s')}
        ${kv('λ for mode ' + st.n, fmtNum(M.lam, 5) + ' m')}
        ${kv('frequency', fmtNum(M.f, 6) + ' Hz')}
        ${kv('harmonic number', String(M.harmonic))}
        ${kv('fundamental', fmtNum(wvMode(st.pipe, st.L, 1, v).f, 6) + ' Hz')}
        ${kv('this mode ÷ fundamental', fmtNum(M.f / wvMode(st.pipe, st.L, 1, v).f, 5))}
      </div>
      <div class="card tight"><div class="ttl">The first five modes</div>
        ${rows.join('')}
        <p class="help">${WV_MODES[st.pipe].note}</p>
      </div>
      <div class="card tight"><div class="ttl">The same length, three boundaries</div>
        ${['string', 'openPipe', 'closedPipe'].map(k =>
          kv(WV_MODES[k].name.split(' ')[0] + ' fundamental', fmtNum(wvMode(k, st.L, 1, v).f, 5) + ' Hz')).join('')}
        <p class="help">A closed pipe sounds an octave below an open one of the same length, and supplies
        only odd harmonics. That is the whole difference between a clarinet and a flute — and it is why a
        clarinet's lowest note is so much lower than its size suggests.</p>
      </div>`;
    }
    const w1 = wvTravel(st.A, st.lam, st.f, 1);
    return `<div class="card tight"><div class="ttl">The travelling wave</div>
      ${kv('wavelength λ', fmtNum(st.lam, 5) + ' m')}
      ${kv('frequency f', fmtNum(st.f, 5) + ' Hz')}
      ${kv('period T = 1/f', fmtNum(1 / st.f, 6) + ' s')}
      ${kv('wave number k = 2π/λ', fmtNum(w1.k, 6) + ' rad/m')}
      ${kv('angular frequency ω = 2πf', fmtNum(w1.w, 6) + ' rad/s')}
      ${kv('speed v = ω/k = fλ', fmtNum(w1.v, 6) + ' m/s')}
    </div>
    <div class="card tight"><div class="ttl">What moves, and what does not</div>
      ${kv('the pattern moves at', fmtNum(w1.v, 5) + ' m/s')}
      ${kv('the medium moves at up to', fmtNum(2 * Math.PI * st.f * st.A, 5) + ' m/s')}
      ${kv('and its net displacement is', '0 — it returns every period')}
      <p class="help">A wave transports energy and momentum, not matter. The marked point on the medium
      oscillates vertically and ends where it began; only the <i>shape</i> travels. The two speeds above are
      independent, which is why a violent wave in a slow medium is perfectly possible.</p>
    </div>
    <div class="card tight"><div class="ttl">Superposition</div>
      ${kv('the sum of the two waves', 'a standing wave')}
      ${kv('node spacing λ/2', fmtNum(st.lam / 2, 5) + ' m')}
      ${kv('antinode amplitude 2A', fmtNum(2 * st.A, 5))}
      <p class="help">Adding the two travelling waves gives <b>2A sin(kx)·cos(ωt)</b> — the x and t
      dependence have <i>separated</i>, so the shape no longer moves. Nodes sit where sin(kx) = 0 and stay
      there forever. Every musical instrument, every laser cavity and every electron orbital is this
      separation in a different setting.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'own'){
      const R = STAGES.wvWave.string(st).R;
      return `<div class="k">${R.N} modes kept</div>
        <div style="color:var(--c-pos)">the ${R.strongest}${R.strongest === 1 ? 'st' : R.strongest === 2 ? 'nd' : R.strongest === 3 ? 'rd' : 'th'} is strongest</div>
        <div style="color:${R.rel < 0.01 ? 'var(--c-grad)' : 'var(--c-warn)'}">Fourier v d’Alembert: ${fmtNum(100 * R.rel, 4)}%</div>`;
    }
    if(st.mode === 'dopp'){ const D = wvDoppler(st.f0, st.vs, 0, 343, true);
      return `<div class="k">Doppler</div><div style="color:var(--c-grad)">${fmtNum(D.f, 6)} Hz</div>
        <div>Mach ${fmtNum(D.mach, 4)}</div>`; }
    if(st.mode === 'beat') return `<div class="k">beats</div>
      <div style="color:var(--c-warn)">${fmtNum(Math.abs(st.f1 - st.f2), 4)} per second</div>`;
    if(st.mode === 'stand'){ const M = wvMode(st.pipe, st.L, st.n, 340);
      return `<div class="k">harmonic ${M.harmonic}</div><div style="color:var(--c-grad)">${fmtNum(M.f, 6)} Hz</div>`; }
    return `<div class="k">v = fλ</div><div style="color:var(--c-grad)">${fmtNum(st.f * st.lam, 5)} m/s</div>`;
  },
  legend(st){
    if(st && st.mode === 'own')
      return [['var(--c-grad)', 'd’Alembert — two reflected copies of your pluck'],
              ['var(--c-warn)', 'the sum of the modes kept'],
              ['var(--c-curl)', 'the coefficients b_n'], ['var(--c-pos)', 'the strongest harmonic'],
              ['var(--c-neg)', 'the fixed ends']];
    return [['var(--c-grad)', 'the wave'], ['var(--c-curl)', 'the second wave, or the observer'],
            ['var(--c-warn)', 'their sum, nodes, or the source'], ['var(--c-neg)', 'a point of the medium']]; },
  dockLegend:true
};
