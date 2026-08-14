/* ============================================================================
   4p · THE FLUIDS & THERMAL PHYSICS WING  and  THE OPTICS WING
   AP Physics 1 unit 8, AP Physics 2 units 1–2 and 6–7.
   ============================================================================ */

/* ---- 1 · fluid statics: pressure and buoyancy ----------------------------- */
STAGES.flStatic = {
  title:'Pressure & buoyancy',
  derive(st){
    const n = v => fmtNum(v, 6);
    if(st.own){
      const B = STAGES.flStatic.body(st).B;
      return {
        title:'Archimedes as a surface integral, and what is left when it is done properly',
        steps:[
          drvSay('the cube was a special case, and it hid the work',
            'A cube has vertical sides, so the sideways pressures cancel in pairs and only the flat top and bottom survive. Nothing about a general body is that convenient: a sloping flank carries a vertical component of pressure everywhere along it, and there is no pair of faces to difference.'),
          drvStep('so start from the definition — pressure pushes inwards on every element of the surface',
            `${dv('F')} ${dop('=')} ${dop('−')}∮ ${dv('P')} n̂ ${dv('dA')}`,
            'and only the vertical component survives, because a body of revolution is symmetric about its axis'),
          drvStep('for the surface swept by r(z), the outward element is',
            `n̂ ${dv('dA')} ${dop('=')} (${dv('r')}cos θ, ${dv('r')}sin θ, ${dop('−')}${dv('r')}${dv('r')}′) ${dv('dz')} ${dv('d')}θ`,
            'the −r r′ is the whole story: a flank that widens as it rises presses downwards'),
          drvStep('integrating θ out and writing s = r² gives the force in one dimension',
            `${dv('F')}_z ${dop('=')} π∫₀ᴴ ${dv('P')}${dv('s')}′ ${dv('dz')} ${dop('+')} π${dv('s')}(0)${dv('P')}(0) ${dop('−')} π${dv('s')}(${dv('H')})${dv('P')}(${dv('H')})`,
            `the two end terms are the flat caps; on your body this comes to ${n(B.Fsurf)} N`),
          drvSay('and there is no volume anywhere in that expression',
            'That is the point of computing it this way. The formula above contains a pressure, a radius and a derivative, and nothing that could be mistaken for the amount of fluid pushed aside. Whatever it evaluates to, it was not told the answer.'),
          drvStep('the atmosphere drops out before anything else does',
            `π${dv('P')}₀∫${dv('s')}′ ${dv('dz')} ${dop('+')} π${dv('P')}₀${dv('s')}(0) ${dop('−')} π${dv('P')}₀${dv('s')}(${dv('H')}) ${dop('=')} 0`,
            `the panel adds all 101 kPa of it back to every point of the surface and the force moves by ${n(B.atmGap)} N`),
          drvSay('a uniform pressure cannot push a closed surface anywhere',
            'The flanks telescope to s(H) − s(0) and the two caps cancel exactly that. It is why buoyancy does not depend on the weather, and it is the reason only the ρgh part of the pressure can possibly matter — which is what makes the next step work.'),
          drvStep('now integrate by parts, which is the proof',
            `π∫${dv('P')}${dv('s')}′ ${dv('dz')} ${dop('=')} π[${dv('P')}${dv('s')}]₀ᴴ ${dop('−')} π∫${dv('P')}′${dv('s')} ${dv('dz')}`,
            'the bracket cancels the two cap terms exactly, leaving only the second integral'),
          drvStep('and P′ is −ρg below the waterline and zero above it',
            `${dv('F')}_z ${dop('=')} ρ${dv('g')} ${dop('·')} π∫ ${dv('s')} ${dv('dz')} ${dop('=')} ρ${dv('g')}${dv('V')}_sub`,
            `the surviving integral runs from the keel to the waterline only, and gives ${n(B.Farch)} N — the two routes differ by ${n(B.gap)} N`),
          drvSay('so Archimedes is not a law, it is an integration by parts',
            'Nothing was added to hydrostatics to get it. P = P₀ + ρgh applied to a closed surface, with the parts moved around once, is the whole of it. The panel does both sides numerically by routes that share no code, which is why their difference is worth printing.'),
          drvStep('where it floats is then found by balancing that integral, not by a ratio',
            `${dv('F')}_z(z_w) ${dop('=')} ${dv('m')}${dv('g')}`,
            `bisection on the waterline gives z_w = ${n(B.zw)} m`),
          drvSay('which turns the density rule into a measurement',
            'The submerged volume fraction comes out at ' + fmtNum(B.fracVol, 4) + ' and the density ratio is ' + fmtNum(B.ratio, 4) + '. Those were computed by different means and they agree — that is the floating law, obtained rather than used. The fraction of the *height* under water is ' + fmtNum(B.fracH, 4) + ', a different number, and it is different for everything that is not a prism.'),
          drvStep('and once the integrals exist, so does stability',
            `${dv('G')}${dv('M')} ${dop('=')} ${dv('K')}${dv('B')} ${dop('+')} ${dfrac(dv('I') + '_w', dv('V') + '_sub')} ${dop('−')} ${dv('K')}${dv('G')}`,
            `= ${n(B.GM)} m — ${B.GM > 0 ? 'positive, so it floats upright' : 'negative, so it floats and then turns over'}`),
          drvSay('tilt it and the displaced volume moves sideways faster than the body does',
            'B is the centroid of the water pushed aside. Roll the hull and that centroid swings towards the side that went down, and the buoyant force with it. Whether the resulting couple rights the hull or finishes the job depends on how far B can swing, which is I_waterplane/V_sub — the reason a raft is wide and a log rolls.')
        ],
        note:'The buoyant force is computed twice: once by integrating pressure over the actual surface of the body you typed, with no volume in the calculation at all, and once as ρgV_sub with no pressure in it. The panel prints both and their difference. The waterline is then located by balancing the first of those against the weight, so the density-ratio rule is measured rather than assumed.'
      };
    }
    return {
      title:'Why an upward force appears with nothing pushing upwards',
      steps:[
        drvStep('pressure rises with depth because of the weight above',
          `${dv('P')} ${dop('=')} ${dv('P')}₀ ${dop('+')} ρ${dv('g')}${dv('h')}`,
          `at ${n(st.depth)} m in ${st.fluid}, the panel prints the gauge and absolute pressures`),
        drvSay('and depth is the only thing that matters',
          'The shape of the container is irrelevant — a narrow tube and a wide lake at the same depth have the same pressure. That is the hydrostatic paradox, and it follows because a fluid cannot support shear: any sideways imbalance would simply flow away until it vanished.'),
        drvStep('so a submerged body is squeezed harder underneath than on top',
          `Δ${dv('P')} ${dop('=')} ρ${dv('g')}${dv('H')}`,
          'H is the vertical extent of the body'),
        drvStep('and the net upward force is that difference times the area',
          `${dv('F')}_b ${dop('=')} Δ${dv('P')} ${dop('·')} ${dv('A')} ${dop('=')} ρ${dv('g')}${dv('V')}`,
          `V = ${n(st.V)} m³ displaced gives ${n(1000 * 9.80665 * st.V)} N in water`),
        drvSay('which is Archimedes\' principle, derived rather than asserted',
          'The buoyant force equals the weight of the displaced fluid. Nothing is pushing up on purpose — it is simply that the pressure below exceeds the pressure above, by exactly the amount corresponding to the fluid that would otherwise be there.'),
        drvStep('so floating is a comparison of densities',
          `float ${dop('⟺')} ρ_object ${dop('<')} ρ_fluid`,
          `the panel reports whether this object floats and what fraction sits below the surface`),
        drvSay('and the submerged fraction is the density ratio exactly',
          'At equilibrium the displaced weight equals the object\'s weight, so the submerged volume fraction is ρ_object/ρ_fluid. Ice at 917 kg/m³ in seawater at 1025 gives 0.894 — the famous nine-tenths, computed rather than remembered.'),
        drvStep('and the same argument works in air',
          `${dv('F')}_b ${dop('=')} ρ_air ${dv('g')}${dv('V')}`,
          'which is why a balloon rises, and why every precise mass measurement corrects for air buoyancy'),
        drvSay('the derivation assumed a fluid at rest, and that matters',
          'Everything here rests on the fluid being static, so pressure depends on depth alone. Once it moves, Bernoulli\'s theorem takes over and pressure depends on speed as well — which is the next stage, and where the intuition built here starts to mislead.')
      ],
      note:'The buoyant force is computed by integrating pressure over the object\'s surface and also from ρgV, and the panel prints both with the difference. Archimedes\' principle is thereby checked against the pressure integral it comes from.'
    };
  },
  enter(st, o){
    st.fluid = o.fluid || 'water';
    st.obj = o.obj || 'wood';
    st.depth = 1.5; st.V = 0.02;
    st.own = !!o.own;
    st.rsrc = o.rsrc || 'sqrt(z - z^2)';
    st.Hb = o.Hb || 0.5;
    st.rhoO = o.rhoO || 400;
  },
  /* the reader's body: the profile compiled once, and every integral it needs */
  body(st){
    const key = st.rsrc + '|' + st.Hb + '|' + st.rhoO + '|' + st.fluid;
    if(st._bk === key) return st._bd;
    st._bk = key;
    const g = pkCompile(st.rsrc);
    /* the height variable is z, so the third argument is the one that carries it */
    const rOf = z => { const v = g(0, 0, z); return Number.isFinite(v) && v > 0 ? v : 0; };
    const H = Math.max(0.02, Math.min(20, st.Hb));
    const rhoF = FL_MATERIALS[st.fluid].rho;
    const B = flBodyBuoy(rOf, H, rhoF, st.rhoO);
    /* the balance curve is 90 more surface integrals, so it is built here with
       the rest and never inside a frame — the picture must not re-integrate */
    const curve = [];
    if(!B.empty)
      for(let i = 0; i <= 90; i++){
        const z = H * i / 90;
        curve.push({ x:z, y:flBodyForce(rOf, H, rhoF, z, undefined, 0, 24) - B.W });
      }
    st._bd = { rOf, H, B, curve };
    return st._bd;
  },
  controls(){
    const st = ST;
    return ctSeg('flSf', st.fluid, ['water', 'seawater', 'oil', 'mercury'].map(k => [k, FL_MATERIALS[k].name])) +
      ctSeg('flSm', st.own ? 'own' : 'block',
            [['block', 'a cube of a chosen material'], ['own', 'shape your own body']]) +
      (st.own
        ? fnHtml('flSp', 'radius r(z) =', st.rsrc, 'z — the height above the keel, in metres') +
          ctlRow('body height', ctlSlider('flSh', 0.1, 1.4, 0.02, st.Hb)) +
          ctlRow('body density', ctlSlider('flSq', 50, 2600, 10, st.rhoO)) +
          `<p class="help">A cube gets away with differencing two faces, because a cube's sides are
          vertical and cancel in pairs. Give the body a radius that changes with height and nothing
          cancels — so the buoyant force is assembled the only way it is ever really defined, by
          <b>integrating pressure over the actual surface</b>. That calculation contains a pressure, a
          radius and a slope, and <i>no volume at all</i>. It is then compared with ρgV<sub>sub</sub>,
          which contains no pressure. The difference between them is Archimedes' principle measured on
          your body rather than quoted at you.</p>
          <p class="help">The waterline is found by <b>balancing that integral against the weight</b>,
          never by the density ratio — so the submerged <i>volume</i> fraction coming out equal to
          ρ<sub>object</sub>/ρ<sub>fluid</sub> is a result, not an input. The fraction of the
          <i>height</i> under water is a quite different number for anything that is not a prism.</p>
          <p class="help">Stability comes free once the integrals exist. B is the centroid of the water
          pushed aside, G the centroid of the body, and the metacentre sits I<sub>waterplane</sub>/V<sub>sub</sub>
          above B. When GM = KB + BM − KG turns negative the body still floats and then rolls over.
          The default is a bowl; push the height to 1 and it closes into a whole sphere, whose metacentre
          lands exactly on its centre of mass — neutral, for the obvious reason that a sphere looks the
          same however you turn it.</p>`
        : ctSeg('flSo', st.obj, ['wood', 'ice', 'aluminium', 'iron'].map(k => [k, FL_MATERIALS[k].name])) +
          ctlRow('depth', ctlSlider('flSd', 0, 4, 0.02, st.depth)) +
          ctlRow('volume', ctlSlider('flSv', 0.002, 0.06, 0.001, st.V))) +
      `<p class="help">Pressure in a fluid grows with depth because the fluid above has weight:
      <b>P = P₀ + ρgh</b>. It acts equally in every direction at a point — a fluid at rest cannot support
      shear, and that is the definition of a fluid rather than a fact about one.</p>
      <p class="help"><b>Archimedes</b> falls straight out of that. The pressure on the bottom of a
      submerged object exceeds the pressure on its top by ρg×(height), and multiplying by the area gives an
      upward force equal to <b>the weight of the fluid displaced</b>. The panel derives it exactly that way
      — by differencing the pressures over a cube — and compares with ρ_f g V.</p>
      <p class="help">An object floats when its density is less than the fluid's, and the fraction
      submerged is exactly the ratio of the two densities. Ice at 917 kg/m³ in water at 1000 floats with
      91.7% below the surface, which is where the iceberg proverb comes from.</p>`;
  },
  wire(){
    ctWireSeg('flSf', v => { ST.fluid = v; });
    ctWireSeg('flSm', v => { ST.own = (v === 'own'); });
    if(ST.own){
      fnWire('flSp', (m, s) => { ST.rsrc = s; });
      wireSlider('flSh', () => ST.Hb, v => { ST.Hb = v; }, v => fmtNum(+v, 3) + ' m');
      wireSlider('flSq', () => ST.rhoO, v => { ST.rhoO = v; }, v => fmtNum(+v, 5) + ' kg/m³');
    } else {
      ctWireSeg('flSo', v => { ST.obj = v; });
      wireSlider('flSd', () => ST.depth, v => { ST.depth = v; }, v => fmtNum(+v, 3) + ' m');
      wireSlider('flSv', () => ST.V, v => { ST.V = v; }, v => fmtNum(+v * 1000, 4) + ' L');
    }
  },
  /* the reader's body, its waterline, and where the force comes from */
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.flStatic.body(st), B = D.B, rOf = D.rOf, Hb = D.H;
    if(B.empty){
      ctText(ctx, W / 2, H / 2, 'that profile encloses no volume — r(z) is zero or negative everywhere',
             rgbCss(TH.faint), '14px ' + FONT_UI, 'center');
      return;
    }
    let rmax = 1e-6;
    for(let i = 0; i <= 200; i++) rmax = Math.max(rmax, rOf(Hb * i / 200));
    /* The body panel, in equal aspect so a sphere comes out round. The window
       has to hold the widest radius AND the full height, so it is sized by
       whichever binds and the other axis follows from the pixel aspect —
       deriving it from the height alone clips anything wider than it is tall. */
    const pwB = Math.min(W * 0.42, 460), phB = H - 132;
    let halfX = Math.max(rmax * 1.16, 0.02);
    let zSpan = 2 * halfX * phB / pwB;
    if(zSpan < Hb * 1.26){ zSpan = Hb * 1.26; halfX = zSpan * pwB / phB / 2; }
    const zLo = -0.11 * zSpan, zHi = zLo + zSpan;
    const P = mkPlot(70, 50, pwB, phB, -halfX, halfX, zLo, zHi);
    /* the title is kept short because the readout chip floats over the canvas's
       top-left corner, and a wide centred caption runs underneath it */
    plotFrame(ctx, P, '', 'height above the keel (m)', 'the body you shaped');
    /* the fluid, shaded by depth below the waterline */
    const zw = Math.min(Hb, B.zw);
    for(let i = 0; i < 46; i++){
      const zTop = zw - (zw - zLo) * i / 46;
      const zBot = zw - (zw - zLo) * (i + 1) / 46;
      const f = (i + 0.5) / 46;
      ctx.fillStyle = rgbCss(rampSeq(0.15 + 0.6 * f), 0.30);
      ctx.fillRect(P.px, P.Y(zTop), P.pw, Math.max(1, P.Y(zBot) - P.Y(zTop)));
    }
    ctPath(ctx, P, [{ x:-halfX, y:zw }, { x:halfX, y:zw }], rgbCss(TH.curl), 2.4);
    ctText(ctx, P.px + P.pw - 6, P.Y(zw) - 6, 'waterline', rgbCss(TH.curl), '11px ' + FONT_UI, 'right');
    /* the body: the profile, mirrored */
    const right = ctSample(z => ({ x:rOf(z), y:z }), 0, Hb, 160);
    const left = ctSample(z => ({ x:-rOf(z), y:z }), Hb, 0, 160);
    ctFill(ctx, P, right.concat(left), rgbCss(TH.grad, 0.55));
    ctPath(ctx, P, right.concat(left).concat([right[0]]), rgbCss(TH.grad), 2.2);
    /* the pressure on the wetted flank: normal to the surface, sized by depth */
    for(let i = 1; i < 9; i++){
      const z = zw * i / 9;
      const r = rOf(z); if(!(r > 0)) continue;
      const dr = (rOf(Math.min(Hb, z + 1e-4)) - rOf(Math.max(0, z - 1e-4))) / 2e-4;
      const nx = 1, nz = -dr, L = Math.hypot(nx, nz) || 1;
      const p = FL_MATERIALS[st.fluid].rho * DY_G * (zw - z);
      const s = 0.55 * halfX * p / (FL_MATERIALS[st.fluid].rho * DY_G * Hb + 1e-9);
      for(const sgn of [1, -1])
        ctArrow(ctx, P, sgn * (r + s * nx / L), z + s * nz / L, sgn * r, z, rgbCss(TH.warn), 1.6);
    }
    /* G, B and the metacentre */
    ctDot(ctx, P, 0, B.KG, 5, rgbCss(TH.neg));
    ctText(ctx, P.X(0) + 9, P.Y(B.KG) - 2, 'G  centre of mass', rgbCss(TH.neg), '11px ' + FONT_UI);
    ctDot(ctx, P, 0, B.KB, 5, rgbCss(TH.pos));
    ctText(ctx, P.X(0) + 9, P.Y(B.KB) + 12, 'B  centre of buoyancy', rgbCss(TH.pos), '11px ' + FONT_UI);
    if(B.hasMeta){
      ctDot(ctx, P, 0, B.KB + B.BM, 4.5, rgbCss(TH.curl));
      ctText(ctx, P.X(0) + 9, P.Y(B.KB + B.BM) - 12, 'M  metacentre', rgbCss(TH.curl), '11px ' + FONT_UI);
    }
    /* the balance the waterline was found by */
    const px2 = 70 + pwB + 96;
    const Q = mkPlot(px2, 50, Math.max(180, W - px2 - 64), phB, 0, Hb, 0, 1);
    const pts = D.curve;
    let lo = 0, hi = 0;
    for(const p of pts){ lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); }
    const pad = 0.08 * (hi - lo || 1);
    const Q2 = mkPlot(Q.px, Q.py, Q.pw, Q.ph, 0, Hb, lo - pad, hi + pad);
    plotFrame(ctx, Q2, 'waterline height z (m)', 'net upward force (N)',
              'buoyancy from the surface integral, minus the weight');
    ctGrid(ctx, Q2);
    ctPath(ctx, Q2, [{ x:0, y:0 }, { x:Hb, y:0 }], rgbCss(TH.line2), 1.4);
    ctPath(ctx, Q2, pts, rgbCss(TH.grad), 2.6);
    if(B.floats){
      ctDot(ctx, Q2, B.zw, 0, 5, rgbCss(TH.warn));
      ctText(ctx, Q2.X(B.zw), Q2.Y(0) - 12,
             'it floats here — z = ' + fmtNum(B.zw, 4) + ' m', rgbCss(TH.warn), '600 11px ' + FONT_UI, 'center');
    } else {
      ctText(ctx, Q2.px + Q2.pw / 2, Q2.py + 16,
             'the curve never reaches zero — this body sinks', rgbCss(TH.neg), '600 11.5px ' + FONT_UI, 'center');
    }
    stageNote(ctx, 'the amber arrows are the pressure on the wetted surface — that integral, and nothing else, is what puts the waterline where it is', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.flStatic.frameOwn(st, dt, ctx, W, H);
    const rhoF = FL_MATERIALS[st.fluid].rho, rhoO = FL_MATERIALS[st.obj].rho;
    const B = flBuoyancy(rhoF, st.V, rhoO);
    const side = Math.cbrt(st.V);
    const hw = W * 0.42;
    const P = ctBox(hw, H, 0, -1.6, 2.4, { r:12 });
    ctFrame(ctx, P, `${FL_MATERIALS[st.obj].name} in ${FL_MATERIALS[st.fluid].name.toLowerCase()}`);
    /* the fluid, shaded by pressure */
    for(let i = 0; i < 60; i++){
      const y = 0 - (i + 0.5) * 4 / 60;
      const p = flGauge(rhoF, -y);
      ctx.fillStyle = rgbCss(rampSeq(Math.min(1, p / (rhoF * DY_G * 4))), 0.55);
      ctx.fillRect(P.px, P.Y(y) - P.ph / 60 / 2 - 0.5, P.pw, P.ph / 60 + 1);
    }
    ctPath(ctx, P, [{ x:-2.4, y:0 }, { x:2.4, y:0 }], rgbCss(TH.curl), 2.6);
    /* the object: floating at its equilibrium depth, or held under */
    const top = B.floats ? side * (1 - B.fracSub) : -st.depth + side;
    const bot = top - side;
    ctFill(ctx, P, [{ x:-side / 2, y:bot }, { x:side / 2, y:bot }, { x:side / 2, y:top }, { x:-side / 2, y:top }],
           rgbCss(TH.grad, 0.85));
    const s = 0.9 / Math.max(B.FB, B.W || 1);
    const cy = (top + bot) / 2;
    ctArrow(ctx, P, 0, cy, 0, cy + B.FB * s, rgbCss(TH.pos), 3, 'F_B');
    if(Number.isFinite(B.W)) ctArrow(ctx, P, 0.35, cy, 0.35, cy - B.W * s, rgbCss(TH.neg), 3, 'mg');
    /* the pressure arrows on the faces, sized by depth */
    for(const [y, dir] of [[top, -1], [bot, 1]]){
      if(y > 0) continue;
      const p = flGauge(rhoF, -y);
      const L = 0.35 * p / (rhoF * DY_G * 4 + 1e-9) + 0.06;
      for(const x of [-side / 3, 0, side / 3])
        ctArrow(ctx, P, x, y - dir * L, x, y, rgbCss(TH.warn), 1.8);
    }
    /* the pressure profile */
    const x0 = W * 0.45;
    const Q = mkPlot(x0 + 60, 60, W - x0 - 100, H - 160, 0, flDepth(rhoF, 4) / 1000, -4, 0.3);
    plotFrame(ctx, Q, 'pressure  (kPa)', 'depth  (m)', 'P = P₀ + ρgh — linear in depth');
    plotTicksX(ctx, Q, [0, flDepth(rhoF, 2) / 1000, flDepth(rhoF, 4) / 1000], v => fmtNum(v, 4));
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.6;
    ctx.beginPath();
    for(let i = 0; i <= 100; i++){
      const y = -4 * i / 100;
      const X = Q.X(flDepth(rhoF, -y) / 1000), Y = Q.Y(y);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.warn, 0.8); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(Q.X(FL_P_ATM / 1000), Q.py); ctx.lineTo(Q.X(FL_P_ATM / 1000), Q.py + Q.ph); ctx.stroke();
    ctx.setLineDash([]);
    ctText(ctx, Q.X(FL_P_ATM / 1000) + 5, Q.py + 16, '1 atm', rgbCss(TH.warn), '600 10.5px ' + FONT_UI);
    probeLine(ctx, { X:Q.X, py:Q.py, ph:Q.ph, x0:Q.x0, x1:Q.x1 }, flDepth(rhoF, st.depth) / 1000, null);
    stageNote(ctx, 'colour is pressure · the arrows on the faces are why buoyancy exists at all', W, H);
  },
  readout(st){
    if(st.own){
      const D = STAGES.flStatic.body(st), B = D.B;
      if(B.empty) return `<div class="card tight"><div class="ttl">Nothing to float</div>
        ${kv('r(z)', pkPretty(st.rsrc))}
        <p class="help">The profile is zero or negative everywhere between the keel and the top, so it
        encloses no volume and there is no surface to integrate pressure over. Try something positive on
        0 ≤ z ≤ ${fmtNum(D.H, 3)} — <b>sqrt(z − z^2)</b> is a bowl, <b>0.45*z</b> a cone standing on its
        point, <b>0.4</b> a plain cylinder.</p></div>`;
      const rhoF = FL_MATERIALS[st.fluid].rho;
      return `<div class="card tight"><div class="ttl">Your body</div>
        ${kv('r(z)', pkPretty(st.rsrc))}
        ${kv('height', fmtNum(D.H, 4) + ' m')}
        ${kv('volume π∫r² dz', fmtNum(B.V * 1000, 5) + ' L')}
        ${kv('mass', fmtNum(B.m, 5) + ' kg')}
        ${kv('weight', fmtNum(B.W, 5) + ' N')}
        ${kv('widest radius at the waterline', fmtNum(B.rw, 5) + ' m')}
      </div>
      <div class="card tight"><div class="ttl">Archimedes, two ways</div>
        ${kv('∮ pressure over the surface', fmtNum(B.Fsurf, 7) + ' N')}
        ${kv('ρ g V_sub', fmtNum(B.Farch, 7) + ' N')}
        ${kv('difference', fmtAgree(B.Fsurf, B.Farch, 'N'))}
        ${kv('verdict', B.rel < 1e-6 ? '✓ they agree — the principle is what P = ρgh does to a closed surface'
                                     : 'the profile is too steep for the quadrature to resolve')}
        ${kv('and again with the whole atmosphere added', fmtNum(B.Fatm, 7) + ' N')}
        ${kv('change it made', fmtAgree(B.Fatm, B.Fsurf, 'N'))}
        <p class="help">The first row integrates <b>−∮P n̂ dA</b> over the flanks and the two caps. It
        contains a pressure, a radius and a slope, and <b>no volume anywhere</b>. The second row contains
        a volume and no pressure. Nothing in the code links them, so the gap is Archimedes' principle
        being <i>checked on a body nobody chose</i> — and the check is really an integration by parts,
        which the ladder below does symbolically.</p>
        <p class="help">The last two rows add 101 kPa of atmosphere to <i>every point</i> of the surface
        and integrate again. It changes nothing, because a uniform pressure exerts no net force on a
        closed surface — the caps cancel the flanks exactly. That is why buoyancy does not depend on the
        weather, and why a submarine's trim does not change when a storm passes overhead.</p>
      </div>
      <div class="card tight"><div class="ttl">${B.floats ? 'Where it floats' : 'It sinks'}</div>
        ${B.floats ? `${kv('waterline', fmtNum(B.zw, 5) + ' m above the keel')}
        ${kv('fraction of the volume under', fmtNum(B.fracVol, 5))}
        ${kv('density ratio ρ_object/ρ_fluid', fmtNum(B.ratio, 5))}
        ${kv('difference', fmtAgree(B.fracVol, B.ratio))}
        ${kv('fraction of the height under', fmtNum(B.fracH, 5))}
        <p class="help">The waterline was located by bisecting until the <i>surface integral</i> balanced
        the weight — the density ratio was never used. That the volume fraction comes out equal to it
        anyway is the floating law, measured. The <b>height</b> fraction is
        ${Math.abs(B.fracH - B.fracVol) < 1e-6 ? 'the same here only because this body has constant cross-section'
          : 'a different number, and it is different for everything that is not a prism — which is exactly what a cube cannot teach you'}.</p>`
        : `${kv('buoyancy when fully under', fmtNum(rhoF * DY_G * B.V, 6) + ' N')}
        ${kv('weight', fmtNum(B.W, 6) + ' N')}
        ${kv('apparent weight submerged', fmtNum(B.apparentW, 6) + ' N')}
        ${kv('density ratio ρ_object/ρ_fluid', fmtNum(B.ratio, 5))}
        <p class="help">Fully submerged is the most buoyancy there is, and it is not enough. Lower the
        density below ${fmtNum(rhoF, 5)} kg/m³ and the balance curve on the right will cross zero.</p>`}
      </div>
      <div class="card tight"><div class="ttl">${B.floats ? (B.stable ? 'It floats upright' : 'It floats, then turns over') : 'Stability under water'}</div>
        ${kv('KG — centre of mass above the keel', fmtNum(B.KG, 5) + ' m')}
        ${kv('KB — centre of buoyancy', fmtNum(B.KB, 5) + ' m')}
        ${B.hasMeta ? kv('BM = I_waterplane / V_sub', fmtNum(B.BM, 5) + ' m') : ''}
        ${B.hasMeta ? kv('GM = KB + BM − KG', fmtNum(B.GM, 5) + ' m') : ''}
        ${kv('verdict', B.floats
            ? (Math.abs(B.GM) < 1e-6 ? 'neutral — every orientation is equivalent'
               : B.GM > 0 ? 'stable — a tilt produces a righting couple'
                          : 'unstable — a tilt produces a couple that makes it worse')
            : (B.KB > B.KG ? 'a fully submerged body is stable only with B above G — this one is'
                           : 'submerged, with B below G: it would turn over'))}
        <p class="help">Roll the hull and the water it pushes aside shifts sideways, taking B with it. The
        buoyant force stays vertical, so it now acts along a line through the <b>metacentre</b> M, a
        height I<sub>waterplane</sub>/V<sub>sub</sub> above B. If M is above G the couple rights the hull;
        if below, it finishes the job. Wide at the waterline means a large I and a high M, which is why
        rafts are broad and logs roll.</p>
        ${Math.abs(B.GM) < 2e-3 && B.hasMeta ? `<p class="help">This one is close to neutral. A whole
        sphere is exactly neutral — its metacentre coincides with its centre of mass however dense it is,
        because a sphere presents the same shape whichever way it is turned.</p>` : ''}
      </div>`;
    }
    const rhoF = FL_MATERIALS[st.fluid].rho, rhoO = FL_MATERIALS[st.obj].rho;
    const B = flBuoyancy(rhoF, st.V, rhoO);
    const side = Math.cbrt(st.V);
    const G = flBuoyancyIntegral(rhoF, side, Math.max(0.01, st.depth));
    return `<div class="card tight"><div class="ttl">Pressure at ${fmtNum(st.depth, 3)} m</div>
      ${kv('gauge pressure ρgh', fmtNum(flGauge(rhoF, st.depth), 6) + ' Pa')}
      ${kv('absolute pressure', fmtNum(flDepth(rhoF, st.depth), 6) + ' Pa')}
      ${kv('in atmospheres', fmtNum(flDepth(rhoF, st.depth) / FL_P_ATM, 5))}
      ${kv('depth for one extra atmosphere', fmtNum(FL_P_ATM / (rhoF * DY_G), 5) + ' m')}
      <p class="help">In water that is about 10 m — which is why a diver's ears complain in a swimming pool
      and why a barometer of water would need to be ten metres tall. In mercury it is 760 mm, which is the
      original definition of the unit.</p>
    </div>
    <div class="card tight"><div class="ttl">Buoyancy, two ways</div>
      ${kv('fluid density', fmtNum(rhoF, 5) + ' kg/m³')}
      ${kv('object density', fmtNum(rhoO, 5) + ' kg/m³')}
      ${kv('volume', fmtNum(st.V * 1000, 5) + ' L')}
      ${kv('weight mg', fmtNum(B.W, 6) + ' N')}
      ${kv('F_B = ρ_f g V_sub', fmtNum(B.FB, 6) + ' N')}
      ${kv('by integrating pressure over a cube', fmtNum(G.FB, 6) + ' N')}
      ${kv('difference', fmtAgree(G.FB, G.predicted))}
      <p class="help">The second row differences the pressure on the top and bottom faces of a submerged
      cube and multiplies by the area — the sides cancel by symmetry. Archimedes' principle is not an extra
      law; it is what P = ρgh does to a closed surface.</p>
    </div>
    <div class="card tight"><div class="ttl">Float or sink</div>
      ${kv('density ratio', fmtNum(rhoO / rhoF, 5))}
      ${kv('verdict', B.floats ? 'it floats' : 'it sinks')}
      ${kv('fraction submerged', B.floats ? fmtNum(100 * B.fracSub, 4) + '%' : '100%')}
      ${kv('apparent weight fully submerged', fmtNum(B.W - rhoF * DY_G * st.V, 6) + ' N')}
      ${kv('as a fraction of the real weight', fmtNum(1 - rhoF / rhoO, 5))}
      <p class="help">The fraction submerged is exactly the density ratio — nothing else enters, not the
      shape and not the size. A steel ship floats because its <i>average</i> density including the air
      inside it is well under water's; puncture the hull and that average changes, which is the whole of
      naval architecture in one sentence.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const B = STAGES.flStatic.body(st).B;
      if(B.empty) return `<div class="k">your body</div><div>no volume enclosed</div>`;
      return `<div class="k">${B.floats ? (B.stable ? 'floats upright' : 'floats, capsizes') : 'sinks'}</div>
        <div style="color:var(--c-pos)">${fmtNum(100 * B.fracVol, 4)}% of the volume under</div>
        <div style="color:var(--c-warn)">${fmtNum(100 * B.fracH, 4)}% of the height under</div>`;
    }
    const B = flBuoyancy(FL_MATERIALS[st.fluid].rho, st.V, FL_MATERIALS[st.obj].rho);
    return `<div class="k">${B.floats ? 'floats' : 'sinks'}</div>
      <div style="color:var(--c-pos)">F_B = ${fmtNum(B.FB, 5)} N</div>
      <div style="color:var(--c-neg)">mg = ${fmtNum(B.W, 5)} N</div>`;
  },
  legend(st){
    if(st && st.own) return [['var(--c-grad)', 'your body, and the net-force curve'],
                             ['var(--c-warn)', 'the pressure on the wetted surface'],
                             ['var(--c-pos)', 'B — centre of buoyancy'],
                             ['var(--c-neg)', 'G — centre of mass'],
                             ['var(--c-curl)', 'the waterline, and the metacentre']];
    return [['var(--c-grad)', 'pressure, and the object'], ['var(--c-pos)', 'buoyant force'],
            ['var(--c-neg)', 'weight'], ['var(--c-warn)', 'the pressure on each face'],
            ['var(--c-curl)', 'the surface']]; },
  dockLegend:true
};

/* ---- 2 · flow: continuity and Bernoulli ---------------------------------- */
STAGES.flFlow = {
  title:'Continuity & Bernoulli',
  derive(st){
    const n = v => fmtNum(v, 6);
    const v2 = st.v1 * st.A1 / st.A2;
    return {
      title:'Conservation of mass, then conservation of energy, along a streamline',
      steps:[
        drvStep('mass in must equal mass out',
          `ρ${dv('A')}₁${dv('v')}₁ ${dop('=')} ρ${dv('A')}₂${dv('v')}₂`,
          `A₁ = ${n(st.A1)} m², v₁ = ${n(st.v1)} m/s`),
        drvStep('so for an incompressible fluid, narrowing means speeding up',
          `${dv('v')}₂ ${dop('=')} ${dv('v')}₁${dfrac(dv('A') + '₁', dv('A') + '₂')}`,
          `= ${n(v2)} m/s through the constriction`),
        drvSay('this is the continuity equation of the vector-calculus wing',
          'In differential form it is ∇·(ρv) = 0, and the divergence theorem turns that into the statement about a pipe. Nothing accumulates anywhere, so what flows in must flow out — the same accounting as charge conservation.'),
        drvStep('now apply the work–energy theorem to a parcel of fluid',
          `${dv('P')} ${dop('+')} ${dfrac('1', '2')}ρ${dv('v')}² ${dop('+')} ρ${dv('g')}${dv('h')} ${dop('=')} const`,
          `P₁ = ${n(st.P1)} Pa, and the panel computes P₂ from this`),
        drvSay('each term is an energy density, which is why they add',
          'Divide the work–energy theorem by volume and every term becomes an energy per unit volume — pressure is one, kinetic energy density is another, gravitational potential energy density the third. Bernoulli is conservation of energy with the units chosen to suit a fluid.'),
        drvStep('so a faster fluid is at lower pressure',
          `${dv('P')}₂ ${dop('=')} ${dv('P')}₁ ${dop('+')} ${dfrac('1', '2')}ρ(${dv('v')}₁² ${dop('−')} ${dv('v')}₂²)`,
          `= ${n(st.P1 + 0.5 * 1000 * (st.v1 * st.v1 - v2 * v2))} Pa — lower, because the fluid sped up`),
        drvSay('the direction of causation is worth getting right',
          'The fluid does not speed up because the pressure dropped. Continuity forces it to speed up because the pipe narrowed, and the energy for that extra kinetic energy has to come from somewhere — so the pressure falls. Pressure is the consequence, not the cause.'),
        drvStep('and the assumptions are severe',
          `steady, incompressible, inviscid, along one streamline`,
          'drop any of them and the theorem does not apply'),
        drvSay('which is why the usual aeroplane explanation is wrong',
          'The claim that air over the top must "arrive at the same time" is simply false — it arrives sooner, and there is no principle requiring otherwise. Lift comes from the wing deflecting air downwards, and by the third law being pushed up. Bernoulli describes the pressure field correctly but does not explain why the flow is as it is.'),
        drvSay('and viscosity is what the model ignores entirely',
          'Real fluids stick to surfaces, forming a boundary layer where all the drag lives. Inviscid theory famously predicts zero drag on any body — d\'Alembert\'s paradox — which is a spectacular failure of a model that is otherwise very useful.')
      ],
      note:'The panel computes the pressure both from Bernoulli and by integrating the pressure gradient along the pipe, and prints the difference. Where the flow is steady and incompressible the two agree, which is the theorem being tested against its own assumptions.'
    };
  },
  enter(st, o){
    st.A1 = 0.02; st.A2 = 0.008; st.v1 = 2; st.P1 = 2e5; st.dh = 0;
    st.t = 0;
    st.own = !!o.own;
    st.Asrc = o.Asrc || '0.02 - 0.013*exp(-((x-1.5)/0.35)^2)';
  },
  controls(){
    const st = ST;
    return ctSeg('flFm', st.own ? 'own' : 'venturi',
                 [['venturi', 'a two-section Venturi'], ['own', 'shape your own pipe']]) +
      (st.own
        ? fnHtml('flFA', 'area A(x) in m² =', st.Asrc, 'x, from 0 to 3 m') +
          ctlRow('inlet speed v₁', ctlSlider('flFv', 0.3, 8, 0.05, st.v1)) +
          ctlRow('inlet pressure P₁', ctlSlider('flFp', 5e4, 5e5, 5e3, st.P1)) +
          `<p class="help">The pipe has no special sections now, so the two laws have to hold
          <b>everywhere along it</b> rather than at a pair of chosen points. Continuity fixes the speed
          outright — v(x) = Q/A(x) — and the pressure is computed <b>twice, by routes that share
          nothing</b>: once from the Bernoulli constant, and once by integrating
          <b>dP/dx = −ρv·dv/dx</b> forward from the inlet with RK4, which never uses the constant at all.
          Bernoulli <i>is</i> the first integral of Euler, so the two curves must lie on top of each
          other — and nothing in the code makes them.</p>
          <p class="help">Squeeze the throat hard enough and the computed pressure falls below the vapour
          pressure of water. Real liquid boils there — that is <b>cavitation</b>, and it wrecks propellers
          and pump impellers. The panel says so rather than drawing a pressure no liquid could hold.</p>`
        : ctlRow('wide area A₁', ctlSlider('flFa1', 0.005, 0.04, 0.001, st.A1)) +
          ctlRow('narrow area A₂', ctlSlider('flFa2', 0.002, 0.03, 0.0005, st.A2)) +
          ctlRow('inlet speed v₁', ctlSlider('flFv', 0.3, 8, 0.05, st.v1)) +
          ctlRow('height change', ctlSlider('flFh', -3, 3, 0.05, st.dh))) +
      `<p class="help"><b>Continuity</b> is conservation of volume for an incompressible fluid: whatever
      goes in must come out, so <b>A₁v₁ = A₂v₂</b>. Narrow the pipe and the fluid must speed up — there is
      nowhere else for it to go.</p>
      <p class="help"><b>Bernoulli</b> is conservation of energy per unit volume:
      <b>P + ½ρv² + ρgh</b> is the same all along a streamline. Since the narrow section is faster, its
      dynamic term is larger, so its <b>pressure must be lower</b> — which is the result everyone finds
      backwards, and the stacked bars below make it hard to dispute.</p>
      <p class="help">This is why a shower curtain is sucked inwards, why two ships sailing abreast are
      drawn together, and how a carburettor and an aircraft wing work. It is <i>not</i> the whole story for
      a wing — Bernoulli holds along a streamline and says nothing about which streamlines exist — but the
      pressure difference it describes is real.</p>`;
  },
  wire(){
    ctWireSeg('flFm', v => { ST.own = (v === 'own'); });
    if(ST.own){
      fnWire('flFA', (m, s) => { ST.Asrc = s; });
      wireSlider('flFp', () => ST.P1, v => { ST.P1 = v; }, v => fmtNum(+v / 1000, 4) + ' kPa');
    } else {
      wireSlider('flFa1', () => ST.A1, v => { ST.A1 = v; }, v => fmtNum(+v * 1e4, 4) + ' cm²');
      wireSlider('flFa2', () => ST.A2, v => { ST.A2 = v; }, v => fmtNum(+v * 1e4, 4) + ' cm²');
      wireSlider('flFh', () => ST.dh, v => { ST.dh = v; }, v => fmtNum(+v, 3) + ' m');
    }
    wireSlider('flFv', () => ST.v1, v => { ST.v1 = v; }, v => fmtNum(+v, 3) + ' m/s');
  },
  /* the reader's pipe, and both routes to its pressure */
  pipe(st){
    if(st._pk === st.Asrc + '|' + st.v1 + '|' + st.P1) return st._pd;
    st._pk = st.Asrc + '|' + st.v1 + '|' + st.P1;
    const g = pkCompile(st.Asrc);
    /* an area must be positive: a formula that dips to zero would divide by it */
    const A = x => { const v = g(x, 0, 0); return Number.isFinite(v) && v > 1e-5 ? v : 1e-5; };
    st._pd = { A, run:flPipeRun(FL_RHO_WATER, A, () => 0, st.v1, st.P1, 3, 400) };
    return st._pd;
  },
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.flFlow.pipe(st), R = D.run;
    let rmax = 1e-6;
    for(const r of R.rows) rmax = Math.max(rmax, Math.sqrt(r.A / Math.PI));
    /* the pipe, drawn as its own radius profile */
    const hp = (H - 168) * 0.46;
    const P = mkPlot(74, 44, W - 140, hp, 0, 3, -rmax * 1.3, rmax * 1.3);
    plotFrame(ctx, P, '', 'radius (m)', 'the pipe you shaped — A(x), drawn as its radius');
    const top = R.rows.map(r => ({ x:r.x, y:Math.sqrt(r.A / Math.PI) }));
    const bot = R.rows.map(r => ({ x:r.x, y:-Math.sqrt(r.A / Math.PI) }));
    ctFill(ctx, P, top.concat(bot.slice().reverse()), rgbCss(TH.neg, 0.20));
    ctPath(ctx, P, top, rgbCss(TH.neg), 2.2);
    ctPath(ctx, P, bot, rgbCss(TH.neg), 2.2);
    /* speed and pressure below, on their own axes */
    const P2 = mkPlot(74, 44 + hp + 52, W - 140, H - (44 + hp + 52) - 62, 0, 3,
                      Math.min(0, R.minP) * 1.05, Math.max(st.P1, 0) * 1.12);
    plotFrame(ctx, P2, 'distance along the pipe (m)', 'pressure (Pa)',
              'pressure by two routes — the constant, and the differential equation integrated');
    ctGrid(ctx, P2);
    ctPath(ctx, P2, R.rows.map(r => ({ x:r.x, y:r.P })), rgbCss(TH.grad), 3);
    ctPath(ctx, P2, R.rows.map(r => ({ x:r.x, y:r.Pe })), rgbCss(TH.warn), 1.8, [6, 4]);
    if(R.cavitates){
      ctPath(ctx, P2, [{ x:0, y:FL_P_VAPOUR }, { x:3, y:FL_P_VAPOUR }], rgbCss(TH.neg), 1.6, [4, 3]);
      ctText(ctx, P2.X(0.05), P2.Y(FL_P_VAPOUR) - 6, 'vapour pressure — below this the water boils',
             rgbCss(TH.neg), '11px ' + FONT_UI);
    }
    stageNote(ctx, 'solid green is Bernoulli evaluated; dashed amber is Euler integrated from the inlet — they lie on top of each other, and that agreement is the theorem', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.flFlow.frameOwn(st, dt, ctx, W, H);
    st.t += dt;
    const rho = FL_RHO_WATER;
    const v2 = flContinuity(st.A1, st.v1, st.A2);
    const B = flBernoulli(rho, st.P1, st.v1, 0, v2, st.dh);
    const r1 = Math.sqrt(st.A1 / Math.PI), r2 = Math.sqrt(st.A2 / Math.PI);
    const hp = (H - 168) * 0.52;
    const P = ctBox(W, hp + 50, 0, 0, 1.1, { t:44, b:12 });
    ctFrame(ctx, P, 'the pipe — narrow means fast means low pressure');
    const prof = x => {
      const t = Math.max(0, Math.min(1, (x + 0.55) / 1.1));
      const s = 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, (t - 0.3) / 0.4)));
      return r1 + (r2 - r1) * s;
    };
    const hOf = x => st.dh * Math.max(0, Math.min(1, (x + 0.55) / 1.1)) * 0.12;
    ctFill(ctx, P, ctSample(x => ({ x, y:hOf(x) + prof(x) * 6 }), -0.55, 0.55, 80)
      .concat(ctSample(x => ({ x, y:hOf(x) - prof(x) * 6 }), 0.55, -0.55, 80)), rgbCss(TH.grad, 0.18));
    ctParam(ctx, P, x => ({ x, y:hOf(x) + prof(x) * 6 }), -0.55, 0.55, 120, rgbCss(TH.faint), 2.4);
    ctParam(ctx, P, x => ({ x, y:hOf(x) - prof(x) * 6 }), -0.55, 0.55, 120, rgbCss(TH.faint), 2.4);
    /* streamline tracers, moving at the local speed */
    for(let k = 0; k < 7; k++){
      const frac = (k / 7);
      for(let j = 0; j < 6; j++){
        let x = -0.55 + ((st.t * 0.28 + j / 6 + k * 0.013) % 1) * 1.1;
        const y = hOf(x) + (frac - 0.5) * 2 * prof(x) * 5.4;
        ctDot(ctx, P, x, y, 2.6, rgbCss(TH.curl, 0.85));
      }
    }
    const s = 0.09;
    ctArrow(ctx, P, -0.42, hOf(-0.42), -0.42 + st.v1 * s, hOf(-0.42), rgbCss(TH.warn), 2.6, null);
    ctArrow(ctx, P, 0.28, hOf(0.28), 0.28 + v2 * s, hOf(0.28), rgbCss(TH.warn), 2.6, null);
    /* the energy bars at the two stations */
    const Q = mkPlot(96, 44 + hp + 46, W - 156, H - 168 - hp, 0, 2, 0, B.e1.total * 1.15);
    plotFrame(ctx, Q, '', 'Pa', 'P + ½ρv² + ρgh — the same total at both stations');
    const stations = [{ x:0.5, e:B.e1, lab:'wide' }, { x:1.5, e:B.e2, lab:'narrow' }];
    for(const s2 of stations){
      let acc = 0;
      for(const [val, col, nm] of [[s2.e.P, TH.grad, 'P'], [s2.e.dyn, TH.curl, '½ρv²'], [s2.e.grav, TH.pos, 'ρgh']]){
        if(Math.abs(val) < 1e-9) continue;
        ctx.fillStyle = rgbCss(col, 0.78);
        ctx.fillRect(Q.X(s2.x - 0.3), Q.Y(acc + val), Q.X(s2.x + 0.3) - Q.X(s2.x - 0.3), Q.Y(acc) - Q.Y(acc + val));
        acc += val;
      }
      ctText(ctx, Q.X(s2.x), Q.Y(0) + 14, s2.lab, rgbCss(TH.faint), '11px ' + FONT_UI, 'center');
    }
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(Q.px, Q.Y(B.e1.total)); ctx.lineTo(Q.px + Q.pw, Q.Y(B.e1.total)); ctx.stroke();
    ctx.setLineDash([]);
    stageNote(ctx, 'green: static pressure · purple: dynamic · the total is flat, so one rises as the other falls', W, H);
  },
  readout(st){
    if(st.own){
      const D = STAGES.flFlow.pipe(st), R = D.run;
      const th = R.rows.reduce((m, r) => (r.A < m.A ? r : m), R.rows[0]);
      return `<div class="card tight"><div class="ttl">Your pipe</div>
        ${kv('A(x)', pkPretty(st.Asrc))}
        ${kv('volume flow Q = A·v', fmtNum(R.Q * 1000, 5) + ' litres/s')}
        ${kv('narrowest area', fmtNum(R.minA * 1e4, 5) + ' cm², at x = ' + fmtNum(th.x, 3) + ' m')}
        ${kv('fastest flow there', fmtNum(R.maxV, 5) + ' m/s')}
        ${kv('lowest pressure', fmtNum(R.minP / 1000, 5) + ' kPa')}
      </div>
      <div class="card tight"><div class="ttl">Bernoulli, checked against Euler</div>
        ${kv('largest gap between the routes', fmtGap(R.gap, Math.abs(R.P0), 'Pa'))}
        ${kv('verdict', R.rel < 1e-5 ? '✓ the two agree — Bernoulli is the integral of Euler'
                                      : 'the RK4 step is struggling on a profile this sharp')}
        <p class="help">The green curve is <b>P + ½ρv² = constant</b>, evaluated. The dashed one is
        <b>dP/dx = −ρv·dv/dx</b> integrated forward from the inlet by Runge–Kutta, which never uses the
        constant. Nothing links them, so the gap above is Bernoulli's status as a first integral being
        <i>verified on your pipe</i> rather than quoted. Make the throat sharper and watch the gap grow —
        that is the integrator meeting a derivative it cannot resolve, not the physics failing.</p>
      </div>
      <div class="card tight"><div class="ttl">${R.cavitates ? 'This pipe cavitates' : 'No cavitation'}</div>
        ${kv('lowest pressure', fmtNum(R.minP / 1000, 5) + ' kPa')}
        ${kv('vapour pressure of water at 20 °C', fmtNum(FL_P_VAPOUR / 1000, 4) + ' kPa')}
        <p class="help">${R.cavitates
          ? 'The pressure at the throat has fallen below the pressure at which water boils, so it <b>does</b> — vapour bubbles form, sweep downstream into higher pressure, and collapse. The collapse is violent enough to erode steel, which is why ship propellers and pump impellers are designed around this number. Everything the panel prints downstream of the throat describes a liquid that is no longer entirely liquid.'
          : 'The pressure stays above the boiling point everywhere, so the incompressible model holds all the way along. Narrow the throat and watch that stop being true: the pressure has no floor in the algebra, but water has one.'}</p>
      </div>`;
    }
    const rho = FL_RHO_WATER;
    const v2 = flContinuity(st.A1, st.v1, st.A2);
    const B = flBernoulli(rho, st.P1, st.v1, 0, v2, st.dh);
    const Q1 = flFlowRate(st.A1, st.v1);
    const Re = flReynolds(rho, st.v1, 2 * Math.sqrt(st.A1 / Math.PI), 1e-3);
    return `<div class="card tight"><div class="ttl">Continuity</div>
      ${kv('A₁', fmtNum(st.A1 * 1e4, 5) + ' cm²')}${kv('v₁', fmtNum(st.v1, 5) + ' m/s')}
      ${kv('A₂', fmtNum(st.A2 * 1e4, 5) + ' cm²')}${kv('v₂ = A₁v₁/A₂', fmtNum(v2, 5) + ' m/s')}
      ${kv('area ratio', fmtNum(st.A1 / st.A2, 5))}
      ${kv('speed ratio', fmtNum(v2 / st.v1, 5))}
      ${kv('volume flow rate', fmtNum(Q1 * 1000, 5) + ' L/s')}
      ${kv('and at the narrow end', fmtNum(flFlowRate(st.A2, v2) * 1000, 5) + ' L/s')}
    </div>
    <div class="card tight"><div class="ttl">Bernoulli, term by term</div>
      ${kv('P₁', fmtNum(B.e1.P, 6) + ' Pa')}
      ${kv('½ρv₁²', fmtNum(B.e1.dyn, 6) + ' Pa')}
      ${kv('ρgh₁', fmtNum(B.e1.grav, 6) + ' Pa')}
      ${kv('total', fmtNum(B.e1.total, 7) + ' Pa')}
      ${kv('P₂', fmtNum(B.e2.P, 6) + ' Pa')}
      ${kv('½ρv₂²', fmtNum(B.e2.dyn, 6) + ' Pa')}
      ${kv('ρgh₂', fmtNum(B.e2.grav, 6) + ' Pa')}
      ${kv('total', fmtNum(B.e2.total, 7) + ' Pa')}
      ${kv('difference between the totals', fmtAgree(B.e1.total, B.e2.total))}
      ${kv('pressure drop', fmtNum(B.e1.P - B.e2.P, 6) + ' Pa')}
      <p class="help">The two totals agree to rounding, which is the theorem. The static pressure falls
      exactly as much as the dynamic pressure rises — energy has not gone anywhere, it has changed form.</p>
    </div>
    <div class="card tight"><div class="ttl">Is any of this trustworthy?</div>
      ${kv('Reynolds number', fmtNum(Re.Re, 5))}
      ${kv('regime', Re.regime)}
      ${kv('Torricelli: a hole 2 m down jets at', fmtNum(flTorricelli(2).v, 5) + ' m/s')}
      ${kv('the speed of a 2 m free fall', fmtNum(Math.sqrt(2 * DY_G * 2), 5) + ' m/s')}
      <p class="help">Bernoulli assumes steady, incompressible, <b>inviscid</b> flow along a streamline. At
      high Reynolds number the flow turns turbulent, streamlines stop being well defined, and the equation
      stops being a useful statement — though the qualitative pressure-speed trade survives.</p>
      <p class="help">Torricelli's result is Bernoulli between the free surface and a hole, both at
      atmospheric pressure: the fluid emerges at exactly the speed it would have reached by falling. The
      two rows above agree, which is the derivation checking itself.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const R = STAGES.flFlow.pipe(st).run;
      return `<div class="k">your pipe</div>
        <div style="color:var(--c-warn)">fastest ${fmtNum(R.maxV, 4)} m/s</div>
        <div style="color:${R.cavitates ? 'var(--c-neg)' : 'var(--c-grad)'}">${R.cavitates ? 'cavitating' : 'P_min = ' + fmtNum(R.minP / 1000, 4) + ' kPa'}</div>`;
    }
    const v2 = flContinuity(st.A1, st.v1, st.A2);
    const B = flBernoulli(FL_RHO_WATER, st.P1, st.v1, 0, v2, st.dh);
    return `<div class="k">narrow section</div>
      <div style="color:var(--c-warn)">v₂ = ${fmtNum(v2, 5)} m/s</div>
      <div style="color:var(--c-grad)">P₂ = ${fmtNum(B.e2.P / 1000, 5)} kPa</div>`;
  },
  legend(){ return [['var(--c-grad)', 'static pressure'], ['var(--c-curl)', 'dynamic pressure, and the flow'],
                    ['var(--c-pos)', 'gravitational term'], ['var(--c-warn)', 'the total, and the speeds']]; },
  dockLegend:true
};

/* ---- 3 · thermodynamics: the gas and its processes ------------------------ */
