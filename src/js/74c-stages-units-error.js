/* ============================================================================
   5v · SIGNIFICANT FIGURES AND ERROR PROPAGATION — the stages  (wing C3)

     unSig    what k figures guarantee, and the one operation that destroys it
     unProp   a first-order error bar against a Monte Carlo, gap printed

   Both stages are built the same way: a formula everybody is taught, and a
   second route that does not use it. In unSig the second route is interval
   arithmetic over the corners of the rounding box; in unProp it is sampling.
   Where the two disagree is where the taught formula stops being true.
   ============================================================================ */

/* ============================================================================
   1 · significant figures
   ============================================================================ */
const UN_SIGP = {
  plain:  { short:'two ordinary numbers', a:3.14159265358979, b:2.71828182845905, k:4,
    name:'π and e, rounded',
    why:'Nothing dramatic: two numbers of the same size, and every operation keeps roughly the relative error it started with. This is the case people generalise from, and it is the case where the rule of thumb happens to work.' },
  cancel: { short:'a near-cancellation', a:1.0000013, b:1.0000000, k:8,
    name:'Two numbers that agree to six figures',
    why:'Eight figures in, and the difference has one. Nothing was computed badly: both inputs are as accurate as claimed and the subtraction itself is exact. What happened is that the answer is small and the errors are not, so the relative error was multiplied by the ratio of the sizes — here about a million and a half. Drag the slider down and watch the last figure go too.' },
  quad:   { short:'the unstable root', a:1000.0005, b:1000.0000, k:9,
    name:'The quadratic formula\'s bad root',
    why:'This is −b + √(b² − 4ac) when 4ac is small: a difference of two nearly equal large numbers, which is where the standard formula loses everything. The numerical-methods wing shows the cure — multiply by the conjugate and compute the root from c/(a·other root) — and this panel is why the cure is needed.' },
  spread: { short:'wildly different sizes', a:6.02214076e23, b:1.602176634e-19, k:5,
    name:'Avogadro\'s number and the elementary charge',
    why:'Forty-two orders of magnitude apart, and multiplication and division do not care in the slightest — relative errors add in quadrature and neither number\'s size appears. The SUM, by contrast, is just the larger number: the smaller one is entirely below its rounding error and contributes nothing at all.' },
  meas:   { short:'a real measurement', a:9.80665, b:9.79, k:3,
    name:'Standard gravity against a local measurement',
    why:'Two values of g that differ in the third figure. Reported to three figures they are 9.81 and 9.79, and the difference — 0.02 — has one figure and a relative error of 5%. This is the ordinary case in a laboratory and the reason a difference is always quoted with more care than either number it came from.' },
  custom: { short:'type your own', a:1.5, b:1.4, k:5,
    name:'Your own pair',
    why:'Two numbers and a number of figures.' }
};

STAGES.unSig = {
  title:'What a significant figure guarantees',
  enter(st, o){
    st.skey = o.skey || 'plain';
    st.k = o.k || UN_SIGP[o.skey || 'plain'].k;
  },
  cur(st){
    const E = UN_SIGP[st.skey];
    let a = E.a, b = E.b;
    if(st.skey === 'custom'){
      const own = pkOwn(st, 'unSg', [], [{ k:'a', label:'a', def:1.5 }, { k:'b', label:'b', def:1.4 }]);
      a = +own.a; b = +own.b;
      if(!isFinite(a)) a = 1.5;
      if(!isFinite(b)) b = 1.4;
    }
    const k = st.k;
    const Ba = unSigBand(a, k), Bb = unSigBand(b, k);
    const ra = Ba.rounded, rb = Bb.rounded;
    /* route 1 — the taught first-order formulas, one per operation */
    const ops = [
      { n:'a + b', v:ra + rb, lin:(Ba.abs + Bb.abs) },
      { n:'a − b', v:ra - rb, lin:(Ba.abs + Bb.abs) },
      { n:'a × b', v:ra * rb, lin:Math.abs(ra * rb) * (Ba.rel + Bb.rel) },
      { n:'a / b', v:rb === 0 ? NaN : ra / rb, lin:rb === 0 ? NaN : Math.abs(ra / rb) * (Ba.rel + Bb.rel) }
    ];
    /* route 2 — the exact worst case over the rounding box. Both intervals are
       closed and each operation is monotone in each argument on them, so the
       extremes are at the corners and four evaluations settle it exactly. This
       shares no algebra with the formulas above; it just evaluates. */
    const f = [(x, y) => x + y, (x, y) => x - y, (x, y) => x * y, (x, y) => y === 0 ? NaN : x / y];
    ops.forEach((o, i) => {
      let lo = Infinity, hi = -Infinity;
      for(const sa of [-1, 1]) for(const sb of [-1, 1]){
        const v = f[i](ra + sa * Ba.abs, rb + sb * Bb.abs);
        if(!isFinite(v)) continue;
        lo = Math.min(lo, v); hi = Math.max(hi, v);
      }
      o.box = isFinite(lo) ? Math.max(hi - o.v, o.v - lo) : NaN;
      o.rel = Math.abs(o.v) > 0 ? o.box / Math.abs(o.v) : NaN;
      o.linRel = Math.abs(o.v) > 0 ? o.lin / Math.abs(o.v) : NaN;
    });
    /* the condition number of the subtraction, which is the whole story */
    const cond = Math.abs(ra - rb) > 0 ? (Math.abs(ra) + Math.abs(rb)) / Math.abs(ra - rb) : Infinity;
    return { E, a, b, k, Ba, Bb, ra, rb, ops, cond,
             inRel:Math.max(Ba.rel, Bb.rel),
             justA:unSigJustified(a, Ba.abs), name:E.name, why:E.why };
  },
  controls(){
    const st = ST;
    return ctSeg('unSgK', st.skey, Object.keys(UN_SIGP).map(x => [x, UN_SIGP[x].short])) +
      (st.skey === 'custom'
        ? pkBoxes('unSg', 'custom', st, [], [{ k:'a', label:'a', def:1.5 }, { k:'b', label:'b', def:1.4 }],
                  'Two numbers. Expressions are read too, so <b>pi</b>, <b>sqrt(2)</b> and ' +
                  '<b>1e6 + 1</b> are all valid — which is the quickest way to build a cancellation.')
        : '') +
      ctlRow('significant figures kept', ctlSlider('unSgN', 1, 12, 1, st.k)) +
      `<p class="help">Rounding to k figures is a statement about <b>relative</b> error and nothing
      else: it promises the value to within 5 × 10⁻ᵏ of itself, whatever its size. That is why the
      same k means a millimetre on a metre and a thousand kilometres on a light-year, and why
      multiplying and dividing keep it while adding and subtracting do not.</p>
      <p class="help">The bars are logarithmic and each one is drawn twice. The solid bar is the
      exact worst case, found by evaluating the operation at the four corners of the rounding box;
      the outline is the first-order formula a textbook gives. Where they part company, the formula
      has been linearised and the box has not.</p>`;
  },
  wire(){
    ctWireSeg('unSgK', v => { ST.skey = v; ST.k = UN_SIGP[v].k; });
    if(ST.skey === 'custom')
      pkWireBoxes('unSg', 'custom', ST, [], [{ k:'a', label:'a', def:1.5 }, { k:'b', label:'b', def:1.4 }]);
    wireSlider('unSgN', () => ST.k, v => { ST.k = Math.round(v); }, v => Math.round(v) + ' figures');
  },
  frame(st, dt, ctx, W, H){
    const C = this.cur(st);
    const B = unChipBox(ctx, W, H, 40, 60);
    /* everything is a relative error and they span decades, so the axis is
       log10 and the tick labels say what that means */
    const vals = C.ops.map(o => o.rel).filter(v => isFinite(v) && v > 0).concat([C.inRel]);
    let lo = Math.floor(Math.log10(Math.min.apply(null, vals))) - 0.5;
    let hi = Math.ceil(Math.log10(Math.max.apply(null, vals))) + 0.5;
    if(!(hi > lo)){ lo = -12; hi = 0; }
    const P = mkPlot(B.px, B.py, B.pw, B.ph, -0.6, C.ops.length - 0.4, lo, hi);
    plotFrame(ctx, P, '', 'log₁₀ of the relative error', 'what each operation does to the error');
    const MY = ctUnitMarks(lo, hi, 8);
    plotTicksY(ctx, P, MY.vals, v => fmtTick(v, MY.step));
    /* the reference line: what the inputs came in with */
    const rin = Math.log10(Math.max(1e-300, C.inRel));
    ctPath(ctx, P, [{ x:-0.6, y:rin }, { x:C.ops.length - 0.4, y:rin }], rgbCss(TH.grad), 1.8, [6, 5]);
    ctText(ctx, P.X(C.ops.length - 0.45), P.Y(rin) - 5, 'what went in — ' + fmtSig(100 * C.inRel, 3) + '%',
           rgbCss(TH.grad), '10px ' + FONT_UI, 'right', 'bottom');
    C.ops.forEach((o, j) => {
      if(!isFinite(o.rel) || o.rel <= 0){
        ctText(ctx, P.X(j), P.Y((lo + hi) / 2), 'not defined', rgbCss(TH.dim),
               '11px ' + FONT_UI, 'center', 'middle');
        return;
      }
      const yv = Math.log10(o.rel);
      const worse = o.rel > C.inRel * 1.5;
      const col = worse ? TH.neg : TH.pos;
      ctFill(ctx, P, [{ x:j - 0.3, y:lo }, { x:j + 0.3, y:lo },
                      { x:j + 0.3, y:yv }, { x:j - 0.3, y:yv }], rgbCss(col, 0.5));
      ctPath(ctx, P, [{ x:j - 0.3, y:lo }, { x:j + 0.3, y:lo }, { x:j + 0.3, y:yv },
                      { x:j - 0.3, y:yv }, { x:j - 0.3, y:lo }], rgbCss(col), 1.6);
      if(isFinite(o.linRel) && o.linRel > 0){
        const yl = Math.log10(o.linRel);
        ctPath(ctx, P, [{ x:j - 0.4, y:yl }, { x:j + 0.4, y:yl }], rgbCss(TH.warn), 1.8);
      }
      ctText(ctx, P.X(j), P.Y(lo) + 12, o.n, rgbCss(TH.text), '600 12px ' + FONT_UI, 'center', 'top');
      ctText(ctx, P.X(j), P.Y(yv) - 5, fmtSig(100 * o.rel, 3) + '%', rgbCss(col),
             '600 10px ' + FONT_UI, 'center', 'bottom');
    });
    stageNote(ctx, isFinite(C.cond)
      ? 'subtracting multiplies the relative error by ' + fmtSig(C.cond, 4) + ' — that factor is the whole lesson'
      : 'the two rounded values are equal, so their difference is zero and has no relative error at all',
      W, H);
  },
  derive(st){
    const C = this.cur(st);
    return {
      title:'What k figures promise, and what survives arithmetic',
      steps:[
        drvStep('rounding to k figures is a relative statement',
          `|${dv('x')} ${dop('−')} ${dfn('round')}ₖ(${dv('x')})| ${dop('≤')} ½ ${dop('×')} 10${uniSup('e−k+1')}`,
          'here ±' + fmtSig(C.Ba.abs, 3) + ' on a, which is ' + fmtSig(100 * C.Ba.rel, 3) + '% of it'),
        drvSay('so a figure is a digit of RATIO, not a digit of size',
          'Three figures means the same fractional ignorance on a proton radius as on a galaxy. That is what makes the notion portable, and it is also what makes the trailing zeros of "1200" ambiguous — nothing in the numeral says whether the zeros were measured. Scientific notation exists to answer that, and is the only unambiguous way to write it.'),
        drvStep('multiplying and dividing add the relative errors',
          `${dfrac('δ(' + dv('ab') + ')', dv('ab'))} ${dop('≈')} ${dfrac('δ' + dv('a'), dv('a'))} ${dop('+')} ${dfrac('δ' + dv('b'), dv('b'))}`,
          'so the product keeps about the same number of figures as the worse input — ' +
          fmtSig(100 * C.ops[2].rel, 3) + '% here'),
        drvStep('adding and subtracting add the ABSOLUTE errors',
          `δ(${dv('a')} ${dop('±')} ${dv('b')}) ${dop('≈')} δ${dv('a')} ${dop('+')} δ${dv('b')}`,
          'which is fine for a sum and catastrophic for a difference of near-equals'),
        drvStep('because the relative error is that, divided by a small answer',
          `${dfrac('δ(' + dv('a') + '−' + dv('b') + ')', '|' + dv('a') + '−' + dv('b') + '|')} ${dop('=')} ${dfrac('|' + dv('a') + '| + |' + dv('b') + '|', '|' + dv('a') + '−' + dv('b') + '|')} ${dop('×')} (relative error in)`,
          isFinite(C.cond) ? 'the amplification factor here is ' + fmtSig(C.cond, 5)
                           : 'the two rounded values are identical, so the factor is unbounded'),
        drvSay('that factor has a name and it is the condition number of the problem',
          'It belongs to the QUESTION, not to the method: no algorithm computing a − b from rounded inputs can do better, because the information is not in the inputs. This is the sharp distinction the numerical-methods wing draws between an ill-conditioned problem and an unstable algorithm — an unstable algorithm can be replaced, and an ill-conditioned problem cannot.'),
        drvSay('and the second route on the picture is not the same calculation',
          'The formulas above are first-order: they are the leading term of a Taylor expansion in the errors. The solid bars come from evaluating each operation at the four corners of the rounding box and taking the true worst case. For + and − the two agree exactly, because those operations are linear and there is no higher order to miss. For × and ÷ they part company at the second order, by an amount of order δa·δb — visible on the picture at one or two figures and invisible at eight.'),
        drvSay('what to do about it, in one sentence',
          'Rearrange so the subtraction never happens. √(x+1) − √x becomes 1/(√(x+1) + √x); the bad root of a quadratic becomes c/(a·r₁); a difference of two integrals becomes one integral of the difference. In every case the cancellation is done symbolically, where it is exact, instead of numerically, where it is not.')
      ],
      note:'Both routes here are exact statements about the ROUNDED values. Nothing about the ' +
           'original numbers survives beyond the band, which is the point.'
    };
  },
  readout(st){
    const C = this.cur(st);
    const rows = C.ops.map(o => kv(o.n,
      (isFinite(o.v) ? fmtSig(o.v, Math.max(3, C.k)) : 'not defined') +
      '  <span style="color:var(--c-dim)">± ' + (isFinite(o.box) ? fmtSig(o.box, 3) : '—') + '  (' +
      (isFinite(o.rel) ? fmtSig(100 * o.rel, 3) + '%' : '—') + ')</span>')).join('');
    return `<div class="card tight"><div class="ttl">${C.name}</div>
      ${kv('a, as given', fmtSig(C.a, 15))}
      ${kv('a, to ' + C.k + ' figures', fmtSig(C.ra, C.k) + '  ± ' + fmtSig(C.Ba.abs, 3) +
           '   (' + fmtSig(100 * C.Ba.rel, 3) + '%)')}
      ${kv('b, to ' + C.k + ' figures', fmtSig(C.rb, C.k) + '  ± ' + fmtSig(C.Bb.abs, 3) +
           '   (' + fmtSig(100 * C.Bb.rel, 3) + '%)')}
      <p class="help">${C.why}</p>
    </div>
    <div class="card tight"><div class="ttl">The four operations, worst case</div>
      ${rows}
      ${kv('amplification by subtracting', isFinite(C.cond)
          ? '×' + fmtSig(C.cond, 5) + (C.cond > 100 ? '  — this is the catastrophe' : '')
          : 'unbounded — the rounded values are equal')}
      ${kv('figures left in a − b', isFinite(C.ops[1].rel) && C.ops[1].rel > 0
          ? String(Math.max(0, Math.floor(Math.log10(5 / C.ops[1].rel))))
          : 'none — nothing is left')}
      <p class="help">Every row above is the <b>exact</b> worst case over the rounding box, not an
      estimate: each operation is monotone in each argument on a closed interval, so four evaluations
      settle it. The bar outline on the picture is the textbook first-order formula drawn on top, and
      the two agree exactly for + and − because those are linear.</p>
    </div>
    <div class="card tight"><div class="ttl">Reporting it</div>
      ${kv('figures justified in a − b', (() => {
        const j = unSigJustified(C.ops[1].v, C.ops[1].box);
        return j === null ? 'none — the difference is zero to this precision' : String(j);
      })())}
      <p class="help">The rule is one sentence: <b>the first uncertain digit is the last one worth
      writing.</b> Writing more is not more precise, it is a claim about digits nobody measured — and
      writing fewer throws away something that was measured. Both are errors and only the first is
      common.</p>
      <p class="help">This is the boundary this whole laboratory lives on. Panels here print eight
      or ten digits deliberately, because a residual that must vanish has to be readable down to the
      last bit; a residual is not a measurement. When a physical quantity is being reported instead,
      the digits stop where the uncertainty starts.</p>
    </div>`;
  },
  chip(st){
    const C = this.cur(st);
    return `<div class="k">a − b, ${C.k} figures</div>
      <div style="color:var(--c-neg)">${isFinite(C.ops[1].rel) ? fmtSig(100 * C.ops[1].rel, 3) + '%' : '—'}</div>
      <div style="color:var(--c-dim)">in at ${fmtSig(100 * C.inRel, 2)}%</div>`;
  },
  legend(){
    return [['var(--c-pos)', 'relative error no worse than the inputs\''],
            ['var(--c-neg)', 'relative error made worse'],
            ['var(--c-grad)', 'what the inputs came in with'],
            ['var(--c-warn)', 'the first-order formula, for comparison']];
  },
  dockLegend:true
};

/* ============================================================================
   2 · error propagation, twice
   ============================================================================ */
const UN_MEAS = {
  pend: { short:'g from a pendulum', name:'Measuring g by timing a pendulum',
    vars:[{ n:'L', v:1.000, s:0.002, u:'m', what:'the length' },
          { n:'T', v:2.0071, s:0.004, u:'s', what:'the period' }],
    f:x => 4 * Math.PI * Math.PI * x[0] / (x[1] * x[1]), unit:'m/s²',
    ex:'g = 4π²L/T²', truth:9.80665, truthWhy:'standard gravity, 9.80665 m/s² by definition',
    why:'The classic undergraduate measurement, and the panel answers the question the experiment is really about: which of the two measurements is worth improving? The period enters squared, so its share of the variance is four times what its relative error alone suggests — and a stopwatch is the thing to fix, not the ruler.' },
  sphere:{ short:'density of a sphere', name:'Density from a mass and a diameter',
    vars:[{ n:'m', v:0.2540, s:0.0005, u:'kg', what:'the mass' },
          { n:'d', v:0.0500, s:0.0002, u:'m', what:'the diameter' }],
    f:x => x[0] / (Math.PI * x[1] * x[1] * x[1] / 6), unit:'kg/m³',
    ex:'ρ = 6m/πd³', truth:null, truthWhy:'',
    why:'The diameter is cubed, so a 0.4% error in it becomes a 1.2% error in the density — three times its own size, before the mass has contributed anything. A power law multiplies relative errors by the exponent, and this is the quickest place to see why that matters more than the raw precision of the instrument.' },
  power:{ short:'power in a resistor', name:'Power from a voltage and a resistance',
    vars:[{ n:'V', v:12.00, s:0.05, u:'V', what:'the voltage' },
          { n:'R', v:47.0, s:1.5, u:'Ω', what:'the resistance' }],
    f:x => x[0] * x[0] / x[1], unit:'W',
    ex:'P = V²/R', truth:null, truthWhy:'',
    why:'A five-percent resistor against a half-percent voltmeter. The voltage is squared and still loses: 3.2% from the resistor against 0.8% from the meter, so the resistor supplies about 94% of the variance. Buying a better voltmeter would change nothing measurable, which is exactly the kind of decision this calculation exists to make.' },
  decay:{ short:'a decay, badly known', name:'A decay constant with a large uncertainty',
    vars:[{ n:'λ', v:0.5, s:0.25, u:'/s', what:'the decay constant' },
          { n:'t', v:4.0, s:0.05, u:'s', what:'the elapsed time' }],
    f:x => Math.exp(-x[0] * x[1]), unit:'',
    ex:'N/N₀ = e^(−λt)', truth:null, truthWhy:'',
    why:'Here the linear route breaks, and the picture shows it breaking rather than the panel asserting it. λt is 2 ± 1, so the exponential is sampled over two decades and the output distribution is violently skewed — it has a hard floor at zero and a long tail upward. A symmetric ± error bar is not a description of that, and the Monte Carlo says so by disagreeing with it by tens of percent.' },
  ratio:{ short:'a ratio through zero', name:'A ratio whose denominator can vanish',
    vars:[{ n:'a', v:1.0, s:0.1, u:'', what:'the numerator' },
          { n:'b', v:1.0, s:0.45, u:'', what:'the denominator' }],
    f:x => x[0] / x[1], unit:'',
    ex:'r = a/b', truth:null, truthWhy:'',
    why:'The worst case in the picker and the most instructive. When b can reach zero within its own error bar, the ratio has no finite mean and no finite variance at all — the distribution is Cauchy-like. The Monte Carlo standard deviation is therefore not converging to anything as N grows; it wanders. Increase the sample count and watch the number move instead of settling, which is what a divergent quantity looks like from inside a computer.' },
  avg:  { short:'averaging ten readings', name:'Ten independent readings of one thing',
    vars:[{ n:'x₁', v:5.0, s:0.3, u:'', what:'reading 1' },
          { n:'x₂', v:5.0, s:0.3, u:'', what:'reading 2' },
          { n:'x₃', v:5.0, s:0.3, u:'', what:'reading 3' },
          { n:'x₄', v:5.0, s:0.3, u:'', what:'reading 4' },
          { n:'x₅', v:5.0, s:0.3, u:'', what:'reading 5' },
          { n:'x₆', v:5.0, s:0.3, u:'', what:'reading 6' },
          { n:'x₇', v:5.0, s:0.3, u:'', what:'reading 7' },
          { n:'x₈', v:5.0, s:0.3, u:'', what:'reading 8' },
          { n:'x₉', v:5.0, s:0.3, u:'', what:'reading 9' },
          { n:'x₁₀', v:5.0, s:0.3, u:'', what:'reading 10' }],
    f:x => x.reduce((a, b) => a + b, 0) / x.length, unit:'',
    ex:'x̄ = (1/n)Σxᵢ', truth:null, truthWhy:'',
    why:'The one case where both routes agree to the last bit and should: the mean is linear, so first-order propagation is not an approximation at all. The answer is 0.3/√10 = 0.0949, the √n every laboratory manual quotes — derived here rather than asserted, and with each reading contributing exactly a tenth of the variance.' },
  custom:{ short:'type your own', name:'Your own formula',
    vars:[{ n:'x', v:2.0, s:0.1, u:'', what:'the first variable' },
          { n:'y', v:3.0, s:0.2, u:'', what:'the second' }],
    f:null, unit:'',
    ex:'f(x, y)', truth:null, truthWhy:'',
    why:'Any formula in x and y, with your own values and uncertainties.' }
};

const UN_MEAS_OWN = [{ k:'f', label:'f(x, y) =', vars:'x, y', def:'x^2*y - 3*x',
                       audit:'exp(x)*sin(y) + x*y' }];

STAGES.unProp = {
  title:'Two routes to an error bar',
  enter(st, o){
    st.mkey = o.mkey || 'pend';
    st.blow = o.blow === undefined ? 1 : o.blow;
    st.N = o.N || 20000;
  },
  cur(st){
    const E = UN_MEAS[st.mkey];
    let f = E.f, vars = E.vars, ex = E.ex, ok = true, why2 = '';
    if(st.mkey === 'custom'){
      const own = pkOwn(st, 'unPr', UN_MEAS_OWN,
                        [{ k:'x', label:'x', def:2.0 }, { k:'sx', label:'± ', def:0.1 },
                         { k:'y', label:'y', def:3.0 }, { k:'sy', label:'± ', def:0.2 }]);
      try {
        const g = compile(parse(own.f));
        f = a => g(a[0], a[1], 0);
        ex = own.f;
      } catch(e){ ok = false; why2 = String(e && e.message || e); f = a => a[0]; }
      vars = [{ n:'x', v:+own.x, s:Math.abs(+own.sx), u:'', what:'the first variable' },
              { n:'y', v:+own.y, s:Math.abs(+own.sy), u:'', what:'the second' }];
      vars.forEach(v => { if(!isFinite(v.v)) v.v = 0; if(!isFinite(v.s)) v.s = 0; });
    }
    const xs = vars.map(v => v.v), sig = vars.map(v => v.s * st.blow);
    const C = unPropCompare(f, xs, sig, st.N, 20250819);
    return { E, f, vars, xs, sig, ex, ok, why2, C, name:E.name, why:E.why,
             unit:E.unit, truth:E.truth, truthWhy:E.truthWhy };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('unPrK', st.mkey, Object.keys(UN_MEAS).map(k => [k, UN_MEAS[k].short])) +
      (st.mkey === 'custom'
        ? pkBoxes('unPr', 'custom', st, UN_MEAS_OWN,
                  [{ k:'x', label:'x', def:2.0 }, { k:'sx', label:'± ', def:0.1 },
                   { k:'y', label:'y', def:3.0 }, { k:'sy', label:'± ', def:0.2 }],
                  'A formula in <b>x</b> and <b>y</b>, then the two values and their uncertainties. ' +
                  'Try <b>exp(x*y)</b> with a large ± and watch the two routes separate.')
        : '') +
      ctlRow('multiply every ± by', ctlSlider('unPrB', 0.25, 6, 0.25, st.blow)) +
      ctlRow('samples', ctlSlider('unPrN', 2000, 200000, 2000, st.N)) +
      `${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.why2)} — the picture keeps the last formula that read.</p>`}
      <p class="help">The smooth curve is the answer the taught formula gives: a Gaussian centred on
      f evaluated at the nominal values, with width √(Σ(∂f/∂xᵢ · σᵢ)²). The histogram behind it is
      what actually happens — the inputs drawn from their own distributions ${fmtNum(st.N, 6)} times
      and pushed through f without any expansion of anything.</p>
      <p class="help"><b>Drag the ± multiplier up.</b> On a linear formula the two never part. On a
      curved one they part at a rate set by the second derivative, and the histogram becomes visibly
      lopsided while the Gaussian, by construction, cannot be. The first-order formula is not
      approximately right there — it is describing a different shape.</p>`;
  },
  wire(){
    ctWireSeg('unPrK', v => { ST.mkey = v; });
    if(ST.mkey === 'custom')
      pkWireBoxes('unPr', 'custom', ST, UN_MEAS_OWN,
                  [{ k:'x', label:'x', def:2.0 }, { k:'sx', label:'± ', def:0.1 },
                   { k:'y', label:'y', def:3.0 }, { k:'sy', label:'± ', def:0.2 }]);
    wireSlider('unPrB', () => ST.blow, v => { ST.blow = v; }, v => '×' + fmtNum(v, 3));
    wireSlider('unPrN', () => ST.N, v => { ST.N = Math.round(v); }, v => fmtNum(Math.round(v), 6) + ' draws');
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), C = N.C;
    const B = unChipBox(ctx, W, H, 40, 60);
    const hH = B.ph * 0.66;
    unPropHist(ctx, N, B.px, B.py, B.pw, hH);
    unPropShare(ctx, N, B.px, B.py + hH + 26, B.pw, B.ph - hH - 26);
    stageNote(ctx, C.mc.sd > 0
      ? 'linear ' + fmtSig(C.lin.sd, 4) + '   ·   sampled ' + fmtSig(C.mc.sd, 4) +
        '   ·   apart by ' + fmtSig(100 * C.relGap, 3) + '%'
      : 'the sampled spread is zero — every uncertainty is zero', W, H);
  },
  derive(st){
    const N = this.cur(st), C = N.C;
    const dominant = C.lin.share.indexOf(Math.max.apply(null, C.lin.share));
    return {
      title:'Where √(Σ(∂f/∂x · σ)²) comes from, and when it stops being true',
      steps:[
        drvStep('expand f about the nominal point',
          `${dv('f')}(${dv('x')} ${dop('+')} δ) ${dop('=')} ${dv('f')}(${dv('x')}) ${dop('+')} ∑ᵢ ${dfrac('∂' + dv('f'), '∂' + dv('x') + 'ᵢ')} δᵢ ${dop('+')} O(δ²)`,
          'a Taylor series, truncated after the linear term — and everything below is a consequence of that truncation'),
        drvSay('the whole method is that one truncation, and it is worth naming it out loud',
          'Nothing else in the derivation is an approximation. If f really is linear the result is exact; if it is not, every discrepancy the panel prints traces back to the term that was dropped here.'),
        drvStep('take the variance of the linear part',
          `${dfn('Var')}(∑ ${dv('c')}ᵢδᵢ) ${dop('=')} ∑ ${dv('c')}ᵢ² ${dfn('Var')}(δᵢ) ${dop('+')} 2∑ᵢ₍ⱼ ${dv('c')}ᵢ${dv('c')}ⱼ ${dfn('Cov')}(δᵢ, δⱼ)`,
          'the cross terms vanish when the measurements are independent, which is the assumption almost every laboratory makes and almost nobody states'),
        drvStep('so the error bar is a Pythagorean sum',
          `σ${dv('f')} ${dop('=')} √( ∑ᵢ (${dfrac('∂' + dv('f'), '∂' + dv('x') + 'ᵢ')} σᵢ)² )`,
          fmtSig(C.lin.sd, 6) + (N.unit ? ' ' + N.unit : '') + ' — the terms are ' +
          C.lin.terms.map((t, i) => N.vars[i].n + ': ' + fmtSig(t.t, 3)).join(', ')),
        drvSay('errors add in quadrature, not linearly, and that is a claim about independence',
          'Adding them linearly would be the worst case, in which every error happens to conspire. In quadrature is what independent random errors actually do, and it is why ten equally bad measurements average to √10 better rather than to no better. Correlate them and the cross terms come back — which is exactly what a systematic error is, and why it does not average away.'),
        drvStep('route 2 — draw the inputs and push them through',
          `${dv('x')}ᵢ ${dop('~')} ${dfn('N')}(${dv('x')}ᵢ, σᵢ), &nbsp; look at ${dv('f')}(${dv('x')})`,
          fmtNum(C.mc.n, 7) + ' draws give ' + fmtSig(C.mc.sd, 6) +
          ', with a standard error on that of ' + fmtSig(C.mc.seSd, 3)),
        drvStep('and the two are compared against the sampling error, not against a guess',
          `|σ_lin ${dop('−')} σ_MC| / SE(σ_MC)`,
          fmtNum(C.sigmas, 4) + ' standard errors' +
          (C.sigmas < 3 ? ' — consistent; the difference is the sample'
                        : ' — a real disagreement, and the linearisation is what is wrong')),
        drvSay('that comparison is the point, and it needs the standard error to mean anything',
          'A Monte Carlo standard deviation is itself uncertain, by about σ/√(2N). Reporting "they differ by 1%" without that number says nothing: at ten thousand draws 1% is noise and at ten million it is a defect. This is the same discipline as printing a residual with its scale — a difference is meaningless until you know what it should be compared against.'),
        drvSay(C.sigmas < 3 ? 'here the routes agree, so the linearisation is doing no harm'
                            : 'here they do not, and the bias tells you which way',
          C.sigmas < 3
            ? 'Which is the normal state of affairs: for σ small compared with the scale over which ∂f/∂x changes, the dropped quadratic term is genuinely negligible. Raise the ± multiplier until it is not.'
            : 'The sampled mean sits ' + fmtSig(C.bias, 3) + ' away from f evaluated at the nominal point, and that offset is the second derivative showing itself: E[f(x)] is not f(E[x]) for a curved f. A symmetric error bar cannot describe a skewed distribution, and no amount of care in computing it will help.'),
        drvSay('which variable to improve, which is the question the whole calculation is for',
          'The shares below the histogram are each term\'s contribution to the variance, and they sum to one. ' +
          (N.vars[dominant] ? 'Here ' + N.vars[dominant].n + ' supplies ' +
            fmtNum(100 * C.lin.share[dominant], 3) + '% of it, so it is the one to measure better; halving any other would move the total by almost nothing.' : ''))
      ],
      note:'Both routes assume the inputs are independent and Gaussian. The first also assumes f is ' +
           'linear over a few σ; the second does not, which is the only difference between them.'
    };
  },
  readout(st){
    const N = this.cur(st), C = N.C;
    const rows = N.vars.map((v, i) => kv(v.n + (v.u ? ' (' + v.u + ')' : ''),
      fmtSig(v.v, 6) + ' ± ' + fmtSig(v.s * st.blow, 3) +
      '  <span style="color:var(--c-dim)">— ∂f/∂' + v.n + ' = ' + fmtSig(C.lin.grad[i], 4) +
      ', share ' + fmtNum(100 * C.lin.share[i], 3) + '%</span>')).join('');
    const u = N.unit ? ' ' + N.unit : '';
    return `<div class="card tight"><div class="ttl">${N.name} — ${esc(N.ex)}</div>
      ${rows}
      ${kv('f at the nominal values', fmtSig(C.lin.f0, 8) + u)}
      ${N.truth === null ? '' : kv('an independent value', fmtSig(N.truth, 8) + u + ' — ' + N.truthWhy)}
      ${N.truth === null ? '' : kv('measurement against it', fmtAgree(C.lin.f0, N.truth, N.unit))}
      ${N.truth === null ? '' : kv('is that within the error bar?', C.lin.sd > 0
          ? fmtNum(Math.abs(C.lin.f0 - N.truth) / C.lin.sd, 3) + ' error bars away'
          : 'no error bar to compare against')}
      <p class="help">${N.why}</p>
    </div>
    <div class="card tight"><div class="ttl">The two error bars</div>
      ${kv('first-order propagation', fmtSig(C.lin.sd, 8) + u)}
      ${kv('by sampling', fmtSig(C.mc.sd, 8) + u + '  ± ' + fmtSig(C.mc.seSd, 3) + ' (the sampling error on it)')}
      ${kv('the two, compared', fmtAgree(C.lin.sd, C.mc.sd, N.unit))}
      ${kv('in units of the sampling error', fmtNum(C.sigmas, 4) + ' — ' +
          (C.sigmas < 3 ? 'consistent, so nothing is wrong with the linearisation here'
                        : 'a real disagreement, and it is the linearisation that is wrong'))}
      ${kv('bias the linear route cannot see', fmtSig(C.bias, 4) + u +
          '  <span style="color:var(--c-dim)">— sampled mean minus f at the nominal point</span>')}
      ${C.mc.dropped ? kv('draws that gave no number', fmtNum(C.mc.dropped, 6) +
          ' — f was not finite there, and they are excluded rather than counted as zero') : ''}
      <p class="help">Raise the ± multiplier and watch the last three rows. A linear f keeps them at
      zero however far you push it; a curved one does not, and the bias is the sign of the curvature
      made visible. Raise the sample count instead and the sampling error falls as 1/√N while a real
      disagreement stays exactly where it is — the same "change the resolution and see what moves"
      test the signal wing uses to tell a truncation from an alias.</p>
    </div>`;
  },
  chip(st){
    const C = this.cur(st).C;
    return `<div class="k">σ, two ways</div>
      <div style="color:var(--c-pos)">${fmtSig(C.lin.sd, 4)}</div>
      <div style="color:var(--c-warn)">${fmtSig(C.mc.sd, 4)}</div>`;
  },
  legend(){
    return [['var(--c-pos)', 'the sampled distribution of f'],
            ['var(--c-warn)', 'the Gaussian the first-order formula predicts'],
            ['var(--c-grad)', 'f at the nominal values'],
            ['var(--c-neg)', 'the sampled mean, where it differs']];
  },
  dockLegend:true
};

/* ---- the histogram, with the linear Gaussian drawn on top ---------------- */
function unPropHist(ctx, N, x, y, w, h){
  const C = N.C, S = C.mc.sample;
  const B = ctFitBox(x, y, w, h);
  if(!S.length || !(C.mc.sd > 0) && !(C.lin.sd > 0)){
    const P0 = mkPlot(B.px, B.py, B.pw, B.ph, -1, 1, 0, 1);
    plotFrame(ctx, P0, 'f', 'how often', 'nothing is uncertain, so f has one value');
    return;
  }
  const wide = Math.max(C.lin.sd, C.mc.sd, 1e-300);
  const c = C.lin.f0;
  let lo = c - 4.2 * wide, hi = c + 4.2 * wide;
  /* a heavy-tailed sample can put a handful of draws a thousand widths out and
     an axis fitted to the extremes shows one spike in an empty box. Fit to the
     quantiles instead and say so. */
  const st2 = pbStats(S);
  lo = Math.min(lo, st2.q1 - 2 * (st2.q3 - st2.q1));
  hi = Math.max(hi, st2.q3 + 2 * (st2.q3 - st2.q1));
  if(!(hi > lo)){ lo = c - 1; hi = c + 1; }
  const Hh = pbHist(S, lo, hi, 46);
  const peak = Math.max.apply(null, Hh.density.concat([1 / (C.lin.sd * Math.sqrt(2 * Math.PI))]));
  const P = mkPlot(B.px, B.py, B.pw, B.ph, lo, hi, 0, peak * 1.12);
  plotFrame(ctx, P, 'f' + (N.unit ? '  (' + N.unit + ')' : ''), 'probability density',
            'what f actually does, against what the formula says it does');
  ctGrid(ctx, P);
  Hh.centres.forEach((cx, i) => {
    const d = Hh.density[i];
    if(!(d > 0)) return;
    ctFill(ctx, P, [{ x:cx - Hh.w / 2, y:0 }, { x:cx + Hh.w / 2, y:0 },
                    { x:cx + Hh.w / 2, y:d }, { x:cx - Hh.w / 2, y:d }], rgbCss(TH.pos, 0.42));
  });
  if(C.lin.sd > 0){
    const g = v => Math.exp(-0.5 * Math.pow((v - c) / C.lin.sd, 2)) / (C.lin.sd * Math.sqrt(2 * Math.PI));
    plotCurve(ctx, P, g, 240, rgbCss(TH.warn), 2.4);
  }
  ctPath(ctx, P, [{ x:c, y:0 }, { x:c, y:peak * 1.1 }], rgbCss(TH.grad), 1.8, [5, 4]);
  if(Math.abs(C.bias) > 0.02 * Math.max(C.mc.sd, 1e-300))
    ctPath(ctx, P, [{ x:C.mc.mean, y:0 }, { x:C.mc.mean, y:peak * 1.1 }], rgbCss(TH.neg), 1.8, [3, 3]);
  const out = S.filter(v => v < lo || v > hi).length;
  if(out)
    ctText(ctx, P.px + P.pw - 8, P.py + 12,
           fmtNum(out, 6) + ' of ' + fmtNum(S.length, 6) + ' draws are outside this window',
           rgbCss(TH.dim), '10px ' + FONT_UI, 'right', 'top');
}

/* ---- who owns the variance ---------------------------------------------- */
function unPropShare(ctx, N, x, y, w, h){
  const C = N.C, n = N.vars.length;
  ctText(ctx, x, y - 6, 'share of the variance — this is the row that says what to measure better',
         rgbCss(TH.dim), '10px ' + FONT_UI, 'left', 'bottom');
  const bh = Math.min(26, h - 16);
  let cx = x;
  const cols = [TH.pos, TH.warn, TH.curl, TH.grad, TH.neg];
  N.vars.forEach((v, i) => {
    const frac = C.lin.share[i];
    if(!(frac > 0)) return;
    const bw = frac * w;
    ctx.save();
    ctx.fillStyle = rgbCss(cols[i % cols.length], 0.55);
    ctx.fillRect(cx, y, bw, bh);
    ctx.strokeStyle = rgbCss(cols[i % cols.length]); ctx.lineWidth = 1.4;
    ctx.strokeRect(cx, y, bw, bh);
    ctx.restore();
    if(bw > 42)
      ctText(ctx, cx + bw / 2, y + bh / 2, v.n + '  ' + fmtNum(100 * frac, 3) + '%',
             rgbCss(TH.text), '600 10px ' + FONT_UI, 'center', 'middle');
    cx += bw;
  });
  if(n > 0 && h > bh + 14)
    ctText(ctx, x, y + bh + 4,
           'the shares sum to 1 by construction — halving the biggest is the only change that moves the total',
           rgbCss(TH.faint), '9px ' + FONT_UI, 'left', 'top');
}
