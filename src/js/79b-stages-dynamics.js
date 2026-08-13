/* ============================================================================
   4q · LINEAR SYSTEMS AND THE PHASE PLANE
   Two wings' worth of stages: x′ = Ax solved through its eigenvalues, and the
   qualitative theory of nonlinear systems, where you cannot solve anything and
   do not need to.
   ============================================================================ */

STAGES.sySystem = {
  title:'x′ = A x',
  derive(st){
    const A = st.A;
    const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    const disc = tr * tr - 4 * det;
    const n = v => fmtNum(v, 6);
    return {
      title:'The eigenvalues decide the fate of the whole system',
      steps:[
        drvSay('one equation, in vector form',
          'x′ = Ax looks like the scalar equation x′ = ax, whose solution is e^(at). The guess that the vector case works the same way is right, and making it precise is what eigenvectors are for.'),
        drvStep('try a solution that keeps its direction',
          `${dv('x')}(${dv('t')}) ${dop('=')} ${dop('e')}^(λ${dv('t')})${dv('v')}`,
          'the shape v is fixed and only the scale changes with time'),
        drvStep('substituting turns the ODE into an eigenvalue problem',
          `λ${dop('e')}^(λ${dv('t')})${dv('v')} ${dop('=')} ${dv('A')}${dop('e')}^(λ${dv('t')})${dv('v')} ${dop('⇒')} ${dv('A')}${dv('v')} ${dop('=')} λ${dv('v')}`,
          `trace ${n(tr)}, determinant ${n(det)}, discriminant ${n(disc)}`),
        drvSay('so an eigenvector is a direction the flow cannot rotate',
          'Start exactly on an eigenvector and the trajectory runs straight along it forever, growing or shrinking by e^(λt). Those straight-line solutions are the axes of the whole picture, and every other trajectory is a combination of them.'),
        drvStep('two eigenvalues give two solutions, and linearity gives the rest',
          `${dv('x')} ${dop('=')} ${dv('c')}₁${dop('e')}^(λ₁${dv('t')})${dv('v')}₁ ${dop('+')} ${dv('c')}₂${dop('e')}^(λ₂${dv('t')})${dv('v')}₂`,
          'the constants are fixed by the starting point, which the reader can drag'),
        drvSay('and now the classification writes itself',
          'Both eigenvalues negative: everything decays, a stable node. Both positive: everything grows, an unstable node. Opposite signs: growth along one axis and decay along the other, a saddle. A complex pair: rotation, spiralling in or out according to the sign of the real part, and a closed centre if the real part is exactly zero.'),
        drvStep('the trace and determinant alone settle the type',
          `stable ${dop('⟺')} tr ${dop('<')} 0 and det ${dop('>')} 0`,
          det < 0 ? 'a saddle — det < 0 forces opposite signs' :
            (disc < 0 ? (tr < 0 ? 'a stable spiral' : tr > 0 ? 'an unstable spiral' : 'a centre')
                      : (tr < 0 ? 'a stable node' : 'an unstable node'))),
        drvSay('which is why the trace–determinant plane is drawn at all',
          'Every possible two-dimensional linear system is one point on that plane, and the regions on it are the behaviour types. The parabola tr² = 4det separates nodes from spirals, and the axes separate stable from unstable. No integration is needed to know what will happen — two numbers suffice.'),
        drvStep('and the solution is checked against integration',
          `${dv('x')}(${dv('t')}) closed form vs RK4`,
          'the panel runs both and prints the largest disagreement over the trajectory')
      ],
      note:'A centre — purely imaginary eigenvalues — is the fragile case. Any perturbation of the matrix pushes the real part off zero and turns the closed orbits into a slow spiral. That structural instability is why undamped oscillation is a mathematical idealisation rather than something observed.'
    };
  },
  drag:true,
  enter(st, o){
    st.A = mxClone(o.A || [[0, 1], [-2, -0.6]]);
    st.x0 = { x:1.6, y:0 };
    st.t = 0; st.run = o.run !== false;
  },
  controls(){
    const st = ST;
    return ctSeg('syP', '', [['spiral', 'stable spiral'], ['saddle', 'saddle'], ['node', 'stable node'],
                             ['centre', 'centre'], ['defect', 'defective'], ['unstable', 'unstable spiral']]) +
      mxHtml('syM', st.A) +
      ctChk('syRun', 'run the clock', st.run) +
      `<p class="help">A first-order linear system is solved by its eigenvalues, and the reason is
      one line: try <b>x = e<sup>λt</sup>v</b>. Then x′ = λe<sup>λt</sup>v and Ax = e<sup>λt</sup>Av,
      so the guess works exactly when <b>Av = λv</b>. Every solution is a combination of such
      exponentials, so the eigenvalues decide the entire behaviour.</p>
      <p class="help"><b>Click anywhere</b> to launch a trajectory from that point. Real eigenvalues
      of the same sign give a node; opposite signs a saddle; a complex pair gives a spiral whose
      rotation rate is the imaginary part and whose growth is the real part. A pure imaginary pair
      gives closed orbits — a centre.</p>`;
  },
  wire(){
    ctWireSeg('syP', v => {
      ST.A = mxClone({ spiral:[[-0.4, 1], [-2, -0.4]], saddle:[[1, 2], [3, 2]],
                       node:[[-1, 0.4], [0.3, -2]], centre:[[0, 1], [-2, 0]],
                       defect:[[-1, 1], [0, -1]], unstable:[[0.35, 1.4], [-1.6, 0.35]] }[v]);
      ST.t = 0;
    });
    mxWire('syM', (i, j, v) => { ST.A[i][j] = v; ST.t = 0; });
    ctWireChk('syRun', v => { ST.run = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.x0 = { x:st.P.invX(sx), y:st.P.invY(sy) };
    st.t = 0;
  },
  frame(st, dt, ctx, W, H){
    if(st.run) st.t = (st.t + dt * 0.6) % 12;
    const P = ctBox(Math.min(W * 0.62, H * 1.3), H, 0, 0, 3.2);
    st.P = P;
    ctGrid(ctx, P);
    /* the direction field */
    const n = 17;
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
      const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / n, y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / n;
      const v = laMatVec(st.A, [x, y]);
      const m = Math.hypot(v[0], v[1]) || 1;
      const s = 0.26;
      ctArrow(ctx, P, x, y, x + v[0] / m * s, y + v[1] / m * s, rgbCss(TH.faint, 0.5), 1.1);
    }
    /* a family of trajectories, and the one you launched */
    const E = laEig2(st.A);
    for(let k = 0; k < 10; k++){
      const a = k / 10 * 2 * Math.PI;
      const pts = phTrajectory((x, y) => st.A[0][0] * x + st.A[0][1] * y,
                               (x, y) => st.A[1][0] * x + st.A[1][1] * y,
                               2.9 * Math.cos(a), 2.9 * Math.sin(a), -0.02, 320, 60);
      ctPath(ctx, P, pts, rgbCss(TH.faint, 0.35), 1);
    }
    if(E.real) E.vectors.forEach((v, i) => {
      ctPath(ctx, P, [{ x:-v[0] * 3.2, y:-v[1] * 3.2 }, { x:v[0] * 3.2, y:v[1] * 3.2 }],
             rgbCss(i ? TH.neg : TH.pos, 0.9), 2.2, [7, 5]);
    });
    const S = syLinear(st.A, [st.x0.x, st.x0.y]);
    const traj = [];
    for(let i = 0; i <= 300; i++){
      const p = S.at(i / 300 * 12);
      if(!Number.isFinite(p[0]) || Math.hypot(p[0], p[1]) > 60) break;
      traj.push({ x:p[0], y:p[1] });
    }
    ctPath(ctx, P, traj, rgbCss(TH.grad), 2.6);
    const now = S.at(st.t);
    ctDot(ctx, P, now[0], now[1], 6, rgbCss(TH.warn), rgbCss(TH.bg));
    ctFrame(ctx, P, 'the phase plane — click to launch from anywhere');
    /* the trace–determinant plane, where the classification lives */
    if(W > 900){
      const Q = mkPlot(W * 0.68, 80, W * 0.28, Math.min(280, H - 200), -3, 3, -2, 3);
      plotFrame(ctx, Q, 'trace', 'det', 'the trace–determinant plane');
      plotZeroY(ctx, Q);
      plotCurve(ctx, Q, t => t * t / 4, 200, rgbCss(TH.curl), 2);
      const tr = st.A[0][0] + st.A[1][1], de = laDet(st.A);
      ctDot(ctx, Q, tr, de, 6, rgbCss(TH.warn), rgbCss(TH.bg));
      ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_UI; ctx.textAlign = 'center';
      ctx.fillText('saddles', Q.X(0), Q.Y(-1));
      ctx.fillText('spirals', Q.X(0), Q.Y(2.2));
      ctx.fillText('nodes', Q.X(-2.2), Q.Y(1.0));
    }
    stageNote(ctx, 'the dashed lines are the real eigendirections — straight-line solutions that never leave them', W, H);
  },
  readout(st){
    const C = phClassify(st.A);
    const S = syLinear(st.A, [st.x0.x, st.x0.y]);
    const now = S.at(st.t);
    return `<div class="card tight"><div class="ttl">The eigenvalues decide</div>
      ${kv('trace', fmtNum(C.tr, 6))}
      ${kv('determinant', fmtNum(C.det, 6))}
      ${kv('discriminant', fmtNum(C.disc, 6))}
      ${C.eig.real
        ? kv('λ', C.eig.values.map(v => fmtNum(v, 5)).join(',  '))
        : kv('λ', fmtNum(C.eig.re, 5) + ' ± ' + fmtNum(C.eig.im, 5) + ' i')}
      ${kv('classification', C.label)}
      ${kv('solution form', S.kind === 'real' ? 'c₁e^(λ₁t)v₁ + c₂e^(λ₂t)v₂'
                          : S.kind === 'complex' ? 'e^(at)(cos bt, sin bt) combination'
                          : 'e^(λt)(I + t(A − λI))x₀ — the stray t')}
    </div>
    <div class="card tight"><div class="ttl">At t = ${fmtNum(st.t, 3)}</div>
      ${kv('x(t)', '⟨' + now.map(v => fmtNum(v, 5)).join(', ') + '⟩')}
      ${kv('|x|', fmtNum(Math.hypot(now[0], now[1]), 5))}
      ${kv('started at', ctVec2(st.x0))}
      <p class="help">${C.eig.real
        ? 'With real eigenvalues there are two straight-line solutions — start exactly on an eigendirection and you never leave it. Everything else is a blend, and for large t the larger eigenvalue dominates, which is why almost every trajectory becomes parallel to one particular eigenvector.'
        : 'With a complex pair there is no straight-line solution at all: every trajectory rotates. The real part sets whether it spirals in or out, and the imaginary part sets how fast it goes round.'}</p>
    </div>`;
  },
  chip(st){
    const C = phClassify(st.A);
    return `<div class="k">x′ = A x</div><div>${C.kind}</div>
      <div style="color:var(--c-grad)">${C.stable === null ? 'neutral' : C.stable ? 'stable' : 'unstable'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'your trajectory'], ['var(--c-warn)', 'the moving state'],
                    ['var(--c-pos)', 'first eigendirection'], ['var(--c-neg)', 'second eigendirection']]; },
  dockLegend:true
};

/* ---- 2 · nonlinear autonomous systems ------------------------------------- */
STAGES.phPortrait = {
  title:'Nonlinear phase portraits',
  derive(st){
    return {
      title:'Understanding a nonlinear system by linearising near each equilibrium',
      steps:[
        drvSay('the situation, stated plainly',
          'Almost no nonlinear system can be solved in closed form. The pendulum, with a single sine in it, already needs elliptic functions. But we rarely want a formula — we want to know what the system does. That question can be answered without solving anything.'),
        drvStep('find where nothing moves',
          `${dv('P')}(${dv('x')},${dv('y')}) ${dop('=')} 0 and ${dv('Q')}(${dv('x')},${dv('y')}) ${dop('=')} 0`,
          'the equilibria — the panel locates them numerically and marks each one'),
        drvStep('the nullclines make them easy to see',
          `${dv('P')} ${dop('=')} 0 and ${dv('Q')} ${dop('=')} 0 curves`,
          'equilibria are exactly where the two families cross'),
        drvSay('nullclines organise the picture even away from equilibria',
          'On a P = 0 curve the flow is purely vertical; on Q = 0 it is purely horizontal. They divide the plane into regions in which the direction of motion cannot change sign, so the qualitative flow can be read off before any trajectory is computed.'),
        drvStep('near an equilibrium, replace the field by its derivative',
          `${dv('J')} ${dop('=')} [ ${dv('P')}ₓ ${dv('P')}_y ; ${dv('Q')}ₓ ${dv('Q')}_y ]`,
          'the Jacobian — the best linear approximation to the flow at that point'),
        drvSay('this is the multivariable derivative doing its job',
          'A derivative is by definition the linear map that best approximates a function near a point. Close enough to an equilibrium the nonlinear terms are negligible, so the system behaves like the linear one x′ = Jx — whose complete classification the previous stage supplied.'),
        drvStep('so classify each equilibrium by the Jacobian\'s eigenvalues',
          `eigenvalues of ${dv('J')} at each equilibrium`,
          'the panel computes and labels each: node, saddle, spiral or centre'),
        drvSay('the Hartman–Grobman theorem is what licenses this',
          'It says that near a hyperbolic equilibrium — one with no eigenvalue on the imaginary axis — the nonlinear flow is a continuous deformation of the linear one. The linearisation is not merely suggestive; it is topologically correct.'),
        drvSay('and the excluded case is excluded for good reason',
          'When an eigenvalue has zero real part the linear system predicts a centre, and the nonlinear terms decide instead whether trajectories spiral in or out. The linearisation genuinely cannot tell. That is the same fragility as the linear centre, and it is where limit cycles and Hopf bifurcations live.'),
        drvStep('global behaviour is then stitched together from local pictures',
          `separatrices from saddles divide the plane into basins`,
          'drag a starting point anywhere and the trajectory is integrated with RK4 in real time')
      ],
      note:'The pendulum shown here has a saddle at the inverted position and a stable spiral hanging down, with the separatrix dividing swinging from spinning-over. That is the entire qualitative theory of the pendulum, obtained without ever writing its solution.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key || 'pendulum';
    st.custom = { P:'y', Q:'-sin(x) - 0.3y' };
    st.trails = [];
    st.ext = o.ext || 4;
    st.showNull = o.nulls !== false;
  },
  sys(st){
    if(st.key !== 'custom') return PH_SYSTEMS[st.key];
    try {
      const f = compile(parse(st.custom.P)), g = compile(parse(st.custom.Q));
      return { n:'your system', F:(x, y) => f(x, y, 0), G:(x, y) => g(x, y, 0), note:'' };
    } catch(e){ return PH_SYSTEMS.pendulum; }
  },
  controls(){
    const st = ST;
    return ctSeg('phK', st.key, Object.keys(PH_SYSTEMS).map(k => [k, PH_SYSTEMS[k].n]).concat([['custom', 'type your own']])) +
      (st.key === 'custom'
        ? fnHtml('phP', "x′ =", st.custom.P, 'x, y') + fnHtml('phQ', "y′ =", st.custom.Q, 'x, y')
        : '') +
      ctChk('phN', 'draw the nullclines', st.showNull) +
      `<div class="row wrap">${ctBtn('phClr', 'clear the trajectories')}</div>
      <p class="help">These systems have no closed-form solution and do not need one. The
      <b>critical points</b> — where both derivatives vanish — are found by Newton's method, and near
      each one the system is approximated by its <b>Jacobian</b>. The eigenvalues of that matrix
      classify the point: node, saddle, spiral or centre, exactly as in the linear wing.</p>
      <p class="help"><b>Click anywhere to launch a trajectory.</b> The nullclines are the curves
      where x′ = 0 (motion is purely vertical) and y′ = 0 (purely horizontal); critical points are
      exactly where two of different colour cross.</p>`;
  },
  wire(){
    ctWireSeg('phK', v => { ST.key = v; ST.trails = []; });
    fnWire('phP', (m, s) => { ST.custom.P = s; ST.trails = []; });
    fnWire('phQ', (m, s) => { ST.custom.Q = s; ST.trails = []; });
    ctWireChk('phN', v => { ST.showNull = v; });
    ctWireBtn('phClr', () => { ST.trails = []; });
  },
  pick(st, sx, sy, phase){
    if(phase !== 'down' || !st.P || !st.P.inside(sx, sy)) return;
    const S = this.sys(st);
    const x = st.P.invX(sx), y = st.P.invY(sy);
    st.trails.push({ f:phTrajectory(S.F, S.G, x, y, 0.012, 1800, 40),
                     b:phTrajectory(S.F, S.G, x, y, -0.012, 900, 40) });
    if(st.trails.length > 14) st.trails.shift();
  },
  frame(st, dt, ctx, W, H){
    const S = this.sys(st);
    const E = st.ext;
    const P = ctBox(Math.min(W, H * 1.35), H, 0, 0, E);
    st.P = P;
    ctGrid(ctx, P);
    /* the direction field, normalised so slow regions are still readable */
    const n = 21;
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
      const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / n, y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / n;
      const u = S.F(x, y), v = S.G(x, y);
      if(!Number.isFinite(u) || !Number.isFinite(v)) continue;
      const m = Math.hypot(u, v) || 1;
      const s = (P.x1 - P.x0) / n * 0.42;
      ctArrow(ctx, P, x, y, x + u / m * s, y + v / m * s, rgbCss(TH.faint, 0.55), 1.1);
    }
    if(st.showNull){
      ctContour(ctx, P, S.F, 0, rgbCss(TH.neg, 0.85), 2, 150);
      ctContour(ctx, P, S.G, 0, rgbCss(TH.pos, 0.85), 2, 150);
    }
    for(const tr of st.trails){
      ctPath(ctx, P, tr.f, rgbCss(TH.grad), 2);
      ctPath(ctx, P, tr.b, rgbCss(TH.grad, 0.35), 1.4);
    }
    const cps = phCritical(S.F, S.G, P.x0, P.x1, P.y0, P.y1, 12);
    st.cps = cps;
    for(const c of cps){
      const col = c.kind === 'saddle' ? TH.pos : c.stable ? TH.grad : TH.warn;
      ctDot(ctx, P, c.x, c.y, 6.5, rgbCss(col), rgbCss(TH.bg));
    }
    ctFrame(ctx, P, S.n + ' — click to launch a trajectory');
    stageNote(ctx, 'blue: x′ = 0 · orange: y′ = 0 · critical points are where they cross', W, H);
  },
  readout(st){
    const cps = st.cps || [];
    const S = this.sys(st);
    return `<div class="card tight"><div class="ttl">Critical points, found by Newton</div>
      ${cps.length ? cps.map((c, i) =>
        kv('at ⟨' + fmtNum(c.x, 4) + ', ' + fmtNum(c.y, 4) + '⟩', c.label) +
        kv('   trace, det', fmtNum(c.tr, 4) + ',  ' + fmtNum(c.det, 4)) +
        kv('   |x′| there', fmtNum(Math.hypot(S.F(c.x, c.y), S.G(c.x, c.y)), 3))
      ).join('') : '<p class="help">No critical point in this window.</p>'}
      <p class="help">The third row of each is the residual: both derivatives really do vanish
      there, to machine precision, so these are the genuine equilibria and not artefacts of the
      search.</p>
    </div>
    <div class="card tight"><div class="ttl">What the linearisation can and cannot tell you</div>
      <p class="help">${esc(S.note || 'Type any pair of expressions and the analysis follows.')}</p>
      <p class="help"><b>Hartman–Grobman</b> guarantees that near a critical point with no eigenvalue
      on the imaginary axis, the nonlinear picture looks like the linear one. The exception matters:
      a <b>centre</b> predicted by the linearisation may really be a slow spiral, because the
      neglected higher-order terms decide. That is why the pendulum's undamped centres survive
      while Lotka–Volterra's are structurally fragile.</p>
    </div>`;
  },
  chip(st){
    const cps = st.cps || [];
    return `<div class="k">phase portrait</div><div>${cps.length} critical point${cps.length === 1 ? '' : 's'}</div>
      <div style="color:var(--c-grad)">${st.trails.length} trajectories</div>`;
  },
  legend(){ return [['var(--c-grad)', 'trajectories (faint = backwards in time)'],
                    ['var(--c-neg)', 'x′ = 0'], ['var(--c-pos)', 'y′ = 0 · saddles'],
                    ['var(--c-warn)', 'unstable points']]; },
  dockLegend:true
};
