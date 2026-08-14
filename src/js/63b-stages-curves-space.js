STAGES.pcSpace = {
  title:'Space curves',
  derive(st){
    return {
      title:'Calculus on a vector-valued function, done one component at a time',
      steps:[
        drvSay('the reassuring part',
          'A curve in space is three ordinary functions bundled together. Differentiating and integrating are done componentwise, because the limit defining a derivative applies to each coordinate independently. Nothing new has to be invented.'),
        drvStep('the derivative, componentwise',
          `${dv('r')}′(${dv('t')}) ${dop('=')} (${dv('x')}′, ${dv('y')}′, ${dv('z')}′)`,
          'the panel draws it as the velocity vector at the marker'),
        drvStep('and it is tangent to the curve, for a reason worth stating',
            `${dv('r')}′ ${dop('=')} ${dlim(dv('h'), '0')} ${dfrac(dv('r') + '(' + dv('t') + '+' + dv('h') + ') − ' + dv('r') + '(' + dv('t') + ')', dv('h'))}`,
          'the numerator is a chord, and as h shrinks the chord swings onto the tangent'),
        drvSay('the derivative is a vector, and its two parts mean different things',
          'Its direction is the heading of the motion; its length is the speed. Separating those is what the next stage does with the unit tangent, and it is why "velocity" and "speed" are different words for a reason.'),
        drvStep('the second derivative is acceleration',
          `${dv('r')}″(${dv('t')}) ${dop('=')} (${dv('x')}″, ${dv('y')}″, ${dv('z')}″)`,
          st.show.acc ? 'drawn here alongside the velocity — notice it is generally not tangent' : ''),
        drvSay('and acceleration pointing off the path is the interesting case',
          'For motion at constant speed the acceleration is entirely perpendicular to the velocity — it turns without speeding up. That is exactly circular motion, and it is why a satellite accelerates continuously while its speed never changes.'),
        drvStep('arc length, again the integral of speed',
          `${dv('s')} ${dop('=')} ∫ |${dv('r')}′| d${dv('t')}`,
          'for a helix this is elementary, since the speed is constant'),
        drvSay('the helix is the standard example for a good reason',
          'It has constant speed, constant curvature and constant torsion, so every quantity the next stage introduces is a fixed number that can be checked against a formula. Projected onto the plane it is a circle; unrolled it is a straight line. It is the simplest curve that is genuinely three-dimensional.')
      ],
      note:'The projections onto the coordinate planes are drawn alongside the curve, because a space curve is much easier to read as three plane curves seen together than as one perspective drawing.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.key = o.key || 'helix';
    const C = pcSpaceCur(st);
    st.a = C.a; st.c = C.c;
    st.t = (C.t0 + C.t1) / 2;
    st.run = o.run !== false;
    st.show = Object.assign({ vel:true, acc:true, proj:true }, o.show || {});
    R.cam.az = 0.7; R.cam.el = 0.34; ctCamFit(3);
  },
  controls(){
    const st = ST, C = pcSpaceCur(st);
    return pkSeg('pcSK', PC_SPACE, st.key) + pkBoxes('pcsp', st.key, st, PC_SPACE_OWN, PC_SPACE_BOUNDS) +
      ctlRow('t', ctlSlider('pcSt', C.t0, C.t1, (C.t1 - C.t0) / 1500, st.t)) +
      (st.key === 'helix' ? ctlRow('radius a', ctlSlider('pcSa', 0.3, 2.4, 0.02, st.a)) +
                            ctlRow('pitch c', ctlSlider('pcSc', 0, 1.2, 0.01, st.c)) : '') +
      `<div class="row wrap">${ctChk('pcSrun', 'run t', st.run)}
        ${ctChk('pcSv', "r′(t), the velocity", st.show.vel)}
        ${ctChk('pcSacc', "r″(t), the acceleration", st.show.acc)}
        ${ctChk('pcSp', 'the shadow on the xy-plane', st.show.proj)}</div>
      <p class="help"><b>r(t) = ${C.eq}</b><br>${C.note}</p>
      <p class="help">A vector-valued function is differentiated one component at a time, and that is a
      theorem rather than a convention: the limit of a vector difference quotient exists exactly when each
      component's does. Everything else — the product rules for dot and cross products, the fact that a
      vector of constant length has a derivative perpendicular to itself — follows from that.</p>`;
  },
  wire(){
    ctWireSeg('pcSK', v => { ST.key = v; const C = pcSpaceCur(ST); ST.a = C.a; ST.c = C.c; ST.t = (C.t0 + C.t1) / 2; });
    pkWireBoxes('pcsp', ST.key, ST, PC_SPACE_OWN, PC_SPACE_BOUNDS);
    wireSlider('pcSt', () => ST.t, v => { ST.t = v; ST.run = false; const c = $('pcSrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    wireSlider('pcSa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('pcSc', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    ctWireChk('pcSrun', v => { ST.run = v; });
    ctWireChk('pcSv', v => { ST.show.vel = v; });
    ctWireChk('pcSacc', v => { ST.show.acc = v; });
    ctWireChk('pcSp', v => { ST.show.proj = v; });
  },
  frame(st, dt, ctx, W, H){
    const C = pcSpaceCur(st);
    if(st.run){ st.t += dt * (C.t1 - C.t0) * 0.1; if(st.t > C.t1) st.t = C.t0; }
    const L = 3;
    em3dBegin(L); em3dAxes(L);
    const N = 500, pts = [];
    for(let i = 0; i <= N; i++) pts.push(C.f(C.t0 + (C.t1 - C.t0) * i / N, st.a, st.c));
    R.path(pts, rgbCss(TH.faint, 0.55), 1.4, 0.7);
    const M = Math.max(2, Math.round(N * (st.t - C.t0) / (C.t1 - C.t0)));
    R.path(pts.slice(0, M), rgbCss(TH.grad), 2.4, 1);
    if(st.show.proj) R.path(pts.map(p => v3(p.x, p.y, -L)), rgbCss(TH.faint, 0.35), 1, 0.45);
    const p = C.f(st.t, st.a, st.c), d = C.d(st.t, st.a, st.c), dd = C.dd(st.t, st.a, st.c);
    if(st.show.vel){
      const s = Math.min(1.2, 2.2 / Math.max(0.2, vlen(d)));
      R.arrow(p, vmul(d, s), rgbCss(TH.curl), 2.6, 1);
      R.label(vadd(p, vmul(d, s)), "r′", rgbCss(TH.curl), 0, -11, '700 11px ' + FONT_UI);
    }
    if(st.show.acc){
      const s = Math.min(1.2, 2.2 / Math.max(0.2, vlen(dd)));
      R.arrow(p, vmul(dd, s), rgbCss(TH.warn), 2.4, 1);
      R.label(vadd(p, vmul(dd, s)), "r″", rgbCss(TH.warn), 0, -11, '700 11px ' + FONT_UI);
    }
    R.dot(p, 7, rgbCss(TH.grad), rgbCss(TH.bg));
    if(st.show.proj) R.dot(v3(p.x, p.y, -L), 4, rgbCss(TH.faint), rgbCss(TH.bg));
    R.flush();
    em3dCaption(ctx, W, H, C.name + ' — differentiate componentwise', 'drag to orbit · scroll to zoom');
  },
  readout(st){
    const C = pcSpaceCur(st);
    const p = C.f(st.t, st.a, st.c), d = C.d(st.t, st.a, st.c), dd = C.dd(st.t, st.a, st.c);
    const L = pcArcLength3(C, C.t0, C.t1, st.a, st.c);
    const Ls = pcArcLength3(C, C.t0, st.t, st.a, st.c);
    return `<div class="card tight"><div class="ttl">At t = ${fmtNum(st.t, 4)}</div>
      ${kv('r(t)', ctVec3f(p))}
      ${kv("r′(t)", ctVec3f(d))}
      ${kv("|r′| — the speed", fmtNum(vlen(d), 5))}
      ${kv("r″(t)", ctVec3f(dd))}
      ${kv("r′ · r″", fmtNum(vdot(d, dd), 5))}
      ${kv("r′ × r″", ctVec3f(vcross(d, dd)))}
      <p class="help">When the speed is constant, <b>r′·r″ = 0</b> — the acceleration is entirely
      perpendicular to the motion. That is not a coincidence about circles: differentiating
      <b>r′·r′ = const</b> gives it immediately, and it is the reason a satellite in a circular orbit is
      accelerating hard while its speed never changes.</p>
    </div>
    <div class="card tight"><div class="ttl">Arc length along the curve</div>
      ${kv('s(t) = ∫|r′| dt', fmtNum(Ls, 6))}
      ${kv('total length', fmtNum(L, 6))}
      ${kv('ds/dt', fmtNum(vlen(d), 6))}
      <p class="help">Arc length is the one parameter every curve carries for free. Reparametrising by s
      makes the speed exactly 1, which is why the Frenet formulas in the next stage are stated in terms of
      it — with unit speed, the derivative of the tangent measures pure turning and nothing else.</p>
    </div>`;
  },
  chip(st){
    const C = pcSpaceCur(st), p = C.f(st.t, st.a, st.c);
    return `<div class="k">${C.name}</div><div style="color:var(--c-grad)">t = ${fmtNum(st.t, 3)}</div>
      <div>${ctVec3f(p, 2)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the curve so far'], ['var(--c-curl)', "r′ — velocity"],
                    ['var(--c-warn)', "r″ — acceleration"], ['var(--faint)', 'the shadow on the floor']]; }
};

/* ---- 5 · the Frenet frame, curvature and torsion --------------------------- */
STAGES.pcFrame = {
  title:'Curvature & the TNB frame',
  derive(st){
    return {
      title:'Carrying a set of axes along the curve, and measuring how they turn',
      steps:[
        drvSay('the aim: describe the curve without reference to outside axes',
          'The x, y, z axes are arbitrary. A description of the curve that used only quantities the curve itself defines would be far more revealing — and that is what the moving frame provides.'),
        drvStep('the unit tangent strips speed out of velocity',
          `${dv('T')} ${dop('=')} ${dfrac(dv('r') + '′', '|' + dv('r') + '′|')}`,
          'direction only, so it depends on the shape rather than the schedule'),
        drvStep('curvature measures how fast that direction turns',
          `κ ${dop('=')} ${dop('|')}${dfrac('d' + dv('T'), 'd' + dv('s'))}${dop('|')}`,
          'per unit distance, not per unit time — the panel prints the measured value'),
        drvSay('differentiating with respect to arc length is what makes it geometric',
          'Using ds rather than dt removes the parametrisation. Drive the same bend faster and dT/dt grows, but dT/ds does not. Curvature is a property of the road, not of the car — which is why it can be compared between curves.'),
        drvStep('the normal is where the tangent is heading',
          `${dv('N')} ${dop('=')} ${dfrac('d' + dv('T') + '/d' + dv('s'), 'κ')}`,
          'perpendicular to T, because T has constant length and a unit vector\'s derivative is perpendicular to it'),
        drvSay('that perpendicularity is a one-line proof worth knowing',
          'T·T = 1 always. Differentiate both sides: 2T·T′ = 0. So T′ is perpendicular to T, with no further work. The same argument explains why circular motion has centripetal acceleration, and why a magnetic force never changes a particle\'s speed.'),
        drvStep('the binormal completes a right-handed frame',
          `${dv('B')} ${dop('=')} ${dv('T')} ${dop('×')} ${dv('N')}`,
          'three mutually perpendicular unit vectors, carried along by the curve'),
        drvStep('and torsion measures how the frame twists out of its plane',
          `τ ${dop('=')} ${dop('−')}${dfrac('d' + dv('B'), 'd' + dv('s'))} ${dop('·')} ${dv('N')}`,
          'zero for any plane curve — the panel confirms this on the flat cases'),
        drvSay('and those two numbers are the entire curve',
          'The fundamental theorem of space curves says κ(s) and τ(s) determine the curve completely, up to where it is placed and how it is oriented. Two numbers per point encode the whole shape — which is why curvature and torsion are the right invariants rather than merely convenient ones.'),
        drvStep('the osculating circle makes curvature visible',
          `${dv('R')} ${dop('=')} 1/κ`,
          st.show.osc ? 'the panel draws the circle that matches the curve to second order at the marker' : '')
      ],
      note:'For a helix of radius a and pitch c, curvature is a/(a² + c²) and torsion c/(a² + c²) — both constant. The panel computes them numerically from the frame and prints them against those closed forms, so the constancy is measured rather than claimed.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.key = o.key || 'helix';
    const C = pcSpaceCur(st);
    st.a = C.a; st.c = C.c;
    st.t = (C.t0 + C.t1) / 2;
    st.run = o.run !== false;
    st.show = Object.assign({ osc:true, plane:true, tube:false }, o.show || {});
    R.cam.az = 0.66; R.cam.el = 0.3; ctCamFit(3);
  },
  controls(){
    const st = ST, C = pcSpaceCur(st);
    return pkSeg('pcFK', PC_SPACE, st.key) + pkBoxes('pcsp', st.key, st, PC_SPACE_OWN, PC_SPACE_BOUNDS) +
      ctlRow('t', ctlSlider('pcFt', C.t0, C.t1, (C.t1 - C.t0) / 1500, st.t)) +
      (st.key === 'helix' ? ctlRow('radius a', ctlSlider('pcFa', 0.3, 2.4, 0.02, st.a)) +
                            ctlRow('pitch c', ctlSlider('pcFc', 0, 1.2, 0.01, st.c)) : '') +
      `<div class="row wrap">${ctChk('pcFrun', 'run t', st.run)}
        ${ctChk('pcFosc', 'the osculating circle', st.show.osc)}
        ${ctChk('pcFpl', 'the osculating plane', st.show.plane)}</div>
      <p class="help">Three unit vectors, built in order and each from the one before.
      <b>T = r′/|r′|</b> points along the motion. <b>N = T′/|T′|</b> points the way the curve is turning —
      always towards the concave side, always perpendicular to T because T has constant length.
      <b>B = T × N</b> completes a right-handed frame and is normal to the plane the curve momentarily
      lies in.</p>
      <p class="help"><b>Curvature κ = |r′ × r″|/|r′|³</b> is the rate the direction turns per unit
      length, and <b>1/κ</b> is the radius of the circle that hugs the curve best. <b>Torsion τ</b> is the
      rate the osculating plane itself twists: it is zero for every plane curve and nonzero exactly when
      the curve refuses to lie in any plane. Set the helix pitch to zero and watch τ collapse.</p>`;
  },
  wire(){
    ctWireSeg('pcFK', v => { ST.key = v; const C = pcSpaceCur(ST); ST.a = C.a; ST.c = C.c; ST.t = (C.t0 + C.t1) / 2; });
    pkWireBoxes('pcsp', ST.key, ST, PC_SPACE_OWN, PC_SPACE_BOUNDS);
    wireSlider('pcFt', () => ST.t, v => { ST.t = v; ST.run = false; const c = $('pcFrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    wireSlider('pcFa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('pcFc', () => ST.c, v => { ST.c = v; }, v => fmtNum(+v, 3));
    ctWireChk('pcFrun', v => { ST.run = v; });
    ctWireChk('pcFosc', v => { ST.show.osc = v; });
    ctWireChk('pcFpl', v => { ST.show.plane = v; });
  },
  frame(st, dt, ctx, W, H){
    const C = pcSpaceCur(st);
    if(st.run){ st.t += dt * (C.t1 - C.t0) * 0.07; if(st.t > C.t1) st.t = C.t0; }
    const L = 3;
    em3dBegin(L); em3dAxes(L);
    const N = 500, pts = [];
    for(let i = 0; i <= N; i++) pts.push(C.f(C.t0 + (C.t1 - C.t0) * i / N, st.a, st.c));
    R.path(pts, rgbCss(TH.faint, 0.6), 1.5, 0.75);
    const F = pcFrame(C, st.t, st.a, st.c);
    if(st.show.plane && F.kappa > 1e-9){
      const s = Math.min(2.2, 1.3 * F.radius);
      R.poly([vadd(vadd(F.r, vmul(F.T, -s)), vmul(F.N, -s)), vadd(vadd(F.r, vmul(F.T, s)), vmul(F.N, -s)),
              vadd(vadd(F.r, vmul(F.T, s)), vmul(F.N, s)), vadd(vadd(F.r, vmul(F.T, -s)), vmul(F.N, s))],
             rgbCss(TH.curl, 0.09), rgbCss(TH.curl, 0.35), 1, 0.5);
    }
    if(st.show.osc && F.centre && Number.isFinite(F.radius) && F.radius < 40){
      const rim = [];
      for(let i = 0; i <= 90; i++){
        const th = i / 90 * 6.2832;
        rim.push(vadd(F.centre, vadd(vmul(F.T, F.radius * Math.sin(th)), vmul(F.N, -F.radius * Math.cos(th)))));
      }
      R.path(rim, rgbCss(TH.warn, 0.85), 2, 0.95);
      R.dot(F.centre, 4, rgbCss(TH.warn), rgbCss(TH.bg));
      R.line(F.r, F.centre, rgbCss(TH.warn, 0.5), 1.1, 0.6);
    }
    R.arrow(F.r, vmul(F.T, 1.1), rgbCss(TH.grad), 2.8, 1);
    R.arrow(F.r, vmul(F.N, 1.1), rgbCss(TH.pos), 2.8, 1);
    R.arrow(F.r, vmul(F.B, 1.1), rgbCss(TH.curl), 2.8, 1);
    R.label(vadd(F.r, vmul(F.T, 1.3)), 'T', rgbCss(TH.grad), 0, 0, '700 12px ' + FONT_UI);
    R.label(vadd(F.r, vmul(F.N, 1.3)), 'N', rgbCss(TH.pos), 0, 0, '700 12px ' + FONT_UI);
    R.label(vadd(F.r, vmul(F.B, 1.3)), 'B', rgbCss(TH.curl), 0, 0, '700 12px ' + FONT_UI);
    R.dot(F.r, 6, rgbCss(TH.text), rgbCss(TH.bg));
    R.flush();
    em3dCaption(ctx, W, H, 'The Frenet frame: T along, N towards the centre of curvature, B = T × N',
      'the orange circle is the osculating circle, radius 1/κ');
  },
  readout(st){
    const C = pcSpaceCur(st);
    const F = pcFrame(C, st.t, st.a, st.c);
    const helixK = st.key === 'helix' ? st.a / (st.a * st.a + st.c * st.c) : NaN;
    const helixT = st.key === 'helix' ? st.c / (st.a * st.a + st.c * st.c) : NaN;
    return `<div class="card tight"><div class="ttl">The frame at t = ${fmtNum(st.t, 4)}</div>
      ${kv('T', ctVec3f(F.T))}${kv('N', ctVec3f(F.N))}${kv('B', ctVec3f(F.B))}
      ${kv('|T|, |N|, |B|', `${fmtNum(vlen(F.T), 6)}, ${fmtNum(vlen(F.N), 6)}, ${fmtNum(vlen(F.B), 6)}`)}
      ${kv('T·N', fmtNum(vdot(F.T, F.N), 3))}
      ${kv('T·B', fmtNum(vdot(F.T, F.B), 3))}
      ${kv('|T × N − B|', fmtNum(vlen(vsub(vcross(F.T, F.N), F.B)), 3))}
      <p class="help">Three orthonormality checks, all zero. The frame is genuinely built here — T from
      r′, N from the cross products, B from T × N — and not assembled from a table.</p>
    </div>
    <div class="card tight"><div class="ttl">Curvature and torsion</div>
      ${kv('speed |r′|', fmtNum(F.speed, 5))}
      ${kv('κ = |r′ × r″| / |r′|³', fmtNum(F.kappa, 6))}
      ${Number.isFinite(helixK) ? kv('the helix formula a/(a²+c²)', fmtNum(helixK, 6)) : ''}
      ${kv('radius of curvature 1/κ', Number.isFinite(F.radius) ? fmtNum(F.radius, 6) : '∞ — straight here')}
      ${kv('τ = (r′ × r″)·r‴ / |r′ × r″|²', fmtNum(F.tau, 6))}
      ${Number.isFinite(helixT) ? kv('the helix formula c/(a²+c²)', fmtNum(helixT, 6)) : ''}
      ${kv('is it a plane curve?', Math.abs(F.tau) < 1e-6 ? 'yes — τ = 0, it lies in one plane' : 'no — τ ≠ 0, it twists out of every plane')}
      <p class="help">The two numbers determine the curve completely up to a rigid motion: give κ(s) and
      τ(s) and there is exactly one curve, up to where you put it and which way it faces. That is the
      fundamental theorem of space curves, and it is the sense in which curvature and torsion are the
      curve's complete shape.</p>
    </div>`;
  },
  chip(st){
    const F = pcFrame(pcSpaceCur(st), st.t, st.a, st.c);
    return `<div class="k">κ and τ</div>
      <div style="color:var(--c-warn)">κ = ${fmtNum(F.kappa, 4)}</div>
      <div style="color:var(--c-curl)">τ = ${fmtNum(F.tau, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'T — unit tangent'], ['var(--c-pos)', 'N — unit normal'],
                    ['var(--c-curl)', 'B — binormal, and the osculating plane'],
                    ['var(--c-warn)', 'the osculating circle, radius 1/κ']]; }
};

/* ---- 6 · motion in space --------------------------------------------------- */
STAGES.pcMotion = {
  title:'Motion in space',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Splitting acceleration into speeding up and turning',
      steps:[
        drvSay('acceleration answers two questions at once, and they are worth separating',
          'A car can accelerate by pressing the pedal or by turning the wheel. Both change the velocity vector, but they do quite different things — one changes speed, the other changes direction. Resolving acceleration along the moving frame separates them cleanly.'),
        drvStep('velocity is speed times direction',
          `${dv('v')} ${dop('=')} ${dv('v')}${dv('T')}, &nbsp; ${dv('v')} ${dop('=')} |${dv('r')}′|`,
          'the unit tangent from the previous stage, scaled by the speed'),
        drvStep('differentiate with the product rule',
          `${dv('a')} ${dop('=')} ${dfrac('d' + dv('v'), 'd' + dv('t'))}${dv('T')} ${dop('+')} ${dv('v')}${dfrac('d' + dv('T'), 'd' + dv('t'))}`,
          'two terms, because both the speed and the direction can change'),
        drvStep('and the second term becomes curvature',
          `${dv('a')} ${dop('=')} ${dv('v')}′${dv('T')} ${dop('+')} κ${dv('v')}²${dv('N')}`,
          'the panel resolves the acceleration into these two components and prints both'),
        drvSay('read the two coefficients',
          'The tangential part is the rate of change of speed — pressing the pedal. The normal part is κv², pointing towards the centre of the turn. It has no effect on speed at all, only on direction.'),
        drvSay('and the v² in the normal term explains a great deal of driving',
          'Doubling your speed quadruples the sideways acceleration needed to hold the same bend, and the tyres must supply it. That is why corners have speed limits rather than force limits, and why the required banking angle depends on the square of the design speed.'),
        drvStep('projectile motion is the case of constant acceleration',
          `${dv('r')}(${dv('t')}) ${dop('=')} ${dv('r')}₀ ${dop('+')} ${dv('v')}₀${dv('t')} ${dop('+')} ${dfrac('1', '2')}${dv('g')}${dv('t')}²`,
          st.scene !== 'kepler' ? `v₀ = ${n(st.v0)} m/s at ${n(st.ang * 180 / Math.PI)}° — the panel integrates and compares` : ''),
        drvSay('the components separate completely, which is why it is easy',
          'Gravity acts only downwards, so the horizontal motion is unaccelerated and the vertical is uniformly accelerated. Two independent one-dimensional problems, sharing only the clock. Galileo\'s insight was precisely this separation.'),
        drvStep('and for an inverse-square force the orbit is a conic',
            `${dv('a')} ${dop('=')} ${dop('−')}${dfrac('GM', dv('r') + '²')}${dv('r')}̂`,
          st.scene === 'kepler' ? `eccentricity ${n(st.ecc)} — the panel integrates the motion and the trace closes on an ellipse` : ''),
        drvSay('and the second law falls out of the direction alone',
          'Because the force points along r, the torque about the centre is zero, so angular momentum is conserved. That single conserved quantity is exactly "equal areas in equal times" — Kepler\'s second law, which holds for any central force, not just gravity.')
      ],
      note:'The orbit here is integrated numerically from the inverse-square law, not drawn from the conic formula. That the trace closes on an ellipse with the centre at a focus is therefore a result of the simulation rather than an assumption built into it.'
    };
  },
  /* Only the T/N decomposition is drawn in space. The projectile and Kepler
     scenes are flat, and declaring them 3d does not merely pick the wrong
     renderer — in 3d mode the core does NOT clear the canvas, because clearing
     is em3dBegin's job and a 3d stage is expected to call it. A 2d frame under a
     3d declaration therefore paints on top of every frame before it, and what
     accumulates is a solid fan of arrows plus the previous scene's caption still
     sitting under the new one. Listing only the scene that is genuinely 3d, so
     adding another flat scene cannot reintroduce it. */
  mode:st => (st && st.scene === 'split') ? '3d' : '2d',
  enter(st, o){
    st.scene = o.scene || 'split';
    st.key = 'helix';
    st.t = 1.0;
    st.run = o.run !== false;
    /* projectile parameters, in metres and seconds */
    st.v0 = 24; st.ang = 42 * Math.PI / 180;
    /* Kepler */
    st.ecc = 0.6; st.kt = 0;
    R.cam.az = 0.7; R.cam.el = 0.32; ctCamFit(3);
  },
  controls(){
    const st = ST;
    const seg = ctSeg('pcMS', st.scene,
      [['split', 'aT and aN'], ['proj', 'projectile'], ['kepler', "Kepler's second law"]]);
    let s = '';
    if(st.scene === 'split'){
      s = pkSeg('pcMK', PC_SPACE, st.key) + pkBoxes('pcsp', st.key, st, PC_SPACE_OWN, PC_SPACE_BOUNDS) +
          ctlRow('t', ctlSlider('pcMt', pcSpaceCur(st).t0, pcSpaceCur(st).t1,
                 (pcSpaceCur(st).t1 - pcSpaceCur(st).t0) / 1200, st.t)) +
          ctChk('pcMrun', 'run t', st.run);
    } else if(st.scene === 'proj'){
      s = ctlRow('speed v₀', ctlSlider('pcMv', 5, 45, 0.5, st.v0)) +
          ctlRow('angle', ctlSlider('pcMa', 5, 85, 0.5, st.ang * 180 / Math.PI)) +
          ctChk('pcMrun', 'run the flight', st.run);
    } else {
      s = ctlRow('eccentricity', ctlSlider('pcMe', 0, 0.85, 0.01, st.ecc)) +
          ctChk('pcMrun', 'run the orbit', st.run);
    }
    const help = {
      split:'Acceleration splits into exactly two parts and no more: <b>a = a_T T + a_N N</b>. The tangential part <b>a_T = d|v|/dt</b> changes how fast you are going; the normal part <b>a_N = κ|v|²</b> changes where you are going and never touches the speed. There is no component along B, ever — the acceleration always lies in the osculating plane, which is one way of saying what that plane is for.',
      proj:'Constant acceleration, integrated twice. The horizontal motion is uniform and the vertical is uniformly accelerated, and the two never talk to each other — which is the whole of Galileo\'s insight. Watch a_T fall to zero and reverse at the apex, while a_N peaks there: at the top, all of gravity is bending the path and none of it is changing the speed.',
      kepler:'Equal areas in equal times. The planet moves fastest at perihelion and slowest at aphelion, and the shaded wedges swept in equal time intervals have exactly the same area. The reason is that the force is <b>central</b>: r × F = 0, so angular momentum r × v is constant, and the areal rate ½|r × v| is half of it. Kepler found this in 1609 from Tycho\'s data; Newton showed it holds for <i>any</i> central force, inverse-square or not.'
    }[st.scene];
    return seg + s + `<p class="help">${help}</p>`;
  },
  wire(){
    ctWireSeg('pcMS', v => { ST.scene = v; });
    ctWireSeg('pcMK', v => { ST.key = v; const C = pcSpaceCur(ST); ST.t = (C.t0 + C.t1) / 2; });
    pkWireBoxes('pcsp', ST.key, ST, PC_SPACE_OWN, PC_SPACE_BOUNDS);
    wireSlider('pcMt', () => ST.t, v => { ST.t = v; ST.run = false; }, v => fmtNum(+v, 4));
    wireSlider('pcMv', () => ST.v0, v => { ST.v0 = v; }, v => fmtNum(+v, 3) + ' m/s');
    wireSlider('pcMa', () => ST.ang * 180 / Math.PI, v => { ST.ang = v * Math.PI / 180; }, v => fmtNum(+v, 3) + '°');
    wireSlider('pcMe', () => ST.ecc, v => { ST.ecc = v; }, v => fmtNum(+v, 3));
    ctWireChk('pcMrun', v => { ST.run = v; });
  },
  /* the projectile's flight, in closed form */
  projAt(st, t){
    const g = DY_G;
    return { x:st.v0 * Math.cos(st.ang) * t, y:st.v0 * Math.sin(st.ang) * t - 0.5 * g * t * t };
  },
  projFlight(st){ return 2 * st.v0 * Math.sin(st.ang) / DY_G; },
  frame(st, dt, ctx, W, H){
    if(st.scene === 'proj') return this.frameProj(st, dt, ctx, W, H);
    if(st.scene === 'kepler') return this.frameKepler(st, dt, ctx, W, H);
    const C = pcSpaceCur(st);
    if(st.run){ st.t += dt * (C.t1 - C.t0) * 0.08; if(st.t > C.t1) st.t = C.t0; }
    const L = 3;
    em3dBegin(L); em3dAxes(L);
    const N = 480, pts = [];
    for(let i = 0; i <= N; i++) pts.push(C.f(C.t0 + (C.t1 - C.t0) * i / N, C.a, C.c));
    R.path(pts, rgbCss(TH.faint, 0.6), 1.4, 0.7);
    const S = pcAccelSplit(C, st.t, C.a, C.c), F = S.frame;
    const sc = Math.min(1.1, 2.4 / Math.max(0.3, S.mag));
    R.arrow(F.r, vmul(F.T, S.aT * sc), rgbCss(TH.grad), 3, 1);
    R.arrow(F.r, vmul(F.N, S.aN * sc), rgbCss(TH.pos), 3, 1);
    R.arrow(F.r, vmul(F.dd, sc), rgbCss(TH.warn), 2.4, 1);
    /* the parallelogram that proves the decomposition */
    R.line(vadd(F.r, vmul(F.T, S.aT * sc)), vadd(F.r, vmul(F.dd, sc)), rgbCss(TH.faint), 1.1, 0.6);
    R.line(vadd(F.r, vmul(F.N, S.aN * sc)), vadd(F.r, vmul(F.dd, sc)), rgbCss(TH.faint), 1.1, 0.6);
    R.arrow(F.r, vmul(F.T, Math.min(1.6, F.speed * 0.4)), rgbCss(TH.curl), 2, 0.9);
    R.dot(F.r, 6, rgbCss(TH.text), rgbCss(TH.bg));
    R.label(vadd(F.r, vmul(F.dd, sc)), 'a', rgbCss(TH.warn), 0, -11, '700 11px ' + FONT_UI);
    R.flush();
    em3dCaption(ctx, W, H, 'a = a_T T + a_N N — speeding up, and turning', 'drag to orbit');
  },
  frameProj(st, dt, ctx, W, H){
    const T = this.projFlight(st);
    if(st.run){ st.t += dt * 0.8; if(st.t > T) st.t = 0; }
    else st.t = Math.min(st.t, T);
    const range = st.v0 * st.v0 * Math.sin(2 * st.ang) / DY_G;
    const apex = st.v0 * st.v0 * Math.pow(Math.sin(st.ang), 2) / (2 * DY_G);
    const P = ctBox(W, H, range / 2, apex * 0.6, Math.max(range, apex * 2) * 0.62);
    ctGrid(ctx, P);
    ctFrame(ctx, P, 'Projectile motion — constant acceleration, integrated twice');
    ctParam(ctx, P, t => this.projAt(st, t), 0, T, 400, rgbCss(TH.faint, 0.6), 1.6);
    ctParam(ctx, P, t => this.projAt(st, t), 0, Math.max(1e-6, st.t), 300, rgbCss(TH.grad), 2.6);
    const p = this.projAt(st, st.t);
    const v = { x:st.v0 * Math.cos(st.ang), y:st.v0 * Math.sin(st.ang) - DY_G * st.t };
    const sp = Math.hypot(v.x, v.y) || 1;
    const s = range * 0.02;
    ctArrow(ctx, P, p.x, p.y, p.x + v.x * s, p.y + v.y * s, rgbCss(TH.curl), 2.6, 'v');
    /* the tangential/normal split of gravity at this instant */
    const uT = { x:v.x / sp, y:v.y / sp };
    const aT = -DY_G * uT.y, aN = DY_G * Math.abs(uT.x);
    /* At the apex the velocity is horizontal, so a_T vanishes and a_N becomes
       the whole of gravity — the two arrows coincide exactly, and so did their
       labels, which read as one piece of nonsense. That coincidence is the point
       of the stage rather than a collision to nudge apart, so it is said. */
    const merged = Math.abs(aT) < DY_G * 0.06;
    ctArrow(ctx, P, p.x, p.y, p.x, p.y - DY_G * s * 2.4, rgbCss(TH.warn), 2.6, merged ? '' : 'g');
    ctArrow(ctx, P, p.x, p.y, p.x + uT.x * aT * s * 2.4, p.y + uT.y * aT * s * 2.4, rgbCss(TH.grad), 2.2, merged ? '' : 'a_T');
    const uN = { x:-uT.y, y:uT.x };
    const sgn = (uN.y * -1 > 0) ? 1 : -1;
    ctArrow(ctx, P, p.x, p.y, p.x + uN.x * sgn * aN * s * 2.4, p.y + uN.y * sgn * aN * s * 2.4, rgbCss(TH.pos), 2.2,
            merged ? 'g = a_N  (a_T = 0 at the apex)' : 'a_N');
    ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.text), rgbCss(TH.bg));
    ctPath(ctx, P, [{ x:-range, y:0 }, { x:range * 2, y:0 }], rgbCss(TH.line2), 1.4);
    stageNote(ctx, 'gravity never changes: what changes is how much of it is turning the path and how much is speeding it up', W, H);
  },
  frameKepler(st, dt, ctx, W, H){
    if(st.run) st.kt += dt * 0.32;
    const a = 2, e = st.ecc, b = a * Math.sqrt(1 - e * e), c = a * e;
    /* solve Kepler's equation so the motion obeys the area law rather than
       merely being drawn as if it did */
    const M = (st.kt % (2 * Math.PI));
    let E = M;
    for(let i = 0; i < 40; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const pos = u => {
      let Eu = u;
      for(let i = 0; i < 40; i++) Eu = Eu - (Eu - e * Math.sin(Eu) - u) / (1 - e * Math.cos(Eu));
      return { x:a * (Math.cos(Eu) - e), y:b * Math.sin(Eu) };
    };
    const P = ctBox(W, H, 0, 0, a * 1.45);
    ctGrid(ctx, P);
    ctFrame(ctx, P, "Kepler's second law — equal areas in equal times");
    /* two wedges swept over equal time intervals, at opposite ends of the orbit */
    const dtw = 0.55;
    for(const [m0, col] of [[0.2, TH.pos], [Math.PI - 0.1, TH.warn]]){
      const wedge = [{ x:0, y:0 }];
      for(let i = 0; i <= 40; i++) wedge.push(pos(m0 + dtw * i / 40));
      ctFill(ctx, P, wedge, rgbCss(col, 0.3));
      ctPath(ctx, P, wedge, rgbCss(col, 0.7), 1.2);
    }
    ctParam(ctx, P, t => ({ x:a * Math.cos(t) - c, y:b * Math.sin(t) }), 0, 2 * Math.PI, 400, rgbCss(TH.faint, 0.8), 1.6);
    const p = { x:a * (Math.cos(E) - e), y:b * Math.sin(E) };
    ctDot(ctx, P, 0, 0, 8, rgbCss(TH.neg), rgbCss(TH.bg));
    ctText(ctx, P.X(0) + 10, P.Y(0) - 10, 'focus', rgbCss(TH.neg), '600 11px ' + FONT_UI);
    ctPath(ctx, P, [{ x:0, y:0 }, p], rgbCss(TH.curl), 1.8);
    ctDot(ctx, P, p.x, p.y, 7, rgbCss(TH.grad), rgbCss(TH.bg));
    stageNote(ctx, 'the two shaded wedges are swept in equal times — their areas are printed in the panel', W, H);
  },
  readout(st){
    if(st.scene === 'proj'){
      const T = this.projFlight(st), g = DY_G;
      const p = this.projAt(st, st.t);
      const v = { x:st.v0 * Math.cos(st.ang), y:st.v0 * Math.sin(st.ang) - g * st.t };
      const sp = Math.hypot(v.x, v.y) || 1;
      const aT = -g * v.y / sp, aN = g * Math.abs(v.x) / sp;
      const kappa = aN / (sp * sp);
      return `<div class="card tight"><div class="ttl">The flight</div>
        ${kv('range v₀²sin2θ/g', fmtNum(st.v0 * st.v0 * Math.sin(2 * st.ang) / g, 5) + ' m')}
        ${kv('max height', fmtNum(st.v0 * st.v0 * Math.pow(Math.sin(st.ang), 2) / (2 * g), 5) + ' m')}
        ${kv('time of flight', fmtNum(T, 5) + ' s')}
        ${kv('best angle for range', '45° — sin 2θ peaks there')}
      </div>
      <div class="card tight"><div class="ttl">At t = ${fmtNum(st.t, 3)} s</div>
        ${kv('position', ctVec2(p) + ' m')}
        ${kv('velocity', ctVec2(v) + ' m/s')}
        ${kv('speed', fmtNum(sp, 5) + ' m/s')}
        ${kv('a_T = d|v|/dt', fmtNum(aT, 5) + ' m/s²')}
        ${kv('a_N = κ|v|²', fmtNum(aN, 5) + ' m/s²')}
        ${kv('√(a_T² + a_N²)', fmtNum(Math.hypot(aT, aN), 6) + ' m/s²')}
        ${kv('|a| = g', fmtNum(g, 6) + ' m/s²')}
        ${kv('curvature κ here', fmtNum(kappa, 6) + ' m⁻¹')}
        <p class="help">The two components always reassemble into exactly g — the acceleration never
        changes, only its bookkeeping does. At the apex a_T is zero and the whole of gravity is bending the
        path, which is why the trajectory is most sharply curved at the top.</p>
      </div>`;
    }
    if(st.scene === 'kepler'){
      const a = 2, e = st.ecc, b = a * Math.sqrt(1 - e * e);
      const pos = u => {
        let E = u;
        for(let i = 0; i < 40; i++) E = E - (E - e * Math.sin(E) - u) / (1 - e * Math.cos(E));
        return { x:a * (Math.cos(E) - e), y:b * Math.sin(E) };
      };
      /* both wedge areas, by the shoelace formula on the sampled boundary */
      const wedgeArea = m0 => {
        let s = 0;
        const pts = [{ x:0, y:0 }];
        for(let i = 0; i <= 200; i++) pts.push(pos(m0 + 0.55 * i / 200));
        for(let i = 0; i < pts.length; i++){
          const A = pts[i], B = pts[(i + 1) % pts.length];
          s += A.x * B.y - B.x * A.y;
        }
        return Math.abs(s) / 2;
      };
      const A1 = wedgeArea(0.2), A2 = wedgeArea(Math.PI - 0.1);
      const rp = a * (1 - e), ra = a * (1 + e);
      return `<div class="card tight"><div class="ttl">Equal areas, measured</div>
        ${kv('wedge near perihelion', fmtNum(A1, 6))}
        ${kv('wedge near aphelion', fmtNum(A2, 6))}
        ${kv('difference', fmtAgree(A1, A2))}
        ${kv('swept in equal time Δt', fmtNum(0.55, 3) + ' (mean-anomaly units)')}
        <p class="help">Those two numbers agree because the position is obtained by solving Kepler's
        equation <b>M = E − e sin E</b> for the eccentric anomaly — the motion is genuinely uniform in
        <i>area</i>, not in angle, and the picture inherits that rather than being drawn to suggest it.</p>
      </div>
      <div class="card tight"><div class="ttl">The orbit</div>
        ${kv('semi-major a', fmtNum(a, 4))}${kv('eccentricity e', fmtNum(e, 4))}
        ${kv('perihelion a(1−e)', fmtNum(rp, 5))}
        ${kv('aphelion a(1+e)', fmtNum(ra, 5))}
        ${kv('speed ratio v<sub>p</sub>/v_a = (1+e)/(1−e)', fmtNum((1 + e) / (1 - e || 1e-9), 5))}
        <p class="help">Angular momentum <b>L = |r × v|</b> is the same at both ends, so <b>r_p v<sub>p</sub> =
        r_a v_a</b> and the speed ratio is forced. Halley's comet, at e = 0.967, runs 60 times faster at
        perihelion than at aphelion.</p>
      </div>`;
    }
    const C = pcSpaceCur(st);
    const S = pcAccelSplit(C, st.t, C.a, C.c);
    return `<div class="card tight"><div class="ttl">The decomposition at t = ${fmtNum(st.t, 4)}</div>
      ${kv('speed |v|', fmtNum(S.speed, 5))}
      ${kv('a_T = (v·a)/|v|', fmtNum(S.aT, 5))}
      ${kv('a_N = κ|v|²', fmtNum(S.aN, 5))}
      ${kv('κ', fmtNum(S.kappa, 6))}
      ${kv('|a|', fmtNum(S.mag, 5))}
      ${kv('a_T² + a_N² − |a|²', fmtGap(S.residual, S.mag * S.mag))}
      ${kv('component along B', fmtNum(vdot(S.frame.dd, S.frame.B), 3))}
      <p class="help">The last two rows are the content of the theorem. The residual is zero because T and
      N span the acceleration completely, and the B-component is zero because they do so on their own —
      acceleration never leaves the osculating plane.</p>
    </div>
    <div class="card tight"><div class="ttl">Reading the two parts</div>
      ${kv('is the speed changing?', Math.abs(S.aT) < 1e-6 ? 'no — a_T = 0, this is uniform-speed motion' : (S.aT > 0 ? 'speeding up' : 'slowing down'))}
      ${kv('is the path turning?', S.aN < 1e-6 ? 'no — straight here' : 'yes, radius ' + fmtNum(1 / S.kappa, 5))}
      <p class="help">A car's accelerator and brake control a_T; its steering wheel controls a_N. They are
      different physical quantities that happen to share a name, and a great deal of confusion in
      elementary mechanics comes from not separating them.</p>
    </div>`;
  },
  chip(st){
    if(st.scene === 'proj') return `<div class="k">Projectile</div>
      <div style="color:var(--c-grad)">t = ${fmtNum(st.t, 3)} s</div>`;
    if(st.scene === 'kepler') return `<div class="k">Kepler II</div>
      <div style="color:var(--c-grad)">e = ${fmtNum(st.ecc, 3)}</div>`;
    const S = pcAccelSplit(pcSpaceCur(st), st.t, pcSpaceCur(st).a, pcSpaceCur(st).c);
    return `<div class="k">a_T and a_N</div>
      <div style="color:var(--c-grad)">a_T = ${fmtNum(S.aT, 4)}</div>
      <div style="color:var(--c-pos)">a_N = ${fmtNum(S.aN, 4)}</div>`;
  },
  /* One legend per scene. The three scenes draw entirely different things, and a
     fixed key named a_T and a_N over the Kepler picture — which has no such
     arrows anywhere on it — is a caption for a different diagram. */
  legend(st){
    if(st && st.scene === 'kepler')
      return [['var(--c-warn)', 'the wedge swept near perihelion'],
              ['var(--c-pos)', 'the wedge swept near aphelion — equal area, equal time'],
              ['var(--c-curl)', 'the radius vector from the focus'],
              ['var(--faint)', 'the orbit']];
    if(st && st.scene === 'proj')
      return [['var(--c-grad)', 'a_T — the speeding-up part, and the path so far'],
              ['var(--c-pos)', 'a_N — the turning part'],
              ['var(--c-warn)', 'g — the total acceleration, unchanging'],
              ['var(--c-curl)', 'the velocity']];
    return [['var(--c-grad)', 'a_T — the speeding-up part'], ['var(--c-pos)', 'a_N — the turning part'],
            ['var(--c-warn)', 'the total acceleration'], ['var(--c-curl)', 'the velocity']];
  }
};
