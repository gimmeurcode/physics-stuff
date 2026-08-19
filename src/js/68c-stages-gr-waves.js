/* ============================================================================
   4f''' · THE RELATIVITY WING — WHAT A BINARY RADIATES
   Programme A item 5, rebuilt 2026-08-18. Until then this stage knew it was
   looking at GW150914: the two masses were constants in the file, the chirp
   came out of a formula in the chirp mass, and the ring was driven by a
   sinusoid with no source behind it. §2.9's rule is that what a preset may
   assume is exactly what the reader's own scenario has to test, so the binary
   is now two masses and a separation the reader chooses, and everything the
   panel says is measured from them:

     the frequency   Kepler's, at the separation in the slider
     the sweep       ROUTE A — RK4 on ȧ = −(64/5)m₁m₂M/a³, which knows the two
                     masses separately, and a five-point derivative of the
                     frequency track it produces.  ROUTE B — the closed-form
                     chirp relation, which knows only Mc.
     the mass        inverting route B on route A's measured (f, ḟ), which is
                     what a detector does and the reason LIGO quotes a chirp
                     mass to four figures and the component masses to one.
     the wave        the quadrupole moment of the two bodies, differentiated
                     twice numerically and projected — so the amplitude, the
                     polarisation pattern and the FACTOR OF TWO in frequency
                     are all measured rather than written down.

   The engine is 46d-gr-waves.js. Nothing here integrates anything itself.
   ============================================================================ */

/* Seconds, in the unit a reader can hold. A binary's timescales run from
   microseconds at the ISCO to 10²³ years for the Earth, and one format cannot
   serve both — this is the one place in the wing where a unit is chosen by
   size rather than fixed. */
function gwFmtTime(t){
  if(!Number.isFinite(t)) return 'not defined here';
  const a = Math.abs(t), YR = 365.25 * 86400;
  if(a < 1e-3)   return fmtSig(t * 1e6, 4) + ' µs';
  if(a < 1)      return fmtSig(t * 1e3, 4) + ' ms';
  if(a < 180)    return fmtSig(t, 4) + ' s';
  if(a < 7200)   return fmtSig(t / 60, 4) + ' min';
  if(a < 2 * 86400) return fmtSig(t / 3600, 4) + ' hours';
  if(a < 2 * YR) return fmtSig(t / 86400, 4) + ' days';
  const y = t / YR;
  if(Math.abs(y) < 1e3)  return fmtSig(y, 4) + ' years';
  if(Math.abs(y) < 1e6)  return fmtSig(y / 1e3, 4) + ' thousand years';
  if(Math.abs(y) < 1e9)  return fmtSig(y / 1e6, 4) + ' million years';
  if(Math.abs(y) < 1e13) return fmtSig(y / 1e9, 4) + ' billion years';
  return fmtSig(y, 4) + ' years';
}
/* and a length, in kilometres up to the point where nobody thinks in them */
function gwFmtLen(km){
  if(!Number.isFinite(km)) return 'not defined here';
  if(km > 1e7) return fmtSig(km, 5) + ' km  =  ' + fmtSig(km * 1000 / AU_M, 4) + ' AU';
  if(km > 1e5) return fmtSig(km, 5) + ' km  =  ' + fmtSig(km * 1000 / R_SUN, 4) + ' solar radii';
  return fmtSig(km, 5) + ' km';
}
/* The picker's pressed state, updated without rebuilding the panel. A slider
   drag that called buildStagePanel() would destroy the slider under the
   reader's finger, so the one attribute that has to change when a preset stops
   being the preset is set directly. */
function gwMarkOwn(){
  const s = $('rlWvB'); if(!s) return;
  for(const b of s.children) b.setAttribute('aria-pressed', String(b.dataset.v === 'custom'));
}

STAGES.rlWave = {
  title: 'Gravitational waves',
  dockLegend: true,

  /* the accessor: a preset and a typed binary are the same shape, and the
     sliders are the single source of truth for the numbers either way — so the
     picture can never disagree with the controls */
  curOf(st){
    const B = st.key !== 'custom' ? GW_BINARIES[st.key] : null;
    return { nm: B ? B.nm : 'your own binary',
             sub: B ? B.sub : 'two masses and a separation you chose',
             m1: st.m1, m2: st.m2, aKm: Math.pow(10, st.la), dMpc: Math.pow(10, st.ld),
             own: !B, src: B,
             note: B ? B.note :
               'Your own binary. Every number below — the frequency, the sweep rate, the strain, the time left — is computed from these two masses and this separation, and the chirp mass is then measured back out of the waveform rather than assumed.' };
  },

  load(st, B){
    st.m1 = B.m1; st.m2 = B.m2;
    st.la = Math.log10(gwSm(gwBinarySep(B)) / 1000);
    st.ld = Math.log10(B.dMpc);
  },

  enter(st, o){
    st.key = o.key || 'gw150914';
    this.load(st, GW_BINARIES[st.key] || GW_BINARIES.gw150914);
    if(o.m1   !== undefined) st.m1 = o.m1;
    if(o.m2   !== undefined) st.m2 = o.m2;
    if(o.aKm  !== undefined) st.la = Math.log10(o.aKm);
    if(o.dMpc !== undefined) st.ld = Math.log10(o.dMpc);
    st.inc = o.inc === undefined ? 0 : o.inc;      // degrees from face-on
    st.amp = o.amp === undefined ? 0.30 : o.amp;   // the drawn strain, exaggerated
    st.cacheKey = '';
    this.recompute(st);
  },

  /* Everything expensive happens once per change of input, not once per frame:
     the inspiral is up to a couple of thousand RK4 steps and the waveform is
     four hundred samples of a twice-differentiated quadrupole. */
  recompute(st){
    const B = this.curOf(st);
    const key = [st.key, st.m1, st.m2, st.la, st.ld, st.inc].join('|');
    if(st.cacheKey === key && st.O) return;
    st.cacheKey = key;
    const m1 = gwMs(Math.max(1e-12, st.m1)), m2 = gwMs(Math.max(1e-12, st.m2));
    const M = m1 + m2;
    const a = gwLs(Math.max(1e-6, Math.pow(10, st.la)) * 1000);
    const D = gwLs(Math.max(1e-12, Math.pow(10, st.ld)) * 1e6 * PARSEC);
    const inc = st.inc * Math.PI / 180;
    const O = { B, m1, m2, M, a, D, inc, Mc: gwChirpMassS(m1, m2), aI: gwSepIsco(M) };
    O.fgw = gwFgwOf(M, a); O.fIsco = gwFgwIsco(M); O.period = gwPeriodOf(M, a);
    O.lum = gwLumOf(m1, m2, a);
    O.patP = gwPatternP(inc); O.patC = gwPatternC(inc);
    O.hClosed = gwStrainOf(O.Mc, O.fgw, D);
    O.twin = gwEqualTwin(m1, m2);
    O.ok = a > O.aI;
    if(!O.ok){
      O.why = 'that separation is inside the innermost stable circular orbit at 6GM/c² = ' +
              gwFmtLen(gwSm(O.aI) / 1000) + '. There is no inspiral to integrate: the two ' +
              'bodies are already merging, and everything past that point belongs to numerical ' +
              'relativity rather than to this model.';
      st.O = O; return;
    }
    /* ROUTE A, and the measurement made on it */
    O.run = gwInspiralRun(m1, m2, a, { frac: 0.004 });
    O.fd  = gwTrackFdot(O.run);
    /* "now" is the first sample; its derivative is one-sided and fourth order */
    O.fdotMeas = O.fd.ok ? O.fd.fdot[0] : NaN;
    O.fdotB    = gwFdotOf(O.Mc, O.fgw);
    O.mcMeas   = gwMcFromFdot(O.fgw, O.fdotMeas);
    /* the slope of the measured ḟ against the measured f, over the whole track:
       11/3 is the claim, and a least-squares fit is the check */
    if(O.fd.ok){
      let sx = 0, sy = 0, sxx = 0, sxy = 0, k = 0;
      for(let i = 2; i <= O.run.n - 2; i++){
        const x = Math.log(O.run.f[i]), y = Math.log(O.fd.fdot[i]);
        if(!Number.isFinite(x) || !Number.isFinite(y)) continue;
        sx += x; sy += y; sxx += x * x; sxy += x * y; k++;
      }
      O.slope = k > 2 ? (k * sxy - sx * sy) / (k * sxx - sx * sx) : NaN;
    } else O.slope = NaN;
    /* the closed forms, for the second opinion */
    O.tc     = gwTcoalOf(m1, m2, a);
    O.tIsco  = gwTcoalOf(m1, m2, O.aI);
    O.tToIsco = O.tc - O.tIsco;
    O.cyclesB = gwCyclesOf(O.Mc, O.fgw, O.fIsco);
    /* THE WAVE, from the quadrupole moment of the two bodies */
    O.wave = gwQuadWave(m1, m2, a, D, inc, 400);
    st.O = O;
  },

  /* ------------------------------------------------------------- derive --- */
  derive(st){
    const O = st.O, B = this.curOf(st);
    const fs = O && O.ok ? fmtSig(O.fgw, 5) + ' Hz' : 'no inspiral here';
    return {
      title:'Ripples in the metric, and how a mass is read off one',
      steps:[
        drvSay('the prediction, and Einstein\'s own doubts',
          'Perturb the metric slightly and the field equations reduce to a wave equation travelling at c. Einstein derived this in 1916, then spent decades unsure whether the waves were physical or an artefact of the coordinates. They are physical, they carry energy, and this panel measures how much.'),
        drvStep('the linearised equation',
          `□ ${dv('h')}_μν ${dop('=')} 0`,
          'the same wave operator as electromagnetism, acting on the metric perturbation itself'),
        drvStep('with two polarisations, at 45° rather than 90°',
          `${dv('h')}₊ and ${dv('h')}_×`,
          'the 45° is the signature of a spin-2 field, where electromagnetism\'s 90° is spin 1'),
        drvSay('there is no monopole and no dipole radiation',
          'Conservation of mass forbids a monopole term and conservation of momentum forbids a dipole. The leading channel is the quadrupole, which is why gravity radiates so feebly that only catastrophes are detectable — and why the wave comes out at TWICE the orbital frequency, since a quadrupole repeats itself after half a turn. The panel counts the zero crossings rather than asserting the factor of two.'),
        drvStep('the power the pair radiates',
          `${dv('L')} ${dop('=')} ${dfrac('32', '5')}·${dfrac(dv('m₁') + '²' + dv('m₂') + '²' + dv('M'), dv('a') + '⁵')}`,
          `for ${B.nm} that is ${O && O.ok ? fmtSig(O.lum * GW_LUM_W, 4) + ' W' : '—'}, which the orbit has to pay for`),
        drvStep('so the orbit shrinks',
          `${dv('ȧ')} ${dop('=')} ${dop('−')}${dv('L')}/(d${dv('E')}/d${dv('a')}) ${dop('=')} ${dop('−')}${dfrac('64', '5')}·${dfrac(dv('m₁') + dv('m₂') + dv('M'), dv('a') + '³')}`,
          'the whole inspiral is this one line integrated — and it never forms a chirp mass'),
        drvStep('and Kepler turns that into a rising frequency',
          `${dv('f')} ${dop('=')} ${dfrac('1', 'π')}√(${dv('M')}/${dv('a')}³)`,
          `at the separation in the slider, ${fs}`),
        drvStep('the sweep rate depends on ONE combination of the masses',
          `${dv('ḟ')} ${dop('=')} ${dfrac('96', '5')}π^(8/3)${dv('M')}_c^(5/3)${dv('f')}^(11/3),  ${dv('M')}_c ${dop('=')} ${dfrac('(' + dv('m₁') + dv('m₂') + ')^(3/5)', '(' + dv('m₁') + '+' + dv('m₂') + ')^(1/5)')}`,
          O && O.ok && Number.isFinite(O.slope)
            ? `the measured log–log slope is ${fmtSig(O.slope, 8)} against 11/3 = 3.6666667`
            : 'the chirp mass, and nothing else about the two masses'),
        drvSay('which is why the waveform is read like a spectrum',
          'Measure the frequency and how fast it sweeps, and the chirp mass falls out — no distance, no orientation, no model of the source needed. The amplitude then gives the distance. The individual masses are much harder: two very different pairs with the same chirp mass produce the same waveform until the last few cycles, and the panel draws both so you can watch them coincide.'),
        drvStep('the strain that arrives',
          `${dv('h')} ${dop('=')} ${dfrac('4' + dv('M') + '_c^(5/3)(π' + dv('f') + ')^(2/3)', dv('D'))}`,
          O && O.ok ? `here ${fmtSig(O.hClosed, 4)} — and the panel measures it off the quadrupole instead` : '—'),
        drvSay('and that is the measurement problem in one line',
          'A strain of 10⁻²¹ moves LIGO\'s 4 km arms by a ten-thousandth of a proton. It is done by bouncing 100 kW of stored light between mirrors on multi-stage pendulums in an ultra-high vacuum, with two detectors 3000 km apart that must agree within the 10 ms of light-travel time between them.')
      ],
      note:'The strain drawn on the left is exaggerated by many orders of magnitude and slowed by many more; both factors are printed in the readout. Everything else — the frequency, the sweep, the amplitude, the polarisation pattern, the time left — is computed from the two masses and the separation, twice, by routes that share no arithmetic.'
    };
  },

  /* ----------------------------------------------------------- controls --- */
  controls(){
    const st = ST, S = STAGES.rlWave, B = S.curOf(st);
    const opts = Object.keys(GW_BINARIES).map(k => [k, GW_BINARIES[k].nm])
                       .concat([['custom', 'your own binary']]);
    return rlSeg('rlWvB', st.key, opts) +
      ctlRow('mass m₁', ctlSlider('rlWvM1', 0.2, 100, 0.01, st.m1)) +
      ctlRow('mass m₂', ctlSlider('rlWvM2', 0.2, 100, 0.01, st.m2)) +
      ctlRow('separation', ctlSlider('rlWvA', 1.5, 9, 0.005, st.la)) +
      ctlRow('inclination', ctlSlider('rlWvI', 0, 90, 1, st.inc)) +
      ctlRow('distance', ctlSlider('rlWvD', -6, 4, 0.05, st.ld)) +
      ctlRow('drawn strain', ctlSlider('rlWvX', 0.02, 0.5, 0.01, st.amp)) +
      rlClockCtl() +
      `<p class="help">Two masses in solar masses and one separation, and everything else follows.
      <b>The separation and distance sliders carry the exponent</b>, because a binary's scale runs
      from hundreds of kilometres to an astronomical unit: the box takes <b>log(1.95e6)</b> as
      readily as 6.29, and the reading beside it is in kilometres. Inclination is measured from
      face-on: at 0° the two polarisations are equal and in quadrature, so the ring turns; at 90°
      the wave is <b>purely</b> h₊ at half the amplitude, and no binary can produce h× on its own.
      The drawn strain is about 10²⁰ times life-size and the ring is slowed by a similar factor —
      both are printed below. Move any slider and the picker switches to <b>your own binary</b>.</p>`;
  },

  wire(){
    const S = STAGES.rlWave;
    rlWireSeg('rlWvB', v => {
      ST.key = v;
      if(GW_BINARIES[v]) S.load(ST, GW_BINARIES[v]);
      ST.cacheKey = ''; S.recompute(ST); buildStagePanel();
    });
    /* every numeric edit makes the binary the reader's own, and says so in the
       picker without rebuilding the panel out from under the drag */
    const own = () => { if(ST.key !== 'custom'){ ST.key = 'custom'; gwMarkOwn(); } };
    wireSlider('rlWvM1', () => ST.m1, v => { ST.m1 = Math.max(1e-9, v); own(); S.recompute(ST); },
               v => fmtNum(+v, 4) + ' M☉');
    wireSlider('rlWvM2', () => ST.m2, v => { ST.m2 = Math.max(1e-9, v); own(); S.recompute(ST); },
               v => fmtNum(+v, 4) + ' M☉');
    wireSlider('rlWvA', () => ST.la, v => { ST.la = v; own(); S.recompute(ST); },
               v => {
                 const km = Math.pow(10, +v);
                 const M = gwMs(Math.max(1e-12, ST.m1)) + gwMs(Math.max(1e-12, ST.m2));
                 const f = gwFgwOf(M, gwLs(km * 1000));
                 return fmtSig(km, 4) + ' km  ·  f = ' + (Number.isFinite(f) ? fmtSig(f, 4) : '—') + ' Hz';
               });
    wireSlider('rlWvI', () => ST.inc, v => { ST.inc = v; S.recompute(ST); },
               v => fmtNum(+v, 3) + '°  ·  ' + (+v < 15 ? 'nearly face-on' : +v > 75 ? 'nearly edge-on' : 'tilted'));
    wireSlider('rlWvD', () => ST.ld, v => { ST.ld = v; own(); S.recompute(ST); },
               v => {
                 const mpc = Math.pow(10, +v);
                 return mpc < 1e-3 ? fmtSig(mpc * 1e6, 4) + ' pc'
                      : mpc < 1 ? fmtSig(mpc * 1e3, 4) + ' kpc'
                      : fmtSig(mpc, 4) + ' Mpc  ·  ' + fmtSig(mpc * 3.2616, 4) + ' Mly';
               });
    wireSlider('rlWvX', () => ST.amp, v => { ST.amp = v; },
               v => '×' + fmtNum(+v, 3) + ' (exaggerated)');
    rlWireClock();
  },

  /* -------------------------------------------------------------- frame --- */
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const O = st.O;
    if(!O){ rlText(ctx, W / 2, H / 2, 'no binary to draw yet', rgbCss(TH.faint), '13px ' + FONT_UI, 'center'); return; }

    /* ===================== left top: a ring of test masses ================
       The left column carries two pictures stacked, and both their sizes come
       from H rather than from a constant — at the app's usual 415 px canvas
       there is barely room for two, and ./auditsize.ps1 sweeps eight shapes.
       Everything starts below y = 104 because the readout chip floats over the
       top-left corner: a caption drawn under it is drawn, unreadable, and
       reported by nothing but auditticks. */
    const colTop = 104, colBot = H - 30;
    const blockH = Math.max(60, (colBot - colTop) / 2);
    const cx = W * 0.19;
    const R = Math.max(16, Math.min(W * 0.115, (blockH - 58) / 2));
    const cy = colTop + 20 + R;
    const ph = st.t * 2.2;
    const pmax = Math.max(O.patP, Math.abs(O.patC), 1e-12);
    const hp = st.amp * (O.patP / pmax) * Math.cos(ph);
    const hc = st.amp * (O.patC / pmax) * Math.sin(ph);
    rlText(ctx, cx, colTop + 10, 'a ring of free test masses',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    ctx.strokeStyle = rgbCss(TH.faint, 0.45); ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i = 0; i <= 120; i++){
      const A = i / 120 * 2 * Math.PI;
      const d = gwDisplace(Math.cos(A), Math.sin(A), hp, hc);
      const X = cx + d.x * R, Y = cy - d.y * R;
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.closePath(); ctx.stroke();
    for(let i = 0; i < 16; i++){
      const A = i / 16 * 2 * Math.PI;
      const d = gwDisplace(Math.cos(A), Math.sin(A), hp, hc);
      rlDot(ctx, cx + d.x * R, cy - d.y * R, 3.5, rgbCss(TH.pos));
    }
    for(const [ax, ay] of [[1, 0], [0, 1]]){
      const d = gwDisplace(ax, ay, hp, hc);
      rlSegment(ctx, cx, cy, cx + d.x * R, cy - d.y * R, rgbCss(TH.grad), 2.4);
    }
    rlText(ctx, cx, cy + R + 15, 'the two interferometer arms',
           rgbCss(TH.grad), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, cx, cy + R + 29,
      O.ok ? 'h₊ = ' + fmtSig(O.wave.ampP, 3) + '   h× = ' + fmtSig(O.wave.ampC, 3)
           : 'no wave to draw',
      rgbCss(TH.curl), '11px ' + FONT_MONO, 'center');

    /* ===================== left bottom: the binary itself ================= */
    const bx = cx;
    const BR = Math.max(14, Math.min(W * 0.10, (blockH - 62) / 2));
    const by = colTop + blockH + 24 + BR;
    const span = Math.max(O.a, O.aI) * 1.25;
    const s = BR / span;
    rlText(ctx, bx, by - BR - 12, 'the separation now, and where it ends',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    /* TWO CIRCLES THAT MEAN THE SAME THING, so that they can be compared: the
       separation now, and the separation at which the model ends. Drawing only
       the second one was wrong in a way a screenshot caught — the bodies orbit
       at HALF the separation each, so an ISCO circle alone sits outside both of
       them and the picture reads as though the binary were already inside it. */
    ctx.strokeStyle = rgbCss(TH.faint, 0.7); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(bx, by, O.a * s, 0, 6.2832); ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.warn, 0.75); ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(bx, by, O.aI * s, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    /* each body's own circle about the common centre — the heavier one moves
       less, in the ratio of the masses, which is what the picture is for */
    const th = ph / 2;                       // half the wave phase: the factor of two, drawn
    const f1 = O.m2 / O.M, f2 = O.m1 / O.M;  // body 1 orbits at (m₂/M)a
    for(const [fr, col] of [[f1, TH.pos], [f2, TH.grad]]){
      ctx.strokeStyle = rgbCss(col, 0.30); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(bx, by, O.a * s * fr, 0, 6.2832); ctx.stroke();
    }
    const x1 = bx + O.a * s * f1 * Math.cos(th), y1 = by - O.a * s * f1 * Math.sin(th);
    const x2 = bx - O.a * s * f2 * Math.cos(th), y2 = by + O.a * s * f2 * Math.sin(th);
    rlSegment(ctx, x1, y1, x2, y2, rgbCss(TH.faint, 0.75), 1);
    const rad = m => Math.max(2.5, Math.min(9, 3.2 * Math.cbrt(gwSolar(m))));
    rlDot(ctx, x1, y1, rad(O.m1), rgbCss(TH.pos));
    rlDot(ctx, x2, y2, rad(O.m2), rgbCss(TH.grad));
    rlDot(ctx, bx, by, 1.5, rgbCss(TH.faint));
    rlText(ctx, bx, by + BR + 15,
      fmtSig(st.m1, 4) + ' + ' + fmtSig(st.m2, 4) + ' M☉  ·  ' + gwFmtLen(Math.pow(10, st.la)),
      rgbCss(TH.dim), '10.5px ' + FONT_MONO, 'center');
    rlText(ctx, bx, by + BR + 29, 'ISCO at ' + gwFmtLen(gwSm(O.aI) / 1000),
           rgbCss(TH.warn), '10px ' + FONT_MONO, 'center');

    if(!O.ok){
      rlText(ctx, W * 0.68, H * 0.45, 'inside the innermost stable circular orbit —',
             rgbCss(TH.warn), '13px ' + FONT_UI, 'center');
      rlText(ctx, W * 0.68, H * 0.45 + 20, 'there is no inspiral left to integrate',
             rgbCss(TH.warn), '13px ' + FONT_UI, 'center');
      stageNote(ctx, 'move the separation slider outwards', W, H);
      return;
    }

    /* ===================== right top: the chirp, two routes =============== */
    const px = W * 0.42, pw = W * 0.54;
    const pTop = 46, pH = (H - 150) * 0.52;
    const run = O.run;
    /* THE AXIS IS TIME TO COALESCENCE, not time to the ISCO, and the difference
       is not cosmetic. Two binaries with the same chirp mass follow the same
       f(τ_coal) exactly and stop at different places; plotted against time to
       their OWN ISCO the identity is destroyed by the shift, and the twin drawn
       below separated from the track by a visible gap that is an artefact of
       the x variable. In τ_coal the degeneracy is what it is — one curve, two
       endpoints — and there is no dead zone to trim either: the run's grid is
       geometric in exactly this variable.
       τ_coal for route A is its own remaining time plus what the model says is
       left below the ISCO; the measurement of ḟ never uses it. */
    const tauA = new Float64Array(run.n + 1), fA = new Float64Array(run.n + 1);
    for(let i = 0; i <= run.n; i++){
      /* run.tau, not run.t[n] − run.t[i]: at 5×10¹⁶ s one ulp is eight seconds
         and that difference has no digits left in it (46d) */
      tauA[i] = Math.log10(Math.max(1e-30, run.tau[i] + O.tIsco));
      fA[i] = Math.log10(run.f[i]);
    }
    const xHi = tauA[0], xLo = Math.min(Math.log10(O.tIsco * 0.75), xHi - 0.3);
    const iCut = run.n;
    const yLo = Math.log10(O.fgw), yHi = Math.log10(O.fIsco);
    const P = mkPlot(px, pTop, pw, pH, xHi, xLo, yLo - (yHi - yLo) * 0.10, yHi + (yHi - yLo) * 0.10);
    plotFrame(ctx, P, 'time to coalescence  (s)', 'wave frequency  (Hz)',
      'The chirp — integrated (dots) against the closed form (line)');
    const xs = rlTickStep(Math.abs(xHi - xLo), 4), xt = [];
    for(let v = Math.ceil(Math.min(xHi, xLo) / xs) * xs; v <= Math.max(xHi, xLo) + 1e-12; v += xs) xt.push(v);
    plotTicksX(ctx, P, xt, v => fmtSig(Math.pow(10, v), 2));
    const ys = rlTickStep(Math.abs(P.y1 - P.y0), 4), yt = [];
    for(let v = Math.ceil(P.y0 / ys) * ys; v <= P.y1 + 1e-12; v += ys) yt.push(v);
    rlYTicks(ctx, P, yt, v => fmtSig(Math.pow(10, v), 3));
    /* ROUTE B: f(τ_coal) in closed form, and nothing else in it */
    const NB = 160, xsB = new Float64Array(NB), ysB = new Float64Array(NB);
    const xBlo = Math.log10(O.tIsco);          // the line stops where the model does
    for(let i = 0; i < NB; i++){
      const lx = xHi + (xBlo - xHi) * i / (NB - 1);
      xsB[i] = lx;
      ysB[i] = Math.log10(gwFgwOfTau(O.Mc, Math.pow(10, lx)));
    }
    rlLine(ctx, P, xsB, ysB, rgbCss(TH.curl), 2.4);
    /* THE DEGENERACY, drawn: the equal-mass binary with the same chirp mass
       follows the identical curve — so it is dashed over the top of it — and
       differs only in where it STOPS, because the ISCO is set by the total
       mass. The two endpoints are marked, and they are the whole difference
       between a pair of masses a detector can tell apart and one it cannot. */
    const tw = O.twin, twIsco = gwTcoalOf(tw.m1, tw.m2, gwSepIsco(tw.M));
    const NT = 90, xsT = new Float64Array(NT), ysT = new Float64Array(NT);
    const xTlo = Math.log10(twIsco);
    for(let i = 0; i < NT; i++){
      const lx = xHi + (Math.max(xTlo, xLo) - xHi) * i / (NT - 1);
      xsT[i] = lx;
      ysT[i] = Math.log10(gwFgwOfTau(gwChirpMassS(tw.m1, tw.m2), Math.pow(10, lx)));
    }
    rlLine(ctx, P, xsT, ysT, rgbCss(TH.accent, 0.9), 1.6, [5, 4]);
    if(xTlo > xLo)
      rlDot(ctx, P.X(xTlo), P.Y(Math.log10(gwFgwIsco(tw.M))), 4, rgbCss(TH.accent));
    rlDot(ctx, P.X(Math.log10(O.tIsco)), P.Y(yHi), 4, rgbCss(TH.warn));
    /* ROUTE A: the integrated track, thinned to a readable number of dots —
       and thinned EVENLY IN X rather than by index. The grid is geometric in
       the time to coalescence, which is not the axis, so every third dot of an
       index stride lands in the same pixel column near the end. */
    let j = 0;
    for(let k = 0; k <= 44; k++){
      const xt2 = xHi + (xLo - xHi) * k / 44;
      while(j < iCut && tauA[j] > xt2) j++;
      if(j > iCut) break;
      rlDot(ctx, P.X(tauA[j]), P.Y(fA[j]), 3, rgbCss(TH.pos));
    }
    rlText(ctx, P.px + P.pw - 6, P.py + 12,
      'ISCO — ' + fmtSig(O.fIsco, 4) + ' Hz', rgbCss(TH.warn), '10px ' + FONT_MONO, 'right');

    /* ===================== right bottom: the waveform ===================== */
    const qTop = pTop + pH + 58, qH = (H - 150) * 0.48 - 10;
    const Wv = O.wave, amp = Math.max(Wv.ampP, Wv.ampC, 1e-40);
    const tScale = Wv.T < 1e-3 ? 1e6 : Wv.T < 1 ? 1e3 : 1;
    const tUnit = tScale === 1e6 ? 'µs' : tScale === 1e3 ? 'ms' : 's';
    const Q = mkPlot(px, qTop, pw, qH, 0, Wv.T * tScale, -1.25 * amp, 1.25 * amp);
    plotFrame(ctx, Q, 'time  (' + tUnit + ')', 'strain  h',
      'One orbit — and the wave goes round twice, measured');
    plotZeroY(ctx, Q);
    const qxs = rlTickStep(Wv.T * tScale, 4), qxt = [];
    for(let v = 0; v <= Wv.T * tScale + 1e-12; v += qxs) qxt.push(v);
    plotTicksX(ctx, Q, qxt, v => fmtTick(v, qxs));
    const qys = rlTickStep(2.5 * amp, 4), qyt = [];
    for(let v = Math.ceil(-1.25 * amp / qys) * qys; v <= 1.25 * amp; v += qys) qyt.push(v);
    rlYTicks(ctx, Q, qyt, v => fmtSig(v, 2));
    /* the waveform is computed at 400 samples because the amplitude is measured
       off it and the derivative's error goes as n⁻⁴; it is DRAWN at half that,
       because two sine waves across 700 pixels resolve no more and a path op is
       a path op — the class auditperf cannot see (a 22 000-point stroke is one
       paint call and a real cost). */
    const wStride = 2, wn = Math.floor(Wv.n / wStride);
    const tt = new Float64Array(wn), dp = new Float64Array(wn), dc = new Float64Array(wn);
    for(let i = 0; i < wn; i++){
      tt[i] = Wv.t[i * wStride] * tScale;
      dp[i] = Wv.hp[i * wStride]; dc[i] = Wv.hc[i * wStride];
    }
    rlLine(ctx, Q, tt, dp, rgbCss(TH.grad), 2);
    rlLine(ctx, Q, tt, dc, rgbCss(TH.pos), 1.6);
    /* the closed-form amplitude, as the line the measurement has to land on */
    rlSegment(ctx, Q.px, Q.Y(O.hClosed * O.patP), Q.px + Q.pw, Q.Y(O.hClosed * O.patP),
              rgbCss(TH.curl, 0.85), 1.3, [5, 4]);
    rlText(ctx, Q.px + 6, Q.Y(O.hClosed * O.patP) - 8,
      'the closed-form amplitude, for the measurement to land on',
      rgbCss(TH.curl), '10px ' + FONT_MONO);

    stageNote(ctx, O.B.nm + '  ·  ' + fmtSig(O.fgw, 4) + ' Hz now  ·  ' +
      gwFmtTime(O.tc) + ' to merger  ·  ' +
      (Number.isFinite(O.run.cycles) ? fmtSig(O.run.cycles, 4) : fmtSig(O.cyclesB, 4)) +
      ' wave cycles left', W, H);
  },

  /* ------------------------------------------------------------ readout --- */
  readout(st){
    this.recompute(st);
    const O = st.O;
    if(!O) return `<div class="card tight"><div class="ttl">No binary</div>
      <p class="help">Choose a system, or set two masses and a separation.</p></div>`;
    const B = O.B;
    if(!O.ok) return `<div class="card tight"><div class="ttl">${B.nm}</div>
      ${kv('masses', fmtSig(st.m1, 4) + ' + ' + fmtSig(st.m2, 4) + ' M☉')}
      ${kv('separation asked for', gwFmtLen(Math.pow(10, st.la)))}
      ${kv('innermost stable circular orbit', gwFmtLen(gwSm(O.aI) / 1000))}
      <p class="help" style="color:var(--c-warn)">There is no inspiral to compute: ${O.why}</p></div>`;

    const orbitsLeft = O.run.orbits;
    const vOrb = Math.cbrt(Math.PI * O.M * O.fgw);          // v/c of the relative orbit
    const cyc = Number.isFinite(O.run.cycles)
      ? fmtAgree(O.run.cycles, O.cyclesB, 'cycles')
      : 'the cycle count is not available — ' + O.run.phaseWhy;

    return `<div class="card tight"><div class="ttl">${B.nm}</div>
      ${kv('what it is', B.sub)}
      ${kv('component masses', fmtSig(st.m1, 5) + ' + ' + fmtSig(st.m2, 5) + ' M☉')}
      ${kv('total mass', fmtSig(gwSolar(O.M), 6) + ' M☉')}
      ${kv('chirp mass (m₁m₂)<sup>3/5</sup>/(m₁+m₂)<sup>1/5</sup>', fmtSig(gwSolar(O.Mc), 6) + ' M☉')}
      ${kv('mass ratio m₂/m₁', fmtSig(Math.min(st.m1, st.m2) / Math.max(st.m1, st.m2), 4))}
      ${kv('separation', gwFmtLen(Math.pow(10, st.la)))}
      ${kv('orbital period', gwFmtTime(O.period))}
      ${kv('orbital speed', fmtSig(vOrb, 4) + ' c')}
      ${kv('wave frequency (twice the orbital)', fmtSig(O.fgw, 6) + ' Hz')}
      ${kv('innermost stable circular orbit', gwFmtLen(gwSm(O.aI) / 1000) + '  ·  ' + fmtSig(O.fIsco, 5) + ' Hz')}
      ${kv('time to merger', gwFmtTime(O.tc))}
      ${kv('orbits left', fmtSig(orbitsLeft, 5))}
      <p class="help">${supify(B.note)}</p>
    </div>
    <div class="card tight"><div class="ttl">Reading the masses off the waveform</div>
      ${kv('ḟ now — measured off the integrated track', fmtSig(O.fdotMeas, 8) + ' Hz/s')}
      ${kv('ḟ now — the closed-form chirp relation', fmtSig(O.fdotB, 8) + ' Hz/s')}
      ${kv('difference between the two routes', fmtAgree(O.fdotMeas, O.fdotB, 'Hz/s'))}
      ${kv('chirp mass recovered from (f, ḟ)', fmtSig(gwSolar(O.mcMeas), 8) + ' M☉')}
      ${kv('chirp mass from the two masses', fmtSig(gwSolar(O.Mc), 8) + ' M☉')}
      ${kv('difference', fmtAgree(O.mcMeas, O.Mc, 'M☉'))}
      ${kv('worst over the whole track', O.fd.ok ? fmtGap(O.fd.worst * O.Mc, O.Mc, 'M☉') : 'no track')}
      ${kv('measured slope of log ḟ against log f', fmtSig(O.slope, 9) + '  against 11/3 = 3.66666667')}
      ${kv('wave cycles left — integrated against ∫f dt', cyc)}
      <p class="help">This is the whole of gravitational-wave astronomy in one card. The track on the
      right was integrated from <b>ȧ = −(64/5)m₁m₂M/a³</b>, which knows the two masses separately and
      has never heard of a chirp mass; the frequency at each sample is Kepler's, and the sweep rate is
      then <b>differenced off that track</b> exactly as a detector differences a waveform. Inverting the
      chirp relation on the result returns the chirp mass to ${O.fd.ok ? fmtSig(O.fd.worst, 2) : '—'}
      relative — and it is the same number as (m₁m₂)<sup>3/5</sup>/(m₁+m₂)<sup>1/5</sup>, which is
      <i>why</i> a detector can weigh a binary a billion light years away without knowing anything else
      about it.</p>
    </div>
    <div class="card tight"><div class="ttl">The wave that arrives, from the quadrupole</div>
      ${kv('h₊ amplitude — from the quadrupole moment', fmtSig(O.wave.ampP, 6))}
      ${kv('h₊ amplitude — 4Mc<sup>5/3</sup>(πf)<sup>2/3</sup>(1+cos²ι)/2 / D', fmtSig(O.hClosed * O.patP, 6))}
      ${kv('difference', fmtAgreeGross(O.wave.ampP, O.hClosed * O.patP, O.hClosed))}
      ${kv('h× amplitude — measured', fmtSig(O.wave.ampC, 6))}
      ${kv('h× amplitude — h₀ cos ι', fmtSig(O.hClosed * O.patC, 6))}
      ${kv('difference', fmtAgreeGross(O.wave.ampC, O.hClosed * O.patC, O.hClosed))}
      ${kv('zero crossings of h₊ per orbit', String(O.wave.crossings) + ' — so the wave turns twice')}
      ${kv('wave frequency counted off the waveform', fmtSig(O.wave.fMeas, 8) + ' Hz')}
      ${kv('against twice the orbital frequency', fmtAgree(O.wave.fMeas, O.fgw, 'Hz'))}
      ${kv('distance', fmtSig(Math.pow(10, st.ld), 4) + ' Mpc  =  ' + fmtSig(Math.pow(10, st.ld) * 3.2616, 4) + ' million ly')}
      ${kv('arm-length change in a 4 km arm', fmtSig(O.wave.ampP * 4000, 4) + ' m')}
      ${kv('  as a fraction of a proton radius', fmtSig(O.wave.ampP * 4000 / (R_PROTON * 1e-15), 4))}
      ${kv('drawn here at', '×' + fmtSig(st.amp / Math.max(1e-40, O.wave.ampP), 4) +
            ', and slowed by ×' + fmtSig(O.fgw / 0.35, 4))}
      <p class="help">Nothing in the left-hand column of this card came from a strain formula. The two
      bodies' positions are turned into the mass quadrupole moment <b>I<sub>ij</sub></b>, that is
      differentiated <b>twice numerically</b>, and the result is projected onto the polarisation basis
      of a line of sight ${fmtSig(st.inc, 3)}° from face-on. The amplitude then agrees with the closed
      form to the accuracy of the derivative, the two polarisations come out in the ratio
      <b>2cos ι : 1+cos²ι</b>, and the frequency doubling is <i>counted</i> — four zero crossings per
      orbit — rather than asserted. Edge-on, h× vanishes exactly: a binary cannot radiate a pure cross
      polarisation, because that is the plus pattern rotated by 45°, not a different source.</p>
    </div>
    <div class="card tight"><div class="ttl">The power, and why it took a century</div>
      ${kv('luminosity in gravitational waves', fmtSig(O.lum * GW_LUM_W, 5) + ' W')}
      ${kv('  in units of the Sun\'s light', fmtSig(O.lum * GW_LUM_W / GW_LSUN_W, 4) + ' L☉')}
      ${kv('  as a fraction of c⁵/G', fmtSig(O.lum, 4))}
      ${kv('orbit shrinking at', fmtSig(gwSm(Math.abs(gwAdotOf(O.m1, O.m2, O.a))) * 365.25 * 86400, 4) + ' m/year')}
      ${kv('monopole radiation', 'forbidden — mass is conserved')}
      ${kv('dipole radiation', 'forbidden — momentum is conserved')}
      ${kv('leading multipole', 'quadrupole, and it is feeble')}
      ${kv('polarisation states', '2 — the + and × above, at 45° to each other')}
      ${kv('speed', 'c, to 1 part in 10¹⁵  (GW170817 against its gamma-ray burst)')}
      <p class="help">The ceiling on the last row but four is worth noticing: <b>c⁵/G = 3.63×10⁵² W</b>
      is a luminosity built from constants alone, and no source can exceed it by much. A binary at its
      last orbit reaches a few thousandths of it — which is why the merger of two black holes briefly
      outshines every star in the observable universe put together, and why nothing gentler is
      detectable at all. A spinning dumbbell in a laboratory radiates about 10⁻³⁰ watts. There is no
      terrestrial source and there never will be.</p>
    </div>`;
  },

  chip(st){
    const O = st.O;
    if(!O || !O.ok) return `<div class="k">Gravitational waves</div>
      <div style="color:var(--c-warn)">inside the ISCO</div>`;
    return `<div class="k">${O.B.nm}</div>
      <div style="color:var(--c-curl)">f = ${fmtSig(O.fgw, 5)} Hz</div>
      <div style="color:var(--c-grad)">h = ${fmtSig(O.wave.ampP, 4)}</div>`;
  },

  legend(){ return [['var(--c-curl)', 'the distorted ring, and the closed-form chirp'],
                    ['var(--c-pos)', 'the test masses, h×, and the integrated track'],
                    ['var(--c-grad)', 'the interferometer arms, and h₊'],
                    ['var(--accent)', 'the equal-mass binary of the same chirp mass'],
                    ['var(--faint)', 'the undisturbed ring, and the present orbit'],
                    ['var(--c-warn)', 'the innermost stable circular orbit']]; }
};
