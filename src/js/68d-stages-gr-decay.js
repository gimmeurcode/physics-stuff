/* ============================================================================
   4f'''' · THE RELATIVITY WING — THE ORBIT THAT DECAYS
   Programme A item 5's second half, 2026-08-18. rlWave takes a circular binary
   and measures what it radiates; this one takes an ECCENTRIC one and measures
   what that costs — which is the difference between a formula and the first
   evidence that gravitational waves exist.

   Hulse and Taylor found PSR B1913+16 in 1974 and have timed it ever since.
   Its orbit shrinks, and the shrinkage matches the quadrupole formula to a few
   parts in a thousand: that agreement, published a decade before LIGO was
   funded, is why anybody believed in these waves at all. The number cannot be
   got without the eccentricity — 0.617 multiplies the radiated power by
   11.86 — so a panel that ignored it would be out by an order of magnitude.

   THE TWO ROUTES, and they share nothing but Kepler:

     ROUTE A  gwAvgPower integrates the INSTANTANEOUS Peters–Mathews power
              P = (8/15)(m₁²m₂²/r⁴)(12v² − 11ṙ²) round one Keplerian ellipse,
              with dt = (r²/h)dφ. No enhancement factor appears in it.
     ROUTE B  the closed form (32/5)(m₁²m₂²M/a⁵)·F(e) with Peters' 1964
              F(e) = (1 + 73e²/24 + 37e⁴/96)/(1−e²)^(7/2).

   They agree to 10⁻¹² at every eccentricity the slider reaches. The period
   decay is then computed BOTH ways as well — the textbook Ṗ against
   (3/2)P·ȧ/a fed from the quadrature — and both are compared with what the
   timing campaigns actually measured, which is the only comparison in this
   wing where the second number came from a telescope.

   Two things the picture is for. The power is concentrated at pericentre by a
   factor of a few thousand at e = 0.9, which is why F(e) diverges as
   (1−e²)^(−7/2); and the orbit ROUNDS as it shrinks, because the ENERGY loss is
   enhanced by F(e) while the angular-momentum loss is enhanced by only
   G(e) = (1+7e²/8)/(1−e²)² — 11.86 against 3.48 at Hulse–Taylor's eccentricity.
   Since 1 − e² = L²/(μ²Ma), an orbit whose a falls faster than its L does is an
   orbit whose eccentricity falls. By the time this system enters LIGO's band
   its eccentricity is a millionth and every waveform model may assume a circle.
   ============================================================================ */

STAGES.rlDecay = {
  title: 'The orbit that decays',
  dockLegend: true,

  curOf(st){
    const B = st.key !== 'custom' ? GW_BINARIES[st.key] : null;
    return { nm: B ? B.nm : 'your own binary',
             sub: B ? B.sub : 'two masses, a period and an eccentricity you chose',
             src: B, own: !B,
             note: B ? B.note :
               'Your own binary. The radiated power is averaged round the ellipse by quadrature and again in closed form, and the period decay that follows is computed both ways — nothing about the eccentricity is assumed.' };
  },

  load(st, B){
    st.m1 = B.m1; st.m2 = B.m2;
    st.lp = Math.log10(gwBinaryPeriod(B) / 86400);      // period, in log₁₀ days
    st.ecc = B.e || 0;
  },

  enter(st, o){
    st.key = o.key || 'psr1913';
    this.load(st, GW_BINARIES[st.key] || GW_BINARIES.psr1913);
    if(o.m1  !== undefined) st.m1 = o.m1;
    if(o.m2  !== undefined) st.m2 = o.m2;
    if(o.pd  !== undefined) st.lp = Math.log10(o.pd);
    if(o.ecc !== undefined) st.ecc = o.ecc;
    st.cacheKey = '';
    this.recompute(st);
  },

  recompute(st){
    const B = this.curOf(st);
    const key = [st.key, st.m1, st.m2, st.lp, st.ecc].join('|');
    if(st.cacheKey === key && st.O) return;
    st.cacheKey = key;
    const m1 = gwMs(Math.max(1e-12, st.m1)), m2 = gwMs(Math.max(1e-12, st.m2));
    const M = m1 + m2, P = Math.pow(10, st.lp) * 86400;
    const e = Math.min(0.99, Math.max(0, st.ecc));
    const a = gwSepOfPeriod(M, P);
    const O = { B, m1, m2, M, P, e, a, Mc: gwChirpMassS(m1, m2), aI: gwSepIsco(M) };
    O.ok = a > O.aI;
    if(!O.ok){
      O.why = 'that period puts the two bodies inside the innermost stable circular orbit at ' +
              gwFmtLen(gwSm(O.aI) / 1000) + ', where there is no orbit to decay.';
      st.O = O; return;
    }
    /* the two routes to the average power */
    O.avg   = gwAvgPower(m1, m2, a, e, 4096);
    O.enhB  = gwPetersF(e);
    O.circ  = gwLumOf(m1, m2, a);
    /* the two routes to the period decay */
    O.pdotB = gwPdotOf(m1, m2, P, e);
    O.pdotA = gwPdotAvg(m1, m2, P, e, 8192);
    /* the pericentre, the apocentre, and where the power actually goes */
    O.rp = a * (1 - e); O.ra = a * (1 + e);
    O.pPeri = gwPowerPM(m1, m2, a, e, 0);
    O.pApo  = gwPowerPM(m1, m2, a, e, Math.PI);
    /* the decay itself: Peters' coupled equations, and his closed-form a(e) */
    O.run = gwEccRun(m1, m2, a, e, { frac: 0.004 });
    O.tMergeCirc = gwTcoalOf(m1, m2, a);
    /* how far the closed-form trajectory and the integrated one part company */
    if(O.run.ok && e > 1e-4){
      let worst = 0;
      for(let i = 0; i <= O.run.n; i += 5){
        if(!(O.run.e[i] > 1e-4)) continue;
        const want = gwPetersAE(a, e, O.run.e[i]);
        if(Number.isFinite(want) && want > 0)
          worst = Math.max(worst, Math.abs(O.run.a[i] - want) / want);
      }
      O.aeGap = worst;
      /* the eccentricity left when the wave reaches 10 Hz — the number every
         waveform model quietly assumes is zero */
      const aBand = gwSepOfFgw(M, 10);
      O.eAtBand = NaN;
      for(let i = 0; i <= O.run.n; i++)
        if(O.run.a[i] <= aBand){ O.eAtBand = O.run.e[i]; break; }
    } else {
      /* an orbit that starts circular has nothing to circularise, and saying
         "it never gets there" — which is what a bare NaN produced — is a
         different statement from "it is already round" */
      O.aeGap = NaN; O.eAtBand = e <= 1e-4 ? 0 : NaN;
    }
    /* the observed decay, where somebody measured one */
    O.obs = B.src && B.src.pdotObs !== undefined ? B.src.pdotObs : NaN;
    st.O = O;
  },

  /* ------------------------------------------------------------- derive --- */
  derive(st){
    const O = st.O, B = this.curOf(st);
    return {
      title:'The first evidence — an orbit paying for its own radiation',
      steps:[
        drvSay('a pulsar is a clock, and a binary pulsar is a clock in an orbit',
          'PSR B1913+16 spins seventeen times a second and its pulses arrive with a regularity that rivals an atomic clock. Put that clock in an eight-hour orbit and every orbital parameter becomes measurable to absurd precision — including whether the orbit is shrinking.'),
        drvStep('the instantaneous power, at true anomaly φ',
          `${dv('P')} ${dop('=')} ${dfrac('8', '15')}·${dfrac(dv('m₁') + '²' + dv('m₂') + '²', dv('r') + '⁴')}(12${dv('v')}² ${dop('−')} 11${dv('ṙ')}²)`,
          O && O.ok ? `at pericentre that is ${fmtSig(O.pPeri / Math.max(1e-300, O.pApo), 4)} times its value at apocentre` : '—'),
        drvSay('so an eccentric orbit radiates in pulses, not steadily',
          'The power goes as r⁻⁴ times a velocity term, and a body at pericentre is both closest and fastest. Almost the whole emission of an eccentric binary happens in the small fraction of the period spent near closest approach, which is why eccentricity matters so much more than it looks as if it should.'),
        drvStep('averaged round one orbit',
          `⟨${dv('P')}⟩ ${dop('=')} ${dfrac('32', '5')}·${dfrac(dv('m₁') + '²' + dv('m₂') + '²' + dv('M'), dv('a') + '⁵')}·${dv('F')}(${dv('e')})`,
          O && O.ok ? `the panel does that integral numerically and gets F = ${fmtSig(O.avg.enh, 9)}` : '—'),
        drvStep("and Peters' 1964 closed form says what F must be",
          `${dv('F')}(${dv('e')}) ${dop('=')} ${dfrac('1 + 73' + dv('e') + '²/24 + 37' + dv('e') + '⁴/96', '(1 ' + dop('−') + ' ' + dv('e') + '²)^(7/2)')}`,
          O && O.ok ? `= ${fmtSig(O.enhB, 9)} — the two agree to ${fmtSig(Math.abs(O.avg.enh - O.enhB) / O.enhB, 2)} relative` : '—'),
        drvStep('the orbit pays in period, not in energy',
          `${dfrac(dv('Ṗ'), dv('P'))} ${dop('=')} ${dfrac('3', '2')}·${dfrac(dv('ȧ'), dv('a'))}`,
          'Kepler’s third law turns a shrinking orbit into a shortening period, which is what a timing campaign sees'),
        drvStep('so the prediction is one line',
          `${dv('Ṗ')} ${dop('=')} ${dop('−')}${dfrac('192π', '5')}(2π${dv('M')}_c/${dv('P')})^(5/3)${dv('F')}(${dv('e')})`,
          O && O.ok ? `here ${fmtSig(O.pdotB, 6)} s/s` : '—'),
        drvSay('and it was measured before anybody had detected a wave',
          'Taylor and Weisberg reported the orbital decay of PSR B1913+16 in 1979, agreeing with general relativity within the errors, and the agreement has tightened ever since. Hulse and Taylor were given the Nobel prize for it in 1993 — twenty-two years before a wave was caught directly. The double pulsar J0737−3039 has since pushed the same test to four parts in a hundred thousand.'),
        drvSay('the orbit also rounds itself out on the way in',
          'The energy loss is enhanced by F(e) and the angular-momentum loss by only G(e) = (1+7e²/8)/(1−e²)² — 11.86 against 3.48 for Hulse–Taylor — so the orbit shrinks faster than it sheds angular momentum. Since 1 − e² = L²/(μ²Ma), that is exactly the condition for the eccentricity to fall, and Peters\' two coupled equations are not independent: ė follows from ȧ and L̇ through the definition of e, which the test suite checks. By the time this system enters a ground-based detector\'s band its eccentricity is a millionth, which is why every inspiral waveform in use assumes a circle.')
      ],
      note:'The enhancement factor is computed twice — once by integrating the instantaneous power round the ellipse, once from Peters\' closed form — and the period decay that follows is compared with the value a timing campaign actually measured. That last comparison is against nature rather than against a second calculation, and it is the only one of its kind in this wing.'
    };
  },

  /* ----------------------------------------------------------- controls --- */
  controls(){
    const st = ST;
    const opts = ['psr1913', 'j0737', 'hmcnc', 'sunearth']
      .map(k => [k, GW_BINARIES[k].nm]).concat([['custom', 'your own binary']]);
    return rlSeg('rlDcB', st.key, opts) +
      ctlRow('mass m₁', ctlSlider('rlDcM1', 0.2, 100, 0.001, st.m1)) +
      ctlRow('mass m₂', ctlSlider('rlDcM2', 0.2, 100, 0.001, st.m2)) +
      ctlRow('period', ctlSlider('rlDcP', -5, 3, 0.01, st.lp)) +
      ctlRow('eccentricity', ctlSlider('rlDcE', 0, 0.95, 0.005, st.ecc)) +
      rlClockCtl() +
      `<p class="help">The <b>period slider carries the exponent</b>, in days: −2.5 is HM Cancri's five
      minutes and 2.56 is the Earth's year, and the box takes <b>log(0.322997)</b> as readily as −0.4909.
      Eccentricity is the control that matters — the radiated power carries
      <b>(1 + 73e²/24 + 37e⁴/96)/(1−e²)<sup>7/2</sup></b>, which is 1 at e = 0 and 11.86 at Hulse–Taylor's
      0.617, and the panel computes that factor by integrating round the ellipse rather than by using the
      formula. Move any slider and the picker switches to <b>your own binary</b>.</p>`;
  },

  wire(){
    const S = STAGES.rlDecay;
    rlWireSeg('rlDcB', v => {
      ST.key = v;
      if(GW_BINARIES[v]) S.load(ST, GW_BINARIES[v]);
      ST.cacheKey = ''; S.recompute(ST); buildStagePanel();
    });
    const own = () => {
      if(ST.key !== 'custom'){
        ST.key = 'custom';
        const s = $('rlDcB');
        if(s) for(const b of s.children) b.setAttribute('aria-pressed', String(b.dataset.v === 'custom'));
      }
    };
    wireSlider('rlDcM1', () => ST.m1, v => { ST.m1 = Math.max(1e-9, v); own(); S.recompute(ST); },
               v => fmtNum(+v, 5) + ' M☉');
    wireSlider('rlDcM2', () => ST.m2, v => { ST.m2 = Math.max(1e-9, v); own(); S.recompute(ST); },
               v => fmtNum(+v, 5) + ' M☉');
    wireSlider('rlDcP', () => ST.lp, v => { ST.lp = v; own(); S.recompute(ST); },
               v => gwFmtTime(Math.pow(10, +v) * 86400));
    wireSlider('rlDcE', () => ST.ecc, v => { ST.ecc = v; own(); S.recompute(ST); },
               v => fmtNum(+v, 4) + '  ·  F(e) = ' + fmtSig(gwPetersF(Math.min(0.99, +v)), 5));
    rlWireClock();
  },

  /* -------------------------------------------------------------- frame --- */
  frame(st, dt, ctx, W, H){
    this.recompute(st);
    const O = st.O;
    if(!O){ rlText(ctx, W / 2, H / 2, 'no binary to draw yet', rgbCss(TH.faint), '13px ' + FONT_UI, 'center'); return; }
    if(!O.ok){
      rlText(ctx, W / 2, H / 2, 'no orbit to decay — ' + O.why, rgbCss(TH.warn), '13px ' + FONT_UI, 'center');
      return;
    }

    /* ============ left: the ellipse, and where the power goes ============= */
    /* everything below y = 104 clears the readout chip, and three caption lines
       are reserved under the ellipse — the canvas is 415 px tall in the app and
       ./auditsize.ps1 sweeps eight shapes, so both come out of H */
    const colTop = 104, cx = W * 0.20;
    const RR = Math.max(30, Math.min(W * 0.155, (H - colTop - 112) / 2));
    const cy = colTop + 14 + RR;
    const s = RR / (O.ra * 1.08);
    rlText(ctx, cx, colTop - 2, 'one orbit, and where the radiation happens',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    /* the ellipse, in one path — r(φ) = a(1−e²)/(1+e cos φ) with the centre of
       mass at the focus, which is where the two bodies both orbit */
    const p = O.a * (1 - O.e * O.e);
    ctx.strokeStyle = rgbCss(TH.faint, 0.8); ctx.lineWidth = 1.4;
    ctx.beginPath();
    for(let i = 0; i <= 180; i++){
      const phi = i / 180 * 2 * Math.PI, r = p / (1 + O.e * Math.cos(phi));
      const X = cx + r * s * Math.cos(phi), Y = cy - r * s * Math.sin(phi);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    rlDot(ctx, cx, cy, 3, rgbCss(TH.warn));                 // the focus
    /* the emission, as dots whose area follows the instantaneous power —
       twenty-four fills rather than a hundred and eighty strokes, because a
       per-sample stroke in a frame() is the class auditperf exists for */
    let pMax = 0;
    for(let i = 0; i < 24; i++)
      pMax = Math.max(pMax, gwPowerPM(O.m1, O.m2, O.a, O.e, i / 24 * 2 * Math.PI));
    for(let i = 0; i < 24; i++){
      const phi = i / 24 * 2 * Math.PI, r = p / (1 + O.e * Math.cos(phi));
      const pw2 = gwPowerPM(O.m1, O.m2, O.a, O.e, phi) / Math.max(1e-300, pMax);
      rlDot(ctx, cx + r * s * Math.cos(phi), cy - r * s * Math.sin(phi),
            1.5 + 5.5 * Math.cbrt(pw2), rgbCss(TH.curl, 0.35 + 0.6 * Math.cbrt(pw2)));
    }
    /* the pair itself, at the phase the clock has reached — swept by area, so
       it lingers at apocentre and whips through pericentre, which is the whole
       point of the picture */
    const phiNow = gwEccPhase(O.e, (st.t * 0.18) % 1);
    const rNow = p / (1 + O.e * Math.cos(phiNow));
    const bx = cx + rNow * s * Math.cos(phiNow), by = cy - rNow * s * Math.sin(phiNow);
    rlSegment(ctx, cx, cy, bx, by, rgbCss(TH.grad, 0.5), 1);
    rlDot(ctx, bx, by, 5, rgbCss(TH.grad));
    /* three short lines rather than one long one: at 0.20W the centre is 254 px
       in, and a single line carrying both apsides in two units ran off the left
       edge of the canvas entirely */
    rlText(ctx, cx, cy + RR + 20, 'pericentre ' + fmtSig(gwSm(O.rp) / 1000, 4) + ' km',
           rgbCss(TH.dim), '10px ' + FONT_MONO, 'center');
    rlText(ctx, cx, cy + RR + 34, 'apocentre ' + fmtSig(gwSm(O.ra) / 1000, 4) + ' km',
           rgbCss(TH.dim), '10px ' + FONT_MONO, 'center');
    rlText(ctx, cx, cy + RR + 48,
      'peak power ' + fmtSig(O.pPeri / Math.max(1e-300, O.avg.avg), 4) + '× the orbit average',
      rgbCss(TH.curl), '10px ' + FONT_MONO, 'center');

    /* ============ right top: the power round one orbit =================== */
    const px = W * 0.44, pw = W * 0.52;
    const pTop = 46, pH = (H - 150) * 0.5;
    const N = 181, phis = new Float64Array(N), pows = new Float64Array(N);
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i < N; i++){
      const phi = -Math.PI + i / (N - 1) * 2 * Math.PI;
      phis[i] = phi * 180 / Math.PI;
      pows[i] = Math.log10(Math.max(1e-300, gwPowerPM(O.m1, O.m2, O.a, O.e, phi) / O.avg.avg));
      lo = Math.min(lo, pows[i]); hi = Math.max(hi, pows[i]);
    }
    const pad = Math.max(0.15, (hi - lo) * 0.12);
    const P1 = mkPlot(px, pTop, pw, pH, -180, 180, lo - pad, hi + pad);
    plotFrame(ctx, P1, 'true anomaly from pericentre  (degrees)', 'power ÷ orbit average',
      'Where the energy leaves — the emission is a pulse, not a hum');
    plotTicksX(ctx, P1, [-180, -90, 0, 90, 180], v => fmtTick(v, 90));
    const ys1 = rlTickStep(hi - lo + 2 * pad, 4), yt1 = [];
    for(let v = Math.ceil((lo - pad) / ys1) * ys1; v <= hi + pad; v += ys1) yt1.push(v);
    rlYTicks(ctx, P1, yt1, v => fmtSig(Math.pow(10, v), 3));
    rlLine(ctx, P1, phis, pows, rgbCss(TH.curl), 2.2);
    rlSegment(ctx, P1.px, P1.Y(0), P1.px + P1.pw, P1.Y(0), rgbCss(TH.pos, 0.85), 1.4, [5, 4]);
    rlText(ctx, P1.px + 8, P1.Y(0) - 8, 'the orbit average, by quadrature',
           rgbCss(TH.pos), '10px ' + FONT_MONO);

    /* ============ right bottom: F(e), two routes ========================= */
    const qTop = pTop + pH + 58, qH = (H - 150) * 0.5 - 12;
    const eMax = 0.95;
    const NF = 120, es = new Float64Array(NF), fs = new Float64Array(NF);
    for(let i = 0; i < NF; i++){
      es[i] = i / (NF - 1) * eMax;
      fs[i] = Math.log10(gwPetersF(es[i]));
    }
    const P2 = mkPlot(px, qTop, pw, qH, 0, eMax, 0, fs[NF - 1] * 1.05);
    plotFrame(ctx, P2, 'eccentricity  e', 'radiated power ÷ the circular value',
      'F(e) — the closed form (line) against the orbit integral (dots)');
    plotTicksX(ctx, P2, [0, 0.2, 0.4, 0.6, 0.8, eMax], v => fmtTick(v, 0.2));
    const ys2 = rlTickStep(P2.y1 - P2.y0, 4), yt2 = [];
    for(let v = 0; v <= P2.y1; v += ys2) yt2.push(v);
    rlYTicks(ctx, P2, yt2, v => fmtSig(Math.pow(10, v), 3));
    rlLine(ctx, P2, es, fs, rgbCss(TH.curl), 2.4);
    /* the quadrature, at sixteen eccentricities — the same routine the readout
       reports, run across the slider's whole range rather than at one point */
    for(let i = 0; i <= 16; i++){
      const ee = i / 16 * eMax;
      const num = gwAvgPower(O.m1, O.m2, O.a, ee, 1024).enh;
      rlDot(ctx, P2.X(ee), P2.Y(Math.log10(num)), 3, rgbCss(TH.pos));
    }
    /* and the reader's own eccentricity */
    rlSegment(ctx, P2.X(Math.min(O.e, eMax)), P2.py, P2.X(Math.min(O.e, eMax)), P2.py + P2.ph,
              rgbCss(TH.grad, 0.8), 1.4, [4, 4]);
    rlText(ctx, P2.X(Math.min(O.e, eMax)) + 6, P2.py + 14,
      'e = ' + fmtSig(O.e, 4) + '  ·  F = ' + fmtSig(O.enhB, 5),
      rgbCss(TH.grad), '10px ' + FONT_MONO);

    stageNote(ctx, O.B.nm + '  ·  Ṗ = ' + fmtSig(O.pdotB, 5) + ' s/s  ·  ' +
      (Number.isFinite(O.obs) ? 'observed ' + fmtSig(O.obs, 5) + ' s/s  ·  ' : '') +
      'merging in ' + gwFmtTime(O.run.ok ? O.run.tMerge : NaN), W, H);
  },

  /* ------------------------------------------------------------ readout --- */
  readout(st){
    this.recompute(st);
    const O = st.O;
    if(!O) return `<div class="card tight"><div class="ttl">No binary</div>
      <p class="help">Choose a system, or set two masses, a period and an eccentricity.</p></div>`;
    if(!O.ok) return `<div class="card tight"><div class="ttl">${O.B.nm}</div>
      <p class="help" style="color:var(--c-warn)">${O.why}</p></div>`;
    const B = O.B;
    const src = B.src || {};
    const adot = (2 / 3) * O.a * (O.pdotB / O.P);                 // ȧ/a = (2/3)Ṗ/P
    const mPerYear = gwSm(adot) * 365.25 * 86400;

    return `<div class="card tight"><div class="ttl">${B.nm}</div>
      ${kv('what it is', B.sub)}
      ${kv('component masses', fmtSig(st.m1, 6) + ' + ' + fmtSig(st.m2, 6) + ' M☉')}
      ${kv('chirp mass', fmtSig(gwSolar(O.Mc), 6) + ' M☉')}
      ${kv('orbital period', gwFmtTime(O.P))}
      ${kv('eccentricity', fmtSig(O.e, 6))}
      ${kv('semi-major axis', gwFmtLen(gwSm(O.a) / 1000))}
      ${kv('pericentre', gwFmtLen(gwSm(O.rp) / 1000))}
      ${kv('apocentre', gwFmtLen(gwSm(O.ra) / 1000))}
      <p class="help">${supify(B.note)}</p>
    </div>
    <div class="card tight"><div class="ttl">What eccentricity costs — two routes</div>
      ${kv('⟨P⟩ — the instantaneous power integrated round the ellipse', fmtSig(O.avg.avg * GW_LUM_W, 7) + ' W')}
      ${kv('⟨P⟩ — (32/5)m₁²m₂²M/a⁵ × F(e)', fmtSig(O.circ * O.enhB * GW_LUM_W, 7) + ' W')}
      ${kv('difference between the two routes', fmtAgree(O.avg.avg, O.circ * O.enhB, 'W'))}
      ${kv('F(e) measured by quadrature', fmtSig(O.avg.enh, 9))}
      ${kv('F(e) from (1+73e²/24+37e⁴/96)/(1−e²)<sup>7/2</sup>', fmtSig(O.enhB, 9))}
      ${kv('power at pericentre ÷ power at apocentre', fmtSig(O.pPeri / Math.max(1e-300, O.pApo), 5))}
      ${kv('peak ÷ average', fmtSig(O.pPeri / Math.max(1e-300, O.avg.avg), 5))}
      ${kv('the same enhancement for angular momentum, G(e)', fmtSig(gwPetersG(O.e), 6))}
      ${kv('F(e) ÷ G(e) — why the orbit rounds', fmtSig(O.enhB / gwPetersG(O.e), 5) +
           (O.e > 1e-6 ? '×, so a falls faster than L does' : ' — a circle stays a circle'))}
      <p class="help">The quadrature has no enhancement factor in it: it integrates
      <b>(8/15)(m₁²m₂²/r⁴)(12v² − 11ṙ²)</b> round one Keplerian ellipse with <b>dt = (r²/h)dφ</b> and
      divides by the period. Peters derived the closed form beside it in 1964. That the two agree to
      every digit either has is the check that this panel's headline number is a measurement and not a
      transcription — and the integrand is periodic and analytic, so the trapezoid converges
      geometrically and sixty-four panels already give twelve figures.</p>
    </div>
    <div class="card tight"><div class="ttl">The period decay${Number.isFinite(O.obs) ? ' — and what was measured' : ''}</div>
      ${kv('Ṗ — the closed form −(192π/5)(2πMc/P)<sup>5/3</sup>F(e)', fmtSig(O.pdotB, 8) + ' s/s')}
      ${kv('Ṗ — (3/2)P·ȧ/a from the quadrature above', fmtSig(O.pdotA, 8) + ' s/s')}
      ${kv('difference between the two routes', fmtAgree(O.pdotA, O.pdotB, 's/s'))}
      ${Number.isFinite(O.obs) ? kv('Ṗ — what the timing campaign measured', fmtSig(O.obs, 8) + ' s/s') : ''}
      ${Number.isFinite(O.obs) ? kv('observed ÷ predicted', fmtSig(O.obs / O.pdotB, 8)) : ''}
      ${Number.isFinite(O.obs) && src.obsRatio !== undefined
        ? kv('the published ratio', fmtSig(src.obsRatio, 7) + ' ± ' + fmtSig(src.obsErr, 2)) : ''}
      ${kv('the orbit shrinks by', fmtSig(-mPerYear, 5) + ' m per year')}
      ${kv('the period shortens by', fmtSig(-O.pdotB * 365.25 * 86400 * 1000, 5) + ' ms per year')}
      <p class="help">${Number.isFinite(O.obs)
        ? `This is the row the wing exists for: the left-hand number is general relativity and the
           right-hand one came from a telescope. ${B.nm} agrees to
           ${fmtSig(Math.abs(O.obs / O.pdotB - 1) * 100, 2)}%, computed here from the masses and the
           orbit with nothing fitted — and the prediction's own uncertainty is dominated by the quoted
           masses, since Ṗ goes as Mc<sup>5/3</sup>. Note what would happen without the eccentricity:
           F(e) = ${fmtSig(O.enhB, 5)}, so a circular calculation would be low by that whole factor and
           the "confirmation" would be a refutation.`
        : `Nobody has measured this one, so the two numbers above are both calculations. Switch to
           PSR B1913+16 or the double pulsar for the comparison against an actual observation.`}</p>
    </div>
    <div class="card tight"><div class="ttl">Where it ends, and how round it gets</div>
      ${kv('time to merger — Peters\' coupled equations, integrated', gwFmtTime(O.run.ok ? O.run.tMerge : NaN))}
      ${kv('time to merger if the orbit were circular', gwFmtTime(O.tMergeCirc))}
      ${kv('the eccentricity\'s share of that', O.run.ok && O.run.tMerge > 0
        ? fmtSig(O.tMergeCirc / O.run.tMerge, 5) + '× faster' : '—')}
      ${kv('eccentricity when the wave reaches 10 Hz', O.eAtBand === 0
        ? '0 — this orbit is already circular'
        : Number.isFinite(O.eAtBand)
        ? fmtSig(O.eAtBand, 4)
        : 'the track ended before reaching that frequency')}
      ${kv('the integrated (a, e) track against Peters\' closed form', Number.isFinite(O.aeGap)
        ? fmtGap(O.aeGap * gwSm(O.a) / 1000, gwSm(O.a) / 1000, 'km')
        : 'a circular orbit stays circular — nothing to compare')}
      <p class="help">The decay is integrated from Peters' two coupled equations — one for <b>ȧ</b> and
      one for <b>ė</b> — and checked against his closed-form trajectory <b>a(e)</b>, which contains no
      time at all and shares no arithmetic with the integration. Angular momentum leaves faster than
      energy does, so the orbit rounds as it shrinks: by the time this system reaches the frequency a
      ground-based detector can hear, its eccentricity is
      ${O.eAtBand > 0 ? fmtSig(O.eAtBand, 3) : 'zero — it started that way'}. That is why every inspiral
      waveform in use assumes a circle, and it is a result rather than an assumption.</p>
    </div>`;
  },

  chip(st){
    const O = st.O;
    if(!O || !O.ok) return `<div class="k">Orbital decay</div>
      <div style="color:var(--c-warn)">no orbit here</div>`;
    return `<div class="k">${O.B.nm}</div>
      <div style="color:var(--c-curl)">F(e) = ${fmtSig(O.avg.enh, 5)}</div>
      <div style="color:var(--c-grad)">Ṗ = ${fmtSig(O.pdotB, 4)} s/s</div>`;
  },

  legend(){ return [['var(--c-curl)', 'the instantaneous power, and F(e) in closed form'],
                    ['var(--c-pos)', 'the orbit average by quadrature'],
                    ['var(--c-grad)', 'the orbiting pair, and your eccentricity'],
                    ['var(--faint)', 'the ellipse'],
                    ['var(--c-warn)', 'the centre of mass, at the focus']]; }
};

/* The true anomaly at a given FRACTION OF THE PERIOD — Kepler's equation, so
   the drawn body sweeps equal areas rather than equal angles. An eccentric
   orbit spends most of its time near apocentre and almost none at pericentre,
   and animating φ linearly would show exactly the opposite of the fact the
   picture is about. Newton's method on E − e sin E = 2πt/P converges in three
   iterations at e < 0.95. */
function gwEccPhase(e, frac){
  const Mn = 2 * Math.PI * frac;
  let E = Mn;
  for(let i = 0; i < 12; i++){
    const d = (E - e * Math.sin(E) - Mn) / (1 - e * Math.cos(E));
    E -= d;
    if(Math.abs(d) < 1e-12) break;
  }
  return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
}
