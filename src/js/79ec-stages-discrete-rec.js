/* ============================================================================
   7ec · INCLUSION–EXCLUSION AND RECURRENCES — the stages  (Programme C wing C5)

     dcIncl   the alternating sum, against a membership table that walks the
              universe once and never alternates anything
     dcRec    three routes to a linear recurrence — iterate it, raise the
              companion matrix, evaluate the closed form — and the one that
              fails, with the n at which it fails printed

   dcRec is where this wing meets the units wing. Binet's formula is EXACT as
   mathematics and wrong as arithmetic past n ≈ 70, and the picture separates
   the two errors the way that wing insists on: the relative error is flat at
   round-off while the absolute error grows like the answer itself.
   ============================================================================ */

const DC_INCL = {
  div:  { name:'divisible by 2, 3 or 5', U:1000,
          sets:[x => x % 2 === 0, x => x % 3 === 0, x => x % 5 === 0],
          labels:['÷2', '÷3', '÷5'],
          why:'The oldest use of the principle and still the clearest. Adding the three counts double-counts every multiple of 6, 10 and 15 and triple-counts every multiple of 30 — so two of the three copies have to come back off, and then the one that came off three times has to go back on. The alternation is bookkeeping, not magic.' },
  coprime:{ name:'coprime to 30', U:1000,
          sets:[x => x % 2 === 0, x => x % 3 === 0, x => x % 5 === 0],
          labels:['÷2', '÷3', '÷5'], complement:true,
          why:'The same three sets read the other way round, and it is Euler\'s totient function in disguise: the count of integers below N sharing no factor with 30 is N(1−½)(1−⅓)(1−⅕) = 4N/15. Inclusion–exclusion over the prime divisors IS that product, expanded.' },
  squares:{ name:'a perfect square, cube or fifth power', U:1000,
          sets:[x => x > 0 && Number.isInteger(Math.round(Math.sqrt(x))) && Math.round(Math.sqrt(x)) ** 2 === x,
                x => x > 0 && Math.round(Math.cbrt(x)) ** 3 === x,
                x => x > 0 && Math.round(Math.pow(x, 1 / 5)) ** 5 === x],
          labels:['n²', 'n³', 'n⁵'],
          why:'Overlapping sets whose intersections are sparse and irregular — sixth powers, tenth powers, fifteenth powers. There is no tidy product formula here, and the principle does not care: it only needs the sizes of the intersections, whatever they happen to be.' },
  three:{ name:'three overlapping intervals', U:600,
          sets:[x => x >= 0 && x < 300, x => x >= 200 && x < 450, x => x >= 400 && x < 600],
          labels:['A', 'B', 'C'],
          why:'The textbook Venn diagram, made of actual integers so that every region can be counted. A and C do not meet at all, so one of the seven terms is zero — and watching a term contribute nothing is worth more than being told the general formula has 2ⁿ−1 of them.' },
  disjoint:{ name:'three sets that do not overlap', U:600,
          sets:[x => x < 100, x => x >= 200 && x < 300, x => x >= 400 && x < 500],
          labels:['A', 'B', 'C'],
          why:'The control. With no overlaps every correction term is zero and the alternating sum collapses to plain addition — which is what makes the general principle a generalisation of "just add them" rather than a different rule. If the panel reported a correction here, something would be wrong.' }
};

STAGES.dcIncl = {
  title:'Inclusion and exclusion',
  enter(st, o){ st.ikey = o.ikey || 'div'; st.derange = o.derange || 0; },
  cur(st){
    const E = DC_INCL[st.ikey];
    const I = dcInclExcl(E.sets, E.U);
    const n = Math.max(1, Math.min(9, Math.round(st.derange) || 6));
    const D = dcDerange(n);
    const De = dcDerangeEnum(n, DC_MAX_ENUM);
    return { E, I, n, D, De, complement:!!E.complement,
             comp:E.U - I.direct,
             compFormula:E.U - I.formula };
  },
  controls(){
    const st = ST;
    return ctSeg('dcInK', st.ikey, Object.keys(DC_INCL).map(k => [k, DC_INCL[k].name])) +
      ctlRow('derangements of n things', ctlSlider('dcInD', 1, 9, 1, st.derange || 6)) +
      `<p class="help">Two routes, and only one of them alternates. The <b>formula</b> adds the sizes
      of every non-empty intersection with a sign given by how many sets it involves — 2ⁿ − 1 terms.
      The <b>direct count</b> walks the universe once, asks each element whether it is in at least one
      set, and never forms an intersection at all.</p>
      <p class="help">The bars below are the terms, drawn in the order they are applied, with the
      running total on top of them. Watch the total overshoot, come back, and overshoot less — the
      alternation is a correction converging on the answer from alternate sides, which is the same
      shape as an alternating series and is why the truncated version is a bound rather than an
      estimate.</p>`;
  },
  wire(){
    ctWireSeg('dcInK', v => { ST.ikey = v; });
    wireSlider('dcInD', () => ST.derange || 6, v => { ST.derange = Math.round(v); },
               v => 'n = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(40, z.h + 10);
    const B = ctFitBox(50, top, W - 96, H - top - 52);
    const stripH = Math.min(58, B.ph * 0.28);
    dcMemberStrip(ctx, N, B.px, B.py, B.pw, stripH);
    dcTermBars(ctx, N, B.px, B.py + stripH + 26, B.pw, B.ph - stripH - 26);
    stageNote(ctx, 'formula ' + fmtNum(N.I.formula, 9) + '   ·   counted directly ' +
              fmtNum(N.I.direct, 9) + '   ·   ' +
              (N.I.gap === 0 ? 'identical' : 'they differ by ' + fmtNum(N.I.gap, 6)), W, H);
  },
  derive(st){
    const N = this.cur(st);
    return {
      title:'Why the signs alternate',
      steps:[
        drvSay('the question is how many times each element gets counted',
          'Add the sizes of the sets and an element lying in exactly m of them has been counted m times, not once. Everything below is the arithmetic that turns m into 1, and it has to work for every m at once — which is what forces the alternation rather than some other pattern of corrections.'),
        drvStep('an element in m sets appears in C(m, j) of the j-fold intersections',
          `${dv('C')}(${dv('m')}, 1) ${dop('−')} ${dv('C')}(${dv('m')}, 2) ${dop('+')} ${dv('C')}(${dv('m')}, 3) ${dop('−')} …`,
          'and that alternating sum is 1 for every m ≥ 1'),
        drvSay('which is the identity the triangle stage measured',
          'The full alternating sum of a row is zero. Moving the j = 0 term to the other side leaves exactly the expression above, equal to C(m,0) = 1. So each element is counted once, whatever m it has — one identity from the previous stage doing all the work here.'),
        drvStep('so the union is the alternating sum over every non-empty subset',
          `|⋃${dv('A')}ᵢ| ${dop('=')} ∑ (${dop('−')}1)${uniSup('^|S|+1')} |⋂${dv('i')}∈${dv('S')} ${dv('A')}ᵢ|`,
          N.I.m + ' sets, so ' + (Math.pow(2, N.I.m) - 1) + ' terms, giving ' + fmtNum(N.I.formula, 9)),
        drvStep('and the second route never alternates anything',
          `walk the universe, ask "in at least one?"`,
          fmtNum(N.I.direct, 9) + ' of ' + fmtNum(N.E.U, 7) + ' — ' +
          (N.I.gap === 0 ? 'identical to the formula' : 'differing by ' + fmtNum(N.I.gap, 6))),
        drvSay('and the scale that difference is measured against is not the answer',
          'The terms sum to ' + fmtNum(N.I.gross, 9) + ' in magnitude before the signs cancel them down to ' + fmtNum(N.I.formula, 9) + '. A union can legitimately be empty, and then the answer is zero and cannot be its own scale — so the gross is what the cancellation came from, exactly as a vanishing flux is measured against ∮|F||dS| rather than against itself.'),
        drvStep('derangements: the same principle, applied to permutations',
          `!${dv('n')} ${dop('=')} ${dv('n')}! ∑ (${dop('−')}1)${uniSup('^k')}/${dv('k')}!`,
          '!' + N.n + ' = ' + fmtNum(N.D.rec, 9) + ' by the recurrence, ' + fmtNum(N.D.ie, 9) +
          ' by inclusion–exclusion' +
          (N.De === null ? '' : ', ' + fmtNum(N.De, 9) + ' by listing every permutation and checking')),
        drvSay('three routes and a fourth for small n, which is more than most results get',
          'Let A_i be the permutations fixing element i; a derangement is in none of them. Inclusion–exclusion over the n sets gives the alternating sum; the recurrence !n = (n−1)(!(n−1) + !(n−2)) comes from a different argument entirely; and below nine elements the stage simply lists all n! permutations and counts the ones with no fixed point. When three arguments with nothing in common agree to the digit, the result is not in doubt.'),
        drvStep('and the ratio goes to e, which is why the answer looks like a probability',
          `${dv('n')}!/!${dv('n')} ${dop('→')} ${dv('e')}`,
          fmtNum(N.D.ratio, 10) + ' against e = ' + fmtNum(Math.E, 10) + ' — ' +
          fmtGap(Math.abs(N.D.ratio - Math.E), Math.E)),
        drvSay('so the chance that a shuffle leaves nothing in place is 1/e, and it barely depends on n',
          'That is startling the first time: whether you shuffle five cards or five thousand, the probability that no card returns to its own position is about 0.3679. The alternating sum is the Taylor series of e⁻¹ truncated at n terms, and it converges so fast that n = 7 already gives every digit float64 carries.')
      ],
      note:'Nothing here is asserted. The alternating sum, the direct count, the recurrence and — ' +
           'where n is small enough — the brute-force list are all computed and printed together.'
    };
  },
  readout(st){
    const N = this.cur(st);
    const terms = N.I.terms.map(t =>
      kv((t.sign > 0 ? '+' : '−') + ' ' + t.bits + '-fold', fmtNum(t.inter, 7) +
         '  <span style="color:var(--c-dim)">' +
         N.E.labels.filter((_, i) => t.mask & (1 << i)).join(' ∩ ') + '</span>')).join('');
    return `<div class="card tight"><div class="ttl">${N.E.name} — a universe of ${fmtNum(N.E.U, 7)}</div>
      ${kv('by the alternating sum', fmtNum(N.I.formula, 9))}
      ${kv('by counting directly', fmtNum(N.I.direct, 9))}
      ${kv('the two, compared', fmtAgreeGross(N.I.formula, N.I.direct, N.I.gross))}
      ${kv('sum of the term sizes', fmtNum(N.I.gross, 9) +
           '  <span style="color:var(--c-dim)">— what the alternation cancelled</span>')}
      ${N.complement ? kv('the complement', fmtNum(N.comp, 9) +
          '   —  and 4·' + N.E.U + '/15 is ' + fmtNum(4 * N.E.U / 15, 9)) : ''}
      <p class="help">${N.E.why}</p>
    </div>
    <div class="card tight"><div class="ttl">The ${N.I.terms.length} terms, in order</div>
      ${terms}
      <p class="help">Every term is the size of one intersection, counted by walking the universe.
      The signs are the only thing the principle contributes, and they come from the alternating-sum
      identity the triangle stage measures — an element in m of the sets is counted
      C(m,1) − C(m,2) + … = 1 time, whatever m happens to be.</p>
    </div>
    <div class="card tight"><div class="ttl">Derangements of ${N.n} things — three routes, and a fourth</div>
      ${kv('by inclusion–exclusion', fmtNum(N.D.ie, 9))}
      ${kv('by the recurrence', fmtNum(N.D.rec, 9))}
      ${kv('by listing every permutation', N.De === null
          ? 'declined — ' + fmtNum(dcFact(N.n), 12) + ' permutations is past the cap'
          : fmtNum(N.De, 9))}
      ${kv('nearest integer to n!/e', fmtNum(N.D.round, 9))}
      ${kv('the routes, compared', N.D.gapIE === 0 && N.D.gapRound === 0
          ? '<span style="color:var(--c-pos)">all identical</span>'
          : 'inclusion–exclusion off by ' + fmtNum(N.D.gapIE, 6) + ', rounding off by ' + fmtNum(N.D.gapRound, 6))}
      ${kv('n!/!n against e', fmtNum(N.D.ratio, 10) + '   ' + fmtGap(Math.abs(N.D.ratio - Math.E), Math.E))}
      <p class="help">The chance that a shuffle leaves nothing in its own place is about 1/e = 0.3679,
      and it hardly moves with n: the alternating sum is e⁻¹'s own Taylor series cut off after n
      terms, and by n = 7 every digit float64 carries has settled. Five cards or five thousand, the
      answer is the same to four figures.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">union</div>
      <div style="color:var(--c-pos)">${fmtNum(N.I.formula, 9)}</div>
      <div style="color:var(--c-dim)">of ${fmtNum(N.E.U, 7)}</div>`;
  },
  legend(st){
    const N = this.cur(st);
    const cols = ['var(--c-pos)', 'var(--c-warn)', 'var(--c-curl)'];
    return N.E.labels.map((l, i) => [cols[i % 3], 'set ' + l])
      .concat([['var(--c-grad)', 'the running total as the terms are applied'],
               ['var(--c-neg)', 'a term that is subtracted']]);
  },
  dockLegend:true
};

/* ---- the universe as a strip, coloured by membership ---------------------- */
function dcMemberStrip(ctx, N, x, y, w, h){
  const U = N.E.U, m = N.E.sets.length;
  const cols = [TH.pos, TH.warn, TH.curl];
  const rowH = Math.max(6, Math.min(16, (h - 14) / m));
  ctText(ctx, x, y - 6, 'the universe, element by element — each row is one set',
         rgbCss(TH.dim), '10px ' + FONT_UI, 'left', 'bottom');
  /* one fillRect per element per set would be 3000 calls a frame at U = 1000;
     the strip is built as a bitmap and blitted once, which is the pattern
     MASTER-PLAN 3.5 converted five loops to */
  const cells = Math.min(512, U);
  const buf = ctHeatBuf(cells);
  const px = buf.img.data;
  for(let r = 0; r < cells; r++){
    for(let c = 0; c < cells; c++){
      const i = 4 * (r * cells + c);
      px[i + 3] = 0;
    }
  }
  for(let s = 0; s < m; s++){
    for(let c = 0; c < cells; c++){
      const e = Math.floor(c * U / cells);
      if(!N.E.sets[s](e)) continue;
      const col = cols[s % 3];
      for(let r = s * 3; r < s * 3 + 3 && r < cells; r++){
        const i = 4 * (r * cells + c);
        px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2]; px[i + 3] = 220;
      }
    }
  }
  buf.ctx.putImageData(buf.img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf.cv, 0, 0, cells, m * 3, x, y, w, rowH * m);
  ctx.restore();
  for(let s = 0; s < m; s++)
    ctText(ctx, x - 8, y + (s + 0.5) * rowH, N.E.labels[s], rgbCss(cols[s % 3]),
           '600 10px ' + FONT_UI, 'right', 'middle');
}

/* ---- the terms, and the running total ------------------------------------ */
function dcTermBars(ctx, N, x, y, w, h){
  const T = N.I.terms;
  let run = 0;
  const runs = T.map(t => (run += t.sign * t.inter));
  let hi = Math.max.apply(null, T.map(t => t.inter).concat(runs.map(Math.abs), [1]));
  hi *= 1.15;
  const P = mkPlot(x, y, w, h, -0.7, T.length - 0.3, -hi * 0.25, hi);
  plotFrame(ctx, P, 'the terms, in order', 'count', 'each intersection, signed — and the running total');
  const M = ctUnitMarks(-hi * 0.25, hi, 7);
  plotTicksY(ctx, P, M.vals, v => fmtTick(v, M.step));
  ctPath(ctx, P, [{ x:-0.7, y:0 }, { x:T.length - 0.3, y:0 }], rgbCss(TH.line2), 1.2);
  T.forEach((t, i) => {
    const v = t.sign * t.inter;
    const col = t.sign > 0 ? TH.pos : TH.neg;
    if(Math.abs(v) > 0){
      ctFill(ctx, P, [{ x:i - 0.3, y:0 }, { x:i + 0.3, y:0 }, { x:i + 0.3, y:v }, { x:i - 0.3, y:v }],
             rgbCss(col, 0.45));
      ctPath(ctx, P, [{ x:i - 0.3, y:0 }, { x:i + 0.3, y:0 }, { x:i + 0.3, y:v },
                      { x:i - 0.3, y:v }, { x:i - 0.3, y:0 }], rgbCss(col), 1.4);
    } else {
      ctText(ctx, P.X(i), P.Y(0) - 8, '0', rgbCss(TH.faint), '10px ' + FONT_UI, 'center', 'bottom');
    }
  });
  ctPath(ctx, P, runs.map((v, i) => ({ x:i, y:v })), rgbCss(TH.grad), 2.2);
  runs.forEach((v, i) => ctDot(ctx, P, i, v, 3.2, rgbCss(TH.grad), rgbCss(TH.bg)));
  ctPath(ctx, P, [{ x:-0.7, y:N.I.direct }, { x:T.length - 0.3, y:N.I.direct }],
         rgbCss(TH.warn), 1.6, [6, 4]);
  ctText(ctx, P.X(T.length - 0.35), P.Y(N.I.direct) - 5,
         'counted directly: ' + fmtNum(N.I.direct, 8), rgbCss(TH.warn),
         '10px ' + FONT_UI, 'right', 'bottom');
}

/* ============================================================================
   2 · linear recurrences — three routes, and the one that fails
   ============================================================================ */
const DC_RECS = {
  fib:   { name:'Fibonacci', c:[1, 1], init:[0, 1], nmax:78,
           ex:'F(n) = F(n−1) + F(n−2)',
           combi:'binary strings of length n with no two adjacent 1s',
           count:n => dcNoTwoOnes(n, 40000),
           shift:2,
           why:'The recurrence everybody meets, and the one where the closed form is most often taught as though it were the practical route. It is not. Binet\'s formula is exact mathematics and its arithmetic fails at n ≈ 71, which the picture shows happening.' },
  lucas: { name:'Lucas', c:[1, 1], init:[2, 1], nmax:76,
           ex:'L(n) = L(n−1) + L(n−2), starting 2, 1',
           combi:null, count:null, shift:0,
           why:'The same recurrence with different starting values, and the same golden ratio in its closed form — which is the point: the roots belong to the RECURRENCE, and the initial conditions only decide the two coefficients in front of them. Every solution of a linear recurrence is a combination of the same powers.' },
  pell:  { name:'Pell', c:[2, 1], init:[0, 1], nmax:62,
           ex:'P(n) = 2P(n−1) + P(n−2)',
           combi:null, count:null, shift:0,
           why:'Different coefficients, so different roots: 1 ± √2 instead of the golden ratio. The ratio of consecutive terms goes to 2.4142, and the panel measures it converging. Pell\'s numbers are the denominators of the best rational approximations to √2, which is why they turn up in continued fractions.' },
  trib:  { name:'Tribonacci — three terms', c:[1, 1, 1], init:[0, 1, 1], nmax:60,
           ex:'T(n) = T(n−1) + T(n−2) + T(n−3)',
           combi:null, count:null, shift:0,
           why:'A third-order recurrence, and the stage declines to give a closed form for it. That refusal is the honest answer: the characteristic cubic has one real root and two complex ones, so the closed form exists but is not the two-term expression this panel builds. The matrix route needs no such special case and returns the exact integer.' },
  tile:  { name:'tilings of a 2 × n strip', c:[1, 1], init:[1, 1], nmax:76,
           ex:'the dominoes fit vertically, or two lie flat',
           combi:'tilings of a 2 × n strip by dominoes',
           count:n => ({ count:dcTilings(n), overflow:false }),
           shift:0,
           why:'A counting problem that turns out to BE Fibonacci, and the argument is one line: the last column is covered by one vertical domino — leaving a 2 × (n−1) strip — or by two horizontal ones, leaving 2 × (n−2). Recognising a recurrence you already know is most of what combinatorics is for.' }
};

STAGES.dcRec = {
  title:'A recurrence, three ways',
  enter(st, o){
    st.rkey = o.rkey || 'fib';
    st.n = o.n === undefined ? 30 : o.n;
    st.view = o.view || 'terms';
  },
  cur(st){
    const E = DC_RECS[st.rkey];
    const n = Math.max(E.c.length, Math.min(E.nmax, Math.round(st.n)));
    const seq = dcRecur(E.c, E.init, n);
    const mat = dcByMatrix(E.c, E.init, n);
    const cf = dcClosedForm(E.c, E.init, n);
    const R = dcCharRoots(E.c);
    const it = seq[n];
    /* The combinatorial route, where one exists and the enumeration is
       affordable — and it is compared against the term at n + SHIFT, not at n.
       Strings of length n with no two adjacent 1s number F(n+2) on the 0,1
       convention, so comparing against F(n) reported 144 against 55 and the
       panel said the recurrence did not describe the count. The offset belongs
       to the counting problem, not to the recurrence, so it lives on the
       preset beside the enumerator that needs it. */
    let cnt = null, cntAgainst = null;
    if(E.count && n <= 16){
      const C = E.count(n);
      cnt = C.overflow ? null : C.count;
      const m = n + (E.shift || 0);
      cntAgainst = dcRecur(E.c, E.init, m)[m];
    }
    return { E, n, seq, mat, cf, R, it, cnt, cntAgainst,
             matGap:Math.abs(mat - it),
             cfGap:cf ? Math.abs(cf.v - it) : null,
             cfRel:cf && it !== 0 ? Math.abs(cf.v - it) / Math.abs(it) : null,
             exact:dcExact(it),
             ratio:seq[n - 1] !== 0 ? seq[n] / seq[n - 1] : NaN };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('dcReK', st.rkey, Object.keys(DC_RECS).map(k => [k, DC_RECS[k].name])) +
      ctSeg('dcReV', st.view, [['terms', 'the sequence'], ['err', 'where the closed form fails']]) +
      ctlRow('n', ctlSlider('dcReN', N.E.c.length, N.E.nmax, 1, st.n)) +
      `<p class="help"><b>${N.E.ex}</b></p>
      <p class="help">Three routes to the same integer. <b>Iterating</b> the recurrence adds integers
      and is exact wherever the answer fits. <b>Raising the companion matrix</b> to a power by
      repeated squaring reaches n in about log₂n multiplications instead of n additions, and is still
      exact because every entry stays an integer. <b>The closed form</b> evaluates powers of
      irrational roots in floating point, and that is where it comes apart.</p>
      <p class="help">Switch to the second view and watch which error grows. This is the units wing's
      test applied to a discrete problem: the <i>relative</i> error sits flat at 10⁻¹⁶ — the closed
      form is losing no significant figures at all — while the <i>absolute</i> error grows in step
      with the answer, and passes 1 at the point where the formula stops returning the right
      integer.</p>`;
  },
  wire(){
    ctWireSeg('dcReK', v => { ST.rkey = v; ST.n = Math.min(ST.n, DC_RECS[v].nmax); });
    ctWireSeg('dcReV', v => { ST.view = v; });
    wireSlider('dcReN', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(42, z.h + 10);
    const B = ctFitBox(56, top, W - 100, H - top - 54);
    if(st.view === 'err') dcRecErrPane(ctx, N, B);
    else dcRecTermPane(ctx, N, B);
    stageNote(ctx, N.E.name + '(' + N.n + ') = ' + fmtNum(N.it, 18) +
              (N.cf ? '   ·   closed form gives ' + fmtNum(N.cf.v, 18) : '   ·   no two-term closed form'),
              W, H);
  },
  derive(st){
    const N = this.cur(st);
    return {
      title:'Three routes, and why one of them stops working',
      steps:[
        drvStep('route 1 — iterate, adding integers',
          `${dv('a')}(${dv('m')}) ${dop('=')} ∑ ${dv('c')}ᵢ ${dv('a')}(${dv('m')}${dop('−')}${dv('i')}${dop('−')}1)`,
          fmtNum(N.it, 18) + ' after ' + N.n + ' additions' +
          (N.exact ? ' — every one exact' : ' — but the answer has passed 2⁵³')),
        drvStep('route 2 — the companion matrix, raised by squaring',
          `${dv('M')}${uniSup('^n')} applied to the initial state`,
          fmtNum(N.mat, 18) + ' in about ' + Math.ceil(Math.log2(Math.max(2, N.n))) +
          ' matrix multiplications — ' +
          (N.matGap === 0 ? 'identical to route 1' : 'differing by ' + fmtNum(N.matGap, 6))),
        drvSay('and that is a genuinely different computation, not a rearrangement',
          'Repeated squaring visits n through its binary expansion, so the intermediate numbers are entirely different from the ones iteration produces and the operation count is logarithmic rather than linear. That the two agree to the digit is a real check; that the matrix route is faster is why every library computes large Fibonacci numbers this way.'),
        N.cf ? drvStep('route 3 — the closed form built from the characteristic roots',
          `${dv('a')}(${dv('n')}) ${dop('=')} ${dv('A')}${dv('r')}₁${uniSup('^n')} ${dop('+')} ${dv('B')}${dv('r')}₂${uniSup('^n')}`,
          'roots ' + fmtNum(N.cf.r1, 10) + ' and ' + fmtNum(N.cf.r2, 10) + ', giving ' +
          fmtNum(N.cf.v, 18))
             : drvSay('route 3 is declined here, and declining is the honest answer',
          'The characteristic polynomial of a third-order recurrence is a cubic, and this one has a single real root with a complex conjugate pair. A closed form exists — it is a real combination of complex powers — but it is not the two-term expression this panel builds, and returning that expression anyway would be returning the answer to a different problem. The matrix route needs no special case at all.'),
        N.cf ? drvSay('the roots belong to the recurrence; the initial values only set A and B',
          'Substituting a(n) = rⁿ turns the recurrence into a polynomial in r, and every solution is a combination of the powers of its roots. Fibonacci and Lucas have the same two roots and differ only in the coefficients in front of them — which is why the golden ratio appears in both and why the ratio of consecutive terms tends to the larger root whatever you start from.') : null,
        drvStep('the ratio of consecutive terms goes to the larger root',
          `${dv('a')}(${dv('n')})/${dv('a')}(${dv('n')}${dop('−')}1) ${dop('→')} ${dv('r')}₁`,
          N.R && N.R.real
            ? fmtNum(N.ratio, 12) + ' against ' + fmtNum(N.R.r1, 12) + ' — ' +
              fmtGap(Math.abs(N.ratio - N.R.r1), Math.abs(N.R.r1))
            : 'measured ' + fmtNum(N.ratio, 12) + ' — the roots are not both real here'),
        N.cfRel !== null ? drvStep('and the closed form is losing NO significant figures',
          `|closed ${dop('−')} exact| / |exact|`,
          fmtSig(N.cfRel, 3) + ' — flat at float64 round-off however large n gets') : null,
        N.cfGap !== null ? drvStep('while its ABSOLUTE error grows with the answer itself',
          `|closed ${dop('−')} exact|`,
          fmtSig(N.cfGap, 6) + (N.cfGap >= 0.5
            ? ' — past a half, so rounding it no longer returns the right integer'
            : ' — still under a half, so rounding still recovers the integer')) : null,
        drvSay('two errors, one number, and only one of them matters here',
          'The units wing insists that a difference means nothing without its scale, and this is the case where the scale changes the verdict completely. Relatively, the closed form is perfect: sixteen good figures at every n. Absolutely, it is useless past n ≈ 71, because the answer by then has more than sixteen digits and the missing ones are the units. Which error you care about is decided by what you want — an approximation, or an integer.'),
        N.cnt !== null ? drvStep('and the sequence is what it counts',
          `${N.E.combi}`,
          fmtNum(N.cnt, 9) + ' of them, built and counted one at a time, against ' +
          fmtNum(N.cntAgainst, 9) + ' from the recurrence at n + ' + (N.E.shift || 0)) : null
      ].filter(Boolean),
      note:'Iteration and the matrix are exact integer arithmetic below 2⁵³. The closed form is ' +
           'exact mathematics and approximate arithmetic, and the picture separates the two.'
    };
  },
  readout(st){
    const N = this.cur(st);
    return `<div class="card tight"><div class="ttl">${N.E.name} — ${N.E.ex}</div>
      ${kv('by iterating', fmtNum(N.it, 18))}
      ${kv('by the companion matrix', fmtNum(N.mat, 18) + '   ' +
           (N.matGap === 0 ? '<span style="color:var(--c-pos)">identical</span>'
                           : fmtGap(N.matGap, Math.max(1, Math.abs(N.it)))))}
      ${kv('by the closed form', N.cf ? fmtNum(N.cf.v, 18) : 'declined — the characteristic polynomial is a cubic')}
      ${N.cf ? kv('closed form, absolute error', fmtSig(N.cfGap, 6) +
          (N.cfGap >= 0.5 ? '  <span style="color:var(--c-neg)">— past a half, so the rounded value is the wrong integer</span>'
                          : '  <span style="color:var(--c-pos)">— under a half, so rounding still recovers it</span>')) : ''}
      ${N.cf ? kv('closed form, relative error', fmtSig(N.cfRel, 3) +
          '  <span style="color:var(--c-dim)">— flat at round-off, whatever n is</span>') : ''}
      ${kv('still an exact integer?', N.exact ? 'yes' : 'no — the answer has passed 2⁵³')}
    </div>
    <div class="card tight"><div class="ttl">The roots, and what they decide</div>
      ${N.R && N.R.real
        ? kv('characteristic roots', fmtNum(N.R.r1, 12) + '  and  ' + fmtNum(N.R.r2, 12))
        : kv('characteristic roots', N.E.c.length > 2
            ? 'a cubic — one real root and a complex pair'
            : 'complex, so the sequence oscillates')}
      ${kv('ratio of the last two terms', fmtNum(N.ratio, 12))}
      ${N.R && N.R.real ? kv('against the larger root',
          fmtGap(Math.abs(N.ratio - N.R.r1), Math.abs(N.R.r1))) : ''}
      <p class="help">${N.E.why}</p>
    </div>
    ${N.cnt !== null ? `<div class="card tight"><div class="ttl">And it counts something</div>
      ${kv('what', N.E.combi)}
      ${kv('built and counted', fmtNum(N.cnt, 9))}
      ${kv('from the recurrence', fmtNum(N.cntAgainst, 9) + (N.E.shift ? '   <span style="color:var(--c-dim)">— the term at n + ' + N.E.shift + ', because the count is offset from the sequence</span>' : ''))}
      ${kv('the two, compared', N.cnt === N.cntAgainst
          ? '<span style="color:var(--c-pos)">identical — the recurrence is the right one</span>'
          : '<span style="color:var(--c-neg)">they differ, so the recurrence does not describe this count</span>')}
      <p class="help">The enumerator does not know a recurrence exists. It builds every object of
      size n and counts them, so an agreement here is evidence that the recurrence describes the
      problem — which is a different question from whether the arithmetic is right, and the one that
      is usually harder to get wrong quietly.</p>
    </div>` : ''}`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">${N.E.name}(${N.n})</div>
      <div style="color:var(--c-pos)">${fmtNum(N.it, 12)}</div>
      <div style="color:var(--c-dim)">${N.cf ? 'closed form off by ' + fmtSig(N.cfGap, 3) : 'no closed form'}</div>`;
  },
  legend(st){
    if(st.view === 'err')
      return [['var(--c-neg)', 'absolute error of the closed form — it grows'],
              ['var(--c-pos)', 'relative error — it does not'],
              ['var(--c-warn)', 'a half, above which the rounded value is the wrong integer']];
    return [['var(--c-pos)', 'the sequence, iterated'],
            ['var(--c-warn)', 'the companion matrix at the current n'],
            ['var(--c-grad)', 'the closed form']];
  },
  dockLegend:true
};

/* ---- the sequence itself, on a log axis ---------------------------------- */
function dcRecTermPane(ctx, N, B){
  const n = N.n;
  const ys = [];
  for(let i = 0; i <= n; i++) ys.push(Math.log10(Math.max(1e-3, Math.abs(N.seq[i]))));
  const hi = Math.max.apply(null, ys) + 0.4, lo = Math.min(0, Math.min.apply(null, ys)) - 0.2;
  const P = mkPlot(B.px, B.py, B.pw, B.ph, 0, Math.max(1, n), lo, hi);
  plotFrame(ctx, P, 'n', 'log₁₀ of the term', 'the sequence — a straight line, because it is a power');
  ctGrid(ctx, P);
  const M = ctUnitMarks(lo, hi, 8);
  plotTicksY(ctx, P, M.vals, v => fmtTick(v, M.step));
  ctPath(ctx, P, ys.map((v, i) => ({ x:i, y:v })), rgbCss(TH.pos), 2.2);
  const step = Math.max(1, Math.round(n / 40));
  for(let i = 0; i <= n; i += step) ctDot(ctx, P, i, ys[i], 2.6, rgbCss(TH.pos), rgbCss(TH.bg));
  ctDot(ctx, P, n, Math.log10(Math.max(1e-3, Math.abs(N.mat))), 5, rgbCss(TH.warn), rgbCss(TH.bg));
  if(N.cf) ctDot(ctx, P, n, Math.log10(Math.max(1e-3, Math.abs(N.cf.v))), 3.4, rgbCss(TH.grad), rgbCss(TH.bg));
  if(N.R && N.R.real && N.R.r1 > 1)
    ctText(ctx, P.px + 10, P.py + 12,
           'the slope is log₁₀ r₁ = ' + fmtNum(Math.log10(N.R.r1), 8) +
           ', which is why the line is straight',
           rgbCss(TH.dim), '10px ' + FONT_UI, 'left', 'top');
}

/* ---- where the closed form comes apart ----------------------------------- */
function dcRecErrPane(ctx, N, B){
  const E = N.E;
  if(!dcClosedForm(E.c, E.init, 2)){
    ctText(ctx, B.px + B.pw / 2, B.py + B.ph / 2,
           'this recurrence has no two-term closed form — there is nothing to compare',
           rgbCss(TH.dim), '13px ' + FONT_UI, 'center', 'middle');
    return;
  }
  const abs = [], rel = [];
  for(let i = 2; i <= E.nmax; i++){
    const ex = dcRecur(E.c, E.init, i)[i];
    const cf = dcClosedForm(E.c, E.init, i);
    const a = Math.abs(cf.v - ex);
    abs.push({ x:i, y:Math.log10(Math.max(1e-20, a)) });
    rel.push({ x:i, y:Math.log10(Math.max(1e-20, ex !== 0 ? a / Math.abs(ex) : 1e-20)) });
  }
  const P = mkPlot(B.px, B.py, B.pw, B.ph, 2, E.nmax, -20, 6);
  plotFrame(ctx, P, 'n', 'log₁₀ of the error',
            'two errors in one number — only one of them grows');
  ctGrid(ctx, P);
  const M = ctUnitMarks(-20, 6, 8);
  plotTicksY(ctx, P, M.vals, v => fmtTick(v, M.step));
  ctPath(ctx, P, [{ x:2, y:Math.log10(0.5) }, { x:E.nmax, y:Math.log10(0.5) }],
         rgbCss(TH.warn), 1.8, [6, 4]);
  ctText(ctx, P.X(E.nmax) - 6, P.Y(Math.log10(0.5)) - 5,
         'a half — above this the rounded value is the wrong integer',
         rgbCss(TH.warn), '10px ' + FONT_UI, 'right', 'bottom');
  ctPath(ctx, P, abs, rgbCss(TH.neg), 2.2);
  ctPath(ctx, P, rel, rgbCss(TH.pos), 2.2);
  ctPath(ctx, P, [{ x:N.n, y:-20 }, { x:N.n, y:6 }], rgbCss(TH.faint), 1.2, [4, 4]);
  ctText(ctx, P.px + 10, P.py + 12,
         'relative flat at 10⁻¹⁶ · absolute grows like the answer',
         rgbCss(TH.dim), '10px ' + FONT_UI, 'left', 'top');
}
