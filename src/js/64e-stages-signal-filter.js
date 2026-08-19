/* ============================================================================
   4f · SIGNAL PROCESSING — FILTERS, AND TIME AND FREQUENCY AT ONCE
   Wing C15, stages 3 and 4.

     sigFilter   a filter is two lists of numbers. Its response is computed from
                 those numbers AND measured by driving a complex exponential
                 through the recursion; its group delay three ways; its poles by
                 the root finder the complex-numbers wing built
     sigSpectro  one transform says which frequencies are present and not when.
                 Cutting the record into overlapping pieces says both, at a
                 price that is the same number whatever length you choose

   Engine: 49a-signal.js. Nothing here computes.
   ============================================================================ */

/* A coefficient list is not an expression in x, so fnHtml's validator must be
   told what it is being handed — the same contract the netlist textareas have.
   Without a `build`, `0.25, 0.5, 0.25` is rejected as a parse error, `fnWire`
   never calls its setter, and the box accepts the keystrokes while the picture
   keeps the previous filter. */
const dspCoeffBuild = s => {
  const r = dspCoeffs(s);
  if(!r.ok) throw new Error(r.why);
  return { f:() => 0 };
};
/* and the denominator has one extra condition, which belongs in the validator
   rather than in a downstream guard: a₀ is what the recursion divides by */
const dspDenomBuild = s => {
  const r = dspCoeffs(s);
  if(!r.ok) throw new Error(r.why);
  if(Math.abs(r.c[0]) < 1e-12) throw new Error('a₀ is zero, and the recursion divides by it');
  return { f:() => 0 };
};
const DSP_FIR_OWN = [
  { k:'b', label:'b — the feed-forward taps', vars:'numbers, comma separated',
    def:'0.25, 0.5, 0.25', audit:'1, -0.9, 0.4', build:dspCoeffBuild },
  { k:'a', label:'a — the feedback taps (a₀ first, and it must not be 0)',
    vars:'numbers, comma separated', def:'1', audit:'1, -0.5', build:dspDenomBuild }
];

function dspFiltCur(st){
  if(st.fkey !== 'custom' && DSP_FILTERS[st.fkey]){
    const P = DSP_FILTERS[st.fkey], f = P.make();
    return { name:P.name, short:P.short, b:f.b, a:f.a, kind:P.kind, why:P.why,
             dc:P.dc, nyq:P.nyq, stop:P.stop || null, linear:P.linear,
             delay:P.delay, poleMax:P.poleMax, own:false, ok:true, why2:'' };
  }
  const own = pkOwn(st, 'dspFir', DSP_FIR_OWN, null);
  const B = dspCoeffs(own.b, [1]), A = dspCoeffs(own.a, [1]);
  const ok = B.ok && A.ok && Math.abs(A.c[0]) > 1e-12;
  return { name:'your own filter', short:'yours', b:B.c, a:A.c,
           kind:A.c.length > 1 ? 'IIR' : 'FIR',
           dc:null, nyq:null, stop:null, linear:null, delay:null, poleMax:null,
           own:true, ok,
           why2:!B.ok ? 'b: ' + B.why : !A.ok ? 'a: ' + A.why
                : Math.abs(A.c[0]) < 1e-12 ? 'a₀ is zero, and the recursion divides by it' : '',
           why:'Your filter. Nothing about it is declared, so everything below is measured: its response from the coefficients and again by driving a complex exponential through the recursion, its group delay by differentiating the phase and by the centre of mass of its impulse response, and its stability from the roots of a — which the complex-numbers wing finds by Aberth iteration and which are drawn on the unit circle beside the picture.' };
}

function dspFiltCalc(st){
  const C = dspFiltCur(st);
  const key = [st.fkey, C.b.join(','), C.a.join(','), st.NF].join('|');
  if(st._ft && st._ft.key === key) return st._ft;
  const NF = st.NF, settle = dspSettle(C.b, C.a);
  const fr = new Float64Array(NF + 1);
  const mag = new Float64Array(NF + 1), ph = new Float64Array(NF + 1);
  const dmag = new Float64Array(NF + 1), dph = new Float64Array(NF + 1);
  const gdA = new Float64Array(NF + 1), gdN = new Float64Array(NF + 1);
  let worst = 0, peak = 0, gdWorst = 0, gdPts = 0, gdNull = 0;
  for(let i = 0; i <= NF; i++){
    const f = 0.5 * i / NF;
    fr[i] = f;
    const R = dspResp(C.b, C.a, f), D = dspDrive(C.b, C.a, f, settle);
    mag[i] = R.mag; ph[i] = R.phase; dmag[i] = D.mag; dph[i] = D.phase;
    worst = Math.max(worst, Math.hypot(R.re - D.re, R.im - D.im));
    peak = Math.max(peak, R.mag);
    const a = dspGroupDelay(C.b, C.a, f), n = dspGroupDelayNum(C.b, C.a, f);
    gdA[i] = a === null ? NaN : a; gdN[i] = n === null ? NaN : n;
    if(a === null || n === null) gdNull++;
    else { gdWorst = Math.max(gdWorst, Math.abs(a - n)); gdPts++; }
  }
  const h = dspImpulse(C.b, C.a, Math.min(512, Math.max(48, settle)));
  const poles = dspRoots(C.a), zeros = dspRoots(C.b);
  const out = { key, C, fr, mag, ph, dmag, dph, gdA, gdN, worst, peak, gdWorst, gdPts, gdNull,
                h, poles, zeros, settle,
                rMax:poles.reduce((m, z) => Math.max(m, cxAbs(z)), 0),
                centroid:dspCentroidDelay(C.b, C.a), sym:dspSymResid(C.b),
                dc:dspResp(C.b, C.a, 0).mag, nyq:dspResp(C.b, C.a, 0.5).mag };
  st._ft = out;
  return out;
}

STAGES.sigFilter = {
  title:'A filter, and the two ways to ask what it does',
  enter(st, o){
    st.fkey = o.fkey || 'avg';
    st.NF = o.NF === undefined ? 240 : o.NF;
    st.view = o.view || 'mag';
    st.db = !!o.db;
    st._ft = null;
  },
  controls(){
    const st = ST, A = dspFiltCalc(st);
    return pkSeg('dspFK', DSP_FILTERS, st.fkey, e => e.short) +
      pkBoxes('dspFir', st.fkey, st, DSP_FIR_OWN, null,
        'Two lists of numbers, comma or space separated; every entry may be an expression, so ' +
        '<b>1/3</b> and <b>2*cos(pi/6)</b> are valid. The recursion is ' +
        'a₀y[n] = Σb<sub>k</sub>x[n−k] − Σ<sub>k≥1</sub>a<sub>k</sub>y[n−k]. Leave <b>a</b> as ' +
        '<b>1</b> for an FIR; try <b>b = 1</b> with <b>a = 1, -0.95</b> for a very slow one-pole, ' +
        'or <b>b = 1</b> with <b>a = 1, -1.9, 0.995</b> for a resonance you can hear the shape of.') +
      ctSeg('dspFV', st.view, [['mag', 'gain'], ['phase', 'phase'], ['gd', 'group delay'],
                               ['imp', 'impulse response'], ['pz', 'poles and zeros']]) +
      (st.view === 'mag' ? `<div class="row wrap">${ctChk('dspFDB', 'show the gain in dB', st.db)}</div>` : '') +
      ctlRow('how many frequencies to test', ctlSlider('dspNF', 60, 480, 20, st.NF)) +
      `<p class="help">${A.C.own && !A.C.ok ? '<b style="color:var(--c-neg)">' + esc(A.C.why2) + '</b> — the previous filter is still loaded.' : A.C.why}</p>
      <p class="help">Two curves are drawn on the gain plot and they are the same curve. One
      evaluates B(z)/A(z) on the unit circle from the coefficients. The other <b>runs the filter</b>:
      it drives e<sup>2πifn</sup> through the recursion, waits ${A.settle} samples for the transient to
      die, and divides the output by the input. Nothing is shared between them but the two lists of
      numbers.</p>`;
  },
  wire(){
    pkWire('dspFK', 'dspFir', ST.fkey, ST, DSP_FIR_OWN, null,
           v => { ST.fkey = v; ST._ft = null; }, () => { ST._ft = null; });
    ctWireSeg('dspFV', v => { ST.view = v; buildStagePanel(); updateStageLegend(); });
    ctWireChk('dspFDB', v => { ST.db = v; });
    wireSlider('dspNF', () => ST.NF, v => { ST.NF = Math.max(20, Math.round(v)); ST._ft = null; },
               v => Math.round(v) + ' points');
  },
  frame(st, dt, ctx, W, H){
    const A = dspFiltCalc(st), P = dspPanes(W, H, 0.52);
    /* ---- top: whichever view is chosen ---- */
    if(st.view === 'pz') dspDrawPZ(ctx, A, P.top);
    else if(st.view === 'imp') dspDrawImp(ctx, A, P.top);
    else dspDrawResp(ctx, A, P.top, st);
    /* ---- bottom: the gain, so every other view has the curve it describes in
       the same picture — except when the gain is already on top, where the
       impulse response is the thing worth seeing beside it ---- */
    if(st.view === 'mag') dspDrawImp(ctx, A, P.bot);
    else dspDrawGainStrip(ctx, A, P.bot, st);
    stageNote(ctx, A.worst / Math.max(1e-12, A.peak) < 1e-9
      ? 'the two routes to the response agree to ' + fmtSig(A.worst / A.peak, 2) + ' of the peak gain — they are one curve'
      : 'the two routes differ by ' + fmtSig(A.worst / A.peak, 3) + ' of the peak gain',
      W, H);
  },
  derive(st){
    const A = dspFiltCalc(st), C = A.C;
    const M = C.b.length;
    return {
      title:'From two lists of numbers to a curve, and back',
      steps:[
        drvStep('a filter is a recursion, and that is the whole definition',
          `${dv('a')}₀${dv('y')}[${dv('n')}] ${dop('=')} Σ ${dv('b')}_${dv('k')}${dv('x')}[${dv('n')}${dop('−')}${dv('k')}] ${dop('−')} Σ_{${dv('k')}≥1} ${dv('a')}_${dv('k')}${dv('y')}[${dv('n')}${dop('−')}${dv('k')}]`,
          `b has ${M} tap${M === 1 ? '' : 's'}, a has ${C.a.length} — so this is ${C.kind === 'IIR' ? 'an IIR: the output feeds back' : 'an FIR: no feedback, and the response ends'}`),
        drvSay('feed it e^(2πifn) and something remarkable happens',
          'A recursion with constant coefficients cannot change the frequency of a complex exponential — every term is a delayed copy of the same exponential, and delaying e^(2πifn) by k just multiplies it by e^(−2πifk). So the output is the input times a number. Not approximately: exactly, once the start-up transient is past. That number is the whole behaviour of the filter at that frequency.'),
        drvStep('and that number is B/A on the unit circle',
          `${dv('H')}(${dv('f')}) ${dop('=')} ${dfrac('Σ ' + dv('b') + '_' + dv('k') + ' e^(−2πi' + dv('kf') + ')', 'Σ ' + dv('a') + '_' + dv('k') + ' e^(−2πi' + dv('kf') + ')')}`,
          `at DC that is ${fmtSig(A.dc, 6)} and at Nyquist ${fmtSig(A.nyq, 6)}`),
        drvSay('which is why the picture is drawn twice',
          'The formula above is one route. Actually running the recursion on e^(2πifn) and dividing the output by the input is another, and it shares nothing with the first — no polynomial is evaluated anywhere in it. They are plotted on top of one another, and the worst disagreement across the band is ' + fmtGap(A.worst, A.peak) + '.'),
        drvStep('the phase, differentiated, is a delay',
          `τ(${dv('f')}) ${dop('=')} ${dop('−')} ${dfrac('d arg ' + dv('H'), '2π d' + dv('f'))}`,
          A.C.linear === true
            ? `constant here at ${fmtNum((M - 1) / 2, 5)} samples — every frequency is delayed equally`
            : 'not constant here: different frequencies come out at different times'),
        drvSay('and a constant group delay is what "linear phase" is worth',
          'A filter that delays every frequency by the same amount moves a waveform without changing its shape. One whose delay varies smears it: the components arrive at different times and a sharp edge comes out with a ring before or after it. Symmetric taps give constant delay exactly — reverse the list and it is the same list, so the phase can only be a straight line. That is the one thing an FIR can do that no IIR can, and it is why the taps of every designed filter here are a palindrome.'),
        drvStep('and the delay at DC is the centre of mass of the impulse response',
          `τ(0) ${dop('=')} ${dfrac('Σ ' + dv('n') + dv('h') + '[' + dv('n') + ']', 'Σ ' + dv('h') + '[' + dv('n') + ']')}`,
          A.centroid === null
            ? 'not defined here — Σh is zero, so this filter passes nothing at DC and there is no delay to speak of'
            : `= ${fmtSig(A.centroid, 8)} samples, against ${fmtSig(dspGroupDelay(C.b, C.a, 0), 8)} from the derivative`),
        drvSay('a third route, and it is exact rather than a check',
          'Expand H(f) = Σh[n]e^(−2πifn) for small f: the modulus is Σh to first order and the phase is −2πf·Σnh[n]/Σh. So the group delay at DC is a first moment — the same quantity a physicist would call a centre of mass. Notice it can be <b>negative</b>, and the resonator here makes it so. That is not a violation of causality: a narrowband filter can advance the envelope of a signal it has already been hearing for a long time, and it cannot advance anything that has not started yet.'),
        drvStep('and the poles decide whether any of this exists',
          `${dv('A')}(${dv('z')}) ${dop('=')} 0 ${dop('⟹')} |${dv('z')}| ${dop('<')} 1`,
          C.a.length < 2 ? 'no feedback, so no poles — an FIR is stable whatever its taps are'
            : `largest pole radius ${fmtSig(A.rMax, 6)} — ${A.rMax < 1 ? 'inside the unit circle, so stable' : 'ON OR OUTSIDE the unit circle: the output grows without bound'}`),
        drvSay('and that is a question about the roots of a polynomial',
          'Which is why the root finder from the complex-numbers wing is here doing the work — Aberth iteration on the coefficients of a. The "poles and zeros" view draws them on the unit circle, and the gain curve is one over the distance to the poles times the distance to the zeros. Drag a pole towards the circle and the peak sharpens; push it past and there is nothing left to plot.')
      ],
      note:'Three routes to the group delay and two to the response, and the disagreements are all round-off — except where the group delay is genuinely undefined, at the ' + A.gdNull + ' tested frequencies where H has a zero and its phase jumps by π.'
    };
  },
  readout(st){
    const A = dspFiltCalc(st), C = A.C;
    const gd0 = dspGroupDelay(C.b, C.a, 0);
    return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
      ${C.own && !C.ok ? `<p class="help" style="color:var(--c-neg)">${esc(C.why2)}</p>` : ''}
      ${kv('kind', C.kind + ' — ' + C.b.length + ' feed-forward tap' + (C.b.length === 1 ? '' : 's') +
           ', ' + (C.a.length - 1) + ' feedback')}
      ${kv('gain at DC', fmtSig(A.dc, 8))}
      ${kv('gain at Nyquist', fmtSig(A.nyq, 8))}
      ${kv('largest gain over the ' + (st.NF + 1) + ' frequencies tested', fmtSig(A.peak, 8))}
      ${kv('linear phase?', dspLinearPhase(C.b, C.a)
          ? 'yes — the taps are a palindrome, so the delay is ' + fmtNum((C.b.length - 1) / 2, 5) + ' samples at every frequency'
          : (C.a.length > 1
              ? 'no — there is feedback, and a symmetric numerator says nothing about H once A(z) is dividing it'
              : 'no — the taps differ by up to ' + fmtSig(A.sym, 3) + ', so different frequencies are delayed differently'))}
      ${kv('largest pole radius', C.a.length < 2 ? 'no poles — an FIR' : fmtSig(A.rMax, 6))}
      ${kv('stable?', C.a.length < 2 ? 'always — there is no feedback to run away'
          : (A.rMax < 1 ? 'yes — every pole is inside the unit circle'
                        : 'NO — a pole is at or outside the unit circle and the output grows without bound'))}
    </div>
    <div class="card tight"><div class="ttl">The response, two ways</div>
      ${kv('from the coefficients', 'B(e^(2πif)) / A(e^(2πif)), evaluated')}
      ${kv('by running the filter', 'e^(2πifn) driven through the recursion, ' + A.settle + ' samples to settle')}
      ${kv('worst disagreement over the band', fmtGap(A.worst, A.peak))}
      ${kv('tested at', (st.NF + 1) + ' frequencies from DC to Nyquist')}
      <p class="help">${C.kind === 'FIR'
        ? 'An FIR forgets its start exactly at its last tap, so the second route is not an approximation at all — after ' + (C.b.length - 1) + ' samples the output is the steady state and the two agree to the last bit.'
        : 'An IIR never exactly forgets: its transient decays like the largest pole radius to the power n. The settling count above is where that falls below 10⁻¹⁴, which is why the two routes agree to round-off rather than exactly — and if you push a pole towards the unit circle, watch that count climb.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The group delay, three ways</div>
      ${kv('at DC, by differentiating the phase', gd0 === null ? 'not defined — H vanishes at DC' : fmtSig(gd0, 8) + ' samples')}
      ${kv('at DC, as the centroid of h[n]', A.centroid === null ? 'not defined — Σh is zero' : fmtSig(A.centroid, 8) + ' samples')}
      ${kv('difference', gd0 === null || A.centroid === null
          ? 'no comparison to make — a filter that passes nothing at DC has no delay there'
          : fmtAgree(gd0, A.centroid, 'samples'))}
      ${kv('exact against differenced, worst over the band', fmtGap(A.gdWorst, Math.max(1e-9, Math.abs(A.centroid || (C.b.length - 1) / 2 || 1)), 'samples', 1e-6))}
      ${kv('frequencies where it is not defined', A.gdNull + ' of ' + (st.NF + 1) +
           (A.gdNull ? ' — H has a zero there and arg H jumps by π' : ''))}
      <p class="help">A group delay of −24 999 samples is what the differenced route returns at a
      zero of H if nothing stops it, and it is a phase jump wearing the units of a delay. Both routes
      here refuse instead, which is why the count above is a row rather than a footnote.</p>
    </div>
    ${C.stop ? `<div class="card tight"><div class="ttl">What it claims about its stopband</div>
      ${kv('declared', 'under ' + C.stop[2] + ' dB from ' + C.stop[0] + ' to ' + C.stop[1] + ' cycles/sample')}
      ${kv('measured', fmtSig(dspStopband(C.b, C.a, C.stop[0], C.stop[1]).db, 5) + ' dB')}
      ${kv('verdict', dspStopband(C.b, C.a, C.stop[0], C.stop[1]).db < C.stop[2] ? '✓ met' : '✗ not met')}
      <p class="help">Notice what is <i>not</i> claimed: a gain of exactly zero anywhere. A filter with
      finitely many taps is a trigonometric polynomial, and one of those has only finitely many zeros —
      put them where you like, and between them the gain is small but not nothing. "The stopband is
      under −55 dB" is a statement a design can keep; "the gain at Nyquist is 0" is not.</p>
    </div>` : ''}`;
  },
  chip(st){
    const A = dspFiltCalc(st), C = A.C;
    return `<div class="k">${esc(C.short)} · ${C.kind}</div>
      <div style="color:var(--c-curl)">${C.b.length} tap${C.b.length === 1 ? '' : 's'}${C.a.length > 1 ? ' + ' + (C.a.length - 1) + ' poles' : ''}</div>
      <div style="color:${A.rMax < 1 ? 'var(--c-dim)' : 'var(--c-neg)'}">${C.a.length < 2 ? 'always stable' : (A.rMax < 1 ? 'stable, r = ' + fmtSig(A.rMax, 3) : 'UNSTABLE')}</div>`;
  },
  legend(st){
    if(st.view === 'pz') return [['var(--c-neg)', 'poles — the roots of a'],
                                 ['var(--c-pos)', 'zeros — the roots of b'],
                                 ['var(--c-warn)', 'the unit circle: inside it is stable']];
    if(st.view === 'imp') return [['var(--c-curl)', 'h[n], the response to a single 1'],
                                  ['var(--c-warn)', 'its centre of mass — the delay at DC']];
    if(st.view === 'gd') return [['var(--c-curl)', 'the group delay, differentiated exactly'],
                                 ['var(--c-pos)', 'the same thing, by differencing the phase'],
                                 ['var(--c-neg)', 'where it is not defined']];
    if(st.view === 'phase') return [['var(--c-curl)', 'arg H, from the coefficients'],
                                    ['var(--c-pos)', 'arg H, measured by running the filter']];
    return [['var(--c-pos)', '|H|, measured by running the filter'],
            ['var(--c-curl)', '|H|, from the coefficients — and h[n] below'],
            ['var(--c-warn)', 'the centre of mass of h[n]: the delay at DC']];
  },
  dockLegend:true
};

/* ---- the four views, each small enough to read ---------------------------- */
function dspDrawResp(ctx, A, box, st){
  const phase = st.view === 'phase', gd = st.view === 'gd';
  let lo, hi, title, ylab;
  if(phase){ lo = -Math.PI * 1.1; hi = Math.PI * 1.1; title = 'The phase it applies'; ylab = 'arg H (rad)'; }
  else if(gd){
    let mn = 0, mx = 0;
    for(let i = 0; i <= st.NF; i++) if(Number.isFinite(A.gdA[i])){ mn = Math.min(mn, A.gdA[i]); mx = Math.max(mx, A.gdA[i]); }
    const pad = Math.max(0.5, (mx - mn) * 0.15);
    lo = mn - pad; hi = mx + pad; title = 'How long each frequency takes to get through'; ylab = 'τ (samples)';
  } else if(st.db){ lo = -90; hi = Math.max(6, dspDb(A.peak, 1) + 6); title = 'What it does to each frequency'; ylab = 'gain (dB)'; }
  else { lo = 0; hi = A.peak * 1.15; title = 'What it does to each frequency'; ylab = '|H|'; }
  const P = mkPlot(box.x, box.y, box.w, box.h, 0, 0.5, lo, hi);
  ftFrame(ctx, P, 'frequency  (cycles per sample) — Nyquist is 0.5', ylab, title);
  const TX = dspTicks(0, 0.5, 5), TY = dspTicks(lo, hi, 4);
  plotTicksX(ctx, P, TX.vals, TX.fmt);
  ftYTicks(ctx, P, TY.vals, TY.fmt);
  const xs = A.fr;
  if(gd){
    ftLine(ctx, P, xs, A.gdN, rgbCss(TH.pos, 0.6), 3.4);
    ftLine(ctx, P, xs, A.gdA, rgbCss(TH.curl), 1.8);
    /* the frequencies at which there is no answer, marked rather than skipped */
    for(let i = 0; i <= st.NF; i++) if(!Number.isFinite(A.gdA[i])){
      ctPath(ctx, P, [{ x:xs[i], y:lo }, { x:xs[i], y:hi }], rgbCss(TH.neg, 0.45), 1.2, [3, 3]);
    }
  } else if(phase){
    ftLine(ctx, P, xs, A.dph, rgbCss(TH.pos, 0.6), 3.4);
    ftLine(ctx, P, xs, A.ph, rgbCss(TH.curl), 1.8);
  } else {
    const m1 = new Float64Array(A.mag.length), m2 = new Float64Array(A.mag.length);
    for(let i = 0; i < A.mag.length; i++){
      m1[i] = st.db ? dspDb(A.dmag[i], 1) : A.dmag[i];
      m2[i] = st.db ? dspDb(A.mag[i], 1) : A.mag[i];
    }
    ftLine(ctx, P, xs, m1, rgbCss(TH.pos, 0.55), 3.6);
    ftLine(ctx, P, xs, m2, rgbCss(TH.curl), 1.8);
  }
}
/* the impulse response — the filter's whole identity, as a stem plot */
function dspDrawImp(ctx, A, box){
  let mx = 1e-9;
  for(let n = 0; n < A.h.length; n++) mx = Math.max(mx, Math.abs(A.h[n]));
  const P = mkPlot(box.x, box.y, box.w, box.h, -0.5, A.h.length - 0.5, -mx * 1.2, mx * 1.2);
  ftFrame(ctx, P, 'sample  n', 'h[n]',
    'The response to a single 1 — and it determines everything else');
  const TX = dspTicks(0, A.h.length - 1, 5), TY = dspTicks(-mx, mx, 4);
  plotTicksX(ctx, P, TX.vals, TX.fmt);
  ftYTicks(ctx, P, TY.vals, TY.fmt);
  const ns = [], vs = [];
  const step = Math.max(1, Math.round(A.h.length / 260));
  for(let n = 0; n < A.h.length; n += step){ ns.push(n); vs.push(A.h[n]); }
  ftStems(ctx, P, ns, vs, rgbCss(TH.curl), 1.8);
  if(A.centroid !== null && A.centroid >= -0.5 && A.centroid <= A.h.length - 0.5){
    ctPath(ctx, P, [{ x:A.centroid, y:-mx * 1.2 }, { x:A.centroid, y:mx * 1.2 }],
           rgbCss(TH.warn), 1.6, [5, 4]);
    ctText(ctx, P.X(A.centroid) + 6, P.py + 12,
           'centre of mass: ' + fmtNum(A.centroid, 5) + ' samples',
           rgbCss(TH.warn), '600 11px ' + FONT_UI);
  }
}
/* poles and zeros on the unit circle. EQUAL SCALES, or a circle is an ellipse
   and "inside the unit circle" stops meaning anything — ctFitBox is asked for
   the room that will actually be granted before the scale is chosen. */
function dspDrawPZ(ctx, A, box){
  let R = 1.35;
  for(const z of A.poles) R = Math.max(R, cxAbs(z) * 1.25);
  for(const z of A.zeros) R = Math.max(R, cxAbs(z) * 1.25);
  const F = ctFitBox(box.x, box.y, box.w, box.h);
  const s = Math.min(F.pw, F.ph) / (2 * R);
  const w = 2 * R * s, h = 2 * R * s;
  const P = mkPlot(F.px + (F.pw - w) / 2, F.py + (F.ph - h) / 2, w, h, -R, R, -R, R);
  /* the verdict belongs in the TITLE, not under the axis: a caption at
     P.py + P.ph + 26 lands squarely on the row of tick labels, and it did */
  plotFrame(ctx, P, 'Re z', 'Im z', 'Where the poles and zeros are' +
    (A.poles.length ? ' — largest radius ' + fmtSig(A.rMax, 4) + (A.rMax < 1 ? ', stable' : ', UNSTABLE')
                    : ' — an FIR has none, and is stable whatever its taps are'));
  /* and an explicit step, because ctNiceStep on a span of 2.7 chooses 0.2 and
     thirteen labels do not fit across a pane this narrow */
  ctGrid(ctx, P, 0.5);
  const circ = [];
  for(let i = 0; i <= 180; i++){
    const t = 2 * Math.PI * i / 180;
    circ.push({ x:Math.cos(t), y:Math.sin(t) });
  }
  ctPath(ctx, P, circ, rgbCss(TH.warn), 1.8);
  for(const z of A.zeros){
    ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(P.X(z.re), P.Y(z.im), 5, 0, 6.2832); ctx.stroke();
  }
  for(const z of A.poles){
    const X = P.X(z.re), Y = P.Y(z.im), d = 5;
    ctx.strokeStyle = rgbCss(cxAbs(z) < 1 ? TH.neg : TH.warn); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(X - d, Y - d); ctx.lineTo(X + d, Y + d);
    ctx.moveTo(X - d, Y + d); ctx.lineTo(X + d, Y - d); ctx.stroke();
  }
}
/* the gain, always, under whichever view is on top — so the other four views
   have the curve they are describing in the same picture */
function dspDrawGainStrip(ctx, A, box, st){
  const useDb = st.view !== 'mag' || st.db;
  const lo = useDb ? -90 : 0, hi = useDb ? Math.max(6, dspDb(A.peak, 1) + 6) : A.peak * 1.15;
  const P = mkPlot(box.x, box.y, box.w, box.h, 0, 0.5, lo, hi);
  ftFrame(ctx, P, 'frequency  (cycles per sample)', useDb ? '|H| (dB)' : '|H|',
    'The gain, for reference');
  const TX = dspTicks(0, 0.5, 5), TY = dspTicks(lo, hi, 4);
  plotTicksX(ctx, P, TX.vals, TX.fmt);
  ftYTicks(ctx, P, TY.vals, TY.fmt);
  const v = new Float64Array(A.mag.length);
  for(let i = 0; i < A.mag.length; i++) v[i] = useDb ? dspDb(A.mag[i], 1) : A.mag[i];
  ftLine(ctx, P, A.fr, v, rgbCss(TH.curl), 1.8);
}

/* ---- 4 · THE SPECTROGRAM -------------------------------------------------- */
function dspSpecCalc(st){
  const C = dspCur(st);
  const key = [C.src || st.skey, st.fs, st.NW, st.wkey, st.hopDiv].join('|');
  if(st._sp && st._sp.key === key) return st._sp;
  /* One record of a FIXED LENGTH IN SECONDS, so moving the window changes the
     resolution and nothing else: a total that grew with N would change the
     picture twice at once and the invariance would be impossible to see. Eight
     seconds rather than the sampling stage's two, because a spectrogram is
     about content that MOVES and two seconds of it is a smear. */
  const total = Math.max(64, Math.round(DSP_SPEC_DUR * st.fs));
  const sig = dspSamples(C.x, st.fs, total);
  const hop = Math.max(1, Math.round(st.NW / st.hopDiv));
  const S = dspStft(sig, st.NW, hop, st.wkey);
  /* the loudest cell, so the colour scale has an honest top */
  let top = 1e-30;
  for(let c = 0; c < S.cols; c++) for(let k = 0; k <= S.half; k++) top = Math.max(top, S.mag[c][k]);
  const ridge = new Float64Array(S.cols), times = new Float64Array(S.cols);
  for(let c = 0; c < S.cols; c++){
    ridge[c] = dspRidge(S.mag[c], st.fs, st.NW);
    times[c] = S.centre(c) / st.fs;
  }
  const R = dspStftResolution(st.NW, st.fs, st.wkey);
  const err = C.finst ? dspRidgeError(S, st.fs, C.finst) : null;
  const out = { key, C, S, top, ridge, times, R, err, hop, total, dur:total / st.fs };
  st._sp = out;
  return out;
}

STAGES.sigSpectro = {
  title:'Time and frequency at once, and what that costs',
  enter(st, o){
    st.skey = o.skey || 'chirp';
    st.fs = o.fs === undefined ? 128 : o.fs;
    st.NW = o.NW === undefined ? 64 : o.NW;
    st.wkey = o.wkey || 'hann';
    st.hopDiv = o.hopDiv === undefined ? 4 : o.hopDiv;
    st.ridge = o.ridge === undefined ? true : !!o.ridge;
    st.floor = o.floor === undefined ? -60 : o.floor;
    st._sp = null;
  },
  controls(){
    const st = ST, A = dspSpecCalc(st);
    return pkSeg('dspSPK', DSP_SIGNALS, st.skey, e => e.short) +
      pkBoxes('dspSig', st.skey, st, DSP_SIG_OWN, null, DSP_SIG_HELP) +
      ctlRow('sample rate f<sub>s</sub>', ctlSlider('dspSPS', 32, 256, 8, st.fs)) +
      ctlRow('window length N', ctlSlider('dspSPN', 16, 256, 16, st.NW)) +
      ctSeg('dspSPW', st.wkey, DSP_WIN_KEYS.map(k => [k, DSP_WIN[k].short])) +
      ctlRow('overlap — hop is N over', ctlSlider('dspSPH', 1, 8, 1, st.hopDiv)) +
      ctlRow('the floor of the colour scale, dB', ctlSlider('dspSPF', -100, -10, 5, st.floor)) +
      `<div class="row wrap">${ctChk('dspSPR', 'the ridge — the loudest frequency in each column', st.ridge)}</div>
      <p class="help"><b>Drag the window length.</b> A short window pins the time and blurs the
      frequency; a long one does the opposite. The panel measures both and multiplies them, and the
      product does not move: it is the window's noise bandwidth, ${fmtSig(A.R.product, 5)} here, and
      no choice of N changes it. That is the discrete form of the uncertainty relation, and it is the
      reason there is no "best" setting to find.</p>
      <p class="help">${A.C.why}</p>`;
  },
  wire(){
    pkWire('dspSPK', 'dspSig', ST.skey, ST, DSP_SIG_OWN, null,
           v => { ST.skey = v; ST._sp = null; }, () => { ST._sp = null; });
    wireSlider('dspSPS', () => ST.fs, v => { ST.fs = Math.max(16, Math.round(v)); ST._sp = null; },
               v => Math.round(v) + ' /s — Nyquist ' + fmtNum(Math.round(v) / 2, 4) + ' Hz');
    wireSlider('dspSPN', () => ST.NW, v => {
      ST.NW = Math.pow(2, Math.round(Math.log2(Math.max(16, Math.min(256, v))))); ST._sp = null;
    }, v => Math.pow(2, Math.round(Math.log2(Math.max(16, Math.min(256, +v))))) + ' samples');
    ctWireSeg('dspSPW', v => { ST.wkey = v; ST._sp = null; });
    wireSlider('dspSPH', () => ST.hopDiv, v => { ST.hopDiv = Math.max(1, Math.round(v)); ST._sp = null; },
               v => 'N/' + Math.max(1, Math.round(v)));
    wireSlider('dspSPF', () => ST.floor, v => { ST.floor = v; }, v => fmtNum(+v, 4) + ' dB');
    ctWireChk('dspSPR', v => { ST.ridge = v; });
  },
  frame(st, dt, ctx, W, H){
    const A = dspSpecCalc(st);
    const gap = 26, top = 44, bot = 86;
    const pw = Math.max(120, W - 2 * gap - 40), ph = Math.max(120, H - top - bot);
    const P = mkPlot(gap + 40, top, pw, ph, 0, A.dur, 0, st.fs / 2);
    plotFrame(ctx, P, 'time  t (s)', 'frequency  (Hz)',
      'Every column is one transform of ' + st.NW + ' samples');
    /* THE PIXELS, not a grid of fillRects: one ImageData and one drawImage,
       whatever the resolution. A per-cell paint here would be cols × bins calls
       per frame, which for a 120-column picture is thousands. */
    const cells = 128, floor = st.floor;
    ctHeat(ctx, P, (t, f) => {
      const c = Math.min(A.S.cols - 1, Math.max(0, Math.round((t * st.fs - (st.NW - 1) / 2) / A.hop)));
      const k = Math.min(A.S.half, Math.max(0, Math.round(f * st.NW / st.fs)));
      const d = dspDb(A.S.mag[c][k], A.top);
      return Math.max(floor, Math.min(0, d));
    }, floor, 0, cells, 0.95);
    ctGrid(ctx, P, undefined, true);
    /* the ridge, and the law it is being compared against */
    if(st.ridge){
      const step = Math.max(1, Math.round(A.S.cols / 240));
      const tx = [], ty = [];
      for(let c = 0; c < A.S.cols; c += step){ tx.push(A.times[c]); ty.push(A.ridge[c]); }
      ftLine(ctx, P, tx, ty, rgbCss(TH.warn), 2);
      if(A.C.finst){
        const fx = [], fy = [];
        for(let i = 0; i <= 100; i++){
          const t = A.dur * i / 100;
          fx.push(t); fy.push(A.C.finst(t));
        }
        ftLine(ctx, P, fx, fy, rgbCss(TH.pos, 0.85), 1.4);
      }
    }
    /* the resolution cell, drawn at the size it actually is */
    const bx = P.px + 14, by = P.py + P.ph - 14 - (A.R.df / (st.fs / 2)) * P.ph;
    const bw = (A.R.dt / A.dur) * P.pw, bh = (A.R.df / (st.fs / 2)) * P.ph;
    ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 1.6;
    ctx.strokeRect(bx, by, Math.max(2, bw), Math.max(2, bh));
    ctText(ctx, bx + Math.max(2, bw) + 6, by + Math.max(2, bh) / 2,
           fmtNum(A.R.dt, 3) + ' s × ' + fmtNum(A.R.df, 3) + ' Hz',
           rgbCss(TH.curl), '600 11px ' + FONT_UI, 'left', 'middle');
    stageNote(ctx, 'the box is one resolution cell — its area is the same at every window length',
              W, H);
  },
  derive(st){
    const A = dspSpecCalc(st);
    return {
      title:'Why you cannot have both, and what the product is',
      steps:[
        drvSay('one transform of the whole record answers the wrong question',
          'It says which frequencies are present over the whole record and nothing about when. For a chirp that is almost useless: the answer is "all of them, roughly equally", which is true and tells you nothing about the fact that they arrived in order.'),
        drvStep('so transform a piece at a time',
          `${dv('X')}(${dv('c')}, ${dv('k')}) ${dop('=')} Σ_${dv('n')} ${dv('x')}[${dv('c')}·hop ${dop('+')} ${dv('n')}] ${dv('w')}[${dv('n')}] e^(−2πi${dv('kn')}/${dv('N')})`,
          `N = ${st.NW} samples, hop = ${A.hop}, ${A.S.cols} columns over ${fmtNum(A.dur, 4)} s`),
        drvSay('and now the window is doing two jobs at once',
          'In the last stage a window was a taper that controlled leakage. Here it is also the thing that decides <b>when</b> — each column reports the content of one window-length of signal, so the window IS the time resolution. The two roles are the same object, which is why the trade below is unavoidable rather than an engineering compromise.'),
        drvStep('the time a column localises',
          `Δ${dv('t')} ${dop('=')} ${dv('N')}/${dv('f')}ₛ`,
          `= ${fmtNum(A.R.dt, 6)} s`),
        drvStep('and the frequency it resolves',
          `Δ${dv('f')} ${dop('=')} ${dfn('ENBW')} ${dop('·')} ${dv('f')}ₛ/${dv('N')}`,
          `= ${fmtNum(A.R.df, 6)} Hz, with the ${DSP_WIN[st.wkey].short} window's ENBW of ${fmtSig(A.R.product, 6)} bins`),
        drvStep('so their product does not contain N at all',
          `Δ${dv('t')} ${dop('·')} Δ${dv('f')} ${dop('=')} ${dfn('ENBW')}`,
          `= ${fmtSig(A.R.product, 8)}, and the slider cannot change it`),
        drvSay('which is the uncertainty relation, in the only form a computer sees',
          'The continuous statement is σ_t·σ_f ≥ 1/4π and it is proved from Cauchy–Schwarz. The discrete one here is cruder and more useful: the area of the resolution cell drawn on the picture is fixed, and every choice you make is a choice of its <b>shape</b>. Making it tall and thin or short and wide are the only options. This is the same fact as Δx·Δp ≥ ħ/2, with ħ replaced by a window.'),
        A.C.finst
          ? drvStep('and the ridge is measured against the law it came from',
              `${dv('f')}(${dv('t')}) ${dop('=')} ${dv('f')}₀ ${dop('+')} ${dv('k')}${dv('t')}`,
              `worst deviation ${fmtGap(A.err.worst, A.err.gross, 'Hz')} over ${A.err.cols} columns, against a bin of ${fmtNum(st.fs / st.NW, 5)} Hz`)
          : drvSay('this signal has no instantaneous frequency to compare against',
              'The ridge is still the loudest frequency in each column, and for a stationary signal it should simply be flat. Choose the chirp to see it measured against a law it was built from.'),
        drvSay('and the ridge lands at the middle of its window, not its start',
          'A window of N samples sees the chirp sweep across it, so the frequency it reports is an average over that stretch — which, for a sweep that is linear, is the instantaneous frequency at the centre. Comparing against the frequency at the window\'s start would produce a residual of half the sweep per window and look like a broken estimator. The comparison above uses the centre for that reason, and the residual is what is left after it.')
      ],
      note:'The peak in each column is refined between the bins by fitting a parabola to the LOGARITHM of the magnitude — near its top a windowed peak is nearly Gaussian, and the log of a Gaussian is exactly a parabola, so the fit has no systematic bias to be mistaken for an error in the ridge.'
    };
  },
  readout(st){
    const A = dspSpecCalc(st);
    return `<div class="card tight"><div class="ttl">${esc(A.C.name)}, at ${fmtNum(st.fs, 4)} /s</div>
      ${kv('window', esc(DSP_WIN[st.wkey].name) + ', ' + st.NW + ' samples')}
      ${kv('columns', A.S.cols + ', hopping ' + A.hop + ' samples')}
      ${kv('bins per column', (A.S.half + 1) + ', ' + fmtNum(st.fs / st.NW, 5) + ' Hz apart')}
      ${kv('time resolution Δt', fmtNum(A.R.dt, 6) + ' s')}
      ${kv('frequency resolution Δf', fmtNum(A.R.df, 6) + ' Hz')}
      ${kv('their product', fmtSig(A.R.dt * A.R.df, 8))}
      ${kv('the window\'s ENBW', fmtSig(A.R.product, 8) + ' bins')}
      ${kv('difference', fmtAgree(A.R.dt * A.R.df, A.R.product))}
      <p class="help">Those last three rows are the point of the stage. The product of the two
      resolutions is the window's noise bandwidth exactly — the N cancels — so moving the window
      length slider trades one for the other and changes nothing about the pair. Try it: the box
      drawn on the picture changes shape and keeps its area.</p>
    </div>
    ${A.err ? `<div class="card tight"><div class="ttl">The ridge against the law it came from</div>
      ${kv('the signal sweeps', fmtNum(A.C.finst(0), 4) + ' → ' + fmtNum(A.C.finst(A.dur), 4) + ' Hz')}
      ${kv('columns compared', A.err.cols)}
      ${kv('worst deviation', fmtGap(A.err.worst, A.err.gross, 'Hz'))}
      ${kv('one bin is', fmtNum(st.fs / st.NW, 5) + ' Hz')}
      ${kv('so the ridge is good to', fmtSig(A.err.worst / (st.fs / st.NW), 3) + ' of a bin')}
      <p class="help">Two routes with nothing in common: one reads the peak of a transform of the
      samples, the other evaluates f₀ + kt. They are compared at the centre of each window, which is
      where a linear sweep's average frequency actually is.</p>
    </div>` : `<div class="card tight"><div class="ttl">The ridge</div>
      ${kv('loudest frequency, first column', fmtNum(A.ridge[0], 5) + ' Hz')}
      ${kv('loudest frequency, last column', fmtNum(A.ridge[A.S.cols - 1], 5) + ' Hz')}
      ${kv('spread over the record', fmtSig(Math.max.apply(null, Array.from(A.ridge)) -
                                            Math.min.apply(null, Array.from(A.ridge)), 4) + ' Hz')}
      <p class="help">This signal carries no declared instantaneous frequency, so there is nothing to
      compare the ridge against — but a <i>stationary</i> signal should give a flat ridge, and the
      spread above is how flat it is. Choose the chirp for the case where the answer is known in
      advance and measured against.</p>
    </div>`}
    <div class="card tight"><div class="ttl">What the overlap is for</div>
      ${kv('hop', A.hop + ' samples — ' + fmtSig(100 * (1 - A.hop / st.NW), 3) + '% overlap')}
      ${kv('columns per second', fmtSig(st.fs / A.hop, 4))}
      <p class="help">Overlap does not improve the resolution — the box on the picture does not
      change when you move this slider. What it does is stop events falling between the columns: with
      no overlap a click halfway between two windows is tapered to nothing by both. The cost is
      arithmetic, and the usual choice is a hop of a quarter of the window.</p>
    </div>`;
  },
  chip(st){
    const A = dspSpecCalc(st);
    return `<div class="k">N = ${st.NW} · ${esc(DSP_WIN[st.wkey].short)}</div>
      <div style="color:var(--c-curl)">${fmtNum(A.R.dt, 3)} s × ${fmtNum(A.R.df, 3)} Hz</div>
      <div style="color:var(--c-dim)">product ${fmtSig(A.R.product, 4)}</div>`;
  },
  legend(st){
    const L = [['var(--c-curl)', 'one resolution cell — Δt by Δf']];
    if(st.ridge){
      L.push(['var(--c-warn)', 'the ridge: the loudest frequency in each column']);
      if(dspCur(st).finst) L.push(['var(--c-pos)', 'the instantaneous frequency it was built from']);
    }
    return L;
  },
  dockLegend:true
};
