/* ---- the reader's own integrand and density ---------------------------------
   Three stages share IG_INTEGRANDS and one shares IG_DENSITIES, all through a
   single table lookup, so one accessor each opens every one of them to a typed
   formula. The rectangle's own limits need nothing added: a, b, c and d are
   sliders, and every slider in the laboratory already takes a typed value, so
   the reader's rectangle is whatever they say it is. */
/* The typed integrand goes through `igCoordFn`, not `pkFn`, so that it may be
   written in Cartesian, polar, cylindrical or spherical coordinates — or in a
   mixture of them. `coords` carries which, so the readout can echo it back
   rather than leaving the reader to wonder whether their `phi` was understood. */
const IG_FN_OWN = [{ k:'f', label:'f =', vars:'x, y — or r, theta, rho, phi', def:'x*y + sin(x)' }];
function igFnCur(st){
  if(st.fn !== 'custom') return IG_INTEGRANDS[st.fn];
  const own = pkOwn(st, 'igfn', IG_FN_OWN, null);
  return { name:'f = ' + own.f, f:igCoordFn(own.f), tex:esc(own.f),
           coords:igCoordUsed(own.f), src:own.f };
}
const IG_DEN_OWN = [{ k:'r', label:'ρ =', vars:'x, y — or r, theta, rho, phi', def:'1 + x^2 + y^2' }];
function igDenCur(st){
  if(st.den !== 'custom') return IG_DENSITIES[st.den];
  const own = pkOwn(st, 'igden', IG_DEN_OWN, null);
  return { name:'ρ = ' + own.r, f:igCoordFn(own.r), tex:esc(own.r),
           coords:igCoordUsed(own.r), src:own.r };
}

STAGES.igDoubleRect = {
  title:'Double integrals over a rectangle',
  derive(st){
    const n = v => fmtNum(v, 8);
    const dA = ((st.b - st.a) / st.m) * ((st.d - st.c) / st.m);
    return {
      title:'Why a double integral collapses into two ordinary ones',
      steps:[
        drvSay('the definition is the same idea, one dimension up',
          'Chop the rectangle into a grid of small rectangles, pick a point in each, multiply the height there by the cell area, and add. The limit as the cells shrink is the double integral. Nothing conceptually new has happened — the sum just has two indices instead of one.'),
        drvStep('the grid, and one cell\'s contribution',
          `Δ${dv('A')} ${dop('=')} Δ${dv('x')} Δ${dv('y')}`,
          `${st.m} × ${st.m} = ${st.m * st.m} cells, each of area ${n(dA)}`),
        drvStep('the double Riemann sum',
          `${dv('S')} ${dop('=')} Σᵢ Σⱼ ${dv('f')}(${dv('x')}ᵢ*, ${dv('y')}ⱼ*) Δ${dv('A')}`,
          'the panel computes this, then doubles the grid and computes it again'),
        drvSay('now the observation that makes it computable',
          'A double sum can be done in either order — that is just rearranging a finite sum, which is always allowed. Group the terms by column and you are adding up column totals; group by row and you are adding row totals. Same number, two routes.'),
        drvStep('so sum along y first, holding x fixed',
          `${dv('S')} ${dop('=')} Σᵢ [ Σⱼ ${dv('f')}(${dv('x')}ᵢ, ${dv('y')}ⱼ) Δ${dv('y')} ] Δ${dv('x')}`,
          'the inner bracket is a one-dimensional Riemann sum at fixed x'),
        drvStep('and in the limit each sum becomes an integral',
          `∬ ${dv('f')} d${dv('A')} ${dop('=')} ∫ₐᵇ [ ∫_c^d ${dv('f')} d${dv('y')} ] d${dv('x')}`,
          'the inner integral treats x as a constant — this is partial integration, the inverse of a partial derivative'),
        drvStep('or the other order, which must agree',
          `${dop('=')} ∫_c^d [ ∫ₐᵇ ${dv('f')} d${dv('x')} ] d${dv('y')}`,
          'the panel evaluates both orders independently and prints the difference'),
        drvSay('Fubini\'s theorem is what licenses the swap',
          'For a continuous function on a rectangle the two orders always agree. The theorem is not vacuous: for functions that are unbounded, or on regions that are not nice, the two orders can genuinely give different answers. Continuity on a closed bounded rectangle is the hypothesis that rules that out, and it is why this stage uses a rectangle before the next one tries general regions.'),
        drvStep('and the average is the integral over the area',
          `${dv('f')}̄ ${dop('=')} ${dfrac('1', dv('A'))}∬ ${dv('f')} d${dv('A')}`,
          `rectangle area ${n((st.b - st.a) * (st.d - st.c))}`)
      ],
      note:'Doubling the grid should divide the error by four for a midpoint rule, because the two-dimensional midpoint rule is second order just as the one-dimensional one is. The panel prints the error at m and at 2m so that ratio can be read off rather than taken on trust.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.fn = o.fn || 'dome';
    st.m = o.m === undefined ? 6 : o.m;
    st.corner = o.corner || 'mid';
    st.a = 0; st.b = 2; st.c = 0; st.d = 1.6;
    R.cam.az = 0.68; R.cam.el = 0.32; ctCamFit(2.8);
  },
  controls(){
    const st = ST;
    return pkSeg('igDF', IG_INTEGRANDS, st.fn, e => e.name.replace('f = ', '')) + pkBoxes('igfn', st.fn, st, IG_FN_OWN, null, IG_COORD_HELP) +
      ctSeg('igDC', st.corner, [['lower', 'lower corners'], ['mid', 'midpoints'], ['upper', 'upper corners']]) +
      ctlRow('grid m × m', ctlSlider('igDm', 1, 40, 1, st.m)) +
      ctlRow('b', ctlSlider('igDb', 0.4, 3, 0.05, st.b)) +
      ctlRow('d', ctlSlider('igDd', 0.4, 3, 0.05, st.d)) +
      `<p class="help">The double Riemann sum is exactly the one-dimensional idea with one more index:
      cut the rectangle into m × m cells, take the height of f at one sample point in each, and add up
      <b>f(x*, y*)·ΔA</b>. The columns drawn are those boxes, and the number in the panel is their total
      volume — computed by summing them, not by any formula.</p>
      <p class="help"><b>Fubini's theorem</b> says the iterated integrals in the two orders agree with each
      other and with the double integral. The readout computes both orders independently and prints the
      difference. Over a rectangle with a continuous integrand this is not a delicate result — but it fails
      spectacularly for integrands that are not absolutely integrable, which is why the hypothesis is
      always stated.</p>`;
  },
  wire(){
    ctWireSeg('igDF', v => { ST.fn = v; });
    pkWireBoxes('igfn', ST.fn, ST, IG_FN_OWN, null);
    ctWireSeg('igDC', v => { ST.corner = v; });
    wireSlider('igDm', () => ST.m, v => { ST.m = Math.round(v); }, v => Math.round(v) + '²  = ' + (Math.round(v) * Math.round(v)) + ' cells');
    wireSlider('igDb', () => ST.b, v => { ST.b = v; }, v => fmtNum(+v, 3));
    wireSlider('igDd', () => ST.d, v => { ST.d = v; }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    const F = igFnCur(st).f;
    const f = (x, y) => { const v = F(x, y); return Number.isFinite(v) ? v : 0; };
    const { a, b, c, d } = st;
    let zlo = Infinity, zhi = -Infinity;
    for(let i = 0; i <= 30; i++) for(let j = 0; j <= 30; j++){
      const v = f(a + (b - a) * i / 30, c + (d - c) * j / 30);
      zlo = Math.min(zlo, v); zhi = Math.max(zhi, v);
    }
    const sc = 2.2 / Math.max(1e-6, Math.max(Math.abs(zhi), Math.abs(zlo)));
    const cx = (a + b) / 2, cy = (c + d) / 2;
    R.mode2d = false; R.extent = 2.8; R.begin();
    em3dAxes(2);
    /* the base rectangle */
    R.poly([v3(a - cx, c - cy, 0), v3(b - cx, c - cy, 0), v3(b - cx, d - cy, 0), v3(a - cx, d - cy, 0)],
           rgbCss(TH.line2, 0.25), rgbCss(TH.faint, 0.8), 1.4, 0.8);
    /* the columns of the Riemann sum */
    const m = st.m, dx = (b - a) / m, dy = (d - c) / m;
    const ox = st.corner === 'lower' ? 0 : st.corner === 'upper' ? 1 : 0.5;
    for(let i = 0; i < m; i++) for(let j = 0; j < m; j++){
      const xl = a + i * dx, xr = xl + dx, yl = c + j * dy, yr = yl + dy;
      const h = f(a + (i + ox) * dx, c + (j + ox) * dy) * sc;
      const t = Math.max(0, Math.min(1, (h / sc - zlo) / ((zhi - zlo) || 1)));
      const col = rgbCss(rampSeq(t));
      const X0 = xl - cx, X1 = xr - cx, Y0 = yl - cy, Y1 = yr - cy;
      R.poly([v3(X0, Y0, h), v3(X1, Y0, h), v3(X1, Y1, h), v3(X0, Y1, h)], col, rgbCss(TH.bg, 0.5), 0.5, 0.95);
      /* two side walls give the column its solidity without drawing all four */
      R.poly([v3(X0, Y0, 0), v3(X1, Y0, 0), v3(X1, Y0, h), v3(X0, Y0, h)], col, null, 0, 0.55);
      R.poly([v3(X0, Y0, 0), v3(X0, Y1, 0), v3(X0, Y1, h), v3(X0, Y0, h)], col, null, 0, 0.4);
    }
    /* the surface itself, faint, over the top */
    for(let i = 0; i <= 24; i++){
      const rib = [];
      for(let j = 0; j <= 40; j++){
        const x = a + (b - a) * i / 24, y = c + (d - c) * j / 40;
        rib.push(v3(x - cx, y - cy, f(x, y) * sc));
      }
      R.path(rib, rgbCss(TH.text, 0.35), 0.9, 0.6);
    }
    R.flush();
    em3dCaption(ctx, W, H,
      `∬ ${igFnCur(st).name.replace('f = ', '')} dA over [${fmtNum(a, 2)}, ${fmtNum(b, 2)}] × [${fmtNum(c, 2)}, ${fmtNum(d, 2)}]`,
      `${m}² = ${m * m} columns · the panel adds them up`);
  },
  readout(st){
    const F = igFnCur(st).f;
    const f = (x, y) => { const v = F(x, y); return Number.isFinite(v) ? v : 0; };
    const { a, b, c, d } = st;
    const S = nqDoubleRiemann(f, a, b, c, d, st.m, st.m, st.corner);
    const S2 = nqDoubleRiemann(f, a, b, c, d, st.m * 2, st.m * 2, st.corner);
    const exact = nqDoubleRect(f, a, b, c, d, 5, 18);
    /* the two iterated orders, each computed on its own */
    const dydx = nqGauss(x => nqGauss(y => f(x, y), c, d, 5, 12), a, b, 5, 12);
    const dxdy = nqGauss(y => nqGauss(x => f(x, y), a, b, 5, 12), c, d, 5, 12);
    const area = (b - a) * (d - c);
    return `<div class="card tight"><div class="ttl">The Riemann sum, actually summed</div>
      ${kv('cells', `${st.m} × ${st.m} = ${st.m * st.m}`)}
      ${kv('ΔA', fmtNum((b - a) * (d - c) / (st.m * st.m), 6))}
      ${kv('sample point in each cell', NQ_RULE_NAMES[st.corner === 'mid' ? 'mid' : st.corner === 'lower' ? 'left' : 'right'].replace('endpoints', 'corner'))}
      ${kv('Σ f(x*, y*) ΔA', fmtNum(S, 8))}
      ${kv('with the grid doubled', fmtNum(S2, 8))}
      ${kv('the integral', fmtNum(exact, 8))}
      ${kv('error at m', fmtNum(Math.abs(S - exact), 3))}
      ${kv('error at 2m', fmtNum(Math.abs(S2 - exact), 3))}
    </div>
    <div class="card tight"><div class="ttl">Fubini — both orders</div>
      ${kv('∫ₐᵇ [ ∫_c^d f dy ] dx', fmtNum(dydx, 10))}
      ${kv('∫_c^d [ ∫ₐᵇ f dx ] dy', fmtNum(dxdy, 10))}
      ${kv('difference', fmtNum(Math.abs(dydx - dxdy), 3))}
      <p class="help">Each is a genuine nested quadrature: the inner integral is evaluated afresh at every
      node of the outer one. They agree to quadrature precision. For a <b>separable</b> integrand
      f = g(x)h(y) the double integral factors into a product of two single integrals, which is worth
      spotting — sin x · cos y is the example in the list.</p>
    </div>
    <div class="card tight"><div class="ttl">Average value over the rectangle</div>
      ${kv('area of the rectangle', fmtNum(area, 6))}
      ${kv('∬ f dA', fmtNum(exact, 8))}
      ${kv('average f̄ = (1/A)∬ f dA', fmtNum(exact / area, 8))}
      <p class="help">The double integral is a signed volume: where f is negative the columns hang below
      the base and subtract. Set f = 1 and the integral returns the area of the region itself, which is the
      trick that turns every area problem into an integral problem — and the one that makes general regions
      in the next stage tractable.</p>
    </div>`;
  },
  chip(st){
    const F = igFnCur(st).f;
    const S = nqDoubleRiemann((x, y) => { const v = F(x, y); return Number.isFinite(v) ? v : 0; },
                              st.a, st.b, st.c, st.d, st.m, st.m, st.corner);
    return `<div class="k">Riemann sum</div><div style="color:var(--c-grad)">${fmtNum(S, 6)}</div>
      <div>${st.m}² cells</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the columns f(x*,y*)ΔA'], ['var(--text)', 'the surface z = f(x,y)']]; }
};

/* ---- 5 · double integrals over general regions ----------------------------- */
STAGES.igRegion = {
  title:'General regions',
  derive(st){
    const R = igRegCur(st);
    return {
      title:'When the region is not a rectangle, the limits carry the geometry',
      steps:[
        drvSay('what changes and what does not',
          'The integrand is unchanged. The idea of slicing is unchanged. The only new difficulty is that the inner limits now depend on the outer variable — the slice through a curved region has a different length depending on where you cut it.'),
        drvStep('slice vertically: for each x, y runs between two curves',
          `∬_R ${dv('f')} d${dv('A')} ${dop('=')} ∫ₐᵇ ∫_(${dv('g')}₁(${dv('x')}))^(${dv('g')}₂(${dv('x')})) ${dv('f')} d${dv('y')} d${dv('x')}`,
          'a Type I description — outer limits are constants, inner limits are functions of x'),
        drvSay('the rule that prevents almost every mistake here',
          'The outer limits must be numbers. If a variable survives to the outermost integral, the answer would still depend on it — and a definite integral over a region is a number. That single check catches most wrongly-set-up double integrals before any work is done.'),
        drvStep('or slice horizontally, which describes the same region differently',
          `${dop('=')} ∫_c^d ∫_(${dv('h')}₁(${dv('y')}))^(${dv('h')}₂(${dv('y')})) ${dv('f')} d${dv('x')} d${dv('y')}`,
          R && R.name ? 'for ' + esc(R.name) : 'a Type II description'),
        drvSay('and one order can be possible while the other is not',
          'A region shaped so that a horizontal line enters and leaves it more than once has no single Type II description — it must be cut into pieces first. The panel reports whether each description is available for the current region, because "just swap the order" is advice that sometimes cannot be followed.'),
        drvSay('swapping the order is a real technique, not bookkeeping',
          'Some integrands are impossible in one order and elementary in the other. The classic is ∫∫ sin(y)/y dy dx over a triangle: integrating in y first is hopeless, because sin(y)/y has no elementary antiderivative. Reverse the order and the x-integration is trivial, leaving something that cancels the offending denominator exactly.'),
        drvStep('polar coordinates rewrite the region instead of the integrand',
          `∬ ${dv('f')} d${dv('A')} ${dop('=')} ∬ ${dv('f')}(${dv('r')}cos θ, ${dv('r')}sin θ) ${dv('r')} d${dv('r')} dθ`,
          'the extra r is not optional — the next stage derives where it comes from'),
        drvStep('and the answer is checked against random sampling',
          `${dv('I')} ${dop('≈')} ${dv('A')}_box ${dop('×')} (fraction of darts inside) ${dop('×')} ${dv('f')}̄`,
          'Monte Carlo with 40 000 darts, an entirely different method — the panel prints the difference')
      ],
      note:'Monte Carlo converges only as 1/√N, so it will never match the iterated integral to many digits. That is the point of including it: it is wrong in a completely different way, so agreement to three figures is real evidence that the limits were set up correctly.'
    };
  },
  enter(st, o){
    st.reg = o.reg || 'parab';
    st.regKind = o.regKind || 'I';
    st.fn = o.fn || 'one';
    st.order = o.order || 'dydx';
    st.n = o.n === undefined ? 14 : o.n;
    st.sweep = o.sweep !== false;
    st.s = 0;
    /* a demo may name an order the region cannot supply; reconcile before the
       first frame rather than printing NaN once */
    igRegFixOrder(st);
  },
  controls(){
    const st = ST, Rg = igRegCur(st);
    const kind = igRegKind(st);
    return pkSeg('igGR', IG_REGIONS, st.reg, e => e.name.split('  ')[0]) +
      (st.reg === 'custom'
        ? ctSeg('igGK', kind, [['I', 'Type I'], ['II', 'Type II'],
                               ['both', 'both, and check Fubini'], ['polar', 'polar']])
        : '') +
      pkBoxes('igreg', st.reg, st, igRegSlots(st), igRegBounds(st),
        kind === 'polar'
          ? 'Your region in polar form: θ from one bound to the other, and r between two functions of θ. ' +
            'Write the angle as <b>t</b>. Try <b>1 + cos(t)</b> for a cardioid, <b>cos(2t)</b> over θ ∈ [−π/4, π/4] ' +
            'for one petal of a rose, or an inner radius of <b>0.5</b> for an annulus.'
          : kind === 'I'
          ? 'A <b>Type I</b> region: x between the two numbers, and for each x, y between two functions of x. ' +
            /* the example is meant to be COPIED into the box, so it must survive
               supify(): a caret here renders as x² and no longer parses */
            'Try <b>y</b> from <b>0</b> to <b>sqrt(max(0, 4 - x*x))</b> over x ∈ [−2, 2] for a half-disc. ' +
            'Wrap a square root in <b>max(0, …)</b> so it stays real at the ends.'
          : kind === 'II'
          ? 'A <b>Type II</b> region: y between the two numbers, and for each y, x between two functions of ' +
            '<b>y</b> — write them in y, not x. The same half-disc is x from <b>-sqrt(max(0, 4 - y*y))</b> ' +
            'to <b>sqrt(max(0, 4 - y*y))</b> over y ∈ [0, 2].'
          : 'Both descriptions of the <b>same</b> region — vertical strips and horizontal strips. The panel ' +
            'integrates it each way and prints the difference, then refines the quadrature to establish ' +
            'whether that difference is arithmetic or a genuine mismatch. Fubini\'s theorem, tested rather ' +
            'than quoted: get one of the four limits wrong and the gap does not shrink when you refine.') +
      pkSeg('igGF', IG_INTEGRANDS, st.fn, e => e.name.replace('f = ', '').split('  ')[0]) +
      pkBoxes('igfn', st.fn, st, IG_FN_OWN, null, IG_COORD_HELP) +
      ctSeg('igGO', st.order,
        [].concat(Rg.yLo ? [['dydx', 'Type I — dy then dx']] : [],
                  Rg.xLo ? [['dxdy', 'Type II — dx then dy']] : [],
                  Rg.polar ? [['polar', 'polar — r dr dθ']] : [])) +
      ctlRow('strips shown', ctlSlider('igGn', 3, 60, 1, st.n)) +
      ctChk('igGsw', 'sweep the moving strip', st.sweep) +
      `<p class="help"><b>${Rg.name}</b> — ${Rg.desc}</p>
      <p class="help">${st.order === 'dydx'
        ? 'A <b>Type I</b> region is described by letting x run over an interval and, for each x, letting y run between two functions of x. The inner integral sweeps a <i>vertical</i> strip; the outer one slides that strip across. The inner limits may depend on x; the outer limits must be constants, always.'
        : st.order === 'dxdy'
        ? 'A <b>Type II</b> region reverses the roles: y runs over an interval, and for each y, x runs between two functions of y. The strip is now <i>horizontal</i>. Some regions are only one type, some are both, and some need cutting into pieces — and swapping order is often the difference between an integral you can do and one you cannot.'
        : 'In polar coordinates the strips become <b>wedges</b>: θ runs over an interval, and for each θ, r runs between two functions of θ. The area element is <b>r dr dθ</b>, not dr dθ — a wedge far from the origin is wider than the same wedge near it, in direct proportion to r.'}</p>`;
  },
  wire(){
    /* The order must follow what the region can actually offer. A typed Type I
       region has no Type II description and vice versa, so an order left over
       from a previous choice would ask `igRegionIntegral` for limits that are
       null — which returns NaN and prints it. `igRegFixOrder` is the one place
       that reconciles them, and both the picker and the kind switch call it. */
    pkWire('igGR', 'igreg', ST.reg, ST, igRegSlots(ST), igRegBounds(ST),
      v => { ST.reg = v; }, () => igRegFixOrder(ST));
    ctWireSeg('igGK', v => { ST.regKind = v; igRegFixOrder(ST); buildStagePanel(); });
    ctWireSeg('igGF', v => { ST.fn = v; });
    pkWireBoxes('igfn', ST.fn, ST, IG_FN_OWN, null);
    ctWireSeg('igGO', v => { ST.order = v; });
    wireSlider('igGn', () => ST.n, v => { ST.n = Math.round(v); }, v => Math.round(v) + ' strips');
    ctWireChk('igGsw', v => { ST.sweep = v; });
  },
  frame(st, dt, ctx, W, H){
    const Rg = igRegCur(st);
    const F = igFnCur(st).f;
    if(st.sweep) st.s = (st.s + dt * 0.25) % 1;
    /* Frame the region on ITS OWN box, not on a disc about the origin. The half
       extent used to be the largest corner coordinate, which suited the presets
       because they all straddle the origin — and drew a typed region living in
       [0,2]×[0,4] inside a window sixteen units wide, a sliver in the middle of
       an empty plane. The origin is still pulled in, because the axes are part
       of what a region picture is for, but only at the cost of a third of a
       span rather than at the cost of the whole view. */
    const cx = (Rg.x0 + Rg.x1) / 2, cy = (Rg.y0 + Rg.y1) / 2;
    const mx = Math.max(Math.abs(Rg.x0 - cx), Math.abs(Rg.x1 - cx),
                        Math.abs(Rg.y0 - cy), Math.abs(Rg.y1 - cy),
                        Math.abs(cx) * 0.35, Math.abs(cy) * 0.35, 1e-3) * 1.16;
    /* A region must be drawn to a true aspect — a squashed one is a different
       region — so the scale is set by whichever of the two dimensions is
       tighter, and on a wide canvas that is always the height. The surplus width
       then becomes empty plane on both sides, and a region that occupies a
       perfectly reasonable 40% of the frame's height looks like a stamp in the
       middle of a letterbox. Reserving the surplus as padding instead keeps the
       drawing area roughly square, so the region fills the frame it is given at
       any window shape without a single coordinate being distorted. */
    const surplus = Math.max(0, (W - 84) - (H - 80) * 1.7);
    const P = ctBox(W, H, cx, cy, mx, { l:58 + surplus / 2, r:26 + surplus / 2 });
    ctGrid(ctx, P);
    ctFrame(ctx, P, Rg.name + '  —  ' + (st.order === 'polar' ? 'wedges  r dr dθ' : st.order === 'dydx' ? 'vertical strips  dy dx' : 'horizontal strips  dx dy'));
    /* shade the region by testing membership on a grid */
    ctx.save(); ctx.globalAlpha = 0.34;
    const cells = 130;
    const cw = P.pw / cells, chh = P.ph / cells;
    for(let i = 0; i < cells; i++) for(let j = 0; j < cells; j++){
      const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / cells;
      const y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / cells;
      if(!igInRegion(Rg, x, y)) continue;
      const v = F(x, y);
      ctx.fillStyle = Number.isFinite(v) ? rgbCss(rampSeq(0.25 + 0.55 * Math.min(1, Math.abs(v) / 4))) : rgbCss(TH.grad);
      ctx.fillRect(P.px + i * cw - 0.5, P.py + P.ph - (j + 1) * chh - 0.5, cw + 1, chh + 1);
    }
    ctx.restore();
    /* the strips or wedges themselves */
    if(st.order === 'polar' && Rg.polar){
      const T = Rg.polar;
      for(let i = 0; i < st.n; i++){
        const t0 = T.t0 + (T.t1 - T.t0) * i / st.n, t1 = T.t0 + (T.t1 - T.t0) * (i + 1) / st.n;
        const pts = [];
        for(let k = 0; k <= 8; k++){ const t = t0 + (t1 - t0) * k / 8; pts.push(pcPolarPt(T.r0(t), t)); }
        for(let k = 8; k >= 0; k--){ const t = t0 + (t1 - t0) * k / 8; pts.push(pcPolarPt(T.r1(t), t)); }
        ctPath(ctx, P, pts.concat([pts[0]]), rgbCss(TH.text, 0.35), 0.9);
      }
      const tc = T.t0 + (T.t1 - T.t0) * st.s;
      const wpts = [];
      const dwt = (T.t1 - T.t0) / st.n;
      for(let k = 0; k <= 10; k++){ const t = tc + dwt * k / 10; wpts.push(pcPolarPt(T.r0(t), t)); }
      for(let k = 10; k >= 0; k--){ const t = tc + dwt * k / 10; wpts.push(pcPolarPt(T.r1(t), t)); }
      ctFill(ctx, P, wpts, rgbCss(TH.warn, 0.55));
      ctPath(ctx, P, wpts.concat([wpts[0]]), rgbCss(TH.warn), 2);
      /* the two boundary curves r₀(θ) and r₁(θ) */
      ctParam(ctx, P, t => pcPolarPt(T.r1(t), t), T.t0, T.t1, 400, rgbCss(TH.curl), 2.4);
      if(T.r0(T.t0) > 1e-9) ctParam(ctx, P, t => pcPolarPt(T.r0(t), t), T.t0, T.t1, 400, rgbCss(TH.pos), 2.4);
    } else if(st.order === 'dydx' && Rg.yLo){
      for(let i = 0; i < st.n; i++){
        const x = Rg.x0 + (Rg.x1 - Rg.x0) * (i + 0.5) / st.n;
        const lo = Rg.yLo(x), hi = Rg.yHi(x);
        if(!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
        ctPath(ctx, P, [{ x, y:lo }, { x, y:hi }], rgbCss(TH.text, 0.4), 1.1);
      }
      const xs = Rg.x0 + (Rg.x1 - Rg.x0) * st.s;
      const w = (Rg.x1 - Rg.x0) / st.n;
      ctFill(ctx, P, [{ x:xs, y:Rg.yLo(xs) }, { x:xs + w, y:Rg.yLo(xs + w) },
                      { x:xs + w, y:Rg.yHi(xs + w) }, { x:xs, y:Rg.yHi(xs) }], rgbCss(TH.warn, 0.6));
      ctParam(ctx, P, x => ({ x, y:Rg.yHi(x) }), Rg.x0, Rg.x1, 300, rgbCss(TH.curl), 2.6);
      ctParam(ctx, P, x => ({ x, y:Rg.yLo(x) }), Rg.x0, Rg.x1, 300, rgbCss(TH.pos), 2.6);
    } else if(Rg.xLo){
      for(let i = 0; i < st.n; i++){
        const y = Rg.y0 + (Rg.y1 - Rg.y0) * (i + 0.5) / st.n;
        const lo = Rg.xLo(y), hi = Rg.xHi(y);
        if(!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
        ctPath(ctx, P, [{ x:lo, y }, { x:hi, y }], rgbCss(TH.text, 0.4), 1.1);
      }
      const ys = Rg.y0 + (Rg.y1 - Rg.y0) * st.s;
      const w = (Rg.y1 - Rg.y0) / st.n;
      ctFill(ctx, P, [{ x:Rg.xLo(ys), y:ys }, { x:Rg.xLo(ys + w), y:ys + w },
                      { x:Rg.xHi(ys + w), y:ys + w }, { x:Rg.xHi(ys), y:ys }], rgbCss(TH.warn, 0.6));
      ctParam(ctx, P, y => ({ x:Rg.xHi(y), y }), Rg.y0, Rg.y1, 300, rgbCss(TH.curl), 2.6);
      ctParam(ctx, P, y => ({ x:Rg.xLo(y), y }), Rg.y0, Rg.y1, 300, rgbCss(TH.pos), 2.6);
    }
    stageNote(ctx, 'the highlighted strip is one evaluation of the inner integral — the outer integral slides it across', W, H);
  },
  readout(st){
    const Rg = igRegCur(st);
    const F = igFnCur(st).f;
    const I1 = Rg.yLo ? igRegionIntegral(Rg, F, 'dydx') : NaN;
    const I2 = Rg.xLo ? igRegionIntegral(Rg, F, 'dxdy') : NaN;
    const IP = Rg.polar ? igRegionIntegral(Rg, F, 'polar') : NaN;
    const A1 = Rg.yLo ? igRegionIntegral(Rg, () => 1, 'dydx') : NaN;
    const A2 = Rg.xLo ? igRegionIntegral(Rg, () => 1, 'dxdy') : NaN;
    const AP = Rg.polar ? igRegionIntegral(Rg, () => 1, 'polar') : NaN;
    /* a Type II region has neither A1 nor AP, and letting the fallback stop at
       the polar one printed the literal word NaN into the area card */
    const area = Number.isFinite(A1) ? A1 : Number.isFinite(A2) ? A2 : AP;
    const val = st.order === 'polar' ? IP : st.order === 'dxdy' ? I2 : I1;
    /* an independent Monte Carlo check on the area, which knows nothing about
       the iterated limits — a genuine second opinion on the description */
    let inside = 0, N = 40000;
    let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const bx = Math.max(Math.abs(Rg.x0), Math.abs(Rg.x1)), by = Math.max(Math.abs(Rg.y0), Math.abs(Rg.y1));
    const bx0 = Math.min(Rg.x0, -0.001), by0 = Math.min(Rg.y0, -0.001);
    for(let i = 0; i < N; i++){
      const x = bx0 + (Rg.x1 - bx0) * rnd(), y = by0 + (Rg.y1 - by0) * rnd();
      if(igInRegion(Rg, x, y)) inside++;
    }
    const mcArea = inside / N * (Rg.x1 - bx0) * (Rg.y1 - by0);
    return `<div class="card tight"><div class="ttl">The region, described both ways</div>
      ${kv('outer variable range', st.order === 'polar'
        ? `θ from ${fmtNum(Rg.polar.t0, 4)} to ${fmtNum(Rg.polar.t1, 4)}`
        : st.order === 'dydx' ? `x from ${fmtNum(Rg.x0, 4)} to ${fmtNum(Rg.x1, 4)}`
        : `y from ${fmtNum(Rg.y0, 4)} to ${fmtNum(Rg.y1, 4)}`)}
      ${kv('inner limits', st.order === 'polar'
        ? 'r from r₀(θ) to r₁(θ)'
        : st.order === 'dydx' ? 'y from g₁(x) to g₂(x)' : 'x from h₁(y) to h₂(y)')}
      ${kv('is this description available?', (st.order === 'polar' ? !!Rg.polar : st.order === 'dydx' ? !!Rg.yLo : !!Rg.xLo) ? 'yes' : 'no — this region has no such description')}
    </div>
    <div class="card tight"><div class="ttl">∬ ${igFnCur(st).name.replace('f = ', '')} dA</div>
      ${Number.isFinite(I1) ? kv('dy then dx  (Type I)', fmtNum(I1, 9)) : ''}
      ${Number.isFinite(I2) ? kv('dx then dy  (Type II)', fmtNum(I2, 9)) : ''}
      ${Number.isFinite(IP) ? kv('r dr dθ  (polar)', fmtNum(IP, 9)) : ''}
      ${(Number.isFinite(I1) && Number.isFinite(I2)) ? kv('difference between the orders', fmtNum(Math.abs(I1 - I2), 3)) : ''}
      ${(Number.isFinite(IP) && Number.isFinite(I1)) ? kv('Cartesian vs polar', fmtNum(Math.abs(IP - I1), 3)) : ''}
      ${kv('currently selected', fmtNum(val, 9))}
      ${igFnCur(st).coords ? kv('you wrote the integrand in', igFnCur(st).coords.label) : ''}
      <p class="help">Every route above is computed independently, with its own nested quadrature and its
      own limit functions. They agree because the region is the same set — which is the entire content of
      changing the order of integration.${igFnCur(st).coords && igFnCur(st).coords.pol
        ? ' Your integrand is written in polar coordinates and every route still gets the same number, including the Cartesian ones — the coordinates a function is <i>written</i> in and the coordinates it is <i>integrated</i> in are independent choices.'
        : ''}</p>
    </div>
    ${Rg.fubini ? `<div class="card tight"><div class="ttl">Fubini, tested on your two descriptions</div>
      ${kv('area sweeping vertical strips', fmtNum(Rg.fubini.I, 10))}
      ${kv('area sweeping horizontal strips', fmtNum(Rg.fubini.II, 10))}
      ${kv('difference', Rg.fubini.gap.toExponential(3))}
      ${kv('refined at 8, 16, 32, 64 panels', Rg.converge.runs.map(r => r.gap.toExponential(1)).join('  →  '))}
      ${kv('verdict', Rg.converge.falling
          ? 'the gap shrinks as the quadrature is refined — the two are the same region, and the difference is arithmetic'
          : 'the gap does NOT shrink — these are descriptions of two different regions, and one of the four limits is wrong')}
      <p class="help">This is the only place the theorem can be tested rather than recited. Fubini says the
      two orders give the same number; the arithmetic says they give <i>nearly</i> the same number, and the
      difference between "nearly, and converging" and "nearly, and stuck" is the difference between a
      quadrature error and a mistake. Change one limit to something wrong and watch the bottom row change
      its mind.</p>
    </div>` : ''}
    <div class="card tight"><div class="ttl">Area of the region  (f = 1)</div>
      ${kv('by the iterated integral', fmtNum(area, 8))}
      ${kv('by Monte Carlo, 40 000 darts', fmtNum(mcArea, 6))}
      ${kv('difference', fmtNum(Math.abs(area - mcArea), 3))}
      <p class="help">The Monte Carlo estimate asks only "is this point inside?" — it never sees the limit
      functions at all. Its agreement with the iterated integral is therefore a real check that the limits
      describe the region you think they do, which is the single most common place to go wrong.</p>
    </div>`;
  },
  chip(st){
    const val = igRegionIntegral(igRegCur(st), igFnCur(st).f, st.order);
    return `<div class="k">∬ over ${igRegCur(st).name.split('  ')[0]}</div>
      <div style="color:var(--c-grad)">${fmtNum(val, 6)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the upper limit curve'], ['var(--c-pos)', 'the lower limit curve'],
                    ['var(--c-warn)', 'one strip — one evaluation of the inner integral']]; },
  dockLegend:true
};

/* ---- 6 · polar double integrals -------------------------------------------- */
STAGES.igPolar = {
  title:'Double integrals in polar',
  derive(st){
    const n = v => fmtNum(v, 8);
    if(st.demo === 'gauss'){
      const R = st.R;
      const disc = Math.PI * (1 - Math.exp(-R * R));
      return {
        title:'The Gaussian integral: squaring an impossible problem to make it easy',
        steps:[
          drvSay('the integral that has no antiderivative',
            'e^(−x²) has no elementary antiderivative, so the Fundamental Theorem is useless here. Yet the integral over the whole line has an exact closed form. The trick that gets it is one of the most celebrated in mathematics, and it works by making the problem apparently harder.'),
          drvStep('call the answer I, and square it',
            `${dv('I')}² ${dop('=')} (∫ ${dop('e')}^(−${dv('x')}²) d${dv('x')})(∫ ${dop('e')}^(−${dv('y')}²) d${dv('y')})`,
            'the second copy uses y as its dummy variable — legitimate, since the name is arbitrary'),
          drvStep('two independent integrals are one double integral',
            `${dv('I')}² ${dop('=')} ∬ ${dop('e')}^(−(${dv('x')}²${dop('+')}${dv('y')}²)) d${dv('A')}`,
            'because the integrand factors, Fubini runs in reverse'),
          drvSay('and now look at what the exponent has become',
            'x² + y² is r². The integrand is a function of distance from the origin alone — it has circular symmetry that was completely invisible in one dimension. That symmetry is what makes it tractable, and squaring the problem is what exposed it.'),
          drvStep('so change to polar, where the r dr dθ earns its keep',
            `${dv('I')}² ${dop('=')} ∫₀^(2π) ∫₀^∞ ${dop('e')}^(−${dv('r')}²) ${dv('r')} d${dv('r')} dθ`,
            'the Jacobian factor r is exactly what the substitution needs'),
          drvSay('the r is now doing the work, not merely tagging along',
            'Without it, ∫e^(−r²)dr is as impossible as the original. With it, the substitution u = r² gives du = 2r dr and the r cancels perfectly. The geometric factor that seemed like an annoyance in the previous stage is the entire reason this works.'),
          drvStep('the radial integral is now elementary',
            `∫₀^∞ ${dop('e')}^(−${dv('r')}²) ${dv('r')} d${dv('r')} ${dop('=')} ${dfrac('1', '2')}`,
            `truncated at R = ${n(R)} the disc integral is π(1 − e^(−R²)) = ${n(disc)}`),
          drvStep('and the angular one just gives 2π',
            `${dv('I')}² ${dop('=')} 2π ${dop('×')} ${dfrac('1', '2')} ${dop('=')} π ${dop('⇒')} ${dv('I')} ${dop('=')} √π`,
            `√π = ${n(Math.sqrt(Math.PI))}; the numerical value at this R is printed beside it`),
          drvSay('and this is where the normal distribution\'s constant comes from',
            'The 1/√(2π) in front of the normal density is not a fitted constant. It is precisely what is needed to make the density integrate to 1, and it is this integral, rescaled. Every appearance of √(2π) in statistics traces back to this one polar-coordinate trick.')
        ],
        note:'The square and the disc are compared deliberately. The integral over the square [−R, R]² has no closed form at finite R, while the disc of radius R does — π(1 − e^(−R²)) exactly. They converge to the same limit because the corners contribute nothing once R is large, and the panel shows that gap shrinking.'
      };
    }
    return {
      title:'Where the r in r dr dθ comes from',
      steps:[
        drvSay('the mistake this stage exists to prevent',
          'Writing dA = dr dθ is the single most common error in multivariable calculus, and it is not a slip of notation — it gives a numerically wrong answer. A polar "rectangle" is not a rectangle, and its area depends on how far out it sits.'),
        drvStep('take a small cell between r and r+Δr, θ and θ+Δθ',
          `inner arc ${dop('=')} ${dv('r')}Δθ , &nbsp; outer arc ${dop('=')} (${dv('r')}{+}Δ${dv('r')})Δθ`,
          `Δr = ${n(st.R / st.nr)}, Δθ = ${n(2 * Math.PI / st.nt)}`),
        drvSay('the two ends have different lengths, and that is the whole point',
          'Arc length is rΔθ, so a cell near the rim is far wider than one of the same angular width near the centre. At the origin the cell degenerates to a point. Any formula for dA has to know how far out it is, and dr dθ does not.'),
        drvStep('so the cell area is the average arc times the radial width',
          `Δ${dv('A')} ${dop('=')} ${dv('r')} Δ${dv('r')} Δθ ${dop('+')} ${dfrac('1', '2')}(Δ${dv('r')})²Δθ`,
          'exactly, from the difference of two circular sectors'),
        drvStep('the second term vanishes faster, so in the limit',
          `d${dv('A')} ${dop('=')} ${dv('r')} d${dv('r')} dθ`,
          'it is second order in Δr, and dies relative to the first term'),
        drvSay('and the same factor is the Jacobian determinant',
          'Computing ∂(x,y)/∂(r,θ) gives exactly r. This is not a coincidence dressed up as a theorem — the Jacobian is defined to be the local area-scaling factor of a coordinate change, and here we have measured that factor geometrically. The determinant is the general machinery; the stretched cell is what it means.'),
        drvStep('check it by summing the cells against a known area',
          `Σ ${dv('r')} Δ${dv('r')} Δθ ${dop('→')} π${dv('R')}²`,
          `with the r: sums towards ${n(Math.PI * st.R * st.R)}; without it, the panel shows how badly wrong the total goes`),
        drvSay('the missing r is the most common error in the subject, and it has a shape',
          'Leaving it out does not produce a random wrong number: it weights every cell as though it had the same area, so the region near the origin is over-counted and the rim under-counted. On a disc the answer comes out as 2πR rather than πR² — a perimeter where an area was asked for, and the dimensions are wrong. That is worth knowing as a check: if a polar integral returns something with the wrong units, the r is what is missing.'),
        drvSay('and the reason to change coordinates at all is not the integrand',
          'It is the <b>limits</b>. A disc in Cartesian coordinates has limits that are functions with square roots in them; in polar coordinates it is 0 ≤ r ≤ R, 0 ≤ θ ≤ 2π — two constants and two constants. The r dr dθ is the price paid for that, and it is nearly always worth paying. The rule of thumb is to match the coordinates to the boundary rather than to the function, because an awkward integrand is a nuisance and awkward limits are a different problem altogether.'),
        drvSay('the one integral that made this famous',
          '∫e^(−x²)dx over the whole line has no antiderivative in elementary functions and cannot be done as written. Square it, read the product as a double integral over the plane, and switch to polar: the r that appears is exactly what the substitution u = r² needs, and the whole thing collapses to √π in three lines. The Gaussian normalisation in the probability wing, and the ground state of the quantum harmonic oscillator, both rest on that one change of coordinates.')
      ],
      note:'The panel deliberately computes the sum both with and without the r factor and prints the error of the wrong version. Seeing that it is not a small correction but a completely different number is the most reliable way to stop making the mistake.'
    };
  },
  enter(st, o){
    st.demo = o.demo || 'element';
    st.nr = 7; st.nt = 12;
    st.R = 2;
    st.gauss = 3;
  },
  controls(){
    const st = ST;
    return ctSeg('igPD', st.demo, [['element', 'where r dr dθ comes from'], ['gauss', 'the Gaussian integral']]) +
      (st.demo === 'element'
        ? ctlRow('r divisions', ctlSlider('igPnr', 2, 24, 1, st.nr)) +
          ctlRow('θ divisions', ctlSlider('igPnt', 3, 48, 1, st.nt)) +
          ctlRow('outer radius', ctlSlider('igPR', 0.6, 3, 0.05, st.R))
        : ctlRow('cut-off R', ctlSlider('igPg', 0.5, 5, 0.05, st.gauss))) +
      `<p class="help">${st.demo === 'element'
        ? 'A polar "rectangle" — Δr by Δθ — is not a rectangle. Its two curved sides have different lengths: the outer arc is (r+Δr)Δθ and the inner one is rΔθ. Its exact area is <b>½((r+Δr)² − r²)Δθ = r̄·Δr·Δθ</b>, where r̄ is the <i>average</i> radius. In the limit that is <b>r dr dθ</b>, and the extra r is not a fudge factor: it is the plain fact that the cells get bigger as you move out. The panel measures the cells and checks it.'
        : 'The most famous integral in mathematics has no elementary antiderivative in one dimension — and becomes trivial in two. Square it, read the product as a double integral over the whole plane, switch to polar coordinates, and the stray <b>r</b> from the area element is <i>exactly</i> what the substitution u = r² needs. The answer is √π, and the readout does the whole computation numerically at the same time.'}</p>
      <p class="help">${st.demo === 'element'
        ? 'Watch the outer cells: at twice the radius each cell has twice the area for the same Δr and Δθ. The colour is the exact area of each cell, and the panel compares the total against πR².'
        : 'This is Poisson\'s trick, and it is the standard argument that the normal distribution integrates to 1. Every appearance of √(2π) in statistics traces back to this one change of variables.'}</p>`;
  },
  wire(){
    ctWireSeg('igPD', v => { ST.demo = v; });
    wireSlider('igPnr', () => ST.nr, v => { ST.nr = Math.round(v); }, v => String(Math.round(v)));
    wireSlider('igPnt', () => ST.nt, v => { ST.nt = Math.round(v); }, v => String(Math.round(v)));
    wireSlider('igPR', () => ST.R, v => { ST.R = v; }, v => fmtNum(+v, 3));
    wireSlider('igPg', () => ST.gauss, v => { ST.gauss = v; }, v => fmtNum(+v, 3));
  },
  frame(st, dt, ctx, W, H){
    if(st.demo === 'gauss') return this.frameGauss(st, dt, ctx, W, H);
    const P = ctBox(W, H, 0, 0, st.R * 1.2);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, 'the polar grid — every cell has area r̄ Δr Δθ');
    const dr = st.R / st.nr, dth = 2 * Math.PI / st.nt;
    let maxA = 0;
    for(let i = 0; i < st.nr; i++) maxA = Math.max(maxA, ((i + 1) * dr) * dr * dth);
    for(let i = 0; i < st.nr; i++) for(let j = 0; j < st.nt; j++){
      const r0 = i * dr, r1 = r0 + dr, t0 = j * dth, t1 = t0 + dth;
      const A = 0.5 * (r1 * r1 - r0 * r0) * dth;
      const pts = [];
      for(let k = 0; k <= 8; k++){ const t = t0 + (t1 - t0) * k / 8; pts.push(pcPolarPt(r0, t)); }
      for(let k = 8; k >= 0; k--){ const t = t0 + (t1 - t0) * k / 8; pts.push(pcPolarPt(r1, t)); }
      ctFill(ctx, P, pts, rgbCss(rampSeq(A / maxA), 0.8));
      ctPath(ctx, P, pts.concat([pts[0]]), rgbCss(TH.bg, 0.7), 0.9);
    }
    /* one cell picked out, with its dimensions written on it */
    const i0 = Math.max(1, st.nr - 2), r0 = i0 * dr, r1 = r0 + dr;
    const t0 = 0.4, t1 = t0 + dth;
    const hi = [];
    for(let k = 0; k <= 10; k++){ const t = t0 + (t1 - t0) * k / 10; hi.push(pcPolarPt(r0, t)); }
    for(let k = 10; k >= 0; k--){ const t = t0 + (t1 - t0) * k / 10; hi.push(pcPolarPt(r1, t)); }
    ctPath(ctx, P, hi.concat([hi[0]]), rgbCss(TH.warn), 2.6);
    const mid = pcPolarPt((r0 + r1) / 2, (t0 + t1) / 2);
    ctText(ctx, P.X(mid.x) + 10, P.Y(mid.y),
      `r Δθ × Δr = ${fmtNum(0.5 * (r1 * r1 - r0 * r0) * dth, 4)}`,
      rgbCss(TH.warn), '600 11px ' + FONT_MONO);
    stageNote(ctx, 'cells at twice the radius have twice the area — that proportionality is the r in r dr dθ', W, H);
  },
  frameGauss(st, dt, ctx, W, H){
    const R0 = st.gauss;
    const P = ctBox(W, H, 0, 0, R0 * 1.15, { r:W * 0.46 });
    const f = (x, y) => Math.exp(-x * x - y * y);
    ctHeat(ctx, P, f, 0, 1, 70, 0.85);
    for(const L of [0.05, 0.2, 0.4, 0.6, 0.8, 0.95]) ctContour(ctx, P, f, L, rgbCss(TH.text, 0.4), 1.2, 140);
    ctGrid(ctx, P, undefined, true);
    ctFrame(ctx, P, 'e^(−x²−y²) over the disc of radius R');
    ctx.strokeStyle = rgbCss(TH.warn); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), R0 * P.u, 0, 6.2832); ctx.stroke();
    /* the one-dimensional curve, alongside */
    const x0 = W * 0.56;
    const Q = mkPlot(x0 + 48, 56, W - x0 - 90, H - 150, -R0, R0, -0.08, 1.12);
    plotFrame(ctx, Q, 'x', 'e^(−x²)', 'the one-dimensional integrand, whose area is √π');
    plotZeroY(ctx, Q); plotTicksX(ctx, Q, [-R0, 0, R0], v => fmtNum(v, 3));
    plotCurve(ctx, Q, x => Math.exp(-x * x), 400, rgbCss(TH.grad), 2.4,
      rgbCss(TH.grad, 0.22));
    plotCurve(ctx, Q, x => Math.exp(-x * x), 400, rgbCss(TH.grad), 2.4);
    stageNote(ctx, 'the volume under the two-dimensional bell is the square of the area under the one-dimensional one', W, H);
  },
  readout(st){
    if(st.demo === 'gauss'){
      const R0 = st.gauss;
      const disc = nqDoublePolar((x, y) => Math.exp(-x * x - y * y), 0, 2 * Math.PI, () => 0, () => R0, 5, 24);
      const exactDisc = Math.PI * (1 - Math.exp(-R0 * R0));
      const line = nqAdaptive(x => Math.exp(-x * x), -R0, R0, 1e-13);
      const square = nqDoubleRect((x, y) => Math.exp(-x * x - y * y), -R0, R0, -R0, R0, 5, 24);
      return `<div class="card tight"><div class="ttl">The trick, step by step</div>
        ${kv('I = ∫₋ᴿᴿ e^(−x²) dx', fmtNum(line, 9))}
        ${kv('I²', fmtNum(line * line, 9))}
        ${kv('∬ over the square [−R, R]²', fmtNum(square, 9))}
        ${kv('difference', fmtNum(Math.abs(line * line - square), 3))}
        <p class="help">The first equality is the whole idea: <b>I² = (∫e^(−x²)dx)(∫e^(−y²)dy) =
        ∬e^(−x²−y²)dA</b>. A product of two single integrals in different variables <i>is</i> a double
        integral — which is Fubini read backwards.</p>
      </div>
      <div class="card tight"><div class="ttl">Now in polar coordinates</div>
        ${kv('∬ over the disc of radius R', fmtNum(disc, 9))}
        ${kv('π(1 − e^(−R²)), in closed form', fmtNum(exactDisc, 9))}
        ${kv('difference', fmtNum(Math.abs(disc - exactDisc), 3))}
        ${kv('as R → ∞', fmtNum(Math.PI, 9))}
        ${kv('so I = √π', fmtNum(Math.sqrt(Math.PI), 9))}
        ${kv('the numerical I at this R', fmtNum(line, 9))}
        <p class="help">In polar coordinates the integrand becomes <b>e^(−r²)·r dr dθ</b>, and the r that
        the area element supplied is exactly the factor that makes <b>u = r²</b> work: the whole thing
        collapses to <b>2π·½∫e^(−u)du</b>. Without the r there is no elementary antiderivative in polar
        coordinates either — the change of variables is not a trick of notation, it genuinely changes the
        integrand.</p>
      </div>
      <div class="card tight"><div class="ttl">Where this shows up</div>
        ${kv('∫₋∞^∞ e^(−x²) dx', fmtNum(Math.sqrt(Math.PI), 10))}
        ${kv('the normal distribution constant 1/√(2π)', fmtNum(1 / Math.sqrt(2 * Math.PI), 10))}
        ${kv('∫₋∞^∞ e^(−x²/2) dx', fmtNum(Math.sqrt(2 * Math.PI), 10))}
        <p class="help">Every normalisation constant in statistics, every Gaussian wave packet in the
        quantum wing, and every path integral in field theory rests on this one evaluation.</p>
      </div>`;
    }
    const dr = st.R / st.nr, dth = 2 * Math.PI / st.nt;
    const rows = [];
    for(const i of [0, Math.floor(st.nr / 2), st.nr - 1]){
      const r0 = i * dr, r1 = r0 + dr;
      const exact = 0.5 * (r1 * r1 - r0 * r0) * dth;
      rows.push(kv(`cell at r ≈ ${fmtNum((r0 + r1) / 2, 3)}`,
        `${fmtNum(exact, 6)}   (r̄ΔrΔθ = ${fmtNum(((r0 + r1) / 2) * dr * dth, 6)})`));
    }
    let total = 0;
    for(let i = 0; i < st.nr; i++) total += st.nt * 0.5 * (Math.pow((i + 1) * dr, 2) - Math.pow(i * dr, 2)) * dth;
    const naive = st.nr * st.nt * dr * dth;
    return `<div class="card tight"><div class="ttl">Three cells, measured</div>
      ${rows.join('')}
      ${kv('Δr', fmtNum(dr, 6))}${kv('Δθ', fmtNum(dth, 6))}
      <p class="help">The exact area of a polar cell is <b>½(r₁² − r₀²)Δθ</b>, and that factors as
      <b>((r₀+r₁)/2)·Δr·Δθ</b> — the mean radius, exactly, with no approximation. As Δr → 0 the mean
      radius becomes r, and the area element is r dr dθ.</p>
    </div>
    <div class="card tight"><div class="ttl">Does it add up?</div>
      ${kv('sum of all cell areas', fmtNum(total, 8))}
      ${kv('πR²', fmtNum(Math.PI * st.R * st.R, 8))}
      ${kv('difference', fmtNum(Math.abs(total - Math.PI * st.R * st.R), 3))}
      ${kv('what you would get without the r', fmtNum(naive, 6))}
      ${kv('that error', fmtNum(Math.abs(naive - Math.PI * st.R * st.R), 4))}
      <p class="help">The cells tile the disc exactly, so their areas must total πR² — and they do, at
      every grid resolution, because the formula for a cell's area is exact rather than a first-order
      approximation. Dropping the r gives the number in the last-but-one row, which is not the area of
      anything.</p>
    </div>
    <div class="card tight"><div class="ttl">Two integrals that need this</div>
      ${kv('area of the disc, ∬ r dr dθ', fmtNum(nqDoublePolar(() => 1, 0, 2 * Math.PI, () => 0, () => st.R, 5, 20), 8))}
      ${kv('∬ (x²+y²) dA over it', fmtNum(nqDoublePolar((x, y) => x * x + y * y, 0, 2 * Math.PI, () => 0, () => st.R, 5, 20), 8))}
      ${kv('the closed form πR⁴/2', fmtNum(Math.PI * Math.pow(st.R, 4) / 2, 8))}
      <p class="help">In Cartesian coordinates the second one needs a square-root limit and an awkward
      substitution. In polar coordinates it is <b>∫₀<sup>2π</sup>∫₀<sup>R</sup> r²·r dr dθ</b> — a monomial. That is what
      choosing the right coordinates buys.</p>
    </div>`;
  },
  chip(st){
    if(st.demo === 'gauss') return `<div class="k">Gaussian</div>
      <div style="color:var(--c-grad)">√π = ${fmtNum(Math.sqrt(Math.PI), 6)}</div>`;
    return `<div class="k">polar cells</div>
      <div style="color:var(--c-warn)">${st.nr} × ${st.nt}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'one cell, picked out'], ['var(--c-grad)', 'cell area — bigger further out']]; },
  dockLegend:true
};

/* ---- 7 · triple integrals -------------------------------------------------- */
