/* ============================================================================
   4n · THE MECHANICS WING  —  AP Physics 1 units 1–5, AP Physics C: Mechanics
   ============================================================================ */

/* ---- 1 · kinematics: the three graphs that are one motion ----------------- */
STAGES.dyKinem = {
  title:'Kinematics',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'The suvat equations are three integrations and one substitution',
      steps:[
        drvSay('these are usually memorised, and they need not be',
          'Four or five equations, each with its own combination of letters, are handed over as a set to learn. Every one of them comes from integrating a constant acceleration twice, and the odd one out comes from eliminating t between the other two.'),
        drvStep('start from the definition of acceleration',
          `${dv('a')} ${dop('=')} ${dfrac('d' + dv('v'), 'd' + dv('t'))} ${dop('=')} const`,
          `a = ${n(st.a)} m/s² here`),
        drvStep('integrate once to get velocity',
          `${dv('v')} ${dop('=')} ${dv('v')}₀ ${dop('+')} ${dv('a')}${dv('t')}`,
          `v₀ = ${n(st.v0)} m/s, so at t = ${n(st.t)} s: v = ${n(st.v0 + st.a * st.t)} m/s`),
        drvStep('and again to get position',
          `${dv('x')} ${dop('=')} ${dv('x')}₀ ${dop('+')} ${dv('v')}₀${dv('t')} ${dop('+')} ${dfrac('1', '2')}${dv('a')}${dv('t')}²`,
          `x = ${n(st.x0 + st.v0 * st.t + 0.5 * st.a * st.t * st.t)} m`),
        drvSay('the constants of integration are the initial conditions',
          'Each integration introduces one unknown constant, and each is fixed by a starting value — v₀ from the first, x₀ from the second. That is why two initial conditions are needed, and it is the same counting as a second-order differential equation needing two.'),
        drvStep('the timeless equation eliminates t rather than integrating',
          `${dv('v')}² ${dop('=')} ${dv('v')}₀² ${dop('+')} 2${dv('a')}(${dv('x')} ${dop('−')} ${dv('x')}₀)`,
          'solve the first equation for t and substitute into the second'),
        drvSay('and it is really the work–energy theorem in disguise',
          'Multiply through by ½m and it reads ½mv² − ½mv₀² = ma·Δx = FΔx. The equation that looks like a kinematic convenience is conservation of energy, which is why it is the one to reach for when time is neither given nor wanted.'),
        drvStep('the graphs make the calculus visible',
          `area under ${dv('v')}–${dv('t')} ${dop('=')} displacement`,
          'the panel shades it and compares with the position curve — integration, drawn'),
        drvSay('and all of it fails the moment a is not constant',
          'Add air resistance and acceleration depends on velocity, so none of these apply. The definitions v = dx/dt and a = dv/dt survive unchanged, because they are definitions. The next stage integrates them numerically when the closed forms give out.'),
        st.own
          ? drvSay('which is what the panel is now measuring rather than warning about',
              'With a programme of your own the formula is drawn over the motion it claims to describe and the gap between them is printed. Then the repair most people reach for — put the average acceleration Δv/T into the same formula — is tried and printed too, because it also fails, and for a reason worth having: ½at² is not linear in a, so the displacement depends on <i>when</i> the acceleration arrived and not merely on its mean. What survives is x = x₀ + v̄T, and it survives because it defines v̄ instead of following from anything.')
          : drvSay('so it is worth knowing which of these is a definition',
              'Two of the statements on this ladder are definitions and survive anything; the rest are consequences of a being constant and do not. Writing your own a(t) separates them in one move, because the panel then draws the formula over the motion and prints how far apart they are.')
      ],
      note:'The three curves shown are position, velocity and acceleration. Each is the derivative of the one above and the integral of the one below, and the panel shades the areas so the relationships can be read off rather than taken on trust.'
    };
  },
  enter(st, o){
    st.x0 = 0; st.v0 = o.v0 === undefined ? 12 : o.v0; st.a = o.a === undefined ? -3 : o.a;
    st.t = 0; st.T = 8;
    st.run = o.run !== false;
    st.own = !!o.own;
    st.asrc = o.asrc || '4*cos(1.1*t) - 1.5';
  },
  /* the typed programme, integrated once per edit: rtSpinRun-style, two adaptive
     quadratures per rebuild is far too much for an animation frame */
  own(st){
    const key = st.asrc + '@' + st.x0 + '@' + st.v0 + '@' + st.T;
    if(st._kk === key) return st._kd;
    st._kk = key;
    const raw = pkParamFn(st.asrc, () => 0);
    const A = t => { const q = raw(t); return Number.isFinite(q) ? Math.max(-1e6, Math.min(1e6, q)) : 0; };
    const D = dyKinemRun(A, st.x0, st.v0, st.T, 2000);
    D.A = A;
    D.at = t => {
      const i = Math.max(0, Math.min(D.n, Math.round(t / st.T * D.n)));
      return { x:D.xs[i], v:D.vs[i] };
    };
    st._kd = D;
    return D;
  },
  controls(){
    const st = ST;
    const head = ctSeg('dyKm', st.own ? 'custom' : 'std',
                       [['std', 'constant acceleration'], ['custom', 'a programme of your own']]);
    if(st.own){
      return head +
        fnHtml('dyKat', 'a(t) =', st.asrc, 't, in seconds') +
        ctlRow('x₀', ctlSlider('dyKx', -10, 10, 0.1, st.x0)) +
        ctlRow('v₀', ctlSlider('dyKv', -20, 20, 0.1, st.v0)) +
        ctlRow('run for', ctlSlider('dyKT', 1, 20, 0.1, st.T)) +
        ctlRow('t', ctlSlider('dyKt', 0, st.T, 0.01, st.t)) +
        ctChk('dyKrun', 'run the clock', st.run) +
        `<p class="help">Write the acceleration as a function of <b>t</b> in seconds. The position and
        velocity are then obtained by <b>integrating it twice</b> — which is all the four equations ever
        were, done under the assumption that a is constant.</p>
        <p class="help">The dashed curve on the top plot is <b>x₀ + v₀t + ½a(0)t²</b>, the formula
        everyone memorises, drawn over the motion that actually happened. Watch it come away. The panel
        also tries the plausible repair — put the <i>average</i> acceleration Δv/T into the same
        formula — and prints how much that is wrong by too, because it is wrong.</p>
        <p class="help">What does survive is <b>x = x₀ + v̄T</b> with v̄ the mean of v(t), and it survives
        because it is a definition rather than a result. Every number here is computed twice: RK4 against
        adaptive quadrature for v, and RK4 against the Cauchy repeated-integral formula for x.</p>`;
    }
    return head +
      ctlRow('x₀', ctlSlider('dyKx', -10, 10, 0.1, st.x0)) +
      ctlRow('v₀', ctlSlider('dyKv', -20, 20, 0.1, st.v0)) +
      ctlRow('a', ctlSlider('dyKa', -8, 8, 0.05, st.a)) +
      ctlRow('t', ctlSlider('dyKt', 0, 8, 0.01, st.t)) +
      ctChk('dyKrun', 'run the clock', st.run) +
      `<p class="help">One motion, three graphs, and each is the slope of the one above it. The
      <b>slope</b> of x(t) is the velocity; the <b>slope</b> of v(t) is the acceleration; and going the
      other way, the <b>area</b> under v(t) is the displacement and the area under a(t) is the change in
      velocity. Calculus is not applied to kinematics — kinematics <i>is</i> calculus, and the shaded areas
      and drawn tangents are the same statement read in two directions.</p>
      <p class="help">The four equations everyone memorises are just <b>a = const</b> integrated twice,
      with one variable eliminated each time. The panel derives each of them and checks it against the
      integrated motion, so none of them has to be taken on trust.</p>
      <p class="help">Set a negative and watch the object turn round: the velocity passes through zero
      while the acceleration does not, so the object is momentarily at rest and still accelerating. That
      one instant defeats more students than any other in the subject.</p>`;
  },
  wire(){
    ctWireSeg('dyKm', v => { ST.own = (v === 'custom'); ST.t = 0; });
    wireSlider('dyKx', () => ST.x0, v => { ST.x0 = v; }, v => fmtNum(+v, 3) + ' m');
    wireSlider('dyKv', () => ST.v0, v => { ST.v0 = v; }, v => fmtNum(+v, 3) + ' m/s');
    wireSlider('dyKa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3) + ' m/s²');
    wireSlider('dyKt', () => ST.t, v => { ST.t = v; ST.run = false; const c = $('dyKrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 3) + ' s');
    ctWireChk('dyKrun', v => { ST.run = v; });
    if(!ST.own) return;
    fnWire('dyKat', (m, s) => { ST.asrc = s; ST.t = 0; }, pkParamBuild);
    wireSlider('dyKT', () => ST.T, v => { ST.T = Math.max(0.2, v); ST.t = 0; }, v => fmtNum(+v, 3) + ' s');
  },
  frame(st, dt, ctx, W, H){
    if(st.run){ st.t += dt; if(st.t > st.T) st.t = 0; }
    const D = st.own ? STAGES.dyKinem.own(st) : null;
    const X = D ? (t => D.at(t).x) : (t => dyPos(st.x0, st.v0, st.a, t));
    const V = D ? (t => D.at(t).v) : (t => dyVel(st.v0, st.a, t));
    const A = D ? D.A : (() => st.a);
    const hp = (H - 176) / 3;
    let xlo = Infinity, xhi = -Infinity, vlo2 = Infinity, vhi2 = -Infinity, alo = Infinity, ahi = -Infinity;
    for(let i = 0; i <= 200; i++){
      const t = st.T * i / 200;
      const q = X(t); xlo = Math.min(xlo, q); xhi = Math.max(xhi, q);
      const u = V(t); vlo2 = Math.min(vlo2, u); vhi2 = Math.max(vhi2, u);
      const c = A(t); alo = Math.min(alo, c); ahi = Math.max(ahi, c);
    }
    /* the SUVAT curve is drawn too, so it has to fit on the axis it fails on */
    if(D){
      for(const q of [D.suvat0, st.x0]){ xlo = Math.min(xlo, q); xhi = Math.max(xhi, q); }
    }
    const vlo = D ? vlo2 : Math.min(V(0), V(st.T)), vhi = D ? vhi2 : Math.max(V(0), V(st.T));
    const plots = [
      { P:mkPlot(80, 44, W - 128, hp, 0, st.T, xlo - 4, xhi + 4), f:X, lab:'x  (m)', col:TH.grad,
        title:D ? 'position — the dashed curve is x₀ + v₀t + ½a(0)t², the formula that no longer applies'
                : 'position — its slope is the velocity' },
      { P:mkPlot(80, 44 + hp + 34, W - 128, hp, 0, st.T, Math.min(0, vlo) - 3, Math.max(0, vhi) + 3), f:V, lab:'v  (m/s)', col:TH.curl,
        title:'velocity — its slope is the acceleration, its area is the displacement' },
      { P:mkPlot(80, 44 + 2 * (hp + 34), W - 128, hp, 0, st.T, Math.min(0, alo) - 2, Math.max(0, ahi) + 2), f:A, lab:'a  (m/s²)', col:TH.warn,
        title:D ? 'acceleration — the programme you wrote, and its area is still the change in velocity'
                : 'acceleration — constant here, and its area is the change in velocity' }
    ];
    const xticks = [];
    for(let i = 0; i <= 4; i++) xticks.push(st.T * i / 4);
    plots.forEach((p, i) => {
      plotFrame(ctx, p.P, i === 2 ? 't  (s)' : '', p.lab, p.title);
      plotZeroY(ctx, p.P);
      plotTicksX(ctx, p.P, xticks, v => fmtNum(v, 3));
      /* the area up to t, for the two lower plots */
      if(i > 0){
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p.P.X(0), p.P.Y(0));
        for(let k = 0; k <= 200; k++){
          const t = st.t * k / 200;
          ctx.lineTo(p.P.X(t), p.P.Y(Math.max(p.P.y0, Math.min(p.P.y1, p.f(t)))));
        }
        ctx.lineTo(p.P.X(st.t), p.P.Y(0)); ctx.closePath();
        ctx.fillStyle = rgbCss(p.col, 0.22); ctx.fill();
        ctx.restore();
      }
      plotCurve(ctx, p.P, p.f, 500, rgbCss(p.col), 2.4);
      /* the memorised formula, drawn over the motion it is supposed to describe */
      if(D && i === 0){
        ctx.save(); ctx.setLineDash([6, 4]);
        plotCurve(ctx, p.P, t => st.x0 + st.v0 * t + 0.5 * D.a0 * t * t, 300, rgbCss(TH.neg, 0.9), 1.8);
        ctx.setLineDash([]); ctx.restore();
      }
      if(D && i === 1){
        ctx.save(); ctx.setLineDash([6, 4]);
        plotCurve(ctx, p.P, t => st.v0 + D.a0 * t, 2, rgbCss(TH.neg, 0.9), 1.6);
        ctx.setLineDash([]); ctx.restore();
      }
      /* the tangent at t, for the two upper plots */
      if(i < 2){
        const m = i === 0 ? V(st.t) : A(st.t);
        const y = p.f(st.t);
        plotCurve(ctx, p.P, t => y + m * (t - st.t), 2, rgbCss(TH.text, 0.55), 1.6);
      }
      probeLine(ctx, p.P, st.t, i === 0 ? 't' : null);
      ctDot(ctx, { X:p.P.X, Y:p.P.Y }, st.t, Math.max(p.P.y0, Math.min(p.P.y1, p.f(st.t))), 5,
            rgbCss(p.col), rgbCss(TH.bg));
    });
    stageNote(ctx, st.own
      ? 'the dashed curves are the constant-acceleration formulas, drawn over the motion that actually happened'
      : 'the faint straight lines are tangents; the shading is area — slope going down, area coming back up', W, H);
  },
  readoutOwn(st){
    const D = STAGES.dyKinem.own(st);
    const t = Math.min(st.t, st.T);
    const now = D.at(t);
    const scale = Math.max(1e-9, Math.abs(D.x - st.x0));
    return `<div class="card tight"><div class="ttl">The programme you wrote</div>
      ${kv('a(t)', pkPretty(st.asrc) + ' m/s²')}
      ${kv('a at t = 0', fmtNum(D.a0, 6) + ' m/s²')}
      ${kv('how far from constant a gets', fmtNum(D.aSpread, 5) + ' m/s² of spread')}
      ${kv('x at t = ' + fmtNum(t, 4) + ' s', fmtNum(now.x, 6) + ' m')}
      ${kv('v there', fmtNum(now.v, 6) + ' m/s')}
    </div>
    <div class="card tight"><div class="ttl">Two routes to the answer at t = ${fmtNum(st.T, 4)} s</div>
      ${kv('v(T) by RK4', fmtNum(D.v, 8) + ' m/s')}
      ${kv('v(T) by v₀ + ∫a dt, quadrature', fmtNum(D.vQ, 8) + ' m/s')}
      ${kv('difference', fmtNum(D.gapV, 3) + ' m/s')}
      ${kv('x(T) by RK4', fmtNum(D.x, 8) + ' m')}
      ${kv('x(T) by x₀ + v₀T + ∫(T−t)a dt', fmtNum(D.xQ, 8) + ' m')}
      ${kv('difference', fmtNum(D.gapX, 3) + ' m')}
      <p class="help">The second route to x is a single quadrature, not two. Swapping the order of the
      double integral ∫₀ᵀ∫₀ˢa(u)du ds turns it into one integral with a (T − u) weight — the Cauchy
      formula for a repeated integral — and it shares no code with the stepper.</p>
    </div>
    <div class="card tight"><div class="ttl">And what the memorised formula says</div>
      ${kv('the motion actually ended at', fmtNum(D.x, 7) + ' m')}
      ${kv('x₀ + v₀T + ½a(0)T² says', fmtNum(D.suvat0, 7) + ' m')}
      ${kv('wrong by', fmtNum(D.errSuvat0, 5) + ' m')}
      ${kv('as a fraction of the displacement', fmtNum(D.errSuvat0 / scale, 4))}
      ${kv('the repair: ½āT² with ā = Δv/T', fmtNum(D.suvatBar, 7) + ' m')}
      ${kv('still wrong by', fmtNum(D.errSuvatBar, 5) + ' m')}
      ${kv('but x₀ + v̄T with v̄ = ⟨v⟩ gives', fmtNum(D.meanV, 7) + ' m')}
      ${kv('wrong by', fmtNum(D.errMeanV, 3) + ' m')}
      <p class="help">${D.aSpread < 1e-9
        ? 'Your acceleration is constant, so every row above agrees — which is the honest reason the formulas are taught. Give a some t-dependence and they part company.'
        : 'The first formula fails because it assumed a never changes. The second fails for a subtler reason worth sitting with: putting the <i>average</i> acceleration into a formula derived for a constant one is not a repair, because ½at² is not linear in a — the displacement depends on <i>when</i> the acceleration was applied, not merely on its mean.'}
      The last row holds regardless, because <b>x = x₀ + v̄T</b> is the definition of the mean velocity
      rather than a consequence of anything.</p>
    </div>
    <div class="card tight"><div class="ttl">Read the three plots together</div>
      ${kv('mean acceleration Δv/T', fmtNum(D.aBar, 6) + ' m/s²')}
      ${kv('mean velocity ⟨v⟩', fmtNum(D.vBar, 6) + ' m/s')}
      ${kv('total change in velocity', fmtNum(D.v - st.v0, 6) + ' m/s')}
      ${kv('and the area under a(t)', fmtNum(D.vQ - st.v0, 6) + ' m/s')}
      <p class="help">The last two rows are the same statement made twice: the area under the
      acceleration curve <i>is</i> the change in velocity, whatever shape that curve has. Nothing in the
      relationship between the three plots needed a to be constant — only the closed forms did.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.dyKinem.readoutOwn(st);
    const t = st.t;
    const x = dyPos(st.x0, st.v0, st.a, t), v = dyVel(st.v0, st.a, t);
    const area = nqAdaptive(s => dyVel(st.v0, st.a, s), 0, t, 1e-12);
    const turn = Math.abs(st.a) > 1e-9 ? -st.v0 / st.a : NaN;
    return `<div class="card tight"><div class="ttl">At t = ${fmtNum(t, 4)} s</div>
      ${kv('x = x₀ + v₀t + ½at²', fmtNum(x, 6) + ' m')}
      ${kv('v = v₀ + at', fmtNum(v, 6) + ' m/s')}
      ${kv('a', fmtNum(st.a, 5) + ' m/s²')}
      ${kv('speed |v|', fmtNum(Math.abs(v), 6) + ' m/s')}
      ${kv('is it speeding up?', v * st.a > 0 ? 'yes — v and a point the same way' : v * st.a < 0 ? 'no — it is slowing down' : 'neither')}
    </div>
    <div class="card tight"><div class="ttl">The four equations, each checked</div>
      ${kv('displacement from the formula', fmtNum(x - st.x0, 7) + ' m')}
      ${kv('the area under v(t), integrated', fmtNum(area, 7) + ' m')}
      ${kv('difference', fmtNum(Math.abs(x - st.x0 - area), 3))}
      ${kv('v² = v₀² + 2aΔx  gives |v| =', fmtNum(dyVelFromX(st.v0, st.a, x - st.x0), 6) + ' m/s')}
      ${kv('and v = v₀ + at gives', fmtNum(Math.abs(v), 6) + ' m/s')}
      ${kv('average velocity (v₀+v)/2', fmtNum(dyAvgVel(st.v0, v), 6) + ' m/s')}
      ${kv('and Δx/t', t > 1e-9 ? fmtNum((x - st.x0) / t, 6) + ' m/s' : '—')}
      <p class="help">The two routes to the displacement — the closed-form equation and the numerically
      integrated area under v(t) — agree to quadrature precision. That equality is what "the area under the
      velocity graph is the displacement" means, and it is the Fundamental Theorem of Calculus wearing a
      lab coat.</p>
    </div>
    <div class="card tight"><div class="ttl">Landmarks of this motion</div>
      ${kv('turning point (v = 0)', Number.isFinite(turn) && turn > 0 ? 'at t = ' + fmtNum(turn, 5) + ' s' : 'never — it does not turn round')}
      ${Number.isFinite(turn) && turn > 0 ? kv('position there', fmtNum(dyPos(st.x0, st.v0, st.a, turn), 6) + ' m') : ''}
      ${Number.isFinite(turn) && turn > 0 ? kv('acceleration there', fmtNum(st.a, 5) + ' m/s²  — not zero') : ''}
      ${kv('returns to x₀ at', Math.abs(st.a) > 1e-9 && st.v0 * st.a < 0 ? 't = ' + fmtNum(-2 * st.v0 / st.a, 5) + ' s' : 'never')}
      <p class="help">At the turning point the object is <i>momentarily at rest</i> and still accelerating
      at full strength — velocity zero, acceleration not. A ball at the top of its flight is the standard
      example, and "at rest so no force acts" is the standard mistake.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.dyKinem.own(st);
      return `<div class="k">SUVAT is out by</div>
        <div style="color:var(--c-neg)">${fmtNum(D.errSuvat0, 4)} m</div>
        <div style="color:var(--c-grad)">x(T) = ${fmtNum(D.x, 5)} m</div>`;
    }
    return `<div class="k">t = ${fmtNum(st.t, 3)} s</div>
      <div style="color:var(--c-grad)">x = ${fmtNum(dyPos(st.x0, st.v0, st.a, st.t), 5)} m</div>
      <div style="color:var(--c-curl)">v = ${fmtNum(dyVel(st.v0, st.a, st.t), 5)} m/s</div>`;
  },
  legend(st){
    const base = [['var(--c-grad)', 'position'], ['var(--c-curl)', 'velocity'],
                  ['var(--c-warn)', 'acceleration'], ['var(--text)', 'the tangent — a slope read as a rate']];
    return st && st.own ? base.concat([['var(--c-neg)', 'the constant-acceleration formula']]) : base;
  },
  dockLegend:true
};

/* ---- 2 · projectiles, with and without air ------------------------------- */
STAGES.dyProj = {
  title:'Projectile motion',
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 9.80665;
    const R = st.v0 * st.v0 * Math.sin(2 * st.ang) / g;
    return {
      title:'Two independent one-dimensional problems, sharing a clock',
      steps:[
        drvSay('Galileo\'s insight, which is the whole of it',
          'Gravity pulls only downwards. So the horizontal motion has no force on it at all and proceeds at constant velocity, while the vertical motion is uniformly accelerated. The two do not interact — they merely happen at the same time.'),
        drvStep('split the initial velocity',
          `${dv('v')}ₓ ${dop('=')} ${dv('v')}₀cos θ, &nbsp; ${dv('v')}_y ${dop('=')} ${dv('v')}₀sin θ`,
          `v₀ = ${n(st.v0)} m/s at ${n(st.ang * 180 / Math.PI)}°: vₓ = ${n(st.v0 * Math.cos(st.ang))}, v_y = ${n(st.v0 * Math.sin(st.ang))}`),
        drvStep('horizontally, nothing accelerates',
          `${dv('x')} ${dop('=')} ${dv('v')}ₓ${dv('t')}`,
          'so horizontal distance is simply speed times time'),
        drvStep('vertically, it is free fall',
          `${dv('y')} ${dop('=')} ${dv('v')}_y${dv('t')} ${dop('−')} ${dfrac('1', '2')}${dv('g')}${dv('t')}²`,
          'the suvat result from the previous stage, applied to one component'),
        drvSay('the famous consequence, worth testing',
          'A bullet fired horizontally and one dropped from the same height hit the ground at the same moment. The horizontal motion is irrelevant to the vertical fall, because the equations do not couple. It is counter-intuitive and it is exactly right.'),
        drvStep('eliminate t to get the path',
          `${dv('y')} ${dop('=')} ${dv('x')} tan θ ${dop('−')} ${dfrac(dv('g') + dv('x') + '²', '2' + dv('v') + '₀²cos²θ')}`,
          'a parabola — quadratic in x, which is why every trajectory has the same shape'),
        drvStep('and setting y = 0 gives the range',
          `${dv('R')} ${dop('=')} ${dfrac(dv('v') + '₀² sin 2θ', dv('g'))}`,
          `R = ${n(R)} m at this angle`),
        drvSay('the sin 2θ answers two questions at once',
          'It is largest at 2θ = 90°, so 45° maximises range. And sin 2θ takes the same value at θ and 90° − θ, so 30° and 60° give identical range by different routes — one flat and fast, one high and slow. The symmetry is in the formula, not a coincidence.'),
        drvStep('with drag, none of this survives',
          `${dv('F')} ${dop('=')} ${dop('−')}${dv('b')}${dv('v')}|${dv('v')}|`,
          st.drag > 0 ? `drag is on here — the panel integrates numerically and the range falls to well under ${n(R)} m` : 'turn drag on and the closed forms stop applying'),
        drvSay('and the optimal angle drops below 45°',
          'Drag punishes long flight times, so a flatter, faster trajectory does better. There is no closed form for the optimal angle with quadratic drag — it has to be found numerically, which is what the fan of trajectories does. Real ballistics is a computational subject for this reason.'),
        st.own
          ? drvSay('so the panel finds it rather than knowing it',
              'With a drag law of your own there is nothing to differentiate: the optimum is located by integrating forty trajectories, drawing the range against launch angle, and cutting that interval into thirds until the peak stops moving. The check that licenses the method is the case where an answer does exist — set the drag to zero and the search returns 45.000°, having consulted no formula on the way. The terminal speed is found the same way, by bisection on D(v) − mg, so it is right for whatever law you wrote rather than only for √(mg/k).')
          : drvSay('which is a good reason to make the law itself the variable',
              'The optimum below 45° is a consequence of the particular drag law, not a fact about projectiles. Write your own and the panel locates the optimum by searching the integrated ranges — and a linear drag law, a cubic one and no drag at all give three different answers, none of which any formula on this ladder could have supplied.')
      ],
      note:'With drag switched on the motion is integrated with RK4 rather than evaluated from a formula, because no closed form exists. The vacuum parabola is drawn alongside so the size of the correction is visible rather than described.'
    };
  },
  enter(st, o){
    st.v0 = o.v0 === undefined ? 24 : o.v0;
    st.ang = (o.ang === undefined ? 45 : o.ang) * Math.PI / 180;
    st.drag = o.drag === undefined ? 0 : o.drag;
    st.mass = 0.145;
    st.t = 0; st.run = o.run !== false;
    st.fan = o.fan !== false;
    st.own = !!o.own;
    st.dsrc = o.dsrc || '0.004*v^2';
  },
  /* the typed law: one trajectory, one optimum located by ternary search, and
     forty more integrations for the range curve. All of it once per edit. */
  own(st){
    const key = st.dsrc + '@' + st.v0 + '@' + st.ang + '@' + st.mass;
    if(st._pk2 === key) return st._pd;
    st._pk2 = key;
    const raw = pkSpeedFn(st.dsrc, () => 0);
    const D = s => { const q = raw(s); return Number.isFinite(q) ? Math.max(0, Math.min(1e7, q)) : 0; };
    const run = dyProjRun(D, st.v0, st.ang, st.mass, 0, DY_G, 0.001, 80000);
    const best = dyProjBest(D, st.v0, st.mass, DY_G, 0.003);
    const curve = [];
    for(let i = 0; i <= 40; i++){
      const th = (2 + 86 * i / 40) * Math.PI / 180;
      curve.push({ x:th * 180 / Math.PI, y:dyProjRange(D, st.v0, th, st.mass, DY_G, 0.004) || 0 });
    }
    st._pd = { D, run, best, curve, vac:dyProjectile(st.v0, st.ang),
      vacBest:st.v0 * st.v0 / DY_G, dragAt:D(st.v0), terminal:(function(){
        /* the speed at which the typed drag balances gravity, if it does — found
           by bisection on D(v) − mg rather than from any particular drag law */
        const w = st.mass * DY_G;
        if(D(400) < w) return NaN;
        let a = 0, b = 400;
        for(let i = 0; i < 80; i++){ const c = (a + b) / 2; if(D(c) < w) a = c; else b = c; }
        return (a + b) / 2;
      })() };
    return st._pd;
  },
  controls(){
    const st = ST;
    const head = ctSeg('dyPm', st.own ? 'custom' : 'std',
                       [['std', 'quadratic drag'], ['custom', 'a drag law of your own']]);
    if(st.own){
      return head +
        fnHtml('dyPd', 'drag D(v) =', st.dsrc, 'v, the speed in m/s') +
        ctlRow('speed v₀', ctlSlider('dyPv', 5, 45, 0.5, st.v0)) +
        ctlRow('angle', ctlSlider('dyPa', 5, 85, 0.5, st.ang * 180 / Math.PI)) +
        ctlRow('mass', ctlSlider('dyPmm', 0.02, 3, 0.005, st.mass)) +
        ctChk('dyPrun', 'launch it', st.run) +
        `<p class="help">Write the <b>magnitude of the retarding force in newtons</b> as a function of the
        speed <b>v</b>. It always opposes the velocity, so only its size is yours to choose:
        <b>0.004·v^2</b> for ordinary air, <b>0.05·v</b> for the creeping-flow law, <b>0.001·v^3</b> for
        something no fluid actually does, or <b>0</b> for vacuum.</p>
        <p class="help">The trajectory is integrated by RK4 — there is no closed form for most of these —
        and the landing point is located by solving the quadratic the final step followed rather than by
        reporting whichever grid point went below zero.</p>
        <p class="help">The right-hand plot is the <b>range against launch angle</b>, forty separate
        integrations, and the marked optimum is <b>found by a ternary search on that curve</b>, not looked
        up. Set the drag to <b>0</b> and it lands on 45.00°, which is the check. Turn it up and watch the
        optimum walk downhill — and note that the curve also goes <i>flat</i> near the top, which is why
        the exact angle matters far less than everyone assumes.</p>`;
    }
    return head +
      ctlRow('speed v₀', ctlSlider('dyPv', 5, 45, 0.5, st.v0)) +
      ctlRow('angle', ctlSlider('dyPa', 5, 85, 0.5, st.ang * 180 / Math.PI)) +
      ctlRow('drag k', ctlSlider('dyPk', 0, 0.02, 0.0002, st.drag)) +
      `<div class="row wrap">${ctChk('dyPrun', 'launch it', st.run)}
        ${ctChk('dyPfan', 'the fan of other angles', st.fan)}</div>
      <p class="help">Horizontal and vertical motion are <b>independent</b>: gravity acts only downwards,
      so the horizontal velocity never changes and the vertical one changes at a constant rate. That is
      Galileo's insight, and it is the entire content of projectile motion — everything else is the
      constant-acceleration equations applied twice.</p>
      <p class="help">The fan shows every launch angle at the same speed. The range <b>v₀²sin2θ/g</b> peaks
      at 45° and is symmetric about it, so 30° and 60° carry exactly the same distance — the panel prints
      both so the coincidence can be checked rather than believed.</p>
      <p class="help">Turn the drag up. Quadratic drag is <b>not</b> a small correction: the trajectory
      loses its symmetry entirely, the descending branch becomes far steeper than the ascending one, and
      the optimum launch angle drops well below 45°. The drag curve is integrated by RK4, since it has no
      closed form.</p>`;
  },
  wire(){
    ctWireSeg('dyPm', v => { ST.own = (v === 'custom'); ST.t = 0; });
    wireSlider('dyPv', () => ST.v0, v => { ST.v0 = v; }, v => fmtNum(+v, 3) + ' m/s');
    wireSlider('dyPa', () => ST.ang * 180 / Math.PI, v => { ST.ang = v * Math.PI / 180; }, v => fmtNum(+v, 3) + '°');
    ctWireChk('dyPrun', v => { ST.run = v; });
    if(ST.own){
      fnWire('dyPd', (m, s) => { ST.dsrc = s; ST.t = 0; }, pkSpeedBuild);
      wireSlider('dyPmm', () => ST.mass, v => { ST.mass = Math.max(1e-3, v); }, v => fmtNum(+v, 3) + ' kg');
      return;
    }
    wireSlider('dyPk', () => ST.drag, v => { ST.drag = v; }, v => fmtNum(+v, 3));
    ctWireChk('dyPfan', v => { ST.fan = v; });
  },
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.dyProj.own(st);
    const R = D.run;
    const T = R.ok ? R.tLand : 1;
    if(st.run){ st.t += dt * 0.9; if(st.t > T) st.t = 0; }
    st.t = Math.min(st.t, T);
    const V = D.vac;
    const maxR = Math.max(V.range, R.ok ? R.range : 0, 1);
    const maxH = Math.max(V.hMax, R.hMax, 1);
    /* The flight on the left, the range-against-angle curve on the right.
       ctBox scales by the SMALLER of its two spans, so handing it a half-size
       derived from the range fills the height with empty sky on a panel that is
       no longer full width. Pick the scale that satisfies both spans and let the
       half-size follow from it. */
    const pw = Math.max(140, W * 0.56);
    const pwEff = Math.max(40, pw - 84), phEff = Math.max(40, H - 80);
    const u = Math.min(pwEff / (1.15 * maxR), phEff / (2.3 * maxH));
    const P = ctBox(pw, H, maxR / 2, maxH * 0.85, Math.min(pwEff, phEff) / (2 * u));
    ctGrid(ctx, P);
    ctFrame(ctx, P, `v₀ = ${fmtNum(st.v0, 3)} m/s at ${fmtNum(st.ang * 180 / Math.PI, 3)}°  —  D(v) = ` +
                    pkPretty(st.dsrc) + ' N');
    ctPath(ctx, P, [{ x:-maxR, y:0 }, { x:maxR * 2, y:0 }], rgbCss(TH.line2), 2);
    ctParam(ctx, P, t => V.at(t), 0, V.tLand, 300, rgbCss(TH.grad, 0.45), 2);
    if(R.pts.length > 1) ctPath(ctx, P, R.pts, rgbCss(TH.neg), 2.6);
    const i = Math.max(0, Math.min(R.pts.length - 1, Math.round(st.t / 0.001)));
    const p = R.pts[i];
    if(p){
      ctDot(ctx, P, p.x, p.y, 7, rgbCss(TH.text), rgbCss(TH.bg));
      ctArrow(ctx, P, p.x, p.y, p.x, p.y - DY_G * maxR * 0.012 * 1.6, rgbCss(TH.neg), 2.2, 'g');
    }
    /* the range curve, and the optimum located on it */
    let hi = 0;
    for(const q of D.curve) hi = Math.max(hi, q.y);
    const Q = mkPlot(pw + 76, 52, Math.max(60, W - pw - 116), Math.max(60, H - 128), 0, 90, 0, hi * 1.12 || 1);
    plotFrame(ctx, Q, 'launch angle (degrees)', 'range (m)', 'range against angle — forty integrations');
    plotTicksX(ctx, Q, [0, 15, 30, 45, 60, 75, 90], v => String(v));
    plotTicksY(ctx, Q, [0, hi / 2, hi], v => fmtNum(v, 3));
    ctPath(ctx, Q, D.curve, rgbCss(TH.curl), 2.4);
    ctx.strokeStyle = rgbCss(TH.faint, 0.8); ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(Q.X(45), Q.py); ctx.lineTo(Q.X(45), Q.py + Q.ph); ctx.stroke();
    ctx.setLineDash([]);
    ctText(ctx, Q.X(45) + 5, Q.py + 14, '45°', rgbCss(TH.faint), '10px ' + FONT_UI);
    /* the launch being drawn is marked with a ring rather than a disc: it often
       sits within half a degree of the optimum, and two filled dots there are
       one dot */
    ctx.strokeStyle = rgbCss(TH.neg); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(Q.X(st.ang * 180 / Math.PI), Q.Y(R.ok ? R.range : 0), 7, 0, 6.2832); ctx.stroke();
    ctDot(ctx, Q, D.best.deg, D.best.range, 5, rgbCss(TH.pos), rgbCss(TH.bg));
    ctText(ctx, Q.X(D.best.deg), Q.Y(D.best.range) - 14,
           'best ' + fmtNum(D.best.deg, 4) + '°', rgbCss(TH.pos), '600 11px ' + FONT_UI, 'center');
    stageNote(ctx, 'the marked peak was located by a ternary search on this curve — no formula was consulted; the ring is the launch drawn on the left', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.dyProj.frameOwn(st, dt, ctx, W, H);
    const P0 = dyProjectile(st.v0, st.ang);
    const D = st.drag > 1e-9 ? dyProjectileDrag(st.v0, st.ang, 0, st.mass, st.drag, DY_G, 0.002, 12000) : null;
    const T = D ? D.tLand : P0.tLand;
    if(st.run){ st.t += dt * 0.9; if(st.t > T) st.t = 0; }
    st.t = Math.min(st.t, T);
    const maxR = Math.max(P0.range, D ? D.range : 0, 1);
    const maxH = Math.max(P0.hMax, D ? D.hMax : 0, 1);
    const P = ctBox(W, H, maxR / 2, maxH * 0.55, Math.max(maxR, maxH * 2) * 0.6);
    ctGrid(ctx, P);
    ctFrame(ctx, P, `v₀ = ${fmtNum(st.v0, 3)} m/s at ${fmtNum(st.ang * 180 / Math.PI, 3)}°` +
      (st.drag > 1e-9 ? '   —   with quadratic drag' : '   —   in vacuum'));
    ctPath(ctx, P, [{ x:-maxR, y:0 }, { x:maxR * 2, y:0 }], rgbCss(TH.line2), 2);
    if(st.fan){
      for(let a = 15; a <= 75; a += 15){
        const Q = dyProjectile(st.v0, a * Math.PI / 180);
        ctParam(ctx, P, t => Q.at(t), 0, Q.tLand, 160, rgbCss(TH.faint, 0.55), 1.2);
      }
    }
    ctParam(ctx, P, t => P0.at(t), 0, P0.tLand, 300, rgbCss(TH.grad, st.drag > 1e-9 ? 0.45 : 1), 2.2);
    if(D) ctPath(ctx, P, D.pts, rgbCss(TH.neg), 2.6);
    /* the moving object, its velocity, and the two components */
    const p = D ? D.pts[Math.min(D.pts.length - 1, Math.round(st.t / 0.002))] : P0.at(st.t);
    const v = D ? (() => {
      const i = Math.min(D.pts.length - 2, Math.round(st.t / 0.002));
      return { x:(D.pts[i + 1].x - D.pts[i].x) / 0.002, y:(D.pts[i + 1].y - D.pts[i].y) / 0.002 };
    })() : P0.vAt(st.t);
    const s = maxR * 0.012;
    ctArrow(ctx, P, p.x, p.y, p.x + v.x * s, p.y + v.y * s, rgbCss(TH.curl), 2.6, 'v');
    ctArrow(ctx, P, p.x, p.y, p.x + v.x * s, p.y, rgbCss(TH.warn, 0.8), 1.8, null);
    ctArrow(ctx, P, p.x, p.y, p.x, p.y + v.y * s, rgbCss(TH.pos, 0.8), 1.8, null);
    ctArrow(ctx, P, p.x, p.y, p.x, p.y - DY_G * s * 1.6, rgbCss(TH.neg), 2.2, 'g');
    ctDot(ctx, P, p.x, p.y, 7, rgbCss(TH.text), rgbCss(TH.bg));
    /* the apex and landing point */
    ctDot(ctx, P, P0.vx * P0.tTop, P0.hMax, 4, rgbCss(TH.grad, 0.7), rgbCss(TH.bg));
    stageNote(ctx, 'orange and green are the two velocity components — the orange one never changes without drag', W, H);
  },
  readoutOwn(st){
    const D = STAGES.dyProj.own(st);
    const R = D.run, V = D.vac;
    if(!R.ok) return `<div class="card tight"><div class="ttl">It never came down</div>
      <p class="help">With this law the projectile did not return to the ground inside the integration
      window. A drag force that grows without bound, or one written with the wrong sign, will do that.
      Try something like <b>0.004·v^2</b>.</p></div>`;
    const noDrag = D.dragAt < 1e-12;
    return `<div class="card tight"><div class="ttl">The law you wrote</div>
      ${kv('D(v)', pkPretty(st.dsrc) + ' N')}
      ${kv('at the launch speed', fmtNum(D.dragAt, 5) + ' N')}
      ${kv('the weight, for comparison', fmtNum(st.mass * DY_G, 5) + ' N')}
      ${kv('so drag is', fmtNum(D.dragAt / (st.mass * DY_G), 4) + ' × the weight at launch')}
      ${kv('terminal speed, where D(v) = mg', Number.isFinite(D.terminal)
          ? fmtNum(D.terminal, 5) + ' m/s' : 'none — this law never balances the weight')}
      <p class="help">The terminal speed is located by <b>bisection on D(v) − mg</b>, so it is found for
      whatever law you wrote rather than from √(mg/k), which only applies to one of them.</p>
    </div>
    <div class="card tight"><div class="ttl">This launch, integrated</div>
      ${kv('range', fmtNum(R.range, 7) + ' m')}
      ${kv('in vacuum it would be v₀²sin2θ/g', fmtNum(V.range, 7) + ' m')}
      ${kv('difference', fmtNum(V.range - R.range, 5) + ' m  (' +
           fmtNum(100 * (1 - R.range / (V.range || 1)), 4) + '%)')}
      ${kv('flight time', fmtNum(R.tLand, 6) + ' s')}
      ${kv('and in vacuum', fmtNum(V.tLand, 6) + ' s')}
      ${kv('apex', fmtNum(R.hMax, 6) + ' m')}
      ${kv('impact speed', fmtNum(R.vImpact, 6) + ' m/s')}
      ${kv('launch speed, for comparison', fmtNum(st.v0, 6) + ' m/s')}
      ${kv('impact angle below the horizontal', ctDeg(R.angImpact))}
      <p class="help">${noDrag
        ? 'With no drag the integrated range agrees with the closed form to the digits shown, which is the check that everything downstream rests on: the stepper is reproducing an answer it was never given.'
        : 'It lands slower than it left and steeper than it rose. Neither is possible without dissipation, and both are read off the integrated track rather than estimated — there is no closed form for this trajectory at all.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The best angle, located</div>
      ${kv('optimum, by ternary search on the range curve', fmtNum(D.best.deg, 6) + '°')}
      ${kv('the range it gives', fmtNum(D.best.range, 7) + ' m')}
      ${kv('45° gives', fmtNum(dyProjRange(D.D, st.v0, Math.PI / 4, st.mass, DY_G, 0.002), 7) + ' m')}
      ${kv('so the optimum beats 45° by', fmtNum(D.best.range -
           dyProjRange(D.D, st.v0, Math.PI / 4, st.mass, DY_G, 0.002), 4) + ' m')}
      ${kv('and it sits below 45° by', fmtNum(45 - D.best.deg, 5) + '°')}
      <p class="help">${noDrag
        ? 'With no drag it comes out at 45.000°, which is the right answer arrived at the wrong way round — by integrating forty trajectories and searching, rather than by differentiating sin2θ. That agreement is what licenses the search on laws that have no closed form.'
        : 'Nothing here differentiated anything. Forty trajectories were integrated, a curve drawn through their ranges, and the peak located by cutting the interval into thirds until it stopped moving. The optimum falls below 45° because a steeper launch spends longer in the air, and longer in the air is more time for the drag to work.'}</p>
      <p class="help">Look at how <b>flat</b> the curve is near its peak. Ten degrees either side of the
      optimum costs a percent or two of range, which is why real throwing and kicking technique worries
      about speed and spin and hardly at all about the angle.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.dyProj.readoutOwn(st);
    const P = dyProjectile(st.v0, st.ang);
    const D = st.drag > 1e-9 ? dyProjectileDrag(st.v0, st.ang, 0, st.mass, st.drag, DY_G, 0.002, 12000) : null;
    const comp = [30, 45, 60].map(a => kv(a + '°', fmtNum(dyProjectile(st.v0, a * Math.PI / 180).range, 6) + ' m'));
    const t = Math.min(st.t, P.tLand);
    const v = P.vAt(t);
    return `<div class="card tight"><div class="ttl">In vacuum</div>
      ${kv('v₀ₓ = v₀cos θ', fmtNum(P.vx, 6) + ' m/s')}
      ${kv('v₀ᵧ = v₀sin θ', fmtNum(P.vy, 6) + ' m/s')}
      ${kv('time to the apex  v₀ᵧ/g', fmtNum(P.tTop, 6) + ' s')}
      ${kv('apex height  v₀ᵧ²/2g', fmtNum(P.hMax, 6) + ' m')}
      ${kv('flight time', fmtNum(P.tLand, 6) + ' s')}
      ${kv('range  v₀²sin2θ/g', fmtNum(P.range, 6) + ' m')}
      ${kv('and v₀ₓ × flight time', fmtNum(P.vx * P.tLand, 6) + ' m')}
    </div>
    <div class="card tight"><div class="ttl">At t = ${fmtNum(t, 4)} s</div>
      ${kv('position', ctVec2({ x:P.at(t).x, y:P.at(t).y }) + ' m')}
      ${kv('velocity', ctVec2(v) + ' m/s')}
      ${kv('vₓ has changed by', fmtNum(v.x - P.vx, 3) + ' m/s')}
      ${kv('speed', fmtNum(Math.hypot(v.x, v.y), 6) + ' m/s')}
      ${kv('and at the same height coming down', fmtNum(Math.hypot(v.x, -v.y), 6) + ' m/s')}
      <p class="help">The horizontal component is unchanged to the last digit, because nothing pushes
      horizontally. And the speed at any height is the same going up as coming down — energy conservation,
      visible in the kinematics.</p>
    </div>
    <div class="card tight"><div class="ttl">The range, angle by angle</div>
      ${comp.join('')}
      ${kv('30° and 60° differ by', fmtNum(Math.abs(dyProjectile(st.v0, Math.PI / 6).range - dyProjectile(st.v0, Math.PI / 3).range), 3) + ' m')}
      <p class="help">Complementary angles carry the same distance, because sin2θ is symmetric about 45°.
      A high lob and a flat drive land in the same place — one just takes much longer to get there.</p>
    </div>
    ${D ? `<div class="card tight"><div class="ttl">With drag (k = ${fmtNum(st.drag, 4)}, m = 145 g)</div>
      ${kv('range', fmtNum(D.range, 6) + ' m')}
      ${kv('lost to the air', fmtNum(P.range - D.range, 5) + ' m  (' + fmtNum(100 * (1 - D.range / P.range), 3) + '%)')}
      ${kv('apex', fmtNum(D.hMax, 5) + ' m')}
      ${kv('flight time', fmtNum(D.tLand, 5) + ' s')}
      <p class="help">The trajectory is no longer a parabola and no longer symmetric: the object spends
      longer rising than falling and comes down far more steeply than it went up. There is no closed form —
      this curve is integrated by RK4 — and the optimum launch angle for range drops well below 45°, which
      is why a driven golf ball is hit lower than intuition suggests.</p>
    </div>` : ''}`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.dyProj.own(st);
      return `<div class="k">best angle, located</div>
        <div style="color:var(--c-pos)">${fmtNum(D.best.deg, 5)}°</div>
        <div style="color:var(--c-neg)">range ${fmtNum(D.run.ok ? D.run.range : 0, 5)} m</div>`;
    }
    const P = dyProjectile(st.v0, st.ang);
    return `<div class="k">range</div><div style="color:var(--c-grad)">${fmtNum(P.range, 5)} m</div>
      <div>apex ${fmtNum(P.hMax, 4)} m</div>`;
  },
  legend(st){
    return st && st.own
      ? [['var(--c-grad)', 'the vacuum trajectory'], ['var(--c-neg)', 'with the drag you wrote'],
         ['var(--c-curl)', 'range against launch angle'], ['var(--c-pos)', 'the optimum, located by search']]
      : [['var(--c-grad)', 'the vacuum trajectory'], ['var(--c-neg)', 'with drag, and gravity'],
         ['var(--c-curl)', 'the velocity'], ['var(--c-warn)', 'its horizontal part'],
         ['var(--c-pos)', 'its vertical part']];
  },
  dockLegend:true
};

/* ---- 3 · Newton's laws: free bodies -------------------------------------- */
