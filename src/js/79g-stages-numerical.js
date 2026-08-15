/* ============================================================================
   4z · NUMERICAL METHODS
   Most of this laboratory already computes rather than quotes, so this wing
   turns the machinery around and studies the machinery itself: how fast a
   method converges, when it fails, and what floating point costs.
   ============================================================================ */

/* The reader's own f. A preset carries a hand-checked derivative and a root
   quoted to full precision; a typed one has neither, so both are produced —
   the derivative symbolically from the same differentiator the calculus wing
   uses, and the root by bisection, which cannot fail on a sign change and so
   makes an honest reference for Newton to be measured against. */
const NM_OWN = [{ k:'f', label:'f(x) =', vars:'x', def:'x^3-2x-5' }];
const NM_BOUNDS = [{ k:'lo', label:'search from', def:-3 }, { k:'hi', label:'to', def:3 }];
function nmCur(st){
  if(st.key !== 'custom') return NM_FUNCS[st.key];
  const own = pkOwn(st, 'nmown', NM_OWN, NM_BOUNDS);
  let f, d;
  try {
    const a = parse(own.f), g = compile(a), gd = compile(diff(a, 'x'));
    f = x => g(x, 0, 0); d = x => gd(x, 0, 0);
  } catch(e){ f = () => 0; d = () => 0; }
  const lo = +own.lo, hi = +own.hi;
  return { n:'f(x) = ' + own.f, f, d, lo, hi, root:nmOwnRoot(f, lo, hi) };
}
/* Bisection to machine precision on the first sign change found in the window.
   Returned as NaN rather than a guess when there is none — a stage must be able
   to say "no root bracketed here" instead of printing a fiction. */
function nmOwnRoot(f, lo, hi){
  const N = 400, h = (hi - lo) / N;
  let a = NaN, b = NaN, fa = f(lo);
  for(let i = 1; i <= N; i++){
    const x = lo + i * h, fx = f(x);
    if(Number.isFinite(fa) && Number.isFinite(fx) && fa * fx <= 0 && fa !== 0){ a = x - h; b = x; break; }
    fa = fx;
  }
  if(!Number.isFinite(a)) return NaN;
  for(let i = 0; i < 200; i++){
    const m = (a + b) / 2;
    if(f(a) * f(m) <= 0) b = m; else a = m;
  }
  return (a + b) / 2;
}
const NM_FUNCS = {
  cubic: { n:'x³ − 2x − 5', f:x => x * x * x - 2 * x - 5, d:x => 3 * x * x - 2, lo:1, hi:3, root:2.0945514815423265 },
  cosx:  { n:'cos x − x',   f:x => Math.cos(x) - x,       d:x => -Math.sin(x) - 1, lo:0, hi:1.5, root:0.7390851332151607 },
  flat:  { n:'x³ (a triple root)', f:x => x * x * x,      d:x => 3 * x * x,      lo:-1, hi:1.4, root:0 },
  steep: { n:'atan x (Newton diverges)', f:Math.atan,     d:x => 1 / (1 + x * x), lo:-8, hi:8, root:0 }
};

STAGES.nmRoot = {
  title:'Root finding, and how fast',
  enter(st, o){
    st.key = o.key || 'cubic';
    st.method = o.method || 'newton';
    st.x0 = o.x0 === undefined ? 3 : o.x0;
    st.steps = o.steps || 5;
  },
  controls(){
    const st = ST;
    return pkSeg('nrK', NM_FUNCS, st.key, e => e.n) + pkBoxes('nmown', st.key, st, NM_OWN, NM_BOUNDS) +
      ctSeg('nrM', st.method, [['bisect', 'bisection'], ['newton', 'Newton'], ['secant', 'secant']]) +
      ctlRow('start x₀', ctlSlider('nrX', -8, 8, 0.05, st.x0)) +
      ctlRow('steps', ctlSlider('nrN', 1, 12, 1, st.steps)) +
      `<p class="help">Three methods for the same job, with the error after every step printed. The
      interesting column is the last one: <b>how the error at each step compares with the one
      before</b>. Bisection halves it every time — linear. Newton <i>squares</i> it — quadratic,
      which means the number of correct digits doubles per step.</p>
      <p class="help">Choose <b>atan x</b> and start beyond about 1.4: Newton overshoots further
      each time and runs away. Quadratic convergence is a local promise, not a global one — and
      bisection, the slowest method, is the only one of the three that cannot fail once it has
      bracketed a root.</p>`;
  },
  wire(){
    ctWireSeg('nrK', v => { ST.key = v; const C = nmCur(ST); ST.x0 = (C.lo + C.hi) / 2; });
    pkWireBoxes('nmown', ST.key, ST, NM_OWN, NM_BOUNDS, () => { const C = nmCur(ST); ST.x0 = Math.min(Math.max(ST.x0, C.lo), C.hi); });
    ctWireSeg('nrM', v => { ST.method = v; });
    wireSlider('nrX', () => ST.x0, v => { ST.x0 = v; }, v => fmtNum(+v, 3));
    wireSlider('nrN', () => ST.steps, v => { ST.steps = Math.round(v); }, v => String(Math.round(+v)));
  },
  iterate(st){
    const F = nmCur(st);
    const out = [];
    if(st.method === 'bisect'){
      let a = F.lo, b = F.hi;
      if(F.f(a) * F.f(b) > 0) return { rows:[], bad:'the bracket does not straddle a root' };
      for(let i = 0; i < st.steps; i++){
        const m = (a + b) / 2;
        out.push({ x:m, err:Math.abs(m - F.root) });
        if(F.f(a) * F.f(m) <= 0) b = m; else a = m;
      }
    } else if(st.method === 'newton'){
      let x = st.x0;
      for(let i = 0; i < st.steps; i++){
        const d = F.d(x);
        if(!Number.isFinite(d) || Math.abs(d) < 1e-14) break;
        x = x - F.f(x) / d;
        if(!Number.isFinite(x) || Math.abs(x) > 1e8) { out.push({ x, err:Infinity, blown:true }); break; }
        out.push({ x, err:Math.abs(x - F.root) });
      }
    } else {
      let x0 = st.x0, x1 = st.x0 + 0.6;
      for(let i = 0; i < st.steps; i++){
        const f0 = F.f(x0), f1 = F.f(x1);
        if(Math.abs(f1 - f0) < 1e-15) break;
        const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
        if(!Number.isFinite(x2) || Math.abs(x2) > 1e8){ out.push({ x:x2, err:Infinity, blown:true }); break; }
        out.push({ x:x2, err:Math.abs(x2 - F.root) });
        x0 = x1; x1 = x2;
      }
    }
    return { rows:out };
  },
  frame(st, dt, ctx, W, H){
    const F = nmCur(st);
    const It = this.iterate(st);
    /* The x-window is already derived from the function; the y-window was not,
       and a fixed ±6 cut off nearly half of several of the presets. A root
       finder's picture is worth nothing if the curve's crossing is off-frame,
       so the axis is pinned in and the rest is fitted. */
    const P = mkPlotFit(80, 55, W * 0.55, H - 145, F.lo - 1, F.hi + 1, F.f,
      { include:[0], minSpan:2 });
    st.P = P;
    plotFrame(ctx, P, 'x', 'f(x)', F.n);
    ctGrid(ctx, P); plotZeroY(ctx, P);
    plotCurve(ctx, P, F.f, 500, rgbCss(TH.grad), 2.4);
    ctDot(ctx, P, F.root, 0, 6, rgbCss(TH.pos), rgbCss(TH.bg));
    /* the iterates, and the tangents Newton actually follows */
    let prev = st.x0;
    It.rows.forEach((r, i) => {
      if(!Number.isFinite(r.x)) return;
      if(st.method === 'newton'){
        const y = F.f(prev);
        ctPath(ctx, P, [{ x:prev, y }, { x:r.x, y:0 }], rgbCss(TH.warn, 0.7), 1.4);
        ctPath(ctx, P, [{ x:prev, y:0 }, { x:prev, y }], rgbCss(TH.faint, 0.6), 1.2, [3, 3]);
      }
      ctDot(ctx, P, r.x, 0, 4, rgbCss(TH.curl), rgbCss(TH.bg));
      prev = r.x;
    });
    /* the error, on a log axis — the shape of the line IS the order */
    const Q = mkPlot(W * 0.62, 55, W * 0.34, H - 145, 0, Math.max(2, st.steps), -16, 2);
    plotFrame(ctx, Q, 'step', 'log₁₀ error', 'straighter and steeper is faster');
    ctGrid(ctx, Q);
    const pts = It.rows.map((r, i) => ({ x:i + 1, y:Math.log10(Math.max(1e-16, r.err)) }))
                       .filter(p => Number.isFinite(p.y));
    ctPath(ctx, Q, pts, rgbCss(TH.curl), 2.4);
    for(const p of pts) ctDot(ctx, Q, p.x, p.y, 3.5, rgbCss(TH.curl));
    stageNote(ctx, 'bisection drops one line per step; Newton doubles its slope each step until it hits machine precision', W, H);
  },
  derive(st){
    const F = nmCur(st);
    const It = this.iterate(st);
    const rows = It.rows;
    const ratio = rows.length > 2 && rows[1].err > 0
      ? rows[2].err / (rows[1].err * rows[1].err) : null;
    return {
      title:'Why Newton squares the error',
      steps:[
        drvStep('expand f about the current guess',
          `${dv('f')}(${dv('x')}*) ${dop('=')} ${dv('f')}(${dv('x')}<sub>n</sub>) ${dop('+')} ${dv('f')}′(${dv('x')}<sub>n</sub>)(${dv('x')}* ${dop('−')} ${dv('x')}<sub>n</sub>) ${dop('+')} ½${dv('f')}″(ξ)(${dv('x')}* ${dop('−')} ${dv('x')}<sub>n</sub>)²`,
          'Taylor with the exact remainder — no approximation yet'),
        drvStep('the left side is zero, because x* is the root',
          `0 ${dop('=')} ${dv('f')}(${dv('x')}<sub>n</sub>) ${dop('+')} ${dv('f')}′(${dv('x')}<sub>n</sub>)${dv('e')}<sub>n</sub> ${dop('+')} ½${dv('f')}″(ξ)${dv('e')}<sub>n</sub>²`,
          `writing e = x* − xₙ for the error`),
        drvSay('Newton throws away exactly one term',
          'The method solves the same equation with the quadratic term dropped — that is the entire approximation. So whatever error is left must be what that discarded term was worth.'),
        drvStep('subtract the two and the linear terms cancel',
          `${dv('e')}<sub>n+1</sub> ${dop('=')} ${dfrac(dv('f')+'″(ξ)', '2'+dv('f')+'′')}·${dv('e')}<sub>n</sub>²`,
          ratio ? `measured ratio e₂/e₁² = ${fmtNum(ratio, 5)}, and f″/2f′ at the root = ${fmtNum(Math.abs(nqD2(F.f, F.root) / (2 * F.d(F.root))), 5)}` : 'take more steps to measure the ratio'),
        drvSay('and that is quadratic convergence',
          'The new error is proportional to the square of the old one, so the number of correct digits doubles at every step. It is also the catch: the constant involves f″/2f′, so a nearly flat derivative near the root makes that constant enormous — and the promise only holds once you are close enough for the Taylor expansion to be any good at all.'),
        drvSay('and at a repeated root the promise is simply void',
          'The derivation divided by f′(x*). At a double root f′ is zero there, that division is illegal, and the whole argument collapses — Newton still converges, but only linearly, halving the error each step instead of squaring it. The symptom is a method that looks broken while behaving exactly as the mathematics says it must. A tangent aimed at a curve that touches the axis rather than crossing it has nothing steep to aim along.'),
        drvSay('the failures that are not about speed at all',
          'Quadratic convergence is a statement about what happens near the root, and says nothing about getting there. Newton can cycle forever between two points, shoot off to infinity where f′ passes through zero, or converge beautifully to a root that is not the one you wanted — all from a starting guess a little too far out. The basins of attraction for a cubic are a fractal, which is the honest picture of how delicate that dependence is. Bisection makes no promise about speed and cannot do any of those things.'),
        drvSay('which is why real solvers use both',
          'Brent\'s method, and everything built on it, keeps a bracket the way bisection does and takes a Newton-like step only when that step lands inside the bracket and is actually reducing the interval — otherwise it bisects. You get the unconditional guarantee from one method and the speed from the other, and the combination is what sits underneath every root-finder in every numerical library.')
      ],
      note:'Bisection makes no such promise and needs none: it only requires a sign change, and it halves the bracket every step no matter how badly behaved f is. Slow and unconditional beats fast and fragile more often than people expect.'
    };
  },
  readout(st){
    const F = nmCur(st);
    const It = this.iterate(st);
    if(It.bad) return `<div class="card tight"><p class="help">${esc(It.bad)}</p></div>`;
    const rows = It.rows;
    return `<div class="card tight"><div class="ttl">The iterates</div>
      ${rows.map((r, i) => kv('step ' + (i + 1),
        (Number.isFinite(r.x) ? fmtNum(r.x, 10) : 'ran away') +
        '   error ' + (Number.isFinite(r.err) ? fmtNum(r.err, 3) : '∞'))).join('')}
      ${kv('the true root', fmtNum(F.root, 12))}
    </div>
    <div class="card tight"><div class="ttl">How the error falls</div>
      ${rows.slice(1).map((r, i) => {
        const prev = rows[i].err, cur = r.err;
        if(!Number.isFinite(prev) || !Number.isFinite(cur) || prev <= 0) return '';
        return kv('e' + (i + 2) + ' / e' + (i + 1), fmtNum(cur / prev, 4) +
          '     e/e² = ' + fmtNum(cur / (prev * prev), 4));
      }).join('')}
      <p class="help">${st.method === 'bisect'
        ? 'The first ratio sits at ½ every step — that is linear convergence, and it is exactly one binary digit per step.'
        : st.method === 'newton'
        ? 'The first ratio keeps shrinking while the second settles on a constant. A settled e/e² <b>is</b> quadratic convergence, and it is the measurement that proves it rather than the claim.'
        : 'The secant method converges at order ≈1.618 — the golden ratio — because it uses two previous points instead of a derivative. Slower than Newton per step, but each step is cheaper.'}</p>
    </div>`;
  },
  chip(st){
    const It = this.iterate(st);
    const last = It.rows[It.rows.length - 1];
    return `<div class="k">${st.method}</div>` +
      (last ? `<div>x = ${Number.isFinite(last.x) ? fmtNum(last.x, 8) : 'diverged'}</div>
        <div style="color:var(--c-curl)">error ${Number.isFinite(last.err) ? fmtNum(last.err, 3) : '∞'}</div>` : '');
  },
  legend(){ return [['var(--c-grad)', 'f(x)'], ['var(--c-pos)', 'the true root'],
                    ['var(--c-curl)', 'the iterates'], ['var(--c-warn)', 'the tangent Newton follows']]; },
  dockLegend:true
};

/* ---- 2 · quadrature order, and floating point ---------------------------- */
/* The integrand whose convergence order is being measured. It was e^(−x²) on
   [0,1] and nothing else, which made one of this stage's own claims unverifiable:
   the derivation says Simpson "quietly drops to about 1.5" on √x at the origin,
   and there was no way to see it happen. Now there is, and a reader can bring
   their own integrand to the same test. */
const NM_QUAD = {
  gauss: { name:'e^(−x²)  on [0, 1]', src:'exp(-x^2)', a:0, b:1,
    note:'Smooth, with every derivative bounded on the interval — the case where each rule achieves exactly its textbook order.' },
  root:  { name:'√x  on [0, 1]', src:'sqrt(x)', a:0, b:1,
    note:'The counterexample the theory needs. f′ is unbounded at the origin, the error analysis assumes it is not, and Simpson collapses from order 4 to about 1.5 — measured here rather than asserted.' },
  osc:   { name:'sin(8x)  on [0, π]', src:'sin(8x)', a:0, b:Math.PI,
    note:'Smooth, but with a short wavelength: the orders are the textbook ones once there are enough panels to resolve the oscillation, and meaningless before that.' },
  spike: { name:'1/(1 + 100x²)  on [−1, 1]', src:'1/(1 + 100x^2)', a:-1, b:1,
    note:'Runge\'s function. Smooth everywhere, and its high derivatives are enormous near the origin, so the constant C in Chᵏ is huge even though k is right.' }
};
const NM_QUAD_OWN = [{ k:'f', label:'f(x) =', vars:'x', def:'x^(1/3)' }];
const NM_QUAD_BOUNDS = [{ k:'a', label:'from', def:0 }, { k:'b', label:'to', def:1 }];
function nmQuadCur(st){
  if(st.q !== 'custom') return NM_QUAD[st.q] || NM_QUAD.gauss;
  const own = pkOwn(st, 'nmq', NM_QUAD_OWN, NM_QUAD_BOUNDS);
  return { name:own.f + '  on [' + fmtNum(+own.a, 4) + ', ' + fmtNum(+own.b, 4) + ']',
    src:own.f, a:+own.a, b:+own.b, custom:true,
    note:'Your integrand. The order below is measured the same way it is for every preset — halve h, take ' +
      'log₂ of the ratio of successive errors — and the "exact" value it is measured against is adaptive ' +
      'quadrature at a tolerance of 10⁻¹³, not a closed form. So if your function is badly behaved the ' +
      'reference is the first thing to distrust, and an order that refuses to settle is telling you that.' };
}
const nmQuadF = st => pkCompile(nmQuadCur(st).src);
STAGES.nmQuad = {
  title:'Quadrature order & floating point',
  enter(st, o){
    st.mode = o.mode || 'order';
    st.rule = o.rule || 'simpson';
    st.q = o.q || 'gauss';
    st.n = o.n || 8;
  },
  controls(){
    const st = ST;
    return ctSeg('nqM', st.mode, [['order', 'measured order'], ['float', 'floating point']]) +
      (st.mode === 'order'
        ? pkSeg('nqQ', NM_QUAD, st.q, e => e.name.split('  ')[0]) +
          pkBoxes('nmq', st.q, st, NM_QUAD_OWN, NM_QUAD_BOUNDS,
            'Your integrand and its interval. The measured order is the interesting part: a rule only ' +
            'achieves its textbook order when the derivatives the error analysis assumes are actually ' +
            'bounded. Try <b>x^(1/3)</b> on [0,1], or <b>abs(x)</b> on [-1,1], and watch Simpson lose.') +
          ctSeg('nqR', st.rule, [['left', 'left'], ['trap', 'trapezoid'], ['mid', 'midpoint'], ['simpson', 'Simpson']]) +
          ctlRow('panels n', ctlSlider('nqN', 2, 128, 2, st.n))
        : '') +
      `<p class="help">${st.mode === 'order'
        ? 'The error of a quadrature rule falls like hᵏ, and k is the <b>order</b>. Rather than quoting it, the panel halves h repeatedly and takes log₂ of the ratio of successive errors — which is k, measured. Left endpoints give 1, trapezoid and midpoint 2, Simpson 4.'
        : 'Floating point has about 16 significant digits, and every operation rounds. Two things follow, both visible here: subtracting nearly equal numbers destroys precision, and a difference quotient therefore has an optimal h below which it gets <i>worse</i>.'}</p>
      <p class="help">${st.mode === 'order'
        ? 'This is why the integration wing measures its convergence rather than asserting it — and why a rule\'s order collapses on a function whose derivatives are not bounded, like √x at the origin.'
        : 'The best step is around the square root of machine epsilon, near 10⁻⁸ — a compromise between truncation error falling as h and rounding error rising as ε/h. It is the reason numerical differentiation is avoided wherever a symbolic derivative is available, as the field engine does.'}</p>`;
  },
  wire(){
    ctWireSeg('nqM', v => { ST.mode = v; });
    pkWire('nqQ', 'nmq', ST.q, ST, NM_QUAD_OWN, NM_QUAD_BOUNDS, v => { ST.q = v; });
    ctWireSeg('nqR', v => { ST.rule = v; });
    wireSlider('nqN', () => ST.n, v => { ST.n = Math.max(2, Math.round(v / 2) * 2); }, v => String(Math.round(+v)));
  },
  frame(st, dt, ctx, W, H){
    if(st.mode === 'float'){
      /* the classic error-versus-h bathtub for a central difference */
      const f = Math.sin, x0 = 1, exact = Math.cos(1);
      const P = mkPlot(85, 55, W - 170, H - 145, -14, 0, -12, 2);
      plotFrame(ctx, P, 'log₁₀ h', 'log₁₀ error', 'central difference: truncation falls, rounding rises');
      ctGrid(ctx, P);
      const pts = [];
      for(let e = -14; e <= 0; e += 0.1){
        const h = Math.pow(10, e);
        const d = (f(x0 + h) - f(x0 - h)) / (2 * h);
        const err = Math.abs(d - exact);
        if(err > 0) pts.push({ x:e, y:Math.log10(err) });
      }
      ctPath(ctx, P, pts, rgbCss(TH.grad), 2.4);
      /* the two competing effects, drawn as the lines they are */
      ctPath(ctx, P, [{ x:-14, y:Math.log10(1e-16) + 14 }, { x:0, y:Math.log10(1e-16) }],
             rgbCss(TH.pos, 0.7), 1.6, [5, 4]);
      ctPath(ctx, P, [{ x:-14, y:2 * (-14) + 0.8 }, { x:0, y:0.8 }], rgbCss(TH.neg, 0.7), 1.6, [5, 4]);
      let best = pts[0];
      for(const p of pts) if(p.y < best.y) best = p;
      ctDot(ctx, P, best.x, best.y, 6, rgbCss(TH.warn), rgbCss(TH.bg));
      stageNote(ctx, 'orange: rounding, ε/h · blue: truncation, h² · the best h is where they cross', W, H);
      return;
    }
    const Cq = nmQuadCur(st), f = nmQuadF(st), qa = Cq.a, qb = Cq.b;
    const exact = nqAdaptive(f, qa, qb, 1e-13);
    /* the vertical extent measured from the integrand rather than assumed: the
       old fixed 0..1.15 window suited e^(−x²) and clipped anything else */
    let ylo = 0, yhi = 1e-9;
    for(let i = 0; i <= 200; i++){
      const v = f(qa + (qb - qa) * i / 200);
      if(Number.isFinite(v)){ ylo = Math.min(ylo, v); yhi = Math.max(yhi, v); }
    }
    const ypad = (yhi - ylo) * 0.12 + 1e-3;
    const xpad = (qb - qa) * 0.05;
    const P = mkPlot(85, 55, W * 0.52, H - 145, qa - xpad, qb + xpad, ylo - ypad, yhi + ypad);
    plotFrame(ctx, P, 'x', 'f(x)', Cq.name.split('  ')[0] + ' with ' + st.n + ' panels');
    ctGrid(ctx, P);
    const h = (qb - qa) / st.n;
    for(let i = 0; i < st.n; i++){
      const a = qa + i * h, b = a + h;
      const yv = st.rule === 'left' ? f(a) : st.rule === 'mid' ? f((a + b) / 2) : f(a);
      if(st.rule === 'trap' || st.rule === 'simpson'){
        ctFill(ctx, P, [{ x:a, y:0 }, { x:a, y:f(a) }, { x:b, y:f(b) }, { x:b, y:0 }], rgbCss(TH.grad, 0.25));
        ctPath(ctx, P, [{ x:a, y:f(a) }, { x:b, y:f(b) }], rgbCss(TH.grad), 1.4);
      } else {
        ctFill(ctx, P, [{ x:a, y:0 }, { x:a, y:yv }, { x:b, y:yv }, { x:b, y:0 }], rgbCss(TH.grad, 0.25));
      }
    }
    plotCurve(ctx, P, f, 400, rgbCss(TH.text), 2);
    /* the measured order, as a log-log line */
    const Q = mkPlot(W * 0.62, 55, W * 0.34, H - 145, 0.6, 2.6, -12, 0);
    plotFrame(ctx, Q, 'log₁₀ n', 'log₁₀ error', 'the slope is the order');
    ctGrid(ctx, Q);
    const pts = [];
    for(let k = 2; k <= 512; k *= 2){
      const v = nqRiemann(f, qa, qb, k, st.rule === 'simpson' ? 'mid' : st.rule);
      const val = st.rule === 'simpson' ? nqSimpson(f, qa, qb, k) : v;
      const err = Math.abs(val - exact);
      if(err > 1e-16) pts.push({ x:Math.log10(k), y:Math.log10(err) });
    }
    ctPath(ctx, Q, pts, rgbCss(TH.curl), 2.4);
    for(const p of pts) ctDot(ctx, Q, p.x, p.y, 3.5, rgbCss(TH.curl));
    stageNote(ctx, 'a steeper line means a faster rule — the slope is minus the order', W, H);
  },
  derive(st){
    if(st.mode === 'float'){
      return {
        title:'Why there is a best h, and where it is',
        steps:[
          drvStep('the central difference has truncation error',
            `${dfrac(dv('f')+'('+dv('x')+'+'+dv('h')+') '+dop('−')+' '+dv('f')+'('+dv('x')+'−'+dv('h')+')', '2'+dv('h'))} ${dop('=')} ${dv('f')}′(${dv('x')}) ${dop('+')} ${dfrac(dv('h')+'²', '6')}${dv('f')}‴ ${dop('+')} …`,
            'so the truncation error falls as h²'),
          drvStep('but each evaluation of f is rounded',
            `${dfn('computed')} ${dv('f')} ${dop('=')} ${dv('f')}(1 ${dop('+')} δ),  |δ| ${dop('≲')} ε ${dop('≈')} 10<sup>−16</sup>`,
            'and the two rounded values are then subtracted'),
          drvSay('and that subtraction is where the damage happens',
            'Two nearly equal numbers differ in their last few digits. Subtracting them keeps the error and throws away the agreement, so the relative error of the difference is enormous — then dividing by a tiny 2h amplifies it further.'),
          drvStep('so the rounding error grows as ε/h',
            `${dfn('total error')} ${dop('≈')} ${dfrac('ε', dv('h'))} ${dop('+')} ${dv('h')}²`,
            'one term falls with h, the other rises'),
          drvStep('minimise the sum',
            `${dv('h')}<sub>best</sub> ${dop('≈')} ε<sup>1/3</sup> ${dop('≈')} 10<sup>−5</sup>`,
            'for a central difference; for a one-sided one it is √ε ≈ 10⁻⁸'),
          drvSay('which is why symbolic beats numerical',
            'No choice of h gets you more than about ten or eleven good digits from a difference quotient. That is why the field engine differentiates symbolically wherever it can, and falls back on differences only where no rule exists.')
        ],
        note:'The same cancellation is why the relativity wing computes several quantities in closed form — its tests assert that the naive subtraction is measurably wrong.'
      };
    }
    const Cq = nmQuadCur(st), f = nmQuadF(st), qa = Cq.a, qb = Cq.b;
    const exact = nqAdaptive(f, qa, qb, 1e-13);
    const e1 = Math.abs((st.rule === 'simpson' ? nqSimpson(f, qa, qb, st.n) : nqRiemann(f, qa, qb, st.n, st.rule)) - exact);
    const e2 = Math.abs((st.rule === 'simpson' ? nqSimpson(f, qa, qb, st.n * 2) : nqRiemann(f, qa, qb, st.n * 2, st.rule)) - exact);
    const ord = (e1 > 0 && e2 > 0) ? Math.log2(e1 / e2) : 0;
    return {
      title:'Measuring the order instead of quoting it',
      steps:[
        drvStep('assume the error behaves like a power of h',
          `${dv('E')}(${dv('h')}) ${dop('≈')} ${dv('C')}${dv('h')}<sup>k</sup>`,
          `at n = ${st.n}:  E = ${fmtNum(e1, 3)}`),
        drvStep('halve h and the error falls by 2ᵏ',
          `${dfrac(dv('E')+'('+dv('h')+')', dv('E')+'('+dv('h')+'/2)')} ${dop('≈')} 2<sup>k</sup>`,
          `at n = ${st.n * 2}:  E = ${fmtNum(e2, 3)},  ratio = ${fmtNum(e1 / e2, 4)}`),
        drvStep('so take a logarithm',
          `${dv('k')} ${dop('=')} log<sub>2</sub> ${dfrac(dv('E')+'('+dv('h')+')', dv('E')+'('+dv('h')+'/2)')}`,
          `measured order k = ${fmtNum(ord, 4)}`),
        drvSay('and the answer is the theory, arrived at empirically',
          'Left endpoints give 1, trapezoid and midpoint 2, Simpson 4 — the numbers a textbook states. Measuring them is better than being told them, because the measurement also tells you when they <em>fail</em>: on √x at the origin the derivatives are unbounded and Simpson quietly drops to about 1.5.'),
        drvSay('why the order is what matters and the error is not',
          'The size of an error tells you about one grid. The order tells you what happens when you refine, and that is the only thing that lets you predict the cost of an answer you have not computed yet. A first-order method needs a thousand times the work for three more digits; a fourth-order one needs about six times. Which is why the difference between order 2 and order 4 is not a 2× improvement but the difference between a calculation being feasible and not.'),
        drvSay('and the orders themselves are not arbitrary numbers',
          'A rule that is exact for polynomials up to degree d has order d + 1 on smooth functions, because the Taylor remainder is what is left over. The trapezoid rule is exact for straight lines, so 2; Simpson\'s rule is built from parabolas but is exact for <b>cubics</b> as well, by an accident of symmetry that gains it a whole order for free, so 4. That accident is worth knowing: it is the same symmetry argument that makes the midpoint rule second order despite using a single point, and the reason Gaussian quadrature reaches order 2n with n points.'),
        drvSay('what breaks it, in one sentence',
          'Every one of these orders assumes the integrand has enough derivatives, bounded, on the whole interval. A kink, a pole, an endpoint singularity or an oscillation faster than the grid removes that assumption and the measured order drops to whatever the function will support. This is why the panel measures rather than asserts, and why adaptive quadrature — which subdivides where it is having trouble instead of everywhere — is what a library actually ships.')
      ],
      note:'This is the same procedure the integration wing uses on its Riemann sums, and the same idea as the observed order of an ODE solver.'
    };
  },
  readout(st){
    if(st.mode === 'float'){
      const f = Math.sin, exact = Math.cos(1);
      const rows = [1e-1, 1e-3, 1e-5, 1e-8, 1e-11, 1e-14].map(h => {
        const d = (f(1 + h) - f(1 - h)) / (2 * h);
        return kv('h = 10' + supDigits(String(Math.round(Math.log10(h)))), 'error ' + fmtNum(Math.abs(d - exact), 3));
      });
      return `<div class="card tight"><div class="ttl">A central difference for cos 1</div>
        ${rows.join('')}
        ${kv('machine epsilon', fmtNum(Number.EPSILON, 3))}
        <p class="help">The error falls, bottoms out around h = 10⁻⁵, and then <b>rises again</b>.
        Taking a smaller step past that point makes the answer worse, which is not what calculus
        would lead you to expect and is entirely an artefact of finite precision.</p>
      </div>
      <div class="card tight"><div class="ttl">The lesson</div>
        <p class="help">Mathematics says the limit as h → 0 is exact. Arithmetic says there is a
        floor, and you hit it long before h reaches zero. Every numerical method lives in the gap
        between those two statements, and knowing where the floor is <i>is</i> the subject.</p>
      </div>`;
    }
    const Cq = nmQuadCur(st), f = nmQuadF(st), qa = Cq.a, qb = Cq.b;
    const exact = nqAdaptive(f, qa, qb, 1e-13);
    const rows = [];
    let prev = null;
    for(let k = 4; k <= 256; k *= 2){
      const val = st.rule === 'simpson' ? nqSimpson(f, qa, qb, k) : nqRiemann(f, qa, qb, k, st.rule);
      const err = Math.abs(val - exact);
      rows.push(kv('n = ' + k, fmtNum(err, 3) + (prev && err > 0 ? '     order ' + fmtNum(Math.log2(prev / err), 3) : '')));
      prev = err;
    }
    return `<div class="card tight"><div class="ttl">Error, and the order it implies</div>
      ${rows.join('')}
      ${kv('the exact value', fmtNum(exact, 12))}
      <p class="help">The order column is log₂ of the ratio of successive errors. It settles on the
      textbook value — and stops being meaningful once the error reaches machine precision, which is
      why the last row or two can look erratic.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">numerics</div><div>${st.mode === 'float' ? 'floating point' : st.rule}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the rule'], ['var(--c-curl)', 'error vs work'],
                    ['var(--c-pos)', 'rounding, ε/h'], ['var(--c-neg)', 'truncation, h²'],
                    ['var(--c-warn)', 'the best step']]; },
  dockLegend:true
};
