/* ============================================================================
   
4qa - RELATIVITY: CONTRACTION, EQUIVALENCE AND ROTATION
   Split out of 
66b-stages-rel-thought.js
 to keep each file under the ~600-line guidance
   in src/js/CLAUDE.md. Load order is unchanged: this file sorts immediately
   after its parent, and everything shares one script scope.
   ============================================================================ */

STAGES.rlBarn = {
  title: 'Length contraction',
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 1 / Math.sqrt(1 - st.beta * st.beta);
    return {
      title:'A ladder that fits in a barn it is longer than',
      steps:[
        drvStep('lengths contract along the direction of motion',
          `${dv('L')} ${dop('=')} ${dfrac(dv('L') + '₀', 'γ')}`,
          `L₀ = ${n(st.L0)}, barn ${n(st.D)}, γ = ${n(g)} gives a contracted ladder of ${n(st.L0 / g)}`),
        drvSay('measuring a moving length already assumes simultaneity',
          'To measure something moving you must locate both ends at the same instant. But "the same instant" is frame-dependent, so the measurement is too. Length contraction is not a force squeezing the object — it is a consequence of which pair of events counts as marking the ends.'),
        drvStep('in the barn frame, the ladder fits',
          `${dfrac(dv('L') + '₀', 'γ')} ${dop('<')} ${dv('D')}`,
          st.L0 / g < st.D ? 'both doors can be shut simultaneously with the ladder inside' : 'not at this speed — raise β'),
        drvStep('but in the ladder frame, the barn is the short one',
          `${dfrac(dv('D'), 'γ')} ${dop('<')} ${dv('L')}₀`,
          `barn contracted to ${n(st.D / g)} — the ladder cannot possibly fit`),
        drvSay('and that is the paradox, stated fairly',
          'Both observers are applying the same rule correctly and reaching opposite conclusions. Either the doors were both shut with the ladder inside, or they were not — this seems like a fact that cannot be frame-dependent.'),
        drvStep('the resolution is that "both shut" is not one event',
          `Δ${dv('t')}′ ${dop('=')} γ${dv('v')}${dv('L')}/${dv('c')}²`,
          'the panel shows the door closings in both frames, with the timings'),
        drvSay('the two closings are simultaneous in one frame and not in the other',
          'In the barn frame the doors shut together. In the ladder frame the far door shuts and reopens before the near one shuts — so the ladder is never enclosed. Nothing physical disagrees: no door ever hits the ladder in either account. The disagreement was about simultaneity all along.'),
        drvSay('and if the doors did stay shut, the ladder would have to compress',
          'Trap it and the far end must stop before the near end learns about it, because no signal outruns light. The ladder would be crushed by its own rigidity failing. Perfectly rigid bodies are impossible in relativity, for exactly this reason.')
      ],
      note:'The panel draws both frames with the same physical door events and computes the timings independently in each, so the resolution is visible as two consistent accounts rather than a verbal argument.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.8 : o.beta;
    st.L0 = 2.4;                 // ladder proper length
    st.D  = 1.8;                 // barn proper length
  },
  controls(){
    const st = ST;
    return ctlRow('ladder β', ctlSlider('rlBaB', 0.2, 0.97, 0.005, st.beta)) +
      ctlRow('ladder L₀', ctlSlider('rlBaL', 1, 4, 0.05, st.L0)) +
      ctlRow('barn D', ctlSlider('rlBaD', 1, 4, 0.05, st.D)) +
      rlClockCtl() +
      `<p class="help">A ladder longer than the barn is run through it fast enough that the barn frame
      measures it as <b>shorter</b> than the barn — so both doors can be shut, briefly, with the ladder
      inside. In the ladder's own frame the <b>barn</b> is the contracted one and the ladder never fits.
      Both are right. The two door-closings are spacelike separated, so their simultaneity is frame-
      dependent: the barn shuts them together, the ladder sees the far door shut and reopen before the
      near one shuts at all. No door ever touches the ladder in either account.</p>`;
  },
  wire(){
    wireSlider('rlBaB', () => ST.beta, v => { ST.beta = v; ST.t = 0; }, rlBetaFmt, RL_BETA_LIM);
    wireSlider('rlBaL', () => ST.L0, v => { ST.L0 = v; ST.t = 0; }, v => fmtNum(+v, 3));
    wireSlider('rlBaD', () => ST.D, v => { ST.D = v; ST.t = 0; }, v => fmtNum(+v, 3));
    rlWireClock(st => { st.t = 0; });
  },
  facts(st){
    const g = relGamma(st.beta);
    return {
      g, Lseen: st.L0 / g, Dseen: st.D / g,
      fits: st.L0 / g < st.D,
      /* Both doors shut at t = 0 in the barn frame, at x = 0 and x = D. Applying
         t′ = γ(t − βx) to those two events puts the far door's closing at
         t′ = −γβD and the near door's at t′ = 0: the far one shuts first, and
         has reopened before the near one moves. */
      dtLadder: st.beta * st.D * g,
      slack: st.D - st.L0 / g,                       // spare barn, in the barn frame
      window: (st.D - st.L0 / g) / Math.max(1e-6, st.beta)   // and how long it lasts
    };
  },
  frame(st, dt, ctx, W, H){
    const f = this.facts(st);
    const P = rlPanes(W, H, 22);
    const span = Math.max(st.L0, st.D) * 3.2;
    /* One clock drives both panes. In the barn frame t runs over a loop centred
       on t = 0, the moment both doors are shut; the ladder frame's clock follows
       from transforming the worldline of the ladder's midpoint, which gives
       t′ = t/γ − γβD/2. Nothing here is fudged to line the two panes up. */
    const Tspan = Math.max(2.2, (st.D + st.L0) / Math.max(0.15, st.beta));
    const T = ((st.t * 0.45) % Tspan) - Tspan / 2;
    const Tp = T / f.g - f.dtLadder / 2;

    /* a scene drawn in world coordinates, with the barn wherever it happens to be */
    const scene = (pane, title, tint, barnX0, barnLen, ladX0, ladLen, doorShut, mid) => {
      const S1 = rlScene(ctx, pane.x, pane.y, pane.w, pane.h, title, tint);
      const X = x => S1.cx + (x - mid) / span * (S1.w * 0.9);
      const gy = S1.y + S1.h * 0.64;
      rlSegment(ctx, S1.x + 8, gy, S1.x + S1.w - 8, gy, rgbCss(TH.line2), 1.2);
      ctx.fillStyle = rgbCss(TH.grad, 0.10);
      ctx.fillRect(X(barnX0), gy - 46, X(barnX0 + barnLen) - X(barnX0), 46);
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 1.6;
      ctx.strokeRect(X(barnX0), gy - 46, X(barnX0 + barnLen) - X(barnX0), 46);
      rlText(ctx, X(barnX0 + barnLen / 2), gy - 56, 'barn  ' + fmtNum(barnLen, 4),
             rgbCss(TH.grad), '10px ' + FONT_MONO, 'center');
      for(let i = 0; i < 2; i++){
        const dx = X(barnX0 + i * barnLen), shut = doorShut[i];
        rlSegment(ctx, dx, gy - 46, dx, gy + (shut ? 0 : -32),
                  rgbCss(shut ? TH.warn : TH.faint), shut ? 4 : 2);
        rlText(ctx, dx, gy + 15, shut ? 'SHUT' : 'open',
               rgbCss(shut ? TH.warn : TH.faint), '9.5px ' + FONT_MONO, 'center');
      }
      ctx.fillStyle = rgbCss(TH.pos, 0.22);
      ctx.fillRect(X(ladX0), gy - 31, X(ladX0 + ladLen) - X(ladX0), 16);
      ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 1.6;
      ctx.strokeRect(X(ladX0), gy - 31, X(ladX0 + ladLen) - X(ladX0), 16);
      rlText(ctx, X(ladX0 + ladLen / 2), gy - 23, 'ladder  ' + fmtNum(ladLen, 4),
             rgbCss(TH.pos), '10px ' + FONT_MONO, 'center');
      return { S1, gy };
    };

    /* --- barn frame: barn fixed at [0, D], ladder contracted, moving right --- */
    const shutBarn = f.fits && Math.abs(T) < f.window / 2;
    const A = scene(P.top,
      'Barn frame — the ladder is contracted to L₀/γ' +
        (f.fits ? ', and it fits' : ', and it still does not fit'),
      TH.grad, 0, st.D, st.D / 2 + st.beta * T - f.Lseen / 2, f.Lseen,
      [shutBarn, shutBarn], st.D / 2);
    rlText(ctx, A.S1.cx, A.S1.y + A.S1.h - 13,
      't = ' + fmtNum(T, 3) + '   ·   L₀/γ = ' + fmtNum(f.Lseen, 4) + '  vs  D = ' + fmtNum(st.D, 4) +
      (f.fits ? '   →  fits, and both doors can shut at once' : '   →  does not fit'),
      rgbCss(f.fits ? TH.grad : TH.pos), '10px ' + FONT_MONO, 'center');

    /* --- ladder frame: ladder fixed at γD/2, barn contracted, moving left ---
       Transforming the barn's two door worldlines gives near door at x′ = −βt′
       and far door at x′ = D/γ − βt′, so the barn keeps its contracted length
       and drifts backwards, exactly as it must. */
    const barnX0p = -st.beta * Tp;
    const B = scene(P.bot,
      'Ladder frame — the barn is the contracted one, and the doors shut at different times',
      TH.pos, barnX0p, f.Dseen, f.g * st.D / 2 - st.L0 / 2, st.L0,
      [Math.abs(Tp) < 0.12 * Tspan / 4, Math.abs(Tp + f.dtLadder) < 0.12 * Tspan / 4],
      f.g * st.D / 2);
    rlText(ctx, B.S1.cx, B.S1.y + B.S1.h - 13,
      "t′ = " + fmtNum(Tp, 3) + '   ·   D/γ = ' + fmtNum(f.Dseen, 4) + '  vs  L₀ = ' + fmtNum(st.L0, 4) +
      "   ·   the two doors shut Δt′ = " + fmtNum(f.dtLadder, 4) + ' apart',
      rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');
    stageNote(ctx, 'both accounts describe the same events — they disagree only about which happened first', W, H);
  },
  readout(st){
    const f = this.facts(st);
    return `<div class="card tight"><div class="ttl">Who is short, and by how much</div>
      ${kv('β', fmtNum(st.beta, 4) + ' c')}
      ${kv('γ', fmtNum(f.g, 6))}
      ${kv('ladder proper length L₀', fmtNum(st.L0, 4))}
      ${kv('barn proper length D', fmtNum(st.D, 4))}
      ${kv('ladder, measured in the barn frame', fmtNum(f.Lseen, 5))}
      ${kv('barn, measured in the ladder frame', fmtNum(f.Dseen, 5))}
      ${kv('does it fit, in the barn frame?', f.fits ? 'yes' : 'no')}
      ${kv('does it fit, in the ladder frame?', st.L0 < f.Dseen ? 'yes' : 'no')}
      <p class="help">Contraction is <b>not</b> reciprocal-and-contradictory; it is reciprocal <i>because</i>
      "the length of a moving object" means "the distance between where its two ends are <b>at the same
      time</b>" — and the two frames use different sets of "at the same time".</p>
    </div>
    <div class="card tight"><div class="ttl">The paradox, dissolved</div>
      ${kv('barn frame: both doors shut at', 't = 0')}
      ${kv('  near door at x = 0, far door at x = D', '')}
      ${kv("ladder frame: far door shuts at", "t′ = γ(0 − βD) = " + fmtNum(-f.dtLadder, 5))}
      ${kv('ladder frame: near door shuts at', "t′ = γ(0 − 0) = 0")}
      ${kv('gap between them, Δt′ = γβD/c', fmtNum(f.dtLadder, 5))}
      ${kv('time for the ladder to clear the barn', fmtNum((st.L0 + f.Dseen) / st.beta, 5))}
      ${kv('interval² between the door events', fmtNear(relInterval(0, st.D)))}
      ${kv('so they are', relIntervalKind(relInterval(0, st.D)))}
      <p class="help">Spacelike-separated events have no invariant order: there is a frame for each
      possible answer, and no signal can run between them to settle it. "The ladder was entirely inside
      with both doors shut" is therefore not a fact about the world — it is a fact about a frame. The
      invariant facts (nothing was hit, the ladder emerged intact) are agreed by everyone.</p>
    </div>`;
  },
  chip(st){
    const f = this.facts(st);
    return `<div class="k">Ladder & barn</div>
      <div style="color:var(--c-grad)">barn sees L = ${fmtNum(f.Lseen, 3)}</div>
      <div style="color:var(--c-pos)">ladder sees D = ${fmtNum(f.Dseen, 3)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the barn'], ['var(--c-pos)', 'the ladder'],
                    ['var(--c-warn)', 'a door, shut']]; }
};

/* ---- 5 · the elevator ------------------------------------------------------
   The happiest thought of Einstein's life: a man falling off a roof feels no
   gravity. Promote that to a principle and gravity stops being a force and
   becomes the geometry the falling man is moving straight through. */
STAGES.rlElevator = {
  title: 'The equivalence principle',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'The idea that turned gravity into geometry',
      steps:[
        drvSay('Einstein called it the happiest thought of his life',
          'A person falling freely feels no weight. Inside a windowless box there is no experiment that distinguishes free fall from floating in deep space — nor uniform acceleration from standing on a planet. Gravity can be created and destroyed by choosing how you move.'),
        drvStep('the principle',
          `uniform acceleration ${dop('≡')} a uniform gravitational field`,
          st.mode === 'accel' ? 'the box is accelerating here — locally indistinguishable from gravity' : ''),
        drvSay('it rests on a fact that had been an unexplained coincidence',
          'Inertial mass resists acceleration; gravitational mass feels gravity. Nothing in Newton requires them to be equal, yet they are — now tested to about one part in 10¹⁵. Einstein made that equality the foundation rather than an accident.'),
        drvStep('now send light across the accelerating box',
          `the far wall moves up while the light crosses`,
          'so the beam arrives lower than it left — it appears to bend'),
        drvSay('and by the principle, gravity must bend light too',
          'If the two situations are indistinguishable, anything happening in one happens in the other. Light must fall. That prediction was confirmed in 1919 and made Einstein famous — and it follows from the principle alone, before any field equations.'),
        drvStep('clocks at different heights must also disagree',
          `${dfrac('Δ' + dv('f'), dv('f'))} ${dop('=')} ${dfrac(dv('g') + dv('h'), dv('c') + '²')}`,
          `over the ${n(st.h)} m Pound–Rebka tower: ${n(9.80665 * st.h / (299792458 * 299792458))} — the panel computes it`),
        drvSay('and that is gravitational time dilation, derived without any field equation',
          'In the accelerating box the receiver is moving towards the source by the time the light arrives, so it measures a Doppler blueshift. The equivalence principle transfers that straight to gravity: clocks lower down run slow. Pound and Rebka measured it in 1959 over 22.5 m of a Harvard tower.'),
        drvStep('but the principle is only local',
          `tidal effects reveal real gravity`,
          st.mode === 'fall' ? 'two objects falling side by side converge — a uniform acceleration would keep them parallel' : ''),
        drvSay('and tides are what curvature actually means',
          'Over a large enough region, freely falling objects do not stay parallel — they converge towards the centre. No choice of accelerating frame removes that. The part of gravity that cannot be transformed away is spacetime curvature, and it is what the field equations describe.')
      ],
      note:'The Pound–Rebka shift computed here is about 2.5 × 10⁻¹⁵, which they measured using the Mössbauer effect. GPS satellites must correct for the same effect at 45 µs per day, or positions would drift by kilometres daily.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.mode = o.mode || 'accel';    // accel | rest | fall | float
    st.exag = o.exag === undefined ? 12 : o.exag;
    st.h = 22.5;                    // the Pound–Rebka tower, by default
  },
  controls(){
    const st = ST;
    return rlSeg('rlElM', st.mode, [['accel','accelerating in deep space'],['rest','at rest on Earth'],
                                     ['fall','free-falling'],['float','floating, no gravity']]) +
      ctlRow('bend ×', ctlSlider('rlElX', 1, 40, 1, st.exag)) +
      ctlRow('tower h (m)', ctlSlider('rlElH', 1, 400, 0.5, st.h)) +
      rlClockCtl() +
      `<p class="help">Four boxes, two experiments each: drop a ball, and shine a beam across. The first
      two panels are <b>indistinguishable from inside</b>, and so are the last two. That is the whole
      principle — and its bite is the light beam. If the accelerating box sees the beam bend (it must; the
      floor rises to meet it), then the box at rest in gravity must see it bend too, by exactly as much.
      Gravity deflects light. The real deflection is far too small to draw, so the slider exaggerates it;
      the readout always states the true number.</p>`;
  },
  wire(){
    rlWireSeg('rlElM', v => { ST.mode = v; ST.t = 0; });
    wireSlider('rlElX', () => ST.exag, v => { ST.exag = Math.round(v); }, v => '×' + Math.round(v));
    wireSlider('rlElH', () => ST.h, v => { ST.h = v; }, v => fmtNum(+v, 4) + ' m');
    rlWireClock(st => { st.t = 0; });
  },
  frame(st, dt, ctx, W, H){
    const bx = W * 0.5 - 150, by = 44, bw = 300, bh = H - 150;
    const grav = st.mode === 'accel' || st.mode === 'rest';
    const label = { accel:'Accelerating at g, far from any mass',
                    rest:'At rest on the surface of the Earth',
                    fall:'Falling freely in the Earth\'s field',
                    float:'Floating, far from any mass' }[st.mode];
    const tint = grav ? TH.pos : TH.grad;
    /* the box */
    ctx.fillStyle = rgbCss(TH.bg3, 0.5);
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = rgbCss(tint); ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    rlText(ctx, W / 2, by - 16, label, rgbCss(tint), '600 12.5px ' + FONT_UI, 'center');

    /* the acceleration arrow, or its absence */
    if(st.mode === 'accel'){
      rlArrow(ctx, bx - 34, by + bh - 20, bx - 34, by + bh - 90, rgbCss(TH.pos), 2.4, 10);
      rlText(ctx, bx - 40, by + bh - 55, 'a = g', rgbCss(TH.pos), '11px ' + FONT_MONO, 'right');
    } else if(st.mode === 'rest'){
      for(let i = 0; i < 5; i++)
        rlArrow(ctx, bx - 34 + i * 0, by + bh + 6 + i * 0, bx - 34, by + bh + 34, rgbCss(TH.pos), 2, 8);
      rlText(ctx, bx - 40, by + bh + 20, 'g', rgbCss(TH.pos), '11px ' + FONT_MONO, 'right');
      /* the ground */
      rlSegment(ctx, bx - 70, by + bh + 40, bx + bw + 70, by + bh + 40, rgbCss(TH.mid), 3);
    } else if(st.mode === 'fall'){
      rlArrow(ctx, bx - 34, by + 30, bx - 34, by + 100, rgbCss(TH.grad), 2.4, 10);
      rlText(ctx, bx - 40, by + 65, 'falling', rgbCss(TH.grad), '11px ' + FONT_MONO, 'right');
    }

    const T = (st.t * 0.6) % 2.4;
    /* --- the ball --- */
    const ballX = bx + 56;
    const ballY0 = by + 60;
    const fallDist = grav ? Math.min(bh - 110, 60 * T * T) : 0;
    rlDot(ctx, ballX, ballY0 + fallDist, 8, rgbCss(TH.curl));
    rlText(ctx, ballX, ballY0 + fallDist + 20,
      grav ? 'the ball drops' : 'the ball just hangs there',
      rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');
    if(grav){
      ctx.strokeStyle = rgbCss(TH.curl, 0.3); ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(ballX, ballY0); ctx.lineTo(ballX, ballY0 + fallDist); ctx.stroke();
      ctx.setLineDash([]);
    }

    /* --- the light beam: fired horizontally from the left wall --- */
    const beamY = by + bh * 0.42;
    const NB = 160;
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2.2;
    ctx.beginPath();
    for(let i = 0; i <= NB; i++){
      const fx = i / NB;
      /* in the accelerating box the floor rises by ½at² while the light crosses,
         so relative to the box the beam falls by the same parabola */
      const drop = grav ? st.exag * 26 * fx * fx : 0;
      const px = bx + fx * bw, py = beamY + drop;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    rlSegment(ctx, bx, beamY, bx + bw, beamY, rgbCss(TH.faint, 0.45), 1, [4, 4]);
    rlText(ctx, bx + bw + 8, beamY, grav ? 'straight line, for comparison' : 'the beam is straight',
           rgbCss(TH.faint), '10px ' + FONT_UI, 'left');
    if(grav) rlText(ctx, bx + bw + 8, beamY + st.exag * 26,
      'the beam, bent (×' + st.exag + ')', rgbCss(TH.warn), '10px ' + FONT_UI, 'left');
    /* the emitter and receiver of the redshift experiment */
    rlDot(ctx, bx + 6, by + bh - 24, 5, rgbCss(TH.neg));
    rlText(ctx, bx + 14, by + bh - 24, 'emitter', rgbCss(TH.neg), '10px ' + FONT_MONO, 'left');
    rlDot(ctx, bx + 6, by + 24, 5, rgbCss(TH.neg));
    rlText(ctx, bx + 14, by + 24, 'receiver, h above', rgbCss(TH.neg), '10px ' + FONT_MONO, 'left');
    rlArrow(ctx, bx + 6, by + bh - 32, bx + 6, by + 32, rgbCss(TH.neg, 0.45), 1.4, 7);

    stageNote(ctx, grav
      ? 'nothing inside this box can tell you which of the two situations you are in'
      : 'and nothing inside this one can tell you either — free fall is indistinguishable from no gravity', W, H);
  },
  readout(st){
    const g = 9.80665, w = 10;                       // a 10 m wide box
    const drop = 0.5 * g * (w / C_SI) * (w / C_SI);  // true deflection across it
    const zTower = grRedshiftWeak(g, st.h);
    /* the exact Schwarzschild deflection of starlight, for the comparison */
    const dSun = grDeflection(GM_SUN, R_SUN) * ARCSEC;
    return `<div class="card tight"><div class="ttl">Light really does fall — by this much</div>
      ${kv('box width', '10 m')}
      ${kv('time for light to cross', fmtNum(w / C_SI, 4) + ' s')}
      ${kv('drop  ½g(w/c)²', fmtNum(drop, 4) + ' m')}
      ${kv('as a fraction of a proton radius', fmtNum(drop / (R_PROTON * 1e-15), 4))}
      <p class="help">That is why the picture needs a ×${st.exag} exaggeration to show anything at all.
      The effect is real and it has been measured — but not in a lift. It took the whole Sun:
      <b>${fmtNum(dSun, 4)}″</b> of deflection at the solar limb, which Eddington went to Príncipe to
      photograph in 1919.</p>
    </div>
    <div class="card tight"><div class="ttl">And clocks run slow low down</div>
      ${kv('tower height h', fmtNum(st.h, 5) + ' m')}
      ${kv('Δν/ν = gh/c²', fmtNum(zTower, 5))}
      ${kv('as a rate: seconds lost per year', fmtNum(zTower * 3.15576e7, 4) + ' s')}
      ${kv('Pound & Rebka measured (h = 22.5 m)', fmtNum(grRedshiftWeak(g, 22.5), 5))}
      <p class="help">Same argument, run on frequency instead of position. In the accelerating box the
      receiver is moving away from where the light was emitted by the time it arrives, so it measures a
      Doppler <i>red</i>shift of <b>gh/c²</b>. By the principle, a receiver held at height h in a
      gravitational field must see the same. Clocks deeper in a potential well genuinely run slower — and
      this, not the curvature of space, is what accounts for almost all of everyday gravity. A thrown ball
      follows the path that maximises its own elapsed time.</p>
    </div>`;
  },
  chip(st){
    const grav = st.mode === 'accel' || st.mode === 'rest';
    return `<div class="k">Equivalence</div>
      <div style="color:${grav ? 'var(--c-pos)' : 'var(--c-grad)'}">${grav ? 'ball falls · light bends' : 'ball floats · light straight'}</div>
      <div>Δν/ν = ${fmtNum(grRedshiftWeak(9.80665, st.h), 4)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the dropped ball'],
                    ['var(--c-warn)', 'the light beam'],
                    ['var(--faint)', 'the straight line it would have taken'],
                    ['var(--c-neg)', 'the redshift experiment: emitter below, receiver above']]; }
};

/* ---- 6 · the rotating disk -------------------------------------------------
   Ehrenfest's puzzle, and the reason Einstein spent 1912–15 learning Riemannian
   geometry. A spinning disk's rim is moving; its tangential rulers contract;
   its radial ones do not. So the rim measures more than 2πr of circumference,
   and the geometry of a perfectly ordinary rotating frame is not Euclidean. */
STAGES.rlDisk = {
  title: 'The rotating disk',
  derive(st){
    const n = v => fmtNum(v, 6);
    const b = st.brim * st.probe;
    const g = 1 / Math.sqrt(Math.max(1e-12, 1 - b * b));
    return {
      title:'A disk whose circumference no longer matches its radius',
      steps:[
        drvSay('the puzzle that pushed Einstein towards curved space',
          'Spin a rigid disk. Rulers laid along the rim move in their own direction and contract; rulers along a radius move perpendicular to their length and do not. So the rim needs more rulers than before while the radius needs the same number.'),
        drvStep('the rim contracts',
          `${dv('C')} ${dop('=')} ${dv('C')}₀/γ`,
          `at fractional radius ${n(st.probe)} the local speed is ${n(b)}c, so γ = ${n(g)}`),
        drvStep('the radius does not',
          `${dv('R')} ${dop('=')} ${dv('R')}₀`,
          'radial motion is perpendicular to a radial ruler, so there is no contraction'),
        drvStep('so the ratio is no longer 2π',
          `${dfrac(dv('C'), dv('R'))} ${dop('=')} 2πγ`,
          `= ${n(2 * Math.PI * g)} as measured by rulers on the disk — the panel computes it at any radius`),
        drvSay('and this is the geometry of a curved surface',
          'A circumference exceeding 2πR is precisely what happens on a saddle. Euclidean geometry has failed, not through any error but because the rotating frame is not flat. Einstein took this seriously and concluded that accelerated frames require non-Euclidean geometry.'),
        drvSay('combined with the equivalence principle, the conclusion is forced',
          'Acceleration demands curved geometry, and acceleration is locally indistinguishable from gravity. Therefore gravity is curved geometry. That chain of reasoning is why general relativity is a theory of spacetime rather than a force law.'),
        drvStep('clocks on the rim also run slow',
          `Δ${dv('t')} ${dop('=')} γΔ${dv('t')}₀`,
          'which is why a clock at the equator runs slower than one at the pole — by about 100 ns per year'),
        drvSay('and the disk cannot actually be spun up rigidly anyway',
          'Bringing it from rest to rotation requires the rim to contract while the radius does not, which no rigid material can survive. Born rigidity is impossible for rotation — another instance of relativity forbidding perfectly rigid bodies.')
      ],
      note:'The ratio is computed at whatever radius the probe sits, so it approaches 2π at the centre and diverges towards the rim. Ehrenfest posed this paradox in 1909, three years before Einstein began working seriously with curved geometry.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.brim = o.brim === undefined ? 0.6 : o.brim;   // rim speed, in c
    st.probe = 0.7;                                   // fractional radius of the probe
  },
  controls(){
    const st = ST;
    return ctlRow('rim speed β', ctlSlider('rlDkB', 0, 0.95, 0.005, st.brim)) +
      ctlRow('probe r/R', ctlSlider('rlDkR', 0.05, 1, 0.01, st.probe)) +
      rlClockCtl() +
      `<p class="help">Lay rulers along the rim and count how many it takes to go round. Each of them is
      moving <i>along its own length</i>, so each is contracted by γ — and you need γ times as many.
      Lay rulers along a radius and none of them is contracted, because that motion is sideways. So the
      disk measures <b>C = 2πRγ</b> against <b>R</b>, and <b>C/2πR = γ &gt; 1</b>. Flat geometry is gone,
      in a frame with no gravity in sight. Einstein's move was to take this seriously: if acceleration
      alone bends geometry, and acceleration is indistinguishable from gravity, then gravity <i>is</i>
      bent geometry.</p>`;
  },
  wire(){
    /* These two constrain each other: a point at radius r moves at β·(r/R), so
       the ceiling on either one depends on where the other one is standing. */
    const diskWhy = 'On a disk turning with rim speed β, the material at radius r moves at β·(r/R), ' +
      'and that speed is subject to the same law as any other — it cannot reach c. Whichever of the ' +
      'two you moved was held at the fastest the other one still allows.';
    wireSlider('rlDkB', () => ST.brim, v => { ST.brim = v; }, rlBetaFmt,
      () => ({ lo:-0.999999 / Math.max(1, ST.probe), hi:0.999999 / Math.max(1, ST.probe), why:diskWhy }));
    wireSlider('rlDkR', () => ST.probe, v => { ST.probe = v; }, v => fmtNum(+v, 3) + ' R',
      () => ({ lo:0.001, hi:0.999999 / Math.max(1e-6, Math.abs(ST.brim)), why:diskWhy }));
    rlWireClock();
  },
  frame(st, dt, ctx, W, H){
    const cx = W * 0.30, cy = H * 0.50, R = Math.min(W * 0.24, H * 0.36);
    const g = relGamma(st.brim);
    const ang = st.t * st.brim * 0.9;
    /* the disk */
    ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = rgbCss(TH.curl, 0.06);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.fill();
    /* radial rulers: uncontracted, so they are drawn at full length */
    for(let i = 0; i < 12; i++){
      const a = ang + i * Math.PI / 6;
      rlSegment(ctx, cx, cy, cx + R * Math.cos(a), cy + R * Math.sin(a), rgbCss(TH.grad, 0.35), 1);
    }
    /* rim rulers: N of them, each drawn short by 1/γ, and there have to be γ
       times as many to close the circle */
    const N = Math.round(24 * g);
    for(let i = 0; i < N; i++){
      const a0 = ang + i * 2 * Math.PI / N, a1 = a0 + (2 * Math.PI / N) * 0.72;
      ctx.strokeStyle = rgbCss(TH.pos, 0.95); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
    }
    rlText(ctx, cx, cy - R - 22, N + ' rim rulers, each contracted to 1/γ',
           rgbCss(TH.pos), '11px ' + FONT_MONO, 'center');
    rlText(ctx, cx, cy + R + 20, '12 radial rulers, none contracted',
           rgbCss(TH.grad), '11px ' + FONT_MONO, 'center');
    /* the probe ring */
    const pr = R * st.probe;
    ctx.strokeStyle = rgbCss(TH.warn, 0.9); ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, pr, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    rlDot(ctx, cx + pr * Math.cos(ang), cy + pr * Math.sin(ang), 5, rgbCss(TH.warn));

    /* the two curves: C/2πr and the clock rate, against r */
    const P = mkPlot(W * 0.60, 60, W * 0.34, H - 150, 0, 1, 0, Math.max(2.2, g * 1.15));
    plotFrame(ctx, P, 'radius  r / R', '', 'Geometry and clocks, against radius');
    plotTicksX(ctx, P, [0, 0.25, 0.5, 0.75, 1], v => fmtNum(v, 2));
    rlYTicks(ctx, P, [0, 0.5, 1, 1.5, 2]);
    const NP = 300, rs = new Float64Array(NP), cc = new Float64Array(NP), tt = new Float64Array(NP);
    for(let i = 0; i < NP; i++){
      const rr = i / (NP - 1);
      const b = st.brim * rr;
      rs[i] = rr; cc[i] = 1 / Math.sqrt(1 - b * b); tt[i] = Math.sqrt(1 - b * b);
    }
    rlLine(ctx, P, rs, cc, rgbCss(TH.curl), 2.2);
    rlLine(ctx, P, rs, tt, rgbCss(TH.neg), 2.2);
    rlSegment(ctx, P.px, P.Y(1), P.px + P.pw, P.Y(1), rgbCss(TH.faint, 0.5), 1, [4, 4]);
    rlText(ctx, P.px + P.pw - 6, P.Y(1) - 9, 'flat space, ideal clocks',
           rgbCss(TH.faint), '10px ' + FONT_UI, 'right');
    rlSegment(ctx, P.X(st.probe), P.py, P.X(st.probe), P.py + P.ph, rgbCss(TH.warn, 0.6), 1.2, [4, 4]);
    stageNote(ctx, 'dτ/dt = √(1 − ω²r²/c²)  —  compare with √(1 − rs/r) in the Schwarzschild metric', W, H);
  },
  readout(st){
    const g = relGamma(st.brim);
    const b = st.brim * st.probe, gp = relGamma(b);
    return `<div class="card tight"><div class="ttl">At the rim</div>
      ${kv('rim speed β = ωR/c', fmtNum(st.brim, 4))}
      ${kv('γ at the rim', fmtNum(g, 6))}
      ${kv('rim rulers needed (24 when at rest)', String(Math.round(24 * g)))}
      ${kv('measured circumference C', fmtNum(2 * Math.PI * g, 6) + ' R')}
      ${kv('C / 2πR', fmtNum(g, 6))}
      ${kv('so the geometry is', g > 1.0001 ? 'non-Euclidean — C > 2πR' : 'Euclidean, to this precision')}
      <p class="help">A circumference-to-radius ratio <i>greater</i> than 2π is the signature of
      <b>negative</b> curvature in the rotating frame's own measurements — the opposite sign to a
      sphere, where great circles come up short. No gravity has been invoked and no mass is present:
      this curvature comes from the acceleration alone.</p>
    </div>
    <div class="card tight"><div class="ttl">At your probe ring, r = ${fmtNum(st.probe, 3)} R</div>
      ${kv('local speed ωr/c', fmtNum(b, 5))}
      ${kv('γ there', fmtNum(gp, 6))}
      ${kv('clock rate dτ/dt = √(1 − ω²r²/c²)', fmtNum(1 / gp, 6))}
      ${kv('seconds lost per day', fmtNum((1 - 1 / gp) * 86400, 5) + ' s')}
      <p class="help">Read that clock rate again and compare it with the Schwarzschild one,
      <b>√(1 − rs/r)</b>, in the curved-spacetime group. They have the same form because
      <b>½ω²r²</b> is the centrifugal potential per unit mass, exactly as <b>−GM/r</b> is the gravitational
      one, and in both cases the clock rate is <b>√(1 + 2Φ/c²)</b>. The rotating disk is the bridge: it is
      the one place where special relativity alone forces you into curved geometry, and it is where
      Einstein realised he needed a new mathematics.</p>
    </div>`;
  },
  chip(st){
    const g = relGamma(st.brim);
    return `<div class="k">Rotating disk</div>
      <div style="color:var(--c-curl)">C/2πR = ${fmtNum(g, 5)}</div>
      <div style="color:var(--c-neg)">rim clock ×${fmtNum(1 / g, 5)}</div>`;
  },
  legend(){ return [['var(--c-pos)', 'rim rulers — contracted, so more are needed'],
                    ['var(--c-grad)', 'radial rulers — unaffected'],
                    ['var(--c-curl)', 'C / 2πr, against radius'],
                    ['var(--c-neg)', 'clock rate dτ/dt, against radius'],
                    ['var(--c-warn)', 'your probe ring']]; }
};

