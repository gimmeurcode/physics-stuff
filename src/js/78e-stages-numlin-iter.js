/* ============================================================================
   4ne · NUMERICAL LINEAR ALGEBRA — conditioning and iteration  (wing C16)

     nlCond    what κ actually is, and why a small residual proves nothing
     nlIter    Jacobi, Gauss–Seidel and SOR, with the rate predicted and measured
     nlKrylov  conjugate gradients against steepest descent, and the √κ bound

   The three stages are one argument in three parts. nlCond says how much the
   ANSWER can move when the data moves — a property of the problem that no
   algorithm can improve. nlIter and nlKrylov are then about how fast a method
   gets there, and both measure the rate two independent ways rather than
   quoting the theorem: once from the spectrum of a matrix the run never builds,
   and once from the run itself, which never looks at a spectrum.
   ============================================================================ */

/* ============================================================================
   1 · Conditioning
   ============================================================================ */
const NL_COND_VIEWS = {
  ellipse: 'the circle and its ellipse',
  amplify: 'how far an error is amplified',
  resid:   'a small residual is not a small error'
};
/* 2×2 matrices for the geometric view. Each one is a different shape of ellipse
   and therefore a different κ, and the last is the case worth staring at: two
   almost parallel rows, which is what "nearly singular" looks like. */
const NL_COND_2 = {
  round:  { n:'well conditioned',   M:[[2, 0], [0, 1.6]] },
  shear:  { n:'a shear',            M:[[1, 1.4], [0, 1]] },
  /* the name is a claim and ./auditclaims.ps1 recomputes it: σ = 1 ± 0.9 gives
     κ = 19 exactly. The first version of this row read "κ ≈ 20" beside a matrix
     whose κ is 39, which is the sort of thing a preset table is for getting
     wrong and a gate is for catching. */
  thin:   { n:'κ = 19',             M:[[1, 0.9], [0.9, 1]] },
  nearly: { n:'nearly singular',    M:[[1, 1], [1, 1.0004]] }
};

STAGES.nlCond = {
  title:'Conditioning — how much the answer can move',
  enter(st, o){
    st.view = NL_COND_VIEWS[o.view] ? o.view : 'resid';
    st.ckey = NL_COND_2[o.ckey] ? o.ckey : 'thin';
    st.M = mxClone(NL_COND_2[st.ckey].M);
    st.hn = o.hn === undefined ? 12 : o.hn;         // largest Hilbert size in the resid sweep
    st.an = o.an === undefined ? 6 : o.an;          // size of the matrices in the amplify sweep
  },
  cur(st){
    const key = st.view + '|' + st.ckey + '|' + JSON.stringify(st.M) + '|' + st.hn + '|' + st.an;
    return nlCache(st, key, () => {
      if(st.view === 'ellipse'){
        const S = nlSVDJacobi(st.M);
        const K = nlKappaAttain(st.M, 1e-6);
        return { S, K, kappa:S.cond, det:laDet(st.M) };
      }
      if(st.view === 'amplify'){
        const n = Math.max(2, Math.min(10, Math.round(st.an)));
        const rows = [];
        for(let e = 1; e <= 10; e++){
          const kap = Math.pow(10, e);
          const C = nlCondMat(n, kap, 5150);
          const K = nlKappaAttain(C.A, 1e-9);
          /* four ordinary directions beside the worst one, so the reader can see
             the bound as a CEILING that is touched rather than a rule everything
             obeys tightly */
          const F = nlLU(C.A);
          const others = [];
          for(let t = 0; t < 4; t++){
            const b = C.U.map(r => r[t % n] + 0.4 * r[(t + 2) % n]);
            const db = C.U.map(r => 1e-9 * r[(t + 1) % n]);
            const x = nlLUSolve(F, b), x2 = nlLUSolve(F, laAdd(b, db));
            others.push((nlNrm2(laSub(x2, x)) / nlNrm2(x)) / (nlNrm2(db) / nlNrm2(b)));
          }
          rows.push({ kap, meas:K.kappa, amp:K.amp, others });
        }
        return { n, rows };
      }
      const N = Math.max(3, Math.min(13, Math.round(st.hn)));
      const rows = [];
      for(let n = 2; n <= N; n++){
        const H = nlHilbert(n);
        const xTrue = new Array(n).fill(1);
        const b = laMatVec(H, xTrue);
        const x = nlLUSolve(nlLU(H), b);
        const RE = nlResidError(H, b, x, xTrue);
        const kap = nlCond2(H);
        rows.push({ n, kap, resid:RE.relResid, err:RE.relErr, bound:Math.min(1e3, kap * 2.22e-16) });
      }
      return { N, rows, last:rows[rows.length - 1] };
    });
  },
  controls(){
    const st = ST;
    let body = ctSeg('nlCv', st.view, Object.keys(NL_COND_VIEWS).map(k => [k, NL_COND_VIEWS[k]]));
    if(st.view === 'ellipse'){
      body += ctSeg('nlCk', st.ckey, Object.keys(NL_COND_2).map(k => [k, NL_COND_2[k].n])) +
        mxHtml('nlCM', st.M, null, ['c1', 'c2']) +
        `<p class="help">A matrix takes the unit circle to an ellipse, always. The two semi-axes are
        the singular values, the directions they point in are the columns of U, and
        <b>κ = σ₁/σ₂</b> is the ratio of the long axis to the short one. A near-singular matrix is a
        flat ellipse, and the reason it is dangerous is drawn rather than argued: a small step
        <i>across</i> the flat direction comes from a huge step in the pre-image.</p>`;
    } else if(st.view === 'amplify'){
      body += ctlRow('matrix size n', ctlSlider('nlCa', 2, 10, 1, st.an)) +
        `<p class="help">At each condition number a matrix is built with that κ, and a right-hand
        side is perturbed by one part in 10⁹ — once along the direction that does the most damage,
        and four times along ordinary ones. The measured amplification is plotted against κ. The
        worst direction lands on the diagonal, which says the bound is <b>sharp</b>: it is not a
        pessimistic estimate but a value actually attained.</p>`;
    } else {
      body += ctlRow('largest Hilbert size', ctlSlider('nlCh', 3, 13, 1, st.hn)) +
        `<p class="help">Solve <b>Hx = b</b> with b built so that the exact answer is a vector of
        ones, then compare two things: how well the computed x satisfies the equation (the residual),
        and how close it is to the answer (the error). The residual stays at round-off for every size.
        The error climbs by more than an order of magnitude per row — faster than κ does — and by
        n = 13 there is nothing left of it at all.</p>`;
    }
    return body;
  },
  wire(){
    ctWireSeg('nlCv', v => { ST.view = v; });
    ctWireSeg('nlCk', v => { ST.ckey = v; ST.M = mxClone(NL_COND_2[v].M); });
    mxWire('nlCM', (i, j, v) => { ST.M[i][j] = v; });
    wireSlider('nlCh', () => ST.hn, v => { ST.hn = Math.round(v); }, v => 'up to ' + Math.round(v) + '×' + Math.round(v));
    wireSlider('nlCa', () => ST.an, v => { ST.an = Math.round(v); }, v => 'n = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(52, z.h + 14);
    if(st.view === 'ellipse') return nlDrawEllipse(ctx, W, H, top, st, N);
    if(st.view === 'amplify'){
      const P = mkPlot(78, top, W - 130, H - top - 58, 0.5, 10.5, 0.5, 10.5);
      plotFrame(ctx, P, 'log₁₀ κ(A)', 'log₁₀ amplification', 'what a perturbation of b does to x');
      ctGrid(ctx, P);
      ctPath(ctx, P, [{ x:0.5, y:0.5 }, { x:10.5, y:10.5 }], rgbCss(TH.faint, 0.8), 1.4, [5, 4]);
      ctText(ctx, P.X(9.4), P.Y(9.9), 'the bound: amplification = κ',
             rgbCss(TH.faint), '10px ' + FONT_UI, 'right', 'bottom');
      const worst = N.rows.map(r => ({ x:Math.log10(r.meas), y:Math.log10(Math.max(r.amp, 1e-3)) }));
      ctPath(ctx, P, worst, rgbCss(TH.neg), 2.4);
      for(const r of N.rows){
        const X = Math.log10(r.meas);
        ctDot(ctx, P, X, Math.log10(Math.max(r.amp, 1e-3)), 4, rgbCss(TH.neg));
        for(const o of r.others)
          if(o > 0) ctDot(ctx, P, X, Math.max(0.5, Math.log10(o)), 2.6, rgbCss(TH.curl, 0.75));
      }
      stageNote(ctx, 'red: the worst direction, which attains the bound   ·   ' +
                'orange: four ordinary directions, which need not', W, H);
      return;
    }
    const P = mkPlot(80, top, W - 132, H - top - 58, 2, Math.max(4, N.N), -17, 3);
    plotFrame(ctx, P, 'size of the Hilbert matrix', 'log₁₀ (relative size)',
              'the residual stays at round-off while the error climbs');
    ctGrid(ctx, P);
    const line = (get, col, w, dash) => {
      const pts = N.rows.map(r => ({ x:r.n, y:Math.log10(Math.max(get(r), 1e-17)) }))
                        .filter(p => Number.isFinite(p.y));
      ctPath(ctx, P, pts, col, w, dash);
      for(const p of pts) ctDot(ctx, P, p.x, p.y, 3, col);
    };
    line(r => r.kap * 2.22e-16, rgbCss(TH.faint), 1.6, [5, 4]);
    line(r => r.resid, rgbCss(TH.pos), 2.4);
    line(r => r.err, rgbCss(TH.neg), 2.4);
    stageNote(ctx, 'green: relative residual   ·   red: relative error   ·   ' +
              'dashed: the κ·ε bound the error must stay under', W, H);
  },
  derive(st){
    const N = this.cur(st);
    const tail = st.view === 'resid'
      ? `at n = ${N.last.n} the residual is ${fmtSig(N.last.resid, 3)} and the error ${fmtSig(N.last.err, 3)}`
      : st.view === 'ellipse'
        ? `here σ₁ = ${fmtSig(N.S.sigma[0], 5)}, σ₂ = ${fmtSig(N.S.sigma[1], 5)}, κ = ${fmtSig(N.kappa, 5)}`
        : `the worst direction reaches ${fmtSig(N.rows[N.rows.length - 1].amp, 4)} at κ = ${fmtSig(N.rows[N.rows.length - 1].meas, 4)}`;
    return {
      title:'Where the condition number comes from, and what it does not tell you',
      steps:[
        drvStep('perturb the right-hand side and subtract',
          `${dv('A')}(${dv('x')} ${dop('+')} δ${dv('x')}) ${dop('=')} ${dv('b')} ${dop('+')} δ${dv('b')} ${dop('⇒')} δ${dv('x')} ${dop('=')} ${dv('A')}⁻¹δ${dv('b')}`,
          'exact, with no approximation in it — the error obeys the same equation'),
        drvStep('bound each side by the norms',
          `‖δ${dv('x')}‖ ${dop('≤')} ‖${dv('A')}⁻¹‖‖δ${dv('b')}‖ and ‖${dv('b')}‖ ${dop('≤')} ‖${dv('A')}‖‖${dv('x')}‖`,
          'the second is the same inequality applied to Ax = b'),
        drvStep('divide one by the other and the two norms meet',
          `${dfrac('‖δ' + dv('x') + '‖', '‖' + dv('x') + '‖')} ${dop('≤')} ‖${dv('A')}‖‖${dv('A')}⁻¹‖ ${dop('·')} ${dfrac('‖δ' + dv('b') + '‖', '‖' + dv('b') + '‖')}`,
          'and that product is what κ(A) is defined to be'),
        drvSay('so κ is a property of the problem and not of any method',
          'It was derived without mentioning an algorithm, a computer or a rounding error. It says: if the data you were given is uncertain by one part in a million, the answer is uncertain by κ parts in a million, and no amount of care in the computation changes that. A large κ is not a bug to be fixed; it is a statement about the question.'),
        drvStep('in the 2-norm it is a ratio of singular values',
          `κ₂(${dv('A')}) ${dop('=')} σ₁ ${dop('/')} σₙ`,
          'the longest axis of the ellipse divided by the shortest — ' + tail),
        drvSay('and the bound is attained, which is what makes it worth quoting',
          'Take b along u₁, the direction A stretches most, so x is as short as it can be for that b. Take δb along uₙ, the direction A stretches least, so A⁻¹δb is as long as it can be. Both extremes at once, and the inequality becomes an equality. The "amplification" view drives exactly that pair and lands on the diagonal — a bound nobody could attain would tell you nothing about how bad things really get.'),
        drvSay('now the part that catches people, and it catches them in production',
          'A backward-stable solver returns an x̂ whose residual b − Ax̂ is at round-off. Always. On every matrix, however dreadful. So the residual is not evidence about the error: it is evidence that the algorithm did its job, which is a different question, and κ is exactly the exchange rate between the two. The Hilbert view is that sentence as a picture — one curve flat along the bottom, the other climbing off the top of the plot, computed from the same solutions.'),
        drvSay('what to do about it, since "use more precision" is the wrong answer',
          'More precision moves both curves down together and leaves the ratio alone, so it buys digits without buying trust. What actually helps is changing the problem: scale the rows and columns so the entries are comparable, choose a better basis — fitting a polynomial in Chebyshev form instead of in powers of x turns a Hilbert-like matrix into a well-conditioned one — regularise, or accept a nearby problem you can solve and report the uncertainty honestly. Every one of those is a change to the question rather than to the arithmetic.')
      ],
      note:'One number on this stage is not a residual and must not be read as one: κ is a ' +
           'measured property of the matrix, so it is printed with fmtSig, at its own size. The ' +
           'differences beside it are printed against their scales.'
    };
  },
  readout(st){
    const N = this.cur(st);
    if(st.view === 'ellipse'){
      const S = N.S, K = N.K;
      return `<div class="card tight"><div class="ttl">The ellipse</div>
        ${kv('σ₁ — the long semi-axis', fmtSig(S.sigma[0], 6))}
        ${kv('σ₂ — the short one', fmtSig(S.sigma[1], 6))}
        ${kv('κ₂ = σ₁/σ₂', fmtSig(N.kappa, 6))}
        ${kv('area factor |det A|', fmtSig(Math.abs(N.det), 6) + ' = σ₁σ₂ = ' + fmtSig(S.sigma[0] * S.sigma[1], 6))}
        ${kv('the two routes to the area', fmtAgree(Math.abs(N.det), S.sigma[0] * S.sigma[1]))}
        <p class="help">The determinant and the product of the singular values are the same number
        reached two ways — one by elimination, one by rotating the columns until they are
        perpendicular. A matrix can have a perfectly healthy determinant and a terrible κ: stretch
        one axis by 1000 and squash the other by 1000 and the area is unchanged.</p>
      </div>
      <div class="card tight"><div class="ttl">The worst perturbation, driven</div>
        ${kv('relative change in b', fmtSig(K.relIn, 4))}
        ${kv('relative change in x', fmtSig(K.relOut, 4))}
        ${kv('amplification', fmtSig(K.amp, 6))}
        ${kv('against κ', fmtAgree(K.amp, K.kappa))}
        <p class="help">b is taken along the long axis and the perturbation across the short one.
        The measured amplification is κ to every digit either route has — which is the bound being
        <i>attained</i>, not merely respected.</p>
      </div>`;
    }
    if(st.view === 'amplify'){
      const last = N.rows[N.rows.length - 1];
      return `<div class="card tight"><div class="ttl">The worst direction, at each κ</div>
        ${N.rows.filter((_, i) => i % 2 === 1).map(r =>
          kv('κ = ' + fmtSig(r.meas, 3), 'amplification ' + fmtSig(r.amp, 5) +
             '   ·   ' + fmtAgree(r.amp, r.meas))).join('')}
        <p class="help">Each row is a matrix built to have that condition number, solved twice, with
        the two answers compared. Nothing here consults the bound; the bound is what the numbers turn
        out to be.</p>
      </div>
      <div class="card tight"><div class="ttl">Ordinary directions, at κ = ${fmtSig(last.meas, 4)}</div>
        ${last.others.map((o, i) => kv('direction ' + (i + 1), fmtSig(o, 5) +
           '   ·   ' + fmtSig(100 * o / last.meas, 3) + '% of the bound')).join('')}
        <p class="help">A randomly chosen perturbation usually does far less damage than the worst
        one — which is why an ill-conditioned system can behave perfectly well for a long time and
        then, on one particular right-hand side, not. The bound describes the ceiling; it says
        nothing about the typical case, and neither of those facts is a substitute for the other.</p>
      </div>`;
    }
    const L = N.last;
    return `<div class="card tight"><div class="ttl">Hilbert matrices, solved</div>
      ${N.rows.filter(r => r.n >= N.N - 5).map(r =>
        kv('n = ' + r.n, 'κ ' + fmtSig(r.kap, 4) + '   ·   residual ' + fmtSig(r.resid, 3) +
           '   ·   error ' + fmtSig(r.err, 3))).join('')}
      <p class="help">Three columns from one solve. κ grows by roughly a factor of fifteen per row,
      the residual does not move, and the error tracks κ.</p>
    </div>
    <div class="card tight"><div class="ttl">At n = ${L.n}</div>
      ${kv('condition number', fmtSig(L.kap, 5))}
      ${kv('relative residual', fmtSig(L.resid, 4))}
      ${kv('relative error', fmtSig(L.err, 4))}
      ${kv('error ÷ residual', fmtSig(L.err / Math.max(1e-300, L.resid), 4))}
      ${kv('the κ·ε ceiling', fmtSig(L.kap * 2.22e-16, 4) +
          (L.err <= L.kap * 2.22e-16 * 1.5 ? '   — the error is under it' : '   — see the note below'))}
      <p class="help">The solver is not at fault anywhere on this plot. It returns, every time, the
      exact answer to a problem whose matrix differs from this one in the sixteenth digit — and for
      a Hilbert matrix of this size, a matrix differing in the sixteenth digit has a completely
      different solution. That is the whole of the difficulty, and it is in the question rather than
      in the arithmetic.</p>
      <p class="help">Past about n = 12 the error reaches 1, meaning not one correct digit survives.
      The computed answer at that point is not a poor approximation to the vector of ones — it is
      unrelated to it, and only the fact that the true answer was known in advance reveals that.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    if(st.view === 'ellipse')
      return `<div class="k">κ₂ = ${fmtSig(N.kappa, 4)}</div>
        <div style="color:var(--c-pos)">amplification ${fmtSig(N.K.amp, 4)}</div>
        <div style="color:var(--c-dim)">σ ${fmtSig(N.S.sigma[0], 3)} / ${fmtSig(N.S.sigma[1], 3)}</div>`;
    if(st.view === 'amplify'){
      const last = N.rows[N.rows.length - 1];
      return `<div class="k">n = ${N.n}</div>
        <div style="color:var(--c-neg)">worst ${fmtSig(last.amp, 3)}</div>
        <div style="color:var(--c-dim)">κ ${fmtSig(last.meas, 3)}</div>`;
    }
    return `<div class="k">Hilbert ${N.last.n}×${N.last.n}</div>
      <div style="color:var(--c-pos)">residual ${fmtSig(N.last.resid, 2)}</div>
      <div style="color:var(--c-neg)">error ${fmtSig(N.last.err, 2)}</div>`;
  },
  legend(st){
    if(st.view === 'ellipse')
      return [['var(--c-dim)', 'the unit circle'], ['var(--c-grad)', 'its image, the ellipse'],
              ['var(--c-pos)', 'σ₁u₁ — the long axis'], ['var(--c-neg)', 'σ₂u₂ — the short axis']];
    if(st.view === 'amplify')
      return [['var(--c-neg)', 'the worst direction'], ['var(--c-curl)', 'ordinary directions'],
              ['var(--faint)', 'amplification = κ']];
    return [['var(--c-pos)', 'relative residual'], ['var(--c-neg)', 'relative error'],
            ['var(--faint)', 'the κ·ε ceiling']];
  },
  dockLegend:true
};

/* The circle-to-ellipse pane. Equal scales are promised by the picture — a κ
   read off as a ratio of axis lengths is only true if a unit is the same number
   of pixels in both directions — so the box is settled with ctFitBox FIRST and
   the window derived from the box, never the other way round. */
function nlDrawEllipse(ctx, W, H, top, st, N){
  const B = ctFitBox(70, top, W - 120, H - top - 56);
  const S = N.S;
  const R = Math.max(1.2 * S.sigma[0], 1.6);
  const asp = B.pw / B.ph;
  const P = asp >= 1 ? mkPlot(B.px, B.py, B.pw, B.ph, -R * asp, R * asp, -R, R)
                     : mkPlot(B.px, B.py, B.pw, B.ph, -R, R, -R / asp, R / asp);
  plotFrame(ctx, P, 'x', 'y', 'the unit circle, and where A sends it');
  ctGrid(ctx, P);
  const NPT = 220;
  const circ = [], ell = [];
  for(let i = 0; i <= NPT; i++){
    const t = 2 * Math.PI * i / NPT;
    const u = Math.cos(t), v = Math.sin(t);
    circ.push({ x:u, y:v });
    ell.push({ x:st.M[0][0] * u + st.M[0][1] * v, y:st.M[1][0] * u + st.M[1][1] * v });
  }
  ctPath(ctx, P, circ, rgbCss(TH.dim, 0.85), 1.6, [4, 4]);
  ctPath(ctx, P, ell, rgbCss(TH.grad), 2.4);
  /* the two semi-axes: σᵢ times the i-th column of U */
  ctArrow(ctx, P, 0, 0, S.sigma[0] * S.U[0][0], S.sigma[0] * S.U[1][0],
          rgbCss(TH.pos), 2.4, 'σ₁ = ' + fmtSig(S.sigma[0], 4));
  ctArrow(ctx, P, 0, 0, S.sigma[1] * S.U[0][1], S.sigma[1] * S.U[1][1],
          rgbCss(TH.neg), 2.4, 'σ₂ = ' + fmtSig(S.sigma[1], 4));
  stageNote(ctx, 'κ = σ₁/σ₂ = ' + fmtSig(N.kappa, 5) +
            '   ·   a flat ellipse is a matrix whose inverse magnifies', W, H);
}

/* ============================================================================
   2 · Stationary iteration
   ============================================================================ */
const NL_ITER = {
  poisson: { n:'the Poisson matrix', mk:n => nlPoisson(n), sizeable:true, ordered:true,
             why:'Tridiagonal (−1, 2, −1). It is <i>consistently ordered</i>, which is the hypothesis Young\'s theorem needs, so all three closed forms below apply exactly: ρ(Jacobi) = cos(π/(n+1)), ρ(Gauss–Seidel) is its square, and SOR at the optimal ω achieves ω−1. Every one of them is checked against the run.' },
  strict:  { n:'strictly diagonally dominant', mk:() => [[10, -1, 2, 0], [-1, 11, -1, 3], [2, -1, 10, -1], [0, 3, -1, 8]],
             why:'The textbook guarantee: if each diagonal entry beats the sum of the others in its row, Jacobi and Gauss–Seidel both converge, whatever the right-hand side and whatever the starting guess. It is a sufficient condition and a very comfortable one, which is why it is the condition everybody remembers.' },
  jacOnly: { n:'Jacobi converges, Gauss–Seidel does not', mk:() => [[1, 2, -2], [1, 1, 1], [2, 2, 1]],
             why:'Not diagonally dominant, and the guarantee therefore says nothing — which is not the same as saying it fails. Jacobi\'s iteration matrix here is <b>nilpotent</b>: its spectral radius is exactly zero and the iteration is finished in three sweeps. Gauss–Seidel, usually the faster of the two, has a radius above 1 and runs away. Neither of those is visible from the matrix by inspection.' },
  gsOnly:  { n:'Gauss–Seidel converges, Jacobi does not', mk:() => [[2, -1, 1], [2, 2, 2], [-1, -1, 2]],
             why:'The same lesson in the opposite direction, and the pair is the point: "Gauss–Seidel is Jacobi but faster" is false, and so is its converse. They are different iterations with different spectra, and which one converges is a property of the matrix that has to be computed rather than guessed.' }
};
const NL_ITER_METHODS = { jacobi:'Jacobi', gs:'Gauss–Seidel', sor:'SOR' };

STAGES.nlIter = {
  title:'Jacobi, Gauss–Seidel and SOR — the rate, predicted and measured',
  enter(st, o){
    st.key = NL_ITER[o.key] ? o.key : 'poisson';
    st.n = o.n === undefined ? 12 : o.n;
    st.w = o.w === undefined ? 1.5 : o.w;
    st.sweeps = o.sweeps || 60;
  },
  mat(st){
    const E = NL_ITER[st.key];
    return E.sizeable ? E.mk(Math.max(3, Math.min(30, Math.round(st.n)))) : E.mk();
  },
  cur(st){
    const key = st.key + '|' + Math.round(st.n) + '|' + (+st.w).toFixed(3) + '|' + Math.round(st.sweeps);
    return nlCache(st, key, () => {
      const A = this.mat(st);
      const n = A.length;
      const sweeps = Math.max(5, Math.min(400, Math.round(st.sweeps)));
      const w = Math.max(0.1, Math.min(1.98, st.w));
      /* b built from a known x, so the plotted quantity is the true error */
      const xTrue = Array.from({ length:n }, (_, i) => Math.sin(1 + i));
      const b = laMatVec(A, xTrue);
      const runs = {}, rho = {}, fit = {};
      Object.keys(NL_ITER_METHODS).forEach(k => {
        runs[k] = nlIterate(A, b, k, w, sweeps, null, xTrue);
        const IM = nlIterMatrix(A, k, w);
        rho[k] = IM ? nlRhoGelfand(IM.G) : NaN;
        fit[k] = nlRateFit(runs[k].hist);
      });
      /* ρ against ω, so the optimum is found by looking rather than by trusting
         Young. Twenty-five points, and the minimum located on that grid. */
      const wCurve = [];
      for(let i = 0; i <= 24; i++){
        const ww = 0.2 + i * (1.95 - 0.2) / 24;
        const IM = nlIterMatrix(A, 'sor', ww);
        wCurve.push({ w:ww, rho:IM ? nlRhoGelfand(IM.G, 8) : NaN });
      }
      /* The coarse grid locates the minimum to ±0.07, which is not good enough
         to be COMPARED with Young's closed form — the first version printed the
         grid point against ω_opt as though the 4% between them meant something,
         when all it measured was the grid spacing. Refine by golden section on
         the bracketing interval; the minimum is a kink rather than a smooth
         turning point (the two branches of ρ meet there), so a method that
         assumes only unimodality is the right one and a parabola fit is not. */
      let bi = 0;
      for(let i = 1; i < wCurve.length; i++)
        if(Number.isFinite(wCurve[i].rho) && wCurve[i].rho < wCurve[bi].rho) bi = i;
      /* twelve doublings here and eight for the drawn curve. The refinement is
         the number that gets COMPARED with Young's closed form, and near ω_opt
         the SOR eigenvalues coalesce into defective pairs, so Gelfand's residual
         bias is O(1/m): at eight doublings (m = 64 after the second difference)
         it read 1.4% low and located the minimum 0.01 past ω_opt, which is what
         runstagetests caught. At twelve (m = 1024) the bias is under 10⁻³ and the
         located ω agrees with Young to four figures. The curve keeps eight
         because a 10⁻³ error on a 0…1.35 axis is a tenth of a pixel. */
      const rhoAt = ww => { const IM = nlIterMatrix(A, 'sor', ww); return IM ? nlRhoGelfand(IM.G, 12) : Infinity; };
      let lo = wCurve[Math.max(0, bi - 1)].w, hi = wCurve[Math.min(wCurve.length - 1, bi + 1)].w;
      const phi = (Math.sqrt(5) - 1) / 2;
      let c = hi - phi * (hi - lo), d = lo + phi * (hi - lo);
      let fc = rhoAt(c), fd = rhoAt(d);
      for(let it = 0; it < 24 && hi - lo > 1e-6; it++){
        if(fc < fd){ hi = d; d = c; fd = fc; c = hi - phi * (hi - lo); fc = rhoAt(c); }
        else { lo = c; c = d; fc = fd; d = lo + phi * (hi - lo); fd = rhoAt(d); }
      }
      const bw = fc < fd ? c : d;
      const best = { w:bw, rho:Math.min(fc, fd) };
      const muJ = rho.jacobi;
      const ordered = !!NL_ITER[st.key].ordered;
      const diag = A.map((r, i) => Math.abs(r[i]) - r.reduce((s, v, j) => s + (j === i ? 0 : Math.abs(v)), 0));
      return { A, n, b, xTrue, sweeps, w, runs, rho, fit, wCurve, best, muJ, ordered,
               wOpt:ordered ? nlSorOpt(muJ) : NaN, rhoOpt:ordered ? nlSorRho(muJ) : NaN,
               dominant:diag.every(v => v > 0), diag,
               powerJ:(() => { const IM = nlIterMatrix(A, 'jacobi', 1); return IM ? nlRhoPower(IM.G) : { rho:NaN, drift:NaN }; })() };
    });
  },
  controls(){
    const st = ST, E = NL_ITER[st.key], N = this.cur(st);
    return ctSeg('nlIk', st.key, Object.keys(NL_ITER).map(k => [k, NL_ITER[k].n])) +
      (E.sizeable ? ctlRow('size n', ctlSlider('nlIn', 3, 30, 1, st.n)) : '') +
      ctlRow('ω for SOR', ctlSlider('nlIw', 0.2, 1.95, 0.01, st.w)) +
      ctlRow('sweeps', ctlSlider('nlIs', 5, 200, 5, st.sweeps)) +
      `<p class="help"><b>${E.n}.</b> ${E.why}</p>
      <p class="help">Every rate here is obtained twice. Once from <b>ρ(G)</b>, the spectral radius
      of the iteration matrix — computed by Gelfand's formula, which never asks for an eigenvector.
      And once from the run itself, by fitting a line to ln‖error‖ against the sweep number; that
      route sweeps the equations one at a time and never forms G at all. The readout prints both and
      the difference between them.</p>` +
      (N.ordered ? `<p class="help">Young's theorem applies to this matrix, so there is a third,
      closed-form answer: ω<sub>opt</sub> = ${fmtSig(N.wOpt, 6)} and ρ = ω<sub>opt</sub> − 1 =
      ${fmtSig(N.rhoOpt, 6)}. Slide ω onto it and watch the error curve tip over.</p>` :
      `<p class="help">This matrix is not consistently ordered, so Young's closed form for the best
      ω does not apply and the panel does not print one. The measured minimum of the ρ(ω) curve is
      still meaningful and is marked — an experiment is allowed where a theorem is not.</p>`);
  },
  wire(){
    ctWireSeg('nlIk', v => { ST.key = v; });
    wireSlider('nlIn', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
    wireSlider('nlIw', () => ST.w, v => { ST.w = v; }, v => 'ω = ' + fmtNum(v, 3));
    wireSlider('nlIs', () => ST.sweeps, v => { ST.sweeps = Math.round(v); }, v => Math.round(v) + ' sweeps');
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(52, z.h + 14);
    const half = Math.max(200, W * 0.55);
    /* left: the error, sweep by sweep, for all three */
    const P = mkPlot(74, top, half - 106, H - top - 58, 0, N.sweeps, -16, 2);
    plotFrame(ctx, P, 'sweep', 'log₁₀ ‖error‖', 'the error, and it may climb');
    ctGrid(ctx, P);
    const cols = { jacobi:TH.curl, gs:TH.pos, sor:TH.grad };
    Object.keys(NL_ITER_METHODS).forEach(k => {
      const pts = N.runs[k].hist.map(p => ({ x:p.k, y:Math.log10(Math.max(p.err, 1e-16)) }))
                               .filter(p => Number.isFinite(p.y));
      ctPath(ctx, P, pts, rgbCss(cols[k]), 2.2);
    });
    /* right: ρ against ω, with the measured minimum and Young's prediction */
    const Q = mkPlot(half + 24, top, W - half - 66, H - top - 58, 0.2, 1.95, 0, 1.35);
    plotFrame(ctx, Q, 'ω', 'ρ(G) for SOR', 'convergent below 1');
    ctGrid(ctx, Q);
    ctPath(ctx, Q, [{ x:0.2, y:1 }, { x:1.95, y:1 }], rgbCss(TH.neg, 0.8), 1.4, [4, 4]);
    ctPath(ctx, Q, N.wCurve.filter(p => Number.isFinite(p.rho)).map(p => ({ x:p.w, y:Math.min(1.35, p.rho) })),
           rgbCss(TH.grad), 2.4);
    ctDot(ctx, Q, N.best.w, Math.min(1.34, N.best.rho), 5, rgbCss(TH.pos), rgbCss(TH.bg));
    if(Number.isFinite(N.wOpt) && N.wOpt <= 1.95)
      ctPath(ctx, Q, [{ x:N.wOpt, y:0 }, { x:N.wOpt, y:1.35 }], rgbCss(TH.faint, 0.9), 1.4, [3, 3]);
    ctPath(ctx, Q, [{ x:N.w, y:0 }, { x:N.w, y:1.35 }], rgbCss(TH.line2), 1.2);
    stageNote(ctx, 'left: Jacobi in orange, Gauss–Seidel in green, SOR in blue   ·   ' +
              'right: the SOR radius against ω, with the measured minimum marked', W, H);
  },
  derive(st){
    const N = this.cur(st);
    return {
      title:'Why an iteration converges at the rate it does',
      steps:[
        drvStep('split the matrix and rearrange',
          `${dv('A')} ${dop('=')} ${dv('M')} ${dop('−')} ${dv('N')} ${dop('⇒')} ${dv('M')}${dv('x')}ₖ₊₁ ${dop('=')} ${dv('N')}${dv('x')}ₖ ${dop('+')} ${dv('b')}`,
          'the whole family is one line; the three methods differ only in what M is'),
        drvStep('subtract the fixed point and the right-hand side disappears',
          `${dv('e')}ₖ₊₁ ${dop('=')} ${dv('M')}⁻¹${dv('N')} ${dv('e')}ₖ ${dop('=')} ${dv('G')}${dv('e')}ₖ`,
          'so eₖ = Gᵏe₀, and b never appears again'),
        drvSay('which turns convergence into a question about powers of one matrix',
          'Gᵏ → 0 for every starting error exactly when the spectral radius ρ(G) is below 1. Not the norm — the radius. A matrix can have ‖G‖ > 1 and still converge, because a norm above 1 only means the error may GROW for a while, and the radius is what governs the eventual behaviour. That distinction is why the error curves on the left can climb before they fall.'),
        drvStep('the asymptotic rate is that radius, measured two ways',
          `‖${dv('e')}ₖ‖ ${dop('∼')} ρ(${dv('G')})ᵏ`,
          `Jacobi: ρ(G) = ${fmtSig(N.rho.jacobi, 6)} against ${fmtSig(N.fit.jacobi.rate, 6)} fitted to the run — ${fmtAgree(N.rho.jacobi, N.fit.jacobi.rate)}`),
        drvSay('the radius is computed without ever finding an eigenvector',
          'Gelfand\'s formula says ‖Gᵐ‖^(1/m) → ρ(G) for any norm at all. Squaring G ten times reaches m = 1024, and the answer is read off the logarithm of the norm — with a second difference taken to remove the polynomial factor that the m-th root would otherwise leave behind. The alternative, a power iteration, is right only when the dominant eigenvalue is real and simple, and it fails silently when it is a complex pair, so it is kept here as a cross-check rather than as the answer.'),
        drvStep('over-relaxation: take the Gauss–Seidel step and go further',
          `${dv('x')}ᵢ ${dop('←')} (1 ${dop('−')} ω)${dv('x')}ᵢ ${dop('+')} ω${dv('x')}ᵢ<sup>GS</sup>`,
          `at ω = ${fmtNum(N.w, 3)} the radius is ${fmtSig(N.rho.sor, 6)}; the best on the ω grid is ${fmtSig(N.best.rho, 6)} at ω = ${fmtSig(N.best.w, 4)}`),
        drvSay('and for a consistently ordered matrix the best ω is known in closed form',
          N.ordered
            ? `Young's theorem gives ω_opt = 2/(1 + √(1 − μ²)) with μ the Jacobi radius, and ρ(SOR) = ω_opt − 1 there. Here that is ω_opt = ${fmtSig(N.wOpt, 6)} against a minimum located by golden section on the measured ρ(ω) curve at ${fmtSig(N.best.w, 6)}, and a predicted radius of ${fmtSig(N.rhoOpt, 6)}. The gain is not marginal: Gauss–Seidel needs O(n²) sweeps on this matrix and SOR at the optimum needs O(n).`
            : 'Young\'s theorem needs the matrix to be consistently ordered, and this one is not, so no closed form is printed for it. The measured minimum of the ρ(ω) curve is still the right answer to "which ω is best here" — it is simply an experimental answer rather than a theorem, and the panel says which it has.'),
        drvSay('a sharp edge worth knowing about the optimum',
          'The ρ(ω) curve is not symmetric. To the left of the optimum it rises gently; to the right it rises as a straight line ω − 1 and reaches 1 at ω = 2, where the iteration stops converging at all. So an ω guessed slightly too large costs far more than one guessed slightly too small, and every practical recommendation errs low for that reason alone.'),
        drvSay('finally, what diagonal dominance is and is not',
          'Strict diagonal dominance guarantees both Jacobi and Gauss–Seidel converge. It is sufficient and it is not necessary, and the two 3×3 presets show the implication failing in both directions: one where Jacobi finishes in three sweeps and Gauss–Seidel diverges, and one the other way round. "Gauss–Seidel is Jacobi, only faster" is a rule of thumb with counterexamples small enough to print.')
      ],
      note:'Every rate on this stage appears twice — from the spectrum of a matrix the run never ' +
           'builds, and from a run that never looks at a spectrum — and the two are compared rather ' +
           'than the theorem being quoted.'
    };
  },
  readout(st){
    const N = this.cur(st);
    const row = k => {
      const r = N.runs[k], f = N.fit[k];
      const hit = r.hist.find(p => p.err < 1e-8);
      return kv(NL_ITER_METHODS[k],
        'ρ(G) ' + fmtSig(N.rho[k], 5) +
        '   ·   measured ' + (Number.isFinite(f.rate) ? fmtSig(f.rate, 5) : 'no usable stretch') +
        '   ·   ' + (hit ? hit.k + ' sweeps to 10⁻⁸' : (r.diverged ? 'diverges' : 'not there yet')));
    };
    return `<div class="card tight"><div class="ttl">The three iterations</div>
      ${Object.keys(NL_ITER_METHODS).map(row).join('')}
      <p class="help">SOR is run at the ω on the slider, which is why it can be the worst of the
      three as easily as the best. ω = 1 makes it Gauss–Seidel exactly.</p>
    </div>
    <div class="card tight"><div class="ttl">Predicted against measured</div>
      ${Object.keys(NL_ITER_METHODS).map(k => kv(NL_ITER_METHODS[k],
        Number.isFinite(N.fit[k].rate) ? fmtAgree(N.rho[k], N.fit[k].rate)
                                       : 'the run never entered the stretch a rate can be fitted over')).join('')}
      ${kv('Jacobi ρ by power iteration', N.powerJ.drift > 1e-4
          ? fmtSig(N.powerJ.rho, 6) + '   ·   <span style="color:var(--c-warn)">it did not settle — ' +
            'the ratio is still moving by ' + fmtSig(N.powerJ.drift, 3) + ' per step, so this route ' +
            'has no answer here</span>'
          : fmtSig(N.powerJ.rho, 6) + '   ·   ' + fmtAgree(N.powerJ.rho, N.rho.jacobi))}
      <p class="help">Three routes to one number: Gelfand's formula on the iteration matrix, a power
      iteration on the same matrix, and a straight-line fit to the error history of a run that never
      forms it. The fit is the loosest of the three, because it is measuring an asymptotic rate over
      a finite stretch and the transient has not entirely died.</p>
      ${N.powerJ.drift > 1e-4 ? `<p class="help">The power iteration has failed on this matrix, and
      the panel says so rather than printing the number it stopped at. That is its known failure
      mode: it converges to the dominant eigenvalue when that eigenvalue is real and simple, and when
      the dominant pair is <b>complex</b> the ratio ‖Gv‖/‖v‖ oscillates forever instead of settling.
      Gelfand's formula has no such restriction, which is why it is the route the rest of the stage
      uses and this one is only a cross-check. A cross-check that quietly disagrees is worse than no
      cross-check, so it reports its own drift and withholds its answer.</p>` : ''}
    </div>
    <div class="card tight"><div class="ttl">Over-relaxation</div>
      ${kv('ω on the slider', fmtNum(N.w, 4))}
      ${kv('best ω, found by golden section on ρ(ω)', fmtSig(N.best.w, 6) + '  with ρ = ' + fmtSig(N.best.rho, 6))}
      ${N.ordered ? kv('Young\'s closed form', 'ω_opt = ' + fmtSig(N.wOpt, 6) +
                       ',  ρ = ω_opt − 1 = ' + fmtSig(N.rhoOpt, 6)) : ''}
      ${N.ordered ? kv('the grid minimum against the closed form', fmtAgree(N.best.w, N.wOpt)) : ''}
      ${N.ordered ? '' : '<p class="help">Not consistently ordered, so Young\'s formula does not apply here and none is printed. The grid minimum is a measurement and stands on its own.</p>'}
      ${kv('ρ(GS) against ρ(Jacobi)²', N.ordered
          ? fmtAgree(N.rho.gs, N.rho.jacobi * N.rho.jacobi)
          : fmtSig(N.rho.gs, 5) + ' and ' + fmtSig(N.rho.jacobi * N.rho.jacobi, 5) +
            ' — not compared, because Young\'s identity needs a consistently ordered matrix and ' +
            'this one is not')}
    </div>
    <div class="card tight"><div class="ttl">Diagonal dominance</div>
      ${kv('strictly diagonally dominant?', N.dominant
          ? 'yes — both Jacobi and Gauss–Seidel are guaranteed'
          : 'no — the guarantee says nothing, which is not the same as failure')}
      ${kv('smallest row margin |aᵢᵢ| − Σ|aᵢⱼ|', fmtSig(Math.min(...N.diag), 4))}
      <p class="help">A sufficient condition tells you nothing when it fails. Two of the presets
      here are not dominant: on one, Jacobi converges in three sweeps and Gauss–Seidel diverges; on
      the other, exactly the reverse. Both facts are read off ρ(G) and confirmed by running.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    const worst = N.rho.jacobi, gs = N.rho.gs;
    return `<div class="k">n = ${N.n}</div>
      <div style="color:var(--c-${worst < 1 ? 'pos' : 'neg'})">ρ Jacobi ${fmtSig(worst, 4)}</div>
      <div style="color:var(--c-${gs < 1 ? 'pos' : 'neg'})">ρ GS ${fmtSig(gs, 4)}</div>`;
  },
  legend(){
    return [['var(--c-curl)', 'Jacobi'], ['var(--c-pos)', 'Gauss–Seidel'],
            ['var(--c-grad)', 'SOR at the chosen ω'], ['var(--c-neg)', 'ρ = 1, the divergence line']];
  },
  dockLegend:true
};

/* ============================================================================
   3 · Krylov
   ============================================================================ */
STAGES.nlKrylov = {
  title:'Conjugate gradients, and why √κ is the number that matters',
  enter(st, o){
    st.n = o.n === undefined ? 20 : o.n;
    st.steps = o.steps || 60;
    st.showBounds = o.showBounds !== false;
  },
  cur(st){
    const n = Math.max(4, Math.min(40, Math.round(st.n)));
    const steps = Math.max(5, Math.min(200, Math.round(st.steps)));
    return nlCache(st, n + '|' + steps + '|' + st.showBounds, () => {
      const A = nlPoisson(n);
      const xTrue = Array.from({ length:n }, (_, i) => Math.cos(0.7 * i));
      const b = laMatVec(A, xTrue);
      const CG = nlCG(A, b, steps, null, xTrue);
      const SD = nlSteepest(A, b, steps, null, xTrue);
      const GS = nlIterate(A, b, 'gs', 1, steps, null, xTrue);
      const kap = nlPoissonCond(n);
      const kapMeas = nlCond2(A);
      const to = (h, tol) => { const p = h.find(q => q.err < tol); return p ? p.k : null; };
      /* the bound must be checked, not drawn and trusted: the largest amount by
         which any step exceeds it, relative to the bound itself */
      let over = 0;
      CG.hist.forEach(p => { if(p.k > 0) over = Math.max(over, p.err / nlCGBound(kap, p.k) - 1); });
      /* Monotonicity is a theorem about the A-norm error, and it stops being
         measurable once that error is round-off: after finite termination the
         iterates differ by noise about the exact answer, and the noise can rise.
         The first version of this checked every step and reported "no — and that
         would be a defect" on every size, which is a gate reporting its own
         floor. Found by runstagetests. */
      let mono = true, roseAt = 0;
      for(let i = 1; i < CG.hist.length; i++){
        if(!(CG.hist[i - 1].err > 1e-13)) break;
        if(CG.hist[i].err > CG.hist[i - 1].err * (1 + 1e-9)){ mono = false; roseAt = i; break; }
      }
      /* "steps to 10⁻⁶" is the wrong comparison for steepest descent, because on
         this matrix it does not GET there: at n = 12 the bound needs 470 steps
         and the slider stops at 200, so the row read "more than 80" at every
         size and the ratio beside it was never defined. Compare the other way
         round instead — how many CG steps it takes to reach the error steepest
         descent has at the END of its run — which is always measurable and is
         the quantity a reader actually wants. */
      const matchAt = target => {
        const p = CG.hist.find(q => q.err <= target);
        return p ? p.k : null;
      };
      const sdEnd = SD.hist[SD.hist.length - 1].err;
      const gsEnd = GS.hist[GS.hist.length - 1].err;
      /* STEPS PER DECADE is the comparison that actually measures the advantage,
         and the two obvious ones do not. "Steps to 10⁻⁶" is undefined for
         steepest descent at every size this stage runs. "How many CG steps match
         where steepest descent finished" looked promising and is confounded:
         it divides by how far steepest descent happened to get, so it read 12×
         at n = 10 and 4.6× at n = 36 — SHRINKING, because the larger problem
         left steepest descent barely started. Rate per step is free of both
         defects: SD's is ~(κ−1)/(κ+1), so its decades go like κ, while CG
         reaches round-off in n steps, so its decades go like n — and the ratio
         grows like κ/n ~ n, which is what "√κ against κ" means here. */
      const perDecade = h => {
        const f = nlRateFit(h, 1e-14, 0.9);
        return (f.rate > 0 && f.rate < 1) ? Math.LN10 / -Math.log(f.rate) : NaN;
      };
      /* An ASYMPTOTIC rate has to be fitted where the method is asymptotic. Over
         the sixty or eighty steps this stage plots, steepest descent on a large
         n is still in its opening transient — the first few steps of any descent
         method are fast — and a fit there returned nearly the same rate at
         n = 10 and n = 36, so the measured advantage came out SHRINKING. The
         rate runs below are separate and longer, plotted by nothing; the drawn
         curves are unaffected. */
      const longSteps = Math.min(2500, Math.max(steps, 60 * n));
      const SDrate = nlSteepest(A, b, longSteps, null, xTrue);
      const GSrate = nlIterate(A, b, 'gs', 1, longSteps, null, xTrue);
      const decCG = perDecade(CG.hist), decSD = perDecade(SDrate.hist), decGS = perDecade(GSrate.hist);
      return { A, n, steps, CG, SD, GS, kap, kapMeas, over, mono, roseAt,
               decCG, decSD, decGS, advantage:decSD / decCG,
               kCG:to(CG.hist, 1e-6), sdEnd, gsEnd, matchSD:matchAt(sdEnd),
               atN:CG.hist[Math.min(n, CG.hist.length - 1)] };
    });
  },
  controls(){
    const st = ST;
    return ctlRow('size n', ctlSlider('nlKn', 4, 40, 1, st.n)) +
      ctlRow('steps', ctlSlider('nlKs', 5, 200, 5, st.steps)) +
      ctChk('nlKb', 'draw the two bounds', st.showBounds) +
      `<p class="help">The matrix is the 1-D Poisson operator, whose condition number is known in
      closed form — cot²(π/2(n+1)), growing like n². That matters here because both bounds on the
      plot are written in terms of κ, so a κ obtained by measurement would leave the comparison
      arguing with itself.</p>
      <p class="help">The vertical quantity is the error in the <b>A-norm</b>, √(eᵀAe), and not the
      ordinary length. That is not a flourish: it is the norm conjugate gradients minimises at every
      step, and the only one its bound is proved in. Plotting a 2-norm against a bound proved for
      the A-norm would be comparing two different quantities and calling the difference a result.</p>`;
  },
  wire(){
    wireSlider('nlKn', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
    wireSlider('nlKs', () => ST.steps, v => { ST.steps = Math.round(v); }, v => Math.round(v) + ' steps');
    ctWireChk('nlKb', v => { ST.showBounds = v; });
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(52, z.h + 14);
    const P = mkPlot(80, top, W - 132, H - top - 58, 0, N.steps, -16, 1);
    plotFrame(ctx, P, 'step', 'log₁₀ (A-norm error ÷ starting error)',
              'conjugate gradients against steepest descent');
    ctGrid(ctx, P);
    const draw = (hist, col, w, dash) => {
      const pts = hist.map(p => ({ x:p.k, y:Math.log10(Math.max(p.err, 1e-16)) }))
                      .filter(p => Number.isFinite(p.y));
      ctPath(ctx, P, pts, col, w, dash);
    };
    draw(N.GS.hist, rgbCss(TH.dim, 0.8), 1.6);
    draw(N.SD.hist, rgbCss(TH.curl), 2.2);
    draw(N.CG.hist, rgbCss(TH.pos), 2.6);
    if(st.showBounds){
      const bnd = (f, col) => {
        const pts = [];
        for(let k = 0; k <= N.steps; k++){
          const v = f(k);
          if(v > 0) pts.push({ x:k, y:Math.max(-16, Math.log10(v)) });
        }
        ctPath(ctx, P, pts, col, 1.4, [5, 4]);
      };
      bnd(k => nlCGBound(N.kap, k), rgbCss(TH.pos, 0.6));
      bnd(k => nlSDBound(N.kap, k), rgbCss(TH.curl, 0.6));
    }
    /* the n-th step, where CG is finished in exact arithmetic */
    if(N.n <= N.steps){
      ctPath(ctx, P, [{ x:N.n, y:-16 }, { x:N.n, y:1 }], rgbCss(TH.faint, 0.9), 1.3, [3, 3]);
      ctText(ctx, P.X(N.n) + 4, P.Y(0.6), 'step n', rgbCss(TH.faint), '10px ' + FONT_UI, 'left', 'top');
    }
    stageNote(ctx, 'κ = ' + fmtSig(N.kap, 4) + '   ·   √κ = ' + fmtSig(Math.sqrt(N.kap), 4) +
              '   ·   CG reaches 10⁻⁶ in ' + (N.kCG === null ? 'more than ' + N.steps : N.kCG) +
              ' steps; steepest descent is still at ' + fmtSig(N.sdEnd, 3) + ' after ' + N.steps, W, H);
  },
  derive(st){
    const N = this.cur(st);
    return {
      title:'What conjugate gradients is minimising, and over what',
      steps:[
        drvSay('for a symmetric positive definite A, solving is minimising',
          'The quadratic φ(x) = ½xᵀAx − bᵀx has gradient Ax − b, so its one stationary point is the solution, and positive definiteness makes that point a minimum. Solving a linear system and rolling to the bottom of a bowl are the same problem written two ways — and every method below is a way of rolling downhill.'),
        drvStep('steepest descent takes the downhill direction, exactly',
          `${dv('x')}ₖ₊₁ ${dop('=')} ${dv('x')}ₖ ${dop('+')} α${dv('r')}ₖ, α chosen to minimise along ${dv('r')}ₖ`,
          `after ${N.steps} steps it is still at ${fmtSig(N.sdEnd, 3)} of its starting error, and CG reached that at step ${N.matchSD === null ? '— it did not' : N.matchSD}`),
        drvSay('and that is exactly why it is slow',
          'Minimising along a line makes the new residual perpendicular to the old direction — so the next step undoes part of the previous one. In a long thin bowl the path zig-zags across the valley instead of running along it, and the number of steps goes like κ. The picture everyone draws of this is not a caricature; it is what the arithmetic does.'),
        drvStep('conjugate gradients minimises over everything it has seen',
          `${dv('x')}ₖ minimises φ over ${dv('x')}₀ ${dop('+')} span{${dv('r')}₀, ${dv('A')}${dv('r')}₀, …, ${dv('A')}ᵏ⁻¹${dv('r')}₀}`,
          'the Krylov subspace — and the minimum is over the whole of it, not along one line'),
        drvSay('which is a far stronger promise for the same work per step',
          'Each step costs one matrix–vector product, the same as steepest descent. But the search space grows by a dimension each time, so no step can undo an earlier one: the error in the A-norm falls at every step, monotonically, and the method never has to revisit a direction. Three-term recurrences are what make this possible in fixed storage — the new direction only needs the previous one, which is the small miracle of the algorithm.'),
        drvStep('the bound, and where the square root comes from',
          `‖${dv('e')}ₖ‖<sub>A</sub> ${dop('≤')} 2 (${dfrac('√κ ' + '− 1', '√κ ' + '+ 1')})ᵏ ‖${dv('e')}₀‖<sub>A</sub>`,
          `largest overshoot measured over ${N.steps} steps: ${fmtGap(Math.max(0, N.over), 1)} of the bound`),
        drvSay('and the √κ is a Chebyshev polynomial, not an accident',
          'The error after k steps is p(A)e₀ for some polynomial p of degree k with p(0) = 1, and CG picks the best such polynomial automatically. Bounding the best by the Chebyshev polynomial on the interval [λ_min, λ_max] gives the factor above — and Chebyshev polynomials grow fastest outside the interval they are small on, which is where the square root comes from. Steepest descent is the same estimate restricted to degree one at every step, and gets κ instead.'),
        drvSay('and then the measurement overrules the bound, which is worth knowing',
          'On this matrix CG does far better than its own bound: at n = ' + N.n +
          ' the bound at step n is ' + fmtSig(nlCGBound(N.kap, N.n), 3) + ' and the error is ' +
          fmtSig(N.atN.err, 3) + ', a factor of ' +
          fmtSig(nlCGBound(N.kap, N.n) / Math.max(N.atN.err, 1e-300), 3) +
          '. That is not the bound being wrong — the readout checks every step against it and none is outside — it is the bound being written in terms of one number, κ, when CG responds to the whole spectrum. The Chebyshev estimate assumes the eigenvalues could be anywhere in [λ_min, λ_max]; here they are spread evenly through it, and the polynomial CG actually finds can put a root near each of them. That effect is called superlinear convergence, and it is why CG is used on problems whose κ would make the bound look hopeless. A bound is a promise about the worst spectrum, not a prediction about yours.'),
        drvStep('and in exact arithmetic it stops',
          `${dv('e')}ₙ ${dop('=')} 0 after at most ${dv('n')} steps`,
          `here the error at step n is ${fmtSig(N.atN.err, 4)} of the starting error`),
        drvSay('which is true and is not how anyone uses it',
          'Finite termination follows from the search space filling ℝⁿ, so CG is technically a direct method. Nobody runs it that way: n steps of CG cost more than an LU factorisation, and in floating point the orthogonality it depends on degrades, so the exact termination is not exact. What makes it the workhorse of large-scale computing is the other property — a good ANSWER long before step n, in a number of steps set by √κ rather than by n, with nothing stored but a few vectors and no need for the matrix itself, only the ability to multiply by it.'),
        drvSay('which is also why preconditioning is the whole game in practice',
          'Every improvement available is an improvement in κ. Solve M⁻¹Ax = M⁻¹b instead, with M something cheap that resembles A, and the count falls like the square root of the new condition number. That is why the literature on large sparse systems is overwhelmingly about preconditioners and hardly at all about the iteration, which has not changed since 1952.')
      ],
      note:'The two dashed curves are the bounds, drawn from κ alone with no knowledge of the runs. ' +
           'Both are upper bounds and neither is tight: the point is the SLOPE, which differs by a ' +
           'square root, and the readout measures the ratio of steps rather than reading it off.'
    };
  },
  readout(st){
    const N = this.cur(st);
    return `<div class="card tight"><div class="ttl">The matrix</div>
      ${kv('size', N.n + ' × ' + N.n + ', the 1-D Poisson operator')}
      ${kv('κ from the closed form', fmtSig(N.kap, 6))}
      ${kv('κ from the singular values', fmtSig(N.kapMeas, 6))}
      ${kv('the two, compared', fmtAgree(N.kap, N.kapMeas))}
      ${kv('√κ', fmtSig(Math.sqrt(N.kap), 6))}
      <p class="help">κ grows like n², so √κ grows like n — which is the statement that CG needs a
      number of steps proportional to the number of grid points in one direction, however many
      dimensions the grid has. That is the reason it is used.</p>
    </div>
    <div class="card tight"><div class="ttl">How far each one got in ${N.steps} steps</div>
      ${kv('conjugate gradients', 'reached 10⁻⁶ at step ' +
          (N.kCG === null ? '— it did not, in ' + N.steps : N.kCG))}
      ${kv('steepest descent', 'still at ' + fmtSig(N.sdEnd, 3) + ' after ' + N.steps + ' steps')}
      ${kv('Gauss–Seidel, for scale', 'still at ' + fmtSig(N.gsEnd, 3))}
      ${kv('CG steps to match that steepest-descent result',
          N.matchSD === null ? 'not reached within this run' : String(N.matchSD))}
      ${kv('steps per decade of error — CG', fmtSig(N.decCG, 4))}
      ${kv('… steepest descent', fmtSig(N.decSD, 4))}
      ${kv('… the ratio', fmtSig(N.advantage, 4) + '×')}
      <p class="help">Steepest descent does not reach 10⁻⁶ within any number of steps this stage
      will run — at n = 12 its own bound needs about 470 — so the comparison is made by <b>rate</b>
      rather than by a finish line neither method shares. Steps per decade is fitted to each method's own history, over a longer run than the one drawn — the first few steps of any descent method are fast, and an asymptotic rate has to be fitted where the method is asymptotic: steepest descent needs a number proportional to κ, conjugate gradients one
      proportional to n, and the ratio therefore climbs as the problem grows. Raise the size slider
      and watch it. Comparing where each one <i>got to</i> instead gives the opposite answer, because
      a bigger problem leaves steepest descent less far along — which is a measurement of the run
      length rather than of the method.</p>
    </div>
    <div class="card tight"><div class="ttl">Against the bounds</div>
      ${kv('largest CG overshoot of its bound', fmtGap(Math.max(0, N.over), 1) +
          (N.over <= 0 ? ' — no step exceeds it' : ''))}
      ${kv('CG error at step n', fmtSig(N.atN.err, 4) +
          (N.atN.err < 1e-10 ? ' — finite termination, as the theory says' : ''))}
      ${kv('bound at step n, for comparison', fmtSig(nlCGBound(N.kap, N.n), 4) +
          ' — CG beats its own bound by ' +
          fmtSig(nlCGBound(N.kap, N.n) / Math.max(N.atN.err, 1e-300), 3) + '×')}
      ${kv('monotone in the A-norm?', N.mono
          ? 'yes — it falls at every step, down to round-off'
          : 'no, it rose at step ' + N.roseAt + ' while still above round-off — and that is a defect')}
      <p class="help">The bound is checked rather than illustrated. Every step of every run is
      compared against 2((√κ−1)/(√κ+1))ᵏ, and the largest amount by which any step exceeds it is
      printed above; a positive number there would mean either the bound or the implementation is
      wrong. Monotonicity is checked the same way, because it is a theorem about the A-norm and not
      about the residual — the residual is <i>not</i> monotone, and that is a real distinction rather
      than a technicality.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">n = ${N.n}</div>
      <div style="color:var(--c-pos)">CG ${N.kCG === null ? '>' + N.steps : N.kCG} steps</div>
      <div style="color:var(--c-dim)">√κ = ${fmtSig(Math.sqrt(N.kap), 3)}</div>`;
  },
  legend(){
    return [['var(--c-pos)', 'conjugate gradients'], ['var(--c-curl)', 'steepest descent'],
            ['var(--c-dim)', 'Gauss–Seidel'], ['var(--faint)', 'the two bounds, dashed']];
  },
  dockLegend:true
};
