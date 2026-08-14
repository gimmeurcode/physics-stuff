/* ============================================================================
   4t · TORQUE, AND THE ENERGY AND MOMENTUM OF ROTATING SYSTEMS
   The AP framework splits rotation into two units — the dynamics (what makes
   angular acceleration) and the conserved quantities (energy and angular
   momentum). These are the two stages that were missing for the second.
   ============================================================================ */

STAGES.rtTorque = {
  title:'Torque and angular acceleration',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why a force applied further out, and at right angles, turns things better',
      steps:[
        drvSay('force alone does not determine turning',
          'Push a door at the hinge and nothing happens; push at the handle and it swings. Push along the door rather than across it and again nothing happens. Turning depends on where the force is applied and in which direction, not only on how hard.'),
        drvStep('torque captures both',
          `τ ${dop('=')} ${dv('r')}${dv('F')} sin φ`,
          `r = ${n(st.r)} m, F = ${n(st.F)} N, φ = ${n(st.ang * 180 / Math.PI)}° gives τ = ${n(st.r * st.F * Math.sin(st.ang))} N·m`),
        drvSay('read the two factors separately',
          'The r is leverage: the same force further out has more effect, which is why spanners have handles. The sin φ keeps only the perpendicular component, because a force pointing at the axis can never turn anything about it.'),
        drvStep('and it is a cross product',
          `τ ${dop('=')} ${dv('r')} ${dop('×')} ${dv('F')}`,
          'which supplies the magnitude and the axis of the turning in one object'),
        drvStep('now apply the second law to each particle and sum',
          `Σ τ ${dop('=')} (Σ ${dv('m')}ᵢ${dv('r')}ᵢ²) α ${dop('=')} ${dv('I')}α`,
          `for the ${st.body}: α = ${'the panel computes it and integrates the motion'}`),
        drvSay('so the rotational law is the linear law, summed',
          'τ = Iα is not a new principle. It is F = ma applied to every particle, multiplied by its distance from the axis and added up. The moment of inertia appears for the same reason it appeared in the energy — it is what Σmᵣ² always turns out to be.'),
        drvStep('the whole vocabulary translates term by term',
          `${dv('F')} ${dop('↔')} τ, &nbsp; ${dv('m')} ${dop('↔')} ${dv('I')}, &nbsp; ${dv('a')} ${dop('↔')} α, &nbsp; ${dv('p')} ${dop('↔')} ${dv('L')}`,
          'and work becomes τΔθ, power becomes τω'),
        drvSay('one dictionary, not a second subject',
          'Every rotational result can be obtained from its linear counterpart by this substitution, because each was derived from the same starting point. Learning rotational dynamics as a separate set of formulas doubles the work for no reason.'),
        drvStep('and the same torque produces different results on different shapes',
          `α ${dop('=')} τ/${dv('I')}`,
          'the panel applies an identical torque to each body and shows how differently they respond'),
        st.own
          ? drvSay('a torque that changes with time breaks the shortcut, not the law',
              'ω = ω₀ + αt is not the second law; it is the second law integrated once under the assumption that α is constant. Type a torque that varies and that assumption is gone, while τ = Iα survives untouched. The panel then answers the same question twice: RK4 steps the differential equation forward, and adaptive quadrature evaluates ∫τdt in one go and divides by I. Nothing connects those two calculations, so the gap between them is the integration being checked. The angle is done the same way, the second route swapping the order of a double integral into a single quadrature with a (T − t) weight — and the order of the stepper is measured by halving the step, never quoted.')
          : drvSay('and constant is a special case, not the subject',
              'Every kinematic formula on this panel assumed α does not change. Switch to a torque programme of your own and the formulas stop applying while τ = Iα does not, which is the cleanest way to see which of the two you were actually relying on.')
      ],
      note:'The motion is integrated from τ = Iα with the moment of inertia computed for the chosen body, so the angular acceleration shown is a consequence of the shape rather than a set parameter.'
    };
  },
  drag:true,
  enter(st, o){
    st.body = o.body || 'disc';
    st.M = 2; st.R = 1;
    st.F = o.F === undefined ? 6 : o.F;
    st.r = o.r === undefined ? 0.8 : o.r;
    st.ang = o.ang === undefined ? Math.PI / 2 : o.ang;
    st.t = 0; st.run = o.run !== false;
    st.own = !!o.own;
    st.tsrc = o.tsrc || '2.5*sin(1.6*t)';
    st.T1 = o.T1 === undefined ? 6 : o.T1;
    st.w0 = o.w0 === undefined ? 0 : o.w0;
  },
  /* the typed programme, integrated once per edit rather than once per frame:
     rtSpinRun runs adaptive quadrature twice and rtSpinOrder runs the whole
     thing again at two step counts, which is far too much for 60 Hz */
  own(st){
    const I = Math.max(1e-9, RT_BODIES[st.body].I(st.M, st.R));
    const key = st.tsrc + '@' + I + '@' + st.w0 + '@' + st.T1;
    if(st._ok === key) return st._od;
    st._ok = key;
    const raw = pkParamFn(st.tsrc, () => 0);
    /* guarded and clamped: a formula that blows up must not poison a quadrature */
    const tau = t => { const v = raw(t); return Number.isFinite(v) ? Math.max(-1e6, Math.min(1e6, v)) : 0; };
    const Rn = rtSpinRun(tau, I, st.w0, st.T1, 1600);
    Rn.I = I; Rn.tau = tau;
    Rn.order = rtSpinOrder(tau, I, st.w0, st.T1, 12);
    st._od = Rn;
    return Rn;
  },
  controls(){
    const st = ST;
    const head = ctSeg('tqMode', st.own ? 'custom' : 'std',
                       [['std', 'a steady push'], ['custom', 'a torque programme of your own']]) +
      ctSeg('tqB', st.body, Object.keys(RT_BODIES).map(k => [k, RT_BODIES[k].name]));
    if(st.own){
      return head +
        fnHtml('tqTau', 'torque τ(t) =', st.tsrc, 't, in seconds') +
        ctlRow('run for', ctlSlider('tqT1', 0.5, 20, 0.1, st.T1)) +
        ctlRow('ω at t = 0', ctlSlider('tqW0', -6, 6, 0.05, st.w0)) +
        ctlRow('mass M', ctlSlider('tqM', 0.2, 6, 0.05, st.M)) +
        ctlRow('size', ctlSlider('tqRR', 0.1, 2, 0.02, st.R)) +
        ctChk('tqRun', 'run the clock', st.run) +
        `<p class="help">Write the torque as a function of <b>t</b> in seconds — <b>2.5·sin(1.6t)</b>,
        <b>4·e^(−t/2)</b>, <b>3−t</b>, <b>t^2/5</b>. It acts on the body chosen above, whose moment of
        inertia comes from its own closed form.</p>
        <p class="help">The moment α stops being constant, <b>ω = ω₀ + αt</b> and <b>θ = ½αt²</b> stop
        being true — but <b>τ = Iα</b> does not. So the panel answers the same two questions twice, by
        routes with nothing in common: <b>RK4</b> steps the differential equation, and <b>adaptive
        quadrature</b> evaluates ∫τdt and ∫(T−t)τdt directly. The gaps it prints are those two answers
        being compared, and the order of the stepper is <i>measured</i> by halving the step.</p>
        <p class="help">Try a torque that reverses — <b>sin(t)</b> over a whole number of periods. The net
        angular impulse is zero, so ω comes back to exactly where it started while θ does not, which is the
        difference between a conserved quantity and an accumulated one.</p>`;
    }
    return head +
      ctlRow('force F', ctlSlider('tqF', 0, 14, 0.1, st.F)) +
      ctlRow('lever arm r', ctlSlider('tqR', 0.05, 1, 0.01, st.r)) +
      ctlRow('angle', ctlSlider('tqA', 0, Math.PI, 0.01, st.ang)) +
      ctlRow('mass M', ctlSlider('tqM', 0.2, 6, 0.05, st.M)) +
      ctChk('tqRun', 'run the clock', st.run) +
      `<p class="help">Torque is <b>τ = rF sin θ</b> — only the component of the force perpendicular
      to the lever arm turns anything. Slide the angle to 0 or 180° and the torque vanishes however
      hard you push: a force directed straight at the axle cannot rotate the body.</p>
      <p class="help">Then <b>τ = Iα</b>, which is Newton's second law with mass replaced by a
      <i>distribution</i> of mass. The same force applied to the same total mass gives a different
      acceleration depending only on how far that mass sits from the axis — which is why a hoop is
      so much harder to spin up than a disk of the same weight.</p>`;
  },
  wire(){
    ctWireSeg('tqMode', v => { ST.own = (v === 'custom'); ST.t = 0; });
    ctWireSeg('tqB', v => { ST.body = v; ST.t = 0; });
    wireSlider('tqM', () => ST.M, v => { ST.M = v; }, v => fmtNum(+v, 3) + ' kg');
    ctWireChk('tqRun', v => { ST.run = v; });
    if(ST.own){
      fnWire('tqTau', (m, s) => { ST.tsrc = s; ST.t = 0; }, pkParamBuild);
      wireSlider('tqT1', () => ST.T1, v => { ST.T1 = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' s');
      wireSlider('tqW0', () => ST.w0, v => { ST.w0 = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' rad/s');
      wireSlider('tqRR', () => ST.R, v => { ST.R = v; }, v => fmtNum(+v, 3) + ' m');
      return;
    }
    wireSlider('tqF', () => ST.F, v => { ST.F = v; }, v => fmtNum(+v, 3) + ' N');
    wireSlider('tqR', () => ST.r, v => { ST.r = v; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('tqA', () => ST.ang, v => { ST.ang = v; }, v => ctDeg(+v));
  },
  pick(st, sx, sy, phase){
    if(st.own) return;                       // the custom scene draws plots, not a body
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    const x = st.P.invX(sx), y = st.P.invY(sy);
    const d = Math.hypot(x, y);
    st.r = Math.max(0.05, Math.min(st.R, d));
  },
  vals(st){
    const B = RT_BODIES[st.body];
    /* RT_BODIES stores the closed form I(M, param) rather than a shape factor,
       so ask it for the number instead of inventing one */
    const I = B.I(st.M, st.R);
    const tau = rtTorque(st.r, st.F, st.ang);
    const al = rtAlpha(tau, I);
    return { B, I, tau, al, w:rtOmega(0, al, st.t), th:rtTheta(0, 0, al, st.t) };
  },
  frameOwn(st, dt, ctx, W, H){
    if(st.run) st.t += dt;
    const D = STAGES.rtTorque.own(st);
    const T1 = Math.max(0.05, st.T1);
    const tm = st.t - Math.floor(st.t / T1) * T1;
    /* the torque, sampled for drawing only — the numbers come from the engine */
    const NS = 240, tp = [];
    let lo = 0, hi = 0;
    for(let i = 0; i <= NS; i++){
      const t = T1 * i / NS, y = D.tau(t);
      tp.push({ x:t, y }); lo = Math.min(lo, y); hi = Math.max(hi, y);
    }
    if(hi - lo < 1e-9){ lo -= 1; hi += 1; }
    const wp = [];
    let wlo = 0, whi = 0;
    const skip = Math.max(1, Math.round(D.n / 320));
    for(let i = 0; i <= D.n; i += skip){
      wp.push({ x:D.ts[i], y:D.ws[i] });
      wlo = Math.min(wlo, D.ws[i]); whi = Math.max(whi, D.ws[i]);
    }
    if(whi - wlo < 1e-9){ wlo -= 1; whi += 1; }
    const gap = 52, ph = Math.max(56, (H - 168) / 2);
    const px = 74, pw = Math.max(60, W - 132);
    const P1 = mkPlot(px, 44, pw, ph, 0, T1, lo - (hi - lo) * 0.12, hi + (hi - lo) * 0.12);
    const P2 = mkPlot(px, 44 + ph + gap, pw, ph, 0, T1, wlo - (whi - wlo) * 0.12, whi + (whi - wlo) * 0.12);
    const ticks = [];
    for(let i = 0; i <= 6; i++) ticks.push(T1 * i / 6);
    /* a midpoint tick on a symmetric range lands at 1e-11 rather than 0, and
       fmtNum then writes a nine-character label that collides with the rotated
       axis title — snap anything that small to zero */
    const fy = (a, b) => v => fmtNum(Math.abs(v) < (b - a) * 1e-6 ? 0 : v, 3);
    plotFrame(ctx, P1, null, 'τ (N·m)', 'the torque you typed:  τ(t) = ' + pkPretty(st.tsrc));
    plotTicksX(ctx, P1, ticks, v => fmtNum(v, 2));
    plotTicksY(ctx, P1, [lo, (lo + hi) / 2, hi], fy(lo, hi));
    ctPath(ctx, P1, [{ x:0, y:0 }, { x:T1, y:0 }], rgbCss(TH.line2), 1);
    ctPath(ctx, P1, tp, rgbCss(TH.warn), 2.4);
    ctDot(ctx, P1, tm, D.tau(tm), 5, rgbCss(TH.warn), rgbCss(TH.bg));
    plotFrame(ctx, P2, 'time t (s)', 'ω (rad/s)',
              'ω from RK4 — the ring at the right edge is the quadrature answer');
    plotTicksX(ctx, P2, ticks, v => fmtNum(v, 2));
    plotTicksY(ctx, P2, [wlo, (wlo + whi) / 2, whi], fy(wlo, whi));
    ctPath(ctx, P2, [{ x:0, y:0 }, { x:T1, y:0 }], rgbCss(TH.line2), 1);
    ctPath(ctx, P2, wp, rgbCss(TH.grad), 2.4);
    const iw = Math.min(D.n, Math.max(0, Math.round(tm / T1 * D.n)));
    ctDot(ctx, P2, tm, D.ws[iw], 5, rgbCss(TH.grad), rgbCss(TH.bg));
    /* the second route, drawn where it lands: an open ring the filled dot sits
       inside when the two agree */
    ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(P2.X(T1), P2.Y(D.wQ), 9, 0, 6.2832); ctx.stroke();
    ctDot(ctx, P2, T1, D.w, 4, rgbCss(TH.grad), rgbCss(TH.bg));
    stageNote(ctx, 'ω = ω₀ + αt is gone; τ = Iα is not — the ring and the dot are two ways of finding the same ω', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.rtTorque.frameOwn(st, dt, ctx, W, H);
    if(st.run) st.t += dt;
    const v = this.vals(st);
    const P = ctBox(Math.min(W * 0.62, H * 1.25), H, 0, 0, 1.5);
    st.P = P;
    ctGrid(ctx, P);
    /* the body */
    ctx.beginPath();
    ctx.arc(P.X(0), P.Y(0), Math.abs(P.X(st.R) - P.X(0)), 0, 6.2832);
    ctx.fillStyle = rgbCss(TH.grad, 0.16); ctx.fill();
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4; ctx.stroke();
    /* spokes so the rotation is visible */
    for(let k = 0; k < 6; k++){
      const a = v.th + k * Math.PI / 3;
      ctPath(ctx, P, [{ x:0, y:0 }, { x:st.R * Math.cos(a), y:st.R * Math.sin(a) }],
             rgbCss(TH.faint, 0.7), 1.4);
    }
    /* the application point and the force, split into components */
    const ax = st.r * Math.cos(v.th), ay = st.r * Math.sin(v.th);
    const rhat = { x:Math.cos(v.th), y:Math.sin(v.th) };
    const that = { x:-Math.sin(v.th), y:Math.cos(v.th) };
    const s = 0.09;
    const Fperp = st.F * Math.sin(st.ang), Fpar = st.F * Math.cos(st.ang);
    ctArrow(ctx, P, ax, ay, ax + (rhat.x * Fpar + that.x * Fperp) * s,
            ay + (rhat.y * Fpar + that.y * Fperp) * s, rgbCss(TH.warn), 3, 'F');
    ctArrow(ctx, P, ax, ay, ax + that.x * Fperp * s, ay + that.y * Fperp * s,
            rgbCss(TH.pos), 2.2, 'F sin θ — the part that turns it');
    ctArrow(ctx, P, ax, ay, ax + rhat.x * Fpar * s, ay + rhat.y * Fpar * s,
            rgbCss(TH.neg, 0.8), 1.8, null);
    ctPath(ctx, P, [{ x:0, y:0 }, { x:ax, y:ay }], rgbCss(TH.curl), 2, [5, 4]);
    ctDot(ctx, P, ax, ay, 5, rgbCss(TH.warn), rgbCss(TH.bg));
    ctDot(ctx, P, 0, 0, 5, rgbCss(TH.text), rgbCss(TH.bg));
    ctFrame(ctx, P, RT_BODIES[st.body].name + ' — click to move where the force acts');
    /* the analogy table, drawn */
    if(W > 900){
      const x0 = W * 0.68;
      const rows = [['linear', 'rotational'], ['m — mass', 'I — moment of inertia'],
                    ['F — force', 'τ = rF sin θ'], ['a = F/m', 'α = τ/I'],
                    ['v', 'ω'], ['p = mv', 'L = Iω'], ['½mv²', '½Iω²']];
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      rows.forEach((r, i) => {
        ctx.font = (i === 0 ? '700 ' : '') + '12px ' + FONT_UI;
        ctx.fillStyle = i === 0 ? rgbCss(TH.dim) : rgbCss(TH.faint);
        ctx.fillText(r[0], x0, 90 + i * 26);
        ctx.fillStyle = i === 0 ? rgbCss(TH.dim) : rgbCss(TH.grad);
        ctx.fillText(r[1], x0 + 118, 90 + i * 26);
      });
    }
    stageNote(ctx, 'only the perpendicular component makes torque — push straight at the axle and nothing turns', W, H);
  },
  readoutOwn(st){
    const D = STAGES.rtTorque.own(st);
    const sc = Math.max(1e-12, Math.abs(D.w));
    const ordTxt = Number.isFinite(D.order)
      ? fmtNum(D.order, 3) + '  (RK4 should give 4)'
      : 'no order to measure — RK4 is exact on this torque';
    return `<div class="card tight"><div class="ttl">The programme you typed</div>
      ${kv('τ(t)', pkPretty(st.tsrc) + ' N·m')}
      ${kv('body', RT_BODIES[st.body].name)}
      ${kv('I, from its closed form', fmtNum(D.I, 6) + ' kg·m²')}
      ${kv('α at t = 0, from τ(0)/I', fmtNum(D.alpha0, 6) + ' rad/s²')}
      ${kv('ω at t = 0', fmtNum(st.w0, 5) + ' rad/s')}
      ${kv('run length', fmtNum(st.T1, 4) + ' s')}
      <p class="help">α is a <i>consequence</i> of the torque and the shape, recomputed at every instant.
      The moment it stops being constant every kinematic formula on the other tab stops applying, while
      τ = Iα carries on unchanged.</p>
    </div>
    <div class="card tight"><div class="ttl">ω, by two routes that share nothing</div>
      ${kv('ω(T) by RK4 on I dω/dt = τ(t)', fmtNum(D.w, 8) + ' rad/s')}
      ${kv('ω(T) by ω₀ + (1/I)∫τ dt, quadrature', fmtNum(D.wQ, 8) + ' rad/s')}
      ${kv('difference', fmtAgree(D.w, D.wQ, 'rad/s'))}
      ${kv('angular impulse ∫τ dt', fmtNum(D.J, 6) + ' N·m·s')}
      ${kv('and I ΔL/I = I(ω − ω₀)', fmtNum(D.dL, 6) + ' kg·m²/s')}
      ${kv('order of the stepper, measured by halving h', ordTxt)}
      <p class="help">One route marches the differential equation forward in small steps; the other never
      integrates an equation at all, it just measures the area under τ and divides by I. That they land on
      the same number is the <b>angular impulse–momentum theorem</b>, and the last row is the stepper's
      convergence rate measured rather than quoted — halve the step and watch the error fall by 2⁴.</p>
    </div>
    <div class="card tight"><div class="ttl">θ, the same way</div>
      ${kv('θ(T) by integrating ω along the track', fmtNum(D.th, 8) + ' rad')}
      ${kv('θ(T) by ω₀T + (1/I)∫(T−t)τ(t)dt', fmtNum(D.thQ, 8) + ' rad')}
      ${kv('difference', fmtAgree(D.th, D.thQ, 'rad'))}
      ${kv('in turns', fmtNum(D.th / (2 * Math.PI), 5))}
      <p class="help">The second route is one quadrature, not two. Swapping the order of the double
      integral ∫₀ᵀ∫₀ˢτ(u)du ds collapses it to a single integral with a (T − u) weight — the Cauchy formula
      for a repeated integral. It shares no code with the stepper and no algebra with the first row.</p>
    </div>
    <div class="card tight"><div class="ttl">And the work–energy theorem, checked</div>
      ${kv('∫τω dt over the integrated motion', fmtNum(D.work, 7) + ' J')}
      ${kv('½I(ω² − ω₀²) from the two endpoints', fmtNum(D.dK, 7) + ' J')}
      ${kv('difference', fmtGap(D.gapWork, Math.max(1e-12, Math.abs(D.dK), Math.abs(D.work)), 'J'))}
      ${kv('K at the start', fmtNum(D.K0, 6) + ' J')}
      ${kv('K at the end', fmtNum(D.K1, 6) + ' J')}
      <p class="help">Rotational work is <b>∫τ dθ</b>, and since dθ = ω dt that is the power τω integrated
      over the run. The right-hand side reads the kinetic energy off the two ends and never looks at what
      happened in between. A torque that reverses makes the point sharply: the two ends can be identical
      while a great deal of work went in and came back out again.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.rtTorque.readoutOwn(st);
    const v = this.vals(st);
    return `<div class="card tight"><div class="ttl">Torque</div>
      ${kv('lever arm r', fmtNum(st.r, 4) + ' m')}
      ${kv('force F', fmtNum(st.F, 4) + ' N')}
      ${kv('angle θ', ctDeg(st.ang))}
      ${kv('perpendicular component F sin θ', fmtNum(st.F * Math.sin(st.ang), 5) + ' N')}
      ${kv('τ = r F sin θ', fmtNum(v.tau, 6) + ' N·m')}
    </div>
    <div class="card tight"><div class="ttl">τ = I α</div>
      ${kv('body', v.B.name)}
      ${kv('I, from its closed form', fmtNum(v.I, 6) + ' kg·m²')}
      ${kv('as a multiple of MR²', fmtNum(v.I / (st.M * st.R * st.R), 4))}
      ${kv('α = τ / I', fmtNum(v.al, 6) + ' rad/s²')}
      ${kv('ω now', fmtNum(v.w, 5) + ' rad/s')}
      ${kv('θ now', fmtNum(v.th, 5) + ' rad')}
      ${kv('ω² = 2αθ, checked', fmtNum(Math.abs(v.w * v.w - 2 * v.al * v.th), 3))}
      <p class="help">The last row is the rotational analogue of v² = 2as, verified against the
      integrated motion rather than quoted. Every linear kinematic equation has a rotational twin,
      and for the same reason: both are constant acceleration integrated twice.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.rtTorque.own(st);
      return `<div class="k">two routes to ω</div>
        <div style="color:var(--c-grad)">ω(T) = ${fmtNum(D.w, 5)} rad/s</div>
        <div style="color:var(--c-pos)">they differ by ${fmtAgreeTight(D.w, D.wQ)}</div>`;
    }
    const v = this.vals(st);
    return `<div class="k">torque</div><div>τ = ${fmtNum(v.tau, 4)} N·m</div>
      <div style="color:var(--c-grad)">α = ${fmtNum(v.al, 4)} rad/s²</div>`;
  },
  legend(st){
    return st && st.own
      ? [['var(--c-warn)', 'the torque you typed'], ['var(--c-grad)', 'ω, stepped by RK4'],
         ['var(--c-pos)', 'ω from the quadrature route']]
      : [['var(--c-warn)', 'the applied force'], ['var(--c-pos)', 'its perpendicular part'],
         ['var(--c-neg)', 'the radial part — does nothing'], ['var(--c-curl)', 'the lever arm']];
  },
  dockLegend:true
};

/* ---- 2 · energy and momentum of a rotating system ------------------------- */
STAGES.rtEnergy = {
  title:'Energy & momentum of rotating systems',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Two conserved quantities that behave quite differently',
      steps:[
        drvStep('rotational kinetic energy',
          `${dv('KE')}_rot ${dop('=')} ${dfrac('1', '2')}${dv('I')}ω²`,
          'derived in the inertia stage by summing ½mv² over the body'),
        drvStep('and a rolling object carries both kinds at once',
          `${dv('KE')} ${dop('=')} ${dfrac('1', '2')}${dv('M')}${dv('v')}² ${dop('+')} ${dfrac('1', '2')}${dv('I')}ω²`,
          `dropping from h = ${n(st.h)} m, the panel shows the split as it rolls`),
        drvSay('the split is fixed by shape and nothing else',
          'With v = ωR and I = cMR², the rotational share is c/(1 + c) of the total — a pure number. A hoop puts half its energy into spinning, a solid sphere only two sevenths. That ratio is why the race in the rolling stage comes out as it does.'),
        drvStep('angular momentum is conserved when no torque acts',
          `${dv('L')} ${dop('=')} ${dv('I')}ω ${dop('=')} const`,
          st.mode !== 'roll' ? `changing I from ${n(st.M)} to a fraction ${n(st.I2frac)} of it` : ''),
        drvStep('but energy is not, and the two disagree in a specific way',
          `${dv('KE')} ${dop('=')} ${dfrac(dv('L') + '²', '2' + dv('I'))}`,
          'so halving I doubles the energy at fixed L — the panel prints both before and after'),
        drvSay('which tells you which one to reach for',
          'In a rotational collision or a sudden coupling of two discs, angular momentum is conserved and energy is not — some is lost to friction as the surfaces come to a common speed. Using energy conservation there gives the wrong answer, exactly as it does for an inelastic linear collision.'),
        drvStep('two discs coupling is the rotational inelastic collision',
          `ω_f ${dop('=')} ${dfrac(dv('I') + '₁ω₁', dv('I') + '₁ + ' + dv('I') + '₂')}`,
          'the panel computes the final speed and the energy lost in the coupling'),
        drvSay('and the energy lost has the same form as the linear case',
          'A fraction I₂/(I₁ + I₂) of the kinetic energy is dissipated, mirroring the mass ratio in a perfectly inelastic collision. The dictionary between linear and rotational quantities holds all the way through to the losses.'),
        drvStep('so a flywheel stores energy as L²/2I',
          `${dv('E')} ${dop('=')} ${dfrac(dv('L') + '²', '2' + dv('I'))}`,
          'which is why flywheels are made heavy at the rim and spun as fast as the material will bear'),
        drvSay('and why the energy has to fall when two discs couple',
          'Angular momentum is conserved because no external torque acts, so L stays put — but E = L²/2I, and coupling <b>increases</b> I. A larger denominator under a fixed numerator is a smaller energy, necessarily. Nothing had to be assumed about friction or how the surfaces grip: the loss is forced by the two conservation statements together, and whatever mechanism does the dissipating merely determines how long it takes, not how much.'),
        st.mode === 'custom'
          ? drvSay('and on two bodies you build, the clutch has to be modelled, not assumed',
              'The line above solves the coupling in one step by asserting that L is conserved. That is true, but it hides the claim worth testing — that the energy lost does not depend on how hard the clutch grips. So this scene integrates the coupling instead: a friction torque τ_f acts on each body, opposite in sign, and the two speeds are stepped until they meet. The total L is then measured along the way rather than imposed, the locking instant is found by inverse interpolation inside the crossing step, and the heat is accumulated as ∫τ_f|ω₁−ω₂|dt at the slipping surface. That integral is compared with ½·(I₁I₂/(I₁+I₂))·(Δω)², the reduced-inertia form, out of which τ_f has cancelled entirely — and the panel sweeps the grip over two orders of magnitude to show the loss not moving while the slipping time does.')
          : drvSay('the same algebra, read backwards, is why a skater spins up',
          'Pull the arms in and I falls with L fixed, so ω = L/I rises and E = L²/2I rises with it. Energy is not conserved here either — and it should not be, because the skater does work pulling against the centrifugal tendency, and that work is exactly the increase. Two problems that feel opposite are one equation with I moving in different directions, which is the sort of thing worth noticing before memorising either.')
      ],
      note:'The energy split between translation and rotation is computed from the simulated motion at every instant, and the total is checked against the potential energy released. Where a coupling occurs, the panel accounts for the energy lost rather than letting the total silently change.'
    };
  },
  enter(st, o){
    st.mode = o.mode || 'roll';
    /* an index into RT_RACE, which is the table that carries the rolling shape
       factor c = I/MR² — RT_BODIES stores closed forms instead */
    st.body = o.body === undefined ? 1 : o.body;
    st.h = 2; st.M = 2; st.R = 0.4;
    st.I2frac = o.I2frac === undefined ? 0.4 : o.I2frac;
    st.t = 0; st.run = o.run !== false;
    st.b1 = o.b1 || 'disc 0 0 4 0.5';
    st.b2 = o.b2 || 'ring 0 0 1.5 0.35\npoint 0 0 0.6';
    st.w1 = o.w1 === undefined ? 9 : o.w1;
    st.w2 = o.w2 === undefined ? 0 : o.w2;
    st.tauF = o.tauF === undefined ? 1.5 : o.tauF;
    st.cErr = '';
  },
  /* the two assemblies and their coupling, recomputed only when something they
     depend on changes — rtCoupleSweep runs the whole integration six more times */
  own(st){
    const key = st.b1 + '|' + st.b2 + '|' + st.w1 + '|' + st.w2 + '|' + st.tauF;
    if(st._ck === key) return st._cd;
    st._ck = key;
    const P1 = rtParseBody(st.b1), P2 = rtParseBody(st.b2);
    if(!P1.ok || !P2.ok){
      st._cd = { ok:false, errs:(P1.ok ? [] : P1.errs.map(e => ({ w:'first', e })))
                             .concat(P2.ok ? [] : P2.errs.map(e => ({ w:'second', e }))) };
      return st._cd;
    }
    const A = rtBodyProps(P1.pieces, 0, 0), B = rtBodyProps(P2.pieces, 0, 0);
    const C = rtCoupleRun(A.directCm, st.w1, B.directCm, st.w2, st.tauF, 600);
    const grips = [st.tauF / 8, st.tauF / 4, st.tauF, st.tauF * 4, st.tauF * 16];
    st._cd = { ok:true, A, B, C, I1:A.directCm, I2:B.directCm,
               SW:rtCoupleSweep(A.directCm, st.w1, B.directCm, st.w2, grips, 600) };
    return st._cd;
  },
  controls(){
    const st = ST;
    const head = ctSeg('reM', st.mode, [['roll', 'rolling down a ramp'], ['skate', 'the skater'],
                                        ['ledger', 'the energy ledger'],
                                        ['custom', 'couple two bodies of your own']]);
    if(st.mode === 'custom'){
      const D = STAGES.rtEnergy.own(st);
      return head +
        `<div class="fld" style="align-items:stretch">
          <textarea id="reB1" rows="3" spellcheck="false" autocomplete="off"
            aria-label="first body — one piece per line: kind, x, y, mass, size"
            data-audit="disc 0 0 5 0.6&#10;ring 0 0 1 0.6"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.b1)}</textarea>
        </div>
        ${ctlRow('ω₁ before', ctlSlider('reW1', -20, 20, 0.1, st.w1))}
        <div class="fld" style="align-items:stretch">
          <textarea id="reB2" rows="3" spellcheck="false" autocomplete="off"
            aria-label="second body — one piece per line: kind, x, y, mass, size"
            data-audit="rod 0 0 2 1.4&#10;point 0 0 0.4"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.b2)}</textarea>
        </div>
        ${ctlRow('ω₂ before', ctlSlider('reW2', -20, 20, 0.1, st.w2))}
        <div class="row wrap"><button class="btn sm pri" id="reCGo">Couple them</button></div>
        ${ctlRow('clutch torque', ctlSlider('reTau', 0.05, 30, 0.05, st.tauF))}
        <p class="help" id="reCMsg" style="color:${st.cErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.cErr ||
          (D.ok ? 'I₁ = ' + fmtNum(D.I1, 5) + ' kg·m², I₂ = ' + fmtNum(D.I2, 5) + ' kg·m².'
                : 'One piece per line: <b>kind&nbsp; x&nbsp; y&nbsp; mass&nbsp; size</b> — <b>point</b>, ' +
                  '<b>rod</b>, <b>disc</b>, <b>ring</b> or <b>plate</b>.')}</p>
        <p class="help">Two spinning bodies, brought into contact. Each sheet is a body assembled from
        pieces, so its moment of inertia is <b>computed</b>, twice, by the two routes the inertia stage
        uses — no table entry exists for either of them.</p>
        <p class="help">The coupling is <i>integrated</i>, not solved. A friction torque acts on each body,
        opposite in sign, until the two speeds meet; the total <b>L is measured along the way</b> rather
        than imposed, and the heat is accumulated as <b>∫τ|ω₁−ω₂|dt</b> at the slipping surface.</p>
        <p class="help">Then move the clutch torque. The energy lost <b>does not move</b> — a fierce grip
        and a gentle one dissipate exactly the same joules and differ only in how long the slipping takes.
        The panel sweeps it over a factor of 128 to show that, because two samples would prove nothing.</p>`;
    }
    return head +
      (st.mode === 'skate'
        ? ctlRow('pull arms to', ctlSlider('reI', 0.15, 1, 0.005, st.I2frac))
        : ctSeg('reB', String(st.body), RT_RACE.map((b, i) => [String(i), b.name])) +
          ctlRow('drop height h', ctlSlider('reH', 0.3, 4, 0.02, st.h))) +
      ctChk('reRun', 'run it', st.run) +
      `<p class="help">${st.mode === 'skate'
        ? 'Pull the arms in and <b>I falls, so ω rises</b> — because there is no external torque and L = Iω is conserved. Kinetic energy is <i>not</i>: ½Iω² = L²/2I grows as I shrinks, and the extra energy comes from the muscular work of pulling inwards against the centrifugal tendency. Conserving one quantity while another changes is the whole lesson.'
        : st.mode === 'roll'
        ? 'A rolling body arrives with its energy split between translation and rotation in a fixed ratio set by <b>c = I/MR²</b> alone. Mass and radius cancel exactly, so a large heavy hoop and a small light one tie — and both lose to any disk. The panel computes the split and checks it against the total drop.'
        : 'The ledger: gravitational energy in, translational and rotational kinetic energy out, and their sum held flat. Every row is measured from the integrated motion, not assumed.'}</p>`;
  },
  wire(){
    ctWireSeg('reM', v => { ST.mode = v; ST.t = 0; });
    if(ST.mode === 'custom'){
      wireSlider('reW1', () => ST.w1, v => { ST.w1 = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' rad/s');
      wireSlider('reW2', () => ST.w2, v => { ST.w2 = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' rad/s');
      wireSlider('reTau', () => ST.tauF, v => { ST.tauF = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' N·m');
      const apply = () => {
        const x = $('reB1'), y = $('reB2');
        if(x) ST.b1 = x.value;
        if(y) ST.b2 = y.value;
        ST.t = 0;
        const P1 = rtParseBody(ST.b1), P2 = rtParseBody(ST.b2);
        const bad = (P1.ok ? [] : P1.errs.map(e => 'first body, line ' + e.line + ': ' + e.msg))
          .concat(P2.ok ? [] : P2.errs.map(e => 'second body, line ' + e.line + ': ' + e.msg));
        ST.cErr = bad.length
          ? '⚠ ' + bad.slice(0, 4).join('<br>⚠ ') +
            '<br><span style="color:var(--faint)">The previous pair is still coupled.</span>' : '';
        const msg = $('reCMsg');
        if(msg){
          const D = STAGES.rtEnergy.own(ST);
          msg.innerHTML = ST.cErr || ('I₁ = ' + fmtNum(D.I1, 5) + ' kg·m², I₂ = ' + fmtNum(D.I2, 5) + ' kg·m².');
          msg.style.color = ST.cErr ? 'var(--c-neg)' : 'var(--faint)';
        }
        refreshStageReadout(); updateStageChip();
      };
      for(const id of ['reB1', 'reB2']){ const e = $(id); if(e) e.addEventListener('change', apply); }
      const g = $('reCGo'); if(g) g.addEventListener('click', apply);
      return;
    }
    ctWireSeg('reB', v => { ST.body = +v; ST.t = 0; });
    wireSlider('reH', () => ST.h, v => { ST.h = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('reI', () => ST.I2frac, v => { ST.I2frac = v; }, v => '× ' + fmtNum(+v, 3));
    ctWireChk('reRun', v => { ST.run = v; });
  },
  vals(st){
    const B = RT_RACE[st.body] || RT_RACE[1];
    const c = B.c;
    /* rolling without slipping: mgh = ½mv² + ½Iω² = ½mv²(1 + c) */
    const v = Math.sqrt(2 * DY_G * st.h / (1 + c));
    const w = v / st.R;
    const I = c * st.M * st.R * st.R;
    const Ktr = 0.5 * st.M * v * v, Krot = 0.5 * I * w * w;
    return { B, c, v, w, I, Ktr, Krot, U:st.M * DY_G * st.h };
  },
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.rtEnergy.own(st);
    if(!D.ok){
      ctText(ctx, W / 2, H / 2, 'the sheets are not readable yet — see the message under the boxes',
             rgbCss(TH.dim), '13px ' + FONT_UI, 'center');
      return;
    }
    const C = D.C;
    const T = Math.max(1e-6, (Number.isFinite(C.tLock) ? C.tLock : 1) * 1.18);
    let lo = Math.min(st.w1, st.w2, C.wf), hi = Math.max(st.w1, st.w2, C.wf);
    if(hi - lo < 1e-9){ lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.16;
    const barsH = 4 * 26 + 10;
    const ph = Math.max(50, H - 44 - barsH - 60);
    const P = mkPlot(74, 44, Math.max(60, W - 132), ph, 0, T, lo - pad, hi + pad);
    plotFrame(ctx, P, 'time (s)', 'ω (rad/s)', 'the clutch, integrated — the two speeds meeting');
    const ticks = [];
    for(let i = 0; i <= 5; i++) ticks.push(T * i / 5);
    plotTicksX(ctx, P, ticks, v => fmtNum(v, 2));
    plotTicksY(ctx, P, [lo, (lo + hi) / 2, hi],
               v => fmtNum(Math.abs(v) < (hi - lo) * 1e-6 ? 0 : v, 3));
    plotZeroY(ctx, P);
    const p1 = C.ts.map((t, i) => ({ x:t, y:C.o1[i] }));
    const p2 = C.ts.map((t, i) => ({ x:t, y:C.o2[i] }));
    if(Number.isFinite(C.tLock)){
      ctPath(ctx, P, [{ x:C.tLock, y:C.wf }, { x:T, y:C.wf }], rgbCss(TH.pos), 2.4, [6, 4]);
      ctDot(ctx, P, C.tLock, C.wf, 5, rgbCss(TH.pos), rgbCss(TH.bg));
      ctText(ctx, P.X(C.tLock), P.Y(C.wf) - 12,
             'locked at ' + fmtNum(C.tLock, 4) + ' s,  ω = ' + fmtNum(C.wf, 4) + ' rad/s',
             rgbCss(TH.pos), '600 11px ' + FONT_UI, 'center');
    }
    ctPath(ctx, P, p1, rgbCss(TH.grad), 2.6);
    ctPath(ctx, P, p2, rgbCss(TH.curl), 2.6);
    /* the ledger, as four bars: the two energies, and the heat by two routes */
    const rows = [['kinetic energy before', C.K0, TH.grad],
                  ['kinetic energy after', C.K1, TH.pos],
                  ['heat at the surface,  ∫τ|ω₁−ω₂| dt', C.heat, TH.neg],
                  ['and  ½·(I₁I₂/(I₁+I₂))·(Δω)²', C.heatClosed, TH.warn]];
    const mx = rows.reduce((m, r) => Math.max(m, r[1]), 0) * 1.08 || 1;
    const lx = 74, lw = Math.min(230, Math.max(120, W * 0.28));
    const bx = lx + lw + 10, bw = Math.max(40, W - bx - 120);
    const top = 44 + ph + 34;
    rows.forEach((r, i) => {
      const y = top + i * 26;
      ctText(ctx, lx + lw, y + 13, r[0], rgbCss(TH.faint), '11px ' + FONT_UI, 'right');
      ctx.fillStyle = rgbCss(r[2], 0.85);
      ctx.fillRect(bx, y, Math.max(1, bw * r[1] / mx), 17);
      ctText(ctx, bx + Math.max(1, bw * r[1] / mx) + 7, y + 13,
             fmtNum(r[1], 5) + ' J', rgbCss(TH.dim), '11px ' + FONT_MONO, 'left');
    });
    stageNote(ctx, 'the bottom two bars were computed by routes with nothing in common — the clutch torque cancels out of one of them', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.run) st.t += dt;
    if(st.mode === 'custom') return STAGES.rtEnergy.frameOwn(st, dt, ctx, W, H);
    if(st.mode === 'skate'){
      const I1 = 1, w1 = 2;
      const S = rtSkater(I1, w1, I1 * st.I2frac);
      const P = ctBox(Math.min(W * 0.55, H * 1.2), H, 0, 0, 1.6);
      const th = st.t * S.w2;
      /* a skater as a body with two extended arms */
      const armR = Math.sqrt(st.I2frac) * 1.1;
      ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), Math.abs(P.X(0.28) - P.X(0)), 0, 6.2832);
      ctx.fillStyle = rgbCss(TH.grad, 0.3); ctx.fill();
      for(const sgn of [1, -1]){
        const a = th + (sgn > 0 ? 0 : Math.PI);
        ctPath(ctx, P, [{ x:0, y:0 }, { x:armR * Math.cos(a), y:armR * Math.sin(a) }], rgbCss(TH.warn), 5);
        ctDot(ctx, P, armR * Math.cos(a), armR * Math.sin(a), 7, rgbCss(TH.pos), rgbCss(TH.bg));
      }
      ctGrid(ctx, P);
      ctFrame(ctx, P, 'pull the arms in — L is conserved, ω rises, and K rises with it');
      /* the two bars */
      const bx = W * 0.62, bw = Math.min(300, W - bx - 50);
      if(bw > 120){
        const bars = [['L = Iω  (conserved)', S.L1, S.L2, TH.grad],
                      ['K = ½Iω²  (not)', S.K1, S.K2, TH.warn]];
        bars.forEach(([lab, a, b, col], i) => {
          const y = 110 + i * 120, mx = Math.max(a, b) * 1.15;
          ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 12px ' + FONT_UI;
          ctx.textAlign = 'left'; ctx.fillText(lab, bx, y - 14);
          [[a, 'before', 0], [b, 'after', 34]].forEach(([val, nm, dy]) => {
            ctx.fillStyle = rgbCss(col, 0.85);
            ctx.fillRect(bx, y + dy, bw * val / mx, 22);
            ctx.fillStyle = rgbCss(TH.text); ctx.font = '11px ' + FONT_MONO;
            ctx.fillText(fmtNum(val, 4) + '  ' + nm, bx + 6, y + dy + 16);
          });
        });
      }
      stageNote(ctx, 'the green bars match; the orange ones do not — that difference is the work the skater did', W, H);
      return;
    }
    /* rolling down a ramp */
    const v = this.vals(st);
    const P = mkPlot(80, 60, W - 160, H - 150, 0, 4, 0, 3);
    plotFrame(ctx, P, 'distance along the ground (m)', 'height (m)', 'the ramp, and the energy split on arrival');
    ctPath(ctx, P, [{ x:0, y:st.h }, { x:3, y:0 }, { x:4, y:0 }], rgbCss(TH.line2), 3);
    const T = Math.min(st.t % 4, 3);
    const frac = T / 3;
    const px = frac * 3, py = st.h * (1 - frac);
    ctx.beginPath();
    ctx.arc(P.X(px), P.Y(py) - 8, 12, 0, 6.2832);
    ctx.fillStyle = rgbCss(TH.grad, 0.4); ctx.fill();
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2; ctx.stroke();
    const spin = -frac * 18;
    ctx.beginPath();
    ctx.moveTo(P.X(px), P.Y(py) - 8);
    ctx.lineTo(P.X(px) + 12 * Math.cos(spin), P.Y(py) - 8 + 12 * Math.sin(spin));
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2; ctx.stroke();
    /* the energy split as a stacked bar */
    const bx = P.px + P.pw * 0.62, by = P.py + 30, bw = 170;
    const tot = v.U || 1;
    ctx.fillStyle = rgbCss(TH.neg, 0.85);
    ctx.fillRect(bx, by, bw * v.Ktr / tot, 26);
    ctx.fillStyle = rgbCss(TH.curl, 0.85);
    ctx.fillRect(bx + bw * v.Ktr / tot, by, bw * v.Krot / tot, 26);
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '11px ' + FONT_UI; ctx.textAlign = 'left';
    ctx.fillText('translation ' + Math.round(100 / (1 + v.c)) + '%   ·   rotation ' +
                 Math.round(100 * v.c / (1 + v.c)) + '%', bx, by - 8);
    stageNote(ctx, 'the split depends only on the shape factor c = I/MR² — mass and radius cancel exactly', W, H);
  },
  readoutOwn(st){
    const D = STAGES.rtEnergy.own(st);
    if(!D.ok) return `<div class="card tight"><div class="ttl">A sheet has a problem</div>
      ${D.errs.slice(0, 5).map(x => kv(x.w + ' body, line ' + x.e.line, x.e.msg)).join('')}
      <p class="help">The previous pair is still coupled. One piece per line:
      <b>kind&nbsp; x&nbsp; y&nbsp; mass&nbsp; size</b>.</p></div>`;
    const C = D.C, SW = D.SW;
    if(!C.ok) return `<div class="card tight"><div class="ttl">Nothing to couple</div>
      <p class="help">These two are already turning at the same rate, so the clutch has nothing to do:
      no slipping, no heat, no change. Give them different speeds.</p></div>`;
    const rel = Math.abs(C.K0) > 1e-12 ? C.dK / C.K0 : 0;
    return `<div class="card tight"><div class="ttl">The two bodies you built</div>
      ${kv('first: mass', fmtNum(D.A.M, 5) + ' kg')}
      ${kv('I₁ by quadrature', fmtNum(D.A.directCm, 6) + ' kg·m²')}
      ${kv('I₁ by the parallel-axis theorem', fmtNum(D.A.Icm, 6) + ' kg·m²')}
      ${kv('second: mass', fmtNum(D.B.M, 5) + ' kg')}
      ${kv('I₂ by quadrature', fmtNum(D.B.directCm, 6) + ' kg·m²')}
      ${kv('I₂ by the parallel-axis theorem', fmtNum(D.B.Icm, 6) + ' kg·m²')}
      ${kv('largest of the two differences', fmtNum(Math.max(D.A.gapCm, D.B.gapCm), 3) + ' kg·m²')}
      ${kv('reduced inertia I₁I₂/(I₁+I₂)', fmtNum(C.Ired, 6) + ' kg·m²')}
      <p class="help">Neither body has a table entry, so each moment of inertia is computed twice by the
      routes the inertia stage uses, and the difference is printed. The reduced inertia is the rotational
      twin of the reduced mass — it is what decides the collision.</p>
    </div>
    <div class="card tight"><div class="ttl">The coupling, integrated</div>
      ${kv('L before, I₁ω₁ + I₂ω₂', fmtNum(C.L0, 8) + ' kg·m²/s')}
      ${kv('L after, from the stepped speeds', fmtNum(C.L1, 8) + ' kg·m²/s')}
      ${kv('largest drift along the run', fmtNum(C.dL, 3) + ' kg·m²/s')}
      ${kv('ω after, measured from the track', fmtNum(C.wf, 8) + ' rad/s')}
      ${kv('ω after, from ΣIω/ΣI', fmtNum(C.wfClosed, 8) + ' rad/s')}
      ${kv('the clutch slipped for', fmtNum(C.tLock, 6) + ' s')}
      ${kv('and |Δω|/(τ(1/I₁+1/I₂)) says', fmtNum(C.tLockClosed, 6) + ' s')}
      <p class="help">No conservation law was imposed on the stepper. It was given one friction torque
      acting on each body with opposite sign, and the fact that <b>I₁ω₁ + I₂ω₂</b> never moves is Newton's
      third law showing up as a conserved total — equal and opposite torques, so the two changes in angular
      momentum cancel exactly.</p>
    </div>
    <div class="card tight"><div class="ttl">The energy lost, by two routes</div>
      ${kv('heat generated, ∫τ|ω₁−ω₂| dt', fmtNum(C.heat, 7) + ' J')}
      ${kv('½·(I₁I₂/(I₁+I₂))·(Δω)²', fmtNum(C.heatClosed, 7) + ' J')}
      ${kv('difference', fmtAgree(C.heat, C.heatClosed, 'J'))}
      ${kv('K before', fmtNum(C.K0, 6) + ' J')}
      ${kv('K after', fmtNum(C.K1, 6) + ' J')}
      ${kv('K lost', fmtNum(C.dK, 6) + ' J')}
      ${kv('as a fraction of what there was', fmtNum(100 * rel, 4) + '%')}
      <p class="help">One route is a quadrature over the sliding surface: the friction torque times the
      speed it slides at, integrated over however long the slipping lasted. The other is a closed form in
      which <b>the clutch torque does not appear at all</b>. This is the rotational twin of ½μ(Δu)² in a
      perfectly inelastic linear collision, reduced mass and all.</p>
    </div>
    <div class="card tight"><div class="ttl">And the grip does not matter</div>
      ${SW.runs.map(r => kv('τ = ' + fmtNum(r.tau, 4) + ' N·m',
        'slipped ' + fmtNum(r.tLock, 5) + ' s,  lost ' + fmtNum(r.heat, 7) + ' J')).join('')}
      ${kv('spread in the heat across that sweep', fmtNum(SW.spread, 3) + ' J')}
      ${kv('as a fraction', fmtNum(SW.relSpread, 3))}
      ${kv('spread in the slipping time', fmtNum(SW.tHi / Math.max(1e-12, SW.tLo), 4) + '×')}
      <p class="help">A factor of 128 in how hard the clutch bites changes the slipping time by that same
      factor and the energy lost by nothing at all. That is the result worth having: the loss is fixed by
      the two moments of inertia and the speed difference, and the mechanism that does the dissipating only
      sets how long it takes. Sampling two values would prove nothing, so the panel sweeps.</p>
    </div>`;
  },
  readout(st){
    if(st.mode === 'custom') return STAGES.rtEnergy.readoutOwn(st);
    if(st.mode === 'skate'){
      const S = rtSkater(1, 2, st.I2frac);
      return `<div class="card tight"><div class="ttl">Angular momentum is conserved</div>
        ${kv('I before', fmtNum(1, 4))}${kv('ω before', fmtNum(2, 4) + ' rad/s')}
        ${kv('L before = Iω', fmtNum(S.L1, 6))}
        ${kv('I after', fmtNum(st.I2frac, 4))}${kv('ω after', fmtNum(S.w2, 6) + ' rad/s')}
        ${kv('L after', fmtNum(S.L2, 6))}
        ${kv('difference', fmtAgree(S.L1, S.L2))}
        <p class="help">No external torque acts, so L cannot change — and it does not, to machine
        precision. That is the whole reason ω rises.</p>
      </div>
      <div class="card tight"><div class="ttl">Kinetic energy is not</div>
        ${kv('K before', fmtNum(S.K1, 6) + ' J')}
        ${kv('K after', fmtNum(S.K2, 6) + ' J')}
        ${kv('increase', fmtNum(S.K2 - S.K1, 6) + ' J')}
        ${kv('K = L²/2I', fmtNum(S.L2 * S.L2 / (2 * st.I2frac), 6) + ' J')}
        <p class="help">Since L is fixed, K = L²/2I <i>must</i> rise as I falls. The energy is not
        appearing from nowhere: it is the work the skater does pulling the arms inwards against the
        outward tendency of the rotating mass. Conservation of one quantity does not imply
        conservation of another, and this is the cleanest demonstration of that in mechanics.</p>
      </div>`;
    }
    const v = this.vals(st);
    return `<div class="card tight"><div class="ttl">The energy ledger on arrival</div>
      ${kv('potential energy released Mgh', fmtNum(v.U, 6) + ' J')}
      ${kv('translational ½Mv²', fmtNum(v.Ktr, 6) + ' J')}
      ${kv('rotational ½Iω²', fmtNum(v.Krot, 6) + ' J')}
      ${kv('their sum', fmtNum(v.Ktr + v.Krot, 6) + ' J')}
      ${kv('difference from Mgh', fmtAgree(v.U, v.Ktr + v.Krot, 'J'))}
      <p class="help">The two kinetic pieces are computed independently from the speed and the spin,
      then added and compared with the drop. Nothing was assumed to balance; it balances.</p>
    </div>
    <div class="card tight"><div class="ttl">Why shape alone decides the race</div>
      ${kv('shape factor c = I/MR²', fmtNum(v.c, 4))}
      ${kv('fraction into translation 1/(1+c)', fmtNum(1 / (1 + v.c), 5))}
      ${kv('fraction into rotation c/(1+c)', fmtNum(v.c / (1 + v.c), 5))}
      ${kv('arrival speed √(2gh/(1+c))', fmtNum(v.v, 6) + ' m/s')}
      ${kv('a sliding block would reach', fmtNum(Math.sqrt(2 * DY_G * st.h), 6) + ' m/s')}
      <p class="help">M and R cancel out of the arrival speed entirely — change either and the number
      does not move. Only c survives, so every solid disk ties with every other solid disk regardless
      of size or weight, and all of them beat every hoop. A frictionless sliding block, putting
      nothing into rotation, beats them all.</p>
      <p class="help">Note that static friction is what makes the rolling happen, and it does
      <b>no work</b>: the contact point is instantaneously at rest, so there is no sliding for it to
      dissipate. The energy is redistributed, not lost.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'custom'){
      const D = STAGES.rtEnergy.own(st);
      if(!D.ok) return `<div class="k">the sheets</div><div style="color:var(--c-neg)">not readable yet</div>`;
      return `<div class="k">coupled</div>
        <div style="color:var(--c-pos)">ω = ${fmtNum(D.C.wf, 5)} rad/s</div>
        <div style="color:var(--c-neg)">${fmtNum(D.C.heat, 5)} J as heat</div>`;
    }
    if(st.mode === 'skate'){
      const S = rtSkater(1, 2, st.I2frac);
      return `<div class="k">skater</div><div style="color:var(--c-grad)">L = ${fmtNum(S.L2, 4)}</div>
        <div style="color:var(--c-warn)">K = ${fmtNum(S.K2, 4)} J</div>`;
    }
    const v = this.vals(st);
    return `<div class="k">rolling</div><div>v = ${fmtNum(v.v, 4)} m/s</div>
      <div style="color:var(--c-curl)">${Math.round(100 * v.c / (1 + v.c))}% into spin</div>`;
  },
  legend(st){
    return st && st.mode === 'custom'
      ? [['var(--c-grad)', 'the first body, and the energy before'],
         ['var(--c-curl)', 'the second body'],
         ['var(--c-pos)', 'the common speed they lock at'],
         ['var(--c-neg)', 'the heat, by quadrature'],
         ['var(--c-warn)', 'the heat, by the closed form']]
      : [['var(--c-neg)', 'translational energy'], ['var(--c-curl)', 'rotational energy'],
         ['var(--c-grad)', 'angular momentum'], ['var(--c-warn)', 'kinetic energy']];
  },
  dockLegend:true
};
