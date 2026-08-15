/* ============================================================================
   4k · THE DIFFERENTIAL EQUATIONS WING
   Second-order linear equations: the characteristic roots and their three
   cases, nonhomogeneous forcing, the driven oscillator and resonance, and
   power-series solutions.

   Every closed form is drawn on top of an RK4 integration of the same equation.
   Where the two curves are indistinguishable, the algebra is right; where they
   part company, something is wrong — and the panel prints the largest gap.
   ============================================================================ */

/* ---- 1 · the homogeneous equation and its three cases --------------------- */
STAGES.odLinear = {
  title:'Second-order linear equations',
  derive(st){
    const n = v => fmtNum(v, 6);
    const disc = st.b * st.b - 4 * st.a * st.c;
    const w0 = Math.sqrt(st.c / st.a), z = st.b / (2 * Math.sqrt(st.a * st.c));
    return {
      title:'Why guessing an exponential solves the whole problem',
      steps:[
        drvSay('the guess is not luck — it is forced by the equation\'s shape',
          'The equation asks for a function whose second derivative, first derivative and self can cancel against one another. That requires all three to be the same shape, and the exponential is the only function that reproduces itself under differentiation. So e^(rt) is not a lucky guess; it is the only candidate.'),
        drvStep('substitute y = e^(rt) and every term keeps the factor',
          `${dv('a')}${dv('r')}²${dop('e')}^(rt) ${dop('+')} ${dv('b')}${dv('r')}${dop('e')}^(rt) ${dop('+')} ${dv('c')}${dop('e')}^(rt) ${dop('=')} 0`,
          `a = ${n(st.a)}, b = ${n(st.b)}, c = ${n(st.c)}`),
        drvStep('the exponential is never zero, so divide it out',
          `${dv('a')}${dv('r')}² ${dop('+')} ${dv('b')}${dv('r')} ${dop('+')} ${dv('c')} ${dop('=')} 0`,
          'a differential equation has become a quadratic — this is the whole method'),
        drvSay('and the quadratic wing already told us what happens next',
          'Three cases, decided by the discriminant, exactly as for any quadratic. What is new is that each case has a physical meaning: two real roots is overdamping, a repeated root is critical damping, and a complex pair is oscillation. The algebra was settled long ago; here it acquires a physics.'),
        drvStep('the discriminant decides which case',
          `${dv('b')}² ${dop('−')} 4${dv('a')}${dv('c')}`,
          `${n(disc)} — ${disc > 1e-12 ? 'two real roots, overdamped' : disc < -1e-12 ? 'a complex pair, oscillatory' : 'a repeated root, critically damped'}`),
        drvSay('when the roots are complex, the answer is still real',
          'e^((−α+iω)t) is complex, and so is its partner. But the equation has real coefficients, so the two roots are conjugates and their sum and difference are real. Euler\'s formula turns that combination into e^(−αt)(C₁cos ωt + C₂sin ωt) — the oscillation was hiding inside the exponential all along.'),
        drvStep('two solutions, and every solution is a combination of them',
          `${dv('y')} ${dop('=')} ${dv('C')}₁${dv('y')}₁ ${dop('+')} ${dv('C')}₂${dv('y')}₂`,
          'linearity: the solution set is a two-dimensional vector space'),
        drvSay('that dimension is exactly the order of the equation',
          'A second-order equation needs two initial conditions to pin down a solution, and it supplies exactly two independent basis solutions to spend them on. This is the linear-algebra wing\'s theory applied to a space whose vectors are functions — and the Wronskian is the determinant that tests independence.'),
        drvStep('the Wronskian, and Abel\'s theorem',
          `${dv('W')}(${dv('t')}) ${dop('=')} ${dv('W')}(0)${dop('e')}^(−(${dv('b')}/${dv('a')})${dv('t')})`,
          'the panel computes W at t = 0 and t = 3 and checks this — an exponential is never zero, so independence can never fail partway'),
        drvStep('and the physical parameters are read off the roots',
          `ω₀ ${dop('=')} √(${dv('c')}/${dv('a')}), &nbsp; ζ ${dop('=')} ${dfrac(dv('b'), '2√(' + dv('a') + dv('c') + ')')}`,
          `ω₀ = ${n(w0)}, ζ = ${n(z)}, Q = ${n(1 / (2 * z))}`)
      ],
      note:'The closed-form solution is checked against an RK4 integration of the original equation at every step, and the panel prints the largest gap over the whole interval. Agreement to many digits over fourteen time units is what makes the exponential guess a derivation rather than a claim.'
    };
  },
  enter(st, o){
    st.a = 1;
    st.b = o.b === undefined ? 0.6 : o.b;
    st.c = o.c === undefined ? 4 : o.c;
    st.y0 = o.y0 === undefined ? 1 : o.y0;
    st.v0 = o.v0 === undefined ? 0 : o.v0;
    st.show = Object.assign({ rk4:true, basis:true, phase:true }, o.show || {});
  },
  controls(){
    const st = ST, R0 = odRoots(st.a, st.b, st.c);
    return ctlRow('b  (damping)', ctlSlider('odLb', 0, 6, 0.02, st.b)) +
      ctlRow('c  (stiffness)', ctlSlider('odLc', 0.05, 9, 0.05, st.c)) +
      ctlRow('y(0)', ctlSlider('odLy', -2, 2, 0.02, st.y0)) +
      ctlRow("y′(0)", ctlSlider('odLv', -4, 4, 0.02, st.v0)) +
      `<div class="row wrap">${ctChk('odLrk', 'the RK4 integration, over the top', st.show.rk4)}
        ${ctChk('odLb2', 'the two basis solutions', st.show.basis)}
        ${ctChk('odLph', 'the phase portrait', st.show.phase)}</div>
      <p class="help"><b>y″ + ${fmtNum(st.b, 3)} y′ + ${fmtNum(st.c, 3)} y = 0</b>. Try
      <b>y = e^(rt)</b>: every term picks up a factor of e^(rt), which never vanishes, so it divides out
      and leaves the <b>characteristic equation</b> <b>ar² + br + c = 0</b>. A differential equation has
      become a quadratic, and its discriminant decides everything.</p>
      <p class="help"><b>Currently: ${OD_CASE_NAME[R0.kind]}.</b> ${
        R0.kind === 'distinct'
          ? 'Two real roots give two decaying exponentials and no oscillation at all — the system creeps back to rest without overshooting.'
          : R0.kind === 'repeated'
          ? 'The two roots have collided, so e^(rt) supplies only one solution and a second copy would be useless. The missing one is <b>t·e^(rt)</b> — and that stray t is forced on us by the need for two independent solutions to meet two initial conditions.'
          : 'A complex pair. Euler\'s formula turns e^((α±iω)t) into e^(αt)(cos ωt ± i sin ωt), and taking real and imaginary parts gives two real solutions. The real part α is the decay rate; the imaginary part ω is the frequency it rings at.'}</p>
      <p class="help">Slide the damping through the critical value <b>b = 2√(ac) = ${fmtNum(2 * Math.sqrt(st.a * st.c), 4)}</b>
      and watch the roots on the complex plane collide on the real axis and split apart. That collision is
      the boundary between ringing and not ringing, and it is where a car suspension or a door closer is
      tuned to sit.</p>`;
  },
  wire(){
    wireSlider('odLb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('odLc', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    wireSlider('odLy', () => ST.y0, v => { ST.y0 = v; }, v => fmtNum(+v, 3));
    wireSlider('odLv', () => ST.v0, v => { ST.v0 = v; }, v => fmtNum(+v, 3));
    ctWireChk('odLrk', v => { ST.show.rk4 = v; });
    ctWireChk('odLb2', v => { ST.show.basis = v; });
    ctWireChk('odLph', v => { ST.show.phase = v; });
  },
  frame(st, dt, ctx, W, H){
    const S = odHomog(st.a, st.b, st.c, st.y0, st.v0);
    const T = 14;
    const num = odRK4(st.a, st.b, st.c, () => 0, st.y0, st.v0, 0, T, 3000);
    let lo = -1.4, hi = 1.4;
    for(let i = 0; i < num.ys.length; i += 5){ lo = Math.min(lo, num.ys[i]); hi = Math.max(hi, num.ys[i]); }
    const pad = (hi - lo) * 0.12;
    const wide = st.show.phase ? W * 0.62 : W;
    const P = mkPlot(72, 46, wide - 118, H - 132, 0, T, lo - pad, hi + pad);
    plotFrame(ctx, P, 't', 'y(t)', `y″ + ${fmtNum(st.b, 3)}y′ + ${fmtNum(st.c, 3)}y = 0`);
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [0, T / 4, T / 2, 3 * T / 4, T], v => fmtNum(v, 3));
    /* the exponential envelope, which is what the real part of the roots means */
    const R0 = S.R;
    if(R0.kind === 'complex' && S.amp !== undefined){
      for(const s of [1, -1])
        plotCurve(ctx, P, t => s * S.amp * Math.exp(R0.alpha * t), 300, rgbCss(TH.faint, 0.8), 1.3);
    }
    if(st.show.basis){
      /* the two independent solutions, each scaled to be visible */
      const b1 = R0.kind === 'distinct' ? (t => Math.exp(R0.r1 * t))
        : R0.kind === 'repeated' ? (t => Math.exp(R0.r1 * t))
        : (t => Math.exp(R0.alpha * t) * Math.cos(R0.omega * t));
      const b2 = R0.kind === 'distinct' ? (t => Math.exp(R0.r2 * t))
        : R0.kind === 'repeated' ? (t => t * Math.exp(R0.r1 * t))
        : (t => Math.exp(R0.alpha * t) * Math.sin(R0.omega * t));
      plotCurve(ctx, P, t => S.C1 * b1(t), 400, rgbCss(TH.pos, 0.6), 1.5);
      plotCurve(ctx, P, t => S.C2 * b2(t), 400, rgbCss(TH.curl, 0.6), 1.5);
    }
    if(st.show.rk4){
      ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 4.2;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      for(let i = 0; i < num.ys.length; i += 2){
        const X = P.X(num.ts[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, num.ys[i])));
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    plotCurve(ctx, P, S.y, 700, rgbCss(TH.grad), 2.2);
    if(st.show.phase){
      /* the roots on the complex plane, and the phase portrait beneath */
      const Q = mkPlot(wide + 24, 46, W - wide - 60, (H - 150) / 2, -4, 2, -3.2, 3.2);
      plotFrame(ctx, Q, 'Re r', 'Im r', 'the characteristic roots');
      plotZeroY(ctx, Q);
      plotTicksX(ctx, Q, [-4, -2, 0, 2], v => String(v));
      ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Q.X(0), Q.py); ctx.lineTo(Q.X(0), Q.py + Q.ph); ctx.stroke();
      const marks = R0.kind === 'complex'
        ? [{ x:R0.alpha, y:R0.omega }, { x:R0.alpha, y:-R0.omega }]
        : [{ x:R0.r1, y:0 }, { x:R0.r2, y:0 }];
      for(const m of marks){
        ctx.fillStyle = rgbCss(R0.kind === 'complex' ? TH.curl : TH.pos);
        ctx.beginPath(); ctx.arc(Q.X(Math.max(Q.x0, Math.min(Q.x1, m.x))), Q.Y(Math.max(Q.y0, Math.min(Q.y1, m.y))), 5.5, 0, 6.2832);
        ctx.fill();
      }
      ctText(ctx, Q.px + Q.pw / 2, Q.py + Q.ph + 32, OD_CASE_NAME[R0.kind],
        rgbCss(TH.dim), '600 11px ' + FONT_UI, 'center');
      /* phase portrait: y against y' */
      let ph = 0;
      for(let i = 0; i < num.ys.length; i += 5) ph = Math.max(ph, Math.abs(num.ys[i]), Math.abs(num.vs[i]) / 2);
      const Z = mkPlot(wide + 24, 46 + (H - 150) / 2 + 56, W - wide - 60, (H - 150) / 2, -ph * 1.2, ph * 1.2, -ph * 2.4, ph * 2.4);
      plotFrame(ctx, Z, 'y', "y′", 'the phase portrait');
      plotZeroY(ctx, Z);
      ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Z.X(0), Z.py); ctx.lineTo(Z.X(0), Z.py + Z.ph); ctx.stroke();
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2;
      ctx.beginPath();
      for(let i = 0; i < num.ys.length; i += 2){
        const X = Z.X(Math.max(Z.x0, Math.min(Z.x1, num.ys[i])));
        const Y = Z.Y(Math.max(Z.y0, Math.min(Z.y1, num.vs[i])));
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
      ctx.fillStyle = rgbCss(TH.warn);
      ctx.beginPath(); ctx.arc(Z.X(st.y0), Z.Y(st.v0), 4.5, 0, 6.2832); ctx.fill();
    }
    stageNote(ctx, 'thin line: the closed form · thick pale line: RK4 · they lie on top of each other', W, H);
  },
  readout(st){
    const S = odHomog(st.a, st.b, st.c, st.y0, st.v0);
    const R0 = S.R;
    const num = odRK4(st.a, st.b, st.c, () => 0, st.y0, st.v0, 0, 14, 6000);
    const gap = odMaxGap(S.y, num);
    const W0 = odWronskian(st.a, st.b, st.c, 0);
    return `<div class="card tight"><div class="ttl">The characteristic equation</div>
      ${kv('r² + ' + fmtNum(st.b, 3) + ' r + ' + fmtNum(st.c, 3) + ' = 0', '')}
      ${kv('discriminant b² − 4ac', fmtNum(R0.disc, 6))}
      ${kv('case', OD_CASE_NAME[R0.kind])}
      ${R0.kind === 'complex'
        ? kv('roots', `${fmtNum(R0.alpha, 5)} ± ${fmtNum(R0.omega, 5)} i`)
        : kv('roots', `${fmtNum(R0.r1, 5)}, ${fmtNum(R0.r2, 5)}`)}
      ${kv('basis', S.basis.join('  and  '))}
      ${kv('C₁', fmtNum(S.C1, 6))}${kv('C₂', fmtNum(S.C2, 6))}
      ${R0.kind === 'complex' ? kv('amplitude √(C₁²+C₂²)', fmtNum(S.amp, 6)) : ''}
      ${R0.kind === 'complex' ? kv('phase', fmtNum(S.phase, 5) + ' rad') : ''}
    </div>
    <div class="card tight"><div class="ttl">Checked against RK4</div>
      ${kv('largest gap over [0, 14]', fmtGap(gap, odGapScale(S.y, num)))}
      ${kv('RK4 steps', '6000')}
      ${kv('y(0) from the formula', fmtNum(S.y(0), 8))}
      ${kv("y′(0) from the formula", fmtNum(S.dy(0), 8))}
      ${kv('the initial conditions asked for', `${fmtNum(st.y0, 6)}, ${fmtNum(st.v0, 6)}`)}
      <p class="help">The constants C₁ and C₂ are not chosen — they are solved for, from the 2×2 system the
      two initial conditions impose. That system is invertible exactly when the <b>Wronskian</b> is
      nonzero, which is the precise meaning of "the two solutions are independent".</p>
    </div>
    <div class="card tight"><div class="ttl">The Wronskian, and Abel's formula</div>
      ${kv('W(0)', fmtNum(W0, 6))}
      ${kv('W(3), computed', fmtNum(odWronskian(st.a, st.b, st.c, 3), 6))}
      ${kv("Abel's W₀e^(−bt/a)", fmtNum(odAbel(st.a, st.b, W0, 3), 6))}
      ${kv('difference', fmtAgree(odWronskian(st.a, st.b, st.c, 3), odAbel(st.a, st.b, W0, 3)))}
      ${kv('ever zero?', Math.abs(W0) < 1e-12 ? 'yes — the solutions are dependent' : 'no — an exponential never vanishes')}
      <p class="help">Abel's formula says the Wronskian obeys its own first-order equation, <b>W′ =
      −(b/a)W</b>, whatever the solutions are. So it is either never zero or identically zero — there is no
      middle case. That is why checking independence at a single point is enough.</p>
    </div>
    <div class="card tight"><div class="ttl">Reading the physics off the roots</div>
      ${kv('natural frequency ω₀ = √(c/a)', fmtNum(odNaturalOmega(st.a, st.c), 6))}
      ${kv('damping ratio ζ = b/(2√(ac))', fmtNum(odDampingRatio(st.a, st.b, st.c), 6))}
      ${kv('quality factor Q = √(ac)/b', st.b > 1e-9 ? fmtNum(odQualityFactor(st.a, st.b, st.c), 6) : '∞ — undamped')}
      ${R0.kind === 'complex' ? kv('ringing frequency ω_d', fmtNum(R0.omega, 6)) : ''}
      ${R0.kind === 'complex' ? kv('and ω_d = ω₀√(1−ζ²)', fmtNum(odNaturalOmega(st.a, st.c) * Math.sqrt(Math.max(0, 1 - Math.pow(odDampingRatio(st.a, st.b, st.c), 2))), 6)) : ''}
      ${kv('decay time constant', st.b > 1e-9 ? fmtNum(2 * st.a / st.b, 5) : '∞')}
      <p class="help">ζ &lt; 1 rings, ζ = 1 is critical, ζ &gt; 1 creeps. Critical damping is the fastest
      return to equilibrium without overshoot, which is why it is the target for a car's shock absorbers, a
      galvanometer needle and the recoil mechanism of a gun.</p>
    </div>`;
  },
  chip(st){
    const R0 = odRoots(st.a, st.b, st.c);
    return `<div class="k">${OD_CASE_NAME[R0.kind].split(' — ')[1] || OD_CASE_NAME[R0.kind]}</div>
      <div style="color:var(--c-grad)">ζ = ${fmtNum(odDampingRatio(st.a, st.b, st.c), 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the closed-form solution'], ['var(--c-warn)', 'RK4, integrated numerically'],
                    ['var(--c-pos)', 'the first basis solution'], ['var(--c-curl)', 'the second'],
                    ['var(--faint)', 'the decay envelope']]; },
  dockLegend:true
};

/* ---- 2 · nonhomogeneous equations ------------------------------------------ */
STAGES.odNonhom = {
  title:'Nonhomogeneous equations',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Splitting the answer into what decays and what persists',
      steps:[
        drvSay('the structural fact that organises everything',
          'If y_p solves the forced equation and y_h solves the unforced one, then y_p + y_h solves the forced equation too — because the operator is linear and sends y_h to zero. So the general solution is one particular solution plus the entire homogeneous family. Two independent problems, added.'),
        drvStep('the general solution',
          `${dv('y')} ${dop('=')} ${dv('y')}_h ${dop('+')} ${dv('y')}_p`,
          'the homogeneous part carries the initial conditions; the particular part carries the forcing'),
        drvSay('and they have completely different fates',
          'The homogeneous part contains the damping exponential, so it dies. The particular part is sustained by the drive and does not. That is why the same solution is called the transient plus the steady state — the split is not a technique, it is a statement about what survives.'),
        drvStep('guess a particular solution of the same shape as the forcing',
          `${dv('g')} ${dop('=')} cos ω${dv('t')} ${dop('⇒')} guess ${dv('A')}cos ω${dv('t')} ${dop('+')} ${dv('B')}sin ω${dv('t')}`,
          `forcing frequency ω = ${n(st.w)}`),
        drvSay('why the sine must be included even for a cosine drive',
          'Damping introduces a phase lag, so the response is not in step with the drive. A pure cosine guess cannot represent a shifted cosine, and substituting it gives an inconsistent system. Including both is how the guess is allowed to shift in time.'),
        drvStep('substitute, match coefficients, and solve two linear equations',
          `(${dv('c')} ${dop('−')} ${dv('a')}ω²)${dv('A')} ${dop('+')} ${dv('b')}ω${dv('B')} ${dop('=')} 1`,
          'the panel prints the residual |a y_p″ + b y_p′ + c y_p − g|, which should be zero to machine precision'),
        drvSay('the guess fails when the forcing is already a solution',
          'If the drive matches a homogeneous solution, substituting it gives 0 = g, which is impossible. The fix is to multiply the guess by t. That is resonance seen algebraically — the response grows without bound precisely because the equation has no bounded solution of that shape.'),
        drvStep('variation of parameters works when guessing does not',
          `${dv('y')}_p ${dop('=')} ${dop('−')}${dv('y')}₁∫${dfrac(dv('y') + '₂' + dv('g'), dv('a') + dv('W'))} ${dop('+')} ${dv('y')}₂∫${dfrac(dv('y') + '₁' + dv('g'), dv('a') + dv('W'))}`,
          `evaluated at t = 12: ${'the panel prints this against the RK4 solution and their difference'}`),
        drvSay('and it needs no guess at all',
          'Undetermined coefficients works only for forcings whose derivatives stay in a finite family — polynomials, exponentials, sines. Variation of parameters works for any g, at the cost of two integrals. The Wronskian in the denominator is the same determinant that measured independence, now doing quantitative work.')
      ],
      note:'The transient decay rate and the time for it to fall to 1% are computed from the homogeneous roots, and the steady-state amplitude and phase lag from the particular solution. The panel checks the whole construction against RK4 at t = 12, by which time the transient is long gone.'
    };
  },
  enter(st, o){
    st.a = 1; st.b = o.b === undefined ? 0.5 : o.b; st.c = o.c === undefined ? 3 : o.c;
    st.forcing = o.forcing || 'cosine';
    st.w = o.w === undefined ? 1.4 : o.w;
    st.y0 = 0; st.v0 = 0;
    st.show = Object.assign({ comp:true, part:true }, o.show || {});
  },
  controls(){
    const st = ST;
    return pkSeg('odNF', OD_FORCINGS, st.forcing, e => e.name.split('  ')[0].replace('g(t) = ', '')) +
      pkBoxes('odown', st.forcing, st, OD_OWN, null,
        'Any forcing you like, written in <b>t</b> — <b>cos(2*t)</b>, <b>exp(-t/4)</b>, ' +
        '<b>t*sin(t)</b>, <b>1/(1+t^2)</b>. The particular solution comes from variation of ' +
        'parameters, which is a quadrature and needs no trial form, so g does not have to be one of ' +
        'the shapes the method of undetermined coefficients can handle.') +
      ctlRow('b  (damping)', ctlSlider('odNb', 0, 3, 0.02, st.b)) +
      ctlRow('c  (stiffness)', ctlSlider('odNc', 0.2, 9, 0.05, st.c)) +
      (st.forcing === 'cosine' ? ctlRow('drive ω', ctlSlider('odNw', 0.1, 4, 0.01, st.w)) : '') +
      `<div class="row wrap">${ctChk('odNc2', 'the complementary function y_c', st.show.comp)}
        ${ctChk('odNp', 'the particular solution y_p', st.show.part)}</div>
      <p class="help"><b>${odForcingCur(st).name}</b> — ${odForcingCur(st).note}</p>
      <p class="help">The general solution of a nonhomogeneous linear equation is
      <b>y = y<sub>c</sub> + y<sub>p</sub></b>: <i>any</i> one particular solution, plus the whole family of
      homogeneous solutions. The reason is linearity — the difference of two solutions of the forced
      equation solves the unforced one — and it means the two halves can be found by completely different
      methods and simply added.</p>
      <p class="help">Because the homogeneous part decays whenever there is damping, <b>y<sub>c</sub> is
      the transient and y<sub>p</sub> is the steady state</b>. Watch the full solution peel away from y_p at
      the start and settle onto it. The initial conditions live entirely in the transient; they have no
      effect on where the system ends up.</p>`;
  },
  wire(){
        ctWireSeg('odNF', v => { ST.forcing = v; });
    pkWireBoxes('odown', ST.forcing, ST, OD_OWN, null);
    wireSlider('odNb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('odNc', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    wireSlider('odNw', () => ST.w, v => { ST.w = v; }, v => fmtNum(+v, 3));
    ctWireChk('odNc2', v => { ST.show.comp = v; });
    ctWireChk('odNp', v => { ST.show.part = v; });
  },
  g(st){
    if(st.forcing === 'cosine') return t => 2 * Math.cos(st.w * t);
    return odForcingCur(st).g;
  },
  /* the particular solution, by undetermined coefficients where the guess works */
  yp(st){
    const { a, b, c } = st;
    if(st.forcing === 'none') return null;
    if(st.forcing === 'const_') return Math.abs(c) > 1e-9 ? (t => 4 / c) : null;
    if(st.forcing === 'poly'){
      /* y_p = At + B: a·0 + b·A + c(At+B) = t ⇒ cA = 1, bA + cB = 0 */
      if(Math.abs(c) < 1e-9) return null;
      const A = 1 / c, B = -b * A / c;
      return t => A * t + B;
    }
    if(st.forcing === 'expo'){
      const r = -0.5, den = a * r * r + b * r + c;
      if(Math.abs(den) < 1e-9) return null;         // resonance with the homogeneous solution
      const A = 3 / den;
      return t => A * Math.exp(r * t);
    }
    /* UNDETERMINED COEFFICIENTS APPLIES TO A FINITE FAMILY, AND NOTHING ELSE.
       This fell through to the cosine branch for any forcing not named above —
       so a reader's own g(t) was answered with the particular solution of
       2cos(ωt), a different equation entirely. The panel then plotted it,
       called it y_p, and printed a residual of 2.37 under prose promising the
       substitution vanishes to machine precision. Returning null is what the
       derivation ladder on this very stage already says: "undetermined
       coefficients works only for forcings whose derivatives stay in a finite
       family... variation of parameters works for any g", and that route is
       computed in the card below and is valid here.
       Written as an explicit test for `cosine` rather than a fallthrough, so a
       forcing added to OD_FORCINGS later gets no y_p instead of the wrong one. */
    if(st.forcing !== 'cosine') return null;
    const D = odDrivenResponse(a, b, c, 2, st.w);
    return t => D.amp * Math.cos(st.w * t - D.delta);
  },
  frame(st, dt, ctx, W, H){
    const g = this.g(st);
    const yp = this.yp(st);
    const T = 22;
    const num = odRK4(st.a, st.b, st.c, g, st.y0, st.v0, 0, T, 6000);
    let lo = -1, hi = 1;
    for(let i = 0; i < num.ys.length; i += 4){ lo = Math.min(lo, num.ys[i]); hi = Math.max(hi, num.ys[i]); }
    if(yp) for(let i = 0; i <= 200; i++){ const v = yp(T * i / 200); lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const pad = (hi - lo) * 0.14 + 0.1;
    const hp = (H - 160) / 2;
    const P = mkPlot(72, 46, W - 118, hp * 1.28, 0, T, lo - pad, hi + pad);
    plotFrame(ctx, P, 't', 'y(t)', `y″ + ${fmtNum(st.b, 3)}y′ + ${fmtNum(st.c, 3)}y = g(t)`);
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [0, T / 4, T / 2, 3 * T / 4, T], v => fmtNum(v, 3));
    if(st.show.part && yp) plotCurve(ctx, P, yp, 700, rgbCss(TH.pos), 2, null);
    if(st.show.comp && yp){
      /* y_c = y − y_p, evaluated from the numerical solution: the transient */
      ctx.strokeStyle = rgbCss(TH.curl, 0.8); ctx.lineWidth = 1.6;
      ctx.beginPath();
      for(let i = 0; i < num.ys.length; i += 3){
        const v = num.ys[i] - yp(num.ts[i]);
        const X = P.X(num.ts[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, v)));
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for(let i = 0; i < num.ys.length; i += 2){
      const X = P.X(num.ts[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, num.ys[i])));
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    /* the forcing, on its own axis below */
    let glo = 0, ghi = 0;
    for(let i = 0; i <= 300; i++){ const v = g(T * i / 300); glo = Math.min(glo, v); ghi = Math.max(ghi, v); }
    const Q = mkPlot(72, 46 + hp * 1.28 + 56, W - 118, H - 160 - hp * 1.28, 0, T,
                     glo - 0.2 * (ghi - glo + 1e-9), ghi + 0.2 * (ghi - glo + 1e-9));
    plotFrame(ctx, Q, 't', 'g(t)', 'the forcing');
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [0, T / 4, T / 2, 3 * T / 4, T], v => fmtNum(v, 3));
    plotCurve(ctx, Q, g, 600, rgbCss(TH.warn), 2);
    stageNote(ctx, 'green: the particular solution · blue: the transient that dies · dark: the full solution', W, H);
  },
  readout(st){
    const g = this.g(st), yp = this.yp(st);
    const num = odRK4(st.a, st.b, st.c, g, st.y0, st.v0, 0, 22, 8800);
    const R0 = odRoots(st.a, st.b, st.c);
    /* the residual: substitute y_p back into the equation and see if it is zero */
    let worst = 0, worstScale = 0;
    if(yp){
      for(let i = 1; i <= 40; i++){
        const t = i * 0.4;
        const h = 1e-4;
        const y = yp(t), y1 = (yp(t + h) - yp(t - h)) / (2 * h);
        const y2 = (yp(t + h) - 2 * y + yp(t - h)) / (h * h);
        worst = Math.max(worst, Math.abs(st.a * y2 + st.b * y1 + st.c * y - g(t)));
        /* the largest TERM in that sum, which is what the residual has to be
           read against: a residual of 1e-6 is machine zero beside terms of
           order 1 and a wrong answer beside terms of order 1e-6. Printing the
           bare number said nothing either way. */
        worstScale = Math.max(worstScale, Math.abs(st.a * y2), Math.abs(st.b * y1),
                              Math.abs(st.c * y), Math.abs(g(t)));
      }
    }
    /* variation of parameters, as an independent route to the same y_p.
       COMPARE THE TWO ROUTES AT THE SAME t. 8000 steps over [0, 22] puts no
       grid point at t = 12 — round(12/22·8000) lands on t = 12.0015, and the
       y′·0.0015 between there and 12 printed as a 7.8×10⁻⁵ "difference"
       between routes that agree to 10⁻¹² (auditsides, expo preset). 8800
       steps makes index 4800 exactly t = 12, and the comparison reads the
       time off the grid rather than assuming it. */
    const i12 = Math.round(12 / 22 * (num.ys.length - 1));
    const t12 = num.ts[i12];
    const vp = odVariation(st.a, st.b, st.c, g, t12);
    const numAt12 = num.ys[i12];
    const D = st.forcing === 'cosine' ? odDrivenResponse(st.a, st.b, st.c, 2, st.w) : null;
    return `<div class="card tight"><div class="ttl">Undetermined coefficients</div>
      ${kv('forcing g(t)', odForcingCur(st).name.replace('g(t) = ', ''))}
      ${kv('the guess', st.forcing === 'const_' ? 'y_p = A' : st.forcing === 'poly' ? 'y_p = At + B'
        : st.forcing === 'expo' ? 'y_p = Ae^(−0.5t)' : st.forcing === 'cosine' ? 'y_p = A cos ωt + B sin ωt'
        : st.forcing === 'none' ? 'none — nothing to match' : 'there is no finite family to guess from')}
      ${yp ? kv('y_p(0)', fmtNum(yp(0), 6))
           : kv('y_p', st.forcing === 'none'
                 ? 'none needed — the equation is homogeneous'
                 : 'no guess fits this forcing')}
      ${yp ? kv('y_p(5)', fmtNum(yp(5), 6)) : ''}
      ${yp ? kv('residual  |a y_p″ + b y_p′ + c y_p − g|', fmtGap(worst, worstScale)) : ''}
      ${yp || st.forcing === 'none' ? '' : `<p class="help"><b>Undetermined coefficients does not apply
      here.</b> The method needs a forcing whose derivatives stay inside a finite family — a polynomial,
      an exponential, a sine — so that a guess carrying a few unknown constants can close on itself. An
      arbitrary g(t) has no such family, so there is no guess to make. <b>That is not a gap in the
      laboratory; it is the reason the next method exists.</b> Variation of parameters, in the card below,
      needs no guess at all and handles any continuous g — at the cost of two integrals that may not be
      elementary. Its answer is computed there and checked against the numerical solution.</p>`}
      <p class="help">The residual is computed by substituting the proposed y_p back into the equation
      numerically, and it is quoted against the largest term in that sum — a bare residual says nothing,
      because whether 10⁻⁶ is zero depends entirely on what it sits beside. It vanishes to the resolution
      the check itself has: y_p″ comes from a central difference at h = 10⁻⁴, whose own round-off floor is
      about ε/h² ≈ 10⁻⁸, so the last few figures are the differencing, not the solution. The coefficients
      were not guessed and hoped for, they were solved for and checked.</p>
    </div>
    <div class="card tight"><div class="ttl">Variation of parameters — the general method</div>
      ${kv('y_p(12) by variation of parameters', fmtNum(vp.yp, 7))}
      ${kv('the RK4 solution at t = 12', fmtNum(numAt12, 7))}
      ${kv('difference', fmtAgree(vp.yp, numAt12))}
      ${kv('Wronskian at t = 12', fmtNum(vp.W, 6))}
      <p class="help">Variation of parameters needs no table of guesses: it builds y_p as
      <b>−y₁∫(y₂g/aW) + y₂∫(y₁g/aW)</b> for <i>any</i> continuous g, at the cost of two integrals that
      may not be elementary. With the lower limit at zero it produces exactly the solution with
      y(0) = y′(0) = 0, which is what the numerical run above uses — hence the direct comparison.</p>
    </div>
    <div class="card tight"><div class="ttl">Transient and steady state</div>
      ${kv('homogeneous case', OD_CASE_NAME[R0.kind])}
      ${kv('decay rate of the transient', R0.kind === 'complex' ? fmtNum(R0.alpha, 5) : fmtNum(Math.max(R0.r1, R0.r2), 5))}
      ${kv('time for it to fall to 1%', st.b > 1e-9 ? fmtNum(Math.log(100) / Math.abs(R0.kind === 'complex' ? R0.alpha : Math.max(R0.r1, R0.r2)), 5) : 'never — undamped')}
      ${D ? kv('steady-state amplitude', fmtNum(D.amp, 6)) : ''}
      ${D ? kv('phase lag behind the drive', fmtNum(D.delta * 180 / Math.PI, 5) + '°') : ''}
      <p class="help">Once the transient has gone, the system has forgotten how it started. That is what
      makes steady-state analysis possible at all — and it is why a circuit's frequency response, in the
      circuits wing, is a property of the circuit rather than of how it was switched on.</p>
    </div>`;
  },
  chip(st){
    const R0 = odRoots(st.a, st.b, st.c);
    return `<div class="k">y = y_c + y_p</div>
      <div style="color:var(--c-grad)">${odForcingCur(st).name.replace('g(t) = ', '')}</div>
      <div>${OD_CASE_NAME[R0.kind].split(' — ')[1] || ''}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the full solution'], ['var(--c-pos)', 'y_p — the steady state'],
                    ['var(--c-curl)', 'y_c — the transient'], ['var(--c-warn)', 'the forcing g(t)']]; },
  dockLegend:true
};

/* ---- 3 · the driven oscillator and resonance ------------------------------ */
