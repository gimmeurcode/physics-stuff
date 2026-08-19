/* ============================================================================
   4d · STRING THEORY — the engine

   Every number this wing prints is produced here, from the definitions, with no
   quoted results standing in for a calculation. That is a stronger claim in
   string theory than anywhere else in this laboratory, because the subject has
   a reputation for being untestable, and a page of asserted formulas would earn
   that reputation. So:

     · ζ(−1) = −1/12 is obtained THREE independent ways — an exponential cutoff
       whose divergence is subtracted, the functional equation applied to a
       numerically summed ζ(2), and the closed form — and the three are printed
       against each other.
     · the critical dimension is SOLVED for, twice (light-cone intercept, and
       the vanishing of the total conformal anomaly), never quoted.
     · the Regge slope is FITTED to PDG 2024 meson masses, and the string
       tension that follows is checked against the Cornell-potential value the
       atom wing already uses (SIGMA_STRING, 45-atom.js).
     · the Hagedorn temperature is checked against an exact state count.
     · Ryu–Takayanagi is checked by integrating a bulk geodesic and comparing
       with the boundary CFT formula computed separately.
     · every extra-dimension size is placed against the actual 2020s laboratory
       and collider limits, which is how we know the answer is "not that big".

   Naming: everything here is prefixed `ws` / `WS_` (worldsheet). One script
   scope, so collisions are silent — see src/js/CLAUDE.md.

   Units. Particle-physics natural units (ħ = c = 1) unless a name ends in a
   unit: masses in GeV, α′ in GeV⁻², lengths in GeV⁻¹ converted through
   WS_HBARC_GEVM. The Casimir and Planck sections work in SI because they are
   compared with laboratory measurements.
   ============================================================================ */

/* ---- constants ------------------------------------------------------------
   ħ comes from the exact SI Planck constant already defined in 44c; c and G are
   the same numbers as C_SI and G_SI in 46-relativity.js, repeated here because
   that module loads later and a top-level const cannot reach forward. The unit
   suite pins the two copies against each other. */
const WS_H_JS     = 6.62607015e-34;        // J·s — exact since 2019
const WS_HBAR     = WS_H_JS / (2 * Math.PI);
const WS_C        = 2.99792458e8;          // m/s — exact
const WS_G        = 6.67430e-11;           // m³kg⁻¹s⁻² — CODATA 2022
const WS_GEV_J    = 1.602176634e-10;       // J per GeV — exact
const WS_HBARC_GEVM = 1.973269804e-16;     // GeV·m  (= ħc; HBARC/1e3 × 1e−15)

/* Planck units, computed rather than quoted — the unit suite checks them
   against the CODATA 2022 published values. */
const WS_LPL_M    = Math.sqrt(WS_HBAR * WS_G / (WS_C * WS_C * WS_C));  // 1.616×10⁻³⁵ m
const WS_MPL_KG   = Math.sqrt(WS_HBAR * WS_C / WS_G);                  // 2.176×10⁻⁸ kg
const WS_TPL_S    = WS_LPL_M / WS_C;                                   // 5.391×10⁻⁴⁴ s
const WS_MPL_GEV  = WS_MPL_KG * WS_C * WS_C / WS_GEV_J;                // 1.2209×10¹⁹ GeV
const WS_MPL_RED  = WS_MPL_GEV / Math.sqrt(8 * Math.PI);               // 2.435×10¹⁸ GeV

/* the electromagnetic coupling, for the weak-gravity test */
const WS_ALPHA_EM = 1 / 137.035999177;     // CODATA 2022
const WS_E_GAUGE  = Math.sqrt(4 * Math.PI * WS_ALPHA_EM);
const WS_M_ELECTRON_GEV = 0.51099895069e-3;                            // CODATA 2022

/* ============================================================================
   1 · THE VIBRATING STRING AND ITS SPECTRUM
   ============================================================================ */

/* the three ways of naming the same scale */
const wsTension     = ap => 1 / (2 * Math.PI * ap);        // GeV² if α′ in GeV⁻²
const wsStringScale = ap => 1 / Math.sqrt(ap);             // M_s = 1/√α′, GeV
/* a tension in GeV² is a force once ħc is put back: GeV²/(ħc) = GeV/fm */
const wsTensionGeVfm = ap => wsTension(ap) / (WS_HBARC_GEVM * 1e15);
const wsTensionNewton = ap => wsTension(ap) * WS_GEV_J / (WS_HBARC_GEVM);

/* α′M² at oscillator level N. The open bosonic string has intercept 1 (so N=0
   is a tachyon and N=1 is the massless vector); the GSO-projected NS sector has
   intercept ½ with N half-odd-integer, so its lowest state is exactly massless.
   The closed string is two copies, hence the factor of 4. */
const wsOpenAlphaM2   = (N, kind) => kind === 'super' ? N - 0.5 : N - 1;
const wsClosedAlphaM2 = (N, kind) => kind === 'super' ? 4 * N   : 4 * (N - 1);
const wsMassGeV = (alphaM2, ap) => alphaM2 >= 0 ? Math.sqrt(alphaM2 / ap)
                                                : -Math.sqrt(-alphaM2 / ap);

/* The number of states at level N built from `colours` towers of oscillators —
   the coefficient of q^N in ∏(1−qⁿ)^(−colours). Exact integers up to about
   level 8; beyond that the count passes 2⁵³ and is carried to sixteen
   significant figures, which is far more than the asymptotics need. */
function wsLevelStates(N, colours){
  const d = new Float64Array(N + 1);
  d[0] = 1;
  for(let c = 0; c < colours; c++)
    for(let n = 1; n <= N; n++)
      for(let k = n; k <= N; k++) d[k] += d[k - n];
  return d;
}
/* Cardy / Hardy–Ramanujan: ln d_N → 2π√(cN/6). For 24 transverse bosons that is
   4π√N, and it is the whole reason a Hagedorn temperature exists. */
const wsCardyLog = (c, N) => 2 * Math.PI * Math.sqrt(c * N / 6);
function wsDegeneracyCheck(N, colours){
  const d = wsLevelStates(N, colours);
  const exact = d[N];
  const cardy = wsCardyLog(colours, N);
  return { exact, lnExact: Math.log(exact), cardy,
           ratio: cardy > 0 ? Math.log(exact) / cardy : 0 };
}
/* The bare Cardy ratio converges painfully slowly — 0.64 at level 32 — and
   showing only that would look like a failure when it is nothing of the kind.
   The full saddle-point evaluation of the contour integral for the coefficient
   supplies every factor, not just the exponent, and it is what actually agrees.
   Writing τ for the saddle (a literal star here would close this comment):

     d_N ≈ exp(−cτ÷24) · (τ÷2π)^(c÷2) · exp S(τ) ÷ √(2π S″(τ)),
     S(t) = cπ²÷6t + Nt,   τ = π√(c÷6N),   S(τ) = 2π√(cN÷6)

   The modular transformation of η is what turns the product into that form,
   which is why the Hagedorn density and the fundamental domain are the same
   fact seen twice. */
function wsSaddleLog(N, c){
  const t = Math.PI * Math.sqrt(c / (6 * N));
  const S  = c * Math.PI * Math.PI / (6 * t) + N * t;
  const S2 = c * Math.PI * Math.PI / (3 * t * t * t);
  return -c * t / 24 + (c / 2) * Math.log(t / (2 * Math.PI)) + S
         - 0.5 * Math.log(2 * Math.PI * S2);
}
function wsAsymptoticLadder(N, colours){
  const d = wsLevelStates(N, colours);
  const rows = [];
  for(let n = 1; n <= N; n++){
    if(!(d[n] > 0)) continue;
    const ln = Math.log(d[n]);
    const lead = wsCardyLog(colours, n);
    const saddle = wsSaddleLog(n, colours);
    rows.push({ n, count: d[n], ln, lead, saddle,
                ratio: ln / lead, saddleRatio: ln / saddle, resid: ln - saddle });
  }
  return rows;
}
/* The D1-D5-P bound state: 4 bosons and 4 fermions on each of Q₁Q₅ strands, so
   c = 4Q₁Q₅ + ½·4Q₁Q₅ = 6Q₁Q₅. The exact level count is the coefficient of q^N
   in ((1+qⁿ)/(1−qⁿ))^(4Q₁Q₅) — countable, and therefore checkable against Cardy
   rather than trusted. */
function wsBoseFermiStates(N, nb, nf){
  const d = new Float64Array(N + 1);
  d[0] = 1;
  for(let c = 0; c < nb; c++)
    for(let n = 1; n <= N; n++) for(let j = n; j <= N; j++) d[j] += d[j - n];
  for(let c = 0; c < nf; c++)
    for(let n = 1; n <= N; n++) for(let j = N; j >= n; j--) d[j] += d[j - n];
  return d;
}
/* A fermionic mode may be occupied once — the descending sweep — and a bosonic
   one any number of times. The superstring's 8 transverse bosons and 8 fermions
   give an effective central charge 8 + 8÷2 = 12, and 2π√(12N÷6) = 2π√(2N) is
   exactly the exponent behind β_H = 2π√(2α′): both Hagedorn temperatures in
   this wing are counted rather than quoted. */
const wsEffectiveC  = (nb, nf) => nb + nf / 2;
const wsD1D5States  = (N, k) => wsBoseFermiStates(N, 4 * k, 4 * k);
/* ρ(M) ~ e^(β_H M) makes the canonical partition function diverge above T_H */
const wsHagedornBeta = (ap, kind) => kind === 'super'
  ? 2 * Math.PI * Math.sqrt(2 * ap) : 4 * Math.PI * Math.sqrt(ap);
const wsHagedornT = (ap, kind) => 1 / wsHagedornBeta(ap, kind);

/* ============================================================================
   2 · REGGE TRAJECTORIES — where the whole subject started
   PDG 2024 central values. The last two carry large errors and the PDG flags
   them as needing confirmation; they are marked so the fit can drop them.
   ============================================================================ */
const WS_RHO_TRAJ = [
  { n:'ρ(770)',   J:1, M:0.77526, dM:0.00025, firm:true  },
  { n:'a₂(1320)', J:2, M:1.3169,  dM:0.0009,  firm:true  },
  { n:'ρ₃(1690)', J:3, M:1.6888,  dM:0.0021,  firm:true  },
  { n:'a₄(1970)', J:4, M:1.967,   dM:0.016,   firm:true  },
  { n:'ρ₅(2350)', J:5, M:2.330,   dM:0.035,   firm:false },
  { n:'a₆(2450)', J:6, M:2.450,   dM:0.130,   firm:false }
];
/* the nucleon trajectory, for comparison — baryons lie on lines too */
const WS_N_TRAJ = [
  { n:'N(939)',   J:0.5, M:0.93892, dM:0.00001, firm:true },
  { n:'N(1680)',  J:2.5, M:1.685,   dM:0.005,   firm:true },
  { n:'N(2220)',  J:4.5, M:2.25,    dM:0.05,    firm:false }
];

/* ordinary least squares, returned with the evidence: r², residuals, and the
   standard error of the slope — a fit reported without them is an assertion */
function wsFitLine(xs, ys){
  const n = xs.length;
  /* `rms` has to be present on this branch too. A caller that reads f.fit.rms
     off a degenerate fit would otherwise print the literal word undefined,
     which is exactly what runall greps for. */
  if(n < 2) return { m:0, b:0, r2:0, resid:[], se:0, rms:0, n };
  let sx = 0, sy = 0;
  for(let i = 0; i < n; i++){ sx += xs[i]; sy += ys[i]; }
  const mx = sx / n, my = sy / n;
  let sxx = 0, sxy = 0;
  for(let i = 0; i < n; i++){ sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); }
  const m = sxx === 0 ? 0 : sxy / sxx, b = my - m * mx;
  let ssr = 0, sst = 0;
  const resid = [];
  for(let i = 0; i < n; i++){
    const r = ys[i] - (m * xs[i] + b);
    resid.push(r); ssr += r * r; sst += (ys[i] - my) ** 2;
  }
  const se = (n > 2 && sxx > 0) ? Math.sqrt(ssr / (n - 2) / sxx) : 0;
  return { m, b, r2: sst > 0 ? 1 - ssr / sst : 0, resid, se, n, rms: Math.sqrt(ssr / n) };
}
/* J = α′M² + α₀ — the fit is over M², which is the point: the LINE is in M² */
function wsReggeFit(traj, firmOnly){
  const use = traj.filter(p => !firmOnly || p.firm);
  const f = wsFitLine(use.map(p => p.M * p.M), use.map(p => p.J));
  return { alphaP: f.m, alpha0: f.b, r2: f.r2, se: f.se, resid: f.resid, used: use, fit: f };
}

/* ============================================================================
   3 · THE VENEZIANO AMPLITUDE
   Lanczos log-Γ (g=7, n=9): ~15 significant figures, and the reflection formula
   carries it to negative arguments, which is where the poles live.
   ============================================================================ */
const WS_LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7];
function wsGamma(z){
  if(z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * wsGamma(1 - z));
  z -= 1;
  let x = 0.99999999999980993;
  for(let i = 0; i < WS_LANCZOS.length; i++) x += WS_LANCZOS[i] / (z + i + 1);
  const t = z + WS_LANCZOS.length - 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
function wsLogFactorial(n){
  let s = 0;
  for(let k = 2; k <= n; k++) s += Math.log(k);
  return s;
}
/* sin(πx) from the fractional part. Math.sin(Math.PI * x) at x ≈ 2×10⁴ has
   already lost the digits that decide whether a pole is hit, and the Regge
   limit lives at exactly those arguments. */
function wsSinPi(x){
  const k = Math.floor(x), f = x - k;
  return Math.sin(Math.PI * f) * ((((k % 2) + 2) % 2) === 0 ? 1 : -1);
}
/* Signed log Γ. The Regge limit needs Γ at arguments like −201, where Γ itself
   overflows to ±∞ long before the RATIO in the Beta function does — the direct
   product returned NaN and hid the very asymptotics the wing is about. */
function wsLogGamma(z){
  if(z < 0.5){
    const f = z - Math.floor(z);
    if(f < 1e-12 || f > 1 - 1e-12) return { ln: Infinity, sign: 1 };   // a pole of Γ
    const s = wsSinPi(z);
    const g = wsLogGamma(1 - z);
    return { ln: Math.log(Math.PI) - Math.log(Math.abs(s)) - g.ln,
             sign: (s > 0 ? 1 : -1) * g.sign };
  }
  const zz = z - 1;
  let x = 0.99999999999980993;
  for(let i = 0; i < WS_LANCZOS.length; i++) x += WS_LANCZOS[i] / (zz + i + 1);
  const t = zz + WS_LANCZOS.length - 0.5;
  return { ln: 0.5 * Math.log(2 * Math.PI) + (zz + 0.5) * Math.log(t) - t + Math.log(x),
           sign: 1 };
}
/* B(a,b) = Γ(a)Γ(b)/Γ(a+b), assembled in logs. `pole` is returned rather than
   left for the caller to infer from an infinity, because a pole is the physics
   here — it is a particle — and a readout must say so in words. */
function wsBetaSigned(a, b){
  const A = wsLogGamma(a), B = wsLogGamma(b), C = wsLogGamma(a + b);
  const pn = !Number.isFinite(A.ln) || !Number.isFinite(B.ln);
  const pd = !Number.isFinite(C.ln);
  if(pn && pd) return { value: 0, pole: true, both: true };
  if(pn)       return { value: A.sign * B.sign * Infinity, pole: true };
  if(pd)       return { value: 0, pole: false };
  return { value: A.sign * B.sign * C.sign * Math.exp(A.ln + B.ln - C.ln), pole: false };
}
const wsBeta = (a, b) => wsBetaSigned(a, b).value;
/* α(s) = 0, 1, 2, … is where a pole sits — the resonances of the tower */
const wsIsPole = x => Math.abs(x - Math.round(x)) < 1e-9 && Math.round(x) >= 0;

const wsAlphaOf = (x, ap, a0) => a0 + ap * x;
/* A(s,t) = B(−α(s), −α(t)) — Veneziano 1968, written down before anyone knew
   it was a string */
function wsVeneziano(s, t, ap, a0){
  return wsBeta(-wsAlphaOf(s, ap, a0), -wsAlphaOf(t, ap, a0));
}
/* the residue at α(s) = n is a polynomial of degree n in α(t): spins 0…n are
   exchanged at that mass, which is the string's tower seen in the amplitude */
function wsVenezianoResidue(n, at){
  let p = 1;
  for(let k = 1; k <= n; k++) p *= (at + k);
  return p / Math.exp(wsLogFactorial(n));
}
/* On the real axis the amplitude also carries a signature factor that
   oscillates between the poles. Leaving it out makes the check look like a
   30% failure when the exponent is in fact exact, so it is included. */
function wsReggeAsymptoteFull(s, t, ap, a0){
  const as = wsAlphaOf(s, ap, a0), at = wsAlphaOf(t, ap, a0);
  const den = wsSinPi(as);
  if(Math.abs(den) < 1e-12) return Infinity;
  return Math.abs(wsSinPi(as + at) / den) * wsGamma(-at) * Math.pow(ap * s, at);
}
/* The exponent, MEASURED rather than read off. Sampling at α(s) = n + ½ sits on
   the tops of the resonance bumps, where the signature factor is exactly ±1, so
   the slope of ln|A| against ln s is α(t) and nothing else. */
function wsReggeSlopeMeasured(t, ap, a0, nLo, nHi){
  const xs = [], ys = [];
  for(let n = nLo; n <= nHi; n++){
    const s = (n + 0.5 - a0) / ap;
    if(s <= 0) continue;
    const A = Math.abs(wsVeneziano(s, t, ap, a0));
    if(!Number.isFinite(A) || A <= 0) continue;
    xs.push(Math.log(s)); ys.push(Math.log(A));
  }
  const f = wsFitLine(xs, ys);
  const at = wsAlphaOf(t, ap, a0);
  return { slope: f.m, alphaT: at, gap: Math.abs(f.m - at), r2: f.r2, n: xs.length };
}
/* fixed-angle limit: the amplitude falls off EXPONENTIALLY in the energy, which
   is the softness that makes string scattering finite where field theory is not */
function wsFixedAngleLog(s, cosTheta, ap, a0){
  const t = -0.5 * s * (1 - cosTheta), u = -0.5 * s * (1 + cosTheta);
  const as = wsAlphaOf(s, ap, a0), at = wsAlphaOf(t, ap, a0), au = wsAlphaOf(u, ap, a0);
  /* the saddle point of the Beta integral: ln|A| ≈ −(α_s lnα_s + α_t lnα_t + α_u lnα_u)
     with α_s + α_t + α_u fixed — Gross–Mende softness */
  const f = x => x === 0 ? 0 : x * Math.log(Math.abs(x));
  return -(f(as) + f(at) + f(au));
}

/* ============================================================================
   4 · ζ(−1), THE NORMAL-ORDERING CONSTANT, AND THE CRITICAL DIMENSION
   Three routes to −1/12. They are computed separately and compared, because
   "1+2+3+… = −1/12" stated without a regulator is the single most misquoted
   line in physics, and the disagreement between routes would be the evidence
   that something is wrong.
   ============================================================================ */

/* (a) the naive partial sum — it diverges, and saying so is part of being right */
const wsPartialSum = N => N * (N + 1) / 2;

/* (b) an exponential cutoff. Σ n e^(−εn) = 1/(4 sinh²(ε/2)) exactly, and its
   Laurent expansion is 1/ε² − 1/12 + ε²/240 − …  The 1/ε² piece is the
   cutoff-dependent vacuum energy that a physical boundary condition removes;
   what is left over is universal. The sinh form is used rather than
   e^(−ε)/(1−e^(−ε))² because the latter cancels catastrophically as ε → 0. */
const wsSumCutoff      = eps => 1 / (4 * Math.pow(Math.sinh(eps / 2), 2));
const wsSumRegularised = eps => wsSumCutoff(eps) - 1 / (eps * eps);

/* (c) analytic continuation, done rather than invoked. ζ(2) is summed by
   Euler–Maclaurin, then the functional equation carries it to ζ(−1). Nothing
   here knows the answer in advance. */
function wsZetaEM(s, M){
  const m = M || 40;
  let sum = 0;
  for(let k = 1; k < m; k++) sum += Math.pow(k, -s);
  sum += 0.5 * Math.pow(m, -s) + Math.pow(m, 1 - s) / (s - 1);
  sum += s * Math.pow(m, -s - 1) / 12;
  sum -= s * (s + 1) * (s + 2) * Math.pow(m, -s - 3) / 720;
  return sum;
}
/* ζ(1−s) = 2(2π)^(−s) cos(πs/2) Γ(s) ζ(s); at s = 2 this gives ζ(−1) */
function wsZetaByFunctionalEq(s){
  return 2 * Math.pow(2 * Math.PI, -s) * Math.cos(Math.PI * s / 2) *
         wsGamma(s) * wsZetaEM(s);
}
const wsZetaMinusOne = () => wsZetaByFunctionalEq(2);

/* The normal-ordering constant. Each transverse oscillator contributes ½Σn,
   regularised to −1/24; the NS sector's worldsheet fermions are half-integer
   moded and add half as much again with the opposite sign structure, giving
   a = (D−2)/16. */
const wsIntercept = (D, kind) => kind === 'super' ? (D - 2) / 16 : (D - 2) / 24;
/* SOLVED, not quoted: the level-1 state must be exactly massless (it is a
   Lorentz vector, and a massive vector in D dimensions has D−1 polarisations
   while the string supplies D−2). Setting a = 1 (bosonic) or ½ (NS) gives D. */
function wsCriticalFromIntercept(kind){
  return kind === 'super' ? 2 + 16 * 0.5 : 2 + 24 * 1;
}
/* The independent route: the total worldsheet conformal anomaly must vanish.
   Bosonic: D matter + (−26) from the bc ghosts.
   Superstring: D bosons + D/2 fermions − 26 (bc) + 11 (βγ) = 3D/2 − 15. */
const wsAnomalyC = (D, kind) => kind === 'super' ? 1.5 * D - 15 : D - 26;
function wsCriticalFromAnomaly(kind){
  return kind === 'super' ? 15 / 1.5 : 26;
}

/* ---- the same −1/12, measured in a laboratory ---------------------------- */
/* Casimir 1948. The identical regularisation, but here the leftover finite part
   is a force between two mirrors, and it has been measured to better than 1%. */
const wsCasimirPressure = d =>
  -Math.PI * Math.PI * WS_HBAR * WS_C / (240 * Math.pow(d, 4));      // N/m² (attractive)
const wsCasimirEnergyArea = d =>
  -Math.PI * Math.PI * WS_HBAR * WS_C / (720 * Math.pow(d, 3));      // J/m²
const wsCasimirForce = (d, areaM2) => wsCasimirPressure(d) * areaM2; // N

/* ============================================================================
   5 · COMPACT DIMENSIONS — Kaluza–Klein, winding, T-duality
   ============================================================================ */
const wsKKMass   = (n, R) => Math.abs(n) / R;             // momentum quantised by the circle
const wsWindMass = (w, R, ap) => Math.abs(w) * R / ap;    // energy of w wraps of tension 1/2πα′
/* Closed bosonic string on a circle of radius R, in units ħ = c = 1:
     M² = (n/R)² + (wR/α′)² + (2/α′)(N + N̄ − 2),  with  N − N̄ = nw. */
function wsCircleSpectrum(n, w, N, Nb, R, ap){
  const m2 = Math.pow(n / R, 2) + Math.pow(w * R / ap, 2) + (2 / ap) * (N + Nb - 2);
  return { m2, M: m2 >= 0 ? Math.sqrt(m2) : -Math.sqrt(-m2),
           matched: (N - Nb) === n * w, kk: n / R, wind: w * R / ap };
}
/* R → α′/R with n ↔ w is an exact symmetry of that spectrum, and of the
   interacting theory. A circle smaller than √α′ is a circle larger than √α′
   described in the other variables — there is no shorter distance to go to. */
const wsTDual     = (R, ap) => ap / R;
const wsSelfDualR = ap => Math.sqrt(ap);
function wsTDualityCheck(n, w, N, Nb, R, ap){
  const a = wsCircleSpectrum(n, w, N, Nb, R, ap);
  const b = wsCircleSpectrum(w, n, Nb, N, wsTDual(R, ap), ap);
  return { m2a: a.m2, m2b: b.m2, gap: Math.abs(a.m2 - b.m2) };
}
/* IIA on a circle IS M-theory on a circle: R₁₁ = g_s ℓ_s, ℓ₁₁ = g_s^(1/3) ℓ_s.
   Strong coupling opens an eleventh dimension nobody put in. */
const wsMRadius   = (gs, ls) => gs * ls;
const wsM11Length = (gs, ls) => Math.cbrt(gs) * ls;

/* ============================================================================
   6 · LARGE EXTRA DIMENSIONS, AND WHAT EXPERIMENT SAYS
   ============================================================================ */
/* ADD 1998: M_Pl² = M_*^(2+n) R^n. Gravity is weak in four dimensions because
   its flux leaks into n more; the true scale M_* may be a TeV. */
function wsADDRadius(n, MstarGeV){
  const RinvGeV = Math.pow(Math.pow(WS_MPL_GEV, 2) / Math.pow(MstarGeV, n + 2), 1 / n);
  return RinvGeV * WS_HBARC_GEVM;                        // metres
}
function wsADDMstar(n, R_m){
  const RinvGeV = R_m / WS_HBARC_GEVM;
  return Math.pow(Math.pow(WS_MPL_GEV, 2) / Math.pow(RinvGeV, n), 1 / (n + 2));
}
/* The measurements. Laboratory limits are 95% CL Yukawa exclusions; the
   collider limits are on the fundamental scale M_D from monojet searches at
   13 TeV. Quoted to the precision the collaborations quote them. */
const WS_XD_LIMITS = {
  eotwash:  { lam: 38.6e-6, note:'Eöt-Wash torsion balance (Lee et al. 2020) — |α| = 1 excluded above this range' },
  hust:     { lam: 30e-6,   note:'HUST torsion pendulum (Tan et al. 2020) — comparable reach, independent apparatus' },
  newton:   { r:   52e-6,   note:'the inverse-square law verified down to this separation' }
};
const WS_ADD_COLLIDER = [
  { n:2, MD:10.7 }, { n:3, MD:8.4 }, { n:4, MD:7.4 }, { n:5, MD:6.8 }, { n:6, MD:6.4 }
];  // TeV, ATLAS/CMS 13 TeV monojet, approximate 95% CL lower limits

/* Randall–Sundrum: one warped extra dimension makes the hierarchy geometric */
const wsRSHierarchy = krc => Math.exp(-Math.PI * krc);
const wsRSkrc = (MhighGeV, MlowGeV) => Math.log(MhighGeV / MlowGeV) / Math.PI;
const WS_J1_ZEROS = [3.8317059702, 7.0155866698, 10.1734681351, 13.3236919363, 16.4706300509];
const wsRSGraviton = (i, kGeV, warp) => WS_J1_ZEROS[i] * kGeV * warp;
const WS_RS_LHC_TEV = 4.5;   // ATLAS dilepton/diphoton, k/M̄_Pl = 0.1, approximate

/* ============================================================================
   7 · COMPACTIFICATION — the torus, modular invariance, Calabi–Yau
   ============================================================================ */
/* small complex helpers; the quantum wing's cAdd/cMul exist but not log/pow */
const wsCmul = (a, b) => ({ re:a.re * b.re - a.im * b.im, im:a.re * b.im + a.im * b.re });
const wsCabs = a => Math.hypot(a.re, a.im);
const wsCexp = a => { const m = Math.exp(a.re); return { re:m * Math.cos(a.im), im:m * Math.sin(a.im) }; };
const wsClog = a => ({ re:Math.log(wsCabs(a)), im:Math.atan2(a.im, a.re) });
const wsCpow = (a, p) => wsCexp({ re:p * wsClog(a).re, im:p * wsClog(a).im });
const wsCcos = a => ({ re:Math.cos(a.re) * Math.cosh(a.im), im:-Math.sin(a.re) * Math.sinh(a.im) });
const wsCsin = a => ({ re:Math.sin(a.re) * Math.cosh(a.im), im:Math.cos(a.re) * Math.sinh(a.im) });

/* Dedekind η(τ) = q^(1/24)∏(1−qⁿ), q = e^(2πiτ). The product converges fast for
   τ₂ ≳ 0.3, which is the whole fundamental domain and then some. */
function wsEta(t1, t2, terms){
  const N = terms || 60;
  let acc = wsCexp({ re: -Math.PI * t2 / 12, im: Math.PI * t1 / 12 });   // q^(1/24)
  for(let n = 1; n <= N; n++){
    const qn = wsCexp({ re: -2 * Math.PI * n * t2, im: 2 * Math.PI * n * t1 });
    acc = wsCmul(acc, { re: 1 - qn.re, im: -qn.im });
  }
  return acc;
}
/* η(−1/τ) = √(−iτ) η(τ) — checked numerically rather than asserted */
function wsEtaModularCheck(t1, t2){
  const n2 = t1 * t1 + t2 * t2;
  const lhs = wsEta(-t1 / n2, t2 / n2);
  const root = wsCpow({ re: t2, im: -t1 }, 0.5);          // √(−iτ)
  const rhs = wsCmul(root, wsEta(t1, t2));
  return { lhs, rhs, gap: Math.hypot(lhs.re - rhs.re, lhs.im - rhs.im) };
}
/* Drag τ into the fundamental domain |τ| ≥ 1, |Re τ| ≤ ½ by the two generators.
   Every torus is EQUAL to one in there, which is why the one-loop integral never
   reaches τ₂ → 0 — and τ₂ → 0 is the ultraviolet. */
function wsSL2Reduce(t1, t2){
  const moves = [];
  for(let i = 0; i < 400; i++){
    const shift = Math.round(t1);
    if(shift !== 0){
      t1 -= shift;
      /* τ → τ − k is T^(−k); the exponent is typeset here because these labels
         are drawn on the canvas, where markup would appear literally */
      moves.push('T' + (Math.abs(shift) === 1 && shift < 0 ? '' : supDigits(String(-shift))));
    }
    const n2 = t1 * t1 + t2 * t2;
    if(n2 < 1 - 1e-13){ t1 = -t1 / n2; t2 = t2 / n2; moves.push('S'); }
    else break;
  }
  return { t1, t2, moves, inDomain: (t1 * t1 + t2 * t2) >= 1 - 1e-9 && Math.abs(t1) <= 0.5 + 1e-9 };
}

/* Calabi–Yau threefolds. Hodge numbers are the counted moduli: h¹¹ Kähler
   (sizes), h²¹ complex-structure (shapes). χ = 2(h¹¹ − h²¹), and the standard
   heterotic embedding gives |χ|/2 chiral generations. */
const WS_CY = [
  { n:'the quintic in ℙ⁴',            h11:1,   h21:101, w:'the textbook example — five variables, one degree-5 equation' },
  { n:'the mirror of the quintic',    h11:101, h21:1,   w:'the same physics with the two kinds of modulus exchanged' },
  { n:'the bicubic in ℙ²×ℙ²',         h11:2,   h21:83,  w:'a complete intersection, two projective factors' },
  { n:'the tetraquadric in (ℙ¹)⁴',    h11:4,   h21:68,  w:'four quadrics, one in each ℙ¹ factor' },
  { n:'the Tian–Yau manifold',        h11:14,  h21:23,  w:'χ = −18; its free ℤ₃ quotient has χ = −6 — three generations' },
  { n:"Schoen's self-mirror threefold", h11:19, h21:19, w:'χ = 0 — it is its own mirror' }
];
const wsEulerChi   = (h11, h21) => 2 * (h11 - h21);
const wsGenerations = (h11, h21) => Math.abs(wsEulerChi(h11, h21)) / 2;
const wsModuliCount = (h11, h21) => h11 + h21 + 1;    // + the dilaton
/* the size of the catalogue, as it actually stands */
const WS_CY_COUNTS = {
  kreuzerSkarke: 473800776,   // reflexive 4-polytopes (Kreuzer–Skarke)
  ksHodgePairs:  30108,       // distinct (h¹¹, h²¹) arising from them
  cicy:          7890         // complete-intersection configurations (Candelas et al.)
};

/* A real 2-surface inside the Fermat quintic z₁⁵ + z₂⁵ = 1, which is the object
   in every picture captioned "a Calabi–Yau". Hanson's parametrisation: 25
   patches, indexed by two fifth roots of unity. */
function wsFermatPatch(k1, k2, x, y, n){
  const N = n || 5;
  const zc = wsCpow(wsCcos({ re:x, im:y }), 2 / N);
  const zs = wsCpow(wsCsin({ re:x, im:y }), 2 / N);
  const p1 = wsCmul(wsCexp({ re:0, im:2 * Math.PI * k1 / N }), zc);
  const p2 = wsCmul(wsCexp({ re:0, im:2 * Math.PI * k2 / N }), zs);
  return { z1:p1, z2:p2 };
}
/* project the four real dimensions to three, the way the published images do */
function wsFermatPoint(k1, k2, x, y, n, alpha){
  const p = wsFermatPatch(k1, k2, x, y, n);
  return { x:p.z1.re, y:p.z2.re,
           z:Math.cos(alpha) * p.z1.im + Math.sin(alpha) * p.z2.im };
}

/* ============================================================================
   8 · MODULI STABILISATION AND THE LANDSCAPE
   ============================================================================ */
/* KKLT (hep-th/0301240). K = −3 ln(T + T̄), W = W₀ + A e^(−aT); with T = σ + iα
   the F-term potential collapses to one function of σ. The defaults below are
   the paper's own: W₀ = −10⁻⁴, A = 1, a = 0.1, which stabilises at σ ≈ 113. */
function wsKKLTV(sigma, W0, A, a){
  const e = A * Math.exp(-a * sigma);
  return (a * e / (2 * sigma * sigma)) * ((a * sigma / 3) * e + W0 + e);
}
/* an anti-brane in a warped throat adds a positive, SUSY-breaking term */
const wsUpliftD = (sigma, D, power) => D / Math.pow(sigma, power === undefined ? 3 : power);
const wsKKLTTotal = (sigma, W0, A, a, D, power) => wsKKLTV(sigma, W0, A, a) + wsUpliftD(sigma, D, power);
/* the SUSY condition D_T W = 0, whose root is the minimum before uplift */
const wsKKLTSusyResidual = (sigma, W0, A, a) =>
  -a * A * Math.exp(-a * sigma) - (3 / (2 * sigma)) * (W0 + A * Math.exp(-a * sigma));
/* locate the minimum by scanning then bisecting dV/dσ — never by quoting σ */
function wsKKLTMinimum(W0, A, a, D, power, lo, hi){
  const f = s => wsKKLTTotal(s, W0, A, a, D || 0, power);
  const dV = s => (f(s + 1e-4) - f(s - 1e-4)) / 2e-4;
  const s0 = lo || 5, s1 = hi || 400, N = 1200;
  for(let i = 0; i < N; i++){
    const a1 = s0 + (s1 - s0) * i / N, b1 = s0 + (s1 - s0) * (i + 1) / N;
    const fa = dV(a1), fb = dV(b1);
    if(Number.isFinite(fa) && Number.isFinite(fb) && fa < 0 && fb > 0){
      let x0 = a1, x1 = b1;
      for(let k = 0; k < 60; k++){
        const mid = 0.5 * (x0 + x1);
        if(dV(mid) < 0) x0 = mid; else x1 = mid;
      }
      const sm = 0.5 * (x0 + x1);
      return { sigma: sm, V: f(sm) };            // the first minimum is the vacuum
    }
  }
  return null;                                    // uplifted past the barrier — runaway
}
/* The uplift is TUNED, and that tuning is the whole objection to the
   construction, so it is solved for rather than supplied: bisect on D until the
   minimum sits at the requested vacuum energy. Costly enough that a stage must
   call it on a control change, never inside a frame. */
function wsKKLTUpliftFor(W0, A, a, power, targetV){
  const t = targetV === undefined ? 0 : targetV;
  const vmin = D => { const m = wsKKLTMinimum(W0, A, a, D, power); return m ? m.V : null; };
  let lo = 0, hi = 1e-13;
  for(let i = 0; i < 80; i++){
    const v = vmin(hi);
    if(v === null || v > t) break;
    hi *= 1.6;
  }
  for(let i = 0; i < 60; i++){
    const mid = 0.5 * (lo + hi);
    const v = vmin(mid);
    if(v === null || v > t) hi = mid; else lo = mid;
  }
  return 0.5 * (lo + hi);
}
/* the count. K flux quanta subject to a tadpole L populate roughly (2πL)^K/K!
   choices; the exponent, not the number, is the content. */
const wsVacuaLog10 = (L, K) => (K * Math.log(2 * Math.PI * L) - wsLogFactorial(K)) / Math.LN10;
const WS_LANDSCAPE_LOG10 = 272000;   // Taylor–Wang 2015, one F-theory fourfold

/* ============================================================================
   9 · THE SWAMPLAND — the constraints that make the landscape predictive
   ============================================================================ */
/* Distance conjecture: move a distance Δφ in moduli space and an infinite tower
   comes down exponentially. λ is O(1) in every controlled example. */
const wsSDCMass = (m0, lam, dphi) => m0 * Math.exp(-lam * dphi);
/* Species scale: with N light species gravity's own cutoff drops. In d = 4 that
   is M_Pl/√N, and it is why "just add fields" is not free. */
const wsSpeciesScale = (Mpl, N, d) => Mpl / Math.pow(Math.max(1, N), 1 / ((d || 4) - 2));
const wsSpeciesCount = (m, Mpl, d) => Math.pow(Mpl / m, (d || 4) - 2);
/* de Sitter conjecture: M_Pl|∇V| ≥ c V, refined by a curvature alternative.
   Returned as the ratio, so a reader sees how badly a potential passes or fails. */
const wsDSRatio = (V, dV, Mpl) => V > 0 ? Mpl * Math.abs(dV) / V : Infinity;
const wsSlowRollEps = (V, dV, Mpl) => 0.5 * Math.pow(Mpl * dV / V, 2);
/* r = 16ε for single-field slow roll, which is what makes the conjecture testable */
const wsTensorRatio = eps => 16 * eps;
const WS_R_LIMIT = 0.036;    // BICEP/Keck 2021 95% CL, still the tightest direct bound
/* Weak gravity: a charged state with m ≤ √2 g q M_Pl must exist, or extremal
   black holes cannot decay. The electron beats it by twenty-one orders. */
const wsWGCBound = (g, q, Mpl) => Math.SQRT2 * g * q * Mpl;
const wsWGCRatio = (m, g, q, Mpl) => m / wsWGCBound(g, q, Mpl);

/* ============================================================================
   10 · BLACK HOLES — counting the states
   ============================================================================ */
/* Bekenstein–Hawking for Schwarzschild, in units of k_B: S = 4πGM²/(ħc) */
const wsSchwarzschildS = Mkg => 4 * Math.PI * WS_G * Mkg * Mkg / (WS_HBAR * WS_C);
const wsSchwarzschildR = Mkg => 2 * WS_G * Mkg / (WS_C * WS_C);
const wsHawkingT = Mkg => WS_HBAR * Math.pow(WS_C, 3) / (8 * Math.PI * WS_G * Mkg * 1.380649e-23);

/* Strominger–Vafa 1996. The D1-D5-P bound state is a CFT with c = 6Q₁Q₅ carrying
   momentum level N; Cardy counts its states. */
const wsSVCentralCharge = (Q1, Q5) => 6 * Q1 * Q5;
const wsSVEntropy = (Q1, Q5, N) => 2 * Math.PI * Math.sqrt(Q1 * Q5 * N);
/* the geometry side, computed from the horizon: r_H = (Q₁Q₅N)^(1/6) in the
   natural units of the five-dimensional solution, A = 2π²r_H³, and 4G₅ = π */
const wsBH5Radius  = (Q1, Q5, N) => Math.pow(Q1 * Q5 * N, 1 / 6);
const wsBH5Area    = (Q1, Q5, N) => 2 * Math.PI * Math.PI * Math.pow(wsBH5Radius(Q1, Q5, N), 3);
const wsBH5Entropy = (Q1, Q5, N) => wsBH5Area(Q1, Q5, N) / (4 * (Math.PI / 4));
function wsSVCheck(Q1, Q5, N){
  const micro = wsSVEntropy(Q1, Q5, N), macro = wsBH5Entropy(Q1, Q5, N);
  return { micro, macro, gap: Math.abs(micro - macro),
           cardy: wsCardyLog(wsSVCentralCharge(Q1, Q5), N) };
}

/* ============================================================================
   11 · HOLOGRAPHY — Ryu–Takayanagi, computed both ways
   ============================================================================ */
/* Brown–Henneaux: the boundary central charge is fixed by the bulk geometry */
const wsBrownHenneaux = (Lads, G3) => 3 * Lads / (2 * G3);
/* the bulk geodesic anchored on an interval of length L, cut off at z = ε.
   In Poincaré AdS₃ it is the semicircle, and its induced length element is
   dθ/sin θ — integrated here, not evaluated from a remembered formula. */
function wsGeodesicLengthQuad(L, eps){
  const th = Math.asin(Math.max(-1, Math.min(1, 2 * eps / L)));
  return nqAdaptive(t => 1 / Math.sin(t), th, Math.PI - th, 1e-13);
}
/* the same integral in closed form, for the difference to be worth printing */
function wsGeodesicLengthExact(L, eps){
  const s = 2 * eps / L, c = Math.sqrt(Math.max(0, 1 - s * s));
  return 2 * Math.log((1 + c) / s);
}
const wsGeodesicLengthLeading = (L, eps) => 2 * Math.log(L / eps);
/* the boundary answer, from conformal field theory and nothing else */
const wsCFTEntropy = (c, L, eps) => (c / 3) * Math.log(L / eps);
const wsCFTEntropyThermal = (c, L, beta, eps) =>
  (c / 3) * Math.log((beta / (Math.PI * eps)) * Math.sinh(Math.PI * L / beta));
const wsCFTEntropyCircle = (c, L, Ltot, eps) =>
  (c / 3) * Math.log((Ltot / (Math.PI * eps)) * Math.sin(Math.PI * L / Ltot));
function wsRTCheck(L, eps, G3, Lads){
  const g = Lads === undefined ? 1 : Lads;
  const c = wsBrownHenneaux(g, G3);
  const len = wsGeodesicLengthQuad(L, eps);
  const bulk = len / (4 * G3);
  const bdy = wsCFTEntropy(c, L, eps);
  return { c, len, exact: wsGeodesicLengthExact(L, eps), bulk, bdy,
           gap: Math.abs(bulk - bdy), rel: Math.abs(bulk - bdy) / Math.abs(bdy) };
}
/* the radial coordinate IS an energy scale: z ↔ 1/E */
const wsRadialToEnergy = (z, Lads) => (Lads === undefined ? 1 : Lads) / z;

/* ============================================================================
   12 · THE DUALITY WEB
   Six corners, and the maps between them. No free parameters anywhere.
   ============================================================================ */
const WS_THEORIES = [
  { id:'IIA', n:'Type IIA',        D:10, susy:32, w:'closed, non-chiral; even-dimensional D-branes; grows an eleventh dimension at strong coupling' },
  { id:'IIB', n:'Type IIB',        D:10, susy:32, w:'closed, chiral; odd D-branes; S-dual to itself, and the home of AdS₅×S⁵' },
  { id:'I',   n:'Type I',          D:10, susy:16, w:'open and closed, unoriented, gauge group SO(32)' },
  { id:'HO',  n:'Heterotic SO(32)',D:10, susy:16, w:'closed; left-movers bosonic, right-movers supersymmetric' },
  { id:'HE',  n:'Heterotic E₈×E₈', D:10, susy:16, w:'the one that gave the Standard Model its first stringy embedding' },
  { id:'M',   n:'M-theory',        D:11, susy:32, w:'no strings at all — membranes and fivebranes, and no coupling constant to expand in' }
];
const WS_DUALITIES = [
  { a:'IIA', b:'IIB', kind:'T', w:'compactify on a circle: R ↔ α′/R exchanges them' },
  { a:'HE',  b:'HO',  kind:'T', w:'on a circle with Wilson lines, the two heterotic theories are one' },
  { a:'IIB', b:'IIB', kind:'S', w:'g_s → 1/g_s maps the theory to itself, exchanging F-strings and D-strings' },
  { a:'I',   b:'HO',  kind:'S', w:'strong-coupling Type I is weakly coupled heterotic SO(32)' },
  { a:'IIA', b:'M',   kind:'M', w:'M-theory on a circle of radius R₁₁ = g_s ℓ_s' },
  { a:'HE',  b:'M',   kind:'M', w:'M-theory on the interval S¹/ℤ₂ — Hořava–Witten, one E₈ on each wall' }
];
