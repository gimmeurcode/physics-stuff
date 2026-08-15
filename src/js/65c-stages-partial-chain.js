STAGES.mvTangent = {
  title:'Tangent planes',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'What differentiability really demands, and why partials are not enough',
      steps:[
        drvSay('the idea a derivative is supposed to capture',
          'In one variable, differentiable means the curve is locally indistinguishable from its tangent line. The right generalisation is not "the partial derivatives exist" — it is that the surface is locally indistinguishable from a plane, approached from every direction at once.'),
        drvStep('the candidate plane, built from the two partials',
          `${dv('z')} ${dop('=')} ${dv('f')}(${dv('a')},${dv('b')}) ${dop('+')} ${dv('f')}ₓ(${dv('x')}{−}${dv('a')}) ${dop('+')} ${dv('f')}_y(${dv('y')}{−}${dv('b')})`,
          `at (${n(st.a)}, ${n(st.b)}) — the panel draws it against the surface`),
        drvStep('differentiability is the demand that the error die faster than the distance',
          `${dlim(dv('r'), '0')} ${dfrac('|error|', '|Δ' + dv('r') + '|')} ${dop('=')} 0`,
          'not merely that the error is small, but that it is small compared with how far you moved'),
        drvSay('that ratio is the whole definition, and it is strict',
          'An error proportional to the distance would be a bad approximation no matter how close you got. Demanding the ratio vanish forces the plane to match the surface to first order in every direction simultaneously — which having two partial derivatives does not guarantee.'),
        drvStep('so the linear approximation is the derivative',
          `Δ${dv('f')} ${dop('≈')} ∇${dv('f')} ${dop('·')} Δ${dv('r')}`,
          `at the current step size h = ${n(st.h)} the panel prints the true change and this estimate`),
        drvSay('and the gradient is a single object doing a linear job',
          'The derivative of a multivariable function is not a number — it is a linear map, and the gradient is the vector representing it. That is why the Jacobian is a matrix in general: the derivative of a map is always the best linear approximation, and linear maps are matrices.'),
        drvStep('the error is second order, and the panel measures it',
          `error ${dop('∼')} ${dv('C')}|Δ${dv('r')}|²`,
          'halve h and the error should fall by four — the readout shows the ratio'),
        drvSay('why that measured ratio matters',
          'Second-order error is what "tangent" means quantitatively. The panel halves the step and reports the factor by which the error drops; getting 4 rather than 2 is direct evidence that the plane is genuinely tangent rather than merely close.'),
        drvStep('and the same plane is a normal vector in disguise',
          `${dv('n')} ${dop('=')} (${dv('f')}ₓ, ${dv('f')}_y, ${dop('−')}1)`,
          'which is why the gradient of F(x,y,z) is normal to the level surface F = 0')
      ],
      note:'For every function offered here the partials exist and the plane is genuinely tangent. The counterexamples where partials exist without differentiability are pathological by construction — but they are the reason the definition is stated as a limit of a ratio rather than as "the partials exist".'
    };
  },
  mode:'3d',
  enter(st, o){
    st.key = o.key || 'gauss2';
    st.src = MV_FUNCS[st.key] ? MV_FUNCS[st.key].src : (o.src || 'x^2+y^2');
    st.a = o.a === undefined ? 0.7 : o.a;
    st.b = o.b === undefined ? -0.5 : o.b;
    st.h = o.h === undefined ? 1 : o.h;
    st.err = '';
    mvSafe(st);
    R.cam.az = 0.66; R.cam.el = 0.36; ctCamFit(2.4);
  },
  controls(){
    const st = ST;
    return mvPick('mvTK', st.key) +
      ctlRow('a', ctlSlider('mvTa', -2.6, 2.6, 0.02, st.a)) +
      ctlRow('b', ctlSlider('mvTb', -2.6, 2.6, 0.02, st.b)) +
      ctlRow('window h', ctlSlider('mvTh', 0.02, 2, 0.01, st.h)) +
      `<p class="help">The tangent plane is <b>z = f(a,b) + f<sub>x</sub>(a,b)(x−a) + f<sub>y</sub>(a,b)(y−b)</b>
      — the unique plane matching both the height and both slopes. Its normal is <b>⟨f<sub>x</sub>, f<sub>y</sub>, −1⟩</b>,
      which is the gradient of <b>z − f(x,y)</b>, and that is the cleanest way to remember it.</p>
      <p class="help">Shrink the window and watch the surface flatten into the plane. That flattening is
      what <b>differentiability</b> means, and the readout measures it: the worst error over a circle of
      radius h should fall as <b>h²</b>, so halving h should quarter it. Try the cone √(x²+y²) at the
      origin and watch the ratio refuse to converge — a function can have both partial derivatives at a
      point and still have no tangent plane there.</p>`;
  },
  wire(){
    mvWirePick('mvTK');
    wireSlider('mvTa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('mvTb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('mvTh', () => ST.h, v => { ST.h = v; }, v => fmtNum(+v, 4));
  },
  frame(st, dt, ctx, W, H){
    const F = st.F; if(!F) return;
    const f = (x, y) => F.f(x, y);
    const a = st.a, b = st.b, h = st.h;
    const x0 = a - h * 1.6, x1 = a + h * 1.6, y0 = b - h * 1.6, y1 = b + h * 1.6;
    const Z = ctZRange(f, x0, x1, y0, y1, 26);
    const f0 = f(a, b);
    const sc = 1.6 / Math.max(1e-9, Math.max(Z.hi - f0, f0 - Z.lo, h * 0.4));
    /* work in local coordinates so the picture zooms with h */
    const gx = F.fx(a, b), gy = F.fy(a, b);
    R.mode2d = false; R.extent = 2.6; R.begin();
    const g = (u, v) => (f(a + u, b + v) - f0) * sc;
    const pl = (u, v) => (gx * u + gy * v) * sc;
    /* the plane, drawn under the surface */
    R.poly([v3(-h * 1.5, -h * 1.5, pl(-h * 1.5, -h * 1.5)), v3(h * 1.5, -h * 1.5, pl(h * 1.5, -h * 1.5)),
            v3(h * 1.5, h * 1.5, pl(h * 1.5, h * 1.5)), v3(-h * 1.5, h * 1.5, pl(-h * 1.5, h * 1.5))],
           rgbCss(TH.grad, 0.22), rgbCss(TH.grad, 0.8), 1.6, 0.75);
    ctSurf3(g, -h * 1.5, h * 1.5, -h * 1.5, h * 1.5, 22, -1.6, 1.6, 0.82, true);
    /* the normal ⟨f_x, f_y, −1⟩ */
    const nrm = vnorm(v3(-gx * sc, -gy * sc, 1));
    R.arrow(v3(0, 0, 0), vmul(nrm, h * 1.1), rgbCss(TH.curl), 2.6, 1);
    R.label(vmul(nrm, h * 1.25), 'n', rgbCss(TH.curl), 0, -10, '700 12px ' + FONT_UI);
    R.dot(v3(0, 0, 0), 7, rgbCss(TH.text), rgbCss(TH.bg));
    /* the ring on which the error is measured */
    const ring = [];
    for(let i = 0; i <= 72; i++){
      const t = i / 72 * 6.2832;
      ring.push(v3(h * Math.cos(t), h * Math.sin(t), g(h * Math.cos(t), h * Math.sin(t))));
    }
    R.path(ring, rgbCss(TH.warn), 2.2, 1);
    const ring2 = [];
    for(let i = 0; i <= 72; i++){
      const t = i / 72 * 6.2832;
      ring2.push(v3(h * Math.cos(t), h * Math.sin(t), pl(h * Math.cos(t), h * Math.sin(t))));
    }
    R.path(ring2, rgbCss(TH.warn, 0.5), 1.6, 0.8);
    R.flush();
    em3dCaption(ctx, W, H,
      `${mvShort(st)} at (${fmtNum(a, 3)}, ${fmtNum(b, 3)}) — window ±${fmtNum(h, 3)}`,
      'the orange rings are the surface and the plane at distance h — shrink h and they merge');
  },
  readout(st){
    const F = st.F; if(!F) return `<div class="card tight">${st.err}</div>`;
    const a = st.a, b = st.b, h = st.h;
    const L = mvLinear(F, a, b);
    const e1 = mvLinearError(F, a, b, h);
    const e2 = mvLinearError(F, a, b, h / 2);
    const e3 = mvLinearError(F, a, b, h / 4);
    return `<div class="card tight"><div class="ttl">The plane</div>
      ${kv('f(a, b)', fmtNum(L.f0, 6))}
      ${kv('f<sub>x</sub>(a, b)', fmtNum(L.gx, 6))}
      ${kv('f<sub>y</sub>(a, b)', fmtNum(L.gy, 6))}
      ${kv('z =', `${fmtNum(L.f0, 4)} + ${fmtNum(L.gx, 4)}(x − ${fmtNum(a, 3)}) + ${fmtNum(L.gy, 4)}(y − ${fmtNum(b, 3)})`)}
      ${kv('unit normal ⟨f<sub>x</sub>, f<sub>y</sub>, −1⟩', ctVec3f(L.n))}
    </div>
    <div class="card tight"><div class="ttl">Is it really tangent? — the error, measured</div>
      ${kv('worst |f − L| at h', fmtNum(e1, 4))}
      ${kv('at h/2', fmtNum(e2, 4))}
      ${kv('at h/4', fmtNum(e3, 4))}
      ${kv('ratio e(h)/e(h/2)', fmtNum(e1 / (e2 || 1e-30), 4))}
      ${kv('next ratio', fmtNum(e2 / (e3 || 1e-30), 4))}
      ${kv('verdict', Math.abs(e2 / (e3 || 1e-30) - 4) < 0.6 ? 'ratio → 4, so the error is O(h²): differentiable'
            : 'the ratio is not 4 — the approximation is not second order here')}
      <p class="help">A tangent line in one variable is the linear function agreeing to first order. In two
      variables the same definition is a genuine extra condition, because it must hold in <i>every</i>
      direction at once. Having both partials only fixes two directions.</p>
    </div>
    <div class="card tight"><div class="ttl">The differential</div>
      ${kv('dz = f<sub>x</sub> dx + f<sub>y</sub> dy', `${fmtNum(L.gx, 4)} dx + ${fmtNum(L.gy, 4)} dy`)}
      ${kv('with dx = dy = 0.01', fmtNum(L.df(0.01, 0.01), 6))}
      ${kv('actual Δf', fmtNum(F.f(a + 0.01, b + 0.01) - L.f0, 6))}
      ${kv('difference', fmtAgree(L.df(0.01, 0.01), (F.f(a + 0.01, b + 0.01) - L.f0)))}
      <p class="help">The differential is not an infinitesimal quantity; it is the <i>linear map</i> that
      the tangent plane is the graph of. This is how error propagation works in every laboratory: a small
      uncertainty in each input contributes |f<sub>x</sub>|·δx + |f<sub>y</sub>|·δy to the output, to first order.</p>
      <p class="help">That difference is not an error to chase to zero — it is the <b>second-order
      remainder</b> ½(f<sub>xx</sub>dx² + 2f<sub>xy</sub>dx dy + f<sub>yy</sub>dy²), the very quantity
      the card above watches fall as h². A first-order approximation owes a second-order debt, and this
      row is the debt at dx = dy = 0.01. (On the saddle x² − y² it reads zero — not because the
      approximation is better there, but because dx = dy makes the two quadratic terms cancel exactly.)</p>
    </div>`;
  },
  chip(st){
    if(!st.F) return `<div class="k">error</div>`;
    return `<div class="k">tangent plane</div>
      <div style="color:var(--c-grad)">h = ${fmtNum(st.h, 4)}</div>
      <div>err ${fmtNum(mvLinearError(st.F, st.a, st.b, st.h), 3)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the tangent plane'], ['var(--c-curl)', 'its normal ⟨f<sub>x</sub>, f<sub>y</sub>, −1⟩'],
                    ['var(--c-warn)', 'the surface and the plane at distance h']]; }
};

/* ---- 5 · the chain rule and implicit differentiation ---------------------- */
STAGES.mvChain = {
  title:'The chain rule',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:st.mode === 'implicit'
        ? 'Differentiating a curve that has no formula'
        : 'Every route into a function contributes, and the contributions add',
      steps:st.mode === 'implicit' ? [
        drvSay('the problem',
          'x² + y² = 4 defines y as a function of x locally, but solving for y gives two branches and a square root that fails at the sides. We want dy/dx without ever solving — and the chain rule provides it.'),
        drvStep('the constraint holds identically along the curve',
          `${dv('F')}(${dv('x')}, ${dv('y')}(${dv('x')})) ${dop('=')} 0 for all ${dv('x')}`,
          'so its derivative with respect to x is zero too'),
        drvStep('differentiate with the chain rule',
          `${dv('F')}ₓ ${dop('+')} ${dv('F')}_y ${dfrac('d' + dv('y'), 'd' + dv('x'))} ${dop('=')} 0`,
          'x reaches F directly and also through y'),
        drvStep('solve for the slope',
          `${dfrac('d' + dv('y'), 'd' + dv('x'))} ${dop('=')} ${dop('−')}${dfrac(dv('F') + 'ₓ', dv('F') + '_y')}`,
          'the panel evaluates this and checks it against a numerical slope along the traced curve'),
        drvSay('and the formula announces its own failure',
          'Where F_y = 0 the expression blows up — and that is exactly where the curve has a vertical tangent, at the left and right extremes of the circle. The implicit function theorem says y can be solved for locally precisely when F_y ≠ 0, so the algebra and the geometry agree about where the method stops.'),
        drvSay('the gradient is perpendicular to the level curve, again',
          'The relation above says (F_x, F_y)·(1, dy/dx) = 0. The tangent direction is (1, dy/dx), so the gradient is perpendicular to it. Implicit differentiation and "the gradient crosses contours at right angles" are the same statement written differently.')
      ] : [
        drvSay('what the rule is really counting',
          'If t affects x and y, and both affect f, then changing t changes f by two separate routes. The total effect is the sum of what arrives along each route — that is the whole content, and the formula is a bookkeeping of paths.'),
        drvStep('the chain rule for one parameter',
          `${dfrac('d' + dv('f'), 'd' + dv('t'))} ${dop('=')} ${dv('f')}ₓ${dfrac('d' + dv('x'), 'd' + dv('t'))} ${dop('+')} ${dv('f')}_y${dfrac('d' + dv('y'), 'd' + dv('t'))}`,
          `at t = ${n(st.t)}: the panel prints this against a numerical derivative of f along the path`),
        drvStep('which is a dot product',
          `${dfrac('d' + dv('f'), 'd' + dv('t'))} ${dop('=')} ∇${dv('f')} ${dop('·')} ${dv('r')}′(${dv('t')})`,
          'gradient dotted with velocity — the rate depends on both the terrain and how fast you cross it'),
        drvSay('and that is why the gradient deserves to be a vector',
          'Packaging the partials as a vector makes the chain rule a single dot product instead of a sum of terms. The same object then answers directional derivatives, tangent planes and steepest ascent. The vector notation is not shorthand — it is the recognition that these are one thing.'),
        drvStep('with more parameters, sum over every route',
          `${dfrac('∂' + dv('f'), '∂' + dv('s'))} ${dop('=')} Σ ${dfrac('∂' + dv('f'), '∂' + dv('u') + 'ᵢ')}${dfrac('∂' + dv('u') + 'ᵢ', '∂' + dv('s'))}`,
          'one term per intermediate variable — a tree diagram of dependencies'),
        drvSay('in matrix form it is just multiplication',
          'The Jacobian of a composition is the product of the Jacobians. So the chain rule is the statement that composing maps composes their best linear approximations — and matrix multiplication was defined to be composition. Everything closes.'),
        drvStep('and moving along a level curve gives zero',
          `∇${dv('f')} ${dop('·')} ${dv('r')}′ ${dop('=')} 0`,
          'which proves the gradient is perpendicular to the contours, rather than asserting it'),
        drvSay('the notation hides a real ambiguity, and it causes real errors',
          '∂f/∂x means "differentiate with respect to x holding the other variables fixed" — but <i>which</i> other variables is decided by the coordinate system, not by the symbol. In thermodynamics the same partial can mean two different numbers depending on whether volume or pressure is being held, which is why that subject writes the held variable as a subscript. Whenever a chain rule "gives the wrong answer", the usual cause is two different meanings of the same ∂f/∂x on opposite sides of the equation.'),
        drvSay('and this is where backpropagation comes from',
          'A neural network is a composition of a few hundred functions, and training it means the derivative of one number at the end with respect to every parameter along the way. Summing over every route through the dependency tree is exactly the rule above; doing it from the output backwards, so each shared sub-result is computed once, is reverse-mode automatic differentiation. The whole of modern machine learning rests on the observation that the tree is cheaper to walk in that direction.')
      ],
      note:'The chain-rule value is checked at every instant against a finite difference of f evaluated along the actual path. The panel prints both and their difference, so the rule is verified rather than applied on faith.'
    };
  },
  enter(st, o){
    st.key = o.key || 'ripple';
    st.src = MV_FUNCS[st.key] ? MV_FUNCS[st.key].src : (o.src || 'x^2+y^2');
    st.pathKey = o.pathKey || 'circle';
    st.t = 0.9;
    st.run = o.run !== false;
    st.mode = o.mode || 'chain';
    st.implicitSrc = 'x^2+y^2-4';
    mvSafe(st);
    try { st.G = mvCompile(st.implicitSrc); } catch(e){ st.G = null; }
  },
  controls(){
    const st = ST;
    const paths = [['circle', 'a circle'], ['line', 'a straight line'], ['spiral', 'a spiral'], ['lissa', 'a Lissajous loop']];
    return ctSeg('mvCM', st.mode, [['chain', 'df/dt along a path'], ['implicit', 'implicit differentiation']]) +
      (st.mode === 'chain'
        ? mvPick('mvCK', st.key) + ctSeg('mvCP', st.pathKey, paths) +
          ctlRow('t', ctlSlider('mvCt', 0, 6.2832, 0.005, st.t)) + ctChk('mvCrun', 'run t', st.run)
        : ctSeg('mvCI', st.implicitSrc, [['x^2+y^2-4', 'circle x²+y²=4'], ['x^3+y^3-3x y', 'folium x³+y³=3xy'],
                                          ['sin(x+y)-x y', 'sin(x+y) = xy'], ['x^2/4+y^2-1', 'ellipse']]) +
          ctlRow('t', ctlSlider('mvCt', 0, 6.2832, 0.005, st.t))) +
      `<p class="help">${st.mode === 'chain'
        ? 'Move along a curve on the surface and f changes at the rate <b>df/dt = f<sub>x</sub>·dx/dt + f<sub>y</sub>·dy/dt</b>. Each term is one route by which t reaches f, and the rule says to add them — that is all a tree diagram encodes. The readout also differentiates the composite <i>directly</i> and prints the gap, which is zero.'
        : 'When a curve is given by <b>F(x,y) = 0</b>, differentiating both sides with respect to x and using the chain rule gives <b>F<sub>x</sub> + F<sub>y</sub>·dy/dx = 0</b>, so <b>dy/dx = −F<sub>x</sub>/F<sub>y</sub></b>. No solving for y is needed — and for curves like the folium, no solution exists in elementary form.'}</p>
      <p class="help">${st.mode === 'chain'
        ? 'Notice what the rule really says: <b>df/dt = ∇f · r′(t)</b>. The chain rule and the directional derivative are the same statement, and both are dot products.'
        : 'The tangent drawn on screen is <b>perpendicular to ∇F</b>, which is the geometric content: the gradient of F is normal to every level curve of F, so the level curve\'s tangent is whatever the gradient is not.'}</p>`;
  },
  wire(){
    ctWireSeg('mvCM', v => { ST.mode = v; });
    mvWirePick('mvCK');
    ctWireSeg('mvCP', v => { ST.pathKey = v; });
    ctWireSeg('mvCI', v => { ST.implicitSrc = v; try { ST.G = mvCompile(v); } catch(e){ ST.G = null; } });
    wireSlider('mvCt', () => ST.t, v => { ST.t = v; ST.run = false; const c = $('mvCrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    ctWireChk('mvCrun', v => { ST.run = v; });
  },
  path(st){
    const K = st.pathKey;
    if(K === 'line') return { f:t => ({ x:-2.2 + 0.72 * t, y:-1.6 + 0.55 * t }), d:() => ({ x:0.72, y:0.55 }) };
    if(K === 'spiral') return { f:t => ({ x:0.34 * t * Math.cos(t), y:0.34 * t * Math.sin(t) }),
      d:t => ({ x:0.34 * (Math.cos(t) - t * Math.sin(t)), y:0.34 * (Math.sin(t) + t * Math.cos(t)) }) };
    if(K === 'lissa') return { f:t => ({ x:2.1 * Math.sin(3 * t), y:1.7 * Math.sin(2 * t) }),
      d:t => ({ x:6.3 * Math.cos(3 * t), y:3.4 * Math.cos(2 * t) }) };
    return { f:t => ({ x:1.8 * Math.cos(t), y:1.8 * Math.sin(t) }),
             d:t => ({ x:-1.8 * Math.sin(t), y:1.8 * Math.cos(t) }) };
  },
  frame(st, dt, ctx, W, H){
    if(st.run) st.t = (st.t + dt * 0.55) % 6.2832;
    if(st.mode === 'implicit') return this.frameImplicit(st, dt, ctx, W, H);
    const F = st.F; if(!F) return;
    const f = (x, y) => F.f(x, y), E = 3.2;
    const P = ctBox(W, H, 0, 0, E, { r:W * 0.5 });
    const rg = ctRange(f, P, 40);
    ctHeat(ctx, P, f, rg.lo, rg.hi, 52, 0.55);
    for(const L of ctLevels(rg.lo, rg.hi, 14)) ctContour(ctx, P, f, L, rgbCss(TH.text, 0.28), 1, 110);
    ctFrame(ctx, P, 'a path across the surface — how fast does f change?');
    const pa = this.path(st);
    ctParam(ctx, P, pa.f, 0, 6.2832, 500, rgbCss(TH.text, 0.75), 2);
    const p = pa.f(st.t), d = pa.d(st.t);
    const gx = F.fx(p.x, p.y), gy = F.fy(p.x, p.y);
    ctArrow(ctx, P, p.x, p.y, p.x + gx * 0.35, p.y + gy * 0.35, rgbCss(TH.grad), 2.6, '∇f');
    const ds = 0.7 / (Math.hypot(d.x, d.y) || 1);
    ctArrow(ctx, P, p.x, p.y, p.x + d.x * ds, p.y + d.y * ds, rgbCss(TH.curl), 2.6, "r′");
    ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.text), rgbCss(TH.bg));
    /* the composite f(r(t)) as its own graph, with the tangent whose slope is df/dt */
    const x0 = W * 0.55;
    const Q = mkPlot(x0 + 46, 56, W - x0 - 86, H - 150, 0, 6.2832, rg.lo - 0.2, rg.hi + 0.2);
    plotFrame(ctx, Q, 't', 'f(x(t), y(t))', 'the composite — its slope is df/dt');
    plotZeroY(ctx, Q); plotTicksX(ctx, Q, [0, 1.5708, 3.1416, 4.7124, 6.2832], v => fmtNum(v, 3));
    plotCurve(ctx, Q, t => { const q = pa.f(t); return f(q.x, q.y); }, 500, rgbCss(TH.grad), 2.2);
    const ch = mvChainCheck(F, pa, st.t);
    plotCurve(ctx, Q, t => f(p.x, p.y) + ch.chain * (t - st.t), 2, rgbCss(TH.curl), 1.8);
    probeLine(ctx, Q, st.t, 't');
    stageNote(ctx, 'df/dt = ∇f · r′ — the chain rule is a dot product, and the panel checks it against a direct difference', W, H);
  },
  frameImplicit(st, dt, ctx, W, H){
    const G = st.G; if(!G) return;
    const g = (x, y) => G.f(x, y), E = 3;
    const P = ctBox(W, H, 0, 0, E);
    const rg = ctRange(g, P, 40);
    ctHeat(ctx, P, g, rg.lo, rg.hi, 56, 0.4, true);
    ctGrid(ctx, P);
    ctContour(ctx, P, g, 0, rgbCss(TH.grad), 3, 200);
    for(const L of ctLevels(rg.lo, rg.hi, 12)) ctContour(ctx, P, g, L, rgbCss(TH.text, 0.22), 0.9, 120);
    ctFrame(ctx, P, 'F(x, y) = 0  —  the heavy curve, never solved for y');
    /* walk the zero level by following the tangent, so the marker stays on it */
    const start = { x:2 * Math.cos(st.t), y:2 * Math.sin(st.t) };
    /* project back onto the level set with a few Newton steps along ∇F */
    let q = start;
    for(let i = 0; i < 30; i++){
      const val = G.f(q.x, q.y), gx = G.fx(q.x, q.y), gy = G.fy(q.x, q.y);
      const n2 = gx * gx + gy * gy;
      if(!(n2 > 1e-12)) break;
      q = { x:q.x - val * gx / n2, y:q.y - val * gy / n2 };
      if(Math.abs(val) < 1e-13) break;
    }
    const gx = G.fx(q.x, q.y), gy = G.fy(q.x, q.y);
    const slope = -gx / gy;
    ctArrow(ctx, P, q.x, q.y, q.x + gx * 0.25, q.y + gy * 0.25, rgbCss(TH.curl), 2.6, '∇F');
    const tl = 1.3 / Math.hypot(1, slope || 0);
    if(Number.isFinite(slope))
      ctPath(ctx, P, [{ x:q.x - tl, y:q.y - slope * tl }, { x:q.x + tl, y:q.y + slope * tl }],
             rgbCss(TH.warn), 2.2, [6, 4]);
    else ctPath(ctx, P, [{ x:q.x, y:q.y - 1.3 }, { x:q.x, y:q.y + 1.3 }], rgbCss(TH.warn), 2.2, [6, 4]);
    ctDot(ctx, P, q.x, q.y, 6, rgbCss(TH.text), rgbCss(TH.bg));
    st.q = q;
    stageNote(ctx, 'the dashed tangent is perpendicular to ∇F — that is the whole geometric content of implicit differentiation', W, H);
  },
  readout(st){
    if(st.mode === 'implicit'){
      const G = st.G; if(!G || !st.q) return `<div class="card tight">…</div>`;
      const q = st.q;
      const Fx = G.fx(q.x, q.y), Fy = G.fy(q.x, q.y);
      return `<div class="card tight"><div class="ttl">On the curve F(x, y) = 0</div>
        ${kv('point', ctVec2(q))}
        ${kv('F there', fmtNum(G.f(q.x, q.y), 3))}
        ${kv('F<sub>x</sub>', fmtNum(Fx, 6))}${kv('F<sub>y</sub>', fmtNum(Fy, 6))}
        ${kv('dy/dx = −F<sub>x</sub>/F<sub>y</sub>', Math.abs(Fy) < 1e-9 ? 'vertical tangent — no slope' : fmtNum(-Fx / Fy, 6))}
        ${kv('d²y/dx²', Math.abs(Fy) < 1e-9 ? '—' : fmtNum(mvImplicitSlope2(G, q.x, q.y), 6))}
        ${kv('∇F · (tangent)', fmtNum(Fx * 1 + Fy * (-Fx / Fy), 3))}
        <div class="dstep"><div class="lbl">F</div>${texEq(G.ast)}</div>
        <div class="dstep"><div class="lbl">F<sub>x</sub></div>${texEq(G.ax)}</div>
        <div class="dstep"><div class="lbl">F<sub>y</sub></div>${texEq(G.ay)}</div>
      </div>
      <div class="card tight"><div class="ttl">Why this works</div>
        <p class="help">Treat y as a function of x on the curve and differentiate <b>F(x, y(x)) = 0</b>.
        The chain rule gives <b>F<sub>x</sub>·1 + F<sub>y</sub>·y′ = 0</b> — one equation, solved in one line. The implicit
        function theorem is the fine print: y really is a function of x near the point provided
        <b>F<sub>y</sub> ≠ 0</b>, which is exactly when the formula does not divide by zero. Where F<sub>y</sub> vanishes the
        tangent is vertical and no function y(x) can describe the curve there, however smooth it looks.</p>
        <p class="help">The folium x³ + y³ = 3xy is the standing example: it is a perfectly good curve,
        it fails the vertical line test in two places, and no elementary y(x) exists — but its slope at
        every point is one division away.</p>
      </div>`;
    }
    const F = st.F; if(!F) return `<div class="card tight">${st.err}</div>`;
    const pa = this.path(st);
    const ch = mvChainCheck(F, pa, st.t);
    return `<div class="card tight"><div class="ttl">The chain rule at t = ${fmtNum(st.t, 4)}</div>
      ${kv('position', ctVec2(ch.p))}
      ${kv('f<sub>x</sub>', fmtNum(ch.fx, 6))}${kv('dx/dt', fmtNum(ch.dx, 6))}
      ${kv('f<sub>y</sub>', fmtNum(ch.fy, 6))}${kv('dy/dt', fmtNum(ch.dy, 6))}
      ${kv('f<sub>x</sub>·x′ + f<sub>y</sub>·y′', fmtNum(ch.chain, 6))}
      ${kv('d/dt of the composite, directly', fmtNum(ch.direct, 6))}
      ${kv('difference', fmtAgree(ch.chain, ch.direct))}
      <p class="help">The second-to-last row never touches a partial derivative: it differences
      f(x(t), y(t)) as a single function of t. The two agree, which is the theorem.</p>
    </div>
    <div class="card tight"><div class="ttl">The tree, in words</div>
      ${kv('routes from t to f', 'two: t → x → f, and t → y → f')}
      ${kv('contribution of the x route', fmtNum(ch.fx * ch.dx, 6))}
      ${kv('contribution of the y route', fmtNum(ch.fy * ch.dy, 6))}
      ${kv('∇f · r′', fmtNum(ch.chain, 6))}
      <p class="help">Multiply along each branch, add across the branches. With more variables the tree
      grows but the rule does not change — and in matrix form it is simply <b>J(g∘f) = J(g)·J(f)</b>, the
      statement that the Jacobian of a composite is the product of the Jacobians. That is the version the
      Jacobian stage draws.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'implicit') return `<div class="k">implicit</div>
      <div style="color:var(--c-warn)">dy/dx = ${st.q && st.G ? fmtNum(mvImplicitSlope(st.G, st.q.x, st.q.y), 4) : '—'}</div>`;
    if(!st.F) return `<div class="k">error</div>`;
    const ch = mvChainCheck(st.F, this.path(st), st.t);
    return `<div class="k">df/dt</div><div style="color:var(--c-grad)">${fmtNum(ch.chain, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', '∇f, and the composite'], ['var(--c-curl)', "r′(t), and the tangent line"],
                    ['var(--text)', 'the path']]; },
  dockLegend:true
};

/* ---- 6 · the gradient and directional derivatives -------------------------- */
