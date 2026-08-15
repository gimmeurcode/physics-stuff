STAGES.odSpring = {
  title:'Oscillators & resonance',
  derive(st){
    const n = v => fmtNum(v, 6);
    const w0 = Math.sqrt(st.k / st.m);
    const z = st.gam / (2 * Math.sqrt(st.m * st.k));
    const peak = w0 * Math.sqrt(Math.max(0, 1 - 2 * z * z));
    return {
      title:'Where the resonance peak actually sits, and why it is not ω₀',
      steps:[
        drvStep('the equation, from Newton\'s second law with two forces',
          `${dv('m')}${dv('x')}″ ${dop('+')} γ${dv('x')}′ ${dop('+')} ${dv('k')}${dv('x')} ${dop('=')} ${dv('F')}₀cos ω${dv('t')}`,
          `m = ${n(st.m)}, γ = ${n(st.gam)}, k = ${n(st.k)}`),
        drvSay('solve it with complex exponentials rather than trigonometry',
          'Write the drive as the real part of F₀e^(iωt) and look for x = Re(Xe^(iωt)). Every derivative then becomes multiplication by iω, and the differential equation collapses into an algebraic one. This is not a shortcut with a catch — the equation is linear and real, so taking the real part at the end is legitimate.'),
        drvStep('each derivative becomes a factor of iω',
          `(${dop('−')}${dv('m')}ω² ${dop('+')} ${dop('i')}γω ${dop('+')} ${dv('k')})${dv('X')} ${dop('=')} ${dv('F')}₀`,
          'a complex number multiplying X — the differential equation is gone'),
        drvStep('so the amplitude is the drive divided by a modulus',
          `|${dv('X')}| ${dop('=')} ${dfrac(dv('F') + '₀', '√((' + dv('k') + '−' + dv('m') + 'ω²)² + (γω)²)')}`,
          'the panel compares this with the amplitude measured from a long RK4 run'),
        drvSay('now look at what makes the denominator small',
          'The two terms compete. The first, k − mω², vanishes exactly at ω₀ = √(k/m). The second, γω, grows with ω. Their sum is therefore minimised slightly *below* ω₀ — the damping term is still increasing where the stiffness term reaches zero, so the balance tips earlier.'),
        drvStep('differentiate the denominator and set it to zero',
          `ω_peak ${dop('=')} ω₀√(1 ${dop('−')} 2ζ²)`,
          `ω₀ = ${n(w0)}, ζ = ${n(z)}, peak at ${z < Math.SQRT1_2 ? n(peak) : 'no peak — damping is too heavy'}`),
        drvSay('three different frequencies, routinely confused',
          `The natural frequency ω₀ = ${n(w0)} is where an undamped system would sit. The ringing frequency ω_d = ω₀√(1−ζ²) = ${n(w0 * Math.sqrt(Math.max(0, 1 - z * z)))} is what a struck, undriven system actually oscillates at. The resonance peak ω₀√(1−2ζ²) is where a driven system responds most. All three coincide only when there is no damping at all, and the factor of 2 under the last square root is the one people drop.`),
        drvStep('past ζ = 1/√2 the peak disappears entirely',
          `ζ ${dop('>')} ${dfrac('1', '√2')} ${dop('⇒')} no resonance`,
          z > Math.SQRT1_2 ? 'which is the case here — the response falls monotonically from ω = 0' : 'not the case here — there is a genuine peak'),
        drvSay('and the same algebra is the circuit wing\'s impedance',
          'Replace m by L, γ by R and k by 1/C and this is an RLC series circuit, with |Z| the impedance. The panel prints the correspondence. It is not an analogy in the loose sense — it is the same equation, so every result transfers exactly, including the phase lag and the quality factor.')
      ],
      note:'The predicted amplitude is checked against one measured from a long RK4 integration, run until the transient has died. The panel prints both and their difference, so the complex-exponential solution is verified against the differential equation it claims to solve.'
    };
  },
  enter(st, o){
    st.m = o.m === undefined ? 1 : o.m;
    st.gam = o.gam === undefined ? 0.25 : o.gam;
    st.k = o.k === undefined ? 4 : o.k;
    st.w = o.w === undefined ? 2 : o.w;
    st.F0 = 1;
    st.view = o.view || 'response';
    st.t = 0;
  },
  controls(){
    const st = ST;
    return ctSeg('odSV', st.view, [['response', 'the resonance curve'], ['time', 'the motion in time'], ['beats', 'beats']]) +
      ctlRow('mass m', ctlSlider('odSm', 0.2, 3, 0.02, st.m)) +
      ctlRow('damping γ', ctlSlider('odSg', 0, 2.5, 0.005, st.gam)) +
      ctlRow('stiffness k', ctlSlider('odSk', 0.5, 12, 0.05, st.k)) +
      ctlRow('drive ω', ctlSlider('odSw', 0.1, 5, 0.005, st.w)) +
      `<p class="help"><b>m x″ + γ x′ + k x = F₀ cos ωt</b> — and the identical equation
      <b>L q″ + R q′ + q/C = E₀ cos ωt</b> for a series RLC circuit. The panel prints both vocabularies
      side by side, because they are the same three numbers wearing different names.</p>
      <p class="help">The steady-state amplitude is <b>F₀/|Z|</b> with
      <b>|Z| = √((k − mω²)² + (γω)²)</b>. Two things fight in that expression: the stiffness term k − mω²
      passes through zero at <b>ω₀ = √(k/m)</b>, and only the damping term is left to stop the amplitude
      running away. With small γ the peak is enormous and narrow; with large γ it flattens and eventually
      disappears entirely.</p>
      <p class="help">The peak is <i>not</i> at ω₀ unless γ = 0 — it sits at
      <b>√(ω₀² − γ²/2m²)</b>, marked on the curve. And the phase lag runs from 0 at low frequency, through
      exactly 90° at ω₀, to 180° above it: drive a mass fast enough and it moves in the opposite direction
      to the force pushing it.</p>`;
  },
  wire(){
    ctWireSeg('odSV', v => { ST.view = v; });
    wireSlider('odSm', () => ST.m, v => { ST.m = v; }, v => fmtNum(+v, 3));
    wireSlider('odSg', () => ST.gam, v => { ST.gam = v; }, v => fmtNum(+v, 4));
    wireSlider('odSk', () => ST.k, v => { ST.k = v; }, v => fmtNum(+v, 3));
    wireSlider('odSw', () => ST.w, v => { ST.w = v; }, v => fmtNum(+v, 4));
  },
  frame(st, dt, ctx, W, H){
    st.t += dt;
    const { m, gam, k, w, F0 } = st;
    if(st.view === 'response'){
      const w0 = odNaturalOmega(m, k);
      const wr = odResonantOmega(m, gam, k);
      /* ONE LIST, used to fit the window AND to draw — they cannot disagree.
         The window used to be fitted to `gam` alone while three curves were
         drawn, and the lightest damping is precisely the one with the tallest
         peak, so the most instructive curve of the three was the one clipped:
         its maximum reached 5.71 against a window ending at 2.24. The feature
         marker then had its dot correctly hidden and its caption "max 5.71 at 2"
         drawn anyway, pinned to the top of the canvas (see 59c). Lighter damping
         means a taller, narrower resonance — that IS the lesson here, so cutting
         its top off removed the thing the reader came for. */
      const damps = [[gam * 0.35, TH.faint, 1.2], [gam, TH.grad, 2.6], [gam * 2.6, TH.faint, 1.2]];
      let mx = 0;
      for(const [g2] of damps){
        if(g2 <= 0) continue;
        for(let i = 1; i <= 400; i++) mx = Math.max(mx, odDrivenResponse(m, g2, k, F0, i * 5 / 400).amp);
      }
      const hp = (H - 160) / 2;
      const P = mkPlot(74, 46, W - 120, hp, 0, 5, 0, Math.min(mx * 1.12, 40));
      plotFrame(ctx, P, 'driving frequency ω', 'amplitude', 'the resonance curve — amplitude against drive frequency');
      plotTicksX(ctx, P, [0, 1, 2, 3, 4, 5], v => String(v));
      /* the same curve at three dampings, so the width is comparable */
      for(const [g2, col, wdt] of damps){
        if(g2 <= 0) continue;
        plotCurve(ctx, P, ww => odDrivenResponse(m, g2, k, F0, Math.max(1e-4, ww)).amp, 600, rgbCss(col), wdt);
      }
      probeLine(ctx, P, w, 'ω');
      ctx.strokeStyle = rgbCss(TH.curl, 0.8); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(P.X(w0), P.py); ctx.lineTo(P.X(w0), P.py + P.ph); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, P.X(w0) + 5, P.py + 14, 'ω₀', rgbCss(TH.curl), '600 11px ' + FONT_MONO);
      if(Number.isFinite(wr)){
        ctx.fillStyle = rgbCss(TH.warn);
        ctx.beginPath(); ctx.arc(P.X(wr), P.Y(Math.min(P.y1, odDrivenResponse(m, gam, k, F0, wr).amp)), 5, 0, 6.2832); ctx.fill();
      }
      /* the phase, beneath */
      const Q = mkPlot(74, 46 + hp + 58, W - 120, hp, 0, 5, -5, 185);
      plotFrame(ctx, Q, 'ω', 'phase lag (degrees)', 'how far the response lags the drive');
      plotTicksX(ctx, Q, [0, 1, 2, 3, 4, 5], v => String(v));
      plotCurve(ctx, Q, ww => odDrivenResponse(m, gam, k, F0, Math.max(1e-4, ww)).delta * 180 / Math.PI, 600, rgbCss(TH.grad), 2.4);
      ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Q.px, Q.Y(90)); ctx.lineTo(Q.px + Q.pw, Q.Y(90)); ctx.stroke();
      probeLine(ctx, Q, w, null);
      stageNote(ctx, 'the pale curves are the same system with a third and with two and a half times the damping', W, H);
      return;
    }
    if(st.view === 'beats'){
      /* an undamped system driven near its natural frequency */
      const w0 = odNaturalOmega(m, k);
      const T = 60;
      const num = odRK4(m, 0.02, k, t => F0 * Math.cos(w * t), 0, 0, 0, T, 12000);
      let hi = 0.1;
      for(let i = 0; i < num.ys.length; i += 4) hi = Math.max(hi, Math.abs(num.ys[i]));
      const P = mkPlot(74, 46, W - 120, H - 132, 0, T, -hi * 1.12, hi * 1.12);
      plotFrame(ctx, P, 't', 'x(t)', `beats — drive ω = ${fmtNum(w, 4)} against ω₀ = ${fmtNum(w0, 4)}`);
      plotZeroY(ctx, P);
      plotTicksX(ctx, P, [0, T / 4, T / 2, 3 * T / 4, T], v => fmtNum(v, 3));
      /* the beat envelope, from the trigonometric identity */
      const dw = Math.abs(w - w0);
      if(dw > 1e-3){
        const A = 2 * F0 / (m * Math.abs(w0 * w0 - w * w));
        for(const s of [1, -1])
          plotCurve(ctx, P, t => s * A * Math.abs(Math.sin(dw * t / 2)), 500, rgbCss(TH.warn, 0.8), 1.6);
      }
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 1.8;
      ctx.beginPath();
      for(let i = 0; i < num.ys.length; i += 2){
        const X = P.X(num.ts[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, num.ys[i])));
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      stageNote(ctx, 'two nearby frequencies beat at their difference — the envelope is |sin(Δω t/2)|', W, H);
      return;
    }
    /* the motion in time, with the mass drawn */
    const T = 40;
    const num = odRK4(m, gam, k, t => F0 * Math.cos(w * t), 0, 0, 0, T, 8000);
    let hi = 0.2;
    for(let i = 0; i < num.ys.length; i += 4) hi = Math.max(hi, Math.abs(num.ys[i]));
    const hp = (H - 160) * 0.62;
    const P = mkPlot(74, 46, W - 120, hp, 0, T, -hi * 1.15, hi * 1.15);
    plotFrame(ctx, P, 't', 'x(t)', 'the motion — transient then steady state');
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [0, 10, 20, 30, 40], v => String(v));
    const D = odDrivenResponse(m, gam, k, F0, w);
    plotCurve(ctx, P, t => D.amp * Math.cos(w * t - D.delta), 700, rgbCss(TH.pos, 0.8), 1.8);
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.2;
    ctx.beginPath();
    for(let i = 0; i < num.ys.length; i += 2){
      const X = P.X(num.ts[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, num.ys[i])));
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    /* the mass on its spring, animated at the current phase */
    const yb = 46 + hp + 70;
    const cx = W / 2;
    const ph = st.t * w;
    const xs = D.amp * Math.cos(ph - D.delta);
    const px = cx + xs / (hi || 1) * Math.min(180, W * 0.16);
    ctx.strokeStyle = rgbCss(TH.faint); ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - 220, yb);
    for(let i = 0; i <= 40; i++){
      const t = i / 40;
      ctx.lineTo(cx - 220 + (px - 30 - (cx - 220)) * t, yb + (i % 2 ? 9 : -9) * (i > 1 && i < 39 ? 1 : 0));
    }
    ctx.lineTo(px - 30, yb);
    ctx.stroke();
    ctx.fillStyle = rgbCss(TH.grad);
    ctx.fillRect(px - 30, yb - 22, 56, 44);
    ctx.fillStyle = rgbCss(TH.bg); ctx.font = '600 12px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('m', px - 2, yb);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 224, yb - 34); ctx.lineTo(cx - 224, yb + 34); ctx.stroke();
    /* the driving force, as an arrow on the mass */
    const Fnow = F0 * Math.cos(ph);
    ctx.strokeStyle = rgbCss(TH.warn); ctx.fillStyle = rgbCss(TH.warn); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 26, yb); ctx.lineTo(px + 26 + Fnow * 46, yb); ctx.stroke();
    ctText(ctx, px + 26 + Fnow * 46 + 8 * Math.sign(Fnow || 1), yb - 12, 'F(t)', rgbCss(TH.warn), '600 11px ' + FONT_UI,
      Fnow >= 0 ? 'left' : 'right');
    stageNote(ctx, 'green: the steady state the system settles onto · the mass is drawn at the current phase', W, H);
  },
  readout(st){
    const { m, gam, k, w, F0 } = st;
    const M = odMechanical(m, gam, k);
    const E = odElectrical(m, gam, 1 / k);
    const D = odDrivenResponse(m, gam, k, F0, w);
    const wr = odResonantOmega(m, gam, k);
    const peak = Number.isFinite(wr) ? odDrivenResponse(m, gam, k, F0, wr).amp : Infinity;
    /* the measured steady-state amplitude, from a long integration */
    const num = odRK4(m, gam, k, t => F0 * Math.cos(w * t), 0, 0, 0, 400, 120000);
    let meas = 0;
    for(let i = Math.floor(num.ys.length * 0.85); i < num.ys.length; i++) meas = Math.max(meas, Math.abs(num.ys[i]));
    return `<div class="card tight"><div class="ttl">The system</div>
      ${kv('ω₀ = √(k/m)', fmtNum(M.w0, 6))}
      ${kv('damping ratio ζ', fmtNum(M.zeta, 6))}
      ${kv('quality factor Q', gam > 1e-9 ? fmtNum(M.Q, 6) : '∞')}
      ${kv('ringing frequency ω_d', Number.isFinite(M.wd) ? fmtNum(M.wd, 6) : 'none — overdamped')}
      ${kv('amplitude peaks at ω =', Number.isFinite(wr) ? fmtNum(wr, 6) : 'nowhere — too damped to resonate')}
      ${kv('and that peak is', Number.isFinite(peak) ? fmtNum(peak, 6) : '∞')}
      ${kv('driving at ω =', fmtNum(w, 5))}
    </div>
    <div class="card tight"><div class="ttl">The steady state at this drive</div>
      ${kv('|Z| = √((k−mω²)² + (γω)²)', fmtNum(D.Z, 6))}
      ${kv('amplitude F₀/|Z|', fmtNum(D.amp, 6))}
      ${kv('measured from a long RK4 run', fmtNum(meas, 6))}
      ${kv('difference', fmtAgree(D.amp, meas))}
      ${kv('phase lag δ', fmtNum(D.delta * 180 / Math.PI, 5) + '°')}
      ${kv('in phase / quadrature parts', `${fmtNum(D.A, 5)} cos ωt + ${fmtNum(D.B, 5)} sin ωt`)}
      ${kv('amplitude at resonance, F₀/(γω₀)', gam > 1e-9 ? fmtNum(F0 / (gam * M.w0), 6) : '∞')}
      <p class="help">At ω = ω₀ the stiffness and inertia terms cancel exactly and only the damping is left
      holding the system back — which is why the peak height is inversely proportional to γ, and why an
      undamped system driven at resonance grows without bound. The Tacoma Narrows bridge, a wine glass
      shattered by a singer, and every radio tuner in existence are the same equation.</p>
    </div>
    <div class="card tight"><div class="ttl">The same equation, twice</div>
      ${kv('mechanical', 'm x″ + γ x′ + k x = F cos ωt')}
      ${kv('electrical', 'L q″ + R q′ + q/C = E cos ωt')}
      ${kv('m ↔ L', `${fmtNum(m, 4)} ↔ ${fmtNum(E.a, 4)} H`)}
      ${kv('γ ↔ R', `${fmtNum(gam, 4)} ↔ ${fmtNum(E.b, 4)} Ω`)}
      ${kv('k ↔ 1/C', `${fmtNum(k, 4)} ↔ ${fmtNum(E.c, 4)} F⁻¹`)}
      ${kv('both give ω₀ =', fmtNum(E.w0, 6))}
      ${kv('and Q =', gam > 1e-9 ? fmtNum(E.Q, 6) : '∞')}
      <p class="help">Inductance is inertia, resistance is friction, and the reciprocal of capacitance is
      stiffness. The circuits wing solves this same system with a nodal solver and draws its Bode plot;
      this wing solves it as a differential equation. Neither is more fundamental — they are one object.</p>
    </div>`;
  },
  chip(st){
    const D = odDrivenResponse(st.m, st.gam, st.k, st.F0, st.w);
    return `<div class="k">amplitude</div>
      <div style="color:var(--c-grad)">${fmtNum(D.amp, 5)}</div>
      <div>lag ${fmtNum(D.delta * 180 / Math.PI, 4)}°</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the response at this damping'], ['var(--faint)', 'a third and 2.6× the damping'],
                    ['var(--c-warn)', 'the amplitude peak, and the beat envelope'],
                    ['var(--c-curl)', 'ω₀'], ['var(--c-pos)', 'the steady state']]; },
  dockLegend:true
};

/* ---- 4 · series solutions -------------------------------------------------- */
