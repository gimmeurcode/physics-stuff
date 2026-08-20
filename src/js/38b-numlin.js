/* ============================================================================
   3e · NUMERICAL LINEAR ALGEBRA ENGINE  (Programme C wing C16, also gap B6)

   38-linalg.js solves systems the way a course does: reduce, read off, believe
   the answer. This module asks the question that course never gets to — what
   the answer is worth once the arithmetic is done in sixteen digits instead of
   in ℚ — and it is built so that every claim about that has a second route.

     factorisation   nlLU (with and without pivoting), nlHouseQR, nlGSQR
     conditioning    nlSVDJacobi, nlCond2, nlCondInf, nlKappaAttain
     iteration       nlIterMatrix, nlIterate, nlRhoGelfand, nlRhoPower
     Krylov          nlCG, nlSteepest, and the two bounds they are read against

   THE ONE DESIGN DECISION WORTH KNOWING. `laSVD` next door reaches the singular
   values through the eigenproblem of AᵀA, which is fine for teaching and wrong
   here: forming AᵀA SQUARES the condition number, so σ_min comes back with half
   the digits gone, and this wing is entirely about matrices where that matters.
   `nlSVDJacobi` is a one-sided Jacobi SVD — it rotates the columns of A itself
   and never forms a normal equation — which has high RELATIVE accuracy in the
   smallest σ. The two are deliberately both present: the stage compares them
   against a matrix whose singular values are known by construction, and the
   route that loses is the one the reader has been using all along.

   Prefix: nl
   ============================================================================ */

/* ---------------------------------------------------------------- norms ---- */
const nlNrm2 = v => Math.hypot(...v);
const nlNrmFro = A => Math.sqrt(A.reduce((s, r) => s + r.reduce((t, a) => t + a * a, 0), 0));
/* ‖A‖∞ is the largest row sum — the norm a hand-written error bound is usually
   stated in, because it costs n² where ‖A‖₂ needs the SVD. The 1-norm and the
   two vector norms beside it were written and then deleted unused; add one back
   when something actually calls it rather than because the set looks incomplete. */
const nlNrmInf = A => A.reduce((m, r) => Math.max(m, r.reduce((s, a) => s + Math.abs(a), 0)), 0);
function nlNrmMax(A){
  let m = 0;
  for(const r of A) for(const v of r) if(Math.abs(v) > m) m = Math.abs(v);
  return m;
}

/* ============================================================================
   LU with partial pivoting — PA = LU
   ============================================================================ */
/* `pivot === false` runs the same elimination with the pivot search removed, so
   a stage can show what pivoting is FOR rather than asserting that it helps.
   The growth factor is accumulated over the intermediate matrices, not read off
   the final U: that is the definition, and it is what appears in the backward
   error bound ‖E‖ ≤ c·n·ρ·ε‖A‖. */
function nlLU(A0, pivot){
  const n = A0.length;
  const U = laCopy(A0), L = laId(n);
  const perm = Array.from({ length:n }, (_, i) => i);
  const steps = [];
  const a0 = nlNrmMax(A0) || 1;
  /* the largest entry after each stage of the elimination, kept because the
     growth factor is a statement about the WHOLE sequence and a stage wants to
     draw the climb rather than quote its endpoint */
  const stageMax = [nlNrmMax(A0)];
  let umax = nlNrmMax(A0), swaps = 0;
  for(let k = 0; k < n - 1; k++){
    if(pivot !== false){
      let best = k, bv = Math.abs(U[k][k]);
      for(let i = k + 1; i < n; i++) if(Math.abs(U[i][k]) > bv){ bv = Math.abs(U[i][k]); best = i; }
      if(best !== k){
        const t = U[k]; U[k] = U[best]; U[best] = t;
        for(let j = 0; j < k; j++){ const s = L[k][j]; L[k][j] = L[best][j]; L[best][j] = s; }
        const p = perm[k]; perm[k] = perm[best]; perm[best] = p;
        swaps++;
        steps.push({ op:'swap', k, i:best, text:`R${k + 1} ↔ R${best + 1}` });
      }
    }
    const p = U[k][k];
    if(Math.abs(p) > 0){
      for(let i = k + 1; i < n; i++){
        const m = U[i][k] / p;
        L[i][k] = m;
        U[i][k] = 0;
        for(let j = k + 1; j < n; j++) U[i][j] -= m * U[k][j];
        if(m !== 0) steps.push({ op:'elim', i, k, m,
                                 text:`R${i + 1} → R${i + 1} − (${fmtNum(m, 4)})·R${k + 1}` });
      }
    }                                        // an exactly zero pivot leaves the column alone
    umax = Math.max(umax, nlNrmMax(U));
    stageMax.push(nlNrmMax(U));
  }
  let minPiv = Infinity, maxMult = 0;
  for(let i = 0; i < n; i++) minPiv = Math.min(minPiv, Math.abs(U[i][i]));
  for(let i = 0; i < n; i++) for(let j = 0; j < i; j++) maxMult = Math.max(maxMult, Math.abs(L[i][j]));
  return { L, U, perm, swaps, steps, n, growth:umax / a0, minPiv, maxMult, stageMax,
           singular:!(minPiv > 1e-14 * a0) };
}
/* the permutation as a matrix, so a panel can print PA = LU literally */
function nlPermMat(perm){
  const n = perm.length, P = laZeros(n, n);
  for(let i = 0; i < n; i++) P[i][perm[i]] = 1;
  return P;
}
const nlPermRows = (A, perm) => perm.map(i => A[i].slice());
/* the residual of the factorisation itself, against the size of A — the only
   honest way to read it, since ‖PA − LU‖ alone says nothing */
function nlLUResid(F, A){
  return { gap:laMaxDiff(nlPermRows(A, F.perm), laMul(F.L, F.U)), scale:nlNrmMax(A) };
}
/* forward substitution then back substitution. L has a unit diagonal by
   construction, so the first loop has no division in it at all. */
function nlLUSolve(F, b){
  const n = F.n;
  const y = new Array(n).fill(0), x = new Array(n).fill(0);
  for(let i = 0; i < n; i++){
    let s = b[F.perm[i]];
    for(let j = 0; j < i; j++) s -= F.L[i][j] * y[j];
    y[i] = s;
  }
  for(let i = n - 1; i >= 0; i--){
    let s = y[i];
    for(let j = i + 1; j < n; j++) s -= F.U[i][j] * x[j];
    x[i] = s / F.U[i][i];
  }
  return x;
}
/* det = (−1)^swaps ∏Uᵢᵢ — a second route to laDet, and the one every library
   uses, because the factorisation was going to be computed anyway */
const nlDetLU = F => F.U.reduce((p, r, i) => p * r[i], 1) * (F.swaps % 2 ? -1 : 1);

/* ============================================================================
   QR — three ways, which is the point
   ============================================================================ */
/* Householder. Each step reflects a column onto a multiple of e₁; the reflector
   is orthogonal to working precision WHATEVER the matrix, which is exactly why
   the orthogonality of the accumulated Q does not degrade with κ(A). */
function nlHouseQR(A0){
  const n = A0.length, m = A0[0].length;
  const R = laCopy(A0);
  const Q = laId(n);
  for(let k = 0; k < Math.min(m, n - 1); k++){
    let nrm = 0;
    for(let i = k; i < n; i++) nrm += R[i][k] * R[i][k];
    nrm = Math.sqrt(nrm);
    if(!(nrm > 0)) continue;
    /* the sign is not cosmetic: choosing −sign(x_k)‖x‖ makes v[k] a SUM of two
       like-signed terms, so the one subtraction that could cancel never does */
    const alpha = R[k][k] >= 0 ? -nrm : nrm;
    const v = new Array(n).fill(0);
    for(let i = k; i < n; i++) v[i] = R[i][k];
    v[k] -= alpha;
    let vv = 0;
    for(let i = k; i < n; i++) vv += v[i] * v[i];
    if(!(vv > 0)) continue;
    for(let j = k; j < m; j++){
      let s = 0;
      for(let i = k; i < n; i++) s += v[i] * R[i][j];
      s = 2 * s / vv;
      for(let i = k; i < n; i++) R[i][j] -= s * v[i];
    }
    for(let j = 0; j < n; j++){
      let s = 0;
      for(let i = k; i < n; i++) s += Q[j][i] * v[i];
      s = 2 * s / vv;
      for(let i = k; i < n; i++) Q[j][i] -= s * v[i];
    }
  }
  for(let i = 0; i < n; i++) for(let j = 0; j < Math.min(i, m); j++) R[i][j] = 0;
  return { Q, R, n, m };
}
/* Gram–Schmidt, in both spellings. They differ in ONE place: whether each
   projection is taken against the original column or against what is left of
   it. In exact arithmetic that is the same number; in floating point the first
   loses orthogonality like κ² and the second like κ, and the stage measures
   both slopes rather than quoting them. */
function nlGSQR(A0, modified){
  const n = A0.length, m = A0[0].length;
  const cols = laT(A0);
  const Qc = [], R = laZeros(m, m);
  for(let j = 0; j < m; j++){
    let v = cols[j].slice();
    if(modified){
      for(let i = 0; i < j; i++){
        const r = laDot(Qc[i], v);                                 // the running remainder
        R[i][j] = r;
        v = laSub(v, laScale(Qc[i], r));
      }
    } else {
      for(let i = 0; i < j; i++) R[i][j] = laDot(Qc[i], cols[j]);  // the original column
      for(let i = 0; i < j; i++) v = laSub(v, laScale(Qc[i], R[i][j]));
    }
    const nv = nlNrm2(v);
    R[j][j] = nv;
    Qc.push(nv > 0 ? laScale(v, 1 / nv) : new Array(n).fill(0));
  }
  return { Q:laT(Qc), R, n, m };
}
/* ‖QᵀQ − I‖ — how far from orthogonal the computed Q actually is */
function nlOrthErr(Q){
  const QtQ = laMul(laT(Q), Q);
  return laMaxDiff(QtQ, laId(QtQ.length));
}
/* least squares through QR: minimise ‖Ax − b‖ by solving Rx = Qᵀb on the first
   m rows. No normal equation is ever formed, which is the whole reason to do it
   this way — AᵀA has condition number κ², and this route has κ. */
function nlQRSolve(F, b){
  const m = F.m;
  const Qtb = laMatVec(laT(F.Q), b);
  const x = new Array(m).fill(0);
  for(let i = m - 1; i >= 0; i--){
    let s = Qtb[i];
    for(let j = i + 1; j < m; j++) s -= F.R[i][j] * x[j];
    x[i] = F.R[i][i] !== 0 ? s / F.R[i][i] : 0;
  }
  return x;
}

/* ============================================================================
   Singular values without a normal equation — one-sided Jacobi
   ============================================================================ */
/* Orthogonalise the COLUMNS of A by plane rotations. What is left has columns
   that are the σᵢuᵢ, so σ is a column norm and U is the normalised column: no
   AᵀA is ever formed and the smallest σ keeps its relative accuracy even when
   κ is 10¹⁴. That is the difference this wing exists to show. */
function nlSVDJacobi(A0, sweeps){
  const n = A0.length, m = A0[0].length;
  const B = laCopy(A0);
  const V = laId(m);
  const N = sweeps || 60;
  for(let sweep = 0; sweep < N; sweep++){
    let off = 0;
    for(let p = 0; p < m; p++) for(let q = p + 1; q < m; q++){
      let a = 0, b = 0, c = 0;
      for(let i = 0; i < n; i++){ a += B[i][p] * B[i][p]; b += B[i][q] * B[i][q]; c += B[i][p] * B[i][q]; }
      const s0 = Math.sqrt(a * b);
      if(!(s0 > 0) || Math.abs(c) <= 1e-17 * s0) continue;
      off = Math.max(off, Math.abs(c) / s0);
      const zeta = (b - a) / (2 * c);
      const t = Math.sign(zeta || 1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
      const cs = 1 / Math.sqrt(1 + t * t), sn = cs * t;
      for(let i = 0; i < n; i++){
        const bp = B[i][p], bq = B[i][q];
        B[i][p] = cs * bp - sn * bq; B[i][q] = sn * bp + cs * bq;
      }
      for(let i = 0; i < m; i++){
        const vp = V[i][p], vq = V[i][q];
        V[i][p] = cs * vp - sn * vq; V[i][q] = sn * vp + cs * vq;
      }
    }
    if(off < 1e-16) break;
  }
  const raw = [], idx = [];
  for(let j = 0; j < m; j++){
    let s = 0;
    for(let i = 0; i < n; i++) s += B[i][j] * B[i][j];
    raw.push(Math.sqrt(s)); idx.push(j);
  }
  idx.sort((x, y) => raw[y] - raw[x]);
  const sigma = idx.map(j => raw[j]);
  const U = laZeros(n, m), V2 = laZeros(m, m);
  idx.forEach((j, k) => {
    for(let i = 0; i < n; i++) U[i][k] = sigma[k] > 0 ? B[i][j] / sigma[k] : 0;
    for(let i = 0; i < m; i++) V2[i][k] = V[i][j];
  });
  const last = sigma[sigma.length - 1];
  return { sigma, U, V:V2, rank:sigma.filter(s => s > sigma[0] * 1e-15).length,
           cond:last > 0 ? sigma[0] / last : Infinity };
}
const nlCond2 = A => nlSVDJacobi(A).cond;
/* κ in the ∞-norm, which needs an inverse but no SVD. A different number from
   κ₂ — the norms differ — but the same order, and it is what a hand bound uses. */
function nlCondInf(A){
  const Ai = laInv(A);
  return Ai ? nlNrmInf(A) * nlNrmInf(Ai) : Infinity;
}

/* ============================================================================
   Test matrices — every one of them chosen because it breaks something
   ============================================================================ */
/* An exactly orthogonal matrix built from Givens rotations, so that a test
   matrix with PRESCRIBED singular values can be assembled. Rotations are used
   rather than a QR of something random on purpose: the QR routines are what is
   being measured, and a test matrix must not be built by the thing under test. */
function nlOrthGivens(n, seed){
  const rng = unRng(seed || 20260820);
  const Q = laId(n);
  for(let p = 0; p < n; p++) for(let q = p + 1; q < n; q++){
    const th = (rng() * 2 - 1) * Math.PI;
    const c = Math.cos(th), s = Math.sin(th);
    for(let i = 0; i < n; i++){
      const a = Q[i][p], b = Q[i][q];
      Q[i][p] = c * a - s * b; Q[i][q] = s * a + c * b;
    }
  }
  return Q;
}
/* A = U Σ Vᵀ with σᵢ spaced logarithmically from 1 down to 1/κ. The singular
   values are therefore KNOWN, which is what turns "these two routines disagree"
   into "this one is right and that one is not". */
function nlCondMat(n, kappa, seed){
  const U = nlOrthGivens(n, seed || 20260820);
  const V = nlOrthGivens(n, (seed || 20260820) + 977);
  const sigma = [];
  for(let i = 0; i < n; i++) sigma.push(n > 1 ? Math.pow(kappa, -i / (n - 1)) : 1);
  const A = laZeros(n, n);
  for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
    let s = 0;
    for(let k = 0; k < n; k++) s += U[i][k] * sigma[k] * V[j][k];
    A[i][j] = s;
  }
  return { A, sigma, U, V, kappa };
}
/* Hilbert. Hᵢⱼ = 1/(i+j+1): symmetric, positive definite, and the standard
   example of a matrix whose entries could not look more innocent. */
const nlHilbert = n => Array.from({ length:n }, (_, i) =>
  Array.from({ length:n }, (_, j) => 1 / (i + j + 1)));
/* The 1-D Poisson matrix, tridiagonal (−1, 2, −1). Its eigenvalues are known in
   closed form, so its condition number is known in closed form, and every
   iterative rate in this wing can be checked against an exact answer. */
const nlPoisson = n => Array.from({ length:n }, (_, i) =>
  Array.from({ length:n }, (_, j) => (i === j ? 2 : Math.abs(i - j) === 1 ? -1 : 0)));
const nlPoissonEig = (n, k) => 4 * Math.pow(Math.sin(k * Math.PI / (2 * (n + 1))), 2);
const nlPoissonCond = n => nlPoissonEig(n, n) / nlPoissonEig(n, 1);
/* Wilkinson's growth example: unit lower triangular with −1 below the diagonal
   and a column of 1s on the right. Partial pivoting never swaps a row — every
   pivot is already the largest available — and the last entry of U reaches
   2ⁿ⁻¹. It is the standing counterexample to "pivoting makes elimination safe". */
const nlGrowth = n => Array.from({ length:n }, (_, i) =>
  Array.from({ length:n }, (_, j) => (j === n - 1 ? 1 : i === j ? 1 : i > j ? -1 : 0)));

/* ============================================================================
   Conditioning, measured rather than bounded
   ============================================================================ */
/* The bound ‖δx‖/‖x‖ ≤ κ·‖δb‖/‖b‖ is SHARP, and this is the pair that attains
   it: b along u₁ (the direction A stretches most, so x is as short as possible)
   and δb along u_n (the direction A stretches least, so δx is as long as
   possible). Everything else in the wing quotes κ; this computes what actually
   happens and compares the two. */
function nlKappaAttain(A, eps){
  const S = nlSVDJacobi(A);
  const r = S.sigma.length - 1;
  const e = eps || 1e-8;
  const b = S.U.map(row => row[0]);
  const dir = S.U.map(row => row[r]);
  const b2 = b.map((v, i) => v + e * dir[i]);
  const F = nlLU(A);
  const x = nlLUSolve(F, b), x2 = nlLUSolve(F, b2);
  const dx = laSub(x2, x);
  const relIn = e * nlNrm2(dir) / nlNrm2(b);
  const relOut = nlNrm2(dx) / nlNrm2(x);
  return { kappa:S.cond, amp:relIn > 0 ? relOut / relIn : Infinity,
           relIn, relOut, b, db:dir.map(v => v * e), x, x2, sigma:S.sigma };
}
/* The distinction the whole subject turns on. A backward-stable solver returns
   an x whose RESIDUAL is at round-off — always, whatever the matrix — and says
   nothing about the ERROR, which is up to κ times larger. Both are returned so
   a panel can print them side by side and let the reader watch them disagree. */
function nlResidError(A, b, x, xTrue){
  const r = laSub(b, laMatVec(A, x));
  const nb = nlNrm2(b), nx = nlNrm2(x);
  const relResid = nlNrm2(r) / Math.max(1e-300, nlNrmInf(A) * nx);
  const relResidB = nlNrm2(r) / Math.max(1e-300, nb);
  const relErr = xTrue ? nlNrm2(laSub(x, xTrue)) / Math.max(1e-300, nlNrm2(xTrue)) : NaN;
  return { resid:r, relResid, relResidB, relErr, normResid:nlNrm2(r) };
}

/* ============================================================================
   Stationary iteration — Jacobi, Gauss–Seidel, SOR
   ============================================================================ */
/* x_{k+1} = G x_k + c, with M x_{k+1} = N x_k + b and A = M − N.
     Jacobi         M = D
     Gauss–Seidel   M = D + L
     SOR            M = D/ω + L
   The matrix G is formed here ONLY so its spectral radius can be computed; the
   iteration itself (nlIterate) never builds it, and sweeps the equations one at
   a time the way an implementation would. Two routes to the same rate. */
function nlIterMatrix(A, kind, omega){
  const n = A.length;
  const M = laZeros(n, n), N = laZeros(n, n);
  const w = omega === undefined ? 1 : omega;
  for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
    const a = A[i][j];
    if(kind === 'jacobi'){ if(i === j) M[i][j] = a; else N[i][j] = -a; }
    else if(kind === 'gs'){ if(j <= i) M[i][j] = a; else N[i][j] = -a; }
    else {                                            /* SOR */
      if(i === j){ M[i][j] = a / w; N[i][j] = a * (1 / w - 1); }
      else if(j < i) M[i][j] = a;
      else N[i][j] = -a;
    }
  }
  const Mi = laInv(M);
  if(!Mi) return null;
  return { G:laMul(Mi, N), M, N, Minv:Mi };
}
/* ρ(G) by Gelfand's formula, ‖Gᵐ‖^(1/m) → ρ, reached by repeated squaring with
   the norm factored out at every step.

   TWO things in here were got wrong first and are worth keeping written down.

   (a) The factoring out is not tidiness. ρ = 0.1 at m = 512 is 10⁻⁵¹², which
   underflows to zero, and the answer would then be 0 for every convergent
   iteration there is. Carrying the logarithm instead is the "store the quantity
   where it is small" rule from the relativity wing.

   (b) ‖Gᵐ‖^(1/m) converges to ρ, but SLOWLY and from above, because the norm
   carries a polynomial factor the exponent then takes the m-th root of:
   ‖Gᵐ‖ ≈ C·m^p·ρᵐ, with p > 0 exactly when the dominant eigenvalue is
   defective. Straight Gelfand at m = 1024 reported Jacobi's radius on the
   Poisson matrix 3.4×10⁻⁴ high — the Frobenius norm sees BOTH of ±cos(π/(n+1)),
   so C = √2 — and SOR at its optimum 8×10⁻³ high, because there the eigenvalues
   coalesce in pairs and p = 1. A tolerance loose enough to pass both would have
   been loose enough to hide a genuinely wrong radius.

   The cure is a second difference in the logarithm. With
   Lⱼ = ln‖G^(2ʲ)‖ = ln C + p·ln(2ʲ) + 2ʲ·ln ρ, the combination
   L₃ − 2L₂ + L₁ kills ln C and p·ln 2ʲ together — the spacing of ln m is
   uniform under doubling, which is what makes the polynomial term cancel — and
   leaves exactly m·ln ρ. Both biases go, whatever C and p are. */
function nlRhoGelfand(G, doublings){
  const D = doublings === undefined ? 10 : doublings;
  let M = laCopy(G);
  const s0 = nlNrmFro(M);
  if(!(s0 > 0)) return 0;                     // G = 0: the iteration is exact in one step
  M = M.map(r => r.map(v => v / s0));
  const L = [Math.log(s0)];                   // L[j] = ln‖G^(2ʲ)‖
  for(let k = 0; k < D; k++){
    const raw = laMul(M, M);
    const s = nlNrmFro(raw);
    if(!(s > 0)) return 0;                    // nilpotent: ρ is exactly zero
    M = raw.map(r => r.map(v => v / s));
    L.push(2 * L[L.length - 1] + Math.log(s));
  }
  const t = L.length;
  if(t < 3) return Math.exp(L[t - 1] / Math.pow(2, t - 1));
  const m = Math.pow(2, t - 3);
  return Math.exp((L[t - 1] - 2 * L[t - 2] + L[t - 3]) / m);
}
/* ρ(G) by power iteration — right whenever the dominant eigenvalue is real and
   simple, and quietly wrong when it is a complex pair, which is why it is never
   used alone here. The ratio's own drift is returned with it, so a caller can
   see the iteration failing to settle instead of trusting the last value. */
function nlRhoPower(G, iters, seed){
  const n = G.length;
  const rng = unRng(seed || 424243);
  let v = Array.from({ length:n }, () => rng() * 2 - 1);
  const N = iters || 400;
  let last = 0, drift = 0;
  for(let k = 0; k < N; k++){
    const w = laMatVec(G, v);
    const nw = nlNrm2(w);
    if(!(nw > 0)) return { rho:0, drift:0 };
    v = laScale(w, 1 / nw);
    if(k > N - 40) drift = Math.max(drift, Math.abs(nw - last) / Math.max(1e-300, nw));
    last = nw;
  }
  return { rho:last, drift };
}
/* The iteration itself, swept equation by equation. `xStar` is the direct
   solution, so the history carries the true ERROR rather than the residual —
   those two differ by exactly the factor this wing is about. */
function nlIterate(A, b, kind, omega, iters, x0, xStar){
  const n = A.length;
  const w = omega === undefined ? 1 : omega;
  let x = x0 ? x0.slice() : new Array(n).fill(0);
  const xs = xStar || nlLUSolve(nlLU(A), b);
  const nStar = nlNrm2(xs) || 1, nb = nlNrm2(b) || 1;
  const hist = [{ k:0, err:nlNrm2(laSub(x, xs)) / nStar,
                  resid:nlNrm2(laSub(b, laMatVec(A, x))) / nb }];
  const N = iters || 60;
  for(let k = 0; k < N; k++){
    if(kind === 'jacobi'){
      const xn = new Array(n).fill(0);
      for(let i = 0; i < n; i++){
        let s = b[i];
        for(let j = 0; j < n; j++) if(j !== i) s -= A[i][j] * x[j];
        xn[i] = s / A[i][i];
      }
      x = xn;
    } else {
      for(let i = 0; i < n; i++){
        let s = b[i];
        for(let j = 0; j < n; j++) if(j !== i) s -= A[i][j] * x[j];
        const xg = s / A[i][i];
        x[i] = kind === 'gs' ? xg : (1 - w) * x[i] + w * xg;
      }
    }
    const err = nlNrm2(laSub(x, xs)) / nStar;
    hist.push({ k:k + 1, err, resid:nlNrm2(laSub(b, laMatVec(A, x))) / nb });
    /* a divergent iteration is a legitimate result here, and it must be stopped
       before it becomes Infinity: a plot of ∞ is a blank plot, and the reader
       needs to SEE the climb rather than be told about it */
    if(!Number.isFinite(err) || err > 1e40) break;
  }
  return { x, hist, xStar:xs, kind, omega:w, diverged:!(hist[hist.length - 1].err < hist[0].err) };
}
/* The observed asymptotic factor: a straight-line fit to ln‖e_k‖ over the tail
   of the run, using only the stretch where the error is neither at its starting
   value nor at round-off. Below ~1e-12 the error is noise about the exact
   answer, and a fit through that measures the noise. */
function nlRateFit(hist, lo, hi){
  const l = lo === undefined ? 1e-12 : lo, h = hi === undefined ? 0.5 : hi;
  const pts = hist.filter(p => Number.isFinite(p.err) && p.err > l && p.err < h);
  if(pts.length < 4) return { rate:NaN, n:pts.length };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for(const p of pts){ const y = Math.log(p.err); sx += p.k; sy += y; sxx += p.k * p.k; sxy += p.k * y; }
  const nn = pts.length;
  const den = nn * sxx - sx * sx;
  if(!(Math.abs(den) > 0)) return { rate:NaN, n:nn };
  return { rate:Math.exp((nn * sxy - sx * sy) / den), n:nn, from:pts[0].k, to:pts[pts.length - 1].k };
}
/* Young's theorem, for a consistently ordered matrix: the best ω and the rate
   it achieves, both from the Jacobi radius alone. The 1-D Poisson matrix is
   consistently ordered, so these are exact there and the stage checks them. */
const nlSorOpt = muJ => 2 / (1 + Math.sqrt(Math.max(0, 1 - muJ * muJ)));
const nlSorRho = muJ => nlSorOpt(muJ) - 1;

/* ============================================================================
   Krylov — conjugate gradients
   ============================================================================ */
const nlAnorm = (A, v) => Math.sqrt(Math.max(0, laDot(v, laMatVec(A, v))));
/* Conjugate gradients on a symmetric positive definite A. The history carries
   the error in the A-norm, because that is the norm CG minimises at every step
   and the only one its bound is written in — reporting a 2-norm beside a bound
   proved for the A-norm would be comparing two different quantities. */
function nlCG(A, b, iters, x0, xStar){
  const n = A.length;
  let x = x0 ? x0.slice() : new Array(n).fill(0);
  const xs = xStar || nlLUSolve(nlLU(A), b);
  const e0 = nlAnorm(A, laSub(x, xs)) || 1;
  const nb = nlNrm2(b) || 1;
  let r = laSub(b, laMatVec(A, x));
  let p = r.slice();
  let rr = laDot(r, r);
  const hist = [{ k:0, err:1, resid:nlNrm2(r) / nb }];
  for(let k = 0; k < (iters || 40); k++){
    const Ap = laMatVec(A, p);
    const pAp = laDot(p, Ap);
    if(!(Math.abs(pAp) > 0) || !(rr > 0)) break;
    const alpha = rr / pAp;
    x = laAdd(x, laScale(p, alpha));
    r = laSub(r, laScale(Ap, alpha));
    const rr2 = laDot(r, r);
    hist.push({ k:k + 1, err:nlAnorm(A, laSub(x, xs)) / e0, resid:nlNrm2(r) / nb });
    p = laAdd(r, laScale(p, rr2 / rr));
    rr = rr2;
  }
  return { x, hist, xStar:xs, n };
}
/* Steepest descent: the same direction as CG's first move, and no memory of any
   earlier one. Kept beside CG because the difference between them is the whole
   idea of a Krylov method. */
function nlSteepest(A, b, iters, x0, xStar){
  let x = x0 ? x0.slice() : new Array(A.length).fill(0);
  const xs = xStar || nlLUSolve(nlLU(A), b);
  const e0 = nlAnorm(A, laSub(x, xs)) || 1;
  const nb = nlNrm2(b) || 1;
  const hist = [{ k:0, err:1, resid:nlNrm2(laSub(b, laMatVec(A, x))) / nb }];
  for(let k = 0; k < (iters || 40); k++){
    const r = laSub(b, laMatVec(A, x));
    const Ar = laMatVec(A, r);
    const d = laDot(r, Ar);
    if(!(Math.abs(d) > 0)) break;
    x = laAdd(x, laScale(r, laDot(r, r) / d));
    hist.push({ k:k + 1, err:nlAnorm(A, laSub(x, xs)) / e0,
                resid:nlNrm2(laSub(b, laMatVec(A, x))) / nb });
  }
  return { x, hist, xStar:xs };
}
/* The two textbook bounds, in the A-norm and relative to the starting error. */
const nlCGBound = (kappa, k) =>
  2 * Math.pow((Math.sqrt(kappa) - 1) / (Math.sqrt(kappa) + 1), k);
const nlSDBound = (kappa, k) => Math.pow((kappa - 1) / (kappa + 1), k);
