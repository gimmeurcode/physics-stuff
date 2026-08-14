/* ============================================================================
   4r · COMPLEX FUNCTIONS AND CONTOUR INTEGRALS
   ============================================================================ */

/* domain colouring: hue is the argument, lightness bands mark the modulus.
   It is the only honest way to draw a function of a complex variable — the
   graph would need four dimensions.

   NOTHING in this picture changes unless f or the window does, so it is built
   once into an offscreen bitmap and blitted thereafter. Drawn cell by cell it
   cost one fillRect, one fillStyle string parse and one complex evaluation PER
   CELL PER FRAME: auditperf measured cxMap at 14 427 rasterising calls a frame
   and cxContourInt at 10 024. It is now one drawImage and the pixels are
   recomputed only on a genuine change.

   The cache is one entry deep on purpose — one stage is on screen at a time,
   and the identity of f is enough to key it: CX_FUNCS entries are singletons
   and cxOwnCur returns the same object for the same typed source, so a new
   function reference IS a new scenario. */
const CX_PAINT_CACHE = { key:'', f:null, cv:null };
function cxPaintBitmap(P, f, N){
  /* every input the pixels depend on, and nothing that they do not — the pixel
     SIZE of the box is deliberately absent, because scaling the blit covers a
     resize without recomputing a single value of f */
  const key = N + '|' + P.x0 + '|' + P.x1 + '|' + P.y0 + '|' + P.y1;
  if(CX_PAINT_CACHE.f === f && CX_PAINT_CACHE.key === key) return CX_PAINT_CACHE.cv;
  let cv = CX_PAINT_CACHE.cv;
  if(!cv || cv.width !== N){
    cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
  }
  const c2 = cv.getContext('2d');
  const img = c2.createImageData(N, N), d = img.data;
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
    const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / N;
    const y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / N;
    const v = f({ re:x, im:y });
    /* row 0 of an ImageData is the TOP row, while j counts upward from y0 */
    const o = 4 * ((N - 1 - j) * N + i);
    /* left transparent where f has no finite value, exactly as the cell-by-cell
       version skipped the fillRect and let the background through */
    if(!v || !Number.isFinite(v.re) || !Number.isFinite(v.im)) continue;
    const arg = Math.atan2(v.im, v.re), mod = Math.hypot(v.re, v.im);
    /* hsl2rgb takes the hue in DEGREES — its `h/30` is the standard formula's
       sector index. This passed the fraction in [0, 1), so the hue never left
       the first hundredth of a degree and every picture in the wing came out
       monochrome red while the caption, the help text and four demos all said
       the hue was the argument. Nothing could see it: the numbers were finite,
       the readout was right, and the modulus bands made the picture look
       plausible. Only the screenshot showed it. */
    const hue = (((arg / (2 * Math.PI)) + 1) % 1) * 360;
    /* bands at each power of two of |f| — the contour lines of the modulus */
    const band = Math.log2(mod + 1e-12);
    const l = 0.34 + 0.20 * (band - Math.floor(band));
    const c = hsl2rgb(hue, 0.62, Math.max(0.08, Math.min(0.82, l)));
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  c2.putImageData(img, 0, 0);
  CX_PAINT_CACHE.key = key; CX_PAINT_CACHE.f = f; CX_PAINT_CACHE.cv = cv;
  return cv;
}
function cxPaint(ctx, P, f, cells){
  const N = cells || 110;
  const cv = cxPaintBitmap(P, f, N);
  ctx.save();
  /* nearest-neighbour keeps the flat cells the fillRect version drew; smoothing
     would interpolate across the modulus bands and blur the very edges the
     picture exists to show */
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, 0, 0, N, N, P.px, P.py, P.pw, P.ph);
  ctx.restore();
}

STAGES.cxMap = {
  title:'Complex functions',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why complex differentiability is a far stronger demand than real',
      steps:[
        drvSay('the definition looks identical, and is not',
          'The derivative is still the limit of (f(z+h) − f(z))/h. The difference is that h is now complex, so it can approach zero from infinitely many directions — and the limit must be the same for every one of them. In one real dimension there were two directions; here there are infinitely many, and requiring them all to agree is a severe constraint.'),
        drvStep('approach along the real axis',
          `${dv('f')}′ ${dop('=')} ${dv('u')}ₓ ${dop('+')} ${dop('i')}${dv('v')}ₓ`,
          'h real, so the quotient differentiates in x'),
        drvStep('now approach along the imaginary axis',
          `${dv('f')}′ ${dop('=')} ${dfrac('1', dop('i'))}(${dv('u')}_y ${dop('+')} ${dop('i')}${dv('v')}_y) ${dop('=')} ${dv('v')}_y ${dop('−')} ${dop('i')}${dv('u')}_y`,
          'dividing by i rotates by a quarter turn, which is where the swap comes from'),
        drvStep('the two must be equal, so match real and imaginary parts',
          `${dv('u')}ₓ ${dop('=')} ${dv('v')}_y , &nbsp; ${dv('u')}_y ${dop('=')} ${dop('−')}${dv('v')}ₓ`,
          'the Cauchy–Riemann equations — the panel evaluates both residuals at the probe'),
        drvSay('two directions were enough to force everything',
          'Having imposed agreement along just two directions, all the others follow automatically. That is why the Cauchy–Riemann equations are only two equations yet capture the whole condition.'),
        drvStep('differentiate them again and both parts are harmonic',
          `${dv('u')}ₓₓ ${dop('+')} ${dv('u')}_yy ${dop('=')} 0`,
          'from u_xx = v_yx and u_yy = −v_xy, which cancel by equality of mixed partials'),
        drvSay('so complex analysis and potential theory are the same subject',
          'Every analytic function hands you two harmonic functions for free. That is why conformal mapping solves problems in electrostatics, ideal fluid flow and steady heat conduction — all governed by Laplace\'s equation, and all transportable by any analytic map.'),
        drvStep('and the map is conformal wherever the derivative is nonzero',
          `angles are preserved, orientation too`,
          `at the probe z = ${n(st.z.re)} + ${n(st.z.im)}i, the panel shows a small grid before and after`),
        drvSay('because multiplication by a complex number is a rotation and a scaling',
          'Near a point, f behaves like multiplication by f′(z). A complex number acts on the plane by rotating through its argument and scaling by its modulus — and neither of those changes angles. Conformality is not an extra property; it is what complex multiplication does.'),
        drvSay('and analyticity has consequences with no real analogue',
          'An analytic function is automatically infinitely differentiable, is determined everywhere by its values on any small disc, and cannot have an interior maximum of modulus. Real differentiable functions have none of these properties. That is the payoff for demanding agreement in every direction.')
      ],
      note:'The stage colours the plane by the value of f, so the argument is hue and the modulus is brightness. Zeros and poles are visible as points where all hues meet, and the number of times the colour wheel wraps is the order — which the next stage turns into the residue theorem.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key || 'sq';
    st.z = { re:0.8, im:0.5 };
  },
  controls(){
    const st = ST;
    return pkSeg('cmK', CX_FUNCS, st.key, e => e.n) +
      pkBoxes('cxown', st.key, st, CX_OWN, null,
        'A complex function is two real ones: f = u + iv. Write them separately and the panel will ' +
        'check the Cauchy-Riemann equations for you — symbolically, and across the whole window — so ' +
        'whether your f is holomorphic is something you find out rather than something you are told. ' +
        'Try <b>x</b> and <b>-y</b>, which is the conjugate, and watch it fail.') +
      `<p class="help">A complex function cannot be graphed — the graph would live in four
      dimensions — so it is <b>domain-coloured</b> instead: the hue at each point is the argument of
      f(z) and the brightness bands are its modulus. A zero is a point where all hues meet and the
      picture goes dark; a pole is where they meet and it goes bright. The number of times the
      colours cycle round such a point is its order.</p>
      <p class="help"><b>Drag the probe.</b> A function is <b>analytic</b> at z when it has a
      derivative there as a function of z, which forces the Cauchy–Riemann equations
      <b>u<sub>x</sub> = v<sub>y</sub></b> and <b>u<sub>y</sub> = −v<sub>x</sub></b>. The panel
      measures both residuals: for z̄ they are large, and no amount of smoothness helps.</p>`;
  },
  wire(){ pkWire('cmK', 'cxown', ST.key, ST, CX_OWN, null, v => { ST.key = v; }); },
  pick(st, sx, sy, phase){
    if(!st.P || phase === 'up' || !st.P.inside(sx, sy)) return;
    st.z = { re:st.P.invX(sx), im:st.P.invY(sy) };
  },
  frame(st, dt, ctx, W, H){
    const F = cxOwnCur(st);
    const P = ctBox(Math.min(W, H * 1.3), H, 0, 0, 2.2);
    st.P = P;
    cxPaint(ctx, P, F.f, 120);
    ctGrid(ctx, P);
    for(const p of F.poles) ctDot(ctx, P, p.re, p.im, 6, rgbCss(TH.text), rgbCss(TH.bg));
    ctDot(ctx, P, st.z.re, st.z.im, 6, rgbCss(TH.warn), rgbCss(TH.bg));
    /* a small circle at the probe, and its image — analyticity means the image
       is still (to first order) a circle, merely rotated and scaled */
    const r = 0.16;
    ctParam(ctx, P, t => ({ x:st.z.re + r * Math.cos(t), y:st.z.im + r * Math.sin(t) }),
            0, 2 * Math.PI, 90, rgbCss(TH.text, 0.8), 1.6);
    ctFrame(ctx, P, F.n + ' — hue is the argument, bands are the modulus');
    stageNote(ctx, 'where every hue meets, the function is zero or infinite — and the number of colour cycles is the order', W, H);
  },
  readout(st){
    const F = cxOwnCur(st);
    const v = F.f(st.z);
    const cr = cxCR(F.f, st.z);
    const analytic = cr.resid < 1e-4;
    return `<div class="card tight"><div class="ttl">At z = ${fmtNum(st.z.re, 4)} ${st.z.im < 0 ? '−' : '+'} ${fmtNum(Math.abs(st.z.im), 4)}i</div>
      ${kv('f(z)', fmtNum(v.re, 5) + (v.im < 0 ? ' − ' : ' + ') + fmtNum(Math.abs(v.im), 5) + 'i')}
      ${kv('|f(z)|', fmtNum(cxAbs(v), 5))}
      ${kv('arg f(z)', fmtNum(cxArg(v) * 180 / Math.PI, 4) + '°')}
    </div>
    <div class="card tight"><div class="ttl">Cauchy–Riemann</div>
      ${kv('u_x − v_y', fmtNum(cr.cr1, 3))}
      ${kv('u_y + v_x', fmtNum(cr.cr2, 3))}
      ${kv('|∂f/∂x − (−i)∂f/∂y|', fmtGap(cr.resid, Math.max(cxAbs(v), 1e-12)))}
      ${kv('analytic here?', analytic ? 'yes' : '<b>no</b>')}
      ${analytic ? kv("f′(z)", fmtNum(cr.deriv.re, 5) + (cr.deriv.im < 0 ? ' − ' : ' + ') + fmtNum(Math.abs(cr.deriv.im), 5) + 'i') : ''}
      <p class="help">${analytic
        ? 'Both residuals vanish, so the limit defining f′(z) is the same from every direction. That is a far stronger demand than real differentiability, and everything remarkable about complex analysis is paid for by it — analytic functions are automatically infinitely differentiable, and are determined everywhere by their values on any small disc.'
        : 'The residuals do not vanish: the difference quotient depends on the direction of approach, so no complex derivative exists. z̄ is perfectly smooth as a map of two real variables and still fails — differentiability in z is a genuinely different condition.'}</p>
    </div>` +
    /* the numbers above are measured at the probe by difference quotients; for a
       typed f the same equations are formed symbolically and checked over the
       whole window, which is a stronger statement than "analytic here" */
    (F.custom ? `<div class="card tight"><div class="ttl">Your function, checked everywhere</div>
      ${kv('worst C–R violation in the window', fmtNum(F.crWorst, 4))}
      ${kv('found at', F.crAt ? '(' + fmtNum(F.crAt.x, 3) + ', ' + fmtNum(F.crAt.y, 3) + ')' : '—')}
      ${kv('holomorphic on this window?', F.holo ? 'yes' : '<b>no</b>')}
      <p class="help">${F.note}</p>
    </div>` : '');
  },
  chip(st){
    const v = cxOwnCur(st).f(st.z);
    return `<div class="k">f(z)</div><div>|f| = ${fmtNum(cxAbs(v), 4)}</div>
      <div style="color:var(--c-warn)">arg = ${fmtNum(cxArg(v) * 180 / Math.PI, 3)}°</div>`;
  },
  legend(){ return [['var(--text)', 'poles and the probe circle'], ['var(--c-warn)', 'your probe']]; },
  dockLegend:true
};

/* ---- 2 · contour integrals, winding and residues -------------------------- */
STAGES.cxContourInt = {
  title:'Contour integrals & residues',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why a loop integral only cares about the singularities inside it',
      steps:[
        drvStep('integrate the simplest interesting function round a circle',
          `∮ ${dfrac('d' + dv('z'), dv('z'))}`,
          `radius ${n(st.r)} — the panel computes this numerically along the contour`),
        drvStep('parametrise the circle and substitute',
          `${dv('z')} ${dop('=')} ${dv('r')}${dop('e')}^(${dop('i')}θ) ${dop('⇒')} d${dv('z')} ${dop('=')} ${dop('i')}${dv('r')}${dop('e')}^(${dop('i')}θ)dθ`,
          'so dz/z = i dθ, and the radius cancels completely'),
        drvStep('which leaves an integral with no function in it at all',
          `∮ ${dfrac('d' + dv('z'), dv('z'))} ${dop('=')} ${dop('i')}∫₀^(2π) dθ ${dop('=')} 2π${dop('i')}`,
          `numerically: ${n(2 * Math.PI)}i, independent of r`),
        drvSay('the radius vanishing is the whole phenomenon',
          'The answer does not depend on how big the circle is, or in fact on its being a circle. Deform the contour however you like and the value is unchanged, provided you do not drag it across the singularity. The integral is counting something topological, not measuring something geometric.'),
        drvStep('every other power gives zero',
          `∮ ${dv('z')}ⁿ d${dv('z')} ${dop('=')} 0 for ${dv('n')} ${dop('≠')} ${dop('−')}1`,
          'because zⁿ has a single-valued antiderivative, so the loop returns to where it started'),
        drvSay('and that is why only one coefficient survives',
          'Expand any function in a Laurent series about the singularity and integrate term by term. Every term integrates to zero except the 1/z one, which gives 2πi. The whole infinite series collapses to a single number — the coefficient of 1/z, which is what "residue" names.'),
        drvStep('so the residue theorem is almost a bookkeeping statement',
          `∮ ${dv('f')} d${dv('z')} ${dop('=')} 2π${dop('i')} Σ Res`,
          'sum over the singularities the contour actually encloses'),
        drvStep('for a simple pole the residue has a shortcut',
          `Res ${dop('=')} ${dlim(dv('z'), dv('z') + '₀')}(${dv('z')} ${dop('−')} ${dv('z')}₀)${dv('f')}(${dv('z')})`,
          'multiply out the offending factor and evaluate — no series needed'),
        drvSay('and this evaluates real integrals that resist every real method',
          'Close a real integral into a contour in the upper half plane, show the arc contributes nothing as it grows, and the residues hand you the answer. Integrals of rational and trigonometric functions that are hopeless on the real line fall out in a line or two — by leaving the real line entirely.'),
        drvSay('the winding number generalises the count',
          'A contour going round twice gives 4πi. The multiplier is the winding number, which is an integer because it counts complete turns — the same integer the argument principle uses to count zeros and poles, and the same one that makes the Fourier wing\'s winding picture work.')
      ],
      note:'You may draw your own contour with the region tool. The value stays exactly 2πi however the loop is deformed, as long as it still encloses the origin once — and drops to zero the moment it does not. Watching that switch is the most direct demonstration that the integral is topological.'
    };
  },
  drag:true,
  enter(st, o){
    st.key = o.key || 'inv';
    st.c = { re:0, im:0 }; st.r = o.r || 1;
    st.loop = lpNew();
    st.free = false;
  },
  controls(){
    const st = ST;
    return ctSeg('ciK', st.key, ['inv', 'invsq', 'twop', 'pole2', 'exp', 'sq'].map(k => [k, CX_FUNCS[k].n])
                                 .concat([['custom', 'type your own']])) +
      pkBoxes('cxown', st.key, st, CX_OWN, null,
        'f = u + iv, as two real functions. The contour integral is computed numerically along the path ' +
        'either way — but Cauchy\'s theorem only applies to a holomorphic f, so the panel measures the ' +
        'Cauchy-Riemann residual first and says whether the theorem it is about to quote is even in force.') +
      ctlRow('radius', ctlSlider('cxR', 0.2, 2, 0.01, st.r)) +
      `<div class="row wrap">${ctBtn('ciFree', 'draw your own contour')}${ctBtn('ciCirc', 'back to a circle')}</div>
      <p class="help">The whole subject in one number: <b>∮ f(z) dz</b>. For an analytic function
      inside the contour it is <b>zero</b> — Cauchy's theorem — and that is why complex integrals
      behave so much better than real ones. Where the function has poles, the integral counts them:
      <b>∮ f dz = 2πi Σ residues enclosed</b>.</p>
      <p class="help">Slide the radius so the contour crosses a pole and watch the value jump. Or
      press <b>draw your own contour</b> and sketch any closed loop — the integral is computed along
      exactly the curve you drew, and it depends only on which poles you enclosed, not on the shape.
      That path-independence is the residue theorem made visible.</p>`;
  },
  wire(){
    pkWire('ciK', 'cxown', ST.key, ST, CX_OWN, null, v => { ST.key = v; });
    /* cxR, not ciR: that id already belongs to the circulation loop's radius in
       80e-ui-flux-circ-panel.js, and both live in the dock. getElementById is
       first-wins, so which slider a wireSlider call reached depended on nothing
       but which panel happened to come first in the document — and a permalink,
       whose keys ARE element ids, read one slider and wrote the other. */
    wireSlider('cxR', () => ST.r, v => { ST.r = v; }, v => fmtNum(+v, 3));
    ctWireBtn('ciFree', () => { ST.free = true; ST.loop = lpNew(); });
    ctWireBtn('ciCirc', () => { ST.free = false; });
  },
  pick(st, sx, sy, phase){
    if(!st.P) return;
    if(st.free) lpPick(st.loop, st.P, sx, sy, phase);
    else if(phase !== 'up' && st.P.inside(sx, sy))
      st.c = { re:st.P.invX(sx), im:st.P.invY(sy) };
  },
  path(st){
    if(st.free && st.loop.closed && st.loop.pts.length > 3){
      const p = lpParam(st.loop);
      return t => { const q = p(t); return { re:q.x, im:q.y }; };
    }
    return cxCircle(st.c, st.r);
  },
  frame(st, dt, ctx, W, H){
    const F = cxOwnCur(st);
    const P = ctBox(Math.min(W, H * 1.3), H, 0, 0, 2.4);
    st.P = P;
    cxPaint(ctx, P, F.f, 100);
    ctGrid(ctx, P);
    for(const p of F.poles){
      ctDot(ctx, P, p.re, p.im, 7, rgbCss(TH.text), rgbCss(TH.bg));
      ctText(ctx, P.X(p.re) + 10, P.Y(p.im) - 8, 'pole', rgbCss(TH.text), '600 10.5px ' + FONT_UI);
    }
    if(st.free){
      lpPaint(ctx, P, st.loop, rgbCss(TH.warn), rgbCss(TH.warn, 0.1));
      if(!st.loop.closed && st.loop.pts.length < 3)
        stageNote(ctx, 'drag a closed loop anywhere on the picture', W, H);
    } else {
      ctParam(ctx, P, t => ({ x:st.c.re + st.r * Math.cos(t), y:st.c.im + st.r * Math.sin(t) }),
              0, 2 * Math.PI, 200, rgbCss(TH.warn), 2.6);
      ctDot(ctx, P, st.c.re, st.c.im, 4, rgbCss(TH.warn));
    }
    ctFrame(ctx, P, '∮ ' + F.n + ' dz  along the orange contour');
    if(!st.free) stageNote(ctx, 'drag to move the contour, slide the radius to swallow or release a pole', W, H);
  },
  readout(st){
    const F = cxOwnCur(st);
    const path = this.path(st);
    const I = cxContour(F.f, path, 3000);
    /* which poles are inside, decided by the winding number rather than by
       geometry — the honest test for an arbitrary drawn curve */
    const inside = F.poles.map((p, i) => ({ p, i, w:Math.round(cxWinding(path, p, 1200)) }))
                          .filter(o => o.w !== 0);
    const resSum = inside.reduce((acc, o) => cxAdd(acc, cxScale(F.res[o.i] || cx(0, 0), o.w)), cx(0, 0));
    const pred = cxMul(cx(0, 2 * Math.PI), resSum);
    return `<div class="card tight"><div class="ttl">The integral, computed along the curve</div>
      ${kv('∮ f dz', fmtNum(I.re, 5) + (I.im < 0 ? ' − ' : ' + ') + fmtNum(Math.abs(I.im), 5) + 'i')}
      ${kv('poles enclosed', inside.length)}
      ${inside.map(o => kv('  winding about pole ' + (o.i + 1), o.w)).join('')}
      ${kv('2πi × Σ residues', fmtNum(pred.re, 5) + (pred.im < 0 ? ' − ' : ' + ') + fmtNum(Math.abs(pred.im), 5) + 'i')}
      ${kv('difference', fmtGap(cxAbs(cxSub(I, pred)), Math.max(cxAbs(I), cxAbs(pred))))}
      <p class="help">Two entirely independent calculations: a quadrature marched along the contour
      you drew, and a count of enclosed poles weighted by their residues. The difference is the
      evidence for the residue theorem.</p>
    </div>
    <div class="card tight"><div class="ttl">Why this is so much better behaved than real integration</div>
      <p class="help">${F.poles.length === 0
        ? 'This function is analytic everywhere, so <b>every</b> closed contour gives zero — move it, reshape it, it makes no difference. Cauchy\'s theorem says an analytic function has no memory of the path.'
        : 'The value depends only on <i>which poles are enclosed and how many times</i> — never on the shape of the curve. Deform the contour freely; as long as it does not cross a pole the answer cannot change.'}</p>
      <p class="help">This is what makes contour integration a practical tool for real integrals:
      close a real integral into the complex plane, count the residues, and read off an answer that
      no amount of real-variable substitution would produce.</p>
    </div>`;
  },
  chip(st){
    const I = cxContour(cxOwnCur(st).f, this.path(st), 1200);
    return `<div class="k">∮ f dz</div>
      <div style="color:var(--c-warn)">${fmtNum(I.re, 3)} ${I.im < 0 ? '−' : '+'} ${fmtNum(Math.abs(I.im), 3)}i</div>
      <div>2π = ${fmtNum(2 * Math.PI, 4)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'the contour'], ['var(--text)', 'poles']]; },
  dockLegend:true
};
