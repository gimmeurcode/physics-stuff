/* ============================================================================
   1b · NUMERICS — quadrature, small dense linear algebra, root finding.

   Everything the calculus wings measure is measured here. The rule is that a
   stage never asserts a number it has not computed: if a panel claims the
   midpoint rule converges as h², the error it prints came from running the
   midpoint rule twice at different h and dividing.
   ============================================================================ */

/* ---------------------------------------------------------------- 1D rules ---- */
/* Every one of these takes a plain f(x) and returns the number, so the drawing
   code and the readout code can never disagree about what was summed. */

const NQ_RULES = ['left', 'right', 'mid', 'trap', 'simpson'];
const NQ_RULE_NAMES = {
  left:'left endpoints', right:'right endpoints', mid:'midpoints',
  trap:'trapezoids', simpson:"Simpson's rule"
};
/* the exponent p in error ~ C·hᵖ for each rule, on a smooth integrand */
const NQ_RULE_ORDER = { left:1, right:1, mid:2, trap:2, simpson:4 };

/* the sample abscissae a rule uses on panel i of n — this is what the picture
   draws, so the picture is guaranteed to show what the sum used */
function nqNodes(a, b, n, rule){
  const h = (b - a) / n, out = [];
  for(let i = 0; i < n; i++){
    const l = a + i * h, r = l + h;
    if(rule === 'left')       out.push({ l, r, x:l });
    else if(rule === 'right') out.push({ l, r, x:r });
    else                      out.push({ l, r, x:(l + r) / 2 });
  }
  return out;
}

function nqRiemann(f, a, b, n, rule){
  n = Math.max(1, Math.round(n));
  const h = (b - a) / n;
  let s = 0;
  if(rule === 'simpson') return nqSimpson(f, a, b, n);
  if(rule === 'trap'){
    s = (f(a) + f(b)) / 2;
    for(let i = 1; i < n; i++) s += f(a + i * h);
    return s * h;
  }
  const off = rule === 'left' ? 0 : rule === 'right' ? 1 : 0.5;
  for(let i = 0; i < n; i++) s += f(a + (i + off) * h);
  return s * h;
}

/* Simpson needs an even number of panels; asking for an odd one and silently
   using n+1 would make the error table lie, so round up and say so. */
function nqSimpson(f, a, b, n){
  n = Math.max(2, Math.round(n));
  if(n % 2) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for(let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return s * h / 3;
}

/* Gauss–Legendre nodes on [−1,1]; exact for polynomials of degree 2n−1 */
const NQ_GL = {
  2: { x:[-0.5773502691896257, 0.5773502691896257], w:[1, 1] },
  3: { x:[-0.7745966692414834, 0, 0.7745966692414834],
       w:[0.5555555555555556, 0.8888888888888888, 0.5555555555555556] },
  4: { x:[-0.8611363115940526, -0.3399810435848563, 0.3399810435848563, 0.8611363115940526],
       w:[0.3478548451374538, 0.6521451548625461, 0.6521451548625461, 0.3478548451374538] },
  5: { x:[-0.9061798459386640, -0.5384693101056831, 0, 0.5384693101056831, 0.9061798459386640],
       w:[0.2369268850561891, 0.4786286704993665, 0.5688888888888889, 0.4786286704993665, 0.2369268850561891] },
  8: { x:[-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498,
          0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363],
       w:[0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620,
          0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763] }
};
function nqGauss(f, a, b, k, panels){
  const G = NQ_GL[k] || NQ_GL[5], m = Math.max(1, panels || 1);
  const H = (b - a) / m;
  let s = 0;
  for(let p = 0; p < m; p++){
    const l = a + p * H, c = l + H / 2, hw = H / 2;
    for(let i = 0; i < G.x.length; i++) s += G.w[i] * f(c + hw * G.x[i]);
    }
  return s * (b - a) / (2 * m);
}

/* Adaptive Simpson, the workhorse behind every "exact value" a stage prints.

   It is run on a fixed pre-subdivision rather than on the whole interval at
   once, and that is not caution — it is a bug fix. Adaptive quadrature decides
   it has converged when one Simpson estimate agrees with two, and a periodic
   integrand can make them agree by accident: an astroid's speed and a
   cardioid's r² are both exactly zero at every point the first estimate looks
   at, so the routine returns 0 and reports success. Splitting first removes
   that failure mode, at a cost of a few dozen extra evaluations. */
const NQ_ADAPT_PANELS = 16;
function nqAdaptive(f, a, b, tol, maxDepth){
  tol = tol || 1e-11; maxDepth = maxDepth || 22;
  const M = NQ_ADAPT_PANELS, H = (b - a) / M;
  let total = 0;
  for(let p = 0; p < M; p++)
    total += nqAdaptPanel(f, a + p * H, a + (p + 1) * H, tol / M, maxDepth);
  return Number.isFinite(total) ? total : nqGauss(f, a, b, 8, 240);
}
function nqAdaptPanel(f, a, b, tol, maxDepth){
  const S = (l, r, fl, fm, fr) => (r - l) / 6 * (fl + 4 * fm + fr);
  const fa = f(a), fb = f(b), fm = f((a + b) / 2);
  const whole = S(a, b, fa, fm, fb);
  const rec = (l, r, fl, fmm, fr, whole, tol, depth) => {
    const m = (l + r) / 2;
    const lm = (l + m) / 2, rm = (m + r) / 2;
    const flm = f(lm), frm = f(rm);
    const left = S(l, m, fl, flm, fmm), right = S(m, r, fmm, frm, fr);
    if(depth <= 0 || Math.abs(left + right - whole) <= 15 * tol) return left + right + (left + right - whole) / 15;
    return rec(l, m, fl, flm, fmm, left, tol / 2, depth - 1) +
           rec(m, r, fmm, frm, fr, right, tol / 2, depth - 1);
  };
  const v = rec(a, b, fa, fm, fb, whole, tol, maxDepth);
  return Number.isFinite(v) ? v : nqGauss(f, a, b, 8, 240);
}

/* the running antiderivative A(x) = ∫ₐˣ f, sampled on a grid — this is what the
   Fundamental Theorem stage draws, and it is built by accumulation rather than
   by re-integrating from a each time, so it is genuinely a running total */
function nqAccumulate(f, a, b, n){
  n = Math.max(2, Math.round(n));
  const h = (b - a) / n, xs = new Float64Array(n + 1), As = new Float64Array(n + 1);
  xs[0] = a; As[0] = 0;
  for(let i = 1; i <= n; i++){
    const l = a + (i - 1) * h, r = a + i * h;
    /* Simpson on each step: the accumulation must be better than the curve it
       is compared against, or the demonstration proves nothing */
    As[i] = As[i - 1] + (r - l) / 6 * (f(l) + 4 * f((l + r) / 2) + f(r));
    xs[i] = r;
  }
  return { xs, As, h };
}

/* an improper integral on a half-infinite range, by the substitution x = a + t/(1−t) */
function nqImproperTail(f, a, tol){
  const g = t => { const u = 1 - t; return f(a + t / u) / (u * u); };
  return nqAdaptive(g, 0, 1 - 1e-12, tol || 1e-10);
}

/* ------------------------------------------------------- 2D and 3D quadrature ---- */
/* Iterated Gauss–Legendre. Both integrals in an iterated pair are done with the
   same rule, which is the point: Fubini says the order cannot matter, and the
   stages check that by running it both ways and differencing. */

function nqDoubleRect(f, a, b, c, d, k, panels){
  const G = NQ_GL[k || 5], m = Math.max(1, panels || 8);
  const inner = x => {
    let s = 0;
    const H = (d - c) / m;
    for(let p = 0; p < m; p++){
      const cc = c + p * H + H / 2, hw = H / 2;
      for(let i = 0; i < G.x.length; i++) s += G.w[i] * f(x, cc + hw * G.x[i]) * hw;
    }
    return s;
  };
  return nqGauss(inner, a, b, k || 5, m);
}

/* Type I:  ∫ₐᵇ ∫_{g₁(x)}^{g₂(x)} f(x,y) dy dx  */
function nqDoubleTypeI(f, a, b, g1, g2, k, panels){
  const inner = x => {
    const lo = g1(x), hi = g2(x);
    if(!Number.isFinite(lo) || !Number.isFinite(hi) || Math.abs(hi - lo) < 1e-14) return 0;
    return nqGauss(y => f(x, y), lo, hi, k || 5, panels || 6);
  };
  return nqGauss(inner, a, b, k || 5, panels || 10);
}
/* Type II: ∫_c^d ∫_{h₁(y)}^{h₂(y)} f(x,y) dx dy  */
function nqDoubleTypeII(f, c, d, h1, h2, k, panels){
  const inner = y => {
    const lo = h1(y), hi = h2(y);
    if(!Number.isFinite(lo) || !Number.isFinite(hi) || Math.abs(hi - lo) < 1e-14) return 0;
    return nqGauss(x => f(x, y), lo, hi, k || 5, panels || 6);
  };
  return nqGauss(inner, c, d, k || 5, panels || 10);
}
/* polar: ∫_{θ₀}^{θ₁} ∫_{r₁(θ)}^{r₂(θ)} f(r cosθ, r sinθ) · r dr dθ.
   The r is the whole content of the change of variables, so it is written
   explicitly here rather than folded into the caller's integrand. */
function nqDoublePolar(f, t0, t1, r1, r2, k, panels){
  const inner = th => {
    const lo = r1(th), hi = r2(th);
    if(!Number.isFinite(lo) || !Number.isFinite(hi)) return 0;
    return nqGauss(r => f(r * Math.cos(th), r * Math.sin(th)) * r, lo, hi, k || 5, panels || 6);
  };
  return nqGauss(inner, t0, t1, k || 5, panels || 10);
}

/* the double Riemann sum the pictures draw: m×n sample boxes over a rectangle */
function nqDoubleRiemann(f, a, b, c, d, m, n, corner){
  const dx = (b - a) / m, dy = (d - c) / n;
  let s = 0;
  const ox = corner === 'lower' ? 0 : corner === 'upper' ? 1 : 0.5;
  const oy = corner === 'lower' ? 0 : corner === 'upper' ? 1 : 0.5;
  for(let i = 0; i < m; i++) for(let j = 0; j < n; j++){
    const v = f(a + (i + ox) * dx, c + (j + oy) * dy);
    if(Number.isFinite(v)) s += v;
  }
  return s * dx * dy;
}

/* triple integral over a z-simple solid above a Type I region */
function nqTriple(f, a, b, g1, g2, h1, h2, k, panels){
  const kk = k || 4, pp = panels || 4;
  const mid = (x, y) => {
    const lo = h1(x, y), hi = h2(x, y);
    if(!Number.isFinite(lo) || !Number.isFinite(hi) || Math.abs(hi - lo) < 1e-14) return 0;
    return nqGauss(z => f(x, y, z), lo, hi, kk, pp);
  };
  return nqDoubleTypeI((x, y) => mid(x, y), a, b, g1, g2, kk, pp);
}
/* cylindrical: ∭ f · r dz dr dθ */
function nqTripleCyl(f, t0, t1, r1, r2, z1, z2, k, panels){
  const kk = k || 4, pp = panels || 4;
  const inner = th => nqGauss(r => {
    const lo = z1(r, th), hi = z2(r, th);
    if(!Number.isFinite(lo) || !Number.isFinite(hi)) return 0;
    return nqGauss(z => f(r * Math.cos(th), r * Math.sin(th), z), lo, hi, kk, pp) * r;
  }, r1(th), r2(th), kk, pp);
  return nqGauss(inner, t0, t1, kk, pp);
}
/* spherical: ∭ f · ρ² sinφ dρ dφ dθ, with φ measured from the +z axis */
function nqTripleSph(f, t0, t1, p1, p2, R1, R2, k, panels){
  const kk = k || 4, pp = panels || 4;
  const inner = th => nqGauss(ph => {
    const sp = Math.sin(ph), cp = Math.cos(ph);
    return nqGauss(rho => {
      const x = rho * sp * Math.cos(th), y = rho * sp * Math.sin(th), z = rho * cp;
      return f(x, y, z) * rho * rho * sp;
    }, R1(ph, th), R2(ph, th), kk, pp);
  }, p1(th), p2(th), kk, pp);
  return nqGauss(inner, t0, t1, kk, pp);
}

/* ------------------------------------------------------------ linear algebra ---- */
const nqDet2 = (a, b, c, d) => a * d - b * c;
function nqDet3(M){
  return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
       - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
       + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
}
function nqMat3Mul(A, B){
  const C = [[0,0,0],[0,0,0],[0,0,0]];
  for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++){
    let s = 0;
    for(let k = 0; k < 3; k++) s += A[i][k] * B[k][j];
    C[i][j] = s;
  }
  return C;
}
function nqMat3Vec(A, v){
  return v3(A[0][0]*v.x + A[0][1]*v.y + A[0][2]*v.z,
            A[1][0]*v.x + A[1][1]*v.y + A[1][2]*v.z,
            A[2][0]*v.x + A[2][1]*v.y + A[2][2]*v.z);
}
function nqInv3(M){
  const d = nqDet3(M);
  if(Math.abs(d) < 1e-14) return null;
  const c = (i, j) => {
    const r = [0,1,2].filter(k => k !== i), s = [0,1,2].filter(k => k !== j);
    const m = nqDet2(M[r[0]][s[0]], M[r[0]][s[1]], M[r[1]][s[0]], M[r[1]][s[1]]);
    return ((i + j) % 2 ? -m : m) / d;
  };
  /* transpose of the cofactor matrix */
  return [[c(0,0), c(1,0), c(2,0)], [c(0,1), c(1,1), c(2,1)], [c(0,2), c(1,2), c(2,2)]];
}
function nqSolve3(M, b){
  const I = nqInv3(M);
  return I ? nqMat3Vec(I, b) : null;
}

/* eigen-decomposition of a symmetric 2×2 [[a,b],[b,c]] — the Hessian test.
   Written in closed form: the discriminant of the second-derivative test is
   exactly the determinant, and the eigenvalues are what "concave in this
   direction" actually means. */
function nqEig2sym(a, b, c){
  const tr = a + c, det = a * c - b * b;
  const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  let v1, v2;
  if(Math.abs(b) > 1e-13){
    v1 = { x: l1 - c, y: b };
    v2 = { x: l2 - c, y: b };
  } else {
    /* already diagonal: the axes are the eigenvectors, and which is which
       depends on the ordering, not on an arbitrary choice */
    v1 = a >= c ? { x:1, y:0 } : { x:0, y:1 };
    v2 = a >= c ? { x:0, y:1 } : { x:1, y:0 };
  }
  const n1 = Math.hypot(v1.x, v1.y) || 1, n2 = Math.hypot(v2.x, v2.y) || 1;
  return { l1, l2, det, tr,
           v1:{ x:v1.x / n1, y:v1.y / n1 }, v2:{ x:v2.x / n2, y:v2.y / n2 } };
}

/* symmetric 3×3 by cyclic Jacobi — used by the quadric-surface classifier */
function nqEig3sym(M){
  let A = [[M[0][0], M[0][1], M[0][2]], [M[1][0], M[1][1], M[1][2]], [M[2][0], M[2][1], M[2][2]]];
  let V = [[1,0,0],[0,1,0],[0,0,1]];
  for(let sweep = 0; sweep < 40; sweep++){
    let off = 0;
    for(let i = 0; i < 3; i++) for(let j = i + 1; j < 3; j++) off += A[i][j] * A[i][j];
    if(off < 1e-24) break;
    for(let p = 0; p < 3; p++) for(let q = p + 1; q < 3; q++){
      if(Math.abs(A[p][q]) < 1e-18) continue;
      const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      const Ap = A.map(r => r.slice());
      for(let k = 0; k < 3; k++){
        Ap[p][k] = c * A[p][k] - s * A[q][k];
        Ap[q][k] = s * A[p][k] + c * A[q][k];
      }
      const A2 = Ap.map(r => r.slice());
      for(let k = 0; k < 3; k++){
        A2[k][p] = c * Ap[k][p] - s * Ap[k][q];
        A2[k][q] = s * Ap[k][p] + c * Ap[k][q];
      }
      A = A2;
      const V2 = V.map(r => r.slice());
      for(let k = 0; k < 3; k++){
        V2[k][p] = c * V[k][p] - s * V[k][q];
        V2[k][q] = s * V[k][p] + c * V[k][q];
      }
      V = V2;
    }
  }
  const idx = [0,1,2].sort((i, j) => A[j][j] - A[i][i]);
  return {
    l: idx.map(i => A[i][i]),
    v: idx.map(i => v3(V[0][i], V[1][i], V[2][i]))
  };
}

/* ------------------------------------------------------------ root finding ---- */
function nqBisect(f, a, b, tol, maxIt){
  let fa = f(a), fb = f(b);
  if(!Number.isFinite(fa) || !Number.isFinite(fb) || fa * fb > 0) return null;
  tol = tol || 1e-13;
  for(let i = 0; i < (maxIt || 200); i++){
    const m = (a + b) / 2, fm = f(m);
    if(Math.abs(b - a) < tol || fm === 0) return m;
    if(fa * fm <= 0){ b = m; fb = fm; } else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}
/* every sign change of f on a grid, refined — how the critical-point stage
   locates its own candidates instead of being told where they are */
function nqRoots(f, a, b, n, tol){
  const out = [], N = Math.max(8, n || 400), h = (b - a) / N;
  let prev = f(a);
  for(let i = 1; i <= N; i++){
    const x = a + i * h, cur = f(x);
    if(Number.isFinite(prev) && Number.isFinite(cur)){
      if(cur === 0) out.push(x);
      else if(prev * cur < 0){
        const r = nqBisect(f, x - h, x, tol);
        if(r !== null) out.push(r);
      }
    }
    prev = cur;
  }
  return out;
}
function nqNewton2(F, J, x0, y0, it){
  /* Newton for a 2-vector system: F(x,y) = 0 with Jacobian J(x,y) = [[a,b],[c,d]] */
  let x = x0, y = y0;
  for(let i = 0; i < (it || 60); i++){
    const f = F(x, y), M = J(x, y);
    const det = nqDet2(M[0][0], M[0][1], M[1][0], M[1][1]);
    if(!Number.isFinite(det) || Math.abs(det) < 1e-14) break;
    const dx = ( M[1][1] * f[0] - M[0][1] * f[1]) / det;
    const dy = (-M[1][0] * f[0] + M[0][0] * f[1]) / det;
    x -= dx; y -= dy;
    if(Math.hypot(dx, dy) < 1e-14) break;
  }
  return { x, y };
}

/* ---------------------------------------------------- numeric differentiation ---- */
/* Central differences with the step chosen for the usual round-off/truncation
   balance. Used only where a symbolic derivative is unavailable. */
const NQ_H1 = 1e-5, NQ_H2 = 1e-4;
const nqD1 = (f, x) => (f(x + NQ_H1) - f(x - NQ_H1)) / (2 * NQ_H1);
const nqD2 = (f, x) => (f(x + NQ_H2) - 2 * f(x) + f(x - NQ_H2)) / (NQ_H2 * NQ_H2);
const nqD4 = (f, x) => {
  const h = 3e-3;
  return (f(x - 2*h) - 4*f(x - h) + 6*f(x) - 4*f(x + h) + f(x + 2*h)) / (h*h*h*h);
};
const nqPx = (f, x, y) => (f(x + NQ_H1, y) - f(x - NQ_H1, y)) / (2 * NQ_H1);
const nqPy = (f, x, y) => (f(x, y + NQ_H1) - f(x, y - NQ_H1)) / (2 * NQ_H1);
const nqPxx = (f, x, y) => (f(x + NQ_H2, y) - 2 * f(x, y) + f(x - NQ_H2, y)) / (NQ_H2 * NQ_H2);
const nqPyy = (f, x, y) => (f(x, y + NQ_H2) - 2 * f(x, y) + f(x, y - NQ_H2)) / (NQ_H2 * NQ_H2);
const nqPxy = (f, x, y) => {
  const h = NQ_H2;
  return (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
};

/* the sup of |f⁽ᵏ⁾| on [a,b], sampled — this is the K in every textbook error
   bound, and printing a bound needs an honest K rather than a guessed one */
function nqMaxDeriv(f, a, b, order, n){
  const N = n || 200, D = order === 4 ? nqD4 : order === 2 ? nqD2 : nqD1;
  let m = 0;
  for(let i = 0; i <= N; i++){
    const v = Math.abs(D(f, a + (b - a) * i / N));
    if(Number.isFinite(v)) m = Math.max(m, v);
  }
  return m;
}

/* the observed convergence order: halve h, and see what the error does.
   log₂(E(h)/E(h/2)) is 1, 2 or 4 for the rules above, measured not asserted. */
function nqObservedOrder(f, a, b, n, rule, exact){
  const e1 = Math.abs(nqRiemann(f, a, b, n, rule) - exact);
  const e2 = Math.abs(nqRiemann(f, a, b, 2 * n, rule) - exact);
  if(!(e1 > 0) || !(e2 > 0)) return NaN;
  return Math.log2(e1 / e2);
}
