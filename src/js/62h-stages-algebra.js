/* ============================================================================
   4v · ALGEBRA — the manipulations everything later assumes
   Nothing here is quoted. The quadratic formula is *derived* by completing the
   square, with the reader's own coefficients carried through every line, and
   every factorisation is checked by expanding it back.
   ============================================================================ */

STAGES.agQuad = {
  title:'Quadratics, and where the formula comes from',
  drag:true,
  enter(st, o){
    st.a = o.a === undefined ? 1 : o.a;
    st.b = o.b === undefined ? -2 : o.b;
    st.c = o.c === undefined ? -3 : o.c;
    st.view = o.view || 'graph';
  },
  controls(){
    const st = ST;
    return ctSeg('aqV', st.view, [['graph', 'the parabola'], ['square', 'completing the square']]) +
      ctlRow('a', ctlSlider('aqA', -3, 3, 0.05, st.a)) +
      ctlRow('b', ctlSlider('aqB', -8, 8, 0.05, st.b)) +
      ctlRow('c', ctlSlider('aqC', -8, 8, 0.05, st.c)) +
      `<p class="help">Drag the coefficients and watch the roots, the vertex and the discriminant
      move together. <b>The panel below derives the quadratic formula from your a, b and c</b> — it
      is not stored anywhere in this program. Completing the square is the entire content of it:
      every quadratic is a shifted, scaled x², and once you can see that, the roots are just
      "undo the shift and the scale".</p>
      <p class="help">Push the discriminant through zero and watch the two roots collide and then
      vanish from the real line. They do not stop existing — they become a complex conjugate pair,
      which is what the complex wing picks up.</p>`;
  },
  wire(){
    ctWireSeg('aqV', v => { ST.view = v; });
    wireSlider('aqA', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('aqB', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('aqC', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    /* drag the vertex: h and k determine b and c once a is fixed */
    const h = st.P.invX(sx), k = st.P.invY(sy);
    st.b = -2 * st.a * h;
    st.c = k + st.a * h * h;
    buildStagePanel();
  },
  frame(st, dt, ctx, W, H){
    const Q = agQuadratic(st.a, st.b, st.c);
    /* The window follows the parabola instead of being fixed at ±10: steepen a
       or push the vertex down and a fixed frame keeps the vertex and loses both
       arms, which is the half of the picture the roots are on. The vertex and
       the x-axis are pinned in explicitly — they are what this experiment is
       about, and a fit that framed only the sampled body could drop either. */
    const P = mkPlotFit(80, 55, W - 160, H - 145, -7, 7,
      [x => st.a * x * x + st.b * x + st.c, x => st.a * x * x],
      { include:[0, Q.k], minSpan:4 });
    st.P = P;
    plotFrame(ctx, P, 'x', 'y', 'y = ax² + bx + c   —   drag the vertex');
    ctGrid(ctx, P);
    plotZeroY(ctx, P);
    plotCurve(ctx, P, x => st.a * x * x + st.b * x + st.c, 400, rgbCss(TH.grad), 2.6);
    if(st.view === 'square'){
      /* the same parabola drawn as a(x − h)² + k, and the shift made visible */
      ctPath(ctx, P, [{ x:Q.h, y:P.y0 }, { x:Q.h, y:P.y1 }], rgbCss(TH.curl, 0.7), 1.4, [5, 4]);
      ctPath(ctx, P, [{ x:P.x0, y:Q.k }, { x:P.x1, y:Q.k }], rgbCss(TH.warn, 0.7), 1.4, [5, 4]);
      ctParam(ctx, P, t => ({ x:t, y:st.a * t * t }), P.x0, P.x1, 200, rgbCss(TH.faint, 0.7), 1.6, [4, 4]);
      ctArrow(ctx, P, 0, 0, Q.h, Q.k, rgbCss(TH.pos), 2, 'shift by (h, k)');
    }
    /* the roots */
    if(Q.roots) for(const r of Q.roots) ctDot(ctx, P, r, 0, 6, rgbCss(TH.pos), rgbCss(TH.bg));
    ctDot(ctx, P, Q.h, Q.k, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    ctText(ctx, P.X(Q.h) + 9, P.Y(Q.k) - 9, 'vertex', rgbCss(TH.warn), '600 11px ' + FONT_UI);
    stageNote(ctx, Q.disc > 0 ? 'two real roots — the parabola crosses the axis twice'
      : Q.disc < 0 ? 'no real roots — the parabola misses the axis entirely'
                   : 'one repeated root — the parabola just touches the axis', W, H);
  },
  /* ---- the derivation ladder: the formula, produced rather than recalled --- */
  derive(st){
    const Q = agQuadratic(st.a, st.b, st.c);
    const n = v => fmtNum(v, 4);
    const A = n(st.a), B = n(st.b), C = n(st.c);
    return {
      title:'Completing the square — and out falls the formula',
      steps:[
        drvStep('start with what you are given',
          `${dv('a')}${dv('x')}² ${dop('+')} ${dv('b')}${dv('x')} ${dop('+')} ${dv('c')} ${dop('=')} 0`,
          `${A}x² + ${B}x + ${C} = 0`),
        drvStep('divide by a — you may, because a ≠ 0',
          `${dv('x')}² ${dop('+')} ${dfrac(dv('b'), dv('a'))}${dv('x')} ${dop('+')} ${dfrac(dv('c'), dv('a'))} ${dop('=')} 0`,
          `x² + ${n(st.b / st.a)}x + ${n(st.c / st.a)} = 0`),
        drvStep('add and subtract (b/2a)² — the only trick in the whole derivation',
          `${dv('x')}² ${dop('+')} ${dfrac(dv('b'), dv('a'))}${dv('x')} ${dop('+')} ${dfrac(dv('b') + '²', '4' + dv('a') + '²')} ${dop('−')} ${dfrac(dv('b') + '²', '4' + dv('a') + '²')} ${dop('+')} ${dfrac(dv('c'), dv('a'))} ${dop('=')} 0`,
          `(b/2a)² = ${n(st.b * st.b / (4 * st.a * st.a))}`),
        drvSay('why that is the trick',
          'The first three terms are now a perfect square. Adding zero in this particular disguise is what turns an expression you cannot invert into one you can — and that single move is the whole method.'),
        drvSay('and why it is the only move available',
          'The obstacle is that x appears twice, in x² and in bx, and there is no way to isolate a letter that occurs in two different powers. Completing the square gets x to appear <b>once</b>, inside a bracket, and a letter that occurs once can be peeled: undo the square, undo the addition, done. That is worth stating as a strategy rather than a trick, because it is the same strategy behind rationalising, behind the substitution that kills the cubic\'s quadratic term, and behind diagonalising a quadratic form in the linear-algebra wing — all of them are "make the unknown appear once".'),
        drvStep('so the left side is a square',
          `(${dv('x')} ${dop('+')} ${dfrac(dv('b'), '2' + dv('a'))})² ${dop('=')} ${dfrac(dv('b') + '² ' + dop('−') + ' 4' + dv('a') + dv('c'), '4' + dv('a') + '²')}`,
          `(x ${st.b >= 0 ? '+' : '−'} ${n(Math.abs(st.b / (2 * st.a)))})² = ${n(Q.disc / (4 * st.a * st.a))}`),
        drvStep('take the square root of both sides',
          `${dv('x')} ${dop('+')} ${dfrac(dv('b'), '2' + dv('a'))} ${dop('=')} ${dop('±')}${dfrac('<span class="rad">' + dv('b') + '² ' + dop('−') + ' 4' + dv('a') + dv('c') + '</span>', '2' + dv('a'))}`,
          Q.disc >= 0 ? `√(discriminant) = ${n(Math.sqrt(Q.disc))}`
                      : `the discriminant is ${n(Q.disc)} — negative, so the root is imaginary`),
        drvStep('and solve for x — this is the quadratic formula',
          `${dv('x')} ${dop('=')} ${dfrac(dop('−') + dv('b') + ' ' + dop('±') + ' <span class="rad">' + dv('b') + '² ' + dop('−') + ' 4' + dv('a') + dv('c') + '</span>', '2' + dv('a'))}`,
          Q.roots && Q.roots.length ? 'x = ' + Q.roots.map(r => n(r)).join('  and  ')
                                    : `x = ${n(Q.re)} ± ${n(Q.im)}i`),
        drvSay('and the check',
          Q.roots && Q.roots.length === 2
            ? `Expanding a(x − r₁)(x − r₂) must give back b = ${n(Q.expandCheck.b)} and c = ${n(Q.expandCheck.c)}, against the ${B} and ${C} you set. That agreement is the verification — the roots were found, then the factorisation was rebuilt from them and compared.`
            : 'With no two real roots there is nothing to expand over the reals, which is exactly what the negative discriminant is telling you.'),
        drvSay('the discriminant is not an extra definition either',
          'It is the thing under the square root, and it decides the answer because a square root is where the real numbers run out. Positive and the parabola crosses the axis twice; zero and it touches, the two roots having collided; negative and it misses entirely, which is not a failure of the formula but a fact about the picture. Notice that b² − 4ac appeared as the numerator two lines above, before anyone called it a discriminant — the name was attached afterwards, to a quantity the algebra had already produced.'),
        drvSay('and the halfway point falls out for free',
          'The bracket says the roots sit at −b/2a plus and minus the same amount, so their <b>midpoint</b> is −b/2a whatever the discriminant does — real roots, repeated roots or complex ones. That midpoint is the axis of symmetry and the x of the vertex, which is why differentiating 2ax + b = 0 gives the same answer: the symmetry was in the completed square all along, and calculus is confirming it rather than discovering it.')
      ],
      note:'Notice that <b>a, b and c never appear as numbers in the derivation</b> — only in the substitution line beneath each step. The algebra is done once, symbolically, and it is valid for every quadratic there has ever been. That is what a formula <i>is</i>.'
    };
  },
  readout(st){
    const Q = agQuadratic(st.a, st.b, st.c);
    return `<div class="card tight"><div class="ttl">The parabola</div>
      ${kv('vertex (h, k)', '(' + fmtNum(Q.h, 5) + ', ' + fmtNum(Q.k, 5) + ')')}
      ${kv('axis of symmetry', 'x = ' + fmtNum(Q.h, 5))}
      ${kv('opens', st.a > 0 ? 'upwards' : st.a < 0 ? 'downwards' : 'it is not a parabola')}
      ${kv('discriminant b² − 4ac', fmtNum(Q.disc, 5))}
      ${kv('what that means', Q.kind)}
      ${Q.roots && Q.roots.length ? kv('roots', Q.roots.map(r => fmtNum(r, 5)).join(',  ')) : ''}
    </div>
    <div class="card tight"><div class="ttl">Vieta — the roots from the coefficients alone</div>
      ${kv('sum of roots = −b/a', fmtNum(Q.sum, 6))}
      ${kv('product of roots = c/a', fmtNum(Q.product, 6))}
      ${Q.roots && Q.roots.length === 2 ? kv('checked: r₁ + r₂', fmtNum(Q.roots[0] + Q.roots[1], 6)) : ''}
      ${Q.roots && Q.roots.length === 2 ? kv('checked: r₁ · r₂', fmtNum(Q.roots[0] * Q.roots[1], 6)) : ''}
      <p class="help">These hold whether or not the roots are real — for a complex pair the sum and
      product are still these real numbers, because the imaginary parts cancel. That is the first
      hint that complex roots are not a failure but a completion.</p>
    </div>`;
  },
  chip(st){
    const Q = agQuadratic(st.a, st.b, st.c);
    return `<div class="k">discriminant</div>
      <div style="color:${Q.disc > 0 ? 'var(--c-pos)' : Q.disc < 0 ? 'var(--c-neg)' : 'var(--c-warn)'}">${fmtNum(Q.disc, 4)}</div>
      <div>${Q.kind}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'your quadratic'], ['var(--c-pos)', 'the roots'],
                    ['var(--c-warn)', 'the vertex'], ['var(--faint)', 'y = ax², before shifting']]; },
  dockLegend:true
};

/* ---- 2 · polynomials, factoring and the rational-root theorem ------------- */
STAGES.agPoly = {
  title:'Polynomials & factoring',
  enter(st, o){
    st.co = (o.co || [-6, 11, -6, 1]).slice();   // (x−1)(x−2)(x−3)
    st.typed = !!o.typed;
  },
  controls(){
    const st = ST;
    const names = ['constant', 'x', 'x²', 'x³', 'x⁴', 'x⁵', 'x⁶', 'x⁷', 'x⁸'];
    const P = st.typed ? agPolyCur(st) : null;
    return ctSeg('apP', '', [['cubic', '(x−1)(x−2)(x−3)'], ['quartic', 'a quartic'],
                             ['irred', 'no rational roots'], ['double', 'a repeated root'],
                             ['custom', 'type your own']]) +
      (st.typed
        ? fnHtml('agpoly_p', 'p(x) =', pkOwn(st, 'agpoly', AG_POLY_OWN, AG_POLY_BOUNDS).p, 'x') +
          ctlRow('degree', ctlSlider('apDeg', 1, 8, 1, P.deg)) +
          `<p class="help">${P.note}</p>` +
          `<p class="help">The sliders below hold the coefficients that were extracted; moving one
          takes you off your expression and onto the polynomial the sliders now describe, which is
          the honest thing for them to do.</p>`
        : '') +
      st.co.map((c, i) => ctlRow(names[i] || ('x^' + i), ctlSlider('apC' + i, -12, 12, 0.5, c))).join('') +
      `<p class="help">A root and a factor are the same thing: <b>p(r) = 0 if and only if (x − r)
      divides p</b>. That is the factor theorem, and the derivation below shows why it is almost a
      tautology once you divide.</p>
      <p class="help">The <b>rational-root theorem</b> does not find roots — it narrows the search
      to a finite list of candidates p/q, where p divides the constant term and q the leading one.
      The panel lists every candidate and marks the ones that actually work, which is the honest
      picture: a theorem that shrinks a search space rather than answering the question.</p>`;
  },
  wire(){
    ctWireSeg('apP', v => {
      if(v === 'custom'){ ST.typed = true; ST.co = agPolyCur(ST).co.slice(); return; }
      ST.typed = false;
      ST.co = ({ cubic:[-6, 11, -6, 1], quartic:[0, -4, 0, 1, 0.25],
                 irred:[1, 1, 1, 1], double:[4, -8, 5, -1] })[v].slice();
    });
    if(ST.typed){
      const own = pkOwn(ST, 'agpoly', AG_POLY_OWN, AG_POLY_BOUNDS);
      fnWire('agpoly_p', (m, s) => { own.p = s; ST.co = agPolyCur(ST).co.slice(); });
      wireSlider('apDeg', () => +own.deg, v => { own.deg = Math.round(v); ST.co = agPolyCur(ST).co.slice(); },
        v => 'degree ' + Math.round(v));
    }
    ST.co.forEach((_, i) => wireSlider('apC' + i, () => ST.co[i], v => { ST.co[i] = v; }, v => fmtNum(+v, 3)));
  },
  frame(st, dt, ctx, W, H){
    /* a degree-5 polynomial leaves a fixed ±14 frame almost immediately, and
       the roots this experiment is about are on the part that left */
    const P = mkPlotFit(80, 55, W - 160, H - 145, -5, 5,
      x => agPolyAt(st.co, x), { include:[0], minSpan:4 });
    st.P = P;
    plotFrame(ctx, P, 'x', 'p(x)', 'the polynomial, and its real roots');
    ctGrid(ctx, P);
    plotZeroY(ctx, P);
    plotCurve(ctx, P, x => agPolyAt(st.co, x), 500, rgbCss(TH.grad), 2.6);
    const roots = agPolyRoots(st.co, -5, 5);
    for(const r of roots) ctDot(ctx, P, r, 0, 6, rgbCss(TH.pos), rgbCss(TH.bg));
    const rr = agRationalRoots(st.co);
    if(rr) for(const cnd of rr.candidates){
      if(cnd < P.x0 || cnd > P.x1) continue;
      ctDot(ctx, P, cnd, 0, 2.6, rgbCss(TH.faint, 0.8));
    }
    stageNote(ctx, 'small grey dots are the rational-root candidates; the large ones are actual roots', W, H);
  },
  derive(st){
    const roots = agPolyRoots(st.co, -6, 6);
    const r = roots.length ? roots[0] : 1;
    const H0 = agHorner(st.co, r);
    const n = v => fmtNum(v, 4);
    return {
      title:'The factor theorem, and why synthetic division is just evaluation',
      steps:[
        drvStep('divide p(x) by (x − r) — any polynomial, any r',
          `${dv('p')}(${dv('x')}) ${dop('=')} (${dv('x')} ${dop('−')} ${dv('r')})${dv('q')}(${dv('x')}) ${dop('+')} ${dv('R')}`,
          'the remainder R is a constant, because the divisor has degree 1'),
        drvStep('now put x = r',
          `${dv('p')}(${dv('r')}) ${dop('=')} (${dv('r')} ${dop('−')} ${dv('r')})${dv('q')}(${dv('r')}) ${dop('+')} ${dv('R')} ${dop('=')} ${dv('R')}`,
          `at r = ${n(r)}:  p(r) = ${n(agPolyAt(st.co, r))},  and the division leaves R = ${n(H0.remainder)}`),
        drvSay('so the two are the same operation',
          'The remainder on dividing by (x − r) <em>is</em> p(r). That is the remainder theorem, and the factor theorem is the special case R = 0: r is a root exactly when (x − r) divides p. Synthetic division and evaluating at r are not two techniques — they are the same arithmetic written two ways, which is why Horner\'s scheme does both at once.'),
        drvStep('when R = 0 the factor comes out',
          `${dv('p')}(${dv('x')}) ${dop('=')} (${dv('x')} ${dop('−')} ${dv('r')})${dv('q')}(${dv('x')})`,
          H0.quotient.length
            ? 'quotient coefficients: ' + H0.quotient.map(c => n(c)).join(', ')
            : ''),
        drvSay('and then you repeat',
          'The quotient has degree one less, so the same move applies again. Peeling roots off one at a time is how factoring actually works — and the fundamental theorem of algebra guarantees you can always keep going, provided you allow complex roots.'),
        drvSay('and with real coefficients the complex roots have to arrive in pairs',
          'Take the conjugate of p(r) = 0. Conjugation leaves every real coefficient alone and turns r into r̄, so p(r̄) = 0 as well: a non-real root drags its mirror image in with it. That is why a real polynomial of odd degree always has at least one real root — an odd count cannot be made entirely of pairs — and why real factorisations bottom out in quadratics rather than linear factors. It is also the reason an oscillating solution in the ODE wing always comes as a conjugate pair of exponentials that recombine into a real sine.'),
        drvSay('a warning about the roots the panel prints',
          'They were found numerically, and the roots of a polynomial can be violently sensitive to its coefficients: Wilkinson\'s famous example has twenty well-separated roots, and moving one coefficient by a part in 2³² sends several of them off into the complex plane. So a printed root is an answer about the coefficients as typed, not about the ones you meant. Nearby roots are the worst case, because the polynomial is nearly flat between them and "nearly flat" is exactly where a small vertical error becomes a large horizontal one.')
      ],
      note:'Degree ' + (st.co.length - 1) + ' means at most ' + (st.co.length - 1) +
        ' roots, counted with multiplicity. Over the reals you may find fewer; over the complex numbers you always find exactly that many, which is the fundamental theorem of algebra.'
    };
  },
  readout(st){
    const roots = agPolyRoots(st.co, -6, 6);
    const rr = agRationalRoots(st.co);
    return `<div class="card tight"><div class="ttl">Roots found by search</div>
      ${kv('degree', st.co.length - 1)}
      ${kv('real roots found', roots.length)}
      ${roots.map((r, i) => kv('  r' + (i + 1), fmtNum(r, 6) + '   p(r) = ' + fmtNum(agPolyAt(st.co, r), 3))).join('')}
      <p class="help">Each root is located by bisecting a sign change, then p is evaluated there —
      so the second column is the evidence rather than a restatement.</p>
    </div>
    ${rr ? `<div class="card tight"><div class="ttl">The rational-root theorem</div>
      ${kv('candidates p/q', rr.candidates.length)}
      ${kv('of which actually roots', rr.actual.length)}
      ${kv('the ones that work', rr.actual.length ? rr.actual.map(v => fmtNum(v, 4)).join(',  ') : 'none — every root here is irrational')}
      <p class="help">The theorem narrows an infinite search to ${rr.candidates.length} numbers.
      When none of them works, that is informative: the roots exist but are irrational, and no amount
      of clever factoring by hand will find them.</p>
    </div>` : ''}`;
  },
  chip(st){
    const roots = agPolyRoots(st.co, -6, 6);
    return `<div class="k">polynomial</div><div>degree ${st.co.length - 1}</div>
      <div style="color:var(--c-pos)">${roots.length} real root${roots.length === 1 ? '' : 's'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'p(x)'], ['var(--c-pos)', 'real roots'],
                    ['var(--faint)', 'rational-root candidates']]; },
  dockLegend:true
};
