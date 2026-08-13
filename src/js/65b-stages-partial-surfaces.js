STAGES.mvSurface = {
  title:'Functions of two variables',
  derive(st){
    return {
      title:'Two ways of drawing the same function, and why the flat one wins',
      steps:[
        drvSay('the object itself',
          'z = f(x, y) assigns a height to every point of the plane. Its graph lives in three dimensions, so it can be drawn — but only just, and only for two inputs. Every technique in this wing is designed to survive when the picture cannot be drawn at all.'),
        drvStep('the surface view: plot the height directly',
          `${dv('z')} ${dop('=')} ${dv('f')}(${dv('x')}, ${dv('y')})`,
          'immediate to read, and impossible beyond two inputs'),
        drvStep('the contour view: collect points of equal height',
          `${dv('f')}(${dv('x')}, ${dv('y')}) ${dop('=')} ${dv('c')}`,
          'a family of curves in the plane, one for each level c'),
        drvSay('the contour map is the more useful of the two',
          'It stays two-dimensional, so it prints, it scales to more variables as level sets, and it makes quantitative reading easy. A hiker uses a contour map rather than a perspective drawing for exactly these reasons — and so does the rest of this wing.'),
        drvStep('spacing encodes steepness',
          `close contours ${dop('⇒')} large |∇${dv('f')}|`,
          'the gradient is the reciprocal of the contour spacing, in the direction across them'),
        drvSay('and the gradient must be perpendicular to the contours',
          'Moving along a contour keeps f constant, so the rate of change in that direction is zero — and a dot product is zero when the vectors are perpendicular. The gradient therefore points straight across the contours, which is why the steepest route uphill crosses them at right angles.'),
        drvStep('slicing gives back one-variable calculus',
          `${dv('g')}(${dv('x')}) ${dop('=')} ${dv('f')}(${dv('x')}, ${dv('b')})`,
          `holding y = ${fmtNum(st.b, 3)} fixed traces a curve on the surface, drawn on the plot`),
        drvSay('and that slicing is the whole strategy of the wing',
          'Everything multivariable is built by holding all but one variable fixed and applying calculus you already have. Partial derivatives are slice derivatives, iterated integrals are slice integrals. The novelty is never in the calculus — it is in how the slices are recombined.')
      ],
      note:'You can type your own function into this stage. The contours are traced by marching squares on a sampled grid rather than plotted from a formula, so any function you write is handled the same way as the presets.'
    };
  },
  mode:st => (st && st.view === 'surface') ? '3d' : '2d',
  enter(st, o){
    st.key = o.key || 'ripple';
    st.src = MV_FUNCS[st.key] ? MV_FUNCS[st.key].src : (o.src || 'x^2+y^2');
    st.view = o.view || 'contour';
    st.a = 0; st.b = 0;
    st.ext = o.ext || 3.2;
    mvSafe(st);
    R.cam.az = 0.68; R.cam.el = 0.42; ctCamFit(3.6);
  },
  controls(){
    const st = ST;
    return mvPick('mvSK', st.key) +
      ctSeg('mvSV', st.view, [['contour', 'contour map'], ['surface', 'the surface'], ['traces', 'traces x = a, y = b']]) +
      ctlRow('a  (x = a)', ctlSlider('mvSa', -3, 3, 0.02, st.a)) +
      ctlRow('b  (y = b)', ctlSlider('mvSb', -3, 3, 0.02, st.b)) +
      `<p class="help">A function of two variables is a <b>surface</b> over the plane, and there are only
      two honest ways to look at one on a flat page. A <b>contour map</b> draws the level curves
      <b>f(x,y) = k</b> — exactly what an Ordnance Survey map does, and for the same reason: closely
      spaced contours mean steep ground. <b>Traces</b> hold one variable fixed and leave an ordinary
      one-variable curve, which is where partial derivatives come from.</p>
      <p class="help">The domain matters as much as the rule. √(x²+y²) is defined everywhere but has no
      tangent plane at the origin; 1/(x²+y²) has a hole there. Watch the contour spacing to read the
      gradient without computing anything.</p>`;
  },
  wire(){
    mvWirePick('mvSK');
    ctWireSeg('mvSV', v => { ST.view = v; });
    wireSlider('mvSa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('mvSb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    const F = st.F; if(!F) return;
    const f = (x, y) => F.f(x, y);
    const E = st.ext;
    if(st.view === 'surface'){
      const Z = ctZRange(f, -E, E, -E, E, 40);
      const sc = 2.4 / Math.max(1e-6, Z.hi - Z.lo);
      em3dBegin(3.6);
      em3dAxes(3);
      ctSurf3((x, y) => (f(x, y) - (Z.lo + Z.hi) / 2) * sc, -E, E, -E, E, 26,
              -1.2, 1.2, 0.94, true);
      /* the two traces, drawn on the surface itself */
      const tr1 = [], tr2 = [];
      for(let i = 0; i <= 120; i++){
        const t = -E + 2 * E * i / 120;
        tr1.push(v3(st.a, t, (f(st.a, t) - (Z.lo + Z.hi) / 2) * sc + 0.02));
        tr2.push(v3(t, st.b, (f(t, st.b) - (Z.lo + Z.hi) / 2) * sc + 0.02));
      }
      R.path(tr1, rgbCss(TH.curl), 2.6, 1);
      R.path(tr2, rgbCss(TH.warn), 2.6, 1);
      R.flush();
      em3dCaption(ctx, W, H, mvName(st), 'drag to orbit · the two curves are the traces x = a and y = b');
      return;
    }
    const P = ctBox(W, H, 0, 0, E);
    const rg = ctRange(f, P, 44);
    if(st.view === 'contour'){
      ctHeat(ctx, P, f, rg.lo, rg.hi, 60, 0.62);
      for(const L of ctLevels(rg.lo, rg.hi, 16))
        ctContour(ctx, P, f, L, rgbCss(TH.text, 0.34), 1, 130);
      ctContour(ctx, P, f, 0, rgbCss(TH.text, 0.7), 1.8, 160);
      ctGrid(ctx, P, undefined, true);
      ctFrame(ctx, P, mvName(st) + '  —  level curves f(x, y) = k');
      ctPath(ctx, P, [{ x:st.a, y:P.y0 }, { x:st.a, y:P.y1 }], rgbCss(TH.curl), 1.6, [6, 4]);
      ctPath(ctx, P, [{ x:P.x0, y:st.b }, { x:P.x1, y:st.b }], rgbCss(TH.warn), 1.6, [6, 4]);
      ctDot(ctx, P, st.a, st.b, 6, rgbCss(TH.text), rgbCss(TH.bg));
      stageNote(ctx, 'contours close together = steep · the heavy line is the level f = 0', W, H);
      return;
    }
    /* the traces, as two ordinary one-variable graphs */
    const top = mkPlot(66, 40, W - 110, (H - 130) / 2, -E, E, rg.lo - 0.1, rg.hi + 0.1);
    const bot = mkPlot(66, 40 + (H - 130) / 2 + 52, W - 110, (H - 130) / 2, -E, E, rg.lo - 0.1, rg.hi + 0.1);
    plotFrame(ctx, top, 'y', 'f(a, y)', `the trace x = a = ${fmtNum(st.a, 3)}  —  its slope is ∂f/∂y`);
    plotZeroY(ctx, top);
    plotTicksX(ctx, top, [-E, -E / 2, 0, E / 2, E], v => fmtNum(v, 3));
    plotCurve(ctx, top, y => f(st.a, y), 400, rgbCss(TH.curl), 2.2);
    probeLine(ctx, top, st.b, 'y = b');
    plotFrame(ctx, bot, 'x', 'f(x, b)', `the trace y = b = ${fmtNum(st.b, 3)}  —  its slope is ∂f/∂x`);
    plotZeroY(ctx, bot);
    plotTicksX(ctx, bot, [-E, -E / 2, 0, E / 2, E], v => fmtNum(v, 3));
    plotCurve(ctx, bot, x => f(x, st.b), 400, rgbCss(TH.warn), 2.2);
    probeLine(ctx, bot, st.a, 'x = a');
    stageNote(ctx, 'each trace is a function of one variable — and one-variable calculus applies to it unchanged', W, H);
  },
  readout(st){
    const F = st.F; if(!F) return `<div class="card tight">${st.err}</div>`;
    const a = st.a, b = st.b;
    return `<div class="card tight"><div class="ttl">At (a, b) = (${fmtNum(a, 3)}, ${fmtNum(b, 3)})</div>
      ${kv('f(a, b)', fmtNum(F.f(a, b), 6))}
      ${kv('∂f/∂x', fmtNum(F.fx(a, b), 6))}
      ${kv('∂f/∂y', fmtNum(F.fy(a, b), 6))}
      ${kv('∇f', ctVec2({ x:F.fx(a, b), y:F.fy(a, b) }))}
      ${kv('|∇f| — the steepness', fmtNum(Math.hypot(F.fx(a, b), F.fy(a, b)), 6))}
    </div>
    <div class="card tight"><div class="ttl">The symbolic derivatives</div>
      <div class="dstep"><div class="lbl">f</div>${texEq(F.ast)}</div>
      <div class="dstep"><div class="lbl">∂f/∂x</div>${texEq(F.ax)}</div>
      <div class="dstep"><div class="lbl">∂f/∂y</div>${texEq(F.ay)}</div>
      <p class="help">Partial differentiation is ordinary differentiation with the other variable frozen
      into a constant — which is exactly what the trace picture shows. Everything you already know about
      one-variable derivatives transfers unchanged; what is new is that there are now two of them, and
      later that they are not the whole story.</p>
    </div>`;
  },
  chip(st){
    if(!st.F) return `<div class="k">error</div>`;
    return `<div class="k">${mvShort(st)}</div>
      <div style="color:var(--c-grad)">f = ${fmtNum(st.F.f(st.a, st.b), 4)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the trace x = a'], ['var(--c-warn)', 'the trace y = b'],
                    ['var(--text)', 'the level f = 0']]; },
  dockLegend:true
};

/* ---- 2 · limits and continuity --------------------------------------------- */
STAGES.mvLimit = {
  title:'Limits in two variables',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why infinitely many approach directions make limits much harder',
      steps:[
        drvSay('what changed, and why it changes everything',
          'On the line there were two ways to approach a point, and a limit existed when the two agreed. In the plane there are infinitely many paths in — straight lines at every angle, parabolas, spirals — and the limit must give the same value along every single one of them.'),
        drvStep('the definition looks almost the same',
          `0 ${dop('<')} |(${dv('x')},${dv('y')}) ${dop('−')} (${dv('a')},${dv('b')})| ${dop('<')} δ ${dop('⇒')} |${dv('f')} ${dop('−')} ${dv('L')}| ${dop('<')} ε`,
          'δ now describes a disc rather than an interval'),
        drvSay('and a disc is exactly the point',
          'The condition must hold for every point in a small disc, not merely along some chosen route. That is a much stronger requirement, and it is what makes two-variable limits fail so much more often than one-variable ones.'),
        drvStep('approach along a straight line through the point',
          `${dv('y')} ${dop('=')} ${dv('m')}${dv('x')}`,
          `at m = ${n(st.m)} the panel reports what the function tends to along that line`),
        drvSay('and if the answer depends on m, the limit does not exist',
          'For xy/(x² + y²) the line y = mx gives m/(1 + m²) — a different number for every slope. Rotate the approach direction in the panel and watch the value sweep continuously. No single L can be right, so the limit fails, even though every individual approach converges perfectly well.'),
        drvStep('but agreeing on all lines is still not enough',
          `${dv('y')} ${dop('=')} ${dv('m')}${dv('x')}² and other curves`,
          st.curve !== 'line' ? 'the panel is currently approaching along a curve instead' : 'switch the approach curve to test this'),
        drvSay('the standard trap, worth meeting once',
          'x²y/(x⁴ + y²) tends to 0 along every straight line through the origin. Approach along the parabola y = x² instead and it tends to ½. Checking lines is a way to prove a limit does not exist; it can never prove one does.'),
        drvStep('to prove existence, squeeze in polar coordinates',
          `|${dv('f')} ${dop('−')} ${dv('L')}| ${dop('≤')} ${dv('g')}(${dv('r')}) ${dop('→')} 0 independently of θ`,
          'a bound depending on the radius alone covers every direction at once'),
        drvSay('why polar coordinates are the right tool here',
          'They separate distance from direction. If the bound depends only on r and goes to zero, then every path in — whatever its shape — is caught by it. That is the honest way to establish a two-variable limit, and it is why the substitution is the first thing to try.')
      ],
      note:'The panel sweeps the approach direction continuously and plots the limiting value against angle. A horizontal line means every direction agrees; anything else is a proof that the limit does not exist, obtained by inspection of a graph.'
    };
  },
  enter(st, o){
    st.key = o.key || 'ratio';
    st.src = mvLimitCur(st).src;
    st.m = o.m === undefined ? 1 : o.m;
    st.curve = o.curve || 'line';
    st.r = 1.2;
    st.run = o.run !== false;
    mvSafe(st);
  },
  controls(){
    const st = ST, C = mvLimitCur(st);
    return pkSeg('mvLK', MV_LIMIT_CASES, st.key, e => e.name) +
      pkBoxes('mvlim', st.key, st, MV_LIM_OWN, null,
        'Any f(x, y) the engine understands. The verdict below is <b>measured</b>, not looked up — ' +
        'try <b>x y^2/(x^2 + y^4)</b>, which tends to 0 along every straight line and to ½ along x = y².') +
      ctSeg('mvLC', st.curve, [['line', 'along y = m x'], ['par', 'along y = m x²'], ['spiral', 'along a spiral']]) +
      ctlRow('m', ctlSlider('mvLm', -3, 3, 0.02, st.m)) +
      ctlRow('radius r', ctlSlider('mvLr', 0.02, 2, 0.005, st.r)) +
      ctChk('mvLrun', 'close in on the origin', st.run) +
      `<p class="help"><b>${C.name}</b> — ${C.why}</p>
      <p class="help">In one variable there are two ways to approach a point. In two there are infinitely
      many, and a limit exists only if <i>every</i> one of them gives the same answer. That is why
      "check a few lines" is never a proof of existence — though a single disagreeing path is always a
      complete proof of non-existence.</p>`;
  },
  wire(){
    pkWire('mvLK', 'mvlim', ST.key, ST, MV_LIM_OWN, null,
      v => { ST.key = v; }, () => { ST.src = mvLimitCur(ST).src; mvSafe(ST); });
    ctWireSeg('mvLC', v => { ST.curve = v; });
    wireSlider('mvLm', () => ST.m, v => { ST.m = v; }, v => fmtNum(+v, 3));
    wireSlider('mvLr', () => ST.r, v => { ST.r = v; ST.run = false; const c = $('mvLrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    ctWireChk('mvLrun', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    const F = st.F; if(!F) return;
    if(st.run){ st.r *= Math.pow(0.5, dt * 0.55); if(st.r < 0.02) st.r = 2; }
    const E = 2;
    const P = ctBox(W, H, 0, 0, E, { r:W * 0.44 });
    const f = (x, y) => F.f(x, y);
    ctHeat(ctx, P, f, -1, 1, 70, 0.85, true);
    for(const L of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75])
      ctContour(ctx, P, f, L, rgbCss(TH.text, 0.3), 1, 150);
    ctFrame(ctx, P, mvLimitCur(st).name + '  —  colour is the value of f');
    /* the chosen approach path, and the circle at the current radius */
    const path = s => st.curve === 'line' ? { x:s, y:st.m * s }
      : st.curve === 'par' ? { x:s, y:st.m * s * s }
      : { x:s * Math.cos(14 * s), y:s * Math.sin(14 * s) };
    ctParam(ctx, P, path, -E, E, 500, rgbCss(TH.text, 0.85), 2);
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), st.r * P.u, 0, 6.2832); ctx.stroke();
    const p = path(st.r);
    ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    ctDot(ctx, P, 0, 0, 4, rgbCss(TH.text), rgbCss(TH.bg));
    /* the polar sweep: f around the circle of radius r, as its own plot */
    const Q = mkPlot(W * 0.6, 56, W * 0.34, H - 150, 0, 360, -1.15, 1.15);
    plotFrame(ctx, Q, 'direction θ  (degrees)', 'f on the circle', 'f around the circle of radius r');
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [0, 90, 180, 270, 360], v => String(v));
    plotCurve(ctx, Q, deg => {
      const t = deg * Math.PI / 180;
      return f(st.r * Math.cos(t), st.r * Math.sin(t));
    }, 360, rgbCss(TH.grad), 2);
    const sp = mvPolarSpread(F, st.r, 360);
    ctText(ctx, Q.px + Q.pw / 2, Q.py + Q.ph + 34,
      'spread = ' + fmtNum(sp.spread, 4) + (sp.spread < 1e-3 ? '  → collapsing, the limit exists' : '  → not shrinking, no limit'),
      rgbCss(sp.spread < 1e-3 ? TH.pos : TH.neg), '600 11.5px ' + FONT_UI, 'center');
    stageNote(ctx, 'if the right-hand curve flattens to a single value as r shrinks, the limit exists — otherwise it cannot', W, H);
  },
  readout(st){
    const F = st.F; if(!F) return `<div class="card tight">${st.err}</div>`;
    const C = mvLimitCur(st);
    const rows = [];
    for(const m of [0, 0.5, 1, 2, -1]){
      rows.push(kv('along y = ' + fmtNum(m, 2) + 'x', fmtNum(mvPathLine(F, m, st.r), 6)));
    }
    const sp1 = mvPolarSpread(F, st.r, 360);
    const sp2 = mvPolarSpread(F, st.r / 8, 360);
    return `<div class="card tight"><div class="ttl">Straight-line approaches, at distance ${fmtNum(st.r, 4)}</div>
      ${rows.join('')}
      ${kv('along y = x²', fmtNum(mvPathPower(F, 1, 2, st.r), 6))}
      ${kv('along the y-axis', fmtNum(F.f(0, st.r), 6))}
    </div>
    <div class="card tight"><div class="ttl">The polar test — the only decisive one</div>
      ${kv('spread at r', fmtNum(sp1.spread, 6))}
      ${kv('spread at r/8', fmtNum(sp2.spread, 6))}
      ${kv('lowest value on that circle', fmtNum(sp2.lo, 6))}
      ${kv('highest value', fmtNum(sp2.hi, 6))}
      ${kv('verdict', C.exists ? 'the limit exists and equals ' + fmtNum(C.value, 3) : 'no limit')}
      <p class="help">Writing f in polar form separates the two questions. If |f(r, θ) − L| ≤ g(r) with
      g(r) → 0 <i>and g independent of θ</i>, the limit is L. If the θ-dependence survives as r → 0 — if
      the spread above refuses to shrink — then no single value can be the limit, and the function has no
      hope of being made continuous there by any choice of f(0,0).</p>
    </div>
    <div class="card tight"><div class="ttl">Why lines are not enough</div>
      <p class="help">${C.why}</p>
      <p class="help">Continuity at a point means three things at once: f is defined there, the limit
      exists, and the two agree. In one variable that is a mild condition. In two it is a real
      restriction — and every one of the theorems later in this wing (the tangent plane, the chain rule,
      the second-derivative test) quietly assumes far more than continuity: it assumes the partials exist
      and are themselves continuous.</p>
    </div>`;
  },
  chip(st){
    if(!st.F) return `<div class="k">error</div>`;
    const sp = mvPolarSpread(st.F, st.r, 240);
    return `<div class="k">r = ${fmtNum(st.r, 4)}</div>
      <div style="color:${sp.spread < 1e-3 ? 'var(--c-pos)' : 'var(--c-neg)'}">spread ${fmtNum(sp.spread, 4)}</div>`;
  },
  legend(){ return [['var(--text)', 'the approach path'], ['var(--c-warn)', 'the circle of radius r'],
                    ['var(--c-grad)', 'f around that circle']]; },
  dockLegend:true
};

/* ---- 3 · partial derivatives and higher orders ----------------------------- */
STAGES.mvPartial = {
  title:'Partial derivatives',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Freezing one variable turns a hard problem into one you have already solved',
      steps:[
        drvSay('the trick, which is almost embarrassingly simple',
          'A function of two variables has no single rate of change — it depends which way you go. So pick a direction, hold everything else still, and you are back to a function of one variable, which ordinary calculus handles completely.'),
        drvStep('the partial derivative in x is a one-variable derivative',
          `${dv('f')}ₓ ${dop('=')} ${dlim(dv('h'), '0')} ${dfrac(dv('f') + '(' + dv('a') + '+' + dv('h') + ', ' + dv('b') + ') − ' + dv('f') + '(' + dv('a') + ', ' + dv('b') + ')', dv('h'))}`,
          `at (${n(st.a)}, ${n(st.b)}): the panel prints the symbolic value and a difference quotient beside it`),
        drvSay('the ∂ symbol is a warning label',
          'It says other variables exist and are being held fixed. With one variable there is nothing to hold, so d suffices. The change of symbol is there to stop you forgetting that the answer depends on what you froze.'),
        drvStep('geometrically it is the slope of a slice',
          `slope of ${dv('z')} ${dop('=')} ${dv('f')}(${dv('x')}, ${dv('b')})`,
          'the plane y = b cuts the surface in a curve, and f_x is that curve\'s ordinary slope'),
        drvStep('second partials, including the mixed ones',
          `${dv('f')}ₓ_y ${dop('=')} ${dfrac('∂', '∂' + dv('y'))}(${dv('f')}ₓ)`,
          'the panel computes f_xy and f_yx separately and prints their difference'),
        drvSay('the mixed partials agree, and that is a real theorem',
          'Differentiating in x then y gives the same result as y then x, provided the second derivatives are continuous. It is not obvious — the two operations do genuinely different things — and it fails for functions engineered to have discontinuous second derivatives. Clairaut\'s theorem is what makes the Hessian symmetric, and hence what makes the eigenvalue test of the quadratic-forms stage apply.'),
        drvSay('but partial derivatives alone are weaker than they look',
          'A function can have both partial derivatives at a point and still not be continuous there. Knowing the slope along two directions says nothing about the other infinitely many. That gap is what the tangent-plane stage fixes: differentiability is a stronger condition than having partials, and it is the one that actually behaves.'),
        drvStep('all the same rules apply, because it is one-variable calculus',
          `product, quotient and chain rules, with the other variable a constant`,
          'the engine differentiates symbolically, so what is printed is exact rather than a finite difference')
      ],
      note:'The panel prints both the symbolic partial derivative and a numerical difference quotient at the same point. Their agreement is a check on the symbolic differentiator, and the small residual is the truncation error the numerical-methods wing analyses.'
    };
  },
  enter(st, o){
    st.key = o.key || 'ripple';
    st.src = MV_FUNCS[st.key] ? MV_FUNCS[st.key].src : (o.src || 'x^2+y^2');
    st.a = o.a === undefined ? 0.8 : o.a;
    st.b = o.b === undefined ? 0.6 : o.b;
    st.which = o.which || 'x';
    mvSafe(st);
  },
  controls(){
    const st = ST;
    return mvPick('mvPK', st.key) +
      ctSeg('mvPW', st.which, [['x', '∂f/∂x'], ['y', '∂f/∂y'], ['both', 'both traces']]) +
      ctlRow('a', ctlSlider('mvPa', -3, 3, 0.02, st.a)) +
      ctlRow('b', ctlSlider('mvPb', -3, 3, 0.02, st.b)) +
      `<p class="help">Freeze y at b and you are left with a curve; its slope at x = a is <b>∂f/∂x</b>.
      Freeze x at a instead and the slope of that curve is <b>∂f/∂y</b>. The two panels below draw those
      curves and their tangent lines, so the number in the readout is visibly the slope of something.</p>
      <p class="help"><b>Clairaut's theorem</b> says the mixed second partials agree —
      <b>f<sub>xy</sub> = f<sub>yx</sub></b> — whenever they are continuous. The readout differentiates
      along both routes symbolically and prints the gap, which is zero. That is not obvious: it says the
      order in which you take two different limits does not matter, and there are (contrived) functions
      where it fails.</p>`;
  },
  wire(){
    mvWirePick('mvPK');
    ctWireSeg('mvPW', v => { ST.which = v; });
    wireSlider('mvPa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('mvPb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    const F = st.F; if(!F) return;
    const f = (x, y) => F.f(x, y), E = 3.2;
    /* left: the contour map with the two frozen lines; right: the two traces */
    const P = ctBox(W, H, 0, 0, E, { r:W * 0.5 });
    const rg = ctRange(f, P, 40);
    ctHeat(ctx, P, f, rg.lo, rg.hi, 52, 0.55);
    for(const L of ctLevels(rg.lo, rg.hi, 14)) ctContour(ctx, P, f, L, rgbCss(TH.text, 0.3), 1, 110);
    ctFrame(ctx, P, 'freeze one variable — a trace is left');
    ctPath(ctx, P, [{ x:P.x0, y:st.b }, { x:P.x1, y:st.b }], rgbCss(TH.warn), 2.2);
    ctPath(ctx, P, [{ x:st.a, y:P.y0 }, { x:st.a, y:P.y1 }], rgbCss(TH.curl), 2.2);
    ctDot(ctx, P, st.a, st.b, 6, rgbCss(TH.text), rgbCss(TH.bg));
    const gx = F.fx(st.a, st.b), gy = F.fy(st.a, st.b);
    ctArrow(ctx, P, st.a, st.b, st.a + gx * 0.4, st.b + gy * 0.4, rgbCss(TH.grad), 2.4, '∇f');
    const x0 = W * 0.55, wp = W - x0 - 40;
    const hp = (H - 150) / 2;
    const A = mkPlot(x0 + 46, 46, wp - 46, hp, -E, E, rg.lo - 0.15, rg.hi + 0.15);
    const B = mkPlot(x0 + 46, 46 + hp + 56, wp - 46, hp, -E, E, rg.lo - 0.15, rg.hi + 0.15);
    plotFrame(ctx, A, 'x', 'f(x, b)', `y frozen at ${fmtNum(st.b, 3)} — the slope here is ∂f/∂x`);
    plotZeroY(ctx, A); plotTicksX(ctx, A, [-3, -1.5, 0, 1.5, 3], v => fmtNum(v, 2));
    plotCurve(ctx, A, x => f(x, st.b), 400, rgbCss(TH.warn), 2.2);
    /* the tangent line whose slope IS the partial derivative */
    plotCurve(ctx, A, x => f(st.a, st.b) + gx * (x - st.a), 2, rgbCss(TH.grad), 1.6);
    probeLine(ctx, A, st.a, 'x = a');
    plotFrame(ctx, B, 'y', 'f(a, y)', `x frozen at ${fmtNum(st.a, 3)} — the slope here is ∂f/∂y`);
    plotZeroY(ctx, B); plotTicksX(ctx, B, [-3, -1.5, 0, 1.5, 3], v => fmtNum(v, 2));
    plotCurve(ctx, B, y => f(st.a, y), 400, rgbCss(TH.curl), 2.2);
    plotCurve(ctx, B, y => f(st.a, st.b) + gy * (y - st.b), 2, rgbCss(TH.grad), 1.6);
    probeLine(ctx, B, st.b, 'y = b');
    stageNote(ctx, 'the straight lines are the tangents whose slopes the readout prints', W, H);
  },
  readout(st){
    const F = st.F; if(!F) return `<div class="card tight">${st.err}</div>`;
    const a = st.a, b = st.b;
    const H = mvHessian(F, a, b);
    return `<div class="card tight"><div class="ttl">First order at (${fmtNum(a, 3)}, ${fmtNum(b, 3)})</div>
      ${kv('f', fmtNum(F.f(a, b), 6))}
      ${kv('f<sub>x</sub>', fmtNum(F.fx(a, b), 6))}
      ${kv('f<sub>y</sub>', fmtNum(F.fy(a, b), 6))}
      <div class="dstep"><div class="lbl">∂f/∂x</div>${texEq(F.ax)}</div>
      <div class="dstep"><div class="lbl">∂f/∂y</div>${texEq(F.ay)}</div>
    </div>
    <div class="card tight"><div class="ttl">Second order — and Clairaut</div>
      ${kv('f<sub>xx</sub>', fmtNum(H.a, 6))}
      ${kv('f<sub>xy</sub>', fmtNum(F.fxy(a, b), 6))}
      ${kv('f<sub>y</sub>x', fmtNum(F.fyx(a, b), 6))}
      ${kv('f<sub>yy</sub>', fmtNum(H.c, 6))}
      ${kv('|f<sub>xy</sub> − f<sub>y</sub>x|', fmtNum(mvClairautGap(F, a, b), 3))}
      <div class="dstep"><div class="lbl">∂²f/∂y∂x  (differentiate in x, then y)</div>${texEq(F.axy)}</div>
      <div class="dstep"><div class="lbl">∂²f/∂x∂y  (the other order)</div>${texEq(F.ayx)}</div>
      <p class="help">Two different chains of algebra, the same answer. The mixed partial has a meaning
      worth holding on to: it measures how much the slope in x changes as you move in y — the twist of the
      surface. It is zero exactly when the surface separates as g(x) + h(y), and it is the off-diagonal
      entry of the Hessian that decides whether a critical point is a saddle.</p>
    </div>
    <div class="card tight"><div class="ttl">The Hessian at this point</div>
      ${ctMat([[H.a, H.b], [H.b, H.c]], ['∂/∂x', '∂/∂y'], ['∂/∂x', '∂/∂y'])}
      ${kv('determinant f<sub>xx</sub> f<sub>yy</sub> − f<sub>xy</sub>²', fmtNum(H.D, 6))}
      ${kv('trace f<sub>xx</sub> + f<sub>yy</sub>', fmtNum(H.tr, 6))}
      ${kv('eigenvalues', `${fmtNum(H.eig.l1, 5)}, ${fmtNum(H.eig.l2, 5)}`)}
      <p class="help">Third and higher partials exist too, and the same theorem applies: with enough
      continuity, all that matters is how many times you differentiated with respect to each variable, not
      the order. That is what makes a multivariable Taylor series manageable at all.</p>
    </div>`;
  },
  chip(st){
    if(!st.F) return `<div class="k">error</div>`;
    return `<div class="k">partials</div>
      <div style="color:var(--c-warn)">f<sub>x</sub> = ${fmtNum(st.F.fx(st.a, st.b), 4)}</div>
      <div style="color:var(--c-curl)">f<sub>y</sub> = ${fmtNum(st.F.fy(st.a, st.b), 4)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'the trace y = b, whose slope is f<sub>x</sub>'],
                    ['var(--c-curl)', 'the trace x = a, whose slope is f<sub>y</sub>'],
                    ['var(--c-grad)', 'the tangent lines, and ∇f']]; },
  dockLegend:true
};

/* ---- 4 · tangent planes and linear approximation --------------------------- */
