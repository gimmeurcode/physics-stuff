/* ============================================================================
   4ib · STATISTICAL INFERENCE — intervals and tests  (wing C14)

     snCI     what "95% confident" is a statement about, measured
     snTest   the null distribution, α, power, and what many tests cost

   Both stages exist to move one sentence from folklore into arithmetic:
   a confidence level and a significance level are properties of a PROCEDURE
   run on data that did not happen, not properties of the data that did. So
   nothing here is asserted from a formula alone — every rate is either counted
   over thousands of repetitions or, where the sample space is finite, summed
   over all of it exactly.
   ============================================================================ */

/* the level control is shared by both stages, and a level is a probability:
   typed entry outside (0, 1) is not an unusual request but a meaningless one */
const snLimLevel = () => ({ lo:0.5, hi:0.9999,
  why:'A confidence level is a probability. Below a half the interval stops being an interval anybody would report, and at 1 it is the whole line.' });
const snLimAlpha = () => ({ lo:1e-4, hi:0.5,
  why:'α is the rate of false alarms you are willing to accept. At 0 nothing is ever rejected and the test has no power at all; above a half it is rejecting more often than not.' });

/* ============================================================================
   3 · CONFIDENCE INTERVALS, AND THE COVERAGE THEY ACTUALLY DELIVER
   ============================================================================ */
STAGES.snCI = {
  title:'“95% confident” — a claim about the procedure, counted',
  enter(st, o){
    st.mode = o.mode === 'prop' ? 'prop' : 'mean';
    st.kind = SN_MEAN_CIS[o.kind] ? o.kind : 't';
    st.method = SN_PROP_CIS[o.method] ? o.method : 'wald';
    st.n = o.n || 5;
    st.level = o.level || 0.95;
    st.trials = o.trials || 8000;
    st.seed = o.seed || 20260819;
    st.mu = o.mu !== undefined ? o.mu : 2;
    st.sigma = o.sigma || 3;
    st.p = o.p !== undefined ? o.p : 0.17;
  },
  cur(st){
    const key = [st.mode, st.kind, st.method, st.n, st.level, st.trials, st.seed,
                 st.mu, st.sigma, st.p].join('|');
    return snCache(st, key, () => {
      if(st.mode === 'prop'){
        const sweeps = {}, mins = {}, means = {};
        for(const m of Object.keys(SN_PROP_CIS)){
          sweeps[m] = snCoverPropSweep(m, st.n, st.level, 340);
          mins[m] = sweeps[m].reduce((a, q) => Math.min(a, q.y), 1);
          means[m] = sweeps[m].reduce((a, q) => a + q.y, 0) / sweeps[m].length;
        }
        const exact = snCoverPropExact(st.method, st.n, st.p, st.level);
        const sim = snCoverPropSim(st.method, st.n, st.p, st.level, st.trials, st.seed);
        /* the interval this particular p most often produces, for the readout */
        const kStar = Math.round(st.n * st.p);
        return { mode:'prop', sweeps, mins, means, exact, sim,
                 kStar, Istar:SN_PROP_CIS[st.method].make(kStar, st.n, st.level),
                 M:SN_PROP_CIS[st.method] };
      }
      const runs = {};
      for(const k of Object.keys(SN_MEAN_CIS))
        runs[k] = snCoverMean(k, st.n, st.level, st.trials, st.seed, st.mu, st.sigma, 42);
      /* the plug-in interval's true coverage is a CLOSED FORM: it is the chance
         that a t on n−1 degrees of freedom stays inside the NORMAL quantile.
         Having it turns "the coverage looks low" into a two-route check. */
      const zq = snZQuant(0.5 + st.level / 2);
      return { mode:'mean', runs, R:SN_MEAN_CIS[st.kind], run:runs[st.kind],
               pluginExact:2 * snTCdf(zq, st.n - 1) - 1, zq,
               tq:snTQuant(0.5 + st.level / 2, st.n - 1) };
    });
  },
  controls(){
    const st = ST, N = this.cur(st);
    const head = ctSeg('snCm', st.mode, [['mean', 'a mean'], ['prop', 'a proportion']]);
    if(st.mode === 'prop')
      return head +
        ctSeg('snCmeth', st.method, Object.keys(SN_PROP_CIS).map(k => [k, SN_PROP_CIS[k].n.split(' ')[0]])) +
        ctlRow('trials n', ctlSlider('snCn', 5, 100, 1, st.n)) +
        ctlRow('the true p', ctlSlider('snCp', 0.01, 0.99, 0.01, st.p)) +
        ctlRow('stated level', ctlSlider('snCl', 0.8, 0.995, 0.005, st.level)) +
        `<p class="help"><b>${N.M.n}.</b> ${N.M.why}</p>
        <p class="help">The curve is <b>not simulated</b>. For a proportion there are only
        ${st.n + 1} possible outcomes, each with a known probability, so the coverage at any p is a
        finite sum: add up the chances of the outcomes whose interval happens to contain p. That is
        the answer rather than an estimate of it — which matters here, because the jaggedness is
        <i>real</i>. A simulation would show the same shape buried in noise and it would be natural
        to dismiss it as noise.</p>`;
    return head +
      ctSeg('snCk', st.kind, Object.keys(SN_MEAN_CIS).map(k => [k, SN_MEAN_CIS[k].n.split(',')[0]])) +
      ctlRow('sample size n', ctlSlider('snCn', 2, 60, 1, st.n)) +
      ctlRow('stated level', ctlSlider('snCl', 0.8, 0.995, 0.005, st.level)) +
      ctlRow('repetitions', ctlSlider('snCt', 1000, 40000, 1000, st.trials)) +
      ctlRow('seed', ctlSlider('snCs', 1, 999, 1, st.seed % 1000)) +
      `<p class="help"><b>${N.R.n}.</b> ${N.R.why}</p>
      <p class="help">Each horizontal bar is one interval from one fresh sample of ${st.n}. The
      vertical line is the true mean, and it never moves — <b>the interval is the random thing</b>.
      Bars that miss are drawn in the warning colour, and the fraction that miss is what the stated
      level is a promise about. It is not a promise about any one of them: an interval either
      contains the mean or it does not, and which it is was settled the moment the data arrived.</p>`;
  },
  wire(){
    ctWireSeg('snCm', v => { ST.mode = v; ST.n = v === 'prop' ? 20 : 5; });
    ctWireSeg('snCk', v => { ST.kind = v; });
    ctWireSeg('snCmeth', v => { ST.method = v; });
    wireSlider('snCn', () => ST.n, v => { ST.n = Math.max(2, Math.round(v)); },
               v => 'n = ' + Math.round(v),
               () => ({ lo:2, hi:ST.mode === 'prop' ? 400 : 4000,
                 why:ST.mode === 'prop'
                   ? 'Held here. The exact coverage sums over all n + 1 outcomes at each of 340 values of p, and past this the sum costs more than the picture gains.'
                   : 'Held here — the cost is n × repetitions.' }));
    wireSlider('snCp', () => ST.p, v => { ST.p = v; }, v => 'p = ' + fmtNum(v, 3),
               () => ({ lo:0.001, hi:0.999, why:'p is a probability and lives strictly inside 0 and 1.' }));
    wireSlider('snCl', () => ST.level, v => { ST.level = v; },
               v => fmtNum(100 * v, 4) + '%', snLimLevel);
    wireSlider('snCt', () => ST.trials, v => { ST.trials = Math.max(500, Math.round(v)); },
               v => Math.round(v) + ' repetitions',
               () => ({ lo:500, hi:Math.max(2000, Math.floor(2e6 / Math.max(2, ST.n))),
                 why:'Held here: the work is n × repetitions.' }));
    wireSlider('snCs', () => ST.seed % 1000, v => { ST.seed = 20260000 + Math.round(v); },
               v => 'seed ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(46, z.h + 12);
    if(N.mode === 'prop') return this.frameProp(st, ctx, W, H, top, N);

    const S = N.run.shown;
    const lo = S.reduce((a, q) => Math.min(a, q.lo), st.mu);
    const hi = S.reduce((a, q) => Math.max(a, q.hi), st.mu);
    const pad = 0.05 * (hi - lo);
    const P = mkPlot(58, top + 8, W - 92, H - top - 92, lo - pad, hi + pad, -1, S.length);
    plotFrame(ctx, P, 'value', 'one repetition of the experiment per row',
              'the first ' + S.length + ' intervals, and the mean they are chasing');
    ctGrid(ctx, P, null, false);
    /* the truth, which does not move */
    ctPath(ctx, P, [{ x:st.mu, y:-1 }, { x:st.mu, y:S.length }], rgbCss(TH.text), 2.2);
    S.forEach((q, i) => {
      const col = q.covers ? rgbCss(TH.pos) : rgbCss(TH.neg);
      ctPath(ctx, P, [{ x:q.lo, y:i }, { x:q.hi, y:i }], col, 2);
      ctDot(ctx, P, q.mid, i, 2.2, col);
    });
    const miss = S.filter(q => !q.covers).length;
    stageNote(ctx, miss + ' of these ' + S.length + ' miss   ·   over all ' + N.run.trials +
              ' repetitions the coverage is ' + fmtSig(100 * N.run.cover, 4) + '% ± ' +
              fmtSig(100 * N.run.se, 2) + '   ·   stated ' + fmtSig(100 * st.level, 4) + '%',
              W, H);
  },
  frameProp(st, ctx, W, H, top, N){
    const lvl = st.level;
    const all = Object.keys(N.sweeps);
    const ylo = Math.min(0.75, all.reduce((a, m) => Math.min(a, N.mins[m]), 1) - 0.03);
    const P = mkPlot(64, top + 8, W - 98, H - top - 92, 0, 1, ylo, 1.005);
    plotFrame(ctx, P, 'the true p', 'coverage actually delivered',
              'exact coverage at n = ' + st.n + ', summed over all ' + (st.n + 1) + ' outcomes');
    ctGrid(ctx, P);
    /* the level promised, so the eye has the line to compare against */
    ctPath(ctx, P, [{ x:0, y:lvl }, { x:1, y:lvl }], rgbCss(TH.text), 2, [6, 4]);
    /* every method faint, and the selected one solid — the comparison IS the
       experiment, and hiding the others would make each look reasonable alone */
    const cols = { wald:TH.neg, wilson:TH.pos, agresti:TH.grad, clopper:TH.curl };
    for(const m of all)
      if(m !== st.method) ctPath(ctx, P, N.sweeps[m], rgbCss(cols[m], 0.28), 1.2);
    ctPath(ctx, P, N.sweeps[st.method], rgbCss(cols[st.method]), 2.4);
    /* where the reader's p sits */
    ctPath(ctx, P, [{ x:st.p, y:ylo }, { x:st.p, y:1.005 }], rgbCss(TH.faint), 1.4, [3, 4]);
    ctDot(ctx, P, st.p, N.exact, 4, rgbCss(cols[st.method]));
    stageNote(ctx, 'at p = ' + fmtNum(st.p, 3) + ' the exact coverage is ' +
              fmtSig(100 * N.exact, 4) + '%   ·   worst over all p: ' +
              fmtSig(100 * N.mins[st.method], 4) + '%   ·   promised ' +
              fmtSig(100 * lvl, 4) + '%', W, H);
  },
  readout(st){
    const N = this.cur(st);
    if(N.mode === 'prop') return this.readoutProp(st, N);
    const R = N.run;
    return `<div class="card tight"><div class="ttl">${N.R.n}</div>
      ${kv('stated level', fmtSig(100 * st.level, 4) + '%')}
      ${kv('coverage delivered', fmtSig(100 * R.cover, 4) + '% ± ' + fmtSig(100 * R.se, 2) +
          '  (' + R.trials + ' repetitions)')}
      ${kv('shortfall', snAgreeMC(R.cover, st.level, R.se))}
      ${kv('average width', fmtSig(R.width, 5))}
      <p class="help">The ± is the simulation's own error. A coverage two of those below the stated
      level is a shortfall; one of them below it is a run that would come out the other way with a
      different seed, and reporting that as a failure would be reading noise. This is why the row
      above is quoted in units of that error.</p>
    </div>
    <div class="card tight"><div class="ttl">All three, side by side at n = ${st.n}</div>
      ${Object.keys(SN_MEAN_CIS).map(k => kv(SN_MEAN_CIS[k].n,
          fmtSig(100 * N.runs[k].cover, 4) + '%   ·   width ' + fmtSig(N.runs[k].width, 4))).join('')}
      <p class="help">The first knows σ and is exactly right; it is not available in practice. The
      second is what a reader gets by substituting s and changing nothing else, and it is
      <b>${fmtSig(100 * (st.level - N.runs.zPlugin.cover), 3)} points short</b> at this n. The third
      is the same interval with the right multiplier and is exactly right again, at a cost of being
      ${fmtSig(100 * (N.runs.t.width / N.runs.zPlugin.width - 1), 3)}% wider.</p>
    </div>
    <div class="card tight"><div class="ttl">The shortfall has a closed form</div>
      ${kv('the multiplier the plug-in interval uses', fmtSig(N.zq, 6) + '  (from the normal)')}
      ${kv('the multiplier it should use', fmtSig(N.tq, 6) + '  (from t on ' + (st.n - 1) + ' df)')}
      ${kv('so its true coverage is 2F(z) − 1', fmtSig(100 * N.pluginExact, 5) + '%')}
      ${kv('simulated, against that', snAgreeMC(N.runs.zPlugin.cover, N.pluginExact, N.runs.zPlugin.se))}
      <p class="help">This is the two-route check that turns an observation into a result. The
      plug-in interval covers whenever |x̄ − μ| stays inside z·s/√n, and that quantity is exactly a
      t statistic — so its coverage is the probability that a t on n − 1 degrees of freedom lands
      inside the <i>normal</i> quantile, which is a number that can be written down. The simulation
      was told none of this and lands on it.</p>
      <p class="help">And it explains why the mistake survives: the two multipliers differ by
      ${fmtSig(100 * (N.tq / N.zq - 1), 3)}% here and by well under a percent past n ≈ 60, so
      substituting s for σ is harmless in a large sample and quietly wrong in the small ones where
      it is most tempting.</p>
    </div>
    <div class="card tight"><div class="ttl">What the level is a statement about</div>
      ${kv('the parameter', 'fixed — it is the vertical line, and it never moves')}
      ${kv('the interval', 'random — a fresh one from every sample')}
      ${kv('the 95%', 'the fraction of intervals, over repetitions, that contain it')}
      <p class="help">Once the data are in hand, the interval either contains μ or it does not; there
      is no probability left in the question. The confidence is in the recipe, and the picture is
      the recipe run ${R.trials} times. This is the single most misquoted sentence in statistics,
      and the honest paraphrase is: <i>if I did this every day, I would be right about
      ${fmtSig(100 * st.level, 3)}% of the days.</i> The Bayesian stage in this wing computes the
      other thing — a probability about the parameter itself — and gets a different object.</p>
    </div>`;
  },
  readoutProp(st, N){
    const worst = Object.keys(N.mins).reduce((a, m) => N.mins[m] < N.mins[a] ? m : a, 'wald');
    return `<div class="card tight"><div class="ttl">${N.M.n}, at n = ${st.n}</div>
      ${kv('at p = ' + fmtNum(st.p, 3) + ', exact coverage', fmtSig(100 * N.exact, 5) + '%')}
      ${kv('by simulation', fmtSig(100 * N.sim.cover, 4) + '% ± ' + fmtSig(100 * N.sim.se, 2))}
      ${kv('the two routes', snAgreeMC(N.sim.cover, N.exact, N.sim.se))}
      ${kv('the commonest outcome, k', N.kStar + ' of ' + st.n)}
      ${kv('and its interval', '[' + fmtNum(N.Istar[0], 4) + ', ' + fmtNum(N.Istar[1], 4) + ']')}
      <p class="help">Two routes to one number: a sum over all ${st.n + 1} outcomes weighted by
      their binomial probabilities, and ${N.sim.trials} simulated experiments. The first is exact
      and the second is an estimate of it — the agreement is a check on the simulation, not on the
      formula.</p>
    </div>
    <div class="card tight"><div class="ttl">Worst case over all p</div>
      ${Object.keys(SN_PROP_CIS).map(m => kv(SN_PROP_CIS[m].n.split('  ')[0],
          'worst ' + fmtSig(100 * N.mins[m], 4) + '%   ·   average ' +
          fmtSig(100 * N.means[m], 4) + '%')).join('')}
      <p class="help">The stated level is ${fmtSig(100 * st.level, 4)}%. Read the worst column
      first: an interval whose coverage dips to ${fmtSig(100 * N.mins[worst], 3)}% for some p is not
      a ${fmtSig(100 * st.level, 3)}% interval, whatever it says on the label, and no reader knows
      which p they have. Then read the average column — Clopper–Pearson never dips below the level
      and averages well above it, which is not a free lunch but an interval wider than the data
      require.</p>
      <p class="help"><b>Wilson is better, not perfect</b>, and the distinction is worth keeping:
      its worst case here is ${fmtSig(100 * N.mins.wilson, 3)}%, which is also below the stated
      level. Every interval for a proportion dips somewhere, because the sample space is discrete
      and the coverage is a staircase — no recipe can make a staircase equal a constant. The
      question is how far it falls, and Wald's ${fmtSig(100 * N.mins.wald, 3)}% against Wilson's
      ${fmtSig(100 * N.mins.wilson, 3)}% is the comparison, not either against perfection.</p>
    </div>
    <div class="card tight"><div class="ttl">Why the curve is jagged</div>
      ${kv('possible outcomes', st.n + 1 + ' — the sample space is finite')}
      ${kv('so coverage in p is', 'a step function: it jumps when an interval’s edge crosses p')}
      <p class="help">Move p by a hundredth and a whole outcome's probability enters or leaves the
      sum at once, so the coverage jumps. That is not an artefact of the drawing and not sampling
      noise — it is what discreteness does, and it is why no interval for a proportion can have
      exactly the stated coverage at every p. The choice is between missing the level sometimes
      (Wald, badly; Wilson, slightly) and exceeding it always (Clopper–Pearson).</p>
      <p class="help">The Wald interval fails hardest near p = 0 and p = 1, where it is also most
      often used — a rare event is exactly the case where somebody reaches for a proportion and a
      confidence interval. At k = 0 it returns a single point of zero width, which covers nothing
      at all and announces total certainty about the one situation carrying least information.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    if(N.mode === 'prop'){
      const bad = N.mins[st.method] < st.level - 0.02;
      return `<div class="k">n = ${st.n}, exact</div>
        <div style="color:var(--c-${bad ? 'neg' : 'pos'})">worst ${fmtSig(100 * N.mins[st.method], 3)}%</div>
        <div style="color:var(--c-dim)">stated ${fmtSig(100 * st.level, 3)}%</div>`;
    }
    const R = N.run, bad = R.cover < st.level - 2.5 * R.se;
    return `<div class="k">n = ${st.n}, ${R.trials} runs</div>
      <div style="color:var(--c-${bad ? 'neg' : 'pos'})">covers ${fmtSig(100 * R.cover, 3)}%</div>
      <div style="color:var(--c-dim)">stated ${fmtSig(100 * st.level, 3)}%</div>`;
  },
  legend(st){
    if(st.mode === 'prop')
      return [['var(--c-neg)', 'Wald'], ['var(--c-pos)', 'Wilson'],
              ['var(--c-grad)', 'Agresti–Coull'], ['var(--c-curl)', 'Clopper–Pearson'],
              ['var(--text)', 'the level promised']];
    return [['var(--c-pos)', 'contains the mean'], ['var(--c-neg)', 'misses it'],
            ['var(--text)', 'the true mean — it never moves']];
  },
  dockLegend:true,
  derive(st){
    const N = this.cur(st);
    if(N.mode === 'prop') return {
      title:'Coverage for a proportion, summed exactly rather than simulated',
      steps:[
        drvSay('the sample space is finite, so nothing needs simulating',
          'A proportion out of ' + st.n + ' trials has exactly ' + (st.n + 1) + ' possible outcomes. Each has a binomial probability, and each produces one interval. The coverage at a given p is then the sum of the probabilities of the outcomes whose interval contains p — a finite sum, and the answer rather than an estimate of it.'),
        drvStep('which is the whole computation',
          `C(${dv('p')}) ${dop('=')} Σₖ [ ${dv('p')} ${dop('∈')} ${dv('I')}(${dv('k')}) ] ${dop('·')} C(${dv('n')},${dv('k')}) ${dv('p')}ᵏ(1${dop('−')}${dv('p')})ⁿ⁻ᵏ`,
          `at p = ${fmtNum(st.p, 3)} this gives ${fmtSig(100 * N.exact, 5)}%, against ${fmtSig(100 * N.sim.cover, 4)}% from ${N.sim.trials} simulated experiments`),
        drvSay('and the indicator in that sum is why the curve is a staircase',
          'As p moves continuously, the bracket flips from 0 to 1 the instant p crosses the edge of one outcome\'s interval — and a whole term joins the sum at once. The coverage therefore jumps rather than drifting, and the jumps are the size of a binomial probability. Nothing about that is noise: run it again and you get exactly the same staircase.'),
        drvStep('the Wald interval, and where it comes from',
          `${dv('p̂')} ${dop('±')} ${dv('z')}√(${dv('p̂')}(1${dop('−')}${dv('p̂')})/${dv('n')})`,
          `worst coverage over all p: ${fmtSig(100 * N.mins.wald, 4)}%, against a promised ${fmtSig(100 * st.level, 4)}%`),
        drvSay('it makes two approximations and the second is the fatal one',
          'First it replaces the binomial by a normal, which is the central limit theorem and is reasonable. Then it replaces the standard error √(p(1−p)/n) — which depends on the unknown p — by the same expression at p̂. That second substitution is the same move the plug-in interval for a mean makes, and it fails the same way: at k = 0 the estimated standard error is exactly zero, the interval has zero width, and it announces perfect certainty in the case that carries the least information of any.'),
        drvStep('Wilson instead inverts the test, and solves exactly',
          `{ ${dv('p')} : |${dv('p̂')} ${dop('−')} ${dv('p')}| ${dop('≤')} ${dv('z')}√(${dv('p')}(1${dop('−')}${dv('p')})/${dv('n')}) }`,
          `worst coverage ${fmtSig(100 * N.mins.wilson, 4)}% — the same z, the same n, and no p̂ inside the square root`),
        drvSay('which is a quadratic in p, and has been since 1927',
          'The set above is exactly the p that the data would not reject, and squaring both sides gives a quadratic whose two roots are the endpoints. It never leaves [0, 1], it is never empty, and it costs one more line of arithmetic than the interval that is taught instead. The reason to know both is that they answer the same question and only one of them keeps its promise.'),
        drvSay('and "exact" does not mean what it sounds like',
          'Clopper–Pearson is built from the binomial with no normal approximation anywhere, and its guarantee is that coverage is never BELOW the stated level. Its average coverage here is ' + fmtSig(100 * N.means.clopper, 4) + '%. The guarantee is one-sided, the price is intervals wider than the data require, and "exact" names the guarantee rather than the coverage.')
      ],
      note:'Every coverage on this stage is a sum over all ' + (st.n + 1) + ' outcomes, at each of ' +
           '340 values of p. The simulation is present only to be compared against it.'
    };
    return {
      title:'What a confidence level is, and the multiplier that makes it true',
      steps:[
        drvSay('the parameter is fixed and the interval is not',
          'μ is a number. It does not have a distribution and nothing about it is uncertain in the probabilistic sense — what varies is the data, and therefore the interval. So a statement of the form "μ lies in [a, b] with probability 0.95" is not available: once a and b are numbers, μ is either in there or it is not, and the probability is 1 or 0 with nobody knowing which.'),
        drvStep('the statement that IS available is about the recipe',
          `P( ${dv('L')}(data) ${dop('≤')} ${dv('μ')} ${dop('≤')} ${dv('U')}(data) ) ${dop('=')} ${fmtNum(st.level, 4)}`,
          `counted here: ${fmtSig(100 * N.run.cover, 4)}% ± ${fmtSig(100 * N.run.se, 2)} over ${N.run.trials} repetitions`),
        drvSay('and the probability is over the data, which is why the picture is many rows',
          'Each row is a different experiment that could have happened. The vertical line is the same in every row. Counting the rows that cross it is the definition being evaluated, and there is no shorter honest description of what the number means.'),
        drvStep('with σ known, the multiplier comes from the normal',
          `${dv('x̄')} ${dop('±')} ${dv('z')} σ/√${dv('n')}, ${dv('z')} ${dop('=')} ${fmtSig(N.zq, 6)}`,
          `coverage ${fmtSig(100 * N.runs.zKnown.cover, 4)}% — exactly the stated level, at every n`),
        drvSay('but σ is never known, and substituting s changes the question',
          'Replace σ by s and the width becomes random too. It is too short more often than it is too long — s is below σ more often than above it, because its distribution is skewed — so the interval misses more often than advertised. The effect is invisible at n = 100 and severe at n = 5.'),
        drvStep('and the size of that is computable, not merely observable',
          `P(|${dv('t')}ₙ₋₁| ${dop('<')} ${dv('z')}) ${dop('=')} 2F(${fmtSig(N.zq, 5)}) ${dop('−')} 1`,
          `${fmtSig(100 * N.pluginExact, 5)}% against a claimed ${fmtSig(100 * st.level, 4)}% — and the simulation gives ` +
          snAgreeMC(N.runs.zPlugin.cover, N.pluginExact, N.runs.zPlugin.se)),
        drvSay('so the fix is not a bigger sample but a bigger multiplier',
          'The quantity (x̄ − μ)/(s/√n) does not follow a normal distribution; it follows Student\'s t on n − 1 degrees of freedom, exactly, whenever the data are normal. Use that distribution\'s quantile — ' + fmtSig(N.tq, 6) + ' here rather than ' + fmtSig(N.zq, 6) + ' — and the coverage is the stated level at every n, with no approximation and no asymptotics.'),
        drvStep('which is the whole of Student’s contribution, in one row',
          `${dv('x̄')} ${dop('±')} ${dv('t')}ₙ₋₁ ${dv('s')}/√${dv('n')}`,
          `coverage ${fmtSig(100 * N.runs.t.cover, 4)}%, at a width ${fmtSig(100 * (N.runs.t.width / N.runs.zPlugin.width - 1), 3)}% greater`),
        drvSay('and the extra width is exactly the cost of not knowing σ',
          'It is not a safety margin and not a convention. The t quantile exceeds the normal one by precisely the amount that restores the promise, and the excess vanishes as n grows because s converges to σ. At n = 60 the two multipliers differ by under a percent, which is why the mistake is harmless in the large samples where nobody needs the correction and damaging in the small ones where everybody does.')
      ],
      note:'Coverage counted over ' + N.run.trials + ' repetitions at seed ' + st.seed +
           '. The intervals drawn are the first ' + N.run.shown.length + ' of them.'
    };
  }
};
