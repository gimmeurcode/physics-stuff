/* ============================================================================
   1g′ · EXISTENCE AND UNIQUENESS FOR y′ = F(x, y)
   Syllabus gap B4 (MASTER-PLAN §3.2). Every other ODE module here SOLVES an
   equation. This one asks the prior question — is there a solution at all, is
   there only one, and how far does it reach — and answers it by construction
   rather than by citing a theorem.

   The three constructions, each of which is a proof:

     PICARD ITERATION   y_(n+1)(x) = y₀ + ∫ F(t, y_n(t)) dt.  A Lipschitz F
                        makes this a contraction, so the iterates converge and
                        the limit is the unique solution.  odPicardRun runs it
                        on a grid; odPicardBound is the classical estimate
                        M·Lⁿ·h^(n+1)/(n+1)!, PRINTED BESIDE the measured
                        successive gap rather than instead of it.
     EULER POLYGONS     the same existence, needing only continuity (Peano).
                        The polygons converge; odOrderRef measures how fast.
     THE VARIATIONAL    ∂y(x₁)/∂y₀ solves v′ = F_y·v.  It is the exact
     EQUATION           amplification of a perturbation, so the ratio measured
                        by perturbing the initial value must converge to it —
                        and does not, when F is not Lipschitz.

   WHAT IS MEASURED, NEVER ASSERTED
     · the Lipschitz constant, by scanning difference quotients at FIVE
       neighbourhood sizes.  A constant that keeps growing as the neighbourhood
       shrinks is the honest signature of "no Lipschitz constant exists", and
       it is the only way to detect it numerically — a single δ always returns
       a finite number.
     · the guaranteed interval h = min(a, b/M), from M measured on the box.
     · the escape time, TWICE: by marching the equation in x, and by
       integrating dx/dy = 1/F in y.  The two share nothing.

   Prefix: od (shared with 26-odes.js — grep case-sensitively before adding).
   ============================================================================ */

/* --------------------------------------------------------- the rectangle ---- */
/* M = max|F| on R = {|x−x₀| ≤ a, |y−y₀| ≤ b}. This is the number that decides
   how far the theorem reaches: a solution leaving the box escapes the region
   where F was ever bounded, and nothing can be promised past that. */
function odFieldM(F, x0, y0, a, b, n){
  const N = Math.max(4, Math.round(n || 40));
  let M = 0, ok = false;
  for(let i = 0; i <= N; i++){
    const x = x0 - a + 2 * a * i / N;
    for(let j = 0; j <= N; j++){
      const v = F(x, y0 - b + 2 * b * j / N);
      if(Number.isFinite(v)){ M = Math.max(M, Math.abs(v)); ok = true; }
    }
  }
  return ok ? M : NaN;
}
/* Picard–Lindelöf's guaranteed half-interval. Two things can stop the promise:
   running out of x (a), or the solution running out of y before it does (b/M).
   The theorem takes whichever comes first, and that is the whole content of it
   being a LOCAL statement. */
const odPicardH = (M, a, b) => (Number.isFinite(M) && M > 0) ? Math.min(a, b / M) : a;

/* --------------------------------------------------- the Lipschitz scan ----- */
/* sup |F(x,y₂) − F(x,y₁)| / |y₂ − y₁| over the rectangle, at a LADDER of
   separations δ. One δ is worthless: every field returns a finite number for
   it, including y^(2/3), whose quotient is 3δ^(−1/3) and therefore looks like
   a perfectly good Lipschitz constant of 21 at δ = 0.003.

   Shrinking δ is what separates the two cases. For a C¹ field the quotient
   converges upward to sup|∂F/∂y|; for a field with a vertical tangent in y it
   grows without bound, and the RATIO between consecutive rows is the evidence.

   `ny` is forced even so that y = y₀ is a sample point — the worst pair for a
   field even in y (3·∛y², say) straddles nothing and starts exactly there. */
function odLipScan(F, x0, y0, a, b, deltas, nx, ny){
  const NX = Math.max(2, Math.round(nx || 24));
  const NY = 2 * Math.max(1, Math.round((ny || 24) / 2));
  const ds = deltas || [b / 2, b / 8, b / 32, b / 128, b / 512];
  const rows = [];
  for(const d of ds){
    if(!(d > 0)) continue;
    let L = 0, ax = NaN, ay = NaN, seen = false;
    for(let i = 0; i <= NX; i++){
      const x = x0 - a + 2 * a * i / NX;
      for(let j = 0; j <= NY; j++){
        const y1 = y0 - b + 2 * b * j / NY, y2 = y1 + d;
        if(y2 > y0 + b + 1e-12 * (1 + Math.abs(b))) continue;
        const f1 = F(x, y1), f2 = F(x, y2);
        if(!Number.isFinite(f1) || !Number.isFinite(f2)) continue;
        seen = true;
        const q = Math.abs(f2 - f1) / d;
        if(q > L){ L = q; ax = x; ay = y1; }
      }
    }
    rows.push({ d, L: seen ? L : NaN, x:ax, y:ay });
  }
  const n = rows.length;
  const L = n ? rows[n - 1].L : NaN, prev = n > 1 ? rows[n - 2].L : NaN;
  /* A field with no y in it at all gives an identically zero ladder, and 0/0 is
     not a divergence — it is the strongest possible Lipschitz condition. */
  const scale = Math.max(Number.isFinite(L) ? L : 0, Number.isFinite(prev) ? prev : 0);
  const ratio = scale > 1e-12 ? L / Math.max(1e-300, prev) : 1;
  /* The threshold sits between two MEASURED populations, not at a round number
     picked for looking reasonable. Over the ten presets the convergent cases
     reach a last ratio of at most 1.0059 (`circle`, whose quotient 1/(y₁y₂)
     approaches its sup from below), while the divergent one is 1.5874 —
     exactly 4^(1/3), because quartering δ multiplies 3δ^(−1/3) by ∛4 forever.
     1.05 is an order of magnitude clear of the first and half an order clear of
     the second. A field that converged more slowly than any of these would be
     reported as non-Lipschitz, which is why the panel prints the whole ladder
     and not only the verdict. */
  return { rows, L, prev, ratio, lip: Number.isFinite(L) && Number.isFinite(ratio) && ratio < 1.05 };
}

/* ------------------------------------------------------ Picard iteration ---- */
/* The cumulative integral of a sampled function, from the centre outwards, to
   fourth order — because the iteration error we are trying to SEE falls like
   h^(n+1)/(n+1)! and reaches 1e−10 by the twelfth iterate. A cumulative
   trapezoid would floor the measurement at its own 1e−5 and every later
   iterate would look identical.

   Composite Simpson advances two nodes at a time, so the even-indexed and
   odd-indexed nodes form two chains. The odd chain is seeded by one
   Adams–Moulton step over a single interval, whose local error is h⁴f‴/24 —
   at h ≈ 0.005 that is a constant 1e−11 offset between the chains, well under
   everything being measured. */
function odCumSimpson(f, hh, c){
  const M = f.length, Y = new Float64Array(M);
  if(!(M > 2) || !(c >= 0) || c >= M) return Y;
  Y[c] = 0;
  if(c + 1 < M){
    Y[c + 1] = (c - 1 >= 0)
      ? hh / 12 * (-f[c - 1] + 8 * f[c] + 5 * f[c + 1])
      : hh / 12 * (5 * f[c] + 8 * f[c + 1] - f[c + 2]);
    for(let j = c + 2; j < M; j++) Y[j] = Y[j - 2] + hh / 3 * (f[j - 2] + 4 * f[j - 1] + f[j]);
  }
  if(c - 1 >= 0){
    Y[c - 1] = (c + 1 < M)
      ? -hh / 12 * (5 * f[c - 1] + 8 * f[c] - f[c + 1])
      : -hh / 12 * (-f[c - 2] + 8 * f[c - 1] + 5 * f[c]);
    for(let j = c - 2; j >= 0; j--) Y[j] = Y[j + 2] - hh / 3 * (f[j + 2] + 4 * f[j + 1] + f[j]);
  }
  return Y;
}
const odSupAbs = u => { let m = 0; for(let i = 0; i < u.length; i++) if(Number.isFinite(u[i])) m = Math.max(m, Math.abs(u[i])); return m; };
const odSupGap = (u, v) => { let m = 0; for(let i = 0; i < u.length; i++){ const d = Math.abs(u[i] - v[i]); if(Number.isFinite(d)) m = Math.max(m, d); } return m; };

/* y₀(x) ≡ y₀, then y_(n+1)(x) = y₀ + ∫ F(t, y_n(t)) dt, on a symmetric grid of
   2K+1 nodes spanning [x₀−h, x₀+h]. Because the iterate is stored AT the nodes
   the next integrand needs no interpolation at all — F is evaluated on exactly
   the points the previous iterate holds. */
function odPicardRun(F, x0, y0, h, N, K){
  K = Math.max(4, Math.round(K || 200));
  N = Math.max(1, Math.round(N === undefined ? 8 : N));
  const M = 2 * K + 1, c = K, hh = h / K;
  const xs = new Float64Array(M);
  for(let j = 0; j < M; j++) xs[j] = x0 + (j - c) * hh;
  let prev = new Float64Array(M); prev.fill(y0);
  const iters = [prev], steps = [], f = new Float64Array(M);
  for(let n = 0; n < N; n++){
    let bad = false;
    for(let j = 0; j < M; j++){
      const v = F(xs[j], prev[j]);
      if(Number.isFinite(v)) f[j] = v; else { f[j] = 0; bad = true; }
    }
    const Y = odCumSimpson(f, hh, c);
    const next = new Float64Array(M);
    for(let j = 0; j < M; j++) next[j] = y0 + Y[j];
    steps.push({ n, gap:odSupGap(next, prev), bad });
    iters.push(next); prev = next;
  }
  return { xs, iters, steps, c, hh, h, K };
}
/* The classical estimate on the nth successive difference:
   sup|y_(n+1) − y_n| ≤ M·Lⁿ·h^(n+1)/(n+1)!.  Built as a running product so a
   large n cannot overflow a factorial before dividing by it. */
function odPicardBound(M, L, h, n){
  let t = M * h;
  for(let k = 1; k <= n; k++) t *= L * h / (k + 1);
  return t;
}

/* --------------------------------------------- the independent reference ---- */
/* RK4 from (x, y) to x1 in n steps — the route that shares nothing with Picard:
   one marches a fixed-point iteration on an integral equation, the other takes
   local Taylor information and never looks back. */
function odStepTo(F, x, y, x1, n){
  const N = Math.max(1, Math.round(n || 1)), h = (x1 - x) / N;
  for(let i = 0; i < N; i++){
    const k1 = F(x, y);
    const k2 = F(x + h / 2, y + h / 2 * k1);
    const k3 = F(x + h / 2, y + h / 2 * k2);
    const k4 = F(x + h, y + h * k3);
    y += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    x += h;
    if(!Number.isFinite(y)) return y;
  }
  return y;
}
/* the same solution sampled on the Picard grid, so the two can be differenced
   node by node rather than at one convenient point */
function odRefRun(F, x0, y0, xs, c, sub){
  const M = xs.length, y = new Float64Array(M), S = Math.max(1, Math.round(sub || 8));
  y[c] = y0;
  let cur = y0;
  for(let j = c; j + 1 < M; j++){ cur = odStepTo(F, xs[j], cur, xs[j + 1], S); y[j + 1] = cur; }
  cur = y0;
  for(let j = c; j - 1 >= 0; j--){ cur = odStepTo(F, xs[j], cur, xs[j - 1], S); y[j - 1] = cur; }
  return y;
}
/* the observed order of a stepper against a reference the caller supplies —
   odStepOrder needs a closed form, and most fields worth asking this of do not
   have one. Two halvings, so the ratio itself can be checked for consistency. */
function odOrderRef(method, F, x0, y0, x1, n, ref){
  const e = k => {
    const r = method(F, x0, y0, (x1 - x0) / k, k);
    return Math.abs(r.final - ref);
  };
  const e1 = e(n), e2 = e(2 * n), e4 = e(4 * n);
  return { e1, e2, e4,
    p1:(e1 > 0 && e2 > 0) ? Math.log2(e1 / e2) : NaN,
    p2:(e2 > 0 && e4 > 0) ? Math.log2(e2 / e4) : NaN };
}

/* ------------------------------------------------- how far the solution goes -- */
/* Route A: march the equation in x with a relative step, until |y| passes a
   level. A fixed step cannot do this — near a pole the solution doubles inside
   one step and the run ends in Infinity at a meaningless x.

   THIS MEASURES ONE OF THE TWO WAYS A SOLUTION STOPS EXISTING, AND THE CALLER
   MUST NOT CLAIM THE OTHER.  y′ = 1 + y² runs off to infinity at π/2 and this
   finds it. y′ = −x/y reaches the x-axis with a vertical tangent, where y is
   finite and it is the SLOPE that is not — and a marching integrator does not
   notice: measured, it steps straight through y = 0 and continues onto the
   lower branch, reaching x = 40 with y = 17.99 and reporting nothing wrong.
   The true solution √(4−x²) ceased to exist at x = 2.

   A `stalled` outcome was written for that case, on the reasoning that the step
   control would drive h below its floor as |F| diverged. It was then measured
   and **never fired** — not on any preset, and not on a field built to trigger
   it (F = 1/√(1−x), whose slope diverges at x = 1 while y tends to 2): h shrinks
   in proportion to 1/|F|, so the loop always meets an infinite F or the cap
   first. The branch is gone rather than left in unexercised. What replaces it is
   a sentence: `escaped:false` means no blow-up was found *along the path
   marched*, which is not the same as the solution existing there. */
function odEscape(F, x0, y0, dir, cap, xmax, sub){
  const D = dir >= 0 ? 1 : -1;
  const CAP = cap || 1e6, XM = (xmax === undefined ? 20 : xmax), S = sub || 4;
  const hmax = XM / 200, hmin = 1e-13;
  let x = x0, y = y0, steps = 0;
  while(steps++ < 200000){
    const f = F(x, y);
    if(!Number.isFinite(f)) return { x, y, escaped:false, steps, why:'the field is not defined there' };
    const s = Math.abs(f);
    let h = s > 0 ? 0.02 * Math.max(1, Math.abs(y)) / s : hmax;
    h = Math.min(h, hmax);
    if(!(h > hmin)) return { x, y, escaped:true, steps };
    const nx = x + D * h;
    if(Math.abs(nx - x0) > XM) return { x:x0 + D * XM, y, escaped:false, steps };
    y = odStepTo(F, x, y, nx, S); x = nx;
    if(!Number.isFinite(y)) return { x, y, escaped:true, steps };
    if(Math.abs(y) >= CAP) return { x, y, escaped:true, steps };
  }
  return { x, y, escaped:false, steps, why:'step budget exhausted' };
}
/* Route B, for an autonomous field: separate the variables and integrate in y
   instead. x(Y) − x₀ = ∫ dy/F(y), the same number reached without ever taking
   a step in x. The substitution y = y₀ + u/(1−u) compresses a range of 10⁶
   into [0, T] with an O(1) integrand, so the quadrature meets a smooth
   problem rather than a spike at one end of a huge interval. */
function odEscapeQuad(F, x0, y0, Y, xref){
  const xr = xref === undefined ? x0 : xref, d = Y - y0;
  if(!(Math.abs(d) > 0)) return NaN;
  const s = d > 0 ? 1 : -1, m = Math.abs(d), T = m / (1 + m);
  const I = nqAdaptive(u => {
    const w = 1 - u;
    if(!(w > 0)) return 0;
    const f = F(xr, y0 + s * u / w);
    return (Number.isFinite(f) && f !== 0) ? s / (f * w * w) : 0;
  }, 0, T, 1e-13);
  return Number.isFinite(I) ? x0 + I : NaN;
}
/* Does F depend on x at all? Asked rather than declared, because route B above
   is only legitimate for an autonomous field and a table flag would be one
   more claim nothing recomputes. Returns the largest variation across the box
   relative to the field's own size. */
function odAutonomy(F, x0, y0, a, b, n){
  const N = Math.max(2, Math.round(n || 16));
  let dev = 0, mag = 0;
  for(let j = 0; j <= N; j++){
    const y = y0 - b + 2 * b * j / N, f0 = F(x0, y);
    if(!Number.isFinite(f0)) continue;
    mag = Math.max(mag, Math.abs(f0));
    for(let i = 0; i <= N; i++){
      const f = F(x0 - a + 2 * a * i / N, y);
      if(Number.isFinite(f)){ dev = Math.max(dev, Math.abs(f - f0)); mag = Math.max(mag, Math.abs(f)); }
    }
  }
  const rel = mag > 0 ? dev / mag : 0;
  return { dev, mag, rel, autonomous: rel < 1e-12 };
}

/* --------------------------------------------------- continuous dependence -- */
/* v = ∂y(x₁)/∂y₀ exactly, by integrating the variational equation v′ = F_y·v
   alongside the solution. This is what the perturbation ratio below must
   converge to, and having it in closed-ish form is what makes the ratio a
   MEASUREMENT rather than a plausible-looking number. */
function odVariational(F, x0, y0, x1, n, d){
  const N = Math.max(4, Math.round(n || 4000)), h = (x1 - x0) / N, dd = d || 1e-6;
  const fy = (x, y) => (F(x, y + dd) - F(x, y - dd)) / (2 * dd);
  const g = (x, y, v) => [F(x, y), fy(x, y) * v];
  let x = x0, y = y0, v = 1;
  for(let i = 0; i < N; i++){
    const k1 = g(x, y, v);
    const k2 = g(x + h / 2, y + h / 2 * k1[0], v + h / 2 * k1[1]);
    const k3 = g(x + h / 2, y + h / 2 * k2[0], v + h / 2 * k2[1]);
    const k4 = g(x + h, y + h * k3[0], v + h * k3[1]);
    y += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    v += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    x = x0 + (i + 1) * h;
    if(!Number.isFinite(y) || !Number.isFinite(v)) return { y:NaN, v:NaN, ok:false, x };
  }
  return { x, y, v, ok:true };
}
/* Move the initial value by ε and see what arrives at x₁. Grönwall bounds the
   ratio by e^(L(x₁−x₀)) — a number that does not depend on ε — so a ratio that
   keeps growing as ε shrinks is continuous dependence failing, which is the
   same failure as uniqueness and for the same reason. */
function odSensitivity(F, x0, y0, x1, epsList, n){
  const N = Math.max(64, Math.round(n || 8000));
  const base = odStepTo(F, x0, y0, x1, N);
  const rows = (epsList || [1e-2, 1e-4, 1e-6, 1e-8]).map(eps => {
    const yp = odStepTo(F, x0, y0 + eps, x1, N);
    const sep = Math.abs(yp - base);
    return { eps, yp, sep, ratio:sep / eps, ok:Number.isFinite(yp) };
  });
  return { base, rows };
}
const odGronwall = (L, x0, x1) => Math.exp(Math.abs(L * (x1 - x0)));

/* -------------------------------------------------- residual of a candidate -- */
/* Does a proposed function actually solve the equation? Central differences on
   the candidate against F evaluated on it — no closed form is trusted, and the
   gross is what the residual has to be read against (§1.4): the size of the
   slope the equation was asking for in the first place. */
function odResidual(y, F, x0, x1, n, h){
  const N = Math.max(4, Math.round(n || 400)), hh = h || 1e-5;
  let worst = 0, gross = 0, at = NaN, seen = false;
  for(let i = 0; i <= N; i++){
    const x = x0 + (x1 - x0) * i / N;
    const ym = y(x - hh), yp = y(x + hh), yc = y(x);
    if(!Number.isFinite(ym) || !Number.isFinite(yp) || !Number.isFinite(yc)) continue;
    const want = F(x, yc);
    if(!Number.isFinite(want)) continue;
    seen = true;
    const got = (yp - ym) / (2 * hh);
    const e = Math.abs(got - want);
    gross = Math.max(gross, Math.abs(want));
    if(e > worst){ worst = e; at = x; }
  }
  return { resid: seen ? worst : NaN, gross, at, ok:seen };
}
