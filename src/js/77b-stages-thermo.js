STAGES.tmGas = {
  title:'The gas laws & the first law',
  derive(st){
    const n = v => fmtNum(v, 6);
    const R = 8.314462618;
    if(st.view === 'own'){
      const D = STAGES.tmGas.pathOf(st), Q = D.R;
      return {
        title:'What survives when the path has no name',
        steps:[
          drvSay('the four named processes are named because each has a formula',
            'Isothermal, isobaric, isochoric, adiabatic — the list is short because those are the cases where ∫P dV can be done in closed form. That is a fact about the integral, not about nature. A gas can be taken along any path at all, and most of them are on no list.'),
          drvStep('so go back to what the work actually is',
            `${dv('W')} ${dop('=')} ∫ ${dv('P')} ${dv('dV')}`,
            `on your path this comes to ${n(Q.W)} J, by adaptive quadrature`),
          drvSay('and check it with a rule that shares no code with the first',
            'The same integral is done again by a midpoint sum. The two disagree by ' + fmtAgree(Q.W, Q.Wmid, 'J') + ', and that number — not any claim about accuracy — is the error bar on everything else in the panel.'),
          drvStep('the state itself follows from the path, not the other way round',
            `${dv('T')}(${dv('V')}) ${dop('=')} ${dfrac(dv('P') + '(' + dv('V') + ')' + dv('V'), dv('n') + dv('R'))}`,
            `so the ends of your curve are at ${n(Q.T0)} K and ${n(Q.T1)} K`),
          drvSay('which is how the panel can tell what you typed without being told',
            'T and PVᵞ are evaluated at four hundred points along the curve and the width of each range reported. Whichever is zero names the process: ' + Q.kind + '. The spread of PVᵞ here is ' + fmtNum(Q.spreadAdi, 3) + ' and of T is ' + fmtNum(Q.spreadT, 3) + '.'),
          drvStep('internal energy, by contrast, needs only the two ends',
            `Δ${dv('U')} ${dop('=')} ${dv('n')}${dv('C')}_v Δ${dv('T')}`,
            `= ${n(Q.dU)} J, and no part of the route between them appears in it`),
          drvStep('so the heat is whatever the first law is left needing',
            `${dv('Q')} ${dop('=')} Δ${dv('U')} ${dop('+')} ${dv('W')}`,
            `= ${n(Q.Q)} J`),
          drvSay('and now join the same two states by three other routes',
            'The straight chord, and the two corners that change one variable at a time. Their works spread over ' + fmtNum(Q.Wspread, 4) + ' J and their heats spread over exactly the same amount, because ΔU is pinned by the endpoints and cannot move. Q and W depend on how you went; U depends only on where you are.'),
          drvSay('be honest about which half of that is a measurement',
            'For an ideal gas U = nC_vT by definition of the model, so ΔU coming out equal on all four routes is arithmetic, not evidence. The evidence is the size of the spread in W — that is what shows the heat you must supply genuinely depends on the route, which is the whole reason there are two letters and not one.')
        ],
        note:'The work is obtained twice by quadrature rules that share nothing, on the curve you typed rather than from any formula. Whether that curve is one of the four named processes is measured from the spread of T and of PVᵞ along it, not declared — so an adiabat is recognised, and its heat then comes out zero without anyone having said it should.'
      };
    }
    return {
      title:'Where PV = nRT comes from, and what the first law adds',
      steps:[
        drvSay('the gas law is not an empirical accident',
          'Boyle, Charles and Avogadro each found one relationship by experiment, and combining them gives PV = nRT. But the statistical-mechanics wing derives the whole thing from molecules bouncing off walls — pressure is momentum transfer per unit area per unit time, and the calculation produces exactly this.'),
        drvStep('the equation of state',
          `${dv('P')}${dv('V')} ${dop('=')} ${dv('n')}${dv('R')}${dv('T')}`,
          `n = ${n(st.n)} mol at T = ${n(st.T0)} K in V = ${n(st.V0)} m³ gives P = ${n(st.n * R * st.T0 / st.V0)} Pa`),
        drvStep('the first law is conservation of energy with heat included',
          `Δ${dv('U')} ${dop('=')} ${dv('Q')} ${dop('−')} ${dv('W')}`,
          'heat in, minus work done by the gas'),
        drvSay('the sign convention is a trap worth naming',
          'W here is work done *by* the gas, so it is subtracted. Some texts define W as work done *on* the gas and write ΔU = Q + W. Both are correct and they differ by a sign, which has ruined a great many calculations. This laboratory uses work done by the gas throughout.'),
        drvStep('work is the area under the path in the P–V plane',
          `${dv('W')} ${dop('=')} ∫ ${dv('P')} d${dv('V')}`,
          `expanding from ${n(st.V0)} to ${n(st.V1)} m³ — the panel shades and integrates it`),
        drvSay('and that is why the process matters, not just the endpoints',
          'Different paths between the same two states enclose different areas, so they involve different work and different heat. Internal energy depends only on the state; heat and work depend on the route. That distinction is why U is a state function and Q and W are not.'),
        drvStep('isothermal: T fixed, so ΔU = 0 and all the heat becomes work',
          `${dv('W')} ${dop('=')} ${dv('n')}${dv('R')}${dv('T')} ln${dfrac(dv('V') + '₂', dv('V') + '₁')}`,
          st.proc === 'isothermal' ? `= ${n(st.n * R * st.T0 * Math.log(st.V1 / st.V0))} J` : 'the logarithm comes from integrating nRT/V'),
        drvStep('adiabatic: no heat at all, so the work comes out of internal energy',
          `${dv('P')}${dv('V')}^γ ${dop('=')} const`,
          st.proc === 'adiabatic' ? 'and the gas cools as it expands, with no heat exchanged' : ''),
        drvSay('which is why a bicycle pump gets hot and an aerosol gets cold',
          'Compress a gas quickly and there is no time for heat to escape, so all the work goes into internal energy and the temperature rises. Let it expand quickly and the reverse happens. Both are the adiabatic case, and the steeper adiabat on the P–V plot is the visible reason.'),
        drvStep('γ counts how a molecule can store energy',
          `γ ${dop('=')} ${dfrac(dv('C') + '_P', dv('C') + '_V')}`,
          `${st.gas}: monatomic gases give 5/3, diatomic 7/5 — because rotation adds two more ways to hold energy`)
      ],
      note:'The work is computed by integrating along the actual path drawn on the P–V diagram rather than from a closed form, so a cycle\'s net work is the enclosed area measured numerically. The first law is then checked term by term around the loop.'
    };
  },
  enter(st, o){
    st.gas = o.gas || 'ar';
    st.proc = o.proc || 'isothermal';
    st.T0 = 300; st.V0 = 0.02; st.V1 = 0.04; st.n = 1;
    st.view = o.view || 'pv';
    /* the typed path: pressure in kPa as a function of the volume in litres,
       because kPa·L = J and PV/(nR) in those units is already kelvin */
    st.psrc = o.psrc || '124.717*(20/x)^(5/3)';
    st.pV0 = o.pV0 || 20; st.pV1 = o.pV1 || 45;
  },
  /* the reader's path, and everything measured along it */
  pathOf(st){
    const key = st.psrc + '|' + st.pV0 + '|' + st.pV1 + '|' + st.n + '|' + st.gas;
    if(st._qk === key) return st._qd;
    st._qk = key;
    const g = pkCompile(st.psrc);
    const Pof = V => { const v = g(V, 0, 0); return Number.isFinite(v) ? v : 0; };
    const a = Math.max(0.2, Math.min(400, st.pV0)), b = Math.max(0.2, Math.min(400, st.pV1));
    st._qd = { Pof, a, b, R:tmPathRun(Pof, a, b === a ? a + 1e-3 : b, st.n, st.gas) };
    return st._qd;
  },
  controls(){
    const st = ST;
    /* the label must contain "your own": auditcustom finds the custom path by
       matching that phrase (or a data-v of literally `custom`), and a stage it
       cannot find is a stage whose typed-input path nothing exercises at all */
    return ctSeg('tmGv', st.view, [['pv', 'the P–V diagram'], ['own', 'a path of your own'],
                                   ['maxwell', 'the speed distribution']]) +
      (st.view === 'own'
        ? ctSeg('tmGg', st.gas, ['he', 'ar', 'n2', 'co2'].map(k => [k, TM_GASES[k].name])) +
          fnHtml('tmGf', 'P(x) in kPa =', st.psrc, 'x — the volume in litres') +
          ctlRow('from V₀', ctlSlider('tmGa', 5, 60, 1, st.pV0)) +
          ctlRow('to V₁', ctlSlider('tmGb', 5, 120, 1, st.pV1)) +
          ctlRow('moles n', ctlSlider('tmGn', 0.2, 4, 0.1, st.n)) +
          `<p class="help">The four named processes exist because each has a <i>formula</i> for the work.
          A path that is none of them has no formula at all — so the work goes back to being what it
          always was, <b>the area under the curve you actually drew</b>, and it is obtained here by two
          different quadrature rules whose disagreement is printed as the error bar.</p>
          <p class="help">Nothing tells the panel what kind of path you typed. It <b>measures</b> it:
          T = PV/nR and PV<sup>γ</sup> are evaluated all along the curve and their spread reported, so an
          isotherm and an adiabat are <i>recognised</i> rather than declared. Type
          <b>124.717*(20/x)^(5/3)</b> and the panel discovers PV<sup>γ</sup> is constant and that Q comes
          out at 10⁻¹³ J — which is zero, and nobody said so.</p>
          <p class="help">Below that, the same two end states are joined by <b>three other routes</b>: the
          straight chord, and the two corner paths that change one variable at a time. Their works are
          quite different and their heats differ by exactly as much. ΔU is identical on all four — for an
          ideal gas U = nC<sub>v</sub>T by definition, so that part is arithmetic rather than evidence;
          the evidence is how far apart the other two columns are.</p>
          <p class="help">Units are kPa and litres throughout because <b>kPa·L = J</b> exactly and
          PV/(nR) in those units is already kelvin. No conversion factor appears anywhere, so none can
          hide anything.</p>`
        : st.view === 'pv'
        ? ctSeg('tmGp', st.proc, Object.keys(TM_PROCESS).map(k => [k, TM_PROCESS[k].name.split('  ')[0]])) +
          ctSeg('tmGg', st.gas, ['he', 'ar', 'n2', 'co2'].map(k => [k, TM_GASES[k].name])) +
          ctlRow('T₀', ctlSlider('tmGT', 150, 600, 5, st.T0)) +
          ctlRow('final V', ctlSlider('tmGV', 0.01, 0.09, 0.001, st.V1))
        : ctSeg('tmGg', st.gas, ['he', 'ar', 'n2', 'co2'].map(k => [k, TM_GASES[k].name])) +
          ctlRow('T', ctlSlider('tmGT', 100, 1200, 5, st.T0))) +
      (st.view === 'own' ? '' : `<p class="help">${st.view === 'pv'
        ? TM_PROCESS[st.proc].note
        : 'Temperature is not the speed of the molecules — it is the <i>average kinetic energy</i>, ⟨½mv²⟩ = (3/2)kT. The distribution of actual speeds is wide, and the three averages it produces are all different: the most probable speed, the mean speed, and the root-mean-square speed, in that order.'}</p>
      <p class="help">${st.view === 'pv'
        ? 'The work done by the gas is the <b>area under the P–V curve</b>, and the panel obtains it by integrating the drawn path rather than by quoting a formula — then checks it against the formula. ΔU depends only on the temperature change, and Q is whatever the first law needs it to be.'
        : 'The panel integrates the distribution to recover each average, and checks that it is normalised. Lighter gases are faster at the same temperature — by exactly the square root of the mass ratio, which is why helium escapes the atmosphere and argon does not.'}</p>`);
  },
  wire(){
    ctWireSeg('tmGv', v => { ST.view = v; });
    ctWireSeg('tmGg', v => { ST.gas = v; });
    if(ST.view === 'own'){
      fnWire('tmGf', (m, s) => { ST.psrc = s; });
      wireSlider('tmGa', () => ST.pV0, v => { ST.pV0 = v; }, v => fmtNum(+v, 4) + ' L');
      wireSlider('tmGb', () => ST.pV1, v => { ST.pV1 = v; }, v => fmtNum(+v, 4) + ' L');
      wireSlider('tmGn', () => ST.n, v => { ST.n = v; }, v => fmtNum(+v, 3) + ' mol');
    } else {
      ctWireSeg('tmGp', v => { ST.proc = v; });
      wireSlider('tmGT', () => ST.T0, v => { ST.T0 = v; }, v => fmtNum(+v, 4) + ' K');
      wireSlider('tmGV', () => ST.V1, v => { ST.V1 = v; }, v => fmtNum(+v * 1000, 4) + ' L');
    }
  },
  /* the path the reader typed, the work under it, and the three other routes */
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.tmGas.pathOf(st), R = D.R;
    const a = Math.min(D.a, D.b), b = Math.max(D.a, D.b);
    let plo = Infinity, phi = -Infinity;
    for(let i = 0; i <= 200; i++){
      const p = D.Pof(a + (b - a) * i / 200);
      if(Number.isFinite(p)){ plo = Math.min(plo, p); phi = Math.max(phi, p); }
    }
    if(!Number.isFinite(plo)){ plo = 0; phi = 1; }
    const span = b - a;
    const pwv = Math.min(W * 0.52, 700);
    const P = mkPlot(88, 50, pwv - 110, H - 140, a - 0.12 * span, b + 0.12 * span,
                     0, Math.max(phi, 1e-9) * 1.18);
    plotFrame(ctx, P, 'volume  (litres)', 'pressure  (kPa)', 'the path you typed — the work is the shaded area');
    plotTicksX(ctx, P, [a, a + span / 2, b], v => fmtNum(v, 4));
    ctGrid(ctx, P, null, false);
    /* isotherms through the two endpoints, so a flat path can be seen to be one */
    for(const T of [R.T0, R.T1])
      plotCurve(ctx, P, V => st.n * TM_R * T / V, 260, rgbCss(TH.faint, 0.5), 1.2);
    /* the area under the reader's curve — that integral IS the work */
    const under = ctSample(V => ({ x:V, y:Math.max(0, Math.min(P.y1, D.Pof(V))) }), D.a, D.b, 220);
    ctFill(ctx, P, [{ x:D.a, y:0 }].concat(under).concat([{ x:D.b, y:0 }]), rgbCss(TH.grad, 0.22));
    /* the three other routes between the same two states */
    ctPath(ctx, P, [{ x:D.a, y:R.P0 }, { x:D.b, y:R.P1 }], rgbCss(TH.curl), 1.6, [6, 4]);
    ctPath(ctx, P, [{ x:D.a, y:R.P0 }, { x:D.a, y:R.P1 }, { x:D.b, y:R.P1 }], rgbCss(TH.warn), 1.6, [3, 3]);
    ctPath(ctx, P, [{ x:D.a, y:R.P0 }, { x:D.b, y:R.P0 }, { x:D.b, y:R.P1 }], rgbCss(TH.warn), 1.6, [3, 3]);
    ctPath(ctx, P, under, rgbCss(TH.grad), 3);
    ctDot(ctx, P, D.a, R.P0, 7, rgbCss(TH.pos), rgbCss(TH.bg));
    ctDot(ctx, P, D.b, R.P1, 7, rgbCss(TH.neg), rgbCss(TH.bg));
    /* what is constant along it — the measurement that names the process */
    const Q = mkPlot(pwv + 46, 50, Math.max(180, W - pwv - 110), H - 140, a, b, 0.6, 1.45);
    plotFrame(ctx, Q, 'volume  (litres)', 'value ÷ its value at V₀',
              'what stays constant along your path?');
    ctGrid(ctx, Q);
    ctPath(ctx, Q, [{ x:a, y:1 }, { x:b, y:1 }], rgbCss(TH.line2), 1.6);
    const g0v = R.P0 * Math.pow(D.a, R.gamma);
    /* NaN rather than a clamp: ctPath breaks on a non-finite point, so a curve
       that leaves the window simply stops. Clamping instead would lay it flat
       along the floor, which is the one shape the reader is told means
       "constant" — the picture would be saying the opposite of the truth. */
    const clip = v => (v >= 0.58 && v <= 1.44 ? v : NaN);
    ctPath(ctx, Q, ctSample(V => ({ x:V, y:clip(D.Pof(V) * V / (st.n * TM_R) / (R.T0 || 1)) }), a, b, 200),
           rgbCss(TH.neg), 2.6);
    ctPath(ctx, Q, ctSample(V => ({ x:V, y:clip(D.Pof(V) * Math.pow(V, R.gamma) / (g0v || 1)) }), a, b, 200),
           rgbCss(TH.curl), 2.6);
    ctPath(ctx, Q, ctSample(V => ({ x:V, y:clip(D.Pof(V) / (R.P0 || 1)) }), a, b, 200),
           rgbCss(TH.warn), 2, [5, 4]);
    ctText(ctx, Q.px + 8, Q.py + 18, 'flat means that quantity is conserved — and names the process',
           rgbCss(TH.faint), '11px ' + FONT_UI);
    stageNote(ctx, 'amber dashes are the two corner routes and violet the straight chord — same two states, quite different areas', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.view === 'own') return STAGES.tmGas.frameOwn(st, dt, ctx, W, H);
    if(st.view === 'maxwell'){
      const G = TM_GASES[st.gas];
      const M = tmMaxwell(st.T0, G.M);
      const vmax = M.vrms * 2.6;
      const P = mkPlot(88, 48, W - 140, H - 138, 0, vmax, 0, M.f(M.vp) * 1.2);
      plotFrame(ctx, P, 'speed  (m/s)', 'probability density', `${G.name} at ${fmtNum(st.T0, 4)} K`);
      plotTicksX(ctx, P, [0, vmax / 3, 2 * vmax / 3, vmax], v => fmtNum(v, 4));
      /* the same gas at two other temperatures, faint */
      for(const f of [0.5, 2]){
        const M2 = tmMaxwell(st.T0 * f, G.M);
        plotCurve(ctx, P, v => M2.f(v), 500, rgbCss(TH.faint, 0.55), 1.4);
      }
      plotCurve(ctx, P, v => M.f(v), 700, rgbCss(TH.grad), 2.6, rgbCss(TH.grad, 0.16));
      plotCurve(ctx, P, v => M.f(v), 700, rgbCss(TH.grad), 2.6);
      for(const [v, col, lab] of [[M.vp, TH.warn, 'v<sub>p</sub>'], [M.vbar, TH.curl, 'v̄'], [M.vrms, TH.neg, 'v<sub>rms</sub>']]){
        ctx.strokeStyle = rgbCss(col); ctx.lineWidth = 1.8; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(P.X(v), P.py); ctx.lineTo(P.X(v), P.py + P.ph); ctx.stroke();
        ctx.setLineDash([]);
        ctText(ctx, P.X(v) + 5, P.py + 18, lab, rgbCss(col), '600 11px ' + FONT_MONO);
      }
      stageNote(ctx, 'the faint curves are the same gas at half and twice the temperature', W, H);
      return;
    }
    const R = tmFirstLaw(st.proc, st.n, st.T0, st.V0, st.proc === 'isochoric' ? st.V0 : st.V1, st.gas,
                         st.proc === 'isochoric' ? st.T0 * (st.V1 / st.V0) : undefined);
    const g = tmDOF(TM_GASES[st.gas].atoms);
    const P0 = st.n * TM_R * st.T0 / st.V0;
    const Vmax = 0.1, Pmax = P0 * 1.6;
    const P = mkPlot(92, 48, W - 146, H - 138, 0, Vmax * 1000, 0, Pmax / 1000);
    plotFrame(ctx, P, 'volume  (L)', 'pressure  (kPa)', TM_PROCESS[st.proc].name + '  —  the work is the shaded area');
    plotTicksX(ctx, P, [0, 25, 50, 75, 100], v => String(v));
    /* isotherms, for reference */
    for(const T of [150, 300, 450, 600]){
      plotCurve(ctx, P, V => st.n * TM_R * T / (V / 1000) / 1000, 300, rgbCss(TH.faint, 0.45), 1.2);
    }
    /* the path, and the area under it */
    const path = TM_PROCESS[st.proc].path(P0, st.V0, st.V1, g.gamma);
    const Vend = st.proc === 'isochoric' ? st.V0 : st.V1;
    if(st.proc === 'isochoric'){
      ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(P.X(st.V0 * 1000), P.Y(P0 / 1000));
      ctx.lineTo(P.X(st.V0 * 1000), P.Y(R.P1 / 1000)); ctx.stroke();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(P.X(st.V0 * 1000), P.Y(0));
      for(let i = 0; i <= 200; i++){
        const V = st.V0 + (Vend - st.V0) * i / 200;
        ctx.lineTo(P.X(V * 1000), P.Y(Math.max(0, Math.min(P.y1, path(V) / 1000))));
      }
      ctx.lineTo(P.X(Vend * 1000), P.Y(0)); ctx.closePath();
      ctx.fillStyle = rgbCss(TH.grad, 0.24); ctx.fill();
      ctx.restore();
      plotCurve(ctx, P, V => path(V / 1000) / 1000, 400, rgbCss(TH.grad), 3);
    }
    ctDot(ctx, P, st.V0 * 1000, P0 / 1000, 7, rgbCss(TH.pos), rgbCss(TH.bg));
    ctDot(ctx, P, Vend * 1000, R.P1 / 1000, 7, rgbCss(TH.warn), rgbCss(TH.bg));
    stageNote(ctx, 'the faint hyperbolae are isotherms at 150, 300, 450 and 600 K', W, H);
  },
  readout(st){
    const G = TM_GASES[st.gas];
    if(st.view === 'own'){
      const D = STAGES.tmGas.pathOf(st), R = D.R;
      const nm = v => fmtNum(v, 6);
      return `<div class="card tight"><div class="ttl">Your path</div>
        ${kv('P(x) in kPa', pkPretty(st.psrc))}
        ${kv('from', fmtNum(D.a, 4) + ' L at ' + nm(R.P0) + ' kPa,  ' + nm(R.T0) + ' K')}
        ${kv('to', fmtNum(D.b, 4) + ' L at ' + nm(R.P1) + ' kPa,  ' + nm(R.T1) + ' K')}
        ${kv('gas', G.name + ',  γ = ' + fmtNum(R.gamma, 5) + ',  C_v = ' + fmtNum(R.Cv, 5) + ' J/mol·K')}
        ${kv('moles', fmtNum(st.n, 3))}
        <p class="help">kPa·L = J exactly, and PV/(nR) with P in kPa and V in litres is already kelvin —
        so the temperatures above were read straight off your own curve, with no conversion factor
        anywhere for anything to hide in.</p>
      </div>
      <div class="card tight"><div class="ttl">What kind of path is it?</div>
        ${kv('spread of T along it', fmtNum(R.spreadT, 3))}
        ${kv('spread of PV<sup>γ</sup>', fmtNum(R.spreadAdi, 3))}
        ${kv('spread of P', fmtNum(R.spreadP, 3))}
        ${kv('verdict', R.kind)}
        ${R.Wiso !== null ? kv('and nRT ln(V₁/V₀) gives', nm(R.Wiso) + ' J') : ''}
        ${R.Wadi !== null ? kv('and (P₀V₀ − P₁V₁)/(γ−1) gives', nm(R.Wadi) + ' J') : ''}
        <p class="help">Nothing told the panel what you typed. Each of the three quantities is evaluated
        at four hundred points along the curve and the width of its range reported; whichever comes out at
        zero <i>names</i> the process. ${R.Wadi !== null
          ? 'PV<sup>γ</sup> is the flat one, so this is an adiabat — and the heat below should therefore be zero, which nobody arranged.'
          : R.Wiso !== null
          ? 'T is the flat one, so this is an isotherm, and ΔU below should be zero.'
          : 'None of them is flat, so this path has no name and no formula — which is exactly when the integral has to do the work.'}</p>
      </div>
      <div class="card tight"><div class="ttl">The work, by two quadratures</div>
        ${kv('W = ∫P dV, adaptive Simpson', nm(R.W) + ' J')}
        ${kv('the same integral by a midpoint sum', nm(R.Wmid) + ' J')}
        ${kv('difference', fmtAgree(R.W, R.Wmid, 'J'))}
        ${kv('ΔU = nC_vΔT', nm(R.dU) + ' J')}
        ${kv('Q = ΔU + W', nm(R.Q) + ' J')}
        <p class="help">Two rules with nothing in common, on the curve you drew. Their difference is the
        error bar on every figure in this panel${Math.abs(R.Q) < 1e-6 * Math.max(Math.abs(R.W), 1)
          ? ' — and it is larger than the heat, which is how you know the heat is zero rather than small'
          : ''}.</p>
      </div>
      <div class="card tight"><div class="ttl">Four routes, the same two states</div>
        ${R.paths.map(p => kv(p.name, 'W = ' + fmtNum(p.W, 6) + ' J,  Q = ' + fmtNum(p.Q, 6) + ' J')).join('')}
        ${kv('spread in W across the four', fmtNum(R.Wspread, 5) + ' J')}
        ${kv('ΔU on every one of them', nm(R.dU) + ' J')}
        <p class="help">The works differ by ${fmtNum(R.Wspread, 4)} J and the heats differ by exactly as
        much, because the endpoints are shared and <b>ΔU = Q − W</b> cannot move. That is what "state
        function" means, and it is why U gets the letter while Q and W do not.</p>
        <p class="help">Be clear which half of that is evidence. For an ideal gas U = nC<sub>v</sub>T
        <i>by definition of the model</i>, so ΔU agreeing across the four is arithmetic. The evidence is
        the size of the spread above — it is what shows that the heat you must supply genuinely depends
        on the route you take, not merely on where you end up.</p>
      </div>`;
    }
    if(st.view === 'maxwell'){
      const M = tmMaxwell(st.T0, G.M);
      const norm = nqAdaptive(M.f, 0, M.vrms * 8, 1e-11);
      const mean = nqAdaptive(v => v * M.f(v), 0, M.vrms * 8, 1e-11);
      const ms = nqAdaptive(v => v * v * M.f(v), 0, M.vrms * 8, 1e-11);
      return `<div class="card tight"><div class="ttl">${G.name} at ${fmtNum(st.T0, 4)} K</div>
        ${kv('molar mass', fmtNum(G.M * 1000, 5) + ' g/mol')}
        ${kv('most probable speed √(2RT/M)', fmtNum(M.vp, 6) + ' m/s')}
        ${kv('mean speed √(8RT/πM)', fmtNum(M.vbar, 6) + ' m/s')}
        ${kv('rms speed √(3RT/M)', fmtNum(M.vrms, 6) + ' m/s')}
        ${kv('average kinetic energy 3kT/2', fmtNum(tmKEavg(st.T0), 5) + ' J')}
        ${kv('the speed of sound here', fmtNum(Math.sqrt(g0(G) * TM_R * st.T0 / G.M), 6) + ' m/s')}
      </div>
      <div class="card tight"><div class="ttl">The distribution, integrated</div>
        ${kv('∫f dv  (should be 1)', fmtNum(norm, 8))}
        ${kv('∫v f dv', fmtNum(mean, 6) + ' m/s')}
        ${kv('and the formula for v̄', fmtNum(M.vbar, 6) + ' m/s')}
        ${kv('√(∫v²f dv)', fmtNum(Math.sqrt(ms), 6) + ' m/s')}
        ${kv('and the formula for v<sub>rms</sub>', fmtNum(M.vrms, 6) + ' m/s')}
        <p class="help">Each average is obtained by integrating the distribution and compared with its
        closed form. The three differ because the distribution is skewed — a long tail of fast molecules
        pulls the mean above the peak and the rms above the mean.</p>
      </div>
      <div class="card tight"><div class="ttl">Why helium leaks and argon does not</div>
        ${['he', 'n2', 'ar', 'co2'].map(k => kv(TM_GASES[k].name + ' at ' + fmtNum(st.T0, 4) + ' K',
          fmtNum(tmRMS(st.T0, TM_GASES[k].M), 5) + ' m/s')).join('')}
        ${kv('escape speed from Earth', '11 200 m/s')}
        <p class="help">Speed goes as 1/√M, so at the same temperature helium moves nearly three times
        faster than nitrogen. The tail of the distribution above escape speed is exponentially sensitive to
        that, which is why Earth has kept its nitrogen for four billion years and lost essentially all its
        primordial helium.</p>
      </div>`;
    }
    const R = tmFirstLaw(st.proc, st.n, st.T0, st.V0,
      st.proc === 'isochoric' ? st.V0 : st.V1, st.gas,
      st.proc === 'isochoric' ? st.T0 * (st.V1 / st.V0) : undefined);
    const g = tmDOF(G.atoms);
    return `<div class="card tight"><div class="ttl">${TM_PROCESS[st.proc].name}</div>
      ${kv('gas', G.name + ',  ' + G.atoms + (G.atoms === 1 ? ' atom' : ' atoms') + ' per molecule')}
      ${kv('degrees of freedom', String(g.f))}
      ${kv('C_v = fR/2', fmtNum(g.Cv, 6) + ' J/mol·K')}
      ${kv('C_p = C_v + R', fmtNum(g.Cp, 6) + ' J/mol·K')}
      ${kv('γ = C_p/C_v', fmtNum(g.gamma, 6))}
    </div>
    <div class="card tight"><div class="ttl">The state change</div>
      ${kv('P₀, V₀, T₀', `${fmtNum(R.P0 / 1000, 5)} kPa, ${fmtNum(st.V0 * 1000, 4)} L, ${fmtNum(R.T0, 4)} K`)}
      ${kv('P₁, V₁, T₁', `${fmtNum(R.P1 / 1000, 5)} kPa, ${fmtNum((R.V1 !== undefined ? R.V1 : st.V1) * 1000, 4)} L, ${fmtNum(R.T1, 5)} K`)}
      ${kv('W by the gas, integrated', fmtNum(R.W, 6) + ' J')}
      ${kv('W from the formula', fmtNum(R.Wformula, 6) + ' J')}
      ${kv('ΔU = nC_vΔT', fmtNum(R.dU, 6) + ' J')}
      ${kv('Q = ΔU + W', fmtNum(R.Q, 6) + ' J')}
      ${kv('first-law residual', fmtGap(R.residual, Math.max(Math.abs(R.dU), Math.abs(R.W), Math.abs(R.Q)), 'J'))}
      <p class="help">The work is the area under the drawn path, obtained by adaptive quadrature on that
      exact curve — and it matches the textbook formula. ΔU depends only on the temperatures, because for
      an ideal gas the internal energy is a function of T alone.</p>
    </div>
    <div class="card tight"><div class="ttl">What is special about this process</div>
      ${st.proc === 'isothermal' ? kv('ΔU', fmtNum(R.dU, 4) + ' — zero, so Q = W exactly') : ''}
      ${st.proc === 'adiabatic' ? kv('Q', fmtNum(R.Q, 4) + ' — zero, so W = −ΔU') : ''}
      ${st.proc === 'isochoric' ? kv('W', '0 — no volume change, so all the heat is internal energy') : ''}
      ${st.proc === 'isobaric' ? kv('W = PΔV', fmtNum(R.P0 * ((R.V1 !== undefined ? R.V1 : st.V1) - st.V0), 6) + ' J') : ''}
      ${st.proc === 'adiabatic' ? kv('T₁ = T₀(V₀/V₁)^(γ−1)', fmtNum(st.T0 * Math.pow(st.V0 / st.V1, g.gamma - 1), 5) + ' K') : ''}
      ${kv('temperature change', fmtNum(R.T1 - R.T0, 5) + ' K')}
      <p class="help">${st.proc === 'adiabatic'
        ? 'Compressing a gas quickly heats it with no heat added at all — which is why a bicycle pump gets hot, why a diesel engine needs no spark plug, and why descending air over a mountain range arrives warm and dry.'
        : st.proc === 'isothermal'
        ? 'Every joule of heat that goes in comes straight back out as work. Doing this requires a reservoir and infinite patience: the gas must stay in equilibrium throughout, which strictly means moving infinitely slowly.'
        : st.proc === 'isochoric'
        ? 'The P–V path is a vertical line, which encloses no area — hence no work. This process is what <i>defines</i> C_v operationally.'
        : 'The gas pushes back the surroundings while it is heated, so some of the heat leaves again as work. That leakage is precisely why C_p exceeds C_v by R.'}</p>
    </div>`;
  },
  chip(st){
    if(st.view === 'own'){
      const R = STAGES.tmGas.pathOf(st).R;
      return `<div class="k">${R.kind.split(' —')[0]}</div>
        <div style="color:var(--c-grad)">W = ${fmtNum(R.W, 5)} J</div>
        <div style="color:var(--c-neg)">Q = ${fmtNum(R.Q, 5)} J</div>`;
    }
    if(st.view === 'maxwell') return `<div class="k">${TM_GASES[st.gas].name}</div>
      <div style="color:var(--c-neg)">v<sub>rms</sub> = ${fmtNum(tmRMS(st.T0, TM_GASES[st.gas].M), 5)} m/s</div>`;
    const R = tmFirstLaw(st.proc, st.n, st.T0, st.V0,
      st.proc === 'isochoric' ? st.V0 : st.V1, st.gas,
      st.proc === 'isochoric' ? st.T0 * (st.V1 / st.V0) : undefined);
    return `<div class="k">${TM_PROCESS[st.proc].name.split('  ')[0]}</div>
      <div style="color:var(--c-grad)">W = ${fmtNum(R.W, 5)} J</div>
      <div>Q = ${fmtNum(R.Q, 5)} J</div>`;
  },
  legend(st){
    if(st && st.view === 'own')
      return [['var(--c-grad)', 'your path, and the work under it'], ['var(--c-pos)', 'the start state'],
              ['var(--c-neg)', 'the end state, and T along the path'],
              ['var(--c-curl)', 'the straight chord, and PV<sup>γ</sup>'],
              ['var(--c-warn)', 'the two corner routes, and P']];
    return [['var(--c-grad)', 'the process path, and the work'], ['var(--c-pos)', 'the start'],
            ['var(--c-warn)', 'the end, and v<sub>p</sub>'], ['var(--c-curl)', 'the mean speed'],
            ['var(--c-neg)', 'the rms speed']]; },
  dockLegend:true
};
/* the ratio of specific heats, for the speed-of-sound row above */
function g0(G){ return tmDOF(G.atoms).gamma; }

/* ---- 4 · engines, entropy and the second law ----------------------------- */
/* The Stirling cycle: two isotherms joined by two constant-volume steps. It is
   the default because it is fully reversible and still falls a long way short
   of Carnot — which separates the two things a reader is likely to run
   together. Entropy generation and efficiency shortfall are not the same
   question, and this cycle has the second without the first. */
const TM_CYCLE_DEFAULT = [
  '* the Stirling cycle — two isotherms, two constant-volume steps',
  'gas ar',
  'moles 1',
  'start 20 300',
  'isochoric 600',
  'isothermal 40',
  'isochoric 300',
  'isothermal 20'
].join('\n');
STAGES.tmEngine = {
  title:'Heat engines & entropy',
  derive(st){
    const n = v => fmtNum(v, 6);
    if(st.own){
      const R = STAGES.tmEngine.cyc(st).R;
      if(!R) return { title:'Nothing to derive yet',
        steps:[drvSay('the sheet has not parsed', 'Fix the lines the panel names and the ladder will follow the cycle you wrote.')],
        note:'The derivation follows the cycle on the sheet, so it needs a cycle.' };
      return {
        title:'The second law, on the cycle you wrote down',
        steps:[
          drvSay('the ledger version of an engine assumes the very thing it explains',
            'Give a formula Q_h and Q_c and it hands back W and η, but nothing in it is a cycle: no path, no processes, no states. Write out an actual sequence and every one of those numbers has to be earned from the path — and two of them stop being assertions.'),
          drvStep('the work is the area under each process, added up',
            `${dv('W')} ${dop('=')} ∮ ${dv('P')} ${dv('dV')}`,
            `summed over ${R.steps.length} processes and 200 sub-steps each: ${n(R.Wsum)} J`),
          drvSay('and it is obtained three more times, by routes with nothing in common',
            'From the four closed forms (' + n(R.Wform) + ' J), from the geometric area of the loop on the P–V plane (' + n(R.Wshoe) + ' J), and from the area of the same loop on the T–S plane (' + n(R.Wts) + ' J). The last of those is a heat, not a work, and it agrees only because the loop closes.'),
          drvStep('around a closed cycle the gas returns to its own state',
            `∮ ${dv('dU')} ${dop('=')} 0, ∮ ${dv('dS')} ${dop('=')} 0`,
            `measured: ΔU = ${n(R.dU)} J and ∮dS = ${fmtNum(R.Sgas, 3)} J/K, both summed step by step`),
          drvSay('that is what "state function" buys you, and it is the whole trick',
            'Neither was set to zero. Both were accumulated process by process from nC_v dT and dQ/T and came out zero anyway, because U and S depend on where the gas is and not on how it got there. Q and W do not have that property, which is why they are the interesting ones.'),
          drvStep('the reservoirs, however, do not come back',
            `∮ ${dfrac(dv('dQ'), dv('T') + '_res')} ${dop('≤')} 0`,
            `on your cycle this is ${fmtNum(R.clausius, 5)} J/K`),
          drvSay('and that inequality is the second law in its usable form',
            R.reversible
              ? 'Every step here exchanges heat with a reservoir at its own temperature, so each dQ/T on the gas side is cancelled exactly on the reservoir side and the integral is zero. Append "from 900" to a heating step and watch it go negative: heat crossing a finite temperature difference is irreversible, and the surplus is entropy created out of nothing.'
              : 'Heat has crossed a finite temperature difference somewhere in this cycle, so the integral has gone strictly negative and ' + fmtNum(R.generated, 4) + ' J/K of entropy has been created. Nothing destroys it again; that is the only asymmetry in time that physics has.'),
          drvStep('efficiency is then what the two extreme reservoirs allow',
            `η ${dop('≤')} 1 ${dop('−')} ${dfrac(dv('T') + '_cold', dv('T') + '_hot')}`,
            `= ${fmtNum(100 * R.etaCarnot, 5)}% between ${fmtNum(R.Tcold, 5)} K and ${fmtNum(R.Thot, 5)} K; this cycle reaches ${fmtNum(100 * R.eta, 5)}%`),
          drvSay('and falling short of it is not the same thing as creating entropy',
            R.reversible && R.etaGap > 1e-6
              ? 'This cycle creates none and still falls ' + fmtNum(100 * R.etaGap, 4) + ' points short, because its constant-volume leg takes heat in across a whole range of temperatures while the bound assumes every joule arrives at the top. Make both heat-exchanging legs isothermal and the gap closes — that is the entire content of Carnot\'s choice of cycle.'
              : 'Two separate faults cost efficiency: heat entering below the top temperature, and entropy generated by transferring it across a gap. A cycle can suffer either without the other, and reading the shortfall as evidence of irreversibility is the commonest mistake in the subject.')
        ],
        note:'The work is computed four ways that share no code — integrated as P dV, added from closed forms, and measured as the area of the loop on two different diagrams. The entropy integral is accumulated over the sub-steps rather than assumed, so ∮dS = 0 for the gas is a result, and ∮dQ/T at the reservoirs is Clausius\'s inequality tested on a cycle nobody chose.'
      };
    }
    const carnot = 1 - st.Tc / st.Th;
    const eta = carnot * st.real;
    const W = st.Qh * eta, Qc = st.Qh - W;
    return {
      title:'Why no engine can convert heat entirely into work',
      steps:[
        drvStep('an engine takes heat, does work, and rejects the rest',
          `${dv('W')} ${dop('=')} ${dv('Q')}_h ${dop('−')} ${dv('Q')}_c`,
          `Q_h = ${n(st.Qh)} J in, W = ${n(W)} J out, Q_c = ${n(Qc)} J dumped`),
        drvStep('efficiency is what fraction you keep',
          `η ${dop('=')} ${dfrac(dv('W'), dv('Q') + '_h')} ${dop('=')} 1 ${dop('−')} ${dfrac(dv('Q') + '_c', dv('Q') + '_h')}`,
          `η = ${n(eta)}, which is ${n(100 * st.real)}% of the Carnot limit`),
        drvSay('the first law permits Q_c = 0, and the second law forbids it',
          'Nothing about energy conservation stops an engine converting heat entirely into work. Such a machine would violate no accounting rule at all. It is forbidden by something else entirely, and that something is entropy.'),
        drvStep('entropy transferred with heat',
          `Δ${dv('S')} ${dop('=')} ${dfrac(dv('Q'), dv('T'))}`,
          'so drawing Q_h from the hot reservoir removes Q_h/T_h of entropy from it'),
        drvStep('and the total entropy cannot decrease',
          `${dfrac(dv('Q') + '_c', dv('T') + '_c')} ${dop('−')} ${dfrac(dv('Q') + '_h', dv('T') + '_h')} ${dop('≥')} 0`,
          `here the ledger comes to ${n(Qc / st.Tc - st.Qh / st.Th)} J/K — positive, as it must be`),
        drvSay('and that inequality is the entire limit',
          'The engine itself returns to its starting state each cycle, so its own entropy change is zero. All the bookkeeping is in the two reservoirs. Requiring their total not to fall forces Q_c to be at least Q_h·T_c/T_h — the rejected heat is not waste from bad design, it is the entropy that must be carried away.'),
        drvStep('rearranged, that is Carnot\'s bound',
          `η ${dop('≤')} 1 ${dop('−')} ${dfrac(dv('T') + '_c', dv('T') + '_h')}`,
          `= ${n(carnot)} between ${n(st.Th)} K and ${n(st.Tc)} K`),
        drvSay('and it depends on nothing but the two temperatures',
          'Not on the working fluid, not on the design, not on the engineering budget. Any engine beating it could be run in reverse against a Carnot engine to move heat from cold to hot for free, which the second law forbids. This is why the bound is universal.'),
        drvStep('equality needs every step reversible',
          `reversible ${dop('⇒')} Σ${dv('Q')}/${dv('T')} ${dop('=')} 0 exactly`,
          'which means infinitely slow, which means zero power output'),
        drvSay('so the real trade is efficiency against actually finishing',
          'A Carnot engine is perfectly efficient and useless, because it takes forever. Every real engine runs irreversibly on purpose, accepting entropy generation in exchange for finite power. The panel lets you set that fraction and shows the entropy created as a direct consequence.')
      ],
      note:'The entropy ledger is computed from the actual heat flows at the actual reservoir temperatures. It is exactly zero only when the efficiency is set to the Carnot value, and strictly positive otherwise — which is the second law appearing as arithmetic rather than as a slogan.'
    };
  },
  enter(st, o){
    st.Th = 600; st.Tc = 300; st.Qh = 1000; st.real = 0.7;
    st.own = !!o.own;
    st.sheet = o.sheet || TM_CYCLE_DEFAULT;
    st.cycErr = '';
  },
  /* the reader's cycle: parsed once, run once, cached against the text */
  cyc(st){
    if(st._ck === st.sheet) return st._cd;
    st._ck = st.sheet;
    const spec = tmParseCycle(st.sheet);
    /* a sheet that does not parse must not blank the picture, so the last one
       that did is kept and shown until a working replacement arrives */
    if(spec.ok) st._cd = { spec, R:tmRunCycle(spec, 200), errs:[] };
    else st._cd = { spec:(st._cd && st._cd.spec) || null, R:(st._cd && st._cd.R) || null, errs:spec.errs };
    return st._cd;
  },
  controls(){
    const st = ST;
    if(st.own){
      const C = STAGES.tmEngine.cyc(st);
      const msg = C.errs.length
        ? '⚠ ' + C.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
          '<br><span style="color:var(--faint)">The previous cycle is still shown.</span>'
        : (C.R ? 'Running: ' + C.R.steps.length + ' processes, ' +
                 (C.R.closes ? 'and the cycle closes.' : 'but it does not close — see the panel.') : '');
      return ctSeg('tmEm', 'own', [['ledger', 'the energy ledger'], ['own', 'write your own cycle']]) +
        `<div class="fld" style="align-items:stretch">
          <textarea id="tmEs" rows="8" spellcheck="false" autocomplete="off"
            aria-label="cycle sheet — one process per line"
            data-audit="gas ar&#10;moles 1&#10;start 20 400&#10;isobaric 40&#10;isochoric 400&#10;isobaric 20&#10;isochoric 400"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
        </div>
        <div class="row wrap"><button class="btn sm pri" id="tmEsGo">Run it</button></div>
        <p class="help" id="tmEsMsg" style="color:${C.errs.length ? 'var(--c-neg)' : 'var(--faint)'}">${msg}</p>
        <p class="help">One process per line. <b>start</b> takes a volume in litres and a temperature in
        kelvin; <b>isothermal</b>, <b>isobaric</b> and <b>adiabatic</b> take a target volume in litres;
        <b>isochoric</b> takes a target temperature in kelvin. <b>gas</b> and <b>moles</b> set the working
        substance. Lines beginning * are comments.</p>
        <p class="help">Append <b>from 900</b> to any heat-exchanging step to draw that heat from a
        reservoir at 900 K instead of one that tracks the gas. Nothing about the path changes — the work
        is identical — but heat has now crossed a finite temperature difference, which is <b>irreversible</b>,
        and the entropy that creates is computed and printed.</p>
        <p class="help">The work is obtained <b>four ways that share nothing</b>: summed as P dV over the
        sub-steps with no formula in it, added from the four closed forms, taken as the geometric area of
        the loop on the P–V diagram, and taken again as <b>∮T dS</b>, the area of the same loop on the
        T–S diagram. A Carnot cycle is a rectangle there, which is the clearest picture in the subject.</p>`;
    }
    return ctSeg('tmEm', 'ledger', [['ledger', 'the energy ledger'], ['own', 'write your own cycle']]) +
      ctlRow('hot reservoir T_h', ctlSlider('tmEh', 320, 1200, 5, st.Th)) +
      ctlRow('cold reservoir T_c', ctlSlider('tmEc', 150, 500, 5, st.Tc)) +
      ctlRow('heat drawn Q<sub>h</sub>', ctlSlider('tmEq', 200, 3000, 10, st.Qh)) +
      ctlRow('fraction of Carnot', ctlSlider('tmEr', 0.1, 1, 0.01, st.real)) +
      `<p class="help">An engine takes heat <b>Q<sub>h</sub></b> from a hot reservoir, does work <b>W</b>, and
      <i>must</i> dump <b>Q<sub>c</sub></b> into a cold one. The second law is the statement that Q<sub>c</sub> cannot be zero:
      no engine converts heat entirely into work, however cleverly it is built.</p>
      <p class="help">Carnot's bound is <b>η ≤ 1 − T_c/T_h</b>, and it depends only on the two
      temperatures — not on the working substance, not on the design. Reaching it requires every step to be
      reversible, which means infinitely slow, which means zero power. Every real engine trades efficiency
      for actually finishing.</p>
      <p class="help">The entropy ledger is the reason. A reversible cycle has <b>ΣQ/T = 0</b> exactly;
      any real one has ΣQ/T &gt; 0, and that surplus is entropy created out of nothing. It is the only
      quantity in physics with a preferred direction in time.</p>`;
  },
  wire(){
    ctWireSeg('tmEm', v => { ST.own = (v === 'own'); });
    if(ST.own){
      /* rendering the box and wiring it are separate steps, and forgetting the
         second produces no error at all — the field takes the keystrokes and
         the picture keeps the old cycle */
      const apply = () => {
        const box = $('tmEs'); if(!box) return;
        ST.sheet = box.value;
        const C = STAGES.tmEngine.cyc(ST);
        const el = $('tmEsMsg');
        if(el){
          el.innerHTML = C.errs.length
            ? '⚠ ' + C.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
              '<br><span style="color:var(--faint)">The previous cycle is still shown.</span>'
            : (C.R ? 'Running: ' + C.R.steps.length + ' processes, ' +
                     (C.R.closes ? 'and the cycle closes.' : 'but it does not close — see the panel.') : '');
          el.style.color = C.errs.length ? 'var(--c-neg)' : 'var(--faint)';
        }
        refreshStageReadout(); updateStageChip();
      };
      const b = $('tmEs'); if(b) b.addEventListener('change', apply);
      const g = $('tmEsGo'); if(g) g.addEventListener('click', apply);
      return;
    }
    wireSlider('tmEh', () => ST.Th, v => { ST.Th = Math.max(v, ST.Tc + 20); }, v => fmtNum(+v, 4) + ' K');
    wireSlider('tmEc', () => ST.Tc, v => { ST.Tc = Math.min(v, ST.Th - 20); }, v => fmtNum(+v, 4) + ' K');
    wireSlider('tmEq', () => ST.Qh, v => { ST.Qh = v; }, v => fmtNum(+v, 5) + ' J');
    wireSlider('tmEr', () => ST.real, v => { ST.real = v; }, v => fmtNum(100 * +v, 4) + '% of Carnot');
  },
  /* the reader's loop, drawn twice — on the P–V plane where its area is the
     work, and on the T–S plane where its area is the heat, which is the same
     number and looks nothing like the same picture */
  frameOwn(st, dt, ctx, W, H){
    const C = STAGES.tmEngine.cyc(st), R = C.R;
    if(!R){
      ctText(ctx, W / 2, H / 2, 'nothing to run yet — the sheet has not parsed',
             rgbCss(TH.faint), '14px ' + FONT_UI, 'center');
      return;
    }
    const box = (arr, kx, ky) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for(const p of arr){
        x0 = Math.min(x0, p[kx]); x1 = Math.max(x1, p[kx]);
        y0 = Math.min(y0, p[ky]); y1 = Math.max(y1, p[ky]);
      }
      const dx = (x1 - x0) || 1, dy = (y1 - y0) || 1;
      return [x0 - 0.14 * dx, x1 + 0.14 * dx, y0 - 0.16 * dy, y1 + 0.18 * dy];
    };
    const COL = { isothermal:TH.grad, isobaric:TH.warn, isochoric:TH.neg, adiabatic:TH.curl };
    const half = Math.min(W * 0.5, 640);
    /* one process occupies M sub-steps, so its points are [(k−1)M … kM] — the
       endpoint is shared with the next process and must not be double-counted,
       or every leg is drawn a point into its successor and takes its colour */
    const M = Math.max(1, Math.round((R.path.length - 1) / R.steps.length));
    const legOf = k => R.path.slice(k * M, k * M + M + 1);
    /* an arrowhead needs a shaft of at least a few pixels: taking two ADJACENT
       samples gives a sub-pixel one, and ctArrow silently draws a dot instead */
    const tip = seg => {
      const i = Math.floor(seg.length / 2), j = Math.min(seg.length - 1, i + Math.ceil(seg.length * 0.07));
      return [seg[i], seg[j]];
    };
    /* ---- the P–V loop ---- */
    const bv = box(R.path, 'V', 'P');
    const P = mkPlot(86, 50, half - 128, H - 142, bv[0], bv[1], Math.max(0, bv[2]), bv[3]);
    /* the title is kept short because the readout chip floats over the canvas's
       top-left corner and a wide centred caption runs underneath it */
    plotFrame(ctx, P, 'volume  (litres)', 'pressure  (kPa)', 'your cycle on the P–V plane');
    ctGrid(ctx, P, null, false);
    plotTicksX(ctx, P, [bv[0], (bv[0] + bv[1]) / 2, bv[1]], v => fmtNum(v, 4));
    ctFill(ctx, P, R.path.map(p => ({ x:p.V, y:p.P })), rgbCss(R.Wsum >= 0 ? TH.grad : TH.neg, 0.18));
    R.steps.forEach((s, k) => {
      const seg = legOf(k), col = rgbCss(COL[s.kind] || TH.dim);
      ctPath(ctx, P, seg.map(p => ({ x:p.V, y:p.P })), col,
             s.res === null || s.res === undefined ? 3 : 3.6, s.res ? [7, 4] : null);
      const [m, m2] = tip(seg);
      if(m && m2) ctArrow(ctx, P, m.V, m.P, m2.V, m2.P, col, 2);
    });
    for(const s of R.steps) ctDot(ctx, P, s.V0, s.P0, 5, rgbCss(TH.faint), rgbCss(TH.bg));
    ctText(ctx, P.px + P.pw / 2, P.py + P.ph - 10,
           (R.Wsum >= 0 ? 'clockwise — an engine' : 'anticlockwise — a refrigerator') +
           ',  W = ' + fmtNum(R.Wsum, 5) + ' J',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    /* ---- the same loop on the T–S plane ---- */
    const bs = box(R.path, 'S', 'T');
    const Q = mkPlot(half + 74, 50, Math.max(190, W - half - 138), H - 142, bs[0], bs[1], Math.max(0, bs[2]), bs[3]);
    plotFrame(ctx, Q, 'entropy of the gas  (J/K, from the start)', 'temperature  (K)',
              'the same loop on the T–S plane — its area is ∮T dS');
    ctGrid(ctx, Q, null, false);
    plotTicksX(ctx, Q, [bs[0], (bs[0] + bs[1]) / 2, bs[1]], v => fmtNum(v, 3));
    ctFill(ctx, Q, R.path.map(p => ({ x:p.S, y:p.T })), rgbCss(TH.warn, 0.16));
    R.steps.forEach((s, k) => {
      const seg = legOf(k), col = rgbCss(COL[s.kind] || TH.dim);
      ctPath(ctx, Q, seg.map(p => ({ x:p.S, y:p.T })), col, 3);
      const [m, m2] = tip(seg);
      if(m && m2) ctArrow(ctx, Q, m.S, m.T, m2.S, m2.T, col, 2);
    });
    ctText(ctx, Q.px + Q.pw / 2, Q.py + Q.ph - 10,
           '∮T dS = ' + fmtNum(R.Wts, 5) + ' J — the same number, a different picture',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    /* the palette is grad #35BE92 green, warn #E0B341 amber, neg #4C93E0 blue,
       curl #C57BE0 violet — naming them wrongly here would be worse than not
       naming them at all, since the key is the only thing decoding the picture */
    stageNote(ctx, 'green isothermal · amber isobaric · blue isochoric · violet adiabatic — a dashed leg draws its heat from a reservoir you named, and is where entropy is created', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.tmEngine.frameOwn(st, dt, ctx, W, H);
    const C = tmCarnot(st.Th, st.Tc);
    const eta = C.eta * st.real;
    const Wr = st.Qh * eta, Qc = st.Qh - Wr;
    const P = ctBox(W * 0.52, H, 0, 0, 1.5, { r:10 });
    /* canvas text takes no markup, and Unicode has no subscript c — so the
       quantity is named in words rather than subscripted (rule 2.10) */
    ctFrame(ctx, P, 'the energy flow — the heat dumped can never be zero');
    /* reservoirs */
    ctFill(ctx, P, [{ x:-1.1, y:1.05 }, { x:1.1, y:1.05 }, { x:1.1, y:1.4 }, { x:-1.1, y:1.4 }], rgbCss(TH.neg, 0.7));
    ctText(ctx, P.X(0), P.Y(1.22), `hot  ${fmtNum(st.Th, 4)} K`, rgbCss(TH.bg), '700 12px ' + FONT_UI, 'center', 'middle');
    ctFill(ctx, P, [{ x:-1.1, y:-1.4 }, { x:1.1, y:-1.4 }, { x:1.1, y:-1.05 }, { x:-1.1, y:-1.05 }], rgbCss(TH.grad, 0.7));
    ctText(ctx, P.X(0), P.Y(-1.22), `cold  ${fmtNum(st.Tc, 4)} K`, rgbCss(TH.bg), '700 12px ' + FONT_UI, 'center', 'middle');
    /* the engine, and the flows sized by energy */
    const s = 0.85 / st.Qh;
    const wIn = Math.max(0.06, st.Qh * s), wOut = Math.max(0.03, Qc * s), wW = Math.max(0.03, Wr * s);
    ctFill(ctx, P, [{ x:-wIn / 2, y:0.32 }, { x:wIn / 2, y:0.32 }, { x:wIn / 2, y:1.05 }, { x:-wIn / 2, y:1.05 }],
           rgbCss(TH.neg, 0.45));
    ctFill(ctx, P, [{ x:-wOut / 2, y:-1.05 }, { x:wOut / 2, y:-1.05 }, { x:wOut / 2, y:-0.32 }, { x:-wOut / 2, y:-0.32 }],
           rgbCss(TH.grad, 0.45));
    ctFill(ctx, P, [{ x:0.34, y:-wW / 2 }, { x:1.15, y:-wW / 2 }, { x:1.15, y:wW / 2 }, { x:0.34, y:wW / 2 }],
           rgbCss(TH.warn, 0.6));
    ctx.strokeStyle = rgbCss(TH.faint); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), 0.34 * P.u, 0, 6.2832); ctx.stroke();
    ctText(ctx, P.X(0), P.Y(0), 'engine', rgbCss(TH.dim), '600 12px ' + FONT_UI, 'center', 'middle');
    ctText(ctx, P.X(0) + 8, P.Y(0.7), 'Q_h = ' + fmtNum(st.Qh, 5) + ' J', rgbCss(TH.neg), '600 11px ' + FONT_MONO);
    ctText(ctx, P.X(0) + 8, P.Y(-0.7), 'Q_c = ' + fmtNum(Qc, 5) + ' J', rgbCss(TH.grad), '600 11px ' + FONT_MONO);
    ctText(ctx, P.X(1.2), P.Y(0), 'W = ' + fmtNum(Wr, 5) + ' J', rgbCss(TH.warn), '600 11px ' + FONT_MONO);
    /* the efficiency ceiling as a function of Tc */
    const x0 = W * 0.54;
    const Q = mkPlot(x0 + 58, 58, W - x0 - 98, H - 158, 0, st.Th, 0, 1.05);
    plotFrame(ctx, Q, 'cold reservoir T_c  (K)', 'efficiency', 'the Carnot ceiling  1 − T_c/T_h');
    plotTicksX(ctx, Q, [0, st.Th / 2, st.Th], v => fmtNum(v, 4));
    plotCurve(ctx, Q, T => 1 - T / st.Th, 300, rgbCss(TH.curl), 2.6);
    plotCurve(ctx, Q, T => (1 - T / st.Th) * st.real, 300, rgbCss(TH.warn), 2.2);
    probeLine(ctx, Q, st.Tc, 'T_c');
    ctDot(ctx, { X:Q.X, Y:Q.Y }, st.Tc, C.eta, 6, rgbCss(TH.curl), rgbCss(TH.bg));
    ctDot(ctx, { X:Q.X, Y:Q.Y }, st.Tc, eta, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    /* canvas text: Unicode only, and there is no subscript "c" in Unicode, so
       this says it in words rather than half in symbols */
    stageNote(ctx, 'the arrow widths are drawn proportional to the energies — heat in = work out + heat dumped, always', W, H);
  },
  readout(st){
    if(st.own){
      const D = STAGES.tmEngine.cyc(st), R = D.R;
      if(!R) return `<div class="card tight"><div class="ttl">The sheet has not parsed</div>
        ${D.errs.map(e => kv(e.line ? 'line ' + e.line : 'the sheet', e.msg)).join('')}
        <p class="help">Write one process per line. A minimal cycle is four lines:
        <b>start 20 300</b>, <b>isothermal 40</b>, <b>isochoric 150</b>, <b>isothermal 20</b> — and then
        whatever is needed to bring it back to where it began.</p></div>`;
      const nm = v => fmtNum(v, 6);
      const worst = Math.max(R.workGap, R.shoeGap, R.tsGap);
      return `<div class="card tight"><div class="ttl">Your cycle</div>
        ${kv('working substance', TM_GASES[R.gas].name + ',  ' + fmtNum(R.n, 3) + ' mol,  γ = ' + fmtNum(R.gamma, 5))}
        ${kv('processes', String(R.steps.length))}
        ${kv('temperature range visited', fmtNum(R.Tlo, 5) + ' K to ' + fmtNum(R.Thi, 5) + ' K')}
        ${kv('does it close?', R.closes ? 'yes — it returns to its starting state'
              : 'no — it ends ' + fmtNum(100 * R.closeV, 3) + '% off in volume and ' + fmtNum(100 * R.closeT, 3) + '% in temperature')}
        ${kv('ΔU around the loop', nm(R.dU) + ' J')}
        <p class="help">${R.closes
          ? 'Internal energy is a state function, so a cycle that closes must return it to zero — and that row was summed process by process from nC<sub>v</sub>ΔT, never set to zero. Everything below depends on the loop actually closing.'
          : 'A path that does not return to its starting state is not a cycle, and the entropy and efficiency figures below describe something that cannot be repeated. Adjust the last process until the two mismatches above vanish.'}</p>
      </div>
      <div class="card tight"><div class="ttl">The net work, four ways</div>
        ${kv('Σ P dV over the sub-steps', nm(R.Wsum) + ' J')}
        ${kv('added from the four closed forms', nm(R.Wform) + ' J')}
        ${kv('the P–V loop area (shoelace)', nm(R.Wshoe) + ' J')}
        ${kv('the T–S loop area, ∮T dS', nm(R.Wts) + ' J')}
        ${kv('largest disagreement', fmtNum(worst, 3) + ' J')}
        ${kv('verdict', worst < 1e-4 * Math.max(Math.abs(R.Wsum), 1)
              ? '✓ four routes, one number' : 'the sub-step sum has not converged — the cycle is very sharp somewhere')}
        <p class="help">The first integrates, the second recites formulas, the third measures an area on
        one diagram and the fourth measures an area on a completely different one. Nothing in the code
        links them. ∮T dS is the net <i>heat</i>, and it equals the net <i>work</i> only because the loop
        closes and ΔU is therefore zero — so that last row is the first law appearing as a coincidence
        between two pictures.</p>
      </div>
      <div class="card tight"><div class="ttl">Entropy, and Clausius</div>
        ${kv('∮dS for the gas, integrated', fmtNum(R.Sgas, 3) + ' J/K')}
        ${kv('and from the closed form', fmtNum(R.Sform, 3) + ' J/K')}
        ${kv('∮dQ/T at the reservoirs', fmtNum(R.clausius, 5) + ' J/K')}
        ${kv('entropy created', fmtNum(R.generated, 5) + ' J/K')}
        ${kv('verdict', R.reversible ? '✓ reversible — Clausius holds with equality'
              : 'irreversible — ∮dQ/T is strictly negative, and that surplus is new entropy')}
        <p class="help">The gas comes back to its own entropy, because entropy is a state function — the
        first row is that, summed over the sub-steps rather than assumed. The reservoirs do not come back,
        and <b>∮dQ/T ≤ 0</b> is Clausius's inequality. ${R.reversible
          ? 'Every step here exchanges heat with a reservoir at its own temperature, so nothing is created and the integral is zero to round-off.'
          : 'Heat has crossed a finite temperature difference somewhere, which is what every real engine does, and the entropy that creates is the row above.'}</p>
      </div>
      <div class="card tight"><div class="ttl">What it is worth</div>
        ${kv('heat in Q<sub>in</sub>', nm(R.Qin) + ' J')}
        ${kv('heat out Q<sub>out</sub>', nm(R.Qout) + ' J')}
        ${kv('net work', nm(R.Wsum) + ' J')}
        ${kv('efficiency W/Q<sub>in</sub>', fmtNum(100 * R.eta, 5) + '%')}
        ${kv('hottest source used', fmtNum(R.Thot, 5) + ' K')}
        ${kv('coldest sink used', fmtNum(R.Tcold, 5) + ' K')}
        ${kv('the bound those two allow', fmtNum(100 * R.etaCarnot, 5) + '%')}
        ${kv('short of it by', fmtNum(100 * R.etaGap, 4) + ' percentage points')}
        <p class="help">${R.reversible && R.etaGap > 1e-6
          ? 'Note carefully what this cycle is doing: it creates <b>no entropy at all</b> and still falls short of the bound. Those are different questions, and running them together is the commonest confusion in the subject. This cycle takes its heat in over a <i>range</i> of temperatures — the constant-volume leg starts drawing at the bottom of the range — while the bound assumes every joule arrives at the top of it. Make both heat-exchanging legs isothermal and the gap closes; that is precisely what a Carnot cycle is.'
          : R.etaGap > 1e-6
          ? 'Some of this shortfall is the entropy created above, and the rest is heat taken in below the top temperature. Both cost efficiency and they are separate faults.'
          : '✓ this cycle reaches the bound its own reservoirs allow — which means every joule enters at the top temperature, leaves at the bottom, and nothing is generated in between. That is a Carnot cycle, and there is no other kind that does it.'}</p>
      </div>
      <div class="card tight"><div class="ttl">Process by process</div>
        ${R.steps.map(s => kv(s.kind + (s.res ? ' (from ' + fmtNum(s.res, 4) + ' K)' : ''),
          'W = ' + fmtNum(s.W, 5) + ' J,  Q = ' + fmtNum(s.Q, 5) + ' J,  ΔS = ' + fmtNum(s.dS, 4) + ' J/K')).join('')}
        <p class="help">Each row's work was integrated over two hundred sub-steps and each row's heat
        accumulated as nC<sub>v</sub>dT + P dV using the local state, so the first law was applied at every
        one of them rather than once at the end.</p>
      </div>`;
    }
    const C = tmCarnot(st.Th, st.Tc);
    const eta = C.eta * st.real;
    const Wr = st.Qh * eta, Qc = st.Qh - Wr;
    const S = tmEntropyCycle(st.Qh, st.Th, Qc, st.Tc);
    const Srev = tmEntropyCycle(st.Qh, st.Th, st.Qh * st.Tc / st.Th, st.Tc);
    return `<div class="card tight"><div class="ttl">The engine</div>
      ${kv('Q<sub>h</sub> drawn from the hot side', fmtNum(st.Qh, 6) + ' J')}
      ${kv('W done', fmtNum(Wr, 6) + ' J')}
      ${kv('Q<sub>c</sub> dumped', fmtNum(Qc, 6) + ' J')}
      ${kv('Q<sub>h</sub> − W − Q<sub>c</sub>', fmtNum(st.Qh - Wr - Qc, 3) + '  — the first law')}
      ${kv('efficiency W/Q<sub>h</sub>', fmtNum(100 * eta, 5) + '%')}
      ${kv('Carnot limit 1 − T_c/T_h', fmtNum(100 * C.eta, 5) + '%')}
      ${kv('this engine, as a fraction of Carnot', fmtNum(100 * st.real, 4) + '%')}
    </div>
    <div class="card tight"><div class="ttl">The entropy ledger</div>
      ${kv('ΔS of the hot reservoir  −Q<sub>h</sub>/T_h', fmtNum(S.dSh, 6) + ' J/K')}
      ${kv('ΔS of the cold one  +Q<sub>c</sub>/T_c', fmtNum(S.dSc, 6) + ' J/K')}
      ${kv('total change in the universe', fmtNum(S.total, 6) + ' J/K')}
      ${kv('is this reversible?', S.reversible ? 'yes — the total is zero' : 'no — entropy was created')}
      ${kv('a Carnot engine would give', fmtNum(Srev.total, 4) + ' J/K')}
      <p class="help">A reversible cycle has ΣQ/T exactly zero — and that is the <i>definition</i> of the
      Carnot limit rather than a separate fact. Push the efficiency slider to 100% and the total collapses
      to zero; anything less creates entropy, and no process ever destroys it.</p>
    </div>
    <div class="card tight"><div class="ttl">Run it backwards</div>
      ${kv('as a refrigerator, COP = T_c/(T_h−T_c)', fmtNum(C.cop, 5))}
      ${kv('as a heat pump, COP = T_h/(T_h−T_c)', fmtNum(C.copHeat, 5))}
      ${kv('heat moved per joule of work', fmtNum(C.cop, 4) + ' J')}
      <p class="help">A heat pump delivers more heat than the work you put in — its coefficient of
      performance is greater than one and often greater than four — because most of the heat is
      <i>moved</i> rather than made. That is not a violation of anything; it is the same Carnot arithmetic
      read in the other direction.</p>
      <p class="help">Note that both coefficients diverge as T_h → T_c: moving heat across a small
      temperature difference is nearly free, and across a large one is expensive. Every practical
      refrigeration cycle is a fight with that ratio.</p>
    </div>
    <div class="card tight"><div class="ttl">Entropy without heat</div>
      ${(() => { const F = tmFreeExpansion(1, 0.01, 0.02);
        return kv('a free expansion doubling the volume', 'Q = 0, W = 0, ΔU = 0') +
               kv('and yet ΔS', fmtNum(F.dS, 6) + ' J/K'); })()}
      ${(() => { const M = tmMicrostates(60, 30), A = tmMicrostates(60, 60);
        return kv('ways to put 60 molecules evenly', 'ln W = ' + fmtNum(M.logW, 5)) +
               kv('ways to put them all on one side', 'ln W = ' + fmtNum(A.logW, 5)) +
               kv('ratio', 'e^' + fmtNum(M.logW - A.logW, 4)); })()}
      <p class="help">Nothing was heated and no work was done, and the entropy still rose — irreversibility
      is not about energy. Boltzmann's <b>S = k ln W</b> explains it: the even split has astronomically more
      microstates, so a gas finds itself there for the same reason a shuffled deck is not sorted. With only
      sixty molecules the ratio is already e²⁰; with 10²³ it is a number with no name.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const R = STAGES.tmEngine.cyc(st).R;
      if(!R) return `<div class="k">your cycle</div><div>the sheet has not parsed</div>`;
      return `<div class="k">${R.closes ? 'your cycle' : 'it does not close'}</div>
        <div style="color:var(--c-warn)">η = ${fmtNum(100 * R.eta, 4)}%  of a possible ${fmtNum(100 * R.etaCarnot, 4)}%</div>
        <div style="color:${R.reversible ? 'var(--c-grad)' : 'var(--c-neg)'}">${R.reversible
          ? 'reversible — no entropy made' : 'made ' + fmtNum(R.generated, 4) + ' J/K of entropy'}</div>`;
    }
    const C = tmCarnot(st.Th, st.Tc);
    return `<div class="k">efficiency</div>
      <div style="color:var(--c-warn)">${fmtNum(100 * C.eta * st.real, 4)}%</div>
      <div style="color:var(--c-curl)">Carnot ${fmtNum(100 * C.eta, 4)}%</div>`;
  },
  legend(st){
    if(st && st.own) return [['var(--c-grad)', 'isothermal legs'], ['var(--c-warn)', 'isobaric legs, and the T–S area'],
                             ['var(--c-neg)', 'isochoric legs'], ['var(--c-curl)', 'adiabatic legs'],
                             ['var(--faint)', 'the corners between processes']];
    return [['var(--c-neg)', 'heat in, and the hot reservoir'], ['var(--c-grad)', 'heat out, and the cold one'],
            ['var(--c-warn)', 'work, and this engine'], ['var(--c-curl)', 'the Carnot ceiling']]; },
  dockLegend:true
};

/* ---- 5 · geometric optics -------------------------------------------------- */
