/* ============================================================================
   5g · THE CHANGE-OF-VARIABLES THEOREM, AND THE SOLIDS
   Wing C4, stages 2 and 3.

     csArea    three routes to the area of the image, which agree exactly when
               the theorem's hypothesis holds and disagree instructively when
               it does not
     csSolid   the same solid integrated in two or three coordinate systems,
               each held to its own measured error

   Engines: 25a-coords.js, 25b-coords-3d.js.
   ============================================================================ */

/* ---- 2 · the theorem, and its hypothesis ---------------------------------- */
STAGES.csArea = {
  title:'Change of variables, three ways',
  enter(st, o){
    st.mkey = o.mkey || 'polar';
    st.show = Object.assign({ grid:true, boundary:true }, o.show || {});
  },
  controls(){
    const st = ST;
    return pkSeg('csAK', CS_MAPS, st.mkey, e => e.short) +
      pkBoxes('csM', st.mkey, st, CS_SLOTS, CS_BOUNDS,
              'Two expressions in <b>u</b> and <b>v</b>. Try a map that folds — ' +
              '<b>u^2</b> and <b>v</b> on u from −1 to 1 — and watch the three routes come apart.') +
      `<div class="row wrap">${ctChk('csAG', 'the coordinate grid', st.show.grid)}
        ${ctChk('csAB', 'the image of the boundary', st.show.boundary)}</div>
      <p class="help">The theorem says <b>∬<sub>image</sub> dA = ∬<sub>rectangle</sub> |J| du dv</b>,
      provided the map is one-to-one. The panel does not take that on trust: it computes the
      right-hand side by quadrature, the left-hand side twice — once by Green's theorem round the
      image of the boundary, once by inverting the map over a grid of points and asking which came
      from inside the rectangle — and prints all three.</p>
      <p class="help">On a one-to-one map the three agree to their own accuracies. On a map that
      folds they give three <i>different</i> right answers, because they are answers to three
      different questions: how much area the map paints (counting overlaps), how much the boundary
      encloses (counting orientation), and how much ground the image actually covers.</p>`;
  },
  wire(){
    pkWire('csAK', 'csM', ST.mkey, ST, CS_SLOTS, CS_BOUNDS,
           v => { ST.mkey = v; ST._cs = null; }, () => { ST._cs = null; });
    ctWireChk('csAG', v => { ST.show.grid = v; });
    ctWireChk('csAB', v => { ST.show.boundary = v; });
  },
  frame(st, dt, ctx, W, H){
    const C = csCur(st), M = csMapBuild(C.xs, C.ys);
    const P0 = mkPlot(40, 50, W - 80, H - 130, -1, 1, -1, 1);
    if(!M.ok){
      plotFrame(ctx, P0, 'x', 'y', 'no map');
      ctText(ctx, 60, 90, M.why, rgbCss(TH.neg), '600 12px ' + FONT_UI);
      return;
    }
    const B = csImageBox(M, C.u0, C.u1, C.v0, C.v1, 40) || { x0:-1, x1:1, y0:-1, y1:1 };
    const s = Math.max(B.x1 - B.x0, B.y1 - B.y0) / 2;
    const cx0 = (B.x0 + B.x1) / 2, cy0 = (B.y0 + B.y1) / 2;
    const side = Math.min(W - 80, H - 130);
    const P = mkPlot(40 + (W - 80 - side) / 2, 50, side, side,
                     cx0 - 1.1 * s, cx0 + 1.1 * s, cy0 - 1.1 * s, cy0 + 1.1 * s);
    plotFrame(ctx, P, 'x', 'y', 'the image of the rectangle');
    ctGrid(ctx, P);
    if(st.show.grid){
      const NL = 13, NP = 130;
      for(let i = 0; i <= NL; i++){
        const uu = C.u0 + (C.u1 - C.u0) * i / NL, vv = C.v0 + (C.v1 - C.v0) * i / NL;
        ctParam(ctx, P, t => M.T(uu, C.v0 + (C.v1 - C.v0) * t), 0, 1, NP, rgbCss(TH.grad, 0.35), 1);
        ctParam(ctx, P, t => M.T(C.u0 + (C.u1 - C.u0) * t, vv), 0, 1, NP, rgbCss(TH.curl, 0.35), 1);
      }
    }
    if(st.show.boundary){
      /* the four edges, in the order Green's theorem walks them, with arrows so
         a boundary that doubles back is visible as doubling back */
      const edges = [
        t => M.T(C.u0 + (C.u1 - C.u0) * t, C.v0),
        t => M.T(C.u1, C.v0 + (C.v1 - C.v0) * t),
        t => M.T(C.u1 - (C.u1 - C.u0) * t, C.v1),
        t => M.T(C.u0, C.v1 - (C.v1 - C.v0) * t)
      ];
      const cols = [TH.pos, TH.warn, TH.neg, TH.accent];
      edges.forEach((e, k) => {
        ctParam(ctx, P, e, 0, 1, 200, rgbCss(cols[k]), 2.4);
        const a = e(0.45), b = e(0.55);
        ctArrow(ctx, P, a.x, a.y, b.x, b.y, rgbCss(cols[k]), 2.2);
      });
    }
    const R = csMeasured(st, 96);
    ctText(ctx, 40, H - 62,
           '∬|J| du dv = ' + fmtSig(R.pull, 6) +
           '   ·   ∮x dy round the boundary = ' + fmtSig(R.green, 6) +
           '   ·   the ground actually covered = ' + fmtSig(R.grid, 4),
           rgbCss(TH.dim), '11px ' + FONT_UI);
    ctText(ctx, 40, H - 44,
           Math.abs(R.cover - 1) < 0.06
             ? 'the three agree: this map covers its image exactly once'
             : 'they do NOT agree — this map covers its image ' + fmtSig(R.cover, 3) +
               ' times over, so the theorem does not apply',
           Math.abs(R.cover - 1) < 0.06 ? rgbCss(TH.pos) : rgbCss(TH.warn),
           '600 11px ' + FONT_UI);
    ctText(ctx, 40, H - 26,
           'the four coloured arcs are the four edges of the rectangle, arrowed in the order Green’s theorem walks them',
           rgbCss(TH.dim), '11px ' + FONT_UI);
    stageNote(ctx, 'one-to-one is the hypothesis, and it is the whole hypothesis', W, H);
  },
  derive(st){
    const R = csMeasured(st, 96), C = R.C;
    return {
      title:'The theorem, its hypothesis, and what happens without it',
      steps:[
        drvStep('the statement',
          `∬${dop('_')}${dfn('image')} ${dv('f')} ${dop('d')}${dv('A')} ${dop('=')} ∬${dop('_')}${dfn('rectangle')} ${dv('f')}(${dv('T')}(${dv('u')},${dv('v')})) |${dv('J')}| ${dop('d')}${dv('u')} ${dop('d')}${dv('v')}`,
          'with f = 1 this says the image and ∬|J| have the same area'),
        drvSay('why it is true, in one sentence',
          'Chop the rectangle into cells so small that the map is linear on each. A linear map multiplies area by |det|, so each cell contributes its own area times |J| there. Add them up, and the sum on the left is the area of the image while the sum on the right is ∬|J|. The whole proof is the linear-algebra fact plus a limit, and the limit is where the hypothesis enters.'),
        drvStep('route A — the right-hand side, by quadrature',
          `∬ |${dv('J')}| ${dop('d')}${dv('u')} ${dop('d')}${dv('v')}`,
          fmtSig(R.pull, 8)),
        drvStep('route B — the left-hand side, by Green’s theorem on the boundary',
          `∮ ${dv('x')} ${dop('d')}${dv('y')}`,
          fmtSig(R.green, 8) + ' — no Jacobian appears anywhere in this route'),
        drvStep('route C — the left-hand side again, by asking which points came from the rectangle',
          `${dfn('count the grid cells whose preimage lies in')} [${dv('u')}₀,${dv('u')}₁]×[${dv('v')}₀,${dv('v')}₁]`,
          fmtSig(R.grid, 6) + ', its own error ' + fmtSig(R.gridSelf, 3) +
          ' — measured by halving the cell, not assumed'),
        Math.abs(R.cover - 1) < 0.06
          ? drvSay('all three agree, so the hypothesis held',
              'The map covers its image once. The three routes then compute the same number by arguments with nothing in common — a quadrature in (u, v), a contour integral in (x, y), and a membership test — and agreeing to their own accuracies is evidence rather than arithmetic repeated.')
          : drvSay('they disagree, and each is right about a different question',
              'This map is not one-to-one, so the theorem does not apply and the three routes separate. ∬|J| counts the area the map <em>paints</em>, overlaps included, so it comes out too large by the covering number. Green’s theorem counts what the boundary <em>encloses</em> with orientation, so a boundary that doubles back cancels itself. The grid counts the ground actually <em>covered</em>. All three are correct; only the first two were ever claimed to be equal, and only under a hypothesis that has failed here.'),
        drvSay('the exceptions that do not matter, and why',
          'Polar coordinates on a disc are not one-to-one either: the whole edge r = 0 goes to a single point and θ = 0 and θ = 2π name the same ray. Those failures happen on a set of <b>zero area</b>, and the theorem tolerates that — an integral cannot see a set of zero area. The fold is different in kind: it fails on a set of full measure, and no amount of tolerance rescues it. Switch between the disc and the fold and compare the covering number the panel measures.')
      ],
      note:'“One-to-one” is not a technicality attached to the theorem. It is the theorem.'
    };
  },
  readout(st){
    const R = csMeasured(st, 96), C = R.C;
    if(!R.ok) return `<div class="card tight"><div class="ttl">The map</div>
      <p class="help" style="color:var(--c-neg)">${esc(R.why)}</p></div>`;
    const one = Math.abs(R.cover - 1) < 0.06;
    return `<div class="card tight"><div class="ttl">${esc(C.name)}</div>
      ${kv('the rectangle', 'u ∈ [' + fmtNum(C.u0, 4) + ', ' + fmtNum(C.u1, 4) + '],  v ∈ [' +
           fmtNum(C.v0, 4) + ', ' + fmtNum(C.v1, 4) + ']')}
      ${kv('A · ∬|J| du dv', fmtSig(R.pull, 9))}
      ${kv('B · ∮x dy round the image of the boundary', fmtSig(R.green, 9))}
      ${kv('A against B', fmtGap(Math.abs(Math.abs(R.green) - R.pull), Math.max(1e-12, R.pull)))}
      ${kv('C · the ground actually covered', fmtSig(R.grid, 6) + '  ± ' + fmtSig(R.gridSelf, 2))}
      ${kv('A against C', fmtGap(Math.abs(R.grid - R.pull), Math.max(1e-12, R.pull)))}
      ${C.area === null || C.area === undefined ? '' :
        kv('and the closed form for this image', fmtSig(C.area, 9))}
    </div>
    <div class="card tight"><div class="ttl">Does the theorem apply?</div>
      ${kv('how many times the image is covered', fmtSig(R.cover, 5))}
      ${kv('verdict', one
        ? 'once — the hypothesis holds and all three routes agree'
        : 'more than once — the map folds, and A is too large by exactly that factor')}
      ${kv('does |J| vanish anywhere?', C.degenerate === null
        ? 'measured from your own map'
        : (C.degenerate ? 'yes — on a set of zero area, which the theorem tolerates' : 'no'))}
      <p class="help">The covering number is <b>measured</b>, as the ratio of A to C, rather than
      read off a label. That is the only way it could catch a map you typed yourself.</p>
      <p class="help">${C.why}</p>
    </div>`;
  },
  chip(st){
    const R = csMeasured(st, 96);
    if(!R.ok) return `<div class="k">the map</div><div style="color:var(--c-neg)">does not build</div>`;
    const one = Math.abs(R.cover - 1) < 0.06;
    return `<div class="k">∬|J| du dv</div>
      <div style="color:var(--c-warn)">${fmtSig(R.pull, 5)}</div>
      <div style="color:${one ? 'var(--c-pos)' : 'var(--c-neg)'}">${one ? 'covers once' : 'covers ' + fmtSig(R.cover, 3) + '×'}</div>`;
  },
  legend(st){
    const L = [];
    if(st.show.grid) L.push(['var(--c-grad)', 'u = constant'], ['var(--c-curl)', 'v = constant']);
    if(st.show.boundary) L.push(['var(--c-pos)', 'edge 1 — v at its lower end'],
                                ['var(--c-warn)', 'edge 2 — u at its upper end'],
                                ['var(--c-neg)', 'edge 3 — v at its upper end'],
                                ['var(--c-accent)', 'edge 4 — u at its lower end']);
    return L;
  },
  dockLegend:true
};

/* ---- 3 · the same solid, in two or three systems -------------------------- */
STAGES.csSolid = {
  title:'One solid, three coordinate systems',
  enter(st, o){
    st.skey = o.skey || 'ball';
    st.cellR = o.cellR === undefined ? 0.6 : o.cellR;
    st.cellP = o.cellP === undefined ? 1.0 : o.cellP;
    st.show = Object.assign({ cell:true }, o.show || {});
  },
  sol(st){
    const P = Object.assign({}, CS_SOLIDS[st.skey] || CS_SOLIDS.ball);
    return P;
  },
  meas(st){
    if(st._sm && st._sm.key === st.skey) return st._sm;
    const M = csSolidMeasure(st.skey);
    M.key = st.skey;
    st._sm = M;
    return M;
  },
  controls(){
    const st = ST;
    return ctlRow('the solid', ctSeg('csSK', st.skey,
        Object.keys(CS_SOLIDS).map(k => [k, CS_SOLIDS[k].short]))) +
      ctlRow('where the cell sits — ρ', ctlSlider('csSR', 0.15, 1, 0.01, st.cellR)) +
      ctlRow('and φ, from the axis', ctlSlider('csSP', 0.12, Math.PI - 0.12, 0.01, st.cellP)) +
      ctChk('csSC', 'show the volume element there', st.show.cell) +
      `<p class="help">The picture is a cross-section through the axis: everything you see is
      revolved about the vertical line to make the solid. The panel integrates that solid in every
      coordinate system it can honestly be described in, and holds each route to <b>its own</b>
      error — measured by refining it, not chosen.</p>
      <p class="help">The shaded wedge is one cell of the spherical grid. Its volume is
      ρ²sin φ dρ dφ dθ, which is why a cell near the axis is nearly flat and a cell near the origin
      is nearly nothing — and why the ρ² means most of a shell's material sits in its outer part.</p>`;
  },
  wire(){
    ctWireSeg('csSK', v => { ST.skey = v; ST._sm = null; });
    wireSlider('csSR', () => ST.cellR, v => { ST.cellR = v; }, v => fmtNum(+v, 3));
    wireSlider('csSP', () => ST.cellP, v => { ST.cellP = v; }, v => ctDeg(+v));
    ctWireChk('csSC', v => { ST.show.cell = v; });
  },
  frame(st, dt, ctx, W, H){
    const P = this.sol(st), key = st.skey;
    const R = P.R;
    const side = Math.min((W - 90) * 0.42, H - 150);
    const PL = mkPlot(40, 50, side, side, -1.35 * R, 1.35 * R, -1.35 * R, 1.35 * R);
    plotFrame(ctx, PL, 'r  (distance from the axis)', 'z', 'a cross-section, revolved about the axis');
    ctGrid(ctx, PL);
    ctPath(ctx, PL, [{ x:0, y:-1.35 * R }, { x:0, y:1.35 * R }], rgbCss(TH.faint), 1.4, [5, 5]);
    /* the outline of the solid in the (r, z) half-plane, mirrored for the picture */
    const out = [];
    const N = 220;
    const zTop = r => {
      switch(key){
        case 'ball':     return Math.sqrt(Math.max(0, R * R - r * r));
        case 'cylinder': return r <= R ? P.H : NaN;
        case 'cone':     return r <= R ? P.H * (1 - r / R) : NaN;
        case 'cap':      return Math.sqrt(Math.max(0, R * R - r * r));
        case 'shell':    return Math.sqrt(Math.max(0, R * R - r * r));
        case 'ice':      return Math.sqrt(Math.max(0, R * R - r * r));
      }
      return NaN;
    };
    const zBot = r => {
      switch(key){
        case 'ball':     return -Math.sqrt(Math.max(0, R * R - r * r));
        case 'cylinder': return 0;
        case 'cone':     return 0;
        case 'cap':      return P.a;
        case 'shell':    return r <= P.a ? Math.sqrt(Math.max(0, P.a * P.a - r * r))
                                         : -Math.sqrt(Math.max(0, R * R - r * r));
        case 'ice':      return r / Math.tan(P.phi);
      }
      return NaN;
    };
    const rMax = key === 'ice' ? R * Math.sin(P.phi) : (key === 'cap'
      ? Math.sqrt(Math.max(0, R * R - P.a * P.a)) : R);
    for(let i = 0; i <= N; i++){
      const r = rMax * i / N, zt = zTop(r);
      if(Number.isFinite(zt)) out.push({ x:r, y:zt });
    }
    for(let i = N; i >= 0; i--){
      const r = rMax * i / N, zb = zBot(r);
      if(Number.isFinite(zb)) out.push({ x:r, y:zb });
    }
    if(out.length){
      const mirror = out.map(p => ({ x:-p.x, y:p.y })).reverse();
      ctFill(ctx, PL, out.concat(mirror), rgbCss(TH.grad, 0.22));
      ctPath(ctx, PL, out.concat(mirror).concat([out[0]]), rgbCss(TH.grad), 2);
    }
    /* one cell of the spherical grid, drawn where the sliders put it */
    if(st.show.cell){
      const rho = st.cellR * R, ph = st.cellP;
      const dR = 0.16 * R, dP = 0.22;
      const wedge = [];
      for(let i = 0; i <= 20; i++){
        const a = ph - dP / 2 + dP * i / 20;
        wedge.push({ x:rho * Math.sin(a), y:rho * Math.cos(a) });
      }
      for(let i = 20; i >= 0; i--){
        const a = ph - dP / 2 + dP * i / 20;
        wedge.push({ x:(rho - dR) * Math.sin(a), y:(rho - dR) * Math.cos(a) });
      }
      ctFill(ctx, PL, wedge, rgbCss(TH.warn, 0.45));
      ctPath(ctx, PL, wedge.concat([wedge[0]]), rgbCss(TH.warn), 2);
      const el = csElementSph(rho, ph);
      ctText(ctx, PL.X(rho * Math.sin(ph)) + 10, PL.Y(rho * Math.cos(ph)),
             'ρ²sin φ = ' + fmtSig(el.j, 4), rgbCss(TH.warn), '600 11px ' + FONT_MONO);
    }

    /* the element itself, as a curve — the sine hump that vanishes at both
       poles, and the ρ² that makes an outer shell hold more than an inner one */
    const el = csElementSph(st.cellR * R, st.cellP);
    const rho0 = st.cellR * R;
    const pw2 = Math.max(200, W - side - 130);
    /* two stacked plots, with room between them for the upper one's tick labels
       and axis title — 18 px was not enough and the lower plot's title landed
       on top of them. Each window is fitted to the curve IT draws: the second
       one plots ρ²sin φ at a fixed φ, so scaling it to R² put the whole curve
       in the bottom eighth whenever φ was near a pole. */
    const ph2 = Math.max(90, (H - 214) / 2);
    const PE = mkPlot(80 + side, 58, pw2, ph2, 0, Math.PI, 0,
                      Math.max(1e-9, 1.15 * rho0 * rho0));
    plotFrame(ctx, PE, 'φ, from the axis', null, 'ρ²sin φ against φ, at this ρ');
    plotTicksX(ctx, PE, [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI],
               v => (Math.abs(v) < 1e-9 ? '0' : fmtNum(v / Math.PI, 2) + 'π'));
    plotCurve(ctx, PE, p => rho0 * rho0 * Math.sin(p), 260, rgbCss(TH.warn), 2.4);
    ctDot(ctx, PE, st.cellP, el.j, 5, rgbCss(TH.warn), rgbCss(TH.bg));
    ctText(ctx, PE.px + 8, PE.py + 14, 'zero on both poles — every θ is the same point there',
           rgbCss(TH.faint), '10.5px ' + FONT_UI);

    const top2 = 58 + ph2 + 54;
    const PR2 = mkPlot(80 + side, top2, pw2, ph2, 0, R, 0,
                       Math.max(1e-9, 1.15 * R * R * Math.sin(st.cellP)));
    plotFrame(ctx, PR2, 'ρ', null, 'and against ρ, at this φ — the ρ² that fills a shell');
    plotCurve(ctx, PR2, rho => rho * rho * Math.sin(st.cellP), 260, rgbCss(TH.pos), 2.4);
    ctDot(ctx, PR2, rho0, el.j, 5, rgbCss(TH.pos), rgbCss(TH.bg));

    /* one line, not a table: the readout below already lists every route with
       its own error, and a canvas copy of it would be a second place to keep
       the same numbers correct */
    const M = this.meas(st);
    ctText(ctx, 40, H - 46,
           'V = ' + fmtSig(M.declared, 8) + '  ·  by ' + M.routes.length +
           ' coordinate system' + (M.routes.length === 1 ? '' : 's') + ' (' +
           M.routes.map(r => r.name).join(', ') + ')  ·  widest disagreement ' +
           fmtSig(M.spread, 3),
           rgbCss(TH.dim), '11px ' + FONT_UI);
    ctText(ctx, 40, H - 28,
           'each route is held to the error it measures for ITSELF, by refining it — the panel below prints all of them',
           rgbCss(TH.faint), '11px ' + FONT_UI);
    stageNote(ctx, 'the volume element is the Jacobian of the coordinate map, one dimension up', W, H);
  },
  derive(st){
    const M = this.meas(st), P = M.P;
    const el = csElementSph(st.cellR * P.R, st.cellP);
    const cyl = csElementCyl(st.cellR * P.R * Math.sin(st.cellP));
    return {
      title:'Where r and ρ²sin φ come from',
      steps:[
        drvStep('cylindrical coordinates are a map from three variables to three',
          `${dv('x')} ${dop('=')} ${dv('r')} ${dfn('cos')} θ,  ${dv('y')} ${dop('=')} ${dv('r')} ${dfn('sin')} θ,  ${dv('z')} ${dop('=')} ${dv('z')}`,
          'its 3×3 Jacobian determinant is r — the same calculation as the plane case with a 1 in the corner'),
        drvStep('spherical coordinates likewise',
          `${dv('x')} ${dop('=')} ρ ${dfn('sin')} φ ${dfn('cos')} θ,  ${dv('y')} ${dop('=')} ρ ${dfn('sin')} φ ${dfn('sin')} θ,  ${dv('z')} ${dop('=')} ρ ${dfn('cos')} φ`,
          'determinant ρ²sin φ, which is ' + fmtSig(el.j, 6) + ' where the sliders are'),
        drvSay('and the scale factors say the same thing without a determinant',
          'Both systems are orthogonal, so the volume element is just the product of the three scale factors — how much length one unit of each coordinate buys. For spherical those are 1, ρ and ρ sin φ: moving one unit in ρ moves one unit of length; one radian of φ moves ρ; one radian of θ moves only ρ sin φ, because you are going round a circle of that radius. Multiply them and ρ²sin φ falls out.'),
        drvStep('the same box, measured rather than quoted',
          `${dfn('volume of the mapped box')} ${dop('/')} ${dv('h')}³`,
          fmtSig(csCellVolSph(st.cellR * P.R, st.cellP, 0.4, 1e-3) / 1e-9, 6) +
          ' against ' + fmtSig(el.j, 6)),
        drvSay('which is why the element vanishes where it does',
          'On the axis sin φ = 0 and a cell of any angular width in θ has no width at all — every value of θ names the same point there. At the origin ρ² = 0 for the same kind of reason. Neither is a defect in the coordinates; both are the coordinates telling you that they have become degenerate, on a set of zero volume that no integral can see.'),
        drvStep('and the solid, integrated in every system it fits',
          `${M.routes.map(r => r.name).join(',  ')}`,
          M.routes.map(r => fmtSig(r.value, 8)).join(',  ') +
          '  — closed form ' + fmtSig(M.declared, 8)),
        drvSay('the routes do not converge equally well, and that is the practical point',
          'A ball in spherical coordinates has three constant limits and comes out exact to round-off. The same ball in Cartesian coordinates is bounded by two nested square roots whose derivatives are infinite at the edge, and Gauss on a fixed grid cannot fix that — the error is thousands of times larger. Choosing coordinates is not a matter of taste; it is the difference between an exact answer and a slowly converging one.')
      ],
      note:'Each route is held to the error it measures for itself, by refining it. None shares a tolerance with another.'
    };
  },
  readout(st){
    const M = this.meas(st), P = M.P;
    const rows = M.routes.map(r => kv(r.name,
      fmtSig(r.value, 9) + '   ± ' + fmtSig(r.self, 2))).join('');
    const el = csElementSph(st.cellR * P.R, st.cellP);
    const box = csCellVolSph(st.cellR * P.R, st.cellP, 0.4, 1e-3) / 1e-9;
    return `<div class="card tight"><div class="ttl">${esc(CS_SOLIDS[st.skey].name)}</div>
      ${kv('closed form ' + CS_SOLIDS[st.skey].volTex, fmtSig(M.declared, 9))}
      ${rows}
      ${kv('worst disagreement with the closed form', fmtGap(M.worst, M.gross))}
      ${kv('and between the routes themselves', fmtGap(M.spread, M.gross))}
      <p class="help">Every route's ± is its <b>own</b> error, obtained by running it again with more
      panels and taking the difference. That is why a route that converges slowly is reported as
      slow rather than as wrong.</p>
    </div>
    <div class="card tight"><div class="ttl">The volume element where the sliders are</div>
      ${kv('ρ', fmtNum(st.cellR * P.R, 5))}
      ${kv('φ, from the axis', ctDeg(st.cellP))}
      ${kv('ρ² sin φ', fmtSig(el.j, 8))}
      ${kv('the three scale factors', '1,  ' + fmtNum(el.hs[1], 5) + ',  ' + fmtNum(el.hs[2], 5))}
      ${kv('their product', fmtSig(el.hs[0] * el.hs[1] * el.hs[2], 8))}
      ${kv('a small box, measured', fmtSig(box, 8))}
      ${kv('against the formula', fmtGap(Math.abs(box - el.j), Math.max(1e-12, el.j)))}
      <p class="help">${CS_SOLIDS[st.skey].why}</p>
    </div>`;
  },
  chip(st){
    const M = this.meas(st);
    return `<div class="k">${esc(CS_SOLIDS[st.skey].short)}</div>
      <div style="color:var(--c-pos)">V = ${fmtSig(M.declared, 5)}</div>
      <div style="color:var(--c-dim)">${M.routes.length} routes</div>`;
  },
  legend(st){
    const L = [['var(--c-grad)', 'the solid, in cross-section']];
    if(st.show.cell) L.push(['var(--c-warn)', 'one cell of the spherical grid']);
    return L;
  },
  dockLegend:true
};
