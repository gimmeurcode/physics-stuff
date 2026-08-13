/* ============================================================================
   3i · PROBABILITY AND STATISTICS ENGINE
   Distributions defined by their densities, with every moment obtained by
   integrating rather than quoted; sampling done for real so the central limit
   theorem is watched rather than asserted; and inference computed from the
   samples actually drawn.

   Prefix: pb
   ============================================================================ */

const pbErf = x => {                    /* Abramowitz & Stegun 7.1.26 */
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t
            - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
};
const pbNormCdf = (x, mu, sg) => 0.5 * (1 + pbErf((x - (mu || 0)) / ((sg === undefined ? 1 : sg) * Math.SQRT2)));
function pbGamma(z){                    /* Lanczos, for the t and chi-squared densities */
  const g = 7, C = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if(z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * pbGamma(1 - z));
  z -= 1;
  let x = C[0];
  for(let i = 1; i < g + 2; i++) x += C[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

/* The distributions on offer. Each carries its density, its support, and the
   closed forms for mean and variance — which the stage then checks by
   integrating the density itself, so the table is evidence rather than dogma. */
const PB_DISTS = {
  normal: { n:'normal', cont:true, lo:-5, hi:5, ilo:p => p.a - 12 * p.b, ihi:p => p.a + 12 * p.b,
    pdf:(x, p) => Math.exp(-0.5 * Math.pow((x - p.a) / p.b, 2)) / (p.b * Math.sqrt(2 * Math.PI)),
    par:{ a:0, b:1 }, pn:['mean μ', 'sd σ'], mean:p => p.a, vari:p => p.b * p.b,
    sample:p => p.a + p.b * pbRandn(),
    note:'The limit every average tends towards, which is why it is everywhere. Its density is fixed by two numbers and nothing else.' },
  uniform: { n:'uniform', cont:true, lo:-1, hi:2,
    pdf:(x, p) => (x >= p.a && x <= p.b ? 1 / (p.b - p.a) : 0),
    par:{ a:0, b:1 }, pn:['from a', 'to b'], mean:p => (p.a + p.b) / 2,
    vari:p => Math.pow(p.b - p.a, 2) / 12,
    sample:p => p.a + Math.random() * (p.b - p.a),
    note:'Maximum ignorance on an interval. Its variance is (b−a)²/12, and averaging just a handful of them already looks normal.' },
  expo: { n:'exponential', cont:true, lo:0, hi:6, ihi:p => 45 / p.a,
    pdf:(x, p) => (x >= 0 ? p.a * Math.exp(-p.a * x) : 0),
    par:{ a:1, b:0 }, pn:['rate λ', '—'], mean:p => 1 / p.a, vari:p => 1 / (p.a * p.a),
    sample:p => -Math.log(1 - Math.random()) / p.a,
    note:'The waiting time between events with no memory. Strongly skewed, which makes it the best test of the central limit theorem.' },
  binom: { n:'binomial', cont:false, lo:0, hi:20,
    pdf:(k, p) => {
      const n = Math.round(p.a), q = p.b;
      if(k < 0 || k > n || Math.abs(k - Math.round(k)) > 1e-9) return 0;
      k = Math.round(k);
      let c = 1;
      for(let i = 0; i < k; i++) c = c * (n - i) / (i + 1);
      return c * Math.pow(q, k) * Math.pow(1 - q, n - k);
    },
    par:{ a:12, b:0.4 }, pn:['trials n', 'p'], mean:p => p.a * p.b,
    vari:p => p.a * p.b * (1 - p.b),
    sample:p => { let k = 0; for(let i = 0; i < Math.round(p.a); i++) if(Math.random() < p.b) k++; return k; },
    note:'Counting successes in n independent trials. For large n it is well approximated by a normal — which is the central limit theorem in its original form.' },
  poisson: { n:'Poisson', cont:false, lo:0, hi:20,
    pdf:(k, p) => {
      if(k < 0 || Math.abs(k - Math.round(k)) > 1e-9) return 0;
      k = Math.round(k);
      let lf = 0;
      for(let i = 2; i <= k; i++) lf += Math.log(i);
      return Math.exp(-p.a + k * Math.log(p.a) - lf);
    },
    par:{ a:4, b:0 }, pn:['rate λ', '—'], mean:p => p.a, vari:p => p.a,
    sample:p => { let L = Math.exp(-p.a), k = 0, u = Math.random();
                  while(u > L){ u *= Math.random(); k++; } return k; },
    note:'Rare events in a fixed window — the binomial with n large and p small. Its mean and variance are the same number, which is its signature.' }
};
/* Box–Muller, with the pair cached so a call costs half a transform */
let _pbSpare = null;
function pbRandn(){
  if(_pbSpare !== null){ const v = _pbSpare; _pbSpare = null; return v; }
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  const r = Math.sqrt(-2 * Math.log(u)), th = 2 * Math.PI * v;
  _pbSpare = r * Math.sin(th);
  return r * Math.cos(th);
}

/* Moments by integration (or summation), so the table's mean and variance are
   confirmed rather than trusted. */
/* Moments integrate over the distribution's SUPPORT, which is not the plot
   window: the exponential's tail runs to infinity while the picture stops at 6,
   and integrating only what is drawn loses e^(-6) of the probability. A
   distribution may therefore give ilo/ihi as functions of its parameters. */
function pbMoments(D, p){
  const lo = D.ilo ? D.ilo(p) : D.lo;
  const hi = D.ihi ? D.ihi(p) : D.hi;
  if(D.cont){
    const n = 4000, h = (hi - lo) / n;
    let m0 = 0, m1 = 0, m2 = 0;
    for(let i = 0; i <= n; i++){
      const x = lo + i * h, w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
      const f = D.pdf(x, p);
      m0 += w * f; m1 += w * x * f; m2 += w * x * x * f;
    }
    const s = h / 3;
    m0 *= s; m1 *= s; m2 *= s;
    return { total:m0, mean:m1 / m0, vari:m2 / m0 - (m1 / m0) * (m1 / m0) };
  }
  let m0 = 0, m1 = 0, m2 = 0;
  for(let k = 0; k <= 200; k++){
    const f = D.pdf(k, p);
    m0 += f; m1 += k * f; m2 += k * k * f;
  }
  return { total:m0, mean:m1 / m0, vari:m2 / m0 - (m1 / m0) * (m1 / m0) };
}

/* summary statistics of a sample */
function pbStats(xs){
  const n = xs.length;
  if(!n) return { n:0 };
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const ss = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0);
  const sd = Math.sqrt(ss / Math.max(1, n - 1));      // Bessel's correction
  const sorted = xs.slice().sort((a, b) => a - b);
  const q = t => sorted[Math.min(n - 1, Math.max(0, Math.floor(t * (n - 1))))];
  return { n, mean, vari:ss / Math.max(1, n - 1), sd, se:sd / Math.sqrt(n),
           min:sorted[0], max:sorted[n - 1], median:q(0.5), q1:q(0.25), q3:q(0.75) };
}
/* a histogram, returned as bin centres and counts */
function pbHist(xs, lo, hi, bins){
  const B = bins || 30, w = (hi - lo) / B;
  const c = new Array(B).fill(0);
  for(const x of xs){
    const i = Math.floor((x - lo) / w);
    if(i >= 0 && i < B) c[i]++;
  }
  return { centres:c.map((_, i) => lo + (i + 0.5) * w), counts:c, w,
           density:c.map(v => v / (xs.length * w)) };
}

/* the central limit theorem, run rather than quoted: draw n from any
   distribution, average them, repeat, and look at what the averages do */
function pbCLT(D, p, n, trials){
  const out = new Array(trials);
  for(let t = 0; t < trials; t++){
    let s = 0;
    for(let i = 0; i < n; i++) s += D.sample(p);
    out[t] = s / n;
  }
  return out;
}

/* ---- inference ----------------------------------------------------------- */
/* a z-test / t-test on one sample, with the p-value from the normal tail */
function pbTTest(xs, mu0){
  const S = pbStats(xs);
  const t = (S.mean - mu0) / S.se;
  /* two-sided normal approximation — honest for n above ~30, which the stage says */
  const p = 2 * (1 - pbNormCdf(Math.abs(t), 0, 1));
  return { t, p, df:S.n - 1, stats:S,
           ci95:[S.mean - 1.96 * S.se, S.mean + 1.96 * S.se] };
}
/* Pearson correlation, and the regression line, with r² decomposed */
function pbRegress(xs, ys){
  const n = xs.length;
  if(n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for(let i = 0; i < n; i++){
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) * (xs[i] - mx);
    syy += (ys[i] - my) * (ys[i] - my);
  }
  const slope = sxx > 0 ? sxy / sxx : 0;
  const inter = my - slope * mx;
  const r = (sxx > 0 && syy > 0) ? sxy / Math.sqrt(sxx * syy) : 0;
  const fit = xs.map(x => inter + slope * x);
  const ssRes = ys.reduce((a, y, i) => a + (y - fit[i]) * (y - fit[i]), 0);
  return { slope, inter, r, r2:r * r, mx, my, sxx, syy, sxy,
           ssTot:syy, ssRes, ssReg:syy - ssRes,
           /* the same line the least-squares wing gets by projection */
           predict:x => inter + slope * x };
}
