/* ============================================================================
   4l · THE LIMITS & CONTINUITY WING  and  THE DERIVATIVES WING
   AP Calculus AB/BC units 1–5.
   ============================================================================ */

/* a compiled f(x) from an expression, guarded */
function clSafe(st, src){
  try { st.ast = parse(src); const g = compile(st.ast); st.f = x => g(x, 0, 0); st.err = ''; }
  catch(e){ st.err = String(e && e.message || e); }
  return st.f;
}
/* the symbolic first and second derivatives of a one-variable expression */
function clBundle(src){
  const A = parse(src), d1 = diff(A, 'x'), d2 = diff(d1, 'x');
  const c = nd => { const g = compile(nd); return x => g(x, 0, 0); };
  return { src, ast:A, a1:d1, a2:d2, f:c(A), d1:c(d1), d2:c(d2), d3:c(diff(d2, 'x')) };
}

/* ---- 1 · what a limit is --------------------------------------------------- */
STAGES.clLimit = {
  title:'The limit',
  enter(st, o){
    st.key = o.key || 'hole';
    st.zoom = o.zoom === undefined ? 1 : o.zoom;
    st.run = o.run !== false;
    clSafe(st, clLimitCur(st).src);
  },
  controls(){
    const st = ST, C = clLimitCur(st);
    return pkSeg('clLK', CL_LIMITS, st.key, e => e.name.split(', at')[0].replace('f(x) = ', '')) +
      pkBoxes('cllim', st.key, st, CL_LIM_OWN, CL_LIM_BOUNDS,
        'Any f(x), and the point to approach. Whether the limit exists, and whether the graph has a hole ' +
        'there, are worked out from your function rather than looked up. Try <b>(cos(x)-1)/x^2</b> at 0, ' +
        'or <b>x/abs(x)</b> at 0 for two sides that disagree.') +
      ctlRow('zoom  ×', ctlSlider('clLz', 0, 14, 0.02, st.zoom)) +
      ctChk('clLrun', 'zoom in automatically', st.run) +
      `<p class="help"><b>${C.name}</b><br>${C.note}</p>
      <p class="help">A limit is a statement about what happens <i>near</i> a point, and deliberately not
      about what happens <i>at</i> it. The open circle marks the value f actually takes — or fails to take —
      and the limit does not care. Zoom in and watch the two approach lines converge, or fail to.</p>
      <p class="help">The readout marches in geometrically from both sides and reports what the values
      settle on. Where they settle on different numbers there is a <b>jump</b>; where they run away
      there is an <b>infinite discontinuity</b>; where they never settle at all — as for sin(1/x) — the
      failure is <b>essential</b>, and no amount of zooming will simplify the picture.</p>`;
  },
  wire(){
    pkWire('clLK', 'cllim', ST.key, ST, CL_LIM_OWN, CL_LIM_BOUNDS,
      v => { ST.key = v; }, () => { clSafe(ST, clLimitCur(ST).src); ST.zoom = 1; });
    wireSlider('clLz', () => ST.zoom, v => { ST.zoom = v; ST.run = false; const c = $('clLrun'); if(c) c.checked = false; },
      v => fmtNum(Math.pow(2, +v), 4));
    ctWireChk('clLrun', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    const C = clLimitCur(st);
    if(st.run){ st.zoom += dt * 0.5; if(st.zoom > 14) st.zoom = 0; }
    const w = 2 / Math.pow(2, st.zoom);
    const f = st.f; if(!f) return;
    /* frame vertically on what the function does in the window */
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i <= 400; i++){
      const x = C.a - w + 2 * w * i / 400;
      if(Math.abs(x - C.a) < 1e-14) continue;
      const v = f(x);
      if(Number.isFinite(v) && Math.abs(v) < 1e6){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    if(!Number.isFinite(lo)){ lo = -1; hi = 1; }
    if(hi - lo < 1e-12){ lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.18;
    const P = mkPlot(76, 44, W * 0.58 - 100, H - 132, C.a - w, C.a + w, lo - pad, hi + pad);
    plotFrame(ctx, P, 'x', 'f(x)', C.name + '   —   window ±' + fmtNum(w, 3));
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [C.a - w, C.a, C.a + w], v => fmtNum(v, 4));
    plotCurve(ctx, P, f, 1400, rgbCss(TH.grad), 2.2);
    /* the vertical at a, and the value the limit is heading for */
    const L = clLimit(f, C.a);
    if(Number.isFinite(L.value)){
      ctx.strokeStyle = rgbCss(TH.warn, 0.8); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(P.px, P.Y(L.value)); ctx.lineTo(P.px + P.pw, P.Y(L.value)); ctx.stroke();
      ctx.setLineDash([]);
      ctText(ctx, P.px + 6, P.Y(L.value) - 5, 'L = ' + fmtNum(L.value, 6), rgbCss(TH.warn), '600 11px ' + FONT_MONO);
      /* the open circle: the limit exists but f does not take that value there */
      const fa = f(C.a);
      ctx.strokeStyle = rgbCss(TH.bg); ctx.fillStyle = rgbCss(TH.bg);
      ctx.beginPath(); ctx.arc(P.X(C.a), P.Y(L.value), 4.5, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(P.X(C.a), P.Y(L.value), 4.5, 0, 6.2832); ctx.stroke();
      if(Number.isFinite(fa) && Math.abs(fa - L.value) > 1e-9)
        ctDot(ctx, { X:P.X, Y:P.Y }, C.a, fa, 5, rgbCss(TH.neg), rgbCss(TH.bg));
    }
    probeLine(ctx, P, C.a, 'a');
    /* the two approach tables, drawn as converging point sequences */
    const x0 = W * 0.6;
    const Q = mkPlot(x0 + 52, 56, W - x0 - 92, H - 150, 0, 20,
      Number.isFinite(L.value) ? L.value - 1.6 : -2, Number.isFinite(L.value) ? L.value + 1.6 : 2);
    plotFrame(ctx, Q, 'steps in  (h halves each time)', 'f(a ± h)', 'marching in from both sides');
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [0, 5, 10, 15, 20], v => String(v));
    for(const [side, col] of [[L.left, TH.neg], [L.right, TH.pos]]){
      ctx.strokeStyle = rgbCss(col); ctx.lineWidth = 2;
      ctx.beginPath();
      side.vals.forEach((v, i) => {
        const Y = Q.Y(Math.max(Q.y0, Math.min(Q.y1, v.v)));
        i ? ctx.lineTo(Q.X(i), Y) : ctx.moveTo(Q.X(i), Y);
      });
      ctx.stroke();
      ctx.fillStyle = rgbCss(col);
      side.vals.forEach((v, i) => {
        if(!Number.isFinite(v.v)) return;
        ctx.beginPath(); ctx.arc(Q.X(i), Q.Y(Math.max(Q.y0, Math.min(Q.y1, v.v))), 2.4, 0, 6.2832); ctx.fill();
      });
    }
    if(Number.isFinite(L.value)){
      ctx.strokeStyle = rgbCss(TH.warn, 0.7); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(Q.px, Q.Y(L.value)); ctx.lineTo(Q.px + Q.pw, Q.Y(L.value)); ctx.stroke();
      ctx.setLineDash([]);
    }
    stageNote(ctx, 'blue approaches from the left, green from the right — a limit exists only if they meet', W, H);
  },
  derive(st){
    const C = clLimitCur(st), f = st.f;
    if(!f) return null;
    const L = clLimit(f, C.a);
    const eps = 0.1;
    const d1 = clDeltaFor(f, C.a, L.value, eps, 2);
    const d2 = clDeltaFor(f, C.a, L.value, eps / 2, 2);
    const n = v => fmtNum(v, 6);
    return {
      title:'From "gets close to" to something you can actually check',
      steps:[
        drvSay('the informal idea, and why it is not enough',
          '"f(x) gets close to L as x gets close to a" is how everyone first meets a limit, and it is unusable as it stands. How close is close? Close enough for what? Two people can disagree about whether a sequence is settling down and neither can be shown wrong, because nothing in the sentence can be tested. The whole of nineteenth-century analysis is the work of replacing it.'),
        drvStep('first, refuse to look at the point itself',
          `0 ${dop('<')} |${dv('x')} ${dop('−')} ${dv('a')}| `,
          `f(${fmtNum(C.a, 3)}) is ${Number.isFinite(f(C.a)) ? n(f(C.a)) : 'not defined'} — and the limit does not consult it`),
        drvSay('this is the strict inequality on the left, and it is deliberate',
          'The limit is a statement about a punctured neighbourhood. Whatever happens exactly at a is excluded by that 0 < on the left. It is why a function can have a limit at a point where it is undefined, and why a removable discontinuity is removable at all — the limit already knows what the value ought to be.'),
        drvStep('name the tolerance you must meet',
          `|${dv('f')}(${dv('x')}) ${dop('−')} ${dv('L')}| ${dop('<')} ε`,
          `take ε = ${eps}, so f must land within ${eps} of ${Number.isFinite(L.value) ? n(L.value) : 'L'}`),
        drvStep('and find how close x must be to deliver it',
          `|${dv('x')} ${dop('−')} ${dv('a')}| ${dop('<')} δ`,
          Number.isFinite(d1) ? `the largest δ that works is ${n(d1)} — found by bisection, not by algebra` : 'no δ works — the limit does not exist here'),
        drvSay('the order of the quantifiers is the entire definition',
          'ε is chosen by an adversary, first. δ is your reply, and it is allowed to depend on ε — that is the only reason the definition is satisfiable. Reverse the order, demanding one δ that works for every ε, and you have defined something almost nothing satisfies. Nearly every misunderstanding of limits is a misreading of this ordering.'),
        drvStep('now the adversary halves the tolerance',
          `ε ${dop('→')} ε/2 ${dop('⇒')} δ ${dop('→')} ?`,
          Number.isFinite(d2) ? `δ becomes ${n(d2)}, a factor of ${n(d1 / (d2 || 1e-30))} smaller` : 'no δ works at the tighter tolerance'),
        drvSay('and that ratio is not decoration',
          'For a straight line, halving ε exactly halves δ: the ratio is 2, and the reciprocal of that ratio is the slope. For a steeper function δ must shrink faster. The rate at which δ responds to ε <em>is</em> the local steepness — which is why the derivative can be built out of limits rather than the other way round.'),
        drvStep('the limit exists only if both sides agree',
          `${dlim(dv('x'), dv('a') + '⁻')}${dv('f')} ${dop('=')} ${dlim(dv('x'), dv('a') + '⁺')}${dv('f')} ${dop('=')} ${dv('L')}`,
          `left ${L.left.settled ? n(L.left.value) : 'never settles'}, right ${L.right.settled ? n(L.right.value) : 'never settles'} — ${L.exists ? 'they agree' : 'they do not'}`),
        drvSay('which is what the three failure modes are',
          'If the two sides settle on different numbers there is a jump, and no redefinition repairs it. If they run away there is an infinite discontinuity. If they never settle at all — sin(1/x) near zero oscillates infinitely often in every neighbourhood — the failure is essential, and zooming in makes the picture no simpler, which is the honest visual meaning of "essential".')
      ],
      note:'Nothing here is approximate. The δ in the panel is genuinely searched for by bisection — the routine tests whether every x within δ of a lands within ε of L, and shrinks δ until it does. When the readout says a δ exists, one has been found.'
    };
  },
  readout(st){
    const C = clLimitCur(st), f = st.f;
    if(!f) return `<div class="card tight">${st.err}</div>`;
    const L = clLimit(f, C.a);
    const K = clContinuity(f, C.a);
    const eps = 0.1, d1 = clDeltaFor(f, C.a, L.value, eps, 2);
    const d2 = clDeltaFor(f, C.a, L.value, eps / 2, 2);
    return `<div class="card tight"><div class="ttl">The two one-sided limits</div>
      ${kv('from the left', L.left.settled ? fmtNum(L.left.value, 8) : 'never settles')}
      ${kv('from the right', L.right.settled ? fmtNum(L.right.value, 8) : 'never settles')}
      ${kv('do they agree?', L.exists ? 'yes' : 'no')}
      ${kv('the limit', L.exists ? fmtNum(L.value, 8) : 'does not exist')}
      ${kv('why', L.reason)}
      ${kv('f(a) itself', Number.isFinite(f(C.a)) ? fmtNum(f(C.a), 8) : 'not defined there')}
    </div>
    <div class="card tight"><div class="ttl">Continuity at x = ${fmtNum(C.a, 3)}</div>
      ${kv('① is f defined there?', K.defined ? 'yes' : 'no')}
      ${kv('② does the limit exist?', L.exists ? 'yes' : 'no')}
      ${kv('③ do they agree?', K.agrees ? 'yes' : 'no')}
      ${kv('verdict', K.kind)}
      <p class="help">Continuity needs all three, and the three failure modes have names because they
      behave differently: a <b>removable</b> discontinuity can be repaired by redefining one value, a
      <b>jump</b> cannot be repaired at all, and an <b>essential</b> one is not even approachable.</p>
    </div>
    ${Number.isFinite(L.value) ? `<div class="card tight"><div class="ttl">The ε–δ game, played</div>
      ${kv('ε', fmtNum(eps, 3))}
      ${kv('largest δ that works', fmtNum(d1, 6))}
      ${kv('now halve ε to', fmtNum(eps / 2, 4))}
      ${kv('and δ becomes', fmtNum(d2, 6))}
      ${kv('ratio', fmtNum(d1 / (d2 || 1e-30), 4))}
      <p class="help">The δ is found by <b>bisection</b>: the routine actually tests whether every x within
      δ of a lands within ε of L, and shrinks δ until it does. For a linear function halving ε halves δ;
      for a steeper one δ shrinks faster, and that rate <i>is</i> the derivative.</p>
      <p class="help">The formal definition says: for <i>every</i> ε &gt; 0, however small, such a δ
      exists. That quantifier order is the whole content — δ is allowed to depend on ε, and must.</p>
    </div>` : ''}`;
  },
  chip(st){
    if(!st.f) return `<div class="k">error</div>`;
    const L = clLimit(st.f, clLimitCur(st).a);
    return `<div class="k">limit</div>
      <div style="color:${L.exists ? 'var(--c-pos)' : 'var(--c-neg)'}">${L.exists ? fmtNum(L.value, 6) : 'does not exist'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'f(x)'], ['var(--c-warn)', 'the limit L, and the open circle'],
                    ['var(--c-neg)', 'approaching from the left'], ['var(--c-pos)', 'from the right']]; },
  dockLegend:true
};

/* ---- 2 · the three value theorems ----------------------------------------- */
STAGES.clTheorems = {
  title:'IVT, EVT and the Mean Value Theorem',
  enter(st, o){
    st.which = o.which || 'mvt';
    st.src = o.src || 'x^3-3x+1';
    st.a = -2.2; st.b = 2.4; st.target = 0;
    st.F = clBundle(st.src);
  },
  controls(){
    const st = ST;
    return ctSeg('clTW', st.which, [['ivt', 'Intermediate Value'], ['evt', 'Extreme Value'], ['mvt', 'Mean Value']]) +
      pkSrcSeg('clTF', st.src, [['x^3-3x+1', 'x³ − 3x + 1'], ['sin(x)+0.4x', 'sin x + 0.4x'],
                              ['exp(-x^2)*3', '3e^(−x²)'], ['abs(x)', '|x|  — not differentiable']], 'x^3-3x') +
      pkSrcBox('clTF', st.src, 'f(x) =', 'x') +
      ctlRow('a', ctlSlider('clTa', -3, 0, 0.02, st.a)) +
      ctlRow('b', ctlSlider('clTb', 0.2, 3, 0.02, st.b)) +
      (st.which === 'ivt' ? ctlRow('target value', ctlSlider('clTt', -4, 4, 0.02, st.target)) : '') +
      `<p class="help">${st.which === 'ivt'
        ? 'A continuous function on [a,b] takes <i>every</i> value between f(a) and f(b) at least once. The witness drawn here is found by <b>bisection</b> — halve the interval, keep the half where the sign changes, repeat — so the theorem is demonstrated rather than asserted. It is an existence theorem and says nothing about how many crossings there are or where.'
        : st.which === 'evt'
        ? 'A continuous function on a <b>closed, bounded</b> interval attains a maximum and a minimum. Both hypotheses are load-bearing: on the open interval (0,1) the function x has neither, and on [0,∞) it has no maximum. The extremes may sit at an endpoint rather than at a critical point, which is why "check the endpoints" is a step and not a formality.'
        : 'If f is continuous on [a,b] and differentiable inside, some interior <b>c</b> has f′(c) equal to the average rate of change (f(b)−f(a))/(b−a). Geometrically: some tangent is parallel to the chord. <b>Rolle\'s theorem</b> is the case f(a) = f(b), where that tangent is horizontal.'}</p>
      <p class="help">${st.which === 'mvt'
        ? 'Choose |x| and drag a and b across zero: the chord has a perfectly good slope and yet no tangent matches it, because differentiability fails at one interior point. One point is enough to break the theorem, which is why the hypothesis is stated the way it is.'
        : 'Every c drawn is located numerically, by scanning for sign changes and refining by bisection — nothing is hard-coded, so switching the function genuinely re-solves.'}</p>`;
  },
  wire(){
    ctWireSeg('clTW', v => { ST.which = v; });
    ctWireSeg('clTF', v => { ST.src = v; ST.F = clBundle(v); });
    pkSrcWire('clTF', ST.src, v => { ST.src = v; ST.F = clBundle(v); });
    wireSlider('clTa', () => ST.a, v => { ST.a = v; }, v => fmtNum(+v, 3));
    wireSlider('clTb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('clTt', () => ST.target, v => { ST.target = v; }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    const F = st.F, a = st.a, b = st.b;
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i <= 400; i++){
      const v = F.f(-3.2 + 6.4 * i / 400);
      if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    const pad = (hi - lo) * 0.16;
    const P = mkPlot(76, 46, W - 124, H - 134, -3.2, 3.2, lo - pad, hi + pad);
    plotFrame(ctx, P, 'x', 'f(x)', { ivt:'Intermediate Value Theorem', evt:'Extreme Value Theorem',
      mvt:'Mean Value Theorem' }[st.which]);
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [-3, -1.5, 0, 1.5, 3], v => fmtNum(v, 2));
    /* shade the interval under discussion */
    ctx.fillStyle = rgbCss(TH.grad, 0.08);
    ctx.fillRect(P.X(a), P.py, P.X(b) - P.X(a), P.ph);
    plotCurve(ctx, P, F.f, 900, rgbCss(TH.grad), 2.4);
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1.2;
    for(const x of [a, b]){ ctx.beginPath(); ctx.moveTo(P.X(x), P.py); ctx.lineTo(P.X(x), P.py + P.ph); ctx.stroke(); }
    if(st.which === 'ivt'){
      const iv = clIVT(F.f, a, b, st.target);
      ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 1.8; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(P.X(a), P.Y(st.target)); ctx.lineTo(P.X(b), P.Y(st.target)); ctx.stroke();
      ctx.setLineDash([]);
      ctDot(ctx, P, a, F.f(a), 5, rgbCss(TH.pos), rgbCss(TH.bg));
      ctDot(ctx, P, b, F.f(b), 5, rgbCss(TH.pos), rgbCss(TH.bg));
      if(iv.applies && Number.isFinite(iv.c)) ctDot(ctx, P, iv.c, st.target, 7, rgbCss(TH.curl), rgbCss(TH.bg));
      /* every crossing, not only the bisected one */
      for(const r of nqRoots(x => F.f(x) - st.target, a, b, 900))
        ctDot(ctx, P, r, st.target, 4, rgbCss(TH.curl, 0.6), rgbCss(TH.bg));
    } else if(st.which === 'evt'){
      const E = clEVT(F.f, a, b, 6000);
      for(const [x, y, col] of [[E.argmax, E.max, TH.pos], [E.argmin, E.min, TH.neg]]){
        ctx.strokeStyle = rgbCss(col, 0.8); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(P.px, P.Y(y)); ctx.lineTo(P.px + P.pw, P.Y(y)); ctx.stroke();
        ctx.setLineDash([]);
        ctDot(ctx, P, x, y, 7, rgbCss(col), rgbCss(TH.bg));
      }
    } else {
      const M = clMVT(F.f, F.d1, a, b);
      ctPath(ctx, { X:P.X, Y:P.Y, u:1 }, [{ x:a, y:F.f(a) }, { x:b, y:F.f(b) }], rgbCss(TH.warn), 2.4);
      ctDot(ctx, P, a, F.f(a), 5, rgbCss(TH.warn), rgbCss(TH.bg));
      ctDot(ctx, P, b, F.f(b), 5, rgbCss(TH.warn), rgbCss(TH.bg));
      for(const c of M.cs){
        const y = F.f(c), s = M.slope, half = (b - a) * 0.3;
        ctPath(ctx, { X:P.X, Y:P.Y }, [{ x:c - half, y:y - s * half }, { x:c + half, y:y + s * half }],
               rgbCss(TH.curl), 2);
        ctDot(ctx, P, c, y, 6, rgbCss(TH.curl), rgbCss(TH.bg));
      }
    }
    stageNote(ctx, st.which === 'mvt'
      ? 'the orange chord and every purple tangent parallel to it — the theorem says at least one must exist'
      : st.which === 'ivt' ? 'every crossing of the target level, located by bisection'
      : 'the extreme values, and where on the closed interval they are attained', W, H);
  },
  derive(st){
    const F = st.F, a = st.a, b = st.b;
    const n = v => fmtNum(v, 6);
    if(st.which === 'ivt'){
      const iv = clIVT(F.f, a, b, st.target);
      const all = nqRoots(x => F.f(x) - st.target, a, b, 900);
      return {
        title:'Why a continuous function cannot skip a value',
        steps:[
          drvStep('the two endpoint values straddle the target',
            `${dv('f')}(${dv('a')}) ${dop('≤')} ${dv('N')} ${dop('≤')} ${dv('f')}(${dv('b')})`,
            `f(a) = ${n(F.f(a))}, f(b) = ${n(F.f(b))}, target ${n(st.target)} — ${iv.applies ? 'it lies between' : 'it does not, so the theorem says nothing'}`),
          drvSay('the proof is the algorithm',
            'Cut the interval in half. The target still lies between the values at the ends of one of the two halves — it must, because the function has not skipped anything at the midpoint either. Keep that half and repeat. The nested intervals shrink to a point, and continuity forces the value there to be exactly N.'),
          drvStep('each bisection halves the uncertainty',
            `${dv('b')}ₙ ${dop('−')} ${dv('a')}ₙ ${dop('=')} ${dfrac(dv('b') + ' − ' + dv('a'), '2ⁿ')}`,
            `starting width ${n(b - a)}; after 40 halvings, ${fmtSig((b - a) / Math.pow(2, 40), 4)}`),
          drvStep('and the nested intervals close on a witness',
            `${dv('f')}(${dv('c')}) ${dop('=')} ${dv('N')}`,
            iv.applies ? `c = ${n(iv.c)}, and f(c) = ${n(F.f(iv.c))}` : 'no witness — the hypothesis failed'),
          drvSay('but existence is not counting',
            `The theorem promises at least one crossing. There are in fact ${all.length} here. Slide the target and watch that count jump between one and three while the theorem never notices — it was never a statement about how many.`),
          drvSay('where continuity is doing the work',
            'Drop continuity and the argument collapses at the last step: the nested intervals still shrink to a point, but nothing forces the value there to be the limit of the values around it. A function with a jump steps over every value in the gap without ever taking one of them.')
        ],
        note:'Every root-finding method rests on this theorem, and bisection is not merely inspired by the proof — it is the proof, run to numerical convergence. It is also why a continuous temperature field on the equator has two antipodal points at the same temperature, and why any cut halving one pancake also halves some second pancake.'
      };
    }
    if(st.which === 'evt'){
      const E = clEVT(F.f, a, b, 8000);
      const crit = nqRoots(F.d1, a, b, 900);
      const atEnd = Math.abs(E.argmax - a) < 1e-3 || Math.abs(E.argmax - b) < 1e-3;
      return {
        title:'Why a closed interval guarantees a largest value',
        steps:[
          drvSay('the claim is less obvious than it sounds',
            'A set of numbers can have a least upper bound it never attains: the values of x on (0,1) get arbitrarily close to 1 and never reach it. The theorem says that for a continuous function on a closed bounded interval this cannot happen — the supremum is actually achieved at some point.'),
          drvStep('first, the function is bounded at all',
            `${dv('f')} is bounded on [${dv('a')}, ${dv('b')}]`,
            `here f runs from ${n(E.min)} to ${n(E.max)} on [${n(a)}, ${n(b)}]`),
          drvSay('and both hypotheses are load-bearing',
            'On the open interval (0,1) the function x has neither a maximum nor a minimum — the endpoints where they would live are not in the set. On the unbounded [0,∞) it has no maximum either. Remove continuity and 1/x on (0,1] is not even bounded. Each hypothesis blocks a specific counterexample.'),
          drvStep('so the extremes exist, and can only be in two places',
            `${dv('f')}′(${dv('c')}) ${dop('=')} 0 &nbsp;or&nbsp; ${dv('c')} ${dop('∈')} {${dv('a')}, ${dv('b')}}`,
            `${crit.length} interior critical point${crit.length === 1 ? '' : 's'} found by scanning for sign changes in f′`),
          drvStep('list the candidates and compare',
            `max ${dop('=')} max{ ${dv('f')}(${dv('a')}), ${dv('f')}(${dv('b')}), ${dv('f')}(critical points) }`,
            `maximum ${n(E.max)} at x = ${n(E.argmax)} — ${atEnd ? 'an endpoint' : 'an interior critical point'}`),
          drvSay('which is why "check the endpoints" is a step, not a formality',
            'Drag a and b and watch the winner switch between an interior maximum and an endpoint. Interior extremes must have zero derivative because the function can be beaten on both sides otherwise; endpoints are exempt from that argument, because there is no "other side" to beat them on.')
        ],
        note:'This theorem is what makes optimisation a finite problem. Without it, "find the maximum" might have no answer, and the candidates method would be searching for something that does not exist.'
      };
    }
    const M = clMVT(F.f, F.d1, a, b);
    return {
      title:'From Rolle to the Mean Value Theorem, by tilting the picture',
      steps:[
        drvStep('the chord has an average slope',
          `${dv('m')} ${dop('=')} ${dfrac(dv('f') + '(' + dv('b') + ') − ' + dv('f') + '(' + dv('a') + ')', dv('b') + ' − ' + dv('a'))}`,
          `(${n(F.f(b))} − ${n(F.f(a))}) / (${n(b)} − ${n(a)}) = ${n(M.slope)}`),
        drvSay('start with the easy case, where the chord is flat',
          'Rolle\'s theorem: if f(a) = f(b), some interior point has a horizontal tangent. That much is believable from the picture — the function has to come back, so it must turn round somewhere, and at a turning point in the interior the derivative is zero. The Extreme Value Theorem supplies the turning point and Fermat\'s rule makes its derivative vanish.'),
        drvStep('now subtract the chord from the function',
          `${dv('g')}(${dv('x')}) ${dop('=')} ${dv('f')}(${dv('x')}) ${dop('−')} [${dv('f')}(${dv('a')}) ${dop('+')} ${dv('m')}(${dv('x')} ${dop('−')} ${dv('a')})]`,
          'a straight-line correction, chosen so that g(a) = g(b) = 0'),
        drvSay('this is the whole trick',
          'Tilting the picture until the chord is level costs nothing — subtracting a straight line changes every derivative by the same constant m. So Rolle applies to g, and translating its conclusion back gives the general statement. The Mean Value Theorem is Rolle with the coordinates rotated.'),
        drvStep('Rolle gives a point where g′ vanishes',
          `${dv('g')}′(${dv('c')}) ${dop('=')} ${dv('f')}′(${dv('c')}) ${dop('−')} ${dv('m')} ${dop('=')} 0`,
          `so f′(c) = ${n(M.slope)}`),
        drvStep('which is the theorem',
          `${dv('f')}′(${dv('c')}) ${dop('=')} ${dfrac(dv('f') + '(' + dv('b') + ') − ' + dv('f') + '(' + dv('a') + ')', dv('b') + ' − ' + dv('a'))}`,
          M.cs.length ? `${M.cs.length} such point${M.cs.length === 1 ? '' : 's'}: ${M.cs.map(c => n(c)).join(', ')}` : 'none — differentiability failed somewhere inside'),
        drvSay('and one bad point is enough to destroy it',
          M.cs.length
            ? 'Switch the function to |x| and drag a and b across zero. The chord still has a perfectly good slope, and no tangent anywhere matches it, because differentiability fails at exactly one interior point. That is why the hypothesis is stated as it is rather than loosely.'
            : 'This is the |x| case: the chord has a slope, and no tangent matches it. Differentiability failed at a single interior point, and a single point was enough.')
      ],
      note:'The MVT is the workhorse behind most of the subject. "f′ > 0 implies f is increasing" is the MVT. "Two functions with the same derivative differ by a constant" is the MVT. The Taylor remainder bound is the MVT applied n+1 times. It is the only bridge from what a derivative says at a point to what a function does across an interval.'
    };
  },
  readout(st){
    const F = st.F, a = st.a, b = st.b;
    if(st.which === 'ivt'){
      const iv = clIVT(F.f, a, b, st.target);
      const all = nqRoots(x => F.f(x) - st.target, a, b, 900);
      return `<div class="card tight"><div class="ttl">Intermediate Value Theorem</div>
        ${kv('f(a)', fmtNum(F.f(a), 6))}${kv('f(b)', fmtNum(F.f(b), 6))}
        ${kv('target', fmtNum(st.target, 6))}
        ${kv('does it lie between them?', iv.applies ? 'yes — the theorem applies' : 'no — the theorem says nothing')}
        ${kv('a witness c', iv.applies ? fmtNum(iv.c, 8) : '—')}
        ${kv('f(c)', iv.applies ? fmtNum(F.f(iv.c), 8) : '—')}
        ${kv('how many crossings in fact', String(all.length))}
        <p class="help">The theorem promises <i>at least</i> one. Slide the target and watch the count jump
        between one and three without the theorem ever noticing — an existence statement is not a counting
        statement. Bisection is the constructive proof: it is the same algorithm, run to convergence.</p>
      </div>
      <div class="card tight"><div class="ttl">What it is good for</div>
        <p class="help">Every root-finding method rests on this. It is also how you prove a fixed point
        exists, why a continuous temperature field on the equator has two antipodal points at the same
        temperature, and why any way of cutting a pancake in half also bisects some second pancake.</p>
      </div>`;
    }
    if(st.which === 'evt'){
      const E = clEVT(F.f, a, b, 8000);
      const crit = nqRoots(F.d1, a, b, 900);
      return `<div class="card tight"><div class="ttl">Extreme Value Theorem</div>
        ${kv('interval', `[${fmtNum(a, 4)}, ${fmtNum(b, 4)}]`)}
        ${kv('maximum value', fmtNum(E.max, 7))}
        ${kv('attained at', fmtNum(E.argmax, 6))}
        ${kv('minimum value', fmtNum(E.min, 7))}
        ${kv('attained at', fmtNum(E.argmin, 6))}
        ${kv('is the max at an endpoint?', (Math.abs(E.argmax - a) < 1e-3 || Math.abs(E.argmax - b) < 1e-3) ? 'yes' : 'no — it is at a critical point')}
        ${kv('interior critical points', String(crit.length))}
      </div>
      <div class="card tight"><div class="ttl">The candidates method</div>
        ${crit.map(c => kv('f(' + fmtNum(c, 4) + ')', fmtNum(F.f(c), 6))).join('')}
        ${kv('f(a)', fmtNum(F.f(a), 6))}${kv('f(b)', fmtNum(F.f(b), 6))}
        <p class="help">On a closed interval the extremes can only occur at a critical point or at an
        endpoint, so listing those and comparing values is a complete method. Drag the endpoints and watch
        the winner change from an interior maximum to an endpoint — that switch is exactly why the
        endpoints must be checked.</p>
      </div>`;
    }
    const M = clMVT(F.f, F.d1, a, b);
    return `<div class="card tight"><div class="ttl">Mean Value Theorem</div>
      ${kv('f(a)', fmtNum(F.f(a), 6))}${kv('f(b)', fmtNum(F.f(b), 6))}
      ${kv('average rate (f(b)−f(a))/(b−a)', fmtNum(M.slope, 7))}
      ${kv('how many c satisfy f′(c) = that', String(M.cs.length))}
      ${M.cs.map(c => kv('c =', fmtNum(c, 7) + '   f′(c) = ' + fmtNum(F.d1(c), 7))).join('')}
      ${kv('is this Rolle\'s case?', M.rolle ? 'yes — the endpoints agree, so the tangent is horizontal' : 'no')}
      <div class="dstep"><div class="lbl">f</div>${texEq(F.ast)}</div>
      <div class="dstep"><div class="lbl">f′</div>${texEq(F.a1)}</div>
    </div>
    <div class="card tight"><div class="ttl">Why it matters more than it looks</div>
      ${kv('|x| on an interval spanning 0', M.cs.length ? 'has a c' : 'has no such c — differentiability failed')}
      <p class="help">The MVT is the workhorse behind almost every theorem in the subject. "f′ &gt; 0
      implies f is increasing" is the MVT. "Two functions with the same derivative differ by a constant" is
      the MVT. The error bound on a Taylor polynomial is the MVT applied n+1 times. It is the bridge from
      what a derivative says <i>at a point</i> to what a function does <i>over an interval</i>, and without
      it there is no such bridge.</p>
    </div>`;
  },
  chip(st){
    if(st.which === 'mvt'){
      const M = clMVT(st.F.f, st.F.d1, st.a, st.b);
      return `<div class="k">chord slope</div><div style="color:var(--c-warn)">${fmtNum(M.slope, 5)}</div>
        <div>${M.cs.length} tangent${M.cs.length === 1 ? '' : 's'} match</div>`;
    }
    if(st.which === 'evt'){
      const E = clEVT(st.F.f, st.a, st.b, 3000);
      return `<div class="k">extremes</div><div style="color:var(--c-pos)">max ${fmtNum(E.max, 5)}</div>
        <div style="color:var(--c-neg)">min ${fmtNum(E.min, 5)}</div>`;
    }
    const iv = clIVT(st.F.f, st.a, st.b, st.target);
    return `<div class="k">IVT</div><div style="color:var(--c-curl)">${iv.applies ? 'c = ' + fmtNum(iv.c, 5) : 'does not apply'}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'f(x)'], ['var(--c-warn)', 'the chord, or the target level'],
                    ['var(--c-curl)', 'the witness c'], ['var(--c-pos)', 'the maximum'], ['var(--c-neg)', 'the minimum']]; },
  dockLegend:true
};

/* ---- 3 · the derivative as a limit of secants ----------------------------- */
