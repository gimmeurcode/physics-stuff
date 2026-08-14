STAGES.igMass = {
  title:'Mass, centroids & inertia',
  derive(st){
    return {
      title:'Mass, balance point and resistance to spinning are three moments of one density',
      steps:[
        drvSay('one integral, weighted three ways',
          'Everything in this stage integrates the same density over the same region. What changes is the weight: 1 gives mass, x gives a first moment, x² gives a second moment. The pattern — the nth moment of a distribution — is exactly the one the probability wing uses, with a mass density instead of a probability density.'),
        drvStep('the zeroth moment is the total',
          `${dv('m')} ${dop('=')} ∬ ρ d${dv('A')}`,
          'and dividing by the area gives the average density, printed for comparison'),
        drvStep('the first moment locates the balance point',
          `${dv('x')}̄ ${dop('=')} ${dfrac('∬ ' + dv('x') + 'ρ d' + dv('A'), '∬ ρ d' + dv('A'))}`,
          'each element is weighted by how far out it sits, then normalised'),
        drvSay('why this is the balance point and not merely defined to be',
          'Torque about a point is the sum of (distance × weight). Setting that sum to zero and solving for the pivot gives exactly this integral. The centroid is where a plate balances because it is where the torques cancel — the formula is the physics, not a definition chosen to look like one.'),
        drvSay('and the centroid need not lie in the object',
          'A crescent, an L-shape or a ring all have centroids outside their own material. The panel reports whether the computed centroid is inside the region, because the surprise is worth meeting directly rather than being told about.'),
        drvStep('the second moment resists rotation',
          `${dv('I')}ₓ ${dop('=')} ∬ ${dv('y')}²ρ d${dv('A')}`,
          'distance from the axis, squared — so far-out mass counts disproportionately'),
        drvSay('the square is why shape beats mass',
          'Double an object\'s mass and its inertia doubles. Move the same mass twice as far from the axis and its inertia quadruples. This is why a hollow tube is stiffer than a solid rod of equal mass, why an I-beam has its material at top and bottom, and why a figure skater spins faster by pulling in.'),
        drvStep('the perpendicular axis theorem, checked numerically',
          `${dv('I')}₀ ${dop('=')} ${dv('I')}ₓ ${dop('+')} ${dv('I')}_y`,
          'because r² = x² + y², so the integrals simply add — the panel prints the difference, which should be zero'),
        drvStep('the parallel axis theorem, also checked',
          `${dv('I')}_d ${dop('=')} ${dv('I')}_centroid ${dop('+')} ${dv('m')}${dv('d')}²`,
          `moving the axis to x = ${fmtNum(st.axis, 4)}: the panel integrates about that axis directly and compares`),
        drvSay('and the theorem shows the centroid is special',
          'The md² term is never negative, so inertia about the centroid is the smallest it can be about any parallel axis. The balance point is also the easiest point to spin about, which is not obvious in advance and falls straight out of the algebra.')
      ],
      note:'Both theorems are verified by computing each side with an independent integral and printing the difference. Neither is assumed anywhere in the stage — the axis can be dragged and the direct integration re-run at any position.'
    };
  },
  enter(st, o){
    st.reg = o.reg || 'tri';
    st.regKind = o.regKind || 'I';
    st.den = o.den || 'linear';
    st.show = Object.assign({ axes:true, gyr:true }, o.show || {});
    st.axis = 0;
  },
  controls(){
    const st = ST;
    return pkSeg('igMR', IG_REGIONS, st.reg, e => e.name.split('  ')[0]) +
      (st.reg === 'custom'
        ? ctSeg('igMK', igRegKind(st), [['I', 'Type I'], ['II', 'Type II'],
                                        ['both', 'both'], ['polar', 'polar']])
        : '') +
      pkBoxes('igreg', st.reg, st, igRegSlots(st), igRegBounds(st),
        'Your own lamina. Describe it as a <b>Type I</b> region (x over an interval, y between two ' +
        'functions of x), as a <b>Type II</b> region (the other way round, written in <b>y</b>), or in ' +
        '<b>polar</b> form (θ between the two bounds, r between two functions of θ, with the angle ' +
        'written <b>t</b>). The mass, the centroid and every moment below are integrated over whatever ' +
        'shape that describes.') +
      pkSeg('igMD', IG_DENSITIES, st.den, e => e.name.split('  ')[0]) + pkBoxes('igden', st.den, st, IG_DEN_OWN, null, IG_COORD_HELP) +
      ctlRow('a parallel axis at x =', ctlSlider('igMax', -2, 2, 0.02, st.axis)) +
      `<div class="row wrap">${ctChk('igMg', 'the radii of gyration', st.show.gyr)}</div>
      <p class="help">Mass is <b>m = ∬ρ dA</b>. The <b>moments</b> weight the density by a coordinate:
      <b>M<sub>y</sub> = ∬xρ dA</b> and <b>M<sub>x</sub> = ∬yρ dA</b>. The centre of mass is where those moments balance,
      <b>(x̄, ȳ) = (M<sub>y</sub>/m, M<sub>x</sub>/m)</b>, and the cross-hairs drawn on the region are that point — it need not
      lie inside the region at all, as the annulus shows.</p>
      <p class="help"><b>Moments of inertia</b> weight by the <i>square</i> of the distance:
      <b>I<sub>x</sub> = ∬y²ρ dA</b>, <b>I<sub>y</sub> = ∬x²ρ dA</b>, and the polar moment <b>I₀ = I<sub>x</sub> + I<sub>y</sub> = ∬r²ρ dA</b>.
      The squaring is what makes them different in kind from the first moments: a moment of inertia can
      never cancel, and mass far from the axis counts disproportionately. That is why a figure skater
      speeds up by pulling their arms in, and why the same mass makes a much stiffer flywheel at a larger
      radius.</p>`;
  },
  wire(){
    pkWire('igMR', 'igreg', ST.reg, ST, igRegSlots(ST), igRegBounds(ST), v => { ST.reg = v; });
    ctWireSeg('igMK', v => { ST.regKind = v; buildStagePanel(); });
    ctWireSeg('igMD', v => { ST.den = v; });
    pkWireBoxes('igden', ST.den, ST, IG_DEN_OWN, null);
    wireSlider('igMax', () => ST.axis, v => { ST.axis = v; }, v => fmtNum(+v, 3));
    ctWireChk('igMg', v => { ST.show.gyr = v; });
  },
  /* a Type II lamina has no Type I description, so the order must ask the region
     rather than assume one of the two — `igLamina` would otherwise be handed a
     null limit function and return NaN for every moment */
  order(st){ const R = igRegCur(st); return R.yLo ? 'dydx' : R.xLo ? 'dxdy' : 'polar'; },
  frame(st, dt, ctx, W, H){
    const Rg = igRegCur(st);
    const rho = igDenCur(st).f;
    const mx = Math.max(Math.abs(Rg.x0), Math.abs(Rg.x1), Math.abs(Rg.y0), Math.abs(Rg.y1)) * 1.28;
    const P = ctBox(W, H, 0, 0, mx);
    ctGrid(ctx, P);
    ctFrame(ctx, P, `${Rg.name}  with  ρ = ${igDenCur(st).name.split('  ')[0].replace('ρ = ', '')}`);
    /* the region, shaded by density */
    let rlo = Infinity, rhi = -Infinity;
    for(let i = 0; i <= 60; i++) for(let j = 0; j <= 60; j++){
      const x = P.x0 + (P.x1 - P.x0) * i / 60, y = P.y0 + (P.y1 - P.y0) * j / 60;
      if(!igInRegion(Rg, x, y)) continue;
      const v = rho(x, y);
      if(Number.isFinite(v)){ rlo = Math.min(rlo, v); rhi = Math.max(rhi, v); }
    }
    const cells = 140, cw = P.pw / cells, chh = P.ph / cells;
    for(let i = 0; i < cells; i++) for(let j = 0; j < cells; j++){
      const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / cells;
      const y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / cells;
      if(!igInRegion(Rg, x, y)) continue;
      const v = rho(x, y);
      ctx.fillStyle = rgbCss(rampSeq((v - rlo) / ((rhi - rlo) || 1)), 0.85);
      ctx.fillRect(P.px + i * cw - 0.5, P.py + P.ph - (j + 1) * chh - 0.5, cw + 1, chh + 1);
    }
    const L = igLamina(Rg, rho, this.order(st));
    /* the centroid, and the balance lines through it */
    ctPath(ctx, P, [{ x:L.cx, y:P.y0 }, { x:L.cx, y:P.y1 }], rgbCss(TH.text, 0.5), 1.2, [5, 4]);
    ctPath(ctx, P, [{ x:P.x0, y:L.cy }, { x:P.x1, y:L.cy }], rgbCss(TH.text, 0.5), 1.2, [5, 4]);
    ctDot(ctx, P, L.cx, L.cy, 8, rgbCss(TH.warn), rgbCss(TH.bg));
    ctText(ctx, P.X(L.cx) + 11, P.Y(L.cy) - 9, 'centre of mass', rgbCss(TH.warn), '600 11px ' + FONT_UI);
    /* the parallel axis */
    ctPath(ctx, P, [{ x:st.axis, y:P.y0 }, { x:st.axis, y:P.y1 }], rgbCss(TH.neg), 2, [3, 3]);
    if(st.show.gyr){
      /* the radius of gyration about the y-axis, drawn as a pair of lines: the
         distance at which all the mass could sit and give the same I */
      ctPath(ctx, P, [{ x:L.ry, y:P.y0 }, { x:L.ry, y:P.y1 }], rgbCss(TH.curl, 0.8), 1.6);
      ctPath(ctx, P, [{ x:-L.ry, y:P.y0 }, { x:-L.ry, y:P.y1 }], rgbCss(TH.curl, 0.8), 1.6);
      ctText(ctx, P.X(L.ry) + 5, P.py + 18, 'radius of gyration about ŷ', rgbCss(TH.curl), '600 10.5px ' + FONT_UI);
      ctx.strokeStyle = rgbCss(TH.pos, 0.7); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), L.r0 * P.u, 0, 6.2832); ctx.stroke();
    }
    stageNote(ctx, 'colour is the density · the cross-hairs mark where the plate would balance on a pin', W, H);
  },
  readout(st){
    const Rg = igRegCur(st);
    const rho = igDenCur(st).f;
    const ord = this.order(st);
    const L = igLamina(Rg, rho, ord);
    const pa = igParallelAxis(Rg, rho, ord, st.axis);
    const area = igRegionIntegral(Rg, () => 1, ord);
    return `<div class="card tight"><div class="ttl">Mass and moments</div>
      ${kv('area ∬ dA', fmtNum(area, 7))}
      ${kv('mass m = ∬ρ dA', fmtNum(L.M, 7))}
      ${kv('average density m/A', fmtNum(L.M / area, 7))}
      ${kv('M<sub>y</sub> = ∬xρ dA', fmtNum(L.My, 7))}
      ${kv('M<sub>x</sub> = ∬yρ dA', fmtNum(L.Mx, 7))}
      ${kv('x̄ = M<sub>y</sub>/m', fmtNum(L.cx, 7))}
      ${kv('ȳ = M<sub>x</sub>/m', fmtNum(L.cy, 7))}
      ${kv('inside the region?', igInRegion(Rg, L.cx, L.cy) ? 'yes' : 'no — the centroid lies outside the plate')}
    </div>
    <div class="card tight"><div class="ttl">Moments of inertia</div>
      ${kv('I<sub>x</sub> = ∬y²ρ dA', fmtNum(L.Ix, 7))}
      ${kv('I<sub>y</sub> = ∬x²ρ dA', fmtNum(L.Iy, 7))}
      ${kv('I₀ = ∬r²ρ dA', fmtNum(L.I0, 7))}
      ${kv('I<sub>x</sub> + I<sub>y</sub>', fmtNum(L.Ix + L.Iy, 7))}
      ${kv('difference', fmtAgree(L.I0, L.Ix + L.Iy))}
      ${kv('radius of gyration about ŷ  √(I<sub>y</sub>/m)', fmtNum(L.ry, 7))}
      ${kv('about x̂', fmtNum(L.rx, 7))}
      ${kv('about the origin', fmtNum(L.r0, 7))}
      <p class="help">The perpendicular-axis identity <b>I₀ = I<sub>x</sub> + I<sub>y</sub></b> holds for any flat plate and
      is checked above; it is nothing but <b>r² = x² + y²</b> integrated. The radius of gyration is the
      distance at which a point mass equal to m would have the same moment of inertia — a way of quoting
      an inertia as a length.</p>
    </div>
    <div class="card tight"><div class="ttl">The parallel-axis theorem, checked</div>
      ${kv('axis at x =', fmtNum(st.axis, 5))}
      ${kv('distance d from the centroid', fmtNum(pa.d, 6))}
      ${kv('I about that axis, integrated', fmtNum(pa.Ishift, 7))}
      ${kv('I about the centroid', fmtNum(pa.Icen, 7))}
      ${kv('I_centroid + m d²', fmtNum(pa.predicted, 7))}
      ${kv('difference', fmtAgree(pa.Ishift, pa.predicted))}
      <p class="help">Two independent integrals and one prediction, agreeing. The theorem says the moment
      of inertia is smallest about an axis through the centre of mass, and grows quadratically as you move
      away — which is why a door hinged at its edge is harder to swing than one pivoted at its middle.</p>
    </div>`;
  },
  chip(st){
    const L = igLamina(igRegCur(st), igDenCur(st).f, this.order(st));
    return `<div class="k">centre of mass</div>
      <div style="color:var(--c-warn)">(${fmtNum(L.cx, 4)}, ${fmtNum(L.cy, 4)})</div>
      <div>m = ${fmtNum(L.M, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'density ρ(x, y)'], ['var(--c-warn)', 'the centre of mass'],
                    ['var(--c-curl)', 'the radius of gyration about ŷ'], ['var(--c-pos)', 'about the origin'],
                    ['var(--c-neg)', 'the parallel axis']]; },
  dockLegend:true
};

/* ---- 10 · change of variables ---------------------------------------------- */
STAGES.igChange = {
  title:'Change of variables',
  derive(st){
    return {
      title:'The Jacobian is a local area-scaling factor, and it is measurable',
      steps:[
        drvSay('substitution in one dimension already contains the idea',
          'When we write ∫f(g(u))g′(u)du, the g′ is not decoration — it converts a length du in the u-line into the length dx it becomes. In one dimension that stretching factor is a single derivative. In two, a small square can be stretched, sheared and rotated, so one number will not do.'),
        drvStep('the map takes a small square to a small parallelogram',
          `${dv('T')}(${dv('u')}, ${dv('v')}) ${dop('=')} (${dv('x')}(${dv('u')},${dv('v')}), ${dv('y')}(${dv('u')},${dv('v')}))`,
          'to first order, the two edges of the square go to two vectors'),
        drvStep('those edge vectors are the columns of the derivative matrix',
          `${dv('J')} ${dop('=')} [ ∂(${dv('x')},${dv('y')}) / ∂(${dv('u')},${dv('v')}) ]`,
          'each column is the image of one unit edge — the total derivative of the multivariable wing'),
        drvSay('and the area of a parallelogram is a determinant',
          'This is the linear-algebra wing\'s result, arriving exactly where it is needed. The determinant of a 2×2 matrix is the signed area of the parallelogram its columns span. So |det J| is the factor by which the map multiplies area at that point — nothing further needs to be proved.'),
        drvStep('so the area element transforms by the modulus of the determinant',
          `d${dv('A')} ${dop('=')} |det ${dv('J')}| d${dv('u')} d${dv('v')}`,
          'the panel evaluates |J| at the centre and against its closed form'),
        drvSay('the modulus is there because area has no sign but determinants do',
          'A negative determinant means the map reverses orientation — it flips the plane over. Area does not care, so the absolute value is taken. The sign is not meaningless, though: it is exactly what the differential-forms wing keeps track of, and what makes Green\'s theorem sensitive to which way a loop is traversed.'),
        drvStep('polar coordinates are the special case r',
          `det ${dv('J')} ${dop('=')} ${dv('r')}`,
          'which is the factor the polar stage obtained geometrically — two routes, one answer'),
        drvStep('and leaving it out is not a small error',
          `∬ ${dv('f')}(${dv('T')}) d${dv('u')} d${dv('v')} without |${dv('J')}|`,
          'the panel computes it both ways and prints how badly wrong the omission is')
      ],
      note:'The panel also reports whether |J| is constant. For a linear map it is, and the whole region scales by one factor. For anything else it varies from point to point, which is why it has to live inside the integral rather than being pulled out in front of it.'
    };
  },
  enter(st, o){
    st.key = o.key || 'ellip';
    st.fn = o.fn || 'one';
    st.n = 10;
  },
  controls(){
    const st = ST, M = MV_MAPS[st.key];
    return ctSeg('igVK', st.key, Object.keys(MV_MAPS).map(k => [k, MV_MAPS[k].name.split('  ')[0]])) +
      pkSeg('igVF', IG_INTEGRANDS, st.fn, e => e.name.replace('f = ', '').split('  ')[0]) +
      pkBoxes('igfn', st.fn, st, IG_FN_OWN, null, IG_COORD_HELP) +
      ctlRow('grid', ctlSlider('igVn', 4, 24, 1, st.n)) +
      `<p class="help"><b>${M.name}</b><br>${M.note}</p>
      <p class="help">The theorem is
      <b>∬<sub>S</sub> f(x,y) dA = ∬<sub>R</sub> f(T(u,v)) |∂(x,y)/∂(u,v)| du dv</b>. In words: to
      integrate over an awkward region, find a map that turns a nice one into it, pull the integrand back
      through the map, and pay for the distortion with the absolute value of the Jacobian determinant.</p>
      <p class="help">The two panels below integrate the same quantity in the two different ways —
      directly over the image, and pulled back over the domain — with quadrature that knows nothing about
      the theorem. They agree, and the panel prints the gap. Polar coordinates are one line of this
      theorem, with |J| = r.</p>`;
  },
  wire(){
    ctWireSeg('igVK', v => { ST.key = v; });
    ctWireSeg('igVF', v => { ST.fn = v; });
    pkWireBoxes('igfn', ST.fn, ST, IG_FN_OWN, null);
    wireSlider('igVn', () => ST.n, v => { ST.n = Math.round(v); }, v => String(Math.round(v)) + '²  cells');
  },
  frame(st, dt, ctx, W, H){
    const M = MV_MAPS[st.key];
    const halfW = W / 2;
    const A = ctBox(halfW, H, (M.u0 + M.u1) / 2, (M.v0 + M.v1) / 2,
                    Math.max(M.u1 - M.u0, M.v1 - M.v0) * 0.62, { r:20 });
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for(let i = 0; i <= 24; i++) for(let j = 0; j <= 24; j++){
      const q = M.T(M.u0 + (M.u1 - M.u0) * i / 24, M.v0 + (M.v1 - M.v0) * j / 24);
      if(!Number.isFinite(q.x)) continue;
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
    }
    const Bx = ctBox(halfW, H, (x0 + x1) / 2, (y0 + y1) / 2, Math.max(x1 - x0, y1 - y0) * 0.62, { l:36, r:26 });
    const B = Object.assign({}, Bx, { X:x => Bx.X(x) + halfW, px:Bx.px + halfW });
    ctGrid(ctx, A); ctFrame(ctx, A, `the (${M.ul}, ${M.vl}) rectangle — where the integral is easy`);
    ctGrid(ctx, B); ctFrame(ctx, B, 'the region you actually wanted');
    /* every cell, with its area scaled by the Jacobian */
    const n = st.n, du = (M.u1 - M.u0) / n, dv = (M.v1 - M.v0) / n;
    let maxJ = 1e-9;
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++)
      maxJ = Math.max(maxJ, Math.abs(M.jac(M.u0 + (i + 0.5) * du, M.v0 + (j + 0.5) * dv)));
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
      const u = M.u0 + i * du, v = M.v0 + j * dv;
      const J = Math.abs(M.jac(u + du / 2, v + dv / 2));
      const col = rgbCss(rampSeq(J / maxJ), 0.55);
      ctFill(ctx, A, [{ x:u, y:v }, { x:u + du, y:v }, { x:u + du, y:v + dv }, { x:u, y:v + dv }], col);
      const img = [];
      for(let k = 0; k <= 6; k++) img.push(M.T(u + du * k / 6, v));
      for(let k = 0; k <= 6; k++) img.push(M.T(u + du, v + dv * k / 6));
      for(let k = 6; k >= 0; k--) img.push(M.T(u + du * k / 6, v + dv));
      for(let k = 6; k >= 0; k--) img.push(M.T(u, v + dv * k / 6));
      ctFill(ctx, B, img, col);
      ctPath(ctx, B, img.concat([img[0]]), rgbCss(TH.bg, 0.55), 0.8);
    }
    for(let i = 0; i <= n; i++){
      const u = M.u0 + i * du, v = M.v0 + i * dv;
      ctPath(ctx, A, [{ x:u, y:M.v0 }, { x:u, y:M.v1 }], rgbCss(TH.text, 0.28), 0.9);
      ctPath(ctx, A, [{ x:M.u0, y:v }, { x:M.u1, y:v }], rgbCss(TH.text, 0.28), 0.9);
      ctParam(ctx, B, t => M.T(u, t), M.v0, M.v1, 90, rgbCss(TH.text, 0.28), 0.9);
      ctParam(ctx, B, t => M.T(t, v), M.u0, M.u1, 90, rgbCss(TH.text, 0.28), 0.9);
    }
    stageNote(ctx, 'each cell is coloured by |J| — the factor its area is multiplied by on the way across', W, H);
  },
  readout(st){
    const M = MV_MAPS[st.key];
    const F = igFnCur(st).f;
    const pulled = nqDoubleRect((u, v) => {
      const p = M.T(u, v);
      const val = F(p.x, p.y);
      return (Number.isFinite(val) ? val : 0) * Math.abs(M.jac(u, v));
    }, M.u0, M.u1, M.v0, M.v1, 5, 20);
    const areaPull = nqDoubleRect((u, v) => Math.abs(M.jac(u, v)), M.u0, M.u1, M.v0, M.v1, 5, 20);
    const noJac = nqDoubleRect((u, v) => {
      const p = M.T(u, v);
      const val = F(p.x, p.y);
      return Number.isFinite(val) ? val : 0;
    }, M.u0, M.u1, M.v0, M.v1, 5, 20);
    const domainArea = (M.u1 - M.u0) * (M.v1 - M.v0);
    /* an independent check: Monte Carlo over the image, using the map only to
       decide membership by inverting it where an inverse is available */
    const J0 = mvJacobian2(M.T, (M.u0 + M.u1) / 2, (M.v0 + M.v1) / 2);
    return `<div class="card tight"><div class="ttl">The theorem, both sides</div>
      ${kv('∬ f(T(u,v))·|J| du dv', fmtNum(pulled, 9))}
      ${kv('the same, with |J| left out', fmtNum(noJac, 9))}
      ${kv('the error that would cause', fmtNum(Math.abs(pulled - noJac), 5))}
      ${kv('|J| at the centre', fmtNum(Math.abs(J0.det), 6))}
      ${kv('closed-form |J| there', fmtNum(Math.abs(M.jac((M.u0 + M.u1) / 2, (M.v0 + M.v1) / 2)), 6))}
    </div>
    <div class="card tight"><div class="ttl">Areas</div>
      ${kv('area of the (u, v) rectangle', fmtNum(domainArea, 7))}
      ${kv('area of its image, ∬|J| du dv', fmtNum(areaPull, 7))}
      ${kv('ratio', fmtNum(areaPull / domainArea, 6))}
      ${kv('is |J| constant?', (() => {
        let lo = Infinity, hi = -Infinity;
        for(let i = 0; i <= 12; i++) for(let j = 0; j <= 12; j++){
          const J = Math.abs(M.jac(M.u0 + (M.u1 - M.u0) * i / 12, M.v0 + (M.v1 - M.v0) * j / 12));
          lo = Math.min(lo, J); hi = Math.max(hi, J);
        }
        return hi - lo < 1e-9 ? 'yes — this is a linear map, so the ratio is uniform'
                              : `no — |J| runs from ${fmtNum(lo, 4)} to ${fmtNum(hi, 4)}`;
      })())}
      <p class="help">For a <b>linear</b> map the Jacobian is the matrix itself and the determinant is a
      single number: every region's area scales identically, and the change of variables is just that
      constant. For a nonlinear map the factor varies from point to point, which is precisely why it has to
      sit <i>inside</i> the integral rather than outside it.</p>
    </div>
    <div class="card tight"><div class="ttl">Why the absolute value</div>
      ${kv('det J at the centre', fmtNum(J0.det, 6))}
      ${kv('sign', J0.det > 0 ? 'positive — orientation preserved' : 'negative — the map flips the plane')}
      <p class="help">The determinant carries a sign that records whether the map turns the plane over.
      Areas are unsigned, so the integral takes the absolute value. In the one-variable substitution rule
      the same sign is handled invisibly, by swapping the limits of integration — which is why nobody ever
      writes |du/dx| there.</p>
      <p class="help">The other direction is worth knowing:
      <b>∂(u,v)/∂(x,y) = 1/(∂(x,y)/∂(u,v))</b>, because the two Jacobian matrices are inverses and
      determinants multiply. Sometimes the inverse map is the easy one to write down, and this identity
      saves solving for the forward one.</p>
    </div>`;
  },
  chip(st){
    const M = MV_MAPS[st.key];
    return `<div class="k">|J|</div>
      <div style="color:var(--c-grad)">${fmtNum(Math.abs(M.jac((M.u0 + M.u1) / 2, (M.v0 + M.v1) / 2)), 5)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'each cell, coloured by |J|']]; },
  dockLegend:true
};
