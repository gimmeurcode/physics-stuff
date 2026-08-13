STAGES.rlWave = {
  title: 'Gravitational waves',
  derive(st){
    return {
      title:'Ripples in the metric, and why they took a century to detect',
      steps:[
        drvSay('the prediction, and Einstein\'s own doubts',
          'Perturb the metric slightly and the field equations reduce to a wave equation travelling at c. Einstein derived this in 1916, then spent decades unsure whether the waves were physical or a coordinate artefact. They are physical, and they carry energy.'),
        drvStep('the linearised equation',
          `□ ${dv('h')}_μν ${dop('=')} 0`,
          'the same wave operator as electromagnetism, acting on the metric perturbation itself'),
        drvStep('with two polarisations, at 45° rather than 90°',
          `${dv('h')}₊ and ${dv('h')}_×`,
          st.pol === 'plus' ? 'the plus polarisation is shown — stretch one way, squeeze the other' : 'the cross polarisation, rotated by 45°'),
        drvSay('the 45° is the signature of a spin-2 field',
          'Electromagnetic polarisations are at 90° because the photon has spin 1. Gravitational ones are at 45° because the graviton has spin 2 — the field is a rank-2 tensor rather than a vector. The angle is a direct readout of the field\'s nature.'),
        drvStep('the wave stretches space transversely, and volume is preserved',
          `stretch in ${dv('x')}, squeeze in ${dv('y')}, in step`,
          'the panel animates a ring of test masses — it becomes an ellipse and back'),
        drvSay('and there is no monopole or dipole radiation',
          'Conservation of mass forbids a monopole term and conservation of momentum forbids a dipole. The leading radiation is quadrupole, which is why gravitational waves are so weak: the lowest-order channel available to electromagnetism is simply closed to gravity.'),
        drvStep('the strain reaching Earth is absurdly small',
          `${dv('h')} ${dop('∼')} 10^(−21)`,
          'a 4 km arm changes length by about 10⁻¹⁸ m — a thousandth of a proton\'s width'),
        drvSay('which is why it took from 1916 to 2015',
          'LIGO measures a displacement far smaller than the nucleus of the atoms making up its mirrors. It works by interferometry, averaging over 10²² photons and subtracting every other source of motion. The engineering is as remarkable as the physics.'),
        drvStep('and the chirp encodes the source',
          `${dv('f')} rises as the orbit shrinks`,
          `${fmtNum(st.tau, 3)} s before merger — the panel computes the frequency and amplitude from the chirp mass`),
        drvSay('so the waveform is read like a spectrum',
          'The rate at which the frequency sweeps upwards gives the chirp mass; the amplitude then gives the distance. GW150914 was two black holes of about 36 and 29 solar masses merging 1.3 billion light years away, and roughly three solar masses were radiated away as gravitational waves in a fraction of a second.')
      ],
      note:'The strain drawn is exaggerated by many orders of magnitude to be visible at all. The frequency and amplitude evolution are computed from the post-Newtonian chirp formulas for the chosen time before merger, so the sweep is real even though the scale is not.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.pol = o.pol || 'plus';
    st.amp = o.amp === undefined ? 0.28 : o.amp;    // drawn strain, wildly exaggerated
    st.tau = o.tau === undefined ? 0.4 : o.tau;     // seconds before merger
  },
  controls(){
    const st = ST;
    return rlSeg('rlWvP', st.pol, [['plus','+ polarisation'],['cross','× polarisation'],
                                    ['both','both, rotating']]) +
      ctlRow('drawn strain', ctlSlider('rlWvA', 0.02, 0.5, 0.01, st.amp)) +
      ctlRow('before merger', ctlSlider('rlWvT', 0.02, 4, 0.01, st.tau)) +
      rlClockCtl() +
      `<p class="help">A passing wave stretches one transverse axis while squeezing the other, then
      swaps them: <b>δx = ½(h₊x + h×y)</b>, <b>δy = ½(h×x − h₊y)</b>. There is no monopole radiation
      (mass is conserved) and no dipole radiation (momentum is conserved), so the leading term is the
      <b>quadrupole</b> — which is why gravity radiates so feebly that only catastrophes are detectable.
      The drawn strain is about 10²⁰ times life-size. The real waveform on the right is GW150914's
      chirp, computed from the post-Newtonian frequency evolution, and it is the honest amplitude and
      timing.</p>`;
  },
  wire(){
    rlWireSeg('rlWvP', v => { ST.pol = v; });
    wireSlider('rlWvA', () => ST.amp, v => { ST.amp = v; }, v => '×' + fmtNum(+v, 3) + ' (exaggerated)');
    wireSlider('rlWvT', () => ST.tau, v => { ST.tau = v; }, v => fmtNum(+v, 3) + ' s before merger');
    rlWireClock();
  },
  frame(st, dt, ctx, W, H){
    const Mc = gwChirpMass(GW150914.m1, GW150914.m2);
    const fgw = gwChirpFreq(st.tau, Mc);
    const ph = st.t * 2.2;
    const hp = st.pol === 'cross' ? 0 : st.amp * Math.cos(ph);
    const hc = st.pol === 'plus'  ? 0 : st.amp * Math.sin(ph);

    /* --- the ring of test masses. It sits right of centre-left because the
           readout chip floats over the canvas's top-left corner. --- */
    const cx = W * 0.24, cy = H * 0.46, R = Math.min(W * 0.13, H * 0.26);
    rlText(ctx, cx, cy - R - 34, 'A ring of free test masses',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    ctx.strokeStyle = rgbCss(TH.faint, 0.45); ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i = 0; i <= 120; i++){
      const a = i / 120 * 2 * Math.PI;
      const d = gwDisplace(Math.cos(a), Math.sin(a), hp, hc);
      const X = cx + d.x * R, Y = cy - d.y * R;
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.closePath(); ctx.stroke();
    for(let i = 0; i < 16; i++){
      const a = i / 16 * 2 * Math.PI;
      const d = gwDisplace(Math.cos(a), Math.sin(a), hp, hc);
      rlDot(ctx, cx + d.x * R, cy - d.y * R, 4, rgbCss(TH.pos));
    }
    /* the LIGO arms, drawn on the same ring */
    ctx.strokeStyle = rgbCss(TH.grad, 0.85); ctx.lineWidth = 2.4;
    for(const [ax, ay] of [[1, 0], [0, 1]]){
      const d = gwDisplace(ax, ay, hp, hc);
      rlSegment(ctx, cx, cy, cx + d.x * R, cy - d.y * R, rgbCss(TH.grad), 2.4);
    }
    rlText(ctx, cx, cy + R + 26, 'the two interferometer arms, and what the wave does to them',
           rgbCss(TH.grad), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, cx, cy + R + 42,
      'h₊ = ' + fmtNum(hp, 4) + '   h× = ' + fmtNum(hc, 4),
      rgbCss(TH.curl), '11px ' + FONT_MONO, 'center');

    /* --- the chirp --- */
    const P = mkPlot(W * 0.42, 50, W * 0.54, (H - 130) * 0.56, -1.2, 0.02, -1.4, 1.4);
    plotFrame(ctx, P, 'time before merger  (s)', 'strain  h  (×10⁻²¹)',
      'GW150914 — the last 1.2 seconds, from the post-Newtonian chirp');
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [-1.2, -0.9, -0.6, -0.3, 0], v => fmtNum(v, 2));
    rlYTicks(ctx, P, [-1, 0, 1]);
    /* Integrate the phase so the waveform is genuinely the chirp rather than a
       sketch — and stop it where the inspiral model stops being true, which is
       when the frequency reaches the ISCO and the two holes touch. Anything
       drawn past that point would be decoration, not physics. */
    const fIscoW = gwISCOFreq(GW150914.m1 + GW150914.m2);
    const tEnd = -gwTimeToMerge(fIscoW, Mc);
    const N = 2400;
    const tsW = new Float64Array(N), hsW = new Float64Array(N);
    let phase = 0;
    const t0 = -1.2, hstep = (tEnd - t0) / (N - 1);
    for(let i = 0; i < N; i++){
      const tt = t0 + i * hstep;
      const f = gwChirpFreq(-tt, Mc);
      phase += 2 * Math.PI * f * hstep;
      tsW[i] = tt; hsW[i] = Math.pow(f / 35, 2 / 3) * Math.cos(phase);
    }
    rlLine(ctx, P, tsW, hsW, rgbCss(TH.grad), 1.5);
    rlSegment(ctx, P.X(tEnd), P.py, P.X(tEnd), P.py + P.ph, rgbCss(TH.accent, 0.7), 1.4, [4, 4]);
    rlText(ctx, P.X(tEnd) - 6, P.py + 16, 'merger — the inspiral model ends here',
           rgbCss(TH.accent), '10px ' + FONT_MONO, 'right');
    rlSegment(ctx, P.X(-st.tau), P.py, P.X(-st.tau), P.py + P.ph, rgbCss(TH.pos, 0.7), 1.4, [4, 4]);

    /* the frequency track underneath */
    const Q = mkPlot(W * 0.42, 50 + (H - 130) * 0.56 + 54, W * 0.54, (H - 130) * 0.44 - 20,
                     -1.2, 0.02, 0, 400);
    plotFrame(ctx, Q, 'time before merger  (s)', 'wave frequency  (Hz)',
      'f ∝ τ^(−3/8) — and it ends when the holes touch');
    plotTicksX(ctx, Q, [-1.2, -0.9, -0.6, -0.3, 0], v => fmtNum(v, 2));
    rlYTicks(ctx, Q, [0, 100, 200, 300, 400]);
    const fs = new Float64Array(N);
    for(let i = 0; i < N; i++) fs[i] = Math.min(400, gwChirpFreq(-tsW[i], Mc));
    rlLine(ctx, Q, tsW, fs, rgbCss(TH.curl), 2.4);
    rlSegment(ctx, Q.px, Q.Y(fIscoW), Q.px + Q.pw, Q.Y(fIscoW), rgbCss(TH.accent, 0.8), 1.4, [5, 4]);
    rlText(ctx, Q.px + 6, Q.Y(fIscoW) - 9, 'ISCO — ' + fmtNum(fIscoW, 4) + ' Hz, where the chirp ends',
           rgbCss(TH.accent), '10px ' + FONT_MONO);
    rlSegment(ctx, Q.px, Q.Y(35), Q.px + Q.pw, Q.Y(35), rgbCss(TH.faint, 0.55), 1, [3, 3]);
    rlText(ctx, Q.px + 6, Q.Y(35) - 9, 'LIGO enters the band at 35 Hz',
           rgbCss(TH.faint), '10px ' + FONT_MONO);
    rlSegment(ctx, Q.X(-st.tau), Q.py, Q.X(-st.tau), Q.py + Q.ph, rgbCss(TH.pos, 0.7), 1.4, [4, 4]);
    rlDot(ctx, Q.X(-st.tau), Q.Y(Math.min(400, fgw)), 5, rgbCss(TH.pos));
    stageNote(ctx, 'no monopole (mass is conserved), no dipole (momentum is conserved) — the leading term is the quadrupole', W, H);
  },
  readout(st){
    const G = GW150914;
    const Mc = gwChirpMass(G.m1, G.m2), Mt = G.m1 + G.m2;
    const f = gwChirpFreq(st.tau, Mc);
    const D = G.dMpc * 1e6 * PARSEC;
    const h = gwStrain(Mc, f, D);
    const fIsco = gwISCOFreq(Mt);
    const radiated = (Mt - G.mf) * M_SUN_KG * C2;
    return `<div class="card tight"><div class="ttl">GW150914 — the first one</div>
      ${kv('component masses', fmtNum(G.m1, 3) + ' + ' + fmtNum(G.m2, 3) + ' M☉')}
      ${kv('chirp mass (m₁m₂)<sup>3/5</sup>/(m₁+m₂)<sup>1/5</sup>', fmtNum(Mc, 5) + ' M☉')}
      ${kv('final black hole', fmtNum(G.mf, 4) + ' M☉')}
      ${kv('mass converted to gravitational waves', fmtNum(Mt - G.mf, 4) + ' M☉')}
      ${kv('  as energy', fmtNum(radiated, 4) + ' J')}
      ${kv('distance', fmtNum(G.dMpc, 4) + ' Mpc  =  ' + fmtNum(G.dMpc * 3.26, 4) + ' million ly')}
      ${kv('ISCO wave frequency', fmtNum(fIsco, 5) + ' Hz')}
      ${kv('time from 35 Hz to merger', fmtNum(gwTimeToMerge(35, Mc), 4) + ' s')}
      <p class="help">For about 20 milliseconds around the merger this event radiated roughly
      <b>3.6×10⁴⁹ W</b> — more power than all the light of every star in the observable universe
      combined, and none of it in light. The two holes' last orbit took a few milliseconds at
      roughly half the speed of light.</p>
    </div>
    <div class="card tight"><div class="ttl">At ${fmtNum(st.tau, 4)} s before merger</div>
      ${kv('wave frequency', fmtNum(f, 5) + ' Hz')}
      ${kv('orbital frequency (half of it)', fmtNum(f / 2, 5) + ' Hz')}
      ${kv('strain h at 440 Mpc', fmtNum(h, 4))}
      ${kv('arm-length change in a 4 km arm', fmtNum(h * 4000, 4) + ' m')}
      ${kv('  as a fraction of a proton radius', fmtNum(h * 4000 / (R_PROTON * 1e-15), 5))}
      ${kv('drawn here at', '×' + fmtNum(st.amp / Math.max(1e-30, h), 4))}
      <p class="help">That is the measurement problem in one line: a length change ten thousand times
      smaller than a proton, across four kilometres, detected against seismic noise, thermal noise and
      the quantum shot noise of the laser itself. LIGO does it by bouncing 100 kW of stored light
      between mirrors suspended on multi-stage pendulums in an ultra-high vacuum, and by having two
      detectors 3000 km apart that must agree within the 10 ms light-travel time between them.</p>
    </div>
    <div class="card tight"><div class="ttl">Why it took a hundred years</div>
      ${kv('monopole radiation', 'forbidden — mass is conserved')}
      ${kv('dipole radiation', 'forbidden — momentum is conserved')}
      ${kv('leading multipole', 'quadrupole, and it is feeble')}
      ${kv('polarisation states', '2 — the + and × of this stage, at 45° to each other')}
      ${kv('speed', 'c, to 1 part in 10¹⁵  (GW170817 vs its gamma-ray burst)')}
      <p class="help">A spinning dumbbell in a laboratory radiates something like 10⁻³⁰ watts, which is
      why no terrestrial source will ever be used. The waves also carry no charge and interact with
      almost nothing, so unlike light they arrive from the merger itself rather than from a photosphere
      around it. GW170817 — a neutron-star merger seen in gravitational waves and then, 1.7 seconds
      later, in gamma rays — pinned their speed to c, killed off a swathe of modified-gravity theories
      in an afternoon, and showed that such mergers are where a good deal of the universe's gold
      comes from.</p>
    </div>`;
  },
  chip(st){
    const Mc = gwChirpMass(GW150914.m1, GW150914.m2);
    const f = gwChirpFreq(st.tau, Mc);
    const h = gwStrain(Mc, f, GW150914.dMpc * 1e6 * PARSEC);
    return `<div class="k">Gravitational waves</div>
      <div style="color:var(--c-curl)">f = ${fmtNum(f, 4)} Hz</div>
      <div style="color:var(--c-grad)">h = ${fmtNum(h, 4)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the distorted ring, and the frequency track'],
                    ['var(--c-pos)', 'the test masses, and your chosen moment'],
                    ['var(--c-grad)', 'the interferometer arms, and the strain waveform'],
                    ['var(--faint)', 'the undisturbed ring'],
                    ['var(--accent)', 'the ISCO frequency, where the chirp ends']]; }
};
