/* ============================================================================
   3g · RELATIVITY ENGINE
   Two postulates and their entire consequence, computed rather than asserted.

     1 · the laws of physics are the same in every inertial frame
     2 · c is one of those laws, so every inertial frame measures the same c

   Everything in this file follows from those. The special-relativistic half
   works in natural units (c = 1), where a boost is a hyperbolic rotation of
   spacetime and the Lorentz factor is a secant of the rapidity:

     t' = γ(t − βx)      x' = γ(x − βt)      γ = 1/√(1−β²) = cosh φ,  β = tanh φ

   and the invariant that survives every boost is the interval

     s² = (ct)² − x² − y² − z².

   The electromagnetic half is the same transformation applied to the field
   tensor F^{μν}: E and B are not two fields but six components of one, and a
   boost mixes them. That is why this module sits next to the E&M engine — the
   "magnetic" force on a moving charge is an electrostatic force seen from the
   wrong frame, and relWireFrames() computes both and shows them agreeing.

   The general-relativistic half works in SI with real constants, because the
   whole point of the classical tests is that they produce specific numbers:
   43″/century for Mercury, 1.75″ at the solar limb, 38 μs/day for GPS. Those
   are computed here and checked by the test suite against the published values.
   ============================================================================ */

/* ---- constants: CODATA 2022, IAU 2015 nominal values, GWTC-1 ---- */
const C_SI       = 299792458;             // m/s — exact; it defines the metre
const G_SI       = 6.67430e-11;           // m³kg⁻¹s⁻² — CODATA 2022, and still
                                          //   the worst-measured constant in physics
const C2         = C_SI * C_SI;
const C3         = C2 * C_SI;
/* GM is measured hugely better than G and M separately, so the ephemerides
   quote the product; using it avoids importing G's four-digit uncertainty. */
const GM_SUN     = 1.32712440018e20;      // m³/s² — IAU 2015 nominal
const GM_EARTH   = 3.986004418e14;        // m³/s² — WGS-84 / EGM
const R_SUN      = 6.957e8;               // m — IAU nominal solar radius
const R_EARTH    = 6371000;               // m — mean
const AU_M       = 1.495978707e11;        // m — exact by definition
const M_SUN_KG   = 1.98841e30;            // kg — GM_SUN / G_SI, to the precision G allows
const ARCSEC     = 180 * 3600 / Math.PI;  // radians → arcseconds
const PARSEC     = 3.0856775814913673e16; // m

/* ============================================================================
   1 · KINEMATICS — boosts, rapidity, the interval
   ============================================================================ */

/* Every function that takes a β refuses |β| ≥ 1 rather than returning NaN: an
   infinity produced silently three calls deep is far harder to diagnose than a
   thrown error at the point of the mistake. */
function relCheckBeta(b){
  if(!Number.isFinite(b) || Math.abs(b) >= 1)
    throw new MathError('β must satisfy |β| < 1 — nothing with mass reaches c (got ' + b + ')');
  return b;
}
const relGamma  = b => 1 / Math.sqrt(1 - relCheckBeta(b) * b);
const relBetaOf = g => g <= 1 ? 0 : Math.sqrt(1 - 1 / (g * g));

/* Rapidity is the angle of the hyperbolic rotation. Its whole virtue is that
   it ADDS under composition, where velocities do not: the awkward velocity
   addition rule is just tanh(φ₁+φ₂) written out. */
const relRapidity   = b => Math.atanh(relCheckBeta(b));
const relBetaFromRap = phi => Math.tanh(phi);
const relGammaFromRap = phi => Math.cosh(phi);

/* the boost itself, c = 1, along +x */
function relBoost(t, x, beta){
  const g = relGamma(beta);
  return { t: g * (t - beta * x), x: g * (x - beta * t) };
}
const relUnboost = (t, x, beta) => relBoost(t, x, -beta);

/* the one number every frame agrees on. Sign convention: timelike positive. */
const relInterval = (t, x, y, z) =>
  t * t - (x * x + (y || 0) * (y || 0) + (z || 0) * (z || 0));
const relIntervalKind = s2 => s2 > 1e-12 ? 'timelike' : s2 < -1e-12 ? 'spacelike' : 'lightlike';

/* collinear velocity addition — the rule that keeps c out of reach */
function relVelAdd(u, v){
  const w = (u + v) / (1 + u * v);
  return w;
}
/* the full 3-velocity transformation under a boost β along x. The transverse
   components change too, even though transverse LENGTHS do not, because the
   time they are divided by is not the same time. */
function relVelBoost(u, beta){
  const g = relGamma(beta), d = 1 - beta * u.x;
  if(Math.abs(d) < 1e-15) throw new MathError('that velocity is unreachable by this boost');
  return v3((u.x - beta) / d, u.y / (g * d), u.z / (g * d));
}

/* ---- proper time along a piecewise-inertial worldline ---- */
/* legs are [{dt, beta}] in the lab frame; dτ = dt/γ on each */
function relProperTime(legs){
  let tau = 0;
  for(const L of legs) tau += L.dt / relGamma(L.beta);
  return tau;
}

/* ---- constant proper acceleration: the closest thing to "chasing light" ---- */
/* A rocket that feels a steady 1 g forever. It never reaches c — it asymptotes
   to the light cone — but its own clock runs slow without bound, which is why
   the galaxy is crossable in a human lifetime and unreachably far in ours. */
function relHyperbolic(a, t){
  const at = a * t, s = Math.sqrt(1 + at * at);
  return {
    x: (s - 1) / a,          // distance covered, lab frame
    beta: at / s,            // never ≥ 1, for any t
    gamma: s,
    tau: Math.asinh(at) / a  // the traveller's own elapsed time
  };
}
/* the same worldline parameterised by the traveller's clock instead */
function relHyperbolicTau(a, tau){
  const ch = Math.cosh(a * tau);
  return { x: (ch - 1) / a, t: Math.sinh(a * tau) / a, beta: Math.tanh(a * tau), gamma: ch };
}
/* Behind an eternally accelerating observer is a horizon at proper distance
   c²/a: signals from beyond it never catch up. Acceleration alone makes one. */
const relRindlerHorizon = a => 1 / a;

/* A trip of distance D at constant proper acceleration a: speed up for the
   first half, slow down for the second, arriving at rest. The traveller's own
   clock is the interesting output — it grows like log D while the Earth's grows
   like D, which is why the galaxy is crossable in a career and unvisitable in a
   civilisation. Metres and seconds in, metres and seconds out. */
function relTrip(a, D){
  const k = 1 + a * D / (2 * C2);         // γ at turnover
  const s = Math.sqrt(k * k - 1);
  return {
    tau: 2 * C_SI / a * Math.acosh(k),    // the traveller's elapsed time
    t:   2 * C_SI / a * s,                // the elapsed time at home
    gammaMax: k,
    betaMax: s / k
  };
}

/* ============================================================================
   2 · LIGHT — Doppler, aberration, the headlight effect
   ============================================================================ */

/* The k-factor: what a receding clock's ticks look like on arrival. Bondi built
   the whole of special relativity out of this one number. */
const relKFactor = beta => Math.sqrt((1 + relCheckBeta(beta)) / (1 - beta));

/* General Doppler. θ is measured in the OBSERVER's frame, from the source's
   direction of motion to the line along which the light travels to the
   observer. θ = 0 is head-on approach, θ = π/2 is transverse. */
function relDoppler(beta, theta){
  return 1 / (relGamma(beta) * (1 - beta * Math.cos(theta)));
}
/* At θ = π/2 the classical shift vanishes and a pure time-dilation redshift of
   1/γ is left over — the transverse Doppler effect, which has no classical
   counterpart at all and is the cleanest direct test of time dilation. */
const relTransverseDoppler = beta => 1 / relGamma(beta);

/* Aberration: a photon emitted at θ′ in the source frame arrives at θ in the
   observer frame. Isotropic emission from a fast source is beamed forward into
   a cone of half-angle ≈ 1/γ — the headlight effect, and the reason relativistic
   jets look one-sided and synchrotron beamlines are useful. */
const relAberration = (cosSrc, beta) => (cosSrc + beta) / (1 + beta * cosSrc);
const relBeamingAngle = beta => Math.acos(relAberration(0, beta));   // where θ′ = 90° lands

/* what fraction of the sky an isotropic emitter's light is squeezed into,
   forward of the beaming angle */
const relBeamFraction = beta => (1 - Math.cos(relBeamingAngle(beta))) / 2;

/* ============================================================================
   3 · DYNAMICS — energy, momentum, the mass shell
   ============================================================================ */

/* Natural units throughout: energies and momenta in units of mc², masses in
   units of m. E² − p² = m² is the statement that four-momentum has a fixed
   length; everything else here is bookkeeping around it. */
const relEnergy   = (m, beta) => relGamma(beta) * m;
const relMomentum = (m, beta) => relGamma(beta) * m * beta;
const relKinetic  = (m, beta) => (relGamma(beta) - 1) * m;
const relEnergyFromP = (m, p) => Math.hypot(m, p);      // E = √(p² + m²)
const relBetaFromP   = (m, p) => p / Math.hypot(m, p);  // = p/E, always < 1

/* the classical answer, for the comparison every dynamics stage draws */
const relKineticClassical = (m, beta) => 0.5 * m * beta * beta;

/* ---- the muon, because it is the experiment everyone can check ---- */
const M_MUON   = 105.6583755;        // MeV — PDG 2024
const TAU_MUON = 2.1969811e-6;       // s — mean lifetime at rest, PDG 2024
/* Fraction of a beam surviving a distance L, with and without time dilation.
   Frisch and Smith counted cosmic-ray muons on Mount Washington and at sea
   level in 1963 and got the dilated number, which differs from the undilated
   one by nine orders of magnitude — the least ambiguous measurement in the
   whole subject. */
function relMuonSurvival(beta, L, tau){
  const t0 = tau === undefined ? TAU_MUON : tau;
  const t = L / (beta * C_SI);                        // ground-frame flight time
  return {
    flightTime: t,
    dilated:   Math.exp(-t / (relGamma(beta) * t0)),  // what is actually observed
    classical: Math.exp(-t / t0),                     // what Newton predicts
    properDistance: L / relGamma(beta)                // the muon's own view: a short hop
  };
}

/* Force is no longer parallel to acceleration: pushing along the motion is
   harder than pushing across it by a factor of γ². This is the fact that
   killed "relativistic mass" as a useful idea — there would have to be two. */
const relLongMass  = (m, beta) => m * Math.pow(relGamma(beta), 3);
const relTransMass = (m, beta) => m * relGamma(beta);

/* invariant mass of a system of four-momenta {E, px, py, pz} */
function relInvariantMass(ps){
  let E = 0, x = 0, y = 0, z = 0;
  for(const p of ps){ E += p.E; x += p.px || 0; y += p.py || 0; z += p.pz || 0; }
  return Math.sqrt(Math.max(0, E * E - (x * x + y * y + z * z)));
}
/* the reason colliders collide rather than fire at fixed targets: available
   energy grows as √E in a fixed-target machine and as E head-on */
const relCMFixedTarget = (E, m) => Math.sqrt(Math.max(0, 2 * m * E + 2 * m * m));
const relCMCollider    = E => 2 * E;

/* ============================================================================
   4 · ELECTROMAGNETISM IS RELATIVITY
   E and B are not two fields. They are six components of one antisymmetric
   tensor, and a boost rotates them into each other exactly as a spatial
   rotation rotates x into y. Units: c = 1, so E and B share a scale.
   ============================================================================ */

/* the transformation, in vector form. (The atom wing's relBoostField() is a
   different thing — the 2D field of one moving charge; this is the general
   six-component transformation of an arbitrary field.) */
function relTransformEB(E, B, v){
  const b2 = vdot(v, v);
  if(b2 >= 1) throw new MathError('a frame cannot move at or beyond c');
  if(b2 < 1e-20) return { E: v3(E.x, E.y, E.z), B: v3(B.x, B.y, B.z) };
  const g = 1 / Math.sqrt(1 - b2), n = vmul(v, 1 / Math.sqrt(b2));
  const Epar = vmul(n, vdot(E, n)), Bpar = vmul(n, vdot(B, n));
  /* v×B and v×E are automatically perpendicular to v, so no further projection
     is needed on the cross-product terms */
  return {
    E: vadd(Epar, vmul(vadd(vsub(E, Epar), vcross(v, B)), g)),
    B: vadd(Bpar, vmul(vsub(vsub(B, Bpar), vcross(v, E)), g))
  };
}

/* The two quantities every frame agrees on. They decide what a field IS:
     E·B = 0 and E²−B² > 0 → a frame exists where the field is purely electric
     E·B = 0 and E²−B² < 0 → a frame exists where it is purely magnetic
     E·B = 0 and E²−B² = 0 → a wave; no frame can make it anything else
     E·B ≠ 0               → no frame can remove either one  */
const relFieldInvariants = (E, B) => ({ dot: vdot(E, B), diff: vdot(E, E) - vdot(B, B) });
function relFieldCharacter(E, B){
  const I = relFieldInvariants(E, B);
  const scale = Math.max(1e-12, vdot(E, E) + vdot(B, B));
  if(Math.abs(I.dot) > 1e-9 * scale) return 'neither — E·B ≠ 0, so no frame removes either field';
  if(I.diff >  1e-9 * scale) return 'electric — a frame exists where B vanishes';
  if(I.diff < -1e-9 * scale) return 'magnetic — a frame exists where E vanishes';
  return 'null — a light wave; every frame sees a wave';
}
/* the boost that removes the magnetic field (when the invariants allow it) */
function relDriftVelocity(E, B){
  const B2 = vdot(B, B), E2 = vdot(E, E);
  const S = vcross(E, B), s = vdot(S, S);
  if(s < 1e-24) return v3(0, 0, 0);
  /* the frame in which E ∥ B: v = (E×B)/max(E²,B²), the E×B drift of plasma
     physics, which is exactly this boost in disguise */
  return vmul(S, 1 / Math.max(E2, B2));
}

/* ---- the field tensor, explicitly ---- */
/* F^{μν} with x⁰ = t, signature (+,−,−,−), c = 1:
        ⎡  0   −Eₓ  −E_y −E_z ⎤
        ⎢  Eₓ   0   −B_z  B_y ⎥
        ⎢  E_y  B_z  0   −Bₓ  ⎥
        ⎣  E_z −B_y  Bₓ   0   ⎦                                              */
function relFieldTensor(E, B){
  return [
    [ 0,   -E.x, -E.y, -E.z],
    [ E.x,  0,   -B.z,  B.y],
    [ E.y,  B.z,  0,   -B.x],
    [ E.z, -B.y,  B.x,  0  ]
  ];
}
const relTensorE = F => v3(F[1][0], F[2][0], F[3][0]);
const relTensorB = F => v3(F[3][2], F[1][3], F[2][1]);

/* Λ^μ_ν for a boost β along x — a hyperbolic rotation in the (t,x) plane */
function relLorentzMatrix(beta){
  const g = relGamma(beta), gb = g * beta;
  return [[g, -gb, 0, 0], [-gb, g, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
}
function relMat4Mul(A, B){
  const M = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
  for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++){
    let s = 0;
    for(let k = 0; k < 4; k++) s += A[i][k] * B[k][j];
    M[i][j] = s;
  }
  return M;
}
const relMat4T = A => [0,1,2,3].map(i => [0,1,2,3].map(j => A[j][i]));

/* F'^{μν} = Λ^μ_α Λ^ν_β F^{αβ}  —  in matrix form, plain conjugation.
   That this reproduces the six component formulas above is the whole claim
   that E and B are one object, and the test suite checks it. */
function relBoostTensor(F, beta){
  const L = relLorentzMatrix(beta);
  return relMat4Mul(relMat4Mul(L, F), relMat4T(L));
}

/* the invariants read straight off the tensor:
     F_{μν}F^{μν} = 2(B² − E²)      F_{μν}F̃^{μν} = −4 E·B                    */
function relTensorInvariant1(F){
  /* lowering both indices flips the sign of every 0i component, so the double
     contraction is Σ(F^{ij})² − Σ(F^{0i})², doubled by antisymmetry */
  let s = 0;
  for(let i = 1; i < 4; i++) s -= 2 * F[0][i] * F[0][i];
  for(let i = 1; i < 4; i++) for(let j = i + 1; j < 4; j++) s += 2 * F[i][j] * F[i][j];
  return s;
}
const relTensorInvariant2 = F => -4 * vdot(relTensorE(F), relTensorB(F));

/* ---- the field of a charge in uniform motion ---- */
/* Not a Lorentz-contracted Coulomb field — a Coulomb field whose SOURCE is
   contracted, which comes out differently: the field is squashed into a pancake
   perpendicular to the motion, stronger by γ across the motion and weaker by γ²
   along it. Units: q/4πε₀ = 1, c = 1, r measured from the charge's PRESENT
   position (which the field points at exactly, despite the delay). */
function relMovingChargeE(q, beta, r){
  const R = vlen(r);
  if(R < 1e-9) return v3(0, 0, 0);
  const cos = r.x / R, sin2 = Math.max(0, 1 - cos * cos);
  const den = Math.pow(Math.max(1e-12, 1 - beta * beta * sin2), 1.5);
  return vmul(r, q * (1 - beta * beta) / (den * R * R * R));
}
/* and its magnetic field is not independent — it is the same field, seen askew */
const relMovingChargeB = (q, beta, r) => vcross(v3(beta, 0, 0), relMovingChargeE(q, beta, r));

/* ---- the current-carrying wire: the whole argument in one calculation ---- */
/* A wire is neutral in the lab: a stationary positive lattice of density λ₀ and
   electrons of density −λ₀ drifting at v_d. A charge q moving parallel to it at
   v feels a purely MAGNETIC force. Ride along with q, and there is no magnetic
   force at all — but the two lattices are now contracted by different amounts,
   the wire carries net charge, and the force is purely ELECTRIC.

   The two forces are the same force, and this returns both so they can be
   compared. (They differ by exactly γ_v, which is not a discrepancy: transverse
   force transforms as F'⊥ = γF⊥ when the particle is at rest in the primed
   frame. Divide it out and the agreement is exact.) */
function relWireFrames(lam0, vd, v, d, q){
  const EPS0 = 1 / (4e-7 * Math.PI * C2);       // ε₀ from the exact μ₀ of the old SI
  const MU0  = 4e-7 * Math.PI;
  const bv = v / C_SI, bd = vd / C_SI;
  relCheckBeta(bv); relCheckBeta(bd);
  const gv = relGamma(bv), gd = relGamma(bd);

  /* --- the lab frame: a neutral wire, a magnetic field, a v×B force --- */
  const I = lam0 * vd;
  const B = MU0 * I / (2 * Math.PI * d);
  const Flab = q * v * B;                        // |q v × B|, v ⊥ B by construction

  /* --- the charge's frame: the drift velocity transforms, and so do the
         two charge densities, by different factors --- */
  const vdp = relVelAdd(bd, -bv) * C_SI;         // electrons' new drift speed
  const gdp = relGamma(vdp / C_SI);
  const lamPlus  =  gv * lam0;                   // lattice now moves ⇒ contracts
  const lamMinus = -lam0 * gdp / gd;             // electrons: proper density λ₀/γ_d, now at γ_d′

  /* The net density is λ₊ + λ₋ — but at any real drift speed those two are
     equal to sixteen decimal places, so subtracting them in floating point
     returns noise and nothing else. (That is not a coding inconvenience; it is
     the physics. The imbalance that carries the entire magnetic force is a part
     in 10¹⁷ of either density.) The velocity-addition identity

         γ(v_d′) = γ(v) γ(v_d) (1 − v·v_d/c²)

     is exact, and putting it into λ₊ + λ₋ collapses the difference in closed
     form before any cancellation can happen. */
  const lamNet     = lam0 * gv * (v * vd / C2);
  const lamNetNaive = lamPlus + lamMinus;        // kept so the readout can show the ruin
  const Eprime = lamNet / (2 * Math.PI * EPS0 * d);
  const Fprime = q * Eprime;

  return {
    I, B, Flab, vdPrime: vdp, gammaV: gv, gammaD: gd,
    lamPlus, lamMinus, lamNet, lamNetNaive, Eprime, Fprime,
    /* the identity that closes the argument: F′ = γ_v F, because transverse
       force transforms by γ when the particle is at rest in the primed frame */
    ratio: Flab === 0 ? 1 : Fprime / Flab,
    residual: Math.abs(Fprime - gv * Flab)
  };
}

/* ============================================================================
   5 · CURVED SPACETIME — Schwarzschild, and the tests that made it believed
   SI throughout, because the point of the classical tests is the numbers.
   GM is passed in directly (m³/s²); rs = 2GM/c².
   ============================================================================ */

const grRs = GM => 2 * GM / C2;
/* the rate a static clock at r runs, relative to one infinitely far away */
function grTimeDilation(r, rs){
  if(r <= rs) return 0;                 // at and inside the horizon, "static" is not a thing
  return Math.sqrt(1 - rs / r);
}
/* frequency ratio for light climbing from r1 to r2 */
function grRedshift(r1, r2, rs){
  const a = grTimeDilation(r1, rs), b = grTimeDilation(r2, rs);
  if(a === 0) return 0;
  return a / b;                          // < 1 means redshifted
}
/* weak-field version — the one Pound and Rebka measured up a 22.5 m tower */
const grRedshiftWeak = (g, h) => g * h / C2;

/* proper radial distance between two radii — larger than Δr, because radial
   rulers are stretched. The integral has a closed form; this is it. */
function grProperRadial(r1, r2, rs){
  const F = r => Math.sqrt(r * (r - rs)) + rs * Math.log(Math.max(1e-30, (Math.sqrt(r) + Math.sqrt(r - rs)) / Math.sqrt(rs)));
  return F(r2) - F(r1);
}
/* Flamm's paraboloid — the embedding surface whose intrinsic geometry is that
   of the equatorial plane. It is a picture of SPACE, not spacetime; the famous
   rubber sheet is this, and it explains none of gravity by itself. */
const grFlammZ = (r, rs) => r < rs ? 0 : 2 * Math.sqrt(rs * (r - rs));

/* the landmark radii */
const grPhotonSphere = rs => 1.5 * rs;   // 3GM/c² — light can orbit, unstably
const grISCO         = rs => 3.0 * rs;   // 6GM/c² — the inner edge of an accretion disc
/* aim a photon inside this impact parameter and it never comes back out; it is
   also the radius of the black shadow the Event Horizon Telescope photographs */
const grCaptureB     = GM => 3 * Math.sqrt(3) * GM / C2;
/* the difference in gravitational pull across a body of length L at radius r —
   what actually kills you, and it is milder at a bigger hole, not fiercer */
const grTidal = (GM, r, L) => 2 * GM * L / (r * r * r);

/* ---- orbits ---- */
/* Newtonian effective potential plus the one term general relativity adds. That
   term, −GML²/(c²r³), is the entire difference: an extra inward pull that grows
   faster than the centrifugal barrier and so closes no orbit exactly.
   Units: per unit mass, L is specific angular momentum (m²/s). */
const grVeffNewton = (r, GM, L) => -GM / r + L * L / (2 * r * r);
const grVeff       = (r, GM, L) => -GM / r + L * L / (2 * r * r) - GM * L * L / (C2 * r * r * r);

/* perihelion advance per orbit — the closed-form first-order result */
const grPrecessionPerOrbit = (GM, a, e) => 6 * Math.PI * GM / (C2 * a * (1 - e * e));
function grPrecessionPerCentury(GM, a, e, periodDays){
  return grPrecessionPerOrbit(GM, a, e) * (36525 / periodDays) * ARCSEC;
}

/* The orbit equation in u = 1/r, which is where the relativistic correction is
   easiest to see and to integrate:

     d²u/dφ² + u = GM/L²  +  (3GM/c²) u²

   The first term alone gives a conic section that closes exactly. The second —
   tiny, of order GM/(c²r) — is why Mercury's does not. Integrated with RK4 in φ
   so the precession is a computed result rather than a formula quoted back. */
/* The angular momentum whose orbit turns at exactly r1 and r2, in the FULL
   Schwarzschild u-equation rather than the Newtonian limit.

   The first integral of d²u/dφ² + u = GM/L² + (3GM/c²)u² is
     (du/dφ)²/2 = E + (GM/L²)u − u²/2 + (GM/c²)u³,
   and demanding u₁ = 1/r₁ and u₂ = 1/r₂ both be turning points and subtracting
   the two conditions eliminates E:
     GM/L² = (u₁+u₂)/2 − (GM/c²)(u₁² + u₁u₂ + u₂²).
   As c → ∞ this is the Newtonian vis-viva seed L² = GM·a(1−e²) exactly. Close
   to the horizon the two differ enough to matter: seeding the "star just
   outside the ISCO" preset with the NEWTONIAN L put its pericentre inside the
   centrifugal barrier, the star spiralled in, grPeriapsisAngle found no second
   perihelion, and the readout printed the NaN as "they agree to every digit"
   (auditsides, 2026-08-15). Returns NaN when no bound orbit has those apsides —
   the caller must say so rather than print a number. */
function grLFromTurning(GM, r1, r2){
  const u1 = 1 / r1, u2 = 1 / r2;
  const k = (u1 + u2) / 2 - (GM / C2) * (u1 * u1 + u1 * u2 + u2 * u2);
  return k > 0 ? Math.sqrt(GM / k) : NaN;
}

function grOrbitIntegrate(GM, L, u0, du0, dphi, steps, relativistic){
  const k = GM / (L * L), q = relativistic ? 3 * GM / C2 : 0;
  const f = u => k + q * u * u - u;
  const out = new Float64Array(steps + 1), phis = new Float64Array(steps + 1);
  let u = u0, du = du0;
  out[0] = u; phis[0] = 0;
  for(let i = 1; i <= steps; i++){
    const k1u = du,                     k1d = f(u);
    const k2u = du + 0.5 * dphi * k1d,  k2d = f(u + 0.5 * dphi * k1u);
    const k3u = du + 0.5 * dphi * k2d,  k3d = f(u + 0.5 * dphi * k2u);
    const k4u = du + dphi * k3d,        k4d = f(u + dphi * k3u);
    u  += dphi / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
    du += dphi / 6 * (k1d + 2 * k2d + 2 * k3d + k4d);
    out[i] = u; phis[i] = i * dphi;
  }
  return { u: out, phi: phis };
}
/* find the perihelion-to-perihelion angle of an integrated orbit: the angle
   between successive maxima of u. 2π means it closed; anything more precessed. */
function grPeriapsisAngle(res){
  const u = res.u, peaks = [];
  for(let i = 1; i < u.length - 1; i++){
    if(u[i] > u[i - 1] && u[i] >= u[i + 1]){
      /* parabolic refinement, so the answer is not limited by the step size */
      const d = 0.5 * (u[i - 1] - u[i + 1]) / (u[i - 1] - 2 * u[i] + u[i + 1]);
      peaks.push((i + d) * (res.phi[1] - res.phi[0]));
      if(peaks.length === 2) break;
    }
  }
  return peaks.length === 2 ? peaks[1] - peaks[0] : NaN;
}

/* ---- light ---- */
/* deflection of a ray with impact parameter b. Newton, treating light as a
   corpuscle, gives half this; the factor of two is space curvature, and
   measuring it in 1919 is what made Einstein famous in one morning. */
const grDeflection = (GM, b) => 4 * GM / (C2 * b);
const grDeflectionNewtonian = (GM, b) => 2 * GM / (C2 * b);

/* The same result obtained honestly, by integrating the null geodesic instead
   of quoting its first-order solution:

     d²u/dφ² + u = (3GM/c²) u²        (u = 1/r, and no GM/L² term — light has
                                       no rest mass to feel the Newtonian pull)

   Start far away (u = 0) aimed with impact parameter b (du/dφ = 1/b), run until
   the ray escapes to u = 0 again, and see how much more than π it swept. The
   answer agrees with 4GM/c²b to the accuracy of the expansion, which is the
   point: the formula is not an extra assumption.

   Strongly bent rays need a longer sweep than the 1.4π a grazing ray uses, so
   sweepMax is adjustable; below the critical impact parameter b = 3√3 GM/c²
   the ray never escapes at all and the sweep runs out, which is capture. */
function grPhotonBend(GM, b, steps, sweepMax){
  const N = steps || 20000, q = 3 * GM / C2;
  const dphi = (sweepMax || Math.PI * 1.4) / N;
  let u = 0, du = 1 / b, phi = 0, prevU = 0, prevPhi = 0;
  const f = x => q * x * x - x;
  const path = [];
  for(let i = 0; i < N; i++){
    prevU = u; prevPhi = phi;
    const k1u = du,                     k1d = f(u);
    const k2u = du + 0.5 * dphi * k1d,  k2d = f(u + 0.5 * dphi * k1u);
    const k3u = du + 0.5 * dphi * k2d,  k3d = f(u + 0.5 * dphi * k2u);
    const k4u = du + dphi * k3d,        k4d = f(u + dphi * k3u);
    u  += dphi / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
    du += dphi / 6 * (k1d + 2 * k2d + 2 * k3d + k4d);
    phi += dphi;
    if(u > 0) path.push([phi, 1 / u]);
    if(u <= 0 && i > 10){
      /* linear crossing back to u = 0: that is the outgoing asymptote */
      const t = prevU / (prevU - u);
      return { sweep: prevPhi + t * dphi, deflection: prevPhi + t * dphi - Math.PI, path };
    }
  }
  return { sweep: NaN, deflection: NaN, path };   // captured — the ray never got out
}

/* Einstein-ring radius for a lens of mass GM at Dl, source at Ds */
function grEinsteinRadius(GM, Dl, Ds){
  const Dls = Ds - Dl;
  return Math.sqrt(4 * GM / C2 * Dls / (Dl * Ds));
}
/* Shapiro delay: the extra round-trip radar time when the path grazes the Sun.
   Nothing is going slower than c — the path is simply longer than it looks. */
const grShapiroRoundTrip = (GM, r1, r2, b) =>
  4 * GM / C3 * Math.log(4 * r1 * r2 / (b * b));

/* ---- radial free fall ---- */
/* Falls from rest at r0. Proper time to the horizon is finite and short;
   coordinate time diverges logarithmically, which is why the infaller is said
   to "freeze" — a statement about signals received, not about the infaller. */
function grInfall(GM, r0, r){
  const rs = grRs(GM), Mg = GM / C2;             // Mg = GM/c², the geometric mass
  if(r >= r0) return { tau: 0, t: 0, vLocal: 0, redshift: 1 };
  /* the cycloid: r = (r0/2)(1 + cos η) = r0 cos²(η/2) */
  const eta = Math.acos(Math.max(-1, Math.min(1, 2 * r / r0 - 1)));
  const tau = Math.sqrt(r0 * r0 * r0 / (8 * GM)) * (eta + Math.sin(eta));

  /* Coordinate time has a closed form (MTW Box 25.4), and it needs one: the
     integrand has a simple pole at the horizon, so any evenly-spaced quadrature
     silently truncates the divergence and reports a finite crossing time.
       t = 2M ln|(A + tan(η/2))/(A − tan(η/2))| + 2M·A·[η + (r0/4M)(η + sin η)]
     with A = √(r0/2M − 1). tan(η/2) reaches A exactly at r = rs, which is where
     the logarithm — and the appearance of freezing — comes from. */
  /* tan(η/2) = √(r0/r − 1) exactly, which is worth using instead of going
     through acos and back: near the horizon the two differ in the digits that
     the logarithm is about to magnify. */
  const A = Math.sqrt(Math.max(0, r0 / rs - 1)), T = Math.sqrt(Math.max(0, r0 / r - 1));
  const t = r <= rs ? Infinity : (
    2 * Mg * Math.log(Math.abs((A + T) / (A - T))) +
    2 * Mg * A * (eta + (r0 / (4 * Mg)) * (eta + Math.sin(eta)))
  ) / C_SI;

  /* the speed a static observer at r measures the infaller passing at */
  const vLoc = Math.sqrt(Math.max(0, (rs / r - rs / r0) / (1 - rs / r0)));
  /* a signal sent outward: gravitational redshift × the receding Doppler shift */
  const redshift = grTimeDilation(r, rs) * Math.sqrt(Math.max(0, (1 - vLoc) / (1 + vLoc)));
  return { tau, t, vLocal: vLoc, redshift };
}

/* ---- GPS: the everyday application nobody expects ---- */
/* Two effects of opposite sign that do not cancel. Untreated, the drift is
   38 μs/day — 11 km of position error per day. */
function grGPSRates(){
  const rs = 26561750;                     // m, GPS semi-major axis
  const vs = Math.sqrt(GM_EARTH / rs);     // circular orbital speed
  const grav = GM_EARTH * (1 / R_EARTH - 1 / rs) / C2;   // satellite clock gains
  const kin  = vs * vs / (2 * C2);                       // satellite clock loses
  const perDay = 86400e6;                                // s → μs
  return {
    r: rs, v: vs,
    gravUsPerDay:  grav * perDay,
    kinUsPerDay:  -kin * perDay,
    netUsPerDay:  (grav - kin) * perDay,
    metresPerDay: (grav - kin) * 86400 * C_SI
  };
}

/* ============================================================================
   6 · GRAVITATIONAL WAVES
   A wave in the metric itself. It is transverse and quadrupolar: it stretches
   one axis while squeezing the other, so there is no monopole or dipole
   radiation — which is why gravity radiates so feebly and why the sources that
   are detectable are all catastrophes.
   ============================================================================ */

/* displacement of a test mass at (x,y) under a passing wave. The ½ is not
   decoration: h is a fractional STRAIN, and the displacement is half of it. */
function gwDisplace(x, y, hp, hc){
  return { x: x + 0.5 * (hp * x + hc * y), y: y + 0.5 * (hc * x - hp * y) };
}
const gwChirpMass = (m1, m2) => Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);

/* frequency of the emitted wave τ seconds before merger, masses in M☉ */
function gwChirpFreq(tau, McSolar){
  if(tau <= 0) return Infinity;
  const Mc = McSolar * M_SUN_KG * G_SI / C3;              // chirp mass in seconds
  return Math.pow(5 / (256 * tau), 3 / 8) / (Math.PI * Math.pow(Mc, 5 / 8));
}
/* the wave frequency at the innermost stable orbit — where the chirp ends and
   the merger begins. Twice the orbital frequency, because it is quadrupolar. */
function gwISCOFreq(MtotSolar){
  const M = MtotSolar * M_SUN_KG * G_SI / C3;
  return 1 / (Math.pow(6, 1.5) * Math.PI * M);
}
/* strain amplitude at distance D (metres) from a binary at orbital frequency f */
function gwStrain(McSolar, fGw, D){
  const Mc = McSolar * M_SUN_KG * G_SI / C3;
  return 4 * Math.pow(Mc, 5 / 3) * Math.pow(Math.PI * fGw, 2 / 3) * C_SI / D;
}
/* time from a given wave frequency to coalescence */
function gwTimeToMerge(fGw, McSolar){
  const Mc = McSolar * M_SUN_KG * G_SI / C3;
  return 5 / 256 * Math.pow(Math.PI * fGw, -8 / 3) * Math.pow(Mc, -5 / 3);
}

/* GW150914, the first one — GWTC-1 source-frame values */
const GW150914 = { m1: 35.6, m2: 30.6, mf: 63.1, dMpc: 440, hPeak: 1.0e-21 };
