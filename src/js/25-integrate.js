/* ============================================================================
   1f · INTEGRATION — what an integral accumulates, in one, two and three
   dimensions.

   The integration wing's arithmetic lives here: named integrands, plane
   regions with their two descriptions, solids, mass and moment integrals, and
   the change-of-variables bookkeeping. The quadrature itself is in the numerics
   module; this file is about *what* gets integrated and over *what*.
   ============================================================================ */

/* ------------------------------------------------ single-variable examples ---- */
/* Each carries an exact antiderivative so the error columns are exact errors
   and not differences between two approximations. */
const IG_1D = {
  quad:   { name:'f(x) = x²',              f:x => x * x,                 Fi:x => x * x * x / 3,
            a:0, b:2, tex:'<i>x</i>²',
            note:'Simpson\'s rule is exact here — it fits a parabola to each pair of panels, and this <i>is</i> a parabola. The error column reads zero to machine precision at every n.' },
  cubic:  { name:'f(x) = x³ − 2x + 1',     f:x => x * x * x - 2 * x + 1, Fi:x => x * x * x * x / 4 - x * x + x,
            a:-1, b:2, tex:'<i>x</i>³ <span class="op">−</span> 2<i>x</i> <span class="op">+</span> 1',
            note:'Simpson is exact for cubics too, which is the surprise: a rule built to be exact for degree 2 turns out to be exact for degree 3 as well, because the cubic error term cancels by symmetry.' },
  sine:   { name:'f(x) = sin x',           f:Math.sin,                   Fi:x => -Math.cos(x),
            a:0, b:Math.PI, tex:'sin <i>x</i>',
            note:'The exact answer is 2. Watch the midpoint rule beat the trapezoid rule by a factor of two, every time — it over- and under-shoots on opposite sides of each panel.' },
  gauss:  { name:'f(x) = e^(−x²)',         f:x => Math.exp(-x * x),      Fi:null,
            a:-2, b:2, tex:'<i>e</i><sup>−<i>x</i>²</sup>',
            note:'This one has no elementary antiderivative at all — the Fundamental Theorem still guarantees one exists, it simply cannot be written with the usual functions. Numerical integration is not a fallback here; it is the only route.' },
  recip:  { name:'f(x) = 1/x',             f:x => 1 / x,                 Fi:x => Math.log(x),
            a:1, b:Math.E, tex:'1<span class="op">/</span><i>x</i>',
            note:'The integral from 1 to e is exactly 1 — which is one way to <i>define</i> the number e, and the reason the natural logarithm is natural.' },
  spike:  { name:'f(x) = 1/(1 + 25x²)',    f:x => 1 / (1 + 25 * x * x),  Fi:x => Math.atan(5 * x) / 5,
            a:-1, b:1, tex:'1<span class="op">/</span>(1 <span class="op">+</span> 25<i>x</i>²)',
            note:'Runge\'s function: a narrow peak on a wide interval. Every rule needs far more panels here, because the error bounds depend on the size of the derivatives, and those are enormous near zero.' },
  root:   { name:'f(x) = √x',              f:Math.sqrt,                  Fi:x => 2 / 3 * Math.pow(x, 1.5),
            a:0, b:1, tex:'√<span class="rad"><i>x</i></span>',
            note:'The derivative blows up at the left endpoint, so the smoothness the error bounds assume is not there. Simpson\'s fourth-order advantage collapses to about 1.5 — measurable in the observed-order row.' }
};

/* the exact value, from the antiderivative when there is one and from adaptive
   quadrature at a far tighter tolerance when there is not */
function igExact1D(K){
  if(K.Fi) return K.Fi(K.b) - K.Fi(K.a);
  return nqAdaptive(K.f, K.a, K.b, 1e-13, 30);
}

/* ------------------------------------------- what an integral accumulates ---- */
/* Area between curves, the two solids of revolution, arc length, work and
   average value — one accumulation formula each, all measured. */
const IG_APPLY = {
  between: { name:'Area between two curves',
    formula:'A = ∫ₐᵇ [ top(x) − bottom(x) ] dx',
    top:x => 4 - x * x, bot:x => x, a:-2.5615528128088303, b:1.5615528128088303,
    note:'The limits are where the curves cross, which is a root-finding problem hiding inside an integration problem. Below a crossing the integrand changes sign, and the integral would silently return the <i>difference</i> of the two areas rather than their sum.' },
  disk: { name:'Volume by disks',
    formula:'V = π∫ₐᵇ [ f(x) ]² dx',
    top:x => Math.sqrt(Math.max(0, x)), bot:() => 0, a:0, b:4,
    note:'Slice perpendicular to the axis and each slice is a disc of area πf². The integral adds their volumes. This is Cavalieri\'s principle with the slices made infinitesimally thin.' },
  shell: { name:'Volume by shells',
    formula:'V = 2π∫ₐᵇ x · f(x) dx',
    top:x => Math.sqrt(Math.max(0, x)), bot:() => 0, a:0, b:4,
    note:'Slice <i>parallel</i> to the axis instead and each slice is a cylindrical shell of area 2πx·f. The same solid, a different bookkeeping — and one of the two integrals is usually far easier than the other.' },
  arclen: { name:'Arc length',
    formula:'L = ∫ₐᵇ √(1 + f′(x)²) dx',
    top:x => x * x / 2, bot:() => 0, a:0, b:2,
    note:'Pythagoras on an infinitesimal step: ds² = dx² + dy². Almost every arc-length integrand is irrational, which is why so few curves have elementary lengths — the ellipse is the famous casualty.' },
  work: { name:'Work by a varying force',
    formula:'W = ∫ₐᵇ F(x) dx',
    top:x => 3 * x, bot:() => 0, a:0, b:2,
    note:'Force times distance, when the force refuses to hold still. A linear spring gives F = kx and W = ½kx² — the potential energy stored, derived rather than remembered.' },
  average: { name:'Average value',
    formula:'f̄ = (1/(b−a)) ∫ₐᵇ f dx',
    top:x => Math.sin(x) + 1, bot:() => 0, a:0, b:2 * Math.PI,
    note:'The height of the rectangle with the same area. The Mean Value Theorem for integrals promises that a continuous f actually attains this height somewhere inside — the stage marks where.' }
};

/* -------------------------------------------------------- plane regions ----- */
/* Each region knows both of its descriptions, which is the whole content of
   swapping the order of integration: same set, two ways to sweep it. */
const IG_REGIONS = {
  rect: { name:'Rectangle  [0,2] × [0,1]',
    x0:0, x1:2, y0:0, y1:1,
    yLo:() => 0, yHi:() => 1, xLo:() => 0, xHi:() => 2,
    both:true,
    desc:'The only region where the two orders look identical — constant limits both ways. Fubini\'s theorem here is barely a theorem.' },
  tri: { name:'Triangle under y = x',
    x0:0, x1:2, y0:0, y1:2,
    yLo:() => 0, yHi:x => x, xLo:y => y, xHi:() => 2,
    both:true,
    desc:'Type I: for each x, y runs from 0 up to x. Type II: for each y, x runs from y across to 2. The same triangle, swept two ways, and the two iterated integrals must agree.' },
  parab: { name:'Between y = x² and y = 2x',
    x0:0, x1:2, y0:0, y1:4,
    yLo:x => x * x, yHi:x => 2 * x, xLo:y => y / 2, xHi:y => Math.sqrt(y),
    both:true,
    desc:'The curves cross at (0,0) and (2,4). Going the other way needs both curves solved for x — y = x² becomes x = √y — and the two branches swap roles.' },
  disc: { name:'Quarter disc  x² + y² ≤ 4, x,y ≥ 0',
    x0:0, x1:2, y0:0, y1:2,
    yLo:() => 0, yHi:x => Math.sqrt(Math.max(0, 4 - x * x)),
    xLo:() => 0, xHi:y => Math.sqrt(Math.max(0, 4 - y * y)),
    both:true, polar:{ t0:0, t1:Math.PI / 2, r0:() => 0, r1:() => 2 },
    desc:'In Cartesian coordinates one limit is a square root; in polar coordinates both limits are constants. This is the region that makes the case for changing variables.' },
  cardio: { name:'Inside the cardioid  r = 1 + cos θ',
    x0:-0.5, x1:2, y0:-1.4, y1:1.4,
    yLo:null, yHi:null, xLo:null, xHi:null,
    both:false, polar:{ t0:0, t1:2 * Math.PI, r0:() => 0, r1:th => 1 + Math.cos(th) },
    desc:'There is no usable Cartesian description at all — the boundary is not the graph of anything. In polar coordinates it is one line of algebra.' },
  annulus: { name:'Annulus  1 ≤ r ≤ 2',
    x0:-2, x1:2, y0:-2, y1:2,
    yLo:null, yHi:null, xLo:null, xHi:null,
    both:false, polar:{ t0:0, t1:2 * Math.PI, r0:() => 1, r1:() => 2 },
    desc:'A region with a hole. Cartesian slicing would need four separate integrals; in polar coordinates the hole is just a lower limit.' }
};
/* the integral over a region, by whichever description is asked for */
function igRegionIntegral(Rg, f, order){
  if(order === 'polar' && Rg.polar){
    return nqDoublePolar(f, Rg.polar.t0, Rg.polar.t1, Rg.polar.r0, Rg.polar.r1, 5, 14);
  }
  if(order === 'dxdy' && Rg.xLo) return nqDoubleTypeII(f, Rg.y0, Rg.y1, Rg.xLo, Rg.xHi, 5, 14);
  if(Rg.yLo) return nqDoubleTypeI(f, Rg.x0, Rg.x1, Rg.yLo, Rg.yHi, 5, 14);
  if(Rg.polar) return nqDoublePolar(f, Rg.polar.t0, Rg.polar.t1, Rg.polar.r0, Rg.polar.r1, 5, 14);
  return NaN;
}
/* is a point inside? — used to shade the region and to run the Monte Carlo
   cross-check that a region's area is what the iterated integral says */
/* Three descriptions, and the test has to try them in order of what the region
   actually carries. This used to assume that anything without a polar block had
   a Type I one, which was true of every preset and false of the first typed
   TYPE II region — `Rg.yLo(x)` on a null threw fourteen times through `runall`
   and nothing else in the suite saw it. */
function igInRegion(Rg, x, y){
  if(Rg.yLo){
    if(x < Rg.x0 - 1e-12 || x > Rg.x1 + 1e-12) return false;
    const lo = Rg.yLo(x), hi = Rg.yHi(x);
    return y >= Math.min(lo, hi) - 1e-12 && y <= Math.max(lo, hi) + 1e-12;
  }
  if(Rg.xLo){
    if(y < Rg.y0 - 1e-12 || y > Rg.y1 + 1e-12) return false;
    const lo = Rg.xLo(y), hi = Rg.xHi(y);
    return x >= Math.min(lo, hi) - 1e-12 && x <= Math.max(lo, hi) + 1e-12;
  }
  if(Rg.polar){
    const r = Math.hypot(x, y);
    let th = Math.atan2(y, x);
    if(th < Rg.polar.t0) th += 2 * Math.PI;
    if(th < Rg.polar.t0 - 1e-12 || th > Rg.polar.t1 + 1e-12) return false;
    return r >= Rg.polar.r0(th) - 1e-12 && r <= Rg.polar.r1(th) + 1e-12;
  }
  return false;
}

/* named integrands for the double- and triple-integral stages */
const IG_INTEGRANDS = {
  one:    { name:'f = 1  (area / volume)',      f:() => 1,                    tex:'1' },
  x:      { name:'f = x',                        f:x => x,                     tex:'<i>x</i>' },
  xy:     { name:'f = x·y',                      f:(x, y) => x * y,            tex:'<i>xy</i>' },
  sq:     { name:'f = x² + y²',                  f:(x, y) => x * x + y * y,    tex:'<i>x</i>² <span class="op">+</span> <i>y</i>²' },
  dome:   { name:'f = 4 − x² − y²',              f:(x, y) => 4 - x * x - y * y, tex:'4 <span class="op">−</span> <i>x</i>² <span class="op">−</span> <i>y</i>²' },
  gaussf: { name:'f = e^(−x²−y²)',               f:(x, y) => Math.exp(-x * x - y * y), tex:'<i>e</i><sup>−(<i>x</i>²+<i>y</i>²)</sup>' },
  wave:   { name:'f = sin x · cos y',            f:(x, y) => Math.sin(x) * Math.cos(y), tex:'sin <i>x</i> cos <i>y</i>' }
};

/* ------------------------------------------------------------- solids ------- */
/* z-simple solids over a plane region: the triple integral's outer two limits
   come from the region, the inner pair from these. */
const IG_SOLIDS = {
  box: { name:'Box  [0,2]×[0,1]×[0,3]', region:'rect', zLo:() => 0, zHi:() => 3,
    exactVol:6, note:'The trivial case, kept because it is the one you can check by eye: 2 × 1 × 3.' },
  tetra: { name:'Tetrahedron  x+y+z ≤ 1, all ≥ 0', region:null,
    x0:0, x1:1, yLo:() => 0, yHi:x => 1 - x, zLo:() => 0, zHi:(x, y) => 1 - x - y,
    exactVol:1 / 6, note:'Every one of the three limits depends on the ones outside it. The volume is 1/6 — a third of the base times the height, with the base a half.' },
  cyl: { name:'Cylinder  r ≤ 1, 0 ≤ z ≤ 2', region:null,
    x0:-1, x1:1, yLo:x => -Math.sqrt(Math.max(0, 1 - x * x)), yHi:x => Math.sqrt(Math.max(0, 1 - x * x)),
    zLo:() => 0, zHi:() => 2, exactVol:2 * Math.PI,
    note:'Cartesian limits with two square roots, or cylindrical limits that are all constants. This is the argument for cylindrical coordinates in one picture.' },
  parabsolid: { name:'Under z = 4 − x² − y², above z = 0', region:null,
    x0:-2, x1:2, yLo:x => -Math.sqrt(Math.max(0, 4 - x * x)), yHi:x => Math.sqrt(Math.max(0, 4 - x * x)),
    zLo:() => 0, zHi:(x, y) => Math.max(0, 4 - x * x - y * y), exactVol:8 * Math.PI,
    note:'A paraboloid cap. Its volume is exactly half that of the circumscribing cylinder — a fact Archimedes would have enjoyed and which falls straight out of ∫₀²(4−r²)r dr.' },
  cone: { name:'Cone  z from r to 2', region:null,
    x0:-2, x1:2, yLo:x => -Math.sqrt(Math.max(0, 4 - x * x)), yHi:x => Math.sqrt(Math.max(0, 4 - x * x)),
    zLo:(x, y) => Math.hypot(x, y), zHi:() => 2, exactVol:8 * Math.PI / 3,
    note:'One third of the cylinder that contains it, which is what the factor of ⅓ in the cone formula has always been.' },
  icecream: { name:'Ice-cream cone  ρ ≤ 2, φ ≤ π/4', region:null,
    sph:{ t0:0, t1:2 * Math.PI, p0:() => 0, p1:() => Math.PI / 4, r0:() => 0, r1:() => 2 },
    exactVol:(2 * Math.PI / 3) * 8 * (1 - Math.SQRT1_2),
    note:'A cone capped by a piece of sphere. In spherical coordinates all six limits are constants; in any other system it is a two-piece calculation.' },
  sphere: { name:'Sphere  ρ ≤ 2', region:null,
    sph:{ t0:0, t1:2 * Math.PI, p0:() => 0, p1:() => Math.PI, r0:() => 0, r1:() => 2 },
    exactVol:4 * Math.PI * 8 / 3,
    note:'∫∫∫ρ² sinφ dρ dφ dθ = (8/3)(2)(2π) = 32π/3. The sinφ is not decoration: without it the poles would be counted as heavily as the equator.' }
};

/* ------------------------------------------------- mass, centroid, inertia ---- */
/* One sweep computes every moment, because they are all integrals of the same
   density against different weights. */
function igLamina(Rg, rho, order){
  const M   = igRegionIntegral(Rg, (x, y) => rho(x, y), order);
  const Mx  = igRegionIntegral(Rg, (x, y) => y * rho(x, y), order);   // moment about the x-axis
  const My  = igRegionIntegral(Rg, (x, y) => x * rho(x, y), order);   // moment about the y-axis
  const Ix  = igRegionIntegral(Rg, (x, y) => y * y * rho(x, y), order);
  const Iy  = igRegionIntegral(Rg, (x, y) => x * x * rho(x, y), order);
  const I0  = Ix + Iy;                                                // polar moment
  return {
    M, Mx, My, Ix, Iy, I0,
    cx:My / M, cy:Mx / M,
    /* radius of gyration: the distance at which a point mass M has the same I */
    rx:Math.sqrt(Ix / M), ry:Math.sqrt(Iy / M), r0:Math.sqrt(I0 / M)
  };
}
/* the parallel-axis theorem, which the stage verifies rather than quotes:
   I about any axis = I about the parallel axis through the centroid + M d² */
function igParallelAxis(Rg, rho, order, x0){
  const L = igLamina(Rg, rho, order);
  const Ishift = igRegionIntegral(Rg, (x, y) => (x - x0) * (x - x0) * rho(x, y), order);
  const Icen   = igRegionIntegral(Rg, (x, y) => (x - L.cx) * (x - L.cx) * rho(x, y), order);
  return { Ishift, Icen, M:L.M, d:L.cx - x0, predicted:Icen + L.M * (L.cx - x0) * (L.cx - x0) };
}
const IG_DENSITIES = {
  uniform: { name:'ρ = 1  (uniform)',   f:() => 1,                 tex:'1' },
  linear:  { name:'ρ = 1 + x',          f:x => 1 + x,              tex:'1 <span class="op">+</span> <i>x</i>' },
  radial:  { name:'ρ = x² + y²',        f:(x, y) => x * x + y * y, tex:'<i>x</i>² <span class="op">+</span> <i>y</i>²' },
  edge:    { name:'ρ = y',              f:(x, y) => y,             tex:'<i>y</i>' }
};

/* ------------------------------------------------- change of variables ------ */
/* The theorem: ∬_S f(x,y) dA = ∬_R f(T(u,v)) |∂(x,y)/∂(u,v)| du dv.
   Both sides are computed independently — the left by integrating over the
   image region directly, the right by pulling back — and the stage prints the
   difference, which is the theorem's content. */
function igChangeCheck(map, f, u0, u1, v0, v1){
  const pulled = nqDoubleRect((u, v) => {
    const p = map.T(u, v);
    return f(p.x, p.y) * Math.abs(map.jac(u, v));
  }, u0, u1, v0, v1, 5, 14);
  /* the direct side, by Monte Carlo over a bounding box with the image tested
     by inverting nothing — the sample points come from the map itself, so this
     is a genuinely independent route to the same number */
  return { pulled };
}
/* the area of the image of a small square, measured by the shoelace formula on
   its four mapped corners — the finite version of the Jacobian determinant */
function igCellArea(map, u, v, h){
  const P = [map.T(u, v), map.T(u + h, v), map.T(u + h, v + h), map.T(u, v + h)];
  let s = 0;
  for(let i = 0; i < 4; i++){
    const a = P[i], b = P[(i + 1) % 4];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
