STAGES.opGeom = {
  title:'Reflection, refraction & lenses',
  derive(st){
    const n = v => fmtNum(v, 6);
    const th2 = Math.asin(Math.max(-1, Math.min(1, st.n1 * Math.sin(st.th1) / st.n2)));
    return {
      title:'Light takes the quickest route, and everything follows',
      steps:[
        drvSay('one principle instead of two laws',
          'Reflection and refraction are usually given as separate rules. Fermat\'s principle produces both: light travels between two points by the path taking the least time. That is a statement about the whole journey, and the local laws are what it implies.'),
        drvStep('minimise the travel time across a boundary',
          `${dv('t')} ${dop('=')} ${dfrac('√(' + dv('a') + '² + ' + dv('x') + '²)', dv('v') + '₁')} ${dop('+')} ${dfrac('√(' + dv('b') + '² + (' + dv('d') + '−' + dv('x') + ')²)', dv('v') + '₂')}`,
          'a one-variable optimisation, exactly the kind the derivatives wing handles'),
        drvStep('set the derivative to zero',
          `${dfrac('sin θ₁', dv('v') + '₁')} ${dop('=')} ${dfrac('sin θ₂', dv('v') + '₂')}`,
          'the sines appear because each is x over a hypotenuse'),
        drvStep('and with n = c/v that is Snell\'s law',
          `${dv('n')}₁ sin θ₁ ${dop('=')} ${dv('n')}₂ sin θ₂`,
          `${n(st.n1)} × sin ${n(st.th1 * 180 / Math.PI)}° gives θ₂ = ${n(th2 * 180 / Math.PI)}°`),
        drvSay('the refractive index is a slowness, not a mysterious property',
          'n is simply c divided by the speed of light in the material. Light bends towards the normal on entering a slower medium because spending less distance in the slow region saves more time than the extra distance in the fast one costs. The lifeguard running along the beach before swimming solves the same problem.'),
        drvStep('going the other way, the equation can run out of solutions',
          `sin θ₂ ${dop('=')} ${dfrac(dv('n') + '₁', dv('n') + '₂')} sin θ₁ ${dop('>')} 1`,
          st.n1 > st.n2 ? `critical angle ${n(Math.asin(st.n2 / st.n1) * 180 / Math.PI)}°` : 'only possible going from dense to less dense'),
        drvSay('and that impossibility is total internal reflection',
          'When the formula demands a sine greater than one there is no refracted ray, and everything reflects. Optical fibres, prismatic binoculars and the sparkle of a diamond all depend on this — a law failing to have a solution is doing useful work.'),
        drvStep('the thin lens formula is Snell applied twice, with small angles',
          `${dfrac('1', dv('f'))} ${dop('=')} ${dfrac('1', dv('d') + '_o')} ${dop('+')} ${dfrac('1', dv('d') + '_i')}`,
          `f = ${n(st.f)} m, object at ${n(st.dobj)} m — the panel traces the rays and finds the image`),
        drvSay('and the sign conventions are where the errors live',
          'A negative image distance means a virtual image on the same side as the object, which is what a magnifying glass produces. The panel traces actual rays and lets them cross where they cross, so the virtual case appears as diverging rays traced backwards rather than as a sign to remember.'),
        drvStep('two of the three principal rays are enough',
          `parallel ${dop('→')} through the focus; through the centre ${dop('→')} undeviated`,
          'their intersection locates the image, which is why ray diagrams work at all')
      ],
      note:'The rays are traced by applying Snell\'s law at each surface, not by drawing the standard construction. The image location found by the traced rays is printed against the thin-lens formula, so the approximation\'s error is visible when the angles stop being small.'
    };
  },
  enter(st, o){
    st.mode = o.mode || 'lens';
    st.setup = o.setup || 'converging';
    st.n1 = 1; st.n2 = 1.333; st.th1 = 40 * Math.PI / 180;
    st.f = 0.2; st.dobj = 0.35; st.hobj = 0.09;
    st.rx = o.rx || '* radius   thickness   index after\n  60      4      1.5168\n -60      0      1';
    st.rxErr = ''; st.apr = o.apr || 12; st.sobj = o.sobj || 300;
  },
  /* the reader's own lens, parsed once per panel build */
  sys(st){
    const P = opParsePrescription(st.rx);
    if(!P.ok) return { ok:false, errs:P.errs };
    const M = opSysMatrix(P.surf, 1);
    const SA = opSpherical(P.surf, st.apr, 1);
    let zL = 0;
    for(let i = 0; i < P.surf.length - 1; i++) zL += P.surf[i].t || 0;
    return { ok:true, surf:P.surf, M, SA, zLast:zL, im:M.image(st.sobj) };
  },
  controls(){
    const st = ST;
    const seg = ctSeg('opGm', st.mode, [['refract', 'refraction & TIR'], ['lens', 'lenses & mirrors'],
                                        ['system', 'design your own lens']]);
    if(st.mode === 'system'){
      const S = STAGES.opGeom.sys(st);
      return seg +
        `<div class="fld" style="align-items:stretch">
          <textarea id="opRx" rows="6" spellcheck="false" autocomplete="off"
            aria-label="lens prescription — radius, thickness, index, one surface per line"
            data-audit="* a cemented doublet&#10; 61.47   6.0   1.5168&#10;-44.64   2.5   1.6727&#10;-129.94  0     1"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.rx)}</textarea>
        </div>
        <div class="row wrap"><button class="btn sm pri" id="opRxGo">Build it</button></div>
        ${ctlRow('aperture ±', ctlSlider('opRxA', 1, 30, 0.5, st.apr))}
        ${ctlRow('object at', ctlSlider('opRxO', 60, 4000, 10, st.sobj))}
        <p class="help" id="opRxMsg" style="color:${st.rxErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.rxErr ||
          'One surface per line: <b>radius&nbsp; thickness&nbsp; index</b>, all in millimetres. The radius is ' +
          'positive when the centre of curvature lies to the <b>right</b>, <b>inf</b> means a flat surface, the ' +
          'thickness is the gap to the next surface, and the index is that of whatever lies <i>behind</i> it — ' +
          'so the last line must end in <b>1</b> to let the light back out into air. This is the format lens ' +
          'data has been published in for a century.'}</p>
        <p class="help">Two calculations run on whatever you write, and the interesting thing is where they
        disagree. The <b>paraxial</b> one multiplies out a ray-transfer matrix, which is the thin-lens formula
        with the thickness put back; the <b>real</b> one traces finite rays through the actual spheres with
        Snell's law and no approximation. The gap between them is <b>spherical aberration</b>, and it is why a
        camera lens has six pieces of glass in it. Try the doublet — three lines — against the singlet.</p>`;
    }
    if(st.mode === 'refract'){
      return seg + ctSeg('opGa', String(st.n1), Object.keys(OP_MEDIA).slice(0, 5).map(k => [String(OP_MEDIA[k].n), OP_MEDIA[k].name])) +
        ctSeg('opGb', String(st.n2), Object.keys(OP_MEDIA).slice(0, 6).map(k => [String(OP_MEDIA[k].n), OP_MEDIA[k].name])) +
        ctlRow('incidence', ctlSlider('opGth', 0, 89, 0.5, st.th1 * 180 / Math.PI)) +
        `<p class="help"><b>n₁ sin θ₁ = n₂ sin θ₂</b>. Light bends towards the normal on entering a denser
        medium and away on leaving one — and if it would have to bend past 90°, it cannot leave at all.
        That is <b>total internal reflection</b>, and it is why an optical fibre works and why a diamond
        sparkles: with n = 2.42 its critical angle is only 24°, so almost everything that gets in bounces
        around until it leaves through a facet.</p>
        <p class="help">The law is not fundamental. <b>Fermat's principle</b> — light takes the path of
        stationary travel time — implies it in one line, and the panel finds the crossing point by
        <i>scanning for the minimum time</i> and then checks that Snell's law holds there. Nothing about
        Snell is assumed in that calculation.</p>`;
    }
    return seg + ctSeg('opGs', st.setup, Object.keys(OP_SETUPS).map(k => [k, OP_SETUPS[k].name])) +
      ctlRow('object distance', ctlSlider('opGd', 0.05, 0.9, 0.005, st.dobj)) +
      ctlRow('focal length', ctlSlider('opGf', -0.4, 0.4, 0.005, st.f)) +
      `<p class="help">${OP_SETUPS[st.setup].note}</p>
      <p class="help">One equation covers every lens and every mirror: <b>1/f = 1/d_o + 1/d_i</b> with
      <b>m = −d_i/d_o</b>. The sign convention does all the work — f positive converging, d_i positive
      real, m positive upright. The three principal rays drawn are the standard construction, and they
      meet at the point the equation predicts.</p>
      <p class="help">Drag the object through the focal point and watch the image flip from real and
      inverted to virtual and upright, passing through infinity on the way. That divergence is not a
      failure of the formula: an object exactly at the focus produces parallel rays that never converge.</p>`;
  },
  wire(){
    ctWireSeg('opGm', v => { ST.mode = v; });
    if(ST.mode === 'system'){
      const apply = () => {
        const box = $('opRx'); if(!box) return;
        ST.rx = box.value;
        const P = opParsePrescription(ST.rx);
        ST.rxErr = P.ok ? '' :
          '⚠ ' + P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
          '<br><span style="color:var(--faint)">The previous lens is still shown.</span>';
        if(P.ok) ST.rxOK = ST.rx;
        const msg = $('opRxMsg');
        if(msg){ msg.innerHTML = ST.rxErr || ('Built: ' + P.surf.length + ' surface' +
          (P.surf.length === 1 ? '' : 's') + ', focal length ' + fmtNum(opSysMatrix(P.surf, 1).efl, 5) + ' mm.');
          msg.style.color = ST.rxErr ? 'var(--c-neg)' : 'var(--faint)'; }
        refreshStageReadout(); updateStageChip();
      };
      const b = $('opRx'); if(b) b.addEventListener('change', apply);
      const g = $('opRxGo'); if(g) g.addEventListener('click', apply);
      wireSlider('opRxA', () => ST.apr, v => { ST.apr = v; }, v => fmtNum(+v, 3) + ' mm');
      wireSlider('opRxO', () => ST.sobj, v => { ST.sobj = v; }, v => fmtNum(+v, 4) + ' mm');
    }
    ctWireSeg('opGa', v => { ST.n1 = +v; });
    ctWireSeg('opGb', v => { ST.n2 = +v; });
    ctWireSeg('opGs', v => { ST.setup = v; ST.f = OP_SETUPS[v].f; ST.dobj = OP_SETUPS[v].obj; });
    wireSlider('opGth', () => ST.th1 * 180 / Math.PI, v => { ST.th1 = v * Math.PI / 180; }, v => fmtNum(+v, 3) + '°');
    wireSlider('opGd', () => ST.dobj, v => { ST.dobj = v; }, v => fmtNum(+v * 100, 4) + ' cm');
    wireSlider('opGf', () => ST.f, v => { ST.f = Math.abs(v) < 0.02 ? 0.02 * Math.sign(v || 1) : v; },
      v => fmtNum(+v * 100, 4) + ' cm');
  },
  frame(st, dt, ctx, W, H){
    if(st.mode === 'system'){
      const S = STAGES.opGeom.sys(st);
      if(!S.ok){
        const P0 = ctBox(W, H, 0, 0, 1);
        ctFrame(ctx, P0, 'the prescription does not parse');
        ctText(ctx, W / 2, H / 2, S.errs[0] ? ('line ' + (S.errs[0].line || '?') + ': ' + S.errs[0].msg) : 'no surfaces',
               rgbCss(TH.neg), '600 13px ' + FONT_UI, 'center');
        return;
      }
      /* the picture spans the glass and the focus, with a little air either side */
      const zEnd = S.zLast + (Number.isFinite(S.M.bfd) ? Math.max(S.M.bfd, 10) : 10);
      const span = Math.max(zEnd * 0.62, st.apr * 1.6);
      const P = ctBox(W, H, zEnd * 0.42, 0, span);
      ctFrame(ctx, P, `${S.surf.length} surface${S.surf.length === 1 ? '' : 's'}  ·  f = ${fmtNum(S.M.efl, 5)} mm  ·  back focus ${fmtNum(S.M.bfd, 5)} mm`);
      ctPath(ctx, P, [{ x:-span * 2, y:0 }, { x:span * 2, y:0 }], rgbCss(TH.line2), 1.4);
      /* the glass, surface by surface */
      let zv = 0;
      const arcs = [];
      for(const s of S.surf){
        const h = Number.isFinite(s.R) ? Math.min(st.apr, Math.abs(s.R) * 0.98) : st.apr;
        const pts = [];
        for(let i = 0; i <= 40; i++){
          const y = -h + 2 * h * i / 40;
          pts.push({ x:Number.isFinite(s.R) ? zv + s.R - Math.sign(s.R) * Math.sqrt(Math.max(0, s.R * s.R - y * y)) : zv, y });
        }
        arcs.push(pts);
        ctPath(ctx, P, pts, rgbCss(TH.curl), 2.4);
        zv += s.t || 0;
      }
      /* fill each element between consecutive surfaces, so the glass reads as glass */
      for(let i = 0; i + 1 < S.surf.length; i++){
        if(Math.abs(S.surf[i].n - 1) < 1e-9) continue;              // that gap is air
        ctFill(ctx, P, arcs[i].concat(arcs[i + 1].slice().reverse()), rgbCss(TH.curl, 0.10));
      }
      /* the rays: a fan from a point on the axis, traced exactly */
      const N = 9;
      let lost = 0;
      for(let k = 0; k < N; k++){
        const h = st.apr * (k - (N - 1) / 2) / ((N - 1) / 2);
        if(Math.abs(h) < 1e-9) continue;
        const u = Number.isFinite(st.sobj) ? Math.atan2(-h, st.sobj) : 0;
        const r = opTraceRay(S.surf, h - Math.tan(u) * 20, u, -20, 1);
        if(!r.ok){ lost++; continue; }
        const pts = r.path.slice();
        const far = Number.isFinite(r.cross) ? Math.min(r.cross, span * 3) : span * 3;
        pts.push({ z:r.z + far * Math.cos(r.u), y:r.y + far * Math.sin(r.u) });
        ctPath(ctx, P, pts.map(q => ({ x:q.z, y:q.y })),
               rgbCss(Math.abs(h) > st.apr * 0.7 ? TH.warn : TH.pos, 0.85), 1.5);
      }
      /* the paraxial focus, and where the marginal ray really lands */
      if(Number.isFinite(S.M.bfd)){
        ctPath(ctx, P, [{ x:S.zLast + S.M.bfd, y:-st.apr * 0.55 }, { x:S.zLast + S.M.bfd, y:st.apr * 0.55 }],
               rgbCss(TH.pos, 0.8), 1.4, [5, 4]);
        ctText(ctx, P.X(S.zLast + S.M.bfd), P.Y(st.apr * 0.62), 'paraxial focus',
               rgbCss(TH.pos), '600 10.5px ' + FONT_MONO, 'center');
      }
      if(Number.isFinite(S.SA.marginal)){
        ctPath(ctx, P, [{ x:S.zLast + S.SA.marginal, y:-st.apr * 0.4 }, { x:S.zLast + S.SA.marginal, y:st.apr * 0.4 }],
               rgbCss(TH.warn, 0.8), 1.4, [5, 4]);
        ctText(ctx, P.X(S.zLast + S.SA.marginal), P.Y(-st.apr * 0.5), 'edge rays',
               rgbCss(TH.warn), '600 10.5px ' + FONT_MONO, 'center');
      }
      stageNote(ctx, lost
        ? lost + ' of the ' + N + ' rays never got through — widen the radii, or narrow the aperture'
        : 'the edge rays (amber) cross the axis short of the paraxial focus — that gap is spherical aberration, and it is real, not a drawing error', W, H);
      return;
    }
    if(st.mode === 'refract'){
      const S = opSnell(st.n1, st.th1, st.n2);
      const P = ctBox(W, H, 0, 0, 1.5);
      ctFrame(ctx, P, `n₁ = ${fmtNum(st.n1, 5)}  →  n₂ = ${fmtNum(st.n2, 5)}`);
      ctFill(ctx, P, [{ x:-2, y:0 }, { x:2, y:0 }, { x:2, y:2 }, { x:-2, y:2 }], rgbCss(TH.curl, 0.08));
      ctFill(ctx, P, [{ x:-2, y:-2 }, { x:2, y:-2 }, { x:2, y:0 }, { x:-2, y:0 }], rgbCss(TH.grad, 0.16));
      ctPath(ctx, P, [{ x:-2, y:0 }, { x:2, y:0 }], rgbCss(TH.faint), 2.4);
      ctPath(ctx, P, [{ x:0, y:-1.4 }, { x:0, y:1.4 }], rgbCss(TH.faint, 0.6), 1.4, [4, 4]);
      /* the incident ray */
      const L = 1.25;
      ctArrow(ctx, P, -L * Math.sin(st.th1), L * Math.cos(st.th1), 0, 0, rgbCss(TH.warn), 2.6, null);
      /* the reflected ray, always present */
      ctPath(ctx, P, [{ x:0, y:0 }, { x:L * Math.sin(st.th1), y:L * Math.cos(st.th1) }],
             rgbCss(TH.neg, S.tir ? 1 : 0.5), S.tir ? 3 : 1.8);
      if(!S.tir)
        ctPath(ctx, P, [{ x:0, y:0 }, { x:L * Math.sin(S.th2), y:-L * Math.cos(S.th2) }], rgbCss(TH.grad), 3);
      /* the angle arcs */
      ctArcAngle(ctx, P, 0, 0, 46, Math.PI / 2, Math.PI / 2 + st.th1, rgbCss(TH.warn, 0.7), 1.4);
      if(!S.tir) ctArcAngle(ctx, P, 0, 0, 46, -Math.PI / 2, -Math.PI / 2 + S.th2, rgbCss(TH.grad, 0.7), 1.4);
      ctText(ctx, P.X(0) - 62, P.Y(0.55), 'θ₁ = ' + ctDeg(st.th1), rgbCss(TH.warn), '600 11px ' + FONT_MONO);
      if(!S.tir) ctText(ctx, P.X(0) + 14, P.Y(-0.55), 'θ₂ = ' + ctDeg(S.th2), rgbCss(TH.grad), '600 11px ' + FONT_MONO);
      else ctText(ctx, P.X(0) + 14, P.Y(-0.4), 'total internal reflection', rgbCss(TH.neg), '700 12px ' + FONT_UI);
      if(Number.isFinite(S.critical)){
        for(const s of [-1, 1])
          ctPath(ctx, P, [{ x:0, y:0 }, { x:s * 1.35 * Math.sin(S.critical), y:1.35 * Math.cos(S.critical) }],
                 rgbCss(TH.faint, 0.7), 1.4, [5, 4]);
      }
      stageNote(ctx, 'the dashed rays mark the critical angle — beyond it nothing gets through', W, H);
      return;
    }
    const S = OP_SETUPS[st.setup];
    const R = opRays(st.f, st.dobj, st.hobj);
    const span = Math.max(st.dobj, Math.abs(Number.isFinite(R.im.di) ? R.im.di : 0), Math.abs(st.f) * 3) * 1.25;
    const P = ctBox(W, H, 0, 0, span);
    ctFrame(ctx, P, S.name + `   —   ${R.im.kind}`);
    ctPath(ctx, P, [{ x:-span * 1.6, y:0 }, { x:span * 1.6, y:0 }], rgbCss(TH.line2), 1.6);
    /* the lens or mirror */
    ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(P.X(0), P.Y(0), Math.abs(st.f) * 0.12 * P.u + 4, span * 0.34 * P.u, 0, 0, 6.2832);
    ctx.stroke();
    for(const s of [-1, 1]){
      ctDot(ctx, P, s * Math.abs(st.f), 0, 4, rgbCss(TH.warn), rgbCss(TH.bg));
      ctText(ctx, P.X(s * Math.abs(st.f)), P.Y(0) + 16, 'F', rgbCss(TH.warn), '600 11px ' + FONT_UI, 'center');
    }
    /* the object */
    ctArrow(ctx, P, -st.dobj, 0, -st.dobj, st.hobj, rgbCss(TH.grad), 3, null);
    /* the three principal rays */
    const cols = [TH.warn, TH.pos, TH.neg];
    [R.parallel, R.through, R.focal].forEach((ray, i) => {
      ctPath(ctx, P, [ray.a, ray.b], rgbCss(cols[i], 0.9), 1.8);
      const far = { x:span * 1.5, y:ray.b.y + (ray.c.y - ray.b.y) * (span * 1.5 - ray.b.x) / ((ray.c.x - ray.b.x) || 1e-9) };
      ctPath(ctx, P, [ray.b, far], rgbCss(cols[i], 0.9), 1.8);
      if(!R.im.real){
        /* virtual: extend backwards as a dashed line */
        const back = { x:-span * 1.5, y:ray.b.y + (ray.c.y - ray.b.y) * (-span * 1.5 - ray.b.x) / ((ray.c.x - ray.b.x) || 1e-9) };
        ctPath(ctx, P, [ray.b, back], rgbCss(cols[i], 0.4), 1.2, [4, 4]);
      }
    });
    if(Number.isFinite(R.im.di) && Math.abs(R.im.di) < span * 1.4)
      ctArrow(ctx, P, R.im.di, 0, R.im.di, R.hi, rgbCss(TH.curl), 3, null);
    stageNote(ctx, 'the three principal rays meet at the image — dashed where the image is virtual', W, H);
  },
  readout(st){
    if(st.mode === 'system'){
      const S = STAGES.opGeom.sys(st);
      if(!S.ok) return `<div class="card tight"><div class="ttl">The prescription does not parse</div>
        ${S.errs.slice(0, 5).map(e => kv(e.line ? 'line ' + e.line : 'the whole thing', esc(e.msg))).join('')}
        <p class="help">Each line is three numbers: <b>radius&nbsp; thickness&nbsp; index</b>. Nothing is drawn
        until every line is readable, because a lens with a missing surface is not a lens with a missing
        surface — it is a different lens.</p></div>`;
      const thinLM = S.surf.length === 2 && Number.isFinite(S.surf[0].R) && Number.isFinite(S.surf[1].R)
        ? opLensMaker(S.surf[0].n, S.surf[0].R, S.surf[1].R) : NaN;
      const rows = S.SA.rows.filter(r => r.ok).map(r =>
        kv('ray at ' + fmtNum(r.h, 3) + ' mm', 'crosses at ' + fmtNum(r.z, 6) + ' mm')).join('');
      return `<div class="card tight"><div class="ttl">First order — the ray-transfer matrix</div>
        ${kv('surfaces', String(S.surf.length))}
        ${kv('effective focal length', '<b>' + fmtNum(S.M.efl, 7) + ' mm</b>')}
        ${kv('back focal distance', fmtNum(S.M.bfd, 7) + ' mm from the last vertex')}
        ${kv('front focal distance', fmtNum(S.M.ffd, 7) + ' mm from the first')}
        ${kv('principal planes H, H′', fmtNum(S.M.p1, 6) + ' mm, ' + fmtNum(S.M.p2, 6) + ' mm')}
        ${Number.isFinite(thinLM) ? kv('the THIN lensmaker value', fmtNum(thinLM, 7) + ' mm') : ''}
        ${Number.isFinite(thinLM) ? kv('what the thickness is worth', fmtNum(S.M.efl - thinLM, 6) + ' mm') : ''}
        <p class="help">Refraction at a surface and travel between surfaces are each a 2×2 matrix acting on a
        ray's (height, angle), so a whole system is one product and every first-order property is read off its
        four entries. This is <b>1/f = 1/d_o + 1/d_i</b> with the thickness put back — the focal length above is
        measured from the <b>principal planes</b>, not from the glass, and those planes are where they are
        rather than where anyone chose them.</p>
      </div>
      <div class="card tight"><div class="ttl">Where the rays actually go</div>
        ${rows}
        ${kv('paraxial focus', fmtNum(S.SA.paraxial, 6) + ' mm')}
        ${kv('edge ray focus', Number.isFinite(S.SA.marginal) ? fmtNum(S.SA.marginal, 6) + ' mm' : 'that ray never got through')}
        ${kv('longitudinal spherical aberration', '<b>' + (Number.isFinite(S.SA.lsa) ? fmtNum(S.SA.lsa, 5) + ' mm' : 'not measurable') + '</b>')}
        <p class="help">Every row is a real ray, put through your surfaces with Snell's law and nothing
        approximated. They do not agree with each other, and the spread is <b>spherical aberration</b> — the
        oldest defect in optics, invisible to every formula in the panels above, and quadratic in aperture, so
        halving the aperture quarters it. It is why a camera lens has six elements: a second piece of glass with
        a different index can be made to cancel most of the first one's. Replace the two lines with the three of
        a cemented doublet and watch this number fall by a factor of eighty.</p>
      </div>
      <div class="card tight"><div class="ttl">Imaging an object ${fmtNum(st.sobj, 5)} mm away</div>
        ${kv('image distance', Number.isFinite(S.im.di) ? fmtNum(S.im.di, 6) + ' mm past the last vertex' : 'at infinity — the object is at the front focus')}
        ${kv('magnification', fmtNum(S.im.m, 6))}
        ${kv('the image is', (S.im.di > 0 ? 'real' : 'virtual') + ', ' + (S.im.m > 0 ? 'upright' : 'inverted') +
             ', ' + (Math.abs(S.im.m) > 1 ? 'magnified' : 'reduced'))}
        <p class="help">Solved by asking the matrix for the distance at which the height stops depending on the
        angle a ray set out with. That condition <i>is</i> what an image is, and it is the same statement as
        1/f = 1/d_o + 1/d_i once the distances are referred to the principal planes.</p>
      </div>`;
    }
    if(st.mode === 'refract'){
      const S = opSnell(st.n1, st.th1, st.n2);
      const F = opFermat(st.n1, st.n2, 1, 1, 2, 6000);
      return `<div class="card tight"><div class="ttl">Snell's law</div>
        ${kv('n₁', fmtNum(st.n1, 6))}${kv('n₂', fmtNum(st.n2, 6))}
        ${kv('θ₁', ctDeg(st.th1))}
        ${kv('θ₂', S.tir ? 'no refracted ray at all' : ctDeg(S.th2))}
        ${kv('n₁ sin θ₁', fmtNum(st.n1 * Math.sin(st.th1), 7))}
        ${kv('n₂ sin θ₂', S.tir ? '—' : fmtNum(st.n2 * Math.sin(S.th2), 7))}
        ${kv('critical angle', Number.isFinite(S.critical) ? ctDeg(S.critical) : 'none — n₂ > n₁')}
        ${kv('speed in medium 1', fmtNum(opSpeed(st.n1) / 1e6, 6) + ' × 10⁶ m/s')}
        ${kv('speed in medium 2', fmtNum(opSpeed(st.n2) / 1e6, 6) + ' × 10⁶ m/s')}
      </div>
      <div class="card tight"><div class="ttl">Fermat's principle, minimised numerically</div>
        ${kv('the crossing point that minimises time', fmtNum(F.x, 6))}
        ${kv('optical path length there', fmtNum(F.opl, 7))}
        ${kv('θ₁ at that point', ctDeg(F.th1))}
        ${kv('θ₂ at that point', ctDeg(F.th2))}
        ${kv('|n₁sinθ₁ − n₂sinθ₂|', fmtNum(F.snellResidual, 4))}
        <p class="help">The routine scans every possible crossing point, computes the travel time for each,
        and keeps the smallest. Snell's law was never used — and yet the winning geometry satisfies it to
        four decimal places. That is Fermat's principle producing the law rather than restating it.</p>
      </div>
      <div class="card tight"><div class="ttl">Consequences</div>
        ${kv('reflectance at normal incidence', fmtNum(100 * opReflectance0(st.n1, st.n2), 4) + '%')}
        ${kv("Brewster's angle", ctDeg(opBrewster(st.n1, st.n2)))}
        ${['water', 'glass', 'diamond'].map(k =>
          kv('critical angle, ' + OP_MEDIA[k].name + ' to air', ctDeg(opCritical(OP_MEDIA[k].n, 1)))).join('')}
        <p class="help">A window reflects about 4% at each surface, which is why a double-glazed pane shows
        four faint images. At Brewster's angle the reflected light is completely polarised — which is what
        polarising sunglasses exploit to kill glare off water.</p>
      </div>`;
    }
    const R = opRays(st.f, st.dobj, st.hobj);
    const rows = [0.06, 0.15, 0.25, 0.5, 0.8].map(d => {
      const I = opImage(st.f, d);
      return kv('object at ' + fmtNum(d * 100, 4) + ' cm',
        Number.isFinite(I.di) ? fmtNum(I.di * 100, 5) + ' cm,  m = ' + fmtNum(I.m, 4) : 'at infinity');
    });
    return `<div class="card tight"><div class="ttl">${OP_SETUPS[st.setup].name}</div>
      ${kv('focal length f', fmtNum(st.f * 100, 5) + ' cm')}
      ${kv('object distance d_o', fmtNum(st.dobj * 100, 5) + ' cm')}
      ${kv('1/f', fmtNum(1 / st.f, 6))}
      ${kv('1/d_o', fmtNum(1 / st.dobj, 6))}
      ${kv('1/d_i = 1/f − 1/d_o', fmtNum(1 / st.f - 1 / st.dobj, 6))}
      ${kv('image distance d_i', Number.isFinite(R.im.di) ? fmtNum(R.im.di * 100, 5) + ' cm' : 'at infinity')}
      ${kv('magnification m = −d_i/d_o', fmtNum(R.im.m, 5))}
      ${kv('image', R.im.kind)}
    </div>
    <div class="card tight"><div class="ttl">Moving the object</div>
      ${rows.join('')}
      <p class="help">Beyond 2f the image is real, inverted and reduced — a camera. Between f and 2f it is
      real, inverted and magnified — a projector. Inside f it flips to virtual, upright and magnified — a
      magnifying glass. All three are the same equation with the object in a different place.</p>
    </div>
    <div class="card tight"><div class="ttl">The three principal rays</div>
      ${kv('parallel in', 'leaves through the far focus')}
      ${kv('through the centre', 'passes undeviated')}
      ${kv('through the near focus', 'leaves parallel')}
      ${kv('do they meet?', Number.isFinite(R.im.di) ? 'yes, at d_i = ' + fmtNum(R.im.di * 100, 5) + ' cm' : 'no — they leave parallel')}
      <p class="help">Any two of the three locate the image; the third is a check. They are not special
      rays physically — every ray from the object point passes through the image point — they are simply
      the three whose paths you can draw without knowing the answer first.</p>
      <p class="help">A thin lens is assumed throughout. Real lenses suffer <b>spherical aberration</b>
      (marginal rays focus closer) and <b>chromatic aberration</b> (blue focuses closer than red, since n
      depends on wavelength), and correcting those is most of what lens design is.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'system'){
      const S = STAGES.opGeom.sys(st);
      if(!S.ok) return `<div class="k">your lens</div><div style="color:var(--c-neg)">the prescription does not parse</div>`;
      return `<div class="k">your lens · ${S.surf.length} surfaces</div>
        <div style="color:var(--c-curl)">f = ${fmtNum(S.M.efl, 5)} mm</div>
        <div style="color:var(--c-warn)">spherical aberration ${Number.isFinite(S.SA.lsa) ? fmtNum(S.SA.lsa, 4) + ' mm' : '—'}</div>`;
    }
    if(st.mode === 'refract'){ const S = opSnell(st.n1, st.th1, st.n2);
      return `<div class="k">refraction</div>
        <div style="color:var(--c-grad)">${S.tir ? 'total internal reflection' : 'θ₂ = ' + ctDeg(S.th2)}</div>`; }
    const I = opImage(st.f, st.dobj);
    return `<div class="k">image</div>
      <div style="color:var(--c-curl)">d_i = ${Number.isFinite(I.di) ? fmtNum(I.di * 100, 5) + ' cm' : '∞'}</div>
      <div>m = ${fmtNum(I.m, 4)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'the incident ray, or the parallel ray'], ['var(--c-grad)', 'the refracted ray, or the object'],
                    ['var(--c-neg)', 'the reflected ray'], ['var(--c-curl)', 'the lens, and the image'],
                    ['var(--c-pos)', 'the central ray']]; },
  dockLegend:true
};

/* ---- 6 · physical optics: interference and diffraction ------------------- */
STAGES.opWave = {
  title:'Interference & diffraction',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Adding waves that arrive out of step',
      steps:[
        drvSay('the experiment that settled what light is',
          'Two slits, one screen, and a pattern of bright and dark bands. Particles arriving through two holes would give two bright patches. Bands can only come from something that adds and cancels — and that is how Young established in 1801 that light is a wave.'),
        drvStep('the extra distance one path travels',
          `Δ ${dop('=')} ${dv('d')} sin θ`,
          `slit separation d = ${n(st.d * 1e6)} µm, wavelength ${n(st.lam * 1e9)} nm`),
        drvStep('bright where that difference is a whole number of wavelengths',
          `${dv('d')} sin θ ${dop('=')} ${dv('m')}λ`,
          'crests arriving together — constructive interference'),
        drvStep('and dark at the half-integers',
          `${dv('d')} sin θ ${dop('=')} (${dv('m')} ${dop('+')} ${dfrac('1', '2')})λ`,
          `fringe spacing on the screen: ${n(st.lam * st.L / st.d * 1000)} mm at L = ${n(st.L)} m`),
        drvSay('the pattern measures a wavelength using a ruler',
          'Light\'s wavelength is far too small to measure directly. The geometry magnifies it: a separation of microns and a screen metres away turn a 550 nm wavelength into millimetre fringes. Interference is the standard technique for measuring anything smaller than the instrument.'),
        drvStep('a single slit of finite width also diffracts',
          `${dv('a')} sin θ ${dop('=')} ${dv('m')}λ gives the minima`,
          `slit width a = ${n(st.a * 1e6)} µm`),
        drvSay('and the condition is a minimum, not a maximum — which surprises people',
          'Divide the slit into two halves. When the path difference across the full width is one wavelength, every point in the top half cancels exactly against a partner in the bottom half. The whole slit destroys itself, which is why aλ = mλ marks darkness rather than brightness.'),
        drvStep('a real two-slit pattern is the product of both',
          `${dv('I')} ${dop('=')} ${dv('I')}₀ cos²(${dfrac('π' + dv('d') + ' sin θ', 'λ')}) ${dop('·')} sinc²(${dfrac('π' + dv('a') + ' sin θ', 'λ')})`,
          'fine interference fringes inside a broad diffraction envelope — the panel computes both'),
        drvSay('and this is what limits every optical instrument',
          'A telescope\'s aperture diffracts, so a point star becomes a disc of angular size about 1.22λ/D. Two stars closer than that cannot be separated no matter how good the optics. Resolution is set by diffraction, which is why large telescopes are large.'),
        drvStep('the same mathematics is the Fourier transform',
          `far-field pattern ${dop('=')} ℱ{aperture}`,
          'a slit transforms to a sinc, a Gaussian beam to a Gaussian — the Fourier wing\'s pairs, appearing as light')
      ],
      note:'The intensity curve is computed by summing the contributions of many points across each slit rather than from the closed formula, so the envelope and the fringes both emerge from the superposition. The closed forms are printed alongside for comparison.'
    };
  },
  enter(st, o){
    st.mode = o.mode || 'double';
    st.d = 1e-4; st.a = 2e-5; st.lam = 550e-9; st.L = 2; st.N = 500;
    st.pol = [0, 45, 90];
    /* the aperture is written in micrometres, because a slit measured in metres
       is 0.00002 and nobody can read that */
    st.apsrc = o.apsrc || '(abs(x) < 20) + (abs(x - 60) < 10) + (abs(x + 60) < 10)';
  },
  /* the reader's aperture, and the pattern it makes */
  aper(st){
    const key = st.apsrc + '|' + st.lam;
    if(st._ak === key) return st._ad;
    st._ak = key;
    const g = pkCompile(st.apsrc);
    const HW = 120e-6;                                  /* ±120 µm of aperture */
    const A = u => { const v = g(u * 1e6, 0, 0); return Number.isFinite(v) ? Math.max(0, v) : 0; };
    st._ad = { A, HW, scan:opDiffractScan(A, HW, st.lam, st.L, 0.05, 420, 1400) };
    return st._ad;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('opWm', st.mode, [['double', 'double slit'], ['single', 'single slit'],
                                         ['grating', 'a grating'], ['polar', 'polarisation'],
                                         ['own', 'cut your own aperture']]);
    if(st.mode === 'own'){
      return seg + fnHtml('opWa', 'transmission at x µm =', st.apsrc, 'x in micrometres') +
        ctlRow('wavelength', ctlSlider('opWl', 400, 700, 1, st.lam * 1e9)) +
        `<p class="help">Every formula on the other four panels — the single slit's sinc², the double
        slit's fringes under that envelope, the grating's sharp orders — is a special case of one
        statement: <b>the far-field pattern is the Fourier transform of the aperture</b>. Each closed form
        exists because somebody did that integral for one shape.</p>
        <p class="help">Here the integral is done numerically for whatever you write, so those formulas
        become predictions rather than results. Write <b>abs(x) &lt; 20</b> for a single slit 40 µm wide
        and the sinc² appears; add a second at 60 µm and the fringes appear under it. The transmission may
        be any non-negative number — try <b>exp(-(x/30)^2)</b> for a soft-edged aperture and watch the
        side lobes vanish, which is the whole idea behind apodisation in telescopes.</p>`;
    }
    if(st.mode === 'polar'){
      return seg + ctlRow('middle filter', ctlSlider('opWp', 0, 90, 1, st.pol[1])) +
        `<p class="help"><b>Malus's law</b>: a polariser passes <b>I₀cos²θ</b>, where θ is the angle
        between its axis and the incoming polarisation. Unpolarised light loses exactly half on the first
        filter, whatever its orientation.</p>
        <p class="help">The three-filter puzzle is the classic: two crossed polarisers pass nothing, and
        <i>inserting a third between them</i> lets light through again. Slide the middle filter and watch
        the output rise from zero to a maximum of I₀/8 at 45°. The third filter does not "unblock" anything
        — it <b>rotates</b> the polarisation in two smaller steps, and cos²45° twice beats cos²90° once.</p>`;
    }
    return seg + ctlRow('wavelength', ctlSlider('opWl', 400, 700, 1, st.lam * 1e9)) +
      (st.mode !== 'single' ? ctlRow('slit separation d', ctlSlider('opWd', 20, 300, 1, st.d * 1e6)) : '') +
      (st.mode !== 'grating' ? ctlRow('slit width a', ctlSlider('opWa', 5, 60, 0.5, st.a * 1e6)) : '') +
      (st.mode === 'grating' ? ctlRow('number of slits', ctlSlider('opWN', 2, 800, 1, st.N)) : '') +
      `<p class="help">${st.mode === 'double'
        ? 'Two slits produce fringes wherever the path difference is a whole number of wavelengths: <b>d sinθ = mλ</b>, giving a spacing <b>λL/d</b> on the screen. But each slit also diffracts, and the single-slit envelope modulates the whole pattern — so some interference orders can be <b>missing</b> entirely, wherever an interference maximum lands on an envelope zero.'
        : st.mode === 'single'
        ? 'A single slit is not a point source. Every part of the opening radiates, and those contributions interfere with each other — destructively when <b>a sinθ = mλ</b>. The central maximum is twice as wide as the others and carries most of the light, and narrowing the slit makes the pattern <i>wider</i>, which is the whole of the diffraction limit in one sentence.'
        : 'A grating is the double slit with N openings instead of two. The maxima sit in the same places — <b>d sinθ = mλ</b> — but each is sharpened by a factor of N, because with many slits it takes only a tiny angular error for the contributions to cancel. That sharpness is the resolving power <b>R = Nm</b>, and it is why gratings and not prisms are used for spectroscopy.'}</p>`;
  },
  wire(){
    ctWireSeg('opWm', v => { ST.mode = v; });
    if(ST.mode === 'own') fnWire('opWa', (m, s) => { ST.apsrc = s; });
    wireSlider('opWl', () => ST.lam * 1e9, v => { ST.lam = v * 1e-9; }, v => fmtNum(+v, 4) + ' nm');
    wireSlider('opWd', () => ST.d * 1e6, v => { ST.d = v * 1e-6; }, v => fmtNum(+v, 4) + ' µm');
    wireSlider('opWa', () => ST.a * 1e6, v => { ST.a = v * 1e-6; }, v => fmtNum(+v, 4) + ' µm');
    wireSlider('opWN', () => ST.N, v => { ST.N = Math.round(v); }, v => Math.round(v) + ' slits');
    wireSlider('opWp', () => ST.pol[1], v => { ST.pol = [0, v, 90]; }, v => fmtNum(+v, 3) + '°');
  },
  frame(st, dt, ctx, W, H){
    if(st.mode === 'own'){
      const D = STAGES.opWave.aper(st);
      /* the aperture itself */
      let amax = 1e-9;
      for(let i = 0; i <= 240; i++) amax = Math.max(amax, D.A(-D.HW + 2 * D.HW * i / 240));
      const hp = (H - 168) * 0.34;
      const PA = mkPlot(74, 44, W - 140, hp, -D.HW * 1e6, D.HW * 1e6, -amax * 0.12, amax * 1.15);
      plotFrame(ctx, PA, '', 'transmission', 'the aperture you cut, in micrometres');
      plotCurve(ctx, PA, u => D.A(u * 1e-6), 420, rgbCss(TH.curl), 2.4);
      ctFill(ctx, PA, ctSample(u => ({ x:u, y:D.A(u * 1e-6) }), -D.HW * 1e6, D.HW * 1e6, 240)
             .concat([{ x:D.HW * 1e6, y:0 }, { x:-D.HW * 1e6, y:0 }]), rgbCss(TH.curl, 0.22));
      /* and its far-field pattern */
      const PB = mkPlot(74, 44 + hp + 54, W - 140, H - (44 + hp + 54) - 62, -50, 50, 0, 1.1);
      plotFrame(ctx, PB, 'position on the screen (mm)', 'relative intensity',
                'the far field — the Fourier transform of what is above it');
      ctGrid(ctx, PB);
      ctPath(ctx, PB, D.scan.rows.map(r => ({ x:r.y * 1000, y:r.I })), rgbCss(TH.grad), 2.4);
      ctFill(ctx, PB, D.scan.rows.map(r => ({ x:r.y * 1000, y:r.I }))
             .concat([{ x:50, y:0 }, { x:-50, y:0 }]), rgbCss(TH.grad, 0.20));
      stageNote(ctx, 'no formula was used for this pattern — the transform integral was evaluated over whatever you wrote above', W, H);
      return;
    }
    if(st.mode === 'polar'){
      const P0 = opPolarisers(1, st.pol.map(a => a * Math.PI / 180));
      const P = ctBox(W, H, 0, 0, 1.6);
      ctFrame(ctx, P, 'three polarisers — and the middle one lets light through');
      st.pol.forEach((a, i) => {
        const x = -1 + i;
        ctFill(ctx, P, [{ x:x - 0.1, y:-0.75 }, { x:x + 0.1, y:-0.75 }, { x:x + 0.1, y:0.75 }, { x:x - 0.1, y:0.75 }],
               rgbCss(TH.curl, 0.22));
        const th = a * Math.PI / 180;
        for(let k = -3; k <= 3; k++)
          ctPath(ctx, P, [{ x:x - 0.1 + 0.6 * Math.cos(th) * 0, y:k * 0.2 }, { x:x + 0.1, y:k * 0.2 }],
                 rgbCss(TH.curl, 0.5), 1);
        ctPath(ctx, P, [{ x:x - 0.42 * Math.sin(th), y:-0.42 * Math.cos(th) },
                        { x:x + 0.42 * Math.sin(th), y:0.42 * Math.cos(th) }], rgbCss(TH.warn), 3);
        ctText(ctx, P.X(x), P.Y(-0.95), fmtNum(a, 3) + '°', rgbCss(TH.dim), '600 11px ' + FONT_UI, 'center');
      });
      /* beam brightness, drawn as thickness and alpha */
      const segs = [[-1.7, -1, 1], [-1, 0, P0.steps[0].I], [0, 1, P0.steps[1].I], [1, 1.7, P0.steps[2].I]];
      for(const [a, b, I] of segs){
        ctx.strokeStyle = rgbCss(TH.grad, Math.max(0.05, I));
        ctx.lineWidth = 2 + 16 * I;
        ctx.beginPath(); ctx.moveTo(P.X(a), P.Y(0)); ctx.lineTo(P.X(b), P.Y(0)); ctx.stroke();
        ctText(ctx, P.X((a + b) / 2), P.Y(0) - 18 - 8 * I, fmtNum(100 * I, 4) + '%',
               rgbCss(TH.grad), '600 11px ' + FONT_MONO, 'center');
      }
      stageNote(ctx, 'the beam thickness is its intensity — remove the middle filter and the output goes to zero', W, H);
      return;
    }
    const yMax = st.mode === 'grating' ? st.L * 0.6 : st.L * st.lam / st.d * 6;
    const hp = (H - 168) * 0.68;
    const P = mkPlot(88, 48, W - 140, hp, -yMax * 1000, yMax * 1000, 0, 1.1);
    plotFrame(ctx, P, 'position on the screen  (mm)', 'intensity',
      st.mode === 'double' ? 'two-slit interference inside the single-slit envelope'
      : st.mode === 'single' ? 'single-slit diffraction' : `${st.N} slits — each maximum sharpened by N`);
    plotTicksX(ctx, P, [-yMax * 1000, 0, yMax * 1000], v => fmtNum(v, 3));
    const I = y => {
      const yy = y / 1000;
      if(st.mode === 'double') return opDoubleSlit(st.d, st.a, st.lam, st.L, yy).I;
      if(st.mode === 'single') return opSingleSlit(st.a, st.lam, Math.atan2(yy, st.L)).I;
      return opGrating(st.d, st.N, st.lam, Math.atan2(yy, st.L)).I;
    };
    if(st.mode === 'double'){
      plotCurve(ctx, P, y => opDoubleSlit(st.d, st.a, st.lam, st.L, y / 1000).env, 900, rgbCss(TH.warn, 0.75), 1.8);
      plotCurve(ctx, P, y => opDoubleSlit(st.d, st.a, st.lam, st.L, y / 1000).interference, 900, rgbCss(TH.faint, 0.4), 1.1);
    }
    plotCurve(ctx, P, I, 1800, rgbCss(TH.grad), 2.2);
    /* the screen, painted in the actual colour */
    const col = OP_COLOURS.reduce((b, c) => Math.abs(c.lam - st.lam * 1e9) < Math.abs(b.lam - st.lam * 1e9) ? c : b, OP_COLOURS[0]);
    const bandY = 48 + hp + 28, bandH = 40;
    for(let px = 0; px < P.pw; px++){
      const y = P.x0 + (P.x1 - P.x0) * px / P.pw;
      const v = Math.max(0, Math.min(1, I(y)));
      ctx.fillStyle = col.css;
      ctx.globalAlpha = v;
      ctx.fillRect(P.px + px, bandY, 1.4, bandH);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.strokeRect(P.px, bandY, P.pw, bandH);
    ctText(ctx, P.px + P.pw / 2, bandY + bandH + 16, 'the screen, in the light\'s own colour',
           rgbCss(TH.faint), '11px ' + FONT_UI, 'center');
    stageNote(ctx, st.mode === 'double'
      ? 'orange: the single-slit envelope · faint: the pure two-slit term · dark: their product, which is what you see'
      : 'the pattern and the screen it makes', W, H);
  },
  readout(st){
    if(st.mode === 'own'){
      const D = STAGES.opWave.aper(st);
      /* the open width and the first minimum — measured from the pattern, then
         compared with what the single-slit formula would predict for that width */
      let open = 0, n = 600;
      for(let i = 0; i <= n; i++) if(D.A(-D.HW + 2 * D.HW * i / n) > 0.5) open += 2 * D.HW / n;
      const rows = D.scan.rows, mid = Math.floor(rows.length / 2);
      let firstMin = null;
      for(let i = mid + 1; i < rows.length; i++)
        if(rows[i].I < 0.02 && rows[i].I < rows[i - 1].I){ firstMin = rows[i].y; break; }
      const predicted = open > 0 ? st.L * Math.tan(Math.asin(Math.min(1, st.lam / open))) : NaN;
      return `<div class="card tight"><div class="ttl">Your aperture</div>
        ${kv('transmission', esc(st.apsrc))}
        ${kv('total open width', fmtNum(open * 1e6, 5) + ' µm')}
        ${kv('wavelength', fmtNum(st.lam * 1e9, 4) + ' nm')}
        ${kv('screen distance', fmtNum(st.L, 3) + ' m')}
      </div>
      <div class="card tight"><div class="ttl">The pattern, and what a formula would say</div>
        ${kv('first minimum, measured', firstMin === null ? 'none within 50 mm' : fmtNum(firstMin * 1000, 5) + ' mm')}
        ${kv('λL/a for that open width', Number.isFinite(predicted) ? fmtNum(predicted * 1000, 5) + ' mm' : '—')}
        <p class="help">The pattern above was obtained by integrating <b>∫A(x)e^(−ikx sinθ)dx</b> over
        whatever you wrote — no formula for a slit, a pair of slits or a grating appears anywhere in that
        calculation. The two rows compare the measured first minimum against what the single-slit
        formula would predict from the total open width. For one rectangular opening they agree; for
        anything else they do not, and the disagreement is the formula being used outside the shape it
        was derived for. That is worth seeing directly, because the formulas are usually met as though
        they were separate laws rather than three integrals of the same kind.</p>
      </div>
      <div class="card tight"><div class="ttl">Why one statement covers all of them</div>
        <p class="help">A single slit gives <b>sinc²</b> because the transform of a rectangle is a sinc.
        Two slits give fringes <i>under</i> that envelope because the transform of two copies is the
        transform of one, multiplied by a cosine — the convolution theorem from the Fourier wing, read
        backwards. A grating sharpens those fringes because N copies give a sum that cancels everywhere
        except at the orders. Cut a soft-edged opening such as <b>exp(-(x/30)^2)</b> and the side lobes
        disappear entirely, because the transform of a Gaussian is a Gaussian and has none — which is
        what apodised telescope masks are for.</p>
      </div>`;
    }
    if(st.mode === 'polar'){
      const P0 = opPolarisers(1, st.pol.map(a => a * Math.PI / 180));
      const crossed = opPolarisers(1, [0, Math.PI / 2]);
      return `<div class="card tight"><div class="ttl">Three filters at ${st.pol.join('°, ')}°</div>
        ${P0.steps.map((s, i) => kv('after filter ' + (i + 1), fmtNum(100 * s.I, 5) + '%')).join('')}
        ${kv('final intensity', fmtNum(100 * P0.I, 5) + '% of the input')}
        ${kv('with the middle filter removed', fmtNum(100 * crossed.I, 5) + '%')}
        ${kv('the best the middle filter can do', fmtNum(100 * 0.125, 4) + '%  at 45°')}
      </div>
      <div class="card tight"><div class="ttl">Malus's law, step by step</div>
        ${kv('unpolarised in, first filter', 'always exactly half — 50%')}
        ${kv('cos²(θ₂ − θ₁)', fmtNum(Math.pow(Math.cos((st.pol[1] - st.pol[0]) * Math.PI / 180), 2), 6))}
        ${kv('cos²(θ₃ − θ₂)', fmtNum(Math.pow(Math.cos((st.pol[2] - st.pol[1]) * Math.PI / 180), 2), 6))}
        ${kv('their product × ½', fmtNum(0.5 * Math.pow(Math.cos((st.pol[1] - st.pol[0]) * Math.PI / 180), 2) *
             Math.pow(Math.cos((st.pol[2] - st.pol[1]) * Math.PI / 180), 2), 6))}
        <p class="help">Two 45° steps give (½)(½) = ¼ of the half that survived the first filter, so I₀/8.
        One 90° step gives cos²90° = 0. The middle filter is not letting through light that was blocked —
        it is <b>changing what is there</b>, projecting the polarisation onto a new axis and discarding the
        rest.</p>
        <p class="help">This is the classical shadow of a deeply quantum fact: measurement in a rotated
        basis destroys the previous answer. The Stern–Gerlach chain in the quantum wing is the identical
        experiment with spin in place of polarisation, and the identical cos² law.</p>
      </div>`;
    }
    const fringe = opFringeSpacing(st.lam, st.L, st.d);
    const single = opSingleSlit(st.a, st.lam, 0);
    const ratio = st.d / st.a;
    return `<div class="card tight"><div class="ttl">The setup</div>
      ${kv('wavelength', fmtNum(st.lam * 1e9, 4) + ' nm')}
      ${st.mode !== 'single' ? kv('slit separation d', fmtNum(st.d * 1e6, 5) + ' µm') : ''}
      ${st.mode !== 'grating' ? kv('slit width a', fmtNum(st.a * 1e6, 5) + ' µm') : ''}
      ${kv('screen distance', fmtNum(st.L, 4) + ' m')}
      ${st.mode !== 'single' ? kv('fringe spacing λL/d', fmtNum(fringe * 1000, 5) + ' mm') : ''}
      ${kv('first single-slit minimum', fmtNum(single.firstMin * 1000, 5) + ' mrad')}
      ${kv('and on the screen', fmtNum(Math.tan(single.firstMin) * st.L * 1000, 5) + ' mm')}
    </div>
    ${st.mode === 'double' ? `<div class="card tight"><div class="ttl">Missing orders</div>
      ${kv('d/a', fmtNum(ratio, 5))}
      ${kv('orders that vanish', Math.abs(ratio - Math.round(ratio)) < 0.05
        ? 'every multiple of ' + Math.round(ratio) : 'none — d/a is not close to a whole number')}
      ${[1, 2, 3, 4, 5].map(m => {
        const y = m * fringe;
        const D = opDoubleSlit(st.d, st.a, st.lam, st.L, y);
        return kv('order ' + m, fmtNum(100 * D.env, 4) + '% of full brightness');
      }).join('')}
      <p class="help">An interference maximum sits at d sinθ = mλ and an envelope zero at a sinθ = pλ. When
      d/a is a whole number those coincide and the order simply is not there — the two slits are trying to
      reinforce at an angle where each slit individually sends no light at all. Set d/a to exactly 5 and
      watch the fifth order disappear.</p>
    </div>` : ''}
    ${st.mode === 'grating' ? `<div class="card tight"><div class="ttl">Resolving power</div>
      ${kv('slits illuminated', String(st.N))}
      ${kv('first-order resolving power R = Nm', String(st.N))}
      ${kv('smallest resolvable Δλ at 550 nm', fmtNum(550 / st.N, 5) + ' nm')}
      ${kv('the sodium doublet is', '0.597 nm apart')}
      ${kv('can this grating split it?', st.N >= 550 / 0.597 ? 'yes' : 'no — it needs about 921 slits in first order')}
      ${kv('angle of the first order', ctDeg(Math.asin(Math.min(1, st.lam / st.d))))}
      ${kv('highest order visible', String(Math.floor(st.d / st.lam)))}
      <p class="help">Doubling the number of illuminated slits halves the width of every line without
      moving any of them. That is why a grating spectrometer's resolution is set by how much of the grating
      the beam covers, and why the sodium D lines are the standard test.</p>
    </div>` : ''}
    <div class="card tight"><div class="ttl">The diffraction limit</div>
      ${kv('a 2 m telescope at this wavelength', fmtNum(opRayleigh(st.lam, 2) * 206265, 5) + ' arcsec')}
      ${kv('the human pupil, 5 mm', fmtNum(opRayleigh(st.lam, 0.005) * 206265 / 60, 5) + ' arcmin')}
      ${kv('narrowing a slit makes the pattern', 'wider — the two are reciprocal')}
      <p class="help">Confining a wave in space spreads it in angle, always, and by an amount inversely
      proportional to the confinement. That is not an optical quirk: it is the Fourier uncertainty relation
      of the Fourier wing, and Δx·Δp ≥ ħ/2 of the quantum wing, written for light.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'own'){
      const D = STAGES.opWave.aper(st);
      let open = 0;
      for(let i = 0; i <= 600; i++) if(D.A(-D.HW + 2 * D.HW * i / 600) > 0.5) open += 2 * D.HW / 600;
      return `<div class="k">your aperture</div>
        <div style="color:var(--c-curl)">${fmtNum(open * 1e6, 4)} µm open</div>
        <div style="color:var(--c-grad)">pattern by transform</div>`;
    }
    if(st.mode === 'polar') return `<div class="k">three filters</div>
      <div style="color:var(--c-grad)">${fmtNum(100 * opPolarisers(1, st.pol.map(a => a * Math.PI / 180)).I, 5)}% through</div>`;
    return `<div class="k">${st.mode === 'double' ? 'fringe spacing' : st.mode === 'single' ? 'first minimum' : 'first order'}</div>
      <div style="color:var(--c-grad)">${st.mode === 'single'
        ? ctDeg(opSingleSlit(st.a, st.lam, 0).firstMin)
        : fmtNum(opFringeSpacing(st.lam, st.L, st.d) * 1000, 5) + ' mm'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the intensity pattern'], ['var(--c-warn)', 'the single-slit envelope, or the filter axis'],
                    ['var(--faint)', 'the pure interference term'], ['var(--c-curl)', 'the polarisers']]; },
  dockLegend:true
};
