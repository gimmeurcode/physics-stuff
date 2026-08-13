/* ============================================================================
   4n · EIGENVALUES, DIAGONALISATION AND THE SVD
   The organising picture: a matrix takes the unit circle to an ellipse.
   Eigenvectors are the directions that come back parallel to themselves; the
   singular values are the ellipse's semi-axes. Both are drawn, both are typed
   in by the reader, and every identity is checked by rebuilding the matrix.
   ============================================================================ */

const EIG_PRESETS = {
  sym:    { M:[[2, 1], [1, 2]],    n:'symmetric' },
  spiral: { M:[[0, -1], [1, 0]],   n:'rotation — complex' },
  shear:  { M:[[1, 1], [0, 1]],    n:'shear — defective' },
  saddle: { M:[[3, 0], [0, -1]],   n:'already diagonal' },
  gen:    { M:[[4, 1], [2, 3]],    n:'general' },
  sing:   { M:[[2, 4], [1, 2]],    n:'singular' }
};

/* the ellipse a matrix makes of the unit circle, plus the eigen-directions */
function eigDrawMap(ctx, P, M, opts){
  const o = opts || {};
  /* unit circle, faint */
  ctParam(ctx, P, t => ({ x:Math.cos(t), y:Math.sin(t) }), 0, 2 * Math.PI, 180, rgbCss(TH.faint, 0.55), 1.4, [4, 4]);
  /* its image */
  ctParam(ctx, P, t => {
    const v = laMatVec(M, [Math.cos(t), Math.sin(t)]);
    return { x:v[0], y:v[1] };
  }, 0, 2 * Math.PI, 220, rgbCss(TH.grad), 2.6);
  /* a ring of sample vectors and where they go — the ones that stay parallel
     are exactly the eigenvectors, and you can see them line up */
  if(o.spokes !== false){
    const n = 24;
    for(let i = 0; i < n; i++){
      const a = i / n * 2 * Math.PI;
      const v = [Math.cos(a), Math.sin(a)];
      const w = laMatVec(M, v);
      const par = Math.abs(v[0] * w[1] - v[1] * w[0]) / (Math.hypot(...w) || 1);
      const near = par < 0.06;
      ctPath(ctx, P, [{ x:v[0], y:v[1] }, { x:w[0], y:w[1] }],
             near ? rgbCss(TH.warn, 0.9) : rgbCss(TH.faint, 0.3), near ? 1.8 : 0.9);
    }
  }
}

STAGES.laEigen = {
  title:'Eigenvalues & eigenvectors',
  derive(st){
    const M = st.M;
    const tr = M[0][0] + M[1][1], det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    const disc = tr * tr - 4 * det;
    const n = v => fmtNum(v, 6);
    return {
      title:'Looking for the directions a matrix does not turn',
      steps:[
        drvSay('the question that defines the subject',
          'A matrix generally rotates and stretches every vector it touches. Drag the vector in the picture and watch the output swing about. The question is whether any direction survives untouched — sent to a multiple of itself rather than somewhere new. Those directions, if they exist, are the skeleton of the transformation.'),
        drvStep('write that demand as an equation',
          `${dv('A')}${dv('v')} ${dop('=')} λ${dv('v')} , &nbsp; ${dv('v')} ${dop('≠')} 0`,
          'λ is how much the direction is stretched; the zero vector is excluded as trivial'),
        drvStep('move everything to one side',
          `(${dv('A')} ${dop('−')} λ${dv('I')})${dv('v')} ${dop('=')} 0`,
          'the identity is needed because λ alone is a scalar and cannot be subtracted from a matrix'),
        drvSay('now the linear-systems wing answers it',
          'This is a homogeneous system. It always has the zero solution; we want a nonzero one. A square system has a nonzero solution exactly when it is singular — when its columns are dependent, when its rank drops, when its determinant is zero. That is the bridge from "does a special direction exist" to a computation.'),
        drvStep('so demand a zero determinant',
          `det(${dv('A')} ${dop('−')} λ${dv('I')}) ${dop('=')} 0`,
          'the characteristic polynomial — and its roots are the eigenvalues'),
        drvStep('for a 2×2 it is a quadratic with familiar coefficients',
          `λ² ${dop('−')} (tr ${dv('A')})λ ${dop('+')} det ${dv('A')} ${dop('=')} 0`,
          `trace ${n(tr)}, determinant ${n(det)}, discriminant ${n(disc)}`),
        drvSay('and Vieta\'s formulas connect back to the matrix',
          `The roots sum to the trace and multiply to the determinant — exactly the relations the algebra wing derived for any quadratic. So the trace is the sum of the eigenvalues and the determinant their product, which is why a zero determinant means a zero eigenvalue and a singular matrix.`),
        drvStep('the discriminant decides what kind of eigenvalues exist',
          `(tr)² ${dop('−')} 4 det`,
          disc > 1e-12 ? 'positive — two real eigenvalues, two genuine invariant directions'
            : disc < -1e-12 ? 'negative — a complex pair, so no real direction survives: the map rotates'
            : 'zero — a repeated eigenvalue, and possibly only one independent direction'),
        drvSay('a complex pair is not a failure, it is a rotation',
          'If no real direction is preserved, the transformation is turning the plane. The eigenvalues are then complex conjugates, their modulus is the scaling per step and their argument is the angle turned. A rotation matrix has eigenvalues e^(±iθ) — the geometry is recoverable from the numbers.'),
        drvStep('then solve for the direction itself',
          `(${dv('A')} ${dop('−')} λ${dv('I')})${dv('v')} ${dop('=')} 0`,
          'the null space of a deliberately singular matrix — so the answer is a whole line, not a point')
      ],
      note:'The eigenvector is determined only up to scale, and that is correct rather than sloppy: if v is unturned then so is 2v, and so is −v. What the matrix preserves is a direction, not a particular arrow, which is why an eigenspace is a subspace.'
    };
  },
  drag:true,
  enter(st, o){
    st.M = mxClone((EIG_PRESETS[o.preset] || EIG_PRESETS.sym).M);
    st.v = { x:1, y:0.35 };            // the vector the reader drags
    st.showPoly = o.poly !== false;
  },
  controls(){
    const st = ST;
    return ctSeg('egP', '', Object.keys(EIG_PRESETS).map(k => [k, EIG_PRESETS[k].n])) +
      mxHtml('egM', st.M) +
      ctChk('egPoly', 'plot det(A − λI)', st.showPoly) +
      `<p class="help">Type any matrix, then <b>drag the white arrow</b>. Almost every direction
      is turned by A. An <b>eigenvector</b> is a direction that is not: Av points along v, and the
      factor it is stretched by is the eigenvalue λ. The orange spokes mark directions where v and
      Av are nearly parallel — drag towards one and watch them lock.</p>
      <p class="help">λ is a root of <b>det(A − λI) = 0</b>. That is the definition, not a trick:
      Av = λv means (A − λI)v = 0 has a nonzero solution, which means A − λI is singular, which
      means its determinant vanishes.</p>`;
  },
  wire(){
    ctWireSeg('egP', v => { ST.M = mxClone(EIG_PRESETS[v].M); });
    mxWire('egM', (i, j, v) => { ST.M[i][j] = v; });
    ctWireChk('egPoly', v => { ST.showPoly = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up') return;
    if(st.P.inside(sx, sy)){
      const x = st.P.invX(sx), y = st.P.invY(sy);
      const n = Math.hypot(x, y) || 1;
      st.v = { x:x / n, y:y / n };
    }
  },
  frame(st, dt, ctx, W, H){
    const E = laEig2(st.M);
    const wide = st.showPoly && W > 900;
    const side = Math.min(wide ? W * 0.5 - 90 : W - 120, H - 150);
    const P = ctBox(side + 120, H, 0, 0, 3.4);
    st.P = P;
    ctGrid(ctx, P);
    ctFrame(ctx, P, 'the unit circle, and where A sends it');
    eigDrawMap(ctx, P, st.M);
    /* the dragged vector and its image */
    const v = [st.v.x, st.v.y], Av = laMatVec(st.M, v);
    ctArrow(ctx, P, 0, 0, v[0], v[1], rgbCss(TH.text), 2.6, 'v');
    ctArrow(ctx, P, 0, 0, Av[0], Av[1], rgbCss(TH.curl), 3, 'Av');
    /* the real eigen-directions, drawn full width */
    if(E.real){
      E.vectors.forEach((e, i) => {
        const s = 3.2;
        ctPath(ctx, P, [{ x:-e[0] * s, y:-e[1] * s }, { x:e[0] * s, y:e[1] * s }],
               rgbCss(i ? TH.neg : TH.pos, 0.85), 2, [7, 5]);
        ctArrow(ctx, P, 0, 0, e[0] * E.values[i], e[1] * E.values[i],
                rgbCss(i ? TH.neg : TH.pos), 2.4, 'λ' + (i + 1) + ' = ' + fmtNum(E.values[i], 3));
      });
    } else {
      stageNote(ctx, 'no real eigenvector: every direction is rotated, so nothing comes back parallel to itself', W, H);
    }
    /* the characteristic polynomial, with its roots where the eigenvalues are */
    if(wide){
      /* A fixed ±8 on det(A − λI) is right for a matrix of small entries and
         wrong for any other: scale the matrix up and the cubic leaves the frame
         between its own roots, which are the only thing on it worth seeing. The
         eigenvalues and the axis are pinned in, since a root drawn outside the
         window is a root the reader cannot check. */
      const Q = mkPlotFit(W * 0.55, 70, W * 0.4, H - 190, -6, 6,
                       l => laCharAt(st.M, l),
                       { include:[0], symmetric:true, minSpan:2 });
      plotFrame(ctx, Q, 'λ', 'det(A − λI)', 'the characteristic polynomial — its roots are the eigenvalues');
      plotZeroY(ctx, Q);
      plotTicksX(ctx, Q, [-6, -3, 0, 3, 6], v2 => String(v2));
      plotCurve(ctx, Q, l => laCharAt(st.M, l), 300, rgbCss(TH.grad), 2.4);
      if(E.real) E.values.forEach((l, i) => {
        if(l > Q.x0 && l < Q.x1) ctDot(ctx, Q, l, 0, 6, rgbCss(i ? TH.neg : TH.pos), rgbCss(TH.bg));
      });
    }
  },
  readout(st){
    const E = laEig2(st.M);
    const v = [st.v.x, st.v.y], Av = laMatVec(st.M, v);
    const cross = v[0] * Av[1] - v[1] * Av[0];
    const rows = E.real
      ? E.values.map((l, i) => {
          const e = E.vectors[i];
          const Ae = laMatVec(st.M, e);
          const resid = Math.hypot(Ae[0] - l * e[0], Ae[1] - l * e[1]);
          return kv('λ' + (i + 1), fmtNum(l, 6)) +
                 kv('  eigenvector', '⟨' + e.map(z => fmtNum(z, 4)).join(', ') + '⟩') +
                 kv('  |Av − λv|', fmtNum(resid, 3));
        }).join('')
      : kv('λ', fmtNum(E.re, 5) + ' ± ' + fmtNum(E.im, 5) + ' i') +
        `<p class="help">The discriminant tr² − 4det is negative, so there is no real direction
        that survives. A rotation is the clean case: it turns <i>everything</i>. The eigenvalues are
        still there, as a complex conjugate pair, and their modulus is the scale factor while their
        argument is the rotation angle.</p>`;
    return `<div class="card tight"><div class="ttl">The eigenproblem</div>
      ${kv('trace = λ₁ + λ₂', fmtNum(E.tr, 6))}
      ${kv('det = λ₁ λ₂', fmtNum(E.det, 6))}
      ${kv('discriminant tr² − 4 det', fmtNum(E.disc, 6))}
      ${rows}
    </div>
    <div class="card tight"><div class="ttl">At your arrow</div>
      ${kv('v', ctVec2(st.v))}
      ${kv('Av', '⟨' + Av.map(z => fmtNum(z, 4)).join(', ') + '⟩')}
      ${kv('v × Av  (zero ⇔ parallel)', fmtNum(cross, 4))}
      ${kv('stretch |Av|/|v|', fmtNum(Math.hypot(...Av), 4))}
      <p class="help">The cross product is the whole test. It vanishes exactly when Av is a multiple
      of v — so drag until that row reads zero and you have found an eigenvector by hand.</p>
    </div>`;
  },
  chip(st){
    const E = laEig2(st.M);
    return `<div class="k">eigenvalues</div>` +
      (E.real ? `<div style="color:var(--c-pos)">λ₁ = ${fmtNum(E.values[0], 4)}</div>
                 <div style="color:var(--c-neg)">λ₂ = ${fmtNum(E.values[1], 4)}</div>`
              : `<div style="color:var(--c-curl)">${fmtNum(E.re, 3)} ± ${fmtNum(E.im, 3)}i</div>`);
  },
  legend(){ return [['var(--c-grad)', 'image of the unit circle'], ['var(--text)', 'your vector v'],
                    ['var(--c-curl)', 'Av'], ['var(--c-pos)', 'first eigendirection'],
                    ['var(--c-neg)', 'second eigendirection'], ['var(--c-warn)', 'nearly parallel']]; },
  dockLegend:true
};

/* ---- 2 · diagonalisation and powers --------------------------------------- */
STAGES.laDiag = {
  title:'Diagonalisation',
  derive(st){
    return {
      title:'Changing basis so that the matrix becomes a list of stretches',
      steps:[
        drvSay('what a diagonal matrix does, and why we want one',
          'A diagonal matrix scales each coordinate independently and mixes nothing. Powers of it are trivial — raise each entry to the power. Exponentials of it are trivial too. If a matrix could be made diagonal by choosing better coordinates, every hard computation involving it would become easy.'),
        drvStep('use the eigenvectors as the new basis',
          `${dv('P')} ${dop('=')} [ ${dv('v')}₁ | ${dv('v')}₂ ]`,
          'the eigenvectors as columns — this is the change-of-basis matrix'),
        drvStep('in that basis the matrix is diagonal',
          `${dv('A')} ${dop('=')} ${dv('P')}${dv('D')}${dv('P')}⁻¹`,
          'D holds the eigenvalues; the panel multiplies it back out and prints the difference from A'),
        drvSay('read the factorisation right to left, as three actions',
          'P⁻¹ rewrites an incoming vector in eigenvector coordinates. D stretches each of those coordinates by its own eigenvalue — no mixing, because each eigenvector is independently preserved. P translates back to the original coordinates. The complicated matrix was a simple stretch all along, described in unhelpful coordinates.'),
        drvStep('powers now cost almost nothing',
          `${dv('A')}ⁿ ${dop('=')} ${dv('P')}${dv('D')}ⁿ${dv('P')}⁻¹`,
          `at n = ${st.n}: the interior P⁻¹P pairs all cancel, leaving one D raised to the power`),
        drvSay('and this is why long-run behaviour is decided by one number',
          'Dⁿ raises each eigenvalue to the nth power. The largest in modulus eventually dominates everything else, so after many steps the state is essentially a multiple of its eigenvector. That single fact explains why Markov chains reach a steady state, why population models settle into a fixed age distribution, and why Google\'s PageRank converges.'),
        drvStep('the same trick defines functions of matrices',
          `${dop('e')}^(${dv('A')}${dv('t')}) ${dop('=')} ${dv('P')}${dop('e')}^(${dv('D')}${dv('t')})${dv('P')}⁻¹`,
          'apply the function to each eigenvalue — which is how the systems wing solves x′ = Ax'),
        drvSay('but not every matrix can be diagonalised',
          'The construction needs enough independent eigenvectors to fill a basis. A shear has a repeated eigenvalue and only one direction, so P has dependent columns and no inverse. Such matrices are called defective, and the Jordan form is the best that can be done for them — almost diagonal, with a stubborn 1 off the diagonal recording the missing direction.'),
        drvSay('symmetric matrices never have this problem',
          'A real symmetric matrix always has a full set of eigenvectors, and they are automatically orthogonal. That is the spectral theorem, and it is why symmetric matrices are so much better behaved — every quadratic form, covariance matrix and moment-of-inertia tensor in physics is symmetric for exactly this reason.')
      ],
      note:'The panel reconstructs PDP⁻¹ and prints its difference from A entrywise. Where the matrix is defective the reconstruction fails visibly rather than silently, because the failure is the point.'
    };
  },
  enter(st, o){
    st.M = mxClone((EIG_PRESETS[o.preset] || EIG_PRESETS.sym).M);
    st.n = o.n || 3;
  },
  controls(){
    const st = ST;
    return ctSeg('dgP', '', Object.keys(EIG_PRESETS).map(k => [k, EIG_PRESETS[k].n])) +
      mxHtml('dgM', st.M) +
      ctlRow('power n', ctlSlider('dgN', 1, 12, 1, st.n)) +
      `<p class="help">If A has a full set of independent eigenvectors, then putting them in the
      columns of P gives <b>A = P D P⁻¹</b> with D diagonal. Everything hard about A becomes easy
      about D: <b>Aⁿ = P Dⁿ P⁻¹</b>, and Dⁿ is just the eigenvalues raised to the power. The panel
      computes Aⁿ both ways — by repeated multiplication and through the diagonalisation — and
      prints the difference.</p>
      <p class="help">A <b>defective</b> matrix (the shear) has a repeated eigenvalue with only one
      eigenvector, P is singular, and the factorisation does not exist. That is not a failure of the
      method; it is a fact about the matrix.</p>`;
  },
  wire(){
    ctWireSeg('dgP', v => { ST.M = mxClone(EIG_PRESETS[v].M); });
    mxWire('dgM', (i, j, v) => { ST.M[i][j] = v; });
    wireSlider('dgN', () => ST.n, v => { ST.n = Math.round(v); }, v => String(Math.round(+v)));
  },
  frame(st, dt, ctx, W, H){
    const side = Math.min(W / 2 - 80, H - 150);
    /* left: A acting once. right: A acting n times — the eigen-directions win */
    const P1 = mkPlot(70, 70, side, side, -3.2, 3.2, -3.2, 3.2);
    plotFrame(ctx, P1, null, null, 'one application of A');
    ctGrid(ctx, P1);
    eigDrawMap(ctx, P1, st.M, { spokes:false });
    const D = laDiagonalize(st.M);
    /* the orbit of a point under repeated application */
    const P2 = mkPlot(90 + side, 70, side, side, -3.2, 3.2, -3.2, 3.2);
    plotFrame(ctx, P2, null, null, 'the orbit of a point under repeated application');
    ctGrid(ctx, P2);
    if(D.ok || true){
      for(let k = 0; k < 12; k++){
        const a = k / 12 * 2 * Math.PI;
        let p = [Math.cos(a), Math.sin(a)];
        const pts = [{ x:p[0], y:p[1] }];
        for(let i = 0; i < st.n; i++){
          p = laMatVec(st.M, p);
          const n = Math.hypot(...p);
          if(!Number.isFinite(n) || n > 1e6) break;
          pts.push({ x:p[0], y:p[1] });
        }
        ctPath(ctx, P2, pts, rgbCss(TH.curl, 0.7), 1.4);
        if(pts.length) ctDot(ctx, P2, pts[pts.length - 1].x, pts[pts.length - 1].y, 3.5, rgbCss(TH.warn));
      }
    }
    const E = laEig2(st.M);
    if(E.real) E.vectors.forEach((e, i) => {
      ctPath(ctx, P2, [{ x:-e[0] * 3, y:-e[1] * 3 }, { x:e[0] * 3, y:e[1] * 3 }],
             rgbCss(i ? TH.neg : TH.pos, 0.8), 2, [6, 5]);
    });
    stageNote(ctx, 'repeated application drags everything onto the eigendirection with the largest |λ| — which is what makes Aⁿ easy', W, H);
  },
  readout(st){
    const D = laDiagonalize(st.M);
    let An = laId(st.M.length);
    for(let i = 0; i < st.n; i++) An = laMul(An, st.M);
    let viaD = null, err = null;
    if(D.ok){
      const Dn = D.D.map((r, i) => r.map((v, j) => (i === j ? Math.pow(v, st.n) : 0)));
      viaD = laMul(laMul(D.P, Dn), D.Pi);
      err = laMaxDiff(viaD, An);
    }
    return `<div class="card tight"><div class="ttl">A = P D P⁻¹</div>
      ${D.ok ? kv('eigenvalues on the diagonal', D.values.map(v => fmtNum(v, 4)).join(',  ')) +
               ctMat(D.P) +
               kv('largest |P D P⁻¹ − A|', fmtNum(D.err, 3))
             : `<p class="help"><b>Not diagonalisable.</b> ${esc(D.why)}</p>`}
    </div>
    <div class="card tight"><div class="ttl">A<sup>${st.n}</sup></div>
      ${ctMat(An)}
      ${viaD ? kv('largest |P Dⁿ P⁻¹ − Aⁿ|', fmtNum(err, 3)) : ''}
      ${D.ok ? kv('λⁿ', D.values.map(v => fmtNum(Math.pow(v, st.n), 4)).join(',  ')) : ''}
      <p class="help">${D.ok
        ? 'Two independent routes to the same matrix: multiply A by itself n times, or raise the eigenvalues to the n. The difference above is the evidence that the factorisation is real.'
        : 'Powers still exist — a defective matrix can be raised to a power perfectly well. What fails is only the shortcut.'}</p>
    </div>`;
  },
  chip(st){
    const D = laDiagonalize(st.M);
    return `<div class="k">diagonalisation</div><div>${D.ok ? 'A = P D P⁻¹' : 'defective'}</div>
      <div style="color:var(--c-warn)">n = ${st.n}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'image of the unit circle'], ['var(--c-curl)', 'orbits under Aⁿ'],
                    ['var(--c-pos)', 'first eigendirection'], ['var(--c-neg)', 'second eigendirection']]; },
  dockLegend:true
};

/* ---- 3 · the singular value decomposition --------------------------------- */
STAGES.laSVD = {
  title:'Singular value decomposition',
  derive(st){
    return {
      title:'Every matrix, however ugly, is a rotation then a stretch then a rotation',
      steps:[
        drvSay('the limitation SVD exists to remove',
          'Diagonalisation needs a square matrix with enough eigenvectors, and it fails for shears, for rectangular matrices, and for anything defective. Yet the geometric question — how does this map distort space — makes sense for every matrix. The SVD answers it for all of them, with no hypotheses at all.'),
        drvStep('ask what the unit circle is mapped to',
          `${dv('A')} sends the unit circle to an ellipse`,
          'true for any 2×2 matrix, however non-symmetric — the panel draws both'),
        drvSay('that this is always an ellipse is the whole theorem',
          'A linear map cannot bend anything, so the circle stays a smooth closed curve, and linearity forces it to be an ellipse. An ellipse has two perpendicular axes. So there must be two perpendicular directions in the input that come out perpendicular — even when nothing is symmetric and no eigenvector exists.'),
        drvStep('name those axes and their lengths',
          `${dv('A')}${dv('v')}ᵢ ${dop('=')} σᵢ${dv('u')}ᵢ`,
          'the vᵢ are perpendicular in the input, the uᵢ perpendicular in the output, and σᵢ are the semi-axes'),
        drvStep('collect that into a factorisation',
          `${dv('A')} ${dop('=')} ${dv('U')}Σ${dv('V')}ᵀ`,
          'the panel checks by multiplying back and printing the difference from A'),
        drvSay('three actions again, and each is elementary',
          'Vᵀ rotates the special input directions onto the coordinate axes. Σ stretches along those axes by σ₁ and σ₂ — a pure diagonal scaling. U rotates the result to where the output ellipse actually points. Rotate, stretch, rotate: every matrix in existence is that and nothing more.'),
        drvStep('the singular values come from a symmetric matrix',
          `σᵢ² are the eigenvalues of ${dv('A')}ᵀ${dv('A')}`,
          'which is symmetric and positive semi-definite whatever A is, so the spectral theorem applies'),
        drvSay('and that is the trick that makes it always work',
          'AᵀA is symmetric even when A is not, so it always has a full orthogonal set of eigenvectors. The SVD borrows their good behaviour. Its eigenvalues are never negative because they are squared lengths, so the square roots are real — this is why singular values are non-negative by construction, not by convention.'),
        drvStep('the condition number is the ratio of the extremes',
          `κ ${dop('=')} ${dfrac('σ₁', 'σ_n')}`,
          'how much the map distorts — the numerical-methods wing\'s measure of an ill-conditioned problem'),
        drvSay('why numerical analysts look at singular values, not determinants',
          'A matrix can have determinant 1 and be hopelessly ill-conditioned: σ₁ = 1000 and σ₂ = 0.001 multiply to 1. The determinant, being a product, hides the disparity that matters. The smallest singular value is how close the matrix is to being singular, and that is the number that governs whether solving with it is safe.')
      ],
      note:'For [[3,0],[4,5]] the singular values are exactly 3√5 and √5 — the panel computes them numerically and prints both against those closed forms. Truncating the SVD after the largest few singular values is also the basis of image compression and principal component analysis.'
    };
  },
  enter(st, o){
    st.M = mxClone(o.M || [[3, 0], [4, 5]]);
  },
  controls(){
    const st = ST;
    return ctSeg('svP', '', [['iso', 'well conditioned'], ['thin', 'nearly singular'], ['rank1', 'rank 1'], ['rot', 'a rotation']]) +
      mxHtml('svM', st.M) +
      `<p class="help">Every matrix — square or not, symmetric or not — factors as
      <b>A = U Σ Vᵀ</b>: a rotation, then a stretch along perpendicular axes, then another rotation.
      Geometrically that is the statement drawn here: <b>the image of the unit circle is always an
      ellipse</b>. The singular values σ are its semi-axis lengths, the columns of V are the
      directions in the circle that map to those axes, and the columns of U are the axis directions
      themselves.</p>
      <p class="help">Unlike eigenvectors, this always exists and the vectors are always orthogonal.
      The number of nonzero σ is the <b>rank</b>; σ₁/σₙ is the <b>condition number</b>, which is how
      much a solve can amplify error.</p>`;
  },
  wire(){
    ctWireSeg('svP', v => {
      ST.M = mxClone({ iso:[[2, 0], [0, 1.4]], thin:[[2, 1.98], [1.98, 2]],
                       rank1:[[1, 2], [2, 4]], rot:[[0, -1], [1, 0]] }[v]);
    });
    mxWire('svM', (i, j, v) => { ST.M[i][j] = v; });
  },
  frame(st, dt, ctx, W, H){
    const S = laSVD(st.M);
    const side = Math.min(W / 2 - 80, H - 150);
    const P1 = mkPlot(70, 70, side, side, -3.4, 3.4, -3.4, 3.4);
    plotFrame(ctx, P1, null, null, 'the unit circle, with the two V directions');
    ctGrid(ctx, P1);
    ctParam(ctx, P1, t => ({ x:Math.cos(t), y:Math.sin(t) }), 0, 2 * Math.PI, 180, rgbCss(TH.faint), 1.8);
    S.V.forEach((v, i) => ctArrow(ctx, P1, 0, 0, v[0], v[1],
      rgbCss(i ? TH.neg : TH.pos), 2.6, 'v' + (i + 1)));
    const P2 = mkPlot(90 + side, 70, side, side, -3.4, 3.4, -3.4, 3.4);
    plotFrame(ctx, P2, null, null, 'its image — an ellipse with semi-axes σ');
    ctGrid(ctx, P2);
    ctParam(ctx, P2, t => {
      const w = laMatVec(st.M, [Math.cos(t), Math.sin(t)]);
      return { x:w[0], y:w[1] };
    }, 0, 2 * Math.PI, 240, rgbCss(TH.grad), 2.6);
    S.U.forEach((u, i) => {
      if(!(S.sigma[i] > 1e-9)) return;
      ctArrow(ctx, P2, 0, 0, u[0] * S.sigma[i], u[1] * S.sigma[i],
              rgbCss(i ? TH.neg : TH.pos), 2.6, 'σ' + (i + 1) + ' u' + (i + 1));
    });
    stageNote(ctx, 'the two perpendicular directions on the left land on the two perpendicular axes on the right — that is the whole theorem', W, H);
  },
  readout(st){
    const S = laSVD(st.M);
    const VtV = laMul(S.V, laT(S.V));
    return `<div class="card tight"><div class="ttl">A = U Σ Vᵀ</div>
      ${S.sigma.map((s, i) => kv('σ' + (i + 1), fmtNum(s, 6))).join('')}
      ${kv('rank (nonzero σ)', S.rank)}
      ${kv('condition number σ₁/σₙ', Number.isFinite(S.cond) ? fmtNum(S.cond, 5) : '∞ — singular')}
      ${kv('largest |U Σ Vᵀ − A|', fmtNum(S.err, 3))}
      <p class="help">The last row rebuilds A from the factors and compares. The decomposition is
      not asserted; it is reconstructed.</p>
    </div>
    <div class="card tight"><div class="ttl">V — orthonormal by construction</div>
      ${ctMat(S.V)}
      ${kv('largest |VᵀV − I|', fmtNum(laMaxDiff(VtV, laId(S.V.length)), 3))}
      ${kv('|det A|', fmtNum(Math.abs(laDet(st.M)), 6))}
      ${kv('σ₁ σ₂ …', fmtNum(S.sigma.reduce((a, b) => a * b, 1), 6))}
      <p class="help">The product of the singular values is |det A| — the ellipse's area over the
      circle's. When one σ is zero the ellipse has collapsed to a segment, the determinant is zero,
      and the matrix has thrown a dimension away.</p>
    </div>`;
  },
  chip(st){
    const S = laSVD(st.M);
    return `<div class="k">singular values</div>
      <div style="color:var(--c-pos)">σ₁ = ${fmtNum(S.sigma[0], 4)}</div>
      <div style="color:var(--c-neg)">σ₂ = ${fmtNum(S.sigma[1] || 0, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the image ellipse'], ['var(--c-pos)', 'first singular direction'],
                    ['var(--c-neg)', 'second singular direction']]; },
  dockLegend:true
};

/* ---- 4 · symmetric matrices, quadratic forms, definiteness ---------------- */
STAGES.laQuad = {
  title:'Quadratic forms & definiteness',
  derive(st){
    const M = st.M;
    const tr = M[0][0] + M[1][1], det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    const n = v => fmtNum(v, 6);
    return {
      title:'Why the second-derivative test is really a question about eigenvalues',
      steps:[
        drvStep('a quadratic form packages a quadratic into a matrix',
          `${dv('Q')}(${dv('x')}) ${dop('=')} ${dv('x')}ᵀ${dv('A')}${dv('x')} ${dop('=')} ${dv('a')}${dv('x')}² ${dop('+')} 2${dv('b')}${dv('x')}${dv('y')} ${dop('+')} ${dv('c')}${dv('y')}²`,
          `here a = ${n(M[0][0])}, b = ${n(M[0][1])}, c = ${n(M[1][1])}`),
        drvSay('the cross term is split in half, and that is deliberate',
          'Putting b in both off-diagonal slots makes the matrix symmetric. Any matrix could represent the form, but only the symmetric one is guaranteed real orthogonal eigenvectors — so the symmetric choice is what makes the whole theory work.'),
        drvStep('the spectral theorem rotates the cross term away',
          `${dv('A')} ${dop('=')} ${dv('Q')}Λ${dv('Q')}ᵀ ${dop('⇒')} ${dv('Q')} ${dop('=')} λ₁${dv('u')}² ${dop('+')} λ₂${dv('w')}²`,
          `trace ${n(tr)}, determinant ${n(det)}, so the eigenvalues sum and multiply to those`),
        drvSay('and in those coordinates the answer is obvious',
          'A sum of squares with positive coefficients is positive unless both coordinates vanish. With one positive and one negative coefficient it goes up one way and down the other. The cross term was hiding this; rotating to the eigenvector axes removes the disguise and leaves a question anyone can answer.'),
        drvStep('so definiteness is just the signs of the eigenvalues',
          `both ${dop('>')} 0 ${dop('⇒')} positive definite, bowl`,
          det > 1e-12 ? (tr > 0 ? 'both positive — a bowl, so a minimum' : 'both negative — a dome, so a maximum')
            : det < -1e-12 ? 'opposite signs — a saddle' : 'a zero eigenvalue — the test is inconclusive'),
        drvStep('for 2×2 the trace and determinant settle it without solving',
          `det ${dop('>')} 0 and tr ${dop('>')} 0 ${dop('⇔')} positive definite`,
          'because the determinant is the product of the eigenvalues and the trace their sum'),
        drvSay('now recognise where this has already appeared',
          'The Hessian of a function of two variables is a symmetric matrix of second derivatives, and the second-order Taylor term is exactly the quadratic form it defines. The partial-derivatives wing\'s test — f_xx f_yy − f_xy² > 0 — is the determinant of that Hessian, and the sign of f_xx is standing in for the trace.'),
        drvSay('so the discriminant test was never an arbitrary rule',
          'It is the eigenvalue test in disguise. A positive determinant means both eigenvalues share a sign, so the surface curves the same way in every direction; f_xx says which. A negative determinant means opposite signs, so it curves up one way and down another — a saddle. The rule is a consequence, not a recipe.'),
        drvStep('and the same criterion recurs across physics',
          `${dv('x')}ᵀ${dv('A')}${dv('x')} ${dop('>')} 0`,
          'stability of an equilibrium, positivity of an energy, validity of a covariance matrix — all one condition')
      ],
      note:'The panel draws the level curves of the form: ellipses when definite, hyperbolas when indefinite, and parallel lines in the degenerate case where an eigenvalue vanishes. The conic\'s type and the definiteness are the same fact seen two ways.'
    };
  },
  enter(st, o){
    st.M = mxClone(o.M || [[2, -1], [-1, 2]]);
  },
  controls(){
    const st = ST;
    return ctSeg('qfP', '', [['pd', 'positive definite'], ['nd', 'negative definite'],
                             ['ind', 'indefinite — a saddle'], ['semi', 'semidefinite']]) +
      mxHtml('qfM', st.M) +
      `<p class="help">A symmetric matrix defines the quadratic form <b>Q(x) = xᵀA x</b>, drawn here
      as a landscape. The <b>spectral theorem</b> says a symmetric matrix always has real eigenvalues
      and a full orthonormal set of eigenvectors — so the landscape is always a bowl, a dome or a
      saddle aligned with those axes, never anything more exotic.</p>
      <p class="help">Definiteness is then obvious: all eigenvalues positive means a bowl and
      Q &gt; 0 everywhere except the origin. The panel decides it twice — by eigenvalue, and by
      Sylvester's leading-minor test — and the two must agree.</p>`;
  },
  wire(){
    ctWireSeg('qfP', v => {
      ST.M = mxClone({ pd:[[2, -1], [-1, 2]], nd:[[-2, 0.6], [0.6, -3]],
                       ind:[[1, 2], [2, 1]], semi:[[1, 1], [1, 1]] }[v]);
    });
    mxWire('qfM', (i, j, v) => {
      /* the form only sees the symmetric part, so keep the matrix symmetric */
      ST.M[i][j] = v; ST.M[j][i] = v;
      buildStagePanel();
    });
  },
  frame(st, dt, ctx, W, H){
    const Q = (x, y) => st.M[0][0] * x * x + (st.M[0][1] + st.M[1][0]) * x * y + st.M[1][1] * y * y;
    const side = Math.min(W - 140, H - 150);
    const P = ctBox(side + 140, H, 0, 0, 2.6);
    const rg = ctRange(Q, P, 40);
    ctHeat(ctx, P, Q, rg.lo, rg.hi, 60, 0.75, true);
    for(const L of ctLevels(rg.lo, rg.hi, 16)) ctContour(ctx, P, Q, L, rgbCss(TH.text, 0.28), 1, 150);
    ctContour(ctx, P, Q, 0, rgbCss(TH.warn), 2.4, 200);
    ctGrid(ctx, P);
    ctFrame(ctx, P, 'Q(x, y) = xᵀA x — orange is the zero level');
    const E = laEigSym(st.M);
    E.vectors.forEach((v, i) => {
      ctArrow(ctx, P, 0, 0, v[0] * 2, v[1] * 2, rgbCss(i ? TH.neg : TH.pos), 2.6,
              'λ = ' + fmtNum(E.values[i], 3));
    });
    stageNote(ctx, 'the eigenvectors are the axes of the landscape, and the eigenvalues are its curvatures along them', W, H);
  },
  readout(st){
    const P = laPosDef(st.M);
    const verdict = P.byEig ? 'positive definite — a bowl'
      : P.values.every(v => v < -1e-12) ? 'negative definite — a dome'
      : P.values.some(v => Math.abs(v) < 1e-12) ? 'semidefinite — flat in one direction'
      : 'indefinite — a saddle';
    return `<div class="card tight"><div class="ttl">The spectral theorem at work</div>
      ${P.values.map((v, i) => kv('λ' + (i + 1), fmtNum(v, 6))).join('')}
      ${kv('verdict', verdict)}
      ${kv('eigenvalue test', String(P.byEig))}
      ${kv("Sylvester's minors", P.minors.map(m => fmtNum(m, 4)).join(',  '))}
      ${kv('Sylvester test', String(P.bySylvester))}
      ${kv('do the two tests agree?', P.byEig === P.bySylvester ? 'yes' : 'NO — that would be a bug')}
      <p class="help">Two independent criteria for the same property. They are not obviously the
      same statement, and watching them agree as you edit the matrix is the point of showing both.</p>
    </div>
    <div class="card tight"><div class="ttl">Why it matters elsewhere</div>
      <p class="help">This is the second-derivative test of the partial-derivatives wing: the Hessian
      is a symmetric matrix, and minimum, maximum and saddle are exactly positive definite, negative
      definite and indefinite. It is also the condition for a covariance matrix to be legitimate, and
      for an energy to have a stable equilibrium.</p>
    </div>`;
  },
  chip(st){
    const P = laPosDef(st.M);
    return `<div class="k">quadratic form</div>
      <div style="color:var(--c-pos)">λ = ${P.values.map(v => fmtNum(v, 3)).join(', ')}</div>
      <div>${P.byEig ? 'positive definite' : 'not definite'}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'Q = 0'], ['var(--c-pos)', 'first eigen-axis'],
                    ['var(--c-neg)', 'second eigen-axis']]; },
  dockLegend:true
};
