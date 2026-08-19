/* ============================================================================
   5h · A MOTION PROGRAMME THE READER WRITES
   Programme A relativity items 12 (rlTwin) and 13 (rlRocket), 2026-08-19.

   UNITS: c = 1, with proper time and coordinate time in YEARS and distance in
   LIGHT-YEARS. One g is then 1.03 ly/yr² — near enough to 1 that a reader can
   see the shape of the answer without converting anything, and far enough from
   1 that nothing here can accidentally depend on it being 1.

   ------------------------------------------------------ the one good variable
   PROPER ACCELERATION IS THE DERIVATIVE OF RAPIDITY, exactly:

       dφ/dτ = a(τ),   β = tanh φ,   γ = cosh φ,
       dt/dτ = cosh φ,  dx/dτ = sinh φ.

   That is the whole engine, and it is worth pausing on. `rlVel` showed that
   rapidities ADD where velocities do not; this says the same thing in
   differential form — what a rocket's engine delivers, steadily, is rapidity.
   Hold a constant a and φ grows without bound while β creeps towards 1, which
   is why "keep accelerating at 1 g" is a coherent instruction forever and
   "keep gaining 10 m/s each second" is not. Integrating in φ also removes every
   singular denominator: nothing here divides by 1 − β², so a programme that
   reaches β = 0.999999999 is no harder to integrate than one that dawdles.

   ------------------------------------------------------------- the two routes
   ROUTE A  RK4 on (φ, t, x) against proper time τ, from the reader's a(τ).
   ROUTE B  the proper time read BACK off the worldline it produced, as the sum
            of chord intervals √(Δt² − Δx²) between successive samples.

   Route B never mentions a, φ or a differential equation: it is the geometry of
   the curve route A drew. It converges to τ from ABOVE at h², for the reason
   46e records — a chord is the straight route between two events and in this
   geometry the straight route is the longest — so the gap between the routes is
   a measurement of the integration, and `tests.js` measures its order rather
   than asserting it.

   ------------------------------------------------------------ the closed form
   For constant a the answers are exact and the engine is pinned against them:

       φ = aτ,   t = sinh(aτ)/a,   x = (cosh(aτ) − 1)/a,
       and the RINDLER HORIZON sits 1/a behind the ship, forever.

   That last one is not decoration. While the acceleration is held, no signal
   from beyond 1/a astern ever catches up — a horizon built out of nothing but
   motion, in flat spacetime, with no mass anywhere. It is the closest thing in
   special relativity to a black hole's, and an accelerating detector really
   does register a thermal bath where an inertial one finds vacuum.

   ------------------------------------------------------------------ refusals
   A programme is refused when its rapidity diverges before τ₁ (an acceleration
   that grows faster than 1/(τ_end − τ) reaches infinite rapidity in finite
   proper time, which is not a motion), and when a(τ) has no value somewhere on
   the interval. Neither is guarded past: the panel says which and where.
   ============================================================================ */

const RL_G_LY = 1.0323;                 /* one g, in light-years per year² */

/* RK4 on the three-variable system, in proper time. The samples are uniform in
   τ, which is the variable the reader's programme is written in and the one in
   which nothing is singular. */
function rlMotionRun(aFn, tau1, n){
  n = Math.max(8, 2 * Math.round((n || 2000) / 2));
  const h = tau1 / n;
  const tau = new Float64Array(n + 1), ph = new Float64Array(n + 1),
        ts = new Float64Array(n + 1), xs = new Float64Array(n + 1);
  let bad = 0, blew = 0;
  const A = t => { const v = aFn(t); if(!Number.isFinite(v)){ bad++; return 0; } return v; };
  for(let i = 0; i < n; i++){
    const t0 = tau[i], p0 = ph[i], T0 = ts[i], X0 = xs[i];
    const k1p = A(t0),               k1t = Math.cosh(p0),               k1x = Math.sinh(p0);
    const k2p = A(t0 + h / 2),       k2t = Math.cosh(p0 + h * k1p / 2), k2x = Math.sinh(p0 + h * k1p / 2);
    const k3p = A(t0 + h / 2),       k3t = Math.cosh(p0 + h * k2p / 2), k3x = Math.sinh(p0 + h * k2p / 2);
    const k4p = A(t0 + h),           k4t = Math.cosh(p0 + h * k3p),     k4x = Math.sinh(p0 + h * k3p);
    ph[i + 1] = p0 + h * (k1p + 2 * k2p + 2 * k3p + k4p) / 6;
    ts[i + 1] = T0 + h * (k1t + 2 * k2t + 2 * k3t + k4t) / 6;
    xs[i + 1] = X0 + h * (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
    tau[i + 1] = t0 + h;
    if(!blew && !(Math.abs(ph[i + 1]) < 700)) blew = i + 1;
  }
  return { tau, ph, ts, xs, n, h, bad, blew,
           tauEnd:tau1, tEnd:ts[n], xEnd:xs[n], phEnd:ph[n],
           betaEnd:Math.tanh(ph[n]), gammaEnd:Math.cosh(ph[n]) };
}

/* ROUTE B — the proper time read back off the worldline as the sum of chord
   intervals. It knows nothing about a, φ or the differential equation; it is
   the length of the curve route A drew, measured the way 46e's polygon is, and
   it approaches τ from ABOVE at h². */
function rlMotionChords(R, stride){
  const s = Math.max(1, Math.round(stride || 1));
  let tau = 0, bad = 0;
  for(let i = s; i <= R.n; i += s){
    const dt = R.ts[i] - R.ts[i - s], dx = R.xs[i] - R.xs[i - s];
    const s2 = dt * dt - dx * dx;
    if(!Number.isFinite(s2) || s2 < 0) bad++; else tau += Math.sqrt(s2);
  }
  return { tau, bad, steps:Math.floor(R.n / s) };
}

/* the exact answers for a constant proper acceleration, which is what the
   integrator is pinned against */
const rlMotionClosed = (a, tau) => ({
  phi: a * tau,
  t: a === 0 ? tau : Math.sinh(a * tau) / a,
  x: a === 0 ? 0 : (Math.cosh(a * tau) - 1) / a,
  beta: Math.tanh(a * tau),
  gamma: Math.cosh(a * tau),
  horizon: a === 0 ? Infinity : 1 / a
});

/* Everything the panels print. `agree` is the two-route residual and `gross` is
   the elapsed coordinate time, which is what a proper time is a fraction of —
   the right scale for a residual here, since τ itself can be small while t is
   enormous, and that gap IS the effect. */
function rlMotionMeasure(aFn, tau1, n){
  const out = { ok:false, why:'' };
  if(!(Number.isFinite(tau1) && tau1 > 0)){
    out.why = 'the programme needs a stretch of proper time to run over';
    return out;
  }
  const R = rlMotionRun(aFn, tau1, n || 2000);
  out.run = R;
  if(R.bad){
    out.why = 'a(τ) has no value at ' + R.bad + ' of the ' + (R.n + 1) +
              ' points the integrator asked for';
    return out;
  }
  if(R.blew){
    out.why = 'the rapidity runs away at τ ≈ ' + fmtSig(R.tau[R.blew], 4) +
              ' — an acceleration that grows faster than 1/(τ_end − τ) reaches ' +
              'infinite rapidity in finite proper time, and that is not a motion';
    return out;
  }
  const C = rlMotionChords(R, 1);
  out.ok = true;
  out.tau = tau1;
  out.t = R.tEnd; out.x = R.xEnd; out.phi = R.phEnd;
  out.beta = R.betaEnd; out.gamma = R.gammaEnd;
  out.chords = C.tau;
  out.agree = Math.abs(C.tau - tau1);
  out.gross = Math.abs(R.tEnd);
  out.dilation = R.tEnd / tau1;
  /* the largest rapidity reached, and the horizon that goes with the largest
     acceleration — both are properties of the whole programme, not the end */
  let pMax = 0, aMax = 0;
  for(let i = 0; i <= R.n; i++) pMax = Math.max(pMax, Math.abs(R.ph[i]));
  for(let i = 0; i <= R.n; i++) aMax = Math.max(aMax, Math.abs(aFn(R.tau[i])));
  out.phiMax = pMax; out.betaMax = Math.tanh(pMax); out.gammaMax = Math.cosh(pMax);
  out.aMax = aMax; out.horizon = aMax > 0 ? 1 / aMax : Infinity;
  out.returns = Math.abs(R.xEnd) < 1e-6 * Math.max(1e-30, Math.max.apply(null, Array.from(R.xs).map(Math.abs)));
  return out;
}

/* The presets. `tau`, `t` and `x` are declared where a closed form exists, and
   `auditclaims` recomputes every one of them by integrating — never by
   re-evaluating the same formula. */
const RL_MOTIONS = {
  coast:   { name:'no engine at all', short:'coasting',
             src:'0', ex:'a(τ) = 0', tau1:10,
             t:10, x:0, phi:0,
             why:'The control. With no acceleration the proper time and the coordinate time are the same number and the ship goes nowhere — which is the only case in which those two statements are both true.' },
  oneg:    { name:'one g, held forever', short:'1 g',
             src:'1.0323', ex:'a(τ) = 1 g', tau1:10,
             t:Math.sinh(RL_G_LY * 10) / RL_G_LY, x:(Math.cosh(RL_G_LY * 10) - 1) / RL_G_LY,
             phi:RL_G_LY * 10,
             why:'Ten years of your own life at a comfortable one g. The coordinate time is 15 000 years and the distance is 15 000 light-years — the galactic centre is 26 000 away, and it is about twenty years of ship time. Proper time grows only <b>logarithmically</b> with distance.' },
  /* The switches are tanh's rather than steps, and that is physics as much as
     numerics: no engine reverses instantaneously, and a discontinuous a(τ)
     would cost RK4 its order at the two points it jumps. Width ~0.1 yr. */
  turn:    { name:'out and back — the twin, properly', short:'the twin',
             src:'1.0323*tanh(20*(t-2))*tanh(20*(t-6))',
             ex:'a(τ) = +1 g, −1 g, −1 g, +1 g — two years each', tau1:8,
             t:null, x:null, phi:null,
             why:'The turnaround written as an acceleration rather than as a kink: four equal legs of two years each, and the traveller comes home to where they started. The stay-at-home ages more, and the panel measures by how much rather than quoting γ at a speed that was never constant.' },
  pulse:   { name:'one burn, then coast', short:'one burn',
             src:'1.0323*exp(-((t-2)/0.6)^2)', ex:'a(τ) = 1 g · e^(−((τ−2)/0.6)²)', tau1:10,
             t:null, x:null, phi:null,
             why:'A single Gaussian burn and then nothing. Rapidity is the area under that curve, so the ship coasts afterwards at exactly tanh of it — the integral of the engine, not of the speed.' },
  ramp:    { name:'a rising thrust', short:'ramp',
             src:'0.3*t', ex:'a(τ) = 0.3 τ', tau1:6,
             t:null, x:null, phi:null,
             why:'The acceleration climbs steadily, so the rapidity climbs quadratically and the speed piles up against c. Nothing in the integration notices: it works in rapidity, where there is no barrier to run into.' },
  runaway: { name:'faster than any clock can hold', short:'runaway',
             src:'1/(3.01 - t)', ex:'a(τ) = 1/(3.01 − τ)', tau1:3,
             t:null, x:null, phi:null,
             why:'An acceleration with a pole just past the end. The rapidity is −ln(3.01 − τ), which is finite here but heads for infinity — push τ₁ past 3.01 and the panel refuses, because reaching infinite rapidity in finite proper time is not a motion.' }
};
const rlMotionName = k => (RL_MOTIONS[k] ? RL_MOTIONS[k].name : 'your own programme');
