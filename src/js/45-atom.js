/* ============================================================================
   3e · ATOM & FUNDAMENTAL FORCES ENGINE
   Real numbers in real units: r in femtometres (fm), energies in MeV.
   ħc = 197.327 MeV·fm ties them together. Every potential the atom stages
   plot and every probe readout comes from these functions.
   ============================================================================ */

/* Constants are the current published values — CODATA 2022 and PDG 2024 — so a
   reader can check any number here against a data book and get the same answer.
   The unit tests pin them, which is how they stay that way. */
const HBARC = 197.3269804;             // MeV·fm  (exact, from the SI definition of c and h)
const ALPHA_EM = 1 / 137.035999177;    // fine-structure constant, CODATA 2022
const A_BOHR = 52917.72105;            // Bohr radius in fm (0.5291772105 Å)
const M_PION = 139.57039;              // charged pion, PDG 2024
const M_W = 80369.2;                   // W boson, PDG 2024 world average (80.3692 GeV)
const M_P = 938.27208943;              // proton, CODATA 2022
const M_N = 939.56542194;              // neutron, CODATA 2022
const M_E = 0.51099895069;             // electron, CODATA 2022
const R_PROTON = 0.84075;              // rms charge radius in fm — CODATA 2022:
                                       // 0.84075(64), tightened from the 2018
                                       // recommended value 0.8414(19)
const RANGE_PION = HBARC / M_PION;     // ≈ 1.414 fm — the Yukawa range of the residual strong force
const RANGE_W = HBARC / M_W;           // ≈ 0.0025 fm — why the weak force is "weak": range, not coupling
const G_GRAV_PP = 5.906e-39;           // G m_p² / ħc — gravity's coupling for two protons (G from CODATA 2022)

/* ---- the four potentials between two nucleons/protons, V(r) in MeV, r in fm ---- */
const vCoulombPP = r => ALPHA_EM * HBARC / r;                       // +1.44 MeV·fm / r (p–p repulsion)
const vGravityPP = r => -G_GRAV_PP * HBARC / r;                     // −1.16×10⁻³⁶ MeV·fm / r
/* residual strong force between nucleons: one-pion-exchange Yukawa well.
   g² chosen so the well is ~ −70 MeV at r = 1 fm — the right scale for the
   deuteron's ~2.2 MeV binding once kinetic energy fights back. */
const G2_NUCLEAR = 70;                 // MeV·fm
const vYukawaNN = r => -G2_NUCLEAR * Math.exp(-r / RANGE_PION) / r;
/* the weak "potential": the same Yukawa shape with the W mass in the exponent.
   Its coupling is comparable to EM — the 10⁻¹⁸ m range is what makes it weak. */
const vWeak = r => -0.7 * ALPHA_EM * HBARC * Math.exp(-r / RANGE_W) / r;
/* quark level (inside a nucleon): the Cornell confinement potential.
   −(4/3)αs ħc/r + σr : Coulomb-like gluon exchange up close, then a string
   whose tension σ ≈ 0.9 GeV/fm never lets a lone quark escape. */
const SIGMA_STRING = 900;              // MeV/fm
const ALPHA_S = 0.3;
const vCornell = r => -(4 / 3) * ALPHA_S * HBARC / r + SIGMA_STRING * r;

/* which force dominates between two protons at separation r (fm)? */
function forceLedger(r){
  const rows = [
    { id: 'strong',  name: 'strong (residual)', V: vYukawaNN(r),  carrier: 'π (as residual); gluons underneath' },
    { id: 'em',      name: 'electromagnetic',   V: vCoulombPP(r), carrier: 'photon γ (massless)' },
    { id: 'weak',    name: 'weak',              V: vWeak(r),      carrier: 'W±, Z⁰ (80–91 GeV)' },
    { id: 'gravity', name: 'gravity',           V: vGravityPP(r), carrier: 'graviton? (hypothetical)' }
  ];
  let dom = rows[0];
  for(const w of rows) if(Math.abs(w.V) > Math.abs(dom.V)) dom = w;
  return { rows, dom: dom.id };
}

/* ---- the same ledger for ANY pair the reader chooses -----------------------
   A pair is {q1, q2} in units of e, {m1, m2} in MeV, {h1, h2} hadron flags.
   Every potential here is one term C·e^(−r/R)/r (R = ∞ for the 1/r laws), so
   a dominance hand-over has a CLOSED FORM — |C_a|e^(−r/R_a) = |C_b|e^(−r/R_b)
   gives r* = ln|C_a/C_b| / (1/R_a − 1/R_b) — and the stage can therefore
   measure each crossover twice: log-space bisection on the potentials, and
   the algebraic solve, sharing nothing. Two parallel 1/r laws never cross;
   their ratio is a single number (p–e: EM/gravity ≈ 2.27×10³⁹, the famous
   one), and the ledger reports that instead. */
function atPairForces(pair){
  const both = !!(pair.h1 && pair.h2);
  const mm = (pair.m1 * pair.m2) / (M_P * M_P);
  return [
    { id:'strong', name:'strong (residual)', C: both ? -G2_NUCLEAR : 0, R: RANGE_PION,
      on: both, carrier:'π (as residual); gluons underneath' },
    { id:'em', name:'electromagnetic', C: pair.q1 * pair.q2 * ALPHA_EM * HBARC, R: Infinity,
      on: pair.q1 * pair.q2 !== 0, carrier:'photon γ (massless)' },
    { id:'weak', name:'weak', C: -0.7 * ALPHA_EM * HBARC, R: RANGE_W,
      on: true, carrier:'W±, Z⁰ (80–91 GeV)' },
    { id:'gravity', name:'gravity', C: -G_GRAV_PP * mm * HBARC, R: Infinity,
      on: mm > 0, carrier:'graviton? (hypothetical)' }
  ];
}
const atVOf = (f, r) => (f.on && f.C !== 0) ? f.C * Math.exp(-r / f.R) / r : 0;
function atPairLedger(pair, r){
  const rows = atPairForces(pair).map(f =>
    ({ id: f.id, name: f.name, V: atVOf(f, r), carrier: f.carrier, on: f.on && f.C !== 0 }));
  let dom = rows[0];
  for(const w of rows) if(Math.abs(w.V) > Math.abs(dom.V)) dom = w;
  return { rows, dom: dom.id };
}
function atCrossClosed(a, b){
  if(!a.on || !b.on || !a.C || !b.C) return null;
  const k = 1 / a.R - 1 / b.R;
  if(k === 0) return null;                 // parallel laws — a fixed ratio, no crossover
  const r = Math.log(Math.abs(a.C / b.C)) / k;
  return (r > 0 && Number.isFinite(r)) ? r : null;
}
function atCrossBisect(a, b, lo, hi){
  const g = r => Math.abs(atVOf(a, r)) - Math.abs(atVOf(b, r));
  let flo = g(lo);
  if(!(flo * g(hi) < 0)) return null;
  let llo = Math.log(lo), lhi = Math.log(hi);
  for(let i = 0; i < 80; i++){
    const mid = 0.5 * (llo + lhi), fm = g(Math.exp(mid));
    if(flo * fm <= 0) lhi = mid;
    else { llo = mid; flo = fm; }
  }
  return Math.exp(0.5 * (llo + lhi));
}
/* every dominance switch over [rLo, rHi]: scan the argmax on a log grid, then
   bisect each boundary, and carry the closed form beside it */
function atDominanceSwitches(pair, rLo, rHi, n){
  const F = atPairForces(pair);
  const N = n || 600, out = [];
  let prev = null, prevR = rLo;
  for(let i = 0; i <= N; i++){
    const r = rLo * Math.pow(rHi / rLo, i / N);
    let dom = null, best = -1;
    for(const f of F){
      const v = Math.abs(atVOf(f, r));
      if(v > best){ best = v; dom = f; }
    }
    if(best <= 0){ prev = null; prevR = r; continue; }
    if(prev && dom.id !== prev.id)
      out.push({ from: prev.id, to: dom.id,
                 r: atCrossBisect(prev, dom, prevR, r),
                 closed: atCrossClosed(prev, dom) });
    prev = dom; prevR = r;
  }
  return out;
}

/* ---- screened hydrogenic levels, solved rather than quoted -----------------
   The radial equation for u(r) = r·R(r) in Hartree atomic units:
       u″ = 2·(V_l(r) − E)·u,   V_l(r) = −Z_eff(r)/r + l(l+1)/(2r²)
   which is exactly the form qmBoundStates (40-quantum.js) marches with its
   node-counted Numerov. Zeff is the CALLER's function (the reader's screening);
   Zeff ≡ Z is pure Coulomb and must reproduce Eₙ = −Z²/2n² Hartree — the
   panel prints it in eV as −13.6057·Z²/n². The u(0) = 0 wall qmShoot imposes
   is the true boundary condition, and its treat-a-non-finite-V-as-a-wall
   guard makes the r = 0 grid point harmless (ψ[0] = 0 multiplies it away).
   The n-th s state carries n−1 radial nodes; the first l = 1 state is 2p. */
const AT_HARTREE_EV = 27.211386245981;      // CODATA 2022
/* The Coulomb singularity at r = 0 demotes Numerov from h⁴ to h² — measured,
   not assumed: halving h cut the 1s error by 3.98 and 3.99 across two
   halvings. That clean second order is what makes Richardson honest: solve at
   N and 2N and take E* = (4·E₂ − E₁)/3, which removes the h² term and lands
   hydrogen 1s at 1×10⁻⁷ relative on a grid where either solve alone sits at
   ~10⁻⁵. The wavefunction kept is the fine one. */
function atLevels(Zeff, l, count, opt){
  opt = opt || {};
  const rmax = opt.rmax || 60, N = opt.N || 6000;
  const V = r => r <= 0 ? 1e12 : -Zeff(r) / r + l * (l + 1) / (2 * r * r);
  const coarse = qmBoundStates(V, 0, rmax, count, N);
  const fine = qmBoundStates(V, 0, rmax, count, 2 * N);
  /* A state with E ≥ 0 is not bound at all — it is the continuum discretised
     by the wall at rmax, and a purely repulsive "screening" produced four of
     them before this filter existed (caught by the stage suite's repulsive
     control). V(∞) = 0 for any screened Coulomb, so E < 0 is the boundary. */
  return fine.map((s, i) => {
    const E = coarse[i] ? (4 * s.E - coarse[i].E) / 3 : s.E;
    return { n: i + 1 + l, l, E, Eev: E * AT_HARTREE_EV,
             Efine: s.E, nodes: s.nodes, at: s.at, h: s.h };
  }).filter(s => s.E < -1e-12);
}
const atBohrEv = (Z, n) => -0.5 * Z * Z / (n * n) * AT_HARTREE_EV;

/* ---- semi-empirical mass formula: binding energy per nucleon, MeV ---- */
function semfB(A, Z){
  if(A < 1 || Z < 0 || Z > A) return 0;
  const aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;
  let B = aV * A - aS * Math.pow(A, 2 / 3) - aC * Z * (Z - 1) / Math.pow(A, 1 / 3)
        - aA * (A - 2 * Z) ** 2 / A;
  const even = n => n % 2 === 0;
  if(even(Z) && even(A - Z)) B += aP / Math.sqrt(A);
  else if(!even(Z) && !even(A - Z)) B -= aP / Math.sqrt(A);
  return B;
}
/* the Z that minimises the mass at fixed A — the valley of stability */
function semfBestZ(A){
  let best = 1, bb = -1e9;
  for(let Z = 1; Z <= A; Z++){ const b = semfB(A, Z); if(b > bb){ bb = b; best = Z; } }
  return best;
}

/* ---- hydrogen electron cloud: sample r from P(r) ∝ r² e^(−2r/a) (1s) ----
   That is a Gamma(3, a/2) distribution: the sum of three exponentials. */
function sampleHydrogen1s(a){
  const u1 = Math.random(), u2 = Math.random(), u3 = Math.random();
  const r = -(a / 2) * Math.log(u1 * u2 * u3 + 1e-300);
  /* uniform direction on the sphere */
  const z = 2 * Math.random() - 1, ph = Math.random() * 2 * Math.PI, s = Math.sqrt(1 - z * z);
  return { x: r * s * Math.cos(ph), y: r * s * Math.sin(ph), z: r * z, r };
}
const psi1sDensity = (r, a) => Math.exp(-2 * r / a) / (Math.PI * a * a * a);  // |ψ₁ₛ|²
const radialP1s = (r, a) => 4 * Math.PI * r * r * psi1sDensity(r, a);         // P(r) dr
/* The Rydberg energy is the infinite-nuclear-mass limit: it assumes the proton
   is nailed down. A real proton is only 1836 times heavier than the electron,
   so both orbit their common centre of mass and the electron mass in the Bohr
   formula must be replaced by the reduced mass μ = m_e m_p/(m_e + m_p). That is
   a 0.054% shift and it is the largest correction to the Bohr result, so the
   levels below are for real hydrogen rather than for the idealisation. */
const AT_RYD_INF = 13.605693122994;    // eV — R∞hc, CODATA 2022
const AT_ME_MP   = 5.446170214889e-4;  // electron-to-proton mass ratio, CODATA 2022
const AT_RYD_H   = AT_RYD_INF / (1 + AT_ME_MP);   // 13.598287 eV for hydrogen
/* The measured ionisation energy of hydrogen is 13.598434599702 eV. The
   remaining 1.5e-4 eV is relativistic and QED structure — fine structure and
   the Lamb shift — which no Bohr-level formula can produce. AT_H_MEASURED is
   kept so the stage can print the residual rather than hide it. */
const AT_H_MEASURED = 13.598434599702; // eV, CODATA 2022
const hydrogenEn = n => -AT_RYD_H / (n * n);

/* ---- quark colour bookkeeping for the nucleon animation ----
   Gluon exchange swaps the colours of the two quarks involved; the baryon
   stays colour-neutral (one r, one g, one b) at every instant. */
function gluonSwap(cols, i, j){
  const out = cols.slice();
  out[i] = cols[j]; out[j] = cols[i];
  return out;
}

/* ---- beta decay: n → p + e⁻ + ν̄ₑ via d → u + W⁻, W⁻ → e⁻ + ν̄ₑ ----
   Q-value from the real masses: 939.565 − 938.272 − 0.511 = 0.782 MeV,
   shared between the electron and the antineutrino — the continuous
   electron spectrum that forced Pauli to invent the neutrino. */
const BETA_Q = M_N - M_P - M_E;        // ≈ 0.782 MeV
function betaSampleKe(){
  /* electron kinetic-energy spectrum ~ p·E·(Q−K)² (allowed shape, m_ν = 0) */
  const Q = BETA_Q;
  for(let i = 0; i < 64; i++){
    const K = Math.random() * Q;
    const E = K + M_E, p = Math.sqrt(Math.max(0, E * E - M_E * M_E));
    const w = p * E * (Q - K) * (Q - K);
    if(Math.random() * 0.35 < w) return K;   // 0.35 ≳ max of w on [0,Q]
  }
  return Q / 3;
}

/* ---- the exact EM field of a uniformly moving charge (c = q = 1) ----
   E = (1-beta^2) r_hat / [r^2 (1-beta^2 sin^2 theta)^(3/2)], B = beta x E.
   Boosting Coulomb produces magnetism: the relativity stage draws this. */
function relBoostField(x, y, beta){
  const r2 = x * x + y * y;
  if(r2 < 1e-9) return { Ex: 0, Ey: 0, Bz: 0, E: 0, r: 0, th: 0 };
  const r = Math.sqrt(r2), sin2 = (y * y) / r2;
  const g2 = 1 - beta * beta;
  const mag = g2 / (r2 * Math.pow(1 - beta * beta * sin2, 1.5));
  const Ex = mag * x / r, Ey = mag * y / r;
  return { Ex, Ey, Bz: beta * Ey, E: mag, r, th: Math.atan2(Math.abs(y), x) };
}

