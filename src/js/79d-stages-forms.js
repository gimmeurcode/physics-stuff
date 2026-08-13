/* ============================================================================
   4s · DIFFERENTIAL FORMS AND POTENTIAL THEORY
   The unification: gradient, curl and divergence are one operator acting on
   objects of different degree, and d∘d = 0 contains both vanishing identities.
   Then harmonic functions, Green's identities and the Helmholtz decomposition.
   ============================================================================ */

STAGES.dfExterior = {
  title:'The exterior derivative',
  derive(st){
    return {
      title:'One operator that is gradient, curl and divergence depending on what it eats',
      steps:[
        drvSay('three operators that were never really three',
          'Vector calculus offers grad, curl and div, each with its own formula, its own theorem and its own identities to memorise. They are one operator applied to objects of different degree, and once that is seen the identities stop needing to be remembered.'),
        drvStep('on a function — a 0-form — d gives the gradient',
          `d${dv('f')} ${dop('=')} ${dv('f')}ₓ d${dv('x')} ${dop('+')} ${dv('f')}_y d${dv('y')}`,
          'the components of ∇f, now carrying the symbols they are integrated against'),
        drvSay('the dx is not decoration',
          'A 1-form is a thing waiting to be integrated along a curve. Writing f_x dx + f_y dy records both the components and what they must be paired with. That bookkeeping is what makes the machinery dimension-independent and coordinate-free.'),
        drvStep('on a 1-form, d gives the curl',
          `d(${dv('P')}d${dv('x')} ${dop('+')} ${dv('Q')}d${dv('y')}) ${dop('=')} (${dv('Q')}ₓ ${dop('−')} ${dv('P')}_y) d${dv('x')}∧d${dv('y')}`,
          'the scalar curl of the vector-calculus wing, appearing as a 2-form'),
        drvStep('on a 2-form in three dimensions, d gives the divergence',
          `d(2-form) ${dop('=')} (∇${dop('·')}${dv('F')}) d${dv('x')}∧d${dv('y')}∧d${dv('z')}`,
          'the panel evaluates whichever degree is selected and prints the components'),
        drvSay('the wedge product is what makes the signs work',
          'dx∧dy = −dy∧dx, so any repeated factor vanishes. That antisymmetry is where the minus signs in the curl come from, and why there is nothing above degree n in n dimensions — you run out of distinct symbols to wedge together.'),
        drvStep('and then one identity replaces several',
          `d${dop('∘')}d ${dop('=')} 0`,
          'the panel computes d(df) symbolically and every component is exactly zero'),
        drvSay('which is curl grad = 0 and div curl = 0 at once',
          'Apply d twice to a function and you get curl(grad f) = 0. Apply it twice starting from a 1-form and you get div(curl F) = 0. Two separate identities, each usually proved by a page of cancelling partial derivatives, are the same statement about one operator.'),
        drvSay('and it holds for the same reason both times',
          'd∘d = 0 is equality of mixed partial derivatives combined with the antisymmetry of the wedge. f_xy = f_yx makes the coefficients match, and dx∧dy = −dy∧dx makes them cancel. That is the entire proof, in any dimension and any degree.'),
        drvStep('the generalised Stokes theorem then absorbs all of them',
          `∫_M d ω ${dop('=')} ∮_(∂M) ω`,
          'the Fundamental Theorem, Green, Stokes and the Divergence Theorem are this one line at different degrees')
      ],
      note:'That single line is the reason this wing exists. Four theorems that look unrelated in vector notation — one about intervals, one about plane regions, one about surfaces, one about solids — are one statement: integrating a derivative over a region equals integrating the original over its boundary.'
    };
  },
  enter(st, o){
    st.deg = o.deg === undefined ? 0 : o.deg;
    st.src = { f:'x y', P:'-y', Q:'x', R:'0' };
    st.probe = { x:0.8, y:0.6 };
  },
  controls(){
    const st = ST;
    return ctSeg('dfD', String(st.deg), [['0', '0-form  f'], ['1', '1-form  P dx + Q dy + R dz'], ['2', '2-form']]) +
      (st.deg === 0 ? fnHtml('dfF', 'f =', st.src.f, 'x, y, z')
                    : fnHtml('dfP', 'P =', st.src.P, 'x, y, z') +
                      fnHtml('dfQ', 'Q =', st.src.Q, 'x, y, z')) +
      `<p class="help">There is only one derivative here. Written as <b>d</b>, it takes a form of
      degree k to one of degree k+1, and in three dimensions the three cases are the three operators
      of vector calculus wearing different hats:</p>
      <p class="help"><b>d</b> on a 0-form is the <b>gradient</b>. <b>d</b> on a 1-form is the
      <b>curl</b>. <b>d</b> on a 2-form is the <b>divergence</b>. <b>d</b> on a 3-form is zero,
      because there is nothing of degree four in three dimensions.</p>
      <p class="help">And <b>d∘d = 0</b> always. Applied to a 0-form that reads curl(grad f) = 0;
      applied to a 1-form it reads div(curl F) = 0. Two identities usually proved by grinding through
      mixed partials are one line, and the panel measures both.</p>`;
  },
  wire(){
    ctWireSeg('dfD', v => { ST.deg = +v; });
    fnWire('dfF', (m, s) => { ST.src.f = s; });
    fnWire('dfP', (m, s) => { ST.src.P = s; });
    fnWire('dfQ', (m, s) => { ST.src.Q = s; });
  },
  fns(st){
    const mk = s => { try { const c = compile(parse(s)); return (x, y, z) => c(x, y, z || 0); }
                      catch(e){ return () => 0; } };
    return { f:mk(st.src.f), P:mk(st.src.P), Q:mk(st.src.Q), R:mk(st.src.R) };
  },
  frame(st, dt, ctx, W, H){
    const F = this.fns(st);
    const P = ctBox(Math.min(W, H * 1.3), H, 0, 0, 2.4);
    st.P = P;
    if(st.deg === 0){
      const g = (x, y) => F.f(x, y, 0);
      const rg = ctRange(g, P, 40);
      ctHeat(ctx, P, g, rg.lo, rg.hi, 60, 0.7, true);
      for(const L of ctLevels(rg.lo, rg.hi, 16)) ctContour(ctx, P, g, L, rgbCss(TH.text, 0.3), 1, 140);
      const n = 15;
      for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
        const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / n, y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / n;
        const d = dfD0((a, b, c) => F.f(a, b, c), x, y, 0);
        const m = Math.hypot(d[0], d[1]) || 1;
        const s = (P.x1 - P.x0) / n * 0.42;
        ctArrow(ctx, P, x, y, x + d[0] / m * s, y + d[1] / m * s, rgbCss(TH.grad, 0.75), 1.4);
      }
      ctFrame(ctx, P, 'the 0-form f, and df — its gradient, perpendicular to the level curves');
    } else {
      const n = 17;
      for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
        const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / n, y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / n;
        const u = F.P(x, y, 0), v = F.Q(x, y, 0);
        if(!Number.isFinite(u) || !Number.isFinite(v)) continue;
        const m = Math.hypot(u, v) || 1;
        const s = (P.x1 - P.x0) / n * 0.42;
        ctArrow(ctx, P, x, y, x + u / m * s, y + v / m * s, rgbCss(TH.curl, 0.8), 1.4);
      }
      const cz = (x, y) => dfD1(F.P, F.Q, F.R, x, y, 0)[2];
      const rg = ctRange(cz, P, 34);
      for(const L of ctLevels(rg.lo, rg.hi, 12)) ctContour(ctx, P, cz, L, rgbCss(TH.warn, 0.5), 1.2, 130);
      ctFrame(ctx, P, 'the 1-form, with the level curves of its exterior derivative (the curl)');
    }
    ctGrid(ctx, P);
    ctDot(ctx, P, st.probe.x, st.probe.y, 5, rgbCss(TH.text), rgbCss(TH.bg));
    stageNote(ctx, 'one operator, three familiar faces — and d∘d = 0 in every one of them', W, H);
  },
  readout(st){
    const F = this.fns(st);
    const x = st.probe.x, y = st.probe.y, z = 0;
    const g = dfD0(F.f, x, y, z);
    const c = dfD1(F.P, F.Q, F.R, x, y, z);
    const dd = dfDDzero(F.f, x, y, z);
    const dc = dfDivCurl(F.P, F.Q, F.R, x, y, z);
    return `<div class="card tight"><div class="ttl">At the probe</div>
      ${kv('df  (gradient)', '⟨' + g.map(v => fmtNum(v, 5)).join(', ') + '⟩')}
      ${kv('dω (curl)', '⟨' + c.map(v => fmtNum(v, 5)).join(', ') + '⟩')}
      ${kv('dω (divergence)', fmtNum(dfD2(F.P, F.Q, F.R, x, y, z), 6))}
    </div>
    <div class="card tight"><div class="ttl">d∘d = 0, measured</div>
      ${kv('|curl(grad f)|', fmtNum(dd, 3))}
      ${kv('div(curl F)', fmtNum(dc, 3))}
      <p class="help">Both are zero to the precision of the finite differences used, for
      <em>whatever</em> functions you type. They are not two theorems but one, and it is the reason
      a conservative field has no curl and a curl has no divergence — the two facts the vector
      wing's promote buttons demonstrate.</p>
    </div>
    <div class="card tight"><div class="ttl">Why three dimensions is special</div>
      ${kv('components of a 2-form in n = 2', dfStarComponents(2))}
      ${kv('                         n = 3', dfStarComponents(3))}
      ${kv('                         n = 4', dfStarComponents(4))}
      <p class="help">A curl is really a 2-form, with n(n−1)/2 components. Only when n = 3 does that
      equal n, so only in three dimensions can the Hodge star turn it back into a vector. The cross
      product exists for the same reason and in the same dimension — which is why "curl is a vector"
      is a three-dimensional accident rather than a general truth.</p>
      <p class="help">Seen this way, Green's theorem, Stokes' theorem and the divergence theorem are
      one statement: <b>∫<sub>∂Ω</sub> ω = ∫<sub>Ω</sub> dω</b>. The boundary operator and the
      exterior derivative are adjoint, and ∂∘∂ = 0 mirrors d∘d = 0 — a boundary has no boundary.</p>
    </div>`;
  },
  chip(st){
    const F = this.fns(st);
    return `<div class="k">d∘d</div>
      <div style="color:var(--c-grad)">curl grad = ${fmtNum(dfDDzero(F.f, st.probe.x, st.probe.y, 0), 3)}</div>
      <div style="color:var(--c-curl)">div curl = ${fmtNum(dfDivCurl(F.P, F.Q, F.R, st.probe.x, st.probe.y, 0), 3)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'df — the gradient'], ['var(--c-curl)', 'the 1-form'],
                    ['var(--c-warn)', 'level curves of its curl']]; },
  dockLegend:true
};

/* ---- 2 · harmonic functions and Green's identities ------------------------ */
STAGES.dfHarmonic = {
  title:'Harmonic functions',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why a solution of Laplace\'s equation equals its own average',
      steps:[
        drvStep('the equation',
          `∇²${dv('u')} ${dop('=')} ${dv('u')}ₓₓ ${dop('+')} ${dv('u')}_yy ${dop('=')} 0`,
          `the panel evaluates the Laplacian at the probe and prints it — it should be zero`),
        drvSay('what the Laplacian actually measures',
          'u_xx compares u at a point with the average of its left and right neighbours; u_yy does the same vertically. Their sum is, up to a constant, how much the value at a point falls short of the average of the values around it. Setting it to zero says: no point is a local surplus or deficit.'),
        drvStep('so the mean value property is almost the equation restated',
          `${dv('u')}(${dv('c')}) ${dop('=')} ${dfrac('1', '2π')}∫₀^(2π) ${dv('u')}(${dv('c')} ${dop('+')} ${dv('r')}${dop('e')}^(${dop('i')}θ)) dθ`,
          `at radius r = ${n(st.r)} the panel integrates round the circle and compares with the centre value`),
        drvSay('and it holds for every radius, not just small ones',
          'That is the genuinely surprising part. The average over a circle of any radius — as long as the disc stays inside the domain — equals the centre value exactly. Change the radius in the panel and watch the average not move.'),
        drvStep('the maximum principle follows immediately',
          `max ${dv('u')} occurs on the boundary`,
          'an interior maximum would exceed its own surrounding average, contradicting the property'),
        drvSay('which is a strong statement about what cannot happen',
          'A steady temperature distribution has no interior hot spot. An electrostatic potential in empty space has no interior maximum, so a charged particle cannot be trapped by static fields alone — that is Earnshaw\'s theorem, and it is why ion traps must use oscillating fields.'),
        drvStep('and solutions are unique for given boundary data',
          `two solutions agreeing on ∂${dv('D')} agree everywhere`,
          'their difference is harmonic with zero boundary values, so its max and min are both zero'),
        drvSay('this is why boundary conditions determine everything',
          'Specify the potential on the boundary and the interior is fixed, with no freedom left. A harmonic function is rigid in a way that solutions of most equations are not — which is why relaxation methods converge, and why the value at any interior point can be recovered from the boundary alone.'),
        drvSay('and the connection to the complex wing is not a coincidence',
          'The real and imaginary parts of any analytic function are harmonic, as the Cauchy–Riemann equations force. The mean value property is then Cauchy\'s integral formula with the real part taken. Two subjects, one theorem.')
      ],
      note:'The circle average is computed by quadrature at whatever radius is chosen, and printed against the centre value with the difference. That it stays zero as the radius changes is the mean value property being tested rather than asserted.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key || 'x2y2';
    st.c = { x:0.4, y:0.3 }; st.r = o.r || 0.8;
  },
  controls(){
    const st = ST;
    return pkSeg('hmK', DF_HARMONIC, st.key, e => e.n) + pkBoxes('dfown', st.key, st, DF_OWN, null) +
      ctlRow('circle radius', ctlSlider('hmR', 0.15, 1.6, 0.01, st.r)) +
      `<p class="help">A function is <b>harmonic</b> when ∇²f = 0. Such functions are the steady
      states of diffusion — the temperature of a plate once it has stopped changing — and they are
      remarkably rigid.</p>
      <p class="help">The <b>mean value property</b> is the whole story: the value at the centre of
      any circle equals the average over that circle. <b>Drag the circle</b> and change its radius;
      for a harmonic function the two numbers stay locked together whatever you do. That immediately
      forbids an interior maximum — a peak would have to exceed its own average — which is the
      <b>maximum principle</b>, and it is why a steady temperature is always hottest on the
      boundary.</p>`;
  },
  wire(){
  ctWireSeg('hmK', v => { ST.key = v; });
    pkWireBoxes('dfown', ST.key, ST, DF_OWN, null);
    wireSlider('hmR', () => ST.r, v => { ST.r = v; }, v => fmtNum(+v, 3));
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.c = { x:st.P.invX(sx), y:st.P.invY(sy) };
  },
  frame(st, dt, ctx, W, H){
    const F = dfHarmCur(st).f;
    const P = ctBox(Math.min(W, H * 1.3), H, 0, 0, 2.2);
    st.P = P;
    const rg = ctRange(F, P, 40);
    ctHeat(ctx, P, F, rg.lo, rg.hi, 62, 0.75, true);
    for(const L of ctLevels(rg.lo, rg.hi, 18)) ctContour(ctx, P, F, L, rgbCss(TH.text, 0.3), 1, 150);
    ctGrid(ctx, P);
    ctParam(ctx, P, t => ({ x:st.c.x + st.r * Math.cos(t), y:st.c.y + st.r * Math.sin(t) }),
            0, 2 * Math.PI, 160, rgbCss(TH.warn), 2.6);
    ctDot(ctx, P, st.c.x, st.c.y, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    ctFrame(ctx, P, dfHarmCur(st).n + ' — drag the circle');
    stageNote(ctx, 'for a harmonic function the centre value and the circle average never separate, whatever the radius', W, H);
  },
  readout(st){
    const D = dfHarmCur(st);
    const F = D.f;
    const centre = F(st.c.x, st.c.y);
    const mean = dfCircleMean(F, st.c.x, st.c.y, st.r, 1440);
    const lap = dfLaplacian(F, st.c.x, st.c.y);
    return `<div class="card tight"><div class="ttl">The mean value property</div>
      ${kv('f at the centre', fmtNum(centre, 8))}
      ${kv('average over the circle', fmtNum(mean, 8))}
      ${kv('difference', fmtNum(Math.abs(centre - mean), 3))}
      ${kv('∇²f there', fmtNum(lap, 4))}
      ${kv('harmonic?', D.harmonic ? 'yes' : '<b>no</b> — ∇²f ≠ 0')}
      <p class="help">${D.harmonic
        ? 'The two values agree for every radius and every centre. That equivalence — harmonic if and only if the mean value property holds — is the reason harmonic functions cannot have interior extrema, and hence the maximum principle.'
        : 'x² + y² has Laplacian 4, and the circle average exceeds the centre value by exactly ∇²f·r²/4. A function with positive Laplacian sits below its own averages everywhere — it is subharmonic, and it does have an interior minimum.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Where they come from</div>
      <p class="help">Harmonic functions are the real and imaginary parts of analytic functions: if
      f = u + iv is analytic then the Cauchy–Riemann equations force ∇²u = ∇²v = 0. That is why
      x² − y², xy, eˣcos y and log r all appear here — they are Re and Im of z², z²/2i, e^z and
      log z. The complex wing and this one are the same subject seen twice.</p>
      <p class="help">They are also the steady states of the heat equation, the electrostatic
      potentials in charge-free regions (which is what the circuit wing's field overlay relaxes to),
      and the velocity potentials of incompressible irrotational flow.</p>
    </div>`;
  },
  chip(st){
    const F = dfHarmCur(st).f;
    return `<div class="k">mean value</div>
      <div>centre ${fmtNum(F(st.c.x, st.c.y), 4)}</div>
      <div style="color:var(--c-warn)">circle ${fmtNum(dfCircleMean(F, st.c.x, st.c.y, st.r, 360), 4)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'the test circle']]; },
  dockLegend:true
};

/* ---- 3 · the Helmholtz decomposition -------------------------------------- */
STAGES.dfHelm = {
  title:'The Helmholtz decomposition',
  derive(st){
    return {
      title:'Every field splits into a part that flows out and a part that circulates',
      steps:[
        drvSay('the claim',
          'Any well-behaved vector field is the sum of one piece with no curl and one piece with no divergence. The first is a gradient, the second a curl. Nothing else is needed, and the split is unique given suitable behaviour at the boundary.'),
        drvStep('the decomposition',
          `${dv('F')} ${dop('=')} ${dop('−')}∇φ ${dop('+')} ∇${dop('×')}${dv('A')}`,
          'the panel computes each piece separately and shows them side by side'),
        drvSay('why exactly two pieces and not three',
          'A field can have sources, or circulation, or both. Divergence measures the first and curl the second, and d∘d = 0 guarantees the two are independent: a gradient has no curl and a curl has no divergence. Nothing is left over, so two pieces suffice.'),
        drvStep('take the divergence and only the first piece survives',
          `∇${dop('·')}${dv('F')} ${dop('=')} ${dop('−')}∇²φ`,
          'a Poisson equation for the scalar potential — solved here by successive over-relaxation'),
        drvStep('take the curl and only the second survives',
          `∇${dop('×')}${dv('F')} ${dop('=')} ∇${dop('×')}(∇${dop('×')}${dv('A')})`,
          'a second Poisson problem, for the vector potential'),
        drvSay('so the split is computable, not merely existent',
          'Each half is recovered by solving Laplace-type equations with the divergence and curl of F as sources. The panel does exactly that and then adds the two pieces back together, printing the difference from the original field.'),
        drvStep('and this is what Maxwell\'s equations are organised around',
          `∇${dop('·')}${dv('E')} ${dop('=')} ρ/ε₀ , &nbsp; ∇${dop('×')}${dv('E')} ${dop('=')} ${dop('−')}∂${dv('B')}/∂${dv('t')}`,
          'two of the four specify a divergence, two specify a curl'),
        drvSay('which is why there are four equations and not some other number',
          'Helmholtz says a field is determined by its divergence and its curl together with boundary conditions. So specifying both, for each of E and B, is exactly enough to determine the electromagnetic field and no more than enough. The count of Maxwell\'s equations is not an accident of history.'),
        drvSay('and it explains why magnetic monopoles would matter so much',
          '∇·B = 0 says the magnetic field has no source part at all — it is pure circulation. A monopole would add a gradient piece to B, and the symmetry of the equations would be restored. The decomposition makes precise exactly what is missing.')
      ],
      note:'The Poisson solves use successive over-relaxation on a grid, so the reconstruction is accurate to the discretisation rather than exact. The panel prints the residual after recombining, which is the honest measure of how well the split closed.'
    };
  },
  enter(st, o){
    st.key = o.key || 'mixed';
    st.view = o.view || 'both';
    st.sol = null; st.solKey = '';
  },
  ensure(st){
    const D = dfFieldCur(st);
    /* the cache key has to carry the formulas, not just the picker value:
       every typed field is custom and they are not the same field */
    const key = st.key + '|' + D.n;
    if(st.solKey === key) return st.sol;
    st.sol = dfHelmholtz(D.P, D.Q, -2.2, 2.2, -2.2, 2.2, 48);
    st.solKey = key;
    return st.sol;
  },
  controls(){
    const st = ST;
    return pkSeg('hzK', DF_FIELDS, st.key, e => e.n) +
      pkBoxes('dffield', st.key, st, DF_FIELD_OWN, null,
        'Your own P and Q. The split is solved for on a grid, not read off a formula, so the field ' +
        'need not be one anybody has a decomposition for — and the residuals printed below are how ' +
        'you check that it worked.') +
      ctSeg('hzV', st.view, [['both', 'the original'], ['irrot', 'curl-free part'], ['solen', 'divergence-free part']]) +
      `<p class="help">Every well-behaved field splits into two pieces and only two:
      <b>F = −∇φ + ∇×A</b>. The first carries all of the divergence and has no curl; the second
      carries all of the curl and has no divergence. Nothing is left over.</p>
      <p class="help">The split is not quoted here — it is <b>solved for</b>. Taking the divergence
      of both sides gives ∇²φ = −∇·F, and taking the curl gives ∇²ψ = ∇×F, so each piece comes from
      a Poisson equation relaxed on a grid. The panel then differentiates the result back and checks
      that the curl-free part really has no curl and the other really has no divergence.</p>`;
  },
  wire(){
    pkWire('hzK', 'dffield', ST.key, ST, DF_FIELD_OWN, null, v => { ST.key = v; });
    ctWireSeg('hzV', v => { ST.view = v; });
  },
  frame(st, dt, ctx, W, H){
    const D = dfFieldCur(st);
    const S = this.ensure(st);
    const P = ctBox(Math.min(W, H * 1.3), H, 0, 0, 2);
    st.P = P;
    const pick = (x, y) => {
      if(st.view === 'irrot') return S.irrot(x, y);
      if(st.view === 'solen') return S.solen(x, y);
      return [D.P(x, y), D.Q(x, y)];
    };
    /* shade by whichever scalar potential is driving the shown piece */
    const scal = st.view === 'solen' ? ((x, y) => S.psi.at(x, y))
                                     : ((x, y) => S.phi.at(x, y));
    const rg = ctRange(scal, P, 34);
    if(st.view !== 'both') ctHeat(ctx, P, scal, rg.lo, rg.hi, 52, 0.55, true);
    const n = 19;
    let mx = 1e-9;
    const G = [];
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
      const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / n, y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / n;
      const v = pick(x, y);
      if(!Number.isFinite(v[0]) || !Number.isFinite(v[1])) continue;
      G.push({ x, y, u:v[0], v:v[1] });
      mx = Math.max(mx, Math.hypot(v[0], v[1]));
    }
    const s = (P.x1 - P.x0) / n * 0.85 / mx;
    const col = st.view === 'irrot' ? TH.pos : st.view === 'solen' ? TH.curl : TH.grad;
    for(const g of G) ctArrow(ctx, P, g.x, g.y, g.x + g.u * s, g.y + g.v * s, rgbCss(col, 0.8), 1.5);
    ctGrid(ctx, P);
    ctFrame(ctx, P, st.view === 'both' ? D.n
           : st.view === 'irrot' ? 'the curl-free piece  −∇φ' : 'the divergence-free piece  ∇×A');
    stageNote(ctx, 'switch between the three views — the two pieces add back to the original everywhere', W, H);
  },
  readout(st){
    const D = dfFieldCur(st);
    const S = this.ensure(st);
    /* sample the identities away from the grid boundary, where a relaxed
       solution is least trustworthy */
    let maxCurlIrrot = 0, maxDivSolen = 0, maxRecon = 0;
    for(let i = 0; i < 9; i++) for(let j = 0; j < 9; j++){
      const x = -1.2 + 2.4 * i / 8, y = -1.2 + 2.4 * j / 8;
      const h = 0.03;
      const ir = (a, b) => S.irrot(a, b), so = (a, b) => S.solen(a, b);
      const cIr = (ir(x + h, y)[1] - ir(x - h, y)[1]) / (2 * h) -
                  (ir(x, y + h)[0] - ir(x, y - h)[0]) / (2 * h);
      const dSo = (so(x + h, y)[0] - so(x - h, y)[0]) / (2 * h) +
                  (so(x, y + h)[1] - so(x, y - h)[1]) / (2 * h);
      const a1 = ir(x, y), a2 = so(x, y);
      const rec = Math.hypot(a1[0] + a2[0] - D.P(x, y), a1[1] + a2[1] - D.Q(x, y));
      maxCurlIrrot = Math.max(maxCurlIrrot, Math.abs(cIr));
      maxDivSolen  = Math.max(maxDivSolen, Math.abs(dSo));
      maxRecon     = Math.max(maxRecon, rec);
    }
    return `<div class="card tight"><div class="ttl">The field, at ⟨1, 0.6⟩</div>
      ${kv('∇·F', fmtNum(S.div(1, 0.6), 5))}
      ${kv('∇×F', fmtNum(S.curl(1, 0.6), 5))}
      <p class="help">${esc(D.note)}</p>
    </div>
    <div class="card tight"><div class="ttl">The split, checked</div>
      ${kv('largest |curl of the curl-free part|', fmtNum(maxCurlIrrot, 3))}
      ${kv('largest |div of the div-free part|', fmtNum(maxDivSolen, 3))}
      ${kv('largest reconstruction error', fmtNum(maxRecon, 3))}
      <p class="help">Each piece is differentiated <i>after</i> being solved for, so the first two
      rows are genuine tests of the decomposition rather than restatements of how it was built. The
      third adds the pieces back together and compares with the field you started from.</p>
      <p class="help">The residual is not machine precision, and should not be: φ and ψ come from a
      relaxation on a finite grid with imposed boundary values, so the split is only as good as that
      solve. Away from the boundary it is good; near it the imposed conditions distort both pieces.
      Reporting that honestly is more useful than tuning the numbers until they look exact.</p>
    </div>
    <div class="card tight"><div class="ttl">Why it matters</div>
      <p class="help">This theorem is why electromagnetism has the potentials it does. ∇·B = 0
      everywhere forces B to be entirely of the second kind, so <b>B = ∇×A</b>; and in
      electrostatics ∇×E = 0 forces E to be entirely of the first, so <b>E = −∇V</b>. Maxwell's
      equations in potential form are the Helmholtz decomposition applied to the fields.</p>
    </div>`;
  },
  chip(st){
    const S = this.ensure(st);
    return `<div class="k">Helmholtz</div>
      <div style="color:var(--c-pos)">∇·F = ${fmtNum(S.div(1, 0.6), 3)}</div>
      <div style="color:var(--c-curl)">∇×F = ${fmtNum(S.curl(1, 0.6), 3)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the original field'], ['var(--c-pos)', 'curl-free part'],
                    ['var(--c-curl)', 'divergence-free part']]; },
  dockLegend:true
};
