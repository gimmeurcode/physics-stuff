/* ============================================================================
   5a · A METRIC THE READER SUPPLIES, AND THE GEODESICS OF IT
   Programme A, relativity (MASTER-PLAN §3.1 items 1–4). Everything in §5 of
   46-relativity.js knows in advance that it is looking at Schwarzschild: the
   horizon is written down as 2GM/c², the photon sphere as 1.5 rs, the ISCO as
   3 rs, the clock rate as √(1−rs/r). Those four are exactly the properties the
   presets are ALLOWED TO ASSUME, and §2.9's rule is that the reader's own
   scenario is the thing that tests them. So this module takes two arbitrary
   functions of r and recomputes every one of them by locating it.

   THE METRIC. Static, spherically symmetric, equatorial plane (θ = π/2, which
   costs nothing — every geodesic of such a spacetime lies in a plane, by the
   same angular-momentum argument as in Newton), and written

       ds² = −A(r) dt² + B(r) dr² + r² dφ²

   so what the reader supplies is A = −g_tt and B = g_rr.

   UNITS: G = c = 1, with lengths in units of the geometric mass M = GM/c² and
   times in units of GM/c³. Schwarzschild is then A = 1 − 2/r with its horizon
   at r = 2 — the form every textbook writes and the shortest thing anyone can
   type into a box. Multiply a length by GM/c² for metres and a time by GM/c³
   for seconds.

   THE TWO ROUTES, and they share nothing:

     ROUTE A  rlGeoRun integrates the second-order geodesic equation with the
              Christoffel symbols of the reader's own A and B. It never hears
              of E, L or the normalisation.
     ROUTE B  rlGeoConsts reads the Killing constants E = A·dt/dτ and
              L = r²·dφ/dτ and the norm off the state afterwards, and
              rlTurnPoints predicts where the orbit must turn from the
              potential A(r)(κ + L²/r²) alone, with no integration in it.

   So the drift of E and L along route A is an error measurement rather than a
   definition, and the turning radii are computed twice.

   Prefix: rl (shared with 46-relativity.js and the wing's stage helpers in
   66a — grep case-sensitively before adding a name).
   ============================================================================ */

/* --------------------------------------------------------- the metrics ---- */
/* Compile one of the table's source strings — or one the reader typed — into a
   function of r. The site's own parser already carries `r` as a macro for
   √(x²+y²+z²), so evaluating at (r, 0, 0) makes `1 - 2/r` mean exactly what it
   says and lets anyone who prefers `x` write that instead. Returns null rather
   than throwing, because a stage must never be taken down by a formula; what
   to SAY about a null is the caller's business.

   The A and B fields below are parsed, so they are ASCII (§2.10). The exA and
   exB beside them are the display copies and are never parsed. */
function rlFnR(src){
  try {
    const g = compile(parse(String(src)));
    const f = r => g(r, 0, 0);
    let ok = 0;
    for(const r of [2.7, 7.3, 31.7, 97.1]) if(Number.isFinite(f(r))) ok++;
    return ok >= 2 ? f : null;
  } catch(e){ return null; }
}

/* Five metrics and the reader's own. Every number declared here is recomputed
   by ./auditclaims.ps1 from the SOURCE STRING beside it, by routes this table
   does not own: horizons and photon spheres by bisection on the compiled
   expression, marginally stable orbits from the algebraic condition
   r·A·A″ + 3A·A′ = 2r·A′², and `vac` from a scan of A·B.

   The spread is deliberate. One horizon, two horizons of the same kind, two of
   entirely different kinds, and none at all — so nothing downstream is allowed
   to assume there is exactly one.

   `orb: [pericentre, eccentricity]` is where rlOrbit opens on this metric, and
   it is a CLAIM that the metric admits a bound orbit there — auditclaims checks
   it by running rlApsidesEL, which shares nothing with this table. It cannot be
   one number for all five: Schwarzschild–de Sitter's A(r) turns over at r ≈
   21.5 and no orbit may straddle that, so the apsides every other row uses lie
   in its forbidden region. `orb: null` is the claim that a metric admits no
   bound orbit anywhere, which is Minkowski's whole job here.

   `bc` and `lyap` are the light claims, added with item 4 (46c): the critical
   impact parameter r_ph/√A(r_ph), below which nothing that comes in goes out
   again, and the Lyapunov exponent of the photon sphere, which sets how many
   radians a near-critical ray gains per decade of approach and how much fainter
   each photon ring is than the one outside it. auditclaims recomputes both from
   closed forms derived by hand per family — 3√3 for Schwarzschild, √3 for its
   flat-space twin, and the analytic W″ = 6/r⁴ − 24/r⁵ + 20Q²/r⁶ for the charged
   one. Note that `lyap` differs between the first two rows while every other
   field is identical: the winding rate carries √(A·B) and the deflection is the
   one thing the 'only time curved' metric gets wrong about a photon sphere it
   otherwise puts in exactly the right place. And Λ drops out of W″ entirely, so
   de Sitter's λ is 1 like Schwarzschild's while its b_c is not. */
const RL_METRICS = {
  schwarzschild: {
    nm:'Schwarzschild', sub:'the vacuum outside any spherical mass',
    A:'1 - 2/r', B:'1/(1 - 2/r)', exA:'1 − 2/r', exB:'1/(1 − 2/r)',
    rh:[2], ph:3, isco:6, vac:true, rMax:60, rPlot:24, orb:[20, 0.35],
    bc:5.196152422706632, lyap:1,
    note:'Found in a trench on the Russian front within weeks of the field equations, and containing every classical test plus the black hole nobody wanted. In these units its horizon is at r = 2, which is 2GM/c².'
  },
  newton: {
    nm:'Only time curved', sub:'the metric Newton would have written',
    A:'1 - 2/r', B:'1', exA:'1 − 2/r', exB:'1',
    rh:[2], ph:3, isco:6, vac:false, rMax:60, rPlot:24, orb:[20, 0.35],
    bc:5.196152422706632, lyap:1.7320508075688772,
    note:'Keep the time coefficient and leave space flat. Almost all of everyday gravity is in the time part, so this reproduces Newtonian orbits well — and it is exactly the metric whose light deflection is HALF the real one. The missing half is the space curvature you have just deleted. Circular orbits are untouched, because they depend only on A: the horizon, the photon sphere and the ISCO all sit where Schwarzschild puts them.'
  },
  rn: {
    nm:'Reissner–Nordström', sub:'a charged hole, Q² = 0.64 M²',
    A:'1 - 2/r + 0.64/r^2', B:'1/(1 - 2/r + 0.64/r^2)',
    exA:'1 − 2/r + 0.64/r²', exB:'1/(1 − 2/r + 0.64/r²)',
    rh:[0.4, 1.6], ph:2.4848857801796105, isco:4.8907666705709474, vac:true, rMax:60, rPlot:20, orb:[20, 0.35],
    bc:4.5459862721284416, lyap:0.8903376029888671,
    note:'Charge adds a term of the opposite sign, so the hole has TWO horizons — at 1 ± √(1−Q²) — and they approach each other as the charge grows. Past Q = M they vanish and the singularity is naked, which is what cosmic censorship conjectures cannot happen.'
  },
  desitter: {
    nm:'Schwarzschild–de Sitter', sub:'a hole in an expanding universe, Λ = 3×10⁻⁴',
    A:'1 - 2/r - r^2/10000', B:'1/(1 - 2/r - r^2/10000)',
    exA:'1 − 2/r − Λr²/3', exB:'1/(1 − 2/r − Λr²/3)',
    rh:[2.0008009615388218, 98.984586375429302], ph:3,
    isco:6.2425419579791193, iscoOut:12.249918537435661, vac:true, rMax:200, rPlot:120, orb:[8, 0.2],
    bc:5.2031814654958719, lyap:1,
    note:'Two horizons of entirely different character: a black-hole horizon just outside r = 2 and a COSMOLOGICAL one at r ≈ 99, beyond which the expansion carries everything away. You live in the static region between them. The photon sphere sits at exactly 3 whatever Λ is — the Λ terms cancel out of A′r = 2A — but the stable orbits acquire an outer edge as well as an inner one.'
  },
  flat: {
    nm:'Minkowski', sub:'no gravity at all — the control',
    A:'1', B:'1', exA:'1', exB:'1',
    rh:[], ph:null, isco:null, vac:true, rMax:40, rPlot:20, orb:null,
    bc:null, lyap:null,
    note:'Flat spacetime in polar coordinates. No horizon, no photon sphere, no circular orbit and no bound orbit — a geodesic here is a straight line, and the panel should say so rather than produce a number. It is here because a laboratory that cannot report "nothing happens" cannot be trusted when it reports that something did.'
  }
};

/* ---------------------------------------------------------- small tools ---- */

/* the derivative of a caller-supplied function, to fourth order. h is scaled to
   r because a metric's structure sits at the scale of its own horizon, and for
   double precision the round-off floor eps·|f|/h and the truncation h⁴f⁽⁵⁾/30
   cross near h = 1e-3·r. The unit suite measures what this actually achieves on
   1 − 2/r rather than trusting the balance argument — five orders below the
   1e-8 drift these derivatives are used to measure is the only reason a
   numerical derivative is admissible here at all. */
function rlDeriv(f, r){
  const h = 1e-3 * Math.max(1e-3, Math.abs(r));
  const a = f(r + 2 * h), b = f(r + h), c = f(r - h), d = f(r - 2 * h);
  const v = (-a + 8 * b - 8 * c + d) / (12 * h);
  return Number.isFinite(v) ? v : NaN;
}
/* bisection to the last representable bit — 1e-16 relative, which is what lets
   a located horizon be compared with 2GM/c² at 1e-9 without the comparison
   being about the root-finder. */
function rlBisect(f, lo, hi){
  let a = lo, b = hi, fa = f(a);
  if(!Number.isFinite(fa)) return NaN;
  for(let i = 0; i < 200; i++){
    const m = 0.5 * (a + b);
    if(m <= a || m >= b) break;
    const fm = f(m);
    if(!Number.isFinite(fm)) break;
    if((fm < 0) === (fa < 0)){ a = m; fa = fm; } else b = m;
  }
  return 0.5 * (a + b);
}
/* a geometric ladder in r: a metric's features sit at scales, not at spacings,
   and a linear scan fine enough to resolve a horizon at r = 2 wastes every one
   of its samples out at r = 200. */
function rlScan(rLo, rHi, n, fn){
  const N = Math.max(8, Math.round(n || 2000));
  for(let i = 0; i <= N; i++) fn(rLo * Math.pow(rHi / rLo, i / N), i);
}

/* --------------------------------------------------------- the horizons ---- */
/* Every radius in [rLo, rHi] where A changes sign — the horizons of the
   reader's metric, LOCATED rather than quoted. Schwarzschild has one;
   Reissner–Nordström has two, and none at all once the charge is large enough,
   which is the naked singularity cosmic censorship is about; Schwarzschild–de
   Sitter has two of entirely different character; a star's interior solution
   has none. Nothing downstream may assume how many there are, which is why
   this returns a list.

   A sign change is the right test because that is what a horizon IS in these
   coordinates: the coefficient of dt² vanishes and changes sign, so t stops
   being a time and r stops being a space. A zero that does NOT change sign —
   the extremal Reissner–Nordström double root — is a degenerate horizon, and
   it is reported separately rather than counted as two or missed entirely. */
function rlHorizons(A, rLo, rHi, n){
  const roots = [], touch = [];
  let r2 = NaN, v2 = NaN, r1 = NaN, v1 = NaN;
  rlScan(rLo, rHi, n || 4000, (r) => {
    const v = A(r);
    if(Number.isFinite(v) && Number.isFinite(v1)){
      if(v === 0) roots.push(r);
      else if(v1 !== 0 && (v1 < 0) !== (v < 0)){
        const rt = rlBisect(A, r1, r);
        if(Number.isFinite(rt)) roots.push(rt);
      }
      /* A dipping towards zero and coming back: the DEGENERATE case, where an
         extremal hole's two horizons have merged into a double root. It has no
         sign change at all, so a crossing scan is blind to it — and it cannot
         be caught by "is a sample small?" either, because near a double root
         A ~ (r−r₀)² and the scan would have to land within 3e-5 of the root to
         see 1e-9. The bracket is refined by golden section first and the
         question asked afterwards, which is the only order that works. */
      else if(Number.isFinite(v2) && v1 < v2 && v1 <= v && v1 !== 0 && (v1 > 0) === (v2 > 0)){
        const m = rlMinAbs(A, r2, r);
        if(Number.isFinite(m.r)) touch.push(m);
      }
    }
    r2 = r1; v2 = v1; r1 = r; v1 = v;
  });
  return { roots, touch, count: roots.length,
           outer: roots.length ? roots[roots.length - 1] : NaN,
           inner: roots.length ? roots[0] : NaN };
}
/* golden-section on |A| inside a bracket, for the degenerate horizon above.
   The location of a minimum is only ever recoverable to √eps of its scale —
   but the VALUE there is what is being asked about, and that is recovered in
   full, since A ~ (r−r₀)² turns a 1e-8 error in position into 1e-16 in A. */
function rlMinAbs(A, lo, hi){
  const g = 0.6180339887498949;
  let a = lo, b = hi;
  let c = b - g * (b - a), d = a + g * (b - a);
  let fc = Math.abs(A(c)), fd = Math.abs(A(d));
  for(let i = 0; i < 120 && b - a > 1e-14 * Math.max(1, Math.abs(b)); i++){
    if(fc < fd){ b = d; d = c; fd = fc; c = b - g * (b - a); fc = Math.abs(A(c)); }
    else       { a = c; c = d; fc = fd; d = a + g * (b - a); fd = Math.abs(A(d)); }
  }
  const r = 0.5 * (a + b);
  return { r, val: Math.abs(A(r)) };
}
/* The band of radii a static observer can occupy: the OUTERMOST interval on
   which A > 0. Not "outside the outermost horizon" — that is the trap, and it
   is the one that caught this module's own test suite. Schwarzschild–de Sitter
   has a cosmological horizon at r ≈ 99 with A < 0 beyond it, so "outside the
   outermost horizon" is precisely where nobody can stand, and a scan started
   there returns NaN for every quantity in the wing. */
function rlStaticBand(A, rLo, rHi, n){
  const H = rlHorizons(A, rLo, rHi, n);
  const edges = [rLo].concat(H.roots).concat([rHi]);
  for(let i = edges.length - 2; i >= 0; i--){
    const lo = edges[i], hi = edges[i + 1];
    if(!(hi > lo)) continue;
    const mid = Math.sqrt(lo * hi);
    if(A(mid) > 0) return { lo, hi, horizons: H, open: hi === rHi };
  }
  return { lo: NaN, hi: NaN, horizons: H, open: false };
}

/* ------------------------------------------------------- A·B, measured ----- */
/* A·B = 1 is this wing's oldest unstated assumption: the existing stage prints
   "the two factors — and they are reciprocals" as a caption. It is true of
   every vacuum solution and every electrovacuum one — it is equivalent to
   T^t_t = T^r_r, so to a radial pressure equal to minus the energy density —
   and it is false inside any ordinary star. Worth measuring rather than
   captioning, which is the whole of §2.9 in one line. */
function rlABGap(A, B, rLo, rHi, n){
  let worst = 0, at = NaN, prod = NaN, used = 0;
  rlScan(rLo, rHi, n || 600, (r) => {
    const a = A(r), b = B(r);
    if(!Number.isFinite(a) || !Number.isFinite(b) || !(a > 0)) return;
    const e = Math.abs(a * b - 1);
    /* the FIRST accepted sample seeds the record, or a metric with A·B exactly
       1 everywhere never beats `worst = 0` and reports no radius at all */
    if(!used || e > worst){ worst = e; at = r; prod = a * b; }
    used++;
  });
  /* `prod` is the product AT the worst radius, so a caller can hand the two
     numbers to fmtAgree and have the scale derived rather than remembered */
  return { gap: used ? worst : NaN, r: at, prod: used ? prod : NaN, used };
}

/* ------------------------------------------- the embedding of the plane ---- */
/* The picture everyone has seen. dl² = B dr² + r²dφ² is a two-dimensional
   surface; embed it in Euclidean 3-space as a surface of revolution and its
   height obeys (dz/dr)² = B(r) − 1. For Schwarzschild that integrates to
   Flamm's paraboloid 2√(rs(r−rs)) in closed form, and grFlammZ in 46 quotes
   the answer; here it is a quadrature over the reader's own B, so the drawn
   surface is the reader's geometry rather than a picture of somebody else's.

   The substitution r = r₀ + w² is not a convenience. B diverges like 1/(r−r₀)
   at a horizon, so √(B−1) diverges like 1/√(r−r₀) — integrable, but a
   quadrature started at the horizon returns Infinity on its first sample. In w
   the integrand 2w√(B−1) tends to a finite limit, and Simpson gets the full
   order back. Where B < 1 the metric squeezes rather than stretches and no
   Euclidean embedding exists at all; those samples are counted in `imag` and
   reported, never drawn as zero. */
function rlEmbedZ(B, r0, rEnd, n){
  const N = 2 * Math.max(2, Math.round((n || 400) / 2));
  const wEnd = Math.sqrt(Math.max(0, rEnd - r0)), h = wEnd / N;
  const rs = new Float64Array(N + 1), zs = new Float64Array(N + 1);
  let imag = 0, bad = 0;
  /* w = 0 sits exactly ON the horizon, where B is infinite and the integrand
     2w√(B−1) is a 0·∞ whose LIMIT is the finite thing being integrated. Taking
     the guard's zero there instead cost the first panel its whole contribution
     — 17% of z at the first sample, which is a wrong PICTURE of the funnel
     near the horizon and nothing else would have caught it. Nudging w off the
     endpoint evaluates the limit instead, and costs a non-singular B nothing,
     since there the integrand really is ~0 at w = 0.

     The nudge has to be big enough to SURVIVE: the first attempt used 1e-9·wEnd
     and changed nothing at all, because r₀ + w² with w ~ 6e-9 and r₀ = 2 is
     2 + 4e-17, which rounds back to exactly 2 in double precision and lands on
     the pole again. Offsetting r by a fixed 1e-10 RELATIVE instead puts the
     sample a thousand ulps clear of the horizon while still evaluating the
     limit to ten digits. */
  const w0 = Math.sqrt(1e-10 * Math.max(1e-6, Math.abs(r0)));
  const g = ww => {
    const w = Math.max(ww, w0);
    const r = r0 + w * w, b = B(r);
    if(!Number.isFinite(b)){ bad++; return 0; }
    if(b < 1){ imag++; return 0; }
    return 2 * w * Math.sqrt(b - 1);
  };
  rs[0] = r0; zs[0] = 0;
  for(let i = 1; i <= N; i++){
    const w0 = (i - 1) * h, w1 = i * h;
    /* Simpson on each panel, so the profile is fourth order in h even though
       the samples are handed back one at a time for drawing */
    zs[i] = zs[i - 1] + h / 6 * (g(w0) + 4 * g(0.5 * (w0 + w1)) + g(w1));
    rs[i] = r0 + w1 * w1;
  }
  return { r: rs, z: zs, imag, bad, total: N + 1 };
}

/* ------------------------------------------------- circular orbits, ISCO --- */
/* The specific angular momentum of a circular orbit at r, from setting the
   derivative of the potential A(r)(κ + L²/r²) to zero:
       L² = κ A′r³ / (2A − A′r)
   For Schwarzschild this is r²/(r−3), whose minimum at r = 6 is the ISCO — so
   the innermost stable circular orbit falls out of the reader's metric instead
   of being written down as 3 rs. NaN where no circular orbit exists: the
   denominator changes sign at the photon sphere, and inside that there are
   none of either kind. */
function rlCircularEL(A, r, kappa){
  const k = kappa === undefined ? 1 : kappa;
  const a = A(r), ap = rlDeriv(A, r);
  if(!Number.isFinite(a) || !Number.isFinite(ap) || !(a > 0)) return { E:NaN, L:NaN, Lsq:NaN, r };
  const den = 2 * a - ap * r;
  const Lsq = k * ap * r * r * r / den;
  /* L² = 0 is not a circular orbit. It is what a constant A returns — a
     particle sitting still in flat space, which is a perfectly good geodesic
     and no kind of orbit. Admitting it made the engine report that Minkowski
     has circular orbits everywhere, and that E = 1 was their energy. */
  if(!(Lsq > 0) || !Number.isFinite(Lsq)) return { E:NaN, L:NaN, Lsq:NaN, r };
  const Esq = a * (k + Lsq / (r * r));
  return { E: Esq >= 0 ? Math.sqrt(Esq) : NaN, L: Math.sqrt(Lsq), Lsq, r };
}
/* The photon sphere: a circular NULL orbit, where κ = 0 leaves only A′r = 2A.
   Schwarzschild gives r = 3 exactly (1.5 rs), and bisection returns it to the
   last bit. */
function rlPhotonR(A, rLo, rHi, n){
  const f = r => rlDeriv(A, r) * r - 2 * A(r);
  const roots = [];
  let rp = NaN, vp = NaN;
  rlScan(rLo, rHi, n || 2000, (r) => {
    const v = f(r);
    if(Number.isFinite(v) && Number.isFinite(vp) && vp !== 0 && v !== 0 && (vp < 0) !== (v < 0)){
      const rt = rlBisect(f, rp, r);
      if(Number.isFinite(rt) && A(rt) > 0) roots.push(rt);
    }
    rp = r; vp = v;
  });
  return { roots, outer: roots.length ? roots[roots.length - 1] : NaN };
}
/* The marginally stable circular orbits: the stationary points of L²(r), found
   by bisecting its DERIVATIVE rather than by minimising it, because a minimum
   is only locatable to √eps of its scale whereas a sign change is locatable to
   eps. The composed numerical derivative has a noise floor near 1e-10 absolute
   and Schwarzschild's L² has curvature 2/3 there, so the root should land
   within ~1e-9 of 6 — the unit suite asserts it and prints what it got,
   because a predicted floor that was never measured is a guess.

   Each stationary point is CLASSIFIED, and taking "the outermost" would have
   been wrong. L² falling then rising (− → +) is a minimum, and orbits outside
   it are stable: that is the ISCO. L² rising then falling is a maximum, and
   orbits outside THAT are unstable again. Schwarzschild has only the first;
   Schwarzschild–de Sitter has both, because far enough out the cosmological
   term wins and there is an OUTERMOST stable circular orbit as well. A metric
   the reader types may have any number of either, so this reports the list. */
function rlIscoR(A, rLo, rHi, n){
  const Lsq = r => rlCircularEL(A, r, 1).Lsq;
  const d = r => rlDeriv(Lsq, r);
  const roots = [];
  let rp = NaN, vp = NaN;
  rlScan(rLo, rHi, n || 1200, (r) => {
    const v = d(r);
    if(Number.isFinite(v) && Number.isFinite(vp) && (vp < 0) !== (v < 0)){
      const rt = rlBisect(d, rp, r);
      if(Number.isFinite(rt) && Lsq(rt) > 0) roots.push({ r: rt, min: vp < 0 });
    }
    rp = r; vp = v;
  });
  const mins = roots.filter(x => x.min).map(x => x.r);
  const maxs = roots.filter(x => !x.min).map(x => x.r);
  return { roots, mins, maxs,
           /* the ISCO is the INNERMOST minimum: the inner edge of the first
              band of stable orbits */
           r: mins.length ? mins[0] : NaN,
           /* and the outer edge of that band, where there is one */
           rOut: maxs.length ? maxs[maxs.length - 1] : NaN };
}

/* --------------------------------------------- the potential and its turns - */
/* dr/dτ squared is (E² − V²)/(A·B) with V²(r) = A(r)(κ + L²/r²). For
   Schwarzschild A·B = 1 and this is the textbook form; for a general metric the
   factor is still positive wherever A is, so the TURNING POINTS are the roots
   of V² = E² whatever B happens to do. */
const rlVsq = (A, r, L, kappa) => A(r) * ((kappa === undefined ? 1 : kappa) + L * L / (r * r));

/* ROUTE B for the shape of the orbit: where the potential says it must turn,
   found without integrating anything at all. */
function rlTurnPoints(A, E, L, kappa, rLo, rHi, n){
  const f = r => rlVsq(A, r, L, kappa) - E * E;
  const roots = [];
  let rp = NaN, vp = NaN;
  rlScan(rLo, rHi, n || 4000, (r) => {
    const v = f(r);
    if(Number.isFinite(v) && Number.isFinite(vp) && vp !== 0 && v !== 0 && (vp < 0) !== (v < 0)){
      const rt = rlBisect(f, rp, r);
      if(Number.isFinite(rt)) roots.push(rt);
    }
    rp = r; vp = v;
  });
  return roots;
}
/* E and L for an orbit whose turning points are exactly r1 and r2. Demanding
   V²(r1) = V²(r2) = E² and subtracting eliminates E:
       L² = κ(A₂ − A₁) / (A₁/r₁² − A₂/r₂²),      E² = A₁(κ + L²/r₁²)
   Timelike only: for a null geodesic κ = 0 and the apsides fix nothing but the
   ratio L/E, which is the whole content of light having no scale of its own.
   Returns NaN when no such orbit exists — the caller must SAY so rather than
   print a number, which is the defect auditsides caught in grLFromTurning on
   2026-08-15. */
function rlApsidesEL(A, r1, r2, kappa){
  const k = kappa === undefined ? 1 : kappa;
  if(!(k > 0)) return { E:NaN, L:NaN };
  const a1 = A(r1), a2 = A(r2);
  if(!Number.isFinite(a1) || !Number.isFinite(a2) || !(a1 > 0) || !(a2 > 0)) return { E:NaN, L:NaN };
  const den = a1 / (r1 * r1) - a2 / (r2 * r2);
  if(!Number.isFinite(den) || den === 0) return { E:NaN, L:NaN };
  /* strictly positive, for the same reason as in rlCircularEL: A₁ = A₂ gives
     L² = 0, which is not an orbit between two apsides but a particle at rest,
     and flat spacetime satisfies it at every pair of radii */
  const Lsq = k * (a2 - a1) / den;
  if(!(Lsq > 0)) return { E:NaN, L:NaN };
  const Esq = a1 * (k + Lsq / (r1 * r1));
  if(!(Esq > 0)) return { E:NaN, L:NaN, why:'no real energy' };
  /* V²(r₁) = V²(r₂) = E² is necessary and NOT sufficient, and the difference
     is a whole class of wrong answer. The same two conditions are satisfied
     when the radii bracket a BARRIER — V² climbing ABOVE E² between them — and
     then the region between is forbidden, the particle is on the far side of
     it, and there is no orbit there at all. Schwarzschild never does this,
     which is exactly why the formula looked finished; Schwarzschild–de Sitter
     does it the moment the apsides straddle the maximum of A, and the geodesic
     then ran off to the cosmological horizon while the panel reported a bound
     orbit with apsides at 14 and 20 (runstagetests, 2026-08-18). Sample the
     interior and require it to be allowed. */
  const L = Math.sqrt(Lsq);
  let vmin = Infinity;
  for(let i = 1; i < 24; i++){
    const v = rlVsq(A, r1 + (r2 - r1) * i / 24, L, k);
    if(!Number.isFinite(v)) return { E:NaN, L:NaN, why:'the metric is not a number between those radii' };
    vmin = Math.min(vmin, v);
  }
  if(!(vmin < Esq))
    return { E:NaN, L:NaN, why:'barrier',
             note:'those two radii bracket a barrier rather than a well — the region between them is forbidden' };

  /* AND THE WALLS MUST RISE. This is the same defect as the barrier above, one
     level further out, and the interior scan cannot see either half of it: the
     scan asks whether the region BETWEEN the apsides is allowed, and both of
     the following pass that test while describing no bound orbit at all.

       · V² falls again just OUTSIDE r₂. Then r₂ is not a turning point but the
         TOP of the outer barrier — an unstable circular orbit. A particle
         released there takes infinite proper time to arrive, and the least
         round-off carries it over the top and away. Schwarzschild–de Sitter
         does this the moment the apocentre reaches its outermost unstable
         circular orbit: apsides 10 and 13.53 passed every check this function
         had on 2026-08-18, and the integrated track left the window.
       · V² falls just INSIDE r₁. Then there is no centrifugal wall under the
         pericentre and the orbit plunges. SCHWARZSCHILD does this — for every
         pericentre inside the unstable circular orbit of that L — so this half
         is not exotic and was reachable from rlMetric's own pericentre slider
         at r₁ = 5.5, which is inside the ISCO at 6.

     Both are LOCAL: they are statements about the slope at each apsis, not
     about the interval, and neither is visible to any amount of sampling
     between the two radii. The probe is a secant rather than a derivative
     because a derivative of a reader-supplied A carries rlDeriv's noise floor,
     and the sign is all that is being asked. Two offsets, because one of them
     could land beyond a narrow feature of somebody's typed metric.

     The measured margins are RETURNED, not just tested. How far V² rises above
     E² at the wall is how far the orbit is from being marginally bound, and at
     dS apsides 12 and 12.49 it is 3×10⁻⁸ — a zoom–whirl on the edge of
     escaping, which is worth printing rather than merely surviving. */
  const dw = 0.02 * Math.min(r2 - r1, r1);
  const wall = (r0, sgn) => {           // sgn +1 outward from r2, −1 inward from r1
    let m = Infinity;
    for(const f of [1, 3]){
      const rr = r0 + sgn * f * dw;
      if(!(rr > 0)) return -Infinity;   // the probe fell through the origin
      const v = rlVsq(A, rr, L, k);
      /* a non-finite V², or one inside a horizon where A ≤ 0, is not a wall:
         V² ≤ 0 < E² there, which is a fall and reads as one */
      m = Math.min(m, Number.isFinite(v) ? (v - Esq) / Esq : -Infinity);
    }
    return m;
  };
  const wallOut = wall(r2, +1), wallIn = wall(r1, -1);
  if(!(wallOut > 0))
    return { E:NaN, L:NaN, why:'escape', wallOut, wallIn,
             note:'the potential does not rise again outside the apocentre, so that radius is the top of the outer barrier rather than a turning point — the particle goes over it and escapes' };
  if(!(wallIn > 0))
    return { E:NaN, L:NaN, why:'plunge', wallOut, wallIn,
             note:'the potential falls away inside the pericentre, so there is no centrifugal wall to turn the orbit and it plunges' };
  return { E: Math.sqrt(Esq), L, Lsq, Esq, wallOut, wallIn };
}

/* ------------------------------------------------------- ROUTE B, the shape -
   The apsidal angle by QUADRATURE — half the angle swept between pericentre
   and apocentre — with no integration of the geodesic equation anywhere in it.
   Dividing dφ/dτ = L/r² by dr/dτ = √((E²−V²)/AB) removes the proper time:

       Δφ½ = ∫ (L/r²) √(A·B / (E² − V²)) dr        from r₁ to r₂

   and the orbit closes when that is exactly π. So 2Δφ½ − 2π is the precession,
   and it is reached from E and L through the potential alone — which is what
   makes it an independent check on rlGeoRun + rlPeriShift rather than a
   restatement of them. The two agree to between 4×10⁻¹¹ and 3×10⁻⁹ relative
   over every preset (measured 2026-08-18).

   THE SUBSTITUTION IS NOT OPTIONAL. E² − V² vanishes linearly at both ends, so
   the integrand has an inverse-square-root singularity at each, and no ordinary
   rule converges on it. Writing r = ½(r₁+r₂) + ½(r₂−r₁)·sin θ makes dr carry a
   cos θ that cancels the singularity exactly: near either end both numerator
   and denominator vanish like the same power of the distance to the endpoint,
   the ratio is an ANALYTIC function of that distance squared, and Gauss–
   Legendre — which never evaluates an endpoint — converges spectrally. It is
   converged to 10⁻¹² by 16 panels; 64 is used because it costs nothing and
   more than that starts ACCUMULATING round-off rather than removing error.

   The one regime it cannot serve is a nearly circular orbit, where E² − V² is
   O((r₂−r₁)²) everywhere and the subtraction loses those digits to
   cancellation. At the closest apsides this site's sliders reach it costs about
   four figures of sixteen, which is charged against a quantity already good to
   ten. */
function rlApsidalQuad(A, B, r1, r2, E, L, kappa, panels){
  const k = kappa === undefined ? 1 : kappa;
  if(!(r2 > r1) || !(L > 0) || !Number.isFinite(E)) return NaN;
  const c = 0.5 * (r1 + r2), b = 0.5 * (r2 - r1), Esq = E * E;
  const g = th => {
    const r = c + b * Math.sin(th), a = A(r), bb = B(r);
    if(!Number.isFinite(a) || !Number.isFinite(bb) || !(a > 0) || !(bb > 0)) return 0;
    const d = Esq - a * (k + L * L / (r * r));
    if(!(d > 0)) return 0;
    return (L / (r * r)) * Math.sqrt(a * bb / d) * b * Math.cos(th);
  };
  return nqGauss(g, -Math.PI / 2, Math.PI / 2, 8, panels || 64);
}

/* THE CONTROL, and the reason it is here rather than in a test file.

   Every number this module reports about an orbit is a small difference from
   2π, and the one question that cannot be answered from inside is whether the
   machinery MANUFACTURES that difference. So run the identical quadrature on
   the problem whose answer is known exactly to be zero: the Newtonian Kepler
   orbit, whose apsidal angle is π for every pair of apsides because the
   inverse square is one of the two force laws whose orbits close.

       (dr/dt)² = 2E + 2/r − L²/r²,   dφ/dt = L/r²,
       L² = 2r₁r₂/(r₁+r₂) = p,        E  = −1/(r₁+r₂)

   It returns π to about 3×10⁻¹² — a round-off floor, not a truncation one: it
   does not improve with more panels, because it is the endpoint cancellation in
   E² − V² and nothing else. Against a Schwarzschild precession of 2.7×10⁻² at
   the weakest field the sliders reach, that is nine orders of margin. */
function rlKeplerApsidal(r1, r2, panels){
  if(!(r2 > r1) || !(r1 > 0)) return NaN;
  const Lsq = 2 * r1 * r2 / (r1 + r2), En = -1 / (r1 + r2), L = Math.sqrt(Lsq);
  const c = 0.5 * (r1 + r2), b = 0.5 * (r2 - r1);
  const g = th => {
    const r = c + b * Math.sin(th);
    const d = 2 * En + 2 / r - Lsq / (r * r);
    if(!(d > 0)) return 0;
    return (L / (r * r)) / Math.sqrt(d) * b * Math.cos(th);
  };
  return nqGauss(g, -Math.PI / 2, Math.PI / 2, 8, panels || 64);
}

/* The semi-latus rectum of the orbit with those apsides, and the first-order
   prediction 6πGM/c²a(1−e²) built on it. In these units GM/c² is 1, and
   a(1−e²) = 2r₁r₂/(r₁+r₂) identically, so the textbook formula is 6π/p.

   It is an EXPANSION, not an answer: the fractional error against the measured
   precession is about 4.6/p, so it is right to 0.67% at the widest orbit the
   sliders reach and wrong by 21% at r₁ = 20. Both of those are printed, and the
   panel says which regime it is in rather than reporting the gap as a failure. */
const rlSemiLatus  = (r1, r2) => 2 * r1 * r2 / (r1 + r2);
const rlPrecessWeak = (r1, r2) => 6 * Math.PI / rlSemiLatus(r1, r2);

/* The step size and step count for ROUTE A on a given orbit, shared by every
   caller so that one rule is fixed once.

   The obvious rule — the Newtonian radial period over a fixed number of steps —
   is wrong in exactly the regime this wing exists to show. A relativistic orbit
   spends most of its ANGLE near pericentre, whirling; sizing the step by the
   radial period samples that whirl a handful of times, and on Schwarzschild–de
   Sitter it lost enough accuracy to drop the track through the horizon while
   route B reported a perfectly good precession. So bound the ANGULAR step at
   pericentre too, where dφ/dτ = L/r₁² is largest, and take whichever is
   smaller. That alone turned four failing presets into agreement at 10⁻¹⁰.

   `orbits + 1.5` because rlPeriShift needs one more pericentre than the number
   of gaps it is being asked for, and the relativistic radial period exceeds the
   Newtonian estimate the budget is built from. */
function rlOrbitPlan(r1, r2, L, orbits, nper){
  const n = nper || 1400;
  const a = 0.5 * (r1 + r2), T = 2 * Math.PI * Math.pow(a, 1.5);
  const h = Math.min(T / n, 2 * Math.PI * r1 * r1 / (Math.max(1e-30, L) * n));
  return { h, T, steps: Math.min(200000, Math.ceil(T / h * ((orbits || 4) + 1.5))) };
}

/* ------------------------------------------------------------- ROUTE A ----- */
/* State y = [t, r, φ, dt/dτ, dr/dτ, dφ/dτ], parameter τ. The Christoffel
   symbols of ds² = −A dt² + B dr² + r²dφ² are
       Γ^t_tr = A′/2A      Γ^r_tt = A′/2B      Γ^r_rr = B′/2B
       Γ^r_φφ = −r/B       Γ^φ_rφ = 1/r
   and what is below is the geodesic equation built from them.

   NOTHING about E, L or the normalisation appears in this function. That is
   the entire point: they are constants of the motion because of the two
   Killing vectors, so their drift along the integrated track measures the
   integration and the Christoffels rather than restating an assumption. */
function rlGeoRHS(A, B, y, out){
  const r = y[1];
  const a = A(r), b = B(r);
  const ap = rlDeriv(A, r), bp = rlDeriv(B, r);
  out[0] = y[3];
  out[1] = y[4];
  out[2] = y[5];
  out[3] = -(ap / a) * y[3] * y[4];
  out[4] = -(ap / (2 * b)) * y[3] * y[3] - (bp / (2 * b)) * y[4] * y[4] + (r / b) * y[5] * y[5];
  out[5] = -(2 / r) * y[4] * y[5];
  return out;
}
/* The Killing constants and the norm, read off a state. E is conserved because
   ∂/∂t is a Killing vector and L because ∂/∂φ is; the norm is −κ by the
   definition of proper time. */
function rlGeoConsts(A, B, y){
  const r = y[1], a = A(r), b = B(r);
  return { E: a * y[3], L: r * r * y[5],
           norm: -a * y[3] * y[3] + b * y[4] * y[4] + r * r * y[5] * y[5] };
}
/* The initial state at radius r with constants E and L. dr/dτ comes from the
   first integral, so this is the ONE place a constant enters route A — as an
   initial condition, which every integration needs and from which no
   conservation law follows. */
function rlGeoInit(A, B, r, E, L, kappa, sgn){
  const k = kappa === undefined ? 1 : kappa;
  const a = A(r), b = B(r);
  const rd2 = (E * E / a - L * L / (r * r) - k) / b;
  const rd = rd2 > 0 ? Math.sqrt(rd2) : 0;
  return [0, r, 0, E / a, (sgn === undefined ? 1 : sgn) * rd, L / (r * r)];
}
/* RK4 on the geodesic equation. Stops early — and says which — when the track
   reaches rStop (a horizon: inside it these coordinates are not a chart, and
   marching on would be arithmetic about nothing), leaves rEsc, or goes
   non-finite because the reader's metric has a pole where the orbit went.

   Returns the track and the largest RELATIVE excursion of each constant over
   the run. Relative, because E is of order 1 and L of order r: one shared
   absolute floor would be meaningless for both of them. */
function rlGeoRun(A, B, y0, h, steps, opt){
  const o = opt || {};
  const N = Math.max(1, Math.min(200000, Math.round(steps)));
  const rStop = o.rStop === undefined ? 0 : o.rStop;
  const rEsc = o.rEsc === undefined ? Infinity : o.rEsc;
  const tau = new Float64Array(N + 1), tt = new Float64Array(N + 1),
        rr = new Float64Array(N + 1), pp = new Float64Array(N + 1);
  const c0 = rlGeoConsts(A, B, y0);
  const sE = Math.max(1e-30, Math.abs(c0.E)), sL = Math.max(1e-30, Math.abs(c0.L));
  const sN = Math.max(1e-30, Math.abs(c0.norm));
  let dE = 0, dL = 0, dN = 0, n = 0, stop = '';
  let y = y0.slice(), rMin = y0[1], rMax = y0[1];
  const k1 = new Float64Array(6), k2 = new Float64Array(6), k3 = new Float64Array(6),
        k4 = new Float64Array(6), tmp = new Float64Array(6);
  tau[0] = 0; tt[0] = y[0]; rr[0] = y[1]; pp[0] = y[2];
  for(let i = 1; i <= N; i++){
    rlGeoRHS(A, B, y, k1);
    for(let j = 0; j < 6; j++) tmp[j] = y[j] + 0.5 * h * k1[j];
    rlGeoRHS(A, B, tmp, k2);
    for(let j = 0; j < 6; j++) tmp[j] = y[j] + 0.5 * h * k2[j];
    rlGeoRHS(A, B, tmp, k3);
    for(let j = 0; j < 6; j++) tmp[j] = y[j] + h * k3[j];
    rlGeoRHS(A, B, tmp, k4);
    for(let j = 0; j < 6; j++) y[j] += h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]);
    if(!Number.isFinite(y[1]) || !Number.isFinite(y[4])){ stop = 'the metric went singular along the track'; break; }
    if(y[1] <= rStop){ stop = 'the track reached the horizon'; break; }
    if(y[1] >= rEsc){ stop = 'the track left the window'; break; }
    n = i;
    tau[i] = i * h; tt[i] = y[0]; rr[i] = y[1]; pp[i] = y[2];
    rMin = Math.min(rMin, y[1]); rMax = Math.max(rMax, y[1]);
    const c = rlGeoConsts(A, B, y);
    dE = Math.max(dE, Math.abs(c.E - c0.E) / sE);
    dL = Math.max(dL, Math.abs(c.L - c0.L) / sL);
    dN = Math.max(dN, Math.abs(c.norm - c0.norm) / sN);
  }
  return { tau: tau.subarray(0, n + 1), t: tt.subarray(0, n + 1),
           r: rr.subarray(0, n + 1), ph: pp.subarray(0, n + 1), n,
           E0: c0.E, L0: c0.L, norm0: c0.norm,
           driftE: dE, driftL: dL, driftNorm: dN, rMin, rMax, stop, steps: N };
}
/* Successive perihelion passages of an integrated track, and the angle between
   them. Parabolic refinement in the index, so the answer is not limited by the
   step size — the same trick grPeriapsisAngle uses on the u-equation, and the
   reason a precession of 1e-6 radians per orbit is measurable from a track
   whose samples are 3e-3 radians apart. 2π means the orbit closed. */
function rlPeriShift(track){
  const r = track.r, ph = track.ph, at = [];
  for(let i = 1; i < r.length - 1; i++){
    if(r[i] < r[i - 1] && r[i] <= r[i + 1]){
      const den = r[i - 1] - 2 * r[i] + r[i + 1];
      const d = den !== 0 ? 0.5 * (r[i - 1] - r[i + 1]) / den : 0;
      /* φ is smooth and monotone in the index, so the refined angle is one
         linear step to whichever side the refinement points */
      const phi = d >= 0 ? ph[i] + d * (ph[i + 1] - ph[i]) : ph[i] + d * (ph[i] - ph[i - 1]);
      at.push(phi);
    }
  }
  const gaps = [];
  for(let i = 1; i < at.length; i++) gaps.push(at[i] - at[i - 1]);
  const mean = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : NaN;
  let spread = 0;
  for(const g of gaps) spread = Math.max(spread, Math.abs(g - mean));
  return { at, gaps, apsidal: mean, spread, orbits: gaps.length,
           precession: Number.isFinite(mean) ? mean - 2 * Math.PI : NaN };
}
