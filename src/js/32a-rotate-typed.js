/* ============================================================================
   1l+ · ROTATION FROM THE READER'S OWN SCENARIO

   The preset stages in `32-rotate.js` are allowed to assume four results:

     · a = g sinθ/(1 + c) for a rolling body,
     · ω = ω₀ + αt for a constant torque,
     · Iω = constant when nothing twists,
     · and the energy lost when two spinning bodies couple.

   Every one of those is a *conclusion*, and a preset that quotes it cannot be
   caught being wrong. The four engines below take a scenario nobody chose — a
   body assembled from pieces, a torque programme typed as a formula, a moment
   of inertia that varies with time, two bodies brought into contact — and
   compute the same quantity along two routes that share no code, so the gap
   between them is a measurement of the theorem rather than a restatement of it.

   Nothing here touches the DOM; the stages compile the reader's formulas and
   hand these functions plain JavaScript.
   ============================================================================ */

/* ----------------------------------------------------------------------------
   1 · ROLLING — solve the constraint instead of quoting its consequence

   Newton's law for the centre of mass and τ = Iα about it are two equations in
   two unknowns, the acceleration a and the static friction f, once the rolling
   constraint a = αR is imposed:

       M·a  +  f       =  M g sinθ          (along the slope)
       (I/R)·a  −  R·f =  0                 (τ = Iα, with α = a/R)

   `laSolve` does the elimination and never sees a shape factor. The familiar
   a = g sinθ/(1 + c) is what the solve is checked against, not what it uses.
   ---------------------------------------------------------------------------- */
/* the slope length every rolling picture and every rolling number uses, so the
   ramp that is drawn and the ramp that is timed are the same ramp */
const RT_RAMP_L = 5.4;
function rtRollSolve(M, R, I, ang){
  const c = (M > 0 && R > 0) ? I / (M * R * R) : 0;
  if(!(M > 0) || !(R > 0)) return { ok:false, a:0, f:0, c };
  const S = laSolve([[M, 1], [I / R, -R]], [M * DY_G * Math.sin(ang), 0]);
  if(!S || S.kind !== 'unique' || !S.x.every(Number.isFinite))
    return { ok:false, a:0, f:0, c };
  return { ok:true, a:S.x[0], f:S.x[1], c,
    /* the closed form the textbook quotes, kept beside it for comparison */
    aClosed:DY_G * Math.sin(ang) / (1 + c),
    /* and the coefficient the constraint demands, from the solved f rather
       than from c·tanθ/(1+c) */
    muMin:Math.cos(ang) > 0 ? S.x[1] / (M * DY_G * Math.cos(ang)) : Infinity };
}

/* Integrate the run down a ramp of slope length L as a THREE-state system:
   distance s, centre-of-mass speed v, and spin ω evolved SEPARATELY from the
   solved friction. The constraint v = ωR is therefore never imposed on the
   track — it is an outcome, and the largest slip along the way is reported.

   Both accelerations are constant, so the stepping below is exact to rounding.
   That is deliberate: it means the residual slip and the energy drift measure
   the physics and the linear solve, with no integration error mixed in.

   The finishing time is located by solving the local quadratic inside the step
   that crosses the line, not by reporting whichever grid point overshot. */
function rtRollTrack(M, R, I, ang, L, n){
  n = Math.max(16, Math.round(n || 600));
  const S = rtRollSolve(M, R, I, ang);
  const sn = Math.sin(ang), g = DY_G;
  const av = S.a, aw = I > 0 ? S.f * R / I : 0;
  /* a body with no moment of inertia is a sliding block, not a roller: it has no
     constraint to keep, so `slip` would otherwise report its whole speed */
  const rolls = I > 0;
  const out = { ok:false, rolls, c:S.c, a:av, f:S.f, aClosed:S.aClosed, muMin:S.muMin,
    t:NaN, tClosed:NaN, v:NaN, vClosed:NaN, slip:0, dE:0, pts:[] };
  if(!S.ok || !(av > 0) || !(L > 0)) return out;
  const T = Math.sqrt(2 * L / av) * 1.04, h = T / n;
  const E0 = M * g * L * sn;                       // all of it potential at the top
  let s = 0, v = 0, w = 0;
  const pts = [{ t:0, s:0, v:0, w:0 }];
  for(let i = 1; i <= n; i++){
    const s0 = s, v0 = v;
    s = s0 + v0 * h + 0.5 * av * h * h;
    v = v0 + av * h;
    w = w + aw * h;
    if(rolls) out.slip = Math.max(out.slip, Math.abs(v - w * R));
    const E = 0.5 * M * v * v + 0.5 * I * w * w + M * g * (L - s) * sn;
    out.dE = Math.max(out.dE, Math.abs(E - E0));
    pts.push({ t:i * h, s, v, w });
    if(s >= L){
      const disc = v0 * v0 + 2 * av * (L - s0);
      const dt = (Math.sqrt(Math.max(0, disc)) - v0) / av;
      out.t = (i - 1) * h + dt;
      out.v = v0 + av * dt;
      break;
    }
  }
  out.pts = pts;
  out.ok = Number.isFinite(out.t);
  out.tClosed = Math.sqrt(2 * L / S.aClosed);
  out.vClosed = Math.sqrt(2 * g * L * sn / (1 + S.c));
  return out;
}

/* The race. Each entry is {name, M, R, I}; each is integrated on its own and
   the finishing ORDER that comes out is compared with the order predicted by
   sorting on the shape factor alone. Mass and radius are free to differ between
   entries precisely so that the prediction has something to be wrong about. */
function rtRaceRun(entries, ang, L, n){
  const rows = entries.map(e => {
    const T = rtRollTrack(e.M, e.R, e.I, ang, L, n);
    /* `short` and `own` are the caller's labels for its own entrants and are
       carried through untouched. Rebuilding the row without them once cost an
       afternoon: the stage looked for its entry by `own`, found nothing, and
       reported a perfectly good body as unable to roll. */
    return { name:e.name, short:e.short || e.name, own:!!e.own,
      M:e.M, R:e.R, I:e.I, c:T.c, a:T.a, aClosed:T.aClosed,
      f:T.f, muMin:T.muMin, t:T.t, tClosed:T.tClosed, v:T.v, vClosed:T.vClosed,
      slip:T.slip, dE:T.dE, ok:T.ok, rolls:T.rolls };
  });
  const finite = rows.filter(r => r.ok);
  const bySim = finite.slice().sort((p, q) => p.t - q.t).map(r => r.name);
  const byShape = finite.slice().sort((p, q) => p.c - q.c).map(r => r.name);
  return { rows, bySim, byShape,
    orderMatches:bySim.join(' | ') === byShape.join(' | '),
    maxTimeGap:finite.reduce((m, r) => Math.max(m, Math.abs(r.t - r.tClosed)), 0),
    maxSlip:finite.reduce((m, r) => Math.max(m, r.slip), 0),
    maxDE:finite.reduce((m, r) => Math.max(m, r.dE), 0) };
}

/* ----------------------------------------------------------------------------
   2 · A TORQUE PROGRAMME τ(t)

   Three quantities, each by two routes:

     ω(T)   RK4 on I dω/dt = τ(t)        vs   ω₀ + (1/I)∫τ dt, adaptive quadrature
     θ(T)   RK4 on dθ/dt = ω              vs   ω₀T + (1/I)∫(T−u)τ(u)du
     ΔK     ½I(ω² − ω₀²) at the ends      vs   ∫τω dt over the integrated track

   The second θ route is the Cauchy formula for a repeated integral: swapping
   the order of the double integral turns ∫₀ᵀ∫₀ˢτ(u)du ds into one quadrature
   with a (T − u) weight. It shares nothing with the stepper.
   ---------------------------------------------------------------------------- */
function rtSpinRun(tauOf, I, w0, t1, n){
  n = Math.max(8, 2 * Math.round((n || 1200) / 2));       // even, for Simpson
  const h = t1 / n;
  const al = t => tauOf(t) / I;
  let th = 0, w = w0;
  const ts = new Float64Array(n + 1), ws = new Float64Array(n + 1);
  ws[0] = w0;
  for(let i = 1; i <= n; i++){
    const t = (i - 1) * h;
    const k1w = al(t),           k1th = w;
    const k2w = al(t + h / 2),   k2th = w + h / 2 * k1w;
    const k3w = al(t + h / 2),   k3th = w + h / 2 * k2w;
    const k4w = al(t + h),       k4th = w + h * k3w;
    w  += h / 6 * (k1w + 2 * k2w + 2 * k3w + k4w);
    th += h / 6 * (k1th + 2 * k2th + 2 * k3th + k4th);
    ts[i] = i * h; ws[i] = w;
  }
  /* route 2 — quadrature, which knows nothing about the stepper */
  const J = nqAdaptive(tauOf, 0, t1, 1e-12);              // the angular impulse
  const wQ = w0 + J / I;
  const thQ = w0 * t1 + nqAdaptive(u => (t1 - u) * tauOf(u), 0, t1, 1e-12) / I;
  /* the rotational work-energy theorem, checked on the integrated motion:
     Simpson over ∫τω dt against ½IΔ(ω²) read off the two endpoints */
  let W = 0;
  for(let i = 0; i <= n; i++){
    const wt = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    W += wt * tauOf(ts[i]) * ws[i];
  }
  W *= h / 3;
  const dK = 0.5 * I * (w * w - w0 * w0);
  return { w, wQ, gapW:Math.abs(w - wQ), th, thQ, gapTh:Math.abs(th - thQ),
    J, dL:I * (w - w0), work:W, dK, gapWork:Math.abs(W - dK),
    K0:0.5 * I * w0 * w0, K1:0.5 * I * w * w,
    ts, ws, n, alpha0:al(0) };
}
/* The stepper's order, MEASURED by halving h against the quadrature answer.
   Returns NaN when the two agree to rounding — which happens for a constant or
   linear torque, where RK4 is exact and there is no error to have an order.
   A caller printing this must say so rather than print a NaN. */
function rtSpinOrder(tauOf, I, w0, t1, n){
  n = Math.max(4, Math.round(n || 24));
  const ex = w0 + nqAdaptive(tauOf, 0, t1, 1e-13) / I;
  const scale = Math.max(1e-12, Math.abs(ex));
  const e = k => Math.abs(rtSpinRun(tauOf, I, w0, t1, k).w - ex);
  const e1 = e(n), e2 = e(2 * n);
  if(!(e1 > 1e-13 * scale) || !(e2 > 0)) return NaN;
  return Math.log2(e1 / e2);
}

/* ----------------------------------------------------------------------------
   3 · A MOMENT OF INERTIA THAT CHANGES WITH TIME

   With no external torque, d(Iω)/dt = 0. The cheap way to draw a skater is to
   set ω = L₀/I(t) and call it conservation, which cannot fail. Instead this
   integrates the equation of motion that conservation *implies*,

       dω/dt = −(İ/I)·ω,

   so L = I(t)ω(t) is an outcome of the stepper and its drift is a measurement.
   The algebraic route ω = L₀/I(t) is then a second, independent answer.

   The work done by whatever pulls the mass in follows from K = L²/2I:
   dK/dt = −½ İ ω². Integrating that over the track and comparing with
   K(t₁) − K(t₀) is the work–energy theorem for a body that changes shape.
   ---------------------------------------------------------------------------- */
function rtRedistribute(IOf, w0, t0, t1, n, IdotOf){
  n = Math.max(8, 2 * Math.round((n || 1200) / 2));
  const h = (t1 - t0) / n;
  const dI = IdotOf || (t => {
    const e = 1e-5 * Math.max(1, Math.abs(t1 - t0));
    return (IOf(t + e) - IOf(t - e)) / (2 * e);
  });
  const Ipos = t => { const v = IOf(t); return Number.isFinite(v) && v > 1e-9 ? v : 1e-9; };
  const F = (t, w) => -(dI(t) / Ipos(t)) * w;
  const R = odRK4First(F, t0, w0, h, n);
  const L0 = Ipos(t0) * w0;
  let dL = 0, gapW = 0;
  const Ks = new Float64Array(n + 1), Ps = new Float64Array(n + 1);
  for(let i = 0; i <= n; i++){
    const t = R.xs[i], w = R.ys[i], Ii = Ipos(t);
    dL = Math.max(dL, Math.abs(Ii * w - L0));
    gapW = Math.max(gapW, Math.abs(w - L0 / Ii));
    Ks[i] = 0.5 * Ii * w * w;
    Ps[i] = -0.5 * dI(t) * w * w;                 // the power the agent delivers
  }
  let W = 0;
  for(let i = 0; i <= n; i++) W += ((i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2)) * Ps[i];
  W *= h / 3;
  const dK = Ks[n] - Ks[0];
  return { L0, LEnd:Ipos(t1) * R.ys[n], dL, gapW, work:W, dK,
    gapWork:Math.abs(W - dK), K0:Ks[0], K1:Ks[n],
    w0, wEnd:R.ys[n], wAlg:L0 / Ipos(t1), I0:Ipos(t0), I1:Ipos(t1),
    ts:R.xs, ws:R.ys, n };
}
/* and the stepper's order on that ODE, against the algebraic ω = L₀/I */
function rtRedistOrder(IOf, w0, t0, t1, n, IdotOf){
  n = Math.max(4, Math.round(n || 20));
  const ex = (IOf(t0) * w0) / IOf(t1);
  const scale = Math.max(1e-12, Math.abs(ex));
  const e = k => Math.abs(rtRedistribute(IOf, w0, t0, t1, k, IdotOf).wEnd - ex);
  const e1 = e(n), e2 = e(2 * n);
  if(!(e1 > 1e-13 * scale) || !(e2 > 0)) return NaN;
  return Math.log2(e1 / e2);
}

/* ----------------------------------------------------------------------------
   4 · TWO BODIES COUPLED THROUGH A CLUTCH

   The textbook does this in one line: L is conserved, so ω_f = ΣIω/ΣI, and the
   energy lost is whatever is left over. That hides the interesting claim, which
   is that the loss does not depend on how hard the clutch grips.

   So the coupling is integrated. A friction torque τ_f acts on each body,
   opposite in sign, until the two speeds meet:

       I₁ ω̇₁ = −τ_f·sgn(ω₁−ω₂),      I₂ ω̇₂ = +τ_f·sgn(ω₁−ω₂)

   Total L is then measured along the track, the locking instant is located by
   inverse interpolation inside the crossing step, and the heat generated at the
   slipping surface is accumulated as ∫τ_f|ω₁−ω₂|dt. That integral is compared
   with ½·(I₁I₂/(I₁+I₂))·(Δω)² — the reduced-inertia form, exactly the ½μΔu² of
   a linear inelastic collision, out of which τ_f has cancelled entirely.
   ---------------------------------------------------------------------------- */
function rtCoupleRun(I1, w1, I2, w2, tauF, n){
  n = Math.max(8, Math.round(n || 400));
  const Ired = I1 * I2 / (I1 + I2);
  const dw = w1 - w2;
  const L0 = I1 * w1 + I2 * w2;
  const wfClosed = L0 / (I1 + I2);
  const heatClosed = 0.5 * Ired * dw * dw;
  const out = { ok:false, L0, L1:L0, dL:0, wf:wfClosed, wfClosed, tLock:0,
    tLockClosed:0, heat:heatClosed, heatClosed, gapHeat:0, Ired,
    K0:0.5 * I1 * w1 * w1 + 0.5 * I2 * w2 * w2, K1:0, dK:0, ts:[], o1:[], o2:[] };
  out.K1 = 0.5 * (I1 + I2) * wfClosed * wfClosed;
  out.dK = out.K0 - out.K1;
  if(!(I1 > 0) || !(I2 > 0) || !(tauF > 0) || Math.abs(dw) < 1e-14) return out;
  const sg = Math.sign(dw);
  const a1 = -tauF * sg / I1, a2 = tauF * sg / I2;
  const tClosed = Math.abs(dw) / (tauF * (1 / I1 + 1 / I2));
  const T = tClosed * 1.04, h = T / n;
  let o1 = w1, o2 = w2, heat = 0, dL = 0, tLock = NaN;
  const ts = [0], A = [w1], B = [w2];
  for(let i = 1; i <= n; i++){
    const p1 = o1, p2 = o2;
    const rel0 = p1 - p2;
    let step = h, done = false;
    if(sg * (rel0 + (a1 - a2) * h) <= 0){        // the crossing is inside this step
      step = -rel0 / (a1 - a2);
      done = true;
    }
    const q1 = p1 + a1 * step, q2 = p2 + a2 * step;
    /* the slip falls linearly, so the trapezoid over the step is exact */
    heat += tauF * (Math.abs(rel0) + Math.abs(q1 - q2)) / 2 * step;
    o1 = q1; o2 = q2;
    ts.push(ts[ts.length - 1] + step); A.push(o1); B.push(o2);
    dL = Math.max(dL, Math.abs(I1 * o1 + I2 * o2 - L0));
    if(done){ tLock = ts[ts.length - 1]; break; }
  }
  out.ok = Number.isFinite(tLock);
  out.tLock = tLock; out.tLockClosed = tClosed;
  out.wf = (o1 + o2) / 2;
  out.L1 = I1 * o1 + I2 * o2;
  out.dL = Math.max(dL, Math.abs(out.L1 - L0));
  out.heat = heat;
  out.gapHeat = Math.abs(heat - heatClosed);
  out.K1 = 0.5 * I1 * o1 * o1 + 0.5 * I2 * o2 * o2;
  out.dK = out.K0 - out.K1;
  out.ts = ts; out.o1 = A; out.o2 = B;
  return out;
}
/* Sweep the grip. The claim under test is that the heat is the same for every
   τ_f — a hard clutch and a soft one dissipate identical energy and differ only
   in how long the slipping lasts. Sampling two values would not be convincing,
   so this sweeps a decade and returns the spread. */
function rtCoupleSweep(I1, w1, I2, w2, taus, n){
  const runs = (taus || [0.5, 1, 2, 5, 10, 25, 60]).map(tf => {
    const r = rtCoupleRun(I1, w1, I2, w2, tf, n);
    return { tau:tf, heat:r.heat, tLock:r.tLock, wf:r.wf, dL:r.dL };
  }).filter(r => Number.isFinite(r.heat) && Number.isFinite(r.tLock));
  const hs = runs.map(r => r.heat);
  const lo = Math.min.apply(null, hs), hi = Math.max.apply(null, hs);
  const mid = (lo + hi) / 2 || 1;
  return { runs, lo, hi, spread:hi - lo, relSpread:(hi - lo) / Math.abs(mid),
    tLo:Math.min.apply(null, runs.map(r => r.tLock)),
    tHi:Math.max.apply(null, runs.map(r => r.tLock)) };
}
