/* ============================================================================
   5b · THE RADIAL FALL, AND THE TWO CLOCKS THAT DISAGREE ABOUT IT
   Programme A item 3, 2026-08-18. Split out of 46a-gr-metric.js, which was
   already 720 lines; everything here reads that module's A(r), B(r) convention
   and its rlDeriv, and the filename order guarantees it loads after it.

   A particle released FROM REST at r₀ and falling straight in: L = 0, and the
   Killing energy is E = √A(r₀), because a particle at rest has dτ = √A dt and
   so E = A·dt/dτ = √A(r₀).

   The first integral with L = 0 and κ = 1 gives

       (dr/dτ)² = (E² − A)/(A·B)        and       dt/dτ = E/A

   so the two clocks are two DIFFERENT integrals along the same path,

       τ = ∫ √( A·B / (E² − A) ) dr     and     t = ∫ (E/A)·√( A·B / (E² − A) ) dr

   and they are integrated separately here. That is the point of the stage they
   serve: the two do not behave the same way at a horizon, and a routine that
   obtained one by scaling the other could not show it.

   THREE THINGS GO WRONG IN THESE INTEGRALS, and each needs a different answer.

   (1) AT THE RELEASE POINT the particle is at rest, E² − A vanishes linearly,
       and both integrands have an inverse-square-root pole. Integrable, but a
       quadrature started there returns Infinity on its first sample. The
       substitution r = r₀ − w² is the one rlEmbedZ uses: E² − A = A′(r₀)w² +
       O(w⁴), so dividing by √(E²−A) ~ w√A′ and multiplying by the Jacobian 2w
       leaves a function ANALYTIC IN w², and Simpson keeps its fourth order.
       The value AT w = 0 is not sampled at all but evaluated as the limit
       2√(A·B/A′), because sampling near w = 0 asks float64 for E² − A as a
       difference between two numbers agreeing to eleven digits.

   (2) AT A HORIZON A → 0 and B → ∞. In τ their product tends to a finite limit
       — exactly 1 for every vacuum metric — so the proper time is FINITE and
       its integrand is smooth. The only hazard is arithmetic: A is 0, B is ∞,
       and A·B evaluates to NaN instead of to the limit. Keeping the samples a
       hair off that endpoint evaluates the limit instead.

   (3) IN t the same A → 0 is a SIMPLE POLE. Writing P for the limit of A·B,
       the integrand behaves like √P/(A′(r_h)·(r − r_h)) and the coordinate time
       diverges logarithmically. That divergence IS the physics and must not be
       quadratured away — an even grid in r straddles the pole and reports a
       finite crossing time, which is why the Schwarzschild-only version of this
       stage had to use a closed form instead. The answer is the substitution
       matched to the singularity: u = ln(r − r_h) turns C·dr/(r − r_h) into
       C·du, so walking r down to the horizon by HALVINGS costs the same amount
       of coordinate time every time — which is what a logarithm is, and it is
       measured here rather than asserted.

   AND √P IS WHY FREEZING IS A PROPERTY OF g_rr, NOT OF g_tt. P = lim A·B at the
   horizon is 1 for a vacuum solution, but the 'only time curved' preset has
   B = 1, hence P = 0, hence no simple pole at all: the integrand softens to an
   integrable 1/√(r−r_h) and the coordinate time to the horizon is FINITE. The
   frozen star is the curvature of space. That is measurable here — the same
   preset that loses half the light deflection and a third of the perihelion
   advance turns out to lose the whole of the freezing as well — and it is why
   this stage carries the metric picker rather than a mass slider.

   Prefix: rl, shared with 46, 46a and the wing's stage helpers in 66a — grep
   case-sensitively before adding a name.
   ============================================================================ */

/* the conserved energy of a particle dropped from rest at r₀ */
function rlInfallE(A, r0){
  const a = A(r0);
  return Number.isFinite(a) && a > 0 ? Math.sqrt(a) : NaN;
}

/* the second derivative, fourth order, on the same h-rule rlDeriv uses. Lives
   here because rlTidalRadial below is the first thing in the wing to need one;
   it is written as a general tool rather than inlined because a curvature is
   never the only thing that wants a second derivative. */
function rlDeriv2(f, r){
  const h = 1e-3 * Math.max(1e-3, Math.abs(r));
  const a = f(r + 2 * h), b = f(r + h), c = f(r), d = f(r - h), e = f(r - 2 * h);
  const v = (-a + 16 * b - 30 * c + 16 * d - e) / (12 * h * h);
  return Number.isFinite(v) ? v : NaN;
}

/* dτ/dr and dt/dr at one radius, both as positive numbers, for a fall with
   energy E. ONE SOURCE for the two integrands: everything below reads them from
   here, so the profile a panel draws and the numbers it prints cannot drift
   apart.

   dt is formed as (E/A)·dτ rather than as E√(B/(A(E²−A))). The two are the same
   expression, but A·B is the combination with a finite limit at a horizon and
   B/(A·…) is not: written the second way the arithmetic asks for √(∞/0), and
   written this way it asks for a number of order one divided by a small A.

   `gap` = E² − A comes back because its SIGN is the physics: where it is
   negative the particle released at r₀ cannot reach r at all, and the caller
   must say so rather than print the NaN. */
function rlInfallD(A, B, r, E){
  const a = A(r), b = B(r), ab = a * b, gap = E * E - a;
  if(!Number.isFinite(ab) || !Number.isFinite(gap) || !(gap > 0) || !(ab > 0))
    return { dtau: NaN, dt: NaN, gap, a, b };
  const dtau = Math.sqrt(ab / gap);
  return { dtau, dt: a > 0 ? (E / a) * dtau : Infinity, gap, a, b };
}

/* The redshift a distant static observer sees on a signal the faller sends
   outward from r — the ratio of received to emitted frequency, which is −p·u
   for a static observer at infinity over −p·u for the faller at r:

        z(r) = A / (E + √(E² − A))

   That form is not cosmetic. The textbook factorisation is √A·√((1−v)/(1+v))
   with v the speed a hovering observer measures, and it is algebraically the
   same thing as E − √(E² − A) — a difference between two numbers that agree to
   every digit float64 has, exactly where the answer is going to zero and the
   panel most wants it. Multiplying above and below by the conjugate moves the
   cancellation into a SUM, and the quantity is then computed to full precision
   all the way down. §3.1's standing warning about catastrophic cancellation in
   this wing, in one line; the unit suite measures what the naive form loses. */
function rlInfallRedshift(A, r, E){
  const a = A(r);
  if(!Number.isFinite(a) || !Number.isFinite(E)) return NaN;
  if(a <= 0) return 0;
  return a / (E + Math.sqrt(Math.max(0, E * E - a)));
}

/* ONE SEGMENT of the fall, from rHi down to rLo, integrated in whichever
   variable removes that segment's singularity. Both clocks accumulate on the
   same nodes, and the node radii come back with them so a caller can draw what
   it printed.

     'top' — w = √(rHi − r). For a segment starting AT the release point, where
             both integrands have an inverse-square-root pole. The w = 0 node is
             the analytic limit, not a sample.
     'log' — u = ln(r − rh). For a segment ending ABOVE a horizon: the pole in t
             is C/(r − r_h), and this is the substitution that makes it C·du.
     'bot' — w = √(r − rLo). For a segment ending AT a horizon or at the centre,
             where τ is still finite but the endpoint itself is arithmetic on 0
             and ∞. Its w = 0 node is an evaluated limit too — see below, where
             the first attempt at this cost two orders of accuracy and a whole
             dropped panel.
     'lin' — r itself.

   The walk stops at the first panel it cannot evaluate and says where. That is
   not defensive coding: a particle released outside the maximum of A moves
   OUTWARD rather than inward — Schwarzschild–de Sitter does it beyond r ≈ 21.5,
   where the cosmological term wins — and the honest report is the radius at
   which the motion stopped being possible, not a profile with holes in it. */
function rlInfallQuad(A, B, E, rHi, rLo, n, opt){
  const o = opt || {};
  const sub = o.sub || 'lin';
  const N = 2 * Math.max(1, Math.round((n || 300) / 2));
  const out = { tau: 0, t: 0, r: [], tauC: [], tC: [], stop: '', rStop: NaN,
                n: 0, tDiv: false, sub };
  if(!(rHi > rLo) || !Number.isFinite(E)){ out.stop = 'empty interval'; return out; }

  let v0, v1, rOf;
  if(sub === 'top'){
    v0 = 0; v1 = Math.sqrt(rHi - rLo);
    rOf = v => rHi - v * v;
  } else if(sub === 'log'){
    if(!(Number.isFinite(o.rh) && o.rh < rLo)){ out.stop = 'no horizon below the interval'; return out; }
    v0 = Math.log(rHi - o.rh); v1 = Math.log(rLo - o.rh);
    rOf = v => o.rh + Math.exp(v);
  } else if(sub === 'bot'){
    v0 = Math.sqrt(rHi - rLo); v1 = 0;
    rOf = v => rLo + v * v;
  } else {
    v0 = rHi; v1 = rLo; rOf = v => v;
  }
  const jac = v => (sub === 'top' || sub === 'bot') ? 2 * Math.abs(v)
                 : sub === 'log' ? Math.exp(v) : 1;

  /* THE TWO SQUARE-ROOT SUBSTITUTIONS BOTH HAVE A 0·∞ NODE, and neither may be
     sampled. Both limits are evaluated instead.

     The first version of this nudged the 'bot' node inward by a millionth of
     the segment. Measured on the cycloid, that cost the whole quadrature its
     ORDER: the error fell like h rather than h⁴ (4.19×10⁻¹⁰ → 4.41×10⁻¹¹ over
     eight doublings of n), because a fixed error in one endpoint sample enters
     weighted by h. Shrinking the nudge to a billionth made it a thousand times
     WORSE, not better — at that distance A is still exactly 0 in double
     precision, A·B is NaN, and the last panel was dropped whole. Two failure
     modes with opposite cures is the signature of a guard doing a limit's job.

     TOP, at w = 0: the limit is 2√(A·B/A′) — and A′(r₀) > 0 is exactly the
     condition that the particle falls INWARD at all, so a metric where it fails
     leaves both limits NaN and the walk stops on its first panel, which is the
     correct report rather than a failure.

     BOT, at w = 0: which limit depends on whether the particle is still MOVING
     at rLo. Where it is (a horizon, or the centre) the Jacobian's 2w wins and
     the τ limit is 0, while the t limit is 0 or ∞ according to whether A is
     still positive. Where it is not — rLo is a turning point, E² − A vanishes
     there too — the limit has the same shape as the top's, with |A′| at rLo. */
  let endTau = NaN, endT = NaN;
  if(sub === 'top'){
    const a0 = A(rHi), b0 = B(rHi), ap = rlDeriv(A, rHi);
    if(Number.isFinite(a0) && Number.isFinite(b0) && Number.isFinite(ap) && ap > 0 && a0 * b0 > 0){
      endTau = 2 * Math.sqrt(a0 * b0 / ap);
      endT = a0 > 0 ? (E / a0) * endTau : Infinity;
    }
  } else if(sub === 'bot'){
    const aE = A(rLo), bE = B(rLo), gapE = E * E - aE;
    if(gapE > 1e-12 * E * E){
      endTau = 0;
      endT = (Number.isFinite(aE) && aE > 0) ? 0 : Infinity;
    } else {
      const apE = rlDeriv(A, rLo);
      if(Number.isFinite(aE * bE) && aE * bE > 0 && apE < 0){
        endTau = 2 * Math.sqrt(aE * bE / -apE);
        endT = aE > 0 ? (E / aE) * endTau : Infinity;
      }
    }
  }
  /* the singular node is identified by its INDEX, not by comparing v against an
     endpoint: v0 + N·h does not reproduce v1 bit for bit, so an equality test
     misses the very node the limit was computed for. */
  const g = (v, isEnd) => {
    if(isEnd) return { dtau: endTau, dt: endT };
    const d = rlInfallD(A, B, rOf(v), E), j = jac(v);
    return { dtau: d.dtau * j, dt: d.dt * j };
  };

  const h = (v1 - v0) / N, ah = Math.abs(h) / 6;
  out.r.push(rOf(v0)); out.tauC.push(0); out.tC.push(0);
  for(let i = 0; i < N; i++){
    const va = v0 + i * h, vb = v0 + (i + 1) * h;
    const ga = g(va, sub === 'top' && i === 0);
    const gm = g(0.5 * (va + vb), false);
    const gb = g(vb, sub === 'bot' && i === N - 1);
    const dTau = ah * (ga.dtau + 4 * gm.dtau + gb.dtau);
    const dT   = ah * (ga.dt   + 4 * gm.dt   + gb.dt);
    if(!Number.isFinite(dTau)){
      out.stop = 'the fall cannot reach r = ' + fmtSig(rOf(vb), 6);
      out.rStop = rOf(va);
      break;
    }
    out.tau += dTau;
    /* t is allowed to go infinite where τ does not — that IS the phenomenon —
       so a non-finite t stops the coordinate clock and nothing else, and the
       flag records which of the two happened. */
    if(Number.isFinite(dT) && !out.tDiv) out.t += dT; else out.tDiv = true;
    out.r.push(rOf(vb)); out.tauC.push(out.tau); out.tC.push(out.tDiv ? Infinity : out.t);
    out.n = i + 1;
  }
  if(out.tDiv) out.t = Infinity;
  return out;
}

/* The fall from r₀ down to rLo as one profile: two segments meeting at the
   midpoint, each with the substitution its own end needs — 'top' above, and
   below either 'log' (when rLo sits above a horizon, so the pole in t is
   resolved rather than straddled) or 'bot' (when rLo IS the horizon, or the
   centre, where τ is still finite and t is not). */
function rlInfallRun(A, B, r0, rLo, n, opt){
  const o = opt || {};
  const E = o.E === undefined ? rlInfallE(A, r0) : o.E;
  const out = { E, r: [], tau: [], t: [], tauEnd: NaN, tEnd: NaN,
                stop: '', rStop: NaN, tDiv: false, n: 0 };
  if(!Number.isFinite(E) || !(r0 > rLo)){
    out.stop = !Number.isFinite(E)
      ? 'there is no static observer at the release radius, so there is no rest to fall from'
      : 'the release radius is not above the target';
    return out;
  }
  const rMid = o.split === undefined ? 0.5 * (r0 + rLo) : o.split;
  const half = Math.max(2, Math.round((n || 600) / 2));
  const up = rlInfallQuad(A, B, E, r0, rMid, half, { sub: 'top' });
  const useLog = Number.isFinite(o.rh) && o.rh < rLo;
  const dn = up.stop ? null
    : rlInfallQuad(A, B, E, rMid, rLo, half, useLog ? { sub: 'log', rh: o.rh } : { sub: 'bot' });

  const push = (seg, tau0, t0) => {
    for(let i = 0; i < seg.r.length; i++){
      out.r.push(seg.r[i]);
      out.tau.push(tau0 + seg.tauC[i]);
      out.t.push(t0 + seg.tC[i]);
    }
  };
  push(up, 0, 0);
  if(dn) push(dn, up.tau, up.t);
  out.tDiv = up.tDiv || (dn ? dn.tDiv : false);
  out.stop = up.stop || (dn ? dn.stop : '');
  /* A fall that fails on its FIRST panel did not fail — it never started, and
     the reason is one sign. A′(r₀) ≤ 0 means A does not increase outward there,
     so a particle released at rest moves OUT. Minkowski does it everywhere (A is
     constant, nothing falls) and Schwarzschild–de Sitter does it beyond the
     maximum of A at r ≈ 21.5, where the cosmological term has taken over. Both
     are correct answers and neither is an error, so they get their own sentence
     rather than 'cannot reach'. */
  if(up.stop && up.n === 0){
    const ap = rlDeriv(A, r0);
    out.stop = !(ap > 0)
      ? 'A(r) does not increase outward at that radius, so a particle released from rest there does not fall inward at all'
      : up.stop;
  }
  out.rStop = Number.isFinite(up.rStop) ? up.rStop : (dn ? dn.rStop : NaN);
  out.n = out.r.length;
  out.tauEnd = out.tau.length ? out.tau[out.tau.length - 1] : NaN;
  out.tEnd = out.tDiv ? Infinity : (out.t.length ? out.t[out.t.length - 1] : NaN);
  return out;
}

/* THE LOCAL PREDICTION for the divergence, with no integral in it at all. Near
   a simple horizon A ≈ A′(r_h)(r − r_h) and A·B → P, so

        dt/dr → √P / (A′(r_h)·(r − r_h))

   and every halving of the gap to the horizon costs ln2·√P/A′ of coordinate
   time, for ever. E has cancelled out of that, which is worth saying aloud:
   every infaller freezes at the same rate whatever height they were dropped
   from, because the rate belongs to the horizon and not to them. It is 1/2κ,
   with κ the surface gravity — the same κ that sets a black hole's temperature.

   P is MEASURED, at two offsets a decade apart, and the RATIO between them is
   what decides which case the metric is in. A genuine nonzero limit gives
   pRatio ≈ 1 and a logarithmic divergence. A P vanishing linearly gives
   pRatio ≈ 10, the pole softens to an integrable inverse square root, and the
   coordinate time to the horizon is finite — which is what B = 1 does.
   Reporting the ratio rather than P alone is the difference between a routine
   that knows which case it is in and one that has assumed. */
function rlInfallLogRate(A, B, rh){
  const s = Math.max(1e-9, 1e-6 * Math.max(1, Math.abs(rh)));
  const p1 = A(rh + s) * B(rh + s), p2 = A(rh + 10 * s) * B(rh + 10 * s);
  const ap = rlDeriv(A, rh);
  const out = { P: p1, pRatio: Number.isFinite(p1) && p1 !== 0 ? p2 / p1 : NaN,
                ap, rate: NaN, perHalving: NaN, kappa: NaN, simple: false, at: rh + s };
  if(!Number.isFinite(p1) || !Number.isFinite(ap) || !(ap > 0) || !(p1 > 0)) return out;
  out.rate = Math.sqrt(p1) / ap;
  out.perHalving = Math.LN2 * out.rate;
  out.kappa = ap / (2 * Math.sqrt(p1));
  /* "simple" means A·B really does tend to a nonzero limit, so the pole in t is
     first order and the coordinate time diverges. The window is wide because
     pRatio is a ratio of two small numbers once P heads for zero, and the two
     cases it separates are a factor of ten apart. */
  out.simple = Number.isFinite(out.pRatio) && Math.abs(out.pRatio - 1) < 0.05;
  return out;
}

/* THE MEASUREMENT that prediction is checked against: walk the target radius
   down towards the horizon by halvings and integrate the coordinate time each
   step adds. Equal increments are a logarithm. Increments falling by √2 each
   time are an integrable inverse square root, and the total converges.

   Each step is its own log-substituted quadrature over [r_h + d/2, r_h + d]
   rather than a fresh integral from r₀ and a subtraction — which would be the
   difference of two large nearly-equal numbers, the cancellation this wing
   keeps being bitten by, and would put the answer's leading digits at the mercy
   of the part of the path both integrals share. */
function rlInfallHalvings(A, B, E, rh, d0, k, n){
  const d = [], dt = [], dtau = [];
  for(let i = 0; i < Math.max(1, k); i++){
    const hi = rh + d0 * Math.pow(2, -i), lo = rh + d0 * Math.pow(2, -(i + 1));
    const q = rlInfallQuad(A, B, E, hi, lo, n || 160, { sub: 'log', rh });
    if(q.stop || !Number.isFinite(q.t)) break;
    d.push(lo - rh); dt.push(q.t); dtau.push(q.tau);
  }
  /* the ratio of successive increments is the verdict — 1 for a logarithm,
     1/√2 for an integrable square root — and it is READ, never assumed */
  const ratio = [];
  for(let i = 1; i < dt.length; i++) ratio.push(dt[i] / dt[i - 1]);
  return { d, dt, dtau, ratio, steps: dt.length,
           last: dt.length ? dt[dt.length - 1] : NaN,
           settled: ratio.length ? ratio[ratio.length - 1] : NaN };
}

/* A·B where the product is a REMOVABLE singularity. At a horizon A vanishes
   exactly where B blows up, so their product tends to a finite limit while the
   arithmetic on that one radius is 0·∞ = NaN. Straddling the point and
   averaging evaluates the limit; away from a horizon the direct product is
   returned untouched and nothing is approximated. */
function rlABLim(A, B, r){
  const q = A(r) * B(r);
  if(Number.isFinite(q)) return q;
  const d = 1e-8 * Math.max(1e-3, Math.abs(r));
  const a = A(r + d) * B(r + d), b = A(r - d) * B(r - d);
  return Number.isFinite(a) && Number.isFinite(b) ? 0.5 * (a + b)
       : Number.isFinite(a) ? a : (Number.isFinite(b) ? b : NaN);
}

/* THE TIDAL STRETCH, for a metric nobody wrote down in advance. The radial
   component of the Riemann tensor in an orthonormal frame is the relative
   acceleration per unit proper separation between two points on a radial line,
   and it is what tears an infaller apart. Two things make it the right quantity
   rather than a Newtonian tide in fancy dress.

   IT IS BOOST-INVARIANT in the t–r plane, exactly as F_tr is, so the faller and
   a hovering observer measure the SAME radial stretch. That is why one number
   serves both, and why nothing in it depends on the fall.

   AND IT REDUCES CORRECTLY. For any metric with A·B = 1 it collapses to A″/2 —
   which for Schwarzschild is −2/r³, the textbook 2GM/c²r³ per unit length, and
   for Reissner–Nordström is −2/r³ + 3Q²/r⁴. Both are checked in the unit suite
   against the general expression, which shares no algebra with either. Negative
   means STRETCH.

   WRITTEN IN Q = A·B RATHER THAN IN A AND B SEPARATELY, and that is not
   cosmetic — it is the difference between a number and nonsense. The textbook
   grouping is

       R_t̂r̂t̂r̂ = (1/2B)·[ A″/A − (A′)²/2A² − A′B′/2AB ]

   whose last two terms EACH diverge like 1/A at a horizon and cancel to
   something finite. Two separate things then go wrong, and MEASURED against
   −2/r³ on Schwarzschild the second is far the worse:

       r          textbook grouping        this one
       2.1        rel 3.9×10⁻⁶             rel 2.7×10⁻¹¹
       2.001      rel 7.1×10²              rel 5.6×10⁻¹¹
       2.000001   rel 5.0×10⁵              rel 2.1×10⁻¹¹
       2          NaN                      rel 1.6×10⁻¹⁰

   The cancellation costs figures, but what destroys it is B′: rlDeriv is a
   five-point stencil at h = 10⁻³r, so within a thousandth of the horizon the
   stencil STRADDLES B's pole and the derivative it returns is not an
   approximation to anything. Q = A·B has no pole there, so Q′ is a perfectly
   ordinary derivative. Adding the two divergent terms algebraically first,
   using A′/A + B′/B = Q′/Q, gives

       R_t̂r̂t̂r̂ = ( A″ − A′Q′/2Q ) / 2Q

   in which every factor is finite at a horizon and both problems are gone.
   Found by a unit test asking for the tide AT r = 2 and getting NaN — which is
   exactly where the wing's most-quoted tidal number lives, the stretch at the
   horizon that falls as 1/M² and decides whether a faller survives crossing.

   Q → 0 IS NOT A FAILURE, and the caller must not treat it as one. It means the
   tide really is unbounded there: the 'only time curved' preset has B = 1, so
   Q = A vanishes at r = 2 and the curvature genuinely diverges — that metric has
   a naked curvature singularity where Schwarzschild has a smooth horizon, which
   is a fact about it worth reporting rather than a hole in this function. */
function rlTidalRadial(A, B, r){
  const q = rlABLim(A, B, r);
  if(!Number.isFinite(q) || q === 0) return NaN;
  const ap = rlDeriv(A, r), app = rlDeriv2(A, r);
  const qp = rlDeriv(x => rlABLim(A, B, x), r);
  const v = (app - ap * qp / (2 * q)) / (2 * q);
  return Number.isFinite(v) ? v : NaN;
}
