/* ============================================================================
   1e · FUNCTIONS OF SEVERAL VARIABLES
   Partial derivatives, higher-order partials and Clairaut, tangent planes and
   differentials, the chain rule, the Jacobian, critical points with the
   second-derivative test, and Lagrange multipliers.

   Every derivative here is symbolic — the same engine that drives the vector
   wing's derivation panel — so what a stage prints is the derivative, not a
   finite difference that happens to be close to one.
   ============================================================================ */

/* A compiled bundle for a scalar f(x,y): the function, its first and second
   partials, and the ASTs so the derivation can be typeset. Throws on bad input
   exactly as the field engine does, so the caller reports it the same way. */
function mvCompile(src){
  const A = parse(src);
  const ax = diff(A, 'x'), ay = diff(A, 'y');
  const axx = diff(ax, 'x'), axy = diff(ax, 'y'), ayx = diff(ay, 'x'), ayy = diff(ay, 'y');
  const c = nd => { const g = compile(nd); return (x, y) => g(x, y, 0); };
  return {
    src, ast:A, ax, ay, axx, axy, ayx, ayy,
    f:c(A), fx:c(ax), fy:c(ay), fxx:c(axx), fxy:c(axy), fyx:c(ayx), fyy:c(ayy),
    /* third order, for the Taylor remainder the tangent-plane stage quotes */
    fxxx:c(diff(axx, 'x')), fyyy:c(diff(ayy, 'y'))
  };
}
const mvGrad = (F, x, y) => ({ x:F.fx(x, y), y:F.fy(x, y) });
const mvGradLen = (F, x, y) => Math.hypot(F.fx(x, y), F.fy(x, y));
/* the directional derivative is a projection and nothing else */
function mvDirDeriv(F, x, y, ux, uy){
  const L = Math.hypot(ux, uy) || 1;
  return (F.fx(x, y) * ux + F.fy(x, y) * uy) / L;
}
/* the Hessian, and the discriminant D = f_xx f_yy − f_xy² that classifies it */
function mvHessian(F, x, y){
  const a = F.fxx(x, y), b = F.fxy(x, y), c = F.fyy(x, y);
  return { a, b, c, D:a * c - b * b, tr:a + c, eig:nqEig2sym(a, b, c) };
}
/* Clairaut: the mixed partials agree for a function with continuous seconds.
   Both are computed symbolically along different routes, so equality here is a
   real check of the theorem and of the differentiator at once. */
const mvClairautGap = (F, x, y) => Math.abs(F.fxy(x, y) - F.fyx(x, y));

/* ---------------------------------------------------- critical points ------- */
/* Found, not supplied: sweep a grid for cells where ∇f changes sign in both
   components, then polish each candidate with Newton on ∇f = 0. */
function mvCriticalPoints(F, x0, x1, y0, y1, n){
  const N = n || 26, out = [];
  const G = (x, y) => [F.fx(x, y), F.fy(x, y)];
  const J = (x, y) => [[F.fxx(x, y), F.fxy(x, y)], [F.fyx(x, y), F.fyy(x, y)]];
  const seen = [];
  for(let i = 0; i <= N; i++) for(let j = 0; j <= N; j++){
    const sx = x0 + (x1 - x0) * i / N, sy = y0 + (y1 - y0) * j / N;
    const g0 = G(sx, sy);
    if(!Number.isFinite(g0[0]) || !Number.isFinite(g0[1])) continue;
    const p = nqNewton2(G, J, sx, sy, 40);
    if(!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    if(p.x < x0 - 1e-6 || p.x > x1 + 1e-6 || p.y < y0 - 1e-6 || p.y > y1 + 1e-6) continue;
    const g = G(p.x, p.y);
    if(Math.hypot(g[0], g[1]) > 1e-7) continue;
    if(seen.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 1e-4 * Math.max(1, x1 - x0))) continue;
    seen.push(p);
    out.push(mvClassify(F, p.x, p.y));
  }
  return out.sort((p, q) => (q.f - p.f) || (p.x - q.x));
}
/* the second-derivative test, with the degenerate case reported as degenerate
   rather than quietly guessed */
function mvClassify(F, x, y){
  const H = mvHessian(F, x, y);
  let kind;
  if(!Number.isFinite(H.D)) kind = 'not determined — the Hessian is not finite here';
  else if(Math.abs(H.D) < 1e-9) kind = 'degenerate';
  else if(H.D < 0) kind = 'saddle';
  else kind = H.a < 0 ? 'local maximum' : 'local minimum';
  return { x, y, f:F.f(x, y), H, kind,
           /* the two principal curvatures and the directions they act along */
           l1:H.eig.l1, l2:H.eig.l2, v1:H.eig.v1, v2:H.eig.v2 };
}
const MV_CRIT_COLOR = {
  'local minimum':'pos', 'local maximum':'neg', saddle:'warn',
  degenerate:'faint', 'not determined — the Hessian is not finite here':'faint'
};

/* ------------------------------------------------------ tangent plane ------- */
/* L(x,y) = f(a,b) + f_x(a,b)(x−a) + f_y(a,b)(y−b), and the error it leaves. */
function mvLinear(F, a, b){
  const f0 = F.f(a, b), gx = F.fx(a, b), gy = F.fy(a, b);
  return {
    f0, gx, gy,
    L:(x, y) => f0 + gx * (x - a) + gy * (y - b),
    /* the plane's normal is ⟨f_x, f_y, −1⟩ — the gradient of z − f(x,y) */
    n:vnorm(v3(gx, gy, -1)),
    /* the total differential: the linear map that the plane <i>is</i> */
    df:(dx, dy) => gx * dx + gy * dy
  };
}
/* how badly the plane fails, at distance h in the worst direction — this should
   fall as h², which is the content of differentiability */
function mvLinearError(F, a, b, h, n){
  const L = mvLinear(F, a, b);
  let worst = 0;
  const N = n || 72;
  for(let i = 0; i < N; i++){
    const th = 2 * Math.PI * i / N;
    const x = a + h * Math.cos(th), y = b + h * Math.sin(th);
    const e = Math.abs(F.f(x, y) - L.L(x, y));
    if(Number.isFinite(e)) worst = Math.max(worst, e);
  }
  return worst;
}

/* --------------------------------------------------------- limits ----------- */
/* Approach the origin along a family of paths and collect what f tends to.
   A limit exists only if every path agrees, and the stage's whole point is
   showing a function where they do not. */
const MV_LIMIT_CASES = {
  ratio: { name:'f = xy/(x²+y²)', src:'x y/(x^2+y^2)', exists:false,
    why:'Along y = mx the value is m/(1+m²), which depends on m. Different straight lines give different answers, so no limit exists — even though every straight-line approach is perfectly well behaved on its own.' },
  square: { name:'f = x²y/(x⁴+y²)', src:'x^2 y/(x^4+y^2)', exists:false,
    why:'Every straight line gives 0, so a line test would wrongly pass it. Along the parabola y = x² the value is ½ at every point. One curved path is enough to destroy the limit.' },
  good: { name:'f = x²y/(x²+y²)', src:'x^2 y/(x^2+y^2)', exists:true, value:0,
    why:'In polar form this is r cos²θ sinθ, and |f| ≤ r regardless of θ. The bound goes to zero uniformly in direction, which is what a limit requires — the squeeze theorem, in two variables.' },
  sinc: { name:'f = sin(x²+y²)/(x²+y²)', src:'sin(x^2+y^2)/(x^2+y^2)', exists:true, value:1,
    why:'A function of r alone: sin(r²)/r² → 1. Radial symmetry means direction cannot matter, so a single one-variable limit settles it.' },
  quotient: { name:'f = (x²−y²)/(x²+y²)', src:'(x^2-y^2)/(x^2+y^2)', exists:false,
    why:'In polar form this is exactly cos 2θ — independent of r. Every circle around the origin carries the full range from −1 to 1, so approaching along different rays gives every value in between.' }
};
/* the value along the straight path y = m·x, at distance s from the origin */
function mvPathLine(F, m, s){
  const den = Math.hypot(1, m);
  return F.f(s / den, m * s / den);
}
/* the value along y = k·x^p */
function mvPathPower(F, k, p, s){ return F.f(s, k * Math.pow(s, p)); }
/* the polar sweep at radius r: the range over θ is zero exactly when the limit
   is direction-independent */
function mvPolarSpread(F, r, n){
  let lo = Infinity, hi = -Infinity;
  const N = n || 240;
  for(let i = 0; i < N; i++){
    const th = 2 * Math.PI * i / N;
    const v = F.f(r * Math.cos(th), r * Math.sin(th));
    if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
  }
  return { lo, hi, spread:hi - lo };
}

/* ------------------------------------------------------ the chain rule ------ */
/* df/dt along a path (x(t), y(t)) two ways: the chain rule, and differentiating
   the composite directly. They must agree, and the stage prints the gap. */
function mvChainCheck(F, path, t){
  const p = path.f(t), d = path.d(t);
  const chain = F.fx(p.x, p.y) * d.x + F.fy(p.x, p.y) * d.y;
  const h = 1e-5;
  const p1 = path.f(t + h), p0 = path.f(t - h);
  const direct = (F.f(p1.x, p1.y) - F.f(p0.x, p0.y)) / (2 * h);
  return { chain, direct, gap:Math.abs(chain - direct), fx:F.fx(p.x, p.y), fy:F.fy(p.x, p.y), dx:d.x, dy:d.y, p };
}
/* implicit differentiation: F(x,y) = 0 defines y(x) with dy/dx = −F_x/F_y */
const mvImplicitSlope = (F, x, y) => -F.fx(x, y) / F.fy(x, y);
/* and the second derivative, which the quotient rule turns into this */
function mvImplicitSlope2(F, x, y){
  const Fx = F.fx(x, y), Fy = F.fy(x, y);
  const Fxx = F.fxx(x, y), Fxy = F.fxy(x, y), Fyy = F.fyy(x, y);
  return -(Fxx * Fy * Fy - 2 * Fxy * Fx * Fy + Fyy * Fx * Fx) / (Fy * Fy * Fy);
}

/* --------------------------------------------------------- the Jacobian ----- */
/* For a map T(u,v) = (x(u,v), y(u,v)): the matrix of partials, its determinant,
   and the local image of a small square — which is what the determinant means. */
function mvJacobian2(T, u, v, h){
  h = h || 1e-5;
  const p = T(u, v);
  const xu = (T(u + h, v).x - T(u - h, v).x) / (2 * h);
  const xv = (T(u, v + h).x - T(u, v - h).x) / (2 * h);
  const yu = (T(u + h, v).y - T(u - h, v).y) / (2 * h);
  const yv = (T(u, v + h).y - T(u, v - h).y) / (2 * h);
  return { p, m:[[xu, xv], [yu, yv]], det:xu * yv - xv * yu };
}
function mvJacobian3(T, u, v, w, h){
  h = h || 1e-5;
  const col = (du, dv, dw) => {
    const a = T(u + du, v + dv, w + dw), b = T(u - du, v - dv, w - dw);
    return v3((a.x - b.x) / (2 * h), (a.y - b.y) / (2 * h), (a.z - b.z) / (2 * h));
  };
  const cu = col(h, 0, 0), cv = col(0, h, 0), cw = col(0, 0, h);
  const M = [[cu.x, cv.x, cw.x], [cu.y, cv.y, cw.y], [cu.z, cv.z, cw.z]];
  return { m:M, det:nqDet3(M) };
}
/* named transformations for the change-of-variables stages */
const MV_MAPS = {
  polar: { name:'Polar  (r, θ) → (r cosθ, r sinθ)', u0:0.001, u1:2.2, v0:0, v1:Math.PI / 2,
    ul:'r', vl:'θ',
    T:(r, th) => ({ x:r * Math.cos(th), y:r * Math.sin(th) }),
    jac:(r) => r,
    note:'The determinant is exactly r, which is the whole reason the polar area element is r dr dθ. A wedge far from the origin is wider than the same wedge near it, in direct proportion to r.' },
  shear: { name:'Shear  (u, v) → (u + v, v)', u0:-1.6, u1:1.6, v0:-1.6, v1:1.6,
    ul:'u', vl:'v',
    T:(u, v) => ({ x:u + v, y:v }), jac:() => 1,
    note:'Determinant 1 everywhere: a shear slides layers sideways without changing any area. Every parallelogram in the image has the area of the square it came from.' },
  scale: { name:'Stretch  (u, v) → (3u, u + 2v)', u0:-1.4, u1:1.4, v0:-1.4, v1:1.4,
    ul:'u', vl:'v',
    T:(u, v) => ({ x:3 * u, y:u + 2 * v }), jac:() => 6,
    note:'A constant determinant of 6: every region\'s area is multiplied by six. This is the linear case, where the Jacobian is the matrix itself and nothing varies from point to point.' },
  rot: { name:'Sum/difference  (u, v) → ((u+v)/2, (v−u)/2)', u0:-2, u1:2, v0:-2, v1:2,
    ul:'u', vl:'v',
    T:(u, v) => ({ x:(u + v) / 2, y:(v - u) / 2 }), jac:() => 0.5,
    note:'The substitution u = x − y, v = x + y run backwards. It rotates by 45° and shrinks by √2 in each direction, so areas halve — and it turns the awkward region between the lines x ± y = const into a plain rectangle.' },
  /* J15: this was (u,v) → (3u, 2v) over the SQUARE, so the picture showed a
     square becoming a rectangle while the note talked about the disc and the
     ellipse. Polar composed with the stretch keeps the domain a rectangle —
     which the whole stage machinery integrates over — and makes the image the
     actual ellipse the prose promises. */
  ellip: { name:'Ellipse  (u, v) → (3u cos v, 2u sin v)', u0:0.001, u1:1, v0:0, v1:2 * Math.PI,
    ul:'u', vl:'v',
    T:(u, v) => ({ x:3 * u * Math.cos(v), y:2 * u * Math.sin(v) }), jac:u => 6 * u,
    note:'Polar coordinates stretched by 3 in x and 2 in y: the (u, v) rectangle maps to the full ellipse x²/9 + y²/4 = 1. The determinant is 6u — the polar r carrying both stretches — and integrating it gives ∬ 6u du dv = 6π, which is the fastest honest derivation of area = πab there is.' },
  parab: { name:'Parabolic  (u, v) → (u² − v², 2uv)', u0:0.05, u1:1.5, v0:0.05, v1:1.5,
    ul:'u', vl:'v',
    T:(u, v) => ({ x:u * u - v * v, y:2 * u * v }), jac:(u, v) => 4 * (u * u + v * v),
    note:'The complex square z ↦ z². The determinant 4(u²+v²) = 4|z|² is |2z|², and grids of straight lines become two families of confocal parabolas that cross at right angles — conformality, visible.' }
};

/* --------------------------------------------- Lagrange multipliers --------- */
/* Constrained optimisation as a tangency condition: ∇f = λ∇g on g = 0.
   The stage walks the constraint curve, so the solutions are found by looking
   for sign changes of the cross product ∇f × ∇g — which vanishes precisely
   where the two gradients are parallel. */
function mvLagrangeOn(F, G, param, t){
  const p = param(t);
  const gf = mvGrad(F, p.x, p.y), gg = mvGrad(G, p.x, p.y);
  const cross = gf.x * gg.y - gf.y * gg.x;
  const gg2 = gg.x * gg.x + gg.y * gg.y;
  const lam = gg2 < 1e-14 ? NaN : (gf.x * gg.x + gf.y * gg.y) / gg2;
  return { p, gf, gg, cross, lam, f:F.f(p.x, p.y), g:G.f(p.x, p.y) };
}
function mvLagrangeSolve(F, G, param, t0, t1, n){
  const cross = t => {
    const r = mvLagrangeOn(F, G, param, t);
    return r.cross;
  };
  const ts = nqRoots(cross, t0, t1, n || 720, 1e-13);
  return ts.map(t => {
    const r = mvLagrangeOn(F, G, param, t);
    return { t, x:r.p.x, y:r.p.y, f:r.f, lam:r.lam, gf:r.gf, gg:r.gg };
  });
}

/* ------------------------------------------------ tracing a level set -------
   Every preset constraint above arrives with a parametrisation, because its
   author knew one. A constraint the reader types does not: g(x, y) = 0 is a
   curve, but nothing hands you a way to walk along it — and walking along it is
   exactly what the Lagrange stage does.

   So trace it. Find one point on the curve, then march: the tangent direction is
   ∇g turned through a right angle, and after each step a Newton correction along
   ∇g itself pulls the point back onto the curve. Predictor–corrector, and the
   corrector is what stops the error accumulating — pure tangent-following drifts
   off a circle within one lap.

   The result is a polyline in near-uniform arc length, which is a far better
   parametrisation for the stage than any formula: the walk proceeds at constant
   speed, so the animation does not race through the interesting part. */
/* land on the curve from a nearby point, by Newton along the gradient */
function mvLevelSnap(G, x, y, iter){
  for(let i = 0; i < (iter || 6); i++){
    const g = G.f(x, y), gx = G.fx(x, y), gy = G.fy(x, y);
    const n2 = gx * gx + gy * gy;
    if(!Number.isFinite(g) || n2 < 1e-18) break;
    if(Math.abs(g) < 1e-13) break;
    x -= g * gx / n2; y -= g * gy / n2;
  }
  return { x, y };
}
/* a starting point: scan the box for a sign change, bisect, then snap */
function mvLevelSeed(G, box, n){
  const N = n || 60;
  const hx = (box.x1 - box.x0) / N, hy = (box.y1 - box.y0) / N;
  let best = null, bestAbs = Infinity;
  for(let i = 0; i <= N; i++) for(let j = 0; j <= N; j++){
    const x = box.x0 + i * hx, y = box.y0 + j * hy;
    const g = G.f(x, y);
    if(!Number.isFinite(g)) continue;
    /* a sign change against the neighbour to the right is a bracket, and a
       bracket is worth far more than a small value — |g| can be small simply
       because g is small everywhere */
    if(i < N){
      const g2 = G.f(x + hx, y);
      if(Number.isFinite(g2) && g * g2 <= 0) return mvLevelSnap(G, x + hx * g / (g - g2 || 1), y);
    }
    if(j < N){
      const g2 = G.f(x, y + hy);
      if(Number.isFinite(g2) && g * g2 <= 0) return mvLevelSnap(G, x, y + hy * g / (g - g2 || 1));
    }
    if(Math.abs(g) < bestAbs){ bestAbs = Math.abs(g); best = { x, y }; }
  }
  /* no sign change anywhere — g may touch zero without crossing (x² = 0), so the
     flattest point is snapped and the caller checks whether it landed */
  return best ? mvLevelSnap(G, best.x, best.y, 20) : null;
}
/* march from a seed in one direction; `dir` is +1 or −1 */
function mvLevelWalk(G, seed, box, h, dir, max){
  const pts = [];
  let x = seed.x, y = seed.y;
  for(let k = 0; k < (max || 1400); k++){
    const gx = G.fx(x, y), gy = G.fy(x, y);
    const nrm = Math.hypot(gx, gy);
    if(!Number.isFinite(nrm) || nrm < 1e-12) break;      // ∇g = 0: no tangent to follow
    /* the tangent is the gradient rotated a quarter turn */
    const tx = -gy / nrm * dir, ty = gx / nrm * dir;
    const p = mvLevelSnap(G, x + h * tx, y + h * ty);
    if(!Number.isFinite(p.x) || !Number.isFinite(p.y)) break;
    if(p.x < box.x0 - h || p.x > box.x1 + h || p.y < box.y0 - h || p.y > box.y1 + h) break;
    /* the corrector can jump to a different branch of the level set; a step far
       longer than asked for is the symptom, and continuing would splice two
       disconnected pieces of curve into one polyline */
    if(Math.hypot(p.x - x, p.y - y) > 4 * h) break;
    x = p.x; y = p.y;
    pts.push({ x, y });
    if(k > 4 && Math.hypot(x - seed.x, y - seed.y) < h * 0.75) return { pts, closed:true };
  }
  return { pts, closed:false };
}
/* the whole curve, as a walkable path. Returns null when there is no curve to
   walk — which is a real answer for a constraint like x² + y² + 1 = 0. */
function mvLevelCurve(G, box, step){
  const seed = mvLevelSeed(G, box);
  if(!seed || !Number.isFinite(seed.x) || Math.abs(G.f(seed.x, seed.y)) > 1e-6) return null;
  const h = step || Math.max(box.x1 - box.x0, box.y1 - box.y0) / 320;
  const fwd = mvLevelWalk(G, seed, box, h, +1);
  let pts;
  /* A closed loop stops once it comes back within a step of where it began, so
     the last short hop home is not in the list. Leaving it out loses that much
     arc length — a full lap of the unit circle came out 0.2% short — and leaves
     a gap the parametrisation would interpolate straight across. */
  if(fwd.closed) pts = [seed].concat(fwd.pts, [seed]);
  else {
    /* an open arc: the seed is somewhere in the middle of it, so walk the other
       way too and lay the two halves end to end */
    const back = mvLevelWalk(G, seed, box, h, -1);
    pts = back.pts.slice().reverse().concat([seed], fwd.pts);
  }
  if(pts.length < 4) return null;
  /* arc length, so t is proportional to distance walked rather than to index —
     the corrector makes the steps nearly equal but not exactly */
  const cum = [0];
  for(let i = 1; i < pts.length; i++)
    cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const L = cum[cum.length - 1] || 1;
  return {
    pts, closed:fwd.closed, length:L,
    /* t ∈ [0, 1], by arc length */
    param(t){
      const s = Math.max(0, Math.min(1, t)) * L;
      let lo = 0, hi = cum.length - 1;
      while(hi - lo > 1){ const m = (lo + hi) >> 1; if(cum[m] <= s) lo = m; else hi = m; }
      const seg = cum[hi] - cum[lo];
      const u = seg > 1e-15 ? (s - cum[lo]) / seg : 0;
      /* Interpolating between two traced points lands on the chord, not on the
         curve — inside a circle by about h²/8. The stage prints "g there" and
         would show that as a small non-zero, and the constrained maximum would
         come out low in the fifth digit. One more snap costs three evaluations
         and puts the walk back on g = 0 exactly. */
      return mvLevelSnap(G, pts[lo].x + (pts[hi].x - pts[lo].x) * u,
                            pts[lo].y + (pts[hi].y - pts[lo].y) * u, 4);
    }
  };
}
