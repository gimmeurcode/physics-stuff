/* ============================================================================
   3d · QUANTUM ENGINE — closed-form quantum mechanics (ħ = m = 1 throughout).
   Everything here is analytic: the stages that draw these functions are
   plotting exact solutions of the Schrödinger equation, not approximations,
   so every probe readout can be checked against the formula it displays.
   ============================================================================ */

/* ---- complex arithmetic (small, allocation-light) ---- */
const C = (re, im) => ({re, im: im || 0});
const cAdd = (a, b) => C(a.re + b.re, a.im + b.im);
const cSub = (a, b) => C(a.re - b.re, a.im - b.im);
const cMul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cScale = (a, s) => C(a.re * s, a.im * s);
const cDiv = (a, b) => {
  const d = b.re * b.re + b.im * b.im;
  return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const cAbs2 = a => a.re * a.re + a.im * a.im;
const cExp = a => { const m = Math.exp(a.re); return C(m * Math.cos(a.im), m * Math.sin(a.im)); };
/* principal square root */
function cSqrt(a){
  const m = Math.sqrt(Math.hypot(a.re, a.im)), th = Math.atan2(a.im, a.re) / 2;
  return C(m * Math.cos(th), m * Math.sin(th));
}

/* ----------------------------------------------------------------------------
   Free Gaussian wave packet.
     ψ(x,0) = (2πσ₀²)^(−¼) exp(−(x−x₀)²/4σ₀² + i k₀ x)
     ψ(x,t) = (2πσ₀²)^(−¼) α^(−½) exp(−(x−x₀−k₀t)²/(4σ₀²α) + i(k₀(x−x₀) − k₀²t/2))
   with α = 1 + i t/(2σ₀²).  This is the exact solution of i∂ψ/∂t = −½ ∂²ψ/∂x²:
   the tests differentiate it numerically and check the equation to 1e-6.
   ---------------------------------------------------------------------------- */
function qmPacketPsi(x, t, P){          // P = {x0, k0, s0}
  const s2 = P.s0 * P.s0;
  const al = C(1, t / (2 * s2));
  const u = x - P.x0 - P.k0 * t;
  /* −u²/(4σ₀²α) */
  const quad = cDiv(C(-u * u / (4 * s2), 0), al);
  const phase = C(0, P.k0 * (x - P.x0) - 0.5 * P.k0 * P.k0 * t);
  const pref = cDiv(C(Math.pow(2 * Math.PI * s2, -0.25), 0), cSqrt(al));
  return cMul(pref, cExp(cAdd(quad, phase)));
}
/* exact moments of that packet */
function qmPacketStats(t, P){
  const s2 = P.s0 * P.s0;
  const spread = Math.sqrt(1 + (t / (2 * s2)) ** 2);
  const dx = P.s0 * spread;             // Δx(t)
  const dp = 1 / (2 * P.s0);            // Δp — a constant of the free motion
  return { mean: P.x0 + P.k0 * t, dx, dp, product: dx * dp, meanP: P.k0 };
}
/* exact momentum amplitude of the same packet: |φ(k)|² is Gaussian, Δk = 1/2σ₀ */
function qmPacketPhi(k, P){
  const s2 = P.s0 * P.s0;
  const norm = Math.pow(2 * s2 / Math.PI, 0.25);
  return norm * Math.exp(-s2 * (k - P.k0) ** 2);   // real up to a k-independent phase at t=0
}
/* local momentum: k(x) = Im(ψ′/ψ) — what an ideal narrow position filter keeps */
function qmLocalK(x, t, P){
  const h = 1e-4;
  const a = qmPacketPsi(x - h, t, P), b = qmPacketPsi(x + h, t, P);
  const d = cScale(cSub(b, a), 1 / (2 * h));
  const c0 = qmPacketPsi(x, t, P);
  if(cAbs2(c0) < 1e-30) return P.k0;
  return cDiv(d, c0).im;
}

/* ----------------------------------------------------------------------------
   Infinite square well on [0, L]:  φₙ = √(2/L) sin(nπx/L),  Eₙ = n²π²/2L².
   A superposition Σ cₙ φₙ e^(−iEₙt) is exact for all time.
   ---------------------------------------------------------------------------- */
const qmWellE = (n, L) => (n * n * Math.PI * Math.PI) / (2 * L * L);
function qmWellPhi(n, L, x){
  if(x <= 0 || x >= L) return 0;
  return Math.sqrt(2 / L) * Math.sin(n * Math.PI * x / L);
}
function qmWellPsi(x, t, comps, L){     // comps: [{n, c}] with Σ|c|² = 1
  let re = 0, im = 0;
  for(const { n, c } of comps){
    const ph = -qmWellE(n, L) * t;
    const f = qmWellPhi(n, L, x);
    re += c * f * Math.cos(ph);
    im += c * f * Math.sin(ph);
  }
  return C(re, im);
}

/* ----------------------------------------------------------------------------
   BOUND STATES OF AN ARBITRARY POTENTIAL

   The square well above has a closed form because someone solved it. A potential
   the reader types has none, and "what does *my* potential do?" is the question
   the quantum wing exists to answer — so it is solved numerically instead.

   Numerov integration of ψ″ = 2(V(x) − E)ψ, in the wing's units (ħ = m = 1),
   with hard walls at the ends of the window. Numerov rather than Runge–Kutta
   because it is fourth-order for this particular shape of equation at the cost
   of a three-term recurrence — the y″ = f(x)y form has no first derivative, and
   Numerov is what that buys.

   The eigenvalues are found by counting **nodes** rather than by hunting for a
   zero of ψ at the far wall. Both work; the node count is far better behaved.
   The number of nodes of the solution shot from the left is a non-decreasing
   step function of E that steps up by one exactly at each eigenvalue, so a
   bisection on "are there more than n nodes yet?" converges on Eₙ with no
   exponential growth to fight, no near-cancellation, and no danger of skipping a
   state whose ψ at the wall happens to be small.
   ---------------------------------------------------------------------------- */
/* one shot from the left wall; returns the unnormalised ψ and its node count */
function qmShoot(V, E, x0, x1, N){
  const h = (x1 - x0) / N;
  const f = new Float64Array(N + 1);
  for(let i = 0; i <= N; i++){
    const v = V(x0 + i * h);
    /* a potential that is not finite somewhere is treated as a wall there rather
       than allowed to put NaN into the recurrence and lose every state */
    f[i] = 2 * ((Number.isFinite(v) ? v : 1e8) - E);
  }
  const psi = new Float64Array(N + 1);
  const c = new Float64Array(N + 1);
  for(let i = 0; i <= N; i++) c[i] = 1 - h * h * f[i] / 12;
  psi[0] = 0; psi[1] = 1e-10;
  let nodes = 0;
  for(let i = 1; i < N; i++){
    psi[i + 1] = ((2 + 10 * h * h * f[i] / 12) * psi[i] - c[i - 1] * psi[i - 1]) / c[i + 1];
    if(psi[i + 1] * psi[i] < 0) nodes++;
    /* Under a barrier the solution grows like e^(+κx) and will overflow long
       before the far wall. Rescaling everything computed so far leaves the node
       count and the shape untouched, because the equation is linear. */
    if(Math.abs(psi[i + 1]) > 1e120){
      for(let j = 0; j <= i + 1; j++) psi[j] *= 1e-120;
    }
  }
  return { psi, nodes, h };
}
/* the first `count` bound states in the window, energies and wavefunctions */
function qmBoundStates(V, x0, x1, count, N){
  N = N || 1600;
  const nodesAt = E => qmShoot(V, E, x0, x1, N).nodes;
  /* the search window: no state can sit below the lowest value of V */
  let vmin = Infinity;
  for(let i = 0; i <= 400; i++){
    const v = V(x0 + (x1 - x0) * i / 400);
    if(Number.isFinite(v)) vmin = Math.min(vmin, v);
  }
  if(!Number.isFinite(vmin)) vmin = 0;
  /* push the ceiling up until it is above the states being asked for, rather
     than guessing a number that would silently truncate the spectrum */
  let hi = vmin + 1;
  for(let k = 0; k < 60 && nodesAt(hi) <= count; k++) hi = vmin + (hi - vmin) * 2;
  const out = [];
  for(let n = 0; n < count; n++){
    if(nodesAt(hi) <= n) break;                    // the window holds no more
    let a = vmin - 1e-6, b = hi;
    for(let it = 0; it < 200; it++){
      const m = (a + b) / 2;
      if(nodesAt(m) > n) b = m; else a = m;
      if(b - a < 1e-13 * Math.max(1, Math.abs(b))) break;
    }
    const E = (a + b) / 2;
    const S = qmShoot(V, E, x0, x1, N);
    /* normalise, by the trapezoid rule on ψ² */
    let s = 0;
    for(let i = 0; i < N; i++) s += (S.psi[i] * S.psi[i] + S.psi[i + 1] * S.psi[i + 1]) / 2 * S.h;
    const A = s > 0 ? 1 / Math.sqrt(s) : 1;
    const psi = new Float64Array(N + 1);
    for(let i = 0; i <= N; i++) psi[i] = S.psi[i] * A;
    /* sign convention: start positive, so the pictures do not flip about at
       random as the potential is edited */
    let k0 = 1;
    while(k0 < N && Math.abs(psi[k0]) < 1e-12) k0++;
    if(psi[k0] < 0) for(let i = 0; i <= N; i++) psi[i] = -psi[i];
    /* Recount the nodes on the converged solution, and only where ψ is actually
       non-zero. At exactly Eₙ the solution reaches the far wall as it crosses
       zero, and whether that crossing lands just inside or just outside the last
       grid point is rounding — so the count taken during the search reads n−1 or
       n unpredictably. A node is a place the wavefunction changes sign *and gets
       somewhere*; beyond the point where |ψ| has fallen to a millionth of its
       peak the sign carries no information. */
    let peak = 0;
    for(let i = 0; i <= N; i++) peak = Math.max(peak, Math.abs(psi[i]));
    let last = N;
    while(last > 1 && Math.abs(psi[last]) < 1e-6 * peak) last--;
    let nodes = 0;
    for(let i = 1; i < last; i++) if(psi[i] * psi[i + 1] < 0) nodes++;
    out.push({ n, E, psi, x0, x1, h:S.h, N, nodes,
               at:x => { const t = (x - x0) / S.h; const i = Math.floor(t);
                         if(i < 0 || i >= N) return 0;
                         return psi[i] + (psi[i + 1] - psi[i]) * (t - i); } });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   Rectangular barrier of height V0 on [0, a], incident energy E (E, V0 > 0).
   Full matching of the stationary scattering state, so the plotted ψ and the
   T, R read off it are the exact ones:
     region I  : e^(ikx) + r e^(−ikx)
     region II : A e^(iqx) + B e^(−iqx)   (q imaginary when E < V0)
     region III: t e^(ikx)
   ---------------------------------------------------------------------------- */
function qmBarrier(E, V0, a){
  /* q → 0 exactly at E = V0: step off the singular point by one part in 10⁹ */
  if(Math.abs(E - V0) < 1e-9 * Math.max(1, V0)) E = V0 + 1e-9 * Math.max(1, V0);
  const k = Math.sqrt(2 * E);
  const q = cSqrt(C(2 * (E - V0), 0));            // iκ below the barrier
  const ik = C(0, k), iq = cMul(C(0, 1), q);
  const ea = cExp(cScale(iq, a)), ema = cExp(cScale(iq, -a)), eka = cExp(cScale(ik, a));
  /* t from the standard closed form: t = e^{-ika} / (cos qa − i (k²+q²)/(2kq) sin qa) */
  const qa = cScale(q, a);
  const cosqa = C(Math.cos(qa.re) * Math.cosh(qa.im), -Math.sin(qa.re) * Math.sinh(qa.im));
  const sinqa = C(Math.sin(qa.re) * Math.cosh(qa.im), Math.cos(qa.re) * Math.sinh(qa.im));
  const fac = cDiv(cAdd(cMul(C(k, 0), C(k, 0)), cMul(q, q)), cScale(cMul(C(k, 0), q), 2));
  const denom = cSub(cosqa, cMul(C(0, 1), cMul(fac, sinqa)));
  const t = cDiv(cExp(C(0, -k * a)), denom);
  const T = cAbs2(t);
  /* r = t · e^{ika} · i (q²−k²)/(2kq) sin qa   (standard) */
  const fac2 = cDiv(cSub(cMul(q, q), C(k * k, 0)), cScale(cMul(C(k, 0), q), 2));
  const r = cMul(cMul(t, eka), cMul(C(0, 1), cMul(fac2, sinqa)));
  const R = cAbs2(r);
  /* interior coefficients from continuity at x = a */
  const tka = cMul(t, eka);
  const A = cDiv(cMul(tka, cMul(cAdd(iq, ik), C(0.5, 0))), cMul(iq, ea));
  const B = cDiv(cMul(tka, cMul(cSub(iq, ik), C(0.5, 0))), cMul(iq, ema));
  const psi = x => {
    if(x < 0){
      const inc = cExp(C(0, k * x));
      return cAdd(inc, cMul(r, cExp(C(0, -k * x))));
    }
    if(x > a) return cMul(t, cExp(C(0, k * x)));
    return cAdd(cMul(A, cExp(cScale(iq, x))), cMul(B, cExp(cScale(iq, -x))));
  };
  return { T, R, t, r, k, q, psi };
}

/* ----------------------------------------------------------------------------
   SCATTERING OFF AN ARBITRARY BARRIER

   qmBarrier above solves one shape exactly, because the rectangle is the one
   barrier whose matching conditions can be written down. A potential the reader
   types has no such solution, so the same stationary scattering problem is done
   numerically — and the numerical route has to produce the same three things the
   closed form does: T, R, and a ψ that can be plotted.

   The method is a transfer matrix. Over a slab thin enough that V is effectively
   constant, ψ″ = −wψ with w = 2(E − V) has an exact propagator, and it is the
   same two lines whether w is positive (oscillation) or negative (growth):

       ψ(x+h) = c·ψ + s·ψ′,      ψ′(x+h) = −w·s·ψ + c·ψ′
       c = cos(qh),  s = sin(qh)/q       (w > 0, q = √w)
       c = cosh(κh), s = sinh(κh)/κ      (w < 0, κ = √−w)

   The integration runs **backwards**, from a pure outgoing wave at the right.
   That is not a detail: shooting forwards into a barrier means launching a
   solution that contains a growing exponential, and the physically relevant
   decaying part is swamped within a few decay lengths. Backwards, the growing
   part is the one being followed, and precision improves rather than decays.

   With the incident amplitude read off at the left, T = 1/|a|² and R = |b|²/|a|².
   Nothing forces those to sum to 1 — the propagators were applied one at a time
   and the flux was never imposed — so T + R − 1 is a genuine, independent
   measurement of how well the numerics are doing, and it is returned.
   ---------------------------------------------------------------------------- */
function qmScatter(V, E, x0, x1, N){
  N = N || 4000;
  const h = (x1 - x0) / N;
  const k = Math.sqrt(2 * Math.max(E, 1e-12));
  /* ψ and ψ′ carried as two reals each; the propagator is real, so the real and
     imaginary parts never mix and the whole sweep is real arithmetic */
  let pr = 1, pi = 0, dr = 0, di = k;          // ψ(x₁) = 1, ψ′(x₁) = ik
  const pre = new Float64Array(N + 1), pim = new Float64Array(N + 1);
  pre[N] = pr; pim[N] = pi;
  for(let j = N; j > 0; j--){
    const v = V(x0 + (j - 0.5) * h);
    const w = 2 * (E - (Number.isFinite(v) ? v : 1e8));
    let c, s;
    if(w > 1e-14){ const q = Math.sqrt(w); c = Math.cos(q * h); s = Math.sin(q * h) / q; }
    else if(w < -1e-14){ const kp = Math.sqrt(-w); c = Math.cosh(kp * h); s = Math.sinh(kp * h) / kp; }
    else { c = 1; s = h; }
    /* a step of −h: cos is even, sin and sinh are odd, so only s changes sign */
    const npr = c * pr - s * dr, npi = c * pi - s * di;
    const ndr = w * s * pr + c * dr, ndi = w * s * pi + c * di;
    pr = npr; pi = npi; dr = ndr; di = ndi;
    pre[j - 1] = pr; pim[j - 1] = pi;
    /* Under a thick barrier the backward solution grows without bound. Because
       the equation is linear, rescaling *everything stored so far* by a common
       factor leaves every ratio — and therefore T, R and the plotted ψ — exactly
       unchanged, which is why no scale factor has to be tracked afterwards. */
    if(Math.abs(pr) > 1e80 || Math.abs(pi) > 1e80){
      const f = 1e-80;
      for(let m = j - 1; m <= N; m++){ pre[m] *= f; pim[m] *= f; }
      pr *= f; pi *= f; dr *= f; di *= f;
    }
  }
  /* split ψ(x₀) into the incident and reflected pieces:
       ψ = a e^(ikx) + b e^(−ikx),  so  a e^(ikx₀) = (ψ − iψ′/k)/2 */
  const Pr = (pr + di / k) / 2, Pi = (pi - dr / k) / 2;      // a·e^(ikx₀)
  const Qr = (pr - di / k) / 2, Qi = (pi + dr / k) / 2;      // b·e^(−ikx₀)
  const a2 = Pr * Pr + Pi * Pi, b2 = Qr * Qr + Qi * Qi;
  const T = a2 > 0 ? 1 / a2 : 0, R = a2 > 0 ? b2 / a2 : 1;
  /* divide the stored solution by the incident amplitude, so what is plotted has
     a unit incoming wave — the same normalisation the closed form uses */
  const eR = Math.cos(k * x0), eI = -Math.sin(k * x0);       // e^(−ikx₀)
  const AR = Pr * eR - Pi * eI, AI = Pr * eI + Pi * eR;      // a itself
  const A2 = AR * AR + AI * AI || 1;
  const div = (zr, zi) => C((zr * AR + zi * AI) / A2, (zi * AR - zr * AI) / A2);
  const psi = x => {
    if(x <= x0){
      /* e^(ikx) + r e^(−ikx), with r = b/a */
      const rr = (Qr * AR + Qi * AI), ri = (Qi * AR - Qr * AI);   // (b·e^(−ikx₀))/a
      const ph = C(Math.cos(k * x0), Math.sin(k * x0));           // undo the e^(−ikx₀)
      const r = cMul(C(rr / A2, ri / A2), ph);
      return cAdd(C(Math.cos(k * x), Math.sin(k * x)), cMul(r, C(Math.cos(k * x), -Math.sin(k * x))));
    }
    if(x >= x1){
      const e = div(pre[N], pim[N]);
      return cMul(e, C(Math.cos(k * (x - x1)), Math.sin(k * (x - x1))));
    }
    const u = (x - x0) / h, i = Math.min(N - 1, Math.max(0, Math.floor(u))), f = u - i;
    return div(pre[i] + (pre[i + 1] - pre[i]) * f, pim[i] + (pim[i + 1] - pim[i]) * f);
  };
  return { T, R, k, psi, unit:T + R - 1 };
}
/* The WKB (Gamow) estimate of the same transmission: exp(−2∫κ dx) over wherever
   the barrier stands above E. Computed by quadrature over the actual V, so it is
   an independent second opinion on qmScatter rather than a rearrangement of it —
   and where the two disagree, the disagreement is the approximation being caught
   out, which is worth more than either number alone. */
function qmGamow(V, E, x0, x1, N){
  N = N || 4000;
  const h = (x1 - x0) / N;
  let s = 0;
  for(let i = 0; i < N; i++){
    const g = u => { const v = V(u); return Math.sqrt(2 * Math.max(0, (Number.isFinite(v) ? v : 0) - E)); };
    s += (g(x0 + i * h) + g(x0 + (i + 1) * h)) / 2 * h;
  }
  return { integral:s, T:Math.exp(-2 * s) };
}

/* ----------------------------------------------------------------------------
   FREE EVOLUTION OF AN ARBITRARY INITIAL SHAPE

   The Gaussian packet above has a closed form for all time. Any other shape has
   none — but the free particle is exactly solvable in *momentum* space whatever
   the shape is, because each plane wave simply rotates:

       φ(k) = (2π)^(−½) ∫ ψ₀(x) e^(−ikx) dx
       ψ(x,t) = (2π)^(−½) ∫ φ(k) e^(i(kx − k²t/2)) dk

   So the evolution is not stepped in time at all. φ is computed once, and every
   later ψ is one transform away — which means the picture at t = 8 is no less
   accurate than the one at t = 0, unlike any finite-difference scheme, and the
   norm cannot drift because a pure phase cannot change a modulus.

   The transforms are the wing's own `ftFFT`, on a power-of-two grid across the
   window. Doing it that way is not only faster; it removes a question. A hand
   rolled k-grid has to *choose* its spacing, and choosing badly aliases the
   packet into a copy of itself half a window away — an error that looks like
   physics. The FFT's grid is forced: dk = 2π/L and k_max = π/dx, the only pair
   for which the sampled forward and inverse transforms are exact inverses.

   What that grid costs is stated rather than hidden. It makes the world periodic
   with period L, so a packet that spreads far enough leaves one edge and returns
   at the other, and `wrap` measures how much probability is currently near the
   edges. And it cannot represent momenta above π/dx, so `alias` measures how much
   of the spectrum is piled up against that ceiling.

   Two theorems come free and are returned as measurements — genuine ones, in the
   sense that each compares a quantity computed in x with a quantity computed in
   k. Ehrenfest says ⟨x⟩ moves at exactly ⟨k⟩ for a free particle whatever the
   shape, so ⟨x⟩(t) − x̄₀ can be checked against ⟨k⟩t. And Δp must not change at
   all, because the evolution multiplies φ by a phase and a phase cannot change a
   modulus. `parseval` and `round` are weaker: on an exact FFT pair they are true
   by construction, so they check the transform rather than the physics, and the
   panel says so instead of presenting them as evidence of anything else.
   ---------------------------------------------------------------------------- */
function qmFreeShape(shape, k0, x0, x1, N){
  N = N || 2048;                                   // a power of two, for ftFFT
  const L = x1 - x0, dx = L / N;
  /* ψ₀(x) = (what was typed) · e^(ik₀x): the shape carries the envelope and the
     slider carries the momentum, so a reader can move a shape they drew */
  const ar = new Float64Array(N), ai = new Float64Array(N);
  let peak = 0;
  for(let i = 0; i < N; i++){
    const x = x0 + i * dx, v = shape(x);
    const s = Number.isFinite(v) ? v : 0;
    ar[i] = s * Math.cos(k0 * x); ai[i] = s * Math.sin(k0 * x);
    peak = Math.max(peak, Math.abs(s));
  }
  let nrm = 0;
  for(let i = 0; i < N; i++) nrm += ar[i] * ar[i] + ai[i] * ai[i];
  nrm *= dx;
  const A = nrm > 1e-300 ? 1 / Math.sqrt(nrm) : 0;
  for(let i = 0; i < N; i++){ ar[i] *= A; ai[i] *= A; }
  /* how much of the shape the window is cutting through — the same question
     ftTruncation asks of a signal, and for the same reason */
  const edge = peak > 0 ? Math.max(Math.abs(shape(x0)) || 0, Math.abs(shape(x1)) || 0) / peak : 0;
  /* forward transform: Φ[j] with the FFT's own wrapped ordering */
  const Fr = Float64Array.from(ar), Fi = Float64Array.from(ai);
  ftFFT(Fr, Fi);
  const dk = 2 * Math.PI / L, kNy = Math.PI / dx;
  const kAt = j => (j <= N / 2 ? j : j - N) * dk;
  /* |φ|² up to a constant; the constant cancels out of every moment below */
  let w0 = 0, w1 = 0, w2 = 0, wHi = 0;
  for(let j = 0; j < N; j++){
    const p = Fr[j] * Fr[j] + Fi[j] * Fi[j], k = kAt(j);
    w0 += p; w1 += k * p; w2 += k * k * p;
    if(Math.abs(k) > 0.8 * kNy) wHi += p;          // piled against the ceiling?
  }
  const meanK = w0 > 0 ? w1 / w0 : 0;
  const dp = w0 > 0 ? Math.sqrt(Math.max(0, w2 / w0 - meanK * meanK)) : 0;
  const alias = w0 > 0 ? wHi / w0 : 0;
  /* Parseval on the discrete pair: Σ|Φ|² = N Σ|ψ|², and Σ|ψ|²dx was set to 1 */
  const parseval = w0 * dx / N;
  /* one x-grid per instant, cached: the plot, the readout and the chip all ask
     at the same t, and each rebuild is a single inverse transform */
  let cacheT = null;
  let cr = new Float64Array(N), ci = new Float64Array(N);
  function table(t){
    if(cacheT === t) return;
    for(let j = 0; j < N; j++){
      const k = kAt(j), ph = -0.5 * k * k * t;
      const c = Math.cos(ph), s = Math.sin(ph);
      cr[j] = Fr[j] * c - Fi[j] * s;
      ci[j] = Fr[j] * s + Fi[j] * c;
    }
    ftFFT(cr, ci, true);
    cacheT = t;
  }
  const psi = (x, t) => {
    table(t);
    const u = (x - x0) / dx;
    if(u < 0 || u > N - 1) return C(0, 0);
    const i = Math.min(N - 2, Math.floor(u)), s = u - i;
    return C(cr[i] + (cr[i + 1] - cr[i]) * s, ci[i] + (ci[i + 1] - ci[i]) * s);
  };
  const stats = t => {
    table(t);
    let n = 0, m = 0, m2 = 0, w = 0;
    for(let i = 0; i < N; i++){
      const x = x0 + i * dx, p = (cr[i] * cr[i] + ci[i] * ci[i]) * dx;
      n += p; m += x * p; m2 += x * x * p;
      if(i < N * 0.06 || i > N * 0.94) w += p;      // probability at the edges
    }
    const mean = n > 0 ? m / n : 0;
    const dxw = n > 0 ? Math.sqrt(Math.max(0, m2 / n - mean * mean)) : 0;
    return { norm:n, mean, dx:dxw, dp, product:dxw * dp, meanP:meanK, wrap:n > 0 ? w / n : 0 };
  };
  const s0 = stats(0);
  return { psi, stats, N, dx, dk, kNy, kAt,
    phi:j => C(Fr[(j % N + N) % N], Fi[(j % N + N) % N]),
    phiMag2:j => { const m = (j % N + N) % N; return (Fr[m] * Fr[m] + Fi[m] * Fi[m]) / (w0 || 1); },
    meanK, dp, edge, alias, parseval, round:s0.norm,
    xBar0:s0.mean, dx0:s0.dx, product0:s0.product };
}

/* ----------------------------------------------------------------------------
   Two-slit interference, exact two-source path difference (no small-angle
   approximation): sources at (0, ±d/2), screen plane x = D, wavelength λ.
   γ ∈ [0,1] is the coherence: 1 = no which-path information, 0 = a detector
   has fully tagged the path and the cross term dies.
     I(y) = env·(1 + γ·V·cos kΔr),   Δr = r₂ − r₁,  k = 2π/λ
   env is the single-slit diffraction envelope sinc²(π w y / λ r̄).
   ---------------------------------------------------------------------------- */
function qmSlitIntensity(y, Q){         // Q = {d, w, lambda, D, gamma}
  const r1 = Math.hypot(Q.D, y - Q.d / 2);
  const r2 = Math.hypot(Q.D, y + Q.d / 2);
  const dr = r2 - r1;
  const k = 2 * Math.PI / Q.lambda;
  const rb = (r1 + r2) / 2;
  const u = Math.PI * Q.w * (y / rb) / Q.lambda;
  const env = u === 0 ? 1 : (Math.sin(u) / u) ** 2;
  /* 1/r amplitude falloff kept — the pattern dims toward the edges honestly */
  const geo = Q.D * Q.D / (r1 * r2);
  return { I: geo * env * (1 + Q.gamma * Math.cos(k * dr)), dr, phase: k * dr, r1, r2, env: geo * env };
}
/* cumulative table + inverse-CDF sampling: dots land with density ∝ I(y) */
function qmSlitSampler(Q, ymax, n){
  const N = n || 512, ys = new Float64Array(N), cdf = new Float64Array(N);
  let acc = 0;
  for(let i = 0; i < N; i++){
    const y = -ymax + (i + 0.5) * (2 * ymax / N);
    ys[i] = y;
    acc += Math.max(0, qmSlitIntensity(y, Q).I);
    cdf[i] = acc;
  }
  const total = acc || 1;
  return () => {
    const u = Math.random() * total;
    let lo = 0, hi = N - 1;
    while(lo < hi){ const mid = (lo + hi) >> 1; if(cdf[mid] < u) lo = mid + 1; else hi = mid; }
    return ys[lo] + (Math.random() - 0.5) * (2 * ymax / N);
  };
}

/* generic inverse-CDF sampler over tabulated |ψ|² — used by the collapse stage */
function qmSampleFrom(pdf, xmin, xmax, n){
  const N = n || 600, xs = new Float64Array(N), cdf = new Float64Array(N);
  let acc = 0;
  for(let i = 0; i < N; i++){
    const x = xmin + (i + 0.5) * (xmax - xmin) / N;
    xs[i] = x;
    acc += Math.max(0, pdf(x));
    cdf[i] = acc;
  }
  const total = acc || 1;
  const u = Math.random() * total;
  let lo = 0, hi = N - 1;
  while(lo < hi){ const mid = (lo + hi) >> 1; if(cdf[mid] < u) lo = mid + 1; else hi = mid; }
  return xs[lo];
}

/* ----------------------------------------------------------------------------
   Spin ½.  A spin prepared "up along ẑ" measured along an axis tilted by θ:
     P(+) = cos²(θ/2),  P(−) = sin²(θ/2)
   — the entire mathematics of sequential Stern–Gerlach filters.
   ---------------------------------------------------------------------------- */
const sgProbUp = thetaRad => Math.cos(thetaRad / 2) ** 2;
/* a chain of analyzer angles (radians, each measured from the previous axis):
   returns the fraction of the original beam surviving each stage */
function sgChain(angles){
  const out = [];
  let p = 1;
  for(const th of angles){ p *= sgProbUp(th); out.push(p); }
  return out;
}

/* ----------------------------------------------------------------------------
   Planck's law (dimensionless: x = hν/kT_ref), and the photoelectric line —
   the two experiments that forced quantisation in the first place.
   ---------------------------------------------------------------------------- */
const planckU = (nu, T) => nu <= 0 || T <= 0 ? 0 : (nu ** 3) / (Math.expm1(nu / T));
const wienPeak = T => 2.821 * T;                       // ∂u/∂ν = 0
const photoKmax = (nu, phi) => Math.max(0, nu - phi);  // K = hν − φ in units of φ
