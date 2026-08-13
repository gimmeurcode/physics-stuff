/* ============================================================================
   3f · ELECTROMAGNETISM ENGINE
   Units are chosen so that ε₀ = μ₀ = c = 1. Maxwell's equations then carry no
   constants at all, and every number the probe prints can be checked directly
   against the equation it belongs to:

     ∇·E = ρ          ∮E·dA = Q_enc
     ∇·B = 0          ∮B·dA = 0
     ∇×E = −∂B/∂t     ∮E·dl = −dΦ_B/dt
     ∇×B = J + ∂E/∂t  ∮B·dl = I_enc + dΦ_E/dt

   Every source below contributes an exact closed-form field:
     charge at rest      E = q r̂/4πr²,                     B = 0
     charge in motion    the Heaviside (boosted Coulomb) field, B = v × E
     line current        B = (I/2π) φ̂/s,                    E = 0
     point dipole        B = [3(m·r̂)r̂ − m]/4πr³,           E = 0 at rest
     dipole in motion    E = −v × B  (its rest frame has no E)

   The last line is not an approximation bolted on: for a field pattern that
   rigidly translates, ∇×(−v×B) = −(v·∇)B·(−1) = −∂B/∂t exactly, so a moving
   magnet satisfies Faraday's law identically. The tests verify it numerically.
   ============================================================================ */

const FOURPI = 4 * Math.PI;
const EM_ZERO = { E: v3(0, 0, 0), B: v3(0, 0, 0) };

/* where a source sits at time t (uniform drift; the sandbox integrates its own
   motion and always asks at t = 0, the Maxwell stages use t for time derivatives) */
function emPos(o, t){
  const p = v3(o.p.x, o.p.y, o.p.z || 0);
  if(!t || !o.v) return p;
  return vadd(p, vmul(v3(o.v.x || 0, o.v.y || 0, o.v.z || 0), t));
}
const emVel = o => o.v ? v3(o.v.x || 0, o.v.y || 0, o.v.z || 0) : v3(0, 0, 0);

/* ---- one source's contribution at a point ---- */
function emFieldOf(o, p, t){
  const src = emPos(o, t);

  if(o.kind === 'charge'){
    const r = vsub(p, src), d = vlen(r);
    if(d < 1e-4) return EM_ZERO;
    const vv = emVel(o), beta = vlen(vv);
    if(beta < 1e-9){
      return { E: vmul(r, o.q / (FOURPI * d * d * d)), B: v3(0, 0, 0) };
    }
    /* exact field of a uniformly moving charge: the Coulomb field flattened
       into the transverse plane. sin²θ is measured from the velocity. */
    const b2 = Math.min(0.9999, beta * beta);
    const cos = vdot(r, vv) / (d * beta);
    const sin2 = Math.max(0, 1 - cos * cos);
    const denom = Math.pow(1 - b2 * sin2, 1.5);
    const E = vmul(r, o.q * (1 - b2) / (FOURPI * d * d * d * denom));
    return { E, B: vcross(vv, E) };            // B = v × E / c², c = 1
  }

  if(o.kind === 'wire'){
    /* infinite straight current along ±ẑ through (px, py) */
    const s = v3(p.x - src.x, p.y - src.y, 0), d = vlen(s);
    if(d < 1e-4) return EM_ZERO;
    const phi = vcross(v3(0, 0, 1), vmul(s, 1 / d));       // ẑ × ŝ
    return { E: v3(0, 0, 0), B: vmul(phi, o.I / (2 * Math.PI * d)) };
  }

  if(o.kind === 'magnet'){
    const m = v3(o.m.x, o.m.y, o.m.z || 0);
    const r = vsub(p, src), d = vlen(r);
    if(d < 1e-3) return EM_ZERO;
    const rh = vmul(r, 1 / d);
    const B = vmul(vsub(vmul(rh, 3 * vdot(m, rh)), m), 1 / (FOURPI * d * d * d));
    const vv = emVel(o);
    /* A magnet's rest frame has E = 0, so in the lab E = −v×B. This is the
       first order in v/c of the field transformation (the exact one carries a γ
       on the perpendicular components), and it is the order at which the pair
       "B translating rigidly, E = −v×B" satisfies ∇×E = −∂B/∂t identically —
       which is the statement Faraday's law is about, and what the tests check. */
    const E = vlen(vv) < 1e-9 ? v3(0, 0, 0) : vmul(vcross(vv, B), -1);
    return { E, B };
  }

  return EM_ZERO;                              // 'loop' and probes are not sources
}

/* ---- superposition ---- */
function emField(objs, p, t){
  let E = v3(0, 0, 0), B = v3(0, 0, 0);
  for(const o of objs){
    const f = emFieldOf(o, p, t);
    E = vadd(E, f.E); B = vadd(B, f.B);
  }
  return { E, B };
}
const emEnergyDensity = f => 0.5 * (vdot(f.E, f.E) + vdot(f.B, f.B));   // u = ½(ε₀E² + B²/μ₀)
const emPoynting = f => vcross(f.E, f.B);                               // S = E×B/μ₀

/* ---- Lorentz force and dipole mechanics ---- */
const emLorentz = (q, v, f) => vmul(vadd(f.E, vcross(v, f.B)), q);
const emTorque = (m, f) => vcross(m, f.B);
/* F = ∇(m·B), by central differences on the external field */
function emDipoleForce(objs, i, t, h){
  const o = objs[i], m = v3(o.m.x, o.m.y, o.m.z || 0), p = emPos(o, t);
  const others = objs.filter((_, j) => j !== i);
  const step = h || 1e-3;
  const U = q => vdot(m, emField(others, q, t).B);
  return v3(
    (U(vadd(p, v3(step, 0, 0))) - U(vsub(p, v3(step, 0, 0)))) / (2 * step),
    (U(vadd(p, v3(0, step, 0))) - U(vsub(p, v3(0, step, 0)))) / (2 * step),
    (U(vadd(p, v3(0, 0, step))) - U(vsub(p, v3(0, 0, step)))) / (2 * step)
  );
}
/* the net force each placed object feels from all the others */
function emForceOn(objs, i, t){
  const o = objs[i];
  const others = objs.filter((_, j) => j !== i);
  if(!others.length) return v3(0, 0, 0);
  const f = emField(others, emPos(o, t), t);
  if(o.kind === 'charge') return emLorentz(o.q, emVel(o), f);
  if(o.kind === 'magnet') return emDipoleForce(objs, i, t);
  return v3(0, 0, 0);
}

/* ============================================================================
   The four integrals. Each is evaluated numerically from the fields alone —
   nothing here consults the source list, so agreement with Q_enc or I_enc is
   evidence rather than tautology.
   ============================================================================ */

/* ∮E·dA and ∮B·dA over a sphere of radius R (dA = R² sinθ dθ dφ) */
function emFluxSphere(objs, c, R, t, which, n){
  const nT = n || 40, nP = 2 * nT, dT = Math.PI / nT, dP = 2 * Math.PI / nP;
  let total = 0;
  for(let i = 0; i < nT; i++){
    const th = (i + 0.5) * dT, st = Math.sin(th), ct = Math.cos(th);
    const dS = R * R * st * dT * dP;
    for(let j = 0; j < nP; j++){
      const ph = (j + 0.5) * dP;
      const nh = v3(st * Math.cos(ph), st * Math.sin(ph), ct);
      const f = emField(objs, vadd(c, vmul(nh, R)), t);
      const d = vdot(which === 'B' ? f.B : f.E, nh);
      if(Number.isFinite(d)) total += d * dS;
    }
  }
  return total;
}
const emFluxE = (objs, c, R, t, n) => emFluxSphere(objs, c, R, t, 'E', n);
const emFluxB = (objs, c, R, t, n) => emFluxSphere(objs, c, R, t, 'B', n);

/* charge enclosed by that sphere — the right-hand side of Gauss's law */
function emEnclosedCharge(objs, c, R, t){
  let q = 0;
  for(const o of objs) if(o.kind === 'charge' && vlen(vsub(emPos(o, t), c)) < R) q += o.q;
  return q;
}

/* ∫F·n̂ dA over the flat disc of radius R bounded by the loop (polar grid) */
function emFluxDisc(objs, c, R, nh, t, which, n){
  const nR = n || 26, nA = 4 * nR;
  const u = vperp(nh), v = vcross(nh, u);
  let total = 0;
  for(let i = 0; i < nR; i++){
    const r0 = R * i / nR, r1 = R * (i + 1) / nR;
    const rm = 0.5 * (r0 + r1), dA = Math.PI * (r1 * r1 - r0 * r0) / nA;
    for(let j = 0; j < nA; j++){
      const a = (j + 0.5) * 2 * Math.PI / nA;
      const p = vadd(c, vadd(vmul(u, rm * Math.cos(a)), vmul(v, rm * Math.sin(a))));
      const f = emField(objs, p, t);
      const d = vdot(which === 'E' ? f.E : f.B, nh);
      if(Number.isFinite(d)) total += d * dA;
    }
  }
  return total;
}
const emFluxBDisc = (objs, c, R, nh, t, n) => emFluxDisc(objs, c, R, nh, t, 'B', n);
const emFluxEDisc = (objs, c, R, nh, t, n) => emFluxDisc(objs, c, R, nh, t, 'E', n);

/* ∮F·dl around the rim, oriented by the right-hand rule about n̂ */
function emCirculation(objs, c, R, nh, t, which, n){
  const N = n || 360, dth = 2 * Math.PI / N;
  const u = vperp(nh), v = vcross(nh, u);
  let total = 0;
  for(let i = 0; i < N; i++){
    const th = (i + 0.5) * dth, ct = Math.cos(th), st = Math.sin(th);
    const p = vadd(c, vadd(vmul(u, R * ct), vmul(v, R * st)));
    const T = vadd(vmul(u, -st), vmul(v, ct));            // unit tangent
    const f = emField(objs, p, t);
    const d = vdot(which === 'E' ? f.E : f.B, T);
    if(Number.isFinite(d)) total += d * R * dth;
  }
  return total;
}
const emCircE = (objs, c, R, nh, t, n) => emCirculation(objs, c, R, nh, t, 'E', n);
const emCircB = (objs, c, R, nh, t, n) => emCirculation(objs, c, R, nh, t, 'B', n);

/* conduction current threading the disc, signed by the right-hand rule */
function emEnclosedCurrent(objs, c, R, nh, t){
  let I = 0;
  for(const o of objs){
    if(o.kind === 'wire'){
      const s = emPos(o, t);
      if(Math.hypot(s.x - c.x, s.y - c.y) < R) I += o.I * (nh.z >= 0 ? 1 : -1);
    }
  }
  return I;
}

/* dΦ/dt by central difference — the terms that make Faraday and Maxwell's
   displacement current work. The sources drift by v·dt between the samples. */
function emDPhiBdt(objs, c, R, nh, t, dt, n){
  const h = dt || 1e-3;
  return (emFluxBDisc(objs, c, R, nh, t + h, n) - emFluxBDisc(objs, c, R, nh, t - h, n)) / (2 * h);
}
function emDPhiEdt(objs, c, R, nh, t, dt, n){
  const h = dt || 1e-3;
  return (emFluxEDisc(objs, c, R, nh, t + h, n) - emFluxEDisc(objs, c, R, nh, t - h, n)) / (2 * h);
}

/* ---- field-line tracing in the z = 0 plane ----
   Lines are everywhere tangent to the field; density is seeded ∝ |q| so the
   textbook "more lines = more charge" convention holds. */
/* `flat` (default true) keeps the trace inside the z = 0 plane; pass false and
   the line follows the genuine three-dimensional field. */
/* How far a point is from a source, respecting its shape: a wire is a line, so
   what matters is the perpendicular distance to it, not to a point on it. */
function emSourceDistance(o, p){
  const s = emPos(o, 0);
  if(o.kind === 'wire') return Math.hypot(p.x - s.x, p.y - s.y);
  if(o.kind === 'loop') return 1e9;                    // not a source
  return vlen(vsub(p, s));
}function emTraceLine(objs, start, which, dir, L, maxSteps, stopAt, flat){
  const twoD = flat !== false;
  const z0 = twoD ? 0 : (start.z || 0);
  const pts = [v3(start.x, start.y, z0)];
  let p = pts[0];
  const h0 = L / 130;
  /* Field lines curve most sharply close to their sources, where a fixed step
     would cut corners and drift onto a neighbouring line. Shrink the step in
     proportion to how near the closest source is. */
  const nearest = q => {
    let d = 1e9;
    for(const o of objs){ const dd = emSourceDistance(o, q); if(dd < d) d = dd; }
    return d;
  };
  const hAt = q => Math.max(h0 * 0.1, Math.min(h0, h0 * nearest(q) / 0.5));
  let h = h0;
  for(let k = 0; k < (maxSteps || 900); k++){
    h = hAt(p);
    const g = q => {
      const f = emField(objs, q, 0);
      const w = which === 'B' ? f.B : f.E;
      const wz = twoD ? 0 : w.z;
      const m = Math.hypot(w.x, w.y, wz);
      return m > 1e-12 && Number.isFinite(m) ? v3(w.x / m * dir, w.y / m * dir, wz / m * dir) : null;
    };
    const k1 = g(p); if(!k1) break;
    const k2 = g(vadd(p, vmul(k1, h / 2))); if(!k2) break;
    p = vadd(p, vmul(k2, h));
    if(Math.abs(p.x) > L * 1.15 || Math.abs(p.y) > L * 1.15 || (!twoD && Math.abs(p.z) > L * 1.15)){ pts.push(p); break; }
    pts.push(v3(p.x, p.y, twoD ? 0 : p.z));
    /* B lines close on themselves — once we come back to the start, stop */
    if(k > 24 && vlen(vsub(p, pts[0])) < h * 1.6){ pts.push(pts[0]); break; }
    let hit = false;
    for(const s of (stopAt || []))
      if(Math.hypot(p.x - s.x, p.y - s.y, twoD ? 0 : p.z - (s.z || 0)) < 0.13){ hit = true; break; }
    if(hit) break;
  }
  return pts;
}
/* evenly spread directions on a sphere — seeds for three-dimensional tracing */
function emFibSphere(n, i){
  const y = 1 - 2 * (i + 0.5) / n;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const th = Math.PI * (1 + Math.sqrt(5)) * i;
  return v3(Math.cos(th) * r, y, Math.sin(th) * r);
}
function emFieldLines(objs, which, L, flat){
  const twoD = flat !== false;
  const lines = [];
  const stops = objs.filter(o => o.kind === 'charge').map(o => o.p);
  if(which === 'E'){
    for(const o of objs){
      if(o.kind !== 'charge' || Math.abs(o.q) < 1e-9) continue;
      const n = twoD ? Math.max(6, Math.min(28, Math.round(7 * Math.sqrt(Math.abs(o.q)))))
                     : Math.max(12, Math.min(40, Math.round(13 * Math.sqrt(Math.abs(o.q)))));
      for(let i = 0; i < n; i++){
        let off;
        if(twoD){ const a = (i + 0.5) / n * 2 * Math.PI; off = v3(Math.cos(a), Math.sin(a), 0); }
        else off = emFibSphere(n, i);
        const seed = { x: o.p.x + 0.14 * off.x, y: o.p.y + 0.14 * off.y, z: (o.p.z || 0) + 0.14 * off.z };
        lines.push({ pts: emTraceLine(objs, seed, 'E', o.q > 0 ? 1 : -1, L, twoD ? 900 : 700, stops, twoD), out: o.q > 0 });
      }
    }
    /* A magnet in motion carries E = −v×B. That field has no charges to start
       or end on, so its lines are closed loops — seed a shell around the magnet
       and let them close. (In the plane this E points straight out of it, so
       there is nothing to trace and the ⊙/⊗ glyphs do the job instead.) */
    if(!twoD) for(const o of objs){
      if(o.kind !== 'magnet' || !o.v) continue;
      if(vlen(emVel(o)) < 1e-6) continue;
      const z0 = o.p.z || 0;
      for(const rr of [0.45, 0.85]) for(let i = 0; i < 7; i++){
        const off = emFibSphere(7, i);
        lines.push({ pts: emTraceLine(objs, { x: o.p.x + rr * off.x, y: o.p.y + rr * off.y, z: z0 + rr * off.z },
                                      'E', 1, L, 700, [], false), out: true });
      }
    }
  } else {
    /* A moving charge is a current: B = v × E circles the velocity axis, is
       zero along it, and is strongest broadside. Seed rings around that axis at
       several stations along it. (In the plane this B is purely out of it, so
       flat view shows it as ⊙/⊗ instead of as traceable curves.) */
    if(!twoD) for(const o of objs){
      if(o.kind !== 'charge' || Math.abs(o.q) < 1e-9) continue;
      const vv = emVel(o), sp = vlen(vv);
      if(sp < 1e-6) continue;
      const u = vmul(vv, 1 / sp), p1 = vperp(u), p2 = vcross(u, p1);
      const z0 = o.p.z || 0;
      for(const along of [-1.0, -0.35, 0.35, 1.0]) for(const rr of [0.5, 1.0]){
        const c0 = v3(o.p.x + u.x * along, o.p.y + u.y * along, z0 + u.z * along);
        const seed = { x: c0.x + p1.x * rr, y: c0.y + p1.y * rr, z: c0.z + p1.z * rr };
        lines.push({ pts: emTraceLine(objs, seed, 'B', 1, L, 700, [], false), out: true });
      }
    }
    /* B lines close on themselves: seed rings around every magnetic source */
    for(const o of objs){
      if(o.kind !== 'wire' && o.kind !== 'magnet') continue;
      const z0 = o.p.z || 0;
      if(o.kind === 'wire'){
        /* the wire runs along ẑ, so its loops live in planes of constant z */
        const rings = [0.35, 0.75, 1.25, 1.9];
        const zs = twoD ? [0] : [z0 - L * 0.45, z0, z0 + L * 0.45];
        for(const rr of rings) for(const zz of zs)
          lines.push({ pts: emTraceLine(objs, { x: o.p.x + rr, y: o.p.y, z: zz }, 'B', 1, L,
                                        twoD ? 1100 : 800, [], twoD), out: true });
      } else {
        const rings = twoD ? [0.3, 0.55, 0.9] : [0.32, 0.62, 1.0];
        for(const rr of rings){
          const nA = twoD ? 5 : 9;
          for(let i = 0; i < nA; i++){
            let off;
            if(twoD){ const a = (i + 0.5) / nA * 2 * Math.PI + 0.3; off = v3(Math.cos(a), Math.sin(a), 0); }
            else off = emFibSphere(nA, i);
            lines.push({ pts: emTraceLine(objs, { x: o.p.x + rr * off.x, y: o.p.y + rr * off.y, z: z0 + rr * off.z },
                                          'B', 1, L, twoD ? 1100 : 800, [], twoD), out: true });
          }
        }
      }
    }
  }
  return lines;
}

/* ---- the plane wave Maxwell's equations imply in empty space ----
   E = E₀ ŷ cos(kx − ωt), B = E₀ ẑ cos(kx − ωt), ω/k = c = 1.
   Substituting into ∇×E = −∂B/∂t gives kE₀ = ωB₀, so |E| = |B| exactly. */
function emPlaneWave(x, t, k, E0){
  const ph = k * x - k * t;                    // ω = ck = k
  const a = (E0 === undefined ? 1 : E0) * Math.cos(ph);
  return { E: v3(0, a, 0), B: v3(0, 0, a), phase: ph };
}

/* ============================================================================
   Dynamics for the sandbox. Two things are worth being careful about, because
   getting them wrong is the usual way a "physics" simulation quietly stops
   being physics.
   ============================================================================ */

/* Relativistic push. The fields here are the exact fields of a charge in
   uniform motion, which only make sense for |v| < c, so the motion must
   respect that too — not by clamping the speed, but by integrating the
   momentum, which is what actually obeys Newton's second law:
       p = γmv,   dp/dt = F,   v = p/√(m² + p²)
   With m = c = 1 this is two lines, and |v| approaches 1 without reaching it. */
function emRelativisticPush(v, F, dt){
  const v2 = Math.min(0.999999, vdot(v, v));
  const g = 1 / Math.sqrt(Math.max(1e-12, 1 - v2));
  const p = vadd(vmul(v, g), vmul(F, dt));
  return vmul(p, 1 / Math.sqrt(1 + vdot(p, p)));
}
const emGamma = v => 1 / Math.sqrt(Math.max(1e-12, 1 - Math.min(0.999999, vdot(v, v))));
/* The Boris pusher — the standard integrator for a charge in E and B, and the
   reason this simulation can be trusted over long runs. A plain Euler step
   makes a cyclotron orbit spiral outward, quietly inventing energy; Boris
   splits the step into two half electric kicks around an *exact* rotation by
   the magnetic field, so a pure magnetic field changes the direction of p and
   never its magnitude. Magnetic forces do no work, and here that is true to
   machine precision rather than approximately. (m = c = 1.) */
function emBorisPush(v, q, E, B, dt){
  let p = vmul(v, emGamma(v));                     // p = γmv
  const h = q * dt * 0.5;
  p = vadd(p, vmul(E, h));                         // half electric kick
  const gm = Math.sqrt(1 + vdot(p, p));
  const tv = vmul(B, h / gm);
  const sv = vmul(tv, 2 / (1 + vdot(tv, tv)));
  p = vadd(p, vcross(vadd(p, vcross(p, tv)), sv)); // exact magnetic rotation
  p = vadd(p, vmul(E, h));                         // second half kick
  return vmul(p, 1 / Math.sqrt(1 + vdot(p, p)));   // back to v = p/√(m²+p²)
}
/* kinetic energy (m = c = 1) and relativistic momentum, for the readout */
const emKinetic = v => emGamma(v) - 1;
const emMomentum = v => vmul(v, emGamma(v));

/* A magnetic dipole is a rigid rotor: τ = m × B drives it, and the axis of the
   torque is the axis it turns about. Rotating only within the xy-plane (the
   easy shortcut) is wrong the moment B leaves that plane, so integrate the
   angular velocity as a vector and rotate m about it. |m| is a property of the
   magnet and must not drift, hence the renormalisation. */
const EM_DIPOLE_I = 0.08;          // moment of inertia — sets how briskly it swings
const EM_DIPOLE_DAMP = 2.0;        // so a compass settles instead of ringing forever
function emSpinStep(m, B, w, dt, planar){
  let tau = vcross(m, B);
  if(planar) tau = v3(0, 0, tau.z);                 // the flat view can only show z-rotation
  let w2 = vadd(w, vmul(vsub(vmul(tau, 1 / EM_DIPOLE_I), vmul(w, EM_DIPOLE_DAMP)), dt));
  if(planar) w2 = v3(0, 0, w2.z);
  const m2 = vadd(m, vmul(vcross(w2, m), dt));      // dm/dt = ω × m
  const L0 = vlen(m), L2 = vlen(m2);
  return { m: L2 > 1e-12 ? vmul(m2, L0 / L2) : m, w: w2 };
}
