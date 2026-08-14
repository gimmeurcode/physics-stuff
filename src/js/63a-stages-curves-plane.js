/* ============================================================================
   4g · THE CURVES & MOTION WING
   Parametric equations, polar coordinates, conic sections, vector-valued
   functions, the Frenet frame, and motion in space.
   ============================================================================ */

/* ---- the reader's own curve -------------------------------------------------
   A preset carries hand-written f, d and dd. A typed curve gets all three from
   the same symbolic differentiator the rest of the laboratory uses, so the
   velocity, the speed, the curvature and the cusp hunt are all exact for the
   curve the reader wrote rather than estimated from samples.

   The parameter is written t, which pkParamAst rewrites before parsing because
   the engine reserves t for the animation clock. */
const PC_OWN = [{ k:'x', label:'x(t) =', vars:'t, a', def:'a*cos(t) + cos(3*t)', build:pkParamBuild },
                { k:'y', label:'y(t) =', vars:'t, a', def:'a*sin(t) - sin(3*t)', build:pkParamBuild }];
const PC_OWN_BOUNDS = [{ k:'t0', label:'t from', def:0 }, { k:'t1', label:'t to', def:2 * Math.PI }];
const PC_OWN_HELP = 'Two functions of <b>t</b>. Write <b>a</b> anywhere and it becomes the live slider ' +
  'below, so <b>a*cos(t)</b> responds to it; use plain numbers if you would rather it did not. Both ' +
  'are differentiated symbolically, twice, so the tangent, the curvature and the cusps are exact ' +
  'rather than estimated from samples.';
function pcCur(st){
  if(st.key !== 'custom') return PC_PARAM[st.key];
  const own = pkOwn(st, 'pcown', PC_OWN, PC_OWN_BOUNDS);
  const C = pkCurve2(own.x, own.y);          // compiled once per formula, then cached
  return { name:'(' + own.x + ',  ' + own.y + ')',
           x:own.x, y:own.y, t0:+own.t0, t1:+own.t1, a:1, b:1,
           f:C.f, d:C.d, dd:C.dd,
           note:'Your curve. Everything reported about it — the velocity, the speed, dy/dx, the second ' +
                'derivative and the curvature — comes from differentiating what you typed symbolically, ' +
                'not from sampling it. The dark red dots still mark every t where r′ = 0, so a cusp of ' +
                'your own making is found the same way the cycloid\'s is.' };
}

/* ---- 1 · parametric curves in the plane ----------------------------------- */
STAGES.pcParam = {
  title:'Parametric curves',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Describing a path by where you are at each instant',
      steps:[
        drvSay('why y = f(x) is not enough',
          'A function gives one height per x, so it can never describe a circle, a loop, or anything that doubles back. Parametrising escapes that entirely: give x and y each as functions of a third variable, and the curve is free to go wherever it likes, including crossing itself.'),
        drvStep('the curve as a moving point',
          `${dv('r')}(${dv('t')}) ${dop('=')} (${dv('x')}(${dv('t')}), ${dv('y')}(${dv('t')}))`,
          `at t = ${n(st.t)} the marker sits where the panel reports`),
        drvSay('the parameter is usually time, and thinking of it that way pays',
          'The curve is the trace of a moving point. Then the derivative is a velocity, its magnitude is a speed, and arc length is distance travelled. Every formula in this stage is a statement about that motion, which makes them memorable rather than arbitrary.'),
        drvStep('the derivative is a velocity vector, tangent to the path',
          `${dv('r')}′(${dv('t')}) ${dop('=')} (${dv('x')}′, ${dv('y')}′)`,
          'the panel draws it, and its direction is the tangent'),
        drvStep('the slope comes from dividing the two rates',
          `${dfrac('d' + dv('y'), 'd' + dv('x'))} ${dop('=')} ${dfrac(dv('y') + '′(' + dv('t') + ')', dv('x') + '′(' + dv('t') + ')')}`,
          'the chain rule, with dt cancelling — and it fails exactly where x′ = 0'),
        drvSay('and that failure is a real feature of the curve',
          'Where x′ = 0 the motion is momentarily vertical, so the slope is undefined — a vertical tangent. The cycloid has cusps where both derivatives vanish at once, and the point genuinely stops and reverses. The formula reporting trouble there is the formula being right.'),
        drvStep('speed is the length of the velocity',
          `|${dv('r')}′| ${dop('=')} √(${dv('x')}′² ${dop('+')} ${dv('y')}′²)`,
          'and arc length is its integral — distance is the integral of speed'),
        drvStep('so arc length is an ordinary integral',
          `${dv('L')} ${dop('=')} ∫ √(${dv('x')}′² ${dop('+')} ${dv('y')}′²) d${dv('t')}`,
          st.show.len ? 'the panel accumulates this as the point moves' : ''),
        drvSay('and the same curve can be walked at many speeds',
          'Reparametrising changes r′ but not the shape. Arc length is unaffected, because a faster traversal compresses dt by exactly the factor the speed grows. Quantities that depend only on the shape — length, curvature — are called geometric; those depending on the schedule are not.')
      ],
      note:'The arc length shown is accumulated by numerical quadrature of the speed along the actual path, not from a closed form. For the cycloid it converges on exactly 8a per arch, which is a satisfying and genuinely non-obvious result.'
    };
  },
  enter(st, o){
    st.key = o.key || 'cycloid';
    const C = pcCur(st);
    st.a = C.a; st.b = C.b || 1;
    st.t = o.t === undefined ? (C.t0 + C.t1) * 0.35 : o.t;
    st.run = o.run !== false;
    st.show = Object.assign({ tangent:true, vel:true, len:true, rev:false }, o.show || {});
  },
  controls(){
    const st = ST, C = pcCur(st);
    return pkSeg('pcPK', PC_PARAM, st.key) + pkBoxes('pcown', st.key, st, PC_OWN, PC_OWN_BOUNDS, PC_OWN_HELP) +
      ctlRow('t', ctlSlider('pcPt', C.t0, C.t1, (C.t1 - C.t0) / 2000, st.t)) +
      ctlRow('a', ctlSlider('pcPa', 0.3, 3, 0.02, st.a)) +
      `<div class="row wrap">${ctChk('pcPrun', 'trace it as t runs', st.run)}
        ${ctChk('pcPtan', 'the tangent line', st.show.tangent)}
        ${ctChk('pcPvel', 'the velocity r′(t)', st.show.vel)}
        ${ctChk('pcPrev', 'revolve about the x-axis', st.show.rev)}</div>
      <p class="help"><b>x = ${C.x} , y = ${C.y}</b><br>${C.note}</p>
      <p class="help">A parametrisation is a <i>journey</i>, not a set of points: the same track can be run
      at different speeds and in different directions, and the calculus knows the difference.
      <b>dy/dx = (dy/dt)/(dx/dt)</b> is the chain rule solved for the slope, and it is undefined exactly
      where the journey stops — which is why cusps appear where they do.</p>`;
  },
  wire(){
    ctWireSeg('pcPK', v => {
      ST.key = v; const C = pcCur(ST);
      ST.a = C.a; ST.b = C.b || 1; ST.t = (C.t0 + C.t1) * 0.35;
    });
    pkWireBoxes('pcown', ST.key, ST, PC_OWN, PC_OWN_BOUNDS,
      () => { const C = pcCur(ST); ST.t = Math.min(Math.max(ST.t, C.t0), C.t1); });
    wireSlider('pcPt', () => ST.t, v => { ST.t = v; ST.run = false; const c = $('pcPrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    wireSlider('pcPa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    ctWireChk('pcPrun', v => { ST.run = v; });
    ctWireChk('pcPtan', v => { ST.show.tangent = v; });
    ctWireChk('pcPvel', v => { ST.show.vel = v; });
    ctWireChk('pcPrev', v => { ST.show.rev = v; });
  },
  frame(st, dt, ctx, W, H){
    const C = pcCur(st);
    if(st.run){
      st.t += dt * (C.t1 - C.t0) * 0.13;
      if(st.t > C.t1) st.t = C.t0;
    }
    /* frame the curve around whatever it actually occupies */
    const pts = ctSample(t => C.f(t, st.a, st.b), C.t0, C.t1, 900);
    let mx = 0, cx = 0, cy = 0, n = 0;
    for(const p of pts) if(Number.isFinite(p.x) && Number.isFinite(p.y)){ cx += p.x; cy += p.y; n++; }
    cx /= (n || 1); cy /= (n || 1);
    for(const p of pts) if(Number.isFinite(p.x)) mx = Math.max(mx, Math.abs(p.x - cx), Math.abs(p.y - cy));
    const P = ctBox(W, H, cx, cy, Math.max(0.8, mx * 1.18));
    ctGrid(ctx, P);
    ctFrame(ctx, P, C.name + '  —  the curve, and the point at t = ' + fmtNum(st.t, 3));
    if(st.show.rev){
      /* the mirror image, which is what revolution sweeps through the plane */
      ctPath(ctx, P, pts.map(p => ({ x:p.x, y:-p.y })), rgbCss(TH.faint, 0.5), 1.2, [4, 4]);
    }
    ctPath(ctx, P, pts, rgbCss(TH.faint, 0.65), 1.5);
    /* the part already traced, in full colour */
    ctPath(ctx, P, ctSample(t => C.f(t, st.a, st.b), C.t0, st.t, 600), rgbCss(TH.grad), 2.4);
    const p = C.f(st.t, st.a, st.b), d = C.d(st.t, st.a, st.b);
    const sp = Math.hypot(d.x, d.y);
    if(st.show.tangent && sp > 1e-9){
      const s = (P.x1 - P.x0) * 0.42 / sp;
      ctPath(ctx, P, [{ x:p.x - d.x * s, y:p.y - d.y * s }, { x:p.x + d.x * s, y:p.y + d.y * s }],
             rgbCss(TH.warn, 0.85), 1.5, [6, 4]);
    }
    if(st.show.vel){
      const s = Math.min(1, (P.x1 - P.x0) * 0.22 / Math.max(1e-6, sp));
      ctArrow(ctx, P, p.x, p.y, p.x + d.x * s, p.y + d.y * s, rgbCss(TH.curl), 2.6, "r′(t)");
    }
    ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.grad), rgbCss(TH.bg));
    /* mark every point where the speed vanishes — the cusps */
    const stops = nqRoots(t => {
      const dd = C.d(t, st.a, st.b);
      return dd.x * dd.x + dd.y * dd.y - 1e-12;
    }, C.t0, C.t1, 900, 1e-12);
    for(const ts of stops){
      const q = C.f(ts, st.a, st.b);
      ctDot(ctx, P, q.x, q.y, 4, rgbCss(TH.neg, 0.9), rgbCss(TH.bg));
    }
    stageNote(ctx, 'dark red dots mark where r′(t) = 0 — the only places a smooth parametrisation can make a corner', W, H);
  },
  readout(st){
    const C = pcCur(st);
    const p = C.f(st.t, st.a, st.b), d = C.d(st.t, st.a, st.b), dd = C.dd(st.t, st.a, st.b);
    const sp = Math.hypot(d.x, d.y);
    const L = pcArcLength(C, st.a, st.b, C.t0, C.t1);
    const Ls = pcArcLength(C, st.a, st.b, C.t0, st.t);
    const kap = pcCurvature2(C, st.t, st.a, st.b);
    const rev = st.show.rev ? pcSurfaceRev(C, st.a, st.b, C.t0, Math.min(C.t1, C.t0 + Math.PI * 2), 'x') : null;
    return `<div class="card tight"><div class="ttl">At t = ${fmtNum(st.t, 4)}</div>
      ${kv('(x, y)', ctVec2(p))}
      ${kv('dx/dt', fmtNum(d.x, 5))}${kv('dy/dt', fmtNum(d.y, 5))}
      ${kv('dy/dx = (dy/dt)/(dx/dt)', Math.abs(d.x) < 1e-9 ? 'vertical tangent — no slope' : fmtNum(d.y / d.x, 5))}
      ${kv('d²y/dx²', Math.abs(d.x) < 1e-9 ? '—' : fmtNum(pcSlope2(C, st.t, st.a, st.b), 5))}
      ${kv('concavity', Math.abs(d.x) < 1e-9 ? '—' : (pcSlope2(C, st.t, st.a, st.b) > 0 ? 'up' : 'down'))}
      ${kv('speed |r′|', fmtNum(sp, 5))}
      ${kv('curvature κ', Number.isFinite(kap) ? fmtNum(kap, 5) : '∞ — a cusp')}
      <p class="help">The second derivative is <b>not</b> (d²y/dt²)/(d²x/dt²) — that is the commonest
      error in the subject. It is the t-derivative of the <i>slope</i>, divided by dx/dt once more, which
      works out to <b>(x′y″ − y′x″)/x′³</b>. The numerator is the same cross product that gives the
      curvature; the denominator is what makes it a rate with respect to x.</p>
    </div>
    <div class="card tight"><div class="ttl">Arc length</div>
      ${kv('L = ∫√(x′²+y′²) dt', fmtNum(L, 6))}
      ${kv('length so far', fmtNum(Ls, 6))}
      ${kv('fraction traced', fmtNum(100 * Ls / (L || 1), 4) + '%')}
      ${rev !== null ? kv('surface of revolution about x', fmtNum(rev, 6)) : ''}
      <p class="help">Arc length is the integral of speed, which is Pythagoras applied to an infinitesimal
      step: <b>ds² = dx² + dy²</b>. It is independent of how the curve is parametrised — run the same track
      twice as fast and the integral compensates exactly — which is the sense in which length belongs to
      the curve rather than to the journey.</p>
    </div>`;
  },
  chip(st){
    const C = pcCur(st), p = C.f(st.t, st.a, st.b);
    return `<div class="k">${C.name}</div><div style="color:var(--c-grad)">t = ${fmtNum(st.t, 3)}</div>
      <div>${ctVec2(p, 3)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the curve, as far as t'], ['var(--faint)', 'the rest of it'],
                    ['var(--c-curl)', "r′(t) — velocity"], ['var(--c-warn)', 'the tangent line'],
                    ['var(--c-neg)', 'where r′ = 0']]; }
};

/* ---- 2 · polar coordinates ------------------------------------------------- */
STAGES.pcPolar = {
  title:'Polar coordinates',
  derive(st){
    return {
      title:'Curves described by how far out, at each angle',
      steps:[
        drvStep('the coordinates',
          `${dv('x')} ${dop('=')} ${dv('r')}cos θ, &nbsp; ${dv('y')} ${dop('=')} ${dv('r')}sin θ`,
          'and a polar curve gives r as a function of θ'),
        drvSay('which shapes become simple, and which become worse',
          'A circle about the origin is r = a, and a spiral is r = aθ. Both are painful in Cartesian form. A straight line, trivial in Cartesian coordinates, becomes r = d/cos(θ − α). Coordinates are a choice, and the right choice depends entirely on where the symmetry is.'),
        drvStep('area is swept by triangles, not measured by rectangles',
          `d${dv('A')} ${dop('=')} ${dfrac('1', '2')}${dv('r')}² dθ`,
          st.show.sweep ? 'the panel sweeps and accumulates this as θ advances' : ''),
        drvSay('the half and the square both come from the shape of the element',
            'A thin polar sector is very nearly a triangle with base r dθ and height r, so its area is ½·r·(r dθ). That is why the formula carries a ½ and an r² where a Cartesian area element carries neither — and it is the same geometric factor that becomes r dr dθ in double integrals.'),
        drvStep('so enclosed area is an integral in θ',
          `${dv('A')} ${dop('=')} ${dfrac('1', '2')}∫ ${dv('r')}² dθ`,
          'the panel computes it and compares with the closed form where one exists'),
        drvStep('arc length carries an extra term',
          `${dv('L')} ${dop('=')} ∫ √(${dv('r')}² ${dop('+')} (d${dv('r')}/dθ)²) dθ`,
          'motion has a tangential part r dθ and a radial part dr, and Pythagoras combines them'),
        drvSay('the two terms are the two ways of moving',
          'Swinging round at fixed radius covers r dθ. Moving straight out at fixed angle covers dr. They are perpendicular, so the total is the square root of the sum of squares — the formula is Pythagoras in polar clothing.'),
        drvSay('and negative r is a convention worth knowing',
          'When r comes out negative the point is plotted in the opposite direction. That is why a rose curve r = a·cos(kθ) has k petals when k is odd and 2k when it is even: for odd k the negative-r passes retrace petals already drawn, and for even k they fall in the gaps.')
      ],
      note:'The swept area is accumulated numerically as the angle advances, so what is drawn is the running integral. For the cardioid it converges on 6πa²/4 and for a circle on πa² — both printed against their closed forms.'
    };
  },
  enter(st, o){
    st.key = o.key || 'cardioid';
    const C = pcPolarCur(st);
    st.a = C.a; st.k = C.k;
    st.t = o.t === undefined ? C.t0 : o.t;
    st.run = o.run !== false;
    st.show = Object.assign({ sweep:true, grid:true, ray:true }, o.show || {});
  },
  controls(){
    const st = ST, C = pcPolarCur(st);
    return pkSeg('pcQK', PC_POLAR, st.key, e => e.name.split(' ')[0]) +
      pkBoxes('pcpol', st.key, st, PC_POLAR_OWN, null) +
      ctlRow('θ', ctlSlider('pcQt', C.t0, C.t1, (C.t1 - C.t0) / 2000, st.t)) +
      ctlRow('a', ctlSlider('pcQa', 0.1, 3, 0.02, st.a)) +
      (st.key === 'rose' ? ctlRow('k (petals)', ctlSlider('pcQk', 1, 9, 1, st.k)) : '') +
      `<div class="row wrap">${ctChk('pcQrun', 'sweep θ', st.run)}
        ${ctChk('pcQsw', 'shade the swept area', st.show.sweep)}
        ${ctChk('pcQg', 'the polar grid', st.show.grid)}</div>
      <p class="help"><b>${C.name}</b> — ${C.note}</p>
      <p class="help">The area swept is <b>½∫r²dθ</b> and not ∫y dx: the element is a thin <i>triangle</i>
      with apex at the origin, of area ½·r·(r dθ), not a thin rectangle. Sweep θ and watch the shaded
      region and the running total grow together.</p>`;
  },
  wire(){
        ctWireSeg('pcQK', v => { ST.key = v; const C = pcPolarCur(ST); ST.a = C.a; ST.k = C.k; ST.t = C.t0; });
    pkWireBoxes('pcpol', ST.key, ST, PC_POLAR_OWN, null);
    wireSlider('pcQt', () => ST.t, v => { ST.t = v; ST.run = false; const c = $('pcQrun'); if(c) c.checked = false; },
      v => ctDeg(+v));
    wireSlider('pcQa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('pcQk', () => ST.k, v => { ST.k = Math.round(v); }, v => String(Math.round(v)));
    ctWireChk('pcQrun', v => { ST.run = v; });
    ctWireChk('pcQsw', v => { ST.show.sweep = v; });
    ctWireChk('pcQg', v => { ST.show.grid = v; });
  },
  frame(st, dt, ctx, W, H){
    const C = pcPolarCur(st);
    if(st.run){ st.t += dt * (C.t1 - C.t0) * 0.16; if(st.t > C.t1) st.t = C.t0; }
    const F = th => C.f(th, st.a, st.k, 1);
    const pt = th => { const r = F(th); return Number.isFinite(r) ? pcPolarPt(r, th) : { x:NaN, y:NaN }; };
    const all = ctSample(pt, C.t0, C.t1, 1200);
    let mx = 0.6;
    for(const p of all) if(Number.isFinite(p.x)) mx = Math.max(mx, Math.abs(p.x), Math.abs(p.y));
    const P = ctBox(W, H, 0, 0, mx * 1.16);
    /* the polar grid: circles of constant r, rays of constant θ */
    if(st.show.grid){
      ctx.save(); ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
      const step = ctNiceStep(mx * 2);
      ctx.strokeStyle = rgbCss(TH.line, 0.8); ctx.lineWidth = 0.7;
      for(let r = step; r <= mx * 1.6; r += step){
        ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), r * P.u, 0, 6.2832); ctx.stroke();
      }
      for(let i = 0; i < 12; i++){
        const t = i * Math.PI / 6;
        ctx.beginPath(); ctx.moveTo(P.X(0), P.Y(0));
        ctx.lineTo(P.X(mx * 1.6 * Math.cos(t)), P.Y(mx * 1.6 * Math.sin(t))); ctx.stroke();
      }
      ctx.restore();
    } else ctGrid(ctx, P);
    ctFrame(ctx, P, C.name);
    if(st.show.sweep){
      const swept = [{ x:0, y:0 }].concat(ctSample(pt, C.t0, st.t, 500)).filter(p => Number.isFinite(p.x));
      if(swept.length > 2) ctFill(ctx, P, swept, rgbCss(TH.grad, 0.16));
    }
    ctPath(ctx, P, all, rgbCss(TH.faint, 0.55), 1.4);
    ctPath(ctx, P, ctSample(pt, C.t0, st.t, 700), rgbCss(TH.grad), 2.4);
    const r = F(st.t), p = pt(st.t);
    if(Number.isFinite(r)){
      ctPath(ctx, P, [{ x:0, y:0 }, p], rgbCss(TH.warn), 2);
      ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.grad), rgbCss(TH.bg));
      /* the tangent, from the product rule on x = r cos θ, y = r sin θ */
      const dr = C.d(st.t, st.a, st.k, 1);
      if(Number.isFinite(dr)){
        const dx = dr * Math.cos(st.t) - r * Math.sin(st.t);
        const dy = dr * Math.sin(st.t) + r * Math.cos(st.t);
        const L = Math.hypot(dx, dy) || 1, s = mx * 0.42 / L;
        ctPath(ctx, P, [{ x:p.x - dx * s, y:p.y - dy * s }, { x:p.x + dx * s, y:p.y + dy * s }],
               rgbCss(TH.curl, 0.85), 1.5, [6, 4]);
      }
    }
    stageNote(ctx, 'r may be negative — that means "this far in the opposite direction", and it is what draws the inner loops', W, H);
  },
  readout(st){
    const C = pcPolarCur(st);
    const r = C.f(st.t, st.a, st.k, 1), dr = C.d(st.t, st.a, st.k, 1);
    const p = pcPolarPt(r, st.t);
    const area = pcPolarArea(C.f, C.t0, st.t, st.a, st.k, 1);
    const total = pcPolarArea(C.f, C.t0, C.t1, st.a, st.k, 1);
    const arc = pcPolarArc(C.f, C.d, C.t0, st.t, st.a, st.k, 1);
    const arcT = pcPolarArc(C.f, C.d, C.t0, C.t1, st.a, st.k, 1);
    const slope = pcPolarSlope(C.f, C.d, st.t, st.a, st.k, 1);
    return `<div class="card tight"><div class="ttl">At θ = ${ctDeg(st.t)}</div>
      ${kv('r(θ)', Number.isFinite(r) ? fmtNum(r, 5) : 'no real value here')}
      ${kv('dr/dθ', Number.isFinite(dr) ? fmtNum(dr, 5) : '—')}
      ${kv('(x, y) = (r cos θ, r sin θ)', ctVec2(p))}
      ${kv('dy/dx', Number.isFinite(slope) ? fmtNum(slope, 5) : 'vertical')}
      <p class="help">The slope is <i>not</i> dr/dθ. Both x and y depend on θ through r <b>and</b> through
      the trigonometric factor, so the product rule gives
      <b>dy/dx = (r′ sinθ + r cosθ)/(r′ cosθ − r sinθ)</b>. At the origin, where r = 0, this collapses to
      tan θ — the curve leaves the pole along the ray it arrived on.</p>
    </div>
    <div class="card tight"><div class="ttl">Area and arc length</div>
      ${kv('swept area  ½∫r²dθ', fmtNum(area, 6))}
      ${kv('total area over the full range', fmtNum(total, 6))}
      ${kv('arc so far  ∫√(r²+r′²) dθ', fmtNum(arc, 6))}
      ${kv('total arc length', fmtNum(arcT, 6))}
      <p class="help">The arc-length integrand is Pythagoras in polar clothing: a step has a radial part
      <b>dr</b> and a transverse part <b>r dθ</b>, at right angles, so <b>ds² = dr² + r²dθ²</b>. That r is
      the same factor that turns up in the polar area element and in the Jacobian — three appearances of
      one geometric fact.</p>
    </div>`;
  },
  chip(st){
    const C = pcPolarCur(st), r = C.f(st.t, st.a, st.k, 1);
    return `<div class="k">${C.name.split(' ')[0]}</div>
      <div style="color:var(--c-grad)">r = ${Number.isFinite(r) ? fmtNum(r, 4) : '—'}</div>
      <div>θ = ${ctDeg(st.t)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the curve so far, and the swept area'],
                    ['var(--c-warn)', 'the radius r at θ'], ['var(--c-curl)', 'the tangent line']]; }
};

/* ---- 3 · conic sections ---------------------------------------------------- */
STAGES.pcConic = {
  title:'Conic sections',
  derive(st){
    const n = v => fmtNum(v, 6);
    const e = st.e;
    return {
      title:'One definition, one parameter, and all three curves',
      steps:[
        drvSay('three curves that look unrelated, and are not',
          'Ellipse, parabola and hyperbola are usually met as three separate equations with three separate sets of properties. They are one family, distinguished by a single number, and the definition that makes that obvious is the focus–directrix one.'),
        drvStep('the defining property',
          `${dfrac('distance to the focus', 'distance to the directrix')} ${dop('=')} ${dv('e')}`,
          `eccentricity e = ${n(e)}`),
        drvStep('in polar coordinates about the focus, this is one line of algebra',
          `${dv('r')} ${dop('=')} ${dfrac(dv('e') + dv('p'), '1 + ' + dv('e') + ' cos θ')}`,
          `p = ${n(st.p)} — the panel draws the curve this produces`),
        drvSay('now vary e and watch the type change',
          `e < 1 keeps the denominator positive for every angle, so r stays finite and the curve closes into an ellipse. At e = 1 the denominator vanishes at θ = π and the curve escapes — a parabola. For e > 1 it vanishes at two angles, and the curve breaks into two branches with asymptotes. Here e = ${n(e)}, giving ${e < 0.999 ? 'an ellipse' : e > 1.001 ? 'a hyperbola' : 'a parabola'}.`),
        drvStep('so the classification is a single inequality',
          `${dv('e')} ${dop('<')} 1 ellipse, ${dop('=')} 1 parabola, ${dop('>')} 1 hyperbola`,
          'and a circle is the special case e = 0, where the directrix retreats to infinity'),
        drvSay('and the name "conic section" is the other way of seeing it',
          'Slice a double cone with a plane. Tilt the plane gradually and the section passes through circle, ellipse, parabola and hyperbola in turn. The eccentricity is a measure of that tilt relative to the cone\'s slope — one continuous family, cut two different ways.'),
        drvStep('the polar form is the one orbital mechanics uses',
          `${dv('r')} ${dop('=')} ${dfrac(dv('a') + '(1 − ' + dv('e') + '²)', '1 + ' + dv('e') + ' cos θ')}`,
          'because the focus is where the Sun is — that is why this form, and not the Cartesian one'),
        drvSay('which is why Kepler\'s first law is a statement about e',
          'Solving the inverse-square two-body problem produces exactly this equation. Planets have e < 1 and return; some comets have e slightly under 1 and take millennia; an interstellar visitor has e > 1 and never comes back. The number that classifies a conic classifies an orbit.'),
        drvSay('and e is really an energy in disguise',
          'Work the orbit problem through and the eccentricity comes out as e = √(1 + 2EL²/mk²), with E the total energy. Negative energy — bound — forces e < 1 and an ellipse; exactly zero gives e = 1 and a parabola, the marginal escape; positive energy gives e > 1 and a hyperbola. So the geometric classification and the physical one are the same statement, and "escape velocity" is the speed at which an ellipse becomes a parabola.'),
        drvSay('the general second-degree equation is the third way in, and it is the most general',
          'Focus-and-directrix builds a conic from a definition; slicing a cone builds it from geometry; Ax² + Bxy + Cy² + Dx + Ey + F = 0 covers every one of them <b>including</b> the rotated and off-centre cases the other two constructions have to be told about. The discriminant B² − 4AC classifies it, and the sign of that expression is unchanged by rotating the axes — which is why it can classify at all. Type your own coefficients into the box and the panel computes both it and the 3×3 determinant that separates the genuine conics from the degenerate pairs of lines.')
      ],
      note:'The panel draws the directrix, both foci and the asymptotes where they exist, all computed from e and p rather than drawn for a chosen case. Sliding e continuously through 1 shows the second focus and the far branch arriving from infinity.'
    };
  },
  enter(st, o){
    st.e = o.e === undefined ? 0.6 : o.e;
    st.p = o.p === undefined ? 1.6 : o.p;
    st.view = o.view || 'polar';
    st.th = 0.9;
    st.show = Object.assign({ dir:true, foci:true, asym:true }, o.show || {});
  },
  controls(){
    const st = ST;
    if(st.view === 'general'){
      const G = pcConicCur(st);
      return ctSeg('pcCV', st.view, [['polar', 'focus–directrix'], ['cone', 'slicing a cone'],
                                     ['general', 'type your own  Ax²+Bxy+Cy²+Dx+Ey+F']]) +
        pkBoxes('pccon', 'custom', st, PC_CONIC_OWN, PC_CONIC_BOUNDS,
          'The general second-degree equation, which can produce a conic that is rotated, off-centre, ' +
          'or degenerate — none of which the focus–directrix form on the other tab can reach. ' +
          'The curve is traced from the equation itself and the classification is computed, not assumed.') +
        `<p class="help"><b>${G.kind}</b> — ${G.note}</p>` +
        `<p class="help">The two numbers that decide it are the <b>discriminant B² − 4AC</b>, which
        separates ellipse from parabola from hyperbola, and the <b>3×3 determinant</b>, which is zero
        exactly when the conic is degenerate — a point, or a pair of lines. A classification by the
        discriminant alone calls x² − y² = 0 a hyperbola when it is really two crossing lines, which
        is why both are printed.</p>`;
    }
    return ctSeg('pcCV', st.view, [['polar', 'focus–directrix'], ['cone', 'slicing a cone'],
                                   ['general', 'type your own  Ax²+Bxy+Cy²+Dx+Ey+F']]) +
      ctlRow('eccentricity e', ctlSlider('pcCe', 0, 2.4, 0.005, st.e)) +
      ctlRow('p  (focus to directrix)', ctlSlider('pcCp', 0.4, 3, 0.02, st.p)) +
      ctlRow('θ', ctlSlider('pcCth', 0, 6.2832, 0.01, st.th)) +
      `<div class="row wrap">${ctChk('pcCd', 'the directrix, and the two distances', st.show.dir)}
        ${ctChk('pcCf', 'foci and axes', st.show.foci)}
        ${ctChk('pcCa', 'asymptotes', st.show.asym)}</div>
      <p class="help">Every conic is one definition with one number turned: the set of points whose
      distance to a <b>focus</b> is <b>e</b> times the distance to a <b>directrix</b>. Below e = 1 the
      curve closes into an ellipse; at exactly 1 it escapes as a parabola; above 1 it opens into a
      hyperbola. Drag e slowly through 1 and watch the far end of the curve run away to infinity and come
      back on the other side.</p>
      <p class="help">The polar form with the focus at the origin is <b>r = ep/(1 + e cos θ)</b>, and it is
      the form that matters in physics: put the Sun at the focus and every orbit — closed, escape, and
      flyby — is this one equation with e set by the energy.</p>`;
  },
  wire(){
    ctWireSeg('pcCV', v => { ST.view = v; });
    pkWireBoxes('pccon', 'custom', ST, PC_CONIC_OWN, PC_CONIC_BOUNDS);
    wireSlider('pcCe', () => ST.e, v => { ST.e = v; }, v => fmtNum(+v, 4));
    wireSlider('pcCp', () => ST.p, v => { ST.p = v; }, v => fmtNum(+v, 3));
    wireSlider('pcCth', () => ST.th, v => { ST.th = v; }, v => ctDeg(+v));
    ctWireChk('pcCd', v => { ST.show.dir = v; });
    ctWireChk('pcCf', v => { ST.show.foci = v; });
    ctWireChk('pcCa', v => { ST.show.asym = v; });
  },
  frame(st, dt, ctx, W, H){
    if(st.view === 'cone') return this.frameCone(st, dt, ctx, W, H);
    if(st.view === 'general') return this.frameGeneral(st, dt, ctx, W, H);
    const e = st.e, p = st.p;
    const D = pcConicData(e, p);
    const half = Math.min(9, Math.max(2.2, (D.kind === 'ellipse' ? D.a * 2.1 : p * 4)));
    const P = ctBox(W, H, D.kind === 'ellipse' ? -D.c * 0.0 : 0, 0, half);
    ctGrid(ctx, P);
    ctFrame(ctx, P, `${pcConicKind(e) === 'circle' ? 'Circle' : PC_CONICS[pcConicKind(e)] ? PC_CONICS[pcConicKind(e)].name : ''}  —  e = ${fmtNum(e, 4)}`);
    /* the curve, drawn from the polar form directly */
    const pt = th => {
      const den = 1 + e * Math.cos(th);
      if(Math.abs(den) < 1e-3) return { x:NaN, y:NaN };
      const r = e === 0 ? p : e * p / den;
      return { x:r * Math.cos(th), y:r * Math.sin(th) };
    };
    ctParam(ctx, P, pt, -Math.PI + 1e-4, Math.PI - 1e-4, 1400, rgbCss(TH.grad), 2.4);
    if(st.show.dir){
      /* the directrix sits at x = p in this placement (focus at the origin) */
      ctPath(ctx, P, [{ x:p, y:-half * 2 }, { x:p, y:half * 2 }], rgbCss(TH.warn), 1.8, [7, 5]);
      ctText(ctx, P.X(p) + 6, P.py + 16, 'directrix  x = p', rgbCss(TH.warn), '600 11px ' + FONT_UI);
      const q = pt(st.th);
      if(Number.isFinite(q.x)){
        ctPath(ctx, P, [{ x:0, y:0 }, q], rgbCss(TH.curl), 2);
        ctPath(ctx, P, [q, { x:p, y:q.y }], rgbCss(TH.pos), 2);
        ctDot(ctx, P, q.x, q.y, 6, rgbCss(TH.grad), rgbCss(TH.bg));
      }
    }
    if(st.show.foci){
      ctDot(ctx, P, 0, 0, 6, rgbCss(TH.neg), rgbCss(TH.bg));
      ctText(ctx, P.X(0) + 8, P.Y(0) - 8, 'focus', rgbCss(TH.neg), '600 11px ' + FONT_UI);
      if(Number.isFinite(D.c) && D.kind !== 'parabola'){
        const x2 = D.kind === 'ellipse' ? -2 * D.c : 2 * D.c;
        ctDot(ctx, P, x2, 0, 6, rgbCss(TH.neg, 0.6), rgbCss(TH.bg));
      }
    }
    if(st.show.asym && D.kind === 'hyperbola' && Number.isFinite(D.asym)){
      const cx = D.c;   /* centre, measured from the focus at the origin */
      for(const s of [1, -1])
        ctPath(ctx, P, [{ x:cx - half * 2, y:s * D.asym * (-half * 2) }, { x:cx + half * 2, y:s * D.asym * (half * 2) }],
               rgbCss(TH.faint, 0.8), 1.2, [5, 5]);
    }
    stageNote(ctx, 'blue: distance to the focus · green: distance to the directrix · their ratio is e, at every point', W, H);
  },
  /* the other picture: where the name comes from */
  /* The general form has no parametrisation, so the curve is traced from the
     equation with the same predictor-corrector the Lagrange stage uses. The
     field of values is painted behind it so that the sign of the quadratic form
     is visible: a reader can see the region where Ax²+Bxy+Cy²+… is negative, and
     the curve as its boundary, which is what a conic section actually is. */
  frameGeneral(st, dt, ctx, W, H){
    const G = pcConicCur(st);
    const P = ctBox(W, H, 0, 0, 4.5);
    const f = (x, y) => G.G.f(x, y);
    ctHeat(ctx, P, f, -12, 12, 60, 0.4, true);
    ctGrid(ctx, P);
    ctFrame(ctx, P, G.eq + '  —  ' + G.kind);
    /* the zero set itself */
    if(G.curve){
      const pts = G.curve.pts;
      ctPath(ctx, P, G.curve.closed ? pts.concat([pts[0]]) : pts, rgbCss(TH.grad), 2.8);
    }
    /* the rotated axes, which is what the xy term costs */
    if(Math.abs(G.B) > 1e-12){
      const c = Math.cos(G.rot), s = Math.sin(G.rot), L = 4.2;
      ctPath(ctx, P, [{ x:-L * c, y:-L * s }, { x:L * c, y:L * s }], rgbCss(TH.warn, 0.75), 1.6, [6, 4]);
      ctPath(ctx, P, [{ x:L * s, y:-L * c }, { x:-L * s, y:L * c }], rgbCss(TH.curl, 0.75), 1.6, [6, 4]);
      ctText(ctx, P.X(L * c * 0.8), P.Y(L * s * 0.8) - 8,
             'axes rotated by ' + fmtNum(G.rot * 180 / Math.PI, 3) + '°', rgbCss(TH.warn),
             '600 11px ' + FONT_UI, 'center');
    }
    stageNote(ctx, G.curve
      ? 'the curve is traced from the equation itself — colour is the value of the quadratic, and the curve is where it is zero'
      : 'no real points in this window — the equation has no solutions here', W, H);
  },
  frameCone(st, dt, ctx, W, H){
    const P = ctBox(W, H, 0, 0, 3.2);
    ctGrid(ctx, P, 1, false);
    ctFrame(ctx, P, 'The cone, sliced — the picture the name comes from');
    /* a double cone in elevation, and the cutting plane at an angle set by e */
    const half = Math.PI / 4;                                  // the cone's half-angle
    const slope = Math.tan(half);
    for(const s of [1, -1]){
      ctPath(ctx, P, [{ x:0, y:0 }, { x:3 * s, y:3 }], rgbCss(TH.faint, 0.9), 1.6);
      ctPath(ctx, P, [{ x:0, y:0 }, { x:3 * s, y:-3 }], rgbCss(TH.faint, 0.9), 1.6);
    }
    /* ellipse-like cross sections drawn as horizontal ticks */
    for(let i = 1; i <= 6; i++){
      const y = i * 0.5;
      ctPath(ctx, P, [{ x:-y, y }, { x:y, y }], rgbCss(TH.line2), 0.8, [3, 3]);
      ctPath(ctx, P, [{ x:-y, y:-y }, { x:y, y:-y }], rgbCss(TH.line2), 0.8, [3, 3]);
    }
    /* the cutting plane: its slope relative to the cone's side decides the conic */
    const m = st.e * slope;
    ctPath(ctx, P, [{ x:-3.2, y:-1.4 - m * -3.2 * 0 + m * (-3.2) }, { x:3.2, y:-1.4 + m * 3.2 }],
           rgbCss(TH.grad), 2.6);
    const k = pcConicKind(st.e);
    ctText(ctx, P.px + P.pw / 2, P.py + P.ph - 16,
      k === 'circle' ? 'plane perpendicular to the axis → circle'
      : k === 'ellipse' ? 'plane less steep than the side → ellipse'
      : k === 'parabola' ? 'plane exactly parallel to the side → parabola'
      : 'plane steeper than the side → hyperbola (it cuts both nappes)',
      rgbCss(TH.dim), '600 12px ' + FONT_UI, 'center');
    stageNote(ctx, 'the eccentricity is the ratio of the plane\'s slope to the cone\'s — that one ratio names the curve', W, H);
  },
  readout(st){
    if(st.view === 'general'){
      const G = pcConicCur(st);
      return `<div class="card tight"><div class="ttl">Your conic, classified</div>
        ${kv('the equation', G.eq)}
        ${kv('discriminant B² − 4AC', fmtNum(G.disc, 6))}
        ${kv('degenerate?', G.degenerate ? 'yes — the 3×3 determinant vanishes' : 'no')}
        ${kv('what it is', G.kind)}
        ${kv('axes rotated by', Math.abs(G.B) < 1e-12 ? 'nothing — B = 0' : fmtNum(G.rot * 180 / Math.PI, 5) + '°')}
        ${kv('points traced', G.curve ? String(G.curve.pts.length) : 'none — no real solutions in the window')}
        ${G.curve ? kv('the traced curve is', G.curve.closed ? 'closed' : 'open — it leaves the window') : ''}
        ${G.curve ? kv('its length inside the window', fmtNum(G.curve.length, 6)) : ''}
      </div>
      <div class="card tight"><div class="ttl">How the verdict was reached</div>
        <p class="help">${G.note}</p>
      </div>
      <div class="card tight"><div class="ttl">Why two tests and not one</div>
        <p class="help">The discriminant alone answers "which of the three shapes", and it is wrong
        whenever the conic has degenerated. <b>x² − y² = 0</b> has B² − 4AC = 4 &gt; 0 and is not a
        hyperbola — it is the two lines y = ±x. The 3×3 determinant of the quadratic form is what
        separates a genuine conic from a collapsed one, so both are computed here and the verdict
        uses both. Set F to 0 with B = 0, A = 1, C = −1 and watch the answer change.</p>
      </div>`;
    }
    const e = st.e, p = st.p, D = pcConicData(e, p);
    const r0 = pcConicPolar(0, e, p), rp = pcConicPolar(Math.PI, e, p);
    const q = (() => { const den = 1 + e * Math.cos(st.th); const r = e === 0 ? p : e * p / den;
      return { r, x:r * Math.cos(st.th), y:r * Math.sin(st.th) }; })();
    const dF = Math.abs(q.r), dD = Math.abs(p - q.x);
    const kind = pcConicKind(e);
    const arc = kind === 'ellipse' ? nqAdaptive(t => Math.hypot(D.a * Math.sin(t), D.b * Math.cos(t)), 0, 2 * Math.PI, 1e-11) : NaN;
    return `<div class="card tight"><div class="ttl">The one definition</div>
      ${kv('e', fmtNum(e, 5))}
      ${kv('kind', kind)}
      ${kv('distance to the focus', fmtNum(dF, 5))}
      ${kv('distance to the directrix', fmtNum(dD, 5))}
      ${kv('their ratio', fmtNum(dF / (dD || 1), 6))}
      <p class="help">Move θ anywhere on the curve and that ratio does not budge. That is the definition
      being satisfied, point by point, rather than a formula being quoted.</p>
    </div>
    <div class="card tight"><div class="ttl">Standard-position data</div>
      ${kv('r at θ = 0  (nearest)', fmtNum(r0, 5))}
      ${kv('r at θ = π  (farthest)', kind === 'ellipse' ? fmtNum(rp, 5) : 'no far vertex — it escapes')}
      ${kv('semi-major a', Number.isFinite(D.a) ? fmtNum(D.a, 5) : '∞')}
      ${kv('semi-minor b', Number.isFinite(D.b) ? fmtNum(D.b, 5) : '∞')}
      ${kv('c = ae', Number.isFinite(D.c) ? fmtNum(D.c, 5) : '∞')}
      ${kind === 'ellipse' ? kv('check b² = a² − c²', fmtNum(D.b * D.b, 5) + ' = ' + fmtNum(D.a * D.a - D.c * D.c, 5)) : ''}
      ${kind === 'hyperbola' ? kv('check b² = c² − a²', fmtNum(D.b * D.b, 5) + ' = ' + fmtNum(D.c * D.c - D.a * D.a, 5)) : ''}
      ${kind === 'hyperbola' ? kv('asymptote slope ±b/a', fmtNum(D.asym, 5)) : ''}
      ${kv('latus rectum', Number.isFinite(D.latus) ? fmtNum(D.latus, 5) : fmtNum(2 * p, 5))}
    </div>
    ${kind === 'ellipse' ? `<div class="card tight"><div class="ttl">The perimeter nobody can write down</div>
      ${kv('numerical arc length', fmtNum(arc, 8))}
      ${kv("Ramanujan's approximation", fmtNum(pcEllipsePerimApprox(D.a, D.b), 8))}
      ${kv('difference', fmtAgree(arc, pcEllipsePerimApprox(D.a, D.b)))}
      <p class="help">The ellipse's arc-length integral is elliptic — it is <i>the</i> elliptic integral,
      and it has no elementary antiderivative. An entire branch of nineteenth-century mathematics grew out
      of that failure. Ramanujan's 1914 approximation is accurate to about one part in 10⁸ for moderate
      eccentricities, and the readout checks it.</p>
    </div>` : ''}`;
  },
  chip(st){
    if(st.view === 'general'){
      const G = pcConicCur(st);
      return `<div class="k">${G.kind}</div>
        <div style="color:var(--c-grad)">B² − 4AC = ${fmtNum(G.disc, 4)}</div>`;
    }
    return `<div class="k">${pcConicKind(st.e)}</div>
      <div style="color:var(--c-grad)">e = ${fmtNum(st.e, 4)}</div>`;
  },
  legend(){ if(ST && ST.view === 'general')
      return [['var(--c-grad)', 'the traced curve  Ax²+Bxy+Cy²+Dx+Ey+F = 0'],
              ['var(--c-warn)', 'the rotated major axis'], ['var(--c-curl)', 'the rotated minor axis']];
    return [['var(--c-grad)', 'the conic'], ['var(--c-warn)', 'the directrix'],
                    ['var(--c-curl)', 'distance to the focus'], ['var(--c-pos)', 'distance to the directrix'],
                    ['var(--c-neg)', 'the foci']]; }
};

/* ---- 4 · space curves ------------------------------------------------------ */
