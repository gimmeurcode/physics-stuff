/* ============================================================================
   3kb · A PHONON SPECTRUM THE READER WRITES

   `slDebyeC` integrates one spectrum — modes counted as ω² up to a cut-off — and
   `slEinsteinC` integrates another: every mode at the same frequency. Between
   them the wing makes a claim it never tests, that the low-temperature heat
   capacity of a solid goes as T³. That is not a fact about solids. It is a fact
   about ω², and it comes from counting: the number of modes below ω grows as ω³
   in three dimensions, and each of them freezes out when kT drops below ħω.

   Given D(ω) the reader has written, the exponent has to be MEASURED — log₁₀C
   fitted against log₁₀T over a decade at the bottom, with the residual and the
   bend in the local slope reported beside it, because a fitted straight line
   through an exponential is still a straight line and the fit alone cannot tell
   you which you have.

   Frequencies are carried as MODE TEMPERATURES, θ = ħω/k_B in kelvin, which is
   how phonon spectra are quoted and which removes ħ from the file entirely. A
   Debye solid is then D(w) = w² up to θ_D, and an Einstein solid is a spike at
   θ_E — so both engines already in the wing are reachable as typed input, and
   reproducing them is what anchors everything else.

   The normalisation is ∫D dw, so C → 3R as T → ∞ for ANY spectrum. That much is
   by construction and is not a test; what is a test is the RATE of approach,
   whose leading term is 3R⟨w²⟩/12T². The second moment of the reader's spectrum
   is computed one way and read off the measured C(T) another.

   Prefix: sl
   ============================================================================ */

/* `w` is the mode temperature. It is a variable the maths engine already knows
   nothing about, so it is rewritten before parsing — whole identifiers only, so
   that nothing containing a w is touched. */
const slPhononSrc = s => String(s == null ? '' : s)
  .replace(/(?<![A-Za-z0-9.])w(?![A-Za-z0-9])/g, 'x');

/* The Einstein function x²eˣ/(eˣ−1)², which is one mode's contribution to the
   heat capacity in units of k_B. Three branches, and each is there for a reason:
   the series below x = 10⁻³ because eˣ−1 loses every digit it has there, the
   plain form in the middle, and x²e^(−x) above 60 where eˣ overflows. */
function slPhononW(x){
  if(!(x > 0)) return 1;                         // the x → 0 limit, exactly
  if(x < 1e-3) return 1 - x * x / 12 + x * x * x * x / 240;
  if(x > 60)   return x * x * Math.exp(-x);
  const e = Math.exp(x), d = e - 1;
  return x * x * e / (d * d);
}
/* ∫D dw over the whole spectrum — the 3N modes, whatever shape they are in */
function slPhononNorm(D, wmax, panels){
  return nqGauss(w => { const v = D(w); return (Number.isFinite(v) && v > 0) ? v : 0; },
                 0, wmax, 5, panels || 1200);
}
/* C(T) = 3R·∫D(w)·W(w/T) dw / ∫D dw.

   The upper limit is cut at 46T rather than at wmax: W(x) is x²e^(−x) out there,
   so at x = 46 it is 6 × 10⁻¹⁸ and the modes above contribute nothing — while
   integrating to wmax anyway would spend every sample point on them and leave
   the part that matters resolved by two. That is the difference between a
   measured exponent of 3.00 and one of 2.4. */
function slPhononC(D, wmax, T, norm, panels){
  if(!(T > 0)) return 0;
  const N = (norm === undefined || norm === null) ? slPhononNorm(D, wmax) : norm;
  if(!(N > 0)) return NaN;
  const hi = Math.min(wmax, 46 * T);
  const I = nqGauss(w => { const v = D(w); return ((Number.isFinite(v) && v > 0) ? v : 0) * slPhononW(w / T); },
                    0, hi, 5, panels || 400);
  return 3 * SL_R * I / N;
}

/* ----------------------------------------------------------------------------
   THE LOW-TEMPERATURE EXPONENT, MEASURED

   log₁₀C against log₁₀T over a decade, least squares. The slope is the exponent.

   The slope on its own is not enough and saying so is the point of the stage: a
   straight line can be fitted to anything, and an Einstein solid — whose heat
   capacity dies exponentially and has no exponent at all — will happily produce
   one. Three more numbers come back with it:

     · the worst residual of the fit, in decades;
     · r², for what it is worth;
     · the BEND, the local slope at the top of the range minus the local slope at
       the bottom. A power law has the same slope everywhere and gives zero; an
       exponential's log-log slope grows without limit and gives a large one.

   The range is set from the spectrum's own bottom end rather than fixed, because
   "low temperature" means low compared with the modes there are.
   ---------------------------------------------------------------------------- */
function slPhononLowT(D, wmax, lo, hi, n){
  const N = slPhononNorm(D, wmax);
  const Tlo = lo || wmax / 2000, Thi = hi || wmax / 200;
  const K = Math.max(6, Math.round(n || 24));
  const xs = [], ys = [], pts = [];
  for(let i = 0; i < K; i++){
    const T = Tlo * Math.pow(Thi / Tlo, i / (K - 1));
    const C = slPhononC(D, wmax, T, N);
    if(!(C > 0) || !Number.isFinite(C)) continue;
    xs.push(Math.log10(T)); ys.push(Math.log10(C)); pts.push({ T, C });
  }
  if(xs.length < 4)
    return { ok:false, Tlo, Thi, pts,
             why:'the heat capacity underflows to zero across this range, so there is no logarithm to fit — a spectrum with no low-frequency modes has no power law, which is itself the answer' };
  const F = pbRegress(xs, ys);
  const resid = xs.map((x, i) => ys[i] - F.predict(x));
  const worst = resid.reduce((a, r) => Math.max(a, Math.abs(r)), 0);
  const k = xs.length;
  const sLo = (ys[1] - ys[0]) / (xs[1] - xs[0]);
  const sHi = (ys[k - 1] - ys[k - 2]) / (xs[k - 1] - xs[k - 2]);
  return { ok:true, Tlo, Thi, pts, n:k, slope:F.slope, inter:F.inter, r2:F.r2,
           worst, resid, sLo, sHi, bend:sHi - sLo,
           /* a power law to within a percent of a decade, and with no bend */
           power:worst < 0.01 && Math.abs(sHi - sLo) < 0.05 };
}

/* ----------------------------------------------------------------------------
   THE HIGH-TEMPERATURE END, WHERE EVERY SPECTRUM AGREES

   C → 3R for any D, which is Dulong–Petit and is true here by construction of
   the normalisation, so it tests nothing. What does not follow from the
   normalisation is how fast: expanding W(x) = 1 − x²/12 + … gives

       C ≈ 3R[1 − ⟨w²⟩/12T²],

   so (3R − C)T² tends to 3R⟨w²⟩/12. The second moment is computed directly from
   the spectrum, and the same number is read off the measured C(T) at two
   temperatures — two routes with only the spectrum in common.
   ---------------------------------------------------------------------------- */
function slPhononHighT(D, wmax){
  const N = slPhononNorm(D, wmax);
  const m2 = nqGauss(w => { const v = D(w); return ((Number.isFinite(v) && v > 0) ? v : 0) * w * w; },
                     0, wmax, 5, 1200) / N;
  const pred = 3 * SL_R * m2 / 12;
  const rms = Math.sqrt(Math.max(0, m2));
  const at = [10, 20].map(f => {
    const T = f * rms;
    const C = slPhononC(D, wmax, T, N, 600);
    return { T, C, coef:(3 * SL_R - C) * T * T };
  });
  const meas = at[1].coef;                       // the hotter one is the cleaner
  return { m2, rms, pred, at, meas,
           rel:pred !== 0 ? Math.abs(meas - pred) / Math.abs(pred) : Infinity,
           dulong:3 * SL_R, hot:slPhononC(D, wmax, 60 * rms, N, 600) };
}

/* ----------------------------------------------------------------------------
   THE ANCHORS

   A Debye spectrum typed as w² must reproduce `slDebyeC`, and a narrow spike
   must reproduce `slEinsteinC`. Neither of those was used to build anything
   above.

   There is a third, and it is the strongest, because it is a closed form rather
   than another integrator: as T → 0 the Debye integral runs to infinity and
   ∫₀^∞ x⁴eˣ/(eˣ−1)² dx = 4π⁴/15 exactly, so

       C → (12π⁴/5)·R·(T/θ_D)³.

   That is the T³ law with its coefficient, and it is what the measured exponent
   is measured against.
   ---------------------------------------------------------------------------- */
const slDebyeLowC = (T, TD) => 12 * Math.pow(Math.PI, 4) / 5 * SL_R * Math.pow(T / TD, 3);

function slPhononDebyeCheck(TD, T){
  const D = w => w * w;
  const mine = slPhononC(D, TD, T);
  const closed = slDebyeC(T, TD);
  return { mine, closed, rel:closed !== 0 ? Math.abs(mine - closed) / closed : Infinity,
           lowT:slDebyeLowC(T, TD) };
}
function slPhononEinsteinCheck(TE, T, width){
  const s = width || TE / 400;
  const D = w => Math.exp(-Math.pow((w - TE) / s, 2));
  const mine = slPhononC(D, TE * 2, T, null, 900);
  const closed = slEinsteinC(T, TE);
  return { mine, closed, rel:closed !== 0 ? Math.abs(mine - closed) / closed : Infinity };
}
