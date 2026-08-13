/* ============================================================================
   
4ra - RELATIVITY: THE TWIN PARADOX AND CONSTANT ACCELERATION
   Split out of 
66c-stages-rel-minkowski.js
 to keep each file under the ~600-line guidance
   in src/js/CLAUDE.md. Load order is unchanged: this file sorts immediately
   after its parent, and everything shares one script scope.
   ============================================================================ */

STAGES.rlTwin = {
  title: 'The twin paradox',
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 1 / Math.sqrt(1 - st.beta * st.beta);
    return {
      title:'Where the symmetry actually breaks',
      steps:[
        drvSay('the puzzle, stated properly',
          'One twin travels and returns younger. But motion is relative — each saw the other moving, so each should expect the other to be younger. Both cannot be right, and the resolution is not that one was "really" moving.'),
        drvStep('the travelling twin\'s elapsed time',
          `τ ${dop('=')} ${dfrac(dv('T'), 'γ')}`,
          `β = ${n(st.beta)}, γ = ${n(g)}: a ${n(2 * st.T)}-year round trip costs the traveller ${n(2 * st.T / g)} years`),
        drvSay('the symmetry is broken by the turnaround, not by the speed',
          'The stay-at-home twin remains in one inertial frame throughout. The traveller does not — she changes frames at the far end, and feels it. That is a physical, frame-independent difference: an accelerometer records it. The situations were never symmetric.'),
        drvStep('and the turnaround has a dramatic effect on her notion of "now"',
          `the home twin's current age jumps by ${dfrac('2γβ²' + dv('T'), '1')}`,
          st.sim ? 'the panel draws her lines of simultaneity sweeping across the home twin\'s worldline' : 'switch simultaneity lines on to watch it'),
        drvSay('this is the resolution, and it is entirely about simultaneity',
          'Before turning, the traveller\'s "now" on Earth is one moment; after turning, it is a much later one. She did not see anything sudden — the light takes time to arrive — but her frame\'s definition of the present swept forward through years of the other twin\'s life.'),
        drvStep('the light signals tell a consistent story',
          `outbound: ${dv('f')}√${dfrac('1 − β', '1 + β')}, inbound: ${dv('f')}√${dfrac('1 + β', '1 − β')}`,
          st.sig ? 'the panel draws every signal and counts them — both twins agree on the totals' : ''),
        drvSay('and counting signals settles it without any philosophy',
          'Each twin sends one pulse per year and both count what arrives. The counts are unambiguous, frame-independent, and they agree: the traveller received more than she sent. No interpretation is needed — the ledger balances.'),
        drvStep('and geometrically the answer is almost obvious',
          `the straight worldline has the longest proper time`,
          'in Minkowski geometry the direct path between two events maximises the interval, which is why the twin who did not turn aged more'),
        drvSay('the reversed triangle inequality',
          'In Euclidean space a straight line is the shortest path. Because of the flipped sign, a straight worldline is the longest in proper time. Taking a detour through spacetime costs you time — that is the twin paradox in one sentence.')
      ],
      note:'Every signal drawn is emitted and received according to the actual worldlines, and the panel counts both totals. They agree with the proper times computed from the intervals, so the paradox is resolved arithmetically rather than by assertion.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.8 : o.beta;
    st.T = o.T === undefined ? 5 : o.T;
    st.sim = o.sim !== false;
    st.sig = o.sig !== false;
  },
  controls(){
    const st = ST;
    return ctlRow('travel speed β', ctlSlider('rlTwB', 0.2, 0.98, 0.005, st.beta)) +
      ctlRow('half-trip (yr)', ctlSlider('rlTwT', 2, 12, 0.5, st.T)) +
      `<label class="chk"><input type="checkbox" id="rlTwS" ${st.sim?'checked':''}><span>the traveller's lines of simultaneity</span></label>
       <label class="chk"><input type="checkbox" id="rlTwG" ${st.sig?'checked':''}><span>the light signals each twin sends</span></label>` +
      rlClockCtl() +
      `<p class="help">Both twins travel between the same two events — the parting and the reunion — and
      each ages by the length of their own worldline. The stay-at-home takes the straight route, and in
      Minkowski geometry the straight route is the one of <b>greatest</b> proper time. That is the whole
      resolution. Acceleration matters only because it is what forces the traveller off the straight
      line; the symmetry breaks on a fact anyone can check without any theory at all, which is that only
      one twin changed frames.</p>`;
  },
  wire(){
    wireSlider('rlTwB', () => ST.beta, v => { ST.beta = v; ST.t = 0; }, rlBetaFmt, RL_BETA_LIM);
    wireSlider('rlTwT', () => ST.T, v => { ST.T = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' yr each way');
    $('rlTwS').addEventListener('change', e => { ST.sim = e.target.checked; });
    $('rlTwG').addEventListener('change', e => { ST.sig = e.target.checked; });
    rlWireClock(st => { st.t = 0; });
  },
  facts(st){
    const g = relGamma(st.beta), k = relKFactor(st.beta), b = st.beta, T = st.T;
    return {
      g, k, b, T,
      earthTotal: 2 * T, travTotal: 2 * T / g, turnX: b * T,
      jumpFrom: T / (g * g), jumpTo: T * (1 + b * b), jump: 2 * b * b * T,
      travSlowFor: T / g, travFastFor: T / g,
      earthSlowFor: T * (1 + b), earthFastFor: T * (1 - b)
    };
  },
  frame(st, dt, ctx, W, H){
    const f = this.facts(st);
    const tMax = 2 * st.T * 1.08, xMax = Math.max(0.6, f.turnX * 1.9);
    const size = Math.min(W * 0.46, H - 96);
    const px = W * 0.28 - size / 2, py = 42;
    const M = { X: x => px + (x + xMax) / (2 * xMax) * size, Y: t => py + size - t / tMax * size };
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(px, py, size, size);
    rlText(ctx, px + size / 2, py - 15, 'Both worldlines, drawn in the Earth frame',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, size, size); ctx.clip();

    if(st.sig){
      for(let n = 1; n <= Math.floor(f.travTotal); n++){
        const tau = n, out = tau <= st.T / f.g;
        const tt = out ? tau * f.g : st.T + (tau - st.T / f.g) * f.g;
        const xx = out ? st.beta * tt : f.turnX - st.beta * (tt - st.T);
        rlSegment(ctx, M.X(xx), M.Y(tt), M.X(0), M.Y(tt + xx), rgbCss(TH.pos, 0.32), 1);
      }
      for(let n = 1; n <= Math.floor(f.earthTotal); n++){
        const tt = n, meetOut = tt / (1 - st.beta);
        if(meetOut <= st.T)
          rlSegment(ctx, M.X(0), M.Y(tt), M.X(st.beta * meetOut), M.Y(meetOut), rgbCss(TH.grad, 0.28), 1);
        else {
          const meetIn = (tt + f.turnX + st.beta * st.T) / (1 + st.beta);
          if(meetIn <= 2 * st.T)
            rlSegment(ctx, M.X(0), M.Y(tt), M.X(f.turnX - st.beta * (meetIn - st.T)), M.Y(meetIn),
                      rgbCss(TH.grad, 0.28), 1);
        }
      }
    }
    if(st.sim){
      const simLine = (t0, x0, slope, col, w) =>
        rlSegment(ctx, M.X(-xMax), M.Y(t0 + slope * (-xMax - x0)),
                       M.X(xMax),  M.Y(t0 + slope * (xMax - x0)), col, w);
      for(let n = 1; n * f.g < st.T; n++){
        const tt = n * f.g;
        simLine(tt, st.beta * tt, st.beta, rgbCss(TH.pos, 0.15), 1);
      }
      for(let n = 1; n * f.g < st.T; n++){
        const tt = st.T + n * f.g;
        simLine(tt, f.turnX - st.beta * (tt - st.T), -st.beta, rgbCss(TH.pos, 0.15), 1);
      }
      /* the wedge of Earth-history the traveller skips at the turnaround */
      ctx.fillStyle = rgbCss(TH.warn, 0.12);
      ctx.beginPath();
      ctx.moveTo(M.X(0), M.Y(f.jumpFrom)); ctx.lineTo(M.X(f.turnX), M.Y(st.T));
      ctx.lineTo(M.X(0), M.Y(f.jumpTo)); ctx.closePath(); ctx.fill();
      simLine(f.jumpFrom, 0, st.beta, rgbCss(TH.warn, 0.85), 1.6);
      simLine(f.jumpTo, 0, -st.beta, rgbCss(TH.warn, 0.85), 1.6);
    }
    rlSegment(ctx, M.X(0), M.Y(0), M.X(xMax), M.Y(xMax), rgbCss(TH.warn, 0.28), 1.2);
    rlSegment(ctx, M.X(0), M.Y(0), M.X(-xMax), M.Y(xMax), rgbCss(TH.warn, 0.28), 1.2);
    rlSegment(ctx, M.X(0), M.Y(0), M.X(0), M.Y(2 * st.T), rgbCss(TH.grad), 2.6);
    rlSegment(ctx, M.X(0), M.Y(0), M.X(f.turnX), M.Y(st.T), rgbCss(TH.pos), 2.6);
    rlSegment(ctx, M.X(f.turnX), M.Y(st.T), M.X(0), M.Y(2 * st.T), rgbCss(TH.pos), 2.6);
    const T = (st.t * 0.4) % (2 * st.T);
    const trX = T <= st.T ? st.beta * T : f.turnX - st.beta * (T - st.T);
    rlDot(ctx, M.X(0), M.Y(T), 5.5, rgbCss(TH.grad), rgbCss(TH.bg));
    rlDot(ctx, M.X(trX), M.Y(T), 5.5, rgbCss(TH.pos), rgbCss(TH.bg));
    ctx.restore();
    rlText(ctx, M.X(0) - 9, M.Y(T), fmtNum(T, 3) + ' yr', rgbCss(TH.grad), '11px ' + FONT_MONO, 'right');
    rlText(ctx, M.X(trX) + 10, M.Y(T), fmtNum(T / f.g, 3) + ' yr', rgbCss(TH.pos), '11px ' + FONT_MONO);
    rlText(ctx, px + size / 2, py + size + 17, 'x  (light-years)  →', rgbCss(TH.faint), '11px ' + FONT_UI, 'center');

    /* the Doppler ledger, as two proportioned bars */
    const bx = W * 0.60, bw = Math.min(W * 0.34, 340);
    let by = 78;
    const bar = (label, segs, total) => {
      rlText(ctx, bx, by, label, rgbCss(TH.dim), '600 11.5px ' + FONT_UI);
      by += 17;
      let acc = 0;
      for(const [len, col, txt] of segs){
        const w0 = bw * len / total;
        ctx.fillStyle = rgbCss(col, 0.72);
        ctx.fillRect(bx + acc, by, w0, 20);
        if(w0 > 62) rlText(ctx, bx + acc + w0 / 2, by + 10, txt, rgbCss(TH.bg), '10px ' + FONT_MONO, 'center');
        acc += w0;
      }
      ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, 20);
      by += 38;
    };
    rlText(ctx, bx, 50, 'What each twin actually SEES', rgbCss(TH.text), '600 12.5px ' + FONT_UI);
    bar('Traveller watching Earth — over their own ' + fmtNum(f.travTotal, 3) + ' yr',
      [[f.travSlowFor, TH.neg, 'red ×' + fmtNum(1 / f.k, 3)],
       [f.travFastFor, TH.pos, 'blue ×' + fmtNum(f.k, 3)]], f.travTotal);
    bar('Earth watching the traveller — over its own ' + fmtNum(f.earthTotal, 3) + ' yr',
      [[f.earthSlowFor, TH.neg, 'red ×' + fmtNum(1 / f.k, 3)],
       [f.earthFastFor, TH.pos, 'blue ×' + fmtNum(f.k, 3)]], f.earthTotal);
    const lines = [
      'The asymmetry is right there: the traveller switches to the',
      'blueshifted rate exactly halfway through their own trip, while',
      'Earth must wait ' + fmtNum(f.turnX, 3) + ' more years for the news of the turn to',
      'arrive. Same k-factor, very different shares of the trip.'
    ];
    lines.forEach((s, i) => rlText(ctx, bx, by + i * 15, s, rgbCss(TH.faint), '11px ' + FONT_UI));
    stageNote(ctx, 'proper time is the length of a worldline — and here the straight one is the longest', W, H);
  },
  readout(st){
    const f = this.facts(st);
    const travReceives = f.travSlowFor / f.k + f.travFastFor * f.k;
    const earthReceives = f.earthSlowFor / f.k + f.earthFastFor * f.k;
    return `<div class="card tight"><div class="ttl">Two routes, two ages</div>
      ${kv('β', fmtNum(st.beta, 4) + ' c')}
      ${kv('γ', fmtNum(f.g, 6))}
      ${kv('distance to the turnaround', fmtNum(f.turnX, 4) + ' ly')}
      ${kv('Earth ages', fmtNum(f.earthTotal, 5) + ' yr')}
      ${kv('traveller ages', fmtNum(f.travTotal, 5) + ' yr')}
      ${kv('difference', fmtNum(f.earthTotal - f.travTotal, 5) + ' yr')}
      ${kv('√(interval²) of the straight route', fmtNum(Math.sqrt(relInterval(f.earthTotal, 0)), 5))}
      ${kv('sum of the two legs\' proper times', fmtNum(2 * Math.sqrt(relInterval(st.T, f.turnX)), 5))}
      <p class="help">Both twins agree on every line of that. There is no frame in which the traveller
      returns older, because "the length of <i>this</i> worldline" is not a frame-dependent quantity —
      it is the one thing in the whole subject that never was.</p>
    </div>
    <div class="card tight"><div class="ttl">The ledger of light signals — it has to balance</div>
      ${kv('each twin flashes once per year of their own time', '')}
      ${kv('traveller sends', fmtNum(f.travTotal, 4))}
      ${kv('Earth receives', fmtNum(earthReceives, 4))}
      ${kv('Earth sends', fmtNum(f.earthTotal, 4))}
      ${kv('traveller receives', fmtNum(travReceives, 4))}
      ${kv('residuals', fmtNear(travReceives - f.earthTotal) + '  /  ' + fmtNear(earthReceives - f.travTotal))}
      ${kv('Doppler k = √((1+β)/(1−β))', fmtNum(f.k, 5))}
      ${kv('and k + 1/k', fmtNum(f.k + 1 / f.k, 5) + '  = 2γ')}
      <p class="help">Every flash sent is a flash received, so the totals are forced — and they come out
      right without anyone having to rule on whose clock is "really" slow. The traveller sees Earth
      red then blue for equal halves of their trip; Earth sees red for
      <b>${fmtNum(f.earthSlowFor, 3)}</b> years and blue for only <b>${fmtNum(f.earthFastFor, 3)}</b>.
      That lopsidedness <i>is</i> the asymmetry, and it is observable, not conventional.</p>
    </div>
    <div class="card tight"><div class="ttl">What the turnaround does to "now"</div>
      ${kv('just before turning, Earth reads', fmtNum(f.jumpFrom, 5) + ' yr')}
      ${kv('just after, it reads', fmtNum(f.jumpTo, 5) + ' yr')}
      ${kv('the jump, 2β²T', fmtNum(f.jump, 5) + ' yr')}
      ${kv('the three pieces sum to', fmtNum(f.jumpFrom + f.jump + (f.earthTotal - f.jumpTo), 5) + ' yr')}
      <p class="help">Nothing happens to Earth at that instant. What changes is the traveller's
      <i>definition</i> of which Earth-event counts as simultaneous, because they have swapped one
      inertial frame for another and the two slice spacetime along different lines. The shaded wedge is
      the stretch of Earth history the traveller's "now" sweeps across during the turn — and it is
      exactly the missing years.</p>
    </div>`;
  },
  chip(st){
    const f = this.facts(st);
    return `<div class="k">Twins</div>
      <div style="color:var(--c-grad)">Earth: ${fmtNum(f.earthTotal, 4)} yr</div>
      <div style="color:var(--c-pos)">traveller: ${fmtNum(f.travTotal, 4)} yr</div>`;
  },
  legend(){ return [['var(--c-grad)', "the stay-at-home's worldline and signals"],
                    ['var(--c-pos)', "the traveller's worldline, signals and simultaneity lines"],
                    ['var(--c-warn)', 'the simultaneity lines bracketing the turnaround'],
                    ['var(--c-neg)', 'redshifted reception']]; }
};

/* ---- 10 · one g forever ----------------------------------------------------
   The most humane consequence of the theory, and the cruellest: a ship holding
   a steady 1 g reaches anywhere in the visible universe inside a human life,
   and returns to a home that has aged by the light-travel time. */
STAGES.rlRocket = {
  title: 'One g forever',
  derive(st){
    return {
      title:'Accelerating comfortably, and crossing the galaxy anyway',
      steps:[
        drvSay('the scenario',
          'Accelerate at a steady 9.81 m/s² — comfortable Earth gravity — for as long as you like. Newtonian mechanics says you pass c in under a year. Relativity says you never do, and yet you can still reach anywhere in the universe within a human lifetime.'),
        drvStep('constant proper acceleration means constant felt weight',
          `${dv('a')} ${dop('=')} ${dfrac('d', 'd')}(rapidity)/dτ ${dop('=')} const`,
          'it is the rapidity that grows steadily, not the velocity'),
        drvStep('so the speed approaches c but never reaches it',
          `${dv('v')} ${dop('=')} ${dv('c')} tanh(${dfrac(dv('a') + 'τ', dv('c'))})`,
          'tanh saturates at 1, so the ceiling is built in'),
        drvStep('but the distance covered grows exponentially in proper time',
          `${dv('x')} ${dop('=')} ${dfrac(dv('c') + '²', dv('a'))}(cosh(${dfrac(dv('a') + 'τ', dv('c'))}) ${dop('−')} 1)`,
          `to ${st.dest}: the panel prints the ship time and the Earth time side by side`),
        drvSay('and cosh grows exponentially, which is what saves the trip',
          'The ship\'s clock runs slow by an ever-increasing factor, so each extra year of proper time covers vastly more ground than the last. The galactic centre — 26 000 light years — takes about 20 years of ship time, and the observable universe about 45.'),
        drvStep('while Earth time grows only as fast as the distance allows',
          `${dv('t')} ${dop('=')} ${dfrac(dv('c'), dv('a'))} sinh(${dfrac(dv('a') + 'τ', dv('c'))})`,
          'the panel prints both — 26 000 years pass on Earth for the traveller\'s 20'),
        drvSay('so the trip is possible and the return is not',
          'Nothing in relativity forbids reaching the galactic centre within a career. What it forbids is coming home to the people who waved you off. The journey is one-way in every sense that matters.'),
        drvStep('the energy required is the obstacle, not the physics',
          `${dv('E')} ${dop('=')} (γ ${dop('−')} 1)${dv('m')}${dv('c')}²`,
          'the panel computes the fuel mass for a perfect matter–antimatter rocket — it is absurd'),
        drvSay('and that is the honest conclusion',
          'The kinematics is entirely permissive; the energetics is not. Reaching γ = 1000 requires converting hundreds of times the ship\'s mass into kinetic energy, at perfect efficiency. Relativity does not forbid interstellar travel — thermodynamics and engineering do.')
      ],
      note:'The hyperbolic worldline is drawn on the Minkowski diagram alongside the light cone it asymptotically approaches. It never crosses, however long the acceleration continues — which is the tanh ceiling made visible.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.dest = o.dest || 'galactic';
    st.a = 9.80665;
    st.probe = 0.5;
  },
  controls(){
    const st = ST;
    return rlSeg('rlRoD', st.dest, [['proxima','Proxima · 4.24 ly'],['galactic','galactic centre · 26 000 ly'],
                                     ['andromeda','Andromeda · 2.5 Mly'],['edge','the visible edge · 46 Gly']]) +
      ctlRow('along the trip', ctlSlider('rlRoP', 0.01, 1, 0.005, st.probe)) +
      `<p class="help">Hold a comfortable 1 g for half the distance, turn over, decelerate for the rest,
      and arrive at rest. The worldline is a <b>hyperbola</b>: it approaches the light cone and never
      touches it. The traveller's own elapsed time grows only <b>logarithmically</b> with distance,
      because γ climbs exponentially in their proper time — so the trip is possible, and the return
      is not, in any sense that matters.</p>`;
  },
  wire(){
    rlWireSeg('rlRoD', v => { ST.dest = v; });
    wireSlider('rlRoP', () => ST.probe, v => { ST.probe = v; }, v => fmtNum(+v * 100, 3) + '% of the way');
  },
  dist(st){
    const LY = 9.4607e15;
    return { proxima: 4.24 * LY, galactic: 26000 * LY, andromeda: 2.5e6 * LY, edge: 4.6e10 * LY }[st.dest];
  },
  frame(st, dt, ctx, W, H){
    const P = rlPanes(W, H, 34);
    /* the worldline, in the natural units c²/a and c/a */
    const A = mkPlot(P.top.x + 30, P.top.y + 14, Math.min(P.top.w - 60, 460), P.top.h - 38, -1.4, 4, -0.15, 4);
    plotFrame(ctx, A, 'distance  (units of c²/a)', 'time  (units of c/a)',
      'The worldline is a hyperbola, asymptotic to the light cone');
    plotTicksX(ctx, A, [-1, 0, 1, 2, 3, 4], v => String(v));
    rlYTicks(ctx, A, [0, 1, 2, 3, 4]);
    rlSegment(ctx, A.X(0), A.Y(0), A.X(4), A.Y(4), rgbCss(TH.warn), 1.8);
    rlText(ctx, A.X(3.1), A.Y(3.5), 'light', rgbCss(TH.warn), '11px ' + FONT_MONO);
    rlSegment(ctx, A.X(-1), A.Y(0), A.X(-1), A.Y(4), rgbCss(TH.curl, 0.85), 1.5, [5, 4]);
    rlText(ctx, A.X(-1) + 6, A.Y(3.6), 'Rindler horizon', rgbCss(TH.curl), '10px ' + FONT_MONO);
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for(let i = 0; i <= 300; i++){
      const tt = i / 300 * 4, h = relHyperbolic(1, tt);
      const X = A.X(h.x), Y = A.Y(tt);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.faint, 0.85); ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]); ctx.beginPath();
    for(let i = 0; i <= 120; i++){
      const tt = i / 120 * 4, xx = 0.5 * tt * tt;
      if(xx > 4.3) break;
      const X = A.X(xx), Y = A.Y(tt);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke(); ctx.setLineDash([]);
    rlText(ctx, A.X(2.4), A.Y(2.05), 'Newton', rgbCss(TH.faint), '10px ' + FONT_MONO);
    for(let n = 1; n <= 3; n++){
      const h = relHyperbolicTau(1, n);
      if(h.t > 4) break;
      rlDot(ctx, A.X(h.x), A.Y(h.t), 4.2, rgbCss(TH.pos));
      rlText(ctx, A.X(h.x) + 8, A.Y(h.t), 'τ = ' + n, rgbCss(TH.pos), '10px ' + FONT_MONO);
    }

    /* years elapsed, on a log scale — nothing else fits both curves on a page */
    const D = this.dist(st), YR = 3.15576e7;
    const ds = [], taus = [], tts = [];
    for(let i = 1; i <= 240; i++){
      const tr = relTrip(st.a, D * i / 240);
      ds.push(i / 240); taus.push(tr.tau / YR); tts.push(tr.t / YR);
    }
    const hi = Math.max(10, tts[tts.length - 1] * 1.6), lo = 0.4;
    const L = mkPlot(P.bot.x + 30, P.bot.y + 14, P.bot.w - 60, P.bot.h - 38,
                     0, 1, Math.log10(lo), Math.log10(hi));
    plotFrame(ctx, L, 'fraction of the way there', 'years elapsed  (log scale)',
      'Ship time barely moves; home time tracks the distance');
    plotTicksX(ctx, L, [0, 0.25, 0.5, 0.75, 1], v => fmtNum(v, 2));
    const sup = n => String(n).replace(/-/g, '⁻').replace(/[0-9]/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]);
    for(let e = Math.ceil(Math.log10(lo)); e <= Math.floor(Math.log10(hi)); e++){
      rlSegment(ctx, L.px, L.Y(e), L.px + L.pw, L.Y(e), rgbCss(TH.line, 0.6), 0.8);
      rlText(ctx, L.px - 6, L.Y(e), '10' + sup(e), rgbCss(TH.faint), '10px ' + FONT_MONO, 'right');
    }
    const lg = arr => arr.map(v => Math.log10(Math.max(lo, v)));
    rlLine(ctx, L, ds, lg(tts), rgbCss(TH.grad), 2.2);
    rlLine(ctx, L, ds, lg(taus), rgbCss(TH.pos), 2.4);
    rlSegment(ctx, L.X(st.probe), L.py, L.X(st.probe), L.py + L.ph, rgbCss(TH.warn, 0.6), 1.2, [4, 4]);
    stageNote(ctx, "the gap between the two curves is the whole of the traveller's bargain", W, H);
  },
  readout(st){
    const D = this.dist(st), LY = 9.4607e15, YR = 3.15576e7;
    const full = relTrip(st.a, D), part = relTrip(st.a, Math.max(1e6, D * st.probe));
    const name = { proxima:'Proxima Centauri', galactic:'the galactic centre',
                   andromeda:'the Andromeda galaxy', edge:'the edge of the observable universe' }[st.dest];
    return `<div class="card tight"><div class="ttl">The whole trip to ${name}</div>
      ${kv('distance', fmtNum(D / LY, 5) + ' ly')}
      ${kv('acceleration', '9.80665 m/s² — one g, throughout')}
      ${kv('elapsed on the ship', fmtNum(full.tau / YR, 5) + ' yr')}
      ${kv('elapsed at home', fmtNum(full.t / YR, 5) + ' yr')}
      ${kv('γ at turnover', fmtNum(full.gammaMax, 6))}
      ${kv('β at turnover', fmtNum(full.betaMax, 9) + ' c')}
      ${kv('shortfall from c', fmtNum(1 - full.betaMax, 4))}
      <p class="help">Doubling the distance adds only a few years to the ship's clock, because
      <b>τ ≈ (2c/a)·ln(aD/c²)</b>. That logarithm is why interstellar travel is a <i>navigational</i>
      problem rather than a physical impossibility — and the linear growth of the home clock is why it
      is a one-way trip regardless of the engine.</p>
    </div>
    <div class="card tight"><div class="ttl">At ${fmtNum(st.probe * 100, 3)}% of the way</div>
      ${kv('distance covered', fmtNum(D * st.probe / LY, 5) + ' ly')}
      ${kv('ship clock', fmtNum(part.tau / YR, 5) + ' yr')}
      ${kv('home clock', fmtNum(part.t / YR, 5) + ' yr')}
      ${kv('ratio', fmtNum(part.t / Math.max(1e-9, part.tau), 5))}
      ${kv('Rindler horizon, c²/a', fmtNum(C2 / st.a / LY, 5) + ' ly astern')}
      <p class="help">While the ship holds its acceleration, no signal sent from more than
      <b>${fmtNum(C2 / st.a / LY, 3)} light-years</b> behind it will ever catch up. Steady acceleration
      builds a horizon out of nothing but motion — the same kind of horizon a black hole has, and the
      reason an accelerating detector registers a warm thermal bath (the <b>Unruh effect</b>) where an
      inertial one finds empty space. It is the cleanest hint anywhere that horizons, temperature and
      information belong together.</p>
    </div>`;
  },
  chip(st){
    const YR = 3.15576e7, tr = relTrip(st.a, this.dist(st));
    return `<div class="k">1 g forever</div>
      <div style="color:var(--c-pos)">ship: ${fmtNum(tr.tau / YR, 4)} yr</div>
      <div style="color:var(--c-grad)">home: ${fmtNum(tr.t / YR, 4)} yr</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the worldline, and the home clock'],
                    ['var(--c-pos)', "the traveller's clock, and their proper-time ticks"],
                    ['var(--c-warn)', 'the light cone'],
                    ['var(--faint)', 'what Newton predicts — straight through the cone'],
                    ['var(--c-curl)', 'the Rindler horizon at c²/a']]; }
};

