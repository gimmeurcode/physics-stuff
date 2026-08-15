/* ============================================================================
   QUANTUM STAGES
   ============================================================================ */

/* ---- 1 · free wave packet: dispersion made visible -------------------------- */
STAGES.qmPacket = {
  title: 'Free wave packet',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why a localised particle necessarily spreads out',
      steps:[
        drvSay('a single wave cannot be a particle',
          'A pure plane wave has one exact momentum and is spread over all of space with equal amplitude everywhere. That is not a particle. To localise something, many momenta must be superposed so they cancel everywhere except in one region.'),
        drvStep('build a packet by superposing plane waves',
          `ψ(${dv('x')}, 0) ${dop('=')} ∫ φ(${dv('k')}) ${dop('e')}^(${dop('i')}${dv('k')}${dv('x')}) d${dv('k')}`,
          `centred at k₀ = ${n(st.P.k0)} with width σ = ${n(st.P.s0)}`),
        drvStep('each component evolves with its own frequency',
          `ψ(${dv('x')}, ${dv('t')}) ${dop('=')} ∫ φ(${dv('k')}) ${dop('e')}^(${dop('i')}(${dv('k')}${dv('x')} ${dop('−')} ω(${dv('k')})${dv('t')})) d${dv('k')}`,
          'the Schrödinger equation makes each plane wave rotate at its own rate'),
        drvStep('and for a free particle the dispersion is quadratic',
          `ω ${dop('=')} ${dfrac('ħ' + dv('k') + '²', '2' + dv('m'))}`,
          'because E = p²/2m, and E = ħω with p = ħk'),
        drvSay('the quadratic is what makes the packet spread',
          'Phase velocity ω/k depends on k, so different components travel at different speeds. The careful cancellation that localised the packet at t = 0 gradually fails. Spreading is not a defect of the model or a measurement effect — it is what a superposition of unequal speeds must do.'),
        drvStep('the packet centre moves at the group velocity',
          `${dv('v')}_g ${dop('=')} ${dfrac('dω', 'd' + dv('k'))} ${dop('=')} ${dfrac('ħ' + dv('k') + '₀', dv('m'))} ${dop('=')} ${dfrac(dv('p'), dv('m'))}`,
          'which is exactly the classical velocity — the panel tracks the peak and confirms it'),
        drvSay('and the phase velocity is half that, which alarms people',
          'The ripples inside the envelope move at ω/k = ħk/2m, half the speed of the packet itself. Watch the internal structure slide backwards through the envelope. Nothing is wrong: the phase velocity carries no information, and only the group velocity corresponds to the particle.'),
        drvStep('the width grows in a specific way',
          `σ(${dv('t')}) ${dop('=')} σ₀√(1 ${dop('+')} (ħ${dv('t')}/2${dv('m')}σ₀²)²)`,
          'the panel measures the width from the computed |ψ|² and prints it against this'),
        drvSay('so a tighter packet spreads faster, which is the uncertainty principle in motion',
          'Squeezing σ₀ requires a wider spread of momenta, and a wider spread of momenta means faster dispersal. The two effects are the same fact, and the next stage makes the inequality explicit.'),
        drvSay('and none of the argument used the packet being Gaussian',
          'Every step above superposes plane waves, rotates each by its own frequency, and adds them back. Nothing anywhere asked what shape the envelope was. Type your own ψ₀ into the box and the same three lines evolve it exactly — transform, turn each k through e^(−ik²t/2), transform back — with no time stepping and therefore no accumulating error. What changes is one number: Δx·Δp no longer starts at ½. The Gaussian is the unique profile that attains the bound, and every other shape you can write down starts above it. That is the difference between a formula that happens to hold and an inequality with a reason.')
      ],
      note:'The evolution is computed by transforming to momentum space, applying the exact phase for each k, and transforming back — so the packet shown is an exact solution rather than a stepped approximation. The measured width is taken from |ψ|² and printed beside the closed form.'
    };
  },
  enter(st, o){
    st.P = { x0: o.x0 !== undefined ? o.x0 : -6, k0: o.k0 !== undefined ? o.k0 : 2.2, s0: o.s0 || 0.55 };
    st.probe = 0; st.tMax = 8; st.own = !!o.own;
  },
  controls(){
    const cur = qmPkCur(ST);
    return (ST.own ? '' : ctlRow('width σ₀', ctlSlider('qpS', 0.25, 1.6, 0.05, ST.P.s0))) +
           ctlRow('momentum k₀', ctlSlider('qpK', 0, 5, 0.1, ST.P.k0)) +
           ctSeg('qpOwn', ST.own ? 'own' : 'gauss',
                 [['gauss', 'a Gaussian packet'], ['own', 'type your own shape']]) +
           (ST.own ? fnHtml('qmpk_s', 'ψ₀(x) ∝', pkOwn(ST, 'qmpk', QM_PK_OWN, null).s, 'x') : '') +
           `<div class="row wrap"><button class="btn sm pri" id="qpRestart">Restart packet</button>
            <button class="btn sm" id="qpPause">Pause</button></div>
            <p class="help">${cur.note}</p>
            <p class="help">Watch the packet translate at speed k₀ (ħ=m=1) and spread — while Δp never changes. Click the plot to move the probe.</p>`;
  },
  wire(){
    if(!ST.own) wireSlider('qpS', () => ST.P.s0, v => { ST.P.s0 = v; ST.t = 0; }, v => (+v).toFixed(2));
    wireSlider('qpK', () => ST.P.k0, v => { ST.P.k0 = v; ST.t = 0; }, v => (+v).toFixed(1));
    ctWireSeg('qpOwn', v => { ST.own = (v === 'own'); ST.t = 0; });
    if(ST.own){
      const own = pkOwn(ST, 'qmpk', QM_PK_OWN, null);
      fnWire('qmpk_s', (m, s) => { own.s = s; ST.t = 0; });
    }
    $('qpRestart').addEventListener('click', () => { ST.t = 0; });
    $('qpPause').addEventListener('click', e => { ST.paused = !ST.paused; e.target.textContent = ST.paused ? 'Play' : 'Pause'; });
  },
  frame(st, dt, ctx, W, H){
    if(st.t > st.tMax) st.t = 0;
    const t = st.t, cur = qmPkCur(st), stats = cur.stats(t);
    const M = { l: 64, r: 20, t: 46, b: 40 };
    const pmax = cur.pmax;                                          // |ψ|² at t = 0
    const pl = st.pl = mkPlot(M.l, M.t, W - M.l - M.r, H - M.t - M.b, -10, 10, -pmax * 0.75, pmax);
    plotFrame(ctx, pl, 'x  (position)', '', (cur.custom ? 'ψ(x, t) — your shape, evolved spectrally' : 'ψ(x, t) — exact free-particle evolution') + '   ·   t = ' + t.toFixed(2));
    plotTicksX(ctx, pl, [-10, -5, 0, 5, 10]);
    plotZeroY(ctx, pl);
    const psi = x => cur.psi(x, t);
    plotCurve(ctx, pl, x => cAbs2(psi(x)), 320, null, 0, rgbCss(TH.accent, 0.20));
    plotCurve(ctx, pl, x => cAbs2(psi(x)), 320, rgbCss(TH.accent), 2.2);
    plotCurve(ctx, pl, x => psi(x).re * Math.sqrt(pmax) * 0.55, 420, rgbCss(TH.grad), 1.3);
    plotCurve(ctx, pl, x => psi(x).im * Math.sqrt(pmax) * 0.55, 420, rgbCss(TH.curl), 1.3);
    /* ⟨x⟩ and the Δx bracket — the mathematics drawn onto its own curve */
    const mx = pl.X(stats.mean), my = pl.Y(pmax * 0.88);
    ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(pl.X(stats.mean - stats.dx), my); ctx.lineTo(pl.X(stats.mean + stats.dx), my); ctx.stroke();
    for(const s of [-1, 1]){
      ctx.beginPath(); ctx.moveTo(pl.X(stats.mean + s * stats.dx), my - 5); ctx.lineTo(pl.X(stats.mean + s * stats.dx), my + 5); ctx.stroke();
    }
    ctx.fillStyle = rgbCss(TH.pos); ctx.font = '600 10.5px ' + FONT_MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('⟨x⟩ ± Δx = ' + fmtNum(stats.mean, 3) + ' ± ' + fmtNum(stats.dx, 3), mx, my - 7);
    probeLine(ctx, pl, st.probe, 'probe');
    stageNote(ctx, 'blue |ψ|² · green Re ψ · violet Im ψ — the short waves at the front are the fast momentum components arriving first', W, H);
  },
  pick(st, sx, sy){ if(st.pl) st.probe = Math.max(st.pl.x0, Math.min(st.pl.x1, st.pl.invX(sx))); },
  readout(st){
    const t = st.t, cur = qmPkCur(st), s = cur.stats(t);
    const c = cur.psi(st.probe, t), p2 = cAbs2(c);
    /* Ehrenfest, as a comparison rather than a claim: the centre is measured from
       |ψ|² in x, and ⟨k⟩ is measured from |φ|² in k. Nothing links the two but
       the theorem, so their difference is the theorem being tested. */
    const pred = cur.custom ? cur.F.xBar0 + cur.F.meanK * t : st.P.x0 + st.P.k0 * t;
    return `<div class="card tight"><div class="ttl">At the probe · x = ${fmtNum(st.probe, 3)}</div>
      ${kv('ψ(x,t)', fmtNum(c.re, 3) + (c.im >= 0 ? ' + ' : ' − ') + fmtNum(Math.abs(c.im), 3) + '·i')}
      ${kv('|ψ|² (probability density)', fmtNear(p2))}
      ${kv('phase arg ψ', fmtNum(Math.atan2(c.im, c.re), 3) + ' rad')}
      ${kv('local momentum Im(ψ′/ψ)', fmtNum(cur.localK(st.probe, t), 3))}
    </div>
    <div class="card tight"><div class="ttl">${cur.custom ? 'Measured' : 'Exact'} moments at t = ${t.toFixed(2)}</div>
      ${kv('⟨x⟩' + (cur.custom ? ' (from |ψ|²)' : ' = x₀ + k₀t'), fmtNum(s.mean, 4))}
      ${kv('x̄₀ + ⟨k⟩t  (Ehrenfest)', fmtNum(pred, 4))}
      ${kv('Δx' + (cur.custom ? '' : ' = σ₀√(1+(t/2σ₀²)²)'), fmtNum(s.dx, 4))}
      ${kv('Δp' + (cur.custom ? ' (from |φ(k)|²)' : ' = 1/2σ₀'), fmtNum(s.dp, 4))}
      ${kv('Δx·Δp  (the floor is ħ/2 = 0.5)', '<b>' + fmtNum(s.product, 4) + '</b>')}
      ${cur.custom ? kv('total probability (must stay 1)', fmtNum(s.norm, 8)) : ''}
      <p class="help">${cur.custom
        ? 'Both rows for ⟨x⟩ are computed, and by different halves of the calculation: the first is the mean of |ψ|² in position, the second is the starting centre plus ⟨k⟩ — taken from the momentum distribution — times t. Ehrenfest\'s theorem says a free packet\'s centre moves exactly like a classical particle, so those two numbers must agree, and the gap of ' + fmtNum(Math.abs(s.mean - pred), 3) + ' is the check rather than a claim. Δp is constant to rounding, because free evolution only turns each momentum\'s phase.' + (s.wrap > 0.001 ? ' <b>The packet has reached the edge of the computing window</b> (' + fmtNum(s.wrap * 100, 3) + '% of the probability is out there), and the spectral method makes the world periodic — so it is beginning to reappear on the other side. Restart, or use a slower packet.' : '')
        : 'The product starts at exactly ħ/2 — a Gaussian is a minimum-uncertainty state — and grows only because Δx grows. Free evolution never squeezes it back. Type your own shape and it will start above ħ/2 instead, which is what makes this an inequality.'}</p>
    </div>`;
  },
  chip(st){
    const cur = qmPkCur(st), s = cur.stats(st.t);
    return `<div class="k">wave packet · t = ${st.t.toFixed(2)}</div>
      <div>⟨x⟩ = ${fmtNum(s.mean, 3)}</div><div>Δx = ${fmtNum(s.dx, 3)} · Δp = ${fmtNum(s.dp, 3)}</div>
      <div style="color:var(--c-pos)">Δx·Δp = ${fmtNum(s.product, 3)} ≥ ½</div>`;
  },
  legend(){ return [['var(--accent)', '|ψ|² — probability density'], ['var(--c-grad)', 'Re ψ'], ['var(--c-curl)', 'Im ψ'], ['var(--c-pos)', '⟨x⟩ ± Δx, computed exactly']]; }
};

/* ---- 2 · Heisenberg: position width vs momentum width ----------------------- */
STAGES.qmUncertainty = {
  title: 'The uncertainty principle',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'A theorem about Fourier transforms, wearing a physics hat',
      steps:[
        drvSay('what it is not',
          'It is not that measuring position knocks the particle and spoils the momentum. That story — Heisenberg\'s own microscope argument — describes a real effect but is not what the principle says. The inequality holds for a state nobody has touched.'),
        drvStep('position and momentum amplitudes are a Fourier pair',
          `φ(${dv('p')}) ${dop('=')} ${dfrac('1', '√(2πħ)')}∫ ψ(${dv('x')}) ${dop('e')}^(${dop('−')}${dop('i')}${dv('p')}${dv('x')}/ħ) d${dv('x')}`,
          `σ = ${n(st.s0)} — the panel computes both from the same state`),
        drvSay('so the two descriptions are not independent',
          'ψ and φ are not two separate things that happen to be related. They are one state written in two bases, exactly as a vector has components in two different coordinate systems. Fixing one fixes the other completely.'),
        drvStep('and the Fourier wing already proved the consequence',
          `Δ${dv('x')} ${dop('·')} Δ${dv('k')} ${dop('≥')} ${dfrac('1', '2')}`,
          'narrowing a function necessarily widens its transform — no physics in this step at all'),
        drvStep('convert wavenumber to momentum',
          `${dv('p')} ${dop('=')} ħ${dv('k')} ${dop('⇒')} Δ${dv('x')}Δ${dv('p')} ${dop('≥')} ${dfrac('ħ', '2')}`,
          `the panel computes both spreads from the state and prints their product`),
        drvSay('de Broglie\'s relation is the only physics used',
          'Everything else is a property of waves that engineers had known for a century. The physical content is the single claim that matter has a wave description with p = ħk. Given that, the uncertainty principle is a theorem rather than a postulate.'),
        drvStep('the Gaussian is the unique state achieving equality',
          `Δ${dv('x')}Δ${dv('p')} ${dop('=')} ${dfrac('ħ', '2')} exactly`,
          `here the product is ${n(0.5)} in units of ħ — the panel confirms it at every σ`),
        drvSay('and the consequences are structural, not practical',
          'A hydrogen atom does not collapse because confining the electron would raise its momentum spread and hence its kinetic energy. The balance between that and the Coulomb attraction sets the Bohr radius. Atoms have a size because of this inequality.'),
        drvStep('and the same relation holds for any incompatible pair',
          `Δ${dv('A')}Δ${dv('B')} ${dop('≥')} ${dfrac('1', '2')}|⟨[${dv('A')},${dv('B')}]⟩|`,
          'the general form — the commutator measures how badly two observables fail to be simultaneously definite'),
        drvSay('so position and momentum are not special',
          'They are simply the pair whose commutator is iħ. Any two operators that fail to commute obey a relation of this shape, including the spin components of the Stern–Gerlach stage — which is why measuring x-spin destroys knowledge of z-spin.')
      ],
      note:'Both spreads are computed as second moments of the actual |ψ|² and |φ|² arrays, not from the analytic width. Their product stays at exactly ħ/2 for every σ, which is the Gaussian saturating the bound — measured rather than asserted.'
    };
  },
  enter(st, o){ st.s0 = o.s0 || 0.5; st.k0 = 1.5; st.probe = 0; },
  controls(){
    return ctlRow('width σ', ctlSlider('quS', 0.15, 2.2, 0.01, ST.s0)) +
           ctlRow('⟨p⟩ = k₀', ctlSlider('quK', -3, 3, 0.1, ST.k0)) +
           `<p class="help">One slider, two plots. ψ(x) and its <b>exact Fourier transform</b> φ(p) are drawn from the same σ: squeeze one Gaussian and the other must widen so that Δx·Δp = ħ/2 exactly, always. This is not a measurement disturbance — it is a property of waves.</p>`;
  },
  wire(){
    wireSlider('quS', () => ST.s0, v => { ST.s0 = v; }, v => (+v).toFixed(2));
    wireSlider('quK', () => ST.k0, v => { ST.k0 = v; }, v => (+v).toFixed(1));
  },
  frame(st, dt, ctx, W, H){
    const P = { x0: 0, k0: st.k0, s0: st.s0 };
    const hh = (H - 120) / 2;
    const pxm = Math.pow(2 * Math.PI * 0.15 * 0.15, -0.5);
    const top = st.pl = mkPlot(64, 44, W - 90, hh, -6, 6, 0, pxm * 1.05);
    const pkm = Math.pow(2 * 0.15 * 0.15 / Math.PI, 0.5) * Math.sqrt(Math.PI) * 3;
    const bot = st.pl2 = mkPlot(64, 44 + hh + 56, W - 90, hh, -8, 8, 0, pkm);
    plotFrame(ctx, top, 'x — position', '', 'position space · |ψ(x)|², Δx = σ = ' + st.s0.toFixed(2));
    plotTicksX(ctx, top, [-6, -3, 0, 3, 6]);
    plotCurve(ctx, top, x => cAbs2(qmPacketPsi(x, 0, P)), 260, null, 0, rgbCss(TH.accent, 0.2));
    plotCurve(ctx, top, x => cAbs2(qmPacketPsi(x, 0, P)), 260, rgbCss(TH.accent), 2.2);
    plotFrame(ctx, bot, 'p — momentum', '', 'momentum space · |φ(p)|², Δp = 1/2σ = ' + (1 / (2 * st.s0)).toFixed(2));
    plotTicksX(ctx, bot, [-8, -4, 0, 4, 8]);
    plotCurve(ctx, bot, k => qmPacketPhi(k, P) ** 2, 260, null, 0, rgbCss(TH.pos, 0.2));
    plotCurve(ctx, bot, k => qmPacketPhi(k, P) ** 2, 260, rgbCss(TH.pos), 2.2);
    probeLine(ctx, top, st.probe, 'x');
    probeLine(ctx, bot, st.probe, 'p');
    /* §1.3: the claim Δx·Δp = ħ/2 is MEASURED, not multiplied out of itself —
       σ·(1/2σ) is 0.5 by algebra and checks nothing. Both spreads here are
       second moments of the same functions the two curves are drawn from,
       integrated over ±8 widths, and the product is printed against ħ/2 with
       the difference the quadrature actually leaves. */
    const mom2 = (f, lo, hi) => {
      let s0 = 0, s1 = 0, s2 = 0;
      for(let i = 0; i <= 400; i++){
        const x = lo + (hi - lo) * i / 400, w = f(x);
        s0 += w; s1 += w * x; s2 += w * x * x;
      }
      const mu = s1 / s0;
      return Math.sqrt(Math.max(0, s2 / s0 - mu * mu));
    };
    const dxM = mom2(x => cAbs2(qmPacketPsi(x, 0, P)), -8 * st.s0, 8 * st.s0);
    const wp = 1 / (2 * st.s0);
    const dpM = mom2(k => qmPacketPhi(k, P) ** 2, st.k0 - 8 * wp, st.k0 + 8 * wp);
    stageNote(ctx, 'Δx·Δp measured from the two drawn curves = ' + fmtSig(dxM * dpM, 4) +
      ' · ħ/2 = 0.5 · gap ' + fmtGapTight(dxM * dpM - 0.5, 0.5, '', 1e-6) +
      ' — the Gaussian saturates the bound; every other shape does worse', W, H);
  },
  pick(st, sx, sy){
    const pl = (st.pl2 && sy > st.pl2.py - 30) ? st.pl2 : st.pl;
    if(pl) st.probe = Math.max(-8, Math.min(8, pl.invX(sx)));
  },
  readout(st){
    const P = { x0: 0, k0: st.k0, s0: st.s0 };
    const dx = st.s0, dp = 1 / (2 * st.s0);
    return `<div class="card tight"><div class="ttl">At the probe · value = ${fmtNum(st.probe, 3)}</div>
      ${kv('|ψ(x)|² at x = ' + fmtNum(st.probe, 2), fmtNear(cAbs2(qmPacketPsi(st.probe, 0, P))))}
      ${kv('|φ(p)|² at p = ' + fmtNum(st.probe, 2), fmtNear(qmPacketPhi(st.probe, P) ** 2))}
    </div>
    <div class="card tight"><div class="ttl">The trade, exactly</div>
      ${kv('Δx = σ', fmtNum(dx, 4))}
      ${kv('Δp = ħ/2σ', fmtNum(dp, 4))}
      ${kv('Δx·Δp', '<b>' + fmtNum(dx * dp, 4) + '</b> = ħ/2')}
      <p class="help">φ(p) is the Fourier transform of ψ(x): a narrow function must be built from many wavelengths, and wavelength <i>is</i> momentum (p = ħk, de Broglie). Squeezing x by a factor s costs exactly s in p — read both widths off the plots as you drag σ.</p>
    </div>`;
  },
  chip(st){ return `<div class="k">Heisenberg</div><div>Δx = ${fmtNum(st.s0, 3)}</div><div>Δp = ${fmtNum(1 / (2 * st.s0), 3)}</div><div style="color:var(--c-pos)">Δx·Δp = 0.5 ħ exactly</div>`; },
  legend(){ return [['var(--accent)', '|ψ(x)|² — where it is'], ['var(--c-pos)', '|φ(p)|² — how fast it moves']]; }
};

/* ---- 3 · particle in a box: eigenstates, superposition, beats ---------------- */
STAGES.qmWell = {
  title: 'Particle in a box',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Where quantised energy levels actually come from',
      steps:[
        drvSay('quantisation is not an extra postulate',
          'Nothing in the Schrödinger equation says energies must be discrete. Discreteness appears the moment boundary conditions are imposed — exactly as it does for a guitar string. The same argument, in the same order, produces both.'),
        drvStep('inside the box the equation is free',
          `${dop('−')}${dfrac('ħ²', '2' + dv('m'))}ψ″ ${dop('=')} ${dv('E')}ψ`,
          'so ψ is a sinusoid with k = √(2mE)/ħ'),
        drvStep('the walls force ψ to vanish at both ends',
          `ψ(0) ${dop('=')} ψ(${dv('L')}) ${dop('=')} 0`,
          `L = ${n(st.L)} — the wavefunction cannot exist where the potential is infinite`),
        drvStep('which permits only whole numbers of half-wavelengths',
          `${dv('k')}${dv('L')} ${dop('=')} ${dv('n')}π`,
          'every other k gives a function that is nonzero at the far wall and is rejected'),
        drvSay('this is the standing-wave condition from the waves wing',
          'A string fixed at both ends admits only these same wavelengths. The mathematics is identical; only the interpretation differs. Quantised energy is quantised wavelength, and quantised wavelength is a boundary-value problem.'),
        drvStep('so the energies are forced to be discrete',
          `${dv('E')}ₙ ${dop('=')} ${dfrac(dv('n') + '²π²ħ²', '2' + dv('m') + dv('L') + '²')}`,
          `levels ${st.sel.join(' and ')} are superposed here — the panel lists the energies`),
        drvSay('and the ground state cannot have zero energy',
          'n = 0 would make ψ vanish everywhere, which is not a state at all. So the lowest energy is E₁, not zero — the particle can never be at rest. That zero-point energy is required by the uncertainty principle: confinement to a length L forces a momentum spread of order ħ/L.'),
        drvStep('superposing two levels makes the probability move',
          `|ψ|² contains cos((${dv('E')}₂{−}${dv('E')}₁)${dv('t')}/ħ)`,
          'the panel animates it — a single eigenstate is stationary, a superposition is not'),
        drvSay('which is why eigenstates are called stationary states',
          'For a single level the time dependence is a global phase and |ψ|² does not move at all. Only interference between different energies produces motion, and it oscillates at the frequency set by the energy difference. That difference is what a photon carries away when the atom decays.')
      ],
      note:'The wavefunction is built from the exact eigenstates and evolved with the exact phases, so the animation is a solution rather than a stepped approximation. The probe reads ψ, |ψ|² and the phase anywhere in the box.'
    };
  },
  enter(st, o){
    st.L = 10;
    st.sel = o.sel || [1, 2];             // which n are superposed, equal weights
    st.probe = st.L * 0.3;
    st.own = !!o.own;
  },
  comps(st){
    const c = 1 / Math.sqrt(st.sel.length || 1);
    return st.sel.map(n => ({ n, c }));
  },
  controls(){
    const btn = n => `<button class="btn sm" data-qw="${n}" aria-pressed="${ST.sel.includes(n)}">n = ${n}</button>`;
    const Wc = qmWellCur(ST);
    return `<div class="row wrap">${[1, 2, 3, 4, 5].map(btn).join('')}</div>` +
      ctSeg('qwOwn', ST.own ? 'own' : 'box',
            [['box', 'a flat-bottomed box'], ['own', 'type your own V(x)']]) +
      (ST.own ? fnHtml('qmwell_V', 'V(x) =', pkOwn(ST, 'qmwell', QM_WELL_OWN, null).V,
                       'x, from 0 to ' + ST.L) : '') +
      `<p class="help">${Wc.note}</p>
      <p class="help">Pick which eigenstates enter the superposition (equal weights). One state alone is <b>stationary</b> — |Ψ|² freezes. Two states beat at ω = E₂−E₁: energy differences are the only clocks quantum mechanics owns.</p>`;
  },
  wire(){
    ctWireSeg('qwOwn', v => { ST.own = (v === 'own'); ST.t = 0; });
    if(ST.own){
      const own = pkOwn(ST, 'qmwell', QM_WELL_OWN, null);
      fnWire('qmwell_V', (m, s) => { own.V = s; ST.t = 0; });
    }
    for(const b of $('stageBody').querySelectorAll('button[data-qw]')) b.addEventListener('click', () => {
      const n = +b.dataset.qw;
      const i = ST.sel.indexOf(n);
      if(i >= 0){ if(ST.sel.length > 1) ST.sel.splice(i, 1); }
      else ST.sel.push(n);
      ST.sel.sort((a, b2) => a - b2);
      b.setAttribute('aria-pressed', String(ST.sel.includes(n)));
      for(const bb of $('stageBody').querySelectorAll('button[data-qw]'))
        bb.setAttribute('aria-pressed', String(ST.sel.includes(+bb.dataset.qw)));
      ST.t = 0; refreshStageReadout();
    });
  },
  frame(st, dt, ctx, W, H){
    const L = st.L, comps = this.comps(st);
    const levW = 120;
    const pmax = 4 / L;
    const pl = st.pl = mkPlot(60, 46, W - levW - 110, H - 46 - 44, 0, L, -pmax * 0.8, pmax);
    plotFrame(ctx, pl, 'x', '', 'Ψ(x, t) in an infinite well · t = ' + st.t.toFixed(2) +
      '  ·  states {' + st.sel.join(', ') + '}');
    plotZeroY(ctx, pl);
    /* the walls */
    ctx.fillStyle = rgbCss(TH.line, 0.5);
    ctx.fillRect(pl.px - 6, pl.py, 6, pl.ph); ctx.fillRect(pl.px + pl.pw, pl.py, 6, pl.ph);
    /* not `W` — that is the canvas width in this signature, and shadowing it
       would break every plot on the stage */
    const Wc = qmWellCur(st);
    const psi = x => qmWellPsiCur(Wc, x, st.t, comps);
    plotCurve(ctx, pl, x => cAbs2(psi(x)), 300, null, 0, rgbCss(TH.accent, 0.20));
    plotCurve(ctx, pl, x => cAbs2(psi(x)), 300, rgbCss(TH.accent), 2.2);
    plotCurve(ctx, pl, x => psi(x).re * Math.sqrt(pmax) * 0.5, 300, rgbCss(TH.grad), 1.2);
    probeLine(ctx, pl, st.probe, 'probe');
    /* energy ladder at the right: the spectrum itself */
    const lv = mkPlot(W - levW - 20, 46, levW, H - 46 - 44, 0, 1, 0,
      (Number.isFinite(Wc.E(6)) ? Wc.E(6) : qmWellE(6, L)) * 1.05);
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 11px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Eₙ = n²π²ħ²/2mL²', lv.px + lv.pw / 2, lv.py - 4);
    for(let n = 1; n <= 5; n++){
      const En = Wc.E(n);
      if(!Number.isFinite(En)) continue;
      const y = lv.Y(En);
      const on = st.sel.includes(n);
      ctx.strokeStyle = on ? rgbCss(TH.pos) : rgbCss(TH.line2);
      ctx.lineWidth = on ? 2.5 : 1.2;
      ctx.beginPath(); ctx.moveTo(lv.px + 8, y); ctx.lineTo(lv.px + lv.pw - 8, y); ctx.stroke();
      ctx.fillStyle = on ? rgbCss(TH.pos) : rgbCss(TH.faint);
      ctx.font = '10.5px ' + FONT_MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('n=' + n + '  E=' + fmtNum(En, 3), lv.px + lv.pw - 6 - 74, y - 8);
    }
    stageNote(ctx, st.sel.length === 1
      ? 'a single eigenstate: the density is frozen — this is what "stationary state" means'
      : 'the lump sloshes at the beat frequency ω = ΔE/ħ — an atom mid-transition radiates at exactly this frequency', W, H);
  },
  pick(st, sx){ if(st.pl) st.probe = Math.max(0, Math.min(st.L, st.pl.invX(sx))); },
  readout(st){
    const comps = this.comps(st), L = st.L, W = qmWellCur(st);
    const c = qmWellPsiCur(W, st.probe, st.t, comps);
    let rows = comps.map(({ n }) => kv(W.flat ? 'E' + n + ' = ' + n + '²π²/2L²' : 'E' + n + '  (solved)', fmtNum(W.E(n), 4))).join('');
    let beat = '';
    if(comps.length >= 2){
      const dE = W.E(comps[1].n) - W.E(comps[0].n);
      beat = kv('beat period 2π/ΔE', fmtNum(2 * Math.PI / dE, 3));
    }
    return `<div class="card tight"><div class="ttl">At the probe · x = ${fmtNum(st.probe, 3)}</div>
      ${kv('|Ψ(x,t)|²', fmtNear(cAbs2(c)))}
      ${comps.map(({ n, c: cc }) => kv('φ' + n + '(x) · c' + n, fmtNum(W.phi(n, st.probe) * cc, 4))).join('')}
    </div>
    <div class="card tight"><div class="ttl">Spectrum (ħ=m=1, L=${st.L})</div>${rows}${beat}
      <p class="help">Confinement quantises: fitting n half-waves into L forces kₙ = nπ/L, so E = k²/2 comes in steps. Every discrete spectral line in nature is this arithmetic in some potential.</p>
    </div>`;
  },
  chip(st){
    const comps = this.comps(st);
    const E = comps.reduce((a, { n, c }) => a + c * c * qmWellCur(st).E(n), 0);
    return `<div class="k">particle in a box · t = ${st.t.toFixed(1)}</div><div>states {${st.sel.join(',')}}</div><div>⟨E⟩ = ${fmtNum(E, 4)}</div>`;
  },
  legend(){ return [['var(--accent)', '|Ψ|² — sloshes when two levels mix'], ['var(--c-grad)', 'Re Ψ'], ['var(--c-pos)', 'occupied levels on the ladder']]; }
};

/* ---- 4 · the double slit ----------------------------------------------------- */
STAGES.qmSlit = {
  title: 'The double slit',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Adding amplitudes, not probabilities',
      steps:[
        drvSay('the classical expectation, and why it fails',
          'If particles go through one slit or the other, the pattern on the screen should be the sum of the two single-slit patterns. It is not. Fringes appear, with places that are dark when both slits are open and bright when only one is.'),
        drvStep('quantum mechanics adds amplitudes first',
          `ψ ${dop('=')} ψ₁ ${dop('+')} ψ₂`,
          'complex numbers, so they can cancel as well as reinforce'),
        drvStep('and takes the modulus squared afterwards',
          `${dv('P')} ${dop('=')} |ψ₁ ${dop('+')} ψ₂|² ${dop('=')} |ψ₁|² ${dop('+')} |ψ₂|² ${dop('+')} 2Re(ψ₁*ψ₂)`,
          'the last term is the interference, and it has no classical counterpart'),
        drvSay('the order of the two operations is the whole of quantum mechanics',
          'Classically you would add probabilities: |ψ₁|² + |ψ₂|². Quantum mechanically you add first and square second, and the cross term is the difference. Everything strange about the subject is contained in that ordering.'),
        drvStep('the phase difference comes from the path difference',
          `Δφ ${dop('=')} ${dfrac('2π' + dv('d') + ' sin θ', 'λ')}`,
          `d = ${n(st.Q.d)}, λ = ${n(st.Q.lambda)} — the same geometry as the optics wing`),
        drvSay('but the particles arrive one at a time',
          'Turn the rate down until detections are separated in time. Each arrives as a single localised event — a dot. The pattern builds up dot by dot, so no particle can have interfered with another. Each interferes with itself, and that is the part that resists intuition.'),
        drvStep('the probability of each dot is |ψ|² at that point',
          `dots accumulate into |ψ|²`,
          `the panel samples the computed distribution and histograms the arrivals`),
        drvStep('and knowing the path destroys the pattern',
          `γ ${dop('=')} coherence`,
          `γ = ${n(st.Q.gamma)} — ${st.Q.gamma > 0.99 ? 'full interference' : st.Q.gamma < 0.01 ? 'which-path known, so no fringes' : 'partial coherence, partial fringes'}`),
        drvSay('and this is a trade, not an on-off switch',
          'Partial path information gives partial fringes. The relation D² + V² ≤ 1 between distinguishability and visibility is exact, and the panel lets you slide between the extremes. Complementarity is quantitative, and it is not about clumsy apparatus — any way of learning the path, however gentle, costs exactly this much visibility.')
      ],
      note:'The dots are sampled from the computed |ψ|² by inverse-transform sampling, so the histogram converges on the calculated curve rather than being drawn to match it. Watching the pattern emerge from individual random arrivals is the experiment, not an illustration of it.'
    };
  },
  enter(st, o){
    st.Q = { d: o.d || 1.2, w: o.w || 0.35, lambda: o.lambda || 0.5, D: 12, gamma: o.gamma !== undefined ? o.gamma : 1 };
    st.mode = o.mode || 'both';          // wave | dots | both
    st.dots = []; st.hist = new Float64Array(96); st.nDet = 0;
    st.rate = o.rate !== undefined ? o.rate : 60;
    st.ymax = 6; st.probe = 0; st.sampler = null; st.acc = 0;
  },
  invalidateSampler(st){ st.sampler = null; st.dots.length = 0; st.hist.fill(0); st.nDet = 0; },
  controls(){
    return ctlRow('slit gap d', ctlSlider('dsD', 0.5, 3, 0.05, ST.Q.d)) +
      ctlRow('slit width w', ctlSlider('dsW', 0.1, 1, 0.05, ST.Q.w)) +
      ctlRow('wavelength λ', ctlSlider('dsLam', 0.2, 1.2, 0.02, ST.Q.lambda)) +
      ctlRow('coherence γ', ctlSlider('dsG', 0, 1, 0.05, ST.Q.gamma)) +
      ctlRow('particles/s', ctlSlider('dsRate', 0, 400, 10, ST.rate)) +
      `<div class="row wrap"><button class="btn sm" id="dsClear">Clear detections</button></div>
       <p class="help"><b>γ is the which-path knob.</b> γ = 1: no path information exists, the amplitudes add, fringes. γ = 0: a detector at the slits has fully tagged each particle's path, the <i>probabilities</i> add instead, and the fringes are gone — with the slits untouched. Each dot is one particle detected whole; the pattern is the statistics of many.</p>`;
  },
  wire(){
    const inv = () => this.invalidateSampler(ST);
    wireSlider('dsD', () => ST.Q.d, v => { ST.Q.d = v; inv(); }, v => (+v).toFixed(2));
    wireSlider('dsW', () => ST.Q.w, v => { ST.Q.w = v; inv(); }, v => (+v).toFixed(2));
    wireSlider('dsLam', () => ST.Q.lambda, v => { ST.Q.lambda = v; inv(); }, v => (+v).toFixed(2));
    wireSlider('dsG', () => ST.Q.gamma, v => { ST.Q.gamma = v; inv(); }, v => (+v).toFixed(2));
    wireSlider('dsRate', () => ST.rate, v => { ST.rate = v; }, v => String(v));
    $('dsClear').addEventListener('click', inv);
  },
  frame(st, dt, ctx, W, H){
    const Q = st.Q;
    if(!st.sampler) st.sampler = qmSlitSampler(Q, st.ymax, 512);
    /* emit particles */
    if(st.rate > 0){
      st.acc += dt * st.rate;
      while(st.acc >= 1){
        st.acc -= 1;
        const y = st.sampler();
        st.dots.push({ y, x: Math.random() });    // x jitter for display depth
        const bin = Math.floor((y + st.ymax) / (2 * st.ymax) * st.hist.length);
        if(bin >= 0 && bin < st.hist.length){ st.hist[bin]++; st.nDet++; }
        if(st.dots.length > 4200) st.dots.shift();
      }
    }
    /* layout: left apparatus sketch · middle detection wall · right I(y) curve */
    const wallX = W * 0.52, curveX = W * 0.70;
    const yTo = y => 30 + (1 - (y + st.ymax) / (2 * st.ymax)) * (H - 76);
    st.yTo = yTo;
    st.yFrom = sy => (1 - (sy - 30) / (H - 76)) * 2 * st.ymax - st.ymax;
    /* source */
    ctx.fillStyle = rgbCss(TH.warn);
    ctx.beginPath(); ctx.arc(40, yTo(0), 5, 0, 6.2832); ctx.fill();
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10.5px ' + FONT_UI; ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; ctx.fillText('source', 40, yTo(0) + 9);
    /* the barrier with two slits */
    const bx = W * 0.22;
    const gapPix = Math.abs(yTo(0) - yTo(Q.w));
    ctx.strokeStyle = rgbCss(TH.text, 0.8); ctx.lineWidth = 4; ctx.lineCap = 'butt';
    const y1 = yTo(Q.d / 2), y2 = yTo(-Q.d / 2);
    ctx.beginPath();
    ctx.moveTo(bx, 24); ctx.lineTo(bx, y1 - gapPix / 2);
    ctx.moveTo(bx, y1 + gapPix / 2); ctx.lineTo(bx, y2 - gapPix / 2);
    ctx.moveTo(bx, y2 + gapPix / 2); ctx.lineTo(bx, H - 46);
    ctx.stroke();
    /* wavefronts (drawn when coherent) */
    if(st.mode !== 'dots'){
      const k = 2 * Math.PI / Q.lambda;
      ctx.lineWidth = 1;
      const phase = (st.t * 3) % Q.lambda;
      for(const sy of [Q.d / 2, -Q.d / 2]){
        for(let rr = phase; rr < 8; rr += Q.lambda){
          const alpha = 0.30 * (1 - rr / 8) * (0.25 + 0.75 * Q.gamma);
          if(alpha <= 0.01) continue;
          ctx.strokeStyle = rgbCss(TH.accent, alpha);
          ctx.beginPath();
          ctx.arc(bx, yTo(sy), rr * gapPix / Q.w * 0.5, -1.2, 1.2);
          ctx.stroke();
        }
      }
      /* incoming plane waves */
      for(let rr = phase; rr < (bx - 60) / (gapPix / Q.w * 0.5); rr += Q.lambda){
        const sx = bx - rr * gapPix / Q.w * 0.5;
        if(sx < 55) continue;
        ctx.strokeStyle = rgbCss(TH.accent, 0.22);
        ctx.beginPath(); ctx.moveTo(sx, yTo(0) - 60); ctx.lineTo(sx, yTo(0) + 60); ctx.stroke();
      }
    }
    /* detection wall: accumulated dots */
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(wallX - 30, 24, 60, H - 70);
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '10.5px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('detector — each dot is ONE particle', wallX, 8);
    ctx.fillStyle = rgbCss(TH.text, 0.75);
    for(const d of st.dots){
      ctx.fillRect(wallX - 28 + d.x * 56, yTo(d.y), 1.6, 1.6);
    }
    /* histogram + exact curve */
    const pl = st.pl = mkPlot(curveX, 24, W - curveX - 24, H - 70, 0, 1.05, -st.ymax, st.ymax);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.strokeRect(pl.px, pl.py, pl.pw, pl.ph);
    ctx.fillStyle = rgbCss(TH.dim); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('counts vs exact I(y)', pl.px + pl.pw / 2, 8);
    let iMax = 1e-9;
    const Isamp = [];
    for(let i = 0; i <= 160; i++){
      const y = -st.ymax + 2 * st.ymax * i / 160;
      const I = qmSlitIntensity(y, Q).I;
      Isamp.push([y, I]); if(I > iMax) iMax = I;
    }
    /* histogram bars (detected statistics) */
    const hMax = Math.max(1, ...st.hist);
    ctx.fillStyle = rgbCss(TH.pos, 0.45);
    const bh = (H - 70) / st.hist.length;
    for(let i = 0; i < st.hist.length; i++){
      const yy = 24 + (st.hist.length - 1 - i) * bh;
      ctx.fillRect(pl.px, yy, (st.hist[i] / hMax) * pl.pw * 0.96, Math.max(1, bh - 1));
    }
    /* exact intensity curve on top */
    ctx.strokeStyle = rgbCss(TH.accent); ctx.lineWidth = 1.8;
    ctx.beginPath();
    let first = true;
    for(const [y, I] of Isamp){
      const sx = pl.px + (I / iMax) * pl.pw * 0.96, sy = yTo(y);
      if(first){ ctx.moveTo(sx, sy); first = false; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    /* probe */
    const py = yTo(st.probe);
    ctx.strokeStyle = rgbCss(TH.text, 0.8); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(wallX - 34, py); ctx.lineTo(W - 20, py); ctx.stroke();
    ctx.setLineDash([]);
    stageNote(ctx, 'γ = ' + Q.gamma.toFixed(2) + (Q.gamma > 0.95 ? ' — fully coherent: amplitudes add, |ψ₁+ψ₂|²' : Q.gamma < 0.05 ? ' — which-path known: probabilities add, |ψ₁|²+|ψ₂|²' : ' — partial decoherence: fringes at ' + Math.round(Q.gamma * 100) + '% contrast'), W, H);
  },
  pick(st, sx, sy){ st.probe = Math.max(-st.ymax, Math.min(st.ymax, st.yFrom(sy))); },
  readout(st){
    const r = qmSlitIntensity(st.probe, st.Q);
    const fr = r.dr / st.Q.lambda;
    return `<div class="card tight"><div class="ttl">At the probe · screen y = ${fmtNum(st.probe, 3)}</div>
      ${kv('path r₁ (upper slit)', fmtNum(r.r1, 4))}
      ${kv('path r₂ (lower slit)', fmtNum(r.r2, 4))}
      ${kv('Δr = r₂ − r₁', fmtNum(r.dr, 4))}
      ${kv('Δr / λ', fmtNum(fr, 3) + (Math.abs(fr - Math.round(fr)) < 0.08 ? ' — constructive' : Math.abs(fr - Math.round(fr) - 0.5) < 0.08 || Math.abs(fr - Math.round(fr) + 0.5) < 0.08 ? ' — destructive' : ''))}
      ${kv('phase kΔr', fmtNum(r.phase, 3) + ' rad')}
      ${kv('intensity I(y)', fmtNear(r.I))}
      ${kv('envelope (single slit)', fmtNear(r.env))}
    </div>
    <div class="card tight"><div class="ttl">Statistics</div>
      ${kv('particles detected', String(st.nDet))}
      <p class="help">Bright fringe where Δr is a whole number of wavelengths (amplitudes in phase), dark where it is a half-integer. The histogram of single detections converges on the exact |ψ|² curve — probability amplitudes are the only thing "waving".</p>
    </div>`;
  },
  chip(st){
    const r = qmSlitIntensity(st.probe, st.Q);
    return `<div class="k">double slit · γ = ${st.Q.gamma.toFixed(2)}</div>
      <div>N = ${st.nDet}</div><div>Δr/λ at probe = ${fmtNum(r.dr / st.Q.lambda, 3)}</div>
      <div style="color:var(--c-pos)">I(probe) = ${fmtNear(r.I)}</div>`;
  },
  legend(){ return [['var(--accent)', 'exact I(y) = env·(1 + γ cos kΔr)'], ['var(--c-pos)', 'histogram of single detections'], ['var(--text)', 'each dot: one whole particle']]; }
};
