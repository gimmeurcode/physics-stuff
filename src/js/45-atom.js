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
const QCOLORS = ['r', 'g', 'b'];
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

/* the cast of carriers, for legends and the atom stage */
const CARRIERS = [
  { id:'photon',   sym:'γ',  force:'electromagnetic', mass:'0',            range:'infinite',   acts:'electric charge',
    note:'Virtual photons exchanged between the electron and the proton ARE the Coulomb attraction that binds the atom.' },
  { id:'gluon',    sym:'g',  force:'strong',          mass:'0',            range:'~1 fm (confined)', acts:'colour charge',
    note:'Eight gluons carry colour themselves, so they attract each other — the origin of confinement and of the flux tube.' },
  { id:'wboson',   sym:'W±', force:'weak',            mass:'80.4 GeV',     range:'2.5×10⁻³ fm', acts:'weak isospin (all fermions)',
    note:'So heavy that the interaction is essentially a contact event — hence slow decays and "weakness" at low energy.' },
  { id:'zboson',   sym:'Z⁰', force:'weak',            mass:'91.2 GeV',     range:'2.4×10⁻³ fm', acts:'weak isospin',
    note:'The neutral current: neutrinos scattering off matter without changing identity — discovered at CERN in 1973.' },
  { id:'graviton', sym:'G?', force:'gravity',         mass:'0 (expected)', range:'infinite',   acts:'energy–momentum',
    note:'Hypothetical: gravity has not been quantised experimentally. Shown dashed here — a conjecture, not an observation.' }
];

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

