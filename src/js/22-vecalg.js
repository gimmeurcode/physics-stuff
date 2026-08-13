/* ============================================================================
   1c · VECTOR ALGEBRA & ANALYTIC GEOMETRY  (Vectors in Space)
   Dot and cross products, projections, lines, planes, quadric surfaces and the
   three coordinate systems. Nothing here is a formula looked up: every distance
   is derived from a projection, and every projection from a dot product.
   ============================================================================ */

/* -------------------------------------------------------------- products ---- */
/* vdot / vcross / vlen / vnorm live in the renderer module; these are the
   quantities built on top of them that the geometry wing reads out. */

const gaAngle = (a, b) => {
  const d = vlen(a) * vlen(b);
  if(d < 1e-14) return NaN;
  /* clamp: |a·b| can exceed |a||b| by an ulp and Math.acos would return NaN */
  return Math.acos(Math.max(-1, Math.min(1, vdot(a, b) / d)));
};
/* the scalar projection comp_b a = a·b̂, and the vector projection proj_b a */
const gaScalarProj = (a, b) => { const L = vlen(b); return L < 1e-14 ? NaN : vdot(a, b) / L; };
const gaVectorProj = (a, b) => { const L2 = vdot(b, b); return L2 < 1e-14 ? v3(0,0,0) : vmul(b, vdot(a, b) / L2); };
/* the piece of a that the projection leaves behind — always orthogonal to b */
const gaOrthoComp = (a, b) => vsub(a, gaVectorProj(a, b));

/* direction cosines: the three angles a vector makes with the axes, whose
   squares must sum to one */
function gaDirCos(a){
  const L = vlen(a);
  if(L < 1e-14) return { cx:NaN, cy:NaN, cz:NaN, ax:NaN, ay:NaN, az:NaN, L:0 };
  const cx = a.x / L, cy = a.y / L, cz = a.z / L;
  return { cx, cy, cz, ax:Math.acos(cx), ay:Math.acos(cy), az:Math.acos(cz), L };
}

/* the scalar triple product a·(b×c) — signed volume of the parallelepiped, and
   the cleanest test for coplanarity there is */
const gaTriple = (a, b, c) => vdot(a, vcross(b, c));
const gaParallelepiped = (a, b, c) => Math.abs(gaTriple(a, b, c));
const gaParallelogram = (a, b) => vlen(vcross(a, b));

/* --------------------------------------------------------------- lines ------ */
/* A line is a point and a direction: r(t) = p + t·d. */
function gaLine(p, d){ return { p, d, u:vnorm(d) }; }
const gaLineAt = (L, t) => vadd(L.p, vmul(L.d, t));

/* distance from a point to a line: the length of the part of (q−p) that the
   projection onto d throws away */
function gaPointLineDist(q, L){
  const w = vsub(q, L.p);
  return vlen(gaOrthoComp(w, L.d));
}
/* the parameter of the closest point, so the stage can draw the foot */
function gaLineClosestT(q, L){
  const dd = vdot(L.d, L.d);
  return dd < 1e-14 ? 0 : vdot(vsub(q, L.p), L.d) / dd;
}
/* two lines are parallel, intersecting, or skew — and skew ones have a distance
   given by the triple product over the cross product's length */
function gaLinePair(L1, L2){
  const n = vcross(L1.d, L2.d), w = vsub(L2.p, L1.p);
  const nl = vlen(n);
  if(nl < 1e-11){
    const dist = gaPointLineDist(L2.p, L1);
    return { kind: dist < 1e-11 ? 'coincident' : 'parallel', dist, n:v3(0,0,0) };
  }
  const dist = Math.abs(vdot(w, n)) / nl;
  if(dist < 1e-11){
    /* they meet: solve for the two parameters from any two independent rows */
    const t = vdot(vcross(w, L2.d), n) / (nl * nl);
    const s = vdot(vcross(w, L1.d), n) / (nl * nl);
    return { kind:'intersecting', dist:0, t, s, at:gaLineAt(L1, t), n:vnorm(n) };
  }
  const t = vdot(vcross(w, L2.d), n) / (nl * nl);
  const s = vdot(vcross(w, L1.d), n) / (nl * nl);
  return { kind:'skew', dist, t, s, p1:gaLineAt(L1, t), p2:gaLineAt(L2, s), n:vnorm(n) };
}

/* --------------------------------------------------------------- planes ----- */
/* A plane is a point and a normal: n·(r − p) = 0, i.e. ax+by+cz = d. */
function gaPlane(p, n){ return { p, n, u:vnorm(n), d:vdot(n, p) }; }
function gaPlaneFrom3(a, b, c){ return gaPlane(a, vcross(vsub(b, a), vsub(c, a))); }
const gaPlaneEval = (P, q) => vdot(P.n, q) - P.d;
/* signed distance — the sign says which side, which is what the stage colours */
const gaPointPlaneSigned = (q, P) => gaPlaneEval(P, q) / (vlen(P.n) || 1);
const gaPointPlaneDist = (q, P) => Math.abs(gaPointPlaneSigned(q, P));
const gaFootOnPlane = (q, P) => vsub(q, vmul(P.u, gaPointPlaneSigned(q, P)));
/* the angle between two planes is the angle between their normals, taken acute */
function gaPlaneAngle(P1, P2){
  const a = gaAngle(P1.n, P2.n);
  return a > Math.PI / 2 ? Math.PI - a : a;
}
/* where a line meets a plane; null when the line runs parallel to it */
function gaLinePlane(L, P){
  const den = vdot(P.n, L.d);
  if(Math.abs(den) < 1e-13){
    return { kind: Math.abs(gaPlaneEval(P, L.p)) < 1e-11 ? 'in-plane' : 'parallel', t:NaN, at:null };
  }
  const t = (P.d - vdot(P.n, L.p)) / den;
  return { kind:'crosses', t, at:gaLineAt(L, t) };
}
/* the line where two planes meet: direction n₁×n₂, and one point on it found by
   solving the two plane equations plus the requirement of lying nearest the origin */
function gaPlanePair(P1, P2){
  const d = vcross(P1.n, P2.n), dl = vlen(d);
  if(dl < 1e-12){
    const same = Math.abs(gaPointPlaneSigned(P2.p, P1)) < 1e-11;
    return { kind: same ? 'coincident' : 'parallel', line:null, dist:gaPointPlaneDist(P2.p, P1) };
  }
  const M = [[P1.n.x, P1.n.y, P1.n.z], [P2.n.x, P2.n.y, P2.n.z], [d.x, d.y, d.z]];
  const p = nqSolve3(M, v3(P1.d, P2.d, 0));
  return { kind:'meets', line:gaLine(p || v3(0,0,0), d), angle:gaPlaneAngle(P1, P2), dist:0 };
}

/* ---------------------------------------------------- quadric surfaces ------ */
/* Each is stored as the coefficient triple of x²/a² ± y²/b² ± z²/c² = k, which
   is all the classification needs: the signs of the squared terms and whether a
   linear term stands in for one of them. */
const GA_QUADRICS = {
  ellipsoid: {
    name:'Ellipsoid', eq:'x²/a² + y²/b² + z²/c² = 1',
    sg:[1,1,1], rhs:1, lin:null,
    traces:'Every trace in every coordinate plane is an ellipse. Bounded in all directions — the only quadric that is.',
    ex:'a = b = c gives a sphere; the Earth is an oblate ellipsoid with a − c ≈ 21 km.'
  },
  hyper1: {
    name:'Hyperboloid of one sheet', eq:'x²/a² + y²/b² − z²/c² = 1',
    sg:[1,1,-1], rhs:1, lin:null,
    traces:'Horizontal traces are ellipses that never vanish; vertical traces are hyperbolas. Connected.',
    ex:'A doubly ruled surface: two whole families of straight lines lie in it, which is why cooling towers are built from straight rods.'
  },
  hyper2: {
    name:'Hyperboloid of two sheets', eq:'−x²/a² − y²/b² + z²/c² = 1',
    sg:[-1,-1,1], rhs:1, lin:null,
    traces:'Horizontal traces are empty for |z| < c and ellipses beyond it — hence the gap between the sheets.',
    ex:'The set of events at a fixed proper time from the origin: the mass shell of the relativity wing is this surface.'
  },
  cone: {
    name:'Elliptic cone', eq:'x²/a² + y²/b² − z²/c² = 0',
    sg:[1,1,-1], rhs:0, lin:null,
    traces:'The degenerate case between the two hyperboloids: the asymptotic surface both of them approach.',
    ex:'The light cone. Slicing it with a plane is where the conic sections got their name.'
  },
  elliparab: {
    name:'Elliptic paraboloid', eq:'z = x²/a² + y²/b²',
    sg:[1,1,0], rhs:0, lin:'z',
    traces:'Horizontal traces are ellipses; vertical traces are parabolas. One linear variable, two squared.',
    ex:'The shape of every satellite dish and every reflecting telescope: parallel rays all meet at the focus.'
  },
  hyperparab: {
    name:'Hyperbolic paraboloid', eq:'z = y²/b² − x²/a²',
    sg:[-1,1,0], rhs:0, lin:'z',
    traces:'Horizontal traces are hyperbolas that flip orientation through z = 0; vertical traces are parabolas opening opposite ways.',
    ex:'The saddle. The origin is a critical point that is a maximum along one axis and a minimum along the other — the standard example in the partial-derivatives wing.'
  },
  cylinder: {
    name:'Elliptic cylinder', eq:'x²/a² + y²/b² = 1',
    sg:[1,1,0], rhs:1, lin:null,
    traces:'A variable that does not appear at all is a variable you are free in: the trace is dragged along that whole axis.',
    ex:'Any curve in the plane, extruded. "Cylinder" in this subject does not mean circular.'
  },
  parabcyl: {
    name:'Parabolic cylinder', eq:'z = x²/a²',
    sg:[1,0,0], rhs:0, lin:'z',
    traces:'A parabola in the xz-plane, extruded along y.',
    ex:'The trough of a solar concentrator, and the shape of the free surface of a spinning liquid.'
  }
};
/* the implicit function whose zero set is the surface, so the drawing code and
   the classifier are looking at literally the same object */
function gaQuadricF(kind, a, b, c){
  const Q = GA_QUADRICS[kind];
  const ia = 1 / (a * a), ib = 1 / (b * b), ic = 1 / (c * c);
  if(Q.lin === 'z'){
    if(kind === 'parabcyl') return (x, y, z) => Q.sg[0] * x * x * ia - z;
    return (x, y, z) => Q.sg[0] * x * x * ia + Q.sg[1] * y * y * ib - z;
  }
  if(kind === 'cylinder') return (x, y, z) => x * x * ia + y * y * ib - 1;
  return (x, y, z) => Q.sg[0] * x * x * ia + Q.sg[1] * y * y * ib + Q.sg[2] * z * z * ic - Q.rhs;
}
/* the horizontal trace at height z, as a radius pair — empty when the ellipse
   has no real points, which is exactly the gap in the two-sheeted case */
function gaQuadricTrace(kind, a, b, c, z){
  const Q = GA_QUADRICS[kind];
  if(kind === 'parabcyl') return null;
  if(kind === 'cylinder') return { kind:'ellipse', rx:a, ry:b };
  if(Q.lin === 'z'){
    if(kind === 'elliparab') return z >= 0 ? { kind:'ellipse', rx:a * Math.sqrt(z), ry:b * Math.sqrt(z) } : null;
    return { kind:'hyperbola', z };
  }
  /* sg₀x²/a² + sg₁y²/b² = rhs − sg₂z²/c² = k.  Two like signs give an ellipse
     when k agrees with them and nothing at all when it does not — which is
     exactly the empty band between the sheets of a two-sheeted hyperboloid.
     Opposite signs give a hyperbola for every k. */
  const k = Q.rhs - Q.sg[2] * z * z / (c * c);
  if(Q.sg[0] > 0 && Q.sg[1] > 0){
    if(k < 0) return null;
    return { kind:'ellipse', rx:a * Math.sqrt(k), ry:b * Math.sqrt(k) };
  }
  if(Q.sg[0] < 0 && Q.sg[1] < 0){
    if(k > 0) return null;
    return { kind:'ellipse', rx:a * Math.sqrt(-k), ry:b * Math.sqrt(-k) };
  }
  return { kind:'hyperbola', z, k };
}

/* --------------------------------------------- coordinate systems ---------- */
/* Cylindrical (r, θ, z) and spherical (ρ, φ, θ) with φ from the +z axis, which
   is the convention the triple-integral wing uses for ρ² sinφ. */
function gaToCyl(x, y, z){ return { r:Math.hypot(x, y), th:Math.atan2(y, x), z }; }
function gaFromCyl(r, th, z){ return v3(r * Math.cos(th), r * Math.sin(th), z); }
function gaToSph(x, y, z){
  const rho = Math.sqrt(x * x + y * y + z * z);
  return { rho, ph: rho < 1e-14 ? 0 : Math.acos(z / rho), th:Math.atan2(y, x) };
}
function gaFromSph(rho, ph, th){
  const s = Math.sin(ph);
  return v3(rho * s * Math.cos(th), rho * s * Math.sin(th), rho * Math.cos(ph));
}
/* the volume elements — the Jacobian determinants of the two maps above, which
   the integration wing derives again from the Jacobian and must match */
const gaCylJac = r => r;
const gaSphJac = (rho, ph) => rho * rho * Math.sin(ph);
