/* ============================================================================
   4f · THE RELATIVITY WING — CURVED SPACETIME
   Special relativity says the laws are the same in every inertial frame.
   General relativity notices that in a gravitational field there are no global
   inertial frames at all, only local ones — a falling lift, for a little while
   — and rebuilds physics around that. Gravity stops being a force and becomes
   the shape of the arena; free fall stops being accelerated motion and becomes
   the straightest available line.

   Everything here is computed in SI from real constants, because the reason
   anyone believed any of it was a set of specific numbers: 43″ per century,
   1.75″ at the solar limb, 38 μs per day, 10⁻²¹ of strain.
   ============================================================================ */

/* the bodies the metric stages let you stand near */
const GR_BODIES = {
  earth:  { nm:'the Earth',            GM: GM_EARTH,             R: R_EARTH,  unit:'km', u:1e3 },
  sun:    { nm:'the Sun',              GM: GM_SUN,               R: R_SUN,    unit:'km', u:1e3 },
  dwarf:  { nm:'a white dwarf',        GM: GM_SUN * 1.018,       R: 5.80e6,   unit:'km', u:1e3 },
  neutron:{ nm:'a neutron star',       GM: GM_SUN * 1.4,         R: 1.2e4,    unit:'km', u:1e3 },
  hole:   { nm:'a 10 M☉ black hole',   GM: GM_SUN * 10,          R: 0,        unit:'km', u:1e3 },
  sgra:   { nm:'Sgr A*',               GM: GM_SUN * 4.297e6,     R: 0,        unit:'Gm', u:1e9 }
};

/* ---- 16 · the Schwarzschild metric -----------------------------------------
   One line of algebra, found by Schwarzschild in a trench on the Russian front
   within weeks of Einstein publishing the field equations, and containing every
   classical test plus the black hole nobody wanted. */
STAGES.rlMetric = {
  title: 'The metric',
  derive(st){
    return {
      title:'Gravity as the shape of spacetime, written in one line',
      steps:[
        drvSay('what a metric is for',
          'A metric is a rule for measuring intervals between nearby events. Flat spacetime has the Minkowski one. Curved spacetime has a different rule at each point, and general relativity says gravity *is* that difference — there is no force in the theory at all.'),
        drvStep('the Schwarzschild metric outside a spherical mass',
          `d${dv('s')}² ${dop('=')} ${dop('−')}(1 ${dop('−')} ${dfrac(dv('r') + 's', dv('r'))})${dv('c')}²d${dv('t')}² ${dop('+')} ${dfrac('d' + dv('r') + '²', '1 − ' + dv('r') + 's/' + dv('r'))} ${dop('+')} ${dv('r')}²dΩ²`,
          `for the ${st.body}, the panel prints the Schwarzschild radius and the factors at the probe`),
        drvStep('the Schwarzschild radius',
          `${dv('r')}ₛ ${dop('=')} ${dfrac('2' + dv('GM'), dv('c') + '²')}`,
          'about 3 km for the Sun and 9 mm for the Earth — far inside both, so the interior metric differs'),
        drvSay('read the time coefficient first',
          'The factor multiplying dt² shrinks as r falls. A clock at fixed r ticks at √(1 − rs/r) times the rate of one far away. Gravitational time dilation is not an add-on — it is the first term of the metric.'),
        drvStep('so clocks run slow near mass',
          `${dfrac('dτ', 'd' + dv('t'))} ${dop('=')} √(1 ${dop('−')} ${dv('r')}ₛ/${dv('r')})`,
          `at the probe radius the panel prints the ratio — and for GPS satellites it is 45 µs per day`),
        drvStep('and the radial coefficient stretches distances',
          `d${dv('ℓ')} ${dop('=')} ${dfrac('d' + dv('r'), '√(1 − ' + dv('r') + 'ₛ/' + dv('r') + ')')}`,
          'so the measured distance between two shells exceeds the difference of their circumferential radii'),
        drvSay('which is why r is not "the distance to the centre"',
          'r is defined so that the circumference is 2πr. In curved space that is not the same as the radial distance you would measure with rulers, which is larger. Getting this wrong is the commonest error in reading the metric.'),
        drvStep('and free fall follows the straightest available path',
          `${dfrac('d²' + dv('x') + '^μ', 'dτ²')} ${dop('+')} Γ^μ_αβ${dfrac('d' + dv('x') + '^α', 'dτ')}${dfrac('d' + dv('x') + '^β', 'dτ')} ${dop('=')} 0`,
          'the geodesic equation — no force term anywhere in it'),
        drvSay('and the Newtonian limit is recoverable, as it must be',
          'Expand the time coefficient for weak fields and the geodesic equation reduces to Newton\'s law with the potential −GM/r. Einstein\'s theory contains Newton\'s as the leading term, which is why centuries of successful predictions were not overturned.')
      ],
      note:'Every factor is evaluated at the probe radius for a real body, so the numbers are the actual dilations and stretches rather than illustrative ones. At the Earth\'s surface the time factor differs from 1 by about 7 × 10⁻¹⁰.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.body = o.body || 'sun';
    st.rr = o.rr === undefined ? 3 : o.rr;     // probe radius, in units of rs (log-ish)
  },
  controls(){
    const st = ST;
    return rlSeg('rlMeB', st.body, Object.keys(GR_BODIES).map(k => [k, GR_BODIES[k].nm])) +
      ctlRow('probe r / rs', ctlSlider('rlMeR', 1.001, 60, 0.001, st.rr)) +
      `<p class="help">The whole of the Schwarzschild solution is
      <b>ds² = −(1−rs/r)c²dt² + dr²/(1−rs/r) + r²dΩ²</b>, with <b>rs = 2GM/c²</b>. Two factors do all the
      work and they are reciprocals: <b>time</b> runs slow by <b>√(1−rs/r)</b>, and <b>radial distance</b>
      is stretched by the same factor. The surface on the left is <b>Flamm's paraboloid</b> — a genuine
      embedding of the equatorial plane, so that distances measured across the drawn surface are the real
      ones. It is the honest version of the rubber-sheet picture, and note what it does <i>not</i>
      contain: any time. Almost all of everyday gravity is the time part of the metric, not the space
      part, which is why the rubber sheet explains nothing on its own.</p>`;
  },
  wire(){
    rlWireSeg('rlMeB', v => { ST.body = v; });
    wireSlider('rlMeR', () => ST.rr, v => { ST.rr = v; }, v => fmtNum(+v, 4) + ' rs');
  },
  frame(st, dt, ctx, W, H){
    const B = GR_BODIES[st.body], rs = grRs(B.GM);
    const rMax = 30;

    /* --- Flamm's paraboloid, in oblique projection --- */
    const cx = W * 0.25, cy = H * 0.44, sc = Math.min(W * 0.17, H * 0.22) / 5;
    const zs = 0.42;   // vertical scale of the funnel, purely for legibility
    const proj = (r, th) => ({
      x: cx + r * Math.cos(th) * sc,
      y: cy - r * Math.sin(th) * sc * 0.42 + grFlammZ(r * rs, rs) / rs * sc * zs
    });
    rlText(ctx, cx, 34, "Flamm's paraboloid — the equatorial plane, embedded",
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    /* rings of constant r */
    for(let i = 1; i <= 14; i++){
      const r = 1 + (rMax - 1) * Math.pow(i / 14, 1.7);
      ctx.strokeStyle = rgbCss(TH.curl, 0.20 + 0.4 * (1 - i / 14)); ctx.lineWidth = 1.2;
      ctx.beginPath();
      for(let k = 0; k <= 90; k++){
        const p = proj(r, k / 90 * 2 * Math.PI);
        k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.closePath(); ctx.stroke();
    }
    /* radial ribs */
    for(let k = 0; k < 16; k++){
      const th = k / 16 * 2 * Math.PI;
      ctx.strokeStyle = rgbCss(TH.curl, 0.18); ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i = 0; i <= 60; i++){
        const r = 1 + (rMax - 1) * Math.pow(i / 60, 1.7);
        const p = proj(r, th);
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.stroke();
    }
    /* the horizon (or the body's surface, if it has one) */
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2.2;
    ctx.beginPath();
    for(let k = 0; k <= 90; k++){
      const p = proj(1, k / 90 * 2 * Math.PI);
      k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.closePath(); ctx.stroke();
    rlText(ctx, cx, cy + 6, B.R > 0 ? '' : 'horizon', rgbCss(TH.warn), '10px ' + FONT_MONO, 'center');
    if(B.R > rs){
      const rSurf = B.R / rs;
      if(rSurf < rMax){
        ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.2;
        ctx.beginPath();
        for(let k = 0; k <= 90; k++){
          const p = proj(rSurf, k / 90 * 2 * Math.PI);
          k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        }
        ctx.closePath(); ctx.stroke();
        rlText(ctx, cx, proj(rSurf, Math.PI / 2).y - 10, 'the surface',
               rgbCss(TH.grad), '10px ' + FONT_MONO, 'center');
      } else {
        rlText(ctx, cx, cy + 60,
          'the surface is at ' + fmtNum(rSurf, 4) + ' rs — far off this picture',
          rgbCss(TH.grad), '10px ' + FONT_MONO, 'center');
      }
    }
    /* the probe ring */
    if(st.rr < rMax){
      ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for(let k = 0; k <= 90; k++){
        const p = proj(st.rr, k / 90 * 2 * Math.PI);
        k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.closePath(); ctx.stroke();
      ctx.setLineDash([]);
    }
    for(const [rr, col, nm] of [[1.5, TH.neg, 'photon sphere'], [3, TH.accent, 'ISCO']]){
      if(B.R > rr * rs) continue;         // buried inside an ordinary body
      ctx.strokeStyle = rgbCss(col, 0.7); ctx.lineWidth = 1.2;
      ctx.beginPath();
      for(let k = 0; k <= 90; k++){
        const p = proj(rr, k / 90 * 2 * Math.PI);
        k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
      }
      ctx.closePath(); ctx.stroke();
      rlText(ctx, cx + rr * sc + 6, proj(rr, 0).y, nm, rgbCss(col), '9.5px ' + FONT_MONO);
    }

    /* --- the two metric factors, plotted --- */
    const P = mkPlot(W * 0.52, 52, W * 0.42, H - 128, 1, 20, 0, 2.6);
    plotFrame(ctx, P, 'r / rs', '', 'The two factors in the metric — and they are reciprocals');
    plotTicksX(ctx, P, [1, 5, 10, 15, 20], v => String(v));
    rlYTicks(ctx, P, [0, 0.5, 1, 1.5, 2, 2.5]);
    const N = 400, rsv = new Float64Array(N), tt = new Float64Array(N), sp = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const r = 1 + 19 * (i + 0.5) / N;
      rsv[i] = r; tt[i] = Math.sqrt(1 - 1 / r); sp[i] = 1 / Math.sqrt(1 - 1 / r);
    }
    rlLine(ctx, P, rsv, tt, rgbCss(TH.neg), 2.4);
    rlLine(ctx, P, rsv, sp, rgbCss(TH.curl), 2.4);
    rlSegment(ctx, P.px, P.Y(1), P.px + P.pw, P.Y(1), rgbCss(TH.faint, 0.5), 1, [4, 4]);
    rlText(ctx, P.px + P.pw - 6, P.Y(1) - 9, 'flat space', rgbCss(TH.faint), '10px ' + FONT_UI, 'right');
    if(st.rr <= 20){
      rlSegment(ctx, P.X(st.rr), P.py, P.X(st.rr), P.py + P.ph, rgbCss(TH.pos, 0.7), 1.3, [4, 4]);
      rlDot(ctx, P.X(st.rr), P.Y(Math.sqrt(1 - 1 / st.rr)), 5, rgbCss(TH.pos));
    }
    rlSegment(ctx, P.X(1.5), P.py, P.X(1.5), P.py + P.ph, rgbCss(TH.neg, 0.35), 1);
    rlSegment(ctx, P.X(3), P.py, P.X(3), P.py + P.ph, rgbCss(TH.accent, 0.35), 1);
    stageNote(ctx, 'ds² = −(1−rs/r)c²dt² + dr²/(1−rs/r) + r²dΩ²', W, H);
  },
  readout(st){
    const B = GR_BODIES[st.body], rs = grRs(B.GM);
    const r = st.rr * rs;
    const rate = grTimeDilation(r, rs);
    const surfRate = B.R > rs ? grTimeDilation(B.R, rs) : 0;
    const gps = grGPSRates();
    const esc = Math.sqrt(2 * B.GM / r) / C_SI;
    return `<div class="card tight"><div class="ttl">${B.nm}</div>
      ${kv('GM', fmtNum(B.GM, 5) + ' m³/s²')}
      ${kv('Schwarzschild radius 2GM/c²', rs > 1000 ? fmtNum(rs / 1000, 5) + ' km' : fmtNum(rs, 5) + ' m')}
      ${B.R > 0 ? kv('actual radius', fmtNum(B.R / B.u, 5) + ' ' + B.unit) : kv('actual radius', 'none — it is a horizon')}
      ${B.R > 0 ? kv('R / rs', fmtNum(B.R / rs, 5)) : ''}
      ${kv('photon sphere 1.5 rs', fmtNum(grPhotonSphere(rs) / B.u, 5) + ' ' + B.unit)}
      ${kv('ISCO 3 rs', fmtNum(grISCO(rs) / B.u, 5) + ' ' + B.unit)}
      ${B.R > rs ? kv('clock rate at the surface', fmtNum(surfRate, 12)) : ''}
      ${B.R > rs ? kv('seconds gained per year, up here', fmtNum((1 - surfRate) * 3.15576e7, 5) + ' s') : ''}
    </div>
    <div class="card tight"><div class="ttl">At your probe, r = ${fmtNum(st.rr, 4)} rs</div>
      ${kv('r', fmtNum(r / B.u, 5) + ' ' + B.unit)}
      ${kv('dτ/dt = √(1 − rs/r)', fmtNum(rate, 10))}
      ${kv('a clock here loses, per day', fmtNum((1 - rate) * 86400, 5) + ' s')}
      ${kv('light climbing to infinity is redshifted to', '×' + fmtNum(rate, 8))}
      ${kv('redshift z', fmtNum(1 / Math.max(1e-12, rate) - 1, 6))}
      ${kv('escape velocity', fmtNum(esc, 6) + ' c')}
      ${kv('proper distance from here down to 1.01 rs',
           fmtNum(grProperRadial(1.01 * rs, r, rs) / B.u, 5) + ' ' + B.unit)}
      ${kv('the coordinate difference', fmtNum((r - 1.01 * rs) / B.u, 5) + ' ' + B.unit)}
      <p class="help">Those last two rows are what curvature <i>is</i>, measured: a ruler laid radially
      covers more proper distance than the difference of the two r values, because r is defined by the
      circumference of a ring (<b>r = C/2π</b>) and not by any radial measurement. There is more room
      down there than there is space to put it in.</p>
    </div>
    <div class="card tight"><div class="ttl">And it is not academic — GPS</div>
      ${kv('orbit radius', fmtNum(gps.r / 1000, 6) + ' km')}
      ${kv('orbital speed', fmtNum(gps.v, 5) + ' m/s')}
      ${kv('gravity runs the satellite clock fast by', '+' + fmtNum(gps.gravUsPerDay, 4) + ' μs/day')}
      ${kv('motion runs it slow by', fmtNum(gps.kinUsPerDay, 4) + ' μs/day')}
      ${kv('net', '+' + fmtNum(gps.netUsPerDay, 4) + ' μs/day')}
      ${kv('as a positioning error', fmtNum(gps.metresPerDay / 1000, 4) + ' km/day')}
      <p class="help">Two effects of opposite sign that do not cancel, computed here from the metric and
      the orbit rather than looked up. Left uncorrected the system would be useless within an hour and
      absurd within a day. The satellites' oscillators are deliberately offset before launch to run at
      10.22999999543 MHz so that they tick at 10.23 MHz once in orbit.</p>
    </div>`;
  },
  chip(st){
    const B = GR_BODIES[st.body], rs = grRs(B.GM);
    return `<div class="k">${B.nm}</div>
      <div style="color:var(--c-warn)">rs = ${rs > 1000 ? fmtNum(rs / 1000, 4) + ' km' : fmtNum(rs, 4) + ' m'}</div>
      <div style="color:var(--c-neg)">dτ/dt = ${fmtNum(grTimeDilation(st.rr * rs, rs), 7)}</div>`;
  },
  legend(){ return [['var(--c-curl)', "Flamm's paraboloid, and the stretch factor 1/√(1−rs/r)"],
                    ['var(--c-neg)', 'the clock rate √(1−rs/r), and the photon sphere'],
                    ['var(--c-warn)', 'the horizon at rs'],
                    ['var(--c-grad)', "the body's actual surface"],
                    ['var(--accent)', 'the ISCO at 3 rs'],
                    ['var(--c-pos)', 'your probe radius']]; }
};

/* ---- 17 · orbits and the perihelion of Mercury -----------------------------
   Newton's orbits close. Einstein's do not, because the effective potential
   gains one extra term — and that term, evaluated for Mercury, is the 43
   arcseconds per century that had been sitting unexplained since 1859. */
STAGES.rlOrbit = {
  title: 'Precessing orbits',
  derive(st){
    return {
      title:'The 43 arcseconds that confirmed the theory',
      steps:[
        drvSay('the anomaly that was waiting',
          'Mercury\'s perihelion advances by about 574 arcseconds per century. Newtonian perturbations from the other planets account for 531 of them. The remaining 43 resisted every explanation for sixty years, including a hypothetical planet Vulcan that was searched for and never found.'),
        drvStep('the Newtonian effective potential',
          `${dv('V')} ${dop('=')} ${dop('−')}${dfrac(dv('GM'), dv('r'))} ${dop('+')} ${dfrac(dv('L') + '²', '2' + dv('r') + '²')}`,
          'gravity plus the centrifugal barrier — this gives a closed ellipse exactly'),
        drvSay('closure is a peculiarity of the inverse square, not a general rule',
          'Only the inverse-square and harmonic force laws produce orbits that close after one revolution. Any other power gives a rosette. So the closure of Newtonian orbits is a delicate coincidence, and the smallest correction destroys it.'),
        drvStep('general relativity adds one more term',
          `${dop('−')}${dfrac(dv('GML') + '²', dv('c') + '²' + dv('r') + '³')}`,
          'falling as 1/r³, so it matters only close in — the panel exaggerates it to make the effect visible'),
        drvStep('and that breaks the closure',
          `Δφ ${dop('=')} ${dfrac('6π' + dv('GM'), dv('c') + '²' + dv('a') + '(1 − ' + dv('e') + '²)')}`,
          `for Mercury this gives 43.0 arcseconds per century — the panel computes it from the constants`),
        drvSay('and it was a genuine prediction of an already-known number',
          'Einstein did not fit anything. The 43 arcseconds fell out of a theory built for entirely different reasons, and he later wrote that the discovery gave him palpitations. It is one of the cleanest confirmations in the history of physics.'),
        drvStep('the orbit is integrated, not drawn',
          `geodesic motion in the Schwarzschild metric`,
          `${st.orbits} orbits at eccentricity ${fmtNum(st.e, 3)} — the panel measures the precession from the trace`),
        drvSay('and the same effect is now seen in far stronger fields',
          'The star S2 orbiting the Milky Way\'s central black hole precesses by about 12 arcminutes per orbit — measured in 2020 and matching general relativity. Binary pulsars show it thousands of times larger still. What was a 43-arcsecond discrepancy is now a precision test.')
      ],
      note:'The precession shown is measured from the integrated trajectory by locating successive perihelia, not applied as a formula. The exaggeration slider scales the relativistic term so the effect is visible; at exaggeration 1 the measured value matches the closed form.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.sys = o.sys || 'mercury';
    st.e = o.e === undefined ? 0.2 : o.e;
    st.exag = o.exag === undefined ? 1 : o.exag;
    st.orbits = o.orbits === undefined ? 3 : o.orbits;
  },
  controls(){
    const st = ST;
    return rlSeg('rlOrS', st.sys, [['mercury','Mercury, to scale'],['strong','close to a black hole'],
                                    ['isco','just outside the ISCO']]) +
      ctlRow('eccentricity', ctlSlider('rlOrE', 0, 0.6, 0.005, st.e)) +
      ctlRow('orbits drawn', ctlSlider('rlOrN', 1, 12, 1, st.orbits)) +
      (st.sys === 'mercury' ? ctlRow('exaggerate ×', ctlSlider('rlOrX', 1, 200000, 1000, st.exag)) : '') +
      `<p class="help">The orbit equation in <b>u = 1/r</b> is <b>d²u/dφ² + u = GM/L² + (3GM/c²)u²</b>.
      Delete the last term and you have Newton, whose solution is a conic section that closes exactly.
      Keep it and the ellipse turns slowly, by <b>6πGM/(c²a(1−e²))</b> per orbit. Both curves here are
      <i>integrated</i>, not drawn from a formula, so the precession in the picture is a computed result.
      For Mercury it is 0.104″ per orbit — far too small to see, which is why there is an exaggeration
      slider; the readout always reports the true number, and the plot of perihelion angle against orbit
      count is honest at any setting.</p>`;
  },
  wire(){
    rlWireSeg('rlOrS', v => { ST.sys = v; ST.exag = 1; });
    wireSlider('rlOrE', () => ST.e, v => { ST.e = v; }, v => fmtNum(+v, 3));
    wireSlider('rlOrN', () => ST.orbits, v => { ST.orbits = Math.round(v); }, v => Math.round(v) + ' orbits');
    if($('rlOrX')) wireSlider('rlOrX', () => ST.exag, v => { ST.exag = Math.round(v); },
                              v => '×' + fmtNum(Math.round(v), 6) + ' (drawing only)');
  },
  setup(st){
    /* a is in metres; L from the Newtonian relation, which is the right seed */
    if(st.sys === 'mercury'){
      const a = 5.7909050e10;
      return { GM: GM_SUN, a, e: st.e, P: 87.9691, nm: 'Mercury round the Sun' };
    }
    const GM = GM_SUN * 10, rs = grRs(GM);
    const a = (st.sys === 'strong' ? 20 : 6.5) * rs;
    return { GM, a, e: st.e, P: 0, nm: st.sys === 'strong' ? 'a star at 20 rs' : 'a star just outside the ISCO' };
  },
  frame(st, dt, ctx, W, H){
    const S = this.setup(st);
    const L = Math.sqrt(S.GM * S.a * (1 - S.e * S.e));
    const steps = 3000 * st.orbits;
    const dphi = 2 * Math.PI * st.orbits / steps;
    const u0 = 1 / (S.a * (1 + S.e));
    const gr = grOrbitIntegrate(S.GM, L, u0, 0, dphi, steps, true);
    const nw = grOrbitIntegrate(S.GM, L, u0, 0, dphi, steps, false);
    const trueAdv = grPeriapsisAngle(gr) - 2 * Math.PI;

    /* --- the orbit --- */
    const cx = W * 0.26, cy = H * 0.47;
    const rMax = S.a * (1 + S.e) * 1.12;
    const sc = Math.min(W * 0.20, H * 0.36) / rMax;
    rlText(ctx, cx, 32, S.nm + (st.exag > 1 ? '  ·  precession drawn ×' + fmtNum(st.exag, 6) : ''),
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    /* the central mass, its horizon and its landmarks */
    const rs = grRs(S.GM);
    if(rs * sc > 1.5){
      ctx.fillStyle = rgbCss(TH.warn, 0.85);
      ctx.beginPath(); ctx.arc(cx, cy, rs * sc, 0, 6.2832); ctx.fill();
      for(const [k, col] of [[1.5, TH.neg], [3, TH.accent]]){
        ctx.strokeStyle = rgbCss(col, 0.55); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, k * rs * sc, 0, 6.2832); ctx.stroke();
      }
    } else rlDot(ctx, cx, cy, 5, rgbCss(TH.warn));
    const drawOrbit = (res, col, wd, exag) => {
      ctx.strokeStyle = col; ctx.lineWidth = wd;
      ctx.beginPath();
      for(let i = 0; i < res.u.length; i++){
        const r = 1 / res.u[i];
        if(!Number.isFinite(r) || r <= 0 || r > rMax * 1.6) continue;
        /* the exaggeration rotates the drawing by (exag−1)× the accrued advance,
           which is a picture of the same physics with the effect amplified */
        const ph = res.phi[i] + (exag - 1) * (trueAdv / (2 * Math.PI)) * res.phi[i];
        const X = cx + r * Math.cos(ph) * sc, Y = cy + r * Math.sin(ph) * sc;
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke();
    };
    drawOrbit(nw, rgbCss(TH.faint, 0.75), 1.5, 1);
    drawOrbit(gr, rgbCss(TH.grad), 2.2, st.exag);
    /* the perihelion direction, then and now */
    const advDrawn = trueAdv * st.exag;
    rlSegment(ctx, cx, cy, cx + rMax * sc * 0.98, cy, rgbCss(TH.pos, 0.55), 1.3, [4, 4]);
    rlSegment(ctx, cx, cy,
      cx + rMax * sc * 0.98 * Math.cos(advDrawn * st.orbits),
      cy + rMax * sc * 0.98 * Math.sin(advDrawn * st.orbits), rgbCss(TH.pos), 1.8);
    /* the moving planet */
    const idx = Math.min(gr.u.length - 1, Math.floor((st.t * 0.25 % st.orbits) / st.orbits * gr.u.length));
    const rp = 1 / gr.u[idx];
    const php = gr.phi[idx] * (1 + (st.exag - 1) * trueAdv / (2 * Math.PI));
    rlDot(ctx, cx + rp * Math.cos(php) * sc, cy + rp * Math.sin(php) * sc, 5, rgbCss(TH.curl));

    /* --- the effective potential --- */
    const P = mkPlot(W * 0.53, 48, W * 0.42, (H - 130) * 0.52, 0, 1, 0, 1);
    const rLo = Math.max(rs * 1.02, S.a * (1 - S.e) * 0.45), rHi = S.a * (1 + S.e) * 2.2;
    const NV = 340, rv = new Float64Array(NV), vg = new Float64Array(NV), vn = new Float64Array(NV);
    let lo = 1e30, hi = -1e30;
    for(let i = 0; i < NV; i++){
      const r = rLo + (rHi - rLo) * (i + 0.5) / NV;
      rv[i] = r; vg[i] = grVeff(r, S.GM, L); vn[i] = grVeffNewton(r, S.GM, L);
      lo = Math.min(lo, vg[i], vn[i]); hi = Math.max(hi, vn[i]);
    }
    const pad = (hi - lo) * 0.18;
    const V = mkPlot(P.px, P.py, P.pw, P.ph, rLo, rHi, lo - pad, hi + pad);
    plotFrame(ctx, V, 'r  (m)', 'V_eff per unit mass',
      'The effective potential — and the one term general relativity adds');
    plotTicksX(ctx, V, [rLo, (rLo + rHi) / 2, rHi], v => fmtNum(v, 3));
    rlLine(ctx, V, rv, vn, rgbCss(TH.faint, 0.9), 1.8, [4, 4]);
    rlLine(ctx, V, rv, vg, rgbCss(TH.grad), 2.4);
    /* the orbit's energy, and the turning points it implies */
    const Eorb = grVeffNewton(S.a * (1 + S.e), S.GM, L);
    rlSegment(ctx, V.px, V.Y(Eorb), V.px + V.pw, V.Y(Eorb), rgbCss(TH.pos, 0.8), 1.4, [5, 4]);
    rlText(ctx, V.px + 6, V.Y(Eorb) - 9, 'the orbit\'s energy', rgbCss(TH.pos), '10px ' + FONT_MONO);
    if(grISCO(rs) > rLo && grISCO(rs) < rHi){
      rlSegment(ctx, V.X(grISCO(rs)), V.py, V.X(grISCO(rs)), V.py + V.ph, rgbCss(TH.accent, 0.6), 1.2, [3, 3]);
      rlText(ctx, V.X(grISCO(rs)) + 5, V.py + 12, 'ISCO', rgbCss(TH.accent), '10px ' + FONT_MONO);
    }

    /* --- perihelion angle against orbit number: honest at any exaggeration --- */
    const Q = mkPlot(W * 0.53, 48 + (H - 130) * 0.52 + 54, W * 0.42, (H - 130) * 0.48 - 20,
                     0, Math.max(2, st.orbits), 0, Math.max(1e-9, trueAdv * ARCSEC * Math.max(2, st.orbits) * 1.15));
    plotFrame(ctx, Q, 'orbit number', 'perihelion advance  (arcsec)',
      'Measured off the integrated orbit, not quoted from a formula');
    plotTicksX(ctx, Q, [0, Math.max(2, st.orbits) / 2, Math.max(2, st.orbits)], v => fmtNum(v, 3));
    rlYTicks(ctx, Q, [0, Q.y1 / 2, Q.y1], v => fmtNum(v, 3));
    ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(Q.X(0), Q.Y(0));
    ctx.lineTo(Q.X(Math.max(2, st.orbits)), Q.Y(trueAdv * ARCSEC * Math.max(2, st.orbits)));
    ctx.stroke();
    /* the closed-form prediction, dashed on top — they should coincide */
    ctx.strokeStyle = rgbCss(TH.pos, 0.9); ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(Q.X(0), Q.Y(0));
    ctx.lineTo(Q.X(Math.max(2, st.orbits)),
               Q.Y(grPrecessionPerOrbit(S.GM, S.a, S.e) * ARCSEC * Math.max(2, st.orbits)));
    ctx.stroke(); ctx.setLineDash([]);
    stageNote(ctx, 'the extra term is −GML²/c²r³ — an inward pull that beats the centrifugal barrier close in', W, H);
  },
  readout(st){
    const S = this.setup(st);
    const L = Math.sqrt(S.GM * S.a * (1 - S.e * S.e));
    const rs = grRs(S.GM);
    const res = grOrbitIntegrate(S.GM, L, 1 / (S.a * (1 + S.e)), 0, 2 * Math.PI / 4000, 8000, true);
    const measured = grPeriapsisAngle(res) - 2 * Math.PI;
    const formula = grPrecessionPerOrbit(S.GM, S.a, S.e);
    const rp = S.a * (1 - S.e);
    return `<div class="card tight"><div class="ttl">${S.nm}</div>
      ${kv('GM', fmtNum(S.GM, 5) + ' m³/s²')}
      ${kv('semi-major axis a', fmtNum(S.a, 5) + ' m' + (rs > 0 ? '  =  ' + fmtNum(S.a / rs, 4) + ' rs' : ''))}
      ${kv('eccentricity e', fmtNum(S.e, 4))}
      ${kv('perihelion a(1−e)', fmtNum(rp, 5) + ' m  =  ' + fmtNum(rp / rs, 4) + ' rs')}
      ${kv('specific angular momentum L', fmtNum(L, 5) + ' m²/s')}
      ${kv('GM/(c²·perihelion)', fmtNum(S.GM / (C2 * rp), 4) + '  — the size of the correction')}
    </div>
    <div class="card tight"><div class="ttl">How much it turns</div>
      ${kv('integrated from the geodesic', fmtNum(measured, 6) + ' rad/orbit')}
      ${kv('6πGM/(c²a(1−e²))', fmtNum(formula, 6) + ' rad/orbit')}
      ${kv('difference', fmtAgree(measured, formula, '%'))}
      ${kv('in arcseconds per orbit', fmtNum(measured * ARCSEC, 6) + '″')}
      ${S.P ? kv('orbits per century', fmtNum(36525 / S.P, 6)) : ''}
      ${S.P ? kv('arcseconds per century', fmtNum(measured * ARCSEC * 36525 / S.P, 5) + '″') : ''}
      ${S.P ? kv('what Le Verrier could not explain', '43″ per century') : ''}
      <p class="help">${S.P
        ? 'The closed-form prediction and the integrated orbit agree to a fraction of a percent, which is the correct behaviour: the formula is the first term of an expansion in GM/c²r, and here that ratio is ' + fmtNum(S.GM / (C2 * rp), 3) + '. Le Verrier found the 43″ discrepancy in 1859 and proposed a planet, Vulcan, to account for it; people reported seeing it. Einstein computed this number in November 1915 and wrote that it gave him palpitations. It is the only classical test that was a <i>retrodiction</i> — the measurement was already on the table, with no free parameters left to adjust.'
        : 'This close in, the "correction" is not a correction: the orbit is a rosette, the closed-form first-order formula is well outside its range of validity, and the difference between the integrated answer and the formula is large and honest. Below the ISCO at 3 rs there are no bound circular orbits at all — the effective potential loses its minimum, and anything that drifts inside falls in.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Why it precesses at all</div>
      ${kv('Newtonian V_eff', '−GM/r + L²/2r²')}
      ${kv('general-relativistic V_eff', '−GM/r + L²/2r² − GML²/c²r³')}
      ${kv('the extra term at perihelion', fmtNum(-S.GM * L * L / (C2 * rp * rp * rp), 5) + ' J/kg')}
      ${kv('as a fraction of the Newtonian barrier', fmtNum(2 * S.GM / (C2 * rp), 5))}
      ${kv('ISCO, where the minimum disappears', fmtNum(grISCO(rs), 5) + ' m  = 3 rs')}
      ${kv('photon sphere', fmtNum(grPhotonSphere(rs), 5) + ' m  = 1.5 rs')}
      <p class="help">A <b>1/r²</b> force is special: it is one of only two central forces whose bound
      orbits close (the other is the harmonic oscillator), and the closure is fragile. Any extra term at
      all makes the ellipse turn. General relativity supplies a <b>1/r⁴</b> force — the gradient of that
      <b>1/r³</b> potential term — which grows faster than the centrifugal barrier and eventually beats
      it entirely. That is the origin of the innermost stable circular orbit, a feature Newtonian gravity
      simply does not have, and the reason accretion discs have an inner edge that radiates.</p>
    </div>`;
  },
  chip(st){
    const S = this.setup(st);
    const L = Math.sqrt(S.GM * S.a * (1 - S.e * S.e));
    const adv = grPrecessionPerOrbit(S.GM, S.a, S.e);
    return `<div class="k">Precession</div>
      <div style="color:var(--c-grad)">${fmtNum(adv * ARCSEC, 5)}″ per orbit</div>
      ${S.P ? `<div style="color:var(--c-curl)">${fmtNum(adv * ARCSEC * 36525 / S.P, 4)}″ per century</div>` : ''}`;
  },
  legend(){ return [['var(--c-grad)', 'the general-relativistic orbit, integrated'],
                    ['var(--faint)', 'the Newtonian ellipse, which closes'],
                    ['var(--c-pos)', 'the perihelion direction, before and after'],
                    ['var(--c-curl)', 'the accumulated advance, and the planet'],
                    ['var(--c-warn)', 'the horizon'], ['var(--accent)', 'the ISCO']]; }
};

/* ---- 18 · light bending, lensing and the Shapiro delay ---------------------
   Newton's corpuscular light bends too, by half as much. The factor of two is
   the curvature of space, and measuring it in 1919 turned a physicist into a
   household name inside a week. */
