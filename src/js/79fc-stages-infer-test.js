/* ============================================================================
   4ic · STATISTICAL INFERENCE — hypothesis testing  (wing C14)

     snTest   the null distribution, α, power, multiplicity, and permutation

   A p-value is the answer to a question about a world that is assumed not to
   exist. Everything that goes wrong with testing goes wrong because that
   sentence is hard to hold on to, so this stage builds the assumed world and
   runs it: the null distribution here is drawn from experiments in which the
   null is TRUE by construction, and every rate is counted in it.
   ============================================================================ */

/* two groups a reader can run a permutation test on. The `why` says what each
   is for, and the last is the one that matters: an outlier moves a t test a
   great deal and a rank-free permutation test hardly at all. */
const SN_PAIRS = {
  clear:  { n:'a real difference', why:'Two groups of six, separated by about a standard deviation and a half. Every test agrees, which is the uninteresting case and the right place to start — a method that disagreed here would be broken.',
    a:[5.1, 6.3, 4.8, 7.2, 5.9, 6.6], b:[4.2, 3.9, 5.0, 4.4, 4.9, 3.6] },
  none:   { n:'no difference at all', why:'The same two groups with the separation removed. The observed gap is what chance produces, the p-value is large, and the exact enumeration says precisely how large.',
    a:[4.6, 5.2, 4.1, 5.4, 4.4, 5.0], b:[4.9, 4.3, 5.1, 4.2, 5.3, 4.7] },
  outlier:{ n:'one outlier, and two tests that disagree', why:'The groups of the first preset with one observation mistyped — 26 instead of 6.6. The t test is built on a mean and a standard deviation, and one bad value moves both: it inflates the spread more than the gap and the p-value collapses towards insignificance. The permutation test asks only how unusual the split is among all the ways the same numbers could have been labelled, so a single large value affects it far less. Neither is right; they are answering different questions, and knowing which you asked is the whole skill.',
    a:[5.1, 6.3, 4.8, 7.2, 5.9, 26.0], b:[4.2, 3.9, 5.0, 4.4, 4.9, 3.6] },
  tiny:   { n:'four against four — where exactness matters', why:'Small enough that all 70 relabellings can be listed, and small enough that no normal approximation is credible. The smallest p-value the test can possibly return here is 2/70 = 0.0286, so at these sizes significance at the 1% level is not merely unlikely — it is unreachable, whatever the data say.',
    a:[8.1, 7.4, 9.0, 8.6], b:[5.2, 6.1, 5.8, 6.4] }
};

STAGES.snTest = {
  title:'A p-value, and the world it is a statement about',
  enter(st, o){
    st.view = ['null', 'power', 'multi', 'perm'].indexOf(o.view) >= 0 ? o.view : 'null';
    st.n = o.n || 8;
    st.alpha = o.alpha || 0.05;
    st.delta = o.delta !== undefined ? o.delta : 1.0;
    st.sigma = o.sigma || 2.0;
    st.m = o.m || 20;
    st.trials = o.trials || 4000;
    st.seed = o.seed || 20260819;
    st.pair = SN_PAIRS[o.pair] ? o.pair : 'clear';
    st.shift = o.shift || 0;
    /* the reader-supplied route. `sheet` is the text as typed; `own` selects
       it; `lastGood` is the last set of groups that parsed, so a typo shows a
       complaint over the PREVIOUS picture rather than blanking it. Every one of
       these must be initialised here — the other five methods read them. */
    st.own = !!o.own;
    st.sheet = o.sheet !== undefined ? o.sheet
      : 'before: 12.1, 11.4, 13.6, 12.9, 11.8, 12.4\nafter: 13.9, 14.2, 13.1, 14.8, 13.4, 14.5';
    st.sheetErr = '';
    st.lastGood = null;
  },
  cur(st){
    /* EVERY INPUT THAT MATTERS IS IN THE KEY, including the two that arrived
       last: `own` and the typed sheet. Leaving them out made the cache return
       the previous groups for every edit, so the textarea accepted keystrokes
       and the picture never moved — indistinguishable from an unwired box, and
       reported as one by ./auditcustom.ps1. */
    const key = [st.view, st.n, st.alpha, st.delta, st.sigma, st.m, st.trials,
                 st.seed, st.pair, st.shift, st.own, st.sheet].join('|');
    return snCache(st, key, () => {
      if(st.view === 'perm'){
        let E = SN_PAIRS[st.pair], a, b, labels = ['group A', 'group B'], err = '';
        if(st.own){
          const G = snParseGroups(st.sheet);
          if(G.ok){
            st.lastGood = G;
          } else {
            /* BAD INPUT NEVER BLANKS THE PICTURE. The last set that parsed
               stays on screen, and every complaint is reported with its line. */
            err = G.errs.map(e => 'line ' + e.line + ': ' + e.msg).join(' · ');
          }
          const U = st.lastGood || snParseGroups(st.sheet);
          a = (U.a.length >= 2 ? U.a : SN_PAIRS.clear.a).slice();
          b = (U.b.length >= 2 ? U.b : SN_PAIRS.clear.b).slice();
          labels = U.labels && U.labels.length >= 2 ? U.labels : labels;
          E = { n:'your own two groups', why:'' };
        } else {
          a = E.a.map(v => v + st.shift);
          b = E.b.slice();
        }
        const ex = snPermExact(a, b);
        const sm = snPermSampled(a, b, 20000, st.seed);
        const tt = snTTest2(a, b);
        /* the null distribution itself, for drawing: every relabelling's
           statistic. Only built when the enumeration is affordable — the
           refusal is reported rather than worked around. */
        let dist = null;
        if(ex.ok) dist = snPermDist(a, b);
        return { view:'perm', E, a, b, ex, sm, tt, dist, labels, err };
      }
      if(st.view === 'multi'){
        const ms = [1, 2, 3, 5, 8, 12, 20, 30, 50];
        const sweep = ms.map(m => Object.assign({ m }, snMultiRun(m, st.alpha, st.n, 1200, st.seed + m)));
        const at = snMultiRun(st.m, st.alpha, st.n, st.trials, st.seed);
        return { view:'multi', sweep, at };
      }
      if(st.view === 'power'){
        const ds = [];
        for(let i = 0; i <= 24; i++) ds.push(i * st.sigma * 2.2 / 24);
        const curve = ds.map(d => ({ x:d, y:snPowerClosed(st.n, st.sigma, d, st.alpha) }));
        const pts = [0, 6, 12, 18, 24].map(i => {
          const d = ds[i];
          const S = snPowerSim(st.n, st.sigma, d, st.alpha, 4000, st.seed + i * 13);
          return { x:d, y:S.power, se:S.se };
        });
        return { view:'power', ds, curve, pts,
                 here:snPowerClosed(st.n, st.sigma, st.delta, st.alpha),
                 hereSim:snPowerSim(st.n, st.sigma, st.delta, st.alpha, st.trials, st.seed),
                 need80:snPowerN(st.sigma, st.delta, st.alpha, 0.8),
                 need95:snPowerN(st.sigma, st.delta, st.alpha, 0.95) };
      }
      const R = snNullRun(st.n, st.trials, st.seed, st.alpha, st.sigma);
      return { view:'null', R, crit:snTQuant(1 - st.alpha / 2, st.n - 1) };
    });
  },
  controls(){
    const st = ST, N = this.cur(st);
    const head = ctSeg('snTv', st.view, [['null', 'the null world'], ['power', 'power'],
                                         ['multi', 'many tests'], ['perm', 'permutation']]);
    /* The picker carries the typed route as one of its options, and that is not
       cosmetic. `auditcustom` enters a stage in its DEFAULT state and then
       sweeps the segmented controls; a box reachable only through a demo's
       `opts` is rendered by no pass and exercised by no gate — which is the
       blind spot that script's own comments were written about. Offering it
       here makes it reachable by pointer, by keyboard and by the gate.
       `opts:{own:true}` still seeds it, so the demo lands straight on it. */
    const permSeg = () => ctSeg('snTp', st.own ? 'own' : st.pair,
      Object.keys(SN_PAIRS).map(k => [k, SN_PAIRS[k].n])
        .concat([['own', 'type your own two groups']]));
    if(st.view === 'perm' && st.own)
      return head + permSeg() + `<div class="fld" style="align-items:stretch">
        <textarea id="snTown" rows="4" spellcheck="false" autocomplete="off"
          aria-label="two groups of numbers, one group per line"
          data-audit="control: 4.1 5.2 3.8 4.6 5.0&#10;treated: 7.2 6.8 8.1 7.5 6.9"
          style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
      </div>
      <div class="row wrap">${ctBtn('snTownGo', 'Run the permutation test')}</div>
      <p class="help" id="snTownMsg" style="color:${N.err ? 'var(--c-neg)' : 'var(--faint)'}">${
        N.err || 'One group per line, numbers separated by spaces or commas. An optional <b>name:</b> in front labels the group. Fractions and powers are read as well — <b>3/4</b> and <b>2^5</b> both work, as does anything the site accepts in a number box.'}</p>
      <p class="help">Your two groups are tested exactly the same way: every way of dealing
      ${N.a.length} of these ${N.a.length + N.b.length} numbers into the first group is
      constructed, and the p-value is the fraction whose difference of means is at least as
      large as yours. Nothing is assumed about where the numbers came from.</p>
      <p class="help">If the two groups together are large, the enumeration is refused rather
      than truncated and the sampled version answers instead — the panel says which it used. The
      cap is ${SN_PERM_CAP} relabellings, which is about eleven against eleven.</p>`;
    if(st.view === 'perm')
      return head + permSeg() +
        ctlRow('shift group A', ctlSlider('snTsh', -3, 3, 0.1, st.shift)) +
        `<p class="help"><b>${N.E.n}.</b> ${N.E.why}</p>
        <p class="help">The null hypothesis here is that the labels mean nothing. If that is true,
        every way of dealing ${N.a.length} of these ${N.a.length + N.b.length} numbers into group A
        was equally likely — so the exact null distribution is the list of <b>all of them</b>, and
        the p-value is the fraction whose gap is at least as large as the one observed. No normal
        distribution appears anywhere in that sentence, and no assumption about the shape of the
        data is used.</p>`;
    return head +
      ctlRow('sample size n', ctlSlider('snTn', 3, 60, 1, st.n)) +
      ctlRow('α', ctlSlider('snTa', 0.001, 0.2, 0.001, st.alpha)) +
      (st.view === 'power' ? ctlRow('true effect δ', ctlSlider('snTd', 0, 4, 0.05, st.delta)) +
                             ctlRow('σ', ctlSlider('snTsg', 0.3, 5, 0.1, st.sigma)) : '') +
      (st.view === 'multi' ? ctlRow('how many tests', ctlSlider('snTm', 1, 60, 1, st.m)) : '') +
      ctlRow('repetitions', ctlSlider('snTt', 1000, 20000, 500, st.trials)) +
      ctlRow('seed', ctlSlider('snTs', 1, 999, 1, st.seed % 1000)) +
      (st.view === 'null'
        ? `<p class="help">Every sample drawn on this view comes from a world where the null
           hypothesis is <b>true</b> — the mean really is 0. So every rejection here is a false
           alarm, by construction, and the fraction of them is what α means. The histogram is the
           statistic; the shaded tails are the rejection region; the curve over it is Student's t
           on ${st.n - 1} degrees of freedom, which nothing in the simulation was told about.</p>`
        : st.view === 'power'
        ? `<p class="help">Power is the other error. α controls how often a true null is rejected;
           power is how often a false one is, and it depends on how false — there is no such thing
           as the power of a test, only its power against a stated effect. The curve is the closed
           form and the dots are simulations at five effect sizes, with their error bars.</p>`
        : `<p class="help">Run ${st.m} tests in a world where <b>every</b> null is true, and count
           the runs in which at least one comes out significant. The uncorrected rate is
           1 − (1 − α)<sup>m</sup>, which at m = ${st.m} is
           ${fmtSig(100 * (1 - Math.pow(1 - st.alpha, st.m)), 3)}% rather than
           ${fmtSig(100 * st.alpha, 3)}%. All three rules below are scored on the same p-values, so
           the only difference between them is where they cut.</p>`);
  },
  wire(){
    ctWireSeg('snTv', v => { ST.view = v; });
    ctWireSeg('snTp', v => {
      if(v === 'own'){ ST.own = true; return; }
      ST.own = false; ST.pair = v; ST.shift = 0;
    });
    /* the typed route. controls() BUILDS the box and wire() ATTACHES to it —
       forgetting the second produces no error at all: the field takes
       keystrokes and the picture keeps the default. auditcustom compares the
       readout across an edit precisely to catch that. */
    (function(){
      const go = () => {
        const t = $('snTown');
        if(!t) return;
        ST.sheet = t.value;
        const G = snParseGroups(ST.sheet);
        const msg = $('snTownMsg');
        if(msg){
          msg.innerHTML = G.ok
            ? 'Read ' + G.a.length + ' and ' + G.b.length + ' observations — ' +
              G.labels.slice(0, 2).join(' against ') + '.'
            : G.errs.map(e => 'line ' + e.line + ': ' + esc(e.msg)).join('<br>');
          msg.style.color = G.ok ? 'var(--faint)' : 'var(--c-neg)';
        }
        refreshStageReadout(); updateStageLegend(); updateStageChip();
      };
      ctWireBtn('snTownGo', go);
      const t = $('snTown');
      if(t) t.addEventListener('change', go);
    })();
    wireSlider('snTn', () => ST.n, v => { ST.n = Math.max(3, Math.round(v)); },
               v => 'n = ' + Math.round(v),
               () => ({ lo:3, hi:Math.max(20, Math.floor(4e5 / Math.max(1, ST.trials / 40))),
                 why:'Held here — the cost is n × repetitions, and every repetition also evaluates a t distribution.' }));
    wireSlider('snTa', () => ST.alpha, v => { ST.alpha = v; }, v => 'α = ' + fmtNum(v, 4), snLimAlpha);
    wireSlider('snTd', () => ST.delta, v => { ST.delta = v; }, v => 'δ = ' + fmtNum(v, 3),
               () => ({ lo:0, hi:50, why:'An effect this large is rejected essentially always; the curve has nothing left to show.' }));
    wireSlider('snTsg', () => ST.sigma, v => { ST.sigma = v; }, v => 'σ = ' + fmtNum(v, 3),
               () => ({ lo:1e-3, hi:1e3, why:'σ is a width and must be positive.' }));
    wireSlider('snTm', () => ST.m, v => { ST.m = Math.max(1, Math.round(v)); },
               v => Math.round(v) + ' tests',
               () => ({ lo:1, hi:400, why:'Held here. Each repetition runs m whole t tests, so this multiplies the work directly.' }));
    wireSlider('snTt', () => ST.trials, v => { ST.trials = Math.max(500, Math.round(v)); },
               v => Math.round(v) + ' repetitions',
               () => ({ lo:500, hi:Math.max(2000, Math.floor(4e5 / Math.max(1, ST.n / 8))),
                 why:'Held here — the cost is n × repetitions.' }));
    wireSlider('snTsh', () => ST.shift, v => { ST.shift = v; },
               v => (v >= 0 ? '+' : '−') + fmtNum(Math.abs(v), 3),
               () => ({ lo:-50, hi:50, why:'Far outside this the two groups no longer overlap at all and every test returns its smallest possible p-value.' }));
    wireSlider('snTs', () => ST.seed % 1000, v => { ST.seed = 20260000 + Math.round(v); },
               v => 'seed ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const z = ctChipZone(ctx);
    const top = Math.max(46, z.h + 12);
    if(N.view === 'power') return this.framePower(st, ctx, W, H, top, N);
    if(N.view === 'multi') return this.frameMulti(st, ctx, W, H, top, N);
    if(N.view === 'perm')  return this.framePerm(st, ctx, W, H, top, N);

    const R = N.R, crit = N.crit;
    const lim = Math.max(4.5, crit * 1.6);
    const Hs = pbHist(R.ts.filter(t => Math.abs(t) <= lim), -lim, lim, 60);
    const ymax = Math.max(Math.max.apply(null, Hs.density), snTPdf(0, st.n - 1)) * 1.2;
    const P = mkPlot(58, top + 8, W - 92, H - top - 92, -lim, lim, 0, ymax);
    plotFrame(ctx, P, 't = (x̄ − 0) ÷ (s/√n)', 'density',
              'the statistic in ' + R.trials + ' experiments where the null is TRUE');
    ctGrid(ctx, P);
    /* the rejection region — everything outside the critical value */
    const band = (x0, x1) => ctFill(ctx, P, [{ x:x0, y:0 }, { x:x0, y:ymax },
                                             { x:x1, y:ymax }, { x:x1, y:0 }], rgbCss(TH.neg, 0.14));
    band(-lim, -crit); band(crit, lim);
    for(let i = 0; i < Hs.counts.length; i++){
      if(!(Hs.density[i] > 0)) continue;
      const c = Hs.centres[i];
      ctFill(ctx, P, [{ x:c - Hs.w / 2, y:0 }, { x:c - Hs.w / 2, y:Hs.density[i] },
                      { x:c + Hs.w / 2, y:Hs.density[i] }, { x:c + Hs.w / 2, y:0 }],
             rgbCss(TH.grad, 0.32));
    }
    ctPath(ctx, P, snPts(x => snTPdf(x, st.n - 1), -lim, lim, 300), rgbCss(TH.accent), 2.2);
    ctPath(ctx, P, [{ x:crit, y:0 }, { x:crit, y:ymax }], rgbCss(TH.neg), 2, [5, 4]);
    ctPath(ctx, P, [{ x:-crit, y:0 }, { x:-crit, y:ymax }], rgbCss(TH.neg), 2, [5, 4]);
    stageNote(ctx, 'rejected ' + fmtSig(100 * R.rate, 4) + '% ± ' + fmtSig(100 * R.rateSE, 2) +
              ' of the time, against α = ' + fmtSig(100 * st.alpha, 4) +
              '%   ·   every one of them a false alarm', W, H);
  },
  framePower(st, ctx, W, H, top, N){
    const P = mkPlot(62, top + 8, W - 96, H - top - 92,
                     0, N.ds[N.ds.length - 1], 0, 1.04);
    plotFrame(ctx, P, 'the true effect δ', 'chance of rejecting',
              'power at n = ' + st.n + ', σ = ' + fmtNum(st.sigma, 3));
    ctGrid(ctx, P);
    /* α is the value at δ = 0, and drawing it makes the intercept legible */
    ctPath(ctx, P, [{ x:0, y:st.alpha }, { x:P.x1, y:st.alpha }], rgbCss(TH.neg), 1.6, [5, 4]);
    ctPath(ctx, P, [{ x:0, y:0.8 }, { x:P.x1, y:0.8 }], rgbCss(TH.faint), 1.2, [3, 5]);
    ctPath(ctx, P, N.curve, rgbCss(TH.accent), 2.4);
    for(const q of N.pts){
      ctPath(ctx, P, [{ x:q.x, y:q.y - 2 * q.se }, { x:q.x, y:q.y + 2 * q.se }], rgbCss(TH.pos), 2);
      ctDot(ctx, P, q.x, q.y, 4, rgbCss(TH.pos));
    }
    ctPath(ctx, P, [{ x:st.delta, y:0 }, { x:st.delta, y:1.04 }], rgbCss(TH.text), 1.6, [3, 4]);
    ctDot(ctx, P, st.delta, N.here, 4.5, rgbCss(TH.text));
    stageNote(ctx, 'at δ = ' + fmtNum(st.delta, 3) + ' the power is ' + fmtSig(100 * N.here, 4) +
              '%   ·   80% would need n = ' + N.need80 + ', and 95% would need n = ' + N.need95,
              W, H);
  },
  frameMulti(st, ctx, W, H, top, N){
    const P = mkPlot(62, top + 8, W - 96, H - top - 92,
                     0, N.sweep[N.sweep.length - 1].m, 0, 1.04);
    plotFrame(ctx, P, 'how many tests, all with true nulls', 'chance of at least one “significant” result',
              'the cost of looking more than once');
    ctGrid(ctx, P);
    /* the closed form for the uncorrected rule, drawn as a curve rather than
       through the simulated points, so the two really are separate routes */
    ctPath(ctx, P, snPts(m => 1 - Math.pow(1 - st.alpha, m), 0, P.x1, 200), rgbCss(TH.accent), 2, [6, 4]);
    const series = (k, col) => {
      ctPath(ctx, P, N.sweep.map(q => ({ x:q.m, y:q[k].fwer })), rgbCss(col), 2.2);
      for(const q of N.sweep) ctDot(ctx, P, q.m, q[k].fwer, 3, rgbCss(col));
    };
    series('none', TH.neg);
    series('bonf', TH.pos);
    series('holm', TH.grad);
    ctPath(ctx, P, [{ x:0, y:st.alpha }, { x:P.x1, y:st.alpha }], rgbCss(TH.text), 1.4, [4, 4]);
    stageNote(ctx, 'at m = ' + st.m + ': uncorrected ' + fmtSig(100 * N.at.none.fwer, 3) +
              '%, Bonferroni ' + fmtSig(100 * N.at.bonf.fwer, 3) + '%, Holm ' +
              fmtSig(100 * N.at.holm.fwer, 3) + '%   ·   α = ' + fmtSig(100 * st.alpha, 3) + '%',
              W, H);
  },
  framePerm(st, ctx, W, H, top, N){
    if(!N.dist){
      ctText(ctx, W / 2, H / 2, 'too many relabellings to list at these group sizes',
             rgbCss(TH.dim), '13px ' + FONT_UI, 'center', 'middle');
      return;
    }
    const D = N.dist, obs = N.ex.obs;
    const lim = Math.max(Math.abs(obs) * 1.15, D.reduce((a, v) => Math.max(a, Math.abs(v)), 0));
    const Hs = pbHist(D, -lim, lim, Math.min(60, Math.max(15, Math.round(Math.sqrt(D.length)))));
    const ymax = Math.max.apply(null, Hs.density) * 1.2 || 1;
    const P = mkPlot(58, top + 8, W - 92, H - top - 92, -lim, lim, 0, ymax);
    plotFrame(ctx, P, 'difference of the group means', 'density',
              'all ' + D.length + ' ways of dealing the labels');
    ctGrid(ctx, P);
    for(let i = 0; i < Hs.counts.length; i++){
      if(!(Hs.density[i] > 0)) continue;
      const c = Hs.centres[i];
      const extreme = Math.abs(c) >= Math.abs(obs) - Hs.w / 2;
      ctFill(ctx, P, [{ x:c - Hs.w / 2, y:0 }, { x:c - Hs.w / 2, y:Hs.density[i] },
                      { x:c + Hs.w / 2, y:Hs.density[i] }, { x:c + Hs.w / 2, y:0 }],
             rgbCss(extreme ? TH.neg : TH.grad, extreme ? 0.4 : 0.3));
    }
    ctPath(ctx, P, [{ x:obs, y:0 }, { x:obs, y:ymax }], rgbCss(TH.pos), 2.4);
    ctPath(ctx, P, [{ x:-obs, y:0 }, { x:-obs, y:ymax }], rgbCss(TH.pos), 1.6, [4, 4]);
    stageNote(ctx, 'observed gap ' + fmtSig(obs, 4) + '   ·   ' + N.ex.ge + ' of ' + N.ex.total +
              ' relabellings are at least this extreme, so p = ' + fmtSig(N.ex.p, 4) +
              '   ·   the t test says ' + fmtSig(N.tt.p, 4), W, H);
  },
  readout(st){
    const N = this.cur(st);
    if(N.view === 'power') return this.readoutPower(st, N);
    if(N.view === 'multi') return this.readoutMulti(st, N);
    if(N.view === 'perm')  return this.readoutPerm(st, N);
    const R = N.R;
    return `<div class="card tight"><div class="ttl">A world where the null is true</div>
      ${kv('samples drawn from', 'mean exactly 0 — so H₀ holds, by construction')}
      ${kv('α, the rate promised', fmtSig(100 * st.alpha, 4) + '%')}
      ${kv('rejections actually made', fmtSig(100 * R.rate, 4) + '% ± ' + fmtSig(100 * R.rateSE, 2))}
      ${kv('the two, compared', snAgreeMC(R.rate, st.alpha, R.rateSE))}
      ${kv('critical value |t| >', fmtSig(N.crit, 5) + '  (t on ' + (st.n - 1) + ' df)')}
      <p class="help">Every rejection counted here is a false alarm — there is no effect to find.
      α is not the chance that a significant result is wrong; it is the chance of getting one when
      there is nothing there. Those are different quantities and the Bayesian stage in this wing
      computes the first, which needs a prior and is usually much larger than people expect.</p>
    </div>
    <div class="card tight"><div class="ttl">The stronger check: the p-values are uniform</div>
      ${kv('KS distance from uniform', fmtSig(R.ks, 4))}
      ${kv('its 5% critical value', fmtSig(R.ksCrit, 4) + '  (1.358/√m)')}
      ${kv('verdict', R.ks < R.ksCrit
          ? 'inside — the p-values are uniform, so the rate is right at EVERY α at once'
          : 'outside — the p-values are not uniform and the calibration is wrong')}
      <p class="help">Checking that the rejection rate equals α at one α is weak: a badly calibrated
      test can still get one threshold right. The strong statement is that under H₀ the p-value is
      uniformly distributed on [0, 1] — which is equivalent to the rate being correct at every
      threshold simultaneously, and is what "the p-value means what it says" amounts to. That is
      what the row above measures, and it is where the normal approximation in the wing below fails
      at small n while the exact t distribution used here does not.</p>
    </div>
    <div class="card tight"><div class="ttl">What a p-value is, and what it is not</div>
      ${kv('it is', 'P(a statistic this extreme | the null is true)')}
      ${kv('it is not', 'P(the null is true | a statistic this extreme)')}
      ${kv('nor is it', 'the size of the effect, or the chance of replicating')}
      <p class="help">The first two differ by exactly Bayes' rule, and the missing ingredient is how
      plausible the null was to begin with. Reversing a conditional probability without a prior is
      the same error as reading a positive test result as a diagnosis, and this wing computes both
      halves of that in the ${'“'}posterior${'”'} stage — where a test with 99% sensitivity
      on a disease affecting one person in a thousand returns a positive that is wrong 98% of the
      time.</p>
    </div>`;
  },
  readoutPower(st, N){
    return `<div class="card tight"><div class="ttl">Power against this effect</div>
      ${kv('effect δ', fmtSig(st.delta, 5) + '  (' + fmtSig(st.delta / st.sigma, 3) + ' standard deviations)')}
      ${kv('power, closed form', fmtSig(100 * N.here, 5) + '%')}
      ${kv('power, simulated', fmtSig(100 * N.hereSim.power, 4) + '% ± ' + fmtSig(100 * N.hereSim.se, 2))}
      ${kv('the two, compared', snAgreeMC(N.hereSim.power, N.here, N.hereSim.se))}
      <p class="help">Two routes: a normal-shift formula, and ${N.hereSim.trials} runs of the test
      against data that really do have this effect. There is no such thing as "the power of a test"
      — it is a function of the effect, and quoting one number without stating the effect it is
      against is meaningless.</p>
    </div>
    <div class="card tight"><div class="ttl">How large a study would need to be</div>
      ${kv('for 80% power', 'n = ' + N.need80)}
      ${kv('for 95% power', 'n = ' + N.need95)}
      ${kv('at the current n = ' + st.n, fmtSig(100 * N.here, 4) + '%')}
      <p class="help">This is the calculation that belongs <i>before</i> an experiment and is
      usually done after it, if at all. Note how it scales: the required n goes like σ²/δ², so
      halving the effect you want to detect costs four times the data. That single fact explains
      why small studies of small effects are not weak evidence but no evidence — at n = ${st.n}
      against δ = ${fmtNum(st.delta, 3)} the test finds a real effect
      ${fmtSig(100 * N.here, 3)}% of the time, and a study that fails to find it has said almost
      nothing.</p>
    </div>
    <div class="card tight"><div class="ttl">The two errors, and the trade between them</div>
      ${kv('α — reject a true null', fmtSig(100 * st.alpha, 4) + '%')}
      ${kv('power at δ = 0', fmtSig(100 * snPowerClosed(st.n, st.sigma, 0, st.alpha), 4) +
          '% — which is exactly α, and must be')}
      ${kv('β — fail to reject a false one', fmtSig(100 * (1 - N.here), 4) + '% at this δ')}
      <p class="help">The power curve starts at α, not at zero: with no effect present the test
      still fires at its own false-alarm rate, and that is the definition rather than a defect.
      Lowering α pushes the whole curve down — fewer false alarms and less power — so the two
      errors cannot both be reduced by choosing a threshold. Only more data moves both, which is
      what the row above is really saying.</p>
    </div>`;
  },
  readoutMulti(st, N){
    const A = N.at;
    return `<div class="card tight"><div class="ttl">${st.m} tests, every null true</div>
      ${kv('uncorrected, at least one “significant”', fmtSig(100 * A.none.fwer, 4) + '% ± ' +
          fmtSig(100 * A.none.se, 2))}
      ${kv('the closed form 1 − (1−α)^m', fmtSig(100 * A.closed, 5) + '%')}
      ${kv('the two, compared', snAgreeMC(A.none.fwer, A.closed, A.none.se))}
      ${kv('false alarms per run', fmtSig(A.none.perRun, 4) + ' — the expected count is m·α = ' +
          fmtSig(st.m * st.alpha, 4))}
      <p class="help">Nothing is wrong with any individual test: each fires at exactly
      ${fmtSig(100 * st.alpha, 3)}%. What changes is the question. Asking ${st.m} questions and
      reporting the most striking answer is a different procedure from asking one, and its error
      rate is the one above.</p>
    </div>
    <div class="card tight"><div class="ttl">Two corrections, scored on the same p-values</div>
      ${kv('Bonferroni — cut at α/m', fmtSig(100 * A.bonf.fwer, 4) + '% ± ' + fmtSig(100 * A.bonf.se, 2))}
      ${kv('Holm — step down through α/(m−j)', fmtSig(100 * A.holm.fwer, 4) + '% ± ' +
          fmtSig(100 * A.holm.se, 2))}
      ${kv('rejections per run, Bonferroni', fmtSig(A.bonf.perRun, 4))}
      ${kv('rejections per run, Holm', fmtSig(A.holm.perRun, 4))}
      <p class="help">Both hold the family-wise rate at or below α. Holm rejects at least as often
      as Bonferroni on <i>every</i> data set — it compares the smallest p-value against α/m exactly
      as Bonferroni does, and then, having rejected it, has only m − 1 hypotheses left to protect,
      so the next comparison is against α/(m−1). Same guarantee, strictly more power, and it is
      three lines of code. There is no situation in which Bonferroni is the better choice, which
      makes its position as the default worth noticing.</p>
      <p class="help">Both are answering "how do I never make even one false claim", and that is
      not always the right question. Where hundreds of tests are screening for candidates, the
      useful target is the <i>proportion</i> of claims that are false rather than the chance of any
      — a different quantity with a different procedure.</p>
    </div>`;
  },
  readoutPerm(st, N){
    const ex = N.ex;
    /* a reader may paste a hundred numbers; a readout row is not the place to
       print them all back, and truncating with a count is more use than a wrap */
    const show = xs => xs.length <= 14
      ? xs.map(v => fmtNum(v, 4)).join(', ')
      : xs.slice(0, 12).map(v => fmtNum(v, 4)).join(', ') + ', … (' + xs.length + ' in all)';
    return (N.err ? `<div class="card tight"><div class="ttl">That input could not be read</div>
      ${kv('what is wrong', esc(N.err))}
      <p class="help">The picture and the numbers below are still the <b>last groups that
      parsed</b> — nothing has been blanked, and nothing silently changed. Correct the line above
      and press the button.</p></div>` : '') +
      `<div class="card tight"><div class="ttl">The exact test</div>
      ${kv(N.labels[0], show(N.a))}
      ${kv(N.labels[1], show(N.b))}
      ${kv('observed difference of means', fmtSig(ex.obs, 5))}
      ${ex.ok
        ? `${kv('relabellings enumerated', ex.total + ' — all of them')}
           ${kv('at least as extreme', ex.ge)}
           ${kv('so p =', fmtSig(ex.p, 5) + '  = ' + ex.ge + '/' + ex.total)}`
        : `${kv('relabellings', fmtSig(ex.total, 4) + ' — above the cap of ' + SN_PERM_CAP)}
           ${kv('so p =', 'not computed exactly at these group sizes')}`}
      <p class="help">${ex.ok
        ? `Every one of the ${ex.total} ways of splitting these ${N.a.length + N.b.length} numbers into two labelled groups was constructed and its difference of means recorded. The p-value is a count divided by a count — there is no distribution being assumed, no approximation being made, and no n large enough or small enough to change that.`
        : `The enumeration is <b>refused</b> rather than truncated. A partial list would return a number that looks exactly like an exact p-value and is not one, and the sampled route below is the honest way to answer at this size.`}</p>
    </div>
    <div class="card tight"><div class="ttl">The sampled test, and the t test</div>
      ${kv('sampled over 20 000 relabellings', fmtSig(N.sm.p, 5) + ' ± ' + fmtSig(N.sm.se, 2))}
      ${ex.ok ? kv('against the exact answer', snAgreeMC(N.sm.p, ex.p, N.sm.se)) : ''}
      ${kv('Welch’s t test on the same numbers', fmtSig(N.tt.p, 5) +
          '  (t = ' + fmtSig(N.tt.t, 4) + ' on ' + fmtSig(N.tt.df, 4) + ' df)')}
      <p class="help">The sampled version is what anybody actually runs — at twelve against twelve
      there are already 2.7 million relabellings — and it is an estimate of the exact answer with a
      standard error that can be quoted. Note the +1 in its formula: the labelling that was
      observed is itself one of the permutations, so leaving it out could return a p-value of
      exactly zero, and no finite test can deliver that.</p>
      ${st.own
        ? `<p class="help">These are your numbers, and every route above ran on them unchanged.
           If the enumeration was refused, the groups are large enough that C(N, n₁) exceeds
           ${SN_PERM_CAP} — the sampled p-value with its standard error is then the answer, and it
           is what any package would give you.</p>`
        : st.pair === 'outlier'
        ? `<p class="help"><b>This is the preset where the two disagree.</b> One observation was
           mistyped as 26. The t test divides by a standard deviation that the outlier has inflated,
           so its p-value climbs; the permutation test only asks how unusual the observed split is
           among all splits of these same numbers, and one large value moves that much less.
           Neither is wrong — they test different nulls — but a reader who has only met the first
           will conclude there is no effect.</p>`
        : `<p class="help">Here the two broadly agree, which is the ordinary case: the t test is an
           excellent approximation when its assumptions hold. Select the outlier preset to see them
           come apart, and note that nothing about the data announces which situation you are in.</p>`}
    </div>
    <div class="card tight"><div class="ttl">What exactness costs and buys</div>
      ${kv('smallest p-value reachable', ex.ok ? fmtSig(2 / ex.total, 4) + '  = 2/' + ex.total
          : 'set by the number of relabellings')}
      ${kv('assumptions about the data', 'none — only that the labels are exchangeable under H₀')}
      <p class="help">A permutation test cannot return a p-value below 2 divided by the number of
      relabellings, because the observed split and its mirror are always at least as extreme as
      themselves. At four against four that floor is ${fmtSig(2 / 70, 3)}, so significance at the
      1% level is <b>unreachable at that sample size whatever the data show</b> — a hard fact about
      how much evidence eight numbers can contain, and one a formula-based test hides by returning
      a small number anyway.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    if(N.view === 'power')
      return `<div class="k">power ${fmtSig(100 * N.here, 3)}%</div>
        <div style="color:var(--c-${N.here > 0.8 ? 'pos' : 'warn'})">δ = ${fmtNum(st.delta, 3)}</div>
        <div style="color:var(--c-dim)">80% needs n = ${N.need80}</div>`;
    if(N.view === 'multi')
      return `<div class="k">${st.m} tests, all null</div>
        <div style="color:var(--c-neg)">${fmtSig(100 * N.at.none.fwer, 3)}% uncorrected</div>
        <div style="color:var(--c-pos)">${fmtSig(100 * N.at.holm.fwer, 3)}% with Holm</div>`;
    if(N.view === 'perm')
      return `<div class="k">${N.ex.ok ? N.ex.total + ' relabellings' : 'too many to list'}</div>
        <div style="color:var(--c-${(N.ex.ok ? N.ex.p : N.sm.p) < 0.05 ? 'pos' : 'dim'})">p = ${fmtSig(N.ex.ok ? N.ex.p : N.sm.p, 3)}</div>
        <div style="color:var(--c-dim)">t test ${fmtSig(N.tt.p, 3)}</div>`;
    const R = N.R;
    return `<div class="k">n = ${st.n}, all null</div>
      <div style="color:var(--c-${Math.abs(R.rate - st.alpha) < 2.5 * R.rateSE ? 'pos' : 'neg'})">rejects ${fmtSig(100 * R.rate, 3)}%</div>
      <div style="color:var(--c-dim)">α = ${fmtSig(100 * st.alpha, 3)}%</div>`;
  },
  legend(st){
    if(st.view === 'power')
      return [['var(--accent)', 'power, closed form'], ['var(--c-pos)', 'simulated, ±2 se'],
              ['var(--c-neg)', 'α — the value at δ = 0'], ['var(--text)', 'the effect selected']];
    if(st.view === 'multi')
      return [['var(--c-neg)', 'uncorrected'], ['var(--c-pos)', 'Bonferroni'],
              ['var(--c-grad)', 'Holm'], ['var(--accent)', '1 − (1−α)ᵐ, closed form']];
    if(st.view === 'perm')
      return [['var(--c-grad)', 'relabellings'], ['var(--c-neg)', 'at least as extreme'],
              ['var(--c-pos)', 'the split actually observed']];
    return [['var(--c-grad)', 'the statistic, under H₀'], ['var(--accent)', 'Student’s t'],
            ['var(--c-neg)', 'the rejection region']];
  },
  dockLegend:true,
  derive(st){
    const N = this.cur(st);
    if(N.view === 'perm') return {
      title:'A test that assumes nothing, by listing everything',
      steps:[
        drvSay('the null hypothesis here is about the labels, not about a distribution',
          'Suppose the group labels carry no information — that these ' + (N.a.length + N.b.length) + ' numbers would have come out the same whichever group each had been assigned to. Then every way of dealing the labels was equally likely, and the one that actually happened is a draw from that finite collection.'),
        drvStep('so the null distribution is the collection itself',
          `all C(${dv('N')}, ${dv('n')}₁) ${dop('=')} ${N.ex.ok ? N.ex.total : fmtSig(N.ex.total, 4)} relabellings`,
          N.ex.ok ? 'every one constructed, and its difference of means recorded'
                  : 'above the cap — the enumeration is refused rather than truncated'),
        drvStep('and the p-value is a count',
          `${dv('p')} ${dop('=')} #{ |diff| ${dop('≥')} |observed| } ${dop('/')} total`,
          N.ex.ok ? `${N.ex.ge} / ${N.ex.total} = ${fmtSig(N.ex.p, 5)}`
                  : `estimated at ${fmtSig(N.sm.p, 5)} ± ${fmtSig(N.sm.se, 2)} from 20 000 sampled relabellings`),
        drvSay('notice what has not been assumed',
          'No normal distribution. No equal variances. No large sample. Nothing about the shape of the data at all — only that under the null the labels are exchangeable, which is exactly what "the groups are the same" means. The price is that the test answers a slightly different question from the t test, and the outlier preset is where that difference becomes visible.'),
        drvStep('the t test on the same numbers, for comparison',
          `${dv('t')} ${dop('=')} (${dv('x̄')}₁ ${dop('−')} ${dv('x̄')}₂) ${dop('/')} se`,
          `p = ${fmtSig(N.tt.p, 5)}` + (N.ex.ok ? `, against the exact ${fmtSig(N.ex.p, 5)}` : '')),
        drvSay('and the floor that exactness imposes',
          N.ex.ok
            ? 'The smallest p-value this test can return is ' + fmtSig(2 / N.ex.total, 4) + ', because the observed labelling and its mirror are always among the extreme ones. At these group sizes that is a hard limit on how much evidence the data can contain — and a formula-based test does not have it, because it will happily extrapolate into a tail that the data cannot resolve.'
            : 'With this many relabellings the sampled route is the practical one, and its own standard error is the honest statement of its precision.')
      ],
      note:'The enumeration is capped at ' + SN_PERM_CAP + ' relabellings. Above that it refuses ' +
           'and says so, because a truncated enumeration returns a wrong exact answer that looks ' +
           'exactly like a right one.'
    };
    if(N.view === 'multi') return {
      title:'Why looking twice costs more than twice',
      steps:[
        drvStep('one test behaves',
          `P(reject | H₀ true) ${dop('=')} ${dv('α')} ${dop('=')} ${fmtNum(st.alpha, 4)}`,
          'measured on the first view of this stage'),
        drvSay('but "at least one of m" is a different event',
          'If the m tests are independent and every null is true, the chance that a particular one does not fire is 1 − α, so the chance that none of them fires is (1 − α)^m, and the chance that at least one does is one minus that. Nothing has gone wrong with any test; a different question is being asked of the collection.'),
        drvStep('and it grows fast',
          `1 ${dop('−')} (1 ${dop('−')} ${dv('α')})ᵐ`,
          `at m = ${st.m}: ${fmtSig(100 * N.at.closed, 5)}% closed form, ${fmtSig(100 * N.at.none.fwer, 4)}% measured — ` +
          snAgreeMC(N.at.none.fwer, N.at.closed, N.at.none.se)),
        drvSay('which is why "we found a significant effect" needs to say how many were looked at',
          'Twenty tests at the 5% level, with nothing whatever going on, produce at least one significant result about two times in three. The result is real in the sense that the arithmetic is right; it is the reporting that is wrong, and the missing information is the count of questions asked.'),
        drvStep('Bonferroni: divide the threshold',
          `reject when ${dv('p')} ${dop('<')} ${dv('α')}/${dv('m')}`,
          `family-wise rate ${fmtSig(100 * N.at.bonf.fwer, 4)}% — at or below α, as promised`),
        drvSay('it works by a bound that needs no independence at all',
          'The chance of at least one of several events is at most the sum of their chances — Boole\'s inequality, true whatever the dependence between them. So m tests each at α/m give a family-wise rate of at most α, always. That generality is why it survives, and it is also why it is conservative: when the tests are independent the true rate is 1 − (1 − α/m)^m, which is a little below α.'),
        drvStep('Holm: the same first step, then more',
          `reject the ${dv('j')}-th smallest while ${dv('p')}₍ⱼ₎ ${dop('<')} ${dv('α')}/(${dv('m')}${dop('−')}${dv('j')})`,
          `family-wise rate ${fmtSig(100 * N.at.holm.fwer, 4)}%, with ${fmtSig(N.at.holm.perRun, 4)} rejections per run against Bonferroni's ${fmtSig(N.at.bonf.perRun, 4)}`),
        drvSay('and it dominates Bonferroni on every data set there is',
          'Its first comparison is against α/m, exactly Bonferroni\'s. Having rejected that one, there are m − 1 hypotheses left to protect, so the next may be compared against α/(m−1) — a larger threshold — and so on. It therefore rejects everything Bonferroni does and sometimes more, with the identical guarantee. There is no data set on which Bonferroni is preferable, which makes it a strange thing to teach as the default.')
      ],
      note:'All three rules are scored on the SAME simulated p-values, so the only difference ' +
           'between the three curves is where each of them cuts.'
    };
    if(N.view === 'power') return {
      title:'The other error, and the calculation that belongs before the experiment',
      steps:[
        drvSay('α is only half of the account',
          'A test can be wrong in two ways: it can reject a true null, which happens at rate α by construction, or it can fail to reject a false one. The second has no fixed rate, because it depends on how false the null is — a huge effect is caught almost always and a tiny one almost never, by the same test.'),
        drvStep('so power is a function of the effect',
          `power(${dv('δ')}) ${dop('=')} P(reject | true mean is ${dv('δ')})`,
          `at δ = ${fmtNum(st.delta, 3)}: ${fmtSig(100 * N.here, 5)}% closed form, ` +
          `${fmtSig(100 * N.hereSim.power, 4)}% simulated — ` +
          snAgreeMC(N.hereSim.power, N.here, N.hereSim.se)),
        drvSay('and its value at zero is forced',
          'With no effect at all the test still rejects at rate α — that is what α means — so every power curve starts at α rather than at 0. A curve drawn from the origin is drawing a test that never makes a false alarm, which is a test that never rejects anything.'),
        drvStep('the shift that produces it',
          `${dv('z')} ${dop('=')} ${dv('δ')}√${dv('n')} ${dop('/')} σ`,
          `here ${fmtSig(st.delta * Math.sqrt(st.n) / st.sigma, 4)} standard errors of shift`),
        drvSay('which is the whole design calculation in one expression',
          'Power depends on δ, n and σ only through δ√n/σ. So detecting half the effect needs four times the data, and halving the noise is worth as much as quadrupling the sample. Everything anybody wants to know before running an experiment is in that ratio.'),
        drvStep('inverted, it sizes the study',
          `${dv('n')} ${dop('≈')} (${dv('z')}_{α/2} ${dop('+')} ${dv('z')}_β)² σ² ${dop('/')} ${dv('δ')}²`,
          `${N.need80} for 80% power here, ${N.need95} for 95%`),
        drvSay('and it explains what a non-significant result from a small study is worth',
          'At n = ' + st.n + ' against an effect of ' + fmtNum(st.delta, 3) + ' this test finds a genuinely present effect ' + fmtSig(100 * N.here, 3) + '% of the time. If it comes back non-significant, almost nothing has been learned — the study could not have detected the effect even if it were there. "No significant difference" is a statement about the study\'s resolution at least as much as about the world, and the power is the number that separates the two readings.')
      ],
      note:'The curve is the closed form; the dots are ' + 4000 + ' simulated runs each, with ±2 ' +
           'standard error bars. They are separate routes to the same quantity.'
    };
    const R = N.R;
    return {
      title:'The p-value, and the world it describes',
      steps:[
        drvSay('everything begins by assuming the thing you doubt',
          'A test starts by supposing the null hypothesis is TRUE, works out how the statistic would behave in that world, and then asks where the observed value falls in it. The whole apparatus is conditional on an assumption nobody believes, which is the source of nearly every misreading of the result.'),
        drvStep('so the first job is the distribution in that world',
          `${dv('t')} ${dop('=')} (${dv('x̄')} ${dop('−')} ${dv('μ')}₀) ${dop('/')} (${dv('s')}/√${dv('n')}) ~ ${dv('t')}ₙ₋₁`,
          `the histogram is ${R.trials} experiments with μ = 0, and the curve is t on ${st.n - 1} df — nothing in the simulation was told the curve`),
        drvSay('note which quantity is random and which is fixed',
          'μ₀ is a number chosen by the person asking. x̄ and s come from the data. So the statistic varies because the data do, and the distribution drawn is over repetitions of the experiment — the same object the confidence-interval stage draws as a stack of bars.'),
        drvStep('α is a choice, and the critical value follows from it',
          `reject when |${dv('t')}| ${dop('>')} ${fmtSig(N.crit, 5)}`,
          `giving ${fmtSig(100 * R.rate, 4)}% ± ${fmtSig(100 * R.rateSE, 2)} rejections against a promised ${fmtSig(100 * st.alpha, 4)}% — ` +
          snAgreeMC(R.rate, st.alpha, R.rateSE)),
        drvSay('and every one of those rejections is a false alarm',
          'By construction: the data were generated with mean exactly 0 and the null says the mean is 0. So the shaded area is not an error rate to be reduced by care — it is the rate the procedure was designed to have, and a test with α = 0.05 that never produced a false alarm would be a test that was not working.'),
        drvStep('the p-value is the same statement without a fixed threshold',
          `${dv('p')} ${dop('=')} P(|${dv('T')}| ${dop('≥')} |${dv('t')}_obs| ${dop('|')} H₀)`,
          `under H₀ these are uniform on [0,1] — KS distance ${fmtSig(R.ks, 4)} against a critical ${fmtSig(R.ksCrit, 4)}`),
        drvSay('and that uniformity is the real calibration check',
          'Getting the rate right at one α is weak evidence: a miscalibrated test can hit one threshold by luck. Under the null the p-value should be uniform, which says the rate is right at every threshold at once. That is what the KS row measures, and it is where using a normal tail instead of the t distribution fails at small n — the wing below approximates it, this stage does not.'),
        drvSay('what the number does not say',
          'It is not the probability that the null is true. That quantity needs a prior and is computed on the posterior stage of this wing, where it is routinely an order of magnitude larger than the p-value. It is also not the size of the effect: with enough data a difference of no consequence produces an arbitrarily small p, which is why a p-value should never be reported without the estimate and its interval beside it.')
      ],
      note:'Every sample on this view is drawn from a world where H₀ holds exactly, at seed ' +
           st.seed + '. The t distribution drawn over the histogram is computed from its own ' +
           'density and shares nothing with the simulation.'
    };
  }
};
