/* ============================================================================
   1q · ELECTROSTATICS, POTENTIAL AND CAPACITANCE
   AP Physics 2 units 3–4 and AP Physics C: E&M units 1–2.

   The electromagnetism wing already has Maxwell's equations with both sides of
   each measured; this module is the AP-level ground floor beneath it — Coulomb's
   law, the field of an arrangement of point charges, the potential as the work
   per unit charge, equipotentials, Gauss's law on the three symmetric cases, and
   capacitance with and without a dielectric.
   ============================================================================ */

const ES_K = 8.9875517873681764e9;       // N·m²/C² — 1/(4πε₀)
const ES_EPS0 = 8.8541878188e-12;        // F/m — CODATA 2022
const ES_E = 1.602176634e-19;            // C — exact, since the 2019 SI

/* ------------------------------------------------------------ point charges ---- */
const esCoulomb = (q1, q2, r) => ES_K * q1 * q2 / (r * r);
/* the field of a set of point charges, superposed — the only rule there is */
function esField(charges, x, y){
  let Ex = 0, Ey = 0;
  for(const c of charges){
    const dx = x - c.x, dy = y - c.y;
    const r2 = dx * dx + dy * dy;
    if(r2 < 1e-9) return { Ex:NaN, Ey:NaN, mag:Infinity };
    const r = Math.sqrt(r2), k = ES_K * c.q / (r2 * r);
    Ex += k * dx; Ey += k * dy;
  }
  return { Ex, Ey, mag:Math.hypot(Ex, Ey) };
}
/* the potential — a scalar, so it superposes by plain addition, which is why
   it is nearly always the easier thing to compute first */
function esPotential(charges, x, y){
  let V = 0;
  for(const c of charges){
    const r = Math.hypot(x - c.x, y - c.y);
    if(r < 1e-9) return Infinity;
    V += ES_K * c.q / r;
  }
  return V;
}
/* E = −∇V, checked numerically against the directly summed field so the
   relationship is demonstrated rather than assumed */
function esFieldFromV(charges, x, y, h){
  const d = h || 1e-4;
  const Ex = -(esPotential(charges, x + d, y) - esPotential(charges, x - d, y)) / (2 * d);
  const Ey = -(esPotential(charges, x, y + d) - esPotential(charges, x, y - d)) / (2 * d);
  return { Ex, Ey, mag:Math.hypot(Ex, Ey) };
}
/* the work to move a test charge between two points — path-independent, which
   the lab checks by integrating along two different routes */
function esWork(charges, q, x1, y1, x2, y2){
  return q * (esPotential(charges, x1, y1) - esPotential(charges, x2, y2));
}
function esWorkAlongPath(charges, q, path, t0, t1){
  /* W = ∫F·dr = q∫E·dr — no minus. The minus belongs to E = −∇V, and putting
     it here as well would double-count it. */
  return q * nqAdaptive(t => {
    const p = path.f(t), d = path.d(t);
    const E = esField(charges, p.x, p.y);
    return E.Ex * d.x + E.Ey * d.y;
  }, t0, t1, 1e-10);
}
/* the standard arrangements, with their exact far-field behaviour */
const ES_ARRANGE = {
  single:  { name:'A single charge', q:[{ x:0, y:0, q:2e-9 }], falloff:'E ~ 1/r², V ~ 1/r',
    note:'The field lines radiate outward and never close. The 1/r² is not a coincidence of three dimensions — it is the statement that the same total flux spreads over a sphere whose area grows as r².' },
  dipole:  { name:'A dipole  (+q and −q)', q:[{ x:-0.5, y:0, q:2e-9 }, { x:0.5, y:0, q:-2e-9 }],
    falloff:'E ~ 1/r³, V ~ 1/r²',
    note:'Every field line that leaves the positive charge ends on the negative one. Far away the two nearly cancel, so the field falls off faster than either charge alone — 1/r³. Every neutral molecule with an asymmetry looks like this from a distance, which is why water is a solvent.' },
  quad:    { name:'A quadrupole', q:[{ x:-0.5, y:-0.5, q:2e-9 }, { x:0.5, y:0.5, q:2e-9 },
                                     { x:0.5, y:-0.5, q:-2e-9 }, { x:-0.5, y:0.5, q:-2e-9 }],
    falloff:'E ~ 1/r⁴',
    note:'Zero net charge and zero net dipole moment, so the leading term is the next one down again. The multipole expansion is this pattern continued, and it is how a complicated charge distribution is described from far away without knowing its details.' },
  same:    { name:'Two like charges', q:[{ x:-0.6, y:0, q:2e-9 }, { x:0.6, y:0, q:2e-9 }],
    falloff:'E ~ 1/r² far away',
    note:'The field vanishes exactly at the midpoint — a null where a test charge feels nothing but is in unstable equilibrium. Earnshaw\'s theorem says no arrangement of static charges can trap another charge stably, and this null is the reason: it is a saddle of the potential, never a minimum.' },
  line:    { name:'A line of charges', q:Array.from({ length:9 }, (_, i) => ({ x:-1 + i * 0.25, y:0, q:0.5e-9 })),
    falloff:'E ~ 1/r close in, 1/r² far away',
    note:'Close to the line the field goes as 1/r, because the relevant symmetry is cylindrical rather than spherical. Far enough away the finite line looks like a point again — a reminder that a "1/r law" is always a statement about a regime.' },
  plates:  { name:'Two opposed rows  (a capacitor)',
    q:Array.from({ length:14 }, (_, i) => ({ x:-1.2 + (i % 7) * 0.4, y:i < 7 ? 0.5 : -0.5, q:i < 7 ? 1e-9 : -1e-9 })),
    falloff:'uniform between, ~0 outside',
    note:'The field is very nearly uniform between the rows and very nearly zero outside — which is exactly what a parallel-plate capacitor is for. The bulging at the ends is the <b>fringing field</b>, the part every idealised treatment throws away.' }
};

/* -------------------------------------------------------------- Gauss's law ---- */
/* The three cases where symmetry makes the integral trivial. Each returns the
   field both from the closed form and by numerically integrating the flux over
   the drawn surface, so the theorem is checked and not merely applied. */
const ES_GAUSS = {
  sphere: { name:'Uniformly charged solid sphere',
    E:(Q, R, r) => r >= R ? ES_K * Q / (r * r) : ES_K * Q * r / (R * R * R),
    V:(Q, R, r) => r >= R ? ES_K * Q / r : ES_K * Q * (3 * R * R - r * r) / (2 * R * R * R),
    note:'Outside, the sphere is indistinguishable from a point charge at its centre — Newton proved the gravitational version of this and reportedly delayed publishing until he had. Inside, only the enclosed charge counts, and that grows as r³, so E rises <i>linearly</i> from zero at the centre.' },
  shell: { name:'Thin spherical shell',
    E:(Q, R, r) => r >= R ? ES_K * Q / (r * r) : 0,
    V:(Q, R, r) => r >= R ? ES_K * Q / r : ES_K * Q / R,
    note:'Exactly zero field everywhere inside, however close to the wall you stand. The nearer piece of shell is smaller in exact proportion to its being closer, and the two effects cancel to all orders. That is why a conductor screens its interior, and why Cavendish could bound the exponent in Coulomb\'s law to 2 ± 0.02 in 1773 without measuring a single force.' },
  line: { name:'Infinite line of charge',
    E:(lam, _R, r) => 2 * ES_K * lam / r,
    V:(lam, _R, r) => -2 * ES_K * lam * Math.log(r),
    note:'A cylindrical Gaussian surface: the flux leaves only through the curved side, whose area grows as r, so E falls as 1/r. The potential is logarithmic and has no sensible zero at infinity — a reminder that "V → 0 far away" is a convention, not a law.' },
  plane: { name:'Infinite sheet of charge',
    E:(sig) => 2 * Math.PI * ES_K * sig,
    V:(sig, _R, r) => -2 * Math.PI * ES_K * sig * r,
    note:'The field does not fall off at all. Doubling your distance doubles the amount of sheet you can "see" in exactly the way that cancels the 1/r² — and the result is the uniform field that makes parallel-plate capacitors and CRTs work.' }
};
/* the flux through a sphere of radius r, integrated over the surface */
function esFluxSphere(charges3, r, n){
  const N = n || 40;
  let flux = 0;
  for(let i = 0; i < N; i++) for(let j = 0; j < 2 * N; j++){
    const ph = Math.PI * (i + 0.5) / N, th = Math.PI * (j + 0.5) / N;
    const p = gaFromSph(r, ph, th);
    let Ex = 0, Ey = 0, Ez = 0;
    for(const c of charges3){
      const dx = p.x - c.x, dy = p.y - c.y, dz = p.z - (c.z || 0);
      const r2 = dx * dx + dy * dy + dz * dz, rr = Math.sqrt(r2);
      if(rr < 1e-9) continue;
      const k = ES_K * c.q / (r2 * rr);
      Ex += k * dx; Ey += k * dy; Ez += k * dz;
    }
    const nh = vmul(p, 1 / r);
    const dA = r * r * Math.sin(ph) * (Math.PI / N) * (Math.PI / N);
    flux += (Ex * nh.x + Ey * nh.y + Ez * nh.z) * dA;
  }
  return flux;
}

/* ------------------------------------------------------------- capacitance ---- */
const esCapPlate = (A, d, kappa) => (kappa === undefined ? 1 : kappa) * ES_EPS0 * A / d;
const esCharge = (C, V) => C * V;
const esEnergy = (C, V) => 0.5 * C * V * V;
const esEnergyDensity = E => 0.5 * ES_EPS0 * E * E;
/* series and parallel — the opposite of resistors, and the reason why is that
   capacitors in series must all carry the same charge */
const esSeries = Cs => 1 / Cs.reduce((s, c) => s + 1 / c, 0);
const esParallel = Cs => Cs.reduce((s, c) => s + c, 0);
/* what a dielectric does, and the two cases that give opposite answers */
function esDielectric(C0, V0, kappa, connected){
  const C = kappa * C0;
  if(connected){
    /* battery attached: V is held, so Q and U both rise */
    return { C, V:V0, Q:C * V0, U:0.5 * C * V0 * V0,
      dQ:C * V0 - C0 * V0, dU:0.5 * (C - C0) * V0 * V0,
      note:'With the battery still connected the voltage is fixed, so the extra capacitance pulls more charge from the supply and the stored energy <i>rises</i>. The battery does the work — and the slab is pulled in.' };
  }
  const Q = C0 * V0;
  return { C, Q, V:Q / C, U:0.5 * Q * Q / C,
    dQ:0, dU:0.5 * Q * Q / C - 0.5 * Q * Q / C0,
    note:'Disconnected first, so the charge is trapped. The dielectric partially cancels the field, the voltage drops by a factor of κ, and the stored energy <i>falls</i> — the slab is still pulled in, and the energy difference is the work it does on the way.' };
}
const ES_DIELECTRICS = {
  vacuum:  { name:'Vacuum',        k:1,    strength:Infinity },
  air:     { name:'Air',           k:1.00059, strength:3e6 },
  paper:   { name:'Paper',         k:3.7,  strength:16e6 },
  glass:   { name:'Pyrex',         k:5.6,  strength:14e6 },
  mica:    { name:'Mica',          k:5.4,  strength:100e6 },
  water:   { name:'Water',         k:80.4, strength:65e6 },
  titania: { name:'Strontium titanate', k:310, strength:8e6 }
};
/* a charged particle steered by a uniform field — the CRT, the inkjet head,
   and the mass spectrometer, all the same calculation */
function esDeflect(q, m, V, d, L, v0){
  const E = V / d;
  const a = q * E / m;
  const t = L / v0;
  return { E, a, t, y:0.5 * a * t * t, vy:a * t,
    angle:Math.atan2(a * t, v0), KEgain:q * E * 0.5 * a * t * t };
}
