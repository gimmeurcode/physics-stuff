STAGES.ftInverse = {
  title: 'The inverse transform',
  derive(st){
    return {
      title:'Getting the signal back, and what happens if you refuse to',
      steps:[
        drvSay('why an inverse must exist',
          'The transform is a change of basis, not a summary. It rewrites the same information in a different coordinate system, so nothing is lost and the process must be reversible. The inverse formula makes that concrete.'),
        drvStep('the inverse is the same integral with the sign flipped',
          `${dv('f')}(${dv('t')}) ${dop('=')} ∫ ${dv('F')}(${dv('w')}) ${dop('e')}^(${dop('+')}2π${dop('i')}${dv('w')}${dv('t')}) d${dv('w')}`,
          'the panel transforms and inverts, printing the agreement with the original'),
        drvSay('the near-symmetry is not a coincidence',
          'The forward transform resolves the signal onto a basis of complex exponentials; the inverse reassembles it from them. The sign difference is the difference between projecting onto a basis vector and adding it back — the same asymmetry as taking a dot product versus forming a linear combination.'),
        drvStep('with every coefficient kept, reconstruction is exact',
          `keep all ${dop('⇒')} error ${dop('=')} rounding only`,
          `keeping ${st.keep} coefficients here — set it to the maximum and the error drops to machine precision`),
        drvSay('so the transform is lossless, and that is what makes the next step interesting',
          'Because the transform loses nothing, any loss must come from a decision to discard. That separation — a lossless transform followed by an explicit choice about what to throw away — is the architecture of every modern compression scheme.'),
        drvStep('discard the small coefficients and the loss is graceful',
          `keep the largest ${dv('k')}, zero the rest`,
          'the panel shows the reconstruction and the residual as k is reduced'),
        drvSay('and this is what JPEG and MP3 actually are',
          'Transform the data, decide which coefficients matter, keep those, invert. JPEG uses a cosine transform on 8×8 blocks and discards high spatial frequencies, because the eye is insensitive to them. MP3 discards frequencies a psychoacoustic model says are masked. The mathematics is this stage; the engineering is the choice of what to drop.'),
        drvSay('the artefacts are predictable from the mathematics',
          'Removing high frequencies removes sharp edges, so over-compressed images go blocky and blurred exactly where detail was. Gibbs ringing appears around hard edges for the same reason it appears in a truncated square wave. The failure modes are the theory showing through.')
      ],
      note:'Set the number of kept coefficients to the maximum and the reconstruction matches the original to machine precision — the panel prints that residual. Everything below that is a deliberate choice, and its cost is measured rather than described.'
    };
  },
  dockLegend: true,
  enter(st, o){ st.keep = o.keep === undefined ? 8 : o.keep; st.kind = o.kind || 'pulse'; st.own = !!o.own; },
  controls(){
    const st = ST, cur = ftInvCur(st);
    return ftSeg('ftIK', st.own ? 'own' : st.kind,
                 [['pulse','a pulse'],['chirp','a chirp'],['noisy','a noisy tone'],['own','type your own']]) +
      (st.own ? fnHtml('ftinv_x', 'x(t) =', pkOwn(st, 'ftinv', FT_INV_OWN, null).x, 't, over one record 0…1') : '') +
      ctlRow('keep', ctlSlider('ftKeep', 1, 64, 1, st.keep)) +
      `<p class="help">${cur.note}</p>
      <p class="help">Transform, throw away all but the largest few coefficients, transform back. With every
      coefficient kept the reconstruction is <b>exact to machine precision</b> — the transform loses nothing.
      Keep fewer and you have lossy compression, which is what JPEG and MP3 are: a transform, a decision about
      which coefficients matter, and an inverse.</p>`;
  },
  wire(){
    ftWireSeg('ftIK', v => { ST.own = (v === 'own'); if(v !== 'own') ST.kind = v; });
    if(ST.own){
      const own = pkOwn(ST, 'ftinv', FT_INV_OWN, null);
      fnWire('ftinv_x', (m, s) => { own.x = s; });
    }
    wireSlider('ftKeep', () => ST.keep, v => { ST.keep = Math.round(v); }, v => Math.round(v) + ' of 64');
  },
  build(st){
    const N = 128, sig = ftInvCur(st).sig();
    const re = Float64Array.from(sig), im = new Float64Array(N);
    ftFFT(re, im, false);
    /* keep the strongest `keep` conjugate pairs, zero the rest */
    const idx = [];
    for(let k = 0; k <= N / 2; k++) idx.push({ k, m: Math.hypot(re[k], im[k]) });
    idx.sort((a, b) => b.m - a.m);
    const keepSet = new Set();
    for(let i = 0; i < Math.min(st.keep, idx.length); i++){
      keepSet.add(idx[i].k);
      if(idx[i].k > 0 && idx[i].k < N / 2) keepSet.add(N - idx[i].k);
    }
    const kr = Float64Array.from(re), ki = Float64Array.from(im);
    for(let k = 0; k < N; k++) if(!keepSet.has(k)){ kr[k] = 0; ki[k] = 0; }
    const rr = Float64Array.from(kr), ri = Float64Array.from(ki);
    ftFFT(rr, ri, true);
    /* and a full round trip, for the exactness claim */
    const er = Float64Array.from(re), ei = Float64Array.from(im);
    ftFFT(er, ei, true);
    let exact = 0, lossy = 0;
    for(let i = 0; i < N; i++){
      exact = Math.max(exact, Math.abs(er[i] - sig[i]));
      lossy += (rr[i] - sig[i]) * (rr[i] - sig[i]);
    }
    return { N, sig, re, im, recon:rr, exact, rms:Math.sqrt(lossy / N), keepSet };
  },
  frame(st, dt, ctx, W, H){
    const d = this.build(st);
    st.last = d;
    const P = ftPanes(W, H, 0.55);
    const xs = [], a = [], b = [];
    for(let i = 0; i < d.N; i++){ xs.push(i); a.push(d.sig[i]); b.push(d.recon[i]); }
    const T = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, 0, d.N - 1, -1.5, 1.6);
    ftFrame(ctx, T, 'sample  n', 'x[n]', 'Original, and the reconstruction from ' + st.keep + ' coefficients');
    plotTicksX(ctx, T, [0, 32, 64, 96, 127], v => String(v));
    ftYTicks(ctx, T, [-1, 0, 1]);
    ftLine(ctx, T, xs, a, rgbCss(TH.faint, 0.85), 1.6);
    ftLine(ctx, T, xs, b, rgbCss(TH.grad), 2);

    const amp = ftAmplitude(d.re, d.im);
    const ks = [], kept = [], drop = [];
    for(let k = 0; k < amp.length; k++){
      ks.push(k);
      kept.push(d.keepSet.has(k) ? amp[k] : 0);
      drop.push(d.keepSet.has(k) ? 0 : amp[k]);
    }
    let mx = 1e-9;
    for(const v of amp) mx = Math.max(mx, v);
    const F = mkPlot(P.bot.x, P.bot.y, P.bot.w, P.bot.h, 0, amp.length - 1, 0, mx * 1.2);
    ftFrame(ctx, F, 'frequency bin  k', '|X[k]|', 'Which coefficients were kept');
    plotTicksX(ctx, F, [0, 16, 32, 48, 64], v => String(v));
    ftYTicks(ctx, F, [0, mx / 2, mx]);
    ftStems(ctx, F, ks, drop, rgbCss(TH.faint, 0.4), 2);
    ftStems(ctx, F, ks, kept, rgbCss(TH.curl), 2.4);
    stageNote(ctx, 'pale stems are the coefficients thrown away — pale curve is what the signal used to be', W, H);
  },
  readout(st){
    const d = st.last || this.build(st);
    const cur = ftInvCur(st);
    return `<div class="card tight"><div class="ttl">The round trip</div>
      ${cur.custom ? kv('signal', esc(cur.name)) : ''}
      ${kv('coefficients kept', st.keep + ' of 65')}
      ${kv('error with ALL kept', ckEng(d.exact, '') + ' — machine precision')}
      ${kv('RMS error with ' + st.keep, fmtNum(d.rms, 5))}
      ${cur.custom ? kv('needed for 1% error', cur.need + ' — measured, one coefficient at a time') : ''}
      ${kv('compression', fmtNum(65 / st.keep, 3) + ' ×')}
      <p class="help">The forward and inverse transforms differ only in the sign of the exponent and a factor
      of 1/N. Applying both returns the original <b>exactly</b> — the transform is a change of basis, and a
      change of basis is invertible by construction. Nothing is lost until you decide to lose it.</p>
    </div>
    <div class="card tight"><div class="ttl">Why this is what compression is</div>
      <p class="help">A signal that looks complicated in time is often simple in frequency — a few large
      coefficients and a long tail of negligible ones. Keeping the large ones and discarding the rest is exactly
      what <b>JPEG</b> does to 8×8 blocks of an image (with a cosine transform) and what <b>MP3</b> does to
      short slices of audio, with the extra refinement of discarding what the ear cannot hear anyway.</p>
      <p class="help">Try each signal in turn. The <b>pulse</b> is compact in time and spread in frequency, so
      it compresses badly and rings when truncated — the same Gibbs overshoot as the series stage, arriving by
      a different route. The <b>noisy tone</b> compresses beautifully, because noise is spread thinly across
      every bin while the tone is concentrated in one: keeping the peaks is, incidentally, a denoiser.</p>
    </div>`;
  },
  chip(st){ const d = st.last;
    return `<div class="k">${st.keep} of 65 coefficients</div>
      ${d ? `<div style="color:var(--c-grad)">RMS error = ${fmtNum(d.rms,4)}</div>` : ''}`; },
  legend(){ return [['var(--c-grad)', 'the reconstruction'], ['var(--faint)', 'the original'],
                    ['var(--c-curl)', 'coefficients kept']]; }
};

/* ============================================================================
   7 · THE CONVOLUTION THEOREM
   ============================================================================ */
STAGES.ftConv = {
  title: 'Convolution',
  derive(st){
    return {
      title:'The theorem that makes the frequency domain worth visiting',
      steps:[
        drvStep('convolution slides one function across another',
          `(${dv('f')} ${dop('*')} ${dv('g')})(${dv('t')}) ${dop('=')} ∫ ${dv('f')}(τ)${dv('g')}(${dv('t')}{−}τ) dτ`,
          'the panel animates the slide and accumulates the overlap at every offset'),
        drvSay('what the flip is for',
          'The g(t − τ) reverses g before sliding it. Without the reversal the operation would be correlation, which measures similarity. Convolution instead describes what a system does to an input, and the reversal is what makes it match the physical picture of a response accumulating over past inputs.'),
        drvStep('now transform the convolution',
          `ℱ{${dv('f')} ${dop('*')} ${dv('g')}} ${dop('=')} ∫∫ ${dv('f')}(τ)${dv('g')}(${dv('t')}{−}τ) ${dop('e')}^(${dop('−')}${dop('i')}${dv('w')}${dv('t')}) dτ d${dv('t')}`,
          'a double integral, with the exponential attached to the outer variable'),
        drvStep('split the exponential using the substitution u = t − τ',
          `${dop('e')}^(${dop('−')}${dop('i')}${dv('w')}${dv('t')}) ${dop('=')} ${dop('e')}^(${dop('−')}${dop('i')}${dv('w')}τ) ${dop('e')}^(${dop('−')}${dop('i')}${dv('w')}${dv('u')})`,
          'because the exponential turns addition into multiplication'),
        drvSay('and that is the whole proof',
          'With the exponential factored, the double integral separates into a product of two independent single integrals — one in τ giving F, one in u giving G. The convolution theorem is a substitution and the exponential rule, nothing more.'),
        drvStep('so convolution becomes multiplication',
          `ℱ{${dv('f')} ${dop('*')} ${dv('g')}} ${dop('=')} ${dv('F')}(${dv('w')}) ${dop('·')} ${dv('G')}(${dv('w')})`,
          `cutoff ${st.cut} — the panel filters both ways and prints the agreement`),
        drvSay('why this is the practical heart of signal processing',
            'A direct convolution of two length-N signals costs N² operations. Transforming both, multiplying pointwise and inverting costs about N log N. For large filters the frequency route is thousands of times faster, and it is how every audio plugin and image filter is actually implemented.'),
        drvSay('and it explains what filtering means',
          'Multiplying a spectrum by a mask that is 1 below a cutoff and 0 above it is a low-pass filter, stated in one line. In the time domain that same operation is a convolution with a sinc function, which is far harder to reason about. Filters are designed in frequency because that is where they are simple.'),
        drvStep('the same theorem runs in reverse',
          `multiplying in time ${dop('=')} convolving in frequency`,
          'which is why sampling — a multiplication by a comb — replicated the spectrum in the previous stage')
      ],
      note:'The bottom row filters the same signal twice by genuinely different routes: a sliding convolution in time, and a pointwise multiplication of spectra followed by an inverse transform. They agree to rounding error, which is the theorem tested rather than asserted.'
    };
  },
  dockLegend: true,
  enter(st, o){ st.cut = o.cut === undefined ? 6 : o.cut; st.own = !!o.own; },
  controls(){
    const st = ST, cur = ftConvCur(st);
    const own = pkOwn(st, 'ftconv', FT_CONV_OWN, null);
    return (st.own ? '' : ctlRow('filter cutoff', ctlSlider('ftCut', 1, 32, 1, st.cut))) +
      ctSeg('ftCOwn', st.own ? 'own' : 'preset',
            [['preset', 'two tones, brick-wall filter'], ['own', 'type your own signal and filter']]) +
      (st.own ? fnHtml('ftconv_x', 'signal x(t) =', own.x, 't, over one record 0…1') +
                fnHtml('ftconv_H', 'filter gain H(k) =', own.H, 'k, the bin index') : '') +
      `<p class="help">${cur.note}</p>
      <p class="help">The bottom row is the same filtering done two completely different ways: on the left by
      <b>convolving</b> in time — sliding one function across the other and integrating at every offset — and on
      the right by <b>multiplying</b> the two spectra bin by bin and transforming back. They agree to rounding
      error. That equivalence is the convolution theorem, and it is why the frequency domain is where filtering
      is actually done.</p>`;
  },
  wire(){
    if(!ST.own) wireSlider('ftCut', () => ST.cut, v => { ST.cut = Math.round(v); }, v => 'bin ' + Math.round(v));
    ctWireSeg('ftCOwn', v => { ST.own = (v === 'own'); });
    if(ST.own){
      const own = pkOwn(ST, 'ftconv', FT_CONV_OWN, null);
      fnWire('ftconv_x', (m, s) => { own.x = s; });
      fnWire('ftconv_H', (m, s) => { own.H = s; });
    }
  },
  build(st){
    const N = 128, cur = ftConvCur(st);
    const sig = cur.sig();
    /* the filter, defined in frequency and brought back to time. The gain is
       read at the folded index min(k, N−k), which is what makes the response
       symmetric and therefore the impulse response real. */
    const hr = new Float64Array(N), hi = new Float64Array(N);
    for(let k = 0; k < N; k++) hr[k] = cur.gain(Math.min(k, N - k));
    const kr = Float64Array.from(hr), ki = Float64Array.from(hi);
    ftFFT(kr, ki, true);                       /* the impulse response */
    const imp = Float64Array.from(kr);
    /* route 1: convolve in time */
    const conv = new Float64Array(N);
    for(let n = 0; n < N; n++)
      for(let m = 0; m < N; m++) conv[n] += sig[m] * imp[(n - m + N) % N];
    /* route 2: multiply in frequency */
    const viaF = ftConvolveFFT(sig, imp);
    let worst = 0;
    for(let i = 0; i < N; i++) worst = Math.max(worst, Math.abs(conv[i] - viaF[i]));
    return { N, sig, imp, conv, viaF, worst };
  },
  frame(st, dt, ctx, W, H){
    const d = this.build(st);
    st.last = d;
    const xs = [];
    for(let i = 0; i < d.N; i++) xs.push(i);
    /* the vertical ranges are measured from the data rather than fixed, because
       a typed signal or a typed filter has no reason to fit somebody else's axes */
    const span = a => { let m = 1e-9; for(const v of a) if(Number.isFinite(v)) m = Math.max(m, Math.abs(v)); return m; };
    const sMax = span(d.sig), hMax = span(d.imp), yMax = Math.max(span(d.conv), span(d.viaF));
    const rowH = (H - 120) / 2, colW = (W - 150) / 2;
    const mk = (cx, cy, cw, ch, y0, y1) => mkPlot(cx, cy, cw, ch, 0, d.N - 1, y0, y1);
    const cur = ftConvCur(st);
    const A = mk(66, 34, colW, rowH, -sMax * 1.35, sMax * 1.35);
    ftFrame(ctx, A, '', 'x[n]', cur.custom ? 'The signal you typed' : 'The signal — 3 Hz plus a 19 Hz intruder');
    ftYTicks(ctx, A, [-sMax, 0, sMax], v => fmtNum(v, 3));
    ftLine(ctx, A, xs, Array.from(d.sig), rgbCss(TH.grad), 1.8);

    const B = mk(66 + colW + 60, 34, colW, rowH, -hMax * 0.5, hMax * 1.2);
    ftFrame(ctx, B, '', 'h[n]', 'The filter, as an impulse response');
    ftYTicks(ctx, B, [0, hMax / 2, hMax], v => fmtNum(v, 3));
    ftLine(ctx, B, xs, Array.from(d.imp), rgbCss(TH.curl), 1.8);

    const C = mk(66, 34 + rowH + 60, colW, rowH, -yMax * 1.35, yMax * 1.35);
    ftFrame(ctx, C, 'sample n', 'y[n]', 'Convolved in time  —  y = x ∗ h');
    plotTicksX(ctx, C, [0, 32, 64, 96, 127], v => String(v));
    ftYTicks(ctx, C, [-yMax, 0, yMax], v => fmtNum(v, 3));
    ftLine(ctx, C, xs, Array.from(d.conv), rgbCss(TH.pos), 2.4);

    const D = mk(66 + colW + 60, 34 + rowH + 60, colW, rowH, -yMax * 1.35, yMax * 1.35);
    ftFrame(ctx, D, 'sample n', 'y[n]', 'Multiplied in frequency  —  Y = X · H');
    plotTicksX(ctx, D, [0, 32, 64, 96, 127], v => String(v));
    ftYTicks(ctx, D, [-yMax, 0, yMax], v => fmtNum(v, 3));
    ftLine(ctx, D, xs, Array.from(d.viaF), rgbCss(TH.grad), 2.4);
    stageNote(ctx, 'the two bottom curves are computed by entirely different routes and lie exactly on top of each other', W, H);
  },
  readout(st){
    const d = st.last || this.build(st);
    const N = d.N;
    const cur = ftConvCur(st);
    return `<div class="card tight"><div class="ttl">The two routes agree</div>
      ${cur.custom ? kv('filter', esc(cur.hName)) : ''}
      ${kv('largest difference', ckEng(d.worst, ''))}
      ${kv('verdict', d.worst < 1e-9 ? '✓ identical to rounding error' : 'check the transform')}
      ${cur.custom ? kv('ringing — h[n] 12 samples out', fmtNum(cur.ring * 100, 3) + '% of its peak') : ''}
      ${kv('cost of convolving', ckEng(N * N, '') + ' operations')}
      ${kv('cost via the FFT', ckEng(3 * ftFFTCost(N) + N, '') + ' operations')}
      <p class="help">Two forward transforms, N multiplications and one inverse beat the direct sum comfortably
      at this size and overwhelmingly at any realistic one. Fast convolution is how long filters are applied to
      audio, how large images are blurred, and how big integers are multiplied.</p>
    </div>
    <div class="card tight"><div class="ttl">The theorem</div>
      <p class="help" style="font-family:var(--f-math);font-size:15px;color:var(--text)">
      x ∗ h &nbsp;⟷&nbsp; X · H</p>
      <p class="help">Convolution in one domain is multiplication in the other, and it works both ways round —
      multiplying two signals in time convolves their spectra, which is exactly what modulation does to a radio
      band, and what a window does to a spectral line.</p>
      <p class="help">This also explains a fact from the circuits wing. A linear circuit's output is the
      convolution of its input with its impulse response — an awkward integral. In frequency it is a single
      multiplication by <b>H(jω)</b>, the transfer function the Bode plot draws. The transfer function <i>is</i>
      the Fourier transform of the impulse response; the two wings are describing the same thing.</p>
      <p class="help">Notice the ripples either side of the filter's impulse response. An ideal brick-wall cutoff
      in frequency is a sinc in time, which rings — the same duality as the rectangle-and-sinc pair. Real filters
      round off the corner precisely to avoid that ringing.</p>
    </div>`;
  },
  chip(st){ const d = st.last;
    return `<div class="k">cutoff at bin ${st.cut}</div>
      ${d ? `<div style="color:var(--c-grad)">routes differ by ${ckEng(d.worst,'')}</div>` : ''}`; },
  legend(){ return [['var(--c-grad)', 'the signal, and the frequency-domain result'],
                    ['var(--c-curl)', 'the filter\'s impulse response'],
                    ['var(--c-pos)', 'the time-domain convolution']]; }
};
