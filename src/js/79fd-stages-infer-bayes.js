/* ============================================================================
   4id · STATISTICAL INFERENCE — the posterior  (wing C14)

     snBayes   prior × likelihood → posterior, and the question it answers

   Every other stage in this wing computes properties of a PROCEDURE: how often
   an interval covers, how often a test fires. This one computes a distribution
   over the parameter itself — the object a reader almost always believes the
   others are giving them, and which they are not.

   The posterior is reached twice throughout: once by multiplying prior by
   likelihood on a grid and normalising by quadrature, which would work for any
   prior whatever, and once by the conjugate formula, which works only here.
   The first is how the arithmetic is really done; the second is the check.
   ============================================================================ */

STAGES.snBayes = {
  title:'Prior × likelihood — a probability about the parameter',
  enter(st, o){
    st.view = ['post', 'wash', 'diag'].indexOf(o.view) >= 0 ? o.view : 'post';
    st.prior = SN_PRIORS[o.prior] ? o.prior : 'flat';
    st.priorB = SN_PRIORS[o.priorB] ? o.priorB : 'keen';
    st.k = o.k !== undefined ? o.k : 14;
    st.n = o.n || 25;
    st.level = o.level || 0.95;
    st.prev = o.prev !== undefined ? o.prev : 0.001;
    st.sens = o.sens !== undefined ? o.sens : 0.99;
    st.spec = o.spec !== undefined ? o.spec : 0.95;
    st.prop = o.prop !== undefined ? o.prop : 0.5;
  },
  cur(st){
    const key = [st.view, st.prior, st.priorB, st.k, st.n, st.level,
                 st.prev, st.sens, st.spec, st.prop].join('|');
    return snCache(st, key, () => {
      if(st.view === 'diag'){
        const D = snDiagnostic(st.prev, st.sens, st.spec, 1000000);
        /* the same question asked across every prevalence, which is the plot:
           the answer depends on the disease at least as much as on the test */
        const sweep = [];
        for(let i = 0; i <= 200; i++){
          const lp = -4 + 4 * i / 200;                 /* 10⁻⁴ to 1, logarithmically */
          const pr = Math.pow(10, lp);
          sweep.push({ x:lp, y:snDiagnostic(pr, st.sens, st.spec, 1000000).post });
        }
        /* where a positive result is more likely right than wrong */
        const breakEven = snBisect(p => snDiagnostic(p, st.sens, st.spec, 1e6).post - 0.5, 1e-9, 1);
        return { view:'diag', D, sweep, breakEven };
      }
      if(st.view === 'wash'){
        const A = SN_PRIORS[st.prior], B = SN_PRIORS[st.priorB];
        const W = snPriorWash(A, B, st.prop, 200000, 700);
        /* the n at which the two posteriors are within a hundredth in total
           variation — "how much data does it take for the prior to stop
           mattering", answered rather than gestured at */
        const settled = W.find(q => q.y < 0.01);
        /* TWO RATES, and the whole point of the view is that they differ.
           Fitted in the logarithms over n ≥ 20, which is where both are
           asymptotic — the opening points are still dominated by the priors
           themselves rather than by the data. */
        const rate = key => {
          let sx = 0, sy = 0, sxx = 0, sxy = 0, m = 0;
          for(const q of W){
            const v = key === 'tv' ? q.y : Math.abs(q.meanA - q.meanB);
            if(q.x < 20 || !(v > 0)) continue;
            const X = Math.log(q.x), Y = Math.log(v);
            sx += X; sy += Y; sxx += X * X; sxy += X * Y; m++;
          }
          return m > 1 ? (m * sxy - sx * sy) / (m * sxx - sx * sx) : NaN;
        };
        const meanGap = W.map(q => ({ x:q.x, y:Math.abs(q.meanA - q.meanB) }));
        return { view:'wash', A, B, W, settled, meanGap,
                 tvRate:rate('tv'), meanRate:rate('mean') };
      }
      const P0 = SN_PRIORS[st.prior];
      const G = snPostGrid(P0.a, P0.b, st.k, st.n, 2000);
      const B = snBetaPost(P0.a, P0.b, st.k, st.n);
      const Ig = snCredibleGrid(G, st.level);
      const Ib = snCredibleBeta(B.a, B.b, st.level);
      const Bl = snPostBlend(P0.a, P0.b, st.k, st.n);
      /* the frequentist interval on the same data, for the comparison that is
         the point of the stage — two intervals, two different objects */
      const wilson = SN_PROP_CIS.wilson.make(st.k, st.n, st.level);
      return { view:'post', P0, G, B, Ig, Ib, Bl, wilson,
               mle:st.n > 0 ? st.k / st.n : NaN };
    });
  },
  controls(){
    const st = ST, N = this.cur(st);
    const head = ctSeg('snBv', st.view, [['post', 'the posterior'], ['wash', 'does the prior matter?'],
                                         ['diag', 'a positive test result']]);
    if(st.view === 'diag')
      return head +
        ctlRow('how common', ctlSlider('snBpv', 0.0001, 0.5, 0.0001, st.prev)) +
        ctlRow('sensitivity', ctlSlider('snBse', 0.5, 0.9999, 0.001, st.sens)) +
        ctlRow('specificity', ctlSlider('snBsp', 0.5, 0.9999, 0.001, st.spec)) +
        `<p class="help">A test with ${fmtSig(100 * st.sens, 4)}% sensitivity and
        ${fmtSig(100 * st.spec, 4)}% specificity comes back positive. What is the chance the
        condition is present? The answer is not either of those numbers, and it is not close to
        them — it depends on how common the condition is, which is information the test result
        does not contain.</p>
        <p class="help">The picture is that dependence, over four decades of prevalence. The panel
        computes the answer twice: once by Bayes' rule, and once by building a cohort of a million
        people, rounding every group to a whole person and dividing. The second is the one that
        makes it believable.</p>`;
    if(st.view === 'wash')
      return head +
        ctSeg('snBpa', st.prior, Object.keys(SN_PRIORS).map(k => [k, SN_PRIORS[k].n.split(' —')[0].split(' ')[0]])) +
        ctSeg('snBpb', st.priorB, Object.keys(SN_PRIORS).map(k => [k, SN_PRIORS[k].n.split(' —')[0].split(' ')[0]])) +
        ctlRow('observed proportion', ctlSlider('snBpr', 0.1, 0.9, 0.1, st.prop)) +
        `<p class="help">Two people who disagree before seeing any data, shown the same evidence.
        The curve is the total-variation distance between their posteriors — 0 means they now agree
        exactly, 1 that they have nothing in common — as the amount of data grows with the observed
        proportion held fixed.</p>
        <p class="help"><b>Held fixed is the subtle part.</b> The number of successes must be a
        whole number, so at p = ½ an odd n cannot have proportion ½ at all. The sweep steps in
        whichever size makes the proportion exactly attainable, because a curve whose points are at
        different proportions is not a sweep of one quantity — and the first version of it, which
        stepped by 1, came back alternating up and down for that reason alone.</p>`;
    return head +
      ctSeg('snBp', st.prior, Object.keys(SN_PRIORS).map(k => [k, SN_PRIORS[k].n.split(' —')[0].split(' ')[0]])) +
      ctlRow('successes k', ctlSlider('snBk', 0, 60, 1, st.k)) +
      ctlRow('trials n', ctlSlider('snBn', 1, 60, 1, st.n)) +
      ctlRow('credible level', ctlSlider('snBl', 0.5, 0.995, 0.005, st.level)) +
      `<p class="help"><b>${N.P0.n}.</b> ${N.P0.why}</p>
      <p class="help">Three curves: what you believed before, how well each value of p explains
      ${st.k} successes in ${st.n}, and the two multiplied and rescaled to enclose unit area. That
      last step is the only arithmetic in Bayes' theorem — the rest is notation.</p>
      <p class="help">The shaded band is the ${fmtSig(100 * st.level, 4)}% <b>credible</b> interval,
      and it means the thing readers wrongly believe a confidence interval means: given this prior
      and this data, there is a ${fmtSig(100 * st.level, 3)}% probability that p is in there. The
      frequentist interval on the same data is drawn beneath it for comparison.</p>`;
  },
  wire(){
    ctWireSeg('snBv', v => { ST.view = v; });
    ctWireSeg('snBp', v => { ST.prior = v; });
    ctWireSeg('snBpa', v => { ST.prior = v; });
    ctWireSeg('snBpb', v => { ST.priorB = v; });
    /* k and n are coupled: k successes out of n cannot exceed n, and a control
       that allows it produces a likelihood that is zero everywhere and a
       posterior that is 0/0. The clamp is on the pair rather than on either. */
    wireSlider('snBk', () => ST.k, v => { ST.k = Math.max(0, Math.round(v)); },
               v => Math.round(v) + ' successes',
               () => ({ lo:0, hi:ST.n,
                 why:'There cannot be more successes than trials — raise the number of trials first.' }));
    wireSlider('snBn', () => ST.n, v => {
                 ST.n = Math.max(1, Math.round(v));
                 if(ST.k > ST.n) ST.k = ST.n;
               }, v => Math.round(v) + ' trials',
               () => ({ lo:1, hi:100000,
                 why:'Held here. The grid has 2000 cells and past this the posterior is narrower than one of them, so the picture stops being a picture.' }));
    wireSlider('snBl', () => ST.level, v => { ST.level = v; },
               v => fmtNum(100 * v, 4) + '%', snLimLevel);
    wireSlider('snBpr', () => ST.prop, v => { ST.prop = v; }, v => 'p = ' + fmtNum(v, 3),
               () => ({ lo:0.05, hi:0.95, why:'Outside this the rounding of k to a whole number dominates at the small end of the sweep.' }));
    wireSlider('snBpv', () => ST.prev, v => { ST.prev = v; },
               v => fmtSig(100 * v, 3) + '% of people',
               () => ({ lo:1e-7, hi:0.999, why:'A prevalence is a proportion of a population.' }));
    wireSlider('snBse', () => ST.sens, v => { ST.sens = v; }, v => fmtSig(100 * v, 4) + '%',
               () => ({ lo:0.01, hi:0.99999, why:'A rate, strictly inside 0 and 1: at 1 the test never misses and there is nothing left to compute.' }));
    wireSlider('snBsp', () => ST.spec, v => { ST.spec = v; }, v => fmtSig(100 * v, 4) + '%',
               () => ({ lo:0.01, hi:0.99999, why:'A rate, strictly inside 0 and 1: at 1 there are no false positives and every positive is certain.' }));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(46, z.h + 12);
    if(N.view === 'diag') return this.frameDiag(st, ctx, W, H, top, N);
    if(N.view === 'wash') return this.frameWash(st, ctx, W, H, top, N);

    const G = N.G, P0 = N.P0;
    /* the likelihood, scaled to fit beside the two densities. It is not a
       density in p and does not integrate to 1 — scaling it to a common height
       is honest presentation, and the caption says the height carries nothing. */
    const lik = p => Math.exp(st.k * Math.log(Math.max(p, 1e-300)) +
                              (st.n - st.k) * Math.log(Math.max(1 - p, 1e-300)));
    let likMax = 0;
    for(let i = 0; i < 400; i++) likMax = Math.max(likMax, lik((i + 0.5) / 400));
    const priorMax = Math.max.apply(null, snPts(x => snBetaPdf(x, P0.a, P0.b), 0.002, 0.998, 300)
                                            .map(q => q.y));
    const postMax = Math.max.apply(null, G.dens);
    const ymax = Math.max(postMax, Math.min(priorMax, postMax * 1.4), 1) * 1.15;
    const P = mkPlot(58, top + 8, W - 92, H - top - 100, 0, 1, 0, ymax);
    plotFrame(ctx, P, 'p — the thing being estimated', 'density',
              'prior × likelihood ÷ the area, at ' + st.k + ' of ' + st.n);
    ctGrid(ctx, P);
    /* the credible band, drawn first so the curves sit over it */
    ctFill(ctx, P, [{ x:N.Ib[0], y:0 }, { x:N.Ib[0], y:ymax },
                    { x:N.Ib[1], y:ymax }, { x:N.Ib[1], y:0 }], rgbCss(TH.pos, 0.13));
    ctPath(ctx, P, snPts(x => snBetaPdf(x, P0.a, P0.b), 0.001, 0.999, 400)
                     .filter(q => q.y <= ymax * 1.6), rgbCss(TH.dim), 1.8, [5, 4]);
    ctPath(ctx, P, snPts(x => lik(x) / likMax * postMax * 0.75, 0.001, 0.999, 400),
           rgbCss(TH.warn), 1.8, [3, 4]);
    ctPath(ctx, P, G.xs.map((x, i) => ({ x, y:G.dens[i] })), rgbCss(TH.grad), 2.6);
    /* the two estimates, and the frequentist interval as a bar below the axis */
    const yb = -ymax * 0.0;
    ctPath(ctx, P, [{ x:N.B.mean, y:0 }, { x:N.B.mean, y:ymax }], rgbCss(TH.pos), 2);
    ctPath(ctx, P, [{ x:N.mle, y:0 }, { x:N.mle, y:ymax }], rgbCss(TH.accent), 1.8, [6, 4]);
    const ybar = ymax * 0.035;
    ctPath(ctx, P, [{ x:N.wilson[0], y:ybar }, { x:N.wilson[1], y:ybar }], rgbCss(TH.accent), 3);
    stageNote(ctx, 'posterior mean ' + fmtSig(N.B.mean, 5) + '   ·   credible [' +
              fmtNum(N.Ib[0], 4) + ', ' + fmtNum(N.Ib[1], 4) + ']   ·   Wilson [' +
              fmtNum(N.wilson[0], 4) + ', ' + fmtNum(N.wilson[1], 4) + ']', W, H);
  },
  /* Both quantities on one log–log plot, because the whole content of the view
     is that their SLOPES differ. Plotting the distance alone would show a
     curve falling and invite the usual conclusion; plotting the two together
     shows one falling twice as fast as the other. */
  frameWash(st, ctx, W, H, top, N){
    const W2 = N.W.filter(q => q.y > 0);
    const G = N.meanGap.filter(q => q.y > 0);
    const xs = W2.map(q => Math.log10(q.x));
    const lo = Math.min(G.reduce((a, q) => Math.min(a, Math.log10(q.y)), 0),
                        W2.reduce((a, q) => Math.min(a, Math.log10(q.y)), 0)) - 0.3;
    const P = mkPlot(64, top + 8, W - 98, H - top - 92,
                     0, Math.max.apply(null, xs) + 0.1, lo, 0.4);
    plotFrame(ctx, P, 'log₁₀ of the number of observations', 'log₁₀ of how far apart they are',
              'two priors meeting the same evidence, at p = ' + fmtNum(st.prop, 3));
    ctGrid(ctx, P);
    ctPath(ctx, P, W2.map(q => ({ x:Math.log10(q.x), y:Math.log10(q.y) })), rgbCss(TH.grad), 2.4);
    for(const q of W2) ctDot(ctx, P, Math.log10(q.x), Math.log10(q.y), 3, rgbCss(TH.grad));
    ctPath(ctx, P, G.map(q => ({ x:Math.log10(q.x), y:Math.log10(q.y) })), rgbCss(TH.pos), 2.4);
    for(const q of G) ctDot(ctx, P, Math.log10(q.x), Math.log10(q.y), 3, rgbCss(TH.pos));
    /* reference slopes, so the two exponents can be read off rather than taken
       on trust from the fitted numbers in the panel */
    const ref = (m, y0, col, lbl) => {
      const x0 = Math.log10(20), x1 = P.x1;
      ctPath(ctx, P, [{ x:x0, y:y0 }, { x:x1, y:y0 + m * (x1 - x0) }], col, 1.2, [3, 5]);
      ctText(ctx, P.X(x1) - 6, P.Y(y0 + m * (x1 - x0)) - 6, lbl, rgbCss(TH.dim),
             '11px ' + FONT_UI, 'right', 'bottom');
    };
    const atW = W2.find(q => q.x >= 20), atG = G.find(q => q.x >= 20);
    if(atW) ref(-0.5, Math.log10(atW.y), rgbCss(TH.faint), '1/√n');
    if(atG) ref(-1, Math.log10(atG.y), rgbCss(TH.faint), '1/n');
    if(N.settled)
      ctPath(ctx, P, [{ x:Math.log10(N.settled.x), y:lo }, { x:Math.log10(N.settled.x), y:0.4 }],
             rgbCss(TH.text), 1.6, [4, 4]);
    stageNote(ctx, 'the distributions close like n^' + fmtSig(N.tvRate, 3) +
              ' and their means like n^' + fmtSig(N.meanRate, 3) +
              '   ·   ' + (N.settled ? 'within a hundredth by n = ' + N.settled.x
                                     : 'not within a hundredth even at n = ' + N.W[N.W.length - 1].x),
              W, H);
  },
  frameDiag(st, ctx, W, H, top, N){
    const P = mkPlot(64, top + 8, W - 98, H - top - 92, -4, 0, 0, 1.02);
    plotFrame(ctx, P, 'log₁₀ of how common the condition is', 'chance it is present, given a positive',
              'the same test, across four decades of prevalence');
    ctGrid(ctx, P);
    ctPath(ctx, P, N.sweep, rgbCss(TH.grad), 2.6);
    /* the two numbers a reader is tempted to answer with */
    ctPath(ctx, P, [{ x:-4, y:st.sens }, { x:0, y:st.sens }], rgbCss(TH.warn), 1.6, [5, 4]);
    ctPath(ctx, P, [{ x:-4, y:0.5 }, { x:0, y:0.5 }], rgbCss(TH.faint), 1.2, [3, 5]);
    const lx = Math.log10(st.prev);
    ctPath(ctx, P, [{ x:lx, y:0 }, { x:lx, y:1.02 }], rgbCss(TH.text), 1.6, [3, 4]);
    ctDot(ctx, P, lx, N.D.post, 4.5, rgbCss(TH.pos));
    if(N.breakEven > 1e-4)
      ctDot(ctx, P, Math.log10(N.breakEven), 0.5, 4, rgbCss(TH.neg), true);
    stageNote(ctx, 'at ' + fmtSig(100 * st.prev, 3) + '% prevalence a positive result means ' +
              fmtSig(100 * N.D.post, 4) + '%   ·   the sensitivity is ' +
              fmtSig(100 * st.sens, 4) + '%   ·   they become equally likely only above ' +
              fmtSig(100 * N.breakEven, 3) + '%', W, H);
  },
  readout(st){
    const N = this.cur(st);
    if(N.view === 'diag') return this.readoutDiag(st, N);
    if(N.view === 'wash') return this.readoutWash(st, N);
    const G = N.G, B = N.B, Bl = N.Bl;
    return `<div class="card tight"><div class="ttl">The posterior, two ways</div>
      ${kv('by quadrature on a grid', 'mean ' + fmtSig(G.mean, 8))}
      ${kv('by the conjugate formula', 'mean ' + fmtSig(B.mean, 8) + '  = (a+k)/(a+b+n)')}
      ${kv('the two, compared', fmtAgree(G.mean, B.mean))}
      ${kv('variance, grid against formula', fmtAgree(G.vari, B.vari))}
      ${kv('the posterior is', 'Beta(' + fmtNum(B.a, 5) + ', ' + fmtNum(B.b, 5) + ')')}
      <p class="help">The grid route multiplies the prior by the likelihood at 2000 values of p and
      divides by the area underneath — arithmetic that would work for <i>any</i> prior, including
      ones with no closed form, and which is how the calculation is really done outside the two or
      three textbook cases. The conjugate formula works only because a Beta prior and a binomial
      likelihood multiply to a Beta. They agree to eight figures, which checks both.</p>
      <p class="help">The grid uses the <b>midpoint</b> rule rather than Simpson, and deliberately:
      the Jeffreys prior is unbounded at 0 and 1 — integrable, but a rule that evaluates the
      endpoints returns an infinity there. Midpoint never looks at them.</p>
    </div>
    <div class="card tight"><div class="ttl">The estimate, and what the prior was worth</div>
      ${kv('the data alone say', fmtSig(N.mle, 6) + '  = ' + st.k + '/' + st.n)}
      ${kv('the prior alone said', fmtSig(Bl.priorMean, 6))}
      ${kv('the posterior mean', fmtSig(Bl.exact, 6))}
      ${kv('weight on the prior', fmtSig(100 * Bl.wPrior, 4) + '%  — worth ' +
          fmtSig(Bl.nPrior, 4) + ' observations')}
      ${kv('weight on the data', fmtSig(100 * Bl.wData, 4) + '%  — ' + st.n + ' observations')}
      ${kv('their weighted average', fmtSig(Bl.blend, 8) + ' — ' + fmtAgree(Bl.blend, Bl.exact))}
      <p class="help">This is the cleanest statement of what a prior is: <b>a number of imaginary
      observations</b>. A Beta(a, b) prior carries exactly a + b of them, and the posterior mean is
      the plain weighted average of the prior mean and the sample proportion with those counts as
      weights. The identity is exact, and the last row is it checked rather than asserted.</p>
      ${st.k === 0 || st.k === st.n
        ? `<p class="help"><b>Note what happens at ${st.k === 0 ? 'zero successes' : 'a clean sweep'}.</b>
           The data alone say ${fmtSig(N.mle, 3)} — a claim of certainty from ${st.n} observations —
           while the posterior mean is ${fmtSig(Bl.exact, 4)}. With a flat prior that is Laplace's
           rule of succession, (k+1)/(n+2), and it is the standard answer to "the sun has risen
           every day so far, so it will rise tomorrow with probability 1".</p>`
        : ''}
    </div>
    <div class="card tight"><div class="ttl">Credible against confident — two different objects</div>
      ${kv('credible interval, from the grid', '[' + fmtNum(N.Ig[0], 5) + ', ' + fmtNum(N.Ig[1], 5) + ']')}
      ${kv('credible interval, from the Beta', '[' + fmtNum(N.Ib[0], 5) + ', ' + fmtNum(N.Ib[1], 5) + ']')}
      ${kv('the two routes', fmtGap(Math.max(Math.abs(N.Ig[0] - N.Ib[0]), Math.abs(N.Ig[1] - N.Ib[1])),
          Math.max(1e-12, N.Ib[1] - N.Ib[0]), '', 1e-3) + ' — the grid’s own cell is ' +
          fmtSig(1 / G.N, 2) + ' wide')}
      ${kv('Wilson confidence interval', '[' + fmtNum(N.wilson[0], 5) + ', ' + fmtNum(N.wilson[1], 5) + ']')}
      <p class="help">These are close, and they are not the same statement. The credible interval
      says: <i>given this prior and this data, p is in here with probability
      ${fmtSig(100 * st.level, 3)}%</i> — a probability about p. The confidence interval says: <i>a
      recipe that produces intervals like this one contains the truth
      ${fmtSig(100 * st.level, 3)}% of the time</i> — a probability about the recipe. The first is
      what almost everybody means; only one of the two delivers it, and it needs a prior to do so.</p>
      <p class="help">They converge as the data grow, which is why the confusion survives: with a
      flat prior and a large n the two intervals are nearly identical numbers with entirely
      different meanings. Set n small, or choose the sceptical prior, and watch them separate.</p>
    </div>`;
  },
  readoutWash(st, N){
    const W2 = N.W, last = W2[W2.length - 1];
    return `<div class="card tight"><div class="ttl">Two people who disagree, shown the same data</div>
      ${kv('one believes', N.A.n)}
      ${kv('the other believes', N.B.n)}
      ${kv('before any data, they differ by', fmtSig(W2[0].y, 4) + ' in total variation')}
      ${kv('after ' + last.x + ' observations', fmtSig(last.y, 4))}
      ${kv('their posterior means are then', fmtSig(last.meanA, 5) + ' and ' + fmtSig(last.meanB, 5))}
      <p class="help">Total-variation distance is ½∫|f₁ − f₂|: zero when the two distributions are
      identical, one when they share no support at all. It is computed here by integrating the two
      grid posteriors against each other, so it measures the whole shape rather than only the
      means.</p>
    </div>
    <div class="card tight"><div class="ttl">Two rates, and they are not the same rate</div>
      ${kv('the gap between their MEANS falls like', 'n^' + fmtSig(N.meanRate, 4) + '  — that is 1/n')}
      ${kv('the distance between the DISTRIBUTIONS falls like',
          'n^' + fmtSig(N.tvRate, 4) + '  — that is 1/√n')}
      ${kv('so the prior leaves the estimate', 'roughly √n times faster than it leaves the posterior')}
      ${N.settled
        ? kv('within a hundredth in distance by', 'n = ' + N.settled.x)
        : kv('within a hundredth in distance by', 'not yet at n = ' + last.x)}
      <p class="help"><b>This is the result worth taking from the view, and it is not the expected
      one.</b> "The prior washes out" is usually said about the estimate, and for the estimate it is
      true and fast: the prior contributes a fixed number of imaginary observations against n real
      ones, so its pull on the mean dies like 1/n. But the two posteriors are also getting
      <i>narrower</i>, at the 1/√n rate every standard error has — so the fixed gap between them is
      being measured against a shrinking ruler, and the distributions remain distinguishable far
      longer than their means do.</p>
      <p class="help">Both exponents above are fitted from the curve rather than quoted, over
      n ≥ 20 where both are asymptotic, and the two reference slopes on the plot let them be read
      off directly. The practical reading: with a few hundred observations two reasonable people
      will agree about the value of p, and will still disagree measurably about how sure to be.</p>
    </div>
    <div class="card tight"><div class="ttl">Holding the proportion fixed</div>
      ${kv('the sweep steps in', (W2.length > 1 ? W2[1].x - W2[0].x : 1) + 's')}
      ${kv('every point is at exactly', 'p = ' + fmtNum(st.prop, 3) +
          (W2.every(q => q.exact) ? '  ✓' : '  — some points could not be'))}
      <p class="help">The step size is chosen so that the observed proportion is exactly attainable
      at every point. That is not tidiness: k must be a whole number, so at p = ½ an odd n has no
      proportion of ½ available and lands on 0.667 or 0.333 instead. The first version of this
      sweep stepped by 1 and produced a curve that rose at every odd n — not noise, and not an
      error in the distance, but a sweep of a quantity that was changing between its own points.</p>
    </div>
    <div class="card tight"><div class="ttl">What this does and does not settle</div>
      ${kv('with enough data', 'any two priors that do not exclude the truth converge')}
      ${kv('a prior that assigns zero', 'never moves — no amount of evidence rescues it')}
      <p class="help">This is the honest answer to "isn't the prior just an assumption": with
      enough data it stops mattering, and how much data is a computation rather than a matter of
      opinion — it is the two exponents above. The caveat is real though: a prior that gives a
      region probability exactly zero multiplies the likelihood by zero there forever, and no
      evidence can raise it. That is Cromwell's rule, it is why priors that vanish on part of the
      range are treated with suspicion, and it is the one form of the objection that stands.</p>
      <p class="help">Note also what the curve does <i>not</i> say. It shows two priors converging
      on the same data; it says nothing about whether either was any good, and a confident wrong
      prior with a lot of data ends up in the right place slowly rather than never.</p>
    </div>`;
  },
  readoutDiag(st, N){
    const D = N.D;
    return `<div class="card tight"><div class="ttl">A positive result, on one million people</div>
      ${kv('have the condition', D.ill.toLocaleString() + ' of ' + D.pop.toLocaleString())}
      ${kv('of those, test positive', D.tp.toLocaleString() + '  (the sensitivity, ' +
          fmtSig(100 * st.sens, 4) + '%)')}
      ${kv('do not have it', D.well.toLocaleString())}
      ${kv('of those, test positive anyway', D.fp.toLocaleString() + '  (1 − specificity, ' +
          fmtSig(100 * (1 - st.spec), 4) + '%)')}
      ${kv('so positives total', D.posPop.toLocaleString())}
      ${kv('and the fraction of them that are ill', fmtSig(100 * D.counted, 5) + '%')}
      <p class="help">No formula was used above — it is a cohort of a million people with every
      group rounded to a whole person, and a division. This is the presentation that makes the
      answer believable, and it is worth doing once before trusting the algebra.</p>
    </div>
    <div class="card tight"><div class="ttl">And by Bayes’ rule</div>
      ${kv('P(ill | positive)', fmtSig(100 * D.post, 6) + '%')}
      ${kv('the counted cohort said', fmtSig(100 * D.counted, 6) + '%')}
      ${kv('the two routes', fmtAgree(D.post, D.counted))}
      ${kv('the sensitivity, for comparison', fmtSig(100 * st.sens, 4) + '%')}
      ${kv('they are equally likely only above', fmtSig(100 * N.breakEven, 4) + '% prevalence')}
      <p class="help">P(positive | ill) is ${fmtSig(100 * st.sens, 4)}% and P(ill | positive) is
      ${fmtSig(100 * D.post, 4)}%. Those are the two conditional probabilities of the same pair of
      events, they differ by a factor of ${fmtSig(st.sens / Math.max(1e-12, D.post), 3)} here, and
      reading one as the other is the single most consequential error in applied probability.</p>
      <p class="help">The reason is in the counts above: the healthy group is so much larger that
      even a small false-positive rate applied to it produces more positives than the entire ill
      group contains. Nothing is wrong with the test. The prevalence is doing the work, and it is
      information the test result does not carry.</p>
    </div>
    <div class="card tight"><div class="ttl">The same error, in the wing’s other stages</div>
      ${kv('P(data | H₀ true)', 'the p-value — what a test reports')}
      ${kv('P(H₀ true | data)', 'what a reader wants — and this stage’s arithmetic')}
      <p class="help">The diagnostic problem is a hypothesis test wearing a lab coat. "The condition
      is absent" is the null; a positive result is a significant p-value; the sensitivity is the
      power and the false-positive rate is α. So a p-value of 0.05 does not mean the null is 5%
      likely, for exactly the reason a positive test does not mean the disease is
      ${fmtSig(100 * st.sens, 3)}% likely — the prior prevalence of true effects is missing from
      both, and where that prevalence is low most significant findings are false.</p>
      <p class="help">That is not an argument against testing. It is an argument for knowing which
      of the two conditional probabilities has been computed, and this stage is the one place in
      the wing where the other one is available.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    if(N.view === 'diag')
      return `<div class="k">positive result</div>
        <div style="color:var(--c-${N.D.post < 0.5 ? 'neg' : 'pos'})">${fmtSig(100 * N.D.post, 3)}% ill</div>
        <div style="color:var(--c-dim)">sensitivity ${fmtSig(100 * st.sens, 3)}%</div>`;
    if(N.view === 'wash')
      return `<div class="k">two priors</div>
        <div style="color:var(--c-${N.settled ? 'pos' : 'warn'})">${N.settled ? 'agree by n = ' + N.settled.x : 'still apart'}</div>
        <div style="color:var(--c-dim)">p = ${fmtNum(st.prop, 3)}</div>`;
    return `<div class="k">${st.k} of ${st.n}</div>
      <div style="color:var(--c-pos)">mean ${fmtSig(N.B.mean, 4)}</div>
      <div style="color:var(--c-dim)">prior worth ${fmtSig(N.Bl.nPrior, 3)}</div>`;
  },
  legend(st){
    if(st.view === 'diag')
      return [['var(--c-grad)', 'P(ill | positive)'], ['var(--c-warn)', 'the sensitivity'],
              ['var(--text)', 'the prevalence selected'], ['var(--c-neg)', 'where it reaches a half']];
    if(st.view === 'wash')
      return [['var(--c-grad)', 'distance between the posteriors'],
              ['var(--c-pos)', 'one posterior mean'], ['var(--c-neg)', 'the other'],
              ['var(--text)', 'the observed proportion']];
    return [['var(--dim)', 'the prior'], ['var(--c-warn)', 'the likelihood (height not to scale)'],
            ['var(--c-grad)', 'the posterior'], ['var(--c-pos)', 'posterior mean & credible band'],
            ['var(--accent)', 'k/n, and the Wilson interval']];
  },
  dockLegend:true,
  derive(st){
    const N = this.cur(st);
    if(N.view === 'diag') return {
      title:'Reversing a conditional probability, and why it cannot be done without a prior',
      steps:[
        drvSay('two questions that sound identical',
          '"If you are ill, how often does the test say so?" is the sensitivity, and it is a property of the test. "If the test says so, how often are you ill?" is what a patient wants, and it is not a property of the test at all — it depends on how many ill people there are to find.'),
        drvStep('and the rule that connects them',
          `P(ill ${dop('|')} +) ${dop('=')} P(+ ${dop('|')} ill)P(ill) ${dop('/')} P(+)`,
          `${fmtSig(st.sens, 4)} × ${fmtSig(st.prev, 4)} ÷ ${fmtSig(st.sens * st.prev + (1 - st.spec) * (1 - st.prev), 5)} = ${fmtSig(N.D.post, 5)}`),
        drvSay('the denominator is where the prevalence enters',
          'A positive can arise two ways: a true positive, at rate sensitivity × prevalence, or a false one, at rate (1 − specificity) × (1 − prevalence). When the condition is rare the second population is enormous by comparison, so most positives come from it however good the test is.'),
        drvStep('which the counted cohort shows without any algebra',
          `${N.D.tp.toLocaleString()} true ${dop('+')} ${N.D.fp.toLocaleString()} false ${dop('=')} ${N.D.posPop.toLocaleString()} positives`,
          `of which ${N.D.tp.toLocaleString()} are ill — ${fmtSig(100 * N.D.counted, 5)}%, against Bayes' ${fmtSig(100 * N.D.post, 5)}%: ` +
          fmtAgree(N.D.post, N.D.counted)),
        drvSay('and the counting is the better explanation',
          'Every group is a whole number of people and the answer is one division. Nobody who has seen the four counts finds the result surprising; the surprise is entirely an artefact of reasoning with rates instead. That is worth remembering as a technique rather than as a fact about this example.'),
        drvStep('the break-even prevalence',
          `P(ill ${dop('|')} +) ${dop('=')} ½ when prevalence ${dop('=')} ${fmtSig(N.breakEven, 5)}`,
          'below this a positive result is more likely wrong than right — found by bisection on the same formula'),
        drvSay('and now read it as a statement about hypothesis testing',
          'Replace "ill" with "there is a real effect", "positive" with "p < 0.05", the false-positive rate with α and the sensitivity with power. The structure is identical. So in a field where most tested hypotheses are false — high-throughput screening, say — the majority of significant results are false positives, with no misconduct and no statistical error anywhere. The p-value never claimed otherwise; it is the reversal that is unavailable without a prior.')
      ],
      note:'The cohort is a million people with every group rounded to a whole person, which is why ' +
           'the two routes agree to rounding rather than exactly. Raise the prevalence and the ' +
           'rounding gap shrinks.'
    };
    if(N.view === 'wash') return {
      title:'Does the prior matter? — answered with a number rather than a position',
      steps:[
        drvSay('the objection, stated fairly',
          'A prior is chosen rather than measured, so a posterior appears to be an opinion dressed as arithmetic. Two honest people with different priors will reach different conclusions from the same data, and no rule says which of them is right.'),
        drvStep('so measure how far apart they actually are',
          `TV(f₁, f₂) ${dop('=')} ½∫|f₁ ${dop('−')} f₂| d${dv('p')}`,
          `${fmtSig(N.W[0].y, 4)} before any data, ${fmtSig(N.W[N.W.length - 1].y, 4)} after ${N.W[N.W.length - 1].x} observations`),
        drvStep('the estimate stops disagreeing quickly, and the reason is arithmetic',
          `mean ${dop('=')} (a${dop('+')}b)/(a${dop('+')}b${dop('+')}n) ${dop('×')} prior mean ${dop('+')} n/(a${dop('+')}b${dop('+')}n) ${dop('×')} k/n`,
          `the gap between the two means falls like n^${fmtSig(N.meanRate, 4)} — measured, and 1/n is what the weights predict`),
        drvSay('but the DISTRIBUTIONS take much longer, and that is the finding here',
          'The measured rate for the total-variation distance is n^' + fmtSig(N.tvRate, 4) + ' — one over the square root, not one over n. Both quantities were fitted from the same sweep and they disagree by a factor of √n, so this is not a discrepancy to be explained away: it is two different things converging at two different speeds.'),
        drvSay('and the reason is that the ruler is shrinking too',
          'The prior\'s pull on the centre dies like 1/n, exactly as the weights say. But the posterior itself is narrowing like 1/√n, as every standard error does — so a gap between the centres that is falling like 1/n is being measured in units that are falling like 1/√n, and the ratio, which is what a distribution-level distance sees, falls only like 1/√n. ' + (N.settled ? 'The two posteriors reach a hundredth apart at n = ' + N.settled.x + ', where their means differ by ' + fmtSig(Math.abs(N.settled.meanA - N.settled.meanB), 3) + '.' : 'At n = ' + N.W[N.W.length - 1].x + ' they are still ' + fmtSig(N.W[N.W.length - 1].y, 3) + ' apart.')),
        drvSay('so "the prior washes out" needs saying more carefully than it usually is',
          'It washes out of the point estimate fast — a few hundred observations and two reasonable people agree about the value. It washes out of the full posterior far more slowly, which means they go on disagreeing measurably about how confident to be long after they agree about what is true. Both halves of that are on the plot, and only the second is surprising.'),
        drvSay('one caveat, and it is a real one',
          'The convergence needs both priors to give the truth non-zero density. A prior that assigns exactly zero to a region multiplies by zero there at every step, and no quantity of evidence ever lifts it — "Cromwell\'s rule". That is the one form of the objection that stands, and it is an argument for priors that are merely sceptical rather than certain.'),
        drvSay('and a note on how this curve was computed',
          'k must be a whole number, so an observed proportion of exactly ½ is unavailable at odd n. The sweep therefore steps in whichever size makes the requested proportion attainable — 2 here at p = ½, 5 at p = 2/5. Without that the curve alternates up and down at small n, and it looks like noise in the distance when it is really a change in the data being compared.')
      ],
      note:'Both posteriors are computed on a grid of 700 cells by the midpoint rule, so the ' +
           'distance is an integral over the whole shape rather than a comparison of summaries.'
    };
    const G = N.G, B = N.B, Bl = N.Bl;
    return {
      title:'Bayes’ theorem, which is one line, and what it buys',
      steps:[
        drvSay('the other stages could not answer the question anyone asks',
          'A confidence interval is a statement about a procedure; a p-value is a statement about data in an assumed world. Neither is a probability about the parameter, and both are routinely read as one. Getting an actual probability about p requires saying what was believed before the data — there is no way around that, and the theorem is what turns it into arithmetic.'),
        drvStep('the whole of it',
          `f(${dv('p')} ${dop('|')} data) ${dop('∝')} f(data ${dop('|')} ${dv('p')}) ${dop('×')} f(${dv('p')})`,
          `here Beta(${fmtNum(N.P0.a, 4)}, ${fmtNum(N.P0.b, 4)}) × ${st.k} of ${st.n} → Beta(${fmtNum(B.a, 5)}, ${fmtNum(B.b, 5)})`),
        drvSay('the proportionality is doing all the work that is left',
          'The product of prior and likelihood is not a density — it does not enclose unit area — so it must be divided by its own integral. That integral is the only hard part of Bayesian computation, and in general it is a high-dimensional one that has to be sampled rather than evaluated. Here it is one dimension and the grid does it directly.'),
        drvStep('so the posterior is reached twice',
          `∫ f(${dv('p')})·L(${dv('p')}) d${dv('p')} on 2000 cells, against (a${dop('+')}k, b${dop('+')}n${dop('−')}k)`,
          `mean ${fmtSig(G.mean, 8)} against ${fmtSig(B.mean, 8)} — ` + fmtAgree(G.mean, B.mean)),
        drvSay('and the conjugate form says exactly what a prior is',
          'Beta(a, b) meeting k successes in n gives Beta(a + k, b + n − k): the prior\'s parameters are simply added to the counts. So a Beta(20, 20) prior is literally worth 38 prior observations, and the posterior mean is the weighted average of the prior mean and the data\'s proportion with those counts as the weights. There is nothing metaphorical about "how much the prior is worth" — it is a number of observations.'),
        drvStep('which the panel checks rather than asserts',
          `${fmtSig(Bl.wPrior, 5)}·${fmtSig(Bl.priorMean, 5)} ${dop('+')} ${fmtSig(Bl.wData, 5)}·${fmtSig(Bl.mle, 5)}`,
          `${fmtSig(Bl.blend, 9)} against the exact ${fmtSig(Bl.exact, 9)} — ` + fmtAgree(Bl.blend, Bl.exact)),
        drvStep('and the interval means what people think intervals mean',
          `P(${fmtNum(N.Ib[0], 4)} ${dop('≤')} ${dv('p')} ${dop('≤')} ${fmtNum(N.Ib[1], 4)} ${dop('|')} data) ${dop('=')} ${fmtNum(st.level, 4)}`,
          `against Wilson's confidence interval [${fmtNum(N.wilson[0], 4)}, ${fmtNum(N.wilson[1], 4)}] on the same data`),
        drvSay('the two are close here and they are not the same object',
          'The credible interval is a probability about p, conditional on a prior. The confidence interval is a frequency property of a recipe, with no prior and no probability attached to p at all. With a flat prior and a decent amount of data they nearly coincide numerically, which is exactly why the confusion is so durable — the numbers agree and the sentences do not. Reduce n, or pick the sceptical prior, and they come apart.'),
        drvSay('what it costs',
          'A prior. That is a real cost and this wing does not pretend otherwise: the wash-out view measures how long it takes to stop mattering, and the answer is "not long, unless the prior was extreme". What is bought is the ability to say a probability about the quantity of interest, which no amount of frequentist machinery will ever provide.')
      ],
      note:'The grid is 2000 midpoint cells over (0, 1); the conjugate formula shares nothing with ' +
           'it but the data. Both credible intervals are equal-tailed.'
    };
  }
};
