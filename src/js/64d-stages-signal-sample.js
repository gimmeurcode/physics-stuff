/* ============================================================================
   4e · SIGNAL PROCESSING — SAMPLING, AND THE PRICE OF A FINITE RECORD
   Wing C15, stages 1 and 2.

     sigAlias    what a sample rate can and cannot carry: the folding map drawn
                 rather than described, the reconstruction measured against the
                 signal it came from, and the filter that has to go in FRONT
     sigWindow   what a finite record does to a spectrum, and what the seven
                 windows trade against each other — every number measured twice

   Engine: 49a-signal.js. The two-pane layout and the stem/line helpers are the
   Fourier wing's (64a) and are reused unchanged: this wing draws the same two
   pictures for the same reason, and a second set of them would be a second
   thing to keep right.
   ============================================================================ */

/* the reader's own signal, in t, seconds */
const DSP_SIG_OWN = [{ k:'x', label:'x(t) =', vars:'t, in seconds',
                       def:'sin(2*pi*3*t) + 0.5*sin(2*pi*17*t)',
                       audit:'sin(2*pi*5*t)*exp(-t)', build:pkParamBuild }];
const DSP_SIG_HELP =
  'Written in <b>t</b>, over a two-second record — <b>sin(2*pi*7*t)</b>, ' +
  '<b>sin(2*pi*3*t) + 0.5*sin(2*pi*17*t)</b>, <b>exp(-4*t)*sin(2*pi*9*t)</b>, ' +
  '<b>sign(sin(2*pi*2*t))</b>. Nothing is assumed about it: the band limit is ' +
  '<i>measured</i> from a heavily oversampled transform, and so is the fraction of ' +
  'its energy that a given rate would fold.';

/* one accessor, so no stage ever indexes DSP_SIGNALS with a key that might be
   'custom' — the trap AI-GUIDE §3b names */
let DSP_OWN_FN = { src:null, f:null };
function dspCur(st){
  if(st.skey !== 'custom' && DSP_SIGNALS[st.skey]){
    const S = DSP_SIGNALS[st.skey];
    return { name:S.name, short:S.short, x:S.x, ex:S.ex, band:S.band, comps:S.comps || null,
             finst:S.finst || null, why:S.why, own:false, src:null };
  }
  const own = pkOwn(st, 'dspSig', DSP_SIG_OWN, null);
  /* compiled once per formula: this is called several hundred times per rebuild
     and pkParamFn parses on every call */
  if(DSP_OWN_FN.src !== own.x) DSP_OWN_FN = { src:own.x, f:pkParamFn(own.x) };
  const g = DSP_OWN_FN.f;
  return { name:'your own signal', short:'yours', ex:esc(own.x), src:own.x,
           x:t => { const v = g(t, 1); return Number.isFinite(v) ? v : 0; },
           band:null, comps:null, finst:null, own:true,
           why:'Your signal. Nothing about it is declared: the band limit below is the frequency under which all but a ten-thousandth of its energy sits, measured from a transform of 8192 oversampled points, and the alias fraction beside it is measured the same way.' };
}

/* Two stacked panes, like the Fourier wing's `ftPanes` but with the bottom band
   left clear. `ftPanes` runs its lower plot to within ten pixels of the canvas
   floor, so `plotFrame` clamps that plot's x-label to fourteen pixels up and
   `stageNote` writes at eight — six pixels apart, and on a short canvas they
   print through each other. The Fourier wing gets away with it because its
   lower labels are short; a folding map whose axis is called "the frequency a
   tone really has" does not. Reserve the band instead of hoping. */
function dspPanes(W, H, split){
  const s = split === undefined ? 0.5 : split;
  const TOP = 34, MID = 52, BOT = 48;
  const avail = Math.max(80, H - TOP - MID - BOT);
  const th = avail * s;
  return { top:{ x:66, y:TOP, w:W - 110, h:th },
           bot:{ x:66, y:TOP + th + MID, w:W - 110, h:avail - th } };
}
/* Every sample as one path and one fill, rather than one path and one fill per
   sample. At 512 samples the per-dot form is 1 024 rasterising calls a frame
   for a row of dots that has not moved — the shape §2.5 exists to forbid. The
   circles never overlap and are all wound the same way, so the nonzero fill
   rule has nothing to cancel. */
function dspDots(ctx, P, xs, ys, col, r, step){
  const k = Math.max(1, Math.round(step || 1)), rad = r || 2.4;
  ctx.fillStyle = col;
  ctx.beginPath();
  for(let i = 0; i < xs.length; i += k){
    const X = P.X(xs[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, ys[i])));
    if(X < P.px - 2 || X > P.px + P.pw + 2 || !Number.isFinite(Y)) continue;
    ctx.moveTo(X + rad, Y);
    ctx.arc(X, Y, rad, 0, 6.2832);
  }
  ctx.fill();
}

/* Ticks on a ROUNDED step, and both halves matter. `fmtTick(v, step)` gives the
   step exactly the decimals it needs, so handing it an arbitrary step — half a
   record length of 7.529411764705882 s — asks for twelve of them and prints a
   label wider than the axis. Round the step first with `ctNiceStep`, then place
   the ticks on its multiples: `auditticks` cannot see this, because a row of
   twelve-digit labels are all different strings. */
function dspTicks(lo, hi, want){
  const step = ctNiceStep(Math.abs(hi - lo) * (8 / Math.max(2, want || 4)));
  const vals = [];
  for(let k = Math.ceil(lo / step); k * step <= hi + 1e-9 * Math.abs(hi) && vals.length < 24; k++)
    vals.push(k * step);
  return { vals, step, fmt:v => fmtTick(v, step) };
}

/* ---- 1 · SAMPLING --------------------------------------------------------- */
/* Everything expensive is done once per (signal, rate, count, guard) and hung
   on the state. The reconstruction alone is 700 evaluations of a sum over every
   sample — a fifth of a million multiplications — and doing that sixty times a
   second for a picture that has not changed is what auditperf exists to find. */
/* THE RECORD IS TWO SECONDS AND IS NOT A CONTROL, and that was a correction
   rather than a simplification. With the sample COUNT as a slider the record
   was N/fₛ — anywhere from two thirds of a second to eighty-five — and every
   signal in the table is a formula written for a fixed stretch of time. The
   chirp made it visible: at 256 samples and 24 a second the record is 10.7 s,
   over which "sweeping 1 → 14 Hz" reaches 70 Hz instead, and the folding map's
   axis ran to 110. One record, one length, and the rate is the only thing the
   reader changes — which is also what the stage is about. */
function dspAliasCalc(st){
  const C = dspCur(st);
  const dur = DSP_DUR;
  const N = Math.max(8, Math.round(dur * st.fs));
  const key = [C.src || st.skey, st.fs, st.guard ? 1 : 0].join('|');
  if(st._al && st._al.key === key) return st._al;
  const raw = dspSamples(C.x, st.fs, N);
  /* filtered over TWICE the record, because dspReconOrder asks the same question
     of a record twice as long and G.xb is only defined where the fine array is —
     a band-limited signal that stops halfway through would report the truncation
     of the filter rather than the truncation of the sinc sum */
  const G = st.guard ? dspGuard(C.x, st.fs, 2 * N) : null;
  const sig = G ? G.sig.slice(0, N) : raw;
  const M = 700;
  const ts = new Float64Array(M), xs = new Float64Array(M), rec = new Float64Array(M);
  let amax = 1e-9;
  for(let i = 0; i < M; i++){
    const t = i / (M - 1) * dur;
    ts[i] = t; xs[i] = C.x(t); rec[i] = ftSincRecon(sig, st.fs, t);
    if(Number.isFinite(xs[i])) amax = Math.max(amax, Math.abs(xs[i]));
    if(Number.isFinite(rec[i])) amax = Math.max(amax, Math.abs(rec[i]));
  }
  /* one transform of that record answers both questions — see dspEnergyProfile */
  const band = dspBandMeasure(C.x, dur, 1e-4);
  const alias = dspAliasFrac(band.profile, st.fs / 2);
  /* and the same two questions asked of what is ACTUALLY being sampled, which
     is a different signal once the guard is on */
  const aliasAfter = G ? dspAliasFrac(dspEnergyProfile(G.xb, dur), st.fs / 2) : null;
  const R = dspReconErr(G ? G.xb : C.x, st.fs, N, 0.25, sig);
  const O = dspReconOrder(G ? G.xb : C.x, st.fs, N);
  const out = { key, C, N, raw, sig, ts, xs, rec, amax, dur, band, alias, aliasAfter, G,
                /* over the record the reader is looking at, not over the twice
                   longer one the order measurement needed */
                kept:G ? dspKept(G, N) : 1,
                recon:R, order:O, peak:dspPeakFreq(sig, st.fs), nyq:st.fs / 2 };
  st._al = out;
  return out;
}

STAGES.sigAlias = {
  title:'A sample rate, and what it can carry',
  enter(st, o){
    st.skey = o.skey || 'tone';
    st.fs = o.fs === undefined ? 32 : o.fs;
    st.guard = !!o.guard;
    st.show = Object.assign({ recon:true, fold:true }, o.show || {});
    st._al = null;
  },
  controls(){
    const st = ST, A = dspAliasCalc(st);
    return pkSeg('dspSK', DSP_SIGNALS, st.skey, e => e.short) +
      pkBoxes('dspSig', st.skey, st, DSP_SIG_OWN, null, DSP_SIG_HELP) +
      ctlRow('sample rate f<sub>s</sub>', ctlSlider('dspFS', 6, 128, 1, st.fs)) +
      `<div class="row wrap">${ctChk('dspGD', 'filter before sampling (the anti-alias guard)', st.guard)}
        ${ctChk('dspRC', 'the reconstruction from the dots alone', st.show.recon)}</div>
      <p class="help">${A.C.why}</p>
      <p class="help">The lower picture is the <b>folding map</b>: what frequency a tone of any
      frequency <i>appears</i> to have once sampled at this rate. Below the Nyquist frequency
      f<sub>s</sub>/2 it is the identity — the diagonal — and above it the line folds back and forth
      like a concertina. Everything above Nyquist lands on something below it, and once it has, no
      amount of arithmetic afterwards can say which it was.</p>`;
  },
  wire(){
    pkWire('dspSK', 'dspSig', ST.skey, ST, DSP_SIG_OWN, null,
           v => { ST.skey = v; ST._al = null; }, () => { ST._al = null; });
    wireSlider('dspFS', () => ST.fs, v => { ST.fs = Math.max(4, Math.round(v)); ST._al = null; },
               v => Math.round(v) + ' /s — ' + Math.round(DSP_DUR * Math.max(4, Math.round(v))) + ' samples');
    ctWireChk('dspGD', v => { ST.guard = v; ST._al = null; });
    ctWireChk('dspRC', v => { ST.show.recon = v; });
  },
  frame(st, dt, ctx, W, H){
    const A = dspAliasCalc(st), P = dspPanes(W, H, 0.52);
    /* ---- time ---- */
    const T = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, 0, A.dur, -A.amax * 1.25, A.amax * 1.25);
    ftFrame(ctx, T, 'time  t (s)', 'x(t)',
      'The signal, the ' + A.N + ' samples taken of it, and what those samples determine');
    const TX = dspTicks(0, A.dur, 5), TY = dspTicks(-A.amax, A.amax, 4);
    plotTicksX(ctx, T, TX.vals, TX.fmt);
    ftYTicks(ctx, T, TY.vals, TY.fmt);
    /* the signal wide and pale, the reconstruction thin and bright over it —
       two curves that agree are only visibly two if the wider one is under */
    ftLine(ctx, T, A.ts, A.xs, rgbCss(TH.faint, 0.75), 3.4);
    if(st.show.recon) ftLine(ctx, T, A.ts, A.rec, rgbCss(TH.pos, 0.95), 1.6);
    const ts = new Float64Array(A.N);
    for(let i = 0; i < A.N; i++) ts[i] = i / st.fs;
    dspDots(ctx, T, ts, A.sig, rgbCss(TH.grad), 2.4, Math.max(1, Math.round(A.N / 220)));

    /* ---- the folding map ---- */
    const fTop = Math.max(A.nyq * 2.2, (A.C.band || 0) * 1.3, A.band.f * 1.2, 8);
    const F = mkPlot(P.bot.x, P.bot.y, P.bot.w, P.bot.h, 0, fTop, 0, A.nyq * 1.12);
    plotFrame(ctx, F, 'the frequency a tone really has  (Hz)', 'the frequency it appears to have',
      'The folding map at fₛ = ' + fmtNum(st.fs, 4) + ' /s');
    ctGrid(ctx, F);
    /* the identity, up to Nyquist — where sampling is honest */
    ctPath(ctx, F, [{ x:0, y:0 }, { x:A.nyq, y:A.nyq }], rgbCss(TH.pos), 2.6);
    /* and the folds beyond it */
    const pts = [];
    for(let i = 0; i <= 400; i++){
      const f = A.nyq + (fTop - A.nyq) * i / 400;
      pts.push({ x:f, y:ftAlias(f, st.fs) });
    }
    if(fTop > A.nyq) ctPath(ctx, F, pts, rgbCss(TH.neg), 2.2);
    /* the Nyquist frontier */
    ctPath(ctx, F, [{ x:A.nyq, y:0 }, { x:A.nyq, y:A.nyq * 1.12 }], rgbCss(TH.warn, 0.8), 1.4, [5, 4]);
    ctText(ctx, F.X(A.nyq) + 5, F.py + 12, 'fₛ/2 = ' + fmtNum(A.nyq, 4) + ' Hz',
           rgbCss(TH.warn), '600 11px ' + FONT_UI);
    /* every component the signal declares, mapped through it */
    if(A.C.comps){
      for(const c of A.C.comps){
        if(c.f > fTop) continue;
        const y = ftAlias(c.f, st.fs), folded = Math.abs(y - c.f) > 1e-9;
        ctPath(ctx, F, [{ x:c.f, y:0 }, { x:c.f, y }], rgbCss(folded ? TH.neg : TH.pos, 0.5), 1.2, [3, 3]);
        ctPath(ctx, F, [{ x:c.f, y }, { x:0, y }], rgbCss(folded ? TH.neg : TH.pos, 0.5), 1.2, [3, 3]);
        ctx.fillStyle = rgbCss(folded ? TH.neg : TH.pos);
        ctx.beginPath(); ctx.arc(F.X(c.f), F.Y(y), 3.4, 0, 6.2832); ctx.fill();
      }
    }
    /* and the peak the samples ACTUALLY show — the second route, drawn */
    if(A.peak !== null && A.peak > 0 && A.peak <= A.nyq){
      ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(F.px + 8, F.Y(A.peak), 4.6, 0, 6.2832); ctx.stroke();
      ctText(ctx, F.px + 17, F.Y(A.peak), 'measured: ' + fmtNum(A.peak, 4) + ' Hz',
             rgbCss(TH.curl), '600 11px ' + FONT_UI, 'left', 'middle');
    }
    stageNote(ctx, A.C.band === null
      ? 'this signal has no band limit at all — every rate folds some of it, and the panel says how much'
      : (A.C.band <= A.nyq ? 'nothing here is above Nyquist, so the dots determine the signal completely'
                           : 'part of this signal is above Nyquist and has folded down irrecoverably'),
      W, H);
  },
  derive(st){
    const A = dspAliasCalc(st), n = v => fmtNum(v, 4);
    return {
      title:'Why the factor is two, and what happens when it is not met',
      steps:[
        drvSay('what a sampler does, written as multiplication',
          'Taking samples is multiplying the signal by a train of spikes one every 1/fₛ seconds. That is the move that makes the whole subject algebra rather than intuition: nothing is thrown away in the model, the signal is simply multiplied by something.'),
        drvStep('sampling multiplies by a comb',
          `${dv('x')}ₛ(${dv('t')}) ${dop('=')} ${dv('x')}(${dv('t')}) ${dop('·')} Σ δ(${dv('t')} ${dop('−')} ${dv('n')}/${dv('f')}ₛ)`,
          `fₛ = ${n(st.fs)} /s, so the spikes are ${n(1 / st.fs)} s apart`),
        drvStep('and multiplying in time is convolving in frequency',
          `${dv('X')}ₛ(${dv('f')}) ${dop('=')} ${dv('X')}(${dv('f')}) ${dop('*')} Σ δ(${dv('f')} ${dop('−')} ${dv('k')}${dv('f')}ₛ)`,
          'the convolution theorem, from the Fourier wing'),
        drvSay('a comb convolved with anything makes copies of it',
          'Convolving with one spike shifts; convolving with a train of spikes shifts by every one of them at once. So the sampled signal\'s spectrum is the original repeated endlessly, spaced by fₛ. Every fact about sampling is a fact about those copies.'),
        drvStep('the copies must not overlap',
          `${dv('f')}ₛ ${dop('>')} 2${dv('B')}`,
          A.C.band === null
            ? 'this signal has no B: its spectrum never stops, so no rate satisfies this'
            : `B = ${n(A.C.band)} Hz and fₛ = ${n(st.fs)}, so the condition ${st.fs > 2 * A.C.band ? 'holds' : 'FAILS'}`),
        drvSay('and there is the two',
          'A real signal\'s spectrum runs from −B to +B, so it is 2B wide. Copies spaced by fₛ avoid touching exactly when fₛ exceeds that width. Nyquist\'s factor of two is the width of a two-sided spectrum — not a safety margin, and not a rule of thumb.'),
        drvStep('when they do overlap, everything above Nyquist folds down',
          `${dv('f')}_apparent ${dop('=')} |${dv('f')} ${dop('−')} ${dv('kf')}ₛ| , ${dv('k')} the nearest integer`,
          `the picture below is that formula plotted; the measured peak of the samples sits at ${n(A.peak)} Hz`),
        drvSay('the fold is not a distortion, it is an identification',
          'After folding, a tone at f and a tone at fₛ − f have <b>the same samples</b> — not similar ones, identical ones. There is nothing left to undo. That is why the cure is a filter in front of the converter: remove what cannot be represented <i>before</i> it is indistinguishable from what can.'),
        drvStep('and below Nyquist the samples determine the signal exactly',
          `${dv('x')}(${dv('t')}) ${dop('=')} Σ ${dv('x')}[${dv('n')}] ${dfn('sinc')}(${dv('f')}ₛ${dv('t')} ${dop('−')} ${dv('n')})`,
          `the bright curve above; it differs from the signal by ${fmtGap(A.recon.worst, A.recon.gross)} over the middle of the record`),
        drvSay('and what is left of that difference is the record, not the theorem',
          'Whittaker–Shannon sums over <b>all</b> samples, from minus infinity to plus infinity, and sinc decays only as 1/t — so a finite record leaves an error that is worst at the ends and shrinks as the record grows. Doubling the number of samples ' +
          (A.order.ratio > 1.6 ? 'divides it by ' + fmtSig(A.order.ratio, 3) + ', which is the signature of truncation.'
                               : 'changes it by a factor of ' + fmtSig(A.order.ratio, 3) + ' — it does not shrink, which is the signature of aliasing instead. That is the diagnosis: truncation responds to a longer record and folding does not.'))
      ],
      note:'Two routes to the folded frequency are on the picture at once: the formula in rung 7, and the peak of the transform of the samples that were actually taken.'
    };
  },
  readout(st){
    const A = dspAliasCalc(st), C = A.C;
    const fold = C.comps ? C.comps.map(c => ftAlias(c.f, st.fs)) : null;
    const worstFold = fold ? C.comps.reduce((m, c, i) =>
      Math.max(m, Math.abs(fold[i] - c.f) > 1e-9 ? 1 : 0), 0) : 0;
    return `<div class="card tight"><div class="ttl">${esc(C.name)}, sampled at ${fmtNum(st.fs, 4)} /s</div>
      ${kv('x(t)', supify(C.ex || esc(C.src || '')))}
      ${kv('the record', fmtNum(A.dur, 4) + ' s of it, ' + A.N + ' samples')}
      ${kv('Nyquist frequency f_s/2', fmtNum(A.nyq, 5) + ' Hz')}
      ${kv('declared band limit', C.band === null
          ? '<i>none</i> — this signal is not band-limited'
          : fmtNum(C.band, 5) + ' Hz')}
      ${kv('measured, at 99.99% of the energy', fmtNum(A.band.f, 5) + ' Hz')}
      ${kv('energy above Nyquist', A.alias.frac < 1e-12
          ? 'none that can be measured'
          : fmtSig(100 * A.alias.frac, 4) + '%  — measured, not assumed')}
      ${kv('verdict', A.alias.frac < 1e-9
          ? '✓ this rate carries the signal'
          : '✗ ' + fmtSig(100 * A.alias.frac, 3) + '% of it has folded down and cannot be recovered')}
      <p class="help">${C.band === null
        ? 'A signal that occupies a finite stretch of time cannot occupy a finite stretch of frequency, so the "band limit" here is a <i>tolerance</i> rather than a fact: it is where all but a ten-thousandth of the energy stops. Change the tolerance and the number moves — which is exactly what it means to have no band limit.'
        : 'The band limit is a property of the signal, the Nyquist frequency a property of the rate, and the theorem is the comparison between them.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The alias, two ways</div>
      ${fold ? C.comps.map((c, i) => kv('the ' + fmtNum(c.f, 4) + ' Hz component appears at',
          fmtNum(fold[i], 5) + ' Hz' + (Math.abs(fold[i] - c.f) > 1e-9 ? '  ← folded' : '  — unchanged'))).join('')
        : kv('no line spectrum to fold', 'this signal is a continuum, not a set of tones')}
      ${kv('the peak of the samples, measured', A.peak === null
          ? 'not defined — every sample of this record is zero'
          : fmtNum(A.peak, 6) + ' Hz')}
      ${fold && A.peak !== null && !st.guard
          ? kv('against the arithmetic', fmtAgree(A.peak, fold[dspLoudest(C.comps)], 'Hz'))
          : (fold && st.guard
              ? kv('against the arithmetic', 'no comparison to make — the guard is on, so the two routes are describing different signals')
              : '')}
      ${kv('one bin of that transform', fmtNum(st.fs / A.N, 5) + ' Hz')}
      <p class="help">Two routes with nothing in common. One folds the frequency with a modulus —
      arithmetic, no signal involved. The other transforms the ${A.N} samples that were actually
      taken and finds the largest peak, refined between the bins by fitting a parabola to the
      logarithm of the magnitude. They agree to a small fraction of a bin${worstFold ? ', including on the components that folded' : ''}.</p>
    </div>
    <div class="card tight"><div class="ttl">Reconstruction, and which error it is</div>
      ${kv('worst gap over the middle of the record', fmtGap(A.recon.worst, A.recon.gross))}
      ${kv('doubling the record changes it by', fmtSig(A.order.ratio, 4) + '×')}
      ${kv('so this residual is', A.order.ratio > 1.6
          ? 'truncation — the sinc sum is finite and the record is not long enough'
          : 'the alias — it does not respond to a longer record, because nothing is missing from the sum')}
      <p class="help">The same number means opposite things depending on how it behaves. A residual
      that halves when the record doubles is the truncated tail of an infinite sum, and it goes away
      by taking more data. One that does not move is information that is simply gone. Asking the
      question this way — halve the step, double the record, and watch — is how the two are told
      apart anywhere in this laboratory.</p>
    </div>
    ${st.guard ? `<div class="card tight"><div class="ttl">The guard, in front of the sampler</div>
      ${kv('energy above Nyquist, before the filter', A.alias.frac < 1e-12
          ? 'none that can be measured' : fmtSig(100 * A.alias.frac, 4) + '%')}
      ${kv('energy above Nyquist, after it', A.aliasAfter.frac < 1e-12
          ? 'none that can be measured' : fmtSig(100 * A.aliasAfter.frac, 4) + '%')}
      ${kv('so the folding is reduced by', A.aliasAfter.frac < 1e-12 || A.alias.frac < 1e-12
          ? 'everything measurable' : fmtSig(A.alias.frac / A.aliasAfter.frac, 4) + '×')}
      ${kv('energy of the signal that survives', fmtSig(100 * A.kept, 4) + '%')}
      ${kv('the reconstruction against the FILTERED signal',
           /* PRINT WHAT THE ZERO CANCELLED. The filter can remove the signal
              entirely — a 19 Hz tone sampled at 32 is wholly above Nyquist and
              nothing survives — and then the reconstruction and the filtered
              signal are both round-off, the derived scale IS the round-off, and
              a perfect result printed as a 100% disagreement. The scale that
              means something is the amplitude of what went in. */
           fmtGap(A.recon.worst, Math.max(A.recon.gross, A.amax)))}
      <p class="help">The filter is 257 taps of windowed sinc running on an eight-times oversampled
      copy, which is what a converter's analogue front end approximates. Both halves of the trade are
      measured above, and notice that the second row is not zero: a real filter has a transition band,
      so what is left is the content just above Nyquist that it is still climbing towards its stopband
      at. The price of the rest is that the record is now a faithful account of a <i>different
      signal</i>, the band-limited one — which is why the residual row compares against that rather
      than against what you started with, and is the honest description of every digital recording
      ever made.</p>
    </div>` : ''}`;
  },
  chip(st){
    const A = dspAliasCalc(st);
    const bad = A.alias.frac > 1e-9;
    return `<div class="k">fₛ = ${fmtNum(st.fs, 4)} /s · Nyquist ${fmtNum(A.nyq, 4)}</div>
      <div style="color:${bad ? 'var(--c-neg)' : 'var(--c-pos)'}">${bad
        ? fmtSig(100 * A.alias.frac, 3) + '% folds'
        : 'nothing folds'}</div>
      <div style="color:var(--c-dim)">${A.peak === null ? 'every sample is 0' : 'peak at ' + fmtNum(A.peak, 4) + ' Hz'}</div>`;
  },
  legend(st){
    const L = [['var(--faint)', 'the signal itself'],
               ['var(--c-grad)', 'the samples actually taken']];
    L.push(['var(--c-pos)', st.show.recon
              ? 'the reconstruction, and the honest half of the folding map'
              : 'the honest half of the folding map — below Nyquist'],
           ['var(--c-neg)', 'above Nyquist: folded down onto something else'],
           ['var(--c-warn)', 'the Nyquist frontier'],
           ['var(--c-curl)', 'the peak measured from the samples']);
    return L;
  },
  dockLegend:true
};
/* which declared component is loudest — the one the measured peak should land
   on. Reading the first component instead was wrong for the AM signal, whose
   carrier is the third of three. */
function dspLoudest(comps){
  let k = 0;
  for(let i = 1; i < comps.length; i++) if(comps[i].amp > comps[k].amp) k = i;
  return k;
}

/* ---- 2 · WINDOWS ---------------------------------------------------------- */
function dspWinCalc(st){
  const key = [st.wkey, st.N, st.off, st.two ? 1 : 0, st.sep, st.a2].join('|');
  if(st._wn && st._wn.key === key) return st._wn;
  const N = st.N, W = DSP_WIN[st.wkey];
  const w = dspWinArray(st.wkey, N);
  const M = dspWinMetrics(st.wkey, N, 32);
  /* the record: one tone `off` bins away from bin k0, optionally a second */
  const k0 = Math.round(N / 8);
  const re = new Float64Array(N), im = new Float64Array(N);
  const clean = new Float64Array(N);
  for(let n = 0; n < N; n++){
    let v = Math.cos(2 * Math.PI * (k0 + st.off) * n / N);
    if(st.two) v += st.a2 * Math.cos(2 * Math.PI * (k0 + st.off + st.sep) * n / N);
    clean[n] = v;
    re[n] = v * w[n];
  }
  ftFFT(re, im);
  const half = N / 2, g = M.cg || 1;
  const amp = new Float64Array(half + 1);
  for(let k = 0; k <= half; k++) amp[k] = 2 * Math.hypot(re[k], im[k]) / N / g;
  /* the peak, and the dip between the two tones if there are two */
  let peak = 0, pk = 0;
  for(let k = 1; k <= half; k++) if(amp[k] > peak){ peak = amp[k]; pk = k; }
  let dip = null, second = null;
  if(st.two){
    const kb = k0 + st.off + st.sep;
    let lo = Infinity, hi = 0;
    for(let k = Math.floor(k0 + st.off); k <= Math.ceil(kb); k++) lo = Math.min(lo, amp[k]);
    for(let k = Math.max(0, Math.round(kb) - 1); k <= Math.min(half, Math.round(kb) + 1); k++)
      hi = Math.max(hi, amp[k]);
    dip = lo; second = hi;
  }
  /* Route 2, the closed form, sampled sixteen times finer than the bins — and
     computed HERE rather than in frame(), because each point sums up to five
     Dirichlet kernels and there are two thousand of them. A frame that redraws
     an unchanged curve should cost one stroke, not twenty thousand cosines. */
  let curveK = null, curveV = null;
  if(st.wkey !== 'bartlett' && !st.two){
    const n2 = half * 16, f0 = k0 + st.off, g = N * (M.cg || 1);
    curveK = new Float64Array(n2 + 1); curveV = new Float64Array(n2 + 1);
    for(let i = 0; i <= n2; i++){
      const d = i / 16;
      /* BOTH IMAGES, added as complex numbers.
         A real cosine is half a positive-frequency exponential and half a
         negative one, so X[k] = ½[W(k − f₀) + W(k + f₀)] and the one-sided
         amplitude 2|X|/(N·cg) is |W(k − f₀) + W(k + f₀)|/(N·cg). Dropping the
         second term was the first version, and it agreed perfectly whenever f₀
         was a whole number of bins — because then the image's Dirichlet kernel
         has an exact zero at every bin — and disagreed by up to 21 dB the
         moment the tone moved off one. The stage test's failure pattern was
         the diagnosis: off-bin only, and worst at the far end of the axis where
         the two images are equally distant. */
      const p = dspWinSpecExact(st.wkey, d - f0, N);
      const m = dspWinSpecExact(st.wkey, d + f0, N);
      curveK[i] = d;
      curveV[i] = dspDb(Math.hypot(p.re + m.re, p.im + m.im) / g, 1);
    }
  }
  const out = { key, N, w, M, amp, half, k0, peak, pk, dip, second, clean, W, curveK, curveV,
                rectScallop:dspWinMetrics('rect', N, 32).scallopDb,
                flatScallop:dspWinMetrics('flattop', N, 32).scallopDb };
  st._wn = out;
  return out;
}

STAGES.sigWindow = {
  title:'A finite record, and what it costs',
  enter(st, o){
    st.wkey = o.wkey || 'rect';
    st.N = o.N === undefined ? 256 : o.N;
    st.off = o.off === undefined ? 0 : o.off;
    st.two = !!o.two;
    st.sep = o.sep === undefined ? 3 : o.sep;
    st.a2 = o.a2 === undefined ? 0.02 : o.a2;
    st.db = o.db === undefined ? -110 : o.db;
    st._wn = null;
  },
  controls(){
    const st = ST;
    return ctSeg('dspWK', st.wkey, DSP_WIN_KEYS.map(k => [k, DSP_WIN[k].short])) +
      ctlRow('the tone, in bins off centre', ctlSlider('dspOFF', -1, 1, 0.05, st.off)) +
      ctlRow('record length N', ctlSlider('dspWN', 64, 1024, 64, st.N)) +
      `<div class="row wrap">${ctChk('dspTWO', 'a second, quieter tone beside it', st.two)}</div>` +
      (st.two ? ctlRow('how far away, in bins', ctlSlider('dspSEP', 1, 12, 0.25, st.sep)) +
                ctlRow('how much quieter', ctlSlider('dspA2', 0.001, 1, 0.001, st.a2)) : '') +
      ctlRow('the floor of the picture, dB', ctlSlider('dspDB', -140, -20, 5, st.db)) +
      `<p class="help">${DSP_WIN[st.wkey].name}. <b>Drag the offset off zero</b> and watch what a
      rectangle does: a tone that no longer completes a whole number of cycles in the record has a
      jump where the record is imagined to repeat, and a jump has content everywhere. That smear is
      <b>spectral leakage</b>, and a window is the taper that removes the jump.</p>
      <p class="help">Every number in the panel is computed twice. The window's transform is drawn
      here from an FFT of its samples and from a closed-form sum of Dirichlet kernels, on top of one
      another; its coherent gain and its noise bandwidth are summed from the taps and derived from
      the cosine coefficients.</p>`;
  },
  wire(){
    ctWireSeg('dspWK', v => { ST.wkey = v; ST._wn = null; });
    wireSlider('dspOFF', () => ST.off, v => { ST.off = v; ST._wn = null; }, v => fmtNum(+v, 3) + ' bins');
    wireSlider('dspWN', () => ST.N, v => {
      ST.N = Math.pow(2, Math.round(Math.log2(Math.max(32, Math.min(2048, v))))); ST._wn = null;
    }, v => Math.pow(2, Math.round(Math.log2(Math.max(32, Math.min(2048, +v))))) + '');
    ctWireChk('dspTWO', v => { ST.two = v; ST._wn = null; buildStagePanel(); });
    wireSlider('dspSEP', () => ST.sep, v => { ST.sep = v; ST._wn = null; }, v => fmtNum(+v, 3) + ' bins');
    wireSlider('dspA2', () => ST.a2, v => { ST.a2 = v; ST._wn = null; },
               v => fmtSig(20 * Math.log10(Math.max(1e-12, +v)), 3) + ' dB');
    wireSlider('dspDB', () => ST.db, v => { ST.db = v; }, v => fmtNum(+v, 4) + ' dB');
  },
  frame(st, dt, ctx, W, H){
    const A = dspWinCalc(st), P = dspPanes(W, H, 0.36);
    /* ---- the window, and the record it is applied to ---- */
    const T = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, 0, A.N - 1, -1.35, 1.35);
    ftFrame(ctx, T, 'sample  n', '', 'The ' + A.W.short + ' window, and the ' + A.N + ' samples it is applied to');
    ftYTicks(ctx, T, [-1, 0, 1], v => fmtTick(v, 1));
    const NX = dspTicks(0, A.N - 1, 5);
    plotTicksX(ctx, T, NX.vals, NX.fmt);
    const xs = new Float64Array(A.N), ws = new Float64Array(A.N), ys = new Float64Array(A.N);
    for(let n = 0; n < A.N; n++){ xs[n] = n; ws[n] = A.w[n]; ys[n] = A.clean[n] * A.w[n] / 2.2; }
    ftLine(ctx, T, xs, ys, rgbCss(TH.faint, 0.85), 1);
    ftLine(ctx, T, xs, ws, rgbCss(TH.warn), 2.2);
    /* ---- the spectrum in dB, both routes at once ---- */
    const lo = st.db;
    const F = mkPlot(P.bot.x, P.bot.y, P.bot.w, P.bot.h, 0, A.half, lo, 6);
    plotFrame(ctx, F, 'bin  k', 'dB, relative to a tone on a bin',
      'What one tone of amplitude 1 looks like through this window');
    const marks = [];
    for(let d = 0; d >= lo; d -= 20) marks.push(d);
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for(const m of marks){
      ctx.fillText(fmtTick(m, 20), F.px - 6, F.Y(m));
      ctPath(ctx, F, [{ x:0, y:m }, { x:A.half, y:m }], rgbCss(TH.faint, 0.16), 1);
    }
    const FX = dspTicks(0, A.half, 6);
    plotTicksX(ctx, F, FX.vals, FX.fmt);
    /* route 2 first and thick, route 1 over it and thin: two curves that agree
       are only visibly two if the wider one is underneath */
    if(A.curveV) ftLine(ctx, F, A.curveK, A.curveV, rgbCss(TH.pos, 0.5), 3.4);
    const kb = [], vb = [];
    for(let k = 0; k <= A.half; k++){ kb.push(k); vb.push(dspDb(A.amp[k], 1)); }
    ftLine(ctx, F, kb, vb, rgbCss(TH.curl), 1.7);
    ctPath(ctx, F, [{ x:A.k0 + st.off, y:lo }, { x:A.k0 + st.off, y:6 }], rgbCss(TH.warn, 0.7), 1.2, [4, 4]);
    ctText(ctx, F.X(A.k0 + st.off) + 5, F.py + 12,
           'the tone: bin ' + fmtNum(A.k0 + st.off, 5), rgbCss(TH.warn), '600 11px ' + FONT_UI);
    if(st.two){
      const k2 = A.k0 + st.off + st.sep;
      if(k2 <= A.half)
        ctPath(ctx, F, [{ x:k2, y:lo }, { x:k2, y:6 }], rgbCss(TH.neg, 0.6), 1.2, [4, 4]);
    }
    stageNote(ctx, st.two
      ? 'two tones: the question is whether the picture still shows two things'
      : 'the bright curve is an FFT of the samples; the pale one under it is the closed form, and they are the same curve',
      W, H);
  },
  derive(st){
    const A = dspWinCalc(st), W = DSP_WIN[st.wkey];
    const a = W.a;
    return {
      title:'Where leakage comes from, and what a window is trading',
      steps:[
        drvSay('the DFT does not see a piece of a signal — it sees a periodic one',
          'A transform of N samples represents the signal that repeats those N samples forever. If the tone does not complete a whole number of cycles in the record, that imagined repetition has a step in it, and a step has content at every frequency. Nothing has gone wrong; the transform is describing exactly the signal it was given.'),
        drvStep('a finite record is a multiplication by a rectangle',
          `${dv('x')}_rec(${dv('t')}) ${dop('=')} ${dv('x')}(${dv('t')}) ${dop('·')} ${dfn('rect')}(${dv('t')}/${dv('T')})`,
          `T = ${A.N} samples`),
        drvStep('so its spectrum is convolved with the transform of a rectangle',
          `${dv('X')}_rec ${dop('=')} ${dv('X')} ${dop('*')} ${dfn('D')}, ${dfn('D')}(δ) ${dop('=')} ${dfrac('sin πδ', 'sin(πδ/' + dv('N') + ')')}`,
          'the Dirichlet kernel — the discrete sinc, and the pale curve on the picture'),
        drvSay('and that kernel has skirts falling only as 1/δ',
          'The rectangle\'s transform decays as one over the distance in bins, so a single tone smears across the whole spectrum: its first sidelobe is only 13 dB down, and a quiet tone anywhere nearby is buried under the loud one\'s skirts. That is spectral leakage, and it is a property of the rectangle, not of the signal.'),
        drvStep('a window replaces the rectangle with something smoother',
          `${dv('w')}[${dv('n')}] ${dop('=')} Σ (${dop('−')}1)^${dv('k')} ${dv('a')}_${dv('k')} ${dfn('cos')}(2π${dv('kn')}/${dv('N')})`,
          a ? 'here a = [' + a.map(v => fmtNum(v, 6)).join(', ') + ']' : 'a triangle, which is not a cosine sum'),
        drvSay('because a smoother function has a faster-decaying transform',
          'A rectangle is discontinuous, so its transform decays as 1/δ. A Hann window meets zero with zero slope, so its transform decays as 1/δ³ and its worst sidelobe is 31 dB down instead of 13. Every window in the picker is that same trade made at a different exchange rate — and no window escapes it, because the trade is between smoothness and width, and those are the same thing seen twice.'),
        drvStep('what it costs: a wider main lobe',
          `${dfn('ENBW')} ${dop('=')} 1 ${dop('+')} Σ_{${dv('k')}≥1} ${dv('a')}_${dv('k')}² ${dop('/')} 2${dv('a')}₀²`,
          A.M.enbwExact === null
            ? 'measured as ' + fmtSig(A.M.enbw, 6) + ' bins'
            : `= ${fmtSig(A.M.enbwExact, 8)} bins, and summing N·Σw²/(Σw)² over the taps gives ${fmtSig(A.M.enbw, 8)}`),
        drvSay('that closed form is exact, and it is why the identity is worth printing',
          'Over a whole number of periods every cosine sums to zero and every product of two different cosines does too, so Σw = a₀N and Σw² = N(a₀² + ½Σa_k²) with no approximation anywhere. The panel computes the left-hand side by adding up ' + A.N + ' numbers and the right-hand side from four coefficients. A window whose taps were generated wrongly could not survive that comparison.'),
        drvStep('and what it buys: sidelobes',
          `${dfn('peak sidelobe')} ${dop('=')} ${fmtSig(A.M.sidelobeDb, 4)} dB`,
          `first null at ${fmtNum(A.M.firstNull, 3)} bins, −3 dB width ${fmtNum(A.M.width3, 3)} bins, scalloping loss ${fmtSig(A.M.scallopDb, 3)} dB`),
        drvSay('so "which window" is a question about what you are trying to see',
          'To measure a frequency, take the narrowest main lobe you can tolerate. To measure an amplitude of a tone that will not sit on a bin, take the flat top, whose main lobe is nearly four bins wide and whose scalloping loss is a hundredth of a decibel. To see a quiet tone next to a loud one, take the lowest sidelobes you can afford. There is no window that is best, and that is not a failure of the field.')
      ],
      note:'Every figure in rungs 7 and 9 is measured from a 32× zero-padded transform of the taps — the sidelobes of a window live entirely between the bins of its own length, so an unpadded transform of a window shows a single spike and no leakage at all.'
    };
  },
  readout(st){
    const A = dspWinCalc(st), M = A.M;
    const onBin = Math.abs(st.off) < 1e-9;
    return `<div class="card tight"><div class="ttl">${esc(A.W.name)}, over ${A.N} samples</div>
      ${kv('coherent gain, Σw/N', fmtSig(M.cg, 9))}
      ${M.cgExact === null ? '' : kv('the closed form, a₀', fmtSig(M.cgExact, 9))}
      ${M.cgExact === null ? '' : kv('difference', fmtAgree(M.cg, M.cgExact))}
      ${kv('noise bandwidth, N·Σw²/(Σw)²', fmtSig(M.enbw, 9) + ' bins')}
      ${M.enbwExact === null ? '' : kv('the closed form', fmtSig(M.enbwExact, 9) + ' bins')}
      ${M.enbwExact === null ? '' : kv('difference', fmtAgree(M.enbw, M.enbwExact, 'bins'))}
      <p class="help">Both rows are identities rather than approximations, so the differences above
      are round-off and nothing else. They are worth printing because a window with a mistyped
      coefficient would pass every visual check and fail these.</p>
    </div>
    <div class="card tight"><div class="ttl">What it does to one tone</div>
      ${kv('first null', fmtNum(M.firstNull, 4) + ' bins from the peak')}
      ${kv('−3 dB width', fmtNum(M.width3, 4) + ' bins')}
      ${kv('highest sidelobe', fmtSig(M.sidelobeDb, 4) + ' dB')}
      ${kv('scalloping loss, half a bin off', fmtSig(M.scallopDb, 4) + ' dB')}
      ${kv('the tone is', onBin ? 'exactly on bin ' + A.k0 : fmtNum(st.off, 3) + ' bins off bin ' + A.k0)}
      ${kv('so its peak reads', fmtSig(A.peak, 6) + '  (it has amplitude 1)')}
      ${kv('which is', fmtSig(dspDb(A.peak, 1), 4) + ' dB of amplitude error')}
      <p class="help">The amplitude a tone reads is only right when it sits on a bin. Half a bin off,
      a rectangle under-reads it by ${fmtSig(Math.abs(A.rectScallop), 3)} dB
      and a flat top by ${fmtSig(Math.abs(A.flatScallop), 3)} dB — which
      is what the flat top is for and why it is worth a main lobe nearly four bins wide.</p>
    </div>
    ${st.two ? `<div class="card tight"><div class="ttl">Two tones, ${fmtNum(st.sep, 3)} bins apart</div>
      ${kv('the quiet one', fmtSig(20 * Math.log10(st.a2), 4) + ' dB below the loud one')}
      ${kv('the loud peak reads', fmtSig(A.peak, 5))}
      ${kv('the quiet one reads', A.second === null ? '—' : fmtSig(A.second, 5))}
      ${kv('the dip between them', A.dip === null ? '—' : fmtSig(dspDb(A.dip, A.peak), 4) + ' dB below the peak')}
      ${kv('are they resolved?', A.dip !== null && A.second !== null && A.dip < 0.7 * A.second
          ? 'yes — there are two peaks with a valley between them'
          : 'no — the picture shows one lump')}
      <p class="help">Two different failures live here and the picker separates them. Move the tones
      close together and a window with a <i>wide main lobe</i> merges them however low its sidelobes
      are — that is a resolution limit, and only a longer record fixes it. Move them apart and make
      the second one very quiet, and a window with <i>high sidelobes</i> buries it however far away it
      is — that is a dynamic-range limit, and only a better window fixes it. A rectangle fails the
      second at 3 bins; Blackman–Harris survives 90 dB and cannot separate 2.</p>
    </div>` : ''}`;
  },
  chip(st){
    const A = dspWinCalc(st);
    return `<div class="k">${esc(A.W.short)} · N = ${A.N}</div>
      <div style="color:var(--c-curl)">ENBW ${fmtSig(A.M.enbw, 4)} bins</div>
      <div style="color:var(--c-dim)">sidelobes ${fmtSig(A.M.sidelobeDb, 3)} dB</div>`;
  },
  legend(st){
    const L = [['var(--c-warn)', 'the window w[n]'],
               ['var(--faint)', 'the record it multiplies'],
               ['var(--c-curl)', 'the spectrum, from an FFT of the samples']];
    if(st.wkey !== 'bartlett' && !st.two)
      L.push(['var(--c-pos)', 'the same thing in closed form — Dirichlet kernels']);
    if(st.two) L.push(['var(--c-neg)', 'where the second tone is']);
    return L;
  },
  dockLegend:true
};
