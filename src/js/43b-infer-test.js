/* ============================================================================
   3ib · STATISTICAL INFERENCE — intervals, tests and posteriors

   Everything in this file is a statement about a PROCEDURE rather than about a
   number, and that is the one idea the wing exists to install. "95% confident"
   is not a probability that θ lies anywhere; it is the long-run rate at which a
   recipe, applied to fresh data, produces an interval containing the truth. So
   every claim here is checked by running the procedure many times and counting
   — and, wherever the count can be replaced by an exact sum, by doing that too.

   The binomial coverage below is the clearest case: for a proportion the sample
   space is finite, so the coverage of an interval is an exact finite sum over
   k = 0 … n rather than anything that needs simulating. Having both routes is
   what makes the Wald interval's behaviour legible — the wild oscillation in p
   is real structure, and a simulation alone would leave it looking like noise.

   Prefix: sn
   ============================================================================ */

/* ============================================================================
   THE t DISTRIBUTION — built here rather than approximated
   ============================================================================ */
/* 43-probstat's pbTTest takes its p-value from the NORMAL tail and says in its
   own comment that this is honest only past n ≈ 30. This wing is largely about
   what happens below n ≈ 30, so the real thing is needed. */
const snTPdf = (t, df) => Math.exp(
  snLgamma((df + 1) / 2) - snLgamma(df / 2) - 0.5 * Math.log(df * Math.PI) -
  ((df + 1) / 2) * Math.log(1 + t * t / df));

/* Simpson with a fixed even panel count — used wherever the integrand is smooth
   and the interval is finite. n must be even; it is forced rather than trusted. */
function snSimpson(f, a, b, n){
  n = Math.max(2, 2 * Math.round(n / 2));
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for(let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return s * h / 3;
}

/* ---- the regularized incomplete beta, I_x(a, b) ---------------------------
   The one special function this wing cannot do without: it is the t CDF, the
   Beta CDF and the binomial CDF, all three, and nothing in the site had it.
   Lentz's continued fraction, with the standard symmetry swap that keeps the
   fraction in its fast-converging half.

   Why not integrate the density instead, which would fit the site's habits
   better? Because the quantile routines below bisect on this a couple of
   hundred times per call, and because a fixed-panel Simpson over [0, 400] —
   which is where a t quantile search goes — puts a step of 1 through a density
   that has all of its mass inside |t| < 4. That version was written first and
   its 97.5% point for df = 4 came back at 2.9 instead of 2.776. The quadrature
   route is kept, below, as the CHECK on this one over the range where it is
   trustworthy, which is what it is actually good for. */
function snBetaInc(x, a, b){
  if(!(x > 0)) return 0;
  if(!(x < 1)) return 1;
  const lbeta = snLnBeta(a, b);
  const front = Math.exp(a * Math.log(x) + b * Math.log1p(-x) - lbeta);
  /* the fraction converges quickly only for x < (a+1)/(a+b+2); otherwise use
     I_x(a,b) = 1 − I_{1−x}(b,a) */
  if(x > (a + 1) / (a + b + 2)) return 1 - snBetaInc(1 - x, b, a);
  const tiny = 1e-300;
  let f = 1, c = 1, d = 0;
  for(let i = 0; i <= 300; i++){
    const m = Math.floor(i / 2);
    let num;
    if(i === 0) num = 1;
    else if(i % 2 === 0) num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    else num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + num * d;
    if(Math.abs(d) < tiny) d = tiny;
    d = 1 / d;
    c = 1 + num / c;
    if(Math.abs(c) < tiny) c = tiny;
    const cd = c * d;
    f *= cd;
    if(Math.abs(1 - cd) < 1e-15) break;
  }
  return front * (f - 1) / a;
}

/* the t CDF, from it. P(|T| > t) = I_{ν/(ν+t²)}(ν/2, ½) is the identity, and
   the form below is the one that does not cancel in the tail. */
function snTCdf(t, df){
  if(!Number.isFinite(t)) return t > 0 ? 1 : 0;
  const tail = 0.5 * snBetaInc(df / (df + t * t), df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}
/* the same CDF by integrating the density, which IS the definition — kept as
   the second route and honest only where a fixed-panel rule can be: past
   |t| ≈ 20 the interval is long, the integrand is a spike near the origin, and
   the panels no longer resolve it. It says so rather than returning a number. */
function snTCdfQuad(t, df){
  if(Math.abs(t) > 20) return NaN;
  return 0.5 + Math.sign(t) * snSimpson(x => snTPdf(x, df), 0, Math.abs(t), 4000);
}
/* the Beta CDF is the same function under its own name, which is worth spelling
   out: a t tail and a Beta probability are one identity apart */
const snBetaCdf = (x, a, b) => snBetaInc(x, a, b);
/* the quantile, by bisection on the CDF. Bisection rather than Newton because
   it cannot leave the bracket, and a quantile routine that wanders is a silent
   wrong interval rather than a visible failure. */
function snTQuant(q, df){
  if(q <= 0 || q >= 1) return q <= 0 ? -Infinity : Infinity;
  let lo = -400, hi = 400;
  for(let i = 0; i < 200; i++){
    const m = 0.5 * (lo + hi);
    if(snTCdf(m, df) < q) lo = m; else hi = m;
  }
  return 0.5 * (lo + hi);
}
/* the normal quantile, the same way, on pbNormCdf from the wing below */
function snZQuant(q){
  if(q <= 0 || q >= 1) return q <= 0 ? -Infinity : Infinity;
  let lo = -40, hi = 40;
  for(let i = 0; i < 200; i++){
    const m = 0.5 * (lo + hi);
    if(pbNormCdf(m, 0, 1) < q) lo = m; else hi = m;
  }
  return 0.5 * (lo + hi);
}

/* ============================================================================
   INTERVALS FOR A MEAN, and the coverage they actually deliver
   ============================================================================ */
/* The three recipes a first course meets, kept side by side because the whole
   point is that they are NOT interchangeable at small n. `sigma` is the true
   spread and is supplied only to the z-interval that claims to know it. */
const SN_MEAN_CIS = {
  zKnown: { n:'z, with σ known', needsSigma:true,
    make:(S, level, sigma) => { const z = snZQuant(0.5 + level / 2), h = z * sigma / Math.sqrt(S.n);
                                return [S.mean - h, S.mean + h]; },
    why:'The textbook interval, and the only one here whose coverage is exactly the stated level at every n. It needs a number nobody has: the true σ. It is in the wing as the control — the thing the other two are trying to be.' },
  zPlugin: { n:'z, with s substituted for σ',
    make:(S, level) => { const z = snZQuant(0.5 + level / 2), h = z * S.sd / Math.sqrt(S.n);
                         return [S.mean - h, S.mean + h]; },
    why:'The mistake, and it is the commonest one in applied work: take the interval that assumed σ was known and put the estimate in its place. The width is then random, and it is too short more often than it is too long, so the coverage falls BELOW the stated level — by ten points at n = 5. This is the entire reason Student went looking for another distribution.' },
  t: { n:'t, with n−1 degrees of freedom',
    make:(S, level) => { const q = snTQuant(0.5 + level / 2, S.n - 1), h = q * S.sd / Math.sqrt(S.n);
                         return [S.mean - h, S.mean + h]; },
    why:'The fix, and it is exact rather than approximate: (x̄ − μ)/(s/√n) really does follow a t distribution on n − 1 degrees of freedom when the data are normal, so the coverage is the stated level at EVERY n, not merely for large n. The price is a wider interval, and the widening is exactly the amount by which not knowing σ costs.' }
};

/* coverage of a mean interval, by simulation. The returned standard error is
   binomial — √(c(1−c)/trials) — so a shortfall can be told from a small run,
   which for a quantity whose whole content is a rate is the only honest way to
   report it. */
function snCoverMean(kind, n, level, trials, seed, mu, sigma, keep){
  const R = SN_MEAN_CIS[kind], rng = snRng(seed);
  const xs = new Array(n);
  const shown = [];
  let hit = 0, wsum = 0;
  for(let t = 0; t < trials; t++){
    for(let i = 0; i < n; i++) xs[i] = mu + sigma * snRandn(rng);
    const S = pbStats(xs);
    const I = R.make(S, level, sigma);
    const covers = I[0] <= mu && mu <= I[1];
    if(covers) hit++;
    wsum += I[1] - I[0];
    /* the first few are kept so the stage can DRAW them. This is the picture
       that does the teaching: the interval moves and the parameter does not,
       and the ones that miss are the point rather than an embarrassment. */
    if(shown.length < (keep || 0)) shown.push({ lo:I[0], hi:I[1], mid:S.mean, covers });
  }
  const c = hit / trials;
  return { cover:c, se:Math.sqrt(Math.max(0, c * (1 - c)) / trials),
           width:wsum / trials, level, trials, n, shown };
}

/* ============================================================================
   INTERVALS FOR A PROPORTION, and their EXACT coverage
   ============================================================================ */
const SN_PROP_CIS = {
  wald: { n:'Wald  p̂ ± z√(p̂(1−p̂)/n)',
    make:(k, n, level) => { const p = k / n, z = snZQuant(0.5 + level / 2);
                            const h = z * Math.sqrt(p * (1 - p) / n);
                            return [p - h, p + h]; },
    why:'The interval every introductory course prints. At k = 0 or k = n it has zero width and covers nothing at all, and its coverage oscillates violently with p — 87% here, 97% two hundredths away. It is the standard example of a method that is asymptotically correct and badly wrong at any n a reader will meet.' },
  wilson: { n:'Wilson score',
    make:(k, n, level) => {
      const p = k / n, z = snZQuant(0.5 + level / 2), z2 = z * z;
      const c = (p + z2 / (2 * n)) / (1 + z2 / n);
      const h = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / (1 + z2 / n);
      return [c - h, c + h];
    },
    why:'Invert the test instead of inverting an estimate: ask which p would not be rejected by the data, and solve the resulting quadratic exactly. It never leaves [0, 1] and it is never empty. Its coverage is <b>not</b> perfect — at n = 20 the worst value over p is about 84%, so it dips below the level too — but the comparison that matters is with the interval it replaces, whose worst case at the same n is 2%. Same century, same amount of arithmetic, and it is not what gets taught.' },
  agresti: { n:'Agresti–Coull  (add two successes and two failures)',
    make:(k, n, level) => {
      const z = snZQuant(0.5 + level / 2), z2 = z * z;
      const nt = n + z2, pt = (k + z2 / 2) / nt;
      const h = z * Math.sqrt(pt * (1 - pt) / nt);
      return [pt - h, pt + h];
    },
    why:'The Wald formula applied to a doctored count — roughly, add two successes and two failures and carry on. It sounds like a fudge and it is a very good one: it is a deliberate approximation to Wilson, and its coverage is nearly as good with a formula a reader can hold in their head.' },
  clopper: { n:'Clopper–Pearson  (exact)',
    make:(k, n, level) => {
      const a = (1 - level) / 2;
      /* solve the binomial tail equations by bisection. Exact means the coverage
         is never BELOW the level — which is not the same as being equal to it,
         and the difference is the point of the experiment. */
      const lo = k === 0 ? 0 : snBisect(p => snBinomTailGE(k, n, p) - a, 0, 1);
      const hi = k === n ? 1 : snBisect(p => snBinomTailLE(k, n, p) - a, 0, 1);
      return [lo, hi];
    },
    why:'Built from the binomial itself with no normal approximation anywhere. It guarantees AT LEAST the stated coverage for every p — and pays for the guarantee by usually delivering more, which means intervals wider than the data require. "Exact" names the guarantee, not the coverage, and readers routinely take it for the second.' }
};
/* the two binomial tails, summed rather than approximated */
function snBinomPmf(k, n, p){
  if(k < 0 || k > n) return 0;
  if(p <= 0) return k === 0 ? 1 : 0;
  if(p >= 1) return k === n ? 1 : 0;
  return Math.exp(snLnChoose(n, k) + k * Math.log(p) + (n - k) * Math.log1p(-p));
}
function snBinomTailGE(k, n, p){ let s = 0; for(let i = k; i <= n; i++) s += snBinomPmf(i, n, p); return s; }
function snBinomTailLE(k, n, p){ let s = 0; for(let i = 0; i <= k; i++) s += snBinomPmf(i, n, p); return s; }
/* bisection on a monotone function with a sign change on [a, b] */
function snBisect(f, a, b){
  let lo = a, hi = b, flo = f(a);
  for(let i = 0; i < 100; i++){
    const m = 0.5 * (lo + hi), fm = f(m);
    if((fm < 0) === (flo < 0)){ lo = m; flo = fm; } else hi = m;
  }
  return 0.5 * (lo + hi);
}

/* THE EXACT COVERAGE of a proportion interval at a given p.

   No simulation: the sample space is {0, 1, …, n}, every outcome has a known
   probability, and the coverage is the sum of the probabilities of the outcomes
   whose interval contains p. It is a finite sum of n + 1 terms and it is the
   answer, not an estimate of the answer — which is why the sawtooth it produces
   is real structure rather than Monte Carlo noise. */
function snCoverPropExact(method, n, p, level){
  const M = SN_PROP_CIS[method];
  let c = 0;
  for(let k = 0; k <= n; k++){
    const I = M.make(k, n, level);
    if(I[0] <= p && p <= I[1]) c += snBinomPmf(k, n, p);
  }
  return c;
}
/* the same coverage swept across p, for drawing. The sweep is where the Wald
   interval's problem lives: no single p reveals it. */
function snCoverPropSweep(method, n, level, N){
  const out = new Array(N + 1);
  for(let i = 0; i <= N; i++){
    const p = 0.001 + (0.998 * i) / N;
    out[i] = { x:p, y:snCoverPropExact(method, n, p, level) };
  }
  return out;
}
/* the same coverage by simulation, which is what a reader would reach for and
   is strictly the worse route here — it is kept because watching it land on the
   exact curve is what makes the exact curve believable, and because the gap
   between them is a measurement of the simulation's own error rather than of
   anything about the interval */
function snCoverPropSim(method, n, p, level, trials, seed){
  const M = SN_PROP_CIS[method], rng = snRng(seed);
  let hit = 0;
  for(let t = 0; t < trials; t++){
    let k = 0;
    for(let i = 0; i < n; i++) if(rng() < p) k++;
    const I = M.make(k, n, level);
    if(I[0] <= p && p <= I[1]) hit++;
  }
  const c = hit / trials;
  return { cover:c, se:Math.sqrt(Math.max(0, c * (1 - c)) / trials), trials };
}
/* and the average coverage over p, so the sweep has a single summary number */
function snCoverPropMean(method, n, level, N){
  const S = snCoverPropSweep(method, n, level, N || 400);
  return S.reduce((a, q) => a + q.y, 0) / S.length;
}

/* ============================================================================
   TESTING
   ============================================================================ */
/* a one-sample t test with the p-value from the real t distribution */
function snTTest(xs, mu0){
  const S = pbStats(xs);
  const t = (S.mean - mu0) / S.se;
  const df = S.n - 1;
  const p = 2 * (1 - snTCdf(Math.abs(t), df));
  return { t, df, p, stats:S };
}
/* the null distribution, run: draw samples from a world where H₀ is TRUE, test
   each one, and keep the statistic and the p-value. Two facts fall out and both
   are checked rather than asserted — the statistic follows t on n−1 degrees of
   freedom, and the p-values are uniform on [0, 1]. */
function snNullRun(n, trials, seed, alpha, sigma){
  const rng = snRng(seed);
  const xs = new Array(n), ts = new Array(trials), ps = new Array(trials);
  let rej = 0;
  for(let m = 0; m < trials; m++){
    for(let i = 0; i < n; i++) xs[i] = sigma * snRandn(rng);   /* μ = 0, and H₀ says μ = 0 */
    const T = snTTest(xs, 0);
    ts[m] = T.t; ps[m] = T.p;
    if(T.p < alpha) rej++;
  }
  const rate = rej / trials;
  /* the KS distance of the p-values from uniform, against the 5% critical value
     1.358/√m. This is the check that the p-value MEANS what it says: not that
     the rejection rate at one α is right, but that it is right at every α at
     once, which is exactly what a uniform distribution asserts. */
  const sorted = ps.slice().sort((a, b) => a - b);
  let ks = 0;
  for(let i = 0; i < trials; i++)
    ks = Math.max(ks, Math.abs(sorted[i] - i / trials), Math.abs((i + 1) / trials - sorted[i]));
  return { ts, ps, rate, rateSE:Math.sqrt(Math.max(0, rate * (1 - rate)) / trials),
           alpha, ks, ksCrit:1.358 / Math.sqrt(trials), n, trials };
}
/* power: the chance of rejecting when H₀ is false by δ.
   Closed form, for a z test with σ known — the normal shift, both tails. */
function snPowerClosed(n, sigma, delta, alpha){
  const z = snZQuant(1 - alpha / 2), s = delta * Math.sqrt(n) / sigma;
  return (1 - pbNormCdf(z - s, 0, 1)) + pbNormCdf(-z - s, 0, 1);
}
/* and by running it, with the same z test so the two routes are comparable */
function snPowerSim(n, sigma, delta, alpha, trials, seed){
  const rng = snRng(seed), z = snZQuant(1 - alpha / 2);
  const xs = new Array(n);
  let rej = 0;
  for(let m = 0; m < trials; m++){
    let s = 0;
    for(let i = 0; i < n; i++){ xs[i] = delta + sigma * snRandn(rng); s += xs[i]; }
    if(Math.abs((s / n) / (sigma / Math.sqrt(n))) > z) rej++;
  }
  const r = rej / trials;
  return { power:r, se:Math.sqrt(Math.max(0, r * (1 - r)) / trials), trials };
}
/* the sample size that buys a stated power, by bisection on the closed form —
   the calculation that should happen before an experiment and usually does not */
function snPowerN(sigma, delta, alpha, want){
  let lo = 2, hi = 4;
  while(snPowerClosed(hi, sigma, delta, alpha) < want && hi < 1e7) hi *= 2;
  while(hi - lo > 1){
    const m = Math.floor((lo + hi) / 2);
    if(snPowerClosed(m, sigma, delta, alpha) < want) lo = m; else hi = m;
  }
  return hi;
}

/* ---- many tests at once ---------------------------------------------------
   The family-wise error rate: run m independent tests in a world where every
   null is true, and count the runs in which at least one is rejected. */
/* All three decision rules are scored on THE SAME simulated p-values, in one
   pass. That is cheaper, and it is also the better comparison: the three differ
   only in where they cut, so giving each its own random data would add a
   difference that is not the one being studied. */
function snMultiRun(m, alpha, n, trials, seed){
  const rng = snRng(seed);
  const xs = new Array(n);
  const acc = { none:{ any:0, tot:0 }, bonf:{ any:0, tot:0 }, holm:{ any:0, tot:0 } };
  for(let r = 0; r < trials; r++){
    const ps = new Array(m);
    for(let j = 0; j < m; j++){
      for(let i = 0; i < n; i++) xs[i] = snRandn(rng);      /* every null is TRUE */
      ps[j] = snTTest(xs, 0).p;
    }
    let kn = 0, kb = 0;
    for(let j = 0; j < m; j++){
      if(ps[j] < alpha) kn++;
      if(ps[j] < alpha / m) kb++;
    }
    /* Holm: sort, compare the j-th smallest against α/(m−j), stop at the first
       that survives — the same guarantee as Bonferroni and uniformly more
       rejections, which is why Bonferroni is the wrong default rather than
       merely the conservative one. */
    const ord = ps.slice().sort((a, b) => a - b);
    let kh = 0;
    for(let j = 0; j < m; j++){ if(ord[j] < alpha / (m - j)) kh++; else break; }
    acc.none.tot += kn; if(kn > 0) acc.none.any++;
    acc.bonf.tot += kb; if(kb > 0) acc.bonf.any++;
    acc.holm.tot += kh; if(kh > 0) acc.holm.any++;
  }
  const pack = a => {
    const r = a.any / trials;
    return { fwer:r, se:Math.sqrt(Math.max(0, r * (1 - r)) / trials), perRun:a.tot / trials };
  };
  return { none:pack(acc.none), bonf:pack(acc.bonf), holm:pack(acc.holm),
           m, alpha, trials,
           /* the closed form exists for the uncorrected rule only — the tests
              are independent there, so the chance of no false alarm is
              (1−α)^m. Bonferroni and Holm have no equally simple one, and
              quoting this for them would be the error the wing is against. */
           closed:1 - Math.pow(1 - alpha, m) };
}

/* ---- the permutation test -------------------------------------------------
   The one test in the wing that assumes nothing about the distribution: if the
   labels are meaningless, then every way of dealing them out is equally likely,
   so the exact null distribution is the list of all of them.

   ENUMERATION IS BOUNDED. C(n, k) is a quantity the reader's own slider
   controls, and C(24, 12) is 2.7 million samples of work — a hang, not a slow
   frame. The cap refuses and SAYS it refused, because a truncated enumeration
   is a wrong exact answer that looks like a right one. */
const SN_PERM_CAP = 300000;
function snPermExact(a, b){
  const n1 = a.length, N = n1 + b.length;
  const total = Math.round(Math.exp(snLnChoose(N, n1)));
  if(!(total <= SN_PERM_CAP))
    return { ok:false, total, cap:SN_PERM_CAP };
  const all = a.concat(b);
  const obs = snMeanDiff(a, b);
  let ge = 0, count = 0;
  const idx = new Array(n1);
  /* every choice of which n1 of the N values carry the first label */
  (function pick(start, depth){
    if(depth === n1){
      let s1 = 0;
      const inA = new Array(N).fill(false);
      for(let i = 0; i < n1; i++){ inA[idx[i]] = true; s1 += all[idx[i]]; }
      let s2 = 0;
      for(let i = 0; i < N; i++) if(!inA[i]) s2 += all[i];
      const d = s1 / n1 - s2 / (N - n1);
      if(Math.abs(d) >= Math.abs(obs) - 1e-12) ge++;
      count++;
      return;
    }
    for(let i = start; i <= N - (n1 - depth); i++){ idx[depth] = i; pick(i + 1, depth + 1); }
  })(0, 0);
  return { ok:true, total:count, p:ge / count, obs, ge };
}
/* the null distribution itself — every relabelling's statistic, for drawing.
   Same enumeration and the same cap; kept separate so the p-value routine does
   not have to hold 300 000 numbers it has no use for. */
function snPermDist(a, b){
  const n1 = a.length, N = n1 + b.length;
  if(!(Math.round(Math.exp(snLnChoose(N, n1))) <= SN_PERM_CAP)) return null;
  const all = a.concat(b), out = [], idx = new Array(n1);
  (function pick(start, depth){
    if(depth === n1){
      let s1 = 0;
      const inA = new Array(N).fill(false);
      for(let i = 0; i < n1; i++){ inA[idx[i]] = true; s1 += all[idx[i]]; }
      let s2 = 0;
      for(let i = 0; i < N; i++) if(!inA[i]) s2 += all[i];
      out.push(s1 / n1 - s2 / (N - n1));
      return;
    }
    for(let i = start; i <= N - (n1 - depth); i++){ idx[depth] = i; pick(i + 1, depth + 1); }
  })(0, 0);
  return out;
}

/* Welch's two-sample t test — the comparison a permutation test is against.
   Welch rather than the pooled form because the pooled one assumes the two
   groups share a variance, and the outlier preset is precisely a case where
   they do not: assuming it there would make the t test lose for a second reason
   and muddle the comparison the stage is drawing. */
function snTTest2(a, b){
  const A = pbStats(a), B = pbStats(b);
  const se = Math.sqrt(A.vari / A.n + B.vari / B.n);
  const t = (A.mean - B.mean) / se;
  /* Welch–Satterthwaite: the degrees of freedom are not an integer, and the t
     distribution here is defined for any positive real df */
  const num = Math.pow(A.vari / A.n + B.vari / B.n, 2);
  const den = Math.pow(A.vari / A.n, 2) / (A.n - 1) + Math.pow(B.vari / B.n, 2) / (B.n - 1);
  const df = den > 0 ? num / den : A.n + B.n - 2;
  return { t, df, se, p:2 * (1 - snTCdf(Math.abs(t), df)), A, B, diff:A.mean - B.mean };
}

/* the sampled version, which is what anybody actually runs */
function snPermSampled(a, b, iters, seed){
  const n1 = a.length, all = a.concat(b), N = all.length;
  const rng = snRng(seed);
  const obs = snMeanDiff(a, b);
  const pool = all.slice();
  let ge = 0;
  for(let it = 0; it < iters; it++){
    for(let i = N - 1; i > 0; i--){                     /* Fisher–Yates on the seeded stream */
      const j = Math.floor(rng() * (i + 1));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    let s1 = 0;
    for(let i = 0; i < n1; i++) s1 += pool[i];
    let s2 = 0;
    for(let i = n1; i < N; i++) s2 += pool[i];
    if(Math.abs(s1 / n1 - s2 / (N - n1)) >= Math.abs(obs) - 1e-12) ge++;
  }
  /* the +1 in both places is not a fudge: the observed labelling IS one of the
     permutations, and leaving it out can return a p-value of exactly 0, which
     is a probability no finite test can deliver */
  const p = (ge + 1) / (iters + 1);
  return { p, obs, iters, se:Math.sqrt(Math.max(0, p * (1 - p)) / iters) };
}
const snMeanDiff = (a, b) =>
  a.reduce((s, v) => s + v, 0) / a.length - b.reduce((s, v) => s + v, 0) / b.length;

/* ---- two groups, typed by the reader ---------------------------------------
   Two lines of numbers, separated by commas or spaces. PARSERS NEVER THROW:
   this collects every complaint with the line it came from and returns them
   all, so a reader fixing three mistakes is told about three rather than
   discovering them one at a time.

   Each value goes through mathNum, the site's shared "a number somebody typed"
   parser, so 3/4, 2^5 and sqrt(2) are all accepted — the same arithmetic every
   other numeric box on the site takes. */
function snParseGroups(text){
  const errs = [];
  const lines = String(text == null ? '' : text).split('\n');
  const groups = [];
  const labels = [];
  for(let i = 0; i < lines.length; i++){
    const raw = lines[i].trim();
    if(!raw) continue;
    /* an optional "name:" in front, so a reader can label their groups */
    const m = /^([^:]{1,24}):(.*)$/.exec(raw);
    const label = m ? m[1].trim() : '';
    const body = (m ? m[2] : raw).trim();
    if(!body){ errs.push({ line:i + 1, msg:'this line names a group but gives it no numbers' }); continue; }
    const toks = body.split(/[,\s]+/).filter(t => t.length);
    const vals = [];
    for(const t of toks){
      const v = mathNum(t);
      if(v === null || !Number.isFinite(v))
        errs.push({ line:i + 1, msg:'“' + t + '” is not a number I can read' });
      else vals.push(v);
    }
    if(vals.length) { groups.push(vals); labels.push(label || ('group ' + String.fromCharCode(65 + groups.length - 1))); }
  }
  if(groups.length < 2 && !errs.length)
    errs.push({ line:groups.length + 1, msg:'two groups are needed — put the second on its own line' });
  for(let g = 0; g < groups.length && g < 2; g++)
    if(groups[g].length < 2)
      errs.push({ line:g + 1, msg:'a group needs at least two observations to have a mean worth comparing' });
  return { a:groups[0] || [], b:groups[1] || [], labels, errs, ok:errs.length === 0 && groups.length >= 2 };
}

/* ============================================================================
   BAYES
   ============================================================================ */
/* the Beta density, through the log form so large a, b do not overflow */
const snBetaPdf = (x, a, b) => (x <= 0 || x >= 1) ? 0
  : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log1p(-x) - snLnBeta(a, b));

const SN_PRIORS = {
  flat:    { n:'flat — Beta(1, 1)', a:1, b:1,
    why:'Every value of p equally likely. It is the prior people reach for when they want to assume nothing, and it is worth noticing that it is still an assumption: flat in p is not flat in the odds, or in the log odds, and a prior cannot be uninformative about everything at once.' },
  jeff:    { n:'Jeffreys — Beta(½, ½)', a:0.5, b:0.5,
    why:'The prior built to be invariant under reparametrisation: √(Fisher information), which for a proportion piles weight near 0 and 1. It is the answer to the objection above, and it costs the intuitive flatness to get there.' },
  sceptic: { n:'sceptical — Beta(20, 20)', a:20, b:20,
    why:'Somebody who is fairly sure the coin is fair. Worth 38 observations of prior data, so it takes a great deal of evidence to move — which is exactly right if the belief was earned and exactly wrong if it was not.' },
  keen:    { n:'optimistic — Beta(8, 2)', a:8, b:2,
    why:'Somebody who expects about 80%. Included so the wash-out experiment has two priors that genuinely disagree, and so a reader can watch how much data it takes to make the disagreement stop mattering.' }
};

/* THE POSTERIOR BY QUADRATURE — prior × likelihood, normalised by integrating.
   This route knows no conjugacy: it would work for any prior at all, including
   ones with no closed form, and it is how the arithmetic is really done outside
   the two or three textbook cases.

   TWO THINGS A UNIFORM GRID GETS WRONG HERE, and the first version had both.

   1 · THE ENDPOINTS. Beta(½, ½) behaves like x^(−½) at 0, which is integrable
       and infinite. A midpoint rule never evaluates the endpoint, so it returns
       a finite number — and that is exactly why the defect was not obvious: the
       answer was wrong by 2.2% at k = 0 with nothing raised and no infinity
       printed. "Midpoint does not look at the singularity" is not the same
       claim as "midpoint resolves it", and the first version's comment asserted
       the first while needing the second.

       The cure is the substitution x = sin²(πt/2), whose Jacobian
       (π/2)sin(πt) vanishes at both ends at exactly the rate an inverse square
       root diverges — so x^(−½)dx becomes π dt, bounded, and the rule has a
       smooth integrand again. It is the arcsine clustering used for endpoint
       singularities everywhere, and it costs one line.

   2 · THE MIDDLE. A posterior after n observations has width about 1/(2√n), so
       a fixed 700-cell grid stops resolving it around n = 10⁵ — and the
       wash-out sweep runs to 2×10⁵. A grid too coarse for its integrand does
       not announce itself either. The cell count therefore grows with √n, and
       `cells` in the result says what was actually used so a caller can check
       rather than assume. */
function snPostGrid(a0, b0, k, n, N){
  /* enough cells that the posterior's own width spans a good many of them.
     The substitution coarsens the middle by π/2, which is included. */
  const want = Math.ceil(120 * Math.sqrt(n + 1));
  const M = Math.min(20000, Math.max(N || 2000, want));
  const xs = new Array(M), w = new Array(M), lg = new Array(M);
  for(let i = 0; i < M; i++){
    const t = (i + 0.5) / M;
    const s = Math.sin(Math.PI * t / 2);
    xs[i] = s * s;                                  /* x = sin²(πt/2) */
    w[i] = (Math.PI / 2) * Math.sin(Math.PI * t) / M;   /* dx, per cell */
    /* prior × likelihood, in logs, so n = 200 000 does not underflow to zero */
    lg[i] = (a0 - 1) * Math.log(xs[i]) + (b0 - 1) * Math.log1p(-xs[i]) +
            k * Math.log(xs[i]) + (n - k) * Math.log1p(-xs[i]);
  }
  const mx = Math.max.apply(null, lg);
  let Z = 0;
  const u = new Array(M);
  for(let i = 0; i < M; i++){ u[i] = Math.exp(lg[i] - mx); Z += u[i] * w[i]; }
  const dens = u.map(v => v / Z);
  let mean = 0, m2 = 0;
  for(let i = 0; i < M; i++){
    mean += xs[i] * dens[i] * w[i];
    m2 += xs[i] * xs[i] * dens[i] * w[i];
  }
  /* THE RUNNING CDF, EVALUATED AT THE CELL CENTRES — which is where xs is.

     The obvious accumulation, c += dens[i]*w[i] with cdf[i] taken alongside
     xs[i], pairs the integral up to the cell's RIGHT EDGE with the cell's
     CENTRE. That is a systematic half-cell offset, so every quantile read off
     it is half a cell low — an O(cell) error that interpolating between the
     points cannot remove, because it displaces the points themselves. It was
     invisible until ./auditsides.ps1 compared the grid's credible interval
     against the closed-form one at a second preset.

     Taking half of the current cell puts the value where x actually is, and
     the interpolation between centres is then genuinely O(cell²). */
  const cdf = new Array(M);
  let c = 0;
  for(let i = 0; i < M; i++){
    cdf[i] = c + 0.5 * dens[i] * w[i];
    c += dens[i] * w[i];
  }
  return { xs, dens, cdf, w, mean, vari:m2 - mean * mean, N:M, cells:M,
           mode:xs[dens.indexOf(Math.max.apply(null, dens))] };
}
/* the conjugate closed form, which is the second route and shares nothing with
   the grid but the data */
const snBetaPost = (a0, b0, k, n) => ({ a:a0 + k, b:b0 + n - k,
  mean:(a0 + k) / (a0 + b0 + n),
  vari:((a0 + k) * (b0 + n - k)) /
       (Math.pow(a0 + b0 + n, 2) * (a0 + b0 + n + 1)),
  mode:(a0 + k > 1 && b0 + n - k > 1) ? (a0 + k - 1) / (a0 + b0 + n - 2) : NaN });

/* an equal-tailed credible interval, from whichever route */
/* The crossing is INTERPOLATED inside the cell, not snapped to its edge. A
   snapped endpoint is only accurate to one cell, so comparing the grid interval
   against the closed-form one reports the grid's resolution rather than any
   disagreement — ./auditsides.ps1 flagged exactly that, as a claim that was
   exact at one preset and 3.7e-4 out at another purely because the cells fell
   differently. Linear interpolation on the CDF costs one line and is O(cell²). */
function snCredibleGrid(G, level){
  const lo = (1 - level) / 2, hi = 1 - lo;
  const at = q => {
    for(let i = 0; i < G.N; i++){
      if(G.cdf[i] < q) continue;
      if(i === 0) return G.xs[0];
      const c0 = G.cdf[i - 1], c1 = G.cdf[i];
      if(!(c1 > c0)) return G.xs[i];
      const f = (q - c0) / (c1 - c0);
      return G.xs[i - 1] + f * (G.xs[i] - G.xs[i - 1]);
    }
    return 1;
  };
  return [at(lo), at(hi)];
}
function snCredibleBeta(a, b, level){
  const lo = (1 - level) / 2;
  return [snBisect(x => snBetaCdf(x, a, b) - lo, 0, 1),
          snBisect(x => snBetaCdf(x, a, b) - (1 - lo), 0, 1)];
}

/* the posterior mean is a WEIGHTED AVERAGE of the prior mean and the data's own
   estimate, and the weights are counts of observations — the cleanest statement
   of what a prior is worth, and it is exact rather than approximate */
function snPostBlend(a0, b0, k, n){
  const nPrior = a0 + b0, priorMean = a0 / nPrior, mle = n > 0 ? k / n : NaN;
  const wPrior = nPrior / (nPrior + n), wData = n / (nPrior + n);
  return { nPrior, priorMean, mle, wPrior, wData,
           blend:wPrior * priorMean + wData * mle,
           exact:(a0 + k) / (a0 + b0 + n) };
}
/* how much data it takes for two priors to stop mattering: the total-variation
   distance between the two posteriors, ½∫|f₁ − f₂|, swept over n with the
   observed proportion held fixed.

   HELD FIXED IS THE HARD PART, and the first version did not manage it. k must
   be a whole number of successes, so at p = ½ an odd n cannot have proportion ½
   at all — k = round(1.5) = 2 gives 0.667, which is data of a different kind,
   and the curve came back alternating: 0.79 at n = 2, 0.82 at n = 3, 0.74 at
   n = 4. Nothing was wrong with the distance; the sequence was not a sweep of
   one quantity. So the step is snapped to the smallest d that makes p·d whole,
   and every point on the curve then really is at the proportion the axis names.
   An irrational-looking p has no such d, and the sweep says so per point rather
   than quietly plotting something else. */
function snPriorWash(pA, pB, prop, nMax, N){
  const out = [];
  let d = 1;
  for(let t = 1; t <= 20; t++)
    if(Math.abs(prop * t - Math.round(prop * t)) < 1e-9){ d = t; break; }
  for(let n = d; n <= nMax; n = n < 10 * d ? n + d : d * Math.round(n * 1.4 / d)){
    const k = Math.round(prop * n);
    const GA = snPostGrid(pA.a, pA.b, k, n, N || 800);
    const GB = snPostGrid(pB.a, pB.b, k, n, N || 800);
    /* the two grids share a cell layout because they share a and n, so the
       densities may be differenced cell by cell against the same weights */
    let tv = 0;
    for(let i = 0; i < GA.N; i++) tv += Math.abs(GA.dens[i] - GB.dens[i]) * GA.w[i];
    out.push({ x:n, y:0.5 * tv, meanA:GA.mean, meanB:GB.mean, k,
               /* the proportion actually achieved, so a point that could not sit
                  at the requested one is visible rather than silent */
               got:k / n, exact:Math.abs(k / n - prop) < 1e-12 });
  }
  return out;
}

/* ---- the diagnostic test --------------------------------------------------
   Bayes' rule against a population you can count. The second route builds an
   actual cohort of `pop` people, rounds every group to a whole person, and
   divides — which is how the answer becomes believable rather than merely
   correct, and the rounding gap is reported rather than hidden. */
function snDiagnostic(prev, sens, spec, pop){
  const post = (sens * prev) / (sens * prev + (1 - spec) * (1 - prev));
  const ill = Math.round(pop * prev), well = pop - ill;
  const tp = Math.round(ill * sens), fp = Math.round(well * (1 - spec));
  return { post, prev, sens, spec, pop, ill, well, tp, fp,
           fn:ill - tp, tn:well - fp,
           counted:(tp + fp) > 0 ? tp / (tp + fp) : NaN,
           posPop:tp + fp,
           /* the quantity people substitute for the answer, so the readout can
              put the two side by side and name the confusion */
           sensRead:sens };
}
