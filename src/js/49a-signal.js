/* ============================================================================
   4b · SIGNAL PROCESSING
   Programme C wing C15.  The Fourier wing ends where this one begins: it shows
   that a signal and its spectrum are one object, and mentions sampling,
   aliasing and windows in a single demo. Everything a person actually does to
   a recorded signal is downstream of that demo, and none of it was here.

   Prefix: dsp.  Nothing in this file re-implements a transform — `ftFFT`,
   `ftAmplitude`, `ftSincRecon`, `ftAlias`, `ftConvolve` and `ftAliasEnergy`
   (49-fourier.js) already exist and are tested. What is added is the four
   things that sit on top of them, each computed TWICE by routes that share
   nothing:

     sampling   the alias by arithmetic          vs the peak of the spectrum of
                                                    the samples actually taken
     windows    the window's transform by FFT    vs a closed-form sum of
                                                    Dirichlet kernels
                its ENBW by summing w and w²     vs a closed form in the
                                                    cosine coefficients
     the STFT   the ridge of a chirp             vs the instantaneous frequency
                                                    it was built from

   FILTERS ARE IN `49b-signal-filter.js`, which loads immediately after this.
   This file is about what a window and a sample rate DO to a signal; that one
   is about changing one.

   THE CONVENTION, stated once because it is the commonest source of a wrong
   number in this subject: frequencies are in CYCLES PER SAMPLE unless the name
   says Hz. A rate f_s carries [0, f_s/2); dividing by f_s puts that at [0, 0.5).
   ============================================================================ */

/* ---- windows, as cosine sums ----------------------------------------------
   Every window here is  w[n] = Σ_k (−1)^k a_k cos(2πkn/N), n = 0 … N−1.
   That is the PERIODIC (DFT-even) sampling, which is the right one for spectral
   analysis: the DFT assumes the record repeats, and a periodic window is the
   one whose repetition has no seam. `ftWindowFn` in 49-fourier.js samples the
   SAME functions symmetrically, at 2πn/(N−1), which is the right one for filter
   design — where the taps must be symmetric about their centre or the phase
   stops being linear. The two differ by one sample and therefore by O(1/N);
   tests.js pins that they are the same function by checking
   dspWindow(kind, n, N) === ftWindowFn(kind, n, N+1) exactly.

   The coefficients are the standard ones. Blackman is the unqualified 0.42
   form, not the "exact" 0.42659 one, because that is what `ftWindowFn` uses and
   two windows of the same name in one program is a defect waiting to happen. */
const DSP_WIN = {
  rect:     { name:'rectangular (no window at all)', short:'rect',     a:[1] },
  bartlett: { name:'Bartlett — a triangle',          short:'triangle', a:null },
  hann:     { name:'Hann',                           short:'Hann',     a:[0.5, 0.5] },
  hamming:  { name:'Hamming',                        short:'Hamming',  a:[0.54, 0.46] },
  blackman: { name:'Blackman',                       short:'Blackman', a:[0.42, 0.5, 0.08] },
  bharris:  { name:'Blackman–Harris, four terms',    short:'B–Harris',
              a:[0.35875, 0.48829, 0.14128, 0.01168] },
  flattop:  { name:'flat top — built to measure amplitude, not frequency', short:'flat top',
              a:[0.21557895, 0.41663158, 0.277263158, 0.083578947, 0.006947368] }
};
const DSP_WIN_KEYS = ['rect', 'bartlett', 'hann', 'hamming', 'blackman', 'bharris', 'flattop'];

/* the window itself. Bartlett is not a cosine sum, so it is the one special
   case, and it is here because a triangle is what a reader guesses first. */
function dspWindow(kind, n, N){
  if(kind === 'bartlett'){
    const h = N / 2;
    return 1 - Math.abs((n - h) / h);
  }
  const a = (DSP_WIN[kind] || DSP_WIN.rect).a;
  let s = 0;
  for(let k = 0; k < a.length; k++) s += (k % 2 ? -1 : 1) * a[k] * Math.cos(2 * Math.PI * k * n / N);
  return s;
}
/* The SYMMETRIC sampling of the same function, for a window of M taps: put
   M − 1 where the period goes and the last tap lands back on the first value,
   so the taps are a palindrome. Filter design needs this and spectral analysis
   does not — a symmetric window has a seam when the record is repeated, which
   is exactly what the periodic one exists to avoid, and symmetric taps are what
   makes a filter's phase linear. One definition, two samplings. */
const dspWindowSym = (kind, n, M) => dspWindow(kind, n, M - 1);
function dspWinArray(kind, N){
  const w = new Float64Array(N);
  for(let n = 0; n < N; n++) w[n] = dspWindow(kind, n, N);
  return w;
}

/* ---- what a window costs and buys, by two routes --------------------------
   COHERENT GAIN is how much a window shrinks a sinusoid that fills it: the
   mean of w. For a cosine sum every term but the first sums to zero over a
   whole number of periods, so the mean is EXACTLY a₀ — an identity rather than
   a coincidence, and one a wrong coefficient cannot survive.

   EQUIVALENT NOISE BANDWIDTH is how many bins' worth of broadband noise the
   window lets into one bin: N·Σw²/(Σw)². For a cosine sum,
      Σw = a₀N,   Σw² = N(a₀² + ½Σ_{k≥1}a_k²)
   so ENBW = 1 + Σ_{k≥1}a_k² / 2a₀², again exactly. Hann gives 3/2, and the
   flat-top window gives 3.77 — which is what "flat top" costs.

   Both closed forms are derived in the essay. Here they are the SECOND route,
   and `dspWinMetrics` prints the difference from the summed one. */
function dspWinCGExact(kind){
  if(kind === 'bartlett') return null;                    // not a cosine sum
  return (DSP_WIN[kind] || DSP_WIN.rect).a[0];
}
function dspWinENBWExact(kind){
  if(kind === 'bartlett') return null;
  const a = (DSP_WIN[kind] || DSP_WIN.rect).a;
  let s = 0;
  for(let k = 1; k < a.length; k++) s += a[k] * a[k];
  return 1 + s / (2 * a[0] * a[0]);
}
function dspWinSums(kind, N){
  let s1 = 0, s2 = 0;
  for(let n = 0; n < N; n++){ const w = dspWindow(kind, n, N); s1 += w; s2 += w * w; }
  return { s1, s2, cg:s1 / N, enbw:N * s2 / (s1 * s1) };
}

/* ---- the window's own transform, in closed form ---------------------------
   The Dirichlet kernel is what the DFT of a rectangle IS:
      D(δ) = Σ_{n<N} e^(−2πiδn/N) = e^(−iπδ(N−1)/N) · sin(πδ)/sin(πδ/N)
   and because a cosine sum is a sum of shifted rectangles in frequency,
      W(δ) = Σ_k (−1)^k (a_k/2)·[D(δ−k) + D(δ+k)]
   with δ measured in BINS. This is the analytic leakage pattern: the thing a
   window is chosen for. Route 1 for the same quantity is an FFT of the actual
   samples, zero-padded — see `dspWinSpecFFT`. */
function dspDirichlet(delta, N){
  const s = Math.sin(Math.PI * delta / N);
  const mag = Math.abs(s) < 1e-13
    ? (Math.abs(delta % (2 * N)) < 1e-9 ? N : -N)          /* δ = 0 mod 2N gives +N, mod N gives −N */
    : Math.sin(Math.PI * delta) / s;
  const ph = -Math.PI * delta * (N - 1) / N;
  return { re:mag * Math.cos(ph), im:mag * Math.sin(ph) };
}
function dspWinSpecExact(kind, delta, N){
  if(kind === 'bartlett') return null;
  const a = (DSP_WIN[kind] || DSP_WIN.rect).a;
  let re = 0, im = 0;
  for(let k = 0; k < a.length; k++){
    const c = (k % 2 ? -1 : 1) * a[k] / 2;
    const p = dspDirichlet(delta - k, N), m = dspDirichlet(delta + k, N);
    re += c * (p.re + m.re); im += c * (p.im + m.im);
  }
  return { re, im, mag:Math.hypot(re, im) };
}
/* the same thing by transforming the samples, padded `pad` times so the shape
   BETWEEN the bins is visible — a window's sidelobes live entirely between the
   bins of its own length, which is why an unpadded transform of a window shows
   nothing but a single spike and no leakage at all */
const DSP_SPEC_CACHE = new Map();
function dspWinSpecFFT(kind, N, pad){
  const P = pad || 16, M = N * P;
  const key = kind + '|' + N + '|' + P;
  const hit = DSP_SPEC_CACHE.get(key);
  if(hit) return hit;
  const re = new Float64Array(M), im = new Float64Array(M);
  for(let n = 0; n < N; n++) re[n] = dspWindow(kind, n, N);
  ftFFT(re, im);
  const mag = new Float64Array(M / 2 + 1);
  for(let k = 0; k <= M / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
  const out = { mag, pad:P, N, bin:k => k / P };          /* index k is bin k/P */
  if(DSP_SPEC_CACHE.size > 24) DSP_SPEC_CACHE.clear();
  DSP_SPEC_CACHE.set(key, out);
  return out;
}
const dspDb = (v, ref) => 20 * Math.log10(Math.max(1e-300, v) / Math.max(1e-300, ref));

/* every number a window is chosen by, measured from the padded transform.
   The main lobe is found by walking out from δ = 0 to the first local minimum;
   the highest sidelobe is the largest peak beyond it. Both are read off the
   curve rather than looked up, so a coefficient typo shows up here. */
function dspWinMetrics(kind, N, pad){
  const S = dspWinSpecFFT(kind, N, pad || 32), m = S.mag, P = S.pad;
  /* the peak is the largest value, not the value at δ = 0. For every window
     here they are the same to a part in 10⁴ — except the flat top, whose whole
     purpose is a main lobe that is FLAT across the middle bin, so its maximum
     wanders off zero by a ripple of about a thousandth. Reading m[0] as the
     peak is harmless there and fatal two lines below, where "walk out until the
     curve stops falling" then stops at the first ripple and reports a first
     null of 1/32 of a bin. */
  let peak = 0;
  for(let k = 0; k < m.length; k++) peak = Math.max(peak, m[k]);
  /* The first null is a genuine ZERO — a cosine sum of K terms has exact zeros
     at every integer bin from K on — so it is found by looking for one, not by
     looking for the first place the curve stops descending. A ripple in a flat
     main lobe is a local minimum and is not a null. */
  let i = 1;
  while(i < m.length - 1 && !(m[i] < m[i - 1] && m[i] <= m[i + 1] && m[i] < peak * 1e-6)) i++;
  const firstNull = i / P;
  /* the −3 dB half-width, by scanning the main lobe */
  let j = 0;
  while(j < i && m[j] > peak * Math.SQRT1_2) j++;
  const half = j / P;
  /* the highest sidelobe beyond the first null */
  let side = 0;
  for(let k = i; k < m.length; k++) side = Math.max(side, m[k]);
  /* scalloping loss: a tone exactly between two bins loses this much. Read
     against m[0] rather than the peak, because the loss is relative to a tone
     sitting ON a bin and that is what m[0] is. */
  const scallop = m[Math.round(P / 2)] / m[0];
  const sums = dspWinSums(kind, N);
  return {
    cg:sums.cg, cgExact:dspWinCGExact(kind),
    enbw:sums.enbw, enbwExact:dspWinENBWExact(kind),
    width3:2 * half, firstNull, sidelobeDb:dspDb(side, peak),
    scallop, scallopDb:dspDb(scallop, 1), peak
  };
}

/* ---- sampling -------------------------------------------------------------
   `ftAlias` gives the folded frequency by arithmetic. This gives it by looking:
   transform the samples that were actually taken and find the largest bin, then
   refine it by fitting a parabola to the three magnitudes around the peak —
   which is the standard sub-bin estimator and is accurate to a small fraction
   of a bin. The two routes share nothing at all: one is a modulo, the other is
   a spectrum. */
/* The peak, refined between the bins. Fitting the parabola to the LOGARITHM of
   the magnitude rather than to the magnitude is not a detail: near its top a
   windowed peak is very nearly Gaussian, and the log of a Gaussian is exactly a
   parabola — so the fit is asymptotically unbiased on the log and carries a
   systematic bias of a few hundredths of a bin on the linear magnitude. That
   bias would show up here as a permanent disagreement between the two routes
   and be mistaken for one of them being wrong. */
function dspPeakBin(mag){
  let k = 1;
  for(let i = 1; i < mag.length - 1; i++) if(mag[i] > mag[k]) k = i;
  const L = v => Math.log(Math.max(1e-300, v));
  const a = L(mag[k - 1]), b = L(mag[k]), c = L(mag[k + 1]);
  const den = a - 2 * b + c;
  const d = Math.abs(den) < 1e-300 ? 0 : 0.5 * (a - c) / den;
  return k + Math.max(-0.5, Math.min(0.5, d));
}
/* A PEAK IN A RECORD WITH NO ENERGY IS NOT A MEASUREMENT, and this returns null
   rather than one. An AM carrier sampled at exactly twice its frequency lands on
   the same phase every time and — with these sidebands, exactly — every sample
   is zero; the parabola then fits three logarithms of 10⁻³⁰⁰ and reports a
   confident 11.95 Hz. Same class as the ratio-of-two-small-numbers rule in §2.1:
   the panel must say which case it is in rather than print a number. */
function dspPeakFreq(sig, fs, kind, pad){
  const N = sig.length, P = pad || 4;
  let rms = 0;
  for(let n = 0; n < N; n++) rms += sig[n] * sig[n];
  if(!(Math.sqrt(rms / Math.max(1, N)) > 1e-12)) return null;
  /* pad to the next power of two AT LEAST P times the record, rather than to
     exactly P·N: the record length is a reader's control and need not be a
     power of two, and ftFFT throws rather than degrading on one that is not */
  let M = 1;
  while(M < N * P) M *= 2;
  const re = new Float64Array(M), im = new Float64Array(M);
  for(let n = 0; n < N; n++) re[n] = sig[n] * dspWindow(kind || 'hann', n, N);
  ftFFT(re, im);
  const mag = new Float64Array(M / 2 + 1);
  for(let k = 0; k <= M / 2; k++) mag[k] = Math.hypot(re[k], im[k]);
  return dspPeakBin(mag) * fs / M;
}
function dspSamples(x, fs, N, t0){
  const s = new Float64Array(N);
  for(let n = 0; n < N; n++){
    const v = x((t0 || 0) + n / fs);
    s[n] = Number.isFinite(v) ? v : 0;
  }
  return s;
}
/* how far the Whittaker–Shannon reconstruction strays from the signal it came
   from, over the middle of the record — the ends are where the truncated sinc
   sum is untrustworthy, and including them measures the truncation instead of
   the sampling. Returns the worst gap AND the signal's own peak, because a gap
   without its scale is not a measurement. */
function dspReconErr(x, fs, N, frac, samples){
  const sig = samples || dspSamples(x, fs, N);
  const f = frac === undefined ? 0.25 : frac;
  const M = 600, t0 = f * N / fs, t1 = (1 - f) * N / fs;
  let worst = 0, gross = 1e-300;
  for(let i = 0; i < M; i++){
    const t = t0 + (t1 - t0) * i / (M - 1);
    const v = x(t), r = ftSincRecon(sig, fs, t);
    if(!Number.isFinite(v) || !Number.isFinite(r)) continue;
    worst = Math.max(worst, Math.abs(r - v));
    gross = Math.max(gross, Math.abs(v));
  }
  return { worst, gross, rel:worst / gross };
}
/* the same error at N and at 2N samples. Below Nyquist the residual is pure
   truncation of the sinc sum and shrinks with the record; above it, it is the
   alias and does not shrink at all. That difference is the diagnosis, and it is
   why this returns a RATIO rather than a tolerance. */
function dspReconOrder(x, fs, N){
  const e1 = dspReconErr(x, fs, N).rel;
  const e2 = dspReconErr(x, fs, 2 * N).rel;
  return { e1, e2, ratio:e2 > 1e-300 ? e1 / e2 : Infinity };
}

/* ---- the anti-alias filter, which is the only cure -------------------------
   Aliasing is not repaired after the fact — the folded content is
   indistinguishable from content that was really there. So the filter goes in
   FRONT of the sampler: oversample by `over`, low-pass at the Nyquist frequency
   of the target rate, then keep every over-th sample. What comes out is a
   faithful record of a DIFFERENT signal (the band-limited one), and that is the
   honest description of what every digitiser does. */
function dspGuard(x, fs, N, over, taps){
  const O = over || 8, M = N * O, T = taps || 257;
  const fine = new Float64Array(M + T);
  for(let n = 0; n < M + T; n++){
    const v = x((n - (T - 1) / 2) / (fs * O));
    fine[n] = Number.isFinite(v) ? v : 0;
  }
  /* cutoff at the target Nyquist, expressed in cycles per fine sample */
  const h = dspFirLP(0.5 / O, T, 'blackman');
  /* the band-limited signal on the fine grid, and the samples taken of it */
  const band = new Float64Array(M);
  for(let n = 0; n < M; n++){
    let s = 0;
    for(let k = 0; k < T && n + (T - 1) - k < M + T; k++) s += h[k] * fine[n + (T - 1) - k];
    band[n] = s;
  }
  const out = new Float64Array(N);
  for(let n = 0; n < N; n++) out[n] = band[n * O];
  /* THE FILTERED SIGNAL AS A FUNCTION, which is what makes the guard's claim
     measurable rather than asserted. Without it the panel can only say "the
     energy above Nyquist in the ORIGINAL is 11%" — a number that does not move
     when the reader ticks the box, which reads as the control doing nothing.
     With it, the same measurement can be made of what is actually being
     sampled, and the answer is what the filter is for. */
  const fsFine = fs * O;
  const xb = t => {
    const u = t * fsFine;
    const i = Math.floor(u);
    if(i < 0 || i + 1 >= M) return 0;
    const f = u - i;
    return band[i] * (1 - f) + band[i + 1] * f;
  };
  /* `fine[n + (T-1)/2 | 0]` was the first spelling of the offset below, and `|`
     binds looser than `+`, so it truncated the SAMPLE VALUE to an integer
     rather than the index. Compute it once, outside. */
  const mid = Math.round((T - 1) / 2);
  return { sig:out, band, fine, mid, over:O, xb, fsFine, kept:dspKeptOver(fine, band, mid, O, N) };
}
/* The fraction of a signal's energy that survives the guard, OVER A STATED
   SPAN — and the span has to be stated because a caller that filters twice the
   record it displays would otherwise quote a figure for the half nobody is
   looking at. The stage does exactly that (`dspReconOrder` asks about a record
   twice as long), and a chirp answers 40% for four seconds and 84% for two. */
function dspKeptOver(fine, band, mid, over, n){
  const M = Math.min(band.length, Math.max(1, Math.round(n)) * over);
  let e0 = 0, e1 = 0;
  for(let k = 0; k < M; k++){ e0 += fine[k + mid] * fine[k + mid]; e1 += band[k] * band[k]; }
  return e0 > 0 ? e1 / e0 : 1;
}
const dspKept = (G, n) => dspKeptOver(G.fine, G.band, G.mid, G.over, n);
const dspAntiAlias = (x, fs, N, over, taps) => dspGuard(x, fs, N, over, taps).sig;

/* ---- signals --------------------------------------------------------------
   Each declares the highest frequency it contains, in Hz, over the two-second
   record every stage here uses. That is a CLAIM, and `dspBandMeasure`
   recomputes it from a heavily oversampled transform: the frequency below which
   all but `tol` of the energy sits.

   TWO of them declare `null` instead, and that is the honest answer rather than
   a gap in the table: a square wave's harmonics never stop, and a Gaussian's
   transform is a Gaussian, which is nowhere zero. For those the question "what
   is the highest frequency present" has no answer and the panel measures the
   99.99% figure with its tolerance beside it.

   The chirp is the reason `dur` is here at all. Its band limit is a property of
   the RECORD, not of the formula: the frequency it has reached by the end. Ask
   the same function for sixteen seconds and the answer is 105 Hz rather than 14,
   which is what the first version of this table got wrong. */
const DSP_SIGNALS = {
  tone:  { name:'one tone at 3 Hz', short:'one tone', band:3,
           x:t => Math.sin(2 * Math.PI * 3 * t),
           comps:[{ f:3, amp:1 }],
           ex:'sin(2π·3t)',
           why:'The simplest thing that can alias. Everything the sampling theorem says can be said about this signal, and the folding is arithmetic you can check by hand.' },
  hi:    { name:'one tone at 19 Hz', short:'19 Hz', band:19,
           x:t => Math.sin(2 * Math.PI * 19 * t),
           comps:[{ f:19, amp:1 }],
           ex:'sin(2π·19t)',
           why:'The same signal as the first entry with a different number in it, and it is here so the two can be compared at one rate. Sampled 32 times a second it comes back as 13 Hz — |19 − 32| — and the reconstruction locks onto that instead. Nothing about the picture says anything has gone wrong; it is a clean 13 Hz wave through 13 Hz dots.' },
  two:   { name:'3 Hz and 11 Hz together', short:'two tones', band:11,
           x:t => Math.sin(2 * Math.PI * 3 * t) + 0.6 * Math.sin(2 * Math.PI * 11 * t),
           comps:[{ f:3, amp:1 }, { f:11, amp:0.6 }],
           ex:'sin(2π·3t) + 0.6 sin(2π·11t)',
           why:'Two tones, so a sample rate can be fast enough for one and too slow for the other — and the picture shows the survivor keeping its frequency while the other lands somewhere it never was.' },
  am:    { name:'an amplitude-modulated carrier', short:'AM', band:13,
           x:t => (1 + 0.6 * Math.sin(2 * Math.PI * 1 * t)) * Math.sin(2 * Math.PI * 12 * t),
           /* the product IS three lines: sin(24pit) + 0.3[cos(22pit) - cos(26pit)] */
           comps:[{ f:11, amp:0.3 }, { f:12, amp:1 }, { f:13, amp:0.3 }],
           ex:'(1 + 0.6 sin 2πt)·sin(2π·12t)',
           why:'A 12 Hz carrier whose amplitude wobbles at 1 Hz. Multiplying in time is convolving in frequency, so this is not a 12 Hz signal at all: it is 11, 12 and 13 Hz together, and the band limit is 13. Sampling at 26 is enough; sampling at 24 is not, and the failure lands on the sidebands rather than on the carrier.' },
  /* Named by its RATE, not by its endpoint, and that is not pedantry. "Sweeping
     1 → 14 Hz" is a statement about a two-second record; ask the same formula
     for ten seconds and it reaches 66. The rate is a property of the signal and
     the endpoint is a property of the record — the same distinction the band
     limit above is about, arriving twice in one table. */
  chirp: { name:'a chirp, rising 6.5 Hz every second', short:'chirp', band:null,
           x:t => Math.sin(2 * Math.PI * (1 * t + 6.5 * t * t / 2)),
           finst:t => 1 + 6.5 * t, f0:1, rate:6.5,
           ex:'sin(2π(t + 3.25t²))',
           why:'Its frequency rises linearly with time, so a rate that is fast enough at the start is too slow by the end — and the aliased tail comes back DOWN the picture while the true signal is still going up. Its band limit is declared as <b>none</b>, which is not an oversight: the record starts and stops abruptly, and a signal that occupies a finite stretch of time cannot occupy a finite stretch of frequency. That is a theorem, not a numerical accident, and the measured figure moving with the tolerance is what it looks like. Its <i>instantaneous</i> frequency reaches 14 Hz, which is a different and perfectly well-defined quantity — and the spectrogram is the instrument that measures it.' },
  square:{ name:'a square wave at 2 Hz', short:'square', band:null,
           x:t => (Math.sin(2 * Math.PI * 2 * t) >= 0 ? 1 : -1),
           /* 4/(pi k) at every odd multiple, and they never stop */
           comps:[{ f:2, amp:4 / Math.PI }, { f:6, amp:4 / (3 * Math.PI) },
                  { f:10, amp:4 / (5 * Math.PI) }, { f:14, amp:4 / (7 * Math.PI) },
                  { f:18, amp:4 / (9 * Math.PI) }],
           ex:'sgn sin(2π·2t)',
           why:'Its harmonics are at 6, 10, 14 … Hz and they never stop, falling only as 1/k. No sample rate is fast enough, so the question changes from "does it alias" to "how much", and the panel answers that instead. This is the ordinary case: a real signal is band-limited by the filter in front of the converter, never by nature.' },
  burst: { name:'two bursts, at different times and different frequencies', short:'bursts', band:null,
           x:t => Math.exp(-30 * (t - 1) * (t - 1)) * Math.sin(2 * Math.PI * 9 * t) +
                  Math.exp(-30 * (t - 5.5) * (t - 5.5)) * Math.sin(2 * Math.PI * 34 * t),
           ex:'e^(−30(t−1)²)sin(2π·9t) + e^(−30(t−5.5)²)sin(2π·34t)',
           why:'The signal one transform of the whole record describes as "9 and 34 Hz, both present" — which is true and is the entire point being missed. They are not both present; one happened and then the other did. This is the case the spectrogram exists for, and it is worth looking at it there and here to see the difference between an instrument that answers the question and one that does not.' },
  pulse: { name:'a Gaussian pulse', short:'pulse', band:null,
           x:t => Math.exp(-40 * (t - 0.5) * (t - 0.5)) * Math.sin(2 * Math.PI * 6 * t),
           ex:'e^(−40(t−0.5)²)·sin(2π·6t)',
           why:'Narrow in time, so it cannot be narrow in frequency — the uncertainty relation the Fourier wing measured. A Gaussian\'s transform is a Gaussian and is nowhere zero, so this has no band limit either; what it has is a figure for where 99.99% of its energy stops, and that figure moves with the tolerance you choose. The panel prints the tolerance beside it for exactly that reason.' }
};
const DSP_SIGNAL_KEYS = ['tone', 'hi', 'two', 'am', 'chirp', 'square', 'burst', 'pulse'];

/* the measured band limit: transform a long, heavily oversampled record and
   find the frequency below which all but `tol` of the energy sits. A tolerance
   is unavoidable — "the highest frequency present" is not a property any finite
   record has — so it is an argument rather than a hidden constant. */
const DSP_DUR = 2;                       /* seconds — the sampling stage's record */
const DSP_SPEC_DUR = 8;                  /* and the spectrogram's, which needs room */
/* NO WINDOW, deliberately, and the reason is the chirp. A window tapers the
   ENDS of the record to zero — and a chirp's highest frequencies are at its
   end, so a Blackman-windowed measurement of it returned 13 Hz for a signal
   that reaches 14. Tapering does not bias a stationary signal and does bias a
   sweeping one, so the instrument would have been measuring the window. The
   presets are all whole numbers of cycles over the two-second record, so a bare
   transform leaks nothing; a signal the reader types need not be, and the panel
   says so rather than quietly tapering it. The right instrument for a signal
   whose content moves is the spectrogram, which is the next stage along. */
/* One heavily oversampled transform of the record, from which both questions a
   sampling panel asks are answered: where the content stops, and how much of it
   is above a given Nyquist frequency. They were two transforms of two different
   records until the chirp made the difference visible — `ftAliasEnergy` builds
   its own record of N/f_s seconds, which is not the record the panel is showing
   unless the caller happens to pass the same N. Ask both questions of ONE
   record and the two answers cannot disagree about what they describe. */
function dspEnergyProfile(x, dur, N){
  const M = N || 8192, D = dur || DSP_DUR, fsHigh = M / D;
  const re = new Float64Array(M), im = new Float64Array(M);
  for(let n = 0; n < M; n++){
    const v = x(n / fsHigh);
    re[n] = Number.isFinite(v) ? v : 0;
  }
  ftFFT(re, im);
  const half = M / 2;
  let total = 0;
  const p = new Float64Array(half + 1);
  for(let k = 0; k <= half; k++){ p[k] = re[k] * re[k] + im[k] * im[k]; total += p[k]; }
  return { p, total, half, bin:fsHigh / M, top:fsHigh / 2, dur:D };
}
function dspBandMeasure(x, dur, tol, N){
  const E = dspEnergyProfile(x, dur, N);
  const t = tol === undefined ? 1e-4 : tol;
  const want = (1 - t) * E.total;
  let acc = 0, k = 0;
  for(; k <= E.half; k++){ acc += E.p[k]; if(acc >= want) break; }
  return { f:k * E.bin, total:E.total, top:E.top, bin:E.bin, tol:t, profile:E };
}
/* how much of that same record sits above a Nyquist frequency — the energy that
   a sampler at 2·fNyq will fold down onto something below it */
function dspAliasFrac(E, fNyq){
  let above = 0;
  for(let k = 0; k <= E.half; k++) if(k * E.bin > fNyq + 1e-12) above += E.p[k];
  return { above, total:E.total, frac:E.total > 0 ? above / E.total : 0 };
}

/* ---- the short-time transform ---------------------------------------------
   One transform of a whole record says which frequencies are present and says
   nothing about when. Cut the record into overlapping pieces, window each and
   transform it, and the answer becomes a picture in time AND frequency — at a
   price that cannot be avoided: a piece of length N samples localises a time to
   N/fs seconds and a frequency to ENBW·fs/N Hz, and the product of those two is
   ENBW, whatever N is. That constant is the discrete form of the uncertainty
   relation, and `dspStftResolution` returns it so a stage can sweep N and print
   the spread rather than assert it. */
function dspStft(sig, N, hop, win){
  const cols = Math.max(1, Math.floor((sig.length - N) / hop) + 1);
  const half = N / 2;
  const mag = [];
  for(let c = 0; c < cols; c++){
    const re = new Float64Array(N), im = new Float64Array(N);
    for(let n = 0; n < N; n++) re[n] = sig[c * hop + n] * dspWindow(win || 'hann', n, N);
    ftFFT(re, im);
    const m = new Float64Array(half + 1);
    for(let k = 0; k <= half; k++) m[k] = Math.hypot(re[k], im[k]) / N;
    mag.push(m);
  }
  return { cols, half, hop, N, mag,
           /* the centre of column c, in samples */
           centre:c => c * hop + (N - 1) / 2 };
}
const dspStftResolution = (N, fs, win) => ({
  dt:N / fs, df:dspWinSums(win || 'hann', N).enbw * fs / N,
  product:dspWinSums(win || 'hann', N).enbw
});
/* the loudest frequency in one column, refined between bins — the ridge */
function dspRidge(col, fs, N){
  return dspPeakBin(col) * fs / N;
}
/* the ridge against a known instantaneous frequency. A window of length N sees
   the chirp sweep across it, so the ridge lands on the frequency at the CENTRE
   of the window — not at its start — and the residual below is measured against
   that, which is the only comparison the mathematics supports. */
function dspRidgeError(S, fs, finst){
  let worst = 0, gross = 1e-300, n = 0;
  for(let c = 0; c < S.cols; c++){
    const tc = S.centre(c) / fs;
    const got = dspRidge(S.mag[c], fs, S.N), want = finst(tc);
    if(!Number.isFinite(got) || !Number.isFinite(want)) continue;
    worst = Math.max(worst, Math.abs(got - want));
    gross = Math.max(gross, Math.abs(want));
    n++;
  }
  return { worst, gross, cols:n };
}
