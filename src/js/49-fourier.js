/* Fourier coefficients of an arbitrary one-period function, by quadrature.
   The closed forms below cover the three classic waveforms; this covers anything
   the reader draws, for which no closed form exists. Both a and b are returned
   because a hand-drawn curve has no reason to be odd. */
function ftNumCoef(f, k, n){
  const N = n || 720;
  let a = 0, b = 0;
  for(let i = 0; i < N; i++){
    const t = (i + 0.5) / N, v = f(t);
    if(!Number.isFinite(v)) continue;
    a += v * Math.cos(2 * Math.PI * k * t);
    b += v * Math.sin(2 * Math.PI * k * t);
  }
  /* 2/N at every k, k = 0 included. The classical convention writes the series
     with a₀/2 as its constant term, and ftNumPartial and the readout both do —
     so a₀ has to carry twice the mean or the constant term comes out halved.
     Scaling k = 0 by 1/N instead made every signal reconstruct with half of its
     DC offset. It went unseen because the three analytic waveforms and the
     square wave the sketch pad starts from all have mean zero, so the only term
     the error touches was zero in every case anyone had looked at. */
  const s = 2 / N;
  return { a:a * s, b:b * s };
}
/* the partial sum built from those coefficients */
function ftNumPartial(coefs, K, t){
  let s = coefs[0].a / 2;
  for(let k = 1; k <= K && k < coefs.length; k++)
    s += coefs[k].a * Math.cos(2 * Math.PI * k * t) + coefs[k].b * Math.sin(2 * Math.PI * k * t);
  return s;
}

/* ============================================================================
   3h · FOURIER ENGINE
   The claim the whole wing rests on: any reasonable function can be written as
   a sum of sines and cosines, and the recipe for finding how much of each is
   itself an integral against a sine.

     continuous   X(f) = ∫ x(t) e^(−2πift) dt        x(t) = ∫ X(f) e^(+2πift) df
     discrete     X[k] = Σ x[n] e^(−2πikn/N)         x[n] = (1/N) Σ X[k] e^(+2πikn/N)

   Both directions are the same operation with the sign of the exponent flipped,
   which is why one routine here serves for the transform and its inverse.

   Why it works at all is orthogonality: over a whole number of periods,

     ∫ sin(2πmt) sin(2πnt) dt = 0 unless m = n

   so multiplying by e^(−2πift) and averaging silently deletes every frequency
   except f, leaving exactly how much of f was present. The transform is not a
   trick — it is a projection onto an orthogonal basis, the same idea as taking
   a dot product with a basis vector.
   ============================================================================ */

/* ---- the transform, both directions, both algorithms ---------------------- */

/* The definition, evaluated literally: N² operations. Slow, and here precisely
   so the FFT can be checked against it and timed against it. */
function ftDFT(re, im, inverse){
  const n = re.length;
  const R = new Float64Array(n), I = new Float64Array(n);
  const sgn = inverse ? 1 : -1;
  for(let k = 0; k < n; k++){
    let sr = 0, si = 0;
    for(let t = 0; t < n; t++){
      const a = sgn * 2 * Math.PI * k * t / n;
      const c = Math.cos(a), s = Math.sin(a);
      const xr = re[t], xi = im ? im[t] : 0;
      sr += xr * c - xi * s;
      si += xr * s + xi * c;
    }
    R[k] = inverse ? sr / n : sr;
    I[k] = inverse ? si / n : si;
  }
  return { re:R, im:I };
}

/* Cooley–Tukey, in place. The saving is one observation: a transform of length
   N splits into two of length N/2 (the even and odd samples), because
   e^(−2πik(2m)/N) = e^(−2πikm/(N/2)). Recurse and N² becomes N log₂N. */
function ftFFT(re, im, inverse){
  const n = re.length;
  if(n < 1 || (n & (n - 1))) throw new MathError('the FFT needs a power-of-two length, got ' + n);
  for(let i = 1, j = 0; i < n; i++){
    let bit = n >> 1;
    for(; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if(i < j){ let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  const sgn = inverse ? 1 : -1;
  for(let len = 2; len <= n; len <<= 1){
    const ang = sgn * 2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for(let i = 0; i < n; i += len){
      let cr = 1, ci = 0;
      for(let k = 0; k < len / 2; k++){
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr;             im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr;   im[i + k + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  if(inverse) for(let i = 0; i < n; i++){ re[i] /= n; im[i] /= n; }
  return { re, im };
}
/* how many operations each costs — the entire argument for the FFT */
const ftDFTCost = N => N * N;
const ftFFTCost = N => (N * Math.log2(N)) / 2;

/* the one-sided amplitude spectrum, scaled so a sine of amplitude A reads A */
function ftAmplitude(re, im){
  const n = re.length, half = (n >> 1) + 1;
  const out = new Float64Array(half);
  for(let k = 0; k < half; k++){
    const m = Math.hypot(re[k], im[k]) / n;
    out[k] = (k === 0 || (n % 2 === 0 && k === n / 2)) ? m : 2 * m;
  }
  return out;
}
/* ---- Fourier series: the periodic case, done in closed form --------------- */
/* Coefficients of the standard waveforms, unit amplitude and unit period, as
   the sine terms b_k of  x(t) = Σ b_k sin(2πkt). All are odd functions, so
   every a_k is zero — a symmetry that halves the work before any integration. */
function ftSeriesTerm(kind, k){
  if(k < 1) return 0;
  switch(kind){
    case 'square':   return (k % 2) ? 4 / (k * Math.PI) : 0;
    case 'saw':      return 2 * Math.pow(-1, k + 1) / (k * Math.PI);
    case 'triangle': return (k % 2) ? 8 * Math.pow(-1, (k - 1) / 2) / (k * k * Math.PI * Math.PI) : 0;
    default:         return k === 1 ? 1 : 0;                 /* a pure sine */
  }
}
/* the partial sum through K harmonics — what "adding up sines" actually gives */
function ftPartial(kind, K, t){
  let s = 0;
  for(let k = 1; k <= K; k++){
    const b = ftSeriesTerm(kind, k);
    if(b) s += b * Math.sin(2 * Math.PI * k * t);
  }
  return s;
}
/* the waveform being approximated */
function ftExact(kind, t){
  const u = ((t % 1) + 1) % 1;
  switch(kind){
    case 'square':   return u < 0.5 ? 1 : -1;
    case 'saw':      return u < 0.5 ? 2 * u : 2 * u - 2;
    case 'triangle': return u < 0.25 ? 4 * u : (u < 0.75 ? 2 - 4 * u : 4 * u - 4);
    default:         return Math.sin(2 * Math.PI * t);
  }
}
/* Gibbs: near a jump the partial sum overshoots, and no number of terms
   reduces the overshoot — it only squeezes it closer to the jump. For a
   waveform stepping from −1 to +1 the partial sums peak at

     (2/π)·Si(π) = 1.178979744…

   which is 8.95% of the total jump of 2 — the figure usually quoted. The peak
   sits at roughly t ≈ 1/2K of a period from the discontinuity, so it moves
   towards the jump as terms are added but never gets any shorter. */
const FT_GIBBS = 1.1789797444721675;
const FT_GIBBS_FRAC = (FT_GIBBS - 1) / 2;          /* 0.0895 of the jump */

/* ---- transform pairs with closed forms, for checking the numerics --------- */
const ftSinc = x => (Math.abs(x) < 1e-12 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
/* x(t) = exp(−a t²)  ⟷  X(f) = √(π/a)·exp(−π²f²/a) */
const ftGauss     = (a, t) => Math.exp(-a * t * t);
const ftGaussHat  = (a, f) => Math.sqrt(Math.PI / a) * Math.exp(-Math.PI * Math.PI * f * f / a);
/* a rectangle of width T  ⟷  T·sinc(fT) */
const ftRect      = (T, t) => (Math.abs(t) <= T / 2 ? 1 : 0);
const ftRectHat   = (T, f) => T * ftSinc(f * T);
/* a two-sided decaying exponential ⟷ a Lorentzian */
const ftExpo      = (a, t) => Math.exp(-a * Math.abs(t));
const ftExpoHat   = (a, f) => 2 * a / (a * a + 4 * Math.PI * Math.PI * f * f);

/* ---- the transform of a signal nobody has a closed form for -----------------
   Every pair above exists because someone solved the integral. A signal the
   reader types has no closed form, so the integral is done:

       X(f) = ∫ x(t) e^(−2πift) dt,  over a finite window [−T, T].

   The trapezoid rule, which looks like an odd choice for an oscillatory
   integrand until you notice what it is doing. Euler–Maclaurin says the
   trapezoid rule's error is a series in the *derivatives at the endpoints*; for
   a signal that has decayed to nothing by ±T those all vanish, and the rule
   stops being second-order and becomes spectrally accurate. That is the same
   fact that makes the FFT exact for band-limited periodic data, and it is why
   a smooth decaying pulse needs no cleverer quadrature.

   The catch is the window itself, and it is the whole reason this function
   returns a diagnostic as well as an answer. Cutting a signal off at ±T
   multiplies it by a rectangle, and multiplying in time is convolving in
   frequency — so what comes back is the true transform smeared by a sinc whose
   tails fall only as 1/f. If the signal has genuinely died away by the window's
   edge that convolution does nothing; if it has not, a good part of what is
   plotted is the window's spectrum rather than the signal's. `ftTruncation`
   measures which case you are in, so the panel can say so instead of presenting
   leakage as mathematics. */
function ftHatNum(x, f, T, N){
  N = N || 4096;
  const h = 2 * T / N;
  let re = 0, im = 0;
  for(let i = 0; i <= N; i++){
    const t = -T + i * h;
    const v = x(t);
    if(!Number.isFinite(v)) continue;
    const w = (i === 0 || i === N) ? 0.5 : 1;    // trapezoid end weights
    const a = -2 * Math.PI * f * t;
    re += w * v * Math.cos(a);
    im += w * v * Math.sin(a);
  }
  return { re:re * h, im:im * h };
}
/* How much of the signal is being cut off by the window. The edge value against
   the peak is the honest measure: it is the height of the step the rectangle
   introduces, and the size of the sinc tails that step produces. */
function ftTruncation(x, T, N){
  N = N || 1024;
  const h = 2 * T / N;
  let peak = 0;
  for(let i = 0; i <= N; i++){
    const v = Math.abs(x(-T + i * h));
    if(Number.isFinite(v)) peak = Math.max(peak, v);
  }
  const e0 = Math.abs(x(-T)), e1 = Math.abs(x(T));
  const edge = Math.max(Number.isFinite(e0) ? e0 : 0, Number.isFinite(e1) ? e1 : 0);
  return { peak, edge, ratio:peak > 0 ? edge / peak : 0 };
}
/* Parseval, as a check rather than a claim: the energy computed in time and the
   energy computed in frequency are two independent numbers that must agree. */
function ftParsevalNum(x, T, fmax, N, M){
  N = N || 4096; M = M || 2048;
  const h = 2 * T / N;
  let et = 0;
  for(let i = 0; i <= N; i++){
    const v = x(-T + i * h);
    if(Number.isFinite(v)) et += ((i === 0 || i === N) ? 0.5 : 1) * v * v;
  }
  et *= h;
  const df = 2 * fmax / M;
  let ef = 0;
  for(let i = 0; i <= M; i++){
    const H = ftHatNum(x, -fmax + i * df, T, N);
    ef += ((i === 0 || i === M) ? 0.5 : 1) * (H.re * H.re + H.im * H.im);
  }
  ef *= df;
  return { time:et, freq:ef, gap:Math.abs(et - ef) };
}

/* ---- the winding picture: what the integral is actually doing -------------- */
/* Multiplying x(t) by e^(−2πift) wraps the graph around a circle at f turns per
   second. Where f matches a frequency present in x, the humps line up and the
   wrapped shape has an off-centre mass; everywhere else it is balanced and the
   centre of mass sits at the origin. The transform IS that centre of mass. */
function ftWind(sig, dt, f){
  let sr = 0, si = 0;
  for(let i = 0; i < sig.length; i++){
    const a = -2 * Math.PI * f * i * dt;
    sr += sig[i] * Math.cos(a);
    si += sig[i] * Math.sin(a);
  }
  const n = sig.length || 1;
  return { re: sr * dt, im: si * dt, cx: sr / n, cy: si / n, mag: Math.hypot(sr, si) / n };
}
/* the wound curve itself, for drawing */
function ftWindPath(sig, dt, f){
  const out = new Array(sig.length);
  for(let i = 0; i < sig.length; i++){
    const a = -2 * Math.PI * f * i * dt;
    out[i] = { x: sig[i] * Math.cos(a), y: sig[i] * Math.sin(a) };
  }
  return out;
}

/* ---- windows: the price of looking at a finite piece of a signal ---------- */
function ftWindowFn(kind, i, N){
  const u = 2 * Math.PI * i / (N - 1);
  switch(kind){
    case 'hann':     return 0.5 * (1 - Math.cos(u));
    case 'hamming':  return 0.54 - 0.46 * Math.cos(u);
    case 'blackman': return 0.42 - 0.5 * Math.cos(u) + 0.08 * Math.cos(2 * u);
    default:         return 1;
  }
}
const FT_WINDOWS = ['rect', 'hann', 'hamming', 'blackman'];
/* coherent gain — how much a window scales a sinusoid that fills it */
function ftWindowGain(kind, N){
  let s = 0;
  for(let i = 0; i < N; i++) s += ftWindowFn(kind, i, N);
  return s / N;
}

/* ---- convolution, and the theorem that makes filtering easy --------------- */
function ftConvolve(a, b){
  const out = new Float64Array(a.length + b.length - 1);
  for(let i = 0; i < a.length; i++)
    for(let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return out;
}
/* the same thing done the fast way: transform, multiply pointwise, come back.
   That this agrees with the direct sum is the convolution theorem. */
function ftConvolveFFT(a, b){
  const n = a.length;
  const ar = Float64Array.from(a), ai = new Float64Array(n);
  const br = Float64Array.from(b), bi = new Float64Array(n);
  ftFFT(ar, ai); ftFFT(br, bi);
  const cr = new Float64Array(n), ci = new Float64Array(n);
  for(let k = 0; k < n; k++){
    cr[k] = ar[k] * br[k] - ai[k] * bi[k];
    ci[k] = ar[k] * bi[k] + ai[k] * br[k];
  }
  ftFFT(cr, ci, true);
  return cr;
}

/* ---- sampling: where the discrete and the continuous part company --------- */
/* A sampled signal cannot tell f from f + k·f_s. Everything above the Nyquist
   frequency f_s/2 is folded back down onto something below it. */
function ftAlias(f, fs){
  const r = ((f % fs) + fs) % fs;
  return r <= fs / 2 ? r : fs - r;
}
/* ---- what a sample rate can and cannot carry, for a signal nobody chose ------
   `ftAlias` answers the question for a single tone by arithmetic, because for a
   single tone the answer is arithmetic. A signal the reader types is a spectrum
   rather than a line, so the same question has to be asked of all of it: sample
   far faster than the rate under test, transform, and add up the energy sitting
   above that rate's Nyquist frequency.

   That energy is not lost when the signal is sampled slowly. It is *moved* —
   folded down onto frequencies below Nyquist, where it is indistinguishable from
   content that was genuinely there. So the fraction returned measures the damage
   and, folded, says where the damage will turn up. */
function ftAliasEnergy(x, fs, N, over){
  over = over || 16;
  const M = N * over;
  const re = new Float64Array(M), im = new Float64Array(M);
  for(let i = 0; i < M; i++){
    const v = x(i / (fs * over));
    re[i] = Number.isFinite(v) ? v : 0;
  }
  ftFFT(re, im);
  let total = 0, above = 0;
  for(let k = 0; k <= M / 2; k++){
    const f = k * fs / N;
    const p = re[k] * re[k] + im[k] * im[k];
    total += p;
    if(f > fs / 2 + 1e-12) above += p;
  }
  return { total, above, frac:total > 0 ? above / total : 0 };
}
/* Whittaker–Shannon: the unique band-limited signal passing through a set of
   samples, which is what "reconstruction" means and what a DAC approximates.
   Below Nyquist it lands on the original; above it, it lands on the alias — so
   the same formula produces both the good news and the bad, and the picture does
   not have to be told which case it is in.

   The theorem is about an infinite record. Over a finite one the sum is
   truncated, and sinc decays only as 1/t, so what comes back is right in the
   middle of the record and increasingly wrong towards its ends — an error that
   shrinks as the record lengthens rather than one that can be tuned away. The
   stages that draw it compare against the original away from the ends, and the
   unit tests measure the shrinkage rather than asserting a tolerance. */
function ftSincRecon(sig, fs, t){
  let s = 0;
  const u = t * fs;
  for(let n = 0; n < sig.length; n++) s += sig[n] * ftSinc(u - n);
  return s;
}

/* Parseval: the energy is the same counted either way. A basis change cannot
   create or destroy it, and checking that is a good test of a transform. */
function ftEnergyTime(re, im){
  let s = 0;
  for(let i = 0; i < re.length; i++) s += re[i] * re[i] + (im ? im[i] * im[i] : 0);
  return s;
}
function ftEnergyFreq(re, im){
  let s = 0;
  for(let i = 0; i < re.length; i++) s += re[i] * re[i] + im[i] * im[i];
  return s / re.length;
}
/* the uncertainty product: a signal and its transform cannot both be narrow */
function ftSpread(vals, step, centre){
  let m = 0, s = 0;
  for(let i = 0; i < vals.length; i++) m += vals[i] * vals[i];
  if(m < 1e-300) return 0;
  for(let i = 0; i < vals.length; i++){
    const x = (i - (centre === undefined ? 0 : centre)) * step;
    s += x * x * vals[i] * vals[i];
  }
  return Math.sqrt(s / m);
}
