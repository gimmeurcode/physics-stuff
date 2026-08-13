/* ============================================================================
   3k · CONDENSED MATTER AND SEMICONDUCTOR ENGINE
   Why a solid conducts, insulates or does neither: the free-electron gas, the
   band gap that periodicity opens, carrier statistics at a real temperature,
   and the p–n junction that the whole of electronics is built from.

   Prefix: sl
   ============================================================================ */

/* CODATA 2022. SI unless marked. */
const SL_HBAR = 1.054571817e-34;      // J·s, exact (h exact since 2019)
const SL_ME   = 9.1093837139e-31;     // kg
const SL_E    = 1.602176634e-19;      // C, exact
const SL_KB   = 1.380649e-23;         // J/K, exact
const SL_KBEV = 8.617333262e-5;       // eV/K
const SL_EPS0 = 8.8541878188e-12;     // F/m
const SL_NA   = 6.02214076e23;        // /mol, exact

/* ---- the free electron gas ---------------------------------------------- */
/* Drude got conduction right and heat capacity catastrophically wrong.
   Sommerfeld's fix was to let the electrons obey Fermi statistics, and the
   whole difference is that only those within kT of E_F can do anything. */

/* E_F = (ħ²/2m)(3π²n)^(2/3), returned in eV */
function slFermiEnergy(n){
  const kF = Math.pow(3 * Math.PI * Math.PI * n, 1 / 3);          // 1/m
  return SL_HBAR * SL_HBAR * kF * kF / (2 * SL_ME) / SL_E;        // eV
}
const slFermiK    = n => Math.pow(3 * Math.PI * Math.PI * n, 1 / 3);
const slFermiVel  = n => SL_HBAR * slFermiK(n) / SL_ME;           // m/s
const slFermiTemp = n => slFermiEnergy(n) * SL_E / SL_KB;         // K

/* the Fermi–Dirac occupation — the one function this whole wing turns on */
function slFD(E, mu, T){
  if(T <= 0) return E < mu ? 1 : (E > mu ? 0 : 0.5);
  const x = (E - mu) / (SL_KBEV * T);
  if(x > 40) return Math.exp(-x);            // avoid overflow; same value
  if(x < -40) return 1;
  return 1 / (Math.exp(x) + 1);
}
/* free-electron density of states in 3D, ∝ √E */
const slDOS3D = E => (E > 0 ? Math.sqrt(E) : 0);

/* Real metals, with measured free-electron densities (Ashcroft & Mermin
   Table 1.1) so the computed E_F can be scored against the measured one. */
const SL_METALS = [
  { s:'Li', n:4.70e28, EF:4.74, T:'2.3×10⁴' },
  { s:'Na', n:2.65e28, EF:3.24, T:'3.8×10⁴' },
  { s:'K',  n:1.40e28, EF:2.12, T:'2.5×10⁴' },
  { s:'Cu', n:8.47e28, EF:7.00, T:'8.2×10⁴' },
  { s:'Ag', n:5.86e28, EF:5.49, T:'6.4×10⁴' },
  { s:'Au', n:5.90e28, EF:5.53, T:'6.4×10⁴' },
  { s:'Al', n:18.1e28, EF:11.7, T:'13.6×10⁴' },
  { s:'Zn', n:13.2e28, EF:9.47, T:'11.0×10⁴' }
];

/* ---- bands from periodicity --------------------------------------------- */
/* Tight binding in one dimension: E(k) = E₀ − 2t·cos(ka). One line of algebra
   that already contains the band width (4t), the effective mass at the bottom,
   and the fact that a band holds exactly 2N states. */
const slTightBinding = (k, a, t, E0) => (E0 || 0) - 2 * t * Math.cos(k * a);
/* effective mass from the curvature: m* = ħ²/(d²E/dk²) */
function slEffMass(k, a, t){
  const d2 = 2 * t * a * a * Math.cos(k * a) * SL_E;    // J·m², from eV
  if(Math.abs(d2) < 1e-60) return Infinity;
  return SL_HBAR * SL_HBAR / d2;
}
/* the 1D density of states for that band — it diverges at both edges, and
   those van Hove singularities are a real, measurable feature */
function slTB_DOS(E, a, t, E0){
  const u = (E - (E0 || 0)) / (2 * t);
  if(Math.abs(u) >= 1) return 0;
  return 1 / (Math.PI * a * t * Math.sqrt(1 - u * u));
}

/* Kronig–Penney: a periodic array of delta wells. The allowed energies are
   those for which |f(E)| ≤ 1, and the gaps are where that fails — the cleanest
   demonstration that a gap is a consequence of periodicity alone. */
function slKronigPenney(E, P){
  /* dimensionless form: cos(ka) = P·sin(αa)/(αa) + cos(αa) */
  if(E <= 0){
    const b = Math.sqrt(-E);
    return P * Math.sinh(b) / b + Math.cosh(b);
  }
  const a = Math.sqrt(E);
  return P * Math.sin(a) / a + Math.cos(a);
}
/* Scan for the allowed bands: intervals where |f| ≤ 1. A band still open when
   the scan reaches Emax is reported with cut:true — its upper edge is the scan
   limit, not a real band edge, and its width is meaningless. Callers that
   compare widths must skip it; the readout labels it rather than lying. */
function slBands(P, Emax, n){
  const N = n || 4000, out = [];
  let inBand = false, start = 0;
  for(let i = 0; i <= N; i++){
    const E = -5 + (Emax + 5) * i / N;
    const ok = Math.abs(slKronigPenney(E, P)) <= 1;
    if(ok && !inBand){ inBand = true; start = E; }
    else if(!ok && inBand){ inBand = false; out.push({ lo:start, hi:E, cut:false }); }
  }
  if(inBand) out.push({ lo:start, hi:Emax, cut:true });
  return out;
}

/* ----------------------------------------------------------------------------
   A LATTICE THE READER DESIGNS

   Kronig–Penney is one potential — a delta well repeated — and it has a closed
   form because that is the one shape whose matching conditions can be written
   down. The lesson it teaches, though, is not about delta wells at all: it is
   that **gaps come from periodicity**, whatever is inside the cell. That claim
   can only be tested on a cell nobody chose.

   Bloch's theorem does the work. For any periodic V, propagate ψ across one cell
   and the result is a 2×2 matrix M; the theorem says a solution can be extended
   periodically exactly when

       cos(ka) = ½ Tr M(E),

   so the allowed energies are those with |½ Tr M| ≤ 1 and everything else is a
   gap. Nothing in that needs the cell to be simple.

   The propagator is the one `qmScatter` uses — over a slab thin enough that V is
   effectively constant, ψ″ = −wψ has the exact solution [[c, s], [−ws, c]] with
   c = cos(qh), s = sin(qh)/q for w > 0 and the hyperbolic pair for w < 0. Units
   follow `slKronigPenney`: ħ²/2m = 1 and the cell length is the unit of length.

   det M = 1 is the Wronskian, and nothing in the loop imposes it — so it comes
   back as a free check that the propagation has not drifted.
   ---------------------------------------------------------------------------- */
function slCellM(V, E, a, N){
  N = N || 1200;
  const h = a / N;
  let m11 = 1, m12 = 0, m21 = 0, m22 = 1;
  for(let i = 0; i < N; i++){
    const v = V(a * (i + 0.5) / N);
    const w = E - (Number.isFinite(v) ? v : 0);
    let c, s;
    if(w > 1e-14){ const q = Math.sqrt(w); c = Math.cos(q * h); s = Math.sin(q * h) / q; }
    else if(w < -1e-14){ const k = Math.sqrt(-w); c = Math.cosh(k * h); s = Math.sinh(k * h) / k; }
    else { c = 1; s = h; }
    const n11 = c * m11 + s * m21, n12 = c * m12 + s * m22;
    const n21 = -w * s * m11 + c * m21, n22 = -w * s * m12 + c * m22;
    m11 = n11; m12 = n12; m21 = n21; m22 = n22;
  }
  return { m11, m12, m21, m22, disc:(m11 + m22) / 2, det:m11 * m22 - m12 * m21 };
}
/* the same scan slBands performs, on an arbitrary cell */
/* `Ncell` is the number of slabs the cell is cut into, and it is a parameter
   rather than a constant because it has to resolve whatever is inside the cell:
   a narrow spike thinner than one slab is simply not seen by midpoint sampling,
   and the band edges then come out in the wrong place with no other symptom. */
function slBandsV(V, a, Elo, Ehi, n, Ncell){
  const N = n || 3000, out = [];
  let inBand = false, start = 0, worstDet = 0;
  for(let i = 0; i <= N; i++){
    const E = Elo + (Ehi - Elo) * i / N;
    const M = slCellM(V, E, a, Ncell || 400);
    worstDet = Math.max(worstDet, Math.abs(M.det - 1));
    const ok = Math.abs(M.disc) <= 1;
    if(ok && !inBand){ inBand = true; start = E; }
    else if(!ok && inBand){ inBand = false; out.push({ lo:start, hi:E, cut:false }); }
  }
  if(inBand) out.push({ lo:start, hi:Ehi, cut:true });
  return { bands:out, worstDet };
}

/* ---- semiconductors ------------------------------------------------------ */
/* Real materials. Eg in eV at 300 K, Nc and Nv in cm⁻³, mobilities cm²/V·s. */
const SL_SEMI = [
  { s:'Si',   Eg:1.12, Nc:2.8e19, Nv:1.04e19, eps:11.7, mun:1350, mup:480,
    note:'the workhorse: an indirect gap, so it emits light badly but oxidises beautifully' },
  { s:'Ge',   Eg:0.66, Nc:1.04e19, Nv:6.0e18, eps:16.0, mun:3900, mup:1900,
    note:'the first transistor material; the small gap makes it leaky when warm' },
  { s:'GaAs', Eg:1.42, Nc:4.7e17, Nv:7.0e18, eps:12.9, mun:8500, mup:400,
    note:'a direct gap — it emits light, which is why lasers and LEDs use it' },
  { s:'GaN',  Eg:3.40, Nc:2.3e18, Nv:1.8e19, eps:8.9,  mun:1000, mup:200,
    note:'wide, direct gap: blue LEDs, and high-power electronics' },
  { s:'SiC',  Eg:3.26, Nc:1.7e19, Nv:2.5e19, eps:9.7,  mun:900,  mup:120,
    note:'wide gap and high breakdown field — electric-vehicle inverters' }
];

/* the intrinsic carrier concentration — exponentially sensitive to Eg/2kT,
   which is exactly why a 1.1 eV gap insulates and a 0.66 eV one does not */
function slNi(M, T){
  const kT = SL_KBEV * T;
  const sc = Math.pow(T / 300, 1.5);               // the T^(3/2) in Nc, Nv
  return Math.sqrt(M.Nc * sc * M.Nv * sc) * Math.exp(-M.Eg / (2 * kT));
}
/* doping: charge neutrality n − p + Na − Nd = 0 with np = ni², solved exactly
   rather than by the usual "n ≈ Nd" shortcut, so the stage can show where that
   shortcut fails (low doping, or high temperature) */
function slCarriers(M, T, Nd, Na){
  const ni = slNi(M, T), d = Nd - Na;
  const n = d / 2 + Math.sqrt(d * d / 4 + ni * ni);
  const p = ni * ni / n;
  const kT = SL_KBEV * T;
  /* the Fermi level, measured from mid-gap */
  const sc = Math.pow(T / 300, 1.5);
  const EF = M.Eg - kT * Math.log(M.Nc * sc / n);   // above the valence edge
  return { ni, n, p, EF, kT,
           type: d > 0 ? 'n-type' : (d < 0 ? 'p-type' : 'intrinsic'),
           /* the approximation the textbooks use, kept alongside for comparison */
           nApprox: d > 0 ? d : ni,
           sigma: SL_E * (n * M.mun + p * M.mup) };   // per cm³ · cm²/Vs
}

/* ---- the p–n junction ---------------------------------------------------- */
function slJunction(M, T, Nd, Na){
  const kT = SL_KBEV * T, ni = slNi(M, T);
  const Vbi = kT * Math.log(Nd * Na / (ni * ni));          // built-in potential
  /* depletion width, from solving Poisson's equation across the junction —
     the same equation as the electrostatics wing, in one dimension */
  const eps = M.eps * SL_EPS0;
  const NdM = Nd * 1e6, NaM = Na * 1e6;                    // to m⁻³
  const W = Math.sqrt(2 * eps * Vbi / SL_E * (1 / NdM + 1 / NaM));
  const xn = W * NaM / (NdM + NaM), xp = W * NdM / (NdM + NaM);
  const Emax = SL_E * NdM * xn / eps;                      // V/m at the junction
  return { Vbi, W, xn, xp, Emax, ni, kT,
           /* under bias the width follows √(Vbi − V) — that is a varactor */
           widthAt:V => (V < Vbi ? W * Math.sqrt(Math.max(0, (Vbi - V) / Vbi)) : 0),
           capAt:V => (V < Vbi ? eps / (W * Math.sqrt(Math.max(1e-9, (Vbi - V) / Vbi))) : Infinity) };
}
/* the Shockley diode equation — the exponential the circuit wing's diode uses */
const slDiode = (V, Is, T, nId) => Is * (Math.exp(V / ((nId || 1) * SL_KBEV * T)) - 1);

/* ---- lattice heat capacity ---------------------------------------------- */
/* Dulong–Petit says 3R for every solid; at low temperature it fails badly.
   Einstein fixed the qualitative failure, Debye the quantitative one. */
const SL_R = 8.314462618;             // J/mol·K, exact

function slEinsteinC(T, TE){
  if(T <= 0) return 0;
  const x = TE / T;
  if(x > 60) return 0;
  const ex = Math.exp(x);
  return 3 * SL_R * x * x * ex / ((ex - 1) * (ex - 1));
}
/* Debye: C = 9R(T/θ)³∫₀^(θ/T) x⁴eˣ/(eˣ−1)² dx, integrated rather than
   looked up, so the T³ law at low temperature emerges rather than being told */
function slDebyeC(T, TD){
  if(T <= 0) return 0;
  const xm = TD / T, n = 800, h = xm / n;
  let s = 0;
  for(let i = 0; i <= n; i++){
    const x = i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    let f;
    if(x < 1e-6) f = x * x;                       // the removable singularity
    else if(x > 60) f = x * x * x * x * Math.exp(-x);
    else { const ex = Math.exp(x); f = x * x * x * x * ex / ((ex - 1) * (ex - 1)); }
    s += w * f;
  }
  return 9 * SL_R * Math.pow(T / TD, 3) * s * h / 3;
}
/* measured Debye temperatures, K */
const SL_DEBYE = [
  { s:'lead',    TD:105 }, { s:'gold',    TD:165 }, { s:'silver', TD:215 },
  { s:'copper',  TD:343 }, { s:'aluminium', TD:428 }, { s:'iron', TD:470 },
  { s:'silicon', TD:645 }, { s:'diamond', TD:2230 }
];
/* the electronic contribution, linear in T — invisible at room temperature,
   dominant below a few kelvin, which is how the two are told apart */
const slElectronicC = (T, n) => Math.PI * Math.PI / 2 * SL_R * T / slFermiTemp(n);
