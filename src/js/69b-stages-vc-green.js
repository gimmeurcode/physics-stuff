STAGES.vcGreen = {
  title:"Green's theorem",
  derive(st){
    return {
      title:'Why interior swirl adds up to boundary circulation',
      steps:[
        drvSay('the shape of the claim',
          'Something measured all over a region equals something measured only on its edge. That is a strange trade at first sight, and it happens because the interior contributions cancel one another everywhere except at the boundary.'),
        drvStep('the theorem',
          `∮_(∂R) ${dv('P')}d${dv('x')} ${dop('+')} ${dv('Q')}d${dv('y')} ${dop('=')} ∬_R (${dv('Q')}ₓ ${dop('−')} ${dv('P')}_y) d${dv('A')}`,
          st.form === 'circ' ? 'the circulation form — the panel computes both sides independently'
                             : 'the flux form, which is the divergence theorem in the plane'),
        drvStep('start with one tiny rectangle',
          `circulation ${dop('≈')} (${dv('Q')}ₓ ${dop('−')} ${dv('P')}_y) Δ${dv('x')}Δ${dv('y')}`,
          'walk its four sides and expand each to first order'),
        drvSay('so the curl is circulation per unit area',
          'That is what the curl actually is, and the definition drops out rather than being imposed. Q_x − P_y is not a formula to memorise — it is what remains after walking a small rectangle and cancelling the terms that appear twice with opposite signs.'),
        drvStep('now tile the whole region with such rectangles',
          `Σ circulations ${dop('=')} ∬ (curl) d${dv('A')}`,
          'the panel refines the tiling and shows the sums converging'),
        drvSay('here is the cancellation, and it is the entire proof',
          'Every internal edge is shared by two neighbouring tiles, and each traverses it in the opposite direction. Those two contributions are equal and opposite, so they cancel exactly. Only edges with no neighbour survive — and those are precisely the boundary of the region.'),
        drvStep('what survives is the boundary integral',
          `Σ over tiles ${dop('=')} ∮ over ∂${dv('R')}`,
          'nothing is approximated in this step; the interior terms cancel identically'),
        drvSay('and the orientation convention is forced, not chosen',
          'The cancellation only works if neighbouring tiles are traversed consistently. Following each anticlockwise makes every shared edge get one traversal each way. That is why the boundary must be walked anticlockwise, with the region on the left — reverse it and the sign flips.'),
        drvStep('taking P and Q cleverly makes the integrand 1',
          `${dv('A')} ${dop('=')} ${dfrac('1', '2')}∮(${dv('x')}d${dv('y')} ${dop('−')} ${dv('y')}d${dv('x')})`,
          'so area can be measured by walking the boundary — which is how a planimeter works')
      ],
      note:'Both sides are computed here by independent numerical methods: the boundary by a line integral along the parametrised curve, the interior by a double integral over the region. The panel prints both and the difference, so the theorem is being tested rather than illustrated.'
    };
  },
  enter(st, o){
    st.fld = o.fld || 'rot';
    st.path = o.path || 'circle';
    st.form = o.form || 'circ';
    st.n = 16;
    st.t = 0;
    st.run = o.run !== false;
  },
  controls(){
    const st = ST;
    const paths = ['circle', 'ellipse', 'square', 'cardioid'];
    return pkSeg('vcGF', VC_FIELDS, st.fld) +
      pkBoxes('vcown2', st.fld, st, VC_OWN2, null, VC_OWN_HELP) +
      ctSeg('vcGP', st.path, paths.map(p => [p, VC_PATHS[p].name.split('  ')[0]])) +
      ctSeg('vcGForm', st.form, [['circ', 'circulation form'], ['flux', 'flux (divergence) form'], ['area', 'the planimeter']]) +
      ctlRow('cells shown', ctlSlider('vcGn', 6, 40, 1, st.n)) +
      ctChk('vcGrun', 'run the boundary', st.run) +
      `<p class="help">${st.form === 'circ'
        ? '<b>∮<sub>C</sub> P dx + Q dy = ∬<sub>R</sub> (Q<sub>x</sub> − P<sub>y</sub>) dA.</b> The circulation around the boundary equals the total microscopic rotation inside. The reason is cancellation: tile the region with little loops, and every interior edge is traversed twice in opposite directions and cancels, leaving only the outer boundary.'
        : st.form === 'flux'
        ? '<b>∮<sub>C</sub> F·n̂ ds = ∬<sub>R</sub> (P<sub>x</sub> + Q<sub>y</sub>) dA.</b> The same theorem with F rotated by 90°: outward flux across the boundary equals the total divergence inside. This is the two-dimensional divergence theorem, and it is a relabelling of the circulation form rather than a separate result.'
        : 'Set P = −y/2 and Q = x/2, so Q<sub>x</sub> − P<sub>y</sub> = 1, and Green\'s theorem returns the <b>area</b>: <b>A = ½∮(x dy − y dx)</b>. A planimeter is a mechanical instrument that evaluates exactly this integral by being wheeled once around the boundary of a shape — it measures an area without ever entering the region.'}</p>
      <p class="help">The little loops drawn inside the region are the argument, not an illustration of it.
      Each carries its own circulation; the arrows on shared edges point opposite ways and cancel in the sum.
      What survives is the boundary — and the theorem is the statement that the sum of the insides equals
      what is left at the edge.</p>`;
  },
  wire(){
    pkWire('vcGF', 'vcown2', ST.fld, ST, VC_OWN2, null, v => { ST.fld = v; });
    ctWireSeg('vcGP', v => { ST.path = v; });
    ctWireSeg('vcGForm', v => { ST.form = v; });
    wireSlider('vcGn', () => ST.n, v => { ST.n = Math.round(v); }, v => String(Math.round(v)));
    ctWireChk('vcGrun', v => { ST.run = v; });
  },
  fns(st){ const V = vcCur2(st); return vcPlaneFns(V.P, V.Q); },
  frame(st, dt, ctx, W, H){
    const C = VC_PATHS[st.path];
    const a = C.a === undefined ? 1 : C.a, b = C.b;
    if(st.run){ st.t += dt * (C.t1 - C.t0) * 0.2; if(st.t > C.t1) st.t = C.t0; }
    const F = this.fns(st);
    const pts = ctSample(t => C.f(t, a, b), C.t0, C.t1, 600);
    let mx = 0.8;
    for(const p of pts) mx = Math.max(mx, Math.abs(p.x), Math.abs(p.y));
    const P = ctBox(W, H, 0, 0, mx * 1.28);
    const dens = st.form === 'flux' ? F.div : F.curl;
    const inside = (x, y) => C.inside ? C.inside(x, y, a, b) : false;
    /* the interior, shaded by whichever density the chosen form integrates */
    let dlo = Infinity, dhi = -Infinity;
    for(let i = 0; i <= 50; i++) for(let j = 0; j <= 50; j++){
      const x = P.x0 + (P.x1 - P.x0) * i / 50, y = P.y0 + (P.y1 - P.y0) * j / 50;
      if(!inside(x, y)) continue;
      const v = st.form === 'area' ? 1 : dens(x, y);
      if(Number.isFinite(v)){ dlo = Math.min(dlo, v); dhi = Math.max(dhi, v); }
    }
    /* The interior is built as pixels and blitted, not painted cell by cell:
       one fillRect per interior cell was ~2 200 rasterising calls a frame at
       120x120. The cells were also drawn a pixel oversized on each side, so
       they overlapped and double-composited at alpha 0.55 — the blit tiles
       them exactly, which is what the region's edge should look like. */
    const cells = 120;
    const GB = ctHeatBuf(cells), gd = GB.img.data;
    for(let i = 0; i < cells; i++) for(let j = 0; j < cells; j++){
      const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / cells;
      const y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / cells;
      /* row 0 of an ImageData is the TOP row, while j counts upward from y0 */
      const o = 4 * ((cells - 1 - j) * cells + i);
      /* the buffer is shared, so outside the region must be cleared, not skipped */
      if(!inside(x, y)){ gd[o + 3] = 0; continue; }
      const v = st.form === 'area' ? 1 : dens(x, y);
      const t = (dhi - dlo) < 1e-9 ? 0.5 : (v - dlo) / (dhi - dlo);
      const c = rampDiv(2 * t - 1);
      gd[o] = c[0]; gd[o + 1] = c[1]; gd[o + 2] = c[2]; gd[o + 3] = 255;
    }
    GB.ctx.putImageData(GB.img, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(GB.cv, 0, 0, cells, cells, P.px, P.py, P.pw, P.ph);
    ctx.restore();
    vcArrows(ctx, P, F.P, F.Q, 14, null, 0.55);
    ctGrid(ctx, P, undefined, true);
    /* CANVAS TEXT TAKES NO MARKUP — this drew the characters "<sub>x</sub>"
       across the top of the picture. Unicode has no subscript y, so the
       partials are written out rather than subscripted (rule 2.10). */
    ctFrame(ctx, P, st.form === 'area' ? 'area from the boundary alone'
      : st.form === 'flux' ? '∮ F·n̂ ds  =  ∬ (∂P/∂x + ∂Q/∂y) dA' : '∮ P dx + Q dy  =  ∬ (∂Q/∂x − ∂P/∂y) dA');
    /* the cancelling interior loops */
    const n = st.n, h = (P.x1 - P.x0) / n;
    ctx.strokeStyle = rgbCss(TH.text, 0.3); ctx.lineWidth = 0.8;
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
      const x = P.x0 + h * (i + 0.5), y = P.y0 + h * (j + 0.5);
      if(!inside(x, y)) continue;
      ctx.strokeRect(P.X(x - h / 2), P.Y(y + h / 2), h * P.u, h * P.u);
    }
    ctPath(ctx, P, pts, rgbCss(TH.text, 0.95), 3);
    ctPath(ctx, P, ctSample(t => C.f(t, a, b), C.t0, st.t, 400), rgbCss(TH.grad), 3.6);
    const p = C.f(st.t, a, b), d = C.d(st.t, a, b);
    const sp = Math.hypot(d.x, d.y) || 1;
    if(st.form === 'flux')
      ctArrow(ctx, P, p.x, p.y, p.x + d.y / sp * mx * 0.26, p.y - d.x / sp * mx * 0.26, rgbCss(TH.curl), 2.4, 'n̂');
    else
      ctArrow(ctx, P, p.x, p.y, p.x + d.x / sp * mx * 0.26, p.y + d.y / sp * mx * 0.26, rgbCss(TH.curl), 2.4, 'T̂');
    ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.grad), rgbCss(TH.bg));
    stageNote(ctx, 'colour inside is the density the double integral adds up · the heavy curve is the boundary', W, H);
  },
  readout(st){
    const C = VC_PATHS[st.path];
    const a = C.a === undefined ? 1 : C.a, b = C.b;
    const V = vcCur2(st);
    const F = this.fns(st);
    const rOf = vcRadialBoundary(C, a, b);
    const brk = st.path === 'square' ? [1, 2, 3] : null;
    const circ = brk ? vcLineWorkPiecewise(F.P, F.Q, C, C.t0, C.t1, a, b, brk)
                     : vcLineWork(F.P, F.Q, C, C.t0, C.t1, a, b);
    const dbl = nqDoublePolar((x, y) => F.curl(x, y), 0, 2 * Math.PI, () => 0, rOf, 5, 40);
    const flux = vcLineFlux(F.P, F.Q, C, C.t0, C.t1, a, b);
    const dblDiv = nqDoublePolar((x, y) => F.div(x, y), 0, 2 * Math.PI, () => 0, rOf, 5, 40);
    const areaB = vcAreaByBoundary(C, a, b);
    const areaD = nqDoublePolar(() => 1, 0, 2 * Math.PI, () => 0, rOf, 5, 40);
    return `<div class="card tight"><div class="ttl">Circulation form — both sides</div>
      ${kv('∮ P dx + Q dy', fmtNum(circ, 8))}
      ${kv('∬ (Q<sub>x</sub> − P<sub>y</sub>) dA', fmtNum(dbl, 8))}
      ${kv('difference', fmtAgree(circ, dbl))}
      <p class="help">The line integral is a one-dimensional adaptive quadrature along a parametrised
      curve. The double integral is a two-dimensional Gauss rule in polar coordinates over the region.
      They share no code and no assumptions — the agreement is the theorem.</p>
    </div>
    <div class="card tight"><div class="ttl">Flux form — both sides</div>
      ${kv('∮ F·n̂ ds  =  ∮ P dy − Q dx', fmtNum(flux, 8))}
      ${kv('∬ (P<sub>x</sub> + Q<sub>y</sub>) dA', fmtNum(dblDiv, 8))}
      ${kv('difference', fmtAgree(flux, dblDiv))}
      <p class="help">Apply the circulation form to the rotated field ⟨−Q, P⟩ and the flux form falls out
      immediately. One theorem, two costumes — and it is the two-dimensional ancestor of both Stokes'
      theorem and the divergence theorem, which is why those two look so alike.</p>
    </div>
    <div class="card tight"><div class="ttl">The planimeter</div>
      ${kv('½∮ (x dy − y dx)', fmtNum(areaB, 8))}
      ${kv('∬ 1 dA', fmtNum(areaD, 8))}
      ${kv('difference', fmtAgree(areaB, areaD))}
      <p class="help">The area of the region, computed without ever visiting its interior. Choose the
      cardioid and check against 3πa²/2; choose the square and check against 4a². The same integral, run on
      the vertices of a polygon, is the shoelace formula that every mapping package uses.</p>
    </div>
    <div class="card tight"><div class="ttl">Orientation</div>
      ${kv('sign of the area integral', areaB > 0 ? 'positive — the boundary runs counter-clockwise' : 'negative — clockwise')}
      ${kv('field', V.name)}
      <p class="help">Green's theorem holds for the <b>positive</b> orientation: walk the boundary with the
      region on your left. Reverse it and both sides of the theorem flip sign together, which is consistent
      but a trap if you only reverse one of them. For a region with holes, the inner boundaries must be
      traversed the other way — again so that the region stays on your left.</p>
    </div>`;
  },
  chip(st){
    const C = VC_PATHS[st.path], a = C.a === undefined ? 1 : C.a, b = C.b;
    const F = this.fns(st);
    const circ = st.path === 'square' ? vcLineWorkPiecewise(F.P, F.Q, C, C.t0, C.t1, a, b, [1, 2, 3])
                                      : vcLineWork(F.P, F.Q, C, C.t0, C.t1, a, b);
    const dbl = nqDoublePolar((x, y) => F.curl(x, y), 0, 2 * Math.PI, () => 0, vcRadialBoundary(C, a, b), 5, 30);
    return `<div class="k">Green</div>
      <div style="color:var(--c-grad)">∮ = ${fmtNum(circ, 5)}</div>
      <div style="color:var(--c-warn)">∬ = ${fmtNum(dbl, 5)}</div>`;
  },
  legend(){ return [['var(--text)', 'the boundary C'], ['var(--c-grad)', 'traversed so far'],
                    ['var(--c-curl)', 'T̂ or n̂'], ['var(--c-pos)', 'positive density inside'],
                    ['var(--c-neg)', 'negative density']]; },
  dockLegend:true
};

/* ---- 4 · surface integrals ------------------------------------------------- */
STAGES.vcSurface = {
  title:'Surface integrals',
  derive(st){
    return {
      title:'Measuring how much of a field passes through a surface',
      steps:[
        drvSay('the question, and why area alone is not the answer',
          'How much fluid crosses a surface per second? A field that runs parallel to the surface delivers nothing however strong it is. Only the component along the normal counts, so the answer needs a direction attached to every patch of surface.'),
        drvStep('parametrise the surface with two variables',
          `${dv('r')}(${dv('u')}, ${dv('v')})`,
          `sampled on a ${st.nu} × ${st.nv} grid here`),
        drvStep('the two tangent vectors span each small patch',
          `${dv('r')}_u and ${dv('r')}_v`,
          'partial derivatives — each holds one parameter fixed and moves along the other'),
        drvStep('their cross product is normal, with length equal to the patch area',
          `d${dv('S')} ${dop('=')} |${dv('r')}_u ${dop('×')} ${dv('r')}_v| d${dv('u')} d${dv('v')}`,
          'the vectors wing\'s result: a cross product is perpendicular to both, with the area of the parallelogram as its length'),
        drvSay('one object answering both needs at once',
          'The cross product supplies the direction and the scaling factor together. That is the whole reason it appears here: nothing else produces a perpendicular whose magnitude is the area being swept.'),
        drvStep('flux keeps the direction, so uses the vector element',
          `∬ ${dv('F')} ${dop('·')} d${dv('S')} ${dop('=')} ∬ ${dv('F')} ${dop('·')} (${dv('r')}_u ${dop('×')} ${dv('r')}_v) d${dv('u')} d${dv('v')}`,
          st.kind === 'flux' ? 'the panel computes this and shades the surface by local contribution' : ''),
        drvStep('a scalar surface integral discards it',
          `∬ ${dv('f')} d${dv('S')}`,
          'for mass of a shell, or area when f = 1 — no orientation needed'),
        drvSay('orientation is a genuine choice with a genuine consequence',
          'Swapping r_u and r_v reverses the normal and flips the sign of every flux. For a closed surface the convention is outward, so positive flux means net outflow. The panel lets you flip it, and the sign of every reading changes with it.'),
        drvSay('and some surfaces admit no consistent choice at all',
          'Walk a normal round a Möbius strip and it comes back reversed. Such surfaces are non-orientable, and flux through them is simply undefined — not hard to compute, but meaningless. That is why the divergence and Stokes theorems both carry an orientability hypothesis.')
      ],
      note:'The surface element is computed from the actual cross product at each sample point, so a stretched or curved parametrisation is handled correctly rather than approximated by flat cells. The panel compares the summed area against the closed form for the chosen surface.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.surf = o.surf || 'hemisphere';
    st.fld = o.fld || 'radial';
    st.kind = o.kind || 'flux';
    st.nu = 14; st.nv = 24;
    st.orient = 1;
    R.cam.az = 0.7; R.cam.el = 0.34; ctCamFit(1.9);
  },
  controls(){
    const st = ST, S = VC_SURFACES[st.surf];
    return ctSeg('vcSS', st.surf, Object.keys(VC_SURFACES).map(k => [k, VC_SURFACES[k].name.split('  ')[0]])) +
      ctSeg('vcSK', st.kind, [['area', 'area  ∬ dS'], ['scalar', 'scalar  ∬ f dS'], ['flux', 'flux  ∬ F·dS']]) +
      (st.kind === 'flux' ? pkSeg('vcSF', VC_FIELDS3, st.fld) +
        pkBoxes('vcown3', st.fld, st, VC_OWN3, null, VC_OWN_HELP) : '') +
      ctlRow('mesh in ' + S.ul, ctlSlider('vcSnu', 4, 30, 1, st.nu)) +
      ctlRow('mesh in ' + S.vl, ctlSlider('vcSnv', 4, 40, 1, st.nv)) +
      `<p class="help"><b>${S.name}</b> — ${S.note}</p>
      <p class="help">A parametrised surface is a map <b>r(u,v)</b> from a rectangle into space. Its two
      tangent vectors <b>r<sub>u</sub></b> and <b>r<sub>v</sub></b> span the tangent plane, and their cross
      product is normal to it. The area of the little parallelogram they span is
      <b>|r<sub>u</sub> × r<sub>v</sub>| du dv</b>, which is <b>dS</b> — the exact three-dimensional
      analogue of the Jacobian in the integration wing, and the same object.</p>
      <p class="help">For <b>flux</b> the normal keeps its direction as well as its length:
      <b>dS = (r<sub>u</sub> × r<sub>v</sub>) du dv</b>, and <b>∬F·dS</b> measures how much of the field
      passes through. The sign depends on which way the normal points, which is a choice — orientation —
      and not a fact about the surface. A Möbius band has no consistent choice at all, which is exactly why
      flux through it is undefined.</p>`;
  },
  wire(){
    /* the torus is far bigger than the unit surfaces, so the camera has to move
       with the choice or it fills a tenth of the canvas */
    ctWireSeg('vcSS', v => { ST.surf = v; ctCamFit(v === 'torus' ? 3.2 : 1.9); });
    ctWireSeg('vcSK', v => { ST.kind = v; });
    pkWire('vcSF', 'vcown3', ST.fld, ST, VC_OWN3, null, v => { ST.fld = v; });
    wireSlider('vcSnu', () => ST.nu, v => { ST.nu = Math.round(v); }, v => String(Math.round(v)));
    wireSlider('vcSnv', () => ST.nv, v => { ST.nv = Math.round(v); }, v => String(Math.round(v)));
  },
  field(st){ const V = vcCur3(st); return vcField3(V.P, V.Q, V.R); },
  frame(st, dt, ctx, W, H){
    const S = VC_SURFACES[st.surf];
    const fld = st.kind === 'flux' ? this.field(st) : null;
    const ext = st.surf === 'torus' ? 3.2 : 1.9;
    R.mode2d = false; R.extent = ext; R.begin();
    em3dAxes(ext * 0.72);
    const nu = st.nu, nv = st.nv;
    /* the mesh, each patch coloured by whatever the integral is weighting it by */
    let mx = 1e-9;
    const patches = [];
    for(let i = 0; i < nu; i++) for(let j = 0; j < nv; j++){
      const u0 = S.u0 + (S.u1 - S.u0) * i / nu, u1 = S.u0 + (S.u1 - S.u0) * (i + 1) / nu;
      const v0 = S.v0 + (S.v1 - S.v0) * j / nv, v1 = S.v0 + (S.v1 - S.v0) * (j + 1) / nv;
      const fr = vcSurfFrame(S, (u0 + u1) / 2, (v0 + v1) / 2);
      let w;
      if(st.kind === 'area') w = fr.dS;
      else if(st.kind === 'scalar') w = Math.abs(fr.p.z) + 0.4;
      else w = vdot(fld.F(fr.p.x, fr.p.y, fr.p.z), fr.nh);
      patches.push({ u0, u1, v0, v1, fr, w });
      mx = Math.max(mx, Math.abs(w));
    }
    for(const q of patches){
      const c = [S.r(q.u0, q.v0), S.r(q.u1, q.v0), S.r(q.u1, q.v1), S.r(q.u0, q.v1)];
      const t = q.w / mx;
      const col = st.kind === 'flux' ? rgbCss(rampDiv(t), 0.9) : rgbCss(rampSeq(Math.abs(t)), 0.9);
      R.poly(c, col, rgbCss(TH.bg, 0.45), 0.5, 0.92);
    }
    /* the tangent frame at one point, and the normal it produces */
    const um = (S.u0 + S.u1) * 0.42, vm = (S.v0 + S.v1) * 0.33;
    const fr = vcSurfFrame(S, um, vm);
    const sc = 0.55;
    R.arrow(fr.p, vmul(vnorm(fr.ru), sc), rgbCss(TH.grad), 2.6, 1);
    R.arrow(fr.p, vmul(vnorm(fr.rv), sc), rgbCss(TH.pos), 2.6, 1);
    R.arrow(fr.p, vmul(fr.nh, sc * 1.15), rgbCss(TH.curl), 2.8, 1);
    R.label(vadd(fr.p, vmul(vnorm(fr.ru), sc * 1.3)), 'r_' + S.ul, rgbCss(TH.grad), 0, 0, '700 11px ' + FONT_UI);
    R.label(vadd(fr.p, vmul(vnorm(fr.rv), sc * 1.3)), 'r_' + S.vl, rgbCss(TH.pos), 0, 0, '700 11px ' + FONT_UI);
    R.label(vadd(fr.p, vmul(fr.nh, sc * 1.4)), 'n', rgbCss(TH.curl), 0, 0, '700 11px ' + FONT_UI);
    /* the field itself, sampled sparsely, when it is flux we are after */
    if(fld){
      for(let i = 0; i < 6; i++) for(let j = 0; j < 8; j++){
        const u = S.u0 + (S.u1 - S.u0) * (i + 0.5) / 6, v = S.v0 + (S.v1 - S.v0) * (j + 0.5) / 8;
        const q = vcSurfFrame(S, u, v);
        const f = fld.F(q.p.x, q.p.y, q.p.z);
        const L = vlen(f) || 1;
        R.arrow(q.p, vmul(f, 0.42 / L), rgbCss(TH.text, 0.55), 1.3, 0.7);
      }
    }
    R.flush();
    em3dCaption(ctx, W, H,
      st.kind === 'area' ? 'dS = |r_u × r_v| du dv' : st.kind === 'scalar' ? '∬ f dS' : '∬ F·dS — colour is F·n̂',
      `${nu} × ${nv} patches · boundary: ${S.boundary}`);
  },
  readout(st){
    const S = VC_SURFACES[st.surf];
    const area = vcSurfArea(S);
    const scal = vcSurfScalar(S, (x, y, z) => Math.abs(z) + 0.4);
    const fld = this.field(st);
    const flux = vcSurfFlux(S, fld.F, 1);
    const fluxRev = vcSurfFlux(S, fld.F, -1);
    /* the mesh sum, at the resolution drawn, so the picture and the number match */
    let meshA = 0;
    for(let i = 0; i < st.nu; i++) for(let j = 0; j < st.nv; j++){
      const u = S.u0 + (S.u1 - S.u0) * (i + 0.5) / st.nu, v = S.v0 + (S.v1 - S.v0) * (j + 0.5) / st.nv;
      meshA += vcSurfFrame(S, u, v).dS * (S.u1 - S.u0) / st.nu * (S.v1 - S.v0) / st.nv;
    }
    const fr = vcSurfFrame(S, (S.u0 + S.u1) * 0.42, (S.v0 + S.v1) * 0.33);
    return `<div class="card tight"><div class="ttl">The surface, and its area</div>
      ${kv('parameters', `${S.ul} ∈ [${fmtNum(S.u0, 3)}, ${fmtNum(S.u1, 3)}],  ${S.vl} ∈ [${fmtNum(S.v0, 3)}, ${fmtNum(S.v1, 3)}]`)}
      ${kv('∬ |r_u × r_v| du dv', fmtNum(area, 8))}
      ${kv('the known area', fmtNum(S.exactArea, 8))}
      ${kv('difference', fmtAgree(area, S.exactArea))}
      ${kv(`the ${st.nu} × ${st.nv} mesh sum`, fmtNum(meshA, 7))}
      ${kv('boundary', S.boundary)}
    </div>
    <div class="card tight"><div class="ttl">The frame at one point</div>
      ${kv('r(u, v)', ctVec3f(fr.p))}
      ${kv('r_' + S.ul, ctVec3f(fr.ru))}
      ${kv('r_' + S.vl, ctVec3f(fr.rv))}
      ${kv('r_u × r_v', ctVec3f(fr.n))}
      ${kv('|r_u × r_v|  = dS/du dv', fmtNum(fr.dS, 6))}
      ${kv('n̂', ctVec3f(fr.nh))}
      ${kv('n̂ · r_u', fmtNum(vdot(fr.nh, fr.ru), 4))}
      ${kv('n̂ · r_v', fmtNum(vdot(fr.nh, fr.rv), 4))}
      <p class="help">The last two rows are zero: the normal is perpendicular to both tangents, which is
      what a cross product is for. Everything about a surface integral follows from the fact that the
      little patch is a parallelogram spanned by these two vectors.</p>
    </div>
    <div class="card tight"><div class="ttl">Scalar and vector integrals</div>
      ${kv('∬ f dS  with f = |z| + 0.4', fmtNum(scal, 7))}
      ${kv('average of f over the surface', fmtNum(scal / area, 7))}
      ${kv('field', vcCur3(st).name)}
      ${kv('∬ F·dS  (outward)', fmtNum(flux, 7))}
      ${kv('with the opposite orientation', fmtNum(fluxRev, 7))}
      ${/* Keyed on having a volume integral, not on S.closed: the torus is closed
            too, and there is no ∭ over its interior here, so keying this on the
            flag put a literal NaN in the row the moment the flag was corrected. */
        st.surf === 'sphere' ? kv('∭ ∇·F dV inside', fmtNum(vcBallDivIntegral(fld, 1), 7)) : ''}
      <p class="help">${vcCur3(st).note}</p>
      <p class="help">A scalar surface integral does not care about orientation — dS is an area. A flux
      integral does, and reversing the normal negates it exactly. This is why "the flux through a surface"
      is only meaningful once you have said which side is out.</p>
    </div>`;
  },
  chip(st){
    const S = VC_SURFACES[st.surf];
    const v = st.kind === 'area' ? vcSurfArea(S)
      : st.kind === 'scalar' ? vcSurfScalar(S, (x, y, z) => Math.abs(z) + 0.4)
      : vcSurfFlux(S, this.field(st).F, 1);
    return `<div class="k">${st.kind === 'area' ? '∬ dS' : st.kind === 'scalar' ? '∬ f dS' : '∬ F·dS'}</div>
      <div style="color:var(--c-grad)">${fmtNum(v, 6)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'r_u'], ['var(--c-pos)', 'r_v'], ['var(--c-curl)', 'the normal n̂'],
                    ['var(--c-neg)', 'flux entering'], ['var(--c-warn)', 'flux leaving']]; }
};

/* ---- 5 · Stokes' theorem --------------------------------------------------- */
