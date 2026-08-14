STAGES.rlLens = {
  title: 'Bending light',
  derive(st){
    return {
      title:'The factor of two that made Einstein famous',
      steps:[
        drvSay('Newton had already predicted a deflection',
          'Treat light as a stream of corpuscles falling in a gravitational field and you get a bend. Soldner computed it in 1801. So the existence of light bending was not the news — its size was.'),
        drvStep('the Newtonian answer',
          `α ${dop('=')} ${dfrac('2' + dv('GM'), dv('c') + '²' + dv('b'))}`,
          `grazing the ${st.body}, this gives about 0.87 arcseconds`),
        drvStep('general relativity gives exactly twice that',
          `α ${dop('=')} ${dfrac('4' + dv('GM'), dv('c') + '²' + dv('b'))}`,
          `= 1.75 arcseconds at the solar limb — the panel computes both at impact parameter ${fmtNum(st.bmin, 3)}`),
        drvSay('and the extra factor comes from space, not time',
          'The Newtonian calculation only accounts for the warping of time — the gravitational potential slowing clocks. General relativity warps space as well, and for light the two contribute equally. Hence exactly double, and not some awkward factor.'),
        drvStep('which is why light is the ideal test',
          `slow-moving matter feels mostly the time part`,
          'so planetary orbits barely distinguish the theories, while light doubles the difference'),
        drvSay('Eddington\'s 1919 eclipse settled it',
          'Two expeditions photographed stars near the eclipsed Sun and compared their positions with the night sky. The measurements favoured 1.75 over 0.87. The result was announced in November 1919 and made Einstein internationally famous within a week.'),
        drvStep('and lensing is now a working instrument',
          `Einstein ring when the alignment is exact`,
          'the panel traces rays through the metric and shows the images forming'),
        drvSay('which is how invisible mass gets weighed',
          'The deflection depends on the mass, not on whether it emits light. Measuring the distortion of background galaxies weighs the foreground cluster — and the answers came out several times larger than the visible matter. Gravitational lensing is the principal evidence for dark matter.')
      ],
      note:'The rays are traced through the Schwarzschild metric numerically rather than deflected by a formula, so multiple images and the Einstein ring emerge from the geometry. The measured deflection is printed against both the Newtonian and relativistic predictions.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.body = o.body || 'sun';
    st.bmin = o.bmin === undefined ? 1 : o.bmin;
  },
  controls(){
    const st = ST;
    return rlSeg('rlLeB', st.body, [['sun','the Sun, to scale'],['hole','close to a black hole']]) +
      ctlRow('closest ray', ctlSlider('rlLeR', 1, 12, 0.02, st.bmin)) +
      `<p class="help">Each ray is <b>integrated</b> from the null geodesic equation
      <b>d²u/dφ² + u = (3GM/c²)u²</b> — there is no Newtonian term, because light has no rest mass to
      feel one, and yet it bends. For a ray grazing the Sun the answer is <b>4GM/c²b = 1.75″</b>, exactly
      twice what you get by treating light as a fast Newtonian particle. Half of it is the time part of
      the metric (which Newton effectively had) and half is the space part (which he did not). Close in,
      the "small deflection" stops being small: rays can loop, and inside <b>b = 3√3 GM/c²</b> they never
      come out at all — which is the black disc the Event Horizon Telescope photographed.</p>`;
  },
  wire(){
    rlWireSeg('rlLeB', v => { ST.body = v; ST.bmin = v === 'sun' ? 1 : 3; });
    wireSlider('rlLeR', () => ST.bmin, v => { ST.bmin = v; },
               v => fmtNum(+v, 4) + (ST && ST.body === 'sun' ? ' solar radii' : ' × b_crit'));
  },
  frame(st, dt, ctx, W, H){
    const sun = st.body === 'sun';
    const GM = sun ? GM_SUN : GM_SUN * 10;
    const rs = grRs(GM), bc = grCaptureB(GM);
    const unit = sun ? R_SUN : bc;                       // the picture's length unit
    const bodyR = sun ? R_SUN : rs;
    const cx = W * 0.34, cy = H * 0.48;
    const view = sun ? 9 : 7;                            // half-width in units
    const sc = Math.min(W * 0.30, H * 0.40) / view;

    /* the body */
    ctx.fillStyle = rgbCss(sun ? TH.warn : TH.text, sun ? 0.85 : 0.95);
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(2, bodyR / unit * sc), 0, 6.2832); ctx.fill();
    if(!sun){
      ctx.strokeStyle = rgbCss(TH.warn, 0.8); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, bc / unit * sc, 0, 6.2832); ctx.stroke();
      rlText(ctx, cx, cy - bc / unit * sc - 8, 'capture radius 3√3 GM/c²',
             rgbCss(TH.warn), '10px ' + FONT_MONO, 'center');
      ctx.strokeStyle = rgbCss(TH.neg, 0.5); ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, grPhotonSphere(rs) / unit * sc, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
    }
    /* the rays */
    const nRay = 9;
    for(let k = 0; k < nRay; k++){
      const b = (st.bmin + k * (sun ? 0.9 : 0.34)) * unit;
      const res = grPhotonBend(GM, b, 6000, sun ? Math.PI * 1.5 : Math.PI * 8);
      const captured = !Number.isFinite(res.deflection);
      ctx.strokeStyle = rgbCss(captured ? TH.pos : TH.warn, captured ? 0.9 : 0.85);
      ctx.lineWidth = captured ? 1.8 : 1.5;
      ctx.beginPath();
      let started = false;
      /* the integration starts at the incoming asymptote (φ = 0, r = ∞) and the
         ray comes in from the left, so draw φ measured from that direction */
      for(const [ph, r] of res.path){
        if(r > view * unit * 1.9) continue;
        const X = cx - r * Math.cos(ph) / unit * sc, Y = cy - r * Math.sin(ph) / unit * sc;
        started ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), started = true);
      }
      ctx.stroke();
      /* the undeflected path, for comparison, on the closest ray only */
      if(k === 0){
        rlSegment(ctx, cx - view * sc, cy - b / unit * sc, cx + view * sc, cy - b / unit * sc,
                  rgbCss(TH.faint, 0.6), 1.2, [4, 4]);
        if(!captured){
          rlText(ctx, cx + view * sc * 0.55, cy - b / unit * sc - 10,
            'deflected by ' + (res.deflection * ARCSEC > 3600
              ? fmtNum(res.deflection * 180 / Math.PI, 4) + '°'
              : fmtNum(res.deflection * ARCSEC, 4) + '″'),
            rgbCss(TH.warn), '10.5px ' + FONT_MONO, 'center');
        }
      }
    }
    rlText(ctx, cx, 32, sun ? 'Starlight grazing the Sun — the 1919 eclipse test'
                            : 'Rays near a black hole — some loop, some never leave',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');

    /* deflection against impact parameter */
    const P = mkPlot(W * 0.71, 60, W * 0.24, H - 150, 1, sun ? 14 : 10, 0, 0);
    const NB = 200, bs = [], dfl = [], nwt = [];
    let top = 0;
    for(let i = 0; i < NB; i++){
      const bb = (1 + (sun ? 13 : 9) * (i + 0.5) / NB) * unit;
      const dd = grDeflection(GM, bb) * (sun ? ARCSEC : 180 / Math.PI);
      bs.push(bb / unit); dfl.push(dd); nwt.push(dd / 2);
      top = Math.max(top, dd);
    }
    const Q = mkPlot(P.px, P.py, P.pw, P.ph, 1, sun ? 14 : 10, 0, top * 1.1);
    plotFrame(ctx, Q, 'impact parameter  b / ' + (sun ? 'R☉' : 'b_crit'),
      sun ? 'deflection  (arcsec)' : 'deflection  (degrees)', 'The 1/b law');
    plotTicksX(ctx, Q, sun ? [1, 4, 7, 10, 13] : [1, 3, 5, 7, 9], v => String(v));
    rlYTicks(ctx, Q, [0, top / 2, top]);
    rlLine(ctx, Q, bs, nwt, rgbCss(TH.faint, 0.9), 1.7, [4, 4]);
    rlLine(ctx, Q, bs, dfl, rgbCss(TH.grad), 2.4);
    rlSegment(ctx, Q.X(Math.min(Q.x1, st.bmin)), Q.py, Q.X(Math.min(Q.x1, st.bmin)), Q.py + Q.ph,
              rgbCss(TH.pos, 0.6), 1.2, [4, 4]);
    rlText(ctx, Q.px + Q.pw - 6, Q.py + 16, 'Einstein', rgbCss(TH.grad), '10.5px ' + FONT_MONO, 'right');
    rlText(ctx, Q.px + Q.pw - 6, Q.py + 32, 'Newton — exactly half', rgbCss(TH.faint), '10.5px ' + FONT_MONO, 'right');
    stageNote(ctx, 'Δθ = 4GM/c²b  —  and the factor of 2 over Newton is the curvature of space itself', W, H);
  },
  readout(st){
    const sun = st.body === 'sun';
    const GM = sun ? GM_SUN : GM_SUN * 10;
    const rs = grRs(GM), bc = grCaptureB(GM);
    const unit = sun ? R_SUN : bc;
    const b = st.bmin * unit;
    const res = grPhotonBend(GM, b, 20000, sun ? Math.PI * 1.5 : Math.PI * 8);
    const closed = grDeflection(GM, b);
    /* a galaxy-scale lens, for the Einstein ring row */
    const MPC = 1e6 * PARSEC;
    const thE = grEinsteinRadius(GM_SUN * 1e12, 1000 * MPC, 2000 * MPC);
    const shap = grShapiroRoundTrip(GM_SUN, AU_M, 1.082e11, R_SUN);
    return `<div class="card tight"><div class="ttl">The closest ray, b = ${fmtNum(st.bmin, 4)} ${sun ? 'R☉' : 'b_crit'}</div>
      ${kv('impact parameter', fmtNum(b, 5) + ' m')}
      ${kv('in Schwarzschild radii', fmtNum(b / rs, 5))}
      ${kv('integrated deflection', Number.isFinite(res.deflection)
            ? fmtNum(res.deflection, 6) + ' rad  =  ' + fmtNum(res.deflection * ARCSEC, 5) + '″'
            : 'captured — the ray never escapes')}
      ${kv('4GM/c²b (first order)', fmtNum(closed, 6) + ' rad  =  ' + fmtNum(closed * ARCSEC, 5) + '″')}
      ${Number.isFinite(res.deflection)
        ? kv('difference', fmtAgree(res.deflection, closed, '%')) : ''}
      ${kv('Newton\'s corpuscular answer', fmtNum(grDeflectionNewtonian(GM, b) * ARCSEC, 5) + '″')}
      ${kv('capture radius 3√3 GM/c²', fmtNum(bc, 5) + ' m  =  ' + fmtNum(bc / rs, 5) + ' rs')}
      <p class="help">${sun
        ? 'At the solar limb this is <b>1.75″</b> — about the angle a pound coin subtends from two miles away. Eddington and Dyson measured it during the eclipse of 29 May 1919 from Príncipe and Sobral, the results were announced that November, and Einstein was on the front page of the London <i>Times</i> the following morning. Modern radio interferometry has confirmed the coefficient to about one part in 10⁵.'
        : 'Close in the expansion fails and it must be integrated. A ray at just over the critical impact parameter can wind several times round the hole before leaving — which is why a black hole image has a series of ever-fainter "photon rings" nested inside the main one, each made of light that went round one more time.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The other two things bending implies</div>
      ${kv('Einstein-ring radius for a 10¹² M☉ galaxy', fmtNum(thE * ARCSEC, 5) + '″')}
      ${kv('  (lens at 1 Gpc, source at 2 Gpc)', '')}
      ${kv('Shapiro round-trip delay past the Sun', fmtNum(shap * 1e6, 5) + ' μs')}
      ${kv('  as an extra path length', fmtNum(shap * C_SI / 1000, 5) + ' km')}
      <p class="help">A lens directly in line with a source produces a <b>ring</b>, not a spot — and
      galaxy clusters routinely produce arcs, multiple images and rings that let you weigh the lens
      including its dark matter. The <b>Shapiro delay</b> is the same geometry read as a clock: a radar
      pulse bounced off Venus at superior conjunction comes back a few hundred microseconds late.
      Nothing travelled slower than c; the path through the deeper part of the metric is simply longer
      than it looks. It is now the tightest of the classical tests, verified by the Cassini probe to
      about one part in 10⁵.</p>
    </div>`;
  },
  chip(st){
    const sun = st.body === 'sun';
    const GM = sun ? GM_SUN : GM_SUN * 10;
    const unit = sun ? R_SUN : grCaptureB(GM);
    const d = grDeflection(GM, st.bmin * unit);
    return `<div class="k">Light bending</div>
      <div style="color:var(--c-grad)">${d * ARCSEC > 3600 ? fmtNum(d * 180 / Math.PI, 4) + '°' : fmtNum(d * ARCSEC, 4) + '″'}</div>
      <div style="color:var(--faint)">Newton: half of it</div>`;
  },
  legend(){ return [['var(--c-warn)', 'light rays, integrated from the null geodesic'],
                    ['var(--c-pos)', 'rays that are captured, and your chosen b'],
                    ['var(--faint)', 'the straight line the closest ray would have taken'],
                    ['var(--c-grad)', 'deflection against impact parameter'],
                    ['var(--c-neg)', 'the photon sphere']]; }
};

/* ---- 19 · falling in -------------------------------------------------------
   The horizon is not a wall and nothing special happens there locally. What is
   strange is entirely about signalling: the infaller's proper time runs out in
   moments, and the outside world never sees them arrive. */
STAGES.rlHole = {
  title: 'Falling in',
  derive(st){
    return {
      title:'What the horizon is, and what it is not',
      steps:[
        drvStep('the horizon is where the time coefficient vanishes',
          `${dv('r')}ₛ ${dop('=')} ${dfrac('2' + dv('GM'), dv('c') + '²')}`,
          `${st.M} solar masses gives rs ≈ ${fmtNum(2.95e3 * st.M, 4)} m — the panel starts the fall at ${st.r0} rs`),
        drvSay('the two observers see entirely different things',
          'This is the heart of it. The infalling traveller crosses the horizon in finite proper time and notices nothing locally remarkable. The distant observer never sees the crossing at all — the image slows, dims and reddens, freezing at the horizon forever.'),
        drvStep('proper time to fall is finite',
          `τ ${dop('=')} ∫ ${dfrac('d' + dv('r'), '√(2' + dv('GM') + '/' + dv('r') + ')')}`,
          'the panel integrates it — a few tens of microseconds for a stellar-mass hole from close in'),
        drvStep('but coordinate time diverges logarithmically',
          `${dv('t')} ${dop('→')} ∞ as ${dv('r')} ${dop('→')} ${dv('r')}ₛ`,
          'the panel plots both clocks and the gap opening without limit'),
        drvSay('and the divergence is a failure of the coordinates, not of spacetime',
          'Schwarzschild time is the reading of a clock at infinity, and it becomes a bad label near the horizon. Change to infalling coordinates and nothing singular happens there at all — the geometry is perfectly smooth. The horizon is a boundary of what can be seen, not a place where physics breaks.'),
        drvStep('what does break is at the centre',
          `curvature ${dop('→')} ∞ as ${dv('r')} ${dop('→')} 0`,
          'the panel plots the tidal stretch, which diverges — and no coordinate change removes it'),
        drvSay('so there are two very different kinds of singularity here',
          'The horizon singularity is an artefact of the chart. The central one is real: invariant curvature scalars blow up, and any observer reaching it is destroyed. Distinguishing coordinate singularities from genuine ones is a basic skill in the subject.'),
        drvStep('tidal forces are what actually kills you',
          `Δ${dv('a')} ${dop('≈')} ${dfrac('2' + dv('GM') + dv('L'), dv('r') + '³')}`,
          `the panel computes the stretch across a human body at the probe radius`),
        drvSay('and for a big enough hole the horizon is unremarkable',
          'The tidal force at the horizon falls as 1/M², so for a supermassive black hole crossing it is entirely gentle — nothing local marks the moment. For a stellar-mass hole you are torn apart well before reaching it. Size decides which fate arrives first.'),
        drvSay('and the horizon is defined globally, not locally',
          'It is the boundary of the region from which light can escape to infinity — a statement about the whole future of the spacetime. No local measurement can detect it. That is why an infalling observer has nothing to notice.')
      ],
      note:'Both clocks are integrated from the metric along the actual trajectory, so the divergence between them is computed rather than described. The tidal stretch is evaluated at the probe radius for the chosen mass.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.M = o.M === undefined ? 10 : o.M;      // solar masses
    st.r0 = o.r0 === undefined ? 20 : o.r0;   // start radius, in rs
    st.probe = o.probe === undefined ? 5 : o.probe;
  },
  controls(){
    const st = ST;
    return rlSeg('rlHoM', String(st.M), [['10','10 M☉'],['1000','1000 M☉'],['4297000','Sgr A* · 4.3×10⁶ M☉']]) +
      ctlRow('start at r₀', ctlSlider('rlHoS', 3, 60, 0.5, st.r0)) +
      ctlRow('probe r', ctlSlider('rlHoP', 1.0001, 30, 0.0005, st.probe)) +
      rlClockCtl() +
      `<p class="help">Drop from rest at <b>r₀</b>. The faller's own clock (orange) reaches the horizon in
      a finite and rather short time, and nothing local marks the crossing — the tidal force is smooth
      through it, and for a big enough hole it is imperceptible. The <b>coordinate</b> time (teal) runs
      away logarithmically, which is why distant observers describe the infaller as freezing and fading:
      that is a statement about the last photons struggling out, not about the faller. The redshift curve
      is the honest version of "freezing" — signals arrive stretched by
      <b>√(1−rs/r)·√((1−v)/(1+v))</b> until there are effectively none left.</p>`;
  },
  wire(){
    rlWireSeg('rlHoM', v => { ST.M = +v; });
    wireSlider('rlHoS', () => ST.r0, v => { ST.r0 = v; ST.probe = Math.min(ST.probe, v - 0.1); ST.t = 0; },
               v => fmtNum(+v, 4) + ' rs');
    wireSlider('rlHoP', () => ST.probe, v => { ST.probe = v; }, v => fmtNum(+v, 5) + ' rs');
    rlWireClock(st => { st.t = 0; });
  },
  frame(st, dt, ctx, W, H){
    const GM = GM_SUN * st.M, rs = grRs(GM);
    const r0 = st.r0 * rs;
    const tauTotal = grInfall(GM, r0, rs).tau;

    /* --- the geometry, and the falling dot. The radial axis is compressed as
           (r/rs)^0.45 so that the horizon, the photon sphere and the ISCO are
           all legible at once; at r₀ = 20 rs a linear map would put them inside
           a few pixels of each other. --- */
    const cx = W * 0.19, cy = H * 0.50;
    const Rmax = Math.min(W * 0.14, H * 0.33);
    const RS = r => Rmax * Math.pow(r / rs, 0.45) / Math.pow(st.r0, 0.45);
    ctx.fillStyle = rgbCss(TH.text, 0.92);
    ctx.beginPath(); ctx.arc(cx, cy, RS(rs), 0, 6.2832); ctx.fill();
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, RS(rs), 0, 6.2832); ctx.stroke();
    for(const [k, col, nm] of [[1.5, TH.neg, 'photon sphere 1.5 rs'], [3, TH.accent, 'ISCO 3 rs']]){
      ctx.strokeStyle = rgbCss(col, 0.7); ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(cx, cy, RS(k * rs), 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
      rlText(ctx, cx, cy - RS(k * rs) - 7, nm, rgbCss(col), '9.5px ' + FONT_MONO, 'center');
    }
    rlText(ctx, cx, cy, 'horizon', rgbCss(TH.bg), '600 10px ' + FONT_MONO, 'center');
    rlText(ctx, cx, cy + Rmax + 30, 'radius drawn as (r/rs)^0.45',
           rgbCss(TH.faint), '9.5px ' + FONT_MONO, 'center');
    /* the faller, parameterised by their own proper time so the motion is real */
    const frac = (st.t * 0.16) % 1.06;
    let rNow = r0;
    { /* invert tau(r) by bisection — the cycloid is monotone, so it is easy */
      let a = rs, b = r0, target = Math.min(tauTotal, frac * tauTotal);
      for(let i = 0; i < 40; i++){
        const m = 0.5 * (a + b);
        (grInfall(GM, r0, m).tau > target) ? (a = m) : (b = m);
      }
      rNow = 0.5 * (a + b);
    }
    rlDot(ctx, cx + RS(rNow), cy, 5.5, rgbCss(TH.pos), rgbCss(TH.bg));
    rlSegment(ctx, cx + RS(rs), cy, cx + RS(r0), cy, rgbCss(TH.pos, 0.25), 1.4);
    rlDot(ctx, cx + RS(st.probe * rs), cy - 12, 4, rgbCss(TH.curl));
    rlText(ctx, cx, 34, fmtNum(st.M, 6) + ' M☉  ·  rs = ' +
           (rs > 1e6 ? fmtNum(rs / 1e9, 4) + ' Gm' : fmtNum(rs / 1000, 4) + ' km'),
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');

    /* --- the two clocks. Sample logarithmically in (r − rs): the interesting
           behaviour is all in the last hair above the horizon, and an even grid
           in r would simply miss it. --- */
    const NP = 400, rr = [], tau = [], tco = [], red = [];
    for(let i = 0; i < NP; i++){
      const u = i / (NP - 1);
      const r = rs + (r0 - rs) * Math.pow(10, -5 * u);
      const g = grInfall(GM, r0, r);
      rr.push(r / rs); tau.push(g.tau); tco.push(g.t); red.push(g.redshift);
    }
    /* the vertical range is set by the proper time, so the coordinate-time curve
       runs off the top of the frame — which is the honest picture of a divergence */
    const P = mkPlot(W * 0.38, 52, W * 0.27, H - 130, 1, st.r0, 0, tauTotal * 2.4);
    plotFrame(ctx, P, 'r / rs', 'seconds', 'Two clocks: one finishes, one never does');
    plotTicksX(ctx, P, [1, st.r0 / 2, st.r0], v => fmtNum(v, 3));
    rlYTicks(ctx, P, [0, P.y1 / 2, P.y1]);
    rlLine(ctx, P, rr, tco, rgbCss(TH.grad), 2.4);
    rlLine(ctx, P, rr, tau, rgbCss(TH.pos), 2.4);
    rlSegment(ctx, P.X(1), P.py, P.X(1), P.py + P.ph, rgbCss(TH.warn, 0.7), 1.6);
    rlSegment(ctx, P.X(Math.min(st.probe, st.r0)), P.py, P.X(Math.min(st.probe, st.r0)), P.py + P.ph,
              rgbCss(TH.curl, 0.6), 1.2, [4, 4]);
    rlArrow(ctx, P.X(1.6), P.py + 34, P.X(1.6), P.py + 6, rgbCss(TH.grad), 1.6, 7);
    rlText(ctx, P.px + P.pw - 6, P.py + 16, 'coordinate time — off the top, forever',
           rgbCss(TH.grad), '10.5px ' + FONT_MONO, 'right');
    rlText(ctx, P.px + P.pw - 6, P.py + 32, 'proper time — ' + fmtNum(tauTotal, 4) + ' s and done',
           rgbCss(TH.pos), '10.5px ' + FONT_MONO, 'right');
    rlText(ctx, P.X(1) + 6, P.py + P.ph - 10, 'horizon', rgbCss(TH.warn), '10px ' + FONT_MONO);

    /* --- the redshift of the signals they send out --- */
    const Q = mkPlot(W * 0.72, 52, W * 0.23, H - 130, 1, st.r0, -6, 0.2);
    plotFrame(ctx, Q, 'r / rs', 'log₁₀ (received / sent frequency)',
      'The signal fades exponentially, not suddenly');
    plotTicksX(ctx, Q, [1, st.r0 / 2, st.r0], v => fmtNum(v, 3));
    rlYTicks(ctx, Q, [0, -2, -4, -6], v => String(v));
    rlLine(ctx, Q, rr, red.map(v => Math.log10(Math.max(1e-12, v))), rgbCss(TH.neg), 2.4);
    rlSegment(ctx, Q.X(Math.min(st.probe, st.r0)), Q.py, Q.X(Math.min(st.probe, st.r0)), Q.py + Q.ph,
              rgbCss(TH.curl, 0.6), 1.2, [4, 4]);
    stageNote(ctx, 'nothing happens at the horizon locally — it is a one-way surface, not a wall', W, H);
  },
  readout(st){
    const GM = GM_SUN * st.M, rs = grRs(GM), r0 = st.r0 * rs;
    const atHorizon = grInfall(GM, r0, rs);
    const atProbe = grInfall(GM, r0, Math.min(st.probe, st.r0 - 1e-6) * rs);
    const tidHorizon = grTidal(GM, rs, 2), tidProbe = grTidal(GM, st.probe * rs, 2);
    return `<div class="card tight"><div class="ttl">The hole</div>
      ${kv('mass', fmtNum(st.M, 7) + ' M☉')}
      ${kv('rs = 2GM/c²', rs > 1e6 ? fmtNum(rs / 1e9, 5) + ' Gm' : fmtNum(rs / 1000, 5) + ' km')}
      ${kv('photon sphere 1.5 rs', rs > 1e6 ? fmtNum(1.5 * rs / 1e9, 5) + ' Gm' : fmtNum(1.5 * rs / 1000, 5) + ' km')}
      ${kv('ISCO 3 rs', rs > 1e6 ? fmtNum(3 * rs / 1e9, 5) + ' Gm' : fmtNum(3 * rs / 1000, 5) + ' km')}
      ${kv('mean density inside the horizon', fmtNum(GM / G_SI / (4 / 3 * Math.PI * rs * rs * rs), 4) + ' kg/m³')}
      <p class="help">That density row is worth a second look: it falls as <b>1/M²</b>. A hole of a few
      billion solar masses has a horizon less dense than water, and one the mass of the observable
      universe would be thinner than air. Nothing about a horizon requires crushing density — only
      enough mass inside a given radius.</p>
    </div>
    <div class="card tight"><div class="ttl">The fall from r₀ = ${fmtNum(st.r0, 4)} rs</div>
      ${kv('proper time to the horizon', fmtNum(atHorizon.tau, 5) + ' s')}
      ${kv('proper time to r = 0', fmtNum(grInfall(GM, r0, 0).tau, 5) + ' s')}
      ${kv('coordinate time to the horizon', '∞ — the integral diverges')}
      ${kv('speed a static observer measures at the horizon', fmtNum(atHorizon.vLocal, 8) + ' c')}
      ${kv('at your probe, r = ' + fmtNum(st.probe, 4) + ' rs', fmtNum(atProbe.vLocal, 6) + ' c')}
      ${kv('proper time to reach the probe', fmtNum(atProbe.tau, 5) + ' s')}
      ${kv('coordinate time to reach the probe', fmtNum(atProbe.t, 5) + ' s')}
      ${kv('signal redshift from the probe', '×' + fmtNum(atProbe.redshift, 6))}
      <p class="help">The infaller crosses at c as measured by a hovering observer — but there are no
      hovering observers at or inside the horizon, which is precisely what makes it a horizon. The
      crossing is not detectable from inside the falling frame; the faller has an entirely ordinary few
      seconds and then a very short and unpleasant while.</p>
    </div>
    <div class="card tight"><div class="ttl">What actually kills you</div>
      ${kv('tidal stretch across 2 m, at the horizon', fmtNum(tidHorizon, 4) + ' m/s²')}
      ${kv('  in g', fmtNum(tidHorizon / 9.80665, 4) + ' g')}
      ${kv('at your probe radius', fmtNum(tidProbe / 9.80665, 4) + ' g')}
      ${kv('verdict at the horizon', tidHorizon / 9.80665 > 20 ? 'fatal — spaghettification well before arrival'
            : 'survivable — you would cross without noticing')}
      <p class="help">Tidal force at the horizon goes as <b>c⁶/G²M²</b>: it gets <i>gentler</i> for
      bigger holes, which is the opposite of most people's intuition. At 10 M☉ you are torn apart
      thousands of kilometres out. At Sgr A* you would cross the horizon in perfectly good health, with
      about a minute of proper time left and no way to report any of it. The horizon is a property of
      the causal structure, not of any local field strength — which is exactly why the equivalence
      principle survives it.</p>
    </div>`;
  },
  chip(st){
    const GM = GM_SUN * st.M, rs = grRs(GM);
    const g = grInfall(GM, st.r0 * rs, rs);
    return `<div class="k">Falling in</div>
      <div style="color:var(--c-pos)">τ = ${fmtNum(g.tau, 4)} s</div>
      <div style="color:var(--c-grad)">t = ∞</div>
      <div style="color:var(--c-neg)">tide ${fmtNum(grTidal(GM, rs, 2) / 9.80665, 3)} g</div>`;
  },
  legend(){ return [['var(--c-pos)', "the faller's proper time — finite"],
                    ['var(--c-grad)', 'coordinate time — divergent'],
                    ['var(--c-warn)', 'the horizon'],
                    ['var(--c-neg)', 'the redshift of the signals they send'],
                    ['var(--accent)', 'the ISCO'], ['var(--c-curl)', 'your probe radius']]; }
};

/* ---- 20 · gravitational waves ----------------------------------------------
   Spacetime itself, oscillating. Einstein derived them in 1916, doubted them in
   1936, and they were detected on 14 September 2015 by two instruments that had
   to measure a length change of one part in 10²¹. */
