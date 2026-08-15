/* ============================================================================
   4zb · STATISTICAL MECHANICS
   Where thermodynamics comes from: counting states, the Boltzmann factor that
   counting forces, and the one function every thermodynamic quantity is a
   derivative of. The Ising transition is found by simulation, not asserted.
   ============================================================================ */

const SM_OMEGA_PRESETS = [
  ['scP1', 'Einstein solid',    'q*ln(1+N/q) + N*ln(1+q/N)'],
  ['scP2', 'ideal monatomic gas', '1.5*N*ln(q/N)'],
  ['scP3', 'Debye solid',       '4*N*(q/N)^0.75'],
  ['scP4', 'spin-½ paramagnet', '-N*((q/N)*ln(q/N) + (1-q/N)*ln(1-q/N))']
];

STAGES.smCount = {
  title:'Entropy is counting, and temperature is a slope',
  legend(st){
    if(st && st.own)
      return [['var(--c-grad)', 'the distribution over splits, exp(S_A+S_B)'],
              ['var(--c-warn)', 'the maximum of S_A+S_B'],
              ['var(--c-pos)', 'where the two temperatures are equal'],
              ['var(--c-neg)', 'the Gaussian that −1/S″ predicts'],
              ['var(--c-curl)', 'the relative width against system size, and its fit']];
    return [['var(--c-grad)', 'probability of each split (within ±σ)'],
            ['var(--c-warn)', 'equal energy per oscillator, and the peak'],
            ['var(--c-neg)', '±σ'],
            ['var(--c-pos)', 'S_A, rising'],
            ['var(--c-curl)', 'S_B, falling'],
            ['var(--text)', 'their sum — maximised at equilibrium']]; },
  dockLegend:true,
  enter(st, o){
    st.NA = o.NA || 60;
    st.NB = o.NB || 60;
    st.q  = o.q  || 100;
    st.own = !!o.own;
    st.srcA = o.srcA || 'q*ln(1+N/q) + N*ln(1+q/N)';
    st.srcB = o.srcB || '1.5*N*ln(q/N)';
  },
  /* Four solves and a fit, each of them a golden section over a few thousand
     evaluations of a compiled expression. Keyed on everything that enters it. */
  splitOf(st){
    const key = st.srcA + '|' + st.srcB + '|' + st.NA + '|' + st.NB + '|' + st.q;
    if(st._pk === key) return st._pd;
    st._pk = key;
    const sA = smCountFn(st.srcA, () => NaN), sB = smCountFn(st.srcB, () => NaN);
    const R = smSplitReport(sA, sB, st.NA, st.NB, st.q);
    st._pd = { R, sA, sB,
               fit:R.ok ? smSplitScaleFit(sA, sB, st.NA, st.NB, st.q, [1, 2, 4, 8]) : null,
               extA:smExtensivity(sA, st.q * 0.5, st.NA, 4),
               extB:smExtensivity(sB, st.q * 0.5, st.NB, 4) };
    return st._pd;
  },
  controlsOwn(){
    const st = ST;
    return fnHtml('scEA', 'ln Ω_A =', st.srcA, 'q and N') +
      fnHtml('scEB', 'ln Ω_B =', st.srcB, 'q and N') +
      '<div class="row wrap">' + SM_OMEGA_PRESETS.map(p => ctBtn(p[0], p[1])).join('') + '</div>' +
      `<p class="help">Write the <b>logarithm</b> of the number of ways a block of <b>N</b> oscillators
      can hold <b>q</b> quanta. The buttons load four classics — the Einstein solid in its Stirling
      form, an ideal gas, a Debye solid and a paramagnet, which has a bounded entropy and therefore a
      <b>negative</b> temperature above half filling.</p>` +
      ctlRow('block A', ctlSlider('scA', 4, 300, 1, st.NA)) +
      ctlRow('block B', ctlSlider('scB', 4, 300, 1, st.NB)) +
      ctlRow('quanta q', ctlSlider('scQ', 4, 400, 1, st.q)) +
      `<p class="help">Two claims are then computed rather than drawn. The equilibrium split is found
      by <b>maximising</b> S<sub>A</sub>+S<sub>B</sub>, and separately by <b>bisecting</b>
      ∂S<sub>A</sub>/∂q = ∂S<sub>B</sub>/∂q — so "equilibrium is where the temperatures match" becomes
      a result with a gap attached to it rather than a slogan.</p>
      <p class="help">And the width of the peak is computed from the curvature, σ = √(−1/S″), and
      again by summing the distribution outright. The first is the Gaussian approximation everyone
      draws; the second is what is actually there. Their ratio is printed, and it is not 1.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('scM', st.own ? 'own' : 'pair',
                      [['pair', 'two blocks of oscillators'], ['own', 'write your own multiplicity']]);
    if(st.own) return seg + STAGES.smCount.controlsOwn();
    return seg + ctlRow('solid A', ctlSlider('scA', 4, 300, 1, st.NA)) +
      ctlRow('solid B', ctlSlider('scB', 4, 300, 1, st.NB)) +
      ctlRow('quanta q', ctlSlider('scQ', 4, 400, 1, st.q)) +
      `<p class="help">Two blocks of oscillators, sharing a fixed number of energy quanta, are
      allowed to exchange energy freely. Every microscopic arrangement is equally likely — that is
      the <b>only</b> assumption in this entire subject.</p>
      <p class="help">The curve is the probability of each possible split. It is sharply peaked, and
      the peak <b>is</b> thermal equilibrium: not a law imposed from outside, but simply the
      overwhelmingly most common arrangement. Turn the block sizes up and watch the peak narrow —
      the relative width falls as 1/√N, which is why a real solid with 10²³ oscillators never
      measurably departs from it.</p>`;
  },
  wire(){
    ctWireSeg('scM', v => { ST.own = (v === 'own'); });
    wireSlider('scA', () => ST.NA, v => { ST.NA = Math.round(v); }, v => String(Math.round(+v)) + ' osc.');
    wireSlider('scB', () => ST.NB, v => { ST.NB = Math.round(v); }, v => String(Math.round(+v)) + ' osc.');
    wireSlider('scQ', () => ST.q,  v => { ST.q  = Math.round(v); }, v => String(Math.round(+v)));
    if(!ST.own) return;
    fnWire('scEA', (m, s) => { ST.srcA = s; }, smCountBuild);
    fnWire('scEB', (m, s) => { ST.srcB = s; }, smCountBuild);
    for(const p of SM_OMEGA_PRESETS) ctWireBtn(p[0], () => { ST.srcA = p[2]; ST.srcB = p[2]; });
  },
  /* Two pictures. The distribution over splits carries both located splits and
     both widths, so the Gaussian approximation is drawn ON the distribution it
     approximates rather than described. Below it, the relative width against
     system size on logarithmic axes, with the line that was fitted to it — the
     1/√N law as a measured slope. */
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.smCount.splitOf(st);
    const px = 78, top = 84;
    const aw = Math.max(60, W - px - 92), ah = Math.max(60, H - top - 88);
    if(!D.R.ok){
      const P = mkPlot(px, top, aw, ah, 0, 1, 0, 1);
      plotFrame(ctx, P, '', '', 'this multiplicity has no equilibrium');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 - 8, 'nothing to split',
             rgbCss(TH.neg), '600 14px ' + FONT_UI, 'center');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 16,
             String(D.R.why || '').replace(/<[^>]*>/g, '').slice(0, 110),
             rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
      return;
    }
    const R = D.R;
    const stack = ah >= 320;
    const gapPx = 58;
    const h1 = stack ? (ah - gapPx) * 0.58 : ah;
    const sA = D.sA, sB = D.sB;
    const S = qa => sA(qa, st.NA) + sB(st.q - qa, st.NB);
    /* the distribution, on a window a few widths wide so the shape is visible */
    const half = Math.max(R.sd * 4.5, st.q * 0.02);
    const lo = Math.max(st.q * 1e-4, R.mean - half), hi = Math.min(st.q * (1 - 1e-4), R.mean + half);
    const pts = [], gau = [];
    let top1 = 1e-300;
    for(let i = 0; i <= 240; i++){
      const qa = lo + (hi - lo) * i / 240;
      const w = Math.exp(S(qa) - R.Smax);
      pts.push({ x:qa, y:w });
      if(w > top1) top1 = w;
    }
    for(const p of pts) p.y /= top1;
    if(Number.isFinite(R.sdCurv))
      for(const p of pts)
        gau.push({ x:p.x, y:Math.exp(-0.5 * Math.pow((p.x - R.qMax) / R.sdCurv, 2)) });
    const P = mkPlot(px, top, aw, h1, lo, hi, 0, 1.16);
    st.P = P;
    plotFrame(ctx, P, 'quanta in block A', 'relative probability of that split',
              'the distribution, and the Gaussian its curvature predicts');
    ctGrid(ctx, P);
    ctPath(ctx, P, pts, rgbCss(TH.grad), 2.8);
    if(gau.length) ctPath(ctx, P, gau, rgbCss(TH.neg), 2, [5, 4]);
    ctPath(ctx, P, [{ x:R.qMax, y:0 }, { x:R.qMax, y:1.16 }], rgbCss(TH.warn), 2, [4, 3]);
    ctText(ctx, P.X(R.qMax) + 6, P.py + 16, 'S_A + S_B maximal', rgbCss(TH.warn), '11px ' + FONT_UI);
    if(Number.isFinite(R.qRoot))
      ctDot(ctx, P, R.qRoot, 1.02, 5, rgbCss(TH.pos), rgbCss(TH.bg));
    ctText(ctx, P.X(R.mean) - 4, P.Y(1.10), 'equal temperatures ●', rgbCss(TH.pos), '11px ' + FONT_UI, 'right');
    if(R.sd > 0)
      ctArrow(ctx, P, R.mean - R.sd, 0.42, R.mean + R.sd, 0.42, rgbCss(TH.text, 0.8), 1.8, '±σ');
    /* the fitted 1/√N law */
    if(stack && D.fit && D.fit.ok && D.fit.rows.length > 1){
      const F = D.fit;
      const xs = F.rows.map(r => Math.log10(r.lam)), ys = F.rows.map(r => Math.log10(r.relWidth));
      const ymin = Math.min(...ys) - 0.12, ymax = Math.max(...ys) + 0.12;
      const Q = mkPlot(px, top + h1 + gapPx, aw, ah - h1 - gapPx,
                       Math.min(...xs) - 0.05, Math.max(...xs) + 0.05, ymin, ymax);
      plotFrame(ctx, Q, 'log₁₀ of the system size, everything scaled together',
                'log₁₀ of σ ÷ ⟨q_A⟩', 'the 1/√N law as a measured slope');
      ctGrid(ctx, Q, 0.25);
      const b = ys[0] - F.slope * xs[0];
      /* the fit was made in natural logarithms and is drawn in decimal ones,
         which changes the intercept and leaves the slope alone — a power law
         has the same exponent in every base */
      ctPath(ctx, Q, [{ x:Q.x0, y:b + F.slope * Q.x0 },
                      { x:Q.x1, y:b + F.slope * Q.x1 }], rgbCss(TH.warn), 1.8, [5, 4]);
      for(let i = 0; i < xs.length; i++) ctDot(ctx, Q, xs[i], ys[i], 4.5, rgbCss(TH.curl), rgbCss(TH.bg));
      ctText(ctx, Q.px + 10, Q.py + 18, 'fitted slope ' + fmtNum(F.slope, 5) +
             '  (−0.5 is the usual law)', rgbCss(TH.curl), '11px ' + FONT_UI);
    }
    stageNote(ctx, 'the dashed bell is what the curvature at the peak predicts — everything else is ' +
                   'the distribution your entropy actually has', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.smCount.frameOwn(st, dt, ctx, W, H);
    const C = smContact(st.NA, st.NB, st.q);
    const pmax = Math.max(...C.prob) * 1.2;
    const P = mkPlot(80, 55, W - 170, (H - 175) * 0.56, 0, st.q, 0, pmax);
    st.P = P;
    plotFrame(ctx, P, 'quanta in solid A', 'probability of that split',
              'every microstate equally likely — this is what that implies');
    ctGrid(ctx, P);

    const bw = Math.max(1, P.pw / (st.q + 1) * 0.9);
    for(let qa = 0; qa <= st.q; qa++){
      const within = Math.abs(qa - C.mean) <= C.sd;
      ctx.fillStyle = rgbCss(within ? TH.grad : TH.faint, within ? 0.85 : 0.45);
      ctx.fillRect(P.X(qa) - bw / 2, P.Y(C.prob[qa]), bw, P.Y(0) - P.Y(C.prob[qa]));
    }
    /* the fair-share point, which is where the peak sits when the blocks match */
    const fair = st.q * st.NA / (st.NA + st.NB);
    ctPath(ctx, P, [{ x:fair, y:0 }, { x:fair, y:pmax }], rgbCss(TH.warn), 2, [5, 4]);
    ctText(ctx, P.X(fair) + 8, P.Y(pmax * 0.92), 'energy per oscillator equal here', rgbCss(TH.warn), '12px ' + FONT_UI);
    ctArrow(ctx, P, C.mean - C.sd, pmax * 0.55, C.mean + C.sd, pmax * 0.55, rgbCss(TH.neg), 2, '±σ');

    /* the two entropies below, and the slope-matching that defines temperature */
    const P2 = mkPlot(80, P.py + P.ph + 62, W - 170, H - (P.py + P.ph + 62) - 62, 0, st.q, 0, 1.05);
    plotFrame(ctx, P2, 'quanta in solid A', 'entropy (scaled)',
              'the total is maximised where the two slopes are equal and opposite');
    ctGrid(ctx, P2);
    const sA = [], sB = [], sT = [];
    let smax = 0;
    for(let qa = 0; qa <= st.q; qa++){
      const a = smLogOmega(st.NA, qa), b = smLogOmega(st.NB, st.q - qa);
      sA.push(a); sB.push(b); sT.push(a + b);
      smax = Math.max(smax, a + b);
    }
    const sc = 1 / Math.max(1e-9, smax);
    ctPath(ctx, P2, sA.map((v, i) => ({ x:i, y:v * sc })), rgbCss(TH.pos), 2, [5, 4]);
    ctPath(ctx, P2, sB.map((v, i) => ({ x:i, y:v * sc })), rgbCss(TH.curl), 2, [5, 4]);
    ctPath(ctx, P2, sT.map((v, i) => ({ x:i, y:v * sc })), rgbCss(TH.text), 2.8);
    ctPath(ctx, P2, [{ x:C.bestQ, y:0 }, { x:C.bestQ, y:1.05 }], rgbCss(TH.warn), 1.8, [4, 3]);
    stageNote(ctx, 'green S_A rising, purple S_B falling, black their sum — equilibrium is the maximum of the sum', W, H);
  },
  deriveOwn(st){
    const D = STAGES.smCount.splitOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 6) : 'not defined here');
    if(!D.R.ok) return {
      title:'This multiplicity has no equilibrium',
      steps:[drvSay('what went wrong', String(D.R.why || 'the entropy is not finite across the range of splits').replace(/<[^>]*>/g, '') +
        '. Every quantity below is defined at the maximum of S_A + S_B, so nothing is computed until there is one.')],
      note:'Write lnΩ in terms of q and N. The four buttons load forms that work, and the sliders then move the sizes.'
    };
    const R = D.R, F = D.fit;
    return {
      title:'Two claims about counting, both computed rather than drawn',
      steps:[
        drvSay('the single assumption, unchanged',
          'Every accessible microstate of the isolated pair is equally likely. What changes here is that you supply the count: lnΩ_A and lnΩ_B are whatever you wrote, and everything below is derived from them and from nothing else.'),
        drvStep('the entropies you wrote',
          `${dv('S')}_A/${dv('k')} ${dop('=')} ${pkPretty(st.srcA)} , &nbsp; ${dv('S')}_B/${dv('k')} ${dop('=')} ${pkPretty(st.srcB)}`,
          `blocks of ${st.NA} and ${st.NB}, sharing ${st.q} quanta`),
        drvStep('the split that maximises their sum',
          `${dfrac('∂', '∂' + dv('q') + '_A')}[${dv('S')}_A ${dop('+')} ${dv('S')}_B] ${dop('=')} 0`,
          `golden section: q_A = ${n(R.qMax)}`),
        drvStep('and the split at which the two temperatures are equal',
          `${dfrac('∂' + dv('S') + '_A', '∂' + dv('U') + '_A')} ${dop('=')} ${dfrac('∂' + dv('S') + '_B', '∂' + dv('U') + '_B')}`,
          `bisection: q_A = ${n(R.qRoot)} — apart by ${fmtAgree(R.qMax, R.qRoot, 'quanta')}`),
        drvSay('those are two different calculations, and they are the theorem',
          'One maximises a function; the other solves an equation between two derivatives. Nothing in the code makes them agree. That they land on the same split is what licenses "systems in contact reach a common temperature", and the gap above is how well it holds on your entropies.'),
        drvStep('so the shared slope has a value, and it is a temperature',
          `${dv('T')} ${dop('=')} (∂${dv('S')}/∂${dv('U')})⁻¹`,
          `T_A = ${n(R.TA)}, T_B = ${n(R.TB)} — in units of one quantum per k`),
        drvStep('and each block has a heat capacity, off your entropy alone',
          `${dv('C')} ${dop('=')} ${dfrac('d' + dv('U'), 'd' + dv('T'))} ${dop('=')} ${dop('−')}${dfrac('β²', 'dβ/d' + dv('q'))}`,
          `C_A = ${n(R.CA)} k, C_B = ${n(R.CB)} k`),
        drvStep('the width of the peak, from its curvature',
          `σ ${dop('=')} √(${dop('−')}1/${dv('S')}″)`,
          `${n(R.sdCurv)} quanta`),
        drvStep('and from the distribution, summed outright',
          `σ² ${dop('=')} ⟨${dv('q')}_A²⟩ ${dop('−')} ⟨${dv('q')}_A⟩²`,
          `${n(R.sd)} quanta — the Gaussian is ${n(R.widthRatio)}× the truth`),
        drvSay('which is what "the Gaussian approximation" actually costs',
          'Expanding the exponent to second order about its maximum is the standard move, and it is an approximation whose error nobody usually looks at. Here both numbers are on the screen and the dashed bell is drawn over the distribution it approximates. It is good, and it is not exact, and the difference shrinks as the blocks grow.'),
        F && F.ok ? drvStep('the fluctuations fall with size — at a FITTED rate',
          `${dfrac('σ', '⟨' + dv('q') + '_A⟩')} ${dop('∼')} ${dv('N')}^${dv('s')}`,
          `s = ${n(F.slope)} across four sizes, residual ${fmtSig(F.resid, 3)} in ln σ; ` +
          `that is ${n(F.perDouble)}× narrower per doubling`)
          : drvSay('the size fit did not run', 'Not enough of the scaled systems had an interior maximum to fit an exponent through.'),
        drvSay('and the exponent is −½ only because entropy is extensive',
          'Doubling the system doubles lnΩ, so the exponent at the peak doubles while the range of splits doubles too — and √ of that is where the ½ comes from. Write an entropy that is not extensive and the fitted slope moves off −0.5, which is worth doing: N·ln(q) rather than N·ln(q/N) is exactly the non-extensive form Gibbs found paradoxical, and it is one keystroke away.'),
        drvSay('this is the second law, and it is a counting statement',
          'Nothing here forbids the energy flowing the other way. The arrangements in which it does are simply outnumbered, and the fitted exponent above says by how much more as the system grows. Extrapolate it to 10²³ and the relative width falls below anything measurable — which is the whole difference between a tendency and a law.')
      ],
      note:'Everything on this panel came out of two expressions in q and N. Temperature, heat capacity, the equilibrium split and the size of the fluctuations about it are all derivatives of a count — which is the claim the subject rests on, made here on a count you chose.'
    };
  },
  derive(st){
    if(st.own) return STAGES.smCount.deriveOwn(st);
    const C = smContact(st.NA, st.NB, st.q);
    const n = v => fmtNum(v, 6);
    const lo = smLogOmega(st.NA, C.bestQ) + smLogOmega(st.NB, st.q - C.bestQ);
    return {
      title:'From counting arrangements to temperature and the second law',
      steps:[
        drvSay('the single assumption',
          'An isolated system in equilibrium is equally likely to be found in any of its accessible microstates. Nothing else is assumed anywhere in this subject — no forces, no dynamics, no arrow of time. Everything below is a consequence of counting.'),
        drvStep('count the ways q quanta can sit on N oscillators',
          `Ω(${dv('N')}, ${dv('q')}) ${dop('=')} ${dfrac('(' + dv('q') + '+' + dv('N') + '−1)!', dv('q') + '!(' + dv('N') + '−1)!')}`,
          `for solid A with q = ${C.bestQ}: ln Ω = ${n(smLogOmega(st.NA, C.bestQ))}`),
        drvStep('the combined system multiplies, because the choices are independent',
          `Ω_total ${dop('=')} Ω_A(${dv('q')}_A) ${dop('·')} Ω_B(${dv('q')} ${dop('−')} ${dv('q')}_A)`,
          `at the peak: ln Ω_total = ${n(lo)}`),
        drvSay('so define entropy as its logarithm',
          'Multiplication is awkward and the numbers are astronomically large — ln Ω for a real solid runs to 10²³. Taking a logarithm turns the product into a sum, so entropy is additive the way energy is, and it brings the numbers back into a range a person can write down. Boltzmann\'s S = k lnΩ is that definition, and the constant k exists only to convert to the temperature units chosen in 1848.'),
        drvStep('entropy is additive',
          `${dv('S')}_total ${dop('=')} ${dv('S')}_A ${dop('+')} ${dv('S')}_B`,
          'the logarithm of a product'),
        drvStep('equilibrium is the maximum of that sum',
          `${dfrac('∂' + dv('S') + '_A', '∂' + dv('U') + '_A')} ${dop('=')} ${dfrac('∂' + dv('S') + '_B', '∂' + dv('U') + '_B')}`,
          `found at q_A = ${C.bestQ} of ${st.q}`),
        drvSay('and that is what temperature is',
          'Two systems in contact stop exchanging net energy when the slopes of their entropy curves match. That shared slope is the only thing they have in common at equilibrium, so it deserves a name — and it is temperature. Defining 1/T = ∂S/∂U is not a convention chosen for convenience; it is the quantity that is equal when nothing further happens.'),
        drvStep('the peak is sharp, and sharpens as √N',
          `${dfrac('σ', '⟨' + dv('q') + '_A⟩')} ${dop('∼')} ${dfrac('1', '√' + dv('N'))}`,
          `here: σ = ${n(C.sd)}, mean = ${n(C.mean)}, relative width = ${n(C.relWidth)}`),
        drvSay('which is why thermodynamics looks like a law rather than a tendency',
          `With ${st.NA} oscillators the fluctuations are ${fmtNum(100 * C.relWidth, 2)}% — wide enough to see on the plot above. Scale to a real solid with 10²³ and the relative width falls to about 10⁻¹¹·⁵ — far below anything measurable. The second law is not a separate principle: it is the statement that systems move towards overwhelmingly more probable configurations, and "overwhelmingly" is doing all the work.`)
      ],
      note:'Nothing here forbids the energy flowing the other way. It is simply that the arrangements in which it does are outnumbered by a factor with 10²² digits. The second law is a statement about counting, and it is the only law of physics that is statistical rather than mechanical.'
    };
  },
  readoutOwn(st){
    const D = STAGES.smCount.splitOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 6 : d) : 'not defined here');
    if(!D.R.ok) return `<div class="card tight"><div class="ttl">This multiplicity has no equilibrium</div>
      ${kv('', String(D.R.why || 'the entropy is not finite across the range of splits'))}
      <p class="help">Write lnΩ as a function of <b>q</b> and <b>N</b>. It has to be finite for every
      split of the quanta between the two blocks, and it has to have an interior maximum — an entropy
      that rises all the way to one end describes two blocks that never stop exchanging energy.</p>
    </div>`;
    const R = D.R, F = D.fit;
    return `<div class="card tight"><div class="ttl">Your two blocks</div>
      ${kv('lnΩ_A', pkPretty(st.srcA))}
      ${kv('lnΩ_B', pkPretty(st.srcB))}
      ${kv('sizes', st.NA + ' and ' + st.NB + ', sharing ' + st.q + ' quanta')}
      ${kv('S at the peak', n(R.Smax, 7))}
      ${kv('equal energy per oscillator would be', n(R.fair, 5))}
      <p class="help">The fair-share number is only the answer when both blocks are the same kind of
      thing. Give them different entropies — a solid against a gas — and the peak moves off it, which
      is exactly what "they share out energy until the temperatures match, not until the energies
      match" means.</p>
    </div>
    <div class="card tight"><div class="ttl">The split, by two routes</div>
      ${kv('by maximising S_A + S_B', n(R.qMax) + ' quanta in A')}
      ${kv('by equal temperatures', n(R.qRoot) + ' quanta in A')}
      ${kv('they differ by', fmtAgree(R.qMax, R.qRoot, 'quanta'))}
      ${kv('as a fraction of q', Number.isFinite(R.rel) ? fmtSig(R.rel, 3) : '—')}
      ${kv('T_A there', n(R.TA))}
      ${kv('T_B there', n(R.TB))}
      ${kv('the two temperatures differ by', Number.isFinite(R.tempRel) ? fmtNum(100 * R.tempRel, 6) + '%' : '—')}
      <p class="help">One route maximises a function and the other solves an equation between two
      derivatives; nothing in the code makes them agree. That they land within
      ${Number.isFinite(R.rel) ? fmtSig(R.rel, 2) : '—'} of q of each other is the statement
      that equilibrium <b>is</b> equal temperature, tested on entropies nobody chose in advance.</p>
    </div>
    <div class="card tight"><div class="ttl">The width, by two more</div>
      ${kv('σ from the curvature, √(−1/S″)', n(R.sdCurv, 7) + ' quanta')}
      ${kv('σ from summing the distribution', n(R.sd, 7) + ' quanta')}
      ${kv('the Gaussian is too wide by', Number.isFinite(R.widthRatio) ? fmtNum(100 * (R.widthRatio - 1), 4) + '%' : '—')}
      ${kv('relative width σ/⟨q_A⟩', n(R.relWidth, 7))}
      ${kv('heat capacity of A', n(R.CA, 6) + ' k')}
      ${kv('heat capacity of B', n(R.CB, 6) + ' k')}
      <p class="help">Expanding the exponent to second order about its maximum is the standard move
      and it is an approximation. Both numbers are here, and the dashed bell on the picture is drawn
      over the distribution it approximates. The heat capacities came out of your entropies by
      C = −β²/(dβ/dq) and nothing else — an ideal gas written as 1.5·N·ln(q/N) returns exactly
      1.5N, which is equipartition, measured.</p>
    </div>
    <div class="card tight"><div class="ttl">The 1/√N law, fitted</div>
      ${F && F.ok ? F.rows.map(r =>
        kv('everything × ' + fmtNum(r.lam, 2), 'σ/⟨q⟩ = ' + fmtNum(r.relWidth, 7))).join('') +
        kv('fitted exponent', n(F.slope, 6)) +
        kv('narrower per doubling', n(F.perDouble, 6) + '×  (√2 = 1.414214)') +
        kv('residual of the fit', fmtSig(F.resid, 3) + ' in ln σ')
       : kv('', 'the size fit did not run on this multiplicity')}
      <p class="help">Not asserted — fitted, across four system sizes. The exponent is −½ only
      because entropy is extensive; the panel below reports whether yours is.</p>
    </div>
    <div class="card tight"><div class="ttl">Extensivity — the Gibbs paradox in one number</div>
      ${kv('S_A(4q, 4N) ÷ 4·S_A(q, N) − 1', Number.isFinite(D.extA.rel) ? fmtSig(D.extA.rel, 4) : '—')}
      ${kv('the same for B', Number.isFinite(D.extB.rel) ? fmtSig(D.extB.rel, 4) : '—')}
      <p class="help">${Math.max(D.extA.rel || 0, D.extB.rel || 0) < 1e-9
        ? 'Both entropies are extensive: scaling the block and its energy together scales the entropy by the same factor, which is why the fitted exponent above comes out at −½. Change one of them from N·ln(q/N) to N·ln(q) and watch this number leave zero.'
        : 'One of your entropies is <b>not extensive</b> — doubling the block and its energy does not double it. That is precisely the Gibbs paradox: writing N·ln(q) rather than N·ln(q/N) leaves an N·lnN behind, so mixing two identical gases appears to create entropy. The fix was the 1/N! that Gibbs put in by hand and that indistinguishability later justified.'}</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.smCount.readoutOwn(st);
    const C = smContact(st.NA, st.NB, st.q);
    const n = v => fmtNum(v, 6);
    const fair = st.q * st.NA / (st.NA + st.NB);
    /* the same system with a hundred times more oscillators, to show the scaling */
    const big = smContact(st.NA * 25, st.NB * 25, st.q * 25);
    return `<div class="card tight"><div class="ttl">The split, by counting</div>
      ${kv('most likely q in A', String(C.bestQ))}
      ${kv('equal energy per oscillator', fmtNum(fair, 3))}
      ${kv('mean of the distribution', n(C.mean))}
      ${kv('standard deviation', n(C.sd))}
      ${kv('probability of the single most likely split', n(C.peakFrac))}
      <p class="help">The peak sits where the energy per oscillator is the same in both blocks. That
      was not put in — it fell out of counting arrangements, which is the point.</p>
    </div>
    <div class="card tight"><div class="ttl">How sharp is "sharp"</div>
      ${kv('relative width σ/⟨q⟩', n(C.relWidth))}
      ${kv('as a percentage', fmtNum(100 * C.relWidth, 4) + '%')}
      ${kv('with 25× more oscillators', fmtNum(100 * big.relWidth, 4) + '%')}
      ${kv('ratio of the two widths', fmtNum(C.relWidth / Math.max(1e-12, big.relWidth), 4))}
      ${kv('√25 for comparison', '5')}
      <p class="help">Multiply the system by 25 and the relative fluctuation falls by 5. That is the
      1/√N law, measured here rather than quoted — and extrapolating it to 10²³ is why a cup of tea
      never spontaneously reheats itself.</p>
    </div>
    <div class="card tight"><div class="ttl">Entropy at the peak</div>
      ${kv('ln Ω_A', n(smLogOmega(st.NA, C.bestQ)))}
      ${kv('ln Ω_B', n(smLogOmega(st.NB, st.q - C.bestQ)))}
      ${kv('ln Ω_total', n(smLogOmega(st.NA, C.bestQ) + smLogOmega(st.NB, st.q - C.bestQ)))}
      ${kv('S = k lnΩ', fmtSig((smEntropy(st.NA, C.bestQ) + smEntropy(st.NB, st.q - C.bestQ)), 5) + ' J/K')}
      <p class="help">Entropy has units of J/K only because temperature was given its own unit before
      anyone knew what it was. In natural units entropy is a pure number — the logarithm of a count
      of arrangements, and nothing more.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.smCount.splitOf(st);
      if(!D.R.ok) return `<div class="k">your multiplicity</div><div style="color:var(--c-neg)">no equilibrium</div>`;
      return `<div class="k">peak at q_A = ${fmtNum(D.R.qMax, 5)}</div>
        <div>two routes apart by ${fmtAgreeTight(D.R.qMax, D.R.qRoot)}</div>
        <div>relative width ${fmtNum(100 * D.R.relWidth, 2)}%</div>`;
    }
    const C = smContact(st.NA, st.NB, st.q);
    return `<div class="k">peak at q_A = ${C.bestQ}</div><div>relative width ${fmtNum(100 * C.relWidth, 2)}%</div>`;
  }
};

/* ------------------------------------------------------------------------- */
STAGES.smBoltz = {
  title:'The partition function, and everything derived from it',
  legend(st){
    if(st && st.own)
      return [['var(--c-grad)', 'C/k for your scheme, and the level populations'],
              ['var(--c-curl)', 'S/k for your scheme'],
              ['var(--c-warn)', 'the peak, located — and where the slider sits'],
              ['var(--c-neg)', 'the two limits: k ln g₀ below, k ln Σg above'],
              ['var(--text)', 'kT, on the ladder']];
    return [['var(--c-grad)', 'level populations, and the heat capacity'],
            ['var(--c-warn)', 'kT, and the temperature marker']]; },
  dockLegend:true,
  enter(st, o){
    st.key = o.key || 'twoState';
    st.T = o.T || 300;
    st.gap = o.gap || 0.05;
    st.own = !!o.own;
    st.sheet = o.sheet || '* an energy in eV, then how many states share it\n0      1\n0.043  3';
    st.sheetErr = '';
  },
  /* Everything that depends on the temperature. The peak search alone evaluates
     the partition function some three hundred times, and `readout` runs four
     times a second, so it is keyed on the sheet and the temperature and on
     nothing else. */
  schemeOf(st){
    const key = st.sheet + '|' + st.T;
    if(st._rk === key) return st._rd;
    st._rk = key;
    const P = smParseLevels(st.sheet);
    if(!P.ok){ st._rd = { ok:false, P }; return st._rd; }
    const R = smLevelReport(P.levels, st.T), G = smLevelGroups(P.levels);
    /* the population of each distinct energy, which is what the ladder draws */
    const gp = G.map(g => {
      let s = 0;
      P.levels.forEach((l, i) => { if(Math.abs(l.E - g.E) < 1e-12) s += R.p[i]; });
      return s;
    });
    st._rd = { ok:true, P, R, G, gp };
    return st._rd;
  },
  /* And everything that does not. C(T) and S(T) across thirty decades, plus the
     spacing sweep, all of which are properties of the scheme alone — so moving
     the temperature slider redraws them without recomputing them. */
  chartOf(st){
    if(st._wk === st.sheet) return st._wd;
    st._wk = st.sheet;
    const P = smParseLevels(st.sheet);
    if(!P.ok){ st._wd = { ok:false }; return st._wd; }
    const G = smLevelGroups(P.levels);
    const span = Math.max(1e-12, G[G.length - 1].E - G[0].E);
    let minGap = Infinity;
    for(let i = 1; i < G.length; i++) minGap = Math.min(minGap, G[i].E - G[i - 1].E);
    if(!Number.isFinite(minGap)) minGap = span;
    const tLo = minGap / (60 * SM_KBEV), tHi = 60 * span / SM_KBEV;
    const x0 = Math.log10(tLo), x1 = Math.log10(tHi);
    const curve = [];
    let cMax = 1e-12;
    for(let i = 0; i <= 160; i++){
      const x = x0 + (x1 - x0) * i / 160;
      const R = smPartition(P.levels, Math.pow(10, x));
      const C = R.C / SM_KBEV, S = R.S / SM_KBEV;
      curve.push({ x, C, S });
      if(C > cMax) cMax = C;
    }
    const sumG = P.levels.reduce((a, l) => a + (l.g || 1), 0);
    st._wd = { ok:true, curve, x0, x1, cMax,
               lnG:Math.log(sumG), ln0:Math.log(G[0].g),
               sweep:smLevelScaleSweep(P.levels, [0.1, 0.3, 1, 3, 10]) };
    return st._wd;
  },
  controlsOwn(){
    const st = ST;
    return `<div class="fld" style="align-items:stretch">
        <textarea id="sbSheet" rows="7" spellcheck="false" autocomplete="off"
          aria-label="a level scheme — one level per line: an energy in eV and a degeneracy"
          data-audit="0 1&#10;0.02 1&#10;0.075 5"
          style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
      </div>
      <div class="row wrap">${ctBtn('sbGo', 'Sum it')}</div>
      <p class="help" id="sbMsg" style="color:${st.sheetErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.sheetErr ||
        'One level per line: an <b>energy in eV</b>, then optionally <b>how many states</b> share it. ' +
        'Two generators save typing — <b>ladder 0.03 40</b> is forty evenly spaced levels, and ' +
        '<b>rotor 0.002 30</b> is E = B·J(J+1) with its 2J+1 degeneracies up to J = 30. Lines ' +
        'beginning * are comments.'}</p>` +
      ctlRow('T (K)', ctlSlider('sbT', 1, 3000, 1, st.T)) +
      `<p class="help">Every thermodynamic quantity is a derivative of ln Z, and this panel computes
      three of them <b>twice</b>, by routes that share no code: ⟨E⟩ by Σ E<sub>i</sub>P<sub>i</sub> and
      by −∂lnZ/∂β; C by the energy fluctuation and by dU/dT; and S by Gibbs' −kΣp ln p and by (U−F)/T,
      which never sees a population at all. The gaps are printed.</p>
      <p class="help">The heat-capacity peak is <b>located</b> — by golden section, and again by
      bisecting dC/dT — rather than read off a formula. For a two-level scheme there <i>is</i> a
      formula, the root of x·tanh((x−ln r)/2) = 2, and it is solved separately and printed beside
      them. Write a third level and it stops applying; the located peak carries on.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('sbM', st.own ? 'own' : 'list',
                      [['list', 'a scheme from the list'], ['own', 'write your own level scheme']]);
    if(st.own) return seg + STAGES.smBoltz.controlsOwn();
    return seg + ctSeg('sbK', st.key, Object.keys(SM_LEVELS).map(k => [k, SM_LEVELS[k].n])) +
      ctlRow('T (K)', ctlSlider('sbT', 1, 3000, 1, st.T)) +
      ctlRow('level gap', ctlSlider('sbG', 0.005, 0.5, 0.005, st.gap)) +
      `<p class="help">Give me a list of energy levels and a temperature, and one sum —
      <b>Z = Σ g e<sup>−E/kT</sup></b> — contains every thermodynamic property the system has.
      Energy, entropy, free energy and heat capacity are all derivatives of ln Z.</p>
      <p class="help">${esc(SM_LEVELS[st.key].note)}</p>
      <p class="help">The panel computes the mean energy twice, once by summing the populations and
      once by differentiating ln Z, and prints the difference — because the claim that those two
      routes agree is the whole reason Z is worth defining.</p>`;
  },
  wire(){
    ctWireSeg('sbM', v => { ST.own = (v === 'own'); });
    ctWireSeg('sbK', v => { ST.key = v; });
    wireSlider('sbT', () => ST.T, v => { ST.T = Math.round(v); }, v => Math.round(+v) + ' K');
    wireSlider('sbG', () => ST.gap, v => { ST.gap = v; }, v => fmtNum(+v, 3) + ' eV');
    if(!ST.own) return;
    const apply = () => {
      const box = $('sbSheet'); if(!box) return;
      ST.sheet = box.value;
      const D = STAGES.smBoltz.schemeOf(ST);
      ST.sheetErr = D.ok ? '' :
        '⚠ ' + D.P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
        '<br><span style="color:var(--faint)">The previous scheme is still shown.</span>';
      const msg = $('sbMsg');
      if(msg){
        msg.innerHTML = ST.sheetErr || ('Summed: ' + D.P.levels.length + ' levels over ' +
          D.G.length + ' distinct energies, Z = ' + fmtNum(D.R.Z, 6) + '.');
        msg.style.color = ST.sheetErr ? 'var(--c-neg)' : 'var(--faint)';
      }
      refreshStageReadout(); updateStageChip(); updateStageLegend();
    };
    const b = $('sbSheet'); if(b) b.addEventListener('change', apply);
    const g = $('sbGo'); if(g) g.addEventListener('click', apply);
  },
  /* Three pictures, because the three things being checked live at different
     temperatures: the ladder says what is populated HERE, C(T) carries the peak
     that was located, and S(T) climbs between the two limits of the third law
     — which is the one plot that makes k ln g₀ and k ln Σg visible as the ends
     of the same curve. */
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.smBoltz.schemeOf(st), K = STAGES.smBoltz.chartOf(st);
    const px = 78, top = 86;
    const aw = Math.max(60, W - px - 92), ah = Math.max(60, H - top - 88);
    if(!D.ok || !K.ok){
      const P = mkPlot(px, top, aw, ah, 0, 1, 0, 1);
      plotFrame(ctx, P, '', '', 'this level scheme does not read');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 - 8, 'the sheet does not read',
             rgbCss(TH.neg), '600 14px ' + FONT_UI, 'center');
      const first = D.P && D.P.errs && D.P.errs[0] ? D.P.errs[0].msg : '';
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 16, first.replace(/<[^>]*>/g, '').slice(0, 100),
             rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
      return;
    }
    const R = D.R;
    const wide = W >= 840 && aw >= 500;
    const gapPx = wide ? 64 : 52;
    const lw = wide ? Math.max(150, aw * 0.34) : aw;
    const cw = wide ? aw - lw - gapPx : aw;
    const stack = wide || ah >= 340;
    const ch = stack ? (ah - gapPx) / 2 : ah;

    /* the ladder, with population as bar length */
    if(wide){
      const shown = D.G.slice(0, 16);
      const Emax = Math.max(...shown.map(g => g.E)) * 1.15 + 1e-6;
      const L = mkPlot(px, top, lw, ah, 0, 1.12, D.G[0].E - 0.04 * Emax, Emax);
      /* The readout chip floats over the canvas's top-left corner, and a plot
         title is centred over its own box — so a long one on the LEFT column
         has its first few characters painted underneath the chip. Short. */
      plotFrame(ctx, L, 'population', 'energy (eV)', 'occupied at ' + st.T + ' K');
      shown.forEach((g, i) => {
        const p = D.gp[i];
        ctx.fillStyle = rgbCss(TH.grad, 0.75);
        ctx.fillRect(L.X(0), L.Y(g.E) - 4, Math.max(1, L.X(p) - L.X(0)), 8);
        ctPath(ctx, L, [{ x:0, y:g.E }, { x:1.02, y:g.E }], rgbCss(TH.faint, 0.5), 1);
        if(g.g > 1 && i < 9)
          ctText(ctx, L.X(1.03), L.Y(g.E) + 4, '×' + g.g, rgbCss(TH.dim), '11px ' + FONT_UI);
      });
      const kT = SM_KBEV * st.T;
      if(kT < Emax){
        ctPath(ctx, L, [{ x:0, y:kT }, { x:1.1, y:kT }], rgbCss(TH.text), 2, [5, 4]);
        ctText(ctx, L.X(0.2), L.Y(kT) - 6, 'kT = ' + fmtNum(kT, 4) + ' eV', rgbCss(TH.text), '11px ' + FONT_UI);
      }
      if(D.G.length > 16)
        ctText(ctx, L.px + 6, L.py + L.ph - 6, '+ ' + (D.G.length - 16) + ' more above',
               rgbCss(TH.faint), '10px ' + FONT_UI);
    }
    /* the heat capacity, with the peak that was located marked on it */
    const cx0 = wide ? px + lw + gapPx : px;
    const C = mkPlot(cx0, top, cw, ch, K.x0, K.x1, 0, K.cMax * 1.18);
    st.P = C;
    plotFrame(ctx, C, 'log₁₀ of the temperature (K)', 'heat capacity C/k',
              'the peak is located, not read off a formula');
    ctGrid(ctx, C, 1);
    ctPath(ctx, C, K.curve.map(p => ({ x:p.x, y:p.C })), rgbCss(TH.grad), 2.8);
    const lp = Math.log10(R.peak.T);
    ctPath(ctx, C, [{ x:lp, y:0 }, { x:lp, y:K.cMax * 1.18 }], rgbCss(TH.warn), 2, [4, 3]);
    ctText(ctx, C.X(lp) + 6, C.py + 16, 'peak at ' + fmtNum(R.peak.T, 4) + ' K',
           rgbCss(TH.warn), '11px ' + FONT_UI);
    if(Number.isFinite(R.closed)){
      const lc = Math.log10(R.closed);
      ctDot(ctx, C, lc, R.peak.C / SM_KBEV, 4.5, rgbCss(TH.neg), rgbCss(TH.bg));
      ctText(ctx, C.X(lc) + 7, C.Y(R.peak.C / SM_KBEV) + 14, 'closed form',
             rgbCss(TH.neg), '11px ' + FONT_UI);
    }
    const lt = Math.min(K.x1, Math.max(K.x0, Math.log10(st.T)));
    ctPath(ctx, C, [{ x:lt, y:0 }, { x:lt, y:K.cMax * 1.18 }], rgbCss(TH.text, 0.5), 1.4);
    /* and the entropy, climbing between the two limits of the third law */
    if(stack){
      const S = mkPlot(cx0, top + ch + gapPx, cw, ch, K.x0, K.x1, 0, Math.max(0.2, K.lnG) * 1.25);
      plotFrame(ctx, S, 'log₁₀ of the temperature (K)', 'entropy S/k',
                'from k ln g₀ at the bottom to k ln Σg at the top');
      ctGrid(ctx, S, 1);
      ctPath(ctx, S, [{ x:K.x0, y:K.lnG }, { x:K.x1, y:K.lnG }], rgbCss(TH.neg), 1.6, [6, 4]);
      ctPath(ctx, S, [{ x:K.x0, y:K.ln0 }, { x:K.x1, y:K.ln0 }], rgbCss(TH.neg), 1.6, [6, 4]);
      ctText(ctx, S.px + 8, S.Y(K.lnG) - 6, 'ln Σg = ' + fmtNum(K.lnG, 4), rgbCss(TH.neg), '11px ' + FONT_UI);
      ctText(ctx, S.px + 8, S.Y(K.ln0) - 6, 'ln g₀ = ' + fmtNum(K.ln0, 4), rgbCss(TH.neg), '11px ' + FONT_UI);
      ctPath(ctx, S, K.curve.map(p => ({ x:p.x, y:p.S })), rgbCss(TH.curl), 2.8);
      ctPath(ctx, S, [{ x:lt, y:0 }, { x:lt, y:Math.max(0.2, K.lnG) * 1.25 }], rgbCss(TH.text, 0.5), 1.4);
    }
    stageNote(ctx, 'the peak is where a gap can first absorb heat — and the entropy has climbed by ' +
                   'exactly ln(Σg/g₀) by the time it is over', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.smBoltz.frameOwn(st, dt, ctx, W, H);
    const L = SM_LEVELS[st.key];
    const lv = L.mk(st.key === 'hydrogen' ? L.par : st.gap);
    const R = smPartition(lv, st.T);
    const shown = lv.slice(0, 14);
    const Emax = Math.max(...shown.map(l => l.E)) * 1.2 + 1e-6;

    /* the ladder of levels, with population as bar length */
    const P = mkPlot(80, 55, (W - 200) * 0.5, H - 145, 0, 1.05, 0, Emax);
    st.P = P;
    plotFrame(ctx, P, 'population', 'energy (eV)', 'how the levels are actually occupied');
    shown.forEach((l, i) => {
      const p = R.p[i];
      ctx.fillStyle = rgbCss(TH.grad, 0.75);
      ctx.fillRect(P.X(0), P.Y(l.E) - 5, Math.max(1, P.X(p) - P.X(0)), 10);
      ctPath(ctx, P, [{ x:0, y:l.E }, { x:1.02, y:l.E }], rgbCss(TH.faint, 0.5), 1);
      if(l.g > 1 && i < 8)
        ctText(ctx, P.X(1.02) + 4, P.Y(l.E) + 4, '×' + l.g, rgbCss(TH.dim), '11px ' + FONT_UI);
    });
    /* kT drawn on the same axis — the only scale that matters */
    const kT = SM_KBEV * st.T;
    ctPath(ctx, P, [{ x:0, y:kT }, { x:1.05, y:kT }], rgbCss(TH.warn), 2, [5, 4]);
    ctText(ctx, P.X(0.35), P.Y(kT) - 8, 'kT = ' + fmtNum(kT, 4) + ' eV', rgbCss(TH.warn), '12px ' + FONT_UI);

    /* heat capacity against temperature, on the right */
    const P2 = mkPlot(P.px + P.pw + 100, 55, W - (P.px + P.pw + 100) - 60, H - 145, 0, 3000, 0, 1.05);
    plotFrame(ctx, P2, 'temperature (K)', 'heat capacity (scaled)',
              'the Schottky peak — a gap can only absorb heat near kT ≈ ΔE');
    ctGrid(ctx, P2);
    let cmax = 1e-12;
    const cs = [];
    for(let i = 0; i <= 200; i++){
      const T = 15 + 3000 * i / 200;
      const c = smPartition(lv, T).C;
      cs.push({ x:T, y:c }); cmax = Math.max(cmax, c);
    }
    ctPath(ctx, P2, cs.map(p => ({ x:p.x, y:p.y / cmax })), rgbCss(TH.grad), 2.8);
    ctPath(ctx, P2, [{ x:st.T, y:0 }, { x:st.T, y:1.05 }], rgbCss(TH.warn), 2, [4, 3]);
    stageNote(ctx, 'a level far above kT is empty and contributes nothing — that is what "frozen out" means', W, H);
  },
  deriveOwn(st){
    const D = STAGES.smBoltz.schemeOf(st), K = STAGES.smBoltz.chartOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 7) : 'not defined here');
    if(!D.ok) return {
      title:'This level scheme cannot be summed',
      steps:[drvSay('what the sheet has to say',
        'One level per line — an energy in eV, then how many states share it. Fix the lines listed ' +
        'under the sheet. Nothing below is computed until the whole scheme reads, because a partition ' +
        'function summed over half a scheme is a different system\'s.')],
      note:'The previous scheme is still drawn, so the picture does not blank while you type.'
    };
    const R = D.R;
    return {
      title:'One sum, three quantities, and each of them computed twice',
      steps:[
        drvStep('the sum itself, over your levels',
          `${dv('Z')} ${dop('=')} Σ ${dv('g')}ᵢ${dop('e')}^(−${dv('E')}ᵢ/${dv('k')}${dv('T')})`,
          `Z = ${n(R.Z)} over ${R.levels} levels at ${st.T} K, where kT = ${n(R.kT)} eV`),
        drvStep('the mean energy, by weighting the levels',
          `⟨${dv('E')}⟩ ${dop('=')} Σ ${dv('E')}ᵢ${dv('P')}ᵢ`,
          `${n(R.U)} eV`),
        drvStep('and again, by differentiating the sum',
          `⟨${dv('E')}⟩ ${dop('=')} ${dop('−')}${dfrac('∂ ln ' + dv('Z'), '∂β')}`,
          `${n(R.Ubeta)} eV — the two differ by ${fmtAgree(R.U, R.Ubeta, 'eV')}`),
        drvSay('the second route never looks at a population',
          'It differentiates one number, the sum, with respect to one parameter. That it lands on the same energy as adding up E times P over every level is the claim Z exists to make, and it is checked here on a scheme nobody chose in advance.'),
        drvStep('the heat capacity, as an energy fluctuation',
          `⟨${dv('E')}²⟩ ${dop('−')} ⟨${dv('E')}⟩² ${dop('=')} ${dv('k')}${dv('T')}²${dv('C')}`,
          `C = ${n(R.C)} eV/K, which is ${fmtNum(R.Cok, 5)} k`),
        drvStep('and again, as dU/dT on a five-point stencil',
          `${dv('C')} ${dop('=')} ${dfrac('d⟨' + dv('E') + '⟩', 'd' + dv('T'))}`,
          `${n(R.CdT)} eV/K — apart by ${fmtAgree(R.C, R.CdT, 'eV/K')}`),
        drvSay('a response function equal to a fluctuation',
          'A system that absorbs heat readily is one whose energy fluctuates a lot, and here they are the same number to the precision of a numerical derivative. The same pattern connects conductivity to current noise and viscosity to Brownian motion, and it is not a coincidence: both sides are second derivatives of the same ln Z.'),
        drvStep('the entropy, by Gibbs',
          `${dv('S')} ${dop('=')} ${dop('−')}${dv('k')} Σ ${dv('P')}ᵢ ln ${dv('P')}ᵢ`,
          `${n(R.Sgibbs)} eV/K`),
        drvStep('and by thermodynamics, which never sees a population',
          `${dv('S')} ${dop('=')} ${dfrac(dv('U') + ' − ' + dv('F'), dv('T'))} , &nbsp; ${dv('F')} ${dop('=')} ${dop('−')}${dv('k')}${dv('T')} ln ${dv('Z')}`,
          `${n(R.S)} eV/K — apart by ${fmtAgree(R.S, R.Sgibbs, 'eV/K')}`),
        drvStep('both ends of the third law, measured on your scheme',
          `${dv('S')}(${dv('T')}→0) ${dop('=')} ${dv('k')} ln ${dv('g')}₀ , &nbsp; ${dv('S')}(${dv('T')}→∞) ${dop('=')} ${dv('k')} ln Σ${dv('g')}ᵢ`,
          `ln g₀ = ${fmtNum(K.ok ? K.ln0 : NaN, 5)}, reached to ${fmtAgree(R.SloMeas, R.S0, 'eV/K')}; ` +
          `ln Σg = ${fmtNum(K.ok ? K.lnG : NaN, 5)}, reached to ${fmtNum(100 * (R.hiRatio - 1), 5)}%`),
        drvSay('which is why entropy has an absolute zero and energy does not',
          'Add a constant to every level and Z is multiplied by an exponential, U shifts by that constant and S does not move at all. The entropy of a system is the logarithm of a count of states, and a count has a bottom: at zero temperature only the ground level is occupied and S falls to k ln g₀, whatever the rest of the scheme looks like.'),
        drvStep('the peak in C, located rather than quoted',
          `${dfrac('d' + dv('C'), 'd' + dv('T'))} ${dop('=')} 0`,
          `golden section gives ${fmtNum(R.peak.T, 6)} K; bisecting dC/dT gives ${fmtNum(R.peak.Troot, 6)} K` +
          (Number.isFinite(R.closed) ? `; the closed form gives ${fmtNum(R.closed, 6)} K` : '')),
        Number.isFinite(R.closed)
          ? drvStep('and for a two-level scheme there is a closed form to check it against',
              `${dv('x')}·tanh(${dfrac(dv('x') + ' − ln ' + dv('r'), '2')}) ${dop('=')} 2 , &nbsp; ${dv('x')} ${dop('=')} Δ${dv('E')}/${dv('k')}${dv('T')}*`,
              `r = g₁/g₀ = ${fmtNum(D.G[1].g / D.G[0].g, 4)} gives x* = ${fmtNum(R.xStar, 7)}, so kT* = ${fmtNum(R.ratio, 7)} ΔE`)
          : drvSay('your scheme has more than two distinct energies, so there is no closed form',
              'The 0.417·ΔE/k every textbook quotes is the root of a transcendental equation that exists only for a two-level system. With ' + D.G.length + ' distinct energies there is no such equation — and the peak is still there, still at a definite temperature, and still found. That is the difference between a formula and a measurement.'),
        drvStep('and it is exactly proportional to the spacing, swept over a hundredfold',
          `${dv('T')}*(λ${dv('E')}) ${dop('=')} λ ${dv('T')}*(${dv('E')})`,
          K.ok ? `kT*/ΔE across λ from 0.1 to 10 spreads by ${fmtSig(K.sweep.spread, 3)}`
               : 'not computed'),
        drvSay('because a level scheme has no scale except its own gaps',
          'Nothing in Σ g e^(−E/kT) can tell an energy from a temperature separately — only their ratio appears. So multiplying every level by a hundred must move every feature of C(T) to a hundred times the temperature, exactly. Sampling that twice proves nothing; sweeping it and finding a spread of parts in a million is the measurement, and it is what says the peak temperature is a property of the gaps rather than of the arithmetic.')
      ],
      note:'Free energy is F = −kT ln Z, entropy is (U−F)/T, and pressure would be −∂F/∂V if the levels depended on a volume. Every thermodynamic quantity is a derivative of one sum — and on this panel every one of them that can be reached two ways has been.'
    };
  },
  derive(st){
    if(st.own) return STAGES.smBoltz.deriveOwn(st);
    const L = SM_LEVELS[st.key];
    const lv = L.mk(st.key === 'hydrogen' ? L.par : st.gap);
    const R = smPartition(lv, st.T);
    const U2 = smUFromZ(lv, st.T);
    const n = v => fmtNum(v, 7);
    return {
      title:'Why the Boltzmann factor is an exponential, and what Z is for',
      steps:[
        drvSay('start with the system in contact with a much larger reservoir',
          'The system alone is not isolated, so its microstates are not equally likely. What is isolated is system plus reservoir, and there the counting assumption does apply. So the probability of the system being in a particular state is proportional to the number of reservoir arrangements compatible with it.'),
        drvStep('the system takes E, so the reservoir is left with the rest',
          `${dv('P')}(${dv('E')}) ${dop('∝')} Ω_res(${dv('U')} ${dop('−')} ${dv('E')})`,
          'one state of the system, many of the reservoir'),
        drvStep('take a logarithm and expand, since E is tiny compared with U',
          `ln Ω_res(${dv('U')}${dop('−')}${dv('E')}) ${dop('≈')} ln Ω_res(${dv('U')}) ${dop('−')} ${dv('E')}${dfrac('∂ ln Ω', '∂' + dv('U'))}`,
          'a first-order Taylor expansion — the only approximation in the derivation'),
        drvStep('and that derivative is exactly 1/kT',
          `${dfrac('∂ ln Ω', '∂' + dv('U'))} ${dop('=')} ${dfrac('1', dv('k') + dv('T'))}`,
          'from the definition of temperature the previous stage arrived at'),
        drvStep('exponentiate, and the Boltzmann factor appears',
          `${dv('P')}(${dv('E')}) ${dop('∝')} ${dop('e')}^(−${dv('E')}/${dv('k')}${dv('T')})`,
          `at ${st.T} K, kT = ${n(SM_KBEV * st.T)} eV`),
        drvSay('the exponential was not assumed — it came from a Taylor expansion',
          'This is worth pausing on. The exponential form is forced: a logarithm expanded to first order, then exponentiated, can only give an exponential. Its rate is the derivative that defines temperature. Nothing was chosen.'),
        drvStep('normalising the probabilities defines the partition function',
          `${dv('Z')} ${dop('=')} Σ ${dv('g')}ᵢ${dop('e')}^(−${dv('E')}ᵢ/${dv('k')}${dv('T')})`,
          `Z = ${n(R.Z)} over ${lv.length} levels`),
        drvStep('the mean energy, by summing the populations',
          `⟨${dv('E')}⟩ ${dop('=')} Σ ${dv('E')}ᵢ${dv('P')}ᵢ`,
          `${n(R.U)} eV`),
        drvStep('and again, by differentiating ln Z',
          `⟨${dv('E')}⟩ ${dop('=')} ${dop('−')}${dfrac('∂ ln ' + dv('Z'), '∂β')} , &nbsp; β ${dop('=')} 1/${dv('k')}${dv('T')}`,
          /* kT is the scale ⟨E⟩ is read against, and without it this row was
             nonsense on every preset whose excited states are frozen out: for
             hydrogen at room temperature ⟨E⟩ is zero to 170 decimal places by
             both routes, and dividing the 1.81×10⁻¹⁷⁰ eV between them by itself
             announced a 100% disagreement. Against kT it is what it is — nothing */
          `${n(U2)} eV — the two routes differ by ${fmtAgreeGross(R.U, U2, SM_KBEV * st.T, 'eV')}`),
        drvStep('the fluctuation in energy gives the heat capacity for free',
          `⟨${dv('E')}²⟩ ${dop('−')} ⟨${dv('E')}⟩² ${dop('=')} ${dv('k')}${dv('T')}²${dv('C')}`,
          `C = ${n(R.C)} eV/K`),
        drvSay('which is a fluctuation–dissipation relation',
          'A system that absorbs heat readily is one whose energy fluctuates a lot, and the two are the same number. That pattern — a response function equal to a fluctuation — recurs throughout physics: electrical conductivity and current noise, magnetic susceptibility and magnetisation fluctuations, viscosity and Brownian motion.'),
        drvSay('and notice what Z has quietly become',
          'It entered as a normalising constant — the thing you divide by so the probabilities sum to one — and it has just handed over the mean energy, the heat capacity and, through −kT ln Z, the free energy. Nothing was added to get them; they were all differentiations of the same sum. That is what a <b>generating function</b> is, and it is the same trick the probability wing plays with moment generating functions: pack a whole distribution into one function of a parameter, then get every moment by differentiating with respect to that parameter.'),
        drvSay('the exponential is not an assumption either',
          'e^(−E/kT) looks like a postulate and is a consequence. Put the system in contact with a much larger reservoir, count the reservoir\'s microstates as a function of how much energy it has given away, and expand its entropy to first order: the count falls off exponentially in the energy handed over, with 1/kT as the rate. So the Boltzmann factor is the reservoir\'s entropy doing the weighting, and temperature is nothing more mysterious than ∂S/∂E of whatever is large enough to be called a reservoir.')
      ],
      note:'Free energy is F = −kT ln Z, entropy is S = (U−F)/T, pressure is −∂F/∂V. Every thermodynamic quantity is a derivative of ln Z. That is why statistical mechanics is often described as the art of computing one sum: once you have Z, the rest is calculus.'
    };
  },
  readoutOwn(st){
    const D = STAGES.smBoltz.schemeOf(st), K = STAGES.smBoltz.chartOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 7 : d) : 'not defined here');
    if(!D.ok) return `<div class="card tight"><div class="ttl">This level scheme cannot be summed</div>
      ${D.P.errs.slice(0, 6).map(e => kv(e.line ? 'line ' + e.line : '', e.msg)).join('')}
      <p class="help">One level per line — an energy in eV, then optionally how many states share it.
      <b>ladder</b> and <b>rotor</b> generate the schemes nobody would type out. Nothing below is
      computed until the sheet reads, because a partition function summed over half a scheme belongs
      to a different system.</p></div>`;
    const R = D.R;
    return `<div class="card tight"><div class="ttl">Your scheme at ${st.T} K</div>
      ${kv('levels', String(R.levels) + ' over ' + R.groups + ' distinct energies')}
      ${kv('total number of states Σg', String(R.sumG))}
      ${kv('ground-state degeneracy g₀', String(R.g0))}
      ${kv('energies span', n(R.span, 5) + ' eV, smallest gap ' + n(R.minGap, 5) + ' eV')}
      ${kv('kT here', n(R.kT, 5) + ' eV')}
      ${kv('partition function Z', n(R.Z))}
      <p class="help">Z counts the levels that are <b>effectively available</b>: it runs from g₀ when
      everything is frozen into the ground state up to Σg when kT dwarfs the whole scheme. Yours is at
      ${fmtNum(100 * (R.Z - R.g0) / Math.max(1e-12, R.sumG - R.g0), 2)}% of that journey.</p>
    </div>
    <div class="card tight"><div class="ttl">Three quantities, each computed twice</div>
      ${kv('⟨E⟩ by Σ EᵢPᵢ', n(R.U) + ' eV')}
      ${kv('⟨E⟩ by −∂lnZ/∂β', n(R.Ubeta) + ' eV')}
      ${kv('they differ by', fmtAgree(R.U, R.Ubeta, 'eV'))}
      ${kv('C by the energy fluctuation', n(R.C) + ' eV/K')}
      ${kv('C by dU/dT', n(R.CdT) + ' eV/K')}
      ${kv('they differ by', fmtAgree(R.C, R.CdT, 'eV/K'))}
      ${kv('S by −kΣ p ln p', n(R.Sgibbs) + ' eV/K')}
      ${kv('S by (U−F)/T', n(R.S) + ' eV/K')}
      ${kv('they differ by', fmtAgree(R.S, R.Sgibbs, 'eV/K'))}
      <p class="help">Three claims, six numbers, three gaps. Each pair is computed along routes that
      share no code — one weights the levels, the other differentiates the sum — and what is left over
      is numerical differentiation error rather than physics. Printing only the agreeing number would
      not be a check at all.</p>
    </div>
    <div class="card tight"><div class="ttl">The peak, located</div>
      ${kv('by golden section', n(R.peak.T, 6) + ' K')}
      ${kv('by bisecting dC/dT', n(R.peak.Troot, 6) + ' K')}
      ${kv('the two routes differ by', Number.isFinite(R.peak.rel) ? fmtNum(100 * R.peak.rel, 6) + '%' : '—')}
      ${kv('C there', n(R.peak.C / SM_KBEV, 5) + ' k')}
      ${Number.isFinite(R.closed)
        ? kv('the closed form gives', n(R.closed, 6) + ' K') +
          kv('x* solving x·tanh((x−ln r)/2) = 2', n(R.xStar)) +
          kv('so kT* ÷ ΔE', n(R.ratio))
        : kv('closed form', 'none — that formula exists only for two levels')}
      <p class="help">${Number.isFinite(R.closed)
        ? 'Your scheme is a genuine two-level system, so the transcendental root applies and is solved separately by bisection. With equal degeneracies it gives the familiar kT* = 0.4168 ΔE; yours is ' + fmtNum(R.ratio, 5) + ' ΔE, because an upper level ' + fmtNum(D.G[1].g / D.G[0].g, 3) + ' times as degenerate pulls the peak down.'
        : 'With ' + R.groups + ' distinct energies there is no closed form to quote — and the peak is still at a definite temperature, found by two independent numerical routes that agree to ' + (Number.isFinite(R.peak.rel) ? fmtNum(100 * R.peak.rel, 5) + '%' : 'the precision printed above') + '.'}
      ${R.peak.edge ? ' <b>The peak is at the edge of the search window</b>, so it may be the shoulder of something outside it.' : ''}</p>
    </div>
    <div class="card tight"><div class="ttl">The spacing sweep — an invariance, not a value</div>
      ${K.ok ? K.sweep.rows.map(r =>
        kv('every level × ' + fmtNum(r.lam, 3), 'peak at ' + fmtNum(r.T, 6) + ' K, ratio ' + fmtNum(r.ratio, 8))).join('') +
        kv('spread across the hundredfold', fmtSig(K.sweep.spread, 4))
       : kv('', 'not computed')}
      <p class="help">Only the ratio E/kT appears anywhere in Z, so multiplying every level by λ must
      move the peak to exactly λT*. Two samples would prove nothing; a hundredfold sweep with a spread
      of ${K.ok ? fmtSig(K.sweep.spread, 2) : '—'} is a measurement, and it says the peak
      temperature belongs to the gaps rather than to the arithmetic.</p>
    </div>
    <div class="card tight"><div class="ttl">The third law, at both ends</div>
      ${kv('S(T→0), computed', n(R.SloMeas) + ' eV/K')}
      ${kv('k ln g₀', n(R.S0) + ' eV/K')}
      ${kv('they differ by', fmtAgree(R.SloMeas, R.S0, 'eV/K'))}
      ${kv('S(T→∞), computed', n(R.ShiMeas) + ' eV/K')}
      ${kv('k ln Σg', n(R.Sinf) + ' eV/K')}
      ${kv('ratio', n(R.hiRatio, 9))}
      <p class="help">A count of states has a bottom and a top, and the entropy of your scheme runs
      between their logarithms. Neither end was assumed: both were computed by evaluating the same
      sum at a temperature far outside the range where anything interesting happens.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.smBoltz.readoutOwn(st);
    const L = SM_LEVELS[st.key];
    const lv = L.mk(st.key === 'hydrogen' ? L.par : st.gap);
    const R = smPartition(lv, st.T);
    const U2 = smUFromZ(lv, st.T);
    const n = v => fmtNum(v, 7);
    const kT = SM_KBEV * st.T;
    return `<div class="card tight"><div class="ttl">${esc(L.n)} at ${st.T} K</div>
      ${kv('partition function Z', n(R.Z))}
      ${kv('levels summed', String(lv.length))}
      ${kv('kT', n(kT) + ' eV')}
      ${kv('ground-state population', fmtNum(R.p[0], 6))}
      ${kv('first excited', fmtNum(R.p[1] || 0, 6))}
      ${kv('ratio of the two', fmtNum(R.p[0] > 0 ? (R.p[1] || 0) / R.p[0] : 0, 6))}
      <p class="help">Z counts the levels that are <b>effectively available</b>. At high temperature
      it approaches the total number of states; at low temperature it approaches the ground-state
      degeneracy, because everything else has been frozen out.</p>
    </div>
    <div class="card tight"><div class="ttl">Two routes to the same energy</div>
      ${kv('⟨E⟩ by summing populations', n(R.U) + ' eV')}
      ${kv('⟨E⟩ by −∂lnZ/∂β', n(U2) + ' eV')}
      ${kv('difference', fmtAgreeGross(R.U, U2, kT, 'eV'))}
      ${kv('heat capacity C', n(R.C) + ' eV/K')}
      ${kv('free energy F', n(R.F) + ' eV')}
      ${kv('entropy S', n(R.S) + ' eV/K')}
      <p class="help">Computing the same quantity two independent ways and printing the gap is the
      only honest way to claim they are equal. The residual here is numerical differentiation error,
      not physics.</p>
    </div>
    <div class="card tight"><div class="ttl">Which levels matter</div>
      ${lv.slice(0, 5).map((l, i) =>
        kv('E = ' + fmtNum(l.E, 4) + ' eV' + (l.g > 1 ? ' (×' + l.g + ')' : ''),
           fmtNum(100 * R.p[i], 4) + '%')).join('')}
      <p class="help">${kT < (lv[1] ? lv[1].E - lv[0].E : 1) / 5
        ? 'kT is far below the first gap, so essentially everything sits in the ground state and the system can absorb almost no heat. This is the frozen regime.'
        : 'kT is comparable to or larger than the gaps, so several levels are meaningfully populated and the system absorbs heat readily.'}</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.smBoltz.schemeOf(st);
      if(!D.ok) return `<div class="k">your scheme</div><div style="color:var(--c-neg)">does not read</div>`;
      return `<div class="k">your scheme, ${st.T} K</div>
        <div>Z = ${fmtNum(D.R.Z, 4)}, C = ${fmtNum(D.R.Cok, 4)} k</div>
        <div>peak at ${fmtNum(D.R.peak.T, 4)} K</div>`;
    }
    const L = SM_LEVELS[st.key];
    const R = smPartition(L.mk(st.key === 'hydrogen' ? L.par : st.gap), st.T);
    return `<div class="k">Z = ${fmtNum(R.Z, 4)} at ${st.T} K</div><div>⟨E⟩ = ${fmtNum(R.U, 4)} eV</div>`;
  }
};
