/* ============================================================================
   4p · LAPLACE TRANSFORMS, DELTA FUNCTIONS AND CONVOLUTION
   The transform is computed by quadrature from whatever function you supply —
   typed or drawn — so the table can be checked against it rather than trusted.
   ============================================================================ */

STAGES.ltTransform = {
  title:'The Laplace transform',
  derive(st){
    const T = LT_TABLE[st.key];
    const n = v => fmtNum(v, 6);
    return {
      title:'Trading calculus for algebra by integrating against an exponential',
      steps:[
        drvSay('the motive is entirely practical',
          'Differential equations are hard and algebraic equations are easy. If some operation turned differentiation into multiplication, every linear differential equation would become a polynomial one. The Laplace transform is that operation, and the price is an integral at the start and an inversion at the end.'),
        drvStep('the definition',
          `${dv('F')}(${dv('s')}) ${dop('=')} ∫₀^∞ ${dv('f')}(${dv('t')}) ${dop('e')}^(−${dv('s')}${dv('t')}) d${dv('t')}`,
          `at s = ${n(st.s)} the panel evaluates this by quadrature and prints it against the closed form`),
        drvSay('why the lower limit is zero, and why that is a feature',
          'The transform sees only t ≥ 0. That suits initial-value problems exactly: a system is switched on at t = 0 and we ask what it does afterwards. The transform is built for causal problems, and the initial conditions enter the algebra automatically rather than being imposed at the end.'),
        drvStep('now integrate the derivative by parts',
          `∫₀^∞ ${dv('f')}′ ${dop('e')}^(−${dv('s')}${dv('t')}) d${dv('t')} ${dop('=')} [${dv('f')}${dop('e')}^(−${dv('s')}${dv('t')})]₀^∞ ${dop('+')} ${dv('s')}∫₀^∞ ${dv('f')} ${dop('e')}^(−${dv('s')}${dv('t')}) d${dv('t')}`,
          'the boundary term at infinity dies provided s is large enough'),
        drvStep('which is the identity the whole method rests on',
          `ℒ{${dv('f')}′} ${dop('=')} ${dv('s')}${dv('F')}(${dv('s')}) ${dop('−')} ${dv('f')}(0)`,
          'differentiation has become multiplication by s, and the initial value has appeared by itself'),
        drvSay('that stray f(0) is not a nuisance — it is the point',
          'The initial condition is absorbed into the algebra at the moment of transforming. There is no separate step where constants of integration are pinned down afterwards; the transform of an initial-value problem already knows its initial values.'),
        drvStep('applying it twice handles second-order equations',
          `ℒ{${dv('f')}″} ${dop('=')} ${dv('s')}²${dv('F')} ${dop('−')} ${dv('s')}${dv('f')}(0) ${dop('−')} ${dv('f')}′(0)`,
          'so a second-order ODE becomes a linear equation in F(s)'),
        drvStep('solve algebraically, then transform back',
          `${dv('F')}(${dv('s')}) ${dop('=')} ${dfrac('known stuff', dv('a') + dv('s') + '² + ' + dv('b') + dv('s') + ' + ' + dv('c'))}`,
          T ? esc(T.name) + ' — the panel compares the numerical transform with the table entry' : ''),
        drvSay('and the denominator is the characteristic polynomial again',
          'The same quadratic as+ bs + c that the exponential-guess method produced. Its roots are the poles of F(s), and each pole contributes an exponential to the answer — a pole at −α gives e^(−αt), a complex pair gives a damped oscillation. Where the poles sit is the whole behaviour of the system.'),
        drvStep('inversion is partial fractions plus a lookup table',
          `${dfrac('1', '(' + dv('s') + '+α)(' + dv('s') + '+β)')} ${dop('→')} split into simple poles`,
          'which is why partial fractions, a piece of school algebra, is a core technique here')
      ],
      note:'The transform integral is computed numerically at the chosen s and printed beside the closed form from the table, with the difference. You may also sketch your own f(t) and transform that — the quadrature does not care whether the function has a name.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key === undefined ? 3 : o.key;
    st.s = o.s || 2;
    st.sk = skNew(0, 8, 128, LT_TABLE[st.key].f);
    st.custom = false;
  },
  controls(){
    const st = ST;
    return ctSeg('ltK', String(st.key), LT_TABLE.map((e, i) => [String(i), e.n])) +
      ctlRow('s', ctlSlider('ltS', 0.25, 6, 0.01, st.s)) +
      `<div class="row wrap">${ctBtn('ltDraw', 'draw f(t) yourself')}</div>
      <p class="help">The transform is an integral against a decaying exponential:
      <b>F(s) = ∫₀<sup>∞</sup> f(t) e<sup>−st</sup> dt</b>. Raising s weights the early part of f
      more heavily, so F(s) is a kind of running summary of the function's size and growth. The
      integral only converges when s outruns the growth of f — that is the region of convergence,
      and it is why the transform of e<sup>at</sup> carries the condition s &gt; a.</p>
      <p class="help"><b>Drag on the upper strip</b> to draw any f(t) you like and watch F(s)
      follow. The point of the transform is what it does to derivatives:
      <b>ℒ{f′} = sF(s) − f(0)</b>. Differentiation becomes multiplication, so a differential
      equation becomes an algebraic one.</p>`;
  },
  wire(){
    ctWireSeg('ltK', v => { ST.key = +v; ST.custom = false; skFill(ST.sk, LT_TABLE[+v].f); });
    wireSlider('ltS', () => ST.s, v => { ST.s = v; }, v => fmtNum(+v, 3));
    ctWireBtn('ltDraw', () => { ST.custom = true; });
  },
  pick(st, sx, sy, phase){
    if(!st.Pf) return;
    if(skPick(st.sk, st.Pf, sx, sy, phase)) st.custom = true;
  },
  /* The quadrature transforms the PRESET ITSELF, not the 128-point sketch of
     it. The sketch exists so a reader can draw; sampling a preset through it
     first meant the "two completely different routes" shared a piecewise
     interpolation whose O(h²) error (≈6×10⁻⁴ on the step's smeared jump) was
     what the difference row actually measured. Custom stays the sketch — that
     IS the reader's function. */
  fn(st){ const e = LT_TABLE[st.key]; return st.custom ? skFn(st.sk) : t => e.f(t); },
  brk(st){ return st.custom ? null : LT_TABLE[st.key].brk; },
  frame(st, dt, ctx, W, H){
    const f = this.fn(st);
    const half = (H - 150) / 2;
    /* top: f(t) and the weighted integrand */
    const Pf = mkPlot(80, 55, W - 150, half, 0, 8, -1.6, 2.4);
    st.Pf = Pf;
    plotFrame(ctx, Pf, 't', 'f(t)', 'the function — drag to draw your own');
    plotZeroY(ctx, Pf);
    plotTicksX(ctx, Pf, [0, 2, 4, 6, 8], v => String(v));
    plotCurve(ctx, Pf, t => f(t) * Math.exp(-st.s * t), 400, rgbCss(TH.warn), 2,
              rgbCss(TH.warn, 0.22));
    skPaint(ctx, Pf, st.sk, rgbCss(TH.grad), 2.6);
    /* bottom: F(s) */
    const Ps = mkPlot(80, 95 + half, W - 150, half, 0.25, 6, -0.5, 3);
    const Fv = s => ltTransform(f, s, 30, 1500, this.brk(st));
    plotFrame(ctx, Ps, 's', 'F(s)', 'its transform, computed by quadrature at every s');
    plotZeroY(ctx, Ps);
    plotTicksX(ctx, Ps, [1, 2, 3, 4, 5, 6], v => String(v));
    plotCurve(ctx, Ps, Fv, 90, rgbCss(TH.curl), 2.6);
    probeLine(ctx, Ps, st.s, 's');
    ctDot(ctx, Ps, st.s, Fv(st.s), 5, rgbCss(TH.pos), rgbCss(TH.bg));
    stageNote(ctx, 'the shaded area under f(t)e^(−st) is F(s) — slide s and watch the weighting bite', W, H);
  },
  readout(st){
    const f = this.fn(st);
    const num = ltTransform(f, st.s, 40, 4000, this.brk(st));
    const e = LT_TABLE[st.key];
    const exact = st.custom ? null : e.F(st.s);
    return `<div class="card tight"><div class="ttl">At s = ${fmtNum(st.s, 4)}</div>
      ${kv('F(s) by quadrature', fmtNum(num, 8))}
      ${exact !== null ? kv('F(s) from the table', fmtNum(exact, 8)) : ''}
      ${exact !== null ? kv('difference', fmtAgree(num, exact)) : ''}
      ${kv('region of convergence', st.custom ? 'depends on your curve' : e.roc)}
      ${st.custom ? '' : kv('the pair', e.tex)}
      <p class="help">${st.custom
        ? 'A drawn curve has no closed form, and the transform does not care — it is an integral, and the integral is what is computed here.'
        : 'The table entry and the numerical integral are computed by completely different routes. Their agreement is the check.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Why anyone bothers</div>
      ${kv('ℒ{f′}', 's F(s) − f(0)')}
      ${kv('ℒ{f″}', 's² F(s) − s f(0) − f′(0)')}
      ${kv('ℒ{f ∗ g}', 'F(s) · G(s)')}
      <p class="help">Each of these turns an operation of calculus into one of algebra. That is the
      whole method: transform the differential equation, solve the resulting algebraic equation for
      F(s), and transform back. The initial conditions enter automatically rather than being fitted
      afterwards, which is why the method is so well suited to problems that start from rest and are
      suddenly kicked.</p>
    </div>`;
  },
  chip(st){
    const num = ltTransform(this.fn(st), st.s, 40, 2000, this.brk(st));
    return `<div class="k">Laplace</div><div>s = ${fmtNum(st.s, 3)}</div>
      <div style="color:var(--c-curl)">F = ${fmtNum(num, 5)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'f(t)'], ['var(--c-warn)', 'f(t)e^(−st) — the integrand'],
                    ['var(--c-curl)', 'F(s)']]; },
  dockLegend:true
};

/* ---- 2 · convolution and the impulse response ----------------------------- */
STAGES.ltConv = {
  title:'Convolution & the impulse response',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why one experiment determines the response to every possible input',
      steps:[
        drvSay('the claim, which sounds too strong',
          'Hit a linear system once, sharply, and record what it does. That single recording is enough to predict its response to any input whatsoever — a step, a sine, a recorded signal, anything. For a linear time-invariant system this is exactly true, and the reason is two properties and nothing else.'),
        drvStep('linearity: responses add',
          `input ${dv('a')} ${dop('+')} ${dv('b')} ${dop('⇒')} output ${dv('A')} ${dop('+')} ${dv('B')}`,
          'so an input built from pieces has an output built from the same pieces'),
        drvStep('time invariance: delay in, delay out',
          `input delayed by τ ${dop('⇒')} output delayed by τ`,
          'the system has no clock of its own — only elapsed time since the input matters'),
        drvSay('now chop any input into a row of impulses',
          'Approximate the input by a sequence of narrow spikes, one per time step, each scaled by the input\'s height there. Time invariance says each spike produces a shifted copy of the impulse response. Linearity says the outputs add. Take the limit and the sum becomes an integral.'),
        drvStep('and that integral is the convolution',
          `${dv('y')}(${dv('t')}) ${dop('=')} ∫₀^t ${dv('h')}(${dv('t')}{−}τ)${dv('u')}(τ) dτ`,
          `at t = ${n(st.t)} the panel computes this and checks it against a direct RK4 integration`),
        drvSay('read the integrand as a memory weighting',
          'h(t − τ) is how much the system still remembers of an input applied at time τ. Recent inputs, with small t − τ, are weighted by the early part of the impulse response; distant ones by its tail. A system that forgets quickly has a short h, and its output depends only on the recent past.'),
        drvStep('the upper limit t is causality, not convention',
          `∫₀^t rather than ∫₀^∞`,
          'the system cannot respond to input it has not received yet'),
        drvStep('and under the Laplace transform, all of this becomes multiplication',
          `ℒ{${dv('h')} ${dop('*')} ${dv('u')}} ${dop('=')} ${dv('H')}(${dv('s')})${dv('U')}(${dv('s')})`,
          'H(s) is the transfer function — the transform of the impulse response'),
        drvSay('which is why transforms are worth the trouble',
          'A convolution integral, which is awkward to compute and hard to reason about, becomes an ordinary product. Cascade two systems and their transfer functions simply multiply. This is the reason engineers work in the s-domain and only return to time at the very end.')
      ],
      note:'The impulse used here is a Gaussian mollifier rather than an idealised spike, because a true delta is not a function and cannot be integrated numerically. Its width is chosen so the sifting property holds to 10⁻⁴, which the unit tests pin.'
    };
  },
  drag:true,
  enter(st, o){
    st.a = 1; st.b = o.b === undefined ? 0.5 : o.b; st.c = o.c === undefined ? 4 : o.c;
    st.t = o.t || 3;
    st.input = o.input || 'step';
    st.sk = skNew(0, 10, 128, t => (t > 1 && t < 2 ? 1 : 0));
  },
  controls(){
    const st = ST;
    return ctSeg('cvI', st.input, [['step', 'a step'], ['pulse', 'a pulse'], ['sine', 'a sinusoid'], ['draw', 'draw it']]) +
      ctlRow('damping b', ctlSlider('cvB', 0, 4, 0.02, st.b)) +
      ctlRow('stiffness c', ctlSlider('cvC', 0.5, 16, 0.05, st.c)) +
      ctlRow('time t', ctlSlider('cvT', 0.1, 10, 0.02, st.t)) +
      `<p class="help">A linear system is completely described by what it does to a single sharp
      kick — its <b>impulse response</b> h(t). The response to <i>any</i> input is then the
      convolution <b>(x ∗ h)(t) = ∫₀ᵗ x(τ) h(t−τ) dτ</b>: chop the input into impulses, let each
      produce its own decaying response, and add them up. That sum is the integral.</p>
      <p class="help">Choose "draw it" and <b>sketch your own input</b> on the upper strip. The
      output is recomputed as a genuine convolution — no closed form is used, because for a drawn
      input there is none.</p>`;
  },
  wire(){
    ctWireSeg('cvI', v => { ST.input = v; });
    wireSlider('cvB', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('cvC', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    /* J12: a typed t may exceed the slider, but never the picture — all three
       panels plot 0..10 s, and t = 29.8 put the probe line off every one of
       them while the middle panel showed a fully decayed h as blank. */
    wireSlider('cvT', () => ST.t, v => { ST.t = v; }, v => fmtNum(+v, 3) + ' s',
      { lo: 0.1, hi: 10, why: 'Held at the edge of the plotted window — the three panels run 0 to 10 s, and an output at a time the picture cannot show would be a number with no plot under it.' });
  },
  pick(st, sx, sy, phase){
    if(st.input === 'draw' && st.Px) skPick(st.sk, st.Px, sx, sy, phase);
  },
  xin(st){
    if(st.input === 'step')  return t => (t >= 0 ? 1 : 0);
    if(st.input === 'pulse') return t => (t > 1 && t < 2 ? 1 : 0);
    if(st.input === 'sine')  return t => Math.sin(2 * t);
    return skFn(st.sk);
  },
  frame(st, dt, ctx, W, H){
    const H0 = ltTransfer(st.a, st.b, st.c);
    const x = this.xin(st);
    const third = (H - 190) / 3;
    const Px = mkPlot(80, 50, W - 150, third, 0, 10, -1.6, 1.9);
    st.Px = Px;
    plotFrame(ctx, Px, null, 'input', 'the input x(t)' + (st.input === 'draw' ? ' — drag to draw' : ''));
    plotZeroY(ctx, Px);
    if(st.input === 'draw') skPaint(ctx, Px, st.sk, rgbCss(TH.grad), 2.6);
    else plotCurve(ctx, Px, x, 400, rgbCss(TH.grad), 2.6);
    /* the flipped, shifted copy that convolution slides along */
    const Ph = mkPlot(80, 60 + third, W - 150, third, 0, 10, -0.6, 1.2);
    plotFrame(ctx, Ph, null, 'h(t−τ)', 'the impulse response, reflected and shifted to t');
    plotZeroY(ctx, Ph);
    plotCurve(ctx, Ph, tau => (tau <= st.t ? H0.impulse(st.t - tau) : 0), 400, rgbCss(TH.curl), 2.2);
    plotCurve(ctx, Ph, tau => (tau <= st.t ? x(tau) * H0.impulse(st.t - tau) : 0), 400,
              rgbCss(TH.warn), 1.8, rgbCss(TH.warn, 0.25));
    probeLine(ctx, Ph, st.t, 't');
    const Py = mkPlot(80, 70 + 2 * third, W - 150, third, 0, 10, -1.2, 1.6);
    plotFrame(ctx, Py, 't', 'output', 'the output — the running value of the shaded area');
    plotZeroY(ctx, Py);
    plotTicksX(ctx, Py, [0, 2, 4, 6, 8, 10], v => String(v));
    plotCurve(ctx, Py, tt => ltConvolve(x, H0.impulse, tt, 160), 130, rgbCss(TH.pos), 2.6);
    probeLine(ctx, Py, st.t, null);
    stageNote(ctx, 'the shaded overlap in the middle panel IS the output value at t — slide t and watch it sweep', W, H);
  },
  readout(st){
    const H0 = ltTransfer(st.a, st.b, st.c);
    const x = this.xin(st);
    const y = ltConvolve(x, H0.impulse, st.t, 600);
    const kind = H0.disc > 1e-9 ? 'overdamped' : H0.disc < -1e-9 ? 'underdamped' : 'critically damped';
    return `<div class="card tight"><div class="ttl">The system  y″ + b y′ + c y = x(t)</div>
      ${kv('natural frequency ω₀ = √c', fmtNum(H0.wn, 6))}
      ${kv('damping ratio ζ = b/2√c', fmtNum(H0.zeta, 6))}
      ${kv('regime', kind)}
      ${kv('transfer function H(s)', '1/(s² + ' + fmtNum(st.b, 3) + 's + ' + fmtNum(st.c, 3) + ')')}
      ${kv('output at t', fmtNum(y, 6))}
    </div>
    <div class="card tight"><div class="ttl">Convolution is multiplication, transformed</div>
      ${kv('|H(iω₀)| — gain at resonance', fmtNum(H0.gain(H0.wn), 5))}
      ${kv('phase there', fmtNum(H0.phase(H0.wn) * 180 / Math.PI, 4) + '°')}
      <p class="help">The theorem <b>ℒ{x ∗ h} = X(s)·H(s)</b> is the reason transfer functions are
      useful at all: a messy sliding integral in time becomes an ordinary product in s. Every filter,
      every control loop and every optical blur is this statement.</p>
      <p class="help">Note the phase at resonance is −90°, whatever the damping. That is not a
      coincidence — it is what "resonance" means for a second-order system, and it is how a
      resonant frequency is measured in practice when the peak is too flat to locate.</p>
    </div>`;
  },
  chip(st){
    const H0 = ltTransfer(st.a, st.b, st.c);
    return `<div class="k">convolution</div><div>t = ${fmtNum(st.t, 3)}</div>
      <div style="color:var(--c-pos)">y = ${fmtNum(ltConvolve(this.xin(st), H0.impulse, st.t, 300), 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'input x(t)'], ['var(--c-curl)', 'h(t−τ), reflected'],
                    ['var(--c-warn)', 'their product — the shaded area'], ['var(--c-pos)', 'output']]; },
  dockLegend:true
};
