/* ============================================================================
   5c · LIGHT THROUGH A METRIC THE READER SUPPLIES
   Programme A item 4, 2026-08-18. Reads 46a-gr-metric.js's A(r), B(r)
   convention, its rlDeriv/rlBisect/rlPhotonR/rlStaticBand, and its geodesic
   integrator; the filename order guarantees it loads after both.

   A photon has no rest mass, so κ = 0 and the first integral of the null
   geodesic carries ONE parameter — the impact parameter b = L/E:

       (dr/dφ)² = r⁴ (1/(A·B)) ( 1/b² − A/r² )

   Two things follow, and both are measured here rather than quoted.

   (1) THE TURNING POINT is where A(r)/r² = 1/b², so the function that decides
       everything about light is W(r) = A(r)/r² — the null potential. Its
       MAXIMUM is the photon sphere, and the b belonging to that maximum is the
       critical impact parameter b_c = r_ph/√A(r_ph). Schwarzschild's is 3√3,
       which this locates to the last bit rather than writing down.

   (2) THE DEFLECTION is the swept angle minus the swept angle of a straight
       line, and dividing dφ/dτ by dr/dτ removes the affine parameter:

           Δφ = 2∫ √B du / √( 1/(b²A) − u² )  −  π          (u = 1/r)

   π MUST BE SUBTRACTED UNDER THE INTEGRAL SIGN. At b = 10⁷ the deflection is
   4×10⁻⁷ against a total sweep of π, so taking the difference afterwards asks
   float64 for thirteen significant figures it does not have. Substituting
   u = u₀ sin θ turns the flat integral into ∫dθ over exactly the same range,
   so the two combine into ONE integrand that is small everywhere and the
   cancellation never happens:

           Δφ = 2 ∫₀^{π/2} ( √B/√g − 1 ) dθ,   g = (1/(b²A) − u²)/(u₀² − u²)

   The same substitution removes the inverse-square-root singularity at the
   turning point — g tends to a finite non-zero limit there — so Gauss–Legendre
   converges spectrally and never evaluates an endpoint. It is converged to
   10⁻¹⁰ by 32 panels; 64 is used, and past 256 round-off starts accumulating
   faster than truncation falls.

   AND √(u₀² − u²) IS WRITTEN AS u₀·cos θ, WHICH IS NOT COSMETIC. Formed as a
   difference of squares it is a cancellation that costs nine digits at the last
   node; written in θ it is exact. With that and the algebraic regrouping in
   rlDeflect below, the deflection is good to about 2×10⁻¹⁴ radians absolute —
   which is what lets 4GM/c²b be checked at b = 3×10⁶, where the second-order
   term has finally fallen below 10⁻⁶.

   THE TWO ROUTES, and they share nothing:

     ROUTE A  rlBendRay hands rlGeoRun (46a) a null initial state and marches
              the second-order geodesic equation through the Christoffel
              symbols of the reader's A and B. It never hears of b's turning
              point, of W, or of the quadrature; its drift in E and L is a free
              measurement of itself.
     ROUTE B  rlBend locates the turning point by bisection on W and integrates
              the closed form above. No integration of the geodesic equation
              anywhere in it.

   They agree to between 3×10⁻⁹ and 2×10⁻⁸ relative over the presets, which is
   route A's step, and it is measured by halving h rather than asserted.

   WHERE A DEFLECTION IS NOT DEFINED AT ALL. The integral to u = 0 is an
   integral out to r = ∞, and a metric with a cosmological horizon has no such
   place: beyond it A < 0 and nothing is static. The first version of this
   module let the integrand's guard return 0 for those samples and reported
   0.2193 for a Schwarzschild–de Sitter ray whose honest answer, measured
   between two observers inside the static band, is 0.2170 — a confident wrong
   number, produced by a guard doing a limit's job. So rlDeflect refuses on the
   OBSERVER RADIUS rather than on the samples, and counts every sample it could
   not evaluate; one bad sample makes the whole answer NaN. The stage then
   quotes the deflection between two named radii and says why.
   ============================================================================ */

/* ------------------------------------------------ the null potential -------- */
/* W(r) = A(r)/r². Everything light does is a statement about this one function:
   its maximum is the photon sphere, the b of that maximum is the capture
   threshold, and W(r) = 1/b² is the turning point. */
const rlW = (A, r) => A(r) / (r * r);

/* The impact parameter of the ray that turns at r — b = r/√A(r). Not a
   definition anyone has to accept: it is L/E for a null geodesic whose dr/dτ
   vanishes at r, and the unit suite checks it against rlGeoInit refusing to
   start any ray with a smaller b there. */
function rlPhotonB(A, r){
  const a = A(r);
  return Number.isFinite(a) && a > 0 && r > 0 ? r / Math.sqrt(a) : NaN;
}

/* The Lyapunov exponent of the photon sphere, from A, B and W″ at that radius
   and nothing else — a LOCAL number, with no integral in it.

   Expanding W about its maximum and integrating dφ/dr through the near-circular
   region gives Δφ ≈ −(1/λ)·ln(b/b_c − 1) + const with

       λ = r_ph² √(|W″(r_ph)|/2) / √(A(r_ph)·B(r_ph))

   so the deflection grows by exactly ln(10)/λ radians for every decade the ray
   is brought closer to the critical impact parameter. That is the same shape as
   the coordinate time in 46b — a divergence checked by its RATE rather than by
   evaluation — and it is the reason a black hole image has photon rings:
   successive windings are demagnified by e^(−2πλ), which for Schwarzschild
   (λ = 1 exactly) is one part in 535.

   Schwarzschild: W = 1/r² − 2/r³, W″(3) = −2/81, √(1/81) = 1/9, r_ph² = 9,
   A·B = 1, so λ = 1 — and the measured increment per decade lands on ln 10 to
   2×10⁻⁶. Flatten B to 1 and λ becomes √3: the same rays, wound a third less
   far, because the winding rate carries the space curvature too. */
function rlLyapunov(A, B, rph){
  if(!(rph > 0)) return NaN;
  const w2 = rlDeriv2(r => rlW(A, r), rph);
  const a = A(rph), b = B(rph);
  if(!Number.isFinite(w2) || !(a > 0) || !(b > 0)) return NaN;
  return rph * rph * Math.sqrt(Math.abs(w2) / 2) / Math.sqrt(a * b);
}

/* The photon sphere, its critical impact parameter and its Lyapunov exponent,
   all located from the reader's own A and B. The OUTERMOST photon sphere is the
   one that matters: a ray arriving from outside meets it first, and b_c is the
   threshold below which nothing coming from out there comes back. */
function rlCritB(A, B, rLo, rHi, n){
  const P = rlPhotonR(A, rLo, rHi, n || 3000);
  const rph = P.outer;
  if(!Number.isFinite(rph)) return { rph: NaN, b: NaN, lam: NaN, roots: P.roots, has: false };
  return { rph, b: rlPhotonB(A, rph), lam: rlLyapunov(A, B, rph), roots: P.roots, has: true };
}

/* ------------------------------------------------------ the turning point --- */
/* The outermost radius where W(r) = 1/b². `rPeak` IS NOT A CONVENIENCE — IT IS
   THE WHOLE OF THE CORRECTNESS ARGUMENT, and it must be where W is largest
   below rOut, which is the photon sphere when there is one.

   The reason is an existence argument, not an efficiency one. The turning point
   is the largest r < rObs with W(r) = 1/b², and bisection finds it on any
   bracket [r*, rObs] with W(r*) > 1/b². W is MAXIMAL at the photon sphere, so
   if any such r* exists the photon sphere is one — which means "W(r_peak) <
   1/b²" is not a failure of the search, it is the proof that the ray is
   captured. Hand this function any other inner radius and both of its answers
   become guesses.

   What it costs to get wrong: at ε = b/b_c − 1 = 10⁻⁷ the region where
   W > 1/b² is 2·r_ph√(2ε/|W″|) = 0.0018 wide on Schwarzschild. Bracket from the
   horizon instead and W(2.0001) = 1.2×10⁻⁵ is far below 1/b² = 0.037, so the
   ray that winds two and a half times round the hole is reported CAPTURED —
   and a 2000-point logarithmic scan of [2, 10⁵], whose cells are 0.02 wide at
   r = 3, steps over the window and reports the same thing. Both failures are
   silent, and both hit only the rays the picture is about. The unit suite
   asserts that both wrong methods ARE wrong, so neither can come back.

   Where there is no photon sphere at all (Minkowski, a conical halo, any A with
   W monotone) W is largest at the inner edge of the band and that is the peak.

   Returns NaN with a reason rather than a number the caller has to guess at. */
function rlTurnR(A, b, rPeak, rOut){
  if(!(b > 0) || !(rOut > rPeak) || !(rPeak > 0)) return { r: NaN, why: 'no bracket' };
  const f = r => rlW(A, r) - 1 / (b * b);
  const fi = f(rPeak), fo = f(rOut);
  if(!Number.isFinite(fi) || !Number.isFinite(fo)) return { r: NaN, why: 'the metric is not finite there' };
  /* W(r_obs) < 1/b² means the ray with that b never comes as close as the
     observer — its closest approach is outside them, so there is nothing to
     watch */
  if(fo > 0) return { r: NaN, why: 'that ray never comes as close as the observer' };
  /* W is nowhere large enough, and since rPeak is where it is largest, nowhere
     means nowhere: b is below the capture threshold and the ray goes in */
  if(fi < 0) return { r: NaN, why: 'captured' };
  return { r: rlBisect(f, rPeak, rOut), why: '' };
}

/* --------------------------------------------------- ROUTE B, the integral -- */
/* The deflection of the ray whose closest approach is r₀, measured against the
   straight line with the same closest approach, between the turning point and
   an observer at rObs (Infinity for an asymptotically flat metric).

   1/b² is recomputed as A(r₀)/r₀² rather than taken from the caller, so the
   integrand's zero sits exactly on the endpoint of the substitution instead of
   an ulp away from it. The b that goes with r₀ is returned by rlPhotonB.

   THE INTEGRAND IS REGROUPED so that the small quantity is computed directly
   instead of as (1 + small) − 1. Writing N = 1/(b²A) − u² and using
   u₀²cos²θ = u₀² − u² exactly,

       √B/√g − 1 = (B u₀²cos²θ − N) / [ √N ( √B u₀ cos θ + √N ) ]
       B u₀²cos²θ − N = u₀²( B − A₀/A ) − u²( B − 1 )

   and both brackets on the second line are differences that vanish with the
   field rather than with the arithmetic. Measured against the second-order term
   15πM²/4b², the regrouping buys a factor of twenty at b = 10⁶ and the
   difference between meeting the 10⁻⁶ acceptance and missing it.

   Every sample that cannot be evaluated is COUNTED, and one of them makes the
   answer NaN. A guard that returns zero for a bad sample silently redefines the
   domain of integration, which is how a Schwarzschild–de Sitter ray acquired a
   deflection measured partly outside the static region. */
function rlDeflect(A, B, r0, rObs, panels){
  const A0 = A(r0);
  if(!(r0 > 0) || !(A0 > 0) || !Number.isFinite(A0)) return NaN;
  const u0 = 1 / r0, invb2 = A0 * u0 * u0;
  const far = !Number.isFinite(rObs) || rObs <= 0;
  if(far){
    /* "at infinity" is a claim about the metric, not a limit of integration.
       Probe far out: if A or B has stopped being finite and positive there,
       there is no asymptotic observer and no deflection to quote. */
    const rF = 1e8 * Math.max(1, r0), aF = A(rF), bF = B(rF);
    if(!(aF > 0) || !(bF > 0) || !Number.isFinite(aF) || !Number.isFinite(bF)) return NaN;
  } else {
    if(!(rObs > r0)) return NaN;
    const aO = A(rObs), bO = B(rObs);
    if(!(aO > 0) || !(bO > 0) || !Number.isFinite(aO) || !Number.isFinite(bO)) return NaN;
  }
  const th0 = far ? 0 : Math.asin(Math.max(0, Math.min(1, (1 / rObs) / u0)));
  let bad = 0;
  const g = th => {
    const c = Math.cos(th), u = u0 * Math.sin(th), r = 1 / u;
    const a = A(r), bb = B(r);
    if(!Number.isFinite(a) || !Number.isFinite(bb) || !(a > 0) || !(bb > 0)){ bad++; return 0; }
    const N = invb2 / a - u * u;
    if(!(N > 0)){ bad++; return 0; }
    const num = u0 * u0 * (bb - A0 / a) - u * u * (bb - 1), sN = Math.sqrt(N);
    return num / (sN * (Math.sqrt(bb) * u0 * c + sN));
  };
  const v = 2 * nqGauss(g, th0, Math.PI / 2, 8, panels || 64);
  return bad ? NaN : v;
}

/* The whole story for one impact parameter: where it turns, whether it turns at
   all, and how far it is bent. `own` carries the reason a NaN is a NaN, because
   "captured" and "the metric has no asymptotic region" are different facts and
   a panel that prints the same thing for both is lying about one of them. */
function rlBend(A, B, b, opt){
  const o = opt || {};
  const rIn = o.rIn, rOut = o.rOut, rObs = o.rObs === undefined ? Infinity : o.rObs;
  const T = rlTurnR(A, b, rIn, rOut);
  if(!Number.isFinite(T.r))
    return { b, r0: NaN, defl: NaN, captured: T.why === 'captured', why: T.why };
  const defl = rlDeflect(A, B, T.r, rObs, o.panels);
  return { b, r0: T.r, bOf: rlPhotonB(A, T.r), defl, captured: false,
           why: Number.isFinite(defl) ? '' : 'no asymptotic region to measure the bend against' };
}

/* The deflection over a list of impact parameters — the 1/b law, drawn. Each b
   is located and integrated independently; nothing is carried from one to the
   next, so a b that fails leaves a gap rather than corrupting its neighbours. */
function rlDeflSweep(A, B, bs, opt){
  const r0 = [], d = [];
  for(let i = 0; i < bs.length; i++){
    const R = rlBend(A, B, bs[i], opt);
    r0.push(R.r0); d.push(R.defl);
  }
  return { b: bs, r0, defl: d };
}

/* ---------------------------------------------------- ROUTE A, the geodesic - */
/* THE OBSERVER RADIUS AND STEP FOR ROUTE A, fixed once here so that every
   caller uses the same rule — the light twin of rlOrbitPlan (46a), and exactly
   the same lesson repeated.

   Item 2's defect was sizing an orbit's step by its radial period, which
   samples a whirling pericentre a handful of times. A ray has the same shape of
   problem: dφ/dτ = b/r₀² at closest approach, so a step chosen to cover the
   radial journey resolves the bend only when r₀ is comparable with the
   observer's radius.

   Two things follow, and BOTH were wrong before they were measured.

   (1) THE OBSERVER IS SCALED TO THE RAY. A fixed 200 GM/c² asks a fixed-step
       integrator to cover a thousandfold range of r when the ray grazes at 0.2,
       and the deflection came back 6.6×10⁻⁵ radians — IN FLAT SPACE, where the
       answer is zero and the quadrature says so exactly. Twenty times the
       closest approach makes the problem self-similar for every b, and the
       panel names the radius rather than implying infinity.
   (2) THE ANGULAR STEP AT CLOSEST APPROACH IS BOUNDED as well as the radial
       one, and the smaller of the two wins.

   That pair took the two routes from 3.7×10⁻⁸ to 10⁻¹¹ on the conical halo and
   from 6.6×10⁻⁵ to round-off on Minkowski, and it is what makes a comparison at
   every b the slider reaches meaningful rather than only at the default. */
function rlRayPlan(b, r0, rMaxObs, opt){
  const o = opt || {};
  const nRad = o.nRad || 2000, nAng = o.nAng || 500;
  const rA = Math.min(rMaxObs, 20 * r0);
  const hRad = 2 * (rA - r0) / nRad;
  const hAng = r0 * r0 / (Math.max(1e-12, Math.abs(b)) * nAng);
  const h = Math.max(1e-9, Math.min(hRad, hAng));
  return { rObs: rA, h, steps: Math.min(150000, Math.max(200, Math.ceil(3.2 * (rA - r0) / h))) };
}
/* The same ray by RK4 on the second-order geodesic equation, told nothing about
   turning points. κ = 0 makes it null; E = 1 and L = b make its impact
   parameter b by definition of b = L/E, and rlGeoInit takes dr/dτ from the
   first integral exactly as it does for a massive particle.

   The reference angle uses route A's OWN closest approach, refined
   parabolically — r_min = r_i − S²/8D with S = r_{i−1} − r_{i+1} and
   D = r_{i−1} − 2r_i + r_{i+1}. Getting that vertex formula wrong by a factor
   of two put a 5×10⁻⁷ error into r_min and pinned the whole route at 2.6×10⁻⁹
   however small the step was — a FLOOR where there should have been fourth
   order, and the step study is what showed it, since a floor and a truncation
   error look identical at one step size.

   φ at the outgoing crossing of rObs is taken by four-point Lagrange in r, so
   the interpolation is fourth order like the integrator and does not become the
   thing being measured. */
function rlBendRay(A, B, b, rObs, h, steps, opt){
  const o = opt || {};
  const y0 = rlGeoInit(A, B, rObs, 1, b, 0, -1);
  if(!Number.isFinite(y0[4]) || y0[4] === 0)
    return { defl: NaN, why: 'that ray does not reach the observer', track: null };
  /* THE ANGLE TO ROTATE THE TRACK BY SO THAT IT ARRIVES HORIZONTALLY.
     Every track starts at φ = 0, so drawing them unrotated puts all of them at
     the same point on the canvas and the fan reads as a POINT SOURCE — which
     is what the first screenshot showed, and starlight is nothing of the kind.
     Rotating each by the angle its own velocity makes with the −x direction
     turns the fan into the parallel bundle a distant star actually sends, and
     then each ray's incoming line sits at height exactly b, so the undeflected
     straight line can be drawn at that height and will line up.
     In flat space this reduces to arcsin(b/r_obs); in curved space it is the
     velocity's own direction, so it stays right where that expansion does not. */
  const phIn = Math.PI - Math.atan2(rObs * y0[5], y0[4]);
  const g = rlGeoRun(A, B, y0, h, steps, { rStop: o.rStop || 0, rEsc: rObs });
  if(g.n < 8) return { defl: NaN, why: 'the track went nowhere', track: g, phIn };
  if(g.stop !== 'the track left the window')
    return { defl: NaN, captured: true, why: g.stop || 'the ray never came back out', track: g, phIn };
  let im = 0;
  for(let i = 1; i <= g.n; i++) if(g.r[i] < g.r[im]) im = i;
  let rmin = g.r[im];
  if(im > 0 && im < g.n){
    const S = g.r[im - 1] - g.r[im + 1], D = g.r[im - 1] - 2 * g.r[im] + g.r[im + 1];
    if(D !== 0) rmin = g.r[im] - S * S / (8 * D);
  }
  /* four points bracketing the outgoing crossing, interpolating φ against r */
  const n = g.n, j = Math.max(1, Math.min(n - 2, n - 1));
  let sweep = 0;
  for(let a = j - 1; a <= j + 2; a++){
    let w = 1;
    for(let c = j - 1; c <= j + 2; c++) if(c !== a) w *= (rObs - g.r[c]) / (g.r[a] - g.r[c]);
    sweep += w * g.ph[a];
  }
  const flat = Math.PI - 2 * Math.asin(Math.max(-1, Math.min(1, rmin / rObs)));
  return { defl: sweep - flat, sweep, rmin, captured: false, why: '', track: g, phIn,
           driftE: g.driftE, driftL: g.driftL, n: g.n };
}

/* ----------------------------------------------- the winding, and its rate -- */
/* A ray brought towards b_c winds without limit, and a divergence cannot be
   checked by evaluating it. So this measures the RATE: the extra radians bought
   by each decade of approach, against the local prediction ln(10)/λ that
   rlLyapunov computes from A, B and W″ at the photon sphere with no integral in
   it. Equal increments ARE a logarithm, exactly as the equal increments of
   coordinate time in 46b are.

   The sequence converges from below — the expansion about the photon sphere is
   an asymptotic one — so both the last increment and the closest approach to
   the prediction are reported, and the panel says which decade produced it. */
function rlWindRate(A, B, crit, decades, opt){
  const o = opt || {};
  const N = Math.max(2, decades || 6);
  const eps = [], defl = [], inc = [];
  for(let i = 1; i <= N; i++){
    const e = Math.pow(10, -i);
    const R = rlBend(A, B, crit.b * (1 + e), opt);
    eps.push(e); defl.push(R.defl);
  }
  for(let i = 1; i < defl.length; i++) inc.push(defl[i] - defl[i - 1]);
  const pred = Number.isFinite(crit.lam) && crit.lam > 0 ? Math.LN10 / crit.lam : NaN;
  let best = NaN, bestAt = NaN, last = NaN;
  for(let i = 0; i < inc.length; i++){
    if(!Number.isFinite(inc[i])) continue;
    last = inc[i];
    const e = Math.abs(inc[i] - pred) / Math.abs(pred);
    if(!(e >= best)){ best = e; bestAt = i + 2; }
  }
  return { eps, defl, inc, pred, last, best, bestAt,
           /* the photon ring's demagnification, e^(−2πλ): why the n = 1 ring in
              a black hole image is some five hundred times fainter than the
              direct one, computed from the same λ */
           dim: Number.isFinite(crit.lam) ? Math.exp(-2 * Math.PI * crit.lam) : NaN };
}

/* -------------------------------------------------- a mass profile, typed --- */
/* What the reader types is M(r) — the mass inside radius r — and the metric it
   names is

       A(r) = 1 − 2M(r)/r,     B(r) = 1/A(r)

   THE MODEL IS NAMED BECAUSE IT IS A MODEL (§1.2). A·B = 1 is equivalent to
   T^t_t = T^r_r, so to a radial pressure equal to minus the energy density; it
   is exact in vacuum and for the electrovacuum, and it is false inside an
   ordinary star, where the pressure is isotropic and A ≠ 1/B. What this class
   buys is that it contains, as three different M(r) and not as three different
   spacetimes, every preset in the table above: M = 1 is Schwarzschild,
   M = 1 − Q²/2r is Reissner–Nordström, M = 1 + Λr³/6 is Schwarzschild–de
   Sitter. So a reader who types a profile is moving inside one family and can
   see what changing the mass distribution alone does.

   Two profiles are worth typing and both are checkable in closed form.
   M = min(1, (r/R)³) is a uniform sphere, and outside R its deflection is
   IDENTICAL to a point mass of the same total — Birkhoff's theorem, measured
   rather than cited. M = kr is a conical spacetime, A is the constant 1 − 2k,
   and the deflection is exactly π(1/√(1−2k) − 1) at EVERY impact parameter: a
   mass rising in proportion to r bends every ray by the same angle, which is
   the opposite of the 1/b a point mass gives and is why an extended halo and a
   concentrated one are told apart by the shape of the arcs and not by their
   size. */
function rlMassAB(src){
  const M = rlFnR(src);
  if(!M) return null;
  const A = r => 1 - 2 * M(r) / r;
  const B = r => { const a = 1 - 2 * M(r) / r; return a === 0 ? Infinity : 1 / a; };
  return { M, A, B };
}
/* the closed form for the conical case, for the panel to check itself against */
const rlConeDefl = k => k < 0.5 ? Math.PI * (1 / Math.sqrt(1 - 2 * k) - 1) : NaN;

/* ------------------------------------------------------- the lens equation -- */
/* A source at angle β behind a lens appears at the angles θ solving

       β = θ − (D_LS/D_S)·α(D_L·θ)

   with α the deflection this module computes. β = 0 is the Einstein ring, and
   solving for it by bisection is a route that shares nothing with the textbook
   √(4GM D_LS/(c²D_L D_S)) — which is a WEAK-FIELD closed form, so the two
   agreeing is a statement about the regime as well as about the arithmetic.

   `alphaOf` takes an impact parameter in geometric units and returns radians;
   the caller owns the units, because a lensing geometry is quoted in parsecs
   and a metric in GM/c². */
function rlLensSolve(alphaOf, beta, DL, DS, thLo, thHi){
  const DLS = DS - DL;
  if(!(DLS > 0) || !(DL > 0)) return { th: NaN, why: 'the source is not behind the lens' };
  const f = th => th - (DLS / DS) * alphaOf(DL * th) - beta;
  const lo = thLo, hi = thHi;
  const flo = f(lo), fhi = f(hi);
  if(!Number.isFinite(flo) || !Number.isFinite(fhi) || (flo < 0) === (fhi < 0))
    return { th: NaN, why: 'no image in that range' };
  return { th: rlBisect(f, lo, hi), why: '' };
}
/* the weak-field Einstein radius, as the thing to check the solved one against */
const rlRingWeak = (Mg, DL, DS) => Math.sqrt(4 * Mg * (DS - DL) / (DL * DS));

/* ------------------------------------------- the fixed numbers, computed once
   The three things the lensing panel says about the actual sky — the 1919
   eclipse angle, the engine's own weak-field calibration, and the Einstein ring
   of a galaxy — are all Schwarzschild, and none of them depends on anything the
   reader can change. They are still COMPUTED rather than quoted (§1.1): the
   limb angle comes from the quadrature at b = R☉c²/GM☉ and the ring from
   bisecting the lens equation, which takes about sixty full deflections.

   They are memoised because a readout is called on every panel refresh, and a
   sixty-deflection bisection inside one is a hang rather than a slow frame:
   with them inline, a headless screenshot pass never returned at all. Nothing
   here can go stale — there is no input to invalidate against. */
let RL_LENS_FACTS = null;
function rlLensFacts(){
  if(RL_LENS_FACTS) return RL_LENS_FACTS;
  const A = rlFnR('1 - 2/r'), B = rlFnR('1/(1 - 2/r)');
  const far = b => ({ rIn: 3, rOut: b * 1e6, rObs: Infinity, panels: 64 });
  const bLimb = R_SUN * C2 / GM_SUN;
  const bCal = 3e6;
  const MPC = 1e6 * PARSEC, Mg = GM_SUN * 1e12 / C2;
  const DL = 1000 * MPC, DS = 2000 * MPC;
  const ring = rlLensSolve(
    bm => rlBend(A, B, bm / Mg, { rIn: 3, rOut: 1e14, rObs: Infinity, panels: 48 }).defl,
    0, DL, DS, 1e-9, 1e-3);
  RL_LENS_FACTS = {
    bLimb, limb: rlBend(A, B, bLimb, far(bLimb)).defl,
    limbTime: rlBend(A, () => 1, bLimb, far(bLimb)).defl,
    limbWeak: 4 / bLimb,
    bCal, cal: rlBend(A, B, bCal, far(bCal)).defl, calWeak: 4 / bCal,
    ring: ring.th, ringWhy: ring.why, ringWeak: rlRingWeak(Mg, DL, DS)
  };
  return RL_LENS_FACTS;
}
