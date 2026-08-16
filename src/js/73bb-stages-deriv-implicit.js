/* ============================================================================
   IMPLICIT DIFFERENTIATION AND THE INVERSE-FUNCTION DERIVATIVE
   Syllabus gap B1 (MASTER-PLAN §3.2): a named AP Calculus AB unit, the
   technique behind related rates and the tangent to a conic, and the only
   honest way to differentiate a curve nobody can solve for y.

   Both scenes are the same measurement twice over: the TECHNIQUE against the
   RELATION ITSELF. Route A applies the rule (symbolic partials, or 1/f′);
   route B never differentiates anything — it root-finds on the relation at
   x ± h and takes the secant. The engine is in 28-calc1.js and unit-tested.
   ============================================================================ */

/* The curves worth meeting. `y0` seeds the branch the reader starts on; `box`
   frames the whole curve, not just the part near the point. */
const CL_IMPL = [
  { k:'circle', label:'circle x² + y² = 4', src:'x^2 + y^2 - 4', x:1, y0:1.732,
    box:{ x0:-3, x1:3, y0:-3, y1:3 },
    note:'The tangent is perpendicular to the radius, so the slope must be −x/y — and that is exactly what −F_x/F_y gives, with no square roots and no choice of branch.' },
  { k:'folium', label:'folium of Descartes x³ + y³ = 3xy', src:'x^3 + y^3 - 3*x*y', x:1.5, y0:1.5,
    box:{ x0:-2.6, x1:2.6, y0:-2.6, y1:2.6 },
    note:'Descartes sent this to Fermat in 1638 as a challenge: find its tangent. It cannot be solved for y in any useful way, and the implicit rule takes ten seconds. At (3/2, 3/2) the slope is exactly −1, by symmetry in x ↔ y.' },
  { k:'ellipse', label:'tilted ellipse x² + xy + y² = 3', src:'x^2 + x*y + y^2 - 3', x:1, y0:1,
    box:{ x0:-2.6, x1:2.6, y0:-2.6, y1:2.6 },
    note:'The cross term tilts the axes, so no rotation-free formula for y exists — but the tangent is still one line of algebra. This is the conic case an exam actually asks for.' },
  { k:'lemniscate', label:'lemniscate (x²+y²)² = 4(x²−y²)', src:'(x^2 + y^2)^2 - 4*(x^2 - y^2)', x:1.6, y0:0.6,
    box:{ x0:-2.4, x1:2.4, y0:-1.6, y1:1.6 },
    note:'A figure of eight that crosses itself at the origin, where both partials vanish and there is no single tangent at all. The panel says so rather than dividing.' },
  { k:'cardioid', label:'cardioid (x²+y²+x)² = x²+y²', src:'(x^2 + y^2 + x)^2 - (x^2 + y^2)', x:0.2, y0:0.35,
    box:{ x0:-2.2, x1:0.7, y0:-1.3, y1:1.3 },
    note:'A curve with a cusp, where the tangent direction is genuinely undefined — different from a vertical tangent, and the panel distinguishes them.' }
];
/* Functions with a global inverse on the stated bracket. `dsrc` is the display
   copy of f′; the derivative the stage uses is computed symbolically. */
const CL_INV = [
  { k:'cube', label:'f(x) = x³ + x', src:'x^3 + x', a:1, lo:-4, hi:4, box:{ x0:-2.6, x1:2.6 },
    note:'Strictly increasing everywhere (f′ = 3x² + 1 ≥ 1), so the inverse exists globally — but there is no formula for it worth writing. Cardano\'s solution exists and is useless. The rule gives (f⁻¹)′(2) = 1/4 in one step.' },
  { k:'sin', label:'f(x) = sin x on [−π/2, π/2]', src:'sin(x)', a:0.5236, lo:-1.5707, hi:1.5707, box:{ x0:-1.8, x1:1.8 },
    note:'This is where arcsin′ = 1/√(1−x²) comes from: 1/f′(a) = 1/cos a, and cos a = √(1−sin²a) = √(1−b²). The square root is not put in by hand — it falls out of the Pythagorean identity.' },
  { k:'exp', label:'f(x) = eˣ', src:'exp(x)', a:0.6931, lo:-4, hi:2.5, box:{ x0:-2.6, x1:2.2 },
    note:'The inverse is the logarithm, and the rule gives (ln)′(b) = 1/e^(ln b) = 1/b. The most-used derivative in calculus, obtained without ever differentiating a logarithm.' },
  { k:'tan', label:'f(x) = tan x on (−π/2, π/2)', src:'tan(x)', a:0.7854, lo:-1.4, hi:1.4, box:{ x0:-1.5, x1:1.5 },
    note:'1/f′(a) = 1/sec²a = 1/(1+tan²a) = 1/(1+b²) — arctan′, again produced by an identity rather than by inverting anything.' }
];

STAGES.clImplicit = {
  title:'Implicit and inverse derivatives',
  /* both scenes fill the canvas with plots — the key goes in the dock */
  dockLegend:true,
  derive(st){
    if(st.scene === 'inverse') return this.deriveInv(st);
    const C = this.curOf(st), A = st.A || {}, B = st.B || {};
    const n = v => fmtNum(v, 6);
    return {
      title:'Differentiating a curve nobody can solve for y',
      steps:[
        drvSay('the difficulty is real, not a lack of cleverness',
          'x³ + y³ = 3xy cannot be rearranged into y = (something in x) in any form you would want to differentiate — the cubic formula produces three branches and a nest of radicals. Yet the curve plainly has a tangent at almost every point. Something must give a slope without a formula for y.'),
        drvStep('treat y as a function of x and differentiate the whole relation',
          `${dfrac('d', 'd' + dv('x'))}${dv('F')}(${dv('x')}, ${dv('y')}(${dv('x')})) ${dop('=')} 0`,
          'the relation holds identically along the curve, so its derivative along the curve is zero — that is the only fact used'),
        drvSay('and the chain rule does the rest',
          'Differentiating F(x, y(x)) treats y as an inner function, so every y contributes a factor dy/dx. Nothing is assumed about whether y can be written down — only that it exists and is differentiable, which the Implicit Function Theorem guarantees wherever ∂F/∂y ≠ 0.'),
        drvStep('collect the dy/dx terms and solve',
          `${dfrac('d' + dv('y'), 'd' + dv('x'))} ${dop('=')} ${dop('−')}${dfrac('∂' + dv('F') + '/∂' + dv('x'), '∂' + dv('F') + '/∂' + dv('y'))}`,
          A.ok ? `here: −(${n(A.fx)})/(${n(A.fy)}) = ${n(A.m)}` : (A.why || 'not defined at this point')),
        drvSay('this is a gradient statement in disguise',
          'F_x and F_y are the components of ∇F, which points perpendicular to the level curve. The slope of a line perpendicular to (F_x, F_y) is −F_x/F_y — so implicit differentiation and "the gradient is normal to the level set" are the same theorem, met two years apart.'),
        drvStep('and the panel checks it against the curve itself',
          `${dfrac(dv('y') + '(' + dv('x') + '+' + dv('h') + ') ' + dop('−') + ' ' + dv('y') + '(' + dv('x') + dop('−') + dv('h') + ')', '2' + dv('h'))}`,
          B.ok ? `solving F = 0 at x ± h by bisection gives ${n(B.m)} — ${fmtAgree(A.m, B.m)}` : (B.why || 'the branch could not be followed here')),
        drvSay('and that check is the whole argument, not decoration',
          'The second route never differentiates anything. It solves the relation numerically just to the left and just to the right, and takes the difference quotient the derivative is defined to be. That it agrees with −F_x/F_y is evidence that the rule is the chain rule and not a mnemonic — and the small residue left is the secant\'s own h², which halving h cuts fourfold.'),
        drvStep('where ∂F/∂y vanishes the curve has a vertical tangent',
          `∂${dv('F')}/∂${dv('y')} ${dop('=')} 0`,
          'dy/dx is not defined there — but dx/dy is zero, which is the same tangent line read the other way up'),
        drvSay('and where BOTH partials vanish there is no tangent at all',
          'The lemniscate crosses itself at the origin and the cardioid has a cusp; at such a point ∇F = 0, the Implicit Function Theorem does not apply, and the curve genuinely has no single tangent. A formula that returned a number there would be lying, so the panel names the case instead.')
      ],
      note:C.note
    };
  },
  deriveInv(st){
    const C = this.curOf(st), I = st.I || {};
    const n = v => fmtNum(v, 6);
    return {
      title:'The derivative of a function you never inverted',
      steps:[
        drvSay('reflection is the whole picture',
          'The graph of f⁻¹ is the graph of f reflected in the line y = x, because swapping the roles of input and output swaps the coordinates of every point. Everything below is that sentence, differentiated.'),
        drvStep('reflection turns a rise-over-run upside down',
          `${dv('f')}⁻¹(${dv('f')}(${dv('x')})) ${dop('=')} ${dv('x')}`,
          'differentiate both sides — the left by the chain rule, the right trivially'),
        drvStep('so the two slopes are reciprocals',
          `(${dv('f')}⁻¹)′(${dv('b')}) ${dop('=')} ${dfrac('1', dv('f') + '′(' + dv('a') + ')')}, &nbsp; ${dv('b')} ${dop('=')} ${dv('f')}(${dv('a')})`,
          I.ok ? `f′(${n(st.a)}) = ${n(I.d)}, so the inverse's slope at b = ${n(I.b)} is ${n(I.sym)}` : (I.why || 'not defined here')),
        drvSay('note WHERE the reciprocal is evaluated — this is the usual mistake',
          'The inverse\'s derivative at b uses f′ at a, not at b. They are different numbers at different points, and writing (f⁻¹)′(b) = 1/f′(b) is the commonest error in the topic. The picture makes it obvious: the two tangent lines you are comparing touch the two curves at points that are reflections of each other.'),
        drvStep('measured, by inverting f numerically instead',
          `${dfrac(dv('f')  + '⁻¹(' + dv('b') + '+' + dv('h') + ') ' + dop('−') + ' ' + dv('f') + '⁻¹(' + dv('b') + dop('−') + dv('h') + ')', '2' + dv('h'))}`,
          I.ok && I.num !== null ? `bisection on f(x) = b ± h gives ${n(I.num)} — ${fmtAgree(I.sym, I.num)}` : 'the inverse could not be followed here'),
        drvSay('the numeric route is Richardson-extrapolated, because its order was measured',
          'The symmetric secant on a numerically inverted f is second order — halving h cuts its error by 4.00, 3.97 and 3.89 across three halvings, measured rather than assumed. Knowing p = 2 licenses combining two step sizes as (4s(h/2) − s(h))/3, which removes that term and leaves agreement at the bisection floor, ~10⁻¹¹.'),
        drvStep('and f′(a) = 0 means the inverse has a vertical tangent',
          `${dv('f')}′(${dv('a')}) ${dop('=')} 0 ${dop('⇒')} (${dv('f')}⁻¹)′ undefined`,
          'x³ at the origin: horizontal for f, vertical for its inverse — the reflection of a flat tangent'),
        drvSay('which is why every standard inverse derivative looks like an identity',
          'arcsin′ = 1/√(1−x²) is not a new fact about arcsin. It is 1/cos a with cos a rewritten as √(1−sin²a) = √(1−b²) by Pythagoras. Same for arctan′ = 1/(1+x²), from 1/sec²a = 1/(1+tan²a). The rule supplies the reciprocal; a trigonometric identity supplies the disguise.')
      ],
      note:C.note
    };
  },
  enter(st, o){
    st.scene = o.scene || 'implicit';
    st.key = o.key || (st.scene === 'inverse' ? 'cube' : 'circle');
    st.own = !!o.own;
    st.src = o.src || 'x^2 + y^2 - 4';
    st.isrc = o.isrc || 'x^3 + x';
    const C = this.curOf(st);
    st.x = o.x !== undefined ? o.x : (C.x !== undefined ? C.x : 1);
    st.a = o.a !== undefined ? o.a : (C.a !== undefined ? C.a : 1);
    st.err = '';
    this.recompute(st);
  },
  /* the accessor: a typed relation is shaped exactly like a table entry */
  curOf(st){
    const T = st.scene === 'inverse' ? CL_INV : CL_IMPL;
    if(st.key === 'custom'){
      return st.scene === 'inverse'
        ? { k:'custom', label:'f(x) = ' + pkPretty(st.isrc), src:st.isrc, a:st.a,
            lo:-4, hi:4, box:{ x0:-2.6, x1:2.6 },
            note:'Your own function. The rule and the numeric inversion are computed the same way they are for the presets — nothing here knows which is which.' }
        : { k:'custom', label:pkPretty(st.src) + ' = 0', src:st.src, x:st.x, y0:st.y0 || 1,
            box:{ x0:-3, x1:3, y0:-3, y1:3 },
            note:'Your own relation. Both routes run on it unchanged: the rule differentiates the expression symbolically, and the check root-finds on the expression itself.' };
    }
    return T.find(c => c.k === st.key) || T[0];
  },
  recompute(st){
    const C = this.curOf(st);
    st.err = '';
    try {
      if(st.scene === 'inverse'){
        const A = parse(C.src);
        const f = compile(A), dfn = compile(diff(A, 'x'));
        st.f = x => f(x, 0, 0); st.df = x => dfn(x, 0, 0);
        /* the symbolic derivative, typeset from the AST rather than restated */
        st.dtex = texEq(diff(A, 'x'));
        st.I = clInverseAt(st.f, st.df, st.a, C.lo, C.hi);
        return;
      }
      const F = st.F = mvCompile(C.src);
      /* the branch through the reader's x: found by root-finding on F itself,
         seeded from the preset's own y — never assumed solvable */
      const y = clBranchY(F.f, st.x, st.y0 !== undefined ? st.y0 : (C.y0 || 1), 3.2);
      st.y = y;
      if(y === null){
        st.A = { ok:false, why:'no branch of the curve passes near that x' };
        st.B = { ok:false, why:'no branch to follow' };
        return;
      }
      st.A = clImplicitSlope(F, st.x, y);
      st.B = clImplicitSecant(F, st.x, y, 1e-4, 1.2);
      st.ord = clImplicitOrder(F, st.x, y, 4e-2);
    } catch(e){
      st.err = String(e && e.message || e);
    }
  },
  controls(){
    const st = ST, C = this.curOf(st);
    const table = st.scene === 'inverse' ? CL_INV : CL_IMPL;
    const seg = ctSeg('ciScene', st.scene,
      [['implicit', 'a curve: F(x, y) = 0'], ['inverse', 'an inverse: y = f(x)']]);
    const pick = ctSeg('ciPick', st.key,
      table.map(c => [c.k, c.label]).concat([['custom', 'type your own']]));
    if(st.scene === 'inverse'){
      return seg + pick +
        (st.key === 'custom' ? fnHtml('ciFsrc', 'f(x) =', st.isrc, 'must be one-to-one on the bracket shown') : '') +
        ctlRow('the point a', ctlSlider('ciA', C.lo + 0.05, C.hi - 0.05, 0.005, st.a)) +
        `<p class="help">The blue curve is <b>f</b>; the orange one is <b>f⁻¹</b>, drawn by reflecting it
        in the dashed line y = x — which is what an inverse <i>is</i>. Two tangent lines are drawn: at
        (a, b) on f, and at (b, a) on f⁻¹. Their slopes are reciprocals, and the panel measures that
        twice — once as 1/f′(a), once by <b>inverting f numerically</b> at b ± h and taking the
        secant, which never differentiates anything. Slide a to where f′ = 0 and the inverse's
        tangent goes vertical: a flat tangent reflected is a vertical one.</p>`;
    }
    return seg + pick +
      (st.key === 'custom' ? fnHtml('ciSrc', 'F(x, y) =', st.src, 'the curve is F = 0; use x and y') : '') +
      ctlRow('the point x', ctlSlider('ciX', C.box.x0 + 0.05, C.box.x1 - 0.05, 0.005, st.x)) +
      `<p class="help">The curve is traced by following F = 0 itself — nothing is solved for y. At your
      x the panel finds the branch by bisection, then computes the tangent's slope <b>twice</b>: by
      the implicit rule −F<sub>x</sub>/F<sub>y</sub> from symbolic partials, and by solving F = 0 at
      x ± h and taking the secant, which uses no derivative of any kind. Drag onto the side of the
      circle and watch ∂F/∂y hit zero: the tangent is vertical, dy/dx does not exist, and the panel
      says which. The <b>lemniscate</b> at the origin has no tangent at all — both partials vanish
      there, and that is a different failure with a different sentence.</p>`;
  },
  wire(){
    ctWireSeg('ciScene', v => {
      ST.scene = v;
      ST.key = v === 'inverse' ? 'cube' : 'circle';
      const C = STAGES.clImplicit.curOf(ST);
      ST.x = C.x !== undefined ? C.x : 1; ST.a = C.a !== undefined ? C.a : 1;
      ST.y0 = C.y0; STAGES.clImplicit.recompute(ST); buildStagePanel();
    });
    ctWireSeg('ciPick', v => {
      ST.key = v;
      const C = STAGES.clImplicit.curOf(ST);
      if(v !== 'custom'){
        if(ST.scene === 'inverse') ST.a = C.a; else { ST.x = C.x; ST.y0 = C.y0; }
      }
      STAGES.clImplicit.recompute(ST); buildStagePanel();
    });
    fnWire('ciSrc', (made, src) => { ST.src = src; ST.y0 = undefined; STAGES.clImplicit.recompute(ST); },
           s => { const F = mvCompile(s); if(!Number.isFinite(F.f(0.3, 0.4))) throw new Error('that relation is not a number near the origin'); return F; });
    fnWire('ciFsrc', (made, src) => { ST.isrc = src; STAGES.clImplicit.recompute(ST); },
           s => { const A = parse(s); compile(diff(A, 'x')); return A; });
    wireSlider('ciX', () => ST.x, v => { ST.x = v; STAGES.clImplicit.recompute(ST); }, v => (+v).toFixed(3));
    wireSlider('ciA', () => ST.a, v => { ST.a = v; STAGES.clImplicit.recompute(ST); }, v => (+v).toFixed(3));
  },
  frame(st, dt, ctx, W, H){
    if(st.scene === 'inverse'){ this.frameInv(st, ctx, W, H); return; }
    const C = this.curOf(st);
    const pl = st.pl = mkPlot(64, 44, W - 100, H - 44 - 48, C.box.x0, C.box.x1, C.box.y0, C.box.y1);
    plotFrame(ctx, pl, 'x', 'y', C.label + ' — traced by following F = 0, never solved for y');
    plotZeroY(ctx, pl);
    if(st.err){
      ctText(ctx, pl.px + pl.pw / 2, pl.py + pl.ph / 2, st.err, rgbCss(TH.pos), '600 12px ' + FONT_UI, 'center', 'middle');
      return;
    }
    /* The whole zero set, by marching squares.
       `mvLevelCurve` was tried first and is the wrong tool here: it *follows*
       one component from one seed, and on the folium it walked the asymptotic
       branch and left the loop — the very piece the marked point sits on —
       undrawn, with the tangent line hanging in empty space. A relation is
       allowed as many components as it likes, so the picture has to be the
       whole level set. Only a screenshot could see this. */
    pvClip(ctx, pl, () => ctContour(ctx, pl, (x, y) => st.F.f(x, y), 0, rgbCss(TH.grad), 2.2, 200));
    if(st.y === null || st.y === undefined){
      ctText(ctx, pl.px + pl.pw / 2, pl.py + 16, 'no branch of the curve near x = ' + fmtNum(st.x, 3),
             rgbCss(TH.pos), '600 11.5px ' + FONT_UI, 'center', 'top');
      return;
    }
    const X = pl.X(st.x), Y = pl.Y(st.y);
    /* the gradient, which is what the rule is really about */
    const A = st.A;
    if(A && Number.isFinite(A.fx) && Number.isFinite(A.fy)){
      const g = Math.hypot(A.fx, A.fy);
      if(g > 1e-12){
        const L = 46;
        emDrawArrow(ctx, X, Y, X + A.fx / g * L, Y - A.fy / g * L, rgbCss(TH.neg), 2, 9);
        ctText(ctx, X + A.fx / g * L + 6, Y - A.fy / g * L, '∇F', rgbCss(TH.neg), '600 11px ' + FONT_UI, 'left', 'middle');
      }
    }
    /* the tangent line, drawn from the slope the RULE produced */
    pvClip(ctx, pl, () => {
      ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2;
      ctx.beginPath();
      if(A && A.ok){
        const dx = (C.box.x1 - C.box.x0);
        ctx.moveTo(pl.X(st.x - dx), pl.Y(st.y - A.m * dx));
        ctx.lineTo(pl.X(st.x + dx), pl.Y(st.y + A.m * dx));
      } else if(A && A.vertical){
        ctx.moveTo(X, pl.py); ctx.lineTo(X, pl.py + pl.ph);
      }
      ctx.stroke();
    });
    /* The two neighbouring roots the SECOND route found, drawn at a visible h
       so the reader can see what the secant is a secant of. The step shrinks
       until a branch exists on both sides: the folium's loop stops at
       x ≈ 1.587, and the default demo point sits at 1.5 — so a fixed display
       step found nothing and silently drew no secant at all while the legend
       promised one. Near a turning point the picture simply zooms in. */
    let B2 = { ok:false };
    for(const frac of [0.09, 0.045, 0.02, 0.008, 0.003]){
      B2 = clImplicitSecant(st.F, st.x, st.y, (C.box.x1 - C.box.x0) * frac, 1.2);
      if(B2.ok) break;
    }
    if(B2.ok){
      ctx.strokeStyle = rgbCss(TH.curl, 0.9); ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pl.X(st.x - B2.h), pl.Y(B2.ym)); ctx.lineTo(pl.X(st.x + B2.h), pl.Y(B2.yp));
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = rgbCss(TH.curl);
      for(const [px, py] of [[st.x - B2.h, B2.ym], [st.x + B2.h, B2.yp]]){
        ctx.beginPath(); ctx.arc(pl.X(px), pl.Y(py), 3.2, 0, 6.2832); ctx.fill();
      }
    }
    ctx.fillStyle = rgbCss(TH.text);
    ctx.beginPath(); ctx.arc(X, Y, 4.5, 0, 6.2832); ctx.fill();
    ctText(ctx, X + 8, Y - 8, '(' + fmtNum(st.x, 3) + ', ' + fmtNum(st.y, 3) + ')',
           rgbCss(TH.text), '600 10.5px ' + FONT_MONO, 'left', 'bottom');
    stageNote(ctx, A && A.ok
      ? 'the orange tangent came from −F_x/F_y; the dashed purple secant came from solving F = 0 twice — nothing was differentiated to draw it'
      : (A ? A.why : ''), W, H);
  },
  frameInv(st, ctx, W, H){
    const C = this.curOf(st);
    if(st.err || !st.f){
      const pl0 = mkPlot(64, 44, W - 100, H - 92, -1, 1, -1, 1);
      ctText(ctx, pl0.px + pl0.pw / 2, pl0.py + pl0.ph / 2, st.err || 'no function',
             rgbCss(TH.pos), '600 12px ' + FONT_UI, 'center', 'middle');
      return;
    }
    /* a square window: the reflection in y = x is only visible if the axes agree */
    let lo = C.box.x0, hi = C.box.x1;
    for(let i = 0; i <= 60; i++){
      const v = st.f(C.lo + (C.hi - C.lo) * i / 60);
      if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    lo = Math.max(-8, lo); hi = Math.min(8, hi);
    const pad = (hi - lo) * 0.08;
    const s0 = Math.min(C.box.x0, lo) - pad, s1 = Math.max(C.box.x1, hi) + pad;
    const side = Math.min(W - 110, H - 96);
    const pl = st.pl = mkPlot(64 + Math.max(0, (W - 110 - side) / 2), 44, side, side, s0, s1, s0, s1);
    plotFrame(ctx, pl, 'x', 'y', C.label + ' and its inverse — the same curve, reflected');
    plotZeroY(ctx, pl);
    pvClip(ctx, pl, () => {
      /* y = x, the mirror */
      ctx.strokeStyle = rgbCss(TH.faint, 0.8); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(pl.X(s0), pl.Y(s0)); ctx.lineTo(pl.X(s1), pl.Y(s1)); ctx.stroke();
      ctx.setLineDash([]);
      /* f, then f reflected — the inverse is drawn by swapping coordinates,
         which is the definition, so no numerical inversion is needed to PLOT it */
      const pts = [];
      const N = 400;
      for(let i = 0; i <= N; i++){
        const x = C.lo + (C.hi - C.lo) * i / N, y = st.f(x);
        if(Number.isFinite(y)) pts.push({ x, y });
      }
      const draw = (arr, col, flip) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
        let on = false;
        for(const p of arr){
          const X = pl.X(flip ? p.y : p.x), Y = pl.Y(flip ? p.x : p.y);
          on ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); on = true;
        }
        ctx.stroke();
      };
      draw(pts, rgbCss(TH.neg), false);
      draw(pts, rgbCss(TH.warn), true);
    });
    const I = st.I;
    if(!I) return;
    const a = st.a, b = I.b;
    const line = (px, py, m, col) => {
      pvClip(ctx, pl, () => {
        ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.setLineDash([7, 4]);
        const d = (s1 - s0);
        ctx.beginPath();
        if(Number.isFinite(m)){
          ctx.moveTo(pl.X(px - d), pl.Y(py - m * d));
          ctx.lineTo(pl.X(px + d), pl.Y(py + m * d));
        } else {
          ctx.moveTo(pl.X(px), pl.py); ctx.lineTo(pl.X(px), pl.py + pl.ph);
        }
        ctx.stroke(); ctx.setLineDash([]);
      });
    };
    line(a, b, I.d, rgbCss(TH.neg, 0.95));
    line(b, a, I.ok ? I.sym : Infinity, rgbCss(TH.warn, 0.95));
    for(const [px, py, col] of [[a, b, TH.neg], [b, a, TH.warn]]){
      ctx.fillStyle = rgbCss(col);
      ctx.beginPath(); ctx.arc(pl.X(px), pl.Y(py), 4.5, 0, 6.2832); ctx.fill();
    }
    ctText(ctx, pl.X(a) + 8, pl.Y(b) - 8, '(a, b)', rgbCss(TH.neg), '600 10.5px ' + FONT_MONO, 'left', 'bottom');
    ctText(ctx, pl.X(b) + 8, pl.Y(a) - 8, '(b, a)', rgbCss(TH.warn), '600 10.5px ' + FONT_MONO, 'left', 'bottom');
    stageNote(ctx, I.ok
      ? 'the two dashed tangents are reflections of each other, so their slopes are reciprocals — that is the entire theorem'
      : I.why, W, H);
  },
  readout(st){
    if(st.scene === 'inverse') return this.readoutInv(st);
    const C = this.curOf(st), A = st.A, B = st.B, O = st.ord;
    if(st.err)
      return `<div class="card tight"><div class="ttl">That relation did not compile</div>
        <p class="help" style="color:var(--c-pos)">${esc(st.err)}</p>
        <p class="help">The previous curve is kept until a readable relation is typed.</p></div>`;
    if(st.y === null || st.y === undefined)
      return `<div class="card tight"><div class="ttl">Off the curve</div>
        ${kv('x', fmtNum(st.x, 4))}
        <p class="help">No branch of ${esc(C.label)} passes near this x — the relation has no real solution for y there. Slide back into the curve's range and both routes resume.</p></div>`;
    const verdict = (A.ok && B.ok)
      ? kv('the two routes', fmtAgree(A.m, B.m))
      : kv('the two routes', 'not comparable here — ' + (A.ok ? B.why : A.why));
    return `<div class="card tight"><div class="ttl">The tangent at (${fmtNum(st.x, 4)}, ${fmtNum(st.y, 4)})</div>
      ${kv('F(x, y)', pkPretty(C.src) + ' = 0')}
      ${kv('F on the curve here', fmtGap(st.F.f(st.x, st.y), Math.max(1e-12, Math.abs(st.F.fx(st.x, st.y)) + Math.abs(st.F.fy(st.x, st.y)))))}
      ${kv('∂F/∂x', fmtNum(A.fx, 6))}
      ${kv('∂F/∂y', fmtNum(A.fy, 6))}
      ${kv('dy/dx = −F_x/F_y', A.ok ? '<b>' + fmtNum(A.m, 6) + '</b>' : A.why)}
      ${kv('dy/dx from the curve itself', B.ok ? fmtNum(B.m, 6) : B.why)}
      ${verdict}
      <p class="help">The second row is the relation checked at the point — it should be zero to the
      scale of ∇F, and it is, because the branch was found by bisection on F rather than assumed. The
      slope is then computed two ways that share nothing: symbolic partials, and two more
      root-findings at x ± h. ${A.ok && B.ok ? 'The residue is the secant\'s own truncation, not a disagreement about the mathematics.' : ''}</p>
    </div>
    ${O ? `<div class="card tight"><div class="ttl">Whose error is the difference?</div>
      ${kv('secant at h = 0.04', fmtSig(O.e1, 4))}
      ${kv('at h/2', fmtSig(O.e2, 4) + ' — cut by ' + fmtNum(O.r1, 3) + '×')}
      ${kv('at h/4', fmtSig(O.e4, 4) + ' — cut by ' + fmtNum(O.r2, 3) + '×')}
      ${kv('measured order', 'h² — so the gap is the CHECK\'s error, not the rule\'s')}
      <p class="help">Halving the step and watching the disagreement fall fourfold is what separates
      truncation from a genuine defect: round-off would not move at all. The implicit rule is exact;
      everything left is the secant that tested it.</p>
    </div>` : ''}
    <div class="card tight"><div class="ttl">${esc(C.label)}</div>
      <p class="help">${C.note}</p>
    </div>`;
  },
  readoutInv(st){
    const C = this.curOf(st), I = st.I;
    if(st.err)
      return `<div class="card tight"><div class="ttl">That function did not compile</div>
        <p class="help" style="color:var(--c-pos)">${esc(st.err)}</p></div>`;
    if(!I || !I.ok)
      return `<div class="card tight"><div class="ttl">At a = ${fmtNum(st.a, 4)}</div>
        ${kv('f(a)', I && Number.isFinite(I.b) ? fmtNum(I.b, 6) : 'not defined')}
        ${kv('f′(a)', I && Number.isFinite(I.d) ? fmtNum(I.d, 6) : 'not defined')}
        ${kv('(f⁻¹)′ there', I ? I.why : 'not defined')}
        <p class="help">A horizontal tangent on f reflects into a vertical one on f⁻¹, so the inverse
        has no slope at that height. The inverse still exists as a function near there if f is
        monotone — it simply is not differentiable at that one point, which is exactly what x³ and
        its cube root do at the origin.</p></div>`;
    return `<div class="card tight"><div class="ttl">The reciprocal, at reflected points</div>
      ${kv('f(x)', pkPretty(C.src))}
      ${kv('f′(x)', st.dtex || '—')}
      ${kv('a', fmtNum(st.a, 6))}
      ${kv('b = f(a)', fmtNum(I.b, 6))}
      ${kv('f′(a) — the slope on f', fmtNum(I.d, 6))}
      ${kv('(f⁻¹)′(b) = 1/f′(a)', '<b>' + fmtNum(I.sym, 6) + '</b>')}
      ${kv('the same, by inverting f numerically', I.num !== null ? fmtNum(I.num, 6) : 'the bracket does not contain b ± h')}
      ${kv('the two routes', I.num !== null ? fmtAgree(I.sym, I.num) : '—')}
      <p class="help">The second route never differentiates and never uses a formula for f⁻¹: it
      solves f(x) = b ± h by bisection and takes the secant, Richardson-extrapolated because that
      secant's order was <b>measured</b> at h² (4.00, 3.97, 3.89 over three halvings). The rule and
      the definition therefore agree to about 10⁻¹¹, which is bisection's floor.</p>
    </div>
    <div class="card tight"><div class="ttl">Where the standard formulas come from</div>
      ${kv('(arcsin)′(b)', '1/cos a = 1/√(1−b²)')}
      ${kv('(arctan)′(b)', '1/sec²a = 1/(1+b²)')}
      ${kv('(ln)′(b)', '1/e^a = 1/b')}
      <p class="help">None of these is a separate fact to memorise. Each is 1/f′(a) with a
      trigonometric or exponential identity used to rewrite f′(a) in terms of b — which is why the
      derivative of an inverse trig function is algebraic while the function itself is not.</p>
    </div>
    <div class="card tight"><div class="ttl">${esc(C.label)}</div>
      <p class="help">${C.note}</p>
    </div>`;
  },
  chip(st){
    if(st.scene === 'inverse'){
      const I = st.I;
      return `<div class="k">inverse derivative · a = ${fmtNum(st.a, 3)}</div>
        <div style="color:var(--c-neg)">f′(a) = ${I && Number.isFinite(I.d) ? fmtNum(I.d, 4) : '—'}</div>
        <div style="color:var(--c-warn)">(f⁻¹)′(b) = ${I && I.ok ? fmtNum(I.sym, 4) : 'vertical'}</div>`;
    }
    const A = st.A;
    return `<div class="k">implicit · x = ${fmtNum(st.x, 3)}</div>
      <div>y = ${st.y === null || st.y === undefined ? 'no branch' : fmtNum(st.y, 4)}</div>
      <div style="color:var(--c-warn)">dy/dx = ${A && A.ok ? fmtNum(A.m, 4) : (A && A.vertical ? 'vertical' : '—')}</div>`;
  },
  legend(st){
    const s = st || ST;
    return (s && s.scene === 'inverse')
      ? [['var(--c-neg)', 'f, and its tangent at (a, b)'],
         ['var(--c-warn)', 'f⁻¹ — the same curve reflected — and its tangent at (b, a)'],
         ['var(--faint)', 'the mirror y = x']]
      : [['var(--c-grad)', 'the curve F(x, y) = 0, traced by following F itself'],
         ['var(--c-warn)', 'the tangent from the rule −F_x/F_y'],
         ['var(--c-curl)', 'the secant the second route measures (dashed)'],
         ['var(--c-neg)', '∇F — normal to the curve, which is why the rule works']];
  }
};
