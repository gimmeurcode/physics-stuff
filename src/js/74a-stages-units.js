/* ============================================================================
   5t · UNITS, DIMENSIONS & UNCERTAINTY — the stages  (Programme C wing C3)

     unDim     one unit expression, its seven exponents, TWO ways
     unHomog   both sides of an equation, dimension by dimension
     unPi      Buckingham's theorem as a null space — and Trinity's yield
     unSig     what a significant figure guarantees, and what destroys it
     unProp    a linear error bar against a Monte Carlo, with the gap printed

   The engine is 30a-units.js; nothing here computes a dimension or an error
   bar by hand.
   ============================================================================ */

/* ---- the reader's own unit expression ------------------------------------
   Same shape as cnBuild: fnWire's `build` hook does the validation, so the
   error line, the debounce and the caret restoration all come from the shared
   helper. `audit` is what a gate types in, and must differ from every default
   this wing ships or the "did typing change anything" check sees nothing. */
const unBuild = s => {
  const P = unRead(s);
  if(!P.ok) throw new Error(P.why);
  return { d:P.d, f:() => 0 };
};
const UN_SLOT = (k, label, def, audit) =>
  ({ k, label, def, vars:'a unit — kg m / s^2, J/(kg K), V/m, N s',
     audit:audit || 'kg m^2 / (s^3 A)', build:unBuild });

/* ---- a plot box whose LEFT MARGIN clears the readout chip ------------------
   plotFrame routes its centred title through ctTitleClearChip, and that is all
   the help the core gives. Every stage in this wing writes row labels in the
   left margin — "M (kg)", "M", the dimension matrix's row names — and the chip
   floats over exactly that corner, so the top row printed through it on all
   three. auditticks found it; nothing else could have.

   Pushing the whole box below the chip is the fix rather than shortening the
   labels, because the labels are the picture's key. `ctChipZone` reports zero
   when there is no chip, so on a stage without one nothing is given away. */
function unChipBox(ctx, W, H, pad, bottom){
  const z = ctChipZone(ctx);
  const top = Math.max(pad === undefined ? 42 : pad, z.h + 8);
  return ctFitBox(46, top, W - 92, H - top - (bottom === undefined ? 62 : bottom));
}

/* ============================================================================
   1 · what a unit expression IS
   ============================================================================ */
const UN_EXPRS = {
  newton: { short:'the newton', name:'a newton, taken apart',
            src:'kg m / s^2',
            why:'The newton is not a base unit and never was. F = ma says what it is: a kilogram accelerated by a metre per second per second. Every named unit below is the same kind of abbreviation.' },
  joule:  { short:'the joule', name:'a joule, three ways',
            src:'N m',
            why:'Force times distance, and the panel reduces it to base units without being told that a joule is also a watt-second, a coulomb-volt and a pascal-cubic-metre. Those are not four facts; they are one dimension vector written four ways.' },
  volt:   { short:'the volt', name:'a volt, which hides four base units',
            src:'kg m^2 / (s^3 A)',
            why:'Energy per charge — and charge is an ampere-second, so the volt drags the second in twice and the ampere in once with a negative sign. This is the first expression here that nobody can reduce in their head, which is the point of doing it mechanically.' },
  ohm:    { short:'the ohm', name:'an ohm, from V/A',
            src:'V/A',
            why:'The panel is handed V/A and returns kg m² s⁻³ A⁻², which is the same vector the table stores for the ohm — computed from the volt rather than looked up. Two entries in that table agree because the arithmetic makes them, not because they were typed consistently.' },
  heat:   { short:'specific heat', name:'a specific heat capacity',
            src:'J/(kg K)',
            why:'Three named units in one expression, and no shorter name for the result. Most derived units have no name at all, which is why the seven exponents are the real object and the names are convenience.' },
  eVnm:   { short:'eV per nm', name:'electronvolts per nanometre — a force',
            src:'eV/nm',
            why:'An energy divided by a length is a force, whatever units it is dressed in, and the panel says so: M L T⁻². The SI factor is 1.60×10⁻¹⁰, so this is a very small force expressed in units chosen to make the numbers pleasant — which is the entire reason non-SI units survive.' },
  root:   { short:'a square root', name:'√(length) — a half-integer exponent',
            src:'m^(1/2)',
            why:'Dimensions are a vector space over the rationals, not over the integers, and the pendulum needs that: √(L/g) has L^½ T⁻¹ in it and no amount of insisting on whole powers makes it go away. The picture draws a half-height bar.' },
  planck: { short:'action', name:'a joule-second — the dimension of action',
            src:'J s',
            why:'The one combination Planck\'s constant carries, and the reason ħ appears wherever an angular momentum, a phase or an area in phase space does. All three have this vector.' },
  custom: { short:'type your own', name:'your own expression',
            src:'kg m^2 / (s^2 K mol)',
            why:'Anything built from the units this wing knows.' }
};

STAGES.unDim = {
  title:'What a unit expression is',
  enter(st, o){ st.ekey = o.ekey || 'newton'; st.both = o.both !== false; },
  cur(st){
    if(st.ekey === 'custom'){
      const own = pkOwn(st, 'unDm', [UN_SLOT('u', 'the unit', UN_EXPRS.custom.src)]);
      const C = unDimCheck(own.u);
      return { src:own.u, name:'your own expression', why:UN_EXPRS.custom.why, C };
    }
    const E = UN_EXPRS[st.ekey];
    return { src:E.src, name:E.name, why:E.why, C:unDimCheck(E.src) };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('unDmK', st.ekey, Object.keys(UN_EXPRS).map(k => [k, UN_EXPRS[k].short])) +
      pkBoxes('unDm', st.ekey, st, [UN_SLOT('u', 'the unit', UN_EXPRS.custom.src)], null,
              'Write it the way you would on paper. <b>kg m / s^2</b>, <b>N s</b>, ' +
              '<b>J/(kg K)</b>, <b>V/m</b>, <b>m^(1/2)</b> and <b>1/s</b> are all read. ' +
              'Juxtaposition is multiplication, so the spaces matter no more than they do on paper.') +
      `<div class="row wrap">${ctChk('unDmB', 'draw the second route on top', st.both)}</div>
      ${N.C.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.C.why)} — the picture keeps the last expression that read.</p>`}
      <p class="help">Seven bars, one per base dimension. A unit is <b>nothing but</b> those seven
      numbers together with a scale factor: two expressions with the same seven are the same physical
      quantity however differently they are spelt, and two with different sevens can never be added.</p>
      <p class="help">The pale outline behind each bar is a second measurement of the same exponent,
      and it is not a copy. It comes from giving the seven base units the numerical values 2, 3, 5, 7,
      11, 13 and 17 raised to assorted powers, <i>evaluating the expression as an ordinary product</i>,
      and reading the exponents out of the logarithms by solving a 7 × 7 system. Nothing about
      exponent vectors is used to get it, so a sign error in "dividing subtracts" could not survive.</p>`;
  },
  wire(){
    ctWireSeg('unDmK', v => { ST.ekey = v; });
    pkWireBoxes('unDm', ST.ekey, ST, [UN_SLOT('u', 'the unit', UN_EXPRS.custom.src)], null);
    ctWireChk('unDmB', v => { ST.both = v; });
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st), C = N.C;
    const B = unChipBox(ctx, W, H);
    let hi = 1;
    for(let i = 0; i < UN_NB; i++) hi = Math.max(hi, Math.abs(C.d[i]), Math.abs(C.d2[i]));
    hi = Math.ceil(hi * 2) / 2 + 0.5;
    const P = mkPlot(B.px, B.py, B.pw, B.ph, -hi, hi, -0.5, UN_NB - 0.5);
    plotFrame(ctx, P, 'exponent', '', 'the seven exponents of ' + N.src);
    ctPath(ctx, P, [{ x:0, y:-0.5 }, { x:0, y:UN_NB - 0.5 }], rgbCss(TH.line2), 1.4);
    /* ctUnitMarks returns {vals, step}, not an array — and the step it returns
       is the ROUNDED one fmtTick needs, which is the whole reason to take it
       from there rather than from (hi−lo)/n */
    const M = ctUnitMarks(-hi, hi, 9);
    plotTicksX(ctx, P, M.vals, v => fmtTick(v, M.step));
    for(let i = 0; i < UN_NB; i++){
      /* the row runs top to bottom in SI's order, so y is flipped */
      const y = UN_NB - 1 - i;
      const e1 = C.d[i], e2 = C.d2[i];
      const col = Math.abs(e1) < 1e-9 ? TH.faint : (e1 > 0 ? TH.pos : TH.neg);
      ctFill(ctx, P, [{ x:0, y:y - 0.3 }, { x:e1, y:y - 0.3 },
                      { x:e1, y:y + 0.3 }, { x:0, y:y + 0.3 }], rgbCss(col, 0.55));
      ctPath(ctx, P, [{ x:0, y:y - 0.3 }, { x:e1, y:y - 0.3 },
                      { x:e1, y:y + 0.3 }, { x:0, y:y + 0.3 }, { x:0, y:y - 0.3 }], rgbCss(col), 1.6);
      if(st.both)
        ctPath(ctx, P, [{ x:0, y:y - 0.42 }, { x:e2, y:y - 0.42 },
                        { x:e2, y:y + 0.42 }, { x:0, y:y + 0.42 }, { x:0, y:y - 0.42 }],
               rgbCss(TH.warn, 0.85), 1.4, [5, 4]);
      ctText(ctx, P.px - 10, P.Y(y), UN_BASE[i] + '  (' + UN_BASE_U[i] + ')',
             rgbCss(TH.dim), '11px ' + FONT_UI, 'right', 'middle');
      if(Math.abs(e1) > 1e-9)
        ctText(ctx, P.X(e1) + (e1 > 0 ? 7 : -7), P.Y(y), fmtNum(e1, 4),
               rgbCss(col), '600 11px ' + FONT_UI, e1 > 0 ? 'left' : 'right', 'middle');
    }
    stageNote(ctx, unFmtSI(C.d) + (unNamed(C.d) ? '   —   one ' + unNamed(C.d) : ''), W, H);
  },
  derive(st){
    const N = this.cur(st), C = N.C;
    return {
      title:'Two routes to a dimension vector',
      steps:[
        drvSay('a dimension is a vector, and this is not a metaphor',
          'Multiplying two quantities adds their exponents; raising to a power multiplies them; dividing subtracts. Those are exactly the axioms of a vector space over the rationals, with the seven base dimensions as a basis. Everything below is linear algebra you have already done, wearing units.'),
        drvStep('route 1 — walk the expression and add exponents',
          `${dv('d')}(${dv('a')}${dv('b')}) ${dop('=')} ${dv('d')}(${dv('a')}) ${dop('+')} ${dv('d')}(${dv('b')}), &nbsp; ${dv('d')}(${dv('a')}${uniSup('n')}) ${dop('=')} ${dv('n')} ${dv('d')}(${dv('a')})`,
          unFmtDim(C.d) + '  —  in SI base units, ' + unFmtSI(C.d)),
        drvSay('that route can be wrong in a way that looks right',
          'A sign flipped in the division rule gives a plausible vector for every expression a reader is likely to try, because most of them are products. Checking it against a table of named units would not help either: the table was typed by the same hand.'),
        drvStep('route 2 — give the base units NUMBERS and evaluate',
          `${dv('kg')} ${dop('→')} λ₁, ${dv('m')} ${dop('→')} λ₂, … &nbsp; ⇒ &nbsp; value ${dop('=')} ∏ λᵢ${uniSup('dᵢ')}`,
          'the expression is evaluated as ordinary arithmetic — no exponent is ever added'),
        drvStep('take logarithms, and it is a linear system',
          `${dfn('log')} ${dv('v')} ${dop('=')} ∑ᵢ ${dv('d')}ᵢ ${dfn('log')} λᵢ`,
          'seven independent choices of λ give seven equations for the seven unknown exponents'),
        drvSay('the λ are primes, and that is not decoration',
          'The matrix of the system is made of logarithms of the chosen numbers. Logarithms of distinct primes are rationally independent, so the matrix is never singular — whereas a random draw would occasionally be near-singular and produce a gate that fails on the second Tuesday of the month. Choosing the data to condition the problem is cheaper than solving a badly conditioned one.'),
        drvStep('and the two routes are compared, not assumed',
          `${dfn('max')}ᵢ |${dv('d')}ᵢ${dop('−')}${dv('d')}ᵢ′|`,
          fmtGapTight(C.gap, C.gross) + ' — worst of the seven exponents'),
        drvSay('what the scale of that gap is',
          'The exponents themselves are the scale, and they are small integers or halves. A residual of 10⁻¹⁶ there is float64 round-off in the linear solve and nothing else; anything at 10⁻³ would be a real disagreement, because no physical exponent is that close to another one.')
      ],
      note:'The scale factor is carried separately and is not a dimension: ' +
           'a kilometre and a metre have identical exponent vectors and differ by 1000.'
    };
  },
  readout(st){
    const N = this.cur(st), C = N.C, named = unNamed(C.d);
    return `<div class="card tight"><div class="ttl">${N.name}</div>
      ${kv('as written', esc(N.src))}
      ${kv('dimensions', unFmtDim(C.d))}
      ${kv('in SI base units', unFmtSI(C.d))}
      ${kv('a named SI unit?', named ? 'yes — the ' + (named === 'ohm' ? 'ohm (Ω)' : named) : 'no — most derived units have no name')}
      ${kv('scale factor to SI', C.f === 1 ? '1 — already SI' : fmtSig(C.f, 8))}
      <p class="help">${N.why}</p>
    </div>
    <div class="card tight"><div class="ttl">The two routes, compared</div>
      ${kv('exponents by adding', '[' + C.d.map(v => fmtNum(v, 4)).join(', ') + ']')}
      ${kv('exponents by rescaling', '[' + C.d2.map(v => fmtNum(v, 4)).join(', ') + ']')}
      ${kv('worst disagreement', fmtGap(C.gap, C.gross))}
      <p class="help">The second row never adds an exponent to anything. It evaluates the expression
      as a product of ordinary numbers under seven different assignments of values to the base units,
      and recovers the exponents by solving a linear system in the logarithms. The two share the
      tokenizer and nothing else.</p>
    </div>`;
  },
  chip(st){
    const C = this.cur(st).C;
    return `<div class="k">dimensions</div>
      <div style="color:var(--c-pos)">${unFmtDim(C.d)}</div>
      <div style="color:var(--c-dim)">gap ${fmtGapTight(C.gap, C.gross)}</div>`;
  },
  legend(st){
    const L = [['var(--c-pos)', 'a positive exponent'], ['var(--c-neg)', 'a negative one']];
    if(st.both) L.push(['var(--c-warn)', 'the same exponent, measured by rescaling the base units']);
    return L;
  },
  dockLegend:true
};

/* ============================================================================
   2 · both sides of an equation
   ============================================================================ */
/* `homog` is a claim the table makes about itself and auditclaims.ps1
   recomputes every one of them from the two unit strings. The wrong entries
   are wrong on purpose and the audit must agree that they are wrong, which is
   a sharper test than a table where everything passes. */
const UN_EQNS = {
  newton2:{ short:'F = ma', name:'Newton\'s second law', lhs:'N', rhs:'kg m/s^2', homog:true,
            eq:'F = ma',
            why:'The definition of the newton, so of course it balances. It is here as the control: a check that passes on an equation known to be right is the only evidence that it would fail on one that is not.' },
  ke:     { short:'E = ½mv²', name:'kinetic energy', lhs:'J', rhs:'kg m^2/s^2', homog:true,
            eq:'E = ½mv²',
            why:'The ½ is invisible to this check and always will be. Dimensional analysis cannot see a pure number, which is exactly the boundary of what it can do: it rules equations out, and it never rules one in.' },
  emc:    { short:'E = mc²', name:'the famous one', lhs:'J', rhs:'kg m^2/s^2', homog:true,
            eq:'E = mc²',
            why:'Same right-hand side as the kinetic energy, because a velocity squared times a mass is an energy however the velocity got there. Dimensional analysis cannot tell relativity from a rolling ball, and pretending otherwise is the commonest overclaim made for it.' },
  emcBad: { short:'E = mc', name:'the famous one, mistyped', lhs:'J', rhs:'kg m/s', homog:false,
            eq:'E = mc',
            why:'A momentum, not an energy — and the panel says so before any physics is done. One dropped exponent, caught by counting. This is the single most useful thing in the wing and it costs nothing.' },
  pend:   { short:'T = 2π√(L/g)', name:'the pendulum', lhs:'s', rhs:'(m/(m/s^2))^(1/2)', homog:true,
            eq:'T = 2π√(L/g)',
            why:'The half-integer exponents cancel exactly: L/g is a time squared, so its square root is a time. This is why the dimension exponents have to be rationals rather than integers.' },
  pendBad:{ short:'T = 2π√(g/L)', name:'the pendulum, upside down', lhs:'s', rhs:'((m/s^2)/m)^(1/2)', homog:false,
            eq:'T = 2π√(g/L)',
            why:'The version half of a class writes under exam conditions, and it comes out as one over a time — a frequency. Nothing about the algebra of the derivation is being checked here; only the exponents, and they are enough.' },
  bern:   { short:'p + ½ρv²', name:'Bernoulli\'s two terms', lhs:'Pa', rhs:'kg/m^3 m^2/s^2', homog:true,
            eq:'p ~ ρv²',
            why:'A sum is only legal when every term has the same dimensions, which is the rule that makes an equation checkable at all. Both of Bernoulli\'s terms are pressures — energies per unit volume — and reading them that way is more useful than remembering the formula.' },
  ohmLaw: { short:'V = IR', name:'Ohm\'s law', lhs:'V', rhs:'A ohm', homog:true,
            eq:'V = IR',
            why:'Three named units, none of them base, and the check reduces all three to the same four exponents. The ohm was defined to make this true, so this is the definition being read back.' },
  schr:   { short:'ħ²/2mL²', name:'a quantum energy scale', lhs:'J', rhs:'(J s)^2/(kg m^2)', homog:true,
            eq:'E ~ ħ²/mL²',
            why:'The combination that sets the energy of a particle in a box, of a hydrogen atom and of a quantum dot — and dimensional analysis alone gets it, with only the numerical factor left over. That is the whole method in one line.' },
  drag:   { short:'F = ½C ρ A v²', name:'the drag force', lhs:'N', rhs:'kg/m^3 m^2 m^2/s^2', homog:true,
            eq:'F = ½C_d ρ A v²',
            why:'C_d is dimensionless, so the check cannot see it — and it is the only part of the formula that requires a wind tunnel. Dimensional analysis reliably reduces the unknown to a dimensionless number, and reliably declines to tell you what that number is.' },
  custom: { short:'type your own', name:'your own equation', lhs:'J', rhs:'N m', homog:true,
            eq:'left = right',
            why:'Two unit expressions. They balance or they do not.' }
};

STAGES.unHomog = {
  title:'Do both sides balance?',
  enter(st, o){ st.qkey = o.qkey || 'newton2'; },
  cur(st){
    if(st.qkey === 'custom'){
      const own = pkOwn(st, 'unHm', [UN_SLOT('lhs', 'left side', 'J', 'N s'),
                                     UN_SLOT('rhs', 'right side', 'N m', 'kg m/s')]);
      const A = unRead(own.lhs), B = unRead(own.rhs);
      return { name:'your own equation', eq:'left = right', why:UN_EQNS.custom.why,
               lhs:own.lhs, rhs:own.rhs, A, B,
               ok:A.ok && B.ok, why2:A.ok ? B.why : A.why, declared:null };
    }
    const E = UN_EQNS[st.qkey];
    return { name:E.name, eq:E.eq, why:E.why, lhs:E.lhs, rhs:E.rhs,
             A:unRead(E.lhs), B:unRead(E.rhs), ok:true, why2:'', declared:E.homog };
  },
  controls(){
    const st = ST, N = this.cur(st);
    return ctSeg('unHmK', st.qkey, Object.keys(UN_EQNS).map(k => [k, UN_EQNS[k].short])) +
      pkBoxes('unHm', st.qkey, st, [UN_SLOT('lhs', 'left side', 'J', 'N s'),
                                    UN_SLOT('rhs', 'right side', 'N m', 'kg m/s')], null,
              'Two unit expressions, one per side. To check <b>v = √(2gh)</b>, write ' +
              '<b>m/s</b> on the left and <b>(m/s^2 m)^(1/2)</b> on the right.') +
      `${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.why2)} — the picture keeps the last pair that read.</p>`}
      <p class="help">Two bars per dimension. Where they are the same length the row is drawn in the
      affirmative colour; where they are not, the difference is drawn as a gap and the row turns.
      <b>An equation that fails this test is wrong.</b> An equation that passes it may still be wrong,
      because every dimensionless factor — a ½, a 2π, a drag coefficient — is invisible here.</p>
      <p class="help">That asymmetry is the whole logic of the method and it is worth stating in its
      logical form: dimensional homogeneity is <i>necessary</i> and not <i>sufficient</i>. It is the
      cheapest necessary condition in physics, and it costs nothing to apply to every line you write.</p>`;
  },
  wire(){
    ctWireSeg('unHmK', v => { ST.qkey = v; });
    pkWireBoxes('unHm', ST.qkey, ST, [UN_SLOT('lhs', 'left side', 'J', 'N s'),
                                      UN_SLOT('rhs', 'right side', 'N m', 'kg m/s')], null);
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const dA = N.A.ok ? N.A.d : unZero(), dB = N.B.ok ? N.B.d : unZero();
    const B = unChipBox(ctx, W, H);
    let hi = 1;
    for(let i = 0; i < UN_NB; i++) hi = Math.max(hi, Math.abs(dA[i]), Math.abs(dB[i]));
    hi = Math.ceil(hi * 2) / 2 + 0.5;
    const P = mkPlot(B.px, B.py, B.pw, B.ph, -hi, hi, -0.5, UN_NB - 0.5);
    plotFrame(ctx, P, 'exponent', '', N.lhs + '   against   ' + N.rhs);
    ctPath(ctx, P, [{ x:0, y:-0.5 }, { x:0, y:UN_NB - 0.5 }], rgbCss(TH.line2), 1.4);
    const M = ctUnitMarks(-hi, hi, 9);
    plotTicksX(ctx, P, M.vals, v => fmtTick(v, M.step));
    for(let i = 0; i < UN_NB; i++){
      const y = UN_NB - 1 - i;
      const a = dA[i], b = dB[i], same = Math.abs(a - b) < 1e-9;
      const bar = (e, y0, y1, col, alpha) => {
        if(Math.abs(e) < 1e-9) return;
        ctFill(ctx, P, [{ x:0, y:y0 }, { x:e, y:y0 }, { x:e, y:y1 }, { x:0, y:y1 }], rgbCss(col, alpha));
        ctPath(ctx, P, [{ x:0, y:y0 }, { x:e, y:y0 }, { x:e, y:y1 }, { x:0, y:y1 }, { x:0, y:y0 }], rgbCss(col), 1.5);
      };
      bar(a, y + 0.04, y + 0.36, same ? TH.pos : TH.neg, 0.5);
      bar(b, y - 0.36, y - 0.04, same ? TH.grad : TH.warn, 0.5);
      ctText(ctx, P.px - 10, P.Y(y), UN_BASE[i], rgbCss(same ? TH.dim : TH.neg),
             (same ? '' : '600 ') + '11px ' + FONT_UI, 'right', 'middle');
      if(!same)
        ctText(ctx, P.X(0) + 6, P.Y(y), 'left ' + fmtNum(a, 3) + ', right ' + fmtNum(b, 3),
               rgbCss(TH.neg), '600 10px ' + FONT_UI, 'left', 'middle');
    }
    const bal = unDimSame(dA, dB);
    stageNote(ctx, bal ? 'the two sides have the same seven exponents — the equation survives'
                       : 'the exponents differ — this equation is wrong, and no algebra can rescue it',
              W, H);
  },
  derive(st){
    const N = this.cur(st);
    const dA = N.A.ok ? N.A.d : unZero(), dB = N.B.ok ? N.B.d : unZero();
    const diff = unDimSub(dA, dB);
    const worst = Math.max.apply(null, diff.map(Math.abs));
    return {
      title:'Why an equation must be homogeneous',
      steps:[
        drvSay('the argument is one sentence, and it is about changing units',
          'A physical law cannot depend on whether lengths are recorded in metres or in feet. Change the size of the metre and every term multiplies by some power of the change; if two terms carry different powers, their sum changes in a way no single rescaling can absorb, so the equation would hold in one system of units and fail in another. No law does that.'),
        drvStep('so each term carries the same seven exponents',
          `${dv('d')}(left) ${dop('=')} ${dv('d')}(right)`,
          unFmtDim(dA) + '   against   ' + unFmtDim(dB)),
        drvStep('and the test is the difference of two vectors',
          `${dfn('max')}ᵢ |${dv('d')}ᵢ(left) ${dop('−')} ${dv('d')}ᵢ(right)|`,
          worst < 1e-9 ? 'every exponent agrees — the equation is dimensionally possible'
                       : 'largest mismatch ' + fmtNum(worst, 4) + ' in ' +
                         UN_BASE.filter((_, i) => Math.abs(diff[i]) > 1e-9).join(', ')),
        drvSay('necessary, and emphatically not sufficient',
          'Every dimensionless factor is invisible to this test: a ½, a 2π, a factor of 137, a drag coefficient. E = mc² and E = ½mv² have identical dimensions, so this check cannot separate relativity from a rolling ball — and cannot separate either from E = 4πmc². What it does, unfailingly, is throw out the ones that are impossible.'),
        drvSay('which makes it the cheapest check in physics, and the one most often skipped',
          'It takes a few seconds, it requires no understanding of the derivation, and it catches a dropped exponent, a reciprocal written the wrong way up and a term that was never a term. The site\'s own habit of computing both sides of an identity is the same idea one level up: a claim you have not tested is a claim you are hoping about.'),
        drvSay('and it says something about the units themselves',
          'Only ratios of like quantities are dimensionless, so only they can be arguments of a sine, an exponential or a logarithm. Writing log(t) with t in seconds is meaningless, and writing log(t/t₀) is not — a rule that looks pedantic until the first time it saves you.')
      ],
      note:'Nothing above depends on which units are chosen, only on the exponents.'
    };
  },
  readout(st){
    const N = this.cur(st);
    const dA = N.A.ok ? N.A.d : unZero(), dB = N.B.ok ? N.B.d : unZero();
    const bal = unDimSame(dA, dB);
    const diff = unDimSub(dA, dB);
    const off = UN_BASE.filter((_, i) => Math.abs(diff[i]) > 1e-9)
                       .map((s, j) => s + ' by ' + fmtNum(diff[UN_BASE.indexOf(s)], 3));
    return `<div class="card tight"><div class="ttl">${N.name} — ${N.eq}</div>
      ${kv('left side', esc(N.lhs) + '  →  ' + unFmtDim(dA))}
      ${kv('right side', esc(N.rhs) + '  →  ' + unFmtDim(dB))}
      ${kv('verdict', bal
          ? '<span style="color:var(--c-pos)">balanced — dimensionally possible</span>'
          : '<span style="color:var(--c-neg)">not balanced — this equation cannot be right</span>')}
      ${bal ? '' : kv('what is off', off.join(', '))}
      <p class="help">${N.why}</p>
    </div>
    <div class="card tight"><div class="ttl">What a balanced verdict does and does not buy</div>
      ${kv('rules the equation out?', bal ? 'no — it survived' : 'yes, and with no further work')}
      ${kv('rules the equation in?', 'never — every pure number is invisible here')}
      ${kv('in SI base units', unFmtSI(dA) + (bal ? '' : '   vs   ' + unFmtSI(dB)))}
      <p class="help">A necessary condition that is not sufficient is still worth having, and this one
      costs seconds. What it cannot do is supply the ½ in ½mv², the 2π in the pendulum or the drag
      coefficient — and the Buckingham stage next door is about exactly how far the method reaches
      before a measurement has to take over.</p>
    </div>`;
  },
  chip(st){
    const N = this.cur(st);
    const bal = unDimSame(N.A.ok ? N.A.d : unZero(), N.B.ok ? N.B.d : unZero());
    return `<div class="k">${N.eq}</div>
      <div style="color:var(${bal ? '--c-pos' : '--c-neg'})">${bal ? 'balanced' : 'not balanced'}</div>
      <div style="color:var(--c-dim)">${unFmtDim(N.A.ok ? N.A.d : unZero())}</div>`;
  },
  legend(){
    return [['var(--c-pos)', 'left side, where the two agree'],
            ['var(--c-grad)', 'right side, where the two agree'],
            ['var(--c-neg)', 'left side, where they do not'],
            ['var(--c-warn)', 'right side, where they do not']];
  },
  dockLegend:true
};
