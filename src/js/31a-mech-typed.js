/* ============================================================================
   1k+ · MECHANICS FROM THE READER'S OWN LAW

   Five things the preset stages are entitled to assume:

     · that ∫F·dx equals the change in kinetic energy,
     · that x = x₀ + v₀t + ½at² describes the motion,
     · that the best launch angle is 45°,
     · that a collision conserves momentum and loses ½μ(Δu)²(1−e²),
     · and that an orbit closes.

   Each is a theorem with hypotheses, and a preset chosen to satisfy them cannot
   test them. The engines below take a force law, an acceleration programme, a
   drag law, an interaction potential or a central force written by the reader,
   and compute the quantity in question along two routes that share no code.

   The last of them is the one worth the trouble: **Bertrand's theorem** says
   that of all central forces only the inverse square and the linear spring give
   orbits that close for every bound initial condition. That is discoverable by
   typing an exponent, and `dyBertrand` measures it rather than stating it.

   No DOM here; the stages compile the reader's formulas and pass plain
   functions in.
   ============================================================================ */

/* ----------------------------------------------------------------------------
   1 · A FORCE LAW F(x, v, t)

   Three quantities, each by two routes:

     ΔKE     ½m(v₁²−v₀²) at the two ends   vs  ∫F·dx accumulated along the path
     ΔU      ∫F₀·dx along the ACTUAL path  vs  one quadrature from x₀ to x₁
     ΔE      the mechanical energy at the ends vs ∫(F−F₀)·dx, the non-conservative work

   where F₀(x) = F(x, 0, 0) is the part of the law that depends on position
   alone. The second pair is the interesting one: a force depending only on x is
   path-independent, so integrating it along a trajectory that doubles back must
   give the same answer as integrating straight between the endpoints. That is
   what "conservative" means, and it is a claim that can fail — it does fail, by
   exactly the dissipated work, the moment the reader's F mentions v.
   ---------------------------------------------------------------------------- */
function dyForceRun(F, m, x0, v0, t1, n){
  n = Math.max(8, 2 * Math.round((n || 2400) / 2));
  const h = t1 / n;
  const acc = (x, v, t) => {
    const a = F(x, v, t) / m;
    return Number.isFinite(a) ? Math.max(-1e8, Math.min(1e8, a)) : 0;
  };
  const xs = new Float64Array(n + 1), vs = new Float64Array(n + 1), ts = new Float64Array(n + 1);
  let x = x0, v = v0;
  xs[0] = x0; vs[0] = v0;
  for(let i = 1; i <= n; i++){
    const t = (i - 1) * h;
    const k1x = v,               k1v = acc(x, v, t);
    const k2x = v + h / 2 * k1v, k2v = acc(x + h / 2 * k1x, v + h / 2 * k1v, t + h / 2);
    const k3x = v + h / 2 * k2v, k3v = acc(x + h / 2 * k2x, v + h / 2 * k2v, t + h / 2);
    const k4x = v + h * k3v,     k4v = acc(x + h * k3x, v + h * k3v, t + h);
    x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    xs[i] = x; vs[i] = v; ts[i] = i * h;
  }
  /* line integrals along the trajectory, by the trapezoid in dx — this is what
     ∫F·dx means for a path that may double back, and it is not ∫F dt */
  let Wtot = 0, Wcons = 0, Wnon = 0, travel = 0;
  const F0 = q => { const w = F(q, 0, 0); return Number.isFinite(w) ? w : 0; };
  /* the potential and the kinetic energy sample by sample, so a panel can draw
     the ledger rather than only quote its two ends */
  const Us = new Float64Array(n + 1), Ks = new Float64Array(n + 1);
  Ks[0] = 0.5 * m * v0 * v0;
  for(let i = 1; i <= n; i++){
    const dx = xs[i] - xs[i - 1];
    const fa = F(xs[i - 1], vs[i - 1], ts[i - 1]), fb = F(xs[i], vs[i], ts[i]);
    const ca = F0(xs[i - 1]), cb = F0(xs[i]);
    if(Number.isFinite(fa) && Number.isFinite(fb)) Wtot += (fa + fb) / 2 * dx;
    Wcons += (ca + cb) / 2 * dx;
    if(Number.isFinite(fa) && Number.isFinite(fb)) Wnon += ((fa - ca) + (fb - cb)) / 2 * dx;
    travel += Math.abs(dx);
    Us[i] = -Wcons;
    Ks[i] = 0.5 * m * vs[i] * vs[i];
  }
  /* the same conservative work, computed by a quadrature that knows only the two
     endpoints and nothing about how the object got from one to the other */
  const straight = nqAdaptive(F0, x0, xs[n], 1e-12);
  const K0 = 0.5 * m * v0 * v0, K1 = 0.5 * m * v * v;
  return { xs, vs, ts, Us, Ks, n, x:xs[n], v:vs[n],
    K0, K1, dK:K1 - K0, work:Wtot, gapWork:Math.abs(Wtot - (K1 - K0)),
    wCons:Wcons, wStraight:straight, gapPath:Math.abs(Wcons - straight),
    wNon:Wnon, dU:-straight, dE:(K1 - K0) - straight,
    gapEnergy:Math.abs(((K1 - K0) - straight) - Wnon),
    travel, net:xs[n] - x0 };
}
/* the stepper's order on that system, measured against a halved step */
function dyForceOrder(F, m, x0, v0, t1, n){
  n = Math.max(4, Math.round(n || 40));
  const at = k => dyForceRun(F, m, x0, v0, t1, k).v;
  const a1 = at(n), a2 = at(2 * n), a3 = at(4 * n);
  const e1 = Math.abs(a1 - a3), e2 = Math.abs(a2 - a3);
  if(!(e1 > 0) || !(e2 > 0) || e1 / e2 < 1.0000001) return NaN;
  return Math.log2(e1 / e2);
}

/* ----------------------------------------------------------------------------
   2 · AN ACCELERATION PROGRAMME a(t)

   The four constant-acceleration equations are not the model — they are a = const
   integrated twice. Given a typed a(t) the same integration still works and the
   formulas simply stop applying, which is a thing to measure rather than say.

     v(T)   RK4                    vs  v₀ + ∫a dt
     x(T)   RK4                    vs  x₀ + v₀T + ∫(T−u)a(u)du   [Cauchy]
     and the two SUVAT candidates, each with its error printed:
       x₀ + v₀T + ½a(0)T²          — right only if a never changes
       x₀ + v₀T + ½āT², ā = Δv/T   — the plausible repair, and still wrong
       x₀ + v̄T,        v̄ = ⟨v⟩     — right always, because it is the definition
   ---------------------------------------------------------------------------- */
function dyKinemRun(aOf, x0, v0, t1, n){
  n = Math.max(8, 2 * Math.round((n || 2000) / 2));
  const h = t1 / n;
  const A = t => { const q = aOf(t); return Number.isFinite(q) ? Math.max(-1e8, Math.min(1e8, q)) : 0; };
  const xs = new Float64Array(n + 1), vs = new Float64Array(n + 1);
  let x = x0, v = v0;
  xs[0] = x0; vs[0] = v0;
  for(let i = 1; i <= n; i++){
    const t = (i - 1) * h;
    const k1x = v,               k1v = A(t);
    const k2x = v + h / 2 * k1v, k2v = A(t + h / 2);
    const k3x = v + h / 2 * k2v, k3v = A(t + h / 2);
    const k4x = v + h * k3v,     k4v = A(t + h);
    x += h / 6 * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    xs[i] = x; vs[i] = v;
  }
  const vQ = v0 + nqAdaptive(A, 0, t1, 1e-12);
  const xQ = x0 + v0 * t1 + nqAdaptive(u => (t1 - u) * A(u), 0, t1, 1e-12);
  /* the mean velocity, by Simpson over the track — x = x₀ + v̄T is a definition
     and must hold whatever a(t) does */
  let sv = 0;
  for(let i = 0; i <= n; i++) sv += ((i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2)) * vs[i];
  const vBar = t1 > 0 ? (sv * h / 3) / t1 : v0;
  const aBar = t1 > 0 ? (v - v0) / t1 : 0;
  const suvat0 = x0 + v0 * t1 + 0.5 * A(0) * t1 * t1;
  const suvatBar = x0 + v0 * t1 + 0.5 * aBar * t1 * t1;
  const meanV = x0 + vBar * t1;
  return { xs, vs, n, x, v, vQ, xQ, gapV:Math.abs(v - vQ), gapX:Math.abs(x - xQ),
    a0:A(0), aBar, vBar,
    suvat0, errSuvat0:Math.abs(x - suvat0),
    suvatBar, errSuvatBar:Math.abs(x - suvatBar),
    meanV, errMeanV:Math.abs(x - meanV),
    /* how far from constant the programme actually is, so the errors above can
       be read against something */
    aSpread:(function(){
      let lo = Infinity, hi = -Infinity;
      for(let i = 0; i <= 200; i++){ const q = A(t1 * i / 200); lo = Math.min(lo, q); hi = Math.max(hi, q); }
      return hi - lo;
    })() };
}

/* ----------------------------------------------------------------------------
   3 · A DRAG LAW, AND THE ANGLE THAT ACTUALLY MAXIMISES RANGE

   `dragOf(speed)` returns the magnitude of the retarding force in newtons; it
   always opposes the velocity. With dragOf ≡ 0 the integration must reproduce
   v₀²sin2θ/g and put the optimum at exactly 45°, and both of those are checked
   rather than assumed — then any drag law at all can be typed and the optimum is
   LOCATED by a ternary search on the integrated range, not looked up.
   ---------------------------------------------------------------------------- */
function dyProjRun(dragOf, v0, ang, m, y0, g, h, nmax){
  const G = g === undefined ? DY_G : g;
  const dt = h || 0.002, N = nmax || 40000;
  const D = s => {
    if(!(s > 0)) return 0;
    const q = dragOf(s);
    return Number.isFinite(q) ? Math.max(0, Math.min(1e8, q)) : 0;
  };
  const acc = (vx, vy) => {
    const s = Math.hypot(vx, vy);
    const f = s > 0 ? D(s) / (m * s) : 0;
    return { ax:-f * vx, ay:-G - f * vy };
  };
  let x = 0, y = y0 || 0, vx = v0 * Math.cos(ang), vy = v0 * Math.sin(ang);
  const pts = [{ x, y, t:0 }];
  let hMax = y, tLand = NaN, range = NaN, vxF = vx, vyF = vy;
  for(let i = 1; i <= N; i++){
    const px = x, py = y, pvx = vx, pvy = vy;
    const a1 = acc(vx, vy);
    const a2 = acc(vx + dt / 2 * a1.ax, vy + dt / 2 * a1.ay);
    const a3 = acc(vx + dt / 2 * a2.ax, vy + dt / 2 * a2.ay);
    const a4 = acc(vx + dt * a3.ax, vy + dt * a3.ay);
    x += dt * (vx + dt / 6 * (a1.ax + a2.ax + a3.ax));
    y += dt * (vy + dt / 6 * (a1.ay + a2.ay + a3.ay));
    vx += dt / 6 * (a1.ax + 2 * a2.ax + 2 * a3.ax + a4.ax);
    vy += dt / 6 * (a1.ay + 2 * a2.ay + 2 * a3.ay + a4.ay);
    hMax = Math.max(hMax, y);
    pts.push({ x, y, t:i * dt });
    if(y < 0){
      /* the crossing, from the quadratic the last step actually followed —
         reading off whichever grid point went negative loses three digits */
      const ay = a1.ay;
      const disc = pvy * pvy - 2 * ay * py;
      const s = Math.sqrt(Math.max(0, disc));
      const tau = Math.abs(ay) > 1e-12 ? (pvy + s) / -ay : (pvy !== 0 ? -py / pvy : 0);
      const tc = Math.max(0, Math.min(dt, tau));
      range = px + pvx * tc + 0.5 * a1.ax * tc * tc;
      tLand = (i - 1) * dt + tc;
      vxF = pvx + a1.ax * tc; vyF = pvy + ay * tc;
      break;
    }
  }
  return { pts, range, tLand, hMax, vImpact:Math.hypot(vxF, vyF),
    angImpact:Math.atan2(-vyF, vxF), ok:Number.isFinite(range) };
}
const dyProjRange = (dragOf, v0, ang, m, g, h) =>
  dyProjRun(dragOf, v0, ang, m, 0, g, h || 0.004, 40000).range;
/* the optimum, LOCATED. Ternary search on a unimodal range(θ): the interval is
   cut by a third each round, so 60 rounds is far more than the 1e-6 rad wanted
   and the loop stops on the tolerance long before that. */
function dyProjBest(dragOf, v0, m, g, h, lo, hi){
  let a = lo === undefined ? 0.02 : lo, b = hi === undefined ? Math.PI / 2 - 0.02 : hi;
  const R = th => {
    const r = dyProjRange(dragOf, v0, th, m, g, h);
    return Number.isFinite(r) ? r : -1e9;
  };
  for(let i = 0; i < 60 && b - a > 1e-7; i++){
    const p = a + (b - a) / 3, q = b - (b - a) / 3;
    if(R(p) < R(q)) a = p; else b = q;
  }
  const ang = (a + b) / 2;
  return { ang, deg:ang * 180 / Math.PI, range:R(ang) };
}

/* ----------------------------------------------------------------------------
   4 · A COLLISION WITH A REAL INTERACTION

   Two particles on a line interacting through a pair potential V(r) the reader
   writes, r being their separation. The force on each is ∓V′(r), equal and
   opposite by construction — so momentum conservation is a property of the
   STEPPER here, not of the model, and the panel says so rather than claiming a
   discovery. What is genuinely measured is everything after it:

     · the restitution e, read off the outcome, which for a conservative V comes
       out at 1 to nine figures — a perfectly elastic collision, derived;
     · the two final speeds, against `dyCollide` run at that measured e — the
       impulse algebra, checked against an integrated interaction;
     · the energy lost, against ½μ(Δu)²(1−e²).

   Dissipation is a dashpot across the pair, engaged in proportion to how deeply
   they have interpenetrated: w = V(r)/V₀ with V₀ = ½μ(Δu)², which is the
   potential energy at closest approach in a head-on encounter and therefore
   reaches 1 exactly there and falls to 0 as they separate.
   ---------------------------------------------------------------------------- */
function dyPairCollide(Vof, dVof, m1, u1, m2, u2, b, d0, h, nmax){
  const mu = m1 * m2 / (m1 + m2);
  const du = u1 - u2;
  const V0 = 0.5 * mu * du * du;
  const dt = h || 0.0004, N = nmax || 200000;
  const dV = dVof || (r => {
    const e = 1e-6 * Math.max(1, Math.abs(r));
    return (Vof(r + e) - Vof(r - e)) / (2 * e);
  });
  const Vg = r => { const q = Vof(r); return Number.isFinite(q) ? Math.max(-1e12, Math.min(1e12, q)) : 0; };
  const dVg = r => { const q = dV(r); return Number.isFinite(q) ? Math.max(-1e12, Math.min(1e12, q)) : 0; };
  const damp = (r, w1, w2) => (V0 > 0 ? b * (Vg(r) / V0) * (w2 - w1) : 0);
  const acc = (x1, x2, v1, v2) => {
    const r = x2 - x1, g = dVg(r), d = damp(r, v1, v2);
    return { a1:(g + d) / m1, a2:(-g - d) / m2 };
  };
  let x1 = 0, x2 = d0 === undefined ? 6 : d0, v1 = u1, v2 = u2;
  const start = x2 - x1;
  const K0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
  const p0 = m1 * u1 + m2 * u2;
  const pts = [];
  let rmin = start, dP = 0, dE = 0, sep = false, tEnd = 0;
  const E0 = K0 + Vg(start);
  for(let i = 1; i <= N; i++){
    const a1 = acc(x1, x2, v1, v2);
    const nx1 = x1 + v1 * dt + 0.5 * a1.a1 * dt * dt;
    const nx2 = x2 + v2 * dt + 0.5 * a1.a2 * dt * dt;
    /* one predictor-corrector pass, because the damping depends on velocity and
       plain velocity-Verlet does not admit it */
    const pv1 = v1 + a1.a1 * dt, pv2 = v2 + a1.a2 * dt;
    const a2 = acc(nx1, nx2, pv1, pv2);
    v1 += 0.5 * (a1.a1 + a2.a1) * dt;
    v2 += 0.5 * (a1.a2 + a2.a2) * dt;
    x1 = nx1; x2 = nx2;
    const r = x2 - x1;
    rmin = Math.min(rmin, r);
    dP = Math.max(dP, Math.abs(m1 * v1 + m2 * v2 - p0));
    dE = Math.max(dE, Math.abs(0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2 + Vg(r) - E0));
    if(i % 20 === 0) pts.push({ t:i * dt, x1, x2, r });
    if(r >= start && (v2 - v1) > 0){ sep = true; tEnd = i * dt; break; }
    if(!Number.isFinite(r) || Math.abs(r) > 40 * start) { tEnd = i * dt; break; }
  }
  const K1 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const e = Math.abs(du) > 1e-14 ? -(v1 - v2) / du : 1;
  const alg = dyCollide(m1, u1, m2, u2, e);
  const lost = K0 - K1;
  const closed = 0.5 * mu * du * du * (1 - e * e);
  return { ok:sep, v1, v2, e, mu, rmin, tEnd, pts,
    p0, p1:m1 * v1 + m2 * v2, dP, K0, K1, lost, closed,
    gapLost:Math.abs(lost - closed), Edrift:dE,
    algV1:alg.v1, algV2:alg.v2,
    gapAlg:Math.max(Math.abs(alg.v1 - v1), Math.abs(alg.v2 - v2)),
    vcm:alg.vcm };
}

/* ----------------------------------------------------------------------------
   5 · A CENTRAL FORCE, AND WHETHER THE ORBIT CLOSES — BERTRAND'S THEOREM

   `Fof(r)` is the radial force per unit mass times mass, i.e. newtons, negative
   for attraction. The orbit is integrated by velocity Verlet from that force
   alone; no conic section is ever drawn.

   The apsidal angle — the angle swept from one closest approach to the next
   furthest point — decides everything. It is located from the integrated track
   by watching for a sign change in ṙ and interpolating inside the step, and it
   is compared with π/√(3+n), where **n is measured from the reader's own force**
   by logarithmic differentiation. The orbit closes exactly when the apsidal
   angle is a rational fraction of π.

   Bertrand's theorem is the stronger statement: closure for EVERY bound orbit,
   not merely for near-circular ones, happens only for n = −2 and n = +1. Sampling
   one orbit cannot see that, so `dyBertrand` sweeps the launch speed to produce
   orbits of different eccentricity and reports how far the apsidal angle moves.
   For an inverse square it does not move at all.
   ---------------------------------------------------------------------------- */
const dyLogSlope = (Fof, r, rel) => {
  const d = (rel || 1e-4) * r;
  const a = Math.abs(Fof(r - d)), b = Math.abs(Fof(r + d));
  if(!(a > 0) || !(b > 0)) return NaN;
  return (Math.log(b) - Math.log(a)) / (Math.log(r + d) - Math.log(r - d));
};
function dyOrbitTyped(Fof, m, r0, v0, tmax, n){
  n = Math.max(64, Math.min(400000, Math.round(n || 24000)));
  const dt = tmax / n;
  const Fg = r => { const q = Fof(r); return Number.isFinite(q) ? Math.max(-1e14, Math.min(1e14, q)) : 0; };
  const acc = (x, y) => {
    const r = Math.hypot(x, y);
    if(!(r > 1e-12)) return { ax:0, ay:0, r:1e-12 };
    const k = Fg(r) / (m * r);
    return { ax:k * x, ay:k * y, r };
  };
  /* the potential, for the energy ledger: U(r) = −∫F dr, taken from r0 */
  const Uat = r => -nqAdaptive(Fg, r0, r, 1e-11);
  let x = r0, y = 0, vx = 0, vy = v0;
  const L0 = m * (x * vy - y * vx);
  const E0 = 0.5 * m * v0 * v0 + Uat(r0);
  const pts = [], apsides = [];
  let th = 0, prevAng = 0, rd = 0, prevRd = null, rmin = r0, rmax = r0, dL = 0;
  for(let i = 1; i <= n; i++){
    const a1 = acc(x, y);
    x += vx * dt + 0.5 * a1.ax * dt * dt;
    y += vy * dt + 0.5 * a1.ay * dt * dt;
    const a2 = acc(x, y);
    vx += 0.5 * (a1.ax + a2.ax) * dt;
    vy += 0.5 * (a1.ay + a2.ay) * dt;
    const r = Math.hypot(x, y);
    if(!Number.isFinite(r) || r > 400 * r0) break;
    rmin = Math.min(rmin, r); rmax = Math.max(rmax, r);
    dL = Math.max(dL, Math.abs(m * (x * vy - y * vx) - L0));
    /* the polar angle, unwrapped, so an apsidal angle beyond 2π still reads */
    const ang = Math.atan2(y, x);
    let d = ang - prevAng;
    while(d > Math.PI) d -= 2 * Math.PI;
    while(d < -Math.PI) d += 2 * Math.PI;
    th += d; prevAng = ang;
    rd = (x * vx + y * vy) / r;                       // ṙ
    if(prevRd !== null && prevRd * rd < 0){
      /* linear interpolation on ṙ locates the apsis inside the step */
      const f = prevRd / (prevRd - rd);
      apsides.push({ t:(i - 1 + f) * dt, r, th:th - d * (1 - f), kind:rd > 0 ? 'min' : 'max' });
    }
    prevRd = rd;
    if(i % 8 === 0) pts.push({ x, y, r });
  }
  const Uend = Uat(Math.hypot(x, y));
  return { pts, apsides, L0, dL, E0,
    E1:0.5 * m * (vx * vx + vy * vy) + Uend,
    dE:Math.abs(0.5 * m * (vx * vx + vy * vy) + Uend - E0),
    rmin, rmax, ecc:(rmax - rmin) / (rmax + rmin || 1) };
}
/* the apsidal angle, averaged over whatever apsides the run produced, plus the
   precession it implies — zero exactly when the orbit closes on itself */
function dyApsidal(run){
  const A = run.apsides;
  if(A.length < 2) return { ok:false, angle:NaN, spread:NaN, precess:NaN, count:A.length };
  const gaps = [];
  for(let i = 1; i < A.length; i++) gaps.push(Math.abs(A[i].th - A[i - 1].th));
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const lo = Math.min.apply(null, gaps), hi = Math.max.apply(null, gaps);
  return { ok:true, angle:mean, spread:hi - lo, gaps,
    precess:2 * mean - 2 * Math.PI, count:A.length,
    /* the apsidal angle as a fraction of π: rational means the orbit closes */
    overPi:mean / Math.PI };
}
/* Bertrand, measured: several eccentricities through the same force law. The
   apsidal angle is a property of the orbit, not of the force, unless the force
   is one of the two exceptional ones — in which case every row agrees. */
function dyBertrand(Fof, m, r0, factors, orbits, spp){
  const f0 = Math.abs(Fof(r0));
  const vc = Math.sqrt(f0 * r0 / m);                 // the circular speed at r0
  const T = 2 * Math.PI * r0 / vc;
  const dt = T / (spp || 3000);                      // one step size for every row
  const rows = (factors || [1.02, 1.12, 1.22, 1.32]).map(k => {
    /* An eccentric orbit takes far longer than the circular one it was launched
       from — for an inverse square the period goes as a^1.5, so a launch at
       1.32× circular speed takes seven times as long to come round. Extending
       the window until enough apsides have been seen is the only way to compare
       eccentricities on equal terms; guessing one window reports "no apsides"
       for exactly the rows that matter. */
    let span = T * (orbits || 4), run = null, A = null;
    for(let tries = 0; tries < 5; tries++){
      run = dyOrbitTyped(Fof, m, r0, vc * k, span, Math.min(400000, Math.round(span / dt)));
      A = dyApsidal(run);
      if(A.ok && A.count >= 4) break;
      span *= 2.5;
    }
    return { k, ok:A.ok, angle:A.angle, precess:A.precess, overPi:A.overPi,
      ecc:run.ecc, dL:run.dL, dE:run.dE, count:A.count, span };
  });
  const good = rows.filter(r => r.ok && Number.isFinite(r.angle));
  const angs = good.map(r => r.angle);
  const lo = angs.length ? Math.min.apply(null, angs) : NaN;
  const hi = angs.length ? Math.max.apply(null, angs) : NaN;
  const nIdx = dyLogSlope(Fof, r0);
  return { rows, vc, lo, hi, spread:hi - lo, n:nIdx,
    /* the near-circular prediction, which every textbook derives and which only
       the two exceptional laws extend to eccentric orbits */
    predicted:(3 + nIdx) > 0 ? Math.PI / Math.sqrt(3 + nIdx) : NaN,
    closes:Number.isFinite(hi - lo) && Math.abs(hi - lo) < 2e-3 &&
           Math.abs(((angs[0] || 0) / Math.PI) - Math.round((angs[0] || 0) / Math.PI * 2) / 2) < 1e-3 };
}
