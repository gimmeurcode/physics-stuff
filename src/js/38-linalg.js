/* ============================================================================
   3d · LINEAR ALGEBRA ENGINE
   Dense, small, and deliberately explicit: every routine records the steps it
   took so a stage can *show* the elimination rather than assert its result.
   Pure functions, no DOM — unit-tested with the rest of the engines.

   Prefix: la
   ============================================================================ */

const laZeros = (r, c) => Array.from({ length:r }, () => new Array(c).fill(0));
const laId = n => Array.from({ length:n }, (_, i) => Array.from({ length:n }, (_, j) => (i === j ? 1 : 0)));
const laCopy = M => M.map(r => r.slice());
const laT = M => M[0].map((_, j) => M.map(r => r[j]));
const laDims = M => [M.length, M[0].length];

function laMul(A, B){
  const [n, m] = laDims(A), [m2, p] = laDims(B);
  if(m !== m2) throw new Error(`cannot multiply ${n}×${m} by ${m2}×${p}`);
  const C = laZeros(n, p);
  for(let i = 0; i < n; i++) for(let k = 0; k < m; k++){
    const a = A[i][k];
    if(a === 0) continue;
    for(let j = 0; j < p; j++) C[i][j] += a * B[k][j];
  }
  return C;
}
const laMatVec = (A, v) => A.map(r => r.reduce((s, a, j) => s + a * v[j], 0));
const laDot = (u, v) => u.reduce((s, a, i) => s + a * v[i], 0);
const laNorm = v => Math.hypot(...v);
const laScale = (v, s) => v.map(a => a * s);
const laSub = (u, v) => u.map((a, i) => a - v[i]);
const laAdd = (u, v) => u.map((a, i) => a + v[i]);
/* the largest entry of A − B: how every "these are equal" claim is checked */
function laMaxDiff(A, B){
  let m = 0;
  for(let i = 0; i < A.length; i++) for(let j = 0; j < A[0].length; j++)
    m = Math.max(m, Math.abs(A[i][j] - B[i][j]));
  return m;
}

/* ---------------------------------------------------------------------------
   Row reduction. The whole of the first half of a linear-algebra course is
   this routine, so it keeps a transcript: every swap, scale and elimination in
   order, which a stage replays one step at a time.
   --------------------------------------------------------------------------- */
function laRREF(M0, tol){
  const eps = tol === undefined ? 1e-11 : tol;
  const R = laCopy(M0);
  const [n, m] = laDims(R);
  const steps = [], pivots = [];
  let row = 0, swaps = 0;
  for(let col = 0; col < m && row < n; col++){
    /* partial pivoting: the largest entry in the column is the safe pivot */
    let best = row, bv = Math.abs(R[row][col]);
    for(let i = row + 1; i < n; i++) if(Math.abs(R[i][col]) > bv){ bv = Math.abs(R[i][col]); best = i; }
    if(bv < eps){ for(let i = row; i < n; i++) R[i][col] = 0; continue; }
    if(best !== row){
      const t = R[best]; R[best] = R[row]; R[row] = t;
      swaps++;
      steps.push({ op:'swap', a:row, b:best, M:laCopy(R), text:`R${row+1} ↔ R${best+1}` });
    }
    const p = R[row][col];
    if(Math.abs(p - 1) > eps){
      for(let j = 0; j < m; j++) R[row][j] /= p;
      steps.push({ op:'scale', a:row, k:1/p, M:laCopy(R), text:`R${row+1} → R${row+1} / ${fmtNum(p, 4)}` });
    }
    for(let i = 0; i < n; i++){
      if(i === row) continue;
      const f = R[i][col];
      if(Math.abs(f) < eps) continue;
      for(let j = 0; j < m; j++) R[i][j] -= f * R[row][j];
      steps.push({ op:'elim', a:i, b:row, k:-f, M:laCopy(R),
                   text:`R${i+1} → R${i+1} − (${fmtNum(f, 4)})·R${row+1}` });
    }
    pivots.push(col);
    row++;
  }
  /* tidy up −0 so the display never shows a negative zero */
  for(let i = 0; i < n; i++) for(let j = 0; j < m; j++) if(R[i][j] === 0) R[i][j] = 0;
  return { R, steps, pivots, rank:pivots.length, swaps };
}

const laRank = M => laRREF(M).rank;

/* Determinant by the same elimination — the product of the pivots, with a sign
   from the swaps. Computing it this way rather than by cofactors is the point:
   it is O(n³) and it is what row operations do to volume. */
function laDet(M){
  const [n, m] = laDims(M);
  if(n !== m) throw new Error('determinant needs a square matrix');
  const A = laCopy(M);
  let det = 1;
  for(let col = 0; col < n; col++){
    let best = col, bv = Math.abs(A[col][col]);
    for(let i = col + 1; i < n; i++) if(Math.abs(A[i][col]) > bv){ bv = Math.abs(A[i][col]); best = i; }
    if(bv < 1e-14) return 0;
    if(best !== col){ const t = A[best]; A[best] = A[col]; A[col] = t; det = -det; }
    det *= A[col][col];
    for(let i = col + 1; i < n; i++){
      const f = A[i][col] / A[col][col];
      for(let j = col; j < n; j++) A[i][j] -= f * A[col][j];
    }
  }
  return det;
}

/* Inverse by reducing [A | I]; returns null for a singular matrix rather than
   throwing, because "there isn't one" is the interesting answer. */
function laInv(M){
  const [n, m] = laDims(M);
  if(n !== m) return null;
  const aug = M.map((r, i) => r.concat(laId(n)[i]));
  const { R, pivots } = laRREF(aug);
  /* The rank of the AUGMENTED matrix is not the test: a singular A leaves a row
     of zeros on the left, and elimination then finds a pivot over in the
     identity block, which would report full rank. A is invertible only when
     every pivot lies in the first n columns — i.e. the pivots are 0…n−1. */
  if(pivots.length !== n || pivots.some((c, i) => c !== i)) return null;
  return R.map(r => r.slice(n));
}

function laSolve(A, b){
  const aug = A.map((r, i) => r.concat([b[i]]));
  const { R, pivots, rank } = laRREF(aug);
  const m = A[0].length;
  /* a pivot in the augmented column means 0 = 1 somewhere */
  if(pivots.includes(m)) return { kind:'none', x:null, rank };
  const x = new Array(m).fill(0);
  pivots.forEach((c, i) => { x[c] = R[i][m]; });
  const free = [];
  for(let j = 0; j < m; j++) if(!pivots.includes(j)) free.push(j);
  return { kind:free.length ? 'many' : 'unique', x, free, rank, nullity:free.length };
}

/* A basis for the null space, one vector per free column — the standard
   construction, and the one that makes rank + nullity = n visible. */
function laNullBasis(M){
  const m = M[0].length;
  const { R, pivots } = laRREF(M);
  const basis = [];
  for(let j = 0; j < m; j++){
    if(pivots.includes(j)) continue;
    const v = new Array(m).fill(0);
    v[j] = 1;
    pivots.forEach((c, i) => { v[c] = -R[i][j]; });
    basis.push(v);
  }
  return basis;
}
/* Cramer's rule — kept because the syllabus asks for it, and because comparing
   its cost with elimination is the lesson. */
function laCramer(A, b){
  const n = A.length, d = laDet(A);
  if(Math.abs(d) < 1e-14) return { det:d, x:null };
  const x = [];
  for(let j = 0; j < n; j++){
    const Aj = A.map((r, i) => r.map((v, k) => (k === j ? b[i] : v)));
    x.push(laDet(Aj) / d);
  }
  return { det:d, x };
}

/* ---------------------------------------------------------------------------
   Orthogonality
   --------------------------------------------------------------------------- */
/* Classical Gram–Schmidt, run twice per vector. The reorthogonalisation is not
   decoration: run once, the computed vectors lose orthogonality badly on nearly
   dependent input, and the stage's "check QᵀQ = I" readout would show it. */
function laGramSchmidt(vs, tol){
  const eps = tol === undefined ? 1e-10 : tol;
  const Q = [], steps = [];
  for(const v0 of vs){
    let v = v0.slice();
    const proj = [];
    for(let pass = 0; pass < 2; pass++){
      for(const q of Q){
        const c = laDot(v, q);
        if(pass === 0) proj.push(c);
        v = laSub(v, laScale(q, c));
      }
    }
    const n = laNorm(v);
    steps.push({ v0, proj, resid:v.slice(), norm:n });
    if(n > eps) Q.push(laScale(v, 1 / n));
  }
  return { Q, steps };
}
/* projection of b onto the span of the columns of A */
function laProject(A, b){
  const { Q } = laGramSchmidt(laT(A));
  let p = new Array(b.length).fill(0);
  for(const q of Q) p = laAdd(p, laScale(q, laDot(b, q)));
  return p;
}
/* least squares by the normal equations AᵀA x̂ = Aᵀb */
function laLeastSquares(A, b){
  const At = laT(A);
  const AtA = laMul(At, A), Atb = laMatVec(At, b);
  const sol = laSolve(AtA, Atb);
  if(!sol.x) return { x:null };
  const fit = laMatVec(A, sol.x);
  const resid = laSub(b, fit);
  return { x:sol.x, fit, resid, rss:laDot(resid, resid),
           /* the residual must be orthogonal to every column — that IS the
              normal equation, so printing it is the proof */
           orth:At.map(col => laDot(col, resid)) };
}

/* ---------------------------------------------------------------------------
   Eigenvalues
   --------------------------------------------------------------------------- */
/* Symmetric case: the cyclic Jacobi rotation method. It converges for every
   symmetric matrix, returns orthonormal eigenvectors by construction, and each
   sweep is a rotation a stage can draw. */
function laEigSym(M0, iters){
  const n = M0.length;
  let A = laCopy(M0), V = laId(n);
  const N = iters || 100;
  for(let sweep = 0; sweep < N; sweep++){
    let off = 0;
    for(let i = 0; i < n; i++) for(let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if(off < 1e-24) break;
    for(let p = 0; p < n; p++) for(let q = p + 1; q < n; q++){
      if(Math.abs(A[p][q]) < 1e-18) continue;
      const theta = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for(let k = 0; k < n; k++){
        const akp = A[k][p], akq = A[k][q];
        A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
      }
      for(let k = 0; k < n; k++){
        const apk = A[p][k], aqk = A[q][k];
        A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
      }
      for(let k = 0; k < n; k++){
        const vkp = V[k][p], vkq = V[k][q];
        V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
      }
    }
  }
  const pairs = A.map((r, i) => ({ value:r[i], vector:V.map(row => row[i]) }));
  pairs.sort((a, b) => b.value - a.value);
  return { values:pairs.map(p => p.value), vectors:pairs.map(p => p.vector) };
}

/* General 2×2, including the complex pair that makes a phase-plane spiral. */
function laEig2(M){
  const [[a, b], [c, d]] = M;
  const tr = a + d, det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  if(disc >= 0){
    const s = Math.sqrt(disc);
    const l1 = (tr + s) / 2, l2 = (tr - s) / 2;
    const vec = l => {
      /* (A − λI)v = 0; take whichever row is not degenerate */
      if(Math.abs(b) > 1e-12) return [b, l - a];
      if(Math.abs(c) > 1e-12) return [l - d, c];
      return l === a ? [1, 0] : [0, 1];
    };
    const nrm = v => { const n = laNorm(v) || 1; return [v[0] / n, v[1] / n]; };
    return { real:true, values:[l1, l2], vectors:[nrm(vec(l1)), nrm(vec(l2))], tr, det, disc };
  }
  const re = tr / 2, im = Math.sqrt(-disc) / 2;
  return { real:false, re, im, values:[{ re, im }, { re, im:-im }], tr, det, disc };
}

/* det(A − λI) evaluated at one λ, so a stage can plot the characteristic
   polynomial and show the eigenvalues as its roots rather than announcing them.
   Evaluated rather than expanded into coefficients: this works at any size. */
const laCharAt = (M, l) => laDet(M.map((r, i) => r.map((v, j) => v - (i === j ? l : 0))));

/* Diagonalisation A = P D P⁻¹ where it exists. Returns the reconstruction error
   so the claim is checked rather than made. */
function laDiagonalize(M){
  const n = M.length;
  const sym = laMaxDiff(M, laT(M)) < 1e-10;
  let vals, vecs;
  if(sym){ const e = laEigSym(M); vals = e.values; vecs = e.vectors; }
  else if(n === 2){
    const e = laEig2(M);
    if(!e.real) return { ok:false, why:'complex eigenvalues — not diagonalisable over ℝ', eig:e };
    vals = e.values; vecs = e.vectors;
  } else return { ok:false, why:'this stage diagonalises symmetric matrices and 2×2 matrices' };
  const P = laT(vecs);
  const Pi = laInv(P);
  if(!Pi) return { ok:false, why:'eigenvectors are dependent — defective, not diagonalisable', vals };
  const D = vals.map((l, i) => vals.map((_, j) => (i === j ? l : 0)));
  const back = laMul(laMul(P, D), Pi);
  return { ok:true, P, D, Pi, values:vals, vectors:vecs, err:laMaxDiff(back, M), sym };
}

/* Positive definiteness, decided two independent ways so they can be compared:
   every eigenvalue positive, and every leading minor positive (Sylvester). */
function laPosDef(M){
  const e = laEigSym(M);
  const minors = [];
  for(let k = 1; k <= M.length; k++)
    minors.push(laDet(M.slice(0, k).map(r => r.slice(0, k))));
  return { values:e.values, minors,
           byEig:e.values.every(v => v > 1e-12),
           bySylvester:minors.every(v => v > 1e-12) };
}

/* SVD through the eigenproblem of AᵀA. Singular values are the square roots of
   its eigenvalues; V is its eigenvectors; each uᵢ = A vᵢ / σᵢ. Exact enough for
   teaching, and the reconstruction error is reported so nothing is taken on
   trust. */
function laSVD(A){
  const [n, m] = laDims(A);
  const At = laT(A);
  const E = laEigSym(laMul(At, A));
  const sig = E.values.map(v => Math.sqrt(Math.max(0, v)));
  const V = E.vectors;
  const U = [];
  for(let i = 0; i < sig.length; i++){
    if(sig[i] > 1e-11) U.push(laScale(laMatVec(A, V[i]), 1 / sig[i]));
    else U.push(new Array(n).fill(0));
  }
  const r = sig.filter(s => s > 1e-11).length;
  /* rebuild A = Σ σᵢ uᵢ vᵢᵀ and report the worst entry of the difference */
  const back = laZeros(n, m);
  for(let k = 0; k < r; k++)
    for(let i = 0; i < n; i++) for(let j = 0; j < m; j++)
      back[i][j] += sig[k] * U[k][i] * V[k][j];
  return { sigma:sig, U, V, rank:r, err:laMaxDiff(back, A),
           cond:sig[0] / (sig[r - 1] || Infinity) };
}

/* similarity: B = P⁻¹AP shares trace, determinant and characteristic polynomial */
function laSimilar(A, P){
  const Pi = laInv(P);
  if(!Pi) return null;
  const B = laMul(laMul(Pi, A), P);
  const tr = M => M.reduce((s, r, i) => s + r[i], 0);
  return { B, trA:tr(A), trB:tr(B), detA:laDet(A), detB:laDet(B) };
}
