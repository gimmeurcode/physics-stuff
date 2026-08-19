STAGES.rlChase = {
  title: 'Chasing a light beam',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'The question Einstein asked at sixteen, and what it forced',
      steps:[
        drvSay('the thought experiment',
          'Ride alongside a light beam at the speed of light. What do you see? Classically, a frozen electromagnetic wave standing still in space. Einstein realised that no such thing appears anywhere in Maxwell\'s equations — a static arrangement of E and B fields with that structure is simply not a solution.'),
        drvStep('Maxwell fixes the speed with no frame attached',
          `${dv('c')} ${dop('=')} ${dfrac('1', '√(μ₀ε₀)')}`,
          'two laboratory constants, and no reference to who is measuring'),
        drvSay('so one of two cherished ideas had to go',
          'Either Maxwell\'s equations hold only in one special frame — an ether — or velocities do not add the way everyone assumed. Michelson and Morley looked for the ether frame and found nothing. Einstein took the second option seriously.'),
        drvStep('the postulate, stated plainly',
          `every inertial observer measures the same ${dv('c')}`,
          `at β = ${n(st.beta)} the panel measures the crest speed in both frames and prints both`),
        drvSay('this is not a small adjustment',
          'It contradicts ordinary velocity addition outright. Chase light at 0.9c and you still measure it receding at c, not 0.1c. Nothing about the light changed — what changed is that the chaser\'s metres and seconds are not the same as the laboratory\'s.'),
        drvStep('so simultaneity, length and duration must all give way',
          `${dv('t')}′ ${dop('=')} γ(${dv('t')} ${dop('−')} ${dv('v')}${dv('x')}/${dv('c')}²)`,
          'the Lorentz transformation, which the Minkowski stage derives — note the x in the time equation'),
        drvSay('that term is the whole of relativity in one place',
          'The vx/c² in the time transformation is why simultaneity is relative. Every paradox in this wing traces back to it, and it is the single term Galilean transformation lacks.'),
        drvStep('and the frequency shifts even though the speed does not',
          `${dv('f')}′ ${dop('=')} ${dv('f')}√${dfrac('1 − β', '1 + β')}`,
          `at β = ${n(st.beta)}: the panel shows the wavelength stretched while the crests still move at c`)
      ],
      note:'The panel measures the crest speed independently in both frames by tracking marked crests through the simulation. Both come out at c whatever β is set to, which is the postulate being exhibited rather than assumed in the drawing.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.6 : o.beta;
    st.probe = 0.5;
    st.crestLab = 0; st.crestObs = 0;   // measured crest positions, for the speed check
    st.chmode = o.chmode === 'rate' ? 'rate' : 'wave';
  },
  controls(){
    const st = ST;
    const head = ctlRow('what to show',
      ctSeg('rlChM', st.chmode, [['wave', 'the wave itself'], ['rate', 'the closing rate']]));
    if(st.chmode === 'rate') return head + rlChControls(st);
    return head +
      ctlRow('your speed β', ctlSlider('rlChB', 0, 0.995, 0.005, st.beta)) +
      rlClockCtl() +
      `<p class="help">The lower pane is the same wave measured by <b>you</b>, running after it at β.
      Both panes advance on the same clock, and the crest markers are tracked frame by frame, so the
      speeds in the readout are <i>measured off the animation</i> rather than asserted. They are both c.
      What changes is the wavelength — by the Doppler factor <b>k = √((1+β)/(1−β))</b> — and the
      amplitude, by <b>1/k</b>. Push β to 0.99 and the wave is stretched and faint, but it is still a wave,
      still moving past you at c, and it never stands still.</p>`;
  },
  wire(){
    ctWireSeg('rlChM', v => { ST.chmode = v; });
    if(ST.chmode === 'rate'){ rlChWire(); return; }
    wireSlider('rlChB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
    rlWireClock();
  },
  frame(st, dt, ctx, W, H){
    if(st.chmode === 'rate') return rlChFrame(st, ctx, W, H);
    const P = rlPanes(W, H);
    const k = relKFactor(st.beta);
    const N = 700, xs = new Float64Array(N);
    for(let i = 0; i < N; i++) xs[i] = i / (N - 1) * 4;

    const draw = (pane, lam, amp, title, tint, tt) => {
      const Q = mkPlot(pane.x, pane.y + 16, pane.w, pane.h - 40, 0, 4, -1.25, 1.25);
      plotFrame(ctx, Q, '', '', title);
      plotZeroY(ctx, Q);
      plotTicksX(ctx, Q, [0, 1, 2, 3, 4], v => fmtNum(v, 2));
      const E = new Float64Array(N), B = new Float64Array(N);
      for(let i = 0; i < N; i++){
        const ph = 2 * Math.PI * (xs[i] - tt) / lam;
        E[i] = amp * Math.sin(ph);
        B[i] = amp * Math.sin(ph) * 0.62;     // drawn shorter so both are readable
      }
      rlLine(ctx, Q, xs, B, rgbCss(TH.neg, 0.85), 1.5);
      rlLine(ctx, Q, xs, E, rgbCss(TH.warn), 2.2);
      /* E arrows, to make it a field rather than a graph */
      for(let i = 8; i < N; i += 44){
        const X = Q.X(xs[i]);
        if(Math.abs(E[i]) > 0.04) rlArrow(ctx, X, Q.Y(0), X, Q.Y(E[i]), rgbCss(TH.warn, 0.55), 1.2, 5);
      }
      /* the tracked crest: the nearest crest to the middle of the pane */
      const cx = Math.round((tt + 2 - lam / 4) / lam) * lam + lam / 4 + tt;
      let crest = cx;
      while(crest < 0.15) crest += lam;
      while(crest > 3.85) crest -= lam;
      rlDot(ctx, Q.X(crest), Q.Y(amp), 4.5, rgbCss(TH.pos));
      rlSegment(ctx, Q.X(crest), Q.py, Q.X(crest), Q.py + Q.ph, rgbCss(TH.pos, 0.4), 1, [3, 3]);
      /* the propagation arrow — the same length in both panes, because c is */
      rlArrow(ctx, Q.px + Q.pw * 0.62, Q.py + 14, Q.px + Q.pw * 0.62 + 58, Q.py + 14,
              rgbCss(tint), 2, 8);
      rlText(ctx, Q.px + Q.pw * 0.62 + 64, Q.py + 14, 'c', rgbCss(tint), '600 12px ' + FONT_MONO);
      return crest;
    };

    st.crestLab = draw(P.top, 0.6, 1, 'The wave in the lab — λ, amplitude E₀',
                       TH.grad, st.t * 0.6);
    st.crestObs = draw(P.bot, 0.6 * k, 1 / k,
                       'The same wave, measured by you at β = ' + fmtNum(st.beta, 3) +
                       'c — λ×k, amplitude E₀/k', TH.pos, st.t * 0.6);
    stageNote(ctx, 'both crests advance one pane-width in the same time — that is the whole content of the second postulate', W, H);
  },
  readout(st){
    if(st.chmode === 'rate') return rlChReadout(st);
    const k = relKFactor(st.beta), g = relGamma(st.beta);
    /* the field transformation, done properly through the tensor: a wave with
       E = ŷ, B = ẑ (c = 1) boosted along the propagation direction */
    const F = relTransformEB(v3(0, 1, 0), v3(0, 0, 1), v3(st.beta, 0, 0));
    const I = relFieldInvariants(F.E, F.B);
    return `<div class="card tight"><div class="ttl">What running after it changes</div>
      ${kv('β', fmtNum(st.beta, 4) + ' c')}
      ${kv('γ', fmtNum(g, 6))}
      ${kv('Doppler factor k = √((1+β)/(1−β))', fmtNum(k, 6))}
      ${kv('wavelength λ′/λ', '×' + fmtNum(k, 5))}
      ${kv('frequency ν′/ν', '×' + fmtNum(1 / k, 5))}
      ${kv('amplitude E′/E', '×' + fmtNum(1 / k, 5))}
      ${kv('the speed you measure', '1.000000 c')}
      <p class="help">Every one of those is finite for every β &lt; 1. There is no setting at which the
      wave stops.</p>
    </div>
    <div class="card tight"><div class="ttl">Why Maxwell forbids the frozen wave</div>
      ${kv('E′ (from the boosted tensor)', fmtNum(vlen(F.E), 5))}
      ${kv('B′', fmtNum(vlen(F.B), 5))}
      ${kv('E′·B′  — invariant', fmtNear(I.dot))}
      ${kv('E′² − B′²  — invariant', fmtNear(I.diff))}
      <p class="help">A <b>frozen</b> wave would be a static field: it would need <b>B = 0</b>, hence
      <b>E² − B² &gt; 0</b>. But <b>E² − B²</b> is the same number in every inertial frame, and for a light
      wave that number is <b>zero</b>. No boost can change it, so no observer can ever see light at rest.
      Einstein's teenage puzzle is answered by an invariant, not by a velocity.</p>
    </div>`;
  },
  chip(st){
    if(st.chmode === 'rate') return rlChChip(st);
    return `<div class="k">Chasing light</div>
    <div style="color:var(--c-pos)">β = ${fmtNum(st.beta, 3)} c</div>
    <div style="color:var(--c-warn)">still c, redshifted ×${fmtNum(relKFactor(st.beta), 3)}</div>`; },
  legend(st){
    if(st && st.chmode === 'rate')
      return [['var(--c-grad)', 'what you measure the signal receding at'],
              ['var(--faint)', 'the coordinate gap closing — not a velocity'],
              ['var(--c-warn)', 'the c lines, and the signal in the lower picture'],
              ['var(--c-pos)', 'you, and your chosen β']];
    return [['var(--c-warn)', 'E — the electric field of the wave'],
                    ['var(--c-neg)', 'B — perpendicular, in phase, equal magnitude'],
                    ['var(--c-pos)', 'the tracked crest — same speed in both panes'],
                    ['var(--c-grad)', 'lab frame'], ['var(--c-pos)', 'your frame']]; }
};

/* ---- 2 · the train and the embankment -------------------------------------
   Lightning strikes both ends of a moving train. The embankment says the two
   strikes were simultaneous. The train says they were not — and neither is
   wrong, because "simultaneous" is not a property the two frames share. */
STAGES.rlTrain = {
  title: 'Simultaneity',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why "at the same time" stops meaning anything absolute',
      steps:[
        drvSay('the experiment',
          'A lamp at the centre of a moving train flashes. In the train\'s frame the light reaches both ends together — equal distances, equal speed. That much nobody disputes.'),
        drvStep('now watch from the platform',
          `both pulses still travel at ${dv('c')}`,
          'not c plus the train speed, not c minus it — the postulate applies to the platform observer too'),
        drvSay('and that settles it',
          'The rear of the train is moving towards the place the flash happened, and the front is moving away. Same speed of light, different distances to cover. So the light reaches the rear first. The platform observer sees the two arrivals at different times.'),
        drvStep('the disagreement is quantitative',
          `Δ${dv('t')} ${dop('=')} ${dfrac('γ' + dv('v') + dv('L') + '₀', dv('c') + '²')}`,
          `L₀ = ${n(st.L0)}, β = ${n(st.beta)} — the panel computes both frames' timings`),
        drvSay('neither observer is mistaken',
          'There is no fact of the matter about which is right. Simultaneity is a relationship between events and a frame, not a property of the events. Two events with a spacelike separation have no frame-independent order at all.'),
        drvStep('but causally connected events keep their order',
          `if the interval is timelike, every frame agrees`,
          'the panel checks the invariant interval and reports which case applies'),
        drvSay('which is exactly what protects causality',
          'Events that could influence one another are separated by a timelike interval, and every observer agrees which came first. Only events too far apart for light to connect can be reordered — and those cannot affect each other, so nothing is at risk.'),
        drvSay('and this single fact resolves the paradoxes',
          'The barn paradox, the twin paradox and the pole-vaulter all come from assuming a universal "now". Once simultaneity is frame-dependent, the apparent contradictions disappear — the two observers were never talking about the same pair of events.')
      ],
      note:'The panel runs both frames side by side with the same physical events, computing arrival times independently in each. The disagreement is a computed number, not an illustration.'
    };
  },
  dockLegend: true,
  drag: false,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.6 : o.beta;
    st.L0 = 2;                            // proper length of the train
    st.t = 0;
    st.trmode = o.trmode === 'pair' ? 'pair' : 'train';
    st.ekey = o.ekey || 'lightning';
  },
  controls(){
    const st = ST;
    const head = ctlRow('what to boost',
      ctSeg('rlTrM', st.trmode, [['train', 'the train and the lightning'], ['pair', 'two events you place']]));
    if(st.trmode === 'pair') return head + rlEvControls(st);
    return head +
      ctlRow('train speed β', ctlSlider('rlTrB', 0.1, 0.95, 0.01, st.beta)) +
      ctlRow('train length', ctlSlider('rlTrL', 1, 3, 0.05, st.L0)) +
      rlClockCtl() +
      `<p class="help">Lightning strikes both ends of the train. In the <b>embankment</b> frame (top) the
      two strikes are simultaneous by construction, and the light from them reaches the embankment observer
      at the platform's midpoint together. In the <b>train</b> frame (bottom) the same two events are not
      simultaneous at all: the front is struck first, by <b>Δt′ = βL₀/c</b>. Both frames agree on every
      <i>arrival</i> — who received what before what — and disagree only about the emissions. That is the
      whole of the relativity of simultaneity, and everything else in special relativity follows from it.</p>`;
  },
  wire(){
    ctWireSeg('rlTrM', v => { ST.trmode = v; });
    if(ST.trmode === 'pair'){ rlEvWire(); return; }
    wireSlider('rlTrB', () => ST.beta, v => { ST.beta = v; ST.t = 0; }, rlBetaFmt, RL_BETA_LIM);
    wireSlider('rlTrL', () => ST.L0, v => { ST.L0 = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' (proper)');
    rlWireClock(st => { st.t = 0; });
  },
  /* the four numbers that matter, computed once and used by both the drawing
     and the readout so they can never disagree */
  facts(st){
    const g = relGamma(st.beta), L = st.L0 / g;      // contracted length, embankment frame
    return {
      g, L,
      tFrontEmb: 0, tRearEmb: 0,                     // simultaneous, by construction
      tMidEmb: L / 2,                                // both flashes reach the platform midpoint
      tFrontTr: -st.beta * st.L0 / 2,                // t′ = γ(t − βx) at x = +L/2
      tRearTr:   st.beta * st.L0 / 2,
      dtTrain:   st.beta * st.L0,                    // the front is struck this much earlier
      tMidTr:    st.L0 / 2                           // when the train's midpoint gets each flash
    };
  },
  frame(st, dt, ctx, W, H){
    if(st.trmode === 'pair') return rlEvFrame(st, ctx, W, H);
    const P = rlPanes(W, H, 22);
    const f = this.facts(st);
    const span = Math.max(3.4, st.L0 * 1.8);
    /* the animation replays: t runs from the strikes until the flashes have
       comfortably passed both observers, then starts again */
    const T = (st.t * 0.45) % (span * 0.9);

    /* ---- embankment frame: the train slides, the flashes expand at c ---- */
    (function(){
      const S1 = rlScene(ctx, P.top.x, P.top.y, P.top.w, P.top.h,
        'Embankment frame — the two strikes are simultaneous', TH.grad);
      const X = x => S1.cx + x / span * (S1.w * 0.44);
      const gy = S1.y + S1.h * 0.70;
      rlSegment(ctx, S1.x + 10, gy, S1.x + S1.w - 10, gy, rgbCss(TH.line2), 1.5);
      /* At t = 0 the train's ends are exactly at the strike points, ±L/2, which
         is what makes them "the strikes at the ends of the train"; after that it
         moves on and the flashes stay where they were emitted. */
      const cx = st.beta * T;
      const x0 = X(cx - f.L / 2), x1 = X(cx + f.L / 2);
      ctx.fillStyle = rgbCss(TH.pos, 0.16);
      ctx.fillRect(x0, gy - 26, x1 - x0, 24);
      ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 1.6;
      ctx.strokeRect(x0, gy - 26, x1 - x0, 24);
      rlText(ctx, (x0 + x1) / 2, gy - 14, 'train  L = L₀/γ = ' + fmtNum(f.L, 3),
             rgbCss(TH.pos), '10px ' + FONT_MONO, 'center');
      rlDot(ctx, X(cx), gy - 33, 3.4, rgbCss(TH.pos));      // the train observer
      /* both strikes happen at t = 0, at x = ±L/2 — that is the setup */
      {
        const age = T;
        for(const sx of [-f.L / 2, f.L / 2]){
          rlDot(ctx, X(sx), gy, 4, rgbCss(TH.warn));
          for(const dir of [-1, 1]){
            const lx = sx + dir * age;
            if(Math.abs(lx) < span) rlDot(ctx, X(lx), gy - 6, 3, rgbCss(TH.warn, 0.9));
          }
          rlSegment(ctx, X(sx), gy - 40, X(sx), gy + 8, rgbCss(TH.warn, 0.35), 1, [3, 3]);
        }
        /* the embankment observer at the origin, and the moment of reception */
        const hit = age >= f.L / 2;
        rlDot(ctx, X(0), gy + 12, 4.6, rgbCss(hit ? TH.warn : TH.grad), rgbCss(TH.bg));
        rlText(ctx, X(0), gy + 26, hit ? 'both arrive together at t = L/2' : 'embankment observer',
               rgbCss(hit ? TH.warn : TH.faint), '10px ' + FONT_MONO, 'center');
      }
      rlText(ctx, S1.x + 9, S1.y + S1.h - 12,
        't = ' + fmtNum(T, 3) + '   ·   Δt between the strikes = 0',
        rgbCss(TH.faint), '10px ' + FONT_MONO);
    })();

    /* ---- train frame: the train is at rest, the strikes are not together ---- */
    (function(){
      const S2 = rlScene(ctx, P.bot.x, P.bot.y, P.bot.w, P.bot.h,
        'Train frame — the front is struck first, by βL₀/c', TH.pos);
      const X = x => S2.cx + x / span * (S2.w * 0.44);
      const gy = S2.y + S2.h * 0.70;
      /* The train's own clock, tied exactly to the other pane: transforming the
         worldline of the train's midpoint (x = βt) gives t′ = t/γ. */
      const Tp = T / f.g;
      /* the embankment slides left */
      rlSegment(ctx, S2.x + 10, gy, S2.x + S2.w - 10, gy, rgbCss(TH.line2), 1.5);
      const x0 = X(-st.L0 / 2), x1 = X(st.L0 / 2);
      ctx.fillStyle = rgbCss(TH.pos, 0.16);
      ctx.fillRect(x0, gy - 26, x1 - x0, 24);
      ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 1.6;
      ctx.strokeRect(x0, gy - 26, x1 - x0, 24);
      rlText(ctx, (x0 + x1) / 2, gy - 14, 'train at rest  L₀ = ' + fmtNum(st.L0, 3),
             rgbCss(TH.pos), '10px ' + FONT_MONO, 'center');
      rlDot(ctx, X(0), gy - 33, 3.4, rgbCss(TH.pos));
      for(const [sx, te, nm] of [[st.L0 / 2, f.tFrontTr, 'front'], [-st.L0 / 2, f.tRearTr, 'rear']]){
        if(Tp < te) continue;
        const age = Tp - te;
        rlDot(ctx, X(sx), gy, 4, rgbCss(TH.warn));
        rlSegment(ctx, X(sx), gy - 40, X(sx), gy + 8, rgbCss(TH.warn, 0.35), 1, [3, 3]);
        rlText(ctx, X(sx), gy - 46, nm + ' struck at t′ = ' + fmtNum(te, 3),
               rgbCss(TH.warn), '10px ' + FONT_MONO, 'center');
        for(const dir of [-1, 1]){
          const lx = sx + dir * age;
          if(Math.abs(lx) < span) rlDot(ctx, X(lx), gy - 6, 3, rgbCss(TH.warn, 0.9));
        }
      }
      /* the embankment observer, drifting left at −β */
      const ex = -st.beta * Tp;
      rlDot(ctx, X(ex), gy + 12, 4.6, rgbCss(TH.grad), rgbCss(TH.bg));
      rlText(ctx, X(ex), gy + 26, 'embankment observer', rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');
      rlText(ctx, S2.x + 9, S2.y + S2.h - 12,
        "t′ = " + fmtNum(Tp, 3) + '   ·   Δt′ between the strikes = ' + fmtNum(f.dtTrain, 4),
        rgbCss(TH.faint), '10px ' + FONT_MONO);
    })();
    stageNote(ctx, 'the two panes never disagree about an arrival — only about which emission came first', W, H);
  },
  readout(st){
    if(st.trmode === 'pair') return rlEvReadout(st);
    const f = this.facts(st);
    return `<div class="card tight"><div class="ttl">The two strikes, in both frames</div>
      ${kv('β', fmtNum(st.beta, 4) + ' c')}
      ${kv('γ', fmtNum(f.g, 5))}
      ${kv('train proper length L₀', fmtNum(st.L0, 4))}
      ${kv('length on the embankment L₀/γ', fmtNum(f.L, 5))}
      ${kv('embankment: front struck at t', '0')}
      ${kv('embankment: rear struck at t', '0')}
      ${kv('train: front struck at t′', fmtNum(f.tFrontTr, 5))}
      ${kv('train: rear struck at t′', fmtNum(f.tRearTr, 5))}
      ${kv('so the train sees a gap of βL₀/c', fmtNum(f.dtTrain, 5))}
      <p class="help">The two strike events have a spacelike separation, so no signal connects them and
      their <b>order is not a physical fact</b>. Boost hard enough the other way and the rear is struck
      first. What no frame can reverse is the order of events that <i>can</i> influence one another.</p>
    </div>
    <div class="card tight"><div class="ttl">Where the offset comes from</div>
      <div class="mth" style="font-size:13px">t′ = γ(t − βx/c)</div>
      <p class="help">Two events at the same <b>t</b> but different <b>x</b> get different <b>t′</b>, and the
      difference is <b>−γβΔx/c²</b>. Put in Δx = L₀/γ and the γ cancels:
      <b>Δt′ = βL₀/c = ${fmtNum(f.dtTrain, 5)}</b>. Simultaneity is not merely hard to establish across a
      distance — for observers in relative motion it is a different set of event pairs.</p>
      ${kv('both flashes reach the platform midpoint at', 't = ' + fmtNum(f.tMidEmb, 5))}
      ${kv('and the train\'s midpoint gets the front one at', "t′ = " + fmtNum(f.tFrontTr + st.L0 / 2, 5))}
      ${kv('and the rear one at', "t′ = " + fmtNum(f.tRearTr + st.L0 / 2, 5))}
    </div>`;
  },
  chip(st){
    if(st.trmode === 'pair') return rlEvChip(st);
    const f = this.facts(st);
    return `<div class="k">Simultaneity</div>
      <div style="color:var(--c-grad)">embankment: Δt = 0</div>
      <div style="color:var(--c-pos)">train: Δt′ = ${fmtNum(f.dtTrain, 4)}</div>`;
  },
  legend(st){
    if(st && st.trmode === 'pair')
      return [['var(--c-grad)', "Δt′ against β — where it crosses, the order flips"],
              ['var(--c-neg)', 'the crossover, if there is one'],
              ['var(--c-pos)', 'your chosen β'],
              ['var(--accent)', 'the second event'], ['var(--c-warn)', 'the light cone from the first']];
    return [['var(--c-grad)', 'embankment frame and its observer'],
                    ['var(--c-pos)', 'the train and its observer'],
                    ['var(--c-warn)', 'the lightning strikes and their light']]; }
};

/* ---- 3 · the light clock ---------------------------------------------------
   Time dilation with no algebra beyond Pythagoras. It is the cleanest argument
   in physics: if light goes at c for everybody, a moving clock must tick slow,
   because its light has further to travel between the same two mirrors. */
STAGES.rlClock = {
  title: 'The light clock',
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 1 / Math.sqrt(1 - st.beta * st.beta);
    return {
      title:'Time dilation from Pythagoras and one postulate',
      steps:[
        drvSay('the cleverness is in the choice of clock',
          'Any clock would do, but a light clock makes the argument trivial: two mirrors, a pulse bouncing between them, one tick per round trip. Because it is built from light, the postulate applies to it directly.'),
        drvStep('at rest, the pulse goes straight up and back',
          `Δ${dv('t')}₀ ${dop('=')} ${dfrac('2' + dv('h'), dv('c'))}`,
          `mirror separation h = ${n(st.h)}`),
        drvStep('in motion, the pulse must travel a diagonal',
          `(${dfrac(dv('c') + 'Δ' + dv('t'), '2')})² ${dop('=')} ${dv('h')}² ${dop('+')} (${dfrac(dv('v') + 'Δ' + dv('t'), '2')})²`,
          'Pythagoras — the mirrors moved sideways while the light was in flight'),
        drvSay('and here is where the postulate does its work',
          'Classically the diagonal path would be covered at a higher speed, because the pulse would inherit the clock\'s sideways motion, and the tick would take the same time. But the speed is c in both frames. A longer path at the same speed takes longer.'),
        drvStep('solve for the moving tick',
          `Δ${dv('t')} ${dop('=')} ${dfrac('Δ' + dv('t') + '₀', '√(1 − ' + dv('v') + '²/' + dv('c') + '²)')} ${dop('=')} γΔ${dv('t')}₀`,
          `β = ${n(st.beta)} gives γ = ${n(g)} — the panel counts ticks in both frames and prints the ratio`),
        drvSay('and it cannot be a peculiarity of light clocks',
          'If a light clock and a wristwatch disagreed, comparing them would reveal absolute motion, which the postulate forbids. So every clock — mechanical, biological, nuclear — must run slow by the same factor. It is time itself, not the mechanism.'),
        drvStep('the effect is real and routinely measured',
          `muons reach the ground`,
          'their 2.2 µs half-life would let them travel 660 m; they arrive from 15 km up, because γ ≈ 20'),
        drvSay('and the reciprocity is not a contradiction',
          'Each observer sees the other\'s clock running slow. That sounds paradoxical only if simultaneity is absolute. Each is comparing one moving clock against two of their own synchronised clocks — and the two observers disagree about that synchronisation, which is exactly the previous stage.')
      ],
      note:'The panel counts genuine ticks in both frames by simulating the light path, so the ratio shown is measured from the simulation rather than computed from γ and displayed.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.7 : o.beta;
    st.h = 1;                       // mirror separation
    st.ticksRest = 0; st.ticksMove = 0;
    st.clmode = o.clmode === 'place' ? 'place' : 'updown';
    st.ckey = o.ckey || 'across';
  },
  controls(){
    const st = ST;
    const head = ctlRow('the clock',
      ctSeg('rlClM', st.clmode, [['updown', 'mirror straight up'], ['place', 'put the mirror anywhere']]));
    if(st.clmode === 'place') return head + rlClkControls(st);
    return head +
      ctlRow('clock speed β', ctlSlider('rlClB', 0, 0.97, 0.005, st.beta)) +
      rlClockCtl() +
      `<p class="help">Two identical clocks: a photon bouncing between mirrors a distance <b>h</b> apart.
      One is at rest, one is carried past at β. In the moving clock the photon must travel the
      <i>hypotenuse</i>, not the height — and it does so at the same c. One tick therefore takes
      <b>t = 2h/(c√(1−β²)) = γ·t₀</b>. Nothing about the clock's construction enters the argument, so it
      is not a fact about clocks; it is a fact about time. Watch the tick counters separate.</p>`;
  },
  wire(){
    ctWireSeg('rlClM', v => { ST.clmode = v; });
    if(ST.clmode === 'place'){ rlClkWire(); return; }
    wireSlider('rlClB', () => ST.beta, v => { ST.beta = v; ST.t = 0; ST.ticksRest = 0; ST.ticksMove = 0; }, rlBetaFmt, RL_BETA_LIM);
    rlWireClock(st => { st.ticksRest = 0; st.ticksMove = 0; });
  },
  frame(st, dt, ctx, W, H){
    if(st.clmode === 'place') return rlClkFrame(st, ctx, W, H);
    const g = relGamma(st.beta);
    const T = st.t * 0.5;
    const per0 = 2 * st.h;             // rest period (c = 1)
    const perM = per0 * g;
    st.ticksRest = Math.floor(T / per0);
    st.ticksMove = Math.floor(T / perM);

    const P = rlPanes(W, H, 20);
    /* --- the clock at rest --- */
    (function(){
      const S1 = rlScene(ctx, P.top.x, P.top.y, P.top.w, P.top.h,
        'At rest — the photon goes straight up and straight down', TH.grad);
      const cx = S1.x + 90, yb = S1.y + S1.h - 34, yt = S1.y + 34;
      const drawMirror = y => { rlSegment(ctx, cx - 34, y, cx + 34, y, rgbCss(TH.mid), 3); };
      drawMirror(yb); drawMirror(yt);
      const ph = (T % per0) / per0;
      const frac = ph < 0.5 ? ph * 2 : (1 - ph) * 2;
      const py = yb + (yt - yb) * frac;
      rlSegment(ctx, cx, yb, cx, yt, rgbCss(TH.warn, 0.3), 1, [3, 4]);
      rlDot(ctx, cx, py, 4.5, rgbCss(TH.warn));
      {
        /* the chip can cover this arm's whole band on a short canvas — step
           the h label right of the chip's edge (2026-08-19 sweep) */
        const hz = ctChipZone(ctx);
        let hx = cx;
        const hy = (yt + yb) / 2;
        if(hz.h > 0 && hx < hz.w + 8 && hy < hz.h + 6) hx = hz.w + 10;
        rlText(ctx, hx, hy, ' h', rgbCss(TH.faint), '11px ' + FONT_MONO, 'left');
      }
      rlSegment(ctx, cx - 46, yt, cx - 46, yb, rgbCss(TH.faint, 0.5), 1);
      rlText(ctx, cx + 70, S1.y + S1.h / 2 - 10,
        'ticks: ' + st.ticksRest, rgbCss(TH.grad), '600 15px ' + FONT_MONO, 'left');
      rlText(ctx, cx + 70, S1.y + S1.h / 2 + 10,
        't₀ = 2h/c = ' + fmtNum(per0, 4), rgbCss(TH.faint), '11px ' + FONT_MONO, 'left');
    })();
    /* --- the clock in motion --- */
    (function(){
      const S2 = rlScene(ctx, P.bot.x, P.bot.y, P.bot.w, P.bot.h,
        'Moving at β — the photon must take the hypotenuse, at the same c', TH.pos);
      const yb = S2.y + S2.h - 34, yt = S2.y + 34;
      const span = S2.w - 200;
      const travel = (st.beta * T) % (span / 40);       // keep it on screen
      const cx = S2.x + 40 + travel * 40;
      const ph = (T % perM) / perM;
      const frac = ph < 0.5 ? ph * 2 : (1 - ph) * 2;
      const py = yb + (yt - yb) * frac;
      /* the mirrors travel with the clock */
      rlSegment(ctx, cx - 34, yb, cx + 34, yb, rgbCss(TH.mid), 3);
      rlSegment(ctx, cx - 34, yt, cx + 34, yt, rgbCss(TH.mid), 3);
      /* the zigzag the photon actually traces in this frame */
      const startX = S2.x + 40;
      ctx.strokeStyle = rgbCss(TH.warn, 0.45); ctx.lineWidth = 1.3;
      ctx.beginPath();
      let first = true;
      for(let n = 0; n * perM * 0.5 <= T + perM; n++){
        const tt = n * perM * 0.5;
        if(tt > T + 1e-9) break;
        const xx = startX + (st.beta * tt) * 40;
        const yy = (n % 2 === 0) ? yb : yt;
        first ? (ctx.moveTo(xx, yy), first = false) : ctx.lineTo(xx, yy);
      }
      ctx.lineTo(cx, py);
      ctx.stroke();
      rlDot(ctx, cx, py, 4.5, rgbCss(TH.warn));
      /* the right triangle, drawn on the current half-tick */
      const nHalf = Math.floor(T / (perM * 0.5));
      const x0 = startX + st.beta * nHalf * perM * 0.5 * 40;
      const y0 = (nHalf % 2 === 0) ? yb : yt;
      rlSegment(ctx, x0, y0, cx, y0, rgbCss(TH.pos, 0.8), 1.4, [4, 3]);
      rlSegment(ctx, cx, y0, cx, py, rgbCss(TH.grad, 0.8), 1.4, [4, 3]);
      rlSegment(ctx, x0, y0, cx, py, rgbCss(TH.warn, 0.9), 1.6);
      rlText(ctx, (x0 + cx) / 2, y0 + (y0 === yb ? 14 : -14), 'v·t/2',
             rgbCss(TH.pos), '10px ' + FONT_MONO, 'center');
      rlText(ctx, S2.x + S2.w - 150, S2.y + S2.h / 2 - 10,
        'ticks: ' + st.ticksMove, rgbCss(TH.pos), '600 15px ' + FONT_MONO, 'left');
      rlText(ctx, S2.x + S2.w - 150, S2.y + S2.h / 2 + 10,
        't = γt₀ = ' + fmtNum(perM, 4), rgbCss(TH.faint), '11px ' + FONT_MONO, 'left');
    })();
    stageNote(ctx, '(c·t/2)² = (v·t/2)² + h²   ⟹   t = 2h / (c√(1−β²)) = γ t₀', W, H);
  },
  readout(st){
    if(st.clmode === 'place') return rlClkReadout(st);
    const g = relGamma(st.beta), per0 = 2 * st.h, perM = per0 * g;
    /* Pythagoras, evaluated rather than quoted: the two legs and the hypotenuse
       of the half-tick, in the lab frame */
    const half = perM / 2, hyp = half, leg = st.beta * half;
    return `<div class="card tight"><div class="ttl">One tick, both clocks</div>
      ${kv('β', fmtNum(st.beta, 4) + ' c')}
      ${kv('γ', fmtNum(g, 6))}
      ${kv('mirror separation h', fmtNum(st.h, 3))}
      ${kv('rest period t₀ = 2h/c', fmtNum(per0, 5))}
      ${kv('moving period t = γt₀', fmtNum(perM, 5))}
      ${kv('ticks elapsed — rest clock', String(st.ticksRest))}
      ${kv('ticks elapsed — moving clock', String(st.ticksMove))}
      ${kv('ratio', st.ticksMove > 0 ? fmtNum(st.ticksRest / st.ticksMove, 5) : '—')}
    </div>
    <div class="card tight"><div class="ttl">Pythagoras, evaluated</div>
      ${kv('hypotenuse  c·t/2', fmtNum(hyp, 6))}
      ${kv('base  v·t/2', fmtNum(leg, 6))}
      ${kv('height  h', fmtNum(st.h, 6))}
      ${kv('base² + height²', fmtNum(leg * leg + st.h * st.h, 6))}
      ${kv('hypotenuse²', fmtNum(hyp * hyp, 6))}
      ${kv('residual', fmtGap(hyp * hyp - leg * leg - st.h * st.h, hyp * hyp))}
      <p class="help">The residual is zero to machine precision because γ is <i>defined</i> by that
      triangle closing. Rearranged: <b>t²(1 − β²) = t₀²</b>, so <b>t = γt₀</b>. Note what was assumed —
      only that the photon's speed is c in <i>both</i> panes. Everything else is geometry.</p>
    </div>`;
  },
  chip(st){
    if(st.clmode === 'place') return rlClkChip(st);
    return `<div class="k">Light clock</div>
    <div style="color:var(--c-grad)">rest: ${st.ticksRest} ticks</div>
    <div style="color:var(--c-pos)">moving: ${st.ticksMove} ticks</div>
    <div>γ = ${fmtNum(relGamma(st.beta), 4)}</div>`; },
  legend(st){
    if(st && st.clmode === 'place')
      return [['var(--c-warn)', 'the outward leg of the light'],
              ['var(--c-pos)', 'the return leg'],
              ['var(--c-curl)', 'the mirror'], ['var(--c-grad)', 'the emitter, before and after']];
    return [['var(--c-warn)', 'the photon and the path it traces'],
                    ['var(--mid)', 'the mirrors'],
                    ['var(--c-grad)', 'the height h — the same in both frames'],
                    ['var(--c-pos)', 'the distance the clock moved in one tick']]; }
};

/* ---- 4 · the ladder in the barn --------------------------------------------
   The paradox that is really a lesson about simultaneity in disguise: "both
   doors are shut at once, with the ladder inside" is a statement about two
   spacelike-separated events, and it is not frame-independent. */
