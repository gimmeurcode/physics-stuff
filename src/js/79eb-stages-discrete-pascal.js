/* ============================================================================
   7eb · PASCAL'S TRIANGLE — the stage  (Programme C wing C5)

   The triangle is built by the RECURRENCE and nothing else, which is what makes
   comparing it with the factorial formula a test rather than a restatement.
   Four views: the triangle itself with its row identities measured, the
   hockey-stick diagonal, the parity colouring that is Sierpinski's gasket, and
   the binomial theorem evaluated at a point by both routes.
   ============================================================================ */

const DC_PASCAL_VIEWS = {
  rows:   'the triangle, and what each row sums to',
  hockey: 'the hockey stick',
  parity: 'odd entries only — and a fractal appears',
  binom:  'the binomial theorem, both routes'
};

STAGES.dcPascal = {
  title:'Pascal\'s triangle',
  enter(st, o){
    st.view = o.view || 'rows';
    st.rows = o.rows === undefined ? 10 : o.rows;
    st.r = o.r === undefined ? 2 : o.r;
    st.a = o.a === undefined ? 1 : o.a;
    st.b = o.b === undefined ? 1 : o.b;
  },
  cur(st){
    const rows = Math.max(1, Math.min(st.view === 'parity' ? 63 : 16, Math.round(st.rows)));
    const T = dcPascal(rows);
    /* the two routes: the triangle came from the recurrence, dcChoose from the
       multiplicative formula. Nothing in either consults the other. */
    let worst = 0, worstAt = '';
    T.forEach((row, n) => row.forEach((v, k) => {
      const g = Math.abs(v - dcChoose(n, k));
      if(g > worst){ worst = g; worstAt = 'C(' + n + ', ' + k + ')'; }
    }));
    const n = rows;
    const F = dcRowFacts(T[n], n);
    const r = Math.max(0, Math.min(n, Math.round(st.r)));
    const H = dcHockey(r, n);
    const B = dcBinomAt(st.a, st.b, Math.min(n, 20));
    return { rows, T, worst, worstAt, n, F, r, H, B, exact:dcExact(T[n][Math.floor(n / 2)]) };
  },
  controls(){
    const st = ST;
    return ctSeg('dcPaV', st.view, Object.keys(DC_PASCAL_VIEWS).map(k => [k, DC_PASCAL_VIEWS[k]])) +
      ctlRow('rows', ctlSlider('dcPaR', 1, st.view === 'parity' ? 63 : 16, 1, st.rows)) +
      (st.view === 'hockey' ? ctlRow('the diagonal r', ctlSlider('dcPaD', 0, 16, 1, st.r)) : '') +
      (st.view === 'binom'
        ? ctlRow('a', ctlSlider('dcPaA', -3, 3, 0.25, st.a)) + ctlRow('b', ctlSlider('dcPaB', -3, 3, 0.25, st.b))
        : '') +
      `<p class="help">Every entry here came from <b>adding the two above it</b> and from nothing
      else. The panel then compares the whole triangle against C(n, k) computed from the
      multiplicative formula — two routes that share no arithmetic, so an off-by-one in either could
      not survive.</p>
      ${st.view === 'parity' ? `<p class="help">Colour a cell when its entry is <b>odd</b>. What
      appears is Sierpinski's gasket, exactly, and it is not a coincidence or an approximation:
      Kummer's theorem says C(n, k) is odd precisely when the binary digits of k are a subset of
      those of n, and that condition is the gasket's own recursive definition written in base two.</p>`
      : st.view === 'hockey' ? `<p class="help">Sum a diagonal from its start and the total is the
      entry one step down and one step in — the shape the sum traces is why it is called a hockey
      stick. Drag the diagonal and watch both numbers move together.</p>`
      : st.view === 'binom' ? `<p class="help">Two routes to (a + b)ⁿ: raise the sum to the power
      directly, and sum the n + 1 binomial terms. With <b>b</b> negative the terms alternate and can
      cancel to exactly zero, so the difference is printed against the sum of the term
      <i>magnitudes</i> — the quantity the cancellation came from — rather than against a scale that
      has itself vanished.</p>`
      : `<p class="help">Three identities are measured on the bottom row rather than asserted: it
      sums to 2ⁿ, its alternating sum is 0, and its <i>weighted</i> sum is n2ⁿ⁻¹. Each is a
      combinatorial statement — count all subsets; pair each even subset with an odd one; count
      (subset, chosen element) pairs two ways — and each is a line of arithmetic in the panel.</p>`}`;
  },
  wire(){
    ctWireSeg('dcPaV', v => {
      ST.view = v;
      if(v === 'parity' && ST.rows < 16) ST.rows = 31;
      if(v !== 'parity' && ST.rows > 16) ST.rows = 10;
    });
    wireSlider('dcPaR', () => ST.rows, v => { ST.rows = Math.round(v); }, v => Math.round(v) + ' rows');
    wireSlider('dcPaD', () => ST.r, v => { ST.r = Math.round(v); }, v => 'r = ' + Math.round(v));
    wireSlider('dcPaA', () => ST.a, v => { ST.a = v; }, v => 'a = ' + fmtNum(v, 4));
    wireSlider('dcPaB', () => ST.b, v => { ST.b = v; }, v => 'b = ' + fmtNum(v, 4));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(38, z.h + 10);
    const B = ctFitBox(30, top, W - 60, H - top - 46);
    if(st.view === 'binom'){ dcBinomPane(ctx, N, B); return; }
    if(st.view === 'parity'){ dcParityPane(ctx, N, B); return; }
    dcTrianglePane(ctx, N, B, st.view === 'hockey');
    stageNote(ctx, st.view === 'hockey'
      ? 'the diagonal sums to ' + fmtNum(N.H.sum, 9) + ', and C(' + (N.n + 1) + ', ' + (N.r + 1) +
        ') is ' + fmtNum(N.H.exact, 9)
      : 'row ' + N.n + ' sums to ' + fmtNum(N.F.sum, 9) + ' = 2' + uniSup('^' + N.n), W, H);
  },
  derive(st){
    const N = this.cur(st);
    return {
      title:'The recurrence, and the identities it forces',
      steps:[
        drvStep('the rule that builds the triangle',
          `${dv('C')}(${dv('n')}, ${dv('k')}) ${dop('=')} ${dv('C')}(${dv('n')}${dop('−')}1, ${dv('k')}${dop('−')}1) ${dop('+')} ${dv('C')}(${dv('n')}${dop('−')}1, ${dv('k')})`,
          'built ' + N.rows + ' rows this way, and nothing else'),
        drvSay('and its proof is a sentence, not an algebraic manipulation',
          'Fix one element of the n. A k-subset either contains it — leaving k−1 to choose from the other n−1 — or it does not, leaving k to choose from n−1. Those two cases are disjoint and exhaust every subset, so the counts add. Almost every identity below is that same move: count one set two ways.'),
        drvStep('against the multiplicative formula, over the whole triangle',
          `${dfn('max')} |${dv('T')}[${dv('n')}][${dv('k')}] ${dop('−')} ${dv('C')}(${dv('n')}, ${dv('k')})|`,
          N.worst === 0 ? 'zero over every entry — the two routes are identical integers'
                        : fmtNum(N.worst, 6) + ' at ' + N.worstAt),
        drvStep('a row sums to 2ⁿ — count all subsets two ways',
          `∑${dv('k')} ${dv('C')}(${dv('n')}, ${dv('k')}) ${dop('=')} 2${uniSup('^n')}`,
          fmtNum(N.F.sum, 9) + ' against ' + fmtNum(N.F.sumExact, 9) + ' — ' +
          fmtGap(N.F.sumGap, Math.max(1, N.F.sumExact))),
        drvSay('grouping by size, or deciding element by element',
          'The left side sorts the subsets by how big they are; the right side builds each subset by making n independent in-or-out decisions. Same set, two orders of counting. That is the whole proof and it needs no algebra at all.'),
        drvStep('the alternating sum vanishes — a bijection between the even and odd subsets',
          `∑${dv('k')} (${dop('−')}1)${uniSup('^k')} ${dv('C')}(${dv('n')}, ${dv('k')}) ${dop('=')} 0`,
          fmtNum(N.F.alt, 6) + ' — ' + fmtGap(N.F.altGap, Math.max(1, N.F.sumExact))),
        drvSay('and the bijection is: toggle the first element',
          'That single move turns every even subset into an odd one and back again, so the two families are the same size and the alternating sum is zero. It fails for n = 0, where there is no first element to toggle — and the identity fails there too, which is the check that the proof is doing real work rather than decorating an algebraic accident.'),
        drvStep('the weighted sum counts (subset, chosen element) pairs',
          `∑${dv('k')} ${dv('k')} ${dv('C')}(${dv('n')}, ${dv('k')}) ${dop('=')} ${dv('n')}2${uniSup('^n−1')}`,
          fmtNum(N.F.weighted, 9) + ' against ' + fmtNum(N.F.weightedExact, 9) + ' — ' +
          fmtGap(N.F.weightedGap, Math.max(1, N.F.weightedExact))),
        drvStep('and the sum of squares is a single entry two rows down',
          `∑${dv('k')} ${dv('C')}(${dv('n')}, ${dv('k')})² ${dop('=')} ${dv('C')}(2${dv('n')}, ${dv('n')})`,
          fmtNum(N.F.squares, 12) + ' against ' + fmtNum(N.F.squaresExact, 12) + ' — ' +
          fmtGap(N.F.squaresGap, Math.max(1, N.F.squaresExact))),
        drvSay('choose n from two groups of n, and split by how many came from the first',
          'Vandermonde\'s identity in its smallest case, and the reason C(n,k)² appears at all is the symmetry C(n, k) = C(n, n−k): taking k from the first group and n−k from the second is C(n,k)·C(n,n−k), which is the square.'),
        drvSay(N.exact ? 'and every number above is still an exact integer'
                       : 'and the middle entry has passed 2⁵³, so float64 no longer holds it exactly',
          N.exact ? 'The recurrence only ever adds integers, so as long as the result fits below 2⁵³ every entry is exact and the comparison above is between two exact integers rather than between two approximations.'
                  : 'The recurrence is still adding integers, but the sum no longer fits: above 9.007×10¹⁵ the nearest float64 is not the answer. The count is still perfectly well defined — it is the arithmetic that ran out, not the mathematics, and the readout says which.')
      ],
      note:'The triangle is built by the recurrence alone. Every comparison above is against a ' +
           'formula that never consults it.'
    };
  },
  readout(st){
    const N = this.cur(st);
    const common = `<div class="card tight"><div class="ttl">The two routes over the whole triangle</div>
      ${kv('entries compared', fmtNum((N.rows + 1) * (N.rows + 2) / 2, 7))}
      ${kv('recurrence against C(n, k)', N.worst === 0
          ? '<span style="color:var(--c-pos)">identical at every entry</span>'
          : fmtGap(N.worst, Math.max(1, N.T[N.n][Math.floor(N.n / 2)])) + ' at ' + N.worstAt)}
      ${kv('still exact integers?', N.exact ? 'yes — every entry is below 2⁵³'
                                            : 'no — the middle entry has passed 2⁵³')}
    </div>`;
    if(st.view === 'hockey')
      return `<div class="card tight"><div class="ttl">The hockey stick</div>
        ${kv('diagonal', 'C(' + N.r + ', ' + N.r + ') + C(' + (N.r + 1) + ', ' + N.r + ') + … + C(' + N.n + ', ' + N.r + ')')}
        ${kv('the sum', fmtNum(N.H.sum, 12))}
        ${kv('C(' + (N.n + 1) + ', ' + (N.r + 1) + ')', fmtNum(N.H.exact, 12))}
        ${kv('the two, compared', fmtGap(N.H.gap, Math.max(1, N.H.exact)))}
        <p class="help">Count the (r+1)-subsets of {0 … n} by their <b>largest</b> element. If the
        largest is i, the other r come from the i elements below it — C(i, r) ways. Summing over i is
        the left side; counting them all at once is the right. One set, two orders of counting, and
        that is the entire proof.</p>
      </div>${common}`;
    if(st.view === 'binom')
      return `<div class="card tight"><div class="ttl">The binomial theorem at a point</div>
        ${kv('(a + b)ⁿ, directly', fmtSig(N.B.direct, 10))}
        ${kv('∑ C(n, k) aⁿ⁻ᵏ bᵏ', fmtSig(N.B.sum, 10))}
        ${kv('the two, compared', fmtAgreeGross(N.B.sum, N.B.direct, N.B.gross))}
        ${kv('sum of the term magnitudes', fmtSig(N.B.gross, 8) +
             '  <span style="color:var(--c-dim)">— what the cancellation came from</span>')}
        <p class="help">With b negative the terms alternate, and at a = −b they cancel to exactly
        zero. A residual quoted against the answer would then be dividing by the round-off and would
        print a perfect result as a total disagreement — so the scale here is the sum of the
        magnitudes, which is the quantity that actually cancelled.</p>
        <p class="help">Set <b>a = 1</b>, <b>b = −1</b> and read the two rows: both sides are zero,
        the magnitudes sum to 2ⁿ, and the panel says they agree to every digit rather than claiming a
        hundred percent error. That is the same fix the vector-calculus wing needed when a flux
        vanished by symmetry.</p>
      </div>${common}`;
    if(st.view === 'parity')
      return `<div class="card tight"><div class="ttl">Odd entries, and Kummer's theorem</div>
        ${kv('rows drawn', String(N.rows + 1))}
        ${kv('odd entries', fmtNum(dcOddCount(N.rows), 9) + ' of ' +
             fmtNum((N.rows + 1) * (N.rows + 2) / 2, 9) + '  —  ' +
             fmtNum(100 * dcOddCount(N.rows) / ((N.rows + 1) * (N.rows + 2) / 2), 4) + '%')}
        ${kv('the rule', 'C(n, k) is odd exactly when k AND n = k in binary')}
        ${(function(){
          /* over the first 2^m rows the count is exactly 3^m, which is a closed
             form the bitwise route can be checked against — on a range where
             the naive test cannot even be run */
          const m = Math.round(Math.log2(N.rows + 1));
          if(Math.abs(Math.pow(2, m) - (N.rows + 1)) > 1e-9) return '';
          return kv('against 3' + uniSup('^' + m), fmtNum(Math.pow(3, m), 9) + '   ' +
                 fmtGap(Math.abs(dcOddCount(N.rows) - Math.pow(3, m)), Math.pow(3, m)));
        })()}
        ${kv('the naive test, for comparison', fmtNum(
             N.T.reduce((s, r) => s + r.filter(v => Math.abs(v % 2) === 1).length, 0), 9) +
             '  <span style="color:var(--c-dim)">— reading the stored entry mod 2</span>')}
        <p class="help">Kummer's theorem gives the power of a prime p dividing C(n, k) as the number
        of carries when k and n−k are added in base p. For p = 2 that count is zero — so the entry is
        odd — precisely when adding k to n−k in binary carries nowhere, which is to say when every
        one-bit of k is also a one-bit of n.</p>
        <p class="help">That condition is self-similar under doubling n, which is the recursive
        definition of Sierpinski's gasket. So the picture is not an approximation to a fractal and
        not a resemblance: at every row it is exactly the set of k with k AND n = k, and the gasket
        is the limit of exactly that set.</p>
        <p class="help">The last row above is worth reading, because it is the picture drawn the
        obvious way. Testing the <i>stored entry</i> mod 2 works up to row 53 and then quietly
        stops: C(63, 31) is 9.2×10¹⁷, past 2⁵³, so the float has no low-order bits left and its
        remainder mod 2 means nothing. That test finds 665 odd cells in the first sixty-four rows
        where the answer is 3⁶ = 729, and the gasket comes out with holes in it — nothing raised,
        nothing was flagged, just a slightly wrong fractal. The bitwise rule never looks at the entry
        at all, which is why it is exact wherever a canvas can draw.</p>
      </div>${common}`;
    return `<div class="card tight"><div class="ttl">Row ${N.n}, and four identities measured</div>
      ${kv('the row', N.T[N.n].slice(0, 12).map(v => fmtNum(v, 9)).join(', ') +
           (N.T[N.n].length > 12 ? ' …' : ''))}
      ${kv('∑ C(n, k) against 2ⁿ', fmtNum(N.F.sum, 12) + '  vs  ' + fmtNum(N.F.sumExact, 12) +
           '   ' + fmtGap(N.F.sumGap, Math.max(1, N.F.sumExact)))}
      ${kv('alternating sum against 0', fmtNum(N.F.alt, 6) + '   ' +
           fmtGap(N.F.altGap, Math.max(1, N.F.sumExact)))}
      ${kv('∑ k C(n, k) against n2ⁿ⁻¹', fmtNum(N.F.weighted, 12) + '  vs  ' +
           fmtNum(N.F.weightedExact, 12) + '   ' + fmtGap(N.F.weightedGap, Math.max(1, N.F.weightedExact)))}
      ${kv('∑ C(n, k)² against C(2n, n)', fmtNum(N.F.squares, 14) + '  vs  ' +
           fmtNum(N.F.squaresExact, 14) + '   ' + fmtGap(N.F.squaresGap, Math.max(1, N.F.squaresExact)))}
      <p class="help">The alternating sum is compared against zero, so its scale has to come from
      somewhere else — it is the row's own total, 2ⁿ, which is what the alternation cancelled. A
      difference of 10⁻¹² means nothing until you know whether the terms were of size 1 or of size
      10¹².</p>
    </div>${common}`;
  },
  chip(st){
    const N = this.cur(st);
    if(st.view === 'hockey')
      return `<div class="k">hockey stick</div>
        <div style="color:var(--c-pos)">${fmtNum(N.H.sum, 9)}</div>
        <div style="color:var(--c-dim)">= C(${N.n + 1}, ${N.r + 1})</div>`;
    if(st.view === 'binom')
      return `<div class="k">(a + b)${uniSup('^n')}</div>
        <div style="color:var(--c-pos)">${fmtSig(N.B.direct, 6)}</div>
        <div style="color:var(--c-dim)">gross ${fmtSig(N.B.gross, 4)}</div>`;
    return `<div class="k">row ${N.n}</div>
      <div style="color:var(--c-pos)">sums to ${fmtNum(N.F.sum, 9)}</div>
      <div style="color:var(--c-dim)">= 2${uniSup('^' + N.n)}</div>`;
  },
  legend(st){
    if(st.view === 'parity')
      return [['var(--c-pos)', 'an odd entry — k AND n = k'],
              ['var(--c-faint)', 'an even one']];
    if(st.view === 'hockey')
      return [['var(--c-warn)', 'the diagonal being summed'],
              ['var(--c-pos)', 'the single entry it adds up to'],
              ['var(--c-dim)', 'the rest of the triangle']];
    if(st.view === 'binom')
      return [['var(--c-pos)', 'a positive term of the sum'],
              ['var(--c-neg)', 'a negative one'],
              ['var(--c-warn)', 'the running total']];
    return [['var(--c-pos)', 'the bottom row, whose identities are measured'],
            ['var(--c-dim)', 'the rows above it']];
  },
  dockLegend:true
};

/* ---- the triangle itself ------------------------------------------------- */
function dcTrianglePane(ctx, N, B, hockey){
  const rows = N.rows + 1;
  const cw = Math.min(72, B.pw / rows), ch = Math.min(26, B.ph / rows);
  const w = Math.min(cw, ch * 2.4);
  const x0 = B.px + B.pw / 2, y0 = B.py;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(let n = 0; n < rows; n++){
    for(let k = 0; k <= n; k++){
      const x = x0 + (k - n / 2) * w, y = y0 + n * ch + ch / 2;
      const onDiag = hockey && k === N.r && n <= N.n;
      const isTarget = hockey && n === N.n + 1;
      const inLast = !hockey && n === N.n;
      let col = TH.dim, weight = '';
      if(onDiag){ col = TH.warn; weight = '600 '; }
      else if(inLast){ col = TH.pos; weight = '600 '; }
      if(onDiag){
        ctx.fillStyle = rgbCss(TH.warn, 0.16);
        ctx.fillRect(x - w / 2 + 1, y - ch / 2 + 1, w - 2, ch - 2);
      }
      const v = N.T[n][k];
      ctx.fillStyle = rgbCss(col);
      ctx.font = weight + Math.max(8, Math.min(12, ch - 12)) + 'px ' + FONT_UI;
      ctx.fillText(fmtNum(v, 7), x, y);
    }
  }
  /* the entry the hockey stick lands on sits one row below the last drawn one,
     so it is drawn separately rather than being silently absent */
  if(hockey){
    const n = N.n + 1, k = N.r + 1;
    const x = x0 + (k - n / 2) * w, y = y0 + n * ch + ch / 2;
    if(y < B.py + B.ph){
      ctx.fillStyle = rgbCss(TH.pos, 0.22);
      ctx.fillRect(x - w / 2 + 1, y - ch / 2 + 1, w - 2, ch - 2);
      ctx.fillStyle = rgbCss(TH.pos);
      ctx.font = '600 ' + Math.max(8, Math.min(12, ch - 12)) + 'px ' + FONT_UI;
      ctx.fillText(fmtNum(dcChoose(n, k), 7), x, y);
    }
  }
  ctx.restore();
}

/* ---- the parity picture, as a bitmap ------------------------------------
   One cell per entry drawn with fillRect would be ~2000 rasterising calls per
   frame at 63 rows. It is built into an ImageData sized in CELLS and blitted,
   which is the pattern MASTER-PLAN §3.5 converted five loops to. */
function dcParityPane(ctx, N, B){
  const rows = N.rows + 1;
  const buf = ctHeatBuf(rows);
  const px = buf.img.data;
  const on = TH.pos, off = TH.bg;
  for(let n = 0; n < rows; n++){
    for(let c = 0; c < rows; c++){
      const i = 4 * (n * rows + c);
      /* the triangle is drawn centred: column c of the bitmap holds entry k
         when 2k − n + rows − 1 === 2c, so half the bitmap is background */
      const twoK = 2 * c - rows + 1 + n;
      /* dcOddEntry, NOT T[n][k] % 2 — past row 53 the stored entry has lost its
         low-order bits and its remainder mod 2 is meaningless. The naive test
         drew 665 odd cells in the first 64 rows where the answer is 3⁶ = 729,
         and the gasket simply had holes in it. */
      const odd = (twoK % 2 === 0) && twoK >= 0 && twoK / 2 <= n &&
                  dcOddEntry(n, twoK / 2);
      const col = odd ? on : off;
      px[i] = col[0]; px[i + 1] = col[1]; px[i + 2] = col[2];
      px[i + 3] = odd ? 235 : 0;
    }
  }
  buf.ctx.putImageData(buf.img, 0, 0);
  const side = Math.min(B.pw, B.ph);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf.cv, B.px + (B.pw - side) / 2, B.py, side, side * (rows / rows));
  ctx.restore();
  const odd = dcOddCount(N.rows);
  const total = rows * (rows + 1) / 2;
  stageNote(ctx, odd + ' of ' + total + ' entries are odd — ' +
            fmtNum(100 * odd / total, 4) + '%, and the fraction falls towards zero as the rows grow',
            ctx.canvas.width, ctx.canvas.height);
}

/* ---- the binomial expansion, term by term -------------------------------- */
function dcBinomPane(ctx, N, B){
  const n = Math.min(N.n, 20);
  const terms = [];
  for(let k = 0; k <= n; k++)
    terms.push(dcChoose(n, k) * Math.pow(ST.a, n - k) * Math.pow(ST.b, k));
  let run = 0;
  const runs = terms.map(t => (run += t));
  let hi = 0;
  terms.forEach(t => { hi = Math.max(hi, Math.abs(t)); });
  runs.forEach(t => { hi = Math.max(hi, Math.abs(t)); });
  hi = hi > 0 ? hi * 1.15 : 1;
  const P = mkPlot(B.px, B.py, B.pw, B.ph, -0.7, n + 0.7, -hi, hi);
  plotFrame(ctx, P, 'k', 'the term, and the running total',
            'each term of ∑ C(n, k) aⁿ⁻ᵏ bᵏ, and where they get to');
  const M = ctUnitMarks(-hi, hi, 8);
  plotTicksY(ctx, P, M.vals, v => fmtTick(v, M.step));
  ctPath(ctx, P, [{ x:-0.7, y:0 }, { x:n + 0.7, y:0 }], rgbCss(TH.line2), 1.2);
  terms.forEach((t, k) => {
    const col = t >= 0 ? TH.pos : TH.neg;
    ctFill(ctx, P, [{ x:k - 0.32, y:0 }, { x:k + 0.32, y:0 },
                    { x:k + 0.32, y:t }, { x:k - 0.32, y:t }], rgbCss(col, 0.5));
    ctPath(ctx, P, [{ x:k - 0.32, y:0 }, { x:k + 0.32, y:0 }, { x:k + 0.32, y:t },
                    { x:k - 0.32, y:t }, { x:k - 0.32, y:0 }], rgbCss(col), 1.4);
  });
  ctPath(ctx, P, runs.map((v, k) => ({ x:k, y:v })), rgbCss(TH.warn), 2.2);
  runs.forEach((v, k) => ctDot(ctx, P, k, v, 3, rgbCss(TH.warn), rgbCss(TH.bg)));
  stageNote(ctx, '(a + b)' + uniSup('^' + n) + ' = ' + fmtSig(Math.pow(ST.a + ST.b, n), 8) +
            '   ·   the terms reach ' + fmtSig(runs[n], 8), ctx.canvas.width, ctx.canvas.height);
}
