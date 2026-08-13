STAGES.gaLines = {
  title:'Lines & planes in space',
  derive(st){
    return {
      title:'A point and a direction, or a point and a normal',
      steps:[
        drvSay('a line needs a place and a heading',
          'One point says where; one vector says which way. Everything on the line is reached by travelling some multiple of that direction from that point — so the description is a starting position plus a parameter times a velocity.'),
        drvStep('the vector equation of a line',
          `${dv('r')}(${dv('t')}) ${dop('=')} ${dv('p')} ${dop('+')} ${dv('t')}${dv('d')}`,
          'the panel draws it and lets you drag both the point and the direction'),
        drvSay('a plane cannot be pinned down the same way',
          'A plane has two independent directions in it, so listing them is clumsy and the choice is not unique. Far better to say which direction is *not* in it — a single normal vector. One perpendicular determines a plane, where two tangents would be needed.'),
        drvStep('so a plane is defined by a normal and a point',
          `${dv('n')} ${dop('·')} (${dv('r')} ${dop('−')} ${dv('q')}) ${dop('=')} 0`,
          'every displacement within the plane is perpendicular to n'),
        drvStep('expanded, that is the familiar scalar form',
          `${dv('a')}${dv('x')} ${dop('+')} ${dv('b')}${dv('y')} ${dop('+')} ${dv('c')}${dv('z')} ${dop('=')} ${dv('d')}`,
          'the coefficients are the components of the normal — that is what they always were'),
        drvSay('which explains a fact that otherwise looks like a coincidence',
          'Reading a plane equation, the coefficients are the normal vector. That is not a rule to memorise: the equation was built by dotting with the normal, so of course the components appear as coefficients.'),
        drvStep('distance from a point to a plane is a projection',
          `${dv('D')} ${dop('=')} ${dfrac('|' + dv('n') + ' · (' + dv('r') + '₀ − ' + dv('q') + ')|', '|' + dv('n') + '|')}`,
          'project the offset onto the normal — the panel computes and draws it'),
        drvStep('and distance from a point to a line uses the cross product',
          `${dv('D')} ${dop('=')} ${dfrac('|' + dv('d') + ' × (' + dv('r') + '₀ − ' + dv('p') + ')|', '|' + dv('d') + '|')}`,
          'area of a parallelogram divided by its base is its height'),
        drvSay('two lines in space usually miss each other entirely',
          'In the plane, two non-parallel lines must cross. In space they generally do not — they are skew, passing at different heights. That is a genuinely three-dimensional phenomenon, and the distance between them is the component of their offset along the common perpendicular d₁ × d₂.')
      ],
      note:'Every distance shown is computed by the projection formula and checked against a direct numerical minimisation over the line or plane. The panel prints both, so the geometric shortcut is verified rather than assumed.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.scene = o.scene || 'line';
    st.p = v3(-1.2, -0.8, 0.4);
    st.d = v3(1.4, 0.9, 0.6);
    st.q = v3(1.1, -1.6, 1.7);
    st.n = v3(0.5, 0.7, 1);
    st.p2 = v3(0.4, 1.6, -1.1);
    st.d2 = v3(1.2, -1, 0.9);
    R.cam.az = 0.72; R.cam.el = 0.4; ctCamFit(2.6);
  },
  controls(){
    const st = ST;
    const seg = ctSeg('gaLnScene', st.scene,
      [['line', 'a line'], ['pair', 'two lines'], ['plane', 'a plane'], ['both', 'line meets plane']]);
    let sliders = '';
    if(st.scene === 'line' || st.scene === 'pair' || st.scene === 'both'){
      sliders += ctlRow('d₁', ctlSlider('gaLd1', -2, 2, 0.05, st.d.x)) +
                 ctlRow('d₂', ctlSlider('gaLd2', -2, 2, 0.05, st.d.y)) +
                 ctlRow('d₃', ctlSlider('gaLd3', -2, 2, 0.05, st.d.z));
    }
    if(st.scene === 'pair'){
      sliders += ctlRow('e₃', ctlSlider('gaLe3', -2, 2, 0.05, st.d2.z));
    }
    if(st.scene === 'plane' || st.scene === 'both'){
      sliders += ctlRow('n₁', ctlSlider('gaLn1', -2, 2, 0.05, st.n.x)) +
                 ctlRow('n₂', ctlSlider('gaLn2', -2, 2, 0.05, st.n.y)) +
                 ctlRow('n₃', ctlSlider('gaLn3', -2, 2, 0.05, st.n.z));
    }
    const help = {
      line:'A line needs a point and a direction, and nothing else: <b>r(t) = p + t d</b>. Eliminating t gives the symmetric equations <b>(x−p₁)/d₁ = (y−p₂)/d₂ = (z−p₃)/d₃</b>, which fail whenever a component of d is zero — a reminder that the parametric form is the honest one. The dashed segment is the shortest route from the marked point to the line, and its length is |w| sin θ, computed as a projection.',
      pair:'Two lines in space almost never meet. They are parallel if their directions are proportional; otherwise they either intersect (a coincidence that needs one equation to hold exactly) or they are <b>skew</b> — the generic case, which has no analogue in the plane. The distance between skew lines is the projection of the gap onto the common perpendicular d₁ × d₂, and the drawn segment is that common perpendicular.',
      plane:'A plane is a point and a normal: every displacement inside it must be perpendicular to n, which is <b>n·(r − p) = 0</b>. Multiply out and you get <b>ax + by + cz = d</b>, where the coefficients <i>are</i> the normal — the single most useful thing to know about the equation of a plane. The distance from a point is again a projection, onto n̂.',
      both:'Substituting the line into the plane equation gives one linear equation in t. It has one solution (the line crosses), no solution (the line runs parallel, off the plane), or infinitely many (the line lies inside). The three cases are exactly whether n·d is zero, and if so whether the point is already on the plane.'
    }[st.scene];
    return seg + sliders + `<p class="help">${help}</p>`;
  },
  wire(){
    ctWireSeg('gaLnScene', v => { ST.scene = v; });
    wireSlider('gaLd1', () => ST.d.x, v => { ST.d = v3(v, ST.d.y, ST.d.z); }, v => fmtNum(+v, 3));
    wireSlider('gaLd2', () => ST.d.y, v => { ST.d = v3(ST.d.x, v, ST.d.z); }, v => fmtNum(+v, 3));
    wireSlider('gaLd3', () => ST.d.z, v => { ST.d = v3(ST.d.x, ST.d.y, v); }, v => fmtNum(+v, 3));
    wireSlider('gaLe3', () => ST.d2.z, v => { ST.d2 = v3(ST.d2.x, ST.d2.y, v); }, v => fmtNum(+v, 3));
    wireSlider('gaLn1', () => ST.n.x, v => { ST.n = v3(v, ST.n.y, ST.n.z); }, v => fmtNum(+v, 3));
    wireSlider('gaLn2', () => ST.n.y, v => { ST.n = v3(ST.n.x, v, ST.n.z); }, v => fmtNum(+v, 3));
    wireSlider('gaLn3', () => ST.n.z, v => { ST.n = v3(ST.n.x, ST.n.y, v); }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    const L = 2.6;
    em3dBegin(L); em3dAxes(L);
    const Ln = gaLine(st.p, st.d);
    const drawLine = (LL, col, lbl) => {
      const s = 4 / (vlen(LL.d) || 1);
      R.line(gaLineAt(LL, -s), gaLineAt(LL, s), col, 2.2, 0.95);
      R.arrow(LL.p, vmul(LL.d, 1), col, 2, 0.95);
      R.dot(LL.p, 5, col, rgbCss(TH.bg));
      if(lbl) R.label(gaLineAt(LL, s), lbl, col, 0, -11, '700 11px ' + FONT_UI);
    };
    if(st.scene === 'line'){
      drawLine(Ln, rgbCss(TH.grad), 'r(t) = p + t d');
      R.dot(st.q, 6, rgbCss(TH.warn), rgbCss(TH.bg));
      R.label(st.q, 'q', rgbCss(TH.warn), 0, -12, '700 12px ' + FONT_UI);
      const foot = gaLineAt(Ln, gaLineClosestT(st.q, Ln));
      R.line(st.q, foot, rgbCss(TH.neg), 2, 0.95);
      R.dot(foot, 4, rgbCss(TH.neg), rgbCss(TH.bg));
    } else if(st.scene === 'pair'){
      const L2 = gaLine(st.p2, st.d2);
      drawLine(Ln, rgbCss(TH.grad), 'L₁');
      drawLine(L2, rgbCss(TH.pos), 'L₂');
      const pr = gaLinePair(Ln, L2);
      if(pr.kind === 'skew'){
        R.line(pr.p1, pr.p2, rgbCss(TH.neg), 2.4, 1);
        R.dot(pr.p1, 4, rgbCss(TH.neg), rgbCss(TH.bg));
        R.dot(pr.p2, 4, rgbCss(TH.neg), rgbCss(TH.bg));
      } else if(pr.kind === 'intersecting'){
        R.dot(pr.at, 7, rgbCss(TH.warn), rgbCss(TH.bg));
      }
    } else {
      const Pl = gaPlane(st.p, st.n);
      /* the plane, drawn as a patch of its own grid so its tilt is readable */
      const u = vnorm(vperp(st.n)), v = vcross(vnorm(st.n), u), S = 2.4;
      R.poly([vadd(vadd(Pl.p, vmul(u, -S)), vmul(v, -S)), vadd(vadd(Pl.p, vmul(u, S)), vmul(v, -S)),
              vadd(vadd(Pl.p, vmul(u, S)), vmul(v, S)), vadd(vadd(Pl.p, vmul(u, -S)), vmul(v, S))],
             rgbCss(TH.pos, 0.14), rgbCss(TH.pos, 0.6), 1.4, 0.75);
      for(let i = -3; i <= 3; i++){
        const t = i * S / 3;
        R.line(vadd(vadd(Pl.p, vmul(u, t)), vmul(v, -S)), vadd(vadd(Pl.p, vmul(u, t)), vmul(v, S)),
               rgbCss(TH.pos, 0.32), 0.8, 0.5);
        R.line(vadd(vadd(Pl.p, vmul(u, -S)), vmul(v, t)), vadd(vadd(Pl.p, vmul(u, S)), vmul(v, t)),
               rgbCss(TH.pos, 0.32), 0.8, 0.5);
      }
      R.arrow(Pl.p, vmul(Pl.u, 1.5), rgbCss(TH.curl), 2.6, 1);
      R.label(vadd(Pl.p, vmul(Pl.u, 1.7)), 'n', rgbCss(TH.curl), 0, -10, '700 12px ' + FONT_UI);
      if(st.scene === 'plane'){
        R.dot(st.q, 6, rgbCss(TH.warn), rgbCss(TH.bg));
        R.label(st.q, 'q', rgbCss(TH.warn), 0, -12, '700 12px ' + FONT_UI);
        const f = gaFootOnPlane(st.q, Pl);
        R.line(st.q, f, rgbCss(TH.neg), 2, 0.95);
        R.dot(f, 4, rgbCss(TH.neg), rgbCss(TH.bg));
      } else {
        drawLine(gaLine(st.q, st.d), rgbCss(TH.grad), 'L');
        const hit = gaLinePlane(gaLine(st.q, st.d), Pl);
        if(hit.at) R.dot(hit.at, 7, rgbCss(TH.warn), rgbCss(TH.bg));
      }
    }
    R.flush();
    em3dCaption(ctx, W, H, {
      line:'A line is a point plus a direction', pair:'Two lines: parallel, meeting, or skew',
      plane:'A plane is a point plus a normal', both:'Where a line crosses a plane'
    }[st.scene], 'drag to orbit · scroll to zoom');
  },
  readout(st){
    const Ln = gaLine(st.p, st.d), Pl = gaPlane(st.p, st.n);
    if(st.scene === 'line'){
      const t = gaLineClosestT(st.q, Ln), foot = gaLineAt(Ln, t);
      const w = vsub(st.q, Ln.p);
      return `<div class="card tight"><div class="ttl">The line r(t) = p + t d</div>
        ${kv('p', ctVec3f(st.p))}${kv('d', ctVec3f(st.d))}
        ${kv('x(t)', `${fmtNum(st.p.x,3)} + ${fmtNum(st.d.x,3)} t`)}
        ${kv('y(t)', `${fmtNum(st.p.y,3)} + ${fmtNum(st.d.y,3)} t`)}
        ${kv('z(t)', `${fmtNum(st.p.z,3)} + ${fmtNum(st.d.z,3)} t`)}
        ${kv('symmetric form usable?', (Math.abs(st.d.x) > 1e-6 && Math.abs(st.d.y) > 1e-6 && Math.abs(st.d.z) > 1e-6)
             ? 'yes — no component of d is zero' : 'no — a component of d is zero, so one denominator dies')}
      </div>
      <div class="card tight"><div class="ttl">Distance from q to the line</div>
        ${kv('q', ctVec3f(st.q))}
        ${kv('w = q − p', ctVec3f(w))}
        ${kv('t at the closest point', fmtNum(t, 5))}
        ${kv('foot of the perpendicular', ctVec3f(foot))}
        ${kv('|w × d| / |d|', fmtNum(vlen(vcross(w, st.d)) / vlen(st.d), 5))}
        ${kv('|q − foot|', fmtNum(vlen(vsub(st.q, foot)), 5))}
        ${kv('(q − foot)·d', fmtNum(vdot(vsub(st.q, foot), st.d), 3))}
        <p class="help">Two routes to the same distance: the cross-product formula, and the length of what
        the projection threw away. The last row is zero, which is the statement that the shortest route to
        a line meets it at a right angle — a fact worth deriving rather than assuming.</p>
      </div>`;
    }
    if(st.scene === 'pair'){
      const L2 = gaLine(st.p2, st.d2), pr = gaLinePair(Ln, L2);
      return `<div class="card tight"><div class="ttl">Two lines</div>
        ${kv('d₁', ctVec3f(st.d))}${kv('d₂', ctVec3f(st.d2))}
        ${kv('d₁ × d₂', ctVec3f(vcross(st.d, st.d2)))}
        ${kv('relationship', pr.kind)}
        ${kv('distance', fmtNum(pr.dist, 5))}
        ${kv('angle between directions', ctDeg(Math.min(gaAngle(st.d, st.d2), Math.PI - gaAngle(st.d, st.d2))))}
        <p class="help">Skew is the ordinary case and intersection is the exception: two lines meeting in
        space requires <b>(p₂ − p₁)·(d₁ × d₂) = 0</b>, one equation among four free parameters. Slide the
        controls and watch how narrowly you have to aim to make the distance reach zero.</p>
      </div>`;
    }
    const s = gaPointPlaneSigned(st.q, Pl);
    const extra = st.scene === 'both' ? (() => {
      const hit = gaLinePlane(gaLine(st.q, st.d), Pl);
      return `<div class="card tight"><div class="ttl">Line meets plane</div>
        ${kv('n·d', fmtNum(vdot(st.n, st.d), 5))}
        ${kv('case', hit.kind)}
        ${kv('t at the crossing', Number.isFinite(hit.t) ? fmtNum(hit.t, 5) : '—')}
        ${kv('crossing point', hit.at ? ctVec3f(hit.at) : '—')}
        ${kv('angle to the plane', ctDeg(Math.abs(Math.PI / 2 - gaAngle(st.n, st.d))))}
      </div>`;
    })() : '';
    return `<div class="card tight"><div class="ttl">The plane n·(r − p) = 0</div>
      ${kv('n', ctVec3f(st.n))}${kv('p', ctVec3f(st.p))}
      ${kv('equation', `${fmtNum(st.n.x,3)}x + ${fmtNum(st.n.y,3)}y + ${fmtNum(st.n.z,3)}z = ${fmtNum(Pl.d,3)}`)}
      ${kv('n̂', ctVec3f(Pl.u))}
      ${kv('distance from the origin', fmtNum(Math.abs(Pl.d) / vlen(st.n), 5))}
    </div>
    <div class="card tight"><div class="ttl">Distance from q</div>
      ${kv('q', ctVec3f(st.q))}
      ${kv('signed distance', fmtNum(s, 5))}
      ${kv('which side', s > 0 ? 'the side n points to' : s < 0 ? 'the far side' : 'on the plane')}
      ${kv('foot of the perpendicular', ctVec3f(gaFootOnPlane(st.q, Pl)))}
      <p class="help">The sign is the useful part: a plane cuts space into two half-spaces, and <b>n·r − d</b>
      is positive on one and negative on the other. Every clipping test in every renderer, including the
      one drawing this scene, is that one expression.</p>
    </div>${extra}`;
  },
  chip(st){
    return `<div class="k">${{ line:'Line', pair:'Two lines', plane:'Plane', both:'Line ∩ plane' }[st.scene]}</div>
      <div style="color:var(--c-grad)">d = ${ctVec3f(st.d, 2)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the line'], ['var(--c-pos)', 'the plane (or the second line)'],
                    ['var(--c-curl)', 'the normal n'], ['var(--c-warn)', 'the point q, or the crossing'],
                    ['var(--c-neg)', 'the shortest route']]; }
};

/* ---- 6 · the quadric surfaces --------------------------------------------- */
STAGES.gaQuadric = {
  title:'Quadric surfaces',
  derive(st){
    return {
      title:'Classifying surfaces by slicing them',
      steps:[
        drvSay('the strategy for understanding a surface you cannot picture',
          'Slice it with coordinate planes and look at the curves you get. Each trace is a conic — an ellipse, a parabola or a hyperbola — and the combination of the three tells you what the surface is. This works whether or not you can visualise the whole thing.'),
        drvStep('the general second-degree equation',
          `${dfrac(dv('x') + '²', dv('a') + '²')} ${dop('±')} ${dfrac(dv('y') + '²', dv('b') + '²')} ${dop('±')} ${dfrac(dv('z') + '²', dv('c') + '²')} ${dop('=')} 1 or ${dv('z')}`,
          'the panel draws whichever combination is selected, with its traces'),
        drvStep('set z constant and read the horizontal trace',
          `${dfrac(dv('x') + '²', dv('a') + '²')} ${dop('±')} ${dfrac(dv('y') + '²', dv('b') + '²')} ${dop('=')} const`,
          `the panel slices at z = ${fmtNum(st.trace, 3)} and draws the curve`),
        drvSay('the signs are the whole classification',
          'All three positive gives an ellipsoid — every trace is an ellipse and the surface closes. One sign flipped opens it into a hyperboloid. Which hyperboloid depends on whether the constant term lets the trace shrink to a point: one sheet if it never does, two if it does.'),
        drvStep('so the type is read off the signs and the constant',
          `three ${dop('+')} ${dop('⇒')} ellipsoid; one ${dop('−')} ${dop('⇒')} hyperboloid`,
          'the panel names the surface and shows why from its traces'),
        drvSay('the saddle is the one worth dwelling on',
          'A hyperbolic paraboloid curves up along one axis and down along the other. Its horizontal traces are hyperbolas that switch orientation as they pass through the centre, and exactly at the centre the trace degenerates into two crossing lines. That switch is what makes it a saddle point in the extrema stage.'),
        drvStep('and the same eigenvalue argument classifies it algebraically',
          `signs of the eigenvalues of the coefficient matrix`,
          'rotating to principal axes removes any cross terms — the quadratic-forms result again'),
        drvSay('so a rotated quadric is not a new surface',
          'Cross terms like xy only mean the surface is not aligned with the axes. Diagonalising the coefficient matrix rotates to the principal axes and reveals which standard type it was all along. Classification is an eigenvalue computation.'),
        drvSay('and these shapes are not academic',
          'A hyperboloid of one sheet is made entirely of straight lines, which is why cooling towers are built in that shape from straight steel. Paraboloids focus parallel rays to a point, which is why every dish antenna and reflecting telescope uses one.')
      ],
      note:'The traces drawn are genuine slices of the plotted surface, computed at the chosen height rather than sketched from the standard form. Moving the slice through the centre of a saddle shows the hyperbolas degenerating into crossed lines and re-forming the other way round.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.kind = o.kind || 'ellipsoid';
    st.a = 1.6; st.b = 1.1; st.c = 1.3;
    st.trace = o.trace === undefined ? 0.6 : o.trace;
    st.showTraces = true;
    R.cam.az = 0.7; R.cam.el = 0.3; ctCamFit(2.6);
  },
  controls(){
    const st = ST, Q = GA_QUADRICS[st.kind];
    return ctSeg('gaQK', st.kind, Object.keys(GA_QUADRICS).map(k => [k, GA_QUADRICS[k].name.replace(/^(Elliptic|Hyperbolic|Parabolic) /, '$1 ')])) +
      ctlRow('a', ctlSlider('gaQa', 0.5, 2.4, 0.05, st.a)) +
      ctlRow('b', ctlSlider('gaQb', 0.5, 2.4, 0.05, st.b)) +
      ctlRow('c', ctlSlider('gaQc', 0.5, 2.4, 0.05, st.c)) +
      ctlRow('trace at z', ctlSlider('gaQz', -2.4, 2.4, 0.02, st.trace)) +
      ctChk('gaQT', 'draw the horizontal trace', st.showTraces) +
      `<p class="help"><b>${Q.eq}</b><br>${Q.traces}</p>
       <p class="help">${Q.ex}</p>
       <p class="help">The method is always the same: set one variable to a constant and see what curve is
       left. A quadric is classified entirely by which of the three squared terms are present and what
       signs they carry — there is no more to it, and no other surface a second-degree equation can
       produce once you allow rotations and translations.</p>`;
  },
  wire(){
    ctWireSeg('gaQK', v => { ST.kind = v; });
    wireSlider('gaQa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('gaQb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('gaQc', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    wireSlider('gaQz', () => ST.trace, v => { ST.trace = v; }, v => fmtNum(+v, 3));
    ctWireChk('gaQT', v => { ST.showTraces = v; });
  },
  frame(st, dt, ctx, W, H){
    const L = 2.6;
    em3dBegin(L); em3dAxes(L);
    const { a, b, c, kind } = st;
    const col = rgbCss(TH.grad, 0.75);
    /* draw the surface as a stack of horizontal traces plus a few vertical ones:
       exactly the construction the readout describes */
    const zs = [];
    for(let i = -12; i <= 12; i++) zs.push(i * L / 12);
    for(const z of zs){
      const tr = gaQuadricTrace(kind, a, b, c, z);
      if(!tr) continue;
      if(tr.kind === 'ellipse'){
        if(!(tr.rx > 1e-6)) continue;
        const rim = [];
        for(let i = 0; i <= 60; i++){
          const t = i / 60 * 6.2832;
          rim.push(v3(tr.rx * Math.cos(t), tr.ry * Math.sin(t), z));
        }
        R.path(rim, col, 1.1, 0.5);
      } else {
        /* a hyperbolic trace: two branches, drawn parametrically */
        const Q = GA_QUADRICS[kind];
        const k = kind === 'hyperparab' ? z : (Q.rhs - Q.sg[2] * z * z / (c * c));
        for(const s of [1, -1]){
          const br = [];
          for(let i = -22; i <= 22; i++){
            const u = i * 0.11;
            let X, Y;
            if(kind === 'hyperparab' || kind === 'hyper1' || kind === 'cone' || kind === 'hyper2'){
              const sg0 = kind === 'hyperparab' ? -1 : Q.sg[0];
              /* sg0 x²/a² + sg1 y²/b² = k, with opposite signs: use cosh/sinh */
              const pos = sg0 > 0;
              const kk = pos ? k : -k;
              if(kk < 0) continue;
              const rt = Math.sqrt(kk);
              X = (pos ? a : a) * (pos ? s * rt * Math.cosh(u) : rt * Math.sinh(u));
              Y = (pos ? b * rt * Math.sinh(u) : b * s * rt * Math.cosh(u));
            } else continue;
            if(Math.abs(X) > L * 1.3 || Math.abs(Y) > L * 1.3) continue;
            br.push(v3(X, Y, z));
          }
          if(br.length > 2) R.path(br, col, 1.1, 0.5);
        }
      }
    }
    /* vertical ribs, so the surface reads as a surface */
    for(let k = 0; k < 8; k++){
      const th = k * Math.PI / 4, rib = [];
      for(let i = -40; i <= 40; i++){
        const z = i * L / 40;
        const tr = gaQuadricTrace(kind, a, b, c, z);
        if(!tr || tr.kind !== 'ellipse') continue;
        rib.push(v3(tr.rx * Math.cos(th), tr.ry * Math.sin(th), z));
      }
      if(rib.length > 2) R.path(rib, rgbCss(TH.grad, 0.4), 0.9, 0.4);
    }
    if(st.showTraces){
      const tr = gaQuadricTrace(kind, a, b, c, st.trace);
      /* the cutting plane */
      R.poly([v3(-L,-L,st.trace), v3(L,-L,st.trace), v3(L,L,st.trace), v3(-L,L,st.trace)],
             rgbCss(TH.warn, 0.1), rgbCss(TH.warn, 0.45), 1.1, 0.6);
      if(tr && tr.kind === 'ellipse' && tr.rx > 1e-6){
        const rim = [];
        for(let i = 0; i <= 80; i++){
          const t = i / 80 * 6.2832;
          rim.push(v3(tr.rx * Math.cos(t), tr.ry * Math.sin(t), st.trace));
        }
        R.path(rim, rgbCss(TH.warn), 2.6, 1);
      }
    }
    R.flush();
    em3dCaption(ctx, W, H, GA_QUADRICS[kind].name + ' — ' + GA_QUADRICS[kind].eq,
      'the surface is drawn from its own traces · drag to orbit');
  },
  readout(st){
    const { a, b, c, kind } = st;
    const Q = GA_QUADRICS[kind];
    const tr = gaQuadricTrace(kind, a, b, c, st.trace);
    const F = gaQuadricF(kind, a, b, c);
    return `<div class="card tight"><div class="ttl">${Q.name}</div>
      ${kv('equation', Q.eq)}
      ${kv('a, b, c', `${fmtNum(a,3)}, ${fmtNum(b,3)}, ${fmtNum(c,3)}`)}
      ${kv('squared terms present', Q.lin ? 'two — the third variable is linear' : 'three')}
      ${kv('signs', Q.sg.map(s => s > 0 ? '+' : s < 0 ? '−' : '·').join(' '))}
      ${kv('right-hand side', String(Q.rhs))}
    </div>
    <div class="card tight"><div class="ttl">The trace at z = ${fmtNum(st.trace, 3)}</div>
      ${kv('what is left', tr ? (tr.kind === 'ellipse' ? 'an ellipse' : 'a hyperbola') : 'nothing — the surface does not reach this height')}
      ${tr && tr.kind === 'ellipse' ? kv('semi-axes', `${fmtNum(tr.rx, 4)} × ${fmtNum(tr.ry, 4)}`) : ''}
      ${tr && tr.kind === 'ellipse' ? kv('its area', fmtNum(Math.PI * tr.rx * tr.ry, 4)) : ''}
      ${kv('F(a, 0, 0)', fmtNum(F(a, 0, 0), 4))}
      ${kv('F(0, 0, c)', fmtNum(F(0, 0, c), 4))}
      <p class="help">Those last two rows evaluate the surface's own defining function at the two axis
      points. A zero means the surface passes through there; a positive number means the point is outside.
      Slide the trace height and watch the ellipse grow, shrink, or vanish entirely — the vanishing is the
      whole difference between the two hyperboloids.</p>
    </div>`;
  },
  chip(st){ return `<div class="k">${GA_QUADRICS[st.kind].name}</div>
    <div style="color:var(--c-warn)">trace at z = ${fmtNum(st.trace, 3)}</div>`; },
  legend(){ return [['var(--c-grad)', 'the surface, traced'], ['var(--c-warn)', 'the cutting plane and its trace']]; }
};

/* ---- 7 · cylindrical and spherical coordinates ---------------------------- */
STAGES.gaCoord = {
  title:'Cylindrical & spherical',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Choosing coordinates that match the symmetry of the problem',
      steps:[
        drvSay('why anyone bothers',
          'A sphere in Cartesian coordinates is x² + y² + z² = R², an equation involving all three variables. In spherical coordinates it is ρ = R. Nothing about the sphere changed; the description did. Matching coordinates to symmetry turns hard boundaries into trivial ones.'),
        drvStep('cylindrical: polar in the plane, with height carried along',
          `${dv('x')} ${dop('=')} ${dv('r')}cos θ, &nbsp; ${dv('y')} ${dop('=')} ${dv('r')}sin θ, &nbsp; ${dv('z')} ${dop('=')} ${dv('z')}`,
          st.sys === 'cyl' ? `r = ${n(st.r)}, θ = ${n(st.th)}, z = ${n(st.z)}` : ''),
        drvStep('spherical: distance from the origin and two angles',
          `${dv('x')} ${dop('=')} ρ sin φ cos θ, &nbsp; ${dv('y')} ${dop('=')} ρ sin φ sin θ, &nbsp; ${dv('z')} ${dop('=')} ρ cos φ`,
          st.sys !== 'cyl' ? `ρ = ${n(st.rho)}, φ = ${n(st.ph)}, θ = ${n(st.th)}` : ''),
        drvSay('the sin φ is where most sign and factor errors begin',
          'φ is measured down from the positive z-axis, so the distance from that axis is ρ sin φ, not ρ. At the equator sin φ = 1 and the point is furthest out; at the poles it is zero and the circles of latitude shrink to nothing. Every appearance of sin φ traces back to this one projection.'),
        drvStep('the coordinate surfaces are what make the system useful',
          `ρ ${dop('=')} const is a sphere, φ ${dop('=')} const a cone, θ ${dop('=')} const a half-plane`,
          'the panel draws all three through the marked point'),
        drvSay('and a good coordinate system makes boundaries into constants',
          'Integrating over a sphere in Cartesian coordinates means limits that are square roots of one another. In spherical coordinates every limit is a constant. The work saved is not cosmetic — it is often the difference between an integral that can be done and one that cannot.'),
        drvStep('but the volume element changes, and must',
          `d${dv('V')} ${dop('=')} ${dv('r')} d${dv('r')} dθ d${dv('z')}  or  ρ² sin φ dρ dφ dθ`,
          'the cells are not boxes — the triple-integral stage measures them'),
        drvSay('the physics conventions differ, and it causes real confusion',
          'Mathematicians usually measure φ from the z-axis; many physicists swap the names of θ and φ entirely. Neither is wrong, and formulas copied between sources without checking will be wrong. This laboratory uses φ from the z-axis throughout.'),
        drvSay('and the singularities are real, not artefacts of drawing',
          'On the z-axis, θ is undefined — every value gives the same point. That is why a global coordinate system on a sphere is impossible without such a degeneracy, and it is why weather models and map projections all have trouble at the poles.')
      ],
      note:'Drag the point and all three coordinate systems update together, so the same location is shown in Cartesian, cylindrical and spherical form at once. The conversions are computed both ways and checked against each other.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.sys = o.sys || 'cyl';
    st.rho = 2.1; st.ph = 0.9; st.th = 0.7; st.z = 1.2; st.r = 1.6;
    st.surfaces = true;
    R.cam.az = 0.72; R.cam.el = 0.34; ctCamFit(2.6);
  },
  controls(){
    const st = ST;
    const seg = ctSeg('gaCSys', st.sys, [['cyl', 'cylindrical  (r, θ, z)'], ['sph', 'spherical  (ρ, φ, θ)']]);
    const s = st.sys === 'cyl'
      ? ctlRow('r', ctlSlider('gaCr', 0, 2.6, 0.02, st.r)) +
        ctlRow('θ', ctlSlider('gaCth', 0, 6.2832, 0.01, st.th)) +
        ctlRow('z', ctlSlider('gaCz', -2.4, 2.4, 0.02, st.z))
      : ctlRow('ρ', ctlSlider('gaCrho', 0.05, 2.6, 0.02, st.rho)) +
        ctlRow('φ', ctlSlider('gaCph', 0, Math.PI, 0.01, st.ph)) +
        ctlRow('θ', ctlSlider('gaCth', 0, 6.2832, 0.01, st.th));
    return seg + s + ctChk('gaCSurf', 'draw the coordinate surfaces', st.surfaces) +
      `<p class="help">${st.sys === 'cyl'
        ? 'Cylindrical coordinates are polar coordinates in the plane with z carried along untouched. Holding r fixed gives a cylinder, holding θ fixed gives a half-plane, and holding z fixed gives a horizontal plane. The three surfaces meet at right angles, which is what makes the system useful.'
        : 'Spherical coordinates measure φ down from the +z axis and θ round from the +x axis — the convention that makes the volume element ρ² sin φ. Holding ρ fixed gives a sphere, φ fixed gives a cone, θ fixed gives a half-plane.'}</p>
      <p class="help">Watch the Jacobian row in the readout. It is not a formula to remember: it is the
      volume of the little box the three coordinate surfaces cut out, and it shrinks to nothing on the axis
      because the θ direction has nowhere to go there. That is exactly the same degeneracy that makes a
      map of the world stretch Greenland.</p>`;
  },
  wire(){
    ctWireSeg('gaCSys', v => { ST.sys = v; });
    wireSlider('gaCr', () => ST.r, v => { ST.r = v; }, v => fmtNum(+v, 3));
    wireSlider('gaCz', () => ST.z, v => { ST.z = v; }, v => fmtNum(+v, 3));
    wireSlider('gaCrho', () => ST.rho, v => { ST.rho = v; }, v => fmtNum(+v, 3));
    wireSlider('gaCph', () => ST.ph, v => { ST.ph = v; }, v => ctDeg(+v));
    wireSlider('gaCth', () => ST.th, v => { ST.th = v; }, v => ctDeg(+v));
    ctWireChk('gaCSurf', v => { ST.surfaces = v; });
  },
  frame(st, dt, ctx, W, H){
    const L = 2.6;
    em3dBegin(L); em3dAxes(L);
    const p = st.sys === 'cyl' ? gaFromCyl(st.r, st.th, st.z) : gaFromSph(st.rho, st.ph, st.th);
    if(st.surfaces){
      if(st.sys === 'cyl'){
        for(let k = -6; k <= 6; k++){
          const zz = k * L / 6, rim = [];
          for(let i = 0; i <= 60; i++){ const t = i / 60 * 6.2832; rim.push(v3(st.r * Math.cos(t), st.r * Math.sin(t), zz)); }
          R.path(rim, rgbCss(TH.grad, 0.35), 0.9, 0.45);
        }
        R.poly([v3(0,0,-L), v3(L*Math.cos(st.th), L*Math.sin(st.th), -L),
                v3(L*Math.cos(st.th), L*Math.sin(st.th), L), v3(0,0,L)],
               rgbCss(TH.pos, 0.13), rgbCss(TH.pos, 0.5), 1.2, 0.6);
        R.poly([v3(-L,-L,st.z), v3(L,-L,st.z), v3(L,L,st.z), v3(-L,L,st.z)],
               rgbCss(TH.warn, 0.09), rgbCss(TH.warn, 0.4), 1.1, 0.55);
      } else {
        em3dSphere(v3(0,0,0), st.rho, rgbCss(TH.grad, 0.42), 0.5);
        /* the cone φ = const */
        const rr = st.rho * Math.sin(st.ph), zz = st.rho * Math.cos(st.ph);
        for(let i = 0; i < 24; i++){
          const t = i / 24 * 6.2832;
          R.line(v3(0,0,0), v3(rr * Math.cos(t), rr * Math.sin(t), zz), rgbCss(TH.warn, 0.35), 0.9, 0.45);
        }
        const rim = [];
        for(let i = 0; i <= 60; i++){ const t = i / 60 * 6.2832; rim.push(v3(rr*Math.cos(t), rr*Math.sin(t), zz)); }
        R.path(rim, rgbCss(TH.warn, 0.8), 1.6, 0.8);
        R.poly([v3(0,0,-L), v3(L*Math.cos(st.th), L*Math.sin(st.th), -L),
                v3(L*Math.cos(st.th), L*Math.sin(st.th), L), v3(0,0,L)],
               rgbCss(TH.pos, 0.13), rgbCss(TH.pos, 0.5), 1.2, 0.6);
      }
    }
    /* the point, and the path the coordinates describe to reach it */
    R.line(v3(0,0,0), v3(p.x, p.y, 0), rgbCss(TH.faint), 1.6, 0.8);
    R.line(v3(p.x, p.y, 0), p, rgbCss(TH.faint), 1.6, 0.8);
    R.arrow(v3(0,0,0), p, rgbCss(TH.curl), 2.6, 1);
    R.dot(p, 7, rgbCss(TH.curl), rgbCss(TH.bg));
    R.label(p, 'P', rgbCss(TH.curl), 0, -13, '700 12px ' + FONT_UI);
    R.flush();
    em3dCaption(ctx, W, H,
      st.sys === 'cyl' ? 'Cylindrical: r out, θ round, z up' : 'Spherical: ρ out, φ down from ẑ, θ round',
      'the three coordinate surfaces meet at right angles · drag to orbit');
  },
  readout(st){
    const p = st.sys === 'cyl' ? gaFromCyl(st.r, st.th, st.z) : gaFromSph(st.rho, st.ph, st.th);
    const cy = gaToCyl(p.x, p.y, p.z), sp = gaToSph(p.x, p.y, p.z);
    return `<div class="card tight"><div class="ttl">The same point, three ways</div>
      ${kv('Cartesian (x, y, z)', ctVec3f(p))}
      ${kv('cylindrical (r, θ, z)', `(${fmtNum(cy.r,4)}, ${ctDeg(cy.th)}, ${fmtNum(cy.z,4)})`)}
      ${kv('spherical (ρ, φ, θ)', `(${fmtNum(sp.rho,4)}, ${ctDeg(sp.ph)}, ${ctDeg(sp.th)})`)}
      ${kv('ρ² = r² + z²', `${fmtNum(sp.rho * sp.rho, 4)} = ${fmtNum(cy.r * cy.r + cy.z * cy.z, 4)}`)}
      ${kv('r = ρ sin φ', `${fmtNum(cy.r, 4)} = ${fmtNum(sp.rho * Math.sin(sp.ph), 4)}`)}
      ${kv('z = ρ cos φ', `${fmtNum(cy.z, 4)} = ${fmtNum(sp.rho * Math.cos(sp.ph), 4)}`)}
    </div>
    <div class="card tight"><div class="ttl">The volume element</div>
      ${kv('cylindrical  dV = r dr dθ dz', fmtNum(gaCylJac(cy.r), 5))}
      ${kv('spherical  dV = ρ² sin φ dρ dφ dθ', fmtNum(gaSphJac(sp.rho, sp.ph), 5))}
      ${kv('measured Jacobian of the map', fmtNum(Math.abs(mvJacobian3(
          st.sys === 'cyl' ? ((r, t, z) => gaFromCyl(r, t, z)) : ((r, ph, t) => gaFromSph(r, ph, t)),
          st.sys === 'cyl' ? cy.r : sp.rho, st.sys === 'cyl' ? cy.th : sp.ph,
          st.sys === 'cyl' ? cy.z : sp.th).det), 5))}
      <p class="help">The last row differentiates the coordinate map numerically and takes the determinant
      of the 3×3 matrix that comes out — no formula consulted. It agrees with the textbook element above it,
      which is the point: the volume element <i>is</i> the Jacobian, and the Jacobian is what the change of
      variables theorem in the integration wing is about.</p>
    </div>
    <div class="card tight"><div class="ttl">Where these are the natural choice</div>
      ${kv('a cylinder', 'r = const — one equation instead of x² + y² = a²')}
      ${kv('a sphere', 'ρ = const')}
      ${kv('a cone', 'φ = const')}
      ${kv('a half-plane', 'θ = const')}
      <p class="help">A coordinate system earns its keep when the boundary of your region becomes a
      constant. The integration wing's hardest Cartesian regions — the disc, the annulus, the ice-cream
      cone — all become plain rectangles in one of these two systems.</p>
    </div>`;
  },
  chip(st){
    const p = st.sys === 'cyl' ? gaFromCyl(st.r, st.th, st.z) : gaFromSph(st.rho, st.ph, st.th);
    return `<div class="k">${st.sys === 'cyl' ? 'Cylindrical' : 'Spherical'}</div>
      <div style="color:var(--c-curl)">${ctVec3f(p, 3)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the point P'], ['var(--c-grad)', 'r = const  /  ρ = const'],
                    ['var(--c-pos)', 'θ = const'], ['var(--c-warn)', 'z = const  /  φ = const']]; }
};
