/* ============================================================================
   4s · THE STRING WING — II · WHY TWENTY-SIX, AND WHY YOU CANNOT SEE THEM
   The critical dimension is the one place where string theory makes a sharp,
   non-negotiable prediction out of nothing but consistency, so it is computed
   here three independent ways rather than announced. The Casimir stage then
   shows the same regularisation being measured in a laboratory, because "the
   sum of all positive integers is −1/12" is otherwise the point at which a
   sceptical reader closes the page, and they would be right to.
   ============================================================================ */

/* ============================================================================
   4 · ζ(−1), AND THE NUMBER OF DIMENSIONS
   ============================================================================ */
STAGES.wsCrit = {
  title: 'The critical dimension, solved for',
  dockLegend: true,
  derive(st){
    const sup = st.kind === 'super';
    const D = sup ? wsCriticalFromIntercept('super') : wsCriticalFromIntercept('bos');
    return {
      title:'Where D = 26 comes from, and why it is not adjustable',
      steps:[
        drvSay('the problem',
          'Each transverse oscillator contributes ½ħω of zero-point energy, and there are infinitely many of them. The sum is 1 + 2 + 3 + … , which diverges. A theory that stops here has nothing to say; a theory that writes "= −1/12" without explaining itself deserves the scepticism it gets.'),
        drvStep('put in a physical cutoff',
          `Σ ${dv('n')} ${dop('→')} Σ ${dv('n')} ${dop('e')}^(−ε${dv('n')}) ${dop('=')} ${dfrac('1', '4 sinh²(ε/2)')}`,
          `at ε = ${fmtNum(st.eps, 4)} this is ${fmtNum(wsSumCutoff(st.eps), 8)} — finite, and computed in closed form`),
        drvStep('and expand it',
          `${dfrac('1', 'ε²')} ${dop('−')} ${dfrac('1', '12')} ${dop('+')} ${dfrac('ε²', '240')} ${dop('−')} …`,
          `subtracting 1/ε² leaves ${fmtNum(wsSumRegularised(st.eps), 10)}, against −1/12 = −0.0833333…`),
        drvSay('the divergent piece is not the answer, and it is not the question either',
          'The 1/ε² term depends on the cutoff, so it depends on how you chose to regularise — it is not physics. It is also removed by a physical boundary condition: it is the energy the field would have with no boundaries at all, which is subtracted when you ask for the DIFFERENCE that a boundary makes. What survives is cutoff-independent, and that is the part with meaning.'),
        drvStep('the same number, by analytic continuation, computed here',
          `ζ(1{−}${dv('s')}) ${dop('=')} 2(2π)^(−${dv('s')}) cos(π${dv('s')}/2) Γ(${dv('s')}) ζ(${dv('s')})`,
          `ζ(2) is summed by Euler–Maclaurin to ${fmtNum(wsZetaEM(2), 12)}; the functional equation then gives ζ(−1) = ${fmtNum(wsZetaMinusOne(), 12)}`),
        drvSay('two regularisations, no shared machinery, one answer',
          'The cutoff route never mentions the zeta function; the continuation route never mentions a cutoff. They agree to the last digit the arithmetic allows. That agreement is what makes −1/12 a fact about the analytic structure of the sum rather than a convention someone adopted.'),
        drvStep('so the normal-ordering constant is',
          `${dv('a')} ${dop('=')} ${dop('−')}${dfrac(dv('D') + '{−}2', '2')}ζ(−1) ${dop('=')} ${dfrac(dv('D') + '{−}2', '24')}`,
          sup ? 'and the NS sector adds its half-integer-moded fermions, giving a = (D−2)/16'
              : 'one factor of ½ from the zero-point energy, one from ζ(−1) = −1/12'),
        drvStep('level 1 must be exactly massless',
          `α′${dv('M')}² ${dop('=')} 1 ${dop('−')} ${dv('a')} ${dop('=')} 0`,
          sup ? 'a = ½ ⟹ (D−2)/16 = ½ ⟹ D = 10' : 'a = 1 ⟹ (D−2)/24 = 1 ⟹ D = 26'),
        drvSay('why "must"',
          'Level 1 is a Lorentz vector. A MASSLESS vector in D dimensions has D−2 polarisations; a massive one has D−1. The string supplies exactly D−2 states there. If that state had any mass at all the counting would be wrong and Lorentz invariance would fail — so the intercept is fixed, and with it the dimension.'),
        drvStep('and independently: the total conformal anomaly must vanish',
          sup ? `${dfrac('3' + dv('D'), '2')} ${dop('−')} 15 ${dop('=')} 0`
              : `${dv('D')} ${dop('−')} 26 ${dop('=')} 0`,
          sup ? 'D bosons + D/2 fermions − 26 from the bc ghosts + 11 from the βγ superghosts'
              : 'D free bosons contribute c = D; the reparametrisation ghosts contribute −26'),
        drvSay('and that is the whole prediction',
          `Two arguments with nothing in common — one about counting polarisations, one about a symmetry of the worldsheet — return the same D = ${D}. There is no dial. This is the sharpest thing the theory says, and it says something manifestly false about the world we see, which is why the next three stages are about hiding the extra dimensions.`)
      ],
      note:'Both routes are evaluated live rather than quoted. The cutoff sum uses 1/(4 sinh²(ε/2)) rather than e^(−ε)/(1−e^(−ε))², which is the same function but does not lose its significant figures to cancellation as ε → 0.'
    };
  },
  enter(st, o){
    st.kind = o.kind || 'bos';
    st.eps  = o.eps === undefined ? 0.35 : o.eps;
    st.Nmax = o.Nmax === undefined ? 14 : o.Nmax;
    st.view = o.view || 'reg';
  },
  controls(){
    const st = ST;
    return ctSeg('wsCrK', st.kind, [['bos','bosonic string'],['super','superstring']]) +
      ctSeg('wsCrV', st.view, [['reg','regularising the sum'],['dim','solving for D']]) +
      ctlRow('cutoff ε', ctlSlider('wsCrE', 0.02, 1.2, 0.005, st.eps)) +
      ctlRow('terms shown', ctlSlider('wsCrN', 4, 30, 1, st.Nmax)) +
      `<p class="help">Slide ε towards zero and watch two things happen at once: the raw sum runs away like
      1/ε², and the <b>remainder</b> after subtracting that runaway settles on −1/12 and stays there. The
      settling is the content. The panel also carries out the completely separate analytic continuation, so
      the two answers can be compared rather than one being asserted.</p>`;
  },
  wire(){
    ctWireSeg('wsCrK', v => { ST.kind = v; });
    ctWireSeg('wsCrV', v => { ST.view = v; });
    wireSlider('wsCrE', () => ST.eps, v => { ST.eps = v; }, v => 'ε = ' + fmtNum(+v, 4));
    wireSlider('wsCrN', () => ST.Nmax, v => { ST.Nmax = Math.round(v); }, v => Math.round(v) + ' terms');
  },
  frame(st, dt, ctx, W, H){
    if(st.view === 'reg'){
      /* left: the partial sums running away, and the damped sum converging */
      const P = mkPlot(W * 0.08, 52, W * 0.40, H - 132, 0, st.Nmax, 0, Math.max(12, wsPartialSum(st.Nmax) * 1.1));
      plotFrame(ctx, P, 'terms included', 'running total',
        'the bare sum, and the same sum with e^(−εn) attached');
      plotTicksX(ctx, P, [0, Math.round(st.Nmax / 2), st.Nmax], v => fmtNum(v, 3));
      rlYTicks(ctx, P, [0, P.y1 / 2, P.y1]);
      const xs = [], bare = [], damp = [];
      let acc = 0;
      for(let n = 1; n <= st.Nmax; n++){
        acc += n * Math.exp(-st.eps * n);
        xs.push(n); bare.push(wsPartialSum(n)); damp.push(acc);
      }
      rlLine(ctx, P, xs, bare, rgbCss(TH.neg), 2.2);
      rlLine(ctx, P, xs, damp, rgbCss(TH.curl), 2.4);
      const closed = wsSumCutoff(st.eps);
      if(closed < P.y1)
        rlSegment(ctx, P.px, P.Y(closed), P.px + P.pw, P.Y(closed), rgbCss(TH.accent, 0.8), 1.4, [5, 4]);
      rlText(ctx, P.px + 10, P.py + 16, 'Σn — no limit exists', rgbCss(TH.neg), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 10, P.py + 32, 'Σn e⁻ᵋⁿ — converges', rgbCss(TH.curl), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 10, P.py + 48, 'its closed form 1/(4 sinh²(ε/2))', rgbCss(TH.accent), '10.5px ' + FONT_UI);

      /* right: the remainder against ε, with −1/12 as the horizontal it lands on */
      const Q = mkPlot(W * 0.55, 52, W * 0.40, H - 132, 0, 1.2, -0.115, -0.055);
      /* the y label is drawn raw by plotFrame — only the x label and the title
         are passed through uniSup — so the exponent must be Unicode already */
      plotFrame(ctx, Q, 'cutoff ε', 'Σn e⁻ᵋⁿ − 1/ε²',
        'subtract the divergence and this is what is left');
      plotTicksX(ctx, Q, [0, 0.3, 0.6, 0.9, 1.2], v => fmtNum(v, 2));
      rlYTicks(ctx, Q, [-0.11, -0.0833333, -0.06], v => fmtNum(v, 4));
      rlSegment(ctx, Q.px, Q.Y(-1 / 12), Q.px + Q.pw, Q.Y(-1 / 12), rgbCss(TH.accent), 1.8, [5, 4]);
      rlText(ctx, Q.px + Q.pw - 8, Q.Y(-1 / 12) - 10, '−1/12', rgbCss(TH.accent), '600 11px ' + FONT_MONO, 'right');
      plotCurve(ctx, Q, e => e < 1e-3 ? -1 / 12 : wsSumRegularised(e), 300, rgbCss(TH.curl), 2.4);
      rlDot(ctx, Q.X(st.eps), Q.Y(wsSumRegularised(st.eps)), 5, rgbCss(TH.pos));
      rlSegment(ctx, Q.X(st.eps), Q.py, Q.X(st.eps), Q.py + Q.ph, rgbCss(TH.pos, 0.5), 1.2, [3, 3]);
      const zc = wsZetaMinusOne();
      rlText(ctx, Q.px + 10, Q.py + Q.ph - 40,
        'the same number from the functional equation: ' + fmtNum(zc, 10),
        rgbCss(TH.grad), '10.5px ' + FONT_UI);
      rlText(ctx, Q.px + 10, Q.py + Q.ph - 24,
        'they differ by ' + fmtNum(Math.abs(zc + 1 / 12), 3) + ' — two routes, no shared machinery',
        rgbCss(TH.dim), '10.5px ' + FONT_UI);
    } else {
      /* solving for D: both conditions plotted against D, with the crossing marked */
      const sup = st.kind === 'super';
      const P = mkPlot(W * 0.10, 54, W * 0.84, H - 134, 2, 34, -1.4, 2.2);
      plotFrame(ctx, P, 'number of spacetime dimensions D', '',
        sup ? 'two conditions on D, for the superstring' : 'two conditions on D, for the bosonic string');
      plotTicksX(ctx, P, [2, 10, 18, 26, 34], v => fmtNum(v, 2));
      rlYTicks(ctx, P, [-1, 0, 1, 2]);
      plotZeroY(ctx, P);
      /* condition 1: intercept minus its required value */
      plotCurve(ctx, P, D => wsIntercept(D, sup ? 'super' : 'bos') - (sup ? 0.5 : 1),
                200, rgbCss(TH.curl), 2.4);
      /* condition 2: the total conformal anomaly, rescaled to share the axis */
      plotCurve(ctx, P, D => wsAnomalyC(D, sup ? 'super' : 'bos') / 24,
                200, rgbCss(TH.grad), 2.4, null);
      const Dc = sup ? 10 : 26;
      rlSegment(ctx, P.X(Dc), P.py, P.X(Dc), P.py + P.ph, rgbCss(TH.accent), 2, [5, 4]);
      rlDot(ctx, P.X(Dc), P.Y(0), 6, rgbCss(TH.pos), rgbCss(TH.bg));
      rlText(ctx, P.X(Dc), P.py + 18, 'D = ' + Dc, rgbCss(TH.accent), '600 13px ' + FONT_MONO, 'center');
      rlSegment(ctx, P.X(4), P.py, P.X(4), P.py + P.ph, rgbCss(TH.neg, 0.7), 1.4, [3, 3]);
      rlText(ctx, P.X(4) + 6, P.py + P.ph - 18, 'the four we see', rgbCss(TH.neg), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 14, P.py + 40, 'a(D) minus the value it has to take  — the polarisation count', rgbCss(TH.curl), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 14, P.py + 56, 'total conformal anomaly ÷ 24  — the worldsheet symmetry', rgbCss(TH.grad), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 14, P.py + 80,
        'two lines with nothing in common, crossing zero at the same D',
        rgbCss(TH.dim), '11px ' + FONT_UI);
    }
    stageNote(ctx, 'the divergent part depends on how you cut the sum off; the part that is left does not, and only that part is physics', W, H);
  },
  readout(st){
    const sup = st.kind === 'super';
    const raw = wsSumCutoff(st.eps);
    const rem = wsSumRegularised(st.eps);
    const zc  = wsZetaMinusOne();
    const D   = wsCriticalFromIntercept(sup ? 'super' : 'bos');
    const Da  = wsCriticalFromAnomaly(sup ? 'super' : 'bos');
    return `<div class="card tight"><div class="ttl">Route one — a cutoff, then subtract the divergence</div>
      ${kv('ε', fmtNum(st.eps, 5))}
      ${kv('Σ n e^(−εn), in closed form', fmtNum(raw, 10))}
      ${kv('the divergent piece 1/ε²', fmtNum(1 / (st.eps * st.eps), 10))}
      ${kv('what is left', fmtNum(rem, 12))}
      ${kv('−1/12', fmtNum(-1 / 12, 12))}
      ${kv('difference', fmtAgree(rem, -1 / 12))}
      ${kv('next term in the expansion, ε²/240', fmtNum(st.eps * st.eps / 240, 4))}
      <p class="help">The difference above is not a numerical error — it is the ε²/240 term beside it,
      which is the leading correction and which vanishes as ε → 0. Compare the two numbers as you slide ε
      and they track each other exactly. That is what it means for a regularisation to be under control.</p>
    </div>
    <div class="card tight"><div class="ttl">Route two — analytic continuation, carried out</div>
      ${kv('ζ(2), summed by Euler–Maclaurin', fmtNum(wsZetaEM(2), 14))}
      ${kv('  π²/6, for comparison', fmtNum(Math.PI * Math.PI / 6, 14))}
      ${kv('  difference', fmtAgree(wsZetaEM(2), Math.PI * Math.PI / 6))}
      ${kv('ζ(−1) from the functional equation', fmtNum(zc, 14))}
      ${kv('  difference from −1/12', fmtAgree(zc, -1 / 12))}
      <p class="help">Nothing in this calculation knows the answer in advance. ζ(2) is summed directly;
      the functional equation — a theorem about the zeta function, proved long before physics needed it —
      carries that number to s = −1. The exponential cutoff on the left and this continuation share no step,
      and they agree to twelve figures.</p>
    </div>
    <div class="card tight"><div class="ttl">And therefore the dimension</div>
      ${kv('theory', sup ? 'superstring (NS sector, GSO projected)' : 'bosonic string')}
      ${kv('intercept a(D)', sup ? '(D − 2)/16' : '(D − 2)/24')}
      ${kv('a must equal', sup ? '½' : '1')}
      ${kv('solving that gives D', fmtNum(D, 4))}
      ${kv('total conformal anomaly', sup ? '3D/2 − 15' : 'D − 26')}
      ${kv('setting it to zero gives D', fmtNum(Da, 4))}
      ${kv('the two routes differ by', fmtAgree(D, Da))}
      <p class="help">Two arguments that share no ingredient — one counts the polarisations a massless
      vector is allowed to have, the other demands that a symmetry of the worldsheet survive quantisation —
      return the same integer. There is no parameter to adjust and no way to soften the conclusion. It is
      also, as it stands, a prediction of ${fmtNum(D - 4, 3)} dimensions too many, which is what the rest
      of this wing has to deal with.</p>
    </div>`;
  },
  chip(st){
    const sup = st.kind === 'super';
    return `<div class="k">Critical dimension</div>
      <div style="color:var(--accent)">D = ${fmtNum(wsCriticalFromIntercept(sup ? 'super' : 'bos'), 3)}</div>
      <div style="color:var(--c-curl)">ε = ${fmtNum(st.eps, 4)}</div>`;
  },
  legend(){ return [['var(--c-neg)',  'the bare sum, which has no limit'],
                    ['var(--c-curl)', 'the regularised sum, and the polarisation condition'],
                    ['var(--accent)', '−1/12, and the critical dimension'],
                    ['var(--c-grad)', 'the analytic continuation, and the conformal anomaly'],
                    ['var(--c-pos)',  'your chosen cutoff']]; }
};

/* ============================================================================
   5 · THE SAME REGULARISATION, MEASURED
   ============================================================================ */
STAGES.wsCasimir = {
  title: 'Casimir — the leftover −1/12, in a laboratory',
  dockLegend: true,
  derive(st){
    const d = st.d;
    return {
      title:'Why the discarded infinity is allowed to be discarded',
      steps:[
        drvSay('the objection, taken seriously',
          'Throwing away an infinity and keeping the remainder looks like sleight of hand. The reason it is not is that the discarded piece is unobservable BY CONSTRUCTION — it is the vacuum energy with no boundaries present — while the remainder is a difference between two configurations, and differences are what experiments measure.'),
        drvStep('modes between two plates are quantised',
          `${dv('k')}_n ${dop('=')} ${dfrac('n π', dv('d'))}`,
          `at d = ${fmtNum(d * 1e9, 4)} nm the lowest mode has a wavelength of ${fmtNum(2 * d * 1e9, 4)} nm`),
        drvStep('so the zero-point energy is the same divergent sum',
          `${dv('E')} ${dop('=')} ${dfrac('ħ' + dv('c') + 'π', '2' + dv('d'))} Σ ${dv('n')}`,
          'one dimension, one polarisation — the identical Σn that the string\'s oscillators produce'),
        drvStep('regularise, subtract the boundary-free energy, keep the rest',
          `${dfrac(dv('E'), dv('A')) } ${dop('=')} ${dop('−')}${dfrac('π²ħ' + dv('c'), '720' + dv('d') + '³')}`,
          `${fmtNum(wsCasimirEnergyArea(d), 5)} J/m² at this separation — the −1/12 is the whole of the numerator`),
        drvStep('differentiate to get a force per unit area',
          `${dv('P')} ${dop('=')} ${dop('−')}${dfrac('π²ħ' + dv('c'), '240' + dv('d') + '⁴')}`,
          `${fmtNum(wsCasimirPressure(d), 5)} Pa — attractive, and it varies as 1/d⁴`),
        drvSay('and this has been measured',
          'Lamoreaux confirmed it to about 5% in 1997; Mohideen and Roy reached roughly 1% in 1998 with an atomic-force microscope; Decca and collaborators have since done better than 0.2%. The 240 in the denominator is 12 × 20, and the 12 in it is the same 12 that appears in ζ(−1). If the regularisation were arbitrary the number would be wrong.'),
        drvStep('for the plate you have chosen',
          `${dv('F')} ${dop('=')} ${dv('P')} ${dv('A')}`,
          `${fmtNum(Math.abs(wsCasimirForce(d, st.area)), 5)} N over ${fmtNum(st.area * 1e6, 4)} mm² — about the weight of ${fmtNum(Math.abs(wsCasimirForce(d, st.area)) / 9.80665 * 1e9, 3)} nanograms`),
        drvSay('what it does and does not prove',
          'It does not prove string theory. It proves that ζ-regularising a divergent mode sum, discarding the cutoff-dependent piece and keeping the finite remainder is a procedure that predicts a measurable force to better than a percent. That is the exact procedure the critical-dimension calculation uses, and it is the reason D = 26 deserves to be taken seriously as arithmetic rather than dismissed as bookkeeping.')
      ],
      note:'Real plates are neither perfectly conducting nor perfectly flat, and the measured force needs finite-conductivity, roughness and thermal corrections at the few-percent level. The ideal formula shown is the leading term those corrections are applied to.'
    };
  },
  enter(st, o){
    st.d = o.d === undefined ? 1e-6 : o.d;
    st.area = o.area === undefined ? 1e-6 : o.area;    // m², i.e. 1 mm²
  },
  controls(){
    const st = ST;
    return ctlRow('separation', ctlSlider('wsCaD', -9, -5, 0.01, Math.log10(st.d))) +
      ctlRow('plate area', ctlSlider('wsCaA', -8, -3, 0.05, Math.log10(st.area))) +
      `<p class="help">The mode sum between two mirrors is the same Σn the string's oscillators produce, and
      the finite part that survives regularisation is a force you can put on a balance. The 1/d⁴ law makes it
      negligible at a micron and enormous at a nanometre — at 10 nm the pressure exceeds an atmosphere, which
      is why it matters for microelectromechanical devices, whose moving parts stick together because of it.</p>`;
  },
  wire(){
    wireSlider('wsCaD', () => Math.log10(ST.d), v => { ST.d = Math.pow(10, v); },
               v => fmtNum(Math.pow(10, +v) * 1e9, 4) + ' nm');
    wireSlider('wsCaA', () => Math.log10(ST.area), v => { ST.area = Math.pow(10, v); },
               v => fmtNum(Math.pow(10, +v) * 1e6, 4) + ' mm²');
  },
  frame(st, dt, ctx, W, H){
    /* the two plates, with the allowed modes drawn between them */
    const cx = W * 0.22, cy = H * 0.45, hw = Math.min(W * 0.11, 130), hh = Math.min(H * 0.24, 150);
    wsTitle(ctx, cx, cy - hh - 42, 'only whole numbers of half-waves fit between the mirrors', TH.grad);
    ctx.fillStyle = rgbCss(TH.dim, 0.5);
    ctx.fillRect(cx - hw - 9, cy - hh, 9, 2 * hh);
    ctx.fillRect(cx + hw, cy - hh, 9, 2 * hh);
    for(let n = 1; n <= 5; n++){
      ctx.strokeStyle = rgbCss(TH.curl, 1 - n * 0.11); ctx.lineWidth = 1.7;
      ctx.beginPath();
      for(let i = 0; i <= 160; i++){
        const u = i / 160;
        const x = cx - hw + 2 * hw * u;
        const y = cy - hh * 0.7 + (n - 1) * (2 * hh * 0.7 / 5) * 0 +
                  hh * 0.55 * Math.sin(n * Math.PI * u) * Math.cos(st.t * (1 + n * 0.4)) * (0.9 / n);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    rlSegment(ctx, cx - hw, cy + hh + 14, cx + hw, cy + hh + 14, rgbCss(TH.pos), 1.6);
    rlText(ctx, cx, cy + hh + 30, 'd = ' + fmtNum(st.d * 1e9, 4) + ' nm',
           rgbCss(TH.pos), '600 11px ' + FONT_MONO, 'center');
    wsSub(ctx, cx, cy + hh + 50, 'outside, every wavelength is allowed — inside, only these');
    wsSub(ctx, cx, cy + hh + 66, 'the difference between the two sums is the force');

    /* the 1/d⁴ law across five decades, with the measured regime marked */
    const P = mkPlot(W * 0.44, 52, W * 0.50, H - 132,
                     Math.log10(1e-9), Math.log10(1e-5), -6, 8);
    plotFrame(ctx, P, 'plate separation', 'log₁₀ |pressure|   (Pa)',
      'the Casimir pressure over five decades — an exact power law');
    plotTicksX(ctx, P, [-9, -8, -7, -6, -5],
               v => fmtNum(Math.pow(10, v) * 1e9, 3) + ' nm');
    rlYTicks(ctx, P, [-6, -3, 0, 3, 6, 8]);
    plotCurve(ctx, P, L => Math.log10(Math.abs(wsCasimirPressure(Math.pow(10, L)))),
              240, rgbCss(TH.curl), 2.4);
    /* one atmosphere, for a sense of scale */
    rlSegment(ctx, P.px, P.Y(Math.log10(101325)), P.px + P.pw, P.Y(Math.log10(101325)),
              rgbCss(TH.accent, 0.75), 1.4, [5, 4]);
    rlText(ctx, P.px + 8, P.Y(Math.log10(101325)) - 9, 'one atmosphere',
           rgbCss(TH.accent), '10px ' + FONT_MONO);
    /* the band where the experiments actually sit */
    ctx.fillStyle = rgbCss(TH.pos, 0.10);
    ctx.fillRect(P.X(Math.log10(6e-8)), P.py, P.X(Math.log10(1e-6)) - P.X(Math.log10(6e-8)), P.ph);
    rlText(ctx, P.X(Math.log10(2.5e-7)), P.py + P.ph - 30, 'where it has been measured',
           rgbCss(TH.pos), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, P.X(Math.log10(2.5e-7)), P.py + P.ph - 16, 'to better than 0.2%',
           rgbCss(TH.pos), '10.5px ' + FONT_UI, 'center');
    const L = Math.log10(st.d);
    rlDot(ctx, P.X(L), P.Y(Math.log10(Math.abs(wsCasimirPressure(st.d)))), 5, rgbCss(TH.pos));
    rlSegment(ctx, P.X(L), P.py, P.X(L), P.py + P.ph, rgbCss(TH.pos, 0.5), 1.2, [3, 3]);
    stageNote(ctx, 'the 240 in the denominator is 12 × 20, and that 12 is the 12 of ζ(−1) = −1/12', W, H);
  },
  readout(st){
    const P = wsCasimirPressure(st.d);
    const F = wsCasimirForce(st.d, st.area);
    const E = wsCasimirEnergyArea(st.d);
    return `<div class="card tight"><div class="ttl">At ${fmtNum(st.d * 1e9, 4)} nm</div>
      ${kv('energy per unit area', fmtNum(E, 5) + ' J/m²')}
      ${kv('pressure', fmtNum(P, 5) + ' Pa')}
      ${kv('  as a fraction of an atmosphere', fmtNum(Math.abs(P) / 101325, 5))}
      ${kv('force on ' + fmtNum(st.area * 1e6, 4) + ' mm²', fmtNum(F, 5) + ' N')}
      ${kv('  equivalent weight', fmtNum(Math.abs(F) / 9.80665 * 1e9, 5) + ' ng')}
      ${kv('sign', 'negative — the plates are pulled together')}
      <p class="help">Halve the separation and the pressure goes up sixteenfold. That is what makes this a
      nuisance in microelectromechanical systems: at the gaps used in a MEMS switch the Casimir attraction is
      strong enough to snap the moving element permanently against its neighbour, a failure mode called
      stiction, and it has to be designed around.</p>
    </div>
    <div class="card tight"><div class="ttl">Where the number comes from</div>
      ${kv('the mode sum', 'Σ n  —  divergent')}
      ${kv('regularised', 'ζ(−1) = −1/12')}
      ${kv('cutoff-dependent piece', 'removed: it is the energy with no plates at all')}
      ${kv('remainder', 'π²ħc/720d³ per unit area')}
      ${kv('  the 720', '= 12 × 60')}
      ${kv('  the 240 in the pressure', '= 12 × 20')}
      <p class="help">Every appearance of a 12 traces back to the same ζ(−1). Had the regularisation been an
      arbitrary choice, the coefficient would have come out different and the experiment would have said so.
      Instead the ideal formula matches to within the few percent that finite conductivity, surface
      roughness and finite temperature account for, and modern measurements agree at the 0.2% level once
      those corrections are applied.</p>
    </div>
    <div class="card tight"><div class="ttl">And what this does not show</div>
      ${kv('does it test string theory', 'no')}
      ${kv('does it test the regularisation', 'yes, to better than a percent')}
      ${kv('the same procedure gives', 'a = (D−2)/24, and hence D = 26')}
      <p class="help">This stage exists to close off one specific objection and no more. The step in the
      critical-dimension calculation that looks like an abuse of arithmetic is the step this experiment
      validates. Everything else about the theory remains untested — but this particular move is not where
      the doubt should be spent.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">Casimir</div>
      <div style="color:var(--c-curl)">P = ${fmtNum(wsCasimirPressure(st.d), 4)} Pa</div>
      <div style="color:var(--c-pos)">d = ${fmtNum(st.d * 1e9, 4)} nm</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the allowed modes, and the pressure law'],
                    ['var(--c-grad)', 'the mirrors'],
                    ['var(--c-pos)',  'your separation, and the measured band'],
                    ['var(--accent)', 'one atmosphere, for scale']]; }
};

/* ============================================================================
   6 · A COMPACT DIMENSION, AND THE SHORTEST DISTANCE THERE IS
   ============================================================================ */
STAGES.wsCircle = {
  title: 'Kaluza–Klein, winding, and T-duality',
  dockLegend: true,
  derive(st){
    const chk = wsTDualityCheck(st.n, st.w, st.N, st.Nb, st.R, st.ap);
    return {
      title:'What happens to a string when one direction closes into a circle',
      steps:[
        drvSay('a point particle can only do one thing',
          'Wrap a dimension into a circle of radius R and momentum around it is quantised: p = n/R. A tower of copies of every particle appears, spaced by 1/R. Make R small and the tower gets heavy and drops out, which is Kaluza and Klein\'s 1920s answer to why we do not see the fifth dimension.'),
        drvStep('the momentum tower',
          `${dv('m')}_n ${dop('=')} ${dfrac(dv('n'), dv('R'))}`,
          `n = ${st.n} gives ${fmtNum(wsKKMass(st.n, st.R), 5)} in units where α′ = ${fmtNum(st.ap, 3)}`),
        drvSay('a string can do something a particle cannot',
          'It can wrap. A string wound w times round the circle cannot unwind without breaking, so w is conserved, and the energy of those wraps is the tension times the length: wR/α′. Nothing in point-particle physics has this quantum number.'),
        drvStep('the winding tower, which runs the other way',
          `${dv('m')}_w ${dop('=')} ${dfrac(dv('w') + dv('R'), 'α′')}`,
          `w = ${st.w} gives ${fmtNum(wsWindMass(st.w, st.R, st.ap), 5)} — heavy when R is large, light when R is small`),
        drvStep('so the full spectrum is',
          `${dv('M')}² ${dop('=')} (${dfrac(dv('n'), dv('R'))})² ${dop('+')} (${dfrac(dv('w') + dv('R'), 'α′')})² ${dop('+')} ${dfrac('2', 'α′')}(${dv('N')} ${dop('+')} ${dv('N')}̄ ${dop('−')} 2)`,
          `M² = ${fmtNum(chk.m2a, 6)} for the state on this stage`),
        drvStep('with a constraint tying the two sides together',
          `${dv('N')} ${dop('−')} ${dv('N')}̄ ${dop('=')} ${dv('n')}${dv('w')}`,
          chk.gap !== undefined && (st.N - st.Nb) === st.n * st.w
            ? 'satisfied — this is a state in the theory'
            : 'NOT satisfied — the level-matching condition fails, so this combination is not a physical state'),
        drvSay('now look at what the formula is symmetric under',
          'Exchange n with w and simultaneously send R to α′/R, and the first two terms swap places while the third is untouched. The spectrum is identical. Not approximately — identically.'),
        drvStep('the check, run on your own numbers',
          `${dv('M')}²(${dv('n')},${dv('w')},${dv('R')}) ${dop('=')} ${dv('M')}²(${dv('w')},${dv('n')},α′/${dv('R')})`,
          `${fmtNum(chk.m2a, 10)} against ${fmtNum(chk.m2b, 10)} — they differ by ${fmtAgree(chk.m2a, chk.m2b)}`),
        drvSay('so there is no such thing as a circle smaller than √α′',
          'A circle of radius R/10 is the SAME physics as a circle of radius 10R described in the other variables. Shrinking past the self-dual radius √α′ does not produce a smaller space; it produces the same space again, with the labels on the two towers exchanged. Whatever a string measures distance with, it stops resolving below √α′ — which is a very different statement from "we have not looked yet".'),
        drvSay('and the duality survives interactions',
          'This is not just a coincidence in the free spectrum. T-duality holds order by order in perturbation theory and maps type IIA to type IIB, and the two heterotic theories to each other. It is one of the links in the duality web that made the five string theories one theory in the mid-1990s.')
      ],
      note:'The self-dual radius √α′ is where the KK tower and the winding tower cross. At exactly that radius extra states become massless and the gauge symmetry of the compactified theory is enhanced — a genuinely stringy phenomenon with no field-theory counterpart.'
    };
  },
  enter(st, o){
    st.ap = o.ap === undefined ? 1 : o.ap;
    st.R  = o.R === undefined ? 1.6 : o.R;
    st.n  = o.n === undefined ? 1 : o.n;
    st.w  = o.w === undefined ? 1 : o.w;
    st.N  = o.N === undefined ? 1 : o.N;
    st.Nb = o.Nb === undefined ? 0 : o.Nb;
  },
  controls(){
    const st = ST;
    return ctlRow('radius R', ctlSlider('wsCiR', 0.12, 8, 0.01, st.R)) +
      ctlRow('momentum n', ctlSlider('wsCiN', -4, 4, 1, st.n)) +
      ctlRow('winding w', ctlSlider('wsCiW', -4, 4, 1, st.w)) +
      ctlRow('level N', ctlSlider('wsCiL', 0, 6, 1, st.N)) +
      ctlRow('level N̄', ctlSlider('wsCiB', 0, 6, 1, st.Nb)) +
      `<p class="help">Units are α′ = 1, so the self-dual radius is R = 1. Move R and watch the two towers
      slide past each other in opposite directions: momentum states get lighter as the circle grows, winding
      states get heavier. At R = 1 they cross, and beyond it the roles have simply swapped. The panel
      computes the mass at R and at α′/R with n and w exchanged and prints the difference — which is zero,
      to the last digit the arithmetic allows.</p>`;
  },
  wire(){
    wireSlider('wsCiR', () => ST.R, v => { ST.R = v; },
               v => 'R = ' + fmtNum(+v, 4) + ' √α′   ·   dual R = ' + fmtNum(ST.ap / (+v), 4));
    wireSlider('wsCiN', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
    wireSlider('wsCiW', () => ST.w, v => { ST.w = Math.round(v); }, v => 'w = ' + Math.round(v));
    wireSlider('wsCiL', () => ST.N, v => { ST.N = Math.round(v); }, v => 'N = ' + Math.round(v));
    wireSlider('wsCiB', () => ST.Nb, v => { ST.Nb = Math.round(v); }, v => 'N̄ = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    /* left: the cylinder, with a wound string on it */
    const cx = W * 0.20, cy = H * 0.44, rr = Math.min(W * 0.075, 74), len = Math.min(W * 0.16, 190);
    wsTitle(ctx, cx, cy - rr - 52, 'one direction rolled into a circle of radius R', TH.grad);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1.2;
    for(const dx of [-len / 2, len / 2]){
      ctx.beginPath(); ctx.ellipse(cx + dx, cy, rr * 0.36, rr, 0, 0, 6.2832); ctx.stroke();
    }
    rlSegment(ctx, cx - len / 2, cy - rr, cx + len / 2, cy - rr, rgbCss(TH.line2), 1.2);
    rlSegment(ctx, cx - len / 2, cy + rr, cx + len / 2, cy + rr, rgbCss(TH.line2), 1.2);
    /* the wound string: |w| turns as it advances along the cylinder */
    const turns = Math.max(1, Math.abs(st.w));
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for(let i = 0; i <= 400; i++){
      const u = i / 400;
      const th = 2 * Math.PI * turns * u * Math.sign(st.w || 1) + st.t * 0.9;
      const x = cx - len / 2 + len * u + rr * 0.36 * Math.sin(th);
      const y = cy + rr * Math.cos(th);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    wsSub(ctx, cx, cy + rr + 26, st.w === 0 ? 'w = 0 — this string is not wrapped'
                                            : 'wound ' + Math.abs(st.w) + '× — it cannot come off without breaking');
    wsSub(ctx, cx, cy + rr + 42, 'and it carries n = ' + st.n + ' unit' + (Math.abs(st.n) === 1 ? '' : 's') + ' of momentum round the circle');

    /* right: the two towers against R, on a log axis, crossing at √α′ */
    const P = mkPlot(W * 0.42, 50, W * 0.52, H - 128,
                     Math.log10(0.12), Math.log10(8), -1.1, 1.1);
    plotFrame(ctx, P, 'radius R   (units of √α′)', 'log₁₀ mass',
      'momentum falls, winding rises — and they cross at the self-dual radius');
    plotTicksX(ctx, P, [Math.log10(0.125), Math.log10(0.5), 0, Math.log10(2), Math.log10(8)],
               v => fmtNum(Math.pow(10, v), 3));
    rlYTicks(ctx, P, [-1, -0.5, 0, 0.5, 1]);
    for(let k = 1; k <= 3; k++){
      plotCurve(ctx, P, L => Math.log10(wsKKMass(k, Math.pow(10, L))), 200,
                rgbCss(TH.curl, 1 - 0.22 * (k - 1)), k === 1 ? 2.4 : 1.5);
      plotCurve(ctx, P, L => Math.log10(wsWindMass(k, Math.pow(10, L), st.ap)), 200,
                rgbCss(TH.grad, 1 - 0.22 * (k - 1)), k === 1 ? 2.4 : 1.5);
    }
    const Rsd = wsSelfDualR(st.ap);
    rlSegment(ctx, P.X(Math.log10(Rsd)), P.py, P.X(Math.log10(Rsd)), P.py + P.ph,
              rgbCss(TH.accent), 1.8, [5, 4]);
    rlText(ctx, P.X(Math.log10(Rsd)), P.py + 16, 'R = √α′',
           rgbCss(TH.accent), '600 11px ' + FONT_MONO, 'center');
    rlText(ctx, P.X(Math.log10(0.3)), P.py + 34, 'winding states', rgbCss(TH.grad), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, P.X(Math.log10(4)), P.py + 34, 'momentum states', rgbCss(TH.curl), '10.5px ' + FONT_UI, 'center');
    /* the reader's radius and its dual, marked as the pair they are */
    const Rd = wsTDual(st.R, st.ap);
    for(const [Rv, col, lab] of [[st.R, TH.pos, 'your R'], [Rd, TH.warn, 'its dual α′/R']]){
      const L = Math.log10(Math.max(0.12, Math.min(8, Rv)));
      rlSegment(ctx, P.X(L), P.py, P.X(L), P.py + P.ph, rgbCss(col, 0.7), 1.5, [3, 3]);
      rlText(ctx, P.X(L), P.py + P.ph - 12, lab + ' = ' + fmtNum(Rv, 3),
             rgbCss(col), '10px ' + FONT_MONO, 'center');
    }
    /* the arithmetic, printed where it can be read */
    const chk = wsTDualityCheck(st.n, st.w, st.N, st.Nb, st.R, st.ap);
    const bx = P.px + 14, by = P.py + P.ph - 84;
    wsNum(ctx, bx, by,      'M² at R', fmtNum(chk.m2a, 8), TH.pos);
    wsNum(ctx, bx, by + 17, 'M² at α′/R, n ↔ w', fmtNum(chk.m2b, 8), TH.warn);
    wsNum(ctx, bx, by + 34, 'difference', fmtAgreeTight(chk.m2a, chk.m2b), TH.accent);
    stageNote(ctx, 'shrinking the circle past √α′ does not make a smaller space — it makes the same space again', W, H);
  },
  readout(st){
    const s = wsCircleSpectrum(st.n, st.w, st.N, st.Nb, st.R, st.ap);
    const chk = wsTDualityCheck(st.n, st.w, st.N, st.Nb, st.R, st.ap);
    const Rd = wsTDual(st.R, st.ap);
    return `<div class="card tight"><div class="ttl">This state</div>
      ${kv('radius R', fmtNum(st.R, 5) + ' √α′')}
      ${kv('momentum contribution n/R', fmtNum(s.kk, 6))}
      ${kv('winding contribution wR/α′', fmtNum(s.wind, 6))}
      ${kv('oscillators N, N̄', st.N + ',  ' + st.Nb)}
      ${kv('M²', fmtNum(s.m2, 6))}
      ${kv('level matching N − N̄ = nw', s.matched
            ? 'satisfied — this is a physical state'
            : 'FAILS: ' + (st.N - st.Nb) + ' ≠ ' + (st.n * st.w) + ', so no such state exists')}
      <p class="help">Level matching is not a technicality. A closed string has no marked point, so nothing
      distinguishes one place on it from another; the operator that rotates it must therefore annihilate
      every physical state, and that condition is exactly N − N̄ = nw. Combinations that fail it are not
      heavy states — they are not states.</p>
    </div>
    <div class="card tight"><div class="ttl">The duality, checked</div>
      ${kv('M² at R = ' + fmtNum(st.R, 4), fmtNum(chk.m2a, 12))}
      ${kv('M² at α′/R = ' + fmtNum(Rd, 4) + ', with n ↔ w', fmtNum(chk.m2b, 12))}
      ${kv('difference', fmtAgree(chk.m2a, chk.m2b))}
      ${kv('self-dual radius √α′', fmtNum(wsSelfDualR(st.ap), 6))}
      ${kv('are you above or below it', st.R > wsSelfDualR(st.ap) ? 'above — momentum states are the light ones'
                                                                  : st.R < wsSelfDualR(st.ap) ? 'below — winding states are the light ones'
                                                                  : 'exactly on it — the two towers coincide')}
      <p class="help">Both numbers are computed from the same formula with different arguments; neither is
      copied from the other. Slide R anywhere, set n and w to anything, and the difference stays at the level
      of floating-point noise. That is what an exact symmetry looks like when you test it rather than
      quote it.</p>
    </div>
    <div class="card tight"><div class="ttl">What this rules out</div>
      ${kv('a circle of radius R/10', 'the same theory as radius 10R')}
      ${kv('the shortest resolvable length', '√α′, and not by convention')}
      ${kv('what T-duality maps', 'IIA ⟷ IIB, and the two heterotic theories to each other')}
      ${kv('at R = √α′ exactly', 'extra states go massless and the gauge symmetry enhances')}
      <p class="help">Geometry stops being fundamental here. Two different-looking spacetimes turn out to be
      the same physics, which means the metric is not the deepest description of what is going on — it is a
      variable that different observers of the same theory may disagree about. Mirror symmetry, in the
      Calabi–Yau stage further on, is the same lesson in six dimensions rather than one, and it has been
      productive enough that it now solves problems in pure mathematics.</p>
    </div>`;
  },
  chip(st){
    const s = wsCircleSpectrum(st.n, st.w, st.N, st.Nb, st.R, st.ap);
    return `<div class="k">Compact circle</div>
      <div style="color:var(--c-pos)">R = ${fmtNum(st.R, 4)} √α′</div>
      <div style="color:var(--c-curl)">M² = ${fmtNum(s.m2, 4)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the momentum (Kaluza–Klein) tower'],
                    ['var(--c-grad)', 'the winding tower, and the wrapped string'],
                    ['var(--accent)', 'the self-dual radius √α′, and the difference between the two masses'],
                    ['var(--c-pos)',  'your radius'],
                    ['var(--c-warn)', 'its dual, which is the same physics']]; }
};
