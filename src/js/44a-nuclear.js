/* ============================================================================
   3j · NUCLEAR PHYSICS ENGINE
   The binding-energy surface from the semi-empirical mass formula, decay
   kinetics integrated rather than quoted, and Q-values computed from real
   measured masses so that "energy is released" is a number with a sign.

   Prefix: nc
   ============================================================================ */

/* CODATA 2022 / AME2020, in MeV/c² unless marked. The 2026-08-15 audit found
   this block still carrying the CODATA 2018 masses under this same header —
   the unit tests now pin NC_MH and NC_ALPHA as RELATIONS to the atom wing's
   constants, so one stale refresh can no longer hide here. */
const NC_U    = 931.49410372;      // atomic mass unit, MeV/c²
const NC_MP   = 938.27208943;      // proton
const NC_MN   = 939.56542194;      // neutron
const NC_ME   = 0.51099895069;     // electron
const NC_MH   = 938.7830747823;    // ¹H atom = m_p + m_e − 13.598 eV binding
const NC_MHE4 = 3727.3794118;      // α particle
const NC_NA   = 6.02214076e23;     // Avogadro, exact since 2019

/* ---- the semi-empirical mass formula ------------------------------------ */
/* Weizsäcker's liquid-drop model. Five terms, each with a physical reading,
   fitted to the measured masses; the coefficients below are the standard
   least-squares set (Wapstra), in MeV. The point of the stage is not the
   numbers but that four competing effects produce a maximum near iron. */
const NC_SEMF = { aV:15.75, aS:17.80, aC:0.711, aA:23.70, aP:11.18 };

function ncSemf(Z, A){
  const N = A - Z, C = NC_SEMF;
  const volume    =  C.aV * A;                          // every nucleon binds
  const surface   = -C.aS * Math.pow(A, 2 / 3);         // the skin does not
  const coulomb   = -C.aC * Z * (Z - 1) / Math.pow(A, 1 / 3);  // protons repel
  const asymmetry = -C.aA * (N - Z) * (N - Z) / A;      // Pauli prefers N = Z
  /* pairing: even–even nuclei are bound extra, odd–odd less */
  let pairing = 0;
  const evenZ = Z % 2 === 0, evenN = N % 2 === 0;
  if(evenZ && evenN)        pairing =  C.aP / Math.sqrt(A);
  else if(!evenZ && !evenN) pairing = -C.aP / Math.sqrt(A);
  const total = volume + surface + coulomb + asymmetry + pairing;
  return { Z, N, A, volume, surface, coulomb, asymmetry, pairing, total,
           perA: A > 0 ? total / A : 0,
           terms:[ {n:'volume',     v:volume,     why:'each nucleon binds to its neighbours — proportional to A'},
                   {n:'surface',    v:surface,    why:'nucleons on the skin have fewer neighbours — costs A^(2/3)'},
                   {n:'Coulomb',    v:coulomb,    why:'every proton repels every other — costs Z(Z−1)/A^(1/3)'},
                   {n:'asymmetry',  v:asymmetry,  why:'the exclusion principle prefers N = Z — costs (N−Z)²/A'},
                   {n:'pairing',    v:pairing,    why:'nucleons pair off, so even–even is favoured'} ] };
}

/* The valley of stability. Minimising the SEMF over Z at fixed A —
   dB/dZ = 0 — gives a closed form, which the stage checks against a brute
   search so the algebra is confirmed rather than trusted. */
function ncValleyZ(A){
  const C = NC_SEMF;
  /* d/dZ of the Coulomb and asymmetry terms, solved for Z */
  const num = 4 * C.aA + C.aC / Math.pow(A, 1 / 3);
  const den = 8 * C.aA / A + 2 * C.aC / Math.pow(A, 1 / 3);
  return num / den;
}
function ncMostBoundZ(A){                 /* brute force, for the comparison */
  let best = 1, bv = -Infinity;
  for(let Z = 1; Z < A; Z++){
    const b = ncSemf(Z, A).total;
    if(b > bv){ bv = b; best = Z; }
  }
  return { Z:best, B:bv };
}

/* A handful of real nuclides with their measured binding energy per nucleon,
   so the model can be scored against nature rather than against itself.
   Values from AME2020, MeV per nucleon. */
const NC_NUCLIDES = [
  { s:'²H',    Z:1,  A:2,   bpa:1.1123 },
  /* the A = 3 pair, added so the commonest fusion reactions are assembled from
     measured binding energies rather than from a liquid-drop model that has no
     business being applied to three nucleons (AME2020) */
  { s:'³H',    Z:1,  A:3,   bpa:2.82727 },
  { s:'³He',   Z:2,  A:3,   bpa:2.57268 },
  { s:'⁴He',   Z:2,  A:4,   bpa:7.0739 },
  { s:'⁶Li',   Z:3,  A:6,   bpa:5.3323 },
  { s:'¹²C',   Z:6,  A:12,  bpa:7.6801 },
  { s:'¹⁶O',   Z:8,  A:16,  bpa:7.9762 },
  { s:'⁴⁰Ca',  Z:20, A:40,  bpa:8.5513 },
  { s:'⁵⁶Fe',  Z:26, A:56,  bpa:8.7903 },
  { s:'⁶²Ni',  Z:28, A:62,  bpa:8.7945 },
  { s:'⁹⁰Zr',  Z:40, A:90,  bpa:8.7100 },
  { s:'¹¹⁹Sn', Z:50, A:119, bpa:8.4994 },
  { s:'¹⁹⁷Au', Z:79, A:197, bpa:7.9157 },
  { s:'²⁰⁸Pb', Z:82, A:208, bpa:7.8675 },
  { s:'²³⁵U',  Z:92, A:235, bpa:7.5910 },
  { s:'²³⁸U',  Z:92, A:238, bpa:7.5701 }
];

/* ----------------------------------------------------------------------------
   A REACTION THE READER WRITES

   Every reaction quoted in this wing arrives with its Q-value attached, because
   whoever wrote the entry looked it up. A reaction the reader types has to have
   that number **summed from masses**, and two things then have to be checked
   rather than assumed — that the reaction balances at all, and where each mass
   came from.

       U235 + n -> Ba141 + Kr92 + 3n

   Nuclide masses are built from binding energies, not stored separately:

       M(Z, A) = Z·m_H + (A−Z)·m_n − B(Z, A)

   with B measured (AME2020, via `NC_NUCLIDES`) where the nuclide is in the
   table, and predicted by the liquid-drop model otherwise. Which of the two was
   used is returned per nuclide, because a Q-value assembled from model masses is
   worth a great deal less than one assembled from measured ones, and the reader
   should be told which they have.

   Atomic masses are used throughout — m_H rather than m_p — so the electrons
   cancel on both sides for any reaction that conserves Z. That is the standard
   convention and it is why β⁻ decay needs no electron term.
   ---------------------------------------------------------------------------- */
const NC_ELEMENTS = ['n',
  'H','He','Li','Be','B','C','N','O','F','Ne','Na','Mg','Al','Si','P','S','Cl','Ar','K','Ca',
  'Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y','Zr',
  'Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd','In','Sn','Sb','Te','I','Xe','Cs','Ba','La','Ce','Pr','Nd',
  'Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg',
  'Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm'];
const ncZof = sym => {
  const i = NC_ELEMENTS.findIndex(e => e.toLowerCase() === String(sym).toLowerCase());
  return i;
};
/* the mass of one nuclide, in MeV/c², and where the binding energy came from */
function ncNuclideMass(Z, A){
  if(Z === 0 && A === 1) return { m:NC_MN, src:'measured', B:0 };
  if(Z === 1 && A === 1) return { m:NC_MH, src:'measured', B:0 };
  const hit = NC_NUCLIDES.find(q => q.Z === Z && q.A === A);
  const B = hit ? hit.bpa * A : ncSemf(Z, A).total;
  return { m:Z * NC_MH + (A - Z) * NC_MN - B, src:hit ? 'measured' : 'model', B };
}
/* One species with its count: `3n`, `He4`, `4He`, `n`, `p`, `d`, `alpha`.

   A leading number is genuinely ambiguous — in `3n` it is a count and in `4He`
   it is a mass number, and both are how people write. The rule that resolves it
   without a special case: **strip a leading integer as a multiplier only if what
   remains is still a complete species on its own.** `n` is, so `3n` is three
   neutrons; `He` is not, so `4He` is helium-4. `3He4` is three helium-4, and
   `3He` is helium-3, which are both the conventional readings. */
function ncBareSpecies(s){
  const low = String(s).trim().toLowerCase();
  if(low === 'n' || low === 'neutron')  return { Z:0, A:1 };
  if(low === 'p' || low === 'proton')   return { Z:1, A:1 };
  if(low === 'd' || low === 'deuteron') return { Z:1, A:2 };
  if(low === 't' || low === 'triton')   return { Z:1, A:3 };
  if(low === 'a' || low === 'alpha')    return { Z:2, A:4 };
  /* El followed by A, or A followed by El — both are written in the wild */
  const t = String(s).trim();
  let m = /^([A-Za-z]{1,2})[-\s]?(\d{1,3})$/.exec(t);
  if(!m){ const r = /^(\d{1,3})[-\s]?([A-Za-z]{1,2})$/.exec(t); if(r) m = [r[0], r[2], r[1]]; }
  if(!m) return null;
  const Z = ncZof(m[1]);
  if(Z < 0) return null;
  const A = parseInt(m[2], 10);
  if(!(A >= 1) || A < Z) return null;              // more protons than nucleons
  return { Z, A };
}
function ncParseSpecies(tok){
  const s0 = String(tok).trim();
  const mult = /^(\d+)\s*[*x]?\s*(?=[A-Za-z])/.exec(s0);
  if(mult){
    const rest = ncBareSpecies(s0.slice(mult[0].length));
    if(rest) return { k:parseInt(mult[1], 10), Z:rest.Z, A:rest.A };
  }
  const one = ncBareSpecies(s0);
  return one ? { k:1, Z:one.Z, A:one.A } : null;
}
function ncParseReaction(text){
  const errs = [];
  const src = String(text == null ? '' : text).replace(/[;#*].*$/gm, '').trim();
  if(!src) return { ok:false, errs:[{ msg:'nothing to react — write something like U235 + n → Ba141 + Kr92 + 3n' }] };
  const halves = src.split(/-+>|→|=+>/);
  if(halves.length !== 2)
    return { ok:false, errs:[{ msg:'a reaction needs exactly one arrow: reactants <b>→</b> products (typing -&gt; is fine too)' }] };
  const side = (txt, which) => txt.split('+').map(t => t.trim()).filter(t => t.length).map(t => {
    const sp = ncParseSpecies(t);
    if(!sp) errs.push({ msg:'"' + esc(t) + '" on the ' + which + ' is not a nuclide — write n, p, d, alpha, or a symbol with a mass number like <b>U235</b> or <b>235U</b>' });
    return sp;
  }).filter(Boolean);
  const lhs = side(halves[0], 'left'), rhs = side(halves[1], 'right');
  if(!lhs.length) errs.push({ msg:'no reactants' });
  if(!rhs.length) errs.push({ msg:'no products' });
  return { ok:errs.length === 0, lhs, rhs, errs };
}
/* Q, summed from masses — and the conservation checks a preset gets for free */
function ncReactionQ(R){
  const sum = side => side.reduce((a, s) => {
    const M = ncNuclideMass(s.Z, s.A);
    a.m += s.k * M.m; a.Z += s.k * s.Z; a.A += s.k * s.A;
    if(M.src === 'model') a.model++;
    a.parts.push({ ...s, ...M });
    return a;
  }, { m:0, Z:0, A:0, model:0, parts:[] });
  const L = sum(R.lhs), P = sum(R.rhs);
  const dZ = P.Z - L.Z, dA = P.A - L.A;
  return { L, P, Q:L.m - P.m, dZ, dA,
    balanced:dZ === 0 && dA === 0,
    modelled:L.model + P.model,
    perNucleon:L.A ? (L.m - P.m) / L.A : 0 };
}

/* ---- decay kinetics ------------------------------------------------------ */
const ncLambda   = halfLife => Math.LN2 / halfLife;
const ncRemain   = (N0, halfLife, t) => N0 * Math.exp(-ncLambda(halfLife) * t);
const ncActivity = (N0, halfLife, t) => ncLambda(halfLife) * ncRemain(N0, halfLife, t);
/* dating: invert the decay law for t */
const ncAge = (frac, halfLife) => (frac > 0 ? -Math.log(frac) / ncLambda(halfLife) : Infinity);

/* Parent → daughter → stable, the Bateman solution. The daughter's peak is
   the interesting part: it exists because production and decay compete. */
function ncChain(N0, T1, T2, t){
  const l1 = ncLambda(T1), l2 = ncLambda(T2);
  const A_ = N0 * Math.exp(-l1 * t);
  let B;
  if(Math.abs(l1 - l2) < 1e-12 * Math.max(l1, l2)){
    B = N0 * l1 * t * Math.exp(-l1 * t);          // the degenerate limit
  } else {
    B = N0 * l1 / (l2 - l1) * (Math.exp(-l1 * t) - Math.exp(-l2 * t));
  }
  return { parent:A_, daughter:B, stable:N0 - A_ - B };
}
/* where the daughter peaks — obtained by setting dB/dt = 0 */
function ncChainPeak(T1, T2){
  const l1 = ncLambda(T1), l2 = ncLambda(T2);
  if(Math.abs(l1 - l2) < 1e-12 * Math.max(l1, l2)) return 1 / l1;
  return Math.log(l2 / l1) / (l2 - l1);
}

/* real decays, with measured half-lives in seconds */
const NC_DECAYS = [
  { s:'²³⁸U → ²³⁴Th + α',   half:1.410e17, mode:'α', Q:4.270,  A:238,  use:'the head of the uranium series; dates the Earth' },
  { s:'²³⁵U → ²³¹Th + α',   half:2.221e16, mode:'α', Q:4.679,  A:235,  use:'the fissile isotope' },
  { s:'²²⁶Ra → ²²²Rn + α',  half:5.049e10, mode:'α', Q:4.871,  A:226,  use:'Curie\'s radium' },
  { s:'¹⁴C → ¹⁴N + β⁻',     half:1.807e11, mode:'β⁻', Q:0.156, A:14, use:'radiocarbon dating, out to ~50 000 years' },
  { s:'⁴⁰K → ⁴⁰Ar',         half:3.938e16, mode:'EC', Q:1.505, A:40, use:'potassium–argon dating of rock' },
  { s:'⁶⁰Co → ⁶⁰Ni + β⁻',   half:1.663e8,  mode:'β⁻', Q:2.824, A:60, use:'medical and industrial γ source' },
  { s:'¹³¹I → ¹³¹Xe + β⁻',  half:6.93e5,   mode:'β⁻', Q:0.971, A:131, use:'thyroid treatment and fallout' },
  { s:'³H → ³He + β⁻',      half:3.888e8,  mode:'β⁻', Q:0.0186,A:3,use:'tritium; the lowest-energy β known' },
  { s:'n → p + e⁻ + ν̄',     half:611.0,    mode:'β⁻', Q:0.782, A:1, use:'the free neutron itself is unstable' }
];

/* Half-lives here span from 611 seconds to 10¹⁷, so a readout that says
   "1.41e+17 s" tells the reader nothing. Convert to the largest unit that
   leaves a number a person can picture. */
function ncTime(s){
  if(!isFinite(s)) return 'unbounded';
  if(s < 1e-6)  return fmtNum(s * 1e9, 3) + ' ns';
  if(s < 1e-3)  return fmtNum(s * 1e6, 3) + ' µs';
  if(s < 1)     return fmtNum(s * 1e3, 3) + ' ms';
  if(s < 90)    return fmtNum(s, 3) + ' s';
  if(s < 5400)  return fmtNum(s / 60, 3) + ' min';
  if(s < 1.7e5) return fmtNum(s / 3600, 3) + ' hours';
  if(s < 3.1e7) return fmtNum(s / 86400, 3) + ' days';
  const y = s / 3.15576e7;
  if(y < 1e3) return fmtNum(y, 3) + ' years';
  if(y < 1e6) return fmtNum(y / 1e3, 3) + ' thousand years';
  if(y < 1e9) return fmtNum(y / 1e6, 3) + ' million years';
  return fmtNum(y / 1e9, 3) + ' billion years';
}

/* ---- Q-values from masses ----------------------------------------------- */
/* Q > 0 means the reaction releases energy and can happen spontaneously.
   Computing it from masses is the whole content of "mass is energy". */
const ncQ = (inMass, outMass) => inMass - outMass;      // MeV, with c² = 1

/* Fission and fusion Q-values are NOT precomputed here. They were, from quoted
   B/A figures, and that is what the accuracy rule forbids: a released energy
   spelled out as a literal cannot be checked by anything. `ncReactionQ` sums Q
   from `ncNuclideMass`, so `ncBind` gets D–T's 17.59 MeV from measured masses
   and prints which of them were measured and which modelled. */

/* ---- the Coulomb barrier and tunnelling --------------------------------- */
/* Why α decay half-lives span 24 orders of magnitude for a 4 MeV range of
   energies: the Gamow factor is exponential in 1/√E. */
const NC_HBARC = 197.3269804;      // MeV·fm, CODATA 2022
const NC_ALPHA = 1 / 137.035999177; // fine structure constant, CODATA 2022 —
                                    // same source the atom and string wings use
                                    // (7.2973525693e-3 was the 2018 value)

function ncCoulombBarrier(Z1, Z2, r){          // MeV at separation r in fm
  return Z1 * Z2 * NC_ALPHA * NC_HBARC / r;
}
const ncRadius = A => 1.2 * Math.pow(A, 1 / 3);   // fm, the empirical R₀A^(1/3)

/* Gamow factor for α emission from a daughter of charge Z, at energy E (MeV).
   The WKB integral through the Coulomb barrier has a closed form. */
function ncGamow(Z, E, A){
  const mAlpha = NC_MHE4;                       // MeV/c²
  const b = 2 * Z * NC_ALPHA * NC_HBARC / E;    // the outer turning point, fm
  const R = ncRadius(A) + ncRadius(4);
  if(R >= b) return { G:0, b, R, note:'above the barrier — no tunnelling needed' };
  const x = R / b;
  /* G = (√(2mE)/ħc)·b·[arccos√x − √(x(1−x))], the WKB integral done exactly.
     Everything is in MeV and fm, so G comes out dimensionless as it must. */
  const G = Math.sqrt(2 * mAlpha * E) / NC_HBARC * b *
            (Math.acos(Math.sqrt(x)) - Math.sqrt(x * (1 - x)));
  return { G, b, R, T:Math.exp(-2 * G) };
}

/* How often the α arrives at the wall, computed rather than quoted.
   Textbooks state "about 10²¹ times a second" as a given. It follows from the
   well the stage already draws: inside, the α has kinetic energy E + V₀, so it
   has a speed, and it crosses the nucleus and returns in 2R/v. The well depth
   is the one genuinely free parameter and 30–35 MeV is the standard range. */
const NC_WELL = 32;                 // MeV, nuclear well depth for an α
const NC_C    = 2.99792458e8;       // m/s, exact

function ncAssaultFreq(E, A, wellDepth){
  const V0 = wellDepth === undefined ? NC_WELL : wellDepth;
  const K  = E + V0;                              // MeV inside the well
  /* relativistic, because v/c comes out near 0.13 and the 0.7% matters less
     than the fact that using the exact form costs nothing */
  const r  = 1 + K / NC_MHE4;
  const v  = NC_C * Math.sqrt(Math.max(0, 1 - 1 / (r * r)));
  const R  = (ncRadius(A) + ncRadius(4)) * 1e-15; // m
  return { f: v / (2 * R), v, R, K };
}

/* The Gamow half-life estimate, end to end: how often it tries, times how
   likely each try is. Still an estimate — it assumes a spherical parent, zero
   angular momentum carried off, and WKB — but nothing in it is now assumed
   rather than computed except the well depth. */
function ncGamowHalfLife(Z, E, A, wellDepth){
  const G = ncGamow(Z, E, A);
  const F = ncAssaultFreq(E, A, wellDepth);
  const rate = F.f * G.T;                         // decays per second
  return { half: rate > 0 ? Math.LN2 / rate : Infinity, rate, G, F };
}

/* Real α emitters, so the Gamow estimate can be scored rather than admired.
   Q from AME2020, half-lives from NUBASE2020. Deliberately spanning the whole
   Geiger–Nuttall range: a factor of 2.2 in energy against 24 orders of
   magnitude in half-life. dZ/dA are the DAUGHTER's charge and mass, which is
   what the α tunnels out through. */
const NC_ALPHA_EMITTERS = [
  { s:'²³²Th', dZ:88, dA:228, Q:4.0816, half:4.4338e17 },
  { s:'²³⁸U',  dZ:90, dA:234, Q:4.2699, half:1.4100e17 },
  { s:'²³⁵U',  dZ:90, dA:231, Q:4.6784, half:2.2216e16 },
  { s:'²²⁶Ra', dZ:86, dA:222, Q:4.8706, half:5.0492e10 },
  { s:'²¹⁰Po', dZ:82, dA:206, Q:5.4075, half:1.1956e7  },
  { s:'²²²Rn', dZ:84, dA:218, Q:5.5904, half:3.3035e5  },
  { s:'²¹⁸Po', dZ:82, dA:214, Q:6.1147, half:1.86e2    },
  { s:'²¹⁴Po', dZ:82, dA:210, Q:7.8335, half:1.643e-4  },
  { s:'²¹²Po', dZ:82, dA:208, Q:8.9541, half:2.943e-7  }
];

/* ---- cross sections and attenuation ------------------------------------- */
/* Beer–Lambert for γ rays, and the mean free path that goes with it. */
const ncAttenuate = (I0, mu, x) => I0 * Math.exp(-mu * x);
const ncHalfValue = mu => Math.LN2 / mu;
const NC_SHIELDS = [
  { s:'lead',     mu:0.703, rho:11.35 },   // cm⁻¹ at 1 MeV
  { s:'iron',     mu:0.468, rho:7.87  },
  { s:'concrete', mu:0.150, rho:2.30  },
  { s:'water',    mu:0.0707, rho:1.00 },
  { s:'air',      mu:7.8e-5, rho:1.2e-3 }
];
