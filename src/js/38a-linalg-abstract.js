/* ============================================================================
   ABSTRACT LINEAR MAPS AND INNER PRODUCT SPACES
   Syllabus gap B3 (MASTER-PLAN §3.2). The linear-algebra wings do everything
   with arrows in the plane; a reader meets Fourier series and quantum states
   later and is asked to believe that functions are vectors. This is the
   module that earns it.

   Two ideas, each computed twice by routes that share nothing:

   1. A LINEAR MAP HAS A MATRIX, once a basis is chosen. On the polynomials of
      degree ≤ n with basis {1, x, …, xⁿ}, differentiation is a matrix of
      integers. Route A builds it column by column — apply the operator to
      each basis vector, read off the coordinates. Route B applies the
      operator symbolically to the whole polynomial (the site's own `diff`)
      and reads the coordinates of the answer. Matrix-times-vector against
      symbolic differentiation: no shared code, and for integer coefficients
      they must agree EXACTLY, not to a tolerance.

   2. AN INNER PRODUCT MAKES FUNCTIONS ORTHOGONAL. ⟨f,g⟩ = ∫ f g w dx is an
      inner product on functions exactly as a·b is on arrows, and everything
      built from a dot product survives: lengths, angles, Gram–Schmidt,
      projection, least squares. Gram–Schmidt on {1, x, x², …} under w = 1 on
      [−1,1] produces the Legendre polynomials, which the panel then checks
      against Rodrigues' formula — a closed form sharing nothing with the
      orthogonalisation. Under w = 1/√(1−x²) it produces the Chebyshev
      polynomials instead, and the same code does both, which is the point.

   All of this is DOM-free and lives below 50 so the unit suite can reach it.
   ============================================================================ */

/* ---- polynomials as coordinate vectors --------------------------------------
   A polynomial of degree ≤ n is the array [a₀, a₁, …, aₙ] of its coordinates
   in the basis {1, x, …, xⁿ}. That the array IS the polynomial is the whole
   content of "P_n is an n+1 dimensional vector space". */
const laPolyEval = (c, x) => c.reduce((s, a, i) => s + a * Math.pow(x, i), 0);
const laPolyTrim = c => { const d = c.slice(); while(d.length > 1 && Math.abs(d[d.length - 1]) < 1e-14) d.pop(); return d; };
function laPolyAdd(a, b){
  const n = Math.max(a.length, b.length), out = new Array(n).fill(0);
  for(let i = 0; i < n; i++) out[i] = (a[i] || 0) + (b[i] || 0);
  return out;
}
const laPolyScale = (a, k) => a.map(v => v * k);
function laPolyMulX(a){ return [0].concat(a); }
function laPolyDeriv(a){
  if(a.length <= 1) return [0];
  const out = new Array(a.length - 1);
  for(let i = 1; i < a.length; i++) out[i - 1] = a[i] * i;
  return out;
}
function laPolyIntegral(a){                       /* antiderivative, C = 0 */
  const out = new Array(a.length + 1).fill(0);
  for(let i = 0; i < a.length; i++) out[i + 1] = a[i] / (i + 1);
  return out;
}
/* pad or clip a coordinate vector to exactly n+1 entries */
const laPolyFit = (a, n) => { const o = new Array(n + 1).fill(0); for(let i = 0; i <= n && i < a.length; i++) o[i] = a[i]; return o; };

/* the operators the stage offers, each a map P_n → P_n */
const LA_OPS = {
  ddx:   { k:'ddx',   label:'d/dx',            tex:'d/dx',        apply:(c) => laPolyDeriv(c) },
  d2:    { k:'d2',    label:'d²/dx²',          tex:'d²/dx²',      apply:(c) => laPolyDeriv(laPolyDeriv(c)) },
  mulx:  { k:'mulx',  label:'multiply by x',   tex:'x·',          apply:(c) => laPolyMulX(c) },
  xddx:  { k:'xddx',  label:'x·d/dx',          tex:'x d/dx',      apply:(c) => laPolyMulX(laPolyDeriv(c)) },
  shift: { k:'shift', label:'p(x) → p(x+1)',   tex:'p(x+1)',      apply:(c) => laPolyShift(c, 1) },
  integ: { k:'integ', label:'∫₀ˣ (antiderivative)', tex:'∫₀ˣ',    apply:(c) => laPolyIntegral(c) }
};
/* p(x + h), by the binomial theorem — exact on integers */
function laPolyShift(c, h){
  const n = c.length, out = new Array(n).fill(0);
  const binom = (a, b) => { let r = 1; for(let i = 0; i < b; i++) r = r * (a - i) / (i + 1); return r; };
  for(let i = 0; i < n; i++)
    for(let j = 0; j <= i; j++)
      out[j] += c[i] * binom(i, i - j) * Math.pow(h, i - j);
  return out;
}
/* ROUTE A: the matrix of an operator, column by column from the basis.
   Column j is T(xʲ) written in coordinates — the definition, executed. */
function laOpMatrix(op, n){
  const T = (typeof op === 'function') ? op : LA_OPS[op].apply;
  const cols = [];
  for(let j = 0; j <= n; j++){
    const e = new Array(n + 1).fill(0); e[j] = 1;
    cols.push(laPolyFit(T(e), n));
  }
  /* rows, so M[i][j] is the coefficient of xⁱ in T(xʲ) */
  const M = [];
  for(let i = 0; i <= n; i++) M.push(cols.map(c => c[i]));
  return M;
}
/* rank and nullity from the RREF — and the theorem they must satisfy */
function laRankNullity(M){
  const { rank } = laRREF(M);
  const cols = M[0] ? M[0].length : 0;
  return { rank, nullity:cols - rank, dim:cols, holds:rank + (cols - rank) === cols };
}
/* the smallest k with Tᵏ = 0, or null if the map is not nilpotent */
function laNilpotency(M, max){
  const n = M.length, lim = max || (n + 2);
  let P = M.map(r => r.slice());
  const zero = A => A.every(r => r.every(v => Math.abs(v) < 1e-9));
  if(zero(P)) return 1;
  for(let k = 2; k <= lim; k++){
    P = laMul(P, M);
    if(zero(P)) return k;
  }
  return null;
}

/* ---- an inner product on functions ------------------------------------------
   ⟨f,g⟩ = ∫ₐᵇ f(x) g(x) w(x) dx. Gauss–Legendre on a fixed panel count is
   exact for polynomials up to high degree, which is what lets the Legendre
   check below be an equality rather than an approximation. The Chebyshev
   weight 1/√(1−x²) is integrably singular at both ends, so that one is done
   by the substitution x = cos θ, which removes the singularity exactly —
   the same trick the orthogonal-polynomial literature uses, and the reason
   its Gram–Schmidt agrees to round-off rather than to three figures. */
const LA_WEIGHTS = {
  legendre:  { k:'legendre',  label:'w = 1 on [−1, 1]',            a:-1, b:1, w:() => 1,
               family:'Legendre' },
  chebyshev: { k:'chebyshev', label:'w = 1/√(1−x²) on [−1, 1]',    a:-1, b:1, w:x => 1 / Math.sqrt(Math.max(1e-300, 1 - x * x)),
               family:'Chebyshev', cos:true },
  laguerre:  { k:'laguerre',  label:'w = e^(−x) on [0, 8]',        a:0,  b:8, w:x => Math.exp(-x),
               family:'Laguerre (truncated)' },
  unit:      { k:'unit',      label:'w = 1 on [0, 1]',             a:0,  b:1, w:() => 1,
               family:'shifted Legendre' }
};
function laInner(f, g, W, n){
  const N = n || 12;
  if(W.cos){
    /* x = cos θ turns ∫f g /√(1−x²) dx into ∫f g dθ on [0, π] — no singularity */
    return nqGauss(t => f(Math.cos(t)) * g(Math.cos(t)), 0, Math.PI, 5, N);
  }
  return nqGauss(x => f(x) * g(x) * W.w(x), W.a, W.b, 5, N);
}
const laFnNorm = (f, W, n) => Math.sqrt(Math.max(0, laInner(f, f, W, n)));
/* Gram–Schmidt on the monomials, in FUNCTION space: subtract the shadow, as
   in the plane, with the dot product replaced by the integral. */
function laFnGramSchmidt(deg, W, n){
  const basis = [];
  for(let k = 0; k <= deg; k++){
    let c = new Array(k + 1).fill(0); c[k] = 1;         // xᵏ
    for(const q of basis){
      const num = laInner(x => laPolyEval(c, x), x => laPolyEval(q.c, x), W, n);
      c = laPolyAdd(laPolyFit(c, deg), laPolyScale(laPolyFit(q.c, deg), -num));
    }
    const nrm = laFnNorm(x => laPolyEval(c, x), W, n);
    basis.push({ k, c:nrm > 1e-300 ? laPolyScale(c, 1 / nrm) : c, norm:nrm });
  }
  return basis;
}
/* the Gram matrix of a basis — diagonal exactly when the basis is orthogonal,
   which is how "orthogonal" gets MEASURED rather than asserted */
function laFnGram(basis, W, n){
  return basis.map(p => basis.map(q => laInner(x => laPolyEval(p.c, x), x => laPolyEval(q.c, x), W, n)));
}
const laGramOffDiag = G => {
  let worst = 0;
  for(let i = 0; i < G.length; i++) for(let j = 0; j < G.length; j++)
    if(i !== j) worst = Math.max(worst, Math.abs(G[i][j]));
  return worst;
};
/* Legendre by RODRIGUES' formula — a closed form that shares nothing with
   Gram–Schmidt, so the two agreeing is evidence rather than bookkeeping.
   Pₙ(x) = (1/2ⁿ n!) dⁿ/dxⁿ (x²−1)ⁿ, built exactly in integer arithmetic. */
function laLegendreP(n){
  let c = [1];
  for(let i = 0; i < n; i++){                     // (x²−1)ⁿ
    const t = new Array(c.length + 2).fill(0);
    for(let j = 0; j < c.length; j++){ t[j + 2] += c[j]; t[j] -= c[j]; }
    c = t;
  }
  for(let i = 0; i < n; i++) c = laPolyDeriv(c);  // differentiate n times
  let f = 1; for(let i = 2; i <= n; i++) f *= i;  // n!
  return laPolyScale(c, 1 / (Math.pow(2, n) * f));
}
/* the same polynomial normalised in the L² sense, for comparison with
   Gram–Schmidt's output: ‖Pₙ‖² = 2/(2n+1) on [−1,1] */
const laLegendreUnit = n => laPolyScale(laLegendreP(n), Math.sqrt((2 * n + 1) / 2));
/* Chebyshev Tₙ by its own recurrence — again independent of Gram–Schmidt */
function laChebyshevT(n){
  let a = [1], b = [0, 1];
  if(n === 0) return a;
  for(let k = 2; k <= n; k++){ const t = laPolyAdd(laPolyScale(laPolyMulX(b), 2), laPolyScale(a, -1)); a = b; b = t; }
  return b;
}
/* PROJECTION is the same operation it was for arrows: the best approximation
   in an inner-product space is the sum of the shadows on an orthonormal
   basis. `best` is what a Fourier series is, one basis later. */
function laFnProject(f, basis, W, n){
  const coef = basis.map(p => laInner(f, x => laPolyEval(p.c, x), W, n));
  const c = coef.reduce((acc, a, i) => laPolyAdd(acc, laPolyScale(basis[i].c, a)), [0]);
  const err = laFnNorm(x => f(x) - laPolyEval(c, x), W, n);
  return { coef, c, err, fnorm:laFnNorm(f, W, n) };
}
/* Bessel's inequality / Parseval's identity, measured: Σaᵢ² ≤ ‖f‖², with
   equality exactly when the basis spans f. The gap IS the squared error. */
function laParseval(P){
  const sum = P.coef.reduce((s, a) => s + a * a, 0);
  return { sum, fsq:P.fnorm * P.fnorm, gap:P.fnorm * P.fnorm - sum, errsq:P.err * P.err };
}
