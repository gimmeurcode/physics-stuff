/* ============================================================================
   4za · CONDENSED MATTER AND SEMICONDUCTORS
   Why one solid conducts and the next insulates: Fermi statistics, the gap
   that periodicity opens by itself, and the junction all of electronics rests on.
   ============================================================================ */

/* the temperatures the differenced heat capacity is evaluated at — twelve, on a
   logarithmic ladder, because each one costs four solves for μ and the picture
   only needs enough points to show whether they sit on the line */
const SL_DOS_TS = [3, 8, 20, 50, 100, 200, 400, 700, 1100, 1600, 2200, 3000];

STAGES.slFermi = {
  title:'The Fermi sea, and what temperature does to it',
  legend(st){
    if(st && st.own)
      return [['var(--c-curl)', 'the density of states g(E) you wrote'],
              ['var(--c-grad)', 'g·f — the electrons actually there at this T'],
              ['var(--c-warn)', 'E_F, found by filling; and μ(T), found by conserving'],
              ['var(--c-pos)', 'C from (π²/3)k²T g(E_F) — one point, no integral'],
              ['var(--c-neg)', 'C from dU/dT — every point, no expansion']];
    return [['var(--c-grad)', 'f(E), and the electrons actually present'],
            ['var(--c-warn)', 'the T = 0 step, and E_F'],
            ['var(--c-curl)', 'the density of states, ∝ √E'],
            ['var(--c-neg)', 'the ≈ 4kT width of the smear']]; },
  dockLegend:true,
  enter(st, o){
    st.i = o.i || 3;                 // copper
    st.T = o.T || 300;
    st.own = !!o.own;
    /* the free-electron DOS itself, so the first thing the reader sees is the
       case whose answer is already known — and 0.6812 is SL_DOS_C to four
       figures, which is why the panel reports the exact anchor separately */
    st.gsrc = o.gsrc || '0.6812*sqrt(E)';
    st.Etop = o.Etop || 16;
    st.nd   = o.nd || 8.47;          // copper, in 10²⁸ per m³
  },
  /* One table, one filling level and twelve differenced heat capacities per
     edit. That is about a third of a million evaluations of a compiled
     expression, and `readout` runs four times a second, so it is keyed on
     everything that changes it — and the temperature is not one of those. */
  dosOf(st){
    const key = st.gsrc + '|' + st.Etop + '|' + st.nd;
    if(st._dk === key) return st._dd;
    st._dk = key;
    const gc = pkCompile(slDOSSrc(st.gsrc), () => NaN);
    const g = E => gc(E, 0, 0);
    const TB = slDOSTable(g, 0, Math.max(0.2, st.Etop), 3000);
    const F = slDOSFermi(TB, st.nd);
    const out = { TB, F, g, ok:F.ok, heats:[] };
    if(F.ok)
      out.heats = SL_DOS_TS.map(T => ({ T, H:slDOSHeat(TB, st.nd, T, F.EF),
                                        mu:slDOSMu(TB, st.nd, T, F.EF) }));
    st._dd = out;
    return out;
  },
  /* the one thing that does depend on the temperature slider */
  muOf(st){
    const D = STAGES.slFermi.dosOf(st);
    if(!D.ok) return null;
    const key = st._dk + '|' + st.T;
    if(st._mk === key) return st._md;
    st._mk = key;
    st._md = { M:slDOSMu(D.TB, st.nd, st.T, D.F.EF),
               H:slDOSHeat(D.TB, st.nd, st.T, D.F.EF) };
    return st._md;
  },
  controlsOwn(){
    const st = ST;
    return fnHtml('sfG', 'g(E) =', st.gsrc,
                  'E in eV — the value is states per eV per m³, in units of 10²⁸') +
      ctlRow('band top (eV)', ctlSlider('sfEt', 1, 40, 0.5, st.Etop)) +
      ctlRow('n (10²⁸/m³)', ctlSlider('sfN', 0.2, 30, 0.01, st.nd)) +
      ctlRow('T (K)', ctlSlider('sfT', 1, 6000, 1, st.T)) +
      `<p class="help">The default is the free-electron density of states,
      g(E) = (1/2π²)(2m/ħ²)^(3/2)√E, which comes to 0.6812√E in these units. Leave it there and the
      panel reports the one number nothing you type can change: the E<sub>F</sub> found by
      <b>filling</b> this g agrees with (ħ²/2m)(3π²n)^(2/3) to eleven figures. Then change it.</p>
      <p class="help">Four things are solved for rather than quoted.
      <b>E<sub>F</sub></b> from ∫₀^E_F g dE = n — there is no formula to invert for an arbitrary g.
      <b>μ(T)</b> from ∫ g f dE = n, which is a <i>different</i> equation with a different answer;
      the gap between them is what the Sommerfeld expansion calls −(π²/12)(kT)²/E<sub>F</sub>, and
      here it is measured. <b>U(T)</b> = ∫ E g f dE, and <b>C</b> = dU/dT by differencing it with μ
      re-solved at each step.</p>
      <p class="help">The lower panel is the payoff. The line is C = (π²/3)k²T g(E<sub>F</sub>) — the
      Sommerfeld result, which integrates nothing and looks at g in exactly one place. The dots are
      dU/dT, which assumes nothing about g at all. They lie on top of each other for a smooth band and
      come apart the moment you put structure within a few kT of E<sub>F</sub>: try adding
      <b>+ 4·exp(−((E−7)/0.05)^2)</b> and watch the ratio leave 1.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('sfM', st.own ? 'own' : 'list',
                      [['list', 'a metal from the list'], ['own', 'design your own density of states']]);
    if(st.own) return seg + STAGES.slFermi.controlsOwn();
    return seg + ctSeg('sfI', String(st.i), SL_METALS.map((m, i) => [String(i), m.s])) +
      ctlRow('T (K)', ctlSlider('sfT', 1, 6000, 1, st.T)) +
      `<p class="help">Electrons are fermions, so no two share a state. At absolute zero they stack
      up from the bottom to a level called <b>E<sub>F</sub></b> and stop — not because anything
      pushes back, but because the seats below are taken.</p>
      <p class="help">Raise the temperature and only the electrons within about <b>kT</b> of the
      surface can move at all; everything deeper has nowhere to go. At room temperature kT is about
      0.026 eV against a Fermi energy of several eV, so the fraction that participates is under 1%.
      That single fact is the resolution of the hundred-year-old heat-capacity paradox.</p>`;
  },
  wire(){
    ctWireSeg('sfM', v => { ST.own = (v === 'own'); });
    ctWireSeg('sfI', v => { ST.i = +v; });
    wireSlider('sfT', () => ST.T, v => { ST.T = Math.round(v); }, v => Math.round(+v) + ' K');
    if(!ST.own) return;
    wireSlider('sfEt', () => ST.Etop, v => { ST.Etop = v; }, v => fmtNum(+v, 1) + ' eV');
    wireSlider('sfN', () => ST.nd, v => { ST.nd = v; }, v => fmtNum(+v, 2) + ' × 10²⁸ m⁻³');
    fnWire('sfG', (m, s) => { ST.gsrc = s; },
           s => { const gg = compile(parse(slDOSSrc(s))); return { f:E => gg(E, 0, 0) }; });
  },
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.slFermi.dosOf(st);
    const px = 78, top = 84;
    const aw = Math.max(60, W - px - 96), ah = Math.max(60, H - top - 92);
    if(!D.ok){
      const P = mkPlot(px, top, aw, ah, 0, 1, 0, 1);
      plotFrame(ctx, P, '', '', 'this band cannot be filled');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2, 'no Fermi level',
             rgbCss(TH.neg), '600 15px ' + FONT_UI, 'center');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 22, String(D.F.why || '').slice(0, 110),
             rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
      return;
    }
    const TB = D.TB, EF = D.F.EF;
    const cur = STAGES.slFermi.muOf(st);
    const mu = cur ? cur.M.mu : EF;
    /* the two panels stack when there is height and sit side by side when there
       is width, exactly as the barrier stage does */
    const wide = W >= 800 && aw >= 460;
    const gapPx = wide ? 66 : 54;
    const bw = wide ? (aw - gapPx) / 2 : aw;
    const bh = wide ? ah : (ah >= 340 ? (ah - gapPx) / 2 : ah);
    const Emax = TB.Ehi;
    const P = mkPlot(px, top, bw, bh, 0, Emax, 0, TB.peak * 1.15 || 1);
    st.P = P;
    plotFrame(ctx, P, 'energy E (eV)', 'g(E)  (10²⁸ per eV per m³)',
              'your density of states, and the electrons in it');
    ctGrid(ctx, P);
    /* what is actually occupied at this temperature */
    ctx.save();
    ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
    ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(0));
    for(let i = 0; i <= 320; i++){
      const E = Emax * i / 320;
      ctx.lineTo(P.X(E), P.Y(TB.g(E) * slFD(E, mu, st.T)));
    }
    ctx.lineTo(P.X(Emax), P.Y(0)); ctx.closePath();
    ctx.fillStyle = rgbCss(TH.grad, 0.32); ctx.fill();
    ctx.restore();
    ctPath(ctx, P, Array.from({ length:400 }, (_, i) => {
      const E = Emax * i / 399; return { x:E, y:TB.g(E) };
    }), rgbCss(TH.curl), 2.4);
    ctPath(ctx, P, [{ x:EF, y:0 }, { x:EF, y:P.y1 }], rgbCss(TH.warn), 2, [5, 4]);
    ctText(ctx, P.X(EF) + 6, P.py + 16, 'E_F = ' + fmtNum(EF, 4) + ' eV',
           rgbCss(TH.warn), '11px ' + FONT_UI);
    if(Math.abs(mu - EF) > (Emax / P.pw) * 2){
      ctPath(ctx, P, [{ x:mu, y:0 }, { x:mu, y:P.y1 }], rgbCss(TH.neg, 0.85), 1.6, [3, 3]);
      ctText(ctx, P.X(mu) - 6, P.py + 32, 'μ(T) = ' + fmtNum(mu, 4),
             rgbCss(TH.neg), '11px ' + FONT_UI, 'right');
    }
    /* the second panel: the two heat capacities, one a line and one a set of
       measurements, on the same axes */
    const Q = wide ? mkPlot(px + bw + gapPx, top, bw, bh, 0, 3200, 0, 1)
                   : (ah >= 340 ? mkPlot(px, top + bh + gapPx, aw, bh, 0, 3200, 0, 1) : null);
    if(!Q){
      stageNote(ctx, 'E_F was found by filling this g(E) — no formula was inverted', W, H);
      return;
    }
    const cmax = Math.max.apply(null, D.heats.map(r =>
      Math.max(Math.abs(slDOSMolar(r.H.C, st.nd)), Math.abs(slDOSMolar(r.H.Csom, st.nd))))) || 1;
    const Q2 = mkPlot(Q.px, Q.py, Q.pw, Q.ph, 0, 3200, 0, cmax * 1.18);
    plotFrame(ctx, Q2, 'temperature T (K)', 'C per mole of electrons (J/K)',
              'the Sommerfeld line, and dU/dT measured against it');
    ctGrid(ctx, Q2);
    plotCurve(ctx, Q2, T => slDOSMolar(Math.PI * Math.PI / 3 * SL_KBEV * SL_KBEV * T * D.F.gEF, st.nd),
              120, rgbCss(TH.pos), 2.4);
    for(const r of D.heats){
      if(r.T > 3200) continue;
      const y = slDOSMolar(r.H.C, st.nd);
      if(!Number.isFinite(y)) continue;
      ctDot(ctx, Q2, r.T, y, 4.4, rgbCss(TH.neg), rgbCss(TH.bg));
    }
    ctText(ctx, Q2.px + 10, Q2.py + 18, '(π²/3)k²T g(E_F)', rgbCss(TH.pos), '11px ' + FONT_UI);
    ctText(ctx, Q2.px + 10, Q2.py + 33, 'dU/dT, differenced', rgbCss(TH.neg), '11px ' + FONT_UI);
    stageNote(ctx, 'E_F was found by filling this g(E), and μ(T) by conserving electrons — ' +
                   'no formula was inverted anywhere', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.slFermi.frameOwn(st, dt, ctx, W, H);
    const M = SL_METALS[st.i], EF = slFermiEnergy(M.n);
    const Em = EF * 1.7;
    const P = mkPlot(80, 55, W - 170, H - 145, 0, Em, 0, 1.15);
    st.P = P;
    plotFrame(ctx, P, 'energy E (eV)', 'occupation f(E)',
              M.s + ' — the Fermi–Dirac function, and the states available to fill');
    ctGrid(ctx, P);

    /* the density of states, scaled to share the axis — what is on offer */
    const dmax = Math.sqrt(Em);
    ctx.save(); ctx.globalAlpha = 0.5;
    ctPath(ctx, P, Array.from({ length:200 }, (_, i) => {
      const E = Em * i / 199;
      return { x:E, y:slDOS3D(E) / dmax };
    }), rgbCss(TH.curl), 1.8, [6, 4]);
    ctx.restore();

    /* the occupied region — DOS times occupancy, which is what is actually there */
    ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(0));
    for(let i = 0; i <= 300; i++){
      const E = Em * i / 300;
      ctx.lineTo(P.X(E), P.Y(slDOS3D(E) / dmax * slFD(E, EF, st.T)));
    }
    ctx.lineTo(P.X(Em), P.Y(0)); ctx.closePath();
    ctx.fillStyle = rgbCss(TH.grad, 0.3); ctx.fill();

    /* the step itself */
    plotCurve(ctx, P, E => slFD(E, EF, st.T), 600, rgbCss(TH.grad), 2.8);
    /* and the zero-temperature step it is smearing out from */
    ctPath(ctx, P, [{ x:0, y:1 }, { x:EF, y:1 }, { x:EF, y:0 }, { x:Em, y:0 }],
           rgbCss(TH.warn, 0.55), 1.8, [5, 4]);

    /* the width of the smear, marked and measured */
    const kT = SL_KBEV * st.T;
    ctArrow(ctx, P, EF - 2 * kT, 0.5, EF + 2 * kT, 0.5, rgbCss(TH.neg), 2, '≈ 4kT');
    ctPath(ctx, P, [{ x:EF, y:0 }, { x:EF, y:1.12 }], rgbCss(TH.warn), 2, [4, 3]);
    ctText(ctx, P.X(EF) + 8, P.Y(1.08), 'E_F = ' + fmtNum(EF, 3) + ' eV', rgbCss(TH.warn), '12px ' + FONT_UI);
    stageNote(ctx, 'dashed orange is T = 0; the shaded area is the electrons that are actually there; only the edge can move', W, H);
  },
  deriveOwn(st){
    const D = STAGES.slFermi.dosOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 5) : 'not defined here');
    if(!D.ok) return {
      title:'This band cannot be filled',
      steps:[drvSay('what the filling condition needs',
        'E<sub>F</sub> is defined by ∫₀^E_F g dE = n, so the band has to contain at least n states and g has to be somewhere positive. ' + (D.F.why || '') + ' Widen the band, lower the density, or make g larger.')],
      note:'Nothing below is computed until the level exists, because every quantity on this page is defined relative to it.'
    };
    const cur = STAGES.slFermi.muOf(st);
    const M = cur.M, H = cur.H;
    const som = -Math.PI * Math.PI / 12 * Math.pow(SL_KBEV * st.T, 2) / D.F.EF;
    return {
      title:'Four quantities, none of which has a formula for an arbitrary g',
      steps:[
        drvStep('the density of states, as you wrote it',
          `${dv('g')}(${dv('E')}) ${dop('=')} ${pkPretty(st.gsrc)}`,
          `over 0 to ${n(st.Etop)} eV, holding ${n(D.TB.total)} × 10²⁸ states per m³ in all`),
        drvSay('what a closed form was standing in for',
          '(ħ²/2m)(3π²n)^(2/3) is not a general result about metals. It is what you get when you put g ∝ √E into the filling condition and invert the integral, and √E is the one density of states for which that inversion can be done in your head. For anything else the same condition has to be solved.'),
        drvStep('E_F, found by filling',
          `∫₀^(${dv('E')}_F) ${dv('g')}(${dv('E')}) d${dv('E')} ${dop('=')} ${dv('n')}`,
          `bisected: E_F = ${n(D.F.EF)} eV, with g(E_F) = ${n(D.F.gEF)}`),
        drvSay('and why the value of g there is the number that matters next',
          'dE_F/dn is 1/g(E_F): a band with plenty of states at the Fermi level barely moves when you add electrons, and one with almost none moves a long way. That single derivative is the difference between a metal and a semimetal, and it is why the same quantity turns up again in the heat capacity below.'),
        drvStep('μ(T), found by conserving electrons',
          `∫ ${dv('g')}(${dv('E')}) ${dv('f')}(${dv('E')},μ,${dv('T')}) d${dv('E')} ${dop('=')} ${dv('n')}`,
          `Newton, ${M.iters} steps: μ = ${n(M.mu)} eV, which is ${n(M.shift)} eV below E_F`),
        drvStep('against what the Sommerfeld expansion says that shift should be',
          `μ ${dop('≈')} ${dv('E')}_F[1 ${dop('−')} ${dfrac('π²', '12')}(${dv('k')}${dv('T')}/${dv('E')}_F)²]`,
          `predicted ${n(som)} eV — measured ÷ predicted = ${n(som !== 0 ? M.shift / som : NaN)}`),
        drvSay('these are two different equations, not one equation twice',
          'The first fills states from the bottom until they run out. The second asks where the chemical potential has to sit so that the smeared occupation still counts the same electrons. They coincide at absolute zero and nowhere else, and the difference is second order in kT/E_F because the density of states is rising: the states gained above μ outnumber those lost below, so μ must fall to compensate. A DOS that falls with energy pushes μ the other way, which you can produce here in one edit.'),
        drvStep('the energy, and the heat capacity by differencing it',
          `${dv('C')} ${dop('=')} ${dfrac('d', 'd' + dv('T'))}∫ ${dv('E')}${dv('g')}${dv('f')} d${dv('E')}`,
          `${n(slDOSMolar(H.C, st.nd))} J/K per mole of electrons, step ${n(H.h)} K, own error ${H.diffErr.toExponential(2)}`),
        drvStep('and the same quantity from one point of g',
          `${dv('C')} ${dop('=')} ${dfrac('π²', '3')}${dv('k')}²${dv('T')} ${dv('g')}(${dv('E')}_F)`,
          `${n(slDOSMolar(H.Csom, st.nd))} J/K — ratio ${n(H.ratio)}`),
        drvSay('and that ratio is the whole point of the stage',
          'The Sommerfeld result is a Taylor expansion of the integral about E<sub>F</sub>, and it keeps only the first term. That is exact if g is a straight line across the few kT the Fermi function smears over, excellent if g is smooth, and simply wrong if g has structure there — which is what a transition metal has, and what you can put in with one Gaussian. The two numbers above are the expansion being tested rather than invoked, and the dots in the lower panel are the same test at twelve temperatures at once.')
      ],
      note:'Every one of the four is a root-find or a quadrature over the function you typed. Put the free-electron √E back and E_F returns to (ħ²/2m)(3π²n)^(2/3) to eleven figures, and the differenced heat capacity returns to (π²/2)R·T/T_F — which is the check that makes the other answers worth reading.'
    };
  },
  derive(st){
    if(st.own) return STAGES.slFermi.deriveOwn(st);
    const M = SL_METALS[st.i], EF = slFermiEnergy(M.n);
    const n = v => fmtNum(v, 5);
    const kT = SL_KBEV * st.T;
    return {
      title:'From "no two electrons alike" to the Fermi energy',
      steps:[
        drvSay('the classical answer, and why it is badly wrong',
          'Treat the conduction electrons as an ideal gas and equipartition gives each one (3/2)kT, so a mole of them should add (3/2)R to the heat capacity — about 12 J/mol·K on top of the lattice. Measured metals show almost nothing: about 1% of that. Drude got conduction right in 1900 and this spectacularly wrong, and it stayed wrong for twenty-seven years.'),
        drvStep('count the states in a box of side L',
          `${dv('k')}ₓ ${dop('=')} ${dfrac('2π' + dv('n'), dv('L'))}`,
          'periodic boundary conditions — one state per (2π/L)³ of k-space'),
        drvStep('each k holds two electrons, one per spin',
          `${dv('N')} ${dop('=')} 2 ${dop('·')} ${dfrac('(4/3)π' + dv('k') + '_F³', '(2π/' + dv('L') + ')³')}`,
          'fill a sphere in k-space, because energy depends only on |k|'),
        drvStep('solve for the radius of that sphere',
          `${dv('k')}_F ${dop('=')} (3π²${dv('n')})^(1/3)`,
          `n = ${M.n.toExponential(3)} m⁻³ gives k_F = ${slFermiK(M.n).toExponential(4)} m⁻¹`),
        drvStep('and convert the radius to an energy',
          `${dv('E')}_F ${dop('=')} ${dfrac('ħ²' + dv('k') + '_F²', '2' + dv('m'))}`,
          `E_F = ${n(EF)} eV — measured for ${M.s}: ${M.EF} eV`),
        drvSay('this is an enormous energy, and it is there at absolute zero',
          'Several electronvolts corresponds to a temperature of tens of thousands of kelvin. The electrons in a cold piece of copper are moving at about 1.6 million metres per second and would continue to do so at absolute zero. Nothing is heating them: they are moving because the exclusion principle forbids them from all sitting still in the same state.'),
        drvStep('at finite T only a sliver of them can respond',
          `${dfrac(dv('N') + '_active', dv('N'))} ${dop('≈')} ${dfrac(dv('k') + 'T', dv('E') + '_F')}`,
          `at ${st.T} K: kT = ${n(kT)} eV, so the fraction is ${fmtNum(kT / EF, 5)} — about ${fmtNum(100 * kT / EF, 2)}%`),
        drvStep('so the heat capacity is suppressed by exactly that factor',
          `${dv('C')} ${dop('≈')} ${dfrac('π²', '2')}${dv('R')}${dfrac(dv('T'), dv('T') + '_F')}`,
          `${n(Math.PI * Math.PI / 2 * SL_R * st.T / slFermiTemp(M.n))} J/mol·K, against the classical ${n(1.5 * SL_R)}`),
        drvSay('and the paradox dissolves',
          'The classical calculation was not wrong about how much energy each electron would absorb — it was wrong about how many are allowed to. An electron 1 eV below the surface cannot take a small amount of heat, because every state it could move to is already occupied. Sommerfeld\'s correction is a single ratio, kT/E_F, and it is the difference between a factor-of-a-hundred failure and agreement.')
      ],
      note:'The linear-in-T electronic heat capacity is invisible at room temperature next to the lattice\'s Debye contribution, which goes as T³. Below a few kelvin the T³ dies faster and the electronic term takes over — which is precisely how the two are separated experimentally.'
    };
  },
  readoutOwn(st){
    const D = STAGES.slFermi.dosOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 5 : d) : 'not defined here');
    if(!D.ok) return `<div class="card tight"><div class="ttl">This band cannot be filled</div>
      ${kv('g(E)', pkPretty(st.gsrc))}
      ${kv('states in the band', n(D.TB.total) + ' × 10²⁸ per m³')}
      ${kv('electrons asked for', n(st.nd) + ' × 10²⁸ per m³')}
      ${kv('', esc(String(D.F.why || '')))}
      <p class="help">E<sub>F</sub> is defined by ∫₀^E_F g dE = n. Nothing on this page exists
      without it, so nothing else is computed — widen the band, lower the density, or make g
      larger. The picture keeps the last band that could be filled.</p></div>`;
    const cur = STAGES.slFermi.muOf(st);
    const M = cur.M, H = cur.H, kT = SL_KBEV * st.T;
    const som = -Math.PI * Math.PI / 12 * kT * kT / D.F.EF;
    /* the anchor: what the closed form would say for this many electrons, which
       is meaningful only when the DOS really is the free-electron one */
    const closed = slFermiEnergy(st.nd * 1e28);
    return `<div class="card tight"><div class="ttl">Your band, filled</div>
      ${kv('g(E)', pkPretty(st.gsrc) + '  × 10²⁸ /eV/m³')}
      ${kv('band', '0 to ' + n(st.Etop, 4) + ' eV')}
      ${kv('states it holds', n(D.TB.total) + ' × 10²⁸ /m³')}
      ${kv('electrons', n(st.nd) + ' × 10²⁸ /m³  (filling ' + fmtNum(100 * st.nd / D.TB.total, 3) + '%)')}
      ${kv('E_F, found by bisecting ∫g = n', n(D.F.EF, 8) + ' eV')}
      ${kv('g at E_F', n(D.F.gEF, 6))}
      ${kv('dE_F/dn there', n(D.F.dEFdn, 5) + ' eV per 10²⁸/m³')}
      ${D.TB.neg ? kv('⚠ negative samples of g', D.TB.neg + ' — clamped to zero') : ''}
      ${D.TB.bad ? kv('⚠ non-finite samples of g', D.TB.bad + ' — treated as zero') : ''}
      <p class="help">There is no formula being inverted here. The cumulative ∫₀^E g dE is built once
      and the level is bisected on it, which works for any g at all. ${D.TB.neg
        ? 'Some of your g came out <b>negative</b>, which a density of states cannot be — those samples were set to zero, because a negative g makes the cumulative non-monotone and the Fermi level stops being unique.'
        : 'The band edges are integrated by substitution rather than by Simpson: √E has unbounded curvature at E = 0, and treating that cell like any other is a 5 × 10⁻⁶ error that lands entirely in E<sub>F</sub>.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The anchor — free electrons, whose answer is known</div>
      ${kv('(ħ²/2m)(3π²n)^(2/3) at this n', n(closed, 8) + ' eV')}
      ${kv('your E_F', n(D.F.EF, 8) + ' eV')}
      ${kv('they differ by', fmtNum(Math.abs(D.F.EF - closed) / closed, 3) + ' relative')}
      <p class="help">Those two agree to eleven figures when g is the free-electron
      0.6812√E, and they are <b>meant</b> to disagree otherwise — the closed form is a property of
      √E and of nothing else. Comparing them is how you see how much of "the Fermi energy of a
      metal" is physics and how much is one convenient integral.</p>
    </div>
    <div class="card tight"><div class="ttl">At T = ${st.T} K — μ, which is not E_F</div>
      ${kv('thermal energy kT', n(kT, 6) + ' eV')}
      ${kv('μ, found by conserving electrons', n(M.mu, 8) + ' eV')}
      ${kv('μ − E_F, measured', n(M.shift, 6) + ' eV')}
      ${kv('−(π²/12)(kT)²/E_F, predicted', n(som, 6) + ' eV')}
      ${kv('measured ÷ predicted', n(som !== 0 ? M.shift / som : NaN, 6))}
      ${kv('Newton steps, residual', M.iters + ',  ' + M.resid.toExponential(2))}
      <p class="help">Filling from the bottom and conserving electrons at temperature are two
      different equations. They agree only at absolute zero. ${M.shift < 0
        ? 'Here μ sits <b>below</b> E<sub>F</sub>, which is what a rising density of states does: the smear gains more states above than it loses below, so the level must drop to keep the count.'
        : 'Here μ sits <b>above</b> E<sub>F</sub> — your g must be falling at the Fermi level, so the smear loses more states above than it gains below and the level has to rise.'}
      The expansion is a low-temperature statement; the ratio above leaves 1 as kT/E<sub>F</sub> grows,
      and it does so as the square.</p>
    </div>
    <div class="card tight"><div class="ttl">The heat capacity, two ways</div>
      ${kv('dU/dT, differenced', n(slDOSMolar(H.C, st.nd), 6) + ' J/K per mol of electrons')}
      ${kv('(π²/3)k²T g(E_F)', n(slDOSMolar(H.Csom, st.nd), 6) + ' J/K')}
      ${kv('ratio', n(H.ratio, 6))}
      ${kv('the difference quotient\'s own error', H.diffErr.toExponential(2) + ' (step halved once)')}
      ${kv('against the classical (3/2)R', n(1.5 * SL_R, 5) + ' J/K')}
      <p class="help">${Math.abs(H.ratio - 1) < 0.01
        ? 'The two agree, which is the Sommerfeld expansion <b>holding</b> — and it is a real result, because one route integrates g over the whole thermal window with μ re-solved at each step and the other looks at g in a single point. Nothing forces them to match.'
        : 'The two <b>disagree</b>, by ' + fmtNum(100 * Math.abs(H.ratio - 1), 1) + '%. The one-point formula assumes g is a straight line across the few kT the Fermi function smears over; your g is not, so it cannot see states that the integral does. This is exactly the failure a transition metal shows, and it is why the linear-in-T law is a statement about smooth bands rather than about electrons.'}</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.slFermi.readoutOwn(st);
    const M = SL_METALS[st.i], EF = slFermiEnergy(M.n);
    const n = v => fmtNum(v, 5);
    const kT = SL_KBEV * st.T;
    const err = Math.abs(EF - M.EF) / M.EF * 100;
    return `<div class="card tight"><div class="ttl">${M.s}, free-electron model</div>
      ${kv('electron density n', M.n.toExponential(3) + ' m⁻³')}
      ${kv('Fermi energy, computed', n(EF) + ' eV')}
      ${kv('Fermi energy, measured', M.EF + ' eV')}
      ${kv('disagreement', fmtNum(err, 2) + '%')}
      ${kv('Fermi velocity', fmtNum(slFermiVel(M.n) / 1e6, 4) + ' × 10⁶ m/s')}
      ${kv('Fermi temperature', fmtNum(slFermiTemp(M.n), 5) + ' K')}
      <p class="help">A model with no interactions between the electrons at all, and it lands within
      a few percent for the simple metals. Why that works is a deep question — the answer is Landau's
      Fermi-liquid theory, which says the interactions dress the electrons rather than destroy them.</p>
    </div>
    <div class="card tight"><div class="ttl">At T = ${st.T} K</div>
      ${kv('thermal energy kT', n(kT) + ' eV')}
      ${kv('kT ÷ E_F', fmtNum(kT / EF, 6))}
      ${kv('active fraction', fmtNum(100 * kT / EF, 3) + '%')}
      ${kv('f at E_F', fmtNum(slFD(EF, EF, st.T), 6))}
      ${kv('f one kT above', fmtNum(slFD(EF + kT, EF, st.T), 6))}
      ${kv('f one kT below', fmtNum(slFD(EF - kT, EF, st.T), 6))}
      <p class="help">The occupation at E<sub>F</sub> is exactly one half at every temperature —
      that is the definition of the Fermi level, and it is why the curve pivots about that point
      instead of sliding.</p>
    </div>
    <div class="card tight"><div class="ttl">Heat capacity, the old paradox</div>
      ${kv('classical prediction', n(1.5 * SL_R) + ' J/mol·K')}
      ${kv('Fermi statistics give', n(slElectronicC(st.T, M.n)) + ' J/mol·K')}
      ${kv('ratio', fmtNum(slElectronicC(st.T, M.n) / (1.5 * SL_R), 5))}
      <p class="help">Two orders of magnitude, from one principle. This was the first hard evidence
      that electrons in a metal are not a classical gas, and it is still the cleanest.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.slFermi.dosOf(st);
      if(!D.ok) return `<div class="k">your band</div><div style="color:var(--c-neg)">cannot be filled</div>`;
      const cur = STAGES.slFermi.muOf(st);
      const d = Math.abs(cur.H.ratio - 1);
      return `<div class="k">your g(E)</div>
        <div>E_F = ${fmtNum(D.F.EF, 4)} eV, found</div>
        <div>C two ways: ${d < 0.005 ? 'agree to ' + d.toExponential(1) : fmtNum(100 * d, 1) + '% apart'}</div>`;
    }
    const M = SL_METALS[st.i];
    return `<div class="k">${M.s}: E_F = ${fmtNum(slFermiEnergy(M.n), 3)} eV</div><div>kT/E_F = ${fmtNum(SL_KBEV * st.T / slFermiEnergy(M.n), 4)}</div>`;
  }
};

/* ------------------------------------------------------------------------- */
STAGES.slBand = {
  title:'Where a band gap comes from',
  legend(){ return [['var(--text)', 'f(E)'],
                    ['var(--c-grad)', 'the corridor |f| ≤ 1 that cos(ka) cannot leave'],
                    ['var(--c-pos)', 'the allowed bands'],
                    ['var(--c-neg)', 'the gaps between them']]; },
  dockLegend:true,
  enter(st, o){
    st.P0 = o.P0 || 6;
    st.own = !!o.own;
    st.cell = o.cell || '9*(1 - cos(2*pi*x))';
  },
  /* the reader's cell, and the bands it opens — cached, since the scan is a
     few thousand transfer matrices and the readout asks four times a second */
  cellOf(st){
    const g = pkCompile(st.cell);
    return x => { const v = g(x, 0, 0); return Number.isFinite(v) ? Math.max(-400, Math.min(400, v)) : 0; };
  },
  bandsOf(st){
    if(st._bk === st.cell) return st._bd;
    st._bk = st.cell;
    st._bd = slBandsV(STAGES.slBand.cellOf(st), 1, -4, 60, 1200, 600);
    return st._bd;
  },
  controls(){
    const st = ST;
    return ctSeg('sbMode', st.own ? 'own' : 'kp',
                 [['kp', 'delta wells (Kronig–Penney)'], ['own', 'design your own cell']]) +
      (st.own
        ? fnHtml('sbCell', 'V(x) over one cell =', st.cell, 'x, from 0 to 1') +
          `<p class="help">One period of the potential, in the wing's units (ħ²/2m = 1, cell length 1).
          There is no closed form for whatever you write, so the condition is obtained by <b>propagating
          ψ across one cell</b> and taking the trace of the resulting 2×2 matrix: Bloch's theorem says
          cos(ka) = ½ Tr M, so the allowed energies are exactly those with |½ Tr M| ≤ 1.</p>
          <p class="help">det M = 1 is the Wronskian, and nothing in the propagation imposes it — the
          panel prints how far from 1 it strays as the honest error bar on every band edge below. Try
          <b>9*(1 - cos(2*pi*x))</b> for a smooth cell, a tall narrow spike for something close to the
          delta-well case beside it, or a two-atom cell like
          <b>40*exp(-((x-0.25)/0.05)^2) + 25*exp(-((x-0.7)/0.05)^2)</b> and watch a band split in two.</p>`
        : ctlRow('barrier P', ctlSlider('sbP', 0, 25, 0.1, st.P0))) +
      `<p class="help">A row of identical wells, and nothing else — no chemistry, no interactions.
      Solving Schrödinger's equation across one period gives a condition of the form
      <b>cos(ka) = f(E)</b>. Since the left side can never leave [−1, 1], any energy where
      |f(E)| &gt; 1 is <b>forbidden</b>: there is no wave that fits.</p>
      <p class="help">Slide P to zero and the gaps close — a free electron has no gaps. Turn it up
      and they widen towards isolated atomic levels. <b>Periodicity alone opens the gaps</b>, and
      that is the whole reason solids divide into metals, semiconductors and insulators.</p>`;
  },
  wire(){
    ctWireSeg('sbMode', v => { ST.own = (v === 'own'); });
    if(ST.own) fnWire('sbCell', (m, s) => { ST.cell = s; });
    else wireSlider('sbP', () => ST.P0, v => { ST.P0 = v; }, v => fmtNum(+v, 1));
  },
  frame(st, dt, ctx, W, H){
    const Emax = 60;
    const P = mkPlot(80, 55, (W - 200) * 0.56, H - 145, -4, Emax, -3.4, 3.4);
    st.P = P;
    plotFrame(ctx, P, 'energy (arbitrary units)', 'f(E)', 'allowed only where |f(E)| ≤ 1');
    ctGrid(ctx, P);

    /* the corridor — the only values cos(ka) can take */
    ctx.fillStyle = rgbCss(TH.grad, 0.13);
    ctx.fillRect(P.X(-4), P.Y(1), P.X(Emax) - P.X(-4), P.Y(-1) - P.Y(1));
    ctPath(ctx, P, [{ x:-4, y:1 }, { x:Emax, y:1 }], rgbCss(TH.grad, 0.8), 1.6, [5, 4]);
    ctPath(ctx, P, [{ x:-4, y:-1 }, { x:Emax, y:-1 }], rgbCss(TH.grad, 0.8), 1.6, [5, 4]);

    /* the discriminant, whichever way it was obtained: a closed form for the
       delta lattice, and ½ Tr M over the cell for a typed one */
    const V = st.own ? STAGES.slBand.cellOf(st) : null;
    const fOf = st.own ? (E => slCellM(V, E, 1, 600).disc) : (E => slKronigPenney(E, st.P0));
    const bands = st.own ? STAGES.slBand.bandsOf(st).bands : slBands(st.P0, Emax);
    /* mark the allowed bands along the bottom */
    for(const b of bands){
      ctx.fillStyle = rgbCss(TH.pos, 0.5);
      ctx.fillRect(P.X(b.lo), P.Y(-3.05), Math.max(1, P.X(b.hi) - P.X(b.lo)), 12);
    }
    plotCurve(ctx, P, E => Math.max(-3.4, Math.min(3.4, fOf(E))), st.own ? 420 : 1400,
              rgbCss(TH.text), 2.2);
    /* the cell itself, inset, so the reader can see what they typed */
    if(st.own){
      let vmax = 1e-9;
      for(let i = 0; i <= 100; i++) vmax = Math.max(vmax, Math.abs(V(i / 100)));
      const C = mkPlot(P.px + 12, P.py + 10, Math.min(150, P.pw * 0.34), 66, 0, 1, -vmax * 0.12, vmax * 1.1);
      /* TH carries no `bg2` — the palette read in readTheme() is bg, line,
         line2, text, dim, faint, accent, mid and the five signal colours. */
      ctx.fillStyle = rgbCss(TH.bg, 0.88);
      ctx.fillRect(C.px - 6, C.py - 14, C.pw + 12, C.ph + 22);
      plotCurve(ctx, C, x => V(x), 160, rgbCss(TH.curl), 2);
      ctText(ctx, C.px, C.py - 3, 'one cell of V(x)', rgbCss(TH.faint), '10.5px ' + FONT_UI);
    }
    ctText(ctx, P.X(-3), P.Y(-2.55), 'green = allowed bands', rgbCss(TH.pos), '12px ' + FONT_UI);

    /* the band diagram itself, on the right */
    const P2 = mkPlot(P.px + P.pw + 90, 55, W - (P.px + P.pw + 90) - 60, H - 145, 0, 1, -4, Emax);
    plotFrame(ctx, P2, '', 'energy', 'the bands and the gaps between them');
    for(const b of bands){
      ctx.fillStyle = rgbCss(TH.pos, 0.45);
      ctx.fillRect(P2.X(0.15), P2.Y(b.hi), P2.X(0.85) - P2.X(0.15), Math.max(2, P2.Y(b.lo) - P2.Y(b.hi)));
    }
    for(let i = 0; i + 1 < bands.length; i++){
      const gap = bands[i + 1].lo - bands[i].hi;
      if(gap > 1.2)
        ctText(ctx, P2.X(0.5) - 24,
               P2.Y((bands[i].hi + bands[i + 1].lo) / 2) + 4, 'gap ' + fmtNum(gap, 2), rgbCss(TH.neg), '12px ' + FONT_UI);
    }
    stageNote(ctx, st.own
      ? 'your cell, propagated: the bands are where |½ Tr M| ≤ 1 — no closed form anywhere in this calculation'
      : 'no interaction between electrons anywhere in this calculation — the gaps are pure periodicity', W, H);
  },
  derive(st){
    const bands = st.own ? STAGES.slBand.bandsOf(st).bands : slBands(st.P0, 60);
    const n = v => fmtNum(v, 4);
    const gap = bands.length > 1 ? bands[1].lo - bands[0].hi : 0;
    return {
      title:'A gap out of nothing but repetition',
      steps:[
        drvSay('start with a free electron, which has no gaps at all',
          'E = ħ²k²/2m is a smooth parabola. Every energy above zero is available, and a solid built from free electrons would always be a metal. Something has to remove energies from that continuum, and the only ingredient we are going to add is that the lattice repeats.'),
        drvStep('the potential repeats, so Bloch\'s theorem applies',
          `ψ(${dv('x')}${dop('+')}${dv('a')}) ${dop('=')} ${dop('e')}^(${dop('i')}${dv('k')}${dv('a')})ψ(${dv('x')})`,
          'moving one period can only multiply the wavefunction by a phase'),
        drvSay('why it can only be a phase',
          'The potential is unchanged by a shift of one lattice spacing, so the shifted wavefunction must describe the same physical state. Same state means same probability density, so the factor has modulus one — and a complex number of modulus one is a phase. That is the entire content of Bloch\'s theorem.'),
        drvStep('match the wavefunction and its slope across one cell',
          `${dv('P')}${dfrac('sin α' + dv('a'), 'α' + dv('a'))} ${dop('+')} cos α${dv('a')} ${dop('=')} cos ${dv('k')}${dv('a')}`,
          `with P = ${n(st.P0)}, the barrier strength`),
        drvSay('now look at what the two sides can do',
          'The right-hand side is a cosine of a real number, so it is trapped between −1 and +1 — it has no choice. The left-hand side is a function of energy alone, and it happily runs off to ±5, ±20, wherever it likes. Wherever it strays outside the corridor there is no real k that solves the equation, so no travelling wave exists at that energy.'),
        drvStep('the forbidden energies are exactly those',
          `|${dv('f')}(${dv('E')})| ${dop('>')} 1 ${dop('⇒')} no propagating state`,
          `found ${bands.length} allowed bands below E = 60`),
        drvStep('and the first gap has a width',
          `Δ ${dop('=')} ${dv('E')}_bottom of band 2 ${dop('−')} ${dv('E')}_top of band 1`,
          bands.length > 1 ? `${n(gap)} in these units` : 'no gap at this barrier strength'),
        drvSay('which is the whole classification of solids',
          'Fill the bands with the electrons the atoms brought. If the topmost occupied band is only partly full, electrons at the top have empty states just above them and the material conducts — a metal. If a band is exactly filled, the nearest empty state is across the gap: a gap of 1 eV gives a semiconductor, 5 eV an insulator. Diamond and copper differ by where the electrons stop, not by anything about the electrons.')
      ],
      note:'Set P = 0 and every gap closes: the free-electron parabola comes back and f(E) = cos(√E·a) never leaves the corridor. The gaps are not caused by the strength of the potential but by its repetition — a weak periodic potential still opens gaps, just narrow ones.'
    };
  },
  readout(st){
    const own = st.own ? STAGES.slBand.bandsOf(st) : null;
    const bands = own ? own.bands : slBands(st.P0, 60);
    const n = v => fmtNum(v, 4);
    return (own ? `<div class="card tight"><div class="ttl">Your cell, propagated</div>
      ${kv('V(x) over one period', pkPretty(st.cell))}
      ${kv('the condition', 'cos(ka) = ½ Tr M(E)')}
      ${kv('|det M − 1|, worst over the scan', fmtNum(own.worstDet, 3))}
      <p class="help">There is no closed form for this cell, so the discriminant is obtained by
      propagating ψ across one period and taking the trace of the 2×2 matrix that results. det M = 1 is
      the Wronskian and <b>nothing in that propagation imposes it</b> — the row above is how far it
      strayed, and it is the honest error bar on every band edge below. Slide the cell towards a tall
      narrow spike and compare with the delta-well case: the unit suite checks that the two agree in
      the limit, and that the error falls at first order as the spike narrows.</p>
    </div>` : '') +
      `<div class="card tight"><div class="ttl">${own ? 'Bands found' : 'Bands found, at P = ' + fmtNum(st.P0, 1)}</div>
      ${kv('allowed bands below E = 60', String(bands.length))}
      ${bands.slice(0, 5).map((b, i) =>
        kv('band ' + (i + 1), b.cut
          ? n(b.lo) + ' → beyond the plotted range'
          : n(b.lo) + ' → ' + n(b.hi) + '  (width ' + n(b.hi - b.lo) + ')')).join('')}
      <p class="help">The bands are located by scanning the condition, not read from a table. Notice
      that they get <b>wider</b> as you go up: a fast electron is less bothered by the lattice, which
      is why high-energy bands merge back towards a free-electron continuum.</p>
    </div>
    <div class="card tight"><div class="ttl">The gaps</div>
      ${bands.slice(0, 4).map((b, i) => i + 1 < bands.length
        ? kv('gap ' + (i + 1), n(bands[i + 1].lo - b.hi)) : '').join('')}
      ${kv('barrier strength P', fmtNum(st.P0, 2))}
      <p class="help">${st.P0 < 0.05
        ? 'At P = 0 the gaps have vanished entirely. This is a free electron, and a solid made of these would be a metal no matter how many electrons it had.'
        : 'Raise P and the bands narrow towards isolated atomic levels; lower it and they broaden towards free electrons. Every real solid sits somewhere on that line.'}</p>
    </div>
    <div class="card tight"><div class="ttl">What the gap decides</div>
      ${kv('Si', '1.12 eV — semiconductor')}
      ${kv('Ge', '0.66 eV — semiconductor, leaky')}
      ${kv('GaN', '3.40 eV — wide gap')}
      ${kv('diamond', '5.5 eV — insulator')}
      ${kv('copper', 'band half-filled — metal')}
      <p class="help">Diamond and silicon have the same crystal structure and the same four valence
      electrons. The only difference that matters is the size of the gap, and it is the difference
      between a gemstone and a transistor.</p>
    </div>`;
  },
  chip(st){
    const b = st.own ? STAGES.slBand.bandsOf(st).bands : slBands(st.P0, 60);
    return `<div class="k">${st.own ? 'your cell' : 'P = ' + fmtNum(st.P0, 1)}</div><div>${b.length} bands, first gap ${b.length > 1 ? fmtNum(b[1].lo - b[0].hi, 2) : '—'}</div>`;
  }
};

/* ------------------------------------------------------------------------- */
/* the doping and temperature ladders the two sweeps are drawn on */
const SL_SEMI_ND = Array.from({ length:26 }, (_, i) => Math.pow(10, 14 + 7 * i / 25));
const SL_SEMI_TT = Array.from({ length:22 }, (_, i) => Math.pow(10, 1 + 1.78 * i / 21));

STAGES.slSemi = {
  title:'Doping, carriers and the p–n junction',
  legend(st){
    if(st && st.own)
      return [['var(--c-grad)', 'np ÷ nᵢ² — the law of mass action, on your numbers'],
              ['var(--c-neg)', 'Boltzmann ÷ Fermi — how far the exponential over-counts'],
              ['var(--c-curl)', 'the ionised fraction of your donors'],
              ['var(--c-warn)', 'where your material sits on each sweep'],
              ['var(--text)', 'the value 1, which both laws claim']];
    return [['var(--c-grad)', 'the conduction band edge'],
            ['var(--c-curl)', 'the valence band edge'],
            ['var(--c-warn)', 'the depletion layer, and the bias marker'],
            ['var(--c-neg)', 'the p side'],
            ['var(--c-pos)', 'the n side'],
            ['var(--text)', 'the diode I–V curve']]; },
  dockLegend:true,
  enter(st, o){
    st.i = o.i || 0;
    st.T = o.T || 300;
    st.logNd = o.logNd || 16;
    st.logNa = o.logNa || 16;
    st.V = 0;
    st.own = !!o.own;
    st.sheet = o.sheet ||
      'Eg   1.12\nmc   1.08\nmv   0.56\nEd   45\nEa   45\nNd   1e17\nNa   1e15\neps  11.7';
    st.sheetErr = '';
  },
  /* Fifty-five solves per edit — each one a bisection on charge neutrality whose
     every step evaluates two Fermi–Dirac integrals by quadrature. That is a few
     tenths of a second, and `readout` runs four times a second, so it is keyed
     on the sheet and the temperature and on nothing else. */
  semiOf(st){
    const key = st.sheet + '|' + st.T;
    if(st._mk === key) return st._md;
    st._mk = key;
    const P = slParseSemi(st.sheet);
    if(!P.ok){ st._md = { ok:false, P }; return st._md; }
    const M = P.M;
    const S = slSemiSolve(M, st.T);
    if(!S.ok){ st._md = { ok:false, P, why:S.why }; return st._md; }
    /* the two sweeps the picture is made of: doping at this temperature, and
       temperature at this doping */
    const byN = SL_SEMI_ND.map(nd => ({ nd, S:slSemiSolve({ ...M, nd, na:0 }, st.T) }))
                          .filter(r => r.S.ok);
    const byT = SL_SEMI_TT.map(T => ({ T, S:slSemiSolve(M, T) })).filter(r => r.S.ok);
    st._md = { ok:true, P, M, S, J:slSemiJunction(M, st.T), byN, byT,
               Nc:slSemiNc(M.mc, st.T), Nv:slSemiNc(M.mv, st.T) };
    return st._md;
  },
  controlsOwn(){
    const st = ST;
    return `<div class="fld" style="align-items:stretch">
        <textarea id="ssSheet" rows="8" spellcheck="false" autocomplete="off"
          aria-label="a material sheet — one property per line: name then number"
          data-audit="Eg 0.66&#10;mc 0.56&#10;mv 0.29&#10;Ed 10&#10;Ea 11&#10;Nd 5e16&#10;Na 1e15&#10;eps 16"
          style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.sheet)}</textarea>
      </div>
      <div class="row wrap">${ctBtn('ssGo', 'Solve it')}</div>
      <p class="help" id="ssMsg" style="color:${st.sheetErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.sheetErr ||
        'One property per line. <b>Eg</b> the gap in eV, <b>mc</b> and <b>mv</b> the density-of-states ' +
        'effective masses in units of m<sub>e</sub>, <b>Ed</b> and <b>Ea</b> the dopant levels in meV ' +
        'from their band edges, <b>Nd</b> and <b>Na</b> the doping in cm⁻³, <b>eps</b> the relative ' +
        'permittivity. Anything left out keeps its silicon value. Write <b>Ed 0</b> to say the donor ' +
        'level has merged with the band, which is what happens above the Mott density.'}</p>` +
      ctlRow('T (K)', ctlSlider('ssT', 10, 600, 1, st.T)) +
      `<p class="help">N<sub>c</sub> and N<sub>v</sub> are computed from your effective masses —
      2(2πm*kT/h²)^(3/2), not read from a table — so every published N<sub>c</sub> in the preset list is
      reachable, and reproducing them is the anchor.</p>
      <p class="help">Three things the preset stage assumes are computed both ways here. The carrier
      densities come from <b>Fermi–Dirac integrals</b> with the Fermi level bisected out of charge
      neutrality, and separately from the <b>Boltzmann exponentials</b> the textbook formulae use.
      <b>np = n<sub>i</sub>²</b> follows from the exponentials and fails with them: dope heavily enough
      that E<sub>F</sub> enters the band and the panel shows np falling measurably below n<sub>i</sub>².
      <b>Complete ionisation</b> is not assumed either — a donor holds its electron with probability
      1/(1+2e^((E_F−E_d)/kT)), and cooling your material below about 50 K takes most of the carriers
      away. And <b>V_bi = kT·ln(N<sub>d</sub>N<sub>a</sub>/n<sub>i</sub>²)</b> is checked against the
      difference of two separately solved Fermi levels.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('ssM', st.own ? 'own' : 'list',
                      [['list', 'a material from the list'], ['own', 'write your own material']]);
    if(st.own) return seg + STAGES.slSemi.controlsOwn();
    return seg + ctSeg('ssI', String(st.i), SL_SEMI.map((m, i) => [String(i), m.s])) +
      ctlRow('T (K)', ctlSlider('ssT', 150, 600, 1, st.T)) +
      ctlRow('log Nd', ctlSlider('ssD', 13, 19, 0.1, st.logNd)) +
      ctlRow('log Na', ctlSlider('ssA', 13, 19, 0.1, st.logNa)) +
      ctlRow('bias V', ctlSlider('ssV', -5, 0.6, 0.01, st.V)) +
      `<p class="help">A pure semiconductor is a poor conductor. Add one impurity atom per
      <b>ten million</b> and the conductivity rises by orders of magnitude — that is the entire
      technology, and the sliders are in powers of ten because nothing else would fit.</p>
      <p class="help">Put n-type against p-type and electrons diffuse across, leaving bare ions
      behind. The exposed charge builds a field that stops further diffusion, and the region it sits
      in is the <b>depletion layer</b>. Forward bias shrinks it and current flows; reverse bias
      widens it and it does not. That asymmetry is a diode.</p>`;
  },
  wire(){
    ctWireSeg('ssM', v => { ST.own = (v === 'own'); });
    ctWireSeg('ssI', v => { ST.i = +v; });
    wireSlider('ssT', () => ST.T, v => { ST.T = Math.round(v); }, v => Math.round(+v) + ' K');
    wireSlider('ssD', () => ST.logNd, v => { ST.logNd = v; }, v => '10^' + fmtNum(+v, 1) + ' cm⁻³');
    wireSlider('ssA', () => ST.logNa, v => { ST.logNa = v; }, v => '10^' + fmtNum(+v, 1) + ' cm⁻³');
    wireSlider('ssV', () => ST.V, v => { ST.V = v; }, v => fmtNum(+v, 2) + ' V');
    if(!ST.own) return;
    const apply = () => {
      const box = $('ssSheet'); if(!box) return;
      ST.sheet = box.value;
      const D = STAGES.slSemi.semiOf(ST);
      ST.sheetErr = D.ok ? '' :
        '⚠ ' + (D.P.ok
          ? String(D.why || 'this material has no neutral solution')
          : D.P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ')) +
        '<br><span style="color:var(--faint)">The previous material is still shown.</span>';
      const msg = $('ssMsg');
      if(msg){
        msg.innerHTML = ST.sheetErr || ('Solved: E_F at ' + fmtNum(D.S.EF, 5) +
          ' eV above the valence edge, n = ' + D.S.n.toExponential(3) + ' cm⁻³.');
        msg.style.color = ST.sheetErr ? 'var(--c-neg)' : 'var(--faint)';
      }
      refreshStageReadout(); updateStageChip(); updateStageLegend();
    };
    const b = $('ssSheet'); if(b) b.addEventListener('change', apply);
    const g = $('ssGo'); if(g) g.addEventListener('click', apply);
  },
  /* Two sweeps, because the two laws fail along two different axes: mass action
     fails with DOPING, and complete ionisation fails with TEMPERATURE. Each
     panel plots the ratio the textbook says is one, and marks where the
     reader's own material sits on it. */
  frameOwn(st, dt, ctx, W, H){
    const D = STAGES.slSemi.semiOf(st);
    const px = 78, top = 84;
    const aw = Math.max(60, W - px - 96), ah = Math.max(60, H - top - 92);
    if(!D.ok){
      const P = mkPlot(px, top, aw, ah, 0, 1, 0, 1);
      plotFrame(ctx, P, '', '', 'this material cannot be solved');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 - 8, 'the sheet does not read',
             rgbCss(TH.neg), '600 14px ' + FONT_UI, 'center');
      const first = D.P.ok ? String(D.why || '') : (D.P.errs[0] ? D.P.errs[0].msg : '');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 16, first.replace(/<[^>]*>/g, '').slice(0, 100),
             rgbCss(TH.dim), '12px ' + FONT_UI, 'center');
      return;
    }
    const wide = W >= 800 && aw >= 460;
    const gapPx = wide ? 66 : 54;
    const bw = wide ? (aw - gapPx) / 2 : aw;
    const bh = wide ? ah : (ah >= 340 ? (ah - gapPx) / 2 : ah);
    /* PANEL ONE — mass action and the Boltzmann over-count, against doping */
    let ymax = 1.25;
    for(const r of D.byN) ymax = Math.max(ymax, Math.min(4, r.S.nBoltz / Math.max(1e-300, r.S.n)));
    const P = mkPlot(px, top, bw, bh, 14, 21, 0, ymax * 1.08);
    st.P = P;
    plotFrame(ctx, P, 'log₁₀ of the donor density (cm⁻³)', 'ratio the textbook says is 1',
              'where the law of mass action stops being a law');
    ctGrid(ctx, P, 1);
    ctPath(ctx, P, [{ x:14, y:1 }, { x:21, y:1 }], rgbCss(TH.text, 0.75), 1.6, [6, 4]);
    ctPath(ctx, P, D.byN.map(r => ({ x:Math.log10(r.nd), y:r.S.mass })), rgbCss(TH.grad), 2.6);
    ctPath(ctx, P, D.byN.map(r => ({ x:Math.log10(r.nd),
      y:Math.min(ymax * 1.08, r.S.nBoltz / Math.max(1e-300, r.S.n)) })), rgbCss(TH.neg), 2.4, [5, 4]);
    if(D.M.nd > 0){
      const lx = Math.min(21, Math.max(14, Math.log10(D.M.nd)));
      ctPath(ctx, P, [{ x:lx, y:0 }, { x:lx, y:P.y1 }], rgbCss(TH.warn), 1.8, [4, 3]);
      ctText(ctx, P.X(lx) + 6, P.py + 16, 'your Nd', rgbCss(TH.warn), '11px ' + FONT_UI);
    }
    ctText(ctx, P.px + 10, P.py + 18, 'np ÷ nᵢ²', rgbCss(TH.grad), '11px ' + FONT_UI);
    ctText(ctx, P.px + 10, P.py + 33, 'Boltzmann ÷ Fermi', rgbCss(TH.neg), '11px ' + FONT_UI);
    /* PANEL TWO — ionisation against temperature */
    const Q0 = wide ? mkPlot(px + bw + gapPx, top, bw, bh, 0, 1, 0, 1)
                    : (ah >= 340 ? mkPlot(px, top + bh + gapPx, aw, bh, 0, 1, 0, 1) : null);
    if(!Q0){
      stageNote(ctx, 'both curves are 1 while the Boltzmann limit holds, and leave it together', W, H);
      return;
    }
    const Q = mkPlot(Q0.px, Q0.py, Q0.pw, Q0.ph, 1, 2.78, 0, 1.1);
    plotFrame(ctx, Q, 'log₁₀ of the temperature (K)', 'fraction of donors ionised',
              'where complete ionisation stops being complete');
    ctGrid(ctx, Q, 0.5);
    ctPath(ctx, Q, [{ x:1, y:1 }, { x:2.78, y:1 }], rgbCss(TH.text, 0.75), 1.6, [6, 4]);
    ctPath(ctx, Q, D.byT.map(r => ({ x:Math.log10(r.T), y:r.S.ionD })), rgbCss(TH.curl), 2.6);
    const lt = Math.min(2.78, Math.max(1, Math.log10(st.T)));
    ctPath(ctx, Q, [{ x:lt, y:0 }, { x:lt, y:1.1 }], rgbCss(TH.warn), 1.8, [4, 3]);
    ctText(ctx, Q.X(lt) + 6, Q.py + 16, st.T + ' K', rgbCss(TH.warn), '11px ' + FONT_UI);
    ctDot(ctx, Q, lt, D.S.ionD, 4.6, rgbCss(TH.curl), rgbCss(TH.bg));
    ctText(ctx, Q.px + 10, Q.py + 18, 'N_d⁺ ÷ N_d, solved', rgbCss(TH.curl), '11px ' + FONT_UI);
    stageNote(ctx, 'both dashed lines are the value the textbook formulae assume — ' +
                   'the curves are what charge neutrality actually gives', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.slSemi.frameOwn(st, dt, ctx, W, H);
    const M = SL_SEMI[st.i];
    const Nd = Math.pow(10, st.logNd), Na = Math.pow(10, st.logNa);
    const J = slJunction(M, st.T, Nd, Na);
    const Wn = J.widthAt(st.V);
    const um = 1e6;
    const half = Math.max(0.35, J.W * um * 1.6);
    const P = mkPlot(80, 55, W - 170, (H - 175) * 0.52, -half, half, -0.15, M.Eg + 0.3);
    st.P = P;
    plotFrame(ctx, P, 'position (µm)', 'band energy (eV)',
              'the bands bend by exactly the built-in potential');

    /* the bands, bent across the depletion region */
    const bend = Math.max(0, J.Vbi - st.V);
    const xn = Wn * um * J.xn / Math.max(1e-30, J.W), xp = Wn * um * J.xp / Math.max(1e-30, J.W);
    /* Solving Poisson's equation across the depletion layer with a constant
       ionised charge on each side gives a parabola on each side, joined at the
       junction. The share of the total bend each side takes is set by charge
       balance (N_a·x_p = N_d·x_n), which makes it x_p/(x_p+x_n). */
    const fp = xp / Math.max(1e-12, xp + xn);
    const band = (x, off) => {
      if(x <= -xp) return off + bend;
      if(x >= xn)  return off;
      if(x < 0){
        const u = (x + xp) / Math.max(1e-12, xp);
        return off + bend - bend * fp * u * u;
      }
      const u = (xn - x) / Math.max(1e-12, xn);
      return off + bend * (1 - fp) * u * u;
    };
    ctPath(ctx, P, Array.from({ length:240 }, (_, i) => {
      const x = -half + 2 * half * i / 239;
      return { x, y:band(x, M.Eg * 0.55) };
    }), rgbCss(TH.grad), 2.6);
    ctPath(ctx, P, Array.from({ length:240 }, (_, i) => {
      const x = -half + 2 * half * i / 239;
      return { x, y:band(x, M.Eg * 0.55) - M.Eg };
    }), rgbCss(TH.curl), 2.6);
    ctText(ctx, P.X(-half) + 8, P.Y(M.Eg * 0.55 + bend + 0.12), 'conduction band', rgbCss(TH.grad), '12px ' + FONT_UI);
    ctText(ctx, P.X(-half) + 8, P.Y(M.Eg * 0.55 - M.Eg + bend - 0.02), 'valence band', rgbCss(TH.curl), '12px ' + FONT_UI);

    /* the depletion region */
    ctx.fillStyle = rgbCss(TH.warn, 0.13);
    ctx.fillRect(P.X(-xp), P.py, Math.max(1, P.X(xn) - P.X(-xp)), P.ph);
    ctPath(ctx, P, [{ x:-xp, y:-0.15 }, { x:-xp, y:M.Eg + 0.3 }], rgbCss(TH.warn, 0.6), 1.4, [4, 3]);
    ctPath(ctx, P, [{ x:xn, y:-0.15 }, { x:xn, y:M.Eg + 0.3 }], rgbCss(TH.warn, 0.6), 1.4, [4, 3]);
    ctText(ctx, P.X(-half * 0.75), P.py + 16, 'p-type', rgbCss(TH.neg), '13px ' + FONT_UI);
    ctText(ctx, P.X(half * 0.6), P.py + 16, 'n-type', rgbCss(TH.pos), '13px ' + FONT_UI);

    /* the I–V curve underneath — the diode equation */
    const P2 = mkPlot(80, P.py + P.ph + 62, W - 170, H - (P.py + P.ph + 62) - 62, -5, 0.8, -2, 20);
    plotFrame(ctx, P2, 'bias V', 'current (arb.)', 'the Shockley diode equation');
    ctGrid(ctx, P2);
    plotCurve(ctx, P2, v => Math.max(-2, Math.min(20, slDiode(v, 1e-9, st.T, 1) * 1e9)), 600,
              rgbCss(TH.text), 2.6);
    ctPath(ctx, P2, [{ x:st.V, y:-2 }, { x:st.V, y:20 }], rgbCss(TH.warn), 2, [4, 3]);
    stageNote(ctx, 'forward bias lowers the hill and current climbs exponentially; reverse bias raises it and almost nothing flows', W, H);
  },
  deriveOwn(st){
    const D = STAGES.slSemi.semiOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 5) : 'not defined here');
    if(!D.ok) return {
      title:'This material cannot be solved',
      steps:[drvSay('what the sheet has to say',
        'One property per line, a name then a number. ' + (D.P.ok
          ? String(D.why || '')
          : 'Fix the lines listed under the sheet.') +
        ' Every quantity below is defined relative to a Fermi level, and the Fermi level comes from charge neutrality — so nothing is computed until the material reads.')],
      note:'The previous material is still drawn, so the picture does not blank while you type.'
    };
    const S = D.S, J = D.J;
    return {
      title:'Three laws, and the limit all three of them live in',
      steps:[
        drvStep('the band-edge densities of states, from your effective masses',
          `${dv('N')}_c ${dop('=')} 2(${dfrac('2π' + dv('m') + '*' + dv('k') + dv('T'), dv('h') + '²')})^(3/2)`,
          `N_c = ${D.Nc.toExponential(4)} cm⁻³, N_v = ${D.Nv.toExponential(4)} cm⁻³ at ${st.T} K`),
        drvSay('these are computed rather than looked up, and that is the anchor',
          'Every material in the preset list quotes an N_c and an N_v. Feed the effective mass that produces one of them back through the formula above and it comes back exactly — which is what makes the numbers for a material nobody tabulated worth reading. Silicon\'s conduction density-of-states mass comes out at 1.08 m_e, which is the published value.'),
        drvStep('the Fermi level, from charge neutrality',
          `${dv('n')}(${dv('E')}_F) ${dop('−')} ${dv('p')}(${dv('E')}_F) ${dop('+')} ${dv('N')}_a⁻(${dv('E')}_F) ${dop('−')} ${dv('N')}_d⁺(${dv('E')}_F) ${dop('=')} 0`,
          `bisected: E_F = ${n(S.EF)} eV above the valence edge, residual ${S.resid.toExponential(2)}`),
        drvSay('why this is a root-find and not a formula',
          'The textbook route assumes which term dominates — n ≈ N_d for an n-type sample — and then solves a quadratic. That is a good approximation in the middle of the doping range and it is an approximation. Here the left-hand side is strictly decreasing in E_F, so the root is unique and bisection cannot be fooled, and no term is assumed to dominate anything.'),
        drvStep('the carriers, by the Fermi–Dirac integral',
          `${dv('n')} ${dop('=')} ${dv('N')}_c ${dfrac('2', '√π')}${dv('F')}_(1/2)(η) , &nbsp; η ${dop('=')} ${dfrac(dv('E') + '_F − ' + dv('E') + '_c', dv('k') + dv('T'))}`,
          `η = ${n(S.etaC)}, giving n = ${S.n.toExponential(4)} cm⁻³`),
        drvStep('and the same thing by the Boltzmann exponential',
          `${dv('n')} ${dop('≈')} ${dv('N')}_c ${dop('e')}^η`,
          `${S.nBoltz.toExponential(4)} cm⁻³ — ${n(S.nBoltz / Math.max(1e-300, S.n))}× the integral`),
        drvSay('the exponential is the TAIL of the integral, not the integral',
          'F_(1/2)(η) → e^η only when η is several units negative, which is to say when the Fermi level sits well inside the gap. Push it towards the band edge and the exponential over-counts, because it goes on counting states that the exclusion principle has already filled. That is the entire content of the word "degenerate".'),
        drvStep('so the law of mass action is a limit, not a law',
          `${dv('n')}${dv('p')} ${dop('=')} ${dv('n')}_i² &nbsp;⟸&nbsp; both densities Boltzmann`,
          `here np ÷ nᵢ² = ${n(S.mass)}${S.mass < 0.98 ? ' — measurably below one' : ''}`),
        drvSay('np = nᵢ² is a cancellation, and cancellations have conditions',
          'Multiply N_c e^((E_F−E_c)/kT) by N_v e^((E_v−E_F)/kT) and the Fermi level cancels, leaving N_c N_v e^(−E_g/kT) — a number that depends on the material and the temperature and not on the doping. That is why the law is so useful. It is also why it fails exactly when the exponentials do, and the left-hand panel shows where.'),
        drvStep('and the dopants are not all ionised either',
          `${dv('N')}_d⁺ ${dop('=')} ${dfrac(dv('N') + '_d', '1 + 2' + dop('e') + '^((' + dv('E') + '_F − ' + dv('E') + '_d)/' + dv('k') + dv('T') + ')')}`,
          `${fmtNum(100 * S.ionD, 4)}% ionised at ${st.T} K with a ${fmtNum(D.M.ed, 4)} meV donor`),
        drvSay('which is why cryogenic electronics is difficult',
          'The factor of 2 is the spin degeneracy of the donor level; an acceptor in a doubly degenerate valence band gets 4. Cool the material and E_F climbs towards the donor level, the exponential collapses, and the donors take their electrons back. Below about 50 K in silicon most of the carriers have gone — the right-hand panel is that curve, and it is a property of your material rather than a rule.'),
        drvStep('and the built-in potential, from two solved sides',
          `${dv('V')}_bi ${dop('=')} ${dv('E')}_F^n ${dop('−')} ${dv('E')}_F^p &nbsp;versus&nbsp; ${dv('k')}${dv('T')} ln${dfrac(dv('N') + '_d' + dv('N') + '_a', dv('n') + '_i²')}`,
          J.ok ? `${n(J.solved)} V solved against ${n(J.closed)} V from the logarithm — ${(100 * J.rel).toFixed(3)}% apart`
               : 'one side has no neutral solution')
      ],
      note:'The logarithm is the difference of two Boltzmann Fermi levels, so it inherits their limit. At degenerate doping on both sides it can hand you a built-in potential larger than the gap — which is not absurd, it is an Esaki diode, but the number it gives is not the right one. The solved value is, and the two are printed together.'
    };
  },
  derive(st){
    if(st.own) return STAGES.slSemi.deriveOwn(st);
    const M = SL_SEMI[st.i];
    const Nd = Math.pow(10, st.logNd), Na = Math.pow(10, st.logNa);
    const C = slCarriers(M, st.T, Nd, 0);
    const J = slJunction(M, st.T, Nd, Na);
    const n = v => fmtNum(v, 5);
    return {
      title:'From a gap to a diode',
      steps:[
        drvStep('at any temperature some electrons cross the gap',
          `${dv('n')}ᵢ ${dop('=')} √(${dv('N')}𝒸${dv('N')}ᵥ)·${dop('e')}^(−${dv('E')}_g/2${dv('k')}T)`,
          `${M.s} at ${st.T} K: nᵢ = ${slNi(M, st.T).toExponential(4)} cm⁻³`),
        drvSay('note where the factor of two comes from',
          'It is Eg/2kT, not Eg/kT, because creating a carrier makes a pair — one electron in the conduction band and one hole in the valence band — and the Fermi level sits midway. That halving is why a 1.1 eV gap is workable at room temperature when Eg/kT alone would suggest it is hopeless.'),
        drvStep('the law of mass action holds however you dope it',
          `${dv('n')}${dv('p')} ${dop('=')} ${dv('n')}ᵢ²`,
          `always — adding electrons suppresses holes by exactly the same factor`),
        drvStep('with charge neutrality, that fixes both',
          `${dv('n')} ${dop('−')} ${dfrac(dv('n') + 'ᵢ²', dv('n'))} ${dop('=')} ${dv('N')}_d ${dop('−')} ${dv('N')}_a`,
          `n = ${C.n.toExponential(4)} cm⁻³, p = ${C.p.toExponential(4)} cm⁻³`),
        drvSay('why the textbook shortcut n ≈ Nd usually works',
          `Doping at 10^${fmtNum(st.logNd, 1)} against an intrinsic level of ${slNi(M, st.T).toExponential(2)} means the impurities outnumber the thermally generated carriers by a huge factor, and the quadratic collapses to n = Nd. It stops working when the two become comparable — at high temperature, or in a narrow-gap material. This panel solves the quadratic exactly so you can watch the approximation fail.`),
        drvStep('join n-type to p-type and the Fermi levels must line up',
          `${dv('V')}_bi ${dop('=')} ${dfrac(dv('k') + 'T', dop('e'))} ln ${dfrac(dv('N') + '_d' + dv('N') + '_a', dv('n') + 'ᵢ²')}`,
          `${n(J.Vbi)} V`),
        drvSay('nothing is applied — this voltage builds itself',
          'Electrons on the n side diffuse towards the p side simply because there are more of them there. Each one that leaves strands a positive donor ion. The exposed charge creates a field that opposes further diffusion, and equilibrium is where drift exactly cancels diffusion. You cannot measure Vbi with a voltmeter: the contacts develop their own offsets that cancel it exactly, as thermodynamics demands.'),
        drvStep('Poisson\'s equation gives the width of the stripped region',
          `${dv('W')} ${dop('=')} √( ${dfrac('2ε' + dv('V') + '_bi', dop('e'))}(${dfrac('1', dv('N') + '_d')} ${dop('+')} ${dfrac('1', dv('N') + '_a')}) )`,
          `W = ${fmtNum(J.W * 1e9, 4)} nm, peak field ${(J.Emax / 1e5).toFixed(3)} × 10⁵ V/m`),
        drvStep('and bias changes it',
          `${dv('W')}(${dv('V')}) ${dop('=')} ${dv('W')}₀√(1 ${dop('−')} ${dv('V')}/${dv('V')}_bi)`,
          `at V = ${fmtNum(st.V, 2)} V: ${fmtNum(J.widthAt(st.V) * 1e9, 4)} nm`),
        drvStep('the current is the barrier the carriers must climb',
          `${dv('I')} ${dop('=')} ${dv('I')}ₛ(${dop('e')}^(${dop('e')}${dv('V')}/${dv('k')}T) ${dop('−')} 1)`,
          `at ${fmtNum(st.V, 2)} V the exponential factor is ${fmtNum(Math.exp(st.V / (SL_KBEV * st.T)), 6)}`)
      ],
      note:'Forward bias reduces the hill, so exponentially more carriers have enough thermal energy to cross. Reverse bias raises it, and the only current left is the few pairs generated inside the depletion region. The rectification is exponential in one direction and flat in the other, and that asymmetry is where all of electronics starts.'
    };
  },
  readoutOwn(st){
    const D = STAGES.slSemi.semiOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 5 : d) : 'not defined here');
    if(!D.ok) return `<div class="card tight"><div class="ttl">This material cannot be solved</div>
      ${D.P.ok
        ? kv('', esc(String(D.why || 'charge neutrality has no solution in the search window')))
        : D.P.errs.slice(0, 6).map(e => kv(e.line ? 'line ' + e.line : '', e.msg)).join('')}
      <p class="help">One property per line — a name, then a number. Anything you leave out keeps its
      silicon value, so a sheet reading just <b>Eg 0.66</b> is a legal material. Nothing below is
      computed until the whole sheet reads, because a Fermi level solved from a partly-read material
      is not a Fermi level with a gap in it; it is a different material's.</p></div>`;
    const M = D.M, S = D.S, J = D.J;
    const boltzOver = S.nBoltz / Math.max(1e-300, S.n);
    return `<div class="card tight"><div class="ttl">Your material at ${st.T} K</div>
      ${kv('band gap', n(M.eg, 4) + ' eV')}
      ${kv('effective masses m_c, m_v', n(M.mc, 4) + ', ' + n(M.mv, 4) + ' m_e')}
      ${kv('N_c, computed from m_c', D.Nc.toExponential(4) + ' cm⁻³')}
      ${kv('N_v, computed from m_v', D.Nv.toExponential(4) + ' cm⁻³')}
      ${kv('doping N_d, N_a', M.nd.toExponential(3) + ', ' + M.na.toExponential(3) + ' cm⁻³')}
      ${kv('dopant levels E_d, E_a', (M.ed <= 0 ? 'merged with the band' : n(M.ed, 4) + ' meV') + ',  ' +
                                     (M.ea <= 0 ? 'merged with the band' : n(M.ea, 4) + ' meV'))}
      ${kv('intrinsic nᵢ', S.ni.toExponential(4) + ' cm⁻³')}
      <p class="help">N<sub>c</sub> and N<sub>v</sub> are <b>computed</b> from the masses by
      2(2πm*kT/h²)^(3/2) rather than read from a table. That is what makes a material nobody tabulated
      worth reading — and feeding silicon's published N<sub>c</sub> backwards through the same formula
      returns an effective mass of 1.08 m<sub>e</sub>, which is the published one.</p>
    </div>
    <div class="card tight"><div class="ttl">The Fermi level, solved</div>
      ${kv('E_F above the valence edge', n(S.EF, 8) + ' eV')}
      ${kv('η at the conduction edge', n(S.etaC, 5) + ' kT')}
      ${kv('η at the valence edge', n(S.etaV, 5) + ' kT')}
      ${kv('neutrality residual', S.resid.toExponential(2) + ' cm⁻³')}
      ${kv('verdict', S.degenerate ? 'DEGENERATE — the level is in or near a band' : 'non-degenerate — the level is well inside the gap')}
      <p class="help">Bisected on n − p + N<sub>a</sub>⁻ − N<sub>d</sub>⁺ = 0, which is strictly
      decreasing in E<sub>F</sub>, so the root is unique. No term is assumed to dominate — the usual
      "n ≈ N<sub>d</sub>" is a consequence here, not an input, and the residual above is how well the
      equation is actually satisfied.</p>
    </div>
    <div class="card tight"><div class="ttl">Two routes to the carriers</div>
      ${kv('n, by the Fermi–Dirac integral', S.n.toExponential(5) + ' cm⁻³')}
      ${kv('n, by the Boltzmann exponential', S.nBoltz.toExponential(5) + ' cm⁻³')}
      ${kv('the exponential over-counts by', n(boltzOver, 6) + '×')}
      ${kv('p, by the integral', S.p.toExponential(5) + ' cm⁻³')}
      ${kv('np', S.np.toExponential(5))}
      ${kv('nᵢ²', S.niSq.toExponential(5))}
      ${kv('np ÷ nᵢ² — the law of mass action', n(S.mass, 8))}
      <p class="help">${S.mass > 0.99
        ? 'The two routes agree and np comes back to nᵢ² to five figures, which is the mass-action law <b>holding</b> — and it is a result, because one route is a quadrature over the Fermi–Dirac occupation and the other is the exponential tail of that same integral. Raise the doping until E<sub>F</sub> reaches the band edge and watch the agreement go.'
        : 'The two routes have parted company. np is <b>' + fmtNum(100 * (1 - S.mass), 2) + '% below</b> nᵢ², which the mass-action law says cannot happen — and it cannot, in the limit the law is derived in. Your material is degenerate: the Fermi level has entered a band, the exponential goes on counting states the exclusion principle has already filled, and the cancellation that produces nᵢ² no longer cancels.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Ionisation — not assumed</div>
      ${kv('donors ionised', fmtNum(100 * S.ionD, 5) + '%')}
      ${kv('acceptors ionised', fmtNum(100 * S.ionA, 5) + '%')}
      ${kv('N_d⁺', S.ndIon.toExponential(4) + ' cm⁻³')}
      ${kv('N_a⁻', S.naIon.toExponential(4) + ' cm⁻³')}
      <p class="help">${S.merged
        ? 'You have written a dopant level of zero, meaning it has <b>merged with the band</b> — which is what happens above the Mott density, where the impurity wavefunctions overlap and the discrete level broadens into an impurity band. The occupancy formula below stops describing anything there, so the dopants are taken as fully ionised.'
        : (S.ionD > 0.98
          ? 'Nearly every donor has given up its electron, which is the "complete ionisation" every textbook formula assumes. It is an assumption, and the right-hand panel shows the temperature at which it stops being true for <i>this</i> donor depth.'
          : 'Only ' + fmtNum(100 * S.ionD, 1) + '% of your donors are ionised — the rest are holding their electrons. This is <b>carrier freeze-out</b>, and it is why cooling a semiconductor does not simply make it a better conductor, and why cryogenic electronics is difficult.')}</p>
    </div>
    <div class="card tight"><div class="ttl">The junction, from two solved sides</div>
      ${J.ok ? kv('V_bi, from E_F(n side) − E_F(p side)', n(J.solved, 6) + ' V') +
               kv('V_bi, from kT·ln(NdNa/nᵢ²)', n(J.closed, 6) + ' V') +
               kv('they differ by', Number.isFinite(J.rel) ? fmtNum(100 * J.rel, 4) + '%' : '—') +
               kv('against the band gap', n(M.eg, 4) + ' eV')
             : kv('', esc(String(J.why || 'one side has no neutral solution')))}
      <p class="help">${J.ok && Number.isFinite(J.rel) && J.rel < 0.02
        ? 'The logarithm is the difference of two Boltzmann Fermi levels, and here it agrees with the two levels solved properly — the formula earning its keep, checked rather than trusted.'
        : 'The two have parted company. The logarithm inherits the Boltzmann limit, and at degenerate doping it can return a built-in potential <b>larger than the band gap</b> — which is not absurd in itself (that is an Esaki diode, and it is why one works) but the number it gives is not the right one. The solved value is.'}</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.slSemi.readoutOwn(st);
    const M = SL_SEMI[st.i];
    const Nd = Math.pow(10, st.logNd), Na = Math.pow(10, st.logNa);
    const ni = slNi(M, st.T);
    const C = slCarriers(M, st.T, Nd, 0);
    const J = slJunction(M, st.T, Nd, Na);
    const n = v => fmtNum(v, 5);
    return `<div class="card tight"><div class="ttl">${M.s} at ${st.T} K</div>
      ${kv('band gap', M.Eg + ' eV')}
      ${kv('kT', n(SL_KBEV * st.T) + ' eV')}
      ${kv('E_g ÷ kT', fmtNum(M.Eg / (SL_KBEV * st.T), 4))}
      ${kv('intrinsic nᵢ', ni.toExponential(4) + ' cm⁻³')}
      <p class="help">${esc(M.note)}</p>
    </div>
    <div class="card tight"><div class="ttl">Doped n-type at 10^${fmtNum(st.logNd, 1)} cm⁻³</div>
      ${kv('electrons n', C.n.toExponential(4) + ' cm⁻³')}
      ${kv('holes p', C.p.toExponential(4) + ' cm⁻³')}
      ${kv('n × p', (C.n * C.p).toExponential(4))}
      ${kv('nᵢ² for comparison', (ni * ni).toExponential(4))}
      ${kv('shortcut n ≈ N_d gives', C.nApprox.toExponential(4))}
      ${kv('error in the shortcut', fmtNum(100 * Math.abs(C.n - C.nApprox) / C.n, 4) + '%')}
      <p class="help">The product np comes back to nᵢ² whatever the doping — that is the law of mass
      action, and it is the same "equilibrium constant" statement as in a chemical reaction, because
      it comes from the same free-energy minimisation.</p>
    </div>
    <div class="card tight"><div class="ttl">The junction</div>
      ${kv('built-in potential', n(J.Vbi) + ' V')}
      ${kv('depletion width at 0 V', fmtNum(J.W * 1e9, 4) + ' nm')}
      ${kv('at V = ' + fmtNum(st.V, 2) + ' V', fmtNum(J.widthAt(st.V) * 1e9, 4) + ' nm')}
      ${kv('peak field', fmtNum(J.Emax / 1e5, 4) + ' × 10⁵ V/m')}
      ${kv('side split x_n : x_p', fmtNum(J.xn / J.W, 3) + ' : ' + fmtNum(J.xp / J.W, 3))}
      <p class="help">The depletion layer reaches <b>further into the lightly doped side</b> — it
      has to expose the same total charge, so it needs more volume where there are fewer ions. That
      is why a diode's breakdown voltage is set by its lightest doping.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.slSemi.semiOf(st);
      if(!D.ok) return `<div class="k">your material</div><div style="color:var(--c-neg)">cannot be solved</div>`;
      return `<div class="k">your material, ${st.T} K</div>
        <div>np ÷ nᵢ² = ${fmtNum(D.S.mass, 5)}</div>
        <div>${fmtNum(100 * D.S.ionD, 1)}% of donors ionised</div>`;
    }
    const M = SL_SEMI[st.i];
    const J = slJunction(M, st.T, Math.pow(10, st.logNd), Math.pow(10, st.logNa));
    return `<div class="k">${M.s}, ${st.T} K</div><div>V_bi = ${fmtNum(J.Vbi, 3)} V, W = ${fmtNum(J.widthAt(st.V) * 1e9, 1)} nm</div>`;
  }
};

/* ------------------------------------------------------------------------- */
STAGES.slHeat = {
  title:'Why solids stop absorbing heat when they get cold',
  legend(st){
    if(st && st.own)
      return [['var(--c-curl)', 'the phonon spectrum D(w) you wrote'],
              ['var(--c-grad)', 'C(T) from it, on logarithmic axes'],
              ['var(--c-warn)', 'the straight line fitted at the bottom — its slope is the exponent'],
              ['var(--c-neg)', 'Dulong–Petit, 3R, which every spectrum reaches'],
              ['var(--c-pos)', 'the points the fit was made on']];
    return [['var(--c-grad)', 'the Debye heat capacity, integrated'],
            ['var(--c-neg)', 'Dulong–Petit, 3R'],
            ['var(--c-curl)', "Einstein's single-frequency model"],
            ['var(--c-warn)', 'the T³ low-temperature law, and the marker']]; },
  dockLegend:true,
  enter(st, o){
    st.i = o.i || 3;
    st.T = o.T || 300;
    st.einstein = o.einstein !== false;
    st.own = !!o.own;
    st.dsrc = o.dsrc || 'w^2';       // Debye, so the first thing shown is the anchor
    st.wmax = o.wmax || 343;         // copper's Debye temperature
  },
  /* One norm, one fit, ninety points of curve — a few hundred thousand
     evaluations of a compiled expression, keyed on the two things that change
     it. The temperature slider is not one of them. */
  specOf(st){
    const key = st.dsrc + '|' + st.wmax;
    if(st._sk === key) return st._sd;
    st._sk = key;
    const dc = pkCompile(slPhononSrc(st.dsrc), () => NaN);
    const D = w => dc(w, 0, 0);
    const wmax = Math.max(1, st.wmax);
    const N = slPhononNorm(D, wmax);
    const out = { D, wmax, N, ok:N > 0 };
    if(out.ok){
      out.fit  = slPhononLowT(D, wmax);
      out.high = slPhononHighT(D, wmax);
      /* the curve, on a logarithmic temperature axis so five decades fit */
      const lo = Math.log10(wmax / 3000), hi = Math.log10(wmax * 25);
      out.lx = lo; out.hx = hi;
      out.curve = [];
      for(let i = 0; i <= 90; i++){
        const T = Math.pow(10, lo + (hi - lo) * i / 90);
        const C = slPhononC(D, wmax, T, N, 300);
        out.curve.push({ T, C, lx:lo + (hi - lo) * i / 90, ly:(C > 0 ? Math.log10(C) : NaN) });
      }
      /* the calibration: the same machinery on w², whose answer `slDebyeC`
         already knows. Nothing the reader types can move it. */
      out.cal = slPhononDebyeCheck(wmax, wmax / 4);
    }
    return (st._sd = out);
  },
  controlsOwn(){
    const st = ST;
    return fnHtml('shD', 'D(w) =', st.dsrc,
                  'w is the mode temperature ħω/k_B in kelvin — the value is a relative number of modes') +
      ctlRow('top of the spectrum', ctlSlider('shW', 20, 2500, 5, st.wmax)) +
      ctlRow('T (K)', ctlSlider('shT', 1, 3000, 1, st.T)) +
      `<p class="help">Frequencies are written as <b>mode temperatures</b>, w = ħω/k<sub>B</sub> in
      kelvin, which is how phonon spectra are quoted and removes ħ from the arithmetic. A Debye solid
      is then simply <b>w^2</b> up to θ<sub>D</sub>, which is the default — and the panel checks that
      the general machinery reproduces the wing's own <b>slDebyeC</b> on it, to a number nothing you
      type can change.</p>
      <p class="help">Only the <i>shape</i> matters: the spectrum is normalised by ∫D dw, so
      C → 3R at high temperature for anything you write. That is Dulong–Petit, and it is true here by
      construction, so it is not the test. The test is the <b>rate</b> of approach, whose leading term
      is 3R⟨w²⟩/12T² — computed from the second moment of your spectrum, and separately read off the
      measured C(T).</p>
      <p class="help">The exponent at the bottom is <b>fitted, not quoted</b>: log₁₀C against log₁₀T
      over a decade, with the worst residual and the <i>bend</i> — the local slope at the top of the
      range minus the one at the bottom — printed beside it. Both are needed, because a straight line
      can be fitted to anything. Try <b>w</b> for an exponent of 2, a constant <b>1</b> for 1, and a
      narrow spike <b>exp(−((w−400)/4)^2)</b> for a heat capacity that has no exponent at all and
      says so.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('shM', st.own ? 'own' : 'list',
                      [['list', 'a solid from the list'], ['own', 'design your own phonon spectrum']]);
    if(st.own) return seg + STAGES.slHeat.controlsOwn();
    return seg + ctSeg('shI', String(st.i), SL_DEBYE.map((m, i) => [String(i), m.s])) +
      ctlRow('T (K)', ctlSlider('shT', 1, 900, 1, st.T)) +
      ctChk('shE', 'compare with Einstein\'s model', st.einstein) +
      `<p class="help">Dulong and Petit found in 1819 that every solid has a molar heat capacity of
      about 3R. It is a beautiful law, and below about a third of the Debye temperature it fails
      completely — every solid's heat capacity falls to zero as T³.</p>
      <p class="help">Classical physics cannot produce that. Equipartition gives kT per mode no
      matter how cold it gets. The fix is that a mode with ħω &gt; kT is <b>frozen out</b>: it cannot
      accept a fraction of a quantum, so it accepts nothing.</p>`;
  },
  wire(){
    ctWireSeg('shM', v => { ST.own = (v === 'own'); });
    ctWireSeg('shI', v => { ST.i = +v; });
    wireSlider('shT', () => ST.T, v => { ST.T = Math.round(v); }, v => Math.round(+v) + ' K');
    ctWireChk('shE', v => { ST.einstein = v; });
    if(!ST.own) return;
    wireSlider('shW', () => ST.wmax, v => { ST.wmax = v; }, v => Math.round(+v) + ' K');
    fnWire('shD', (m, s) => { ST.dsrc = s; },
           s => { const dd = compile(parse(slPhononSrc(s))); return { f:w => dd(w, 0, 0) }; });
  },
  frameOwn(st, dt, ctx, W, H){
    const S = STAGES.slHeat.specOf(st);
    const px = 78, top = 84;
    const aw = Math.max(60, W - px - 96), ah = Math.max(60, H - top - 92);
    if(!S.ok){
      const P = mkPlot(px, top, aw, ah, 0, 1, 0, 1);
      plotFrame(ctx, P, '', '', 'this spectrum has no modes in it');
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph / 2,
             'D(w) integrates to zero over the range — there is nothing to freeze out',
             rgbCss(TH.neg), '600 13px ' + FONT_UI, 'center');
      return;
    }
    const wide = W >= 800 && aw >= 460;
    const gapPx = wide ? 66 : 54;
    const bw = wide ? (aw - gapPx) / 2 : aw;
    const bh = wide ? ah : (ah >= 340 ? (ah - gapPx) / 2 : ah);
    /* the spectrum itself */
    let dmax = 0;
    const pts = [];
    for(let i = 0; i <= 320; i++){
      const w = S.wmax * i / 320, v = S.D(w);
      const y = (Number.isFinite(v) && v > 0) ? v : 0;
      if(y > dmax) dmax = y;
      pts.push({ x:w, y });
    }
    const P = mkPlot(px, top, bw, bh, 0, S.wmax, 0, (dmax || 1) * 1.16);
    st.P = P;
    plotFrame(ctx, P, 'mode temperature w = ħω/k (K)', 'D(w), relative',
              'the spectrum you wrote, and how much of it is awake');
    ctGrid(ctx, P);
    /* the modes that are still absorbing heat at this temperature */
    ctx.save();
    ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
    ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(0));
    for(const p of pts) ctx.lineTo(P.X(p.x), P.Y(p.y * slPhononW(p.x / Math.max(0.01, st.T))));
    ctx.lineTo(P.X(S.wmax), P.Y(0)); ctx.closePath();
    ctx.fillStyle = rgbCss(TH.grad, 0.3); ctx.fill();
    ctx.restore();
    ctPath(ctx, P, pts, rgbCss(TH.curl), 2.4);
    ctPath(ctx, P, [{ x:st.T, y:0 }, { x:st.T, y:P.y1 }], rgbCss(TH.warn), 1.8, [5, 4]);
    ctText(ctx, P.X(st.T) + 6, P.py + 16, 'kT reaches here', rgbCss(TH.warn), '11px ' + FONT_UI);
    /* the heat capacity, on logarithmic axes, with the fitted line on it */
    const Q0 = wide ? mkPlot(px + bw + gapPx, top, bw, bh, 0, 1, 0, 1)
                    : (ah >= 340 ? mkPlot(px, top + bh + gapPx, aw, bh, 0, 1, 0, 1) : null);
    if(!Q0){
      stageNote(ctx, 'shaded: the modes with ħω below kT — the only ones absorbing anything', W, H);
      return;
    }
    const l3R = Math.log10(3 * SL_R);
    let ylo = l3R - 1;
    for(const c of S.curve) if(Number.isFinite(c.ly)) ylo = Math.min(ylo, c.ly);
    ylo = Math.max(l3R - 12, ylo);
    const Q = mkPlot(Q0.px, Q0.py, Q0.pw, Q0.ph, S.lx, S.hx, ylo - 0.4, l3R + 0.45);
    plotFrame(ctx, Q, 'log₁₀ of the temperature (K)', 'log₁₀ of C (J/mol·K)',
              'the exponent, fitted rather than quoted');
    ctGrid(ctx, Q, 1);
    ctPath(ctx, Q, [{ x:S.lx, y:l3R }, { x:S.hx, y:l3R }], rgbCss(TH.neg, 0.75), 1.6, [6, 4]);
    ctText(ctx, Q.px + Q.pw - 8, Q.Y(l3R) - 8, 'Dulong–Petit, 3R', rgbCss(TH.neg), '11px ' + FONT_UI, 'right');
    ctPath(ctx, Q, S.curve.map(c => ({ x:c.lx, y:c.ly })), rgbCss(TH.grad), 2.6);
    if(S.fit.ok){
      const a = Math.log10(S.fit.Tlo), b = Math.log10(S.fit.Thi);
      ctPath(ctx, Q, [{ x:a - 0.35, y:S.fit.inter + S.fit.slope * (a - 0.35) },
                      { x:b + 0.9,  y:S.fit.inter + S.fit.slope * (b + 0.9) }],
             rgbCss(TH.warn, 0.9), 2, [7, 4]);
      for(const p of S.fit.pts)
        ctDot(ctx, Q, Math.log10(p.T), Math.log10(p.C), 3.4, rgbCss(TH.pos), rgbCss(TH.bg));
      ctText(ctx, Q.px + 10, Q.py + 18,
             'slope ' + fmtNum(S.fit.slope, 4) + (S.fit.power ? '  — a power law' : '  — not a power law'),
             rgbCss(TH.warn), '11px ' + FONT_UI);
      ctText(ctx, Q.px + 10, Q.py + 33,
             'worst residual ' + S.fit.worst.toFixed(4) + ' dec, bend ' + fmtNum(S.fit.bend, 3),
             rgbCss(TH.faint), '11px ' + FONT_UI);
    } else {
      ctText(ctx, Q.px + 10, Q.py + 18, 'no power law here — C underflows across the range',
             rgbCss(TH.neg), '11px ' + FONT_UI);
    }
    stageNote(ctx, 'the dashed slope is a least-squares fit to the green dots — nothing here was ' +
                   'told that the answer should be three', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.slHeat.frameOwn(st, dt, ctx, W, H);
    const M = SL_DEBYE[st.i], TD = M.TD;
    const Tm = Math.max(900, TD * 1.5);
    const P = mkPlot(80, 55, W - 170, H - 145, 0, Tm, 0, 3.4 * SL_R);
    st.P = P;
    plotFrame(ctx, P, 'temperature (K)', 'molar heat capacity (J/mol·K)',
              M.s + ', Debye temperature ' + TD + ' K');
    ctGrid(ctx, P);

    /* Dulong–Petit, the classical answer */
    ctPath(ctx, P, [{ x:0, y:3 * SL_R }, { x:Tm, y:3 * SL_R }], rgbCss(TH.neg, 0.7), 1.8, [6, 4]);
    ctText(ctx, P.X(Tm) - 150, P.Y(3 * SL_R) - 10, 'Dulong–Petit, 3R', rgbCss(TH.neg), '12px ' + FONT_UI);

    if(st.einstein)
      plotCurve(ctx, P, T => slEinsteinC(Math.max(0.1, T), TD * 0.75), 300, rgbCss(TH.curl), 2.2, [5, 4]);
    plotCurve(ctx, P, T => slDebyeC(Math.max(0.1, T), TD), 300, rgbCss(TH.grad), 2.8);

    /* the T³ law, drawn only where it is valid */
    const lowT = TD / 10;
    const A = slDebyeC(lowT, TD) / (lowT * lowT * lowT);
    ctPath(ctx, P, Array.from({ length:60 }, (_, i) => {
      const T = TD * 0.35 * i / 59;
      return { x:T, y:A * T * T * T };
    }), rgbCss(TH.warn, 0.8), 2, [4, 3]);
    /* Label the cubic where it is still on the plot. A T³ leaves the top of the
       frame long before the end of the range it is drawn over, so anchoring the
       label at a fixed fraction of that range put it a couple of hundred pixels
       above the canvas — invisible at every window size. Solve for the T at
       which the curve is about two thirds of the way up instead. */
    const yLab = 0.62 * 3.4 * SL_R;
    const Tlab = Math.min(TD * 0.32, Math.pow(yLab / A, 1 / 3));
    ctText(ctx, P.X(Tlab) + 6, P.Y(A * Tlab * Tlab * Tlab) - 8, 'T³', rgbCss(TH.warn), '12px ' + FONT_UI);

    ctPath(ctx, P, [{ x:TD, y:0 }, { x:TD, y:3.4 * SL_R }], rgbCss(TH.dim, 0.5), 1.4, [3, 4]);
    ctText(ctx, P.X(TD) + 6, P.py + 16, 'θ_D', rgbCss(TH.dim), '12px ' + FONT_UI);
    probeLine(ctx, P, st.T, st.T + ' K');
    ctx.beginPath(); ctx.arc(P.X(st.T), P.Y(slDebyeC(st.T, TD)), 6, 0, 7);
    ctx.fillStyle = rgbCss(TH.warn); ctx.fill();
    stageNote(ctx, st.einstein
      ? 'green Debye, purple dashed Einstein — Einstein falls too fast because he gave every mode the same frequency'
      : 'the classical answer is the flat red line, and it is right only when everything is warm', W, H);
  },
  deriveOwn(st){
    const S = STAGES.slHeat.specOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 5) : 'not defined here');
    if(!S.ok) return {
      title:'This spectrum has no modes in it',
      steps:[drvSay('what a phonon spectrum has to be',
        'D(w) is a count of modes per unit frequency, so it has to be positive somewhere on the range. Yours integrates to zero, and every quantity below is a ratio with that integral underneath it.')],
      note:'Give D a positive value somewhere between 0 and the top of the spectrum and the ladder returns.'
    };
    const F = S.fit;
    return {
      title:'Where the exponent comes from, and how it is measured',
      steps:[
        drvStep('the spectrum, as you wrote it',
          `${dv('D')}(${dv('w')}) ${dop('=')} ${pkPretty(st.dsrc)}`,
          `over 0 to ${Math.round(S.wmax)} K, with ⟨w²⟩^(1/2) = ${n(S.high.rms)} K`),
        drvSay('one mode, and the only quantum mechanics in the whole calculation',
          'A harmonic mode of frequency ω cannot accept a fraction of ħω, so when kT falls below ħω it accepts nothing at all. Its contribution to the heat capacity is k·x²eˣ/(eˣ−1)² with x = ħω/kT — one near unity while the mode is awake, and falling off like x²e^(−x) once it is not. Everything else here is counting.'),
        drvStep('so the heat capacity is that, weighted by how many modes there are',
          `${dv('C')} ${dop('=')} 3${dv('R')} ${dfrac('∫' + dv('D') + '(' + dv('w') + ') ' + dv('W') + '(' + dv('w') + '/' + dv('T') + ') d' + dv('w'), '∫' + dv('D') + '(' + dv('w') + ') d' + dv('w'))}`,
          `at ${st.T} K: ${n(slPhononC(S.D, S.wmax, st.T, S.N, 600))} J/mol·K`),
        drvSay('the normalisation is why Dulong–Petit is not a test',
          'Dividing by ∫D dw makes C → 3R as T → ∞ for any spectrum whatever, because W(x) → 1. That much is arithmetic. What is not arithmetic is how fast it gets there: expanding W gives C ≈ 3R[1 − ⟨w²⟩/12T²], so the approach is governed by the second moment of your own spectrum — and the panel computes that moment directly and then reads the same number off the measured C(T), which is a real comparison.'),
        drvStep('the anchor — the same machinery on a spectrum with a known answer',
          `${dv('D')} ${dop('=')} ${dv('w')}² &nbsp;⟹&nbsp; 9${dv('R')}(${dv('T')}/θ)³∫₀^(θ/T) ${dv('x')}⁴${dop('e')}^${dv('x')}/(${dop('e')}^${dv('x')}−1)² d${dv('x')}`,
          `quadrature ${n(S.cal.mine)} against slDebyeC ${n(S.cal.closed)} — ${S.cal.rel.toExponential(2)} apart`),
        drvStep('and the low-temperature exponent, fitted',
          `log₁₀${dv('C')} ${dop('=')} ${dv('p')}·log₁₀${dv('T')} ${dop('+')} const`,
          F.ok ? `p = ${n(F.slope)} over ${n(F.Tlo)}–${n(F.Thi)} K, worst residual ${F.worst.toFixed(4)} decades`
               : 'no fit — ' + String(F.why || '').slice(0, 90)),
        drvSay('why the slope alone would not be enough',
          'A least-squares line can be fitted to any set of points, and an Einstein solid — whose heat capacity dies exponentially and has no exponent at all — will hand you one without complaint. Two more numbers are reported with it. The worst residual says how far the points stray from the line. The <b>bend</b> is the local slope at the top of the range minus the local slope at the bottom: a genuine power law has the same slope everywhere and gives zero, while an exponential\'s log-log slope grows without limit and gives a large one. Only with all three is "the exponent is three" a measurement.'),
        F.ok ? drvStep('what that exponent is counting',
          `${dv('D')} ${dop('∼')} ${dv('w')}^(${dv('p')}−1) &nbsp;⟹&nbsp; ${dv('C')} ${dop('∼')} ${dv('T')}^${dv('p')}`,
          `here p = ${n(F.slope)}, and the bend is ${n(F.bend)}${F.power ? ' — a power law' : ' — not a power law'}`)
             : drvSay('a spectrum with nothing at the bottom has no exponent',
          'The exponent comes from the modes that are still awake when kT is small, and it counts them. A spectrum with a gap at the bottom has none, so its heat capacity falls off exponentially rather than as any power, and there is no straight line to find. That is a result about the material, not a failure of the fit.'),
        drvSay('and that is the whole of the T³ law',
          'It is not a fact about solids. It is a fact about ω²: the number of sound modes below ω grows as ω³ in three dimensions, each one freezes when kT drops below ħω, and the count of the survivors is what you measure. Change the counting and the exponent changes with it, which is why the same experiment on a layered material gives two and on a chain gives one.')
      ],
      note:'Everything above is a quadrature over the function you typed, and the anchor step is the one number nothing you type can move — the same integrator run on w², set beside the closed-form Debye engine that was in this wing first.'
    };
  },
  derive(st){
    if(st.own) return STAGES.slHeat.deriveOwn(st);
    const M = SL_DEBYE[st.i], TD = M.TD;
    const n = v => fmtNum(v, 5);
    return {
      title:'Equipartition, and the two ways of fixing it',
      steps:[
        drvStep('the classical count: 3N oscillators, kT each',
          `${dv('U')} ${dop('=')} 3${dv('N')}${dv('k')}${dv('T')} ${dop('⇒')} ${dv('C')} ${dop('=')} 3${dv('R')}`,
          `3R = ${n(3 * SL_R)} J/mol·K, independent of temperature and of material`),
        drvSay('which is right at room temperature and nonsense at low temperature',
          'Dulong and Petit\'s law works for most metals near 300 K, and it is completely material-independent, which made it look like a deep truth. Measurements below about 50 K show the heat capacity heading for zero. Nothing classical can do that, because equipartition knows nothing about temperature scale.'),
        drvStep('Einstein: give every oscillator the same frequency, quantised',
          `⟨${dv('E')}⟩ ${dop('=')} ${dfrac('ħω', dop('e') + '^(ħω/' + dv('k') + 'T) − 1')}`,
          `at ${st.T} K, Einstein gives ${n(slEinsteinC(st.T, TD * 0.75))} J/mol·K`),
        drvSay('this already fixes the qualitative failure',
          'When kT drops below ħω the exponential in the denominator explodes and the average energy collapses. The mode is frozen: it cannot take half a quantum, so it takes none. Einstein published this in 1907 and it was the first application of quantisation to anything other than light.'),
        drvStep('but the measured fall is T³, and Einstein gives an exponential',
          `${dv('C')}_Einstein ${dop('∼')} ${dop('e')}^(−ħω/${dv('k')}T)`,
          'too fast — the data are a power law, not an exponential'),
        drvSay('Debye\'s correction: the frequencies are not all the same',
          'A crystal supports sound waves of every wavelength from the sample size down to the atomic spacing. Long-wavelength modes have very low frequencies, so however cold it gets there are always some modes with ħω < kT still active. Counting those modes — and there are few of them, going as ω² — gives a power law instead of an exponential.'),
        drvStep('count the modes up to a cut-off that gives exactly 3N of them',
          `${dv('C')} ${dop('=')} 9${dv('R')}(${dfrac(dv('T'), 'θ_D')})³∫₀^(θ_D/T) ${dfrac(dv('x') + '⁴' + dop('e') + '^' + dv('x'), '(' + dop('e') + '^' + dv('x') + '−1)²')} d${dv('x')}`,
          `at ${st.T} K: ${n(slDebyeC(st.T, TD))} J/mol·K — the integral is evaluated here, not looked up`),
        drvStep('at low temperature the upper limit runs to infinity',
          `${dv('C')} ${dop('→')} ${dfrac('12π⁴', '5')}${dv('R')}(${dfrac(dv('T'), 'θ_D')})³`,
          `the T³ law: at ${fmtNum(TD / 20, 1)} K it predicts ${n(12 * Math.pow(Math.PI, 4) / 5 * SL_R * Math.pow(TD / 20 / TD, 3))} J/mol·K`),
        drvSay('and the Debye temperature is a real physical scale',
          `θ_D measures how stiff the material is: it is roughly the temperature at which the shortest-wavelength sound wave has ħω = kT. Lead is soft and heavy, θ_D = 105 K, so it reaches its classical value while still cold. Diamond is stiff and light, θ_D = 2230 K, so at room temperature it is still deep in the quantum regime and its heat capacity is far below 3R. Same law, same equation, two materials that behave nothing alike.`)
      ],
      note:'This is the same Bose–Einstein counting that gives the Planck blackbody law — phonons in a solid instead of photons in a cavity, with a cut-off because a crystal has a shortest possible wavelength and empty space does not. The T³ here and the T⁴ of Stefan–Boltzmann differ only by that cut-off.'
    };
  },
  readoutOwn(st){
    const S = STAGES.slHeat.specOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 5 : d) : 'not defined here');
    if(!S.ok) return `<div class="card tight"><div class="ttl">This spectrum has no modes</div>
      ${kv('D(w)', pkPretty(st.dsrc))}
      ${kv('∫D dw over 0 to ' + Math.round(st.wmax) + ' K', n(S.N))}
      <p class="help">A phonon density of states counts modes, so it has to be positive somewhere.
      Every quantity here is a ratio with ∫D dw underneath it, and that integral is zero. The picture
      keeps the last spectrum that had modes in it.</p></div>`;
    const F = S.fit, Hh = S.high;
    const Cnow = slPhononC(S.D, S.wmax, st.T, S.N, 600);
    return `<div class="card tight"><div class="ttl">Your spectrum</div>
      ${kv('D(w)', pkPretty(st.dsrc))}
      ${kv('range', '0 to ' + Math.round(S.wmax) + ' K in mode temperature')}
      ${kv('∫D dw', n(S.N, 6))}
      ${kv('⟨w²⟩', n(Hh.m2, 6) + ' K²')}
      ${kv('√⟨w²⟩', n(Hh.rms, 5) + ' K')}
      <p class="help">Only the shape matters — the spectrum is normalised by ∫D dw, so the number of
      modes is fixed at 3N however you write it. What the shape controls is <b>which</b> modes are
      awake at a given temperature, and the shaded region in the picture is exactly that.</p>
    </div>
    <div class="card tight"><div class="ttl">The exponent, fitted rather than quoted</div>
      ${F.ok
        ? kv('fitted over', n(F.Tlo, 4) + ' to ' + n(F.Thi, 4) + ' K,  ' + F.n + ' points') +
          kv('measured exponent p', n(F.slope, 6)) +
          kv('worst residual', F.worst.toFixed(5) + ' decades') +
          kv('r²', n(F.r2, 8)) +
          kv('local slope, bottom → top', n(F.sLo, 4) + ' → ' + n(F.sHi, 4)) +
          kv('the bend', n(F.bend, 5)) +
          kv('verdict', F.power ? 'a power law, C ∝ T^' + fmtNum(F.slope, 3)
                                : 'NOT a power law — the slope is still changing')
        : kv('', esc(String(F.why || '')))}
      <p class="help">${F.ok
        ? (F.power
           ? 'The points lie on a straight line in log–log to better than a hundredth of a decade and the slope is the same at both ends, so calling this a power law is a <b>measurement</b>. The exponent counts modes: a density of states going as w^(p−1) at the bottom gives C ∝ T^p, which is why three dimensions of sound waves give three.'
           : 'A least-squares line came back, as one always will, but the residual and the bend say it does not mean anything: the local slope at the top of the range is ' + fmtNum(F.sHi, 3) + ' and at the bottom it is ' + fmtNum(F.sLo, 3) + '. A power law has one slope. This is a heat capacity dying <b>exponentially</b>, which is what a spectrum with no low-frequency modes does — and it is exactly the failure that made Einstein\'s 1907 model insufficient.')
        : 'The exponent lives in the modes still awake at low temperature. This spectrum has none there, so C underflows across the whole fitting range and there is no logarithm to fit. That is an answer about the material rather than a gap in the calculation.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The anchor — the same integrator on a known case</div>
      ${kv('w² spectrum through this machinery', n(S.cal.mine, 8) + ' J/mol·K')}
      ${kv('slDebyeC, the wing\'s own engine', n(S.cal.closed, 8) + ' J/mol·K')}
      ${kv('they differ by', S.cal.rel.toExponential(3) + ' relative')}
      ${kv('the closed form (12π⁴/5)R(T/θ)³', n(S.cal.lowT, 6) + ' J/mol·K')}
      <p class="help">Both are evaluated at θ/4 with θ set to the top of your spectrum, and
      <b>nothing you type moves either of them</b>. One is a quadrature over a typed w²; the other is
      the wing's Debye routine, which was written first and shares no line with it. The third row is
      the low-temperature limit in closed form — it is not meant to agree at θ/4, and how badly it
      does is how far from asymptotic that temperature is.</p>
    </div>
    <div class="card tight"><div class="ttl">The hot end, where every spectrum agrees</div>
      ${kv('C at T = ' + st.T + ' K', n(Cnow, 6) + ' J/mol·K')}
      ${kv('as a fraction of 3R', fmtNum(100 * Cnow / (3 * SL_R), 4) + '%')}
      ${kv('3R⟨w²⟩/12, from the moment', n(Hh.pred, 6))}
      ${kv('(3R − C)T² measured at ' + Math.round(Hh.at[1].T) + ' K', n(Hh.at[1].coef, 6))}
      ${kv('they differ by', Hh.rel.toExponential(2) + ' relative')}
      <p class="help">C → 3R for any spectrum, so Dulong–Petit on its own tests nothing — it follows
      from the normalisation. The <b>rate</b> does not: expanding the Einstein function gives
      C ≈ 3R[1 − ⟨w²⟩/12T²], so the approach is set by the second moment of <i>your</i> spectrum.
      The two rows above are that moment computed from D directly and read off the measured C(T),
      with nothing but the spectrum in common.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.slHeat.readoutOwn(st);
    const M = SL_DEBYE[st.i], TD = M.TD;
    const n = v => fmtNum(v, 5);
    const C = slDebyeC(st.T, TD);
    const low = 12 * Math.pow(Math.PI, 4) / 5 * SL_R * Math.pow(st.T / TD, 3);
    return `<div class="card tight"><div class="ttl">${M.s} at ${st.T} K</div>
      ${kv('Debye temperature', TD + ' K')}
      ${kv('T ÷ θ_D', fmtNum(st.T / TD, 4))}
      ${kv('heat capacity, Debye', n(C) + ' J/mol·K')}
      ${kv('Dulong–Petit says', n(3 * SL_R) + ' J/mol·K')}
      ${kv('fraction of classical', fmtNum(100 * C / (3 * SL_R), 3) + '%')}
      <p class="help">${st.T / TD > 1
        ? 'Well above θ_D every mode is active and the classical answer is recovered — which is why the law looked universal to anyone working at room temperature with ordinary metals.'
        : 'Below θ_D the short-wavelength modes are frozen out and the classical answer is simply wrong. The colder it gets, the more of the spectrum is dead.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The low-temperature law</div>
      ${kv('T³ formula gives', n(low) + ' J/mol·K')}
      ${kv('full integral gives', n(C) + ' J/mol·K')}
      ${kv('they differ by', fmtNum(100 * Math.abs(C - low) / Math.max(1e-12, C), 3) + '%')}
      <p class="help">The T³ law is an <b>asymptotic</b> result, valid when T ≪ θ_D. Watch the
      disagreement above: it is a fraction of a percent at θ_D/20 and useless above θ_D/3. Knowing
      where an approximation stops being one is the difference between using it and misusing it.</p>
    </div>
    <div class="card tight"><div class="ttl">Einstein against Debye</div>
      ${kv('Einstein model', n(slEinsteinC(st.T, TD * 0.75)) + ' J/mol·K')}
      ${kv('Debye model', n(C) + ' J/mol·K')}
      ${kv('ratio', fmtNum(slEinsteinC(st.T, TD * 0.75) / Math.max(1e-12, C), 4))}
      <p class="help">Both go to zero and both reach 3R. They disagree about <b>how</b>, and the
      measurement settles it: the fall is a power law, so the spectrum of frequencies is real and a
      single frequency is not enough.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const S = STAGES.slHeat.specOf(st);
      if(!S.ok) return `<div class="k">your spectrum</div><div style="color:var(--c-neg)">has no modes in it</div>`;
      return `<div class="k">your spectrum</div>
        <div>exponent ${S.fit.ok ? fmtNum(S.fit.slope, 4) : '—'}, measured</div>
        <div>${S.fit.ok ? (S.fit.power ? 'a power law' : 'not a power law') : 'C underflows below'}</div>`;
    }
    const M = SL_DEBYE[st.i];
    return `<div class="k">${M.s}, ${st.T} K</div><div>C = ${fmtNum(slDebyeC(st.T, M.TD), 3)} J/mol·K (3R = ${fmtNum(3 * SL_R, 1)})</div>`;
  }
};
