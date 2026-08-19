/* ============================================================================
   5f · COORDINATE SYSTEMS AND JACOBIANS
   Wing C4. Three stages, three questions:

     csGrid    what a coordinate map DOES to the plane, and what |J| measures
     csArea    the change-of-variables theorem, by three routes that disagree
               exactly when its hypothesis fails
     csSolid   the same solid integrated in two or three coordinate systems

   Engines: 25a-coords.js and 25b-coords-3d.js. Nothing here computes.
   ============================================================================ */

/* the two boxes this wing types into: x(u,v) and y(u,v) */
const csBuildX = s => {
  const M = csMapBuild(s, 'v');
  if(!M.ok) throw new Error(M.why);
  return { f:() => 0, src:s };
};
const CS_SLOTS = [
  { k:'xs', label:'x(u, v)', def:'u*cos(v)', vars:'in u and v',
    audit:'u + 0.3*v^2', build:csBuildX },
  { k:'ys', label:'y(u, v)', def:'u*sin(v)', vars:'in u and v',
    audit:'0.8*v - 0.2*u', build:csBuildX }
];
const CS_BOUNDS = [{ k:'u0', label:'u from', def:0 }, { k:'u1', label:'to', def:1 },
                   { k:'v0', label:'v from', def:0 }, { k:'v1', label:'to', def:6.2831853 }];

/* The (u,v) pane, with EQUAL SCALES. The cell the reader drags is h×h in those
   coordinates — genuinely a square — and stretching the rectangle to fill its
   box drew it as a wide flat bar, so "watch one square cell" was a caption over
   a picture of something else. The two axes measure different quantities (a
   length and an angle, for polar), which is exactly why the scales have to be
   stated by the picture rather than assumed by the reader. */
function csRectPane(ctx, x, y, w, h, u0, u1, v0, v1, title){
  const du = Math.abs(u1 - u0) || 1, dv = Math.abs(v1 - v0) || 1;
  /* ask for the room that will actually be granted BEFORE choosing the scale:
     mkPlot keeps its box on the canvas, and a clamp applied afterwards would
     make the two scales unequal again */
  const F = ctFitBox(x, y, w, h);
  const s = Math.min(F.pw / du, F.ph / dv);
  const pw = du * s, ph = dv * s;
  const P = mkPlot(F.px + (F.pw - pw) / 2, F.py + (F.ph - ph) / 2, pw, ph, u0, u1, v0, v1);
  plotFrame(ctx, P, 'u', 'v', title);
  ctGrid(ctx, P);
  return P;
}

/* the entry a stage works from, preset or typed — one accessor, so a stage
   never reaches into CS_MAPS with a key that might be 'custom' */
function csCur(st){
  const key = st.mkey;
  if(key !== 'custom' && CS_MAPS[key]){
    const P = CS_MAPS[key];
    return { name:P.name, short:P.short, xs:P.xs, ys:P.ys,
             u0:P.u0, u1:P.u1, v0:P.v0, v1:P.v1,
             jac:P.jac, jacTex:P.jacTex, area:P.area, cover:P.cover,
             degenerate:P.degenerate, orthogonal:P.orthogonal, why:P.why, own:false };
  }
  const own = pkOwn(st, 'csM', CS_SLOTS, CS_BOUNDS);
  return { name:'your own map', short:'yours', xs:own.xs, ys:own.ys,
           u0:+own.u0, u1:+own.u1, v0:+own.v0, v1:+own.v1,
           jac:null, jacTex:null, area:null, cover:null,
           degenerate:null, orthogonal:null, own:true,
           why:'Your map, on your rectangle. Every number below is measured from it — the Jacobian by differentiating, by the area of a small cell, and by √(EG − F²); the image area by pulling back, by Green\'s theorem on the boundary, and by inverting the map over a grid.' };
}

/* the measurement, cached on the state: the grid route inverts the map at
   thousands of points and must not run once per frame */
function csMeasured(st, gridN){
  const C = csCur(st);
  const key = C.xs + '|' + C.ys + '|' + C.u0 + '|' + C.u1 + '|' + C.v0 + '|' + C.v1;
  if(st._cs && st._cs.key === key) return st._cs;
  const M = csMeasure(C, gridN || 96);
  M.key = key; M.C = C;
  st._cs = M;
  return M;
}

/* ---- 1 · what a coordinate map does --------------------------------------- */
STAGES.csGrid = {
  title:'A coordinate map, and what it multiplies area by',
  drag:true,
  enter(st, o){
    st.mkey = o.mkey || 'polar';
    st.uu = o.uu === undefined ? 0.6 : o.uu;
    st.vv = o.vv === undefined ? 0.9 : o.vv;
    st.cell = o.cell === undefined ? 0.16 : o.cell;
    st.show = Object.assign({ grid:true, frame:true }, o.show || {});
  },
  controls(){
    const st = ST, C = csCur(st);
    return pkSeg('csGK', CS_MAPS, st.mkey, e => e.short) +
      pkBoxes('csM', st.mkey, st, CS_SLOTS, CS_BOUNDS,
              'Two expressions in <b>u</b> and <b>v</b> — try <b>u*cos(v)</b> and <b>u*sin(v)</b>, ' +
              'or <b>u^2 - v^2</b> and <b>2*u*v</b>. The bounds take expressions too, so <b>2*pi</b> is valid.') +
      ctlRow('the cell size', ctlSlider('csGH', 0.02, 0.4, 0.005, st.cell)) +
      `<div class="row wrap">${ctChk('csGG', 'the coordinate grid', st.show.grid)}
        ${ctChk('csGF', 'the two coordinate directions', st.show.frame)}</div>
      <p class="help"><b>Drag the cell</b> around the right-hand picture. A coordinate map takes a
      rectangle in (u, v) and lays it over the plane; the grid lines you see on the right are the
      images of the straight lines u = constant and v = constant.</p>
      <p class="help">Watch one cell. Its image is not a square and not the same size everywhere —
      and the factor by which its area changes <i>is</i> the Jacobian. The panel measures that four
      ways: by differentiating the map, by the area of the cell you are dragging, by √(EG − F²) from
      the metric, and against the closed form the preset declares.</p>`;
  },
  wire(){
    pkWire('csGK', 'csM', ST.mkey, ST, CS_SLOTS, CS_BOUNDS,
           v => { ST.mkey = v; ST._cs = null; }, () => { ST._cs = null; });
    wireSlider('csGH', () => ST.cell, v => { ST.cell = v; }, v => fmtNum(+v, 3));
    ctWireChk('csGG', v => { ST.show.grid = v; });
    ctWireChk('csGF', v => { ST.show.frame = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.PL || phase === 'up' || !st.PL.inside(sx, sy)) return;
    const C = csCur(st);
    st.uu = Math.min(Math.max(st.PL.invX(sx), Math.min(C.u0, C.u1)), Math.max(C.u0, C.u1));
    st.vv = Math.min(Math.max(st.PL.invY(sy), Math.min(C.v0, C.v1)), Math.max(C.v0, C.v1));
  },
  frame(st, dt, ctx, W, H){
    const C = csCur(st), M = csMapBuild(C.xs, C.ys);
    const gap = 26, top = 50, bot = 74;
    const pw = (W - 3 * gap) / 2, ph = Math.max(120, H - top - bot);
    /* left: the rectangle in (u,v), which is where the reader drags */
    const PL = csRectPane(ctx, gap, top, pw, ph, C.u0, C.u1, C.v0, C.v1,
                          'the rectangle you integrate over');
    st.PL = PL;
    if(!M.ok){
      ctText(ctx, gap + 10, top + 30, C.own ? M.why : 'that map does not build',
             rgbCss(TH.neg), '600 12px ' + FONT_UI);
      return;
    }
    const h = st.cell * Math.min(Math.abs(C.u1 - C.u0), Math.abs(C.v1 - C.v0));
    const u = Math.min(st.uu, Math.max(C.u0, C.u1) - h), v = Math.min(st.vv, Math.max(C.v0, C.v1) - h);
    ctFill(ctx, PL, [{ x:u, y:v }, { x:u + h, y:v }, { x:u + h, y:v + h }, { x:u, y:v + h }],
           rgbCss(TH.warn, 0.35));
    ctPath(ctx, PL, [{ x:u, y:v }, { x:u + h, y:v }, { x:u + h, y:v + h },
                     { x:u, y:v + h }, { x:u, y:v }], rgbCss(TH.warn), 2);
    ctText(ctx, PL.X(u) + 6, PL.Y(v + h) - 8, 'drag me', rgbCss(TH.warn), '600 11px ' + FONT_UI);

    /* right: the image */
    const B = csImageBox(M, C.u0, C.u1, C.v0, C.v1, 40) ||
              { x0:-1, x1:1, y0:-1, y1:1 };
    const sx = B.x1 - B.x0, sy = B.y1 - B.y0, s = Math.max(sx, sy) / 2;
    const cx0 = (B.x0 + B.x1) / 2, cy0 = (B.y0 + B.y1) / 2;
    const PR = mkPlot(2 * gap + pw, top, pw, ph, cx0 - s, cx0 + s, cy0 - s, cy0 + s);
    plotFrame(ctx, PR, 'x', 'y', 'where it lands');
    ctGrid(ctx, PR);
    /* the coordinate grid: the images of u = const and v = const */
    if(st.show.grid){
      const NL = 11, NP = 120;
      for(let i = 0; i <= NL; i++){
        const uu = C.u0 + (C.u1 - C.u0) * i / NL, vv = C.v0 + (C.v1 - C.v0) * i / NL;
        ctParam(ctx, PR, t => M.T(uu, C.v0 + (C.v1 - C.v0) * t), 0, 1, NP, rgbCss(TH.grad, 0.5), 1.2);
        ctParam(ctx, PR, t => M.T(C.u0 + (C.u1 - C.u0) * t, vv), 0, 1, NP, rgbCss(TH.curl, 0.5), 1.2);
      }
    }
    /* the image of the dragged cell, at the resolution that shows it is curved */
    const NC = 24, poly = [];
    for(let i = 0; i <= NC; i++) poly.push(M.T(u + h * i / NC, v));
    for(let i = 0; i <= NC; i++) poly.push(M.T(u + h, v + h * i / NC));
    for(let i = 0; i <= NC; i++) poly.push(M.T(u + h - h * i / NC, v + h));
    for(let i = 0; i <= NC; i++) poly.push(M.T(u, v + h - h * i / NC));
    ctFill(ctx, PR, poly, rgbCss(TH.warn, 0.35));
    ctPath(ctx, PR, poly.concat([poly[0]]), rgbCss(TH.warn), 2);
    /* the two coordinate directions at the corner, scaled by their own lengths */
    if(st.show.frame){
      const K = csMetric(M, u, v), O = M.T(u, v);
      const sc = 0.32 * s / Math.max(1e-9, Math.max(K.hu, K.hv));
      const J = csJacNum(M, u, v);
      ctArrow(ctx, PR, O.x, O.y, O.x + J.xu * sc, O.y + J.yu * sc, rgbCss(TH.pos), 2.4, '∂T/∂u');
      ctArrow(ctx, PR, O.x, O.y, O.x + J.xv * sc, O.y + J.yv * sc, rgbCss(TH.neg), 2.4, '∂T/∂v');
    }
    const J = csJacNum(M, u, v);
    ctText(ctx, gap, H - 46,
           'the shaded cell has area ' + fmtSig(h * h, 3) + ' on the left and ' +
           fmtSig(igCellArea(M, u, v, h), 3) + ' on the right — a factor of ' +
           fmtSig(igCellArea(M, u, v, h) / (h * h), 4) + ', against |J| = ' + fmtSig(Math.abs(J.det), 4),
           rgbCss(TH.dim), '11px ' + FONT_UI);
    ctText(ctx, gap, H - 28,
           'the two families of curves on the right are the images of the straight lines u = constant and v = constant',
           rgbCss(TH.dim), '11px ' + FONT_UI);
    stageNote(ctx, 'the Jacobian is the factor by which area is multiplied, point by point', W, H);
  },
  derive(st){
    const C = csCur(st), M = csMapBuild(C.xs, C.ys);
    if(!M.ok) return { title:'No map', steps:[drvSay('that map does not build', M.why)], note:'' };
    const h = st.cell * Math.min(Math.abs(C.u1 - C.u0), Math.abs(C.v1 - C.v0));
    const u = Math.min(st.uu, Math.max(C.u0, C.u1) - h), v = Math.min(st.vv, Math.max(C.v0, C.v1) - h);
    const J = csJacNum(M, u, v), K = csMetric(M, u, v), O = csJacOrder(M, u, v, h);
    return {
      title:'Where the Jacobian comes from, and what it is the determinant of',
      steps:[
        drvStep('a map is two functions of two variables',
          `${dv('x')} ${dop('=')} ${dv('x')}(${dv('u')}, ${dv('v')}),  ${dv('y')} ${dop('=')} ${dv('y')}(${dv('u')}, ${dv('v')})`,
          'here x = ' + esc(C.xs) + ' and y = ' + esc(C.ys)),
        drvStep('near a point it is well approximated by a linear map — its derivative',
          `${dop('[')} ${dv('x')}${dop('_')}${dv('u')} ${dv('x')}${dop('_')}${dv('v')} ; ${dv('y')}${dop('_')}${dv('u')} ${dv('y')}${dop('_')}${dv('v')} ${dop(']')}`,
          `at (${fmtNum(u, 4)}, ${fmtNum(v, 4)}):  [${fmtNum(J.xu, 4)}  ${fmtNum(J.xv, 4)} ; ${fmtNum(J.yu, 4)}  ${fmtNum(J.yv, 4)}]`),
        drvSay('and a linear map multiplies every area by its determinant',
          'That is the fact from the linear-algebra wing, arriving here with a job to do. The determinant of a 2×2 matrix is the area of the parallelogram its columns span, so the image of a small square of side h is a parallelogram of area |det|·h². Nothing about coordinates has been used yet — this is the whole content, and everything below is bookkeeping.'),
        drvStep('so the area factor is the determinant of that matrix',
          `|${dv('J')}| ${dop('=')} |${dv('x')}${dop('_')}${dv('u')}${dv('y')}${dop('_')}${dv('v')} ${dop('−')} ${dv('x')}${dop('_')}${dv('v')}${dv('y')}${dop('_')}${dv('u')}|`,
          `= ${fmtSig(Math.abs(J.det), 8)}` + (C.jacTex ? ',  and the closed form says ' + fmtSig(Math.abs(csJacDeclared(C, u, v)), 8) : '')),
        drvStep('the cell you are dragging measures it directly',
          `${dfn('area of the image')} ${dop('/')} ${dv('h')}²`,
          `${fmtSig(O.cell, 6)} / ${fmtSig(h * h, 6)} = ${fmtSig(O.cell / (h * h), 6)}, ` +
          `and halving h changes the error by a factor of ${fmtSig(O.ratio, 3)} — first order, as a chord approximation must be`),
        drvSay('that ratio is the check, and it is a check on the ORDER rather than the value',
          'A cell of finite size has curved edges and the shoelace formula sees only its corners, so the measured factor is never exactly |J| — it is |J| plus an error proportional to h. Asserting a value would need a tolerance chosen by hand; asserting that halving h halves the error tests the relationship instead, and catches a Jacobian that is wrong by a constant factor, which agreeing at one h would not.'),
        drvStep('and the metric gives it a third time, without a determinant',
          `${dv('E')} ${dop('=')} |∂${dv('T')}/∂${dv('u')}|²,  ${dv('F')} ${dop('=')} ∂${dv('T')}/∂${dv('u')} ${dop('·')} ∂${dv('T')}/∂${dv('v')},  ${dv('G')} ${dop('=')} |∂${dv('T')}/∂${dv('v')}|²,  |${dv('J')}| ${dop('=')} √(${dv('EG')} ${dop('−')} ${dv('F')}²)`,
          `E = ${fmtNum(K.E, 5)}, F = ${fmtNum(K.F, 5)}, G = ${fmtNum(K.G, 5)} → ${fmtSig(K.detFromMetric, 8)}`),
        drvSay('which is where the scale factors and orthogonality live',
          '√E and √G are how much length one unit of u and one unit of v buy at this point — the <b>scale factors</b>. F is the dot product of the two coordinate directions, so F = 0 says they meet at right angles. For such a system |J| = √E·√G, and for polar coordinates that reads 1 × r, which is the r in r dr dθ, arrived at without ever writing a determinant.')
      ],
      note:'Four routes to one number, and the disagreements between them are all accounted for.'
    };
  },
  readout(st){
    const C = csCur(st), M = csMapBuild(C.xs, C.ys);
    if(!M.ok) return `<div class="card tight"><div class="ttl">The map</div>
      <p class="help" style="color:var(--c-neg)">${esc(M.why)}</p></div>`;
    const h = st.cell * Math.min(Math.abs(C.u1 - C.u0), Math.abs(C.v1 - C.v0));
    const u = Math.min(st.uu, Math.max(C.u0, C.u1) - h), v = Math.min(st.vv, Math.max(C.v0, C.v1) - h);
    const J = csJacNum(M, u, v), K = csMetric(M, u, v), O = csJacOrder(M, u, v, h);
    const dec = C.jac ? csJacDeclared(C, u, v) : null;
    const scale = Math.max(1e-12, Math.abs(J.det));
    return `<div class="card tight"><div class="ttl">${esc(C.name)}, at u = ${fmtNum(u, 4)}, v = ${fmtNum(v, 4)}</div>
      ${kv('x(u, v)', esc(C.xs))}
      ${kv('y(u, v)', esc(C.ys))}
      ${kv('by differentiating', fmtSig(Math.abs(J.det), 9))}
      ${kv('from the metric, √(EG − F²)', fmtSig(K.detFromMetric, 9))}
      ${kv('difference', fmtGap(Math.abs(K.detFromMetric - Math.abs(J.det)), scale))}
      ${dec === null ? '' : kv('the closed form ' + C.jacTex, fmtSig(Math.abs(dec), 9))}
      ${dec === null ? '' : kv('difference', fmtGap(Math.abs(Math.abs(dec) - Math.abs(J.det)), scale))}
    </div>
    <div class="card tight"><div class="ttl">The cell you are dragging</div>
      ${kv('its area in (u, v)', fmtSig(h * h, 6))}
      ${kv('its area after the map', fmtSig(O.cell, 6))}
      ${kv('the ratio', fmtSig(O.cell / (h * h), 6))}
      ${kv('against |J|', fmtGap(Math.abs(O.cell / (h * h) - Math.abs(J.det)), scale))}
      ${kv('halving h changes that error by', fmtSig(O.ratio, 4) + '×  — first order' )}
      <p class="help">The cell is a finite square, so its image has curved sides and the shoelace
      formula only sees the corners. The remaining error is proportional to h, which is why the row
      above reports the <i>order</i> rather than claiming agreement: shrink the cell with the slider
      and watch it fall.</p>
    </div>
    <div class="card tight"><div class="ttl">The metric, and what it says about this system</div>
      ${kv('h_u = √E', fmtNum(K.hu, 6) + '  — one unit of u buys this much length')}
      ${kv('h_v = √G', fmtNum(K.hv, 6))}
      ${kv('F', fmtNum(K.F, 8))}
      ${kv('angle between the coordinate curves', ctDeg(Math.acos(Math.min(1, Math.max(-1, K.cosAngle)))))}
      ${kv('orthogonal?', K.orthogonal ? 'yes — F vanishes' : 'no')}
      ${K.orthogonal ? kv('so |J| should be h_u·h_v', fmtGap(Math.abs(K.hu * K.hv - Math.abs(J.det)), scale)) : ''}
      <p class="help">${C.why}</p>
    </div>`;
  },
  chip(st){
    const C = csCur(st), M = csMapBuild(C.xs, C.ys);
    if(!M.ok) return `<div class="k">the map</div><div style="color:var(--c-neg)">does not build</div>`;
    const h = st.cell * Math.min(Math.abs(C.u1 - C.u0), Math.abs(C.v1 - C.v0));
    const u = Math.min(st.uu, Math.max(C.u0, C.u1) - h), v = Math.min(st.vv, Math.max(C.v0, C.v1) - h);
    const J = csJacNum(M, u, v);
    return `<div class="k">|J| here</div>
      <div style="color:var(--c-warn)">${fmtSig(Math.abs(J.det), 4)}</div>
      <div style="color:var(--c-dim)">area × ${fmtSig(Math.abs(J.det), 3)}</div>`;
  },
  legend(st){
    const L = [['var(--c-warn)', 'the cell, and its image']];
    if(st.show.grid) L.push(['var(--c-grad)', 'the images of u = constant'],
                            ['var(--c-curl)', 'the images of v = constant']);
    if(st.show.frame) L.push(['var(--c-pos)', '∂T/∂u — one unit of u'],
                             ['var(--c-neg)', '∂T/∂v — one unit of v']);
    return L;
  },
  dockLegend:true
};
