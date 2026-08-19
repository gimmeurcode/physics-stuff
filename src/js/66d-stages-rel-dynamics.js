/* ============================================================================
   GROUP 3 · MOMENTUM, ENERGY AND MASS
   ============================================================================ */

const RL_PARTICLES = {
  electron: { m: M_E,    name: 'electron' },
  muon:     { m: M_MUON, name: 'muon' },
  proton:   { m: M_P,    name: 'proton' }
};

/* ---- 11 · energy, momentum and the mass shell -------------------------------
   E = mc² is the least interesting thing on this page. The real content is
   E² − (pc)² = (mc²)², which says four-momentum has a fixed length — and mass
   is that length, not a quantity of stuff. */
STAGES.rlDyn = {
  title: 'Energy & momentum',
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 1 / Math.sqrt(1 - st.beta * st.beta);
    return {
      title:'Why E = mc² is the special case, not the whole equation',
      steps:[
        drvSay('momentum has to be redefined, or conservation fails',
          'Analyse a collision with p = mv in two frames related by a boost and momentum is conserved in one and not the other. That is unacceptable. The fix is to use proper time — the particle\'s own clock — rather than coordinate time.'),
        drvStep('define momentum with proper time',
          `${dv('p')} ${dop('=')} ${dv('m')}${dfrac('d' + dv('x'), 'dτ')} ${dop('=')} γ${dv('m')}${dv('v')}`,
          `β = ${n(st.beta)} gives γ = ${n(g)}`),
        drvSay('and the reason that works is that τ is invariant',
          'Every observer agrees on the reading of the particle\'s own clock. Differentiating position with respect to that, rather than with respect to each observer\'s own time, produces a quantity that transforms cleanly — and conservation survives the boost.'),
        drvStep('the same construction gives energy as the time component',
          `${dv('E')} ${dop('=')} γ${dv('m')}${dv('c')}²`,
          `= ${n(g)} × mc² here — the panel prints it for a ${st.p}`),
        drvStep('expand for slow speeds and see what is inside',
          `${dv('E')} ${dop('≈')} ${dv('m')}${dv('c')}² ${dop('+')} ${dfrac('1', '2')}${dv('m')}${dv('v')}² ${dop('+')} …`,
          'the familiar kinetic energy appears as the first correction'),
        drvSay('so the rest term was always there and had simply never been noticed',
          'Classical mechanics only ever measures energy differences, so a constant term is invisible. Relativity says that constant is enormous: a gram of anything carries 9 × 10¹³ joules. Nothing releases it in ordinary circumstances, which is why it went unseen.'),
        drvStep('and energy and momentum combine into one invariant',
          `${dv('E')}² ${dop('=')} (${dv('p')}${dv('c')})² ${dop('+')} (${dv('m')}${dv('c')}²)²`,
          'the panel computes it in two frames and prints the difference — it is zero'),
        drvSay('this is the interval again, for energy–momentum instead of space–time',
          'The mass is the invariant length of the energy–momentum four-vector, exactly as proper time is the invariant length of a displacement. That is what mass *is* in relativity — not a measure of stuff, but the length of a four-vector.'),
        drvStep('which is why massless particles are possible',
          `${dv('m')} ${dop('=')} 0 ${dop('⇒')} ${dv('E')} ${dop('=')} ${dv('pc')}`,
          'a photon has energy and momentum with no mass, and must travel at exactly c'),
        drvSay('and this is measured daily rather than believed',
          `Muons created 15 km up have a 2.2 µs half-life and should decay within 660 m. They reach the ground because γ ≈ ${n(g)} stretches their lifetime in our frame — or, in their frame, contracts the atmosphere. The panel computes the survival fraction both ways and they agree.`)
      ],
      note:'The invariant E² − (pc)² is computed independently in the lab and rest frames and printed with its difference, which is zero to machine precision. Several of these quantities are catastrophic cancellations at low β and are computed in closed form, as the unit tests require.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.8 : o.beta;
    st.p = o.p || 'proton';
    st.L = o.L === undefined ? 15000 : o.L;      // muon flight path, metres
    st.dymode = o.dymode === 'collide' ? 'collide' : 'shell';
    st.xkey = o.xkey || 'clay';
    st._col = null;
  },
  controls(){
    const st = ST;
    const head = ctlRow('what to show',
      ctSeg('rlDyM', st.dymode, [['shell', 'one particle on its mass shell'], ['collide', 'a collision you write']]));
    if(st.dymode === 'collide') return head + rlDynControls(st);
    return head +
      rlSeg('rlDyP', st.p, [['electron','electron'],['muon','muon'],['proton','proton']]) +
      ctlRow('speed β', ctlSlider('rlDyB', 0.001, 0.99999, 0.0005, st.beta)) +
      ctlRow('flight path', ctlSlider('rlDyL', 500, 30000, 100, st.L)) +
      `<p class="help">The top plot is what it costs to go fast: <b>γ</b> is a wall, not a slope. The
      middle one is the <b>mass shell</b> — the hyperbola <b>E² − (pc)² = (mc²)²</b> that every free
      particle of that mass is confined to, whatever frame you use. A boost slides a particle along its
      own hyperbola and never off it, which is exactly the statement that mass is invariant while energy
      and momentum are not. The right-hand plot is the experiment: cosmic-ray muons crossing the
      atmosphere, with and without time dilation.</p>`;
  },
  wire(){
    ctWireSeg('rlDyM', v => { ST.dymode = v; ST._col = null; });
    if(ST.dymode === 'collide'){ rlDynWire(); return; }
    rlWireSeg('rlDyP', v => { ST.p = v; });
    wireSlider('rlDyB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
    wireSlider('rlDyL', () => ST.L, v => { ST.L = v; }, v => fmtNum(+v / 1000, 3) + ' km');
  },
  frame(st, dt, ctx, W, H){
    if(st.dymode === 'collide') return rlDynFrame(st, ctx, W, H);
    const g = relGamma(st.beta);
    const colW = W * 0.46, rightX = W * 0.53;
    /* --- energy and momentum against speed --- */
    const A = mkPlot(52, 40, colW - 60, (H - 130) * 0.5, 0, 1, 0, 8);
    plotFrame(ctx, A, '', 'in units of mc² (or mc)', 'The cost of speed');
    plotTicksX(ctx, A, [0, 0.25, 0.5, 0.75, 1], v => fmtNum(v, 2));
    rlYTicks(ctx, A, [0, 2, 4, 6, 8]);
    const N = 400, bs = new Float64Array(N), Es = new Float64Array(N),
          ps = new Float64Array(N), Ks = new Float64Array(N), Kc = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const b = Math.min(0.99995, i / (N - 1));
      bs[i] = b; Es[i] = relEnergy(1, b); ps[i] = relMomentum(1, b);
      Ks[i] = relKinetic(1, b); Kc[i] = relKineticClassical(1, b);
    }
    rlLine(ctx, A, bs, Kc, rgbCss(TH.faint, 0.9), 1.6, [4, 4]);
    rlLine(ctx, A, bs, ps, rgbCss(TH.neg), 2);
    rlLine(ctx, A, bs, Ks, rgbCss(TH.curl), 2);
    rlLine(ctx, A, bs, Es, rgbCss(TH.grad), 2.4);
    rlSegment(ctx, A.px, A.Y(1), A.px + A.pw, A.Y(1), rgbCss(TH.line2), 1, [3, 3]);
    rlText(ctx, A.px + 5, A.Y(1) - 9, 'mc² — the rest energy', rgbCss(TH.faint), '10px ' + FONT_MONO);
    rlSegment(ctx, A.X(st.beta), A.py, A.X(st.beta), A.py + A.ph, rgbCss(TH.pos, 0.6), 1.2, [4, 4]);
    rlDot(ctx, A.X(st.beta), A.Y(Math.min(8, g)), 5, rgbCss(TH.pos));

    /* --- the mass shell --- */
    const B = mkPlot(52, 40 + (H - 130) * 0.5 + 48, colW - 60, (H - 130) * 0.5 - 20, -5, 5, 0, 6);
    plotFrame(ctx, B, 'momentum  pc / mc²', 'energy  E / mc²',
      'The mass shell: E² − (pc)² = (mc²)², and a boost cannot leave it');
    plotTicksX(ctx, B, [-4, -2, 0, 2, 4], v => String(v));
    rlYTicks(ctx, B, [0, 2, 4, 6]);
    const NP = 300, pp = new Float64Array(NP), ee = new Float64Array(NP), nn = new Float64Array(NP);
    for(let i = 0; i < NP; i++){
      const P0 = -5 + 10 * i / (NP - 1);
      pp[i] = P0; ee[i] = relEnergyFromP(1, P0); nn[i] = 1 + 0.5 * P0 * P0;
    }
    rlLine(ctx, B, pp, nn, rgbCss(TH.faint, 0.9), 1.6, [4, 4]);
    rlSegment(ctx, B.X(0), B.Y(0), B.X(5), B.Y(5), rgbCss(TH.warn, 0.8), 1.5);
    rlSegment(ctx, B.X(0), B.Y(0), B.X(-5), B.Y(5), rgbCss(TH.warn, 0.8), 1.5);
    rlText(ctx, B.X(3.6), B.Y(4.3), 'massless: E = pc', rgbCss(TH.warn), '10px ' + FONT_MONO);
    rlLine(ctx, B, pp, ee, rgbCss(TH.grad), 2.4);
    /* the same particle seen from several frames — all on one hyperbola */
    for(const bb of [-0.9, -0.6, 0, 0.6, 0.9]){
      const w = relVelAdd(st.beta, bb);
      rlDot(ctx, B.X(relMomentum(1, w)), B.Y(relEnergy(1, w)), 3.4, rgbCss(TH.neg, 0.8));
    }
    rlDot(ctx, B.X(relMomentum(1, st.beta)), B.Y(Math.min(6, relEnergy(1, st.beta))), 5.5, rgbCss(TH.pos));

    /* --- the muon experiment --- */
    const C0 = mkPlot(rightX + 46, 40, W - rightX - 76, H - 130, 0, st.L / 1000, -11, 0.4);
    plotFrame(ctx, C0, 'distance flown  (km)', 'log₁₀ (fraction surviving)',
      'Cosmic-ray muons: dilation, or nine orders of magnitude of missing muons');
    plotTicksX(ctx, C0, [0, st.L / 4000, st.L / 2000, 3 * st.L / 4000, st.L / 1000], v => fmtNum(v, 3));
    rlYTicks(ctx, C0, [0, -2, -4, -6, -8, -10], v => String(v));
    const NS = 260, ds = new Float64Array(NS), sd = new Float64Array(NS), sc = new Float64Array(NS);
    const bm = Math.min(0.999999, Math.max(0.001, st.beta));
    for(let i = 0; i < NS; i++){
      const L = st.L * (i + 0.5) / NS, s = relMuonSurvival(bm, L);
      ds[i] = L / 1000;
      sd[i] = Math.log10(Math.max(1e-30, s.dilated));
      sc[i] = Math.log10(Math.max(1e-30, s.classical));
    }
    rlLine(ctx, C0, ds, sc, rgbCss(TH.faint, 0.95), 1.8, [4, 4]);
    rlLine(ctx, C0, ds, sd, rgbCss(TH.grad), 2.4);
    const end = relMuonSurvival(bm, st.L);
    rlDot(ctx, C0.X(st.L / 1000), C0.Y(Math.max(-11, Math.log10(Math.max(1e-30, end.dilated)))), 5, rgbCss(TH.pos));
    rlText(ctx, C0.px + C0.pw - 8, C0.py + 16,
      'observed: ' + fmtNum(end.dilated * 100, 3) + '%', rgbCss(TH.grad), '11px ' + FONT_MONO, 'right');
    rlText(ctx, C0.px + C0.pw - 8, C0.py + 32,
      'Newton: ' + fmtNum(end.classical * 100, 3) + '%', rgbCss(TH.faint), '11px ' + FONT_MONO, 'right');
    stageNote(ctx, 'mass is the length of the four-momentum vector — not a quantity that grows with speed', W, H);
  },
  readout(st){
    if(st.dymode === 'collide') return rlDynReadout(st);
    const P0 = RL_PARTICLES[st.p], m = P0.m, g = relGamma(st.beta);
    const E = relEnergy(m, st.beta), p = relMomentum(m, st.beta), K = relKinetic(m, st.beta);
    const MEV_J = 1.602176634e-13;
    const s = relMuonSurvival(Math.min(0.999999, Math.max(0.001, st.beta)), st.L);
    const unit = v => Math.abs(v) >= 1e6 ? fmtNum(v / 1e6, 5) + ' TeV'
                    : Math.abs(v) >= 1e3 ? fmtNum(v / 1e3, 5) + ' GeV' : fmtNum(v, 5) + ' MeV';
    return `<div class="card tight"><div class="ttl">A ${P0.name} at β = ${fmtNum(st.beta, 5)}</div>
      ${kv('rest energy mc²', unit(m))}
      ${kv('γ', fmtNum(g, 7))}
      ${kv('total energy E = γmc²', unit(E))}
      ${kv('momentum pc = γmβc²', unit(p))}
      ${kv('kinetic energy (γ−1)mc²', unit(K))}
      ${kv('what ½mv² would have said', unit(relKineticClassical(m, st.beta)))}
      ${kv('the classical answer is short by', '×' + fmtNum(K / Math.max(1e-30, relKineticClassical(m, st.beta)), 5))}
      ${kv('E in joules', fmtNum(E * MEV_J, 4) + ' J')}
      ${kv('E² − (pc)²', fmtNum(E * E - p * p, 6) + ' MeV²')}
      ${kv('(mc²)²', fmtNum(m * m, 6) + ' MeV²')}
      ${kv('residual', fmtAgree(E * E - p * p, m * m, 'MeV²'))}
      <p class="help">That residual is the invariance of mass, checked numerically. Push β past 0.99 and
      watch E run away while the residual does not move: all the added energy is going into momentum
      along the hyperbola, and none of it into mass. This is why "relativistic mass" was abandoned —
      inertia is <b>γ³m</b> along the motion and only <b>γm</b> across it, so there is no single number
      that could be "the mass".</p>
    </div>
    <div class="card tight"><div class="ttl">Muons, measured</div>
      ${kv('rest lifetime τ₀', fmtNum(TAU_MUON * 1e6, 5) + ' μs')}
      ${kv('cτ₀ — how far light goes in one', fmtNum(C_SI * TAU_MUON, 4) + ' m')}
      ${kv('flight path', fmtNum(st.L / 1000, 4) + ' km')}
      ${kv('flight time (ground frame)', fmtNum(s.flightTime * 1e6, 4) + ' μs')}
      ${kv('that is, in lifetimes', fmtNum(s.flightTime / TAU_MUON, 4))}
      ${kv('surviving fraction, with dilation', fmtNum(s.dilated, 4))}
      ${kv('surviving fraction, without', fmtNum(s.classical, 4))}
      ${kv('ratio', fmtNum(s.dilated / Math.max(1e-300, s.classical), 4))}
      ${kv('the path, in the muon\'s own frame', fmtNum(s.properDistance, 5) + ' m')}
      <p class="help">The muon's account is different and identical: it does not live any longer than
      2.2 μs, but the atmosphere is <b>length-contracted</b> to
      <b>${fmtNum(s.properDistance, 4)} m</b>, which it crosses easily. Two descriptions, one number.
      Frisch and Smith did exactly this in 1963 with a mountain and a scintillator, and the count at the
      bottom matched the dilated prediction to a few percent.</p>
    </div>
    <div class="card tight"><div class="ttl">Anchors</div>
      ${kv('LHC proton, 6.8 TeV', 'γ = ' + fmtNum(6.8e6 / M_P, 5))}
      ${kv('its β', fmtNum(relBetaOf(6.8e6 / M_P), 11) + ' c')}
      ${kv('fixed target vs collider at 7 TeV', fmtNum(relCMFixedTarget(7e6, M_P) / 1e3, 4) + ' GeV  vs  ' +
            fmtNum(relCMCollider(7e6) / 1e6, 4) + ' TeV')}
      <p class="help">That last row is why colliders exist: firing a 7 TeV beam at a stationary proton
      makes only <b>${fmtNum(relCMFixedTarget(7e6, M_P) / 1e3, 3)} GeV</b> available for making new
      particles, because most of the energy goes into the wreckage's momentum. Collide two of them
      head-on and the whole <b>14 TeV</b> is available, because the total momentum is zero.</p>
    </div>`;
  },
  chip(st){
    if(st.dymode === 'collide') return rlDynChip(st);
    const P0 = RL_PARTICLES[st.p], g = relGamma(st.beta);
    return `<div class="k">${P0.name}</div>
      <div style="color:var(--c-pos)">γ = ${fmtNum(g, 5)}</div>
      <div style="color:var(--c-grad)">E = ${fmtNum(relEnergy(P0.m, st.beta), 5)} MeV</div>`;
  },
  legend(st){
    if(st && st.dymode === 'collide')
      return [['var(--c-grad)', 'each incoming particle, laid tip to tail'],
              ['var(--c-pos)', 'each outgoing one'],
              ['var(--c-curl)', 'the total four-momentum'],
              ['var(--accent)', 'the mass shell the total sits on']];
    return [['var(--c-grad)', 'total energy E / mc², and the mass shell'],
                    ['var(--c-neg)', 'momentum pc / mc², and the same particle in other frames'],
                    ['var(--c-curl)', 'kinetic energy (γ−1)mc²'],
                    ['var(--faint)', 'the classical ½mv² and E = mc² + p²/2m'],
                    ['var(--c-warn)', 'the massless line E = pc']]; }
};

/* ---- 12 · Doppler, aberration and beaming ----------------------------------
   Move fast enough and the sky rearranges itself: light from ahead blueshifts
   and light from every direction crowds into a cone in front of you. */
STAGES.rlDopp = {
  title: 'Doppler & aberration',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'What the sky looks like at speed',
      steps:[
        drvStep('the relativistic Doppler shift',
          `${dv('f')}′ ${dop('=')} ${dv('f')}${dfrac('√(1 − β²)', '1 − β cos θ')}`,
          `β = ${n(st.beta)} — the panel colours each star by its computed shift`),
        drvSay('two effects are combined here, and they are worth separating',
          'The classical Doppler shift comes from the source chasing or fleeing its own wavefronts. Time dilation is on top of that, and it is purely relativistic. The numerator carries the dilation and the denominator the classical part.'),
        drvStep('look sideways and only the dilation survives',
          `${dv('f')}′ ${dop('=')} ${dv('f')}√(1 ${dop('−')} β²)`,
          'the transverse Doppler shift — a redshift with no radial motion at all'),
        drvSay('and that has no classical counterpart whatever',
          'Classically, a source moving directly across your line of sight shows no shift. Relativistically it is redshifted, purely because its clock runs slow. This was measured by Ives and Stilwell in 1938 and is direct evidence for time dilation.'),
        drvStep('directions transform too',
          `cos θ′ ${dop('=')} ${dfrac('cos θ − β', '1 − β cos θ')}`,
          'the panel maps every star to its apparent position at this speed'),
        drvSay('and the sky bunches forward, which is not what most people expect',
          'Aberration sweeps apparent positions towards the direction of travel. Approach c and almost the entire sky — including things behind you — crowds into a small bright disc ahead. The view backwards goes dark and empty.'),
        drvStep('and the forward disc is blueshifted as well as crowded',
          `bright and blue ahead, dim and red behind`,
          'the panel applies both effects together, so the headlight beaming is visible'),
        drvSay('which is why relativistic jets look one-sided',
          'Astrophysical jets emerge in opposite pairs, but the one pointing towards us is beamed and boosted while its twin is dimmed away. Many apparently one-sided jets are symmetric objects seen through this effect — the aberration formula is a working tool in astronomy, not a curiosity.')
      ],
      note:'The star field is generated once from a fixed seed and then transformed, so the same stars can be tracked as β changes rather than reshuffling. Both the direction and the colour of every star are computed from the formulas above.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.beta = o.beta === undefined ? 0.7 : o.beta;
    st.stars = [];
    /* an isotropic sky, generated once so it does not shimmer while β changes */
    let seed = 20250803;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for(let i = 0; i < 520; i++){
      const u = 2 * rnd() - 1, ph = 2 * Math.PI * rnd();
      st.stars.push({ ct: u, ph, r: 0.7 + 1.6 * rnd() });
    }
    st.smode = o.smode === 'shift' ? 'shift' : 'sky';
    st.skey = o.skey || 'fast';
    /* a preset seeds beta; the slider owns it from then on */
    if(o.beta === undefined && RL_SOURCES[st.skey]) st.beta = RL_SOURCES[st.skey].beta;
  },
  controls(){
    const st = ST;
    const head = ctlRow('what to show',
      ctSeg('rlDoM', st.smode, [['sky', 'the sky, rearranged'], ['shift', 'the shift at every angle']]));
    if(st.smode === 'shift') return head + rlSrcControls(st);
    return head +
      ctlRow('your speed β', ctlSlider('rlDoB', 0, 0.995, 0.005, st.beta)) +
      `<p class="help">The left panel is the whole sky, mapped so that the centre is straight ahead and
      the outer circle is straight behind. At rest the stars are spread evenly. Accelerate and they
      <b>pile up ahead of you</b> — not because they moved, but because
      <b>cos θ = (cos θ′ + β)/(1 + β cos θ′)</b> maps their directions forward. Their colours are the
      Doppler factor <b>δ = 1/(γ(1 − β cos θ))</b>, blue ahead and red behind. The right panel is the
      same effect seen from outside: an isotropic emitter's light beamed into a cone of half-angle about
      <b>1/γ</b>, which is why relativistic jets look one-sided and why synchrotron beamlines are
      thin, bright and useful.</p>`;
  },
  wire(){
    ctWireSeg('rlDoM', v => { ST.smode = v; });
    if(ST.smode === 'shift'){ rlSrcWire(); return; }
    wireSlider('rlDoB', () => ST.beta, v => { ST.beta = v; }, rlBetaFmt, RL_BETA_LIM);
  },
  frame(st, dt, ctx, W, H){
    if(st.smode === 'shift') return rlSrcFrame(st, ctx, W, H);
    const b = st.beta, g = relGamma(b);
    /* --- the sky --- */
    const R = Math.min(W * 0.21, (H - 120) * 0.46);
    const cx = W * 0.26, cy = H * 0.5;
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.stroke();
    for(const f of [0.25, 0.5, 0.75]){
      ctx.strokeStyle = rgbCss(TH.line, 0.8);
      ctx.beginPath(); ctx.arc(cx, cy, R * f, 0, 6.2832); ctx.stroke();
    }
    for(const s of st.stars){
      /* aberration maps the rest-frame direction to the observed one */
      const ct = relAberration(s.ct, b);
      const th = Math.acos(Math.max(-1, Math.min(1, ct)));
      const rr = R * th / Math.PI;
      const X = cx + rr * Math.cos(s.ph), Y = cy + rr * Math.sin(s.ph);
      /* colour by the Doppler factor: blue ahead, red behind */
      const d = relDoppler(b, th);
      const t = Math.max(0, Math.min(1, 0.5 + 0.42 * Math.log(d)));
      const col = t > 0.5 ? mixRGB(TH.text, TH.neg, (t - 0.5) * 2) : mixRGB(TH.pos, TH.text, t * 2);
      rlDot(ctx, X, Y, s.r * (0.7 + 0.7 * Math.min(1.6, d)), rgbCss(col, 0.95));
    }
    /* the beaming cone, marked on the sky */
    const thB = relBeamingAngle(b);
    ctx.strokeStyle = rgbCss(TH.warn, 0.9); ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(cx, cy, R * thB / Math.PI, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    {
      /* the chip floats over the top-left; slide the heading clear of it the
         way plotFrame titles do — it printed through the chip at 1280 wide
         (2026-08-19 sweep) */
      const tt = 'The sky ahead of you  ·  centre = dead ahead, rim = dead astern';
      ctx.font = '600 11.5px ' + FONT_UI;
      rlText(ctx, ctTitleClearChip(ctx, cx, cy - R - 18, tt), cy - R - 18, tt,
             rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    }
    rlText(ctx, cx, cy + R + 18,
      'half of all the sky\'s light now arrives inside the dashed circle',
      rgbCss(TH.warn), '10.5px ' + FONT_UI, 'center');

    /* --- the beaming polar diagram --- */
    const px = W * 0.66, py = H * 0.5, PR = Math.min(W * 0.15, (H - 140) * 0.4);
    rlText(ctx, px, py - PR - 40, 'The headlight effect: emitted power per unit solid angle',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    rlSegment(ctx, px - PR * 1.5, py, px + PR * 2.1, py, rgbCss(TH.line2), 1);
    rlSegment(ctx, px, py - PR * 1.25, px, py + PR * 1.25, rgbCss(TH.line2), 1);
    rlArrow(ctx, px, py, px + PR * 1.9, py, rgbCss(TH.faint, 0.6), 1.4, 8);
    rlText(ctx, px + PR * 1.95, py - 12, 'direction of motion', rgbCss(TH.faint), '10px ' + FONT_UI);
    /* isotropic, for comparison */
    ctx.strokeStyle = rgbCss(TH.faint, 0.7); ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(px, py, PR * 0.42, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
    /* the beamed pattern: delta^4, normalised so it fits */
    let peak = 0;
    for(let i = 0; i <= 360; i++){
      const th = i / 360 * 2 * Math.PI;
      peak = Math.max(peak, Math.pow(relDoppler(b, th), 4));
    }
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2.2;
    ctx.fillStyle = rgbCss(TH.warn, 0.14);
    ctx.beginPath();
    for(let i = 0; i <= 360; i++){
      const th = i / 360 * 2 * Math.PI;
      const rr = PR * Math.pow(Math.pow(relDoppler(b, th), 4) / peak, 0.34);
      const X = px + rr * Math.cos(th), Y = py + rr * Math.sin(th);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    /* the 1/γ cone */
    for(const s of [1, -1]){
      rlSegment(ctx, px, py, px + PR * 1.6 * Math.cos(s * thB), py + PR * 1.6 * Math.sin(s * thB),
                rgbCss(TH.pos, 0.85), 1.5, [5, 4]);
    }
    rlText(ctx, px + PR * 1.1, py - PR * 0.85,
      'half-angle ≈ 1/γ = ' + fmtNum(1 / g, 4) + ' rad', rgbCss(TH.pos), '10.5px ' + FONT_MONO);
    rlText(ctx, px, py + PR * 1.42, 'dashed circle: what it emits in its own frame',
           rgbCss(TH.faint), '10px ' + FONT_UI, 'center');
    stageNote(ctx, 'nothing about the source changed — only the frame the light is being catalogued in', W, H);
  },
  readout(st){
    if(st.smode === 'shift') return rlSrcReadout(st);
    const b = st.beta, g = relGamma(b);
    const thB = relBeamingAngle(b);
    /* our own motion through the CMB — the largest Doppler shift anyone has measured */
    const vCmb = 369820, T0 = 2.72548;
    return `<div class="card tight"><div class="ttl">The shift, direction by direction</div>
      ${kv('β', fmtNum(b, 4) + ' c')}
      ${kv('γ', fmtNum(g, 6))}
      ${kv('dead ahead  (θ = 0)', '×' + fmtNum(relDoppler(b, 0), 6) + '  — blue')}
      ${kv('at 45°', '×' + fmtNum(relDoppler(b, Math.PI / 4), 6))}
      ${kv('transverse  (θ = 90°)', '×' + fmtNum(relDoppler(b, Math.PI / 2), 6))}
      ${kv('dead astern (θ = 180°)', '×' + fmtNum(relDoppler(b, Math.PI), 6) + '  — red')}
      ${kv('the k-factor √((1+β)/(1−β))', fmtNum(relKFactor(b), 6))}
      <p class="help">The transverse row is the one with no classical counterpart: a source passing you
      at its closest approach, with no line-of-sight motion at all, is <i>still</i> redshifted, by exactly
      <b>1/γ</b>. That is time dilation observed directly. Ives and Stilwell measured it in 1938 on a
      beam of hydrogen ions and it has been the standard confirmation ever since.</p>
    </div>
    <div class="card tight"><div class="ttl">Beaming</div>
      ${kv('beaming half-angle, where θ′ = 90° lands', fmtNum(thB, 5) + ' rad')}
      ${kv('in degrees', fmtNum(thB * 180 / Math.PI, 4) + '°')}
      ${kv('compare 1/γ', fmtNum(1 / g, 5) + ' rad')}
      ${kv('fraction of the sky it covers', fmtNum(relBeamFraction(b) * 100, 4) + '%')}
      ${kv('forward intensity boost, δ⁴', '×' + fmtNum(Math.pow(relDoppler(b, 0), 4), 5))}
      ${kv('backward, δ⁴', '×' + fmtNum(Math.pow(relDoppler(b, Math.PI), 4), 4))}
      ${kv('front-to-back ratio', fmtNum(Math.pow(relDoppler(b, 0) / relDoppler(b, Math.PI), 4), 4))}
      <p class="help">Half of everything the source emits arrives inside a cone containing
      <b>${fmtNum(relBeamFraction(b) * 100, 3)}%</b> of the sky, and it arrives brightened by <b>δ⁴</b>.
      Two identical jets pointed towards and away from us therefore differ in apparent brightness by that
      last ratio — which is why radio galaxies so often appear to have only one.</p>
    </div>
    <div class="card tight"><div class="ttl">Our own motion, measured this way</div>
      ${kv('Sun\'s speed through the CMB rest frame', fmtNum(vCmb / 1000, 5) + ' km/s')}
      ${kv('as β', fmtNum(vCmb / C_SI, 5))}
      ${kv('predicted dipole ΔT = βT₀', fmtNum(vCmb / C_SI * T0 * 1000, 5) + ' mK')}
      ${kv('measured by COBE/WMAP/Planck', '3.36 mK')}
      <p class="help">The microwave background is very nearly isotropic — except for a dipole, one part
      in a thousand hotter in one direction than the other. It is not a feature of the early universe;
      it is this stage's aberration and Doppler shift, applied to us. Subtracting it is the first step of
      every CMB analysis, and it is how we know which way, and how fast, the Local Group is going.</p>
    </div>`;
  },
  chip(st){
    if(st.smode === 'shift') return rlSrcChip(st);
    const g = relGamma(st.beta);
    return `<div class="k">Aberration</div>
      <div style="color:var(--c-neg)">ahead ×${fmtNum(relDoppler(st.beta, 0), 4)}</div>
      <div style="color:var(--c-pos)">astern ×${fmtNum(relDoppler(st.beta, Math.PI), 4)}</div>
      <div style="color:var(--c-warn)">cone ≈ ${fmtNum(1 / g, 4)} rad</div>`;
  },
  legend(st){
    if(st && st.smode === 'shift')
      return [['var(--c-grad)', 'δ against the angle in your frame'],
              ['var(--c-curl)', 'the transverse point, δ = 1/γ'],
              ['var(--c-warn)', 'where the shift vanishes — and δ⁴, below'],
              ['var(--c-pos)', 'your chosen angle']];
    return [['var(--c-neg)', 'blueshifted — ahead of you'],
                    ['var(--c-pos)', 'redshifted — behind you'],
                    ['var(--c-warn)', 'the beaming cone, and the emitted power pattern'],
                    ['var(--faint)', 'what the source emits in its own frame — isotropic']]; }
};

