/* ============================================================================
   4m · THE SEQUENCES & SERIES WING   (AP Calculus BC unit 10)
   ============================================================================ */

/* ---- 1 · partial sums, and what convergence looks like -------------------- */
STAGES.srConverge = {
  title:'Series and their partial sums',
  derive(st){
    const S = srSeriesCur(st);
    return {
      title:'An infinite sum is a limit of finite ones, and nothing else',
      steps:[
        drvSay('there is no such operation as "adding infinitely many things"',
          'Addition is defined for two numbers, and by repetition for any finite collection. It is not defined for infinitely many. So an infinite series is not an addition at all — it is a limit of the sequence of finite additions, and every property it has must be earned from that definition.'),
        drvStep('form the partial sums, which are ordinary finite sums',
          `${dv('S')}_N ${dop('=')} Σ_(n=1)^N ${dv('a')}ₙ`,
          `at N = ${st.N} the partial sum is printed above, alongside N = 1000 and N = 4000`),
        drvStep('the series converges exactly when that sequence does',
          `Σ ${dv('a')}ₙ ${dop('=')} ${dlim(dv('N'), '∞')} ${dv('S')}_N`,
          S ? esc(S.name) + ' — ' + (S.converges ? 'converges' : 'diverges') : ''),
        drvSay('why the terms going to zero is not enough',
          'If the sum settles, consecutive partial sums must get close, so aₙ = Sₙ − Sₙ₋₁ must go to zero. That gives a test for divergence and nothing more. The harmonic series has terms going to zero and still diverges — slowly, but without bound. Watching it crawl past 1000 terms and keep climbing is the honest way to feel that.'),
        drvStep('the nth-term test can only ever say "no"',
          `${dv('a')}ₙ ${dop('↛')} 0 ${dop('⇒')} diverges`,
          'the converse is false, and the harmonic series is the standing counterexample'),
        drvStep('comparison with an integral settles the p-series',
          `Σ ${dfrac('1', dv('n') + '^p')} converges ${dop('⟺')} ${dv('p')} ${dop('>')} 1`,
          'the panel integrates the same function out to 10⁹ and reports whether it is still growing'),
        drvSay('the ratio and root tests measure the same thing',
          'Both ask how nearly geometric the tail is. If |aₙ₊₁/aₙ| settles below 1, the tail is eventually dominated by a convergent geometric series and comparison finishes the argument. At L = 1 the tail is not geometric to leading order and neither test can see far enough — which is exactly where the p-series live, and why they need the integral test.'),
        drvStep('so the tests are ranked by how much they can resolve',
          `${dv('L')} ${dop('<')} 1 converge, ${dv('L')} ${dop('>')} 1 diverge, ${dv('L')} ${dop('=')} 1 no information`,
          'the panel prints all three tests and names which one actually settles this series')
      ],
      note:'A partial sum at N = 4000 tells you almost nothing on its own: the harmonic series passes 8.7 there and keeps going forever. Convergence is a statement about the limit, and no finite computation can establish it — which is why the tests exist at all.'
    };
  },
  enter(st, o){
    st.key = o.key || 'harm';
    st.N = o.N === undefined ? 60 : o.N;
    st.log = o.log !== false;
  },
  controls(){
    const st = ST, S = srSeriesCur(st);
    return pkSeg('srCK', SR_SERIES, st.key, e => e.name.replace('Σ ', '').split('  ')[0]) +
      pkBoxes('srser', st.key, st, SR_SER_OWN, null,
        'The nth term, written in <b>n</b> — <b>1/n^2</b>, <b>1/(n*log(n+1))</b>, <b>(0.9)^n</b>, ' +
        '<b>n/(n^2+1)</b>. A hundred thousand terms are summed and the movement between the ' +
        'ten-thousandth and hundred-thousandth partial sum is reported, because that increment is ' +
        'the only honest measure of how far a partial sum may still be from the total.') +
      ctlRow('terms N', ctlSlider('srCN', 3, 400, 1, st.N)) +
      ctChk('srClog', 'log axis for N', st.log) +
      `<p class="help"><b>${S.name}</b> — ${S.note}</p>
      <p class="help">A series <i>is</i> the sequence of its partial sums. The stems below are the terms
      being added; the curve above is the running total. Convergence means that curve settles on a
      horizontal line, and nothing else — it is a statement about the partial sums, never about the terms.</p>
      <p class="help">Watch the harmonic series against 1/n². The terms look almost identical for the first
      few dozen, and one total climbs forever while the other stops at π²/6. Whether the terms shrink is
      the wrong question; the question is whether they shrink <i>fast enough</i>.</p>`;
  },
  wire(){
  ctWireSeg('srCK', v => { ST.key = v; });
    pkWireBoxes('srser', ST.key, ST, SR_SER_OWN, null);
    wireSlider('srCN', () => ST.N, v => { ST.N = Math.round(v); }, v => Math.round(v) + ' terms');
    ctWireChk('srClog', v => { ST.log = v; });
  },
  frame(st, dt, ctx, W, H){
    const S = srSeriesCur(st);
    const from = st.key === 'geo' ? 0 : st.key === 'lnn' ? 2 : 1;
    const big = Math.max(st.N, 400);
    const P0 = srPartials(S.term, big, from);
    let lo = 0, hi = 0;
    for(let i = 0; i <= st.N; i++){ lo = Math.min(lo, P0[i]); hi = Math.max(hi, P0[i]); }
    const pad = (hi - lo) * 0.15 + 0.05;
    const hp = (H - 156) * 0.62;
    const P = mkPlot(78, 46, W - 126, hp, st.log ? 0 : 1, st.log ? Math.log10(st.N + 1) : st.N,
                     lo - pad, hi + pad);
    plotFrame(ctx, P, st.log ? 'log₁₀ N' : 'N', 'partial sum Sₙ',
      'the running total after N terms' + (Number.isFinite(S.sum) ? '  —  it converges to ' + fmtNum(S.sum, 8) : '  —  it diverges'));
    plotZeroY(ctx, P);
    if(st.log) plotTicksX(ctx, P, [0, 1, 2, Math.log10(st.N + 1)], v => String(Math.round(Math.pow(10, v))));
    else plotTicksX(ctx, P, [1, st.N / 2, st.N], v => String(Math.round(v)));
    if(Number.isFinite(S.sum)){
      ctx.strokeStyle = rgbCss(TH.warn, 0.85); ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(P.px, P.Y(S.sum)); ctx.lineTo(P.px + P.pw, P.Y(S.sum)); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, P.px + 8, P.Y(S.sum) - 6, 'the sum: ' + fmtNum(S.sum, 8), rgbCss(TH.warn), '600 11px ' + FONT_MONO);
    }
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for(let n = 1; n <= st.N; n++){
      const X = P.X(st.log ? Math.log10(n) : n);
      const Y = P.Y(Math.max(P.y0, Math.min(P.y1, P0[n])));
      n === 1 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    }
    ctx.stroke();
    /* the terms themselves, as stems */
    const Q = mkPlot(78, 46 + hp + 56, W - 126, H - 156 - hp, 0.5, Math.min(st.N, 60) + 0.5, 0, 0);
    let tmax = 1e-9, tmin = 0;
    for(let n = 1; n <= Math.min(st.N, 60); n++){
      const t = S.term(n + from - 1);
      if(Number.isFinite(t)){ tmax = Math.max(tmax, t); tmin = Math.min(tmin, t); }
    }
    const R = mkPlot(78, 46 + hp + 56, W - 126, H - 156 - hp, 0.5, Math.min(st.N, 60) + 0.5,
                     tmin * 1.2 - 0.02, tmax * 1.2 + 0.02);
    plotFrame(ctx, R, 'n', 'aₙ', 'the terms being added');
    plotZeroY(ctx, R);
    plotTicksX(ctx, R, [1, 20, 40, 60].filter(v => v <= Math.min(st.N, 60)), v => String(v));
    for(let n = 1; n <= Math.min(st.N, 60); n++){
      const t = S.term(n + from - 1);
      if(!Number.isFinite(t)) continue;
      const col = rgbCss(t >= 0 ? TH.pos : TH.neg);
      ctx.strokeStyle = col; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(R.X(n), R.Y(0)); ctx.lineTo(R.X(n), R.Y(t)); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(R.X(n), R.Y(t), 2.6, 0, 6.2832); ctx.fill();
    }
    stageNote(ctx, 'a series converges when its partial sums settle — not when its terms do', W, H);
  },
  readout(st){
    const S = srSeriesCur(st);
    const from = st.key === 'geo' ? 0 : st.key === 'lnn' ? 2 : 1;
    const P = srPartials(S.term, Math.max(st.N, 4000), from);
    const nth = srNthTerm(S.term, 400);
    const rat = srRatio(S.term, st.key === 'nfact' ? 20 : 400);
    const root = srRoot(S.term, st.key === 'nfact' ? 20 : 400);
    return `<div class="card tight"><div class="ttl">${S.name}</div>
      ${kv('S at N = ' + st.N, fmtNum(P[st.N], 9))}
      ${kv('S at N = 1000', fmtNum(P[Math.min(1000, P.length - 1)], 9))}
      ${kv('S at N = 4000', fmtNum(P[Math.min(4000, P.length - 1)], 9))}
      ${kv('the exact sum', Number.isFinite(S.sum) ? fmtNum(S.sum, 10) : 'there is none — it diverges')}
      ${Number.isFinite(S.sum) ? kv('error at N', fmtNum(Math.abs(P[st.N] - S.sum), 3)) : ''}
      ${kv('verdict', S.converges ? 'converges' : 'diverges')}
    </div>
    <div class="card tight"><div class="ttl">The tests, each run on these terms</div>
      ${kv('nth-term test', nth.verdict)}
      ${kv('ratio test  L', fmtNum(rat.L, 6) + ' — ' + rat.verdict)}
      ${kv('root test  L', fmtNum(root.L, 6) + ' — ' + root.verdict)}
      ${kv('which test settles it', S.kind)}
      <p class="help">Notice how often the answer is <b>inconclusive</b>. The ratio and root tests both
      return exactly 1 for every p-series, so neither can tell 1/n from 1/n² — and those two have opposite
      answers. Only the integral test draws that line, which is why it exists.</p>
    </div>
    <div class="card tight"><div class="ttl">The integral test, on this term</div>
      ${(() => {
        const f = x => S.term(x);
        const I = srIntegral(f, Math.max(1, from));
        return kv('∫ from ' + Math.max(1, from) + ' to 10⁶', fmtNum(I.atCutoff.I2, 6)) +
               kv('∫ to 10⁹', fmtNum(I.atCutoff.I3, 6)) +
               kv('still growing?', I.converges ? 'no — it has settled' : 'yes — the integral diverges') +
               kv('verdict', I.verdict);
      })()}
      <p class="help">The integral is taken to a finite cut-off and the cut-off is then pushed out by three
      more orders of magnitude. If the answer moves, the integral diverges. Substituting infinity into a
      finite interval instead would let a logarithmic divergence hide inside the quadrature's own
      truncation, and Σ1/n would come back "convergent" — which is exactly the trap this avoids.</p>
    </div>`;
  },
  chip(st){
    const from = st.key === 'geo' ? 0 : st.key === 'lnn' ? 2 : 1;
    const P = srPartials(srSeriesCur(st).term, st.N, from);
    return `<div class="k">S at N = ${st.N}</div>
      <div style="color:var(--c-grad)">${fmtNum(P[st.N], 7)}</div>
      <div style="color:${srSeriesCur(st).converges ? 'var(--c-pos)' : 'var(--c-neg)'}">${srSeriesCur(st).converges ? 'converges' : 'diverges'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the partial sums'], ['var(--c-warn)', 'the value they converge to'],
                    ['var(--c-pos)', 'positive terms'], ['var(--c-neg)', 'negative terms']]; },
  dockLegend:true
};

/* ---- 2 · alternating series and the error bound --------------------------- */
STAGES.srAlt = {
  title:'Alternating series',
  derive(st){
    return {
      title:'Why alternating signs give an error bound for free',
      steps:[
        drvSay('the picture that proves it',
          'Partial sums of an alternating series with decreasing terms overshoot and undershoot the answer in turn. Each new term is smaller than the last, so each step reverses direction and travels less far than the step before. The sums therefore close in on the limit like a nested set of intervals.'),
        drvStep('the hypotheses, both of which are needed',
          `${dv('a')}ₙ ${dop('>')} 0, decreasing, and ${dv('a')}ₙ ${dop('→')} 0`,
          'decreasing alone is not enough — the terms must actually reach zero'),
        drvStep('the even partial sums increase, the odd ones decrease',
          `${dv('S')}₂ ${dop('≤')} ${dv('S')}₄ ${dop('≤')} … ${dop('≤')} ${dv('S')} ${dop('≤')} … ${dop('≤')} ${dv('S')}₃ ${dop('≤')} ${dv('S')}₁`,
          'two monotone bounded sequences, so both converge by the monotone convergence theorem'),
        drvStep('and their gap is one term wide',
          `${dv('S')}₂ₙ₊₁ ${dop('−')} ${dv('S')}₂ₙ ${dop('=')} ${dv('a')}₂ₙ₊₁ ${dop('→')} 0`,
          'so the two limits coincide, and the series converges'),
        drvStep('the limit is trapped between consecutive partial sums',
          `|${dv('S')} ${dop('−')} ${dv('S')}_N| ${dop('≤')} |${dv('a')}_(N+1)|`,
          `at N = ${st.N} the panel prints the actual error beside the bound, and how much slack there is`),
        drvSay('this bound is unusually good, and unusually rare',
          'Most convergence tests tell you only that a limit exists. This one hands you an error bound that is simply the next term you did not add — no derivatives, no suprema, no constants to estimate. It is why alternating series were the practical way to compute logarithms and π for centuries.'),
        drvSay('but convergence here can be fragile',
          'Take absolute values and the alternating harmonic series becomes the harmonic series, which diverges. Convergence that survives taking absolute values is called absolute; convergence that does not is conditional, and it depends on cancellation between the terms rather than on their size.'),
        drvStep('and conditional convergence is genuinely unstable',
          `rearranging a conditionally convergent series can give ${dv('any')} sum`,
          'Riemann\'s rearrangement theorem — the panel reports which kind of convergence this is'),
        drvSay('why rearranging can possibly matter, since addition commutes',
          'It commutes for <b>finitely</b> many terms. An infinite sum is not an addition at all: it is the limit of the sequence of partial sums, and reordering the terms reorders that sequence into a different one, which may perfectly well have a different limit. Riemann\'s construction is disarmingly simple — take positive terms until you pass your target, then negative ones until you drop below it, and repeat. It works precisely because the positives alone diverge and the negatives alone diverge, so there is always more of each to draw on, and it converges to the target because the terms are shrinking.'),
        drvSay('so "the sum" of a conditionally convergent series is an incomplete phrase',
          'It is the sum <i>in the order written</i>. Absolute convergence is what buys back the right to treat an infinite sum like a finite one — to reorder it, to split it in two, to swap it with another sum or with an integral. That is why the tests in this wing bother to ask about absolute convergence separately, and why it is the hypothesis quietly assumed every time a double series is summed in the other order.'),
        drvSay('and the alternating harmonic series is the standard example for a reason',
          'It converges to ln 2, and its terms taken absolutely are the harmonic series, which diverges. So it sits exactly on the boundary: convergent, but only through cancellation, and rearrangeable to any number you like. It is also slow — a thousand terms give three digits — which is why the practical computation of ln 2 uses a different series entirely and why a bound that is merely the next term is more useful than it first appears.')
      ],
      note:'Riemann\'s theorem is not a curiosity. It says that for a conditionally convergent series, addition has lost commutativity — the order of the terms is part of the answer. That is the price of relying on cancellation instead of on smallness, and it is why absolute convergence is the property that most later theorems require.'
    };
  },
  enter(st, o){
    st.key = o.key || 'alt';
    st.N = o.N === undefined ? 12 : o.N;
  },
  controls(){
    const st = ST;
    return ctSeg('srAK', st.key, [['alt', 'Σ(−1)ⁿ⁺¹/n'], ['altsq', 'Σ(−1)ⁿ⁺¹/n²'], ['custom', 'type your own']]) +
      pkBoxes('sralt', st.key, st, SR_ALT_OWN, null,
        'Write the index as <b>n</b>. The three hypotheses of the test — alternating signs, decreasing ' +
        'sizes, terms going to zero — are checked against your term rather than assumed, and the panel ' +
        'says which of them hold. Try <b>(-1)^n/ln(n+1)</b>, or <b>(-1)^n*n/(n+1)</b> to watch the ' +
        'guarantee fail because the terms never reach zero.') +
      ctlRow('terms N', ctlSlider('srAN', 1, 40, 1, st.N)) +
      `<p class="help">An alternating series whose terms decrease in size to zero <b>always</b> converges,
      and the error after N terms is at most the size of the first term you left out. That is the
      simplest useful error bound in the subject, and the picture shows why: the partial sums bracket the
      answer, alternately overshooting and undershooting, and the gap between consecutive ones is exactly
      the next term.</p>
      <p class="help">The two series here behave very differently. <b>Σ(−1)ⁿ⁺¹/n²</b> converges
      <i>absolutely</i> — its absolute values converge too — and is robust: rearrange it however you like
      and the sum does not move. <b>Σ(−1)ⁿ⁺¹/n</b> converges only <i>conditionally</i>, since Σ1/n
      diverges, and Riemann proved such a series can be rearranged to sum to any number you name.</p>`;
  },
  wire(){
    pkWire('srAK', 'sralt', ST.key, ST, SR_ALT_OWN, null, v => { ST.key = v; });
    wireSlider('srAN', () => ST.N, v => { ST.N = Math.round(v); }, v => Math.round(v) + ' terms');
  },
  frame(st, dt, ctx, W, H){
    const S = srAltCur(st);
    const P = srPartials(S.term, 60);
    const P50 = mkPlot(80, 46, W - 128, H - 134, 0.5, 40.5,
      Math.min(...Array.from({ length:40 }, (_, i) => P[i + 1])) - 0.06,
      Math.max(...Array.from({ length:40 }, (_, i) => P[i + 1])) + 0.06);
    plotFrame(ctx, P50, 'N', 'partial sum', 'the partial sums bracket the answer, alternately over and under');
    plotTicksX(ctx, P50, [1, 10, 20, 30, 40], v => String(v));
    /* the error bound as a shaded band around the true sum */
    ctx.fillStyle = rgbCss(TH.warn, 0.13);
    for(let n = 1; n <= 40; n++){
      const b = Math.abs(S.term(n + 1));
      ctx.fillRect(P50.X(n - 0.45), P50.Y(S.sum + b), P50.X(n + 0.45) - P50.X(n - 0.45),
                   P50.Y(S.sum - b) - P50.Y(S.sum + b));
    }
    ctx.strokeStyle = rgbCss(TH.warn, 0.9); ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(P50.px, P50.Y(S.sum)); ctx.lineTo(P50.px + P50.pw, P50.Y(S.sum)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.2;
    ctx.beginPath();
    for(let n = 1; n <= 40; n++){
      const X = P50.X(n), Y = P50.Y(Math.max(P50.y0, Math.min(P50.y1, P[n])));
      n === 1 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
    }
    ctx.stroke();
    for(let n = 1; n <= 40; n++){
      ctx.fillStyle = rgbCss(n <= st.N ? TH.grad : TH.faint, n <= st.N ? 1 : 0.5);
      ctx.beginPath(); ctx.arc(P50.X(n), P50.Y(Math.max(P50.y0, Math.min(P50.y1, P[n]))),
                               n === st.N ? 5 : 2.8, 0, 6.2832); ctx.fill();
    }
    probeLine(ctx, P50, st.N, 'N');
    stageNote(ctx, 'the shaded band is the guaranteed error bound — the sum never leaves it', W, H);
  },
  readout(st){
    const S = srAltCur(st);
    const rows = [];
    for(const n of [2, 5, 10, 20, 40]){
      const b = srAltBound(S.term, n, S.sum);
      rows.push(kv('N = ' + n, `S = ${fmtNum(b.partial, 8)}   err ${fmtNum(b.error, 3)}   bound ${fmtNum(b.bound, 3)}`));
    }
    const cur = srAltBound(S.term, st.N, S.sum);
    /* A branch on st.key silently takes the wrong arm once `custom` is a
       possible key, so the series of absolute values is named by the entry
       itself — and for a typed term its convergence is measured, not looked up. */
    const absSeries = S.absName
      ? { name:S.absName, converges:S.absConverges }
      : (st.key === 'alt' ? SR_SERIES.harm : SR_SERIES.p2);
    return `<div class="card tight"><div class="ttl">At N = ${st.N}</div>
      ${kv('partial sum', fmtNum(cur.partial, 10))}
      ${kv('the true sum', fmtNum(S.sum, 10))}
      ${kv('actual error', fmtNum(cur.error, 4))}
      ${kv('the guaranteed bound |a<sub>N+1</sub>|', fmtNum(cur.bound, 4))}
      ${kv('does the bound hold?', cur.holds ? 'yes' : 'no')}
      ${kv('how much slack', fmtNum(cur.bound / (cur.error || 1e-30), 4) + '×')}
      ${S.altHolds === undefined ? '' : kv('are the test\'s hypotheses met?',
        S.altHolds ? 'all three, checked against your terms' : 'no — see below, the guarantee does not apply')}
    </div>
    <div class="card tight"><div class="ttl">The bound at several N</div>
      ${rows.join('')}
      <p class="help">To guarantee three decimal places you need the first omitted term below 5×10⁻⁴ —
      which for Σ(−1)ⁿ⁺¹/n means about two thousand terms. Alternating series are easy to bound and often
      dreadful to compute with.</p>
    </div>
    <div class="card tight"><div class="ttl">Absolute or conditional?</div>
      ${kv('the series of absolute values', absSeries.name)}
      ${kv('does that converge?', absSeries.converges ? 'yes' : 'no')}
      ${kv('so this convergence is', S.abs ? 'absolute — robust under rearrangement' : 'conditional — the order matters')}
      <p class="help">${S.abs
        ? 'Absolute convergence is the strong kind. Every rearrangement gives the same sum, the series can be multiplied by another, and it behaves like a finite sum in almost every respect.'
        : 'Riemann\'s rearrangement theorem: a conditionally convergent series can be reordered to converge to <i>any</i> real number, or to diverge. The sum is a property of the ordering as much as of the terms — which is why "absolutely convergent" is a hypothesis in so many theorems.'}</p>
    </div>`;
  },
  chip(st){
    const b = srAltBound(srAltCur(st).term, st.N, srAltCur(st).sum);
    return `<div class="k">error at N = ${st.N}</div>
      <div style="color:var(--c-grad)">${fmtNum(b.error, 5)}</div>
      <div style="color:var(--c-warn)">bound ${fmtNum(b.bound, 5)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the partial sums'], ['var(--c-warn)', 'the sum, and the error band']]; },
  dockLegend:true
};

/* ---- 3 · Taylor polynomials ------------------------------------------------ */
STAGES.srTaylor = {
  title:'Taylor polynomials',
  derive(st){
    const T = srTayCur(st);
    const n = v => fmtNum(v, 8);
    return {
      title:'Building the polynomial that agrees with f as hard as possible',
      steps:[
        drvSay('the design brief',
          'We want a polynomial that behaves like f near a point. Polynomials are the only functions we can evaluate with arithmetic alone, so if this works it makes every other function computable. The question is what "behaves like" should mean, and the answer that works is: agree in as many derivatives as possible.'),
        drvStep('demand that every derivative match at the centre',
          `${dv('T')}⁽ᵏ⁾(${dv('c')}) ${dop('=')} ${dv('f')}⁽ᵏ⁾(${dv('c')}) for ${dv('k')} ${dop('=')} 0…${dv('n')}`,
          `centred at c = ${n(st.c)}`),
        drvStep('write the polynomial in powers of (x − c) and differentiate',
          `${dv('T')}(${dv('x')}) ${dop('=')} Σ ${dv('a')}ₖ(${dv('x')}{−}${dv('c')})ᵏ ${dop('⇒')} ${dv('T')}⁽ᵏ⁾(${dv('c')}) ${dop('=')} ${dv('k')}! ${dv('a')}ₖ`,
          'every other term either vanishes or still carries a factor of (x − c)'),
        drvSay('and that is where the factorial comes from',
          'Differentiating (x − c)ᵏ k times brings down k, then k−1, then k−2 — the factorial is the accumulated debris of repeated differentiation. Dividing by it is undoing that, not a normalisation chosen for convenience.'),
        drvStep('so the coefficients are forced',
          `${dv('a')}ₖ ${dop('=')} ${dfrac(dv('f') + '⁽ᵏ⁾(' + dv('c') + ')', dv('k') + '!')}`,
          T ? esc(T.name) + ', with the coefficients computed to order ' + st.N : ''),
        drvStep('what is left over is the remainder, and it has a formula',
          `${dv('R')}ₙ(${dv('x')}) ${dop('=')} ${dfrac(dv('f') + '⁽ⁿ⁺¹⁾(ξ)', '(' + dv('n') + '+1)!')}(${dv('x')}{−}${dv('c')})^(n+1)`,
          `at x = ${n(st.x)} the panel prints the bound and the error actually committed`),
        drvSay('the remainder is the Mean Value Theorem, applied n+1 times',
          'For n = 0 it reads f(x) = f(c) + f′(ξ)(x − c), which is the MVT exactly. Each extra order is the same argument applied once more. That is why the error term looks like the next term of the series with the derivative evaluated at an unknown interior point rather than at c.'),
        drvStep('the factorial usually wins, and that is why this works at all',
          `${dfrac('|' + dv('x') + '−' + dv('c') + '|^(n+1)', '(' + dv('n') + '+1)!')} ${dop('→')} 0`,
          `distance from centre ${n(Math.abs(st.x - st.c))}, radius of convergence ${T ? T.R : '—'}`),
        drvSay('but only inside the radius of convergence',
          'For 1/(1+x²) the function is perfectly smooth on the whole real line, and its Taylor series still refuses to converge beyond |x| = 1. Nothing on the real line explains that. The obstruction is a singularity at x = ±i, off the real axis entirely — which is the complex-analysis wing\'s answer to a real-analysis mystery.')
      ],
      note:'The panel measures the radius of convergence from the coefficients by the root test and prints it against the theoretical value. Where a function is smooth but its series has a finite radius, that measured number is the distance to the nearest complex singularity — computed here without ever leaving the real axis.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key || 'exp';
    st.N = o.N === undefined ? 3 : o.N;
    st.c = o.c === undefined ? 0 : o.c;
    st.x = 1.4;
    st.run = o.run !== false;
  },
  controls(){
    const st = ST, T = srTayCur(st);
    return pkSeg('srTK', SR_TAYLOR, st.key, e => e.name) +
      pkBoxes('srtay', st.key, st, SR_TAY_OWN, null,
        'Any f(x) the engine understands. It is differentiated symbolically, so the coefficients and the ' +
        'Lagrange bound are exact for what you type. Try <b>1/(1+x^2)</b> — smooth everywhere on the real ' +
        'line, and its series still refuses to converge past |x| = 1.') +
      ctlRow('degree N', ctlSlider('srTN', 0, 24, 1, st.N)) +
      ctlRow('centre c', ctlSlider('srTc', -1.5, 1.5, 0.02, st.c)) +
      ctChk('srTrun', 'add terms automatically', st.run) +
      `<p class="help"><b>${T.name}</b> — ${T.note}</p>
      <p class="help">A Taylor polynomial is the unique polynomial of its degree whose value and first N
      derivatives match the function at the centre. Everything about it follows from that one requirement:
      the coefficient of (x−c)ᵏ has to be <b>f⁽ᵏ⁾(c)/k!</b>, because differentiating k times and setting
      x = c leaves exactly k! times that coefficient.</p>
      <p class="help"><b>Click the graph</b> to move the evaluation point. Watch the approximation hug the
      curve near the centre and peel away from it further out — and for the series with radius 1, watch it
      fail catastrophically past x = ±1 no matter how many terms you add. More terms buy accuracy inside
      the interval of convergence and nothing at all outside it.</p>`;
  },
  wire(){
    pkWire('srTK', 'srtay', ST.key, ST, SR_TAY_OWN, null, v => { ST.key = v; },
      () => { const T = srTayCur(ST); ST.N = Math.min(ST.N, T.maxN === undefined ? 24 : T.maxN); });
    wireSlider('srTN', () => ST.N, v => { ST.N = Math.round(v); ST.run = false; const c = $('srTrun'); if(c) c.checked = false; },
      v => 'degree ' + Math.round(v),
      /* a limit that is mathematics rather than widget: a preset's coefficients
         come from a closed form and cost nothing, a typed function's come from
         repeated symbolic differentiation and eventually stop being affordable */
      () => { const T = srTayCur(ST);
              return T.maxN === undefined ? null
                : { lo:0, hi:T.maxN,
                    why:'degree ' + T.maxN + ' is as far as your function could be differentiated symbolically' }; });
    wireSlider('srTc', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    ctWireChk('srTrun', v => { ST.run = v; });
  },
  pick(st, sx, sy, phase){
    if(phase === 'up' || !st.P) return;
    st.x = Math.max(st.P.x0, Math.min(st.P.x1, st.P.invX(sx)));
  },
  frame(st, dt, ctx, W, H){
    const T = srTayCur(st);
    const top = T.maxN === undefined ? 24 : T.maxN;
    if(st.run){ st.tAcc = (st.tAcc || 0) + dt; if(st.tAcc > 0.55){ st.tAcc = 0; st.N = (st.N + 1) % (top + 1); } }
    /* The radius moves with the centre — it is the distance from c to the
       nearest singularity, not a constant belonging to the function. Sliding the
       centre of 1/(1−x) towards 1 shrinks the shaded band to nothing, which is
       the whole lesson and was previously drawn as a fixed width of 1. */
    const R = T.rad ? T.rad(st.c) : (T.R === '1' ? 1 : Infinity);
    const fin = Number.isFinite(R) && R > 1e-9 && R < 50;
    const E = fin ? Math.max(2.2, Math.abs(st.c) + R * 1.35) : 5;
    let lo = -3, hi = 3;
    const hp = (H - 156) * 0.62;
    const P = mkPlot(80, 46, W - 128, hp, -E, E, lo, hi);
    st.P = P;
    plotFrame(ctx, P, 'x', '', T.name + '   —   degree ' + st.N + ' about c = ' + fmtNum(st.c, 3));
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [-E, -E / 2, 0, E / 2, E], v => fmtNum(v, 2));
    /* the interval of convergence, shaded */
    if(fin){
      ctx.fillStyle = rgbCss(TH.pos, 0.07);
      ctx.fillRect(P.X(st.c - R), P.py, P.X(st.c + R) - P.X(st.c - R), P.ph);
      for(const s of [-R, R]){
        ctx.strokeStyle = rgbCss(TH.neg, 0.7); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(P.X(st.c + s), P.py); ctx.lineTo(P.X(st.c + s), P.py + P.ph); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    /* the lower-degree polynomials, faint */
    for(let k = 0; k < st.N; k += Math.max(1, Math.floor(st.N / 5)))
      plotCurve(ctx, P, x => srTaylor(T, k, x, st.c), 500, rgbCss(TH.faint, 0.5), 1.1);
    plotCurve(ctx, P, x => T.f(x), 900, rgbCss(TH.warn), 2.8);
    plotCurve(ctx, P, x => srTaylor(T, st.N, x, st.c), 900, rgbCss(TH.grad), 2.4);
    ctDot(ctx, P, st.c, T.f(st.c), 6, rgbCss(TH.curl), rgbCss(TH.bg));
    probeLine(ctx, P, st.x, 'x');
    /* the error, on a log axis */
    const Q = mkPlot(80, 46 + hp + 56, W - 128, H - 156 - hp, -E, E, -16, 2);
    plotFrame(ctx, Q, 'x', 'log₁₀ |f − Tₙ|', 'the error, and where it explodes');
    plotTicksX(ctx, Q, [-E, -E / 2, 0, E / 2, E], v => fmtNum(v, 2));
    ftYTicks(ctx, Q, [-15, -10, -5, 0], v => String(v));
    plotCurve(ctx, Q, x => Math.log10(Math.max(1e-16, Math.abs(T.f(x) - srTaylor(T, st.N, x, st.c)))),
              700, rgbCss(TH.grad), 2.2);
    if(fin){
      for(const s of [-R, R]){
        ctx.strokeStyle = rgbCss(TH.neg, 0.7); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(Q.X(st.c + s), Q.py); ctx.lineTo(Q.X(st.c + s), Q.py + Q.ph); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    probeLine(ctx, Q, st.x, null);
    stageNote(ctx, 'the faint curves are the lower-degree polynomials · the shaded band is where the series converges', W, H);
  },
  readout(st){
    const T = srTayCur(st);
    const val = srTaylor(T, st.N, st.x, st.c);
    const exact = T.f(st.x);
    const L = srLagrange(T, st.N, st.x, st.c);
    const coefs = [];
    for(let k = 0; k <= Math.min(st.N, 9); k++){
      const c = T.coef(k);
      if(Math.abs(c) > 1e-15) coefs.push(kv('a' + k, fmtNum(c, 7)));
      else coefs.push(kv('a' + k, '0'));
    }
    return `<div class="card tight"><div class="ttl">At x = ${fmtNum(st.x, 4)}, degree ${st.N}</div>
      ${kv('Tₙ(x)', fmtNum(val, 10))}
      ${kv('f(x)', fmtNum(exact, 10))}
      ${kv('error', fmtNum(Math.abs(val - exact), 4))}
      ${kv('distance from the centre', fmtNum(Math.abs(st.x - st.c), 5))}
      ${(() => {
        /* the radius belongs to the centre, so it is asked for at the centre
           that is loaded rather than read off a fixed string */
        const R = T.rad ? T.rad(st.c) : (T.R === '1' ? 1 : Infinity);
        const inside = !Number.isFinite(R) || Math.abs(st.x - st.c) < R;
        return kv('radius of convergence about c', Number.isFinite(R) ? fmtNum(R, 5) : 'infinite') +
               kv('inside it?', inside ? 'yes' : 'no — no number of terms will help');
      })()}
    </div>
    <div class="card tight"><div class="ttl">The Lagrange remainder</div>
      ${Number.isFinite(L.bound) ? kv('max |f⁽ⁿ⁺¹⁾| on the interval', fmtNum(L.M, 6)) : ''}
      ${Number.isFinite(L.bound) ? kv('bound  M|x−c|ⁿ⁺¹/(n+1)!', fmtNum(L.bound, 4)) : kv('bound', 'not available for this function')}
      ${kv('the error that occurred', fmtNum(L.actual, 4))}
      ${Number.isFinite(L.bound) ? kv('does the bound hold?', L.holds ? 'yes' : 'no') : ''}
      <p class="help">The bound is computed with the maximum of the (n+1)th derivative <i>sampled over the
      interval</i> rather than guessed, and the error that actually occurs is printed beside it. The
      factorial in the denominator is what eventually wins for e^x, sin and cos — and what never gets the
      chance to for a series with a finite radius.</p>
    </div>
    <div class="card tight"><div class="ttl">The coefficients</div>
      ${coefs.join('')}
      ${kv('measured radius (root test)', (() => {
        /* The root test at finite k gives a LOWER bound, and for eˣ, sin and cos
           it gives about 17 — printed beside the "infinite" row above, that read
           as a flat contradiction with nothing to say what the gap meant. So
           measure it at two orders: a finite radius has settled by k = 60, an
           infinite one is still climbing, and the climb is the evidence. */
        const top = T.maxN || 60;
        const half = srRadius(k => T.coef(k, st.c), Math.max(20, Math.round(top / 2)));
        const full = srRadius(k => T.coef(k, st.c), top);
        if(!Number.isFinite(full)) return 'very large — every coefficient has underflowed';
        return full > half * 1.15
          ? `${fmtNum(full, 5)} at order ${top}, up from ${fmtNum(half, 4)} at half that — still climbing, which is what an infinite radius looks like from a finite number of terms`
          : fmtNum(full, 5);
      })())}
      <p class="help">Each aₖ is <b>f⁽ᵏ⁾(c)/k!</b>. The zeros in the list are not rounding: sin is odd so
      its even coefficients vanish identically, and cos is even so its odd ones do. Symmetry of the
      function becomes sparsity of the series.</p>
    </div>`;
  },
  chip(st){
    const T = srTayCur(st);
    return `<div class="k">degree ${st.N}</div>
      <div style="color:var(--c-grad)">${fmtNum(srTaylor(T, st.N, st.x, st.c), 7)}</div>
      <div style="color:var(--c-warn)">f = ${fmtNum(T.f(st.x), 7)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'the function'], ['var(--c-grad)', 'the Taylor polynomial'],
                    ['var(--faint)', 'lower degrees'], ['var(--c-curl)', 'the centre c'],
                    ['var(--c-neg)', 'the edge of convergence']]; },
  dockLegend:true
};

/* ---- 4 · sequences and monotone convergence ------------------------------- */
STAGES.srSeq = {
  title:'Sequences',
  derive(st){
    const S = srSeqCur(st);
    return {
      title:'Making "settles down" into something checkable',
      steps:[
        drvSay('the same difficulty as with limits of functions',
          '"The terms eventually get close to L" cannot be tested as it stands. The fix is the same one: let an adversary name the tolerance, and require that you can always answer with a place in the sequence beyond which every term meets it.'),
        drvStep('the definition',
          `∀ε ${dop('>')} 0 ∃${dv('N')} : ${dv('n')} ${dop('>')} ${dv('N')} ${dop('⇒')} |${dv('a')}ₙ ${dop('−')} ${dv('L')}| ${dop('<')} ε`,
          S ? esc(S.name) + ', limit ' + S.limit : ''),
        drvStep('the panel plays the game at three tolerances',
          `ε ${dop('=')} 0.1, 0.01, 0.001 ${dop('⇒')} ${dv('N')} ${dop('=')} ?`,
          'the index at which the sequence enters each band is marked on the plot and printed'),
        drvSay('watching N grow is the point',
          'N is not a fixed number attached to the sequence — it depends on ε, and it must. A sequence converges quickly if N grows slowly as the band narrows, and slowly if N explodes. That growth rate is the practical content of convergence, and it is invisible in the bare statement that a limit exists.'),
        drvStep('a monotone bounded sequence must converge',
          `increasing and bounded above ${dop('⇒')} converges`,
          S ? `this one is ${S.mono}, and ${S.bounded ? 'bounded' : 'unbounded'}` : ''),
        drvSay('this theorem is unusual: it gives a limit without naming it',
          'Every other convergence argument needs a candidate to compare against. This one produces existence from order and boundedness alone — the limit is the least upper bound, which exists because the real numbers have no gaps. That completeness is what separates ℝ from ℚ: the same sequence of rationals approaching √2 is monotone and bounded and has no rational limit.'),
        drvSay('and it is why a positive series has only two options',
          'Partial sums of a series with positive terms are increasing. So either they are bounded, and the series converges, or they are not, and they run to infinity. There is no third behaviour — no oscillation, no wandering. That dichotomy is what every comparison test quietly relies on.')
      ],
      note:'The bands drawn on the plot are the ε of the definition, and the marked index is the N. Nothing about that picture is metaphorical: it is the definition, drawn.'
    };
  },
  enter(st, o){ st.key = o.key || 'root'; st.N = 40; },
  controls(){
    const st = ST, S = srSeqCur(st);
    return pkSeg('srSK', SR_SEQ, st.key, e => e.name.replace('aₙ = ', '')) + pkBoxes('srseq', st.key, st, SR_SEQ_OWN, null) +
      ctlRow('terms shown', ctlSlider('srSN', 8, 120, 1, st.N)) +
      `<p class="help"><b>${S.name}</b> — ${S.note}</p>
      <p class="help">A sequence converges when its terms eventually stay inside any band around the limit,
      however narrow. The shaded bands drawn here are ±0.1 and ±0.01 around the limit, and the term at
      which the sequence enters each one is marked — that index is the <b>N</b> in the formal
      definition, and it grows as the band narrows.</p>
      <p class="help">The <b>monotone convergence theorem</b> is the one result that gives a limit without
      telling you its value: a sequence that increases and is bounded above must converge. It is the reason
      partial sums of a positive series either converge or run to infinity, with no third possibility.</p>`;
  },
  wire(){
  ctWireSeg('srSK', v => { ST.key = v; });
    pkWireBoxes('srseq', ST.key, ST, SR_SEQ_OWN, null);
    wireSlider('srSN', () => ST.N, v => { ST.N = Math.round(v); }, v => Math.round(v) + ' terms');
  },
  frame(st, dt, ctx, W, H){
    const S = srSeqCur(st);
    let lo = Infinity, hi = -Infinity;
    for(let n = 1; n <= st.N; n++){
      const v = S.f(n);
      if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    const pad = (hi - lo) * 0.2 + 0.08;
    const P = mkPlot(80, 46, W - 128, H - 134, 0.5, st.N + 0.5, lo - pad, hi + pad);
    plotFrame(ctx, P, 'n', 'aₙ', S.name + (Number.isFinite(S.limit) ? '   —   converging to ' + fmtNum(S.limit, 6) : '   —   it does not converge'));
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [1, Math.round(st.N / 3), Math.round(2 * st.N / 3), st.N], v => String(v));
    if(Number.isFinite(S.limit)){
      for(const [eps, alpha] of [[0.1, 0.1], [0.01, 0.16]]){
        ctx.fillStyle = rgbCss(TH.warn, alpha);
        ctx.fillRect(P.px, P.Y(S.limit + eps), P.pw, P.Y(S.limit - eps) - P.Y(S.limit + eps));
      }
      ctx.strokeStyle = rgbCss(TH.warn, 0.9); ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(P.px, P.Y(S.limit)); ctx.lineTo(P.px + P.pw, P.Y(S.limit)); ctx.stroke();
      ctx.setLineDash([]);
    }
    for(let n = 1; n <= st.N; n++){
      const v = S.f(n);
      if(!Number.isFinite(v)) continue;
      ctx.strokeStyle = rgbCss(TH.grad, 0.6); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(P.X(n), P.Y(Math.max(P.y0, Math.min(P.y1, S.limit || 0))));
      ctx.lineTo(P.X(n), P.Y(Math.max(P.y0, Math.min(P.y1, v)))); ctx.stroke();
      ctx.fillStyle = rgbCss(TH.grad);
      ctx.beginPath(); ctx.arc(P.X(n), P.Y(Math.max(P.y0, Math.min(P.y1, v))), 3, 0, 6.2832); ctx.fill();
    }
    stageNote(ctx, 'the two bands are ±0.1 and ±0.01 around the limit — convergence means eventually staying inside every band', W, H);
  },
  readout(st){
    const S = srSeqCur(st);
    const enters = eps => {
      if(!Number.isFinite(S.limit)) return NaN;
      for(let n = 1; n <= 100000; n++) {
        let ok2 = true;
        for(let m = n; m < n + 20; m++) if(Math.abs(S.f(m) - S.limit) >= eps){ ok2 = false; break; }
        if(ok2) return n;
      }
      return NaN;
    };
    return `<div class="card tight"><div class="ttl">${S.name}</div>
      ${kv('a₁', fmtNum(S.f(1), 7))}${kv('a₁₀', fmtNum(S.f(10), 7))}
      ${kv('a₁₀₀', fmtNum(S.f(100), 7))}${kv('a₁₀₀₀₀', fmtNum(S.f(10000), 7))}
      ${kv('limit', Number.isFinite(S.limit) ? fmtNum(S.limit, 7) : 'none')}
      ${kv('monotone?', S.mono)}
      ${kv('bounded?', S.bounded ? 'yes' : 'no')}
    </div>
    <div class="card tight"><div class="ttl">The N for a given ε</div>
      ${kv('ε = 0.1', Number.isFinite(enters(0.1)) ? 'from n = ' + enters(0.1) : 'never')}
      ${kv('ε = 0.01', Number.isFinite(enters(0.01)) ? 'from n = ' + enters(0.01) : 'never')}
      ${kv('ε = 0.001', Number.isFinite(enters(0.001)) ? 'from n = ' + enters(0.001) : 'never')}
      <p class="help">These are found by searching for the first index past which the sequence stays inside
      the band. The definition demands such an N for <i>every</i> ε — and the fact that N grows without
      bound as ε shrinks is not a problem, it is the point.</p>
    </div>
    <div class="card tight"><div class="ttl">Monotone convergence</div>
      <p class="help">${S.bounded && S.mono !== 'neither'
        ? 'This sequence is monotone and bounded, so it must converge — and the theorem says so <i>without</i> computing the limit. That is exactly the situation for the partial sums of a positive series, which is why "bounded partial sums" is equivalent to convergence there.'
        : 'This one is not monotone, so the theorem does not apply. Bounded alone is never enough: (−1)ⁿ is as bounded as anything and converges to nothing.'}</p>
      <p class="help">${S.note}</p>
    </div>`;
  },
  chip(st){
    const S = srSeqCur(st);
    return `<div class="k">a₁₀₀₀₀</div><div style="color:var(--c-grad)">${fmtNum(S.f(10000), 7)}</div>
      <div style="color:${Number.isFinite(S.limit) ? 'var(--c-pos)' : 'var(--c-neg)'}">${Number.isFinite(S.limit) ? 'converges' : 'no limit'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the terms'], ['var(--c-warn)', 'the limit, and the ε bands']]; },
  dockLegend:true
};
