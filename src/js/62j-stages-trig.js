/* ============================================================================
   4x · TRIGONOMETRY — the unit circle, and everything read off it
   Sine and cosine are not ratios in a triangle that happen to extend; they are
   the coordinates of a point going round a circle, and the triangle is the
   special case. Taking that as the definition makes every identity a statement
   about rotation, which is what they all are.
   ============================================================================ */

STAGES.agCircle = {
  title:'The unit circle',
  drag:true,
  enter(st, o){
    st.th = o.th === undefined ? Math.PI / 6 : o.th;
    st.run = !!o.run;
    st.show = Object.assign({ tan:true, wave:true, exact:true }, o.show || {});
  },
  controls(){
    const st = ST;
    return ctlRow('angle θ', ctlSlider('acT', -6.5, 6.5, 0.005, st.th)) +
      `<div class="row wrap">${ctChk('acTan', 'the tangent segment', st.show.tan)}
        ${ctChk('acW', 'unroll into a wave', st.show.wave)}
        ${ctChk('acE', 'the exact-value angles', st.show.exact)}</div>
      ${ctChk('acRun', 'let it turn', st.run)}
      <p class="help"><b>Drag the point around the circle.</b> cos θ is its horizontal coordinate and
      sin θ its vertical one — that <i>is</i> the definition, and the right triangle is what you get
      by dropping a perpendicular from it. Everything else on this floor is read off this picture.</p>
      <p class="help">Unrolling the vertical coordinate against θ gives the sine wave: the wave is not
      a separate object but the circle's shadow, traced in time. That is why every oscillation in this
      laboratory — springs, circuits, light, wavefunctions — is a circle seen edge-on.</p>`;
  },
  wire(){
    wireSlider('acT', () => ST.th, v => { ST.th = v; }, v => ctDeg(+v));
    ctWireChk('acTan', v => { ST.show.tan = v; });
    ctWireChk('acW', v => { ST.show.wave = v; });
    ctWireChk('acE', v => { ST.show.exact = v; });
    ctWireChk('acRun', v => { ST.run = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.th = Math.atan2(st.P.invY(sy), st.P.invX(sx));
    st.run = false;
  },
  frame(st, dt, ctx, W, H){
    if(st.run) st.th += dt * 0.6;
    const U = agUnitCircle(st.th);
    const side = st.show.wave ? Math.min(W * 0.42, H - 130) : Math.min(W * 0.8, H - 130);
    const P = mkPlot(70, 60, side, side, -1.6, 1.6, -1.6, 1.6);
    st.P = P;
    plotFrame(ctx, P, null, null, 'the unit circle — drag the point');
    ctGrid(ctx, P);
    ctParam(ctx, P, t => ({ x:Math.cos(t), y:Math.sin(t) }), 0, 2 * Math.PI, 200, rgbCss(TH.faint), 1.8);
    if(st.show.exact) for(const e of AG_EXACT){
      for(const s of [1, -1]){
        const a = e.th * s;
        ctDot(ctx, P, Math.cos(a), Math.sin(a), 2.6, rgbCss(TH.faint, 0.9));
      }
    }
    /* the swept angle */
    ctArcAngle(ctx, P, 0, 0, 34, 0, st.th, rgbCss(TH.warn, 0.8), 2);
    /* the two coordinates, drawn as the legs of the triangle they are */
    ctPath(ctx, P, [{ x:0, y:0 }, { x:U.cos, y:0 }], rgbCss(TH.neg), 3);
    ctPath(ctx, P, [{ x:U.cos, y:0 }, { x:U.cos, y:U.sin }], rgbCss(TH.pos), 3);
    ctPath(ctx, P, [{ x:0, y:0 }, { x:U.cos, y:U.sin }], rgbCss(TH.text), 2);
    ctDot(ctx, P, U.cos, U.sin, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    ctText(ctx, P.X(U.cos / 2), P.Y(0) + 16, 'cos θ', rgbCss(TH.neg), '600 11px ' + FONT_UI, 'center');
    ctText(ctx, P.X(U.cos) + 8, P.Y(U.sin / 2), 'sin θ', rgbCss(TH.pos), '600 11px ' + FONT_UI);
    /* the tangent segment, which is where the name comes from */
    if(st.show.tan && Math.abs(U.cos) > 0.08){
      ctPath(ctx, P, [{ x:1, y:0 }, { x:1, y:U.tan }], rgbCss(TH.curl), 2.6);
      ctText(ctx, P.X(1) + 8, P.Y(U.tan / 2), 'tan θ', rgbCss(TH.curl), '600 11px ' + FONT_UI);
    }
    /* unroll */
    if(st.show.wave){
      const Q = mkPlot(90 + side, 60, W - side - 160, side, -6.5, 6.5, -1.6, 1.6);
      plotFrame(ctx, Q, 'θ', null, 'the same coordinate, unrolled against θ');
      plotZeroY(ctx, Q);
      plotTicksX(ctx, Q, [-2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI],
                 v => (Math.abs(v) < 1e-9 ? '0' : fmtNum(v / Math.PI, 2) + 'π'));
      plotCurve(ctx, Q, Math.sin, 500, rgbCss(TH.pos), 2.4);
      plotCurve(ctx, Q, Math.cos, 500, rgbCss(TH.neg, 0.75), 1.8);
      ctDot(ctx, Q, st.th, U.sin, 6, rgbCss(TH.warn), rgbCss(TH.bg));
      ctPath(ctx, Q, [{ x:st.th, y:0 }, { x:st.th, y:U.sin }], rgbCss(TH.warn, 0.6), 1.4, [4, 4]);
    }
    stageNote(ctx, 'the wave is the circle traced against time — one object, two views', W, H);
  },
  derive(st){
    const U = agUnitCircle(st.th);
    const n = v => fmtNum(v, 6);
    return {
      title:'Where sin² + cos² = 1 comes from — and it is not a new fact',
      steps:[
        drvStep('the definition',
          `${dfn('cos')} θ, ${dfn('sin')} θ ${dop('=')} ${dfn('the coordinates of the point at angle θ on the unit circle')}`,
          `at θ = ${ctDeg(st.th)}:  (${n(U.cos)}, ${n(U.sin)})`),
        drvStep('the circle is the set of points at distance 1',
          `${dv('x')}² ${dop('+')} ${dv('y')}² ${dop('=')} 1`,
          'that is what "unit circle" means — it is Pythagoras, applied to the radius'),
        drvStep('substitute the coordinates',
          `${dfn('cos')}²θ ${dop('+')} ${dfn('sin')}²θ ${dop('=')} 1`,
          `${n(U.cos * U.cos)} + ${n(U.sin * U.sin)} = ${n(U.pythag)}`),
        drvSay('so the identity is Pythagoras in disguise',
          'It is not an extra rule to memorise alongside the definitions — it <em>is</em> the definition, since the point was placed on a circle of radius 1 in the first place. Divide it through by cos²θ and you get 1 + tan²θ = sec²θ; divide by sin²θ and you get cot² + 1 = csc². The three "Pythagorean identities" are one identity and two divisions.'),
        drvStep('and the tangent is a ratio of the two',
          `${dfn('tan')} θ ${dop('=')} ${dfrac(dfn('sin') + ' θ', dfn('cos') + ' θ')}`,
          U.tan === null ? 'no value here — cos θ = 0, and the tangent segment runs off to infinity'
                         : `${n(U.sin)} / ${n(U.cos)} = ${n(U.tan)}`),
        drvSay('which is why tan blows up where it does',
          'The tangent segment is drawn on the vertical line x = 1. As the radius turns towards vertical that line is met further and further away, and at exactly 90° it is never met at all — parallel lines do not intersect. The asymptote is a geometric fact before it is an algebraic one.'),
        drvSay('and the angle has to be measured in radians for any of the calculus to work',
          'A radian is the angle whose arc has the same length as the radius, so on the unit circle the angle and the arc are the same number. That is the only measure for which sin θ ≈ θ near zero, and therefore the only one for which d(sin θ)/dθ = cos θ. In degrees the derivative picks up a stray π/180 and every formula downstream carries it. Radians are not a preference — they are the unit in which the circle stops needing a conversion factor.')
      ],
      note:'Reading sine and cosine off a circle rather than a triangle is what lets θ exceed 90°, go negative, and keep going past 2π — none of which a triangle can do.'
    };
  },
  readout(st){
    const U = agUnitCircle(st.th);
    const near = AG_EXACT.find(e => Math.abs(((st.th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - e.th) < 0.02);
    return `<div class="card tight"><div class="ttl">At θ = ${ctDeg(st.th)}</div>
      ${kv('cos θ', fmtNum(U.cos, 6))}
      ${kv('sin θ', fmtNum(U.sin, 6))}
      ${kv('tan θ', U.tan === null ? 'no value — cos θ = 0 here' : fmtNum(U.tan, 6))}
      ${kv('quadrant', U.quadrant)}
      ${kv('cos²θ + sin²θ', fmtNum(U.pythag, 9))}
      ${near ? kv('exact value here', 'θ = ' + near.name + ',  cos = ' + near.cos + ',  sin = ' + near.sin) : ''}
      <p class="help">The Pythagorean row is computed from the two coordinates independently and
      comes out 1 to nine figures for every angle — measured, not asserted.</p>
    </div>
    <div class="card tight"><div class="ttl">The reciprocal three</div>
      ${kv('sec θ = 1/cos', U.sec === null ? 'no value — cos θ = 0' : fmtNum(U.sec, 6))}
      ${kv('csc θ = 1/sin', U.csc === null ? 'no value — sin θ = 0' : fmtNum(U.csc, 6))}
      ${kv('cot θ = cos/sin', U.cot === null ? 'no value — sin θ = 0' : fmtNum(U.cot, 6))}
      <p class="help">Each has no value exactly where its denominator vanishes, and those are the
      vertical asymptotes of its graph. There is nothing to remember: the domain of each function is
      dictated by which coordinate it divides by.</p>
    </div>`;
  },
  chip(st){
    const U = agUnitCircle(st.th);
    return `<div class="k">θ = ${ctDeg(st.th)}</div>
      <div style="color:var(--c-neg)">cos = ${fmtNum(U.cos, 4)}</div>
      <div style="color:var(--c-pos)">sin = ${fmtNum(U.sin, 4)}</div>`;
  },
  legend(){ return [['var(--c-neg)', 'cos θ — the horizontal leg'], ['var(--c-pos)', 'sin θ — the vertical leg'],
                    ['var(--c-curl)', 'tan θ, on the line x = 1'], ['var(--c-warn)', 'the point, and the swept angle']]; },
  dockLegend:true
};

/* ---- 2 · identities, checked ---------------------------------------------- */
STAGES.agIdent = {
  title:'Trigonometric identities',
  enter(st, o){
    st.a = o.a === undefined ? 0.7 : o.a;
    st.b = o.b === undefined ? 0.4 : o.b;
    st.own = !!o.own;
  },
  controls(){
    const st = ST;
    return ctlRow('angle a', ctlSlider('idA', -3.1, 3.1, 0.005, st.a)) +
      ctlRow('angle b', ctlSlider('idB', -3.1, 3.1, 0.005, st.b)) +
      ctSeg('idOwn', st.own ? 'yes' : 'no',
        [['no', 'the standard identities'], ['yes', 'test one of your own']]) +
      (st.own
        ? fnHtml('agid_lhs', 'left side =', pkOwn(st, 'agid', AG_ID_OWN, null).lhs, 'a, b — written x and y') +
          fnHtml('agid_rhs', 'right side =', pkOwn(st, 'agid', AG_ID_OWN, null).rhs, 'a, b — written x and y') +
          `<p class="help">Write the two angles as <b>x</b> and <b>y</b>, because that is what the
          expression engine calls its first two variables. Both sides are evaluated independently at
          your sliders <i>and</i> swept over a grid of 3 721 angle pairs, and the worst disagreement
          found anywhere is reported — so a formula that happens to be true at one pair of angles is
          caught rather than congratulated.</p>`
        : '') +
      `<p class="help">Every identity below is evaluated on both sides <b>independently</b> at your
      two angles, and the difference is printed. An identity is a statement about <i>all</i> angles,
      so watching the difference stay at zero while you drag is the closest thing to a proof this
      format can give — and it is a great deal more convincing than a remembered list.</p>
      <p class="help">The addition formula is the one that matters: every other identity here is a
      special case of it. Set b = a and you get the double-angle formulas; rearrange those and you
      get the half-angle and power-reduction ones. The derivation below shows the rotation argument
      that produces it.</p>`;
  },
  wire(){
    wireSlider('idA', () => ST.a, v => { ST.a = v; }, v => ctDeg(+v));
    wireSlider('idB', () => ST.b, v => { ST.b = v; }, v => ctDeg(+v));
    ctWireSeg('idOwn', v => { ST.own = (v === 'yes'); });
    if(ST.own){
      const own = pkOwn(ST, 'agid', AG_ID_OWN, null);
      fnWire('agid_lhs', (m, s) => { own.lhs = s; });
      fnWire('agid_rhs', (m, s) => { own.rhs = s; });
    }
  },
  frame(st, dt, ctx, W, H){
    const P = ctBox(Math.min(W * 0.55, H * 1.2), H, 0, 0, 1.5);
    ctGrid(ctx, P);
    ctParam(ctx, P, t => ({ x:Math.cos(t), y:Math.sin(t) }), 0, 2 * Math.PI, 200, rgbCss(TH.faint), 1.6);
    const A = st.a, B = st.b;
    /* a, then b more, and the sum — rotation composing */
    ctArrow(ctx, P, 0, 0, Math.cos(A), Math.sin(A), rgbCss(TH.pos), 2.4, 'a');
    ctArrow(ctx, P, 0, 0, Math.cos(A + B), Math.sin(A + B), rgbCss(TH.warn), 2.8, 'a + b');
    ctArcAngle(ctx, P, 0, 0, 40, 0, A, rgbCss(TH.pos, 0.8), 2);
    ctArcAngle(ctx, P, 0, 0, 56, A, A + B, rgbCss(TH.neg, 0.8), 2);
    ctFrame(ctx, P, 'turning by a, then by b more');
    /* the two sides of the addition formula, drawn as stacked bars */
    const bx = P.px + P.pw + 60, bw = Math.min(240, W - bx - 40);
    if(bw > 120){
      const rows = [
        ['sin(a+b)', Math.sin(A + B), TH.warn],
        ['sin a cos b', Math.sin(A) * Math.cos(B), TH.pos],
        ['cos a sin b', Math.cos(A) * Math.sin(B), TH.neg]
      ];
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      rows.forEach(([nm, v, col], i) => {
        const y = 110 + i * 54;
        ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 11.5px ' + FONT_UI;
        ctx.fillText(nm + ' = ' + fmtNum(v, 5), bx, y - 6);
        ctx.fillStyle = rgbCss(col, 0.85);
        ctx.fillRect(bx, y, bw * Math.abs(v), 16);
      });
      ctx.fillStyle = rgbCss(TH.faint); ctx.font = '11px ' + FONT_UI;
      ctx.fillText('the lower two bars add to the top one', bx, 110 + 3 * 54 + 6);
    }
    stageNote(ctx, 'the addition formula is what "compose two rotations" means in coordinates', W, H);
  },
  derive(st){
    const A = st.a, B = st.b, n = v => fmtNum(v, 6);
    return {
      title:'The addition formula, from composing two rotations',
      steps:[
        drvStep('rotating by a sends the basis vectors to',
          `(1, 0) ${dop('↦')} (${dfn('cos')} ${dv('a')}, ${dfn('sin')} ${dv('a')}),  (0, 1) ${dop('↦')} (${dop('−')}${dfn('sin')} ${dv('a')}, ${dfn('cos')} ${dv('a')})`,
          `a = ${ctDeg(A)}:  (${n(Math.cos(A))}, ${n(Math.sin(A))})`),
        drvSay('so a rotation is a matrix',
          'Those two images are the columns of the rotation matrix — which is the linear-algebra wing\'s statement that the columns of a matrix are where the basis vectors go. Trigonometry and linear algebra meet here, and the identity below is the consequence.'),
        drvStep('rotating by a and then by b is rotating by a + b',
          `${dv('R')}(${dv('b')})${dv('R')}(${dv('a')}) ${dop('=')} ${dv('R')}(${dv('a')} ${dop('+')} ${dv('b')})`,
          'turning twice is turning once by the total — geometrically obvious, and the whole proof'),
        drvStep('multiply the matrices and read off the top-left entry',
          `${dfn('cos')}(${dv('a')}${dop('+')}${dv('b')}) ${dop('=')} ${dfn('cos')} ${dv('a')} ${dfn('cos')} ${dv('b')} ${dop('−')} ${dfn('sin')} ${dv('a')} ${dfn('sin')} ${dv('b')}`,
          `${n(Math.cos(A + B))} = ${n(Math.cos(A) * Math.cos(B))} − ${n(Math.sin(A) * Math.sin(B))} = ${n(Math.cos(A) * Math.cos(B) - Math.sin(A) * Math.sin(B))}`),
        drvStep('and the bottom-left entry',
          `${dfn('sin')}(${dv('a')}${dop('+')}${dv('b')}) ${dop('=')} ${dfn('sin')} ${dv('a')} ${dfn('cos')} ${dv('b')} ${dop('+')} ${dfn('cos')} ${dv('a')} ${dfn('sin')} ${dv('b')}`,
          `${n(Math.sin(A + B))} = ${n(Math.sin(A) * Math.cos(B) + Math.cos(A) * Math.sin(B))}`),
        drvStep('now set b = a — the double angle formulas, free',
          `${dfn('sin')} 2${dv('a')} ${dop('=')} 2 ${dfn('sin')} ${dv('a')} ${dfn('cos')} ${dv('a')},  ${dfn('cos')} 2${dv('a')} ${dop('=')} ${dfn('cos')}²${dv('a')} ${dop('−')} ${dfn('sin')}²${dv('a')}`,
          `sin 2a = ${n(Math.sin(2 * A))},  2 sin a cos a = ${n(2 * Math.sin(A) * Math.cos(A))}`),
        drvSay('and the rest follow',
          'Combine cos 2a = cos²a − sin²a with cos² + sin² = 1 and you can solve for either square alone: those are the power-reduction formulas, and halving the angle in them gives the half-angle formulas. A dozen identities, one rotation argument, two substitutions.'),
        drvSay('why the proof by rotation is better than the proof by diagram',
          'The usual derivation draws two stacked right triangles and chases lengths, and it works — for a and b both acute, with the picture drawn the right way round. Every other case needs a different diagram and a sign argument. The rotation proof has no cases at all: R(b)R(a) = R(a+b) is true for any angles whatever, positive, negative or larger than a full turn, because composing two rotations is composing two rotations. Getting rid of case analysis is usually the sign that an argument has found the right level.'),
        drvSay('and the identity is what makes the frequency domain possible',
          'Written the other way round, the formula says a product of two sinusoids is a sum of two sinusoids at the sum and difference frequencies. That is amplitude modulation in the electronics wing, beats in the waves wing, the heterodyne principle in every radio receiver, and the reason multiplying a signal by e^(−2πift) and averaging picks out one frequency — which is the Fourier transform. One line of trigonometry, and it is load-bearing in four other wings.')
      ],
      note:'This is also why e<sup>i(a+b)</sup> = e<sup>ia</sup>e<sup>ib</sup> encodes the same content in one line — the complex wing\'s exponential is the rotation matrix written as a number.'
    };
  },
  readout(st){
    const rows = agIdentities(st.a, st.b);
    /* the reader's own candidate, when they have asked to test one */
    const own = st.own ? agIdentCur(st) : null;
    return (own ? `<div class="card tight"><div class="ttl">Your candidate identity</div>
      ${kv('left side at your angles', fmtNum(own.L(st.a, st.b), 8))}
      ${kv('right side', fmtNum(own.R(st.a, st.b), 8))}
      ${kv('difference here', fmtAgree(own.L(st.a, st.b), own.R(st.a, st.b)))}
      ${kv('worst difference over the whole grid', fmtNum(own.worst, 4))}
      ${kv('verdict', own.holds ? 'holds everywhere it was tested' : own.seen < 100 ? 'not enough finite values to judge' : 'not an identity')}
      <p class="help">${own.note}</p>
    </div>` : '') +
    `<div class="card tight"><div class="ttl">Each side computed independently</div>
      ${rows.map(o => kv(o.n, fmtNum(o.lhs, 6) + '  vs  ' + fmtNum(o.rhs, 6))).join('')}
      ${kv('largest disagreement', fmtGap(Math.max(...rows.map(o => o.diff)),
                                          Math.max(1e-300, ...rows.map(o => Math.abs(o.lhs)))))}
      <p class="help">Drag either angle anywhere at all and that last number does not move off zero.
      An identity holds for every value of its variables, and this is what that looks like.</p>
    </div>
    <div class="card tight"><div class="ttl">Which ones are actually independent</div>
      <p class="help">Two: <b>cos² + sin² = 1</b> (which is Pythagoras) and the <b>addition
      formula</b> (which is composing rotations). Everything else in the list above is one of those
      with a substitution — double angle is b = a, power reduction is that rearranged, half angle is
      power reduction with a → a/2. Memorising seven formulas is the hard way to remember two.</p>
    </div>`;
  },
  chip(st){
    const rows = agIdentities(st.a, st.b);
    /* tight form on a chip — the prose verdict made the chip wide enough to
       cover the plot title (same class as ftConv, 2026-08-19 sweep) */
    return `<div class="k">identities</div><div>${rows.length} checked</div>
      <div style="color:var(--c-grad)">${fmtGapTight(Math.max(...rows.map(o => o.diff)),
        Math.max(1e-300, ...rows.map(o => Math.abs(o.lhs))))}</div>`;
  },
  legend(){ return [['var(--c-pos)', 'angle a'], ['var(--c-neg)', 'the further turn b'],
                    ['var(--c-warn)', 'a + b']]; },
  dockLegend:true
};

/* ---- 3 · triangles, and the sinusoid ------------------------------------- */
STAGES.agTriangle = {
  title:'Triangles & sinusoids',
  enter(st, o){
    st.mode = o.mode || 'triangle';
    st.A = 0.9; st.b = 2.4; st.c = 3.1;
    st.amp = 1; st.w = 2; st.ph = 0; st.k = 0;
    st.p = 1; st.q = 1;                       // for the harmonic addition demo
  },
  controls(){
    const st = ST;
    return ctSeg('agTm', st.mode, [['triangle', 'laws of sines & cosines'], ['wave', 'the general sinusoid'],
                                   ['harm', 'a cos + b sin is one wave']]) +
      (st.mode === 'triangle'
        ? ctlRow('angle A', ctlSlider('agTA', 0.15, 2.9, 0.005, st.A)) +
          ctlRow('side b', ctlSlider('agTb', 0.5, 5, 0.02, st.b)) +
          ctlRow('side c', ctlSlider('agTc', 0.5, 5, 0.02, st.c))
        : st.mode === 'wave'
        ? ctlRow('amplitude A', ctlSlider('agWA', -3, 3, 0.02, st.amp)) +
          ctlRow('ω', ctlSlider('agWw', 0.2, 6, 0.02, st.w)) +
          ctlRow('phase φ', ctlSlider('agWp', -3.2, 3.2, 0.01, st.ph)) +
          ctlRow('offset k', ctlSlider('agWk', -2, 2, 0.02, st.k))
        : ctlRow('a  (cos part)', ctlSlider('agHp', -3, 3, 0.02, st.p)) +
          ctlRow('b  (sin part)', ctlSlider('agHq', -3, 3, 0.02, st.q))) +
      `<p class="help">${st.mode === 'triangle'
        ? 'The <b>law of cosines</b> is Pythagoras with a correction term for the angle not being right, and it reduces to Pythagoras exactly when A = 90°. The <b>law of sines</b> says a/sin A is the same number for all three pairs — the panel prints all three so you can see one number rather than three coincidences.'
        : st.mode === 'wave'
        ? 'Every sinusoid anywhere in this laboratory has the form <b>A sin(ωx + φ) + k</b>. Amplitude, angular frequency, phase and offset — four numbers, and nothing else can happen. The period is 2π/ω because the argument must advance by 2π for the wave to repeat.'
        : 'Add a cosine and a sine of the <i>same</i> frequency and you get a single shifted sinusoid — never anything more complicated. The derivation shows why, and the panel checks it at every x. This is the algebraic seed of the phasor: two numbers in, one amplitude and one phase out.'}</p>`;
  },
  wire(){
    ctWireSeg('agTm', v => { ST.mode = v; });
    wireSlider('agTA', () => ST.A, v => { ST.A = v; }, v => ctDeg(+v));
    wireSlider('agTb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('agTc', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    wireSlider('agWA', () => ST.amp, v => { ST.amp = v; }, v => fmtNum(+v, 3));
    wireSlider('agWw', () => ST.w, v => { ST.w = v; }, v => fmtNum(+v, 3));
    wireSlider('agWp', () => ST.ph, v => { ST.ph = v; }, v => ctDeg(+v));
    wireSlider('agWk', () => ST.k, v => { ST.k = v; }, v => fmtNum(+v, 3));
    wireSlider('agHp', () => ST.p, v => { ST.p = v; }, v => fmtNum(+v, 3));
    wireSlider('agHq', () => ST.q, v => { ST.q = v; }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    if(st.mode === 'triangle'){
      const T = agTriangle(st.A, st.b, st.c);
      const P = ctBox(Math.min(W, H * 1.3), H, 1.5, 1.2, 3.6);
      /* place the triangle: vertex A at the origin, side c along the x-axis */
      const A0 = { x:0, y:0 }, B0 = { x:st.c, y:0 };
      const C0 = { x:st.b * Math.cos(st.A), y:st.b * Math.sin(st.A) };
      ctFill(ctx, P, [A0, B0, C0], rgbCss(TH.grad, 0.2));
      ctPath(ctx, P, [A0, B0, C0, A0], rgbCss(TH.grad), 2.4);
      ctArcAngle(ctx, P, 0, 0, 30, 0, st.A, rgbCss(TH.warn), 2);
      ctText(ctx, P.X(0.45), P.Y(0.12), 'A', rgbCss(TH.warn), '600 12px ' + FONT_UI);
      ctText(ctx, P.X(st.c / 2), P.Y(0) + 16, 'c = ' + fmtNum(st.c, 3), rgbCss(TH.neg), '600 11px ' + FONT_UI, 'center');
      ctText(ctx, P.X(C0.x / 2) - 26, P.Y(C0.y / 2), 'b = ' + fmtNum(st.b, 3), rgbCss(TH.pos), '600 11px ' + FONT_UI);
      ctText(ctx, P.X((B0.x + C0.x) / 2) + 8, P.Y((B0.y + C0.y) / 2), 'a = ' + fmtNum(T.a, 3), rgbCss(TH.curl), '600 11px ' + FONT_UI);
      ctFrame(ctx, P, 'side a found by the law of cosines');
      stageNote(ctx, 'set A to 90° and the correction term vanishes — the law of cosines becomes Pythagoras', W, H);
      return;
    }
    if(st.mode === 'wave'){
      const S = agSinusoid(st.amp, st.w, st.ph, st.k);
      const P = mkPlot(80, 60, W - 160, H - 150, -1, 11, -4, 4);
      plotFrame(ctx, P, 'x', 'y', 'y = A sin(ωx + φ) + k');
      ctGrid(ctx, P); plotZeroY(ctx, P);
      plotCurve(ctx, P, S.at, 600, rgbCss(TH.grad), 2.6);
      ctPath(ctx, P, [{ x:P.x0, y:S.max }, { x:P.x1, y:S.max }], rgbCss(TH.pos, 0.6), 1.2, [4, 4]);
      ctPath(ctx, P, [{ x:P.x0, y:S.min }, { x:P.x1, y:S.min }], rgbCss(TH.neg, 0.6), 1.2, [4, 4]);
      ctPath(ctx, P, [{ x:P.x0, y:st.k }, { x:P.x1, y:st.k }], rgbCss(TH.warn, 0.6), 1.4, [6, 4]);
      /* one period marked out */
      const x0 = S.shift;
      ctPath(ctx, P, [{ x:x0, y:-3.6 }, { x:x0, y:3.6 }], rgbCss(TH.curl, 0.6), 1.4, [4, 4]);
      ctPath(ctx, P, [{ x:x0 + S.period, y:-3.6 }, { x:x0 + S.period, y:3.6 }], rgbCss(TH.curl, 0.6), 1.4, [4, 4]);
      ctArrow(ctx, P, x0, -3.2, x0 + S.period, -3.2, rgbCss(TH.curl), 2, 'one period');
      stageNote(ctx, 'four numbers, and nothing else a sinusoid can do', W, H);
      return;
    }
    const Hm = agHarmonic(st.p, st.q);
    const P = mkPlot(80, 60, W - 160, H - 150, -1, 11, -4.5, 4.5);
    plotFrame(ctx, P, 'x', 'y', 'a cos x + b sin x, and the single wave it equals');
    ctGrid(ctx, P); plotZeroY(ctx, P);
    plotCurve(ctx, P, x => st.p * Math.cos(x), 500, rgbCss(TH.neg, 0.7), 1.6);
    plotCurve(ctx, P, x => st.q * Math.sin(x), 500, rgbCss(TH.pos, 0.7), 1.6);
    plotCurve(ctx, P, x => st.p * Math.cos(x) + st.q * Math.sin(x), 500, rgbCss(TH.grad), 2.8);
    plotCurve(ctx, P, x => Hm.R * Math.cos(x - Hm.ph), 500, rgbCss(TH.warn), 1.8, null);
    stageNote(ctx, 'the orange curve lies exactly on the green one — two waves of one frequency are always one wave', W, H);
  },
  derive(st){
    const n = v => fmtNum(v, 6);
    if(st.mode === 'triangle'){
      const T = agTriangle(st.A, st.b, st.c);
      return {
        title:'The law of cosines is Pythagoras with a correction',
        steps:[
          drvStep('drop a perpendicular from C to the side c',
            `${dfn('foot at')} (${dv('b')}${dfn('cos')} ${dv('A')}, 0),  ${dfn('height')} ${dv('b')}${dfn('sin')} ${dv('A')}`,
            `foot at ${n(st.b * Math.cos(st.A))},  height ${n(st.b * Math.sin(st.A))}`),
          drvStep('Pythagoras on the right triangle that creates',
            `${dv('a')}² ${dop('=')} (${dv('c')} ${dop('−')} ${dv('b')}${dfn('cos')} ${dv('A')})² ${dop('+')} (${dv('b')}${dfn('sin')} ${dv('A')})²`,
            `= (${n(st.c)} − ${n(st.b * Math.cos(st.A))})² + ${n(st.b * Math.sin(st.A))}²`),
          drvStep('expand',
            `${dv('a')}² ${dop('=')} ${dv('c')}² ${dop('−')} 2${dv('bc')}${dfn('cos')} ${dv('A')} ${dop('+')} ${dv('b')}²${dfn('cos')}²${dv('A')} ${dop('+')} ${dv('b')}²${dfn('sin')}²${dv('A')}`,
            'the last two terms share a factor of b²'),
          drvStep('and use cos² + sin² = 1',
            `${dv('a')}² ${dop('=')} ${dv('b')}² ${dop('+')} ${dv('c')}² ${dop('−')} 2${dv('bc')}${dfn('cos')} ${dv('A')}`,
            `a² = ${n(T.a * T.a)},  a = ${n(T.a)}`),
          drvSay('and at A = 90° the correction vanishes',
            'cos 90° = 0, so the last term disappears and what is left is a² = b² + c². The law of cosines is not a rival to Pythagoras — it contains it, and the extra term measures exactly how far from right-angled the triangle is.'),
          drvSay('the sign of that term is doing real work',
            'For an acute A the cosine is positive and the correction is subtracted, so a comes out shorter than Pythagoras would give; for an obtuse A the cosine is negative and a comes out longer. One formula covers both, with no case analysis and no diagram to redraw — which is the practical reason to prefer it to chopping the triangle into right-angled pieces by hand.'),
          drvSay('and it is the more reliable of the two laws, which is not obvious',
            'The law of sines looks simpler, and for finding a missing angle it is a trap. sin θ and sin(180° − θ) are the same number, so an arcsine cannot tell an acute angle from its obtuse partner, and two genuinely different triangles can fit the same data — the ambiguous SSA case. The law of cosines has no such blind spot: the cosine is negative for obtuse angles and positive for acute ones, so its arccosine returns exactly one answer. Given three sides, or two sides and the angle between them, use cosines and there is nothing to disambiguate.'),
          drvSay('and the law of sines is secretly a statement about a circle',
            'Its common ratio a/sin A is not just "some number that happens to be shared". It equals 2R, where R is the radius of the circle through all three vertices — so the law of sines says every side is a chord of the circumcircle and its length is fixed by the angle it subtends. That is the inscribed-angle theorem wearing trigonometric notation, and it is why the ratio is the same for all three pairs rather than three separate facts that happen to agree.')
        ],
        note:'The law of sines comes from the same perpendicular: its length is b sin A and also a sin B, so a/sin A = b/sin B immediately.'
      };
    }
    if(st.mode === 'harm'){
      const Hm = agHarmonic(st.p, st.q);
      return {
        title:'Why a cos x + b sin x is a single wave',
        steps:[
          drvStep('write the pair as a vector length and an angle',
            `${dv('R')} ${dop('=')} <span class="rad">${dv('a')}² ${dop('+')} ${dv('b')}²</span>,  ${dfn('tan')} φ ${dop('=')} ${dfrac(dv('b'), dv('a'))}`,
            `R = ${n(Hm.R)},  φ = ${ctDeg(Hm.ph)}`),
          drvStep('so a = R cos φ and b = R sin φ',
            `${dv('a')}${dfn('cos')} ${dv('x')} ${dop('+')} ${dv('b')}${dfn('sin')} ${dv('x')} ${dop('=')} ${dv('R')}(${dfn('cos')} φ ${dfn('cos')} ${dv('x')} ${dop('+')} ${dfn('sin')} φ ${dfn('sin')} ${dv('x')})`,
            `a = ${n(st.p)} = ${n(Hm.R)}·cos φ,   b = ${n(st.q)} = ${n(Hm.R)}·sin φ`),
          drvStep('and that bracket is the addition formula, backwards',
            `${dop('=')} ${dv('R')} ${dfn('cos')}(${dv('x')} ${dop('−')} φ)`,
            `checked at x = 1:  difference = ${fmtNum(Hm.check(1), 3)}`),
          drvSay('which is the whole idea behind phasors',
            'Two numbers went in — how much cosine, how much sine — and one amplitude and one phase came out. That is exactly what a phasor is, and it is why the circuits wing can replace a differential equation with a complex number: adding sinusoids of one frequency never produces anything but another sinusoid of that frequency.')
        ],
        note:'The restriction matters: this works only when both terms have the <i>same</i> frequency. Add two different frequencies and you get beats, which is the waves wing.'
      };
    }
    const S = agSinusoid(st.amp, st.w, st.ph, st.k);
    return {
      title:'What each of the four numbers does',
      steps:[
        drvStep('the general sinusoid',
          `${dv('y')} ${dop('=')} ${dv('A')} ${dfn('sin')}(ω${dv('x')} ${dop('+')} φ) ${dop('+')} ${dv('k')}`,
          `A = ${n(st.amp)}, ω = ${n(st.w)}, φ = ${ctDeg(st.ph)}, k = ${n(st.k)}`),
        drvStep('the sine repeats when its argument advances by 2π',
          `ω(${dv('x')} ${dop('+')} ${dv('T')}) ${dop('+')} φ ${dop('=')} ω${dv('x')} ${dop('+')} φ ${dop('+')} 2π`,
          'so ωT = 2π'),
        drvStep('which fixes the period',
          `${dv('T')} ${dop('=')} ${dfrac('2π', 'ω')}`,
          `T = ${n(S.period)},  frequency = ${n(S.freq)}`),
        drvStep('and the phase is a shift, not a separate idea',
          `${dv('A')} ${dfn('sin')}(ω(${dv('x')} ${dop('+')} φ/ω))`,
          `the wave starts its cycle at x = ${n(S.shift)}`),
        drvSay('note the inversion again',
          'φ/ω appears with the opposite sign to the shift you see — the same inside/outside reversal as in the transformations stage, and for the same reason: φ acts on the input.'),
        drvSay('and why only four numbers, rather than five or fifty',
          'A sinusoid is the solution of y″ = −ω²y, a second-order equation, so its general solution has exactly two free constants — which appear here as A and φ. The offset k is the third because the equation was allowed a constant term, and ω is not a constant of integration at all but part of the equation itself. So the count is not a convention: four is how many numbers a driven harmonic oscillator can possibly remember, and it is why the whole of AC circuit theory, small oscillations and wave optics reduces to bookkeeping on amplitude and phase.'),
        drvSay('the phase is the only one of the four with no absolute meaning',
          'Amplitude, frequency and offset can each be measured from a single recording. Phase cannot: it is measured against a choice of where t = 0, and moving that origin changes φ without changing anything physical. That is why phase almost always appears as a <i>difference</i> — between two signals, between voltage and current, between two arms of an interferometer — and why an absolute phase is never something an experiment reports.')
      ],
      note:'Amplitude sets loudness or brightness, ω sets pitch or colour, φ sets timing, k sets the level about which it oscillates. Every wave in this laboratory is these four numbers.'
    };
  },
  readout(st){
    if(st.mode === 'triangle'){
      const T = agTriangle(st.A, st.b, st.c);
      return `<div class="card tight"><div class="ttl">The triangle</div>
        ${kv('a — from the law of cosines', fmtNum(T.a, 6))}
        ${kv('angle A', ctDeg(T.A))}${kv('angle B', ctDeg(T.B))}${kv('angle C', ctDeg(T.C))}
        ${kv('A + B + C', ctDeg(T.angleSum))}
        ${kv('area ½bc sin A', fmtNum(T.area, 6))}
      </div>
      <div class="card tight"><div class="ttl">The law of sines, all three ratios</div>
        ${T.sines.map((s, i) => kv(['a / sin A', 'b / sin B', 'c / sin C'][i], fmtNum(s, 6))).join('')}
        ${kv('spread between them', fmtNum(Math.max(...T.sines) - Math.min(...T.sines), 3))}
        <p class="help">One number, computed three independent ways. It is the diameter of the
        circumscribed circle, which is why the law of sines is really a statement about that circle.</p>
      </div>`;
    }
    if(st.mode === 'harm'){
      const Hm = agHarmonic(st.p, st.q);
      let worst = 0;
      for(let i = 0; i <= 400; i++) worst = Math.max(worst, Hm.check(i / 400 * 12));
      return `<div class="card tight"><div class="ttl">Two waves, one wave</div>
        ${kv('a  (cos coefficient)', fmtNum(st.p, 5))}
        ${kv('b  (sin coefficient)', fmtNum(st.q, 5))}
        ${kv('R = √(a² + b²)', fmtNum(Hm.R, 6))}
        ${kv('φ = atan2(b, a)', ctDeg(Hm.ph))}
        ${kv('worst disagreement over a full period', fmtNum(worst, 3))}
        <p class="help">The two forms are compared at four hundred points across the period and the
        largest gap is printed. It is zero: they are the same function, not merely similar ones.</p>
      </div>`;
    }
    const S = agSinusoid(st.amp, st.w, st.ph, st.k);
    return `<div class="card tight"><div class="ttl">The sinusoid</div>
      ${kv('amplitude |A|', fmtNum(Math.abs(st.amp), 5))}
      ${kv('period 2π/ω', fmtNum(S.period, 6))}
      ${kv('frequency ω/2π', fmtNum(S.freq, 6))}
      ${kv('phase shift −φ/ω', fmtNum(S.shift, 6))}
      ${kv('maximum', fmtNum(S.max, 5))}${kv('minimum', fmtNum(S.min, 5))}
      ${kv('midline', fmtNum(st.k, 5))}
    </div>`;
  },
  chip(st){
    if(st.mode === 'triangle'){
      const T = agTriangle(st.A, st.b, st.c);
      return `<div class="k">triangle</div><div>a = ${fmtNum(T.a, 4)}</div>
        <div style="color:var(--c-grad)">area ${fmtNum(T.area, 4)}</div>`;
    }
    if(st.mode === 'harm'){
      const Hm = agHarmonic(st.p, st.q);
      return `<div class="k">a cos + b sin</div><div style="color:var(--c-warn)">R = ${fmtNum(Hm.R, 4)}</div>
        <div>φ = ${ctDeg(Hm.ph)}</div>`;
    }
    const S = agSinusoid(st.amp, st.w, st.ph, st.k);
    return `<div class="k">sinusoid</div><div>T = ${fmtNum(S.period, 4)}</div>
      <div style="color:var(--c-grad)">A = ${fmtNum(st.amp, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the result'], ['var(--c-neg)', 'the cosine part'],
                    ['var(--c-pos)', 'the sine part'], ['var(--c-warn)', 'the single equivalent wave']]; },
  dockLegend:true
};
