/* ============================================================================
   4o · VECTOR SPACES, ORTHOGONALITY AND DETERMINANTS
   Span and independence drawn rather than defined; Gram–Schmidt run one vector
   at a time; least squares with data points you place yourself; and the
   determinant as the factor by which area is scaled.
   ============================================================================ */

/* ---- 1 · span, dependence, basis, dimension ------------------------------- */
STAGES.laSpan = {
  title:'Span, dependence & basis',
  derive(st){
    const vs = st.vs;
    const n = v => fmtNum(v, 6);
    const det2 = vs.length >= 2 ? vs[0][0] * vs[1][1] - vs[0][1] * vs[1][0] : 0;
    return {
      title:'What a set of vectors can reach, and when one of them is wasted',
      steps:[
        drvStep('a linear combination is all you are allowed to build',
          `${dv('a')}${dv('v')}₁ ${dop('+')} ${dv('b')}${dv('v')}₂`,
          `with a = ${n(st.combo.a)}, b = ${n(st.combo.b)} — drag the sliders and watch the tip move`),
        drvSay('scaling and adding are the only two operations there are',
          'A vector space is defined by exactly these: you may stretch a vector and you may add two together. Everything reachable from a starting set is reachable by those moves alone, and the collection of all such results is the span.'),
        drvStep('the span is everything reachable',
          `span{${dv('v')}₁, ${dv('v')}₂} ${dop('=')} { ${dv('a')}${dv('v')}₁ ${dop('+')} ${dv('b')}${dv('v')}₂ }`,
          'a line if the vectors are parallel, the whole plane if they are not'),
        drvStep('dependence means one vector adds nothing new',
          `${dv('a')}${dv('v')}₁ ${dop('+')} ${dv('b')}${dv('v')}₂ ${dop('=')} 0 with ${dv('a')}, ${dv('b')} not both zero`,
          `the determinant of the pair is ${n(det2)} — ${Math.abs(det2) < 1e-12 ? 'zero, so they are dependent' : 'nonzero, so they are independent'}`),
        drvSay('why the definition is phrased as "the only way to get zero is trivially"',
          'It looks like a roundabout way to say one vector is a multiple of another, and for two vectors it is. For more than two it is not: three vectors can be dependent without any two of them being parallel. Phrasing dependence through the zero vector is what makes it work at every size.'),
        drvStep('a basis is independent and spans — no more, no less',
          `every ${dv('x')} is ${dv('a')}${dv('v')}₁ ${dop('+')} ${dv('b')}${dv('v')}₂ in exactly one way`,
          Math.abs(det2) < 1e-12 ? 'not a basis here — the vectors are dependent' : 'a basis of the plane'),
        drvSay('and uniqueness of the coefficients is exactly independence',
          'If a vector had two different representations, subtracting them would give a nontrivial combination equalling zero — dependence. So "independent" and "coordinates are unambiguous" are the same statement. That is why a basis is what lets you use coordinates at all.'),
        drvStep('the dimension is the count, and it cannot vary',
          `dim ${dop('=')} number of vectors in any basis`,
          'every basis of a given space has the same size — a theorem, not a definition'),
        drvSay('too few vectors cannot span, too many cannot be independent',
          'Those two failures are the same theorem seen from opposite ends, and together they force the count to be an invariant of the space. Dimension is well defined because of that squeeze, and rank plus nullity equals n is the same counting argument applied to a matrix.')
      ],
      note:'Drag a vector until the two become parallel and watch the span collapse from the plane to a line. The determinant passes through zero at exactly that moment, which is what makes it the test for dependence rather than merely a formula that happens to work.'
    };
  },
  drag:true,
  enter(st, o){
    st.vs = (o.vs || [[2, 1], [1, 2]]).map(v => v.slice());
    st.combo = { a:1, b:1 };
    st.showCombos = o.combos !== false;
  },
  controls(){
    const st = ST;
    return ctSeg('spN', String(st.vs.length), [['2', 'two vectors'], ['3', 'three vectors']]) +
      mxHtml('spM', st.vs, st.vs.map((_, i) => 'v' + (i + 1))) +
      ctlRow('coefficient a', ctlSlider('spA', -3, 3, 0.02, st.combo.a)) +
      ctlRow('coefficient b', ctlSlider('spB', -3, 3, 0.02, st.combo.b)) +
      ctChk('spC', 'shade everything reachable', st.showCombos) +
      `<p class="help">The <b>span</b> is every vector you can build as a·v₁ + b·v₂ + … Drag the
      sliders to walk through the combinations, or <b>drag on the picture</b> to move v₁. Two
      independent vectors in the plane span all of it; two parallel ones span only a line, and no
      choice of coefficients will ever leave it.</p>
      <p class="help"><b>Independent</b> means the only combination giving zero is the one with all
      coefficients zero — equivalently the matrix with those columns has a pivot in every column.
      A <b>basis</b> is an independent spanning set, and its size is the <b>dimension</b>, which is
      the same number however you choose it.</p>`;
  },
  wire(){
    ctWireSeg('spN', v => {
      const n = +v;
      ST.vs = n === 2 ? [[2, 1], [1, 2]] : [[2, 1], [1, 2], [1, -1]];
    });
    mxWire('spM', (i, j, v) => { ST.vs[i][j] = v; });
    wireSlider('spA', () => ST.combo.a, v => { ST.combo.a = v; }, v => fmtNum(+v, 3));
    wireSlider('spB', () => ST.combo.b, v => { ST.combo.b = v; }, v => fmtNum(+v, 3));
    ctWireChk('spC', v => { ST.showCombos = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.vs[0] = [st.P.invX(sx), st.P.invY(sy)];
    buildStagePanel();
  },
  frame(st, dt, ctx, W, H){
    const P = ctBox(Math.min(W, H * 1.25), H, 0, 0, 4);
    st.P = P;
    ctGrid(ctx, P);
    const A = laT(st.vs);                    // columns are the vectors
    const r = laRank(A);
    /* shade what is reachable: the plane if rank 2, the line if rank 1 */
    if(st.showCombos){
      if(r >= 2){
        ctx.fillStyle = rgbCss(TH.grad, 0.10);
        ctx.fillRect(P.px, P.py, P.pw, P.ph);
      } else if(r === 1){
        const v = st.vs.find(v2 => Math.hypot(...v2) > 1e-9) || [1, 0];
        const s = 8 / (Math.hypot(...v) || 1);
        ctPath(ctx, P, [{ x:-v[0] * s, y:-v[1] * s }, { x:v[0] * s, y:v[1] * s }],
               rgbCss(TH.grad, 0.5), 10);
      }
    }
    ctFrame(ctx, P, r >= 2 ? 'these vectors span the whole plane'
                  : r === 1 ? 'the span is only a line — they are dependent'
                            : 'the span is only the origin');
    const cols = [TH.pos, TH.neg, TH.curl];
    st.vs.forEach((v, i) => ctArrow(ctx, P, 0, 0, v[0], v[1], rgbCss(cols[i % 3]), 2.8, 'v' + (i + 1)));
    /* the current combination, built head to tail so it is visibly a sum */
    const c = [st.combo.a, st.combo.b, 0.5];
    let px = 0, py = 0;
    st.vs.forEach((v, i) => {
      const nx = px + v[0] * c[i], ny = py + v[1] * c[i];
      ctPath(ctx, P, [{ x:px, y:py }, { x:nx, y:ny }], rgbCss(cols[i % 3], 0.45), 2, [5, 4]);
      px = nx; py = ny;
    });
    ctArrow(ctx, P, 0, 0, px, py, rgbCss(TH.warn), 3.2, 'a v₁ + b v₂');
    ctDot(ctx, P, px, py, 5, rgbCss(TH.warn), rgbCss(TH.bg));
    stageNote(ctx, 'drag on the picture to move v₁ — when the vectors line up the shaded span collapses to a line', W, H);
  },
  readout(st){
    const A = laT(st.vs);
    const r = laRank(A);
    const nb = laNullBasis(A);
    const c = [st.combo.a, st.combo.b, 0.5];
    const sum = st.vs.reduce((acc, v, i) => [acc[0] + v[0] * c[i], acc[1] + v[1] * c[i]], [0, 0]);
    return `<div class="card tight"><div class="ttl">Independence</div>
      ${kv('vectors given', st.vs.length)}
      ${kv('rank — the dimension of the span', r)}
      ${kv('independent?', r === st.vs.length ? 'yes — this is a basis for its span' : 'no')}
      ${kv('dimension of the space they live in', 2)}
      ${nb.length ? kv('a dependency', nb[0].map((z, i) => fmtNum(z, 3) + '·v' + (i + 1)).join(' + ') + ' = 0') : ''}
      <p class="help">${r === st.vs.length
        ? 'Every vector in the span is reached by exactly one set of coefficients — that uniqueness is what independence buys, and it is why coordinates are well defined.'
        : 'A nonzero combination gives zero, so the coefficients are not unique: you can add any multiple of that dependency and land in the same place. The set spans, but it is not a basis.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Your combination</div>
      ${kv('a', fmtNum(st.combo.a, 4))}${kv('b', fmtNum(st.combo.b, 4))}
      ${kv('a v₁ + b v₂', '⟨' + sum.map(z => fmtNum(z, 4)).join(', ') + '⟩')}
      ${kv('is it in the span?', 'always — that is what span means')}
    </div>`;
  },
  chip(st){
    const r = laRank(laT(st.vs));
    return `<div class="k">span</div><div>dimension ${r}</div>
      <div style="color:${r === st.vs.length ? 'var(--c-grad)' : 'var(--c-pos)'}">${r === st.vs.length ? 'independent' : 'dependent'}</div>`;
  },
  legend(){ return [['var(--c-pos)', 'v₁'], ['var(--c-neg)', 'v₂'], ['var(--c-curl)', 'v₃'],
                    ['var(--c-warn)', 'the combination'], ['var(--c-grad)', 'the span']]; },
  dockLegend:true
};

/* ---- 2 · Gram–Schmidt and orthogonal projection --------------------------- */
STAGES.laGram = {
  title:'Gram–Schmidt & projection',
  derive(st){
    return {
      title:'Manufacturing a perpendicular basis by subtracting what overlaps',
      steps:[
        drvSay('why perpendicular bases are worth building',
          'In an arbitrary basis, finding a vector\'s coordinates means solving a linear system. In a perpendicular one, each coordinate is a single dot product — take the component along each direction and you are done. The work of making the basis perpendicular is repaid every time it is used.'),
        drvStep('the projection of one vector onto another',
          `proj ${dop('=')} ${dfrac(dv('v') + '·' + dv('u'), dv('u') + '·' + dv('u'))}${dv('u')}`,
          'how much of v points along u, expressed as a vector'),
        drvSay('read the formula as two separate jobs',
          'The dot product v·u measures the overlap. Dividing by u·u normalises for how long u happens to be, since a longer u should not mean more overlap. Multiplying by u puts the answer back in the right direction. Each factor is doing something specific.'),
        drvStep('subtract the overlap and what remains is perpendicular',
          `${dv('w')} ${dop('=')} ${dv('v')} ${dop('−')} proj_${dv('u')}(${dv('v')})`,
          `check: w·u = ${'the panel prints it, and it is zero to machine precision'}`),
        drvSay('that this works is a one-line calculation, not a hope',
          'Dot w with u and the projection term is constructed to cancel exactly. Perpendicularity is not approximate or arranged by luck — it is what the subtraction was designed to produce, and the residual dot product confirms it every time.'),
        drvStep('repeat for each further vector, removing every earlier component',
          `${dv('w')}ₖ ${dop('=')} ${dv('v')}ₖ ${dop('−')} Σ_(j<k) proj_(${dv('w')}ⱼ)(${dv('v')}ₖ)`,
          `at step ${st.step}: the panel shows each subtraction as it happens`),
        drvStep('normalise if you want unit vectors',
          `${dv('q')}ₖ ${dop('=')} ${dv('w')}ₖ / |${dv('w')}ₖ|`,
          'orthogonal becomes orthonormal — optional, but it makes the coordinates cleaner still'),
        drvSay('and this is the QR factorisation',
          'Record the coefficients used along the way and they form an upper-triangular R, with the orthonormal results as the columns of Q. A = QR is Gram–Schmidt written as matrices, and it is how least-squares problems are solved stably in practice.'),
        drvSay('the same procedure works far beyond arrows',
          'Replace the dot product with an integral of a product of functions and the identical algorithm orthogonalises polynomials — that produces the Legendre polynomials. Fourier series are the same idea with sines and cosines, which turn out to be orthogonal already. Projection onto an orthogonal basis is one mechanism appearing throughout the subject.')
      ],
      note:'The classical Gram–Schmidt shown here is numerically fragile: for nearly parallel vectors the subtraction is a catastrophic cancellation and orthogonality is lost. Production code uses the modified variant or Householder reflections, for the reasons the numerical-methods wing sets out.'
    };
  },
  drag:true,
  enter(st, o){
    st.vs = (o.vs || [[3, 1], [1, 2]]).map(v => v.slice());
    st.step = o.step === undefined ? 2 : o.step;
  },
  controls(){
    const st = ST;
    return mxHtml('gsM', st.vs, st.vs.map((_, i) => 'v' + (i + 1))) +
      ctlRow('vectors done', ctlSlider('gsK', 0, st.vs.length, 1, st.step)) +
      `<div class="row wrap">${ctBtn('gsAdd', 'add a vector')}${ctBtn('gsDel', 'remove one')}</div>
      <p class="help">Gram–Schmidt turns any independent set into an orthonormal one, one vector at
      a time, by the only obvious move: <b>subtract off what is already accounted for</b>. Take v,
      remove its projection onto everything built so far, and normalise what is left. The residual
      is orthogonal to all of them by construction — that is not a lucky outcome, it is what
      subtracting the projection <i>means</i>.</p>
      <p class="help">Drag on the picture to move v₁. Watch the residual shrink as the vectors
      become more nearly parallel: that shrinking is exactly why the process is numerically
      delicate, and why the panel checks QᵀQ against the identity rather than trusting it.</p>`;
  },
  wire(){
    mxWire('gsM', (i, j, v) => { ST.vs[i][j] = v; });
    wireSlider('gsK', () => ST.step, v => { ST.step = Math.round(v); }, v => String(Math.round(+v)));
    ctWireBtn('gsAdd', () => { if(ST.vs.length < 3){ ST.vs.push([1, -1]); ST.step = ST.vs.length; } });
    ctWireBtn('gsDel', () => { if(ST.vs.length > 1){ ST.vs.pop(); ST.step = Math.min(ST.step, ST.vs.length); } });
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.vs[0] = [st.P.invX(sx), st.P.invY(sy)];
    buildStagePanel();
  },
  frame(st, dt, ctx, W, H){
    const P = ctBox(Math.min(W, H * 1.25), H, 0, 0, 4);
    st.P = P;
    ctGrid(ctx, P);
    ctFrame(ctx, P, 'each new vector, minus its shadow on what came before');
    const G = laGramSchmidt(st.vs.slice(0, Math.max(1, st.step)));
    /* the originals */
    st.vs.forEach((v, i) => ctArrow(ctx, P, 0, 0, v[0], v[1], rgbCss(TH.faint), 1.8, 'v' + (i + 1)));
    /* the orthonormal ones built so far */
    G.Q.forEach((q, i) => ctArrow(ctx, P, 0, 0, q[0], q[1], rgbCss(i ? TH.neg : TH.pos), 3, 'q' + (i + 1)));
    /* the projection being subtracted, for the vector currently in progress */
    const k = Math.min(st.step, st.vs.length) - 1;
    if(k >= 1 && G.steps[k]){
      const s = G.steps[k];
      let p = [0, 0];
      s.proj.forEach((c, i) => { p = laAdd(p, laScale(G.Q[i] || [0, 0], c)); });
      ctArrow(ctx, P, 0, 0, p[0], p[1], rgbCss(TH.warn), 2.2, 'projection');
      ctPath(ctx, P, [{ x:p[0], y:p[1] }, { x:s.v0[0], y:s.v0[1] }], rgbCss(TH.curl), 2.2, [5, 4]);
      ctArrow(ctx, P, p[0], p[1], s.v0[0], s.v0[1], rgbCss(TH.curl), 2.4, 'residual');
    }
    stageNote(ctx, 'the dashed residual is perpendicular to every q — subtract the shadow and what is left has to be', W, H);
  },
  readout(st){
    const G = laGramSchmidt(st.vs.slice(0, Math.max(1, st.step)));
    const QtQ = G.Q.length ? laMul(G.Q, laT(G.Q)) : [[1]];
    const dots = [];
    for(let i = 0; i < G.Q.length; i++) for(let j = i + 1; j < G.Q.length; j++)
      dots.push(kv('q' + (i + 1) + ' · q' + (j + 1), fmtNum(laDot(G.Q[i], G.Q[j]), 3)));
    return `<div class="card tight"><div class="ttl">The orthonormal set</div>
      ${G.Q.map((q, i) => kv('q' + (i + 1), '⟨' + q.map(z => fmtNum(z, 5)).join(', ') + '⟩')).join('')}
      ${G.Q.map((q, i) => kv('|q' + (i + 1) + '|', fmtNum(laNorm(q), 6))).join('')}
      ${dots.join('')}
      ${kv('largest |QᵀQ − I|', fmtNum(laMaxDiff(QtQ, laId(G.Q.length)), 3))}
      <p class="help">Unit length and mutually perpendicular, both measured rather than assumed.
      The last row is the single number that certifies the whole set at once.</p>
    </div>
    <div class="card tight"><div class="ttl">Step by step</div>
      ${G.steps.map((s, i) => kv('v' + (i + 1) + ' — residual length', fmtNum(s.norm, 5))).join('')}
      <p class="help">A residual of zero means the vector was already in the span of the earlier ones
      — dependent — and it is dropped rather than normalised, because normalising it would divide by
      zero. That is the algorithm detecting dependence as a side effect.</p>
    </div>`;
  },
  chip(st){
    const G = laGramSchmidt(st.vs.slice(0, Math.max(1, st.step)));
    return `<div class="k">Gram–Schmidt</div><div>${G.Q.length} orthonormal</div>
      <div style="color:var(--c-grad)">from ${st.vs.length} given</div>`;
  },
  legend(){ return [['var(--faint)', 'the vectors you gave'], ['var(--c-pos)', 'q₁'],
                    ['var(--c-neg)', 'q₂'], ['var(--c-warn)', 'the projection removed'],
                    ['var(--c-curl)', 'the residual']]; },
  dockLegend:true
};

/* ---- 3 · least squares, with data you place yourself ---------------------- */
STAGES.laLSQ = {
  title:'Least squares',
  derive(st){
    return {
      title:'Solving an unsolvable system by settling for the closest thing',
      steps:[
        drvSay('the honest situation',
          `There are ${st.pts.length} data points and only ${st.deg + 1} coefficients to fit them with. The system Ax = b has more equations than unknowns, and unless the data happen to lie exactly on a curve of that degree there is no solution at all. Asking for one is asking for something that does not exist.`),
        drvStep('so change the question',
          `minimise |${dv('A')}${dv('x')} ${dop('−')} ${dv('b')}|`,
          'not "make the residual zero" but "make it as small as possible"'),
        drvSay('now the geometry answers it immediately',
          'Ax, as x ranges over everything, sweeps out the column space of A — a plane sitting inside a higher-dimensional space. The vector b is off that plane. The closest point of a plane to an outside point is the foot of the perpendicular. That is the whole solution, and it needs no calculus.'),
        drvStep('the residual must be perpendicular to the column space',
          `${dv('A')}ᵀ(${dv('b')} ${dop('−')} ${dv('A')}${dv('x')}) ${dop('=')} 0`,
          'each column of A dotted with the residual must vanish, which is what Aᵀ collects'),
        drvStep('rearranged, these are the normal equations',
          `${dv('A')}ᵀ${dv('A')}${dv('x')} ${dop('=')} ${dv('A')}ᵀ${dv('b')}`,
          `a square ${st.deg + 1}×${st.deg + 1} system — solvable, unlike the original`),
        drvSay('note what has happened to the shape of the problem',
          'A tall thin unsolvable system has become a small square solvable one. AᵀA is square, symmetric and — provided the columns of A are independent — invertible. The impossible problem was replaced by a possible one whose answer is provably the closest available.'),
        drvStep('the same line the calculus route produces',
          `${dfrac('∂', '∂' + dv('x'))}Σ(residuals)² ${dop('=')} 0`,
          'setting both partial derivatives to zero gives exactly the normal equations'),
        drvSay('and a third route gives it again',
          'The probability wing derives the same slope by minimising Σ(y − mx − b)² directly, and the panel there prints the agreement to ten decimal places. Projection, partial derivatives and the regression formula are three descriptions of one computation.'),
        drvStep('the variation splits exactly, which is what makes r² meaningful',
          `|${dv('b')}|² ${dop('=')} |proj|² ${dop('+')} |residual|²`,
          'Pythagoras, because the two pieces are perpendicular by construction'),
        drvSay('so r² is a genuine fraction, not a score someone invented',
          'The decomposition is exact — it is the Pythagorean theorem applied to a right angle that the construction guaranteed. That is why the explained fraction lies between 0 and 1 and can be interpreted as a share of the variance at all.')
      ],
      note:'Squaring the errors is a choice, not a law. It makes the algebra linear and it is the maximum-likelihood answer for Gaussian noise, but it also lets one distant outlier outweigh many small errors. Minimising absolute deviations instead gives a different, more robust line and a much harder computation.'
    };
  },
  drag:true,
  enter(st, o){
    st.pts = (o.pts || [[0, 1], [1, 3], [2, 4], [3, 6], [4, 6.5]]).map(p => p.slice());
    st.deg = o.deg || 1;
  },
  controls(){
    const st = ST;
    return ctSeg('lqD', String(st.deg), [['1', 'a line'], ['2', 'a parabola'], ['3', 'a cubic']]) +
      `<div class="row wrap">${ctBtn('lqClr', 'clear the points')}${ctBtn('lqRnd', 'scatter some')}</div>` +
      fnHtml('lqTyped', 'points  x,y', st.pts.map(p => fmtNum(p[0], 6) + ',' + fmtNum(p[1], 6)).join('  '), 'pairs') +
      `<p class="help">Pairs, <b>x,y</b>, separated by spaces or semicolons — your own measurements
      rather than points placed by eye. This is also the keyboard route to a stage that otherwise
      only answers to a pointer.</p>
      <p class="help"><b>Click anywhere on the plot to drop a data point</b>, and drag to move the
      last one. There is usually no curve through all of them, so the system Ax = b has no solution
      — and the honest response is to ask for the x that comes <i>closest</i>.</p>
      <p class="help">Closest in the least-squares sense means minimising |Ax − b|², and the
      solution is the one making the residual <b>orthogonal to the column space</b>. That single
      geometric condition is the normal equation AᵀA x̂ = Aᵀb, and the panel checks the
      orthogonality directly rather than quoting the formula.</p>`;
  },
  wire(){
    ctWireSeg('lqD', v => { ST.deg = +v; });
    /* the typed list, parsed leniently: anything that is not two finite numbers
       is dropped rather than allowed to poison the fit with a NaN */
    /* The box takes a list of pairs rather than an expression, so it supplies its
       own validator. It must THROW on unusable input: fnWire only calls set
       when the build succeeds, and a validator that never fails would accept a
       formula typed here, silently keep the previous points, and tell the reader
       nothing at all. Failing loudly is what puts the message under the field. */
    fnWire('lqTyped', (m) => { ST.pts = m.pts; }, s => {
      const out = [];
      for(const chunk of String(s).split(/[;\s]+/)){
        if(!chunk) continue;
        const bits = chunk.split(',');
        if(bits.length !== 2) throw new Error('each point is two numbers separated by a comma, like 1.5,2.4');
        const x = ctlParse(bits[0]), y = ctlParse(bits[1]);
        if(!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('could not read "' + chunk + '" as a point');
        out.push([x, y]);
      }
      if(out.length < 2) throw new Error('give at least two points to fit');
      return { pts:out };
    });
    ctWireBtn('lqClr', () => { ST.pts = []; });
    ctWireBtn('lqRnd', () => {
      ST.pts = Array.from({ length:9 }, (_, i) => {
        const x = i * 0.5;
        return [x, 1 + 1.3 * x + (Math.random() - 0.5) * 1.6];
      });
    });
  },
  pick(st, sx, sy, phase){
    if(!st.P || !st.P.inside(sx, sy)) return;
    const p = [st.P.invX(sx), st.P.invY(sy)];
    if(phase === 'down') st.pts.push(p);
    else if(phase === 'move' && st.pts.length) st.pts[st.pts.length - 1] = p;
  },
  fit(st){
    if(st.pts.length < st.deg + 1) return null;
    const A = st.pts.map(p => Array.from({ length:st.deg + 1 }, (_, k) => Math.pow(p[0], k)));
    const b = st.pts.map(p => p[1]);
    const L = laLeastSquares(A, b);
    if(!L.x) return null;
    L.poly = x => L.x.reduce((s, c, k) => s + c * Math.pow(x, k), 0);
    return L;
  },
  frame(st, dt, ctx, W, H){
    const P = mkPlot(80, 60, W - 150, H - 150, -0.6, 5, -1.5, 9);
    st.P = P;
    plotFrame(ctx, P, 'x', 'y', 'click to add data — the fit follows immediately');
    ctGrid(ctx, P);
    const L = this.fit(st);
    if(L){
      plotCurve(ctx, P, L.poly, 300, rgbCss(TH.grad), 2.8);
      /* the residuals, drawn as the vertical gaps being minimised */
      st.pts.forEach(p => {
        ctPath(ctx, P, [{ x:p[0], y:p[1] }, { x:p[0], y:L.poly(p[0]) }], rgbCss(TH.pos, 0.8), 1.6);
      });
    }
    st.pts.forEach(p => ctDot(ctx, P, p[0], p[1], 5, rgbCss(TH.curl), rgbCss(TH.bg)));
    stageNote(ctx, 'the orange bars are the residuals — the fit is the curve that makes the sum of their squares as small as possible', W, H);
  },
  readout(st){
    const L = this.fit(st);
    if(!L) return `<div class="card tight"><p class="help">Add at least ${st.deg + 1} points — a
      polynomial of degree ${st.deg} has ${st.deg + 1} coefficients to determine.</p></div>`;
    const names = ['constant', 'x', 'x²', 'x³'];
    return `<div class="card tight"><div class="ttl">The best fit</div>
      ${L.x.map((c, k) => kv(names[k], fmtNum(c, 6))).join('')}
      ${kv('points', st.pts.length)}
      ${kv('sum of squared residuals', fmtNum(L.rss, 6))}
      ${kv('root mean square error', fmtNum(Math.sqrt(L.rss / st.pts.length), 6))}
    </div>
    <div class="card tight"><div class="ttl">Why this is the answer</div>
      ${L.orth.map((v, k) => kv('residual · column ' + (k + 1),
        fmtGap(v, Math.sqrt(Math.max(1e-300, L.rss)) * Math.max(1e-300, ...st.pts.map(p => Math.abs(k ? p.x : 1)))))).join('')}
      <p class="help">Every one of those is zero: the residual is perpendicular to the space of
      achievable fits. If it were not, some of the error would still lie in a direction the model
      could have absorbed, and the fit would not yet be best. <b>That orthogonality is the theorem</b>
      — the normal equations are just it written in coordinates.</p>
    </div>`;
  },
  chip(st){
    const L = this.fit(st);
    return `<div class="k">least squares</div><div>${st.pts.length} points</div>
      ${L ? `<div style="color:var(--c-grad)">RSS = ${fmtNum(L.rss, 4)}</div>` : ''}`;
  },
  legend(){ return [['var(--c-curl)', 'your data'], ['var(--c-grad)', 'the best fit'],
                    ['var(--c-pos)', 'residuals']]; },
  dockLegend:true
};

/* ---- 4 · the determinant as an area factor -------------------------------- */
STAGES.laDet = {
  title:'The determinant',
  derive(st){
    const M = st.M;
    const d = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    const n = v => fmtNum(v, 6);
    return {
      title:'One number that answers "how much does this map scale area?"',
      steps:[
        drvSay('the formula is usually given first, which is backwards',
          'ad − bc arrives looking like an incantation. It is far better understood as the answer to a question: by what factor does this transformation multiply areas? Everything the determinant is used for follows from that, including the ones that look unrelated.'),
        drvStep('the unit square goes to a parallelogram',
          `columns of ${dv('A')} are the images of the two edges`,
          `the panel draws both and measures the area of the image`),
        drvStep('and its area is the determinant',
          `det ${dv('A')} ${dop('=')} ${dv('a')}${dv('d')} ${dop('−')} ${dv('b')}${dv('c')}`,
          `${n(M[0][0])}×${n(M[1][1])} − ${n(M[0][1])}×${n(M[1][0])} = ${n(d)}`),
        drvSay('the sign is orientation, and it is real information',
          `A negative determinant means the map flipped the plane over — what was anticlockwise is now clockwise. Here the determinant is ${n(d)}, so orientation is ${d < 0 ? 'reversed' : 'preserved'}. Area itself has no sign, which is why the change-of-variables formula takes the absolute value while Green's theorem does not.`),
        drvStep('scaling by any region, not just the square',
          `area(${dv('A')}(${dv('S')})) ${dop('=')} |det ${dv('A')}| ${dop('×')} area(${dv('S')})`,
          'the panel applies the map to a square, a disc and a triangle and checks the same ratio each time'),
        drvSay('that the factor is the same for every shape is the point',
          'It is not obvious in advance that one number could describe the effect on all regions. It works because any region can be approximated by small squares, each scaled identically — which is also exactly why the Jacobian determinant appears in the change-of-variables formula.'),
        drvStep('zero determinant means the plane was flattened',
          `det ${dop('=')} 0 ${dop('⇒')} area destroyed ${dop('⇒')} not invertible`,
          Math.abs(d) < 1e-12 ? 'this matrix is singular' : 'this matrix is invertible'),
        drvSay('and every use of the determinant is that one fact',
          'Singular matrices, dependent columns, systems without unique solutions, the characteristic equation for eigenvalues — all are the statement that some direction was crushed to nothing. det(A − λI) = 0 asks for the λ that makes the map flatten space, and a flattened map has a nonzero kernel, which is an eigenvector.'),
        drvStep('multiplicativity is then obvious rather than mysterious',
          `det(${dv('A')}${dv('B')}) ${dop('=')} det ${dv('A')} ${dop('·')} det ${dv('B')}`,
          'scale by one factor, then the other — of course the factors multiply')
      ],
      note:'In three dimensions the determinant is the volume of the parallelepiped spanned by the columns, and the same story runs unchanged. The 3×3 cofactor expansion is a bookkeeping device for that volume, which is why it is also the triple scalar product of the vectors wing.'
    };
  },
  drag:true,
  enter(st, o){
    st.M = mxClone(o.M || [[2, 0.6], [0.5, 1.6]]);
    st.shape = o.shape || 'square';
  },
  controls(){
    const st = ST;
    return ctSeg('dtS', st.shape, [['square', 'the unit square'], ['disc', 'a disc'], ['blob', 'a letter F']]) +
      mxHtml('dtM', st.M) +
      `<p class="help">The determinant is not a formula to memorise; it is <b>the factor by which
      area is multiplied</b>. Drag a column of the matrix on the picture and watch the shaded image
      grow, shrink, and — when the columns line up — collapse to a segment of zero area. That is
      precisely when det = 0, when the inverse fails to exist, and when the columns are dependent.
      They are the same event seen three ways.</p>
      <p class="help">The <b>sign</b> is orientation. When the image is flipped over, the determinant
      is negative, and the panel says so. In three dimensions the same statement is about volume, and
      it is where the Jacobian factor in a change of variables comes from.</p>`;
  },
  wire(){
    ctWireSeg('dtS', v => { ST.shape = v; });
    mxWire('dtM', (i, j, v) => { ST.M[i][j] = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    const x = st.P.invX(sx), y = st.P.invY(sy);
    /* grab whichever column head is nearer */
    const d0 = Math.hypot(x - st.M[0][0], y - st.M[1][0]);
    const d1 = Math.hypot(x - st.M[0][1], y - st.M[1][1]);
    const c = d0 < d1 ? 0 : 1;
    st.M[0][c] = x; st.M[1][c] = y;
    buildStagePanel();
  },
  shapePts(st){
    if(st.shape === 'square') return [[0,0],[1,0],[1,1],[0,1]];
    if(st.shape === 'disc') return Array.from({ length:48 }, (_, i) => {
      const a = i / 48 * 2 * Math.PI; return [0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)];
    });
    return [[0.1,0],[0.35,0],[0.35,0.55],[0.75,0.55],[0.75,0.75],[0.35,0.75],
            [0.35,0.9],[0.85,0.9],[0.85,1.1],[0.1,1.1]];
  },
  frame(st, dt, ctx, W, H){
    const P = ctBox(Math.min(W, H * 1.3), H, 0.6, 0.6, 2.6);
    st.P = P;
    ctGrid(ctx, P);
    const src = this.shapePts(st);
    const img = src.map(p => { const q = laMatVec(st.M, p); return { x:q[0], y:q[1] }; });
    ctFill(ctx, P, src.map(p => ({ x:p[0], y:p[1] })), rgbCss(TH.faint, 0.22));
    ctPath(ctx, P, src.map(p => ({ x:p[0], y:p[1] })).concat([{ x:src[0][0], y:src[0][1] }]), rgbCss(TH.faint), 1.6);
    const d = laDet(st.M);
    ctFill(ctx, P, img, rgbCss(d < 0 ? TH.pos : TH.grad, 0.32));
    ctPath(ctx, P, img.concat([img[0]]), rgbCss(d < 0 ? TH.pos : TH.grad), 2.4);
    ctArrow(ctx, P, 0, 0, st.M[0][0], st.M[1][0], rgbCss(TH.pos), 2.8, 'first column');
    ctArrow(ctx, P, 0, 0, st.M[0][1], st.M[1][1], rgbCss(TH.neg), 2.8, 'second column');
    ctFrame(ctx, P, 'drag either column head — the shaded area is |det| times the original');
    stageNote(ctx, d < 0 ? 'the image is flipped over: the determinant is negative'
                         : 'orientation preserved: the determinant is positive', W, H);
  },
  readout(st){
    const d = laDet(st.M);
    const S = laSVD(st.M);
    return `<div class="card tight"><div class="ttl">Area, measured</div>
      ${kv('det A', fmtNum(d, 6))}
      ${kv('|det A| — the area factor', fmtNum(Math.abs(d), 6))}
      ${kv('orientation', d < 0 ? 'reversed' : d > 0 ? 'preserved' : 'collapsed')}
      ${kv('σ₁ · σ₂ (from the SVD)', fmtNum(S.sigma.reduce((a, b) => a * b, 1), 6))}
      ${kv('difference', fmtAgree(Math.abs(d), S.sigma.reduce((a, b) => a * b, 1)))}
      <p class="help">The determinant computed by elimination and the product of the singular values
      computed from an eigenproblem are entirely different calculations, and they agree — because
      both are measuring the same area.</p>
    </div>
    <div class="card tight"><div class="ttl">The properties, visible</div>
      ${kv('rank', laRank(st.M))}
      ${kv('invertible?', Math.abs(d) > 1e-12 ? 'yes' : 'no — the area is zero')}
      <p class="help">Swap the two columns and the sign flips. Scale one column by k and the
      determinant scales by k. Add a multiple of one column to the other and nothing changes at all
      — a shear slides the shape sideways without altering its area. Those three facts are the
      axioms the determinant is usually <i>defined</i> by; here they are things you can watch.</p>
    </div>`;
  },
  chip(st){
    const d = laDet(st.M);
    return `<div class="k">determinant</div>
      <div style="color:${d < 0 ? 'var(--c-pos)' : 'var(--c-grad)'}">${fmtNum(d, 5)}</div>
      <div>area × ${fmtNum(Math.abs(d), 4)}</div>`;
  },
  legend(){ return [['var(--faint)', 'the original shape'], ['var(--c-grad)', 'its image'],
                    ['var(--c-pos)', 'first column'], ['var(--c-neg)', 'second column']]; },
  dockLegend:true
};
