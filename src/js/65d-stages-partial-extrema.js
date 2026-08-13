STAGES.mvField = {
  title:'Gradient & directional derivative',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why one vector answers every question about direction',
      steps:[
        drvStep('the rate of change in a chosen direction',
          `${dv('D')}_u${dv('f')} ${dop('=')} ${dlim(dv('h'), '0')} ${dfrac(dv('f') + '(' + dv('r') + '+' + dv('h') + dv('u') + ') − ' + dv('f') + '(' + dv('r') + ')', dv('h'))}`,
          `at angle ${n(st.ang)} rad, from the point (${n(st.a)}, ${n(st.b)})`),
        drvStep('the chain rule collapses it to a dot product',
          `${dv('D')}_u${dv('f')} ${dop('=')} ∇${dv('f')} ${dop('·')} ${dv('u')}`,
          'so infinitely many directional derivatives are packed into one vector'),
        drvSay('u must be a unit vector, and that is not pedantry',
          'The dot product scales with the length of u, so a longer u would report a larger rate without anything about the function changing. Normalising is what makes the answer a property of the direction rather than of the arrow chosen to represent it.'),
        drvStep('now write the dot product with its angle',
          `∇${dv('f')} ${dop('·')} ${dv('u')} ${dop('=')} |∇${dv('f')}| cos θ`,
          `|∇f| = ${'the panel prints it, and the rose plot shows the rate against direction'}`),
        drvSay('and every property of the gradient falls out of that cosine',
          'The rate is largest when cos θ = 1, so the gradient points the steepest way up, and its magnitude is that steepest rate. It is most negative in the opposite direction. It is zero at right angles — which is along the contours. Three separate facts, one cosine.'),
        drvStep('so the rose of directional derivatives is a circle offset from the origin',
          `${dv('D')}_u${dv('f')}(θ) ${dop('=')} |∇${dv('f')}| cos(θ ${dop('−')} θ_grad)`,
          'the panel draws it — a cosine in polar coordinates, which is a circle through the origin'),
        drvSay('that shape is a proof by picture',
          'If the rose were any other shape, the gradient could not be a single vector dotted with the direction. Its being exactly a cosine confirms that the function is differentiable and that one vector suffices — for a non-differentiable point the rose would have corners.'),
        drvStep('and this is why gradient descent works',
          `move along ${dop('−')}∇${dv('f')} to decrease fastest`,
          'the steepest-descent direction, which every optimiser and neural network trains on'),
        drvSay('though steepest is not the same as best',
          'Following the gradient in a long narrow valley zigzags across it and makes painfully slow progress along it. That is why practical optimisers use momentum, conjugate directions or the Hessian — the steepest direction is locally optimal and globally often poor.')
      ],
      note:'The rose plot is computed by evaluating the directional derivative at many angles from the definition, not by drawing a cosine. That it comes out as a perfect offset circle is therefore evidence for the dot-product formula rather than an illustration of it.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key || 'wavehill';
    st.src = MV_FUNCS[st.key] ? MV_FUNCS[st.key].src : (o.src || 'x^2+y^2');
    st.a = o.a === undefined ? 1.1 : o.a;
    st.b = o.b === undefined ? 0.7 : o.b;
    st.ang = o.ang === undefined ? 0.6 : o.ang;
    st.show = Object.assign({ arrows:true, rose:true, level:true }, o.show || {});
    mvSafe(st);
  },
  controls(){
    const st = ST;
    return mvPick('mvGK', st.key) +
      ctlRow('direction', ctlSlider('mvGang', 0, 6.2832, 0.005, st.ang)) +
      `<div class="row wrap">${ctChk('mvGar', 'the gradient field', st.show.arrows)}
        ${ctChk('mvGro', 'the polar rose of D<sub>û</sub> f', st.show.rose)}
        ${ctChk('mvGlv', 'level curves', st.show.level)}</div>
      <p class="help"><b>Click anywhere on the map</b> to move the probe.
      <b>D<sub>û</sub>f = ∇f · û = |∇f| cos θ</b>, so the rate of change in a direction is just the
      gradient's shadow on that direction. Three consequences follow immediately and are all visible:
      the maximum is |∇f| along ∇f, the minimum is −|∇f| the other way, and the rate is <b>zero</b>
      exactly along the level curve.</p>
      <p class="help">The rose is the polar plot of D<sub>û</sub> f against direction. Because it is a cosine, it is
      always a pair of tangent circles — warm where f increases, cool where it decreases — meeting exactly
      at the two directions tangent to the level curve through the probe.</p>`;
  },
  wire(){
    mvWirePick('mvGK');
    wireSlider('mvGang', () => ST.ang, v => { ST.ang = v; }, v => ctDeg(+v));
    ctWireChk('mvGar', v => { ST.show.arrows = v; });
    ctWireChk('mvGro', v => { ST.show.rose = v; });
    ctWireChk('mvGlv', v => { ST.show.level = v; });
  },
  pick(st, sx, sy, phase){
    const P = st.P; if(!P || phase === 'up') return;
    if(P.inside(sx, sy)){ st.a = P.invX(sx); st.b = P.invY(sy); }
  },
  frame(st, dt, ctx, W, H){
    const F = st.F; if(!F) return;
    const f = (x, y) => F.f(x, y), E = 3.4;
    const P = ctBox(W, H, 0, 0, E);
    st.P = P;
    const rg = ctRange(f, P, 44);
    ctHeat(ctx, P, f, rg.lo, rg.hi, 62, 0.7);
    if(st.show.level){
      for(const L of ctLevels(rg.lo, rg.hi, 18)) ctContour(ctx, P, f, L, rgbCss(TH.text, 0.3), 1, 140);
      /* the level curve through the probe, emphasised */
      ctContour(ctx, P, f, f(st.a, st.b), rgbCss(TH.text, 0.9), 2.2, 180);
    }
    if(st.show.arrows){
      const n = 15;
      let mx = 1e-9;
      const G = [];
      for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
        const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / n, y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / n;
        const gx = F.fx(x, y), gy = F.fy(x, y);
        if(!Number.isFinite(gx) || !Number.isFinite(gy)) continue;
        G.push({ x, y, gx, gy }); mx = Math.max(mx, Math.hypot(gx, gy));
      }
      const s = (P.x1 - P.x0) / n * 0.85 / mx;
      for(const g of G)
        ctArrow(ctx, P, g.x, g.y, g.x + g.gx * s, g.y + g.gy * s, rgbCss(TH.grad, 0.62), 1.4);
    }
    ctFrame(ctx, P, mvName(st) + '  —  click to move the probe');
    const gx = F.fx(st.a, st.b), gy = F.fy(st.a, st.b);
    const gl = Math.hypot(gx, gy);
    const ux = Math.cos(st.ang), uy = Math.sin(st.ang);
    const D = gx * ux + gy * uy;
    if(st.show.rose && gl > 1e-9){
      const sc = 0.9 / gl;
      ctParam(ctx, P, t => {
        const v = (gx * Math.cos(t) + gy * Math.sin(t)) * sc;
        return { x:st.a + v * Math.cos(t), y:st.b + v * Math.sin(t) };
      }, 0, 2 * Math.PI, 300, rgbCss(TH.curl, 0.9), 1.8);
    }
    /* the gradient, the direction, and the bar whose length is the answer */
    const s = 0.9 / (gl || 1);
    ctArrow(ctx, P, st.a, st.b, st.a + gx * s, st.b + gy * s, rgbCss(TH.grad), 3, '∇f');
    ctArrow(ctx, P, st.a, st.b, st.a + ux * 0.9, st.b + uy * 0.9, rgbCss(TH.pos), 2.2, 'û');
    ctArrow(ctx, P, st.a, st.b, st.a + ux * D * s, st.b + uy * D * s, rgbCss(TH.warn), 5, null);
    /* the drop line: the projection made literal */
    ctPath(ctx, P, [{ x:st.a + gx * s, y:st.b + gy * s }, { x:st.a + ux * D * s, y:st.b + uy * D * s }],
           rgbCss(TH.faint), 1.2, [4, 4]);
    ctDot(ctx, P, st.a, st.b, 6, rgbCss(TH.text), rgbCss(TH.bg));
    stageNote(ctx, 'the thick bar is the directional derivative — it is the gradient projected onto û, and nothing more', W, H);
  },
  readout(st){
    const F = st.F; if(!F) return `<div class="card tight">${st.err}</div>`;
    const gx = F.fx(st.a, st.b), gy = F.fy(st.a, st.b), gl = Math.hypot(gx, gy);
    const ux = Math.cos(st.ang), uy = Math.sin(st.ang);
    const D = gx * ux + gy * uy;
    const th = Math.atan2(gy, gx);
    return `<div class="card tight"><div class="ttl">At the probe (${fmtNum(st.a, 3)}, ${fmtNum(st.b, 3)})</div>
      ${kv('f', fmtNum(F.f(st.a, st.b), 6))}
      ${kv('∇f', ctVec2({ x:gx, y:gy }))}
      ${kv('|∇f| — the steepest rate', fmtNum(gl, 6))}
      ${kv('uphill direction', ctDeg(th))}
      ${kv('û', ctVec2({ x:ux, y:uy }))}
      ${kv('D<sub>û</sub> f = ∇f·û', fmtNum(D, 6))}
      ${kv('|∇f| cos θ', fmtNum(gl * Math.cos(st.ang - th), 6))}
      ${kv('as a fraction of the maximum', fmtNum(gl > 1e-12 ? D / gl : 0, 4))}
    </div>
    <div class="card tight"><div class="ttl">The three consequences</div>
      ${kv('maximum rate  (θ = 0)', fmtNum(gl, 6))}
      ${kv('minimum rate  (θ = π)', fmtNum(-gl, 6))}
      ${kv('rate along the level curve', fmtNum(gx * (-gy / (gl || 1)) + gy * (gx / (gl || 1)), 3))}
      ${kv('∇f · (tangent to the level curve)', fmtNum(gx * (-gy) + gy * gx, 3))}
      <p class="help">The last two rows are zero, which is the reason a gradient is always perpendicular to
      the level set through its point: moving along a level curve does not change f, so the directional
      derivative there is zero, so the dot product with ∇f is zero. Every "steepest descent" algorithm in
      the optimisation literature is that observation, iterated.</p>
    </div>
    <div class="card tight"><div class="ttl">Symbolically</div>
      <div class="dstep"><div class="lbl">f</div>${texEq(F.ast)}</div>
      <div class="dstep"><div class="lbl">∂f/∂x</div>${texEq(F.ax)}</div>
      <div class="dstep"><div class="lbl">∂f/∂y</div>${texEq(F.ay)}</div>
    </div>`;
  },
  chip(st){
    if(!st.F) return `<div class="k">error</div>`;
    const gx = st.F.fx(st.a, st.b), gy = st.F.fy(st.a, st.b);
    const D = gx * Math.cos(st.ang) + gy * Math.sin(st.ang);
    return `<div class="k">D<sub>û</sub> f</div><div style="color:var(--c-warn)">${fmtNum(D, 4)}</div>
      <div>|∇f| = ${fmtNum(Math.hypot(gx, gy), 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', '∇f — steepest ascent'], ['var(--c-pos)', 'û — your direction'],
                    ['var(--c-warn)', 'D<sub>û</sub> f, drawn as a length'], ['var(--c-curl)', 'the rose of all directions'],
                    ['var(--text)', 'the level curve through the probe']]; },
  dockLegend:true
};

/* ---- 7 · critical points and their classification ------------------------- */
STAGES.mvCrit = {
  title:'Critical points',
  derive(st){
    return {
      title:'Finding the flat spots, then asking which way the surface curves',
      steps:[
        drvStep('at an extremum the surface must be level in every direction',
          `∇${dv('f')} ${dop('=')} 0`,
          'the panel solves this numerically and marks every solution it finds'),
        drvSay('why the gradient rather than each partial separately',
          'If any directional derivative were nonzero, moving that way would increase f and moving the opposite way would decrease it, so the point could not be an extremum. Every directional derivative is ∇f·u, and that vanishes for all u only when ∇f itself is zero.'),
        drvStep('but flat does not mean extreme',
          `a saddle also has ∇${dv('f')} ${dop('=')} 0`,
          'up in one direction and down in another — the classification needs second derivatives'),
        drvStep('expand to second order about the critical point',
          `Δ${dv('f')} ${dop('≈')} ${dfrac('1', '2')}[Δ${dv('x')} Δ${dv('y')}] ${dv('H')} [Δ${dv('x')} Δ${dv('y')}]ᵀ`,
          'the linear term is gone, so the quadratic term decides everything'),
        drvStep('the Hessian is that matrix of second partials',
          `${dv('H')} ${dop('=')} [ ${dv('f')}ₓₓ ${dv('f')}ₓ_y ; ${dv('f')}ₓ_y ${dv('f')}_yy ]`,
          'symmetric, because mixed partials commute — which is what makes the next step legal'),
        drvSay('and now the quadratic-forms stage has already done the work',
          'A symmetric matrix has real orthogonal eigenvectors, and in those directions the quadratic form is a plain sum of squares. Both eigenvalues positive means a bowl, both negative a dome, opposite signs a saddle. The classification is the sign pattern of two numbers.'),
        drvStep('so the discriminant test is the determinant of the Hessian',
          `${dv('D')} ${dop('=')} ${dv('f')}ₓₓ${dv('f')}_yy ${dop('−')} ${dv('f')}ₓ_y²`,
          'the panel prints the eigenvalues themselves as well, since they are what the test is really about'),
        drvSay('which is why the rule looks arbitrary but is not',
          'D is the product of the eigenvalues, so D > 0 means they share a sign and f_xx says which. D < 0 means opposite signs, hence a saddle. The rule taught as a recipe is the eigenvalue criterion with the eigenvalues never computed.'),
        drvStep('and D = 0 is genuinely inconclusive',
          `${dv('D')} ${dop('=')} 0 ${dop('⇒')} the test says nothing`,
          'a zero eigenvalue means the quadratic term vanishes in some direction, and higher terms decide'),
        drvSay('one more difference from one variable',
          'On an interval, a single interior critical point that is a local minimum is the global one. In two variables that fails: a surface can have a local minimum and still run off to −∞ elsewhere. Checking the boundary and the behaviour at infinity is not optional.')
      ],
      note:'The critical points are located by a numerical search for zeros of the gradient, and each is classified from the eigenvalues of the Hessian computed there. Switching the function re-solves from scratch — nothing about the positions or the classifications is hard-coded.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key || 'wavehill';
    st.src = MV_FUNCS[st.key] ? MV_FUNCS[st.key].src : (o.src || 'x^2+y^2');
    st.ext = o.ext || 3.2;
    st.sel = 0;
    st.show = Object.assign({ eig:true, zero:true }, o.show || {});
    mvSafe(st);
    this.solve(st);
  },
  solve(st){
    st.cps = st.F ? mvCriticalPoints(st.F, -st.ext, st.ext, -st.ext, st.ext, 22) : [];
    st.sel = Math.min(st.sel, Math.max(0, st.cps.length - 1));
  },
  controls(){
    const st = ST;
    return mvPick('mvXK', st.key) +
      (st.cps && st.cps.length
        ? ctSeg('mvXsel', String(st.sel), st.cps.map((c, i) =>
            [String(i), `(${fmtNum(c.x, 2)}, ${fmtNum(c.y, 2)}) ${c.kind === 'saddle' ? 'saddle' : c.kind === 'local minimum' ? 'min' : c.kind === 'local maximum' ? 'max' : '?'}`]))
        : '<p class="help">No critical points found in this window.</p>') +
      `<div class="row wrap">${ctChk('mvXe', 'the Hessian eigen-directions', st.show.eig)}
        ${ctChk('mvXz', 'the curves f<sub>x</sub> = 0 and f<sub>y</sub> = 0', st.show.zero)}</div>
      <p class="help">A critical point is where <b>∇f = 0</b> — where both partials vanish at once, so the
      tangent plane is horizontal. These are found here by <b>searching</b>: Newton's method is launched
      from a grid of starting points on the system f<sub>x</sub> = f<sub>y</sub> = 0, and duplicates are merged. Nothing is
      hard-coded, so switching the function genuinely re-solves.</p>
      <p class="help">The <b>discriminant</b> <b>D = f<sub>xx</sub>f<sub>yy</sub> − f<sub>xy</sub>²</b> is
      the determinant of the Hessian, and it is the product of the two eigenvalues. D &lt; 0 means the
      eigenvalues have opposite signs — up one way, down the other — which is a <b>saddle</b>. D &gt; 0
      means they agree, and then f<sub>xx</sub> says which: negative for a maximum, positive for a minimum.
      D = 0 means one eigenvalue vanished and the second-order terms have run out of information; the test
      genuinely says nothing, as the monkey saddle demonstrates.</p>`;
  },
  wire(){
    mvWirePick('mvXK', () => STAGES.mvCrit.solve(ST));
    ctWireSeg('mvXsel', v => { ST.sel = +v; });
    ctWireChk('mvXe', v => { ST.show.eig = v; });
    ctWireChk('mvXz', v => { ST.show.zero = v; });
  },
  pick(st, sx, sy, phase){
    if(phase === 'up' || !st.P || !st.cps || !st.cps.length) return;
    const x = st.P.invX(sx), y = st.P.invY(sy);
    let best = 0, bd = Infinity;
    st.cps.forEach((c, i) => { const d = Math.hypot(c.x - x, c.y - y); if(d < bd){ bd = d; best = i; } });
    st.sel = best;
  },
  frame(st, dt, ctx, W, H){
    const F = st.F; if(!F) return;
    const f = (x, y) => F.f(x, y), E = st.ext;
    const P = ctBox(W, H, 0, 0, E);
    st.P = P;
    const rg = ctRange(f, P, 44);
    ctHeat(ctx, P, f, rg.lo, rg.hi, 60, 0.66);
    for(const L of ctLevels(rg.lo, rg.hi, 20)) ctContour(ctx, P, f, L, rgbCss(TH.text, 0.3), 1, 140);
    if(st.show.zero){
      ctContour(ctx, P, (x, y) => F.fx(x, y), 0, rgbCss(TH.curl, 0.9), 2, 170);
      ctContour(ctx, P, (x, y) => F.fy(x, y), 0, rgbCss(TH.pos, 0.9), 2, 170);
    }
    ctFrame(ctx, P, mvName(st) + '  —  critical points, found by search');
    const cols = { 'local minimum':TH.pos, 'local maximum':TH.neg, saddle:TH.warn, degenerate:TH.faint, undefined:TH.faint };
    (st.cps || []).forEach((c, i) => {
      const col = rgbCss(cols[c.kind] || TH.faint);
      ctDot(ctx, P, c.x, c.y, i === st.sel ? 8 : 5, col, rgbCss(TH.bg));
      if(i === st.sel && st.show.eig){
        for(const [vv, lam, cc] of [[c.v1, c.l1, TH.neg], [c.v2, c.l2, TH.pos]]){
          const s = 0.85;
          ctPath(ctx, P, [{ x:c.x - vv.x * s, y:c.y - vv.y * s }, { x:c.x + vv.x * s, y:c.y + vv.y * s }],
                 rgbCss(lam < 0 ? TH.neg : TH.pos, 0.95), 2.6);
        }
      }
    });
    /* canvas text, so the notation is Unicode — no markup can reach fillText */
    stageNote(ctx, 'blue and green curves are ∂f/∂x = 0 and ∂f/∂y = 0 — the critical points are exactly where they cross', W, H);
  },
  readout(st){
    const F = st.F; if(!F) return `<div class="card tight">${st.err}</div>`;
    const cps = st.cps || [];
    if(!cps.length) return `<div class="card tight"><div class="ttl">Nothing to classify</div>
      <p class="help">No point in this window has both partials vanishing.</p></div>`;
    const c = cps[Math.min(st.sel, cps.length - 1)];
    const rows = cps.map((p, i) =>
      kv(`${i === st.sel ? '▸ ' : ''}(${fmtNum(p.x, 3)}, ${fmtNum(p.y, 3)})`,
         `${p.kind}, f = ${fmtNum(p.f, 4)}`)).join('');
    return `<div class="card tight"><div class="ttl">Every critical point in the window</div>
      ${rows}
      ${kv('how many', String(cps.length))}
    </div>
    <div class="card tight"><div class="ttl">The selected point</div>
      ${kv('(a, b)', ctVec2(c))}
      ${kv('f', fmtNum(c.f, 6))}
      ${kv('f<sub>x</sub>', fmtNum(F.fx(c.x, c.y), 3))}
      ${kv('f<sub>y</sub>', fmtNum(F.fy(c.x, c.y), 3))}
      ${kv('f<sub>xx</sub>', fmtNum(c.H.a, 6))}
      ${kv('f<sub>xy</sub>', fmtNum(c.H.b, 6))}
      ${kv('f<sub>yy</sub>', fmtNum(c.H.c, 6))}
      ${kv('D = f<sub>xx</sub> f<sub>yy</sub> − f<sub>xy</sub>²', fmtNum(c.H.D, 6))}
      ${kv('verdict', c.kind)}
    </div>
    <div class="card tight"><div class="ttl">What the Hessian's eigenvalues say</div>
      ${kv('λ₁', fmtNum(c.l1, 6))}
      ${kv('λ₂', fmtNum(c.l2, 6))}
      ${kv('λ₁·λ₂ = D', fmtNum(c.l1 * c.l2, 6))}
      ${kv('λ₁ + λ₂ = trace', fmtNum(c.l1 + c.l2, 6))}
      ${kv('direction of λ₁', ctVec2(c.v1))}
      ${kv('direction of λ₂', ctVec2(c.v2))}
      <p class="help">The eigenvalues are the second derivatives along the two principal directions, and
      the eigenvectors are those directions — drawn on the map. A saddle has one positive and one negative,
      so the two lines drawn through it are literally the uphill and downhill axes. The discriminant test
      is the eigenvalue test with the eigenvalues never computed, which is why it is stated as a
      determinant.</p>
      <p class="help">Note what the test cannot do. It is a statement about <i>local</i> behaviour only —
      a local minimum need not be global — and it says nothing at all when D = 0, where the quadratic
      approximation is degenerate and the answer lives in the cubic terms.</p>
    </div>`;
  },
  chip(st){
    const c = st.cps && st.cps[st.sel];
    if(!c) return `<div class="k">no critical points</div>`;
    return `<div class="k">${c.kind}</div><div style="color:var(--c-warn)">D = ${fmtNum(c.H.D, 4)}</div>
      <div>f = ${fmtNum(c.f, 4)}</div>`;
  },
  legend(){ return [['var(--c-pos)', 'local minimum · positive eigen-direction'],
                    ['var(--c-neg)', 'local maximum · negative eigen-direction'],
                    ['var(--c-warn)', 'saddle'], ['var(--c-curl)', 'the curve f<sub>x</sub> = 0']]; },
  dockLegend:true
};

/* ---- 8 · Lagrange multipliers --------------------------------------------- */
STAGES.mvLagr = {
  title:'Lagrange multipliers',
  derive(st){
    return {
      title:'Optimising along a constraint, by asking when the contours stop crossing it',
      steps:[
        drvSay('why the ordinary method fails here',
          'Setting ∇f = 0 finds the peak of the whole landscape. But we are confined to a path, and the best point on that path is almost never the peak of the landscape. Points where the gradient vanishes are irrelevant if they are off the constraint.'),
        drvStep('the geometric condition, before any algebra',
          `the level curve of ${dv('f')} is tangent to the constraint`,
          'the panel animates a point along the constraint and shows the contour it currently sits on'),
        drvSay('here is the argument, and it is completely visual',
          'Walk along the constraint. If your path crosses a contour of f, then f is changing — and crossing means you can go either way to increase or decrease it, so you are not at an extremum. Only where the path grazes a contour tangentially does f stop changing. Tangency is the condition.'),
        drvStep('tangency of curves means parallel normals',
          `∇${dv('f')} ${dop('=')} λ∇${dv('g')}`,
          'both gradients are perpendicular to their own level curves, so tangent curves have parallel gradients'),
        drvSay('and that is the whole method — λ is a bookkeeping device',
          'The multiplier exists only to say "parallel, but possibly different lengths". It is not something you set out to find. Introducing one extra unknown is a small price for turning a constrained problem into an unconstrained system of equations.'),
        drvStep('solve the system together with the constraint',
          `∇${dv('f')} ${dop('=')} λ∇${dv('g')} , &nbsp; ${dv('g')} ${dop('=')} ${dv('c')}`,
          'three equations in three unknowns for a two-variable problem — the panel solves and marks the solutions'),
        drvSay('but λ does carry meaning, and useful meaning',
          'It is the rate at which the optimal value changes as the constraint is relaxed: df*/dc = λ. In economics that is a shadow price — what one more unit of the constrained resource is worth. In thermodynamics the same construction produces temperature and chemical potential as multipliers.'),
        drvStep('the method finds candidates, not answers',
          `compare ${dv('f')} at every solution`,
          'the equations locate stationary points along the constraint; which is the maximum requires evaluating and comparing'),
        drvSay('and it fails where the constraint gradient vanishes',
          'If ∇g = 0 at a point, the constraint has a cusp or a singularity and has no well-defined tangent direction for f to be parallel to. The method is silent there, and such points must be checked separately.')
      ],
      note:'The animation walks a point along the constraint and draws the contour of f through it. Where the contour crosses the constraint, f is still changing; where it grazes, the point is stationary. That moment of tangency is the entire theorem, watched rather than derived.'
    };
  },
  enter(st, o){
    st.prob = o.prob || 'circle';
    st.t = 0.6;
    st.run = o.run !== false;
    this.build(st);
  },
  problems(){
    return {
      circle: { name:'maximise x + y on x² + y² = 1', f:'x+y', g:'x^2+y^2-1',
        param:t => ({ x:Math.cos(t), y:Math.sin(t) }), t0:0, t1:2 * Math.PI,
        note:'The textbook first example. The answer √2 at (1/√2, 1/√2) is where the line x + y = k last touches the circle — and "last touches" is exactly tangency.' },
      product: { name:'maximise x·y on x + y = 4', f:'x y', g:'x+y-4',
        param:t => ({ x:t, y:4 - t }), t0:-2, t1:6,
        note:'The isoperimetric problem in miniature: among all rectangles of a given perimeter, the square has the largest area. Lagrange finds it in two lines.' },
      ellipse: { name:'extremes of x² + 2y² on the ellipse x²/4 + y² = 1', f:'x^2+2y^2', g:'x^2/4+y^2-1',
        param:t => ({ x:2 * Math.cos(t), y:Math.sin(t) }), t0:0, t1:2 * Math.PI,
        note:'Four stationary points rather than two — the two ends of each axis — with the maximum and minimum alternating around the constraint. Constrained problems often have more solutions than you expect.' },
      dist: { name:'nearest point of the parabola y = x² − 1 to (0, 0)', f:'x^2+y^2', g:'y-x^2+1',
        param:t => ({ x:t, y:t * t - 1 }), t0:-2, t1:2,
        note:'Minimising the <i>squared</i> distance rather than the distance itself — same minimiser, far kinder algebra. There are two symmetric answers and one spurious critical point at the vertex.' },
      hyper: { name:'extremes of x·y on x² + 4y² = 8', f:'x y', g:'x^2+4y^2-8',
        param:t => ({ x:2 * Math.SQRT2 * Math.cos(t), y:Math.SQRT2 * Math.sin(t) }), t0:0, t1:2 * Math.PI,
        note:'The level curves of xy are hyperbolas, and the answer is where one of them is tangent to the ellipse — a picture that makes the method obvious in a way the algebra does not.' }
    };
  },
  build(st){
    const P = mvLagrCur(st);
    try {
      st.F = mvCompile(P.f); st.G = mvCompile(P.g); st.err = '';
      st.sols = mvLagrangeSolve(st.F, st.G, P.param, P.t0, P.t1, 900);
    } catch(e){ st.err = String(e && e.message || e); st.sols = []; }
  },
  controls(){
    const st = ST, P = mvLagrCur(st);
    return pkSeg('mvLgP', this.problems(), st.prob, e => e.name.split(' on ')[0]) +
      pkBoxes('mvlagr', st.prob, st, MV_LAGR_OWN, null,
        'Both boxes take anything the engine understands. The constraint is whatever curve <b>g = 0</b> ' +
        'cuts out — it is traced numerically, so it need not be a circle or a line. Try ' +
        '<b>x^3 - 3x - y</b>, or <b>sin(x) - y/2</b>.') +
      ctlRow('walk t', ctlSlider('mvLgt', P.t0, P.t1, (P.t1 - P.t0) / 1200, st.t)) +
      ctChk('mvLgrun', 'walk the constraint', st.run) +
      `<p class="help"><b>${P.name}</b><br>${P.note}</p>
      <p class="help">Walk along the constraint and watch the value of f rise and fall. At an extreme the
      constraint curve is <b>tangent</b> to a level curve of f — because if it crossed one, you could step
      either way and change f, so you were not at an extreme. Tangency of the curves means their normals
      are parallel, and the normals are the gradients:</p>
      <p class="help"><b>∇f = λ∇g</b>, together with <b>g = 0</b>. The multiplier λ is not a nuisance
      variable: it is the rate at which the optimal value would improve if the constraint were relaxed —
      the shadow price. The readout prints it live.</p>`;
  },
  wire(){
    pkWire('mvLgP', 'mvlagr', ST.prob, ST, MV_LAGR_OWN, null,
      v => { ST.prob = v; },
      () => { const P = mvLagrCur(ST); ST.t = P.t0 + (P.t1 - P.t0) * 0.2; STAGES.mvLagr.build(ST); });
    wireSlider('mvLgt', () => ST.t, v => { ST.t = v; ST.run = false; const c = $('mvLgrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    ctWireChk('mvLgrun', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    const F = st.F, G = st.G; if(!F || !G) return;
    const P0 = mvLagrCur(st);
    if(st.run){ st.t += dt * (P0.t1 - P0.t0) * 0.12; if(st.t > P0.t1) st.t = P0.t0; }
    const E = 2.9;
    const P = ctBox(W, H, 0, 0, E, { r:W * 0.46 });
    const f = (x, y) => F.f(x, y);
    const rg = ctRange(f, P, 40);
    ctHeat(ctx, P, f, rg.lo, rg.hi, 54, 0.5);
    for(const L of ctLevels(rg.lo, rg.hi, 18)) ctContour(ctx, P, f, L, rgbCss(TH.text, 0.26), 1, 130);
    /* the constraint, and the level curve of f through the walking point */
    ctContour(ctx, P, (x, y) => G.f(x, y), 0, rgbCss(TH.pos), 3, 200);
    const p = P0.param(st.t);
    ctContour(ctx, P, f, f(p.x, p.y), rgbCss(TH.grad, 0.95), 2.2, 200);
    ctFrame(ctx, P, P0.name);
    const gf = mvGrad(F, p.x, p.y), gg = mvGrad(G, p.x, p.y);
    const s1 = 0.7 / (Math.hypot(gf.x, gf.y) || 1), s2 = 0.7 / (Math.hypot(gg.x, gg.y) || 1);
    ctArrow(ctx, P, p.x, p.y, p.x + gf.x * s1, p.y + gf.y * s1, rgbCss(TH.grad), 2.8, '∇f');
    ctArrow(ctx, P, p.x, p.y, p.x + gg.x * s2, p.y + gg.y * s2, rgbCss(TH.pos), 2.8, '∇g');
    ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.text), rgbCss(TH.bg));
    for(const s of (st.sols || [])){
      ctDot(ctx, P, s.x, s.y, 7, rgbCss(TH.warn), rgbCss(TH.bg));
    }
    /* f along the constraint, as its own graph */
    const x0 = W * 0.53;
    const Q = mkPlot(x0 + 46, 56, W - x0 - 86, H - 150, P0.t0, P0.t1, rg.lo - 0.2, rg.hi + 0.2);
    plotFrame(ctx, Q, 't  along the constraint', 'f', 'f restricted to g = 0');
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [P0.t0, (P0.t0 + P0.t1) / 2, P0.t1], v => fmtNum(v, 3));
    plotCurve(ctx, Q, t => { const q = P0.param(t); return f(q.x, q.y); }, 400, rgbCss(TH.grad), 2.2);
    for(const s of (st.sols || [])){
      if(s.t >= P0.t0 && s.t <= P0.t1) probeLine(ctx, Q, s.t, null);
    }
    probeLine(ctx, Q, st.t, 't');
    stageNote(ctx, 'the orange dots are where ∇f and ∇g line up — the stationary points of f on the constraint', W, H);
  },
  readout(st){
    const F = st.F, G = st.G;
    if(!F || !G) return `<div class="card tight">${st.err}</div>`;
    const P0 = mvLagrCur(st);
    const cur = mvLagrangeOn(F, G, P0.param, st.t);
    const sols = (st.sols || []).slice().sort((a, b) => b.f - a.f);
    return `<div class="card tight"><div class="ttl">Where you are standing</div>
      ${kv('point', ctVec2(cur.p))}
      ${kv('g there', fmtNum(cur.g, 3))}
      ${kv('f there', fmtNum(cur.f, 6))}
      ${kv('∇f', ctVec2(cur.gf))}
      ${kv('∇g', ctVec2(cur.gg))}
      ${kv('∇f × ∇g  (zero ⇒ parallel)', fmtNum(cur.cross, 5))}
      ${kv('λ if they were parallel', fmtNum(cur.lam, 5))}
    </div>
    <div class="card tight"><div class="ttl">The solutions, found by root-finding</div>
      ${sols.map((s, i) => kv(`(${fmtNum(s.x, 4)}, ${fmtNum(s.y, 4)})`,
        `f = ${fmtNum(s.f, 5)} · λ = ${fmtNum(s.lam, 4)}`)).join('')}
      ${kv('maximum on the constraint', sols.length ? fmtNum(sols[0].f, 6) : '—')}
      ${kv('minimum on the constraint', sols.length ? fmtNum(sols[sols.length - 1].f, 6) : '—')}
      <p class="help">These are the zeros of <b>∇f × ∇g</b> along the constraint, located by scanning for
      sign changes and refining by bisection. Every one of them satisfies ∇f = λ∇g exactly; whether each is
      a maximum, a minimum, or neither is settled by comparing values, because the method finds stationary
      points and does not classify them.</p>
    </div>
    <div class="card tight"><div class="ttl">What λ means</div>
      ${kv('λ at the maximum', sols.length ? fmtNum(sols[0].lam, 5) : '—')}
      <p class="help">Relax the constraint from g = 0 to g = ε and the optimal value shifts by
      <b>−λ·ε</b> to first order. In economics λ is the marginal value of another unit of the scarce
      resource; in mechanics it is the constraint force — the tension in the string that keeps the bead on
      the wire; in thermodynamics the Lagrange multipliers of the maximum-entropy problem come out as
      temperature and chemical potential. It is one of the quantities in mathematics that keeps turning up
      wearing different clothes.</p>
    </div>`;
  },
  chip(st){
    const s = (st.sols || []).slice().sort((a, b) => b.f - a.f)[0];
    return `<div class="k">Lagrange</div>
      <div style="color:var(--c-warn)">max f = ${s ? fmtNum(s.f, 4) : '—'}</div>
      <div>λ = ${s ? fmtNum(s.lam, 4) : '—'}</div>`;
  },
  legend(){ return [['var(--c-pos)', 'the constraint g = 0, and ∇g'], ['var(--c-grad)', 'the level curve of f, and ∇f'],
                    ['var(--c-warn)', 'the stationary points']]; },
  dockLegend:true
};

/* ---- 9 · the Jacobian ------------------------------------------------------ */
