/* ============================================================================
   4nd · NUMERICAL LINEAR ALGEBRA — the direct factorisations  (wing C16)

     nlFact   PA = LU, the growth factor, and what pivoting is actually for
     nlQR     three ways to build Q, and only one of them stays orthogonal

   Both stages exist to separate two things a first course runs together: an
   algorithm that is CORRECT — it returns the answer in exact arithmetic — from
   an algorithm that is STABLE, which is a statement about what sixteen digits
   do to it. Every method on these two stages is correct. They differ by twelve
   orders of magnitude.
   ============================================================================ */

/* One cache per stage object. cur() is called by frame(), readout(), chip() and
   derive() — four times a frame — and the QR sweep below factors twenty-four
   matrices, so recomputing per call is the difference between 3 ms and 12 ms of
   arithmetic on every repaint. The key is the whole of the state the result
   depends on, so a stale value is impossible rather than unlikely. */
function nlCache(st, key, make){
  if(!st._nlc || st._nlc.key !== key) st._nlc = { key, val:make() };
  return st._nlc.val;
}

/* ============================================================================
   1 · PA = LU
   ============================================================================ */
/* Every preset here is a matrix that breaks something, and the `why` says what.
   `exact` names a property recomputed by ./auditclaims.ps1 rather than trusted:
   `growth` is the growth factor partial pivoting must produce, `cond` the
   condition number, and both are closed forms where one exists. */
const NL_LU = {
  swap:    { n:'needs a row swap',
             M:[[0, 2, 1, 3], [2, 1, -1, 4], [-1, 3, 2, 1], [1, 1, 4, -2]],
             why:'The (1,1) entry is exactly zero, so elimination cannot start at all without a swap. Nothing subtle is happening — it is the case that makes pivoting compulsory rather than merely wise.' },
  tiny:    { n:'a pivot of 10⁻¹⁷',
             M:[[1e-17, 1, 0], [1, 1, 1], [0, 1, 2]],
             cond:3.7320508,
             why:'The classic. That first pivot is not zero, so unpivoted elimination proceeds happily — and divides by 10⁻¹⁷, producing multipliers of 10¹⁷ that swamp every other entry in the matrix. The answer comes back wrong with no warning of any kind. Turn pivoting on and the same code is exact. Note what the readout says about κ: this matrix is beautifully conditioned, so the failure belongs to the ALGORITHM and not to the problem.' },
  growth:  { n:'Wilkinson’s growth matrix',
             M:nlGrowth(7), growth:64,
             why:'Unit diagonal, −1 below it, a column of 1s on the right. Every pivot is already the largest in its column, so partial pivoting performs no swaps at all and every multiplier is 1 — and the last entry of U still reaches 2ⁿ⁻¹. It is the standing counterexample to “pivoting makes elimination safe”: pivoting bounds the MULTIPLIERS, which is not the same as bounding the matrix.' },
  hilb:    { n:'Hilbert, 5×5',
             M:nlHilbert(5),
             why:'Hᵢⱼ = 1/(i+j−1) — symmetric, positive definite, and every entry a friendly little fraction. Its condition number is 4.8×10⁵ at this size and grows by roughly a factor of 15 per row. Here the algorithm is faultless and the PROBLEM is the difficulty, which is the exact opposite of the 10⁻¹⁷ preset and the reason both are here.' },
  poisson: { n:'the 1-D Poisson matrix',
             M:nlPoisson(6), cond:nlPoissonCond(6),
             why:'Tridiagonal (−1, 2, −1) — the second-difference operator, and the matrix behind every heat, wave and Laplace solver written on a grid. Weakly diagonally dominant — the interior rows have 2 against 1 + 1 — so pivoting never swaps and never needs to; its growth factor is at most 2 whatever n is. This is what a well-behaved matrix looks like, and it is worth having one for comparison.' },
  dep:     { n:'nearly dependent rows',
             M:[[1, 2, 3], [2, 4.000001, 6], [1, 1, 1]],
             why:'Row 2 is almost exactly twice row 1. The matrix is invertible — the determinant is not zero — but only just, and the readout shows κ near 10⁷: the solution exists and cannot be trusted to more than nine of its sixteen digits.' }
};

STAGES.nlFact = {
  title:'PA = LU, and what pivoting is for',
  enter(st, o){
    st.key = NL_LU[o.key] ? o.key : 'tiny';
    st.M = mxClone(NL_LU[st.key].M);
    st.pivot = o.pivot !== false;
  },
  cur(st){
    const key = st.key + '|' + st.pivot + '|' + JSON.stringify(st.M);
    return nlCache(st, key, () => {
      const A = st.M;
      const n = A.length;
      const F = nlLU(A, st.pivot);
      const Foff = nlLU(A, false), Fon = nlLU(A, true);
      const R = nlLUResid(F, A);
      /* a right-hand side that makes the answer known: b = A·(1,1,…,1), so the
         exact x is a vector of ones and the ERROR is available, not only the
         residual. Nothing about the factorisation is told this. */
      const xTrue = new Array(n).fill(1);
      const b = laMatVec(A, xTrue);
      /* U may have an exact zero on its diagonal, and then there is nothing to
         substitute with. That is not an edge case to be tidied away — it is what
         happens to the "needs a row swap" preset the moment pivoting is turned
         off, and back substitution through it returns ∞. The stage must SAY the
         factorisation does not exist rather than print an infinity dressed as an
         answer, so every derived quantity is withheld together. Found by
         runstagetests driving each preset with pivoting off; runall never saw it
         because fmtNum renders Infinity as "∞" and the grep is for the word. */
      const broke = !(F.minPiv > 0);
      const x = broke ? null : nlLUSolve(F, b);
      const rref = laSolve(A, b);                         // the route from 38-linalg
      const gapX = (x && rref.x) ? Math.max(...x.map((v, i) => Math.abs(v - rref.x[i]))) : NaN;
      const err = x ? Math.max(...x.map(v => Math.abs(v - 1))) : NaN;
      const RE = x ? nlResidError(A, b, x, xTrue) : { relResid:NaN, relErr:NaN, relResidB:NaN };
      const kappa = nlCond2(A);
      return { A, n, F, Foff, Fon, R, b, x, xTrue, rref, gapX, err, RE, kappa, broke,
               det:broke ? NaN : nlDetLU(F), detR:laDet(A),
               P:nlPermMat(F.perm), PA:nlPermRows(A, F.perm) };
    });
  },
  controls(){
    const st = ST, N = this.cur(st);
    const lbl = st.M[0].map((_, j) => 'c' + (j + 1));
    return ctSeg('nlFk', st.key, Object.keys(NL_LU).map(k => [k, NL_LU[k].n])) +
      mxHtml('nlFM', st.M, null, lbl) +
      ctChk('nlFp', 'partial pivoting on', st.pivot) +
      `<p class="help"><b>${NL_LU[st.key].n}.</b> ${NL_LU[st.key].why}</p>
      <p class="help">Every number below describes the matrix in the boxes, so edit one and watch
      which quantities move. The right-hand side is built as <b>b = A·(1, 1, …, 1)</b>, which means
      the exact answer is known and the panel can print the true <i>error</i> rather than only the
      residual — the two disagree by a factor of κ, and that is the whole subject.</p>`;
  },
  wire(){
    ctWireSeg('nlFk', v => { ST.key = v; ST.M = mxClone(NL_LU[v].M); });
    mxWire('nlFM', (i, j, v) => { ST.M[i][j] = v; });
    ctWireChk('nlFp', v => { ST.pivot = v; });
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(46, z.h + 12);
    const half = Math.max(180, W * 0.46);
    /* left: the three matrices, as grids coloured by magnitude on a log scale.
       The picture a reader needs from L and U is not the digits — it is where
       the big numbers ended up, which is exactly what the growth factor counts. */
    const B = ctFitBox(24, top, half - 40, H - top - 54);
    nlDrawTriple(ctx, B, N);
    /* right: the largest entry still in play, stage by stage, with pivoting on
       and off. The gap between the two curves IS the growth factor. */
    const gm = Math.max(N.Fon.stageMax.reduce((a, b) => Math.max(a, b), 0),
                        N.Foff.stageMax.reduce((a, b) => Math.max(a, b), 0),
                        1e-300);
    const a0 = N.Fon.stageMax[0] || 1;
    const hi = Math.ceil(Math.log10(gm / a0) + 0.5);
    const P = mkPlot(half + 44, top + 10, W - half - 78, H - top - 96,
                     0, Math.max(1, N.n - 1), -0.5, Math.max(1.5, hi));
    plotFrame(ctx, P, 'elimination stage', 'log₁₀ (largest entry ÷ largest of A)',
              'how big the numbers get');
    /* the x-axis counts stages, so its ticks must be whole numbers: ctGrid's
       default nice step gave 0.2 on a 3×3, and "elimination stage 0.4" is not a
       thing that exists */
    ctGrid(ctx, P, Math.max(1, Math.round((N.n - 1) / 6)));
    const curve = (F, col, w, dash) => {
      const pts = F.stageMax.map((v, i) => ({ x:i, y:Math.log10(Math.max(v, 1e-300) / a0) }))
                            .filter(p => Number.isFinite(p.y));
      ctPath(ctx, P, pts, col, w, dash);
      for(const p of pts) ctDot(ctx, P, p.x, p.y, 3, col);
    };
    curve(N.Foff, rgbCss(TH.neg), 2.0, [5, 4]);
    curve(N.Fon, rgbCss(TH.pos), 2.4);
    stageNote(ctx, 'growth factor: ' + fmtSig(N.Fon.growth, 4) + ' with pivoting, ' +
              fmtSig(N.Foff.growth, 4) + ' without   ·   the backward error is proportional to it',
              W, H);
  },
  derive(st){
    const N = this.cur(st);
    const n = N.n;
    return {
      title:'Elimination is a factorisation, and the factorisation is where the error lives',
      steps:[
        drvSay('the row operations were a matrix all along',
          'Subtracting m times row k from row i is left-multiplication by an elementary matrix, and that matrix is the identity with one extra entry. Do the whole elimination and you have multiplied A on the left by a product of them. Invert that product — which for unit lower triangular matrices costs nothing, you flip the signs of the multipliers — and A is the product of a lower triangular matrix and an upper one. Nothing new has been computed; the same arithmetic has been written down instead of thrown away.'),
        drvStep('so elimination produces a factorisation, not just an answer',
          `${dv('A')} ${dop('=')} ${dv('L')}${dv('U')}, ${dv('L')} unit lower triangular`,
          `here ‖PA − LU‖ = ${fmtGap(N.R.gap, N.R.scale)} against ‖A‖ = ${fmtSig(N.R.scale, 4)}`),
        drvSay('and that is worth far more than the answer',
          'A second right-hand side costs n² instead of n³: the factorisation is reusable, and the elimination is not. Every library returns the factors for exactly this reason, and it is also why the determinant comes free — it is the product of the pivots.'),
        drvStep('the determinant, from the same numbers',
          `det ${dv('A')} ${dop('=')} (${dop('−')}1)^swaps ${dop('·')} ∏ ${dv('U')}ᵢᵢ`,
          N.broke
            ? `no pivots to multiply — U is singular here, and ${fmtSig(N.detR, 8)} from 38-linalg, which pivots`
            : `${fmtSig(N.det, 8)} against ${fmtSig(N.detR, 8)} from the cofactor-free route in 38-linalg — ${fmtAgree(N.det, N.detR)}`),
        drvSay('now the part a first course leaves out',
          'Elimination in exact arithmetic is correct for any invertible A. In floating point each multiplier is computed as a quotient, and if the pivot is small that quotient is huge. Huge multipliers multiply the ROUNDING ERRORS of the row being subtracted, and those errors then swamp the entries they are added to. The information in the smaller entries is destroyed — not approximated, destroyed — and no later step can recover it.'),
        drvStep('partial pivoting bounds every multiplier by one',
          `|${dv('m')}ᵢₖ| ${dop('=')} |${dv('a')}ᵢₖ| ${dop('/')} |${dv('a')}ₖₖ| ${dop('≤')} 1`,
          `largest multiplier here: ${fmtSig(N.F.maxMult, 4)}` +
          (st.pivot ? '' : ' — pivoting is OFF, so nothing bounds it')),
        drvSay('which is necessary and is not sufficient',
          'Bounding the multipliers does not bound the matrix. The quantity in the backward error bound is the GROWTH FACTOR — the largest entry that appears anywhere during the elimination, divided by the largest entry of A — and Wilkinson\'s matrix has every multiplier equal to 1, no swaps at all, and a growth factor of 2ⁿ⁻¹. Partial pivoting is used everywhere because that worst case is essentially never met in practice, not because it cannot happen. It is a bet with excellent odds, not a theorem.'),
        drvStep('the bound the growth factor sits in',
          `(${dv('A')} ${dop('+')} ${dv('E')})${dv('x̂')} ${dop('=')} ${dv('b')}, ‖${dv('E')}‖ ${dop('≲')} ${dv('n')}²ρ ε‖${dv('A')}‖`,
          `ρ = ${fmtSig(N.Fon.growth, 4)} with pivoting here, ${fmtSig(N.Foff.growth, 4)} without`),
        drvSay('read that bound carefully, because it is not what people assume it says',
          'It says the computed x̂ is the EXACT solution of a nearby problem. It does not say x̂ is near the exact solution of this problem — that step needs the condition number, and it is where a stable algorithm can still return a useless answer. ' +
          (N.broke
            ? 'On this preset with pivoting off there is no x̂ at all: U is singular and the substitution has nothing to divide by, which is the one failure mode that announces itself.'
            : 'On this preset the residual is ' + fmtSig(N.RE.relResid, 3) +
              ' and the error in x is ' + fmtSig(N.RE.relErr, 3) +
              ', against a condition number of ' + fmtSig(N.kappa, 4) +
              ' — and note that a residual of exactly zero does not make the bound say the error is zero: ' +
              'the backward error can never be below ε, so the ceiling to read against is κ·ε = ' +
              fmtSig(N.kappa * 2.22e-16, 3) + '.')),
        drvSay('so there are two different failures and they need different cures',
          'A large growth factor is the ALGORITHM going wrong, and the cure is a better algorithm — pivot, or factor differently. A large condition number is the PROBLEM being hard, and no algorithm cures it: the answer genuinely is that sensitive to the data, and more precision only buys digits, never certainty. The 10⁻¹⁷ preset is the first, with κ = 3.7; the Hilbert preset is the second, with a growth factor of 1.')
      ],
      note:`Elimination costs about n³/3 ≈ ${fmtSig(n * n * n / 3, 3)} multiplications at this size; ` +
           `Cramer's rule as usually written costs (n+1)! ≈ ${fmtSig(nlFactorial(n + 1), 3)}. ` +
           'That is the second reason nobody uses determinants to solve anything.'
    };
  },
  readout(st){
    const N = this.cur(st);
    const F = N.F;
    return `<div class="card tight"><div class="ttl">The factorisation</div>
      ${kv('size', N.n + ' × ' + N.n)}
      ${kv('row swaps', F.swaps + (F.swaps === 0 ? ' — the rows were already in order' : ''))}
      ${kv('largest multiplier |ℓᵢⱼ|', fmtSig(F.maxMult, 5) +
          (st.pivot ? ' (pivoting bounds this by 1)' : ' — pivoting is off, so nothing bounds it'))}
      ${kv('smallest pivot |Uᵢᵢ|', fmtSig(F.minPiv, 5))}
      ${kv('‖PA − LU‖, against ‖A‖', fmtGap(N.R.gap, N.R.scale))}
      <p class="help">${N.R.gap <= 1e-10 * N.R.scale
        ? `The factorisation residual is at round-off, and for a stable elimination it is at
           round-off <i>whatever the matrix</i> — which is what backward stability means, and
           precisely why it cannot be used to decide whether the answer is any good. The rows below
           are the ones that can.`
        : `<b>The factorisation itself has failed here</b> — the two sides of PA = LU differ by a
           sizeable fraction of ‖A‖, not by round-off. That is the signature of an unstable
           elimination rather than of a hard problem: with pivoting on, the same matrix factors to
           sixteen digits. It is worth seeing once, because for a stable method this row is at
           round-off on every matrix there is, and so tells you nothing at all.`}</p>
    </div>
    <div class="card tight"><div class="ttl">Growth: what pivoting does and does not fix</div>
      ${kv('growth factor, pivoting on', fmtSig(N.Fon.growth, 5))}
      ${kv('growth factor, pivoting off', fmtSig(N.Foff.growth, 5))}
      ${kv('the ratio', fmtSig(N.Foff.growth / Math.max(1e-300, N.Fon.growth), 4) + '×')}
      <p class="help">Growth is the largest entry appearing <i>anywhere</i> during the elimination
      divided by the largest entry of A, and it is the ρ in the backward error bound. Partial
      pivoting bounds the multipliers by 1; it bounds ρ by 2ⁿ⁻¹, which is a bound nobody would
      accept if it were ever attained — and on Wilkinson's matrix it is attained exactly.</p>
    </div>
    <div class="card tight"><div class="ttl">Solving with it, two ways</div>
      ${N.broke
        ? `${kv('x by forward and back substitution', 'there is none — U has an exact zero on its diagonal')}
           ${kv('x by row reduction (38-linalg)', N.rref.x
               ? '⟨' + N.rref.x.map(v => fmtNum(v, 6)).join(', ') + '⟩'
               : 'singular — no unique solution')}
           <p class="help">With pivoting off this matrix has a zero where the first pivot should be,
           so the elimination never starts and the factorisation <b>does not exist</b> — U is
           singular and back substitution would divide by it. Nothing is printed for it, because an
           infinity formatted as a number is worse than an admission. Row reduction still solves the
           system perfectly: it swaps rows because it always did. Tick the pivoting box and the two
           routes agree to sixteen digits.</p>`
        : `${kv('x by forward and back substitution', '⟨' + N.x.map(v => fmtNum(v, 6)).join(', ') + '⟩')}
           ${kv('x by row reduction (38-linalg)', N.rref.x
               ? '⟨' + N.rref.x.map(v => fmtNum(v, 6)).join(', ') + '⟩'
               : 'singular — no unique solution')}
           ${kv('largest difference between them', Number.isFinite(N.gapX)
               ? fmtGap(N.gapX, Math.max(...N.x.map(Math.abs))) : 'not comparable')}
           ${kv('the exact answer', 'every component is 1, because b was built as A·(1, 1, …)')}
           ${kv('largest error in x', fmtGap(N.err, 1))}
           <p class="help">Two routes that share only the matrix: substitution through the factors,
           and the reduced row echelon form. When they agree, the factorisation was applied
           correctly. Note that agreeing is not the same as being right — row reduction pivots
           whatever this stage's checkbox says, so with pivoting off the two routes are genuinely
           computing different things and the difference above is the unstable one being wrong. For
           whether the answer is right, read the last row, which compares against an answer known in
           advance.</p>`}
    </div>
    <div class="card tight"><div class="ttl">Residual against error — the distinction</div>
      ${kv('relative residual ‖b − Ax̂‖ / ‖A‖‖x̂‖', N.broke ? 'no x to form a residual from'
          : fmtSig(N.RE.relResid, 4))}
      ${kv('relative error ‖x̂ − x‖ / ‖x‖', N.broke ? '—' : fmtSig(N.RE.relErr, 4))}
      ${kv('condition number κ₂(A)', fmtSig(N.kappa, 5))}
      ${kv('error ÷ residual', N.broke ? '—'
          : (N.RE.relResid > 0
             ? fmtSig(N.RE.relErr / N.RE.relResid, 4) + '   (must not exceed κ)'
             : 'the residual is exactly zero, so the ratio says nothing — the bound is read against ' +
               'κ·ε, and the error is ' + fmtSig(N.RE.relErr, 3) + ' against a ceiling of ' +
               fmtSig(N.kappa * 2.22e-16, 3)))}
      <p class="help">A backward-stable solver drives the residual to round-off on every matrix
      there is, and that is exactly why a small residual is not evidence of a good answer. The error
      can be κ times larger, and the theorem says only that it cannot be more. Switch between the
      Hilbert preset and the 10⁻¹⁷ one to see the two ways a solve goes wrong pulled apart: on the
      first the algorithm is perfect and κ is 10⁵; on the second κ is 3 and the algorithm, with
      pivoting off, is the entire problem.</p>
    </div>
    <div class="card tight"><div class="ttl">L and U</div>
      ${ctMat(F.L)}${ctMat(F.U)}
      <p class="help">L holds the multipliers with 1s down the diagonal, U is what elimination left
      behind, and the permutation applied to A was ${F.perm.map(i => 'r' + (i + 1)).join(', ')}.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    const bad = N.broke || N.RE.relErr > 1e-8;
    return `<div class="k">κ₂ = ${fmtSig(N.kappa, 3)}</div>
      <div style="color:var(--c-${bad ? 'neg' : 'pos'})">${N.broke ? 'no factorisation'
        : 'error ' + fmtSig(N.RE.relErr, 2)}</div>
      <div style="color:var(--c-dim)">growth ${fmtSig(N.F.growth, 3)}</div>`;
  },
  legend(){
    return [['var(--c-pos)', 'pivoting on'], ['var(--c-neg)', 'pivoting off'],
            ['var(--c-grad)', 'L — the multipliers'], ['var(--c-curl)', 'U — what is left']];
  },
  dockLegend:true
};

/* (n+1)! for the derive note. Written out rather than reached for in the
   combinatorics wing's dcFact, because that module loads after this one and the
   filename order is the load order. */
function nlFactorial(n){
  let p = 1;
  for(let i = 2; i <= n; i++) p *= i;
  return p;
}

/* Three grids — PA, L and U — with each cell shaded by |value| on a log scale.
   The digits are in the readout; what the canvas is for is showing WHERE the
   large numbers ended up, which is what the growth factor counts. */
function nlDrawTriple(ctx, B, N){
  const n = N.n;
  const blocks = [{ M:N.PA, t:'PA', c:TH.dim }, { M:N.F.L, t:'L', c:TH.grad },
                  { M:N.F.U, t:'U', c:TH.curl }];
  const gap = 14;
  const cell = Math.max(9, Math.min(26, Math.min((B.pw - 2 * gap) / (3 * n), (B.ph - 30) / n)));
  const gw = n * cell;
  const total = 3 * gw + 2 * gap;
  const x0 = B.px + Math.max(0, (B.pw - total) / 2);
  const y0 = B.py + 20;
  let big = 0;
  for(const bl of blocks) big = Math.max(big, nlNrmMax(bl.M));
  const lo = Math.log10(Math.max(big, 1e-300)) - 6;
  blocks.forEach((bl, k) => {
    const bx = x0 + k * (gw + gap);
    ctText(ctx, bx + gw / 2, y0 - 6, bl.t, rgbCss(bl.c), '600 12px ' + FONT_UI, 'center', 'bottom');
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
      const v = Math.abs(bl.M[i][j]);
      const t = v > 0 ? Math.max(0, Math.min(1, (Math.log10(v) - lo) / 6)) : 0;
      ctx.fillStyle = v > 0 ? rgbCss(bl.c, 0.12 + 0.8 * t) : rgbCss(TH.line2, 0.18);
      ctx.fillRect(bx + j * cell + 0.5, y0 + i * cell + 0.5, cell - 1, cell - 1);
    }
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, y0 + 0.5, gw, gw);
  });
  ctText(ctx, x0 + total / 2, y0 + n * cell + 16,
         'shade is log₁₀|entry| over six decades   ·   largest anywhere: ' + fmtSig(big, 4),
         rgbCss(TH.faint), '11px ' + FONT_UI, 'center', 'top');
}

/* ============================================================================
   2 · Q, three ways
   ============================================================================ */
const NL_QR_METHODS = {
  hh:  { n:'Householder', col:() => TH.pos,  bound:'ε',   slope:0, build:A => nlHouseQR(A) },
  mgs: { n:'modified Gram–Schmidt', col:() => TH.curl, bound:'ε·κ',  slope:1, build:A => nlGSQR(A, true) },
  cgs: { n:'classical Gram–Schmidt', col:() => TH.neg,  bound:'ε·κ²', slope:2, build:A => nlGSQR(A, false) }
};
/* The κ values the sweep is fitted over. It starts at 10³ and not at 1 for a
   measured reason: below that, classical Gram–Schmidt is already down at the
   machine-ε floor of 10⁻¹⁵, which is not the trend but the bottom of the
   instrument, and fitting a line through it pulled the first version of this
   measurement to a slope of 1.63 instead of 2. A curve that has bottomed out
   cannot be fitted; the floor is drawn on the plot so the reader can see why. */
const NL_QR_KAPPAS = [1e3, 1e4, 1e5, 1e6, 1e7];

STAGES.nlQR = {
  title:'Three ways to build Q, and only one keeps it orthogonal',
  enter(st, o){
    st.n = o.n === undefined ? 8 : o.n;
    st.lk = o.lk === undefined ? 5 : o.lk;         // log₁₀ of the κ marked on the plot
    st.method = NL_QR_METHODS[o.method] ? o.method : 'cgs';
  },
  cur(st){
    const n = Math.max(3, Math.min(14, Math.round(st.n)));
    const lk = Math.max(0, Math.min(8, st.lk));
    return nlCache(st, n + '|' + lk, () => {
      const rows = NL_QR_KAPPAS.map(kap => {
        const C = nlCondMat(n, kap, 4242);
        const out = { kap, meas:nlCond2(C.A) };
        Object.keys(NL_QR_METHODS).forEach(k => {
          const F = NL_QR_METHODS[k].build(C.A);
          out[k] = { orth:nlOrthErr(F.Q), back:laMaxDiff(laMul(F.Q, F.R), C.A) };
        });
        return out;
      });
      /* a least-squares line through log₁₀(orthogonality error) against log₁₀ κ.
         This is the measurement the stage is for: the exponent is READ OFF the
         data rather than quoted from the bound. */
      const slope = {};
      Object.keys(NL_QR_METHODS).forEach(k => {
        let sx = 0, sy = 0, sxx = 0, sxy = 0;
        rows.forEach(r => {
          const X = Math.log10(r.kap), Y = Math.log10(Math.max(r[k].orth, 1e-16));
          sx += X; sy += Y; sxx += X * X; sxy += X * Y;
        });
        const m = rows.length;
        slope[k] = (m * sxy - sx * sy) / (m * sxx - sx * sx);
      });
      /* the matrix at the κ the reader has chosen, which need not be one of the
         five the fit uses */
      const kapNow = Math.pow(10, lk);
      const C = nlCondMat(n, kapNow, 4242);
      const now = {};
      Object.keys(NL_QR_METHODS).forEach(k => {
        const F = NL_QR_METHODS[k].build(C.A);
        now[k] = { orth:nlOrthErr(F.Q), back:laMaxDiff(laMul(F.Q, F.R), C.A), QtQ:laMul(laT(F.Q), F.Q) };
      });
      return { n, lk, rows, slope, now, kapNow, C, kapMeas:nlCond2(C.A) };
    });
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('nlQm', st.method, Object.keys(NL_QR_METHODS).map(k => [k, NL_QR_METHODS[k].n])) +
      ctlRow('matrix size n', ctlSlider('nlQn', 3, 14, 1, st.n)) +
      ctlRow('condition number', ctlSlider('nlQk', 0, 8, 0.25, st.lk)) +
      `<p class="help">The test matrix is built as <b>A = UΣVᵀ</b> with the singular values spaced
      logarithmically from 1 down to 1/κ, and U and V assembled from plane rotations — so κ is
      <i>chosen</i> rather than measured, and the readout checks that the matrix really has the
      condition number it was asked for. The rotations are used instead of a QR of something random
      on purpose: a test matrix must not be built by the routine under test.</p>
      <p class="help">All three methods factor A correctly — the reconstruction ‖A − QR‖ is at
      round-off for every one of them, at every κ, and the readout prints all three so you can check
      that before believing anything else. What they differ in is whether the Q they return is
      actually orthogonal, and the answer spans twelve orders of magnitude.</p>`;
  },
  wire(){
    ctWireSeg('nlQm', v => { ST.method = v; });
    wireSlider('nlQn', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
    wireSlider('nlQk', () => ST.lk, v => { ST.lk = v; },
               v => 'κ = 10' + supDigits(String(+(+v).toFixed(2))));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(52, z.h + 14);
    const P = mkPlot(78, top, W - 130, H - top - 58, 2.6, 7.4, -16.5, 0.5);
    plotFrame(ctx, P, 'log₁₀ κ(A)', 'log₁₀ ‖QᵀQ − I‖', 'how far from orthogonal the computed Q is');
    ctGrid(ctx, P);
    /* the machine-ε floor, drawn because it is why the fit starts where it does */
    ctPath(ctx, P, [{ x:2.6, y:Math.log10(2.22e-16) }, { x:7.4, y:Math.log10(2.22e-16) }],
           rgbCss(TH.faint, 0.75), 1.2, [4, 4]);
    /* left-hand end: the right-hand end is where the three slope labels live,
       and at the default settings the Householder curve sits on this very line,
       so "machine ε" and "slope −0.035" were printed over each other */
    ctText(ctx, P.X(2.68), P.Y(Math.log10(2.22e-16)) - 5, 'machine ε',
           rgbCss(TH.faint), '10px ' + FONT_UI, 'left', 'bottom');
    Object.keys(NL_QR_METHODS).forEach(k => {
      const M = NL_QR_METHODS[k];
      const col = rgbCss(M.col(), k === st.method ? 1 : 0.5);
      const pts = N.rows.map(r => ({ x:Math.log10(r.kap), y:Math.log10(Math.max(r[k].orth, 1e-16)) }));
      ctPath(ctx, P, pts, col, k === st.method ? 2.6 : 1.6);
      for(const p of pts) ctDot(ctx, P, p.x, p.y, k === st.method ? 4 : 3, col);
      ctText(ctx, P.X(7.32), P.Y(pts[pts.length - 1].y),
             'slope ' + fmtSig(N.slope[k], 3), col, '10px ' + FONT_UI, 'left', 'middle');
    });
    /* the reader's own κ, and the three errors there */
    const xk = Math.max(2.6, Math.min(7.4, N.lk));
    ctPath(ctx, P, [{ x:xk, y:-16.5 }, { x:xk, y:0.5 }], rgbCss(TH.line2, 0.8), 1.2, [3, 3]);
    Object.keys(NL_QR_METHODS).forEach(k => {
      if(N.lk < 2.6 || N.lk > 7.4) return;
      ctDot(ctx, P, xk, Math.log10(Math.max(N.now[k].orth, 1e-16)), 5,
            rgbCss(NL_QR_METHODS[k].col()), rgbCss(TH.bg));
    });
    stageNote(ctx, 'predicted slopes: 2 for classical Gram–Schmidt, 1 for modified, 0 for Householder' +
              '   ·   measured ' + fmtSig(N.slope.cgs, 3) + ', ' + fmtSig(N.slope.mgs, 3) +
              ', ' + fmtSig(N.slope.hh, 3), W, H);
  },
  derive(st){
    const N = this.cur(st);
    const M = NL_QR_METHODS[st.method];
    return {
      title:'Why the same factorisation, computed three ways, is three different things',
      steps:[
        drvSay('all three answer the same question and all three are correct',
          'Every method here writes A as an orthogonal Q times an upper triangular R, and every one of them does it exactly in exact arithmetic. The readout prints ‖A − QR‖ for all three at every κ and it is at round-off throughout. If correctness were the whole story there would be nothing to choose between them.'),
        drvStep('Gram–Schmidt subtracts the projections it has already found',
          `${dv('q')}ⱼ ${dop('∝')} ${dv('a')}ⱼ ${dop('−')} ∑ᵢ₍ⱼ (${dv('q')}ᵢ${dop('·')}${dv('a')}ⱼ) ${dv('q')}ᵢ`,
          'the classical form: every coefficient taken against the ORIGINAL column aⱼ'),
        drvStep('the modified form changes one thing and nothing else',
          `${dv('v')} ${dop('←')} ${dv('v')} ${dop('−')} (${dv('q')}ᵢ${dop('·')}${dv('v')}) ${dv('q')}ᵢ, in turn`,
          'each coefficient taken against what is LEFT of the column, not against the original'),
        drvSay('in exact arithmetic those two lines are the same number',
          'Once q₁ has been subtracted off, v is orthogonal to q₁, so q₂·v and q₂·aⱼ are equal — exactly. The rearrangement is algebraically invisible, which is why the two forms are so often presented as the same method with two spellings.'),
        drvSay('in floating point they are not, and the reason is one word: cancellation',
          'The computed q₁ is not exactly orthogonal to anything; it is off by about ε. When aⱼ is nearly in the span of what came before, the subtraction destroys almost all of aⱼ\'s digits, and what survives is dominated by that ε. The classical form takes every later coefficient against the original aⱼ, so it never sees the contamination and never corrects for it; the modified form takes each against the current remainder, so each subtraction removes the part of the error the previous step just introduced. One extra bite at it turns κ² into κ.'),
        drvStep('the bounds, and what the plot measures against them',
          `‖${dv('Q')}ᵀ${dv('Q')} ${dop('−')} ${dv('I')}‖ ${dop('≲')} ${M.bound}`,
          `predicted slope ${M.slope} against log κ; measured ${fmtSig(N.slope[st.method], 4)} over five decades`),
        drvSay('Householder does not depend on κ at all, and the reason is structural',
          'A reflection is orthogonal by construction — the computed reflector I − 2vvᵀ/vᵀv is orthogonal to within ε no matter what vector v it was built from, because orthogonality is a property of the FORM and not of the data. Q is a product of such reflections, so its departure from orthogonality is the accumulation of a few dozen ε and is bounded by the number of columns rather than by the conditioning. The plot shows that as a flat line, which is the strongest statement any of the three can make.'),
        drvSay('and one honest caveat, which the measurement makes rather than the theory',
          'The classical bound is tight here: the measured slope is ' + fmtSig(N.slope.cgs, 3) +
          ' against a predicted 2. The modified one is NOT — the measured slope is ' +
          fmtSig(N.slope.mgs, 3) + ', not 1. Both are upper bounds, and an upper bound being met is a fact about the family of matrices, not a theorem. Saying so is the point: quoting "modified Gram–Schmidt loses orthogonality like κ" as though it were an equality would be asserting something this stage can see is false.'),
        drvSay('which of the three to use, then',
          'Householder when you want Q and the matrix might be badly conditioned, which is almost always: it costs about twice the flops of Gram–Schmidt and buys unconditional orthogonality. Modified Gram–Schmidt when the columns arrive one at a time and cannot be stored — that is what Arnoldi and GMRES need, and it is why the modified form survives at all. Classical Gram–Schmidt for proofs, where the arithmetic is exact and it is the clearest to write down.')
      ],
      note:'Every number on this stage is recomputed from a matrix built to have the condition ' +
           'number named on the slider. Nothing here is stored: change n and watch the three slopes ' +
           'move, because the constants in front of the bounds depend on the size and the exponents do not.'
    };
  },
  readout(st){
    const N = this.cur(st);
    const rowFor = k => {
      const M = NL_QR_METHODS[k];
      return kv(M.n, 'orthogonality ' + fmtSig(N.now[k].orth, 3) +
                '   ·   ‖A − QR‖ ' + fmtSig(N.now[k].back, 3) +
                (k === st.method ? '  <span style="color:var(--c-pos)">← showing</span>' : ''));
    };
    return `<div class="card tight"><div class="ttl">At κ = 10<sup>${fmtNum(N.lk, 4)}</sup>, n = ${N.n}</div>
      ${kv('κ asked for', fmtSig(N.kapNow, 6))}
      ${kv('κ the matrix actually has', fmtSig(N.kapMeas, 6))}
      ${kv('the two, compared', fmtAgree(N.kapNow, N.kapMeas))}
      <p class="help">The construction is checked before anything is concluded from it. A sweep
      against a condition number the matrices did not have would be a plot of nothing.</p>
    </div>
    <div class="card tight"><div class="ttl">The three methods, at this κ</div>
      ${Object.keys(NL_QR_METHODS).map(rowFor).join('')}
      ${kv('classical ÷ Householder', fmtSig(N.now.cgs.orth / Math.max(N.now.hh.orth, 1e-300), 4) + '×')}
      <p class="help">Both columns matter. <b>‖A − QR‖</b> says the factorisation is right, and it is
      right for all three — so a check that stopped there would find nothing wrong. <b>‖QᵀQ − I‖</b>
      says whether Q is orthogonal, which is the property everything downstream actually uses: solve
      a least-squares problem with a Q that is not orthogonal and Qᵀ is not its inverse, so the
      triangular solve is answering a different question.</p>
    </div>
    <div class="card tight"><div class="ttl">Measured exponents, over five decades of κ</div>
      ${Object.keys(NL_QR_METHODS).map(k => kv(NL_QR_METHODS[k].n,
          'measured ' + fmtSig(N.slope[k], 4) + '   ·   bound ' + NL_QR_METHODS[k].bound +
          ' predicts ' + NL_QR_METHODS[k].slope)).join('')}
      <p class="help">These are least-squares fits to the five points on the plot, not quoted
      exponents. The classical figure lands on 2 and the Householder one on 0; the modified figure
      comes out below 1, which means its bound is <i>not attained</i> on this family of matrices.
      That is what an upper bound is entitled to do, and it is worth seeing once — a bound that is
      met is a fact about the example, and only a bound that is proved is a fact about the method.</p>
    </div>
    <div class="card tight"><div class="ttl">QᵀQ for ${NL_QR_METHODS[st.method].n}</div>
      ${ctMat(N.now[st.method].QtQ.slice(0, Math.min(5, N.n)).map(r => r.slice(0, Math.min(5, N.n))))}
      <p class="help">The top-left corner of QᵀQ, which should be the identity. Off-diagonal entries
      are the inner products between columns that were supposed to be perpendicular.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">${NL_QR_METHODS[st.method].n}</div>
      <div style="color:var(--c-${N.now[st.method].orth > 1e-10 ? 'neg' : 'pos'})">‖QᵀQ−I‖ ${fmtSig(N.now[st.method].orth, 2)}</div>
      <div style="color:var(--c-dim)">slope ${fmtSig(N.slope[st.method], 3)}</div>`;
  },
  legend(){
    return Object.keys(NL_QR_METHODS).map(k =>
      ['var(--c-' + (k === 'hh' ? 'pos' : k === 'mgs' ? 'curl' : 'neg') + ')',
       NL_QR_METHODS[k].n + ' — ' + NL_QR_METHODS[k].bound]);
  },
  dockLegend:true
};
