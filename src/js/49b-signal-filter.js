/* ============================================================================
   4c · SIGNAL PROCESSING — FILTERS
   The second half of wing C15's engine. `49a-signal.js` carries what a WINDOW
   and a SAMPLE RATE do — the cosine sums, the Dirichlet kernel, the folding
   map, the anti-alias guard and the short-time transform, all of which are
   about looking at a signal. This file is about changing one. They were one
   800-line module until src/js/CLAUDE.md's "one concern per file" was applied
   to it.

   Two routes to everything, as in the first half:
     a filter's response   B(z)/A(z) on the unit circle   vs driving
                                                             e^(2pi i f n)
                                                             through the
                                                             recursion and
                                                             dividing
     its group delay       -d(arg H)/dw, exactly          vs differencing the
                                                             phase; and at DC,
                                                             vs the centroid
                                                             of h[n]
     its stability         the roots of a, by the complex wing's Aberth
                           iteration -- a question about a polynomial, not
                           about signals
   ============================================================================ */
/* ---- filters ---------------------------------------------------------------
   A filter is two lists of numbers. Everything else is a consequence:
      y[n] = Σ b_k x[n−k] − Σ_{k≥1} a_k y[n−k]        (a[0] is 1)
   Route 1 for its response evaluates the rational function on the unit circle.
   Route 2 runs that recursion on e^(2πifn) and reads the output. */
function dspRun(b, a, x){
  const N = x.length, y = new Float64Array(N);
  const a0 = a && a.length ? a[0] : 1;
  for(let n = 0; n < N; n++){
    let s = 0;
    for(let k = 0; k < b.length; k++) if(n - k >= 0) s += b[k] * x[n - k];
    if(a) for(let k = 1; k < a.length; k++) if(n - k >= 0) s -= a[k] * y[n - k];
    y[n] = s / a0;
  }
  return y;
}
function dspImpulse(b, a, n){
  const x = new Float64Array(n); x[0] = 1;
  return dspRun(b, a, x);
}
/* H(e^(2πif)) — f in cycles per sample */
function dspResp(b, a, f){
  const w = 2 * Math.PI * f;
  let br = 0, bi = 0, ar = 0, ai = 0;
  for(let k = 0; k < b.length; k++){ br += b[k] * Math.cos(w * k); bi -= b[k] * Math.sin(w * k); }
  const A = (a && a.length) ? a : [1];
  for(let k = 0; k < A.length; k++){ ar += A[k] * Math.cos(w * k); ai -= A[k] * Math.sin(w * k); }
  const d = ar * ar + ai * ai;
  const re = (br * ar + bi * ai) / d, im = (bi * ar - br * ai) / d;
  return { re, im, mag:Math.hypot(re, im), phase:Math.atan2(im, re) };
}
/* THE SECOND ROUTE. Drive the difference equation with e^(2πifn) — real and
   imaginary parts run separately, which is legitimate because the filter is
   linear with real coefficients — wait for the transient to die, and divide the
   output by the input. For an FIR of M taps the transient is over exactly at
   n = M−1 and this is exact to round-off. For an IIR it decays like the largest
   pole radius to the n, and what is left is the measurement's own error: an
   infinite impulse response never exactly forgets, which is the name. */
function dspDrive(b, a, f, settle){
  const A = (a && a.length) ? a : [1];
  const n0 = settle || dspSettle(b, A);
  const N = n0 + 4;
  const xc = new Float64Array(N), xs = new Float64Array(N);
  for(let n = 0; n < N; n++){
    xc[n] = Math.cos(2 * Math.PI * f * n);
    xs[n] = Math.sin(2 * Math.PI * f * n);
  }
  const yc = dspRun(b, A, xc), ys = dspRun(b, A, xs);
  /* y = H·x with x = e^(iθ); divide by it, i.e. multiply by e^(−iθ) */
  const th = 2 * Math.PI * f * (N - 1);
  const yr = yc[N - 1], yi = ys[N - 1];
  const c = Math.cos(th), s = Math.sin(th);
  const re = yr * c + yi * s, im = yi * c - yr * s;
  return { re, im, mag:Math.hypot(re, im), phase:Math.atan2(im, re), settled:n0 };
}
/* The group delay, −dφ/dω, in SAMPLES — and it is worth having exactly rather
   than by differencing, for a reason that is mathematics rather than accuracy.

   Differentiating B(ω) = Σ b_k e^(−jkω) gives B′ = −j·Σ k b_k e^(−jkω), so
      −d(arg B)/dω = Re{ (Σ k b_k e^(−jkω)) / B }
   and for H = B/A the two delays subtract. No wrapping, no step size.

   WHERE IT IS NOT DEFINED, and this is the interesting part: at a zero of H on
   the unit circle. A moving average has seven of them, and arg H genuinely
   jumps by π at each — the phase is not differentiable there and the correct
   answer is "no group delay", not a large number. The first version of this
   returned −24 999.5 samples for the difference filter at DC, which is a
   division by a phase jump wearing the units of a delay. `null` is the answer,
   and the panel says why. */
function dspGroupDelay(b, a, f){
  const w = 2 * Math.PI * f;
  const part = c => {
    let re = 0, im = 0, kre = 0, kim = 0;
    for(let k = 0; k < c.length; k++){
      const co = Math.cos(w * k), si = -Math.sin(w * k);
      re += c[k] * co; im += c[k] * si;
      kre += k * c[k] * co; kim += k * c[k] * si;
    }
    const d = re * re + im * im;
    return { d, tau:(kre * re + kim * im) / d };
  };
  const B = part(b), A = part((a && a.length) ? a : [1]);
  let norm = 0;
  for(let k = 0; k < b.length; k++) norm += Math.abs(b[k]);
  if(!(B.d > 1e-20 * norm * norm)) return null;      /* a zero of H — no delay there */
  return B.tau - A.tau;
}
/* THE SECOND ROUTE to the same number: difference the phase and unwrap. Only
   valid away from the zeros, for the reason above, so it returns null in the
   same places rather than a spike. */
function dspGroupDelayNum(b, a, f, h){
  const d = h || 1e-5;
  /* The guard has to be on the CENTRE, not on the two evaluation points. At a
     zero of H both neighbours are small but equal, so a guard comparing them to
     each other passes happily and returns the phase jump divided by 2d — which
     for the difference filter at DC is −24 999.5 samples. Asking whether H
     vanishes HERE is the same question the exact route asks, and it is a
     statement about where the derivative exists rather than a shared
     computation. */
  let norm = 0;
  for(let k = 0; k < b.length; k++) norm += Math.abs(b[k]);
  if(!(dspResp(b, a, f).mag > 1e-9 * norm)) return null;
  const H1 = dspResp(b, a, f + d), H0 = dspResp(b, a, f - d);
  let dp = H1.phase - H0.phase;
  while(dp > Math.PI) dp -= 2 * Math.PI;
  while(dp < -Math.PI) dp += 2 * Math.PI;
  return -dp / (2 * Math.PI * 2 * d);
}
/* THE SECOND ROUTE TO THE GROUP DELAY, at f = 0 and only there: the centre of
   mass of the impulse response. Σn·h[n]/Σh[n] is the delay the filter gives a
   slowly varying signal, and for a symmetric FIR it is (M−1)/2 exactly — the
   fact that makes linear-phase filters worth having. It needs Σh ≠ 0, so it is
   meaningless for a high-pass, and this returns null there rather than a
   number. */
function dspCentroidDelay(b, a, n){
  /* the sum must run until the response is genuinely spent: truncating a
     resonator's impulse response at 256 samples left 0.97²⁵⁶ ≈ 4×10⁻⁴ of it
     outside the sum and moved the answer by 2%, which read as a broken
     identity rather than as a truncated sum */
  const h = dspImpulse(b, a, n || dspSettle(b, a));
  let s0 = 0, s1 = 0;
  for(let k = 0; k < h.length; k++){ s0 += h[k]; s1 += k * h[k]; }
  return Math.abs(s0) < 1e-9 ? null : s1 / s0;
}
/* how far from symmetric the taps are */
function dspSymResid(b){
  let m = 0;
  for(let k = 0; k < b.length; k++) m = Math.max(m, Math.abs(b[k] - b[b.length - 1 - k]));
  return m;
}
/* AND WHETHER THAT MAKES THE PHASE LINEAR, which is a different question and
   the reason this is a function rather than a comparison at the call site.
   Symmetric taps force linear phase because reversing the list leaves it
   unchanged, so H is a real amplitude times e^(−iω(M−1)/2). That argument is
   about the NUMERATOR and survives only if there is no denominator: a two-pole
   resonator with a single feed-forward tap has a trivially palindromic b, and a
   panel testing `dspSymResid(b) < 1e-12` reported "linear phase, delay 0
   samples" for it. Found by looking at the screenshot, which is the only thing
   that could have. */
const dspLinearPhase = (b, a) => (!a || a.length <= 1) && dspSymResid(b) < 1e-12;
/* poles and zeros, by the root finder the complex-numbers wing built. A filter
   is stable exactly when every pole is inside the unit circle, and that is a
   statement about the roots of a polynomial rather than about signals. */
function dspRoots(c){
  if(!c || c.length < 2) return [];
  const R = cnPolyRoots(c.map(v => cx(v, 0)));
  return R.ok ? R.roots : [];
}
const dspMaxPole = a => dspRoots(a).reduce((m, z) => Math.max(m, cxAbs(z)), 0);
/* how many samples until the transient is below one part in 10¹⁴. The residue
   of a pole at radius r decays as rⁿ, so n(1 − r) ≈ 35 is the answer — and it
   diverges as r → 1, which is the honest statement: a filter on the edge of
   instability has no settling time. Capped, and the cap is reported by the
   panel as the reason a residual stopped falling. */
function dspSettle(b, a, cap){
  /* an FIR forgets its start EXACTLY at its last tap, so the count is the tap
     count and no estimate is involved. Leaving this out was worth a defect: the
     41-tap designs were driven for 8 samples and the "measured" response was
     the transient, disagreeing with the closed form by 100%. */
  const fir = (b ? b.length : 1) + 2;
  const r = dspMaxPole(a && a.length > 1 ? a : [1]);
  if(!(r > 0)) return fir;
  if(r >= 1) return cap || 20000;
  return Math.max(fir, Math.min(cap || 20000, Math.ceil(35 / (1 - r)) + 8));
}

/* ---- FIR design by windowed sinc -------------------------------------------
   The ideal low-pass has impulse response 2fc·sinc(2fc n), which is infinite and
   not causal. Truncate it to M taps and you get Gibbs ripple at the cut, for
   exactly the reason the Fourier wing measured: a rectangle in one domain is a
   sinc in the other. Multiply by a window instead of truncating and the ripple
   collapses — the same trade the window stage makes, seen from the other side.
   Symmetric by construction, so the phase is linear. */
function dspFirLP(fc, taps, win){
  const M = Math.max(3, Math.round(taps) | 1);            /* odd, so the centre is a tap */
  const h = new Float64Array(M), c = (M - 1) / 2;
  let s = 0;
  for(let n = 0; n < M; n++){
    const t = n - c;
    const ideal = Math.abs(t) < 1e-12 ? 2 * fc : Math.sin(2 * Math.PI * fc * t) / (Math.PI * t);
    h[n] = ideal * dspWindowSym(win || 'hamming', n, M);
    s += h[n];
  }
  /* normalise to unit gain at DC — the window has already changed it */
  if(Math.abs(s) > 1e-12) for(let n = 0; n < M; n++) h[n] /= s;
  return h;
}
/* spectral inversion: subtract the low-pass from an all-pass delay of the same
   length. Only legal because the low-pass is symmetric and odd-length. */
function dspFirHP(fc, taps, win){
  const h = dspFirLP(fc, taps, win), M = h.length, out = new Float64Array(M);
  for(let n = 0; n < M; n++) out[n] = (n === (M - 1) / 2 ? 1 : 0) - h[n];
  return out;
}
function dspFirBP(f1, f2, taps, win){
  const lo = dspFirLP(f1, taps, win), hi = dspFirLP(f2, taps, win);
  const out = new Float64Array(hi.length);
  for(let n = 0; n < hi.length; n++) out[n] = hi[n] - lo[n];
  return out;
}
const dspMovAvg = M => { const h = new Float64Array(Math.max(1, Math.round(M))); h.fill(1 / h.length); return h; };
/* the worst gain anywhere in a band, in dB — what a stopband claim means. A
   designed filter has no exact zeros away from where it was told to put them,
   so "the gain at Nyquist is 0" is false for every windowed sinc; the true
   statement is a BOUND over a band, and this is what measures it. */
function dspStopband(b, a, f1, f2, n){
  const N = n || 400;
  let worst = 0;
  for(let i = 0; i <= N; i++) worst = Math.max(worst, dspResp(b, a, f1 + (f2 - f1) * i / N).mag);
  return { gain:worst, db:dspDb(worst, 1) };
}

/* ---- the filters a reader can choose --------------------------------------
   Every entry declares things about itself, and `auditclaims.ps1` recomputes
   each one by a route that does not read the declaration: `dc` against
   `dspResp(b,a,0)`, `nyq` against `dspResp(b,a,0.5)`, `linear` against the
   symmetry residual, `delay` against the centroid of the impulse response,
   `poleMax` against the roots of a. */
const DSP_FILTERS = {
  avg:  { name:'a moving average of 8 samples', short:'average',
          make:() => ({ b:dspMovAvg(8), a:[1] }),
          dc:1, nyq:0, linear:true, delay:3.5, poleMax:0, kind:'FIR',
          why:'The filter everyone writes first, and it is a low-pass — an average cannot follow anything that changes faster than its own length. Its response is |sin(8πf)/(8 sin πf)|, a Dirichlet kernel again, so it has zeros exactly where a whole number of cycles fits in the window and sidelobes of −13 dB that never get any better. It is cheap, it is linear phase, and it is a poor low-pass.' },
  lp:   { name:'a windowed-sinc low-pass, cut at 0.15', short:'low-pass',
          make:() => ({ b:dspFirLP(0.15, 41, 'hamming'), a:[1] }),
          dc:1, nyq:null, stop:[0.25, 0.5, -55], linear:true, delay:20, poleMax:0, kind:'FIR',
          why:'The ideal low-pass truncated to 41 taps and tapered by a Hamming window. Truncating alone would give Gibbs ripple at the cut; the window trades a wider transition for a stopband some 55 dB down. Notice what it does <b>not</b> claim: its gain at Nyquist is 6×10⁻⁴ rather than zero, because a finite filter has no exact zeros where it is not designed to. The table declares the stopband as a bound and the panel measures it.' },
  hp:   { name:'a high-pass, by spectral inversion', short:'high-pass',
          make:() => ({ b:dspFirHP(0.15, 41, 'hamming'), a:[1] }),
          dc:0, nyq:null, stop:[0, 0.1, -45], linear:true, delay:null, poleMax:0, kind:'FIR',
          why:'An all-pass delay minus the low-pass beside it, which works only because that low-pass is symmetric and has an odd number of taps so the delay is a whole sample. Its DC gain is exactly zero — and that is why the centre-of-mass route to the group delay has nothing to say here: dividing by Σh is dividing by zero. Its stopband is declared at −45 dB where the low-pass gets −55, and that is not a worse design: subtracting turns the low-pass\'s <i>passband ripple</i> into this filter\'s stopband, so the two numbers are one number seen from opposite sides.' },
  bp:   { name:'a band-pass, 0.10 to 0.25', short:'band-pass',
          make:() => ({ b:dspFirBP(0.10, 0.25, 41, 'hamming'), a:[1] }),
          dc:0, nyq:null, stop:[0.32, 0.5, -50], linear:true, delay:null, poleMax:0, kind:'FIR',
          why:'The difference of two low-passes. A band-pass is not a new idea, it is a subtraction — and the same subtraction in the frequency domain is what the picture shows.' },
  diff: { name:'the first difference — a discrete derivative', short:'difference',
          make:() => ({ b:[1, -1], a:[1] }),
          dc:0, nyq:2, linear:false, delay:null, poleMax:0, kind:'FIR',
          why:'y[n] = x[n] − x[n−1]. Its gain is 2|sin πf|, which for small f is 2πf — the derivative multiplies by 2πif, and this is that, with the sine standing in for its argument. It is antisymmetric rather than symmetric, so its phase is linear with a half-sample offset and a constant π/2 turn: differentiating is a quarter turn, exactly as it is in the complex wing.' },
  one:  { name:'a one-pole low-pass, p = 0.9', short:'one pole',
          make:() => ({ b:[0.1], a:[1, -0.9] }),
          dc:1, nyq:0.05263157894736842, linear:false, delay:null, poleMax:0.9, kind:'IIR',
          why:'y[n] = 0.1x[n] + 0.9y[n−1] — two multiplications and one addition, and it is the exponential smoother every embedded system ships. Its impulse response is 0.1·0.9ⁿ, which never reaches zero: infinite impulse response. Its DC gain is exactly 1 because the coefficients were chosen to make Σb/Σa = 1, and the panel checks that rather than trusting it.' },
  reso: { name:'a two-pole resonator at 0.12', short:'resonator',
          make:() => { const r = 0.97, w = 2 * Math.PI * 0.12;
                       return { b:[(1 - r) * Math.sqrt(1 - 2 * r * Math.cos(2 * w) + r * r)],
                                a:[1, -2 * r * Math.cos(w), r * r] }; },
          dc:null, nyq:null, linear:false, delay:null, poleMax:0.97, kind:'IIR',
          why:'Two poles at radius 0.97 and angle ±2π(0.12) — a resonance, because the response is one over the distance to the poles and that distance is smallest when the frequency passes them. Push the radius towards 1 and the peak sharpens without limit; push it past 1 and the output grows without bound, which is what "unstable" means and is visible in the picture rather than asserted.' }
};
const DSP_FILTER_KEYS = ['avg', 'lp', 'hp', 'bp', 'diff', 'one', 'reso'];

/* a reader's own coefficient list. Numbers or expressions, comma or space
   separated; a bad entry is reported by position rather than swallowed. */
function dspCoeffs(src, fallback){
  const parts = String(src).split(/[,\s]+/).filter(s => s.length);
  const out = [], bad = [];
  for(let i = 0; i < parts.length; i++){
    const v = mathNum(parts[i]);
    if(Number.isFinite(v)) out.push(v);
    else bad.push({ i:i + 1, s:parts[i] });
  }
  if(!out.length || bad.length)
    return { ok:false, c:fallback || [1], bad,
             why:bad.length ? 'entry ' + bad[0].i + ', "' + bad[0].s + '", is not a number'
                            : 'that list is empty' };
  return { ok:true, c:out, bad:[], why:'' };
}

