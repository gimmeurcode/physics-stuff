/* ============================================================================
   1g · SECOND-ORDER LINEAR DIFFERENTIAL EQUATIONS
   ay″ + by′ + cy = g(t): the characteristic equation and its three cases,
   undetermined coefficients, variation of parameters, the driven oscillator,
   and power-series solutions.

   Every closed form here is checked against an RK4 integration of the same
   equation, because a formula that has not been integrated is a claim rather
   than a solution.
   ============================================================================ */

/* ============================================================================
   FIRST ORDER — slope fields, Euler's method, separation, and the two growth
   laws  (AP Calculus AB/BC unit 7)
   ============================================================================ */

/* A first-order equation y′ = F(x, y) assigns a slope to every point of the
   plane. The solution curves are the ones that follow those slopes, and the
   slope field is that assignment drawn — which is why you can sketch a solution
   without solving anything. */
const OD_FIELDS = {
  simple:  { name:"y′ = x", F:(x, y) => x, exact:(x, x0, y0) => y0 + (x * x - x0 * x0) / 2,
    note:'The slope depends on x alone, so every solution is a vertical translate of every other — the family of parabolas y = x²/2 + C. Whenever y is absent from the right-hand side the equation is really just an integral.' },
  linear:  { name:"y′ = y", F:(x, y) => y, exact:(x, x0, y0) => y0 * Math.exp(x - x0),
    note:'The rate of change is proportional to the amount present, which is the definition of exponential growth. Solutions never cross the x-axis: y = 0 is itself a solution, and uniqueness forbids any other curve from touching it.' },
  decay:   { name:"y′ = −0.5 y", F:(x, y) => -0.5 * y, exact:(x, x0, y0) => y0 * Math.exp(-0.5 * (x - x0)),
    note:'Radioactive decay, cooling, capacitor discharge, drug clearance — all the same equation. The half-life ln2/k is independent of how much you started with, which is the fingerprint of exponential decay.' },
  sep:     { name:"y′ = x·y", F:(x, y) => x * y, exact:(x, x0, y0) => y0 * Math.exp((x * x - x0 * x0) / 2),
    note:'Separable: gather the y\'s on one side and the x\'s on the other, then integrate both. The solution is a Gaussian in disguise, and it is the reason ∫x e^(x²/2) dx keeps appearing.' },
  logistic:{ name:"y′ = 0.8 y (1 − y/6)", F:(x, y) => 0.8 * y * (1 - y / 6), K:6, r:0.8,
    exact:(x, x0, y0) => { const A = (6 - y0) / y0; return 6 / (1 + A * Math.exp(-0.8 * (x - x0))); },
    note:'Growth that runs out of room. Near zero it is exponential; near the carrying capacity K the bracket closes and growth stops. The inflection is at exactly <b>K/2</b>, where the population grows fastest — which is the whole basis of maximum sustainable yield.' },
  newton:  { name:"y′ = −0.4(y − 20)   (cooling)", F:(x, y) => -0.4 * (y - 20),
    exact:(x, x0, y0) => 20 + (y0 - 20) * Math.exp(-0.4 * (x - x0)),
    note:"Newton's law of cooling: the rate is proportional to the <i>excess</i> temperature over the surroundings. The equilibrium at y = 20 is stable — start above it or below it and you approach it, which is what a negative coefficient on the deviation means." },
  nonlin:  { name:"y′ = x + y", F:(x, y) => x + y, exact:(x, x0, y0) => (y0 + x0 + 1) * Math.exp(x - x0) - x - 1,
    note:'Linear but not separable — it needs an integrating factor, e^(−x). The solution has an exponential racing away from a straight line, and for one special initial condition the exponential coefficient is zero and the solution <i>is</i> the line y = −x − 1.' },
  circle:  { name:"y′ = −x/y", F:(x, y) => -x / y, exact:(x, x0, y0) => Math.sqrt(Math.max(0, x0 * x0 + y0 * y0 - x * x)),
    note:'Separating gives y dy = −x dx and hence x² + y² = C: the solution curves are circles. Notice the equation says nothing at y = 0, and that is exactly where the circles have vertical tangents — the failure of the formula is geometry, not algebra.' }
};
/* Euler's method: step along the tangent line and repeat. The whole of
   numerical analysis is the observation that this is not good enough. */
function odEuler(F, x0, y0, h, n){
  const xs = [x0], ys = [y0];
  let x = x0, y = y0;
  for(let i = 0; i < n; i++){
    y = y + h * F(x, y);
    x = x + h;
    xs.push(x); ys.push(y);
  }
  return { xs, ys, final:y };
}
/* the improved (Heun) and RK4 versions, so the order of each can be measured */
function odHeun(F, x0, y0, h, n){
  const xs = [x0], ys = [y0];
  let x = x0, y = y0;
  for(let i = 0; i < n; i++){
    const k1 = F(x, y), k2 = F(x + h, y + h * k1);
    y = y + h * (k1 + k2) / 2; x = x + h;
    xs.push(x); ys.push(y);
  }
  return { xs, ys, final:y };
}
function odRK4First(F, x0, y0, h, n){
  const xs = [x0], ys = [y0];
  let x = x0, y = y0;
  for(let i = 0; i < n; i++){
    const k1 = F(x, y);
    const k2 = F(x + h / 2, y + h / 2 * k1);
    const k3 = F(x + h / 2, y + h / 2 * k2);
    const k4 = F(x + h, y + h * k3);
    y = y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); x = x + h;
    xs.push(x); ys.push(y);
  }
  return { xs, ys, final:y };
}
/* the observed order of a stepper, measured by halving h against the exact
   solution — Euler gives 1, Heun 2, RK4 4 */
function odStepOrder(method, F, exact, x0, y0, x1, n){
  const e = k => {
    const h = (x1 - x0) / k;
    return Math.abs(method(F, x0, y0, h, k).final - exact(x1, x0, y0));
  };
  const e1 = e(n), e2 = e(2 * n);
  return (e1 > 0 && e2 > 0) ? Math.log2(e1 / e2) : NaN;
}
/* the exponential and logistic models, with the quantities a question asks for */
function odExponential(y0, k, t){
  return { y:y0 * Math.exp(k * t), rate:k * y0 * Math.exp(k * t),
    doubling:k > 0 ? Math.LN2 / k : NaN, half:k < 0 ? Math.LN2 / -k : NaN };
}
function odLogistic(y0, r, K, t){
  const A = (K - y0) / y0;
  const y = K / (1 + A * Math.exp(-r * t));
  return { y, rate:r * y * (1 - y / K), K, inflection:K / 2,
    tInflect:y0 < K / 2 ? Math.log(A) / r : NaN,
    maxRate:r * K / 4 };
}

/* ------------------------------------------------ the characteristic roots ---- */
/* ar² + br + c = 0. Which of the three cases holds is decided by the
   discriminant, and the discriminant is exactly b² − 4ac — nothing about
   damping is put in by hand. */
function odRoots(a, b, c){
  const disc = b * b - 4 * a * c;
  if(disc > 1e-12){
    const s = Math.sqrt(disc);
    return { kind:'distinct', disc, r1:(-b + s) / (2 * a), r2:(-b - s) / (2 * a), alpha:NaN, omega:0 };
  }
  if(disc < -1e-12){
    const s = Math.sqrt(-disc);
    return { kind:'complex', disc, alpha:-b / (2 * a), omega:s / (2 * a), r1:NaN, r2:NaN };
  }
  return { kind:'repeated', disc:0, r1:-b / (2 * a), r2:-b / (2 * a), alpha:-b / (2 * a), omega:0 };
}
const OD_CASE_NAME = {
  distinct:'two real roots — overdamped',
  repeated:'a repeated root — critically damped',
  complex:'a complex pair — underdamped (oscillatory)'
};

/* the homogeneous solution fitted to y(0) = y₀, y′(0) = v₀.
   Solving the 2×2 system for the constants is the whole of "applying the
   initial conditions", and it is done here rather than quoted. */
function odHomog(a, b, c, y0, v0){
  const R = odRoots(a, b, c);
  if(R.kind === 'distinct'){
    /* y = C₁e^{r₁t} + C₂e^{r₂t} */
    const C2 = (v0 - R.r1 * y0) / (R.r2 - R.r1), C1 = y0 - C2;
    return { R, C1, C2, y:t => C1 * Math.exp(R.r1 * t) + C2 * Math.exp(R.r2 * t),
             dy:t => C1 * R.r1 * Math.exp(R.r1 * t) + C2 * R.r2 * Math.exp(R.r2 * t),
             basis:['e^(r₁t)', 'e^(r₂t)'] };
  }
  if(R.kind === 'repeated'){
    /* y = (C₁ + C₂t)e^{rt}; the t is forced on us — a second copy of e^{rt}
       would be linearly dependent and could not meet two initial conditions */
    const r = R.r1, C1 = y0, C2 = v0 - r * y0;
    return { R, C1, C2, y:t => (C1 + C2 * t) * Math.exp(r * t),
             dy:t => (C2 + r * (C1 + C2 * t)) * Math.exp(r * t),
             basis:['e^(rt)', 't·e^(rt)'] };
  }
  const { alpha, omega } = R;
  const C1 = y0, C2 = (v0 - alpha * y0) / omega;
  return { R, C1, C2,
    y:t => Math.exp(alpha * t) * (C1 * Math.cos(omega * t) + C2 * Math.sin(omega * t)),
    dy:t => Math.exp(alpha * t) * ((alpha * C1 + omega * C2) * Math.cos(omega * t)
                                 + (alpha * C2 - omega * C1) * Math.sin(omega * t)),
    basis:['e^(αt)cos ωt', 'e^(αt)sin ωt'],
    amp:Math.hypot(C1, C2), phase:Math.atan2(-C2, C1) };
}

/* the Wronskian of the two basis solutions — nonzero exactly when they are
   independent, and Abel's formula says it evolves as W₀e^(−bt/a) */
function odWronskian(a, b, c, t){
  const R = odRoots(a, b, c);
  if(R.kind === 'distinct') return (R.r2 - R.r1) * Math.exp((R.r1 + R.r2) * t);
  if(R.kind === 'repeated') return Math.exp(2 * R.r1 * t);
  return R.omega * Math.exp(2 * R.alpha * t);
}
const odAbel = (a, b, W0, t) => W0 * Math.exp(-b * t / a);

/* --------------------------------------------- RK4, the independent check ---- */
/* y″ = (g(t) − by′ − cy)/a, integrated as a first-order pair. */
function odRK4(a, b, c, g, y0, v0, t0, t1, n){
  n = Math.max(4, Math.round(n || 4000));
  const h = (t1 - t0) / n;
  const ts = new Float64Array(n + 1), ys = new Float64Array(n + 1), vs = new Float64Array(n + 1);
  let y = y0, v = v0, t = t0;
  ts[0] = t0; ys[0] = y0; vs[0] = v0;
  const acc = (t, y, v) => (g(t) - b * v - c * y) / a;
  for(let i = 1; i <= n; i++){
    const k1y = v,                 k1v = acc(t, y, v);
    const k2y = v + h / 2 * k1v,   k2v = acc(t + h / 2, y + h / 2 * k1y, v + h / 2 * k1v);
    const k3y = v + h / 2 * k2v,   k3v = acc(t + h / 2, y + h / 2 * k2y, v + h / 2 * k2v);
    const k4y = v + h * k3v,       k4v = acc(t + h, y + h * k3y, v + h * k3v);
    y += h / 6 * (k1y + 2 * k2y + 2 * k3y + k4y);
    v += h / 6 * (k1v + 2 * k2v + 2 * k3v + k4v);
    t = t0 + i * h;
    ts[i] = t; ys[i] = y; vs[i] = v;
  }
  return { ts, ys, vs, h };
}
/* sample a closed form on the same grid, so the two can be differenced */
function odMaxGap(sol, num){
  let m = 0;
  for(let i = 0; i < num.ts.length; i += 3){
    const e = Math.abs(sol(num.ts[i]) - num.ys[i]);
    if(Number.isFinite(e)) m = Math.max(m, e);
  }
  return m;
}
/* The scale that gap has to be read against, measured over the SAME samples:
   the largest excursion the solution actually makes. A gap of 1e-3 is the
   stepper working on a solution of size 10 and the stepper failing on one that
   has decayed to 1e-3. Kept separate from odMaxGap rather than folded into a
   returned object, because four unit tests assert on that function's numeric
   value directly. */
function odGapScale(sol, num){
  let s = 0;
  for(let i = 0; i < num.ts.length; i += 3){
    const a = Math.abs(sol(num.ts[i])), b = Math.abs(num.ys[i]);
    if(Number.isFinite(a)) s = Math.max(s, a);
    if(Number.isFinite(b)) s = Math.max(s, b);
  }
  return s;
}

/* ------------------------------------------- undetermined coefficients ------ */
/* The forcings whose particular solutions can be guessed, with the guess and
   the resonance rule that says when to multiply by t. */
const OD_FORCINGS = {
  none:  { name:'g(t) = 0  (free)', g:() => 0, tex:'0',
    note:'No forcing: the solution is the complementary function alone, and every case decays if the damping is positive.' },
  const_:{ name:'g(t) = k  (constant)', g:() => 4, tex:'4',
    note:'Guess a constant y_p = A. Substituting gives cA = k, so y_p = k/c — the new equilibrium. It fails only when c = 0, and then the guess must be multiplied by t.' },
  poly:  { name:'g(t) = t', g:t => t, tex:'<i>t</i>',
    note:'Guess y_p = At + B: a polynomial forcing needs a polynomial of the same degree, with every lower power included because the derivatives generate them.' },
  expo:  { name:'g(t) = 3e^(−0.5t)', g:t => 3 * Math.exp(-0.5 * t), tex:'3<i>e</i><sup>−0.5<i>t</i></sup>',
    note:'Guess y_p = Ae^(−0.5t) — unless −0.5 is a characteristic root, in which case the guess is already a homogeneous solution and contributes nothing. Then multiply by t.' },
  cosine:{ name:'g(t) = 2cos(ωt)', g:t => 2 * Math.cos(1.4 * t), tex:'2 cos <i>ωt</i>',
    note:'Guess y_p = A cos ωt + B sin ωt — <i>both</i>, because differentiating twice mixes them. The phase lag between forcing and response is the whole content of B being nonzero.' }
};
/* the particular solution for a sinusoidal drive, in closed form.
   a y″ + b y′ + c y = F₀cos ωt has y_p = (F₀/|Z|)cos(ωt − δ) with
   |Z| = √((c − aω²)² + (bω)²) and tan δ = bω/(c − aω²). */
function odDrivenResponse(a, b, c, F0, w){
  const re = c - a * w * w, im = b * w;
  const Z = Math.hypot(re, im);
  return { amp:F0 / Z, delta:Math.atan2(im, re), Z, re, im,
           A:F0 * re / (Z * Z), B:F0 * im / (Z * Z) };
}
/* the frequency at which that amplitude peaks — not ω₀ unless b = 0 */
function odResonantOmega(a, b, c){
  const w02 = c / a, z = b * b / (2 * a * a);
  const w2 = w02 - z;
  return w2 > 0 ? Math.sqrt(w2) : NaN;
}
const odNaturalOmega = (a, c) => Math.sqrt(c / a);
const odDampingRatio = (a, b, c) => b / (2 * Math.sqrt(a * c));
const odQualityFactor = (a, b, c) => Math.sqrt(a * c) / b;

/* variation of parameters, for a forcing the guessing table cannot reach.
   y_p = −y₁∫ y₂g/(aW) dt + y₂∫ y₁g/(aW) dt, evaluated numerically at t. */
function odVariation(a, b, c, g, t){
  const R = odRoots(a, b, c);
  let y1, y2;
  if(R.kind === 'distinct'){ y1 = s => Math.exp(R.r1 * s); y2 = s => Math.exp(R.r2 * s); }
  else if(R.kind === 'repeated'){ y1 = s => Math.exp(R.r1 * s); y2 = s => s * Math.exp(R.r1 * s); }
  else { y1 = s => Math.exp(R.alpha * s) * Math.cos(R.omega * s);
         y2 = s => Math.exp(R.alpha * s) * Math.sin(R.omega * s); }
  const W = s => odWronskian(a, b, c, s);
  const I1 = nqAdaptive(s => y2(s) * g(s) / (a * W(s)), 0, t, 1e-10);
  const I2 = nqAdaptive(s => y1(s) * g(s) / (a * W(s)), 0, t, 1e-10);
  return { yp:-y1(t) * I1 + y2(t) * I2, y1:y1(t), y2:y2(t), W:W(t) };
}

/* ---------------------------------------------------------- applications ---- */
/* One equation, two vocabularies. The stage prints both columns from the same
   three numbers, which is the point of the analogy. */
function odMechanical(m, gamma, k){
  return { a:m, b:gamma, c:k,
    w0:odNaturalOmega(m, k), zeta:odDampingRatio(m, gamma, k), Q:odQualityFactor(m, gamma, k),
    wd:(() => { const R = odRoots(m, gamma, k); return R.kind === 'complex' ? R.omega : NaN; })(),
    labels:{ a:'mass m', b:'damping γ', c:'stiffness k', y:'displacement x', g:'driving force F' } };
}
function odElectrical(L, Rr, C){
  return { a:L, b:Rr, c:1 / C,
    w0:odNaturalOmega(L, 1 / C), zeta:odDampingRatio(L, Rr, 1 / C), Q:odQualityFactor(L, Rr, 1 / C),
    wd:(() => { const R = odRoots(L, Rr, 1 / C); return R.kind === 'complex' ? R.omega : NaN; })(),
    labels:{ a:'inductance L', b:'resistance R', c:'1/capacitance', y:'charge q', g:'driving EMF' } };
}

/* --------------------------------------------------------- series solutions ---- */
/* Substituting y = Σaₙxⁿ turns the differential equation into a recurrence.
   Each entry supplies the recurrence, not the answer, and the coefficients are
   generated by running it. */
const OD_SERIES = {
  airy: {
    name:"Airy's equation   y″ − x·y = 0",
    /* aₙ₊₂·(n+2)(n+1) = aₙ₋₁ ⇒ aₙ₊₃ = aₙ / ((n+3)(n+2)) */
    rec:(a, n) => (n >= 1 ? a[n - 1] / ((n + 2) * (n + 1)) : 0),
    ode:{ p:() => 0, q:x => -x },
    R:'∞',
    note:'The coefficients link in steps of three, so the two independent solutions are the n ≡ 0 and n ≡ 1 families. Ai and Bi oscillate on one side of the origin and grow or decay on the other — the classic turning point, and the reason this equation governs the edge of a quantum tunnelling region and the caustics of a rainbow.'
  },
  hermite: {
    name:"Hermite   y″ − 2x·y′ + 2λy = 0   (λ = 4)",
    rec:(a, n, lam) => a[n] * (2 * n - 2 * (lam === undefined ? 4 : lam)) / ((n + 2) * (n + 1)),
    ode:{ p:x => -2 * x, q:() => 8 },
    R:'∞',
    note:'When λ is a non-negative integer the recurrence hits zero and the series <i>terminates</i> — a polynomial. That truncation is quantisation: the harmonic-oscillator energies in the quantum wing are exactly the λ values that make this series stop before it blows up.'
  },
  legendre: {
    name:'Legendre   (1−x²)y″ − 2xy′ + 6y = 0   (ℓ = 2)',
    rec:(a, n) => a[n] * (n * (n + 1) - 6) / ((n + 2) * (n + 1)),
    ode:{ p:x => -2 * x / (1 - x * x), q:x => 6 / (1 - x * x) },
    R:'1',
    note:'Singular points at x = ±1 cap the radius of convergence at 1. For integer ℓ one of the two series terminates, giving the Legendre polynomials — the angular part of every hydrogen orbital in the atom wing.'
  },
  simple: {
    name:"Simple harmonic   y″ + y = 0",
    rec:(a, n) => -a[n] / ((n + 2) * (n + 1)),
    ode:{ p:() => 0, q:() => 1 },
    R:'∞',
    note:'The recurrence generates the alternating factorials of cosine and sine from nothing but a₀ and a₁. It is worth watching once: the two most familiar functions in mathematics, assembled by a two-line rule.'
  }
};
/* run a recurrence to N terms from the two free constants a₀ and a₁ */
function odSeriesCoeffs(key, a0, a1, N, lam){
  const S = OD_SERIES[key], a = new Array(N + 3).fill(0);
  a[0] = a0; a[1] = a1;
  for(let n = 0; n + 2 <= N; n++) a[n + 2] = S.rec(a, n, lam);
  return a.slice(0, N + 1);
}
const odSeriesEval = (a, x) => {
  let s = 0, p = 1;
  for(let i = 0; i < a.length; i++){ s += a[i] * p; p *= x; }
  return s;
};
/* The radius of convergence, measured from the coefficients actually generated.
   The root test rather than the ratio test, because every recurrence here links
   aₙ to aₙ₊₂ or aₙ₊₃ and leaves the terms in between exactly zero — a ratio of
   consecutive coefficients would be 0 or undefined half the time. R = 1/limsup
   |aₙ|^(1/n) has no such trouble. */
function odSeriesRadius(a){
  let best = 0, found = false;
  for(let i = a.length - 1; i > Math.max(4, a.length - 14); i--){
    const v = Math.abs(a[i]);
    if(v > 1e-300){ best = Math.max(best, Math.pow(v, 1 / i)); found = true; }
  }
  return found && best > 0 ? 1 / best : Infinity;
}
