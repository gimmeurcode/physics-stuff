/* ============================================================================
   1i · SINGLE-VARIABLE CALCULUS — limits, continuity, and the derivative
   AP Calculus AB/BC units 1–5 and 8: the limit itself, the ε–δ definition,
   continuity and its three failure modes, the intermediate/extreme/mean value
   theorems, the difference quotient, L'Hôpital, linearisation, Newton's method,
   related rates, and the full curve-analysis machinery.

   Everything here is a pure function of a plain f(x), so a stage can hand it a
   compiled expression and get an honest answer rather than a canned one.
   ============================================================================ */

/* ---------------------------------------------------------------- limits ---- */
/* A one-sided limit, estimated by marching in geometrically and watching the
   values settle. Returns the value it converged to and how convincingly. */
function clLimitSide(f, a, side, n){
  const N = n || 26;
  const vals = [];
  for(let i = 0; i < N; i++){
    const h = Math.pow(0.5, i + 1);
    const v = f(a + side * h);
    if(Number.isFinite(v)) vals.push({ h, v });
  }
  if(vals.length < 3) return { value:NaN, settled:false, vals };
  const tail = vals.slice(-6);
  const lo = Math.min(...tail.map(t => t.v)), hi = Math.max(...tail.map(t => t.v));
  const last = vals[vals.length - 1].v;
  /* diverging to infinity is a distinct answer from failing to settle */
  const growing = Math.abs(last) > 1e6 && Math.abs(last) > Math.abs(vals[vals.length - 7] ? vals[vals.length - 7].v : 0) * 4;
  if(growing) return { value:last > 0 ? Infinity : -Infinity, settled:true, vals, infinite:true };
  const spread = hi - lo;
  const scale = Math.max(1e-12, Math.abs(last));
  return { value:last, settled:spread < 1e-6 * Math.max(1, scale), spread, vals };
}
function clLimit(f, a){
  const L = clLimitSide(f, a, -1), R = clLimitSide(f, a, +1);
  const both = L.settled && R.settled && Math.abs(L.value - R.value) < 1e-6 * Math.max(1, Math.abs(R.value));
  const bothInf = L.infinite && R.infinite && Math.sign(L.value) === Math.sign(R.value);
  return {
    left:L, right:R,
    exists: (both && !L.infinite) || bothInf,
    value: bothInf ? L.value : (both ? (L.value + R.value) / 2 : NaN),
    reason: both ? (L.infinite ? 'both sides diverge the same way' : 'both one-sided limits agree')
          : (L.settled && R.settled) ? 'the two one-sided limits disagree — a jump'
          : 'at least one side never settles — it oscillates or diverges'
  };
}
/* the ε–δ game, played honestly: given ε, find the largest δ that works by
   bisecting on "does every x within δ land within ε of L?" */
function clDeltaFor(f, a, L, eps, dmax){
  const ok = d => {
    for(let i = 1; i <= 160; i++){
      const t = i / 160;
      for(const s of [-1, 1]){
        const x = a + s * d * t;
        if(Math.abs(x - a) < 1e-15) continue;
        const v = f(x);
        if(!Number.isFinite(v) || Math.abs(v - L) >= eps) return false;
      }
    }
    return true;
  };
  let lo = 0, hi = dmax || 2;
  if(ok(hi)) return hi;
  for(let i = 0; i < 60; i++){
    const m = (lo + hi) / 2;
    if(ok(m)) lo = m; else hi = m;
  }
  return lo;
}
/* the standard menagerie: one function per way a limit can behave */
const CL_LIMITS = {
  poly:   { name:'f(x) = x² − 1, at x = 2', src:'x^2-1', a:2, hole:false,
    note:'The easy case. f is continuous at 2, so the limit is just f(2) = 3 — and "just substitute" is a <i>theorem</i> about continuous functions rather than the definition of a limit.' },
  hole:   { name:'f(x) = (x²−1)/(x−1), at x = 1', src:'(x^2-1)/(x-1)', a:1, hole:true, fills:2,
    note:'0/0 at x = 1, and yet the limit is a perfectly ordinary 2. The factor (x−1) cancels everywhere <i>except</i> at the point itself, which is exactly what a limit is designed not to care about. This is a <b>removable</b> discontinuity: define f(1) = 2 and the hole closes.' },
  sinc:   { name:'f(x) = sin(x)/x, at x = 0', src:'sin(x)/x', a:0, hole:true, fills:1,
    note:'The limit that makes trigonometric calculus possible: the derivative of sin is cos precisely because this limit is 1. Geometrically it is the statement that a small arc, its chord and its tangent all have the same length in the limit — the squeeze theorem applied between cos x and 1.' },
  jump:   { name:'f(x) = |x|/x, at x = 0', src:'abs(x)/x', a:0, hole:false,
    note:'The one-sided limits are −1 and +1. They exist, they are finite, and they disagree — so no two-sided limit exists. A <b>jump</b> discontinuity, and the reason one-sided limits deserve their own notation.' },
  infinite:{ name:'f(x) = 1/x², at x = 0', src:'1/x^2', a:0, hole:false,
    note:'Both sides run to +∞. Writing "the limit is ∞" is shorthand for "it fails to exist, in this particular describable way" — the function is unbounded near 0, and x = 0 is a <b>vertical asymptote</b>.' },
  oscil:  { name:'f(x) = sin(1/x), at x = 0', src:'sin(1/x)', a:0, hole:false,
    note:'No limit, and not because of a jump or a blow-up: f takes every value in [−1,1] infinitely often in any neighbourhood of 0, however small. Zoom in and the picture never simplifies. This is why "the graph looks like it settles" is not a proof.' },
  squeeze:{ name:'f(x) = x²·sin(1/x), at x = 0', src:'x^2 sin(1/x)', a:0, hole:true, fills:0,
    note:'The same wild oscillation, multiplied by x². Since |f| ≤ x² and x² → 0, the <b>squeeze theorem</b> forces the limit to 0 — the envelope collapses and drags the function with it, no matter how badly it wobbles inside.' },
  expo:   { name:'f(x) = (1+x)^(1/x), at x = 0', src:'(1+x)^(1/x)', a:0, hole:true, fills:Math.E,
    note:'An indeterminate 1^∞ whose limit is <b>e</b> — one of the standard definitions of that number. Every compound-interest and continuous-growth argument in the differential-equations wing traces back here.' },
  jumpdef:{ name:'f(x) = (x²−4)/(x−2), at x = 2', src:'(x^2-4)/(x-2)', a:2, hole:true, fills:4,
    note:'The archetype for the derivative itself: this is the difference quotient of x² at x = 2, and its limit — 4 — is f′(2). Every derivative in the subject is a limit of exactly this shape.' }
};
/* continuity at a point needs all three conditions, and the readout says which fails */
function clContinuity(f, a){
  const fa = f(a), L = clLimit(f, a);
  const defined = Number.isFinite(fa);
  const agrees = defined && L.exists && Math.abs(fa - L.value) < 1e-7 * Math.max(1, Math.abs(fa));
  let kind = 'continuous';
  /* an unbounded f is an infinite discontinuity whether or not the two sides
     agree about which infinity — testing that first keeps 1/x² from being
     misreported as removable merely because both sides diverge the same way */
  if(L.left.infinite || L.right.infinite) kind = 'infinite discontinuity';
  else if(!L.exists){
    if(L.left.settled && L.right.settled) kind = 'jump discontinuity';
    else kind = 'essential (oscillating) discontinuity';
  } else if(!defined) kind = 'removable discontinuity — the limit exists but f does not';
  else if(!agrees) kind = 'removable discontinuity — f is defined but at the wrong value';
  return { fa, defined, limit:L, agrees, kind, continuous:defined && L.exists && agrees };
}

/* ------------------------------------------------- the three value theorems ---- */
/* IVT: a continuous f on [a,b] hits every value between f(a) and f(b). The
   witness is found by bisection, so the theorem is demonstrated not asserted. */
function clIVT(f, a, b, target){
  const g = x => f(x) - target;
  const fa = g(a), fb = g(b);
  if(!(fa * fb <= 0)) return { applies:false, c:NaN };
  return { applies:true, c:nqBisect(g, a, b, 1e-13), fa:f(a), fb:f(b), target };
}
/* EVT: a continuous f on a closed bounded interval attains a max and a min */
function clEVT(f, a, b, n){
  const N = n || 4000;
  let lo = Infinity, hi = -Infinity, xlo = a, xhi = a;
  for(let i = 0; i <= N; i++){
    const x = a + (b - a) * i / N, v = f(x);
    if(!Number.isFinite(v)) continue;
    if(v < lo){ lo = v; xlo = x; }
    if(v > hi){ hi = v; xhi = x; }
  }
  return { min:lo, argmin:xlo, max:hi, argmax:xhi };
}
/* MVT: some interior c has f′(c) equal to the average rate of change.
   Rolle is the special case f(a) = f(b). */
function clMVT(f, df, a, b){
  const slope = (f(b) - f(a)) / (b - a);
  const cs = nqRoots(x => df(x) - slope, a + 1e-9, b - 1e-9, 900, 1e-13);
  return { slope, cs, rolle:Math.abs(f(b) - f(a)) < 1e-12 };
}

/* ------------------------------------------------- derivatives, in the small ---- */
/* the difference quotient at a fixed h — what the secant line actually is */
const clSecant = (f, a, h) => (f(a + h) - f(a)) / h;
const clSymDiff = (f, a, h) => (f(a + h) - f(a - h)) / (2 * h);
/* the derivative as the limit of secants, with the convergence exposed */
function clDerivLimit(f, a, n){
  const out = [];
  for(let i = 1; i <= (n || 20); i++){
    const h = Math.pow(0.5, i);
    out.push({ h, fwd:clSecant(f, a, h), back:clSecant(f, a, -h), sym:clSymDiff(f, a, h) });
  }
  return out;
}
/* L'Hôpital: only legal on 0/0 or ∞/∞, and the check is part of the answer */
function clLHopital(num, den, dnum, dden, a){
  const n0 = num(a), d0 = den(a);
  const zeroZero = Math.abs(n0) < 1e-8 && Math.abs(d0) < 1e-8;
  const infInf = !Number.isFinite(n0) && !Number.isFinite(d0);
  const naive = n0 / d0;
  const ratio = dnum(a) / dden(a);
  const numeric = clLimit(x => num(x) / den(x), a);
  return { form: zeroZero ? '0/0' : infInf ? '∞/∞' : 'neither — the rule does not apply',
           legal: zeroZero || infInf, naive, ratio, numeric:numeric.value, exists:numeric.exists };
}
/* linearisation, and the error it leaves — which must be O(h²) */
function clLinear(f, df, a){
  const f0 = f(a), m = df(a);
  return { f0, m, L:x => f0 + m * (x - a),
           err:h => Math.abs(f(a + h) - (f0 + m * h)) };
}
/* Newton's method, with the whole orbit kept so the stage can draw it */
function clNewton(f, df, x0, n){
  const path = [x0];
  let x = x0;
  for(let i = 0; i < (n || 12); i++){
    const d = df(x);
    if(!Number.isFinite(d) || Math.abs(d) < 1e-15) break;
    x = x - f(x) / d;
    if(!Number.isFinite(x)) break;
    path.push(x);
  }
  /* the residual carries the scale it is read against: the largest |f| the
     iteration actually saw. |f(root)| = 1e-8 means the root is found when the
     search began at |f| ~ 1, and means nothing at all when it began at 1e-8. */
  let scale = 0;
  for(const p of path){ const v = Math.abs(f(p)); if(Number.isFinite(v)) scale = Math.max(scale, v); }
  return { path, root:x, residual:Math.abs(f(x)), residScale:scale };
}

/* ------------------------------------------------------- curve analysis ------ */
/* Everything the "sketch the curve" question asks for, found by search on the
   symbolic derivatives rather than supplied. */
function clAnalyse(F, a, b){
  const crit = nqRoots(F.d1, a, b, 1400, 1e-13);
  const infl = nqRoots(F.d2, a, b, 1400, 1e-13);
  const zeros = nqRoots(F.f, a, b, 1400, 1e-13);
  const pts = crit.map(x => {
    const s = F.d2(x);
    return { x, y:F.f(x),
      kind: Math.abs(s) < 1e-7 ? 'undecided by the second derivative'
          : s > 0 ? 'local minimum' : 'local maximum', d2:s };
  });
  /* inflections need a genuine sign change in f″, not merely a zero */
  const inf = infl.filter(x => {
    const h = Math.max(1e-4, (b - a) * 1e-4);
    return F.d2(x - h) * F.d2(x + h) < 0;
  }).map(x => ({ x, y:F.f(x) }));
  const E = clEVT(F.f, a, b, 3000);
  return { crit:pts, infl:inf, zeros, extremes:E,
    increasing:clSignRuns(F.d1, a, b), concaveUp:clSignRuns(F.d2, a, b) };
}
/* the intervals on which g is positive — how "increasing on…" is actually found */
function clSignRuns(g, a, b, n){
  const N = n || 900, out = [];
  let start = null, prev = null;
  for(let i = 0; i <= N; i++){
    const x = a + (b - a) * i / N, v = g(x);
    const pos = Number.isFinite(v) ? v > 0 : null;
    if(pos !== prev){
      if(prev === true && start !== null) out.push([start, x]);
      if(pos === true) start = x;
      prev = pos;
    }
  }
  if(prev === true && start !== null) out.push([start, b]);
  return out;
}
/* asymptotes: vertical where f blows up, horizontal from the limits at ±∞,
   and slant from the leading behaviour of f(x)/x */
function clAsymptotes(f, a, b){
  const vert = [];
  const N = 1400;
  let prev = f(a);
  for(let i = 1; i <= N; i++){
    const x = a + (b - a) * i / N, v = f(x);
    if(Number.isFinite(prev) && Number.isFinite(v) && Math.abs(v - prev) > 1e3 * (1 + Math.abs(prev))){
      /* a huge jump between neighbouring samples: refine to the blow-up */
      let lo = a + (b - a) * (i - 1) / N, hi = x;
      for(let k = 0; k < 40; k++){
        const m = (lo + hi) / 2;
        if(Math.abs(f(m)) > 1e6) { hi = m; lo = m; break; }
        if(Math.abs(f(m)) > Math.abs(f(lo))) lo = m; else hi = m;
      }
      vert.push((lo + hi) / 2);
    }
    prev = v;
  }
  const at = X => { const v = f(X); return Number.isFinite(v) ? v : NaN; };
  const hR = at(1e7), hL = at(-1e7);
  const mR = (at(1e7) - at(1e7 - 1)) ;
  return {
    vertical:vert.filter((x, i, arr) => arr.findIndex(y => Math.abs(y - x) < 1e-6) === i),
    horizRight:Number.isFinite(hR) && Math.abs(hR) < 1e8 ? hR : NaN,
    horizLeft:Number.isFinite(hL) && Math.abs(hL) < 1e8 ? hL : NaN,
    slantSlope:Number.isFinite(mR) && Math.abs(mR) < 1e8 ? mR : NaN
  };
}

/* ------------------------------------- implicit and inverse derivatives ------
   Two techniques with one idea underneath: differentiate a relation you cannot
   solve. That makes the two-route check the natural shape of the subject —

     ROUTE A (the technique)  dy/dx = −F_x/F_y, from the SYMBOLIC partials;
                              (f⁻¹)′(b) = 1/f′(a), from the symbolic f′.
     ROUTE B (the definition) solve the relation itself at x ± h by bisection
                              and take the symmetric secant. No derivative of
                              any kind is taken; only F is ever evaluated.

   Route B is the definition of the derivative applied to a curve nobody
   solved for y, so agreement is evidence that the implicit rule is the chain
   rule and not a mnemonic. Its error is the secant's own O(h²), which
   clImplicitOrder measures by halving h rather than asserting.

   Every one of these returns a REASON rather than throwing or emitting NaN:
   a vertical tangent is a fact about the curve (F_y = 0), not a failure. */

/* the branch of F(x, ·) = 0 nearest y0, by bisection outward from y0 —
   root-finding on the relation, never on a derivative */
function clBranchY(F, x, y0, span, n){
  const N = n || 96, R = span || 0.5;
  const g = y => F(x, y);
  const g0 = g(y0);
  if(!Number.isFinite(g0)) return null;
  if(g0 === 0) return y0;
  /* walk outward in both directions at once and take the first sign change,
     so a branch that curves either way is found without preferring one */
  let prevUp = g0, prevDn = g0;
  for(let i = 1; i <= N; i++){
    const d = R * i / N;
    const up = g(y0 + d), dn = g(y0 - d);
    let lo = null, hi = null;
    if(Number.isFinite(up) && up * prevUp < 0){ lo = y0 + R * (i - 1) / N; hi = y0 + d; }
    else if(Number.isFinite(dn) && dn * prevDn < 0){ lo = y0 - d; hi = y0 - R * (i - 1) / N; }
    if(lo !== null){
      let a = lo, b = hi, fa = g(a);
      for(let k = 0; k < 80; k++){
        const m = 0.5 * (a + b), fm = g(m);
        if(fm === 0){ a = b = m; break; }
        if(fa * fm < 0) b = m; else { a = m; fa = fm; }
        if(Math.abs(b - a) < 1e-14 * Math.max(1, Math.abs(m))) break;
      }
      return 0.5 * (a + b);
    }
    if(Number.isFinite(up)) prevUp = up;
    if(Number.isFinite(dn)) prevDn = dn;
  }
  /* No sign change — but the curve may still be here, TOUCHED rather than
     crossed. At the side of the circle x = 2 the relation is F = y², a double
     root: |F| dips to zero without ever changing sign, so a bracket-only
     search reports "not on the curve" at exactly the point the vertical
     tangent lives. That is the one x the reader is told to slide to.
     So: find the y minimising |F| and accept it only if |F| there is
     negligible against the scale |F| actually takes over the scan — a genuine
     touch — which keeps x just OUTSIDE the curve rejected, where |F| bottoms
     out at a real positive number. */
  let ymin = y0, amin = Infinity, amax = 0;
  for(let i = 0; i <= N; i++){
    const d = R * (2 * i / N - 1);
    const v = Math.abs(g(y0 + d));
    if(!Number.isFinite(v)) continue;
    if(v > amax) amax = v;
    if(v < amin){ amin = v; ymin = y0 + d; }
  }
  if(!Number.isFinite(amin)) return null;
  /* ternary search on |F| to place the touch properly */
  let lo2 = ymin - 2 * R / N, hi2 = ymin + 2 * R / N;
  for(let k = 0; k < 90; k++){
    const m1 = lo2 + (hi2 - lo2) / 3, m2 = hi2 - (hi2 - lo2) / 3;
    if(Math.abs(g(m1)) < Math.abs(g(m2))) hi2 = m2; else lo2 = m1;
  }
  const yt = 0.5 * (lo2 + hi2), at = Math.abs(g(yt));
  return at <= 1e-9 * (amax + 1) ? yt : null;
}
/* ROUTE A: the implicit rule. `F` is an mvCompile'd object (f, fx, fy). */
function clImplicitSlope(F, x, y){
  const fx = F.fx(x, y), fy = F.fy(x, y);
  if(!Number.isFinite(fx) || !Number.isFinite(fy))
    return { ok:false, why:'the relation is not differentiable here' };
  const scale = Math.hypot(fx, fy);
  if(scale < 1e-12)
    return { ok:false, why:'both partials vanish — a singular point of the curve, where it may cross itself and have no single tangent', fx, fy };
  /* The threshold is √ε, not ε, and that is a statement about how well the
     POINT can be known rather than a fudge. Where the curve is tangent to a
     vertical line, F has a double root in y — F = y² at the side of the
     circle — so |F| is flat there and no method locates y better than √ε.
     A residual F_y of 4×10⁻⁸ at such a point is that limit, not information,
     and turning it into "the slope is −9.5×10⁷" would be false precision
     about a tangent that is vertical. Above this the slope is genuinely
     steep and is printed: at x = 1.9999 the circle gives −100, honestly. */
  if(Math.abs(fy) < 1e-7 * scale)
    return { ok:false, vertical:true, why:'vertical tangent — ∂F/∂y = 0, so dy/dx is not defined there (but dx/dy = 0 is)', fx, fy };
  return { ok:true, m: -fx / fy, fx, fy };
}
/* ROUTE B: the secant of the branch itself, found by bisection on F. */
function clImplicitSecant(F, x, y, h, span){
  const H = h || 1e-3;
  const yp = clBranchY(F.f, x + H, y, span), ym = clBranchY(F.f, x - H, y, span);
  if(yp === null || ym === null)
    return { ok:false, why:'the branch leaves the search band within h — the curve turns back on itself here' };
  return { ok:true, m:(yp - ym) / (2 * H), yp, ym, h:H };
}
/* the secant's order, MEASURED by halving h (J9's rule, never asserted) */
function clImplicitOrder(F, x, y, h0){
  const A = clImplicitSlope(F, x, y);
  if(!A.ok) return null;
  const H = h0 || 4e-2;
  const e = k => {
    const B = clImplicitSecant(F, x, y, H / k);
    return B.ok ? Math.abs(B.m - A.m) : NaN;
  };
  const e1 = e(1), e2 = e(2), e4 = e(4);
  return { e1, e2, e4, r1:e1 / e2, r2:e2 / e4 };
}
/* The inverse function's derivative, both ways. `f` and `df` are plain
   functions of one variable; a = the point, b = f(a). */
function clInverseAt(f, df, a, lo, hi, hOpt){
  const b = f(a), d = df(a);
  if(!Number.isFinite(b)) return { ok:false, why:'f is not defined there' };
  if(!Number.isFinite(d) || d === 0)
    return { ok:false, why:'f′(a) = 0, so the inverse has a vertical tangent at that height — its slope is not defined', b, d };
  /* route B: invert f numerically at b ± h and take the secant. Bisection on
     f(x) − target over the bracket the caller says f is monotone on, so the
     inverse is never differentiated and never symbolically inverted. */
  const solve = target => {
    let a0 = lo, b0 = hi, fa = f(a0) - target;
    if(!Number.isFinite(fa) || fa * (f(b0) - target) > 0) return null;
    for(let k = 0; k < 90; k++){
      const m = 0.5 * (a0 + b0), fm = f(m) - target;
      if(fm === 0) return m;
      if(fa * fm < 0) b0 = m; else { a0 = m; fa = fm; }
      if(Math.abs(b0 - a0) < 1e-14 * Math.max(1, Math.abs(m))) break;
    }
    return 0.5 * (a0 + b0);
  };
  const h = hOpt || 1e-3 * Math.max(1e-3, Math.abs(b));
  /* The symmetric secant on the numerically inverted f is second order —
     measured, not assumed: the h-sweep 1.37e-8, 3.42e-9, 8.61e-10, 2.21e-10
     is 4.00, 3.97, 3.89. Since p = 2 is known, Richardson over h and h/2
     removes it and the two routes then agree to ~1e-11, which is bisection's
     own floor rather than the technique's. `raw` keeps the un-extrapolated
     value so a test can still see the order. */
  const sec = H => {
    const xp = solve(b + H), xm = solve(b - H);
    return (xp === null || xm === null) ? null : (xp - xm) / (2 * H);
  };
  const s1 = sec(h), s2 = sec(h / 2);
  const num = (s1 === null || s2 === null) ? s2 : (4 * s2 - s1) / 3;
  return { ok:true, b, d, sym:1 / d, num, raw:s1, h };
}

/* ------------------------------------------------------- related rates ------- */
/* Each scenario is a constraint plus one known rate; the answer is the chain
   rule solved for the other rate, and the lab also measures it by finite
   difference on the constraint so the two can be compared. */
const CL_RATES = {
  ladder: { name:'The sliding ladder', L:5, given:'dx/dt = 0.6 m/s',
    rel:'<i>x</i>² <span class="op">+</span> <i>y</i>² <span class="op">=</span> <i>L</i>²',
    /* x² + y² = L², so x·x′ + y·y′ = 0 */
    state:(x, L) => ({ x, y:Math.sqrt(Math.max(0, L * L - x * x)) }),
    rate:(x, L, xd) => ({ yd: -x * xd / Math.sqrt(Math.max(1e-9, L * L - x * x)) }),
    note:'A ladder slides down a wall at a constant horizontal speed. Differentiating <b>x² + y² = L²</b> gives <b>x x′ + y y′ = 0</b>, so <b>y′ = −x x′ / y</b> — which runs to −∞ as the top nears the ground. The model breaks before the ladder does: no real ladder is a rigid massless rod, and the infinite speed is the mathematics complaining about the idealisation.' },
  cone: { name:'Filling a conical tank', R:2, H:4, given:'dV/dt = 2 m³/s',
    rel:'<i>V</i> <span class="op">=</span> π<i>R</i>²<i>h</i>³ / 3<i>H</i>² &nbsp; (after <i>r</i> = <i>Rh</i>/<i>H</i>)',
    state:(h, R, H) => ({ r:R * h / H, V:Math.PI * (R * h / H) * (R * h / H) * h / 3 }),
    rate:(h, R, H, Vd) => ({ hd: Vd / (Math.PI * (R * h / H) * (R * h / H)) }),
    note:'Similar triangles fix <b>r = Rh/H</b>, so V = πR²h³/3H² depends on h alone. Then <b>dV/dt = (πR²h²/H²)·dh/dt</b>, and the water level rises ever more slowly as the cone widens — the rate goes as 1/h².' },
  balloon: { name:'Inflating a balloon', given:'dV/dt = 4 cm³/s',
    rel:'<i>V</i> <span class="op">=</span> 4π<i>r</i>³ / 3',
    state:(r) => ({ r, V:4 * Math.PI * r * r * r / 3, A:4 * Math.PI * r * r }),
    rate:(r, _a, _b, Vd) => ({ rd:Vd / (4 * Math.PI * r * r), Ad:2 * Vd / r }),
    note:'<b>dV/dt = 4πr²·dr/dt</b>: the surface area appears because that is precisely what dV/dr is. Pumping at a constant volumetric rate makes the radius grow ever more slowly, as 1/r².' },
  shadow: { name:'Walking away from a lamp', H:6, h:1.8, given:'dx/dt = 1.4 m/s',
    rel:'<i>s</i> <span class="op">=</span> <i>xh</i> / (<i>H</i> − <i>h</i>) &nbsp; (similar triangles)',
    state:(x, H, h) => ({ x, s:x * h / (H - h), tip:x * H / (H - h) }),
    rate:(x, H, h, xd) => ({ sd:xd * h / (H - h), tipd:xd * H / (H - h) }),
    note:'Similar triangles again, and the surprise is that the shadow\'s length grows at a <i>constant</i> rate independent of where you are — as does the tip, but faster. Nothing accelerates; the geometry is linear.' }
};
