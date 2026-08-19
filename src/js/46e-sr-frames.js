/* ============================================================================
   5e · A WORLDLINE THE READER WRITES, AND A CHAIN OF BOOSTS THEY WRITE DOWN
   Programme A items 10 (rlMink) and 11 (rlVel), 2026-08-18.

   The four modules before this one curve spacetime. This one goes back to the
   flat case and asks the two questions special relativity is actually made of:

     what is INVARIANT under a boost, and what COMPOSES under two of them.

   UNITS: c = 1 throughout, so a time and a length are the same kind of number
   and a velocity is a pure β. Nothing here has a metre or a second in it.

   ------------------------------------------------------------------ part 1 --
   A WORLDLINE IS A CURVE, AND PROPER TIME IS ITS LENGTH.

   Give x(t) on [t₀, t₁] with |ẋ| < 1 everywhere and the wristwatch time of
   whoever follows it is

       τ = ∫ √(1 − ẋ²) dt                                            (route A)

   which is arc length in a geometry whose Pythagoras has a minus sign. The
   claim every stage in this wing leans on is that τ is the same number for
   every inertial observer — so the test is to hand the SAME worldline to an
   observer moving at β and let them do their own integral:

       t′ = γ(t − βx(t)),  x′ = γ(x(t) − βt),  τ′ = ∫ √(1 − (dx′/dt′)²) dt′
                                                                     (route B)

   THE TWO ROUTES SHARE NO ARITHMETIC, and the way that is arranged is worth
   stating, because the obvious version of route B is a tautology. Writing the
   primed integral back in the parameter t gives ∫√((dt′/dt)² − (dx′/dt)²)dt,
   in which the γ's cancel ALGEBRAICALLY and the answer agrees to the last bit
   whatever the physics — a test that cannot fail is not a test. So route B is
   made to work the way the moving observer really would:

     · it inverts t′(t) by BISECTION, and therefore only ever evaluates x(t) —
       route B never touches the analytic derivative at all, so a wrong
       symbolic ẋ shows up as a disagreement rather than cancelling out;
     · it differentiates x′ with respect to t′ by a five-point stencil in t′,
       whose five nodes are five separate inversions — a different variable
       from route A and a derivative route A does not take;
     · it integrates adaptively in t′, so where the two frames disagree about
       which parts of the worldline are interesting, they each put their
       samples where their own integrand needs them.

   THE FIRST VERSION USED A UNIFORM t′ GRID AND THAT WAS THE WHOLE PROBLEM.
   dt′/dt = γ(1 − βẋ) is not constant — on the 0.99 tanh t worldline seen from
   β = 0.99 it runs from 0.14 to 7.09 — so a grid uniform in t′ is a grid fifty
   times coarser in t at one end than at the other, and it lands its coarse end
   exactly where tanh has all its curvature. Measured, that cost route B four
   digits: 3×10⁻⁴ where the same code gave 2×10⁻¹¹ on a gentler worldline. It
   is item 2's lesson in a third costume — size the step by the thing being
   measured, not by the variable that happens to be on the axis — and the cure
   is an adaptive rule, which finds that structure by itself.

   The residual floor is the numerical derivative's, not the quadrature's, and
   it was found by sweeping rather than by deriving: over five worldlines and
   eight boosts the two routes agree to 10⁻¹³–10⁻¹⁴ on the gentle cases and to
   **5×10⁻⁹ at worst** — 0.99 tanh t seen from β = 0.99, whose primed integrand
   has all its structure crammed into the first fiftieth of t′. Deepening the
   adaptive recursion does not touch that number (it costs six times the work
   for nothing, measured); only the stencil's h does, and h has an optimum.
   The acceptance in tests.js is that measured floor and nothing else.

   The EXACT invariance statements live elsewhere and are exact: the polygon
   below is the same number in both frames to 10⁻¹⁵, and so is the endpoints'
   own interval.

   THE POLYGON IS THE THIRD ROUTE AND THE GEOMETRY LESSON. Join the sampled
   events by straight inertial segments and add up the intervals. Each chord's
   √(Δt² − Δx²) is a Lorentz invariant on its own, so the polygon's total is
   the same number in every frame to round-off — computed here from BOOSTED
   coordinates, so the invariance is measured rather than assumed.

   AND IT CONVERGES TO τ FROM ABOVE, WHICH IS THE OPPOSITE OF EUCLID. This
   module's first draft said "from below", by analogy with an inscribed polygon
   being shorter than the arc it is inscribed in, and the measurement said
   otherwise: 3.636897 against 3.636893 on the rocket. The analogy is exactly
   backwards, and the reason is the minus sign. Each chord is the STRAIGHT
   route between two events on the curve, and in Minkowski geometry the
   straight route between two timelike-separated events is the LONGEST one —
   so every chord beats the piece of curve it replaces, and the polygon beats
   the whole worldline. Refine it and it falls to τ at h², from above. The
   limiting case of one chord is `rlWlStraight`, the stay-at-home twin, and it
   is the largest number of all: no route between two events has more proper
   time than the inertial one. That is the reverse triangle inequality, it is
   the whole of the twin paradox, and this is where the sign of the deficit
   comes from.

   WHAT REFUSES, AND WHY IT TAKES TWO GUARDS. |ẋ| < 1 is a condition at every
   point and a grid scan is necessary, not sufficient (SITE-RULES §2, and the
   class item 2 was fixed for) — the largest SAMPLE is not the largest value.
   So `rlWlSpeedMax` scans and then refines the winning cell by golden section,
   AND every quadrature below COUNTS the samples at which 1 − ẋ² came out
   negative, the way `rlDeflect` counts the samples it could not evaluate. One
   bad sample makes the whole answer meaningless and is reported as such; a
   guard that quietly returned 0 there would silently redefine the problem.

   Measured on 0.5t + 0.02exp(−((t−1.2345)/0.02)²): a plain 64-point grid
   maximum is **0.52**, comfortably subluminal and completely wrong; the same
   64 points with the refinement give **1.36**, which is what a scan sixty-four
   times finer gives; and the quadrature's counter fires independently on the
   same worldline. Both guards are in tests.js with the plain grid asserted to
   be WRONG, which is what stops the refinement being tidied away. Neither can
   see a feature narrower than both grids at once — that is a real limit, not a
   covered case, and the honest consequence is that the scan's resolution is a
   parameter rather than a promise.

   ------------------------------------------------------------------ part 2 --
   A CHAIN OF BOOSTS, AND THE VARIABLE THAT MAKES IT ADDITION.

   Compose n collinear boosts. Three routes, sharing nothing:

     ROUTE A  fold them one at a time with w ← (w + β)/(1 + wβ), which is the
              only thing an observer in each frame could actually measure.
     ROUTE B  add the rapidities φ = artanh β and take one tanh at the end.
     ROUTE C  multiply the 2×2 matrices Λ(β) = [[γ, −γβ], [−γβ, γ]] and read
              the boost back off the product as β = −Λ₀₁/Λ₀₀. This route knows
              neither formula: it is the composition of the linear maps
              themselves, and it also checks ΛᵀηΛ = η on the product — that the
              composition is STILL a boost is measured, not assumed.

   AND ROUTE A RUNS OUT OF DIGITS WHILE THE OTHER TWO DO NOT. 1 − tanh φ ≈
   2e^(−2φ), so once Σφ passes about 19 the composed β is exactly 1.0 in
   float64 and every question asked in that variable has lost its answer:
   γ, the shortfall, the residual against route B. This is not a defect to be
   guarded away — it is the reason accelerator physicists quote rapidity and
   not speed, and `rlChainCompose` reports the step at which it happened
   (`satAt`) so the panel can say so. The comparison is therefore made in
   RAPIDITY, where all three routes still have digits, and the stage names the
   case rather than printing a residual it cannot support.

   THE THING THAT IS NOT TRUE IN 3+1. Collinear boosts commute, so the chain's
   answer cannot depend on the order the reader wrote it in — `rlChainShuffle`
   composes a deterministic shuffle and the stage prints the difference. Do not
   generalise it: two boosts along different axes do NOT commute, and their
   commutator is the Wigner rotation, which is why Thomas precession exists.
   ============================================================================ */

/* ---------------------------------------------------------------- worldlines */

/* The largest |ẋ| on the worldline, and where it happens. Coarse scan for the
   winning cell, golden section inside it — a scan alone reports the largest
   SAMPLE, which is not the largest value, and the difference is exactly the
   worldline that pokes through the light cone between two samples. */
function rlWlSpeedMax(xd, t0, t1, n){
  n = Math.max(64, Math.round(n || 2048));
  const h = (t1 - t0) / n;
  let best = -Infinity, at = t0, bad = 0, iBest = 0;
  for(let i = 0; i <= n; i++){
    const t = t0 + i * h, v = Math.abs(xd(t));
    if(!Number.isFinite(v)){ bad++; continue; }
    if(v > best){ best = v; at = t; iBest = i; }
  }
  if(!Number.isFinite(best)) return { max:NaN, at:t0, bad };
  let a = t0 + Math.max(0, iBest - 1) * h, b = t0 + Math.min(n, iBest + 1) * h;
  const G = (Math.sqrt(5) - 1) / 2;
  let c = b - G * (b - a), d = a + G * (b - a);
  let fc = Math.abs(xd(c)), fd = Math.abs(xd(d));
  for(let k = 0; k < 90 && b - a > 1e-14 * Math.max(1, Math.abs(b)); k++){
    if(!(fc > fd)){ a = c; c = d; fc = fd; d = a + G * (b - a); fd = Math.abs(xd(d)); }
    else          { b = d; d = c; fd = fc; c = b - G * (b - a); fc = Math.abs(xd(c)); }
  }
  const vr = Math.max(fc, fd);
  if(Number.isFinite(vr) && vr > best){ best = vr; at = fc > fd ? c : d; }
  return { max:best, at, bad };
}

/* ROUTE A — proper time as the LAB computes it, with the analytic derivative
   and adaptive Simpson. `bad` counts the samples where 1 − ẋ² was negative or
   not a number: one of them and the answer means nothing. */
function rlWlTauLab(xd, t0, t1, tol){
  let bad = 0;
  const g = t => {
    const v = xd(t), q = 1 - v * v;
    if(!Number.isFinite(q) || q < 0){ bad++; return 0; }
    return Math.sqrt(q);
  };
  const tau = nqAdaptive(g, t0, t1, tol || 1e-13, 24);
  return { tau: bad ? NaN : tau, raw:tau, bad };
}

/* t′(t) is strictly increasing wherever the worldline is timelike, because
   dt′/dt = γ(1 − βẋ) and both factors are positive — which is why the boosted
   events are still the graph of a function and the moving observer can
   integrate exactly as the lab did. Inverted by bisection, so route B evaluates
   x(t) and nothing else. */
function rlWlInvert(T, target, a, b){
  let lo = a, hi = b, flo = T(a) - target;
  if(!Number.isFinite(flo)) return NaN;
  for(let k = 0; k < 64; k++){
    const m = 0.5 * (lo + hi), fm = T(m) - target;
    if(fm === 0) return m;
    if((flo < 0) === (fm < 0)){ lo = m; flo = fm; } else hi = m;
  }
  return 0.5 * (lo + hi);
}

/* The derivative at each of the five nodes of an equally spaced five-point
   stencil, ×12h. The window is SLID rather than shortened near an endpoint, so
   the order is h⁴ everywhere including at t′₀ and t′₁ — and every node stays
   inside the interval, which matters because outside it the inversion has no
   bracket and x(t) may not even be defined. */
const RL_D5 = [[-25, 48, -36, 16, -3],
               [ -3,-10,  18, -6,  1],
               [  1, -8,   0,  8, -1],
               [ -1,  6, -18, 10,  3],
               [  3,-16,  36,-48, 25]];

/* dx′/dt′ at one t′, by five inversions. `j` is which node of the window t′ is
   — 2 in the interior, shifted towards an end when the centred window would
   fall outside. */
function rlWlPrimedSpeed(T, X, tv, T0, T1, h, t0, t1){
  let j = 2;
  if(tv - 2 * h < T0)      j = Math.max(0, Math.min(2, Math.floor((tv - T0) / h)));
  else if(tv + 2 * h > T1) j = Math.max(2, Math.min(4, 4 - Math.floor((T1 - tv) / h)));
  const c = RL_D5[j];
  let s = 0;
  for(let k = 0; k < 5; k++){
    if(c[k] === 0) continue;
    const target = tv + (k - j) * h;
    const t = target <= T0 ? t0 : target >= T1 ? t1 : rlWlInvert(T, target, t0, t1);
    s += c[k] * X(t);
  }
  return s / (12 * h);
}

/* ROUTE B — proper time as the MOVING OBSERVER computes it: invert t′(t) by
   bisection, differentiate x′ against t′ numerically, integrate adaptively in
   t′. No analytic derivative anywhere, and no grid inherited from route A.

   `h` is the stencil's spacing and is the accuracy-limiting choice. The
   textbook balance — truncation h⁴ against round-off ε/h, crossing at
   ε^(1/5) ≈ 7×10⁻⁴ of the span — was tried first and is WRONG HERE by an
   order: swept over five worldlines × eight boosts, the worst-case relative
   gap runs 7×10⁻⁴ → 1.2×10⁻⁶, 2×10⁻⁴ → 1.2×10⁻⁷, **8×10⁻⁵ → 4.8×10⁻⁹**,
   3×10⁻⁵ → 1.4×10⁻⁸, 1×10⁻⁵ → 2.0×10⁻⁸. The round-off term carries |x′| and
   the truncation term carries x⁽⁵⁾, and neither of those is 1. The value below
   is the measured minimum of that curve, not a derivation, and `tests.js`
   sweeps h either side of it so a future change has to beat a number rather
   than an argument.

   AND THE MOVING OBSERVER'S CLOCK IS ILL-CONDITIONED AT LARGE β, which is
   physics rather than numerics: τ′ = ∫√(1 − v′²)dt′ has ∂τ/∂v′ = −γ′v′, so a
   worldline that is near-lightlike in the primed frame amplifies every error
   in dx′/dt′ by γ′. `cond` reports that factor. It is the same catastrophic
   cancellation this wing's tests warn about everywhere else. */
const RL_WL_HREL = 8e-5;                    // measured, not derived — see above
function rlWlTauPrimed(f, t0, t1, beta, tol, hRel, depth){
  const g = relGamma(beta);
  const T = t => g * (t - beta * f(t));
  const X = t => g * (f(t) - beta * t);
  const T0 = T(t0), T1 = T(t1);
  if(!(Number.isFinite(T0) && Number.isFinite(T1) && T1 > T0))
    return { tau:NaN, bad:1, t0p:T0, t1p:T1, h:NaN, calls:0,
             why:'the boosted worldline is not a function of t′ — it must be timelike for that' };
  const span = T1 - T0;
  const h = Math.min(span / 8, (hRel || RL_WL_HREL) * span);
  let bad = 0, calls = 0, cond = 1;
  const integrand = tv => {
    calls++;
    const v = rlWlPrimedSpeed(T, X, tv, T0, T1, h, t0, t1);
    const w = 1 - v * v;
    if(!Number.isFinite(w) || w < 0){ bad++; return 0; }
    const q = Math.sqrt(w);
    if(q > 0 && Math.abs(v) / q > cond) cond = Math.abs(v) / q;
    return q;
  };
  /* maxDepth is deliberately shallow, and this is a measurement rather than a
     guess. The integrand carries the stencil's round-off, so past a point
     adaptive Simpson is refining against noise instead of structure — and it
     will happily do so for ever: at β = −0.999 an unbounded recursion took
     94 532 integrand calls, each five bisections deep, for an answer no better
     than the one 1 124 calls gave. Swept, depth 7 → 9 → 11 costs 72 k → 153 k
     → 417 k calls and moves the worst-case gap by nothing at all. A tolerance
     the routine cannot reach is pure cost. */
  const tau = nqAdaptive(integrand, T0, T1, tol || 1e-10, depth || 7);
  return { tau: bad ? NaN : tau, raw:tau, bad, t0p:T0, t1p:T1, h, calls, cond };
}

/* The same worldline in the moving observer's coordinates, sampled for
   DRAWING. No inversion is needed for this — the events are the events — so
   the picture costs nothing and does not wait on route B. */
function rlWlPrimedTrack(f, t0, t1, beta, n){
  n = Math.max(2, Math.round(n || 240));
  const g = relGamma(beta), h = (t1 - t0) / n;
  const tp = new Float64Array(n + 1), xp = new Float64Array(n + 1);
  for(let i = 0; i <= n; i++){
    const t = t0 + i * h, x = f(t);
    tp[i] = g * (t - beta * x); xp[i] = g * (x - beta * t);
  }
  return { tp, xp, n };
}

/* The inscribed polygon, in whichever frame is asked for. Every chord's
   interval is separately invariant, so this number does not depend on β — and
   it approaches τ from BELOW, at h², because the straight route between two
   events is the longest one. Both facts are measured by the stage. */
function rlWlPolygon(f, t0, t1, n, beta){
  n = Math.max(2, Math.round(n || 400));
  const b = beta || 0, g = relGamma(b), h = (t1 - t0) / n;
  let tau = 0, bad = 0;
  let x0 = f(t0), tp = g * (t0 - b * x0), xq = g * (x0 - b * t0);
  for(let i = 1; i <= n; i++){
    const t = t0 + i * h, x = f(t);
    const T = g * (t - b * x), X = g * (x - b * t);
    const s2 = (T - tp) * (T - tp) - (X - xq) * (X - xq);
    if(!Number.isFinite(s2) || s2 < 0) bad++; else tau += Math.sqrt(s2);
    tp = T; xq = X;
  }
  return { tau, bad, n };
}

/* the stay-at-home: the proper time of the straight worldline between the same
   two events, √(Δt² − Δx²), which is the largest any route between them can be */
function rlWlStraight(dt, dx){
  const s2 = dt * dt - dx * dx;
  return s2 > 0 ? Math.sqrt(s2) : NaN;
}

/* Everything the stage prints, in one call, so that runstagetests can drive the
   whole measurement with synthetic worldlines and the panel and the test can
   never disagree about what was computed. */
/* The `n` this used to take was a leftover from the uniform-grid version of
   route B, and passing it landed in the ADAPTIVE version's `tol` slot — a
   tolerance of 600, which every quadrature meets on its first estimate. The
   engine tests called rlWlTauPrimed directly and passed; the panel called it
   through here and printed 1.7×10⁻⁸ where the engine gives 10⁻¹². Only the
   screenshot saw it. The lesson is not the typo: a two-route check tests the
   route it CALLS, so the wrapper the stage actually uses needs its own row in
   tests.js, and now has one. */
function rlWlMeasure(f, xd, t0, t1, beta){
  const out = { ok:false, why:'', t0, t1, beta };
  if(!(Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0)){
    out.why = 'the worldline needs a stretch of time to run over — set t₁ later than t₀';
    return out;
  }
  if(!(Math.abs(beta) < 1)){
    out.why = 'the observer must move slower than light — |β| < 1';
    return out;
  }
  const sp = rlWlSpeedMax(xd, t0, t1, 2048);
  out.vmax = sp.max; out.vat = sp.at; out.scanBad = sp.bad;
  if(!Number.isFinite(sp.max)){
    out.why = 'x(t) has no slope somewhere on that interval — the worldline is not differentiable there';
    return out;
  }
  if(sp.max >= 1){
    out.why = 'this worldline reaches |dx/dt| = ' + fmtSig(sp.max, 4) + ' at t = ' +
              fmtSig(sp.at, 4) + ', which is at or past the speed of light — nothing with mass ' +
              'can follow it, and proper time is not defined along it';
    return out;
  }
  const A = rlWlTauLab(xd, t0, t1);
  const B = rlWlTauPrimed(f, t0, t1, beta);
  out.tauLab = A.tau; out.badLab = A.bad;
  out.tauP = B.tau;   out.badP = B.bad;   out.primed = B;
  out.gap = Math.abs(A.tau - B.tau);
  const x0 = f(t0), x1 = f(t1);
  out.x0 = x0; out.x1 = x1;
  out.straight = rlWlStraight(t1 - t0, x1 - x0);
  out.deficit = out.straight - A.tau;
  out.polyLab = rlWlPolygon(f, t0, t1, 400, 0).tau;
  out.polyP   = rlWlPolygon(f, t0, t1, 400, beta).tau;
  /* the endpoints' own interval, in both frames — the cheapest invariant there
     is, and the one the event mode of the stage already draws */
  const E0 = relBoost(t0, x0, beta), E1 = relBoost(t1, x1, beta);
  out.s2Lab = relInterval(t1 - t0, x1 - x0);
  out.s2P   = relInterval(E1.t - E0.t, E1.x - E0.x);
  out.t0p = B.t0p; out.t1p = B.t1p;
  out.ok = Number.isFinite(A.tau) && Number.isFinite(B.tau);
  if(!out.ok && !out.why)
    out.why = 'the integral could not be evaluated on ' + (A.bad + B.bad) + ' of its samples';
  return out;
}

/* The presets. `tau` is a CLOSED FORM where one exists and null where none
   does; `vmax` is the largest |ẋ|, which auditclaims recomputes by scanning
   rather than by trusting this column. The hyperbolic one is the important
   entry: 1 − ẋ² = 1/(1 + a²t²) exactly, so τ = asinh(a·t₁)/a and the quadrature
   is pinned against a closed form rather than against the other route only. */
const RL_WORLDLINES = {
  rest:     { name:'stay at home', short:'at rest',
              src:'0*t', ex:'x(t) = 0', t0:0, t1:4,
              vmax:0, tau:4,
              why:'The straight worldline through the origin. Its proper time is the coordinate time, and every other route between the same two events is shorter.' },
  inertial: { name:'straight, 0.6c', short:'inertial',
              src:'0.6*t', ex:'x(t) = 0.6 t', t0:0, t1:4,
              vmax:0.6, tau:3.2,
              why:'Constant speed, so τ = Δt/γ = 4 × 0.8 exactly. This is time dilation with no calculus in it — and note it is still the LONGEST route between ITS OWN two endpoints.' },
  rocket:   { name:'steady acceleration', short:'rocket',
              src:'2*(sqrt(1 + t^2/4) - 1)', ex:'x(t) = 2(√(1 + t²/4) − 1)', t0:0, t1:6,
              vmax:3 / Math.sqrt(10), tau:2 * Math.asinh(3),
              why:'A rocket holding a = 0.5 forever. 1 − ẋ² = 1/(1 + a²t²) exactly, so τ = asinh(a t)/a — a closed form for the quadrature to be measured against, and the hyperbola that never crosses the light cone.' },
  shuttle:  { name:'there and back', short:'shuttle',
              src:'0.6*sin(pi*t/2)', ex:'x(t) = 0.6 sin(πt/2)', t0:0, t1:4,
              vmax:0.3 * Math.PI, tau:null,
              why:'Out, back, out and back again, returning to the starting point at t = 4. The stay-at-home twin ages 4; this one ages less, and the shortfall is the twin paradox with the corners smoothed off.' },
  sprint:   { name:'a very fast start', short:'sprint',
              src:'0.99*tanh(t)', ex:'x(t) = 0.99 tanh t', t0:0, t1:4,
              vmax:0.99, tau:null,
              why:'0.99c at t = 0, coasting to a stop. The integrand starts at √(1 − 0.9801) = 0.141 and climbs to 1, which is the hardest case here for both routes and the reason the acceptance is set by measurement.' }
};
/* ------------------------------------------------------------ boost chains */

/* One boost per line: a β, or an expression for one, optionally repeated with
   ×N. `0.6`, `0.6 x3`, `-0.4 ×2`, `1/2`, `tanh(1)`. Anything after # is a
   comment. A β with |β| ≥ 1 is refused with the physics rather than clamped —
   a chain that silently drops a line teaches the reader that it was accepted. */
function rlChainParse(text, def){
  const steps = [], errs = [];
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if(!line) return;
    const m = line.match(/^(.+?)(?:\s*[x×]\s*(\d+))?$/i);
    if(!m){ errs.push({ line:i + 1, msg:'a β, optionally followed by ×N to repeat it' }); return; }
    const src = m[1].trim();
    const b = mathNum(src);
    const rep = m[2] === undefined ? 1 : parseInt(m[2], 10);
    if(!Number.isFinite(b)){
      errs.push({ line:i + 1, msg:'"' + src + '" is not a number — a β, or an expression for one (1/2, 3/5, tanh(1))' });
      return;
    }
    if(!(Math.abs(b) < 1)){
      errs.push({ line:i + 1, msg:'β = ' + fmtSig(b, 4) + ' — every boost needs |β| < 1, because nothing carrying mass reaches c' });
      return;
    }
    if(!(rep >= 1)){ errs.push({ line:i + 1, msg:'×N needs a whole number of repeats' }); return; }
    if(rep > 400){ errs.push({ line:i + 1, msg:'four hundred repeats of one boost is the most this will take' }); return; }
    steps.push({ beta:b, n:rep, src });
  });
  let total = steps.reduce((s, x) => s + x.n, 0);
  if(total > 800){
    errs.push({ line:0, msg:'eight hundred boosts is the most the chain will take — γ overflows a double long before that anyway' });
    return { steps:(def || []), errs, total:(def || []).reduce((s, x) => s + x.n, 0) };
  }
  if(!steps.length) total = (def || []).reduce((s, x) => s + x.n, 0);
  return { steps: steps.length ? steps : (def || []), errs, total };
}

/* ROUTE A — fold the boosts one at a time with the velocity addition rule, and
   record the running speed so the picture can show it saturating. `satAt` is
   the step at which 1 − |β| reached zero in float64: past that point route A
   has no digits left and the panel must say so instead of printing a residual.
   `steps` may be a chain (with .n) or a flat list; both are accepted, because
   the shuffle produces the second. */
function rlChainCompose(steps){
  let b = 0, k = 0, satAt = 0;
  const track = [0];
  for(const s of steps) for(let j = 0; j < (s.n || 1); j++){
    b = relVelAdd(b, s.beta); k++;
    track.push(b);
    if(!satAt && Math.abs(b) >= 1) satAt = k;
  }
  return { beta:b, track, n:k, satAt };
}

/* ROUTE B — rapidities add. One artanh per distinct line, one tanh at the end;
   the number that grows is exact all the way up and never saturates. */
function rlChainRapidity(steps){
  let phi = 0, gross = 0, k = 0;
  const track = [0];
  for(const s of steps){
    const p = Math.atanh(s.beta);
    for(let j = 0; j < (s.n || 1); j++){ phi += p; gross += Math.abs(p); k++; track.push(phi); }
  }
  return { phi, gross, beta:Math.tanh(phi), gamma:Math.cosh(phi), track, n:k };
}

/* ROUTE C — multiply the matrices. Knows neither formula; it composes the
   linear maps and reads the boost back off the product. `worst` is the largest
   violation of ΛᵀηΛ = η, which is the statement that the composition is still
   a Lorentz transformation — measured on the product rather than assumed. γ
   grows like e^φ, so a long chain overflows a double: `overflowAt` says where,
   and the rapidity route is what still has an answer there. */
function rlChainMatrix(steps){
  let a = 1, b = 0, c = 0, d = 1;                     // Λ = [[a,b],[c,d]]
  let k = 0, overflowAt = 0;
  for(const s of steps) for(let j = 0; j < (s.n || 1); j++){
    const g = relGamma(s.beta), gb = g * s.beta;
    const na = g * a - gb * c, nb = g * b - gb * d;
    const nc = -gb * a + g * c, nd = -gb * b + g * d;
    a = na; b = nb; c = nc; d = nd; k++;
    if(!overflowAt && !(Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && Number.isFinite(d)))
      overflowAt = k;
  }
  /* ΛᵀηΛ − η, and it is meaningless without the scale it is a difference of.
     The entries are γ and γβ, so each of these is a cancellation of terms of
     size γ² — at γ = 3×10¹² one ulp of γ² is 1.6×10⁹ and the residual comes
     out 1, which is not a broken group law but a subtraction with no digits
     left in it. Reported against `scale` = the size of the terms that
     cancelled, which is exactly §2.1's rule. */
  const worst = Math.max(Math.abs(a * a - c * c - 1),
                         Math.abs(a * b - c * d),
                         Math.abs(b * b - d * d + 1));
  return { beta: a === 0 ? NaN : -b / a, gamma:a, det:a * d - b * c,
           worst, scale:Math.max(1, a * a + c * c), n:k, overflowAt,
           L:[[a, b], [c, d]] };
}

/* Collinear boosts commute — the 1+1 Lorentz group is abelian — so the answer
   cannot depend on the order the reader wrote the chain in. A deterministic
   shuffle (same seed, same permutation, so the panel does not flicker) and the
   composition again. In 3+1 with non-collinear boosts this is FALSE and the
   discrepancy is the Wigner rotation; do not carry this helper over. */
function rlChainShuffle(steps, seed){
  const flat = [];
  for(const s of steps) for(let j = 0; j < (s.n || 1); j++) flat.push({ beta:s.beta, n:1 });
  let r = ((seed || 12345) >>> 0) || 12345;
  for(let i = flat.length - 1; i > 0; i--){
    r = (Math.imul(r, 1664525) + 1013904223) >>> 0;
    const j = r % (i + 1);
    const t = flat[i]; flat[i] = flat[j]; flat[j] = t;
  }
  return flat;
}

/* Everything the chain panel prints, in one call. The comparison is made in
   RAPIDITY because that is the variable all three routes still have digits in:
   below the saturation point β is the natural one and above it there is
   nothing left of β at all. `shortfall` is 1 − |β| computed from φ rather than
   from β — 2e^(−2φ)/(1 + e^(−2φ)) — which stays exact to hundreds of decades
   and is what makes "the LHC is 0.999999991c" a number rather than a 1. */
function rlChainMeasure(steps){
  const A = rlChainCompose(steps);
  const B = rlChainRapidity(steps);
  const C = rlChainMatrix(steps);
  const S = rlChainCompose(rlChainShuffle(steps, 20260818));
  const phiA = Math.abs(A.beta) < 1 ? Math.atanh(A.beta) : (A.beta > 0 ? Infinity : -Infinity);
  const e2 = Math.exp(-2 * Math.abs(B.phi));
  return {
    n:A.n, steps,
    betaA:A.beta, track:A.track, satAt:A.satAt,
    phi:B.phi, gross:B.gross, betaB:B.beta, gammaB:B.gamma, phiTrack:B.track,
    betaC:C.beta, gammaC:C.gamma, worstEta:C.worst, etaScale:C.scale, det:C.det,
    overflowAt:C.overflowAt,
    betaShuffled:S.beta,
    phiA, saturated:!Number.isFinite(phiA),
    shortfall: 2 * e2 / (1 + e2),
    gapAB: Math.abs(A.beta - B.beta),
    gapBC: Math.abs(B.beta - C.beta),
    gapShuffle: Math.abs(A.beta - S.beta)
  };
}

/* The presets. `phi` is the total rapidity — exact, Σ n·artanh β — and
   `shortfall` is 1 − |β| from that φ; both are recomputed by auditclaims from
   the text alone. β itself is NOT declared for the long chains, because past
   φ ≈ 19 there is no such double. */
const RL_CHAINS = {
  classic:  { name:'0.75c, six times', text:'0.75 x6',
              phi:6 * Math.atanh(0.75), shortfall:null,
              why:'The chain the stage has always drawn. Six boosts of three-quarters of c, and the result is still under c — as it is for any six, or any six hundred.' },
  halves:   { name:'ten halves', text:'0.5 x10',
              phi:10 * Math.atanh(0.5), shortfall:null,
              why:'Ten boosts of c/2. Galileo would have you at five times the speed of light; the composition law has you at 0.99999977c, and the rapidity is a tidy 5.49.' },
  undo:     { name:'there and back', text:'0.8\n-0.8',
              phi:0, shortfall:1,
              why:'A boost and its inverse. Both routes return exactly zero, which is the one case a residual cannot be scaled against itself — the panel prints it against the gross rapidity that cancelled.' },
  ladder:   { name:'a ladder of ten', text:'0.1\n0.2\n0.3\n0.4\n0.5\n0.6\n0.7\n0.8\n0.9\n0.95',
              phi:[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95].reduce((s, b) => s + Math.atanh(b), 0),
              shortfall:null,
              why:'Ten different boosts, none of them repeated. Order cannot matter — collinear boosts commute — and the panel measures that by composing a shuffle of the same ten.' },
  lhc:      { name:'ten boosts to LHC energy', text:'0.76 x10',
              phi:10 * Math.atanh(0.76), shortfall:null,
              why:'γ ≈ 10 000, which is roughly what the LHC does to a proton. Note what buying that cost: ten boosts, and the last one moved the speed by three parts in ten thousand.' },
  saturate: { name:'past what a double can hold', text:'0.9 x20',
              phi:20 * Math.atanh(0.9), shortfall:null,
              why:'Twenty boosts of 0.9c. The rapidity is 29.4 and the shortfall from c is 5×10⁻²⁶ — far below float64, so the composed β is exactly 1.0 and route A has no answer left. That is not a bug in the arithmetic; it is why nobody quotes a beam speed.' }
};
