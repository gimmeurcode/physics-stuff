/* ============================================================================
   4s · THE STRING WING — I · THE SPECTRUM
   Where the subject actually began: a formula guessed from hadron data in 1968,
   and the discovery four years later that the formula was a string.

   Colour convention, kept across all five files of this wing:
     the string / the worldsheet / the bulk ......... TH.grad
     the spectrum, the tower, the boundary CFT ...... TH.curl
     measured data and the reader's own choice ...... TH.pos
     excluded, forbidden, or classically impossible . TH.neg
     the critical value — where something changes ... TH.accent
     conjectural, not established ................... TH.warn
   ============================================================================ */

/* ---- helpers shared by every stage in this wing --------------------------- */

/* a section heading inside the canvas. Centred, because the readout chip floats
   over the top-left corner and would otherwise sit on top of it. */
function wsTitle(ctx, cx, y, s, col){
  rlText(ctx, cx, y, s, rgbCss(col || TH.dim), '600 11.5px ' + FONT_UI, 'center', 'middle');
}
function wsSub(ctx, cx, y, s, col){
  rlText(ctx, cx, y, s, rgbCss(col || TH.faint), '10.5px ' + FONT_UI, 'center', 'middle');
}
/* A two-column key-and-number line, used inside canvas panels. The column has
   to be wide enough for the longest label plus the number right-aligned against
   it — at 170 px the geodesic panel's labels ran straight through their own
   values, which no automated check would have caught. */
function wsNum(ctx, x, y, k, v, col, w){
  rlText(ctx, x, y, k, rgbCss(TH.faint), '10.5px ' + FONT_UI, 'left', 'middle');
  rlText(ctx, x + (w || 250), y, v, rgbCss(col || TH.text), '600 11px ' + FONT_MONO, 'right', 'middle');
}
/* α′ presets. The wing runs the same mathematics at two wildly separated
   scales, and the fact that only the number changes is the point. */
const WS_SCALES = {
  hadronic: { ap: 0.9,    n:'hadronic — α′ ≈ 0.9 GeV⁻²',   note:'the slope fitted to real mesons, where the "string" is a QCD flux tube' },
  planck:   { ap: 1e-32,  n:'Planckian — α′ ≈ 10⁻³² GeV⁻²', note:'the fundamental-string reading, with M_s near 10¹⁶ GeV' }
};
/* the theories this wing lets you switch between, with what each one predicts
   at its own lowest levels — identified, not left as a number */
const WS_KINDS = {
  ob: { kind:'bos',   open:true,  nb:24, nf:0, n:'open bosonic',
        low:['a tachyon — M² < 0, the theory is unstable',
             'a massless vector: 24 states, a photon',
             'massive, spin up to 2'] },
  cb: { kind:'bos',   open:false, nb:24, nf:0, n:'closed bosonic',
        low:['a tachyon, four times as tachyonic as the open one',
             '24 × 24 = 576 states: graviton (299) ⊕ B-field (276) ⊕ dilaton (1)',
             'massive, spin up to 4'] },
  os: { kind:'super', open:true,  nb:8,  nf:8, n:'open superstring',
        low:['massless: 8 vector ⊕ 8 spinor states — a gauge field and its gaugino',
             'the first massive level, α′M² = 1',
             'α′M² = 2'] },
  cs: { kind:'super', open:false, nb:8,  nf:8, n:'closed superstring (type II)',
        low:['massless: 256 states — graviton, gravitini, and the RR forms',
             'the first massive level',
             'and upwards'] }
};

/* ============================================================================
   1 · THE VIBRATING STRING AND ITS TOWER
   ============================================================================ */
STAGES.wsModes = {
  title: 'The string, and the tower it makes',
  dockLegend: true,
  derive(st){
    const K = WS_KINDS[st.kind];
    const a = K.kind === 'super' ? 0.5 : 1;
    const am2 = K.open ? wsOpenAlphaM2(st.N, K.kind) : wsClosedAlphaM2(st.N, K.kind);
    return {
      title:'From a wave on a string to a table of particles',
      steps:[
        drvSay('the one assumption',
          'Replace the point particle by a one-dimensional object of tension T. Nothing else is added — no new force, no new field, no adjustable parameter beyond the tension itself. Everything below is a consequence.'),
        drvStep('the action is the area of the worldsheet',
          `${dv('S')} ${dop('=')} ${dop('−')}${dv('T')} ∫ ${dv('d')}${dv('A')}`,
          'the Nambu–Goto action — a particle extremises length, a string extremises area, and there is nothing else a reparametrisation-invariant object could extremise'),
        drvStep('which makes the transverse coordinates free waves',
          `∂²${dv('X')}^μ ${dop('=')} 0`,
          'in conformal gauge; the constraints remove the two directions along the worldsheet, leaving D − 2 physical oscillators'),
        drvSay('so a string is a violin string, and the rest is Fourier',
          'A wave equation on a finite interval has normal modes. Each mode is an independent harmonic oscillator, each carries quanta, and the total energy of those quanta is what a distant observer calls the mass of the object. That is the entire mechanism.'),
        drvStep('quantise each mode and count the quanta',
          `${dv('N')} ${dop('=')} Σ ${dv('n')} ${dv('N')}_n`,
          `level ${fmtNum(st.N, 3)} on this stage — the total oscillator number, not the number of oscillators excited`),
        drvStep('the mass is the level, minus the zero-point constant',
          K.open ? `α′${dv('M')}² ${dop('=')} ${dv('N')} ${dop('−')} ${dnum(a)}`
                 : `α′${dv('M')}² ${dop('=')} 4(${dv('N')} ${dop('−')} ${dnum(a)})`,
          `α′M² = ${fmtNum(am2, 5)} here, so M = ${fmtNum(wsMassGeV(am2, st.ap), 5)} GeV at the chosen α′`),
        drvSay('the subtracted constant is not a fudge',
          'It is ½Σn over the transverse oscillators — a divergent zero-point energy that must be regularised. Doing so honestly gives −(D−2)/24, and demanding that level 1 come out exactly massless then FIXES the number of dimensions. That calculation has its own stage; here it is only the number being subtracted.'),
        drvStep('and the number of states at each level explodes',
          `${dv('d')}_N ${dop('∼')} ${dv('N')}^(−(${dv('c')}{+}3)/4) ${dop('e')}^(2π√(${dv('c')}${dv('N')}/6))`,
          `level ${st.N} carries ${fmtNum(wsLevelCountFor(K, st.N), 5)} states — counted exactly by the partition recursion, not estimated`),
        drvSay('which is why a string has a maximum temperature',
          'A density of states growing like e^(βH·M) makes the Boltzmann sum Σ d(M)e^(−βM) diverge once β falls below βH. Above the Hagedorn temperature the canonical ensemble simply does not exist — energy poured in goes into making longer strings rather than hotter ones.')
      ],
      note:'The animation is the actual superposition of the excited normal modes with the amplitudes shown; the tower on the right is the exact spectrum of the theory selected. Only the value of α′ separates the hadronic reading of this picture from the Planckian one.'
    };
  },
  enter(st, o){
    st.kind  = o.kind || 'ob';
    st.N     = o.N === undefined ? 2 : o.N;
    st.scale = o.scale || 'hadronic';
    st.ap    = WS_SCALES[st.scale].ap;
    st.amp   = o.amp === undefined ? 0.55 : o.amp;
    st.showCount = o.showCount !== false;
  },
  controls(){
    const st = ST;
    return ctSeg('wsMdK', st.kind, [['ob','open bosonic'],['cb','closed bosonic'],
                                    ['os','open superstring'],['cs','closed superstring']]) +
      ctSeg('wsMdS', st.scale, [['hadronic','α′ = 0.9 GeV⁻²'],['planck','α′ = 10⁻³² GeV⁻²']]) +
      /* the NS sector's levels are half-odd-integers, so the slider has to be
         able to reach ½ — at step 1 the massless state was unreachable */
      ctlRow('level N', ctlSlider('wsMdN', 0, 24, WS_KINDS[st.kind].kind === 'super' ? 0.5 : 1, st.N)) +
      ctlRow('amplitude', ctlSlider('wsMdA', 0.1, 1, 0.02, st.amp)) +
      ctChk('wsMdC', 'show the state count and its asymptotics', st.showCount) +
      `<p class="help">A string has normal modes exactly as a violin string does, and each mode is a
      quantum oscillator. The <b>total</b> number of quanta, N, is the only thing the mass depends on —
      not which modes carry them. That is why the spectrum is a ladder and why the number of states on
      each rung grows so violently: the ways of writing N as a sum of mode numbers, in 24 colours.
      Level 1 of the closed string contains a massless spin-2 particle. Nobody put gravity in.</p>`;
  },
  wire(){
    /* switching to the superstring must also snap N onto the half-integer
       ladder, or the tower marker sits between two rungs */
    ctWireSeg('wsMdK', v => {
      ST.kind = v;
      const q = WS_KINDS[v].kind === 'super' ? 0.5 : 1;
      ST.N = Math.max(0, Math.round(ST.N / q) * q);
    });
    ctWireSeg('wsMdS', v => { ST.scale = v; ST.ap = WS_SCALES[v].ap; });
    wireSlider('wsMdN', () => ST.N, v => {
      const q = WS_KINDS[ST.kind].kind === 'super' ? 0.5 : 1;
      ST.N = Math.round(v / q) * q;
    }, v => 'N = ' + fmtNum(+v, 3));
    wireSlider('wsMdA', () => ST.amp, v => { ST.amp = v; }, v => '×' + fmtNum(+v, 3));
    ctWireChk('wsMdC', v => { ST.showCount = v; });
  },
  frame(st, dt, ctx, W, H){
    const K = WS_KINDS[st.kind];
    const a = K.kind === 'super' ? 0.5 : 1;
    const am2 = K.open ? wsOpenAlphaM2(st.N, K.kind) : wsClosedAlphaM2(st.N, K.kind);

    /* ---- the string itself, drawn from its actual mode expansion ---- */
    const cx = W * 0.23, cy = H * 0.30, R = Math.min(W * 0.15, H * 0.20);
    wsTitle(ctx, cx, cy - R - 40, K.open ? 'an open string, both ends free'
                                         : 'a closed string, a loop with no ends', TH.grad);
    /* the excited modes: spread the level over the lowest few harmonics so the
       picture changes as N does, without pretending N fixes the partition */
    const modes = [];
    let left = Math.max(0, st.N);
    for(let n = 1; n <= 5 && left > 0; n++){ const take = Math.min(left, n === 1 ? 2 : 1); modes.push([n, take]); left -= take * n; }
    if(!modes.length) modes.push([1, 0]);
    const disp = u => {
      let d = 0;
      for(const [n, q] of modes) d += (q ? Math.sqrt(q) : 0) * Math.sin(n * Math.PI * u) * Math.cos(st.t * (1.4 + 0.5 * n)) / n;
      return d * st.amp * R * 0.55;
    };
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath();
    if(K.open){
      for(let i = 0; i <= 160; i++){
        const u = i / 160, x = cx - R + 2 * R * u, y = cy + disp(u);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      rlDot(ctx, cx - R, cy + disp(0), 5, rgbCss(TH.pos));
      rlDot(ctx, cx + R, cy + disp(1), 5, rgbCss(TH.pos));
      wsSub(ctx, cx, cy + R + 26, 'the ends are where a gauge field lives — that is what a D-brane is');
    } else {
      for(let i = 0; i <= 200; i++){
        const th = i / 200 * 2 * Math.PI;
        const r = R * (1 + 0.5 * st.amp * modeSumClosed(modes, th, st.t));
        const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
      wsSub(ctx, cx, cy + R + 26, 'left-movers and right-movers run round it independently');
    }
    ctx.lineCap = 'butt';
    const live = modes.filter(m => m[1]).map(m => 'n=' + m[0] + ' × ' + m[1]).join('   ');
    rlText(ctx, cx, cy - R - 22, live ? 'modes excited:  ' + live : 'the ground state — nothing is oscillating',
      rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');

    /* ---- the tower ---- */
    const P = mkPlot(W * 0.40, 46, W * 0.24, H - 118, -0.6, 1.6, -4.6, 25);
    plotFrame(ctx, P, '', 'α′M²', 'the spectrum — every rung is a particle');
    rlYTicks(ctx, P, [-4, 0, 4, 8, 12, 16, 20, 24]);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(P.px, P.Y(0)); ctx.lineTo(P.px + P.pw, P.Y(0)); ctx.stroke();
    const step = K.kind === 'super' ? 0.5 : 1;
    for(let n = 0; n <= 24; n += step){
      const m2 = K.open ? wsOpenAlphaM2(n, K.kind) : wsClosedAlphaM2(n, K.kind);
      if(m2 > 25 || m2 < -4.6) continue;
      const sel = Math.abs(n - st.N) < 1e-9;
      const col = m2 < 0 ? TH.neg : (Math.abs(m2) < 1e-9 ? TH.accent : TH.curl);
      rlSegment(ctx, P.px + 14, P.Y(m2), P.px + P.pw - 14, P.Y(m2), rgbCss(col, sel ? 1 : 0.5), sel ? 3 : 1.5);
      if(sel) rlText(ctx, P.px + P.pw - 10, P.Y(m2) - 9, 'N = ' + fmtNum(n, 3),
                     rgbCss(TH.pos), '600 10px ' + FONT_MONO, 'right');
    }
    const m2sel = am2;
    if(m2sel >= -4.6 && m2sel <= 25) rlDot(ctx, P.px + P.pw / 2, P.Y(m2sel), 5, rgbCss(TH.pos));
    if(K.kind !== 'super')
      rlText(ctx, P.px + 16, P.Y(-3.0), 'below the axis: M² < 0', rgbCss(TH.neg), '10px ' + FONT_UI);

    /* ---- the count ---- */
    if(st.showCount){
      const Q = mkPlot(W * 0.69, 46, W * 0.27, H - 118, 1, 40, 0, 165);
      plotFrame(ctx, Q, 'level N', 'ln (number of states)',
        'how fast the rungs fill — and why T has a ceiling');
      plotTicksX(ctx, Q, [1, 10, 20, 30, 40], v => fmtNum(v, 2));
      rlYTicks(ctx, Q, [0, 40, 80, 120, 160]);
      const c = wsEffectiveC(K.nb, K.nf);
      const d = K.nf ? wsBoseFermiStates(40, K.nb, K.nf) : wsLevelStates(40, K.nb);
      const xs = [], ys = [], ls = [], ss = [];
      for(let n = 1; n <= 40; n++){
        xs.push(n); ys.push(d[n] > 0 ? Math.log(d[n]) : 0);
        ls.push(wsCardyLog(c, n)); ss.push(wsSaddleLog(n, c));
      }
      rlLine(ctx, Q, xs, ls, rgbCss(TH.faint), 1.4, [4, 4]);
      rlLine(ctx, Q, xs, ss, rgbCss(TH.accent), 1.6, [2, 3]);
      rlLine(ctx, Q, xs, ys, rgbCss(TH.curl), 2.4);
      const nSel = Math.max(1, Math.min(40, Math.round(st.N)));
      rlDot(ctx, Q.X(nSel), Q.Y(ys[nSel - 1]), 5, rgbCss(TH.pos));
      rlText(ctx, Q.px + 8, Q.py + 16, 'exact count', rgbCss(TH.curl), '10px ' + FONT_MONO);
      rlText(ctx, Q.px + 8, Q.py + 30, 'saddle point', rgbCss(TH.accent), '10px ' + FONT_MONO);
      rlText(ctx, Q.px + 8, Q.py + 44, 'leading term only', rgbCss(TH.faint), '10px ' + FONT_MONO);
    }
    stageNote(ctx, 'nothing here was assumed about particles — a tension, a wave equation, and counting', W, H);
  },
  readout(st){
    const K = WS_KINDS[st.kind];
    const a = K.kind === 'super' ? 0.5 : 1;
    const am2 = K.open ? wsOpenAlphaM2(st.N, K.kind) : wsClosedAlphaM2(st.N, K.kind);
    const M = wsMassGeV(am2, st.ap);
    const c = wsEffectiveC(K.nb, K.nf);
    const nInt = Math.max(1, Math.min(40, Math.round(st.N)));
    const d = K.nf ? wsBoseFermiStates(40, K.nb, K.nf) : wsLevelStates(40, K.nb);
    const cnt = d[nInt];
    const TH_ = wsHagedornT(st.ap, K.kind);
    const idx = Math.min(2, Math.round(st.N / (K.kind === 'super' ? 0.5 : 1)));
    return `<div class="card tight"><div class="ttl">${K.n} — level ${fmtNum(st.N, 3)}</div>
      ${kv('intercept a (subtracted zero-point)', fmtNum(a, 3))}
      ${kv('α′M²', fmtNum(am2, 5))}
      ${kv('mass', am2 < 0 ? 'imaginary — this state is a tachyon'
                           : fmtNum(M, 5) + ' GeV' + (st.scale === 'planck' ? '  (≈ ' + fmtNum(M / WS_MPL_GEV, 4) + ' M_Pl)' : ''))}
      ${kv('what sits here', K.low[idx] || 'a massive level with spin up to N')}
      <p class="help">Only the <b>total</b> oscillator number sets the mass. Splitting N between different
      harmonics changes the state but not its mass, which is why each rung holds so many particles at once —
      and why a single tension produces an entire particle physics rather than a single particle.</p>
    </div>
    <div class="card tight"><div class="ttl">Counting the rung</div>
      ${kv('transverse oscillators', K.nb + ' bosonic' + (K.nf ? ' + ' + K.nf + ' fermionic' : ''))}
      ${kv('effective central charge c', fmtNum(c, 4))}
      ${kv('states at level ' + nInt + ' (exact recursion)', fmtNum(cnt, 6))}
      ${kv('  ln of that', fmtNum(Math.log(cnt), 6))}
      ${kv('leading term 2π√(cN/6)', fmtNum(wsCardyLog(c, nInt), 6))}
      ${kv('full saddle point', fmtNum(wsSaddleLog(nInt, c), 6))}
      ${kv('  difference from the exact count', fmtNum(Math.log(cnt) - wsSaddleLog(nInt, c), 4))}
      <p class="help">The leading term alone is a poor match at these levels — the ratio is still well under
      one — and quoting only it would look like a failure. Evaluating the whole contour integral, prefactor
      included, brings the two together: the difference above falls off like 1/√N and is the honest measure
      of how far the asymptotics have converged.</p>
    </div>
    <div class="card tight"><div class="ttl">The Hagedorn ceiling</div>
      ${kv('β_H', fmtNum(wsHagedornBeta(st.ap, K.kind), 5) + ' GeV⁻¹')}
      ${kv('T_H', fmtNum(TH_, 5) + ' GeV')}
      ${kv('  in kelvin', fmtNum(TH_ * WS_GEV_J / 1.380649e-23, 4) + ' K')}
      ${kv('as a fraction of the string scale', fmtNum(TH_ / wsStringScale(st.ap), 5))}
      <p class="help">Because the number of states grows like e<sup>β<sub>H</sub>M</sup>, the partition sum
      Σd(M)e<sup>−βM</sup> diverges for β &lt; β<sub>H</sub>. There is a highest temperature at which the
      canonical ensemble exists at all. At the hadronic reading this lands near 170 MeV — remarkably close
      to the measured QCD deconfinement temperature, which is not a coincidence: a hadron really is a
      string of chromoelectric flux, and this wing's other stages measure its tension.</p>
    </div>`;
  },
  chip(st){
    const K = WS_KINDS[st.kind];
    const am2 = K.open ? wsOpenAlphaM2(st.N, K.kind) : wsClosedAlphaM2(st.N, K.kind);
    return `<div class="k">${K.n}</div>
      <div style="color:var(--c-curl)">α′M² = ${fmtNum(am2, 4)}</div>
      <div style="color:var(--c-pos)">N = ${fmtNum(st.N, 3)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the string, drawn from its own mode expansion'],
                    ['var(--c-curl)', 'the massive rungs of the tower, and the exact state count'],
                    ['var(--accent)', 'the massless rung — where the photon and the graviton live'],
                    ['var(--c-neg)',  'M² < 0 — the bosonic tachyon, which the superstring removes'],
                    ['var(--c-pos)',  'the level you have selected'],
                    ['var(--faint)',  'the leading asymptotic term on its own']]; }
};
/* the closed string's shape: two counter-rotating waves, which is the whole
   difference between a closed string and an open one */
function modeSumClosed(modes, th, t){
  let d = 0;
  for(const [n, q] of modes){
    if(!q) continue;
    d += Math.sqrt(q) * (Math.cos(n * th - t * (1.2 + 0.4 * n)) + Math.cos(n * th + t * (1.2 + 0.4 * n))) / (2 * n);
  }
  return d;
}
function wsLevelCountFor(K, N){
  const n = Math.max(0, Math.min(40, Math.round(N)));
  const d = K.nf ? wsBoseFermiStates(40, K.nb, K.nf) : wsLevelStates(40, K.nb);
  return d[n];
}

/* ============================================================================
   2 · REGGE TRAJECTORIES — the measurement that started it
   ============================================================================ */
STAGES.wsRegge = {
  title: 'Regge trajectories, fitted to real mesons',
  dockLegend: true,
  derive(st){
    const T = st.family === 'N' ? WS_N_TRAJ : WS_RHO_TRAJ;
    const f = wsReggeFit(T, st.firmOnly);
    return {
      title:'A rotating string, and the straight line it puts in the data',
      steps:[
        drvSay('the observation came first',
          'By the mid-1960s it was clear that hadrons of the same quantum numbers but different spin were not scattered at random. Plot spin against mass SQUARED and they lie on straight lines. No model predicted that; it was simply true, and it needed explaining.'),
        drvStep('spin a straight string at the speed of light at its ends',
          `${dv('M')} ${dop('=')} ∫ ${dfrac(dv('T') + ' ' + dv('dl'), '√(1 − ' + dv('v') + '²)')}`,
          'the ends must move at c, because a relativistic string has no other equilibrium; the interior moves more slowly'),
        drvStep('and its angular momentum',
          `${dv('J')} ${dop('=')} ∫ ${dfrac(dv('T') + ' ' + dv('v') + ' ' + dv('l') + ' ' + dv('dl'), '√(1 − ' + dv('v') + '²)')}`,
          'both integrals are elementary once v(l) = l/L is put in — the two divide to give a pure number'),
        drvStep('the length cancels, and only the tension survives',
          `${dv('J')} ${dop('=')} ${dfrac('1', '2π' + dv('T'))} ${dv('M')}² ${dop('=')} α′${dv('M')}²`,
          'a straight line through the origin in the (M², J) plane, with slope 1/2πT — which is exactly what the data showed'),
        drvSay('so the slope is the tension, and it is measurable',
          'This is the closest thing string theory has to a direct measurement. The line is really there in the meson data, and its slope really does give a tension of about a tonne of force. Quantum corrections shift the line off the origin by an intercept α₀, which is why the fit below has two parameters rather than one.'),
        drvStep('the fit to PDG 2024 masses',
          `${dv('J')} ${dop('=')} α′${dv('M')}² ${dop('+')} α₀`,
          `α′ = ${fmtNum(f.alphaP, 5)} ± ${fmtNum(f.se, 3)} GeV⁻², α₀ = ${fmtNum(f.alpha0, 4)}, r² = ${fmtNum(f.r2, 7)} over ${f.used.length} states`),
        drvStep('which converts to a string tension',
          `${dfn('σ')} ${dop('=')} ${dfrac('1', '2πα′')}`,
          `${fmtNum(wsTensionGeVfm(f.alphaP) * 1000, 5)} MeV/fm — compare the atom wing's Cornell-potential value of ${SIGMA_STRING} MeV/fm, fitted to completely different data`),
        drvSay('two independent routes to the same tension',
          'The Cornell potential is fitted to charmonium and bottomonium level spacings; this line is fitted to light-meson spins. They have no input in common, and they agree to a couple of percent. That agreement is the evidence that a hadron really does contain a string of chromoelectric flux.'),
        drvSay('and this is a QCD string, not a fundamental one',
          'The tension here is about 1 GeV per femtometre. A fundamental string, if there is one, has a tension some thirty-eight orders of magnitude larger. The mathematics is identical; only α′ changes. That is why this stage carries both scales.')
      ],
      note:'The fit is ordinary least squares over M², with r², the residuals and the standard error of the slope all reported — a slope quoted without them would be an assertion rather than a measurement. The last two states carry PDG flags and can be dropped from the fit.'
    };
  },
  enter(st, o){
    st.family = o.family || 'rho';
    st.firmOnly = o.firmOnly !== false;
    st.showString = o.showString !== false;
  },
  controls(){
    const st = ST;
    return ctSeg('wsRgF', st.family, [['rho','the ρ / a meson family'],['N','the nucleon family']]) +
      ctChk('wsRgO', 'use only the states the PDG lists as established', st.firmOnly) +
      ctChk('wsRgS', 'show the rotating string that produces the line', st.showString) +
      `<p class="help">Plot spin against mass <b>squared</b> and hadrons fall on straight lines. A spinning
      relativistic string of tension T predicts exactly that, with slope 1/2πT and nothing else — the length
      of the string cancels out of the calculation entirely. The fit below runs on the PDG 2024 central
      values, and the tension it produces is compared with the one the atom wing gets from the Cornell
      potential, which was fitted to entirely different measurements.</p>`;
  },
  wire(){
    ctWireSeg('wsRgF', v => { ST.family = v; });
    ctWireChk('wsRgO', v => { ST.firmOnly = v; });
    ctWireChk('wsRgS', v => { ST.showString = v; });
  },
  frame(st, dt, ctx, W, H){
    const T = st.family === 'N' ? WS_N_TRAJ : WS_RHO_TRAJ;
    const f = wsReggeFit(T, st.firmOnly);
    const m2max = Math.max(...T.map(p => p.M * p.M)) * 1.15;
    const jmax  = Math.max(...T.map(p => p.J)) + 1;

    const px = st.showString ? W * 0.40 : W * 0.16;
    const pw = st.showString ? W * 0.55 : W * 0.78;
    const P = mkPlot(px, 52, pw, H - 130, 0, m2max, -0.6, jmax);
    plotFrame(ctx, P, 'M²   (GeV²)', 'spin J',
      st.family === 'N' ? 'the nucleon trajectory — baryons lie on lines too'
                        : 'the ρ / a trajectory — PDG 2024 masses');
    plotTicksX(ctx, P, [0, 1, 2, 3, 4, 5, 6].filter(v => v <= m2max), v => fmtNum(v, 2));
    rlYTicks(ctx, P, [0, 1, 2, 3, 4, 5, 6].filter(v => v <= jmax));
    plotZeroY(ctx, P);
    /* the fitted line, drawn across the whole box so the intercept is visible */
    rlSegment(ctx, P.X(0), P.Y(f.alpha0), P.X(m2max), P.Y(f.alpha0 + f.alphaP * m2max),
              rgbCss(TH.curl), 2.2);
    rlText(ctx, P.X(m2max * 0.62), P.Y(f.alpha0 + f.alphaP * m2max * 0.62) - 14,
      'J = ' + fmtNum(f.alphaP, 4) + ' M² + ' + fmtNum(f.alpha0, 3),
      rgbCss(TH.curl), '600 11px ' + FONT_MONO, 'center');
    /* the measured states, with their PDG error bars in M² */
    for(const p of T){
      const x = p.M * p.M, ex = 2 * p.M * p.dM;
      const inFit = !st.firmOnly || p.firm;
      const col = inFit ? TH.pos : TH.faint;
      rlSegment(ctx, P.X(x - ex), P.Y(p.J), P.X(x + ex), P.Y(p.J), rgbCss(col), 2);
      rlDot(ctx, P.X(x), P.Y(p.J), inFit ? 5 : 4, rgbCss(col), inFit ? rgbCss(TH.bg) : null);
      rlText(ctx, P.X(x), P.Y(p.J) - 15, p.n, rgbCss(col), '10.5px ' + FONT_UI, 'center');
      if(!p.firm) rlText(ctx, P.X(x), P.Y(p.J) + 17, 'PDG: needs confirmation',
                         rgbCss(TH.warn), '9.5px ' + FONT_UI, 'center');
      /* the residual, drawn as the gap it is */
      if(inFit){
        const pred = f.alpha0 + f.alphaP * x;
        rlSegment(ctx, P.X(x), P.Y(p.J), P.X(x), P.Y(pred), rgbCss(TH.neg, 0.85), 1.6, [3, 3]);
      }
    }
    rlText(ctx, P.px + 10, P.py + P.ph - 14,
      'r² = ' + fmtNum(f.r2, 6) + '   rms residual in J = ' + fmtNum(f.fit.rms, 3),
      rgbCss(TH.dim), '10.5px ' + FONT_MONO);

    /* ---- the rotating string that produces the line ---- */
    if(st.showString){
      /* The readout chip floats over the canvas's top-left ~180x90 px, so this
         scene's heading goes UNDER it rather than above — a title centred on
         this column was being clipped by the chip. */
      const cx = W * 0.19, cy = H * 0.44, R = Math.min(W * 0.13, H * 0.24);
      const th = st.t * 1.1;
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - R * Math.cos(th), cy - R * Math.sin(th));
      ctx.lineTo(cx + R * Math.cos(th), cy + R * Math.sin(th));
      ctx.stroke(); ctx.lineCap = 'butt';
      rlDot(ctx, cx + R * Math.cos(th), cy + R * Math.sin(th), 6, rgbCss(TH.pos));
      rlDot(ctx, cx - R * Math.cos(th), cy - R * Math.sin(th), 6, rgbCss(TH.pos));
      ctx.strokeStyle = rgbCss(TH.faint, 0.5); ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
      /* the local speed, sampled along the string — this is the whole argument */
      for(let i = 1; i <= 5; i++){
        const u = i / 6;
        const x = cx + R * u * Math.cos(th), y = cy + R * u * Math.sin(th);
        rlArrow(ctx, x, y, x - R * u * 0.5 * Math.sin(th), y + R * u * 0.5 * Math.cos(th),
                rgbCss(TH.curl, 0.8), 1.4, 6);
      }
      wsTitle(ctx, cx, cy + R + 26, 'a straight string spinning about its centre', TH.grad);
      wsSub(ctx, cx, cy + R + 44, 'the ends move at c; the middle barely moves');
      wsSub(ctx, cx, cy + R + 60, 'M and J are both integrals of the same tension');
      wsSub(ctx, cx, cy + R + 76, 'their ratio is 2πT, and the length cancels');
    }
    stageNote(ctx, 'dashed red is each state\'s residual — the distance between the measurement and the fitted line', W, H);
  },
  readout(st){
    const T = st.family === 'N' ? WS_N_TRAJ : WS_RHO_TRAJ;
    const f = wsReggeFit(T, st.firmOnly);
    const fAll = wsReggeFit(T, false);
    const sig = wsTensionGeVfm(f.alphaP) * 1000;
    /* in MeV, because fmtNum keeps significant figures rather than decimal
       places: a 0.25 MeV uncertainty asked for in GeV at two figures prints
       as a bare "0", which reads as an exact measurement */
    const rows = f.used.map((p, i) => kv(p.n + '  (J = ' + fmtNum(p.J, 2) + ')',
      fmtNum(p.M * 1000, 6) + ' ± ' + fmtNum(p.dM * 1000, 3) + ' MeV  →  residual ' +
      fmtNum(f.resid[i], 3))).join('');
    return `<div class="card tight"><div class="ttl">The fit, and its evidence</div>
      ${kv('slope α′', fmtNum(f.alphaP, 5) + ' ± ' + fmtNum(f.se, 3) + ' GeV⁻²')}
      ${kv('intercept α₀', fmtNum(f.alpha0, 4))}
      ${kv('r²', fmtNum(f.r2, 7))}
      ${kv('states used', String(f.used.length) + ' of ' + T.length)}
      ${kv('rms residual in J', fmtNum(f.fit.rms, 4))}
      ${kv('slope with the unconfirmed states included', fmtNum(fAll.alphaP, 5) + ' GeV⁻²')}
      ${rows}
    </div>
    <div class="card tight"><div class="ttl">The tension this implies</div>
      ${kv('σ = 1/2πα′', fmtNum(wsTension(f.alphaP), 5) + ' GeV²')}
      ${kv('  in MeV per femtometre', fmtNum(sig, 5))}
      ${kv('  the atom wing\'s Cornell value', fmtNum(SIGMA_STRING, 4) + ' MeV/fm')}
      ${kv('  difference', fmtNum(Math.abs(sig - SIGMA_STRING), 3) + ' MeV/fm  (' +
            fmtNum(100 * Math.abs(sig - SIGMA_STRING) / SIGMA_STRING, 3) + '%)')}
      ${kv('as an ordinary force', fmtNum(wsTensionNewton(f.alphaP), 4) + ' N')}
      ${kv('  which is about', fmtNum(wsTensionNewton(f.alphaP) / 9.80665 / 1000, 3) + ' tonnes weight')}
      <p class="help">Two fits with no data in common — light-meson spins here, heavy-quarkonium level
      spacings for the Cornell potential — land within a few percent of each other. That is the evidence
      that the flux between a quark and an antiquark really does behave like a string with a tension, and
      it is why pulling them apart creates new hadrons instead of freeing a quark: past about a femtometre
      it is cheaper to snap the string than to keep stretching it.</p>
    </div>
    <div class="card tight"><div class="ttl">And the same line at the other scale</div>
      ${kv('if this were a FUNDAMENTAL string', 'α′ ≈ 10⁻³² GeV⁻²')}
      ${kv('its tension', fmtNum(wsTensionNewton(1e-32), 4) + ' N')}
      ${kv('  larger than the hadronic one by', fmtNum(wsTensionNewton(1e-32) / wsTensionNewton(f.alphaP), 4) + '×')}
      ${kv('first massive level', fmtNum(wsMassGeV(1, 1e-32), 4) + ' GeV')}
      <p class="help">The mathematics does not change — only the number. That is simultaneously the appeal
      of the idea and the difficulty with it: the same equations that describe a measurable flux tube would,
      at a tension thirty-eight orders of magnitude higher, describe quantum gravity, and there is currently
      no experiment that can reach the second reading.</p>
    </div>`;
  },
  chip(st){
    const f = wsReggeFit(st.family === 'N' ? WS_N_TRAJ : WS_RHO_TRAJ, st.firmOnly);
    return `<div class="k">Regge slope</div>
      <div style="color:var(--c-curl)">α′ = ${fmtNum(f.alphaP, 4)} GeV⁻²</div>
      <div style="color:var(--c-pos)">r² = ${fmtNum(f.r2, 5)}</div>`;
  },
  legend(){ return [['var(--c-pos)',  'the measured states, with PDG error bars in M²'],
                    ['var(--c-curl)', 'the least-squares line, and the spinning string'],
                    ['var(--c-neg)',  'each residual — measurement minus fit'],
                    ['var(--c-grad)', 'the rotating string itself'],
                    ['var(--c-warn)', 'states the PDG flags as needing confirmation'],
                    ['var(--faint)',  'states excluded from the fit']]; }
};

/* ============================================================================
   3 · THE VENEZIANO AMPLITUDE
   ============================================================================ */
STAGES.wsVen = {
  title: 'The Veneziano amplitude',
  dockLegend: true,
  derive(st){
    const at = wsAlphaOf(st.t, st.ap, st.a0);
    const sl = wsReggeSlopeMeasured(st.t, st.ap, st.a0, 60, 400);
    return {
      title:'A formula guessed in 1968, and the object it turned out to describe',
      steps:[
        drvSay('the puzzle it solved',
          'Scattering amplitudes were expected to be a sum over exchanged particles in the s-channel PLUS a sum in the t-channel. Veneziano found a single function that reproduces both sums at once — each is already contained in the other. That is duality, and no field theory does it.'),
        drvStep('the guess',
          `${dv('A')}(${dv('s')},${dv('t')}) ${dop('=')} ${dv('B')}(${dop('−')}α(${dv('s')}), ${dop('−')}α(${dv('t')}))`,
          `with α(x) = ${fmtNum(st.a0, 3)} + ${fmtNum(st.ap, 3)}x — the very Regge trajectory the meson data showed`),
        drvStep('the Beta function is an integral over one variable',
          `${dv('B')}(${dv('a')},${dv('b')}) ${dop('=')} ∫₀¹ ${dv('x')}^(${dv('a')}{−}1)(1{−}${dv('x')})^(${dv('b')}{−}1) ${dv('dx')}`,
          'and four years later that variable was identified as the position of a vertex operator on the boundary of a worldsheet'),
        drvSay('which is why it works',
          'Moving one insertion point past another on the boundary continuously deforms an s-channel exchange into a t-channel one. They are not two processes to be added; they are one process described two ways. Duality is a statement about a disc, not about Feynman diagrams.'),
        drvStep('poles wherever α(s) is a non-negative integer',
          `α(${dv('s')}) ${dop('=')} 0, 1, 2, …`,
          `each pole is a particle of mass M² = (n − α₀)/α′; there are infinitely many, and that is the tower`),
        drvStep('the residue at level n is a polynomial of degree n',
          `${dfn('Res')}_n ${dop('=')} ${dfrac('(α_t{+}1)⋯(α_t{+}' + dv('n') + ')', dv('n') + '!')}`,
          `at α(t) = ${fmtNum(at, 4)} the level-${st.n} residue is ${fmtNum(wsVenezianoResidue(st.n, at), 5)} — degree n means spins 0 through n are exchanged there`),
        drvSay('and the residues must be positive, which is a real constraint',
          'A negative residue is a state of negative norm — a ghost, and the theory would not be a quantum theory at all. Demanding positivity at every level is one of the routes to D = 26. The amplitude was constrained long before anyone knew what it described.'),
        drvStep('at high energy and fixed angle it dies exponentially',
          `${dfn('ln')}|${dv('A')}| ${dop('∼')} ${dop('−')}α′(${dv('s')} ${dfn('ln')} ${dv('s')} ${dop('+')} ${dv('t')} ${dfn('ln')} ${dv('t')} ${dop('+')} ${dv('u')} ${dfn('ln')} ${dv('u')})`,
          'a field theory falls off as a power; this falls off faster than any power, which is the softness that makes loop integrals converge'),
        drvStep('and at high energy, fixed t, it is a pure power of s',
          `|${dv('A')}| ${dop('∼')} ${dv('s')}^α(${dv('t')})`,
          `the exponent measured off this stage is ${fmtNum(sl.slope, 6)} against α(t) = ${fmtNum(sl.alphaT, 6)} — a gap of ${fmtNum(sl.gap, 3)}`),
        drvSay('and in 2024 it was shown to be forced',
          'Recent S-matrix bootstrap work derived the Veneziano amplitude as the UNIQUE solution to crossing symmetry together with two mild conditions — faster-than-power-law high-energy falloff, and a level-truncation property. The string spectrum comes out as an OUTPUT of that argument rather than an input. Weakening the assumptions to "the amplitude merely vanishes at high energy" opens a three-parameter family containing the Veneziano, Coon and hypergeometric amplitudes, so the boundary of the result is now mapped as well.')
      ],
      note:'Poles are real infinities and the readout says so in words rather than printing one. The Regge exponent is measured by sampling at α(s) = n + ½ — the tops of the resonance bumps, where the oscillating signature factor is exactly ±1 — and fitting the slope of ln|A| against ln s.'
    };
  },
  enter(st, o){
    st.ap = o.ap === undefined ? 1 : o.ap;
    st.a0 = o.a0 === undefined ? 1 : o.a0;
    st.t  = o.t === undefined ? -1.4 : o.t;
    st.n  = o.n === undefined ? 2 : o.n;
    st.view = o.view || 'poles';
  },
  controls(){
    const st = ST;
    return ctSeg('wsVnV', st.view, [['poles','the amplitude and its poles'],
                                    ['regge','the Regge power law'],
                                    ['soft','fixed-angle softness']]) +
      ctlRow('α(t)', ctlSlider('wsVnT', -4, 0.6, 0.02, st.t)) +
      ctlRow('intercept α₀', ctlSlider('wsVnA', 0, 1.4, 0.02, st.a0)) +
      ctlRow('level n', ctlSlider('wsVnN', 0, 8, 1, st.n)) +
      `<p class="help">Units here are α′ = 1, so α(s) = α₀ + s and the poles sit at integers. The amplitude
      is <b>one function</b> whose s-channel poles and t-channel poles are the same information written two
      ways — sum over either channel and you have already counted the other. The residue at level n is a
      polynomial of degree n in α(t), and the degree is the highest spin exchanged there.</p>`;
  },
  wire(){
    ctWireSeg('wsVnV', v => { ST.view = v; });
    wireSlider('wsVnT', () => ST.t, v => { ST.t = v; },
               v => 'α(t) = ' + fmtNum(ST.a0 + ST.ap * (+v), 4));
    wireSlider('wsVnA', () => ST.a0, v => { ST.a0 = v; }, v => 'α₀ = ' + fmtNum(+v, 3));
    wireSlider('wsVnN', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const at = wsAlphaOf(st.t, st.ap, st.a0);
    if(st.view === 'poles'){
      const P = mkPlot(W * 0.10, 50, W * 0.84, (H - 132) * 0.62, -1.4, 6.4, -6, 6);
      plotFrame(ctx, P, 'α(s)', 'A(s,t)', 'one function — and every pole in it is a particle');
      plotTicksX(ctx, P, [-1, 0, 1, 2, 3, 4, 5, 6], v => fmtNum(v, 2));
      rlYTicks(ctx, P, [-6, -3, 0, 3, 6]);
      plotZeroY(ctx, P);
      /* draw between the poles so the curve never jumps across an infinity */
      for(let n = -2; n <= 7; n++){
        const lo = n + 1e-3, hi = n + 1 - 1e-3;
        if(hi < P.x0 || lo > P.x1) continue;
        const xs = [], ys = [];
        for(let i = 0; i <= 300; i++){
          const asv = lo + (hi - lo) * i / 300;
          xs.push(asv); ys.push(wsBeta(-asv, -at));
        }
        rlLine(ctx, P, xs, ys, rgbCss(TH.curl), 2);
      }
      for(let n = 0; n <= 6; n++){
        rlSegment(ctx, P.X(n), P.py, P.X(n), P.py + P.ph, rgbCss(TH.accent, 0.55), 1.2, [3, 4]);
        rlText(ctx, P.X(n) + 4, P.py + 14, 'n = ' + n, rgbCss(TH.accent), '10px ' + FONT_MONO);
      }
      rlSegment(ctx, P.X(st.n), P.py, P.X(st.n), P.py + P.ph, rgbCss(TH.pos), 2);
      /* the residue polynomial, underneath, in α(t) */
      const Q = mkPlot(W * 0.10, 50 + (H - 132) * 0.62 + 56, W * 0.84, (H - 132) * 0.38 - 22,
                       -4.2, 0.8, -3, 6);
      plotFrame(ctx, Q, 'α(t)', 'residue', 'the residue at the marked pole — a polynomial of degree n in α(t)');
      plotTicksX(ctx, Q, [-4, -3, -2, -1, 0], v => fmtNum(v, 2));
      rlYTicks(ctx, Q, [-3, 0, 3, 6]);
      plotZeroY(ctx, Q);
      plotCurve(ctx, Q, x => wsVenezianoResidue(st.n, x), 300, rgbCss(TH.grad), 2.2);
      rlDot(ctx, Q.X(at), Q.Y(wsVenezianoResidue(st.n, at)), 5, rgbCss(TH.pos));
      rlText(ctx, Q.px + 8, Q.py + 15,
        'degree ' + st.n + '  →  spins 0 … ' + st.n + ' are exchanged at this mass',
        rgbCss(TH.grad), '10.5px ' + FONT_UI);
      /* the zeros of the residue polynomial are where those spins decouple */
      for(let k = 1; k <= st.n; k++)
        if(-k >= Q.x0) rlDot(ctx, Q.X(-k), Q.Y(0), 3.5, rgbCss(TH.neg));
    } else if(st.view === 'regge'){
      const sl = wsReggeSlopeMeasured(st.t, st.ap, st.a0, 60, 400);
      const P = mkPlot(W * 0.12, 54, W * 0.80, H - 132, Math.log(20), Math.log(3000), -7, 2);
      plotFrame(ctx, P, 'ln s', 'ln |A|',
        'sampled at the tops of the resonances — the slope IS α(t)');
      plotTicksX(ctx, P, [Math.log(20), Math.log(100), Math.log(500), Math.log(3000)],
                 v => 's = ' + fmtNum(Math.exp(v), 3));
      rlYTicks(ctx, P, [-6, -4, -2, 0, 2]);
      const xs = [], ys = [];
      for(let n = 20; n <= 3000; n++){
        const s = (n + 0.5 - st.a0) / st.ap;
        if(s < 20) continue;
        const A = Math.abs(wsVeneziano(s, st.t, st.ap, st.a0));
        if(!Number.isFinite(A) || A <= 0) continue;
        xs.push(Math.log(s)); ys.push(Math.log(A));
      }
      for(let i = 0; i < xs.length; i += Math.max(1, Math.floor(xs.length / 220)))
        rlDot(ctx, P.X(xs[i]), P.Y(ys[i]), 2.4, rgbCss(TH.curl, 0.9));
      /* the line the exponent predicts, drawn through the first sample */
      if(xs.length){
        const b = ys[0] - at * xs[0];
        rlSegment(ctx, P.X(P.x0), P.Y(at * P.x0 + b), P.X(P.x1), P.Y(at * P.x1 + b),
                  rgbCss(TH.accent), 1.8, [5, 4]);
      }
      wsNum(ctx, P.px + 16, P.py + 24, 'measured slope', fmtNum(sl.slope, 6), TH.curl);
      wsNum(ctx, P.px + 16, P.py + 42, 'α(t) it should equal', fmtNum(sl.alphaT, 6), TH.accent);
      wsNum(ctx, P.px + 16, P.py + 60, 'difference', fmtNum(sl.gap, 3), TH.pos);
      wsNum(ctx, P.px + 16, P.py + 78, 'r² of the log–log fit', fmtNum(sl.r2, 7), TH.dim);
      rlText(ctx, P.px + 16, P.py + 104,
        'a fixed exponent means one exchanged trajectory, not one exchanged particle',
        rgbCss(TH.faint), '10.5px ' + FONT_UI);
    } else {
      const P = mkPlot(W * 0.12, 54, W * 0.80, H - 132, 2, 60, -240, 10);
      plotFrame(ctx, P, 's   (at fixed 90° scattering angle)', 'ln |A|',
        'string versus field theory at fixed angle — note the vertical scale');
      plotTicksX(ctx, P, [2, 15, 30, 45, 60], v => fmtNum(v, 3));
      rlYTicks(ctx, P, [-240, -180, -120, -60, 0]);
      plotZeroY(ctx, P);
      const xs = [], ys = [], zs = [];
      for(let i = 0; i <= 240; i++){
        const s = 2 + 58 * i / 240;
        xs.push(s);
        ys.push(wsFixedAngleLog(s, 0, st.ap, st.a0));
        zs.push(-4 * Math.log(s));                     // a field-theory power law, for scale
      }
      rlLine(ctx, P, xs, zs, rgbCss(TH.neg), 2, [5, 4]);
      rlLine(ctx, P, xs, ys, rgbCss(TH.curl), 2.4);
      rlText(ctx, P.X(46), P.Y(-30), 'a power law, |A| ∼ s⁻⁴', rgbCss(TH.neg), '10.5px ' + FONT_UI);
      rlText(ctx, P.X(30), P.Y(-150), 'the string: faster than any power', rgbCss(TH.curl), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 14, P.py + 20,
        'an extended object cannot be probed below its own size, so hard scattering simply stops',
        rgbCss(TH.faint), '10.5px ' + FONT_UI);
    }
    stageNote(ctx, 'the same function carries the whole tower — sum over one channel and the other is already included', W, H);
  },
  readout(st){
    const at = wsAlphaOf(st.t, st.ap, st.a0);
    const asAtPole = st.n;
    const sTest = (asAtPole + 0.5 - st.a0) / st.ap;
    const B = wsBetaSigned(-wsAlphaOf(sTest, st.ap, st.a0), -at);
    const sl = wsReggeSlopeMeasured(st.t, st.ap, st.a0, 60, 400);
    const res = wsVenezianoResidue(st.n, at);
    return `<div class="card tight"><div class="ttl">At the marked level</div>
      ${kv('α(t)', fmtNum(at, 5))}
      ${kv('level n', String(st.n))}
      ${kv('mass there, α′M² = n − α₀', fmtNum(st.n - st.a0, 4))}
      ${kv('residue', fmtNum(res, 6))}
      ${kv('degree of the residue polynomial', String(st.n))}
      ${kv('highest spin exchanged', String(st.n))}
      ${kv('residue sign', res > 0 ? 'positive — no ghost at this level'
                                   : res < 0 ? 'NEGATIVE — a negative-norm state, which the theory must forbid'
                                             : 'zero — this exchange decouples exactly here')}
      <p class="help">The residue vanishes at α(t) = −1, −2, … , and those zeros are where particular spins
      drop out of the exchange. Requiring the residue to stay positive at every level, for every value of
      α(t) that is physically reachable, is one of the three independent routes to D = 26 — and it is a
      constraint on a formula that was written down before anyone knew it described a string.</p>
    </div>
    <div class="card tight"><div class="ttl">The amplitude just off that pole</div>
      ${kv('α(s) sampled at', fmtNum(wsAlphaOf(sTest, st.ap, st.a0), 4))}
      ${kv('A(s,t)', B.pole ? 'a pole sits exactly here — the amplitude is unbounded, which is what a particle means'
                            : fmtNum(B.value, 6))}
      ${kv('Regge exponent, measured', fmtNum(sl.slope, 6))}
      ${kv('  α(t), which it must equal', fmtNum(sl.alphaT, 6))}
      ${kv('  difference', fmtNum(sl.gap, 3))}
      ${kv('  r² of the log–log fit', fmtNum(sl.r2, 7))}
      ${kv('fixed-angle ln|A| at s = 40', fmtNum(wsFixedAngleLog(40, 0, st.ap, st.a0), 5))}
      ${kv('  a power law s⁻⁴ would give', fmtNum(-4 * Math.log(40), 5))}
    </div>
    <div class="card tight"><div class="ttl">Why this amplitude, and no other</div>
      ${kv('crossing symmetry', 's, t and u treated alike')}
      ${kv('dual resonance', 'the amplitude vanishes faster than any power at high energy')}
      ${kv('level truncation', 'at a sequence of α(t) values it collapses to a rational function')}
      ${kv('conclusion', 'those three fix the amplitude uniquely')}
      <p class="help">This is a live result rather than history. Bootstrap work published in 2024
      (<i>Phys. Rev. Lett.</i> <b>133</b>, 251601) showed that crossing symmetry, faster-than-power-law
      falloff and level truncation admit exactly one solution, and that the string spectrum falls out of it
      as a consequence. Relax the assumptions to bare high-energy vanishing and a three-parameter family
      opens up, containing the Veneziano, Coon and hypergeometric amplitudes — so the edge of the result is
      now charted too. The permutation-invariant version of the argument produces the closed-string
      Virasoro–Shapiro amplitude the same way.</p>
    </div>`;
  },
  chip(st){
    const at = wsAlphaOf(st.t, st.ap, st.a0);
    return `<div class="k">Veneziano</div>
      <div style="color:var(--c-curl)">α(t) = ${fmtNum(at, 4)}</div>
      <div style="color:var(--accent)">pole n = ${st.n}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the amplitude, and the sampled Regge points'],
                    ['var(--accent)', 'the poles — one for every rung of the tower'],
                    ['var(--c-grad)', 'the residue polynomial in α(t)'],
                    ['var(--c-pos)',  'the level you have selected'],
                    ['var(--c-neg)',  'the zeros of the residue, and a field-theory power law']]; }
};
