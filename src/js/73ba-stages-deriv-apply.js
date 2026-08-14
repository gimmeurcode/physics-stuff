/* ============================================================================
   
4ma - APPLICATIONS OF THE DERIVATIVE
   Split out of 
73b-stages-deriv.js
 to keep each file under the ~600-line guidance
   in src/js/CLAUDE.md. Load order is unchanged: this file sorts immediately
   after its parent, and everything shares one script scope.
   ============================================================================ */


/* ---- 5 · applications: rates, optimisation, Newton, L'Hôpital ------------- */
STAGES.clApply = {
  title:'Applications of the derivative',
  derive(st){
    const n = v => fmtNum(v, 6);
    if(st.mode === 'newton'){
      const F = st.F;
      return {
        title:'Newton\'s method is one Taylor term, solved',
        steps:[
          drvSay('the honest starting point: we cannot solve it',
            'There is no formula for the root of x³ − 2x − 5. What we can always do is solve a straight line. So replace the function by the straight line that best matches it near the current guess, solve that instead, and hope the answer is closer.'),
          drvStep('the tangent line at the current guess',
            `${dv('L')}(${dv('x')}) ${dop('=')} ${dv('f')}(${dv('x')}ₙ) ${dop('+')} ${dv('f')}′(${dv('x')}ₙ)(${dv('x')} ${dop('−')} ${dv('x')}ₙ)`,
            `at x₀ = ${n(st.x0)}: f = ${n(F.f(st.x0))}, f′ = ${n(F.d1(st.x0))}`),
          drvStep('set it to zero and solve — that is the whole method',
            `${dv('x')}ₙ₊₁ ${dop('=')} ${dv('x')}ₙ ${dop('−')} ${dfrac(dv('f') + '(' + dv('x') + 'ₙ)', dv('f') + '′(' + dv('x') + 'ₙ)')}`,
            `first step lands at ${n(st.x0 - F.f(st.x0) / F.d1(st.x0))}`),
          drvSay('why the error squares rather than merely shrinks',
            'Taylor says f(x*) = f(xₙ) + f′(xₙ)eₙ + ½f″(ξ)eₙ², and f(x*) = 0. Newton solves that equation with the last term thrown away — so the error left over is exactly the term thrown away. The new error is proportional to the square of the old one, which is why the number of correct digits doubles each step.'),
          drvStep('the error recurrence, from that expansion',
            `${dv('e')}ₙ₊₁ ${dop('=')} ${dfrac(dv('f') + '″(ξ)', '2' + dv('f') + '′')} ${dv('e')}ₙ²`,
            'the panel measures the ratio eₙ₊₁/eₙ² and it settles on a constant — that is the order, observed'),
          drvSay('and the same formula contains the warnings',
            'If f′ is small near the root the constant is huge and convergence is poor. If the starting guess is far away the Taylor expansion is worthless and the iteration can run off entirely — the stage shows exactly that on arctan x. Quadratic convergence is a local promise, not a guarantee, which is why serious solvers bracket first and switch to Newton only once close.')
        ],
        note:'This is the numerical-methods wing\'s root finder seen from the calculus side. Bisection halves the error and can never fail; Newton squares it and sometimes does. That trade — speed against robustness — recurs throughout numerical analysis.'
      };
    }
    if(st.mode === 'optim'){
      return {
        title:'From a picture to a function of one variable',
        steps:[
          drvSay('the modelling is the hard part, not the calculus',
            'Cut a square of side x from each corner of an L × L sheet and fold up the sides. Every step after "write the volume as a function of x alone" is mechanical; getting to that point is where the thinking is.'),
          drvStep('write the quantity to be maximised',
            `${dv('V')}(${dv('x')}) ${dop('=')} ${dv('x')}(${dv('L')} ${dop('−')} 2${dv('x')})²`,
            'height x, and a square base whose side lost x from each end'),
          drvStep('state the interval the problem actually lives on',
            `0 ${dop('≤')} ${dv('x')} ${dop('≤')} ${dv('L')}/2`,
            'beyond L/2 the base has negative side length and the model is meaningless'),
          drvSay('this constraint is not bookkeeping',
            'The Extreme Value Theorem needs a closed bounded interval to promise a maximum at all, and the candidates method needs it to know which endpoints to test. A stationary point outside the feasible range is not an answer, however cleanly it solves the equation.'),
          drvStep('expand, so it can be differentiated by the power rule',
            `${dv('V')} ${dop('=')} 4${dv('x')}³ ${dop('−')} 4${dv('L')}${dv('x')}² ${dop('+')} ${dv('L')}²${dv('x')}`,
            'a cubic — three terms, no product rule needed'),
          drvStep('set the derivative to zero',
            `${dv('V')}′ ${dop('=')} 12${dv('x')}² ${dop('−')} 8${dv('L')}${dv('x')} ${dop('+')} ${dv('L')}² ${dop('=')} 0`,
            'a quadratic, so the quadratic formula of the algebra wing finishes it'),
          drvStep('and the feasible root is the answer',
            `${dv('x')}* ${dop('=')} ${dfrac(dv('L'), '6')}`,
            'the other root, L/2, sits at the boundary and gives zero volume'),
          drvSay('check the endpoints, because the theorem told you to',
            'V(0) = 0 and V(L/2) = 0. Both endpoints give a degenerate box, so the interior critical point wins — but that had to be verified, not assumed. The panel evaluates all three and compares.')
        ],
        note:'Notice the answer is a pure fraction of L with no numbers in it. That is characteristic of optimisation problems set up by similarity: the shape of the best box does not depend on how big the sheet is.'
      };
    }
    if(st.mode === 'lhop'){
      return {
        title:'Why 0/0 can be resolved by differentiating top and bottom',
        steps:[
          drvSay('the indeterminate form is not a number',
            '0/0 is not a value that has gone wrong — it is the statement that the limit is not decided by the endpoint values alone. Both parts are heading to zero, and which wins depends on how fast each goes, which is precisely what derivatives measure.'),
          drvStep('expand both parts about the point',
            `${dfrac(dv('f') + '(' + dv('a') + ') + ' + dv('f') + '′(' + dv('a') + ')' + dv('h') + ' + …', dv('g') + '(' + dv('a') + ') + ' + dv('g') + '′(' + dv('a') + ')' + dv('h') + ' + …')}`,
            'a Taylor expansion of numerator and denominator separately'),
          drvStep('the constant terms are what vanished',
            `${dv('f')}(${dv('a')}) ${dop('=')} ${dv('g')}(${dv('a')}) ${dop('=')} 0`,
            'that is what "0/0" was telling us'),
          drvStep('so cancel the common factor h',
            `${dfrac(dv('f') + '′(' + dv('a') + ')' + dv('h') + ' + O(' + dv('h') + '²)', dv('g') + '′(' + dv('a') + ')' + dv('h') + ' + O(' + dv('h') + '²)')} ${dop('→')} ${dfrac(dv('f') + '′(' + dv('a') + ')', dv('g') + '′(' + dv('a') + ')')}`,
            'and the ratio of derivatives is what is left'),
          drvSay('the rule is a comparison of rates, nothing more',
            'Both quantities are racing to zero; the limit is the ratio of their speeds. If those are equal too, differentiate again and compare accelerations. That is why the rule may be applied repeatedly, and why it is useless when the form is not indeterminate — there is no race to compare.'),
          drvSay('and it is routinely misapplied',
            'The rule requires 0/0 or ∞/∞. Applying it to a limit that is merely awkward gives the wrong answer confidently. The stage prints both the naive substitution and what the rule gives, so the difference between "hard to evaluate" and "genuinely indeterminate" stays visible.')
        ],
        note:'The proper proof uses the Cauchy Mean Value Theorem rather than a bare Taylor expansion, because it must work when the derivatives are not continuous. The expansion above is the honest intuition, and it is right whenever the functions are smooth enough to expand.'
      };
    }
    const S = CL_RATES[st.scene];
    return {
      title:'Related rates: differentiate the relationship, not the numbers',
      steps:[
        drvSay('the setup that makes it work',
          'Two quantities are tied together by a geometric fact that is true at every instant. Because it is true at every instant, it can be differentiated with respect to time — and that turns a statement about positions into a statement about speeds.'),
        drvStep('write the constraint that holds for all t',
          S && S.rel ? S.rel : `${dv('x')}² ${dop('+')} ${dv('y')}² ${dop('=')} ${dv('L')}²`,
          S ? S.given + ' is what we are told; a fact of the geometry, with no time in it yet'
            : 'a fact of the geometry, with no time in it yet'),
        drvStep('differentiate both sides with respect to time',
          `${dfrac('d', 'd' + dv('t'))}[ constraint ] ${dop('⇒')} ${dfrac('∂', '∂' + dv('u'))}${dop('·')}${dfrac('d' + dv('u'), 'd' + dv('t'))} summed over every varying ${dv('u')}`,
          'every letter in the constraint is a function of t, so each term needs the chain rule'),
        drvSay('this is the step people skip, and it is the whole method',
          'x is not just a number, it is x(t). Differentiating x² therefore gives 2x·(dx/dt), not 2x. The chain rule is doing all the work: the "related" in related rates is the chain rule connecting one rate to another through a shared variable.'),
        drvStep('solve for the rate you want, then substitute the instant',
          `${dfrac('d(wanted)', 'd' + dv('t'))} ${dop('=')} (geometry at this instant) ${dop('×')} ${dfrac('d(given)', 'd' + dv('t'))}`,
          'the panel evaluates this and checks it against a finite difference of the simulated motion, printing both'),
        drvSay('substituting too early is the classic error',
          'Put the numbers in before differentiating and the varying quantities become constants, whose derivatives are zero — the relationship is destroyed. Differentiate the general relation first; the specific instant is the last thing you use.'),
        drvSay('and the answers are often counter-intuitive',
          'In the ladder problem the top accelerates without bound as the ladder approaches the ground, even though the base moves at constant speed. The algebra says so — the ratio x/y blows up — and the simulation shows it happening. That is worth more than being told the formula.')
      ],
      note:'The panel computes each rate two independent ways: symbolically from the differentiated constraint, and numerically as a finite difference of the actual simulated motion. It prints both and their difference, so the chain-rule result is confirmed rather than trusted.'
    };
  },
  enter(st, o){
    st.mode = o.mode || 'rates';
    st.scene = o.scene || 'ladder';
    st.p = 3;
    st.t = 0;
    st.run = o.run !== false;
    st.newtonSrc = 'x^3-2x-5';
    st.x0 = 3;
    st.F = clBundle(st.newtonSrc);
  },
  controls(){
    const st = ST;
    const seg = ctSeg('clAM', st.mode, [['rates', 'related rates'], ['newton', "Newton's method"],
                                         ['lhop', "L'Hôpital"], ['optim', 'optimisation']]);
    if(st.mode === 'rates'){
      return seg + ctSeg('clAS', st.scene, Object.keys(CL_RATES).map(k => [k, CL_RATES[k].name])) +
        ctlRow('position', ctlSlider('clAp', 0.35, 4.4, 0.01, st.p)) +
        ctChk('clArun', 'run it', st.run) +
        `<p class="help">${CL_RATES[st.scene].note}</p>
        <p class="help">A related-rates problem is the chain rule with the clock hidden inside it.
        Differentiate the geometric constraint with respect to <b>t</b>, and every length that changes
        contributes its own rate. The panel also measures each rate by finite difference on the constraint
        itself, so the analytic answer has something independent to agree with.</p>`;
    }
    if(st.mode === 'newton'){
      return seg + pkSrcSeg('clAN', st.newtonSrc, [['x^3-2x-5', 'x³ − 2x − 5'], ['x^2-2', 'x² − 2'],
                                                 ['cos(x)-x', 'cos x − x'], ['x^3-2x+2', 'x³ − 2x + 2  (a trap)']], 'x^3-x-1') +
        pkSrcBox('clAN', st.newtonSrc, 'f(x) =', 'x') +
        ctlRow('start x₀', ctlSlider('clAx', -3, 3, 0.01, st.x0)) +
        `<p class="help"><b>x<sub>n+1</sub> = x<sub>n</sub> − f(x<sub>n</sub>)/f′(x<sub>n</sub>)</b>: follow
        the tangent line down to the axis and start again. Each step drawn is exactly that construction.
        The convergence is <b>quadratic</b> — the number of correct digits roughly doubles every step,
        which is why the residual column falls off a cliff.</p>
        <p class="help">Choose the last function and start near 0: the iteration falls into a two-cycle and
        never converges. Newton is fast when it works and gives no warning when it does not, which is why
        every serious implementation carries a bisection fallback.</p>`;
    }
    if(st.mode === 'lhop'){
      return seg + `<p class="help">L'Hôpital's rule replaces the limit of a ratio by the limit of the
      ratio of the derivatives — but <i>only</i> for the indeterminate forms 0/0 and ∞/∞. The panel checks
      which form you actually have before applying it, because applying it to 1/2 gives 0/0 and a wrong
      answer with no error message.</p>
      <p class="help">The reason it works is the Mean Value Theorem in its Cauchy form: near a common zero,
      both functions are approximately their own linearisations, and the ratio of two lines through the
      same point is the ratio of their slopes.</p>`;
    }
    return seg + ctlRow('constraint', ctlSlider('clAp', 1, 6, 0.02, st.p)) +
      `<p class="help">The classic box problem: from a square sheet of side <b>${fmtNum(st.p * 2, 3)}</b>,
      cut equal squares from the corners and fold up the sides. The volume is
      <b>V(x) = x(L − 2x)²</b>, and the maximum is where V′ = 0 with V″ &lt; 0 — found here by root-finding
      on the symbolic derivative rather than by quoting L/6.</p>
      <p class="help">Every optimisation problem has the same three steps: write the quantity in terms of
      one variable using the constraint, find the critical points on the <i>feasible interval</i>, and
      compare — including the endpoints, where the volume is zero and the box is either flat or has no
      base at all.</p>`;
  },
  wire(){
    ctWireSeg('clAM', v => { ST.mode = v; });
    ctWireSeg('clAS', v => { ST.scene = v; ST.p = 3; });
    ctWireSeg('clAN', v => { ST.newtonSrc = v; ST.F = clBundle(v); });
    pkSrcWire('clAN', ST.newtonSrc, v => { ST.newtonSrc = v; ST.F = clBundle(v); });
    wireSlider('clAp', () => ST.p, v => { ST.p = v; ST.run = false; }, v => fmtNum(+v, 3));
    wireSlider('clAx', () => ST.x0, v => { ST.x0 = v; }, v => fmtNum(+v, 3));
    ctWireChk('clArun', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    if(st.mode === 'newton') return this.frameNewton(st, dt, ctx, W, H);
    if(st.mode === 'lhop') return this.frameLhop(st, dt, ctx, W, H);
    if(st.mode === 'optim') return this.frameOptim(st, dt, ctx, W, H);
    /* related rates: draw the geometry, live */
    const S = CL_RATES[st.scene];
    if(st.run){ st.p += dt * 0.5; if(st.p > 4.4) st.p = 0.35; }
    const P = ctBox(W, H, 2.5, 2.5, 3.4);
    ctGrid(ctx, P);
    ctFrame(ctx, P, S.name + '   —   ' + S.given);
    if(st.scene === 'ladder'){
      const x = Math.min(4.9, st.p), s = S.state(x, S.L);
      ctPath(ctx, P, [{ x:0, y:0 }, { x:0, y:5.4 }], rgbCss(TH.line2), 3);
      ctPath(ctx, P, [{ x:-0.4, y:0 }, { x:5.6, y:0 }], rgbCss(TH.line2), 3);
      ctPath(ctx, P, [{ x:s.x, y:0 }, { x:0, y:s.y }], rgbCss(TH.grad), 4);
      ctDot(ctx, P, s.x, 0, 6, rgbCss(TH.warn), rgbCss(TH.bg));
      ctDot(ctx, P, 0, s.y, 6, rgbCss(TH.curl), rgbCss(TH.bg));
      const r = S.rate(x, S.L, 0.6);
      ctArrow(ctx, P, s.x, 0, s.x + 0.6 * 0.7, 0, rgbCss(TH.warn), 2.4, "x′");
      ctArrow(ctx, P, 0, s.y, 0, s.y + r.yd * 0.7, rgbCss(TH.curl), 2.4, "y′");
    } else if(st.scene === 'cone'){
      const h = Math.min(3.9, st.p), s = S.state(h, S.R, S.H);
      ctPath(ctx, P, [{ x:-S.R, y:S.H }, { x:0, y:0 }, { x:S.R, y:S.H }], rgbCss(TH.line2), 3);
      ctFill(ctx, P, [{ x:-s.r, y:h }, { x:0, y:0 }, { x:s.r, y:h }], rgbCss(TH.grad, 0.4));
      ctPath(ctx, P, [{ x:-s.r, y:h }, { x:s.r, y:h }], rgbCss(TH.curl), 2.6);
      const r = S.rate(h, S.R, S.H, 2);
      ctArrow(ctx, P, 0, h, 0, h + Math.min(1.5, r.hd) * 0.6, rgbCss(TH.warn), 2.4, "h′");
    } else if(st.scene === 'balloon'){
      const r0 = Math.min(3, st.p), s = S.state(r0);
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(P.X(2.5), P.Y(2.5), r0 * P.u, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = rgbCss(TH.grad, 0.14); ctx.fill();
      const rt = S.rate(r0, 0, 0, 4);
      ctArrow(ctx, P, 2.5, 2.5, 2.5 + r0, 2.5, rgbCss(TH.curl), 2.2, 'r');
      ctArrow(ctx, P, 2.5 + r0, 2.5, 2.5 + r0 + Math.min(1, rt.rd * 3), 2.5, rgbCss(TH.warn), 2.4, "r′");
    } else {
      const x = Math.max(0.4, st.p), s = S.state(x, S.H, S.h);
      ctPath(ctx, P, [{ x:-0.6, y:0 }, { x:6, y:0 }], rgbCss(TH.line2), 3);
      ctPath(ctx, P, [{ x:0, y:0 }, { x:0, y:S.H }], rgbCss(TH.warn), 3);
      ctDot(ctx, P, 0, S.H, 7, rgbCss(TH.warn), rgbCss(TH.bg));
      ctPath(ctx, P, [{ x:s.x, y:0 }, { x:s.x, y:S.h }], rgbCss(TH.grad), 4);
      ctPath(ctx, P, [{ x:0, y:S.H }, { x:s.tip, y:0 }], rgbCss(TH.faint), 1.4, [4, 4]);
      ctPath(ctx, P, [{ x:s.x, y:0.03 }, { x:s.tip, y:0.03 }], rgbCss(TH.curl), 4);
    }
    stageNote(ctx, 'the drawn arrows are the rates the panel computes — they scale with the answer', W, H);
  },
  frameNewton(st, dt, ctx, W, H){
    const F = st.F;
    const N = clNewton(F.f, F.d1, st.x0, 10);
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i <= 300; i++){
      const v = F.f(-3.4 + 6.8 * i / 300);
      if(Number.isFinite(v) && Math.abs(v) < 40){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    const P = mkPlot(76, 46, W - 124, H - 134, -3.4, 3.4, lo - 2, hi + 2);
    plotFrame(ctx, P, 'x', 'f(x)', "Newton's method — follow the tangent to the axis, repeat");
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [-3, -1.5, 0, 1.5, 3], v => fmtNum(v, 2));
    plotCurve(ctx, P, F.f, 900, rgbCss(TH.grad), 2.4);
    N.path.forEach((x, i) => {
      if(i >= N.path.length - 1) return;
      const y = F.f(x);
      if(!Number.isFinite(y)) return;
      const t = i / Math.max(1, N.path.length - 2);
      const col = rgbCss(rampSeq(t), 0.95);
      ctx.strokeStyle = col; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(P.X(x), P.Y(0)); ctx.lineTo(P.X(x), P.Y(y)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P.X(x), P.Y(y)); ctx.lineTo(P.X(N.path[i + 1]), P.Y(0)); ctx.stroke();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(P.X(x), P.Y(0), 3.4, 0, 6.2832); ctx.fill();
    });
    ctDot(ctx, P, N.root, 0, 7, rgbCss(TH.curl), rgbCss(TH.bg));
    stageNote(ctx, 'each step drops from the curve along its tangent — colour runs from the start to the root', W, H);
  },
  frameLhop(st, dt, ctx, W, H){
    const cases = this.lhopCases();
    const C = cases[st.scene] || cases.sinc;
    const P = mkPlot(76, 46, W - 124, H - 134, C.a - 1.6, C.a + 1.6, C.lo, C.hi);
    plotFrame(ctx, P, 'x', '', C.name);
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [C.a - 1.5, C.a, C.a + 1.5], v => fmtNum(v, 3));
    plotCurve(ctx, P, C.num, 700, rgbCss(TH.pos, 0.8), 1.8);
    plotCurve(ctx, P, C.den, 700, rgbCss(TH.neg, 0.8), 1.8);
    plotCurve(ctx, P, x => C.num(x) / C.den(x), 900, rgbCss(TH.grad), 2.6);
    const L = clLHopital(C.num, C.den, C.dnum, C.dden, C.a);
    if(Number.isFinite(L.ratio)){
      ctx.strokeStyle = rgbCss(TH.warn, 0.85); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(P.px, P.Y(L.ratio)); ctx.lineTo(P.px + P.pw, P.Y(L.ratio)); ctx.stroke();
      ctx.setLineDash([]);
    }
    probeLine(ctx, P, C.a, 'a');
    stageNote(ctx, 'green: the numerator · blue: the denominator · dark: their ratio, which stays finite', W, H);
  },
  lhopCases(){
    return {
      sinc:  { name:'sin x / x  at 0', a:0, lo:-1.4, hi:1.8,
        num:Math.sin, den:x => x, dnum:Math.cos, dden:() => 1 },
      expm:  { name:'(eˣ − 1) / x  at 0', a:0, lo:-1.4, hi:2.6,
        num:x => Math.exp(x) - 1, den:x => x, dnum:Math.exp, dden:() => 1 },
      cos:   { name:'(1 − cos x) / x²  at 0', a:0, lo:-0.6, hi:1.4,
        num:x => 1 - Math.cos(x), den:x => x * x, dnum:Math.sin, dden:x => 2 * x },
      log:   { name:'ln x / (x − 1)  at 1', a:1, lo:-0.6, hi:2.2,
        num:Math.log, den:x => x - 1, dnum:x => 1 / x, dden:() => 1 }
    };
  },
  frameOptim(st, dt, ctx, W, H){
    const L = st.p * 2;
    const V = x => x * Math.pow(L - 2 * x, 2);
    const dV = x => Math.pow(L - 2 * x, 2) - 4 * x * (L - 2 * x);
    const best = nqRoots(dV, 0.001, L / 2 - 0.001, 900)[0];
    let hi = 0;
    for(let i = 0; i <= 200; i++) hi = Math.max(hi, V(L / 2 * i / 200));
    const hp = (H - 150) * 0.55;
    const P = mkPlot(76, 46, W - 124, hp, 0, L / 2, 0, hi * 1.15);
    plotFrame(ctx, P, 'corner cut  x', 'volume V(x)', 'V = x(L − 2x)²   on the feasible interval');
    plotTicksX(ctx, P, [0, L / 4, L / 2], v => fmtNum(v, 3));
    plotCurve(ctx, P, V, 600, rgbCss(TH.grad), 2.6);
    if(Number.isFinite(best)){
      probeLine(ctx, P, best, 'x*');
      ctDot(ctx, P, best, V(best), 7, rgbCss(TH.warn), rgbCss(TH.bg));
    }
    /* the sheet and the folded box, drawn to scale */
    const x = Number.isFinite(best) ? best : L / 6;
    const B = ctBox(W, H - hp - 60, L * 0.62, L * 0.62, L * 0.78, { t:hp + 96, b:34 });
    ctFill(ctx, B, [{ x:0, y:0 }, { x:L, y:0 }, { x:L, y:L }, { x:0, y:L }], rgbCss(TH.grad, 0.14));
    ctPath(ctx, B, [{ x:0, y:0 }, { x:L, y:0 }, { x:L, y:L }, { x:0, y:L }, { x:0, y:0 }], rgbCss(TH.grad), 2);
    for(const [cx, cy] of [[0, 0], [L - x, 0], [0, L - x], [L - x, L - x]]){
      ctFill(ctx, B, [{ x:cx, y:cy }, { x:cx + x, y:cy }, { x:cx + x, y:cy + x }, { x:cx, y:cy + x }],
             rgbCss(TH.neg, 0.34));
      ctPath(ctx, B, [{ x:cx, y:cy }, { x:cx + x, y:cy }, { x:cx + x, y:cy + x }, { x:cx, y:cy + x }, { x:cx, y:cy }],
             rgbCss(TH.neg), 1.4);
    }
    ctPath(ctx, B, [{ x:x, y:x }, { x:L - x, y:x }, { x:L - x, y:L - x }, { x:x, y:L - x }, { x:x, y:x }],
           rgbCss(TH.warn), 2.2, [5, 4]);
    stageNote(ctx, 'the dashed square is the base of the folded box — the corners cut away are shaded', W, H);
  },
  readout(st){
    if(st.mode === 'newton'){
      const F = st.F, N = clNewton(F.f, F.d1, st.x0, 10);
      const rows = N.path.map((x, i) => kv('x' + i, fmtNum(x, 12) + '   |f| = ' + fmtNum(Math.abs(F.f(x)), 3)));
      const converged = N.residual < 1e-10;
      return `<div class="card tight"><div class="ttl">The iteration</div>
        ${rows.join('')}
        ${kv('root', converged ? fmtNum(N.root, 12) : 'did not converge')}
        ${kv('residual |f(root)|', fmtGap(N.residual, N.residScale))}
      </div>
      <div class="card tight"><div class="ttl">Quadratic convergence</div>
        ${N.path.slice(0, -1).map((x, i) => {
          const e0 = Math.abs(x - N.root), e1 = Math.abs(N.path[i + 1] - N.root);
          return (e0 > 1e-13 && e1 > 1e-16) ? kv('error ratio e' + (i + 1) + '/e' + i + '²', fmtNum(e1 / (e0 * e0), 4)) : '';
        }).join('')}
        <p class="help">${converged
          ? 'Each error is roughly the square of the last, so the ratio above settles on a constant. That is quadratic convergence, and it is why the number of correct digits doubles per step.'
          : 'This start does not converge. Newton follows a tangent, and if the tangent is nearly flat — or if the iteration lands in a cycle — it can wander off or oscillate forever with no complaint.'}</p>
        <div class="dstep"><div class="lbl">f</div>${texEq(F.ast)}</div>
        <div class="dstep"><div class="lbl">f′</div>${texEq(F.a1)}</div>
      </div>`;
    }
    if(st.mode === 'lhop'){
      const cases = this.lhopCases();
      return `<div class="card tight"><div class="ttl">The four standard forms</div>
        ${Object.keys(cases).map(k => {
          const C = cases[k];
          const L = clLHopital(C.num, C.den, C.dnum, C.dden, C.a);
          return kv(C.name, `${L.form} → ${fmtNum(L.ratio, 6)}`);
        }).join('')}
      </div>
      <div class="card tight"><div class="ttl">The rule, checked</div>
        ${Object.keys(cases).map(k => {
          const C = cases[k];
          const L = clLHopital(C.num, C.den, C.dnum, C.dden, C.a);
          return kv(C.name.split(' at')[0] + ' — numerically', fmtNum(L.numeric, 6) +
            (Math.abs(L.numeric - L.ratio) < 1e-4 ? '   ✓' : '   ✗'));
        }).join('')}
        <p class="help">Each row takes the limit twice: once by L'Hôpital, once by marching in numerically.
        They agree — which is the rule working, and not the rule being assumed.</p>
      </div>
      <div class="card tight"><div class="ttl">When it does not apply</div>
        ${(() => { const L = clLHopital(x => x + 1, x => x + 2, () => 1, () => 1, 0);
          return kv('(x+1)/(x+2) at 0', L.form) + kv('the naive value', fmtNum(L.naive, 5)) +
                 kv('what the rule would give', fmtNum(L.ratio, 5)); })()}
        <p class="help">The ratio of the derivatives is 1, and the actual limit is ½. The rule is not
        merely unhelpful here — it is <b>wrong</b>, because the hypothesis was never checked. Always
        confirm the form first.</p>
      </div>`;
    }
    if(st.mode === 'optim'){
      const L = st.p * 2;
      const V = x => x * Math.pow(L - 2 * x, 2);
      const dV = x => Math.pow(L - 2 * x, 2) - 4 * x * (L - 2 * x);
      const d2V = x => -4 * (L - 2 * x) - 4 * (L - 2 * x) + 16 * x;
      const roots = nqRoots(dV, 0.001, L / 2 - 0.001, 1200);
      const best = roots[0];
      return `<div class="card tight"><div class="ttl">The box from a ${fmtNum(L, 4)} × ${fmtNum(L, 4)} sheet</div>
        ${kv('V(x) = x(L − 2x)²', '')}
        ${kv('feasible interval', `0 < x < ${fmtNum(L / 2, 4)}`)}
        ${kv('critical points inside', roots.map(r => fmtNum(r, 6)).join(',  ') || 'none')}
        ${kv('optimum x*', Number.isFinite(best) ? fmtNum(best, 7) : '—')}
        ${kv('and L/6 for comparison', fmtNum(L / 6, 7))}
        ${kv("V″ there", Number.isFinite(best) ? fmtNum(d2V(best), 5) + (d2V(best) < 0 ? '  — a maximum' : '') : '—')}
        ${kv('maximum volume', Number.isFinite(best) ? fmtNum(V(best), 7) : '—')}
      </div>
      <div class="card tight"><div class="ttl">The endpoints matter</div>
        ${kv('V(0)', fmtNum(V(0), 4) + '  — no height, a flat sheet')}
        ${kv('V(L/2)', fmtNum(V(L / 2), 4) + '  — no base left')}
        ${kv('fraction of the sheet used', fmtNum(100 * Math.pow(L - 2 * best, 2) / (L * L), 4) + '%')}
        <p class="help">The answer x* = L/6 is not quoted here — it is found by root-finding on the
        derivative, and the L/6 row is there so the two can be compared. Notice that the optimum uses only
        four ninths of the sheet's area as the base: cutting more makes the box taller but too narrow, and
        cutting less makes it wide but shallow.</p>
      </div>`;
    }
    const S = CL_RATES[st.scene];
    if(st.scene === 'ladder'){
      const x = Math.min(4.9, st.p), s = S.state(x, S.L), r = S.rate(x, S.L, 0.6);
      const h = 1e-5;
      const num = (S.state(x + h, S.L).y - S.state(x - h, S.L).y) / (2 * h) * 0.6;
      return `<div class="card tight"><div class="ttl">The sliding ladder</div>
        ${kv('L', fmtNum(S.L, 4))}${kv('x', fmtNum(s.x, 5))}${kv('y = √(L²−x²)', fmtNum(s.y, 5))}
        ${kv("x′  (given)", '0.6 m/s')}
        ${kv("y′ = −x x′ / y", fmtNum(r.yd, 6) + ' m/s')}
        ${kv('the same, by finite difference', fmtNum(num, 6) + ' m/s')}
        ${kv('difference', fmtAgree(r.yd, num))}
        ${kv('x² + y² − L²', fmtNum(s.x * s.x + s.y * s.y - S.L * S.L, 3))}
      </div>
      <div class="card tight"><div class="ttl">What happens at the end</div>
        ${kv("y′ at x = 4.9", fmtNum(S.rate(4.9, S.L, 0.6).yd, 5) + ' m/s')}
        ${kv("y′ at x = 4.99", fmtNum(S.rate(4.99, S.L, 0.6).yd, 5) + ' m/s')}
        ${kv("y′ at x = 4.999", fmtNum(S.rate(4.999, S.L, 0.6).yd, 5) + ' m/s')}
        <p class="help">The top runs away to infinite speed as the ladder flattens. That is the
        <i>mathematics</i> of a rigid rod whose foot moves at constant speed, and it is a signal that the
        model has stopped describing any real ladder — long before that point the foot would stop being
        driven at 0.6 m/s, or the ladder would leave the wall.</p>
      </div>`;
    }
    if(st.scene === 'cone'){
      const h = Math.min(3.9, Math.max(0.2, st.p)), s = S.state(h, S.R, S.H), r = S.rate(h, S.R, S.H, 2);
      return `<div class="card tight"><div class="ttl">Filling the cone</div>
        ${kv('R, H', `${fmtNum(S.R, 3)}, ${fmtNum(S.H, 3)}`)}
        ${kv('h', fmtNum(h, 5))}${kv('r = Rh/H', fmtNum(s.r, 5))}
        ${kv('V = πr²h/3', fmtNum(s.V, 6))}
        ${kv("dV/dt  (given)", '2 m³/s')}
        ${kv("dh/dt = (dV/dt)/(πr²)", fmtNum(r.hd, 6) + ' m/s')}
        ${kv('at half the depth it would be', fmtNum(S.rate(h / 2, S.R, S.H, 2).hd, 6) + ' m/s')}
        ${kv('ratio', fmtNum(S.rate(h / 2, S.R, S.H, 2).hd / r.hd, 4))}
        <p class="help">Four times faster at half the depth: the level rises as 1/h², because the surface
        area it has to cover grows as h². This is why a conical filter drains quickly at first and then
        seems to take forever.</p>
      </div>`;
    }
    if(st.scene === 'balloon'){
      const r0 = Math.max(0.3, Math.min(3, st.p)), s = S.state(r0), rt = S.rate(r0, 0, 0, 4);
      return `<div class="card tight"><div class="ttl">Inflating the balloon</div>
        ${kv('r', fmtNum(r0, 5))}${kv('V = 4πr³/3', fmtNum(s.V, 6))}${kv('A = 4πr²', fmtNum(s.A, 6))}
        ${kv("dV/dt  (given)", '4 cm³/s')}
        ${kv("dr/dt = (dV/dt)/(4πr²)", fmtNum(rt.rd, 7) + ' cm/s')}
        ${kv("dA/dt = 2(dV/dt)/r", fmtNum(rt.Ad, 6) + ' cm²/s')}
        ${kv('note dV/dr equals A', fmtNum(s.A, 6))}
        <p class="help">That last coincidence is not one: the derivative of the volume with respect to the
        radius <i>is</i> the surface area, because growing by dr adds a shell of thickness dr over the whole
        surface. The same relation makes the derivative of πr² equal to 2πr.</p>
      </div>`;
    }
    const x = Math.max(0.4, st.p), s = S.state(x, S.H, S.h), r = S.rate(x, S.H, S.h, 1.4);
    return `<div class="card tight"><div class="ttl">Walking away from the lamp</div>
      ${kv('lamp height H', fmtNum(S.H, 3))}${kv('person height h', fmtNum(S.h, 3))}
      ${kv('distance x', fmtNum(s.x, 5))}
      ${kv('shadow length s = xh/(H−h)', fmtNum(s.s, 5))}
      ${kv('shadow tip at', fmtNum(s.tip, 5))}
      ${kv("walking speed", '1.4 m/s')}
      ${kv("ds/dt", fmtNum(r.sd, 6) + ' m/s')}
      ${kv("d(tip)/dt", fmtNum(r.tipd, 6) + ' m/s')}
      <p class="help">Both rates are <b>constant</b> — independent of x. The similar-triangle relation is
      linear, so differentiating it gives a constant of proportionality and nothing else. The tip moves
      faster than you do, which is why your shadow always seems to be running ahead.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'newton'){
      const N = clNewton(st.F.f, st.F.d1, st.x0, 10);
      return `<div class="k">Newton</div><div style="color:var(--c-curl)">${fmtNum(N.root, 8)}</div>
        <div>|f| = ${fmtGapTight(N.residual, N.residScale)}</div>`;
    }
    if(st.mode === 'lhop') return `<div class="k">L'Hôpital</div><div>0/0 and ∞/∞ only</div>`;
    if(st.mode === 'optim'){
      const L = st.p * 2;
      const dV = x => Math.pow(L - 2 * x, 2) - 4 * x * (L - 2 * x);
      const b = nqRoots(dV, 0.001, L / 2 - 0.001, 900)[0];
      return `<div class="k">optimum cut</div><div style="color:var(--c-warn)">${fmtNum(b, 6)}</div>`;
    }
    return `<div class="k">${CL_RATES[st.scene].name}</div><div style="color:var(--c-warn)">${CL_RATES[st.scene].given}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the geometry, or f'], ['var(--c-warn)', 'the given rate, or the optimum'],
                    ['var(--c-curl)', 'the rate being found'], ['var(--c-neg)', 'the denominator, or the cut corners']]; },
  dockLegend:true
};
