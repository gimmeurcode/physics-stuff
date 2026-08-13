/* ============================================================================
   1d · CURVES — parametric equations, polar coordinates, conic sections, and
   vector-valued functions with their moving frames.

   A curve here is always a function t ↦ point, never a set of drawn segments.
   Tangents come from r′(t), curvature from r′ × r″, and arc length from the
   integral — so the picture and the numbers cannot drift apart.
   ============================================================================ */

/* ------------------------------------------------------- parametric plane ---- */
/* Each entry supplies x(t), y(t) and their first two derivatives in closed
   form. Differentiating numerically would work, but the cusp of a cycloid is
   exactly where a numerical derivative is worst, and the cusp is the point. */
const PC_PARAM = {
  circle: {
    name:'Circle', x:'a cos t', y:'a sin t', t0:0, t1:2 * Math.PI, a:2, b:1,
    f:(t, a) => ({ x:a * Math.cos(t), y:a * Math.sin(t) }),
    d:(t, a) => ({ x:-a * Math.sin(t), y:a * Math.cos(t) }),
    dd:(t, a) => ({ x:-a * Math.cos(t), y:-a * Math.sin(t) }),
    note:'The simplest closed parametrisation. Speed |r′| = a is constant, so the parameter is arc length divided by a.'
  },
  ellipse: {
    name:'Ellipse', x:'a cos t', y:'b sin t', t0:0, t1:2 * Math.PI, a:2.6, b:1.4,
    f:(t, a, b) => ({ x:a * Math.cos(t), y:b * Math.sin(t) }),
    d:(t, a, b) => ({ x:-a * Math.sin(t), y:b * Math.cos(t) }),
    dd:(t, a, b) => ({ x:-a * Math.cos(t), y:-b * Math.sin(t) }),
    note:'t is <i>not</i> the polar angle — it is the eccentric angle, read off the circumscribed circle. The two agree only when a = b.'
  },
  cycloid: {
    name:'Cycloid', x:'a(t − sin t)', y:'a(1 − cos t)', t0:0, t1:6 * Math.PI, a:0.9, b:1,
    f:(t, a) => ({ x:a * (t - Math.sin(t)), y:a * (1 - Math.cos(t)) }),
    d:(t, a) => ({ x:a * (1 - Math.cos(t)), y:a * Math.sin(t) }),
    dd:(t, a) => ({ x:a * Math.sin(t), y:a * Math.cos(t) }),
    note:'The path of a point on a rolling wheel. At t = 2πk the wheel\'s contact point is instantaneously at rest, r′ = 0, and the curve has a <b>cusp</b> — a place where dy/dx is undefined although the curve itself is perfectly definite.'
  },
  astroid: {
    name:'Astroid', x:'a cos³t', y:'a sin³t', t0:0, t1:2 * Math.PI, a:2.2, b:1,
    f:(t, a) => ({ x:a * Math.pow(Math.cos(t), 3), y:a * Math.pow(Math.sin(t), 3) }),
    d:(t, a) => ({ x:-3 * a * Math.cos(t) * Math.cos(t) * Math.sin(t),
                   y: 3 * a * Math.sin(t) * Math.sin(t) * Math.cos(t) }),
    dd:(t, a) => ({ x:a * (6 * Math.cos(t) * Math.sin(t) * Math.sin(t) - 3 * Math.pow(Math.cos(t), 3)),
                    y:a * (6 * Math.sin(t) * Math.cos(t) * Math.cos(t) - 3 * Math.pow(Math.sin(t), 3)) }),
    note:'Four cusps, at t = 0, π/2, π, 3π/2, where r′ vanishes again. Its Cartesian equation x^(2/3) + y^(2/3) = a^(2/3) hides all of that.'
  },
  lissajous: {
    name:'Lissajous', x:'a sin(3t)', y:'b sin(2t)', t0:0, t1:2 * Math.PI, a:2.2, b:2,
    f:(t, a, b) => ({ x:a * Math.sin(3 * t), y:b * Math.sin(2 * t) }),
    d:(t, a, b) => ({ x:3 * a * Math.cos(3 * t), y:2 * b * Math.cos(2 * t) }),
    dd:(t, a, b) => ({ x:-9 * a * Math.sin(3 * t), y:-4 * b * Math.sin(2 * t) }),
    note:'Two perpendicular oscillations at a rational frequency ratio. The curve closes because 3:2 is rational; an irrational ratio fills the rectangle densely and never closes.'
  },
  involute: {
    name:'Involute of a circle', x:'a(cos t + t sin t)', y:'a(sin t − t cos t)', t0:0, t1:5 * Math.PI, a:0.55, b:1,
    f:(t, a) => ({ x:a * (Math.cos(t) + t * Math.sin(t)), y:a * (Math.sin(t) - t * Math.cos(t)) }),
    d:(t, a) => ({ x:a * t * Math.cos(t), y:a * t * Math.sin(t) }),
    dd:(t, a) => ({ x:a * (Math.cos(t) - t * Math.sin(t)), y:a * (Math.sin(t) + t * Math.cos(t)) }),
    note:'The path of the end of a string unwound from a spool. Speed |r′| = a·t grows linearly, and this is the tooth profile of essentially every gear ever cut.'
  },
  folium: {
    name:'Folium of Descartes', x:'3at/(1+t³)', y:'3at²/(1+t³)', t0:-0.6, t1:14, a:1.6, b:1,
    f:(t, a) => { const d = 1 + t * t * t; return { x:3 * a * t / d, y:3 * a * t * t / d }; },
    d:(t, a) => {
      const d = 1 + t * t * t, d2 = d * d;
      return { x:3 * a * (1 - 2 * t * t * t) / d2, y:3 * a * t * (2 - t * t * t) / d2 };
    },
    dd:(t, a) => {
      const h = 1e-4, f1 = PC_PARAM.folium.d(t + h, a), f0 = PC_PARAM.folium.d(t - h, a);
      return { x:(f1.x - f0.x) / (2 * h), y:(f1.y - f0.y) / (2 * h) };
    },
    note:'x³ + y³ = 3axy, which no function y(x) can express — it fails the vertical line test twice over. A parametrisation has no such difficulty, which is the reason the subject exists.'
  }
};

/* dy/dx for a parametrised curve is the ratio of the two rates, and the second
   derivative is the derivative of that ratio divided by dx/dt again — the step
   students most often drop */
function pcSlope(P, t, a, b){
  const d = P.d(t, a, b);
  return d.y / d.x;
}
function pcSlope2(P, t, a, b){
  const d = P.d(t, a, b), dd = P.dd(t, a, b);
  /* d/dt(dy/dx) ÷ dx/dt = (x′y″ − y′x″)/x′³ */
  return (d.x * dd.y - d.y * dd.x) / (d.x * d.x * d.x);
}
const pcSpeed = (P, t, a, b) => { const d = P.d(t, a, b); return Math.hypot(d.x, d.y); };
/* arc length ∫√(x′² + y′²) dt, done adaptively so a cusp cannot spoil it */
function pcArcLength(P, a, b, t0, t1){
  return nqAdaptive(t => pcSpeed(P, t, a, b), t0, t1, 1e-10);
}
/* the plane curvature κ = |x′y″ − y′x″| / (x′² + y′²)^(3/2) */
function pcCurvature2(P, t, a, b){
  const d = P.d(t, a, b), dd = P.dd(t, a, b);
  const s = Math.hypot(d.x, d.y);
  return s < 1e-12 ? Infinity : Math.abs(d.x * dd.y - d.y * dd.x) / (s * s * s);
}
/* surface of revolution about the x-axis: S = 2π∫ y √(x′²+y′²) dt */
function pcSurfaceRev(P, a, b, t0, t1, axis){
  return 2 * Math.PI * nqAdaptive(t => {
    const p = P.f(t, a, b), d = P.d(t, a, b);
    const rad = axis === 'y' ? Math.abs(p.x) : Math.abs(p.y);
    return rad * Math.hypot(d.x, d.y);
  }, t0, t1, 1e-9);
}

/* ------------------------------------------------------------ polar curves ---- */
const PC_POLAR = {
  rose: { name:'Rose  r = a cos(kθ)', k:3, a:2.2, t0:0, t1:2 * Math.PI,
    f:(th, a, k) => a * Math.cos(k * th),
    d:(th, a, k) => -a * k * Math.sin(k * th),
    note:'k petals when k is odd, 2k when k is even — because an odd k retraces the same petals on the second circuit while an even k lays down a fresh set.' },
  cardioid: { name:'Cardioid  r = a(1 + cos θ)', k:1, a:1.5, t0:0, t1:2 * Math.PI,
    f:(th, a) => a * (1 + Math.cos(th)),
    d:(th, a) => -a * Math.sin(th),
    note:'The limaçon at exactly the point where the inner loop shrinks to a cusp. It is also the caustic you see in a coffee cup, and the classic microphone polar pattern.' },
  limacon: { name:'Limaçon  r = b + a cos θ', k:1, a:2.2, b:1, t0:0, t1:2 * Math.PI,
    f:(th, a, k, b) => (b === undefined ? 1 : b) + a * Math.cos(th),
    d:(th, a) => -a * Math.sin(th),
    note:'When a > b the curve has an inner loop, traced where r goes negative — a negative r means "that far in the opposite direction", which is a genuine part of the convention, not a mistake.' },
  lemniscate: { name:'Lemniscate  r² = a² cos 2θ', k:2, a:2.4, t0:-Math.PI / 4, t1:Math.PI / 4,
    f:(th, a) => { const c = Math.cos(2 * th); return c < 0 ? NaN : a * Math.sqrt(c); },
    d:(th, a) => { const c = Math.cos(2 * th); return c <= 0 ? NaN : -a * Math.sin(2 * th) / Math.sqrt(c); },
    note:'Defined only where cos 2θ ≥ 0, so the curve exists in two wedges and nowhere else. Bernoulli found it as the locus of points whose distances to two foci have a constant <i>product</i>.' },
  spiral: { name:'Archimedean spiral  r = aθ', k:1, a:0.32, t0:0, t1:6 * Math.PI,
    f:(th, a) => a * th, d:(th, a) => a,
    note:'Successive turns are a constant 2πa apart, which is why a groove cut this way holds a record.' },
  logspiral: { name:'Logarithmic spiral  r = ae^(0.2θ)', k:1, a:0.22, t0:-2 * Math.PI, t1:4 * Math.PI,
    f:(th, a) => a * Math.exp(0.2 * th), d:(th, a) => 0.2 * a * Math.exp(0.2 * th),
    note:'Self-similar: zooming in reproduces the curve exactly. The angle between the radius and the tangent is constant — arctan(1/0.2) ≈ 78.7° — which is why a moth flying at a fixed angle to a light spirals into it.' }
};
/* polar → Cartesian, with r allowed to be negative */
const pcPolarPt = (r, th) => ({ x:r * Math.cos(th), y:r * Math.sin(th) });
/* area swept: ½∫r²dθ. This is not the same as ∫y dx and the difference matters. */
function pcPolarArea(F, t0, t1, a, k, b){
  return 0.5 * nqAdaptive(th => { const r = F(th, a, k, b); return Number.isFinite(r) ? r * r : 0; }, t0, t1, 1e-11);
}
/* arc length ∫√(r² + (dr/dθ)²) dθ */
function pcPolarArc(F, D, t0, t1, a, k, b){
  return nqAdaptive(th => {
    const r = F(th, a, k, b), dr = D(th, a, k, b);
    return (Number.isFinite(r) && Number.isFinite(dr)) ? Math.hypot(r, dr) : 0;
  }, t0, t1, 1e-10);
}
/* the slope of a polar curve in the plane: dy/dx from the product rule on
   x = r cos θ, y = r sin θ — a step that catches everybody once */
function pcPolarSlope(F, D, th, a, k, b){
  const r = F(th, a, k, b), dr = D(th, a, k, b);
  const dx = dr * Math.cos(th) - r * Math.sin(th);
  const dy = dr * Math.sin(th) + r * Math.cos(th);
  return dy / dx;
}

/* ------------------------------------------------------------- conics ------- */
/* Every conic is the set of points whose distance to a focus is e times the
   distance to a directrix. That single definition is stored here, and the
   familiar equations are derived from it in the readout. */
const PC_CONICS = {
  ellipse:   { name:'Ellipse',   test:e => e < 1 },
  parabola:  { name:'Parabola',  test:e => Math.abs(e - 1) < 1e-9 },
  hyperbola: { name:'Hyperbola', test:e => e > 1 }
};
function pcConicKind(e){
  if(Math.abs(e) < 1e-12) return 'circle';
  if(e < 1 - 1e-9) return 'ellipse';
  if(e > 1 + 1e-9) return 'hyperbola';
  return 'parabola';
}
/* the polar form with a focus at the origin: r = ep/(1 + e cos θ) */
const pcConicPolar = (th, e, p) => e * p / (1 + e * Math.cos(th));
/* the standard-position data: semi-axes, focal distance, directrix */
function pcConicData(e, p){
  const kind = pcConicKind(e);
  if(kind === 'parabola') return { kind, a:Infinity, b:Infinity, c:Infinity, e, p, latus:2 * p };
  const a = e * p / Math.abs(1 - e * e);
  const c = a * e;
  const b = kind === 'ellipse' ? a * Math.sqrt(1 - e * e) : a * Math.sqrt(e * e - 1);
  return { kind, a, b, c, e, p, latus:2 * b * b / a,
           dirx: kind === 'ellipse' ? a / e : a / e,
           asym: kind === 'hyperbola' ? b / a : NaN };
}
/* the eccentricity from the two axes, the other direction round */
const pcEccFromAxes = (a, b) => (a >= b ? Math.sqrt(1 - (b * b) / (a * a)) : Math.sqrt(1 - (a * a) / (b * b)));
/* Ramanujan's second approximation for the ellipse perimeter, printed beside
   the honest numerical arc length so the agreement can be checked */
function pcEllipsePerimApprox(a, b){
  const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
  return Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));
}

/* ------------------------------------------------- space curves & frames ---- */
/* Vector-valued functions r(t) with closed-form r′ and r″. */
const PC_SPACE = {
  helix: {
    name:'Circular helix', eq:'⟨a cos t, a sin t, ct⟩', t0:-3 * Math.PI, t1:3 * Math.PI, a:1.6, c:0.45,
    f:(t, a, c) => v3(a * Math.cos(t), a * Math.sin(t), c * t),
    d:(t, a, c) => v3(-a * Math.sin(t), a * Math.cos(t), c),
    dd:(t, a, c) => v3(-a * Math.cos(t), -a * Math.sin(t), 0),
    ddd:(t, a, c) => v3(a * Math.sin(t), -a * Math.cos(t), 0),
    note:'The only curve with both κ and τ constant. κ = a/(a²+c²) and τ = c/(a²+c²) — set c = 0 and the torsion vanishes, leaving a circle of curvature 1/a.'
  },
  twisted: {
    name:'Twisted cubic', eq:'⟨t, t², t³⟩', t0:-1.7, t1:1.7, a:1, c:1,
    f:(t) => v3(t, t * t, t * t * t),
    d:(t) => v3(1, 2 * t, 3 * t * t),
    dd:(t) => v3(0, 2, 6 * t),
    ddd:(t) => v3(0, 0, 6),
    note:'The standard example of a curve that is genuinely three-dimensional: no plane contains it, which is exactly the statement that its torsion is never zero.'
  },
  toroidal: {
    name:'Toroidal spiral', eq:'⟨(2+cos 8t)cos t, (2+cos 8t)sin t, sin 8t⟩', t0:0, t1:2 * Math.PI, a:1, c:1,
    f:(t) => v3((2 + Math.cos(8 * t)) * Math.cos(t), (2 + Math.cos(8 * t)) * Math.sin(t), Math.sin(8 * t)),
    d:(t) => v3(-8 * Math.sin(8 * t) * Math.cos(t) - (2 + Math.cos(8 * t)) * Math.sin(t),
                -8 * Math.sin(8 * t) * Math.sin(t) + (2 + Math.cos(8 * t)) * Math.cos(t),
                8 * Math.cos(8 * t)),
    dd:(t) => v3(-64 * Math.cos(8*t) * Math.cos(t) + 16 * Math.sin(8*t) * Math.sin(t) - (2 + Math.cos(8*t)) * Math.cos(t),
                 -64 * Math.cos(8*t) * Math.sin(t) - 16 * Math.sin(8*t) * Math.cos(t) - (2 + Math.cos(8*t)) * Math.sin(t),
                 -64 * Math.sin(8 * t)),
    ddd:null,
    note:'A curve wound on a torus. Curvature swings by more than an order of magnitude around one circuit — watch the osculating circle inflate and shrink.'
  },
  conical: {
    name:'Conical helix', eq:'⟨t cos 4t, t sin 4t, t⟩', t0:0.05, t1:2.6, a:1, c:1,
    f:(t) => v3(t * Math.cos(4 * t), t * Math.sin(4 * t), t),
    d:(t) => v3(Math.cos(4*t) - 4 * t * Math.sin(4*t), Math.sin(4*t) + 4 * t * Math.cos(4*t), 1),
    dd:(t) => v3(-8 * Math.sin(4*t) - 16 * t * Math.cos(4*t), 8 * Math.cos(4*t) - 16 * t * Math.sin(4*t), 0),
    ddd:null,
    note:'A helix whose radius grows with height. Curvature falls off as the turns open out, which is the whole design principle of a conical spring.'
  }
};

/* the Frenet–Serret frame, built the way the definitions say: T from r′, N from
   the derivative of T, B from their cross product */
function pcFrame(C, t, a, c){
  const r = C.f(t, a, c), d = C.d(t, a, c), dd = C.dd(t, a, c);
  const sp = vlen(d);
  const T = sp < 1e-12 ? v3(0,0,0) : vmul(d, 1 / sp);
  const cr = vcross(d, dd), crl = vlen(cr);
  const kappa = sp < 1e-12 ? NaN : crl / (sp * sp * sp);
  const B = crl < 1e-12 ? v3(0,0,0) : vmul(cr, 1 / crl);
  const N = vcross(B, T);
  /* torsion needs the third derivative; where it is not in closed form, take it
     numerically from r″ — still exact enough to show τ = 0 for a plane curve */
  let ddd;
  if(C.ddd) ddd = C.ddd(t, a, c);
  else {
    const h = 1e-4, p = C.dd(t + h, a, c), m = C.dd(t - h, a, c);
    ddd = vmul(vsub(p, m), 1 / (2 * h));
  }
  const tau = crl < 1e-12 ? NaN : vdot(cr, ddd) / (crl * crl);
  return { r, d, dd, T, N, B, kappa, tau, speed:sp,
           radius: kappa > 1e-12 ? 1 / kappa : Infinity,
           centre: kappa > 1e-12 ? vadd(r, vmul(N, 1 / kappa)) : null };
}
const pcArcLength3 = (C, t0, t1, a, c) => nqAdaptive(t => vlen(C.d(t, a, c)), t0, t1, 1e-10);

/* the tangential/normal split of acceleration.
   a = a_T T + a_N N with a_T = d|v|/dt = (v·a)/|v| and a_N = κ|v|².
   The identity a_T² + a_N² = |a|² is what the readout checks. */
function pcAccelSplit(C, t, a, c){
  const F = pcFrame(C, t, a, c);
  const v = F.d, acc = F.dd, sp = F.speed;
  const aT = sp < 1e-12 ? NaN : vdot(v, acc) / sp;
  const aN = vlen(vcross(v, acc)) / (sp < 1e-12 ? NaN : sp);
  return { aT, aN, mag:vlen(acc), speed:sp, kappa:F.kappa, frame:F,
           residual:Math.abs(aT * aT + aN * aN - vdot(acc, acc)) };
}
