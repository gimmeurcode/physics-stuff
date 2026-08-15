/* ============================================================================
   3h · DIFFERENTIAL FORMS, POTENTIAL THEORY AND THE HELMHOLTZ DECOMPOSITION
   The claim this floor exists to make: gradient, curl and divergence are not
   three unrelated operators but one operator — the exterior derivative — acting
   on objects of different degree. Once that is seen, Green, Stokes and the
   divergence theorem stop being three theorems and become one.

   Prefix: df
   ============================================================================ */

/* ---- the exterior derivative, degree by degree, in three dimensions -------
   0-form  f            →  df   = (f_x, f_y, f_z)                  gradient
   1-form  P dx+Q dy+R dz →  dω = curl components                  curl
   2-form  A dy∧dz + …    →  dω = (A_x+B_y+C_z) dx∧dy∧dz           divergence
   3-form                 →  0                                     (nothing left)
   Each is the same construction; only the degree differs. d∘d = 0 in every case,
   and that single identity contains curl(grad) = 0 and div(curl) = 0. */
const DF_H = 1e-5;
function dfD0(f, x, y, z){                       // gradient of a 0-form
  const h = DF_H;
  return [ (f(x + h, y, z) - f(x - h, y, z)) / (2 * h),
           (f(x, y + h, z) - f(x, y - h, z)) / (2 * h),
           (f(x, y, z + h) - f(x, y, z - h)) / (2 * h) ];
}
function dfD1(P, Q, R, x, y, z){                 // curl of a 1-form
  const h = DF_H, d = (g, ax) => {
    const p = [x, y, z].slice(); const m = [x, y, z].slice();
    p[ax] += h; m[ax] -= h;
    return (g(p[0], p[1], p[2]) - g(m[0], m[1], m[2])) / (2 * h);
  };
  return [ d(R, 1) - d(Q, 2), d(P, 2) - d(R, 0), d(Q, 0) - d(P, 1) ];
}
function dfD2(A, B, C, x, y, z){                 // divergence of a 2-form
  const h = DF_H, d = (g, ax) => {
    const p = [x, y, z].slice(); const m = [x, y, z].slice();
    p[ax] += h; m[ax] -= h;
    return (g(p[0], p[1], p[2]) - g(m[0], m[1], m[2])) / (2 * h);
  };
  return d(A, 0) + d(B, 1) + d(C, 2);
}
/* the wedge of two 1-forms, whose components are exactly the cross product —
   which is why the cross product only exists in three dimensions */
const dfWedge = (u, v) => [ u[1] * v[2] - u[2] * v[1],
                            u[2] * v[0] - u[0] * v[2],
                            u[0] * v[1] - u[1] * v[0] ];
/* The Hodge star in 3D sends a 1-form to the 2-form with the same components,
   and that identification is the *only* reason a curl can be treated as a
   vector at all. In n dimensions curl is a 2-form and has n(n−1)/2 components —
   3 when n = 3, which is the coincidence the whole of vector calculus rests on. */
const dfHodge1to2 = u => u.slice();
const dfHodge0to3 = f => f;
const dfStarComponents = n => n * (n - 1) / 2;

/* d∘d = 0, measured rather than asserted, at a point */
function dfDDzero(f, x, y, z){
  const g = (a, b, c) => dfD0(f, a, b, c);
  const c = dfD1((a, b, cc) => g(a, b, cc)[0], (a, b, cc) => g(a, b, cc)[1],
                 (a, b, cc) => g(a, b, cc)[2], x, y, z);
  return Math.hypot(c[0], c[1], c[2]);            // curl of a gradient
}
function dfDivCurl(P, Q, R, x, y, z){
  const c = (a, b, cc) => dfD1(P, Q, R, a, b, cc);
  return dfD2((a, b, cc) => c(a, b, cc)[0], (a, b, cc) => c(a, b, cc)[1],
              (a, b, cc) => c(a, b, cc)[2], x, y, z);
}

/* ---- harmonic functions and the Laplacian -------------------------------- */
function dfLaplacian(f, x, y){
  const h = 1e-4;
  return (f(x + h, y) + f(x - h, y) + f(x, y + h) + f(x, y - h) - 4 * f(x, y)) / (h * h);
}
/* The mean value property: a harmonic function's value at a point equals its
   average over any circle centred there. This is the property, not a corollary —
   it is equivalent to being harmonic, and it is why harmonic functions have no
   interior maxima. */
function dfCircleMean(f, x, y, r, n){
  const N = n || 720;
  let s = 0;
  for(let i = 0; i < N; i++){
    const t = 2 * Math.PI * i / N;
    s += f(x + r * Math.cos(t), y + r * Math.sin(t));
  }
  return s / N;
}
/* What the circle average exceeds the centre value BY, when f is not harmonic:
   Green's representation on the disc gives
     mean − centre = (1/2π) ∬_disc ∇²f · log(r/ρ) dA,   ρ = distance from centre.
   For constant Laplacian this is ∇²f·r²/4 (the bowl's exact gap); for anything
   typed it is a second, independent route to the same number the circle
   quadrature measures — so the "difference" row can compare two computations
   instead of printing a gap with nothing to read it against. The log kernel is
   integrable (ρ·log(r/ρ) → 0 at the centre) and midpoint sampling in both
   directions handles it. */
function dfDiscLapAvg(f, x, y, r, nr, nt){
  const NR = nr || 32, NT = nt || 48;
  let s = 0;
  for(let i = 0; i < NR; i++){
    const rho = r * (i + 0.5) / NR;
    const w = rho * Math.log(r / rho);
    let ring = 0;
    for(let j = 0; j < NT; j++){
      const t = 2 * Math.PI * (j + 0.5) / NT;
      const v = dfLaplacian(f, x + rho * Math.cos(t), y + rho * Math.sin(t));
      if(Number.isFinite(v)) ring += v;
    }
    s += w * (ring / NT);
  }
  return s * (r / NR);
}

/* ---- Green's identities, verified numerically ----------------------------
   ∮ (f ∇g)·n̂ ds = ∬ (f ∇²g + ∇f·∇g) dA          (the first identity)
   ∮ (f∇g − g∇f)·n̂ ds = ∬ (f∇²g − g∇²f) dA       (the second)
   Both are the product rule plus the divergence theorem, and both are checked
   here on a circle by computing each side independently. */
function dfGreen1(f, g, cx0, cy0, R, n){
  const N = n || 720;
  let flux = 0;
  for(let i = 0; i < N; i++){
    const t = 2 * Math.PI * (i + 0.5) / N;
    const x = cx0 + R * Math.cos(t), y = cy0 + R * Math.sin(t);
    const gg = [ (g(x + DF_H, y) - g(x - DF_H, y)) / (2 * DF_H),
                 (g(x, y + DF_H) - g(x, y - DF_H)) / (2 * DF_H) ];
    flux += f(x, y) * (gg[0] * Math.cos(t) + gg[1] * Math.sin(t));
  }
  flux *= 2 * Math.PI * R / N;
  /* the area integral, in polar coordinates */
  let area = 0;
  const NR = 160, NT = 240;
  for(let i = 0; i < NR; i++) for(let j = 0; j < NT; j++){
    const r = R * (i + 0.5) / NR, t = 2 * Math.PI * (j + 0.5) / NT;
    const x = cx0 + r * Math.cos(t), y = cy0 + r * Math.sin(t);
    const gf = [ (f(x + DF_H, y) - f(x - DF_H, y)) / (2 * DF_H),
                 (f(x, y + DF_H) - f(x, y - DF_H)) / (2 * DF_H) ];
    const gg = [ (g(x + DF_H, y) - g(x - DF_H, y)) / (2 * DF_H),
                 (g(x, y + DF_H) - g(x, y - DF_H)) / (2 * DF_H) ];
    area += (f(x, y) * dfLaplacian(g, x, y) + gf[0] * gg[0] + gf[1] * gg[1]) *
            r * (R / NR) * (2 * Math.PI / NT);
  }
  return { flux, area, diff:Math.abs(flux - area) };
}

/* ---- the Helmholtz decomposition -----------------------------------------
   Any well-behaved field splits as F = −∇φ + ∇×A: a curl-free part carrying all
   the divergence, and a divergence-free part carrying all the curl. In two
   dimensions the vector potential is a single scalar ψ, and the two pieces are
   found by solving two Poisson equations, which is what the relaxation below
   does. Solving them rather than quoting a formula is the point: the reader can
   type any field and watch it separate. */
function dfPoisson(rhs, x0, x1, y0, y1, n, sweeps){
  const N = n || 64;
  const hx = (x1 - x0) / N, hy = (y1 - y0) / N;
  const u = Array.from({ length:N + 1 }, () => new Float64Array(N + 1));
  const b = Array.from({ length:N + 1 }, (_, i) =>
    Float64Array.from({ length:N + 1 }, (_, j) => rhs(x0 + i * hx, y0 + j * hy)));
  const w = 1.85, h2 = hx * hy;                     // over-relaxation
  for(let s = 0; s < (sweeps || 600); s++){
    for(let i = 1; i < N; i++) for(let j = 1; j < N; j++){
      const gs = 0.25 * (u[i + 1][j] + u[i - 1][j] + u[i][j + 1] + u[i][j - 1] - h2 * b[i][j]);
      u[i][j] += w * (gs - u[i][j]);
    }
  }
  return { u, N, x0, y0, hx, hy,
    at:(x, y) => {
      const fi = (x - x0) / hx, fj = (y - y0) / hy;
      const i = Math.max(0, Math.min(N - 1, Math.floor(fi)));
      const j = Math.max(0, Math.min(N - 1, Math.floor(fj)));
      const a = fi - i, bq = fj - j;
      return u[i][j] * (1 - a) * (1 - bq) + u[i + 1][j] * a * (1 - bq) +
             u[i][j + 1] * (1 - a) * bq + u[i + 1][j + 1] * a * bq;
    } };
}
function dfHelmholtz(P, Q, x0, x1, y0, y1, n){
  const div = (x, y) => (P(x + DF_H, y) - P(x - DF_H, y)) / (2 * DF_H) +
                        (Q(x, y + DF_H) - Q(x, y - DF_H)) / (2 * DF_H);
  const curl = (x, y) => (Q(x + DF_H, y) - Q(x - DF_H, y)) / (2 * DF_H) -
                         (P(x, y + DF_H) - P(x, y - DF_H)) / (2 * DF_H);
  /* ∇²φ = −div F  and  ∇²ψ = curl F */
  const phi = dfPoisson((x, y) => -div(x, y), x0, x1, y0, y1, n);
  const psi = dfPoisson((x, y) => curl(x, y), x0, x1, y0, y1, n);
  const grad = (S, x, y, h) => [ (S.at(x + h, y) - S.at(x - h, y)) / (2 * h),
                                 (S.at(x, y + h) - S.at(x, y - h)) / (2 * h) ];
  const h = (x1 - x0) / (n || 64);
  return { div, curl, phi, psi,
    /* the curl-free piece −∇φ and the divergence-free piece ∇×ψ = (ψ_y, −ψ_x) */
    irrot:(x, y) => { const g = grad(phi, x, y, h); return [-g[0], -g[1]]; },
    solen:(x, y) => { const g = grad(psi, x, y, h); return [g[1], -g[0]]; } };
}

/* ---- Euler's theorem on homogeneous functions ----------------------------
   f homogeneous of degree k  ⟺  x·∇f = k f.  Checked at a point, both sides
   computed independently. */
function dfEuler(f, x, y, k){
  const g = [ (f(x + DF_H, y) - f(x - DF_H, y)) / (2 * DF_H),
              (f(x, y + DF_H) - f(x, y - DF_H)) / (2 * DF_H) ];
  const lhs = x * g[0] + y * g[1], rhs = k * f(x, y);
  return { lhs, rhs, diff:Math.abs(lhs - rhs) };
}

/* the fields and functions the stages offer */
const DF_FIELDS = {
  source:  { n:'a pure source', P:(x, y) => x, Q:(x, y) => y,
             note:'All divergence, no curl. The Helmholtz split leaves the second piece empty.' },
  vortex:  { n:'a pure vortex', P:(x, y) => -y, Q:(x, y) => x,
             note:'All curl, no divergence — the mirror image of the source.' },
  mixed:   { n:'both at once',  P:(x, y) => x - y, Q:(x, y) => x + y,
             note:'Divergence 2 and curl 2 everywhere. The decomposition separates them cleanly.' },
  shear:   { n:'a shear',       P:(x, y) => y, Q:() => 0,
             note:'Zero divergence, constant curl — a shear is a rotation plus a strain, and only the rotation survives the curl.' },
  dipole:  { n:'a dipole',      P:(x, y) => (x * x - y * y) / Math.pow(x * x + y * y + 0.3, 2),
                                Q:(x, y) => 2 * x * y / Math.pow(x * x + y * y + 0.3, 2),
             note:'Nearly irrotational away from the origin; the decomposition puts almost everything into the gradient part.' }
};
const DF_HARMONIC = {
  xy:    { n:'xy',            f:(x, y) => x * y,                          harmonic:true },
  x2y2:  { n:'x² − y²',       f:(x, y) => x * x - y * y,                  harmonic:true },
  /* log r is THE fundamental solution: harmonic everywhere except the one
     point the `sing` marker names. The mean value property needs harmonicity
     on the WHOLE disc, so a circle that encloses the origin trades it for the
     sharper statement mean = log r — see the stage, which measures both. */
  logr:  { n:'log r',         f:(x, y) => 0.5 * Math.log(x * x + y * y + 1e-9), harmonic:true, sing:{ x:0, y:0 } },
  excos: { n:'eˣ cos y',      f:(x, y) => Math.exp(x) * Math.cos(y),      harmonic:true },
  bowl:  { n:'x² + y² — not harmonic', f:(x, y) => x * x + y * y,         harmonic:false }
};
