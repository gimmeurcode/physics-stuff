/* ============================================================================
   2f · COORDINATE SYSTEMS AND THE JACOBIAN
   Programme C wing C4.  Polar, cylindrical and spherical coordinates already
   appear in the integration wing, and the Jacobian matrix already appears in
   the partial-derivatives wing, but nothing connects them: why the r in
   r dr dθ is there, what it is the determinant OF, and what happens when the
   map that produced it is not one-to-one.

   Prefix: cs.  A map is { T(u,v) → {x,y} }, built from source so a reader can
   type their own.  Nothing here re-implements a quadrature — 21-numerics and
   `igCellArea` (25-integrate) already have what is needed.

   The Jacobian is computed by FOUR routes that share almost nothing:

     1. the determinant of the numerically differentiated matrix   csJacNum
     2. the AREA of a small mapped cell, divided by h²             igCellArea
     3. sqrt(EG − F²) from the first fundamental form              csMetric
     4. the closed form each preset declares                       CS_MAPS.jac

   and the change-of-variables theorem by three:

     A. ∬ |J| du dv over the rectangle          csAreaPull
     B. ∮ x dy round the image of its boundary  csAreaGreen  (Green's theorem)
     C. a grid over the image, with membership decided by inverting the map
        numerically and asking whether the preimage is in the rectangle
                                                csAreaGrid
   ============================================================================ */

/* ---- reading a map the reader typed ---------------------------------------
   The expression engine's variables are x, y, z; a coordinate map is written in
   u and v. The rename happens before parsing, exactly as the parametric-curve
   boxes do it — validating the raw text instead would reject `u*cos(v)` as an
   unknown identifier and silently keep the previous map. */
const csAst = src => parse(String(src)
  .replace(/(?<![A-Za-z])u(?![A-Za-z])/g, 'x')
  .replace(/(?<![A-Za-z])v(?![A-Za-z])/g, 'y'));

function csMapBuild(xs, ys){
  try {
    const gx = compile(csAst(xs)), gy = compile(csAst(ys));
    const T = (u, v) => ({ x:gx(u, v, 0), y:gy(u, v, 0) });
    /* a map that returns nothing finite anywhere is not a map */
    const probe = T(0.37, 0.61);
    if(!Number.isFinite(probe.x) || !Number.isFinite(probe.y))
      return { ok:false, why:'that map has no value at a typical point' };
    return { ok:true, T, xs:String(xs), ys:String(ys), why:'' };
  } catch(err){
    return { ok:false, why:String(err && err.message || err) };
  }
}

/* ---- route 1: the determinant of the differentiated matrix ----------------
   Central differences, so the error is O(h²) and h can be small before
   round-off takes over. The step is relative to the size of the rectangle the
   caller is working in, because a map on [0, 2π] and a map on [0, 1e-3] do not
   want the same absolute step. */
function csJacNum(map, u, v, h){
  const s = h || 1e-5;
  const a = map.T(u + s, v), b = map.T(u - s, v);
  const c = map.T(u, v + s), d = map.T(u, v - s);
  const xu = (a.x - b.x) / (2 * s), yu = (a.y - b.y) / (2 * s);
  const xv = (c.x - d.x) / (2 * s), yv = (c.y - d.y) / (2 * s);
  return { xu, xv, yu, yv, det:xu * yv - xv * yu };
}

/* ---- route 3: the first fundamental form ---------------------------------
   E = |∂T/∂u|², F = ∂T/∂u · ∂T/∂v, G = |∂T/∂v|².  Then

     h_u = √E,  h_v = √G   are the SCALE FACTORS: how much length one unit of
                            each coordinate buys at this point,
     F = 0                  says the coordinate curves cross at right angles,
     |J| = √(EG − F²)       is the Jacobian again, and this identity is what
                            makes the metric a second route to it rather than a
                            restatement — it is Lagrange's identity for the two
                            column vectors, not the determinant formula.

   For an ORTHOGONAL system F = 0 and |J| = h_u·h_v, which is where "r dr dθ"
   comes from: h_r = 1, h_θ = r. */
function csMetric(map, u, v, h){
  const J = csJacNum(map, u, v, h);
  const E = J.xu * J.xu + J.yu * J.yu;
  const F = J.xu * J.xv + J.yu * J.yv;
  const G = J.xv * J.xv + J.yv * J.yv;
  const disc = Math.max(0, E * G - F * F);
  return { E, F, G, hu:Math.sqrt(E), hv:Math.sqrt(G),
           detFromMetric:Math.sqrt(disc), det:J.det,
           /* the cosine of the angle between the coordinate curves */
           cosAngle:(E > 0 && G > 0) ? F / Math.sqrt(E * G) : 0,
           orthogonal:(E > 0 && G > 0) ? Math.abs(F) / Math.sqrt(E * G) < 1e-9 : false };
}

/* ---- route 2 in convergent form -------------------------------------------
   The area of the image of a small square, over h², approaches |J| as h → 0 —
   and it approaches it at FIRST order, because the cell's curved sides are
   approximated by chords. That order is measured here rather than assumed, by
   doing it at h and h/2: a first-order error halves, a second-order one falls
   by four, and the number returned is the ratio actually observed. This is the
   check that catches a Jacobian with the wrong sign convention or a factor
   dropped, which agreeing formulas never would. */
function csJacOrder(map, u, v, h){
  const H = h || 1e-3;
  const exact = Math.abs(csJacNum(map, u, v, Math.min(1e-5, H / 10)).det);
  const e1 = Math.abs(igCellArea(map, u, v, H) / (H * H) - exact);
  const e2 = Math.abs(igCellArea(map, u, v, H / 2) / (H * H / 4) - exact);
  return { exact, e1, e2,
           ratio:(e2 > 1e-300) ? e1 / e2 : Infinity,
           /* the cell area at the coarser h, for a panel to print */
           cell:igCellArea(map, u, v, H) };
}

/* ---- route A: the theorem's right-hand side ------------------------------- */
function csAreaPull(map, u0, u1, v0, v1, k, panels){
  return nqDoubleRect((u, v) => Math.abs(csJacNum(map, u, v).det),
                      u0, u1, v0, v1, k || 5, panels || 12);
}
/* and the same with a weight, which is the theorem in general */
function csChangePull(map, f, u0, u1, v0, v1, k, panels){
  return nqDoubleRect((u, v) => {
    const p = map.T(u, v);
    return f(p.x, p.y) * Math.abs(csJacNum(map, u, v).det);
  }, u0, u1, v0, v1, k || 5, panels || 12);
}

/* ---- route B: Green's theorem on the image of the boundary ----------------
   ∮ x dy round a closed curve is its SIGNED area, so mapping the rectangle's
   four edges and integrating along them gives the area of the image — computed
   without the Jacobian appearing anywhere.

   Signed, and counted with multiplicity, which is the point rather than a
   caveat: on a map that folds, the boundary image doubles back over itself and
   this returns the two halves with opposite signs. A fold gives 0 here, ∬|J|
   gives twice the image's area, and the image's actual area is a third number.
   All three are correct answers to different questions, and the stage prints
   all three. */
function csAreaGreen(map, u0, u1, v0, v1, n){
  const N = Math.max(64, Math.round(n || 2400));
  /* the four edges, anticlockwise in the (u,v) rectangle */
  const edges = [
    t => ({ u:u0 + (u1 - u0) * t, v:v0 }),
    t => ({ u:u1, v:v0 + (v1 - v0) * t }),
    t => ({ u:u1 - (u1 - u0) * t, v:v1 }),
    t => ({ u:u0, v:v1 - (v1 - v0) * t })
  ];
  let area = 0;
  for(const e of edges){
    /* the trapezoid rule on each edge — the integrand is smooth and the edges
       are traversed in one direction, so this converges quickly and the sum
       telescopes exactly at the corners */
    let prev = null;
    for(let i = 0; i <= N; i++){
      const q = e(i / N), p = map.T(q.u, q.v);
      if(prev) area += 0.5 * (prev.x + p.x) * (p.y - prev.y);
      prev = p;
    }
  }
  return area;
}

/* the rule's own error, so a caller never has to guess it: the boundary is
   piecewise smooth with corners, so this is O(1/N²) rather than spectral, and
   the difference between N and N/2 bounds the finer one */
function csAreaGreenErr(map, u0, u1, v0, v1, n){
  const N = Math.max(64, Math.round(n || 2400));
  const fine = csAreaGreen(map, u0, u1, v0, v1, N);
  const coarse = csAreaGreen(map, u0, u1, v0, v1, N / 2);
  return { area:fine, coarse, self:Math.abs(fine - coarse) };
}

/* Is the rectangle's v-edge the SAME edge? A coordinate map is very often
   periodic — polar, elliptic and every other angular system wrap at 2π — and
   then the two v-edges of the rectangle are one edge of the image. That single
   fact decides whether a preimage found at v = −0.5 is outside the rectangle
   [0, 2π] or is the point at v = 2π − 0.5, and getting it wrong loses HALF the
   disc: Newton returns the principal angle, so every point below the real axis
   inverted to a negative v and was rejected. Measured, not assumed, and per
   variable. */
function csPeriodic(map, u0, u1, v0, v1){
  const tol = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  let scale = 1e-12, worstV = 0, worstU = 0;
  for(let i = 1; i < 6; i++){
    const u = u0 + (u1 - u0) * i / 6, v = v0 + (v1 - v0) * i / 6;
    const a = map.T(u, v0), b = map.T(u, v1);
    const c = map.T(u0, v), d = map.T(u1, v);
    scale = Math.max(scale, Math.hypot(a.x, a.y), Math.hypot(c.x, c.y));
    worstV = Math.max(worstV, tol(a, b));
    worstU = Math.max(worstU, tol(c, d));
  }
  return { v:worstV <= 1e-9 * scale, u:worstU <= 1e-9 * scale, scale };
}

/* ---- route C: a grid over the image, membership by inverting the map -------
   Newton on T(u,v) = (x,y), started from the centre of the rectangle. This
   route never forms a Jacobian determinant and never integrates in (u,v) — it
   asks, of each cell of a Cartesian grid, whether it came from anywhere in the
   rectangle. Its error is FIRST order: the boundary of the image cuts through
   cells and the staircase is what is left. So its tolerance is measured by
   running it at n and 2n rather than assumed, which `csAreaGridErr` does. */
function csInvert(map, x, y, u, v, rect){
  let uu = u, vv = v;
  for(let it = 0; it < 16; it++){
    const p = map.T(uu, vv);
    const rx = p.x - x, ry = p.y - y;
    if(Math.abs(rx) + Math.abs(ry) < 1e-12) return { ok:true, u:uu, v:vv };
    const J = csJacNum(map, uu, vv);
    const det = J.det;
    if(!Number.isFinite(det) || Math.abs(det) < 1e-14) return { ok:false, u:uu, v:vv };
    /* the 2x2 inverse, applied to the residual */
    const du = -( J.yv * rx - J.xv * ry) / det;
    const dv = -(-J.yu * rx + J.xu * ry) / det;
    uu += du; vv += dv;
    if(rect){
      /* keep the iterate in a generous box around the rectangle, or Newton on a
         periodic map wanders off by whole turns and reports a point as outside
         when it is inside */
      const pad = 0.5 * Math.abs(rect.u1 - rect.u0) + 1e-9;
      const padv = 0.5 * Math.abs(rect.v1 - rect.v0) + 1e-9;
      uu = Math.min(Math.max(uu, Math.min(rect.u0, rect.u1) - pad), Math.max(rect.u0, rect.u1) + pad);
      vv = Math.min(Math.max(vv, Math.min(rect.v0, rect.v1) - padv), Math.max(rect.v0, rect.v1) + padv);
    }
    if(!Number.isFinite(uu) || !Number.isFinite(vv)) return { ok:false, u:uu, v:vv };
  }
  return { ok:false, u:uu, v:vv };
}

/* the bounding box of the image, from a sweep of the rectangle */
function csImageBox(map, u0, u1, v0, v1, n){
  const N = Math.max(8, Math.round(n || 60));
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for(let i = 0; i <= N; i++) for(let j = 0; j <= N; j++){
    const p = map.T(u0 + (u1 - u0) * i / N, v0 + (v1 - v0) * j / N);
    if(!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
  }
  if(!Number.isFinite(x0)) return null;
  const px = 0.02 * (x1 - x0) + 1e-9, py = 0.02 * (y1 - y0) + 1e-9;
  return { x0:x0 - px, x1:x1 + px, y0:y0 - py, y1:y1 + py };
}

function csAreaGrid(map, u0, u1, v0, v1, n){
  const B = csImageBox(map, u0, u1, v0, v1);
  if(!B) return { area:NaN, inside:0, total:0, why:'the image has no bounding box' };
  const N = Math.max(10, Math.round(n || 120));
  /* Newton starts from a GENERIC interior point, not the centre. The centre of
     the fold's rectangle is u = 0, where its Jacobian is exactly zero — so
     every single point failed to invert, the image measured zero, and the
     covering number came out NaN. "Convenient" and "representative" are not the
     same choice, and the default preset is where the difference hides.

     One start is not enough either. A point has as many preimages as the map
     has branches, and polar has two — (r, θ) and (−r, θ+π) name the same point.
     Newton converged to the negative-r branch for two fifths of the disc, those
     points were correctly judged outside the rectangle, and the measured area
     came out at 58% of π. So: march with CONTINUATION, starting each cell from
     the last preimage that worked, since neighbouring points have neighbouring
     preimages; and fall back to a spread of fixed starts when that fails,
     accepting the point if ANY of them lands in the rectangle. */
  const starts = [];
  for(const a of [0.371, 0.5, 0.13, 0.87])
    starts.push({ u:u0 + a * (u1 - u0), v:v0 + (a === 0.5 ? 0.5 : 0.617) * (v1 - v0) });
  starts.push({ u:u0 + 0.62 * (u1 - u0), v:v0 + 0.17 * (v1 - v0) });
  const rect = { u0, u1, v0, v1 };
  const per = csPeriodic(map, u0, u1, v0, v1);
  const wrap = (t, a, b, on) => {
    if(!on) return t;
    const p = b - a;
    if(!(Math.abs(p) > 1e-300)) return t;
    return a + ((t - a) % p + Math.abs(p)) % Math.abs(p);
  };
  const lo = (a, b) => Math.min(a, b) - 1e-9, hi = (a, b) => Math.max(a, b) + 1e-9;
  const dx = (B.x1 - B.x0) / N, dy = (B.y1 - B.y0) / N;
  let inside = 0, last = null;
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
    const x = B.x0 + (i + 0.5) * dx, y = B.y0 + (j + 0.5) * dy;
    const tries = last ? [last].concat(starts) : starts;
    for(const s of tries){
      const inv = csInvert(map, x, y, s.u, s.v, rect);
      if(!inv.ok) continue;
      const uu = wrap(inv.u, u0, u1, per.u), vv = wrap(inv.v, v0, v1, per.v);
      if(uu >= lo(u0, u1) && uu <= hi(u0, u1) &&
         vv >= lo(v0, v1) && vv <= hi(v0, v1)){ inside++; last = { u:uu, v:vv }; break; }
    }
  }
  /* the cell size is the resolution this route has, and it is reported
     alongside the two-run difference: two grids can happen to agree exactly,
     and printing that as an error of zero claims a precision the staircase
     cannot have */
  return { area:inside * dx * dy, inside, total:N * N, box:B, periodic:per,
           cell:Math.max(dx, dy), why:'' };
}
/* its own error, measured rather than guessed: a staircase boundary is first
   order, so halving the cell should halve the error — and the DIFFERENCE
   between the two runs is a usable bound on the finer one */
function csAreaGridErr(map, u0, u1, v0, v1, n){
  const A = csAreaGrid(map, u0, u1, v0, v1, n || 120);
  const B = csAreaGrid(map, u0, u1, v0, v1, 2 * (n || 120));
  /* the honest bound is the larger of what refining changed and what one
     cell of the finer grid is worth along the boundary -- roughly the
     perimeter times the cell, estimated from the box */
  const per = 2 * ((B.box ? B.box.x1 - B.box.x0 : 1) + (B.box ? B.box.y1 - B.box.y0 : 1));
  const floorErr = (B.cell || 0) * per;
  return { coarse:A.area, fine:B.area,
           self:Math.max(Math.abs(B.area - A.area), floorErr),
           moved:Math.abs(B.area - A.area), floorErr, grid:B };
}

/* ---- the presets ----------------------------------------------------------
   Each declares a closed-form Jacobian, the area of its image where one exists,
   whether it is one-to-one on the rectangle, and whether it is orthogonal.
   `./auditclaims.ps1` recomputes every one of those by routes that never read
   the declaration. */
const CS_MAPS = {
  polar:    { name:'polar coordinates', short:'polar',
              xs:'u*cos(v)', ys:'u*sin(v)', u0:0, u1:1, v0:0, v1:2 * Math.PI,
              jac:'u', jacTex:'<i>r</i>', area:Math.PI, cover:1, degenerate:true, orthogonal:true,
              why:'The map that produces the <b>r</b> in r dr dθ. It is not one-to-one: the whole edge r = 0 goes to the single point at the origin, and θ = 0 and θ = 2π are the same ray. Both failures happen on a set of zero area, which is exactly the licence the theorem needs.' },
  annulus:  { name:'an annulus, where polar IS one-to-one', short:'annulus',
              xs:'u*cos(v)', ys:'u*sin(v)', u0:1, u1:2, v0:0, v1:2 * Math.PI,
              jac:'u', jacTex:'<i>r</i>', area:3 * Math.PI, cover:1, degenerate:false, orthogonal:true,
              why:'The same map on a rectangle that avoids r = 0, so the hypothesis of the theorem holds outright and the area is π(2² − 1²) = 3π. Comparing this with the disc above is the cleanest way to see that the exception at the origin costs nothing.' },
  ellipse:  { name:'a stretched polar map', short:'ellipse',
              xs:'2*u*cos(v)', ys:'u*sin(v)', u0:0, u1:1, v0:0, v1:2 * Math.PI,
              jac:'2*u', jacTex:'2<i>r</i>', area:2 * Math.PI, cover:1, degenerate:true, orthogonal:false,
              why:'Stretching x by 2 doubles every area, so the Jacobian doubles and the image is an ellipse of area 2π = π·a·b with a = 2 and b = 1. Note that it is <b>no longer orthogonal</b>: the radial and angular curves stop meeting at right angles, and the panel measures the angle they do meet at.' },
  shear:    { name:'a shear', short:'shear',
              xs:'u + 0.5*v', ys:'v', u0:0, u1:1, v0:0, v1:1,
              jac:'1', jacTex:'1', area:1, cover:1, degenerate:false, orthogonal:false,
              why:'A shear moves every point sideways in proportion to its height and changes no area at all — the Jacobian is exactly 1 everywhere. The image is a parallelogram of the same area as the square, which is the geometric content of det = 1.' },
  rotate:   { name:'a rotation', short:'rotation',
              xs:'u*cos(1) - v*sin(1)', ys:'u*sin(1) + v*cos(1)', u0:0, u1:1, v0:0, v1:1,
              jac:'1', jacTex:'1', area:1, cover:1, degenerate:false, orthogonal:true,
              why:'The one transformation that changes neither area nor angle. Jacobian 1 and F = 0 — and it is the only preset here for which both are true at once, which is what "rigid motion" means.' },
  elliptic: { name:'elliptic coordinates', short:'elliptic',
              xs:'cosh(u)*cos(v)', ys:'sinh(u)*sin(v)', u0:0.3, u1:1.2, v0:0, v1:2 * Math.PI,
              jac:'(cosh(2*u) - cos(2*v))/2', jacTex:'(cosh 2<i>u</i> <span class="op">−</span> cos 2<i>v</i>)/2',
              area:Math.PI * (Math.cosh(1.2) * Math.sinh(1.2) - Math.cosh(0.3) * Math.sinh(0.3)), cover:1, degenerate:false, orthogonal:true,
              why:'Confocal ellipses and hyperbolas, the natural coordinates for an elliptical drum or a charged strip. Orthogonal, and its Jacobian varies in <b>both</b> variables — the first preset here for which that is true.' },
  square:   { name:'the squaring map, z ↦ z²', short:'z²',
              xs:'u^2 - v^2', ys:'2*u*v', u0:0.2, u1:1, v0:0.2, v1:1,
              jac:'4*(u^2 + v^2)', jacTex:'4(<i>u</i>² <span class="op">+</span> <i>v</i>²)',
              area:8 * (1 - 0.008) / 3 * 0.8, cover:1, degenerate:false, orthogonal:true,
              why:'Every holomorphic map is <b>conformal</b> — it preserves angles — and its Jacobian is |f′(z)|². Here f′ = 2z, so |J| = 4|z|², which is what the closed form says. This is the complex wing meeting this one.' },
  fold:     { name:'a map that folds', short:'a fold',
              xs:'u^2', ys:'v', u0:-1, u1:1, v0:0, v1:1,
              jac:'2*u', jacTex:'2<i>u</i>', area:1, cover:2, degenerate:true, orthogonal:true,
              why:'The counterexample. This map covers the image <b>twice</b>, so ∬|J| returns 2 while the image itself has area 1 — and Green\'s theorem on the boundary returns 0, because the boundary doubles back over itself. Three routes, three different right answers to three different questions, and the theorem is the one that needs one-to-one. It is <b>orthogonal</b> — its coordinate curves are horizontal and vertical lines — which is worth noticing: being well behaved locally says nothing at all about being one-to-one globally.' }
};

/* the map a preset or a reader supplies, built once */
function csMapOf(P){
  const M = csMapBuild(P.xs, P.ys);
  if(!M.ok) return M;
  M.u0 = P.u0; M.u1 = P.u1; M.v0 = P.v0; M.v1 = P.v1;
  return M;
}
/* the declared Jacobian, evaluated — the fourth route, and the only one that
   reads the table */
function csJacDeclared(P, u, v){
  try { return compile(csAst(P.jac))(u, v, 0); }
  catch(err){ return NaN; }
}

/* everything a panel needs, in one call, so it cannot be handed an inconsistent
   set of numbers */
function csMeasure(P, gridN){
  const M = csMapOf(P);
  if(!M.ok) return { ok:false, why:M.why };
  const pull = csAreaPull(M, P.u0, P.u1, P.v0, P.v1);
  const green = csAreaGreen(M, P.u0, P.u1, P.v0, P.v1);
  const G = csAreaGridErr(M, P.u0, P.u1, P.v0, P.v1, gridN || 110);
  /* the Jacobian's four routes, sampled at a point that is generic rather than
     convenient — a corner or a centre can be exactly where a coincidence hides */
  const u = P.u0 + 0.371 * (P.u1 - P.u0), v = P.v0 + 0.617 * (P.v1 - P.v0);
  const J = csJacNum(M, u, v);
  const K = csMetric(M, u, v);
  const O = csJacOrder(M, u, v, 1e-3 * Math.max(1, Math.abs(P.u1 - P.u0)));
  return { ok:true, map:M, u, v,
           pull, green, grid:G.fine, gridSelf:G.self, gridCoarse:G.coarse,
           det:J.det, detMetric:K.detFromMetric, detDeclared:csJacDeclared(P, u, v),
           metric:K, order:O,
           /* |Green| is the image area only when the map is one-to-one; the
              ratio below is 2 for the fold and 1 for everything else, and is
              what makes "one-to-one" a measured property rather than a label */
           cover:(Math.abs(G.fine) > 1e-9) ? pull / Math.abs(G.fine) : NaN,
           why:'' };
}
