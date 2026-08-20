/* ============================================================================
   3ia · STATISTICAL INFERENCE — estimators, likelihood, and their errors

   The probability wing below this one stops at distributions: it draws samples
   and watches averages become normal. This wing asks the question that comes
   next and is a different subject — given the sample, what may be said about
   the thing that produced it, and how wrong is that allowed to be.

   Two rules shape every routine here.

   1 · EVERY NUMBER IS REPRODUCIBLE. Nothing calls Math.random(). A stage owns a
       seed, the seed makes the sample, and the same seed makes the same sample
       on every repaint, in every screenshot, and in every gate. A readout whose
       numbers change while nobody touches anything cannot be compared against
       anything, and a simulated claim re-rolled on each frame is a claim that
       has never been checked twice.

   2 · A SIMULATED QUANTITY DOES NOT AGREE TO EVERY DIGIT, AND SAYING SO IS THE
       WHOLE SKILL. A Monte Carlo estimate sits a distance of order its own
       standard error from the truth, and that distance shrinks like 1/√trials —
       so the ordinary two-route verdict, which asks whether the gap is at
       round-off, reports every correct simulation in this wing as a 3% failure.
       The honest scale is the simulation's OWN sampling error, and snAgreeSamp
       below derives it from the draws rather than accepting it from a caller.

   Prefix: sn
   ============================================================================ */

/* ---- a seeded stream ------------------------------------------------------
   mulberry32: one multiply-xorshift round, period 2³², and — the property that
   matters here — a state that is one 32-bit integer, so a stage can put its
   seed in a permalink and get the identical sample back. */
function snRng(seed){
  let a = (seed >>> 0) || 1;
  return function(){
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* a standard normal from that stream. The Box–Muller pair is NOT cached the way
   pbRandn caches it: a cache is state living between calls, and two runs that
   draw a different number of values would then diverge — which is exactly the
   reproducibility this module exists to provide. Half the transform is wasted
   and the determinism is worth more. */
function snRandn(rng){
  let u = 0;
  while(u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/* ---- log Γ ----------------------------------------------------------------
   pbGamma next door returns Γ itself, which overflows past z ≈ 171 — and the
   ratio Γ(n/2)/Γ((n−1)/2) that Bessel's correction needs is a ratio of two
   enormous numbers whose answer is near 1, so forming them separately is the
   textbook way to lose it. The same Lanczos coefficients in log form have
   neither problem. */
function snLgamma(z){
  if(z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - snLgamma(1 - z);
  const g = 7, C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  z -= 1;
  let x = C[0];
  for(let i = 1; i < g + 2; i++) x += C[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
const snLnBeta = (a, b) => snLgamma(a) + snLgamma(b) - snLgamma(a + b);
const snLnChoose = (n, k) => snLgamma(n + 1) - snLgamma(k + 1) - snLgamma(n - k + 1);

/* c₄(n) = E[s]/σ for a normal sample — the reason the SAMPLE STANDARD DEVIATION
   is biased even though the sample variance is not. Written through snLgamma
   for the reason above: the naive ratio of gammas overflows at n ≈ 340 and
   returns NaN, which reads as "no closed form exists" rather than as an
   overflow. */
const snC4 = n => n < 2 ? NaN
  : Math.sqrt(2 / (n - 1)) * Math.exp(snLgamma(n / 2) - snLgamma((n - 1) / 2));

/* ============================================================================
   THE VERDICT FORMATTERS — the two-route rule, in the one subject where the
   two routes are ALLOWED to differ
   ============================================================================ */
/* fmtAgree asks "is the gap at round-off". Against a Monte Carlo the answer is
   always no, and it is supposed to be no: the estimate is a random quantity
   whose spread is se = sd/√trials, so a gap of 0.4 se is a perfect result and a
   gap of 12 se is a defect — though the second may well be the smaller number.
   The verdict here is therefore the gap measured in units of se.

   snAgreeSamp is the form to reach for, and the reason is SITE-RULES rule zero
   point 2: it takes the DRAWS and derives both the estimate and its standard
   error from them, so a caller cannot pass the wrong scale. snAgreeMC below it
   accepts a standard error computed elsewhere, for the cases where the draws
   are not in scope — use it only there. */
function snZgap(sim, theory, se){
  const gap = sim - theory;
  if(!Number.isFinite(gap) || !Number.isFinite(se) || !(se > 0))
    return { gap, z:NaN, ok:false, usable:false };
  const z = gap / se;
  return { gap, z, ok:Math.abs(z) <= 2.5, usable:true };
}
function snAgreeMC(sim, theory, se, unit){
  const u = unit ? ' ' + unit : '';
  if(!Number.isFinite(sim) || !Number.isFinite(theory))
    return 'not computable — a route returned no number';
  const Z = snZgap(sim, theory, se);
  /* no sampling error to divide by means this is not a Monte Carlo comparison
     at all, and the ordinary round-off verdict is then the right one */
  if(!Z.usable) return fmtAgree(sim, theory, unit);
  return fmtSig(Math.abs(Z.gap), 3) + u + '  (' + fmtSig(Math.abs(Z.z), 2) +
    ' × the simulation’s own error' +
    (Z.ok ? ' — inside the noise)' : ' — larger than sampling can explain)');
}
/* the form that cannot be got wrong: hand it the draws */
function snAgreeSamp(vals, theory, unit){
  const S = pbStats(vals);
  return snAgreeMC(S.mean, theory, S.se, unit);
}
/* the same verdict sized for a canvas label, where the prose does not fit and
   markup would be painted literally */
function snAgreeMCTight(sim, theory, se, unit){
  const u = unit ? ' ' + unit : '';
  if(!Number.isFinite(sim) || !Number.isFinite(theory)) return 'not computable';
  const Z = snZgap(sim, theory, se);
  if(!Z.usable) return fmtAgreeTight(sim, theory, unit);
  return fmtSig(Math.abs(Z.gap), 3) + u + ' (' + fmtSig(Math.abs(Z.z), 2) + 'σ' +
         (Z.ok ? ')' : ', outside)');
}

/* ============================================================================
   THE FAMILIES — each carries a sampler, a log density, the closed-form MLE,
   and the Fisher information per observation.

   `regular` is a HYPOTHESIS, not decoration. The Cramér–Rao bound and the
   asymptotic normality of the MLE both require that the support not depend on
   the parameter, and the uniform family breaks exactly that — which is why its
   MLE beats the bound rather than attaining it. A table that did not carry the
   hypothesis would let a stage quote a bound that is not in force.
   ============================================================================ */
const SN_FAMS = {
  normal: { n:'normal', pn:'μ', regular:true, lo:-6, hi:6, th0:0, thLo:-3, thHi:3,
    sample:(p, rng) => p.th + p.sd * snRandn(rng),
    logpdf:(x, p) => -0.5 * Math.pow((x - p.th) / p.sd, 2) - Math.log(p.sd * Math.sqrt(2 * Math.PI)),
    pdf:(x, p) => Math.exp(-0.5 * Math.pow((x - p.th) / p.sd, 2)) / (p.sd * Math.sqrt(2 * Math.PI)),
    mle:xs => xs.reduce((a, b) => a + b, 0) / xs.length,
    fisher:p => 1 / (p.sd * p.sd),
    note:'The mean of a normal, with the spread known. Everything is attainable here: the sample mean is unbiased, its variance is exactly σ²/n, and that is exactly the Cramér–Rao bound. It is the one case where the textbook picture is the whole picture.' },
  expo: { n:'exponential', pn:'λ', regular:true, lo:0, hi:8, th0:1, thLo:0.15, thHi:4,
    sample:(p, rng) => -Math.log(1 - rng()) / p.th,
    logpdf:(x, p) => x < 0 ? -Infinity : Math.log(p.th) - p.th * x,
    pdf:(x, p) => x < 0 ? 0 : p.th * Math.exp(-p.th * x),
    mle:xs => xs.length / xs.reduce((a, b) => a + b, 0),
    fisher:p => 1 / (p.th * p.th),
    note:'The rate of a memoryless waiting time. Its MLE is 1/x̄, and that is the cleanest counterexample in the wing: x̄ is unbiased for 1/λ, and one over it is not unbiased for λ, because averaging and inverting do not commute. The bias is exactly λ/(n−1), and it is computed here rather than quoted.' },
  bern: { n:'Bernoulli', pn:'p', regular:true, lo:-0.3, hi:1.3, th0:0.3, thLo:0.02, thHi:0.98,
    sample:(p, rng) => rng() < p.th ? 1 : 0,
    logpdf:(x, p) => x > 0.5 ? Math.log(p.th) : Math.log(1 - p.th),
    pdf:(x, p) => x > 0.5 ? p.th : 1 - p.th,
    mle:xs => xs.reduce((a, b) => a + b, 0) / xs.length,
    fisher:p => 1 / (p.th * (1 - p.th)),
    note:'A coin. The proportion is the MLE, it is unbiased, and it attains the bound — and it is still where the confidence-interval stage finds the worst-behaved interval in ordinary use, because attaining a bound on the ESTIMATOR says nothing about the INTERVAL built from it.' },
  poisson: { n:'Poisson', pn:'λ', regular:true, lo:0, hi:14, th0:3, thLo:0.3, thHi:9,
    sample:(p, rng) => { let L = Math.exp(-p.th), k = 0, u = rng();
                         while(u > L && k < 400){ u *= rng(); k++; } return k; },
    logpdf:(x, p) => { const k = Math.round(x);
                       return k < 0 ? -Infinity : -p.th + k * Math.log(p.th) - snLgamma(k + 1); },
    pdf:(x, p) => Math.exp(SN_FAMS.poisson.logpdf(x, p)),
    mle:xs => xs.reduce((a, b) => a + b, 0) / xs.length,
    fisher:p => 1 / p.th,
    note:'Counts in a window. Mean and variance are the same number, so the information per observation is 1/λ — a rarer process carries MORE information about its rate per observation, which is the opposite of the intuition most readers arrive with.' },
  unif: { n:'uniform on [0, θ]', pn:'θ', regular:false, lo:0, hi:3, th0:2, thLo:0.5, thHi:3,
    sample:(p, rng) => p.th * rng(),
    logpdf:(x, p) => (x >= 0 && x <= p.th) ? -Math.log(p.th) : -Infinity,
    pdf:(x, p) => (x >= 0 && x <= p.th) ? 1 / p.th : 0,
    mle:xs => Math.max.apply(null, xs),
    fisher:p => 1 / (p.th * p.th),        /* the formal integral; it bounds nothing here */
    note:'The one family whose support moves with the parameter, which breaks the regularity condition every asymptotic result in this wing assumes. The consequences are visible rather than theoretical: the likelihood is discontinuous, the MLE is the largest observation and is biased downwards, its error falls like 1/n instead of 1/√n, and it BEATS the Cramér–Rao bound — which is not a contradiction, because the bound was never in force.' }
};

/* ============================================================================
   ESTIMATORS, and the closed forms for what they do
   ============================================================================ */
/* Each estimator carries truth(n, p, fam) — the exact mean and variance of its
   own sampling distribution — for the families where one is known. That is the
   second route: the stage simulates the sampling distribution and compares
   against these, so "unbiased" is a measurement rather than a label. A missing
   truth returns null and the stage says so instead of inventing one. */
const SN_ESTS = {
  mean: { n:'sample mean x̄', of:'centre', f:xs => xs.reduce((a, b) => a + b, 0) / xs.length,
    target:(p, fam) => fam === 'unif' ? p.th / 2 : fam === 'expo' ? 1 / p.th : p.th,
    truth:(n, p, fam) => {
      if(fam === 'normal')  return { mean:p.th, vari:p.sd * p.sd / n };
      if(fam === 'unif')    return { mean:p.th / 2, vari:p.th * p.th / (12 * n) };
      if(fam === 'expo')    return { mean:1 / p.th, vari:1 / (p.th * p.th * n) };
      if(fam === 'bern')    return { mean:p.th, vari:p.th * (1 - p.th) / n };
      if(fam === 'poisson') return { mean:p.th, vari:p.th / n };
      return null;
    },
    why:'The average. Unbiased for the mean of any family whatever — a theorem about linearity that needs no distributional assumption at all.' },
  median: { n:'sample median', of:'centre',
    f:xs => { const s = xs.slice().sort((a, b) => a - b), m = s.length >> 1;
              return s.length % 2 ? s[m] : 0.5 * (s[m - 1] + s[m]); },
    target:(p, fam) => fam === 'unif' ? p.th / 2 : fam === 'expo' ? Math.LN2 / p.th : p.th,
    truth:(n, p, fam) => fam === 'normal'
      ? { mean:p.th, vari:Math.PI * p.sd * p.sd / (2 * n) } : null,
    approx:true,
    why:'The middle observation. Also unbiased for a symmetric family, and for a normal its variance is π/2 ≈ 1.571 times the mean’s — so it throws away a third of the sample. That is the price of the robustness it buys, and both halves of the trade are measurable here.' },
  s2: { n:'sample variance s²  (÷ n−1)', of:'spread',
    f:xs => { const m = xs.reduce((a, b) => a + b, 0) / xs.length;
              return xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1); },
    target:(p, fam) => snTrueVar(p, fam),
    truth:(n, p, fam) => fam === 'normal'
      ? { mean:p.sd * p.sd, vari:2 * Math.pow(p.sd, 4) / (n - 1) } : null,
    why:'Bessel’s correction, and the reason for it: the deviations are taken about x̄ rather than about the true mean, and x̄ sits closer to the data than the truth does — by exactly one observation’s worth. Dividing by n−1 restores it exactly, not approximately.' },
  s2n: { n:'the same sum ÷ n', of:'spread',
    f:xs => { const m = xs.reduce((a, b) => a + b, 0) / xs.length;
              return xs.reduce((a, b) => a + (b - m) * (b - m), 0) / xs.length; },
    target:(p, fam) => snTrueVar(p, fam),
    truth:(n, p, fam) => fam === 'normal'
      ? { mean:p.sd * p.sd * (n - 1) / n,
          vari:2 * (n - 1) * Math.pow(p.sd, 4) / (n * n) } : null,
    why:'The same sum with the obvious denominator. Its bias is exactly −σ²/n — always downwards, never zero, vanishing only in the limit. It also has the SMALLER variance of the two, and at small n the smaller mean squared error, which is the first place where unbiasedness stops being obviously the thing to want.' },
  sd: { n:'sample sd s = √s²', of:'spread',
    f:xs => { const m = xs.reduce((a, b) => a + b, 0) / xs.length;
              return Math.sqrt(xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1)); },
    target:(p, fam) => Math.sqrt(snTrueVar(p, fam)),
    truth:(n, p, fam) => fam === 'normal'
      ? { mean:snC4(n) * p.sd, vari:(1 - snC4(n) * snC4(n)) * p.sd * p.sd } : null,
    why:'The square root of an unbiased estimator, and it is not unbiased — √ is concave, so by Jensen’s inequality E[√s²] < √E[s²] strictly, for every finite n. The factor is c₄(n), it is below 1 always, and unbiasedness is therefore not preserved by so much as taking a square root.' },
  max: { n:'largest observation', of:'edge', f:xs => Math.max.apply(null, xs),
    target:p => p.th, only:'unif',
    truth:(n, p) => ({ mean:n * p.th / (n + 1),
                       vari:n * p.th * p.th / ((n + 1) * (n + 1) * (n + 2)) }),
    why:'The maximum likelihood estimator of θ, and biased downwards for a reason with no arithmetic in it: every observation is below θ, so the largest of them is below θ, always, with probability one.' },
  maxAdj: { n:'(n+1)/n × largest', of:'edge',
    f:xs => (xs.length + 1) / xs.length * Math.max.apply(null, xs),
    target:p => p.th, only:'unif',
    truth:(n, p) => ({ mean:p.th, vari:p.th * p.th / (n * (n + 2)) }),
    why:'The same estimator scaled by exactly the factor its bias calls for. Unbiased, and its variance falls like 1/n² rather than 1/n — faster than the Cramér–Rao bound permits, and permitted because the bound’s hypothesis fails on this family.' },
  twice: { n:'2 × sample mean', of:'edge', f:xs => 2 * xs.reduce((a, b) => a + b, 0) / xs.length,
    target:p => p.th, only:'unif',
    truth:(n, p) => ({ mean:p.th, vari:p.th * p.th / (3 * n) }),
    why:'Also unbiased, by the method of moments: the mean of the family is θ/2, so twice the sample mean estimates θ. It is the natural estimator, it is correct, and it is far worse — its variance falls like 1/n while the adjusted maximum’s falls like 1/n². Unbiasedness on its own is a very weak thing to ask for.' }
};

/* the true variance of one observation from a family — the target the spread
   estimators are aiming at. Written once, because three estimators need it and
   three copies of a formula is three chances to get one of them wrong. */
function snTrueVar(p, fam){
  return fam === 'normal' ? p.sd * p.sd
       : fam === 'unif'   ? p.th * p.th / 12
       : fam === 'expo'   ? 1 / (p.th * p.th)
       : fam === 'bern'   ? p.th * (1 - p.th)
       : p.th;                                    /* Poisson: variance = λ */
}

/* ---- the sampling distribution of an estimator ----------------------------
   The object at the centre of the subject: an estimator applied to a random
   sample is itself a random quantity, and everything a first course calls "the
   error" is a property of THAT distribution rather than of any one sample.
   Simulated here, and compared against the closed forms above. */
function snSampDist(fam, p, n, est, trials, seed){
  const F = SN_FAMS[fam], E = SN_ESTS[est];
  const rng = snRng(seed);
  const vals = new Array(trials);
  const xs = new Array(n);
  for(let t = 0; t < trials; t++){
    for(let i = 0; i < n; i++) xs[i] = F.sample(p, rng);
    vals[t] = E.f(xs);
  }
  const S = pbStats(vals);
  const target = E.target(p, fam);
  const bias = S.mean - target;
  /* the variance of the draws, and the standard error OF THAT variance, so the
     comparison against the closed-form variance is judged on its own noise too.
     The fourth moment sets it, and it is computed from the sample rather than
     assumed normal — the exponential and uniform families are not. */
  const m4 = vals.reduce((a, v) => a + Math.pow(v - S.mean, 4), 0) / trials;
  const varSE = Math.sqrt(Math.max(0, m4 - S.vari * S.vari) / trials);
  return { vals, stats:S, target, bias, biasSE:S.se, vari:S.vari, varSE,
           mse:bias * bias + S.vari,
           /* MSE by its definition — the mean of the squared errors — rather
              than by the identity. The identity is then a CHECK on it. */
           mseDirect:vals.reduce((a, v) => a + (v - target) * (v - target), 0) / trials,
           truth:E.truth(n, p, fam), approx:!!E.approx, n, trials };
}

/* ============================================================================
   LIKELIHOOD
   ============================================================================ */
/* the log-likelihood of a whole sample at one parameter value */
function snLogLik(fam, xs, th, extra){
  const F = SN_FAMS[fam];
  const p = Object.assign({ sd:1 }, extra || {}, { th });
  let s = 0;
  for(let i = 0; i < xs.length; i++){
    const v = F.logpdf(xs[i], p);
    if(!Number.isFinite(v)) return -Infinity;
    s += v;
  }
  return s;
}
/* the curve, for drawing — and the grid maximum, which is a SECOND route to the
   MLE knowing nothing about any formula. Deliberately no derivative is used:
   the uniform family's likelihood is discontinuous at its maximum, and a solver
   that assumes a stationary point finds nothing there at all. */
function snLikCurve(fam, xs, lo, hi, N, extra){
  const pts = new Array(N + 1);
  let best = -Infinity, bestTh = NaN, bestI = -1;
  for(let i = 0; i <= N; i++){
    const th = lo + (hi - lo) * i / N;
    const L = snLogLik(fam, xs, th, extra);
    pts[i] = { x:th, y:L };
    if(L > best){ best = L; bestTh = th; bestI = i; }
  }
  const step = (hi - lo) / N;
  /* THE PEAK, REFINED. A raw grid maximum is only accurate to one step, so
     comparing it against a closed form reports the grid's resolution rather
     than any disagreement — which ./auditsides.ps1 correctly flagged as a
     claim that was exact on one preset and 1e-5 out on another, for no reason
     but where the peak happened to fall between two samples.

     Three points around a smooth maximum determine a parabola, and its vertex
     locates the peak to O(step²). The guard is the point: it applies only when
     the peak is INTERIOR and all three heights are finite, which is exactly the
     smooth case. The uniform family's likelihood is a cliff — one neighbour is
     −∞ — so no parabola is fitted there and the raw grid maximum stands, which
     is the honest answer for a maximum that is not a stationary point. */
  let peak = bestTh, how = 'raw';
  if(bestI > 0 && bestI < N){
    const a = pts[bestI - 1].y, b = pts[bestI].y, c = pts[bestI + 1].y;
    const den = a - 2 * b + c;
    if(Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c) && den < 0){
      const d = 0.5 * (a - c) / den;
      if(Math.abs(d) <= 1){ peak = bestTh + d * step; how = 'parabola'; }
    }
  }
  /* A MAXIMUM AT A CLIFF NEEDS THE OTHER METHOD. Where the peak's left
     neighbour is −∞ the data are impossible below it: the likelihood is not
     merely steep there, it is zero, and the maximum sits exactly on the edge of
     the feasible region. A parabola through one infinite point is meaningless,
     and the raw grid maximum is then only good to a step — which is what
     ./auditsides.ps1 caught, as a comparison that was exact on four families
     and 0.2% out on the fifth.

     So bisect for the edge instead. The test is "are these data possible under
     this θ", which needs no formula and no derivative, and it converges to
     machine precision. Choosing between the two methods is done by LOOKING at
     the curve — a finite neighbour or an infinite one — not by knowing which
     family is in play, so a new family with a moving support is handled without
     being told. */
  if(how === 'raw' && bestI > 0 && Number.isFinite(best) && !Number.isFinite(pts[bestI - 1].y)){
    let lo2 = pts[bestI - 1].x, hi2 = bestTh;
    for(let it = 0; it < 80; it++){
      const m = 0.5 * (lo2 + hi2);
      if(Number.isFinite(snLogLik(fam, xs, m, extra))) hi2 = m; else lo2 = m;
    }
    peak = hi2; how = 'edge';
  }
  return { pts, gridMax:bestTh, peak, how, refined:how !== 'raw', gridBest:best, step };
}
/* the observed information — the curvature of −ℓ at θ̂ — by a central second
   difference. h is scaled to θ̂ so it is neither swamped by round-off nor large
   enough for the fourth-order term to show: the numerical-differentiation
   trade-off the numerical-methods wing measures, reused rather than rederived. */
function snObsInfo(fam, xs, th, extra){
  const h = Math.max(1e-5, Math.abs(th) * 1e-4);
  const a = snLogLik(fam, xs, th - h, extra),
        b = snLogLik(fam, xs, th, extra),
        c = snLogLik(fam, xs, th + h, extra);
  if(!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) return NaN;
  return -(a - 2 * b + c) / (h * h);
}
/* the score ∂ℓ/∂θ, by a central first difference — the third route to the
   Fisher information, which is Var[score] rather than −E[ℓ″] */
function snScore(fam, xs, th, extra){
  const h = Math.max(1e-5, Math.abs(th) * 1e-4);
  const a = snLogLik(fam, xs, th - h, extra), c = snLogLik(fam, xs, th + h, extra);
  if(!Number.isFinite(a) || !Number.isFinite(c)) return NaN;
  return (c - a) / (2 * h);
}
/* Fisher information, by routes that share nothing but the family:
     closed      — the formula in SN_FAMS, times n
     scoreVar    — E[(∂ℓ/∂θ)²] estimated directly over many samples
     obsAtTruth  — the curvature of ℓ at the TRUE θ, averaged
     obs         — the curvature at each sample's own MLE, averaged
   The identity −E[ℓ″] = E[(ℓ′)²] is a theorem, and it holds only where the
   regularity conditions do, so the uniform family is EXPECTED to break it and
   the stage says so rather than hiding it.

   THE LAST TWO ARE NOT THE SAME QUANTITY, and conflating them is a defect this
   module shipped with. The Fisher information is −E[ℓ″(θ)] at the true θ; the
   OBSERVED information is −ℓ″(θ̂) at the estimate, which is what a package can
   actually compute. For a normal mean ℓ″ is a constant and the two coincide
   exactly — which is why testing only the normal family showed no problem. For
   an exponential rate ℓ″ = −n/λ², so at λ̂ the average is (n+1)/λ² against a
   Fisher information of n/λ²: biased high by a factor (n+1)/n, 4% at n = 25.
   Poisson and Bernoulli have the same shape of O(1/n) bias.

   That is `SITE-RULES` rule zero point 6 and MASTER-PLAN §3.3a item 4 in one:
   an estimator that CONVERGES to a quantity is not an estimator that HAS
   converged to it, and the default preset — a normal — is exactly where the
   difference is invisible. Found by ./auditclaims.ps1 driving the other four
   families; every unit test in place at the time used the normal. */
function snFisher(fam, p, n, trials, seed, extra){
  const F = SN_FAMS[fam], rng = snRng(seed);
  const scores = new Array(trials), curvs = new Array(trials),
        curvT = new Array(trials), mles = new Array(trials);
  const xs = new Array(n);
  for(let t = 0; t < trials; t++){
    for(let i = 0; i < n; i++) xs[i] = F.sample(p, rng);
    scores[t] = snScore(fam, xs, p.th, extra);
    curvT[t] = snObsInfo(fam, xs, p.th, extra);        /* at the TRUTH */
    const th = F.mle(xs, p);
    mles[t] = th;
    curvs[t] = snObsInfo(fam, xs, th, extra);          /* at the ESTIMATE */
  }
  const good = scores.filter(Number.isFinite);
  const sV = pbStats(good);
  const cV = pbStats(curvs.filter(Number.isFinite));
  const cT = pbStats(curvT.filter(Number.isFinite));
  const M = pbStats(mles.filter(Number.isFinite));
  return {
    obsAtTruth:cT.mean, obsAtTruthSE:cT.se, obsAtTruthN:cT.n,
    closed:F.fisher(p) * n,
    scoreVar:good.length ? good.reduce((a, v) => a + v * v, 0) / good.length : NaN,
    /* the standard error of a mean of squares, from the sample's own spread */
    scoreVarSE:good.length
      ? Math.sqrt(Math.max(0, good.reduce((a, v) => a + Math.pow(v * v, 2), 0) / good.length -
          Math.pow(good.reduce((a, v) => a + v * v, 0) / good.length, 2)) / good.length) : NaN,
    scoreMean:sV.mean, scoreMeanSE:sV.se, scoreN:good.length,
    obs:cV.mean, obsSE:cV.se, obsN:cV.n,
    mleStats:M, mles,
    /* the Cramér–Rao bound on the variance of ANY unbiased estimator — and the
       flag saying whether it is in force at all */
    crb:1 / (F.fisher(p) * n), regular:F.regular
  };
}
