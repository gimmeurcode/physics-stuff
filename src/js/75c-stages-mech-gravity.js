STAGES.dyMoment = {
  title:'Momentum & collisions',
  derive(st){
    const n = v => fmtNum(v, 6);
    const p0 = st.m1 * st.u1 + st.m2 * st.u2;
    return {
      title:'Why momentum is conserved, and why energy usually is not',
      steps:[
        drvSay('conservation is not an extra postulate here',
          'Momentum conservation is a consequence of the third law, not an independent assumption. Two bodies push on each other with equal and opposite forces, so whatever momentum one gains the other loses. Nothing further needs to be assumed.'),
        drvStep('the third law, integrated over the collision',
          `${dv('F')}₁₂ ${dop('=')} ${dop('−')}${dv('F')}₂₁ ${dop('⇒')} Δ${dv('p')}₁ ${dop('=')} ${dop('−')}Δ${dv('p')}₂`,
          'impulse is the integral of force over time, and the two impulses are exact negatives'),
        drvStep('so the total is unchanged',
          `${dv('m')}₁${dv('u')}₁ ${dop('+')} ${dv('m')}₂${dv('u')}₂ ${dop('=')} ${dv('m')}₁${dv('v')}₁ ${dop('+')} ${dv('m')}₂${dv('v')}₂`,
          `total momentum ${n(p0)} kg·m/s, before and after — the panel prints both`),
        drvSay('and it holds however violent or complicated the collision',
          'The internal forces need not be known. They can be enormous, brief and wildly varying; whatever they are, they cancel in pairs. That is why momentum is the tool of choice for collisions, where the details of the interaction are invisible.'),
        drvStep('but one equation cannot fix two unknowns',
          `2 unknowns, 1 equation`,
          'a second condition is needed, and it is a physical input rather than a mathematical one'),
        drvStep('the coefficient of restitution supplies it',
          `${dv('e')} ${dop('=')} ${dfrac('separation speed', 'approach speed')}`,
          `e = ${n(st.e)} — ${st.e > 0.999 ? 'perfectly elastic' : st.e < 0.001 ? 'perfectly inelastic: they stick' : 'partially elastic'}`),
        drvSay('e is where the physics of the material enters',
          'It is not derivable from the laws of motion — it encodes how much energy the deformation stores and returns rather than dissipating as heat and sound. Steel is near 0.9, putty near 0. The mechanics is universal; the number is a property of the objects.'),
        drvStep('kinetic energy is conserved only when e = 1',
          `Δ${dv('KE')} ${dop('=')} ${dop('−')}${dfrac('1', '2')}μ(1 ${dop('−')} ${dv('e')}²)(${dv('u')}₁{−}${dv('u')}₂)²`,
          `the panel computes the energy before and after and prints the loss`),
        drvSay('so momentum and energy are conserved for different reasons',
          'Momentum conservation follows from the third law and holds in every collision. Energy conservation requires the forces to be conservative, and deformation is not. That is why momentum is always usable and energy is not — a distinction that gets lost when both are presented as conservation laws side by side.'),
        drvStep('and in the centre-of-mass frame it all becomes simple',
          `${dv('v')}_cm ${dop('=')} ${dfrac(dv('m') + '₁' + dv('u') + '₁ + ' + dv('m') + '₂' + dv('u') + '₂', dv('m') + '₁ + ' + dv('m') + '₂')}`,
          `= ${n(p0 / (st.m1 + st.m2))} m/s — in that frame the total momentum is zero and each body simply reverses, scaled by e`),
        st.own
          ? drvSay('and with an interaction of your own, e stops being a dial',
              'Everything above takes e as given, which quietly assumes the answer: choose e and the outcome follows. Writing a potential instead means there is no e anywhere in the input. The two bodies are pushed apart by ∓V′(x), the encounter is integrated through closest approach and out the other side, and the restitution is then <i>read off what happened</i>. With nothing dissipating it, that measurement comes back as 1.000000 — a conservative interaction is perfectly elastic, and no line of the program says so. Change how stiff the wall is by a factor of a hundred and it is still 1: the stiffness sets how long the encounter lasts and nothing else. Only then are the two final speeds handed to the impulse algebra at the measured e, and only then does ½μ(Δu)²(1−e²) have anything to be checked against.')
          : drvSay('but e was a dial, and a dial cannot be wrong',
              'Every number on this panel follows from the e you chose, so nothing here can be caught out. An interaction potential has no e in it at all — the restitution has to be measured from the outcome, and whether it comes out at 1 is then a real question with a real answer.')
      ],
      note:'Momentum and kinetic energy are both computed before and after and printed with their changes. Momentum agrees to machine precision at every e; kinetic energy agrees only at e = 1, and the deficit matches the closed form above.'
    };
  },
  enter(st, o){
    st.m1 = o.m1 === undefined ? 2 : o.m1; st.m2 = o.m2 === undefined ? 1 : o.m2;
    st.u1 = o.u1 === undefined ? 3 : o.u1; st.u2 = o.u2 === undefined ? -1 : o.u2;
    st.e = o.e === undefined ? 1 : o.e;
    st.t = 0; st.run = o.run !== false;
    st.own = !!o.own;
    st.vsrc = o.vsrc || '40*exp(-3*x)';
    st.damp = o.damp === undefined ? 0 : o.damp;
  },
  /* the integrated encounter, once per edit. The potential is written in x for
     the separation, and its derivative comes from the symbolic differentiator
     rather than finite differences — a stiff repulsive wall is exactly where a
     central difference would lose its digits. */
  own(st){
    const key = st.vsrc + '@' + st.m1 + '@' + st.m2 + '@' + st.u1 + '@' + st.u2 + '@' + st.damp;
    if(st._mk === key) return st._md;
    st._mk = key;
    const rawV = pkCompile(st.vsrc, () => 0);
    let rawD;
    try { const g = compile(diff(parse(String(st.vsrc)), 'x')); rawD = r => g(r, 0, 0); }
    catch(e){ rawD = null; }
    const V = r => { const q = rawV(r, 0, 0); return Number.isFinite(q) ? Math.max(-1e10, Math.min(1e10, q)) : 0; };
    const dV = rawD ? (r => { const q = rawD(r); return Number.isFinite(q) ? Math.max(-1e10, Math.min(1e10, q)) : 0; }) : null;
    const C = dyPairCollide(V, dV, st.m1, st.u1, st.m2, st.u2, st.damp, 6, 0.0002, 300000);
    C.V = V;
    st._md = C;
    return C;
  },
  controls(){
    const st = ST;
    const head = ctSeg('dyMm', st.own ? 'custom' : 'std',
                       [['std', 'a collision at a chosen e'], ['custom', 'an interaction of your own']]);
    if(st.own){
      return head +
        fnHtml('dyMv', 'V(x) =', st.vsrc, 'x, the separation in metres') +
        ctlRow('m₁', ctlSlider('dyMm1', 0.2, 6, 0.1, st.m1)) +
        ctlRow('u₁', ctlSlider('dyMu1', -5, 6, 0.1, st.u1)) +
        ctlRow('m₂', ctlSlider('dyMm2', 0.2, 6, 0.1, st.m2)) +
        ctlRow('u₂', ctlSlider('dyMu2', -6, 5, 0.1, st.u2)) +
        ctlRow('dashpot', ctlSlider('dyMd', 0, 4, 0.02, st.damp)) +
        ctChk('dyMrun', 'run the collision', st.run) +
        `<p class="help">Write the <b>interaction potential</b> as a function of the separation
        <b>x</b>: <b>40·exp(−3x)</b> for a soft repulsive wall, <b>0.01/x^12</b> for something much
        harder, <b>200·exp(−6x)</b> for a stiff one. It has to fall away to nothing at large separation,
        or the two never get free of each other.</p>
        <p class="help">The forces are <b>∓V′(x)</b>, equal and opposite by construction — so momentum
        conservation here is a property of the <i>stepper</i>, and the panel says so rather than claiming
        a discovery. What is genuinely measured is everything after it. The <b>restitution e</b> is read
        off the outcome, and with the dashpot at zero it comes out at <b>1</b> to nine figures: a
        conservative interaction is perfectly elastic, which is a theorem nobody told the integrator.</p>
        <p class="help">Then the two final speeds are compared with the ordinary impulse algebra run at
        that measured e, and the energy lost with <b>½μ(Δu)²(1−e²)</b>. Turn the dashpot up to make the
        encounter inelastic — and change the <i>stiffness</i> of V while the dashpot is off, to watch e
        stay at 1 however hard the wall is.</p>`;
    }
    return head +
      ctlRow('m₁', ctlSlider('dyMm1', 0.2, 6, 0.1, st.m1)) +
      ctlRow('u₁', ctlSlider('dyMu1', -5, 6, 0.1, st.u1)) +
      ctlRow('m₂', ctlSlider('dyMm2', 0.2, 6, 0.1, st.m2)) +
      ctlRow('u₂', ctlSlider('dyMu2', -6, 5, 0.1, st.u2)) +
      ctlRow('elasticity e', ctlSlider('dyMe', 0, 1, 0.01, st.e)) +
      ctChk('dyMrun', 'run the collision', st.run) +
      `<p class="help"><b>Momentum is always conserved</b> in a collision — for every value of e, because
      the two impulses are equal and opposite by Newton's third law and there is no external force. The
      panel prints Δp as zero at every setting, which is the point: it is not an approximation and it does
      not depend on the details of the contact.</p>
      <p class="help"><b>Energy is not.</b> At e = 1 the collision is elastic and K is conserved too; at
      e = 0 the two stick together and the loss is maximal. The lost energy is <b>½μ(u₁−u₂)²(1−e²)</b>
      with μ the reduced mass, and it goes into deformation, sound and heat.</p>
      <p class="help">Watch the centre-of-mass marker: it slides through the collision at constant speed
      and never notices it happened. That is the deepest statement here — no internal force can move the
      centre of mass, so viewing the collision from that frame makes it symmetric and trivial.</p>`;
  },
  wire(){
    ctWireSeg('dyMm', v => { ST.own = (v === 'custom'); ST.t = 0; });
    wireSlider('dyMm1', () => ST.m1, v => { ST.m1 = v; }, v => fmtNum(+v, 3) + ' kg');
    wireSlider('dyMm2', () => ST.m2, v => { ST.m2 = v; }, v => fmtNum(+v, 3) + ' kg');
    wireSlider('dyMu1', () => ST.u1, v => { ST.u1 = v; }, v => fmtNum(+v, 3) + ' m/s');
    wireSlider('dyMu2', () => ST.u2, v => { ST.u2 = v; }, v => fmtNum(+v, 3) + ' m/s');
    ctWireChk('dyMrun', v => { ST.run = v; });
    if(ST.own){
      fnWire('dyMv', (m, s) => { ST.vsrc = s; ST.t = 0; });
      wireSlider('dyMd', () => ST.damp, v => { ST.damp = Math.max(0, v); ST.t = 0; }, v => fmtNum(+v, 3) + ' N·s/m');
      return;
    }
    wireSlider('dyMe', () => ST.e, v => { ST.e = v; }, v => fmtNum(+v, 3));
  },
  frameOwn(st, dt, ctx, W, H){
    const C = STAGES.dyMoment.own(st);
    const T = Math.max(1e-6, C.tEnd);
    if(st.run){ st.t += dt * 0.5; if(st.t > T) st.t = 0; }
    const tm = Math.min(st.t, T);
    /* the potential the reader wrote, over the separations actually visited */
    const rlo = Math.max(1e-4, C.rmin * 0.85), rhi = 6;
    let vhi = 0;
    const vp = [];
    for(let i = 0; i <= 220; i++){
      const r = rlo + (rhi - rlo) * i / 220, y = C.V(r);
      vp.push({ x:r, y }); vhi = Math.max(vhi, y);
    }
    if(!(vhi > 0)) vhi = 1;
    const pw = Math.max(140, W * 0.48);
    const P = mkPlot(76, 46, Math.max(60, pw - 96), Math.max(60, H - 128), rlo, rhi, -vhi * 0.06, vhi * 1.1);
    plotFrame(ctx, P, 'separation  (m)', 'V  (J)', 'the potential you wrote');
    plotTicksX(ctx, P, [rlo, (rlo + rhi) / 2, rhi], v => fmtNum(v, 3));
    plotTicksY(ctx, P, [0, vhi / 2, vhi], v => fmtNum(v, 3));
    plotZeroY(ctx, P);
    ctPath(ctx, P, vp, rgbCss(TH.pos), 2.4);
    /* how far in they got: the closest approach, and the energy they had */
    ctx.strokeStyle = rgbCss(TH.neg, 0.85); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(P.X(C.rmin), P.py); ctx.lineTo(P.X(C.rmin), P.py + P.ph); ctx.stroke();
    ctx.setLineDash([]);
    /* along the bottom, not the top: the readout chip floats over the canvas's
       top-left corner and this label would sit underneath it */
    ctText(ctx, P.X(C.rmin) + 5, P.py + P.ph - 8, 'closest ' + fmtNum(C.rmin, 4) + ' m',
           rgbCss(TH.neg), '600 10.5px ' + FONT_UI);
    /* the encounter itself */
    const Q = mkPlot(pw + 70, 46, Math.max(60, W - pw - 110), Math.max(60, H - 128), 0, T, -1, 1);
    plotFrame(ctx, Q, 'time  (s)', null, 'the two of them, meeting');
    const tk = [];
    for(let i = 0; i <= 4; i++) tk.push(T * i / 4);
    plotTicksX(ctx, Q, tk, v => fmtNum(v, 3));
    let lo = Infinity, hi = -Infinity;
    for(const p of C.pts){ lo = Math.min(lo, p.x1, p.x2); hi = Math.max(hi, p.x1, p.x2); }
    if(!(hi > lo)){ lo = -1; hi = 1; }
    const R = mkPlot(pw + 70, 46, Math.max(60, W - pw - 110), Math.max(60, H - 128), 0, T, lo, hi);
    plotTicksY(ctx, R, [lo, (lo + hi) / 2, hi], v => fmtNum(v, 3));
    ctPath(ctx, R, C.pts.map(p => ({ x:p.t, y:p.x1 })), rgbCss(TH.grad), 2.4);
    ctPath(ctx, R, C.pts.map(p => ({ x:p.t, y:p.x2 })), rgbCss(TH.curl), 2.4);
    /* the centre of mass, which the interaction cannot move */
    ctPath(ctx, R, C.pts.map(p => ({ x:p.t, y:(st.m1 * p.x1 + st.m2 * p.x2) / (st.m1 + st.m2) })),
           rgbCss(TH.warn), 1.8, [5, 4]);
    const j = Math.max(0, Math.min(C.pts.length - 1, Math.round(tm / T * (C.pts.length - 1))));
    if(C.pts[j]){
      ctDot(ctx, R, C.pts[j].t, C.pts[j].x1, 5, rgbCss(TH.grad), rgbCss(TH.bg));
      ctDot(ctx, R, C.pts[j].t, C.pts[j].x2, 5, rgbCss(TH.curl), rgbCss(TH.bg));
    }
    ctText(ctx, R.px + R.pw - 6, R.py + 15, 'position  (m)', rgbCss(TH.faint), '10.5px ' + FONT_UI, 'right');
    stageNote(ctx, st.damp > 0
      ? 'the dashpot is engaged, so they leave slower than they arrived — e is measured from that'
      : 'no dissipation anywhere, and the measured restitution comes out at 1 without being told to', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.dyMoment.frameOwn(st, dt, ctx, W, H);
    const C = dyCollide(st.m1, st.u1, st.m2, st.u2, st.e);
    const T = 4;
    if(st.run){ st.t += dt * 0.6; if(st.t > T) st.t = 0; }
    const tc = T / 2;
    const pos = (u, v, x0) => st.t < tc ? x0 + u * st.t : x0 + u * tc + v * (st.t - tc);
    const x1 = pos(st.u1, C.v1, -4), x2 = pos(st.u2, C.v2, 4);
    const cm = (st.m1 * x1 + st.m2 * x2) / (st.m1 + st.m2);
    const hp = (H - 160) * 0.45;
    const P = ctBox(W, hp + 50, 0, 0, 6, { t:44, b:12 });
    ctFrame(ctx, P, st.t < tc ? 'before' : (st.e > 0.99 ? 'after — elastic' : st.e < 0.01 ? 'after — they stick' : 'after — partly elastic'));
    ctPath(ctx, P, [{ x:-6, y:-0.7 }, { x:6, y:-0.7 }], rgbCss(TH.line2), 2.4);
    for(const [x, m, u, v, col] of [[x1, st.m1, st.u1, C.v1, TH.grad], [x2, st.m2, st.u2, C.v2, TH.pos]]){
      const r = 0.16 + 0.11 * Math.cbrt(m);
      ctFill(ctx, P, [{ x:x - r, y:-0.7 }, { x:x + r, y:-0.7 }, { x:x + r, y:-0.7 + 2 * r }, { x:x - r, y:-0.7 + 2 * r }],
             rgbCss(col, 0.8));
      ctText(ctx, P.X(x), P.Y(-0.7 + r), fmtNum(m, 3), rgbCss(TH.bg), '700 12px ' + FONT_UI, 'center', 'middle');
      const vv = st.t < tc ? u : v;
      ctArrow(ctx, P, x, -0.7 + 2 * r + 0.25, x + vv * 0.28, -0.7 + 2 * r + 0.25, rgbCss(col), 2.4,
              fmtNum(vv, 3));
    }
    ctPath(ctx, P, [{ x:cm, y:-1.05 }, { x:cm, y:1.1 }], rgbCss(TH.warn), 2, [5, 4]);
    ctText(ctx, P.X(cm), P.Y(1.2), 'centre of mass, v = ' + fmtNum(C.vcm, 4), rgbCss(TH.warn),
           '600 11px ' + FONT_UI, 'center');
    /* momentum and energy bars, before and after */
    const B = mkPlot(90, 44 + hp + 46, W - 150, H - 160 - hp, 0, 4, 0,
      Math.max(C.K0, C.K1, Math.abs(C.p0), 1) * 1.25);
    plotFrame(ctx, B, '', 'J  and  kg·m/s', 'momentum is conserved; energy need not be');
    const bars = [
      { x:0.5, v:Math.abs(C.p0), col:TH.curl, lab:'|p| before' },
      { x:1.3, v:Math.abs(C.p1), col:TH.curl, lab:'|p| after' },
      { x:2.5, v:C.K0, col:TH.grad, lab:'K before' },
      { x:3.3, v:C.K1, col:TH.grad, lab:'K after' }
    ];
    for(const b of bars){
      ctx.fillStyle = rgbCss(b.col, 0.75);
      ctx.fillRect(B.X(b.x - 0.28), B.Y(b.v), B.X(b.x + 0.28) - B.X(b.x - 0.28), B.Y(0) - B.Y(b.v));
      ctText(ctx, B.X(b.x), B.Y(0) + 14, b.lab, rgbCss(TH.faint), '10.5px ' + FONT_UI, 'center');
      ctText(ctx, B.X(b.x), B.Y(b.v) - 5, fmtNum(b.v, 5), rgbCss(TH.dim), '600 10.5px ' + FONT_MONO, 'center');
    }
    if(C.lost > 1e-9){
      ctx.fillStyle = rgbCss(TH.neg, 0.55);
      ctx.fillRect(B.X(3.02), B.Y(C.K0), B.X(3.58) - B.X(3.02), B.Y(C.K1) - B.Y(C.K0));
      ctText(ctx, B.X(3.3), B.Y((C.K0 + C.K1) / 2), 'lost', rgbCss(TH.bg), '700 10px ' + FONT_UI, 'center', 'middle');
    }
    stageNote(ctx, 'the dashed line is the centre of mass — it passes straight through the collision unchanged', W, H);
  },
  readoutOwn(st){
    const C = STAGES.dyMoment.own(st);
    if(!C.ok) return `<div class="card tight"><div class="ttl">They never got free of each other</div>
      ${kv('closest approach', fmtNum(C.rmin, 5) + ' m')}
      <p class="help">With this potential the two did not separate again inside the integration window —
      either it is attractive at long range, so they are bound, or it does not fall away to nothing and
      keeps pushing forever. A purely repulsive law that decays, like <b>40·exp(−3x)</b>, will separate.</p>
    </div>`;
    const cons = st.damp <= 0;
    return `<div class="card tight"><div class="ttl">The interaction you wrote</div>
      ${kv('V(x)', pkPretty(st.vsrc) + ' J')}
      ${kv('dashpot across the pair', fmtNum(st.damp, 4) + ' N·s/m')}
      ${kv('closest they came', fmtNum(C.rmin, 6) + ' m')}
      ${kv('V there', fmtNum(C.V(C.rmin), 6) + ' J')}
      ${kv('and ½μ(Δu)², the energy available', fmtNum(0.5 * C.mu * (st.u1 - st.u2) * (st.u1 - st.u2), 6) + ' J')}
      ${kv('reduced mass μ', fmtNum(C.mu, 6) + ' kg')}
      ${kv('the encounter lasted', fmtNum(C.tEnd, 5) + ' s')}
      <p class="help">They stop approaching where the potential has swallowed all the kinetic energy of
      their relative motion — the two rows above are that statement, computed separately and compared.
      Everything about the collision is decided in that region.</p>
    </div>
    <div class="card tight"><div class="ttl">The restitution, measured</div>
      ${kv('they arrived at Δu =', fmtNum(st.u1 - st.u2, 6) + ' m/s')}
      ${kv('they left at', fmtNum(-(C.v1 - C.v2), 6) + ' m/s')}
      ${kv('so e = −(v₁−v₂)/(u₁−u₂)', fmtNum(C.e, 8))}
      ${kv('energy drift over the encounter', fmtGap(C.Edrift, Math.abs(C.K0), 'J'))}
      ${kv('momentum drift', fmtGap(C.dP, Math.abs(C.p0), 'kg·m/s'))}
      <p class="help">${cons
        ? 'With no dashpot the interaction is <b>conservative</b>, and the measured restitution comes out at 1 — a perfectly elastic collision, which the integrator was never told to produce. Change the stiffness of V by a factor of a hundred and it stays at 1: how hard the wall is sets how long the encounter lasts and nothing else.'
        : 'The dashpot removes energy while the two are in contact, and e drops below 1. It is not a parameter here — it is read off the outcome, which is what makes it worth comparing against the algebra below.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The impulse algebra, at that measured e</div>
      ${kv('v₁ from the integration', fmtNum(C.v1, 8) + ' m/s')}
      ${kv('v₁ from momentum and e', fmtNum(C.algV1, 8) + ' m/s')}
      ${kv('v₂ from the integration', fmtNum(C.v2, 8) + ' m/s')}
      ${kv('v₂ from momentum and e', fmtNum(C.algV2, 8) + ' m/s')}
      ${kv('largest difference', fmtGap(C.gapAlg, Math.max(Math.abs(C.v1), Math.abs(C.v2)), 'm/s'))}
      ${kv('centre-of-mass velocity', fmtNum(C.vcm, 6) + ' m/s')}
      <p class="help">The right-hand rows never integrated anything. They solve two lines of algebra —
      momentum conserved, and the separation speed a fraction e of the approach speed — and land on the
      same two numbers as a full simulation of the encounter.</p>
    </div>
    <div class="card tight"><div class="ttl">And the energy lost</div>
      ${kv('K before', fmtNum(C.K0, 6) + ' J')}
      ${kv('K after', fmtNum(C.K1, 6) + ' J')}
      ${kv('lost', fmtNum(C.lost, 6) + ' J')}
      ${kv('½μ(Δu)²(1 − e²) says', fmtNum(C.closed, 6) + ' J')}
      ${kv('difference', fmtAgree(C.lost, C.closed, 'J'))}
      <p class="help">Only the relative motion can be lost. The centre of mass carries ½(m₁+m₂)v_cm² that
      no internal force can touch, and what is left over — ½μ(Δu)² — is all that is ever available to
      dissipate. The factor (1 − e²) says how much of it went.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.dyMoment.readoutOwn(st);
    const C = dyCollide(st.m1, st.u1, st.m2, st.u2, st.e);
    const mu = st.m1 * st.m2 / (st.m1 + st.m2);
    const predicted = 0.5 * mu * Math.pow(st.u1 - st.u2, 2) * (1 - st.e * st.e);
    return `<div class="card tight"><div class="ttl">Before and after</div>
      ${kv('u₁, u₂', `${fmtNum(st.u1, 4)}, ${fmtNum(st.u2, 4)} m/s`)}
      ${kv('v₁, v₂', `${fmtNum(C.v1, 5)}, ${fmtNum(C.v2, 5)} m/s`)}
      ${kv('elasticity e', fmtNum(st.e, 4))}
      ${kv('relative speed before', fmtNum(Math.abs(st.u1 - st.u2), 5) + ' m/s')}
      ${kv('relative speed after', fmtNum(Math.abs(C.v1 - C.v2), 5) + ' m/s')}
      ${kv('their ratio', fmtNum(Math.abs((C.v1 - C.v2) / (st.u1 - st.u2 || 1e-9)), 5))}
      <p class="help">That ratio <i>is</i> e. The coefficient of restitution is defined as the relative
      speed of separation over the relative speed of approach, and everything else follows from it plus
      momentum conservation.</p>
    </div>
    <div class="card tight"><div class="ttl">The two conservation laws</div>
      ${kv('p before', fmtNum(C.p0, 7) + ' kg·m/s')}
      ${kv('p after', fmtNum(C.p1, 7) + ' kg·m/s')}
      ${kv('Δp', fmtNum(C.dp, 3))}
      ${kv('K before', fmtNum(C.K0, 7) + ' J')}
      ${kv('K after', fmtNum(C.K1, 7) + ' J')}
      ${kv('ΔK', fmtNum(C.dK, 6) + ' J')}
      ${kv('energy lost', fmtNum(C.lost, 6) + ' J')}
      ${kv('½μ(Δu)²(1−e²)', fmtNum(predicted, 6) + ' J')}
      ${kv('difference', fmtAgree(C.lost, predicted))}
      <p class="help">Momentum is conserved at every e — drag the slider and watch Δp stay at zero to the
      last digit. The energy loss matches the reduced-mass formula exactly, and it is zero only at e = 1.</p>
    </div>
    <div class="card tight"><div class="ttl">The centre-of-mass frame</div>
      ${kv('v_cm', fmtNum(C.vcm, 6) + ' m/s')}
      ${kv('u₁ in that frame', fmtNum(st.u1 - C.vcm, 5) + ' m/s')}
      ${kv('u₂ in that frame', fmtNum(st.u2 - C.vcm, 5) + ' m/s')}
      ${kv('v₁ in that frame', fmtNum(C.v1 - C.vcm, 5) + ' m/s')}
      ${kv('v₂ in that frame', fmtNum(C.v2 - C.vcm, 5) + ' m/s')}
      <p class="help">In this frame the total momentum is zero before and after, so at e = 1 each velocity
      simply <b>reverses</b> — the collision becomes a reflection. Every collision problem is easier here,
      and transforming back at the end costs one addition. The centre of mass moves at v_cm whatever
      happens, because no internal force can change it.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const C = STAGES.dyMoment.own(st);
      if(!C.ok) return `<div class="k">the pair</div><div style="color:var(--c-neg)">never separated</div>`;
      return `<div class="k">e, measured</div>
        <div style="color:var(--c-pos)">${fmtNum(C.e, 6)}</div>
        <div style="color:var(--c-neg)">${fmtNum(C.lost, 4)} J lost</div>`;
    }
    const C = dyCollide(st.m1, st.u1, st.m2, st.u2, st.e);
    return `<div class="k">after</div>
      <div style="color:var(--c-grad)">v₁ = ${fmtNum(C.v1, 5)}</div>
      <div style="color:var(--c-pos)">v₂ = ${fmtNum(C.v2, 5)}</div>`;
  },
  legend(st){
    return st && st.own
      ? [['var(--c-pos)', 'the potential you wrote'], ['var(--c-grad)', 'the first body'],
         ['var(--c-curl)', 'the second'], ['var(--c-warn)', 'the centre of mass'],
         ['var(--c-neg)', 'closest approach']]
      : [['var(--c-grad)', 'mass 1, and kinetic energy'], ['var(--c-pos)', 'mass 2'],
         ['var(--c-curl)', 'momentum'], ['var(--c-neg)', 'energy lost'],
         ['var(--c-warn)', 'the centre of mass']];
  },
  dockLegend:true
};

/* ---- 6 · gravitation and orbits ------------------------------------------- */
STAGES.dyGrav = {
  title:'Gravitation & orbits',
  derive(st){
    return {
      title:'One inverse-square law, and everything Kepler observed',
      steps:[
        drvStep('the law',
          `${dv('F')} ${dop('=')} ${dfrac(dv('G') + dv('M') + dv('m'), dv('r') + '²')}`,
          'G = 6.67430 × 10⁻¹¹ m³/kg·s², CODATA 2022 — the least precisely known of the major constants'),
        drvSay('the unification that made it famous',
          'The same law governs a falling apple and the Moon\'s orbit. Newton checked it: the Moon\'s centripetal acceleration is smaller than g by very nearly the square of the ratio of distances. That one number turned a guess into a theory.'),
        drvStep('for a circular orbit, gravity supplies the centripetal force',
          `${dfrac(dv('G') + dv('M') + dv('m'), dv('r') + '²')} ${dop('=')} ${dfrac(dv('m') + dv('v') + '²', dv('r'))}`,
          'the panel computes the required speed at the chosen altitude'),
        drvStep('so the orbital speed depends only on the central mass',
          `${dv('v')} ${dop('=')} √(${dfrac(dv('G') + dv('M'), dv('r'))})`,
          'the orbiting mass has cancelled — a bolt and a space station orbit identically'),
        drvSay('which is why astronauts float',
          'They are not beyond gravity — at the space station\'s altitude g is still about 89% of its surface value. They are in free fall, and so is everything around them, so nothing pushes on anything. Weightlessness is continuous falling, not the absence of gravity.'),
        drvStep('the period follows, and it is Kepler\'s third law',
          `${dv('T')}² ${dop('=')} ${dfrac('4π²' + dv('r') + '³', dv('G') + dv('M'))}`,
          'T² ∝ r³ — an empirical pattern Kepler found in 1619, derived here in two lines'),
        drvSay('and the second law needs even less than the inverse square',
          'Because the force points along r, its torque about the centre is zero, so angular momentum is conserved. That alone gives equal areas in equal times — true for any central force, whatever its strength law. Only the first and third laws single out the inverse square.'),
        drvStep('escape velocity is where kinetic beats potential',
          `${dfrac('1', '2')}${dv('m')}${dv('v')}² ${dop('=')} ${dfrac(dv('G') + dv('M') + dv('m'), dv('r'))} ${dop('⇒')} ${dv('v')}_esc ${dop('=')} √2 ${dop('×')} ${dv('v')}_orbit`,
          `boost factor ${fmtNum(st.boost, 3)} — the panel shows the orbit opening out as it approaches √2`),
        drvSay('and the total energy decides the shape of the orbit',
          'Negative total energy means bound: an ellipse. Exactly zero is the marginal case: a parabola, escaping with nothing to spare. Positive is a hyperbola, leaving with speed left over. The conic classification of the curves wing is the energy classification of the orbit.'),
        drvStep('and the orbit here is integrated, not drawn',
          `${dv('a')} ${dop('=')} ${dop('−')}${dfrac(dv('G') + dv('M'), dv('r') + '²')}${dv('r')}̂`,
          'RK4 from the force law — that the trace closes on an ellipse is a result, not an assumption'),
        st.view === 'custom'
          ? drvSay('but that it closes at all is the remarkable part, and it is nearly unique',
              'Write the exponent yourself and the question sharpens. Any attractive central force gives a bound orbit that oscillates between a smallest and a largest radius; the thing in doubt is whether the pattern repeats. That is decided by the <b>apsidal angle</b>, the angle swept from one closest approach to the next furthest point, and for a nearly circular orbit it works out at π/√(3+n) — so it is a rational multiple of π, and the orbit closes, for a whole family of exponents. Bertrand\'s theorem is the much stronger claim that only <b>n = −2</b> and <b>n = +1</b> keep that angle fixed as the orbit is stretched into an eccentric one, so only those two close for <i>every</i> bound launch. A single orbit cannot distinguish the two claims, which is why this panel runs four eccentricities and prints their apsidal angles side by side: for the inverse square they agree to the digits shown, and at an exponent of 2.1 they visibly do not.')
          : drvSay('and the closing is worth being suspicious of',
              'Nothing so far explains why the trace comes back to exactly where it started rather than turning a little each time round. It is a property of the inverse square specifically — Bertrand\'s theorem says only that law and the linear spring close for every bound orbit — and switching this stage to a force law of your own turns that from a remark into a measurement.')
      ],
      note:'Every orbit shown is produced by integrating the inverse-square law numerically. The panel checks that the swept area per unit time and the total energy stay constant along the trajectory, which is Kepler\'s second law and conservation of energy verified from the simulation itself.'
    };
  },
  enter(st, o){
    st.body = o.body || 'earth';
    st.alt = o.alt === undefined ? 400e3 : o.alt;
    st.boost = o.boost === undefined ? 1 : o.boost;
    st.view = o.view || 'orbit';
    st.fsrc = o.fsrc || '-4/x^2.1';
    st.gk = o.gk === undefined ? 1.15 : o.gk;
  },
  /* the whole Bertrand sweep — four orbits, each extended until it has produced
     four apsides — plus the one orbit being drawn. Once per edit, never per frame. */
  own(st){
    const key = st.fsrc + '@' + st.gk;
    if(st._gk2 === key) return st._gd;
    st._gk2 = key;
    const raw = pkCompile(st.fsrc, () => 0);
    const F = r => {
      const q = raw(r, 0, 0);
      return Number.isFinite(q) ? Math.max(-1e12, Math.min(1e12, q)) : 0;
    };
    const B = dyBertrand(F, 1, 1, [1.02, 1.12, 1.22, st.gk], 4, 2400);
    const run = dyOrbitTyped(F, 1, 1, B.vc * st.gk,
                             B.rows[3] ? B.rows[3].span : 30, 40000);
    const A = dyApsidal(run);
    st._gd = { F, B, run, A, attractive:F(1) < 0 };
    return st._gd;
  },
  controls(){
    const st = ST;
    const head = ctSeg('dyGV', st.view, [['orbit', 'an integrated orbit'],
                                         ['field', 'g and V with radius'],
                                         ['custom', 'a force law of your own']]);
    if(st.view === 'custom'){
      const D = STAGES.dyGrav.own(st);
      return head +
        fnHtml('dyGf', 'force F(x) =', st.fsrc, 'x, the distance from the centre — negative pulls inward') +
        ctlRow('launch speed ×', ctlSlider('dyGk2', 0.7, 1.38, 0.002, st.gk)) +
        `<p class="help">Write the <b>radial force</b> at distance <b>x</b> from the centre, negative for
        an attraction: <b>−4/x^2</b> is gravity, <b>−4·x</b> is a spring, <b>−4/x^2.1</b> is gravity with
        the exponent nudged, <b>−4/x^3</b> is something else entirely. The mass is 1 kg and the launch
        radius is 1 m, so the numbers stay readable.${D.attractive ? '' :
          ' <b style="color:var(--c-neg)">This law pushes outward at x = 1 — there will be no orbit.</b>'}</p>
        <p class="help">The orbit is integrated from that force alone. What the panel measures is the
        <b>apsidal angle</b> — the angle swept between one closest approach and the next furthest point —
        located by watching for a sign change in ṙ and interpolating inside the step. An orbit
        <b>closes</b> exactly when that angle is a rational fraction of π.</p>
        <p class="help">Beside it sits <b>π/√(3+n)</b>, the near-circular prediction, with <b>n measured
        from your own force</b> by logarithmic differentiation rather than read off the text you typed.</p>
        <p class="help"><b>Bertrand's theorem</b> is the stronger claim, and it needs a sweep: of all
        central forces, only <b>1/r²</b> and <b>r</b> give orbits that close for <i>every</i> bound
        launch, not merely for nearly circular ones. So four eccentricities are run through your law and
        the apsidal angles compared. For those two exponents the four rows agree; nudge the exponent by a
        tenth and they come apart. That parting is the theorem.</p>`;
    }
    return head +
      ctSeg('dyGB', st.body, Object.keys(DY_BODIES).map(k => [k, DY_BODIES[k].name])) +
      ctlRow('altitude', ctlSlider('dyGa', 0, 3, 0.01, Math.log10(1 + st.alt / 1e5))) +
      (st.view === 'orbit' ? ctlRow('launch speed ×', ctlSlider('dyGk', 0.6, 1.38, 0.002, st.boost)) : '') +
      `<p class="help">Newton's law of gravitation is one line — <b>F = GMm/r²</b> — and everything about
      orbits follows from it by integration. The orbit drawn here is <b>integrated</b> with a symplectic
      stepper from that force alone; no ellipse is drawn and no Kepler formula is used, so the ellipse that
      appears is a result.</p>
      <p class="help">The launch multiplier scales the circular speed <b>√(GM/r)</b>. At exactly 1 the
      orbit is a circle; below it the launch point becomes apogee and the orbit dips inward; above it the
      launch point becomes perigee. At <b>√2</b> the total energy reaches zero and the orbit stops
      closing — that is escape velocity, and it is visible as the ellipse opening into a parabola.</p>
      <p class="help">The panel measures the eccentricity and the angular momentum from the integrated
      path. Angular momentum stays constant to a part in 10⁹ because the force is central, and that
      constancy <i>is</i> Kepler's second law.</p>`;
  },
  wire(){
    ctWireSeg('dyGV', v => { ST.view = v; });
    if(ST.view === 'custom'){
      fnWire('dyGf', (m, s) => { ST.fsrc = s; });
      wireSlider('dyGk2', () => ST.gk, v => { ST.gk = v; }, v => fmtNum(+v, 4) + '×');
      return;
    }
    ctWireSeg('dyGB', v => { ST.body = v; });
    wireSlider('dyGa', () => Math.log10(1 + ST.alt / 1e5), v => { ST.alt = (Math.pow(10, v) - 1) * 1e5; },
      v => fmtNum((Math.pow(10, +v) - 1) * 100, 4) + ' km');
    wireSlider('dyGk', () => ST.boost, v => { ST.boost = v; }, v => fmtNum(+v, 4) + '×');
  },
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.dyGrav.own(st);
    const run = D.run;
    if(!run.pts.length){
      ctText(ctx, W / 2, H / 2, 'no orbit — this law does not pull inward at the launch radius',
             rgbCss(TH.dim), '13px ' + FONT_UI, 'center');
      return;
    }
    const scale = Math.max(run.rmax, 1) * 1.2;
    const pw = Math.max(140, Math.min(W * 0.5, H * 1.3));
    const P = ctBox(pw, H, 0, 0, scale);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, 'F(x) = ' + pkPretty(st.fsrc) + '   at ' + fmtNum(st.gk, 4) + '× circular speed');
    ctx.fillStyle = rgbCss(TH.warn, 0.6);
    ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), Math.max(3, 0.05 * scale * P.u), 0, 6.2832); ctx.fill();
    ctPath(ctx, P, run.pts, rgbCss(TH.grad), 1.6);
    /* the apsides, which are what the measurement is made from */
    for(const a of run.apsides.slice(0, 24))
      ctDot(ctx, P, a.r * Math.cos(a.th), a.r * Math.sin(a.th), 3.5,
            rgbCss(a.kind === 'min' ? TH.neg : TH.pos), null);
    ctDot(ctx, P, 1, 0, 5, rgbCss(TH.curl), rgbCss(TH.bg));
    /* the sweep, as a row of apsidal angles */
    const rows = D.B.rows;
    const x0 = pw + 40, bw = Math.max(60, W - x0 - 150);
    /* The axis has to answer two questions at once — is the angle a closing
       value, and do the four rows agree with each other — and those live on
       wildly different scales: a nudged exponent moves the angle by 0.19 rad
       from π while spreading the four rows over 0.02. Spanning π/2 to π buries
       the second, so the window is drawn around the measured values together
       with the nearest closing mark, and floored so that a law which closes
       perfectly still shows its four dots stacked on the line. */
    let lo = Infinity, hi = -Infinity;
    for(const r of rows) if(r.ok && Number.isFinite(r.angle)){ lo = Math.min(lo, r.angle); hi = Math.max(hi, r.angle); }
    if(!Number.isFinite(lo)){ lo = Math.PI / 2; hi = Math.PI; }
    const mid = (lo + hi) / 2;
    let near = Math.PI;
    for(const m of [Math.PI, Math.PI / 2, 2 * Math.PI / 3, Math.PI / 3])
      if(Math.abs(m - mid) < Math.abs(near - mid)) near = m;
    lo = Math.min(lo, near); hi = Math.max(hi, near);
    const pad = Math.max((hi - lo) * 0.35, 0.02);
    lo -= pad; hi += pad;
    ctText(ctx, x0, 56, 'the apsidal angle at four eccentricities', rgbCss(TH.dim), '600 12px ' + FONT_UI);
    ctText(ctx, x0, 74, 'they agree only for an inverse square or a spring',
           rgbCss(TH.faint), '11px ' + FONT_UI);
    const Q = mkPlot(x0, 92, bw, Math.max(50, H - 200), lo, hi, 0, 1);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(Q.px, Q.py, Q.pw, Q.ph);
    for(const [val, lab, col] of [[Math.PI, 'π', TH.pos], [Math.PI / 2, 'π/2', TH.pos]]){
      if(val < lo || val > hi) continue;
      ctx.strokeStyle = rgbCss(col, 0.7); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(Q.X(val), Q.py); ctx.lineTo(Q.X(val), Q.py + Q.ph); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, Q.X(val), Q.py - 4, lab, rgbCss(col), '600 11px ' + FONT_UI, 'center');
    }
    rows.forEach((r, i) => {
      const y = Q.py + Q.ph * (i + 0.5) / rows.length;
      ctText(ctx, Q.px - 6, y + 4, 'e = ' + fmtNum(r.ecc, 3), rgbCss(TH.faint), '10.5px ' + FONT_MONO, 'right');
      if(!r.ok || !Number.isFinite(r.angle)){
        ctText(ctx, Q.px + 8, y + 4, 'no apsides found', rgbCss(TH.neg), '10.5px ' + FONT_UI);
        return;
      }
      const px = Math.max(Q.px, Math.min(Q.px + Q.pw, Q.X(r.angle)));
      ctx.fillStyle = rgbCss(TH.curl);
      ctx.beginPath(); ctx.arc(px, y, 5, 0, 6.2832); ctx.fill();
      ctText(ctx, px + 9, y + 4, fmtNum(r.angle, 6) + ' rad', rgbCss(TH.dim), '10.5px ' + FONT_MONO);
    });
    stageNote(ctx, D.B.closes
      ? 'every row lands on the same mark — this law gives closed orbits at every eccentricity'
      : 'the rows do not line up: the apsidal angle depends on the orbit, so nothing closes', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.view === 'custom') return STAGES.dyGrav.frameOwn(st, dt, ctx, W, H);
    const B = DY_BODIES[st.body];
    const r0 = B.R + st.alt;
    if(st.view === 'field'){
      const rMax = B.R * 6;
      const hp = (H - 160) / 2;
      const P = mkPlot(84, 46, W - 132, hp, 0, rMax / B.R, 0, dyGField(B.M, B.R) * 1.15);
      plotFrame(ctx, P, 'r  (planet radii)', 'g  (m/s²)', 'the field outside — and inside, if it were uniform');
      plotTicksX(ctx, P, [0, 1, 2, 4, 6], v => String(v));
      plotCurve(ctx, P, x => x >= 1 ? dyGField(B.M, x * B.R) : dyGField(B.M, B.R) * x, 500, rgbCss(TH.grad), 2.6);
      ctx.strokeStyle = rgbCss(TH.warn, 0.8); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(P.X(1), P.py); ctx.lineTo(P.X(1), P.py + P.ph); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, P.X(1) + 6, P.py + 16, 'the surface', rgbCss(TH.warn), '600 11px ' + FONT_UI);
      probeLine(ctx, P, r0 / B.R, 'r');
      const Q = mkPlot(84, 46 + hp + 56, W - 132, hp, 0, rMax / B.R,
        -DY_G_GRAV * B.M / B.R * 1.15, 0.05 * DY_G_GRAV * B.M / B.R);
      plotFrame(ctx, Q, 'r  (planet radii)', 'V  (J/kg)', 'the potential — negative, and rising to zero at infinity');
      plotZeroY(ctx, Q);
      plotTicksX(ctx, Q, [0, 1, 2, 4, 6], v => String(v));
      plotCurve(ctx, Q, x => x >= 1 ? -DY_G_GRAV * B.M / (x * B.R) : -DY_G_GRAV * B.M * (3 - x * x) / (2 * B.R),
                500, rgbCss(TH.curl), 2.6);
      probeLine(ctx, Q, r0 / B.R, null);
      stageNote(ctx, 'g falls as 1/r² outside and rises linearly from the centre; V is its integral', W, H);
      return;
    }
    const vc = dyOrbitV(B.M, r0);
    const O = dyOrbitRun(B.M, r0, vc * st.boost, Math.max(0.5, dyOrbitT(B.M, r0) / 4000), 9000);
    const scale = Math.max(O.rmax, r0) * 1.25;
    const P = ctBox(W, H, 0, 0, scale);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, `${B.name} — launch at ${fmtNum(st.boost, 4)} × circular speed`);
    /* the body */
    ctx.fillStyle = rgbCss(TH.warn, 0.6);
    ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), Math.max(3, B.R * P.u), 0, 6.2832); ctx.fill();
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 1.6; ctx.stroke();
    ctPath(ctx, P, O.pts, rgbCss(TH.grad), 2);
    const last = O.pts[O.pts.length - 1];
    ctDot(ctx, P, last.x, last.y, 6, rgbCss(TH.curl), rgbCss(TH.bg));
    ctDot(ctx, P, r0, 0, 5, rgbCss(TH.pos), rgbCss(TH.bg));
    stageNote(ctx, 'the path is integrated from F = GMm/r² alone — the ellipse is a result, not a drawing', W, H);
  },
  readoutOwn(st){
    const D = STAGES.dyGrav.own(st);
    if(!D.attractive) return `<div class="card tight"><div class="ttl">That law does not orbit</div>
      ${kv('F at the launch radius', fmtNum(D.F(1), 6) + ' N')}
      <p class="help">A positive force pushes outward, so there is nothing to orbit. Put a minus sign in
      front — <b>−4/x^2</b> — and the body is bound.</p></div>`;
    const A = D.A, B = D.B;
    const closes = A.ok && Math.abs(A.precess) < 3e-3;
    return `<div class="card tight"><div class="ttl">The law you wrote</div>
      ${kv('F(x)', pkPretty(st.fsrc) + ' N')}
      ${kv('at the launch radius', fmtNum(D.F(1), 6) + ' N')}
      ${kv('index n, measured by d ln|F| / d ln r', Number.isFinite(B.n) ? fmtNum(B.n, 6) : 'not a power law here')}
      ${kv('circular speed there', fmtNum(B.vc, 6) + ' m/s')}
      ${kv('launched at', fmtNum(st.gk, 4) + ' × that')}
      ${kv('eccentricity that produced', fmtNum(D.run.ecc, 5))}
      <p class="help">The index is measured from the force <i>function</i>, by differencing its logarithm
      against the logarithm of the radius. A law that is not a power will give a number that varies with
      radius, and the prediction below then applies only near this one.</p>
    </div>
    <div class="card tight"><div class="ttl">The apsidal angle, measured</div>
      ${kv('apsides located on the track', String(A.count || 0))}
      ${kv('angle between successive apsides', A.ok ? fmtNum(A.angle, 7) + ' rad' : 'not enough of them yet')}
      ${kv('as a multiple of π', A.ok ? fmtNum(A.overPi, 6) : '—')}
      ${kv('π/√(3+n) predicts', Number.isFinite(B.predicted) ? fmtNum(B.predicted, 7) + ' rad' : 'nothing — n ≤ −3 here')}
      ${kv('difference', A.ok && Number.isFinite(B.predicted) ? fmtNum(Math.abs(A.angle - B.predicted), 3) + ' rad' : '—')}
      ${kv('precession per orbit', A.ok ? fmtNum(A.precess * 180 / Math.PI, 5) + '°' : '—')}
      ${kv('does this orbit close', closes ? 'yes — it retraces itself' : 'no — the ellipse turns each time round')}
      ${kv('angular momentum drift', fmtNum(D.run.dL, 3))}
      ${kv('energy drift', fmtNum(D.run.dE, 3) + ' J')}
      <p class="help">The apsides are found by watching ṙ change sign and interpolating inside the step,
      so the angle is read off the integrated track rather than from any formula. The prediction beside it
      is the standard near-circular result, and the drift rows are the integrator's own honesty: a central
      force cannot change angular momentum, and it did not.</p>
    </div>
    <div class="card tight"><div class="ttl">Bertrand's theorem, swept</div>
      ${B.rows.map(r => kv('launch ' + fmtNum(r.k, 4) + '× · eccentricity ' + fmtNum(r.ecc, 3),
        r.ok ? fmtNum(r.angle, 7) + ' rad  (' + fmtNum(r.angle / Math.PI, 5) + ' π)'
             : 'no apsides inside the window')).join('')}
      ${kv('spread across the four', Number.isFinite(B.spread) ? fmtNum(B.spread, 3) + ' rad' : '—')}
      ${kv('verdict', B.closes ? 'closed at every eccentricity — one of the two exceptional laws'
                               : 'the angle moves with the orbit, so it does not close in general')}
      <p class="help">One orbit cannot see this. The near-circular result π/√(3+n) is a rational multiple
      of π for a whole family of exponents, and each of those gives closed orbits <i>when they are nearly
      circular</i>. Bertrand's theorem is about all of them at once: only <b>n = −2</b> and <b>n = +1</b>
      hold the apsidal angle fixed as the orbit is stretched. Four eccentricities are enough to see the
      others come apart.</p>
      <p class="help">Try it. <b>−4/x^2</b> gives four rows reading π. <b>−4·x</b> gives four rows reading
      π/2 — the ellipse centred on the origin, closing after half a turn. <b>−4/x^2.1</b> gives four rows
      that do not agree with each other, and an orbit that never repeats. That last one is not a numerical
      artefact: it is why the perihelion of Mercury was worth 240 years of argument.</p>
    </div>`;
  },
  readout(st){
    if(st.view === 'custom') return STAGES.dyGrav.readoutOwn(st);
    const B = DY_BODIES[st.body];
    const r0 = B.R + st.alt;
    const vc = dyOrbitV(B.M, r0);
    const E = dyOrbitEnergy(B.M, 1, r0);
    if(st.view === 'field'){
      return `<div class="card tight"><div class="ttl">${B.name}</div>
        ${kv('mass', fmtNum(B.M, 5) + ' kg')}
        ${kv('radius', fmtNum(B.R / 1000, 6) + ' km')}
        ${kv('surface gravity GM/R²', fmtNum(dyGField(B.M, B.R), 6) + ' m/s²')}
        ${kv('in Earth gravities', fmtNum(dyGField(B.M, B.R) / DY_G, 5))}
        ${kv('at altitude ' + fmtNum(st.alt / 1000, 5) + ' km', fmtNum(dyGField(B.M, r0), 6) + ' m/s²')}
        ${kv('as a fraction of surface', fmtNum(100 * dyGField(B.M, r0) / dyGField(B.M, B.R), 4) + '%')}
      </div>
      <div class="card tight"><div class="ttl">Escape and orbit</div>
        ${kv('circular orbit speed √(GM/r)', fmtNum(vc, 6) + ' m/s')}
        ${kv('escape speed √(2GM/r)', fmtNum(dyEscapeV(B.M, r0), 6) + ' m/s')}
        ${kv('their ratio', fmtNum(dyEscapeV(B.M, r0) / vc, 7))}
        ${kv('orbital period', fmtNum(dyOrbitT(B.M, r0), 6) + ' s  =  ' + fmtNum(dyOrbitT(B.M, r0) / 60, 5) + ' min')}
        <p class="help">Escape speed is exactly √2 times circular speed at any radius, because escape needs
        the total energy to reach zero and a circular orbit has E = U/2. Note that the ISS at 400 km still
        feels 89% of surface gravity — astronauts float because they are falling, not because gravity has
        gone away.</p>
      </div>
      <div class="card tight"><div class="ttl">Energy, per kilogram</div>
        ${kv('kinetic in circular orbit', fmtNum(E.K, 6) + ' J')}
        ${kv('potential −GM/r', fmtNum(E.U, 6) + ' J')}
        ${kv('total', fmtNum(E.E, 6) + ' J')}
        ${kv('and U/2 for comparison', fmtNum(E.U / 2, 6) + ' J')}
        ${kv('bound?', E.E < 0 ? 'yes — the total energy is negative' : 'no')}
        <p class="help">E = U/2 for a circular orbit is the <b>virial theorem</b>, and it has a
        counter-intuitive consequence: firing an engine forwards raises the orbit and <i>slows</i> the
        spacecraft down, because the potential energy gained exceeds the kinetic energy added.</p>
      </div>`;
    }
    const O = dyOrbitRun(B.M, r0, vc * st.boost, Math.max(0.5, dyOrbitT(B.M, r0) / 4000), 9000);
    const Eorb = 0.5 * Math.pow(vc * st.boost, 2) - DY_G_GRAV * B.M / r0;
    return `<div class="card tight"><div class="ttl">The launch</div>
      ${kv('radius', fmtNum(r0 / 1000, 6) + ' km')}
      ${kv('circular speed', fmtNum(vc, 6) + ' m/s')}
      ${kv('launch speed', fmtNum(vc * st.boost, 6) + ' m/s')}
      ${kv('escape speed here', fmtNum(dyEscapeV(B.M, r0), 6) + ' m/s')}
      ${kv('total energy per kg', fmtNum(Eorb, 6) + ' J')}
      ${kv('bound?', Eorb < 0 ? 'yes — a closed orbit' : 'no — it escapes')}
    </div>
    <div class="card tight"><div class="ttl">Measured from the integrated path</div>
      ${kv('closest approach', fmtNum(O.rmin / 1000, 6) + ' km')}
      ${kv('furthest', fmtNum(O.rmax / 1000, 6) + ' km')}
      ${kv('semi-major axis (r<sub>min</sub>+r<sub>max</sub>)/2', fmtNum(O.a / 1000, 6) + ' km')}
      ${kv('eccentricity', fmtNum(O.e, 6))}
      ${kv('does it hit the surface?', O.rmin < B.R ? 'yes — this is a suborbital trajectory' : 'no')}
      <p class="help">Nothing about an ellipse was assumed. The stepper integrates the inverse-square force
      and these numbers are read off the resulting path — which is Kepler's first law arriving as an output
      rather than an input.</p>
    </div>
    <div class="card tight"><div class="ttl">Angular momentum, per kilogram</div>
      ${kv('L at the start', fmtNum(O.L0, 8))}
      ${kv('L at the end', fmtNum(O.L1, 8))}
      ${kv('relative drift', fmtNum(Math.abs(O.Ldrift / O.L0), 3))}
      <p class="help">Constant to a part in 10⁹ over thousands of steps. The force is <b>central</b>, so
      it exerts no torque about the centre, so L cannot change — and since the areal velocity is L/2, the
      planet sweeps equal areas in equal times. Kepler's second law is angular momentum conservation with
      a seventeenth-century vocabulary.</p>
    </div>`;
  },
  chip(st){
    if(st.view === 'custom'){
      const D = STAGES.dyGrav.own(st);
      if(!D.attractive) return `<div class="k">this law</div><div style="color:var(--c-neg)">pushes outward</div>`;
      return `<div class="k">apsidal angle</div>
        <div style="color:var(--c-curl)">${D.A.ok ? fmtNum(D.A.overPi, 5) + ' π' : 'not found yet'}</div>
        <div style="color:${D.B.closes ? 'var(--c-pos)' : 'var(--c-neg)'}">${D.B.closes ? 'closes' : 'does not close'}</div>`;
    }
    const B = DY_BODIES[st.body];
    const r0 = B.R + st.alt;
    return `<div class="k">${B.name}</div>
      <div style="color:var(--c-grad)">g = ${fmtNum(dyGField(B.M, r0), 5)} m/s²</div>
      <div>v_orb = ${fmtNum(dyOrbitV(B.M, r0), 5)} m/s</div>`;
  },
  legend(st){
    return st && st.view === 'custom'
      ? [['var(--c-grad)', 'the integrated orbit'], ['var(--c-warn)', 'the force centre'],
         ['var(--c-neg)', 'closest approach'], ['var(--c-pos)', 'furthest point, and π or π/2'],
         ['var(--c-curl)', 'the launch point, and each measured apsidal angle']]
      : [['var(--c-grad)', 'the integrated orbit, or g'], ['var(--c-warn)', 'the body'],
         ['var(--c-curl)', 'the current position, or V'], ['var(--c-pos)', 'the launch point']];
  },
  dockLegend:true
};
