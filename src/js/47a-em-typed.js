/* ============================================================================
   3fa · A CHARGE AND CURRENT DENSITY THE READER WRITES

   Every source in `47-em.js` is a point charge, an infinite straight wire or a
   point dipole, and each carries a closed-form field that satisfies Maxwell's
   equations by construction. So when the Gauss stage integrates a flux and gets
   the enclosed charge, what it checked is the quadrature: the physics was true
   before the integral started, and `emEnclosedCharge` only had to COUNT the
   charges inside. A count cannot express a surface that cuts through a source,
   and it cannot test the differential form at all.

   With ρ typed as an expression neither side is a count:

     ROUTE 1 · the field. ρ is sampled onto a uniform grid and each cell is
       replaced by a UNIFORMLY CHARGED BALL of the same charge and volume. That
       ball's field is Coulomb outside and linear inside, so the sum is bounded
       everywhere — including in the middle of the charge, which is the case
       that matters — and it is exact Coulomb wherever the cells are far away.
       For a smooth density dying inside the box the sampling is a trapezoidal
       rule on a decaying function, whose error falls exponentially rather than
       as a power (Euler–Maclaurin), so the grid is far better than it looks.
     ROUTE 2 · the enclosed charge, by a spherical quadrature of the SAME ρ
       about the surface's own centre. It shares no node, no coordinate system
       and no line of code with route 1.

   Then ∇·E is a finite difference of route 1 checked against ρ at the point —
   the differential form, which counting never tests — and the flux is SWEPT
   over the radius, because one surface cannot show an invariance.

   The magnetic side is the same grid with a cross product, and it makes the
   sharper point: ∮B·dA = 0 for every current density anyone can type, because
   Biot–Savart produces a curl and a curl has no divergence. There is nothing to
   arrange and no configuration to hunt for — that is what "no magnetic charges"
   means. What DOES fail is Ampère's law, the moment the typed current is not
   divergence-free, and that failure is why the displacement term exists.

   Prefix: em
   ============================================================================ */

/* ---- sampling a density onto cells ---------------------------------------
   Cells whose charge is negligible are dropped, which is what keeps a localised
   blob at a few thousand elements instead of forty thousand. `sum` is the
   grid's own total; comparing it with a quadrature over a much larger ball is
   how the panel reports a density that does not fit in the box. */
function emCellGrid(f, half, n, tol){
  const N = Math.max(4, n || 34), h = 2 * half / N, dV = h * h * h;
  const s = h * Math.pow(3 / (4 * Math.PI), 1 / 3);      // equal-volume ball radius
  const cells = [];
  let peak = 0, sum = 0;
  const raw = new Float64Array(N * N * N);
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++) for(let k = 0; k < N; k++){
    const x = -half + h * (i + 0.5), y = -half + h * (j + 0.5), z = -half + h * (k + 0.5);
    const v = f(x, y, z);
    const w = Number.isFinite(v) ? v : 0;
    raw[(i * N + j) * N + k] = w;
    sum += w * dV;
    if(Math.abs(w) > peak) peak = Math.abs(w);
  }
  const cut = peak * (tol === undefined ? 2e-4 : tol);
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++) for(let k = 0; k < N; k++){
    const w = raw[(i * N + j) * N + k];
    if(Math.abs(w) <= cut) continue;
    cells.push({ x:-half + h * (i + 0.5), y:-half + h * (j + 0.5), z:-half + h * (k + 0.5),
                 q:w * dV, w });
  }
  return { cells, h, s, dV, sum, peak, half, n:N };
}
/* the same grid for a vector field — three components per cell */
function emCellGridV(fx, fy, fz, half, n, tol){
  const N = Math.max(4, n || 30), h = 2 * half / N, dV = h * h * h;
  const s = h * Math.pow(3 / (4 * Math.PI), 1 / 3);
  const cells = [];
  let peak = 0;
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++) for(let k = 0; k < N; k++){
    const x = -half + h * (i + 0.5), y = -half + h * (j + 0.5), z = -half + h * (k + 0.5);
    const a = fx(x, y, z), b = fy(x, y, z), c = fz(x, y, z);
    const m = Math.hypot(Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0,
                         Number.isFinite(c) ? c : 0);
    if(m > peak) peak = m;
  }
  const cut = peak * (tol === undefined ? 2e-4 : tol);
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++) for(let k = 0; k < N; k++){
    const x = -half + h * (i + 0.5), y = -half + h * (j + 0.5), z = -half + h * (k + 0.5);
    const a = fx(x, y, z), b = fy(x, y, z), c = fz(x, y, z);
    const ax = Number.isFinite(a) ? a : 0, ay = Number.isFinite(b) ? b : 0,
          az = Number.isFinite(c) ? c : 0;
    if(Math.hypot(ax, ay, az) <= cut) continue;
    cells.push({ x, y, z, jx:ax * dV, jy:ay * dV, jz:az * dV });
  }
  return { cells, h, s, dV, peak, half, n:N };
}

/* ---- the field of those cells --------------------------------------------
   The kernel is Coulomb's outside a cell's equal-volume ball and linear inside
   it, which is the exact field of a uniform ball. Nothing here is softened for
   convenience: this IS the field of the smeared-out charge, and it is bounded
   at every point because a continuous charge distribution has a bounded field. */
function emCellsE(G, px, py, pz){
  let ex = 0, ey = 0, ez = 0;
  const s = G.s, s3 = s * s * s, C = G.cells;
  for(let i = 0; i < C.length; i++){
    const c = C[i];
    const ux = px - c.x, uy = py - c.y, uz = pz - c.z;
    const d2 = ux * ux + uy * uy + uz * uz;
    const d = Math.sqrt(d2);
    const k = d > s ? c.q / (d2 * d) : c.q / s3;
    ex += k * ux; ey += k * uy; ez += k * uz;
  }
  const f = 1 / (4 * Math.PI);
  return { x:ex * f, y:ey * f, z:ez * f };
}
function emCellsB(G, px, py, pz){
  let bx = 0, by = 0, bz = 0;
  const s = G.s, s3 = s * s * s, C = G.cells;
  for(let i = 0; i < C.length; i++){
    const c = C[i];
    /* B element = J × (p − r′)/|p − r′|³, with the same ball smoothing */
    const ux = px - c.x, uy = py - c.y, uz = pz - c.z;
    const d2 = ux * ux + uy * uy + uz * uz;
    const d = Math.sqrt(d2);
    const k = d > s ? 1 / (d2 * d) : 1 / s3;
    bx += k * (c.jy * uz - c.jz * uy);
    by += k * (c.jz * ux - c.jx * uz);
    bz += k * (c.jx * uy - c.jy * ux);
  }
  const f = 1 / (4 * Math.PI);
  return { x:bx * f, y:by * f, z:bz * f };
}

/* The same sum with the directions thrown away: Σ|dB| rather than |ΣdB|.
   It is what B would be if every element's contribution pointed the same way,
   and dividing the real field by it measures how much of the answer is
   cancellation. For a ring at its own centre the ratio is of order one — the
   elements genuinely add. For a spherically symmetric radial flow it is about
   10⁻³, and that ratio is the honest numerical content of "this current
   produces no magnetic field": not a small number that might be a bug, but a
   large number of large contributions annihilating each other. */
function emCellsBGross(G, px, py, pz){
  let g = 0;
  const s = G.s, s3 = s * s * s, C = G.cells;
  for(let i = 0; i < C.length; i++){
    const c = C[i];
    const ux = px - c.x, uy = py - c.y, uz = pz - c.z;
    const d2 = ux * ux + uy * uy + uz * uz;
    const d = Math.sqrt(d2);
    const k = d > s ? 1 / (d2 * d) : 1 / s3;
    g += k * Math.hypot(c.jy * uz - c.jz * uy, c.jz * ux - c.jx * uz, c.jx * uy - c.jy * ux);
  }
  return g / (4 * Math.PI);
}

/* ---- directions on the sphere, weights summing to 4π ---------------------
   Gauss–Legendre in cosθ, which is the variable the measure is uniform in, and
   the midpoint rule in φ, which is periodic and therefore spectrally accurate
   there. Grids are reused across a whole panel. */
function emDirGrid(nT, nP){
  const G = NQ_GL[5], dirs = [];
  const T = Math.max(1, nT || 6), P = Math.max(4, nP || 12);
  for(let p = 0; p < T; p++){
    const c = -1 + (2 * p + 1) / T, hw = 1 / T;
    for(let i = 0; i < G.x.length; i++){
      const ct = c + hw * G.x[i], w = G.w[i] * hw;
      const st = Math.sqrt(Math.max(0, 1 - ct * ct));
      for(let j = 0; j < P; j++){
        const ph = 2 * Math.PI * (j + 0.5) / P;
        dirs.push({ x:st * Math.cos(ph), y:st * Math.sin(ph), z:ct, w:w * (2 * Math.PI / P) });
      }
    }
  }
  return dirs;
}
const EM_DIR_CACHE = new Map();
function emDirs(nT, nP){
  const k = nT + 'x' + nP;
  let d = EM_DIR_CACHE.get(k);
  if(!d){ d = emDirGrid(nT, nP); EM_DIR_CACHE.set(k, d); }
  return d;
}
/* Gauss–Legendre nodes on [0, L] */
function emRadNodes(L, panels){
  const G = NQ_GL[5], out = [], m = Math.max(1, panels || 12), hw = L / (2 * m);
  for(let p = 0; p < m; p++){
    const c = L * (p + 0.5) / m;
    for(let i = 0; i < G.x.length; i++) out.push({ r:c + hw * G.x[i], w:G.w[i] * hw });
  }
  return out;
}

/* ---- ROUTE 2: the charge inside a ball, from ρ itself --------------------
   Spherical coordinates about the SURFACE's centre, with its own r². It shares
   nothing with the cell grid — different coordinates, different nodes, and it
   never sees a cell. */
function emRhoQ(rho, cx, cy, cz, R, nT, nP, nR){
  const dirs = emDirs(nT || 8, nP || 16), rad = emRadNodes(R, nR || 10);
  let Q = 0;
  for(let d = 0; d < dirs.length; d++){
    const D = dirs[d];
    let I = 0;
    for(let k = 0; k < rad.length; k++){
      const r = rad[k].r;
      const v = rho(cx + r * D.x, cy + r * D.y, cz + r * D.z);
      if(Number.isFinite(v)) I += rad[k].w * r * r * v;
    }
    Q += I * D.w;
  }
  return Q;
}
/* ∮E·dA over a sphere, from the cell field */
function emCellFlux(G, cx, cy, cz, R, nT, nP){
  const S = emDirs(nT || 5, nP || 10);
  let F = 0, gross = 0;
  for(let i = 0; i < S.length; i++){
    const D = S[i];
    const E = emCellsE(G, cx + R * D.x, cy + R * D.y, cz + R * D.z);
    const d = E.x * D.x + E.y * D.y + E.z * D.z;
    F += d * D.w * R * R;
    gross += Math.abs(d) * D.w * R * R;
  }
  return { flux:F, gross, rel:gross > 0 ? Math.abs(F) / gross : 0 };
}
/* `mean` is |B| averaged over the surface, and it is here because the net and
   the gross flux are both zero for a current that produces no field at all — the
   radial one does exactly that — and a panel comparing them would be dividing
   nothing by nothing. The mean field says which case the reader is looking at. */
function emCellFluxB(G, cx, cy, cz, R, nT, nP){
  const S = emDirs(nT || 5, nP || 10);
  let F = 0, gross = 0, mag = 0, wt = 0;
  for(let i = 0; i < S.length; i++){
    const D = S[i];
    const B = emCellsB(G, cx + R * D.x, cy + R * D.y, cz + R * D.z);
    const d = B.x * D.x + B.y * D.y + B.z * D.z;
    F += d * D.w * R * R;
    gross += Math.abs(d) * D.w * R * R;
    mag += Math.hypot(B.x, B.y, B.z) * D.w; wt += D.w;
  }
  return { flux:F, gross, rel:gross > 0 ? Math.abs(F) / gross : 0, mean:mag / wt };
}
/* ∇·E and ∇·B on the cell field, by the five-point stencil.
   The step is squeezed from both sides: it has to be comfortably larger than a
   cell, or the difference measures the grid rather than the field, and
   comfortably smaller than the scale the density varies on, or it smooths the
   very peak it is trying to measure. A two-cell step with a fourth-order
   stencil is the widest window that exists — the second-order form on the same
   step was reading 40% low at the centre of a blob two cells wide. */
function emCellDiv(G, px, py, pz, which, h){
  const s = h || G.h * 2;
  const F = which === 'B' ? emCellsB : emCellsE;
  const d1 = (F(G, px + s, py, pz).x - F(G, px - s, py, pz).x +
              F(G, px, py + s, pz).y - F(G, px, py - s, pz).y +
              F(G, px, py, pz + s).z - F(G, px, py, pz - s).z) / (2 * s);
  const d2 = (F(G, px + 2 * s, py, pz).x - F(G, px - 2 * s, py, pz).x +
              F(G, px, py + 2 * s, pz).y - F(G, px, py - 2 * s, pz).y +
              F(G, px, py, pz + 2 * s).z - F(G, px, py, pz - 2 * s).z) / (4 * s);
  return (4 * d1 - d2) / 3;               // Richardson: the h² term cancels
}

/* The same difference, but with the three terms kept apart.
   ∇·B = ∂Bx/∂x + ∂By/∂y + ∂Bz/∂z is a sum of three numbers that are each large
   and cancel. Printing the sum alone says nothing — a routine that returned zero
   because it had computed nothing would look identical. `gross` is the sum of
   their magnitudes, so a panel can print "these three are 0.24 apiece and they
   add to 1e-16", which measures the cancellation instead of asserting it.

   Richardson is applied to each component separately, so the parts are as
   accurate as `emCellDiv`'s answer AND their sum is exactly it — using the plain
   second-order form here instead left a 5% residue at ordinary points that was
   entirely truncation error and read as a failure of the physics.

   Where B is stationary in all three directions — the centre of a ring, any
   point a symmetry fixes — every part is separately zero and `gross` collapses
   to the same 1e-16 as `div`. That is not a failed cancellation, it is nothing
   to cancel, and a caller printing the ratio has to say which case it is in. */
function emCellDivParts(G, px, py, pz, which, h){
  const s = h || G.h * 2;
  const F = which === 'B' ? emCellsB : emCellsE;
  const rich = (near, far) => (4 * near - far) / 3;
  const dx = rich((F(G, px + s, py, pz).x - F(G, px - s, py, pz).x) / (2 * s),
                  (F(G, px + 2 * s, py, pz).x - F(G, px - 2 * s, py, pz).x) / (4 * s));
  const dy = rich((F(G, px, py + s, pz).y - F(G, px, py - s, pz).y) / (2 * s),
                  (F(G, px, py + 2 * s, pz).y - F(G, px, py - 2 * s, pz).y) / (4 * s));
  const dz = rich((F(G, px, py, pz + s).z - F(G, px, py, pz - s).z) / (2 * s),
                  (F(G, px, py, pz + 2 * s).z - F(G, px, py, pz - 2 * s).z) / (4 * s));
  return { div:dx + dy + dz, parts:[dx, dy, dz],
           gross:Math.abs(dx) + Math.abs(dy) + Math.abs(dz) };
}

/* Does the typed current close inside the box the grid covers?
   ∇·J = 0 at every interior point is not enough: a current running straight
   through the region satisfies it everywhere and still enters through one wall
   and leaves through the other, so what the grid holds is a segment rather than
   a circuit, and the field of a segment does not obey Ampère's law. The NET flux
   through the walls is the divergence theorem's version of ∇·J and vanishes for
   both a loop and a straight wire; the GROSS flux is what separates them, and it
   is the number a reader who typed a uniform J needs to be shown. */
function emJBoxLeak(Jx, Jy, Jz, half, n){
  const N = Math.max(4, n || 20), h = 2 * half / N, dA = h * h;
  let net = 0, gross = 0, scale = 1e-30;
  const at = (x, y, z, k) => {
    const v = k === 0 ? Jx(x, y, z) : k === 1 ? Jy(x, y, z) : Jz(x, y, z);
    return Number.isFinite(v) ? v : 0;
  };
  for(let k = 0; k < 3; k++) for(const sgn of [-1, 1])
    for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
      const a = -half + h * (i + 0.5), b = -half + h * (j + 0.5);
      const p = k === 0 ? [sgn * half, a, b] : k === 1 ? [a, sgn * half, b] : [a, b, sgn * half];
      const c = sgn * at(p[0], p[1], p[2], k);
      net += c * dA; gross += Math.abs(c) * dA;
      const m = Math.hypot(at(p[0], p[1], p[2], 0), at(p[0], p[1], p[2], 1), at(p[0], p[1], p[2], 2));
      if(m > scale) scale = m;
    }
  return { net, gross, scale };
}

/* ---- Ampère's two sides, neither of which knows about the other ---------- */
function emJThread(Jx, Jy, Jz, c, R, nh, n){
  const u = vperp(nh), v = vcross(nh, u);
  const nR = n || 14, nA = 4 * nR;
  let I = 0;
  for(let i = 0; i < nR; i++){
    const r0 = R * i / nR, r1 = R * (i + 1) / nR;
    const rm = 0.5 * (r0 + r1), dA = Math.PI * (r1 * r1 - r0 * r0) / nA;
    for(let j = 0; j < nA; j++){
      const a = (j + 0.5) * 2 * Math.PI / nA;
      const p = vadd(c, vadd(vmul(u, rm * Math.cos(a)), vmul(v, rm * Math.sin(a))));
      const d = Jx(p.x, p.y, p.z) * nh.x + Jy(p.x, p.y, p.z) * nh.y + Jz(p.x, p.y, p.z) * nh.z;
      if(Number.isFinite(d)) I += d * dA;
    }
  }
  return I;
}
function emCellCircB(G, c, R, nh, n){
  const N = n || 72, dth = 2 * Math.PI / N;
  const u = vperp(nh), v = vcross(nh, u);
  let total = 0;
  for(let i = 0; i < N; i++){
    const th = (i + 0.5) * dth, ct = Math.cos(th), st = Math.sin(th);
    const p = vadd(c, vadd(vmul(u, R * ct), vmul(v, R * st)));
    const T = vadd(vmul(u, -st), vmul(v, ct));
    const B = emCellsB(G, p.x, p.y, p.z);
    total += (B.x * T.x + B.y * T.y + B.z * T.z) * R * dth;
  }
  return total;
}
/* ∇·J, which decides whether a typed current can be steady at all. A density
   with a non-zero divergence is piling charge up somewhere, and Ampère's law
   without Maxwell's correction is then not merely inaccurate but
   self-contradictory: the same ∮B·dl comes out differently on two surfaces
   that share a rim. */
function emJDiv(Jx, Jy, Jz, px, py, pz, h){
  const s = h || 1e-3;
  return (Jx(px + s, py, pz) - Jx(px - s, py, pz) +
          Jy(px, py + s, pz) - Jy(px, py - s, pz) +
          Jz(px, py, pz + s) - Jz(px, py, pz - s)) / (2 * s);
}
function emJDivMax(Jx, Jy, Jz, L, n){
  const N = Math.max(2, n || 5);
  let worst = 0, scale = 1e-30;
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++) for(let k = 0; k < N; k++){
    const x = -L + 2 * L * (i + 0.5) / N, y = -L + 2 * L * (j + 0.5) / N,
          z = -L + 2 * L * (k + 0.5) / N;
    const d = emJDiv(Jx, Jy, Jz, x, y, z);
    if(Number.isFinite(d)) worst = Math.max(worst, Math.abs(d));
    const m = Math.hypot(Jx(x, y, z), Jy(x, y, z), Jz(x, y, z));
    if(Number.isFinite(m)) scale = Math.max(scale, m);
  }
  return { worst, scale, rel:worst / Math.max(1e-30, scale) };
}

/* ---- THE SWEEP -----------------------------------------------------------
   One surface proves nothing. Gauss's law says the flux depends on the charge
   inside and on nothing else, so the way to see it is to move the surface and
   print the flux beside the field strength on it: the second moves by orders of
   magnitude while the first does not. */
function emGaussSweep(G, rho, cx, cy, cz, radii){
  const rows = [];
  const S = emDirs(3, 6);
  for(const R of radii){
    const F = emCellFlux(G, cx, cy, cz, R, 4, 9);
    const Q = emRhoQ(rho, cx, cy, cz, R, 8, 16, 10);
    let mag = 0, wtot = 0;
    for(const D of S){
      const E = emCellsE(G, cx + R * D.x, cy + R * D.y, cz + R * D.z);
      mag += Math.hypot(E.x, E.y, E.z) * D.w; wtot += D.w;
    }
    rows.push({ R, flux:F.flux, Q, gap:Math.abs(F.flux - Q),
                rel:Math.abs(Q) > 1e-12 ? Math.abs(F.flux - Q) / Math.abs(Q) : NaN,
                meanE:mag / wtot });
  }
  /* The invariance being measured is "once the charge is inside, the flux stops
     depending on the surface". A radius that only encloses part of the charge
     belongs on the plot and NOT in that statistic — including it would mix the
     two things the sweep exists to separate. */
  const most = rows.reduce((a, r) => Math.max(a, Math.abs(r.Q)), 0);
  const full = rows.filter(r => Math.abs(r.Q) > 0.995 * most);
  const fl = full.map(r => r.flux);
  return { rows,
           spread:fl.length > 1 ? (Math.max(...fl) - Math.min(...fl)) / Math.abs(fl[0]) : NaN,
           eRange:full.length > 1 ? Math.max(...full.map(r => r.meanE)) /
                                    Math.max(1e-30, Math.min(...full.map(r => r.meanE))) : NaN };
}
/* The Ampère analogue, and it needs the sweep for the same reason Gauss does.
   One loop agreeing proves the quadrature; what the law claims is that the
   circulation depends on the current threaded and on nothing else — not on how
   big the loop is, and not on how strong B is where it runs. So the loop is
   grown, and the circulation is printed beside the mean |B| on the path: once
   the whole current is inside, the second falls by a factor and the first does
   not move. Radii that enclose only part of the current belong on the plot and
   not in that statistic, which is why `full` filters before the spread. */
function emAmpereSweep(G, Jx, Jy, Jz, c, nh, radii){
  const u = vperp(nh), v = vcross(nh, u), rows = [];
  for(const R of radii){
    const circ = emCellCircB(G, c, R, nh, 72);
    const I = emJThread(Jx, Jy, Jz, c, R, nh, 16);
    let mag = 0;
    const N = 24;
    for(let i = 0; i < N; i++){
      const a = (i + 0.5) / N * 2 * Math.PI;
      const p = vadd(c, vadd(vmul(u, R * Math.cos(a)), vmul(v, R * Math.sin(a))));
      const B = emCellsB(G, p.x, p.y, p.z);
      mag += Math.hypot(B.x, B.y, B.z);
    }
    rows.push({ R, circ, I, gap:Math.abs(circ - I),
                rel:Math.abs(I) > 1e-12 ? Math.abs(circ - I) / Math.abs(I) : NaN,
                meanB:mag / N });
  }
  const most = rows.reduce((a, r) => Math.max(a, Math.abs(r.I)), 0);
  const full = rows.filter(r => Math.abs(r.I) > 0.995 * most);
  const cs = full.map(r => r.circ);
  return { rows, most,
           spread:cs.length > 1 && Math.abs(cs[0]) > 1e-12
                    ? (Math.max(...cs) - Math.min(...cs)) / Math.abs(cs[0]) : NaN,
           bRange:full.length > 1 ? Math.max(...full.map(r => r.meanB)) /
                                    Math.max(1e-30, Math.min(...full.map(r => r.meanB))) : NaN };
}
/* the same for the magnetic flux, which has to be zero on every one of them */
function emMonopoleSweep(G, spheres){
  const rows = [];
  for(const s of spheres){
    const F = emCellFluxB(G, s.x, s.y, s.z, s.R, 4, 9);
    rows.push({ x:s.x, y:s.y, z:s.z, R:s.R, flux:F.flux, gross:F.gross, rel:F.rel,
                meanB:F.mean, cuts:!!s.cuts });
  }
  return { rows, worst:rows.reduce((a, r) => Math.max(a, r.rel), 0) };
}

/* ============================================================================
   THE 1-D MAXWELL MARCHER — the wave speed as an OUTPUT, never an input

   emFDTD1D drives the two curl equations on a staggered (Yee) grid with a
   sheet current K(t) [A/m] on one plane:

       ∂E_y/∂t = −(1/ε₀) ∂H_z/∂x − J_y/ε₀
       ∂H_z/∂t = −(1/μ₀) ∂E_y/∂x

   The update coefficients contain μ₀ and ε₀ SEPARATELY and never c — the
   propagation speed is a property the marching *produces*, which is the whole
   point: the stage measures it from the transit between two probes and only
   then compares it with 1/√(μ₀ε₀). (The time step is chosen as a fraction S
   of the stability bound dx·√(μ₀ε₀); that bound references the constants, but
   the dynamics do not — halve S and the measured speed must not move, which
   the unit suite asserts.)

   Everything is SI: metres, seconds, V/m, A/m. K is called with time in
   SECONDS — a caller whose reader types t in nanoseconds wraps it.

   Timing is a front crossing: the first time |E| at a probe rises through
   `frac` of that probe's own peak, refined by linear interpolation. Both
   probes see the same waveform to O(dispersion), so the same relative
   threshold cancels and the delay is the transit. (A centroid was tried and
   rejected: for a switched-on step it lands mid-record and reports 2c.)

   Boundaries are first-order Mur; the closed form the caller compares against
   is the retarded sheet solution E_y = −(μ₀c/2)·K(t − |x−xs|/c).            */
const EM_MU0  = 1.25663706127e-6;   // N/A² — CODATA 2022 (measured since 2019 SI)
const EM_EPS0 = 8.8541878188e-12;   // F/m  — CODATA 2022

function emFDTD1D(K, o){
  o = o || {};
  const dx = o.dx || 0.01;                       // m
  const L  = o.L  || 24;                         // m
  const S  = o.S  || 0.9;                        // Courant fraction
  const xs = o.xs !== undefined ? o.xs : 4;      // source plane, m
  const xa = o.xa !== undefined ? o.xa : 10;     // near probe, m
  const xb = o.xb !== undefined ? o.xb : 20;     // far probe, m
  const T  = o.T  || 80e-9;                      // s
  const frac = o.frac || 0.02;                   // front threshold
  const N  = Math.round(L / dx);
  const dt = S * dx * Math.sqrt(EM_MU0 * EM_EPS0);
  const steps = Math.round(T / dt);
  const Ey = new Float64Array(N + 1);            // E_y at integer nodes
  const Hz = new Float64Array(N);                // H_z at half nodes
  const ce = dt / (EM_EPS0 * dx), ch = dt / (EM_MU0 * dx);
  const mur = (S - 1) / (S + 1);
  const is = Math.round(xs / dx), ia = Math.round(xa / dx), ib = Math.round(xb / dx);
  const tArr = new Float64Array(steps), Ea = new Float64Array(steps),
        Eb = new Float64Array(steps), Hb = new Float64Array(steps);
  const snapEvery = o.snapEvery || 0, skip = Math.max(1, Math.round(N / 480)), snaps = [];
  let e0 = 0, e1 = 0, eN = 0, eN1 = 0;           // Mur memory
  for(let n = 0; n < steps; n++){
    for(let i = 0; i < N; i++) Hz[i] -= ch * (Ey[i + 1] - Ey[i]);
    e0 = Ey[0]; e1 = Ey[1]; eN = Ey[N]; eN1 = Ey[N - 1];
    for(let i = 1; i < N; i++) Ey[i] -= ce * (Hz[i] - Hz[i - 1]);
    /* soft source: the sheet current K [A/m] smeared over one cell */
    Ey[is] -= (dt / EM_EPS0) * K((n + 0.5) * dt) / dx;
    Ey[0] = e1 + mur * (Ey[1] - e0);             // Mur-1 absorbing walls
    Ey[N] = eN1 + mur * (Ey[N - 1] - eN);
    tArr[n] = (n + 1) * dt;
    Ea[n] = Ey[ia]; Eb[n] = Ey[ib];
    Hb[n] = 0.5 * (Hz[ib - 1] + Hz[ib]);
    if(snapEvery && n % snapEvery === 0){
      const row = new Float32Array(Math.floor(N / skip) + 1);
      for(let i = 0; i < row.length; i++) row[i] = Ey[i * skip];
      snaps.push({ t: tArr[n], E: row });
    }
  }
  const front = w => {
    let m = 0;
    for(let k = 0; k < w.length; k++) m = Math.max(m, Math.abs(w[k]));
    const th = frac * m;
    for(let k = 1; k < w.length; k++){
      const a = Math.abs(w[k - 1]), b = Math.abs(w[k]);
      if(b >= th && a < th) return tArr[k - 1] + dt * (th - a) / (b - a);
    }
    return NaN;
  };
  const ta = front(Ea), tb = front(Eb);
  const c0 = 1 / Math.sqrt(EM_MU0 * EM_EPS0);
  const cMeas = (xb - xa) / (tb - ta);
  /* impedance from the energy the far probe records — E and H staggered half
     a step in time, which is O(ω dt) and far inside the claim */
  let se = 0, sh = 0;
  for(let k = 0; k < steps; k++){ se += Eb[k] * Eb[k]; sh += Hb[k] * Hb[k]; }
  const zMeas = Math.sqrt(se / Math.max(1e-300, sh));
  const z0 = Math.sqrt(EM_MU0 / EM_EPS0);
  /* the whole waveform against the retarded closed form, using the constants'
     own c — a pointwise two-route comparison, not a single number */
  let s2 = 0, pk = 0;
  const lag = (xb - xs) / c0;
  for(let k = 0; k < steps; k++){
    const cf = -(EM_MU0 * c0 / 2) * K(tArr[k] - lag);
    s2 += (Eb[k] - cf) * (Eb[k] - cf);
    pk = Math.max(pk, Math.abs(cf));
  }
  const shapeRms = Math.sqrt(s2 / steps);
  return { c: cMeas, c0, cRel: Math.abs(cMeas - c0) / c0,
           z: zMeas, z0, zRel: Math.abs(zMeas - z0) / z0,
           shapeRms, shapePeak: pk, ta, tb,
           t: tArr, Ea, Eb, Hb, snaps, dx, dt, steps, N, xs, xa, xb, L };
}

/* ============================================================================
   THE LAWS, MEASURED ON AN ARBITRARY ARRANGEMENT

   The sandbox lets a reader place any charges, wires and magnets; these three
   functions measure what the presets were allowed to assume about the field
   those objects make. Everything reads emField alone — nothing consults the
   object list — so agreement is evidence about the FIELD, not bookkeeping.

   emDivAt        ∇·E or ∇·B by fourth-order central differences, with the
                  gross Σ|∂ᵢFᵢ| beside it — the Laplace residual, since
                  E = −∇V makes ∇·E = −∇²V off the sources.
   emBallU        ∭ u dV over a probe-centred ball (radial Gauss–Legendre ×
                  angular midpoint).
   emPoyntingBalance  ∮S·dA over the sphere against −dU/dt inside it, the
                  time derivative taken by re-evaluating the field with every
                  object translated along its own velocity (emPos carries t) —
                  two routes sharing no samples. The gross is ∮|S|dA,
                  magnitudes not |S·n̂|, because circulating energy (a static
                  charge beside a wire) has ∮S·dA = 0 with |S| finite, and
                  that case is the point.                                    */
function emDivAt(objs, p, h, which, t){
  const w = which || 'E', tt = t || 0;
  const F = (x, y, z) => emField(objs, v3(x, y, z), tt)[w];
  /* The gross is the sum of |coefficient × sample|/12h over the whole stencil —
     what the zero cancelled OUT OF — never Σ|∂ᵢFᵢ|: on the default dipole the
     probe sits on the symmetry plane where E is purely x̂ and even, so every
     DERIVATIVE term is individually zero and that "gross" was itself round-off.
     auditsides flagged the resulting 100% verdict the day it shipped (the
     fmtAgreeGross doctrine, in FD clothing). fmax lets a caller say "the field
     vanishes here" instead of printing a ratio of two round-offs. */
  const C = [1, -8, 8, -1], O = [-2, -1, 1, 2];
  let gross = 0, fmax = 0, div = 0;
  const axes = [['x', 1, 0, 0], ['y', 0, 1, 0], ['z', 0, 0, 1]];
  for(const [comp, sx, sy, sz] of axes){
    let s = 0;
    for(let k = 0; k < 4; k++){
      const f = F(p.x + O[k] * h * sx, p.y + O[k] * h * sy, p.z + O[k] * h * sz)[comp];
      s += C[k] * f;
      gross += Math.abs(C[k] * f) / (12 * h);
      fmax = Math.max(fmax, Math.abs(f));
    }
    div += s / (12 * h);
  }
  return { div, gross, fmax };
}
function emBallU(objs, c, R, t, nth, nph){
  const NT = nth || 16, NP = nph || 32;
  const shell = r => {
    let s = 0, wsum = 0;
    for(let i = 0; i < NT; i++){
      const th = Math.PI * (i + 0.5) / NT, sth = Math.sin(th);
      for(let j = 0; j < NP; j++){
        const ph = 2 * Math.PI * (j + 0.5) / NP;
        const p = v3(c.x + r * sth * Math.cos(ph), c.y + r * sth * Math.sin(ph),
                     c.z + r * Math.cos(th));
        const u = emEnergyDensity(emField(objs, p, t));
        if(Number.isFinite(u)){ s += u * sth; wsum += sth; }
      }
    }
    return wsum ? s / wsum * 4 * Math.PI * r * r : 0;
  };
  return nqGauss(shell, 0, R, 5, 2);
}
function emPoyntingBalance(objs, c, R, o){
  o = o || {};
  const NT = o.nth || 16, NP = o.nph || 32, ht = o.ht || 0.01;
  let flux = 0, gross = 0;
  const dA = (Math.PI / NT) * (2 * Math.PI / NP) * R * R;
  for(let i = 0; i < NT; i++){
    const th = Math.PI * (i + 0.5) / NT, sth = Math.sin(th);
    for(let j = 0; j < NP; j++){
      const ph = 2 * Math.PI * (j + 0.5) / NP;
      const n = v3(sth * Math.cos(ph), sth * Math.sin(ph), Math.cos(th));
      const p = v3(c.x + R * n.x, c.y + R * n.y, c.z + R * n.z);
      const S = emPoynting(emField(objs, p, 0));
      if(!Number.isFinite(S.x + S.y + S.z)) continue;
      flux += vdot(S, n) * sth * dA;
      gross += vlen(S) * sth * dA;
    }
  }
  const dUdt = (emBallU(objs, c, R, ht, NT, NP) - emBallU(objs, c, R, -ht, NT, NP)) / (2 * ht);
  return { flux, dUdt, gross, R };
}
