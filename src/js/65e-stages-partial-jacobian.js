STAGES.mvJac = {
  title:'The Jacobian',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'The derivative of a map that takes vectors to vectors',
      steps:[
        drvSay('what a derivative has to be, in general',
          'In every setting a derivative is the best linear approximation near a point. For a function of one variable that is a number; for a scalar function of several it is the gradient; for a map from the plane to the plane it must be a matrix, because that is what a linear map between planes is.'),
        drvStep('assemble the partial derivatives of each output',
          `${dv('J')} ${dop('=')} [ ∂${dv('x')}/∂${dv('u')} ∂${dv('x')}/∂${dv('v')} ; ∂${dv('y')}/∂${dv('u')} ∂${dv('y')}/∂${dv('v')} ]`,
          `evaluated at (u, v) = (${n(st.u)}, ${n(st.v)})`),
        drvStep('and it is a derivative in the only sense that matters',
          `${dv('T')}(${dv('p')} ${dop('+')} Δ) ${dop('≈')} ${dv('T')}(${dv('p')}) ${dop('+')} ${dv('J')}Δ`,
          `at step h = ${n(st.h)} the panel prints the true image and this estimate, with the error`),
        drvSay('read the columns as images of the coordinate directions',
          'The first column is where a small step in u lands; the second, a small step in v. So a tiny square in the (u, v) plane is carried to the parallelogram those two vectors span — which is exactly what the picture draws.'),
        drvStep('so its determinant is the local area factor',
          `d${dv('A')} ${dop('=')} |det ${dv('J')}| d${dv('u')} d${dv('v')}`,
          'the panel measures the image cell\'s area numerically and compares with |det J|'),
        drvSay('and that is why the change-of-variables formula looks as it does',
          'The Jacobian determinant in a multiple integral is not a correction factor bolted on. It is the area-scaling of the map, and the determinant computes area-scaling because that is what determinants are. For polar coordinates it evaluates to r, which is the factor the polar stage found by cutting up a sector.'),
        drvStep('the chain rule becomes matrix multiplication',
          `${dv('J')}_(${dv('S')}∘${dv('T')}) ${dop('=')} ${dv('J')}_S ${dv('J')}_T`,
          'compose the maps, multiply the Jacobians — in that order'),
        drvSay('which is the reason matrix multiplication was defined that way',
          'Matrices multiply by composing linear maps, and derivatives are linear maps. So the chain rule in every dimension is one matrix product, and the one-variable rule f′(g(x))g′(x) is the 1×1 case.'),
        drvStep('a nonzero determinant means the map is locally invertible',
          `det ${dv('J')} ${dop('≠')} 0 ${dop('⇒')} locally one-to-one`,
          'the inverse function theorem — and the Jacobian of the inverse is the inverse of the Jacobian'),
        drvSay('locally, and only locally',
          'Polar coordinates have det J = r, nonzero away from the origin, and yet θ and θ + 2π give the same point. Invertibility near each point does not add up to invertibility overall. At the origin r = 0 the map genuinely collapses, which is why polar coordinates are singular there.')
      ],
      note:'The panel draws a small square in the source and its actual image, then overlays the parallelogram predicted by J. As the square shrinks the two converge — which is the definition of the derivative, being carried out rather than described.'
    };
  },
  enter(st, o){
    st.key = o.key || 'polar';
    st.u = 1.2; st.v = 0.7; st.h = 0.28;
    st.grid = true;
    st.show = Object.assign({ cell:true, grid:true }, o.show || {});
  },
  controls(){
    const st = ST, M = mvMapCur(st);
    return pkSeg('mvJK', MV_MAPS, st.key, e => e.name.split('  ')[0]) +
      pkBoxes('mvmap', st.key, st, MV_MAP_OWN, MV_MAP_BOUNDS,
        'Write the map in <b>u</b> and <b>v</b>. Both components are differentiated symbolically, so the ' +
        'determinant printed as "the closed form" is exact for what you type. Try <b>u*cos(v)</b> and ' +
        '<b>u*sin(v)</b> for polar, or <b>exp(u)*cos(v)</b> and <b>exp(u)*sin(v)</b> for the complex ' +
        'exponential, whose determinant is e<sup>2u</sup> and never zero.') +
      ctlRow(M.ul, ctlSlider('mvJu', M.u0, M.u1, (M.u1 - M.u0) / 400, st.u)) +
      ctlRow(M.vl, ctlSlider('mvJv', M.v0, M.v1, (M.v1 - M.v0) / 400, st.v)) +
      ctlRow('cell size', ctlSlider('mvJh', 0.02, 0.5, 0.005, st.h)) +
      ctChk('mvJg', 'the whole grid, mapped', st.show.grid) +
      `<p class="help"><b>${M.name}</b><br>${M.note}</p>
      <p class="help">The <b>Jacobian matrix</b> collects the four partial derivatives of the map, and it
      is the <i>derivative</i> of the map: near any point the transformation is, to first order, the
      linear map that matrix describes. Its <b>determinant</b> is therefore the factor by which small
      areas are multiplied — positive if orientation is preserved, negative if the map turns the plane
      over.</p>
      <p class="help">The little square on the left is drawn, mapped corner by corner, and its image
      measured with the shoelace formula. Shrink the cell and watch the measured ratio converge on the
      determinant — that convergence <i>is</i> the definition of the derivative, and it is why the
      change-of-variables theorem in the integration wing carries |J| and nothing else.</p>`;
  },
  wire(){
    pkWire('mvJK', 'mvmap', ST.key, ST, MV_MAP_OWN, MV_MAP_BOUNDS,
      v => { ST.key = v; },
      () => { const M = mvMapCur(ST); ST.u = (M.u0 + M.u1) / 2; ST.v = (M.v0 + M.v1) / 2; });
    wireSlider('mvJu', () => ST.u, v => { ST.u = v; }, v => fmtNum(+v, 4));
    wireSlider('mvJv', () => ST.v, v => { ST.v = v; }, v => fmtNum(+v, 4));
    wireSlider('mvJh', () => ST.h, v => { ST.h = v; }, v => fmtNum(+v, 4));
    ctWireChk('mvJg', v => { ST.show.grid = v; });
  },
  frame(st, dt, ctx, W, H){
    const M = mvMapCur(st);
    const halfW = W / 2;
    /* left: the (u, v) domain. right: its image. */
    const A = ctBox(halfW, H, (M.u0 + M.u1) / 2, (M.v0 + M.v1) / 2,
                    Math.max(M.u1 - M.u0, M.v1 - M.v0) * 0.62, { r:20 });
    /* the image's extent, measured from the map itself */
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for(let i = 0; i <= 24; i++) for(let j = 0; j <= 24; j++){
      const q = M.T(M.u0 + (M.u1 - M.u0) * i / 24, M.v0 + (M.v1 - M.v0) * j / 24);
      if(!Number.isFinite(q.x)) continue;
      x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y);
    }
    const Bx = ctBox(halfW, H, (x0 + x1) / 2, (y0 + y1) / 2, Math.max(x1 - x0, y1 - y0) * 0.62, { l:36, r:26 });
    const B = Object.assign({}, Bx, {
      X:x => Bx.X(x) + halfW, px:Bx.px + halfW,
      inside:(sx, sy) => Bx.inside(sx - halfW, sy)
    });
    ctGrid(ctx, A);
    ctFrame(ctx, A, `the (${M.ul}, ${M.vl}) plane`);
    ctGrid(ctx, B);
    ctFrame(ctx, B, 'the (x, y) plane — its image');
    if(st.show.grid){
      const n = 11;
      for(let i = 0; i <= n; i++){
        const u = M.u0 + (M.u1 - M.u0) * i / n;
        ctPath(ctx, A, [{ x:u, y:M.v0 }, { x:u, y:M.v1 }], rgbCss(TH.grad, 0.5), 1.1);
        ctParam(ctx, B, t => M.T(u, t), M.v0, M.v1, 120, rgbCss(TH.grad, 0.5), 1.1);
        const v = M.v0 + (M.v1 - M.v0) * i / n;
        ctPath(ctx, A, [{ x:M.u0, y:v }, { x:M.u1, y:v }], rgbCss(TH.pos, 0.5), 1.1);
        ctParam(ctx, B, t => M.T(t, v), M.u0, M.u1, 120, rgbCss(TH.pos, 0.5), 1.1);
      }
    }
    /* the cell and its image */
    const h = st.h, u = st.u, v = st.v;
    const corners = [{ x:u, y:v }, { x:u + h, y:v }, { x:u + h, y:v + h }, { x:u, y:v + h }];
    ctFill(ctx, A, corners, rgbCss(TH.warn, 0.35));
    ctPath(ctx, A, corners.concat([corners[0]]), rgbCss(TH.warn), 2);
    const img = [];
    for(let i = 0; i <= 12; i++) img.push(M.T(u + h * i / 12, v));
    for(let i = 0; i <= 12; i++) img.push(M.T(u + h, v + h * i / 12));
    for(let i = 0; i <= 12; i++) img.push(M.T(u + h - h * i / 12, v + h));
    for(let i = 0; i <= 12; i++) img.push(M.T(u, v + h - h * i / 12));
    ctFill(ctx, B, img, rgbCss(TH.warn, 0.35));
    ctPath(ctx, B, img.concat([img[0]]), rgbCss(TH.warn), 2);
    /* the two tangent vectors: the columns of the Jacobian */
    const J = mvJacobian2(M.T, u, v);
    const p = M.T(u, v);
    ctArrow(ctx, B, p.x, p.y, p.x + J.m[0][0] * h, p.y + J.m[1][0] * h, rgbCss(TH.curl), 2.4, 'T_' + M.ul);
    ctArrow(ctx, B, p.x, p.y, p.x + J.m[0][1] * h, p.y + J.m[1][1] * h, rgbCss(TH.neg), 2.4, 'T_' + M.vl);
    ctDot(ctx, A, u, v, 5, rgbCss(TH.text), rgbCss(TH.bg));
    ctDot(ctx, B, p.x, p.y, 5, rgbCss(TH.text), rgbCss(TH.bg));
    stageNote(ctx, 'the shaded square and its image — the determinant is the ratio of their areas, in the limit', W, H);
  },
  readout(st){
    const M = mvMapCur(st);
    const J = mvJacobian2(M.T, st.u, st.v);
    const exact = M.jac(st.u, st.v);
    const meas = igCellArea(M, st.u, st.v, st.h) / (st.h * st.h);
    const meas2 = igCellArea(M, st.u, st.v, st.h / 4) / (st.h * st.h / 16);
    return `<div class="card tight"><div class="ttl">The Jacobian matrix at (${fmtNum(st.u, 3)}, ${fmtNum(st.v, 3)})</div>
      ${ctMat(J.m, ['∂x', '∂y'], ['∂' + M.ul, '∂' + M.vl])}
      ${kv('det J', fmtNum(J.det, 6))}
      ${kv('the closed form', fmtNum(exact, 6))}
      ${kv('|det J|', fmtNum(Math.abs(J.det), 6))}
      ${kv('orientation', J.det > 0 ? 'preserved' : J.det < 0 ? 'reversed — the map turns the plane over' : 'degenerate — the map collapses area here')}
    </div>
    <div class="card tight"><div class="ttl">Area, measured</div>
      ${kv('cell area in (u, v)', fmtNum(st.h * st.h, 6))}
      ${kv('image area (shoelace)', fmtNum(igCellArea(M, st.u, st.v, st.h), 6))}
      ${kv('ratio at this cell size', fmtNum(meas, 6))}
      ${kv('ratio at a quarter the size', fmtNum(meas2, 6))}
      ${kv('|det J|', fmtNum(Math.abs(J.det), 6))}
      <p class="help">The ratio is not exactly the determinant, and it should not be: the determinant is
      the <i>limit</i> of that ratio. Shrink the cell and the two converge, at a rate set by how fast the
      map's second derivatives vary — which is exactly the same statement as "the map is differentiable
      here".</p>
    </div>
    <div class="card tight"><div class="ttl">The columns are tangent vectors</div>
      ${kv('T_' + M.ul + '  (∂x/∂' + M.ul + ', ∂y/∂' + M.ul + ')', ctVec2({ x:J.m[0][0], y:J.m[1][0] }))}
      ${kv('T_' + M.vl, ctVec2({ x:J.m[0][1], y:J.m[1][1] }))}
      ${kv('their cross product', fmtNum(J.m[0][0] * J.m[1][1] - J.m[0][1] * J.m[1][0], 6))}
      ${kv('angle between them', ctDeg(gaAngle(v3(J.m[0][0], J.m[1][0], 0), v3(J.m[0][1], J.m[1][1], 0))))}
      <p class="help">Each column is the velocity of the image point as one coordinate is increased with
      the other held fixed — the tangent to a grid line. The determinant is the area of the parallelogram
      they span, which is why it is a cross product in disguise, and why the same object appears in the
      surface-integral stage as <b>|r<sub>u</sub> × r<sub>v</sub>|</b>.</p>
      <p class="help">Where the two columns become parallel the determinant hits zero and the map crushes
      a patch of area to nothing. In polar coordinates that happens at r = 0, which is why the origin is a
      singular point of the polar system despite being an entirely ordinary point of the plane.</p>
    </div>`;
  },
  chip(st){
    const J = mvJacobian2(mvMapCur(st).T, st.u, st.v);
    return `<div class="k">det J</div><div style="color:var(--c-warn)">${fmtNum(J.det, 5)}</div>`;
  },
  legend(){ return [['var(--c-grad)', M_GRIDU()], ['var(--c-pos)', M_GRIDV()],
                    ['var(--c-warn)', 'the cell, and its image'],
                    ['var(--c-curl)', 'the first column of J'], ['var(--c-neg)', 'the second column']]; },
  dockLegend:true
};
/* MV_MAPS has no `custom` entry, so these go through the accessor rather than
   indexing the table — the trap that broke every caption in this wing before */
const M_GRIDU = () => (ST && ST.key) ? mvMapCur(ST).ul + ' = const' : 'u = const';
const M_GRIDV = () => (ST && ST.key) ? mvMapCur(ST).vl + ' = const' : 'v = const';
