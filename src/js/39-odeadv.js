/* ============================================================================
   3f · TRANSFORMS, LINEAR SYSTEMS AND NONLINEAR DYNAMICS
   The second half of a differential-equations course: Laplace methods, delta
   functions and convolution; first-order systems solved through eigenvalues;
   and the qualitative theory of nonlinear autonomous systems.

   Prefixes: lt (Laplace), sy (systems), ph (phase plane)
   ============================================================================ */

/* ---------------------------------------------------------------- Laplace ---- */
/* The transform by quadrature. Computed rather than looked up, so a reader can
   type any function and watch F(s) appear — and so the table below can be
   checked against it instead of being taken on trust. */
function ltTransform(f, s, tmax, n){
  const T = tmax || 40, N = n || 4000, h = T / N;
  let sum = 0;
  for(let i = 0; i <= N; i++){
    const t = i * h;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    const v = f(t) * Math.exp(-s * t);
    if(Number.isFinite(v)) sum += w * v;
  }
  return sum * h / 3;
}

/* The standard table, each entry carrying the function, its transform, and the
   region of convergence — because "the transform of e^(at)" is meaningless
   without saying that s must exceed a. */
const LT_TABLE = [
  { n:'1',            f:() => 1,                        F:s => 1 / s,                       roc:'s > 0',  tex:'1 ⟶ 1/s' },
  { n:'t',            f:t => t,                         F:s => 1 / (s * s),                 roc:'s > 0',  tex:'t ⟶ 1/s²' },
  { n:'tⁿ',           f:t => t * t * t,                 F:s => 6 / Math.pow(s, 4),          roc:'s > 0',  tex:'tⁿ ⟶ n!/sⁿ⁺¹' },
  { n:'e^(at)',       f:t => Math.exp(0.7 * t),         F:s => 1 / (s - 0.7),               roc:'s > a',  tex:'e^(at) ⟶ 1/(s−a)' },
  { n:'sin ωt',       f:t => Math.sin(2 * t),           F:s => 2 / (s * s + 4),             roc:'s > 0',  tex:'sin ωt ⟶ ω/(s²+ω²)' },
  { n:'cos ωt',       f:t => Math.cos(2 * t),           F:s => s / (s * s + 4),             roc:'s > 0',  tex:'cos ωt ⟶ s/(s²+ω²)' },
  { n:'e^(at) sin ωt',f:t => Math.exp(-0.5 * t) * Math.sin(2 * t),
                      F:s => 2 / ((s + 0.5) * (s + 0.5) + 4), roc:'s > a',                  tex:'shifted: s → s−a' },
  { n:'u(t−c)',       f:t => (t >= 2 ? 1 : 0),          F:s => Math.exp(-2 * s) / s,        roc:'s > 0',  tex:'u(t−c) ⟶ e^(−cs)/s' }
];

/* A unit impulse cannot be drawn, so it is approximated by a narrow bump of unit
   area — a *mollifier*. Everything the delta is for survives that: unit
   integral, and convolving with it reproduces the other function.
   The bump is a Gaussian rather than a rectangle on purpose. A rectangle has two
   jump discontinuities, and Simpson's rule converges at only first order across
   a jump, so a rectangular delta loses several percent in exactly the integrals
   it is meant to make exact. The Gaussian is smooth, so quadrature converges at
   full order and the sifting property comes out right. */
const ltDelta = (t, c, w) => {
  const s = w || 0.02;
  const u = (t - (c || 0)) / s;
  return Math.exp(-0.5 * u * u) / (s * Math.sqrt(2 * Math.PI));
};
const ltStep = (t, c) => (t >= (c || 0) ? 1 : 0);

/* Convolution (f ∗ g)(t) = ∫₀ᵗ f(τ)g(t−τ) dτ — the operation Laplace turns into
   multiplication, and the reason transfer functions work at all. */
function ltConvolve(f, g, t, n){
  const N = n || 400;
  if(t <= 0) return 0;
  const h = t / N;
  let s = 0;
  for(let i = 0; i <= N; i++){
    const tau = i * h;
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    const v = f(tau) * g(t - tau);
    if(Number.isFinite(v)) s += w * v;
  }
  return s * h / 3;
}

/* The second-order system  a y″ + b y′ + c y = forcing, as a transfer function
   H(s) = 1/(as²+bs+c). Its inverse transform is the impulse response, and the
   response to any input is the convolution of the two. */
function ltTransfer(a, b, c){
  const disc = b * b - 4 * a * c;
  const wn = Math.sqrt(c / a), zeta = b / (2 * Math.sqrt(a * c));
  let impulse;
  if(disc > 1e-12){
    const r1 = (-b + Math.sqrt(disc)) / (2 * a), r2 = (-b - Math.sqrt(disc)) / (2 * a);
    impulse = t => (Math.exp(r1 * t) - Math.exp(r2 * t)) / (a * (r1 - r2));
  } else if(disc < -1e-12){
    const re = -b / (2 * a), im = Math.sqrt(-disc) / (2 * a);
    impulse = t => Math.exp(re * t) * Math.sin(im * t) / (a * im);
  } else {
    const r = -b / (2 * a);
    impulse = t => t * Math.exp(r * t) / a;                 // the repeated root
  }
  return {
    a, b, c, disc, wn, zeta, impulse,
    H:(re, im) => {                                          // H at a complex s
      const dr = a * (re * re - im * im) + b * re + c, di = 2 * a * re * im + b * im;
      const d2 = dr * dr + di * di;
      return { re:dr / d2, im:-di / d2 };
    },
    /* the frequency response is H evaluated on the imaginary axis */
    gain:w => 1 / Math.hypot(c - a * w * w, b * w),
    phase:w => -Math.atan2(b * w, c - a * w * w),
    step:t => ltConvolve(impulse, tt => ltStep(tt, 0), t, 300)
  };
}

/* ------------------------------------------------------------- systems ---- */
/* x′ = A x. The eigenvalues decide everything, and the three cases are the same
   three that the second-order scalar equation has, because a scalar equation
   IS a system once you set v = y′. */
function syLinear(A, x0){
  const E = laEig2(A);
  if(E.real && Math.abs(E.values[0] - E.values[1]) > 1e-9){
    /* two independent directions: x(t) = c₁e^(λ₁t)v₁ + c₂e^(λ₂t)v₂ */
    const V = laT(E.vectors);
    const c = laSolve(V, x0).x || [0, 0];
    return { kind:'real', E, c,
      at:t => {
        const a = c[0] * Math.exp(E.values[0] * t), b = c[1] * Math.exp(E.values[1] * t);
        return [a * E.vectors[0][0] + b * E.vectors[1][0],
                a * E.vectors[0][1] + b * E.vectors[1][1]];
      } };
  }
  if(!E.real){
    /* complex pair: spirals. Solve by the real matrix exponential instead of
       juggling complex constants — e^(At) = e^(at)(cos bt I + sin bt (A−aI)/b) */
    const a = E.re, b = E.im;
    return { kind:'complex', E,
      at:t => {
        const ex = Math.exp(a * t), cs = Math.cos(b * t), sn = Math.sin(b * t);
        const M = [[A[0][0] - a, A[0][1]], [A[1][0], A[1][1] - a]];
        const m = [[cs + sn * M[0][0] / b, sn * M[0][1] / b],
                   [sn * M[1][0] / b, cs + sn * M[1][1] / b]];
        return [ex * (m[0][0] * x0[0] + m[0][1] * x0[1]),
                ex * (m[1][0] * x0[0] + m[1][1] * x0[1])];
      } };
  }
  /* repeated eigenvalue: e^(At) = e^(λt)(I + t(A − λI)) — the stray t again */
  const l = E.values[0];
  return { kind:'defective', E,
    at:t => {
      const ex = Math.exp(l * t);
      const N = [[A[0][0] - l, A[0][1]], [A[1][0], A[1][1] - l]];
      return [ex * (x0[0] + t * (N[0][0] * x0[0] + N[0][1] * x0[1])),
              ex * (x0[1] + t * (N[1][0] * x0[0] + N[1][1] * x0[1]))];
    } };
}

/* --------------------------------------------------------- phase plane ---- */
/* x′ = F(x,y), y′ = G(x,y). The qualitative theory: you cannot solve these in
   closed form, and you do not need to — the critical points and their local
   linearisations determine the whole picture. */
function phJacobian(F, G, x, y, h){
  const e = h || 1e-6;
  return [[(F(x + e, y) - F(x - e, y)) / (2 * e), (F(x, y + e) - F(x, y - e)) / (2 * e)],
          [(G(x + e, y) - G(x - e, y)) / (2 * e), (G(x, y + e) - G(x, y - e)) / (2 * e)]];
}

/* Newton from a grid of starts, then merge duplicates — the same strategy the
   multivariable wing uses for critical points, for the same reason. */
function phCritical(F, G, x0, x1, y0, y1, n){
  const N = n || 14, found = [];
  for(let i = 0; i <= N; i++) for(let j = 0; j <= N; j++){
    let x = x0 + (x1 - x0) * i / N, y = y0 + (y1 - y0) * j / N;
    let ok = false;
    for(let k = 0; k < 60; k++){
      const f = F(x, y), g = G(x, y);
      if(!Number.isFinite(f) || !Number.isFinite(g)) break;
      if(Math.hypot(f, g) < 1e-12){ ok = true; break; }
      const J = phJacobian(F, G, x, y);
      const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
      if(Math.abs(det) < 1e-14) break;
      const dx = (J[1][1] * f - J[0][1] * g) / det;
      const dy = (-J[1][0] * f + J[0][0] * g) / det;
      x -= dx; y -= dy;
      if(!Number.isFinite(x) || !Number.isFinite(y)) break;
      if(Math.hypot(dx, dy) < 1e-13){ ok = Math.hypot(F(x, y), G(x, y)) < 1e-9; break; }
    }
    if(!ok || x < x0 - 0.2 || x > x1 + 0.2 || y < y0 - 0.2 || y > y1 + 0.2) continue;
    if(found.some(p => Math.hypot(p.x - x, p.y - y) < 1e-5)) continue;
    found.push({ x, y, J:phJacobian(F, G, x, y) });
  }
  for(const p of found) Object.assign(p, phClassify(p.J));
  return found;
}

/* The classification, from the trace and determinant of the linearisation.
   This is the table every course draws, computed rather than remembered. */
function phClassify(J){
  const tr = J[0][0] + J[1][1];
  const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
  const disc = tr * tr - 4 * det;
  let kind, stable;
  if(Math.abs(det) < 1e-12){ kind = 'degenerate'; stable = null; }
  else if(det < 0){ kind = 'saddle'; stable = false; }
  else if(disc >= 0){
    kind = 'node';
    stable = tr < 0;
  } else if(Math.abs(tr) < 1e-9){
    kind = 'centre'; stable = null;
  } else {
    kind = 'spiral'; stable = tr < 0;
  }
  const E = laEig2(J);
  return { kind, stable, tr, det, disc, eig:E,
    label:(kind === 'saddle' ? 'saddle — always unstable'
         : kind === 'centre' ? 'centre — closed orbits (linearisation is inconclusive)'
         : kind === 'degenerate' ? 'degenerate — the linearisation decides nothing'
         : (stable ? 'stable ' : 'unstable ') + kind) };
}

/* RK4 on the autonomous system, forwards or backwards in time. Backwards is not
   a curiosity: it is how you draw the stable manifold of a saddle. */
function phTrajectory(F, G, x, y, dt, n, guard){
  const pts = [{ x, y }];
  const lim = guard || 1e4;
  for(let i = 0; i < n; i++){
    const k1 = [F(x, y), G(x, y)];
    const k2 = [F(x + dt * k1[0] / 2, y + dt * k1[1] / 2), G(x + dt * k1[0] / 2, y + dt * k1[1] / 2)];
    const k3 = [F(x + dt * k2[0] / 2, y + dt * k2[1] / 2), G(x + dt * k2[0] / 2, y + dt * k2[1] / 2)];
    const k4 = [F(x + dt * k3[0], y + dt * k3[1]), G(x + dt * k3[0], y + dt * k3[1])];
    x += dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
    y += dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
    if(!Number.isFinite(x) || !Number.isFinite(y) || Math.hypot(x, y) > lim) break;
    pts.push({ x, y });
  }
  return pts;
}

/* the named systems worth having on hand, each making a different point */
const PH_SYSTEMS = {
  linear:    { n:'a linear system', F:(x, y) => x + 2 * y, G:(x, y) => 3 * x + 2 * y,
               note:'A saddle at the origin. For a linear system the linearisation is exact everywhere, so the local picture is the global one.' },
  pendulum:  { n:'the damped pendulum', F:(x, y) => y, G:(x, y) => -Math.sin(x) - 0.3 * y,
               note:'Centres become stable spirals when damping is added, and the saddles at ±π are the "balanced upside down" states. The stable manifolds of those saddles separate swinging from spinning.' },
  vdp:       { n:'Van der Pol', F:(x, y) => y, G:(x, y) => 2 * (1 - x * x) * y - x,
               note:'An unstable spiral at the origin, yet nothing escapes: everything winds onto a limit cycle. A limit cycle is a periodic orbit that attracts its neighbours, and no linear system can have one.' },
  lotka:     { n:'predator and prey', F:(x, y) => x * (1 - 0.5 * y), G:(x, y) => y * (-0.6 + 0.4 * x),
               note:'Lotka–Volterra. The coexistence point is a centre for the pure model, so populations cycle forever — and that structural fragility is exactly why the model is a starting point rather than an answer.' },
  saddleN:   { n:'competing species', F:(x, y) => x * (3 - x - 2 * y), G:(x, y) => y * (2 - x - y),
               note:'Two stable nodes on the axes and a saddle between them: whichever species starts ahead wins. The saddle\'s stable manifold is the dividing line between the two fates.' },
  hopf:      { n:'a Hopf bifurcation', F:(x, y) => 0.3 * x - y - x * (x * x + y * y), G:(x, y) => x + 0.3 * y - y * (x * x + y * y),
               note:'As the parameter passes zero the spiral changes stability and a limit cycle is born. Bifurcation is the study of exactly these qualitative changes.' }
};
