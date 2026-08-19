/* ============================================================================
   4y · COMPLEX NUMBERS — the plane, the turn, and Euler
   The wing above this one (79c, "Complex Functions & Contours") opens with
   domain colouring. This one opens with the question that produces i at all,
   and its three stages answer three separate questions:

     cnPlane   what arithmetic LOOKS like once numbers are points
     cnPolar   why multiplication is a rotation, measured rather than asserted
     cnEuler   where e^(iθ) = cos θ + i sin θ comes from — summed, not quoted

   The engine is 41a-cnum.js; nothing here computes.
   ============================================================================ */

/* the one box shape this wing needs: a complex number the reader types.
   fnWire's `build` hook does the work, so the error line, the debounce and the
   caret restoration all come from the shared helper rather than being written
   again here — and a formula is allowed inside each part, because cnParse hands
   the coefficients to mathNum. */
const cnBuild = s => {
  const P = cnParse(s);
  if(!P.ok) throw new Error(P.why);
  return { z:P.z, f:() => 0 };
};
/* `audit` is what a gate types in: valid here, and DIFFERENT from every default
   this wing ships, or the "did typing change anything" check has nothing to see.
   Two slots on one panel get different numbers for the same reason auditcustom
   cycles four formula sets — a pair given identical values can degenerate, and
   z₁ = z₂ turns the product into a square and the sum into a doubling. */
const CN_AUDIT = { a:'1.25 - 0.75i', b:'-0.4 + 1.6i', multiplier:'0.7 - 0.55i' };
const CN_SLOT = (k, label, def) =>
  ({ k, label, def, vars:'a complex number — 3 − 2i, i, pi/4, 1.5',
     audit:CN_AUDIT[k] || '0.6 + 1.4i', build:cnBuild });

/* the plane every stage in this wing draws into: equal scales, because the
   whole subject is that multiplication is a rotation and a rotation is only a
   rotation if a unit up is the same length as a unit across. Fitting the box
   instead would draw a shear and call it a turn. */
/* the window arithmetic on its own, so a test can assert the two scales are
   equal without needing a canvas — the same split rlWlPane needed, and for the
   same reason: an unequal-scale plane draws a shear where the subject is a
   rotation, and the picture still looks like a picture */
function cnPlotFor(x, y, w, h, half){
  /* ctFitBox first: mkPlot keeps its box on the canvas, and a square chosen
     before that clamp comes back as a rectangle on a short window — which would
     draw a shear and call it a rotation. Same fix as csRectPane (2026-08-19). */
  const F = ctFitBox(x, y, w, h);
  const side = Math.min(F.pw, F.ph);
  return mkPlot(F.px + (F.pw - side) / 2, F.py + (F.ph - side) / 2, side, side,
                -half, half, -half, half);
}
function cnPane(ctx, x, y, w, h, half, title){
  const P = cnPlotFor(x, y, w, h, half);
  plotFrame(ctx, P, 'real', 'imaginary', title);
  ctGrid(ctx, P);
  ctPath(ctx, P, [{ x:-half, y:0 }, { x:half, y:0 }], rgbCss(TH.faint), 1.2);
  ctPath(ctx, P, [{ x:0, y:-half }, { x:0, y:half }], rgbCss(TH.faint), 1.2);
  return P;
}
/* an arrow from the origin to a complex number, which is what a complex number
   is once you stop calling it a pair */
function cnArrow(ctx, P, z, col, w, label){
  ctArrow(ctx, P, 0, 0, z.re, z.im, col, w || 2.4, label);
}

/* ---- 1 · the plane -------------------------------------------------------- */
STAGES.cnPlane = {
  title:'The complex plane',
  drag:true,
  enter(st, o){
    st.pkey = o.pkey || 'both';
    st.show = Object.assign({ sum:true, prod:true, conj:false }, o.show || {});
    st.drag = null;
  },
  nums(st){
    const P = CN_PAIRS[st.pkey];
    if(st.pkey === 'custom'){
      const own = pkOwn(st, 'cnPl', [CN_SLOT('a', 'z₁', '2 + 1i'), CN_SLOT('b', 'z₂', '1 + 1i')]);
      const A = cnParse(own.a), B = cnParse(own.b);
      return { a:A.ok ? A.z : cx(1, 0), b:B.ok ? B.z : cx(1, 0),
               ok:A.ok && B.ok, why:A.ok ? B.why : A.why, name:'your two numbers' };
    }
    const A = cnParse(P.a), B = cnParse(P.b);
    return { a:A.z, b:B.z, ok:true, why:'', name:P.name };
  },
  controls(){
    const st = ST, N = this.nums(st);
    return pkSeg('cnPlK', CN_PAIRS, st.pkey, e => e.pair) +
      pkBoxes('cnPl', st.pkey, st, [CN_SLOT('a', 'z₁', '2 + 1i'), CN_SLOT('b', 'z₂', '1 + 1i')], null,
              'Write them the way you would on paper — <b>3 − 2i</b>, <b>i</b>, <b>-0.5</b>. ' +
              'Each part may be an expression, so <b>pi/4 + (1/3)i</b> is fine.') +
      `<div class="row wrap">${ctChk('cnPlS', 'the sum', st.show.sum)}
        ${ctChk('cnPlP', 'the product', st.show.prod)}
        ${ctChk('cnPlC', 'the conjugate of z₁', st.show.conj)}</div>
      ${N.ok ? '' : `<p class="help" style="color:var(--c-neg)">${esc(N.why)} — the picture keeps the last pair that read.</p>`}
      <p class="help"><b>Drag either arrow.</b> Addition is the parallelogram you already know from
      vectors, and it is the only thing about complex numbers that is not new. Multiplication is the
      one that is: the product's arrow is <i>longer by a factor of |z₂|</i> and <i>turned by arg z₂</i>,
      which is not something vector addition ever does.</p>
      <p class="help">The conjugate is the reflection in the real axis, and z·z̄ = |z|² is why dividing
      by a complex number works at all: multiply top and bottom by the conjugate and the bottom
      becomes real.</p>`;
  },
  wire(){
    pkWire('cnPlK', 'cnPl', ST.pkey, ST,
           [CN_SLOT('a', 'z₁', '2 + 1i'), CN_SLOT('b', 'z₂', '1 + 1i')], null,
           v => { ST.pkey = v; });
    ctWireChk('cnPlS', v => { ST.show.sum = v; });
    ctWireChk('cnPlP', v => { ST.show.prod = v; });
    ctWireChk('cnPlC', v => { ST.show.conj = v; });
  },
  pick(st, sx, sy, phase){
    if(!st.P) return;
    if(phase === 'up'){ st.drag = null; return; }
    const x = st.P.invX(sx), y = st.P.invY(sy), N = this.nums(st);
    if(phase === 'down'){
      const da = Math.hypot(x - N.a.re, y - N.a.im), db = Math.hypot(x - N.b.re, y - N.b.im);
      const near = Math.min(da, db);
      if(near > 0.35 * st.half) return;
      st.drag = da <= db ? 'a' : 'b';
    }
    if(!st.drag) return;
    /* dragging always writes into the reader's own pair — a preset the reader
       has moved is no longer that preset, and silently editing a named table
       entry is how a picture stops matching the label above it */
    const own = pkOwn(st, 'cnPl', [CN_SLOT('a', 'z₁', '2 + 1i'), CN_SLOT('b', 'z₂', '1 + 1i')]);
    if(st.pkey !== 'custom'){ own.a = cnFmtEdit(N.a, 4); own.b = cnFmtEdit(N.b, 4); st.pkey = 'custom'; }
    own[st.drag] = cnFmtEdit(cx(Math.round(x * 20) / 20, Math.round(y * 20) / 20), 4);
    buildStagePanel();
  },
  frame(st, dt, ctx, W, H){
    const N = this.nums(st);
    const s = cxAdd(N.a, N.b), p = cxMul(N.a, N.b);
    let half = 1.4 * Math.max(cxAbs(N.a), cxAbs(N.b), st.show.sum ? cxAbs(s) : 0,
                              st.show.prod ? cxAbs(p) : 0, 1);
    if(!(half > 0) || !isFinite(half)) half = 3;
    st.half = half;
    const P = cnPane(ctx, 40, 46, W - 80, H - 108, half, 'drag either arrow');
    st.P = P;
    /* the parallelogram first, underneath everything */
    if(st.show.sum){
      ctPath(ctx, P, [{ x:N.a.re, y:N.a.im }, { x:s.re, y:s.im }], rgbCss(TH.faint, 0.9), 1.4, [5, 5]);
      ctPath(ctx, P, [{ x:N.b.re, y:N.b.im }, { x:s.re, y:s.im }], rgbCss(TH.faint, 0.9), 1.4, [5, 5]);
      cnArrow(ctx, P, s, rgbCss(TH.warn), 2.6, 'z₁ + z₂');
    }
    if(st.show.prod){
      /* the arc from z₁ to the product shows the turn as a turn */
      const r = Math.min(90, Math.abs(P.X(cxAbs(N.a)) - P.X(0)));
      ctArcAngle(ctx, P, 0, 0, r, cxArg(N.a), cxArg(N.a) + cxArg(N.b), rgbCss(TH.curl, 0.75), 2);
      cnArrow(ctx, P, p, rgbCss(TH.curl), 2.6, 'z₁ · z₂');
    }
    if(st.show.conj) cnArrow(ctx, P, cxConj(N.a), rgbCss(TH.dim), 1.8, 'z̄₁');
    cnArrow(ctx, P, N.a, rgbCss(TH.pos), 3, 'z₁');
    cnArrow(ctx, P, N.b, rgbCss(TH.neg), 3, 'z₂');
    ctDot(ctx, P, N.a.re, N.a.im, 5, rgbCss(TH.pos), rgbCss(TH.bg));
    ctDot(ctx, P, N.b.re, N.b.im, 5, rgbCss(TH.neg), rgbCss(TH.bg));
    stageNote(ctx, 'adding is the parallelogram — multiplying stretches by |z₂| and turns by arg z₂',
              W, H);
  },
  derive(st){
    const N = this.nums(st), M = cnMulPolar(N.a, N.b);
    const f = z => cnFmt(z, 5);
    return {
      title:'Why multiplying turns the plane',
      steps:[
        drvStep('multiply it out, changing nothing',
          `(${dv('a')} ${dop('+')} ${dv('b')}i)(${dv('c')} ${dop('+')} ${dv('d')}i) ${dop('=')} (${dv('ac')} ${dop('−')} ${dv('bd')}) ${dop('+')} (${dv('ad')} ${dop('+')} ${dv('bc')})i`,
          `${f(N.a)} times ${f(N.b)} is ${f(M.prod)} — every step is ordinary algebra plus i² = −1`),
        drvSay('that formula is correct and tells you nothing',
          'The four products and two signs are what a computer needs; they are not what the operation <em>is</em>. The polar form below is the same arithmetic rewritten until the geometry is visible, which is the only reason it is worth doing.'),
        drvStep('write each number as a length and an angle',
          `${dv('z')} ${dop('=')} ${dv('r')}(${dfn('cos')} θ ${dop('+')} i ${dfn('sin')} θ)`,
          `|z₁| = ${fmtNum(cxAbs(N.a), 5)} at ${ctDeg(cxArg(N.a))},  |z₂| = ${fmtNum(cxAbs(N.b), 5)} at ${ctDeg(cxArg(N.b))}`),
        drvStep('multiply, and use the angle-addition formulas',
          `${dv('r')}₁${dv('r')}₂[${dfn('cos')}(θ₁ ${dop('+')} θ₂) ${dop('+')} i ${dfn('sin')}(θ₁ ${dop('+')} θ₂)]`,
          'the two cos–cos−sin–sin and sin–cos+cos–sin patterns from the trigonometry wing are exactly the real and imaginary parts above'),
        drvSay('so the moduli multiply and the arguments add',
          'That is the whole theorem, and it is why the complex numbers are the natural language of anything that rotates: a phase is an argument, and combining two phases is one multiplication rather than a trigonometric identity.'),
        drvStep('and the panel measures both halves rather than asserting them',
          `| |z₁z₂| ${dop('−')} |z₁||z₂| | ,  |${dfn('arg')}(z₁z₂) ${dop('−')} (θ₁ ${dop('+')} θ₂)|`,
          `${fmtGapTight(M.modGap, Math.max(1e-300, M.gross))}  and  ${fmtGapTight(M.argGap, Math.PI)} in angle`),
        drvSay('the argument comparison is taken on the circle, not the line',
          'arg is only defined up to 2π, so θ₁ + θ₂ can leave the principal range and the naive difference then reads 6.28 for a perfect agreement. The comparison brings it back into (−π, π] first — the same wrap every phase-unwrapping routine in this laboratory has to do, and the same ambiguity that produces exactly n n-th roots two stages further on.'),
        drvSay('and this cannot be done in three dimensions, which is why ℂ is special',
          'It is natural to ask for the same thing one dimension up: a multiplication on ordinary space that scales, rotates and has inverses. There is none. Frobenius proved that the only finite-dimensional associative division algebras over ℝ are ℝ itself, ℂ, and the four-dimensional quaternions — and the quaternions pay for it by abandoning commutativity, so that <b>pq ≠ qp</b>. Three dimensions get nothing at all. The plane is the one place where numbers and rotations are the same thing, which is why so much physics is written there even when the physics is not planar: an oscillation has one phase, and one phase is one angle.'),
        drvSay('note what is NOT available here: an order',
          'ℝ can be arranged on a line, so any two real numbers can be compared. ℂ cannot be ordered in any way compatible with its arithmetic — if it could, i would have to be positive or negative, and either way i² would be positive rather than −1. So "greater than" has no meaning for complex numbers, and every inequality in the rest of this laboratory is about a <em>modulus</em>. That is not a limitation so much as a change of subject: the plane has no left-to-right, only distances and angles.')
      ],
      note:'Nothing above is a definition. i² = −1 and ordinary algebra produce all of it.'
    };
  },
  readout(st){
    const N = this.nums(st), M = cnMulPolar(N.a, N.b), s = cxAdd(N.a, N.b);
    const q = cxAbs(N.b) > 1e-300 ? cxDiv(N.a, N.b) : null;
    return `<div class="card tight"><div class="ttl">${esc(N.name)}</div>
      ${kv('z₁', cnFmt(N.a, 5) + '   —  |z₁| = ' + fmtNum(cxAbs(N.a), 5) + ' at ' + ctDeg(cxArg(N.a)))}
      ${kv('z₂', cnFmt(N.b, 5) + '   —  |z₂| = ' + fmtNum(cxAbs(N.b), 5) + ' at ' + ctDeg(cxArg(N.b)))}
      ${kv('z₁ + z₂', cnFmt(s, 5))}
      ${kv('z₁ · z₂', cnFmt(M.prod, 5))}
      ${kv('z₁ / z₂', q ? cnFmt(q, 5) : 'not defined — z₂ is zero')}
      ${kv('z̄₁, and z₁z̄₁', cnFmt(cxConj(N.a), 5) + '   →  ' + fmtNum(cxMul(N.a, cxConj(N.a)).re, 6) + '  (= |z₁|², and real)')}
    </div>
    <div class="card tight"><div class="ttl">The two halves of the product, measured</div>
      ${kv('|z₁z₂| against |z₁||z₂|', fmtAgreeGross(cxAbs(M.prod), M.gross, M.gross))}
      ${kv('arg(z₁z₂) against θ₁ + θ₂', fmtGap(M.argGap, Math.PI, 'rad'))}
      <p class="help">Both rows come from computing the product two ways that share no line of code:
      componentwise from the four real products, and by multiplying the moduli and adding the
      arguments. Agreement to the last bit is the theorem; it is not built in anywhere.</p>
      <p class="help">${st.pkey === 'custom' ? 'Your own pair.' : CN_PAIRS[st.pkey].why}</p>
    </div>`;
  },
  chip(st){
    const N = this.nums(st);
    return `<div class="k">z₁ · z₂</div>
      <div style="color:var(--c-curl)">${cnFmt(cxMul(N.a, N.b), 4)}</div>
      <div style="color:var(--c-dim)">turn ${ctDeg(cxArg(N.b))}</div>`;
  },
  legend(st){
    const L = [['var(--c-pos)', 'z₁'], ['var(--c-neg)', 'z₂']];
    if(st.show.sum) L.push(['var(--c-warn)', 'z₁ + z₂ — the parallelogram']);
    if(st.show.prod) L.push(['var(--c-curl)', 'z₁ · z₂, and the arc it was turned through']);
    if(st.show.conj) L.push(['var(--c-dim)', 'z̄₁ — the reflection in the real axis']);
    return L;
  },
  dockLegend:true
};

/* ---- 2 · repeated multiplication, and the spiral -------------------------- */
STAGES.cnPolar = {
  title:'Multiplying, over and over',
  enter(st, o){
    st.mkey = o.mkey || 'root';
    st.n = o.n === undefined ? 6 : o.n;
    st.start = o.start || '1';
  },
  mult(st){
    if(st.mkey === 'custom'){
      const own = pkOwn(st, 'cnPo', [CN_SLOT('multiplier', 'multiply by', '0.9 + 0.4i')]);
      const P = cnParse(own.multiplier);
      return { z:P.ok ? P.z : cx(1, 0), ok:P.ok, why:P.why, name:'your multiplier' };
    }
    const P = cnParse(CN_PAIRS[st.mkey].b);
    return { z:P.z, ok:true, why:'', name:CN_PAIRS[st.mkey].name };
  },
  track(st){
    const M = this.mult(st), S = cnParse(st.start);
    let z = S.ok ? S.z : cx(1, 0);
    const pts = [z];
    for(let k = 0; k < st.n; k++){ z = cxMul(z, M.z); pts.push(z); }
    return { pts, M, z0:S.ok ? S.z : cx(1, 0) };
  },
  controls(){
    const st = ST;
    return pkSeg('cnPoK', CN_PAIRS, st.mkey, e => e.short) +
      pkBoxes('cnPo', st.mkey, st, [CN_SLOT('multiplier', 'multiply by', '0.9 + 0.4i')], null,
              'Anything you like — <b>1.1i</b> spirals outward, <b>0.8</b> shrinks along the axis, ' +
              '<b>0.9 + 0.4i</b> does both at once.') +
      ctlRow('how many times', ctlSlider('cnPoN', 1, 24, 1, st.n)) +
      `<p class="help">Each step is one multiplication by the same number, so the picture is
      |z|ⁿ at angle nθ — de Moivre's theorem, drawn. Whether the path spirals in, spirals out or
      closes into a polygon is decided by <b>one number</b>: whether the multiplier's modulus is
      below, above or exactly 1.</p>
      <p class="help">That is also the whole convergence condition for a geometric series, and the
      whole stability condition for a linear recurrence. Three subjects, one circle.</p>`;
  },
  wire(){
    pkWire('cnPoK', 'cnPo', ST.mkey, ST, [CN_SLOT('multiplier', 'multiply by', '0.9 + 0.4i')], null,
           v => { ST.mkey = v; });
    wireSlider('cnPoN', () => ST.n, v => { ST.n = Math.round(v); }, v => String(Math.round(+v)));
  },
  frame(st, dt, ctx, W, H){
    const T = this.track(st);
    let half = 1.3 * T.pts.reduce((m, z) => Math.max(m, cxAbs(z)), 0.5);
    if(!(half > 0) || !isFinite(half)) half = 3;
    const P = cnPane(ctx, 40, 46, W - 80, H - 142, half, 'z, z·w, z·w², …');
    /* the unit circle, because the whole reading of the picture is inside/outside it */
    ctParam(ctx, P, t => ({ x:Math.cos(t), y:Math.sin(t) }), 0, 2 * Math.PI, 220,
            rgbCss(TH.faint), 1.6, [4, 4]);
    ctPath(ctx, P, T.pts.map(z => ({ x:z.re, y:z.im })), rgbCss(TH.curl, 0.85), 2);
    T.pts.forEach((z, k) => {
      ctDot(ctx, P, z.re, z.im, k === 0 ? 6 : 4,
            k === 0 ? rgbCss(TH.pos) : rgbCss(TH.curl), rgbCss(TH.bg));
    });
    const last = T.pts[T.pts.length - 1];
    cnArrow(ctx, P, last, rgbCss(TH.warn), 2, 'after ' + st.n);
    ctText(ctx, 70, H - 34,
           'dashed: the unit circle — inside it every multiplication shrinks, outside it every one grows',
           rgbCss(TH.dim), '11px ' + FONT_UI);
    stageNote(ctx, 'one multiplication, repeated — |w| decides in or out, arg w decides how fast round',
              W, H);
  },
  derive(st){
    const T = this.track(st), M = T.M, r = cxAbs(M.z), th = cxArg(M.z);
    const P = cnPowerTwo(M.z, st.n);
    return {
      title:'de Moivre, and what it decides',
      steps:[
        drvStep('one multiplication scales and turns',
          `${dv('z')} ${dop('↦')} ${dv('w')}${dv('z')},  |${dv('w')}${dv('z')}| ${dop('=')} |${dv('w')}||${dv('z')}|,  ${dfn('arg')} ${dop('=')} ${dfn('arg')} ${dv('w')} ${dop('+')} ${dfn('arg')} ${dv('z')}`,
          `here |w| = ${fmtNum(r, 6)} and arg w = ${ctDeg(th)}`),
        drvStep('so n of them multiply the modulus n times and add the angle n times',
          `${dv('w')}ⁿ ${dop('=')} ${dv('r')}ⁿ(${dfn('cos')} ${dv('n')}θ ${dop('+')} i ${dfn('sin')} ${dv('n')}θ)`,
          `w^${st.n} = ${cnFmt(P.moivre, 6)}`),
        drvStep('and the panel does the multiplications too, as a check',
          `${dv('w')} ${dop('·')} ${dv('w')} ${dop('·')} … ${dop('=')} ${cnFmt(P.repeated, 6)}`,
          fmtGap(P.gap, Math.max(1e-300, P.gross))),
        drvSay('the two routes have different errors, which is the point of running both',
          'Repeated multiplication accumulates round-off roughly linearly in n; the closed form does not, but it needs an inverse tangent and a cosine, each with their own. They agree here to the last few bits, and that agreement is evidence — a single route would have none.'),
        drvSay(r > 1.0000001 ? 'this multiplier grows without bound'
             : r < 0.9999999 ? 'this multiplier shrinks to nothing'
             : 'this multiplier stays exactly on the circle',
          r > 1.0000001 ? 'rⁿ → ∞, so the spiral leaves any disc you draw. A geometric series with this ratio diverges, and a linear recurrence with this eigenvalue is unstable — the same statement three times.'
          : r < 0.9999999 ? 'rⁿ → 0, so the spiral falls into the origin. This is why |ratio| < 1 is the condition for a geometric series to converge: the terms are exactly these points.'
          : 'rⁿ = 1 for every n, so the points never leave the unit circle. If the angle is a rational multiple of 2π the walk closes into a polygon; if it is irrational it never repeats and fills the circle densely.'),
        drvSay('one number decides three questions that are usually taught separately',
          'Whether a geometric series ∑wⁿ converges, whether the linear recurrence x_{n+1} = w·x_n settles or blows up, and whether this picture spirals in or out are not three facts — they are the single question "is |w| below 1?", asked in three vocabularies. The complex case is not a generalisation of the real one either: the real condition |r| &lt; 1 already <em>is</em> this condition, seen on the one line where the argument can only be 0 or π. Every stability criterion later in this laboratory, from the eigenvalues of a linear system to the growth of a numerical scheme, is a statement about where some number sits relative to this circle.'),
        drvSay('and the angle decides whether the walk ever repeats',
          'On the circle the modulus can decide nothing, so the argument decides everything. An angle of 2πp/q returns after exactly q steps and the orbit is a finite set of points — the q-th roots of unity, rotated. An irrational multiple of 2π never returns at all: the points are distinct for ever and come arbitrarily close to every point of the circle. Two multipliers a millionth apart can therefore behave completely differently in the long run, which is the first hint of a theme the dynamics wing takes seriously.')
      ],
      note:'Everything a repeated multiplication can do is decided by one number, |w|, and one angle.'
    };
  },
  readout(st){
    const T = this.track(st), r = cxAbs(T.M.z), P = cnPowerTwo(T.M.z, st.n);
    const last = T.pts[T.pts.length - 1];
    const closes = Math.abs(cnWrapPi(cxArg(T.M.z) * st.n)) < 1e-9 && Math.abs(r - 1) < 1e-12;
    return `<div class="card tight"><div class="ttl">${esc(T.M.name)}</div>
      ${kv('the multiplier w', cnFmt(T.M.z, 6))}
      ${kv('|w|', fmtNum(r, 8) + (r > 1 ? '  — outside the unit circle' : r < 1 ? '  — inside it' : '  — on it'))}
      ${kv('arg w', ctDeg(cxArg(T.M.z)))}
      ${kv('after ' + st.n + ' steps', cnFmt(last, 6))}
      ${kv('|w|^' + st.n, fmtSig(Math.pow(r, st.n), 6))}
      ${kv('closes into a polygon?', closes ? 'yes — n·arg w is a whole number of turns' : 'not at this n')}
    </div>
    <div class="card tight"><div class="ttl">de Moivre against the multiplications</div>
      ${kv('by ' + st.n + ' multiplications', cnFmt(P.repeated, 8))}
      ${kv('by rⁿ∠nθ', cnFmt(P.moivre, 8))}
      ${kv('difference', fmtGap(P.gap, Math.max(1e-300, P.gross)))}
      <p class="help">${st.mkey === 'custom' ? 'Your own multiplier.' : CN_PAIRS[st.mkey].why}</p>
    </div>`;
  },
  chip(st){
    const T = this.track(st), r = cxAbs(T.M.z);
    return `<div class="k">|w| = ${fmtNum(r, 4)}</div>
      <div style="color:var(--c-curl)">${r > 1 ? 'spiralling out' : r < 1 ? 'spiralling in' : 'on the circle'}</div>
      <div style="color:var(--c-dim)">${st.n} steps</div>`;
  },
  legend(){ return [['var(--c-pos)', 'where it starts'], ['var(--c-curl)', 'each multiplication'],
                    ['var(--c-warn)', 'where it ends up'], ['var(--c-faint)', 'the unit circle']]; },
  dockLegend:true
};

/* ---- 3 · Euler, summed --------------------------------------------------- */
STAGES.cnEuler = {
  title:'Where e^(iθ) comes from',
  enter(st, o){
    st.th = o.th === undefined ? 2.2 : o.th;
    st.n = o.n === undefined ? 6 : o.n;
    st.run = !!o.run;
  },
  controls(){
    const st = ST;
    return ctlRow('the angle θ', ctlSlider('cnEuT', -Math.PI, Math.PI, 0.005, st.th)) +
      ctlRow('terms kept', ctlSlider('cnEuN', 0, 24, 1, st.n)) +
      ctChk('cnEuR', 'add terms one at a time', st.run) +
      `<p class="help">The exponential is <b>defined</b> by its series — that is the only definition
      that works for a complex exponent, because "multiply e by itself i times" means nothing. Put iθ
      into it and the powers of i cycle 1, i, −1, −i, so the real terms are exactly the series for
      cos θ and the imaginary ones exactly the series for sin θ.</p>
      <p class="help">The path drawn is the partial sums, nose to tail: each term is a step, each step
      is a quarter turn from the one before, and the spiral it makes closes onto the unit circle. At
      θ = π it lands on −1, which is the identity people put on T-shirts — here it is a measurement.</p>`;
  },
  wire(){
    wireSlider('cnEuT', () => ST.th, v => { ST.th = v; }, v => ctDeg(+v));
    wireSlider('cnEuN', () => ST.n, v => { ST.n = Math.round(v); }, v => String(Math.round(+v)));
    ctWireChk('cnEuR', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    if(st.run){
      st.acc = (st.acc || 0) + dt * 1.6;
      while(st.acc >= 1){ st.acc -= 1; st.n = st.n >= 24 ? 0 : st.n + 1; }
    }
    const S = cnExpSeries(st.th, st.n);
    /* Fit the window over the SAME list that is drawn from. The partial sums of
       e^(iθ) overshoot badly before they settle — at θ = 2.2 the second one is
       1 + 2.2i, well outside the unit circle — and a window sized to the circle
       and the answer clips the very thing the stage is about. That is the
       auditframe failure mode (odSpring, 2026-08-18) in a new wing. */
    let half = 1.25;
    for(const z of S.partials) half = Math.max(half, 1.15 * cxAbs(z));
    if(!(half > 0) || !isFinite(half)) half = 1.9;
    const P = cnPane(ctx, 40, 46, W - 80, H - 142, half, 'the partial sums, nose to tail');
    ctParam(ctx, P, t => ({ x:Math.cos(t), y:Math.sin(t) }), 0, 2 * Math.PI, 240,
            rgbCss(TH.faint), 1.6, [4, 4]);
    /* each step is one term of the series */
    for(let k = 1; k < S.partials.length; k++){
      const a = S.partials[k - 1], b = S.partials[k];
      ctPath(ctx, P, [{ x:a.re, y:a.im }, { x:b.re, y:b.im }], rgbCss(TH.curl, 0.8), 1.8);
      ctDot(ctx, P, b.re, b.im, 3, rgbCss(TH.curl, 0.9));
    }
    const truth = S.truth;
    ctDot(ctx, P, truth.re, truth.im, 6, rgbCss(TH.pos), rgbCss(TH.bg));
    ctText(ctx, P.X(truth.re) + 10, P.Y(truth.im) - 6, 'cos θ + i sin θ',
           rgbCss(TH.pos), '600 11px ' + FONT_UI);
    ctDot(ctx, P, S.sum.re, S.sum.im, 5, rgbCss(TH.warn), rgbCss(TH.bg));
    cnArrow(ctx, P, S.sum, rgbCss(TH.warn, 0.7), 1.6);
    /* the angle being swept, so the reader can see theta as an ARC LENGTH */
    ctArcAngle(ctx, P, 0, 0, Math.abs(P.X(1) - P.X(0)), 0, st.th, rgbCss(TH.grad, 0.75), 2.4);
    ctText(ctx, 70, H - 34,
           'the arc is θ itself — on the unit circle the angle and the arc length are the same number, which is what a radian is',
           rgbCss(TH.dim), '11px ' + FONT_UI);
    stageNote(ctx, st.n + (st.n === 1 ? ' term' : ' terms') + ' of the series', W, H);
  },
  derive(st){
    const S = cnExpSeries(st.th, st.n), F = cnExpSeries(st.th, 60);
    return {
      title:'Euler’s formula, from the series and nothing else',
      steps:[
        drvStep('the exponential IS its series — for a complex exponent there is no other definition',
          `${dfn('e')}^${dv('z')} ${dop('=')} 1 ${dop('+')} ${dv('z')} ${dop('+')} ${dfrac(dv('z') + '²', '2!')} ${dop('+')} ${dfrac(dv('z') + '³', '3!')} ${dop('+')} …`,
          'converges for every complex z, and reduces to the familiar function on the real axis'),
        drvStep('put in z = iθ, and use the cycle of the powers of i',
          `i⁰ ${dop('=')} 1,  i¹ ${dop('=')} i,  i² ${dop('=')} ${dop('−')}1,  i³ ${dop('=')} ${dop('−')}i,  i⁴ ${dop('=')} 1, …`,
          'so every second term is real and every other one imaginary, with signs alternating in pairs'),
        drvStep('collect the real terms',
          `1 ${dop('−')} ${dfrac('θ²', '2!')} ${dop('+')} ${dfrac('θ⁴', '4!')} ${dop('−')} … ${dop('=')} ${dfn('cos')} θ`,
          `at θ = ${fmtNum(st.th, 5)}:  ${fmtNum(S.sum.re, 8)} against cos θ = ${fmtNum(S.truth.re, 8)}`),
        drvStep('and the imaginary ones',
          `θ ${dop('−')} ${dfrac('θ³', '3!')} ${dop('+')} ${dfrac('θ⁵', '5!')} ${dop('−')} … ${dop('=')} ${dfn('sin')} θ`,
          `${fmtNum(S.sum.im, 8)} against sin θ = ${fmtNum(S.truth.im, 8)}`),
        drvSay('so the formula is not an analogy — it is the same series, sorted',
          'Nothing was assumed about e^(iθ) beyond the series that defines it. The two real series that fall out were already known as cos and sin, so the identity is a rearrangement rather than a discovery about a new object.'),
        drvStep('and the panel sums it rather than calling an exponential',
          `${'∑'}${dop('_')}${dv('k')}${dop('≤')}${st.n} ${dfrac('(iθ)^' + dv('k'), dv('k') + '!')}`,
          `${st.n} terms leaves ${fmtGap(S.gap, Math.max(1, S.gross))}; sixty terms leaves ${fmtGap(F.gap, Math.max(1, F.gross))}`),
        drvSay('the check would be worthless the other way round',
          'The library exponential of a complex number is <em>implemented</em> as e^x(cos y + i sin y) — comparing against it would compare Euler’s formula with itself and always agree. This stage sums the series term by term and never calls it, which is the difference between a demonstration and a tautology.'),
        drvSay('the series definition is not a convenience, it is the only option',
          'For a real exponent, e^x can be built from repeated multiplication and then extended by continuity. That road is closed here: "multiply e by itself i times" is not a sentence anyone can complete. What survives is the property the exponential is really for — e^(a+b) = e^a·e^b, the rule that turns addition into multiplication — and the power series is the unique analytic function satisfying it with the right derivative at 0. So the series is not one description among several; it is what the exponential <em>is</em>, and Euler’s formula is then a fact about how that series sorts itself.'),
        drvSay('and the series converges everywhere, which is why none of this needs care',
          'The terms are (iθ)ᵏ/k!, whose sizes are θᵏ/k!, and factorials outrun powers for every fixed θ. So the series converges absolutely on the whole plane — no radius of convergence to check, no endpoint to worry about, and absolute convergence is exactly what licenses the reordering that splits it into a real family and an imaginary one. The spiral drawn here overshoots wildly for large θ before settling, which is the terms being large before the factorial takes over; it is slow arithmetic, not doubtful arithmetic.')
      ],
      note:'At θ = π the sum lands on −1, so e^(iπ) + 1 = 0 — measured here to about 10⁻¹⁶, not quoted.'
    };
  },
  readout(st){
    const S = cnExpSeries(st.th, st.n), F = cnExpSeries(st.th, 60);
    const pi = cnExpSeries(Math.PI, 60);
    return `<div class="card tight"><div class="ttl">${st.n} term${st.n === 1 ? '' : 's'} at θ = ${ctDeg(st.th)}</div>
      ${kv('the partial sum', cnFmt(S.sum, 8))}
      ${kv('cos θ + i sin θ', cnFmt(S.truth, 8))}
      ${kv('how far short', fmtGap(S.gap, Math.max(1, S.gross)))}
      ${kv('the next term alone', fmtSig(S.lastTerm, 4))}
      <p class="help">The size of the next term is a good estimate of what is still missing, because
      the terms alternate in direction once k passes θ — an alternating series is bounded by its
      first omitted term, which is the one error estimate you get for free.</p>
    </div>
    <div class="card tight"><div class="ttl">Where it is going</div>
      ${kv('sixty terms', cnFmt(F.sum, 10))}
      ${kv('against cos θ + i sin θ', fmtGap(F.gap, Math.max(1, F.gross)))}
      ${kv('|e^(iθ)| — should be exactly 1', fmtNum(cxAbs(F.sum), 10))}
      ${kv('e^(iπ) + 1', fmtSig(cxAbs(cxAdd(pi.sum, cx(1, 0))), 3) + '  — summed, not quoted')}
      <p class="help">The modulus row is the strongest statement here: a sum of thirty-odd complex
      terms, none of which has modulus 1, adds up to something of modulus 1 to ten figures. That is
      the unit circle appearing out of arithmetic.</p>
    </div>`;
  },
  chip(st){
    const S = cnExpSeries(st.th, st.n);
    return `<div class="k">${st.n} term${st.n === 1 ? '' : 's'}</div>
      <div style="color:var(--c-warn)">${cnFmt(S.sum, 4)}</div>
      <div style="color:var(--c-dim)">short by ${fmtSig(S.gap, 2)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'each term, laid nose to tail'],
                    ['var(--c-warn)', 'the partial sum so far'],
                    ['var(--c-pos)', 'cos θ + i sin θ, where it is heading'],
                    ['var(--c-grad)', 'the arc of length θ']]; },
  dockLegend:true
};
