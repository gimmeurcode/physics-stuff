/* ============================================================================
   4y · PROBABILITY AND STATISTICS
   Densities whose moments are obtained by integrating them, sampling done for
   real so the central limit theorem is watched rather than asserted, and
   inference computed from the numbers actually drawn.
   ============================================================================ */

STAGES.pbDist = {
  title:'Distributions and their moments',
  drag:true,
  enter(st, o){
    st.key = o.key || 'normal';
    const D = pbDistCur(st);
    st.p = Object.assign({}, D.par);
    st.x = 0;
  },
  controls(){
    const st = ST, D = pbDistCur(st);
    return pkSeg('pdK', PB_DISTS, st.key, e => e.n) +
      pkBoxes('pbown', st.key, st, PB_OWN, PB_OWN_BOUNDS,
        'Any positive shape — it does not have to integrate to one, because it is normalised for you. ' +
        'The mean and the variance below are then integrals against your density rather than formulas ' +
        'for a family it may not belong to. Try <b>1/(1 + x^2)</b> over a wide interval and watch the ' +
        'variance refuse to settle.') +
      (D.custom ? '' :
        ctlRow(D.pn[0], ctlSlider('pdA', st.key === 'binom' ? 1 : st.key === 'uniform' ? -2 : 0.15,
                                  st.key === 'binom' ? 20 : st.key === 'uniform' ? 1 : 8, 0.05, st.p.a)) +
        (D.pn[1] !== '—' ? ctlRow(D.pn[1], ctlSlider('pdB', st.key === 'binom' ? 0.02 : 0.1,
                                  st.key === 'binom' ? 0.98 : 3, 0.01, st.p.b)) : '')) +
      `<p class="help">A distribution is a <b>density</b>, and everything else about it is an
      integral of that density. The panel does those integrals: the total probability, the mean
      ∫x·f(x)dx and the variance ∫x²f dx − μ² — then prints the closed forms beside them.</p>
      <p class="help">${esc(D.note)}</p>
      <p class="help"><b>Drag on the plot</b> to move the marker and read the cumulative probability
      to its left, which is the area shaded — the CDF is not a second idea but the running integral
      of the first.</p>`;
  },
  wire(){
    pkWire('pdK', 'pbown', ST.key, ST, PB_OWN, PB_OWN_BOUNDS,
      v => { ST.key = v; }, () => { ST.p = Object.assign({}, pbDistCur(ST).par); ST.x = 0; });
    wireSlider('pdA', () => ST.p.a, v => { ST.p.a = v; }, v => fmtNum(+v, 3));
    wireSlider('pdB', () => ST.p.b, v => { ST.p.b = v; }, v => fmtNum(+v, 3));
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.x = st.P.invX(sx);
  },
  frame(st, dt, ctx, W, H){
    const D = pbDistCur(st);
    const M = pbMoments(D, st.p);
    let peak = 1e-9;
    for(let i = 0; i <= 200; i++) peak = Math.max(peak, D.pdf(D.lo + (D.hi - D.lo) * i / 200, st.p));
    const P = mkPlot(80, 55, W - 160, H - 145, D.lo, D.hi, 0, peak * 1.25);
    st.P = P;
    plotFrame(ctx, P, 'x', D.cont ? 'density f(x)' : 'probability P(k)',
              D.n + ' — the shaded area to the left of the marker is the CDF');
    ctGrid(ctx, P);
    if(D.cont){
      /* the region left of the marker, which is what the CDF measures */
      ctx.beginPath();
      ctx.moveTo(P.X(D.lo), P.Y(0));
      for(let i = 0; i <= 300; i++){
        const x = D.lo + (Math.min(st.x, D.hi) - D.lo) * i / 300;
        ctx.lineTo(P.X(x), P.Y(D.pdf(x, st.p)));
      }
      ctx.lineTo(P.X(Math.min(st.x, D.hi)), P.Y(0)); ctx.closePath();
      ctx.fillStyle = rgbCss(TH.grad, 0.25); ctx.fill();
      plotCurve(ctx, P, x => D.pdf(x, st.p), 500, rgbCss(TH.grad), 2.6);
    } else {
      for(let k = 0; k <= D.hi; k++){
        const f = D.pdf(k, st.p);
        if(f < 1e-9) continue;
        const w = Math.max(3, P.pw / (D.hi - D.lo) * 0.62);
        ctx.fillStyle = rgbCss(k <= st.x ? TH.grad : TH.faint, k <= st.x ? 0.85 : 0.5);
        ctx.fillRect(P.X(k) - w / 2, P.Y(f), w, P.Y(0) - P.Y(f));
      }
    }
    /* mean and one standard deviation each side */
    const sd = Math.sqrt(Math.max(0, M.vari));
    ctPath(ctx, P, [{ x:M.mean, y:0 }, { x:M.mean, y:peak * 1.2 }], rgbCss(TH.warn), 2.2, [5, 4]);
    ctArrow(ctx, P, M.mean, peak * 0.45, M.mean + sd, peak * 0.45, rgbCss(TH.curl), 2, 'σ');
    probeLine(ctx, P, st.x, 'x');
    stageNote(ctx, 'orange is the mean, purple one standard deviation — both computed from the density, not looked up', W, H);
  },
  derive(st){
    const D = pbDistCur(st), M = pbMoments(D, st.p);
    const n = v => fmtNum(v, 6);
    const sym = D.cont ? '∫' : 'Σ';
    return {
      title:'Every summary of a distribution is an integral of its density',
      steps:[
        drvStep('the density must account for all the probability',
          `${sym} ${dv('f')}(${dv('x')}) d${dv('x')} ${dop('=')} 1`,
          `computed: ${n(M.total)}`),
        drvStep('the mean is the density weighted by position',
          `μ ${dop('=')} ${sym} ${dv('x')}·${dv('f')}(${dv('x')}) d${dv('x')}`,
          `computed ${n(M.mean)},  closed form ${n(D.mean(st.p))},  difference ${fmtNum(Math.abs(M.mean - D.mean(st.p)), 3)}`),
        drvSay('which is exactly a centre of mass',
          'This is the same integral the multivariable wing evaluates to find a centroid, with the density of a lamina replaced by a probability density. "Expected value" and "centre of mass" are the same computation, and the mean balances the distribution for the same reason a centroid balances a plate.'),
        drvStep('the variance is the second moment about that mean',
          `σ² ${dop('=')} ${sym} ${dv('x')}²${dv('f')} d${dv('x')} ${dop('−')} μ²`,
          `computed ${n(M.vari)},  closed form ${n(D.vari(st.p))},  difference ${fmtNum(Math.abs(M.vari - D.vari(st.p)), 3)}`),
        drvSay('and that is a moment of inertia',
          'Second moment about the centre — the rotation wing calls it I and integrates r²dm. Variance is the moment of inertia of the probability distribution, which is why it adds for independent variables exactly as inertias add for disjoint bodies.'),
        drvStep('the CDF is the running integral',
          `${dv('F')}(${dv('x')}) ${dop('=')} ${sym}<sub>−∞</sub><sup>x</sup> ${dv('f')}(${dv('t')}) d${dv('t')}`,
          `at x = ${n(st.x)}:  F = ${n(pbCdfAt(D, st.p, st.x))}`),
        drvSay('and the CDF is the object that really exists',
          'A continuous density is not a probability — f(x) can exceed 1, and does for any distribution narrower than a unit interval, which alarms people the first time they meet it. What has to lie between 0 and 1 is F, the probability of landing at or below x, and f is only its derivative: a probability <i>per unit x</i>, whose units are the reciprocal of whatever x is measured in. Every question with an answer is a question about F, and that is also why F is what the sampler inverts to draw points.'),
        drvSay('which is why the mean can fail to exist at all',
          'Each row above is an integral, and an integral can diverge. The Cauchy density ∝ 1/(1+x²) is a perfectly respectable distribution — it integrates to 1, it is the shape of a resonance line in the waves wing — and its mean integral ∫x·f does not converge. Not "is hard to compute": does not exist. So "the mean" is not a property every distribution has, and the honest question to ask of a density with heavy tails is whether the moment exists before asking what it equals.')
      ],
      note:'Nothing in this list is special to probability. They are the integrals of the calculus wings, applied to a function that happens to be non-negative and integrate to one.'
    };
  },
  readout(st){
    const D = pbDistCur(st), M = pbMoments(D, st.p);
    const sd = Math.sqrt(Math.max(0, M.vari));
    return `<div class="card tight"><div class="ttl">Moments, by integrating the density</div>
      ${kv('total probability', fmtNum(M.total, 8))}
      ${kv('mean, integrated', fmtNum(M.mean, 6))}
      ${kv('mean, closed form', fmtNum(D.mean(st.p), 6))}
      ${kv('variance, integrated', fmtNum(M.vari, 6))}
      ${kv('variance, closed form', fmtNum(D.vari(st.p), 6))}
      ${kv('standard deviation', fmtNum(sd, 6))}
      <p class="help">The closed forms in a textbook table are results of exactly these integrals.
      Computing both and printing the difference is what turns the table into something checked.</p>
    </div>
    <div class="card tight"><div class="ttl">At the marker x = ${fmtNum(st.x, 4)}</div>
      ${kv(D.cont ? 'density f(x)' : 'probability P(k)', fmtNum(D.pdf(D.cont ? st.x : Math.round(st.x), st.p), 6))}
      ${kv('F(x) — probability to the left', fmtNum(pbCdfAt(D, st.p, st.x), 6))}
      ${kv('probability to the right', fmtNum(1 - pbCdfAt(D, st.p, st.x), 6))}
      ${kv('how many σ from the mean', fmtNum(sd > 0 ? (st.x - M.mean) / sd : 0, 4))}
      <p class="help">${D.cont
        ? 'For a continuous distribution the density is <b>not</b> a probability — it has units of "per x", and only its integral over an interval is a probability. That is why f(x) can exceed 1 while nothing has gone wrong.'
        : 'For a discrete distribution each bar <i>is</i> a probability, so no bar can exceed 1 and they must sum to exactly 1.'}</p>
    </div>`;
  },
  chip(st){
    const D = pbDistCur(st), M = pbMoments(D, st.p);
    return `<div class="k">${D.n}</div><div style="color:var(--c-warn)">μ = ${fmtNum(M.mean, 4)}</div>
      <div style="color:var(--c-curl)">σ = ${fmtNum(Math.sqrt(Math.max(0, M.vari)), 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the density'], ['var(--c-warn)', 'the mean'],
                    ['var(--c-curl)', 'one standard deviation']]; },
  dockLegend:true
};
/* the CDF by quadrature, shared by the readout and the ladder */
function pbCdfAt(D, p, x){
  if(!D.cont){
    let s = 0;
    for(let k = 0; k <= Math.floor(x + 1e-9); k++) s += D.pdf(k, p);
    return Math.min(1, s);
  }
  const n = 800, hi = Math.min(x, D.hi), h = (hi - D.lo) / n;
  if(hi <= D.lo) return 0;
  let s = 0;
  for(let i = 0; i <= n; i++){
    const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    s += w * D.pdf(D.lo + i * h, p);
  }
  return Math.min(1, Math.max(0, s * h / 3));
}

/* ---- 2 · the central limit theorem, run rather than quoted ---------------- */
STAGES.pbCLT = {
  title:'The central limit theorem',
  enter(st, o){
    st.key = o.key || 'expo';
    st.n = o.n || 1;
    st.trials = 4000;
    st.data = null; st.dataKey = '';
  },
  ensure(st){
    const key = st.key + ':' + st.n;
    if(st.dataKey !== key){
      st.data = pbCLT(PB_DISTS[st.key], PB_DISTS[st.key].par, Math.round(st.n), st.trials);
      st.dataKey = key;
    }
    return st.data;
  },
  controls(){
    const st = ST;
    return ctSeg('clK', st.key, ['expo', 'uniform', 'binom', 'poisson', 'normal'].map(k => [k, PB_DISTS[k].n])) +
      ctlRow('sample size n', ctlSlider('clN', 1, 40, 1, st.n)) +
      `<div class="row wrap">${ctBtn('clRe', 'draw again')}</div>
      <p class="help">Take n values from the distribution above, average them, and record the
      average. Do that ${st.trials} times and histogram the results. <b>Slide n upwards.</b></p>
      <p class="help">At n = 1 the histogram is just the original distribution, skew and all. By
      n = 10 it is already close to a bell; by n = 30 the fit is hard to fault. That is the
      <b>central limit theorem</b>: the distribution of an <i>average</i> tends to a normal one
      whatever the thing being averaged looked like, provided it has a finite variance.</p>`;
  },
  wire(){
    ctWireSeg('clK', v => { ST.key = v; ST.dataKey = ''; });
    wireSlider('clN', () => ST.n, v => { ST.n = Math.round(v); ST.dataKey = ''; }, v => String(Math.round(+v)));
    ctWireBtn('clRe', () => { ST.dataKey = ''; });
  },
  frame(st, dt, ctx, W, H){
    const D = PB_DISTS[st.key];
    const xs = this.ensure(st);
    const S = pbStats(xs);
    const lo = S.mean - 4.5 * S.sd, hi = S.mean + 4.5 * S.sd;
    const Hh = pbHist(xs, lo, hi, 44);
    const peak = Math.max(...Hh.density, 1e-9);
    const P = mkPlot(80, 55, W - 160, H - 145, lo, hi, 0, peak * 1.25);
    plotFrame(ctx, P, 'the sample mean', 'density',
              'averages of n = ' + st.n + ' draws from the ' + D.n + ' distribution');
    ctGrid(ctx, P);
    const bw = P.pw / Hh.centres.length;
    Hh.centres.forEach((c, i) => {
      ctx.fillStyle = rgbCss(TH.grad, 0.65);
      ctx.fillRect(P.X(c) - bw * 0.45, P.Y(Hh.density[i]), bw * 0.9, P.Y(0) - P.Y(Hh.density[i]));
    });
    /* the normal the theorem predicts: same mean, sd shrunk by root n */
    const muT = D.mean(D.par), sdT = Math.sqrt(D.vari(D.par) / st.n);
    plotCurve(ctx, P, x => Math.exp(-0.5 * Math.pow((x - muT) / sdT, 2)) / (sdT * Math.sqrt(2 * Math.PI)),
              400, rgbCss(TH.warn), 2.6);
    stageNote(ctx, 'the orange curve is the normal the theorem predicts — nothing was fitted to the bars', W, H);
  },
  derive(st){
    const D = PB_DISTS[st.key];
    const xs = this.ensure(st);
    const S = pbStats(xs);
    const n = v => fmtNum(v, 6);
    return {
      title:'Why the spread shrinks as 1/√n',
      steps:[
        drvStep('the mean of an average is the same mean',
          `E[${dfrac('1', dv('n'))}Σ${dv('X')}<sub>i</sub>] ${dop('=')} ${dfrac('1', dv('n'))}·${dv('n')}μ ${dop('=')} μ`,
          `population μ = ${n(D.mean(D.par))},  observed ${n(S.mean)}`),
        drvSay('but the variance does not survive intact',
          'Variance adds for <em>independent</em> variables — this is the same additivity that lets moments of inertia add for disjoint bodies. It is the additivity, not the averaging, that does the work here.'),
        drvStep('so the variance of the sum is n times one',
          `Var[Σ${dv('X')}<sub>i</sub>] ${dop('=')} ${dv('n')}σ²`,
          `σ² = ${n(D.vari(D.par))},  nσ² = ${n(st.n * D.vari(D.par))}`),
        drvStep('and dividing by n pulls out a factor of n²',
          `Var[${dfrac('1', dv('n'))}Σ${dv('X')}<sub>i</sub>] ${dop('=')} ${dfrac(dv('n')+'σ²', dv('n')+'²')} ${dop('=')} ${dfrac('σ²', dv('n'))}`,
          `predicted sd = σ/√n = ${n(Math.sqrt(D.vari(D.par) / st.n))}`),
        drvStep('so the standard deviation falls as the square root',
          `${dfn('sd')} ${dop('=')} ${dfrac('σ', '<span class="rad">'+dv('n')+'</span>')}`,
          `observed sd of the ${st.trials} averages: ${n(S.sd)}`),
        drvSay('which is why data is expensive',
          'To halve the uncertainty you need four times the data; for one more decimal place, a hundred times. That single square root sets the cost of every experiment, poll and measurement ever made — and it is why the LIGO chirp in the relativity wing took decades of averaging to see.'),
        drvSay('and independence is the hypothesis that actually fails in practice',
          'Variances add only for independent variables; correlated ones bring a covariance term with them and the 1/√n promise quietly stops holding. This is why a poll of a thousand people who all read the same newspaper is not a poll of a thousand people, and why averaging a detector\'s readings does not remove a drift in its calibration. The failure is invisible in the arithmetic — the numbers still shrink like 1/√n — so it has to be argued for from how the data was collected, never from the data itself.'),
        drvSay('the normality half is the surprising half, and it is worth saying why',
          'That the spread shrinks needs only additivity, as above. That the <b>shape</b> becomes the same bell whatever you started with is a much stronger statement, and it is what makes the theorem famous: it says the Gaussian is an attractor. Take any distribution with a finite variance, average enough of them, and the details of where you began are washed out — only the mean and the variance survive. That is why the Gaussian turns up in measurement error, in diffusion, in the Maxwell speed distribution and in quantum ground states, without anything in those situations agreeing about anything else.'),
        drvSay('and it does have hypotheses, which the panel lets you break',
          'A finite variance is required. The Cauchy distribution has none, and averaging Cauchy samples gives you back a Cauchy of exactly the same width — a thousand measurements are worth precisely one. Heavy tails do not merely slow the convergence; they can remove it. This is not a technicality: it is why financial returns and earthquake magnitudes resist the intuition that averaging always helps.')
      ],
      note:'The shape becoming normal is the deeper half of the theorem and needs characteristic functions to prove. The shrinking spread needs only that variances add.'
    };
  },
  readout(st){
    const D = PB_DISTS[st.key];
    const xs = this.ensure(st);
    const S = pbStats(xs);
    const predSd = Math.sqrt(D.vari(D.par) / st.n);
    return `<div class="card tight"><div class="ttl">The ${st.trials} sample means</div>
      ${kv('sample size n', st.n)}
      ${kv('their mean', fmtNum(S.mean, 6))}
      ${kv('the population mean', fmtNum(D.mean(D.par), 6))}
      ${kv('their standard deviation', fmtNum(S.sd, 6))}
      ${kv('σ/√n, predicted', fmtNum(predSd, 6))}
      ${kv('ratio observed/predicted', fmtNum(S.sd / predSd, 5))}
      <p class="help">Nothing is fitted. The orange curve uses the population's own μ and σ with the
      √n rule, and the bars are where the drawn averages actually fell.</p>
    </div>
    <div class="card tight"><div class="ttl">Why this theorem matters so much</div>
      <p class="help">It explains why the normal distribution is everywhere: anything that is the
      <i>sum of many small independent contributions</i> ends up normal, whatever those
      contributions look like individually. Measurement error, thermal noise, height, and the
      diffusion of a particle are all sums of that kind.</p>
      <p class="help">It also has conditions worth respecting. The variance must be finite — a
      Cauchy distribution has none and its sample means never settle. And the contributions must be
      roughly independent; strongly correlated ones do not average away, which is why financial
      risk models built on this assumption fail exactly when correlations spike.</p>
    </div>`;
  },
  chip(st){
    const xs = this.ensure(st), S = pbStats(xs);
    return `<div class="k">CLT</div><div>n = ${st.n}</div>
      <div style="color:var(--c-warn)">sd = ${fmtNum(S.sd, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the sample means, histogrammed'],
                    ['var(--c-warn)', 'the normal the theorem predicts']]; },
  dockLegend:true
};

/* ---- 3 · regression and inference ---------------------------------------- */
STAGES.pbRegress = {
  title:'Regression, correlation & inference',
  drag:true,
  enter(st, o){
    st.pts = (o.pts || []).map(p => p.slice());
    if(!st.pts.length) this.scatter(st, 0.6);
    st.mu0 = 0;
  },
  scatter(st, noise){
    st.pts = Array.from({ length:26 }, () => {
      const x = Math.random() * 8;
      return [x, 1.2 + 0.8 * x + pbRandn() * (noise === undefined ? 0.6 : noise) * 3];
    });
  },
  controls(){
    return `<div class="row wrap">${ctBtn('prClr', 'clear')}${ctBtn('prTight', 'tight scatter')}
      ${ctBtn('prLoose', 'loose scatter')}${ctBtn('prNone', 'no relationship')}</div>
      <p class="help"><b>Click the plot to add points.</b> The regression line, the correlation r and
      the coefficient of determination r² are recomputed from whatever is there.</p>
      <p class="help">r² is not a mysterious quality score: it is literally <b>the fraction of the
      variance the line accounts for</b>, and the panel shows the decomposition
      SS<sub>tot</sub> = SS<sub>reg</sub> + SS<sub>res</sub> adding up. Press "no relationship" and
      watch r² collapse towards zero while the line is still perfectly well defined — a fitted line
      is not evidence that a relationship exists.</p>`;
  },
  wire(){
    ctWireBtn('prClr', () => { ST.pts = []; });
    ctWireBtn('prTight', () => STAGES.pbRegress.scatter(ST, 0.15));
    ctWireBtn('prLoose', () => STAGES.pbRegress.scatter(ST, 1.1));
    ctWireBtn('prNone', () => {
      ST.pts = Array.from({ length:26 }, () => [Math.random() * 8, 4 + pbRandn() * 2]);
    });
  },
  pick(st, sx, sy, phase){
    if(phase !== 'down' || !st.P || !st.P.inside(sx, sy)) return;
    st.pts.push([st.P.invX(sx), st.P.invY(sy)]);
  },
  frame(st, dt, ctx, W, H){
    const P = mkPlot(80, 55, W - 160, H - 145, -0.5, 8.5, -2, 12);
    st.P = P;
    plotFrame(ctx, P, 'x', 'y', 'click to add data — the fit follows');
    ctGrid(ctx, P);
    const R = pbRegress(st.pts.map(p => p[0]), st.pts.map(p => p[1]));
    if(R){
      /* the mean of y, against which the line is judged */
      ctPath(ctx, P, [{ x:P.x0, y:R.my }, { x:P.x1, y:R.my }], rgbCss(TH.faint), 1.6, [5, 4]);
      plotCurve(ctx, P, R.predict, 2, rgbCss(TH.grad), 2.8);
      for(const p of st.pts){
        ctPath(ctx, P, [{ x:p[0], y:p[1] }, { x:p[0], y:R.predict(p[0]) }], rgbCss(TH.pos, 0.7), 1.4);
      }
      ctDot(ctx, P, R.mx, R.my, 7, rgbCss(TH.warn), rgbCss(TH.bg));
    }
    for(const p of st.pts) ctDot(ctx, P, p[0], p[1], 4.5, rgbCss(TH.curl), rgbCss(TH.bg));
    stageNote(ctx, 'the dashed line is the mean of y — r² compares the scatter about the fit with the scatter about that', W, H);
  },
  derive(st){
    const R = pbRegress(st.pts.map(p => p[0]), st.pts.map(p => p[1]));
    const n = v => fmtNum(v, 5);
    if(!R) return { title:'Add at least two points', steps:[] };
    return {
      title:'Where the slope formula comes from, and what r² measures',
      steps:[
        drvStep('minimise the squared error over all lines',
          `${dv('S')}(${dv('m')}, ${dv('b')}) ${dop('=')} Σ(${dv('y')}<sub>i</sub> ${dop('−')} ${dv('m')}${dv('x')}<sub>i</sub> ${dop('−')} ${dv('b')})²`,
          `${st.pts.length} points, current S = ${n(R.ssRes)}`),
        drvStep('at the minimum both partial derivatives vanish',
          `${dfrac('∂'+dv('S'), '∂'+dv('m'))} ${dop('=')} 0,  ${dfrac('∂'+dv('S'), '∂'+dv('b'))} ${dop('=')} 0`,
          'two equations, two unknowns — the normal equations'),
        drvSay('this is the partial-derivatives wing doing statistics',
          'Setting the gradient to zero to find a minimum is exactly the critical-point method, and the vector-spaces wing reaches the same line a different way — by projecting the data orthogonally onto the column space. Three routes, one line.'),
        drvStep('solving gives the slope',
          `${dv('m')} ${dop('=')} ${dfrac('Σ(' + dv('x') + '<sub>i</sub>−x̄)(' + dv('y') + '<sub>i</sub>−ȳ)', 'Σ(' + dv('x') + '<sub>i</sub>−x̄)²')}`,
          `= ${n(R.sxy)} / ${n(R.sxx)} = ${n(R.slope)}`),
        drvStep('and the line passes through the centroid',
          `${dv('b')} ${dop('=')} ȳ ${dop('−')} ${dv('m')}x̄`,
          `through (${n(R.mx)}, ${n(R.my)}),  intercept ${n(R.inter)}`),
        drvStep('now split the total variation in two',
          `SS<sub>tot</sub> ${dop('=')} SS<sub>reg</sub> ${dop('+')} SS<sub>res</sub>`,
          `${n(R.ssTot)} = ${n(R.ssReg)} + ${n(R.ssRes)}`),
        drvStep('and r² is the fraction the line explains',
          `${dv('r')}² ${dop('=')} ${dfrac('SS<sub>reg</sub>', 'SS<sub>tot</sub>')}`,
          `= ${n(R.ssReg)} / ${n(R.ssTot)} = ${n(R.r2)}`),
        drvSay('the split into two pieces is Pythagoras, not an identity to check',
          'SS<sub>tot</sub> = SS<sub>reg</sub> + SS<sub>res</sub> has a cross term in it that vanishes — and it vanishes because the residual vector is <b>orthogonal</b> to the fitted one, which is precisely the condition the normal equations imposed. So the decomposition is the theorem of Pythagoras in n dimensions, with the residuals as one leg and the fit as the other. That is why it is an exact identity rather than an approximation, and why r² can be read as the cosine-squared of an angle.'),
        drvSay('why squared errors, and not the obvious alternative',
            'Minimising the sum of <i>absolute</i> errors is a perfectly sensible thing to want, and it gives a different line — one that ignores outliers instead of chasing them. Squares are chosen because they are differentiable, which makes the minimum a linear system with a closed-form answer instead of a search. The price is paid in robustness: squaring makes a point twice as far away count four times as much, so a single bad measurement can drag the whole line. When someone says a fit is "sensitive to outliers", this is the sentence they mean.'),
        drvSay('and r² answers a narrower question than people ask of it',
          'It is a ratio of variances and nothing more. It does not say a line was the right model — fit a line to a parabola and r² can still be high while the residuals march through a clear arc, which is why the residual plot is worth more than the number. It does not say the relationship is causal. And it is not comparable across datasets with different spreads in x: widen the range of x and r² rises with no change whatever in the underlying relationship. Press "no relationship" above and watch it collapse while the line stays perfectly well defined.')
      ],
      note:'So r² is a ratio of variances, not a verdict. It says how much of the scatter the line accounts for — and says nothing at all about whether a line was the right thing to fit.'
    };
  },
  readout(st){
    const R = pbRegress(st.pts.map(p => p[0]), st.pts.map(p => p[1]));
    if(!R) return `<div class="card tight"><p class="help">Click the plot to add at least two points.</p></div>`;
    const T = pbTTest(st.pts.map(p => p[1]), R.my);
    return `<div class="card tight"><div class="ttl">The fitted line</div>
      ${kv('slope', fmtNum(R.slope, 6))}
      ${kv('intercept', fmtNum(R.inter, 6))}
      ${kv('correlation r', fmtNum(R.r, 6))}
      ${kv('r²', fmtNum(R.r2, 6))}
      ${kv('points', st.pts.length)}
    </div>
    <div class="card tight"><div class="ttl">The variance decomposition</div>
      ${kv('SS total (about ȳ)', fmtNum(R.ssTot, 6))}
      ${kv('SS explained by the line', fmtNum(R.ssReg, 6))}
      ${kv('SS left over', fmtNum(R.ssRes, 6))}
      ${kv('their sum', fmtNum(R.ssReg + R.ssRes, 6))}
      ${kv('difference from SS total', fmtNum(Math.abs(R.ssTot - R.ssReg - R.ssRes), 3))}
      <p class="help">The two pieces add back to the whole exactly — that identity is what makes r²
      interpretable as a fraction at all.</p>
    </div>
    <div class="card tight"><div class="ttl">What this cannot tell you</div>
      ${kv('95% interval for the mean of y', '[' + fmtNum(T.ci95[0], 4) + ', ' + fmtNum(T.ci95[1], 4) + ']')}
      ${kv('standard error of the mean', fmtNum(T.stats.se, 5))}
      <p class="help">A high r² does not mean the relationship is causal, that a line was the right
      model, or that the fit will predict anything outside the range of the data. Press "no
      relationship": the line is still computed, still has a slope, and still passes through the
      centroid. Only r² notices that there is nothing there.</p>
      <p class="help">The interval above uses a normal approximation, which is honest for the
      sample sizes here and would want a t-distribution below about thirty points.</p>
    </div>`;
  },
  chip(st){
    const R = pbRegress(st.pts.map(p => p[0]), st.pts.map(p => p[1]));
    return `<div class="k">regression</div><div>${st.pts.length} points</div>` +
      (R ? `<div style="color:var(--c-grad)">r² = ${fmtNum(R.r2, 4)}</div>` : '');
  },
  legend(){ return [['var(--c-curl)', 'your data'], ['var(--c-grad)', 'the least-squares line'],
                    ['var(--c-pos)', 'residuals'], ['var(--faint)', 'the mean of y'],
                    ['var(--c-warn)', 'the centroid the line must pass through']]; },
  dockLegend:true
};
