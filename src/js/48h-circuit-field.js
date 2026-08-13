/* ============================================================================
   9 · THE ELECTRIC FIELD IN THE PLANE OF THE BOARD
   Circuit theory hides the field: it summarises it into V and I. To put it back
   we solve the electrostatic problem the circuit poses. Every conductor is held
   at the potential the MNA solve found for it, and Laplace's equation
   ∇²V = 0 is relaxed everywhere else, so E = −∇V is the real field of that
   arrangement of conductors — fringing at capacitor plates and all.

   Inside a uniform resistor the potential falls linearly from end to end (that
   is what constant resistivity means), so its body is painted as a ramp rather
   than held at one value.
   ============================================================================ */

function ckFieldGrid(nx, ny, x0, x1, y0, y1){
  return { nx, ny, x0, x1, y0, y1,
           dx:(x1 - x0) / (nx - 1), dy:(y1 - y0) / (ny - 1),
           V: new Float64Array(nx * ny),
           fixed: new Float64Array(nx * ny),
           mask: new Uint8Array(nx * ny),
           pa: new Int32Array(nx * ny),           /* which conductor painted it */
           al: new Float32Array(nx * ny),         /* how far along that conductor */
           key:'' };
}
/* the conductors a schematic presents: leads, wires, plates and bodies */
function ckConductors(sch, ck){
  const out = [];
  const push = (a, b, na, nb, w, kind) => out.push({ a, b, na, nb, w: w || 0.16, kind });
  for(const w of sch.wires){
    const nd = ck.nm.node(w.a);
    push(w.a, w.b, nd, nd, 0.14, 'wire');
  }
  for(const c of sch.comps){
    const pins = ckPins(c);
    if(c.kind === 'GND' || c.kind === 'M') continue;
    const nodes = pins.map(p => ck.nm.node(p));
    if(c.kind === 'OPAMP'){
      /* a package, not a conductor: only its leads carry potential */
      const ctr = { x:c.x, y:c.y };
      pins.forEach((p, i) => {
        const q = { x: p.x + (ctr.x - p.x) * 0.35, y: p.y + (ctr.y - p.y) * 0.35 };
        push(p, q, nodes[i], nodes[i], 0.13, 'lead');
      });
      continue;
    }
    if(pins.length >= 2){
      const A = pins[0], B = pins[1];
      const dir = { x:(B.x - A.x), y:(B.y - A.y) };
      const lead = 0.34;
      const a1 = { x:A.x + dir.x * lead, y:A.y + dir.y * lead };
      const b1 = { x:A.x + dir.x * (1 - lead), y:A.y + dir.y * (1 - lead) };
      push(A, a1, nodes[0], nodes[0], 0.13, 'lead');
      push(b1, B, nodes[1], nodes[1], 0.13, 'lead');
      if(c.kind === 'C'){
        /* two plates facing each other across the dielectric */
        const nrm = { x:-dir.y, y:dir.x };
        const g = 0.09, pw = 0.34;
        const m = { x:(A.x + B.x) / 2, y:(A.y + B.y) / 2 };
        push({ x:m.x - dir.x * g - nrm.x * pw, y:m.y - dir.y * g - nrm.y * pw },
             { x:m.x - dir.x * g + nrm.x * pw, y:m.y - dir.y * g + nrm.y * pw }, nodes[0], nodes[0], 0.07, 'plate');
        push({ x:m.x + dir.x * g - nrm.x * pw, y:m.y + dir.y * g - nrm.y * pw },
             { x:m.x + dir.x * g + nrm.x * pw, y:m.y + dir.y * g + nrm.y * pw }, nodes[1], nodes[1], 0.07, 'plate');
      } else {
        push(a1, b1, nodes[0], nodes[1], 0.17, 'body');    /* the linear ramp */
      }
    }
    if(pins.length >= 4){
      const A = pins[2], B = pins[3];
      push(A, { x:(A.x + B.x) / 2, y:(A.y + B.y) / 2 }, nodes[2], nodes[2], 0.13, 'lead');
      push({ x:(A.x + B.x) / 2, y:(A.y + B.y) / 2 }, B, nodes[3], nodes[3], 0.13, 'lead');
    }
  }
  return out;
}
/* paint the conductor mask — geometry only, so it survives every timestep */
function ckFieldPaint(F, cond){
  F.mask.fill(0); F.pa.fill(-1); F.al.fill(0);
  for(let j = 0; j < F.ny; j++){
    const y = F.y0 + j * F.dy;
    for(let i = 0; i < F.nx; i++){
      const x = F.x0 + i * F.dx;
      for(let k = 0; k < cond.length; k++){
        const s = cond[k];
        const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y, L2 = dx * dx + dy * dy;
        let u = L2 > 1e-12 ? ((x - s.a.x) * dx + (y - s.a.y) * dy) / L2 : 0;
        u = Math.max(0, Math.min(1, u));
        const px = s.a.x + u * dx, py = s.a.y + u * dy;
        if((x - px) * (x - px) + (y - py) * (y - py) <= s.w * s.w){
          const id = j * F.nx + i;
          F.mask[id] = 1; F.pa[id] = k; F.al[id] = u;
          break;
        }
      }
    }
  }
}
/* refresh the Dirichlet values from the present node voltages */
function ckFieldValues(F, cond, nodeV){
  for(let id = 0; id < F.mask.length; id++){
    if(!F.mask[id]) continue;
    const s = cond[F.pa[id]];
    const va = nodeV[s.na] || 0, vb = nodeV[s.nb] || 0;
    F.fixed[id] = va + (vb - va) * F.al[id];
    F.V[id] = F.fixed[id];
  }
}
/* successive over-relaxation, warm-started; the outer boundary is insulating
   (∂V/∂n = 0), i.e. the board sits in a box with no charge on its walls */
function ckFieldRelax(F, sweeps, omega){
  const nx = F.nx, ny = F.ny, V = F.V, m = F.mask;
  const w = omega === undefined ? 1.9 : omega;
  for(let s = 0; s < sweeps; s++){
    for(let j = 0; j < ny; j++){
      for(let i = 0; i < nx; i++){
        const id = j * nx + i;
        if(m[id]) continue;
        const l = V[j * nx + (i > 0 ? i - 1 : i + 1)];
        const r = V[j * nx + (i < nx - 1 ? i + 1 : i - 1)];
        const d = V[(j > 0 ? j - 1 : j + 1) * nx + i];
        const u = V[(j < ny - 1 ? j + 1 : j - 1) * nx + i];
        V[id] += w * (0.25 * (l + r + d + u) - V[id]);
      }
    }
  }
}
/* bilinear V and the central-difference E = −∇V at any point */
function ckFieldAt(F, x, y){
  const fx = Math.max(0, Math.min(F.nx - 1.001, (x - F.x0) / F.dx));
  const fy = Math.max(0, Math.min(F.ny - 1.001, (y - F.y0) / F.dy));
  const i = fx | 0, j = fy | 0, s = fx - i, t = fy - j;
  const g = (a, b) => F.V[Math.max(0, Math.min(F.ny - 1, b)) * F.nx + Math.max(0, Math.min(F.nx - 1, a))];
  const V = g(i, j) * (1 - s) * (1 - t) + g(i + 1, j) * s * (1 - t) +
            g(i, j + 1) * (1 - s) * t + g(i + 1, j + 1) * s * t;
  const Ex = -(g(i + 1, j) - g(i - 1 < 0 ? 0 : i - 1, j)) / (2 * F.dx);
  const Ey = -(g(i, j + 1) - g(i, j - 1 < 0 ? 0 : j - 1)) / (2 * F.dy);
  return { V, Ex, Ey, mag: Math.hypot(Ex, Ey), inside: !!F.mask[j * F.nx + i] };
}
/* marching squares, one level — used for the equipotential overlay */
function ckContour(F, level){
  const segs = [];
  const g = (i, j) => F.V[j * F.nx + i];
  const px = i => F.x0 + i * F.dx, py = j => F.y0 + j * F.dy;
  for(let j = 0; j < F.ny - 1; j++) for(let i = 0; i < F.nx - 1; i++){
    const v = [g(i, j), g(i + 1, j), g(i + 1, j + 1), g(i, j + 1)];
    let code = 0;
    for(let k = 0; k < 4; k++) if(v[k] > level) code |= 1 << k;
    if(code === 0 || code === 15) continue;
    const P = [];
    const edge = (k0, k1, x0, y0, x1, y1) => {
      if((v[k0] > level) === (v[k1] > level)) return;
      const t = (level - v[k0]) / (v[k1] - v[k0]);
      P.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
    };
    edge(0, 1, px(i), py(j), px(i + 1), py(j));
    edge(1, 2, px(i + 1), py(j), px(i + 1), py(j + 1));
    edge(2, 3, px(i + 1), py(j + 1), px(i), py(j + 1));
    edge(3, 0, px(i), py(j + 1), px(i), py(j));
    for(let k = 0; k + 1 < P.length; k += 2) segs.push([P[k], P[k + 1]]);
  }
  return segs;
}

/* ============================================================================
   9b · THE MAGNETIC FIELD OF THE CURRENTS
   The electric field came from the potentials; the magnetic field comes from
   the currents, and the circuit solve knows both exactly. Every conductor on
   the board is a straight segment carrying a known current, so Biot–Savart

     B = (μ₀/4π) ∫ I dl × r̂ / r²

   integrates in closed form along each one. For a segment from P₁ to P₂ with
   unit direction L̂, and r₁ = P − P₁, r₂ = P − P₂, the cross product dl × r is
   constant in direction (L̂ × r₁), which leaves an elementary integral:

     B = (μ₀I/4π) (L̂ × r₁)/d² · [ (r₁·L̂)/|r₁| − (r₂·L̂)/|r₂| ]

   Everything lies in the plane of the board, so B points straight out of it —
   which is why the overlay draws it as ⊙ and ⊗ rather than as arrows.
   ============================================================================ */
const CK_MU0_4PI = 1e-7;                 /* μ₀/4π, in T·m/A */
const CK_BOARD_M = 0.01;                 /* one grid unit is taken to be 1 cm */

/* the out-of-plane component at (x, y), summed over every carrier */
function ckBAt(paths, x, y){
  let bz = 0;
  for(const p of paths){
    const I = p.i;
    if(!I || !Number.isFinite(I)) continue;
    const dx = (p.b.x - p.a.x) * CK_BOARD_M, dy = (p.b.y - p.a.y) * CK_BOARD_M;
    const len = Math.hypot(dx, dy);
    if(len < 1e-12) continue;
    const ux = dx / len, uy = dy / len;
    const r1x = (x - p.a.x) * CK_BOARD_M, r1y = (y - p.a.y) * CK_BOARD_M;
    const r2x = (x - p.b.x) * CK_BOARD_M, r2y = (y - p.b.y) * CK_BOARD_M;
    /* (L̂ × r₁)_z — signed, so it carries the direction of B as well as d */
    const s = ux * r1y - uy * r1x;
    const d2 = s * s;
    if(d2 < 1e-12) continue;             /* on the wire itself: skip the singularity */
    const m1 = Math.hypot(r1x, r1y), m2 = Math.hypot(r2x, r2y);
    if(m1 < 1e-9 || m2 < 1e-9) continue;
    const c1 = (r1x * ux + r1y * uy) / m1;
    const c2 = (r2x * ux + r2y * uy) / m2;
    bz += CK_MU0_4PI * I * s / d2 * (c1 - c2);
  }
  return bz;
}
/* the field of one infinite straight wire, for checking the numbers against
   the formula everybody knows: B = μ₀I/2πd */
const ckBWire = (I, d) => CK_MU0_4PI * 2 * I / (d * CK_BOARD_M);

