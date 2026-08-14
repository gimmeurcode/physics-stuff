/* ============================================================================
   4f · THE VECTORS & SPACE WING
   ============================================================================ */

/* ---- 1 · vectors in the plane: everything is drag ------------------------- */
STAGES.gaVec = {
  title:'Vectors in the plane',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Two operations, and everything else is built from them',
      steps:[
        drvSay('what a vector is, and what it is not',
          'A vector is a displacement — an amount and a direction — not a location. The same arrow drawn anywhere on the page represents the same vector, which is why it can be slid to the tip of another to add them. Confusing a vector with a point is the source of most early trouble.'),
        drvStep('addition, componentwise',
          `${dv('a')} ${dop('+')} ${dv('b')} ${dop('=')} (${dv('a')}ₓ{+}${dv('b')}ₓ, ${dv('a')}_y{+}${dv('b')}_y)`,
          `(${n(st.a.x)}, ${n(st.a.y)}) + (${n(st.b.x)}, ${n(st.b.y)}) = (${n(st.a.x + st.b.x)}, ${n(st.a.y + st.b.y)})`),
        drvSay('and the parallelogram is the same statement geometrically',
          'Going along a then b lands in the same place as going along b then a. That commutativity is visible as the closing of a parallelogram, and it is why net displacement, net force and net velocity all combine this way — the algebra was designed to match the geometry.'),
        drvStep('scalar multiplication stretches without turning',
          `${dv('k')}${dv('a')} ${dop('=')} (${dv('k')}${dv('a')}ₓ, ${dv('k')}${dv('a')}_y)`,
          `k = ${n(st.k)} scales the length by |k| and ${st.k < 0 ? 'reverses' : 'preserves'} the direction`),
        drvSay('those two operations define a vector space, and nothing more is needed',
          'Add, and scale. Every notion in the linear-algebra wing — span, dependence, basis, dimension — is built from just these. The vectors need not be arrows: functions, polynomials and matrices all obey the same two rules, which is why the theory transfers to them intact.'),
        drvStep('length comes from Pythagoras',
          `|${dv('a')}| ${dop('=')} √(${dv('a')}ₓ² ${dop('+')} ${dv('a')}_y²)`,
          `|a| = ${n(Math.hypot(st.a.x, st.a.y))}`),
        drvStep('dividing by the length leaves direction alone',
          `${dv('a')}̂ ${dop('=')} ${dv('a')}/|${dv('a')}|`,
          'a unit vector — used whenever direction matters and size does not'),
        drvSay('and subtraction is the vector between two points',
          'b − a is the displacement that takes you from a to b. That is why the distance between two points is |b − a|, and why a line through two points is written as one point plus a multiple of their difference.')
      ],
      note:'Drag either arrow and every readout updates. The components, the length and the angle are computed from the dragged positions, so the identities on screen hold for whatever configuration you make rather than for a chosen example.'
    };
  },
  drag:true,
  enter(st, o){
    st.a = { x:o.ax === undefined ? 2.4 : o.ax, y:o.ay === undefined ? 1.1 : o.ay };
    st.b = { x:o.bx === undefined ? -0.9 : o.bx, y:o.by === undefined ? 2.0 : o.by };
    st.k = o.k === undefined ? 1.6 : o.k;
    st.show = Object.assign({ sum:true, diff:false, par:true, unit:false, scale:false }, o.show || {});
    st.grab = null;
  },
  controls(){
    const st = ST;
    return ctlRow('scalar k', ctlSlider('gaK', -2.5, 2.5, 0.05, st.k)) +
      `<div class="row wrap">${ctChk('gaSum', 'a + b, with the parallelogram', st.show.sum)}
        ${ctChk('gaDiff', 'a − b, tail to tip', st.show.diff)}
        ${ctChk('gaUnit', 'the unit vector â', st.show.unit)}
        ${ctChk('gaScale', 'the scalar multiple k·a', st.show.scale)}</div>
      <p class="help"><b>Drag either arrowhead.</b> Addition is defined tip-to-tail and nothing else:
      slide <b>b</b> so its tail sits on the tip of <b>a</b>, and the arrow from the shared origin to the
      far tip is <b>a + b</b>. The parallelogram is the same statement made twice, which is why addition
      commutes. Subtraction is the arrow <i>from</i> the tip of b <i>to</i> the tip of a — the thing you
      must add to b to get a.</p>`;
  },
  wire(){
    wireSlider('gaK', () => ST.k, v => { ST.k = v; }, v => fmtNum(+v, 3));
    ctWireChk('gaSum', v => { ST.show.sum = v; ST.show.par = v; });
    ctWireChk('gaDiff', v => { ST.show.diff = v; });
    ctWireChk('gaUnit', v => { ST.show.unit = v; });
    ctWireChk('gaScale', v => { ST.show.scale = v; });
  },
  pick(st, sx, sy, phase){
    const P = st.P; if(!P) return;
    const x = P.invX(sx), y = P.invY(sy);
    if(phase === 'down' || phase === 'click'){
      const da = Math.hypot(x - st.a.x, y - st.a.y), db = Math.hypot(x - st.b.x, y - st.b.y);
      st.grab = (da < db ? 'a' : 'b');
      if(Math.min(da, db) > 1.2 / (P.u / 40)) st.grab = da < db ? 'a' : 'b';
    }
    if(phase === 'up'){ st.grab = null; return; }
    if(st.grab) st[st.grab] = { x, y };
  },
  frame(st, dt, ctx, W, H){
    const P = ctBox(W, H, 0.6, 0.6, 3.6);
    st.P = P;
    ctGrid(ctx, P, 1);
    ctFrame(ctx, P, 'Drag either arrowhead — every number in the panel follows');
    const a = st.a, b = st.b;
    const sum = { x:a.x + b.x, y:a.y + b.y }, dif = { x:a.x - b.x, y:a.y - b.y };
    if(st.show.par){
      ctFill(ctx, P, [{ x:0, y:0 }, a, sum, b], rgbCss(TH.grad, 0.1));
      ctPath(ctx, P, [a, sum], rgbCss(TH.faint, 0.8), 1.2, [4, 4]);
      ctPath(ctx, P, [b, sum], rgbCss(TH.faint, 0.8), 1.2, [4, 4]);
    }
    if(st.show.scale) ctArrow(ctx, P, 0, 0, st.k * a.x, st.k * a.y, rgbCss(TH.warn, 0.85), 3.4, 'k·a');
    if(st.show.sum) ctArrow(ctx, P, 0, 0, sum.x, sum.y, rgbCss(TH.curl), 2.6, 'a + b');
    if(st.show.diff){
      ctArrow(ctx, P, b.x, b.y, a.x, a.y, rgbCss(TH.neg), 2.2, 'a − b');
      ctArrow(ctx, P, 0, 0, dif.x, dif.y, rgbCss(TH.neg, 0.45), 1.8, null);
    }
    ctArrow(ctx, P, 0, 0, a.x, a.y, rgbCss(TH.grad), 3, 'a');
    ctArrow(ctx, P, 0, 0, b.x, b.y, rgbCss(TH.pos), 3, 'b');
    if(st.show.unit){
      const L = Math.hypot(a.x, a.y) || 1;
      ctArrow(ctx, P, 0, 0, a.x / L, a.y / L, rgbCss(TH.text), 2.4, 'â');
      ctx.strokeStyle = rgbCss(TH.text, 0.3); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), P.u, 0, 6.2832); ctx.stroke();
    }
    /* the components, drawn as the two legs of the right triangle they are */
    ctPath(ctx, P, [{ x:a.x, y:0 }, a], rgbCss(TH.grad, 0.4), 1.2, [3, 3]);
    ctPath(ctx, P, [{ x:0, y:0 }, { x:a.x, y:0 }], rgbCss(TH.grad, 0.4), 1.2, [3, 3]);
    ctDot(ctx, P, a.x, a.y, 5, rgbCss(TH.grad), rgbCss(TH.bg));
    ctDot(ctx, P, b.x, b.y, 5, rgbCss(TH.pos), rgbCss(TH.bg));
    stageNote(ctx, 'components ⟨a₁, a₂⟩ · magnitude √(a₁²+a₂²) · addition is tip to tail', W, H);
  },
  readout(st){
    const a = st.a, b = st.b;
    const la = Math.hypot(a.x, a.y), lb = Math.hypot(b.x, b.y);
    const sum = { x:a.x + b.x, y:a.y + b.y };
    const ls = Math.hypot(sum.x, sum.y);
    const th = gaAngle(v3(a.x, a.y, 0), v3(b.x, b.y, 0));
    return `<div class="card tight"><div class="ttl">The two vectors</div>
      ${kv('a', ctVec2(a))}${kv('|a|', fmtNum(la, 5))}
      ${kv('â  (unit)', ctVec2({ x:a.x / (la || 1), y:a.y / (la || 1) }))}
      ${kv('b', ctVec2(b))}${kv('|b|', fmtNum(lb, 5))}
      ${kv('angle between them', ctDeg(th))}
      ${kv('k·a', ctVec2({ x:st.k * a.x, y:st.k * a.y }))}
      ${kv('|k·a| = |k||a|', fmtNum(Math.abs(st.k) * la, 5))}
    </div>
    <div class="card tight"><div class="ttl">Sum, difference, and the inequality</div>
      ${kv('a + b', ctVec2(sum))}${kv('|a + b|', fmtNum(ls, 5))}
      ${kv('|a| + |b|', fmtNum(la + lb, 5))}
      ${kv('a − b', ctVec2({ x:a.x - b.x, y:a.y - b.y }))}
      ${kv('|a − b|', fmtNum(Math.hypot(a.x - b.x, a.y - b.y), 5))}
      <p class="help">The triangle inequality <b>|a + b| ≤ |a| + |b|</b> is visible above as two numbers,
      and it becomes an equality exactly when the two arrows point the same way — line them up and watch
      the gap close. It is the statement that a straight route is never longer than a detour, and it is
      the one property a length must have to deserve the name.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">Vectors in the plane</div>
      <div style="color:var(--c-grad)">a = ${ctVec2(st.a, 3)}</div>
      <div style="color:var(--c-pos)">b = ${ctVec2(st.b, 3)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'a'], ['var(--c-pos)', 'b'], ['var(--c-curl)', 'a + b'],
                    ['var(--c-neg)', 'a − b'], ['var(--c-warn)', 'k·a']]; }
};

/* ---- 2 · vectors in space -------------------------------------------------- */
STAGES.gaSpace = {
  title:'Vectors in space',
  derive(st){
    return {
      title:'Everything from the plane, with one more coordinate',
      steps:[
        drvSay('what carries over unchanged, which is almost all of it',
          'Addition, scalar multiplication, length and the dot product are defined by the same formulas with one more term. None of the reasoning behind them used the number of dimensions, which is why they generalise without modification — and why they keep working in the four dimensions of relativity and the infinite dimensions of function spaces.'),
        drvStep('length is Pythagoras applied twice',
          `|${dv('a')}| ${dop('=')} √(${dv('a')}ₓ² ${dop('+')} ${dv('a')}_y² ${dop('+')} ${dv('a')}_z²)`,
          'first across the floor, then up — the panel draws both right triangles'),
        drvSay('that nesting is why the formula has this shape',
          'The diagonal of a box is found by taking the diagonal of its base, then treating that and the height as the legs of a second right triangle. Squares add because Pythagoras is applied twice, and the same nesting gives the formula in any number of dimensions.'),
        drvStep('the dot product gains a term and nothing else',
          `${dv('a')} ${dop('·')} ${dv('b')} ${dop('=')} ${dv('a')}ₓ${dv('b')}ₓ ${dop('+')} ${dv('a')}_y${dv('b')}_y ${dop('+')} ${dv('a')}_z${dv('b')}_z`,
          'and it still equals |a||b|cos θ, by the same law-of-cosines argument'),
        drvStep('direction now needs two angles, or three cosines',
          `cos α, cos β, cos γ with Σcos² ${dop('=')} 1`,
          'the direction cosines are the components of the unit vector, and the panel prints them'),
        drvSay('what genuinely changes is the notion of perpendicular',
          'In the plane, one direction determines the perpendicular up to sign. In space, the vectors perpendicular to a given one form a whole plane. That is why a line in space cannot be specified by a single normal, and why planes and lines need different descriptions here.'),
        drvStep('so the cross product becomes available',
          `only in three dimensions is "the" perpendicular unique`,
          'the next stage builds it — the plane has no such product, and neither does four-dimensional space'),
        drvSay('and that is an accident of counting, not a deep truth about space',
          'Two vectors span a plane, and a plane in n dimensions has an orthogonal complement of dimension n − 2. Only when n = 3 is that complement a single line, so only then does "the perpendicular direction" name one thing. In four dimensions it is a whole plane and there is nothing to point at. The cross product is therefore a coincidence of three dimensions, which is why the differential-forms wing replaces it with the wedge product — that produces the plane itself, works in every dimension, and needs no coincidence.'),
        drvSay('which is why a cross product behaves oddly under reflection',
          'Reflect everything in a mirror and ordinary vectors reverse the component along the mirror\'s normal — but a cross product reverses <i>all</i> its components, because both factors flipped. Angular momentum, torque and the magnetic field are all built this way, and all of them are pseudovectors: their direction depends on a right-hand convention that a mirror does not respect. That is not a paradox, it is the sign that the object was really a plane, or an oriented area, being represented by an arrow for convenience.')
      ],
      note:'Rotate the view to see that the vectors and their sum genuinely live in three dimensions rather than a drawn projection of two. The box drawn around a vector shows the two Pythagorean steps that make up its length.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.a = v3(2, 1.4, 1.8); st.b = v3(-1.2, 2.2, 0.6);
    st.show = Object.assign({ sum:true, box:true, sphere:false }, o.show || {});
    st.rr = 2.2;
    R.cam.az = 0.72; R.cam.el = 0.38; ctCamFit(3);
  },
  controls(){
    const st = ST;
    return ctlRow('a₁', ctlSlider('gaA1', -3, 3, 0.05, st.a.x)) +
      ctlRow('a₂', ctlSlider('gaA2', -3, 3, 0.05, st.a.y)) +
      ctlRow('a₃', ctlSlider('gaA3', -3, 3, 0.05, st.a.z)) +
      ctlRow('sphere r', ctlSlider('gaRR', 0.4, 3, 0.05, st.rr)) +
      `<div class="row wrap">${ctChk('gaS3', 'a + b', st.show.sum)}
        ${ctChk('gaB3', 'the component box', st.show.box)}
        ${ctChk('gaSph', 'the sphere |r − c| = r', st.show.sphere)}</div>
      <p class="help">Everything from the plane survives one extra component unchanged: components add,
      lengths come from Pythagoras applied twice, and the unit vector is still the vector over its length.
      What is genuinely new is that <b>the distance formula becomes the equation of a sphere</b> —
      <b>(x−a)² + (y−b)² + (z−c)² = r²</b> is not a definition to memorise but the distance formula with
      the distance held fixed. <b>Drag the canvas</b> to orbit.</p>`;
  },
  wire(){
    wireSlider('gaA1', () => ST.a.x, v => { ST.a = v3(v, ST.a.y, ST.a.z); }, v => fmtNum(+v, 3));
    wireSlider('gaA2', () => ST.a.y, v => { ST.a = v3(ST.a.x, v, ST.a.z); }, v => fmtNum(+v, 3));
    wireSlider('gaA3', () => ST.a.z, v => { ST.a = v3(ST.a.x, ST.a.y, v); }, v => fmtNum(+v, 3));
    wireSlider('gaRR', () => ST.rr, v => { ST.rr = v; }, v => fmtNum(+v, 3));
    ctWireChk('gaS3', v => { ST.show.sum = v; });
    ctWireChk('gaB3', v => { ST.show.box = v; });
    ctWireChk('gaSph', v => { ST.show.sphere = v; });
  },
  frame(st, dt, ctx, W, H){
    const L = 3;
    em3dBegin(L); em3dAxes(L);
    const a = st.a, b = st.b;
    if(st.show.box){
      /* the three components as a box: |a| is the diagonal, twice Pythagoras */
      const c = rgbCss(TH.grad, 0.5);
      R.line(v3(0,0,0), v3(a.x,0,0), c, 1.2, 0.7);
      R.line(v3(a.x,0,0), v3(a.x,a.y,0), c, 1.2, 0.7);
      R.line(v3(a.x,a.y,0), a, c, 1.2, 0.7);
      R.line(v3(0,0,0), v3(a.x,a.y,0), rgbCss(TH.faint), 1, 0.6);
      R.label(v3(a.x/2, a.y/2, 0), '√(a₁²+a₂²)', rgbCss(TH.faint), 0, 12, '10px ' + FONT_MONO);
    }
    if(st.show.sum){
      const s = vadd(a, b);
      R.line(a, s, rgbCss(TH.faint), 1.1, 0.6);
      R.line(b, s, rgbCss(TH.faint), 1.1, 0.6);
      R.arrow(v3(0,0,0), s, rgbCss(TH.curl), 2.4, 0.95);
      R.label(s, 'a + b', rgbCss(TH.curl), 0, -12, '600 11px ' + FONT_UI);
    }
    if(st.show.sphere) em3dSphere(v3(0,0,0), st.rr, rgbCss(TH.warn, 0.55), 0.55);
    R.arrow(v3(0,0,0), a, rgbCss(TH.grad), 2.8, 1);
    R.arrow(v3(0,0,0), b, rgbCss(TH.pos), 2.8, 1);
    R.label(a, 'a', rgbCss(TH.grad), 0, -12, '700 12px ' + FONT_UI);
    R.label(b, 'b', rgbCss(TH.pos), 0, -12, '700 12px ' + FONT_UI);
    R.dot(a, 5, rgbCss(TH.grad), rgbCss(TH.bg));
    R.dot(b, 5, rgbCss(TH.pos), rgbCss(TH.bg));
    R.flush();
    em3dCaption(ctx, W, H, 'Vectors in ℝ³ — the standard basis is ⟨1,0,0⟩, ⟨0,1,0⟩, ⟨0,0,1⟩',
      'drag to orbit · scroll to zoom');
  },
  readout(st){
    const a = st.a, b = st.b, la = vlen(a);
    const dc = gaDirCos(a);
    return `<div class="card tight"><div class="ttl">a, component by component</div>
      ${kv('a', ctVec3f(a))}
      ${kv('a in basis form', `${fmtNum(a.x,3)} î + ${fmtNum(a.y,3)} ĵ + ${fmtNum(a.z,3)} k̂`)}
      ${kv('|a| = √(a₁²+a₂²+a₃²)', fmtNum(la, 5))}
      ${kv('â', ctVec3f(vnorm(a)))}
      ${kv('and |â|', fmtNum(vlen(vnorm(a)), 6))}
    </div>
    <div class="card tight"><div class="ttl">Direction cosines</div>
      ${kv('α  (from x̂)', ctDeg(dc.ax))}${kv('β  (from ŷ)', ctDeg(dc.ay))}${kv('γ  (from ẑ)', ctDeg(dc.az))}
      ${kv('cos²α + cos²β + cos²γ', fmtNum(dc.cx*dc.cx + dc.cy*dc.cy + dc.cz*dc.cz, 8))}
      <p class="help">Those three cosines <i>are</i> the components of â, so their squares must add to one.
      That identity is the three-dimensional Pythagoras, and it is why a direction in space costs two
      numbers rather than three.</p>
    </div>
    <div class="card tight"><div class="ttl">Distance, and the sphere</div>
      ${kv('|a − b|', fmtNum(vlen(vsub(a, b)), 5))}
      ${kv('sphere radius r', fmtNum(st.rr, 4))}
      ${kv('is a on the sphere?', Math.abs(la - st.rr) < 0.03 ? 'yes — |a| = r' : (la < st.rr ? 'inside' : 'outside'))}
      ${kv('|a|² − r²', fmtNum(la * la - st.rr * st.rr, 4))}
      <p class="help">x² + y² + z² = r² says nothing more than "this point is r from the origin". Move a
      slider until the readout above reaches zero and the arrowhead lands on the drawn surface.</p>
    </div>`;
  },
  chip(st){ return `<div class="k">Vectors in space</div>
    <div style="color:var(--c-grad)">|a| = ${fmtNum(vlen(st.a), 4)}</div>`; },
  legend(){ return [['var(--c-grad)', 'a'], ['var(--c-pos)', 'b'], ['var(--c-curl)', 'a + b'],
                    ['var(--c-warn)', 'the sphere |r| = r']]; }
};

/* ---- 3 · the dot product --------------------------------------------------- */
STAGES.gaDot = {
  title:'The dot product',
  derive(st){
    const n = v => fmtNum(v, 6);
    const d = st.a.x * st.b.x + st.a.y * st.b.y;
    const la = Math.hypot(st.a.x, st.a.y), lb = Math.hypot(st.b.x, st.b.y);
    return {
      title:'Two definitions that look unrelated, and the proof they are the same',
      steps:[
        drvStep('the algebraic definition',
          `${dv('a')} ${dop('·')} ${dv('b')} ${dop('=')} ${dv('a')}ₓ${dv('b')}ₓ ${dop('+')} ${dv('a')}_y${dv('b')}_y`,
          `= ${n(d)}`),
        drvStep('the geometric one',
          `${dv('a')} ${dop('·')} ${dv('b')} ${dop('=')} |${dv('a')}||${dv('b')}| cos θ`,
          `${n(la)} × ${n(lb)} × cos ${n(Math.acos(Math.max(-1, Math.min(1, d / (la * lb)))))} = ${n(d)}`),
        drvSay('nothing about those two suggests they should agree',
          'One is a sum of products of coordinates and mentions no angle. The other is built from lengths and an angle and mentions no coordinates. That they are the same number needs proof, and the proof is the law of cosines.'),
        drvStep('apply the law of cosines to the triangle of a, b and b − a',
          `|${dv('b')}{−}${dv('a')}|² ${dop('=')} |${dv('a')}|² ${dop('+')} |${dv('b')}|² ${dop('−')} 2|${dv('a')}||${dv('b')}|cos θ`,
          'the trigonometry wing\'s result, used here as the bridge'),
        drvStep('expand the left side in coordinates',
          `|${dv('b')}{−}${dv('a')}|² ${dop('=')} |${dv('a')}|² ${dop('+')} |${dv('b')}|² ${dop('−')} 2(${dv('a')}ₓ${dv('b')}ₓ ${dop('+')} ${dv('a')}_y${dv('b')}_y)`,
          'multiply out and collect'),
        drvSay('and comparing the two lines finishes it',
          'Both expressions have |a|² + |b|² in them, so those cancel. What is left is that the coordinate sum equals |a||b|cos θ. The two definitions are one, and the proof is two expansions and a subtraction.'),
        drvStep('so perpendicularity becomes an arithmetic test',
          `${dv('a')} ${dop('·')} ${dv('b')} ${dop('=')} 0 ${dop('⇔')} perpendicular`,
          Math.abs(d) < 1e-9 ? 'these two are perpendicular' : 'these two are not perpendicular'),
        drvSay('which is the single most useful consequence',
          'Checking a right angle no longer needs a protractor or any trigonometry — multiply and add. Orthogonality of functions, of basis vectors and of residuals in least squares are all this same test, with the sum replaced by an integral where appropriate.'),
        drvStep('and projection follows immediately',
          `proj ${dop('=')} ${dfrac(dv('a') + ' · ' + dv('b'), '|' + dv('b') + '|²')}${dv('b')}`,
          st.mode === 'proj' ? 'the panel draws this component and the perpendicular remainder' : ''),
        drvSay('the sign carries information too',
          'A negative dot product means an obtuse angle — the vectors oppose each other. That is why work done against a force is negative, and why a dot product is the natural way to ask "how much of this is going that way".')
      ],
      note:'The panel computes the dot product both ways at once and prints them together. Drag the arrows to any configuration and the two numbers stay equal, which is the law-of-cosines argument being tested continuously.'
    };
  },
  drag:true,
  enter(st, o){
    st.a = { x:2.6, y:0.4 };
    st.b = { x:1.3, y:1.9 };
    st.mode = o.mode || 'proj';
    st.grab = null;
  },
  controls(){
    const st = ST;
    return ctSeg('gaDotMode', st.mode, [['proj', 'projection'], ['work', 'work = F·d'], ['rose', 'a·b as b turns']]) +
      `<p class="help">${st.mode === 'work'
        ? 'A constant force <b>F</b> moving something along a displacement <b>d</b> does work <b>F·d</b> — and only the component of F along d counts. Push perpendicular to the motion and you do no work at all, however hard you push, which is why a satellite in a circular orbit needs no engine.'
        : st.mode === 'rose'
        ? 'The polar curve is <b>a·b</b> plotted in the direction of <b>b</b> as b sweeps a full turn at fixed length. It is |a||b|cos θ, so it is two tangent circles — positive ahead, negative behind, and exactly zero on the two perpendicular directions drawn as faint lines.'
        : 'The thin drop line is the entire content of the dot product: <b>comp<sub>b</sub> a = a·b/|b|</b> is the length of the shadow a casts on b, and <b>proj<sub>b</sub> a</b> is that shadow drawn as a vector. What is left over is orthogonal to b — the readout checks it.'}</p>
      <p class="help"><b>Drag either arrowhead.</b> Two definitions are on screen at once:
      <b>a·b = a₁b₁ + a₂b₂</b> from the components, and <b>a·b = |a||b|cos θ</b> from the geometry. The
      readout prints both. They are the same number because the law of cosines says so.</p>`;
  },
  wire(){ ctWireSeg('gaDotMode', v => { ST.mode = v; }); },
  pick(st, sx, sy, phase){
    const P = st.P; if(!P) return;
    const x = P.invX(sx), y = P.invY(sy);
    if(phase === 'down' || phase === 'click')
      st.grab = Math.hypot(x - st.a.x, y - st.a.y) < Math.hypot(x - st.b.x, y - st.b.y) ? 'a' : 'b';
    if(phase === 'up'){ st.grab = null; return; }
    if(st.grab) st[st.grab] = { x, y };
  },
  frame(st, dt, ctx, W, H){
    const P = ctBox(W, H, 0.3, 0.3, 3.4);
    st.P = P;
    ctGrid(ctx, P, 1);
    const a = st.a, b = st.b;
    const A = v3(a.x, a.y, 0), B = v3(b.x, b.y, 0);
    const th = gaAngle(A, B);
    ctFrame(ctx, P, st.mode === 'work' ? 'Work is the dot product of force with displacement'
                  : st.mode === 'rose' ? 'a·b in every direction b could point'
                  : 'The dot product is a projection');
    if(st.mode === 'rose'){
      const la = Math.hypot(a.x, a.y), lb = Math.hypot(b.x, b.y);
      const rose = t => {
        const v = la * lb * Math.cos(t - Math.atan2(a.y, a.x));
        return { x:v * Math.cos(t) * 0.32, y:v * Math.sin(t) * 0.32 };
      };
      ctParam(ctx, P, rose, 0, 2 * Math.PI, 300, rgbCss(TH.curl, 0.9), 2);
      const pa = Math.atan2(a.y, a.x);
      for(const s of [1, -1]){
        const d = { x:Math.cos(pa + s * Math.PI / 2), y:Math.sin(pa + s * Math.PI / 2) };
        ctPath(ctx, P, [{ x:-3.4 * d.x, y:-3.4 * d.y }, { x:3.4 * d.x, y:3.4 * d.y }],
               rgbCss(TH.faint, 0.5), 1, [5, 5]);
      }
    }
    if(st.mode !== 'rose'){
      const pr = gaVectorProj(A, B);
      ctArrow(ctx, P, 0, 0, pr.x, pr.y, rgbCss(TH.warn), 5.5, null);
      ctPath(ctx, P, [a, { x:pr.x, y:pr.y }], rgbCss(TH.faint), 1.3, [4, 4]);
      /* the right-angle tick that makes "orthogonal projection" literal */
      const u = vnorm(B), n = v3(-u.y, u.x, 0), s = 0.16;
      const c0 = { x:pr.x, y:pr.y };
      ctPath(ctx, P, [{ x:c0.x + (n.x - u.x) * s, y:c0.y + (n.y - u.y) * s },
                      { x:c0.x + n.x * s, y:c0.y + n.y * s },
                      { x:c0.x + (n.x + 0) * s - u.x * 0, y:c0.y + n.y * s }],
             rgbCss(TH.faint), 1, null);
    }
    if(st.mode === 'work'){
      ctArrow(ctx, P, 0, 0, b.x, b.y, rgbCss(TH.pos), 3, 'd');
      ctArrow(ctx, P, 0, 0, a.x, a.y, rgbCss(TH.grad), 3, 'F');
    } else {
      ctArrow(ctx, P, 0, 0, a.x, a.y, rgbCss(TH.grad), 3, 'a');
      ctArrow(ctx, P, 0, 0, b.x, b.y, rgbCss(TH.pos), 3, 'b');
    }
    /* the angle arc */
    const a0 = Math.atan2(a.y, a.x), b0 = Math.atan2(b.y, b.x);
    ctArcAngle(ctx, P, 0, 0, 40, a0, b0, rgbCss(TH.text, 0.6), 1.4);
    ctText(ctx, P.X(0) + 48 * Math.cos(-(a0 + b0) / 2), P.Y(0) + 48 * Math.sin(-(a0 + b0) / 2) * 1,
           ctDeg(th), rgbCss(TH.text), '600 11px ' + FONT_MONO, 'center', 'middle');
    ctDot(ctx, P, a.x, a.y, 5, rgbCss(TH.grad), rgbCss(TH.bg));
    ctDot(ctx, P, b.x, b.y, 5, rgbCss(TH.pos), rgbCss(TH.bg));
    stageNote(ctx, 'a·b = a₁b₁ + a₂b₂ = |a||b| cos θ · zero exactly when they are perpendicular', W, H);
  },
  readout(st){
    const A = v3(st.a.x, st.a.y, 0), B = v3(st.b.x, st.b.y, 0);
    const comp = A.x * B.x + A.y * B.y;
    const th = gaAngle(A, B);
    const geo = vlen(A) * vlen(B) * Math.cos(th);
    const pr = gaVectorProj(A, B), rest = gaOrthoComp(A, B);
    return `<div class="card tight"><div class="ttl">Two definitions, one number</div>
      ${kv('a₁b₁ + a₂b₂', fmtNum(comp, 6))}
      ${kv('|a||b| cos θ', fmtNum(geo, 6))}
      ${kv('difference', fmtAgree(comp, geo))}
      ${kv('θ', ctDeg(th))}
      ${kv('sign', comp > 1e-9 ? 'positive — the angle is acute' : comp < -1e-9 ? 'negative — obtuse' : 'zero — perpendicular')}
    </div>
    <div class="card tight"><div class="ttl">Projection</div>
      ${kv('comp<sub>b</sub> a = a·b / |b|', fmtNum(gaScalarProj(A, B), 5))}
      ${kv('proj<sub>b</sub> a', ctVec2(pr))}
      ${kv('a − proj<sub>b</sub> a', ctVec2(rest))}
      ${kv('(a − proj<sub>b</sub> a) · b', fmtNum(vdot(rest, B), 3))}
      <p class="help">That last row is zero by construction: splitting a into a piece along b and a piece
      across it is exactly what a projection does, and the leftover is orthogonal whether you asked for it
      or not. Every least-squares fit, every Fourier coefficient and every quantum amplitude is this
      operation in a bigger space.</p>
    </div>
    <div class="card tight"><div class="ttl">${'Work'}</div>
      ${kv('W = F·d', fmtNum(comp, 5) + ' J')}
      ${kv('|F| cos θ  (the useful part)', fmtNum(vlen(A) * Math.cos(th), 5) + ' N')}
      ${kv('|d|', fmtNum(vlen(B), 5) + ' m')}
      <p class="help">Turn F until the readout reads zero and you have a force that does no work — the
      normal force on a sliding block, the tension in a pendulum string, the magnetic force on a moving
      charge. None of them can change a kinetic energy.</p>
    </div>`;
  },
  chip(st){
    const A = v3(st.a.x, st.a.y, 0), B = v3(st.b.x, st.b.y, 0);
    return `<div class="k">a · b</div><div style="color:var(--c-warn)">${fmtNum(vdot(A, B), 4)}</div>
      <div>θ = ${ctDeg(gaAngle(A, B))}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'a  (or the force F)'], ['var(--c-pos)', 'b  (or the displacement d)'],
                    ['var(--c-warn)', 'proj<sub>b</sub> a — the shadow'], ['var(--c-curl)', 'a·b in every direction']]; }
};

/* ---- 4 · the cross product ------------------------------------------------- */
STAGES.gaCross = {
  title:'The cross product',
  derive(st){
    return {
      title:'A product that returns a vector, and why it only works in three dimensions',
      steps:[
        drvSay('the specification, before the formula',
          'We want a product of two vectors that is perpendicular to both, whose length is the area of the parallelogram they span, and which vanishes when they are parallel. Those three demands turn out to determine the answer almost completely.'),
        drvStep('the determinant form',
          `${dv('a')} ${dop('×')} ${dv('b')} ${dop('=')} det[ ${dv('i')} ${dv('j')} ${dv('k')} ; ${dv('a')}ₓ ${dv('a')}_y ${dv('a')}_z ; ${dv('b')}ₓ ${dv('b')}_y ${dv('b')}_z ]`,
          'the panel computes the components and verifies each property numerically'),
        drvSay('the determinant is not a mnemonic here',
          'A determinant is antisymmetric — swap two rows and it changes sign — and it vanishes when two rows are equal. Those are exactly the properties demanded of the cross product: a × b = −b × a, and a × a = 0. The determinant is the natural home for this operation, not a trick for remembering it.'),
        drvStep('its length is the area of the parallelogram',
          `|${dv('a')} ${dop('×')} ${dv('b')}| ${dop('=')} |${dv('a')}||${dv('b')}| sin θ`,
          st.mode === 'area' ? 'the panel shades that parallelogram and prints both its measured and computed area' : ''),
        drvSay('sine where the dot product had cosine, and that is the division of labour',
          'The dot product keeps the parallel part and the cross product keeps the perpendicular part. Together they capture everything about the relationship between two vectors, which is why |a·b|² + |a×b|² = |a|²|b|².'),
        drvStep('perpendicular to both, by construction',
          `${dv('a')} ${dop('·')} (${dv('a')} ${dop('×')} ${dv('b')}) ${dop('=')} 0`,
          'the panel evaluates both dot products and they vanish to machine precision'),
        drvSay('the right-hand rule is a genuine choice',
          'Nothing in the geometry decides which of the two perpendicular directions to take — the convention does. That is why the cross product is properly a pseudovector: reflect the whole configuration in a mirror and it points the wrong way. Angular momentum and magnetic field inherit that oddity, and it is why a mirror image of a spinning top is confusing.'),
        drvStep('the triple product gives volume',
          `${dv('a')} ${dop('·')} (${dv('b')} ${dop('×')} ${dv('c')}) ${dop('=')} det[${dv('a')}; ${dv('b')}; ${dv('c')}]`,
          st.mode !== 'area' ? 'the panel draws the parallelepiped and prints its signed volume' : ''),
        drvSay('and this is where three dimensions become special',
          'In n dimensions the space perpendicular to two given vectors has dimension n − 2. Only when n = 3 is that a single line, so only then does "the" perpendicular direction exist. In four dimensions the demand has no unique answer, which is why the cross product does not generalise while the wedge product of the forms wing does.')
      ],
      note:'Every claimed property is checked numerically as the vectors are dragged: both dot products with the result, the area against a direct measurement, and the triple product against the determinant. None of them is asserted.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.a = v3(2.2, 0.4, 0); st.b = v3(0.7, 2.0, 0.5); st.c = v3(0.3, 0.4, 2.1);
    st.mode = o.mode || 'area';
    R.cam.az = 0.7; R.cam.el = 0.36; ctCamFit(3);
  },
  controls(){
    const st = ST;
    return ctSeg('gaCrMode', st.mode, [['area', 'area'], ['torque', 'torque r × F'], ['triple', 'triple product']]) +
      ctlRow('b₁', ctlSlider('gaCb1', -3, 3, 0.05, st.b.x)) +
      ctlRow('b₂', ctlSlider('gaCb2', -3, 3, 0.05, st.b.y)) +
      ctlRow('b₃', ctlSlider('gaCb3', -3, 3, 0.05, st.b.z)) +
      (st.mode === 'triple' ? ctlRow('c₃', ctlSlider('gaCc3', -3, 3, 0.05, st.c.z)) : '') +
      `<p class="help">${st.mode === 'triple'
        ? 'The scalar triple product <b>a·(b×c)</b> is the signed volume of the box the three vectors span, and it is the sharpest test for coplanarity there is: slide c₃ to zero and watch the volume vanish the instant the three vectors lie in one plane.'
        : st.mode === 'torque'
        ? 'Torque is <b>τ = r × F</b>. Only the part of the force perpendicular to the lever arm turns anything — push along the spanner and nothing happens. The magnitude |r||F| sin θ is why a longer spanner is easier, and the direction is the axis the bolt turns about.'
        : 'The shaded parallelogram has area <b>|a × b| = |a||b| sin θ</b>, and the cross product is the vector perpendicular to it with that length. Slide b until the two are parallel and both the area and the product collapse to zero — the exact opposite of when the dot product vanishes.'}</p>
      <p class="help">The right-hand rule is not a convention that could have gone the other way without
      consequence: it is the choice that makes <b>î × ĵ = k̂</b>, and every sign in electromagnetism
      follows from it. Orbit the scene and check that a, b, a×b form a right-handed set from any angle.</p>`;
  },
  wire(){
    ctWireSeg('gaCrMode', v => { ST.mode = v; });
    wireSlider('gaCb1', () => ST.b.x, v => { ST.b = v3(v, ST.b.y, ST.b.z); }, v => fmtNum(+v, 3));
    wireSlider('gaCb2', () => ST.b.y, v => { ST.b = v3(ST.b.x, v, ST.b.z); }, v => fmtNum(+v, 3));
    wireSlider('gaCb3', () => ST.b.z, v => { ST.b = v3(ST.b.x, ST.b.y, v); }, v => fmtNum(+v, 3));
    wireSlider('gaCc3', () => ST.c.z, v => { ST.c = v3(ST.c.x, ST.c.y, v); }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    const L = 3;
    em3dBegin(L); em3dAxes(L);
    const a = st.a, b = st.b, x = vcross(a, b);
    const O = v3(0,0,0);
    /* the parallelogram whose area the product measures */
    R.poly([O, a, vadd(a, b), b], rgbCss(TH.grad, 0.16), rgbCss(TH.grad, 0.55), 1.3, 0.7);
    if(st.mode === 'triple'){
      const c = st.c;
      const corners = [O, a, vadd(a, b), b];
      for(const p of corners) R.line(p, vadd(p, c), rgbCss(TH.warn, 0.6), 1.2, 0.65);
      R.poly(corners.map(p => vadd(p, c)), rgbCss(TH.warn, 0.12), rgbCss(TH.warn, 0.5), 1.2, 0.6);
      R.arrow(O, c, rgbCss(TH.warn), 2.6, 1);
      R.label(c, 'c', rgbCss(TH.warn), 0, -12, '700 12px ' + FONT_UI);
    }
    R.arrow(O, a, rgbCss(TH.grad), 2.8, 1);
    R.arrow(O, b, rgbCss(TH.pos), 2.8, 1);
    R.label(a, st.mode === 'torque' ? 'r' : 'a', rgbCss(TH.grad), 0, -12, '700 12px ' + FONT_UI);
    R.label(b, st.mode === 'torque' ? 'F' : 'b', rgbCss(TH.pos), 0, -12, '700 12px ' + FONT_UI);
    if(st.mode !== 'triple'){
      const s = vlen(x) > 4 ? 4 / vlen(x) : 1;
      R.arrow(O, vmul(x, s), rgbCss(TH.curl), 3, 1);
      R.label(vmul(x, s), st.mode === 'torque' ? 'τ = r × F' : 'a × b', rgbCss(TH.curl), 0, -12, '700 12px ' + FONT_UI);
      /* a small rotation ring around the product, so the handedness is visible */
      em3dRing(vmul(x, s * 0.55), 0.42, vnorm(x), rgbCss(TH.curl, 0.6), 1.6, 0.7);
    }
    R.flush();
    em3dCaption(ctx, W, H,
      st.mode === 'triple' ? 'a·(b×c) — the volume of the parallelepiped'
      : 'a × b is perpendicular to both, with length equal to the shaded area',
      'drag to orbit · scroll to zoom');
  },
  readout(st){
    const a = st.a, b = st.b, x = vcross(a, b);
    const th = gaAngle(a, b);
    const rows = [];
    rows.push(`<div class="card tight"><div class="ttl">a × b, from the determinant</div>
      ${kv('a', ctVec3f(a))}${kv('b', ctVec3f(b))}
      ${kv('a × b', ctVec3f(x))}
      ${kv('|a × b|', fmtNum(vlen(x), 5))}
      ${kv('|a||b| sin θ', fmtNum(vlen(a) * vlen(b) * Math.sin(th), 5))}
      ${kv('θ', ctDeg(th))}
      ${kv('(a×b)·a', fmtNum(vdot(x, a), 3))}
      ${kv('(a×b)·b', fmtNum(vdot(x, b), 3))}
      <p class="help">Those last two are zero to machine precision, which is the defining property: the
      product is perpendicular to everything that made it. The formula is the 3×3 determinant with î, ĵ, k̂
      in the top row — a mnemonic that works because expanding along that row is exactly the pattern of
      cross terms the definition demands.</p>
    </div>`);
    rows.push(`<div class="card tight"><div class="ttl">Area, and what vanishes when</div>
      ${kv('parallelogram area', fmtNum(vlen(x), 5))}
      ${kv('triangle area (half)', fmtNum(vlen(x) / 2, 5))}
      ${kv('a·b', fmtNum(vdot(a, b), 5))}
      ${kv('|a×b|² + (a·b)²', fmtNum(vdot(x, x) + Math.pow(vdot(a, b), 2), 5))}
      ${kv('|a|²|b|²', fmtNum(vdot(a, a) * vdot(b, b), 5))}
      <p class="help">The last two rows agree — Lagrange's identity, which is sin²θ + cos²θ = 1 with the
      lengths put back in. The two products are complementary: the dot product dies for perpendicular
      vectors, the cross product dies for parallel ones, and between them they capture the whole of the
      angle.</p>
    </div>`);
    if(st.mode === 'triple'){
      const c = st.c, tp = gaTriple(a, b, c);
      rows.push(`<div class="card tight"><div class="ttl">The scalar triple product</div>
        ${kv('c', ctVec3f(c))}
        ${kv('a·(b×c)', fmtNum(tp, 5))}
        ${kv('|a·(b×c)| = volume', fmtNum(Math.abs(tp), 5))}
        ${kv('b·(c×a)', fmtNum(gaTriple(b, c, a), 5))}
        ${kv('coplanar?', Math.abs(tp) < 1e-6 ? 'yes — the volume is zero' : 'no')}
        <p class="help">Cycling the three vectors leaves the answer alone; swapping any two flips its sign.
        That is the determinant of the 3×3 matrix whose rows they are, and it is the reason the sign of a
        Jacobian tells you whether a transformation preserves orientation.</p>
      </div>`);
    }
    if(st.mode === 'torque'){
      rows.push(`<div class="card tight"><div class="ttl">Torque</div>
        ${kv('|τ| = |r||F| sin θ', fmtNum(vlen(x), 5) + ' N·m')}
        ${kv('perpendicular lever arm', fmtNum(vlen(a) * Math.sin(th), 5) + ' m')}
        ${kv('useful force |F| sin θ', fmtNum(vlen(b) * Math.sin(th), 5) + ' N')}
        <p class="help">Two readings of the same product: a long arm with a small perpendicular force, or a
        short arm with a large one. Turn F parallel to r and the torque vanishes however hard you pull.</p>
      </div>`);
    }
    return rows.join('');
  },
  chip(st){
    const x = vcross(st.a, st.b);
    return `<div class="k">|a × b|</div><div style="color:var(--c-curl)">${fmtNum(vlen(x), 4)}</div>
      <div>θ = ${ctDeg(gaAngle(st.a, st.b))}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'a  (or the lever arm r)'], ['var(--c-pos)', 'b  (or the force F)'],
                    ['var(--c-curl)', 'a × b'], ['var(--c-warn)', 'c, for the triple product']]; }
};

/* ---- 5 · lines and planes in space ---------------------------------------- */
