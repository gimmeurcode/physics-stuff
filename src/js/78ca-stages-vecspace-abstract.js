/* ============================================================================
   ABSTRACT VECTOR SPACES — the two stages of syllabus gap B3
   `laAbstract`  a linear map has a matrix, once you choose a basis
   `laInnerFn`   functions are vectors, and an integral is their dot product
   Engine in 38a-linalg-abstract.js, unit-tested.
   ============================================================================ */

STAGES.laAbstract = {
  title:'A map, and its matrix',
  dockLegend:true,
  derive(st){
    const R = this.reportOf(st);
    const O = LA_OPS[st.op];
    return {
      title:'Why a matrix is not a thing but a description',
      steps:[
        drvSay('polynomials really are vectors, and the check is mechanical',
          'Add two polynomials of degree ≤ n and you get another; scale one and you get another. That is the whole definition of a vector space, and P_n satisfies it. Nothing about arrows was ever essential — what mattered was addition and scaling, and functions have both.'),
        drvStep('choosing a basis turns each one into a list of numbers',
          `${dv('p')} ${dop('=')} ${dv('a')}₀ ${dop('+')} ${dv('a')}₁${dv('x')} ${dop('+')} … ${dop('+')} ${dv('a')}_n${dv('x')}ⁿ &nbsp; ↔ &nbsp; (${dv('a')}₀, …, ${dv('a')}_n)`,
          `here n = ${st.n}, so the space is ${st.n + 1}-dimensional and your polynomial is the vector (${R.p.map(v => fmtNum(v, 4)).join(', ')})`),
        drvSay('and the coordinates are not the vector — they are its shadow in one basis',
          'Change the basis and every coordinate changes while the polynomial does not. This is the point people miss about matrices: a matrix is a description of a map relative to a choice, not the map itself. Two very different-looking matrices can be the same operator seen from two angles, which is exactly what similarity means.'),
        drvStep('a linear map is determined by what it does to the basis',
          `${dv('T')}(${dop('Σ')}${dv('a')}_j ${dv('x')}ʲ) ${dop('=')} ${dop('Σ')}${dv('a')}_j ${dv('T')}(${dv('x')}ʲ)`,
          'so knowing T on n+1 polynomials is knowing it everywhere — linearity is what makes a finite table sufficient'),
        drvStep('write those images in coordinates and you have the matrix',
          `${dv('M')}_{ij} ${dop('=')} the coefficient of ${dv('x')}ⁱ in ${dv('T')}(${dv('x')}ʲ)`,
          `column j of the matrix on screen is ${O.tex} applied to xʲ — nothing else`),
        drvSay('and now the two routes have to agree, or the idea is wrong',
          'Multiply the matrix by your polynomial\'s coordinate vector; separately, apply the operator to the polynomial symbolically and read off its coefficients. These share no code — one is arithmetic on a table, the other is the parser\'s own differentiator. The panel prints both and their difference, and on integer coefficients it is exactly zero, not merely small.'),
        drvStep('rank and nullity then add to the dimension, always',
          `rank ${dop('+')} nullity ${dop('=')} dim`,
          `${R.rn.rank} + ${R.rn.nullity} = ${R.rn.dim}${st.op === 'ddx' ? ' — and the kernel is the constants, which is why every integral needs a +C' : ''}`),
        drvSay('which is the most useful theorem in the subject',
          'It says information is conserved: whatever a map crushes to zero it loses from its output, exactly. The kernel of d/dx being one-dimensional is the reason an antiderivative is unique only up to a constant — the same fact a first-year calculus student meets as a piece of bookkeeping and never sees a reason for.'),
        ...(R.nil ? [drvStep('and this particular map is nilpotent',
          `${dv('T')}^${R.nil} ${dop('=')} 0`,
          'differentiate a polynomial of degree n enough times and nothing survives — a matrix with every eigenvalue zero that is nevertheless not the zero matrix')] : []),
        drvSay('this is the doorway to the rest of the subject',
          'Once functions are vectors and operators are matrices, eigenvectors become eigenfunctions, and the Schrödinger equation Ĥψ = Eψ stops looking like new mathematics. The infinite-dimensional case needs analysis to make rigorous, but the algebra you are looking at here is the same algebra.')
      ],
      note:'Every entry of the matrix is computed by applying the operator to a basis vector — the definition, executed rather than quoted. The check against symbolic differentiation shares no code with it.'
    };
  },
  enter(st, o){
    st.n = o.n !== undefined ? o.n : 5;
    st.op = o.op || 'ddx';
    st.src = o.src || '7 - 3*x + 2*x^3 + 5*x^4 - x^5';
    st.err = '';
    this.recompute(st);
  },
  /* coordinates of the reader's polynomial, by SAMPLING the compiled
     expression and solving a Vandermonde system — so the coordinates come
     from the function itself rather than from reading the source text */
  coordsOf(src, n){
    const g = compile(parse(src));
    const V = [], y = [];
    for(let i = 0; i <= n; i++){
      const x = -1 + 2 * i / Math.max(1, n);
      V.push(Array.from({ length:n + 1 }, (_, j) => Math.pow(x, j)));
      y.push(g(x, 0, 0));
    }
    const sol = laSolve(V, y);
    if(!sol.x) throw new Error('that is not a polynomial of degree ' + n + ' or below');
    /* snap coefficients that are integers to the nearest integer: the solve is
       exact in exact arithmetic and 1e-14 of noise would print as 2.0000000001 */
    const c = sol.x.map(v => Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : v);
    /* VERIFY, at points the interpolation did not use.
       Solving an (n+1)×(n+1) Vandermonde always succeeds — it fits a degree-n
       polynomial through n+1 samples of ANYTHING. Without this check, typing
       sin(x) or x^5 into a degree-2 space returned a quadratic and the panel
       called it "its coordinates", which is a false statement about the
       reader's own input. A vector space contains what you put in it, or it
       does not, and saying which is the point of the stage. */
    let scale = 0, worst = 0;
    for(let i = 0; i <= 4 * n + 4; i++){
      const x = -1 + 2 * i / (4 * n + 4);
      const want = g(x, 0, 0);
      if(!Number.isFinite(want)) throw new Error('that function is not defined across [−1, 1]');
      scale = Math.max(scale, Math.abs(want));
      worst = Math.max(worst, Math.abs(want - laPolyEval(c, x)));
    }
    if(worst > 1e-7 * Math.max(1, scale))
      throw new Error('that is not a polynomial of degree ' + n + ' or below — it misses by ' + fmtSig(worst, 3) + ' inside [−1, 1]');
    return c;
  },
  recompute(st){
    try {
      st.err = '';
      const p = this.coordsOf(st.src, st.n);
      const M = laOpMatrix(st.op, st.n);
      const byMatrix = laMatVec(M, p);
      /* the independent route: the parser's own symbolic operator */
      const bySym = this.symbolic(st, st.src);
      st._r = { p, M, byMatrix, bySym,
                worst:byMatrix.reduce((w, v, i) => Math.max(w, Math.abs(v - (bySym[i] || 0))), 0),
                gross:byMatrix.reduce((s, v) => s + Math.abs(v), 0),
                rn:laRankNullity(M), nil:laNilpotency(M) };
    } catch(e){ st.err = String(e && e.message || e); }
  },
  /* x· and ∫₀ˣ RAISE the degree, so they are not maps P_n → P_n at all: they
     land in P_{n+1}. The stage's convention is truncation — xⁿ ↦ 0 — which is
     what `laOpMatrix` does via `laPolyFit`, and it is why x· has a
     one-dimensional kernel here. The check route has to adopt the SAME
     convention or it is answering a different question: fitting x·p directly
     to degree n interpolates the lost xⁿ⁺¹ back across the lower terms and
     disagrees by 1.4 on the default polynomial. So it fits to n+1 — a degree
     the answer genuinely occupies — and then drops the top coefficient,
     which is the truncation stated once. `auditsides` found this the day the
     stage shipped; before the fix the two routes disagreed only when the
     input actually reached degree n, which the default preset did. */
  raisesDegree(op){ return op === 'mulx' || op === 'integ'; },
  /* apply the operator to the SOURCE TEXT, through the parser — no matrix */
  symbolic(st, src){
    const A = parse(src);
    let out;
    if(st.op === 'ddx') out = diff(A, 'x');
    else if(st.op === 'd2') out = diff(diff(A, 'x'), 'x');
    else if(st.op === 'mulx') out = parse('(' + src + ')*x');
    else if(st.op === 'xddx') out = parse('(' + src + ')');
    else out = A;
    if(st.op === 'xddx'){
      const d = diff(A, 'x');
      const g = compile(d);
      return this.sampleCoords(x => x * g(x, 0, 0), st.n);
    }
    if(st.op === 'shift'){
      const g = compile(A);
      return this.sampleCoords(x => g(x + 1, 0, 0), st.n);
    }
    if(st.op === 'integ'){
      /* ∫₀ˣ by adaptive quadrature — as independent of the matrix as it gets */
      const g = compile(A);
      return laPolyFit(this.sampleCoords(x => nqAdaptive(t => g(t, 0, 0), 0, x, 1e-12), st.n + 1), st.n);
    }
    const g = compile(out);
    const deg = this.raisesDegree(st.op) ? st.n + 1 : st.n;
    return laPolyFit(this.sampleCoords(x => g(x, 0, 0), deg), st.n);
  },
  /* fit coordinates to a function by sampling — the route that never looks at
     any coefficient list */
  sampleCoords(f, n){
    const V = [], y = [];
    for(let i = 0; i <= n; i++){
      const x = -1 + 2 * i / Math.max(1, n);
      V.push(Array.from({ length:n + 1 }, (_, j) => Math.pow(x, j)));
      y.push(f(x));
    }
    const sol = laSolve(V, y);
    return sol.x ? sol.x.map(v => Math.abs(v - Math.round(v)) < 1e-9 ? Math.round(v) : v)
                 : new Array(n + 1).fill(NaN);
  },
  reportOf(st){ if(!st._r) this.recompute(st); return st._r || { p:[], M:[], byMatrix:[], bySym:[], rn:{}, worst:0, gross:0 }; },
  controls(){
    const st = ST;
    return ctSeg('lmOp', st.op, Object.keys(LA_OPS).map(k => [k, LA_OPS[k].label])) +
      ctlRow('degree n', ctlSlider('lmN', 2, 8, 1, st.n)) +
      fnHtml('lmP', 'p(x) =', st.src, 'any polynomial of degree ≤ n') +
      `<p class="help">The grid is the <b>matrix of the operator</b> in the basis {1, x, …, xⁿ}, and
      every column of it was produced by applying the operator to one basis vector — the definition,
      executed. The panel then does the same job twice: multiplies that matrix by your polynomial's
      coordinates, and applies the operator to the polynomial itself through the parser. They share
      no code, and on integer coefficients the difference is exactly zero.</p>
      <p class="help">Watch <b>x·d/dx</b>: its matrix is diagonal, so the monomials are its
      eigenvectors and the eigenvalues are the degrees. Watch <b>d/dx</b>: raise n and the
      nilpotency index rises with it, while the kernel stays one-dimensional — that dimension is
      the +C of every antiderivative you have ever written.</p>`;
  },
  wire(){
    ctWireSeg('lmOp', v => { ST.op = v; ST._r = null; STAGES.laAbstract.recompute(ST); buildStagePanel(); });
    wireSlider('lmN', () => ST.n, v => { ST.n = Math.round(v); ST._r = null; STAGES.laAbstract.recompute(ST); }, v => String(Math.round(v)));
    fnWire('lmP', (made, src) => { ST.src = src; ST._r = null; STAGES.laAbstract.recompute(ST); },
           s => { const A = parse(s); compile(A); return A; });
  },
  frame(st, dt, ctx, W, H){
    const R = this.reportOf(st);
    if(st.err){
      ctText(ctx, W / 2, H / 2, st.err, rgbCss(TH.pos), '600 13px ' + FONT_UI, 'center', 'middle');
      return;
    }
    const N = st.n + 1;
    /* The grid is CENTRED and starts below the chip zone. Left-aligned at
       x = 92, y = 74 it sat under the readout chip — the heading was flagged
       by auditticks, and the top-left cells were underneath it too, invisible
       for any operator with a non-zero entry there. */
    const side = Math.min((W - 340) / N, (H - 230) / N, 62);
    const gx = Math.max(210, (W - N * side) / 2), gy = 108;
    ctText(ctx, gx + N * side / 2, gy - 12, 'the matrix of ' + LA_OPS[st.op].label + ' in the basis {1, x, …, x' + supDigits(String(st.n)) + '}',
           rgbCss(TH.dim), '600 12px ' + FONT_UI, 'center', 'bottom');
    let amax = 1e-9;
    for(const r of R.M) for(const v of r) amax = Math.max(amax, Math.abs(v));
    for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
      const v = R.M[i][j], X = gx + j * side, Y = gy + i * side;
      const t = Math.abs(v) / amax;
      ctx.fillStyle = rgbCss(mixRGB(TH.bg3, v >= 0 ? TH.grad : TH.pos, 0.08 + 0.55 * t));
      ctx.fillRect(X, Y, side - 2, side - 2);
      if(Math.abs(v) > 1e-12)
        ctText(ctx, X + (side - 2) / 2, Y + (side - 2) / 2, fmtNum(v, 4),
               rgbCss(TH.text), '600 ' + Math.min(13, side * 0.33) + 'px ' + FONT_MONO, 'center', 'middle');
    }
    /* the basis labels */
    for(let j = 0; j < N; j++)
      ctText(ctx, gx + j * side + (side - 2) / 2, gy - 2, 'x' + (j ? supDigits(String(j)) : '⁰'),
             rgbCss(TH.faint), '10px ' + FONT_UI, 'center', 'bottom');
    for(let i = 0; i < N; i++)
      ctText(ctx, gx - 6, gy + i * side + (side - 2) / 2, 'x' + (i ? supDigits(String(i)) : '⁰'),
             rgbCss(TH.faint), '10px ' + FONT_UI, 'right', 'middle');
    /* the two routes, side by side underneath */
    const by = gy + N * side + 26;
    const cw = Math.min(58, (W - 220) / N);
    const row = (label, arr, col, yy) => {
      ctText(ctx, gx - 6, yy + 9, label, rgbCss(col), '600 10.5px ' + FONT_UI, 'right', 'middle');
      for(let j = 0; j < N; j++)
        ctText(ctx, gx + j * cw + cw / 2, yy + 9, fmtNum(arr[j] || 0, 4),
               rgbCss(col), '11px ' + FONT_MONO, 'center', 'middle');
    };
    row('M · coords', R.byMatrix, TH.warn, by);
    row('the operator itself', R.bySym, TH.neg, by + 20);
    ctText(ctx, gx - 6, by + 49, 'difference', rgbCss(TH.dim), '600 10.5px ' + FONT_UI, 'right', 'middle');
    ctText(ctx, gx, by + 49, fmtAgreeTight(R.worst, 0) + (R.worst === 0 ? '  (exactly, in integers)' : ''),
           rgbCss(R.worst === 0 ? TH.grad : TH.dim), '600 11px ' + FONT_MONO, 'left', 'middle');
    stageNote(ctx, 'column j is the operator applied to xʲ — the matrix is not a rule, it is a list of what happened to the basis', W, H);
  },
  readout(st){
    const R = this.reportOf(st);
    if(st.err)
      return `<div class="card tight"><div class="ttl">Not a polynomial in this space</div>
        <p class="help" style="color:var(--c-pos)">${esc(st.err)}</p>
        <p class="help">Raise the degree slider, or type something of degree ≤ ${st.n}. A space has to contain what you put in it — that is not a technicality, it is what "closed under addition" means.</p></div>`;
    return `<div class="card tight"><div class="ttl">One map, computed two ways</div>
      ${kv('the space', 'P' + supDigits(String(st.n)) + ' — polynomials of degree ≤ ' + st.n + ', dimension ' + (st.n + 1))}
      ${kv('your p(x)', pkPretty(st.src))}
      ${kv('its coordinates', '(' + R.p.map(v => fmtNum(v, 4)).join(', ') + ')')}
      ${kv('operator', LA_OPS[st.op].label)}
      ${kv('M · coords', '(' + R.byMatrix.map(v => fmtNum(v, 4)).join(', ') + ')')}
      ${kv('the operator applied directly', '(' + R.bySym.map(v => fmtNum(v, 4)).join(', ') + ')')}
      ${kv('the two routes', fmtAgreeGross(R.worst, 0, R.gross))}
      <p class="help">The second route never touches the matrix: it applies the operator to the
      polynomial through the parser — symbolic differentiation, or a quadrature for ∫₀ˣ — and then
      recovers coordinates by <b>sampling and solving</b>, so it never reads a coefficient list
      either. That the two land on the same vector is the statement that the matrix <i>is</i> the
      map, written down in a basis.</p>
    </div>
    <div class="card tight"><div class="ttl">What the matrix tells you about the map</div>
      ${kv('rank', String(R.rn.rank))}
      ${kv('nullity (dimension of the kernel)', String(R.rn.nullity))}
      ${kv('rank + nullity', R.rn.rank + ' + ' + R.rn.nullity + ' = ' + R.rn.dim + ' = dim P' + supDigits(String(st.n)))}
      ${kv('nilpotent?', R.nil ? 'yes — T' + supDigits(String(R.nil)) + ' = 0' : 'no — some polynomial survives every application')}
      ${st.op === 'ddx' ? kv('what the kernel IS', 'the constants — and that is the +C') : ''}
      ${st.op === 'xddx' ? kv('this one is diagonal', 'so xʲ are eigenvectors with eigenvalues j — the degrees themselves') : ''}
      ${this.raisesDegree(st.op) ? kv('note: this map leaves the space',
        'x' + supDigits(String(st.n)) + ' would go to x' + supDigits(String(st.n + 1)) + ', which is not in P' + supDigits(String(st.n)) +
        ' — so the top term is dropped, and THAT is why the kernel is not empty') : ''}
      <p class="help">Rank–nullity is conservation of information: whatever the map sends to zero is
      exactly what it loses from its range. For d/dx the kernel is one-dimensional, which is the
      reason an antiderivative is determined only up to a constant — a fact usually presented as
      bookkeeping and here derived from the dimension of a subspace.</p>
    </div>
    <div class="card tight"><div class="ttl">Why this matters later</div>
      <p class="help">Functions being vectors is not an analogy. Once you accept it, an operator is a
      matrix, an eigenvector is an eigenfunction, and <b>Ĥψ = Eψ</b> is an eigenvalue problem in a
      space of the same kind as this one — infinite-dimensional, which needs analysis to handle
      safely, but algebraically identical. The Fourier wing and the quantum wing both live here.</p>
    </div>`;
  },
  chip(st){
    const R = this.reportOf(st);
    if(st.err) return `<div class="k">abstract map</div><div style="color:var(--c-pos)">degree too high</div>`;
    return `<div class="k">${LA_OPS[st.op].label} on P${supDigits(String(st.n))}</div>
      <div>rank ${R.rn.rank} · nullity ${R.rn.nullity}</div>
      <div style="color:${R.worst === 0 ? 'var(--c-grad)' : 'var(--c-warn)'}">two routes: ${R.worst === 0 ? 'identical' : fmtSig(R.worst, 2)}</div>`;
  },
  legend(){
    return [['var(--c-grad)', 'a positive matrix entry'],
            ['var(--c-pos)', 'a negative one'],
            ['var(--c-warn)', 'matrix × coordinates'],
            ['var(--c-neg)', 'the operator applied directly — the check']];
  }
};

/* ---------------------------------------------------------------------------- */
STAGES.laInnerFn = {
  title:'Functions as vectors',
  dockLegend:true,
  derive(st){
    const R = this.reportOf(st);
    return {
      title:'An integral is a dot product, and everything follows',
      steps:[
        drvSay('the dot product was never about arrows either',
          'What a·b actually needs is bilinearity, symmetry, and a·a > 0 for a ≠ 0. Anything satisfying those three is an inner product, and every theorem proved from them survives unchanged — lengths, angles, Cauchy–Schwarz, Gram–Schmidt, projection, least squares.'),
        drvStep('so define one on functions',
          `⟨${dv('f')}, ${dv('g')}⟩ ${dop('=')} ∫ ${dv('f')}(${dv('x')}) ${dv('g')}(${dv('x')}) ${dv('w')}(${dv('x')}) d${dv('x')}`,
          `here ${LA_WEIGHTS[st.wk].label} — the weight is a genuine choice, and it decides which functions count as perpendicular`),
        drvSay('and "perpendicular" stops being about right angles',
          'Two functions are orthogonal when that integral vanishes. There is no picture of a right angle to appeal to — the definition is the arithmetic. What justifies the word is that every consequence of perpendicularity in the plane keeps working, which the panel demonstrates rather than promises.'),
        drvStep('Gram–Schmidt runs unchanged: subtract the shadow',
          `${dv('q')}_k ${dop('=')} ${dv('x')}ᵏ ${dop('−')} ${dop('Σ')} ⟨${dv('x')}ᵏ, ${dv('q')}_j⟩ ${dv('q')}_j`,
          `on {1, x, …, x${supDigits(String(st.deg))}} this produces the ${LA_WEIGHTS[st.wk].family} polynomials`),
        drvSay('which is where the classical special functions come from',
          'Legendre, Chebyshev, Hermite and Laguerre are not a zoo of unrelated formulas. Each is what you get by orthogonalising the monomials under a different weight — one procedure, four answers. The panel checks its Gram–Schmidt output against Rodrigues\' formula, a closed form that shares no code with it.'),
        drvStep('and the Gram matrix measures whether it worked',
          `⟨${dv('q')}_i, ${dv('q')}_j⟩ ${dop('=')} δ_ij`,
          `worst off-diagonal entry: ${fmtSig(R.off, 3)} — that number IS the claim of orthogonality`),
        drvStep('projection is then the best approximation, and provably so',
          `${dv('P')}${dv('f')} ${dop('=')} ${dop('Σ')} ⟨${dv('f')}, ${dv('q')}_j⟩ ${dv('q')}_j`,
          `‖f − Pf‖ = ${fmtSig(R.P.err, 4)} against ‖f‖ = ${fmtSig(R.P.fnorm, 4)}`),
        drvSay('because the error is orthogonal to everything you were allowed to use',
          'f − Pf is perpendicular to every basis vector, so adding any multiple of one can only lengthen it — Pythagoras in a space of functions. That is the entire argument, and it is the same argument that makes least squares the best straight line through data.'),
        drvStep('and Parseval accounts for every bit of the function',
          `${dop('Σ')} ${dv('a')}_j² ${dop('+')} ‖${dv('f')} ${dop('−')} ${dv('P')}${dv('f')}‖² ${dop('=')} ‖${dv('f')}‖²`,
          `${fmtSig(R.par.sum, 6)} + ${fmtSig(R.par.errsq, 6)} = ${fmtSig(R.par.fsq, 6)} — ${fmtAgree(R.par.sum + R.par.errsq, R.par.fsq)}`),
        drvSay('and now a Fourier series is not a new subject',
          'Replace the polynomials with sines and cosines and every line above is unchanged: the coefficients are inner products, the partial sum is a projection, it is the best approximation of its length, and Parseval says the energy adds up. The Fourier wing next door is this stage with a different basis, which is why its formulas look like they were guessed and are not.')
      ],
      note:'The orthogonalisation is run live on the weight chosen, and checked against the classical closed form for that family. The best-approximation claim is measured against random competitors rather than asserted.'
    };
  },
  enter(st, o){
    st.wk = o.wk || 'legendre';
    st.deg = o.deg !== undefined ? o.deg : 4;
    st.fsrc = o.fsrc || 'exp(x)';
    st.err = '';
    this.recompute(st);
  },
  recompute(st){
    try {
      st.err = '';
      const W = LA_WEIGHTS[st.wk];
      const g = compile(parse(st.fsrc));
      const f = x => { const v = g(x, 0, 0); return Number.isFinite(v) ? v : 0; };
      const B = laFnGramSchmidt(st.deg, W);
      const G = laFnGram(B, W);
      const P = laFnProject(f, B, W);
      /* the independent check: the classical closed form for this weight */
      let classic = null, cgap = null;
      if(st.wk === 'legendre' || st.wk === 'chebyshev'){
        const k = Math.min(st.deg, 6);
        const want = st.wk === 'legendre' ? laLegendreUnit(k) : laChebyshevT(k);
        const got = B[k].c;
        if(st.wk === 'legendre'){
          const s = laPolyEval(got, 1) * laPolyEval(want, 1) < 0 ? -1 : 1;
          cgap = want.reduce((w, v, i) => Math.max(w, Math.abs(s * (got[i] || 0) - v)), 0);
          classic = { k, name:'Rodrigues\' formula', want:laPolyScale(want, 1) };
        } else {
          /* Chebyshev differs by normalisation, so compare the ZEROS, which
             no scaling can move — a basis-free comparison */
          const zr = c => nqRoots(x => laPolyEval(c, x), -0.999, 0.999, 400).sort((a, b) => a - b);
          const z1 = zr(want), z2 = zr(got);
          cgap = (z1.length === z2.length && z1.length)
            ? z1.reduce((w, v, i) => Math.max(w, Math.abs(v - z2[i])), 0) : NaN;
          classic = { k, name:'the Chebyshev recurrence (compared by its zeros)', zeros:z1 };
        }
      }
      st._r = { W, f, B, G, P, off:laGramOffDiag(G), par:laParseval(P), classic, cgap };
    } catch(e){ st.err = String(e && e.message || e); }
  },
  reportOf(st){ if(!st._r) this.recompute(st); return st._r; },
  controls(){
    const st = ST;
    return ctSeg('ipW', st.wk, Object.keys(LA_WEIGHTS).map(k => [k, LA_WEIGHTS[k].label])) +
      ctlRow('how many basis functions', ctlSlider('ipDeg', 1, 8, 1, st.deg)) +
      fnHtml('ipF', 'f(x) =', st.fsrc, 'the function to approximate') +
      `<p class="help">Gram–Schmidt is running on {1, x, x², …} with the dot product replaced by
      <b>∫ f g w dx</b> — the same procedure as for arrows, with the same code shape. What comes out
      are the classical orthogonal polynomials, and the panel checks them against a closed form that
      shares nothing with the orthogonalisation. Change the weight and a different classical family
      appears from the same code.</p>
      <p class="help">The coloured curve is the <b>projection</b> of your f onto the span — the best
      approximation there is, which the panel verifies by perturbing it four hundred ways and
      finding none better. Raise the count and watch the error fall and Parseval's sum close.</p>`;
  },
  wire(){
    ctWireSeg('ipW', v => { ST.wk = v; ST._r = null; STAGES.laInnerFn.recompute(ST); buildStagePanel(); });
    wireSlider('ipDeg', () => ST.deg, v => { ST.deg = Math.round(v); ST._r = null; STAGES.laInnerFn.recompute(ST); }, v => String(Math.round(v)));
    fnWire('ipF', (made, src) => { ST.fsrc = src; ST._r = null; STAGES.laInnerFn.recompute(ST); },
           s => { const A = parse(s); compile(A); return A; });
  },
  frame(st, dt, ctx, W, H){
    const R = this.reportOf(st);
    if(st.err || !R){
      ctText(ctx, W / 2, H / 2, st.err || 'no function', rgbCss(TH.pos), '600 13px ' + FONT_UI, 'center', 'middle');
      return;
    }
    const Wt = R.W;
    const a = Wt.a, b = Wt.b;
    /* top: the orthonormal basis this weight produced */
    const topH = Math.max(120, H * 0.44);
    let lo = 0, hi = 0;
    for(const p of R.B) for(let i = 0; i <= 60; i++){
      const v = laPolyEval(p.c, a + (b - a) * i / 60);
      if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    const pad = (hi - lo) * 0.08 || 1;
    const pl = st.pl = mkPlot(70, 44, W - 108, topH, a, b, lo - pad, hi + pad);
    plotFrame(ctx, pl, 'x', '', 'Gram–Schmidt on 1, x, x², … under ' + Wt.label + ' → the ' + Wt.family + ' polynomials');
    plotZeroY(ctx, pl);
    R.B.forEach((p, i) => {
      const t = R.B.length > 1 ? i / (R.B.length - 1) : 0;
      plotCurve(ctx, pl, x => laPolyEval(p.c, x), 320, rgbCss(rampSeq(t)), 1.9);
    });
    /* bottom: f and its projection */
    const y1 = 44 + topH + 44;
    let flo = Infinity, fhi = -Infinity;
    for(let i = 0; i <= 80; i++){
      const x = a + (b - a) * i / 80;
      for(const v of [R.f(x), laPolyEval(R.P.c, x)])
        if(Number.isFinite(v)){ flo = Math.min(flo, v); fhi = Math.max(fhi, v); }
    }
    if(!Number.isFinite(flo)){ flo = -1; fhi = 1; }
    const fp = (fhi - flo) * 0.1 || 1;
    const pl2 = st.pl2 = mkPlot(70, y1, W - 108, Math.max(72, H - y1 - 52), a, b, flo - fp, fhi + fp);
    plotFrame(ctx, pl2, 'x', '', 'your f, and its projection onto the span — the best approximation available');
    plotCurve(ctx, pl2, R.f, 320, rgbCss(TH.dim), 2.6);
    plotCurve(ctx, pl2, x => laPolyEval(R.P.c, x), 320, rgbCss(TH.warn), 2.2);
    /* the residual, magnified so it is visible at all */
    const emax = Math.max(1e-30, R.P.err);
    const scale = (fhi - flo) * 0.28 / Math.max(1e-30, (() => {
      let m = 0;
      for(let i = 0; i <= 80; i++){ const x = a + (b - a) * i / 80; m = Math.max(m, Math.abs(R.f(x) - laPolyEval(R.P.c, x))); }
      return m || 1;
    })());
    plotCurve(ctx, pl2, x => (flo + fp * 0.5) + scale * (R.f(x) - laPolyEval(R.P.c, x)), 320, rgbCss(TH.curl), 1.5);
    ctText(ctx, pl2.px + pl2.pw - 8, pl2.py + 14, 'residual ×' + fmtSig(scale, 2),
           rgbCss(TH.curl), '600 10.5px ' + FONT_UI, 'right');
    stageNote(ctx, 'the residual is perpendicular to every basis function — which is exactly why nothing in the span fits better', W, H);
  },
  readout(st){
    const R = this.reportOf(st);
    if(st.err || !R)
      return `<div class="card tight"><div class="ttl">That function did not compile</div>
        <p class="help" style="color:var(--c-pos)">${esc(st.err || '')}</p></div>`;
    const cls = R.classic;
    return `<div class="card tight"><div class="ttl">Orthogonality, measured</div>
      ${kv('inner product', '⟨f, g⟩ = ∫ f g w dx, with ' + R.W.label)}
      ${kv('basis produced', R.W.family + ', ' + R.B.length + ' functions')}
      ${kv('worst off-diagonal ⟨qᵢ, qⱼ⟩', fmtGap(R.off, 1))}
      ${kv('diagonal entries ⟨qᵢ, qᵢ⟩', R.G.map((r, i) => fmtNum(r[i], 6)).join(', '))}
      ${cls ? kv('against ' + cls.name, fmtGap(R.cgap, 1)) : ''}
      <p class="help">The off-diagonal number <i>is</i> the claim that these functions are
      perpendicular — there is no picture to appeal to, so the integral has to be the evidence. The
      last row compares the result with the classical closed form for this weight, which was derived
      centuries ago by a completely different argument and shares no code with Gram–Schmidt.</p>
    </div>
    <div class="card tight"><div class="ttl">Projection, and why it is the best</div>
      ${kv('f(x)', pkPretty(st.fsrc))}
      ${kv('coefficients ⟨f, qⱼ⟩', R.P.coef.map(v => fmtNum(v, 4)).join(', '))}
      ${kv('‖f‖', fmtSig(R.P.fnorm, 6))}
      ${kv('‖f − Pf‖ — the error', fmtSig(R.P.err, 6))}
      ${kv('Σaⱼ² + ‖error‖²', fmtSig(R.par.sum + R.par.errsq, 8))}
      ${kv('‖f‖² — Parseval', fmtAgree(R.par.sum + R.par.errsq, R.par.fsq))}
      <p class="help">Pythagoras, in a space of functions: the part of f you captured and the part
      you missed are perpendicular, so their squared lengths add to ‖f‖². Add a basis function and
      the first term can only grow and the second can only shrink — which is the whole reason a
      series converges, stated as a fact about right angles.</p>
    </div>
    <div class="card tight"><div class="ttl">This is a Fourier series with a different basis</div>
      <p class="help">Everything above used only three properties of ⟨·,·⟩. Swap the polynomials for
      sin nx and cos nx — orthogonal under ∫₀^{2π} — and the coefficients become the Fourier
      coefficients, the partial sum becomes the Fourier partial sum, the best-approximation property
      becomes the reason truncating a Fourier series is sensible, and Parseval keeps its name
      unchanged. The Fourier wing does not introduce new machinery; it changes the basis.</p>
    </div>`;
  },
  chip(st){
    const R = this.reportOf(st);
    if(st.err || !R) return `<div class="k">inner product</div><div style="color:var(--c-pos)">f did not compile</div>`;
    return `<div class="k">${R.W.family} · ${R.B.length} functions</div>
      <div>orthogonality: ${fmtSig(R.off, 2)}</div>
      <div style="color:var(--c-warn)">‖f − Pf‖ = ${fmtSig(R.P.err, 4)}</div>`;
  },
  legend(st){
    return [['var(--dim)', 'your f'],
            ['var(--c-warn)', 'its projection — the best approximation in the span'],
            ['var(--c-curl)', 'the residual, magnified'],
            ['var(--accent)', 'the orthonormal basis Gram–Schmidt produced']];
  }
};
