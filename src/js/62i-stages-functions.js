/* ============================================================================
   4w · FUNCTIONS — transformations, inverses, exponentials and logarithms
   The bridge from algebra to calculus: what a function *is*, what you may do to
   one, and which ones can be undone.
   ============================================================================ */

STAGES.agTransform = {
  title:'Transformations of a graph',
  drag:true,
  enter(st, o){
    st.key = o.key || 'sq';
    st.A = 1; st.k = 1; st.h = 0; st.v = 0;
  },
  controls(){
    const st = ST;
    return pkSeg('atK', AG_FUNCS, st.key, e => e.n) + pkBoxes('agown', st.key, st, AG_OWN, null) +
      ctlRow('A — vertical stretch', ctlSlider('atA', -3, 3, 0.05, st.A)) +
      ctlRow('k — horizontal squeeze', ctlSlider('atW', -3, 3, 0.05, st.k)) +
      ctlRow('h — shift right', ctlSlider('atH', -4, 4, 0.05, st.h)) +
      ctlRow('v — shift up', ctlSlider('atV', -4, 4, 0.05, st.v)) +
      `<p class="help">Every transformation you will ever apply to a graph is one of four, and they
      all live in <b>y = A·f(k(x − h)) + v</b>. Drag them and watch which ones behave as you expect
      and which do not.</p>
      <p class="help">The two <i>outside</i> the function (A and v) do what they look like. The two
      <i>inside</i> (k and h) do the opposite: <b>x − h moves the graph right</b>, and larger k
      <b>squeezes</b> rather than stretches. That inversion catches everyone, and the derivation
      below says exactly why it has to happen.</p>`;
  },
  wire(){
  ctWireSeg('atK', v => { ST.key = v; });
    pkWireBoxes('agown', ST.key, ST, AG_OWN, null);
    wireSlider('atA', () => ST.A, v => { ST.A = v; }, v => fmtNum(+v, 3));
    wireSlider('atW', () => ST.k, v => { ST.k = v; }, v => fmtNum(+v, 3));
    wireSlider('atH', () => ST.h, v => { ST.h = v; }, v => fmtNum(+v, 3));
    wireSlider('atV', () => ST.v, v => { ST.v = v; }, v => fmtNum(+v, 3));
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.h = st.P.invX(sx); st.v = st.P.invY(sy);
    buildStagePanel();
  },
  frame(st, dt, ctx, W, H){
    const F = agCur(st).f;
    const g = x => st.A * F(st.k * (x - st.h)) + st.v;
    /* Both curves are framed, not just the transformed one: the whole point of
       the picture is the comparison, and a window that fits g while cutting f
       in half compares nothing. The anchor (h, v) is pinned in because it is
       what the reader drags, and a handle outside the frame cannot be grabbed. */
    const P = mkPlotFit(80, 55, W - 160, H - 145, -7, 7, [F, g],
      { include:[0, st.v], minSpan:4 });
    st.P = P;
    plotFrame(ctx, P, 'x', 'y', 'y = A·f(k(x − h)) + v   —   drag to move (h, v)');
    ctGrid(ctx, P);
    plotZeroY(ctx, P);
    plotCurve(ctx, P, F, 500, rgbCss(TH.faint), 1.8);
    plotCurve(ctx, P, g, 500, rgbCss(TH.grad), 2.8);
    ctDot(ctx, P, st.h, st.v, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    /* one point followed through the transformation, so it is a map not a wobble */
    const x0 = 1;
    ctDot(ctx, P, x0, F(x0), 5, rgbCss(TH.neg), rgbCss(TH.bg));
    const x1 = st.h + x0 / (st.k || 1);
    ctDot(ctx, P, x1, g(x1), 5, rgbCss(TH.pos), rgbCss(TH.bg));
    ctPath(ctx, P, [{ x:x0, y:F(x0) }, { x:x1, y:g(x1) }], rgbCss(TH.curl, 0.7), 1.4, [4, 4]);
    stageNote(ctx, 'the faint curve is f itself; the dashed line follows one point through the transformation', W, H);
  },
  derive(st){
    const n = v => fmtNum(v, 3);
    return {
      title:'Why inside and outside behave oppositely',
      steps:[
        drvStep('the transformed function',
          `${dv('y')} ${dop('=')} ${dv('A')}·${dv('f')}(${dv('k')}(${dv('x')} ${dop('−')} ${dv('h')})) ${dop('+')} ${dv('v')}`,
          `A = ${n(st.A)}, k = ${n(st.k)}, h = ${n(st.h)}, v = ${n(st.v)}`),
        drvSay('outside is easy',
          'A multiplies the output and v adds to it, so the picture is stretched vertically and lifted. Nothing surprising: whatever f produced, you scale it and raise it — the function has already finished its work by the time A and v get hold of the answer.'),
        drvStep('inside, ask which x gives the old input',
          `${dv('k')}(${dv('x')} ${dop('−')} ${dv('h')}) ${dop('=')} ${dv('u')} ${dop('⇒')} ${dv('x')} ${dop('=')} ${dv('h')} ${dop('+')} ${dfrac(dv('u'), dv('k'))}`,
          `to reach the old input u = 1 you must now stand at x = ${n(st.h + 1 / (st.k || 1))}`),
        drvSay('and there is the inversion',
          'The new graph shows at x whatever the old one showed at k(x − h). So to <em>see</em> a feature you must move to where the argument matches — right by h, and closer in by a factor of k. The transformation acts on the input, and reading a graph means solving for the input, which reverses it.'),
        drvStep('the point being followed on screen',
          `(1, ${dv('f')}(1)) ${dop('↦')} (${dv('h')} ${dop('+')} 1/${dv('k')},  ${dv('A')}${dv('f')}(1) ${dop('+')} ${dv('v')})`,
          `(1, ${n(agCur(st).f(1))})  ↦  (${n(st.h + 1 / (st.k || 1))}, ${n(st.A * agCur(st).f(1) + st.v)})`),
        drvSay('the order matters, and this is where most of the mistakes live',
          'f(k(x − h)) and f(kx − h) are different functions. The first shifts by h and then scales about the new position; the second scales first, which drags the shift to h/k. Writing the inside <b>factored</b> — k times a bracket — is not tidiness, it is what makes h readable as a distance on the axis. Whenever a transformation "does not go where it should", the inside is almost always unfactored.'),
        drvSay('and this is the substitution rule, three wings early',
          'Replacing x by k(x − h) inside a function is exactly the substitution u = k(x − h) that the integration wing performs, and the factor of 1/k that appears there — the du = k dx — is the same 1/k that squeezes the picture here. The Jacobian in the change-of-variables stage is this idea in two dimensions, and the Fourier scaling theorem, that stretching a signal in time squeezes its spectrum, is this idea again. One reversal, met four times.')
      ],
      note:'A negative A flips the graph vertically; a negative k flips it horizontally. Both are just the general rule with a sign, not extra cases to memorise.'
    };
  },
  readout(st){
    const F = agCur(st).f;
    return `<div class="card tight"><div class="ttl">The four transformations</div>
      ${kv('A — vertical stretch', fmtNum(st.A, 4) + (st.A < 0 ? '  (and a flip)' : ''))}
      ${kv('k — horizontal factor', fmtNum(st.k, 4) + (Math.abs(st.k) > 1 ? '  (squeeze)' : '  (stretch)'))}
      ${kv('h — horizontal shift', fmtNum(st.h, 4) + (st.h > 0 ? '  right' : st.h < 0 ? '  left' : ''))}
      ${kv('v — vertical shift', fmtNum(st.v, 4))}
      ${kv('f(1)', fmtNum(F(1), 5))}
      ${kv('the image of that point', fmtNum(st.A * F(1) + st.v, 5))}
    </div>
    <div class="card tight"><div class="ttl">Where you meet this again</div>
      <p class="help">This one form covers the amplitude, frequency and phase of a wave; the shift
      theorems of the Fourier and Laplace wings; and the change of variables in an integral, which
      is the same substitution with the Jacobian keeping track of how k stretches the measure.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">transformation</div><div>A=${fmtNum(st.A, 3)}  k=${fmtNum(st.k, 3)}</div>
      <div style="color:var(--c-warn)">(h, v) = (${fmtNum(st.h, 2)}, ${fmtNum(st.v, 2)})</div>`;
  },
  legend(){ return [['var(--faint)', 'f, untransformed'], ['var(--c-grad)', 'the transformed graph'],
                    ['var(--c-neg)', 'a point of f'], ['var(--c-pos)', 'where it goes'],
                    ['var(--c-warn)', '(h, v)']]; },
  dockLegend:true
};

/* ---- 2 · inverses --------------------------------------------------------- */
STAGES.agInverse = {
  title:'Inverse functions',
  drag:true,
  enter(st, o){
    st.key = o.key || 'cube';
    st.x = o.x === undefined ? 1.2 : o.x;
    st.restrict = false;
  },
  controls(){
    const st = ST;
    return pkSeg('aiK', AG_FUNCS, st.key, e => e.n) + pkBoxes('agown', st.key, st, AG_OWN, null) +
      ctChk('aiR', 'restrict the domain to x ≥ 0', st.restrict) +
      ctlRow('x', ctlSlider('aiX', -3, 3, 0.01, st.x)) +
      `<p class="help">An inverse exists exactly when the function is <b>one-to-one</b> — when no
      output is produced twice. The panel tests that by walking the curve and counting how often it
      rises and how often it falls; a function that does both is not invertible, and the horizontal
      line drawn on the graph shows you the two inputs that collide.</p>
      <p class="help">The inverse's graph is the original <b>reflected in y = x</b>, and the reason
      is exactly one line of algebra, below. Restricting the domain is how sin, x² and the rest get
      inverses at all — arcsin is not the inverse of sine, it is the inverse of sine-on-[−π/2, π/2].</p>`;
  },
  wire(){
  ctWireSeg('aiK', v => { ST.key = v; });
    pkWireBoxes('agown', ST.key, ST, AG_OWN, null);
    ctWireChk('aiR', v => { ST.restrict = v; });
    wireSlider('aiX', () => ST.x, v => { ST.x = v; }, v => fmtNum(+v, 3));
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.x = st.P.invX(sx);
  },
  frame(st, dt, ctx, W, H){
    const A = agCur(st);
    const lo = st.restrict ? 0.001 : -3;
    const P = ctBox(Math.min(W, H * 1.25), H, 0, 0, 3.4);
    st.P = P;
    ctGrid(ctx, P);
    /* the mirror */
    ctPath(ctx, P, [{ x:-3.4, y:-3.4 }, { x:3.4, y:3.4 }], rgbCss(TH.faint, 0.8), 1.4, [5, 4]);
    ctParam(ctx, P, t => ({ x:t, y:A.f(t) }), lo, 3, 400, rgbCss(TH.grad), 2.6);
    ctParam(ctx, P, t => ({ x:A.f(t), y:t }), lo, 3, 400, rgbCss(TH.curl), 2.6);
    /* the point and its mirror image */
    const y = A.f(st.x);
    if(Number.isFinite(y)){
      ctDot(ctx, P, st.x, y, 6, rgbCss(TH.pos), rgbCss(TH.bg));
      ctDot(ctx, P, y, st.x, 6, rgbCss(TH.neg), rgbCss(TH.bg));
      ctPath(ctx, P, [{ x:st.x, y }, { x:y, y:st.x }], rgbCss(TH.warn, 0.8), 1.4, [4, 4]);
      /* the horizontal line test */
      const oneToOne = agOneToOne(A.f, lo, 3, 500).monotone;
      if(!oneToOne) ctPath(ctx, P, [{ x:-3.4, y }, { x:3.4, y }], rgbCss(TH.warn, 0.5), 1.4, [3, 3]);
    }
    ctFrame(ctx, P, A.n + '  and its reflection in y = x');
    stageNote(ctx, 'the dashed diagonal is the mirror — an inverse is the same curve seen from the other axis', W, H);
  },
  derive(st){
    const A = agCur(st);
    const lo = st.restrict ? 0.001 : -3;
    const oo = agOneToOne(A.f, lo, 3, 500);
    const y = A.f(st.x);
    const n = v => fmtNum(v, 4);
    return {
      title:'Why the inverse is a reflection',
      steps:[
        drvStep('the defining property',
          `${dv('f')}<sup>−1</sup>(${dv('f')}(${dv('x')})) ${dop('=')} ${dv('x')}  ${dop('and')}  ${dv('f')}(${dv('f')}<sup>−1</sup>(${dv('y')})) ${dop('=')} ${dv('y')}`,
          `f(${n(st.x)}) = ${n(y)},  and f⁻¹ of that returns ${n(A.inv(y))}`),
        drvStep('so a point of f is a point of f⁻¹ with the coordinates swapped',
          `(${dv('a')}, ${dv('b')}) ${dop('∈')} ${dv('f')} ${dop('⟺')} (${dv('b')}, ${dv('a')}) ${dop('∈')} ${dv('f')}<sup>−1</sup>`,
          `(${n(st.x)}, ${n(y)})   ↦   (${n(y)}, ${n(st.x)})`),
        drvSay('and swapping coordinates IS reflecting in y = x',
          'The map (a, b) ↦ (b, a) fixes every point of the line y = x and exchanges the two sides of it. So the graph of the inverse is the graph of the function seen in that mirror — not a new curve to plot, the same curve read along the other axis.'),
        drvStep('which is why one-to-one is required',
          `${dv('f')}(${dv('x')}<sub>1</sub>) ${dop('=')} ${dv('f')}(${dv('x')}<sub>2</sub>) ${dop('⇒')} ${dv('x')}<sub>1</sub> ${dop('=')} ${dv('x')}<sub>2</sub>`,
          oo.monotone ? 'monotone on this domain — the inverse exists'
                      : `it rises ${oo.rising} times and falls ${oo.falling} times, so some height is hit twice and the reflection fails the vertical line test`),
        drvSay(oo.monotone ? 'and it does' : 'and it fails here',
          oo.monotone
            ? 'Reflecting a curve that passes the horizontal line test gives one that passes the vertical line test — which is the condition for being a function at all.'
            : 'Reflect a curve that fails the horizontal line test and you get something that fails the <em>vertical</em> line test: two outputs above one input. That is not a function, which is why the domain must be restricted first. Tick the box and watch the reflection become legal.'),
        drvSay('the reflection swaps the domain and the range, which is the part people forget',
          'A function\'s domain is what it will accept and its range is what it produces. Reflecting exchanges the axes, so the inverse accepts exactly what the original produced and produces exactly what the original accepted. That is why √x is defined only for x ≥ 0 — because x² produced only non-negative numbers — and why the restriction on sin is what makes arcsin\'s range [−π/2, π/2] rather than an arbitrary choice. A domain and a range are not decoration attached to a formula; for an inverse they are the whole content.'),
        drvSay('and it explains why so few functions have inverses in closed form',
          'Reflecting a curve is trivial. Writing down a formula for the reflected curve is a different problem entirely — it means solving y = f(x) for x, and most equations cannot be solved that way. The inverse of x + sin x exists, is perfectly well behaved and is monotone; there is simply no expression for it. That gap is why Newton\'s method exists, and why this stage inverts a typed function by <b>bisection</b> rather than by algebra: the picture is always available even when the formula is not.')
      ],
      note:'This is why arcsin has range [−π/2, π/2] and √x is defined non-negative: the restriction is not a convention but the price of having an inverse at all.'
    };
  },
  readout(st){
    const A = agCur(st);
    const lo = st.restrict ? 0.001 : -3;
    const oo = agOneToOne(A.f, lo, 3, 600);
    const y = A.f(st.x);
    const back = A.inv(y);
    return `<div class="card tight"><div class="ttl">At x = ${fmtNum(st.x, 4)}</div>
      ${kv('f(x)', fmtNum(y, 6))}
      ${kv('f⁻¹(f(x))', fmtNum(back, 6))}
      ${kv('difference from x', fmtNum(Math.abs(back - st.x), 3))}
      <p class="help">${Math.abs(back - st.x) < 1e-6
        ? 'The round trip returns where it started, which is the whole definition.'
        : 'The round trip does <b>not</b> return where it started — the inverse has sent you to the other branch, because this function is not one-to-one here.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Is it invertible?</div>
      ${kv('domain tested', st.restrict ? '[0, 3]' : '[−3, 3]')}
      ${kv('rises', oo.rising)}${kv('falls', oo.falling)}
      ${kv('monotone?', oo.monotone ? 'yes — an inverse exists' : '<b>no</b> — no inverse on this domain')}
      <p class="help">The horizontal line test, executed rather than eyeballed: the curve is walked
      and its direction changes are counted. A function that both rises and falls must repeat a
      value somewhere in between, by the intermediate value theorem.</p>
    </div>`;
  },
  chip(st){
    const A = agCur(st);
    const oo = agOneToOne(A.f, st.restrict ? 0.001 : -3, 3, 400);
    return `<div class="k">inverse</div><div>${A.n}</div>
      <div style="color:${oo.monotone ? 'var(--c-grad)' : 'var(--c-pos)'}">${oo.monotone ? 'invertible' : 'not one-to-one'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'f'], ['var(--c-curl)', 'f⁻¹'],
                    ['var(--faint)', 'the mirror y = x'], ['var(--c-warn)', 'the horizontal line test']]; },
  dockLegend:true
};

/* ---- 3 · exponentials and logarithms -------------------------------------- */
STAGES.agLog = {
  title:'Exponentials & logarithms',
  drag:true,
  enter(st, o){
    st.b = o.b === undefined ? 2 : o.b;
    st.x = o.x === undefined ? 3 : o.x;
    st.y = o.y === undefined ? 5 : o.y;
    st.view = o.view || 'graph';
  },
  controls(){
    const st = ST;
    return ctSeg('alV', st.view, [['graph', 'the two graphs'], ['laws', 'the three laws']]) +
      ctlRow('base b', ctlSlider('alB', 1.2, 6, 0.01, st.b)) +
      ctlRow('x', ctlSlider('alX', 0.2, 9, 0.01, st.x)) +
      ctlRow('y', ctlSlider('alY', 0.2, 9, 0.01, st.y)) +
      `<p class="help">A logarithm is not a new operation — it is the <b>inverse of an exponential</b>,
      and every one of its laws is an exponent law wearing different clothes. The derivation below
      turns b<sup>m</sup>·b<sup>n</sup> = b<sup>m+n</sup> into log(xy) = log x + log y in three lines,
      with your own x and y carried through.</p>
      <p class="help">That single fact — turning multiplication into addition — is why logarithms were
      invented, why slide rules worked, why decibels and pH and stellar magnitudes are logarithmic,
      and why a log axis turns a power law into a straight line whose slope is the exponent.</p>`;
  },
  wire(){
    ctWireSeg('alV', v => { ST.view = v; });
    wireSlider('alB', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('alX', () => ST.x, v => { ST.x = v; }, v => fmtNum(+v, 3));
    wireSlider('alY', () => ST.y, v => { ST.y = v; }, v => fmtNum(+v, 3));
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.x = Math.max(0.2, Math.min(9, st.P.invX(sx)));
  },
  frame(st, dt, ctx, W, H){
    const b = st.b;
    if(st.view === 'laws'){
      /* the addition picture: two lengths on a log axis add to the product */
      const P = mkPlot(80, 70, W - 160, H - 170, 0, 10, -1, 3);
      st.P = P;
      plotFrame(ctx, P, 'value', 'log_b', 'multiplying values adds their logarithms');
      ctGrid(ctx, P);
      plotZeroY(ctx, P);
      plotCurve(ctx, P, v => (v > 0 ? agLogBase(v, b) : NaN), 500, rgbCss(TH.grad), 2.4);
      const lx = agLogBase(st.x, b), ly = agLogBase(st.y, b), lxy = agLogBase(st.x * st.y, b);
      [[st.x, lx, TH.pos, 'x'], [st.y, ly, TH.neg, 'y'], [st.x * st.y, lxy, TH.warn, 'xy']]
        .forEach(([v, l, col, nm]) => {
          if(v > P.x1) return;
          ctPath(ctx, P, [{ x:v, y:0 }, { x:v, y:l }], rgbCss(col), 2.2);
          ctDot(ctx, P, v, l, 5, rgbCss(col), rgbCss(TH.bg));
          ctText(ctx, P.X(v) + 6, P.Y(l) - 6, nm, rgbCss(col), '600 11px ' + FONT_UI);
        });
      stageNote(ctx, 'the bar over xy is exactly as tall as the other two stacked — that is the product law', W, H);
      return;
    }
    const P = ctBox(Math.min(W, H * 1.25), H, 2, 2, 5);
    st.P = P;
    ctGrid(ctx, P);
    ctPath(ctx, P, [{ x:-3, y:-3 }, { x:7, y:7 }], rgbCss(TH.faint, 0.7), 1.4, [5, 4]);
    ctParam(ctx, P, t => ({ x:t, y:Math.pow(b, t) }), -3, 3.2, 300, rgbCss(TH.grad), 2.6);
    ctParam(ctx, P, t => ({ x:Math.pow(b, t), y:t }), -3, 3.2, 300, rgbCss(TH.curl), 2.6);
    const lx = agLogBase(st.x, b);
    ctDot(ctx, P, st.x, lx, 6, rgbCss(TH.pos), rgbCss(TH.bg));
    ctDot(ctx, P, lx, st.x, 6, rgbCss(TH.neg), rgbCss(TH.bg));
    ctFrame(ctx, P, 'y = b^x  and  y = log_b x — reflections of each other');
    stageNote(ctx, 'the exponential never reaches zero, so its mirror never reaches the left of the origin — that is the domain of a log', W, H);
  },
  derive(st){
    const b = st.b, n = v => fmtNum(v, 5);
    const L = v => agLogBase(v, b);
    return {
      title:'The product law, derived from the exponent law',
      steps:[
        drvStep('name the logarithms',
          `${dfn('let')} ${dv('m')} ${dop('=')} log<sub>b</sub> ${dv('x')},  ${dv('n')} ${dop('=')} log<sub>b</sub> ${dv('y')}`,
          `m = ${n(L(st.x))},  n = ${n(L(st.y))}`),
        drvStep('which is to say',
          `${dv('b')}<sup>m</sup> ${dop('=')} ${dv('x')},  ${dv('b')}<sup>n</sup> ${dop('=')} ${dv('y')}`,
          `${n(b)}^${n(L(st.x))} = ${n(st.x)},   ${n(b)}^${n(L(st.y))} = ${n(st.y)}`),
        drvStep('multiply, and use the exponent law',
          `${dv('x')}${dv('y')} ${dop('=')} ${dv('b')}<sup>m</sup>${dv('b')}<sup>n</sup> ${dop('=')} ${dv('b')}<sup>m+n</sup>`,
          `${n(st.x)} × ${n(st.y)} = ${n(st.x * st.y)} = ${n(b)}^${n(L(st.x) + L(st.y))}`),
        drvStep('take the logarithm of both sides',
          `log<sub>b</sub>(${dv('x')}${dv('y')}) ${dop('=')} ${dv('m')} ${dop('+')} ${dv('n')} ${dop('=')} log<sub>b</sub> ${dv('x')} ${dop('+')} log<sub>b</sub> ${dv('y')}`,
          `${n(L(st.x * st.y))} = ${n(L(st.x))} + ${n(L(st.y))} = ${n(L(st.x) + L(st.y))}`),
        drvSay('that is the whole proof',
          'The logarithm law is not an independent fact to memorise — it is b<sup>m</sup>b<sup>n</sup> = b<sup>m+n</sup> read backwards. The quotient and power laws come out of the other two exponent laws in exactly the same three lines, which is why there are three of each.'),
        drvSay('and the reason anyone wanted it',
          'Napier published in 1614 to make multiplication cheap: look up two logarithms, add them, look the answer back up. That is what a table of logarithms was for, and what a slide rule mechanically is — two logarithmic scales that add lengths. Three centuries of astronomy and navigation ran on it. The law is not a curiosity of the function; it is the reason the function was invented, and everything else logarithms do was discovered afterwards.'),
        drvSay('the change of base says every logarithm is the same shape',
          'Dividing by ln b is multiplying by a constant, so log₂, log₁₀ and ln are the same curve at three vertical scales — there is really only one logarithm. What the base picks is the unit: log₂ counts doublings, so it measures bits; log₁₀ counts orders of magnitude, so it measures decibels and pH; ln counts e-foldings, which is the unit in which the derivative comes out as 1/x with no leftover constant. Choosing a base is choosing what a step of 1 should mean.'),
        drvStep('and the change of base, the same way',
          `log<sub>b</sub> ${dv('x')} ${dop('=')} ${dfrac('ln ' + dv('x'), 'ln ' + dv('b'))}`,
          `${n(L(st.x))} = ${n(Math.log(st.x))} / ${n(Math.log(b))}`)
      ],
      note:'Turning multiplication into addition is the reason logarithms exist. It is also why the calculus wing finds d(ln x)/dx = 1/x so useful, and why the natural base e is the one where that derivative has no leftover constant.'
    };
  },
  readout(st){
    const b = st.b;
    const laws = agLogLaws(st.x, st.y, b);
    const row = (n, o) => kv(n, fmtNum(o.lhs, 6) + '   vs   ' + fmtNum(o.rhs, 6) +
      '   (Δ = ' + fmtNum(Math.abs(o.lhs - o.rhs), 2) + ')');
    return `<div class="card tight"><div class="ttl">The three laws, checked at your x and y</div>
      ${row('log(xy) = log x + log y', laws.product)}
      ${row('log(x/y) = log x − log y', laws.quotient)}
      ${row('log(x³) = 3 log x', laws.power)}
      ${row('change of base', laws.change)}
      <p class="help">Each row computes both sides independently and prints the difference. They are
      identities, so the difference is zero to machine precision for every x, y and b you can
      choose — which is a stronger statement than checking one example.</p>
    </div>
    <div class="card tight"><div class="ttl">Base ${fmtNum(b, 4)}</div>
      ${kv('log_b x', fmtNum(agLogBase(st.x, b), 6))}
      ${kv('b^(log_b x)', fmtNum(Math.pow(b, agLogBase(st.x, b)), 6))}
      ${kv('x', fmtNum(st.x, 6))}
      ${kv('why the domain is x > 0', 'b^t is always positive, so nothing maps to a negative')}
      <p class="help">The exponential has a horizontal asymptote at zero it never touches; reflect
      that and you get a vertical asymptote at zero the logarithm never touches. The domain
      restriction is inherited from the range of the function being inverted.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">log base ${fmtNum(st.b, 3)}</div>
      <div style="color:var(--c-pos)">log x = ${fmtNum(agLogBase(st.x, st.b), 4)}</div>
      <div>x = ${fmtNum(st.x, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'b^x'], ['var(--c-curl)', 'log_b x'],
                    ['var(--faint)', 'the mirror y = x'], ['var(--c-warn)', 'the product xy']]; },
  dockLegend:true
};
