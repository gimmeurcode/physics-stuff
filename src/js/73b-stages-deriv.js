STAGES.clDeriv = {
  title:'The derivative',
  enter(st, o){
    st.src = o.src || 'x^2';
    st.a = o.a === undefined ? 1 : o.a;
    st.h = o.h === undefined ? 1 : o.h;
    st.run = o.run !== false;
    st.F = clBundle(st.src);
  },
  controls(){
    const st = ST;
    return pkSrcSeg('clDF', st.src, [['x^2','x²'], ['x^3-2x', 'x³ − 2x'], ['sin(x)', 'sin x'],
                                   ['exp(x)', 'eˣ'], ['ln(x)', 'ln x'], ['1/x', '1/x'], ['abs(x)', '|x|']], 'x*sin(x)') +
      pkSrcBox('clDF', st.src, 'f(x) =', 'x') +
      ctlRow('a', ctlSlider('clDa', -2.6, 2.6, 0.02, st.a)) +
      ctlRow('h', ctlSlider('clDh', 0.001, 1.6, 0.001, st.h)) +
      ctChk('clDrun', 'shrink h', st.run) +
      `<p class="help">The <b>difference quotient</b> <b>(f(a+h) − f(a))/h</b> is the slope of the secant
      through two points of the curve. Shrink h and the secant pivots towards the tangent — and the
      derivative is <i>defined</i> as the limit it approaches, when that limit exists.</p>
      <p class="help">The panel shows the quotient for a sequence of halving h, from the right, from the
      left, and symmetrically. The symmetric quotient converges faster (its error is O(h²) rather than
      O(h)) and for a parabola it is exact at every h — a hint that "the derivative" and "the best linear
      fit near a point" are the same idea approached from two directions.</p>
      <p class="help">Choose <b>|x|</b> and put a at 0. The left quotient settles on −1 and the right on
      +1, so the limit does not exist and the function has no derivative there — even though it is
      perfectly continuous. Differentiability is strictly stronger than continuity.</p>`;
  },
  /* The algebra behind the limit, for the case a student meets first. For x²
     the cancellation is exact and can be shown in full; for anything else the
     honest statement is that the same three moves happen and the algebra is
     merely longer, so the ladder says that rather than faking a general one. */
  derive(st){
    const n = v => fmtNum(v, 6);
    const a = st.a, h = st.h;
    const f = st.F && st.F.f ? st.F.f : (x => x * x);
    const q = (f(a + h) - f(a)) / h;
    const isSq = st.src === 'x^2';
    const common = [
      drvStep('start from the definition — this is not a rule, it is what a derivative means',
        `${dv('f')}′(${dv('a')}) ${dop('=')} ${dlim(dv('h'), '0')}${dfrac(dv('f') + '(' + dv('a') + '+' + dv('h') + ') ' + dop('−') + ' ' + dv('f') + '(' + dv('a') + ')', dv('h'))}`,
        `at a = ${n(a)}, h = ${n(h)}:  quotient = ${n(q)}`)
    ];
    if(!isSq){
      return { title:'The difference quotient',
        steps:common.concat([
          drvSay('why the limit is needed at all',
            'Putting h = 0 straight into the quotient gives 0/0, which says nothing. The whole method is to do algebra <em>first</em> — cancel the h that is causing the trouble — and only then let h go to zero. Choose x² above to see that cancellation carried out in full.'),
          /* clBundle returns d1, not d. Reading st.F.d gave undefined, which is
             falsy, so this rung reported f′(a) = 0 for every function except x²
             — and the error column measured the secant against that zero. */
          drvStep('what the limit is here',
            `${dv('f')}′(${dv('a')}) ${dop('=')} ${n(st.F.d1(a))}`,
            `the secant slope at h = ${n(h)} is ${n(q)}, off by ${n(Math.abs(q - st.F.d1(a)))}`),
          drvSay('and the derivative shown was not measured from that quotient',
            'It was obtained by differentiating your function <b>symbolically</b> — the same engine the rest of the laboratory uses — so the two numbers in the line above come from genuinely different routes. That is what makes the error column worth reading: it is a comparison, not a restatement. Halve h and watch it halve, which is the first-order accuracy of a one-sided quotient being measured rather than quoted.'),
          drvSay('why not simply always use the symmetric quotient, then',
            'Because it is accurate to second order and therefore closes in far faster — and because it will happily hand you an answer where none exists. At the corner of |x| the two one-sided limits are −1 and +1, so the symmetric quotient averages them to a confident, entirely fictitious 0. Being more accurate where a derivative exists and silently wrong where it does not is a trade worth making knowingly.')
        ]),
        note:'Halve h and watch that error halve too — the one-sided quotient is accurate to first order in h. The symmetric quotient is accurate to second order, which is why it closes in so much faster.' };
    }
    return {
      title:'The derivative of x², produced by algebra',
      steps:common.concat([
        drvStep('substitute f(x) = x²',
          `${dop('=')} ${dlim(dv('h'), '0')}${dfrac('(' + dv('a') + '+' + dv('h') + ')² ' + dop('−') + ' ' + dv('a') + '²', dv('h'))}`,
          `(${n(a)} + ${n(h)})² − ${n(a)}² = ${n((a + h) * (a + h) - a * a)}`),
        drvStep('expand the square — ordinary algebra, nothing new',
          `${dop('=')} ${dlim(dv('h'), '0')}${dfrac(dv('a') + '² ' + dop('+') + ' 2' + dv('a') + dv('h') + ' ' + dop('+') + ' ' + dv('h') + '² ' + dop('−') + ' ' + dv('a') + '²', dv('h'))}`,
          `= ${n(a * a)} + ${n(2 * a * h)} + ${n(h * h)} − ${n(a * a)}`),
        drvStep('the a² terms cancel',
          `${dop('=')} ${dlim(dv('h'), '0')}${dfrac('2' + dv('a') + dv('h') + ' ' + dop('+') + ' ' + dv('h') + '²', dv('h'))}`,
          `numerator = ${n(2 * a * h + h * h)}`),
        drvSay('and here is the whole point',
          'Every remaining term has a factor of h, so h divides out — and it is legal to divide because h is not yet zero, only heading there. Doing the algebra <em>before</em> taking the limit is what turns an indeterminate 0/0 into something you can evaluate.'),
        drvStep('divide by h',
          `${dop('=')} ${dlim(dv('h'), '0')}(2${dv('a')} ${dop('+')} ${dv('h')})`,
          `= 2(${n(a)}) + ${n(h)} = ${n(2 * a + h)}`),
        drvStep('now let h → 0 — at last, and safely',
          `${dv('f')}′(${dv('a')}) ${dop('=')} 2${dv('a')}`,
          `f′(${n(a)}) = ${n(2 * a)},  and the secant at h = ${n(h)} reads ${n(q)}`),
        drvSay('what the limit is doing, and what it is not',
          'It is not "putting h = 0", which was illegal three lines ago and is still illegal. It is asking what number the quotient approaches, and the answer only means something because the quotient approaches the <b>same</b> number from both sides. Where the two sides disagree — at the corner of |x| — there is no derivative, and the failure is exactly the failure of the limit, not a separate rule about corners.'),
        drvSay('and this is why the power rule is a theorem rather than a pattern',
          'The same expansion works for any whole n: (a+h)ⁿ has aⁿ, then n·aⁿ⁻¹h, then terms in h² and higher. Subtracting aⁿ and dividing by h leaves n·aⁿ⁻¹ plus things that still carry an h, all of which vanish. So the rule "bring the power down and reduce it by one" is the binomial theorem\'s second term, and nothing else. Every derivative rule in the wing has a derivation of this shape underneath it, which is why they are consistent with one another rather than a list to be memorised.'),
        drvSay('and the secant is not merely an approximation to the tangent',
          'Look at what the algebra produced: the quotient is exactly 2a + h, for every h, with no error term hidden anywhere. So the secant slope <i>is</i> the tangent slope plus h — the approximation error is not estimated, it is known, and halving h must halve it. The numerical-methods wing spends a whole stage measuring that first-order behaviour by experiment; here it fell out of two lines of algebra, which is the difference between knowing a rate and observing one.')
      ]),
      note:'Notice the quotient above is exactly 2a + h — so the error in the secant slope <b>is</b> h, and halving h halves it. That is the first-order convergence the readout measures, arrived at algebraically rather than observed and then explained.'
    };
  },
  wire(){
    ctWireSeg('clDF', v => { ST.src = v; ST.F = clBundle(v); });
    pkSrcWire('clDF', ST.src, v => { ST.src = v; ST.F = clBundle(v); });
    wireSlider('clDa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('clDh', () => ST.h, v => { ST.h = v; ST.run = false; const c = $('clDrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    ctWireChk('clDrun', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    const F = st.F;
    if(st.run){ st.h *= Math.pow(0.5, dt * 0.7); if(st.h < 0.002) st.h = 1.6; }
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i <= 300; i++){
      const v = F.f(-2.8 + 5.6 * i / 300);
      if(Number.isFinite(v) && Math.abs(v) < 30){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    if(!Number.isFinite(lo)){ lo = -3; hi = 3; }
    const pad = (hi - lo) * 0.16 + 0.2;
    const hp = (H - 150) * 0.58;
    /* The title says what is happening; the label says what it is happening TO.
       The function here is the reader's — typed or picked — so the picture has
       to carry it, or the only copy is in a control panel below the canvas.
       pkPretty because F.src is the parser's ASCII and must never be shown raw. */
    const P = pvName(mkPlot(76, 46, W - 124, hp, -2.8, 2.8, lo - pad, hi + pad),
                     'f(x) = ' + pkPretty(F.src));
    plotFrame(ctx, P, 'x', 'f(x)', 'the secant pivoting onto the tangent');
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [-2.8, -1.4, 0, 1.4, 2.8], v => fmtNum(v, 2));
    plotCurve(ctx, P, F.f, 900, rgbCss(TH.grad), 2.4);
    const fa = F.f(st.a), fh = F.f(st.a + st.h);
    const sec = (fh - fa) / st.h;
    /* the secant, extended across the frame */
    if(Number.isFinite(sec))
      plotCurve(ctx, P, x => fa + sec * (x - st.a), 2, rgbCss(TH.warn), 2);
    /* the tangent, from the symbolic derivative */
    const m = F.d1(st.a);
    if(Number.isFinite(m)) plotCurve(ctx, P, x => fa + m * (x - st.a), 2, rgbCss(TH.curl), 2.2);
    /* the rise-over-run triangle that the quotient literally is */
    if(Number.isFinite(fa) && Number.isFinite(fh)){
      ctx.strokeStyle = rgbCss(TH.faint); ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(P.X(st.a), P.Y(fa)); ctx.lineTo(P.X(st.a + st.h), P.Y(fa));
      ctx.lineTo(P.X(st.a + st.h), P.Y(fh)); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, (P.X(st.a) + P.X(st.a + st.h)) / 2, P.Y(fa) + 14, 'h', rgbCss(TH.faint), '600 11px ' + FONT_MONO, 'center');
      ctText(ctx, P.X(st.a + st.h) + 6, (P.Y(fa) + P.Y(fh)) / 2, 'Δf', rgbCss(TH.faint), '600 11px ' + FONT_MONO);
    }
    ctDot(ctx, P, st.a, fa, 6, rgbCss(TH.text), rgbCss(TH.bg));
    ctDot(ctx, P, st.a + st.h, fh, 5, rgbCss(TH.warn), rgbCss(TH.bg));
    /* the quotient as a function of h, converging */
    const Q = mkPlot(76, 46 + hp + 56, W - 124, H - 150 - hp, 0, 18,
      Number.isFinite(m) ? m - 2.2 : -3, Number.isFinite(m) ? m + 2.2 : 3);
    plotFrame(ctx, Q, 'steps of halving h', 'difference quotient', 'the three quotients converging on f′(a)');
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [0, 6, 12, 18], v => String(v));
    if(Number.isFinite(m)){
      ctx.strokeStyle = rgbCss(TH.curl, 0.8); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(Q.px, Q.Y(m)); ctx.lineTo(Q.px + Q.pw, Q.Y(m)); ctx.stroke();
      ctx.setLineDash([]);
    }
    const rows = clDerivLimit(F.f, st.a, 18);
    for(const [key, col] of [['fwd', TH.warn], ['back', TH.neg], ['sym', TH.pos]]){
      ctx.strokeStyle = rgbCss(col); ctx.lineWidth = 2;
      ctx.beginPath();
      rows.forEach((r, i) => {
        const v = r[key];
        if(!Number.isFinite(v)) return;
        const Y = Q.Y(Math.max(Q.y0, Math.min(Q.y1, v)));
        i ? ctx.lineTo(Q.X(i), Y) : ctx.moveTo(Q.X(i), Y);
      });
      ctx.stroke();
    }
    stageNote(ctx, 'orange: forward · blue: backward · green: symmetric — the purple line is the symbolic f′(a)', W, H);
  },
  readout(st){
    const F = st.F, a = st.a;
    const fwd = clSecant(F.f, a, st.h), back = clSecant(F.f, a, -st.h), sym = clSymDiff(F.f, a, st.h);
    const m = F.d1(a);
    const L = clLimit(h => (F.f(a + h) - F.f(a)) / h, 0);
    return `<div class="card tight"><div class="ttl">At a = ${fmtNum(a, 4)}, h = ${fmtNum(st.h, 5)}</div>
      ${kv('f(a)', fmtNum(F.f(a), 7))}
      ${kv('f(a+h)', fmtNum(F.f(a + st.h), 7))}
      ${kv('forward quotient', fmtNum(fwd, 7))}
      ${kv('backward quotient', fmtNum(back, 7))}
      ${kv('symmetric quotient', fmtNum(sym, 7))}
      ${kv('the symbolic f′(a)', fmtNum(m, 7))}
      ${kv('forward error', fmtNum(Math.abs(fwd - m), 3))}
      ${kv('symmetric error', fmtNum(Math.abs(sym - m), 3))}
    </div>
    <div class="card tight"><div class="ttl">The limit, taken</div>
      ${kv('from the right', L.right.settled ? fmtNum(L.right.value, 8) : 'never settles')}
      ${kv('from the left', L.left.settled ? fmtNum(L.left.value, 8) : 'never settles')}
      ${kv('does f′(a) exist?', L.exists ? 'yes' : 'no — the one-sided derivatives disagree')}
      ${kv('and it equals', L.exists ? fmtNum(L.value, 8) : '—')}
      <p class="help">${L.exists
        ? 'The two one-sided derivatives agree, so the tangent line is well defined and the curve is locally straight.'
        : 'The two one-sided derivatives disagree, so there is a <b>corner</b>. The function is still continuous — it has no gap — but no single line touches it at that point.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Differentiated symbolically</div>
      <div class="dstep"><div class="lbl">f</div>${texEq(F.ast)}</div>
      <div class="dstep"><div class="lbl">f′</div>${texEq(F.a1)}</div>
      <div class="dstep"><div class="lbl">f″</div>${texEq(F.a2)}</div>
      ${kv('f″(a)', fmtNum(F.d2(a), 7))}
      <p class="help">These come from the same symbolic differentiator the vector-calculus wing uses —
      the product, quotient and chain rules applied to the parse tree, exactly as you would on paper. The
      numerical quotients above are an independent route to the same number, which is why the two agreeing
      is worth watching.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">f′(${fmtNum(st.a, 3)})</div>
      <div style="color:var(--c-curl)">${fmtNum(st.F.d1(st.a), 6)}</div>
      <div>h = ${fmtNum(st.h, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'f(x)'], ['var(--c-warn)', 'the secant, and the forward quotient'],
                    ['var(--c-curl)', 'the tangent — the symbolic f′'], ['var(--c-pos)', 'the symmetric quotient'],
                    ['var(--c-neg)', 'the backward quotient']]; },
  dockLegend:true
};

/* ---- 4 · curve analysis ---------------------------------------------------- */
STAGES.clCurve = {
  title:'Analysing a curve',
  derive(st){
    const F = st.F, x = st.x;
    const n = v => fmtNum(v, 6);
    const crit = nqRoots(F.d1, -3, 3, 900);
    const infl = nqRoots(F.d2, -3, 3, 900);
    return {
      title:'What the first and second derivatives each tell you, and why',
      steps:[
        drvSay('the derivative was built to measure one thing',
          'f′(x) is the limit of a difference quotient, so its sign is the sign of f(x+h) − f(x) for small positive h. That is all "increasing" means. The connection is not a separate theorem you have to remember — it is what the quotient literally is.'),
        drvStep('so the sign of f′ decides increasing or decreasing',
          `${dv('f')}′ ${dop('>')} 0 ${dop('⇒')} ${dv('f')} increasing`,
          `at x = ${n(x)}: f′ = ${n(F.d1(x))}, so f is ${F.d1(x) > 0 ? 'increasing' : F.d1(x) < 0 ? 'decreasing' : 'stationary'} there`),
        drvSay('but only the Mean Value Theorem licenses that step',
          'A derivative is a statement at a single point; "increasing on an interval" is a statement about every pair of points in it. Bridging the two needs the MVT: for any x₁ < x₂, f(x₂) − f(x₁) = f′(c)(x₂ − x₁) for some c between them, so a derivative positive throughout forces the difference positive. Without the MVT the inference does not go through.'),
        drvStep('turning points are where that sign can change',
          `${dv('f')}′(${dv('c')}) ${dop('=')} 0`,
          crit.length ? `${crit.length} critical point${crit.length === 1 ? '' : 's'} on [−3, 3]: ${crit.map(c => n(c)).join(', ')}` : 'no critical points in the window'),
        drvSay('"can" rather than "does" — f′ = 0 is necessary, not sufficient',
          'x³ has a zero derivative at the origin and is increasing straight through it. A vanishing derivative marks a candidate, and something further has to decide whether it is a maximum, a minimum, or neither. That is what the second derivative is for.'),
        drvStep('differentiate again, and the same argument applies to f′',
          `${dv('f')}″ ${dop('>')} 0 ${dop('⇒')} ${dv('f')}′ increasing ${dop('⇒')} ${dv('f')} concave up`,
          `at x = ${n(x)}: f″ = ${n(F.d2(x))}, so the curve is ${F.d2(x) > 0 ? 'concave up' : F.d2(x) < 0 ? 'concave down' : 'momentarily straight'}`),
        drvSay('concavity is just the first derivative test applied one level up',
          'Nothing new is happening. f″ tells you whether the slope is rising or falling, exactly as f′ tells you whether the value is rising or falling. A curve is concave up when its tangent lines lie below it, and that is the geometric face of "the slope keeps increasing".'),
        drvStep('so at a critical point the sign of f″ settles the question',
          `${dv('f')}′(${dv('c')}) ${dop('=')} 0 , ${dv('f')}″(${dv('c')}) ${dop('>')} 0 ${dop('⇒')} minimum`,
          crit.length ? crit.map(c => `x = ${n(c)}: f″ = ${n(F.d2(c))} → ${F.d2(c) > 0 ? 'minimum' : F.d2(c) < 0 ? 'maximum' : 'test fails, f″ = 0'}`).join('; ') : 'no critical points to classify'),
        drvStep('and inflections are where concavity itself turns over',
          `${dv('f')}″(${dv('p')}) ${dop('=')} 0 with a sign change`,
          infl.length ? `${infl.length} inflection${infl.length === 1 ? '' : 's'}: ${infl.map(c => n(c)).join(', ')}` : 'none in the window'),
        drvSay('again the sign change is the content, not the zero',
          'x⁴ has f″ = 0 at the origin without an inflection, because f″ does not change sign there — it touches zero and comes back. The panel locates inflections by scanning for genuine sign changes, which is why it does not report one for x⁴.')
      ],
      note:'The whole apparatus is one idea used twice: the sign of a derivative reports the direction of change of the thing below it. Apply it to f and you get monotonicity; apply it to f′ and you get concavity. There is no third idea hiding in the second-derivative test.'
    };
  },
  drag:true,
  enter(st, o){
    st.src = o.src || 'x^4/4-2x^2+x';
    st.show = Object.assign({ d1:true, d2:true, tang:false }, o.show || {});
    st.x = 0.6;
    st.F = clBundle(st.src);
  },
  controls(){
    const st = ST;
    return pkSrcSeg('clCF', st.src, [['x^4/4-2x^2+x','x⁴/4 − 2x² + x'], ['x^3-3x', 'x³ − 3x'],
                                   ['x/(x^2+1)', 'x/(x²+1)'], ['exp(-x^2)*x', 'x e^(−x²)'],
                                   ['sin(x)+0.3x', 'sin x + 0.3x'], ['x^(2/3)', 'x^(2/3)']], 'x^3-3x+1') +
      pkSrcBox('clCF', st.src, 'f(x) =', 'x') +
      `<div class="row wrap">${ctChk('clCd1', "f′, and where it is zero", st.show.d1)}
        ${ctChk('clCd2', 'f″, and the inflections', st.show.d2)}
        ${ctChk('clCt', 'the tangent at the probe', st.show.tang)}</div>
      <p class="help"><b>Click the curve</b> to move the probe. Everything the "sketch this function"
      question asks for is found here by <b>searching</b>: critical points are the zeros of f′, located by
      scanning for sign changes and refining by bisection; inflections are the zeros of f″ that actually
      change sign, which is stricter and rules out the false ones at x = 0 of x⁴.</p>
      <p class="help">The two derivative curves are drawn beneath the function, so the logic is visible
      rather than recited: f is increasing exactly where the blue curve is above zero, and concave up
      exactly where the green one is. A maximum of f is a downward zero-crossing of f′; an inflection of f
      is a zero-crossing of f″.</p>`;
  },
  wire(){
    ctWireSeg('clCF', v => { ST.src = v; ST.F = clBundle(v); });
    pkSrcWire('clCF', ST.src, v => { ST.src = v; ST.F = clBundle(v); });
    ctWireChk('clCd1', v => { ST.show.d1 = v; });
    ctWireChk('clCd2', v => { ST.show.d2 = v; });
    ctWireChk('clCt', v => { ST.show.tang = v; });
  },
  pick(st, sx, sy, phase){
    if(phase === 'up' || !st.P) return;
    st.x = Math.max(st.P.x0, Math.min(st.P.x1, st.P.invX(sx)));
  },
  frame(st, dt, ctx, W, H){
    const F = st.F, E = 3;
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i <= 400; i++){
      const x = -E + 2 * E * i / 400;
      for(const g of [F.f, st.show.d1 ? F.d1 : null, st.show.d2 ? F.d2 : null]){
        if(!g) continue;
        const v = g(x);
        if(Number.isFinite(v) && Math.abs(v) < 40){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
      }
    }
    if(!Number.isFinite(lo)){ lo = -4; hi = 4; }
    const pad = (hi - lo) * 0.12 + 0.2;
    const P = pvName(mkPlot(76, 46, W - 124, H - 134, -E, E, lo - pad, hi + pad),
                     'f(x) = ' + pkPretty(F.src));
    st.P = P;
    plotFrame(ctx, P, 'x', '', 'click the curve to move the probe');
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [-3, -1.5, 0, 1.5, 3], v => fmtNum(v, 2));
    const A = clAnalyse(F, -E, E);
    /* shade where f is increasing and where it is concave up */
    ctx.save(); ctx.globalAlpha = 0.09;
    ctx.fillStyle = rgbCss(TH.neg);
    for(const [a, b] of A.increasing) ctx.fillRect(P.X(a), P.py, P.X(b) - P.X(a), P.ph / 2);
    ctx.fillStyle = rgbCss(TH.pos);
    for(const [a, b] of A.concaveUp) ctx.fillRect(P.X(a), P.py + P.ph / 2, P.X(b) - P.X(a), P.ph / 2);
    ctx.restore();
    if(st.show.d2) plotCurve(ctx, P, F.d2, 900, rgbCss(TH.pos, 0.75), 1.6);
    if(st.show.d1) plotCurve(ctx, P, F.d1, 900, rgbCss(TH.neg, 0.75), 1.8);
    plotCurve(ctx, P, F.f, 1100, rgbCss(TH.grad), 2.6);
    for(const c of A.crit)
      ctDot(ctx, P, c.x, c.y, 7, rgbCss(c.kind === 'local maximum' ? TH.neg : c.kind === 'local minimum' ? TH.pos : TH.faint), rgbCss(TH.bg));
    for(const i of A.infl) ctDot(ctx, P, i.x, i.y, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    for(const z of A.zeros) ctDot(ctx, P, z, 0, 4, rgbCss(TH.text, 0.7), rgbCss(TH.bg));
    if(st.show.tang){
      const m = F.d1(st.x), y = F.f(st.x);
      if(Number.isFinite(m)) plotCurve(ctx, P, x => y + m * (x - st.x), 2, rgbCss(TH.curl), 1.8);
    }
    probeLine(ctx, P, st.x, 'x');
    ctDot(ctx, P, st.x, F.f(st.x), 5, rgbCss(TH.text), rgbCss(TH.bg));
    stageNote(ctx, 'upper shading: f is increasing · lower shading: f is concave up', W, H);
  },
  readout(st){
    const F = st.F, E = 3;
    const A = clAnalyse(F, -E, E);
    const x = st.x;
    return `<div class="card tight"><div class="ttl">At the probe x = ${fmtNum(x, 4)}</div>
      ${kv('f', fmtNum(F.f(x), 7))}
      ${kv("f′", fmtNum(F.d1(x), 7))}
      ${kv("f″", fmtNum(F.d2(x), 7))}
      ${kv('behaviour', (F.d1(x) > 0 ? 'increasing' : F.d1(x) < 0 ? 'decreasing' : 'stationary') + ', ' +
           (F.d2(x) > 0 ? 'concave up' : F.d2(x) < 0 ? 'concave down' : 'no curvature'))}
    </div>
    <div class="card tight"><div class="ttl">Critical points, found by search</div>
      ${A.crit.length ? A.crit.map(c => kv('x = ' + fmtNum(c.x, 5), c.kind + ',  f = ' + fmtNum(c.y, 5))).join('')
        : '<p class="help">None in this window.</p>'}
      ${kv('inflections', A.infl.length ? A.infl.map(i => fmtNum(i.x, 4)).join(',  ') : 'none')}
      ${kv('zeros of f', A.zeros.length ? A.zeros.map(z => fmtNum(z, 4)).join(',  ') : 'none')}
      <p class="help">An inflection needs f″ to <i>change sign</i>, not merely to vanish. x⁴ has f″ = 12x²
      which is zero at the origin and never negative — no inflection there, and the search here rejects it
      for exactly that reason.</p>
    </div>
    <div class="card tight"><div class="ttl">Increasing and concave</div>
      ${kv('increasing on', A.increasing.length ? A.increasing.map(r => `(${fmtNum(r[0], 3)}, ${fmtNum(r[1], 3)})`).join(' ∪ ') : 'nowhere')}
      ${kv('concave up on', A.concaveUp.length ? A.concaveUp.map(r => `(${fmtNum(r[0], 3)}, ${fmtNum(r[1], 3)})`).join(' ∪ ') : 'nowhere')}
      ${kv('global max on [−3, 3]', fmtNum(A.extremes.max, 6) + ' at ' + fmtNum(A.extremes.argmax, 4))}
      ${kv('global min', fmtNum(A.extremes.min, 6) + ' at ' + fmtNum(A.extremes.argmin, 4))}
      <div class="dstep"><div class="lbl">f′</div>${texEq(F.a1)}</div>
      <div class="dstep"><div class="lbl">f″</div>${texEq(F.a2)}</div>
    </div>`;
  },
  chip(st){
    return `<div class="k">at x = ${fmtNum(st.x, 3)}</div>
      <div style="color:var(--c-neg)">f′ = ${fmtNum(st.F.d1(st.x), 5)}</div>
      <div style="color:var(--c-pos)">f″ = ${fmtNum(st.F.d2(st.x), 5)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'f'], ['var(--c-neg)', "f′, and maxima"], ['var(--c-pos)', 'f″, and minima'],
                    ['var(--c-warn)', 'inflections'], ['var(--c-curl)', 'the tangent']]; },
  dockLegend:true
};
