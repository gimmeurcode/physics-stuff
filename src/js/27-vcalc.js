/* ============================================================================
   1h · THE INTEGRAL THEOREMS
   Line integrals, conservative fields, Green's theorem, parametrised surfaces
   and their flux, Stokes' theorem and the divergence theorem.

   Each theorem equates two integrals of different dimension. Every stage in the
   vector-calculus wing computes *both* sides independently, with quadrature
   that knows nothing about the theorem, and reports the difference. That
   difference is the evidence; the equation is only the claim.
   ============================================================================ */

/* ---------------------------------------------------------- plane curves ---- */
/* Closed and open paths used by the line-integral and Green's-theorem stages.
   Each supplies r(t) and r′(t) in closed form. */
const VC_PATHS = {
  circle: { name:'Circle of radius a', t0:0, t1:2 * Math.PI, closed:true, a:1.4,
    f:(t, a) => ({ x:a * Math.cos(t), y:a * Math.sin(t) }),
    d:(t, a) => ({ x:-a * Math.sin(t), y:a * Math.cos(t) }),
    inside:(x, y, a) => x * x + y * y <= a * a,
    note:'Traversed counter-clockwise, which is the positive orientation: the enclosed region stays on your left.' },
  ellipse: { name:'Ellipse', t0:0, t1:2 * Math.PI, closed:true, a:1.9, b:1.1,
    f:(t, a, b) => ({ x:a * Math.cos(t), y:b * Math.sin(t) }),
    d:(t, a, b) => ({ x:-a * Math.sin(t), y:b * Math.cos(t) }),
    inside:(x, y, a, b) => (x * x) / (a * a) + (y * y) / (b * b) <= 1,
    note:'Green\'s theorem cares about the region, not its shape — the double integral is the same however the boundary wobbles, provided it encloses the same area.' },
  square: { name:'Square', t0:0, t1:4, closed:true, a:1.5,
    f:(t, a) => {
      const s = ((t % 4) + 4) % 4;
      if(s < 1) return { x:-a + 2 * a * s, y:-a };
      if(s < 2) return { x:a, y:-a + 2 * a * (s - 1) };
      if(s < 3) return { x:a - 2 * a * (s - 2), y:a };
      return { x:-a, y:a - 2 * a * (s - 3) };
    },
    d:(t, a) => {
      const s = ((t % 4) + 4) % 4;
      if(s < 1) return { x:2 * a, y:0 };
      if(s < 2) return { x:0, y:2 * a };
      if(s < 3) return { x:-2 * a, y:0 };
      return { x:0, y:-2 * a };
    },
    inside:(x, y, a) => Math.abs(x) <= a && Math.abs(y) <= a,
    note:'Corners make r′ discontinuous, and the quadrature has to be told about them — integrating blind across a corner is the commonest way to get a wrong answer here.' },
  cardioid: { name:'Cardioid  r = a(1 + cos θ)', t0:0, t1:2 * Math.PI, closed:true, a:0.9,
    f:(t, a) => { const r = a * (1 + Math.cos(t)); return { x:r * Math.cos(t), y:r * Math.sin(t) }; },
    d:(t, a) => {
      const r = a * (1 + Math.cos(t)), dr = -a * Math.sin(t);
      return { x:dr * Math.cos(t) - r * Math.sin(t), y:dr * Math.sin(t) + r * Math.cos(t) };
    },
    inside:(x, y, a) => {
      const r = Math.hypot(x, y), th = Math.atan2(y, x);
      return r <= a * (1 + Math.cos(th));
    },
    note:'A boundary with a cusp. The area integral is still perfectly finite, which is a useful reminder that Green\'s theorem asks for a piecewise-smooth boundary and no more.' },
  segment: { name:'Straight line  (−1,−1) → (2,1)', t0:0, t1:1, closed:false,
    f:(t) => ({ x:-1 + 3 * t, y:-1 + 2 * t }), d:() => ({ x:3, y:2 }),
    note:'The reference path for testing path independence.' },
  parabola: { name:'Parabola through the same endpoints', t0:0, t1:1, closed:false,
    /* y = ½x² + x/6 − 4/3, the parabola through (−1,−1) and (2,1) */
    f:(t) => { const x = -1 + 3 * t; return { x, y:0.5 * x * x + x / 6 - 4 / 3 }; },
    d:(t) => { const x = -1 + 3 * t; return { x:3, y:3 * (x + 1 / 6) }; },
    note:'A second route between the same endpoints, curving the other way from the arc.' },
  arc: { name:'Circular arc through the same endpoints', t0:0, t1:1, closed:false,
    f:(t) => {
      /* a semicircular bulge added to the straight path, still hitting both ends */
      const x = -1 + 3 * t, y = -1 + 2 * t;
      const bulge = Math.sin(Math.PI * t) * 1.1;
      return { x:x - bulge * (2 / Math.sqrt(13)), y:y + bulge * (3 / Math.sqrt(13)) };
    },
    d:(t) => {
      const db = Math.PI * Math.cos(Math.PI * t) * 1.1;
      return { x:3 - db * (2 / Math.sqrt(13)), y:2 + db * (3 / Math.sqrt(13)) };
    },
    note:'A different route between the same two points — the test that separates conservative fields from every other kind.' }
};
/* ----------------------------------------------------- the line integrals ---- */
/* Scalar line integral ∫_C f ds — the area of the curtain under f above C. */
function vcLineScalar(f, path, t0, t1, a, b){
  return nqAdaptive(t => {
    const p = path.f(t, a, b), d = path.d(t, a, b);
    return f(p.x, p.y) * Math.hypot(d.x, d.y);
  }, t0, t1, 1e-10);
}
/* Vector line integral ∫_C F·dr = ∫ (P x′ + Q y′) dt — the work done. */
function vcLineWork(P, Q, path, t0, t1, a, b){
  return nqAdaptive(t => {
    const p = path.f(t, a, b), d = path.d(t, a, b);
    return P(p.x, p.y) * d.x + Q(p.x, p.y) * d.y;
  }, t0, t1, 1e-10);
}
/* the outward flux across a plane curve: ∮ F·n ds = ∮ (P dy − Q dx) */
function vcLineFlux(P, Q, path, t0, t1, a, b){
  return nqAdaptive(t => {
    const p = path.f(t, a, b), d = path.d(t, a, b);
    return P(p.x, p.y) * d.y - Q(p.x, p.y) * d.x;
  }, t0, t1, 1e-10);
}
/* ∮|F||dr| — THE SIZE OF THE TERMS BEFORE ANY CANCELLATION, which is what a
   vanishing integral has to be read against. §2.1: "print what the zero
   cancelled" — a circulation of 8.9×10⁻¹⁶ is round-off in a sum of terms of
   size 2π and a catastrophe in a sum of terms of size 10⁻¹⁵, and nothing but
   the gross tells them apart. A gradient field's circulation round any closed
   path is exactly zero, so this is not an edge case: it is the answer on every
   conservative preset.

   |F||dr| RATHER THAN |F·dr|, and the difference is not pedantry. The first
   version integrated the absolute value of the dot product, which is zero for a
   field POINTWISE PERPENDICULAR to the element — a vortex round a circle, an
   inverse-square field along one, a swirl across a sphere. There the gross was
   itself zero and rescued nothing, and auditsides went from ten findings to
   four rather than to none. The direction is part of what cancelled, so the
   honest scale is the magnitude of the vector times the length of the element:
   it is what the sum would have been had every term pointed the same way. */
const vcLineGross = (P, Q, path, t0, t1, a, b) =>
  nqAdaptive(t => {
    const p = path.f(t, a, b), d = path.d(t, a, b);
    return Math.hypot(P(p.x, p.y), Q(p.x, p.y)) * Math.hypot(d.x, d.y);
  }, t0, t1, 1e-10);

/* arc length, so the readout can report the average of F·T̂ as well as its sum */
const vcArcLen = (path, t0, t1, a, b) =>
  nqAdaptive(t => { const d = path.d(t, a, b); return Math.hypot(d.x, d.y); }, t0, t1, 1e-10);

/* a piecewise line integral over a corner-bearing path, integrated segment by
   segment — the square would otherwise be integrated straight through its
   corners, where r′ does not exist */
function vcLineWorkPiecewise(P, Q, path, t0, t1, a, b, breaks){
  let s = 0;
  const cuts = [t0, ...(breaks || []).filter(t => t > t0 && t < t1), t1];
  for(let i = 0; i < cuts.length - 1; i++){
    s += nqAdaptive(t => {
      const p = path.f(t, a, b), d = path.d(t, a, b);
      return P(p.x, p.y) * d.x + Q(p.x, p.y) * d.y;
    }, cuts[i] + 1e-12, cuts[i + 1] - 1e-12, 1e-10);
  }
  return s;
}

/* ------------------------------------------------- conservative fields ------ */
/* The plane test is ∂P/∂y = ∂Q/∂x on a simply connected domain. Both partials
   are taken symbolically from the expressions the user typed. */
function vcConservativeTest(Psrc, Qsrc, x, y){
  const Pa = parse(Psrc), Qa = parse(Qsrc);
  const Py = compile(diff(Pa, 'y')), Qx = compile(diff(Qa, 'x'));
  const py = Py(x, y, 0), qx = Qx(x, y, 0);
  return { py, qx, gap:Math.abs(py - qx), curl:qx - py,
           Py:(X, Y) => Py(X, Y, 0), Qx:(X, Y) => Qx(X, Y, 0),
           astPy:diff(Pa, 'y'), astQx:diff(Qa, 'x') };
}
/* Recover the potential by integrating along a staircase from a base point:
   f(x,y) = ∫ P dx along y = y₀, then ∫ Q dy at x. For a conservative field
   the route cannot matter, which is exactly what makes this well defined. */
function vcPotential(P, Q, x, y, x0, y0){
  const leg1 = nqAdaptive(s => P(s, y0), x0, x, 1e-11);
  const leg2 = nqAdaptive(s => Q(x, s), y0, y, 1e-11);
  return leg1 + leg2;
}
/* the same potential built the other way round — the two agree iff the field is
   conservative, and the stage shows the gap growing when it is not */
function vcPotentialAlt(P, Q, x, y, x0, y0){
  const leg1 = nqAdaptive(s => Q(x0, s), y0, y, 1e-11);
  const leg2 = nqAdaptive(s => P(s, y), x0, x, 1e-11);
  return leg1 + leg2;
}
const VC_FIELDS = {
  grad: { name:'F = ⟨2xy, x² + 3y²⟩', P:'2x y', Q:'x^2+3y^2', conservative:true,
    pot:'f = x²y + y³',
    note:'A gradient field. Its potential is x²y + y³, and the work between any two points is the difference of that function — no path needed.' },
  rot: { name:'F = ⟨−y, x⟩', P:'-y', Q:'x', conservative:false,
    note:'Pure rotation. Q<sub>x</sub> − P<sub>y</sub> = 2 everywhere, so every counter-clockwise loop of area A does work 2A — path dependence at its most blatant.' },
  radial: { name:'F = ⟨x, y⟩', P:'x', Q:'y', conservative:true, pot:'f = ½(x² + y²)',
    note:'The gradient of ½r². Radial fields with a magnitude depending only on r are always conservative, which is why gravity and electrostatics have potentials.' },
  vortex: { name:'F = ⟨−y/r², x/r²⟩', P:'-y/(x^2+y^2)', Q:'x/(x^2+y^2)', conservative:false, punctured:true,
    note:'The awkward one. Q<sub>x</sub> − P<sub>y</sub> = 0 <i>everywhere it is defined</i>, and yet the circulation around the origin is 2π. The domain has a hole in it, and the "simply connected" clause in the theorem is doing real work.' },
  shear: { name:'F = ⟨y, 0⟩', P:'y', Q:'0', conservative:false,
    note:'A shear flow. Q<sub>x</sub> − P<sub>y</sub> = −1: uniform clockwise vorticity, even though not a single streamline curves.' },
  source: { name:'F = ⟨x, y⟩/(x²+y²)', P:'x/(x^2+y^2)', Q:'y/(x^2+y^2)', conservative:true, punctured:true,
    pot:'f = ½ln(x² + y²)',
    note:'Conservative, with potential ln r — but its <i>divergence</i> integral is the one that misbehaves at the origin. Flux 2π out of every loop enclosing it, zero divergence everywhere else: Gauss\'s law in two dimensions.' }
};

/* ------------------------------------------------------- Green's theorem ---- */
/* ∮_C P dx + Q dy = ∬_R (Q_x − P_y) dA.  Both sides, computed separately. */
function vcGreenCheck(Psrc, Qsrc, path, a, b){
  const P = compile(parse(Psrc)), Q = compile(parse(Qsrc));
  const P2 = (x, y) => P(x, y, 0), Q2 = (x, y) => Q(x, y, 0);
  const Py = compile(diff(parse(Psrc), 'y')), Qx = compile(diff(parse(Qsrc), 'x'));
  const breaks = path === VC_PATHS.square ? [1, 2, 3] : null;
  const circ = breaks
    ? vcLineWorkPiecewise(P2, Q2, path, path.t0, path.t1, a, b, breaks)
    : vcLineWork(P2, Q2, path, path.t0, path.t1, a, b);
  /* the double integral, swept in polar coordinates about the origin so that
     every one of these regions is star-shaped and needs no case analysis */
  const rOf = vcRadialBoundary(path, a, b);
  const area2 = nqDoublePolar((x, y) => Qx(x, y, 0) - Py(x, y, 0), 0, 2 * Math.PI, () => 0, rOf, 5, 40);
  return { circ, area2, gap:Math.abs(circ - area2), P:P2, Q:Q2,
           Py:(x, y) => Py(x, y, 0), Qx:(x, y) => Qx(x, y, 0) };
}
/* the boundary radius as a function of θ, for the star-shaped paths above */
function vcRadialBoundary(path, a, b){
  if(path === VC_PATHS.circle)   return () => a;
  if(path === VC_PATHS.ellipse)  return th => (a * b) / Math.hypot(b * Math.cos(th), a * Math.sin(th));
  if(path === VC_PATHS.square)   return th => {
    const c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th));
    return a / Math.max(c, s);
  };
  if(path === VC_PATHS.cardioid) return th => a * (1 + Math.cos(th));
  return () => a || 1;
}
/* the planimeter: A = ½∮(x dy − y dx), the classic corollary */
function vcAreaByBoundary(path, a, b){
  const breaks = path === VC_PATHS.square ? [1, 2, 3] : null;
  const integ = t => {
    const p = path.f(t, a, b), d = path.d(t, a, b);
    return 0.5 * (p.x * d.y - p.y * d.x);
  };
  if(!breaks) return nqAdaptive(integ, path.t0, path.t1, 1e-11);
  let s = 0;
  const cuts = [path.t0, 1, 2, 3, path.t1];
  for(let i = 0; i < cuts.length - 1; i++) s += nqAdaptive(integ, cuts[i] + 1e-12, cuts[i + 1] - 1e-12, 1e-11);
  return s;
}

/* --------------------------------------------------- parametrised surfaces ---- */
/* r(u,v) with its two tangent vectors; the normal r_u × r_v is what makes dS a
   vector and turns a surface integral into a flux. */
const VC_SURFACES = {
  sphere: { name:'Sphere  ρ = 1  (closed)', u0:0, u1:Math.PI, v0:0, v1:2 * Math.PI,
    ul:'φ', vl:'θ', exactArea:4 * Math.PI, closed:true, boundary:'none — it is closed',
    r:(u, v) => v3(Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)),
    note:'The closed surface the divergence theorem is usually stated on. r_φ × r_θ points outward everywhere, so the flux it computes is the outward flux with no sign to fix afterwards.' },
  hemisphere: { name:'Hemisphere  ρ = 1, z ≥ 0', u0:0, u1:Math.PI / 2, v0:0, v1:2 * Math.PI,
    ul:'φ', vl:'θ', exactArea:2 * Math.PI, boundary:'the unit circle in the plane z = 0',
    r:(u, v) => v3(Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)),
    note:'Spherical coordinates used as surface parameters. |r_φ × r_θ| = sinφ, which is the same sinφ that appears in the volume element, for the same reason.' },
  paraboloid: { name:'Paraboloid  z = 1 − x² − y², z ≥ 0', u0:0, u1:1, v0:0, v1:2 * Math.PI,
    ul:'r', vl:'θ', exactArea:Math.PI / 6 * (5 * Math.sqrt(5) - 1), boundary:'the unit circle in the plane z = 0',
    r:(u, v) => v3(u * Math.cos(v), u * Math.sin(v), 1 - u * u),
    note:'A graph z = g(x,y) parametrised in polar coordinates. Its area element is r√(1+4r²) dr dθ — the √(1 + |∇g|²) of the graph formula, in disguise.' },
  cylinder: { name:'Cylinder  x² + y² = 1, 0 ≤ z ≤ 2', u0:0, u1:2, v0:0, v1:2 * Math.PI,
    ul:'z', vl:'θ', exactArea:4 * Math.PI, boundary:'two circles, at z = 0 and z = 2',
    r:(u, v) => v3(Math.cos(v), Math.sin(v), u),
    note:'The normal points radially outward and has length 1 everywhere: a cylinder is a rectangle rolled up, and rolling does not stretch.' },
  cone: { name:'Cone  z = √(x²+y²), z ≤ 1', u0:0.001, u1:1, v0:0, v1:2 * Math.PI,
    /* √2 π r² is the area of the WHOLE cone, and this patch is not the whole
       cone: it starts at r = u₀ = 0.001 to keep the apex out of the domain,
       because r_u × r_v vanishes there and n̂ is undefined. The area of the
       surface actually parametrised is therefore short by √2 π u₀². Quoting the
       whole cone's area here left a 4.4e-6 gap that looked exactly like
       quadrature error and was not — the quadrature had converged to 5e-14. */
    ul:'r', vl:'θ', exactArea:Math.PI * Math.SQRT2 * (1 - 0.001 * 0.001),
    boundary:'the unit circle in the plane z = 1',
    r:(u, v) => v3(u * Math.cos(v), u * Math.sin(v), u),
    note:'Slant height √2 times the base radius, so the lateral area is √2 π r² — the cone unrolls into a flat sector without distortion.' },
  disc: { name:'Flat disc  z = 0, r ≤ 1', u0:0, u1:1, v0:0, v1:2 * Math.PI,
    ul:'r', vl:'θ', exactArea:Math.PI, boundary:'the unit circle in the plane z = 0',
    r:(u, v) => v3(u * Math.cos(v), u * Math.sin(v), 0),
    note:'The simplest cap on the unit circle — and the one Stokes\' theorem must agree with when the hemisphere is swapped for it.' },
  torus: { name:'Torus  R = 2, a = 0.7', u0:0, u1:2 * Math.PI, v0:0, v1:2 * Math.PI,
    ul:'u', vl:'v', exactArea:4 * Math.PI * Math.PI * 2 * 0.7,
    closed:true, boundary:'none — it is closed',
    r:(u, v) => v3((2 + 0.7 * Math.cos(u)) * Math.cos(v), (2 + 0.7 * Math.cos(u)) * Math.sin(v), 0.7 * Math.sin(u)),
    note:'A closed surface with no boundary at all, so Stokes\' theorem forces the flux of any curl through it to be exactly zero. Pappus gives its area as (2πa)(2πR).' }
};
/* the tangent vectors and normal, by central differences on r(u,v) */
function vcSurfFrame(S, u, v, h){
  h = h || 1e-5;
  const ru = vmul(vsub(S.r(u + h, v), S.r(u - h, v)), 1 / (2 * h));
  const rv = vmul(vsub(S.r(u, v + h), S.r(u, v - h)), 1 / (2 * h));
  const n = vcross(ru, rv);
  return { p:S.r(u, v), ru, rv, n, dS:vlen(n), nh:vnorm(n) };
}
/* surface area ∬|r_u × r_v| du dv */
function vcSurfArea(S){
  return nqDoubleRect((u, v) => vcSurfFrame(S, u, v).dS, S.u0, S.u1, S.v0, S.v1, 5, 18);
}
/* a scalar surface integral ∬ f dS */
function vcSurfScalar(S, f){
  return nqDoubleRect((u, v) => {
    const F = vcSurfFrame(S, u, v);
    return f(F.p.x, F.p.y, F.p.z) * F.dS;
  }, S.u0, S.u1, S.v0, S.v1, 5, 18);
}
/* flux ∬ F·(r_u × r_v) du dv, with an orientation switch because the sign of a
   flux is a choice of normal and nothing more */
function vcSurfFlux(S, F, orient){
  const sgn = orient === -1 ? -1 : 1;
  return sgn * nqDoubleRect((u, v) => {
    const fr = vcSurfFrame(S, u, v);
    const f = F(fr.p.x, fr.p.y, fr.p.z);
    return vdot(f, fr.n);
  }, S.u0, S.u1, S.v0, S.v1, 5, 18);
}
/* ∬|F||dS| — the gross the signed flux above has to be read against, and the
   reason the two theorem checks below return one. A swirl field has exactly
   zero net flux through any closed surface and a shear field exactly zero
   circulation round the loop that caps it, so on those presets the signed
   answer is nothing but the mesh's own error; divided by this it is 5×10⁻¹¹
   out of π, and divided by itself it is 100%. Unsigned, so no orientation.

   |F||n| rather than |F·n|, for the reason on vcLineGross above: the swirl is
   tangential to every sphere, so its pointwise F·n̂ is zero and a gross built
   from it is zero too. The magnitude form is what the flux would have been had
   the field pointed straight out everywhere. */
const vcSurfFluxAbs = (S, F) =>
  nqDoubleRect((u, v) => {
    const fr = vcSurfFrame(S, u, v);
    const f = F(fr.p.x, fr.p.y, fr.p.z);
    return Math.hypot(f.x, f.y, f.z) * Math.hypot(fr.n.x, fr.n.y, fr.n.z);
  }, S.u0, S.u1, S.v0, S.v1, 5, 18);

/* ------------------------------------------------------ 3D fields & operators ---- */
/* Symbolic P, Q, R with their divergence and curl, taken from the same
   differentiator the vector wing's derivation panel uses.

   Building one means three parses, nine symbolic differentiations and twelve
   compiles, and the stages call it from `field(st)` inside both frame() and
   readout() — so the identical field was being rebuilt from source a dozen times
   a second for a formula that had not changed. The results are immutable and
   keyed exactly by their three source strings, so they are cached. The cache is
   bounded because the only things that ever enter it are the preset table and
   whatever the reader has typed. */
const VC_F3_CACHE = new Map();
function vcField3(Psrc, Qsrc, Rsrc){
  const key = Psrc + '\u0001' + Qsrc + '\u0001' + Rsrc;
  const hit = VC_F3_CACHE.get(key);
  if(hit) return hit;
  const made = vcBuildField3(Psrc, Qsrc, Rsrc);
  if(VC_F3_CACHE.size > 64) VC_F3_CACHE.clear();
  VC_F3_CACHE.set(key, made);
  return made;
}
/* The plane counterpart, cached for the same reason: every stage in the wing
   asks for its field from frame() and again from readout(), many times a second,
   out of source that has not changed between the two. */
const VC_F2_CACHE = new Map();
function vcPlaneFns(Psrc, Qsrc){
  const key = JSON.stringify([Psrc, Qsrc]);
  const hit = VC_F2_CACHE.get(key);
  if(hit) return hit;
  let P, Q, curl, div;
  try {
    const pa = parse(Psrc), qa = parse(Qsrc);
    const p = compile(pa), q = compile(qa);
    const py = compile(diff(pa, 'y')), qx = compile(diff(qa, 'x'));
    const px = compile(diff(pa, 'x')), qy = compile(diff(qa, 'y'));
    P = (x, y) => p(x, y, 0);  Q = (x, y) => q(x, y, 0);
    /* scalar returns rather than a vector: these run inside contour and heat-map
       loops, where allocating a v3 per sample is the whole cost */
    curl = (x, y) => qx(x, y, 0) - py(x, y, 0);
    div  = (x, y) => px(x, y, 0) + qy(x, y, 0);
  } catch(e){                              // a half-typed formula draws nothing, never throws
    P = () => 0; Q = () => 0; curl = () => 0; div = () => 0;
  }
  const made = { P, Q, curl, div, src:{ P:Psrc, Q:Qsrc } };
  if(VC_F2_CACHE.size > 64) VC_F2_CACHE.clear();
  VC_F2_CACHE.set(key, made);
  return made;
}
function vcBuildField3(Psrc, Qsrc, Rsrc){
  const Pa = parse(Psrc), Qa = parse(Qsrc), Ra = parse(Rsrc);
  const P = compile(Pa), Q = compile(Qa), Rc = compile(Ra);
  const Px = compile(diff(Pa, 'x')), Qy = compile(diff(Qa, 'y')), Rz = compile(diff(Ra, 'z'));
  const Ry = compile(diff(Ra, 'y')), Qz = compile(diff(Qa, 'z'));
  const Pz = compile(diff(Pa, 'z')), Rx = compile(diff(Ra, 'x'));
  const Qx = compile(diff(Qa, 'x')), Py = compile(diff(Pa, 'y'));
  return {
    F:(x, y, z) => v3(P(x, y, z), Q(x, y, z), Rc(x, y, z)),
    div:(x, y, z) => Px(x, y, z) + Qy(x, y, z) + Rz(x, y, z),
    curl:(x, y, z) => v3(Ry(x, y, z) - Qz(x, y, z),
                         Pz(x, y, z) - Rx(x, y, z),
                         Qx(x, y, z) - Py(x, y, z)),
    src:{ P:Psrc, Q:Qsrc, R:Rsrc },
    ast:{ P:Pa, Q:Qa, R:Ra }
  };
}
const VC_FIELDS3 = {
  radial:  { name:'F = ⟨x, y, z⟩',            P:'x', Q:'y', R:'z',
    note:'Divergence 3 everywhere, curl zero. The flux out of any closed surface is three times the volume it encloses — the divergence theorem at its most transparent.' },
  swirl:   { name:'F = ⟨−y, x, 0⟩',           P:'-y', Q:'x', R:'0',
    note:'Curl ⟨0,0,2⟩, divergence 0. Rigid rotation: every closed surface has zero net flux, and every loop in a horizontal plane has circulation twice its area.' },
  shear3:  { name:'F = ⟨z, 0, 0⟩',            P:'z', Q:'0', R:'0',
    note:'Zero divergence and a curl of ⟨0,1,0⟩ — vorticity with no rotation visible in any streamline, which is the standard trap.' },
  mixed:   { name:'F = ⟨y·z, x·z, x·y⟩',      P:'y z', Q:'x z', R:'x y',
    note:'Curl identically zero — it is the gradient of xyz. Every closed loop gives zero circulation, whatever surface you cap it with.' },
  square3: { name:'F = ⟨x², y², z²⟩',         P:'x^2', Q:'y^2', R:'z^2',
    note:'Divergence 2(x+y+z), which integrates to zero over any region symmetric about the origin — so a sphere centred there has zero net flux despite the field being nowhere zero.' },
  inverse: { name:'F = ⟨x, y, z⟩/r³',         P:'x/(x^2+y^2+z^2)^1.5', Q:'y/(x^2+y^2+z^2)^1.5', R:'z/(x^2+y^2+z^2)^1.5',
    note:'The inverse-square field. Divergence exactly zero everywhere it is defined, yet flux 4π through any surface enclosing the origin — the whole source is the one point the field forgot to have a value at.' }
};

/* the two theorems, each with both sides measured */
/* Each returns `gross` as well as `gap`, and the stages are required to print
   the gap against it (fmtAgreeGross). Both theorems have presets on which BOTH
   sides are exactly zero — shear3 on a hemisphere, swirl through any closed
   surface — and there the gap is the mesh's own error while the derived scale
   is that same error, so the panel announced a 100% disagreement on the two
   presets where the physics is perfect. Taking the larger of the two routes'
   grosses matters: a gradient field cancels the SURFACE side to zero and a
   shear field cancels the LOOP side to zero, so either one alone is sometimes
   zero itself and would rescue nothing. */
function vcStokesCheck(fld, surf, loopPath, orient){
  const flux = vcSurfFlux(surf, (x, y, z) => fld.curl(x, y, z), orient);
  const circ = nqAdaptive(t => {
    const p = loopPath.f(t), d = loopPath.d(t);
    return vdot(fld.F(p.x, p.y, p.z), d);
  }, loopPath.t0, loopPath.t1, 1e-10);
  const grossFlux = vcSurfFluxAbs(surf, (x, y, z) => fld.curl(x, y, z));
  const grossCirc = nqAdaptive(t => {
    const p = loopPath.f(t), d = loopPath.d(t);
    const f = fld.F(p.x, p.y, p.z);
    return Math.hypot(f.x, f.y, f.z) * Math.hypot(d.x, d.y, d.z);
  }, loopPath.t0, loopPath.t1, 1e-10);
  return { flux, circ, gap:Math.abs(flux - circ),
           gross:Math.max(grossFlux, grossCirc) };
}
function vcDivergenceCheck(fld, surf, volume){
  const flux = vcSurfFlux(surf, fld.F, 1);
  const vol = volume(fld);
  /* the volume route's integrand is behind an opaque callback, so the gross
     comes from the surface route alone -- which is the one that vanishes by
     symmetry on the presets that matter */
  return { flux, vol, gap:Math.abs(flux - vol), gross:vcSurfFluxAbs(surf, fld.F) };
}
/* ∭ ∇·F dV over a ball of radius a, in spherical coordinates */
const vcBallDivIntegral = (fld, a) =>
  nqTripleSph((x, y, z) => fld.div(x, y, z), 0, 2 * Math.PI, () => 0, () => Math.PI, () => 0, () => a, 5, 8);
/* and over a cylinder r ≤ a, 0 ≤ z ≤ h */
const vcCylDivIntegral = (fld, a, h) =>
  nqTripleCyl((x, y, z) => fld.div(x, y, z), 0, 2 * Math.PI, () => 0, () => a, () => 0, () => h, 5, 8);
