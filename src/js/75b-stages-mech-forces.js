STAGES.dyForce = {
  title:"Newton's laws",
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 9.80665;
    return {
      title:'Draw the forces, choose the axes, and the algebra is forced',
      steps:[
        drvSay('the method, stated as a method',
          'Isolate one body. Draw every force acting on it and nothing else. Choose axes. Write F = ma along each. Everything afterwards is algebra. Almost every error in mechanics is a force drawn that should not be there, or one left out.'),
        drvStep('the second law, component by component',
          `Σ${dv('F')} ${dop('=')} ${dv('m')}${dv('a')}`,
          st.scene === 'incline' ? `m = ${n(st.m)} kg on a ${n(st.ang * 180 / Math.PI)}° slope, μ = ${n(st.mu)}` : 'applied to each body separately'),
        drvSay('choosing the axes is the one real decision',
          'Tilting the axes to lie along and across a slope leaves the acceleration with only one component. Using horizontal and vertical axes gives two coupled equations and the same answer after more work. Axis choice is not cosmetic.'),
        drvStep('resolve the weight into those axes',
          `${dv('W')}_∥ ${dop('=')} ${dv('m')}${dv('g')} sin θ, &nbsp; ${dv('W')}_⊥ ${dop('=')} ${dv('m')}${dv('g')} cos θ`,
          st.scene === 'incline' ? `${n(st.m * g * Math.sin(st.ang))} N along the slope, ${n(st.m * g * Math.cos(st.ang))} N into it` : ''),
        drvStep('across the slope nothing accelerates, which fixes N',
          `${dv('N')} ${dop('=')} ${dv('m')}${dv('g')} cos θ`,
          'the normal force is a response, not a given — it adjusts to whatever stops penetration'),
        drvSay('which is why the critical angle has no mass in it',
          'Friction is μN, and N falls as the slope steepens, so the retarding force shrinks exactly as the driving force grows. Setting them equal gives tan θ = μ, with the mass cancelling — a heavy block and a light one slip at the same angle.'),
        drvStep('along the slope, what remains is the acceleration',
          `${dv('a')} ${dop('=')} ${dv('g')}(sin θ ${dop('−')} μ cos θ)`,
          st.scene === 'incline' ? `a = ${n(g * (Math.sin(st.ang) - st.mu * Math.cos(st.ang)))} m/s²` : ''),
        drvSay('static and kinetic friction are different things',
          'Kinetic friction has a fixed size μN opposing motion. Static friction is whatever it must be to prevent sliding, up to a maximum — it is a constraint force, like the normal force. Writing f = μN for something stationary is wrong unless it is on the point of slipping.'),
        drvStep('the third law concerns pairs on different bodies',
          `${dv('F')}₁₂ ${dop('=')} ${dop('−')}${dv('F')}₂₁`,
          'equal and opposite, but never on the same object — so they never cancel within one free-body diagram'),
        drvSay('and that is the most persistent confusion in the subject',
          'A book rests on a table: its weight and the normal force are equal and opposite, and they are not a third-law pair, because both act on the book. The partner of the book\'s weight is the book\'s gravitational pull on the Earth. Third-law pairs always act on different bodies.'),
        st.scene === 'custom'
          ? drvSay('and with your own law the second law has consequences to be checked',
              'Integrating F = ma over dx gives ∫F·dx = ½mv² − ½mv₀², the work–energy theorem, and the panel computes both sides without letting either see the other: the left is a line integral accumulated step by step along the trajectory, weighted by the dx each step took, and the right reads two velocities off the ends of the run. The second comparison is the one that defines a potential energy. Split your force into the part depending on position alone and everything else; integrate that first part along the wandering path, then integrate it straight from the first x to the last. Path-independence is not obvious and it is not universal — it holds exactly because that part cannot tell how fast or when it is being crossed, and the moment your law mentions v or t the remainder stops obeying it, by precisely the energy the panel says went missing.')
          : drvSay('and each of these scenes is a free-body diagram someone drew for you',
              'Which is the limitation worth noticing: the forces are chosen so the algebra closes. Writing a law of your own turns the same second law into something with a consequence that can be measured — ∫F·dx against the change in kinetic energy, and the path-independence that decides whether a potential energy exists at all.')
      ],
      note:'The free-body diagram drawn is assembled from the forces the solver actually uses, so nothing appears in the picture that is missing from the equations. Change the angle or the friction and both update together.'
    };
  },
  enter(st, o){
    st.scene = o.scene || 'incline';
    st.m = 2; st.ang = 25 * Math.PI / 180; st.mu = 0.25;
    st.m1 = 3; st.m2 = 2; st.v = 3; st.r = 0.8;
    st.fsrc = o.fsrc || '-4*x - 0.3*v';
    st.fm = o.fm === undefined ? 0.5 : o.fm;
    st.fx0 = o.fx0 === undefined ? 1.5 : o.fx0;
    st.fv0 = o.fv0 === undefined ? 0 : o.fv0;
    st.fT = o.fT === undefined ? 12 : o.fT;
  },
  /* the typed law, integrated once per edit: dyForceRun does an adaptive
     quadrature and two thousand RK4 steps, and the readout asks four times a
     second */
  own(st){
    const key = st.fsrc + '@' + st.fm + '@' + st.fx0 + '@' + st.fv0 + '@' + st.fT;
    if(st._fk === key) return st._fd;
    st._fk = key;
    const raw = pkXVTFn(st.fsrc, () => 0);
    const F = (x, v, t) => {
      const q = raw(x, v, t);
      return Number.isFinite(q) ? Math.max(-1e7, Math.min(1e7, q)) : 0;
    };
    const D = dyForceRun(F, st.fm, st.fx0, st.fv0, st.fT, 2400);
    D.F = F;
    D.order = dyForceOrder(F, st.fm, st.fx0, st.fv0, Math.min(st.fT, 4), 40);
    /* is the law position-only? asked of the function rather than of its text,
       so `x - 0*v` is not caught out on a technicality */
    let dep = 0;
    for(let i = 0; i <= 12; i++){
      const x = st.fx0 - 2 + 4 * i / 12;
      dep = Math.max(dep, Math.abs(F(x, 1.7, 0) - F(x, 0, 0)), Math.abs(F(x, 0, 2.3) - F(x, 0, 0)));
    }
    D.dep = dep;
    st._fd = D;
    return D;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('dyFS', st.scene, Object.keys(DY_SCENES).map(k => [k, DY_SCENES[k].name])
                      .concat([['custom', 'a force law of your own']]));
    if(st.scene === 'custom'){
      const D = STAGES.dyForce.own(st);
      return seg +
        fnHtml('dyFf', 'force F =', st.fsrc, 'x in metres, v in m/s, t in seconds') +
        ctlRow('mass', ctlSlider('dyFfm', 0.05, 5, 0.01, st.fm)) +
        ctlRow('x at t = 0', ctlSlider('dyFfx', -6, 6, 0.05, st.fx0)) +
        ctlRow('v at t = 0', ctlSlider('dyFfv', -8, 8, 0.05, st.fv0)) +
        ctlRow('run for', ctlSlider('dyFfT', 1, 40, 0.5, st.fT)) +
        `<p class="help">Write the force in newtons using <b>x</b>, <b>v</b> and <b>t</b>:
        <b>−4·x</b> for a spring, <b>−4·x − 0.3·v</b> with a dashpot, <b>−9.8·0.5 + 2·cos(t)</b> for a
        driven weight, <b>−0.2·v·abs(v)</b> for pure drag.</p>
        <p class="help">The panel then measures the <b>work–energy theorem</b>: ∫F·dx is accumulated as a
        line integral <i>along the trajectory</i> — which is not ∫F dt, and matters the moment the object
        turns round — and compared with ½mv² read off the two ends. Nothing links those two calculations.</p>
        <p class="help">The sharper test is the one below it. The part of your law that depends on
        <b>position alone</b> is integrated twice: once along the actual path, doubling back wherever the
        motion did, and once by a single quadrature straight from the first x to the last. Those agree
        <i>only</i> because a position-only force is path-independent — and that is what
        <b>conservative</b> means. ${D.dep > 1e-12
          ? 'Your law also depends on v or t, so the total work is <i>not</i> path-independent, and the panel prints how much energy that took out.'
          : 'Your law depends on position alone, so the whole force is conservative and the total energy does not move.'}</p>`;
    }
    let s = '';
    if(st.scene === 'incline') s = ctlRow('mass', ctlSlider('dyFm', 0.5, 6, 0.1, st.m)) +
      ctlRow('angle', ctlSlider('dyFa', 2, 60, 0.5, st.ang * 180 / Math.PI)) +
      ctlRow('μ', ctlSlider('dyFmu', 0, 1.2, 0.01, st.mu));
    else if(st.scene === 'atwood') s = ctlRow('m₁', ctlSlider('dyFm1', 0.5, 8, 0.1, st.m1)) +
      ctlRow('m₂', ctlSlider('dyFm2', 0.5, 8, 0.1, st.m2));
    else if(st.scene === 'circular') s = ctlRow('mass', ctlSlider('dyFm', 0.2, 4, 0.05, st.m)) +
      ctlRow('radius', ctlSlider('dyFr', 0.2, 2, 0.02, st.r)) +
      ctlRow('speed', ctlSlider('dyFv', 0.4, 9, 0.05, st.v));
    else s = ctlRow('mass', ctlSlider('dyFm', 20, 120, 1, st.m));
    return seg + s + `<p class="help">${DY_SCENES[st.scene].note}</p>
      <p class="help">A free-body diagram is not a sketch — it is the statement that <b>ΣF = ma</b> holds
      separately in each direction, and choosing axes that line up with the acceleration is what turns two
      hard equations into one easy one and one trivial one. Every arrow drawn here is drawn to scale, so
      their vector sum really is the net force the panel reports.</p>`;
  },
  wire(){
    ctWireSeg('dyFS', v => { ST.scene = v; if(v === 'drag') ST.m = 70; else if(ST.m > 10) ST.m = 2; });
    if(ST.scene === 'custom'){
      fnWire('dyFf', (m, s) => { ST.fsrc = s; }, pkXVTBuild);
      wireSlider('dyFfm', () => ST.fm, v => { ST.fm = Math.max(1e-3, v); }, v => fmtNum(+v, 3) + ' kg');
      wireSlider('dyFfx', () => ST.fx0, v => { ST.fx0 = v; }, v => fmtNum(+v, 3) + ' m');
      wireSlider('dyFfv', () => ST.fv0, v => { ST.fv0 = v; }, v => fmtNum(+v, 3) + ' m/s');
      wireSlider('dyFfT', () => ST.fT, v => { ST.fT = Math.max(0.2, v); }, v => fmtNum(+v, 3) + ' s');
      return;
    }
    wireSlider('dyFm', () => ST.m, v => { ST.m = v; }, v => fmtNum(+v, 3) + ' kg');
    wireSlider('dyFa', () => ST.ang * 180 / Math.PI, v => { ST.ang = v * Math.PI / 180; }, v => fmtNum(+v, 3) + '°');
    wireSlider('dyFmu', () => ST.mu, v => { ST.mu = v; }, v => fmtNum(+v, 3));
    wireSlider('dyFm1', () => ST.m1, v => { ST.m1 = v; }, v => fmtNum(+v, 3) + ' kg');
    wireSlider('dyFm2', () => ST.m2, v => { ST.m2 = v; }, v => fmtNum(+v, 3) + ' kg');
    wireSlider('dyFr', () => ST.r, v => { ST.r = v; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('dyFv', () => ST.v, v => { ST.v = v; }, v => fmtNum(+v, 3) + ' m/s');
  },
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.dyForce.own(st);
    const n = D.n;
    const skip = Math.max(1, Math.round(n / 900));
    /* the phase portrait: a closed loop means conservative, a spiral means the
       energy is going somewhere */
    let xlo = Infinity, xhi = -Infinity, vlo = Infinity, vhi = -Infinity;
    let elo = Infinity, ehi = -Infinity;
    const ph = [], eK = [], eU = [], eE = [];
    for(let i = 0; i <= n; i += skip){
      const x = D.xs[i], v = D.vs[i], t = D.ts[i];
      xlo = Math.min(xlo, x); xhi = Math.max(xhi, x);
      vlo = Math.min(vlo, v); vhi = Math.max(vhi, v);
      ph.push({ x, y:v });
      const K = D.Ks[i], U = D.Us[i];
      eK.push({ x:t, y:K }); eU.push({ x:t, y:U }); eE.push({ x:t, y:K + U });
      elo = Math.min(elo, K, U, K + U); ehi = Math.max(ehi, K, U, K + U);
    }
    if(xhi - xlo < 1e-9){ xlo -= 1; xhi += 1; }
    if(vhi - vlo < 1e-9){ vlo -= 1; vhi += 1; }
    if(ehi - elo < 1e-9){ elo -= 1; ehi += 1; }
    const pw = Math.max(140, Math.min(W * 0.46, H * 1.1));
    const P = mkPlot(76, 46, Math.max(60, pw - 96), Math.max(60, H - 128),
                     xlo - (xhi - xlo) * 0.1, xhi + (xhi - xlo) * 0.1,
                     vlo - (vhi - vlo) * 0.1, vhi + (vhi - vlo) * 0.1);
    plotFrame(ctx, P, 'x  (m)', 'v  (m/s)', 'the phase portrait — closed means conservative');
    plotTicksX(ctx, P, [xlo, (xlo + xhi) / 2, xhi], v => fmtNum(v, 3));
    plotTicksY(ctx, P, [vlo, (vlo + vhi) / 2, vhi], v => fmtNum(v, 3));
    plotZeroY(ctx, P);
    ctPath(ctx, P, ph, rgbCss(TH.grad), 1.8);
    ctDot(ctx, P, D.xs[0], D.vs[0], 5, rgbCss(TH.pos), rgbCss(TH.bg));
    ctDot(ctx, P, D.x, D.v, 5, rgbCss(TH.neg), rgbCss(TH.bg));
    /* the ledger */
    const Q = mkPlot(pw + 70, 46, Math.max(60, W - pw - 110), Math.max(60, H - 128),
                     0, st.fT, elo - (ehi - elo) * 0.1, ehi + (ehi - elo) * 0.1);
    plotFrame(ctx, Q, 'time  (s)', 'energy  (J)', 'kinetic, potential, and their sum');
    const tk = [];
    for(let i = 0; i <= 4; i++) tk.push(st.fT * i / 4);
    plotTicksX(ctx, Q, tk, v => fmtNum(v, 3));
    plotTicksY(ctx, Q, [elo, (elo + ehi) / 2, ehi],
               v => fmtNum(Math.abs(v) < (ehi - elo) * 1e-6 ? 0 : v, 3));
    plotZeroY(ctx, Q);
    ctPath(ctx, Q, eK, rgbCss(TH.curl), 1.8);
    ctPath(ctx, Q, eU, rgbCss(TH.pos), 1.8);
    ctPath(ctx, Q, eE, rgbCss(TH.warn), 2.6);
    stageNote(ctx, D.dep > 1e-12
      ? 'the thick line is the total — it slopes because your force mentions v or t'
      : 'the thick line is the total, and it is flat because your force depends on position alone', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.scene === 'custom') return STAGES.dyForce.frameOwn(st, dt, ctx, W, H);
    const P = ctBox(W, H, 0, 0.4, 2.6);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, DY_SCENES[st.scene].name);
    const S = DY_SCENES[st.scene];
    if(st.scene === 'incline'){
      const r = S.solve(st.m, st.ang, st.mu);
      const L = 2.4, th = st.ang;
      const base = [{ x:-1.6, y:-1 }, { x:-1.6 + L * Math.cos(th), y:-1 + L * Math.sin(th) }];
      ctFill(ctx, P, [{ x:-1.6, y:-1 }, base[1], { x:base[1].x, y:-1 }], rgbCss(TH.line2, 0.35));
      ctPath(ctx, P, [base[0], base[1]], rgbCss(TH.faint), 3);
      const bx = -1.6 + L * 0.55 * Math.cos(th), by = -1 + L * 0.55 * Math.sin(th);
      /* the block, drawn on the slope */
      const ux = Math.cos(th), uy = Math.sin(th), nx = -Math.sin(th), ny = Math.cos(th);
      const hw = 0.22;
      ctFill(ctx, P, [
        { x:bx - ux * hw, y:by - uy * hw }, { x:bx + ux * hw, y:by + uy * hw },
        { x:bx + ux * hw + nx * 0.3, y:by + uy * hw + ny * 0.3 },
        { x:bx - ux * hw + nx * 0.3, y:by - uy * hw + ny * 0.3 }], rgbCss(TH.grad, 0.7));
      const c = { x:bx + nx * 0.15, y:by + ny * 0.15 };
      const s = 0.06;
      ctArrow(ctx, P, c.x, c.y, c.x, c.y - r.W * s, rgbCss(TH.neg), 2.6, 'mg');
      ctArrow(ctx, P, c.x, c.y, c.x + nx * r.normal * s, c.y + ny * r.normal * s, rgbCss(TH.pos), 2.6, 'N');
      ctArrow(ctx, P, c.x, c.y, c.x - ux * r.friction * s, c.y - uy * r.friction * s, rgbCss(TH.warn), 2.6, 'f');
      if(r.slides) ctArrow(ctx, P, c.x, c.y, c.x + ux * r.net * s, c.y + uy * r.net * s, rgbCss(TH.curl), 3, 'net');
      ctText(ctx, P.X(-1.35), P.Y(-0.9), fmtNum(st.ang * 180 / Math.PI, 3) + '°', rgbCss(TH.dim), '600 12px ' + FONT_UI);
    } else if(st.scene === 'atwood'){
      const r = S.solve(st.m1, st.m2);
      ctx.strokeStyle = rgbCss(TH.faint); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(P.X(0), P.Y(1.6), 0.3 * P.u, 0, 6.2832); ctx.stroke();
      const y1 = 0.2, y2 = 0.9;
      for(const [x, y, m, col] of [[-0.3, y1, st.m1, TH.grad], [0.3, y2, st.m2, TH.pos]]){
        ctPath(ctx, P, [{ x, y:1.6 }, { x, y }], rgbCss(TH.faint), 2);
        const h = 0.12 + 0.035 * m;
        ctFill(ctx, P, [{ x:x - h, y:y - h }, { x:x + h, y:y - h }, { x:x + h, y:y + h }, { x:x - h, y:y + h }],
               rgbCss(col, 0.75));
        ctText(ctx, P.X(x), P.Y(y), fmtNum(m, 3) + ' kg', rgbCss(TH.bg), '700 11px ' + FONT_UI, 'center', 'middle');
        const s = 0.022;
        ctArrow(ctx, P, x, y, x, y - m * DY_G * s, rgbCss(TH.neg), 2.2, null);
        ctArrow(ctx, P, x, y, x, y + r.T * s, rgbCss(TH.warn), 2.2, 'T');
      }
      ctArrow(ctx, P, -0.75, y1, -0.75, y1 - Math.min(1, r.a * 0.12), rgbCss(TH.curl), 2.6, 'a');
      ctArrow(ctx, P, 0.75, y2, 0.75, y2 + Math.min(1, r.a * 0.12), rgbCss(TH.curl), 2.6, 'a');
    } else if(st.scene === 'circular'){
      const r = S.solve(st.m, st.r, st.v);
      const th = (st.th = (st.th || 0) + dt * r.omega);
      ctx.strokeStyle = rgbCss(TH.faint, 0.8); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(P.X(0), P.Y(0.4), st.r * P.u, 0, 6.2832); ctx.stroke();
      const px = st.r * Math.cos(th), py = 0.4 + st.r * Math.sin(th);
      ctPath(ctx, P, [{ x:0, y:0.4 }, { x:px, y:py }], rgbCss(TH.faint), 1.6);
      const s = 0.05;
      ctArrow(ctx, P, px, py, px - st.r * Math.cos(th) * (r.F * s / st.r), py - st.r * Math.sin(th) * (r.F * s / st.r),
              rgbCss(TH.neg), 2.8, 'F = mv²/r');
      ctArrow(ctx, P, px, py, px - Math.sin(th) * st.v * 0.14, py + Math.cos(th) * st.v * 0.14, rgbCss(TH.curl), 2.4, 'v');
      ctDot(ctx, P, px, py, 8, rgbCss(TH.grad), rgbCss(TH.bg));
      ctDot(ctx, P, 0, 0.4, 4, rgbCss(TH.text), rgbCss(TH.bg));
    } else {
      const r = S.solve(st.m, 0.25);
      const Q = mkPlot(90, 60, W - 150, H - 160, 0, 6 * r.tau, 0, r.vt * 1.15);
      plotFrame(ctx, Q, 't  (s)', 'v  (m/s)', 'approaching terminal velocity');
      plotTicksX(ctx, Q, [0, 2 * r.tau, 4 * r.tau, 6 * r.tau], v => fmtNum(v, 3));
      ctx.strokeStyle = rgbCss(TH.warn, 0.9); ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(Q.px, Q.Y(r.vt)); ctx.lineTo(Q.px + Q.pw, Q.Y(r.vt)); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, Q.px + 8, Q.Y(r.vt) - 6, 'v_T = ' + fmtNum(r.vt, 5) + ' m/s', rgbCss(TH.warn), '600 11px ' + FONT_MONO);
      plotCurve(ctx, Q, t => r.at(t), 500, rgbCss(TH.grad), 2.6);
      plotCurve(ctx, Q, t => DY_G * t, 2, rgbCss(TH.faint, 0.8), 1.6);
      ctText(ctx, Q.px + Q.pw * 0.2, Q.Y(DY_G * r.tau * 1.4), 'free fall, gt', rgbCss(TH.faint), '11px ' + FONT_UI);
      stageNote(ctx, 'the straight line is free fall — drag peels the real curve away almost immediately', W, H);
      return;
    }
    stageNote(ctx, 'every arrow is drawn to scale — their vector sum is the net force in the panel', W, H);
  },
  readoutOwn(st){
    const D = STAGES.dyForce.own(st);
    const scale = Math.max(1e-12, Math.abs(D.dK), Math.abs(D.work));
    const cons = D.dep <= 1e-12;
    const ordTxt = Number.isFinite(D.order)
      ? fmtNum(D.order, 3) + '  (RK4 should give 4)'
      : 'no order to measure — RK4 is exact on this law';
    return `<div class="card tight"><div class="ttl">The law you wrote</div>
      ${kv('F', pkPretty(st.fsrc) + ' N')}
      ${kv('mass', fmtNum(st.fm, 5) + ' kg')}
      ${kv('started at x, v', fmtNum(st.fx0, 5) + ' m,  ' + fmtNum(st.fv0, 5) + ' m/s')}
      ${kv('ended at x, v', fmtNum(D.x, 6) + ' m,  ' + fmtNum(D.v, 6) + ' m/s')}
      ${kv('distance travelled', fmtNum(D.travel, 6) + ' m')}
      ${kv('net displacement', fmtNum(D.net, 6) + ' m')}
      ${kv('does the force mention v or t?', cons
        ? 'no — it depends on position alone' : 'yes, by up to ' + fmtNum(D.dep, 4) + ' N')}
      ${kv('order of the stepper, measured by halving h', ordTxt)}
      <p class="help">The last-but-one row is asked of the <i>function</i>, not of the text you typed: the
      force is evaluated at a spread of positions with v and t moved, and the largest change is reported.
      A law written as <b>−4x + 0·v</b> is therefore correctly called conservative.</p>
    </div>
    <div class="card tight"><div class="ttl">The work–energy theorem, measured</div>
      ${kv('∫F·dx along the trajectory', fmtNum(D.work, 7) + ' J')}
      ${kv('½m(v² − v₀²) from the two ends', fmtNum(D.dK, 7) + ' J')}
      ${kv('difference', fmtGap(D.gapWork, scale, 'J'))}
      ${kv('kinetic energy at the start', fmtNum(D.K0, 6) + ' J')}
      ${kv('and at the end', fmtNum(D.K1, 6) + ' J')}
      <p class="help">The left-hand side is a <b>line integral along the path</b>. Along a path that is
      being traced out in time it is ∫F·<b>v</b> dt, with v <i>signed</i>, so a run that doubles back
      subtracts as it comes home — which is not ∫F dt, the impulse. It travelled
      ${fmtNum(D.travel, 4)} m to end up ${fmtNum(D.net, 4)} m from where it started, so the two are very
      different sums. The right-hand side looks only at the first and last velocity.</p>
      <p class="help">The difference is quoted <b>relative</b> as well as absolutely, because absolutely
      is not readable on its own: a damped run that has come almost to rest has a net work of a
      thousandth of a joule, and a millionth of a joule beside it is either a triumph or a
      catastrophe depending on which. The quadrature is <b>fourth order, the same as the stepper</b> —
      match those and the difference measures the theorem; leave the quadrature second order and it
      measures the quadrature.</p>
    </div>
    <div class="card tight"><div class="ttl">And is your force conservative?</div>
      ${kv('∫F₀·dx along the actual path', fmtNum(D.wCons, 7) + ' J')}
      ${kv('∫F₀·dx straight from x₀ to x₁', fmtNum(D.wStraight, 7) + ' J')}
      ${kv('difference', fmtGap(D.gapPath, Math.max(1e-12, Math.abs(D.wCons)), 'J'))}
      ${kv('so the potential ΔU = −∫F₀·dx', fmtNum(D.dU, 6) + ' J')}
      ${kv('work done by the rest of the force', fmtNum(D.wNon, 6) + ' J')}
      ${kv('change in mechanical energy K + U', fmtNum(D.dE, 6) + ' J')}
      ${kv('and the identity those two imply', fmtGap(D.gapEnergy, Math.max(1e-12, Math.abs(D.wNon)), 'J'))}
      <p class="help">F₀(x) = F(x, 0, 0) is the part of your law that depends on position alone.
      Integrating it along a path that wanders and integrating it straight between the endpoints are
      genuinely different sums, and they come out equal — <b>that is what conservative means</b>, and it is
      why a potential energy can be defined at all. That row and the difference in the card above are the
      two <i>measurements</i> here; the last row is not a third. W<sub>non</sub> = W<sub>tot</sub> −
      W<sub>cons</sub> by the linearity of the integral, so the last difference is the first two rearranged,
      and it is shown because an identity that failed would mean the arithmetic had gone wrong.</p>
      <p class="help">${cons
        ? 'Everything in your force is that part, so the mechanical energy does not move: the thick line on the right-hand plot is flat and the phase portrait closes on itself.'
        : 'The rest of your force — whatever mentions v or t — is <i>not</i> path-independent, and the two rows above say exactly how much energy it moved. The phase portrait spirals rather than closing, and the total on the right-hand plot slopes by that same amount.'}</p>
    </div>`;
  },
  readout(st){
    if(st.scene === 'custom') return STAGES.dyForce.readoutOwn(st);
    const S = DY_SCENES[st.scene];
    if(st.scene === 'incline'){
      const r = S.solve(st.m, st.ang, st.mu);
      return `<div class="card tight"><div class="ttl">Resolving along the slope</div>
        ${kv('weight mg', fmtNum(r.W, 6) + ' N')}
        ${kv('component along  mg sin θ', fmtNum(r.along, 6) + ' N')}
        ${kv('component into  mg cos θ', fmtNum(r.normal, 6) + ' N')}
        ${kv('normal force N', fmtNum(r.normal, 6) + ' N')}
        ${kv('maximum static friction μN', fmtNum(r.fMax, 6) + ' N')}
        ${kv('does it slide?', r.slides ? 'yes — the pull exceeds what friction can hold' : 'no — friction is holding it')}
        ${kv('friction actually acting', fmtNum(r.friction, 6) + ' N')}
        ${kv('net force', fmtNum(r.net, 6) + ' N')}
        ${kv('acceleration', fmtNum(r.a, 6) + ' m/s²')}
      </div>
      <div class="card tight"><div class="ttl">The tipping point</div>
        ${kv('tan θ', fmtNum(Math.tan(st.ang), 6))}
        ${kv('μ', fmtNum(st.mu, 6))}
        ${kv('slides when', 'tan θ > μ')}
        ${kv('the critical angle', fmtNum(Math.atan(st.mu) * 180 / Math.PI, 5) + '°')}
        <p class="help">The mass cancels completely: whether a block slides depends on the angle and the
        surfaces and on nothing else. That is why the angle of repose measures μ directly, and why a heavy
        crate is no more likely to slide than a light one on the same ramp.</p>
      </div>`;
    }
    if(st.scene === 'atwood'){
      const r = S.solve(st.m1, st.m2);
      return `<div class="card tight"><div class="ttl">Two masses, one string</div>
        ${kv('m₁, m₂', `${fmtNum(st.m1, 4)}, ${fmtNum(st.m2, 4)} kg`)}
        ${kv('a = (m₁−m₂)g/(m₁+m₂)', fmtNum(r.a, 6) + ' m/s²')}
        ${kv('T = 2m₁m₂g/(m₁+m₂)', fmtNum(r.T, 6) + ' N')}
        ${kv('m₁g', fmtNum(st.m1 * DY_G, 6) + ' N')}
        ${kv('m₂g', fmtNum(st.m2 * DY_G, 6) + ' N')}
        ${kv('is T between them?', (r.T < st.m1 * DY_G && r.T > st.m2 * DY_G) ? 'yes, always' : 'the masses are equal')}
      </div>
      <div class="card tight"><div class="ttl">Newton's second law, per block</div>
        ${kv('m₁g − T − m₁a', fmtNum(r.check1, 3))}
        ${kv('T − m₂g − m₂a', fmtNum(r.check2, 3))}
        <p class="help">Both residuals are zero: the solution satisfies the two equations it was derived
        from. The tension is the same throughout an ideal string, and it is <i>less</i> than the heavy
        weight and <i>more</i> than the light one — if it equalled either, that block would not accelerate.</p>
        <p class="help">As the masses approach equality the acceleration goes to zero and the tension to
        the common weight; as one dominates, a approaches g and the tension approaches twice the small
        weight. Both limits are worth checking on the sliders.</p>
      </div>`;
    }
    if(st.scene === 'circular'){
      const r = S.solve(st.m, st.r, st.v);
      return `<div class="card tight"><div class="ttl">Uniform circular motion</div>
        ${kv('speed', fmtNum(st.v, 5) + ' m/s')}
        ${kv('radius', fmtNum(st.r, 5) + ' m')}
        ${kv('centripetal acceleration v²/r', fmtNum(r.ac, 6) + ' m/s²')}
        ${kv('as a multiple of g', fmtNum(r.ac / DY_G, 4) + ' g')}
        ${kv('force needed mv²/r', fmtNum(r.F, 6) + ' N')}
        ${kv('angular speed ω = v/r', fmtNum(r.omega, 6) + ' rad/s')}
        ${kv('period', fmtNum(r.T, 6) + ' s')}
      </div>
      <div class="card tight"><div class="ttl">The vertical loop</div>
        ${kv('minimum speed at the top √(gr)', fmtNum(r.vMinTop, 6) + ' m/s')}
        ${kv('is the current speed enough?', st.v >= r.vMinTop ? 'yes' : 'no — it would leave the track')}
        <p class="help">At the top, gravity points towards the centre, so it can supply the whole
        centripetal requirement by itself. Below √(gr) the track would have to <i>pull</i> — which a track
        cannot do — and the object falls away.</p>
        <p class="help">There is no outward force. What is called centrifugal is the absence of a real
        force noticed from a rotating frame; in the ground frame there is only the centripetal one, and the
        object is continuously falling towards the centre while continuously missing it.</p>
      </div>`;
    }
    const r = S.solve(st.m, 0.25);
    return `<div class="card tight"><div class="ttl">Falling with drag</div>
      ${kv('mass', fmtNum(st.m, 4) + ' kg')}
      ${kv('drag coefficient k', '0.25 kg/m')}
      ${kv('terminal speed √(mg/k)', fmtNum(r.vt, 6) + ' m/s')}
      ${kv('and in km/h', fmtNum(r.vt * 3.6, 5))}
      ${kv('time constant v_T/g', fmtNum(r.tau, 5) + ' s')}
      ${kv('speed after one τ', fmtNum(r.at(r.tau), 5) + ' m/s  (' + fmtNum(100 * r.at(r.tau) / r.vt, 3) + '% of terminal)')}
      ${kv('after three τ', fmtNum(r.at(3 * r.tau), 5) + ' m/s  (' + fmtNum(100 * r.at(3 * r.tau) / r.vt, 3) + '%)')}
      <p class="help">m dv/dt = mg − kv² is separable, and its solution is <b>v = v_T tanh(gt/v_T)</b>.
      The terminal speed is not approached by the object slowing down — it never slows at all — but by the
      acceleration dying away as the drag catches up with the weight.</p>
    </div>`;
  },
  chip(st){
    if(st.scene === 'custom'){
      const D = STAGES.dyForce.own(st);
      /* the relative gap, not the absolute one, and the colour follows it. The
         absolute gap alone once read "they differ by 0" in the affirmative
         colour over two rows that disagreed by 100%. */
      const rel = D.gapWork / Math.max(1e-12, Math.abs(D.dK), Math.abs(D.work));
      const good = rel < 1e-4;
      return `<div class="k">∫F·dx vs ΔKE</div>
        <div style="color:var(--c-warn)">${fmtNum(D.work, 5)} J</div>
        <div style="color:var(--c-${good ? 'pos' : 'neg'})">${good
          ? 'agreeing to ' + Math.max(0, Math.floor(-Math.log10(Math.max(1e-300, rel)))) + ' figures'
          : 'differing by ' + fmtSig(100 * rel, 3) + '%'}</div>`;
    }
    const S = DY_SCENES[st.scene];
    if(st.scene === 'incline'){ const r = S.solve(st.m, st.ang, st.mu);
      return `<div class="k">a</div><div style="color:var(--c-curl)">${fmtNum(r.a, 5)} m/s²</div>
        <div>${r.slides ? 'sliding' : 'held by friction'}</div>`; }
    if(st.scene === 'atwood'){ const r = S.solve(st.m1, st.m2);
      return `<div class="k">Atwood</div><div style="color:var(--c-curl)">a = ${fmtNum(r.a, 5)}</div>
        <div style="color:var(--c-warn)">T = ${fmtNum(r.T, 5)} N</div>`; }
    if(st.scene === 'circular'){ const r = S.solve(st.m, st.r, st.v);
      return `<div class="k">centripetal</div><div style="color:var(--c-neg)">${fmtNum(r.ac, 5)} m/s²</div>
        <div>${fmtNum(r.ac / DY_G, 3)} g</div>`; }
    const r = S.solve(st.m, 0.25);
    return `<div class="k">terminal speed</div><div style="color:var(--c-warn)">${fmtNum(r.vt, 5)} m/s</div>`;
  },
  legend(st){
    return st && st.scene === 'custom'
      ? [['var(--c-grad)', 'the path through the x–v plane'], ['var(--c-pos)', 'where it started, and the potential energy'],
         ['var(--c-neg)', 'where it ended'], ['var(--c-curl)', 'kinetic energy'],
         ['var(--c-warn)', 'the total — flat only if your force is conservative']]
      : [['var(--c-neg)', 'weight, or the centripetal force'], ['var(--c-pos)', 'the normal force'],
         ['var(--c-warn)', 'friction, or tension'], ['var(--c-curl)', 'the net force, or velocity'],
         ['var(--c-grad)', 'the body']];
  },
  dockLegend:true
};

/* ---- 4 · energy ------------------------------------------------------------ */
STAGES.dyEnergy = {
  title:'Work and energy',
  derive(st){
    return {
      title:'Integrating Newton\'s second law along the path',
      steps:[
        drvSay('why energy is worth introducing at all',
          'F = ma tells you the acceleration at an instant. Often the question is about the whole journey — how fast will it be at the bottom — and answering that by integrating the motion is far more work than necessary. Integrating the law once, in general, produces a shortcut usable everywhere.'),
        drvStep('take the second law and integrate along the displacement',
          `∫ ${dv('F')} ${dop('·')} d${dv('r')} ${dop('=')} ∫ ${dv('m')}${dfrac('d' + dv('v'), 'd' + dv('t'))} ${dop('·')} d${dv('r')}`,
          'the line integral of the vector-calculus wing, applied to a force'),
        drvStep('change the variable of integration from position to velocity',
          `d${dv('r')} ${dop('=')} ${dv('v')} d${dv('t')} ${dop('⇒')} ∫ ${dv('m')}${dv('v')} ${dop('·')} d${dv('v')}`,
          'the chain rule again, moving the integral into velocity space'),
        drvStep('which integrates immediately',
          `${dv('W')} ${dop('=')} ${dfrac('1', '2')}${dv('m')}${dv('v')}² ${dop('−')} ${dfrac('1', '2')}${dv('m')}${dv('v')}₀²`,
          'the work–energy theorem — and this is where the ½ and the square come from'),
        drvSay('kinetic energy was not defined, it was discovered',
          'Nobody chose ½mv² for its elegance. It is what falls out of integrating ma along a path, and the factor of one half is the integral of v dv. Defining it in advance and then proving the theorem gets the logic backwards.'),
        drvStep('for a conservative force the work is path-independent',
          `${dv('W')} ${dop('=')} ${dop('−')}Δ${dv('U')}`,
          st.mu === 0 ? 'friction is off here, so total energy is conserved and the panel shows it flat' : ''),
        drvSay('and that is exactly the conservative-field condition',
          'A force that is the gradient of a potential does work depending only on the endpoints — which the vector-calculus wing derived. Potential energy exists precisely for such forces, which is why there is no "friction potential energy": friction is path-dependent, so no such function can exist.'),
        drvStep('so mechanical energy is conserved when it can be',
          `${dfrac('1', '2')}${dv('m')}${dv('v')}² ${dop('+')} ${dv('U')} ${dop('=')} const`,
          st.mu === 0 ? 'the panel plots both and their sum, which stays flat to integrator accuracy'
                      : `μ = ${fmtNum(st.mu, 3)}: the total falls, and the panel tracks exactly where it goes`),
        drvSay('energy is not destroyed by friction, only relocated',
          'The lost mechanical energy appears as thermal energy in the surfaces. The panel accounts for it explicitly rather than letting the total quietly shrink — because "energy is conserved" is only true if you count everything, and the honest version of the statement is the one worth showing.'),
        drvStep('power is the rate at which work is done',
          `${dv('P')} ${dop('=')} ${dfrac('d' + dv('W'), 'd' + dv('t'))} ${dop('=')} ${dv('F')} ${dop('·')} ${dv('v')}`,
          'which is why a car\'s top speed is where engine power equals the power drag consumes')
      ],
      note:'The energy plot is computed from the simulated motion, not from a formula. With friction on, the thermal term is accumulated as ∫f·ds along the actual path, and the three curves sum to a constant to integrator accuracy.'
    };
  },
  enter(st, o){
    st.mu = o.mu === undefined ? 0 : o.mu;
    st.v0 = 0; st.m = 1;
    st.t = 0; st.run = o.run !== false;
    st.track = o.track || 'hill';
    st.hsrc = o.hsrc || '2.6*exp(-((x-1)/0.9)^2) + 1.9*exp(-((x-3.4)/0.7)^2) + 0.3*sin(3*x) + 0.4';
  },
  /* The track. `dyTrackRun` already takes h(x) as a function and never asks
     where it came from, so a typed landscape needs nothing else — which is the
     whole point of having written the integrator that way. */
  hOf(st){
    if(st.track === 'custom'){
      const g = pkCompile(st.hsrc);
      /* a height that is not finite would put NaN into the integrator and lose
         the run; clamp instead, and the flat stretch is visible as a flat
         stretch rather than as a blank panel */
      return x => { const v = g(x, 0, 0); return Number.isFinite(v) ? Math.max(-0.5, Math.min(12, v)) : 0.05; };
    }
    if(st.track === 'valley') return x => 1.6 + 0.35 * (x - 3) * (x - 3) * 0.4;
    if(st.track === 'ramp') return x => Math.max(0.05, 3 - 0.45 * x);
    return x => 3 * Math.exp(-Math.pow((x - 1.2) / 1.1, 2)) + 1.4 * Math.exp(-Math.pow((x - 4.6) / 1.0, 2)) + 0.15;
  },
  /* where the object is released — just inside the left edge, at whatever height
     the reader's landscape has there */
  startX(st){ return st.track === 'ramp' ? 0.2 : 0.15; },
  controls(){
    const st = ST;
    return ctSeg('dyEt', st.track, [['hill', 'two hills'], ['valley', 'a valley'], ['ramp', 'a ramp'],
                                    ['custom', 'shape your own landscape']]) +
      (st.track === 'custom'
        ? fnHtml('dyEh', 'height h(x) =', st.hsrc, 'x, from 0 to about 6') +
          `<p class="help">Any landscape you like, in metres. The object is released from rest at the
          left-hand edge, so it can never climb higher than it started — whatever you build. Try a hill
          taller than the release point and watch it turn round short of the top; try
          <b>0.3*sin(3x) + 1.5</b> and watch it never stop.</p>
          <p class="help">Nothing here knows the shape of your track. The integrator is handed <b>h(x)</b>
          and takes the slope numerically at every step, so the energy ledger below is a genuine measurement
          on your landscape rather than a property of a curve somebody chose. With μ = 0 the total must stay
          flat, and the drift printed beside it is the integrator's own error rather than physics.</p>`
        : '') +
      ctlRow('friction μ', ctlSlider('dyEmu', 0, 0.25, 0.002, st.mu)) +
      ctChk('dyErun', 'release it', st.run) +
      `<p class="help">The work–energy theorem says the net work done on an object equals its change in
      kinetic energy — and when the only force doing work is gravity, that becomes conservation of
      mechanical energy. The stacked bars show K, U and the energy friction has removed, and their total
      is a flat line whatever the track does.</p>
      <p class="help">Turn friction on and watch the top of the stack stay level while the shaded loss
      grows: friction does not destroy energy, it converts it to heat at a rate the panel computes as
      <b>μmg cos θ</b> times the distance travelled. The object can never climb higher than its starting
      height, and with friction it never even gets close.</p>
      <p class="help">Notice which quantity is doing the work at each moment. Only the component of gravity
      <i>along</i> the track matters, which is why the speed depends on the height dropped and not at all
      on the path taken to drop it.</p>`;
  },
  wire(){
    ctWireSeg('dyEt', v => { ST.track = v; ST.t = 0; });
    if(ST.track === 'custom') fnWire('dyEh', (m, s) => { ST.hsrc = s; ST.t = 0; });
    wireSlider('dyEmu', () => ST.mu, v => { ST.mu = v; }, v => fmtNum(+v, 4));
    ctWireChk('dyErun', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    const hOf = this.hOf(st);
    const x0 = st.track === 'ramp' ? 0.2 : 0.15;
    const R = dyTrackRun(hOf, x0, 0.001, st.m, st.mu, 0.0016, 5200);
    if(st.run){ st.t += dt * 500; if(st.t > R.pts.length - 1) st.t = 0; }
    const i = Math.max(0, Math.min(R.pts.length - 1, Math.round(st.t)));
    const p = R.pts[i] || { x:x0, h:hOf(x0), v:0, KE:0, PE:0, lost:0 };
    const hp = (H - 160) * 0.62;
    const P = ctBox(W, hp + 60, 3, 1.7, 3.4, { t:44, b:16 });
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, 'the track — the object cannot rise above where it started');
    ctParam(ctx, P, x => ({ x, y:hOf(x) }), 0, 6.2, 400, rgbCss(TH.faint), 3);
    ctFill(ctx, P, ctSample(x => ({ x, y:hOf(x) }), 0, 6.2, 200).concat([{ x:6.2, y:-1 }, { x:0, y:-1 }]),
           rgbCss(TH.line2, 0.3));
    /* the starting height, as the ceiling energy allows */
    ctPath(ctx, P, [{ x:0, y:hOf(x0) }, { x:6.2, y:hOf(x0) }], rgbCss(TH.warn, 0.8), 1.6, [6, 4]);
    ctDot(ctx, P, p.x, p.h, 8, rgbCss(TH.grad), rgbCss(TH.bg));
    const s = 0.06;
    ctArrow(ctx, P, p.x, p.h, p.x, p.h - DY_G * s, rgbCss(TH.neg), 2, 'g');
    /* the energy bars */
    const B = mkPlot(80, 44 + hp + 44, W - 128, H - 160 - hp, 0, R.pts.length, 0, R.E0 * 1.25 + 0.5);
    plotFrame(ctx, B, 'step', 'energy  (J)', 'kinetic + potential + heat = constant');
    plotTicksX(ctx, B, [0, R.pts.length / 2, R.pts.length], v => String(Math.round(v)));
    const step = Math.max(1, Math.floor(R.pts.length / 260));
    ctx.lineWidth = 1;
    for(let k = 0; k < R.pts.length; k += step){
      const q = R.pts[k];
      const X = B.X(k), w = Math.max(1.2, B.X(step) - B.X(0));
      const bars = [[q.PE, TH.pos], [q.KE, TH.curl], [q.lost, TH.neg]];
      let acc = 0;
      for(const [val, col] of bars){
        ctx.fillStyle = rgbCss(col, 0.75);
        ctx.fillRect(X, B.Y(acc + val), w, B.Y(acc) - B.Y(acc + val));
        acc += val;
      }
    }
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(B.px, B.Y(R.E0)); ctx.lineTo(B.px + B.pw, B.Y(R.E0)); ctx.stroke();
    ctx.setLineDash([]);
    probeLine(ctx, B, i, null);
    stageNote(ctx, 'green: potential · purple: kinetic · red: turned to heat — their total never moves', W, H);
  },
  readout(st){
    const hOf = this.hOf(st);
    const x0 = st.track === 'ramp' ? 0.2 : 0.15;
    const R = dyTrackRun(hOf, x0, 0.001, st.m, st.mu, 0.0016, 5200);
    const i = Math.max(0, Math.min(R.pts.length - 1, Math.round(st.t)));
    const p = R.pts[i] || R.pts[0];
    const drop = hOf(x0) - p.h;
    const vFree = Math.sqrt(Math.max(0, 2 * DY_G * drop));
    return `<div class="card tight"><div class="ttl">Right now</div>
      ${kv('height', fmtNum(p.h, 5) + ' m')}
      ${kv('speed', fmtNum(Math.abs(p.v), 5) + ' m/s')}
      ${kv('kinetic ½mv²', fmtNum(p.KE, 5) + ' J')}
      ${kv('potential mgh', fmtNum(p.PE, 5) + ' J')}
      ${kv('lost to friction', fmtNum(p.lost, 5) + ' J')}
      ${kv('total', fmtNum(p.KE + p.PE + p.lost, 6) + ' J')}
      ${kv('at the start', fmtNum(R.E0, 6) + ' J')}
      ${kv('drift', fmtAgree(p.KE + p.PE + p.lost, R.E0, 'J'))}
    </div>
    <div class="card tight"><div class="ttl">Speed from height alone</div>
      ${kv('height dropped', fmtNum(drop, 5) + ' m')}
      ${kv('v = √(2g·drop), frictionless', fmtNum(vFree, 5) + ' m/s')}
      ${kv('actual speed', fmtNum(Math.abs(p.v), 5) + ' m/s')}
      ${kv('difference', fmtAgree(vFree, Math.abs(p.v), 'm/s'))}
      <p class="help">${st.mu < 1e-6
        ? 'With no friction the two agree: the speed depends only on how far the object has fallen, and not at all on the shape of the path it fell along. That is exactly what it means for gravity to be a conservative force.'
        : 'With friction the object arrives slower, and the shortfall is precisely the energy the friction has removed. The path now matters, because a longer route rubs for longer.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The ledger</div>
      ${kv('starting height', fmtNum(hOf(x0), 5) + ' m')}
      ${kv('highest point reached', fmtNum(R.pts.reduce((m, q) => Math.max(m, q.h), 0), 5) + ' m')}
      ${(() => {
        /* The preset tracks are shapes whose author knew the answer. On a typed
           landscape "it cannot climb above where it started" has to be checked,
           so the overshoot is measured rather than the claim repeated. */
        const top = R.pts.reduce((m, q) => Math.max(m, q.h), 0), over = top - hOf(x0);
        return kv('above the start by', fmtNum(over, 4) + ' m' + (over <= 1e-3
          ? '  — it never gets above, as it cannot'
          : '  ← that is integrator drift, not physics'));
      })()}
      ${kv('friction coefficient', fmtNum(st.mu, 4))}
      ${kv('total heat generated', fmtNum(R.pts[R.pts.length - 1].lost, 5) + ' J')}
      <p class="help">Work is <b>F·d</b>, so a force perpendicular to the motion does none — the normal
      force never appears in the energy ledger however large it gets. Only gravity and friction do work
      here, and the whole of mechanics-energy problem-solving is deciding which forces those are.</p>
    </div>`;
  },
  chip(st){
    const hOf = this.hOf(st);
    const R = dyTrackRun(hOf, st.track === 'ramp' ? 0.2 : 0.15, 0.001, st.m, st.mu, 0.0016, 2000);
    const p = R.pts[Math.max(0, Math.min(R.pts.length - 1, Math.round(st.t)))] || R.pts[0];
    return `<div class="k">energy</div>
      <div style="color:var(--c-curl)">K = ${fmtNum(p.KE, 4)} J</div>
      <div style="color:var(--c-pos)">U = ${fmtNum(p.PE, 4)} J</div>`;
  },
  legend(){ return [['var(--c-pos)', 'potential energy'], ['var(--c-curl)', 'kinetic energy'],
                    ['var(--c-neg)', 'turned to heat'], ['var(--c-warn)', 'the total, and the starting height']]; },
  dockLegend:true
};

/* ---- 5 · momentum and collisions ----------------------------------------- */
