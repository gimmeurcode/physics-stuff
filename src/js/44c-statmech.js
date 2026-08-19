/* ============================================================================
   3l · STATISTICAL MECHANICS ENGINE
   Where thermodynamics comes from. Counting microstates gives entropy; the
   Boltzmann factor follows from that counting; and every thermodynamic
   quantity is then a derivative of one function, the partition function.

   Everything here is computed by summing or integrating a distribution, never
   quoted — including the Ising transition, which is found rather than asserted.

   Prefix: sm
   ============================================================================ */

const SM_KB   = 1.380649e-23;         // J/K, exact
const SM_KBEV = 8.617333262e-5;       // eV/K
const SM_NA   = 6.02214076e23;        // /mol, exact
/* ---- counting states ----------------------------------------------------- */
/* The Einstein solid: N oscillators sharing q quanta. Its multiplicity is a
   binomial coefficient, and everything thermodynamic follows from how sharply
   that peaks. Computed in logs, because Ω overflows a double at N ≈ 20. */
function smLogBinom(n, k){
  if(k < 0 || k > n) return -Infinity;
  let s = 0;
  for(let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}
const smLogOmega = (N, q) => smLogBinom(q + N - 1, q);
const smEntropy  = (N, q) => SM_KB * smLogOmega(N, q);      // S = k ln Ω

/* Two solids in thermal contact, sharing q quanta between them. The
   distribution over how the energy splits is what "temperature" means: the
   peak is where the two entropies' slopes match, and it sharpens as √N. */
function smContact(NA, NB, q){
  const out = [];
  let best = -Infinity, bestQ = 0, logTot = -Infinity;
  for(let qa = 0; qa <= q; qa++){
    const l = smLogOmega(NA, qa) + smLogOmega(NB, q - qa);
    out.push(l);
    if(l > best){ best = l; bestQ = qa; }
  }
  /* normalise in log space so the probabilities are exact for any N */
  for(const l of out) logTot = logTot === -Infinity ? l : Math.max(logTot, l) +
        Math.log(1 + Math.exp(Math.min(logTot, l) - Math.max(logTot, l)));
  const prob = out.map(l => Math.exp(l - logTot));
  /* the width of the peak, measured */
  const mean = prob.reduce((a, p, i) => a + p * i, 0);
  const vari = prob.reduce((a, p, i) => a + p * (i - mean) * (i - mean), 0);
  return { prob, bestQ, mean, sd:Math.sqrt(vari),
           peakFrac: prob[bestQ],
           /* the relative width — this is the number that makes thermodynamics
              deterministic: it falls as 1/√N */
           relWidth: mean > 0 ? Math.sqrt(vari) / mean : 0 };
}

/* ---- the Boltzmann distribution and the partition function --------------- */
/* Given a set of energy levels (with degeneracies), everything follows.
   Z is computed by summing; U and C are then computed BOTH by summing the
   distribution and by differentiating ln Z, and the stage prints the
   difference, because the claim that they agree is the whole point. */
function smPartition(levels, T){
  const kT = SM_KBEV * T;
  if(kT <= 0){
    const E0 = Math.min(...levels.map(l => l.E));
    const g0 = levels.filter(l => Math.abs(l.E - E0) < 1e-12)
                     .reduce((a, l) => a + (l.g || 1), 0);
    return { Z:g0, U:E0, C:0, S:SM_KBEV * Math.log(g0), p:levels.map(l =>
             Math.abs(l.E - E0) < 1e-12 ? (l.g || 1) / g0 : 0), kT:0, F:E0 };
  }
  const E0 = Math.min(...levels.map(l => l.E));      // shift for stability
  let Z = 0, s1 = 0, s2 = 0;
  for(const l of levels){
    const w = (l.g || 1) * Math.exp(-(l.E - E0) / kT);
    Z += w; s1 += w * l.E; s2 += w * l.E * l.E;
  }
  const U = s1 / Z;
  const C = (s2 / Z - U * U) / (kT * T);             // ⟨E²⟩−⟨E⟩² = kT²C
  const F = E0 - kT * Math.log(Z);                   // free energy
  return { Z, U, C, F, S:(U - F) / T, kT,
           p:levels.map(l => (l.g || 1) * Math.exp(-(l.E - E0) / kT) / Z) };
}
/* U by differentiating ln Z numerically, for the cross-check */
function smUFromZ(levels, T, dT){
  const h = dT || T * 1e-4;
  const lnZ = t => {
    const kT = SM_KBEV * t, E0 = Math.min(...levels.map(l => l.E));
    let Z = 0;
    for(const l of levels) Z += (l.g || 1) * Math.exp(-(l.E - E0) / kT);
    return Math.log(Z) - E0 / kT;
  };
  /* U = −d(lnZ)/dβ with β = 1/kT, so dβ = −dT/(kT²) */
  const b = t => 1 / (SM_KBEV * t);
  return -(lnZ(T + h) - lnZ(T - h)) / (b(T + h) - b(T - h));
}

/* level sets worth looking at */
const SM_LEVELS = {
  twoState:  { n:'two-state (spin ½ in a field)', mk:E => [{E:0,g:1},{E:E,g:1}], par:1,
    note:'The simplest system with a temperature. Its heat capacity has a peak — a Schottky anomaly — because a gap can only absorb energy near kT ≈ ΔE.' },
  harmonic:  { n:'harmonic oscillator', mk:E => Array.from({length:60}, (_, k) => ({E:E*(k+0.5), g:1})), par:1,
    note:'Z sums a geometric series exactly. At high T it gives U = kT, recovering equipartition; at low T it freezes out, which is what classical physics could not explain.' },
  hydrogen:  { n:'hydrogen-like levels', mk:E => Array.from({length:8}, (_, k) => ({E:E*(1 - 1/((k+1)*(k+1))), g:2*(k+1)*(k+1)})), par:13.6,
    note:'Degeneracy 2n² fights the Boltzmann factor. The excited states are essentially unoccupied at any temperature a gas survives.' },
  rotational:{ n:'rigid rotor', mk:E => Array.from({length:40}, (_, J) => ({E:E*J*(J+1), g:2*J+1})), par:1,
    note:'The 2J+1 degeneracy means the most populated level is not the ground state — which is why molecular spectra have a peak in the middle of a band.' }
};

/* ---- the Maxwell–Boltzmann speed distribution ---------------------------- */
/* Derived, not quoted: the Boltzmann factor in energy times the 4πv² of
   velocity space. The v² is why the distribution vanishes at zero speed. */
function smMaxwell(v, m, T){
  const a = m / (2 * SM_KB * T);
  return 4 * Math.PI * v * v * Math.pow(a / Math.PI, 1.5) * Math.exp(-a * v * v);
}
const smVmp  = (m, T) => Math.sqrt(2 * SM_KB * T / m);
const smVavg = (m, T) => Math.sqrt(8 * SM_KB * T / (Math.PI * m));
const smVrms = (m, T) => Math.sqrt(3 * SM_KB * T / m);
/* the three speeds by integration, so the closed forms are checked */
function smSpeedMoments(m, T){
  const vm = smVrms(m, T) * 6, n = 4000, h = vm / n;
  let m0 = 0, m1 = 0, m2 = 0;
  for(let i = 0; i <= n; i++){
    const v = i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    const f = smMaxwell(v, m, T);
    m0 += w * f; m1 += w * v * f; m2 += w * v * v * f;
  }
  return { total:m0 * h / 3, avg:m1 / m0, rms:Math.sqrt(m2 / m0) };
}
/* real gases, molar masses in g/mol */
const SM_GASES = [
  { s:'H₂', M:2.016 },  { s:'He', M:4.003 }, { s:'N₂', M:28.014 },
  { s:'O₂', M:31.998 }, { s:'Ar', M:39.948 }, { s:'CO₂', M:44.010 },
  { s:'Xe', M:131.29 }
];
const smMass = M => M * 1e-3 / SM_NA;      // kg per molecule

/* ---- the three statistics ------------------------------------------------ */
/* One formula with a sign: +1 fermions, −1 bosons, 0 classical. Everything
   that distinguishes a metal from a laser from an ideal gas is that sign. */
function smOccupancy(E, mu, T, kind){
  const x = (E - mu) / (SM_KBEV * T);
  if(kind === 'mb') return Math.exp(-x);
  if(x > 60) return Math.exp(-x);
  if(kind === 'fd') return 1 / (Math.exp(x) + 1);
  const d = Math.exp(x) - 1;                 // bosons: diverges as E → μ
  return d > 1e-12 ? 1 / d : 1e12;
}

/* ---- the Ising model ----------------------------------------------------- */
/* One dimension, exactly, by transfer matrix. The famous result is that there
   is NO transition at any finite temperature — the model orders only at T = 0.
   Having the exact answer makes the 2D simulation's transition credible. */
function smIsing1D(T, J, h){
  const b = 1 / Math.max(1e-9, T);
  const l1 = Math.exp(b * J) * Math.cosh(b * h) +
             Math.sqrt(Math.exp(2 * b * J) * Math.pow(Math.sinh(b * h), 2) + Math.exp(-2 * b * J));
  /* magnetisation per spin, from ∂(lnλ₁)/∂h */
  const sh = Math.sinh(b * h);
  const m = h === 0 ? 0 :
    sh / Math.sqrt(sh * sh + Math.exp(-4 * b * J));
  /* energy per spin at h = 0 has the closed form −J tanh(βJ) */
  const u = -J * Math.tanh(b * J);
  return { lambda:l1, m, u, f:-Math.log(l1) / b };
}

/* Two dimensions, by Metropolis. The state is kept so the stage can animate
   it; the observables are averaged over sweeps after equilibration. */
function smIsingInit(L, hot){
  const s = new Int8Array(L * L);
  for(let i = 0; i < s.length; i++) s[i] = hot ? (Math.random() < 0.5 ? -1 : 1) : 1;
  return s;
}
function smIsingSweep(s, L, T, J, h){
  const b = 1 / Math.max(1e-9, T);
  for(let n = 0; n < L * L; n++){
    const i = (Math.random() * L) | 0, j = (Math.random() * L) | 0, k = i * L + j;
    const nb = s[((i + 1) % L) * L + j] + s[((i - 1 + L) % L) * L + j] +
               s[i * L + (j + 1) % L] + s[i * L + (j - 1 + L) % L];
    const dE = 2 * s[k] * (J * nb + h);
    if(dE <= 0 || Math.random() < Math.exp(-b * dE)) s[k] = -s[k];
  }
  return s;
}
function smIsingObs(s, L, J, h){
  let M = 0, E = 0;
  for(let i = 0; i < L; i++) for(let j = 0; j < L; j++){
    const k = i * L + j;
    M += s[k];
    E -= J * s[k] * (s[((i + 1) % L) * L + j] + s[i * L + (j + 1) % L]) + h * s[k];
  }
  const N = L * L;
  return { m:M / N, absm:Math.abs(M) / N, e:E / N };
}
/* Onsager's exact critical temperature for the square lattice, for comparison
   with whatever the simulation actually finds */
const SM_TC_2D = 2 / Math.log(1 + Math.SQRT2);          // = 2.269185… J/k

/* ---- entropy of mixing and the arrow of time ----------------------------- */
/* N particles in a box, free to be on either side. The "why does gas fill the
   room" question answered by counting, with the fluctuation size predicted. */
function smMixing(N){
  const lp = k => smLogBinom(N, k) - N * Math.LN2;
  const half = N / 2;
  return { pHalf:Math.exp(lp(Math.round(half))),
           /* the standard deviation of the number on one side is √N/2 */
           sd:Math.sqrt(N) / 2,
           relFluct:Math.sqrt(N) / 2 / half,
           /* the probability all N end up on one side */
           logPAll:-N * Math.LN2,
           entropyGain:SM_KB * N * Math.LN2 };
}
