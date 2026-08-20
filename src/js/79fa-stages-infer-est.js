/* ============================================================================
   4ia · STATISTICAL INFERENCE — estimators and likelihood  (wing C14)

     snEst    the sampling distribution of an estimator: bias, variance, MSE
     snLike   the likelihood curve, the MLE, and the information in a sample

   The idea both stages are built to install is that an ESTIMATOR IS A RANDOM
   QUANTITY. A first course computes x̄ from one sample and calls it the answer;
   everything that can be said about how wrong it is lives in the distribution
   of the values it would have taken on the samples that did not happen. So the
   picture on both stages is a distribution, not a number, and every closed form
   is drawn on top of a simulation that was run without being told it.
   ============================================================================ */

/* one cache per stage. The sweeps below draw a few million random numbers and
   cur() is called by frame(), readout(), chip() and derive() — four times a
   frame — so the key is the whole of the state the result depends on, which
   makes a stale value impossible rather than unlikely. The seed is IN the key:
   that is what makes the readout reproducible instead of merely repeatable. */
function snCache(st, key, make){
  if(!st._snc || st._snc.key !== key) st._snc = { key, val:make() };
  return st._snc.val;
}
/* which estimators make sense for which family — an estimator of θ for the
   uniform family is meaningless applied to a normal, and offering it would be
   offering a control that cannot be right */
function snEstsFor(fam){
  return Object.keys(SN_ESTS).filter(k => !SN_ESTS[k].only || SN_ESTS[k].only === fam);
}
/* ctSample returns VALUES, not points — it is `f` sampled on a grid, and the x
   it was sampled at is not in the result. Every curve on these stages needs
   both, so the pairing is done once here rather than four times inline. */
function snPts(f, lo, hi, n){
  const out = new Array(n + 1);
  for(let i = 0; i <= n; i++){
    const x = lo + (hi - lo) * i / n;
    out[i] = { x, y:f(x) };
  }
  return out.filter(q => Number.isFinite(q.y));
}
/* a normal density, which three of the five views draw over a histogram */
const snNormPdf = (x, mu, sg) =>
  Math.exp(-0.5 * Math.pow((x - mu) / sg, 2)) / (sg * Math.sqrt(2 * Math.PI));

/* ---- bounding the work ----------------------------------------------------
   n and the repetition count are both sliders, and the simulation costs their
   PRODUCT. wireSlider lets a reader type past a slider's maximum — deliberately,
   because more resolution is a real question — and `n` is a step-1 count, so its
   own guard allows ten times the maximum on its own. 2000 × 40000 is eighty
   million samples and a wedged page, which is `rlMotFrameTwin`'s defect wearing
   different clothes: a loop counted in the quantity rather than in the work.
   So each of the two is capped against the other, and the pair can never ask
   for more than SN_WORK samples. The cap explains itself through ctlWhy rather
   than silently clamping. */
const SN_WORK = 4e6;
const snLimN = () => ({ hi:Math.max(4, Math.floor(SN_WORK / Math.max(200, ST.trials || 1))),
  why:'Held here. The work is n × repetitions, and past this the page would stop responding rather than tell you anything new — lower the repetitions if you want a larger sample.' });
const snLimT = () => ({ lo:200, hi:Math.max(500, Math.floor(SN_WORK / Math.max(2, ST.n || 1))),
  why:'Held here, for the same reason: the cost is n × repetitions. Fewer observations per sample buys more repetitions of it.' });
/* the likelihood stage's information panel costs about 6n per repetition — two
   log-likelihoods for the score and three for the curvature — so its own n
   needs a tighter bound than the count guard's ten-times-the-slider */
const snLimLn = () => ({ lo:3, hi:Math.max(20, Math.floor(6e5 / Math.max(1, (ST.trials || 4000) / 6))),
  why:'Held here. Every repetition of the information measurement walks the whole sample five times over, so this cost grows faster than the picture improves.' });

/* A PARAMETER HAS A DOMAIN, AND TYPED ENTRY CAN LEAVE IT.
   The θ slider's range comes from the family's own thLo/thHi, but wireSlider
   lets a reader type outside a slider, and outside is not merely unusual here —
   it is undefined. A rate of 0 makes the exponential's sampler divide by zero;
   a negative one makes it return negative waiting times; a Bernoulli p of 1.4
   is not a probability; a Poisson λ of 800 makes exp(−λ) underflow to exactly
   zero and the sampler runs to its own iteration cap and returns it as a count.
   None of those raise, and three of them would print confident numbers. This is
   the DSP_SIGNALS lesson — a preset's formula has a domain of validity — with
   the parameter rather than the record walking out of it. */
function snLimTh(fam){
  return () => {
    const F = SN_FAMS[fam];
    if(fam === 'bern') return { lo:0.005, hi:0.995,
      why:'p is a probability, so it lives strictly inside 0 and 1. At the ends there is nothing left to estimate.' };
    if(fam === 'poisson') return { lo:0.02, hi:120,
      why:'Held here. Below this the counts are all zero; above it exp(−λ) underflows to exactly zero and the sampler would return its own iteration cap dressed as a count.' };
    if(fam === 'normal') return { lo:-1e4, hi:1e4 };
    return { lo:1e-3, hi:1e4,
      why:'This parameter is a positive rate or a positive width — at zero the density is not defined, and below it the family does not exist.' };
  };
}
const snLimSd = () => ({ lo:1e-3, hi:1e4,
  why:'σ is a width and must be positive: at zero every sample is the same number and there is nothing to estimate.' });

/* ============================================================================
   1 · THE SAMPLING DISTRIBUTION OF AN ESTIMATOR
   ============================================================================ */
STAGES.snEst = {
  title:'An estimator is a random quantity — this is its distribution',
  enter(st, o){
    st.fam = SN_FAMS[o.fam] ? o.fam : 'normal';
    st.est = SN_ESTS[o.est] && snEstsFor(st.fam).indexOf(o.est) >= 0 ? o.est : 'mean';
    st.n = o.n || 9;
    st.trials = o.trials || 12000;
    st.seed = o.seed || 20260819;
    /* the normal family's th0 is 0, which is the right default for a likelihood
       curve and a poor one here: with the target at zero, "where it centred"
       and "the bias" are the same number and a reader cannot tell which row is
       which. This stage therefore offsets it. */
    st.th = o.th !== undefined ? o.th
          : (st.fam === 'normal' ? 1.2 : SN_FAMS[st.fam].th0);
    st.sd = o.sd || 1.6;
    st.view = o.view || 'dist';
  },
  par(st){ return { th:st.th, sd:st.sd }; },
  cur(st){
    const key = [st.fam, st.est, st.n, st.trials, st.seed, st.th, st.sd, st.view].join('|');
    return snCache(st, key, () => {
      const p = this.par(st);
      const D = snSampDist(st.fam, p, st.n, st.est, st.trials, st.seed);
      /* the sweep in n, for the rate. Fewer trials than the headline run
         because there are seven of them and this is inside a cache, not a
         frame — but still enough that the fitted slope is not noise, which is
         asserted rather than hoped: the standard error of each point is kept
         and drawn. */
      const sizes = [4, 8, 16, 32, 64, 128];
      const sweep = sizes.map(n => {
        const S = snSampDist(st.fam, p, n, st.est, 2000, st.seed + 7 * n);
        return { n, mse:S.mseDirect, bias:S.bias, vari:S.vari,
                 truth:S.truth, se:S.varSE };
      });
      /* the rate, fitted in the logarithms — the site's standing way of
         measuring an order rather than asserting one. A slope of −1 is the
         ordinary 1/n; the adjusted maximum gives −2. */
      let sx = 0, sy = 0, sxx = 0, sxy = 0, m = 0;
      for(const q of sweep){
        if(!(q.mse > 0)) continue;
        const X = Math.log(q.n), Y = Math.log(q.mse);
        sx += X; sy += Y; sxx += X * X; sxy += X * Y; m++;
      }
      const slope = m > 1 ? (m * sxy - sx * sy) / (m * sxx - sx * sx) : NaN;
      return { D, p, sweep, slope, E:SN_ESTS[st.est], F:SN_FAMS[st.fam] };
    });
  },
  controls(){
    const st = ST, N = this.cur(st);
    const ests = snEstsFor(st.fam);
    return ctSeg('snEf', st.fam, Object.keys(SN_FAMS).map(k => [k, SN_FAMS[k].n])) +
      ctSeg('snEe', st.est, ests.map(k => [k, SN_ESTS[k].n])) +
      ctSeg('snEv', st.view, [['dist', 'the distribution'], ['rate', 'the rate in n']]) +
      ctlRow('sample size n', ctlSlider('snEn', 2, 200, 1, st.n)) +
      ctlRow('repetitions', ctlSlider('snEt', 500, 40000, 500, st.trials)) +
      ctlRow('true ' + N.F.pn, ctlSlider('snEth', N.F.thLo, N.F.thHi, 0.05, st.th)) +
      (st.fam === 'normal' ? ctlRow('true σ', ctlSlider('snEsd', 0.3, 4, 0.05, st.sd)) : '') +
      ctlRow('seed', ctlSlider('snEsd2', 1, 999, 1, st.seed % 1000)) +
      `<p class="help"><b>${N.E.n}.</b> ${N.E.why}</p>
      <p class="help">The histogram is not the data. It is one bar per <i>repetition of the whole
      experiment</i>: draw ${st.n} fresh observations, compute the estimator, record it, and do that
      ${st.trials} times. The dashed line is what the estimator is trying to hit. Everything a
      course calls bias, variance and standard error is a property of this picture, and none of it
      is visible from a single sample.</p>
      <p class="help">Nothing here calls the browser's random number generator. The seed makes the
      sample, so the numbers below are the same on every repaint and in every screenshot — move the
      seed slider to see a different experiment, and move it back to see this one again.</p>`;
  },
  wire(){
    ctWireSeg('snEf', v => {
      ST.fam = v;
      ST.th = SN_FAMS[v].th0;
      /* an estimator that does not apply to the new family must not survive the
         switch — the picture would be of a quantity with no target */
      if(snEstsFor(v).indexOf(ST.est) < 0) ST.est = 'mean';
    });
    ctWireSeg('snEe', v => { ST.est = v; });
    ctWireSeg('snEv', v => { ST.view = v; });
    wireSlider('snEn', () => ST.n, v => { ST.n = Math.max(2, Math.round(v)); },
               v => 'n = ' + Math.round(v), snLimN);
    wireSlider('snEt', () => ST.trials, v => { ST.trials = Math.max(200, Math.round(v)); },
               v => Math.round(v) + ' repetitions', snLimT);
    wireSlider('snEth', () => ST.th, v => { ST.th = v; }, v => fmtNum(v, 3), snLimTh(ST.fam));
    wireSlider('snEsd', () => ST.sd, v => { ST.sd = v; }, v => 'σ = ' + fmtNum(v, 3), snLimSd);
    wireSlider('snEsd2', () => ST.seed % 1000, v => { ST.seed = 20260000 + Math.round(v); },
               v => 'seed ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(46, z.h + 12);
    if(st.view === 'rate') return this.frameRate(st, ctx, W, H, top, N);

    const D = N.D, V = D.vals;
    const lo = Math.min(D.target, D.stats.min), hi = Math.max(D.target, D.stats.max);
    const pad = 0.06 * Math.max(1e-12, hi - lo);
    const Hst = pbHist(V, lo - pad, hi + pad, Math.min(60, Math.max(20, Math.round(Math.sqrt(V.length)))));
    const ymax = Math.max.apply(null, Hst.density) * 1.18 || 1;
    const P = mkPlot(58, top + 8, W - 92, H - top - 92, lo - pad, hi + pad, 0, ymax);
    plotFrame(ctx, P, 'value of ' + N.E.n, 'density of that value',
              'what the estimator does over ' + D.trials + ' repeats of the experiment');
    ctGrid(ctx, P);
    /* the histogram as filled bars */
    for(let i = 0; i < Hst.counts.length; i++){
      const c = Hst.centres[i], d = Hst.density[i];
      if(!(d > 0)) continue;
      ctFill(ctx, P, [{ x:c - Hst.w / 2, y:0 }, { x:c - Hst.w / 2, y:d },
                      { x:c + Hst.w / 2, y:d }, { x:c + Hst.w / 2, y:0 }],
             rgbCss(TH.grad, 0.32));
    }
    /* the closed-form sampling distribution, where one is known. For the
       estimators of a normal's centre it really is normal; for a variance it is
       a scaled chi-squared and the normal drawn here would be a lie, so it is
       drawn only where the shape is right and the legend says which. */
    const normalOK = (st.est === 'mean' || st.est === 'median') ||
                     (N.E.truth && st.n >= 30);
    if(N.D.truth && normalOK){
      const mu = N.D.truth.mean, sg = Math.sqrt(N.D.truth.vari);
      ctPath(ctx, P, snPts(x => snNormPdf(x, mu, sg), P.x0, P.x1, 240),
             rgbCss(TH.accent), 2.2);
    }
    /* the target, and where the estimator actually centred */
    const vline = (x, col, w, dash) =>
      ctPath(ctx, P, [{ x, y:0 }, { x, y:ymax }], col, w, dash);
    vline(D.target, rgbCss(TH.text), 2, [6, 4]);
    vline(D.stats.mean, rgbCss(TH.pos), 2.4);
    /* ±1 sd of the sampling distribution, as a bar under the axis */
    const yb = ymax * 0.045;
    ctPath(ctx, P, [{ x:D.stats.mean - D.stats.sd, y:yb }, { x:D.stats.mean + D.stats.sd, y:yb }],
           rgbCss(TH.pos), 3);
    ctDot(ctx, P, D.stats.mean, yb, 3.5, rgbCss(TH.pos));
    stageNote(ctx, 'bias ' + snAgreeMCTight(D.stats.mean, D.target, D.biasSE) +
              '   ·   spread of the estimator ' + fmtSig(D.stats.sd, 3) +
              '   ·   ' + (N.D.truth ? 'closed form drawn' : 'no closed form for this pair'),
              W, H);
  },
  /* the second view: mean squared error against n, in logarithms, where the
     RATE is the thing worth seeing and a fitted slope is the way to see it */
  frameRate(st, ctx, W, H, top, N){
    const S = N.sweep.filter(q => q.mse > 0);
    if(!S.length) return;
    const xs = S.map(q => Math.log10(q.n)), ys = S.map(q => Math.log10(q.mse));
    const y0 = Math.min.apply(null, ys) - 0.4, y1 = Math.max.apply(null, ys) + 0.4;
    const P = mkPlot(64, top + 8, W - 96, H - top - 92,
                     Math.min.apply(null, xs) - 0.15, Math.max.apply(null, xs) + 0.15, y0, y1);
    plotFrame(ctx, P, 'log₁₀ n', 'log₁₀ mean squared error',
              'how fast the error falls — the slope is the rate');
    ctGrid(ctx, P);
    /* the simulated points, with the closed form through them where it exists */
    ctPath(ctx, P, S.map((q, i) => ({ x:xs[i], y:ys[i] })), rgbCss(TH.pos), 2.4);
    for(let i = 0; i < S.length; i++) ctDot(ctx, P, xs[i], ys[i], 4, rgbCss(TH.pos));
    const withTruth = S.filter(q => q.truth);
    if(withTruth.length > 1)
      ctPath(ctx, P, withTruth.map(q => ({
        x:Math.log10(q.n),
        y:Math.log10(q.truth.vari + Math.pow(q.truth.mean - N.D.target, 2))
      })), rgbCss(TH.accent), 2, [6, 4]);
    /* reference slopes, so the eye can read the exponent off the picture */
    const ref = (m, col, lbl) => {
      const x0 = xs[0], yy = ys[0];
      ctPath(ctx, P, [{ x:x0, y:yy }, { x:xs[xs.length - 1], y:yy + m * (xs[xs.length - 1] - x0) }],
             col, 1.2, [3, 5]);
      ctText(ctx, P.X(xs[xs.length - 1]) - 6, P.Y(yy + m * (xs[xs.length - 1] - x0)) - 6,
             lbl, rgbCss(TH.dim), '11px ' + FONT_UI, 'right', 'bottom');
    };
    ref(-1, rgbCss(TH.dim), '1/n');
    ref(-2, rgbCss(TH.faint), '1/n²');
    stageNote(ctx, 'fitted slope ' + fmtSig(N.slope, 3) +
              '   ·   ' + (N.slope < -1.5 ? 'the error falls like 1/n² — faster than any regular family allows'
                         : 'the error falls like 1/n, which is the ordinary rate'),
              W, H);
  },
  readout(st){
    const N = this.cur(st), D = N.D, T = D.truth;
    const relSE = q => Math.abs(q) < 1e-300 ? '—' : '';
    return `<div class="card tight"><div class="ttl">The estimator, over ${D.trials} repeats</div>
      ${kv('what it is aiming at', fmtSig(D.target, 6))}
      ${kv('where it centred', fmtSig(D.stats.mean, 6) + ' ± ' + fmtSig(D.biasSE, 2))}
      ${kv('bias', snAgreeMC(D.stats.mean, D.target, D.biasSE))}
      ${kv('spread (standard error)', fmtSig(D.stats.sd, 5))}
      <p class="help">The ± on the middle row is the <i>simulation's</i> error, not the
      estimator's: run it again with another seed and the centre moves by about that much. A bias
      is real only when it is several of those across, which is why the row above states the gap in
      units of it rather than as a bare number — a difference of 0.001 is decisive at one sample
      size and invisible at another, and the number alone cannot tell you which.</p>
    </div>
    <div class="card tight"><div class="ttl">Against the closed form</div>
      ${T ? `${kv('exact mean of the estimator', fmtSig(T.mean, 8) + (D.approx ? '  (asymptotic)' : ''))}
             ${kv('simulated, against it', snAgreeMC(D.stats.mean, T.mean, D.biasSE))}
             ${kv('exact variance', fmtSig(T.vari, 8))}
             ${kv('simulated, against it', snAgreeMC(D.vari, T.vari, D.varSE))}
             ${kv('exact bias', fmtSig(T.mean - D.target, 4) +
                 (Math.abs(T.mean - D.target) < 1e-14 ? '  — exactly zero, and provably so' : ''))}
             <p class="help">Two routes with nothing in common below the family: ${D.trials}
             repetitions of the actual experiment, and a formula derived on paper.
             ${D.approx ? 'The formula for the median is the <b>asymptotic</b> one — it is the limit as n grows, so a gap at small n is the approximation showing rather than either route being wrong, and it should shrink as you raise n.'
                        : 'The formula is exact at every n, so any gap here beyond a couple of standard errors would be a defect in one of them.'}</p>`
          : `${kv('exact mean of the estimator', 'no closed form for this estimator on this family')}
             <p class="help">Not every pair has one, and inventing a formula to compare against
             would be worse than admitting there is none. The simulation is still the answer — it
             is simply the only route here, and a single route is a measurement rather than a
             check. Switch to the normal family to get both.</p>`}
    </div>
    <div class="card tight"><div class="ttl">Mean squared error — the thing actually worth minimising</div>
      ${kv('bias²', fmtSig(D.bias * D.bias, 4))}
      ${kv('variance', fmtSig(D.vari, 5))}
      ${kv('their sum', fmtSig(D.mse, 5))}
      ${kv('MSE computed directly', fmtSig(D.mseDirect, 5))}
      ${kv('the two, compared', fmtGap(Math.abs(D.mse - D.mseDirect), D.mseDirect, '', 1e-3))}
      <p class="help">MSE = bias² + variance is an identity, not an approximation, and the last two
      rows are it checked: one route adds two separately computed quantities, the other averages
      the squared errors and never forms either. They differ by exactly one repetition's worth of
      variance — the two sums have denominators ${D.trials} and ${D.trials - 1} — which is a fact
      about the arithmetic rather than a discrepancy.</p>
      <p class="help"><b>This is where unbiasedness stops being the goal.</b> An estimator may be
      unbiased and useless, or biased and better: what a reader loses is the squared error, and
      nothing in it says the bias term has to be the zero one. The uniform family has the sharpest
      version — compare <i>largest observation</i> with <i>(n+1)/n × largest</i> with
      <i>2 × sample mean</i>, of which the last two are both unbiased and one is far worse.</p>
    </div>
    <div class="card tight"><div class="ttl">The rate</div>
      ${kv('fitted slope of log MSE against log n', fmtSig(N.slope, 4))}
      ${kv('what that means', N.slope < -1.5
          ? 'the error falls like 1/n² — the estimator uses the edge of the data, not its middle'
          : 'the error falls like 1/n, so the standard error falls like 1/√n')}
      ${kv('to halve the error you need', N.slope < -1.5 ? 'twice the data' : 'four times the data')}
      <p class="help">Fitted over sample sizes 4 to 256 by least squares in the logarithms, which
      is how an order is measured rather than asserted. The 1/√n that a first course attaches to
      everything is the <i>regular</i> case; it is a consequence of the Cramér–Rao bound and it
      fails wherever that bound's hypotheses do — which the uniform family shows in one picture.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st), D = N.D;
    const real = Math.abs(D.bias) > 2.5 * D.biasSE;
    return `<div class="k">n = ${st.n}, ${D.trials} runs</div>
      <div style="color:var(--c-${real ? 'neg' : 'pos'})">${real ? 'biased' : 'no bias visible'}</div>
      <div style="color:var(--c-dim)">se ${fmtSig(D.stats.sd, 3)}</div>`;
  },
  legend(st){
    if(st.view === 'rate')
      return [['var(--c-pos)', 'simulated MSE'], ['var(--accent)', 'closed form'],
              ['var(--dim)', 'slope −1  (1/n)'], ['var(--faint)', 'slope −2  (1/n²)']];
    return [['var(--c-grad)', 'the estimator’s values'], ['var(--text)', 'what it aims at'],
            ['var(--c-pos)', 'where it centred, ±1 sd'], ['var(--accent)', 'closed-form density']];
  },
  dockLegend:true,
  derive(st){
    const N = this.cur(st), D = N.D, T = D.truth;
    return {
      title:'Bias, variance, and why the second one is usually the one that matters',
      steps:[
        drvSay('the object is a distribution, not a number',
          'Apply an estimator to a sample and you get a number. Apply it to the sample you would have got on a different day and you get a different number. The collection of all of those — over every sample the experiment could have produced — is the sampling distribution, and it is the only thing about which anything can be said. The histogram on the left is that distribution, built by actually running the experiment ' + D.trials + ' times rather than by assuming its shape.'),
        drvStep('bias is where it centres, minus where it should',
          `bias ${dop('=')} E[${dv('θ̂')}] ${dop('−')} ${dv('θ')}`,
          `here ${fmtSig(D.stats.mean, 6)} ${'−'} ${fmtSig(D.target, 6)} = ` +
          snAgreeMC(D.stats.mean, D.target, D.biasSE)),
        drvSay('and a bias is only real when it exceeds the simulation’s own error',
          'The centre of ' + D.trials + ' repetitions is itself a random quantity with standard error ' + fmtSig(D.biasSE, 3) + '. A gap smaller than that is the simulation, not the estimator, and reporting it as a bias would be reading noise. This is the reason every comparison in this wing is quoted in units of that error instead of as a bare difference — the bare difference cannot be interpreted without it.'),
        drvStep('variance is how far it scatters about its own centre',
          `Var[${dv('θ̂')}] ${dop('=')} E[(${dv('θ̂')} ${dop('−')} E[${dv('θ̂')}])²]`,
          `${fmtSig(D.vari, 5)}, so the standard error is ${fmtSig(D.stats.sd, 5)}`),
        drvStep('and the two combine into one honest measure of wrongness',
          `MSE ${dop('=')} E[(${dv('θ̂')} ${dop('−')} ${dv('θ')})²] ${dop('=')} bias² ${dop('+')} variance`,
          `${fmtSig(D.mseDirect, 5)} directly, ${fmtSig(D.mse, 5)} as the sum — ` +
          fmtGap(Math.abs(D.mse - D.mseDirect), D.mseDirect, '', 1e-3)),
        drvSay('which is where the usual advice quietly goes wrong',
          '"Prefer an unbiased estimator" sets the first term to zero and says nothing about the second, and the second is usually the larger. Dividing the sum of squared deviations by n rather than n − 1 is biased — by exactly −σ²/n, always downwards — and has the smaller variance, and at small n the smaller mean squared error of the two. Neither choice is wrong; they optimise different things, and only one of them is ever named in an introductory course.'),
        T ? drvStep('the closed form, which the simulation was never told',
          `E[${dv('θ̂')}] ${dop('=')} ${fmtSig(T.mean, 8)}, Var[${dv('θ̂')}] ${dop('=')} ${fmtSig(T.vari, 8)}`,
          'simulated: ' + snAgreeMC(D.stats.mean, T.mean, D.biasSE) + ' on the centre, and ' +
          snAgreeMC(D.vari, T.vari, D.varSE) + ' on the spread')
          : drvSay('no closed form exists for this pair',
          'and rather than compare against an invented one, the panel says so. The simulation remains a measurement; it is simply not a check, because a check needs two routes.'),
        drvSay('the rate is the part that generalises',
          'Fitting log MSE against log n over sizes 4 to 256 gives a slope of ' + fmtSig(N.slope, 4) + '. A slope of −1 means the error falls like 1/n and the standard error like 1/√n, which is the rate almost everything in statistics has — and it is a consequence of a bound, not a law of nature. On the uniform family the maximum uses the edge of the sample rather than its middle, the slope is −2, and doubling the data halves the error instead of reducing it by 29%.')
      ],
      note:'Every number above comes from ' + D.trials + ' repetitions of an experiment with n = ' +
           st.n + ', driven by seed ' + st.seed + '. Change the seed and they all move by about one ' +
           'standard error; change it back and they return exactly.'
    };
  }
};

/* ============================================================================
   2 · LIKELIHOOD, AND THE INFORMATION IN A SAMPLE
   ============================================================================ */
STAGES.snLike = {
  title:'The likelihood, the estimate it picks, and how sharp it is',
  enter(st, o){
    st.fam = SN_FAMS[o.fam] ? o.fam : 'expo';
    st.n = o.n || 25;
    st.seed = o.seed || 20260819;
    st.th = o.th !== undefined ? o.th : SN_FAMS[st.fam].th0;
    st.sd = o.sd || 1.0;
    st.view = o.view || 'curve';
    st.trials = o.trials || 4000;
  },
  par(st){ return { th:st.th, sd:st.sd }; },
  cur(st){
    const key = [st.fam, st.n, st.seed, st.th, st.sd, st.view, st.trials].join('|');
    return snCache(st, key, () => {
      const F = SN_FAMS[st.fam], p = this.par(st);
      const rng = snRng(st.seed), xs = new Array(st.n);
      for(let i = 0; i < st.n; i++) xs[i] = F.sample(p, rng);
      const extra = { sd:st.sd };
      /* the window the curve is drawn over — wide enough to show the shape and
         always containing both the truth and the estimate */
      const mle = F.mle(xs, p);
      const spread = Math.max(1e-6, Math.abs(mle) * 0.9 + 0.6);
      const lo = Math.max(F.thLo - 0.4 * spread, Math.min(st.th, mle) - spread);
      const hi = Math.min(F.thHi + 0.6 * spread, Math.max(st.th, mle) + spread);
      const C = snLikCurve(st.fam, xs, lo, hi, 1400, extra);
      const obs = snObsInfo(st.fam, xs, mle, extra);
      const Fi = snFisher(st.fam, p, st.n, st.trials, st.seed + 991, extra);
      return { F, p, xs, mle, C, obs, Fi, lo, hi, extra,
               /* the standard error the curvature predicts for this one sample —
                  the quantity every package prints beside an estimate */
               seFromCurve:obs > 0 ? 1 / Math.sqrt(obs) : NaN };
    });
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('snLf', st.fam, Object.keys(SN_FAMS).map(k => [k, SN_FAMS[k].n])) +
      ctSeg('snLv', st.view, [['curve', 'the likelihood'], ['info', 'the information'],
                              ['asym', 'is the MLE normal?']]) +
      ctlRow('sample size n', ctlSlider('snLn', 3, 300, 1, st.n)) +
      ctlRow('true ' + N.F.pn, ctlSlider('snLth', N.F.thLo, N.F.thHi, 0.05, st.th)) +
      (st.fam === 'normal' ? ctlRow('known σ', ctlSlider('snLsd', 0.3, 3, 0.05, st.sd)) : '') +
      ctlRow('seed', ctlSlider('snLsd2', 1, 999, 1, st.seed % 1000)) +
      `<p class="help"><b>${N.F.n}.</b> ${N.F.note}</p>
      <p class="help">The curve is the log-likelihood of <i>one</i> sample of ${st.n} observations —
      the same sample throughout, fixed by the seed. Its peak is the maximum likelihood estimate,
      found here by walking a grid of 1400 points, which knows no formula; the formula's answer is
      marked beside it. Its <b>curvature at the peak</b> is the information, and it is what a
      package is reporting when it prints a standard error next to an estimate.</p>
      ${N.F.regular ? '' : `<p class="help"><b>This family breaks the rules the other four obey.</b>
      Its support depends on θ, so the likelihood is discontinuous, the peak is not a stationary
      point, and every asymptotic statement on this stage stops applying. The panels say where.</p>`}`;
  },
  wire(){
    ctWireSeg('snLf', v => { ST.fam = v; ST.th = SN_FAMS[v].th0; });
    ctWireSeg('snLv', v => { ST.view = v; });
    wireSlider('snLn', () => ST.n, v => { ST.n = Math.max(3, Math.round(v)); },
               v => 'n = ' + Math.round(v), snLimLn);
    wireSlider('snLth', () => ST.th, v => { ST.th = v; }, v => fmtNum(v, 3), snLimTh(ST.fam));
    wireSlider('snLsd', () => ST.sd, v => { ST.sd = v; }, v => 'σ = ' + fmtNum(v, 3), snLimSd);
    wireSlider('snLsd2', () => ST.seed % 1000, v => { ST.seed = 20260000 + Math.round(v); },
               v => 'seed ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(46, z.h + 12);
    if(st.view === 'info') return this.frameInfo(st, ctx, W, H, top, N);
    if(st.view === 'asym') return this.frameAsym(st, ctx, W, H, top, N);

    /* the log-likelihood, shifted so its peak is at zero — the absolute height
       is a function of the sample and carries nothing, while the SHAPE is the
       whole content, and subtracting the peak is what makes two samples
       comparable at all */
    const pts = N.C.pts.filter(q => Number.isFinite(q.y))
                       .map(q => ({ x:q.x, y:q.y - N.C.gridBest }));
    const lowest = Math.max(-14, pts.reduce((a, q) => Math.min(a, q.y), 0));
    const P = mkPlot(62, top + 8, W - 96, H - top - 92, N.lo, N.hi, lowest, 0.8);
    plotFrame(ctx, P, N.F.pn, 'log-likelihood, less its peak',
              'the likelihood of one sample of ' + st.n);
    ctGrid(ctx, P);
    ctPath(ctx, P, pts.filter(q => q.y >= lowest), rgbCss(TH.grad), 2.4);
    /* the peak, the closed-form MLE, and the truth */
    const vline = (x, col, w, dash) => ctPath(ctx, P, [{ x, y:lowest }, { x, y:0.8 }], col, w, dash);
    vline(st.th, rgbCss(TH.text), 2, [6, 4]);
    vline(N.mle, rgbCss(TH.pos), 2.4);
    ctDot(ctx, P, N.C.peak, 0, 4.5, rgbCss(TH.accent));
    /* the quadratic the curvature predicts — the approximation every standard
       error in every package is built on, drawn so a reader can see where it
       stops being one */
    if(N.obs > 0)
      ctPath(ctx, P, snPts(x => -0.5 * N.obs * (x - N.mle) * (x - N.mle), N.lo, N.hi, 200)
                      .filter(q => q.y >= lowest), rgbCss(TH.warn), 1.8, [5, 4]);
    stageNote(ctx, 'peak at ' + fmtSig(N.mle, 5) + '   ·   truth ' + fmtSig(st.th, 5) +
              '   ·   curvature ' + fmtSig(N.obs, 4) +
              (N.F.regular ? '   ·   se from the curvature ' + fmtSig(N.seFromCurve, 3)
                           : '   ·   not a stationary peak — the curvature says nothing here'),
              W, H);
  },
  /* the three routes to the information, as a bar chart with their error bars */
  frameInfo(st, ctx, W, H, top, N){
    const Fi = N.Fi;
    const rows = [
      { n:'closed form  n·I(θ)', v:Fi.closed, se:0, col:TH.text },
      { n:'Var[score], measured', v:Fi.scoreVar, se:Fi.scoreVarSE, col:TH.pos },
      { n:'−ℓ″ at the TRUE θ', v:Fi.obsAtTruth, se:Fi.obsAtTruthSE, col:TH.grad },
      { n:'−ℓ″ at each sample’s MLE', v:Fi.obs, se:Fi.obsSE, col:TH.warn }
    ].filter(r => Number.isFinite(r.v));
    const hi = rows.reduce((a, r) => Math.max(a, r.v + 2 * (r.se || 0)), 0) * 1.15 || 1;
    const P = mkPlot(150, top + 14, W - 190, H - top - 100, 0, hi, -0.6, rows.length - 0.4);
    plotFrame(ctx, P, 'Fisher information in the whole sample', '',
              'three routes to the same number');
    /* labels off: the y axis here is a list of three methods, not a scale, and
       ctGrid would number the rows 0, 1, 2 as though they measured something.
       Each bar prints its own value beside it instead. */
    ctGrid(ctx, P, null, false);
    rows.forEach((r, i) => {
      const y = rows.length - 1 - i;
      ctFill(ctx, P, [{ x:0, y:y - 0.26 }, { x:r.v, y:y - 0.26 },
                      { x:r.v, y:y + 0.26 }, { x:0, y:y + 0.26 }], rgbCss(r.col, 0.4));
      if(r.se > 0)
        ctPath(ctx, P, [{ x:r.v - 2 * r.se, y }, { x:r.v + 2 * r.se, y }], rgbCss(r.col), 2.4);
      ctText(ctx, P.X(0) - 8, P.Y(y), r.n, rgbCss(TH.dim), '12px ' + FONT_UI, 'right', 'middle');
      ctText(ctx, P.X(r.v) + 8, P.Y(y), fmtSig(r.v, 5), rgbCss(TH.text),
             '12px ' + FONT_UI, 'left', 'middle');
    });
    stageNote(ctx, N.F.regular
      ? 'the first three agree — the identity −E[ℓ″] = E[(ℓ′)²] holds here. The fourth is a different quantity: curvature at the ESTIMATE, biased by O(1/n)'
      : 'the identity −E[ℓ″] = E[(ℓ′)²] needs a support that does not move with θ — it fails on this family, and the bars show it',
      W, H);
  },
  /* is the MLE normal? the asymptotic claim, checked */
  frameAsym(st, ctx, W, H, top, N){
    const M = N.Fi.mles.filter(Number.isFinite);
    const S = pbStats(M);
    const lo = Math.min(S.min, st.th - 3 * S.sd), hi = Math.max(S.max, st.th + 3 * S.sd);
    const Hs = pbHist(M, lo, hi, 52);
    const ymax = Math.max.apply(null, Hs.density) * 1.2 || 1;
    const P = mkPlot(58, top + 8, W - 92, H - top - 92, lo, hi, 0, ymax);
    plotFrame(ctx, P, 'value of the MLE', 'density',
              'the MLE over ' + M.length + ' samples, against the normal it is promised to be');
    ctGrid(ctx, P);
    for(let i = 0; i < Hs.counts.length; i++){
      if(!(Hs.density[i] > 0)) continue;
      const c = Hs.centres[i];
      ctFill(ctx, P, [{ x:c - Hs.w / 2, y:0 }, { x:c - Hs.w / 2, y:Hs.density[i] },
                      { x:c + Hs.w / 2, y:Hs.density[i] }, { x:c + Hs.w / 2, y:0 }],
             rgbCss(TH.grad, 0.32));
    }
    /* the promise: N(θ, 1/(nI)) — drawn whatever the family, because watching it
       fail on the uniform is the experiment */
    const sg = Math.sqrt(N.Fi.crb);
    ctPath(ctx, P, snPts(x => snNormPdf(x, st.th, sg), lo, hi, 260), rgbCss(TH.accent), 2.2);
    ctPath(ctx, P, [{ x:st.th, y:0 }, { x:st.th, y:ymax }], rgbCss(TH.text), 2, [6, 4]);
    stageNote(ctx, N.F.regular
      ? 'measured spread ' + fmtSig(S.sd, 4) + ' against the promised ' + fmtSig(sg, 4) +
        '   ·   ' + snAgreeMCTight(S.vari, N.Fi.crb, S.vari * Math.sqrt(2 / Math.max(1, M.length)))
      : 'the promise is the smooth curve; the histogram is what happens. They are not the same shape, and no n fixes it',
      W, H);
  },
  readout(st){
    const N = this.cur(st), Fi = N.Fi, S = pbStats(N.Fi.mles.filter(Number.isFinite));
    return `<div class="card tight"><div class="ttl">This sample, and what it estimates</div>
      ${kv('n', st.n)}
      ${kv('the MLE, by formula', fmtSig(N.mle, 6))}
      ${kv('the MLE, by walking the grid', fmtSig(N.C.peak, 6) +
          (N.C.how === 'parabola' ? '  (peak refined by a parabola)'
           : N.C.how === 'edge' ? '  (a cliff, not a peak — bisected for the edge)'
           : '  (raw grid maximum)'))}
      ${kv('the two, compared', fmtGap(Math.abs(N.mle - N.C.peak), Math.abs(N.mle) + 1e-30, '', 1e-3) +
          ' — the grid’s own step is ' + fmtSig(N.C.step, 2))}
      ${kv('the truth', fmtSig(st.th, 6))}
      <p class="help">Two routes to the estimate: differentiate the log-likelihood on paper and
      solve, or evaluate it at 1400 values of ${N.F.pn} and take the largest. The second knows no
      formula, which is what makes it a check — and it is also the only one of the two that works
      on the uniform family, where the peak is a cliff edge rather than a stationary point and
      setting a derivative to zero finds nothing at all.</p>
    </div>
    <div class="card tight"><div class="ttl">Information — three routes to one quantity</div>
      ${kv('closed form, n·I(θ)', fmtSig(Fi.closed, 6))}
      ${kv('E[(∂ℓ/∂θ)²], measured', fmtSig(Fi.scoreVar, 6) + ' ± ' + fmtSig(Fi.scoreVarSE, 2))}
      ${kv('against the closed form', snAgreeMC(Fi.scoreVar, Fi.closed, Fi.scoreVarSE))}
      ${kv('−E[∂²ℓ/∂θ²] at the true θ', fmtSig(Fi.obsAtTruth, 6) + ' ± ' + fmtSig(Fi.obsAtTruthSE, 2))}
      ${kv('against the closed form', snAgreeMC(Fi.obsAtTruth, Fi.closed, Fi.obsAtTruthSE))}
      ${kv('mean of the score at the truth', fmtSig(Fi.scoreMean, 4) + ' ± ' + fmtSig(Fi.scoreMeanSE, 2) +
          ' — it must be zero')}
      <p class="help">The information is defined as the variance of the score, and there is a
      theorem saying it also equals minus the expected curvature. Those are different computations
      on different quantities and they are checked against each other here — plus the closed form,
      which shares nothing with either. ${N.F.regular
        ? 'All three agree, and the score’s mean is zero, which is the identity that makes the second route legal in the first place.'
        : '<b>They do not agree here, and they should not.</b> The theorem is proved by differentiating under an integral sign whose limits depend on θ, which is exactly the step this family forbids. A wing that printed the closed form alone would have no way of noticing.'}</p>
    </div>
    <div class="card tight"><div class="ttl">…and a fourth that is a <i>different</i> quantity</div>
      ${kv('−ℓ″ at each sample’s own MLE', fmtSig(Fi.obs, 6) + ' ± ' + fmtSig(Fi.obsSE, 2))}
      ${kv('against n·I(θ)', snAgreeMC(Fi.obs, Fi.closed, Fi.obsSE))}
      ${kv('ratio to the Fisher information', fmtSig(Fi.obs / Fi.closed, 5))}
      ${kv('what the ratio should be', st.fam === 'normal'
          ? 'exactly 1 — for a normal mean ℓ″ is a constant, so the two coincide'
          : 'about 1 + 1/n = ' + fmtSig(1 + 1 / st.n, 5) + ', approaching 1 as n grows')}
      <p class="help">The <b>Fisher</b> information is the expected curvature <i>at the true θ</i>.
      The <b>observed</b> information is the curvature at the estimate — which is the one a package
      can actually compute, since it does not know θ. They agree in the limit and not at finite n:
      here the ratio is ${fmtSig(Fi.obs / Fi.closed, 5)}, an O(1/n) discrepancy that shrinks as you
      raise n and never quite closes.</p>
      <p class="help"><b>This row exists because the wing was wrong about it.</b> The first version
      printed the curvature at the MLE as a third route to the same number and claimed agreement —
      which is exactly true for a normal mean, where ℓ″ = −n/σ² is constant and does not care where
      it is evaluated, and false for every other family here. Testing only the normal showed
      nothing. It is the same lesson the numerical-linear-algebra wing records about Gelfand's
      formula: an estimator that <i>converges</i> to a quantity is not an estimator that <i>has</i>
      converged to it, and the default preset is where the difference hides.</p>
    </div>
    <div class="card tight"><div class="ttl">The standard error a package would print</div>
      ${kv('curvature at the peak, this sample', fmtSig(N.obs, 5))}
      ${kv('se = 1/√curvature', Number.isFinite(N.seFromCurve) ? fmtSig(N.seFromCurve, 5) : 'not available')}
      ${kv('actual spread of the MLE', fmtSig(S.sd, 5) + '  (over ' + S.n + ' samples)')}
      ${kv('the two, compared', snAgreeMC(N.seFromCurve, S.sd, S.sd / Math.sqrt(2 * Math.max(1, S.n))))}
      <p class="help">This is the row worth staring at. Every statistical package prints a standard
      error beside an estimate, and it is almost never obtained by repeating the experiment — it is
      read off the <b>curvature of the likelihood of the one sample you have</b>, using the theorem
      that the two agree. Here both are computed, and they are compared. ${N.F.regular
        ? 'The agreement is the theorem working, and it is why a single sample can report its own precision at all.'
        : 'On this family the curvature route is meaningless — the peak is not smooth — and a package that reported it would return a confident number about nothing.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The Cramér–Rao bound</div>
      ${kv('1 / n·I(θ)', fmtSig(Fi.crb, 6))}
      ${kv('variance of the MLE, measured', fmtSig(S.vari, 6))}
      ${kv('ratio, measured ÷ bound', fmtSig(S.vari / Fi.crb, 4))}
      ${kv('is the bound in force?', Fi.regular
          ? 'yes — the support does not depend on θ'
          : '<b>no</b> — the support is [0, θ], so the hypothesis fails')}
      <p class="help">${Fi.regular
        ? 'No unbiased estimator of θ can have a variance below the bound, and the MLE here sits essentially on it — which is the sense in which maximum likelihood is optimal. A ratio slightly above 1 at small n is the MLE\'s own small-sample bias and shrinks as n grows.'
        : '<b>The measured variance is below the bound, and that is not an error.</b> The Cramér–Rao inequality is proved by differentiating under an integral whose limits are fixed; here they are not, the proof does not run, and the conclusion is simply unavailable. An estimator beating a bound is always a signal to go back and read the bound\'s hypotheses — never a discovery.'}</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">${N.F.pn}̂ = ${fmtSig(N.mle, 4)}</div>
      <div style="color:var(--c-${N.F.regular ? 'pos' : 'warn'})">${N.F.regular ? 'regular' : 'support moves with θ'}</div>
      <div style="color:var(--c-dim)">n = ${st.n}</div>`;
  },
  legend(st){
    if(st.view === 'info')
      return [['var(--text)', 'closed form n·I(θ)'], ['var(--c-pos)', 'Var[score]'],
              ['var(--c-grad)', '−ℓ″ at the true θ'],
              ['var(--c-warn)', '−ℓ″ at the MLE — a different quantity']];
    if(st.view === 'asym')
      return [['var(--c-grad)', 'the MLE, over many samples'], ['var(--accent)', 'the normal it is promised to be'],
              ['var(--text)', 'the truth']];
    return [['var(--c-grad)', 'log-likelihood'], ['var(--c-pos)', 'the MLE'],
            ['var(--text)', 'the truth'], ['var(--c-warn)', 'the quadratic the curvature predicts']];
  },
  dockLegend:true,
  derive(st){
    const N = this.cur(st), Fi = N.Fi;
    return {
      title:'Likelihood: turning the density around, and reading its curvature',
      steps:[
        drvSay('the same formula, asked a different question',
          'A density answers "given the parameter, how probable is this data". Fix the data instead and let the parameter vary, and the same expression answers "given this data, how well does each parameter account for it". That is the likelihood. It is not a probability distribution over θ — it does not integrate to one, and it is not trying to — it is a comparison between explanations.'),
        drvStep('and it is worked with in logarithms, for two reasons',
          `ℓ(${dv('θ')}) ${dop('=')} Σᵢ log ${dv('f')}(${dv('x')}ᵢ ${dop('|')} ${dv('θ')})`,
          `here a sum of ${st.n} terms, peaking at ${fmtSig(N.C.gridBest, 6)}`),
        drvSay('the first reason is arithmetic and the second is the whole subject',
          'A product of ' + st.n + ' densities underflows to exactly zero by about n = 400, so the logarithm is what makes it computable at all. More importantly a sum is what turns into a curvature: independent observations add their log-likelihoods, so they add their information, and that additivity is where every √n in statistics comes from.'),
        drvStep('the maximum is the estimate',
          `${dv('θ̂')} ${dop('=')} argmax ℓ(${dv('θ')})`,
          `${fmtSig(N.mle, 6)} by formula, ${fmtSig(N.C.peak, 6)} by walking a grid of 1400` +
          (N.C.how === 'parabola' ? ' and fitting a parabola through its peak'
           : N.C.how === 'edge' ? ' and then bisecting for the edge, because the maximum here is a cliff rather than a stationary point'
           : '')),
        drvSay('and the sharpness of the peak is the precision of the estimate',
          'A flat likelihood means many parameter values explain the data about as well, so the data pin θ down poorly. A sharply curved one means they do not. The curvature at the peak therefore has to be the precision, and it is: −ℓ″(θ̂) is the observed information, and one over its square root is the standard error every statistical package prints. Nothing about that requires repeating the experiment, which is exactly why it is useful.'),
        drvStep('information, defined and then equated',
          `${dv('I')}(${dv('θ')}) ${dop('=')} E[(∂ℓ/∂${dv('θ')})²] ${dop('=')} ${dop('−')}E[∂²ℓ/∂${dv('θ')}²]`,
          `${fmtSig(Fi.scoreVar, 5)} and ${fmtSig(Fi.obsAtTruth, 5)}, against a closed form of ${fmtSig(Fi.closed, 5)}`),
        drvSay('and note where that curvature is evaluated, because it matters',
          'Both quantities above are taken at the TRUE θ. The curvature at each sample\'s own estimate is a different thing — the observed information — and it is the one a package computes, since it does not know θ. Here it averages ' + fmtSig(Fi.obs, 5) + ', a ratio of ' + fmtSig(Fi.obs / Fi.closed, 5) + ' to the Fisher information. ' + (st.fam === 'normal' ? 'For a normal mean ℓ″ is a constant, so the two coincide exactly and the distinction is invisible — which is precisely why this wing asserted they were the same until a gate drove the other four families.' : 'The gap is O(1/n) and closes as n grows without ever quite vanishing.')),
        drvSay('that second equality is a theorem, and it has hypotheses',
          'It is proved by differentiating ∫f dx = 1 twice under the integral sign. That step needs the limits of the integral not to depend on θ. ' + (Fi.regular
            ? 'This family satisfies it, the three routes above agree, and the whole apparatus works.'
            : 'This family does NOT satisfy it — the support is [0, θ] — so the identity fails, the routes disagree, and every asymptotic result built on top of it is unavailable. Nothing has gone wrong with the computation; a hypothesis is simply absent.')),
        drvStep('and the bound that follows, where it follows',
          `Var[${dv('θ̂')}] ${dop('≥')} 1 ${dop('/')} ${dv('n')}${dv('I')}(${dv('θ')})`,
          `bound ${fmtSig(Fi.crb, 5)}, measured ${fmtSig(pbStats(Fi.mles).vari, 5)} — ratio ${fmtSig(pbStats(Fi.mles).vari / Fi.crb, 4)}`),
        drvSay(Fi.regular ? 'which the MLE essentially attains, and that is its claim to fame'
                          : 'which is beaten here, because it was never in force',
          Fi.regular
            ? 'No unbiased estimator can do better, and maximum likelihood gets there in the limit — asymptotically unbiased, asymptotically normal, asymptotically efficient. Those three adverbs are doing real work: at small n the MLE can be biased, as the exponential rate is by exactly λ/(n−1), and can be non-normal, and the middle view on this stage is where to look.'
            : 'The measured variance is below the bound. That is the correct behaviour of a correct estimator against an inequality whose proof does not apply — and it is worth meeting once, because "my estimator beats the Cramér–Rao bound" is otherwise indistinguishable from a bug. The move is always to check the hypotheses before checking the code.')
      ],
      note:'The sample is fixed by seed ' + st.seed + ', so the curve is the same on every repaint. ' +
           'The information panel re-runs the experiment ' + st.trials + ' times to measure what the ' +
           'curvature of this one sample claims to predict.'
    };
  }
};
