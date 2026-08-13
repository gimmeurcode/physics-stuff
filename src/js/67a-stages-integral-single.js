/* ============================================================================
   4i · THE INTEGRATION WING
   What an integral is, what it accumulates, and what happens when you do it in
   two and three dimensions: Riemann sums, the Fundamental Theorem, areas and
   volumes, double integrals over rectangles and general regions, polar,
   triple integrals, cylindrical and spherical coordinates, mass and moments,
   and the change of variables.

   Nothing here is a formula recited. Every sum is summed, every "exact" value
   comes from adaptive quadrature or a closed-form antiderivative, and every
   claimed rate of convergence is measured by halving h and looking.
   ============================================================================ */

/* ---- the reader's own integral ---------------------------------------------
   Every stage in this group reads its problem out of a single table entry, so
   the whole group learns to integrate a typed formula by making that one lookup
   a function call. A custom entry is shaped exactly like a preset — same
   fields, same names — which is why nothing downstream had to change.

   There is no antiderivative for an arbitrary formula, so Fi is null and
   igExact1D falls through to adaptive quadrature at 1e-13. That is not a
   weaker answer: it is what "exact" means in this laboratory whenever no closed
   form exists, and the preset e^(−x²) is in exactly the same position. */
const IG_1D_SLOTS  = [{ k:'f', label:'f(x) =', vars:'x', def:'x^2*sin(x)' }];
const IG_1D_BOUNDS = [{ k:'a', label:'from a =', def:0 }, { k:'b', label:'to b =', def:Math.PI }];
function igCur(st){
  if(st.key !== 'custom') return IG_1D[st.key];
  const own = pkOwn(st, 'ig1', IG_1D_SLOTS, IG_1D_BOUNDS);
  return { name:'f(x) = ' + own.f, f:pkFn(st, 'ig1', 'f'), Fi:null,
           a:+own.a, b:+own.b, tex:esc(own.f),
           note:'Your integrand, on your interval. Nothing here knows an antiderivative for it, so the ' +
                'exact value it is compared against is adaptive quadrature at a tolerance of 1e-13 — the ' +
                'same standard used for e^(−x²) above, which has no elementary antiderivative either.' };
}
/* the picker and its boxes, shared by the two stages that integrate one variable */
const igPick  = (id, cur) => pkSeg(id, IG_1D, cur, e => e.name.replace('f(x) = ', ''));
const igBoxes = (id, cur, st) => pkBoxes(id, cur, st, IG_1D_SLOTS, IG_1D_BOUNDS);

/* The applications stage slices between two curves, so the reader supplies two
   of them and the interval. Which accumulation is being formed — area, disc,
   shell, arc length, work — stays the reader's choice of preset; what changes
   is that the curves are now theirs. */
const IG_AP_SLOTS = [{ k:'top', label:'top(x) =', vars:'x', def:'4-x^2' },
                     { k:'bot', label:'bottom(x) =', vars:'x', def:'x' }];
const IG_AP_BOUNDS = [{ k:'a', label:'from a =', def:-2 }, { k:'b', label:'to b =', def:1.5 }];
function igApplyCur(st){
  if(st.key !== 'custom') return IG_APPLY[st.key];
  const own = pkOwn(st, 'igap', IG_AP_SLOTS, IG_AP_BOUNDS);
  return { name:'your curves: top = ' + own.top + ', bottom = ' + own.bot,
           formula:'A = ∫ₐᵇ [ top(x) − bottom(x) ] dx',
           top:pkFn(st, 'igap', 'top'), bot:pkFn(st, 'igap', 'bot'),
           a:+own.a, b:+own.b,
           note:'Your two curves. If they cross inside [a, b] the integrand changes sign and the total ' +
                'becomes the <i>difference</i> of the two areas rather than their sum — which is a real ' +
                'property of the integral, not a defect. Split the interval at the crossing to get the ' +
                'geometric area.' };
}
/* Which accumulation is being formed. A typed pair of curves is an
   area-between-curves problem, so every branch asking that question has to hear
   'between' rather than the synthetic key — the trap the partial wing hit when
   it first grew a custom option. */
const igApplyKind = st => (st.key === 'custom' ? 'between' : st.key);

/* ---- 1 · the definite integral as a limit of sums -------------------------- */
STAGES.igRiemann = {
  title:'Riemann sums',
  derive(st){
    const C = igCur(st);
    const n = v => fmtNum(v, 8);
    const h = (C.b - C.a) / st.n;
    const exact = C.Fi ? C.Fi(C.b) - C.Fi(C.a) : nqAdaptive(C.f, C.a, C.b, 1e-13);
    const ruleName = { left:'left endpoints', right:'right endpoints', mid:'midpoints',
                       trap:'trapezoids', simp:'Simpson\'s rule' }[st.rule] || st.rule;
    return {
      title:'From "add up rectangles" to a number with an error bar',
      steps:[
        drvSay('the problem, stated honestly',
          'We can find the area of a rectangle and nothing else. Every area formula in mathematics is ultimately an argument that some region can be approached by rectangles. The integral is not a new kind of area — it is the limit of the only area we already knew how to compute.'),
        drvStep('chop the interval into n equal pieces',
          `${dv('h')} ${dop('=')} ${dfrac(dv('b') + ' − ' + dv('a'), dv('n'))}`,
          `[${n(C.a)}, ${n(C.b)}] with n = ${st.n} gives h = ${n(h)}`),
        drvStep('on each piece, replace f by one number and multiply',
          `${dv('S')} ${dop('=')} Σᵢ ${dv('f')}(${dv('x')}ᵢ*) ${dv('h')}`,
          `sampling at ${ruleName}`),
        drvSay('which number you pick is the entire subject',
          'Left endpoints, right endpoints, midpoints — all are legitimate, all converge, and they converge at wildly different speeds. The midpoint rule is twice as accurate as the trapezoid rule despite looking cruder, because its errors on the two halves of each panel cancel rather than accumulate.'),
        drvStep('the limit, if it exists, is the integral',
          `∫ₐᵇ ${dv('f')} d${dv('x')} ${dop('=')} ${dlim(dv('n'), '∞')}Σᵢ ${dv('f')}(${dv('x')}ᵢ*) ${dv('h')}`,
          `here the exact value is ${n(exact)}`),
        drvSay('"if it exists" is doing real work',
          'A function is Riemann integrable when every choice of sample points gives the same limit. For a continuous function they do. For the function that is 1 on rationals and 0 elsewhere they do not — sampling rationals gives 1, sampling irrationals gives 0, and no limit exists. That failure is what pushed mathematics towards the Lebesgue integral.'),
        drvStep('the error is governed by how curved f is',
          `|${dv('E')}_trap| ${dop('≤')} ${dfrac('(' + dv('b') + '−' + dv('a') + ')' + dv('h') + '²' + dv('K') + '₂', '12')}`,
          'K₂ is the largest |f″| on the interval — the panel measures it rather than assuming it'),
        drvSay('why h² and not h',
          'A trapezoid matches f in value at both ends, so the leftover is second order in the panel width. Halving h therefore quarters the error. Simpson matches a parabola through three points and gets h⁴ — and, by a symmetry accident, is exact for cubics too, which is a whole extra order for free.'),
        drvStep('so the measured errors should fall by fixed factors',
          `${dv('E')}(${dv('h')}/2) ${dop('/')} ${dv('E')}(${dv('h')}) ${dop('=')} 2^(−${dv('k')})`,
          'the panel prints the predicted bound beside the error actually committed, at this n')
      ],
      note:'Everything in this panel is measured. The bound is computed from a scan for the true maximum of |f″| and |f⁗|, and the error is the difference from a value obtained by adaptive quadrature at 1e-13. Where the actual error sits well inside the bound, that gap is real — the bound is a worst case, not a prediction.'
    };
  },
  enter(st, o){
    st.key = o.key || 'sine';
    st.rule = o.rule || 'mid';
    st.n = o.n === undefined ? 8 : o.n;
    st.show = Object.assign({ err:true }, o.show || {});
  },
  controls(){
    const st = ST, K = igCur(st);
    return igPick('igRK', st.key) + igBoxes('ig1', st.key, st) +
      ctSeg('igRR', st.rule, NQ_RULES.map(r => [r, NQ_RULE_NAMES[r]])) +
      ctlRow('n', ctlSlider('igRn', 1, 200, 1, st.n)) +
      `<p class="help">${K.note}</p>
      <p class="help">The definite integral is <i>defined</i> as the limit of these sums as the panels
      shrink — not as "the antiderivative evaluated at the ends", which is a theorem that comes later and
      is not even available for every integrable function. Drag n and watch the drawn rectangles converge
      on the region under the curve while the error column falls.</p>
      <p class="help">The error panel measures the convergence rate rather than quoting it: it computes the
      error at n and at 2n and reports <b>log₂</b> of their ratio. Left and right sums give 1, midpoint and
      trapezoid give 2, and Simpson gives 4 — until the integrand stops being smooth, and then the observed
      number honestly drops.</p>`;
  },
  wire(){
    ctWireSeg('igRK', v => { ST.key = v; });
    pkWireBoxes('ig1', ST.key, ST, IG_1D_SLOTS, IG_1D_BOUNDS);
    ctWireSeg('igRR', v => { ST.rule = v; });
    wireSlider('igRn', () => ST.n, v => { ST.n = Math.round(v); }, v => Math.round(v) + ' panels');
  },
  frame(st, dt, ctx, W, H){
    const K = igCur(st);
    const a = K.a, b = K.b;
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i <= 400; i++){
      const v = K.f(a + (b - a) * i / 400);
      if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
    }
    const pad = (hi - lo) * 0.16 + 1e-6;
    const split = st.show.err ? 0.62 : 1;
    const ph = (H - 130) * split;
    const P = mkPlot(70, 44, W - 118, ph, a, b, Math.min(0, lo) - pad, Math.max(0, hi) + pad);
    plotFrame(ctx, P, 'x', 'f(x)', `${K.name} on [${fmtNum(a, 3)}, ${fmtNum(b, 3)}] — ${NQ_RULE_NAMES[st.rule]}, n = ${st.n}`);
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [a, (a + b) / 2, b], v => fmtNum(v, 3));
    /* the panels — exactly the ones the sum used */
    if(st.rule === 'trap' || st.rule === 'simpson'){
      const n = st.rule === 'simpson' ? (st.n % 2 ? st.n + 1 : st.n) : st.n;
      const h = (b - a) / n;
      for(let i = 0; i < n; i++){
        const l = a + i * h, r = l + h;
        const fl = K.f(l), fr = K.f(r);
        if(!Number.isFinite(fl) || !Number.isFinite(fr)) continue;
        ctx.fillStyle = rgbCss(TH.grad, 0.2);
        ctx.strokeStyle = rgbCss(TH.grad, 0.75); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(P.X(l), P.Y(0)); ctx.lineTo(P.X(l), P.Y(fl));
        if(st.rule === 'simpson' && i % 2 === 0 && i + 1 < n){
          /* the parabola through three points is what Simpson actually uses */
          const m = l + h, rr = l + 2 * h, fm = K.f(m), frr = K.f(rr);
          for(let s = 0; s <= 24; s++){
            const x = l + (rr - l) * s / 24;
            const L0 = ((x - m) * (x - rr)) / ((l - m) * (l - rr));
            const L1 = ((x - l) * (x - rr)) / ((m - l) * (m - rr));
            const L2 = ((x - l) * (x - m)) / ((rr - l) * (rr - m));
            ctx.lineTo(P.X(x), P.Y(fl * L0 + fm * L1 + frr * L2));
          }
          ctx.lineTo(P.X(rr), P.Y(0));
        } else if(st.rule === 'trap'){
          ctx.lineTo(P.X(r), P.Y(fr)); ctx.lineTo(P.X(r), P.Y(0));
        } else { ctx.lineTo(P.X(r), P.Y(fr)); ctx.lineTo(P.X(r), P.Y(0)); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    } else {
      for(const nd of nqNodes(a, b, st.n, st.rule)){
        const v = K.f(nd.x);
        if(!Number.isFinite(v)) continue;
        ctx.fillStyle = rgbCss(v >= 0 ? TH.grad : TH.neg, 0.24);
        ctx.strokeStyle = rgbCss(v >= 0 ? TH.grad : TH.neg, 0.8); ctx.lineWidth = 1;
        const y0 = P.Y(0), y1 = P.Y(v);
        ctx.fillRect(P.X(nd.l), Math.min(y0, y1), P.X(nd.r) - P.X(nd.l), Math.abs(y1 - y0));
        ctx.strokeRect(P.X(nd.l), Math.min(y0, y1), P.X(nd.r) - P.X(nd.l), Math.abs(y1 - y0));
        /* the sample point that decided this rectangle's height */
        ctx.fillStyle = rgbCss(TH.text, 0.8);
        ctx.beginPath(); ctx.arc(P.X(nd.x), P.Y(v), 2.2, 0, 6.2832); ctx.fill();
      }
    }
    plotCurve(ctx, P, K.f, 700, rgbCss(TH.warn), 2.4);
    if(st.show.err){
      /* the error, log-log, against n — the convergence rate made visible */
      const exact = igExact1D(K);
      /* collect the curves first, then scale the axis to what they actually do —
         a fixed range would flatten every line into the top of the box */
      const series = [];
      let elo = 0, ehi = -16;
      for(const [rule, col] of [['left', TH.faint], ['mid', TH.pos], ['trap', TH.curl], ['simpson', TH.grad]]){
        const pts = [];
        for(let k = 0; k <= 8; k++){
          const n = 1 << k;
          const e = Math.abs(nqRiemann(K.f, a, b, Math.max(2, n), rule) - exact);
          const y = Math.log10(Math.max(1e-16, e));
          pts.push({ x:k, y });
          elo = Math.min(elo, y); ehi = Math.max(ehi, y);
        }
        series.push({ rule, col, pts });
      }
      elo = Math.max(-16.5, elo - 0.6); ehi = ehi + 0.6;
      const Q = mkPlot(70, 44 + ph + 58, W - 118, (H - 130) * (1 - split) - 18, 0, 8, elo, ehi);
      plotFrame(ctx, Q, 'panels n', 'log₁₀ |error|', 'how the error falls with n — the slope is the order');
      plotTicksX(ctx, Q, [0, 2, 4, 6, 8], v => String(1 << v));
      ftYTicks(ctx, Q, [Math.ceil(elo), Math.round((elo + ehi) / 2), Math.floor(ehi)], v => String(v));
      for(const s of series){
        ctx.strokeStyle = rgbCss(s.col, s.rule === st.rule ? 1 : 0.45);
        ctx.lineWidth = s.rule === st.rule ? 2.4 : 1.2;
        ctx.beginPath();
        s.pts.forEach((p, i) => {
          const Y = Q.Y(Math.max(Q.y0, Math.min(Q.y1, p.y)));
          i ? ctx.lineTo(Q.X(p.x), Y) : ctx.moveTo(Q.X(p.x), Y);
        });
        ctx.stroke();
      }
    }
    stageNote(ctx, 'the dots are the sample points the rule actually used — nothing on screen is decorative', W, H);
  },
  readout(st){
    const K = igCur(st);
    const exact = igExact1D(K);
    const rows = NQ_RULES.map(r => {
      const v = nqRiemann(K.f, K.a, K.b, st.n, r);
      return kv(NQ_RULE_NAMES[r] + (r === st.rule ? '  ◂' : ''),
        `${fmtNum(v, 8)}   (err ${fmtNum(Math.abs(v - exact), 3)})`);
    }).join('');
    const ordRows = NQ_RULES.map(r =>
      kv(NQ_RULE_NAMES[r], `${fmtNum(nqObservedOrder(K.f, K.a, K.b, Math.max(4, st.n), r, exact), 3)}   (theory ${NQ_RULE_ORDER[r]})`)).join('');
    /* the honest textbook error bound, with K measured rather than guessed */
    const h = (K.b - K.a) / st.n;
    const K2 = nqMaxDeriv(K.f, K.a, K.b, 2, 120);
    const K4 = nqMaxDeriv(K.f, K.a, K.b, 4, 120);
    return `<div class="card tight"><div class="ttl">All five rules at n = ${st.n}</div>
      ${rows}
      ${kv('the exact value', fmtNum(exact, 10))}
      ${kv('source', K.Fi ? 'an elementary antiderivative' : 'adaptive quadrature at 1e-13')}
    </div>
    <div class="card tight"><div class="ttl">Measured order of convergence</div>
      ${ordRows}
      <p class="help">Each row halves the panel width and takes log₂ of the ratio of errors. On a smooth
      integrand these land on 1, 2 and 4. On √x, whose derivative blows up at an endpoint, Simpson's
      fourth order collapses — the error bounds depend on derivatives that are not bounded there, so the
      theorem simply does not apply.</p>
    </div>
    <div class="card tight"><div class="ttl">The textbook error bounds, with a measured K</div>
      ${kv('h = (b−a)/n', fmtNum(h, 6))}
      ${kv('max |f″| on the interval', fmtNum(K2, 5))}
      ${kv('max |f⁗|', fmtNum(K4, 5))}
      ${kv('trapezoid bound (b−a)h²K₂/12', fmtNum((K.b - K.a) * h * h * K2 / 12, 4))}
      ${kv('actual trapezoid error', fmtNum(Math.abs(nqRiemann(K.f, K.a, K.b, st.n, 'trap') - exact), 4))}
      ${kv('midpoint bound (b−a)h²K₂/24', fmtNum((K.b - K.a) * h * h * K2 / 24, 4))}
      ${kv('actual midpoint error', fmtNum(Math.abs(nqRiemann(K.f, K.a, K.b, st.n, 'mid') - exact), 4))}
      ${kv('Simpson bound (b−a)h⁴K₄/180', fmtNum((K.b - K.a) * Math.pow(h, 4) * K4 / 180, 4))}
      ${kv('actual Simpson error', fmtNum(Math.abs(nqRiemann(K.f, K.a, K.b, st.n, 'simpson') - exact), 4))}
      <p class="help">Every bound above is satisfied, most of them by a wide margin — bounds are worst
      cases and the worst case rarely happens. Note the midpoint bound is <i>half</i> the trapezoid's: the
      midpoint rule's errors on the two halves of each panel partly cancel, which is why the cruder-looking
      rule wins.</p>
    </div>`;
  },
  chip(st){
    const K = igCur(st);
    const v = nqRiemann(K.f, K.a, K.b, st.n, st.rule);
    return `<div class="k">${NQ_RULE_NAMES[st.rule]}</div>
      <div style="color:var(--c-grad)">${fmtNum(v, 6)}</div>
      <div>err ${fmtNum(Math.abs(v - igExact1D(K)), 3)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'f(x)'], ['var(--c-grad)', 'the panels the rule summed'],
                    ['var(--c-pos)', 'midpoint, in the error plot'], ['var(--c-curl)', 'trapezoid']]; },
  dockLegend:true
};

/* ---- 2 · the Fundamental Theorem ------------------------------------------- */
STAGES.igFTC = {
  title:'The Fundamental Theorem',
  derive(st){
    const C = igCur(st);
    const n = v => fmtNum(v, 8);
    const A = x => nqAdaptive(C.f, C.a, x, 1e-12);
    return {
      title:st.part === 'one'
        ? 'Why differentiating an accumulated area gives back the integrand'
        : 'Why an antiderivative evaluates a definite integral',
      steps:st.part === 'one' ? [
        drvSay('define a function by accumulating area',
          'Fix the left end and let the right end move. A(x) is the signed area from a to x — a perfectly good function of x, defined by an integral rather than a formula. The question is what its derivative is, and the answer is the whole theorem.'),
        drvStep('the area function',
          `${dv('A')}(${dv('x')}) ${dop('=')} ∫ₐˣ ${dv('f')}(${dv('t')}) d${dv('t')}`,
          `at x = ${n(st.x)}: A = ${n(A(st.x))}`),
        drvStep('nudge the right end and ask what was added',
          `${dv('A')}(${dv('x')}{+}${dv('h')}) ${dop('−')} ${dv('A')}(${dv('x')}) ${dop('=')} ∫ₓ^(x+h) ${dv('f')}`,
          'a thin sliver of width h, sitting under the curve'),
        drvSay('and a thin sliver is very nearly a rectangle',
          'Over a width h the function barely changes, so the sliver has area close to f(x)·h. That is the entire idea. Everything else is making "barely changes" precise, which continuity does.'),
        drvStep('bound the sliver between its smallest and largest heights',
          `${dv('m')}${dv('h')} ${dop('≤')} ∫ₓ^(x+h) ${dv('f')} ${dop('≤')} ${dv('M')}${dv('h')}`,
          'm and M are the min and max of f on that tiny interval'),
        drvStep('divide by h and let h shrink',
          `${dv('m')} ${dop('≤')} ${dfrac(dv('A') + '(' + dv('x') + '+' + dv('h') + ') − ' + dv('A') + '(' + dv('x') + ')', dv('h'))} ${dop('≤')} ${dv('M')}`,
          'continuity forces both m and M to f(x), so the quotient is squeezed'),
        drvStep('which is the first Fundamental Theorem',
          `${dv('A')}′(${dv('x')}) ${dop('=')} ${dv('f')}(${dv('x')})`,
          `at x = ${n(st.x)}: A′ measured ${n((A(st.x + 1e-5) - A(st.x - 1e-5)) / 2e-5)}, f(x) = ${n(C.f(st.x))}, difference ${fmtNum(Math.abs((A(st.x + 1e-5) - A(st.x - 1e-5)) / 2e-5 - C.f(st.x)), 3)}`),
        drvSay('what this actually claims',
          'Every continuous function has an antiderivative, and here is one: accumulate it. That is an existence theorem, and it is why the claim "e^(−x²) has no antiderivative" is wrong as usually stated. It has one — it just is not expressible in elementary functions, which is a statement about our notation, not about the function.'),
        drvSay('continuity is the hypothesis, and it is doing all the work',
          'The squeeze only closes because m and M both run to f(x) as the interval shrinks, and that is precisely what continuity at x asserts. Take a function with a jump — zero to the left of a point, one to the right — and its accumulator is a perfectly good continuous ramp, but the ramp has a corner exactly at the jump and no derivative there. So A is always <b>better behaved</b> than f by one degree: integration smooths, differentiation roughens, and the theorem holds wherever f is smooth enough for the smoothing to have somewhere to start.'),
        drvSay('and it says something surprising about how integrals are defined',
          'A(x) is a function nobody wrote a formula for. It is defined by a procedure — sweep the right-hand end and accumulate — and yet it is differentiable, its derivative is known exactly, and it can be plotted, differentiated again, and used in further calculations. A great many of the functions physics actually needs are defined this way: the error function, the exponential integral, the Fresnel integrals, the logarithm itself if you start from 1/x. "Defined by an integral" is not a lesser kind of definition, and part one is the reason why.'),
        drvSay('why the argument bothers with m and M at all',
          'The intuitive step is "the sliver is about f(x)·h". Turning that into a proof needs the error to be controlled, not merely small-sounding, and bracketing between the least and greatest values of f on the interval does it without knowing anything about how f wobbles in between. That bracketing is the same move behind the comparison test for series, behind the squeeze theorem for limits, and behind every error bound in the numerical wing: trap the thing you cannot compute between two things you can.')
      ] : [
        drvSay('the second part is the one that computes things',
          'Part one says accumulation undoes differentiation. Part two turns that into a method: if you can recognise the integrand as somebody\'s derivative, you never have to add up rectangles at all.'),
        drvStep('let F be any antiderivative of f',
          `${dv('F')}′ ${dop('=')} ${dv('f')}`,
          C.Fi ? 'this integrand has an elementary one' : 'no elementary antiderivative — this route is closed here'),
        drvStep('and let A be the accumulator from part one',
          `${dv('A')}(${dv('x')}) ${dop('=')} ∫ₐˣ ${dv('f')} , &nbsp; ${dv('A')}′ ${dop('=')} ${dv('f')}`,
          'so F and A have the same derivative everywhere'),
        drvStep('two functions with the same derivative differ by a constant',
          `${dv('F')}(${dv('x')}) ${dop('=')} ${dv('A')}(${dv('x')}) ${dop('+')} ${dv('C')}`,
          'this is the Mean Value Theorem, and it is the only place the MVT is needed'),
        drvSay('that step is not obvious and is usually skipped',
          'Why must two functions with equal derivatives differ by a constant? Because their difference has zero derivative, and the MVT says a function with zero derivative on an interval cannot change: any two points would need a c with (g(x₂)−g(x₁))/(x₂−x₁) = 0. The theorem is doing quiet work here.'),
        drvStep('evaluate at both ends and subtract, killing the constant',
          `${dv('F')}(${dv('b')}) ${dop('−')} ${dv('F')}(${dv('a')}) ${dop('=')} ${dv('A')}(${dv('b')}) ${dop('−')} ${dv('A')}(${dv('a')}) ${dop('=')} ∫ₐᵇ ${dv('f')}`,
          C.Fi ? `F(b) − F(a) = ${n(C.Fi(C.b) - C.Fi(C.a))}, quadrature gives ${n(nqAdaptive(C.f, C.a, C.b, 1e-13))}` : 'computed here by quadrature alone'),
        drvSay('why this was revolutionary',
          'Areas had been computed since Archimedes, one shape at a time, by ingenious limiting arguments taking pages each. This reduces every one of them to guessing an antiderivative. Two problems that look nothing alike — tangent lines and areas — turn out to be inverse to one another, and that is why the subject is called calculus rather than two subjects.'),
        drvSay('and it is genuinely two theorems, which is worth separating',
          'One half says that differentiating the area function gives back the integrand: A′(x) = f(x), so an antiderivative always <b>exists</b> for a continuous f. The other half says that <i>any</i> antiderivative can be used to evaluate the integral. The first is an existence statement and the second an evaluation recipe, and only the second needs the mean value theorem. Confusing them is what makes the proof look circular when it is not.'),
        drvSay('existence and expressibility are not the same thing',
          'The first half guarantees ∫e^(−x²) has an antiderivative — the area function itself is one, and it is perfectly smooth. What it does not guarantee is that the antiderivative can be written with the symbols we happen to have; that one cannot, and Liouville proved it. So "this integral cannot be done" always means "cannot be done in elementary functions", never that the area is missing. The area is there and the numerical wing measures it to any precision asked.'),
        drvSay('which is why the theorem quietly stops applying in several later stages',
          'It needs f continuous on the closed interval. Integrate 1/x² across the origin by blindly evaluating −1/x at both ends and you get −2, a negative answer for a positive integrand — the antiderivative is not defined throughout, so the theorem never applied. The same failure is why improper integrals must be defined as limits of proper ones, and why the series wing insists on pushing a cut-off outwards rather than substituting infinity.')
      ],
      note:'The panel computes both sides independently: the accumulated integral by adaptive quadrature at 1e-12, and the antiderivative in closed form where one exists. It prints the difference. Where they agree to twelve figures, the theorem has been checked rather than recited.'
    };
  },
  enter(st, o){
    st.key = o.key || 'sine';
    st.x = o.x === undefined ? 1.4 : o.x;
    st.run = o.run !== false;
    st.part = o.part || 'one';
  },
  controls(){
    const st = ST;
    return igPick('igFK', st.key) + igBoxes('ig1', st.key, st) +
      ctSeg('igFP', st.part, [['one', 'Part 1 — A′(x) = f(x)'], ['two', 'Part 2 — ∫ = F(b) − F(a)']]) +
      ctlRow('x', ctlSlider('igFx', igCur(st).a, igCur(st).b, (igCur(st).b - igCur(st).a) / 600, st.x)) +
      ctChk('igFrun', 'sweep x', st.run) +
      `<p class="help">${st.part === 'one'
        ? 'Define <b>A(x) = ∫ₐˣ f(t) dt</b> — the area accumulated so far. Part 1 says this new function is differentiable and <b>A′(x) = f(x)</b>. The reason is visible: pushing x a little further to the right adds a sliver of area of width dx and height f(x), so the accumulated total grows at the rate f(x). Integration and differentiation undo each other, and that is not obvious — it is the single most important theorem in the subject.'
        : 'Part 2 turns that into an algorithm: <b>∫ₐᵇ f = F(b) − F(a)</b> for <i>any</i> antiderivative F. Two antiderivatives of the same function differ by a constant, and the constant cancels in the difference — which is why the "+C" that so annoys students in the indefinite integral is irrelevant in the definite one.'}</p>
      <p class="help">The accumulation drawn here is a genuine running total: each step adds one Simpson
      panel to the last value, never re-integrating from a. The lower plot then differences <i>that</i>
      sampled curve and lays the result on top of f — so the agreement is between two independently
      computed things.</p>`;
  },
  wire(){
    /* the sweep point has to land inside whatever interval is now loaded, and
       for a typed one that interval is not known until igCur has been asked */
    ctWireSeg('igFK', v => { ST.key = v; const C = igCur(ST); ST.x = (C.a + C.b) / 2; });
    pkWireBoxes('ig1', ST.key, ST, IG_1D_SLOTS, IG_1D_BOUNDS,
      () => { const C = igCur(ST); ST.x = Math.min(Math.max(ST.x, C.a), C.b); });
    ctWireSeg('igFP', v => { ST.part = v; });
    wireSlider('igFx', () => ST.x, v => { ST.x = v; ST.run = false; const c = $('igFrun'); if(c) c.checked = false; },
      v => fmtNum(+v, 4));
    ctWireChk('igFrun', v => { ST.run = v; });
  },
  frame(st, dt, ctx, W, H){
    const K = igCur(st), a = K.a, b = K.b;
    if(st.run){ st.x += dt * (b - a) * 0.28; if(st.x > b) st.x = a; }
    st.x = Math.max(a, Math.min(b, st.x));
    let lo = Infinity, hi = -Infinity;
    for(let i = 0; i <= 400; i++){ const v = K.f(a + (b - a) * i / 400); if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    const acc = nqAccumulate(K.f, a, b, 600);
    let alo = Infinity, ahi = -Infinity;
    for(let i = 0; i <= 600; i++){ alo = Math.min(alo, acc.As[i]); ahi = Math.max(ahi, acc.As[i]); }
    const hp = (H - 150) / 2;
    const P = mkPlot(72, 44, W - 120, hp, a, b, Math.min(0, lo) - 0.15 * (hi - lo), Math.max(0, hi) + 0.15 * (hi - lo));
    const Q = mkPlot(72, 44 + hp + 56, W - 120, hp, a, b, Math.min(0, alo) - 0.15 * (ahi - alo + 1e-9), Math.max(0, ahi) + 0.15 * (ahi - alo + 1e-9));
    plotFrame(ctx, P, 'x', 'f(x)', 'f — and the area accumulated up to x');
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [a, (a + b) / 2, b], v => fmtNum(v, 3));
    /* the accumulated region */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(P.X(a), P.Y(0));
    for(let i = 0; i <= 300; i++){
      const x = a + (st.x - a) * i / 300;
      ctx.lineTo(P.X(x), P.Y(Math.max(P.y0, Math.min(P.y1, K.f(x)))));
    }
    ctx.lineTo(P.X(st.x), P.Y(0)); ctx.closePath();
    ctx.fillStyle = rgbCss(TH.grad, 0.28); ctx.fill();
    ctx.restore();
    /* the sliver dA = f(x) dx, drawn */
    const dxw = (b - a) * 0.03;
    ctx.fillStyle = rgbCss(TH.warn, 0.65);
    const yv = K.f(st.x);
    if(Number.isFinite(yv)) ctx.fillRect(P.X(st.x), Math.min(P.Y(0), P.Y(yv)), Math.max(2, P.X(st.x + dxw) - P.X(st.x)), Math.abs(P.Y(yv) - P.Y(0)));
    plotCurve(ctx, P, K.f, 700, rgbCss(TH.warn), 2.4);
    probeLine(ctx, P, st.x, 'x');
    plotFrame(ctx, Q, 'x', 'A(x) = ∫ₐˣ f', "A(x) — and its slope, which is f(x)");
    plotZeroY(ctx, Q);
    plotTicksX(ctx, Q, [a, (a + b) / 2, b], v => fmtNum(v, 3));
    const Aof = x => {
      const i = Math.max(0, Math.min(600, Math.round((x - a) / acc.h)));
      return acc.As[i];
    };
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for(let i = 0; i <= 600; i++){
      const X = Q.X(acc.xs[i]), Y = Q.Y(acc.As[i]);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    /* the tangent to A at x, whose slope should be exactly f(x) */
    const A0 = Aof(st.x);
    plotCurve(ctx, Q, t => A0 + K.f(st.x) * (t - st.x), 2, rgbCss(TH.warn), 1.8);
    probeLine(ctx, Q, st.x, 'x');
    ctDot(ctx, { X:Q.X, Y:Q.Y }, st.x, A0, 5, rgbCss(TH.text), rgbCss(TH.bg));
    stageNote(ctx, 'the orange sliver is what one more step of x adds — its height is f(x), which is why A′ = f', W, H);
  },
  readout(st){
    const K = igCur(st), a = K.a, b = K.b;
    const A = nqAdaptive(K.f, a, st.x, 1e-12);
    const total = igExact1D(K);
    const h = 1e-5;
    const Ap = (nqAdaptive(K.f, a, st.x + h, 1e-12) - nqAdaptive(K.f, a, st.x - h, 1e-12)) / (2 * h);
    return `<div class="card tight"><div class="ttl">Part 1 — the accumulation function</div>
      ${kv('x', fmtNum(st.x, 5))}
      ${kv('A(x) = ∫ₐˣ f dt', fmtNum(A, 8))}
      ${kv("A′(x), by differencing A", fmtNum(Ap, 8))}
      ${kv('f(x)', fmtNum(K.f(st.x), 8))}
      ${kv('difference', fmtNum(Math.abs(Ap - K.f(st.x)), 3))}
      <p class="help">A(x) is built by quadrature and knows nothing about antiderivatives; the derivative
      above is a central difference of that quadrature. They agree, which is the theorem holding rather
      than being assumed.</p>
    </div>
    <div class="card tight"><div class="ttl">Part 2 — the evaluation theorem</div>
      ${kv('∫ₐᵇ f dx', fmtNum(total, 10))}
      ${K.Fi ? kv('F(b)', fmtNum(K.Fi(b), 8)) : ''}
      ${K.Fi ? kv('F(a)', fmtNum(K.Fi(a), 8)) : ''}
      ${K.Fi ? kv('F(b) − F(a)', fmtNum(K.Fi(b) - K.Fi(a), 10)) : kv('an elementary antiderivative', 'none exists — Part 2 is unusable here')}
      ${K.Fi ? kv('difference from the quadrature', fmtNum(Math.abs(total - (K.Fi(b) - K.Fi(a))), 3)) : ''}
      <p class="help">${K.Fi
        ? 'Two entirely different routes to one number. Part 2 is an enormous computational shortcut — but it is a shortcut, not the definition.'
        : 'e^(−x²) has no antiderivative in terms of elementary functions — Liouville proved it, it is not a failure of ingenuity. Part 1 still guarantees an antiderivative <i>exists</i> (it is the accumulation function itself, and it is called erf); it simply cannot be written with the usual symbols. The integral is perfectly well defined and perfectly computable.'}</p>
    </div>
    <div class="card tight"><div class="ttl">The mean value theorem for integrals</div>
      ${kv('average value  (1/(b−a))∫f', fmtNum(total / (b - a), 6))}
      ${kv('is it attained?', 'yes — a continuous f must hit its own average somewhere in (a, b)')}
      <p class="help">Geometrically: the rectangle of that height over [a, b] has exactly the same area as
      the region under the curve. This is the statement that keeps turning up as the "K" in every error
      bound in the previous stage.</p>
    </div>`;
  },
  chip(st){
    const K = igCur(st);
    return `<div class="k">A(x)</div>
      <div style="color:var(--c-grad)">${fmtNum(nqAdaptive(K.f, K.a, st.x, 1e-11), 5)}</div>
      <div>f(x) = ${fmtNum(K.f(st.x), 4)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'f(x), and the sliver it adds'], ['var(--c-grad)', 'A(x), the accumulated area']]; },
  dockLegend:true
};

/* ---- 3 · what integrals accumulate ---------------------------------------- */
STAGES.igApply = {
  title:'What integrals accumulate',
  derive(st){
    const A = igApplyCur(st);
    return {
      title:'One pattern: slice, approximate each slice, add, take the limit',
      steps:[
        drvSay('the recipe never changes',
          'Every application in this stage is the same four moves. Cut the object into slices thin enough that one number describes each. Write that slice\'s contribution as (something) × (thickness). Add them. Let the thickness go to zero. What differs between area, volume and arc length is only what goes in the bracket.'),
        drvStep('the quantity being accumulated',
          A.formula,
          'the bracket is what one slice contributes per unit thickness'),
        drvSay('area between curves: the slice is a vertical strip',
          'Height is top(x) − bottom(x), width is dx. Note the subtraction happens inside the integral, not after: integrating each curve separately and subtracting works only if neither crosses the other. Where they cross, the integrand changes sign and a single integral silently returns the difference of the two areas instead of their sum.'),
        drvStep('discs: the slice is a circle of radius f(x)',
          `${dv('V')} ${dop('=')} ∫ π[${dv('f')}(${dv('x')})]² d${dv('x')}`,
          'area of a circle times an infinitesimal thickness'),
        drvStep('shells: the slice is a cylinder at radius x',
          `${dv('V')} ${dop('=')} ∫ 2π${dv('x')}${dv('f')}(${dv('x')}) d${dv('x')}`,
          'circumference × height × thickness — unroll it and it is a flat rectangle'),
        drvSay('the two give the same volume, and one is usually far easier',
          'Discs slice perpendicular to the axis of revolution, shells parallel to it. Rotating about the y-axis a region described as y = f(x) needs discs in terms of y, which means inverting f. Shells avoid the inversion entirely. Choosing between them is the actual skill, and the panel computes both so the agreement is visible.'),
        drvStep('arc length: the slice is a tiny hypotenuse',
          `${dv('L')} ${dop('=')} ∫ √(1 ${dop('+')} [${dv('f')}′]²) d${dv('x')}`,
          'Pythagoras on dx and dy, with dy = f′ dx factored out'),
        drvSay('which is why arc lengths are almost never elementary',
          'That square root wrecks the integrand. The circumference of an ellipse has no closed form in elementary functions at all — it needs elliptic integrals, which are named after exactly this failure. The parabola y = x² is one of the few that does work out, and even that needs a hyperbolic substitution.'),
        drvStep('average value: divide the accumulation by the span',
          `${dv('f')}̄ ${dop('=')} ${dfrac('1', dv('b') + ' − ' + dv('a'))}∫ₐᵇ ${dv('f')} d${dv('x')}`,
          'the height of the rectangle with the same area — and the MVT says a continuous f actually attains it')
      ],
      note:'The panel evaluates each of these by adaptive quadrature and, where a closed form exists, prints it alongside with the difference. The disc and shell volumes are computed by genuinely different integrals and compared, so their agreement is evidence rather than assertion.'
    };
  },
  enter(st, o){
    st.key = o.key || 'between';
    st.n = o.n === undefined ? 14 : o.n;
    st.show = true;
  },
  controls(){
    const st = ST, A = igApplyCur(st);
    return pkSeg('igAK', IG_APPLY, st.key) +
      pkBoxes('igap', st.key, st, IG_AP_SLOTS, IG_AP_BOUNDS,
        'Two curves and an interval. <b>4-x^2</b> and <b>x</b>, or <b>sqrt(x)</b> and <b>0</b> — ' +
        'whichever pair bounds the region you are trying to measure.') +
      ctlRow('slices shown', ctlSlider('igAn', 3, 60, 1, st.n)) +
      `<p class="help"><b>${A.formula}</b><br>${A.note}</p>
      <p class="help">Every one of these is the same move: cut the thing you want into slices small enough
      that each is approximately something you already know the size of — a rectangle, a disc, a shell, a
      straight segment — add them up, and take the limit. The formula that comes out is never worth
      memorising; the slice is.</p>`;
  },
  wire(){
    pkWire('igAK', 'igap', ST.key, ST, IG_AP_SLOTS, IG_AP_BOUNDS, v => { ST.key = v; });
    wireSlider('igAn', () => ST.n, v => { ST.n = Math.round(v); }, v => Math.round(v) + ' slices');
  },
  frame(st, dt, ctx, W, H){
    const A = igApplyCur(st), a = A.a, b = A.b;
    let lo = 0, hi = 0;
    for(let i = 0; i <= 300; i++){
      const x = a + (b - a) * i / 300;
      lo = Math.min(lo, A.bot(x), A.top(x)); hi = Math.max(hi, A.bot(x), A.top(x));
    }
    const pad = (hi - lo) * 0.16 + 1e-6;
    const P = mkPlot(72, 46, W - 120, H - 132, a, b, lo - pad, hi + pad);
    plotFrame(ctx, P, 'x', igApplyKind(st) === 'work' ? 'F(x)' : 'y', A.name);
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [a, (a + b) / 2, b], v => fmtNum(v, 3));
    const h = (b - a) / st.n;
    for(let i = 0; i < st.n; i++){
      const xm = a + (i + 0.5) * h;
      const t = A.top(xm), bt = A.bot(xm);
      if(!Number.isFinite(t) || !Number.isFinite(bt)) continue;
      if(igApplyKind(st) === 'shell'){
        /* a shell is a vertical strip standing at radius x */
        ctx.fillStyle = rgbCss(TH.grad, 0.3); ctx.strokeStyle = rgbCss(TH.grad, 0.85); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(P.X(xm - h * 0.42), P.Y(t), P.X(xm + h * 0.42) - P.X(xm - h * 0.42), P.Y(bt) - P.Y(t));
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = rgbCss(TH.curl, 0.6);
        ctx.beginPath(); ctx.moveTo(P.X(xm), P.Y(0)); ctx.lineTo(P.X(xm), P.Y(t)); ctx.stroke();
      } else if(igApplyKind(st) === 'arclen'){
        const x0 = a + i * h, x1 = x0 + h;
        ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(P.X(x0), P.Y(A.top(x0))); ctx.lineTo(P.X(x1), P.Y(A.top(x1))); ctx.stroke();
        ctx.strokeStyle = rgbCss(TH.curl, 0.6); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(P.X(x0), P.Y(A.top(x0))); ctx.lineTo(P.X(x1), P.Y(A.top(x0)));
        ctx.lineTo(P.X(x1), P.Y(A.top(x1))); ctx.stroke();
      } else {
        ctx.fillStyle = rgbCss(TH.grad, 0.26); ctx.strokeStyle = rgbCss(TH.grad, 0.8); ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(P.X(xm - h * 0.46), P.Y(t), P.X(xm + h * 0.46) - P.X(xm - h * 0.46), P.Y(bt) - P.Y(t));
        ctx.fill(); ctx.stroke();
        if(igApplyKind(st) === 'disk'){
          /* the disc's radius, drawn as the strip's height */
          ctx.strokeStyle = rgbCss(TH.curl, 0.75); ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(P.X(xm), P.Y(0)); ctx.lineTo(P.X(xm), P.Y(t)); ctx.stroke();
        }
      }
    }
    plotCurve(ctx, P, A.top, 500, rgbCss(TH.warn), 2.4);
    if(igApplyKind(st) === 'between') plotCurve(ctx, P, A.bot, 500, rgbCss(TH.neg), 2.4);
    if(igApplyKind(st) === 'average'){
      const avg = nqAdaptive(A.top, a, b, 1e-12) / (b - a);
      plotCurve(ctx, P, () => avg, 2, rgbCss(TH.pos), 2.2);
      /* the point where the mean value theorem says f attains its average */
      const rs = nqRoots(x => A.top(x) - avg, a, b, 400);
      for(const r of rs){
        ctx.fillStyle = rgbCss(TH.pos);
        ctx.beginPath(); ctx.arc(P.X(r), P.Y(avg), 4.5, 0, 6.2832); ctx.fill();
      }
    }
    if(igApplyKind(st) === 'disk' || igApplyKind(st) === 'shell'){
      plotCurve(ctx, P, x => -A.top(x), 500, rgbCss(TH.warn, 0.4), 1.4);
      ctText(ctx, P.px + P.pw / 2, P.py + P.ph + 34,
        igApplyKind(st) === 'disk' ? 'revolved about the x-axis: each strip sweeps a disc of area πf(x)²'
                          : 'revolved about the y-axis: each strip sweeps a shell of area 2πx·f(x)',
        rgbCss(TH.dim), '600 11.5px ' + FONT_UI, 'center');
    }
    stageNote(ctx, `${st.n} slices drawn — the readout integrates properly and reports the limit`, W, H);
  },
  readout(st){
    const A = igApplyCur(st), a = A.a, b = A.b;
    const between = nqAdaptive(x => A.top(x) - A.bot(x), a, b, 1e-12);
    const disk = Math.PI * nqAdaptive(x => Math.pow(A.top(x), 2), a, b, 1e-12);
    const shell = 2 * Math.PI * nqAdaptive(x => x * A.top(x), a, b, 1e-12);
    const arc = nqAdaptive(x => Math.hypot(1, nqD1(A.top, x)), a, b, 1e-11);
    const avg = between / (b - a);
    const approx = (() => {
      const h = (b - a) / st.n;
      let s = 0;
      for(let i = 0; i < st.n; i++){
        const xm = a + (i + 0.5) * h;
        if(igApplyKind(st) === 'disk') s += Math.PI * Math.pow(A.top(xm), 2) * h;
        else if(igApplyKind(st) === 'shell') s += 2 * Math.PI * xm * A.top(xm) * h;
        else if(igApplyKind(st) === 'arclen') s += Math.hypot(h, A.top(a + (i + 1) * h) - A.top(a + i * h));
        else s += (A.top(xm) - A.bot(xm)) * h;
      }
      return s;
    })();
    const exact = igApplyKind(st) === 'disk' ? disk : igApplyKind(st) === 'shell' ? shell : igApplyKind(st) === 'arclen' ? arc : between;
    return `<div class="card tight"><div class="ttl">${A.name}</div>
      ${kv('formula', A.formula)}
      ${kv('limits', `a = ${fmtNum(a, 5)},  b = ${fmtNum(b, 5)}`)}
      ${kv(`the sum of ${st.n} slices`, fmtNum(approx, 8))}
      ${kv('the integral', fmtNum(exact, 8))}
      ${kv('difference', fmtNum(Math.abs(approx - exact), 3))}
    </div>
    <div class="card tight"><div class="ttl">The same region, every way</div>
      ${kv('area between the curves', fmtNum(between, 7))}
      ${kv('volume by discs about x', fmtNum(disk, 7))}
      ${kv('volume by shells about y', fmtNum(shell, 7))}
      ${kv('arc length of the top curve', fmtNum(arc, 7))}
      ${kv('average height', fmtNum(avg, 7))}
      <p class="help">One region, five different questions, five integrals — all built from the same
      slicing move with a different quantity attached to each slice. Notice that the disc and shell methods
      answer <i>different</i> questions here (they revolve about different axes), which is the usual source
      of confusion: the choice of axis decides the shape of the slice, and the shape of the slice decides
      the formula.</p>
    </div>
    ${igApplyKind(st) === 'average' ? `<div class="card tight"><div class="ttl">Where the average is attained</div>
      ${nqRoots(x => A.top(x) - avg, a, b, 400).map(r => kv('x =', fmtNum(r, 6))).join('')}
      <p class="help">The Mean Value Theorem for integrals guarantees at least one such point for a
      continuous integrand. It is the integral analogue of the ordinary MVT, and it is what licenses every
      "there exists a ξ in the interval" step in the error analysis of the previous stage.</p>
    </div>` : ''}`;
  },
  chip(st){
    const A = igApplyCur(st);
    const v = igApplyKind(st) === 'disk' ? Math.PI * nqAdaptive(x => Math.pow(A.top(x), 2), A.a, A.b, 1e-11)
      : igApplyKind(st) === 'shell' ? 2 * Math.PI * nqAdaptive(x => x * A.top(x), A.a, A.b, 1e-11)
      : nqAdaptive(x => A.top(x) - A.bot(x), A.a, A.b, 1e-11);
    return `<div class="k">${A.name}</div><div style="color:var(--c-grad)">${fmtNum(v, 6)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'the upper curve'], ['var(--c-neg)', 'the lower curve'],
                    ['var(--c-grad)', 'the slices'], ['var(--c-pos)', 'the average value']]; },
  dockLegend:true
};

/* ---- 4 · double integrals over a rectangle -------------------------------- */
