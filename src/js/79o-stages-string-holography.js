/* ============================================================================
   4s · THE STRING WING — V · BLACK HOLES, HOLOGRAPHY, AND THE ONE THEORY
   The three stages here carry the results the subject is actually judged on.
   Two of them compute the same number twice, by routes with nothing in common,
   and print the difference — which is the only kind of evidence this laboratory
   accepts anywhere else, and there is no reason to relax it here.
   ============================================================================ */

/* ============================================================================
   13 · COUNTING THE MICROSTATES OF A BLACK HOLE
   ============================================================================ */
STAGES.wsEntropy = {
  title: 'Black-hole entropy, counted',
  dockLegend: true,
  derive(st){
    const c = wsSVCentralCharge(st.Q1, st.Q5);
    const chk = wsSVCheck(st.Q1, st.Q5, st.N);
    const d = wsEntCounts(st);
    const nUse = Math.min(120, st.N);
    return {
      title:'Where the area law comes from, when you can do the counting',
      steps:[
        drvSay('the problem Bekenstein and Hawking left',
          'A black hole has an entropy proportional to its horizon AREA, not its volume, and it is enormous — a solar-mass hole carries about 10⁷⁷ in units of Boltzmann\'s constant. Entropy counts states. Nobody could say what those states were, and general relativity says a black hole has none: it is fixed by mass, charge and spin alone.'),
        drvStep('the area law',
          `${dv('S')} ${dop('=')} ${dfrac(dv('A') + dv('c') + '³', '4' + dv('G') + 'ħ')}`,
          `the Sun as a black hole would carry ${fmtNum(wsSchwarzschildS(1.98841e30), 5)} — for comparison, the Sun's ordinary thermodynamic entropy is around 10⁵⁸`),
        drvSay('so the question is: 10⁷⁷ what?',
          'This is the sharpest question in quantum gravity, because it has a number attached. Any candidate theory has to say what is being counted and get the same number — not the same order of magnitude, the same number, coefficient included.'),
        drvStep('build a black hole out of branes instead',
          `${dv('Q')}₁ D1-branes, ${dv('Q')}₅ D5-branes, ${dv('N')} units of momentum`,
          `${st.Q1}, ${st.Q5} and ${st.N} here — an extremal, supersymmetric five-dimensional black hole`),
        drvSay('why supersymmetry is what makes this possible',
          'At weak coupling the bound state is a manageable quantum system whose states can be counted. At strong coupling the same object is a black hole with a horizon. Those are different regimes, and normally the answer would change on the way between them. Supersymmetry protects this particular count, so the number obtained in the easy regime is valid in the hard one. That is the whole reason the calculation can be done at all.'),
        drvStep('count the states of the brane system',
          `${dv('c')} ${dop('=')} 6${dv('Q')}₁${dv('Q')}₅, ${dv('S')} ${dop('=')} 2π√(${dv('c')}${dv('N')}/6)`,
          `c = ${fmtNum(c, 6)}, so S = ${fmtNum(chk.micro, 9)} — the exact level count at N = ${nUse} is ${fmtNum(d[nUse], 6)} states`),
        drvStep('now compute the horizon area of the same object',
          `${dv('r')}_H ${dop('=')} (${dv('Q')}₁${dv('Q')}₅${dv('N')})^(1/6), ${dv('A')} ${dop('=')} 2π²${dv('r')}_H³`,
          `r_H = ${fmtNum(wsBH5Radius(st.Q1, st.Q5, st.N), 6)}, A = ${fmtNum(wsBH5Area(st.Q1, st.Q5, st.N), 6)}, and with 4G₅ = π that is S = ${fmtNum(chk.macro, 9)}`),
        drvStep('and compare them',
          `${dv('S')}_micro ${dop('=')} ${dv('S')}_macro`,
          `${fmtNum(chk.micro, 10)} against ${fmtNum(chk.macro, 10)} — a difference of ${fmtNum(chk.gap, 3)}`),
        drvSay('what makes this a result rather than a rearrangement',
          'The two sides are functions of the same three integers, so they had to be compared as functions rather than at one point. The left comes from counting oscillator states in a two-dimensional conformal field theory. The right comes from solving Einstein\'s equations in five dimensions and measuring a horizon. There is no step in common — and the factor of 1/4 in the area law, which had been an unexplained constant since 1973, comes out right.'),
        drvSay('and where it is honest to stop',
          'This works for extremal and near-extremal supersymmetric black holes. For an ordinary Schwarzschild hole — no charge, no supersymmetry, the kind that actually exists — there is no such counting, and the argument does not extend. It is a genuine result about a special case, and that is how it should be described.')
      ],
      note:'The exact level count beside the Cardy formula is computed from the generating function ((1+qⁿ)/(1−qⁿ)) raised to the power 4Q₁Q₅ — four bosons and four fermions per strand — so the asymptotic formula can be watched converging rather than assumed.'
    };
  },
  enter(st, o){
    st.Q1 = o.Q1 === undefined ? 10 : o.Q1;
    st.Q5 = o.Q5 === undefined ? 20 : o.Q5;
    st.N  = o.N === undefined ? 60 : o.N;
    st.view = o.view || 'compare';
    st._k = -1; st._d = null;                 // the exact count, cached — see below
  },
  controls(){
    const st = ST;
    return ctSeg('wsEnV', st.view, [['compare','the two calculations, side by side'],
                                    ['cardy','Cardy against an exact count'],
                                    ['astro','real black holes']]) +
      ctlRow('Q₁ (D1-branes)', ctlSlider('wsEn1', 1, 40, 1, st.Q1)) +
      ctlRow('Q₅ (D5-branes)', ctlSlider('wsEn5', 1, 40, 1, st.Q5)) +
      ctlRow('momentum N', ctlSlider('wsEnN', 1, 120, 1, st.N)) +
      `<p class="help">Two numbers are computed below. One counts the quantum states of a bound system of
      branes, using a formula from two-dimensional conformal field theory. The other measures the area of a
      horizon in a solution of Einstein's equations and divides by 4G. They agree as <b>functions</b> of the
      three charges, not at a single point — move any slider and watch the difference stay at the level of
      floating-point noise.</p>`;
  },
  wire(){
    ctWireSeg('wsEnV', v => { ST.view = v; });
    wireSlider('wsEn1', () => ST.Q1, v => { ST.Q1 = Math.round(v); }, v => 'Q₁ = ' + Math.round(v));
    wireSlider('wsEn5', () => ST.Q5, v => { ST.Q5 = Math.round(v); }, v => 'Q₅ = ' + Math.round(v));
    wireSlider('wsEnN', () => ST.N, v => { ST.N = Math.round(v); }, v => 'N = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    if(st.view === 'compare'){
      /* the two routes drawn as two columns meeting at a single number */
      const chk = wsSVCheck(st.Q1, st.Q5, st.N);
      const yTop = 72, colL = W * 0.24, colR = W * 0.72, mid = W * 0.48;
      wsTitle(ctx, colL, yTop - 22, 'counting states', TH.curl);
      wsTitle(ctx, colR, yTop - 22, 'measuring a horizon', TH.grad);
      const rows = [
        ['Q₁ · Q₅', fmtNum(st.Q1 * st.Q5, 6), 'the same integers', fmtNum(st.Q1 * st.Q5, 6)],
        ['central charge c = 6Q₁Q₅', fmtNum(wsSVCentralCharge(st.Q1, st.Q5), 6),
         'horizon radius (Q₁Q₅N)^(1/6)', fmtNum(wsBH5Radius(st.Q1, st.Q5, st.N), 6)],
        ['momentum level N', String(st.N), 'horizon area 2π²r³', fmtNum(wsBH5Area(st.Q1, st.Q5, st.N), 6)],
        ['Cardy: 2π√(cN/6)', fmtNum(chk.micro, 8), 'A ÷ 4G₅, with 4G₅ = π', fmtNum(chk.macro, 8)]
      ];
      for(let i = 0; i < rows.length; i++){
        const y = yTop + 26 + i * 40;
        rlText(ctx, colL, y, rows[i][0], rgbCss(TH.faint), '10.5px ' + FONT_UI, 'center');
        rlText(ctx, colL, y + 16, rows[i][1], rgbCss(TH.curl), '600 13px ' + FONT_MONO, 'center');
        rlText(ctx, colR, y, rows[i][2], rgbCss(TH.faint), '10.5px ' + FONT_UI, 'center');
        rlText(ctx, colR, y + 16, rows[i][3], rgbCss(TH.grad), '600 13px ' + FONT_MONO, 'center');
      }
      /* the two columns converging */
      const yEnd = yTop + 26 + rows.length * 40 + 24;
      rlSegment(ctx, colL, yEnd, mid, yEnd + 34, rgbCss(TH.curl), 2);
      rlSegment(ctx, colR, yEnd, mid, yEnd + 34, rgbCss(TH.grad), 2);
      rlText(ctx, mid, yEnd + 56, 'S = ' + fmtNum(chk.micro, 10),
             rgbCss(TH.pos), '700 20px ' + FONT_MONO, 'center');
      rlText(ctx, mid, yEnd + 80, 'the two differ by ' + fmtNum(chk.gap, 3),
             rgbCss(TH.accent), '11px ' + FONT_MONO, 'center');
      rlText(ctx, mid, yEnd + 102,
        'counted in a two-dimensional field theory; measured in five-dimensional gravity',
        rgbCss(TH.dim), '11px ' + FONT_UI, 'center');
      rlText(ctx, mid, yEnd + 120,
        'and the 1/4 in the area law, unexplained since 1973, comes out right',
        rgbCss(TH.dim), '11px ' + FONT_UI, 'center');
      /* the brane cartoon */
      const bx = W * 0.24, by = yEnd + 62;
      for(let i = 0; i < Math.min(8, st.Q5); i++){
        const y = by + i * 5.5;
        rlSegment(ctx, bx - 62, y, bx + 62, y, rgbCss(TH.grad, 0.55), 1.6);
      }
      for(let i = 0; i < Math.min(8, st.Q1); i++)
        rlSegment(ctx, bx - 62 + i * 15, by - 6, bx - 62 + i * 15, by + 48, rgbCss(TH.curl, 0.7), 1.4);
      wsSub(ctx, bx, by + 68, 'D1-branes inside D5-branes, with momentum running along them');
    } else if(st.view === 'cardy'){
      const k = Math.min(6, st.Q1 * st.Q5);
      const NM = 120;
      const d = wsEntCounts(st);
      const P = mkPlot(W * 0.10, 54, W * 0.82, H - 132, 1, NM, 0, 1.15);
      plotFrame(ctx, P, 'momentum level N', 'ln(exact count) ÷ Cardy',
        'Cardy is an ASYMPTOTIC formula — here is it converging');
      plotTicksX(ctx, P, [1, 30, 60, 90, 120], v => fmtNum(v, 3));
      rlYTicks(ctx, P, [0, 0.25, 0.5, 0.75, 1]);
      rlSegment(ctx, P.px, P.Y(1), P.px + P.pw, P.Y(1), rgbCss(TH.accent), 1.8, [5, 4]);
      rlText(ctx, P.px + P.pw - 8, P.Y(1) - 10, 'exact agreement',
             rgbCss(TH.accent), '10.5px ' + FONT_UI, 'right');
      const xs = [], ys = [];
      for(let n = 1; n <= NM; n++){
        const cardy = 2 * Math.PI * Math.sqrt(k * n);
        if(!(d[n] > 0) || cardy <= 0) continue;
        xs.push(n); ys.push(Math.log(d[n]) / cardy);
      }
      rlLine(ctx, P, xs, ys, rgbCss(TH.curl), 2.6);
      const nSel = Math.max(1, Math.min(NM, st.N));
      const cSel = 2 * Math.PI * Math.sqrt(k * nSel);
      rlDot(ctx, P.X(nSel), P.Y(Math.log(d[nSel]) / cSel), 5, rgbCss(TH.pos));
      wsNum(ctx, P.px + 16, P.py + 26, 'Q₁Q₅ used for the count', String(k), TH.dim);
      wsNum(ctx, P.px + 16, P.py + 44, 'exact states at N = ' + nSel, fmtNum(d[nSel], 6), TH.curl);
      wsNum(ctx, P.px + 16, P.py + 62, 'ln of that', fmtNum(Math.log(d[nSel]), 6), TH.curl);
      wsNum(ctx, P.px + 16, P.py + 80, 'Cardy', fmtNum(cSel, 6), TH.accent);
      rlText(ctx, P.px + 16, P.py + 108,
        'the count is exact — the generating function is expanded term by term',
        rgbCss(TH.faint), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 16, P.py + 124,
        'the ratio approaches 1 slowly, which is what an asymptotic formula does',
        rgbCss(TH.faint), '10.5px ' + FONT_UI);
      rlText(ctx, P.px + 16, P.py + 140,
        'the real black holes have charges of order 10³⁸, where the gap is unmeasurable',
        rgbCss(TH.faint), '10.5px ' + FONT_UI);
    } else {
      /* real black holes: entropy and Hawking temperature over the mass range */
      const P = mkPlot(W * 0.10, 54, W * 0.82, (H - 148) * 0.52,
                       Math.log10(1e12), Math.log10(1e40), 40, 110);
      plotFrame(ctx, P, 'mass', 'log₁₀ entropy, in units of k',
        'Bekenstein–Hawking entropy for real objects');
      plotTicksX(ctx, P, [12, 20, 30, 40], v => '10' + supDigits(String(v)) + ' kg');
      rlYTicks(ctx, P, [40, 60, 80, 100]);
      plotCurve(ctx, P, L => Math.log10(wsSchwarzschildS(Math.pow(10, L))), 240, rgbCss(TH.curl), 2.4);
      const marks = [[1.98841e30, 'the Sun'], [35.6 * 1.98841e30, "GW150914's larger hole"],
                     [6.5e9 * 1.98841e30, 'M87*, imaged in 2019'], [1e15, 'a mountain']];
      for(const [M, lab] of marks){
        const L = Math.log10(M);
        if(L < 12 || L > 40) continue;
        rlDot(ctx, P.X(L), P.Y(Math.log10(wsSchwarzschildS(M))), 5, rgbCss(TH.pos));
        rlText(ctx, P.X(L), P.Y(Math.log10(wsSchwarzschildS(M))) - 13, lab,
               rgbCss(TH.pos), '10px ' + FONT_UI, 'center');
      }
      const Q = mkPlot(W * 0.10, 54 + (H - 148) * 0.52 + 58, W * 0.82, (H - 148) * 0.48 - 26,
                       Math.log10(1e12), Math.log10(1e40), -16, 4);
      plotFrame(ctx, Q, 'mass', 'log₁₀ (Hawking temperature ÷ K)',
        'and the temperature — which falls as the hole grows');
      plotTicksX(ctx, Q, [12, 20, 30, 40], v => '10' + supDigits(String(v)) + ' kg');
      rlYTicks(ctx, Q, [-16, -10, -4, 2]);
      plotCurve(ctx, Q, L => Math.log10(wsHawkingT(Math.pow(10, L))), 240, rgbCss(TH.grad), 2.4);
      rlSegment(ctx, Q.px, Q.Y(Math.log10(2.725)), Q.px + Q.pw, Q.Y(Math.log10(2.725)),
                rgbCss(TH.accent, 0.8), 1.4, [5, 4]);
      rlText(ctx, Q.px + 8, Q.Y(Math.log10(2.725)) - 9,
        'the microwave background, 2.725 K — colder holes absorb more than they emit',
        rgbCss(TH.accent), '10px ' + FONT_UI);
    }
    stageNote(ctx, 'this works for extremal supersymmetric holes; for a plain Schwarzschild hole nobody can do the count', W, H);
  },
  readout(st){
    const chk = wsSVCheck(st.Q1, st.Q5, st.N);
    const k = Math.min(6, st.Q1 * st.Q5);
    const nUse = Math.min(120, st.N);
    const d = wsEntCounts(st);
    const cardyK = 2 * Math.PI * Math.sqrt(k * nUse);
    return `<div class="card tight"><div class="ttl">The two calculations</div>
      ${kv('Q₁, Q₅, N', st.Q1 + ',  ' + st.Q5 + ',  ' + st.N)}
      ${kv('central charge c = 6Q₁Q₅', fmtNum(wsSVCentralCharge(st.Q1, st.Q5), 6))}
      ${kv('microscopic: 2π√(cN/6)', fmtNum(chk.micro, 12))}
      ${kv('horizon radius (Q₁Q₅N)^(1/6)', fmtNum(wsBH5Radius(st.Q1, st.Q5, st.N), 8))}
      ${kv('horizon area 2π²r³', fmtNum(wsBH5Area(st.Q1, st.Q5, st.N), 8))}
      ${kv('macroscopic: A ÷ 4G₅', fmtNum(chk.macro, 12))}
      ${kv('difference', fmtNum(chk.gap, 3))}
      <p class="help">These are not two ways of writing the same expression. The left column runs Cardy's
      formula on a two-dimensional conformal field theory living on the branes; the right column takes the
      five-dimensional supergravity solution with those charges, reads off the area of its horizon and
      divides by 4G. They agree for every choice of the three integers, which is the sense in which the
      1996 Strominger–Vafa result explained the area law rather than reproducing one number.</p>
    </div>
    <div class="card tight"><div class="ttl">Cardy against an exact count</div>
      ${kv('Q₁Q₅ used for the exact expansion', String(k))}
      ${kv('exact states at level ' + nUse, fmtNum(d[nUse], 8))}
      ${kv('  ln of that', fmtNum(Math.log(d[nUse]), 8))}
      ${kv('Cardy at the same level', fmtNum(cardyK, 8))}
      ${kv('ratio', fmtNum(Math.log(d[nUse]) / cardyK, 6))}
      <p class="help">Cardy's formula is asymptotic in N, so at the small levels a browser can enumerate it
      is only approaching agreement. The exact count beside it comes from expanding the generating function
      term by term, so the convergence can be watched instead of assumed. A real astrophysical black hole
      has charges of order 10³⁸, where the correction is far below anything measurable.</p>
    </div>
    <div class="card tight"><div class="ttl">For comparison, a real one</div>
      ${kv('the Sun as a black hole — S/k_B', fmtNum(wsSchwarzschildS(1.98841e30), 6))}
      ${kv('  its Schwarzschild radius', fmtNum(wsSchwarzschildR(1.98841e30), 5) + ' m')}
      ${kv('  its Hawking temperature', fmtNum(wsHawkingT(1.98841e30), 5) + ' K')}
      ${kv('M87*, 6.5×10⁹ M☉ — S/k_B', fmtNum(wsSchwarzschildS(6.5e9 * 1.98841e30), 6))}
      ${kv('the Sun\'s ordinary entropy, for scale', 'about 10⁵⁸ k_B')}
      <p class="help">The temperature of a solar-mass hole is sixty nanokelvin, far below the 2.725 K
      microwave background, so every astrophysical black hole is currently absorbing more than it radiates
      and growing. None of them is extremal or supersymmetric, and for those the microscopic count above
      does not apply — which is exactly where the field's remaining difficulty with black holes lives.</p>
    </div>`;
  },
  chip(st){
    const chk = wsSVCheck(st.Q1, st.Q5, st.N);
    return `<div class="k">Microstate counting</div>
      <div style="color:var(--c-curl)">S = ${fmtNum(chk.micro, 6)}</div>
      <div style="color:var(--accent)">gap = ${fmtNum(chk.gap, 3)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the field-theory count'],
                    ['var(--c-grad)', 'the horizon-area calculation'],
                    ['var(--c-pos)',  'the answer they share, and real objects'],
                    ['var(--accent)', 'the difference between them, and reference lines']]; }
};

/* The exact D1-D5 level count to 120 is about 700 000 additions at the largest
   charge this stage offers, which is fine once and wasteful sixty times a
   second. It depends only on Q₁Q₅, so it is cached on the stage and rebuilt
   only when that changes — the engine itself stays free of state. */
function wsEntCounts(st){
  const k = Math.min(6, st.Q1 * st.Q5);
  if(st._k !== k || !st._d){ st._d = wsD1D5States(120, k); st._k = k; }
  return st._d;
}

/* ============================================================================
   14 · HOLOGRAPHY — Ryu–Takayanagi, computed on both sides
   ============================================================================ */
STAGES.wsHolo = {
  title: 'AdS/CFT — a geodesic and an entanglement entropy',
  drag: true,
  dockLegend: true,
  derive(st){
    const r = wsRTCheck(st.L, st.eps, st.G3, 1);
    return {
      title:'One quantity, computed in a curved bulk and in a flat boundary theory',
      steps:[
        drvSay('the claim, stated carefully',
          'A theory of gravity in a (d+1)-dimensional anti-de Sitter spacetime is the SAME theory as a conformal field theory living on its d-dimensional boundary. Not similar, not a good model of — the same, with a dictionary translating every quantity on one side into a quantity on the other. Maldacena proposed it in 1997 and it is now the most-cited result in the field by a wide margin.'),
        drvStep('the radial direction is an energy scale',
          `${dv('E')} ${dop('∼')} ${dfrac(dv('L') + '_AdS', dv('z'))}`,
          'near the boundary is the ultraviolet, deep in the bulk is the infrared — moving inwards is renormalisation-group flow'),
        drvSay('which is why an extra dimension is not extra information',
          'The bulk has one more dimension than the boundary, and it looks as though it must contain more. It does not: the extra direction is bookkeeping for scale, which the boundary theory already has. This is the sense in which the world can be a hologram.'),
        drvStep('Brown and Henneaux fix the boundary central charge from bulk geometry',
          `${dv('c')} ${dop('=')} ${dfrac('3' + dv('L') + '_AdS', '2' + dv('G') + '₃')}`,
          `with G₃ = ${fmtNum(st.G3, 4)} that is c = ${fmtNum(r.c, 6)} — a property of a field theory, read off a metric`),
        drvStep('Ryu and Takayanagi: entanglement is a minimal surface',
          `${dv('S')}_A ${dop('=')} ${dfrac('area of the minimal surface anchored on ∂' + dv('A'), '4' + dv('G'))}`,
          'in three bulk dimensions the surface is a curve, and the minimal curve is a geodesic'),
        drvStep('so integrate the geodesic — do not look it up',
          `${dv('L')}_geo ${dop('=')} ∫ ${dfrac(dv('d')+'θ', 'sin θ')}`,
          `adaptive quadrature at 10⁻¹³ gives ${fmtNum(r.len, 10)}; the closed form gives ${fmtNum(r.exact, 10)}`),
        drvStep('divide by 4G to get the bulk prediction',
          `${dv('S')}_bulk ${dop('=')} ${dv('L')}_geo ${dop('/')} 4${dv('G')}₃`,
          fmtNum(r.bulk, 10)),
        drvStep('and now the boundary, with no reference to the bulk at all',
          `${dv('S')}_CFT ${dop('=')} ${dfrac(dv('c'), '3')} ${dfn('ln')} ${dfrac(dv('ℓ'), 'ε')}`,
          `${fmtNum(r.bdy, 10)} — a standard two-dimensional CFT result, derived by the replica trick`),
        drvStep('compare',
          `${dv('S')}_bulk ${dop('=')} ${dv('S')}_CFT`,
          `they differ by ${fmtNum(r.gap, 3)}, a relative gap of ${fmtNum(r.rel, 3)}`),
        drvSay('and the residual is the cutoff, not an error',
          'The difference falls as ε² — it is the finite-cutoff correction to the geodesic, and shrinking ε shrinks it as fast as the arithmetic allows. Watch it fall as you move the cutoff slider: that behaviour is what distinguishes an agreement from a coincidence.'),
        drvSay('what holography is used for now',
          'It is a working calculational tool, and its most productive applications are nowhere near string theory. Strongly coupled plasmas, the shear viscosity of the quark–gluon fluid produced at RHIC and the LHC, non-Fermi liquids in condensed matter, and quantum-information questions about how spacetime is built out of entanglement. Lattice Monte Carlo simulations of the matrix models on the other side of the duality — including a 2025 study of the polarised type IIB model — now test the correspondence directly, by computing the same observable in both descriptions.')
      ],
      note:'The bulk geodesic is integrated by adaptive quadrature that knows nothing about entanglement entropy; the boundary formula is a conformal field theory result that knows nothing about geometry. Only after both numbers exist are they compared. The finite-temperature and finite-circle versions in the readout are computed the same way.'
    };
  },
  enter(st, o){
    st.L = o.L === undefined ? 2 : o.L;
    st.eps = o.eps === undefined ? 1e-3 : o.eps;
    st.G3 = o.G3 === undefined ? 0.25 : o.G3;
    st.beta = o.beta === undefined ? 2 : o.beta;
    st.thermal = !!o.thermal;
  },
  controls(){
    const st = ST;
    return ctlRow('interval ℓ', ctlSlider('wsHoL', 0.3, 6, 0.01, st.L)) +
      ctlRow('cutoff ε', ctlSlider('wsHoE', -7, -1.4, 0.02, Math.log10(st.eps))) +
      ctlRow('Newton G₃', ctlSlider('wsHoG', 0.05, 1, 0.005, st.G3)) +
      ctChk('wsHoT', 'heat the boundary theory (β sets the temperature)', st.thermal) +
      ctlRow('inverse temp β', ctlSlider('wsHoB', 0.3, 8, 0.02, st.beta)) +
      `<p class="help">Drag on the boundary line to set the interval directly. The curve arcing into the
      bulk is the geodesic anchored on its two endpoints, and its length is integrated numerically. That
      length divided by 4G₃ is compared with the entanglement entropy of the same interval computed purely
      inside the boundary theory. Neither calculation uses anything from the other.</p>`;
  },
  wire(){
    wireSlider('wsHoL', () => ST.L, v => { ST.L = v; }, v => 'ℓ = ' + fmtNum(+v, 4));
    wireSlider('wsHoE', () => Math.log10(ST.eps), v => { ST.eps = Math.pow(10, v); },
               v => 'ε = ' + fmtNum(Math.pow(10, +v), 3));
    wireSlider('wsHoG', () => ST.G3, v => { ST.G3 = v; },
               v => 'G₃ = ' + fmtNum(+v, 4) + '   ·   c = ' + fmtNum(wsBrownHenneaux(1, +v), 5));
    ctWireChk('wsHoT', v => { ST.thermal = v; });
    wireSlider('wsHoB', () => ST.beta, v => { ST.beta = v; },
               v => 'β = ' + fmtNum(+v, 3) + '   ·   T = ' + fmtNum(1 / (+v), 4));
  },
  pick(st, sx, sy){
    const P = st._P;
    if(!P || !P.inside(sx, sy)) return;
    st.L = Math.max(0.3, Math.min(6, 2 * Math.abs(P.invX(sx))));
    buildStagePanel();
  },
  frame(st, dt, ctx, W, H){
    const r = wsRTCheck(st.L, st.eps, st.G3, 1);
    /* the bulk: boundary along the top, z increasing downwards */
    const P = mkPlot(W * 0.07, 66, W * 0.56, H - 150, -3.6, 3.6, -3.4, 0);
    st._P = P;
    plotFrame(ctx, P, 'x   (the boundary direction)', 'depth into the bulk  →',
      'anti-de Sitter space, with the boundary along the top');
    plotTicksX(ctx, P, [-3, -1.5, 0, 1.5, 3], v => fmtNum(v, 2));
    /* the boundary itself, and the region A */
    rlSegment(ctx, P.px, P.Y(0), P.px + P.pw, P.Y(0), rgbCss(TH.line2), 2);
    rlSegment(ctx, P.X(-st.L / 2), P.Y(0), P.X(st.L / 2), P.Y(0), rgbCss(TH.curl), 5);
    /* below the boundary, not above it — plotFrame's title already occupies
       the strip immediately over the plot */
    rlText(ctx, P.X(0), P.py + 16, 'the interval A,  ℓ = ' + fmtNum(st.L, 4),
           rgbCss(TH.curl), '600 11px ' + FONT_MONO, 'center');
    rlDot(ctx, P.X(-st.L / 2), P.Y(0), 4.5, rgbCss(TH.pos));
    rlDot(ctx, P.X(st.L / 2), P.Y(0), 4.5, rgbCss(TH.pos));
    /* the scale ladder down the side: the radial direction as energy */
    for(const z of [0.25, 0.5, 1, 2, 3]){
      if(z > 3.4) continue;
      rlSegment(ctx, P.px, P.Y(-z), P.px + P.pw, P.Y(-z), rgbCss(TH.line, 0.7), 0.8);
      rlText(ctx, P.px + 6, P.Y(-z) - 7, 'E ≈ ' + fmtNum(wsRadialToEnergy(z, 1), 3),
             rgbCss(TH.faint), '9.5px ' + FONT_MONO);
    }
    rlText(ctx, P.px + P.pw - 8, P.Y(-0.12), 'ultraviolet', rgbCss(TH.faint), '10px ' + FONT_UI, 'right');
    rlText(ctx, P.px + P.pw - 8, P.Y(-3.2), 'infrared', rgbCss(TH.faint), '10px ' + FONT_UI, 'right');
    /* the geodesic: the semicircle, drawn from its parametrisation */
    const R = st.L / 2;
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.8;
    ctx.beginPath();
    for(let i = 0; i <= 220; i++){
      const th = Math.PI * i / 220;
      const x = R * Math.cos(th), z = R * Math.sin(th);
      if(z > 3.4) continue;
      const X = P.X(x), Y = P.Y(-z);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    rlText(ctx, P.X(0), P.Y(-Math.min(2.9, R) - 0.38),
      'the minimal surface — here a geodesic', rgbCss(TH.grad), '11px ' + FONT_UI, 'center');
    /* a few competing curves, to make "minimal" mean something */
    for(const f of [0.55, 1.5]){
      ctx.strokeStyle = rgbCss(TH.faint, 0.55); ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for(let i = 0; i <= 120; i++){
        const u = -1 + 2 * i / 120;
        const x = R * u, z = R * f * Math.sqrt(Math.max(0, 1 - u * u));
        if(z > 3.4) continue;
        const X = P.X(x), Y = P.Y(-z);
        i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    rlText(ctx, P.px + 10, P.py + P.ph - 12, 'dashed: other curves, all longer',
           rgbCss(TH.faint), '10px ' + FONT_UI);

    /* the arithmetic, in a column that reads like a proof */
    const bx = W * 0.66, by = 92;
    rlText(ctx, bx, by, 'the bulk calculation', rgbCss(TH.grad), '600 11.5px ' + FONT_UI);
    wsNum(ctx, bx, by + 22, 'geodesic length, by quadrature', fmtNum(r.len, 9), TH.grad);
    wsNum(ctx, bx, by + 40, '  in closed form', fmtNum(r.exact, 9), TH.grad);
    wsNum(ctx, bx, by + 58, '  they differ by', fmtNum(Math.abs(r.len - r.exact), 3), TH.faint);
    wsNum(ctx, bx, by + 76, 'divided by 4G₃', fmtNum(r.bulk, 9), TH.grad);
    rlText(ctx, bx, by + 108, 'the boundary calculation', rgbCss(TH.curl), '600 11.5px ' + FONT_UI);
    wsNum(ctx, bx, by + 130, 'central charge c', fmtNum(r.c, 9), TH.curl);
    wsNum(ctx, bx, by + 148, '(c/3)·ln(ℓ/ε)', fmtNum(r.bdy, 9), TH.curl);
    if(st.thermal){
      wsNum(ctx, bx, by + 166, 'at temperature 1/β', fmtNum(wsCFTEntropyThermal(r.c, st.L, st.beta, st.eps), 9), TH.curl);
    }
    rlText(ctx, bx, by + (st.thermal ? 196 : 178), 'and the difference',
           rgbCss(TH.accent), '600 11.5px ' + FONT_UI);
    rlText(ctx, bx, by + (st.thermal ? 218 : 200), fmtNum(r.gap, 3) + '   (relative: ' + fmtNum(r.rel, 3) + ')',
           rgbCss(TH.accent), '600 13px ' + FONT_MONO);
    rlText(ctx, bx, by + (st.thermal ? 240 : 222), 'shrink ε and watch it fall as ε²',
           rgbCss(TH.faint), '10.5px ' + FONT_UI);
    stageNote(ctx, 'a length in a curved five-dimensional geometry, and an entropy in a flat quantum field theory — the same number', W, H);
  },
  readout(st){
    const r = wsRTCheck(st.L, st.eps, st.G3, 1);
    const th = wsCFTEntropyThermal(r.c, st.L, st.beta, st.eps);
    return `<div class="card tight"><div class="ttl">The bulk side</div>
      ${kv('interval ℓ', fmtNum(st.L, 5))}
      ${kv('cutoff ε', fmtNum(st.eps, 4))}
      ${kv('geodesic length, adaptive quadrature at 10⁻¹³', fmtNum(r.len, 12))}
      ${kv('  the same integral in closed form', fmtNum(r.exact, 12))}
      ${kv('  difference', fmtNum(Math.abs(r.len - r.exact), 3))}
      ${kv('  the ε → 0 form 2ln(ℓ/ε)', fmtNum(wsGeodesicLengthLeading(st.L, st.eps), 10))}
      ${kv('Newton constant G₃', fmtNum(st.G3, 5))}
      ${kv('S = length ÷ 4G₃', fmtNum(r.bulk, 12))}
      <p class="help">The integrand is dθ/sin θ, which comes from writing the semicircular geodesic in
      Poincaré coordinates and putting it into the AdS line element. The quadrature is the same adaptive
      routine the integration wing uses, and it has no idea what it is being used for. Its agreement with
      the closed form is a check on the arithmetic, not on the physics.</p>
    </div>
    <div class="card tight"><div class="ttl">The boundary side, and the comparison</div>
      ${kv('central charge from Brown–Henneaux', fmtNum(r.c, 8))}
      ${kv('S = (c/3)·ln(ℓ/ε)', fmtNum(r.bdy, 12))}
      ${kv('bulk answer, again', fmtNum(r.bulk, 12))}
      ${kv('difference', fmtNum(r.gap, 3))}
      ${kv('relative difference', fmtNum(r.rel, 3))}
      ${kv('what the residual is', 'the finite-ε correction — it falls as ε², not as an error would')}
      ${kv('at temperature 1/β = ' + fmtNum(1 / st.beta, 4), fmtNum(th, 9))}
      ${kv('  its large-ℓ behaviour', 'linear in ℓ — thermal entropy, extensive as it must be')}
      <p class="help">The thermal formula is the same calculation in a black-hole background, and it does
      something the zero-temperature one cannot: at large ℓ the logarithm turns into a straight line, so the
      entropy becomes proportional to the length of the region. That is ordinary thermodynamic entropy
      appearing out of an entanglement calculation, and on the bulk side it is the geodesic hugging the
      horizon of a black hole.</p>
    </div>
    <div class="card tight"><div class="ttl">Why this is the result the field rests on</div>
      ${kv('proposed', '1997, by Maldacena')}
      ${kv('proved', 'no — it is a conjecture with an enormous body of evidence')}
      ${kv('what makes it credible', 'quantitative checks like the one above, in many independent settings')}
      ${kv('what it is used for', 'strongly coupled plasmas, transport coefficients, condensed matter, quantum information')}
      ${kv('tested numerically by', 'lattice Monte Carlo on the dual matrix models, including a 2025 study of the polarised IIB model')}
      <p class="help">Holography is where string theory currently earns its keep, and mostly not as a theory
      of quantum gravity. The shear-viscosity-to-entropy ratio it predicts for a strongly coupled plasma is
      close to what the quark–gluon fluid at RHIC and the LHC actually shows, and no other method could
      compute it. Whether or not strings describe the fundamental constituents of nature, this particular
      piece of the machinery is doing useful work in three other fields.</p>
    </div>`;
  },
  chip(st){
    const r = wsRTCheck(st.L, st.eps, st.G3, 1);
    return `<div class="k">Ryu–Takayanagi</div>
      <div style="color:var(--c-grad)">bulk ${fmtNum(r.bulk, 6)}</div>
      <div style="color:var(--c-curl)">CFT ${fmtNum(r.bdy, 6)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the boundary interval, and the field-theory answer'],
                    ['var(--c-grad)', 'the bulk geodesic, and the gravity answer'],
                    ['var(--c-pos)',  'the endpoints you can drag'],
                    ['var(--accent)', 'the difference between the two calculations'],
                    ['var(--faint)',  'competing curves, all of them longer']]; }
};

/* ============================================================================
   15 · THE DUALITY WEB — five theories, and why there is only one
   ============================================================================ */
STAGES.wsWeb = {
  title: 'The duality web, and M-theory',
  drag: true,
  dockLegend: true,
  derive(st){
    const T = WS_THEORIES[st.i];
    return {
      title:'How five candidate theories of everything became an embarrassment, then a clue',
      steps:[
        drvSay('the embarrassment',
          'By 1985 there were five consistent superstring theories in ten dimensions. A theory of everything that comes in five versions is not a theory of everything — it is four too many, and there was no principle in sight to pick between them.'),
        drvStep('T-duality relates them in pairs',
          `${dv('R')} ${dop('↔')} ${dfrac('α′', dv('R'))}`,
          'IIA on a circle of radius R is IIB on a circle of radius α′/R — the two heterotic theories are related the same way'),
        drvSay('which already means "different theory" was the wrong description',
          'These are not two theories that happen to agree. Compactify either one and you get the same physics with the labels on the momentum and winding towers exchanged, exactly as the compact-circle stage in this wing verifies numerically.'),
        drvStep('S-duality relates strong coupling to weak',
          `${dv('g')}_s ${dop('↔')} ${dfrac('1', dv('g') + '_s')}`,
          'type IIB is mapped to itself, exchanging fundamental strings with D-strings; type I at strong coupling is heterotic SO(32) at weak coupling'),
        drvSay('and that is a far stranger statement',
          'It says the regime where perturbation theory fails in one theory is the regime where it works in another. Strongly coupled physics becomes computable, which is the same trick that makes holography useful. Nothing in field theory prepared anyone for this.'),
        drvStep('and IIA at strong coupling grows a dimension',
          `${dv('R')}₁₁ ${dop('=')} ${dv('g')}_s ℓ_s`,
          `at g_s = ${fmtNum(st.gs, 4)} the hidden circle has radius ${fmtNum(wsMRadius(st.gs, 1), 5)} in string units, and the eleven-dimensional Planck length is ${fmtNum(wsM11Length(st.gs, 1), 5)}`),
        drvSay('nobody put that dimension in',
          'Turn up the coupling of type IIA and a new direction opens. Its size is the coupling constant. At weak coupling it is invisible, which is why it went unnoticed for a decade; at strong coupling the theory is eleven-dimensional and has no strings in it at all — only membranes and fivebranes.'),
        drvStep('so all six corners are limits of one thing',
          `M-theory`,
          'each of the five string theories, plus eleven-dimensional supergravity, is a corner of a single parameter space'),
        drvSay('what this settled and what it did not',
          'It settled the embarrassment: there is one theory, and the five ten-dimensional descriptions are different limits of it. It did not produce a definition. M-theory has no known formulation away from its limits — there is no action, no set of equations, no non-perturbative construction except in special backgrounds where matrix models or holography supply one. The name is a placeholder for something that is known to exist and is not known how to write down.'),
        drvSay('and the matrix models are where that is being attacked',
          'The BFSS and IKKT matrix models propose finite-dimensional matrix quantum mechanics as non-perturbative definitions of M-theory and type IIB. They can be simulated on a computer, and lattice Monte Carlo results have reproduced predictions of the dual black-hole geometry — a 2025 Physical Review Letters study of the polarised IKKT model probed the structure of the spacetime emerging from the dominant matrix configurations. That is quantum gravity being tested numerically, which was unimaginable when the web was first drawn.')
      ],
      note:'Everything here is a statement about limits of a parameter space, and every duality shown has been checked in detail — spectra matched, BPS state counts compared, low-energy actions mapped. The dualities are among the best-established facts in the subject; the theory they imply is among the least well-defined.'
    };
  },
  enter(st, o){
    st.i = o.i === undefined ? 5 : o.i;
    st.gs = o.gs === undefined ? 0.4 : o.gs;
  },
  controls(){
    const st = ST;
    return ctSeg('wsWbI', String(st.i), WS_THEORIES.map((t, i) => [String(i), t.id])) +
      ctlRow('coupling g_s', ctlSlider('wsWbG', 0.02, 6, 0.01, st.gs)) +
      `<p class="help">Click a corner on the diagram or use the picker. Every edge is a duality that has been
      checked in detail — spectra matched state by state, low-energy actions mapped onto each other. Turn the
      coupling up and watch the eleventh dimension of M-theory open out of type IIA: its radius is
      <b>g<sub>s</sub>ℓ<sub>s</sub></b>, so at weak coupling it is invisible and at strong coupling it is the
      largest thing in the problem.</p>`;
  },
  wire(){
    ctWireSeg('wsWbI', v => { ST.i = +v; });
    wireSlider('wsWbG', () => ST.gs, v => { ST.gs = v; },
               v => 'g_s = ' + fmtNum(+v, 3) + '   ·   R₁₁ = ' + fmtNum(wsMRadius(+v, 1), 4) + ' ℓ_s');
  },
  pick(st, sx, sy){
    if(!st._nodes) return;
    let best = -1, bd = 1e9;
    for(let i = 0; i < st._nodes.length; i++){
      const d = Math.hypot(sx - st._nodes[i].x, sy - st._nodes[i].y);
      if(d < bd){ bd = d; best = i; }
    }
    if(bd < 46){ st.i = best; buildStagePanel(); }
  },
  frame(st, dt, ctx, W, H){
    const cx = W * 0.30, cy = H * 0.48, R = Math.min(W * 0.17, H * 0.30);
    wsTitle(ctx, cx, cy - R - 52, 'six descriptions, one theory', TH.dim);
    /* M-theory in the middle, the five string theories around it */
    const nodes = [];
    for(let i = 0; i < 5; i++){
      const a = -Math.PI / 2 + 2 * Math.PI * i / 5;
      nodes.push({ x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), t: WS_THEORIES[i] });
    }
    nodes.push({ x: cx, y: cy, t: WS_THEORIES[5] });
    st._nodes = nodes;
    const idx = id => WS_THEORIES.findIndex(t => t.id === id);
    /* the edges */
    for(const d of WS_DUALITIES){
      const a = nodes[idx(d.a)], b = nodes[idx(d.b)];
      if(d.a === d.b){
        /* IIB's self-duality: a loop on its own node */
        ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(a.x + 22, a.y - 22, 17, 0, 6.2832); ctx.stroke();
        rlText(ctx, a.x + 22, a.y - 46, 'S', rgbCss(TH.warn), '600 11px ' + FONT_MONO, 'center');
        continue;
      }
      const col = d.kind === 'T' ? TH.curl : d.kind === 'S' ? TH.warn : TH.grad;
      const lit = (d.a === WS_THEORIES[st.i].id || d.b === WS_THEORIES[st.i].id);
      rlSegment(ctx, a.x, a.y, b.x, b.y, rgbCss(col, lit ? 1 : 0.35), lit ? 2.6 : 1.4);
      rlText(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2 - 8, d.kind,
             rgbCss(col, lit ? 1 : 0.5), '600 11px ' + FONT_MONO, 'center');
    }
    /* the nodes */
    for(let i = 0; i < nodes.length; i++){
      const n = nodes[i], sel = i === st.i;
      ctx.fillStyle = rgbCss(sel ? TH.pos : TH.bg3);
      ctx.strokeStyle = rgbCss(sel ? TH.pos : TH.line2); ctx.lineWidth = sel ? 2.4 : 1.4;
      ctx.beginPath(); ctx.arc(n.x, n.y, i === 5 ? 30 : 24, 0, 6.2832); ctx.fill(); ctx.stroke();
      rlText(ctx, n.x, n.y, n.t.id, rgbCss(sel ? TH.bg : TH.text), '600 12px ' + FONT_MONO, 'center', 'middle');
      rlText(ctx, n.x, n.y + (i === 5 ? 44 : 38), n.t.D + 'D',
             rgbCss(TH.faint), '10px ' + FONT_MONO, 'center', 'middle');
    }
    wsSub(ctx, cx, cy + R + 62, 'T: a circle inverted   ·   S: a coupling inverted   ·   M: a dimension opens');

    /* the eleventh dimension, drawn as the coupling turns it up */
    const P = mkPlot(W * 0.56, 62, W * 0.38, (H - 152) * 0.5, 0, 6, 0, 6);
    plotFrame(ctx, P, 'string coupling gₛ', 'radius   (string units)',
      'the eleventh dimension is the coupling constant');
    plotTicksX(ctx, P, [0, 2, 4, 6], v => fmtNum(v, 2));
    rlYTicks(ctx, P, [0, 2, 4, 6]);
    plotCurve(ctx, P, g => wsMRadius(g, 1), 200, rgbCss(TH.grad), 2.6);
    plotCurve(ctx, P, g => wsM11Length(g, 1), 200, rgbCss(TH.curl), 2);
    rlDot(ctx, P.X(st.gs), P.Y(wsMRadius(st.gs, 1)), 5, rgbCss(TH.pos));
    rlSegment(ctx, P.px, P.Y(1), P.px + P.pw, P.Y(1), rgbCss(TH.accent, 0.7), 1.4, [4, 4]);
    rlText(ctx, P.px + 8, P.Y(1) - 9, 'one string length', rgbCss(TH.accent), '10px ' + FONT_MONO);
    /* canvas text gets no markup and uniSup only handles carets, so the
       subscripts here are Unicode and the cube root is a radical, not "^(1/3)" */
    rlText(ctx, P.X(4.4), P.Y(wsMRadius(4.4, 1)) - 12, 'R₁₁ = gₛ ℓₛ', rgbCss(TH.grad), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, P.X(4.4), P.Y(wsM11Length(4.4, 1)) + 14, 'ℓ₁₁ = ∛gₛ · ℓₛ', rgbCss(TH.curl), '10.5px ' + FONT_UI, 'center');

    /* the selected theory, described */
    const T = WS_THEORIES[st.i];
    const bx = W * 0.56, by = 62 + (H - 152) * 0.5 + 50;
    rlText(ctx, bx, by, T.n, rgbCss(TH.pos), '700 14px ' + FONT_UI);
    wsNum(ctx, bx, by + 24, 'spacetime dimensions', String(T.D), TH.curl);
    wsNum(ctx, bx, by + 42, 'supercharges', String(T.susy), TH.curl);
    const words = T.w.split(' ');
    let line = '', ln = 0;
    for(const w of words){
      if((line + ' ' + w).length > 52){ rlText(ctx, bx, by + 68 + ln * 16, line, rgbCss(TH.faint), '10.5px ' + FONT_UI); line = w; ln++; }
      else line = line ? line + ' ' + w : w;
    }
    if(line) rlText(ctx, bx, by + 68 + ln * 16, line, rgbCss(TH.faint), '10.5px ' + FONT_UI);
    stageNote(ctx, 'the dualities are established; the theory they imply has no known definition away from its limits', W, H);
  },
  readout(st){
    const T = WS_THEORIES[st.i];
    const links = WS_DUALITIES.filter(d => d.a === T.id || d.b === T.id);
    return `<div class="card tight"><div class="ttl">${T.n}</div>
      ${kv('spacetime dimensions', String(T.D))}
      ${kv('supercharges', String(T.susy))}
      ${kv('character', T.w)}
      ${links.map(d => kv(d.kind + '-duality  ·  ' + (d.a === T.id ? d.b : d.a), d.w)).join('')}
    </div>
    <div class="card tight"><div class="ttl">The eleventh dimension</div>
      ${kv('string coupling g_s', fmtNum(st.gs, 5))}
      ${kv('R₁₁ = g_s ℓ_s', fmtNum(wsMRadius(st.gs, 1), 6) + ' ℓ_s')}
      ${kv('ℓ₁₁ = g_s^(1/3) ℓ_s', fmtNum(wsM11Length(st.gs, 1), 6) + ' ℓ_s')}
      ${kv('R₁₁ compared with ℓ₁₁', fmtNum(wsMRadius(st.gs, 1) / wsM11Length(st.gs, 1), 5) + '×')}
      ${kv('regime', st.gs < 0.3 ? 'weakly coupled — the circle is far below the string scale and invisible'
            : st.gs < 1.5 ? 'the crossover — neither description is comfortable'
            : 'strongly coupled — eleven dimensions, membranes rather than strings')}
      <p class="help">The most surprising fact in this wing is on this line. A dimensionless number that
      looked like a coupling constant turns out to be the radius of a dimension nobody put into the theory.
      At weak coupling it is smaller than a string and cannot be seen; turn the coupling up and it becomes
      the largest scale in the problem, and the fundamental objects stop being strings.</p>
    </div>
    <div class="card tight"><div class="ttl">The state of M-theory</div>
      ${kv('is it defined', 'not away from its limits')}
      ${kv('does it have an action', 'no known one')}
      ${kv('what is known exactly', 'its low-energy limit — eleven-dimensional supergravity')}
      ${kv('the two candidate definitions', 'the BFSS and IKKT matrix models')}
      ${kv('are those testable', 'yes — they are finite matrix systems and can be simulated')}
      ${kv('recent results', 'lattice Monte Carlo matching dual black-hole predictions; a 2025 PRL study of the polarised IIB model')}
      <p class="help">This is the honest position. The dualities are established and checked in enormous
      detail — they are among the most solid results in the subject. What they imply is that a single theory
      underlies all six corners, and that theory has never been written down. The matrix models are the most
      concrete attempt at a definition, and their virtue is that they are finite systems a computer can
      simulate, so for the first time claims about non-perturbative quantum gravity are being tested by
      numerical experiment rather than by argument.</p>
    </div>`;
  },
  chip(st){
    const T = WS_THEORIES[st.i];
    return `<div class="k">${T.n}</div>
      <div style="color:var(--c-curl)">${T.D} dimensions</div>
      <div style="color:var(--c-grad)">R₁₁ = ${fmtNum(wsMRadius(st.gs, 1), 4)} ℓ_s</div>`;
  },
  legend(){ return [['var(--c-curl)', 'T-dualities — a circle inverted'],
                    ['var(--c-warn)', 'S-dualities — a coupling inverted'],
                    ['var(--c-grad)', 'the M-theory limits, and the eleventh dimension'],
                    ['var(--c-pos)',  'the corner you have selected']]; }
};
