STAGES.ftPairs = {
  title: 'Transform pairs',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why you cannot make a signal short and narrow-band at once',
      steps:[
        drvSay('the observation to explain',
          'Narrow the pulse and its transform spreads. Widen it and the transform sharpens. This happens for every shape, which suggests it is not a property of any particular function but of the transform itself.'),
        drvStep('scaling in time is inverse scaling in frequency',
          `${dv('f')}(${dv('a')}${dv('t')}) ${dop('↔')} ${dfrac('1', '|' + dv('a') + '|')}${dv('F')}(${dv('w')}/${dv('a')})`,
          `width ${n(st.width)} — the panel prints both widths and their product`),
        drvStep('which follows from a substitution and nothing else',
          `${dv('u')} ${dop('=')} ${dv('a')}${dv('t')} ${dop('⇒')} d${dv('t')} ${dop('=')} d${dv('u')}/${dv('a')}`,
          'the exponent becomes wu/a, so the transform is evaluated at the scaled frequency'),
        drvSay('so the product of the two widths is fixed by the shape alone',
          'Compressing in time by a factor stretches in frequency by exactly the reciprocal. The product cannot be reduced by any choice of scale — only by changing the shape, and there is a shape that minimises it.'),
        drvStep('the uncertainty relation',
          `Δ${dv('t')} ${dop('·')} Δ${dv('w')} ${dop('≥')} ${dfrac('1', '2')}`,
          'with equality only for a Gaussian — the panel reports the product for the current shape'),
        drvSay('and this is a theorem about waves, not about physics',
            'It applies to radio pulses, musical notes and seismic traces. A short radio pulse necessarily occupies a wide band; a note lasting a few milliseconds has no well-defined pitch. None of that involves Planck\'s constant.'),
        drvStep('quantum mechanics adds one substitution',
          `${dv('p')} ${dop('=')} ħ${dv('k')} ${dop('⇒')} Δ${dv('x')}Δ${dv('p')} ${dop('≥')} ħ/2`,
          'the same inequality, with de Broglie\'s relation converting wavenumber to momentum'),
        drvSay('which is why Heisenberg\'s principle is less mysterious than advertised',
          'It is not about clumsy measurement disturbing the system. Position and momentum are Fourier conjugates, so a state localised in one is necessarily spread in the other — before any measurement is made. The inequality is a property of waves, and matter turns out to be wavelike.'),
        drvStep('and the Gaussian is the unique minimiser',
          `${dop('e')}^(−${dv('t')}²/2) ${dop('↔')} ${dop('e')}^(−${dv('w')}²/2)`,
          'a Gaussian transforms to a Gaussian — the panel shows the product hitting exactly ½')
      ],
      note:'The panel measures both widths as second moments of the actual computed transform, so the product shown is measured rather than quoted. It never falls below ½ whatever shape or width is chosen, and reaches it only for the Gaussian.'
    };
  },
  dockLegend: true,
  enter(st, o){ st.kind = o.kind || 'gauss'; st.width = o.width === undefined ? 1 : o.width; },
  controls(){
    const st = ST;
    const C = ftPairCur(st);
    return ftSeg('ftPK', st.kind, [['gauss','Gaussian'],['rect','rectangle'],['expo','two-sided decay'],['custom','type your own']]) +
      pkBoxes('ftpair', st.kind, st, FT_PAIR_OWN, FT_PAIR_BOUNDS,
        'Write the time as <b>t</b>. The transform is integrated numerically, so the signal need not be ' +
        'one anybody has solved — and the panel tells you when the window rather than the signal is what ' +
        'you are looking at.') +
      (C ? `<p class="help">${C.note}</p>` : ctlRow('width', ctlSlider('ftPW', 0.15, 4, 0.01, st.width))) +
      `<p class="help">Narrow the pulse and watch its transform spread; widen it and the transform sharpens.
      The product of the two widths cannot be made small — that is the <b>uncertainty principle</b>, and it is a
      theorem about Fourier transforms before it is anything about quantum mechanics. The same statement
      governs why a short radio pulse needs a wide band, and why a brief note has no definite pitch.</p>`;
  },
  wire(){
    ftWireSeg('ftPK', v => { ST.kind = v; });
    pkWireBoxes('ftpair', ST.kind, ST, FT_PAIR_OWN, FT_PAIR_BOUNDS);
    wireSlider('ftPW', () => ST.width, v => { ST.width = v; }, v => fmtNum(+v, 2));
  },
  frame(st, dt, ctx, W, H){
    const C = ftPairCur(st);
    const P = ftPanes(W, H, 0.5);
    const N = 700, ts = new Float64Array(N), xt = new Float64Array(N);
    /* a typed signal is shown over its own window, not over a fixed ±5 */
    const span = C ? C.T : 5;
    for(let i = 0; i < N; i++){
      const t = -span + 2 * span * i / (N - 1);
      ts[i] = t;
      xt[i] = C ? C.x(t)
            : st.kind === 'gauss' ? ftGauss(1 / (st.width * st.width), t)
            : st.kind === 'rect'  ? ftRect(st.width * 2, t)
            :                       ftExpo(1 / st.width, t);
    }
    if(C){
      /* the vertical extent measured from the signal, since a typed one may be
         negative, huge, or both — the preset window of −0.25…1.25 fits only the
         three shapes it was chosen for */
      let lo = 0, hi = 1e-9;
      for(const v of xt){ if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); } }
      const pad = (hi - lo) * 0.15 + 1e-3;
      const T2 = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, -span, span, lo - pad, hi + pad);
      ftFrame(ctx, T2, 'time  t', 'x(t)', 'In time — your signal, over the window it is integrated on');
      plotTicksX(ctx, T2, [-span, -span / 2, 0, span / 2, span], v => fmtNum(v, 2));
      ftYTicks(ctx, T2, [lo, (lo + hi) / 2, hi], v => fmtNum(v, 2));
      ftLine(ctx, T2, ts, xt, rgbCss(TH.grad), 2.1);
      /* and the magnitude spectrum from the table the accessor built */
      const M = 700, fs2 = new Float64Array(M), xf2 = new Float64Array(M);
      let mx2 = 1e-9;
      for(let i = 0; i < M; i++){
        const f = -C.FS + 2 * C.FS * i / (M - 1);
        fs2[i] = f; xf2[i] = C.mag(f);
        mx2 = Math.max(mx2, xf2[i]);
      }
      const F2 = mkPlot(P.bot.x, P.bot.y, P.bot.w, P.bot.h, -C.FS, C.FS, -mx2 * 0.08, mx2 * 1.2);
      ftFrame(ctx, F2, 'frequency  f', '|X(f)|',
              'In frequency — the magnitude, because a signal that is not even has a phase');
      plotTicksX(ctx, F2, [-3, -2, -1, 0, 1, 2, 3], v => String(v));
      ftYTicks(ctx, F2, [0, mx2 / 2, mx2], v => fmtNum(v, 2));
      ftLine(ctx, F2, fs2, xf2, rgbCss(TH.curl), 2.1);
      stageNote(ctx, C.tr.ratio < 1e-4
        ? 'the signal has died away inside the window, so this is the transform and not the window'
        : 'the signal is still large where the window cuts it — some of the ripple below is the window, not your signal', W, H);
      return;
    }
    const T = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, -span, span, -0.25, 1.25);
    ftFrame(ctx, T, 'time  t', 'x(t)', 'In time');
    plotTicksX(ctx, T, [-4, -2, 0, 2, 4], v => String(v));
    ftYTicks(ctx, T, [0, 0.5, 1]);
    ftLine(ctx, T, ts, xt, rgbCss(TH.grad), 2.1);

    const fspan = 4;
    const fs = new Float64Array(N), xf = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const f = -fspan + 2 * fspan * i / (N - 1);
      fs[i] = f;
      xf[i] = st.kind === 'gauss' ? ftGaussHat(1 / (st.width * st.width), f)
            : st.kind === 'rect'  ? ftRectHat(st.width * 2, f)
            :                       ftExpoHat(1 / st.width, f);
    }
    let mx = 1e-9;
    for(const v of xf) mx = Math.max(mx, Math.abs(v));
    const F = mkPlot(P.bot.x, P.bot.y, P.bot.w, P.bot.h, -fspan, fspan, -mx * 0.42, mx * 1.2);
    ftFrame(ctx, F, 'frequency  f', 'X(f)', 'In frequency — the same object, written differently');
    plotTicksX(ctx, F, [-3, -2, -1, 0, 1, 2, 3], v => String(v));
    ftYTicks(ctx, F, [0, mx / 2, mx]);
    ftLine(ctx, F, fs, xf, rgbCss(TH.curl), 2.1);
    stageNote(ctx, st.kind === 'rect'
      ? 'a hard edge in one domain costs you ringing tails in the other — the sinc never quite dies away'
      : 'squeeze one and the other spreads; their product is bounded below', W, H);
  },
  readout(st){
    const C = ftPairCur(st);
    if(C){
      /* both widths measured from the same arrays the picture is drawn from */
      const N2 = 4096, dtc = 2 * C.T / N2, xt2 = new Float64Array(N2);
      for(let i = 0; i < N2; i++) xt2[i] = C.x(-C.T + i * dtc);
      const dtw2 = ftSpread(xt2, dtc, N2 / 2);
      const M2 = C.M + 1, dfc = 2 * C.FS / C.M, xf2 = new Float64Array(M2);
      for(let i = 0; i < M2; i++) xf2[i] = Math.hypot(C.re[i], C.im[i]);
      const dfw2 = ftSpread(xf2, dfc, C.M / 2);
      const prod = dtw2 * dfw2;
      return `<div class="card tight"><div class="ttl">Your signal</div>
        ${kv('x(t)', esc(C.name.replace('x(t) = ', '')))}
        ${kv('window', '±' + fmtNum(C.T, 4))}
        ${kv('width in time  Δt', fmtNum(dtw2, 4))}
        ${kv('width in frequency  Δf', fmtNum(dfw2, 4))}
        ${kv('product  Δt·Δf', '<b>' + fmtNum(prod, 4) + '</b>')}
        ${kv('the floor  1/4π', fmtNum(1 / (4 * Math.PI), 6))}
        ${kv('above the floor?', prod >= 1 / (4 * Math.PI) - 1e-6 ? 'yes, as it must be' : 'no — which would mean the measurement, not the theorem, is wrong')}
        <p class="help">Both spreads are RMS second moments of the computed curves, so this product is
        measured for <i>your</i> signal. No shape can push it below 1/4π, and only a Gaussian reaches it —
        try <b>exp(-t^2)</b> and then try anything else.</p>
      </div>
      <div class="card tight"><div class="ttl">What the numbers are worth</div>
        ${kv('signal at the window edge, ÷ peak', fmtNum(C.tr.ratio, 4))}
        ${kv('energy, computed in time', fmtNum(C.par.time, 8))}
        ${kv('energy, computed in frequency', fmtNum(C.par.freq, 8))}
        ${kv('Parseval gap', fmtAgree(C.par.time, C.par.freq))}
        <p class="help">${C.note}</p>
      </div>`;
    }
    /* measure both widths numerically and multiply them */
    const N = 4096, span = 40, dt2 = 2 * span / N;
    const xt = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const t = -span + i * dt2;
      xt[i] = st.kind === 'gauss' ? ftGauss(1 / (st.width * st.width), t)
            : st.kind === 'rect'  ? ftRect(st.width * 2, t)
            :                       ftExpo(1 / st.width, t);
    }
    const dtw = ftSpread(xt, dt2, N / 2);
    const M = 2048, fspan = 24, df = 2 * fspan / M;
    const xf = new Float64Array(M);
    for(let i = 0; i < M; i++){
      const f = -fspan + i * df;
      xf[i] = st.kind === 'gauss' ? ftGaussHat(1 / (st.width * st.width), f)
            : st.kind === 'rect'  ? ftRectHat(st.width * 2, f)
            :                       ftExpoHat(1 / st.width, f);
    }
    const dfw = ftSpread(xf, df, M / 2);
    const names = { gauss:'Gaussian → Gaussian', rect:'rectangle → sinc', expo:'two-sided decay → Lorentzian' };
    const forms = {
      gauss:'e^(−at²) ⟷ √(π/a)·e^(−π²f²/a)',
      rect:'rect(t/T) ⟷ T·sinc(fT)',
      expo:'e^(−a|t|) ⟷ 2a/(a²+4π²f²)'
    };
    return `<div class="card tight"><div class="ttl">This pair</div>
      ${kv('name', names[st.kind])}
      ${kv('the pair', forms[st.kind])}
      ${kv('width in time  Δt', fmtNum(dtw, 4))}
      ${kv('width in frequency  Δf', fmtNum(dfw, 4))}
      ${kv('product  Δt·Δf', '<b>' + fmtNum(dtw * dfw, 4) + '</b>')}
      <p class="help">Both widths are RMS spreads, measured from the curves on screen rather than assumed.
      Drag the width slider and watch the two move in opposite directions while the product barely changes.</p>
    </div>
    <div class="card tight"><div class="ttl">Why the product has a floor</div>
      <p class="help">For any signal at all, <b>Δt·Δf ≥ 1/4π</b>. The Gaussian is the unique shape that achieves
      equality — which is why it turns up everywhere from optics to quantum mechanics as the "minimum
      uncertainty" state. Multiply by ħ and the same inequality reads <b>Δx·Δp ≥ ħ/2</b>: the quantum
      uncertainty principle is this theorem, applied to a wavefunction and its momentum representation.
      Nothing quantum has been added — the physics is only the identification of momentum with spatial
      frequency, <b>p = ħk</b>.</p>
      ${st.kind === 'rect' ? '<p class="help">The rectangle is the cautionary case: it is <i>perfectly</i> compact in time, and the price is a transform whose tails fall only as 1/f and never terminate. Sharp edges are expensive.</p>' : ''}
    </div>`;
  },
  chip(st){
    const C = ftPairCur(st);
    if(C) return `<div class="k">your pair</div><div style="color:var(--c-grad)">window ±${fmtNum(C.T, 2)}</div>`;
    return `<div class="k">${st.kind} pair</div><div style="color:var(--c-grad)">width ${fmtNum(st.width,2)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'x(t) — the time domain'],
                    ['var(--c-curl)', (ST && ST.kind === 'custom' ? '|X(f)| — the magnitude spectrum' : 'X(f) — the frequency domain')]]; }
};

/* ============================================================================
   4 · DISCRETE vs CONTINUOUS — sampling, aliasing, leakage, windows
   ============================================================================ */
STAGES.ftDiscrete = {
  title: 'Discrete & continuous',
  derive(st){
    const n = v => fmtNum(v, 4);
    return {
      title:'What sampling destroys, and the exact rate at which it stops',
      steps:[
        drvSay('the practical situation',
          'A computer never sees a signal, only a list of samples. The question is what has been lost — and the answer is remarkably sharp: nothing at all, provided the sampling is fast enough, and irreversibly much the moment it is not.'),
        drvStep('sampling multiplies by a comb of spikes',
          `${dv('f')}_s(${dv('t')}) ${dop('=')} ${dv('f')}(${dv('t')}) ${dop('·')} Σ δ(${dv('t')} ${dop('−')} ${dv('n')}${dv('T')}ₛ)`,
          `sampling rate ${n(st.fs)}, signal frequency ${n(st.f)}`),
        drvStep('and multiplying in time is convolving in frequency',
          `${dv('F')}ₛ(${dv('w')}) ${dop('=')} ${dv('F')}(${dv('w')}) ${dop('*')} comb`,
          'the convolution theorem, which the next stage derives'),
        drvSay('a comb convolved with a spectrum makes copies',
          'Convolving with a train of spikes replicates the spectrum at every spike. So the sampled signal\'s spectrum is the original repeated endlessly, spaced by the sampling rate. Everything about sampling follows from that one picture.'),
        drvStep('the copies must not overlap',
          `${dv('f')}ₛ ${dop('>')} 2${dv('f')}_max`,
          `here fs = ${n(st.fs)} and f = ${n(st.f)} — ${st.fs > 2 * st.f ? 'above the limit, so no overlap' : 'below it: the copies collide and alias'}`),
        drvSay('that is the sampling theorem, and the factor of two is now obvious',
          'The spectrum extends from −f_max to +f_max, so it is 2f_max wide. Copies spaced by fs avoid overlapping exactly when fs exceeds that width. Nyquist\'s factor of two is the width of a two-sided spectrum, not an empirical safety margin.'),
        drvStep('when they overlap, high frequencies masquerade as low ones',
          `${dv('f')}_apparent ${dop('=')} |${dv('f')} ${dop('−')} ${dv('k')}${dv('f')}ₛ|`,
          st.fs <= 2 * st.f ? `the panel shows the reconstruction landing at ${n(Math.abs(st.f - Math.round(st.f / st.fs) * st.fs))} instead` : 'raise f above fs/2 to see it happen'),
        drvSay('and aliasing is irreversible',
          'Once two frequencies have been folded onto one another, nothing downstream can separate them — the information is gone. That is why every digitiser has an analogue low-pass filter in front of it, removing what cannot be represented before it can do damage.'),
        drvStep('windowing trades leakage for resolution',
          `taper the ends to zero`,
          st.win !== 'rect' ? 'a window is applied here, and the spectral skirts are visibly lower' : 'no window — the abrupt truncation causes leakage'),
        drvSay('because a finite record is a multiplication by a rectangle',
          'Truncating a signal multiplies it by a box, which convolves its spectrum with a sinc — and sinc has slowly decaying ripples that smear one frequency across many bins. A smoother window has a faster-decaying transform, which reduces leakage at the cost of a wider main lobe. There is no window that wins on both.')
      ],
      note:'The reconstruction drawn is built from the samples alone by sinc interpolation. Above the Nyquist rate it lies exactly on the original; below it, it locks onto a completely different and lower frequency — the alias, computed rather than illustrated.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.f = o.f === undefined ? 3 : o.f;
    st.fs = o.fs || 32;
    st.win = o.win || 'rect';
    st.N = 64;
    st.own = !!o.own;
  },
  controls(){
    const st = ST, cur = ftDiscCur(st);
    return (st.own ? '' : ctlRow('tone f', ctlSlider('ftDF', 0.5, 40, 0.1, st.f))) +
      ctlRow('sample rate', ctlSlider('ftDFS', 8, 64, 1, st.fs)) +
      ftSeg('ftWin', st.win, FT_WINDOWS.map(w => [w, w])) +
      ctSeg('ftDOwn', st.own ? 'own' : 'tone',
            [['tone', 'a pure tone'], ['own', 'type your own signal']]) +
      (st.own ? fnHtml('ftdisc_x', 'x(t) =', pkOwn(st, 'ftdisc', FT_DISC_OWN, null).x, 't, in seconds') : '') +
      `<p class="help">${cur.note}</p>
      <p class="help">The sampled signal is only ever known at the dots. Raise the content past
      <b>half</b> the sample rate — the <b>Nyquist frequency</b> — and the samples become
      indistinguishable from those of something slower: the spectrum folds back instead of continuing up.
      That is <b>aliasing</b>, and no amount of cleverness afterwards can undo it.</p>`;
  },
  wire(){
    if(!ST.own) wireSlider('ftDF', () => ST.f, v => { ST.f = v; }, v => fmtNum(+v, 2) + ' Hz');
    wireSlider('ftDFS', () => ST.fs, v => { ST.fs = Math.round(v); }, v => Math.round(v) + ' /s');
    ftWireSeg('ftWin', v => { ST.win = v; });
    ctWireSeg('ftDOwn', v => { ST.own = (v === 'own'); });
    if(ST.own){
      const own = pkOwn(ST, 'ftdisc', FT_DISC_OWN, null);
      fnWire('ftdisc_x', (m, s) => { own.x = s; });
    }
  },
  frame(st, dt, ctx, W, H){
    const P = ftPanes(W, H, 0.5);
    const N = st.N, dur = N / st.fs, cur = ftDiscCur(st);
    /* the samples actually taken — computed first, because the reconstruction
       below is built from them and nothing else */
    const sig = new Float64Array(N), wsig = new Float64Array(N);
    for(let i = 0; i < N; i++){
      sig[i] = cur.x(i / st.fs);
      wsig[i] = sig[i] * ftWindowFn(st.win, i, N);
    }
    /* the true signal, densely */
    const M = 900, ts = new Float64Array(M), xs = new Float64Array(M), rec = new Float64Array(M);
    let amax = 1e-9;
    for(let i = 0; i < M; i++){
      const t = i / (M - 1) * dur;
      ts[i] = t; xs[i] = cur.x(t); rec[i] = ftSincRecon(sig, st.fs, t);
      amax = Math.max(amax, Math.abs(xs[i]), Math.abs(rec[i]));
    }
    /* the reconstruction against the original, away from the ends where the
       truncated sinc sum is unreliable — this is the damage, measured */
    let resid = 0;
    for(let i = Math.floor(M * 0.2); i < M * 0.8; i++) resid = Math.max(resid, Math.abs(rec[i] - xs[i]));
    st.resid = resid; st.amax = amax;
    const T = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, 0, dur, -amax * 1.3, amax * 1.3);
    ftFrame(ctx, T, 'time  t (s)', 'x(t)', 'The signal, the samples taken of it, and what those samples determine');
    plotTicksX(ctx, T, [0, dur / 2, dur], v => fmtNum(v, 3));
    ftYTicks(ctx, T, [-amax, 0, amax], v => fmtNum(v, 3));
    ftLine(ctx, T, ts, xs, rgbCss(TH.faint, 0.7), 1.4);
    /* Whittaker–Shannon from the dots alone. Below Nyquist it lands on the pale
       curve; above it, it lands on the alias — the same formula either way, so
       the picture is not being told which case it is in. */
    ftLine(ctx, T, ts, rec, rgbCss(TH.pos, 0.85), 1.8);
    const fa = ftAlias(st.f, st.fs);
    ctx.fillStyle = rgbCss(TH.grad);
    for(let i = 0; i < N; i++){
      const X = T.X(i / st.fs), Y = T.Y(sig[i]);
      ctx.beginPath(); ctx.arc(X, Y, 2.6, 0, 6.2832); ctx.fill();
    }
    /* the DFT of those samples */
    const re = Float64Array.from(wsig), im = new Float64Array(N);
    ftFFT(re, im, false);
    const amp = ftAmplitude(re, im);
    const g = ftWindowGain(st.win, N) || 1;
    for(let k = 0; k < amp.length; k++) amp[k] /= g;
    const ks = [], vs = [];
    for(let k = 0; k < amp.length; k++){ ks.push(k * st.fs / N); vs.push(amp[k]); }
    const F = mkPlot(P.bot.x, P.bot.y, P.bot.w, P.bot.h, 0, st.fs / 2, 0, 1.25);
    ftFrame(ctx, F, 'frequency  f (Hz) — the axis stops at Nyquist', '|X|',
      'The discrete transform of those ' + N + ' samples');
    plotTicksX(ctx, F, [0, st.fs / 8, st.fs / 4, 3 * st.fs / 8, st.fs / 2], v => fmtNum(v, 3));
    ftYTicks(ctx, F, [0, 0.5, 1]);
    ftStems(ctx, F, ks, vs, rgbCss(TH.curl), 2.2);
    /* where the tone actually is, and where it appears */
    if(!cur.custom && st.f <= st.fs / 2){
      probeLine(ctx, F, st.f, 'true f');
    } else if(!cur.custom){
      probeLine(ctx, F, fa, 'appears here');
      ctx.fillStyle = rgbCss(TH.pos); ctx.font = '600 11px ' + FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('the ' + fmtNum(st.f, 3) + ' Hz tone has folded down to ' + fmtNum(fa, 3) + ' Hz',
                   F.px + F.pw / 2, F.py + 6);
    } else if(cur.alias.frac > 1e-6){
      ctx.fillStyle = rgbCss(TH.pos); ctx.font = '600 11px ' + FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(fmtNum(cur.alias.frac * 100, 3) + '% of your signal is above Nyquist and has folded into these bins',
                   F.px + F.pw / 2, F.py + 6);
    }
    stageNote(ctx, 'the dots are all the transform ever sees — the pale curve is the signal they were taken from, the bright one is what they determine', W, H);
  },
  readout(st){
    const N = st.N, fa = ftAlias(st.f, st.fs), cur = ftDiscCur(st);
    const onBin = Math.abs(st.f * N / st.fs - Math.round(st.f * N / st.fs)) < 1e-9;
    const resid = st.resid === undefined ? 0 : st.resid;
    return `<div class="card tight"><div class="ttl">Sampling</div>
      ${cur.custom
        ? kv('signal', esc(cur.name)) +
          kv('sample rate f_s', st.fs + ' /s') +
          kv('Nyquist f_s/2', fmtNum(st.fs / 2, 4) + ' Hz') +
          kv('energy above Nyquist', fmtNum(cur.alias.frac * 100, 4) + '%  — measured, not assumed') +
          kv('verdict', cur.alias.frac < 1e-6 ? '✓ sampled faithfully' : '✗ part of it has folded down irrecoverably')
        : kv('tone', fmtNum(st.f, 4) + ' Hz') +
          kv('sample rate f_s', st.fs + ' /s') +
          kv('Nyquist f_s/2', fmtNum(st.fs / 2, 4) + ' Hz') +
          kv('appears at', fmtNum(fa, 4) + ' Hz' + (Math.abs(fa - st.f) > 1e-9 ? '  ← aliased' : '')) +
          kv('verdict', st.f <= st.fs / 2 ? '✓ sampled faithfully' : '✗ above Nyquist — irrecoverably folded')}
      ${kv('reconstruction vs original', fmtGap(resid, st.amax === undefined ? 1 : st.amax) + ' at worst')}
      <p class="help"><b>Nyquist–Shannon</b>: a signal containing nothing above f_s/2 is completely determined
      by its samples, and can be reconstructed exactly. The bright curve above is that reconstruction — the
      Whittaker–Shannon sum Σ x[n]·sinc(f_s t − n), built from the dots and nothing else — and the row above
      is how far it strays from the original in the middle of the record, where the truncated sum is
      trustworthy. Below Nyquist that number is rounding. Above it, different signals produce identical
      samples and the information is simply gone, which is why every real converter has an analogue filter in
      front of it, removing what it cannot represent <i>before</i> the damage is done.</p>
    </div>
    <div class="card tight"><div class="ttl">Leakage and windows</div>
      ${kv('bin spacing f_s/N', fmtNum(st.fs / N, 5) + ' Hz')}
      ${cur.custom ? '' : kv('tone in bins', fmtNum(st.f * N / st.fs, 4)) +
        kv('sits on a bin?', onBin ? 'yes — one clean line' : 'no — it will smear across neighbours')}
      ${kv('window', st.win)}
      ${kv('coherent gain', fmtNum(ftWindowGain(st.win, N), 4))}
      <p class="help">The DFT assumes the ${N} samples repeat forever. If the tone does not complete a whole
      number of cycles in that window, the assumed repetition has a jump in it — and a jump has harmonics
      everywhere, which is what <b>spectral leakage</b> is. A <b>window</b> tapers the ends to zero so there is
      no jump to speak of, trading a slightly wider main line for far smaller tails. Nudge the tone off a bin
      with the slider, then switch between rect and Hann and watch the skirts collapse.</p>
    </div>
    <div class="card tight"><div class="ttl">Discrete or continuous?</div>
      <p class="help">The continuous transform integrates over all time and gives a function of a continuous
      frequency. The DFT sums a finite number of samples and gives a finite list. Two consequences follow and
      neither is optional: sampling in time makes the spectrum <b>periodic</b> (hence aliasing), and truncating
      in time makes the spectrum <b>smeared</b> (hence leakage). Everything awkward about practical
      spectrum analysis is one of those two facts.</p>
    </div>`;
  },
  chip(st){
    const cur = ftDiscCur(st);
    if(cur.custom){
      const bad = cur.alias.frac > 1e-6;
      return `<div class="k">your signal · f_s = ${st.fs}</div>
        <div style="color:${bad ? 'var(--c-pos)' : 'var(--c-grad)'}">${bad ? fmtNum(cur.alias.frac * 100, 3) + '% above Nyquist' : 'nothing above Nyquist'}</div>`;
    }
    return `<div class="k">f = ${fmtNum(st.f,3)} Hz · f_s = ${st.fs}</div>
    <div style="color:${st.f > st.fs/2 ? 'var(--c-pos)' : 'var(--c-grad)'}">${st.f > st.fs/2 ? 'ALIASED → ' + fmtNum(ftAlias(st.f, st.fs),3) + ' Hz' : 'below Nyquist'}</div>`; },
  legend(){ return [['var(--faint)', 'the true signal'], ['var(--c-grad)', 'the samples actually taken'],
                    ['var(--c-pos)', 'what those samples determine — the reconstruction'], ['var(--c-curl)', 'the discrete spectrum']]; }
};

/* ============================================================================
   5 · THE FAST FOURIER TRANSFORM
   ============================================================================ */
STAGES.ftFast = {
  title: 'The FFT',
  derive(st){
    const N = Math.pow(2, st.p);
    return {
      title:'How an algorithm changed what was computable',
      steps:[
        drvStep('the direct sum, counted honestly',
          `${dv('X')}ₖ ${dop('=')} Σ_(n=0)^(N−1) ${dv('x')}ₙ ${dop('e')}^(${dop('−')}2π${dop('i')}${dv('k')}${dv('n')}/${dv('N')})`,
          `N = ${N}, so N² = ${N * N} complex multiplications`),
        drvSay('the observation everything turns on',
          'Split the samples into the even-indexed and the odd-indexed halves. For the even ones the exponent becomes e^(−2πik(2m)/N) = e^(−2πikm/(N/2)) — which is precisely the transform kernel for a sequence of half the length. The subproblem is the same problem, smaller.'),
        drvStep('so a transform of length N is two of length N/2',
          `${dv('X')}ₖ ${dop('=')} ${dv('E')}ₖ ${dop('+')} ${dop('e')}^(${dop('−')}2π${dop('i')}${dv('k')}/${dv('N')}) ${dv('O')}ₖ`,
          'the twiddle factor is all that is needed to reassemble them'),
        drvStep('and the second half comes free from the first',
          `${dv('X')}_(k+N/2) ${dop('=')} ${dv('E')}ₖ ${dop('−')} ${dop('e')}^(${dop('−')}2π${dop('i')}${dv('k')}/${dv('N')}) ${dv('O')}ₖ`,
          'the same two numbers, recombined with a minus — half the work vanishes'),
        drvSay('that sign flip is where the saving actually comes from',
          'Because the exponential is periodic, the twiddle factor for k + N/2 is the negative of the one for k. So each pair of outputs costs one multiplication rather than two. Recursion then applies the same trick at every scale.'),
        drvStep('recursing gives log₂N stages of N work each',
          `${dv('N')}² ${dop('→')} ${dv('N')} log₂ ${dv('N')}`,
          `${N * N} operations become about ${N * st.p} — a factor of ${fmtNum(N / st.p, 1)} at this size`),
        drvSay('and the saving grows without bound',
          'This is not a constant-factor improvement. At N = 4096 the ratio is already over 300; for the million-point transforms used in radio astronomy it is around 50 000. Problems that would take a year take minutes. The button in this panel times both and shows the gap opening as N grows.'),
        drvSay('the history is worth a sentence',
          'Cooley and Tukey published in 1965 and the algorithm reshaped signal processing immediately. Gauss had found the same method around 1805, in unpublished notes on interpolating asteroid orbits, and it went unnoticed for 160 years. It is one of the most consequential algorithms ever written down, twice.'),
        drvStep('and it is exact, not an approximation',
          `FFT output ${dop('=')} direct sum, to rounding error`,
          'the panel computes both and prints their difference — the FFT is in fact the more accurate of the two')
      ],
      note:'The FFT accumulates less rounding error than the direct sum, because it performs far fewer operations on each value. Faster and more accurate at once is rare, and it is why nobody computes a DFT directly.'
    };
  },
  dockLegend: true,
  enter(st, o){ st.p = o.p || 5; st.timed = null; st.own = !!o.own; },
  controls(){
    const st = ST, cur = ftFastCur(st);
    return ctlRow('size N = 2<sup>p</sup>', ctlSlider('ftP', 2, 12, 1, st.p)) +
      ctSeg('ftFOwn', st.own ? 'own' : 'tone',
            [['tone', 'a tone plus noise'], ['own', 'type your own data']]) +
      (st.own ? fnHtml('ftfast_x', 'x(t) =', pkOwn(st, 'ftfast', FT_FAST_OWN, null).x, 't, over one record 0…1') : '') +
      `<div class="row wrap"><button class="btn pri" id="ftTime">Time them both</button></div>
       <p class="help">${cur.note}</p>
       <p class="help">The direct sum evaluates N² complex products. The FFT notices that a transform of
       length N is two transforms of length N/2 — the even-numbered samples and the odd — because
       <b>e^(−2πik(2m)/N) = e^(−2πikm/(N/2))</b>. Recursing costs log₂N stages of N operations each.
       The saving is not a constant factor; it grows without bound.</p>`;
  },
  wire(){
    wireSlider('ftP', () => ST.p, v => { ST.p = Math.round(v); ST.timed = null; }, v => 'N = ' + (1 << Math.round(v)));
    ctWireSeg('ftFOwn', v => { ST.own = (v === 'own'); ST.timed = null; });
    if(ST.own){
      const own = pkOwn(ST, 'ftfast', FT_FAST_OWN, null);
      fnWire('ftfast_x', (m, s) => { own.x = s; ST.timed = null; });
    }
    $('ftTime').addEventListener('click', () => {
      const N = 1 << ST.p;
      const sig = ftFastCur(ST).samples();
      const t0 = performance.now();
      const slow = ftDFT(sig, new Float64Array(N), false);
      const t1 = performance.now();
      const fr = Float64Array.from(sig), fi = new Float64Array(N);
      ftFFT(fr, fi, false);
      const t2 = performance.now();
      let worst = 0;
      for(let k = 0; k < N; k++) worst = Math.max(worst, Math.hypot(fr[k] - slow.re[k], fi[k] - slow.im[k]));
      ST.timed = { N, dft:t1 - t0, fft:Math.max(t2 - t1, 1e-4), agree:worst, on:ftFastCur(ST).name };
      refreshStageReadout();
    });
  },
  frame(st, dt, ctx, W, H){
    const P = ftPanes(W, H, 0.52);
    /* cost curves */
    const T = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, 2, 16, 0, 8);
    ftFrame(ctx, T, 'log₂ N', 'log₁₀ operations', 'What each algorithm costs');
    plotTicksX(ctx, T, [2, 4, 6, 8, 10, 12, 14, 16], v => String(1 << v));
    ftYTicks(ctx, T, [0, 2, 4, 6, 8], v => '10^' + v);
    const ps = [], dc = [], fc = [];
    for(let p = 2; p <= 16; p += 0.25){
      const N = Math.pow(2, p);
      ps.push(p); dc.push(Math.log10(ftDFTCost(N))); fc.push(Math.log10(ftFFTCost(N)));
    }
    ftLine(ctx, T, ps, dc, rgbCss(TH.pos), 2.2);
    ftLine(ctx, T, ps, fc, rgbCss(TH.grad), 2.2);
    probeLine(ctx, T, st.p, 'N = ' + (1 << st.p));
    ctx.font = '11px ' + FONT_MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = rgbCss(TH.pos); ctx.fillText('direct sum — N²', T.px + 8, T.Y(6.6));
    ctx.fillStyle = rgbCss(TH.grad); ctx.fillText('FFT — ½N log₂N', T.px + 8, T.Y(2.2));

    /* the divide-and-conquer tree */
    const B = P.bot;
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 11.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('How it splits: each level halves the problem and costs one pass', B.x + B.w / 2, B.y - 16);
    const levels = Math.min(st.p, 5);
    for(let L = 0; L <= levels; L++){
      const cnt = 1 << L, size = (1 << st.p) >> L;
      const y = B.y + 12 + L * ((B.h - 24) / Math.max(1, levels));
      const bw = Math.min(B.w / cnt - 4, 190);
      for(let i = 0; i < cnt; i++){
        const x = B.x + (i + 0.5) * (B.w / cnt);
        ctx.fillStyle = rgbCss(L === levels ? TH.grad : TH.accent, 0.16 + 0.1 * L);
        ctx.fillRect(x - bw / 2, y - 8, bw, 16);
        ctx.strokeStyle = rgbCss(L === levels ? TH.grad : TH.accent, 0.6); ctx.lineWidth = 1;
        ctx.strokeRect(x - bw / 2, y - 8, bw, 16);
        if(cnt <= 8){
          ctx.fillStyle = rgbCss(TH.dim); ctx.font = '10px ' + FONT_MONO;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('N/' + cnt + ' = ' + size, x, y);
        }
        if(L > 0){
          const px = B.x + ((i >> 1) + 0.5) * (B.w / (cnt >> 1));
          const py = B.y + 12 + (L - 1) * ((B.h - 24) / Math.max(1, levels));
          ctx.strokeStyle = rgbCss(TH.line2, 0.8);
          ctx.beginPath(); ctx.moveTo(px, py + 8); ctx.lineTo(x, y - 8); ctx.stroke();
        }
      }
      ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('level ' + L, B.x - 8, y);
    }
    stageNote(ctx, 'press “Time them both” to run the two algorithms and compare them for real', W, H);
  },
  readout(st){
    const N = 1 << st.p;
    const t = st.timed;
    /* what is actually loaded, described from the data itself. Without this the
       reader can type a formula and see nothing change until they press the
       button, which is a control that appears to do nothing. */
    const cur = ftFastCur(st);
    const sig = cur.samples();
    const re = Float64Array.from(sig), im = new Float64Array(N);
    ftFFT(re, im);
    const amp = ftAmplitude(re, im);
    let top = 0, rms = 0, peak = 0;
    for(let k = 1; k < amp.length; k++) if(amp[k] > amp[top]) top = k;
    for(let i = 0; i < N; i++){ rms += sig[i] * sig[i]; peak = Math.max(peak, Math.abs(sig[i])); }
    rms = Math.sqrt(rms / N);
    return `<div class="card tight"><div class="ttl">The data loaded</div>
      ${kv('signal', esc(cur.name))}
      ${kv('samples N', String(N))}
      ${kv('RMS', fmtNum(rms, 5))}
      ${kv('largest sample', fmtNum(peak, 5))}
      ${kv('strongest bin', 'k = ' + top + ', amplitude ' + fmtNum(amp[top], 5))}
      <p class="help">Computed by the FFT, live, so the panel reacts as soon as the formula changes. Neither
      algorithm cares what is in this array — which is exactly why it is worth handing them yours.</p>
    </div>
    <div class="card tight"><div class="ttl">Cost at N = ${N}</div>
      ${kv('direct sum  N²', ckEng(ftDFTCost(N), '') + ' operations')}
      ${kv('FFT  ½N log₂N', ckEng(ftFFTCost(N), '') + ' operations')}
      ${kv('ratio', fmtNum(ftDFTCost(N) / ftFFTCost(N), 4) + ' × fewer')}
      <p class="help">At N = 2¹⁰ that is a factor of 200; at N = 2²⁰ it is 100 000. An hour of audio at CD rate
      is about 2²⁷ samples — the direct sum would take longer than the age of the universe on any machine
      ever built, while the FFT finishes in seconds. Whole fields exist because of this one algorithm.</p>
    </div>
    ${t ? `<div class="card tight"><div class="ttl">Measured, just now, in this browser</div>
      ${kv('data', esc(t.on))}
      ${kv('N', String(t.N))}
      ${kv('direct sum', fmtNum(t.dft, 4) + ' ms')}
      ${kv('FFT', fmtNum(t.fft, 4) + ' ms')}
      ${kv('speed-up', '<b>' + fmtNum(t.dft / t.fft, 4) + ' ×</b>')}
      ${kv('largest disagreement', fmtNum(t.agree, 3) + ' — they compute the same thing')}
      <p class="help">The two routines are checked against each other every time you press the button, on
      whatever data is loaded. They agree to rounding error, which is the point: the FFT is not an
      approximation, it is the same sum rearranged so that shared work is done once. Type your own signal
      into the box and press it again — the claim is worth more when the array was not chosen by whoever
      wrote the stage.</p>
    </div>` : ''}
    <div class="card tight"><div class="ttl">Why halving works</div>
      <p class="help">Split the sum into even and odd samples:</p>
      <p class="help" style="font-family:var(--f-math);font-size:14px;color:var(--dim)">
      X[k] = Σ x[2m] e^(−2πik(2m)/N) + e^(−2πik/N) Σ x[2m+1] e^(−2πik(2m)/N)</p>
      <p class="help">Each of those sums is itself a transform of length N/2, and — this is the crucial part —
      the results for <b>k</b> and <b>k + N/2</b> reuse exactly the same two sub-transforms, differing only in
      the sign of the twiddle factor <b>e^(−2πik/N)</b>. So each level computes N/2 of those pairs, the
      <b>butterflies</b>, and there are log₂N levels. Nothing is discarded and nothing is approximated; the
      algorithm simply stops recomputing what it already knows.</p>
      <p class="help">This is also why the length must be a power of two for the simplest version — and why
      real libraries carry extra machinery for lengths that are not.</p>
    </div>`;
  },
  chip(st){ const N = 1 << st.p;
    return `<div class="k">N = ${N}</div>
      <div style="color:var(--c-pos)">N² = ${ckEng(ftDFTCost(N),'')}</div>
      <div style="color:var(--c-grad)">FFT = ${ckEng(ftFFTCost(N),'')}</div>`; },
  legend(){ return [['var(--c-pos)', 'the direct sum — N²'], ['var(--c-grad)', 'the FFT — ½N log₂N']]; }
};

/* ============================================================================
   6 · THE INVERSE — and what happens if you throw coefficients away
   ============================================================================ */
